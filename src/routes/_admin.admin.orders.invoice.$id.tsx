import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { InvoicePageShell } from "@/components/invoice/InvoicePageShell";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site-config";

export const Route = createFileRoute("/_admin/admin/orders/invoice/$id")({
  head: () => ({
    meta: [
      { title: `فاتورة الطلب — ${SITE.nameAr}` },
      { name: "description", content: "فاتورة طلب قابلة للطباعة بمقاسات A4 و80 مم و58 مم." },
      { property: "og:title", content: `فاتورة الطلب — ${SITE.nameAr}` },
      { property: "og:description", content: "فاتورة طلب قابلة للطباعة من لوحة إدارة أسواق شهد الفيوم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminInvoicePage,
});

function AdminInvoicePage() {
  const { id } = Route.useParams();
  return (
    <InvoicePageShell
      id={id}
      backSlot={
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/orders/$id" params={{ id }}>
            <ArrowLeft className="h-4 w-4" /> العودة للطلب
          </Link>
        </Button>
      }
    />
  );
}
