import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, X, Loader2 } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getOrder,
  cancelMyOrder,
  updateMyOrder,
  STATUS_LABEL_AR,
  type OrderStatus,
} from "@/lib/orders";
import { formatEgp, SITE } from "@/lib/site-config";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({ meta: [{ title: `تفاصيل الطلب — ${SITE.nameAr}` }] }),
  component: OrderDetailsPage,
});

const STATUS_TONE: Record<OrderStatus, string> = {
  placed: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  preparing: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  out_for_delivery: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-destructive/10 text-destructive",
};

function OrderDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getOrder);
  const cancelFn = useServerFn(cancelMyOrder);
  const updateFn = useServerFn(updateMyOrder);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    customer_city: "الفيوم",
    notes: "",
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم إلغاء الطلب");
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id,
          ...form,
          notes: form.notes || null,
        },
      }),
    onSuccess: () => {
      toast.success("تم تحديث الطلب");
      setEditOpen(false);
      qc.invalidateQueries({ queryKey: ["order", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openEdit() {
    if (!order) return;
    setForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      customer_city: order.customer_city,
      notes: order.notes ?? "",
    });
    setEditOpen(true);
  }

  if (isLoading || !order) {
    return (
      <SiteShell>
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </SiteShell>
    );
  }

  const status = order.status as OrderStatus;
  const canModify = status === "placed";

  return (
    <SiteShell>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate({ to: "/account/orders" })}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> طلباتي
        </button>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">طلب {order.order_number}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString("ar-EG")}
            </p>
          </div>
          <Badge className={STATUS_TONE[status]}>{STATUS_LABEL_AR[status]}</Badge>
        </div>

        {canModify && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="ml-1 h-4 w-4" /> تعديل البيانات
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("إلغاء الطلب؟")) cancelMut.mutate();
              }}
              disabled={cancelMut.isPending}
            >
              <X className="ml-1 h-4 w-4" /> إلغاء الطلب
            </Button>
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-semibold">بيانات التوصيل</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <dt className="text-muted-foreground">الاسم</dt>
              <dd>{order.customer_name}</dd>
              <dt className="text-muted-foreground">الهاتف</dt>
              <dd dir="ltr">{order.customer_phone}</dd>
              <dt className="text-muted-foreground">العنوان</dt>
              <dd>
                {order.customer_address}، {order.customer_city}
              </dd>
              {order.notes && (
                <>
                  <dt className="text-muted-foreground">ملاحظات</dt>
                  <dd>{order.notes}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-semibold">الفاتورة</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="المجموع" value={formatEgp(Number(order.subtotal))} />
              <Row label="رسوم التوصيل" value={formatEgp(Number(order.delivery_fee))} />
              <Separator className="my-2" />
              <Row label="الإجمالي" value={formatEgp(Number(order.total))} bold />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-semibold">المنتجات</h2>
          <ul className="mt-3 divide-y divide-border">
            {(order as any).order_items?.map((it: any) => (
              <li key={it.id} className="flex justify-between gap-3 py-3 text-sm">
                <span className="truncate">
                  {it.product_name}
                  {it.variant_name ? ` — ${it.variant_name}` : ""}
                  <span className="text-muted-foreground"> × {it.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatEgp(Number(it.line_total))}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 text-center text-sm">
          <Link to="/" className="text-primary hover:underline">
            متابعة التسوق
          </Link>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>الاسم</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </div>
            <div>
              <Label>الهاتف</Label>
              <Input
                dir="ltr"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
            </div>
            <div>
              <Label>العنوان</Label>
              <Textarea
                rows={2}
                value={form.customer_address}
                onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
              />
            </div>
            <div>
              <Label>المدينة</Label>
              <Input
                value={form.customer_city}
                onChange={(e) => setForm({ ...form, customer_city: e.target.value })}
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
