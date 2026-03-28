import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import SidebarLeft from './components/SidebarLeft';
import GameGrid from './components/GameGrid';
import FHEFeed from './components/FHEFeed';
import AttackOverlay from './components/AttackOverlay';
import WinScreen from './components/WinScreen';
import { useGameState } from './hooks/useGameState';
import { COLS } from './lib/gameTypes';

export default function App() {
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

  // Heartbeat logs
  useEffect(() => {
    const interval = setInterval(() => {
      const msgs: [string, string, string][] = [
        ['sys', 'NET', 'CoFHE 5/5 nodes healthy'],
        ['sys', 'NET', `Block ${(18420000 + Math.floor(Math.random() * 400)).toLocaleString()} confirmed`],
        ['enc', 'ENC', 'Threshold key sync complete'],
      ];
      const m = msgs[Math.floor(Math.random() * msgs.length)];
      addLog(m[0] as 'sys' | 'enc', m[1], m[2]);
    }, 10000);
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

  return (
    <>
      <AttackOverlay show={showOverlay} attackCoord={attackCoord} result={overlayResult} />
      <WinScreen show={showWin} onPlayAgain={resetGame} onClose={() => setShowWin(false)} />

      <Navbar
        myShips={gameState.myShipsRemaining}
        enemyShips={gameState.enemyShipsRemaining}
        attackCount={gameState.attackCount}
        hitCount={gameState.hitCount}
        isMyTurn={gameState.isMyTurn}
        phase={gameState.phase}
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
          onQuickDeploy={quickDeploy}
        />

        {/* Arena center */}
        <main className="flex flex-col overflow-hidden">
          {/* Arena header */}
          <div className="flex items-center justify-between py-3.5 px-8" style={{ borderBottom: '1px solid var(--ghost)', background: 'rgba(12,10,18,0.6)' }}>
            <div className="text-[9px] tracking-[0.1em]" style={{ color: 'var(--t3)' }}>
              Game <strong style={{ color: 'var(--t2)' }}>#{gameState.gameId}</strong> &middot; vs <strong style={{ color: 'var(--t2)' }}>0x9e1d...a4f2</strong>
            </div>
            <div
              className="text-[13px] tracking-[0.15em] uppercase min-w-[180px] text-center transition-colors"
              style={{ fontFamily: "'Cinzel', serif", color: targetCell ? 'var(--gold-hi)' : 'var(--t3)' }}
            >
              {targetCell || (gameState.phase === 'PLACING' ? 'Place Your Ships' : 'Select Target')}
            </div>
            <div />
          </div>

          {/* Battle zone — two boards */}
          <div className="battle-zone flex-1 grid grid-cols-2 overflow-hidden">
            {/* My board */}
            <div className="flex flex-col overflow-hidden" style={{ borderRight: '1px solid var(--ghost)' }}>
              <div className="py-3 px-[18px] flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--ghost)', background: 'rgba(12,10,18,0.4)' }}>
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
                  attackingCell={null}
                  phase={gameState.phase}
                  onCellClick={gameState.phase === 'PLACING' ? (r, c) => placeShip(r, c) : undefined}
                />
              </div>
            </div>

            {/* Enemy board */}
            <div className="flex flex-col overflow-hidden">
              <div className="py-3 px-[18px] flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--ghost)', background: 'rgba(12,10,18,0.4)' }}>
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
                  attackingCell={attackingCell}
                  phase={gameState.phase}
                  onCellClick={(r, c) => doAttack(r, c)}
                  onCellHover={(r, c) => setTargetCell(`Target: ${COLS[c]}${r + 1}`)}
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
