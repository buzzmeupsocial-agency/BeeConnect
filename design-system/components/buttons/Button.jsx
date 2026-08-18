import React from 'react';

export function Button({ children, variant = 'primary', size = 'md', onClick }) {
  const palettes = {
    primary: { bg: 'var(--accent-primary)', fg: 'var(--text-inverse)' },
    dark: { bg: 'var(--surface-dark)', fg: 'var(--text-inverse)' },
    outline: { bg: 'transparent', fg: 'var(--text-primary)' },
  };
  const p = palettes[variant] || palettes.primary;
  const pad = size === 'lg' ? '26px 52px' : size === 'sm' ? '14px 28px' : '20px 40px';
  const fontSize = size === 'lg' ? 30 : size === 'sm' ? 22 : 26;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: p.bg,
        color: p.fg,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize,
        padding: pad,
        borderRadius: 'var(--radius-pill)',
        border: variant === 'outline' ? '2px solid var(--text-primary)' : 'none',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}
