"use client";

import { useState, useMemo, useRef } from "react";
import { Loader2, Sparkles, Download, ChevronDown, ChevronUp, Split, Upload, Trash2, ImageIcon, FileArchive } from "lucide-react";
import JSZip from "jszip";
import { useMithril } from "../../MithrilContext";
import type { MangaPage } from "../ImageSplitter";
import { StoryboardTable } from "./StoryboardTable";

// Types matching ver 1.1
export interface Continuity {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string; // Optional field for split frames
  videoPrompt: string;
  soraVideoPrompt: string; // Combined video and dialogue prompt for Sora
  dialogue: string;   // Character Dialogue (Korean)
  dialogueEn: string; // Character Dialogue (English)
  sfx: string;        // Sound Effects (Korean)
  sfxEn: string;      // Sound Effects (English)
  bgm: string;        // Background Music (Korean)
  bgmEn: string;      // Background Music (English)
  length: string;
  accumulatedTime: string;
  backgroundPrompt: string;
  backgroundId: string;
  referenceImage?: string; // Base64 encoded image or URL
  referenceImageIndex?: number; // Internal mapping during generation
  panelCoordinates?: number[]; // [ymin, xmin, ymax, xmax] normalized coordinates for cropping
}

export interface VoicePrompt {
  promptKo: string;
  promptEn: string;
}

export interface Scene {
  sceneTitle: string;
  clips: Continuity[];
}

export interface GenerationResult {
  scenes: Scene[];
  voicePrompts: VoicePrompt[];
}

// Genre presets
interface GenrePreset {
  id: string;
  name: string;
  description: string;
  story: string;
  image: string;
  video: string;
  sound: string;
}

const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Epic fantasy with magic and adventure',
    story: `1. Faithfully reflect the original text content while enhancing visual narrative for animation.
2. Ensure smooth scene transitions.
3. Maintain short clips (1-2 seconds) for dynamic pacing.`,
    image: `1. Maintain consistent character appearances (hair color, clothing, etc.).
2. Match shot angles with background ID guidelines.
3. Reflect the time period and atmosphere accurately.`,
    video: `1. Keep camera angles and movements concise.
2. When characters speak, include speaking animation description.
3. Use pronouns instead of character names.`,
    sound: `1. Categorize into dialogue, sound effects, and background music.
2. If manga panel has text, prioritize using it as dialogue.
3. Leave dialogue field empty for scenes without speech.`,
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Emotional romance and drama',
    story: `1. Focus on emotional beats and character expressions.
2. Include internal monologue where appropriate.
3. Emphasize meaningful glances and subtle gestures.`,
    image: `1. Soft, warm color palette for romantic moments.
2. Detailed facial expressions and body language.
3. Atmospheric lighting to enhance mood.`,
    video: `1. Slower pacing for emotional scenes.
2. Close-ups on character faces during key moments.
3. Smooth camera movements.`,
    sound: `1. Emotional background music selection.
2. Heartbeat effects for tense romantic moments.
3. Soft ambient sounds for intimate scenes.`,
  },
  {
    id: 'action',
    name: 'Action',
    description: 'Fast-paced action and battle scenes',
    story: `1. Emphasize impact and movement.
2. Break down complex actions into clear sequences.
3. Build tension through pacing.`,
    image: `1. Dynamic poses and angles.
2. Motion blur and impact effects.
3. Bold, contrasting colors for intensity.`,
    video: `1. Quick cuts for action sequences.
2. Emphasize speed lines and motion.
3. Impactful camera shakes.`,
    sound: `1. Punchy sound effects for impacts.
2. High-energy background music.
3. Character battle cries and reactions.`,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Define your own conditions',
    story: '',
    image: '',
    video: '',
    sound: '',
  },
];

// Type for imported manga images (can be File or base64 string)
type MangaImageItem = File | string;

