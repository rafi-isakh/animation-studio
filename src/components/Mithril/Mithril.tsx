"use client";

import { useMemo, useState, useEffect } from "react";
import { Key, Eye, EyeOff, Clock, Download, RotateCcw } from "lucide-react";
import UploadManager from "./UploadManager";
import StorySplitter from "./StorySplitter";
import CharacterSheetGenerator from "./CharacterSheetGenerator";
import StoryboardGenerator from "./StoryboardGenerator";
import PropDesigner from "./PropDesigner";
import BgSheetGenerator from "./BgSheetGenerator";
import ImageGenerator from "./ImageGenerator";
import VideoGenerator from "./VideoGenerator";
import { MithrilProvider, useMithril } from "./MithrilContext";
import { CostProvider, useCostTracker } from "./CostContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

// Cost Tracker Dashboard Component
function CostTrackerDashboard() {
  const {
    isClockedIn,
    isSessionEnded,
    totalCost,
    textCost,
    textCount,
    imageCost,
    imageCount,
    clockIn,
    clockOut,
    restartSession,
    downloadInvoice
  } = useCostTracker();

  return (
    <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700 shadow-inner">
      {/* Display Stats */}
      <div className="flex gap-4 px-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Cost</span>
          <span className={`font-mono font-black ${isClockedIn ? 'text-green-400' : 'text-slate-200'}`}>
            ${totalCost.toFixed(3)}
          </span>
        </div>
        {(isClockedIn || isSessionEnded) && (
          <>
            <div className="flex flex-col border-l border-slate-600 pl-3">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Text</span>
              <span className="font-mono text-xs text-amber-300">{textCount} (${textCost.toFixed(3)})</span>
            </div>
            <div className="flex flex-col border-l border-slate-600 pl-3">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Images</span>
              <span className="font-mono text-xs text-cyan-300">{imageCount} (${imageCost.toFixed(3)})</span>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isClockedIn && !isSessionEnded && (
          <button
            onClick={clockIn}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            CLOCK IN
          </button>
        )}

        {isClockedIn && (
          <button
            onClick={clockOut}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all animate-pulse"
          >
            CLOCK OUT
          </button>
        )}

        {isSessionEnded && (
          <div className="flex gap-2">
            <button
              onClick={downloadInvoice}
              className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              INVOICE
            </button>
            <button
              onClick={restartSession}
              className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              RESTART
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MithrilContent() {
  const { currentStage, setCurrentStage, goToNextStage, goToPreviousStage, customApiKey, setCustomApiKey, videoApiKey, setVideoApiKey } =
    useMithril();
  const { language, dictionary } = useLanguage();

  // API key visibility toggles
  const [showApiKey, setShowApiKey] = useState(false);
  const [showVideoApiKey, setShowVideoApiKey] = useState(false);

  // Track scroll position to adjust stepper position
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Header height is roughly 56px (top-14 = 3.5rem = 56px)
      setScrolled(window.scrollY > 56);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stageColors: Record<number, { bg: string; text: string; ring: string }> = {
    1: { bg: 'bg-yellow-500', text: 'text-yellow-500', ring: 'ring-yellow-500/30' },
    2: { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500/30' },
    3: { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500/30' },
    4: { bg: 'bg-purple-500', text: 'text-purple-500', ring: 'ring-purple-500/30' },
    5: { bg: 'bg-teal-500', text: 'text-teal-500', ring: 'ring-teal-500/30' },
    6: { bg: 'bg-indigo-500', text: 'text-indigo-500', ring: 'ring-indigo-500/30' },
    7: { bg: 'bg-sky-500', text: 'text-sky-500', ring: 'ring-sky-500/30' },
    8: { bg: 'bg-green-500', text: 'text-green-500', ring: 'ring-green-500/30' },
  };

  const stages = useMemo(
    () => [
      { id: 1, label: phrase(dictionary, "mithril_stage1", language) },
      { id: 2, label: phrase(dictionary, "mithril_stage2", language) },
      { id: 3, label: phrase(dictionary, "mithril_stage3", language) },
      { id: 4, label: phrase(dictionary, "mithril_stage4", language) },
      { id: 5, label: "Prop Designer" }, // New stage for prop detection
      { id: 6, label: phrase(dictionary, "mithril_stage5", language) }, // Was stage 5: BgSheet
      { id: 7, label: phrase(dictionary, "mithril_stage6", language) }, // Was stage 6: ImageGen
      { id: 8, label: phrase(dictionary, "mithril_stage7", language) }, // Was stage 7: VideoGen
    ],
    [dictionary, language]
  );

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Stepper - Fixed at top */}
      <div
        className={`w-full overflow-x-auto p-4 fixed left-0 right-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm md:pl-[72px] transition-[top] duration-200 ${
          scrolled ? "top-0" : "top-14"
        }`}
      >
        <div className="flex items-center justify-center min-w-max px-4">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              {/* Stage Circle */}
              <button
                onClick={() => setCurrentStage(stage.id)}
                className="flex flex-col items-center group"
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-200 cursor-pointer
                    ${
                      stage.id === currentStage
                        ? `${stageColors[stage.id].bg} text-white ring-4 ${stageColors[stage.id].ring}`
                        : stage.id < currentStage
                        ? `${stageColors[stage.id].bg} text-white`
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }
                  `}
                >
                  {stage.id}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${
                      stage.id === currentStage
                        ? stageColors[stage.id].text
                        : stage.id < currentStage
                        ? stageColors[stage.id].text
                        : "text-gray-500 dark:text-gray-400"
                    }
                  `}
                >
                  {stage.label}
                </span>
              </button>

              {/* Connecting Line */}
              {index < stages.length - 1 && (
                <div
                  className={`
                    w-12 md:w-20 h-1 mx-2 self-start mt-5
                    ${
                      stage.id < currentStage
                        ? "bg-gray-400 dark:bg-gray-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spacer for fixed stepper */}
      <div className="h-24" />

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center py-8 px-4 md:px-8">
        {/* API Keys and Cost Tracker - Top Right, outside container */}
        {(currentStage === 3 || currentStage === 4 || currentStage === 5 || currentStage === 6 || currentStage === 7 || currentStage === 8) && (
          <div className={`w-full flex justify-end items-end gap-4 mt-10 mb-4 ${currentStage === 6 || currentStage === 7 ? "max-w-[95%]" : "max-w-6xl"}`}>
            {/* Cost Tracker - Only on Stage 7 (ImageGen) */}
            {currentStage === 7 && <CostTrackerDashboard />}

            {/* Image API Key (Gemini) - Stages 3-7 */}
            {(currentStage === 3 || currentStage === 4 || currentStage === 5 || currentStage === 6 || currentStage === 7) && (
              <div className="w-full max-w-sm">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {phrase(dictionary, "mithril_gemini_api_key", language)}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder={phrase(dictionary, "mithril_gemini_api_key_placeholder", language)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 pr-10 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Video API Key (OpenAI) - Stage 8 */}
            {currentStage === 8 && (
              <div className="w-full max-w-sm">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {phrase(dictionary, "mithril_gemini_video_api_key", language)}
                </label>
                <div className="relative">
                  <input
                    type={showVideoApiKey ? "text" : "password"}
                    value={videoApiKey}
                    onChange={(e) => setVideoApiKey(e.target.value)}
                    placeholder={phrase(dictionary, "mithril_gemini_api_key_placeholder", language)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 pr-10 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVideoApiKey(!showVideoApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showVideoApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={`w-full mx-auto p-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${
            currentStage === 6 || currentStage === 7 ? "max-w-[95%]" : "max-w-6xl"
          }`}
        >
          {currentStage === 1 && <UploadManager />}
          {currentStage === 2 && <StorySplitter />}
          {currentStage === 3 && <CharacterSheetGenerator />}
          {currentStage === 4 && <StoryboardGenerator />}
          {currentStage === 5 && <PropDesigner />}
          {currentStage === 6 && <BgSheetGenerator />}
          {currentStage === 7 && <ImageGenerator />}
          {currentStage === 8 && <VideoGenerator />}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 py-6 px-4 md:px-8">
        <button
          onClick={goToPreviousStage}
          disabled={currentStage === 1}
          className={`
            px-6 py-2 rounded-md font-medium transition-all duration-200
            ${
              currentStage === 1
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            }
          `}
        >
          {phrase(dictionary, "mithril_previous", language)}
        </button>
        <button
          onClick={goToNextStage}
          disabled={currentStage === stages.length}
          className={`
            px-6 py-2 rounded-md font-medium transition-all duration-200
            ${
              currentStage === stages.length
                ? "bg-[#DB2777]/50 text-white cursor-not-allowed"
                : "bg-[#DB2777] text-white hover:bg-[#BE185D]"
            }
          `}
        >
          {currentStage === stages.length
            ? phrase(dictionary, "mithril_finish", language)
            : phrase(dictionary, "mithril_next", language)}
        </button>
      </div>
    </div>
  );
}

export default function Mithril() {
  return (
    <CostProvider>
      <MithrilProvider>
        <MithrilContent />
      </MithrilProvider>
    </CostProvider>
  );
}
