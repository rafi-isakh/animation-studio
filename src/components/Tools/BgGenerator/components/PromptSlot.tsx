"use client";

import { Trash2, Image as ImageIcon, X } from "lucide-react";

interface PromptSlotProps {
  index: number;
  text: string;
  image: string | null;
  canDelete: boolean;
  fileInputRef: (el: HTMLInputElement | null) => void;
  onTextChange: (value: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onDelete: () => void;
}

export default function PromptSlot({
  index,
  text,
  image,
  canDelete,
  fileInputRef,
  onTextChange,
  onImageUpload,
  onImageRemove,
  onDelete,
}: PromptSlotProps) {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-none w-8 pt-2 flex items-center justify-center text-zinc-500 font-mono text-sm">
        {index + 1}
      </div>

      <div className="flex-1 space-y-2">
        <textarea
          placeholder={`Describe scene ${index + 1}...`}
          className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm ring-offset-zinc-950 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2777] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100 h-20 resize-none"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
        />

        {image ? (
          <div className="relative w-full h-20 bg-zinc-900 rounded-md overflow-hidden group border border-zinc-800">
            <img
              src={image}
              alt="Uploaded"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
                Image Uploaded
              </span>
              <button
                onClick={onImageRemove}
                className="p-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              const input = document.querySelector(
                `#prompt-file-${index}`
              ) as HTMLInputElement;
              input?.click();
            }}
            className="w-full h-8 border border-dashed border-zinc-800 rounded-md flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-900 hover:border-zinc-700 transition-colors text-zinc-500 hover:text-zinc-300"
          >
            <ImageIcon className="w-3 h-3" />
            <span className="text-xs">Upload Image (Optional)</span>
            <input
              id={`prompt-file-${index}`}
              type="file"
              className="hidden"
              accept="image/*"
              ref={fileInputRef}
              onChange={onImageUpload}
            />
          </div>
        )}
      </div>

      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2777] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-zinc-950 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-20 w-10 px-0 mt-0"
        onClick={onDelete}
        disabled={!canDelete}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
