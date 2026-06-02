import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Package, ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { listMyOrders } from "@/lib/orders.functions";
import { STATUS_LABEL_AR, type OrderStatus } from "@/lib/orders";
import { formatEgp } from "@/lib/site-config";

export const Route = createFileRoute("/_authenticated/account/orders")({
  head: () => ({ meta: [{ title: "طلباتي — أسواق شهد الفيوم" }] }),
  component: OrdersPage,
});

const TONE: Record<OrderStatus, string> = {
  placed: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  preparing: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  out_for_delivery: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-destructive/10 text-destructive",
};

function OrdersPage() {
  const listFn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listFn(),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <h1 className="text-2xl font-bold">طلباتي السابقة</h1>

      {isLoading ? (
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-muted/40 p-10 text-center">
          <Package className="h-12 w-12 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">لا توجد طلبات بعد.</p>
          <Link to="/categories" className="mt-3 text-sm text-primary hover:underline">
            ابدأ التسوق
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((o) => (
            <li key={o.id}>
              <Link
                to="/orders/$id"
                params={{ id: o.id }}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary/40"
              >
                <div>
                  <div className="font-semibold">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("ar-EG")} · {o.item_count} منتجات
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={TONE[o.status]}>{STATUS_LABEL_AR[o.status]}</Badge>
                  <span className="tabular-nums font-semibold">{formatEgp(o.total)}</span>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
