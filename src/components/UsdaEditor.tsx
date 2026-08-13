import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { Translator, TKey } from '../i18n';
import { getOpaqueBounds, type Bounds } from '../utils';
import { useCanvasPreview } from '../hooks/useCanvasPreview';
import { UploadZone } from './UploadZone';
import { Slider } from './Slider';
import { PreviewPane } from './PreviewPane';
import { EditorLayout } from './EditorLayout';

type SealPosition = 'tl' | 'tr' | 'bl' | 'br';
type SealColor = 'white' | 'gray';

interface UsdaSettings {
  color: SealColor;    // which official seal artwork to use
  sizeRatio: number;   // visible seal width as a fraction of the image's short side
  position: SealPosition;
  offsetX: number;     // manual nudge, fraction of the short side
  offsetY: number;
}

// Official USDA Certified Biobased Product seals (white / gray variants)
const SEAL_SRC: Record<SealColor, string> = {
  white: '/usda-white.png',
  gray: '/usda-gray.png',
};

const COLORS: { key: TKey; value: SealColor; swatch: string }[] = [
  { key: 'colorWhite', value: 'white', swatch: 'bg-white border-gray-300' },
  { key: 'colorGray', value: 'gray', swatch: 'bg-[#75787B] border-[#75787B]' },
];

const POSITIONS: { key: TKey; value: SealPosition }[] = [
  { key: 'posTopLeft', value: 'tl' },
  { key: 'posTopRight', value: 'tr' },
  { key: 'posBottomLeft', value: 'bl' },
  { key: 'posBottomRight', value: 'br' },
];

const DEFAULT_SETTINGS: UsdaSettings = {
  color: 'white',
  sizeRatio: 0.21,
  position: 'br',
  offsetX: 0,
  offsetY: 0,
};

const MARGIN_RATIO = 0.035; // seal margin from the edges, relative to the short side
const NUDGE_STEP = 0.01;    // one nudge = 1% of the short side

export function UsdaEditor({ t }: { t: Translator }) {
  const [hasImage, setHasImage] = useState(false);
  const [settings, setSettings] = useState<UsdaSettings>(DEFAULT_SETTINGS);
  const [seals, setSeals] = useState<Partial<Record<SealColor, { img: HTMLImageElement; bounds: Bounds }>>>({});
  const sourceRef = useRef<HTMLImageElement | null>(null);
  const { canvasRef, previewUrl, previewFresh, scheduleDraw, resetPreview, renderFull } =
    useCanvasPreview();

  // Preload both seal variants once; the official PNGs carry transparent
  // padding, so we also record the visible bounding box to size/place by.
  useEffect(() => {
    (Object.keys(SEAL_SRC) as SealColor[]).forEach((color) => {
      const img = new Image();
      img.src = SEAL_SRC[color];
      img.onload = () => setSeals((prev) => ({ ...prev, [color]: { img, bounds: getOpaqueBounds(img) } }));
    });
  }, []);

  const seal = seals[settings.color] ?? null;

  useEffect(() => {
    const img = sourceRef.current;
    if (!img) return;
    // Ratio-based throughout, so the same paint serves the cheap on-screen
    // preview and the full-resolution export.
    scheduleDraw({ width: img.width, height: img.height }, (ctx, width, height) => {
      ctx.drawImage(img, 0, 0, width, height);

      if (!seal) return;
      const { bounds } = seal;
      const shortSide = Math.min(width, height);
      const sealW = shortSide * settings.sizeRatio;
      const sealH = sealW * (bounds.h / bounds.w);
      const margin = shortSide * MARGIN_RATIO;

      let x = settings.position === 'tl' || settings.position === 'bl'
        ? margin
        : width - sealW - margin;
      let y = settings.position === 'tl' || settings.position === 'tr'
        ? margin
        : height - sealH - margin;

      x = Math.max(0, Math.min(width - sealW, x + shortSide * settings.offsetX));
      y = Math.max(0, Math.min(height - sealH, y + shortSide * settings.offsetY));

      ctx.drawImage(seal.img, bounds.x, bounds.y, bounds.w, bounds.h, x, y, sealW, sealH);
    });
  }, [hasImage, settings.sizeRatio, settings.position, settings.offsetX, settings.offsetY, seal, scheduleDraw]);

  const nudge = (dx: number, dy: number) =>
    setSettings((p) => ({ ...p, offsetX: p.offsetX + dx * NUDGE_STEP, offsetY: p.offsetY + dy * NUDGE_STEP }));

  const handleNudgeKeys = (e: React.KeyboardEvent) => {
    const dir: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const d = dir[e.key];
    if (d) {
      e.preventDefault();
      nudge(d[0], d[1]);
    }
  };

  const clearImage = () => {
    sourceRef.current = null;
    setHasImage(false);
    resetPreview();
  };

  const settingsContent = (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">{t('usdaColor')}</label>
        <div className="grid grid-cols-2 gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setSettings((p) => ({ ...p, color: c.value }))}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] text-sm rounded-lg border transition-colors cursor-pointer touch-manipulation ${
                settings.color === c.value
                  ? 'border-[#84BD00] bg-[#84BD00]/10 text-slate-800 font-medium'
                  : 'border-gray-200 text-slate-500 hover:bg-gray-50'
              }`}
            >
              <span className={`w-4 h-4 rounded-full border ${c.swatch}`} />
              {t(c.key)}
            </button>
          ))}
        </div>
      </div>

      <Slider
        label={`${t('usdaSize')}: ${Math.round(settings.sizeRatio * 100)}%`}
        min={0.08} max={0.45} step={0.01}
        value={settings.sizeRatio}
        onChange={(v) => setSettings((p) => ({ ...p, sizeRatio: v }))}
      />

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">{t('usdaPosition')}</label>
        <div className="grid grid-cols-2 gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, position: p.value }))}
              className={`px-3 py-2.5 min-h-[44px] text-sm rounded-lg border transition-colors cursor-pointer touch-manipulation ${
                settings.position === p.value
                  ? 'border-[#84BD00] bg-[#84BD00]/10 text-slate-800 font-medium'
                  : 'border-gray-200 text-slate-500 hover:bg-gray-50'
              }`}
            >
              {t(p.key)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">{t('nudge')}</label>
        <div
          className="inline-grid grid-cols-3 gap-1.5 outline-none focus:ring-2 focus:ring-[#84BD00]/50 rounded-xl p-1"
          tabIndex={0}
          role="group"
          aria-label={t('nudge')}
          onKeyDown={handleNudgeKeys}
        >
          {([
            [null, { icon: ChevronUp, label: 'nudgeUp', d: [0, -1] }, null],
            [
              { icon: ChevronLeft, label: 'nudgeLeft', d: [-1, 0] },
              { icon: RotateCcw, label: 'nudgeReset', d: null },
              { icon: ChevronRight, label: 'nudgeRight', d: [1, 0] },
            ],
            [null, { icon: ChevronDown, label: 'nudgeDown', d: [0, 1] }, null],
          ] as const).flat().map((cell, i) =>
            cell ? (
              <button
                key={i}
                type="button"
                aria-label={t(cell.label as TKey)}
                title={t(cell.label as TKey)}
                onClick={() =>
                  cell.d
                    ? nudge(cell.d[0], cell.d[1])
                    : setSettings((p) => ({ ...p, offsetX: 0, offsetY: 0 }))
                }
                className="w-11 h-11 flex items-center justify-center rounded-lg border border-gray-200 text-slate-500 hover:bg-gray-50 hover:text-slate-800 active:bg-[#84BD00]/10 active:border-[#84BD00] transition-colors cursor-pointer touch-manipulation"
              >
                <cell.icon className="w-5 h-5" />
              </button>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{t('nudgeHint')}</p>
      </div>

      <button
        type="button"
        onClick={() => setSettings(DEFAULT_SETTINGS)}
        className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-800 border border-gray-200 rounded-lg active:bg-gray-100 hover:bg-gray-50 transition-colors cursor-pointer touch-manipulation"
      >
        {t('reset')}
      </button>
    </div>
  );

  return (
    <EditorLayout t={t} hasImage={hasImage} settings={settingsContent}>
      {!hasImage ? (
        <UploadZone
          t={t}
          titleKey="uploadTitleUsda"
          hintKey="uploadHintUsda"
          onImage={(img) => { sourceRef.current = img; setHasImage(true); }}
        />
      ) : (
        <PreviewPane
          t={t}
          canvasRef={canvasRef}
          renderFull={renderFull}
          previewUrl={previewUrl}
          previewFresh={previewFresh}
          filename="oright-usda-edited.png"
          onCancel={clearImage}
        />
      )}
    </EditorLayout>
  );
}
