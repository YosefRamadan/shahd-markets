import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AlertTriangle, Search, Save, Warehouse } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatEgp } from "@/lib/site-config";
import {
  listInventory,
  updateStock,
  type InventoryRow,
} from "@/lib/admin.functions";

const LOW_THRESHOLD = 5;

export const Route = createFileRoute("/_admin/admin/inventory")({
  head: () => ({ meta: [{ title: "المخزون — لوحة الإدارة" }] }),
  component: InventoryPage,
});

function StockRow({
  row,
  onSaved,
}: {
  row: InventoryRow;
  onSaved: () => void;
}) {
  const updateFn = useServerFn(updateStock);
  const [value, setValue] = useState<number>(row.stock);
  const dirty = value !== row.stock;

  const mut = useMutation({
    mutationFn: () =>
      updateFn({ data: { kind: row.kind, id: row.id, stock: value } }),
    onSuccess: () => {
      toast.success("تم تحديث المخزون");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const out = row.stock === 0;
  const low = !out && row.stock <= LOW_THRESHOLD;

  return (
    <tr className="border-t border-border">
      <td className="p-3">
        {row.image_url ? (
          <img
            src={row.image_url}
            alt=""
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-muted" />
        )}
      </td>
      <td className="p-3">
        <div className="font-semibold">{row.product_name}</div>
        {row.variant_name && (
          <div className="text-xs text-muted-foreground">{row.variant_name}</div>
        )}
        <div className="mt-0.5 text-xs text-muted-foreground">
          {row.category_name ?? "—"}
        </div>
      </td>
      <td className="p-3">
        {row.kind === "variant" ? (
          <Badge variant="secondary">متغيّر</Badge>
        ) : row.is_weight_based ? (
          <Badge>بالوزن</Badge>
        ) : (
          <Badge variant="secondary">قطعة</Badge>
        )}
      </td>
      <td className="p-3 num">{formatEgp(row.price)}</td>
      <td className="p-3">
        {out ? (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            غير متوفر
          </span>
        ) : low ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
            منخفض
          </span>
        ) : (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
            متاح
          </span>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
            className="num h-8 w-24"
          />
          <Button
            size="sm"
            variant={dirty ? "default" : "ghost"}
            disabled={!dirty || mut.isPending}
            onClick={() => mut.mutate()}
          >
            <Save className="h-3.5 w-3.5" />
            حفظ
          </Button>
        </div>
      </td>
    </tr>
  );
}

function InventoryPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listInventory);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: () => fn(),
  });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const rows = useMemo(() => {
    const all = data ?? [];
    return all.filter((r) => {
      if (filter === "low" && !(r.stock > 0 && r.stock <= LOW_THRESHOLD))
        return false;
      if (filter === "out" && r.stock !== 0) return false;
      if (q) {
        const needle = q.trim().toLowerCase();
        const hay = `${r.product_name} ${r.variant_name ?? ""} ${r.category_name ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data, q, filter]);

  const totals = useMemo(() => {
    const all = data ?? [];
    return {
      total: all.length,
      low: all.filter((r) => r.stock > 0 && r.stock <= LOW_THRESHOLD).length,
      out: all.filter((r) => r.stock === 0).length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Warehouse className="h-6 w-6 text-primary" />
          المخزون
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          متابعة المخزون وتحديث الكميات لكل المنتجات والمتغيّرات.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">إجمالي العناصر</div>
            <div className="num mt-1 text-2xl font-bold">{totals.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">مخزون منخفض</div>
            <div className="num mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {totals.low}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">غير متوفر</div>
            <div className="num mt-1 text-2xl font-bold text-destructive">
              {totals.out}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث باسم المنتج أو القسم..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {([
            ["all", "الكل"],
            ["low", "منخفض"],
            ["out", "غير متوفر"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {totals.low + totals.out > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          هناك {totals.out} منتج غير متوفر و {totals.low} منتج بمخزون منخفض — يُنصح بإعادة التخزين.
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/40 text-right text-xs text-muted-foreground">
            <tr>
              <th className="p-3">الصورة</th>
              <th className="p-3">المنتج</th>
              <th className="p-3">النوع</th>
              <th className="p-3">السعر</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">المخزون</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td colSpan={6} className="p-3">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  لا توجد عناصر مطابقة.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <StockRow
                  key={`${r.kind}-${r.id}`}
                  row={r}
                  onSaved={() => {
                    qc.invalidateQueries({ queryKey: ["admin-inventory"] });
                    qc.invalidateQueries({ queryKey: ["admin-overview"] });
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
