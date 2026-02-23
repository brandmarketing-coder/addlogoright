/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, Upload, X, Download } from 'lucide-react';

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!selectedImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx?.drawImage(img, 0, 0);

      if (ctx) {
        // Watermark configuration
        const padding = Math.max(img.width, img.height) * 0.03; // 3% padding
        const logoSize = Math.max(img.width, img.height) * 0.05; // 5% logo size
        const fontSize = logoSize * 0.6;
        
        // Calculate positions (bottom right)
        const x = img.width - padding;
        const y = img.height - padding;

        // Draw background pill for watermark (optional, matches preview style)
        ctx.font = `bold ${fontSize}px sans-serif`;
        const text = "O'right PRO";
        const textWidth = ctx.measureText(text).width;
        const totalWidth = logoSize + (padding/2) + textWidth + (padding);
        const totalHeight = logoSize + (padding/2);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(
          x - totalWidth, 
          y - totalHeight, 
          totalWidth, 
          totalHeight, 
          totalHeight / 4
        );
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Draw Green Circle Logo
        const circleX = x - totalWidth + (padding/2) + (logoSize/2);
        const circleY = y - totalHeight + (padding/4) + (logoSize/2);
        
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.arc(circleX, circleY, logoSize/2, 0, Math.PI * 2);
        ctx.fill();

        // Draw 'O' inside circle
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${logoSize * 0.6}px sans-serif`;
        ctx.fillText('O', circleX, circleY + (logoSize * 0.05)); // Slight visual adjustment

        // Draw Text "O'right PRO"
        ctx.fillStyle = '#1e293b'; // slate-800
        ctx.textAlign = 'left';
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillText(text, circleX + (logoSize/2) + (padding/3), circleY);
      }

      // Trigger download
      const link = document.createElement('a');
      link.download = 'oright-pro-edited.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = selectedImage;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#66BB6A] flex items-center justify-center text-white font-bold text-lg">
          O
        </div>
        <h1 className="text-xl font-medium text-slate-800">
          <span className="font-bold">O'right</span> | PRO <span className="text-[#66BB6A]">Image Editor</span>
        </h1>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 w-full max-w-3xl text-center">
          
          {!selectedImage ? (
            <>
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
                  flex flex-col items-center justify-center gap-4
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
            </>
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
              
              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img 
                  src={selectedImage} 
                  alt="Uploaded preview" 
                  className="max-h-[60vh] w-auto mx-auto object-contain"
                />
                {/* Watermark Overlay Mockup */}
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-sm pointer-events-none">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#66BB6A] flex items-center justify-center text-white font-bold text-xs">
                      O
                    </div>
                    <span className="font-bold text-slate-800 text-sm">O'right PRO</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
