import { useState, useEffect, useRef, useCallback } from 'react';

interface LandingPageProps {
  onStartGame: () => void;
}

// ── Animated battleship silhouettes as SVG paths ──
const SHIP_PATHS = [
  // Carrier (long)
  'M0,8 L6,4 L90,4 L96,8 L90,12 L6,12 Z',
  // Destroyer
  'M0,6 L5,3 L65,3 L70,6 L65,9 L5,9 Z',
  // Submarine
  'M0,5 L4,2 L46,2 L50,5 L46,8 L4,8 Z',
  // Patrol boat
  'M0,5 L3,2 L32,2 L35,5 L32,8 L3,8 Z',
];

// ── Hex rain characters ──
const HEX = '0123456789abcdef';
const randHex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join('');

export default function LandingPage({ onStartGame }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0); // 0=loading, 1=reveal, 2=ready
  const [typedTitle, setTypedTitle] = useState('');
  const [typedTagline, setTypedTagline] = useState('');
  const [glitch, setGlitch] = useState(false);
  const [hexStream, setHexStream] = useState(randHex(32));
  const [cardsVisible, setCardsVisible] = useState([false, false, false]);
  const [transitioning, setTransitioning] = useState(false);
  const title = 'CIPHERFLEET';
  const tagline = 'THE OCEAN IS ENCRYPTED';

  // ── Phase sequencing ──
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Title typewriter ──
  useEffect(() => {
    if (phase < 1) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTypedTitle(title.slice(0, i));
      if (i >= title.length) clearInterval(iv);
    }, 80);
    return () => clearInterval(iv);
  }, [phase]);

  // ── Tagline typewriter (delayed) ──
  useEffect(() => {
    if (phase < 1) return;
    const delay = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setTypedTagline(tagline.slice(0, i));
        if (i >= tagline.length) clearInterval(iv);
      }, 40);
      return () => clearInterval(iv);
    }, title.length * 80 + 200);
    return () => clearTimeout(delay);
  }, [phase]);

  // ── Cards stagger in ──
  useEffect(() => {
    if (phase < 2) return;
    [0, 1, 2].forEach(i => {
      setTimeout(() => setCardsVisible(prev => { const n = [...prev]; n[i] = true; return n; }), i * 200);
    });
  }, [phase]);

  // ── Glitch flicker ──
  useEffect(() => {
    const iv = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 100 + Math.random() * 100);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(iv);
  }, []);

  // ── Hex stream scramble ──
  useEffect(() => {
    const iv = setInterval(() => setHexStream(randHex(32)), 80);
    return () => clearInterval(iv);
  }, []);

  // ── Ocean particle canvas ──
  const particles = useRef<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; }[]>([]);

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    particles.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);

      // Draw connection lines between nearby particles
      particles.current.forEach((p, i) => {
        particles.current.slice(i + 1).forEach(q => {
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(139,26,26,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        });
      });

      // Draw particles
      particles.current.forEach(p => {
        ctx.fillStyle = `rgba(184,32,32,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width; }
        if (p.x < -10) p.x = c.width + 10;
        if (p.x > c.width + 10) p.x = -10;
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Transition out ──
  const handleStart = () => {
    setTransitioning(true);
    setTimeout(onStartGame, 800);
  };

  return (
    <div
      className="fixed inset-0 z-[400] overflow-hidden"
      style={{
        background: 'var(--abyss)',
        opacity: transitioning ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Deep ocean gradient layers */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: `
          radial-gradient(ellipse 100% 60% at 50% 120%, rgba(139,26,26,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 80% 40% at 50% 0%, rgba(6,5,20,0.95) 0%, transparent 50%),
          radial-gradient(ellipse 60% 60% at 30% 70%, rgba(139,26,26,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 80% 30%, rgba(200,150,12,0.03) 0%, transparent 50%)
        `,
      }} />

      {/* Animated grid lines — sonar/radar feel */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute" style={{
          top: '50%', left: '50%', width: '800px', height: '800px',
          transform: 'translate(-50%, -50%)',
          opacity: 0.03,
        }}>
          {/* Concentric radar circles */}
          {[200, 300, 400].map(r => (
            <div key={r} className="absolute rounded-full border" style={{
              width: r, height: r,
              top: `calc(50% - ${r / 2}px)`, left: `calc(50% - ${r / 2}px)`,
              borderColor: 'var(--crimson)',
              animation: `radar-pulse ${3 + r / 200}s ease-in-out infinite`,
            }} />
          ))}
          {/* Radar sweep line */}
          <div className="absolute" style={{
            top: '50%', left: '50%', width: '200px', height: '1px',
            background: 'linear-gradient(90deg, rgba(184,32,32,0.3), transparent)',
            transformOrigin: '0 50%',
            animation: 'radar-sweep 6s linear infinite',
          }} />
        </div>
      </div>

      {/* Floating battleship silhouettes */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {SHIP_PATHS.map((path, i) => (
          <div key={i} className="absolute" style={{
            left: `${10 + i * 22}%`,
            bottom: `${8 + i * 5}%`,
            opacity: 0.04 + i * 0.01,
            transform: `rotate(${-5 + i * 3}deg) scale(${1.5 + i * 0.3})`,
            animation: `ship-drift ${8 + i * 2}s ease-in-out infinite alternate`,
          }}>
            <svg width="100" height="14" viewBox="0 0 100 14">
              <path d={path} fill="rgba(139,26,26,0.6)" />
              <path d={path} fill="none" stroke="rgba(184,32,32,0.3)" strokeWidth="0.5" />
            </svg>
          </div>
        ))}
      </div>

      {/* Hex rain columns */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="absolute top-0 text-[9px] leading-[1.6]" style={{
            left: `${5 + i * 8}%`,
            color: 'rgba(184,32,32,0.06)',
            fontFamily: "'JetBrains Mono', monospace",
            writingMode: 'vertical-lr',
            animation: `hex-fall ${10 + i * 2}s linear infinite`,
            animationDelay: `${-i * 1.5}s`,
          }}>
            {randHex(60).split('').map((c, j) => <span key={j}>{c}</span>)}
          </div>
        ))}
      </div>

      {/* Scanlines */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,26,26,0.015) 2px, rgba(139,26,26,0.015) 4px)',
        mixBlendMode: 'overlay',
      }} />

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">

        {/* Top bar — classified header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between py-4 px-8 z-20" style={{
          borderBottom: '1px solid rgba(139,26,26,0.15)',
          background: 'linear-gradient(180deg, rgba(6,5,10,0.8) 0%, transparent 100%)',
        }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--crimson)', animation: 'dot-blink 1.6s ease-in-out infinite' }} />
            <span className="text-[8px] tracking-[0.25em] uppercase" style={{ color: 'var(--t4)' }}>
              Classified &middot; FHE Encrypted Channel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[8px] tracking-[0.15em] uppercase" style={{ color: 'var(--t4)' }}>
              CoFHE Network: <span style={{ color: 'var(--safe-hi)' }}>Online</span>
            </span>
            <span className="text-[8px] tracking-[0.15em] uppercase" style={{ color: 'var(--t4)' }}>
              Nodes: <span style={{ color: 'var(--safe-hi)' }}>5/5</span>
            </span>
          </div>
        </div>

        {/* ── Hero section ── */}
        <div className="flex flex-col items-center mt-8">

          {/* Animated logo */}
          <div className="relative mb-8">
            {/* Outer glow ring */}
            <div className="absolute inset-[-20px] rounded-full" style={{
              background: 'radial-gradient(circle, rgba(139,26,26,0.15) 0%, transparent 70%)',
              animation: 'radar-pulse 3s ease-in-out infinite',
            }} />
            <div style={{ transform: 'scale(3)', filter: 'drop-shadow(0 0 20px rgba(139,26,26,0.4))' }}>
              <div className="relative w-[38px] h-[38px]">
                <svg viewBox="0 0 38 38" fill="none" className="w-[38px] h-[38px]" style={{ animation: 'hex-rotate 10s linear infinite' }}>
                  <polygon points="19,2 35,11 35,27 19,36 3,27 3,11" stroke="rgba(184,32,32,0.6)" strokeWidth="1" fill="none" />
                  <polygon points="19,7 30,13.5 30,24.5 19,31 8,24.5 8,13.5" stroke="rgba(139,26,26,0.4)" strokeWidth="0.5" fill="rgba(139,26,26,0.06)" />
                  <circle cx="19" cy="19" r="4" stroke="#b82020" strokeWidth="0.75" fill="rgba(139,26,26,0.25)" />
                  <circle cx="19" cy="19" r="1.5" fill="#b82020" />
                  <line x1="19" y1="2" x2="19" y2="36" stroke="rgba(139,26,26,0.15)" strokeWidth="0.3" />
                  <line x1="3" y1="19" x2="35" y2="19" stroke="rgba(139,26,26,0.15)" strokeWidth="0.3" />
                  <line x1="19" y1="7" x2="19" y2="13" stroke="rgba(139,26,26,0.5)" strokeWidth="0.5" />
                  <line x1="19" y1="25" x2="19" y2="31" stroke="rgba(139,26,26,0.5)" strokeWidth="0.5" />
                  <line x1="8" y1="13.5" x2="13.5" y2="16.5" stroke="rgba(139,26,26,0.5)" strokeWidth="0.5" />
                  <line x1="24.5" y1="21.5" x2="30" y2="24.5" stroke="rgba(139,26,26,0.5)" strokeWidth="0.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title with glitch effect */}
          <div className="relative mb-3">
            <h1
              className="text-center uppercase tracking-[0.2em]"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(52px, 9vw, 88px)',
                fontWeight: 900,
                color: 'var(--t1)',
                lineHeight: 1,
                textShadow: glitch
                  ? '2px 0 var(--crimson), -2px 0 rgba(0,200,255,0.3)'
                  : '0 0 60px rgba(139,26,26,0.3), 0 0 120px rgba(139,26,26,0.15)',
                transition: glitch ? 'none' : 'text-shadow 0.3s',
              }}
            >
              {typedTitle}
              <span style={{ opacity: phase < 2 ? 1 : 0, animation: 'dot-blink 0.6s step-end infinite', color: 'var(--crimson)' }}>_</span>
            </h1>
            {/* Glitch duplicate layers */}
            {glitch && (
              <>
                <h1 className="absolute top-0 left-0 text-center uppercase tracking-[0.2em] w-full" style={{
                  fontFamily: "'Cinzel', serif", fontSize: 'clamp(52px, 9vw, 88px)', fontWeight: 900,
                  color: 'transparent', lineHeight: 1,
                  WebkitTextStroke: '1px rgba(184,32,32,0.4)',
                  transform: 'translate(3px, -2px)', clipPath: 'inset(20% 0 40% 0)',
                }}>{typedTitle}</h1>
                <h1 className="absolute top-0 left-0 text-center uppercase tracking-[0.2em] w-full" style={{
                  fontFamily: "'Cinzel', serif", fontSize: 'clamp(52px, 9vw, 88px)', fontWeight: 900,
                  color: 'transparent', lineHeight: 1,
                  WebkitTextStroke: '1px rgba(0,150,255,0.2)',
                  transform: 'translate(-2px, 2px)', clipPath: 'inset(50% 0 10% 0)',
                }}>{typedTitle}</h1>
              </>
            )}
          </div>

          {/* Tagline */}
          <p className="text-center mb-2 tracking-[0.4em] uppercase" style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--crimson)',
            textShadow: '0 0 30px rgba(139,26,26,0.3)',
          }}>
            {typedTagline}
          </p>

          {/* Encrypted data stream */}
          <div className="mb-8 py-2 px-4 overflow-hidden" style={{ maxWidth: '500px' }}>
            <code className="text-[10px] tracking-[0.02em] break-all" style={{
              color: 'rgba(184,32,32,0.2)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {hexStream}
            </code>
          </div>

          {/* Divider with diamond */}
          <div className="flex items-center gap-4 mb-10 w-[300px]">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,26,26,0.4))' }} />
            <div className="w-2 h-2 rotate-45" style={{ border: '1px solid var(--crimson)', background: 'rgba(139,26,26,0.2)' }} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(139,26,26,0.4), transparent)' }} />
          </div>

          {/* ── 3 Feature cards ── */}
          <div className="grid grid-cols-3 gap-5 mb-12 w-full max-w-[660px]">
            {[
              { step: 'I', icon: '\u2693', title: 'Deploy Fleet', desc: 'Ship coordinates encrypted as euint8 ciphertext. Stored on-chain, unreadable by anyone \u2014 even the contract.', accent: 'var(--crimson)' },
              { step: 'II', icon: '\u2316', title: 'Encrypted Strike', desc: 'FHE.eq() runs on ciphertext in the CoFHE coprocessor. Ship positions are never decrypted during battle.', accent: 'var(--gold)' },
              { step: 'III', icon: '\u2622', title: 'Verdict', desc: 'Only an ebool is revealed: hit or miss. The encrypted ocean keeps its secrets. Coordinates remain sealed.', accent: 'var(--safe-hi)' },
            ].map((card, i) => (
              <div
                key={i}
                className="relative flex flex-col p-5 transition-all duration-500"
                style={{
                  border: '1px solid var(--ghost)',
                  background: 'rgba(12,10,18,0.7)',
                  backdropFilter: 'blur(4px)',
                  opacity: cardsVisible[i] ? 1 : 0,
                  transform: cardsVisible[i] ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${card.accent}, transparent)` }} />
                {/* Corner marks */}
                <div className="absolute top-[-1px] left-[-1px] w-2 h-2" style={{ borderTop: `1px solid ${card.accent}`, borderLeft: `1px solid ${card.accent}`, opacity: 0.5 }} />
                <div className="absolute bottom-[-1px] right-[-1px] w-2 h-2" style={{ borderBottom: `1px solid ${card.accent}`, borderRight: `1px solid ${card.accent}`, opacity: 0.5 }} />

                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[16px]" style={{ opacity: 0.6 }}>{card.icon}</span>
                  <span className="text-[8px] tracking-[0.25em] uppercase font-medium" style={{ color: card.accent }}>{card.step}</span>
                </div>
                <div className="text-[12px] tracking-[0.08em] uppercase mb-2 font-semibold" style={{ color: 'var(--t1)' }}>
                  {card.title}
                </div>
                <div className="text-[9px] leading-[1.8] font-light" style={{ color: 'var(--t3)' }}>
                  {card.desc}
                </div>
              </div>
            ))}
          </div>

          {/* ── CTA Button ── */}
          <button
            onClick={handleStart}
            className="group relative py-4 px-16 uppercase tracking-[0.25em] text-[11px] border cursor-pointer transition-all duration-300 mb-6"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              borderColor: 'var(--crimson)',
              color: 'var(--flame)',
              background: 'rgba(139,26,26,0.08)',
              animation: phase >= 2 ? 'turn-pulse 2.5s ease-in-out infinite' : 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(139,26,26,0.2)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(139,26,26,0.5), inset 0 0 30px rgba(139,26,26,0.1)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(139,26,26,0.08)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div className="absolute top-[-1px] left-[-1px] w-3 h-3 opacity-60" style={{ borderTop: '2px solid var(--crimson)', borderLeft: '2px solid var(--crimson)' }} />
            <div className="absolute top-[-1px] right-[-1px] w-3 h-3 opacity-60" style={{ borderTop: '2px solid var(--crimson)', borderRight: '2px solid var(--crimson)' }} />
            <div className="absolute bottom-[-1px] left-[-1px] w-3 h-3 opacity-60" style={{ borderBottom: '2px solid var(--crimson)', borderLeft: '2px solid var(--crimson)' }} />
            <div className="absolute bottom-[-1px] right-[-1px] w-3 h-3 opacity-60" style={{ borderBottom: '2px solid var(--crimson)', borderRight: '2px solid var(--crimson)' }} />

            {/* Scan line inside button */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-0 left-0 right-0 h-full" style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(184,32,32,0.1) 50%, transparent 100%)',
                animation: 'btn-scan 2s ease-in-out infinite',
              }} />
            </div>

            <span className="relative z-10">Enter Battle</span>
          </button>

          {/* Sub-CTA text */}
          <p className="text-[9px] tracking-[0.12em] uppercase mb-10" style={{ color: 'var(--t4)' }}>
            No wallet required for demo &middot; Testnet deployment coming Wave 2
          </p>

          {/* ── Footer chips ── */}
          <div className="flex items-center gap-3 mb-4">
            {['Fhenix CoFHE', 'Arbitrum Sepolia', 'AKINDO WaveHack', 'FHE.eq()'].map(label => (
              <span key={label} className="text-[7px] tracking-[0.14em] uppercase py-[4px] px-[10px] border transition-colors hover:border-[rgba(139,26,26,0.3)] hover:text-[var(--t3)]"
                style={{ borderColor: 'var(--ghost)', color: 'var(--t4)' }}>
                {label}
              </span>
            ))}
          </div>

          <p className="text-[8px] tracking-[0.18em] uppercase text-center max-w-[500px]" style={{ color: 'var(--t4)', lineHeight: 1.8 }}>
            The first on-chain game where ship positions are mathematically hidden &mdash; not just hidden by trust.
            Built for the Fhenix Privacy-by-Design dApp Buildathon.
          </p>
        </div>
      </div>

      {/* ── Inline animations ── */}
      <style>{`
        @keyframes radar-pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ship-drift {
          0% { transform: translateX(0) translateY(0) rotate(var(--r, 0deg)); }
          100% { transform: translateX(20px) translateY(-8px) rotate(var(--r, 0deg)); }
        }
        @keyframes hex-fall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes btn-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
