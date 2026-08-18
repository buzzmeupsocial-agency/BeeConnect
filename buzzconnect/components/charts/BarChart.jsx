import React from 'react';

export function BarChart({ title, values, projectedFrom, color = 'var(--bc-series-1)', height = 90 }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ border: '1px solid var(--bc-border-default)', borderRadius: 'var(--bc-radius-md)', padding: 20, background: 'var(--bc-surface-card)', fontFamily: 'var(--bc-font-body)' }}>
      {title && <div style={{ font: 'var(--bc-text-section-title)', color: 'var(--bc-text-primary)', marginBottom: 14 }}>{title}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height }}>
        {values.map((v, i) => (
          <div key={i} style={{
            width: 20, height: `${(v / max) * 100}%`, borderRadius: 3,
            background: projectedFrom != null && i >= projectedFrom ? `color-mix(in srgb, ${color} 30%, transparent)` : color,
          }} />
        ))}
      </div>
    </div>
  );
}
