import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { DataTable, type Column } from '../components/DataTable';
import { Button } from '../components/Button';
import { OfferModal } from '../components/OfferModal';
import { useCareerStore } from '../stores/careerStore';
import { PLAYERS, getTeamById } from '../data';
import { calculateMarketValue } from '../lib/market';
import { formatCurrency } from '../lib/finance';
import { formatHighlights } from '../lib/simulation/playerAttributes';
import { ATTR_LABEL, POSITION_LABEL } from '../types';
import type { Player } from '../types';
import type { SearchFilters } from '../types/market';
import { DEFAULT_SEARCH_FILTERS } from '../types/market';
import { POS_COLOR } from '../types/academy';

const ATTRS_FOR_FILTER = Object.entries(ATTR_LABEL)
  .map(([k, v]) => ({ key: k, label: v }))
  .sort((a, b) => a.label.localeCompare(b.label));

const POSITIONS = ['G', 'Z', 'L', 'M', 'A'];
const SIDES     = ['E', 'D', 'A'];

function applyFilters(players: Player[], filters: SearchFilters, userTeamId: number, listings: Set<number>): Player[] {
  return players.filter((p) => {
    if (p.team_id === userTeamId) return false; // não mostra seus próprios jogadores
    if (filters.name && !p.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.position && p.position !== filters.position) return false;
    if (filters.side && p.side !== filters.side) return false;
    if (p.force < filters.force_min || p.force > filters.force_max) return false;
    if (p.age < filters.age_min || p.age > filters.age_max) return false;
    if (filters.only_star && !p.is_star && !p.is_world_top) return false;
    if (filters.only_world_top && !p.is_world_top) return false;
    if (filters.only_for_sale && !listings.has(p.id)) return false;
    if (filters.char1 && p.highlighted_attr_1 !== filters.char1 && p.highlighted_attr_2 !== filters.char1) return false;
    if (filters.char2 && p.highlighted_attr_1 !== filters.char2 && p.highlighted_attr_2 !== filters.char2) return false;
    return true;
  });
}

