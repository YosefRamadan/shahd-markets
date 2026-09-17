/**
 * The one and only invoice renderer.
 * `format` changes layout/typography only — never the data or the maths.
 */
import {
  PAYMENT_LABEL_AR,
  amount,
  formatInvoiceDate,
  isThermal,
  itemLabel,
  money,
  type InvoiceAudience,
  type InvoiceDocument,
  type PrintFormat,
} from "@/lib/invoice";
import { STATUS_LABEL_AR, type OrderStatus } from "@/lib/orders";

type Props = {
  invoice: InvoiceDocument;
  format: PrintFormat;
  audience: InvoiceAudience;
};

export function InvoiceDocumentView({ invoice, format, audience }: Props) {
  return isThermal(format) ? (
    <ThermalReceipt invoice={invoice} format={format} audience={audience} />
  ) : (
    <A4Invoice invoice={invoice} audience={audience} />
  );
}

/* ------------------------------- A4 ------------------------------- */

function A4Invoice({
  invoice,
  audience,
}: {
  invoice: InvoiceDocument;
  audience: InvoiceAudience;
}) {
  const { seller, customer, lines, totals } = invoice;
  return (
    <div className="inv inv-a4" dir="rtl">
      <header className="inv-head">
        <div className="inv-head-brand">
          <img src={seller.logoUrl} alt="" className="inv-logo" />
          <div>
            <h1 className="inv-store">{seller.name}</h1>
            <div className="inv-meta">
              {[seller.address, seller.city].filter(Boolean).join("، ")}
            </div>
            {seller.phones.length > 0 && (
              <div className="inv-meta" dir="ltr">
                {seller.phones.join(" / ")}
              </div>
            )}
            {seller.email && <div className="inv-meta" dir="ltr">{seller.email}</div>}
            {seller.taxNumber && (
              <div className="inv-meta">
                الرقم الضريبي: <span dir="ltr">{seller.taxNumber}</span>
              </div>
            )}
            {seller.commercialRegNumber && (
              <div className="inv-meta">
                السجل التجاري: <span dir="ltr">{seller.commercialRegNumber}</span>
              </div>
            )}
          </div>
        </div>
        <div className="inv-head-doc">
          <div className="inv-title">فاتورة</div>
          <div className="inv-number">{invoice.orderNumber}</div>
          <div className="inv-meta">{formatInvoiceDate(invoice.createdAt)}</div>
          <div className="inv-chip">{STATUS_LABEL_AR[invoice.status as OrderStatus]}</div>
        </div>
      </header>

      <section className="inv-grid">
        <div>
          <h2 className="inv-h2">بيانات العميل</h2>
          <div>{customer.name}</div>
          <div dir="ltr">{customer.phone}</div>
        </div>
        <div>
          <h2 className="inv-h2">عنوان التوصيل</h2>
          <div>{customer.address}</div>
          <div className="inv-meta">{customer.city}</div>
        </div>
        <div>
          <h2 className="inv-h2">الدفع</h2>
          <div>{PAYMENT_LABEL_AR[invoice.paymentMethod] ?? invoice.paymentMethod}</div>
          {customer.notes && <div className="inv-meta">ملاحظات: {customer.notes}</div>}
        </div>
      </section>

      <table className="inv-table">
        <thead>
          <tr>
            <th className="inv-col-name">المنتج</th>
            <th className="inv-col-num">الكمية</th>
            <th className="inv-col-num">سعر الوحدة</th>
            <th className="inv-col-num">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="inv-col-name">{itemLabel(l)}</td>
              <td className="inv-col-num">{l.quantity}</td>
              <td className="inv-col-num">{amount(l.unitPrice)}</td>
              <td className="inv-col-num">{amount(l.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-totals">
        <TotalRow label="إجمالي المنتجات" value={money(totals.subtotal)} />
        {totals.discount > 0 && (
          <TotalRow label="الخصم" value={`- ${money(totals.discount)}`} />
        )}
        <TotalRow label="رسوم التوصيل" value={money(totals.deliveryFee)} />
        <TotalRow label="الإجمالي المستحق" value={money(totals.total)} strong />
      </div>

      <footer className="inv-foot">
        شكرًا لتسوقك من {seller.name}
        {audience === "admin" ? ` — نسخة المتجر` : ""}
      </footer>
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`inv-total-row${strong ? " inv-total-strong" : ""}`}>
      <span>{label}</span>
      <span className="inv-num">{value}</span>
    </div>
  );
}

/* ----------------------------- Thermal ----------------------------- */

function ThermalReceipt({
  invoice,
  format,
  audience,
}: {
  invoice: InvoiceDocument;
  format: PrintFormat;
  audience: InvoiceAudience;
}) {
  const { seller, customer, lines, totals } = invoice;
  const narrow = format === "t58";
  return (
    <div className={`inv inv-thermal ${narrow ? "inv-t58" : "inv-t80"}`} dir="rtl">
      <div className="inv-t-center">
        <img src={seller.logoUrl} alt="" className="inv-t-logo" />
        <div className="inv-t-store">{seller.name}</div>
        {seller.address && <div>{seller.address}</div>}
        {seller.city && <div>{seller.city}</div>}
        {seller.phones.length > 0 && (
          <div dir="ltr">{seller.phones.join(" / ")}</div>
        )}
        {seller.taxNumber && (
          <div>
            الرقم الضريبي: <span dir="ltr">{seller.taxNumber}</span>
          </div>
        )}
        {seller.commercialRegNumber && (
          <div>
            سجل تجاري: <span dir="ltr">{seller.commercialRegNumber}</span>
          </div>
        )}
      </div>

      <div className="inv-t-rule" />

      <div className="inv-t-kv">
        <span>طلب</span>
        <span dir="ltr">{invoice.orderNumber}</span>
      </div>
      <div className="inv-t-kv">
        <span>التاريخ</span>
        <span dir="ltr">{formatInvoiceDate(invoice.createdAt)}</span>
      </div>
      <div className="inv-t-kv">
        <span>الحالة</span>
        <span>{STATUS_LABEL_AR[invoice.status as OrderStatus]}</span>
      </div>
      <div className="inv-t-kv">
        <span>العميل</span>
        <span className="inv-t-wrap">{customer.name}</span>
      </div>
      <div className="inv-t-kv">
        <span>الهاتف</span>
        <span dir="ltr">{customer.phone}</span>
      </div>
      <div className="inv-t-addr">
        {customer.address}
        {customer.city ? `، ${customer.city}` : ""}
      </div>

      <div className="inv-t-rule" />

      <div className="inv-t-items">
        {lines.map((l) => (
          <div key={l.id} className="inv-t-item">
            <div className="inv-t-item-name">{itemLabel(l)}</div>
            <div className="inv-t-item-calc">
              <span dir="ltr">
                {l.quantity} × {amount(l.unitPrice)}
              </span>
              <span dir="ltr">{amount(l.lineTotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="inv-t-rule" />

      <div className="inv-t-kv">
        <span>المنتجات</span>
        <span dir="ltr">{amount(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className="inv-t-kv">
          <span>الخصم</span>
          <span dir="ltr">-{amount(totals.discount)}</span>
        </div>
      )}
      <div className="inv-t-kv">
        <span>التوصيل</span>
        <span dir="ltr">{amount(totals.deliveryFee)}</span>
      </div>
      <div className="inv-t-kv inv-t-total">
        <span>الإجمالي</span>
        <span dir="ltr">{amount(totals.total)} ج.م</span>
      </div>

      <div className="inv-t-rule" />

      <div className="inv-t-center inv-t-thanks">
        <div>{PAYMENT_LABEL_AR[invoice.paymentMethod] ?? invoice.paymentMethod}</div>
        <div>شكرًا لتسوقك من {seller.name}</div>
        {audience === "admin" && <div>نسخة المتجر</div>}
      </div>
    </div>
  );
}
