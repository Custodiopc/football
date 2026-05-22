import { contrastColor } from '../lib/utils';

interface TeamBadgeProps {
  shortName: string;
  primaryColor: string;
  size?: number;
  className?: string;
}

export function TeamBadge({ shortName, primaryColor, size = 40, className = '' }: TeamBadgeProps) {
  const text = contrastColor(primaryColor);
  const fontSize = Math.max(8, Math.round(size * 0.32));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {/* Escudo shape */}
      <path
        d="M20 2 L36 8 L36 22 Q36 34 20 38 Q4 34 4 22 L4 8 Z"
        fill={primaryColor}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      {/* Faixa vertical central */}
      <path
        d="M18 2.5 L22 2.5 L22 37.5 L18 37.5 Z"
        fill="rgba(255,255,255,0.12)"
      />
      {/* Sigla */}
      <text
        x="20"
        y="22"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="Inter, sans-serif"
        fill={text}
        letterSpacing="0.5"
      >
        {shortName.slice(0, 3).toUpperCase()}
      </text>
    </svg>
  );
}
