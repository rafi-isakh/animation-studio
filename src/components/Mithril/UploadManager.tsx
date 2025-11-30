"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

// List of available sample files in public/samples folder with thumbnails
const SAMPLE_FILES = [
  {
    name: "내 딸이 검술천재",
    path: "/samples/내 딸이 검술천재.txt",
    thumbnail: "/samples/thumbnails/내 딸이 검술 천재.webp",
  },
  {
    name: "레벨업하는 무신님",
    path: "/samples/레벨업하는 무신님.txt",
    thumbnail: "/samples/thumbnails/레벨업하는 무신님.webp",
  },
  {
    name: "리더 -읽는 자-",
    path: "/samples/리더 -읽는 자-.txt",
    thumbnail: "/samples/thumbnails/리더-읽는 자.webp",
  },
  {
    name: "마성의 신입사원",
    path: "/samples/마성의 신입사원 1~50.txt",
    thumbnail: "/samples/thumbnails/마성의 신입사원.jpg",
  },
  {
    name: "맛있는 스캔들",
    path: "/samples/맛있는 스캔들 1~50.txt",
    thumbnail: "/samples/thumbnails/맛있는 스캔들.jpg",
  },
  {
    name: "손님(개정판)",
    path: "/samples/손님(개정판).txt",
    thumbnail: "/samples/thumbnails/손님.jpg",
  },
  {
    name: "언니의 인생을 연기중입니다.",
    path: "/samples/언니의 인생을 연기중입니다..txt",
    thumbnail: "/samples/thumbnails/언니의인생을연기중입니다.jpg",
  },
  {
    name: "이세계의 정령사가 되었다",
    path: "/samples/이세계의 정령사가 되었다.txt",
    thumbnail: "/samples/thumbnails/이세계의 정령사가 되었다.webp",
  },
  {
    name: "전생의 프로",
    path: "/samples/전생의 프로1-40.txt",
    thumbnail: "/samples/thumbnails/전생의 프로가 꿀 빠는 법.webp",
  },
  {
    name: "주인공들이 동물센터로 쳐들어왔다",
    path: "/samples/주인공들이 동물센터로 쳐들어왔다.txt",
    thumbnail: "/samples/thumbnails/주인공들이 동물센터로 쳐들어왔다.jpg",
  },
];

export default function UploadManager() {
  const { language, dictionary } = useLanguage();
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

      // Find and set the matching option
      const matchingFile = SAMPLE_FILES.find((f) => f.name === savedFileName);
      if (matchingFile) {
        setSelectedFile(matchingFile.path);
      }
    }
  }, []);

  const handleFileSelect = async (file: (typeof SAMPLE_FILES)[0]) => {
    setSelectedFile(file.path);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(file.path);
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
      <h2 className="text-2xl font-bold text-center mb-4">
        {phrase(dictionary, "upload_title", language)}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
        {phrase(dictionary, "upload_subtitle", language)}
      </p>

      <div className="space-y-4">
        {/* Thumbnail Grid Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {phrase(dictionary, "upload_select_label", language)}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SAMPLE_FILES.map((file) => (
              <button
                key={file.path}
                onClick={() => handleFileSelect(file)}
                disabled={isLoading}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  selectedFile === file.path
                    ? "border-[#DB2777] ring-2 ring-[#DB2777] ring-opacity-50"
                    : "border-gray-200 dark:border-gray-700 hover:border-[#DB2777]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="aspect-[3/4] relative">
                  <Image
                    src={file.thumbnail}
                    alt={file.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  {/* Selection overlay */}
                  {selectedFile === file.path && (
                    <div className="absolute inset-0 bg-[#DB2777] bg-opacity-20 flex items-center justify-center">
                      <div className="bg-[#DB2777] rounded-full p-2">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {/* Title below thumbnail */}
                <div className="p-2 bg-white dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate text-center">
                    {file.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
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
              {phrase(dictionary, "upload_loading", language)}
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">
              {phrase(dictionary, "upload_error", language)}
            </p>
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
                {phrase(dictionary, "upload_clear", language)}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {fileContent.length.toLocaleString()}{" "}
              {phrase(dictionary, "upload_characters", language)}
            </p>
            <div className="max-h-48 overflow-y-auto bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
              <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                {fileContent.slice(0, 1000)}
                {fileContent.length > 1000 && (
                  <span className="text-gray-400">
                    {"\n\n"}... ({(fileContent.length - 1000).toLocaleString()}{" "}
                    {phrase(dictionary, "upload_more_characters", language)})
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
