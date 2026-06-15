import { cn } from "@/lib/format";

/** Raw SVG for favicon / data-URI use (XML attribute names). */
export const cryptoSageFaviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0a0a0a"/>
  <path d="M38 16H26C21.582 16 18 19.582 18 24V24C18 28.418 21.582 32 26 32H38C42.418 32 46 35.582 46 40V40C46 44.418 42.418 48 38 48H26" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>
  <circle cx="46" cy="24" r="3" fill="#fff"/>
  <circle cx="18" cy="40" r="3" fill="#fff"/>
</svg>`;

function LogoSymbol({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0 dark:drop-shadow-[0_0_14px_hsl(var(--neon-cyan)/0.45)]", className)}
      aria-hidden
    >
      <rect width="64" height="64" rx="14" fill="#0a0a0a" />
      <path
        d="M38 16H26C21.582 16 18 19.582 18 24V24C18 28.418 21.582 32 26 32H38C42.418 32 46 35.582 46 40V40C46 44.418 42.418 48 38 48H26"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="46" cy="24" r="3" fill="#fff" />
      <circle cx="18" cy="40" r="3" fill="#fff" />
    </svg>
  );
}

export type WordmarkTone = "neon" | "theme" | "sidebar";

export interface CryptoSageLogoProps {
  size?: number;
  variant?: "icon" | "full";
  /**
   * Wordmark colors: `neon` = white (on dark marketing only); `theme` = main foreground;
   * `sidebar` = sidebar foreground (default for full — readable on light & dark sidebars).
   */
  wordmarkTone?: WordmarkTone;
  /** @deprecated Use wordmarkTone="theme" */
  wordmarkOnLight?: boolean;
  className?: string;
}

export function CryptoSageLogo({
  size = 48,
  variant = "icon",
  wordmarkTone,
  wordmarkOnLight,
  className,
}: CryptoSageLogoProps) {
  if (variant === "icon") {
    return <LogoSymbol size={size} className={className} />;
  }

  const tone: WordmarkTone = wordmarkOnLight ? "theme" : (wordmarkTone ?? "sidebar");

  const wordmarkSize = Math.max(14, Math.round(size * 0.42));

  const cryptoClass =
    tone === "neon"
      ? "text-white"
      : tone === "theme"
        ? "text-foreground"
        : "text-sidebar-foreground";

  const sageClass =
    tone === "neon" ? "text-white/60" : tone === "theme" ? "text-foreground/60" : "text-sidebar-foreground/60";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoSymbol size={size} />
      <span className="select-none font-semibold tracking-[0.04em]" style={{ fontSize: wordmarkSize }}>
        <span className={cryptoClass}>Crypto</span>
        <span className={sageClass}>Sage</span>
      </span>
    </div>
  );
}
