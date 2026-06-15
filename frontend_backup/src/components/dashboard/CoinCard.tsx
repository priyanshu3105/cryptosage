import { MiniSparkline } from "./MiniSparkline";
import { PercentChange } from "./PercentChange";

type Props = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  spark: number[];
};

export function CoinCard({ symbol, name, price, change24h, spark }: Props) {
  const positive = change24h >= 0;

  return (
    <div className="glass-card group flex flex-col justify-between rounded-xl border border-quantix.border/70 p-4 transition hover:border-quantix.primary/70 hover:shadow-quantix-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-heading text-sm">{name}</div>
          <div className="text-[11px] text-quantix.muted">{symbol}</div>
        </div>
        <MiniSparkline data={spark} positive={positive} />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-xl">
            {price.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="mt-1 text-[11px] text-quantix.muted">vs USDT</div>
        </div>
        <PercentChange value={change24h} />
      </div>
    </div>
  );
}

