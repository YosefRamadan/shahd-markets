import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
  .max(72, "كلمة المرور طويلة جدًا");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("بريد إلكتروني غير صحيح")
  .max(254);

export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_.]{3,32}$/, "حروف لاتينية وأرقام و _ و . فقط (3-32)");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^01\d{9}$/, "رقم موبايل مصري غير صالح (مثال: 01008336388)");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "الاسم قصير جدًا")
  .max(120, "الاسم طويل جدًا");

export const addressSchema = z
  .string()
  .trim()
  .min(5, "العنوان قصير جدًا")
  .max(500, "العنوان طويل جدًا");

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "أدخل البريد أو اسم المستخدم أو رقم الموبايل").max(120),
  password: z.string().min(1, "كلمة المرور مطلوبة").max(72),
});

export const registerSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  username: usernameSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export const profileUpdateSchema = z.object({
  full_name: fullNameSchema,
  username: usernameSchema.optional().or(z.literal("")),
  phone: phoneSchema,
  default_address: addressSchema.optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({ password: passwordSchema });
