import React from 'react';

export function CosmicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#03040a]" aria-hidden="true">
      {/* Top-left Purple glow */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-700/25 via-indigo-600/20 to-transparent blur-[130px]"
      />
      {/* Bottom-right Red/Orange glow */}
      <div
        className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-rose-600/25 via-orange-600/20 to-transparent blur-[140px]"
      />
      {/* Center atmospheric cyan/blue hint */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-blue-900/15 blur-[150px]"
      />

      {/* Floating blurred orbs */}
      <div
        className="cosmic-orb absolute top-[15%] left-[20%] w-48 h-48 rounded-full bg-purple-500/15 blur-[60px]"
        style={{ animation: 'floatOrb 14s ease-in-out infinite alternate' }}
      />
      <div
        className="cosmic-orb absolute top-[60%] left-[10%] w-64 h-64 rounded-full bg-orange-600/15 blur-[70px]"
        style={{ animation: 'floatOrb 18s ease-in-out infinite alternate-reverse', animationDelay: '-3s' }}
      />
      <div
        className="cosmic-orb absolute top-[25%] right-[18%] w-56 h-56 rounded-full bg-red-600/15 blur-[65px]"
        style={{ animation: 'floatOrb 16s ease-in-out infinite alternate', animationDelay: '-6s' }}
      />
      <div
        className="cosmic-orb absolute bottom-[20%] right-[30%] w-44 h-44 rounded-full bg-amber-500/10 blur-[55px]"
        style={{ animation: 'floatOrb 12s ease-in-out infinite alternate-reverse', animationDelay: '-2s' }}
      />
      <div
        className="cosmic-orb absolute top-[45%] left-[45%] w-72 h-72 rounded-full bg-indigo-700/10 blur-[85px]"
        style={{ animation: 'floatOrb 20s ease-in-out infinite alternate', animationDelay: '-8s' }}
      />
      <div
        className="cosmic-orb absolute bottom-[10%] left-[40%] w-52 h-52 rounded-full bg-rose-500/10 blur-[60px]"
        style={{ animation: 'floatOrb 15s ease-in-out infinite alternate-reverse', animationDelay: '-5s' }}
      />

      {/* Parallax Star Layers */}
      <div className="star-layer star-layer-1" />
      <div className="star-layer star-layer-2" />
      <div className="star-layer star-layer-3" />

      {/* Grid overlay for esports tech aesthetic */}
      <div
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60"
      />

      <style>{`
        @keyframes floatOrb {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(25px, -35px) scale(1.08);
          }
          100% {
            transform: translate(-20px, 25px) scale(0.95);
          }
        }
        @keyframes drift1 {
          from { transform: translateY(0); }
          to { transform: translateY(-1000px); }
        }
        @keyframes drift2 {
          from { transform: translateY(0); }
          to { transform: translateY(-1000px); }
        }
        @keyframes drift3 {
          from { transform: translateY(0); }
          to { transform: translateY(-1000px); }
        }
        .star-layer {
          position: absolute;
          inset: 0;
          background-repeat: repeat;
        }
        .star-layer-1 {
          background-image: 
            radial-gradient(1px 1px at 25px 45px, rgba(255, 255, 255, 0.7), transparent),
            radial-gradient(1px 1px at 75px 125px, rgba(255, 255, 255, 0.5), transparent),
            radial-gradient(1.5px 1.5px at 150px 80px, rgba(255, 255, 255, 0.8), transparent),
            radial-gradient(1px 1px at 220px 190px, rgba(255, 200, 150, 0.6), transparent),
            radial-gradient(1px 1px at 290px 40px, rgba(200, 220, 255, 0.6), transparent);
          background-size: 350px 350px;
          animation: drift1 90s linear infinite;
        }
        .star-layer-2 {
          background-image: 
            radial-gradient(1.5px 1.5px at 50px 90px, rgba(255, 255, 255, 0.85), transparent),
            radial-gradient(2px 2px at 130px 240px, rgba(255, 180, 100, 0.7), transparent),
            radial-gradient(1px 1px at 190px 45px, rgba(255, 255, 255, 0.6), transparent),
            radial-gradient(1.5px 1.5px at 270px 180px, rgba(180, 200, 255, 0.7), transparent);
          background-size: 420px 420px;
          animation: drift2 60s linear infinite;
          opacity: 0.8;
        }
        .star-layer-3 {
          background-image: 
            radial-gradient(2px 2px at 90px 150px, rgba(255, 255, 255, 0.95), transparent),
            radial-gradient(2.5px 2.5px at 210px 70px, rgba(255, 210, 140, 0.8), transparent),
            radial-gradient(2px 2px at 320px 290px, rgba(160, 210, 255, 0.8), transparent);
          background-size: 500px 500px;
          animation: drift3 35s linear infinite;
          opacity: 0.6;
        }
        @media (prefers-reduced-motion: reduce) {
          .star-layer,
          .cosmic-orb {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
