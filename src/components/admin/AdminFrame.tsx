import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Layers,
  Boxes,
  Package,
  Warehouse,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "الطلبات", icon: Package },
  { to: "/admin/products", label: "المنتجات", icon: Boxes },
  { to: "/admin/inventory", label: "المخزون", icon: Warehouse },
  { to: "/admin/categories", label: "الأقسام", icon: Layers },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
] as const;

export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
            <div className="px-3 pb-3 pt-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                لوحة الإدارة
              </div>
              <div className="mt-0.5 font-display text-lg font-bold">
                أسواق شهد
              </div>
            </div>
            <nav className="flex flex-col gap-1 lg:flex-col">
              {NAV.map(({ to, label, icon: Icon, exact }) => {
                const active = isActive(to, (exact as boolean | undefined) ?? false);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/15 font-semibold text-primary-foreground"
                        : "text-foreground/80 hover:bg-muted",
                    )}
                    style={active ? { background: "var(--gradient-primary)" } : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
