"use client";

interface ChartBar {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartBar[];
  height?: number;
  className?: string;
  maxValue?: number;
}

export default function SimpleChart({
  data,
  height = 120,
  className = "",
  maxValue,
}: SimpleChartProps) {
  if (data.length === 0) return null;

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`flex items-end gap-1.5 ${className}`} style={{ height }}>
      {data.map((bar, i) => {
        const pct = (bar.value / max) * 100;
        const color = bar.color || "bg-primary/60";
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
          >
            {bar.value > 0 && (
              <span className="text-[10px] font-medium text-gray-500">
                {bar.value}
              </span>
            )}
            <div
              className={`w-full rounded-t-md transition-all duration-500 ${color}`}
              style={{
                height: `${Math.max(pct, bar.value > 0 ? 4 : 0)}%`,
                minHeight: bar.value > 0 ? "4px" : "0px",
              }}
              title={`${bar.label}: ${bar.value}`}
            />
            <span className="text-[9px] text-gray-400 truncate w-full text-center">
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
