import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/orders")({
  head: () => ({ meta: [{ title: "طلباتي — أسواق شهد الفيوم" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <h1 className="text-2xl font-bold">طلباتي السابقة</h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-muted/40 p-10 text-center">
        <Package className="h-12 w-12 text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          لا توجد طلبات بعد. سيظهر هنا سجل طلباتك بمجرد تفعيل نظام الطلبات.
        </p>
      </div>
    </div>
  );
}
