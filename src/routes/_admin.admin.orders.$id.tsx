import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getOrder, adminUpdateOrderStatus } from "@/lib/orders.functions";
import { STATUS_LABEL_AR, type OrderStatus } from "@/lib/orders";
import { formatEgp } from "@/lib/site-config";

export const Route = createFileRoute("/_admin/admin/orders/$id")({
  head: () => ({ meta: [{ title: "تفاصيل الطلب — إدارة" }] }),
  component: AdminOrderDetails,
});

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const TONE: Record<OrderStatus, string> = {
  placed: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  preparing: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  out_for_delivery: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-destructive/10 text-destructive",
};

function AdminOrderDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getOrder);
  const statusFn = useServerFn(adminUpdateOrderStatus);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const mut = useMutation({
    mutationFn: (status: OrderStatus) => statusFn({ data: { id, status } }),
    onSuccess: (_r, status) => {
      toast.success(`تم تحديث الحالة إلى ${STATUS_LABEL_AR[status]}`);
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !order) {
    return (
      <>
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const status = order.status as OrderStatus;
  const next = TRANSITIONS[status];

  return (
    <>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <button
          onClick={() => navigate({ to: "/admin/orders" })}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> كل الطلبات
        </button>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">طلب {order.order_number}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString("ar-EG")}
            </p>
          </div>
          <Badge className={TONE[status]}>{STATUS_LABEL_AR[status]}</Badge>
        </div>

        {next.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {next.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === "cancelled" ? "destructive" : "default"}
                disabled={mut.isPending}
                onClick={() => {
                  if (s === "cancelled" && !confirm("إلغاء الطلب؟")) return;
                  mut.mutate(s);
                }}
              >
                {STATUS_LABEL_AR[s]}
              </Button>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">بيانات العميل</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="الاسم" value={order.customer_name} />
              <Row label="الهاتف" value={<span dir="ltr">{order.customer_phone}</span>} />
              <Row
                label="العنوان"
                value={`${order.customer_address}، ${order.customer_city}`}
              />
              {order.notes && <Row label="ملاحظات" value={order.notes} />}
              <Row label="نوع العميل" value={order.user_id ? "مسجّل" : "زائر"} />
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold">الفاتورة</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="المجموع" value={formatEgp(Number(order.subtotal))} />
              <Row label="رسوم التوصيل" value={formatEgp(Number(order.delivery_fee))} />
              <Separator className="my-2" />
              <Row label="الإجمالي" value={<b>{formatEgp(Number(order.total))}</b>} />
              <Row
                label="حالة المخزون"
                value={order.stock_deducted ? "تم الخصم" : "لم يُخصم"}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">المنتجات</h2>
          <ul className="mt-3 divide-y divide-border">
            {(order as any).order_items?.map((it: any) => (
              <li key={it.id} className="flex justify-between gap-3 py-3 text-sm">
                <span>
                  {it.product_name}
                  {it.variant_name ? ` — ${it.variant_name}` : ""}
                  <span className="text-muted-foreground"> × {it.quantity}</span>
                </span>
                <span className="tabular-nums">{formatEgp(Number(it.line_total))}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
