"use client";

import React, { useState, useRef, useEffect } from "react";
import { Brush, Eraser, Undo2, X, Upload, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

interface CharacterSheetImageEditorProps {
  initialImage: string | null;
  initialPrompt: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    combinedImageBase64: string,
    prompt: string,
    styleImageBase64?: string
  ) => Promise<void>;
}

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

export default function CharacterSheetImageEditor({
  initialImage,
  initialPrompt,
  isOpen,
  onClose,
  onSave,
}: CharacterSheetImageEditorProps) {
  const { language, dictionary } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [styleRef, setStyleRef] = useState<string | null>(null);

  const colors = [
    "#000000",
    "#FFFFFF",
    "#EF4444",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      setStyleRef(null);

      if (initialImage) {
        const img = new window.Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          saveToHistory();
        };
        img.src = `data:image/jpeg;base64,${initialImage}`;
      } else {
        canvas.width = 1280;
        canvas.height = 720;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialImage]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => {
        const newHist = [...prev, imageData];
        if (newHist.length > 10) return newHist.slice(newHist.length - 10);
        return newHist;
      });
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevState = newHistory[newHistory.length - 1];
      setHistory(newHistory);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx && prevState) {
        ctx.putImageData(prevState, 0, 0);
      }
    }
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setStyleRef((ev.target.result as string).split(",")[1]);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      const base64 = canvasRef.current.toDataURL("image/jpeg").split(",")[1];
      await onSave(base64, initialPrompt, styleRef || undefined);
    } catch (e) {
      console.error("Failed to save/generate", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      if (initialImage) {
        const img = new window.Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          saveToHistory();
        };
        img.src = `data:image/jpeg;base64,${initialImage}`;
      } else {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="flex flex-col md:flex-row w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900">
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-gray-800 flex flex-col p-4 shrink-0 border-b md:border-b-0 md:border-r border-gray-700 overflow-y-auto">
          <h3 className="text-[#DB2777] font-bold text-xl mb-4">
            {phrase(dictionary, "editor_drawing_tools", language)}
          </h3>

          {/* Color Picker */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {phrase(dictionary, "editor_color", language)}
            </label>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool("brush");
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c && tool === "brush"
                      ? "border-white scale-110"
                      : "border-transparent hover:border-gray-500"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center bg-gray-700 rounded-md border border-gray-600 p-1">
              <div
                className="w-6 h-6 rounded-sm mr-2"
                style={{ backgroundColor: color }}
              ></div>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="bg-transparent text-gray-300 text-sm font-mono w-full focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Brush Size */}
          <div className="mb-4">
            <label className="block text-gray-400 text-sm font-medium mb-2">
              {phrase(dictionary, "editor_brush_size", language)}: {brushSize}px
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#DB2777]"
            />
          </div>

          {/* Tools */}
          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={handleUndo}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Undo2 className="w-4 h-4" /> {phrase(dictionary, "editor_undo", language)}
            </button>
            <button
              onClick={handleClear}
              className="w-full py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/30 rounded-lg text-red-300 font-medium transition-colors text-sm"
            >
              {phrase(dictionary, "editor_clear_all", language)}
            </button>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setTool("brush")}
                className={`flex-1 py-2 text-xs rounded flex items-center justify-center gap-1 ${
                  tool === "brush"
                    ? "bg-[#DB2777] text-white font-bold"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                <Brush className="w-4 h-4" /> {phrase(dictionary, "editor_brush", language)}
              </button>
              <button
                onClick={() => setTool("eraser")}
                className={`flex-1 py-2 text-xs rounded flex items-center justify-center gap-1 ${
                  tool === "eraser"
                    ? "bg-[#DB2777] text-white font-bold"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                <Eraser className="w-4 h-4" /> {phrase(dictionary, "editor_eraser", language)}
              </button>
            </div>
          </div>

          {/* Style Reference */}
          <div className="mb-4 flex-1">
            <label className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
              {phrase(dictionary, "editor_style_reference", language)}
              <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-500 normal-case font-normal">
                {phrase(dictionary, "editor_optional", language)}
              </span>
            </label>
            {!styleRef ? (
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-700 transition group">
                <Upload className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
                <span className="text-xs text-gray-500 mt-1 group-hover:text-gray-300">
                  {phrase(dictionary, "editor_upload_image", language)}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleStyleUpload}
                />
              </label>
            ) : (
              <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-600 group">
                <img
                  src={`data:image/jpeg;base64,${styleRef}`}
                  className="w-full h-full object-cover"
                  alt="Style Ref"
                />
                <button
                  onClick={() => setStyleRef(null)}
                  className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full text-white hover:bg-red-500 transition opacity-0 group-hover:opacity-100"
                  title={phrase(dictionary, "editor_remove_reference", language)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {styleRef && (
              <p className="text-[10px] text-gray-500 mt-1">
                {phrase(dictionary, "editor_style_applied", language)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto border-t border-gray-700 pt-4 flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 bg-[#DB2777] hover:bg-[#BE185D] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {isSaving ? <LoadingSpinner /> : <ImageIcon className="w-5 h-5" />}
              {isSaving ? phrase(dictionary, "editor_processing", language) : phrase(dictionary, "editor_apply_to_frame", language)}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
            >
              {phrase(dictionary, "close", language)}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 bg-gray-950 overflow-auto relative flex p-4 md:p-8"
          ref={containerRef}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair touch-none block bg-white m-auto shadow-2xl border-4 border-gray-700 max-w-full max-h-full"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  );
}
