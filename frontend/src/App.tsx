import { useEffect, useState, useRef } from 'react';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import SidebarLeft from './components/SidebarLeft';
import GameGrid from './components/GameGrid';
import FHEFeed from './components/FHEFeed';
import AttackOverlay from './components/AttackOverlay';
import WinScreen from './components/WinScreen';
import { useGameState } from './hooks/useGameState';
import { useSound } from './hooks/useSound';
import { COLS } from './lib/gameTypes';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [showPlacingPrompt, setShowPlacingPrompt] = useState(true);
  const {
    gameState,
    logs,
    targetCell,
    setTargetCell,
    attackingCell,
    showOverlay,
    overlayResult,
    showWin,
    setShowWin,
    showLoss,
    setShowLoss,
    sunkMessage,
    placingShipIndex,
    placingOrientation,
    setPlacingOrientation,
    addLog,
    clearLogs,
    placeShip,
    doAttack,
    resetGame,
    quickDeploy,
  } = useGameState();

  const sound = useSound();

  // Turn banner — only show when overlay is closed
  const [turnBanner, setTurnBanner] = useState<'you' | 'enemy' | null>(null);
  const prevTurnRef = useRef(gameState.isMyTurn);
  const pendingBanner = useRef<'you' | 'enemy' | null>(null);

  useEffect(() => {
    if (gameState.phase !== 'BATTLE') return;
    if (gameState.isMyTurn !== prevTurnRef.current) {
      prevTurnRef.current = gameState.isMyTurn;
      const banner = gameState.isMyTurn ? 'you' as const : 'enemy' as const;

      if (showOverlay) {
        // Queue it — show after overlay closes
        pendingBanner.current = banner;
      } else {
        setTurnBanner(banner);
        const t = setTimeout(() => setTurnBanner(null), 1800);
        return () => clearTimeout(t);
      }
    }
  }, [gameState.isMyTurn, gameState.phase, showOverlay]);

  // Show queued banner when overlay closes
  useEffect(() => {
    if (!showOverlay && pendingBanner.current) {
      const banner = pendingBanner.current;
      pendingBanner.current = null;
      // Small delay so overlay fully fades out first
      const t1 = setTimeout(() => {
        setTurnBanner(banner);
        const t2 = setTimeout(() => setTurnBanner(null), 1800);
        return () => clearTimeout(t2);
      }, 400);
      return () => clearTimeout(t1);
    }
  }, [showOverlay]);

  // Battle start countdown
  const [battleCountdown, setBattleCountdown] = useState<number | null>(null);
  const prevPhaseRef = useRef(gameState.phase);

  useEffect(() => {
    if (prevPhaseRef.current === 'PLACING' && gameState.phase === 'BATTLE') {
      // Phase just changed to BATTLE — show countdown
      setBattleCountdown(3);
      const t2 = setTimeout(() => setBattleCountdown(2), 1000);
      const t1 = setTimeout(() => setBattleCountdown(1), 2000);
      const t0 = setTimeout(() => setBattleCountdown(0), 3000);
      const clear = setTimeout(() => setBattleCountdown(null), 3600);
      return () => { clearTimeout(t2); clearTimeout(t1); clearTimeout(t0); clearTimeout(clear); };
    }
    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase]);

  // Track the coord being attacked (shown during computing phase)
  const [attackCoord, setAttackCoord] = useState<{ coord: string; row: number; col: number } | null>(null);

  // Update attackCoord when a new attack starts
  useEffect(() => {
    if (attackingCell) {
      const [r, c] = attackingCell.split(',').map(Number);
      setAttackCoord({ coord: `${COLS[c]}${r + 1}`, row: r, col: c });
    } else if (!showOverlay) {
      setAttackCoord(null);
    }
  }, [attackingCell, showOverlay]);

  // Heartbeat — less frequent, less noisy
  useEffect(() => {
    const interval = setInterval(() => {
      addLog('sys', 'NET', 'CoFHE 5/5 nodes healthy');
    }, 30000);
    return () => clearInterval(interval);
  }, [addLog]);

  // Initial logs
  useEffect(() => {
    addLog('sys', 'SYS', `Game ${gameState.gameId} ready`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lastResolvedAttack = overlayResult && !showOverlay ? overlayResult : (
    logs.filter(l => l.type === 'hit' || l.type === 'miss').length > 0
      ? (() => {
          const lastHitLog = [...logs].reverse().find(l => l.type === 'hit' || l.type === 'miss');
          if (!lastHitLog) return null;
          const match = lastHitLog.message.match(/\[([A-H])(\d)\]/);
          if (!match) return null;
          const col = COLS.indexOf(match[1]);
          const row = parseInt(match[2]) - 1;
          return { coord: `${match[1]}${match[2]}`, row, col, hit: lastHitLog.type === 'hit' };
        })()
      : null
  );

  // Sound on attack overlay result
  useEffect(() => {
    if (overlayResult) {
      if (overlayResult.hit) {
        sound.hit();
      } else {
        sound.miss();
      }
    }
  }, [overlayResult, sound]);

  // Sound on win
  useEffect(() => {
    if (showWin) sound.victory();
  }, [showWin, sound]);

  if (showLanding) {
    return <LandingPage
      onStartGame={() => {
        setShowLanding(false);
        sound.startGame();
        sound.startDrone(0.25); // ensure music is playing at game volume
      }}
      onFirstInteraction={() => {
        sound.startDrone(0.15); // start quiet on landing
      }}
    />;
  }

  return (
    <>
      <AttackOverlay show={showOverlay} attackCoord={attackCoord} result={overlayResult} />
      <WinScreen show={showWin} onPlayAgain={() => { resetGame(); setShowPlacingPrompt(true); }} onClose={() => setShowWin(false)} />

      {/* Battle start countdown */}
      {battleCountdown !== null && (
        <div className="fixed inset-0 z-[280] flex items-center justify-center" style={{
          background: 'rgba(6,5,10,0.9)',
          backdropFilter: 'blur(6px)',
        }}>
          <div className="flex flex-col items-center">
            {battleCountdown > 0 ? (
              <>
                <div className="text-[8px] tracking-[0.35em] uppercase mb-6" style={{ color: 'var(--crimson)' }}>
                  Fleet Encrypted &middot; Coordinates Locked
                </div>
                <div className="text-[9px] tracking-[0.2em] uppercase mb-8" style={{ color: 'var(--t3)' }}>
                  Battle begins in
                </div>
                <div key={battleCountdown} style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '120px',
                  fontWeight: 900,
                  color: 'var(--t1)',
                  lineHeight: 1,
                  textShadow: '0 0 60px rgba(139,26,26,0.5), 0 0 120px rgba(139,26,26,0.2)',
                  animation: 'result-drop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  {battleCountdown}
                </div>
                <div className="w-[80px] h-px mt-8" style={{ background: 'linear-gradient(90deg, transparent, var(--crimson), transparent)' }} />
              </>
            ) : (
              <>
                <div key="go" className="uppercase" style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: '64px',
                  fontWeight: 900,
                  color: 'var(--flame)',
                  letterSpacing: '0.2em',
                  textShadow: '0 0 40px rgba(232,64,64,0.6), 0 0 80px rgba(232,64,64,0.3)',
                  animation: 'result-drop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  Engage
                </div>
                <div className="text-[9px] tracking-[0.2em] uppercase mt-3" style={{ color: 'var(--t3)' }}>
                  Select a target on the enemy grid
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loss screen */}
      {showLoss && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(6,5,10,0.95)' }}>
          <div className="text-center">
            <div className="text-[9px] tracking-[0.3em] uppercase mb-5" style={{ color: 'var(--scarlet)' }}>
              CipherFleet &middot; All your ships have been sunk
            </div>
            <div className="uppercase mb-1.5" style={{ fontFamily: "'Cinzel', serif", fontSize: '72px', fontWeight: 900, color: 'var(--scarlet)', lineHeight: 0.9, textShadow: '0 0 60px rgba(212,40,40,0.4)' }}>
              Defeat
            </div>
            <div className="uppercase mb-4" style={{ fontFamily: "'Cinzel', serif", fontSize: '28px', fontWeight: 400, color: 'var(--t3)', letterSpacing: '0.25em' }}>
              Enemy Wins
            </div>
            <div className="w-[120px] h-px mx-auto my-5 mb-7" style={{ background: 'linear-gradient(90deg, transparent, var(--scarlet), transparent)' }} />
            <div className="text-[9.5px] tracking-[0.14em] uppercase mb-10 font-light" style={{ color: 'var(--t4)' }}>
              Your fleet was eliminated &middot; Encryption held &mdash; coordinates were never revealed
            </div>
            <div className="flex gap-2.5 justify-center">
              <button onClick={() => { resetGame(); setShowPlacingPrompt(true); setShowLoss(false); }}
                className="py-3 px-[30px] text-[9px] tracking-[0.14em] uppercase border cursor-pointer transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'var(--crimson)', color: 'var(--flame)', background: 'rgba(139,26,26,0.12)' }}>
                Try Again
              </button>
              <button onClick={() => setShowLoss(false)}
                className="py-3 px-[30px] text-[9px] tracking-[0.14em] uppercase border cursor-pointer transition-all hover:border-[var(--steel-lo)] hover:text-[var(--t2)]"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'var(--ghost)', color: 'var(--t3)', background: 'none' }}>
                View Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turn banner */}
      {turnBanner && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center pointer-events-none">
          {/* Full-width scanline flash */}
          <div className="absolute inset-0" style={{
            background: turnBanner === 'you'
              ? 'linear-gradient(180deg, transparent 40%, rgba(200,150,12,0.06) 50%, transparent 60%)'
              : 'linear-gradient(180deg, transparent 40%, rgba(212,40,40,0.06) 50%, transparent 60%)',
          }} />

          <div key={turnBanner} className="flex flex-col items-center" style={{
            animation: 'turn-banner-in 0.4s cubic-bezier(0.34,1.56,0.64,1), turn-banner-out 0.4s ease-in 1.3s forwards',
          }}>
            {/* Horizontal lines */}
            <div className="w-[300px] h-px mb-4" style={{
              background: turnBanner === 'you'
                ? 'linear-gradient(90deg, transparent, var(--gold), transparent)'
                : 'linear-gradient(90deg, transparent, var(--crimson), transparent)',
            }} />

            {/* Small label */}
            <div className="text-[8px] tracking-[0.4em] uppercase mb-2" style={{
              color: turnBanner === 'you' ? 'var(--gold)' : 'var(--crimson)',
            }}>
              {turnBanner === 'you' ? 'Incoming Transmission' : 'Warning \u2014 Enemy Active'}
            </div>

            {/* Main text */}
            <div className="uppercase" style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '48px',
              fontWeight: 900,
              letterSpacing: '0.15em',
              color: turnBanner === 'you' ? 'var(--gold-hi)' : 'var(--scarlet)',
              textShadow: turnBanner === 'you'
                ? '0 0 40px rgba(200,150,12,0.5), 0 0 80px rgba(200,150,12,0.2)'
                : '0 0 40px rgba(212,40,40,0.5), 0 0 80px rgba(212,40,40,0.2)',
            }}>
              {turnBanner === 'you' ? 'Your Turn' : 'Enemy Turn'}
            </div>

            {/* Sub text */}
            <div className="text-[9px] tracking-[0.15em] uppercase mt-2" style={{
              color: turnBanner === 'you' ? 'rgba(200,150,12,0.5)' : 'rgba(212,40,40,0.5)',
            }}>
              {turnBanner === 'you' ? 'Select target coordinates' : 'Brace for incoming attack'}
            </div>

            {/* Horizontal lines */}
            <div className="w-[300px] h-px mt-4" style={{
              background: turnBanner === 'you'
                ? 'linear-gradient(90deg, transparent, var(--gold), transparent)'
                : 'linear-gradient(90deg, transparent, var(--crimson), transparent)',
            }} />
          </div>
        </div>
      )}

      {/* Ship sunk notification */}
      {sunkMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[250] py-3 px-8"
          style={{
            border: '1px solid var(--crimson)',
            background: 'rgba(6,5,10,0.95)',
            backdropFilter: 'blur(8px)',
            animation: 'result-drop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <div className="text-[12px] tracking-[0.15em] uppercase font-bold" style={{ fontFamily: "'Cinzel', serif", color: 'var(--flame)', textShadow: 'var(--glow-crimson)' }}>
            {sunkMessage}
          </div>
        </div>
      )}

      <Navbar
        myShips={gameState.myShipsRemaining}
        enemyShips={gameState.enemyShipsRemaining}
        attackCount={gameState.attackCount}
        hitCount={gameState.hitCount}
        isMyTurn={gameState.isMyTurn}
        phase={gameState.phase}
        onLogoClick={() => { setShowLanding(true); setShowPlacingPrompt(true); sound.stopDrone(); }}
        musicOn={sound.musicOn}
        sfxOn={sound.sfxOn}
        onToggleMusic={sound.toggleMusic}
        onToggleSfx={sound.toggleSfx}
      />

      <div className="layout-grid flex-1 grid min-h-[calc(100vh-64px)]" style={{ gridTemplateColumns: '220px 1fr 260px' }}>
        {/* Left sidebar */}
        <SidebarLeft
          phase={gameState.phase}
          ships={gameState.ships}
          placingShipIndex={placingShipIndex}
          placingOrientation={placingOrientation}
          onOrientationToggle={() => setPlacingOrientation(o => o === 'H' ? 'V' : 'H')}
          onReset={resetGame}
          onDemoWin={() => setShowWin(true)}
          onQuickDeploy={() => { quickDeploy(); sound.encrypt(); }}
        />

        {/* Arena center */}
        <main className="flex flex-col overflow-hidden">
          {/* Arena header */}
          <div className="arena-header-wrap flex items-center justify-between py-2.5 sm:py-3.5 px-4 sm:px-8" style={{ borderBottom: '1px solid var(--ghost)', background: 'rgba(12,10,18,0.6)' }}>
            {/* Left — You */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(32,160,96,0.4)', background: 'rgba(32,160,96,0.08)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--safe-hi)" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <div>
                <div className="text-[7px] tracking-[0.15em] uppercase" style={{ color: 'var(--safe-hi)' }}>You</div>
                <div className="text-[8px] sm:text-[9px] tracking-[0.05em]" style={{ color: 'var(--t3)', fontFamily: "'JetBrains Mono', monospace" }}>0x4a2b...f3c1</div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 ml-1 py-[3px] px-2 rounded-sm" style={{ background: 'rgba(32,160,96,0.08)', border: '1px solid rgba(32,160,96,0.2)' }}>
                <div className="w-[5px] h-[5px] rounded-full" style={{
                  background: gameState.phase === 'BATTLE' ? 'var(--safe-hi)' : gameState.phase === 'FINISHED' ? 'var(--scarlet)' : 'var(--gold)',
                  animation: gameState.phase === 'BATTLE' ? 'dot-blink 2s ease-in-out infinite' : 'none',
                  boxShadow: gameState.phase === 'BATTLE' ? '0 0 4px var(--safe-hi)' : 'none',
                }} />
                <span className="text-[7px] tracking-[0.12em] uppercase" style={{ color: gameState.phase === 'BATTLE' ? 'var(--safe-hi)' : 'var(--t3)' }}>
                  {gameState.phase === 'BATTLE' ? 'Live' : gameState.phase === 'FINISHED' ? 'GG' : 'Setup'}
                </span>
              </div>
            </div>

            {/* Center — Target display */}
            <div className="flex flex-col items-center">
              <div
                className="text-[12px] sm:text-[14px] tracking-[0.15em] uppercase transition-colors"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: targetCell ? 'var(--gold-hi)' : 'var(--t3)',
                  textShadow: targetCell ? '0 0 12px rgba(200,150,12,0.3)' : 'none',
                }}
              >
                {targetCell || (gameState.phase === 'PLACING' ? 'Deploy Fleet' : gameState.phase === 'FINISHED' ? 'Battle Complete' : 'Awaiting Orders')}
              </div>
            </div>

            {/* Right — Opponent */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <div className="text-[7px] tracking-[0.15em] uppercase" style={{ color: 'var(--t4)' }}>Opponent</div>
                <div className="text-[9px] tracking-[0.05em]" style={{ color: 'var(--crimson)', fontFamily: "'JetBrains Mono', monospace" }}>0x9e1d...a4f2</div>
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(139,26,26,0.4)', background: 'rgba(139,26,26,0.08)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--crimson)" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Battle zone — two boards */}
          <div className="battle-zone flex-1 grid grid-cols-2 overflow-hidden relative">

            {/* Placing phase overlay prompt */}
            {gameState.phase === 'PLACING' && showPlacingPrompt && (
              <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(6,5,10,0.85)', backdropFilter: 'blur(4px)' }}>
                <div className="placing-overlay-inner flex flex-col items-center text-center px-8 max-w-[460px]">
                  <div className="text-[8px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--crimson)' }}>
                    Deploy Your Fleet
                  </div>
                  <div className="tracking-[0.1em] uppercase mb-3" style={{ fontFamily: "'Cinzel', serif", fontSize: '28px', fontWeight: 700, color: 'var(--t1)' }}>
                    Position Ships
                  </div>
                  <p className="text-[10px] leading-[1.8] mb-6 font-light" style={{ color: 'var(--t3)' }}>
                    Place your fleet on the grid manually, or quick deploy to jump straight into battle. Ship coordinates will be encrypted with FHE on-chain.
                  </p>

                  <button
                    onClick={() => { quickDeploy(); sound.encrypt(); }}
                    className="relative py-3.5 px-10 mb-4 uppercase tracking-[0.18em] text-[10px] border cursor-pointer transition-all duration-300"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      borderColor: 'var(--crimson)',
                      color: 'var(--flame)',
                      background: 'rgba(139,26,26,0.12)',
                      animation: 'turn-pulse 2s ease-in-out infinite',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,26,26,0.24)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(139,26,26,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,26,26,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div className="absolute top-[-1px] left-[-1px] w-2.5 h-2.5 opacity-60" style={{ borderTop: '2px solid var(--crimson)', borderLeft: '2px solid var(--crimson)' }} />
                    <div className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 opacity-60" style={{ borderBottom: '2px solid var(--crimson)', borderRight: '2px solid var(--crimson)' }} />
                    Quick Deploy Fleet
                  </button>

                  <button
                    onClick={() => setShowPlacingPrompt(false)}
                    className="text-[9px] tracking-[0.1em] uppercase py-2 px-6 border cursor-pointer transition-all hover:border-[var(--steel-lo)] hover:text-[var(--t2)]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'var(--ghost)', color: 'var(--t4)', background: 'none' }}
                  >
                    Place Manually Instead
                  </button>
                </div>
              </div>
            )}

            {/* My board */}
            <div className="flex flex-col overflow-hidden" style={{ borderRight: '1px solid var(--ghost)' }}>
              <div className="board-header-wrap py-3 px-[18px] flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--ghost)', background: 'rgba(12,10,18,0.4)' }}>
                <div className="flex items-center gap-2 text-[8px] tracking-[0.2em] uppercase" style={{ color: 'var(--t3)' }}>
                  <div className="w-5 h-5 border flex items-center justify-center text-[9px]" style={{ borderColor: 'var(--ghost)' }}>{'\u25C8'}</div>
                  My Fleet
                </div>
                <div className="text-[8px] tracking-[0.08em] uppercase py-[3px] px-[9px] border" style={{ borderColor: 'rgba(139,26,26,0.5)', color: 'var(--flame)', background: 'rgba(139,26,26,0.08)' }}>
                  Coordinates Encrypted
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-5">
                <GameGrid
                  id="my-board"
                  isEnemy={false}
                  myShips={gameState.myShips}
                  myHits={gameState.myHits}
                  enemyHits={gameState.enemyHits}
                  enemyMisses={gameState.enemyMisses}
                  enemyAttackedCells={gameState.enemyAttackedCells}
                  attackingCell={null}
                  phase={gameState.phase}
                  onCellClick={gameState.phase === 'PLACING' ? (r, c) => { placeShip(r, c); sound.encrypt(); } : undefined}
                  placingShipSize={gameState.phase === 'PLACING' ? gameState.ships[placingShipIndex]?.size : undefined}
                  placingOrientation={placingOrientation}
                />
              </div>
            </div>

            {/* Enemy board */}
            <div className="flex flex-col overflow-hidden">
              <div className="board-header-wrap py-3 px-[18px] flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--ghost)', background: 'rgba(12,10,18,0.4)' }}>
                <div className="flex items-center gap-2 text-[8px] tracking-[0.2em] uppercase" style={{ color: 'var(--t3)' }}>
                  <div className="w-5 h-5 border flex items-center justify-center text-[9px]" style={{ borderColor: 'var(--ghost)' }}>{'\u25CE'}</div>
                  Enemy Waters
                </div>
                <div className="text-[8px] tracking-[0.08em] uppercase py-[3px] px-[9px] border" style={{ borderColor: 'rgba(200,150,12,0.5)', color: 'var(--gold-hi)', background: 'var(--gold-dim)' }}>
                  Click to Attack
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-5">
                <GameGrid
                  id="en-board"
                  isEnemy={true}
                  myShips={gameState.myShips}
                  myHits={gameState.myHits}
                  enemyHits={gameState.enemyHits}
                  enemyMisses={gameState.enemyMisses}
                  enemyAttackedCells={gameState.enemyAttackedCells}
                  attackingCell={attackingCell}
                  phase={gameState.phase}
                  onCellClick={(r, c) => { doAttack(r, c); sound.attackClick(); }}
                  onCellHover={(r, c) => { setTargetCell(`Target: ${COLS[c]}${r + 1}`); sound.hover(); }}
                  onCellLeave={() => setTargetCell(null)}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Right sidebar — FHE Feed */}
        <FHEFeed logs={logs} onClear={clearLogs} lastAttack={lastResolvedAttack} />
      </div>
    </>
  );
}
