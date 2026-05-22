interface EnergyBarProps {
  value: number;        // 0-100
  showLabel?: boolean;
  width?: number;       // px, default 80
  height?: number;      // px, default 16
}

export function EnergyBar({ value, showLabel = true, width = 80, height = 16 }: EnergyBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const fillColor =
    clamped < 25
      ? '#ef4444'  // hl.negative
      : clamped < 50
        ? '#f5d020'  // gold
        : '#3b9adb'; // hl.bar

  return (
    <div
      className="relative flex-shrink-0 rounded overflow-hidden"
      style={{ width: width || '100%', height, backgroundColor: '#0d1f36' }}
    >
      {/* Fill */}
      <div
        className="absolute inset-y-0 left-0 transition-all duration-300"
        style={{
          width: `${clamped}%`,
          background: `linear-gradient(90deg, ${fillColor}, ${fillColor}cc)`,
        }}
      />
      {/* Label */}
      {showLabel && (
        <span
          className="absolute inset-0 flex items-center justify-center font-semibold text-white"
          style={{ fontSize: 10, lineHeight: 1, zIndex: 1, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
