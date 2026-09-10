import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { resolveLoginIdentifier } from "@/lib/auth.functions";
import { loginSchema } from "@/lib/validators";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const ok = roles?.some((r) => r.role === "admin" || r.role === "manager");
      if (ok) throw redirect({ to: "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "دخول الإدارة — أسواق شهد الفيوم" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const resolve = useServerFn(resolveLoginIdentifier);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setLoading(true);
    try {
      const generic = "بيانات الدخول غير صحيحة";
      const { email } = await resolve({ data: { identifier: parsed.data.identifier } });
      if (!email) return toast.error(generic);
      const { data: signIn, error } = await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.password,
      });
      if (error || !signIn.user) return toast.error(generic);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", signIn.user.id);
      const ok = roles?.some((r) => r.role === "admin" || r.role === "manager");
      if (!ok) {
        await supabase.auth.signOut();
        toast.error("هذا الحساب لا يملك صلاحيات الإدارة");
        return;
      }
      toast.success("مرحبًا بك في لوحة الإدارة");
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <div className="container mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">دخول الإدارة</h1>
              <p className="text-xs text-muted-foreground">للموظفين المخوّلين فقط</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="identifier">البريد / اسم المستخدم / الموبايل</Label>
              <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" maxLength={120} dir="auto" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" maxLength={72} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول الإدارة"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            عميل؟ <Link to="/login" className="text-primary hover:underline">تسجيل دخول العملاء</Link>
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
