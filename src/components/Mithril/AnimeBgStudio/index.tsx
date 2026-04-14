"use client";

import { useState, useCallback } from "react";
import { Camera, Paintbrush, Globe } from "lucide-react";
import AnimeBgStudioPage from "@/components/Tools/AnimeBgStudio/AnimeBgStudioPage";
import ThreeDScreenshotPage from "@/components/Tools/3dScreenshot/3dScreenshotPage";
import BgGeneratorPage from "@/components/Tools/BgGenerator/BgGeneratorPage";
import type { RenderResult } from "@/components/Tools/3dScreenshot/types";
import type { WorkspaceImage } from "@/components/Tools/AnimeBgStudio/types";

type Tab = "world-generator" | "screenshot" | "workspace";

export default function AnimeBgStudioStage() {
  const [activeTab, setActiveTab] = useState<Tab>("world-generator");
  const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([]);

  const addToWorkspace = useCallback((images: WorkspaceImage[]) => {
    setWorkspaceImages((prev) => [...prev, ...images]);
    setActiveTab("workspace");
  }, []);

  const handleScreenshotsReady = useCallback((results: RenderResult[]) => {
    addToWorkspace(results.map((r) => ({
      id: crypto.randomUUID(),
      originalDataUrl: r.image,
      prompt: "",
      status: "idle" as const,
    })));
  }, [addToWorkspace]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "world-generator", label: "3D World Generator", icon: <Globe className="w-4 h-4" /> },
    { key: "screenshot",      label: "3D Screenshot",      icon: <Camera className="w-4 h-4" /> },
    { key: "workspace",       label: "BG Generator",       icon: <Paintbrush className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab switcher */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-[#DB2777] border-b-2 border-[#DB2777]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "workspace" && workspaceImages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#DB2777]/20 text-[#DB2777] rounded-full">
                {workspaceImages.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className={activeTab === "world-generator" ? "h-full" : "hidden"}>
          <BgGeneratorPage embedded onImagesReady={addToWorkspace} />
        </div>
        <div className={activeTab === "screenshot" ? "h-full" : "hidden"}>
          <ThreeDScreenshotPage embedded onScreenshotsReady={handleScreenshotsReady} />
        </div>
        <div className={activeTab === "workspace" ? "h-full" : "hidden"}>
          <AnimeBgStudioPage embedded initialImages={workspaceImages} />
        </div>
      </div>
    </div>
  );
}
