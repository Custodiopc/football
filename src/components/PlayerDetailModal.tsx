import { Modal } from './Modal';
import type { Player, PlayerState } from '../types';
import { ATTR_LABEL, POSITION_LABEL, SIDE_LABEL, ALL_ATTRS_BY_POS, type AttrKey } from '../types';
import { getEffectiveAttribute, formatHighlights, attrColor } from '../lib/simulation/playerAttributes';

interface PlayerDetailModalProps {
  player: Player | null;
  playerState?: PlayerState;
  currentRound: number;
  onClose: () => void;
}

function AttrBar({ label, value, isHighlighted, effective }: {
  label: string;
  value: number;
  isHighlighted: boolean;
  effective: number;
}) {
  const color = attrColor(effective);
  const pct = (effective / 20) * 100;

  return (
    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
      {/* Label */}
      <span
        className="shrink-0"
        style={{ width: 90, fontSize: 11, color: isHighlighted ? '#f5d020' : '#a8b8cc', textAlign: 'right' }}
      >
        {label}
        {isHighlighted && <span style={{ color: '#f5d020', marginLeft: 2 }}>⭐</span>}
      </span>

      {/* Barra */}
      <div
        className="flex-1 rounded overflow-hidden"
        style={{ height: 10, backgroundColor: '#0d1f36' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Valor */}
      <span
        className="shrink-0"
        style={{ width: 26, fontSize: 12, fontWeight: 700, color, textAlign: 'right' }}
      >
        {effective}
        {isHighlighted && effective !== value && (
          <span style={{ fontSize: 9, color: '#6b7c93', marginLeft: 1 }}>({value})</span>
        )}
      </span>
    </div>
  );
}

export function PlayerDetailModal({ player, playerState, currentRound, onClose }: PlayerDetailModalProps) {
  if (!player) return null;

  const injured = playerState?.injury_until_round != null
    && currentRound <= (playerState.injury_until_round ?? 0);
  const suspended = playerState?.suspended_until_round != null
    && currentRound <= (playerState.suspended_until_round ?? 0);

  const attrsToShow = ALL_ATTRS_BY_POS[player.position];

  return (
    <Modal open={!!player} onClose={onClose}>
      {/* Header */}
      <div
        className="flex items-start justify-between pb-3 mb-3"
        style={{ borderBottom: '1px solid #1e3a5c' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 style={{ color: '#f5f5f0', fontSize: 16, fontWeight: 700, margin: 0 }}>
              {player.name}
            </h2>
            {player.is_world_top && <span title="Top Mundial" style={{ fontSize: 14 }}>🌟</span>}
            {player.is_star && !player.is_world_top && <span title="Estrela" style={{ fontSize: 14 }}>⭐</span>}
          </div>
          <div style={{ color: '#a8b8cc', fontSize: 12, marginTop: 3 }}>
            {POSITION_LABEL[player.position]} · {SIDE_LABEL[player.side]} · {player.age} anos
          </div>
          {(injured || suspended) && (
            <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>
              {injured ? '🤕 Lesionado' : '🚫 Suspenso'}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="font-retro" style={{ color: '#f5d020', fontSize: 28, lineHeight: 1 }}>
            F:{player.force}
          </div>
          <div style={{ color: '#a8b8cc', fontSize: 11, marginTop: 2 }}>
            Car: {formatHighlights(player)}
          </div>
        </div>
      </div>

      {/* Características destacadas */}
      {(player.highlighted_attr_1 || player.highlighted_attr_2) && (
        <div
          className="rounded px-3 py-2 mb-3"
          style={{ backgroundColor: 'rgba(245,208,32,0.08)', border: '1px solid rgba(245,208,32,0.2)' }}
        >
          <span style={{ fontSize: 11, color: '#f5d020', fontWeight: 600 }}>
            Características destacadas: {' '}
          </span>
          <span style={{ fontSize: 11, color: '#f5f5f0' }}>
            {[player.highlighted_attr_1, player.highlighted_attr_2]
              .filter(Boolean)
              .map((k) => ATTR_LABEL[k as AttrKey] ?? k)
              .join(', ')}
          </span>
        </div>
      )}

      {/* Atributos */}
      <div>
        <p style={{ color: '#6b7c93', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Atributos
        </p>
        {attrsToShow.map((key) => {
          const val = (player.attributes[key] as number | undefined) ?? 0;
          if (val === 0) return null;
          const isHighlighted =
            player.highlighted_attr_1 === key || player.highlighted_attr_2 === key;
          const effective = getEffectiveAttribute(player, key);
          return (
            <AttrBar
              key={key}
              label={ATTR_LABEL[key] ?? String(key)}
              value={val}
              isHighlighted={isHighlighted}
              effective={effective}
            />
          );
        })}
      </div>

      {/* Estatísticas da temporada */}
      {playerState && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: '1px solid #1e3a5c' }}
        >
          <p style={{ color: '#6b7c93', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Temporada atual
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Jogos',  val: playerState.games_season },
              { label: 'Gols',   val: playerState.goals_season },
              { label: 'Assist', val: playerState.assists_season },
              { label: 'Amarelos', val: playerState.yellow_cards },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="rounded py-2"
                style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c' }}
              >
                <div className="font-retro" style={{ color: '#f5d020', fontSize: 20 }}>{val}</div>
                <div style={{ color: '#6b7c93', fontSize: 10 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
