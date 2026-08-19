import { useCallback, useEffect, useRef, useState } from 'react';
import { canvasToBlob } from '../utils';

/**
 * Smooth canvas preview pipeline:
 * - the interactive canvas is drawn at screen scale, not source scale. A 12MP
 *   photo costs ~10ms a frame to redraw on a desktop and several times that on
 *   a phone, which is what made dragging a slider feel like it fought back.
 * - drawing is coalesced into requestAnimationFrame (so dragging a slider
 *   never queues more than one redraw per frame)
 * - the full-resolution encode for the long-press-saveable <img> is debounced
 *   until the user stops interacting, and laid over the canvas once ready — so
 *   what you look at while at rest is still the full-quality render.
 */

/** Longest edge of the interactive preview canvas, in px. Comfortably above a
 *  phone's physical preview size, far below a modern camera's output. */
const MAX_PREVIEW_EDGE = 1600;

/** Draws the composition at whatever size it is handed. Every editor's
 *  geometry is ratio-based, so the same function serves preview and export. */
export type Paint = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

export interface PaintSource {
  width: number;
  height: number;
}

export function useCanvasPreview(debounceMs = 600) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Kept alongside the URL so a save can hand the file straight to the share
  // sheet: iOS rejects navigator.share if we go away and encode first.
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewFresh, setPreviewFresh] = useState(false);
  const rafRef = useRef(0);
  const timerRef = useRef(0);
  const urlRef = useRef<string | null>(null);
  const latest = useRef<{ source: PaintSource; paint: Paint } | null>(null);

  const releaseUrl = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  /** Renders at source resolution, off-screen. For the long-press image and
   *  for downloads — never on the interactive path. */
  const renderFull = useCallback(() => {
    const job = latest.current;
    if (!job) return null;
    const canvas = document.createElement('canvas');
    canvas.width = job.source.width;
    canvas.height = job.source.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    job.paint(ctx, canvas.width, canvas.height);
    return canvas;
  }, []);

  const scheduleDraw = useCallback(
    (source: PaintSource, paint: Paint) => {
      latest.current = { source, paint };
      setPreviewFresh(false);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const scale = Math.min(1, MAX_PREVIEW_EDGE / Math.max(source.width, source.height));
        const width = Math.max(1, Math.round(source.width * scale));
        const height = Math.max(1, Math.round(source.height * scale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, width, height);
        paint(ctx, width, height);

        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(async () => {
          const full = renderFull();
          if (!full) return;
          const blob = await canvasToBlob(full);
          if (!blob) return;
          releaseUrl();
          urlRef.current = URL.createObjectURL(blob);
          setPreviewUrl(urlRef.current);
          setPreviewBlob(blob);
          setPreviewFresh(true);
        }, debounceMs);
      });
    },
    [debounceMs, renderFull],
  );

  const resetPreview = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearTimeout(timerRef.current);
    releaseUrl();
    latest.current = null;
    setPreviewUrl(null);
    setPreviewBlob(null);
    setPreviewFresh(false);
  }, []);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(timerRef.current);
      releaseUrl();
    },
    [],
  );

  return {
    canvasRef,
    previewUrl,
    previewBlob,
    previewFresh,
    scheduleDraw,
    resetPreview,
    renderFull,
  };
}
