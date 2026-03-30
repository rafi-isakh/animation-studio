"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { XMarkIcon } from './Icons';

interface InpaintModalProps {
  imageUrl: string;
  onSubmit: (maskDataUrl: string, prompt: string, strength: number, width: number, height: number) => void;
  onClose: () => void;
}

export const InpaintModal: React.FC<InpaintModalProps> = ({ imageUrl, onSubmit, onClose }) => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [isEraser, setIsEraser] = useState(false);
  const [strength, setStrength] = useState(0.7);
  const [prompt, setPrompt] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState('');

  // Natural image dimensions (used for mask export)
  const naturalSizeRef = useRef({ width: 0, height: 0 });
  // Display scale: natural → canvas CSS pixels
  const scaleRef = useRef({ x: 1, y: 1 });

  // Load source image onto background canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      naturalSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight };

      const bg = bgCanvasRef.current;
      const mask = maskCanvasRef.current;
      if (!bg || !mask) return;

      // Set canvas resolution to image's natural size
      bg.width = img.naturalWidth;
      bg.height = img.naturalHeight;
      mask.width = img.naturalWidth;
      mask.height = img.naturalHeight;

      const ctx = bg.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      // Fill mask canvas with black (= keep original)
      const mCtx = mask.getContext('2d');
      if (mCtx) {
        mCtx.fillStyle = 'black';
        mCtx.fillRect(0, 0, mask.width, mask.height);
      }

      setImageLoaded(true);
    };
    img.onerror = () => setError('Failed to load image. Try again.');
    img.src = imageUrl.startsWith('http')
      ? `/api/mithril/s3/proxy?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
  }, [imageUrl]);

  // Update scale whenever canvas display size changes
  const updateScale = useCallback(() => {
    const bg = bgCanvasRef.current;
    if (!bg || !naturalSizeRef.current.width) return;
    const rect = bg.getBoundingClientRect();
    scaleRef.current = {
      x: naturalSizeRef.current.width / rect.width,
      y: naturalSizeRef.current.height / rect.height,
    };
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  // Convert pointer event position to canvas coordinates
  const getCanvasPos = useCallback((e: React.PointerEvent) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * scaleRef.current.x,
      y: (e.clientY - rect.top) * scaleRef.current.y,
    };
  }, []);

  const paint = useCallback((e: React.PointerEvent) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasPos(e);
    const scaledBrush = brushSize * Math.max(scaleRef.current.x, scaleRef.current.y);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = isEraser ? 'black' : 'white';
    ctx.beginPath();
    ctx.arc(x, y, scaledBrush / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brushSize, isEraser, getCanvasPos]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateScale();
    setIsDrawing(true);
    paint(e);
  }, [paint, updateScale]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return;
    paint(e);
  }, [isDrawing, paint]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim()) {
      setError('Please enter a prompt describing what to paint in the masked area.');
      return;
    }

    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    // Check if any white pixels exist (user actually painted something)
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const hasMask = data.some((v, i) => i % 4 === 0 && v > 128 && data[i + 3] > 128);
      if (!hasMask) {
        setError('Please paint the area you want to inpaint before submitting.');
        return;
      }
    }

    // Flatten mask onto a black background before export so erased areas are
    // explicitly black (not transparent), ensuring white=inpaint / black=keep.
    const flatCanvas = document.createElement('canvas');
    flatCanvas.width = canvas.width;
    flatCanvas.height = canvas.height;
    const flatCtx = flatCanvas.getContext('2d')!;
    flatCtx.fillStyle = 'black';
    flatCtx.fillRect(0, 0, flatCanvas.width, flatCanvas.height);
    flatCtx.drawImage(canvas, 0, 0);
    const maskDataUrl = flatCanvas.toDataURL('image/png');
    const { width, height } = naturalSizeRef.current;
    onSubmit(maskDataUrl, prompt.trim(), strength, width, height);
  }, [prompt, strength, onSubmit]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inpaint Region</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Canvas area */}
          <div
            ref={containerRef}
            className="relative flex-1 bg-gray-950 flex items-center justify-center overflow-hidden min-h-[300px]"
          >
            {error && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-red-600 text-white text-sm px-4 py-2 rounded-lg">
                {error}
              </div>
            )}
            {!imageLoaded && (
              <div className="text-gray-400 text-sm animate-pulse">Loading image...</div>
            )}
            <div className="relative" style={{ display: imageLoaded ? 'block' : 'none' }}>
              {/* Background image canvas */}
              <canvas
                ref={bgCanvasRef}
                className="block max-w-full max-h-[60vh] object-contain"
                style={{ maxHeight: '60vh' }}
              />
              {/* Mask overlay canvas — same CSS size as bg canvas */}
              <canvas
                ref={maskCanvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                style={{ opacity: 0.5, mixBlendMode: 'screen' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            </div>
          </div>

          {/* Controls panel */}
          <div className="w-full md:w-72 flex flex-col gap-4 p-5 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-y-auto">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Paint over the region you want to regenerate. White = edited area.
              </p>

              {/* Brush / Eraser */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setIsEraser(false)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    !isEraser
                      ? 'bg-[#DB2777] text-white border-[#DB2777]'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#DB2777]'
                  }`}
                >
                  Brush
                </button>
                <button
                  onClick={() => setIsEraser(true)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    isEraser
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-500'
                  }`}
                >
                  Eraser
                </button>
              </div>

              {/* Brush size */}
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Brush Size: {brushSize}px
              </label>
              <input
                type="range"
                min={5}
                max={100}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-[#DB2777]"
              />

              {/* Clear */}
              <button
                onClick={clearMask}
                className="mt-3 w-full py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
              >
                Clear Mask
              </button>
            </div>

            {/* Strength */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Strength: {strength.toFixed(2)}
              </label>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="w-full accent-[#DB2777]"
              />
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                Higher = more creative, lower = closer to original.
              </p>
            </div>

            {/* Prompt */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setError(''); }}
                placeholder="Describe what to paint in the masked area..."
                rows={4}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#DB2777]/50 focus:border-[#DB2777]"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!imageLoaded}
              className="w-full py-3 text-sm font-semibold text-white bg-[#DB2777] hover:bg-[#be185d] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              Generate Inpaint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
