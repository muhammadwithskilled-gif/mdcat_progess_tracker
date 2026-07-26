export default function ProgressRing({
  percent = 0,
  size = 76,
  stroke = 8,
  color = "var(--accent-completed)",
  trackColor = "rgba(255,255,255,0.14)",
  label,
  sublabel,
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-progress"
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value">{label ?? `${Math.round(percent)}%`}</span>
        {sublabel && <span className="ring-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}
