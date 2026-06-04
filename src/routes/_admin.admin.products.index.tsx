import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "@/lib/catalog";
import { formatEgp } from "@/lib/site-config";

export const Route = createFileRoute("/_admin/admin/products/")({
  head: () => ({ meta: [{ title: "المنتجات — لوحة الإدارة" }] }),
  component: AdminProducts,
});

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setProducts((p ?? []) as Product[]);
    setCats((c ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("حذف المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  const catName = (id: string) => cats.find((c) => c.id === id)?.name_ar ?? "—";

  const visible = useMemo(() => {
    let list = filter === "all" ? products : products.filter((p) => p.category_id === filter);
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      list = list.filter((p) => p.name_ar.toLowerCase().includes(n));
    }
    return list;
  }, [products, filter, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">المنتجات</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            {products.length} منتج • {cats.length} قسم
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/products/$id" params={{ id: "new" }}>
            <Plus className="h-4 w-4" />
            منتج جديد
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث باسم المنتج..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-9 h-11"
          />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            الكل ({products.length})
          </button>
          {cats.map((c) => {
            const n = products.filter((p) => p.category_id === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                  filter === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {c.name_ar} ({n})
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))
        ) : visible.length === 0 ? (
          <EmptyState text="لا توجد منتجات مطابقة" />
        ) : (
          visible.map((p) => (
            <div
              key={p.id}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]"
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="h-20 w-20 shrink-0 rounded-xl bg-muted" />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{p.name_ar}</div>
                    <div className="text-xs text-muted-foreground">
                      {catName(p.category_id)}
                    </div>
                  </div>
                  {!p.is_active && (
                    <Badge variant="secondary" className="text-[10px]">
                      موقوف
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="num font-bold text-foreground">
                    {p.is_weight_based && p.price_per_kg != null
                      ? `${formatEgp(p.price_per_kg)}/كجم`
                      : formatEgp(p.base_price)}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className={`num ${p.stock <= 5 ? "text-destructive" : "text-muted-foreground"}`}>
                    {p.stock} مخزون
                  </span>
                </div>
                <div className="mt-2 flex justify-end gap-1">
                  <Button variant="ghost" size="sm" asChild className="h-8">
                    <Link to="/admin/products/$id" params={{ id: p.id }}>
                      <Pencil className="h-3.5 w-3.5" />
                      تعديل
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-right text-xs text-muted-foreground">
              <tr>
                <th className="p-3"></th>
                <th className="p-3">الاسم</th>
                <th className="p-3">القسم</th>
                <th className="p-3">السعر</th>
                <th className="p-3">المخزون</th>
                <th className="p-3">النوع</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    جاري التحميل...
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    لا توجد منتجات مطابقة.
                  </td>
                </tr>
              ) : (
                visible.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted" />
                      )}
                    </td>
                    <td className="p-3 font-semibold">{p.name_ar}</td>
                    <td className="p-3">{catName(p.category_id)}</td>
                    <td className="p-3 num">
                      {p.is_weight_based && p.price_per_kg != null
                        ? `${formatEgp(p.price_per_kg)}/كجم`
                        : formatEgp(p.base_price)}
                    </td>
                    <td className={`p-3 num ${p.stock <= 5 ? "text-destructive font-semibold" : ""}`}>
                      {p.stock}
                    </td>
                    <td className="p-3">
                      {p.is_weight_based ? (
                        <Badge>بالوزن</Badge>
                      ) : (
                        <Badge variant="secondary">قطعة</Badge>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {p.is_active ? (
                        <span className="text-emerald-700 dark:text-emerald-300">نشط</span>
                      ) : (
                        <span className="text-muted-foreground">موقوف</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/admin/products/$id" params={{ id: p.id }}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
