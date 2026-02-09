"use client";

import React, { useRef, useState } from 'react';
import { Upload, Trash2, User, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import type { Asset } from './types';

interface AssetManagerProps {
  assets: Asset[];
  onAddAssets: (type: 'character' | 'background', files: FileList) => void;
  onUpdateAssetTags: (id: string, tags: string) => void;
  onDeleteAsset: (id: string) => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  assets,
  onAddAssets,
  onUpdateAssetTags,
  onDeleteAsset,
}) => {
  const charInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [showCharacters, setShowCharacters] = useState(true);
  const [showBackgrounds, setShowBackgrounds] = useState(true);

  const characters = assets.filter((a) => a.type === 'character');
  const backgrounds = assets.filter((a) => a.type === 'background');

  const handleCharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddAssets('character', e.target.files);
      e.target.value = '';
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAddAssets('background', e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Asset Manager Header */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">
          Asset Manager
        </h2>
        <p className="text-[10px] text-gray-500">
          {assets.length} assets loaded
        </p>
      </div>

      <div className="space-y-4">
        {/* Characters Section */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <button
            onClick={() => setShowCharacters(!showCharacters)}
            className="w-full flex items-center justify-between text-left mb-3"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Characters ({characters.length})
              </span>
            </div>
            {showCharacters ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {showCharacters && (
            <div className="space-y-2">
              <button
                onClick={() => charInputRef.current?.click()}
                className="w-full p-3 border-2 border-dashed border-slate-600 rounded-xl hover:border-indigo-500 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-indigo-400"
              >
                <Upload className="w-4 h-4" />
                <span className="text-xs font-bold">Add Characters</span>
              </button>
              <input
                ref={charInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleCharUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-2">
                {characters.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onUpdateTags={onUpdateAssetTags}
                    onDelete={onDeleteAsset}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Backgrounds Section */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <button
            onClick={() => setShowBackgrounds(!showBackgrounds)}
            className="w-full flex items-center justify-between text-left mb-3"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Backgrounds ({backgrounds.length})
              </span>
            </div>
            {showBackgrounds ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {showBackgrounds && (
            <div className="space-y-2">
              <button
                onClick={() => bgInputRef.current?.click()}
                className="w-full p-3 border-2 border-dashed border-slate-600 rounded-xl hover:border-emerald-500 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-emerald-400"
              >
                <Upload className="w-4 h-4" />
                <span className="text-xs font-bold">Add Backgrounds</span>
              </button>
              <input
                ref={bgInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleBgUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-2">
                {backgrounds.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onUpdateTags={onUpdateAssetTags}
                    onDelete={onDeleteAsset}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Asset card sub-component (compact for 2-column grid)
const AssetCard: React.FC<{
  asset: Asset;
  onUpdateTags: (id: string, tags: string) => void;
  onDelete: (id: string) => void;
}> = ({ asset, onUpdateTags, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState(asset.tags);

  const handleSave = () => {
    onUpdateTags(asset.id, editTags);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-1.5 border border-slate-700/50 group">
      <div className="relative aspect-square rounded overflow-hidden bg-black mb-1">
        <img
          src={asset.image.startsWith('data:') || asset.image.startsWith('http') ? asset.image : `data:image/jpeg;base64,${asset.image}`}
          alt={asset.tags}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => onDelete(asset.id)}
          className="absolute top-0.5 right-0.5 p-0.5 bg-red-600/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-2.5 h-2.5 text-white" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-1">
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="w-full px-1.5 py-0.5 text-[9px] bg-slate-900 border border-slate-600 rounded text-gray-200 outline-none focus:border-cyan-500"
            placeholder="Tags"
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="flex-1 px-1 py-0.5 text-[8px] bg-cyan-600 hover:bg-cyan-500 rounded font-bold"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-1 py-0.5 text-[8px] bg-slate-700 hover:bg-slate-600 rounded font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full text-left"
        >
          <p className="text-[8px] text-gray-400 font-mono truncate hover:text-cyan-400 transition-colors">
            {asset.tags || 'No tags'}
          </p>
        </button>
      )}
    </div>
  );
};
