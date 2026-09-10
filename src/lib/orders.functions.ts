import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { SITE } from "@/lib/site-config";
import type { OrderStatus } from "@/lib/orders";

const CART_COOKIE = "sh_cart_sid";

export type { OrderStatus };

async function getOptionalUserId(): Promise<string | null> {
  const auth = getRequestHeader("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    const client = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await client.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    return data.claims.sub;
  } catch {
    return null;
  }
}

async function isStaff(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return !!data?.some((r) => r.role === "admin" || r.role === "manager");
}

async function loadSettings() {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("key,value")
    .in("key", ["delivery_fee_egp", "min_order_egp"]);
  const m = new Map((data ?? []).map((r) => [r.key, r.value as any]));
  return {
    deliveryFee: Number(m.get("delivery_fee_egp") ?? SITE.deliveryFeeEgp),
    minOrder: Number(m.get("min_order_egp") ?? SITE.minOrderEgp),
  };
}

const PHONE_RE = /^(?:\+?20)?0?1[0125]\d{8}$/;

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "الاسم قصير").max(80),
  customer_phone: z
    .string()
    .trim()
    .regex(PHONE_RE, "رقم هاتف غير صالح"),
  customer_address: z.string().trim().min(5, "العنوان قصير").max(300),
  customer_city: z.string().trim().min(2).max(60).default("الفيوم"),
  notes: z.string().trim().max(500).optional().nullable(),
});

// ============== CREATE ORDER ==============
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const userId = await getOptionalUserId();
    const sessionId = getCookie(CART_COOKIE) ?? null;

    // Find active cart
    let cart: { id: string } | null = null;
    if (userId) {
      const { data: c } = await supabaseAdmin
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();
      cart = c ?? null;
    }
    if (!cart && sessionId) {
      const { data: c } = await supabaseAdmin
        .from("carts")
        .select("id")
        .eq("session_id", sessionId)
        .eq("status", "active")
        .maybeSingle();
      cart = c ?? null;
    }
    if (!cart) throw new Error("السلة فارغة");

    const { data: items, error: itemsErr } = await supabaseAdmin
      .from("cart_items")
      .select(
        "id,product_id,variant_id,weight_grams,quantity,products(name_ar,is_active,is_weight_based,price_per_kg,stock,base_price),product_variants(name_ar,price,stock,is_active)",
      )
      .eq("cart_id", cart.id);
    if (itemsErr) throw new Error(itemsErr.message);
    if (!items || items.length === 0) throw new Error("السلة فارغة");

    // Validate + compute snapshot
    const snapshot: Array<{
      product_id: string;
      variant_id: string | null;
      weight_grams: number | null;
      quantity: number;
      unit_price: number;
      line_total: number;
      product_name: string;
      variant_name: string | null;
      is_weight_based: boolean;
    }> = [];
    let subtotal = 0;

    for (const row of items) {
      const product = (row as any).products;
      const variant = (row as any).product_variants;
      if (!product || !product.is_active) throw new Error("يحتوي الطلب على منتج غير متوفر");

      let unit_price = 0;
      let variant_name: string | null = null;
      let availableUnits = 0;

      if (variant) {
        if (!variant.is_active || variant.stock <= 0)
          throw new Error(`غير متوفر: ${product.name_ar}`);
        unit_price = Number(variant.price);
        variant_name = variant.name_ar;
        availableUnits = variant.stock;
      } else if (product.is_weight_based) {
        const g = row.weight_grams ?? 0;
        if (!g) throw new Error("اختيار الوزن مطلوب");
        if (!product.price_per_kg) throw new Error("سعر غير محدد");
        if (product.stock <= 0) throw new Error(`غير متوفر: ${product.name_ar}`);
        unit_price = +((Number(product.price_per_kg) * g) / 1000).toFixed(2);
        variant_name = g >= 1000 ? `${g / 1000} كجم` : `${g} جم`;
        availableUnits = Math.floor((product.stock * 1000) / g);
      } else {
        if (product.stock <= 0) throw new Error(`غير متوفر: ${product.name_ar}`);
        unit_price = Number(product.base_price);
        availableUnits = product.stock;
      }

      if (row.quantity > availableUnits)
        throw new Error(`الكمية المتاحة من ${product.name_ar}: ${availableUnits}`);

      const line_total = +(unit_price * row.quantity).toFixed(2);
      subtotal += line_total;
      snapshot.push({
        product_id: row.product_id,
        variant_id: row.variant_id,
        weight_grams: row.weight_grams,
        quantity: row.quantity,
        unit_price,
        line_total,
        product_name: product.name_ar,
        variant_name,
        is_weight_based: !!product.is_weight_based,
      });
    }

    subtotal = +subtotal.toFixed(2);

    const settings = await loadSettings();
    if (subtotal < settings.minOrder)
      throw new Error(`الحد الأدنى للطلب ${settings.minOrder} ج.م`);

    const delivery_fee = settings.deliveryFee; // Fixed 20 EGP per requirements
    const total = +(subtotal + delivery_fee).toFixed(2);

    // Generate order number
    const { data: numData, error: numErr } = await supabaseAdmin.rpc("generate_order_number");
    if (numErr) throw new Error(numErr.message);
    const order_number = numData as unknown as string;

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number,
        user_id: userId,
        session_id: userId ? null : sessionId,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_address: data.customer_address,
        customer_city: data.customer_city,
        notes: data.notes ?? null,
        status: "placed",
        subtotal,
        delivery_fee,
        total,
        stock_deducted: false,
      })
      .select("id,order_number")
      .single();
    if (orderErr) throw new Error(orderErr.message);

    const { error: insertErr } = await supabaseAdmin.from("order_items").insert(
      snapshot.map((s) => ({ ...s, order_id: order.id })),
    );
    if (insertErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(insertErr.message);
    }

    // Empty the cart
    await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id);
    await supabaseAdmin.from("carts").update({ status: "ordered" }).eq("id", cart.id);

    return { id: order.id, order_number: order.order_number, total };
  });

