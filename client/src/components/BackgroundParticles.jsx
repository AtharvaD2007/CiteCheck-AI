import React from 'react';

export function BackgroundParticles() {
  // Pre-calculated deterministic floating nodes to prevent hydration mismatches
  const particles = [
    { id: 1, top: '12%', left: '8%', size: 6, delay: '0s', duration: '14s', opacity: 0.35, color: '#8B5CF6' },
    { id: 2, top: '24%', left: '88%', size: 8, delay: '2s', duration: '18s', opacity: 0.3, color: '#6366F1' },
    { id: 3, top: '45%', left: '5%', size: 5, delay: '4s', duration: '16s', opacity: 0.25, color: '#A78BFA' },
    { id: 4, top: '65%', left: '92%', size: 7, delay: '1s', duration: '20s', opacity: 0.35, color: '#7C3AED' },
    { id: 5, top: '80%', left: '15%', size: 6, delay: '5s', duration: '15s', opacity: 0.25, color: '#4F46E5' },
    { id: 6, top: '35%', left: '78%', size: 5, delay: '3s', duration: '17s', opacity: 0.3, color: '#C084FC' },
    { id: 7, top: '55%', left: '50%', size: 8, delay: '6s', duration: '22s', opacity: 0.2, color: '#818CF8' },
    { id: 8, top: '88%', left: '70%', size: 6, delay: '2.5s', duration: '19s', opacity: 0.3, color: '#8B5CF6' },
  ];

  return (
    <div className="ambient-particles-container" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="ambient-particle-dot"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
