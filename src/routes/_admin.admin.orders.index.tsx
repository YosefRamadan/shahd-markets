import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search, Settings as SettingsIcon, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListOrders } from "@/lib/orders.functions";
import { STATUS_LABEL_AR, STATUS_TONE, type OrderStatus } from "@/lib/orders";
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

function AdminOrdersPage() {
  const listFn = useServerFn(adminListOrders);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => listFn({ data: { status: filter } }),
  });

  const rows = useMemo(() => {
    const all = data ?? [];
    if (!q.trim()) return all;
    const n = q.trim().toLowerCase();
    return all.filter((o) =>
      `${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(n),
    );
  }, [data, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">إدارة الطلبات</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            متابعة الطلبات وتحديث الحالة بسرعة.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/settings">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">إعدادات الطلبات</span>
          </Link>
        </Button>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الطلب، اسم العميل، أو الهاتف..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-9 h-11"
          />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
              className="shrink-0 rounded-full"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          rows.map((o) => (
            <Link
              key={o.id}
              to="/admin/orders/$id"
              params={{ id: o.id }}
              className="block rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition-colors active:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="num text-sm font-bold">{o.order_number}</div>
                  <div className="mt-0.5 truncate text-sm">{o.customer_name}</div>
                  <div className="num mt-0.5 text-xs text-muted-foreground" dir="ltr">
                    {o.customer_phone}
                  </div>
                </div>
                <Badge className={STATUS_TONE[o.status]}>
                  {STATUS_LABEL_AR[o.status]}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                <span className="text-muted-foreground">
                  {o.item_count} منتجات •{" "}
                  {new Date(o.created_at).toLocaleDateString("ar-EG")}
                </span>
                <span className="num text-base font-bold text-primary-foreground" style={{ color: "var(--color-foreground)" }}>
                  {formatEgp(o.total)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-right text-xs text-muted-foreground">
              <tr>
                <th className="p-3">الطلب</th>
                <th className="p-3">العميل</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    جاري التحميل…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    لا توجد طلبات مطابقة
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 font-semibold">
                      <Link
                        to="/admin/orders/$id"
                        params={{ id: o.id }}
                        className="num hover:underline"
                      >
                        {o.order_number}
                      </Link>
                      <div className="text-xs font-normal text-muted-foreground">
                        {o.item_count} منتجات
                      </div>
                    </td>
                    <td className="p-3">{o.customer_name}</td>
                    <td className="p-3 num text-xs" dir="ltr">
                      {o.customer_phone}
                    </td>
                    <td className="p-3 num font-semibold">{formatEgp(o.total)}</td>
                    <td className="p-3">
                      <Badge className={STATUS_TONE[o.status]}>
                        {STATUS_LABEL_AR[o.status]}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("ar-EG")}
                    </td>
                    <td className="p-3 text-left">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/admin/orders/$id" params={{ id: o.id }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
      لا توجد طلبات مطابقة
    </div>
  );
}
