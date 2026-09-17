import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";

import { SITE } from "@/lib/site-config";
import type {
  InvoiceAudience,
  InvoiceDocument,
  InvoiceLine,
  InvoiceSeller,
} from "@/lib/invoice";
import type { OrderStatus } from "@/lib/orders";

const CART_COOKIE = "sh_cart_sid";

export type InvoicePayload = {
  audience: InvoiceAudience;
  invoice: InvoiceDocument;
};

/**
 * Single authorized entry point for every invoice surface.
 * Authorization is enforced here, server-side: staff may read any order,
 * everyone else only their own (by user id, or guest cart session cookie).
 */
export const getInvoice = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }): Promise<InvoicePayload> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getOptionalUserId, isStaff } = await import("@/lib/access.server");
    const { buildSellerFromSettings, sellerFromSnapshot } = await import(
      "@/lib/store-profile.server"
    );

    const userId = await getOptionalUserId();
    const sessionId = getCookie(CART_COOKIE) ?? null;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*,order_items(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("الطلب غير موجود");

    const staff = userId ? await isStaff(userId) : false;
    const owns =
      (!!userId && order.user_id === userId) ||
      (!userId && !!sessionId && order.session_id === sessionId);
    if (!staff && !owns) throw new Error("غير مصرح");

    const snapshot = (order as any).seller_snapshot;
    const seller: InvoiceSeller = snapshot
      ? sellerFromSnapshot(snapshot)
      : await buildSellerFromSettings();

    const lines: InvoiceLine[] = ((order as any).order_items ?? [])
      .slice()
      .sort((a: any, b: any) =>
        String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")),
      )
      .map((it: any) => ({
        id: it.id,
        name: it.product_name,
        variant: it.variant_name ?? null,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        lineTotal: Number(it.line_total),
      }));

    const invoice: InvoiceDocument = {
      orderId: order.id,
      orderNumber: order.order_number,
      createdAt: order.created_at,
      status: order.status as OrderStatus,
      paymentMethod: (order as any).payment_method ?? "cod",
      sellerIsSnapshot: !!snapshot,
      seller,
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        address: order.customer_address,
        city: order.customer_city,
        // Customer notes belong to the order, not internal ops — safe both ways.
        notes: order.notes ?? null,
      },
      lines,
      totals: {
        subtotal: Number(order.subtotal),
        discount: Number((order as any).discount ?? 0),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
      },
    };

    // Fall back to the built-in store name if settings were never filled in.
    if (!invoice.seller.name) invoice.seller.name = SITE.nameAr;

    return { audience: staff ? "admin" : "customer", invoice };
  });
