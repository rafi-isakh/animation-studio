"use client";

import { useMemo, useState, useEffect } from "react";
import UploadManager from "./UploadManager";
import StorySplitter from "./StorySplitter";
import CharacterSheetGenerator from "./CharacterSheetGenerator";
import BgSheetGenerator from "./BgSheetGenerator";
import StoryboardGenerator from "./StoryboardGenerator";
import Stage6Content from "./Stage6Content";
import SoraVideoGenerator from "./SoraVideoGenerator";
import { MithrilProvider, useMithril } from "./MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

function MithrilContent() {
  const { currentStage, setCurrentStage, goToNextStage, goToPreviousStage } =
    useMithril();
  const { language, dictionary } = useLanguage();

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
      { id: 6, label: phrase(dictionary, "mithril_stage6", language) },
      { id: 7, label: phrase(dictionary, "mithril_stage7", language) },
    ],
    [dictionary, language]
  );

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Stepper - Fixed at top */}
      <div className={`w-full overflow-x-auto p-4 fixed left-0 right-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm md:pl-[72px] transition-[top] duration-200 ${scrolled ? "top-0" : "top-14"}`}>
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
                    w-12 md:w-20 h-1 mx-2
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
        <div
          className={`w-full max-w-6xl mx-auto p-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}
        >
          {currentStage === 1 && <UploadManager />}
          {currentStage === 2 && <StorySplitter />}
          {currentStage === 3 && <CharacterSheetGenerator />}
          {currentStage === 4 && <BgSheetGenerator />}
          {currentStage === 5 && <StoryboardGenerator />}
          {currentStage === 6 && <Stage6Content />}
          {currentStage === 7 && <SoraVideoGenerator />}
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
