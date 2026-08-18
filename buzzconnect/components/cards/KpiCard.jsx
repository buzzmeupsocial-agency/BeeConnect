import React from 'react';

export function KpiCard({ label, value, caption, accent = 'default' }) {
  const valueColor = accent === 'highlight' ? 'var(--bc-action-primary)' : 'var(--bc-text-primary)';
  return (
    <div style={{ border: '1px solid var(--bc-border-default)', borderRadius: 'var(--bc-radius-md)', padding: '18px 20px', background: 'var(--bc-surface-card)', fontFamily: 'var(--bc-font-body)' }}>
      <div style={{ font: 'var(--bc-text-eyebrow)', letterSpacing: 'var(--bc-eyebrow-letter-spacing)', textTransform: 'uppercase', color: 'var(--bc-text-muted)' }}>{label}</div>
      <div style={{ font: 'var(--bc-text-kpi-value)', color: valueColor, marginTop: 6 }}>{value}</div>
      {caption && <div style={{ font: 'var(--bc-text-body)', color: 'var(--bc-text-muted)', marginTop: 4 }}>{caption}</div>}
    </div>
  );
}
