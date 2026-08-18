import React from 'react';

export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontFamily: 'var(--bc-font-body)' }}>
      {tabs.map((t) => (
        <div key={t} onClick={() => onChange && onChange(t)} style={{
          padding: '10px 20px', borderRadius: 'var(--bc-radius-pill)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          background: t === active ? 'var(--bc-text-primary)' : 'transparent',
          color: t === active ? 'var(--bc-text-inverse)' : 'var(--bc-text-muted)',
        }}>{t}</div>
      ))}
    </div>
  );
}
