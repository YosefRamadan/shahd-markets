import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { forgotPasswordSchema } from "@/lib/validators";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "استعادة كلمة المرور — أسواق شهد الفيوم" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بريد غير صحيح");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك.");
  }

  return (
    <SiteShell>
      <div className="container mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-bold">نسيت كلمة المرور</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أدخل بريدك وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
          </p>
          {sent ? (
            <div className="mt-6 rounded-lg bg-accent p-4 text-sm">
              تحقق من بريدك (وصندوق السبام) واتبع الرابط لإكمال العملية.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري الإرسال..." : "إرسال رابط الإعادة"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">العودة لتسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
