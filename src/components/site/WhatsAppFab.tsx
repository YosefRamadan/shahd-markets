import { MessageCircle } from "lucide-react";
import { SITE, waLink } from "@/lib/site-config";

export function WhatsAppFab() {
  return (
    <a
      href={waLink(`مرحبًا ${SITE.nameAr} 👋`)}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل عبر واتساب"
      className="group fixed bottom-24 end-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-elegant)] transition-transform hover:scale-105 active:scale-95 md:bottom-6"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" aria-hidden />
      <MessageCircle className="relative h-7 w-7" />
    </a>
  );
}
