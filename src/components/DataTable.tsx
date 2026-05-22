import { useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  sticky?: boolean; // coluna fica fixa no scroll horizontal
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRow?: T | null;
  selectedKey?: (row: T) => string | number;
  density?: 'compact' | 'normal';
  zebraStripe?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: number; // px — scroll vertical interno
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  selectedRow,
  selectedKey,
  density = 'compact',
  zebraStripe = true,
  emptyMessage = 'Nenhum resultado',
  className = '',
  maxHeight,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const rowHeight = density === 'compact' ? 28 : 36;

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return 0;
    const va = col.sortValue(a);
    const vb = col.sortValue(b);
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const isSelected = (row: T): boolean => {
    if (!selectedRow) return false;
    if (selectedKey) return selectedKey(row) === selectedKey(selectedRow);
    return row === selectedRow;
  };

  return (
    <div
      className={['w-full overflow-x-auto', className].join(' ')}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}
    >
      <table className="w-full border-collapse" style={{ minWidth: 'max-content' }}>
        {/* Header */}
        <thead>
          <tr style={{ backgroundColor: '#15304f', position: 'sticky', top: 0, zIndex: 10 }}>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                style={{
                  width: col.width,
                  minWidth: col.width,
                  textAlign: col.align ?? 'left',
                  padding: '4px 6px',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#a8b8cc',
                  borderBottom: '1px solid #1e3a5c',
                  borderRight: '1px solid #1e3a5c',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  position: col.sticky ? 'sticky' : 'relative',
                  left: col.sticky ? 0 : undefined,
                  backgroundColor: '#15304f',
                  zIndex: col.sticky ? 11 : undefined,
                }}
              >
                <span className="flex items-center gap-0.5" style={{ justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start' }}>
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDir === 'asc'
                      ? <ChevronUp size={10} className="text-gold" />
                      : <ChevronDown size={10} className="text-gold" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {sortedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', padding: '24px 12px', color: '#6b7c93', fontSize: 13 }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {sortedData.map((row, idx) => {
            const selected = isSelected(row);
            const zebra = zebraStripe && idx % 2 === 1;

            return (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={selected ? 'table-row-selected' : ''}
                style={{
                  height: rowHeight,
                  backgroundColor: selected
                    ? '#fffacc'
                    : zebra
                      ? 'rgba(21,48,79,0.4)'
                      : 'transparent',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!selected)
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(21,48,79,0.7)';
                }}
                onMouseLeave={(e) => {
                  if (!selected)
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor = zebra
                      ? 'rgba(21,48,79,0.4)'
                      : 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: density === 'compact' ? '2px 6px' : '4px 8px',
                      fontSize: density === 'compact' ? 12 : 13,
                      textAlign: col.align ?? 'left',
                      borderBottom: '1px solid rgba(30,58,92,0.4)',
                      borderRight: '1px solid rgba(30,58,92,0.3)',
                      color: selected ? '#0a1e35' : '#f5f5f0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      maxWidth: col.width ? col.width + 40 : undefined,
                      position: col.sticky ? 'sticky' : 'relative',
                      left: col.sticky ? 0 : undefined,
                      backgroundColor: selected
                        ? '#fffacc'
                        : zebra
                          ? 'rgba(21,48,79,0.4)'
                          : 'transparent',
                      zIndex: col.sticky ? 1 : undefined,
                    }}
                  >
                    {col.render(row, idx)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
