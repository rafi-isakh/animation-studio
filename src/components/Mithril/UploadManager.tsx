import { useState, useEffect, useRef, DragEvent } from "react";

const FileUploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

export default function UploadManager() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem("chapter");
    const savedFileName = localStorage.getItem("chapter_filename");
    if (savedContent) {
      setFileContent(savedContent);
      setFileName(savedFileName || "Previously uploaded file");
    }
  }, []);

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".txt")) {
      alert("Please upload a .txt file");
      return;
    }

    setIsLoading(true);
    try {
      const content = await file.text();
      setFileContent(content);
      setFileName(file.name);
      localStorage.setItem("chapter", content);
      localStorage.setItem("chapter_filename", file.name);
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Error reading file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleClear = () => {
    setFileContent(null);
    setFileName(null);
    localStorage.removeItem("chapter");
    localStorage.removeItem("chapter_filename");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-4">Upload Manager</h2>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
        Upload a TXT file to get started
      </p>

      <div className="space-y-4">
        {/* Drag & Drop Zone */}
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="dropzone-file"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              flex flex-col items-center justify-center w-full h-48
              border-2 border-dashed rounded-lg cursor-pointer
              transition-colors duration-200
              ${
                isDragging
                  ? "border-[#DB2777] bg-[#DB2777]/10"
                  : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              }
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileUploadIcon
                className={`w-10 h-10 mb-3 ${
                  isDragging
                    ? "text-[#DB2777]"
                    : "text-gray-400 dark:text-gray-400"
                }`}
              />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                .TXT file only
              </p>
              {fileName && !isLoading && (
                <p className="mt-2 text-sm text-[#DB2777] font-semibold">
                  {fileName}
                </p>
              )}
              {isLoading && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="dropzone-file"
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>

        {/* File Preview */}
        {fileContent && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {fileName}
              </span>
              <button
                onClick={handleClear}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {fileContent.length} characters
            </p>
            <div className="mt-2 max-h-32 overflow-y-auto">
              <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                {fileContent.slice(0, 500)}
                {fileContent.length > 500 && "..."}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
