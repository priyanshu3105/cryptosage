export function PercentChange({ value }: { value: number }) {
  const positive = value >= 0;
  const formatted = `${positive ? "+" : ""}${value.toFixed(2)}%`;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
        positive ? "bg-quantix.green/15 text-quantix.green" : "bg-quantix.red/15 text-quantix.red"
      }`}
    >
      {formatted}
    </span>
  );
}

