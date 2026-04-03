import { PieChart, Pie, Cell } from 'recharts';

interface DqiGaugeProps {
  score: number;
  size?: number;
}

export function DqiGauge({ score, size = 120 }: DqiGaugeProps) {
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  const getColor = (s: number) => {
    if (s >= 85) return 'hsl(142, 71%, 45%)';
    if (s >= 70) return 'hsl(217, 91%, 60%)';
    if (s >= 55) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 72%, 51%)';
  };

  const color = getColor(score);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <PieChart width={size} height={size * 0.6}>
          <Pie
            data={data}
            cx={size / 2}
            cy={size * 0.55}
            startAngle={180}
            endAngle={0}
            innerRadius={size * 0.28}
            outerRadius={size * 0.4}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-foreground leading-none">{score}</span>
        <span className="text-xs text-muted-foreground mt-0.5">DQI Score</span>
      </div>
    </div>
  );
}
