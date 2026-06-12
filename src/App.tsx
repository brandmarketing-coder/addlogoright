import React, { useEffect, useState } from 'react';
import { Globe, ExternalLink } from 'lucide-react';
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
  const t = makeT(lang);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  }, [lang]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'watermark', label: t('navWatermark') },
    { id: 'usda', label: t('navUsda') },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-2">
          <h1 className="text-base sm:text-xl font-medium text-[#75787B] truncate">
            {t('appTitle')}
          </h1>
          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium text-slate-600 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer touch-manipulation flex-shrink-0"
            aria-label="Switch language"
          >
            <Globe className="w-4 h-4" />
            {lang === 'zh' ? 'English' : '中文'}
          </button>
        </div>

        {/* Nav tabs */}
        <nav className="px-4 sm:px-6 mt-2 flex gap-1 overflow-x-auto">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
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
        <WatermarkEditor t={t} />
      </div>
      <div className={tab === 'usda' ? '' : 'hidden'}>
        <UsdaEditor t={t} />
      </div>
    </div>
  );
}
