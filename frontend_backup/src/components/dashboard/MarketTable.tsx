import { MiniSparkline } from "./MiniSparkline";
import { PercentChange } from "./PercentChange";

type Row = {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  change1h: number;
  change7d: number;
  change7dAlt: number;
  marketCap: number;
  volume7d: number;
  spark: number[];
};

type Props = {
  rows: Row[];
};

export function MarketTable({ rows }: Props) {
  return (
    <div className="glass-card mt-4 overflow-hidden rounded-xl border border-quantix.border/70">
      <table className="min-w-full text-sm md:text-base">
        <thead className="bg-quantix.surface/90 text-quantix.muted">
          <tr>
            <Th>#</Th>
            <Th>Coin</Th>
            <Th className="text-right">Price</Th>
            <Th className="text-right">1h%</Th>
            <Th className="text-right">7D%</Th>
            <Th className="text-right">7D% (Alt)</Th>
            <Th className="text-right">Market Cap</Th>
            <Th className="text-right">Volume (7D)</Th>
            <Th className="text-right">Chart</Th>
          </tr>
        </thead>
        <tbody className="bg-quantix.card/70">
          {rows.map((r) => (
            <tr key={r.symbol} className="border-t border-quantix.border/40">
              <Td>{r.rank}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-quantix.surface/80" />
                  <div>
                    <div className="text-sm md:text-base">{r.name}</div>
                    <div className="text-xs text-quantix.muted">
                      {r.symbol.toUpperCase()}
                    </div>
                  </div>
                </div>
              </Td>
              <Td className="text-right font-mono">
                {r.price.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 2,
                })}
              </Td>
              <Td className="text-right">
                <PercentChange value={r.change1h} />
              </Td>
              <Td className="text-right">
                <PercentChange value={r.change7d} />
              </Td>
              <Td className="text-right">
                <PercentChange value={r.change7dAlt} />
              </Td>
              <Td className="text-right font-mono text-quantix.muted">
                {formatCompact(r.marketCap)}
              </Td>
              <Td className="text-right font-mono text-quantix.muted">
                {formatCompact(r.volume7d)}
              </Td>
              <Td className="text-right">
                <MiniSparkline data={r.spark} positive={r.change7d >= 0} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-2 text-left text-sm md:text-base font-medium ${props.className ?? ""}`}>
      {props.children}
    </th>
  );
}

function Td(props: React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-2 align-middle ${props.className ?? ""}`}>{props.children}</td>
  );
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

