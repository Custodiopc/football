import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { FieldVisualizer, FORMATION_SLOTS } from '../components/FieldVisualizer';
import { DataTable, type Column } from '../components/DataTable';
import { EnergyBar } from '../components/EnergyBar';
import { useCareerStore } from '../stores/careerStore';
import { getPlayersByTeam, getTeamById, PLAYERS } from '../data';
import type { Formation, Style, Player } from '../types';

const FORMATIONS: Formation[] = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2'];
const STYLES: { key: Style; label: string }[] = [
  { key: 'defensive', label: 'Defensivo' },
  { key: 'balanced',  label: 'Equilibrado' },
  { key: 'offensive', label: 'Ofensivo' },
];

const POS_MAP: Record<string, string> = { G: 'G', Z: 'Z', L: 'L', M: 'M', A: 'A' };
const POS_COLOR: Record<string, string> = {
  G: '#3b9adb', Z: '#4ade80', L: '#a8b8cc', M: '#f5d020', A: '#ef4444',
};

export function Lineup() {
  const navigate = useNavigate();
  const { career, saveLineup } = useCareerStore();

  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [style, setStyle] = useState<Style>('balanced');
  const [startingIds, setStartingIds] = useState<(number | null)[]>(Array(11).fill(null));
  const [benchIds, setBenchIds] = useState<(number | null)[]>(Array(5).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<{ type: 'starting' | 'bench'; index: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  useEffect(() => {
    if (!career) return;
    const existing = career.lineups.find((l) => l.round === career.current_round);
    if (existing) {
      setFormation(existing.formation);
      setStyle(existing.style);
      setStartingIds([...existing.starting_ids, ...Array(11).fill(null)].slice(0, 11) as (number | null)[]);
      setBenchIds([...existing.bench_ids, ...Array(5).fill(null)].slice(0, 5) as (number | null)[]);
    }
  }, [career]);

  if (!career) { navigate('/'); return null; }

  const round = career.current_round;
  const teamPlayers = getPlayersByTeam(career.team_id);
  const team = getTeamById(career.team_id);
  const allSelected = [...startingIds, ...benchIds].filter((id): id is number => id !== null);

  const startingPlayers: (Player | null)[] = startingIds.map(
    (id) => (id !== null ? PLAYERS.find((p) => p.id === id) ?? null : null)
  );

  const handleSlotClick = (index: number) => {
    const player = startingPlayers[index];
    if (player) {
      const next = [...startingIds]; next[index] = null; setStartingIds(next);
    } else {
      setSelectedSlot({ type: 'starting', index });
    }
  };

  const handleBenchSlotClick = (index: number) => {
    const id = benchIds[index];
    if (id !== null) {
      const next = [...benchIds]; next[index] = null; setBenchIds(next);
    } else {
      setSelectedSlot({ type: 'bench', index });
    }
  };

  const handlePlayerSelect = (player: Player) => {
    if (!selectedSlot) return;
    if (selectedSlot.type === 'starting') {
      const next = [...startingIds]; next[selectedSlot.index] = player.id; setStartingIds(next);
    } else {
      const next = [...benchIds]; next[selectedSlot.index] = player.id; setBenchIds(next);
    }
    setSelectedSlot(null);
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    const slots = FORMATION_SLOTS[formation];
    const filledStarting = startingIds.filter((id): id is number => id !== null);
    const filledBench = benchIds.filter((id): id is number => id !== null);
    if (filledStarting.length !== 11) errs.push('Selecione exatamente 11 titulares.');
    if (filledBench.length !== 5) errs.push('Selecione exatamente 5 reservas.');
    const gkSlotIndex = slots.findIndex((s) => s.pos === 'G');
    const gkId = startingIds[gkSlotIndex];
    const gkPlayer = gkId ? PLAYERS.find((p) => p.id === gkId) : null;
    if (!gkPlayer || gkPlayer.position !== 'G') errs.push('Coloque um goleiro (G) no slot de goleiro.');
    const unique = new Set([...filledStarting, ...filledBench]);
    if (unique.size < filledStarting.length + filledBench.length) errs.push('Jogador duplicado.');
    for (const id of [...filledStarting, ...filledBench]) {
      const ps = career.player_states.find((s) => s.player_id === id);
      if (ps?.injury_until_round != null && round <= ps.injury_until_round) {
        const p = PLAYERS.find((pl) => pl.id === id);
        errs.push(`${p?.name} está lesionado.`);
      }
      if (ps?.suspended_until_round != null && round <= ps.suspended_until_round) {
        const p = PLAYERS.find((pl) => pl.id === id);
        errs.push(`${p?.name} está suspenso.`);
      }
    }
    return errs;
  };

  const handleConfirm = async () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); setErrorModalOpen(true); return; }
    setSaving(true);
    await saveLineup({
      round,
      formation,
      style,
      starting_ids: startingIds.filter((id): id is number => id !== null),
      bench_ids: benchIds.filter((id): id is number => id !== null),
    });
    navigate('/single/career');
  };

  // Colunas da lista de jogadores disponíveis
  const playerColumns: Column<Player>[] = [
    {
      key: 'pos', label: 'P', width: 26, align: 'center',
      render: (p) => (
        <span style={{ fontWeight: 700, fontSize: 11, color: POS_COLOR[p.position] ?? '#a8b8cc' }}>
          {POS_MAP[p.position] ?? p.position}
        </span>
      ),
    },
    {
      key: 'name', label: 'Nome', align: 'left', sticky: true,
      sortable: true, sortValue: (p) => p.name,
      render: (p) => {
        const inSquad = allSelected.includes(p.id);
        const ps = career.player_states.find((s) => s.player_id === p.id);
        const injured = ps?.injury_until_round != null && round <= ps.injury_until_round;
        const suspended = ps?.suspended_until_round != null && round <= ps.suspended_until_round;
        return (
          <span style={{
            color: inSquad ? '#4ade80' : injured || suspended ? '#6b7c93' : '#f5f5f0',
            fontWeight: inSquad ? 600 : 400,
            textDecoration: injured || suspended ? 'line-through' : 'none',
          }}>
            {p.name}
          </span>
        );
      },
    },
    {
      key: 'force', label: 'F', width: 30, align: 'center',
      sortable: true, sortValue: (p) => p.force,
      render: (p) => (
        <span style={{ fontWeight: 700, color: '#f5d020', fontSize: 12 }}>
          {p.force}
        </span>
      ),
    },
    {
      key: 'energy', label: 'Energia', width: 70, align: 'center',
      render: (p) => {
        const ps = career.player_states.find((s) => s.player_id === p.id);
        return <EnergyBar value={ps?.fitness ?? 100} width={62} />;
      },
    },
    {
      key: 'status', label: 'Status', width: 52, align: 'center',
      render: (p) => {
        const ps = career.player_states.find((s) => s.player_id === p.id);
        if (ps?.injury_until_round != null && round <= ps.injury_until_round)
          return <span style={{ color: '#ef4444', fontSize: 10 }}>Lesão</span>;
        if (ps?.suspended_until_round != null && round <= ps.suspended_until_round)
          return <span style={{ color: '#f5d020', fontSize: 10 }}>Susp.</span>;
        return <span style={{ color: '#4ade80', fontSize: 10 }}>OK</span>;
      },
    },
  ];

  const availableForSelection = teamPlayers.filter((p) => {
    if (allSelected.includes(p.id)) return false;
    const ps = career.player_states.find((s) => s.player_id === p.id);
    if (ps?.injury_until_round != null && round <= ps.injury_until_round) return false;
    if (ps?.suspended_until_round != null && round <= ps.suspended_until_round) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a1e35', color: '#f5f5f0' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c' }}
      >
        <button onClick={() => navigate('/single/career')}
          className="rounded p-1.5"
          style={{ color: '#a8b8cc', backgroundColor: '#15304f', border: '1px solid #1e3a5c' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-retro text-xl" style={{ color: '#f5d020' }}>Escalação — Rodada {round}</h1>
        </div>
        <Button size="sm" onClick={handleConfirm} loading={saving}>
          <Check size={13} /> Confirmar
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-0" style={{ minHeight: 'calc(100vh - 60px)' }}>

        {/* Coluna esquerda: campo + controles */}
        <div className="flex flex-col gap-3 p-3 lg:w-80 shrink-0" style={{ borderRight: '1px solid #1e3a5c' }}>
          {/* Formação */}
          <div>
            <p style={{ color: '#a8b8cc', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Formação
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FORMATIONS.map((f) => (
                <button key={f} onClick={() => { setFormation(f); setStartingIds(Array(11).fill(null)); }}
                  className="rounded px-3 py-1.5 transition-all"
                  style={{
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    backgroundColor: formation === f ? '#f5d020' : '#15304f',
                    color: formation === f ? '#0a1e35' : '#a8b8cc',
                    border: formation === f ? '1px solid #f5d020' : '1px solid #1e3a5c',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Estilo */}
          <div>
            <p style={{ color: '#a8b8cc', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Estilo
            </p>
            <div className="flex gap-1.5">
              {STYLES.map(({ key, label }) => (
                <button key={key} onClick={() => setStyle(key)}
                  className="flex-1 rounded py-1.5 transition-all"
                  style={{
                    fontSize: 11, fontWeight: style === key ? 700 : 400, cursor: 'pointer',
                    backgroundColor: style === key ? '#f5d020' : '#15304f',
                    color: style === key ? '#0a1e35' : '#a8b8cc',
                    border: style === key ? '1px solid #f5d020' : '1px solid #1e3a5c',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Campo SVG */}
          <FieldVisualizer
            formation={formation}
            startingPlayers={startingPlayers}
            onSlotClick={handleSlotClick}
            primaryColor={team?.primary_color}
          />

          {/* Banco */}
          <div>
            <p style={{ color: '#a8b8cc', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Banco ({benchIds.filter(Boolean).length}/5)
            </p>
            <div className="grid grid-cols-5 gap-1">
              {benchIds.map((id, i) => {
                const p = id ? PLAYERS.find((pl) => pl.id === id) : null;
                const force = p ? p.force : 0;
                return (
                  <button key={i} onClick={() => handleBenchSlotClick(i)}
                    className="flex flex-col items-center rounded py-1.5 px-1 transition-all"
                    style={{
                      fontSize: 9, cursor: 'pointer',
                      backgroundColor: p ? 'rgba(245,208,32,0.1)' : '#0d1f36',
                      border: p ? '1px solid #a88a1c' : '1px solid #1e3a5c',
                    }}>
                    {p ? (
                      <>
                        <span style={{ color: '#f5d020', fontWeight: 700, fontSize: 11 }}>F:{force}</span>
                        <span className="truncate w-full text-center" style={{ color: '#f5f5f0', fontSize: 9 }}>
                          {p.name.split(' ').pop()?.slice(0, 7)}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: '#1e3a5c', fontSize: 16 }}>+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna direita: lista de jogadores */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedSlot ? (
            <>
              <div
                className="flex items-center justify-between px-4 py-2 shrink-0"
                style={{ backgroundColor: 'rgba(245,208,32,0.08)', borderBottom: '1px solid #1e3a5c' }}
              >
                <span style={{ color: '#f5d020', fontSize: 13, fontWeight: 600 }}>
                  Escolhendo {selectedSlot.type === 'starting' ? 'titular' : 'reserva'} #{selectedSlot.index + 1}
                </span>
                <button onClick={() => setSelectedSlot(null)} style={{ color: '#a8b8cc', fontSize: 12, cursor: 'pointer', border: 'none', background: 'none' }}>
                  Cancelar
                </button>
              </div>
              <DataTable<Player>
                columns={playerColumns}
                data={availableForSelection}
                onRowClick={handlePlayerSelect}
                density="compact"
                zebraStripe
              />
            </>
          ) : (
            <>
              <div
                className="px-4 py-2 shrink-0"
                style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c', fontSize: 12, color: '#6b7c93' }}
              >
                Clique num slot no campo para adicionar jogadores
              </div>
              <DataTable<Player>
                columns={playerColumns}
                data={teamPlayers}
                selectedRow={null}
                density="compact"
                zebraStripe
              />
            </>
          )}
        </div>
      </div>

      {/* Modal de erros */}
      <Modal open={errorModalOpen} onClose={() => setErrorModalOpen(false)} title="Escalação inválida">
        <ul className="flex flex-col gap-2">
          {errors.map((e, i) => (
            <li key={i} style={{ fontSize: 13, color: '#ef4444', display: 'flex', gap: 8 }}>
              <span>•</span>{e}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Button fullWidth variant="secondary" onClick={() => setErrorModalOpen(false)}>Entendido</Button>
        </div>
      </Modal>
    </div>
  );
}
