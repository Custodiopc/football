import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

// Brasfoot style: primary = fundo claro (cream/dourado claro), texto escuro
const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#f5d020',
    color: '#0a1e35',
    border: '1px solid #a88a1c',
    fontWeight: 600,
  },
  secondary: {
    backgroundColor: '#15304f',
    color: '#a8b8cc',
    border: '1px solid #1e3a5c',
    fontWeight: 500,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#a8b8cc',
    border: '1px solid transparent',
    fontWeight: 500,
  },
  danger: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #ef4444',
    fontWeight: 500,
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: 12, borderRadius: 6 },
  md: { padding: '8px 18px', fontSize: 13, borderRadius: 8 },
  lg: { padding: '12px 24px', fontSize: 14, borderRadius: 10 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={['inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer', className].filter(Boolean).join(' ')}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        width: fullWidth ? '100%' : undefined,
        opacity: disabled || loading ? 0.45 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, sans-serif',
        ...style,
      }}
    >
      {loading && (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
