import React from 'react';

export function BrandMotif({ variant = 'arrow', size = 70 }) {
  if (variant === 'arrow') {
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{ position: 'absolute', width: size * 0.7, height: size * 0.7, borderTop: `${size * 0.13}px solid var(--accent-primary)`, borderRight: `${size * 0.13}px solid var(--accent-primary)`, transform: 'rotate(-45deg)', top: 0, left: size * 0.14 }} />
        <div style={{ position: 'absolute', width: size * 0.7, height: size * 0.7, borderTop: `${size * 0.13}px solid var(--accent-primary)`, borderRight: `${size * 0.13}px solid var(--accent-primary)`, transform: 'rotate(-45deg)', top: 0, left: -size * 0.34, opacity: 0.45 }} />
      </div>
    );
  }
  if (variant === 'rings') {
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <div style={{ position: 'absolute', inset: 0, border: `${size * 0.057}px solid var(--accent-primary)`, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: size * 0.143, border: `${size * 0.057}px solid var(--accent-primary)`, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', inset: size * 0.286, border: `${size * 0.057}px solid var(--accent-primary)`, borderRadius: '50%' }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, backgroundColor: 'var(--surface-alt)', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(63,58,57,0.08) 1px, transparent 0)', backgroundSize: '14px 14px' }} />
  );
}
