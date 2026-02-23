/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Upload, X, Download, Settings, Sliders } from 'lucide-react';

export interface EditorSettings {
  footerColor: string;
  footerOpacity: number;
  footerHeightRatio: number;
  logoPadding: number;
  forceLogoWhite: boolean;
}

export const DEFAULT_SETTINGS: EditorSettings = {
  footerColor: '#1a331a', // Deep Dark Green
  footerOpacity: 0.4,     // Fixed at 40%

  // [調整 Bar 高度] 
  // 決定綠色底條佔整張照片高度的比例 (0.1 = 10%)
  footerHeightRatio: 0.11, 

  // [調整 Logo 大小] 
  // 決定 Logo 在底條內的上下留白比例 (0.25 = 上下各留 25% 空間，Logo 本身佔 50% 高度)
  // 若要 Logo 變大：請改小這個數字 (例如 改成 0.15)
  // 若要 Logo 變小：請改大這個數字 (例如 改成 0.35)
  logoPadding: 0.12,      

  forceLogoWhite: false,
};

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Load logo image on mount
  useEffect(() => {
    const img = new Image();
    img.src = '/logo.svg';
    img.onload = () => {
      setLogoImage(img);
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        
        const img = new Image();
        img.onload = () => {
          originalImageRef.current = img;
          drawCanvas(img, settings);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    originalImageRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const drawCanvas = useCallback((img: HTMLImageElement, currentSettings: EditorSettings) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // --- Draw Footer Bar ---
    const footerHeight = img.height * currentSettings.footerHeightRatio;
    const footerY = img.height - footerHeight;

    ctx.globalAlpha = currentSettings.footerOpacity;
    ctx.fillStyle = currentSettings.footerColor;
    ctx.fillRect(0, footerY, img.width, footerHeight);
    ctx.globalAlpha = 1.0;

    // --- Draw Logo & Text ---
    // Calculate dimensions
    // Logo height is determined by padding within the footer
    const logoSize = footerHeight * (1 - currentSettings.logoPadding * 2);
    const logoY = footerY + (footerHeight * currentSettings.logoPadding);
    
    // Font size relative to logo size
    const fontSize = logoSize * 0.5;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const text = "O'right PRO";
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    
    // Spacing between logo and text
    const spacing = logoSize * 0.4;
    
    // Calculate total width to center the group
    const totalContentWidth = logoSize + spacing + textWidth;
    const startX = (img.width - totalContentWidth) / 2;

    // 1. Draw Logo Image (if loaded)
    if (logoImage) {
      ctx.drawImage(logoImage, startX, logoY, logoSize, logoSize);
    }

    // 2. Draw Text "O'right PRO"
    ctx.fillStyle = currentSettings.forceLogoWhite ? 'white' : 'white'; // Always white on dark footer usually
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px sans-serif`;
    
    // Text Y position: centered vertically in the logo area
    // logoY is top of logo. Center is logoY + logoSize/2.
    const centerY = logoY + logoSize / 2;
    ctx.fillText(text, startX + logoSize + spacing, centerY);

  }, [logoImage]);

  // Re-draw when settings change or logo loads
  useEffect(() => {
    if (originalImageRef.current) {
      drawCanvas(originalImageRef.current, settings);
    }
  }, [settings, drawCanvas, logoImage]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'oright-pro-edited.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const updateSetting = (key: keyof EditorSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="O'right Logo" className="w-8 h-8 rounded-full" />
          <h1 className="text-xl font-medium text-slate-800">
            <span className="font-bold">O'right</span> | PRO <span className="text-[#66BB6A]">Image Editor</span>
          </h1>
        </div>
        {selectedImage && (
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-gray-100 text-[#66BB6A]' : 'text-slate-500 hover:bg-gray-100'}`}
          >
            <Settings className="w-6 h-6" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex gap-6 justify-center items-start">
        
        {/* Settings Panel */}
        {selectedImage && showSettings && (
          <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-shrink-0">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
              <Sliders className="w-5 h-5" />
              <h3 className="font-bold">Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Footer Color */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Footer Color
                </label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={settings.footerColor}
                    onChange={(e) => updateSetting('footerColor', e.target.value)}
                    className="h-10 w-full rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Footer Opacity */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Footer Opacity: {Math.round(settings.footerOpacity * 100)}%
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={settings.footerOpacity}
                  onChange={(e) => updateSetting('footerOpacity', parseFloat(e.target.value))}
                  className="w-full accent-[#66BB6A]"
                />
              </div>

              {/* Footer Height Ratio */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Footer Height: {Math.round(settings.footerHeightRatio * 100)}%
                </label>
                <input 
                  type="range" 
                  min="0.05" 
                  max="0.3" 
                  step="0.01"
                  value={settings.footerHeightRatio}
                  onChange={(e) => updateSetting('footerHeightRatio', parseFloat(e.target.value))}
                  className="w-full accent-[#66BB6A]"
                />
              </div>

              {/* Logo Padding */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Logo Size (Inverse Padding)
                </label>
                <input 
                  type="range" 
                  min="0.05" 
                  max="0.4" 
                  step="0.01"
                  value={settings.logoPadding}
                  onChange={(e) => updateSetting('logoPadding', parseFloat(e.target.value))}
                  className="w-full accent-[#66BB6A]"
                />
                <p className="text-xs text-slate-400 mt-1">Smaller value = Larger logo</p>
              </div>

              {/* Reset Button */}
              <button 
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-4xl text-center flex-grow">
          
          {!selectedImage ? (
            <div className="py-12">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[#66BB6A]" />
                </div>
              </div>

              {/* Text */}
              <h2 className="text-2xl font-medium text-slate-800 mb-3">
                Upload Photo
              </h2>
              <p className="text-slate-500 mb-10">
                Select a photo to automatically add the O'right PRO brand logo.
              </p>

              {/* Dropzone */}
              <div 
                className={`
                  border-2 border-dashed rounded-xl p-12 transition-colors cursor-pointer
                  flex flex-col items-center justify-center gap-4 max-w-xl mx-auto
                  ${isDragging 
                    ? 'border-[#66BB6A] bg-green-50/30' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileInput}
                />
                
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-gray-400 font-medium">
                  Click or drag photo here
                </span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-medium text-slate-800">Preview</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={clearImage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#66BB6A] rounded-lg hover:bg-[#5CA860] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
              
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <canvas 
                  ref={canvasRef}
                  className="max-h-[70vh] w-auto max-w-full object-contain shadow-lg"
                />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
