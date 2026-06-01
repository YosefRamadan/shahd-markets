import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { User, Package } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "حسابي — أسواق شهد الفيوم" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <SiteShell>
      <div className="container mx-auto grid gap-6 px-4 py-10 md:grid-cols-[220px_1fr]">
        <aside className="space-y-1 rounded-2xl border border-border bg-card p-3">
          <Link
            to="/account"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent/60"
          >
            <User className="h-4 w-4" /> الملف الشخصي
          </Link>
          <Link
            to="/account/orders"
            activeProps={{ className: "bg-accent text-accent-foreground" }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent/60"
          >
            <Package className="h-4 w-4" /> طلباتي السابقة
          </Link>
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </SiteShell>
  );
}
