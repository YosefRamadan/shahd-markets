import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Truck, Clock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/site/SiteShell";
import { SITE, formatEgp } from "@/lib/site-config";

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
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
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
                <Link to="/register">سجّل واطلب الآن</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">تسجيل الدخول</Link>
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
    </SiteShell>
  );
}
