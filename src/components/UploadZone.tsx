import React, { useRef, useState } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { Translator, TKey } from '../i18n';

/**
 * HEIC/HEIF is what iPhones shoot by default. No desktop browser can decode
 * it, and Windows often reports an empty File.type for it — so sniff the
 * filename too, and tell the user what to do instead of failing silently.
 */
const isHeic = (file: File) =>
  /\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type);

export function UploadZone({
  t,
  titleKey,
  hintKey,
  onImage,
}: {
  t: Translator;
  titleKey: TKey;
  hintKey: TKey;
  onImage: (img: HTMLImageElement) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<TKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (isHeic(file)) {
      setError('errHeic');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('errNotImage');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      onImage(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('errDecode');
    };
    img.src = url;
  };

  return (
    <div className="py-8 sm:py-12">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-[#84BD00]/10 rounded-full flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-[#84BD00]" />
        </div>
      </div>
      <h2 className="text-2xl font-medium text-slate-800 mb-3">{t(titleKey)}</h2>
      <p className="text-slate-500 mb-8 sm:mb-10 text-sm sm:text-base px-2">{t(hintKey)}</p>
      <div
        className={`
          border-2 border-dashed rounded-xl p-8 sm:p-12 transition-colors cursor-pointer
          flex flex-col items-center justify-center gap-4 max-w-xl mx-auto
          ${isDragging ? 'border-[#84BD00] bg-[#84BD00]/5' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
          <ImageIcon className="w-6 h-6" />
        </div>
        <span className="text-gray-400 font-medium text-sm sm:text-base">{t('dropHere')}</span>
      </div>

      {error && (
        <div
          role="alert"
          className="max-w-xl mx-auto mt-4 flex items-start gap-2.5 text-left rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{t(error)}</span>
        </div>
      )}
    </div>
  );
}
