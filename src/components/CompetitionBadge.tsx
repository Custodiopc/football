import { Trophy } from 'lucide-react';

interface CompetitionBadgeProps {
  name: string;
  round?: string;
  className?: string;
}

export function CompetitionBadge({ name, round, className = '' }: CompetitionBadgeProps) {
  return (
    <div
      className={['rounded px-2 py-1.5', className].join(' ')}
      style={{
        backgroundColor: '#15304f',
        borderLeft: '3px solid #f5d020',
        fontSize: 12,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Trophy size={12} style={{ color: '#f5d020', flexShrink: 0 }} />
        <span className="font-semibold" style={{ color: '#f5f5f0' }}>{name}</span>
      </div>
      {round && (
        <div style={{ color: '#a8b8cc', fontSize: 11, marginTop: 1, paddingLeft: 18 }}>
          {round}
        </div>
      )}
    </div>
  );
}
