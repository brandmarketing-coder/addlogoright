/** True when running inside the LINE in-app browser. */
export const IS_LINE = typeof navigator !== 'undefined' && /\bLine\//i.test(navigator.userAgent);

/** Current page URL with LINE's openExternalBrowser flag appended. */
export function externalBrowserUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('openExternalBrowser', '1');
  return url.toString();
}

/**
 * Download a canvas as a PNG via Blob + object URL.
 * (Blob URLs are more reliable than data: URLs for large images.)
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve(true);
    }, 'image/png');
  });
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Bounding box of the non-transparent pixels in an image.
 * Lets us place logo artwork by its visible edges, ignoring any
 * transparent padding baked into the file.
 */
export function getOpaqueBounds(img: HTMLImageElement): Bounds {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
  for (let y = 0; y < canvas.height; y++) {
    const row = y * canvas.width;
    for (let x = 0; x < canvas.width; x++) {
      if (data[(row + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: img.width, h: img.height };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
