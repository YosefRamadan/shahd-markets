import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { SITE } from "@/lib/site-config";

const CART_COOKIE = "sh_cart_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function genSessionId(): string {
  // 32 hex chars
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

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

function getOrCreateSessionId(): string {
  let sid = getCookie(CART_COOKIE);
  if (!sid) {
    sid = genSessionId();
    setCookie(CART_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return sid;
}

type CartOwner = { userId: string | null; sessionId: string };

async function resolveOwner(): Promise<CartOwner> {
  const userId = await getOptionalUserId();
  const sessionId = getOrCreateSessionId();
  return { userId, sessionId };
}

async function getOrCreateActiveCart(owner: CartOwner): Promise<string> {
  if (owner.userId) {
    const { data: existing } = await supabaseAdmin
      .from("carts")
      .select("id")
      .eq("user_id", owner.userId)
      .eq("status", "active")
      .maybeSingle();
    if (existing?.id) return existing.id;

    const { data: created, error } = await supabaseAdmin
      .from("carts")
      .insert({ user_id: owner.userId, status: "active" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return created.id;
  }

  const { data: existing } = await supabaseAdmin
    .from("carts")
    .select("id")
    .eq("session_id", owner.sessionId)
    .eq("status", "active")
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from("carts")
    .insert({ session_id: owner.sessionId, status: "active" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id;
}

type ResolvedLine = {
  unit_price: number;
  available_units: number; // max number of "items" (or weight-packs) buyable
  product_name: string;
  variant_name: string | null;
  image_url: string | null;
};

async function resolveAndValidate(input: {
  product_id: string;
  variant_id: string | null;
  weight_grams: number | null;
  quantity: number;
}): Promise<ResolvedLine> {
  const { data: product, error: prodErr } = await supabaseAdmin
    .from("products")
    .select(
      "id,name_ar,image_url,base_price,stock,is_active,is_weight_based,weight_options_grams,price_per_kg",
    )
    .eq("id", input.product_id)
    .maybeSingle();
  if (prodErr) throw new Error(prodErr.message);
  if (!product || !product.is_active) throw new Error("المنتج غير متوفر");

  if (input.variant_id) {
    const { data: variant, error: vErr } = await supabaseAdmin
      .from("product_variants")
      .select("id,name_ar,price,stock,is_active,product_id")
      .eq("id", input.variant_id)
      .maybeSingle();
    if (vErr) throw new Error(vErr.message);
    if (!variant || !variant.is_active || variant.product_id !== product.id) {
      throw new Error("هذا الحجم غير متوفر");
    }
    if (variant.stock <= 0) throw new Error("غير متوفر بالمخزون");
    if (input.quantity > variant.stock) {
      throw new Error(`الكمية المتاحة فقط ${variant.stock}`);
    }
    return {
      unit_price: Number(variant.price),
      available_units: variant.stock,
      product_name: product.name_ar,
      variant_name: variant.name_ar,
      image_url: product.image_url,
    };
  }

  if (product.is_weight_based) {
    if (!input.weight_grams) throw new Error("اختر الوزن المطلوب");
    if (
      product.weight_options_grams.length > 0 &&
      !product.weight_options_grams.includes(input.weight_grams)
    ) {
      throw new Error("الوزن المختار غير متاح");
    }
    if (!product.price_per_kg) throw new Error("سعر الكيلو غير محدد");
    if (product.stock <= 0) throw new Error("غير متوفر بالمخزون");

    // Treat product.stock as available kilograms.
    const requestedKg = (input.weight_grams * input.quantity) / 1000;
    if (requestedKg > product.stock) {
      const maxPacks = Math.floor((product.stock * 1000) / input.weight_grams);
      throw new Error(`الكمية المتاحة فقط ${maxPacks} عبوة`);
    }
    const unit_price = +((Number(product.price_per_kg) * input.weight_grams) / 1000).toFixed(2);
    const max_packs = Math.floor((product.stock * 1000) / input.weight_grams);
    return {
      unit_price,
      available_units: max_packs,
      product_name: product.name_ar,
      variant_name: `${input.weight_grams >= 1000 ? input.weight_grams / 1000 + " كجم" : input.weight_grams + " جم"}`,
      image_url: product.image_url,
    };
  }

  // Standard product
  if (product.stock <= 0) throw new Error("غير متوفر بالمخزون");
  if (input.quantity > product.stock) {
    throw new Error(`الكمية المتاحة فقط ${product.stock}`);
  }
  return {
    unit_price: Number(product.base_price),
    available_units: product.stock,
    product_name: product.name_ar,
    variant_name: null,
    image_url: product.image_url,
  };
}

// ============ Server functions ============

const addInputSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  weight_grams: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive().max(99).default(1),
});

export const addToCart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => addInputSchema.parse(input))
  .handler(async ({ data }) => {
    const owner = await resolveOwner();
    const cartId = await getOrCreateActiveCart(owner);

    const variant_id = data.variant_id ?? null;
    const weight_grams = data.weight_grams ?? null;

    // Look up existing line with same key
    const existingQuery = supabaseAdmin
      .from("cart_items")
      .select("id,quantity")
      .eq("cart_id", cartId)
      .eq("product_id", data.product_id);
    const { data: existingRows } = await existingQuery;
    const existing = (existingRows ?? []).find(
      (r: any) => true, // we'll filter in JS to handle nulls cleanly
    );
    // Better: filter explicitly
    const match = (existingRows ?? []).find((r: any) => {
      // Need to re-query full rows for matching keys
      return false;
    });
    void existing;
    void match;

    // Re-query with explicit equality on optional fields
    const { data: keyMatches } = await supabaseAdmin
      .from("cart_items")
      .select("id,quantity,variant_id,weight_grams")
      .eq("cart_id", cartId)
      .eq("product_id", data.product_id);
    const existingLine = (keyMatches ?? []).find(
      (r) =>
        (r.variant_id ?? null) === variant_id &&
        (r.weight_grams ?? null) === weight_grams,
    );

    const targetQty = (existingLine?.quantity ?? 0) + data.quantity;

    const resolved = await resolveAndValidate({
      product_id: data.product_id,
      variant_id,
      weight_grams,
      quantity: targetQty,
    });

    if (existingLine) {
      const { error } = await supabaseAdmin
        .from("cart_items")
        .update({ quantity: targetQty, unit_price: resolved.unit_price })
        .eq("id", existingLine.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("cart_items").insert({
        cart_id: cartId,
        product_id: data.product_id,
        variant_id,
        weight_grams,
        quantity: data.quantity,
        unit_price: resolved.unit_price,
      });
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cartId);

    return { ok: true as const, cart_id: cartId };
  });

const updateInputSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().min(0).max(99),
});

export const updateCartItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateInputSchema.parse(input))
  .handler(async ({ data }) => {
    const owner = await resolveOwner();
    const cartId = await getOrCreateActiveCart(owner);

    const { data: item, error: itemErr } = await supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("id", data.item_id)
      .eq("cart_id", cartId)
      .maybeSingle();
    if (itemErr) throw new Error(itemErr.message);
    if (!item) throw new Error("العنصر غير موجود في السلة");

    if (data.quantity === 0) {
      const { error } = await supabaseAdmin.from("cart_items").delete().eq("id", item.id);
      if (error) throw new Error(error.message);
      return { ok: true as const, removed: true };
    }

    const resolved = await resolveAndValidate({
      product_id: item.product_id,
      variant_id: item.variant_id,
      weight_grams: item.weight_grams,
      quantity: data.quantity,
    });

    const { error } = await supabaseAdmin
      .from("cart_items")
      .update({ quantity: data.quantity, unit_price: resolved.unit_price })
      .eq("id", item.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

const removeInputSchema = z.object({ item_id: z.string().uuid() });

export const removeCartItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => removeInputSchema.parse(input))
  .handler(async ({ data }) => {
    const owner = await resolveOwner();
    const cartId = await getOrCreateActiveCart(owner);
    const { error } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("id", data.item_id)
      .eq("cart_id", cartId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const clearCart = createServerFn({ method: "POST" }).handler(async () => {
  const owner = await resolveOwner();
  const cartId = await getOrCreateActiveCart(owner);
  const { error } = await supabaseAdmin.from("cart_items").delete().eq("cart_id", cartId);
  if (error) throw new Error(error.message);
  return { ok: true as const };
});

export type CartLine = {
  id: string;
  product_id: string;
  variant_id: string | null;
  weight_grams: number | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_name: string;
  product_slug: string;
  variant_name: string | null;
  image_url: string | null;
  is_weight_based: boolean;
  available_units: number;
  in_stock: boolean;
  issue: string | null;
};

export type CartSummary = {
  cart_id: string;
  lines: CartLine[];
  subtotal: number;
  delivery_fee: number;
  free_delivery_threshold: number;
  min_order: number;
  total: number;
  meets_minimum: boolean;
};

export const getCart = createServerFn({ method: "GET" }).handler(async (): Promise<CartSummary> => {
  const owner = await resolveOwner();
  const cartId = await getOrCreateActiveCart(owner);

  const { data: items, error } = await supabaseAdmin
    .from("cart_items")
    .select(
      "id,product_id,variant_id,weight_grams,quantity,unit_price,created_at,products(name_ar,slug,image_url,is_weight_based,price_per_kg,stock,is_active),product_variants(name_ar,price,stock,is_active)",
    )
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const lines: CartLine[] = [];
  let subtotal = 0;

  for (const row of items ?? []) {
    const product = (row as any).products as {
      name_ar: string;
      slug: string;
      image_url: string | null;
      is_weight_based: boolean;
      price_per_kg: number | null;
      stock: number;
      is_active: boolean;
    } | null;
    const variant = (row as any).product_variants as {
      name_ar: string;
      price: number;
      stock: number;
      is_active: boolean;
    } | null;

    if (!product) continue;

    let unit_price = Number(row.unit_price);
    let available_units = 0;
    let in_stock = true;
    let issue: string | null = null;
    let variant_name: string | null = null;

    if (variant) {
      variant_name = variant.name_ar;
      if (!variant.is_active || variant.stock <= 0) {
        in_stock = false;
        issue = "غير متوفر";
      }
      available_units = variant.stock;
      unit_price = Number(variant.price);
    } else if (product.is_weight_based) {
      if (!product.price_per_kg || product.stock <= 0) {
        in_stock = false;
        issue = "غير متوفر";
      }
      const g = row.weight_grams ?? 0;
      variant_name = g >= 1000 ? `${g / 1000} كجم` : `${g} جم`;
      unit_price = +(((Number(product.price_per_kg) || 0) * g) / 1000).toFixed(2);
      available_units = g > 0 ? Math.floor((product.stock * 1000) / g) : 0;
    } else {
      if (product.stock <= 0) {
        in_stock = false;
        issue = "غير متوفر";
      }
      available_units = product.stock;
    }

    if (!product.is_active) {
      in_stock = false;
      issue = "تم إيقاف هذا المنتج";
    }

    if (in_stock && row.quantity > available_units) {
      issue = `الكمية المتاحة ${available_units}`;
    }

    const line_total = +(unit_price * row.quantity).toFixed(2);
    if (in_stock) subtotal += line_total;

    lines.push({
      id: row.id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      weight_grams: row.weight_grams,
      quantity: row.quantity,
      unit_price,
      line_total,
      product_name: product.name_ar,
      product_slug: product.slug,
      variant_name,
      image_url: product.image_url,
      is_weight_based: product.is_weight_based,
      available_units,
      in_stock,
      issue,
    });
  }

  subtotal = +subtotal.toFixed(2);

  // Load settings for delivery/min order
  const { data: settingsRows } = await supabaseAdmin
    .from("settings")
    .select("key,value")
    .in("key", ["delivery_fee_egp", "min_order_egp"]);
  const settings = new Map((settingsRows ?? []).map((r) => [r.key, r.value as any]));

  const delivery_fee_base = Number(settings.get("delivery_fee_egp") ?? SITE.deliveryFeeEgp);
  const min_order = Number(settings.get("min_order_egp") ?? SITE.minOrderEgp);

  const hasItems = lines.some((l) => l.in_stock);
  const delivery_fee = !hasItems ? 0 : delivery_fee_base;
  const total = +(subtotal + delivery_fee).toFixed(2);
  const meets_minimum = subtotal >= min_order;

  return {
    cart_id: cartId,
    lines,
    subtotal,
    delivery_fee,
    min_order,
    total,
    meets_minimum,
  };
});

// Called after sign-in to merge the guest session cart into the user's cart.
export const mergeGuestCart = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await getOptionalUserId();
  if (!userId) return { ok: false as const, reason: "not_authenticated" };

  const sessionId = getCookie(CART_COOKIE);
  if (!sessionId) return { ok: true as const, merged: 0 };

  const { data: guestCart } = await supabaseAdmin
    .from("carts")
    .select("id")
    .eq("session_id", sessionId)
    .eq("status", "active")
    .maybeSingle();
  if (!guestCart) return { ok: true as const, merged: 0 };

  const userCartId = await getOrCreateActiveCart({ userId, sessionId });

  if (userCartId === guestCart.id) {
    // Promote guest cart to user cart
    await supabaseAdmin
      .from("carts")
      .update({ user_id: userId, session_id: null })
      .eq("id", guestCart.id);
    return { ok: true as const, merged: 0 };
  }

  const { data: guestItems } = await supabaseAdmin
    .from("cart_items")
    .select("*")
    .eq("cart_id", guestCart.id);

  let merged = 0;
  for (const gi of guestItems ?? []) {
    const { data: existingRows } = await supabaseAdmin
      .from("cart_items")
      .select("id,quantity,variant_id,weight_grams")
      .eq("cart_id", userCartId)
      .eq("product_id", gi.product_id);
    const match = (existingRows ?? []).find(
      (r) =>
        (r.variant_id ?? null) === (gi.variant_id ?? null) &&
        (r.weight_grams ?? null) === (gi.weight_grams ?? null),
    );

    const targetQty = (match?.quantity ?? 0) + gi.quantity;

    try {
      const resolved = await resolveAndValidate({
        product_id: gi.product_id,
        variant_id: gi.variant_id,
        weight_grams: gi.weight_grams,
        quantity: Math.min(targetQty, 99),
      });
      const finalQty = Math.min(targetQty, resolved.available_units, 99);
      if (match) {
        await supabaseAdmin
          .from("cart_items")
          .update({ quantity: finalQty, unit_price: resolved.unit_price })
          .eq("id", match.id);
      } else {
        await supabaseAdmin.from("cart_items").insert({
          cart_id: userCartId,
          product_id: gi.product_id,
          variant_id: gi.variant_id,
          weight_grams: gi.weight_grams,
          quantity: finalQty,
          unit_price: resolved.unit_price,
        });
      }
      merged++;
    } catch {
      // skip lines that fail validation
    }
  }

  await supabaseAdmin
    .from("carts")
    .update({ status: "merged" })
    .eq("id", guestCart.id);

  return { ok: true as const, merged };
});
