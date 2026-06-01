import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product, ProductVariant } from "@/lib/catalog";
import { SITE } from "@/lib/site-config";

export const Route = createFileRoute("/categories/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `قسم — ${params.slug} — ${SITE.nameAr}` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: catRow } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      setCat((catRow as Category) ?? null);

      if (catRow) {
        const { data: prods } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", (catRow as Category).id)
          .eq("is_active", true)
          .order("sort_order");
        if (cancelled) return;
        const productList = (prods ?? []) as Product[];
        setProducts(productList);

        if (productList.length) {
          const { data: vars } = await supabase
            .from("product_variants")
            .select("*")
            .in("product_id", productList.map((p) => p.id))
            .eq("is_active", true)
            .order("sort_order");
          if (cancelled) return;
          const grouped: Record<string, ProductVariant[]> = {};
          for (const v of (vars ?? []) as ProductVariant[]) {
            (grouped[v.product_id] ||= []).push(v);
          }
          setVariants(grouped);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-10">
        <div className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link>
          {" / "}
          <Link to="/categories" className="hover:text-foreground">الأقسام</Link>
          {" / "}
          <span className="text-foreground">{cat?.name_ar ?? slug}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold">{cat?.name_ar ?? "..."}</h1>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">لا توجد منتجات في هذا القسم بعد.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} variants={variants[p.id] ?? []} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
