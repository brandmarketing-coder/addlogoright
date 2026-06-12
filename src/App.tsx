import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Globe, ExternalLink } from 'lucide-react';
import { makeT, type Lang } from './i18n';
import { IS_LINE, externalBrowserUrl } from './utils';
import { WatermarkEditor } from './components/WatermarkEditor';
import { UsdaEditor } from './components/UsdaEditor';

type Tab = 'watermark' | 'usda';

export default function App() {
  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem('lang') as Lang) === 'en' ? 'en' : 'zh',
  );
  const [tab, setTab] = useState<Tab>('watermark');
  const [showSettings, setShowSettings] = useState(false);
  const [hasImage, setHasImage] = useState<Record<Tab, boolean>>({ watermark: false, usda: false });
  const t = makeT(lang);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  }, [lang]);

  // On desktop the settings panel stays on by default; on mobile the
  // bottom drawer starts closed.
  const isDesktop = () => window.matchMedia('(min-width: 640px)').matches;

  const switchTab = (next: Tab) => {
    setTab(next);
    setShowSettings(isDesktop());
  };

  const handleHasImage = (key: Tab) => (v: boolean) => {
    setHasImage((p) => ({ ...p, [key]: v }));
    if (v && isDesktop()) setShowSettings(true);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'watermark', label: t('navWatermark') },
    { id: 'usda', label: t('navUsda') },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo-oright.svg" alt="O'right" className="h-7 w-auto flex-shrink-0" />
            <h1 className="text-base sm:text-xl font-medium text-[#75787B] truncate">
              {t('appTitle')}
            </h1>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Language toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium text-slate-600 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer touch-manipulation"
              aria-label="Switch language"
            >
              <Globe className="w-4 h-4" />
              {lang === 'zh' ? 'English' : '中文'}
            </button>
            {hasImage[tab] && (
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 min-h-[40px] rounded-lg transition-colors cursor-pointer touch-manipulation ${showSettings ? 'bg-gray-100 text-[#84BD00]' : 'text-slate-500 hover:bg-gray-100 active:bg-gray-200'}`}
                aria-label={t('settings')}
              >
                <SlidersHorizontal className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="px-4 sm:px-6 mt-2 flex gap-1 overflow-x-auto">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer touch-manipulation ${
                tab === id
                  ? 'border-[#84BD00] text-[#84BD00]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 active:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* LINE in-app browser notice */}
      {IS_LINE && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs sm:text-sm text-amber-800 flex items-center justify-center gap-2 flex-wrap text-center">
          <span>{t('lineBanner')}</span>
          <a
            href={externalBrowserUrl()}
            className="inline-flex items-center gap-1 font-medium underline touch-manipulation"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('lineOpenExternal')}
          </a>
        </div>
      )}

      {/* Keep both editors mounted so switching tabs doesn't lose the uploaded image */}
      <div className={tab === 'watermark' ? '' : 'hidden'}>
        <WatermarkEditor
          t={t}
          showSettings={tab === 'watermark' && showSettings}
          setShowSettings={setShowSettings}
          onHasImageChange={handleHasImage('watermark')}
        />
      </div>
      <div className={tab === 'usda' ? '' : 'hidden'}>
        <UsdaEditor
          t={t}
          showSettings={tab === 'usda' && showSettings}
          setShowSettings={setShowSettings}
          onHasImageChange={handleHasImage('usda')}
        />
      </div>
    </div>
  );
}
