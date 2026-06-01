import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, Clock, MapPin } from "lucide-react";
import { SITE, waLink } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/50">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-bold">{SITE.nameAr}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            بقالتك المفضلة في {SITE.cityAr} — منتجات طازجة وتوصيل سريع لباب البيت.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {SITE.cityAr}</div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {SITE.workingHoursAr}</div>
          <a href={`tel:${SITE.phone}`} className="flex items-center gap-2 hover:text-primary">
            <Phone className="h-4 w-4 text-primary" /> <span className="num">{SITE.phone}</span>
          </a>
          <a href={waLink()} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary">
            <MessageCircle className="h-4 w-4 text-primary" /> واتساب: <span className="num">{SITE.whatsapp}</span>
          </a>
        </div>
        <div className="space-y-2 text-sm">
          <h4 className="font-semibold">روابط</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li><Link to="/login" className="hover:text-primary">تسجيل الدخول</Link></li>
            <li><Link to="/register" className="hover:text-primary">إنشاء حساب</Link></li>
            <li><Link to="/account" className="hover:text-primary">حسابي</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE.nameAr}
      </div>
    </footer>
  );
}
