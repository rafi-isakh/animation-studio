"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import WorldCard from "./WorldCard";
import FrameworkGuideCard from "./FrameworkGuideCard";
import type { ProjectItem, TimeOfDay, ModelProvider } from "../types";

interface GalleryViewProps {
  items: ProjectItem[];
  modelProvider: ModelProvider;
  frameworkGuide: string | null;
  frameworkInputRef: React.RefObject<HTMLInputElement | null>;
  galleryFileInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onFrameworkUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateAllBackViews: () => void;
  onDeleteItem: (id: string) => void;
  onGenerateTimeVariant: (id: string, time: TimeOfDay) => void;
  onReplaceFrontImage: (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onRegenerateFront: (id: string) => void;
  onGenerateBack: (id: string) => void;
  onSelectBackImage: (id: string, index: number) => void;
  onDownload: (dataUrl: string, filename: string) => void;
  onGenerate3DWorld: (id: string) => void;
}

export default function GalleryView({
  items,
  modelProvider,
  frameworkGuide,
  frameworkInputRef,
  galleryFileInputRefs,
  onFrameworkUpload,
  onGenerateAllBackViews,
  onDeleteItem,
  onGenerateTimeVariant,
  onReplaceFrontImage,
  onRegenerateFront,
  onGenerateBack,
  onSelectBackImage,
  onDownload,
  onGenerate3DWorld,
}: GalleryViewProps) {
  const allBacksGenerated = items.every(
    (i) => i.backImages.length > 0 || !i.frontImage
  );

  return (
    <motion.div
      key="gallery"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Workspace</h2>
          <p className="text-zinc-400 text-sm">
            Generate back views to complete your worlds.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGenerateAllBackViews}
            disabled={allBacksGenerated}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 py-2 px-4 bg-[#DB2777] text-white hover:bg-[#BE185D] shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Generate All Back Views
          </button>
        </div>
      </div>

      <FrameworkGuideCard
        frameworkGuide={frameworkGuide}
        frameworkInputRef={frameworkInputRef}
        onUpload={onFrameworkUpload}
      />

      <div className="grid gap-8">
        {items.map((item, index) => (
          <WorldCard
            key={item.id}
            item={item}
            index={index}
            modelProvider={modelProvider}
            galleryFileInputRef={(el) => {
              galleryFileInputRefs.current[index] = el;
            }}
            onDelete={() => onDeleteItem(item.id)}
            onGenerateTimeVariant={(time) =>
              onGenerateTimeVariant(item.id, time)
            }
            onReplaceFrontImage={(e) => onReplaceFrontImage(item.id, e)}
            onRegenerateFront={() => onRegenerateFront(item.id)}
            onGenerateBack={() => onGenerateBack(item.id)}
            onSelectBackImage={(idx) => onSelectBackImage(item.id, idx)}
            onDownload={onDownload}
            onGenerate3DWorld={() => onGenerate3DWorld(item.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}
