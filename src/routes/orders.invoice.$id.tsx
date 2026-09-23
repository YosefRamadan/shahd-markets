import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { InvoicePageShell } from "@/components/invoice/InvoicePageShell";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site-config";

export const Route = createFileRoute("/orders/invoice/$id")({
  head: () => ({
    meta: [
      { title: `فاتورة طلبك — ${SITE.nameAr}` },
      { name: "description", content: "اعرض واطبع فاتورة طلبك من أسواق شهد الفيوم." },
      { property: "og:title", content: `فاتورة طلبك — ${SITE.nameAr}` },
      { property: "og:description", content: "اعرض واطبع فاتورة طلبك من أسواق شهد الفيوم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomerInvoicePage,
});

function CustomerInvoicePage() {
  const { id } = Route.useParams();
  return (
    <InvoicePageShell
      id={id}
      backSlot={
        <Button asChild variant="outline" size="sm">
          <Link to="/orders/$id" params={{ id }}>
            <ArrowLeft className="h-4 w-4" /> العودة للطلب
          </Link>
        </Button>
      }
    />
  );
}
