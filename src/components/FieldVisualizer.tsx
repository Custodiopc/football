import type { Formation, Player } from '../types';


const FORMATION_SLOTS: Record<Formation, { pos: string; x: number; y: number }[]> = {
  '4-4-2': [
    { pos: 'G',  x: 50, y: 8 },
    { pos: 'Z', x: 18, y: 26 }, { pos: 'Z', x: 38, y: 26 },
    { pos: 'Z', x: 62, y: 26 }, { pos: 'Z', x: 82, y: 26 },
    { pos: 'M', x: 18, y: 50 }, { pos: 'M', x: 38, y: 50 },
    { pos: 'M', x: 62, y: 50 }, { pos: 'M', x: 82, y: 50 },
    { pos: 'A', x: 35, y: 74 }, { pos: 'A', x: 65, y: 74 },
  ],
  '4-3-3': [
    { pos: 'G',  x: 50, y: 8 },
    { pos: 'Z', x: 18, y: 26 }, { pos: 'Z', x: 38, y: 26 },
    { pos: 'Z', x: 62, y: 26 }, { pos: 'Z', x: 82, y: 26 },
    { pos: 'M', x: 25, y: 52 }, { pos: 'M', x: 50, y: 50 }, { pos: 'M', x: 75, y: 52 },
    { pos: 'A', x: 22, y: 76 }, { pos: 'A', x: 50, y: 74 }, { pos: 'A', x: 78, y: 76 },
  ],
  '4-2-3-1': [
    { pos: 'G',  x: 50, y: 8 },
    { pos: 'Z', x: 18, y: 26 }, { pos: 'Z', x: 38, y: 26 },
    { pos: 'Z', x: 62, y: 26 }, { pos: 'Z', x: 82, y: 26 },
    { pos: 'M', x: 33, y: 45 }, { pos: 'M', x: 67, y: 45 },
    { pos: 'M', x: 18, y: 64 }, { pos: 'M', x: 50, y: 62 }, { pos: 'M', x: 82, y: 64 },
    { pos: 'A', x: 50, y: 80 },
  ],
  '3-5-2': [
    { pos: 'G',  x: 50, y: 8 },
    { pos: 'Z', x: 25, y: 26 }, { pos: 'Z', x: 50, y: 24 }, { pos: 'Z', x: 75, y: 26 },
    { pos: 'M', x: 10, y: 50 }, { pos: 'M', x: 30, y: 50 }, { pos: 'M', x: 50, y: 48 },
    { pos: 'M', x: 70, y: 50 }, { pos: 'M', x: 90, y: 50 },
    { pos: 'A', x: 35, y: 74 }, { pos: 'A', x: 65, y: 74 },
  ],
};

// Cor do slot por posição
const POS_COLOR: Record<string, string> = {
  G: '#3b9adb',
  Z: '#4ade80',
  L: '#a8b8cc',
  M: '#f5d020',
  A: '#ef4444',
};

interface FieldVisualizerProps {
  formation: Formation;
  startingPlayers: (Player | null)[];
  onSlotClick?: (index: number) => void;
  primaryColor?: string;
}

export function FieldVisualizer({
  formation,
  startingPlayers,
  onSlotClick,
}: FieldVisualizerProps) {
  const slots = FORMATION_SLOTS[formation];

  return (
    <div className="relative w-full" style={{ paddingBottom: '140%' }}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 300 420"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gramado */}
        <defs>
          <linearGradient id="grass-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a2e15" />
            <stop offset="100%" stopColor="#0d3b1f" />
          </linearGradient>
          {/* Listras do gramado */}
          <pattern id="grass-stripes" x="0" y="0" width="300" height="24" patternUnits="userSpaceOnUse">
            <rect width="300" height="12" fill="rgba(255,255,255,0.02)" />
          </pattern>
        </defs>
        <rect width="300" height="420" fill="url(#grass-grad)" rx="6" />
        <rect width="300" height="420" fill="url(#grass-stripes)" rx="6" opacity="0.5" />

        {/* Linhas do campo (branco suave) */}
        <g stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none">
          <rect x="12" y="12" width="276" height="396" rx="3" />
          <line x1="12" y1="210" x2="288" y2="210" />
          <circle cx="150" cy="210" r="36" />
          <circle cx="150" cy="210" r="3" fill="rgba(255,255,255,0.4)" stroke="none" />
          {/* Área grande baixo */}
          <rect x="62" y="352" width="176" height="56" />
          <rect x="112" y="380" width="76" height="28" />
          {/* Área grande topo */}
          <rect x="62" y="12" width="176" height="56" />
          <rect x="112" y="12" width="76" height="28" />
        </g>

        {/* Slots de jogadores */}
        {slots.map((slot, i) => {
          const cx = (slot.x / 100) * 276 + 12;
          const cy = ((100 - slot.y) / 100) * 396 + 12;
          const player = startingPlayers[i];
          const posColor = POS_COLOR[slot.pos] ?? '#a8b8cc';
          const force = player ? player.force : 0;

          return (
            <g
              key={i}
              onClick={() => onSlotClick?.(i)}
              style={{ cursor: onSlotClick ? 'pointer' : 'default' }}
            >
              {/* Sombra */}
              <circle cx={cx} cy={cy + 1} r={19} fill="rgba(0,0,0,0.35)" />

              {/* Círculo principal */}
              <circle
                cx={cx}
                cy={cy}
                r={18}
                fill={player ? posColor : 'rgba(255,255,255,0.08)'}
                stroke={player ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
                strokeWidth={1.5}
              />

              {player ? (
                <>
                  {/* Nome curto */}
                  <text
                    x={cx} y={cy - 3}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={7} fontWeight="700" fill="rgba(0,0,0,0.9)"
                    fontFamily="Inter, sans-serif"
                  >
                    {player.name.split(' ').pop()?.slice(0, 9) ?? player.name.slice(0, 9)}
                  </text>
                  {/* Força */}
                  <text
                    x={cx} y={cy + 7}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={6} fontWeight="600" fill="rgba(0,0,0,0.75)"
                    fontFamily="Inter, sans-serif"
                  >
                    F:{force}
                  </text>
                </>
              ) : (
                <>
                  <text
                    x={cx} y={cy - 3}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={8} fill="rgba(255,255,255,0.5)"
                    fontFamily="Inter, sans-serif"
                  >
                    {slot.pos}
                  </text>
                  <text
                    x={cx} y={cy + 7}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fill="rgba(255,255,255,0.3)"
                    fontFamily="Inter, sans-serif"
                  >
                    +
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export { FORMATION_SLOTS };
