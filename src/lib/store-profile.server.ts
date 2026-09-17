/**
 * Server-only store/seller profile. Reads the live values from `settings`
 * and produces the immutable snapshot stored on each new order.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SITE } from "@/lib/site-config";
import type { InvoiceSeller } from "@/lib/invoice";

export const STORE_SETTING_KEYS = [
  "store_name_ar",
  "store_city_ar",
  "store_address_ar",
  "store_email",
  "contact_phone",
  "contact_phones",
  "tax_registration_number",
  "commercial_registration_number",
] as const;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

export async function buildSellerFromSettings(): Promise<InvoiceSeller> {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("key,value")
    .in("key", [...STORE_SETTING_KEYS]);
  const m = new Map((data ?? []).map((r) => [r.key, r.value as unknown]));

  const listed = m.get("contact_phones");
  const phones = Array.isArray(listed)
    ? listed.map((p) => str(p)).filter(Boolean)
    : [];
  const primary = str(m.get("contact_phone"));
  if (primary && !phones.includes(primary)) phones.unshift(primary);

  return {
    name: str(m.get("store_name_ar")) || SITE.nameAr,
    address: str(m.get("store_address_ar")) || null,
    city: str(m.get("store_city_ar")) || SITE.cityAr,
    phones: phones.length ? phones : [...SITE.phones],
    email: str(m.get("store_email")) || null,
    taxNumber: str(m.get("tax_registration_number")) || null,
    commercialRegNumber: str(m.get("commercial_registration_number")) || null,
    logoUrl: SITE.logoUrl,
  };
}

/** Rehydrate a seller from the jsonb snapshot stored on the order. */
export function sellerFromSnapshot(raw: unknown): InvoiceSeller {
  const s = (raw ?? {}) as Record<string, unknown>;
  const phones = Array.isArray(s.phones)
    ? (s.phones as unknown[]).map((p) => str(p)).filter(Boolean)
    : [];
  return {
    name: str(s.name) || SITE.nameAr,
    address: str(s.address) || null,
    city: str(s.city) || null,
    phones,
    email: str(s.email) || null,
    taxNumber: str(s.taxNumber) || null,
    commercialRegNumber: str(s.commercialRegNumber) || null,
    logoUrl: str(s.logoUrl) || SITE.logoUrl,
  };
}
