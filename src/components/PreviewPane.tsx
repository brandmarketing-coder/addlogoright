import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import type { Translator } from '../i18n';
import {
  IS_LINE,
  canShareImage,
  canvasToBlob,
  downloadBlob,
  externalBrowserUrl,
  shareImage,
} from '../utils';

/**
 * Live preview = the visible <canvas> (redraws instantly while dragging
 * sliders). Once the user pauses, a full-resolution <img> is laid on top so
 * mobile users can long-press to save.
 */
export function PreviewPane({
  t,
  canvasRef,
  renderFull,
  previewUrl,
  previewBlob,
  previewFresh,
  filename,
  onCancel,
}: {
  t: Translator;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Full-resolution render — the on-screen canvas is downscaled for speed. */
  renderFull: () => HTMLCanvasElement | null;
  previewUrl: string | null;
  /** The settled full-resolution encode, ready to hand to the share sheet. */
  previewBlob: Blob | null;
  previewFresh: boolean;
  filename: string;
  onCancel: () => void;
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);

  const encodeFull = async () => {
    const full = renderFull();
    return full ? canvasToBlob(full) : null;
  };

  const handleSave = async () => {
    // Sharing is the only way a web page can reach the photo library, so it
    // gets first refusal. The already-encoded blob matters: iOS only honours
    // navigator.share while the tap is still live, and encoding a 12MP photo
    // takes far longer than that.
    if (previewBlob) {
      const file = new File([previewBlob], filename, { type: previewBlob.type });
      if (canShareImage(file)) {
        const result = await shareImage(file);
        if (result !== 'unsupported') return;
      }
    }

    // LINE's in-app browser blocks anchor downloads — fall back to a
    // long-press-to-save modal instead.
    if (IS_LINE) {
      setShowSaveModal(true);
      return;
    }

    // Nothing encoded yet (saved mid-edit). Encoding here spends the tap, so
    // a share would be refused on iOS — go straight to the download.
    const blob = previewBlob ?? (await encodeFull());
    if (blob) downloadBlob(blob, filename);
  };

  return (
    <div className="relative">
      <div className="mb-4 sm:mb-6 flex justify-between items-center gap-2">
        <h2 className="text-lg sm:text-xl font-medium text-slate-800">{t('preview')}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-medium text-slate-600 bg-gray-100 rounded-lg active:bg-gray-300 hover:bg-gray-200 transition-colors cursor-pointer touch-manipulation select-none"
          >
            <X className="w-4 h-4" />
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-medium text-white bg-[#84BD00] rounded-lg active:bg-[#699400] hover:bg-[#76A800] transition-colors cursor-pointer touch-manipulation select-none"
          >
            <Download className="w-4 h-4" />
            {t('download')}
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="relative inline-block">
          <canvas ref={canvasRef} className="block max-h-[65vh] w-auto max-w-full" />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity ${previewFresh ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
          )}
        </div>
      </div>

      <p className="sm:hidden mt-3 text-xs text-slate-400 text-center">{t('mobileHint')}</p>

      {/* Long-press save modal (LINE in-app browser fallback) */}
      {showSaveModal && previewUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">{t('saveModalTitle')}</h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-2 -m-1 text-slate-400 active:text-slate-700 hover:text-slate-600 cursor-pointer touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">{t('saveModalHint')}</p>
            <img src={previewUrl} alt="Save" className="w-full max-h-[55vh] object-contain rounded-lg border border-gray-200" />
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={externalBrowserUrl()}
                className="w-full text-center px-4 py-3 text-sm font-medium text-white bg-[#84BD00] rounded-lg active:bg-[#699400] touch-manipulation"
              >
                {t('lineOpenExternal')}
              </a>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="w-full px-4 py-3 text-sm font-medium text-slate-600 bg-gray-100 rounded-lg active:bg-gray-300 touch-manipulation"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
