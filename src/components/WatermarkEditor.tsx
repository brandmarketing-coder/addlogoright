import React, { useEffect, useRef, useState } from 'react';
import type { Translator } from '../i18n';
import { useCanvasPreview } from '../hooks/useCanvasPreview';
import { UploadZone } from './UploadZone';
import { PreviewPane } from './PreviewPane';
import { EditorLayout } from './EditorLayout';

interface WatermarkSettings {
  footerColor: string;
  footerOpacity: number;
  footerHeightRatio: number;
  logoPadding: number;
}

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
  const { canvasRef, previewUrl, previewFresh, scheduleDraw, resetPreview } = useCanvasPreview();

  useEffect(() => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => setLogoImage(img);
  }, []);

  useEffect(() => {
    const img = sourceRef.current;
    if (!img) return;
    scheduleDraw((canvas, ctx) => {
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      ctx.drawImage(img, 0, 0);

      const footerHeight = img.height * settings.footerHeightRatio;
      const footerY = img.height - footerHeight;

      ctx.globalAlpha = settings.footerOpacity;
      ctx.fillStyle = settings.footerColor;
      ctx.fillRect(0, footerY, img.width, footerHeight);
      ctx.globalAlpha = 1;

      if (logoImage) {
        const logoSize = footerHeight * (1 - settings.logoPadding * 2);
        const logoY = footerY + footerHeight * settings.logoPadding;
        const drawWidth = logoSize * (logoImage.width / logoImage.height);
        ctx.drawImage(logoImage, (img.width - drawWidth) / 2, logoY, drawWidth, logoSize);
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
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          {t('footerOpacity')}: {Math.round(settings.footerOpacity * 100)}%
        </label>
        <input
          type="range" min="0" max="1" step="0.05"
          value={settings.footerOpacity}
          onChange={(e) => update('footerOpacity', parseFloat(e.target.value))}
          className="w-full accent-[#84BD00]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          {t('footerHeight')}: {Math.round(settings.footerHeightRatio * 100)}%
        </label>
        <input
          type="range" min="0.05" max="0.3" step="0.01"
          value={settings.footerHeightRatio}
          onChange={(e) => update('footerHeightRatio', parseFloat(e.target.value))}
          className="w-full accent-[#84BD00]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">{t('logoSize')}</label>
        <input
          type="range" min="0.05" max="0.4" step="0.01"
          value={settings.logoPadding}
          onChange={(e) => update('logoPadding', parseFloat(e.target.value))}
          className="w-full accent-[#84BD00]"
        />
        <p className="text-xs text-slate-400 mt-1">{t('logoSizeHint')}</p>
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
          titleKey="uploadTitleWatermark"
          hintKey="uploadHintWatermark"
          onImage={(img) => { sourceRef.current = img; setHasImage(true); }}
        />
      ) : (
        <PreviewPane
          t={t}
          canvasRef={canvasRef}
          previewUrl={previewUrl}
          previewFresh={previewFresh}
          filename="oright-pro-edited.png"
          onCancel={clearImage}
        />
      )}
    </EditorLayout>
  );
}
