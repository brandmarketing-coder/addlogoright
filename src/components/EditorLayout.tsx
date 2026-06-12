import React from 'react';
import { Sliders, X } from 'lucide-react';
import type { Translator } from '../i18n';

/**
 * Shared editor scaffold: desktop settings sidebar + editor card +
 * mobile bottom-sheet settings drawer.
 */
export function EditorLayout({
  t,
  hasImage,
  showSettings,
  onCloseSettings,
  settings,
  children,
}: {
  t: Translator;
  hasImage: boolean;
  showSettings: boolean;
  onCloseSettings: () => void;
  settings: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="container mx-auto px-4 py-6 sm:py-8 flex gap-6 justify-center items-start">
        {hasImage && showSettings && (
          <div className="hidden sm:block w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-shrink-0">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
              <Sliders className="w-5 h-5" />
              <h3 className="font-bold">{t('settings')}</h3>
            </div>
            {settings}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 w-full max-w-4xl text-center flex-grow min-w-0">
          {children}
        </div>
      </main>

      {/* Mobile settings drawer */}
      {hasImage && (
        <>
          <div
            className={`sm:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${showSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={onCloseSettings}
          />
          <div
            className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out ${showSettings ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-800">{t('settings')}</h3>
              </div>
              <button
                type="button"
                onClick={onCloseSettings}
                className="p-2 -m-1 text-slate-400 active:text-slate-700 hover:text-slate-600 cursor-pointer touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto max-h-[70vh] pb-[max(1rem,env(safe-area-inset-bottom))]">
              {settings}
            </div>
          </div>
        </>
      )}
    </>
  );
}
