import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut, ShoppingCart, User, ShieldCheck, Phone } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site-config";
import { cartQueryOptions } from "@/lib/cart.queries";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useContactPhones } from "./ContactPhones";

export function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const phones = useContactPhones();
  const primaryPhone = phones[0] ?? SITE.phone;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) { setIsStaff(false); return; }
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
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Logo size={42} />
          <div className="hidden min-w-0 leading-tight sm:block">
            <div className="truncate font-display text-base font-extrabold text-foreground sm:text-lg">
              {SITE.nameAr}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              Shahd Markets • {SITE.cityAr}
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <a
            href={`tel:${primaryPhone}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Phone className="h-4 w-4" />
            <span className="num" dir="ltr">{primaryPhone}</span>
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <CartButton />
          {session ? (
            <>
              {isStaff && (
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden md:inline">لوحة الإدارة</span>
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/account">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">حسابي</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm"
                onClick={async () => { await supabase.auth.signOut(); }}
                className="hidden sm:inline-flex">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">خروج</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/login"><LogIn className="h-4 w-4" /> دخول</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex">
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
    <Button variant="ghost" size="icon" asChild className="relative">
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
