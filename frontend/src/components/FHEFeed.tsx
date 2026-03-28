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
    <aside className="flex flex-col overflow-hidden" style={{ borderLeft: '1px solid var(--ghost)', background: 'linear-gradient(180deg, var(--deep) 0%, var(--abyss) 100%)' }}>
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

      {/* FHE Operation Display */}
      <div className="shrink-0 p-3.5 px-4" style={{ borderTop: '1px solid var(--ghost)' }}>
        <div className="text-[7px] tracking-[0.2em] uppercase mb-2.5" style={{ color: 'var(--t3)' }}>
          Last Operation {'\u2014'} FHE.eq()
        </div>
        <div className="p-2.5 px-3 mb-3" style={{ background: 'var(--abyss)', border: '1px solid var(--ghost)', borderLeft: '2px solid var(--crimson)' }}>
          {lastAttack ? (
            <>
              <CodeLine><span className="font-medium" style={{ color: 'var(--flame)' }}>FHE</span>.eq(</CodeLine>
              <CodeLine>&nbsp;&nbsp;grid[<span style={{ color: '#a8c8e8' }}>{lastAttack.row}</span>][<span style={{ color: '#a8c8e8' }}>{lastAttack.col}</span>], <span className="text-[8.5px]" style={{ color: 'var(--t4)' }}>// euint8</span></CodeLine>
              <CodeLine>&nbsp;&nbsp;<span className="font-medium" style={{ color: 'var(--flame)' }}>euint8</span>(<span style={{ color: '#a8c8e8' }}>1</span>)</CodeLine>
              <CodeLine>) {'\u2192'} <span className="font-semibold" style={{ color: lastAttack.hit ? 'var(--scarlet)' : 'var(--steel-lo)' }}>ebool({lastAttack.hit ? 'true' : 'false'})</span></CodeLine>
            </>
          ) : (
            <CodeLine style={{ color: 'var(--t4)' }}>Awaiting operation...</CodeLine>
          )}
        </div>

        {/* Pipeline */}
        <div className="flex flex-col gap-[3px]">
          {['Client encrypt', 'Tx on Arbitrum', 'CoFHE FHE.eq()', 'Threshold 5/5', lastAttack ? `Result: ${lastAttack.hit ? 'true' : 'false'}` : 'Awaiting...'].map((step, i) => {
            const done = lastAttack != null;
            return (
              <div key={i}>
                <div className="flex items-center gap-[7px] text-[9px] tracking-[0.03em] transition-colors" style={{ color: done ? 'var(--safe-hi)' : 'var(--t4)' }}>
                  <div
                    className="w-[13px] h-[13px] rounded-full border flex items-center justify-center text-[7px] shrink-0"
                    style={done ? { background: 'var(--safe-hi)', color: 'var(--abyss)', borderColor: 'var(--safe-hi)' } : { borderColor: 'currentColor' }}
                  >
                    {done ? '\u2713' : ''}
                  </div>
                  {step}
                </div>
                {i < 4 && <div className="w-px h-1 ml-[5px]" style={{ background: 'var(--ghost)' }} />}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function CodeLine({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="text-[9.5px] leading-[2] font-light" style={{ color: 'var(--t2)', ...style }}>
      {children}
    </div>
  );
}
