"use client";

import React, { useState } from 'react';
import { Loader2, Download, ImageIcon, Sparkles } from 'lucide-react';
import { AssetManager } from './AssetManager';
import { generateImage, remixImage } from './services';
import { useMithril } from '../../MithrilContext';
import type { Scene, Continuity, Asset, AspectRatio } from './types';

interface GeneratorViewProps {
  scenes: Scene[];
  assets: Asset[];
  aspectRatio: AspectRatio;
  onUpdateClip: (sIdx: number, cIdx: number, updatedClip: Continuity) => void;
  onAddAssets: (type: 'character' | 'background', files: FileList) => void;
  onUpdateAssetTags: (id: string, tags: string) => void;
  onDeleteAsset: (id: string) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  scenes,
  assets,
  aspectRatio,
  onUpdateClip,
  onAddAssets,
  onUpdateAssetTags,
  onDeleteAsset,
}) => {
  const { customApiKey } = useMithril();

  return (
    <div className="flex h-full overflow-hidden bg-gray-950">
      {/* Left Sidebar: Asset Manager */}
      <AssetManager
        assets={assets}
        onAddAssets={onAddAssets}
        onUpdateAssetTags={onUpdateAssetTags}
        onDeleteAsset={onDeleteAsset}
      />

      {/* Right Content: Frame List */}
      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        {scenes.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center text-gray-500">
              <ImageIcon className="mx-auto h-16 w-16 opacity-30" />
              <p className="mt-4 text-sm font-bold">No scenes loaded</p>
              <p className="text-xs text-gray-600">
                Import a project or load from the previous stage
              </p>
            </div>
          </div>
        ) : (
          scenes.map((scene, sIdx) => (
            <SequenceGroup
              key={sIdx}
              sIdx={sIdx}
              scene={scene}
              assets={assets}
              aspectRatio={aspectRatio}
              onUpdateClip={onUpdateClip}
              customApiKey={customApiKey}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Sequence group component
const SequenceGroup: React.FC<{
  sIdx: number;
  scene: Scene;
  assets: Asset[];
  aspectRatio: AspectRatio;
  onUpdateClip: (sIdx: number, cIdx: number, updatedClip: Continuity) => void;
  customApiKey: string;
}> = ({ sIdx, scene, assets, aspectRatio, onUpdateClip, customApiKey }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <span className="bg-gray-800 text-gray-400 text-[10px] font-black px-3 py-1 rounded-full border border-gray-700 uppercase tracking-widest">
          SEQUENCE {sIdx + 1}
        </span>
        <h2 className="text-xl font-black text-gray-200 tracking-tight">
          {scene.sceneTitle}
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {scene.clips.map((clip, cIdx) => (
          <FrameCard
            key={cIdx}
            sIdx={sIdx}
            cIdx={cIdx}
            clip={clip}
            assets={assets}
            aspectRatio={aspectRatio}
            onUpdateClip={onUpdateClip}
            customApiKey={customApiKey}
          />
        ))}
      </div>
    </div>
  );
};

// Frame card component
const FrameCard: React.FC<{
  sIdx: number;
  cIdx: number;
  clip: Continuity;
  assets: Asset[];
  aspectRatio: AspectRatio;
  onUpdateClip: (sIdx: number, cIdx: number, updatedClip: Continuity) => void;
  customApiKey: string;
}> = ({ sIdx, cIdx, clip, assets, aspectRatio, onUpdateClip, customApiKey }) => {
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [remixOpenA, setRemixOpenA] = useState(false);
  const [remixOpenB, setRemixOpenB] = useState(false);
  const [remixPromptA, setRemixPromptA] = useState('');
  const [remixPromptB, setRemixPromptB] = useState('');
  const [remixLoadingA, setRemixLoadingA] = useState(false);
  const [remixLoadingB, setRemixLoadingB] = useState(false);

  // Find all relevant assets by tags matching prompt content
  const findReferenceAssets = (prompt: string) => {
    if (!prompt) return [];
    const promptLower = prompt.toLowerCase();
    return assets.filter((asset) => {
      const tags = asset.tags.split(',').map((t) => t.trim().toLowerCase());
      return tags.some((tag) => tag && promptLower.includes(tag));
    });
  };

  const shouldUseMangaRef = (isEnd: boolean) => {
    if (!clip.referenceImage) return false;
    if (!clip.imagePromptEnd) return !isEnd;
    return !isEnd;
  };

  const handleGenerate = async (isEnd: boolean) => {
    isEnd ? setLoadingB(true) : setLoadingA(true);
    try {
      const currentPrompt = isEnd ? (clip.imagePromptEnd || clip.imagePrompt) : clip.imagePrompt;
      const refAssets = findReferenceAssets(currentPrompt);
      const colorRefs = refAssets.map((a) => a.image);
      const mangaRef = shouldUseMangaRef(isEnd) ? clip.referenceImage : undefined;

      const result = await generateImage({
        prompt: currentPrompt,
        referenceImage: mangaRef,
        assetImages: colorRefs,
        aspectRatio,
        customApiKey,
      });

      const updatedClip = { ...clip };
      if (isEnd) updatedClip.generatedImageEnd = result;
      else updatedClip.generatedImage = result;

      onUpdateClip(sIdx, cIdx, updatedClip);
    } catch (err) {
      alert('Generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      isEnd ? setLoadingB(false) : setLoadingA(false);
    }
  };

  const handleRunRemix = async (isEnd: boolean) => {
    const originalImg = isEnd ? clip.generatedImageEnd : clip.generatedImage;
    if (!originalImg) return;

    isEnd ? setRemixLoadingB(true) : setRemixLoadingA(true);
    try {
      const prompt = isEnd ? remixPromptB : remixPromptA;
      const currentContext = isEnd ? (clip.imagePromptEnd || clip.imagePrompt) : clip.imagePrompt;
      const refAssets = findReferenceAssets(currentContext);
      const colorRefs = refAssets.map((a) => a.image);

      const result = await remixImage({
        originalImage: originalImg,
        remixPrompt: prompt,
        originalContext: currentContext,
        assetImages: colorRefs,
        aspectRatio,
        customApiKey,
      });

      const updatedClip = { ...clip };
      if (isEnd) updatedClip.generatedImageEnd = result;
      else updatedClip.generatedImage = result;

      onUpdateClip(sIdx, cIdx, updatedClip);
      isEnd ? setRemixOpenB(false) : setRemixOpenA(false);
    } catch (err) {
      alert('Remix failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      isEnd ? setRemixLoadingB(false) : setRemixLoadingA(false);
    }
  };

  const frameLabelA = clip.imagePromptEnd ? `${sIdx + 1}A` : `${sIdx + 1}`;
  const frameLabelB = clip.imagePromptEnd ? `${sIdx + 1}B` : null;

  const handlePromptChange = (val: string, isEnd: boolean) => {
    const updated = { ...clip };
    if (isEnd) updated.imagePromptEnd = val;
    else updated.imagePrompt = val;
    onUpdateClip(sIdx, cIdx, updated);
  };

  // Helper to determine aspect ratio style
  const getContainerAspectStyle = () => {
    if (aspectRatio === '16:9') return { aspectRatio: '16/9' };
    if (aspectRatio === '9:16') return { aspectRatio: '9/16' };
    if (aspectRatio === '1:1') return { aspectRatio: '1/1' };
    return { aspectRatio: '16/9' };
  };

  const renderFrameSection = (isEnd: boolean) => {
    const prompt = isEnd ? clip.imagePromptEnd : clip.imagePrompt;
    const generated = isEnd ? clip.generatedImageEnd : clip.generatedImage;
    const loading = isEnd ? loadingB : loadingA;
    const remixOpen = isEnd ? remixOpenB : remixOpenA;
    const setRemixOpen = isEnd ? setRemixOpenB : setRemixOpenA;
    const remixPrompt = isEnd ? remixPromptB : remixPromptA;
    const setRemixPrompt = isEnd ? setRemixPromptB : setRemixPromptA;
    const label = isEnd ? frameLabelB : frameLabelA;
    const subLabel = `#${String(cIdx + 1).padStart(3, '0')}${isEnd ? 'B' : frameLabelB ? 'A' : ''}`;

    const refAssets = findReferenceAssets(prompt || '');
    const colorRef = refAssets[0]?.image;
    const mangaRefToShow = shouldUseMangaRef(isEnd)
      ? clip.referenceImage
      : undefined;
    const referenceToShow = mangaRefToShow || colorRef;

    return (
      <div
        className={`space-y-4 flex flex-col ${isEnd ? 'border-l border-gray-800/50 pl-6' : ''}`}
      >
        {/* Image preview area */}
        <div
          style={getContainerAspectStyle()}
          className="w-full bg-gray-950 rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center relative shadow-inner"
        >
          {loading && (
            <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          )}
          {generated ? (
            <img
              src={
                generated.startsWith('data:')
                  ? generated
                  : `data:image/jpeg;base64,${generated}`
              }
              className="w-full h-full object-cover"
              alt="Generated"
            />
          ) : referenceToShow ? (
            <img
              src={
                referenceToShow.startsWith('data:')
                  ? referenceToShow
                  : `data:image/jpeg;base64,${referenceToShow}`
              }
              className="w-full h-full object-cover opacity-30 blur-[1px]"
              alt="Reference"
            />
          ) : (
            <div className="text-gray-700 flex flex-col items-center space-y-2">
              <ImageIcon className="w-8 h-8 opacity-20" />
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-30">
                Waiting
              </span>
            </div>
          )}
        </div>

        {/* Controls row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="bg-cyan-900/40 text-cyan-400 font-black text-[10px] px-2 py-1 rounded border border-cyan-800/50 uppercase">
              {label}
            </span>
            <span className="text-yellow-500/80 font-mono text-[10px] font-bold">
              {subLabel}
            </span>
            {refAssets.length > 0 && (
              <span className="text-[8px] bg-indigo-900/30 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40 uppercase font-black">
                {refAssets.length} Assets Found
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-600 transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleGenerate(isEnd)}
              className="px-6 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black rounded-lg transition-all shadow-lg active:scale-95 uppercase tracking-tighter"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Image prompt textarea */}
        <div className="space-y-1">
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
            Image Prompt
          </span>
          <textarea
            value={prompt || ''}
            onChange={(e) => handlePromptChange(e.target.value, isEnd)}
            className="w-full p-3 bg-gray-950/50 border border-gray-800 rounded-lg text-[11px] text-gray-400 min-h-[60px] leading-relaxed outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
          />
        </div>

        {/* Remix panel toggle */}
        {!remixOpen ? (
          <button
            onClick={() => setRemixOpen(true)}
            className="w-full py-2.5 bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 text-[10px] font-black border border-purple-800/40 rounded-xl transition-all uppercase"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            Open Remix / In-Between
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-purple-900/10 border border-purple-800/30 rounded-2xl">
            <button
              onClick={() => setRemixOpen(false)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black rounded-lg transition-colors uppercase tracking-tight"
            >
              CLOSE REMIX PANEL
            </button>
            <div className="space-y-2">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                Remix Prompt
              </span>
              <textarea
                value={remixPrompt}
                onChange={(e) => setRemixPrompt(e.target.value)}
                placeholder="Enter changes or in-between action..."
                className="w-full p-3 bg-gray-950 border border-purple-800/40 rounded-xl text-[11px] text-gray-200 outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none transition-all shadow-inner"
              />
              <button
                onClick={() => handleRunRemix(isEnd)}
                disabled={!generated}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-black rounded-lg transition-all disabled:opacity-30 flex items-center justify-center space-x-2 shadow-xl shadow-purple-900/20 uppercase tracking-tighter"
              >
                <span>RUN REMIX</span>
              </button>
            </div>
          </div>
        )}

        {/* Background info row */}
        <div className="flex gap-2 mt-auto">
          <div className="flex-1 flex items-center bg-gray-950/80 border border-gray-800 rounded-lg px-3 py-2 space-x-2">
            <span className="text-[9px] text-gray-600 font-black uppercase">
              BG
            </span>
            <input
              type="text"
              value={clip.backgroundId}
              readOnly
              className="bg-transparent border-none text-[11px] text-cyan-600/70 font-mono focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center space-x-2 bg-gray-950/80 border border-gray-800 rounded-lg px-3">
            <span className="text-[10px] text-gray-700 font-black">Ref#</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 space-y-6 backdrop-blur-sm">
      <div className={`grid gap-6 ${frameLabelB ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {renderFrameSection(false)}
        {frameLabelB && renderFrameSection(true)}
      </div>
    </div>
  );
};
