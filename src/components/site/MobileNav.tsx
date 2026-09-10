import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { cartQueryOptions } from "@/lib/cart.queries";

const items = [
  { to: "/", label: "الرئيسية", Icon: Home, match: (p: string) => p === "/" },
  { to: "/categories", label: "الأقسام", Icon: LayoutGrid, match: (p: string) => p.startsWith("/categories") || p.startsWith("/products") },
  { to: "/cart", label: "السلة", Icon: ShoppingCart, match: (p: string) => p.startsWith("/cart") || p.startsWith("/checkout") },
  { to: "/account", label: "حسابي", Icon: User, match: (p: string) => p.startsWith("/account") || p.startsWith("/login") || p.startsWith("/register") },
] as const;

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useQuery({ ...cartQueryOptions, staleTime: 10_000 });
  const count = data?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, Icon, match }) => {
          const active = match(path);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {to === "/cart" && count > 0 && (
                    <span className="num absolute -end-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
