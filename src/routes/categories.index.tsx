import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/catalog";
import { SITE } from "@/lib/site-config";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: `الأقسام — ${SITE.nameAr}` },
      { name: "description", content: "تصفح أقسام البقالة: فواكه، خضروات، ألبان، مشروبات، سناكس، منظفات." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setCats((data ?? []) as Category[]);
        setLoading(false);
      });
  }, []);

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">الأقسام</h1>
        <p className="mt-2 text-sm text-muted-foreground">اختر القسم لتصفح المنتجات.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
              ))
            : cats.map((c) => (
                <Link
                  key={c.id}
                  to="/categories/$slug"
                  params={{ slug: c.slug }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {c.image_url && (
                      <img
                        src={c.image_url}
                        alt={c.name_ar}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-3 text-center font-semibold">{c.name_ar}</div>
                </Link>
              ))}
        </div>
      </div>
    </SiteShell>
  );
}
