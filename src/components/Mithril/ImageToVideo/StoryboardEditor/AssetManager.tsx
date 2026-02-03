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
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden shrink-0">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-sm font-black text-gray-300 uppercase tracking-widest">
          Asset Manager
        </h2>
        <p className="text-[10px] text-gray-600 mt-1">
          {assets.length} assets loaded
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Characters Section */}
        <div className="space-y-3">
          <button
            onClick={() => setShowCharacters(!showCharacters)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-gray-400 uppercase">
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
                className="w-full p-3 border-2 border-dashed border-gray-700 rounded-xl hover:border-indigo-500 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-indigo-400"
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

              {characters.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onUpdateTags={onUpdateAssetTags}
                  onDelete={onDeleteAsset}
                />
              ))}
            </div>
          )}
        </div>

        {/* Backgrounds Section */}
        <div className="space-y-3">
          <button
            onClick={() => setShowBackgrounds(!showBackgrounds)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-gray-400 uppercase">
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
                className="w-full p-3 border-2 border-dashed border-gray-700 rounded-xl hover:border-emerald-500 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-emerald-400"
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

              {backgrounds.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onUpdateTags={onUpdateAssetTags}
                  onDelete={onDeleteAsset}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Asset card sub-component
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
    <div className="bg-gray-800/50 rounded-xl p-2 border border-gray-700/50 group">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-black mb-2">
        <img
          src={`data:image/jpeg;base64,${asset.image}`}
          alt={asset.tags}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => onDelete(asset.id)}
          className="absolute top-1 right-1 p-1 bg-red-600/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-1">
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-gray-900 border border-gray-600 rounded text-gray-200 outline-none focus:border-cyan-500"
            placeholder="Tags (comma separated)"
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="flex-1 px-2 py-1 text-[9px] bg-cyan-600 hover:bg-cyan-500 rounded font-bold"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-2 py-1 text-[9px] bg-gray-700 hover:bg-gray-600 rounded font-bold"
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
          <p className="text-[10px] text-gray-400 font-mono truncate hover:text-cyan-400 transition-colors">
            {asset.tags}
          </p>
        </button>
      )}
    </div>
  );
};
