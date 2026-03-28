import { useState, useEffect, useRef, useCallback } from 'react';

interface LandingPageProps {
  onStartGame: () => void;
}

const HEX = '0123456789abcdef';
const randHex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join('');

// ── Types for battle scene ──
interface Particle { x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number; maxLife: number; }
interface Projectile { x: number; y: number; tx: number; ty: number; speed: number; trail: { x: number; y: number }[]; alive: boolean; fromLeft: boolean; }
interface Explosion { x: number; y: number; radius: number; maxRadius: number; alpha: number; particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number; }[]; }
interface GridHit { col: number; row: number; alpha: number; isHit: boolean; time: number; }
interface Ship { x: number; y: number; width: number; height: number; facing: 'right' | 'left'; bobOffset: number; bobSpeed: number; }

export default function LandingPage({ onStartGame }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
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
    const iv = setInterval(() => { i++; setTypedTitle(title.slice(0, i)); if (i >= title.length) clearInterval(iv); }, 80);
    return () => clearInterval(iv);
  }, [phase]);

  // ── Tagline typewriter ──
  useEffect(() => {
    if (phase < 1) return;
    const delay = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => { i++; setTypedTagline(tagline.slice(0, i)); if (i >= tagline.length) clearInterval(iv); }, 40);
      return () => clearInterval(iv);
    }, title.length * 80 + 200);
    return () => clearTimeout(delay);
  }, [phase]);

  // ── Cards stagger ──
  useEffect(() => {
    if (phase < 2) return;
    [0, 1, 2].forEach(i => {
      setTimeout(() => setCardsVisible(prev => { const n = [...prev]; n[i] = true; return n; }), i * 200);
    });
  }, [phase]);

  // ── Glitch ──
  useEffect(() => {
    const iv = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 100 + Math.random() * 100); }, 3000 + Math.random() * 4000);
    return () => clearInterval(iv);
  }, []);

  // ── Hex stream ──
  useEffect(() => {
    const iv = setInterval(() => setHexStream(randHex(32)), 80);
    return () => clearInterval(iv);
  }, []);

  // ══════════════════════════════════════════════
  // BATTLE SCENE CANVAS
  // ══════════════════════════════════════════════
  const bgParticles = useRef<Particle[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const explosions = useRef<Explosion[]>([]);
  const gridHits = useRef<GridHit[]>([]);
  const ships = useRef<Ship[]>([]);
  const frameCount = useRef(0);

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const W = c.width, H = c.height;

    // Background particles (ocean dust)
    bgParticles.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2, vy: -Math.random() * 0.3 - 0.05,
      size: Math.random() * 1.5 + 0.3, alpha: Math.random() * 0.3 + 0.05,
      life: 0, maxLife: 1,
    }));

    // Ships — left fleet (friendly) and right fleet (enemy)
    ships.current = [
      // Left fleet
      { x: W * 0.08, y: H * 0.72, width: 120, height: 16, facing: 'right', bobOffset: Math.random() * Math.PI * 2, bobSpeed: 0.008 },
      { x: W * 0.05, y: H * 0.80, width: 80, height: 12, facing: 'right', bobOffset: Math.random() * Math.PI * 2, bobSpeed: 0.01 },
      { x: W * 0.12, y: H * 0.88, width: 60, height: 10, facing: 'right', bobOffset: Math.random() * Math.PI * 2, bobSpeed: 0.012 },
      // Right fleet
      { x: W * 0.82, y: H * 0.68, width: 110, height: 15, facing: 'left', bobOffset: Math.random() * Math.PI * 2, bobSpeed: 0.009 },
      { x: W * 0.88, y: H * 0.78, width: 75, height: 11, facing: 'left', bobOffset: Math.random() * Math.PI * 2, bobSpeed: 0.011 },
      { x: W * 0.85, y: H * 0.86, width: 55, height: 9, facing: 'left', bobOffset: Math.random() * Math.PI * 2, bobSpeed: 0.013 },
    ];

    projectiles.current = [];
    explosions.current = [];
    gridHits.current = [];
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

    const fireProjectile = () => {
      const fromLeft = Math.random() > 0.5;
      const srcShips = ships.current.filter(s => fromLeft ? s.facing === 'right' : s.facing === 'left');
      const tgtShips = ships.current.filter(s => fromLeft ? s.facing === 'left' : s.facing === 'right');
      if (!srcShips.length || !tgtShips.length) return;

      const src = srcShips[Math.floor(Math.random() * srcShips.length)];
      const tgt = tgtShips[Math.floor(Math.random() * tgtShips.length)];

      // Sometimes miss — shoot at random water
      const miss = Math.random() > 0.45;
      const tx = miss ? tgt.x + (Math.random() - 0.5) * 200 : tgt.x + tgt.width / 2;
      const ty = miss ? tgt.y + (Math.random() - 0.5) * 80 : tgt.y;

      projectiles.current.push({
        x: src.x + (fromLeft ? src.width : 0),
        y: src.y - 4,
        tx, ty,
        speed: 3 + Math.random() * 2,
        trail: [],
        alive: true,
        fromLeft,
      });
    };

    const createExplosion = (x: number, y: number, isHit: boolean) => {
      const numParts = isHit ? 20 : 8;
      const maxR = isHit ? 30 : 15;
      explosions.current.push({
        x, y, radius: 2, maxRadius: maxR, alpha: 1,
        particles: Array.from({ length: numParts }, () => ({
          x, y,
          vx: (Math.random() - 0.5) * (isHit ? 6 : 3),
          vy: (Math.random() - 0.5) * (isHit ? 6 : 3) - 1,
          alpha: 1,
          size: Math.random() * (isHit ? 3 : 1.5) + 0.5,
        })),
      });

      // Add grid hit marker
      const gridX = Math.floor((x / c.width) * 8);
      const gridY = Math.floor((y / c.height) * 8);
      gridHits.current.push({ col: gridX, row: gridY, alpha: 1, isHit, time: 0 });
    };

    // Draw ship silhouette
    const drawShip = (ship: Ship, time: number) => {
      const bob = Math.sin(time * ship.bobSpeed + ship.bobOffset) * 3;
      const sx = ship.x;
      const sy = ship.y + bob;
      const w = ship.width;
      const h = ship.height;

      ctx.save();
      if (ship.facing === 'left') {
        ctx.translate(sx + w, sy);
        ctx.scale(-1, 1);
        ctx.translate(0, 0);
      } else {
        ctx.translate(sx, sy);
      }

      // Hull
      ctx.beginPath();
      ctx.moveTo(0, h * 0.4);
      ctx.lineTo(w * 0.08, 0);
      ctx.lineTo(w * 0.85, 0);
      ctx.lineTo(w, h * 0.4);
      ctx.lineTo(w * 0.92, h);
      ctx.lineTo(w * 0.05, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(139,26,26,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(184,32,32,0.2)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Bridge / superstructure
      const bx = w * 0.35, bw = w * 0.25, bh = h * 0.7;
      ctx.fillStyle = 'rgba(139,26,26,0.15)';
      ctx.fillRect(bx, -bh, bw, bh);
      ctx.strokeStyle = 'rgba(184,32,32,0.15)';
      ctx.strokeRect(bx, -bh, bw, bh);

      // Antenna
      ctx.strokeStyle = 'rgba(184,32,32,0.12)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, -bh);
      ctx.lineTo(bx + bw / 2, -bh - h * 0.5);
      ctx.stroke();

      // Gun turret dot
      ctx.fillStyle = 'rgba(184,32,32,0.25)';
      ctx.beginPath();
      ctx.arc(w * 0.15, h * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(w * 0.75, h * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Engine glow
      ctx.fillStyle = 'rgba(232,64,64,0.08)';
      ctx.beginPath();
      ctx.arc(w * 0.05, h * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Water line reflection
      ctx.fillStyle = 'rgba(139,26,26,0.03)';
      ctx.fillRect(sx, sy + h + 2, w, h * 0.4);
    };

    // Draw 8x8 grid overlay (subtle)
    const drawGrid = () => {
      const W = c.width, H = c.height;
      const gx = W * 0.32, gy = H * 0.25;
      const gw = W * 0.36, gh = H * 0.45;
      const cellW = gw / 8, cellH = gh / 8;

      ctx.strokeStyle = 'rgba(139,26,26,0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath(); ctx.moveTo(gx + i * cellW, gy); ctx.lineTo(gx + i * cellW, gy + gh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx, gy + i * cellH); ctx.lineTo(gx + gw, gy + i * cellH); ctx.stroke();
      }

      // Draw hit markers on grid
      gridHits.current.forEach(hit => {
        if (hit.alpha <= 0) return;
        const cx = gx + (hit.col + 0.5) * cellW;
        const cy = gy + (hit.row + 0.5) * cellH;

        if (hit.isHit) {
          // Red X
          ctx.strokeStyle = `rgba(212,40,40,${hit.alpha * 0.3})`;
          ctx.lineWidth = 2;
          const s = Math.min(cellW, cellH) * 0.25;
          ctx.beginPath(); ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s); ctx.stroke();
          // Glow
          ctx.fillStyle = `rgba(212,40,40,${hit.alpha * 0.08})`;
          ctx.fillRect(gx + hit.col * cellW, gy + hit.row * cellH, cellW, cellH);
        } else {
          // Blue dot (miss)
          ctx.fillStyle = `rgba(100,130,180,${hit.alpha * 0.2})`;
          ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
        }
      });
    };

    // ── Main draw loop ──
    const draw = () => {
      frameCount.current++;
      const time = frameCount.current;
      ctx.clearRect(0, 0, c.width, c.height);

      // ── Grid ──
      drawGrid();

      // ── Background particles ──
      bgParticles.current.forEach(p => {
        ctx.fillStyle = `rgba(184,32,32,${p.alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width; }
        if (p.x < -10 || p.x > c.width + 10) p.x = Math.random() * c.width;
      });

      // ── Ships ──
      ships.current.forEach(ship => drawShip(ship, time));

      // ── Fire projectiles periodically ──
      if (time % 90 === 0 || (time % 45 === 0 && Math.random() > 0.5)) {
        fireProjectile();
      }

      // ── Projectiles ──
      projectiles.current.forEach(p => {
        if (!p.alive) return;

        // Store trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 15) p.trail.shift();

        // Move toward target
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < p.speed * 2) {
          // Hit!
          p.alive = false;
          const hitShip = ships.current.some(s => {
            const bob = Math.sin(time * s.bobSpeed + s.bobOffset) * 3;
            return p.tx >= s.x && p.tx <= s.x + s.width && Math.abs(p.ty - (s.y + bob)) < s.height * 2;
          });
          createExplosion(p.tx, p.ty, hitShip);
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;

          // Arc trajectory (slight upward then down)
          const progress = 1 - dist / Math.sqrt((p.tx - (p.fromLeft ? 0 : c.width)) ** 2 + (p.ty - p.y) ** 2 + 1);
          p.y -= Math.sin(progress * Math.PI) * 0.8;
        }

        // Draw trail
        ctx.lineWidth = 1.5;
        for (let i = 0; i < p.trail.length - 1; i++) {
          const a = (i / p.trail.length) * 0.4;
          ctx.strokeStyle = p.fromLeft
            ? `rgba(232,64,64,${a})`
            : `rgba(200,150,12,${a})`;
          ctx.beginPath();
          ctx.moveTo(p.trail[i].x, p.trail[i].y);
          ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
          ctx.stroke();
        }

        // Draw projectile head
        ctx.fillStyle = p.fromLeft ? 'rgba(255,80,80,0.9)' : 'rgba(232,176,32,0.9)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
        // Glow
        ctx.fillStyle = p.fromLeft ? 'rgba(255,80,80,0.15)' : 'rgba(232,176,32,0.15)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
      });

      // Clean dead projectiles
      projectiles.current = projectiles.current.filter(p => p.alive || p.trail.length > 0);

      // ── Explosions ──
      explosions.current.forEach(exp => {
        // Shockwave ring
        if (exp.radius < exp.maxRadius) {
          ctx.strokeStyle = `rgba(232,64,64,${exp.alpha * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2); ctx.stroke();
          exp.radius += 1.5;
        }

        // Core flash
        if (exp.alpha > 0.5) {
          const grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.maxRadius * 0.4);
          grad.addColorStop(0, `rgba(255,200,100,${exp.alpha * 0.6})`);
          grad.addColorStop(0.5, `rgba(232,64,64,${exp.alpha * 0.3})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(exp.x, exp.y, exp.maxRadius * 0.4, 0, Math.PI * 2); ctx.fill();
        }

        // Debris particles
        exp.particles.forEach(ep => {
          ctx.fillStyle = `rgba(232,100,60,${ep.alpha})`;
          ctx.beginPath(); ctx.arc(ep.x, ep.y, ep.size, 0, Math.PI * 2); ctx.fill();
          ep.x += ep.vx;
          ep.y += ep.vy;
          ep.vy += 0.05; // gravity
          ep.alpha -= 0.015;
          ep.size *= 0.995;
        });

        exp.alpha -= 0.02;
      });

      // Clean expired explosions & grid hits
      explosions.current = explosions.current.filter(e => e.alpha > 0 || e.particles.some(p => p.alpha > 0));
      gridHits.current.forEach(h => { h.time++; if (h.time > 300) h.alpha -= 0.005; });
      gridHits.current = gridHits.current.filter(h => h.alpha > 0);

      // ── Water line ──
      const waterY = c.height * 0.92;
      ctx.strokeStyle = 'rgba(139,26,26,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < c.width; x += 4) {
        const wy = waterY + Math.sin((x + time * 0.5) * 0.02) * 2;
        x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
      }
      ctx.stroke();

      // ── Muzzle flashes on ships that just fired ──
      projectiles.current.forEach(p => {
        if (p.trail.length < 3 && p.alive) {
          ctx.fillStyle = `rgba(255,200,100,${0.5 - p.trail.length * 0.15})`;
          ctx.beginPath(); ctx.arc(p.trail[0]?.x || p.x, p.trail[0]?.y || p.y, 6, 0, Math.PI * 2); ctx.fill();
        }
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleStart = () => { setTransitioning(true); setTimeout(onStartGame, 800); };

  return (
    <div className="fixed inset-0 z-[400] overflow-hidden" style={{ background: 'var(--abyss)', opacity: transitioning ? 0 : 1, transition: 'opacity 0.8s ease-out' }}>
      {/* Battle scene canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Atmosphere overlays */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: `
          radial-gradient(ellipse 100% 60% at 50% 120%, rgba(139,26,26,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 80% 50% at 50% 0%, rgba(6,5,20,0.95) 0%, transparent 60%),
          radial-gradient(ellipse 60% 60% at 30% 70%, rgba(139,26,26,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 80% 30%, rgba(200,150,12,0.03) 0%, transparent 50%)
        `,
      }} />

      {/* Hex rain */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="absolute top-0 text-[9px] leading-[1.6]" style={{
            left: `${5 + i * 10}%`, color: 'rgba(184,32,32,0.05)',
            fontFamily: "'JetBrains Mono', monospace", writingMode: 'vertical-lr',
            animation: `hex-fall ${10 + i * 2}s linear infinite`, animationDelay: `${-i * 1.5}s`,
          }}>
            {randHex(60).split('').map((ch, j) => <span key={j}>{ch}</span>)}
          </div>
        ))}
      </div>

      {/* Scanlines */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,26,26,0.015) 2px, rgba(139,26,26,0.015) 4px)',
      }} />

      {/* ═══ CONTENT ═══ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">

        {/* Classified header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between py-4 px-8 z-20" style={{
          borderBottom: '1px solid rgba(139,26,26,0.15)',
          background: 'linear-gradient(180deg, rgba(6,5,10,0.9) 0%, transparent 100%)',
        }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--crimson)', animation: 'dot-blink 1.6s ease-in-out infinite' }} />
            <span className="text-[8px] tracking-[0.25em] uppercase" style={{ color: 'var(--t4)' }}>
              Classified &middot; FHE Encrypted Channel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[8px] tracking-[0.15em] uppercase" style={{ color: 'var(--t4)' }}>
              CoFHE: <span style={{ color: 'var(--safe-hi)' }}>Online</span>
            </span>
            <span className="text-[8px] tracking-[0.15em] uppercase" style={{ color: 'var(--t4)' }}>
              Nodes: <span style={{ color: 'var(--safe-hi)' }}>5/5</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center mt-8">

          {/* Animated logo with glow */}
          <div className="relative mb-8">
            <div className="absolute inset-[-30px] rounded-full" style={{
              background: 'radial-gradient(circle, rgba(139,26,26,0.2) 0%, transparent 70%)',
              animation: 'radar-pulse 3s ease-in-out infinite',
            }} />
            <div style={{ transform: 'scale(3)', filter: 'drop-shadow(0 0 20px rgba(139,26,26,0.5))' }}>
              <div className="relative w-[38px] h-[38px]">
                <svg viewBox="0 0 38 38" fill="none" className="w-[38px] h-[38px]" style={{ animation: 'hex-rotate 10s linear infinite' }}>
                  <polygon points="19,2 35,11 35,27 19,36 3,27 3,11" stroke="rgba(184,32,32,0.7)" strokeWidth="1" fill="none" />
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

          {/* Title with glitch */}
          <div className="relative mb-3">
            <h1 className="text-center uppercase tracking-[0.2em]" style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(52px, 9vw, 88px)', fontWeight: 900,
              color: 'var(--t1)', lineHeight: 1,
              textShadow: glitch ? '3px 0 var(--crimson), -3px 0 rgba(0,200,255,0.3)' : '0 0 60px rgba(139,26,26,0.3), 0 0 120px rgba(139,26,26,0.15)',
              transition: glitch ? 'none' : 'text-shadow 0.3s',
            }}>
              {typedTitle}
              <span style={{ opacity: phase < 2 ? 1 : 0, animation: 'dot-blink 0.6s step-end infinite', color: 'var(--crimson)' }}>_</span>
            </h1>
            {glitch && (
              <>
                <h1 className="absolute top-0 left-0 text-center uppercase tracking-[0.2em] w-full" style={{
                  fontFamily: "'Cinzel', serif", fontSize: 'clamp(52px, 9vw, 88px)', fontWeight: 900,
                  color: 'transparent', lineHeight: 1, WebkitTextStroke: '1px rgba(184,32,32,0.4)',
                  transform: 'translate(3px, -2px)', clipPath: 'inset(20% 0 40% 0)',
                }}>{typedTitle}</h1>
                <h1 className="absolute top-0 left-0 text-center uppercase tracking-[0.2em] w-full" style={{
                  fontFamily: "'Cinzel', serif", fontSize: 'clamp(52px, 9vw, 88px)', fontWeight: 900,
                  color: 'transparent', lineHeight: 1, WebkitTextStroke: '1px rgba(0,150,255,0.2)',
                  transform: 'translate(-2px, 2px)', clipPath: 'inset(50% 0 10% 0)',
                }}>{typedTitle}</h1>
              </>
            )}
          </div>

          {/* Tagline */}
          <p className="text-center mb-2 tracking-[0.4em] uppercase" style={{
            fontFamily: "'Cinzel', serif", fontSize: '13px', fontWeight: 400,
            color: 'var(--crimson)', textShadow: '0 0 30px rgba(139,26,26,0.3)',
          }}>
            {typedTagline}
          </p>

          {/* Hex stream */}
          <div className="mb-6 py-2 px-4 overflow-hidden" style={{ maxWidth: '500px' }}>
            <code className="text-[10px] tracking-[0.02em] break-all" style={{ color: 'rgba(184,32,32,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
              {hexStream}
            </code>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8 w-[300px]">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,26,26,0.4))' }} />
            <div className="w-2 h-2 rotate-45" style={{ border: '1px solid var(--crimson)', background: 'rgba(139,26,26,0.2)' }} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(139,26,26,0.4), transparent)' }} />
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-5 mb-10 w-full max-w-[660px]">
            {[
              { step: 'I', icon: '\u2693', title: 'Deploy Fleet', desc: 'Ship coordinates encrypted as euint8 ciphertext. Stored on-chain, unreadable by anyone.', accent: 'var(--crimson)' },
              { step: 'II', icon: '\u2316', title: 'Encrypted Strike', desc: 'FHE.eq() runs on ciphertext in the CoFHE coprocessor. Positions never decrypted.', accent: 'var(--gold)' },
              { step: 'III', icon: '\u2622', title: 'Verdict', desc: 'Only ebool revealed: hit or miss. Coordinates remain encrypted forever.', accent: 'var(--safe-hi)' },
            ].map((card, i) => (
              <div key={i} className="relative flex flex-col p-5 transition-all duration-500" style={{
                border: '1px solid var(--ghost)', background: 'rgba(12,10,18,0.8)', backdropFilter: 'blur(8px)',
                opacity: cardsVisible[i] ? 1 : 0, transform: cardsVisible[i] ? 'translateY(0)' : 'translateY(20px)',
              }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${card.accent}, transparent)` }} />
                <div className="absolute top-[-1px] left-[-1px] w-2 h-2" style={{ borderTop: `1px solid ${card.accent}`, borderLeft: `1px solid ${card.accent}`, opacity: 0.5 }} />
                <div className="absolute bottom-[-1px] right-[-1px] w-2 h-2" style={{ borderBottom: `1px solid ${card.accent}`, borderRight: `1px solid ${card.accent}`, opacity: 0.5 }} />
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[16px]" style={{ opacity: 0.6 }}>{card.icon}</span>
                  <span className="text-[8px] tracking-[0.25em] uppercase font-medium" style={{ color: card.accent }}>{card.step}</span>
                </div>
                <div className="text-[12px] tracking-[0.08em] uppercase mb-2 font-semibold" style={{ color: 'var(--t1)' }}>{card.title}</div>
                <div className="text-[9px] leading-[1.8] font-light" style={{ color: 'var(--t3)' }}>{card.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button onClick={handleStart}
            className="relative py-4 px-16 uppercase tracking-[0.25em] text-[11px] border cursor-pointer transition-all duration-300 mb-5"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'var(--crimson)', color: 'var(--flame)', background: 'rgba(139,26,26,0.08)', animation: phase >= 2 ? 'turn-pulse 2.5s ease-in-out infinite' : 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,26,26,0.2)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(139,26,26,0.5), inset 0 0 30px rgba(139,26,26,0.1)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,26,26,0.08)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div className="absolute top-[-1px] left-[-1px] w-3 h-3 opacity-60" style={{ borderTop: '2px solid var(--crimson)', borderLeft: '2px solid var(--crimson)' }} />
            <div className="absolute top-[-1px] right-[-1px] w-3 h-3 opacity-60" style={{ borderTop: '2px solid var(--crimson)', borderRight: '2px solid var(--crimson)' }} />
            <div className="absolute bottom-[-1px] left-[-1px] w-3 h-3 opacity-60" style={{ borderBottom: '2px solid var(--crimson)', borderLeft: '2px solid var(--crimson)' }} />
            <div className="absolute bottom-[-1px] right-[-1px] w-3 h-3 opacity-60" style={{ borderBottom: '2px solid var(--crimson)', borderRight: '2px solid var(--crimson)' }} />
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-0 left-0 right-0 h-full" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(184,32,32,0.1) 50%, transparent 100%)', animation: 'btn-scan 2s ease-in-out infinite' }} />
            </div>
            <span className="relative z-10">Enter Battle</span>
          </button>

          <p className="text-[9px] tracking-[0.12em] uppercase mb-8" style={{ color: 'var(--t4)' }}>
            No wallet required for demo &middot; Testnet deployment coming Wave 2
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 mb-3">
            {['Fhenix CoFHE', 'Arbitrum Sepolia', 'AKINDO WaveHack', 'FHE.eq()'].map(l => (
              <span key={l} className="text-[7px] tracking-[0.14em] uppercase py-[4px] px-[10px] border transition-colors hover:border-[rgba(139,26,26,0.3)] hover:text-[var(--t3)]"
                style={{ borderColor: 'var(--ghost)', color: 'var(--t4)' }}>{l}</span>
            ))}
          </div>
          <p className="text-[8px] tracking-[0.18em] uppercase text-center max-w-[500px] mb-4" style={{ color: 'var(--t4)', lineHeight: 1.8 }}>
            The first on-chain game where ship positions are mathematically hidden &mdash; not just hidden by trust.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes radar-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
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
