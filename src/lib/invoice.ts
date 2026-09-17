/**
 * Canonical invoice model for Shahd Markets.
 *
 * One data structure powers every invoice surface: admin print, customer print,
 * A4, 58mm and 80mm thermal receipts, and any future PDF/export. Presentation
 * differs per format — the data never does.
 *
 * Client-safe: types + pure formatting helpers only.
 */

import type { OrderStatus } from "@/lib/orders";

export const PRINT_FORMATS = ["a4", "t80", "t58"] as const;
export type PrintFormat = (typeof PRINT_FORMATS)[number];

export const PRINT_FORMAT_LABEL_AR: Record<PrintFormat, string> = {
  a4: "A4",
  t80: "حراري 80 مم",
  t58: "حراري 58 مم",
};

export type PaymentMethod = "cod";

export const PAYMENT_LABEL_AR: Record<string, string> = {
  cod: "الدفع عند الاستلام",
};

/** Store/seller identity as it was when the order was placed. */
export type InvoiceSeller = {
  name: string;
  address: string | null;
  city: string | null;
  phones: string[];
  email: string | null;
  taxNumber: string | null;
  commercialRegNumber: string | null;
  logoUrl: string;
};

export type InvoiceCustomer = {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string | null;
};

export type InvoiceLine = {
  id: string;
  name: string;
  variant: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
};

export type InvoiceDocument = {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: string;
  /** true when seller details come from an immutable snapshot taken at order time. */
  sellerIsSnapshot: boolean;
  seller: InvoiceSeller;
  customer: InvoiceCustomer;
  lines: InvoiceLine[];
  totals: InvoiceTotals;
};

/** Audience controls only what is rendered, never what is computed. */
export type InvoiceAudience = "admin" | "customer";

export const CURRENCY_AR = "ج.م";

export function money(value: number): string {
  return `${Number(value || 0).toFixed(2)} ${CURRENCY_AR}`;
}

/** Plain number, no currency — used in narrow thermal columns. */
export function amount(value: number): string {
  return Number(value || 0).toFixed(2);
}

export function formatInvoiceDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function itemLabel(line: InvoiceLine): string {
  return line.variant ? `${line.name} — ${line.variant}` : line.name;
}

export function isThermal(format: PrintFormat): boolean {
  return format === "t58" || format === "t80";
}
