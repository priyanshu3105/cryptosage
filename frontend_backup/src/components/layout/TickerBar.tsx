import { useEffect, useState } from "react";
import { api } from "../../api/client";

type Ticker = {
  symbol: string;
  price: number;
  change24h: number;
};

const FALLBACK_TICKERS: Ticker[] = [
  { symbol: "BTC/USDT", price: 67250, change24h: 1.8 },
  { symbol: "ETH/USDT", price: 3450, change24h: -0.4 },
  { symbol: "SOL/USDT", price: 142.5, change24h: 3.2 },
  { symbol: "LTC/USDT", price: 84.1, change24h: 0.7 },
  { symbol: "DOGE/USDT", price: 0.168, change24h: -2.1 },
  { symbol: "MATIC/USDT", price: 0.84, change24h: 1.1 },
  { symbol: "UNI/USDT", price: 9.2, change24h: 4.5 },
  { symbol: "USDT", price: 1.0, change24h: 0.01 },
];

export function TickerBar() {
  const [tickers, setTickers] = useState<Ticker[]>(FALLBACK_TICKERS);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const resp = await api.getTopCoins(15);
        const data = resp?.data;
        if (!alive || !Array.isArray(data)) return;
        setTickers(
          data.map((d: any) => ({
            symbol: (d.symbol ?? "").toUpperCase(),
            price: d.currentPrice ?? 0,
            change24h: d.priceChange24h ?? 0,
          }))
        );
      } catch {
        // keep fallback
      }
    }

    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="border-b border-quantix.border/70 bg-quantix.surface/70">
      <div className="relative overflow-hidden">
        <div className="ticker-scroll flex gap-3 py-2 text-[11px]">
          {[...tickers, ...tickers].map((t, idx) => {
            const positive = t.change24h >= 0;
            return (
              <div
                key={`${t.symbol}-${idx}`}
                className="flex items-center gap-2 rounded-full border border-quantix.border/70 bg-quantix.card/80 px-3 py-1"
              >
                <span className="font-mono text-[10px]">{t.symbol}</span>
                <span className="font-mono text-[10px] text-quantix.text">
                  {t.price.toLocaleString("en-US", {
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span
                  className={`font-mono text-[10px] ${
                    positive ? "text-quantix.green" : "text-quantix.red"
                  }`}
                >
                  {positive ? "+" : ""}
                  {t.change24h.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

