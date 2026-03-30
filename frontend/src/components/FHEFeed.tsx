import type { FHELogEntry } from '../lib/gameTypes';
import { useRef, useEffect } from 'react';

interface FHEFeedProps {
  logs: FHELogEntry[];
  onClear: () => void;
  lastAttack?: { row: number; col: number; hit: boolean } | null;
}

const TYPE_CLASSES: Record<string, { border: string; bg: string }> = {
  fhe:  { border: 'var(--crimson)', bg: 'transparent' },
  hit:  { border: 'var(--scarlet)', bg: 'rgba(139,26,26,0.06)' },
  miss: { border: 'transparent', bg: 'transparent' },
  enc:  { border: 'rgba(139,26,26,0.3)', bg: 'transparent' },
  sys:  { border: 'transparent', bg: 'transparent' },
};

const LABEL_COLORS: Record<string, string> = {
  fhe: 'var(--flame)',
  hit: 'var(--scarlet)',
  miss: 'var(--t4)',
  enc: 'rgba(228,64,64,0.6)',
  sys: 'var(--t4)',
};

export default function FHEFeed({ logs, onClear, lastAttack }: FHEFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <aside className="sidebar-right-wrap flex flex-col overflow-hidden" style={{ borderLeft: '1px solid var(--ghost)', background: 'linear-gradient(180deg, var(--deep) 0%, var(--abyss) 100%)' }}>
      {/* Header */}
      <div className="p-3.5 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--ghost)' }}>
        <div className="flex items-center gap-[7px] text-[8px] tracking-[0.18em] uppercase" style={{ color: 'var(--t3)' }}>
          <span className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--crimson)', animation: 'dot-blink 1.2s ease-in-out infinite' }} />
          Intel Feed
        </div>
        <button
          onClick={onClear}
          className="text-[8px] tracking-[0.08em] uppercase py-[3px] px-2 border cursor-pointer transition-all hover:border-[var(--crimson)] hover:text-[var(--flame)]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--t4)', background: 'none', borderColor: 'var(--ghost)' }}
        >
          Clear
        </button>
      </div>

      {/* Log entries */}
      <div ref={feedRef} className="flex-1 overflow-y-auto py-1.5" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {logs.map((log) => {
          const style = TYPE_CLASSES[log.type] || TYPE_CLASSES.sys;
          return (
            <div
              key={log.id}
              className="grid gap-x-1.5 py-[3px] px-3.5 transition-colors hover:bg-white/[0.02]"
              style={{
                gridTemplateColumns: '36px 26px 1fr',
                fontSize: '9.5px',
                lineHeight: '1.7',
                borderLeft: `2px solid ${style.border}`,
                background: style.bg,
                animation: 'log-slide 0.2s ease-out',
              }}
            >
              <span className="text-[8.5px]" style={{ color: 'var(--t4)' }}>{log.timestamp}</span>
              <span className="font-medium text-[9px]" style={{ color: LABEL_COLORS[log.type] || 'var(--t4)' }}>{log.label}</span>
              <span className="font-light" style={{ color: 'var(--t2)' }}>{log.message}</span>
            </div>
          );
        })}
      </div>

      {/* Last attack result */}
      <div className="shrink-0 p-3.5 px-4" style={{ borderTop: '1px solid var(--ghost)' }}>
        {lastAttack ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[7px] tracking-[0.2em] uppercase" style={{ color: 'var(--t3)' }}>
                Last Strike
              </div>
              <div className="py-[2px] px-[6px]" style={{
                background: lastAttack.hit ? 'rgba(212,40,40,0.1)' : 'rgba(60,120,180,0.08)',
                border: lastAttack.hit ? '1px solid rgba(212,40,40,0.3)' : '1px solid rgba(60,120,180,0.2)',
              }}>
                <span className="text-[7px] tracking-[0.15em] uppercase font-medium" style={{
                  color: lastAttack.hit ? 'var(--flame)' : 'rgba(100,160,220,0.7)',
                }}>
                  {lastAttack.hit ? 'Direct Hit' : 'Missed'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="text-[28px] font-bold" style={{
                fontFamily: "'Cinzel', serif",
                color: lastAttack.hit ? 'var(--flame)' : 'var(--t3)',
                textShadow: lastAttack.hit ? '0 0 12px rgba(212,40,40,0.3)' : 'none',
                lineHeight: 1,
              }}>
                {String.fromCharCode(65 + lastAttack.col)}{lastAttack.row + 1}
              </div>
              <div className="flex-1">
                <div className="text-[8px] tracking-[0.05em] mb-1" style={{ color: 'var(--t4)', fontFamily: "'JetBrains Mono', monospace" }}>
                  grid[{lastAttack.row}][{lastAttack.col}]
                </div>
                <div className="text-[8px] tracking-[0.05em]" style={{ color: lastAttack.hit ? 'var(--crimson)' : 'var(--t4)', fontFamily: "'JetBrains Mono', monospace" }}>
                  ebool {'\u2192'} {lastAttack.hit ? 'true' : 'false'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-3">
            <div className="text-[7px] tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--t4)' }}>
              No attacks yet
            </div>
            <div className="text-[9px]" style={{ color: 'var(--t4)' }}>
              Select a target to begin
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
