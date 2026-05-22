import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox, Send, History, Tag, Search } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { OfferModal } from '../components/OfferModal';import { useCareerStore } from '../stores/careerStore';
import { PLAYERS, getTeamById } from '../data';
import { calculateMarketValue } from '../lib/market';
import { formatCurrency } from '../lib/finance';
import type { Player } from '../types';
import { POS_COLOR } from '../types/academy';

type Tab = 'incoming' | 'outgoing' | 'my_squad' | 'history';

const STATUS_COLOR: Record<string, string> = {
  pending:  '#f5d020',
  accepted: '#4ade80',
  rejected: '#ef4444',
  countered:'#3b9adb',
  expired:  '#6b7c93',
};

const STATUS_LABEL: Record<string, string> = {
  pending:  'Aguardando',
  accepted: 'Aceita',
  rejected: 'Rejeitada',
  countered:'Contraproposta',
  expired:  'Expirada',
};

export function MarketPage() {
  const navigate = useNavigate();
  const {
    career,
    acceptIncomingOfferAction,
    rejectIncomingOfferAction,
    completeTransferAction,
    listForSaleAction,
    delistAction,
    submitOfferAction,
  } = useCareerStore();

  const [tab, setTab] = useState<Tab>('incoming');
  const [offerPlayer, setOfferPlayer] = useState<Player | null>(null);
  const [listPriceInput, setListPriceInput] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState('');

  if (!career?.market_state) return null;

  const market = career.market_state;
  const isOpen = market.is_open;
  const myPlayers = PLAYERS.filter((p) => p.team_id === career.team_id);
  const listedByMe = new Set(market.listings.filter((l) => l.listed_by_team_id === career.team_id).map((l) => l.player_id));

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'incoming',  label: 'Propostas',    icon: <Inbox size={14} />, count: market.pending_offers_to_user.filter(o => o.status === 'pending').length },
    { key: 'outgoing',  label: 'Enviadas',     icon: <Send size={14} />,  count: market.pending_offers_from_user.filter(o => o.status === 'countered').length },
    { key: 'my_squad',  label: 'Meu Elenco',   icon: <Tag size={14} /> },
    { key: 'history',   label: 'Histórico',    icon: <History size={14} /> },
  ];

  const TD: React.CSSProperties = { fontSize: 12, color: '#f5f5f0', padding: '6px 8px', borderBottom: '1px solid rgba(30,58,92,0.4)' };
  const TH: React.CSSProperties = { fontSize: 11, color: '#6b7c93', fontWeight: 500, padding: '4px 8px', borderBottom: '1px solid #1e3a5c', textAlign: 'left' };

  return (
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ backgroundColor: '#0d1f36', borderBottom: '1px solid #1e3a5c' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/single/career')} style={{ color: '#a8b8cc', cursor: 'pointer', border: 'none', background: 'none' }}>
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-retro text-xl" style={{ color: '#f5d020' }}>Mercado de Transferências</h1>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 11, color: isOpen ? '#4ade80' : '#6b7c93' }}>
              {isOpen ? `🏪 Aberto até rodada ${market.closes_at_round}` : `🔒 Fechado (abre R.1-5 e R.20-25)`}
            </span>
            <Button size="sm" variant="secondary" onClick={() => navigate('/career/search')}>
              <Search size={12} /> Procurar
            </Button>
          </div>
        </div>

        {/* Notificação */}
        {notification && (
          <div className="px-4 py-2 shrink-0" style={{ backgroundColor: 'rgba(74,222,128,0.1)', borderBottom: '1px solid rgba(74,222,128,0.2)', fontSize: 12, color: '#4ade80' }}>
            {notification}
          </div>
        )}

        {/* Tabs */}
        <div className="flex shrink-0" style={{ borderBottom: '1px solid #1e3a5c', backgroundColor: '#15304f' }}>
          {TABS.map(({ key, label, icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-2.5 transition-colors"
              style={{
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                color: tab === key ? '#f5d020' : '#6b7c93',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: tab === key ? '2px solid #f5d020' : '2px solid transparent',
              }}
            >
              {icon}
              {label}
              {count !== undefined && count > 0 && (
                <span style={{
                  backgroundColor: '#f5d020', color: '#0a1e35',
                  borderRadius: 9999, fontSize: 10, fontWeight: 700,
                  padding: '0 5px', minWidth: 16, textAlign: 'center',
                }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-4">

          {/* Propostas recebidas */}
          {tab === 'incoming' && (
            <div>
              <p style={{ fontSize: 12, color: '#6b7c93', marginBottom: 12 }}>
                Times CPU estão interessados nos seus jogadores.
              </p>
              {market.pending_offers_to_user.length === 0 ? (
                <p style={{ fontSize: 13, color: '#1e3a5c', textAlign: 'center', marginTop: 40 }}>
                  Nenhuma proposta recebida.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Jogador</th>
                      <th style={TH}>De</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Valor ofertado</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Valor de mercado</th>
                      <th style={{ ...TH, textAlign: 'center' }}>Status</th>
                      <th style={{ ...TH, textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.pending_offers_to_user.map((offer) => {
                      const player = PLAYERS.find((p) => p.id === offer.player_id);
                      const fromTeam = getTeamById(offer.from_team_id);
                      const mv = player ? calculateMarketValue(player) : 0;
                      return (
                        <tr key={offer.id} style={{ borderBottom: '1px solid rgba(30,58,92,0.4)' }}>
                          <td style={TD}>{player?.name ?? '?'}</td>
                          <td style={{ ...TD, color: '#a8b8cc' }}>{fromTeam?.short_name ?? '?'}</td>
                          <td style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#f5d020' }}>
                            {formatCurrency(offer.amount)}
                          </td>
                          <td style={{ ...TD, textAlign: 'right', color: '#6b7c93' }}>
                            {formatCurrency(mv)}
                          </td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <span style={{ fontSize: 11, color: STATUS_COLOR[offer.status] }}>
                              {STATUS_LABEL[offer.status]}
                            </span>
                          </td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            {offer.status === 'pending' && (
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={async () => {
                                    setLoading(offer.id + 'acc');
                                    const r = await acceptIncomingOfferAction(offer.id);
                                    setLoading(null);
                                    if (!r.error) notify(`✓ ${player?.name} vendido por ${formatCurrency(offer.amount)}`);
                                  }}
                                  disabled={loading === offer.id + 'acc'}
                                  style={{ fontSize: 11, cursor: 'pointer', padding: '2px 8px', borderRadius: 4, backgroundColor: '#0d3b1f', border: '1px solid #4ade80', color: '#4ade80' }}
                                >
                                  Aceitar
                                </button>
                                <button
                                  onClick={async () => { await rejectIncomingOfferAction(offer.id); }}
                                  style={{ fontSize: 11, cursor: 'pointer', padding: '2px 8px', borderRadius: 4, backgroundColor: '#3b0d0d', border: '1px solid #ef4444', color: '#ef4444' }}
                                >
                                  Rejeitar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Propostas enviadas */}
          {tab === 'outgoing' && (
            <div>
              <p style={{ fontSize: 12, color: '#6b7c93', marginBottom: 12 }}>
                Suas propostas para jogadores de outros times.
              </p>
              {market.pending_offers_from_user.length === 0 ? (
                <p style={{ fontSize: 13, color: '#1e3a5c', textAlign: 'center', marginTop: 40 }}>
                  Você não fez nenhuma proposta ainda. Use a Procura para encontrar jogadores.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Jogador</th>
                      <th style={TH}>Para</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Proposta</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Contraproposta</th>
                      <th style={{ ...TH, textAlign: 'center' }}>Status</th>
                      <th style={{ ...TH, textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.pending_offers_from_user.map((offer) => {
                      const player = PLAYERS.find((p) => p.id === offer.player_id);
                      const toTeam = getTeamById(offer.to_team_id);
                      return (
                        <tr key={offer.id} style={{ borderBottom: '1px solid rgba(30,58,92,0.4)' }}>
                          <td style={TD}>{player?.name ?? '?'}</td>
                          <td style={{ ...TD, color: '#a8b8cc' }}>{toTeam?.short_name ?? '?'}</td>
                          <td style={{ ...TD, textAlign: 'right', color: '#f5d020' }}>
                            {formatCurrency(offer.amount)}
                          </td>
                          <td style={{ ...TD, textAlign: 'right', color: offer.counter_amount ? '#3b9adb' : '#6b7c93' }}>
                            {offer.counter_amount ? formatCurrency(offer.counter_amount) : '—'}
                          </td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <span style={{ fontSize: 11, color: STATUS_COLOR[offer.status] }}>
                              {STATUS_LABEL[offer.status]}
                            </span>
                          </td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            {offer.status === 'accepted' && (
                              <button
                                onClick={async () => {
                                  setLoading(offer.id);
                                  const r = await completeTransferAction(offer.id);
                                  setLoading(null);
                                  if (!r.error) notify(`✓ ${player?.name} chegou ao seu clube!`);
                                }}
                                disabled={loading === offer.id}
                                style={{ fontSize: 11, cursor: 'pointer', padding: '2px 8px', borderRadius: 4, backgroundColor: '#0d3b1f', border: '1px solid #4ade80', color: '#4ade80' }}
                              >
                                Contratar!
                              </button>
                            )}
                            {offer.status === 'countered' && player && (
                              <button
                                onClick={() => setOfferPlayer(player)}
                                style={{ fontSize: 11, cursor: 'pointer', padding: '2px 8px', borderRadius: 4, backgroundColor: '#0d1f3b', border: '1px solid #3b9adb', color: '#3b9adb' }}
                              >
                                Nova proposta
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Meu elenco — listar/deslistar */}
          {tab === 'my_squad' && (
            <div>
              <p style={{ fontSize: 12, color: '#6b7c93', marginBottom: 12 }}>
                Coloque jogadores à venda para que times CPU possam fazer propostas.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>P</th>
                    <th style={TH}>Jogador</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Força</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Valor</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Preço pedido</th>
                    <th style={{ ...TH, textAlign: 'center' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {myPlayers.map((player) => {
                    const mv = calculateMarketValue(player);
                    const isListed = listedByMe.has(player.id);
                    const priceInput = listPriceInput[player.id] ?? Math.round(mv * 1.1 / 100_000) * 100_000;
                    return (
                      <tr key={player.id} style={{ backgroundColor: isListed ? 'rgba(245,208,32,0.04)' : 'transparent', borderBottom: '1px solid rgba(30,58,92,0.4)' }}>
                        <td style={TD}>
                          <span style={{ color: POS_COLOR[player.position] ?? '#a8b8cc', fontWeight: 700, fontSize: 11 }}>
                            {player.position}
                          </span>
                        </td>
                        <td style={TD}>{player.name}</td>
                        <td style={{ ...TD, textAlign: 'right', color: '#f5d020', fontWeight: 700 }}>{player.force}</td>
                        <td style={{ ...TD, textAlign: 'right', color: '#a8b8cc' }}>{formatCurrency(mv)}</td>
                        <td style={{ ...TD, textAlign: 'right' }}>
                          {isListed ? (
                            <span style={{ color: '#f5d020' }}>
                              {formatCurrency(market.listings.find((l) => l.player_id === player.id)?.asking_price ?? 0)}
                            </span>
                          ) : (
                            <input
                              type="number"
                              step={100000}
                              value={priceInput}
                              onChange={(e) => setListPriceInput((prev) => ({ ...prev, [player.id]: Number(e.target.value) }))}
                              style={{ width: 80, backgroundColor: '#0d1f36', border: '1px solid #1e3a5c', color: '#f5f5f0', fontSize: 11, padding: '2px 6px', borderRadius: 4, textAlign: 'right' }}
                            />
                          )}
                        </td>
                        <td style={{ ...TD, textAlign: 'center' }}>
                          {isListed ? (
                            <button
                              onClick={() => delistAction(player.id)}
                              style={{ fontSize: 11, cursor: 'pointer', padding: '2px 8px', borderRadius: 4, backgroundColor: '#3b0d0d', border: '1px solid #ef4444', color: '#ef4444' }}
                            >
                              Deslistar
                            </button>
                          ) : (
                            <button
                              onClick={() => listForSaleAction(player.id, priceInput)}
                              disabled={!isOpen}
                              style={{ fontSize: 11, cursor: isOpen ? 'pointer' : 'not-allowed', opacity: isOpen ? 1 : 0.4, padding: '2px 8px', borderRadius: 4, backgroundColor: '#0d3b1f', border: '1px solid #4ade80', color: '#4ade80' }}
                            >
                              Listar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Histórico */}
          {tab === 'history' && (
            <div>
              {market.history.length === 0 ? (
                <p style={{ fontSize: 13, color: '#1e3a5c', textAlign: 'center', marginTop: 40 }}>
                  Nenhuma transferência registrada ainda.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={TH}>Rod.</th>
                      <th style={TH}>Jogador</th>
                      <th style={TH}>De</th>
                      <th style={TH}>Para</th>
                      <th style={{ ...TH, textAlign: 'right' }}>Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...market.history].reverse().map((t, i) => {
                      const fromTeam = getTeamById(t.from_team_id);
                      const toTeam   = getTeamById(t.to_team_id);
                      const isUserBuy  = t.to_team_id   === career.team_id;
                      const isUserSell = t.from_team_id === career.team_id;
                      return (
                        <tr key={i} style={{
                          borderBottom: '1px solid rgba(30,58,92,0.4)',
                          backgroundColor: isUserBuy ? 'rgba(74,222,128,0.04)' : isUserSell ? 'rgba(239,68,68,0.04)' : 'transparent',
                        }}>
                          <td style={{ ...TD, color: '#6b7c93' }}>{t.round}</td>
                          <td style={TD}>{t.player_name}</td>
                          <td style={{ ...TD, color: '#a8b8cc' }}>{fromTeam?.short_name ?? '?'}</td>
                          <td style={{ ...TD, color: '#a8b8cc' }}>{toTeam?.short_name ?? '?'}</td>
                          <td style={{ ...TD, textAlign: 'right', color: isUserBuy ? '#ef4444' : isUserSell ? '#4ade80' : '#6b7c93' }}>
                            {t.is_free_transfer ? 'Grátis' : formatCurrency(t.fee)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de proposta */}
      {offerPlayer && (
        <OfferModal
          player={offerPlayer}
          career={career}
          onSubmit={async (amount) => {
            const result = await submitOfferAction(offerPlayer.id, amount);
            return result;
          }}
          onClose={() => setOfferPlayer(null)}
        />
      )}
    </Layout>
  );
}
