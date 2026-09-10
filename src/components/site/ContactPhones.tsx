import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site-config";

export function useContactPhones(): string[] {
  const [phones, setPhones] = useState<string[]>(SITE.phones as string[]);
  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "contact_phones")
      .maybeSingle()
      .then(({ data }) => {
        const raw = (data?.value as unknown) ?? [];
        if (Array.isArray(raw) && raw.length) {
          setPhones(raw.map((v) => String(v)).filter(Boolean));
        }
      });
  }, []);
  return phones;
}

export function PhonesList({ className }: { className?: string }) {
  const phones = useContactPhones();
  return (
    <div className={"space-y-1 " + (className ?? "")}>
      {phones.map((p) => (
        <a
          key={p}
          href={`tel:${p}`}
          className="flex items-center gap-2 hover:text-primary"
        >
          <Phone className="h-4 w-4 text-primary" />
          <span className="num" dir="ltr">{p}</span>
        </a>
      ))}
    </div>
  );
}
