import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Package, Boxes, Layers, Settings } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/_admin/admin")({
  head: () => ({ meta: [{ title: "لوحة الإدارة — أسواق شهد الفيوم" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const items = [
    { Icon: Layers, t: "الأقسام", to: "/admin/categories", note: "إدارة الأقسام" },
    { Icon: Boxes, t: "المنتجات", to: "/admin/products", note: "إدارة المنتجات والمتغيرات" },
    { Icon: Package, t: "الطلبات", to: "/admin/orders", note: "متابعة الطلبات وتحديث الحالة" },
    { Icon: Settings, t: "الإعدادات", to: "/admin/settings", note: "الحد الأدنى ورسوم التوصيل" },
  ] as const;
  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">لوحة الإدارة</h1>
            <p className="text-sm text-muted-foreground">إدارة المتجر والمنتجات والطلبات.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ Icon, t, to, note }) => (
            <Link
              key={t}
              to={to}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-elegant)]"
            >
              <Icon className="h-7 w-7 text-primary" />
              <div className="mt-3 font-semibold">{t}</div>
              <div className="mt-1 text-xs text-muted-foreground">{note}</div>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
