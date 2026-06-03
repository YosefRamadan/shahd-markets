import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Banknote,
  Clock,
  ArrowLeft,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatEgp } from "@/lib/site-config";
import { getDashboardOverview } from "@/lib/admin.functions";
import { STATUS_LABEL_AR, STATUS_TONE, type OrderStatus } from "@/lib/orders";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({ meta: [{ title: "نظرة عامة — لوحة الإدارة" }] }),
  component: AdminDashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "primary",
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  tone?: "primary" | "success" | "warn" | "muted";
}) {
  const toneBg: Record<string, string> = {
    primary: "bg-primary/15 text-primary-foreground",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`grid h-12 w-12 place-items-center rounded-xl ${toneBg[tone]}`}
          style={tone === "primary" ? { background: "var(--gradient-primary)" } : undefined}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="num text-xl font-bold">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const fn = useServerFn(getDashboardOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const { totals, dailyRevenue, topProducts, topCustomers, recentOrders } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">نظرة عامة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ملخّص أداء المتجر اليومي والشهري.
          </p>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          آخر 30 يوم
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Banknote}
          label="مبيعات اليوم"
          value={formatEgp(totals.revenueToday)}
          sub={`${totals.ordersToday} طلب`}
          tone="primary"
        />
        <Stat
          icon={TrendingUp}
          label="مبيعات آخر 30 يوم"
          value={formatEgp(totals.revenue30d)}
          sub={`${totals.orders30d} طلب`}
          tone="success"
        />
        <Stat
          icon={ShoppingBag}
          label="إجمالي المبيعات"
          value={formatEgp(totals.revenueAllTime)}
          sub={`${totals.ordersPending} طلب قيد المعالجة`}
        />
        <Stat
          icon={Users}
          label="عدد العملاء"
          value={String(totals.customers)}
          sub={
            totals.lowStockCount > 0
              ? `⚠ ${totals.lowStockCount} منتج بمخزون منخفض`
              : "المخزون مستقر"
          }
          tone={totals.lowStockCount > 0 ? "warn" : "muted"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">الإيراد اليومي</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => [formatEgp(v), "إيراد"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">طلبات يومية</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(v: string) => v.slice(8)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="orders" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top products + customers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">أكثر المنتجات مبيعًا</CardTitle>
            <Link
              to="/admin/products"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              الكل
            </Link>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد مبيعات بعد.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {topProducts.map((p, i) => (
                  <li key={p.product_id} className="flex items-center gap-3 py-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.units} قطعة
                      </div>
                    </div>
                    <div className="num text-sm font-semibold">{formatEgp(p.revenue)}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">أفضل العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا يوجد عملاء بعد.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {topCustomers.map((c, i) => (
                  <li key={`${c.phone}-${i}`} className="flex items-center gap-3 py-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{c.name}</div>
                      <div className="num text-xs text-muted-foreground">{c.phone}</div>
                    </div>
                    <div className="text-left">
                      <div className="num text-sm font-semibold">{formatEgp(c.revenue)}</div>
                      <div className="text-xs text-muted-foreground">{c.orders} طلب</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            أحدث الطلبات
          </CardTitle>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            الكل
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-muted/40 text-right text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">رقم الطلب</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      لا توجد طلبات.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3 num">
                        <Link
                          to="/admin/orders/$id"
                          params={{ id: o.id }}
                          className="text-primary-foreground hover:underline"
                          style={{ color: "var(--color-foreground)" }}
                        >
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="p-3">{o.customer_name}</td>
                      <td className="p-3 num">{formatEgp(o.total)}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${STATUS_TONE[o.status as OrderStatus]}`}
                        >
                          {STATUS_LABEL_AR[o.status as OrderStatus]}
                        </span>
                      </td>
                      <td className="p-3 num text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("ar-EG")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totals.lowStockCount > 0 && (
        <Link
          to="/admin/inventory"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 hover:bg-amber-500/15"
        >
          <AlertTriangle className="h-5 w-5" />
          <div className="flex-1">
            <div className="font-semibold">تنبيه مخزون منخفض</div>
            <div className="text-xs opacity-80">
              يوجد {totals.lowStockCount} منتج/متغيّر بمخزون 5 أو أقل. اضغط لإدارة المخزون.
            </div>
          </div>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
