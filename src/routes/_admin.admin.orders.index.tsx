import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { SiteShell } from "@/components/site/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  adminListOrders,
  STATUS_LABEL_AR,
  type OrderStatus,
} from "@/lib/orders";
import { formatEgp } from "@/lib/site-config";

export const Route = createFileRoute("/_admin/admin/orders/")({
  head: () => ({ meta: [{ title: "إدارة الطلبات — أسواق شهد الفيوم" }] }),
  component: AdminOrdersPage,
});

const FILTERS: Array<{ key: "all" | OrderStatus; label: string }> = [
  { key: "all", label: "الكل" },
  { key: "placed", label: "تم الطلب" },
  { key: "preparing", label: "تم التجهيز" },
  { key: "out_for_delivery", label: "مع الطيار" },
  { key: "delivered", label: "تم التسليم" },
  { key: "cancelled", label: "ملغي" },
];

const TONE: Record<OrderStatus, string> = {
  placed: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  preparing: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  out_for_delivery: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-destructive/10 text-destructive",
};

function AdminOrdersPage() {
  const listFn = useServerFn(adminListOrders);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => listFn({ data: { status: filter } }),
  });

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/settings">إعدادات الطلبات</Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-right">
              <tr>
                <th className="p-3">الطلب</th>
                <th className="p-3">العميل</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    جاري التحميل…
                  </td>
                </tr>
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                data.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 font-semibold">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: o.id }}
                        className="text-primary hover:underline"
                      >
                        {o.order_number}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {o.item_count} منتجات
                      </div>
                    </td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3" dir="ltr">
                      {o.customer_phone}
                    </td>
                    <td className="p-3 tabular-nums">{formatEgp(o.total)}</td>
                    <td className="p-3">
                      <Badge className={TONE[o.status]}>{STATUS_LABEL_AR[o.status]}</Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("ar-EG")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SiteShell>
  );
}
