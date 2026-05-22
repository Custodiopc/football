import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Settings2 } from 'lucide-react';
import { useWorldStore } from '../stores/worldStore';
import { Button } from '../components/Button';
import { REGIONAL_CUP_LABELS } from '../types/world';
import {
  countTotalTeams, SALARY_SYSTEM_LABELS, FORCE_SYSTEM_LABELS,
} from '../lib/worldConfig';
import { SetupLeaguesModal } from './SetupLeaguesModal';
import { SetupStatesModal } from './SetupStatesModal';

type RegionalCup = import('../types/world').RegionalCup;

const PANEL_STYLE: React.CSSProperties = {
  backgroundColor: '#15304f',
  border: '1px solid #1e3a5c',
  borderRadius: 8,
  padding: '10px 12px',
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#a8b8cc',
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 8,
  borderBottom: '1px solid #1e3a5c',
  paddingBottom: 4,
};

function CheckRow({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer select-none"
      style={{ fontSize: 12, color: checked ? '#f5f5f0' : '#6b7c93', padding: '3px 0' }}
    >
      <input type="checkbox" checked={checked} onChange={onChange}
        style={{ accentColor: '#f5d020', width: 13, height: 13 }} />
      {label}
    </label>
  );
}

function RadioRow({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer select-none"
      style={{ fontSize: 12, color: checked ? '#f5f5f0' : '#6b7c93', padding: '3px 0' }}
    >
      <input type="radio" checked={checked} onChange={onChange}
        style={{ accentColor: '#f5d020', width: 13, height: 13 }} />
      {label}
    </label>
  );
}

function ConfigBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-0.5 rounded px-2 py-0.5 mt-2"
      style={{
        fontSize: 11, color: '#f5d020', backgroundColor: 'rgba(245,208,32,0.1)',
        border: '1px solid rgba(245,208,32,0.2)', cursor: 'pointer',
      }}
    >
      <Settings2 size={11} /> configurar
    </button>
  );
}

