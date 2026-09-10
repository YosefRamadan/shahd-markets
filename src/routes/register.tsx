import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { checkAvailability } from "@/lib/auth.functions";
import { registerSchema } from "@/lib/validators";

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/account" });
  },
  head: () => ({ meta: [{ title: "إنشاء حساب — أسواق شهد الفيوم" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const check = useServerFn(checkAvailability);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setLoading(true);
    try {
      const avail = await check({
        data: { username: parsed.data.username, phone: parsed.data.phone },
      });
      if (!avail.usernameAvailable) {
        toast.error("اسم المستخدم محجوز");
        return;
      }
      if (!avail.phoneAvailable) {
        toast.error("رقم الموبايل مستخدم بالفعل");
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
          data: {
            full_name: parsed.data.full_name,
            username: parsed.data.username,
            phone: parsed.data.phone,
          },
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("تم إنشاء الحساب! تحقق من بريدك لتأكيد الحساب.");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <div className="container mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-bold">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            سجّل لتتبّع طلباتك ولحفظ عنوانك للتوصيل السريع.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">الاسم بالكامل</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required maxLength={120} dir="auto" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} required maxLength={254} dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input id="username" value={form.username} onChange={(e) => set("username", e.target.value)} required maxLength={32} dir="ltr" placeholder="ahmed_99" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">رقم الموبايل</Label>
                <Input id="phone" inputMode="numeric" value={form.phone} onChange={(e) => set("phone", e.target.value)} required maxLength={11} dir="ltr" placeholder="01xxxxxxxxx" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={8} maxLength={72} />
              <p className="text-xs text-muted-foreground">8 أحرف على الأقل.</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            لديك حساب؟{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              سجّل الدخول
            </Link>
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
