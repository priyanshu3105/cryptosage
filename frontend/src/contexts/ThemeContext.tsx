import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Tron-inspired light/dark; class on &lt;html&gt;, persisted under storageKey. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="cryptosage-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