// ============== READ ==============
export type OrderSummary = {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  delivery_fee: number;
  created_at: string;
  item_count: number;
};

export const listMyOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderSummary[]> => {
    const userId = await getOptionalUserId();
    const sessionId = getCookie(CART_COOKIE) ?? null;

    let query = supabaseAdmin
      .from("orders")
      .select("id,order_number,status,total,subtotal,delivery_fee,created_at,order_items(id)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (userId) query = query.eq("user_id", userId);
    else if (sessionId) query = query.eq("session_id", sessionId);
    else return [];

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      total: Number(o.total),
      subtotal: Number(o.subtotal),
      delivery_fee: Number(o.delivery_fee),
      created_at: o.created_at,
      item_count: o.order_items?.length ?? 0,
    }));
  },
);

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
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
      (userId && order.user_id === userId) ||
      (!userId && sessionId && order.session_id === sessionId);
    if (!staff && !owns) throw new Error("غير مصرح");

    return order;
  });

// ============== CUSTOMER MUTATIONS ==============
async function loadOwnedOrder(orderId: string) {
  const userId = await getOptionalUserId();
  const sessionId = getCookie(CART_COOKIE) ?? null;
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("الطلب غير موجود");
  const owns =
    (userId && order.user_id === userId) ||
    (!userId && sessionId && order.session_id === sessionId);
  if (!owns) throw new Error("غير مصرح");
  return order;
}

export const cancelMyOrder = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const order = await loadOwnedOrder(data.id);
    if (order.status !== "placed")
      throw new Error("لا يمكن إلغاء الطلب في هذه المرحلة");

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", order.id);
    if (error) throw new Error(error.message);

    if (order.stock_deducted) {
      await supabaseAdmin.rpc("restore_order_stock", { p_order_id: order.id });
    }
    return { ok: true as const };
  });

const updateOrderSchema = z.object({
  id: z.string().uuid(),
  customer_name: z.string().trim().min(2).max(80),
  customer_phone: z.string().trim().regex(PHONE_RE, "رقم هاتف غير صالح"),
  customer_address: z.string().trim().min(5).max(300),
  customer_city: z.string().trim().min(2).max(60),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const updateMyOrder = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => updateOrderSchema.parse(i))
  .handler(async ({ data }) => {
    const order = await loadOwnedOrder(data.id);
    if (order.status !== "placed")
      throw new Error("لا يمكن تعديل الطلب في هذه المرحلة");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_address: data.customer_address,
        customer_city: data.customer_city,
        notes: data.notes ?? null,
      })
      .eq("id", order.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ============== ADMIN ==============
async function requireStaff(): Promise<string> {
  const userId = await getOptionalUserId();
  if (!userId) throw new Error("غير مصرح");
  if (!(await isStaff(userId))) throw new Error("غير مصرح");
  return userId;
}

export const adminListOrders = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z
      .object({ status: z.string().optional() })
      .parse(i ?? {}),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    let q = supabaseAdmin
      .from("orders")
      .select("id,order_number,status,total,customer_name,customer_phone,created_at,order_items(id)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as OrderStatus);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((o: any) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status as OrderStatus,
      total: Number(o.total),
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      created_at: o.created_at,
      item_count: o.order_items?.length ?? 0,
    }));
  });

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "placed",
          "preparing",
          "out_for_delivery",
          "delivered",
          "cancelled",
        ]),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    const { data: order, error: loadErr } = await supabaseAdmin
      .from("orders")
      .select("id,status,stock_deducted")
      .eq("id", data.id)
      .maybeSingle();
    if (loadErr) throw new Error(loadErr.message);
    if (!order) throw new Error("الطلب غير موجود");

    const allowed = ALLOWED_TRANSITIONS[order.status as OrderStatus];
    if (!allowed.includes(data.status))
      throw new Error("هذا التغيير في الحالة غير مسموح");

    const patch: Database["public"]["Tables"]["orders"]["Update"] = {
      status: data.status,
    };
    if (data.status === "delivered") patch.delivered_at = new Date().toISOString();
    if (data.status === "cancelled") patch.cancelled_at = new Date().toISOString();

    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    // Stock side-effects
    if (data.status === "preparing" && !order.stock_deducted) {
      await supabaseAdmin.rpc("apply_order_stock", { p_order_id: order.id });
    } else if (data.status === "cancelled" && order.stock_deducted) {
      await supabaseAdmin.rpc("restore_order_stock", { p_order_id: order.id });
    }

    return { ok: true as const };
  });

// ============== SETTINGS (admin) ==============
const settingsSchema = z.object({
  min_order_egp: z.number().min(0).max(10000),
  delivery_fee_egp: z.number().min(0).max(10000),
});

export const adminUpdateOrderSettings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => settingsSchema.parse(i))
  .handler(async ({ data }) => {
    await requireStaff();
    const rows = [
      { key: "min_order_egp", value: data.min_order_egp, is_public: true },
      { key: "delivery_fee_egp", value: data.delivery_fee_egp, is_public: true },
    ];
    for (const r of rows) {
      const { error } = await supabaseAdmin
        .from("settings")
        .upsert(r, { onConflict: "key" });
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const getOrderSettings = createServerFn({ method: "GET" }).handler(async () => {
  return await loadSettings();
});
