import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hammer, Check } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useCareerStore } from '../stores/careerStore';
import {
  formatCurrency, totalStadiumCapacity,
  calcUpgradeCost, calcUpgradeDuration, getSuggestedPrices,
} from '../lib/finance';
import { SECTORS, SECTOR_LABELS, SEAT_COST, type StadiumSector } from '../types/finance';

// ── Helpers de UI ─────────────────────────────────────────────

const PANEL: React.CSSProperties = {
  backgroundColor: '#15304f',
  border: '1px solid #1e3a5c',
  borderRadius: 8,
  padding: '10px 14px',
};

const TH: React.CSSProperties = {
  fontSize: 11, color: '#6b7c93', fontWeight: 500,
  padding: '4px 8px', textAlign: 'left',
  borderBottom: '1px solid #1e3a5c',
};

const TD: React.CSSProperties = {
  fontSize: 12, color: '#f5f5f0',
  padding: '5px 8px', borderBottom: '1px solid rgba(30,58,92,0.4)',
};

// ── Componente principal ──────────────────────────────────────

export function StadiumPage() {
  const navigate = useNavigate();
  const { career, updateCareer } = useCareerStore();

  const [upgradeModal, setUpgradeModal] = useState(false);
  const [upgradeSector, setUpgradeSector] = useState<StadiumSector>('arquibancada');
  const [upgradeSeats, setUpgradeSeats] = useState(2000);
  const [editPrices, setEditPrices] = useState(false);
  const [prices, setPrices] = useState(
    career?.stadium?.ticket_prices ?? { geral: 3, arquibancada: 12, cadeira: 15, camarote: 30 }
  );

  if (!career?.stadium || !career?.finances) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64" style={{ color: '#6b7c93', fontSize: 13 }}>
          Estádio não disponível. Inicie uma nova carreira.
        </div>
      </Layout>
    );
  }

  const { stadium, finances } = career;
  const total = totalStadiumCapacity(stadium.capacity);
  const suggested = getSuggestedPrices(1.0);
  const round = career.current_round;

  const isUpgrading = !!stadium.upgrade_in_progress;
  const upgradeRoundsLeft = isUpgrading
    ? Math.max(0, (stadium.upgrade_in_progress!.completes_at_round) - round)
    : 0;

  const handleSavePrices = async () => {
    await updateCareer({ stadium: { ...stadium, ticket_prices: prices, use_suggested_prices: false } });
    setEditPrices(false);
  };

  const handleToggleSuggested = async () => {
    await updateCareer({ stadium: { ...stadium, use_suggested_prices: !stadium.use_suggested_prices } });
  };

  const handleStartUpgrade = async () => {
    const cost = calcUpgradeCost(upgradeSector, upgradeSeats);
    const duration = calcUpgradeDuration(upgradeSeats);
    if (finances.cash_balance < cost) { alert('Saldo insuficiente!'); return; }
    await updateCareer({
      stadium: {
        ...stadium,
        upgrade_in_progress: {
          sector: upgradeSector,
          additional_seats: upgradeSeats,
          completes_at_round: round + duration,
          cost,
        },
      },
      finances: {
        ...finances,
        cash_balance: finances.cash_balance - cost,
        expenses: { ...finances.expenses, stadium: finances.expenses.stadium + cost },
      },
    });
    setUpgradeModal(false);
  };

  const upgradeCost = calcUpgradeCost(upgradeSector, upgradeSeats);
  const upgradeDuration = calcUpgradeDuration(upgradeSeats);
  const canAfford = finances.cash_balance >= upgradeCost;

  return (
    <Layout>
      <div className="p-4" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/single/career')}
            style={{ color: '#a8b8cc', cursor: 'pointer', border: 'none', background: 'none' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-retro text-2xl" style={{ color: '#f5d020' }}>
              {stadium.name}
            </h1>
            <p style={{ color: '#a8b8cc', fontSize: 12 }}>
              {total.toLocaleString('pt-BR')} lugares · Caixa: {formatCurrency(finances.cash_balance)}
            </p>
          </div>
        </div>

        {/* Upgrade em andamento */}
        {isUpgrading && (
          <div
            className="rounded mb-4 flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: 'rgba(59,154,219,0.1)', border: '1px solid rgba(59,154,219,0.3)' }}
          >
            <Hammer size={16} style={{ color: '#3b9adb' }} />
            <div>
              <span style={{ fontSize: 12, color: '#3b9adb', fontWeight: 600 }}>
                Obra em andamento — {SECTOR_LABELS[stadium.upgrade_in_progress!.sector]}
              </span>
              <span style={{ fontSize: 11, color: '#6b7c93', marginLeft: 8 }}>
                +{stadium.upgrade_in_progress!.additional_seats.toLocaleString()} lugares ·
                conclui em {upgradeRoundsLeft} rodada{upgradeRoundsLeft !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Tabela de capacidade e preços */}
        <div style={PANEL} className="mb-4">
          <div
            className="flex items-center justify-between mb-3"
            style={{ borderBottom: '1px solid #1e3a5c', paddingBottom: 6 }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a8b8cc' }}>
              Capacidade e Ingressos
            </span>
            {!editPrices && (
              <button
                onClick={() => { setPrices(stadium.ticket_prices); setEditPrices(true); }}
                style={{ fontSize: 11, color: '#f5d020', cursor: 'pointer', border: 'none', background: 'none' }}
              >
                editar preços
              </button>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Setor</th>
                <th style={{ ...TH, textAlign: 'right' }}>Capacidade</th>
                <th style={{ ...TH, textAlign: 'right' }}>Preço (R$)</th>
                <th style={{ ...TH, textAlign: 'right' }}>Sugerido</th>
              </tr>
            </thead>
            <tbody>
              {SECTORS.map((sector) => {
                const cap   = stadium.capacity[sector];
                const price = editPrices ? prices[sector] : stadium.ticket_prices[sector];
                const sugg  = suggested[sector];
                return (
                  <tr key={sector}>
                    <td style={TD}>{SECTOR_LABELS[sector]}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#f5d020' }}>
                      {cap.toLocaleString('pt-BR')}
                    </td>
                    <td style={{ ...TD, textAlign: 'right' }}>
                      {editPrices ? (
                        <input
                          type="number"
                          min={1} max={9999}
                          value={prices[sector]}
                          onChange={(e) => setPrices((prev) => ({ ...prev, [sector]: Number(e.target.value) }))}
                          style={{
                            width: 64, backgroundColor: '#0d1f36', border: '1px solid #1e3a5c',
                            color: '#f5f5f0', fontSize: 11, padding: '2px 6px',
                            borderRadius: 4, textAlign: 'right',
                          }}
                        />
                      ) : (
                        <span style={{ color: stadium.use_suggested_prices ? '#6b7c93' : '#f5f5f0' }}>
                          {price}
                        </span>
                      )}
                    </td>
                    <td style={{ ...TD, textAlign: 'right', color: '#6b7c93' }}>
                      {sugg}
                    </td>
                  </tr>
                );
              })}
              {/* Total */}
              <tr style={{ backgroundColor: 'rgba(21,48,79,0.5)' }}>
                <td style={{ ...TD, fontWeight: 600, color: '#a8b8cc' }}>Total</td>
                <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#f5d020' }}>
                  {total.toLocaleString('pt-BR')}
                </td>
                <td colSpan={2} style={TD} />
              </tr>
            </tbody>
          </table>

          {/* Preços sugeridos toggle */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={stadium.use_suggested_prices}
              onChange={handleToggleSuggested}
              style={{ accentColor: '#f5d020' }}
            />
            <span style={{ fontSize: 12, color: '#a8b8cc' }}>
              Usar sempre preços sugeridos
            </span>
          </div>

          {editPrices && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleSavePrices}>
                <Check size={13} /> Salvar preços
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditPrices(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Preços sugeridos info */}
        <div
          className="rounded px-3 py-2 mb-4 text-xs"
          style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', color: '#6b7c93' }}
        >
          Preços sugeridos: G:{suggested.geral}; A:{suggested.arquibancada}; Cd:{suggested.cadeira}; Cm:{suggested.camarote}
        </div>

        {/* Custo por lugar */}
        <div style={PANEL} className="mb-4">
          <span style={{ fontSize: 12, fontWeight: 600, color: '#a8b8cc', display: 'block', marginBottom: 6 }}>
            Custo de Expansão por Lugar
          </span>
          <div className="grid grid-cols-2 gap-2">
            {SECTORS.map((s) => (
              <div key={s} className="flex justify-between" style={{ fontSize: 11 }}>
                <span style={{ color: '#6b7c93' }}>{SECTOR_LABELS[s]}</span>
                <span style={{ color: '#f5d020' }}>
                  R$ {SEAT_COST[s].toLocaleString('pt-BR')}/lugar
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Botão de expansão */}
        <Button
          onClick={() => setUpgradeModal(true)}
          disabled={isUpgrading}
          variant={isUpgrading ? 'secondary' : 'primary'}
        >
          <Hammer size={15} />
          {isUpgrading ? 'Obra em andamento' : 'Expandir Estádio'}
        </Button>
      </div>

      {/* Modal de expansão */}
      {upgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,30,53,0.85)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setUpgradeModal(false); }}
        >
          <div
            className="w-full rounded-xl"
            style={{ maxWidth: 420, backgroundColor: '#15304f', border: '1px solid #1e3a5c' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #1e3a5c' }}
            >
              <h2 className="font-retro text-xl" style={{ color: '#f5d020' }}>
                Expandir Estádio
              </h2>
              <button onClick={() => setUpgradeModal(false)}
                style={{ color: '#a8b8cc', fontSize: 18, cursor: 'pointer', border: 'none', background: 'none' }}>
                ×
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Setor */}
              <div>
                <label style={{ fontSize: 11, color: '#a8b8cc', display: 'block', marginBottom: 4 }}>
                  Setor
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SECTORS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setUpgradeSector(s)}
                      style={{
                        fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                        backgroundColor: upgradeSector === s ? '#f5d020' : '#0d1f36',
                        color: upgradeSector === s ? '#0a1e35' : '#a8b8cc',
                        border: upgradeSector === s ? '1px solid #f5d020' : '1px solid #1e3a5c',
                        fontWeight: upgradeSector === s ? 700 : 400,
                      }}
                    >
                      {SECTOR_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider de lugares */}
              <div>
                <div className="flex justify-between" style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: 11, color: '#a8b8cc' }}>Lugares a adicionar</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f5d020' }}>
                    +{upgradeSeats.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={500} max={20000} step={500}
                  value={upgradeSeats}
                  onChange={(e) => setUpgradeSeats(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f5d020' }}
                />
                <div className="flex justify-between" style={{ fontSize: 10, color: '#6b7c93', marginTop: 2 }}>
                  <span>500</span><span>20.000</span>
                </div>
              </div>

              {/* Preview */}
              <div
                className="rounded px-4 py-3 grid grid-cols-2 gap-2"
                style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', fontSize: 12 }}
              >
                <div>
                  <span style={{ color: '#6b7c93' }}>Custo total</span><br />
                  <span style={{ color: canAfford ? '#4ade80' : '#ef4444', fontWeight: 700 }}>
                    {formatCurrency(upgradeCost)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6b7c93' }}>Duração</span><br />
                  <span style={{ color: '#f5f5f0', fontWeight: 700 }}>
                    {upgradeDuration} rodada{upgradeDuration !== 1 ? 's' : ''}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6b7c93' }}>Capacidade atual</span><br />
                  <span style={{ color: '#f5d020' }}>
                    {stadium.capacity[upgradeSector].toLocaleString()}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6b7c93' }}>Após obra</span><br />
                  <span style={{ color: '#f5d020' }}>
                    {(stadium.capacity[upgradeSector] + upgradeSeats).toLocaleString()}
                  </span>
                </div>
              </div>

              {!canAfford && (
                <p style={{ fontSize: 11, color: '#ef4444' }}>
                  Saldo insuficiente. Disponível: {formatCurrency(finances.cash_balance)}
                </p>
              )}

              <div className="flex gap-3">
                <Button fullWidth variant="secondary" onClick={() => setUpgradeModal(false)}>
                  Cancelar
                </Button>
                <Button fullWidth disabled={!canAfford} onClick={handleStartUpgrade}>
                  Iniciar Obra »
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
