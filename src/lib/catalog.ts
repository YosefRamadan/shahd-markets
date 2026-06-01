import { formatEgp } from "./site-config";

export type Category = {
  id: string;
  name_ar: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  name_ar: string;
  sku: string | null;
  price: number;
  stock: number;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  category_id: string;
  name_ar: string;
  slug: string;
  description_ar: string | null;
  image_url: string | null;
  base_price: number;
  stock: number;
  is_weight_based: boolean;
  weight_options_grams: number[];
  price_per_kg: number | null;
  unit_label_ar: string | null;
  is_active: boolean;
  sort_order: number;
};

export const WEIGHT_OPTIONS = [250, 500, 750, 1000] as const;

export function formatWeightLabel(grams: number): string {
  if (grams >= 1000) return `${grams / 1000} كجم`;
  return `${grams} جم`;
}

export function priceForWeight(pricePerKg: number, grams: number): number {
  return +((pricePerKg * grams) / 1000).toFixed(2);
}

export function isProductInStock(product: Product, variants: ProductVariant[]): boolean {
  if (variants.length > 0) return variants.some((v) => v.is_active && v.stock > 0);
  if (product.is_weight_based) return product.stock > 0;
  return product.stock > 0;
}

export function displayPrice(product: Product, variants: ProductVariant[]): string {
  if (variants.length > 0) {
    const active = variants.filter((v) => v.is_active);
    if (active.length === 0) return "—";
    const min = Math.min(...active.map((v) => v.price));
    return `يبدأ من ${formatEgp(min)}`;
  }
  if (product.is_weight_based && product.price_per_kg != null) {
    return `${formatEgp(product.price_per_kg)} / كجم`;
  }
  return formatEgp(product.base_price);
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
