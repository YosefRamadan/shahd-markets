import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut, ShoppingCart, User, ShieldCheck, Phone } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site-config";
import { cartQueryOptions } from "@/lib/cart.queries";

export function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsStaff(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .then(({ data }) => {
        setIsStaff(!!data?.some((r) => r.role === "admin" || r.role === "manager"));
      });
  }, [session?.user?.id]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground shadow-[var(--shadow-soft)]"
            style={{ background: "var(--gradient-primary)" }}
            aria-hidden
          >
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-extrabold text-foreground">
              {SITE.nameAr}
            </div>
            <div className="text-[11px] text-muted-foreground">Shahd Markets • {SITE.cityAr}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <a
            href={`tel:${SITE.phone}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Phone className="h-4 w-4" />
            <span className="num">{SITE.phone}</span>
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <CartButton />
          {session ? (
            <>
              {isStaff && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    لوحة الإدارة
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/account">
                  <User className="h-4 w-4" />
                  حسابي
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  دخول
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">إنشاء حساب</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function CartButton() {
  const { data } = useQuery({ ...cartQueryOptions, staleTime: 10_000 });
  const count = data?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;
  return (
    <Button variant="ghost" size="sm" asChild className="relative">
      <Link to="/cart" aria-label="السلة">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="num absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
