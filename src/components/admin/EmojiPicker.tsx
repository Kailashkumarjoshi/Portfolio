'use client';

import { useEffect, useRef, useState } from 'react';
import { REACTION_GROUPS } from '@/lib/reactions';
import { cn } from '@/lib/utils';

/**
 * How one of them felt. A small, curated set of feelings rather than a full
 * keyboard — choosing should take a second, not a scroll.
 */
export function EmojiPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <span className="label">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`Choose ${label}`}
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-champagne/25 bg-midnight-700/70 text-2xl transition-colors hover:border-champagne/50"
        >
          {value ?? <span className="text-base text-mauve-400">＋</span>}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="font-sans text-xs text-mauve-300 underline underline-offset-4 transition-colors hover:text-cream"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={`${label} options`}
          className="frost absolute left-0 top-full z-20 mt-2 w-[min(21rem,calc(100vw-3rem))] rounded-2xl p-3"
        >
          {REACTION_GROUPS.map((group) => (
            <div key={group.label} className="mb-3 last:mb-0">
              <p className="mb-1.5 font-sans text-[0.6rem] uppercase tracking-[0.18em] text-mauve-400">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.emoji.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onChange(emoji);
                      setOpen(false);
                    }}
                    aria-label={emoji}
                    aria-pressed={value === emoji}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-lg text-xl transition-colors',
                      value === emoji ? 'bg-champagne/25' : 'hover:bg-champagne/12',
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
