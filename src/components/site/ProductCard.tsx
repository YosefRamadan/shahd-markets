import { Link } from "@tanstack/react-router";
import type { Product, ProductVariant } from "@/lib/catalog";
import { displayPrice, isProductInStock } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";

export function ProductCard({
  product,
  variants = [],
}: {
  product: Product;
  variants?: ProductVariant[];
}) {
  const inStock = isProductInStock(product, variants);
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-[var(--shadow-elegant)]"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_ar}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
        {!inStock && (
          <div className="absolute inset-0 grid place-items-center bg-background/70">
            <Badge variant="destructive" className="text-sm">غير متوفر</Badge>
          </div>
        )}
        {product.is_weight_based && inStock && (
          <Badge className="absolute end-2 top-2">بالوزن</Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="line-clamp-2 text-sm font-semibold text-foreground">
          {product.name_ar}
        </div>
        <div className="num mt-auto text-sm font-bold text-primary">
          {displayPrice(product, variants)}
        </div>
      </div>
    </Link>
  );
}
