import React from 'react';

export function StatCard({ eyebrow, value, unit, caption, accent = 'orange', inverted = false }) {
  const accentColor = { orange: 'var(--accent-primary)', purple: 'var(--accent-secondary)', green: 'var(--accent-positive)' }[accent] || 'var(--accent-primary)';
  const fg = inverted ? 'var(--text-inverse)' : 'var(--text-primary)';
  return (
    <div style={{ fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {eyebrow && <div style={{ fontWeight: 700, color: accentColor, fontSize: 20, letterSpacing: 2, textTransform: 'uppercase' }}>{eyebrow}</div>}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <div style={{ fontFamily: 'var(--font-numeral)', fontWeight: 800, fontSize: 96, lineHeight: 0.9, color: fg }}>{value}</div>
        {unit && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: accentColor }}>{unit}</div>}
      </div>
      {caption && <div style={{ fontSize: 22, lineHeight: 1.35, color: fg, maxWidth: 480 }}>{caption}</div>}
    </div>
  );
}
