export type OrderStatus =
  | "placed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const STATUS_LABEL_AR: Record<OrderStatus, string> = {
  placed: "تم الطلب",
  preparing: "تم التجهيز",
  out_for_delivery: "مع الطيار",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  placed: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  preparing: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  out_for_delivery: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-destructive/10 text-destructive",
};
