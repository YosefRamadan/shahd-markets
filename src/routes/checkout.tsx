import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin, Phone, User as UserIcon } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cartQueryOptions } from "@/lib/cart.queries";
import { createOrder } from "@/lib/orders.functions";
import { formatEgp, SITE } from "@/lib/site-config";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: `إتمام الطلب — ${SITE.nameAr}` }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading } = useQuery(cartQueryOptions);
  const createFn = useServerFn(createOrder);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    customer_city: "الفيوم",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,phone,default_address,city")
        .eq("id", uid)
        .maybeSingle();
      if (profile) {
        setForm((f) => ({
          ...f,
          customer_name: f.customer_name || profile.full_name || "",
          customer_phone: f.customer_phone || profile.phone || "",
          customer_address: f.customer_address || profile.default_address || "",
          customer_city: profile.city || f.customer_city,
        }));
      }
    });
  }, []);

  if (isLoading) {
    return (
      <SiteShell>
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </SiteShell>
    );
  }

  const validLines = cart?.lines.filter((l) => l.in_stock) ?? [];
  const empty = validLines.length === 0;
  const belowMin = cart ? !cart.meets_minimum : true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (empty) return toast.error("السلة فارغة");
    if (belowMin) return toast.error(`الحد الأدنى للطلب ${cart?.min_order} ج.م`);
    setSubmitting(true);
    try {
      const res = await createFn({ data: { ...form, notes: form.notes || null } });
      toast.success(`تم استلام طلبك ${res.order_number}`);
      navigate({ to: "/orders/$id", params: { id: res.id } });
    } catch (err: any) {
      toast.error(err?.message || "تعذر إتمام الطلب");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-8">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> العودة للسلة
        </Link>
        <h1 className="mt-2 text-2xl font-bold">إتمام الطلب</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
          >
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> الاسم بالكامل
              </Label>
              <Input
                id="name"
                required
                maxLength={80}
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="مثال: محمد أحمد"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> رقم الهاتف
              </Label>
              <Input
                id="phone"
                required
                inputMode="tel"
                dir="ltr"
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> العنوان بالتفصيل
                </Label>
                <Textarea
                  id="address"
                  required
                  rows={3}
                  maxLength={300}
                  value={form.customer_address}
                  onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                  placeholder="الشارع، الحي، رقم المنزل، علامة مميزة"
                />
              </div>
              <div>
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  required
                  value={form.customer_city}
                  onChange={(e) => setForm({ ...form, customer_city: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                rows={2}
                maxLength={500}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="مثال: اتصل عند الوصول"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || empty || belowMin}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `تأكيد الطلب — ${formatEgp(cart?.total ?? 0)}`
              )}
            </Button>
            {belowMin && (
              <p className="text-center text-xs text-destructive">
                الحد الأدنى للطلب {cart?.min_order} ج.م
              </p>
            )}
          </form>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold">ملخص الطلب</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {validLines.map((l) => (
                <li key={l.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {l.product_name}
                    {l.variant_name ? ` — ${l.variant_name}` : ""}
                    <span className="text-muted-foreground"> × {l.quantity}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatEgp(l.line_total)}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <Row label="المجموع" value={formatEgp(cart?.subtotal ?? 0)} />
              <Row
                label="رسوم التوصيل"
                value={cart?.delivery_fee === 0 ? "مجاني" : formatEgp(cart?.delivery_fee ?? 0)}
              />
              <Separator className="my-2" />
              <Row label="الإجمالي" value={formatEgp(cart?.total ?? 0)} bold />
            </div>
          </aside>
        </div>
      </div>
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
