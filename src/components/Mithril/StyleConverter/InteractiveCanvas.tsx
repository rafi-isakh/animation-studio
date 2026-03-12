"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';
import { AspectRatio } from './types';

export interface InteractiveCanvasHandle {
  download: (filename: string) => void;
}

interface InteractiveCanvasProps {
  src: string;
  targetRatio: AspectRatio;
  className?: string;
  maxHeight?: number;
}

export const InteractiveCanvas = forwardRef<InteractiveCanvasHandle, InteractiveCanvasProps>(
  ({ src, targetRatio, className, maxHeight = 400 }, ref) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const styleConfig = useMemo(() => {
      const [w, h] = targetRatio.split(':').map(Number);
      const ratioVal = w / h;
      const ratioStyle = { aspectRatio: `${w}/${h}` };
      const maxWidth = maxHeight * ratioVal;
      return { ratioStyle, maxWidth };
    }, [targetRatio, maxHeight]);

    useImperativeHandle(ref, () => ({
      download: (filename: string) => {
        const container = containerRef.current;
        const img = imageRef.current;
        if (!container || !img) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const displayWidth = container.clientWidth;
        const displayHeight = container.clientHeight;

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = displayWidth / displayHeight;

        let drawnDisplayWidth: number;
        if (containerRatio > imgRatio) {
          drawnDisplayWidth = displayHeight * imgRatio;
        } else {
          drawnDisplayWidth = displayWidth;
        }

        const resolutionScale = img.naturalWidth / drawnDisplayWidth;

        canvas.width = displayWidth * resolutionScale;
        canvas.height = displayHeight * resolutionScale;

        ctx.scale(resolutionScale, resolutionScale);
        ctx.translate(displayWidth / 2, displayHeight / 2);
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);

        let drawW: number, drawH: number;
        if (containerRatio > imgRatio) {
          drawH = displayHeight;
          drawW = displayHeight * imgRatio;
        } else {
          drawW = displayWidth;
          drawH = displayWidth / imgRatio;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeType =
          ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL(mimeType, 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
    }));

    useEffect(() => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }, [src]);

    const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setScale(parseFloat(e.target.value));
    };

    return (
      <div className={`relative flex gap-2 items-center justify-center ${className}`}>
        <div
          ref={containerRef}
          className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden cursor-move touch-none shadow-inner group"
          style={{
            ...styleConfig.ratioStyle,
            width: '100%',
            maxWidth: `${styleConfig.maxWidth}px`,
            backgroundImage:
              'linear-gradient(45deg, #1f2937 25%, transparent 25%), linear-gradient(-45deg, #1f2937 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f2937 75%), linear-gradient(-45deg, transparent 75%, #1f2937 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              ref={imageRef}
              src={src}
              alt="Result"
              className="pointer-events-none select-none max-w-full max-h-full object-contain"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            />
          </div>
        </div>

        {/* Vertical Zoom Slider */}
        <div className="flex flex-col items-center justify-center bg-gray-800 rounded-full py-2 px-1 border border-gray-700 h-full max-h-[200px] self-center shadow-lg z-10 shrink-0">
          <span className="text-[10px] text-gray-500 font-bold mb-1">+</span>
          <div className="relative flex-1 w-4 flex items-center justify-center">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={handleZoomChange}
              className="w-[150px] h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer absolute -rotate-90 origin-center"
              style={{ WebkitAppearance: 'none' }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-bold mt-1">-</span>
        </div>
      </div>
    );
  }
);

InteractiveCanvas.displayName = 'InteractiveCanvas';
