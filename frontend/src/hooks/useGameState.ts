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

// Generate random ship placement for enemy AI
function generateRandomShips(): { cells: Set<string>; ships: Ship[] } {
  const occupied = new Set<string>();
  const ships: Ship[] = [];

  for (const template of INITIAL_SHIPS) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const horizontal = Math.random() > 0.5;
      const r = Math.floor(Math.random() * (horizontal ? 8 : 8 - template.size));
      const c = Math.floor(Math.random() * (horizontal ? 8 - template.size : 8));

      const shipCells: [number, number][] = [];
      let valid = true;
      for (let i = 0; i < template.size; i++) {
        const cr = horizontal ? r : r + i;
        const cc = horizontal ? c + i : c;
        const key = `${cr},${cc}`;
        if (occupied.has(key)) { valid = false; break; }
        shipCells.push([cr, cc]);
      }

      if (valid) {
        shipCells.forEach(([sr, sc]) => occupied.add(`${sr},${sc}`));
        ships.push({ ...template, cells: shipCells, hits: 0, sunk: false });
        placed = true;
      }
    }
  }

  return { cells: occupied, ships };
}

// Check if a ship was just sunk and return its name
function checkShipSunk(ships: Ship[], allHits: Set<string>): { updated: Ship[]; justSunk: string | null } {
  let justSunk: string | null = null;
  const updated = ships.map(ship => {
    if (ship.sunk) return ship;
    const hits = ship.cells.filter(([r, c]) => allHits.has(`${r},${c}`)).length;
    const nowSunk = hits >= ship.size;
    if (nowSunk && !ship.sunk) justSunk = ship.name;
    return { ...ship, hits, sunk: nowSunk };
  });
  return { updated, justSunk };
}

function countAliveShips(ships: Ship[]): number {
  return ships.filter(s => !s.sunk).length;
}

// Simple AI: random targeting, but if it gets a hit, try adjacent cells
function pickEnemyTarget(_myShips: Set<string>, attacked: Set<string>, myHits: Set<string>): { row: number; col: number } {
  // If there's an unresolved hit (hit but ship not fully sunk), try adjacent cells
  const unresolvedHits = Array.from(myHits).filter(key => {
    const [r, c] = key.split(',').map(Number);
    // Check if any adjacent cell is unattacked
    return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].some(([ar, ac]) =>
      ar >= 0 && ar < 8 && ac >= 0 && ac < 8 && !attacked.has(`${ar},${ac}`)
    );
  });

  if (unresolvedHits.length > 0) {
    const target = unresolvedHits[Math.floor(Math.random() * unresolvedHits.length)];
    const [r, c] = target.split(',').map(Number);
    const adjacent = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
      .filter(([ar, ac]) => ar >= 0 && ar < 8 && ac >= 0 && ac < 8 && !attacked.has(`${ar},${ac}`));
    if (adjacent.length > 0) {
      const [ar, ac] = adjacent[Math.floor(Math.random() * adjacent.length)];
      return { row: ar, col: ac };
    }
  }

  // Random targeting
  let row: number, col: number;
  do {
    row = Math.floor(Math.random() * 8);
    col = Math.floor(Math.random() * 8);
  } while (attacked.has(`${row},${col}`));
  return { row, col };
}

