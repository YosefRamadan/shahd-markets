import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  clearCart,
  removeCartItem,
  updateCartItem,
  type CartLine,
} from "@/lib/cart.functions";
import { cartQueryOptions } from "@/lib/cart.queries";
import { formatEgp, SITE } from "@/lib/site-config";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: `سلة المشتريات — ${SITE.nameAr}` }],
  }),
  component: CartPage,
});

function CartPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(cartQueryOptions);

  const updateFn = useServerFn(updateCartItem);
  const removeFn = useServerFn(removeCartItem);
  const clearFn = useServerFn(clearCart);

  const updateMutation = useMutation({
    mutationFn: (vars: { item_id: string; quantity: number }) =>
      updateFn({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (item_id: string) => removeFn({ data: { item_id } }),
    onSuccess: () => {
      toast.success("تم حذف العنصر");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => {
      toast.success("تم تفريغ السلة");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  if (isLoading || !data) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-10">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </SiteShell>
    );
  }

  const isEmpty = data.lines.length === 0;

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-8">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <ShoppingBag className="h-6 w-6 text-primary" />
          سلة المشتريات
        </h1>

        {isEmpty ? (
          <div className="mt-12 grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold">سلتك فارغة</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ابدأ التسوق من أقسامنا واستمتع بالتوصيل داخل {SITE.cityAr}
            </p>
            <Button asChild className="mt-6">
              <Link to="/categories">
                <ArrowLeft className="h-4 w-4" />
                تصفح المنتجات
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {data.lines.map((line) => (
                <CartLineRow
                  key={line.id}
                  line={line}
                  onUpdate={(q) =>
                    updateMutation.mutate({ item_id: line.id, quantity: q })
                  }
                  onRemove={() => removeMutation.mutate(line.id)}
                  busy={updateMutation.isPending || removeMutation.isPending}
                />
              ))}

              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("تفريغ السلة بالكامل؟")) clearMutation.mutate();
                  }}
                  disabled={clearMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  تفريغ السلة
                </Button>
              </div>
            </div>

            <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20">
              <h2 className="text-lg font-bold">ملخص الطلب</h2>
              <Separator />
              <div className="space-y-2 text-sm">
                <Row label="الإجمالي الفرعي" value={formatEgp(data.subtotal)} />
                <Row
                  label="رسوم التوصيل"
                  value={formatEgp(data.delivery_fee)}
                />
              </div>
              <Separator />
              <Row
                label={<span className="text-base font-bold">الإجمالي</span>}
                value={
                  <span className="num text-xl font-extrabold text-primary">
                    {formatEgp(data.total)}
                  </span>
                }
              />
              {!data.meets_minimum && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  الحد الأدنى للطلب{" "}
                  <span className="num font-bold">{formatEgp(data.min_order)}</span>
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                disabled={
                  !data.meets_minimum || data.lines.some((l) => !l.in_stock)
                }
                asChild
              >
                <Link to="/checkout">إتمام الطلب</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                الدفع عند الاستلام داخل {SITE.cityAr}
              </p>
            </aside>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="num">{value}</span>
    </div>
  );
}

function CartLineRow({
  line,
  onUpdate,
  onRemove,
  busy,
}: {
  line: CartLine;
  onUpdate: (q: number) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const maxReached = line.quantity >= line.available_units;

  return (
    <div
      className={[
        "flex gap-4 rounded-2xl border border-border bg-card p-3",
        !line.in_stock ? "opacity-70" : "",
      ].join(" ")}
    >
      <Link
        to="/products/$slug"
        params={{ slug: line.product_slug }}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        {line.image_url && (
          <img
            src={line.image_url}
            alt={line.product_name}
            className="h-full w-full object-cover"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to="/products/$slug"
              params={{ slug: line.product_slug }}
              className="line-clamp-1 font-semibold hover:text-primary"
            >
              {line.product_name}
            </Link>
            {line.variant_name && (
              <div className="text-xs text-muted-foreground">{line.variant_name}</div>
            )}
            <div className="num mt-1 text-sm text-muted-foreground">
              {formatEgp(line.unit_price)} للوحدة
            </div>
            {line.issue && (
              <Badge variant="destructive" className="mt-1 text-[10px]">
                {line.issue}
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="inline-flex items-center rounded-xl border border-border bg-background">
            <button
              type="button"
              className="p-2 disabled:opacity-50"
              disabled={busy || line.quantity <= 1}
              onClick={() => onUpdate(line.quantity - 1)}
              aria-label="إنقاص"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="num w-10 text-center font-semibold">{line.quantity}</span>
            <button
              type="button"
              className="p-2 disabled:opacity-50"
              disabled={busy || maxReached || !line.in_stock}
              onClick={() => onUpdate(line.quantity + 1)}
              aria-label="زيادة"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="num text-base font-bold text-primary">
            {formatEgp(line.line_total)}
          </div>
        </div>
      </div>
    </div>
  );
}
