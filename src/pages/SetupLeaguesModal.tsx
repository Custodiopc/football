import { useWorldStore } from '../stores/worldStore';
import { Button } from '../components/Button';
import { GROUPS_CONFIG_LABELS, KNOCKOUT_LABELS } from '../lib/worldConfig';
import type { LeagueDivision } from '../types/world';

interface SetupLeaguesModalProps {
  onClose: () => void;
}

function DivisionPanel({ div }: { div: LeagueDivision }) {
  const updateDivision = useWorldStore((s) => s.updateDivision);

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: '#a8b8cc', minWidth: 120,
  };
  const selectStyle: React.CSSProperties = {
    backgroundColor: '#0d1f36', border: '1px solid #1e3a5c',
    color: '#f5f5f0', fontSize: 11, padding: '2px 6px',
    borderRadius: 4, cursor: 'pointer', flex: 1,
  };
  const numStyle: React.CSSProperties = {
    backgroundColor: '#0d1f36', border: '1px solid #1e3a5c',
    color: '#f5f5f0', fontSize: 11, padding: '2px 6px',
    borderRadius: 4, width: 52, textAlign: 'right',
  };

  return (
    <div
      className="rounded mb-3"
      style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', padding: '10px 12px' }}
    >
      {/* Título da divisão */}
      <div className="flex items-center justify-between mb-2">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: div.playable ? '#f5d020' : '#6b7c93' }}>
          {div.name}
          {!div.playable && (
            <span style={{ fontSize: 10, color: '#6b7c93', marginLeft: 6, fontWeight: 400 }}>
              (simulada)
            </span>
          )}
        </h3>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={div.playable}
            onChange={() => updateDivision(div.level, { playable: !div.playable })}
            style={{ accentColor: '#f5d020' }}
          />
          <span style={{ fontSize: 11, color: '#a8b8cc' }}>jogável</span>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        {/* Total de times */}
        <div className="flex items-center gap-2">
          <span style={labelStyle}>Times</span>
          <input
            type="number"
            min={4} max={128}
            value={div.total_teams}
            onChange={(e) => updateDivision(div.level, { total_teams: Number(e.target.value) })}
            style={numStyle}
          />
        </div>

        {/* Sistema de grupos */}
        <div className="flex items-center gap-2">
          <span style={labelStyle}>Grupos</span>
          <select
            value={div.groups_config}
            onChange={(e) => updateDivision(div.level, { groups_config: e.target.value as LeagueDivision['groups_config'] })}
            style={selectStyle}
          >
            {Object.entries(GROUPS_CONFIG_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Mata-mata */}
        <div className="flex items-center gap-2">
          <span style={labelStyle}>Mata-mata</span>
          <select
            value={div.knockout}
            onChange={(e) => updateDivision(div.level, { knockout: e.target.value as LeagueDivision['knockout'] })}
            style={selectStyle}
          >
            {Object.entries(KNOCKOUT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Promoção / rebaixamento */}
        <div className="flex items-center gap-2">
          <span style={labelStyle}>Promovidos</span>
          <input
            type="number" min={0} max={10}
            value={div.promoted_count}
            onChange={(e) => updateDivision(div.level, { promoted_count: Number(e.target.value) })}
            style={numStyle}
          />
        </div>
        <div className="flex items-center gap-2">
          <span style={labelStyle}>Rebaixados</span>
          <input
            type="number" min={0} max={10}
            value={div.relegated_direct}
            onChange={(e) => updateDivision(div.level, { relegated_direct: Number(e.target.value), relegated_count: Number(e.target.value) })}
            style={numStyle}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={div.two_legs}
              onChange={() => updateDivision(div.level, { two_legs: !div.two_legs })}
              style={{ accentColor: '#f5d020' }}
            />
            <span style={{ fontSize: 11, color: '#a8b8cc' }}>Ida e volta</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={div.penalty_tiebreaker}
              onChange={() => updateDivision(div.level, { penalty_tiebreaker: !div.penalty_tiebreaker })}
              style={{ accentColor: '#f5d020' }}
            />
            <span style={{ fontSize: 11, color: '#a8b8cc' }}>Penalties</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export function SetupLeaguesModal({ onClose }: SetupLeaguesModalProps) {
  const divisions = useWorldStore((s) => s.config.divisions);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,30,53,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full overflow-auto rounded-xl"
        style={{
          maxWidth: 600, maxHeight: '90vh',
          backgroundColor: '#15304f', border: '1px solid #1e3a5c',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sticky top-0"
          style={{ backgroundColor: '#15304f', borderBottom: '1px solid #1e3a5c' }}
        >
          <h2 className="font-retro text-xl" style={{ color: '#f5d020' }}>
            Configurar Ligas Nacionais
          </h2>
          <button
            onClick={onClose}
            style={{ color: '#a8b8cc', fontSize: 18, cursor: 'pointer', border: 'none', background: 'none' }}
          >
            ×
          </button>
        </div>

        <div className="p-4">
          {divisions.map((div) => (
            <DivisionPanel key={div.level} div={div} />
          ))}
        </div>

        <div
          className="flex justify-end gap-3 px-4 py-3 sticky bottom-0"
          style={{ backgroundColor: '#15304f', borderTop: '1px solid #1e3a5c' }}
        >
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onClose}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
