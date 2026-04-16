type LineChartProps = {
  title: string;
  values: Array<number | null>;
  color: string;
  currentValueLabel: string;
};

export function LineChart({
  title,
  values,
  color,
  currentValueLabel,
}: LineChartProps) {
  const safeValues = values.map((value) => value ?? 0);
  const width = 320;
  const height = 132;
  const padding = 12;
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = Math.max(max - min, 1e-6);

  const points = safeValues
    .map((value, index) => {
      const x =
        padding +
        (index / Math.max(safeValues.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <strong>{title}</strong>
        <span>{currentValueLabel}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-card__svg">
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={18}
          fill="transparent"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--line-muted)"
          strokeWidth={1}
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="var(--line-muted)"
          strokeWidth={1}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
    </div>
  );
}
