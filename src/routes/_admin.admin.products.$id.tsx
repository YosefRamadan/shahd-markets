import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product, ProductVariant } from "@/lib/catalog";
import { WEIGHT_OPTIONS, slugify } from "@/lib/catalog";

export const Route = createFileRoute("/_admin/admin/products/$id")({
  head: () => ({ meta: [{ title: "تعديل منتج — لوحة الإدارة" }] }),
  component: ProductEditor,
});

type Draft = {
  name_ar: string;
  slug: string;
  description_ar: string;
  image_url: string;
  category_id: string;
  base_price: number;
  stock: number;
  is_weight_based: boolean;
  weight_options_grams: number[];
  price_per_kg: number | null;
  unit_label_ar: string;
  is_active: boolean;
  sort_order: number;
};

function ProductEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [cats, setCats] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Draft>({
    name_ar: "",
    slug: "",
    description_ar: "",
    image_url: "",
    category_id: "",
    base_price: 0,
    stock: 0,
    is_weight_based: false,
    weight_options_grams: [...WEIGHT_OPTIONS],
    price_per_kg: null,
    unit_label_ar: "",
    is_active: true,
    sort_order: 0,
  });
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("categories").select("*").order("sort_order");
      setCats((c ?? []) as Category[]);
      if (!isNew) {
        const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
        if (p) {
          const prod = p as Product;
          setDraft({
            name_ar: prod.name_ar,
            slug: prod.slug,
            description_ar: prod.description_ar ?? "",
            image_url: prod.image_url ?? "",
            category_id: prod.category_id,
            base_price: Number(prod.base_price),
            stock: prod.stock,
            is_weight_based: prod.is_weight_based,
            weight_options_grams: prod.weight_options_grams.length ? prod.weight_options_grams : [...WEIGHT_OPTIONS],
            price_per_kg: prod.price_per_kg != null ? Number(prod.price_per_kg) : null,
            unit_label_ar: prod.unit_label_ar ?? "",
            is_active: prod.is_active,
            sort_order: prod.sort_order,
          });
          const { data: v } = await supabase
            .from("product_variants")
            .select("*")
            .eq("product_id", id)
            .order("sort_order");
          setVariants((v ?? []) as ProductVariant[]);
        }
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const toggleWeight = (g: number) => {
    setDraft((d) => ({
      ...d,
      weight_options_grams: d.weight_options_grams.includes(g)
        ? d.weight_options_grams.filter((x) => x !== g)
        : [...d.weight_options_grams, g].sort((a, b) => a - b),
    }));
  };

  const save = async () => {
    if (!draft.name_ar.trim() || !draft.category_id) {
      toast.error("الاسم والقسم مطلوبان");
      return;
    }
    const payload = {
      name_ar: draft.name_ar.trim(),
      slug: draft.slug.trim() || slugify(draft.name_ar),
      description_ar: draft.description_ar.trim() || null,
      image_url: draft.image_url.trim() || null,
      category_id: draft.category_id,
      base_price: draft.base_price,
      stock: draft.stock,
      is_weight_based: draft.is_weight_based,
      weight_options_grams: draft.is_weight_based ? draft.weight_options_grams : [],
      price_per_kg: draft.is_weight_based ? draft.price_per_kg : null,
      unit_label_ar: draft.unit_label_ar.trim() || null,
      is_active: draft.is_active,
      sort_order: draft.sort_order,
    };
    setSaving(true);
    if (isNew) {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("تم الإنشاء");
      navigate({ to: "/admin/products/$id", params: { id: data!.id } });
    } else {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("تم الحفظ");
    }
  };

  // ===== Variants =====
  const addVariant = async () => {
    if (isNew) {
      toast.error("احفظ المنتج أولًا");
      return;
    }
    const { data, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: id,
        name_ar: "متغيّر جديد",
        price: 0,
        stock: 0,
        sort_order: variants.length + 1,
      })
      .select("*")
      .single();
    if (error) return toast.error(error.message);
    setVariants((vs) => [...vs, data as ProductVariant]);
  };

  const updateVariant = (vid: string, patch: Partial<ProductVariant>) => {
    setVariants((vs) => vs.map((v) => (v.id === vid ? { ...v, ...patch } : v)));
  };

  const saveVariant = async (v: ProductVariant) => {
    const { error } = await supabase
      .from("product_variants")
      .update({
        name_ar: v.name_ar,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        is_active: v.is_active,
        sort_order: v.sort_order,
      })
      .eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ المتغيّر");
  };

  const deleteVariant = async (vid: string) => {
    if (!confirm("حذف هذا المتغيّر؟")) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", vid);
    if (error) return toast.error(error.message);
    setVariants((vs) => vs.filter((v) => v.id !== vid));
  };

  if (loading) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-10">جاري التحميل...</div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-10">
        <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4 rotate-180" />
          المنتجات
        </Link>
        <h1 className="mt-4 text-2xl font-bold">{isNew ? "منتج جديد" : "تعديل المنتج"}</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold">المعلومات الأساسية</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>الاسم</Label>
                  <Input value={draft.name_ar} onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })} />
                </div>
                <div>
                  <Label>المعرّف (slug)</Label>
                  <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="auto" dir="ltr" />
                </div>
                <div>
                  <Label>القسم</Label>
                  <Select value={draft.category_id} onValueChange={(v) => setDraft({ ...draft, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>الوصف</Label>
                  <Textarea value={draft.description_ar} onChange={(e) => setDraft({ ...draft, description_ar: e.target.value })} rows={3} />
                </div>
                <div className="sm:col-span-2">
                  <Label>رابط الصورة</Label>
                  <Input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} dir="ltr" />
                </div>
                <div>
                  <Label>وحدة العرض (قطعة، كيس، علبة...)</Label>
                  <Input value={draft.unit_label_ar} onChange={(e) => setDraft({ ...draft, unit_label_ar: e.target.value })} />
                </div>
                <div>
                  <Label>ترتيب العرض</Label>
                  <Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold">السعر والمخزون</h2>
              <div className="flex items-center gap-3">
                <Switch checked={draft.is_weight_based} onCheckedChange={(v) => setDraft({ ...draft, is_weight_based: v })} />
                <Label>منتج بالوزن</Label>
              </div>

              {draft.is_weight_based ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>السعر لكل كجم (ج.م)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={draft.price_per_kg ?? 0}
                      onChange={(e) => setDraft({ ...draft, price_per_kg: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>الكمية المتاحة (كجم تقريبًا)</Label>
                    <Input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>الأوزان المتاحة للطلب</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {WEIGHT_OPTIONS.map((g) => {
                        const on = draft.weight_options_grams.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleWeight(g)}
                            className={`rounded-xl border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                          >
                            {g >= 1000 ? `${g / 1000} كجم` : `${g} جم`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>السعر (ج.م)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={draft.base_price}
                      onChange={(e) => setDraft({ ...draft, base_price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>المخزون</Label>
                    <Input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold">الحالة</h2>
              <div className="flex items-center gap-3">
                <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
                <Label>منشور</Label>
              </div>
              <Button className="mt-4 w-full" onClick={save} disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ المنتج"}
              </Button>
            </div>
          </div>
        </div>

        {/* Variants */}
        {!isNew && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">المتغيّرات (الأحجام/الأنواع)</h2>
              <Button variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4" />
                إضافة متغيّر
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              عند وجود متغيّرات، السعر والمخزون يُحسبان لكل متغيّر على حدة.
            </p>

            {variants.length === 0 ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">لا توجد متغيّرات. استخدم زر "إضافة متغيّر".</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="bg-muted/50 text-right">
                    <tr>
                      <th className="p-2">الاسم</th>
                      <th className="p-2">SKU</th>
                      <th className="p-2">السعر</th>
                      <th className="p-2">المخزون</th>
                      <th className="p-2">ترتيب</th>
                      <th className="p-2">نشط</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id} className="border-t border-border align-top">
                        <td className="p-2"><Input value={v.name_ar} onChange={(e) => updateVariant(v.id, { name_ar: e.target.value })} /></td>
                        <td className="p-2"><Input value={v.sku ?? ""} onChange={(e) => updateVariant(v.id, { sku: e.target.value })} dir="ltr" /></td>
                        <td className="p-2 w-28"><Input type="number" step="0.01" value={v.price} onChange={(e) => updateVariant(v.id, { price: Number(e.target.value) })} /></td>
                        <td className="p-2 w-24"><Input type="number" value={v.stock} onChange={(e) => updateVariant(v.id, { stock: Number(e.target.value) })} /></td>
                        <td className="p-2 w-20"><Input type="number" value={v.sort_order} onChange={(e) => updateVariant(v.id, { sort_order: Number(e.target.value) })} /></td>
                        <td className="p-2"><Switch checked={v.is_active} onCheckedChange={(b) => updateVariant(v.id, { is_active: b })} /></td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => saveVariant(v)}>حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteVariant(v.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
