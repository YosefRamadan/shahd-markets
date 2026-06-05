import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Truck, Phone, Store, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminUpdateOrderSettings,
  getOrderSettings,
} from "@/lib/orders.functions";
import {
  getContactSettings,
  updateContactSettings,
  getContactPhones,
  updateContactPhones,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_admin/admin/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — لوحة الإدارة" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const getOrderFn = useServerFn(getOrderSettings);
  const saveOrderFn = useServerFn(adminUpdateOrderSettings);
  const getContactFn = useServerFn(getContactSettings);
  const saveContactFn = useServerFn(updateContactSettings);
  const getPhonesFn = useServerFn(getContactPhones);
  const savePhonesFn = useServerFn(updateContactPhones);

  const orderQ = useQuery({ queryKey: ["order-settings"], queryFn: () => getOrderFn() });
  const contactQ = useQuery({ queryKey: ["contact-settings"], queryFn: () => getContactFn() });
  const phonesQ = useQuery({ queryKey: ["contact-phones"], queryFn: () => getPhonesFn() });

  const [order, setOrder] = useState({ min_order_egp: 50, delivery_fee_egp: 20 });
  const [contact, setContact] = useState({
    contact_phone: "",
    whatsapp_number: "",
    store_name_ar: "",
    store_city_ar: "",
    working_hours_ar: "",
  });
  const [phones, setPhones] = useState<string[]>([]);

  useEffect(() => {
    if (orderQ.data) {
      setOrder({
        min_order_egp: orderQ.data.minOrder,
        delivery_fee_egp: orderQ.data.deliveryFee,
      });
    }
  }, [orderQ.data]);
  useEffect(() => { if (contactQ.data) setContact(contactQ.data); }, [contactQ.data]);
  useEffect(() => { if (phonesQ.data) setPhones(phonesQ.data); }, [phonesQ.data]);

  const orderMut = useMutation({
    mutationFn: () => saveOrderFn({ data: order }),
    onSuccess: () => {
      toast.success("تم حفظ إعدادات الطلب");
      qc.invalidateQueries({ queryKey: ["order-settings"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const contactMut = useMutation({
    mutationFn: () => saveContactFn({ data: contact }),
    onSuccess: () => {
      toast.success("تم حفظ بيانات الاتصال");
      qc.invalidateQueries({ queryKey: ["contact-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const phonesMut = useMutation({
    mutationFn: () => savePhonesFn({ data: { phones: phones.filter(Boolean) } }),
    onSuccess: () => {
      toast.success("تم حفظ أرقام التواصل");
      qc.invalidateQueries({ queryKey: ["contact-phones"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loading = orderQ.isLoading || contactQ.isLoading || phonesQ.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تحكّم في رسوم التوصيل، الحد الأدنى للطلب، وبيانات الاتصال.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" />
                التوصيل والحد الأدنى
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); orderMut.mutate(); }} className="space-y-4">
                <div>
                  <Label>الحد الأدنى للطلب (ج.م)</Label>
                  <Input type="number" min={0} className="num mt-1" value={order.min_order_egp}
                    onChange={(e) => setOrder({ ...order, min_order_egp: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>رسوم التوصيل (ج.م)</Label>
                  <Input type="number" min={0} className="num mt-1" value={order.delivery_fee_egp}
                    onChange={(e) => setOrder({ ...order, delivery_fee_egp: Number(e.target.value) })} />
                </div>
                <Button type="submit" disabled={orderMut.isPending} className="w-full">
                  {orderMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="ml-1 h-4 w-4" /> حفظ</>)}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" />
                أرقام التواصل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {phones.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      dir="ltr"
                      className="num"
                      value={p}
                      placeholder="01xxxxxxxxx"
                      onChange={(e) => {
                        const next = [...phones];
                        next[idx] = e.target.value;
                        setPhones(next);
                      }}
                    />
                    <Button type="button" variant="outline" size="icon"
                      onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                      disabled={phones.length <= 1}
                      aria-label="حذف">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full"
                  onClick={() => setPhones([...phones, ""])} disabled={phones.length >= 10}>
                  <Plus className="ml-1 h-4 w-4" /> إضافة رقم
                </Button>
                <Button type="button" className="w-full" onClick={() => phonesMut.mutate()}
                  disabled={phonesMut.isPending}>
                  {phonesMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="ml-1 h-4 w-4" /> حفظ الأرقام</>)}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-4 w-4 text-primary" />
                بيانات المتجر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); contactMut.mutate(); }} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>اسم المتجر</Label>
                    <Input className="mt-1" value={contact.store_name_ar}
                      onChange={(e) => setContact({ ...contact, store_name_ar: e.target.value })} />
                  </div>
                  <div>
                    <Label>المدينة</Label>
                    <Input className="mt-1" value={contact.store_city_ar}
                      onChange={(e) => setContact({ ...contact, store_city_ar: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>ساعات العمل</Label>
                  <Input className="mt-1" value={contact.working_hours_ar}
                    onChange={(e) => setContact({ ...contact, working_hours_ar: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>الهاتف الرئيسي</Label>
                    <Input className="num mt-1" dir="ltr" value={contact.contact_phone}
                      onChange={(e) => setContact({ ...contact, contact_phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>واتساب</Label>
                    <Input className="num mt-1" dir="ltr" value={contact.whatsapp_number}
                      onChange={(e) => setContact({ ...contact, whatsapp_number: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" disabled={contactMut.isPending} className="w-full sm:w-auto">
                  {contactMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Save className="ml-1 h-4 w-4" /> حفظ</>)}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
