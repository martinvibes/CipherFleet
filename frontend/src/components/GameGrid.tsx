import { COLS, GRID_SIZE } from '../lib/gameTypes';

interface GameGridProps {
  id: string;
  isEnemy: boolean;
  myShips: Set<string>;
  myHits: Set<string>;
  enemyHits: Set<string>;
  enemyMisses: Set<string>;
  attackingCell: string | null;
  phase: string;
  onCellClick?: (row: number, col: number) => void;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
}

export default function GameGrid({
  isEnemy,
  myShips,
  myHits,
  enemyHits,
  enemyMisses,
  attackingCell,
  phase,
  onCellClick,
  onCellHover,
  onCellLeave,
}: GameGridProps) {
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
      if (myShips.has(key)) return 'ship';
      return '';
    }
  };

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
            const cellClass = getCellClass(r, c);
            const isClickable = isEnemy && cellClass === 'atk';

            return (
              <div
                key={c}
                className={`cell ${cellClass}`}
                onClick={() => isClickable && onCellClick?.(r, c)}
                onMouseEnter={() => isClickable && onCellHover?.(r, c)}
                onMouseLeave={() => isClickable && onCellLeave?.()}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
