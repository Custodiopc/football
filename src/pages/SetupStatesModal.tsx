import { useState } from 'react';
import { useWorldStore } from '../stores/worldStore';
import { Button } from '../components/Button';

interface SetupStatesModalProps {
  onClose: () => void;
}

export function SetupStatesModal({ onClose }: SetupStatesModalProps) {
  const { config, toggleState } = useWorldStore();
  const [search, setSearch] = useState('');

  const filtered = config.active_states.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const enabled = config.active_states.filter((s) => s.enabled);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,30,53,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-xl overflow-hidden"
        style={{
          maxWidth: 520, maxHeight: '85vh',
          backgroundColor: '#15304f', border: '1px solid #1e3a5c',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid #1e3a5c', flexShrink: 0 }}
        >
          <h2 className="font-retro text-xl" style={{ color: '#f5d020' }}>
            Estaduais
          </h2>
          <span style={{ fontSize: 12, color: '#a8b8cc' }}>
            {enabled.length}/{config.active_states.length} ativos
          </span>
        </div>

        {/* Busca */}
        <div className="px-4 py-2" style={{ borderBottom: '1px solid #1e3a5c', flexShrink: 0 }}>
          <input
            type="text"
            placeholder="Buscar estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', backgroundColor: '#0d1f36',
              border: '1px solid #1e3a5c', color: '#f5f5f0',
              fontSize: 12, padding: '6px 10px', borderRadius: 6,
            }}
          />
        </div>

        {/* Lista */}
        <div className="overflow-auto flex-1">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#15304f' }}>
              <tr style={{ borderBottom: '1px solid #1e3a5c' }}>
                <th style={{ width: 36, padding: '6px 12px', textAlign: 'center' }} />
                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: 11, color: '#6b7c93', fontWeight: 500 }}>
                  Estado
                </th>
                <th style={{ textAlign: 'right', padding: '6px 12px', fontSize: 11, color: '#6b7c93', fontWeight: 500 }}>
                  Times
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((state) => (
                <tr
                  key={state.id}
                  onClick={() => toggleState(state.id)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: state.enabled ? 'rgba(245,208,32,0.06)' : 'transparent',
                    borderBottom: '1px solid rgba(30,58,92,0.3)',
                  }}
                >
                  <td style={{ textAlign: 'center', padding: '6px 12px' }}>
                    <input
                      type="checkbox"
                      checked={state.enabled}
                      onChange={() => toggleState(state.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ accentColor: '#f5d020', width: 13, height: 13 }}
                    />
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: 12, color: state.enabled ? '#f5f5f0' : '#6b7c93' }}>
                    <span style={{ fontWeight: 600, color: '#a8b8cc', marginRight: 6 }}>
                      {state.id}
                    </span>
                    {state.name}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: 12, color: '#f5d020' }}>
                    {state.team_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid #1e3a5c', flexShrink: 0 }}
        >
          <span style={{ fontSize: 11, color: '#6b7c93' }}>
            Clique para ativar/desativar
          </span>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}
