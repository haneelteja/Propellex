import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: '#2563eb', color: '#fff', border: '1px solid #2563eb' },
  secondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
  danger: { background: '#dc2626', color: '#fff', border: '1px solid #dc2626' },
  ghost: { background: 'transparent', color: '#6b7280', border: '1px solid transparent' },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 13, borderRadius: 5 },
  md: { padding: '8px 16px', fontSize: 14, borderRadius: 6 },
  lg: { padding: '10px 20px', fontSize: 15, borderRadius: 7 },
};

export const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'opacity 0.15s',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...rest}
    >
      {loading && <span aria-hidden>⟳</span>}
      {children}
    </button>
  );
});
