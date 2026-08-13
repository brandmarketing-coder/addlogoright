import React, { useRef } from 'react';

/**
 * Range input that a scroll cannot move.
 *
 * Two earlier attempts were not enough. `touch-action: pan-y` only decides
 * whether the browser may scroll -- a native range still commits a value on
 * pointerdown, so the handle had already moved before the browser judged the
 * gesture. Preventing the native drag helped, but a finger starting a scroll
 * usually drifts sideways a little first, and any threshold that only watches
 * horizontal travel latches onto that drift and eats the whole scroll.
 *
 * So on touch devices the input is taken out of the event path entirely
 * (`pointer-events: none`, see index.css) and this wrapper drives it. Nothing
 * is preventDefault-ed, so scrolling is never at risk, and a value only moves
 * once the finger has travelled decisively sideways.
 */

/** Sideways travel, in px, before a touch may count as scrubbing. */
const H_THRESHOLD = 10;
/** ...and it must be this much more horizontal than vertical. Generous,
 *  because a scroll that opens with a sideways flick is common and a
 *  scrub that needs a slightly straighter drag costs the user nothing. */
const H_DOMINANCE = 3;
/** Downward travel that settles it as a scroll, for good. */
const V_ESCAPE = 10;

interface DragState {
  x: number;
  y: number;
  startValue: number;
  scrubbing: boolean;
  /** Set once we have decided this gesture is a scroll and stepped aside. */
  released: boolean;
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
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);

  const snap = (raw: number) => {
    const stepped = min + Math.round((raw - min) / step) * step;
    // toFixed sheds the float noise a 0.05 step accumulates (0.30000000000000004).
    return Math.min(max, Math.max(min, Number(stepped.toFixed(6))));
  };

  /** Capture keeps moves coming to us mid-scrub; a pointer the browser has
   *  already taken back throws, and that is not worth crashing on. */
  const capture = (action: 'set' | 'release', pointerId: number) => {
    const el = trackRef.current;
    if (!el) return;
    try {
      if (action === 'set') el.setPointerCapture(pointerId);
      else el.releasePointerCapture(pointerId);
    } catch {
      /* pointer already gone */
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return; // mouse and pen use the native input
    drag.current = { x: e.clientX, y: e.clientY, startValue: value, scrubbing: false, released: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.released) return;

    const dx = e.clientX - state.x;
    const dy = e.clientY - state.y;

    if (!state.scrubbing) {
      // A scroll gets the benefit of the doubt: any real vertical travel ends
      // our claim on this gesture permanently, however far sideways it drifts.
      if (Math.abs(dy) > V_ESCAPE) {
        state.released = true;
        return;
      }
      if (Math.abs(dx) < H_THRESHOLD || Math.abs(dx) < Math.abs(dy) * H_DOMINANCE) return;
      state.scrubbing = true;
      capture('set', e.pointerId);
    }

    // Relative to where the finger landed, so grabbing the handle does not
    // teleport the value to the touch point.
    const width = trackRef.current?.getBoundingClientRect().width ?? 0;
    if (!width) return;
    const next = snap(state.startValue + (dx / width) * (max - min));
    if (next !== value) onChange(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.scrubbing) capture('release', e.pointerId);
    drag.current = null;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      {/* This is the touch target, not the input — see .slider-track in
          index.css. Padding widens it without moving the track visually. */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="slider-track py-2 -my-2"
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-[#84BD00]"
        />
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
