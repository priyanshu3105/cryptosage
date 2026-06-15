export function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <h1 className="font-heading text-xl">Analytics</h1>
        <span className="rounded-full border border-quantix.border/70 bg-quantix.card/80 px-2 py-0.5 text-[10px] text-quantix.muted">
          Beta
        </span>
      </header>
      <p className="mt-1 text-xs text-quantix.muted">
        Portfolio risk, factor exposures, and performance diagnostics.
      </p>
    </div>
  );
}

