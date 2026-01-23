"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Scissors, Loader2, Check, AlertCircle, Download, FileJson } from "lucide-react";
import JSZip from "jszip";
import { useMithril } from "../../MithrilContext";

// Types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';
export type ReadingDirection = 'rtl' | 'ltr';

export interface MangaPanel {
  id: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  label?: string;
  imageUrl?: string; // Cropped base64 image
}

export interface MangaPage {
  id: string;
  file?: File;
  previewUrl: string;
  fileName: string;
  panels: MangaPanel[];
  status: ProcessingStatus;
  readingDirection: ReadingDirection;
}

export default function ImageSplitter() {
  const { setStageResult } = useMithril();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pages, setPages] = useState<MangaPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [readingDirection, setReadingDirection] = useState<ReadingDirection>('rtl');
  const [processingStats, setProcessingStats] = useState<{ duration: string; pageCount: number; panelCount: number } | null>(null);

  // Check if filename is an image
  const isImageFile = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
    const lowerName = filename.toLowerCase();
    return imageExtensions.some(ext => lowerName.endsWith(ext));
  };

  // Get MIME type from filename
  const getMimeType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  };

  // Extract images from ZIP file
  const extractImagesFromZip = async (zipFile: File): Promise<MangaPage[]> => {
    const zip = await JSZip.loadAsync(zipFile);
    const extractedPages: MangaPage[] = [];

    // Get all image files from ZIP, sorted by name for correct page order
    const imageFiles = Object.keys(zip.files)
      .filter(filename => {
        const file = zip.files[filename];
        // Skip directories and hidden files (like __MACOSX)
        return !file.dir && !filename.startsWith('__') && !filename.includes('/__') && isImageFile(filename);
      })
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    for (const filename of imageFiles) {
      const zipEntry = zip.files[filename];
      const blob = await zipEntry.async('blob');
      const mimeType = getMimeType(filename);
      const file = new File([blob], filename.split('/').pop() || filename, { type: mimeType });

      extractedPages.push({
        id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file: file,
        previewUrl: URL.createObjectURL(blob),
        fileName: file.name,
        panels: [],
        status: 'pending',
        readingDirection: readingDirection,
      });
    }

    return extractedPages;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPages: MangaPage[] = [];
    const fileList = Array.from(files);

    for (const file of fileList) {
      // Handle ZIP files
      if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip')) {
        try {
          const extractedPages = await extractImagesFromZip(file);
          newPages.push(...extractedPages);
        } catch (error) {
          console.error('Failed to extract ZIP file:', error);
        }
        continue;
      }

      // Handle image files
      if (file.type.startsWith('image/')) {
        newPages.push({
          id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file: file,
          previewUrl: URL.createObjectURL(file),
          fileName: file.name,
          panels: [],
          status: 'pending',
          readingDirection: readingDirection,
        });
      }
    }

    if (newPages.length > 0) {
      setPages(prev => [...prev, ...newPages]);
      // Reset stats when new files are added
      setProcessingStats(null);
    }

    // Reset input
    event.target.value = '';
  }, [readingDirection]);

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Crop panel from image using canvas
  const cropPanel = async (imageUrl: string, box_2d: number[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // box_2d is [ymin, xmin, ymax, xmax] in 0-1000 scale
        const [ymin, xmin, ymax, xmax] = box_2d;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        // Convert 0-1000 scale to actual pixel coordinates
        const x = Math.floor((xmin / 1000) * imgWidth);
        const y = Math.floor((ymin / 1000) * imgHeight);
        const width = Math.floor(((xmax - xmin) / 1000) * imgWidth);
        const height = Math.floor(((ymax - ymin) / 1000) * imgHeight);

        // Create canvas and crop
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

        // Convert to base64 (without data URL prefix)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = imageUrl;
    });
  };

  // Start processing pending pages
  const startProcessing = async () => {
    const pendingPages = pages.filter(p => p.status === 'pending');
    if (pendingPages.length === 0) return;

    setProcessingStats(null);
    setIsProcessing(true);
    setProgress({ current: 0, total: pendingPages.length });

    const startTime = Date.now();

    // Create a copy of pages for updating
    let updatedPages = [...pages];

    for (let i = 0; i < updatedPages.length; i++) {
      const page = updatedPages[i];
      if (page.status !== 'pending') continue;

      // Update status to processing
      setPages(prev => prev.map(p =>
        p.id === page.id ? { ...p, status: 'processing' as ProcessingStatus } : p
      ));

      try {
        if (!page.file) {
          throw new Error('No file available for processing');
        }

        // Convert file to base64
        const base64Image = await fileToBase64(page.file);

        // Call API to detect panels
        const response = await fetch('/api/manga/split-panels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            readingDirection: page.readingDirection,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to detect panels');
        }

        const data = await response.json();
        const detectedPanels: MangaPanel[] = data.panels || [];

        // Crop each panel and store as base64
        const panelsWithImages: MangaPanel[] = await Promise.all(
          detectedPanels.map(async (panel) => {
            try {
              const croppedImage = await cropPanel(page.previewUrl, panel.box_2d);
              return { ...panel, imageUrl: croppedImage };
            } catch (cropError) {
              console.warn(`Failed to crop panel ${panel.id}:`, cropError);
              return panel; // Return panel without cropped image
            }
          })
        );

        // Update status to completed with detected panels
        updatedPages = updatedPages.map(p =>
          p.id === page.id ? { ...p, status: 'completed' as ProcessingStatus, panels: panelsWithImages } : p
        );
        setPages(updatedPages);

        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      } catch (error) {
        console.error('Error processing page:', error);
        updatedPages = updatedPages.map(p =>
          p.id === page.id ? { ...p, status: 'error' as ProcessingStatus } : p
        );
        setPages(updatedPages);
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }
    }

    setIsProcessing(false);

    // Calculate processing stats
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const durationMinutes = (durationMs / 60000).toFixed(2);
    const completedPages = updatedPages.filter(p => p.status === 'completed');
    const totalPanels = completedPages.reduce((acc, p) => acc + p.panels.length, 0);

    setProcessingStats({
      duration: durationMinutes,
      pageCount: pendingPages.length,
      panelCount: totalPanels,
    });

    // Save result to stage results for next stage
    setStageResult(1, { pages: completedPages });
  };

  // Remove a page
  const removePage = (id: string) => {
    setPages(prev => {
      const page = prev.find(p => p.id === id);
      if (page?.previewUrl) {
        URL.revokeObjectURL(page.previewUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  // Download panels as ZIP file
  const downloadZip = async () => {
    const completedPages = pages.filter(p => p.status === 'completed' && p.panels.length > 0);
    if (completedPages.length === 0) return;

    const zip = new JSZip();
    let hasContent = false;

    completedPages.forEach((page) => {
      page.panels.forEach((panel, idx) => {
        if (panel.imageUrl) {
          // Remove data URL prefix if present, otherwise use as-is
          const base64Data = panel.imageUrl.includes(',')
            ? panel.imageUrl.split(',')[1]
            : panel.imageUrl;

          // Create filename: sourcepage_panelnum.jpg
          const baseName = page.fileName.replace(/\.[^/.]+$/, ''); // Remove extension
          const filename = `${baseName}_panel_${String(idx + 1).padStart(2, '0')}.jpg`;

          zip.file(filename, base64Data, { base64: true });
          hasContent = true;
        }
      });
    });

    if (hasContent) {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manga_panels.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Export panels as JSON (with images for storyboard apps)
  const exportJSON = () => {
    const completedPages = pages.filter(p => p.status === 'completed' && p.panels.length > 0);
    if (completedPages.length === 0) return;

    const exportData = {
      meta: {
        app: "Toonyz Mithril",
        version: "1.0",
        exportedAt: new Date().toISOString(),
        totalPages: completedPages.length,
        totalPanels: completedPages.reduce((acc, p) => acc + p.panels.length, 0)
      },
      // Flat storyboard format for easy import into other apps
      storyboard: completedPages.flatMap((page, pageIdx) =>
        page.panels.map((panel, panelIdx) => ({
          id: panel.id,
          sourcePage: page.fileName,
          pageOrder: pageIdx + 1,
          panelOrder: panelIdx + 1,
          readingDirection: page.readingDirection,
          box_2d: panel.box_2d,
          label: panel.label,
          imageBase64: panel.imageUrl, // Include base64 image
        }))
      ),
      // Also include page-grouped format
      pages: completedPages.map((page, pageIdx) => ({
        fileName: page.fileName,
        pageOrder: pageIdx + 1,
        readingDirection: page.readingDirection,
        panels: page.panels.map((panel, panelIdx) => ({
          id: panel.id,
          panelOrder: panelIdx + 1,
          box_2d: panel.box_2d,
          label: panel.label,
          imageBase64: panel.imageUrl,
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manga_panels_sequence.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasResults = pages.some(p => p.panels.length > 0);
  const pendingCount = pages.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Manga Panel Splitter</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Upload manga/comic pages to automatically detect and split into individual panels
        </p>
      </div>

      {/* Reading Direction Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Reading Direction:</span>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setReadingDirection('rtl')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              readingDirection === 'rtl'
                ? 'bg-[#DB2777] text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            RTL (Manga)
          </button>
          <button
            onClick={() => setReadingDirection('ltr')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              readingDirection === 'ltr'
                ? 'bg-[#DB2777] text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            LTR (Comic)
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-[#DB2777] transition-colors"
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Drag and drop manga pages here, or click to upload
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Supports: JPG, PNG, WebP, ZIP
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.zip,application/zip"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-[#DB2777]">Processing...</span>
            <span className="text-sm text-gray-500">{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-[#DB2777] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={startProcessing}
          disabled={isProcessing || pendingCount === 0}
          className="px-6 py-2.5 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4" />
              Split Panels ({pendingCount} pending)
            </>
          )}
        </button>

        <button
          onClick={downloadZip}
          disabled={!hasResults}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download ZIP
        </button>

        <button
          onClick={exportJSON}
          disabled={!hasResults}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FileJson className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      {/* Processing Stats */}
      {processingStats && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center text-green-700 dark:text-green-400 text-sm">
          <Check className="w-4 h-4 mr-2" />
          <span>
            Processed <strong>{processingStats.pageCount}</strong> pages ({processingStats.panelCount} panels) in <strong>{processingStats.duration}</strong> minutes.
          </span>
        </div>
      )}

      {/* Page Grid */}
      {pages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pages.map(page => (
            <div
              key={page.id}
              className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
                page.status === 'processing' ? 'border-yellow-500 ring-2 ring-yellow-500/20' :
                page.status === 'completed' ? 'border-green-500' :
                page.status === 'error' ? 'border-red-500' :
                'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <img
                src={page.previewUrl}
                className="w-full h-40 object-cover bg-gray-100 dark:bg-gray-800"
                alt={page.fileName}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-2">
                <span className="text-xs text-white truncate">{page.fileName}</span>
                <div className="flex items-center gap-1 mt-1">
                  {page.status === 'pending' && (
                    <span className="text-gray-300 text-[10px] font-medium uppercase">Pending</span>
                  )}
                  {page.status === 'processing' && (
                    <span className="text-yellow-400 text-[10px] font-medium uppercase flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing
                    </span>
                  )}
                  {page.status === 'completed' && (
                    <span className="text-green-400 text-[10px] font-medium uppercase flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {page.panels.length} panels
                    </span>
                  )}
                  {page.status === 'error' && (
                    <span className="text-red-400 text-[10px] font-medium uppercase flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Error
                    </span>
                  )}
                </div>
              </div>
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePage(page.id);
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {pages.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-gray-400 dark:text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
