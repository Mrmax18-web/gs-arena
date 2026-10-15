import React from 'react';

interface OrbConfig {
  id: number;
  size: number;
  top: string;
  left: string;
  color: string;
  duration: number;
  delay: number;
}

const ORBS: OrbConfig[] = [
  { id: 1, size: 380, top: '5%', left: '8%', color: 'rgba(255, 107, 53, 0.12)', duration: 18, delay: 0 },
  { id: 2, size: 300, top: '45%', left: '75%', color: 'rgba(230, 57, 70, 0.10)', duration: 22, delay: 2 },
  { id: 3, size: 450, top: '65%', left: '15%', color: 'rgba(168, 85, 247, 0.11)', duration: 25, delay: 4 },
  { id: 4, size: 280, top: '15%', left: '60%', color: 'rgba(255, 183, 3, 0.09)', duration: 20, delay: 1 },
  { id: 5, size: 340, top: '80%', left: '50%', color: 'rgba(255, 75, 43, 0.10)', duration: 19, delay: 3 },
  { id: 6, size: 260, top: '30%', left: '30%', color: 'rgba(147, 51, 234, 0.08)', duration: 24, delay: 5 },
  { id: 7, size: 320, top: '10%', left: '85%', color: 'rgba(255, 107, 53, 0.08)', duration: 21, delay: 2 },
  { id: 8, size: 360, top: '70%', left: '80%', color: 'rgba(220, 38, 38, 0.09)', duration: 23, delay: 4 },
];

export function FloatingOrbs() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {ORBS.map((orb) => (
        <div
          key={orb.id}
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            top: orb.top,
            left: orb.left,
            backgroundColor: orb.color,
            filter: 'blur(90px)',
            animation: `drift ${orb.duration}s ease-in-out infinite alternate`,
            animationDelay: `${orb.delay}s`,
          }}
          className="absolute rounded-full will-change-transform transform-gpu"
        />
      ))}
      <style>{`
        @keyframes drift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(40px, -35px, 0) scale(1.08);
          }
          100% {
            transform: translate3d(-35px, 45px, 0) scale(0.95);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .will-change-transform {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
