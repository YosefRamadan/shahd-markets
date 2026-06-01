import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { profileUpdateSchema } from "@/lib/validators";

const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, phone, default_address, city")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileUpdateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const payload = {
      full_name: data.full_name,
      username: data.username || null,
      phone: data.phone,
      default_address: data.default_address || null,
      city: data.city || "الفيوم",
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({ meta: [{ title: "الملف الشخصي — أسواق شهد الفيوم" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    phone: "",
    default_address: "",
    city: "الفيوم",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        username: profile.username ?? "",
        phone: profile.phone ?? "",
        default_address: profile.default_address ?? "",
        city: profile.city ?? "الفيوم",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (input: typeof form) => saveProfile({ data: input }),
    onSuccess: () => {
      toast.success("تم حفظ التغييرات");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "حدث خطأ"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = profileUpdateSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    mutation.mutate(form);
  }

  if (isLoading) return <div className="text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <h1 className="text-2xl font-bold">الملف الشخصي</h1>
      <p className="mt-1 text-sm text-muted-foreground">عدّل بياناتك وعنوان التوصيل.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="full_name">الاسم بالكامل</Label>
          <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={120} required dir="auto" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} maxLength={32} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">رقم الموبايل</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={11} required dir="ltr" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="default_address">عنوان التوصيل</Label>
          <Textarea id="default_address" value={form.default_address} onChange={(e) => setForm({ ...form, default_address: e.target.value })} maxLength={500} rows={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">المدينة</Label>
          <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </form>
    </div>
  );
}
