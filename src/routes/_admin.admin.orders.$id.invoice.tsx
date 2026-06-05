import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";

import { getOrder } from "@/lib/orders.functions";
import { STATUS_LABEL_AR, type OrderStatus } from "@/lib/orders";
import { formatEgp, SITE } from "@/lib/site-config";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/orders/$id/invoice")({
  head: () => ({ meta: [{ title: "فاتورة — أسواق شهد الفيوم" }] }),
  component: InvoicePage,
});

function InvoicePage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getOrder);
  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getFn({ data: { id } }),
  });

  useEffect(() => {
    if (order) {
      const t = setTimeout(() => window.print(), 350);
      return () => clearTimeout(t);
    }
  }, [order]);

  if (isLoading || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const items = (order as any).order_items ?? [];

  return (
    <div className="invoice-root mx-auto max-w-3xl bg-white px-6 py-8 text-slate-900 print:px-4 print:py-2">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
        .invoice-root { font-family: 'Tajawal', system-ui, sans-serif; }
      `}</style>

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/orders/$id" params={{ id }}>
            <ArrowLeft className="h-4 w-4" /> العودة للطلب
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> طباعة
        </Button>
      </div>

      <header className="flex items-start justify-between gap-4 border-b-2 border-amber-400 pb-4">
        <div className="flex items-center gap-3">
          <Logo size={64} />
          <div>
            <h1 className="text-xl font-extrabold">{SITE.nameAr}</h1>
            <div className="text-xs text-slate-600">Shahd Markets • {SITE.cityAr}</div>
            <div className="num text-xs text-slate-600" dir="ltr">{SITE.phone}</div>
          </div>
        </div>
        <div className="text-end">
          <div className="text-lg font-bold">فاتورة</div>
          <div className="num text-sm font-semibold">{order.order_number}</div>
          <div className="text-xs text-slate-600">
            {new Date(order.created_at).toLocaleString("ar-EG")}
          </div>
          <div className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
            {STATUS_LABEL_AR[order.status as OrderStatus]}
          </div>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <h2 className="mb-1 font-bold">بيانات العميل</h2>
          <div>{order.customer_name}</div>
          <div className="num" dir="ltr">{order.customer_phone}</div>
        </div>
        <div>
          <h2 className="mb-1 font-bold">عنوان التوصيل</h2>
          <div>{order.customer_address}</div>
          <div className="text-slate-600">{order.customer_city}</div>
        </div>
      </section>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-amber-100 text-right">
            <th className="border border-slate-300 p-2">المنتج</th>
            <th className="border border-slate-300 p-2">الكمية</th>
            <th className="border border-slate-300 p-2">سعر الوحدة</th>
            <th className="border border-slate-300 p-2">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it: any) => (
            <tr key={it.id}>
              <td className="border border-slate-300 p-2">
                {it.product_name}
                {it.variant_name ? ` — ${it.variant_name}` : ""}
              </td>
              <td className="border border-slate-300 p-2 num">{it.quantity}</td>
              <td className="border border-slate-300 p-2 num">{formatEgp(Number(it.unit_price))}</td>
              <td className="border border-slate-300 p-2 num">{formatEgp(Number(it.line_total))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ms-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><span>المجموع</span><span className="num">{formatEgp(Number(order.subtotal))}</span></div>
        <div className="flex justify-between"><span>رسوم التوصيل</span><span className="num">{formatEgp(Number(order.delivery_fee))}</span></div>
        <div className="mt-1 flex justify-between border-t-2 border-slate-300 pt-2 text-base font-extrabold">
          <span>الإجمالي</span><span className="num">{formatEgp(Number(order.total))}</span>
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-xs text-slate-600">
        شكرًا لتسوقك من {SITE.nameAr} — © Shahd Markets
      </footer>
    </div>
  );
}
