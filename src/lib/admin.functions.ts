import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

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

async function requireStaff(): Promise<string> {
  const userId = await getOptionalUserId();
  if (!userId) throw new Error("غير مصرح");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const ok = data?.some((r) => r.role === "admin" || r.role === "manager");
  if (!ok) throw new Error("غير مصرح");
  return userId;
}

// =========== ANALYTICS ===========
const REVENUE_STATUSES = ["preparing", "out_for_delivery", "delivered"] as const;

export type DashboardOverview = {
  totals: {
    revenueAllTime: number;
    revenue30d: number;
    revenueToday: number;
    orders30d: number;
    ordersToday: number;
    ordersPending: number;
    customers: number;
    lowStockCount: number;
  };
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  topProducts: Array<{
    product_id: string;
    name: string;
    units: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    name: string;
    phone: string;
    orders: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
  }>;
};

export const getDashboardOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardOverview> => {
    await requireStaff();

    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // All non-cancelled orders for revenue figures
    const { data: revOrders } = await supabaseAdmin
      .from("orders")
      .select("id,total,status,created_at,customer_name,customer_phone,user_id")
      .in("status", [...REVENUE_STATUSES]);

    const revenueAllTime = (revOrders ?? []).reduce(
      (s, o) => s + Number(o.total),
      0,
    );

    const recent = (revOrders ?? []).filter(
      (o) => new Date(o.created_at) >= since30,
    );
    const revenue30d = recent.reduce((s, o) => s + Number(o.total), 0);
    const todayOrders = (revOrders ?? []).filter(
      (o) => new Date(o.created_at) >= startOfToday,
    );
    const revenueToday = todayOrders.reduce((s, o) => s + Number(o.total), 0);

    // Daily revenue last 30 days
    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }
    for (const o of recent) {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) {
        b.revenue += Number(o.total);
        b.orders += 1;
      }
    }
    const dailyRevenue = Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      revenue: +v.revenue.toFixed(2),
      orders: v.orders,
    }));

    // Status breakdown (all orders)
    const { data: allStatuses } = await supabaseAdmin
      .from("orders")
      .select("status");
    const statusMap = new Map<string, number>();
    for (const r of allStatuses ?? []) {
      statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
    }
    const statusBreakdown = Array.from(statusMap.entries()).map(
      ([status, count]) => ({ status, count }),
    );

    const ordersPending =
      (statusMap.get("placed") ?? 0) +
      (statusMap.get("preparing") ?? 0) +
      (statusMap.get("out_for_delivery") ?? 0);

    // Top products (last 30d, non-cancelled)
    const recentIds = recent.map((o) => o.id);
    let topProducts: DashboardOverview["topProducts"] = [];
    if (recentIds.length) {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("product_id,product_name,quantity,line_total,order_id")
        .in("order_id", recentIds);
      const pm = new Map<
        string,
        { name: string; units: number; revenue: number }
      >();
      for (const it of items ?? []) {
        const cur = pm.get(it.product_id) ?? {
          name: it.product_name,
          units: 0,
          revenue: 0,
        };
        cur.units += it.quantity;
        cur.revenue += Number(it.line_total);
        pm.set(it.product_id, cur);
      }
      topProducts = Array.from(pm.entries())
        .map(([product_id, v]) => ({
          product_id,
          name: v.name,
          units: v.units,
          revenue: +v.revenue.toFixed(2),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }

    // Top customers (group by phone)
    const cm = new Map<
      string,
      { name: string; phone: string; orders: number; revenue: number }
    >();
    for (const o of revOrders ?? []) {
      const key = o.customer_phone ?? "";
      const cur = cm.get(key) ?? {
        name: o.customer_name,
        phone: o.customer_phone,
        orders: 0,
        revenue: 0,
      };
      cur.orders += 1;
      cur.revenue += Number(o.total);
      cm.set(key, cur);
    }
    const topCustomers = Array.from(cm.values())
      .map((c) => ({ ...c, revenue: +c.revenue.toFixed(2) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent orders
    const { data: recentList } = await supabaseAdmin
      .from("orders")
      .select("id,order_number,customer_name,total,status,created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    // Customers count
    const { count: customers } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // Low stock: products with stock <= 5 or variants with stock <= 5
    const { count: lowProducts } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .lte("stock", 5)
      .eq("is_active", true);
    const { count: lowVariants } = await supabaseAdmin
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .lte("stock", 5)
      .eq("is_active", true);

    return {
      totals: {
        revenueAllTime: +revenueAllTime.toFixed(2),
        revenue30d: +revenue30d.toFixed(2),
        revenueToday: +revenueToday.toFixed(2),
        orders30d: recent.length,
        ordersToday: todayOrders.length,
        ordersPending,
        customers: customers ?? 0,
        lowStockCount: (lowProducts ?? 0) + (lowVariants ?? 0),
      },
      dailyRevenue,
      statusBreakdown,
      topProducts,
      topCustomers,
      recentOrders: (recentList ?? []).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer_name,
        total: Number(o.total),
        status: o.status,
        created_at: o.created_at,
      })),
    };
  },
);

// =========== INVENTORY ===========
export type InventoryRow = {
  kind: "product" | "variant";
  id: string;
  product_id: string;
  product_name: string;
  variant_name: string | null;
  category_name: string | null;
  stock: number;
  is_weight_based: boolean;
  price: number;
  is_active: boolean;
  image_url: string | null;
};

export const listInventory = createServerFn({ method: "GET" }).handler(
  async (): Promise<InventoryRow[]> => {
    await requireStaff();

    const { data: products } = await supabaseAdmin
      .from("products")
      .select(
        "id,name_ar,stock,is_active,is_weight_based,base_price,price_per_kg,image_url,category_id,categories(name_ar)",
      )
      .order("stock", { ascending: true });

    const { data: variants } = await supabaseAdmin
      .from("product_variants")
      .select(
        "id,product_id,name_ar,stock,is_active,price,products(name_ar,is_weight_based,image_url,categories(name_ar))",
      )
      .order("stock", { ascending: true });

    const rows: InventoryRow[] = [];

    for (const p of products ?? []) {
      rows.push({
        kind: "product",
        id: p.id,
        product_id: p.id,
        product_name: p.name_ar,
        variant_name: null,
        category_name: (p as any).categories?.name_ar ?? null,
        stock: p.stock,
        is_weight_based: p.is_weight_based,
        price: Number(p.is_weight_based ? p.price_per_kg ?? 0 : p.base_price),
        is_active: p.is_active,
        image_url: p.image_url,
      });
    }
    for (const v of variants ?? []) {
      rows.push({
        kind: "variant",
        id: v.id,
        product_id: v.product_id,
        product_name: (v as any).products?.name_ar ?? "",
        variant_name: v.name_ar,
        category_name: (v as any).products?.categories?.name_ar ?? null,
        stock: v.stock,
        is_weight_based: (v as any).products?.is_weight_based ?? false,
        price: Number(v.price),
        is_active: v.is_active,
        image_url: (v as any).products?.image_url ?? null,
      });
    }
    return rows.sort((a, b) => a.stock - b.stock);
  },
);

const updateStockSchema = z.object({
  kind: z.enum(["product", "variant"]),
  id: z.string().uuid(),
  stock: z.number().int().min(0).max(1_000_000),
});

export const updateStock = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => updateStockSchema.parse(i))
  .handler(async ({ data }) => {
    await requireStaff();
    const table = data.kind === "product" ? "products" : "product_variants";
    const { error } = await supabaseAdmin
      .from(table)
      .update({ stock: data.stock })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// =========== CONTACT SETTINGS ===========
export type ContactSettings = {
  contact_phone: string;
  whatsapp_number: string;
  store_name_ar: string;
  store_city_ar: string;
  working_hours_ar: string;
};

export const getContactSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<ContactSettings> => {
    const { data } = await supabaseAdmin
      .from("settings")
      .select("key,value")
      .in("key", [
        "contact_phone",
        "whatsapp_number",
        "store_name_ar",
        "store_city_ar",
        "working_hours_ar",
      ]);
    const m = new Map((data ?? []).map((r) => [r.key, r.value as any]));
    return {
      contact_phone: String(m.get("contact_phone") ?? ""),
      whatsapp_number: String(m.get("whatsapp_number") ?? ""),
      store_name_ar: String(m.get("store_name_ar") ?? ""),
      store_city_ar: String(m.get("store_city_ar") ?? ""),
      working_hours_ar: String(m.get("working_hours_ar") ?? ""),
    };
  },
);

const contactSchema = z.object({
  contact_phone: z.string().trim().min(5).max(40),
  whatsapp_number: z.string().trim().min(5).max(40),
  store_name_ar: z.string().trim().min(2).max(80),
  store_city_ar: z.string().trim().min(2).max(60),
  working_hours_ar: z.string().trim().min(2).max(200),
});

export const updateContactSettings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => contactSchema.parse(i))
  .handler(async ({ data }) => {
    await requireStaff();
    for (const [key, value] of Object.entries(data)) {
      const { error } = await supabaseAdmin
        .from("settings")
        .upsert({ key, value, is_public: true }, { onConflict: "key" });
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });
