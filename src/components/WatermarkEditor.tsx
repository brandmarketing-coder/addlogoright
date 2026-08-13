import React, { useEffect, useRef, useState } from 'react';
import type { Translator } from '../i18n';
import { useCanvasPreview } from '../hooks/useCanvasPreview';
import { UploadZone } from './UploadZone';
import { PreviewPane } from './PreviewPane';
import { EditorLayout } from './EditorLayout';
import { Slider } from './Slider';

interface WatermarkSettings {
  footerColor: string;
  footerOpacity: number;
  footerHeightRatio: number;
  logoPadding: number;
}

/**
 * The logo is sized off the footer height, which is a ratio of the image
 * height — so on tall images (9:16 stories, phone screenshots) it grew wide
 * enough to run past both edges. This cap exists only to keep it on the
 * canvas with a margin either side; it is deliberately loose, because a
 * tighter one swallowed the whole logo-size slider on portrait photos.
 */
const MAX_LOGO_WIDTH_RATIO = 0.9;

const DEFAULT_SETTINGS: WatermarkSettings = {
  footerColor: '#1a331a',
  footerOpacity: 0.4,
  footerHeightRatio: 0.11,
  logoPadding: 0.12,
};

export function WatermarkEditor({ t }: { t: Translator }) {
  const [hasImage, setHasImage] = useState(false);
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const sourceRef = useRef<HTMLImageElement | null>(null);
  const { canvasRef, previewUrl, previewFresh, scheduleDraw, resetPreview, renderFull } =
    useCanvasPreview();

  useEffect(() => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => setLogoImage(img);
    img.onerror = () => console.error('logo.png failed to load — watermark will render without it');
  }, []);

  useEffect(() => {
    const img = sourceRef.current;
    if (!img) return;
    // Everything below is a ratio of the target size, so this same paint runs
    // for the cheap on-screen preview and for the full-resolution export.
    scheduleDraw({ width: img.width, height: img.height }, (ctx, width, height) => {
      ctx.drawImage(img, 0, 0, width, height);

      const footerHeight = height * settings.footerHeightRatio;
      const footerY = height - footerHeight;

      ctx.globalAlpha = settings.footerOpacity;
      ctx.fillStyle = settings.footerColor;
      ctx.fillRect(0, footerY, width, footerHeight);
      ctx.globalAlpha = 1;

      if (logoImage) {
        const aspect = logoImage.width / logoImage.height;
        let drawHeight = footerHeight * (1 - settings.logoPadding * 2);
        let drawWidth = drawHeight * aspect;
        const maxWidth = width * MAX_LOGO_WIDTH_RATIO;
        if (drawWidth > maxWidth) {
          drawWidth = maxWidth;
          drawHeight = drawWidth / aspect;
        }
        // Centre vertically in the footer — the height can now be clamped,
        // so padding alone no longer positions it correctly.
        const logoY = footerY + (footerHeight - drawHeight) / 2;
        ctx.drawImage(logoImage, (width - drawWidth) / 2, logoY, drawWidth, drawHeight);
      }
    });
  }, [hasImage, settings, logoImage, scheduleDraw]);

  const clearImage = () => {
    sourceRef.current = null;
    setHasImage(false);
    resetPreview();
  };

  const update = <K extends keyof WatermarkSettings>(key: K, value: WatermarkSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const settingsContent = (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">{t('footerColor')}</label>
        <input
          type="color"
          value={settings.footerColor}
          onChange={(e) => update('footerColor', e.target.value)}
          className="h-10 w-full rounded cursor-pointer"
        />
      </div>
      <Slider
        label={`${t('footerOpacity')}: ${Math.round(settings.footerOpacity * 100)}%`}
        min={0} max={1} step={0.05}
        value={settings.footerOpacity}
        onChange={(v) => update('footerOpacity', v)}
      />
      <Slider
        label={`${t('footerHeight')}: ${Math.round(settings.footerHeightRatio * 100)}%`}
        min={0.05} max={0.3} step={0.01}
        value={settings.footerHeightRatio}
        onChange={(v) => update('footerHeightRatio', v)}
      />
      <Slider
        label={t('logoSize')}
        hint={t('logoSizeHint')}
        min={0.05} max={0.4} step={0.01}
        value={settings.logoPadding}
        onChange={(v) => update('logoPadding', v)}
      />
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
          titleKey="uploadTitleWatermark"
          hintKey="uploadHintWatermark"
          onImage={(img) => { sourceRef.current = img; setHasImage(true); }}
        />
      ) : (
        <PreviewPane
          t={t}
          canvasRef={canvasRef}
          renderFull={renderFull}
          previewUrl={previewUrl}
          previewFresh={previewFresh}
          filename="oright-pro-edited.png"
          onCancel={clearImage}
        />
      )}
    </EditorLayout>
  );
}
