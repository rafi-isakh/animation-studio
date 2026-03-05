"use client";

import { useRef } from "react";
import {
  Loader2,
  Sparkles,
  Download,
  ChevronDown,
  ChevronUp,
  Split,
  Upload,
  Trash2,
  ImageIcon,
  FileArchive,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useScriptWriter } from "./useScriptWriter";
import { StoryboardTable } from "./StoryboardTable";
import { GENRE_PRESETS } from "./constants";

// Re-export types for external consumers
export type { Continuity, VoicePrompt, Scene, GenerationResult } from "./types";

export default function ImageToScriptWriter() {
  const mangaInputRef = useRef<HTMLInputElement>(null);

  const {
    state,
    stage1Pages,
    totalPanels,
    hasEndPrompts,
    hasResults,
    setGenre,
    setTargetDuration,
    setSourceText,
    setConditions,
    setGuides,
    setInstructions,
    toggleConditions,
    toggleGuides,
    uploadMangaFiles,
    clearMangaImages,
    generate,
    cancel,
    clear,
    splitStartEnd,
    updateClip,
    exportCSV,
  } = useScriptWriter();

  const { config, ui, processing, mangaImages, result } = state;

  // Handle manga panel upload
  const handleMangaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      await uploadMangaFiles(files);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to upload files");
    }

    if (e.target) e.target.value = "";
  };

  // Read a .txt file into a string and call setter
  const handleFileInstruction = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setter(event.target?.result as string ?? "");
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  };

  // Handle generate
  const handleGenerate = async () => {
    try {
      await generate();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to generate storyboard");
    }
  };

  // Handle split
  const handleSplitStartEnd = async () => {
    try {
      await splitStartEnd();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to split frames");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Image to Script Writer
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Generate animation storyboard from manga panels
        </p>
      </div>

      {/* Panels Summary */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mangaImages.length > 0 ? "Imported Panels" : "Panels from Stage 1"}
            </p>
            <p className="text-2xl font-bold text-[#DB2777]">{totalPanels} panels</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mangaImages.length > 0 ? "Source" : "Pages"}
            </p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {mangaImages.length > 0 ? "Direct Import" : stage1Pages.length}
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
              onClick={clearMangaImages}
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
            <span className="text-gray-400 text-xs">(overrides Stage 1 panels)</span>
          </div>
        )}

        {/* Preview of imported images */}
        {mangaImages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-auto">
            {mangaImages.slice(0, 10).map((base64, idx) => (
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
            {mangaImages.length > 10 && (
              <div className="h-16 w-16 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                <span className="text-xs text-gray-500">+{mangaImages.length - 10}</span>
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
            value={config.targetDuration}
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
            value={config.genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {GENRE_PRESETS.map((preset) => (
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
          value={config.sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste original story text here for better context..."
          rows={4}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Instructions */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Instructions (Story Flow)
          </label>
          <textarea
            value={config.instructions.custom}
            onChange={(e) => setInstructions({ custom: e.target.value })}
            placeholder="강조하거나 누락하고 싶은 흐름을 적어주세요..."
            rows={3}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Background ID Spec (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileInstruction(e, (v) => setInstructions({ background: v }))}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
            />
            {config.instructions.background && (
              <p className="text-xs text-cyan-500 mt-1">✓ Spec loaded ({config.instructions.background.length} chars)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Negative Prompt (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileInstruction(e, (v) => setInstructions({ negative: v }))}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
            />
            {config.instructions.negative && (
              <p className="text-xs text-red-500 mt-1">✓ Spec loaded ({config.instructions.negative.length} chars)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Video Prompt Spec (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => handleFileInstruction(e, (v) => setInstructions({ video: v }))}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
            />
            {config.instructions.video && (
              <p className="text-xs text-blue-500 mt-1">✓ Spec loaded ({config.instructions.video.length} chars)</p>
            )}
          </div>
        </div>
      </div>

      {/* Conditions (Collapsible) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <button
          onClick={toggleConditions}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Generation Conditions (Advanced)
          </span>
          {ui.showConditions ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {ui.showConditions && (
          <div className="p-4 pt-0 space-y-4">
            <ConditionTextarea
              label="Story Condition"
              value={config.conditions.story}
              onChange={(v) => setConditions({ story: v })}
            />
            <ConditionTextarea
              label="Image Condition"
              value={config.conditions.image}
              onChange={(v) => setConditions({ image: v })}
            />
            <ConditionTextarea
              label="Video Condition"
              value={config.conditions.video}
              onChange={(v) => setConditions({ video: v })}
            />
            <ConditionTextarea
              label="Sound Condition"
              value={config.conditions.sound}
              onChange={(v) => setConditions({ sound: v })}
            />
          </div>
        )}
      </div>

      {/* Guide Prompts (Collapsible) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
        <button
          onClick={toggleGuides}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Style Guide Prompts (Optional)
          </span>
          {ui.showGuides ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {ui.showGuides && (
          <div className="p-4 pt-0 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Image Guide
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                Style guide to append to all image prompts (e.g., art style, color palette)
              </p>
              <textarea
                value={config.guides.image}
                onChange={(e) => setGuides({ image: e.target.value })}
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
                value={config.guides.video}
                onChange={(e) => setGuides({ video: e.target.value })}
                placeholder="e.g., smooth camera movements, cinematic style..."
                rows={2}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-end gap-4 flex-wrap">
        <button
          onClick={handleGenerate}
          disabled={processing.isGenerating || totalPanels === 0}
          className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {processing.isGenerating ? (
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

        {processing.isGenerating && (
          <button
            onClick={cancel}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Cancel
          </button>
        )}

        {hasResults && (
          <>
            <button
              onClick={handleSplitStartEnd}
              disabled={processing.isSplitting || hasEndPrompts}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={hasEndPrompts ? "Already split" : "Split image prompts into start/end frames"}
            >
              {processing.isSplitting ? (
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

            <button
              onClick={clear}
              disabled={processing.isGenerating || processing.isSplitting}
              className="px-6 py-3 bg-red-600/80 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Clear Script
            </button>
          </>
        )}
      </div>

      {/* Results */}
      <StoryboardTable
        data={result?.scenes || []}
        voicePrompts={result?.voicePrompts || []}
        hasEndPrompt={hasEndPrompts}
        onUpdateClip={updateClip}
      />
    </div>
  );
}

// Helper component for condition textareas
function ConditionTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      />
    </div>
  );
}
