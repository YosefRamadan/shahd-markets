import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Resolve a login identifier (email / username / Egyptian mobile) to an email
 * address so we can call `signInWithPassword`. Returns `{ email: null }` when
 * the identifier doesn't match a profile — the client surfaces a generic
 * "invalid credentials" message either way, so we do not leak existence.
 */
const identifierSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "المعرف قصير جدًا")
    .max(120, "المعرف طويل جدًا"),
});

export const resolveLoginIdentifier = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => identifierSchema.parse(data))
  .handler(async ({ data }): Promise<{ email: string | null }> => {
    const raw = data.identifier.trim();
    const lower = raw.toLowerCase();

    if (lower.includes("@")) {
      return { email: raw };
    }

    let userId: string | null = null;

    if (/^01\d{9}$/.test(lower)) {
      const { data: row } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("phone", lower)
        .maybeSingle();
      userId = row?.id ?? null;
    } else if (/^[a-zA-Z0-9_.]{3,32}$/.test(lower)) {
      const { data: row } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("username", lower)
        .maybeSingle();
      userId = row?.id ?? null;
    }

    if (!userId) return { email: null };

    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    return { email: u.user?.email ?? null };
  });

/**
 * Pre-flight uniqueness check for signup. Returns whether the requested
 * username / phone are still available. Email uniqueness is enforced by
 * Supabase Auth.
 */
const availabilitySchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_.]{3,32}$/)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^01\d{9}$/)
    .optional()
    .or(z.literal("")),
});

export const checkAvailability = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => availabilitySchema.parse(data))
  .handler(async ({ data }) => {
    const result = { usernameAvailable: true, phoneAvailable: true };

    if (data.username) {
      const { data: row } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("username", data.username)
        .maybeSingle();
      result.usernameAvailable = !row;
    }
    if (data.phone) {
      const { data: row } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("phone", data.phone)
        .maybeSingle();
      result.phoneAvailable = !row;
    }
    return result;
  });

/**
 * Returns roles of the currently authenticated user, plus convenience flags.
 */
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    const roles = (data ?? []).map((r) => r.role as "admin" | "manager" | "customer");
    return {
      roles,
      isAdmin: roles.includes("admin"),
      isManager: roles.includes("manager"),
      isStaff: roles.includes("admin") || roles.includes("manager"),
    };
  });
