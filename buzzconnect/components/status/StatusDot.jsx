import React from 'react';

const dotColor = { positive: 'var(--bc-status-positive)', warning: 'var(--bc-status-warning)', negative: 'var(--bc-status-negative)' };
const labelDefault = { positive: 'No ritmo da meta', warning: 'Atenção — abaixo do ritmo', negative: 'Fora da meta' };

export function StatusDot({ status, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--bc-font-body)' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor[status] }} />
      <div style={{ font: 'var(--bc-text-body)', color: 'var(--bc-text-primary)' }}>{label || labelDefault[status]}</div>
    </div>
  );
}
