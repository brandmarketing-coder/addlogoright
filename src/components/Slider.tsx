import React, { useRef } from 'react';

/**
 * Range input that refuses to be scrubbed by a scroll.
 *
 * `touch-action: pan-y` on its own was not enough: a native range commits a
 * value on pointerdown, so a scroll that happened to start on the track had
 * already moved the handle before the browser decided the gesture was a pan.
 *
 * For touch we suppress the native drag entirely and set the value ourselves,
 * and only once the finger has clearly travelled sideways. A finger that moves
 * down first is a scroll and we let go of it for good. Mouse, pen and keyboard
 * keep the native behaviour.
 */

/** Sideways travel, in px, before a touch counts as scrubbing. */
const H_THRESHOLD = 8;

interface DragState {
  x: number;
  y: number;
  scrubbing: boolean;
}

export function Slider({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: React.ReactNode;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const drag = useRef<DragState | null>(null);

  const valueAt = (clientX: number) => {
    const el = inputRef.current;
    if (!el) return value;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const stepped = min + Math.round((ratio * (max - min)) / step) * step;
    // toFixed sheds the float noise a 0.05 step accumulates (0.30000000000000004).
    return Math.min(max, Math.max(min, Number(stepped.toFixed(6))));
  };

  /** Capture keeps moves coming to us once scrubbing starts; a pointer the
   *  browser has already taken back throws, and that is not worth crashing on. */
  const capture = (action: 'set' | 'release', pointerId: number) => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if (action === 'set') el.setPointerCapture(pointerId);
      else el.releasePointerCapture(pointerId);
    } catch {
      /* pointer already gone */
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    if (e.pointerType !== 'touch') return;
    // Skips the browser's own drag handling, so nothing moves on touchdown.
    e.preventDefault();
    drag.current = { x: e.clientX, y: e.clientY, scrubbing: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLInputElement>) => {
    const state = drag.current;
    if (!state) return;

    if (!state.scrubbing) {
      const dx = Math.abs(e.clientX - state.x);
      const dy = Math.abs(e.clientY - state.y);
      if (dy > dx) {
        drag.current = null; // a scroll — stay out of its way
        return;
      }
      if (dx < H_THRESHOLD) return; // too early to tell
      state.scrubbing = true;
      capture('set', e.pointerId);
    }

    const next = valueAt(e.clientX);
    if (next !== value) onChange(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLInputElement>) => {
    if (drag.current?.scrubbing) capture('release', e.pointerId);
    drag.current = null;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      <input
        ref={inputRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="w-full accent-[#84BD00]"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
