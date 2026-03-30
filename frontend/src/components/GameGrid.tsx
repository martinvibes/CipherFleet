import { useState } from 'react';
import { COLS, GRID_SIZE } from '../lib/gameTypes';

interface GameGridProps {
  id: string;
  isEnemy: boolean;
  myShips: Set<string>;
  myHits: Set<string>;
  enemyHits: Set<string>;
  enemyMisses: Set<string>;
  enemyAttackedCells: Set<string>;
  attackingCell: string | null;
  phase: string;
  onCellClick?: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  // Ship placement props
  placingShipSize?: number;
  placingOrientation?: 'H' | 'V';
}

export default function GameGrid({
  isEnemy,
  myShips,
  myHits,
  enemyHits,
  enemyMisses,
  enemyAttackedCells,
  attackingCell,
  phase,
  onCellClick,
  onCellHover,
  onCellLeave,
  placingShipSize,
  placingOrientation,
}: GameGridProps) {
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  // Calculate preview cells for ship placement
  const getPlacementPreview = (): { cells: Set<string>; valid: boolean } => {
    if (!hoverCell || phase !== 'PLACING' || !placingShipSize || isEnemy) {
      return { cells: new Set(), valid: false };
    }
    const cells = new Set<string>();
    let valid = true;
    for (let i = 0; i < placingShipSize; i++) {
      const r = placingOrientation === 'H' ? hoverCell.r : hoverCell.r + i;
      const c = placingOrientation === 'H' ? hoverCell.c + i : hoverCell.c;
      if (r >= 8 || c >= 8) { valid = false; break; }
      const key = `${r},${c}`;
      if (myShips.has(key)) { valid = false; }
      cells.add(key);
    }
    if (cells.size < placingShipSize) valid = false;
    return { cells, valid };
  };

  const preview = getPlacementPreview();

  const getCellClass = (row: number, col: number): string => {
    const key = `${row},${col}`;

    if (isEnemy) {
      if (enemyHits.has(key)) return 'hit';
      if (enemyMisses.has(key)) return 'miss';
      if (attackingCell === key) return 'targeting';
      if (phase === 'BATTLE') return 'atk';
      return '';
    } else {
      if (myHits.has(key)) return 'my-hit';
      if (enemyAttackedCells.has(key) && !myShips.has(key)) return 'miss';
      if (myShips.has(key)) return 'ship';
      return '';
    }
  };

  const isPlacing = phase === 'PLACING' && !isEnemy && placingShipSize;

  return (
    <div className="flex flex-col w-full max-w-[320px]">
      {/* Column headers */}
      <div className="grid gap-0 mb-px" style={{ gridTemplateColumns: '20px repeat(8, 1fr)' }}>
        <div className="flex items-center justify-center text-[8px] tracking-[0.03em]" style={{ color: 'var(--t4)', fontFamily: "'JetBrains Mono', monospace" }} />
        {Array.from({ length: GRID_SIZE }, (_, c) => (
          <div key={c} className="flex items-center justify-center text-[8px] tracking-[0.03em]" style={{ color: 'var(--t4)', fontFamily: "'JetBrains Mono', monospace" }}>
            {COLS[c]}
          </div>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: GRID_SIZE }, (_, r) => (
        <div key={r} className="grid gap-0 mb-px" style={{ gridTemplateColumns: '20px repeat(8, 1fr)' }}>
          <div className="flex items-center justify-center text-[8px] tracking-[0.03em]" style={{ color: 'var(--t4)', fontFamily: "'JetBrains Mono', monospace" }}>
            {r + 1}
          </div>
          {Array.from({ length: GRID_SIZE }, (_, c) => {
            const key = `${r},${c}`;
            const cellClass = getCellClass(r, c);
            const isClickable = isEnemy ? cellClass === 'atk' : !!isPlacing;
            const isPreview = preview.cells.has(key);

            return (
              <div
                key={c}
                className={`cell ${cellClass}`}
                style={isPreview ? {
                  background: preview.valid
                    ? 'rgba(139,26,26,0.25)'
                    : 'rgba(255,50,50,0.15)',
                  borderColor: preview.valid
                    ? 'rgba(184,32,32,0.5)'
                    : 'rgba(255,50,50,0.4)',
                  boxShadow: preview.valid
                    ? 'inset 0 0 10px rgba(139,26,26,0.3), 0 0 6px rgba(139,26,26,0.2)'
                    : 'inset 0 0 8px rgba(255,50,50,0.2)',
                  cursor: preview.valid ? 'pointer' : 'not-allowed',
                  zIndex: 2,
                } : isPlacing && !myShips.has(key) ? { cursor: 'pointer' } : {}}
                onClick={() => {
                  if (isPlacing && preview.valid && isPreview) {
                    onCellClick?.(hoverCell!.r, hoverCell!.c);
                  } else if (isClickable && !isPlacing) {
                    onCellClick?.(r, c);
                  }
                }}
                onMouseEnter={() => {
                  if (isPlacing) {
                    setHoverCell({ r, c });
                  } else if (isClickable) {
                    onCellHover?.(r, c);
                  }
                }}
                onMouseLeave={() => {
                  if (isPlacing) {
                    setHoverCell(null);
                  } else if (isClickable) {
                    onCellLeave?.();
                  }
                }}
              >
                {/* Ship placement preview icon */}
                {isPreview && !myShips.has(key) && (
                  <span style={{
                    fontSize: '10px',
                    color: preview.valid ? 'rgba(184,32,32,0.7)' : 'rgba(255,50,50,0.5)',
                    position: 'absolute',
                  }}>
                    {preview.valid ? '\u25C8' : '\u2715'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
