import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Smooth canvas preview pipeline:
 * - drawing is coalesced into requestAnimationFrame (so dragging a slider
 *   never queues more than one redraw per frame)
 * - the PNG encoding for the long-press-saveable <img> is debounced until
 *   the user stops interacting (toDataURL/toBlob on every input event is
 *   what caused the slider jank)
 */
export function useCanvasPreview(debounceMs = 300) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFresh, setPreviewFresh] = useState(false);
  const rafRef = useRef(0);
  const timerRef = useRef(0);
  const urlRef = useRef<string | null>(null);

  const releaseUrl = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  const scheduleDraw = useCallback(
    (draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void) => {
      setPreviewFresh(false);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        draw(canvas, ctx);

        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          canvas.toBlob((blob) => {
            if (!blob) return;
            releaseUrl();
            urlRef.current = URL.createObjectURL(blob);
            setPreviewUrl(urlRef.current);
            setPreviewFresh(true);
          }, 'image/png');
        }, debounceMs);
      });
    },
    [debounceMs],
  );

  const resetPreview = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearTimeout(timerRef.current);
    releaseUrl();
    setPreviewUrl(null);
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

  return { canvasRef, previewUrl, previewFresh, scheduleDraw, resetPreview };
}
