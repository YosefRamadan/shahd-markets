/**
 * Store-wide constants. Anything also stored in `public.settings` is a fallback;
 * the live value should be read from the database for the storefront.
 */
export const SITE = {
  nameAr: "أسواق شهد الفيوم",
  cityAr: "الفيوم",
  phone: "01008336388",
  whatsapp: "01008336388",
  workingHoursAr: "يوميًا من 9 صباحًا حتى 12 منتصف الليل",
  currency: "EGP",
  currencyAr: "ج.م",
  deliveryFeeEgp: 20,
  minOrderEgp: 50,
  freeDeliveryThresholdEgp: 300,
} as const;

export function formatEgp(value: number): string {
  return `${value.toFixed(2)} ${SITE.currencyAr}`;
}

export function waLink(text?: string): string {
  const base = `https://wa.me/2${SITE.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
