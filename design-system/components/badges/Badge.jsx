import React from 'react';

export function Badge({ children, color = 'purple' }) {
  const bg = { purple: 'var(--accent-secondary)', orange: 'var(--accent-primary)', dark: 'var(--surface-dark)' }[color] || 'var(--accent-secondary)';
  return (
    <div style={{
      display: 'inline-flex', width: 'fit-content',
      background: bg, color: 'var(--text-inverse)',
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20,
      letterSpacing: 1, padding: '12px 24px', borderRadius: 'var(--radius-pill)',
    }}>
      {children}
    </div>
  );
}
