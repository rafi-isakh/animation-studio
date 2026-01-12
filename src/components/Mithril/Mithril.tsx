"use client";

import { useMemo, useState, useEffect } from "react";
import { Key, Eye, EyeOff } from "lucide-react";
import UploadManager from "./UploadManager";
import StorySplitter from "./StorySplitter";
import CharacterSheetGenerator from "./CharacterSheetGenerator";
import BgSheetGenerator from "./BgSheetGenerator";
import StoryboardGenerator from "./StoryboardGenerator";
import SoraVideoGenerator from "./SoraVideoGenerator";
import { MithrilProvider, useMithril } from "./MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

function MithrilContent() {
  const { currentStage, setCurrentStage, goToNextStage, goToPreviousStage, customApiKey, setCustomApiKey } =
    useMithril();
  const { language, dictionary } = useLanguage();

  // API key visibility toggle
  const [showApiKey, setShowApiKey] = useState(false);

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

  const stages = useMemo(
    () => [
      { id: 1, label: phrase(dictionary, "mithril_stage1", language) },
      { id: 2, label: phrase(dictionary, "mithril_stage2", language) },
      { id: 3, label: phrase(dictionary, "mithril_stage3", language) },
      { id: 4, label: phrase(dictionary, "mithril_stage4", language) },
      { id: 5, label: phrase(dictionary, "mithril_stage5", language) },
      // Stage 6 (NanoBanana) hidden - functionality merged into Storyboard Generator
      { id: 6, label: phrase(dictionary, "mithril_stage7", language) }, // Sora Video Generator
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
                        ? "bg-[#DB2777] text-white ring-4 ring-[#DB2777]/30"
                        : stage.id < currentStage
                        ? "bg-[#DB2777] text-white"
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
                        ? "text-[#DB2777]"
                        : stage.id < currentStage
                        ? "text-[#DB2777]"
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
                        ? "bg-[#DB2777]"
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
        {/* Gemini API Key - Top Right, outside container */}
        {(currentStage === 3 || currentStage === 4 || currentStage === 5) && (
          <div className={`w-full flex justify-end mb-4 ${currentStage === 5 ? "max-w-[95%]" : "max-w-6xl"}`}>
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
          </div>
        )}

        <div
          className={`w-full mx-auto p-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${
            currentStage === 5 ? "max-w-[95%]" : "max-w-6xl"
          }`}
        >
          {currentStage === 1 && <UploadManager />}
          {currentStage === 2 && <StorySplitter />}
          {currentStage === 3 && <CharacterSheetGenerator />}
          {currentStage === 4 && <BgSheetGenerator />}
          {currentStage === 5 && <StoryboardGenerator />}
          {/* Stage6Content (NanoBanana) hidden - functionality merged into Storyboard Generator */}
          {currentStage === 6 && <SoraVideoGenerator />}
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
    <MithrilProvider>
      <MithrilContent />
    </MithrilProvider>
  );
}
