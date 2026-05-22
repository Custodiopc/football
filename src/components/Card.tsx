import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', onClick, hoverable = false, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={['rounded-xl', hoverable ? 'cursor-pointer transition-all duration-150' : '', className].filter(Boolean).join(' ')}
      style={{
        backgroundColor: '#15304f',
        border: '1px solid #1e3a5c',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
