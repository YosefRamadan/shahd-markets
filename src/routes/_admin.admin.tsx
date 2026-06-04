import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { AdminFrame } from "@/components/admin/AdminFrame";

export const Route = createFileRoute("/_admin/admin")({
  head: () => ({ meta: [{ title: "لوحة الإدارة — أسواق شهد الفيوم" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SiteShell>
      <AdminFrame>
        <Outlet />
      </AdminFrame>
    </SiteShell>
  );
}
