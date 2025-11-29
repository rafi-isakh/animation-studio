"use client";

import { useMemo } from "react";
import UploadManager from "./UploadManager";
import StoryAnalyzer from "./StoryAnalyzer";
import StorySplitter from "./StorySplitter";
import CharacterSheetGenerator from "./CharacterSheetGenerator";
import BgSheetGenerator from "./BgSheetGenerator";
import StoryboardGenerator from "./StoryboardGenerator";
import Stage6Content from "./Stage6Content";
import { MithrilProvider, useMithril } from "./MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

function MithrilContent() {
  const { currentStage, setCurrentStage, goToNextStage, goToPreviousStage } =
    useMithril();
  const { language, dictionary } = useLanguage();

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
    <div className="flex flex-col min-h-screen w-full p-4 md:p-8">
      {/* Stepper */}
      <div className="w-full overflow-x-auto p-4">
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

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div
          className={`w-full ${currentStage === 4 || currentStage === 5 || currentStage === 6 || currentStage === 7 ? "max-w-6xl" : "max-w-2xl"} mx-auto p-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}
        >
          {currentStage === 1 && <UploadManager />}
          {currentStage === 2 && <StoryAnalyzer />}
          {currentStage === 3 && <StorySplitter />}
          {currentStage === 4 && <CharacterSheetGenerator />}
          {currentStage === 5 && <BgSheetGenerator />}
          {currentStage === 6 && <StoryboardGenerator />}
          {currentStage === 7 && <Stage6Content />}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 py-6">
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
