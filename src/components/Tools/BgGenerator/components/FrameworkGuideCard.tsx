"use client";

import { FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FrameworkGuideCardProps {
  frameworkGuide: string | null;
  frameworkInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FrameworkGuideCard({
  frameworkGuide,
  frameworkInputRef,
  onUpload,
}: FrameworkGuideCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#DB2777]" />
            <h3 className="font-medium text-zinc-200">
              Back View Framework Guide
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Upload a .txt file containing specific rules or logic for generating
            back views. The AI will strictly follow this guide.
          </p>
          {frameworkGuide && (
            <div className="mt-3 p-3 bg-zinc-950 rounded-md border border-zinc-800">
              <p className="text-xs font-mono text-zinc-500 line-clamp-3 whitespace-pre-wrap">
                {frameworkGuide}
              </p>
            </div>
          )}
        </div>
        <div>
          <input
            type="file"
            accept=".txt"
            ref={frameworkInputRef as React.RefObject<HTMLInputElement>}
            className="hidden"
            onChange={onUpload}
          />
          <button
            onClick={() => frameworkInputRef.current?.click()}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 py-1 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100",
              frameworkGuide && "border-[#DB2777]/50 text-[#DB2777]"
            )}
          >
            <Upload className="w-3 h-3 mr-2" />
            {frameworkGuide ? "Update Guide" : "Upload .txt"}
          </button>
        </div>
      </div>
    </div>
  );
}
