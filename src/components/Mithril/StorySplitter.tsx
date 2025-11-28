"use client";

import { useState, useEffect, useCallback } from "react";
import { useMithril } from "./MithrilContext";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";

interface SplitResult {
  parts: string[];
}

const defaultGuidelines = `클리프행어는 궁금증과 기대감을 폭발시키는 장면으로서, 다음 중 하나를 반드시 충족한다.

1. 갈등이 폭발하기 직전
2. 중요한 비밀/정체/정보가 드러나기 직전
3. 등장인물의 결정·고백·배신 직전
4. 새로운 적/위협 등장 직전
5. 독자가 "여기서 끊기면 다음이 너무 궁금하다"라고 느끼는 지점

주인공 중심의 클리프행어만 탐색한다.`;

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      AI is analyzing the best split points...
    </p>
  </div>
);


export default function StorySplitter() {
  const { setStageResult } = useMithril();
  const { toast } = useToast();

  const [originalText, setOriginalText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [numParts, setNumParts] = useState<number>(5);
  const [guidelines, setGuidelines] = useState<string>(defaultGuidelines);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Load text from localStorage (from Stage 1)
  useEffect(() => {
    const savedContent = localStorage.getItem("chapter");
    const savedFileName = localStorage.getItem("chapter_filename");
    if (savedContent) {
      setOriginalText(savedContent);
      setFileName(savedFileName || "uploaded_file.txt");
    }

    // Load previously saved split result if exists
    const savedResult = localStorage.getItem("story_splitter_result");
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        setSplitResult(parsed);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Auto-save when splitResult changes
  useEffect(() => {
    if (!splitResult) return;

    try {
      localStorage.setItem("story_splitter_result", JSON.stringify(splitResult));
      setStageResult(3, splitResult);
    } catch (error) {
      console.error("Auto-save failed:", error);
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        toast({
          variant: "destructive",
          title: "Auto-save Failed",
          description: "Storage limit exceeded.",
        });
      }
    }
  }, [splitResult, setStageResult, toast]);

  const handleGenerate = useCallback(async () => {
    if (!originalText) {
      setError("No script found. Please upload a file in Stage 1 first.");
      return;
    }
    if (numParts < 2 || numParts > 10) {
      setError("Number of parts must be between 2 and 10.");
      return;
    }
    setError("");
    setIsLoading(true);
    setSplitResult(null);

    try {
      const response = await fetch("/api/split-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
          guidelines,
          numParts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      setSplitResult({ parts: data.parts });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [originalText, guidelines, numParts]);

  const handleDownload = useCallback(async () => {
    if (!splitResult) return;

    const zip = new JSZip();
    splitResult.parts.forEach((part, index) => {
      const baseFileName = fileName.replace(".txt", "") || "script";
      const partFileName = `${baseFileName}_part_${index + 1}.txt`;
      zip.file(partFileName, part);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const zipFileName = `${fileName.replace(".txt", "") || "script"}_parts.zip`;
    saveAs(content, zipFileName);
  }, [splitResult, fileName]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Cliffhanger Story Splitter</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          AI finds optimal cliffhanger points to split your story
        </p>
      </div>

      {/* Text Preview from Stage 1 */}
      {originalText ? (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fileName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {originalText.length.toLocaleString()} characters
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto">
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
              {originalText.slice(0, 300)}
              {originalText.length > 300 && "..."}
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Please upload a text file in Stage 1 first.
          </p>
        </div>
      )}

      {/* Configuration Section */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="numParts"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Number of Parts
          </label>
          <input
            id="numParts"
            type="number"
            min="2"
            max="10"
            value={numParts}
            onChange={(e) => {
              const value = e.target.value;
              setNumParts(value === "" ? 2 : Number(value));
            }}
            onBlur={(e) => {
              const value = Number(e.target.value);
              if (value < 2) {
                setNumParts(2);
              } else if (value > 10) {
                setNumParts(10);
              }
            }}
            className="block w-32 p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
            placeholder="2-10"
          />
        </div>

        <div>
          <label
            htmlFor="guidelines"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            AI Guidelines (Optional)
          </label>
          <textarea
            id="guidelines"
            rows={6}
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="text-center">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !originalText}
          className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Analyzing..." : "Split Story"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Loader */}
      {isLoading && <Loader />}

      {/* Results */}
      {splitResult && !isLoading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Split Results ({splitResult.parts.length} Parts)
            </h3>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download ZIP</span>
            </button>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {splitResult.parts.map((part, index) => (
              <div
                key={index}
                className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"
              >
                <h4 className="font-bold text-[#DB2777] mb-2">
                  Part {index + 1}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {part.length > 500 ? `${part.slice(0, 500)}...` : part}
                </p>
                {part.length > 500 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    ... and {(part.length - 500).toLocaleString()} more characters
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
