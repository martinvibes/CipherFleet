import { useEffect, useRef } from 'react';

interface WinScreenProps {
  show: boolean;
  onPlayAgain: () => void;
  onClose: () => void;
}

export default function WinScreen({ show, onPlayAgain, onClose }: WinScreenProps) {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!particlesRef.current) return;
    const el = particlesRef.current;
    el.innerHTML = '';
    for (let i = 0; i < 24; i++) {
      const d = document.createElement('div');
      d.style.cssText = `
        position: absolute;
        bottom: 0;
        left: ${Math.random() * 100}%;
        width: ${1 + Math.random() * 1.5}px;
        height: ${40 + Math.random() * 120}px;
        background: var(--crimson);
        opacity: 0;
        animation: particle-rise ${4 + Math.random() * 6}s linear ${Math.random() * 4}s infinite;
      `;
      el.appendChild(d);
    }
  }, [show]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[300] overflow-hidden transition-opacity duration-600"
      style={{
        background: 'var(--abyss)',
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'all' : 'none',
      }}
    >
      {/* Dramatic burst */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(139,26,26,0.18) 0%, transparent 70%)',
        animation: 'burst-pulse 3s ease-in-out infinite',
      }} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139,26,26,0.012) 3px, rgba(139,26,26,0.012) 6px)',
      }} />

      {/* Particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* Content */}
      <div className="relative text-center z-10">
        <div className="text-[9px] tracking-[0.3em] uppercase mb-5 font-normal" style={{ color: 'var(--crimson)' }}>
          CipherFleet &middot; All enemy ships destroyed
        </div>
        <div className="leading-[0.9] tracking-[0.06em] uppercase mb-1.5" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '96px',
          fontWeight: 900,
          color: 'var(--t1)',
          textShadow: '0 0 80px rgba(139,26,26,0.4)',
        }}>
          Fleet
        </div>
        <div className="tracking-[0.25em] uppercase mb-4" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '32px',
          fontWeight: 400,
          color: 'var(--crimson)',
        }}>
          Victorious
        </div>
        <div className="w-[120px] h-px mx-auto my-5 mb-7" style={{ background: 'linear-gradient(90deg, transparent, var(--crimson), transparent)' }} />
        <div className="text-[9.5px] tracking-[0.14em] uppercase mb-11 font-light" style={{ color: 'var(--t3)' }}>
          FHE encryption maintained &middot; Ship coordinates never revealed
        </div>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={onPlayAgain}
            className="py-3 px-[30px] text-[9px] tracking-[0.14em] uppercase border cursor-pointer transition-all"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              borderColor: 'var(--crimson)',
              color: 'var(--flame)',
              background: 'rgba(139,26,26,0.12)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,26,26,0.24)'; e.currentTarget.style.boxShadow = 'var(--glow-blood)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,26,26,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Play Again
          </button>
          <button
            onClick={onClose}
            className="py-3 px-[30px] text-[9px] tracking-[0.14em] uppercase border cursor-pointer transition-all hover:border-[var(--steel-lo)] hover:text-[var(--t2)]"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'var(--ghost)', color: 'var(--t3)', background: 'none' }}
          >
            View Stats
          </button>
        </div>
      </div>
    </div>
  );
}
