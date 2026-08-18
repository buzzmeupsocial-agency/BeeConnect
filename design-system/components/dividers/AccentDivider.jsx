import React from 'react';

export function AccentDivider({ color = 'orange', width = 160, gradient = false }) {
  const c = { orange: 'var(--accent-primary)', purple: 'var(--accent-secondary)', dark: 'var(--surface-dark)', white: 'var(--text-inverse)' }[color] || 'var(--accent-primary)';
  return (
    <div style={{
      height: 6, width,
      background: gradient ? `linear-gradient(90deg, ${c}, transparent)` : c,
    }} />
  );
}
