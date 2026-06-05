import { Link } from "@tanstack/react-router";
import { MessageCircle, Clock, MapPin } from "lucide-react";
import { SITE, waLink } from "@/lib/site-config";
import { Logo } from "./Logo";
import { PhonesList, useContactPhones } from "./ContactPhones";

export function Footer() {
  const phones = useContactPhones();
  const waPhone = phones[0] ?? SITE.whatsapp;
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/50 pb-20 md:pb-0">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Logo size={44} />
            <div className="leading-tight">
              <h3 className="font-display text-lg font-bold">{SITE.nameAr}</h3>
              <div className="text-[11px] text-muted-foreground">Shahd Markets</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            بقالتك المفضلة في {SITE.cityAr} — منتجات طازجة وتوصيل سريع لباب البيت.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold">تواصل معنا</h4>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {SITE.cityAr}</div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {SITE.workingHoursAr}</div>
          <PhonesList />
          <a href={waLink(undefined, waPhone)} target="_blank" rel="noreferrer"
             className="flex items-center gap-2 hover:text-primary">
            <MessageCircle className="h-4 w-4 text-primary" /> واتساب:
            <span className="num" dir="ltr">{waPhone}</span>
          </a>
        </div>
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold">روابط</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/categories" className="hover:text-primary">الأقسام</Link></li>
            <li><Link to="/cart" className="hover:text-primary">السلة</Link></li>
            <li><Link to="/account" className="hover:text-primary">حسابي</Link></li>
            <li><Link to="/login" className="hover:text-primary">تسجيل الدخول</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © Shahd Markets. All Rights Reserved.
      </div>
    </footer>
  );
}
