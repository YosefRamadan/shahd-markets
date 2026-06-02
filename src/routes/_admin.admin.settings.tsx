import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminUpdateOrderSettings,
  getOrderSettings,
} from "@/lib/orders.functions";

export const Route = createFileRoute("/_admin/admin/settings")({
  head: () => ({ meta: [{ title: "إعدادات الطلبات" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const getFn = useServerFn(getOrderSettings);
  const saveFn = useServerFn(adminUpdateOrderSettings);

  const { data, isLoading } = useQuery({
    queryKey: ["order-settings"],
    queryFn: () => getFn(),
  });

  const [form, setForm] = useState({
    min_order_egp: 50,
    delivery_fee_egp: 20,
    free_delivery_threshold_egp: 300,
  });

  useEffect(() => {
    if (data) {
      setForm({
        min_order_egp: data.minOrder,
        delivery_fee_egp: data.deliveryFee,
        free_delivery_threshold_egp: data.freeThreshold,
      });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات");
      qc.invalidateQueries({ queryKey: ["order-settings"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SiteShell>
      <div className="container mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold">إعدادات الطلبات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تحكّم في الحد الأدنى للطلب ورسوم التوصيل.
        </p>

        {isLoading ? (
          <div className="mt-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
            className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
          >
            <div>
              <Label>الحد الأدنى للطلب (ج.م)</Label>
              <Input
                type="number"
                min={0}
                value={form.min_order_egp}
                onChange={(e) =>
                  setForm({ ...form, min_order_egp: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>رسوم التوصيل (ج.م)</Label>
              <Input
                type="number"
                min={0}
                value={form.delivery_fee_egp}
                onChange={(e) =>
                  setForm({ ...form, delivery_fee_egp: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>حد التوصيل المجاني (ج.م)</Label>
              <Input
                type="number"
                min={0}
                value={form.free_delivery_threshold_egp}
                onChange={(e) =>
                  setForm({
                    ...form,
                    free_delivery_threshold_egp: Number(e.target.value),
                  })
                }
              />
            </div>
            <Button type="submit" disabled={mut.isPending} className="w-full">
              {mut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="ml-1 h-4 w-4" /> حفظ
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </SiteShell>
  );
}
