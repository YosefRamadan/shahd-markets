/**
 * Store-wide constants. Anything also stored in `public.settings` is a fallback;
 * the live value should be read from the database for the storefront.
 */


export const SITE = {
  nameAr: "أسواق شهد الفيوم",
  nameEn: "Shahd Markets",
  cityAr: "الفيوم",
  phone: "01008336388",
  whatsapp: "01008336388",
  phones: ["01008336388"] as readonly string[],
  workingHoursAr: "متاح 24 ساعة يومياً - طوال أيام الأسبوع",
  currency: "EGP",
  currencyAr: "ج.م",
  deliveryFeeEgp: 20,
  minOrderEgp: 50,
  // Served from /public so the app stays portable across any host.
  logoUrl: "/shahd-logo.png",
} as const;

export function formatEgp(value: number): string {
  return `${value.toFixed(2)} ${SITE.currencyAr}`;
}

export function waLink(text?: string, phone?: string): string {
  const num = (phone ?? SITE.whatsapp).replace(/^0/, "");
  const base = `https://wa.me/2${num}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
