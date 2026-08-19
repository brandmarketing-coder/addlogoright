/** True when running inside the LINE in-app browser. */
export const IS_LINE = typeof navigator !== 'undefined' && /\bLine\//i.test(navigator.userAgent);

/**
 * iOS is the only platform whose share sheet carries a built-in "Save Image"
 * action, and so the only one where sharing beats downloading. Android's sheet
 * offers no such thing, and on a desktop it is a system dialog nobody asked
 * for — both are better served by saving the file straight to the device.
 */
export const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS 13+ reports itself as a Mac; no Mac has a touchscreen.
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));

/** Current page URL with LINE's openExternalBrowser flag appended. */
export function externalBrowserUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('openExternalBrowser', '1');
  return url.toString();
}

/**
 * JPEG, not PNG. These are photographs, and the saved file now travels
 * through a share sheet on its way to the camera roll — a 12MP PNG is tens
 * of megabytes to encode and hand over, which phones handle badly.
 */
export const IMAGE_TYPE = 'image/jpeg';
export const IMAGE_QUALITY = 0.95;

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, IMAGE_TYPE, IMAGE_QUALITY));
}

/** Whether this browser can hand an image file to the OS share sheet. */
export function canShareImage(file: File): boolean {
  return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [file] });
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported';

/**
 * Offers the image to the OS share sheet, which is the only route a web page
 * has into the photo library: "Save Image" on iOS, "Save to Photos" or the
 * gallery app on Android. A plain download can only ever reach Files.
 *
 * Must be reached from a user gesture with the blob already in hand — iOS
 * rejects a share that arrives after a long await.
 */
export async function shareImage(file: File): Promise<ShareResult> {
  try {
    await navigator.share({ files: [file] });
    return 'shared';
  } catch (err) {
    // The user backing out of the sheet is a completed action, not a failure
    // to route around.
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    return 'unsupported';
  }
}

/** Saves a blob to the device's downloads. The fallback when sharing is out. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
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
