import { useState, useEffect } from 'react';
import LogoHex from './LogoHex';

interface LandingPageProps {
  onStartGame: () => void;
}

export default function LandingPage({ onStartGame }: LandingPageProps) {
  const [visible, setVisible] = useState(false);
  const [hexChars, setHexChars] = useState('0x8f3a...c2b1');

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Scramble hex characters effect
  useEffect(() => {
    const chars = '0123456789abcdef';
    const interval = setInterval(() => {
      const scrambled = '0x' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 16)]).join('') + '...' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 16)]).join('');
      setHexChars(scrambled);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[400] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000"
      style={{
        background: 'var(--abyss)',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 50%, rgba(139,26,26,0.08) 0%, transparent 70%),
          radial-gradient(ellipse 40% 60% at 20% 80%, rgba(139,26,26,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 40% 60% at 80% 20%, rgba(200,150,12,0.03) 0%, transparent 60%)
        `,
      }} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139,26,26,0.008) 3px, rgba(139,26,26,0.008) 6px)',
      }} />

      {/* Grid preview floating behind content */}
      <div className="absolute opacity-[0.04] pointer-events-none" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <div className="grid grid-cols-8 gap-[2px]" style={{ width: '500px', height: '500px' }}>
          {Array.from({ length: 64 }, (_, i) => (
            <div key={i} className="border" style={{
              borderColor: 'rgba(139,26,26,0.3)',
              background: [10, 11, 18, 19, 26, 33, 34, 41, 55, 62].includes(i) ? 'rgba(139,26,26,0.4)' : 'transparent',
            }} />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-[700px] px-8">

        {/* Logo */}
        <div className="mb-8" style={{ transform: 'scale(2.2)' }}>
          <LogoHex />
        </div>

        {/* Title */}
        <h1
          className="text-center uppercase mb-2 tracking-[0.15em]"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(48px, 8vw, 80px)',
            fontWeight: 900,
            color: 'var(--t1)',
            lineHeight: 0.95,
            textShadow: '0 0 80px rgba(139,26,26,0.3)',
          }}
        >
          CipherFleet
        </h1>

        {/* Tagline */}
        <p className="text-center mb-10 tracking-[0.35em] uppercase" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '14px',
          fontWeight: 400,
          color: 'var(--crimson)',
        }}>
          The ocean is encrypted
        </p>

        {/* Divider */}
        <div className="w-[140px] h-px mb-10" style={{ background: 'linear-gradient(90deg, transparent, var(--crimson), transparent)' }} />

        {/* FHE explanation — 3 steps */}
        <div className="grid grid-cols-3 gap-6 mb-12 w-full max-w-[600px]">
          <StepCard
            step="01"
            title="Place Ships"
            desc="Coordinates encrypted as euint8 on-chain. Nobody can read them."
            accent="var(--crimson)"
          />
          <StepCard
            step="02"
            title="Attack"
            desc="FHE.eq() compares ciphertext. Ship positions never decrypted."
            accent="var(--gold)"
          />
          <StepCard
            step="03"
            title="Hit or Miss"
            desc="Only ebool result revealed. Coordinates stay encrypted forever."
            accent="var(--safe-hi)"
          />
        </div>

        {/* Encrypted data visualization */}
        <div className="flex items-center gap-3 mb-10 py-3 px-5" style={{ border: '1px solid rgba(139,26,26,0.2)', background: 'rgba(139,26,26,0.04)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--crimson)', animation: 'dot-blink 1.6s ease-in-out infinite' }} />
          <span className="text-[10px] tracking-[0.1em] uppercase" style={{ color: 'var(--t3)' }}>
            Ship at [3,4] on-chain:
          </span>
          <code className="text-[11px] tracking-[0.05em] font-medium" style={{ color: 'var(--flame)', fontFamily: "'JetBrains Mono', monospace" }}>
            {hexChars}
          </code>
          <span className="text-[10px] tracking-[0.08em] uppercase" style={{ color: 'var(--t4)' }}>
            unreadable
          </span>
        </div>

        {/* Start button */}
        <button
          onClick={onStartGame}
          className="group relative py-4 px-14 uppercase tracking-[0.2em] text-[11px] border cursor-pointer transition-all duration-300"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            borderColor: 'var(--crimson)',
            color: 'var(--flame)',
            background: 'rgba(139,26,26,0.08)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(139,26,26,0.2)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(139,26,26,0.4), inset 0 0 20px rgba(139,26,26,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(139,26,26,0.08)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-[-1px] left-[-1px] w-3 h-3 opacity-60" style={{ borderTop: '2px solid var(--crimson)', borderLeft: '2px solid var(--crimson)' }} />
          <div className="absolute bottom-[-1px] right-[-1px] w-3 h-3 opacity-60" style={{ borderBottom: '2px solid var(--crimson)', borderRight: '2px solid var(--crimson)' }} />
          Start Game
        </button>

        {/* Footer info */}
        <div className="mt-14 flex items-center gap-6">
          <FooterChip>Fhenix CoFHE</FooterChip>
          <FooterChip>Arbitrum Sepolia</FooterChip>
          <FooterChip>AKINDO WaveHack</FooterChip>
        </div>

        <p className="mt-6 text-[8px] tracking-[0.15em] uppercase text-center" style={{ color: 'var(--t4)' }}>
          The first on-chain game where ship positions are mathematically hidden &mdash; not just hidden by trust
        </p>
      </div>
    </div>
  );
}

function StepCard({ step, title, desc, accent }: { step: string; title: string; desc: string; accent: string }) {
  return (
    <div className="flex flex-col p-4 relative" style={{ border: '1px solid var(--ghost)', background: 'rgba(12,10,18,0.6)' }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="text-[8px] tracking-[0.2em] uppercase mb-2 font-medium" style={{ color: accent }}>
        {step}
      </div>
      <div className="text-[11px] tracking-[0.08em] uppercase mb-2 font-semibold" style={{ color: 'var(--t1)' }}>
        {title}
      </div>
      <div className="text-[9px] leading-[1.7] font-light" style={{ color: 'var(--t3)' }}>
        {desc}
      </div>
    </div>
  );
}

function FooterChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[8px] tracking-[0.12em] uppercase py-[4px] px-[10px] border" style={{ borderColor: 'var(--ghost)', color: 'var(--t4)' }}>
      {children}
    </span>
  );
}
