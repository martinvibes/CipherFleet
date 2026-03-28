import { useState, useCallback, useRef } from 'react';
import type { GameState, Phase, Ship, FHELogEntry } from '../lib/gameTypes';
import { COLS } from '../lib/gameTypes';

const INITIAL_SHIPS: Ship[] = [
  { name: 'Carrier', size: 4, cells: [], hits: 0, sunk: false },
  { name: 'Destroyer', size: 3, cells: [], hits: 0, sunk: false },
  { name: 'Submarine', size: 2, cells: [], hits: 0, sunk: false },
  { name: 'Patrol Boat', size: 2, cells: [], hits: 0, sunk: false },
];

function generateGameId(): string {
  return '0x' + Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

export function useGameState() {
  const startTime = useRef(Date.now());
  const [gameState, setGameState] = useState<GameState>({
    gameId: generateGameId(),
    phase: 'PLACING',
    myShips: new Set<string>(),
    myHits: new Set<string>(),
    enemyHits: new Set<string>(),
    enemyMisses: new Set<string>(),
    myShipsRemaining: 4,
    enemyShipsRemaining: 4,
    attackCount: 0,
    hitCount: 0,
    isMyTurn: true,
    ships: INITIAL_SHIPS.map(s => ({ ...s, cells: [] })),
  });

  const [logs, setLogs] = useState<FHELogEntry[]>([]);
  const [targetCell, setTargetCell] = useState<string | null>(null);
  const [attackingCell, setAttackingCell] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayResult, setOverlayResult] = useState<{ coord: string; row: number; col: number; hit: boolean } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [placingShipIndex, setPlacingShipIndex] = useState(0);
  const [placingOrientation, setPlacingOrientation] = useState<'H' | 'V'>('H');

  const ts = useCallback(() => {
    const s = Math.floor((Date.now() - startTime.current) / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, []);

  const addLog = useCallback((type: FHELogEntry['type'], label: string, message: string) => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      label,
      message,
      timestamp: ts(),
    }]);
  }, [ts]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('sys', 'SYS', 'Feed cleared');
  }, [addLog]);

  const placeShip = useCallback((startRow: number, startCol: number) => {
    setGameState(prev => {
      if (prev.phase !== 'PLACING') return prev;
      const ship = prev.ships[placingShipIndex];
      if (!ship) return prev;

      const cells: [number, number][] = [];
      for (let i = 0; i < ship.size; i++) {
        const r = placingOrientation === 'H' ? startRow : startRow + i;
        const c = placingOrientation === 'H' ? startCol + i : startCol;
        if (r >= 8 || c >= 8) return prev;
        const key = `${r},${c}`;
        if (prev.myShips.has(key)) return prev;
        cells.push([r, c]);
      }

      const newShips = new Set(prev.myShips);
      cells.forEach(([r, c]) => newShips.add(`${r},${c}`));

      const updatedShips = [...prev.ships];
      updatedShips[placingShipIndex] = { ...ship, cells };

      const allPlaced = placingShipIndex >= INITIAL_SHIPS.length - 1;

      return {
        ...prev,
        myShips: newShips,
        ships: updatedShips,
        phase: allPlaced ? 'BATTLE' : 'PLACING',
      };
    });

    addLog('enc', 'ENC', `FHE.asEuint8(1) × ${INITIAL_SHIPS[placingShipIndex]?.size || 0} cells`);
    addLog('enc', 'ENC', 'FHE.allowThis() × handles');
    addLog('sys', 'SYS', `${INITIAL_SHIPS[placingShipIndex]?.name} encrypted on-chain`);

    if (placingShipIndex < INITIAL_SHIPS.length - 1) {
      setPlacingShipIndex(i => i + 1);
    } else {
      addLog('sys', 'SYS', 'Fleet committed on-chain');
    }
  }, [placingShipIndex, placingOrientation, addLog]);

  const doAttack = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    if (gameState.enemyHits.has(key) || gameState.enemyMisses.has(key)) return;
    if (gameState.phase !== 'BATTLE' || !gameState.isMyTurn) return;

    const coord = `${COLS[col]}${row + 1}`;
    setAttackingCell(key);
    setShowOverlay(true);

    addLog('fhe', 'FHE', `FHE.eq(grid[${row}][${col}], euint8(1))`);
    addLog('sys', 'NET', `Threshold ${3 + Math.floor(Math.random() * 2)}/5 nodes`);

    const isHit = Math.random() > 0.58;

    // Phase 1: show overlay with computing state (no result yet)
    // Phase 2: after delay, reveal result
    setTimeout(() => {
      setOverlayResult({ coord, row, col, hit: isHit });
    }, 1900);

    setTimeout(() => {
      setGameState(prev => {
        const newEnemyHits = new Set(prev.enemyHits);
        const newEnemyMisses = new Set(prev.enemyMisses);
        let newEnemyShips = prev.enemyShipsRemaining;

        if (isHit) {
          newEnemyHits.add(key);
        } else {
          newEnemyMisses.add(key);
        }

        if (isHit && newEnemyHits.size >= 11) {
          return {
            ...prev,
            enemyHits: newEnemyHits,
            enemyMisses: newEnemyMisses,
            attackCount: prev.attackCount + 1,
            hitCount: prev.hitCount + (isHit ? 1 : 0),
            enemyShipsRemaining: 0,
            phase: 'FINISHED' as Phase,
          };
        }

        return {
          ...prev,
          enemyHits: newEnemyHits,
          enemyMisses: newEnemyMisses,
          attackCount: prev.attackCount + 1,
          hitCount: prev.hitCount + (isHit ? 1 : 0),
          enemyShipsRemaining: newEnemyShips,
        };
      });

      if (isHit) {
        addLog('hit', 'HIT', `ebool \u2192 true \u00B7 Hit [${coord}]`);
        addLog('sys', 'SYS', 'Coordinates still encrypted \u2713');
      } else {
        addLog('miss', 'DEC', `ebool \u2192 false \u00B7 Miss [${coord}]`);
      }

      setAttackingCell(null);

      setTimeout(() => {
        setShowOverlay(false);
        setOverlayResult(null);
        if (isHit && gameState.enemyHits.size + 1 >= 11) {
          setShowWin(true);
        }
      }, 1700);
    }, 2500);
  }, [gameState, addLog]);

  // Auto-place ships and jump to battle (for demo)
  const quickDeploy = useCallback(() => {
    const presetShips: Ship[] = [
      { name: 'Carrier', size: 4, cells: [[2, 3], [2, 4], [2, 5], [2, 6]], hits: 0, sunk: false },
      { name: 'Destroyer', size: 3, cells: [[5, 1], [5, 2], [5, 3]], hits: 0, sunk: false },
      { name: 'Submarine', size: 2, cells: [[0, 7], [1, 7]], hits: 0, sunk: false },
      { name: 'Patrol Boat', size: 2, cells: [[7, 5], [7, 6]], hits: 0, sunk: false },
    ];
    const shipCells = new Set<string>();
    presetShips.forEach(s => s.cells.forEach(([r, c]) => shipCells.add(`${r},${c}`)));

    setGameState(prev => ({
      ...prev,
      phase: 'BATTLE' as Phase,
      myShips: shipCells,
      ships: presetShips,
    }));
    setPlacingShipIndex(INITIAL_SHIPS.length);

    addLog('enc', 'ENC', 'FHE.asEuint8(1) \u00D7 11 cells');
    addLog('enc', 'ENC', 'FHE.allowThis() \u00D7 11 handles');
    addLog('sys', 'SYS', 'Fleet committed on-chain');
    addLog('sys', 'SYS', 'Quick deploy \u2014 all ships encrypted');
  }, [addLog]);

  const resetGame = useCallback(() => {
    startTime.current = Date.now();
    setGameState({
      gameId: generateGameId(),
      phase: 'PLACING',
      myShips: new Set<string>(),
      myHits: new Set<string>(),
      enemyHits: new Set<string>(),
      enemyMisses: new Set<string>(),
      myShipsRemaining: 4,
      enemyShipsRemaining: 4,
      attackCount: 0,
      hitCount: 0,
      isMyTurn: true,
      ships: INITIAL_SHIPS.map(s => ({ ...s, cells: [] })),
    });
    setPlacingShipIndex(0);
    setLogs([]);
    setShowWin(false);
    addLog('sys', 'SYS', 'Game reset \u2014 new encrypted grid');
  }, [addLog]);

  return {
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
  };
}