export function Setup() {
  const navigate = useNavigate();
  const {
    config, save,
    setSalarySystem, setForceSystem, setStartSeason,
    setPlayStates, setPlayRegionalCups, setPlayInternationalClubs,
    setAlwaysInvited, toggleRegionalCup, reset,
  } = useWorldStore();

  const [leaguesModalOpen, setLeaguesModalOpen] = useState(false);
  const [statesModalOpen, setStatesModalOpen] = useState(false);

  const totalTeams = countTotalTeams(config);
  const enabledStates = config.active_states.filter((s) => s.enabled).length;

  const handleStart = async () => {
    await save(config);
    navigate('/setup/add-coach');
  };

  const YEARS = [2024, 2025, 2026, 2027, 2028];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#0a1e35', color: '#f5f5f0' }}
    >
      {/* Cabeçalho */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c' }}
      >
        <button
          onClick={() => navigate('/single/new')}
          className="flex items-center gap-1.5"
          style={{ color: '#a8b8cc', fontSize: 13, cursor: 'pointer', border: 'none', background: 'none' }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <h1 className="font-retro text-xl" style={{ color: '#f5d020' }}>
          Configurações Iniciais
        </h1>
        <button
          onClick={() => reset()}
          style={{ fontSize: 11, color: '#6b7c93', cursor: 'pointer', border: 'none', background: 'none' }}
        >
          resetar
        </button>
      </div>

      {/* Grid principal */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', maxWidth: 900 }}>

          {/* Ligas Nacionais */}
          <div style={PANEL_STYLE}>
            <div style={SECTION_TITLE}>Ligas Nacionais</div>
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                {config.divisions.map((d) => (
                  <div key={d.level} className="flex items-center gap-2">
                    <span
                      style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: d.playable ? '#4ade80' : '#6b7c93',
                      }}
                    />
                    <span style={{ fontSize: 12, color: d.playable ? '#f5f5f0' : '#6b7c93' }}>
                      {d.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#6b7c93', marginLeft: 'auto' }}>
                      {d.total_teams}
                    </span>
                    {!d.playable && (
                      <span style={{ fontSize: 9, color: '#1e3a5c', marginLeft: 2 }}>sim</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontFamily: 'VT323, monospace', color: '#f5d020', lineHeight: 1 }}>
                  {totalTeams}
                </div>
                <div style={{ fontSize: 9, color: '#6b7c93' }}>times</div>
              </div>
            </div>
            <ConfigBtn onClick={() => setLeaguesModalOpen(true)} />
          </div>

          {/* Estaduais */}
          <div style={PANEL_STYLE}>
            <div style={SECTION_TITLE}>Estaduais</div>
            <CheckRow
              label="Jogar estaduais"
              checked={config.play_states}
              onChange={() => setPlayStates(!config.play_states)}
            />
            {config.play_states && (
              <>
                <div
                  className="mt-2 overflow-auto"
                  style={{ maxHeight: 120, fontSize: 11 }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: '#6b7c93' }}>
                        <th style={{ textAlign: 'left', fontWeight: 500, paddingBottom: 3 }}>Estado</th>
                        <th style={{ textAlign: 'right', fontWeight: 500, paddingBottom: 3 }}>Times</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.active_states.filter((s) => s.enabled).map((s) => (
                        <tr key={s.id}>
                          <td style={{ color: '#f5f5f0', padding: '1px 0' }}>{s.name}</td>
                          <td style={{ textAlign: 'right', color: '#f5d020' }}>{s.team_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 10, color: '#6b7c93', marginTop: 4 }}>
                  {enabledStates} estado{enabledStates !== 1 ? 's' : ''} ativos
                </div>
                <ConfigBtn onClick={() => setStatesModalOpen(true)} />
              </>
            )}
          </div>

          {/* Regionais */}
          <div style={PANEL_STYLE}>
            <div style={SECTION_TITLE}>Regionais</div>
            <CheckRow
              label="Jogar copas regionais"
              checked={config.play_regional_cups}
              onChange={() => setPlayRegionalCups(!config.play_regional_cups)}
            />
            {config.play_regional_cups && (
              <div className="mt-2 flex flex-col gap-1">
                {(Object.entries(REGIONAL_CUP_LABELS) as [RegionalCup, string][]).map(([cup, label]) => (
                  <CheckRow
                    key={cup}
                    label={label}
                    checked={config.active_regional_cups.includes(cup)}
                    onChange={() => toggleRegionalCup(cup)}
                  />
                ))}
                <div style={{ borderTop: '1px solid #1e3a5c', marginTop: 4, paddingTop: 6 }}>
                  <CheckRow
                    label="Sempre convidado"
                    checked={config.always_invited_to_regional}
                    onChange={() => setAlwaysInvited(!config.always_invited_to_regional)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Internacionais */}
          <div style={PANEL_STYLE}>
            <div style={SECTION_TITLE}>Internacionais</div>
            <div className="flex flex-col gap-1">
              <CheckRow
                label="Taças de clubes (Liber. / Sul-Amer.)"
                checked={config.play_international_clubs}
                onChange={() => setPlayInternationalClubs(!config.play_international_clubs)}
              />
              <CheckRow
                label="Seleções (stub)"
                checked={config.play_international_nationals}
                onChange={() =>
                  useWorldStore.setState((s) => ({
                    config: { ...s.config, play_international_nationals: !s.config.play_international_nationals },
                  }))
                }
              />
              <CheckRow
                label="Grupos Copa do Mundo 2026"
                checked={config.use_world_cup_groups}
                onChange={() =>
                  useWorldStore.setState((s) => ({
                    config: { ...s.config, use_world_cup_groups: !s.config.use_world_cup_groups },
                  }))
                }
              />
            </div>
            <div
              className="mt-3 rounded px-2 py-1"
              style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', fontSize: 10, color: '#6b7c93' }}
            >
              ℹ️ Internacionais em desenvolvimento. Resultados simulados.
            </div>
          </div>

          {/* Sistema */}
          <div style={PANEL_STYLE}>
            <div style={SECTION_TITLE}>Sistema</div>

            {/* Salários */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#a8b8cc', marginBottom: 4 }}>Salários</div>
              {(['monthly', 'weekly'] as const).map((v) => (
                <RadioRow
                  key={v}
                  label={SALARY_SYSTEM_LABELS[v]}
                  checked={config.salary_system === v}
                  onChange={() => setSalarySystem(v)}
                />
              ))}
            </div>

            {/* Força */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#a8b8cc', marginBottom: 4 }}>Sistema de Força</div>
              {(['individual', 'classic'] as const).map((v) => (
                <RadioRow
                  key={v}
                  label={FORCE_SYSTEM_LABELS[v]}
                  checked={config.force_system === v}
                  onChange={() => setForceSystem(v)}
                />
              ))}
            </div>

            {/* Temporada */}
            <div>
              <div style={{ fontSize: 11, color: '#a8b8cc', marginBottom: 4 }}>Temporada inicial</div>
              <select
                value={config.start_season}
                onChange={(e) => setStartSeason(Number(e.target.value))}
                style={{
                  backgroundColor: '#0d1f36', border: '1px solid #1e3a5c',
                  color: '#f5f5f0', fontSize: 12, padding: '4px 8px',
                  borderRadius: 6, cursor: 'pointer', width: '100%',
                }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ backgroundColor: '#0d1f36', borderTop: '1px solid #1e3a5c' }}
      >
        <Button variant="secondary" onClick={() => navigate('/single/new')}>
          <ArrowLeft size={14} /> Voltar
        </Button>
        <Button onClick={handleStart}>
          Iniciar Jogo <ChevronRight size={14} />
        </Button>
      </div>

      {/* Modais */}
      {leaguesModalOpen && <SetupLeaguesModal onClose={() => setLeaguesModalOpen(false)} />}
      {statesModalOpen && <SetupStatesModal onClose={() => setStatesModalOpen(false)} />}
    </div>
  );
}
