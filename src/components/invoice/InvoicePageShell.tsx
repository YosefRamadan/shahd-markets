/**
 * Shared chrome around the invoice: format chooser + print button.
 * The invoice itself is rendered by InvoiceDocumentView (one renderer, all audiences).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Printer } from "lucide-react";

import { getInvoice } from "@/lib/invoice.functions";
import {
  PRINT_FORMATS,
  PRINT_FORMAT_LABEL_AR,
  type PrintFormat,
} from "@/lib/invoice";
import { InvoiceDocumentView } from "@/components/invoice/InvoiceDocumentView";
import "@/components/invoice/invoice-print.css";
import { Button } from "@/components/ui/button";

export function InvoicePageShell({
  id,
  backSlot,
}: {
  id: string;
  backSlot?: React.ReactNode;
}) {
  const getFn = useServerFn(getInvoice);
  const [format, setFormat] = useState<PrintFormat>("a4");
  const { data, isLoading, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getFn({ data: { id } }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-sm text-muted-foreground">
        {(error as Error)?.message ?? "تعذر عرض الفاتورة"}
      </div>
    );
  }

  return (
    <div className={`invoice-page invoice-page-${format}`}>
      <div className="no-print mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 pt-4">
        {backSlot ?? <span />}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {PRINT_FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  format === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {PRINT_FORMAT_LABEL_AR[f]}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> طباعة
          </Button>
        </div>
      </div>

      <div className="invoice-stage">
        <InvoiceDocumentView
          invoice={data.invoice}
          format={format}
          audience={data.audience}
        />
      </div>
    </div>
  );
}
