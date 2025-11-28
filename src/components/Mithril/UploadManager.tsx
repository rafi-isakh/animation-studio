"use client";

import { useState, useEffect } from "react";

// List of available sample files in public/samples folder
// Add your TXT files here with their display names
const SAMPLE_FILES = [
  {
    name: "마성의 신입사원 1~50",
    path: "/samples/마성의 신입사원 1~50.txt",
  },
  { name: "Sample Story 1", path: "/samples/sample1.txt" },
  { name: "Sample Story 2", path: "/samples/sample2.txt" },
  { name: "Sample Story 3", path: "/samples/sample3.txt" },
];

export default function UploadManager() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem("chapter");
    const savedFileName = localStorage.getItem("chapter_filename");
    if (savedContent) {
      setFileContent(savedContent);
      setFileName(savedFileName || "Previously selected file");

      // Find and set the matching dropdown option
      const matchingFile = SAMPLE_FILES.find((f) => f.name === savedFileName);
      if (matchingFile) {
        setSelectedFile(matchingFile.path);
      }
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setSelectedFile(selected);
    setError(null);

    if (!selected) {
      return;
    }

    const file = SAMPLE_FILES.find((f) => f.path === selected);
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await fetch(selected);
      if (!response.ok) {
        throw new Error("Failed to load file");
      }
      const content = await response.text();
      setFileContent(content);
      setFileName(file.name);
      localStorage.setItem("chapter", content);
      localStorage.setItem("chapter_filename", file.name);
    } catch (err) {
      console.error("Error loading file:", err);
      setError("Failed to load the selected file. Please try again.");
      setFileContent(null);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFileContent(null);
    setFileName(null);
    setSelectedFile("");
    setError(null);
    localStorage.removeItem("chapter");
    localStorage.removeItem("chapter_filename");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-4">Upload Manager</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
        Select a story file to get started
      </p>

      <div className="space-y-4">
        {/* File Selection Dropdown */}
        <div>
          <label
            htmlFor="file-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Select a Story File
          </label>
          <select
            id="file-select"
            value={selectedFile}
            onChange={handleFileSelect}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#DB2777] focus:border-[#DB2777] transition-colors text-gray-900 dark:text-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">-- Select a file --</option>
            {SAMPLE_FILES.map((file) => (
              <option key={file.path} value={file.path}>
                {file.name}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <svg
              className="animate-spin h-5 w-5 text-[#DB2777] mr-2"
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
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading file...
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* File Preview */}
        {fileContent && !isLoading && (
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#DB2777]">
                {fileName}
              </span>
              <button
                onClick={handleClear}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {fileContent.length.toLocaleString()} characters
            </p>
            <div className="max-h-48 overflow-y-auto bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
              <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                {fileContent.slice(0, 1000)}
                {fileContent.length > 1000 && (
                  <span className="text-gray-400">
                    {"\n\n"}... ({(fileContent.length - 1000).toLocaleString()}{" "}
                    more characters)
                  </span>
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
