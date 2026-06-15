import { useEffect } from "react";
import { createChart } from "lightweight-charts";
import type { IChartApi, UTCTimestamp } from "lightweight-charts";
export function RightPanel() {
  return (
    <div className="flex h-full flex-col">
      <section className="glass-card flex-1 rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between text-xs md:text-sm">
          <span className="font-heading text-[12px] md:text-sm uppercase tracking-[0.18em] text-quantix.muted">
            Transaction summary
          </span>
          <span className="text-[11px] md:text-xs text-quantix.muted">Last 24h</span>
        </div>
        <MiniCandleChart />
      </section>
    </div>
  );
}

function MiniCandleChart() {
  const containerId = "quantix-right-candle";

  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;

    const chart: IChartApi = createChart(el, {
      height: 180,
      layout: {
        background: { color: "transparent" },
        textColor: "#6b7280",
      },
      grid: {
        horzLines: { color: "rgba(55, 65, 81, 0.3)" },
        vertLines: { color: "rgba(31, 41, 55, 0.2)" },
      },
      rightPriceScale: {
        borderColor: "rgba(75, 85, 99, 0.5)",
      },
      timeScale: {
        borderColor: "rgba(75, 85, 99, 0.5)",
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#00d4a1",
      downColor: "#ff4d6d",
      wickUpColor: "#00d4a1",
      wickDownColor: "#ff4d6d",
      borderVisible: false,
    });

    const baseTime = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const data = Array.from({ length: 40 }).map((_, idx) => {
      const t = (baseTime - (40 - idx) * 900) as UTCTimestamp;
      const base = 3400 + idx * 4;
      const open = base + (Math.random() - 0.5) * 25;
      const close = open + (Math.random() - 0.5) * 35;
      const high = Math.max(open, close) + Math.random() * 18;
      const low = Math.min(open, close) - Math.random() * 18;
      return { time: t, open, high, low, close };
    });

    series.setData(data);
    chart.timeScale().fitContent();

    const handleResize = () => {
      const { width } = el.getBoundingClientRect();
      chart.applyOptions({ width });
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [containerId]);

  return <div id={containerId} className="h-44 w-full" />;
}

