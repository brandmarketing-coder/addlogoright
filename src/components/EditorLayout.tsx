import React from 'react';
import { Sliders } from 'lucide-react';
import type { Translator } from '../i18n';

/**
 * Shared editor scaffold. The settings panel is always visible once an
 * image is loaded: a left sidebar on desktop, a card below the preview
 * on mobile.
 */
export function EditorLayout({
  t,
  hasImage,
  settings,
  children,
}: {
  t: Translator;
  hasImage: boolean;
  settings: React.ReactNode;
  children: React.ReactNode;
}) {
  const settingsHeader = (
    <div className="flex items-center gap-2 mb-6 text-slate-800">
      <Sliders className="w-5 h-5" />
      <h3 className="font-bold">{t('settings')}</h3>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8 flex flex-col sm:flex-row gap-6 justify-center items-stretch sm:items-start">
      {/* Desktop sidebar */}
      {hasImage && (
        <div className="hidden sm:block w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-shrink-0">
          {settingsHeader}
          {settings}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 w-full max-w-4xl text-center flex-grow min-w-0">
        {children}
      </div>

      {/* Mobile: settings card below the preview */}
      {hasImage && (
        <div className="sm:hidden bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          {settingsHeader}
          {settings}
        </div>
      )}
    </main>
  );
}