export function useGameState() {
  const startTime = useRef(Date.now());

  const initEnemy = generateRandomShips();

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
    enemyShipCells: initEnemy.cells,
    enemyShipList: initEnemy.ships,
    enemyAttackedCells: new Set<string>(),
  });

  const [logs, setLogs] = useState<FHELogEntry[]>([]);
  const [targetCell, setTargetCell] = useState<string | null>(null);
  const [attackingCell, setAttackingCell] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayResult, setOverlayResult] = useState<{ coord: string; row: number; col: number; hit: boolean } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [showLoss, setShowLoss] = useState(false);
  const [sunkMessage, setSunkMessage] = useState<string | null>(null);
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

    addLog('enc', 'ENC', `${INITIAL_SHIPS[placingShipIndex]?.name} encrypted (${INITIAL_SHIPS[placingShipIndex]?.size} cells)`);

    if (placingShipIndex < INITIAL_SHIPS.length - 1) {
      setPlacingShipIndex(i => i + 1);
    } else {
      addLog('sys', 'SYS', 'All ships encrypted \u2014 fleet deployed');
    }
  }, [placingShipIndex, placingOrientation, addLog]);

  // ── Enemy AI turn ──
  const doEnemyAttack = useCallback(() => {
    setGameState(prev => {
      if (prev.phase !== 'BATTLE') return prev;

      const target = pickEnemyTarget(prev.myShips, prev.enemyAttackedCells, prev.myHits);
      const key = `${target.row},${target.col}`;
      const coord = `${COLS[target.col]}${target.row + 1}`;
      const isHit = prev.myShips.has(key);

      const newAttacked = new Set(prev.enemyAttackedCells);
      newAttacked.add(key);

      const newMyHits = new Set(prev.myHits);
      if (isHit) newMyHits.add(key);

      // Check ship sinking on my fleet
      const { updated: updatedMyShips, justSunk } = checkShipSunk(prev.ships, newMyHits);
      const myAlive = countAliveShips(updatedMyShips);
      const totalMyHits = updatedMyShips.reduce((sum, s) => sum + s.hits, 0);
      const allMySunk = totalMyHits >= 11;

      // Log the enemy attack
      setTimeout(() => {
        if (isHit) {
          addLog('hit', 'HIT', `Enemy hit [${coord}] on your board!`);
          if (justSunk) {
            addLog('hit', 'SUNK', `Your ${justSunk} destroyed!`);
            setSunkMessage(`Your ${justSunk} has been sunk!`);
            setTimeout(() => setSunkMessage(null), 3000);
          }
        } else {
          addLog('miss', 'MISS', `Enemy missed [${coord}]`);
        }
      }, 0);

      if (allMySunk) {
        setTimeout(() => setShowLoss(true), 500);
        return {
          ...prev,
          myHits: newMyHits,
          enemyAttackedCells: newAttacked,
          ships: updatedMyShips,
          myShipsRemaining: 0,
          isMyTurn: true,
          phase: 'FINISHED' as Phase,
        };
      }

      return {
        ...prev,
        myHits: newMyHits,
        enemyAttackedCells: newAttacked,
        ships: updatedMyShips,
        myShipsRemaining: myAlive,
        isMyTurn: true,
      };
    });
  }, [addLog]);

  // ── Player attack ──
  const doAttack = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    if (gameState.enemyHits.has(key) || gameState.enemyMisses.has(key)) return;
    if (gameState.phase !== 'BATTLE' || !gameState.isMyTurn) return;

    const coord = `${COLS[col]}${row + 1}`;
    setAttackingCell(key);
    setShowOverlay(true);

    // Disable further attacks
    setGameState(prev => ({ ...prev, isMyTurn: false }));

    addLog('fhe', 'FHE', `FHE.eq(grid[${row}][${col}], euint8(1)) \u2192 computing...`);

    // Check against actual enemy ship positions
    const isHit = gameState.enemyShipCells.has(key);

    // Phase 1: computing animation
    setTimeout(() => {
      setOverlayResult({ coord, row, col, hit: isHit });
    }, 1900);

    // Phase 2: resolve
    setTimeout(() => {
      setGameState(prev => {
        const newEnemyHits = new Set(prev.enemyHits);
        const newEnemyMisses = new Set(prev.enemyMisses);

        if (isHit) {
          newEnemyHits.add(key);
        } else {
          newEnemyMisses.add(key);
        }

        // Check enemy ship sinking
        const { updated: updatedEnemyShips, justSunk } = checkShipSunk(prev.enemyShipList, newEnemyHits);
        const enemyAlive = countAliveShips(updatedEnemyShips);
        const totalEnemyHits = updatedEnemyShips.reduce((sum, s) => sum + s.hits, 0);
        const allEnemySunk = totalEnemyHits >= 11;

        if (isHit) {
          addLog('hit', 'HIT', `You hit [${coord}]!`);
          if (justSunk) {
            addLog('hit', 'SUNK', `Enemy ${justSunk} destroyed!`);
            setSunkMessage(`Enemy ${justSunk} sunk!`);
            setTimeout(() => setSunkMessage(null), 3000);
          }
        } else {
          addLog('miss', 'MISS', `You missed [${coord}]`);
        }

        if (allEnemySunk) {
          return {
            ...prev,
            enemyHits: newEnemyHits,
            enemyMisses: newEnemyMisses,
            enemyShipList: updatedEnemyShips,
            attackCount: prev.attackCount + 1,
            hitCount: prev.hitCount + (isHit ? 1 : 0),
            enemyShipsRemaining: 0,
            phase: 'FINISHED' as Phase,
            isMyTurn: false,
          };
        }

        return {
          ...prev,
          enemyHits: newEnemyHits,
          enemyMisses: newEnemyMisses,
          enemyShipList: updatedEnemyShips,
          attackCount: prev.attackCount + 1,
          hitCount: prev.hitCount + (isHit ? 1 : 0),
          enemyShipsRemaining: enemyAlive,
          isMyTurn: false,
        };
      });

      setAttackingCell(null);

      // Close overlay, then check win or do enemy turn
      const allSunk = isHit && gameState.enemyShipCells.size > 0 &&
        (() => {
          const testHits = new Set(gameState.enemyHits);
          testHits.add(key);
          return checkShipSunk(gameState.enemyShipList, testHits).updated.reduce((sum, s) => sum + s.hits, 0) >= 11;
        })();

      setTimeout(() => {
        setShowOverlay(false);
        setOverlayResult(null);

        if (allSunk) {
          setTimeout(() => setShowWin(true), 300);
        } else {
          // Enemy turn — wait for turn banner to show and breathe
          setTimeout(() => {
            addLog('sys', 'SYS', 'Enemy turn...');
            setTimeout(() => doEnemyAttack(), 2200);
          }, 400);
        }
      }, 1700);
    }, 2500);
  }, [gameState, addLog, doEnemyAttack]);

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

    const enemy = generateRandomShips();

    setGameState(prev => ({
      ...prev,
      phase: 'BATTLE' as Phase,
      myShips: shipCells,
      ships: presetShips,
      enemyShipCells: enemy.cells,
      enemyShipList: enemy.ships,
      isMyTurn: true,
    }));
    setPlacingShipIndex(INITIAL_SHIPS.length);

    addLog('enc', 'ENC', 'All ships encrypted (11 cells)');
    addLog('sys', 'SYS', 'Your fleet deployed \u2014 ready for battle');
  }, [addLog]);

  const resetGame = useCallback(() => {
    startTime.current = Date.now();
    const enemy = generateRandomShips();
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
      enemyShipCells: enemy.cells,
      enemyShipList: enemy.ships,
      enemyAttackedCells: new Set<string>(),
    });
    setPlacingShipIndex(0);
    setLogs([]);
    setShowWin(false);
    setShowLoss(false);
    setSunkMessage(null);
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
  };
}
