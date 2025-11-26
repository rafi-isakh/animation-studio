"use client";

import { useState, useEffect, useCallback } from "react";
import { marked } from "marked";

const LoadingSpinner: React.FC = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function StoryAnalyzer() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [conditions, setConditions] = useState<string>("");
  const [analysisType, setAnalysisType] = useState<"plot" | "episode">("plot");
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");

  // Load file content and previous analysis from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem("chapter");
    const savedFileName = localStorage.getItem("chapter_filename");
    const savedAnalysis = localStorage.getItem("story_analysis");
    if (savedContent) {
      setFileContent(savedContent);
      setFileName(savedFileName || "Uploaded file");
    }
    if (savedAnalysis) {
      setSummary(savedAnalysis);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!fileContent) {
      setError("Please upload a text file in Stage 1 first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary("");
    setProgressMessage("Analyzing story...");

    try {
      const response = await fetch("/api/analyze_story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novelText: fileContent,
          conditions,
          analysisType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze story");
      }

      setSummary(data.result);
      // Save analysis result to localStorage
      localStorage.setItem("story_analysis", data.result);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setProgressMessage("");
    }
  }, [fileContent, conditions, analysisType]);

  const handleDownload = useCallback(() => {
    if (!summary) return;

    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    let downloadFileName = "story_analysis_result.txt";
    if (fileName) {
      const baseName = fileName.endsWith(".txt")
        ? fileName.slice(0, -4)
        : fileName;
      downloadFileName = `${baseName}_analysis_result.txt`;
    }
    link.download = downloadFileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [summary, fileName]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Story Analyzer</h2>
        <p className="text-gray-500 dark:text-gray-400">
          AI analyzes your web novel&apos;s structure, A-line, and key story points.
        </p>
      </div>

      {/* No file warning */}
      {!fileContent && (
        <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">
            No file uploaded. Please go back to Stage 1 and upload a file.
          </p>
        </div>
      )}

      {/* Analysis Conditions */}
      <div>
        <label
          htmlFor="conditions-input"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Analysis Conditions (Optional)
        </label>
        <textarea
          id="conditions-input"
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          placeholder="e.g., Focus on the protagonist's emotional arc, analyze only certain supporting characters..."
          rows={3}
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#DB2777] focus:border-[#DB2777] transition-colors text-gray-900 dark:text-gray-100"
          disabled={isLoading}
        />
      </div>

      {/* Analysis Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Analysis Mode
        </label>
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setAnalysisType("plot")}
            disabled={isLoading}
            className={`w-1/2 py-2 text-center text-sm font-medium rounded-md transition-all duration-300 ${
              analysisType === "plot"
                ? "bg-[#DB2777] text-white shadow"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Plot Structure Analysis
          </button>
          <button
            onClick={() => setAnalysisType("episode")}
            disabled={isLoading}
            className={`w-1/2 py-2 text-center text-sm font-medium rounded-md transition-all duration-300 ${
              analysisType === "episode"
                ? "bg-[#DB2777] text-white shadow"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Episode-based Analysis
          </button>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !fileContent}
          className="inline-flex items-center justify-center px-6 py-2 font-semibold text-white bg-[#DB2777] rounded-lg shadow-md hover:bg-[#BE185D] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DB2777]"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>{progressMessage || "Analyzing..."}</span>
            </>
          ) : (
            "Analyze Story"
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          <p>
            <span className="font-bold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Results */}
      {summary && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#DB2777]">
              AI Story Structure Analysis Result
            </h3>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              Download (.txt)
            </button>
          </div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed overflow-x-auto max-h-[400px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: marked.parse(summary) as string }}
          />
        </div>
      )}
    </div>
  );
}
