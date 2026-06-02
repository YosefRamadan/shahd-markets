import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShoppingCart, Loader2 } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product, ProductVariant } from "@/lib/catalog";
import {
  formatWeightLabel,
  isProductInStock,
  priceForWeight,
} from "@/lib/catalog";
import { addToCart } from "@/lib/cart.functions";
import { SITE, formatEgp } from "@/lib/site-config";

export const Route = createFileRoute("/products/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `منتج — ${params.slug} — ${SITE.nameAr}` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [weight, setWeight] = useState<number>(1000);
  const [qty, setQty] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const queryClient = useQueryClient();
  const addToCartFn = useServerFn(addToCart);
  const addMutation = useMutation({
    mutationFn: (vars: {
      product_id: string;
      variant_id: string | null;
      weight_grams: number | null;
      quantity: number;
    }) => addToCartFn({ data: vars }),
    onSuccess: () => {
      toast.success("تمت الإضافة إلى السلة");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      const prod = (p as Product) ?? null;
      setProduct(prod);

      if (prod) {
        const [{ data: vars }, { data: cat }] = await Promise.all([
          supabase
            .from("product_variants")
            .select("*")
            .eq("product_id", prod.id)
            .order("sort_order"),
          supabase
            .from("categories")
            .select("*")
            .eq("id", prod.category_id)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        const vlist = ((vars ?? []) as ProductVariant[]).filter((v) => v.is_active);
        setVariants(vlist);
        setCategory((cat as Category) ?? null);
        const firstAvail = vlist.find((v) => v.stock > 0) ?? vlist[0];
        setVariantId(firstAvail?.id ?? null);
        if (prod.is_weight_based && prod.weight_options_grams.length) {
          setWeight(prod.weight_options_grams[prod.weight_options_grams.length - 1]);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === variantId) ?? null,
    [variants, variantId],
  );

  if (loading) {
    return (
      <SiteShell>
        <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </SiteShell>
    );
  }

  if (!product) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">المنتج غير موجود</h1>
          <Button asChild className="mt-6"><Link to="/categories">تصفح الأقسام</Link></Button>
        </div>
      </SiteShell>
    );
  }

  const inStock = isProductInStock(product, variants);

  // Price calculation
  let currentPrice = product.base_price;
  let estimatedNote: string | null = null;
  if (selectedVariant) {
    currentPrice = selectedVariant.price;
  } else if (product.is_weight_based && product.price_per_kg != null) {
    currentPrice = priceForWeight(product.price_per_kg, weight);
    estimatedNote = "السعر النهائي يُحتسب على الوزن الفعلي عند التحضير.";
  }

  const variantOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false;
  const canBuy = inStock && !variantOutOfStock;

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-8">
        <div className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link>
          {" / "}
          {category && (
            <>
              <Link to="/categories/$slug" params={{ slug: category.slug }} className="hover:text-foreground">
                {category.name_ar}
              </Link>
              {" / "}
            </>
          )}
          <span className="text-foreground">{product.name_ar}</span>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-muted">
            {product.image_url && (
              <img src={product.image_url} alt={product.name_ar} className="h-full w-full object-cover" />
            )}
            {!inStock && (
              <div className="absolute inset-0 grid place-items-center bg-background/70">
                <Badge variant="destructive" className="text-base">غير متوفر</Badge>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold">{product.name_ar}</h1>
            {product.description_ar && (
              <p className="mt-2 text-muted-foreground">{product.description_ar}</p>
            )}

            <div className="num mt-4 text-3xl font-extrabold text-primary">
              {formatEgp(currentPrice)}
              {product.is_weight_based && product.price_per_kg != null && !selectedVariant && (
                <span className="ms-2 text-sm font-normal text-muted-foreground">
                  ({formatEgp(product.price_per_kg)} / كجم)
                </span>
              )}
            </div>

            {/* Variant selector */}
            {variants.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-sm font-semibold">اختر الحجم:</div>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const oos = v.stock === 0;
                    const active = v.id === variantId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        className={[
                          "rounded-xl border px-4 py-2 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary/10 font-semibold text-primary"
                            : "border-border bg-card hover:bg-accent",
                          oos ? "opacity-60" : "",
                        ].join(" ")}
                      >
                        <div>{v.name_ar}</div>
                        <div className="num mt-0.5 text-xs">
                          {formatEgp(v.price)}
                          {oos && <span className="ms-1 text-destructive">— غير متوفر</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weight selector */}
            {product.is_weight_based && product.weight_options_grams.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-sm font-semibold">اختر الوزن المطلوب:</div>
                <div className="flex flex-wrap gap-2">
                  {product.weight_options_grams.map((g) => {
                    const active = g === weight;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setWeight(g)}
                        className={[
                          "rounded-xl border px-4 py-2 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary/10 font-semibold text-primary"
                            : "border-border bg-card hover:bg-accent",
                        ].join(" ")}
                      >
                        <div>{formatWeightLabel(g)}</div>
                        {product.price_per_kg != null && (
                          <div className="num mt-0.5 text-xs">
                            ≈ {formatEgp(priceForWeight(product.price_per_kg, g))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {estimatedNote && (
                  <p className="mt-2 text-xs text-muted-foreground">{estimatedNote}</p>
                )}
              </div>
            )}

            <div className="mt-8">
              <Button size="lg" disabled={!canBuy} className="w-full md:w-auto">
                {canBuy ? "أضف إلى السلة" : "غير متوفر"}
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                السلة وإتمام الطلب سيتم تفعيلهما في الخطوة التالية.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