export function SearchPage() {
  const navigate = useNavigate();
  const { career, submitOfferAction } = useCareerStore();

  const [filters, setFilters] = useState<SearchFilters>({ ...DEFAULT_SEARCH_FILTERS });
  const [results, setResults] = useState<Player[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  if (!career) return null;

  const marketIsOpen = career.market_state?.is_open ?? false;
  const listingsSet  = new Set(career.market_state?.listings.map((l) => l.player_id) ?? []);

  const handleSearch = () => {
    const res = applyFilters(PLAYERS, filters, career.team_id, listingsSet);
    // Ordenar por força desc
    setResults(res.sort((a, b) => b.force - a.force).slice(0, 200));
    setSearched(true);
  };

  const handleReset = () => {
    setFilters({ ...DEFAULT_SEARCH_FILTERS });
    setResults([]);
    setSearched(false);
  };

  const setF = <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setOfferModalOpen(true);
  };

  // Colunas da tabela (tela 7 do Brasfoot)
  const columns: Column<Player>[] = [
    {
      key: 'pos', label: 'P', width: 24, align: 'center',
      render: (p) => <span style={{ fontWeight: 700, fontSize: 11, color: POS_COLOR[p.position] ?? '#a8b8cc' }}>{p.position}</span>,
    },
    {
      key: 'name', label: 'Nome', align: 'left',
      sortable: true, sortValue: (p) => p.name,
      render: (p) => (
        <span style={{ color: '#f5f5f0', fontWeight: 500, fontSize: 12 }}>
          {p.name}
          {p.is_world_top && <span style={{ marginLeft: 3 }}>🌟</span>}
          {p.is_star && !p.is_world_top && <span style={{ marginLeft: 3, fontSize: 10 }}>⭐</span>}
        </span>
      ),
    },
    {
      key: 'team', label: 'Time', width: 48, align: 'center',
      render: (p) => {
        const t = getTeamById(p.team_id);
        return <span style={{ fontSize: 10, color: '#a8b8cc' }}>{t?.short_name ?? '?'}</span>;
      },
    },
    {
      key: 'side', label: 'L', width: 22, align: 'center',
      render: (p) => <span style={{ fontSize: 10, color: '#6b7c93' }}>{p.side}</span>,
    },
    {
      key: 'force', label: 'F', width: 28, align: 'center',
      sortable: true, sortValue: (p) => p.force,
      render: (p) => <span style={{ fontWeight: 700, color: '#f5d020', fontSize: 12 }}>{p.force}</span>,
    },
    {
      key: 'car', label: 'Car.', width: 52, align: 'center',
      render: (p) => {
        const h = formatHighlights(p);
        return <span style={{ fontSize: 10, color: h !== '—' ? '#f5d020' : '#6b7c93' }}>{h}</span>;
      },
    },
    {
      key: 'age', label: 'Idade', width: 40, align: 'center',
      sortable: true, sortValue: (p) => p.age,
      render: (p) => <span style={{ color: '#a8b8cc' }}>{p.age}</span>,
    },
    {
      key: 'value', label: 'Valor', width: 70, align: 'right',
      sortable: true, sortValue: (p) => calculateMarketValue(p),
      render: (p) => (
        <span style={{ fontSize: 10, color: '#f5d020' }}>{formatCurrency(calculateMarketValue(p))}</span>
      ),
    },
    {
      key: 'forsale', label: 'V', width: 22, align: 'center',
      render: (p) => (
        <span style={{ fontSize: 11, color: listingsSet.has(p.id) ? '#4ade80' : '#1e3a5c' }}>
          {listingsSet.has(p.id) ? '✓' : '—'}
        </span>
      ),
    },
  ];

  const FILTER_LABEL: React.CSSProperties = { fontSize: 11, color: '#6b7c93', marginBottom: 2 };
  const SELECT_STYLE: React.CSSProperties = {
    backgroundColor: '#0d1f36', border: '1px solid #1e3a5c',
    color: '#f5f5f0', fontSize: 11, padding: '3px 6px', borderRadius: 4, width: '100%',
  };
  const INPUT_STYLE: React.CSSProperties = {
    backgroundColor: '#0d1f36', border: '1px solid #1e3a5c',
    color: '#f5f5f0', fontSize: 12, padding: '4px 8px', borderRadius: 4, width: '100%',
  };

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} style={{ color: '#a8b8cc', cursor: 'pointer', border: 'none', background: 'none' }}>
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-retro text-xl" style={{ color: '#f5d020' }}>Procura de Jogadores</h1>
          </div>
          {!marketIsOpen && (
            <span style={{ fontSize: 11, color: '#6b7c93' }}>
              Mercado fechado — propostas na janela (R.1-5 ou R.20-25)
            </span>
          )}
          {marketIsOpen && (
            <span style={{ fontSize: 11, color: '#4ade80' }}>
              🏪 Mercado aberto!
            </span>
          )}
        </div>

        {/* Painel de filtros */}
        <div
          className="shrink-0 px-4 py-3 overflow-x-auto"
          style={{ backgroundColor: '#15304f', borderBottom: '1px solid #1e3a5c' }}
        >
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', minWidth: 700 }}>
            {/* Nome */}
            <div>
              <div style={FILTER_LABEL}>Nome</div>
              <input
                value={filters.name}
                onChange={(e) => setF('name', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar..."
                style={INPUT_STYLE}
              />
            </div>

            {/* Posição */}
            <div>
              <div style={FILTER_LABEL}>Posição</div>
              <select value={filters.position} onChange={(e) => setF('position', e.target.value as never)} style={SELECT_STYLE}>
                <option value="">Qualquer</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{POSITION_LABEL[p as keyof typeof POSITION_LABEL]}</option>)}
              </select>
            </div>

            {/* Lado */}
            <div>
              <div style={FILTER_LABEL}>Lado</div>
              <select value={filters.side} onChange={(e) => setF('side', e.target.value as never)} style={SELECT_STYLE}>
                <option value="">Qualquer</option>
                {SIDES.map((s) => <option key={s} value={s}>{s === 'E' ? 'Esquerdo' : s === 'D' ? 'Direito' : 'Ambos'}</option>)}
              </select>
            </div>

            {/* Característica 1 */}
            <div>
              <div style={FILTER_LABEL}>Característica 1</div>
              <select value={filters.char1} onChange={(e) => setF('char1', e.target.value as never)} style={SELECT_STYLE}>
                <option value="">Qualquer</option>
                {ATTRS_FOR_FILTER.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>

            {/* Característica 2 */}
            <div>
              <div style={FILTER_LABEL}>Característica 2</div>
              <select value={filters.char2} onChange={(e) => setF('char2', e.target.value as never)} style={SELECT_STYLE}>
                <option value="">Qualquer</option>
                {ATTRS_FOR_FILTER.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>

            {/* Força */}
            <div>
              <div className="flex justify-between" style={FILTER_LABEL}>
                <span>Força</span>
                <span style={{ color: '#f5d020' }}>{filters.force_min}–{filters.force_max}</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <input type="number" min={1} max={20} value={filters.force_min} onChange={(e) => setF('force_min', Number(e.target.value))}
                  style={{ ...INPUT_STYLE, width: 42 }} />
                <span style={{ color: '#6b7c93' }}>–</span>
                <input type="number" min={1} max={20} value={filters.force_max} onChange={(e) => setF('force_max', Number(e.target.value))}
                  style={{ ...INPUT_STYLE, width: 42 }} />
              </div>
            </div>

            {/* Idade */}
            <div>
              <div className="flex justify-between" style={FILTER_LABEL}>
                <span>Idade</span>
                <span style={{ color: '#f5d020' }}>{filters.age_min}–{filters.age_max}</span>
              </div>
              <div className="flex gap-1.5 items-center">
                <input type="number" min={16} max={45} value={filters.age_min} onChange={(e) => setF('age_min', Number(e.target.value))}
                  style={{ ...INPUT_STYLE, width: 42 }} />
                <span style={{ color: '#6b7c93' }}>–</span>
                <input type="number" min={16} max={45} value={filters.age_max} onChange={(e) => setF('age_max', Number(e.target.value))}
                  style={{ ...INPUT_STYLE, width: 42 }} />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-1.5" style={{ paddingTop: 14 }}>
              {[
                { key: 'only_star',      label: 'Estrela' },
                { key: 'only_world_top', label: 'Top Mundial' },
                { key: 'only_for_sale',  label: 'À venda' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters[key as keyof SearchFilters] as boolean}
                    onChange={(e) => setF(key as keyof SearchFilters, e.target.checked as never)}
                    style={{ accentColor: '#f5d020' }}
                  />
                  <span style={{ fontSize: 11, color: '#a8b8cc' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={handleSearch}>
              <Search size={13} /> Procurar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset}>
              <X size={13} /> Resetar
            </Button>
            {searched && (
              <span style={{ fontSize: 11, color: '#6b7c93' }}>
                {results.length} jogador{results.length !== 1 ? 'es' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-auto">
          {!searched ? (
            <div className="flex items-center justify-center h-full" style={{ color: '#6b7c93', fontSize: 13 }}>
              Use os filtros acima e clique em Procurar
            </div>
          ) : results.length === 0 ? (
            <div className="flex items-center justify-center h-full" style={{ color: '#6b7c93', fontSize: 13 }}>
              Nenhum jogador encontrado com esses filtros
            </div>
          ) : (
            <DataTable<Player>
              columns={columns}
              data={results}
              onRowClick={handlePlayerClick}
              selectedRow={selectedPlayer}
              selectedKey={(p) => p.id}
              density="compact"
              zebraStripe
            />
          )}
        </div>
      </div>

      {/* Modal de proposta */}
      {selectedPlayer && offerModalOpen && (
        <OfferModal
          player={selectedPlayer}
          career={career}
          onSubmit={async (amount) => {
            const result = await submitOfferAction(selectedPlayer.id, amount);
            return result;
          }}
          onClose={() => setOfferModalOpen(false)}
        />
      )}
    </Layout>
  );
}
