import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { Player, Career } from '../types';
import { calculateMarketValue, suggestedWeeklyWage } from '../lib/market';
import { formatCurrency } from '../lib/finance';
import { POSITION_LABEL, SIDE_LABEL, ATTR_LABEL } from '../types';
import { getTeamById } from '../data';
import { POS_COLOR } from '../types/academy';

interface OfferModalProps {
  player: Player;
  career: Career;
  onSubmit: (amount: number) => Promise<{ error?: string }>;
  onClose: () => void;
}

export function OfferModal({ player, career, onSubmit, onClose }: OfferModalProps) {
  const fairValue   = calculateMarketValue(player);
  const [amount, setAmount] = useState(Math.round(fairValue * 0.9 / 100_000) * 100_000);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');
  const [success, setSuccess]  = useState('');

  const canAfford   = (career.finances?.cash_balance ?? 0) >= amount;
  const marketOpen  = career.market_state?.is_open ?? false;
  const team        = getTeamById(player.team_id);
  const weeklyWage  = suggestedWeeklyWage(player);

  const handleSubmit = async () => {
    if (!marketOpen) { setError('Mercado fechado. Aguarde a janela de transferências.'); return; }
    if (!canAfford)  { setError('Saldo insuficiente.'); return; }
    setLoading(true);
    setError('');
    const result = await onSubmit(amount);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setSuccess('Proposta enviada e avaliada!');
    setTimeout(onClose, 1500);
  };

  const ratio = amount / fairValue;
  const ratioColor = ratio >= 1.0 ? '#4ade80' : ratio >= 0.8 ? '#f5d020' : '#ef4444';
  const ratioLabel = ratio >= 1.0 ? 'Generosa' : ratio >= 0.85 ? 'Justa' : ratio >= 0.65 ? 'Baixa' : 'Muito baixa';

  return (
    <Modal open title={`Proposta — ${player.name}`} onClose={onClose}>
      {/* Info do jogador */}
      <div
        className="rounded px-3 py-2.5 mb-4"
        style={{ backgroundColor: '#0d1f36', border: '1px solid #1e3a5c' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f5f0' }}>
              <span style={{ color: POS_COLOR[player.position] ?? '#a8b8cc', marginRight: 6, fontSize: 12 }}>
                {player.position}
              </span>
              {player.name}
              {player.is_world_top && ' 🌟'}
              {player.is_star && !player.is_world_top && ' ⭐'}
            </div>
            <div style={{ fontSize: 11, color: '#a8b8cc', marginTop: 2 }}>
              {POSITION_LABEL[player.position]} · {SIDE_LABEL[player.side]} · {player.age} anos
            </div>
            <div style={{ fontSize: 11, color: '#6b7c93', marginTop: 1 }}>
              Time: {team?.name ?? '?'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="font-retro" style={{ fontSize: 22, color: '#f5d020', lineHeight: 1 }}>
              F:{player.force}
            </div>
          </div>
        </div>

        {/* Características */}
        {(player.highlighted_attr_1 || player.highlighted_attr_2) && (
          <div style={{ fontSize: 11, color: '#f5d020', marginTop: 4 }}>
            ⭐ {[player.highlighted_attr_1, player.highlighted_attr_2]
              .filter(Boolean)
              .map((k) => ATTR_LABEL[k as keyof typeof ATTR_LABEL] ?? k)
              .join(', ')}
          </div>
        )}

        <div className="flex gap-4 mt-3" style={{ fontSize: 11 }}>
          <div>
            <span style={{ color: '#6b7c93' }}>Valor de mercado</span><br />
            <span style={{ color: '#f5d020', fontWeight: 700 }}>{formatCurrency(fairValue)}</span>
          </div>
          <div>
            <span style={{ color: '#6b7c93' }}>Salário/semana</span><br />
            <span style={{ color: '#f5f5f0' }}>{formatCurrency(weeklyWage)}</span>
          </div>
          <div>
            <span style={{ color: '#6b7c93' }}>Seu caixa</span><br />
            <span style={{ color: (career.finances?.cash_balance ?? 0) >= 0 ? '#4ade80' : '#ef4444' }}>
              {formatCurrency(career.finances?.cash_balance ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Slider de valor */}
      {marketOpen && (
        <>
          <div className="mb-1 flex justify-between" style={{ fontSize: 11, color: '#6b7c93' }}>
            <span>Valor da proposta</span>
            <span style={{ color: ratioColor, fontWeight: 700 }}>
              {formatCurrency(amount)} — {ratioLabel}
            </span>
          </div>
          <input
            type="range"
            min={Math.round(fairValue * 0.3 / 100_000) * 100_000}
            max={Math.round(fairValue * 2 / 100_000) * 100_000}
            step={100_000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#f5d020', marginBottom: 8 }}
          />
          <div className="flex justify-between" style={{ fontSize: 10, color: '#6b7c93' }}>
            <span>30% ({formatCurrency(Math.round(fairValue * 0.3))})</span>
            <span>200% ({formatCurrency(Math.round(fairValue * 2))})</span>
          </div>

          {error   && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>{error}</p>}
          {success && <p style={{ fontSize: 11, color: '#4ade80', marginTop: 8 }}>{success}</p>}

          <div className="flex gap-2 mt-4">
            <Button fullWidth variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button fullWidth onClick={handleSubmit} loading={loading} disabled={!canAfford}>
              Enviar proposta »
            </Button>
          </div>
        </>
      )}

      {!marketOpen && (
        <div
          className="rounded px-3 py-2 mt-2"
          style={{ backgroundColor: 'rgba(107,124,147,0.15)', border: '1px solid #1e3a5c', fontSize: 12, color: '#a8b8cc' }}
        >
          O mercado está fechado. Propostas só podem ser feitas durante a janela de transferências (rodadas 1-5 e 20-25).
          <div className="mt-3">
            <Button fullWidth variant="secondary" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
