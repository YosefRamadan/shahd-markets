import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/catalog";
import { slugify } from "@/lib/catalog";

export const Route = createFileRoute("/_admin/admin/categories")({
  head: () => ({ meta: [{ title: "الأقسام — لوحة الإدارة" }] }),
  component: AdminCategories,
});

function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setItems((data ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("لا يمكن الحذف. تأكد من عدم وجود منتجات مرتبطة.");
      return;
    }
    toast.success("تم الحذف");
    load();
  };

  return (
    <>
      <div className="container mx-auto px-4 py-10">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4 rotate-180" />
          العودة للوحة
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">الأقسام</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4" />
                قسم جديد
              </Button>
            </DialogTrigger>
            <CategoryDialog
              key={editing?.id ?? "new"}
              initial={editing}
              onSaved={() => {
                setOpen(false);
                setEditing(null);
                load();
              }}
            />
          </Dialog>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-right">
              <tr>
                <th className="p-3">الصورة</th>
                <th className="p-3">الاسم</th>
                <th className="p-3">المعرّف</th>
                <th className="p-3">ترتيب</th>
                <th className="p-3">نشط</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">جاري التحميل...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">لا توجد أقسام بعد.</td></tr>
              ) : items.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3">
                    {c.image_url && <img src={c.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                  </td>
                  <td className="p-3 font-semibold">{c.name_ar}</td>
                  <td className="p-3 num text-muted-foreground">{c.slug}</td>
                  <td className="p-3 num">{c.sort_order}</td>
                  <td className="p-3">{c.is_active ? "نعم" : "لا"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
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
    </>
  );
}

function CategoryDialog({
  initial,
  onSaved,
}: {
  initial: Category | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name_ar ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [image, setImage] = useState(initial?.image_url ?? "");
  const [sort, setSort] = useState(initial?.sort_order ?? 0);
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    const finalSlug = slug.trim() || slugify(name);
    setSaving(true);
    const payload = {
      name_ar: name.trim(),
      slug: finalSlug,
      image_url: image.trim() || null,
      sort_order: sort,
      is_active: active,
    };
    const { error } = initial
      ? await supabase.from("categories").update(payload).eq("id", initial.id)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم الحفظ");
    onSaved();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{initial ? "تعديل القسم" : "قسم جديد"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div>
          <Label>الاسم بالعربي</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فواكه" />
        </div>
        <div>
          <Label>المعرّف (slug)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="fruits" />
        </div>
        <div>
          <Label>رابط الصورة</Label>
          <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." dir="ltr" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>الترتيب</Label>
            <Input type="number" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
          </div>
          <div className="flex items-end gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label>نشط</Label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
