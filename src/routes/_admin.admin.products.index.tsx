import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم الحذف");
    load();
  };

  const catName = (id: string) => cats.find((c) => c.id === id)?.name_ar ?? "—";

  const visible = filter === "all" ? products : products.filter((p) => p.category_id === filter);

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-10">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4 rotate-180" />
          العودة للوحة
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">المنتجات</h1>
          <Button asChild>
            <Link to="/admin/products/$id" params={{ id: "new" }}>
              <Plus className="h-4 w-4" />
              منتج جديد
            </Link>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full border px-3 py-1 text-xs ${filter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
          >
            الكل
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`rounded-full border px-3 py-1 text-xs ${filter === c.id ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
            >
              {c.name_ar}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted/50 text-right">
              <tr>
                <th className="p-3">الصورة</th>
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
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">جاري التحميل...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">لا توجد منتجات.</td></tr>
              ) : visible.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    {p.image_url && <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                  </td>
                  <td className="p-3 font-semibold">{p.name_ar}</td>
                  <td className="p-3">{catName(p.category_id)}</td>
                  <td className="p-3 num">
                    {p.is_weight_based && p.price_per_kg != null
                      ? `${formatEgp(p.price_per_kg)}/كجم`
                      : formatEgp(p.base_price)}
                  </td>
                  <td className="p-3 num">{p.stock}</td>
                  <td className="p-3">
                    {p.is_weight_based ? <Badge>بالوزن</Badge> : <Badge variant="secondary">قطعة</Badge>}
                  </td>
                  <td className="p-3">{p.is_active ? "نشط" : "موقوف"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/admin/products/$id" params={{ id: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SiteShell>
  );
}
