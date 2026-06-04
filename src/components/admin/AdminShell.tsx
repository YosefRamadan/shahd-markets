import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Layers,
  Boxes,
  Package,
  Warehouse,
  Settings,
  Menu,
  LogOut,
  Store,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "الطلبات", icon: Package },
  { to: "/admin/products", label: "المنتجات", icon: Boxes },
  { to: "/admin/inventory", label: "المخزون", icon: Warehouse },
  { to: "/admin/categories", label: "الأقسام", icon: Layers },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
];

function useActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
}

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const isActive = useActive();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, exact }) => {
        const active = isActive(to, exact);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "text-foreground/75 hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      to="/admin"
      className="flex items-center gap-2 rounded-xl p-2"
    >
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Store className="h-4 w-4" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-bold leading-tight">
            أسواق شهد
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Admin
          </div>
        </div>
      )}
    </Link>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // persist sidebar collapsed pref
  useEffect(() => {
    const v = localStorage.getItem("admin:collapsed");
    if (v === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("admin:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const currentLabel =
    NAV.find((n) =>
      n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/"),
    )?.label ?? "لوحة الإدارة";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex sticky top-0 h-screen shrink-0 flex-col border-l border-border bg-card transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-2">
          <BrandBlock collapsed={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "توسيع" : "طي"}
          >
            {collapsed ? (
              <PanelRightOpen className="h-4 w-4" />
            ) : (
              <PanelRightClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <NavLinks collapsed={collapsed} />
        </div>
        <div className="border-t border-border p-2">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            title="عرض المتجر"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!collapsed && <span>عرض المتجر</span>}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10",
              collapsed && "justify-center px-2",
            )}
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/75 sm:px-4">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">قائمة الإدارة</SheetTitle>
              <div className="flex h-14 items-center border-b border-border px-3">
                <BrandBlock />
              </div>
              <div className="p-3">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-border p-3 space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  عرض المتجر
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-bold leading-tight">
              {currentLabel}
            </div>
            <div className="hidden text-[11px] text-muted-foreground sm:block">
              لوحة إدارة أسواق شهد الفيوم
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden md:inline">المتجر</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 text-destructive"
            onClick={handleSignOut}
            aria-label="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
