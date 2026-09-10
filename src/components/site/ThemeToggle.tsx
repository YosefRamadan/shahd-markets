import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";
const KEY = "sh_theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(KEY) as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeToggle({ className }: { className?: string }) {
  // Initialize state from the actual DOM class set by the pre-paint script,
  // so the first click always flips to the *opposite* of what the user sees.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    // Re-sync after hydration in case the DOM and the saved preference disagree.
    const t = getInitialTheme();
    const domIsDark = document.documentElement.classList.contains("dark");
    const current: Theme = domIsDark ? "dark" : "light";
    if (current !== t) applyTheme(t);
    setTheme(t);
  }, []);

  function toggle() {
    const domIsDark = document.documentElement.classList.contains("dark");
    const next: Theme = domIsDark ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try { window.localStorage.setItem(KEY, next); } catch {}
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
      className={className}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