export default function ImageToScriptWriter() {
  const { getStageResult, setStageResult } = useMithril();

  // Get panels from Stage 1
  const stage1Result = getStageResult(1) as { pages: MangaPage[] } | undefined;
  const pages = stage1Result?.pages || [];
  const totalPanelsFromStage1 = pages.reduce((acc, p) => acc + p.panels.length, 0);

  // Refs
  const mangaInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedGenre, setSelectedGenre] = useState<string>('fantasy');
  const [targetDuration, setTargetDuration] = useState('03:00');
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [showGuides, setShowGuides] = useState(false);

  // Imported manga images (alternative to Stage 1)
  const [mangaImages, setMangaImages] = useState<MangaImageItem[]>([]);
  const [convertedMangaImages, setConvertedMangaImages] = useState<string[]>([]);

  // Conditions (editable)
  const [storyCondition, setStoryCondition] = useState(GENRE_PRESETS[0].story);
  const [imageCondition, setImageCondition] = useState(GENRE_PRESETS[0].image);
  const [videoCondition, setVideoCondition] = useState(GENRE_PRESETS[0].video);
  const [soundCondition, setSoundCondition] = useState(GENRE_PRESETS[0].sound);

  // Guide prompts (for consistent style)
  const [imageGuide, setImageGuide] = useState('');
  const [videoGuide, setVideoGuide] = useState('');

  // Generated storyboard
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [voicePrompts, setVoicePrompts] = useState<VoicePrompt[]>([]);

  // Handle genre change
  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    const preset = GENRE_PRESETS.find(p => p.id === genreId);
    if (preset && genreId !== 'custom') {
      setStoryCondition(preset.story);
      setImageCondition(preset.image);
      setVideoCondition(preset.video);
      setSoundCondition(preset.sound);
    }
  };

  // Compress and resize image to reduce payload size (for Vercel's 4.5MB limit)
  const compressImage = (blob: Blob | File, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Draw to canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  // Convert File/Blob to base64 (with compression for large files)
  const blobToBase64 = async (blob: Blob | File): Promise<string> => {
    // Compress if file is larger than 100KB
    if (blob.size > 100 * 1024) {
      return compressImage(blob);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 part after the data URL prefix
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Compress base64 image string
  const compressBase64Image = (base64: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const compressedBase64 = dataUrl.split(',')[1];
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  };

  // Handle manga panel upload (images, ZIP, JSON)
  const handleMangaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: MangaImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Handle ZIP files
      if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          const imageNames = Object.keys(zip.files)
            .filter(name => name.match(/\.(jpg|jpeg|png|webp)$/i) && !zip.files[name].dir && !name.startsWith('__'))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

          for (const name of imageNames) {
            const blob = await zip.files[name].async('blob');
            const imgFile = new File([blob], name.split('/').pop() || name, { type: 'image/jpeg' });
            newImages.push(imgFile);
          }
        } catch (err) {
          console.error('Failed to extract ZIP:', err);
          alert(`Failed to extract ZIP: ${file.name}`);
        }
      }
      // Handle JSON files (can contain base64 images)
      else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        try {
          const text = await file.text();
          const json = JSON.parse(text);

          let extractedImages: string[] = [];
          if (json.mangaImages && Array.isArray(json.mangaImages)) {
            extractedImages = json.mangaImages;
          } else if (Array.isArray(json)) {
            extractedImages = json.filter((item: unknown) => typeof item === 'string');
          }

          if (extractedImages.length > 0) {
            newImages.push(...extractedImages);
          } else {
            alert(`No images found in ${file.name}`);
          }
        } catch (err) {
          console.error('JSON parsing error:', err);
          alert(`Failed to read JSON: ${file.name}`);
        }
      }
      // Handle image files
      else if (file.type.startsWith('image/')) {
        newImages.push(file);
      }
    }

    setMangaImages(prev => [...prev, ...newImages]);
    if (e.target) e.target.value = '';
  };

  // Convert manga images to base64 when they change
  useMemo(() => {
    const convertImages = async () => {
      const converted: string[] = [];
      for (const img of mangaImages) {
        if (typeof img === 'string') {
          converted.push(img);
        } else {
          const base64 = await blobToBase64(img);
          converted.push(base64);
        }
      }
      setConvertedMangaImages(converted);
    };
    convertImages();
  }, [mangaImages]);

  // Collect all panels - prefer imported manga images, fallback to Stage 1
  const allPanels = useMemo(() => {
    const panels: { id: string; imageBase64: string; label: string }[] = [];

    // If we have imported manga images, use those
    if (convertedMangaImages.length > 0) {
      convertedMangaImages.forEach((base64, idx) => {
        panels.push({
          id: `imported-${idx}`,
          imageBase64: base64,
          label: `Panel ${idx + 1}`,
        });
      });
    }
    // Otherwise, use panels from Stage 1
    else {
      pages.forEach(page => {
        page.panels.forEach(panel => {
          if (panel.imageUrl) {
            panels.push({
              id: panel.id,
              imageBase64: panel.imageUrl,
              label: panel.label || `Panel ${panels.length + 1}`,
            });
          }
        });
      });
    }

    return panels;
  }, [pages, convertedMangaImages]);

  // Total panels count
  const totalPanels = allPanels.length || totalPanelsFromStage1;

  // Generate storyboard
  const handleGenerate = async () => {
    if (totalPanels === 0) {
      alert('Please complete Stage 1 (Panel Splitter) first');
      return;
    }

    if (allPanels.length === 0) {
      alert('No panel images available. Please re-process the panels in Stage 1.');
      return;
    }

    setIsGenerating(true);

    try {
      // Compress all panel images to reduce payload size (Vercel has 4.5MB limit)
      const compressedPanels = await Promise.all(
        allPanels.map(async (panel) => {
          // Check if base64 string is large (rough estimate: 100KB = ~137K base64 chars)
          if (panel.imageBase64.length > 100000) {
            const compressed = await compressBase64Image(panel.imageBase64, 800, 0.7);
            return { ...panel, imageBase64: compressed };
          }
          return panel;
        })
      );

      // Call API to generate storyboard
      const response = await fetch('/api/manga/generate-storyboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          panels: compressedPanels,
          sourceText: sourceText || undefined,
          targetDuration,
          storyCondition,
          imageCondition,
          videoCondition,
          soundCondition,
          imageGuide: imageGuide || undefined,
          videoGuide: videoGuide || undefined,
        }),
      });

      if (!response.ok) {
        // Check for payload too large error (413) or Vercel's body size limit
        if (response.status === 413) {
          throw new Error('Request too large. Try reducing the number of panels or image quality.');
        }
        // Try to parse error response, but handle non-JSON responses
        let errorMessage = 'Failed to generate storyboard';
        const responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response is not JSON (e.g., "Request Entity Too Large" text)
          if (responseText.toLowerCase().includes('request') || responseText.toLowerCase().includes('large') || responseText.toLowerCase().includes('entity')) {
            errorMessage = 'Request too large. Try reducing the number of panels or use smaller images.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const generatedScenes: Scene[] = data.scenes || [];
      const generatedVoicePrompts: VoicePrompt[] = data.voicePrompts || [];

      // Map referenceImageIndex to actual panel images
      const updatedScenes: Scene[] = generatedScenes.map(scene => ({
        ...scene,
        clips: scene.clips.map(clip => {
          let refImage: string | undefined;
          if (clip.referenceImageIndex !== undefined &&
              clip.referenceImageIndex >= 0 &&
              clip.referenceImageIndex < allPanels.length) {
            refImage = allPanels[clip.referenceImageIndex].imageBase64;
          }
          return { ...clip, referenceImage: refImage };
        })
      }));

      setScenes(updatedScenes);
      setVoicePrompts(generatedVoicePrompts);

      // Save to stage results
      setStageResult(2, { scenes: updatedScenes, voicePrompts: generatedVoicePrompts });
    } catch (error) {
      console.error('Error generating storyboard:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate storyboard');
    } finally {
      setIsGenerating(false);
    }
  };

  // Split Start/End frames
  const handleSplitStartEnd = async () => {
    if (scenes.length === 0) return;

    setIsSplitting(true);
    try {
      const response = await fetch('/api/manga/split-start-end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to split frames');
      }

      const data = await response.json();
      const updatedScenes: Scene[] = data.scenes || [];

      setScenes(updatedScenes);
      setStageResult(2, { scenes: updatedScenes, voicePrompts });
    } catch (error) {
      console.error('Error splitting frames:', error);
      alert(error instanceof Error ? error.message : 'Failed to split frames');
    } finally {
      setIsSplitting(false);
    }
  };

  // Check if any clip has imagePromptEnd
  const hasEndPrompts = useMemo(() => {
    return scenes.some(scene => scene.clips.some(clip => !!clip.imagePromptEnd));
  }, [scenes]);

  // Export CSV (full version with all fields)
  const exportCSV = (textOnly: boolean = false) => {
    if (scenes.length === 0) return;

    const escapeCSV = (val: unknown) => {
      const str = (val === null || val === undefined) ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Scene', 'Clip', 'Length', 'Accumulated Time', 'Background ID', 'Background Prompt',
      ...(textOnly ? [] : ['Reference Image']),
      'Story', 'Image Prompt (Start)',
      ...(hasEndPrompts ? ['Image Prompt (End)'] : []),
      'Video Prompt', 'Sora Video Prompt', 'Dialogue (Ko)', 'Dialogue (En)',
      'SFX (Ko)', 'SFX (En)', 'BGM (Ko)', 'BGM (En)'
    ];

    const rows = scenes.flatMap((scene, sIdx) =>
      scene.clips.map((clip, cIdx) => {
        const row = [
          escapeCSV(`Scene ${sIdx + 1}: ${scene.sceneTitle}`),
          escapeCSV(`${sIdx + 1}-${cIdx + 1}`),
          escapeCSV(clip.length),
          escapeCSV(clip.accumulatedTime),
          escapeCSV(clip.backgroundId),
          escapeCSV(clip.backgroundPrompt),
        ];

        if (!textOnly) {
          const ref = clip.referenceImage || "";
          row.push(escapeCSV(ref.startsWith('blob:') ? "[Image Blob]" : ref));
        }

        row.push(
          escapeCSV(clip.story),
          escapeCSV(clip.imagePrompt)
        );

        if (hasEndPrompts) row.push(escapeCSV(clip.imagePromptEnd || ""));

        row.push(
          escapeCSV(clip.videoPrompt),
          escapeCSV(clip.soraVideoPrompt),
          escapeCSV(clip.dialogue),
          escapeCSV(clip.dialogueEn),
          escapeCSV(clip.sfx),
          escapeCSV(clip.sfxEn),
          escapeCSV(clip.bgm),
          escapeCSV(clip.bgmEn)
        );
        return row.join(',');
      })
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = textOnly ? 'storyboard_text_only.csv' : 'storyboard_full.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Image to Script Writer</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Generate animation storyboard from manga panels
        </p>
      </div>

      {/* Panels Summary */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mangaImages.length > 0 ? 'Imported Panels' : 'Panels from Stage 1'}
            </p>
            <p className="text-2xl font-bold text-[#DB2777]">{totalPanels} panels</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mangaImages.length > 0 ? 'Source' : 'Pages'}
            </p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {mangaImages.length > 0 ? 'Direct Import' : pages.length}
            </p>
          </div>
        </div>
        {totalPanels === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            Upload panels below or complete the Panel Splitter stage first
          </p>
        )}
      </div>

      {/* Manga Panel Import */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Import Manga Panels (Images, ZIP, JSON)
            </span>
          </div>
          {mangaImages.length > 0 && (
            <button
              onClick={() => setMangaImages([])}
              className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Click to upload or drag & drop
              </span>
            </div>
            <input
              ref={mangaInputRef}
              type="file"
              multiple
              accept="image/*,.zip,.json"
              onChange={handleMangaUpload}
              className="hidden"
            />
          </label>
        </div>

        {mangaImages.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <ImageIcon className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">
              {mangaImages.length} panels loaded
            </span>
            <span className="text-gray-400 text-xs">
              (overrides Stage 1 panels)
            </span>
          </div>
        )}

        {/* Preview of imported images */}
        {convertedMangaImages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-auto">
            {convertedMangaImages.slice(0, 10).map((base64, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={`data:image/jpeg;base64,${base64}`}
                  alt={`Panel ${idx + 1}`}
                  className="h-16 w-auto rounded border border-gray-300 dark:border-gray-600 object-cover"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                  {idx + 1}
                </span>
              </div>
            ))}
            {convertedMangaImages.length > 10 && (
              <div className="h-16 w-16 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                <span className="text-xs text-gray-500">+{convertedMangaImages.length - 10}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Target Duration (MM:SS)
          </label>
          <input
            type="text"
            value={targetDuration}
            onChange={(e) => setTargetDuration(e.target.value)}
            placeholder="03:00"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Genre Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Genre Preset
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {GENRE_PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name} - {preset.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Source Text (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Source Text (Optional)
        </label>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste original story text here for better context..."
          rows={4}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Conditions (Collapsible) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <button
          onClick={() => setShowConditions(!showConditions)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Generation Conditions (Advanced)
          </span>
          {showConditions ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showConditions && (
          <div className="p-4 pt-0 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Story Condition
              </label>
              <textarea
                value={storyCondition}
                onChange={(e) => setStoryCondition(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Image Condition
              </label>
              <textarea
                value={imageCondition}
                onChange={(e) => setImageCondition(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Video Condition
              </label>
              <textarea
                value={videoCondition}
                onChange={(e) => setVideoCondition(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Sound Condition
              </label>
              <textarea
                value={soundCondition}
                onChange={(e) => setSoundCondition(e.target.value)}
                rows={3}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Guide Prompts (Collapsible) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <button
          onClick={() => setShowGuides(!showGuides)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Style Guide Prompts (Optional)
          </span>
          {showGuides ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showGuides && (
          <div className="p-4 pt-0 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Image Guide
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                Style guide to append to all image prompts (e.g., art style, color palette)
              </p>
              <textarea
                value={imageGuide}
                onChange={(e) => setImageGuide(e.target.value)}
                placeholder="e.g., anime style, soft lighting, pastel colors..."
                rows={2}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Video Guide
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                Style guide to append to all video prompts (e.g., camera movement style)
              </p>
              <textarea
                value={videoGuide}
                onChange={(e) => setVideoGuide(e.target.value)}
                placeholder="e.g., smooth camera movements, cinematic style..."
                rows={2}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-center gap-4 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || totalPanels === 0}
          className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Storyboard...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Storyboard
            </>
          )}
        </button>

        {scenes.length > 0 && (
          <>
            <button
              onClick={handleSplitStartEnd}
              disabled={isSplitting || hasEndPrompts}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={hasEndPrompts ? "Already split" : "Split image prompts into start/end frames"}
            >
              {isSplitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Splitting...
                </>
              ) : (
                <>
                  <Split className="w-5 h-5" />
                  Split Start/End
                </>
              )}
            </button>

            <button
              onClick={() => exportCSV(false)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>

            <button
              onClick={() => exportCSV(true)}
              className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              CSV (Text Only)
            </button>
          </>
        )}
      </div>

      {/* Results */}
      <StoryboardTable
        data={scenes}
        voicePrompts={voicePrompts}
        hasEndPrompt={hasEndPrompts}
        onUpdateClip={(sceneIndex, clipIndex, changes) => {
          const updatedScenes = scenes.map((scene, sIdx) => {
            if (sIdx !== sceneIndex) return scene;
            return {
              ...scene,
              clips: scene.clips.map((clip, cIdx) => {
                if (cIdx !== clipIndex) return clip;
                return { ...clip, ...changes };
              })
            };
          });
          setScenes(updatedScenes);
          setStageResult(2, { scenes: updatedScenes, voicePrompts });
        }}
      />
    </div>
  );
}
