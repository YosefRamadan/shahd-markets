import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Truck, Clock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/SiteShell";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { SITE, formatEgp } from "@/lib/site-config";
import type { Category, Product, ProductVariant } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.nameAr} — بقالتك أونلاين في ${SITE.cityAr}` },
      { name: "description", content: `اطلب البقالة من ${SITE.nameAr} وتوصلك خلال ساعات. توصيل بـ ${SITE.deliveryFeeEgp} ج.م داخل ${SITE.cityAr}.` },
    ],
  }),
  component: Index,
});

function Index() {
  const [cats, setCats] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Record<string, ProductVariant[]>>({});

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setCats((c ?? []) as Category[]);

      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(12);
      const list = (p ?? []) as Product[];
      setFeatured(list);

      if (list.length) {
        const { data: v } = await supabase
          .from("product_variants")
          .select("*")
          .in("product_id", list.map((x) => x.id))
          .eq("is_active", true);
        const grouped: Record<string, ProductVariant[]> = {};
        for (const row of (v ?? []) as ProductVariant[]) {
          (grouped[row.product_id] ||= []).push(row);
        }
        setVariants(grouped);
      }
    })();
  }, []);

  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              توصيل داخل {SITE.cityAr}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              {SITE.nameAr}
              <br />
              <span className="text-primary">بقالتك لباب البيت</span>
            </h1>
            <p className="mt-4 max-w-prose text-muted-foreground">
              منتجات طازجة، أسعار حلوة، وتوصيل سريع. {SITE.workingHoursAr}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/categories">تصفّح المنتجات</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">سجّل حسابك</Link>
              </Button>
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              رسوم التوصيل: <span className="num font-semibold text-foreground">{formatEgp(SITE.deliveryFeeEgp)}</span>
              {" "}• توصيل مجاني للطلبات فوق <span className="num font-semibold text-foreground">{formatEgp(SITE.freeDeliveryThresholdEgp)}</span>
            </div>
          </div>

          <div
            className="relative aspect-square rounded-3xl p-8 shadow-[var(--shadow-elegant)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <div className="grid h-full grid-cols-2 gap-4">
              {[
                { Icon: ShoppingBag, t: "تشكيلة واسعة" },
                { Icon: Truck, t: "توصيل سريع" },
                { Icon: Clock, t: "مواعيد مرنة" },
                { Icon: ShieldCheck, t: "دفع آمن" },
              ].map(({ Icon, t }) => (
                <div key={t} className="flex flex-col items-center justify-center rounded-2xl bg-background/85 p-4 text-center">
                  <Icon className="h-8 w-8 text-primary" />
                  <div className="mt-2 text-sm font-semibold">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">تسوّق حسب القسم</h2>
          <Link to="/categories" className="text-sm font-semibold text-primary hover:underline">كل الأقسام</Link>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card text-center shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {c.image_url && (
                  <img src={c.image_url} alt={c.name_ar} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                )}
              </div>
              <div className="p-2 text-sm font-semibold">{c.name_ar}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 pt-4">
        <h2 className="text-2xl font-bold">منتجات مختارة</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} variants={variants[p.id] ?? []} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
