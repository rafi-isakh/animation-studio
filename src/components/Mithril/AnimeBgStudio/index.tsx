"use client";

import { useState, useCallback } from "react";
import { Camera, Paintbrush } from "lucide-react";
import AnimeBgStudioPage from "@/components/Tools/AnimeBgStudio/AnimeBgStudioPage";
import ThreeDScreenshotPage from "@/components/Tools/3dScreenshot/3dScreenshotPage";
import type { RenderResult } from "@/components/Tools/3dScreenshot/types";
import type { WorkspaceImage } from "@/components/Tools/AnimeBgStudio/types";

type Tab = "screenshot" | "workspace";

export default function AnimeBgStudioStage() {
  const [activeTab, setActiveTab] = useState<Tab>("screenshot");
  const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([]);

  const handleScreenshotsReady = useCallback((results: RenderResult[]) => {
    const newImages: WorkspaceImage[] = results.map((r) => ({
      id: crypto.randomUUID(),
      originalDataUrl: r.image,
      prompt: "",
      status: "idle" as const,
    }));
    setWorkspaceImages((prev) => [...prev, ...newImages]);
    setActiveTab("workspace");
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Tab switcher */}
      <div className="flex border-b border-zinc-800 shrink-0">
        <button
          onClick={() => setActiveTab("screenshot")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "screenshot"
              ? "text-[#DB2777] border-b-2 border-[#DB2777]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Camera className="w-4 h-4" />
          3D Screenshot
        </button>
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "workspace"
              ? "text-[#DB2777] border-b-2 border-[#DB2777]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          BG Generator
          {workspaceImages.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#DB2777]/20 text-[#DB2777] rounded-full">
              {workspaceImages.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
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
