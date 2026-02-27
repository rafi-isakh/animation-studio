"use client";

import { Wand2, Upload, Download, Plus, Key, Eye, EyeOff } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useBgGenerator } from "./hooks/useBgGenerator";
import InputView from "./components/InputView";
import GalleryView from "./components/GalleryView";
import EditPromptDialog from "./components/EditPromptDialog";

export default function BgGeneratorPage() {
  const bg = useBgGenerator();
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-[#DB2777]/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => bg.setView("input")}
          >
            <div className="w-8 h-8 bg-[#DB2777] rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              BG World Builder
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* API Key Input */}
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-500" />
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={bg.apiKey}
                  onChange={(e) => bg.setApiKey(e.target.value)}
                  placeholder="Gemini API Key"
                  className="w-40 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 pr-8 text-xs text-zinc-300 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showApiKey ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2 mr-2">
              <button
                onClick={() => bg.importInputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Import
              </button>
              <input
                type="file"
                accept=".json"
                ref={bg.importInputRef}
                className="hidden"
                onChange={bg.importProject}
              />
              <button
                onClick={bg.exportProject}
                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export
              </button>
            </div>
            {bg.view === "gallery" && (
              <button
                onClick={() => bg.setView("input")}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 py-2 px-4 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100"
              >
                <Plus className="w-4 h-4 mr-2" /> New Batch
              </button>
            )}
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider hidden sm:block">
              v1.0.0 • Gemini Powered
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {bg.view === "input" && (
            <InputView
              style={bg.style}
              onStyleChange={bg.setStyle}
              modelProvider={bg.modelProvider}
              onModelProviderChange={bg.setModelProvider}
              prompts={bg.prompts}
              isGlobalGenerating={bg.isGlobalGenerating}
              fileInputRefs={bg.fileInputRefs}
              bulkInputRef={bg.bulkInputRef}
              onAddSlot={bg.addPromptSlot}
              onRemoveSlot={bg.removePromptSlot}
              onUpdatePromptText={bg.updatePromptText}
              onImageUpload={bg.handleFrontImageUpload}
              onImageRemove={bg.removeFrontImage}
              onBulkUpload={bg.handleBulkUpload}
              onGenerate={bg.handleGenerateFrontViews}
            />
          )}

          {bg.view === "gallery" && (
            <GalleryView
              items={bg.items}
              modelProvider={bg.modelProvider}
              frameworkGuide={bg.frameworkGuide}
              frameworkInputRef={bg.frameworkInputRef}
              galleryFileInputRefs={bg.galleryFileInputRefs}
              onFrameworkUpload={bg.handleFrameworkUpload}
              onGenerateAllBackViews={bg.handleGenerateAllBackViews}
              onDeleteItem={bg.handleDeleteItem}
              onGenerateTimeVariant={bg.handleGenerateTimeVariant}
              onReplaceFrontImage={bg.handleReplaceFrontImage}
              onRegenerateFront={bg.handleRegenerateFrontView}
              onGenerateBack={bg.handleGenerateBackView}
              onSelectBackImage={bg.setSelectedBackImageIndex}
              onDownload={bg.downloadImage}
            />
          )}
        </AnimatePresence>

        {/* Edit Prompt Dialog */}
        <EditPromptDialog
          editingItem={bg.editingItem}
          onClose={() => bg.setEditingItem(null)}
          onPromptChange={(prompt) =>
            bg.setEditingItem(
              bg.editingItem ? { ...bg.editingItem, prompt } : null
            )
          }
          onConfirm={bg.confirmRegenerateFrontView}
        />
      </main>
    </div>
  );
}
