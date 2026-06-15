import { Line, LineChart, ResponsiveContainer } from "recharts";

type Props = {
  data: number[];
  positive?: boolean;
};

export function MiniSparkline({ data, positive }: Props) {
  const points = data.map((v, idx) => ({ x: idx, y: v }));
  const color = positive ? "#00d4a1" : "#ff4d6d";

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={1.4}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

