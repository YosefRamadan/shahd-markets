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
        {/* Soft golden glows behind the hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 end-[-10%] h-[520px] w-[520px] rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(closest-side, oklch(0.85 0.17 88 / 0.35), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 start-[-10%] h-[460px] w-[460px] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, oklch(0.79 0.17 86 / 0.28), transparent 70%)" }}
        />

        <div className="container relative mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
              توصيل داخل {SITE.cityAr}
            </span>
            <h1 className="relative mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-x-4 -inset-y-6 -z-10 blur-2xl"
                style={{ background: "radial-gradient(closest-side, oklch(0.85 0.17 88 / 0.22), transparent 70%)" }}
              />
              {SITE.nameAr}
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, oklch(0.88 0.155 92), oklch(0.79 0.17 86))" }}
              >
                بقالتك لباب البيت
              </span>
            </h1>
            <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">
              منتجات طازجة، أسعار حلوة، وتوصيل سريع. {SITE.workingHoursAr}.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                size="lg"
                asChild
                className="btn-premium hover:btn-premium-hover rounded-full px-7 text-base font-bold"
              >
                <Link to="/categories">تصفّح المنتجات</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="rounded-full border-primary/30 bg-background/40 px-7 text-base font-semibold backdrop-blur hover:bg-primary/10"
              >
                <Link to="/register">سجّل حسابك</Link>
              </Button>
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              رسوم التوصيل: <span className="num font-semibold text-foreground">{formatEgp(SITE.deliveryFeeEgp)}</span>
            </div>
          </div>

          <div className="relative">
            {/* Outer golden glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] blur-2xl"
              style={{ background: "radial-gradient(closest-side, oklch(0.85 0.17 88 / 0.35), transparent 70%)" }}
            />
            <div
              className="glass-card relative aspect-square rounded-[2rem] p-6 md:p-8"
            >
              <div className="grid h-full grid-cols-2 gap-4">
                {[
                  { Icon: ShoppingBag, t: "تشكيلة واسعة", d: "آلاف المنتجات" },
                  { Icon: Truck, t: "توصيل سريع", d: "خلال ساعات" },
                  { Icon: Clock, t: "مواعيد مرنة", d: "متاح 24/7" },
                  { Icon: ShieldCheck, t: "دفع آمن", d: "كاش أو إلكتروني" },
                ].map(({ Icon, t, d }) => (
                  <div
                    key={t}
                    className="glass-card hover:glass-card-hover group flex flex-col items-center justify-center rounded-2xl p-4 text-center"
                  >
                    <div
                      className="grid h-12 w-12 place-items-center rounded-2xl text-primary-foreground shadow-[0_8px_20px_-8px_oklch(0.79_0.17_86/0.6)] transition-transform group-hover:scale-110"
                      style={{ background: "linear-gradient(135deg, oklch(0.88 0.155 92), oklch(0.79 0.17 86))" }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mt-3 text-sm font-bold text-foreground">{t}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{d}</div>
                  </div>
                ))}
              </div>
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
