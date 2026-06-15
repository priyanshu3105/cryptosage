import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/format";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = (theme ?? resolvedTheme) === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "relative h-9 w-9 rounded-lg text-muted-foreground transition-all duration-300",
        "hover:bg-muted hover:text-foreground",
        "hover:shadow-[0_0_18px_hsl(var(--neon-cyan)/0.35)]",
        "dark:hover:shadow-[0_0_22px_hsl(var(--neon-cyan)/0.45)]",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="sr-only">Toggle theme</span>
      {mounted ? (
        isDark ? (
          <Moon className="h-4 w-4 transition-transform duration-300" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </Button>
  );
}
