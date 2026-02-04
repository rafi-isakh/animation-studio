"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, Loader2, Save, FileUp, BookOpen, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useProject } from "@/contexts/ProjectContext";
import { useMithril } from "./MithrilContext";
import {
  getIdConverter,
  saveIdConverter,
  updateIdConverter,
  deleteIdConverter,
} from "./services/firestore";
import type {
  IdConverterEntity,
  IdConverterChunk,
  IdConverterStep,
} from "./services/firestore/types";
import { AnalysisView } from "./IdConverter/AnalysisView";
import { ProcessingView } from "./IdConverter/ProcessingView";
import { useIdConverterOrchestrator, IdConverterJobUpdate } from "./IdConverter/hooks/useIdConverterOrchestrator";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Sample files from UploadManager
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

interface ProjectState {
  fileName: string;
  originalFullText: string;
  fileUri?: string;
  glossary: IdConverterEntity[];
  chunks: IdConverterChunk[];
  currentStep: IdConverterStep;
  batchJobId?: string;
}

const INITIAL_STATE: ProjectState = {
  fileName: "",
  originalFullText: "",
  glossary: [],
  chunks: [],
  currentStep: "upload",
  batchJobId: undefined,
};

export default function IdConverter() {
  const { language, dictionary } = useLanguage();
  const { currentProjectId } = useProject();
  const { customApiKey, uploadType, setUploadType } = useMithril();

  const [state, setState] = useState<ProjectState>(INITIAL_STATE);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [glossaryJobId, setGlossaryJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reload data from Firestore with retry for eventual consistency
  const reloadData = useCallback(async (retryCount = 0, clearLoadingOnComplete = false) => {
    if (!currentProjectId) return;

    try {
      const doc = await getIdConverter(currentProjectId);
      if (doc) {
        console.log("[IdConverter] Loaded data:", {
          currentStep: doc.currentStep,
          glossaryCount: doc.glossary?.length,
          chunksCount: doc.chunks?.length,
          hasTextFileUrl: !!doc.textFileUrl,
        });

        // Fetch text from S3 if textFileUrl exists, otherwise use legacy originalFullText
        let originalFullText = doc.originalFullText || "";
        if (doc.textFileUrl) {
          try {
            console.log("[IdConverter] reloadData - Fetching text from S3:", doc.textFileUrl);
            const textResponse = await fetch(doc.textFileUrl);
            if (textResponse.ok) {
              originalFullText = await textResponse.text();
            }
          } catch (fetchErr) {
            console.error("[IdConverter] reloadData - Error fetching text from S3:", fetchErr);
          }
        }

        setState({
          fileName: doc.fileName,
          originalFullText,
          fileUri: doc.fileUri,
          glossary: doc.glossary || [],
          chunks: doc.chunks || [],
          currentStep: doc.currentStep || "upload",
          batchJobId: doc.batchJobId,
        });

        // Clear loading state after data is loaded
        if (clearLoadingOnComplete) {
          setIsLoading(false);
          setLoadingStatus("");
        }
      } else if (retryCount < 3) {
        // Document not found, retry after a short delay
        console.log("[IdConverter] Document not found, retrying...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        await reloadData(retryCount + 1, clearLoadingOnComplete);
      } else if (clearLoadingOnComplete) {
        // Max retries reached, still clear loading
        setIsLoading(false);
        setLoadingStatus("");
      }
    } catch (err) {
      console.error("Error reloading IdConverter from Firestore:", err);
      if (clearLoadingOnComplete) {
        setIsLoading(false);
        setLoadingStatus("");
      }
    }
  }, [currentProjectId]);

  // Ref to track glossary job ID synchronously (avoids race condition with state)
  const glossaryJobIdRef = useRef<string | null>(null);

  // Handle job updates from orchestrator
  const handleJobUpdate = useCallback((update: IdConverterJobUpdate) => {
    console.log("[IdConverter] Job update:", update);

    if (update.jobType === "id_converter_glossary") {
      // Only process updates for the current glossary job
      const currentJobId = glossaryJobIdRef.current;
      if (!currentJobId || update.jobId !== currentJobId) {
        console.log("[IdConverter] Ignoring update for different job:", update.jobId, "current:", currentJobId);
        return;
      }

      if (update.status === "completed") {
        // Glossary analysis complete - reload data from Firestore
        // Keep loading indicator until data is actually loaded
        glossaryJobIdRef.current = null;
        setGlossaryJobId(null);
        setError(null); // Clear any previous errors

        // Small delay to ensure Firestore has propagated the update
        // Pass true to clear loading state after data is loaded
        setTimeout(() => reloadData(0, true), 500);
      } else if (update.status === "failed") {
        setError(update.error || "Glossary analysis failed");
        setIsLoading(false);
        setLoadingStatus("");
        glossaryJobIdRef.current = null;
        setGlossaryJobId(null);
      } else if (update.status === "generating") {
        setLoadingStatus("Analyzing narrative entities...");
        setError(null); // Clear errors when job starts processing
      }
    }
    // Batch job updates are handled by ProcessingView
  }, [reloadData]);

  // Initialize orchestrator hook
  const { submitGlossaryJob, getJobStatus } = useIdConverterOrchestrator({
    projectId: currentProjectId || "",
    customApiKey,
    onJobUpdate: handleJobUpdate,
    enabled: !!currentProjectId,
  });

  // Load from Firestore on mount and check for active jobs
  useEffect(() => {
    const loadData = async () => {
      console.log("[IdConverter] loadData called, projectId:", currentProjectId);
      if (!currentProjectId) {
        setIsInitialLoading(false);
        return;
      }

      try {
        const doc = await getIdConverter(currentProjectId);
        console.log("[IdConverter] Loaded doc from Firestore:", {
          hasDoc: !!doc,
          glossaryJobId: doc?.glossaryJobId,
          currentStep: doc?.currentStep,
          hasOriginalFullText: !!doc?.originalFullText,
          hasTextFileUrl: !!doc?.textFileUrl,
          glossaryLength: doc?.glossary?.length,
        });

        if (doc) {
          // Fetch text from S3 if textFileUrl exists, otherwise use legacy originalFullText
          let originalFullText = doc.originalFullText || "";
          if (doc.textFileUrl) {
            try {
              console.log("[IdConverter] Fetching text from S3:", doc.textFileUrl);
              const textResponse = await fetch(doc.textFileUrl);
              if (textResponse.ok) {
                originalFullText = await textResponse.text();
                console.log("[IdConverter] Text fetched from S3, length:", originalFullText.length);
              } else {
                console.error("[IdConverter] Failed to fetch text from S3:", textResponse.status);
              }
            } catch (fetchErr) {
              console.error("[IdConverter] Error fetching text from S3:", fetchErr);
            }
          }

          setState({
            fileName: doc.fileName,
            originalFullText,
            fileUri: doc.fileUri,
            glossary: doc.glossary || [],
            chunks: doc.chunks || [],
            currentStep: doc.currentStep || "upload",
            batchJobId: doc.batchJobId,
          });

          // Check if there's an active glossary job
          const hasText = !!originalFullText || !!doc.textFileUrl;
          const shouldRestoreJob = doc.glossaryJobId && doc.currentStep === "upload" && hasText;
          console.log("[IdConverter] Should restore job?", shouldRestoreJob, {
            hasGlossaryJobId: !!doc.glossaryJobId,
            isUploadStep: doc.currentStep === "upload",
            hasText,
          });

          if (shouldRestoreJob && doc.glossaryJobId) {
            // There might be a glossary job in progress - restore tracking
            const jobId = doc.glossaryJobId;
            console.log("[IdConverter] Found glossaryJobId on mount:", jobId);

            // Set the ref first so subscription can handle updates
            glossaryJobIdRef.current = jobId;
            setGlossaryJobId(jobId);
            setIsLoading(true);
            setLoadingStatus("Analyzing narrative entities...");

            // Manually fetch job status to handle the race condition where
            // the Firestore subscription fired before we restored the jobId
            try {
              const jobStatus = await getJobStatus(jobId);
              console.log("[IdConverter] Fetched job status on mount:", jobStatus);

              if (jobStatus.status === "completed") {
                // Job completed while we were away - reload data
                glossaryJobIdRef.current = null;
                setGlossaryJobId(null);
                setError(null);
                setTimeout(() => reloadData(0, true), 500);
              } else if (jobStatus.status === "failed") {
                // Job failed while we were away
                setError(jobStatus.error || "Glossary analysis failed");
                setIsLoading(false);
                setLoadingStatus("");
                glossaryJobIdRef.current = null;
                setGlossaryJobId(null);
              }
              // If status is pending/generating, keep loading state - subscription will handle updates
            } catch (statusErr) {
              console.error("[IdConverter] Error fetching job status:", statusErr);
              // Job might not exist anymore - clear loading state
              setIsLoading(false);
              setLoadingStatus("");
              glossaryJobIdRef.current = null;
              setGlossaryJobId(null);
            }
          }
        }
      } catch (err) {
        console.error("Error loading IdConverter from Firestore:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [currentProjectId, getJobStatus, reloadData]);

  // Process uploaded file using async job orchestrator
  const processFile = useCallback(
    async (file: File) => {
      if (!currentProjectId) {
        setError("No project selected. Please go back to project list.");
        return;
      }

      // Validate file type
      if (!file.name.endsWith(".txt") && !file.name.endsWith(".json") && file.type !== "text/plain") {
        setError(phrase(dictionary, "upload_invalid_file_type", language) || "Invalid file type. Please upload a .txt or .json file.");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(phrase(dictionary, "upload_file_too_large", language) || "File is too large. Maximum size is 10MB.");
        return;
      }

      // Reset all states for new upload
      setIsLoading(true);
      setError(null);
      setLoadingStatus("");
      glossaryJobIdRef.current = null;
      setGlossaryJobId(null);
      setSelectedFile("");

      try {
        const text = await file.text();
        const name = file.name.replace(/\.(txt|json)$/i, "");

        // Check if it's a saved project JSON
        if (file.name.endsWith(".json")) {
          try {
            const loadedState = JSON.parse(text) as ProjectState;
            setState(loadedState);

            // Upload text to S3 first (to avoid Firestore 1MB limit)
            setLoadingStatus("Uploading file...");
            const s3Response = await fetch("/api/mithril/s3/text", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId: currentProjectId, text: loadedState.originalFullText }),
            });
            const s3Data = await s3Response.json();
            if (!s3Response.ok || !s3Data.success) {
              throw new Error(s3Data.error || "Failed to upload text to S3");
            }
            const textFileUrl = s3Data.url;
            console.log("[IdConverter] JSON project text uploaded to S3:", textFileUrl);

            // Save to Firestore (with S3 URL, not the actual text)
            await saveIdConverter(currentProjectId, {
              fileName: loadedState.fileName,
              textFileUrl,
              fileUri: loadedState.fileUri,
              glossary: loadedState.glossary,
              chunks: loadedState.chunks,
              currentStep: loadedState.currentStep,
            });

            setIsLoading(false);
            setLoadingStatus("");
            return;
          } catch {
            setError("Invalid JSON file");
            setIsLoading(false);
            return;
          }
        }

        // New text file - clear old state first, then submit async glossary analysis job
        setLoadingStatus("Uploading file...");

        // Immediately clear old state (keep text in local state for UI)
        setState({
          fileName: name,
          originalFullText: text,
          glossary: [],
          chunks: [],
          currentStep: "upload",
        });

        // Upload text to S3 first (to avoid Firestore 1MB limit)
        const s3Response = await fetch("/api/mithril/s3/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: currentProjectId, text }),
        });
        const s3Data = await s3Response.json();
        if (!s3Response.ok || !s3Data.success) {
          throw new Error(s3Data.error || "Failed to upload text to S3");
        }
        const textFileUrl = s3Data.url;
        console.log("[IdConverter] Text uploaded to S3:", textFileUrl);

        // Save initial state to Firestore (with S3 URL, not the actual text)
        setLoadingStatus("Submitting for analysis...");
        await saveIdConverter(currentProjectId, {
          fileName: name,
          textFileUrl,
          glossary: [],
          chunks: [],
          currentStep: "upload", // Will be updated to "analysis" when job completes
        });

        // Submit glossary analysis job via orchestrator
        setLoadingStatus("Analyzing narrative entities...");
        const result = await submitGlossaryJob({ originalText: text });

        if (!result.success) {
          throw new Error(result.error || "Failed to submit glossary job");
        }

        // Store job ID for tracking (both ref and state)
        glossaryJobIdRef.current = result.jobId || null;
        setGlossaryJobId(result.jobId || null);
        console.log("[IdConverter] Glossary job submitted:", result.jobId);

        // Save jobId to Firestore so it persists across page navigations
        if (result.jobId) {
          console.log("[IdConverter] Saving glossaryJobId to Firestore:", result.jobId);
          await updateIdConverter(currentProjectId, { glossaryJobId: result.jobId });
          console.log("[IdConverter] glossaryJobId saved successfully");
        }

        // Job is now running in background - UI will update via Firestore subscription
        // The loading state will be cleared when the job completes (in handleJobUpdate)
      } catch (err) {
        console.error("Error processing file:", err);
        setError(err instanceof Error ? err.message : "Failed to process file");
        setIsLoading(false);
        setLoadingStatus("");
      }
    },
    [currentProjectId, dictionary, language, submitGlossaryJob]
  );

  // Handle sample file selection using async job orchestrator
  const handleFileSelect = useCallback(
    async (file: (typeof SAMPLE_FILES)[0]) => {
      if (!currentProjectId) {
        setError("No project selected. Please go back to project list.");
        return;
      }

      // Sample files are always treated as 'novel' type
      setUploadType('novel');

      // Reset all states for new upload
      setSelectedFile(file.path);
      setError(null);
      setIsLoading(true);
      setLoadingStatus("Loading file...");
      glossaryJobIdRef.current = null;
      setGlossaryJobId(null);

      try {
        const response = await fetch(file.path);
        if (!response.ok) {
          throw new Error("Failed to load file");
        }
        const text = await response.text();

        // Immediately clear old state (keep text in local state for UI)
        setState({
          fileName: file.name,
          originalFullText: text,
          glossary: [],
          chunks: [],
          currentStep: "upload",
        });

        // Upload text to S3 first (to avoid Firestore 1MB limit)
        setLoadingStatus("Uploading file...");
        const s3Response = await fetch("/api/mithril/s3/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: currentProjectId, text }),
        });
        const s3Data = await s3Response.json();
        if (!s3Response.ok || !s3Data.success) {
          throw new Error(s3Data.error || "Failed to upload text to S3");
        }
        const textFileUrl = s3Data.url;
        console.log("[IdConverter] Sample text uploaded to S3:", textFileUrl);

        // Save initial state to Firestore (with S3 URL, not the actual text)
        setLoadingStatus("Submitting for analysis...");
        await saveIdConverter(currentProjectId, {
          fileName: file.name,
          textFileUrl,
          glossary: [],
          chunks: [],
          currentStep: "upload",
        });

        // Submit glossary analysis job via orchestrator
        setLoadingStatus("Analyzing narrative entities...");
        const result = await submitGlossaryJob({ originalText: text });

        if (!result.success) {
          throw new Error(result.error || "Failed to submit glossary job");
        }

        // Store job ID for tracking (both ref and state)
        glossaryJobIdRef.current = result.jobId || null;
        setGlossaryJobId(result.jobId || null);
        console.log("[IdConverter] Glossary job submitted for sample:", result.jobId);

        // Save jobId to Firestore so it persists across page navigations
        if (result.jobId) {
          console.log("[IdConverter] Saving glossaryJobId to Firestore (sample):", result.jobId);
          await updateIdConverter(currentProjectId, { glossaryJobId: result.jobId });
          console.log("[IdConverter] glossaryJobId saved successfully (sample)");
        }

        // Job is now running in background - UI will update via Firestore subscription
      } catch (err) {
        console.error("Error loading file:", err);
        setError(err instanceof Error ? err.message : "Failed to load file");
        setSelectedFile("");
        setIsLoading(false);
        setLoadingStatus("");
      }
    },
    [currentProjectId, submitGlossaryJob, setUploadType]
  );

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
      e.target.value = "";
    },
    [processFile]
  );

  // Glossary confirmation handler
  const handleGlossaryConfirm = useCallback(
    async (updatedGlossary: IdConverterEntity[]) => {
      if (!currentProjectId) return;

      const newState = {
        ...state,
        glossary: updatedGlossary,
        currentStep: "processing" as IdConverterStep,
      };

      setState(newState);

      await updateIdConverter(currentProjectId, {
        glossary: updatedGlossary,
        currentStep: "processing",
      });
    },
    [currentProjectId, state]
  );

  // Update chunks during processing
  const handleUpdateChunks = useCallback(
    async (chunks: IdConverterChunk[]) => {
      if (!currentProjectId) return;

      setState((prev) => ({ ...prev, chunks }));
      await updateIdConverter(currentProjectId, { chunks });
    },
    [currentProjectId]
  );

  // Mark processing as complete
  const handleComplete = useCallback(async () => {
    if (!currentProjectId) return;

    setState((prev) => ({ ...prev, currentStep: "completed" }));
    await updateIdConverter(currentProjectId, { currentStep: "completed" });
  }, [currentProjectId]);

  // Save batch job ID to Firestore for resume after page refresh
  const handleBatchJobStarted = useCallback(
    async (jobId: string) => {
      if (!currentProjectId) return;

      console.log("[IdConverter] Saving batchJobId to Firestore:", jobId);
      setState((prev) => ({ ...prev, batchJobId: jobId }));
      await updateIdConverter(currentProjectId, { batchJobId: jobId });
    },
    [currentProjectId]
  );

  // Save project as JSON
  const saveProject = useCallback(() => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${state.fileName.replace(".txt", "")}_project.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [state]);

  // Reset handler
  const handleReset = useCallback(async () => {
    if (!confirm("Are you sure? Unsaved progress will be lost.")) return;

    // Reset all states
    setState(INITIAL_STATE);
    setSelectedFile("");
    setError(null);
    setIsLoading(false);
    setLoadingStatus("");
    glossaryJobIdRef.current = null;
    setGlossaryJobId(null);

    if (currentProjectId) {
      await deleteIdConverter(currentProjectId);
    }
  }, [currentProjectId]);

  // Show loading state while fetching initial data
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#DB2777]"></div>
      </div>
    );
  }

  // Check if we have content loaded
  const hasContent = state.currentStep !== "upload" && state.originalFullText;

  return (
    <div className="space-y-8">
      {/* Upload Section - Always visible */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-4">
          {phrase(dictionary, "id_converter_title", language) || "Webnovel ID Converter"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
          {phrase(dictionary, "id_converter_subtitle", language) ||
            "Convert webnovels to storyboard scripts with character IDs"}
        </p>

        <div className="space-y-6">
          {/* Upload Type Toggle */}
          <div className="flex flex-col items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {phrase(dictionary, "upload_type_label", language) || "Content Type"}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setUploadType('novel')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all duration-200 ${
                  uploadType === 'novel'
                    ? 'border-[#DB2777] bg-[#DB2777]/10 text-[#DB2777]'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-[#DB2777]/50'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{phrase(dictionary, "upload_type_novel", language) || "Novel"}</div>
                  <div className="text-xs opacity-70">{phrase(dictionary, "upload_type_novel_desc", language) || "Multiple chapters, needs splitting"}</div>
                </div>
              </button>
              <button
                onClick={() => setUploadType('chapter')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all duration-200 ${
                  uploadType === 'chapter'
                    ? 'border-[#DB2777] bg-[#DB2777]/10 text-[#DB2777]'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-[#DB2777]/50'
                }`}
              >
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{phrase(dictionary, "upload_type_chapter", language) || "Chapter"}</div>
                  <div className="text-xs opacity-70">{phrase(dictionary, "upload_type_chapter_desc", language) || "Single chapter, skip splitting"}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? "border-[#DB2777] bg-[#DB2777]/5"
                : "border-gray-300 dark:border-gray-600 hover:border-[#DB2777] hover:bg-gray-50 dark:hover:bg-gray-800/50"
            }`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <Loader2 className="w-10 h-10 text-[#DB2777] animate-spin" />
                <p className="text-[#DB2777] animate-pulse">{loadingStatus}</p>
              </div>
            ) : (
              <>
                <Upload
                  className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                    dragActive ? "text-[#DB2777]" : "text-gray-400"
                  }`}
                />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  {phrase(dictionary, "upload_dropzone_title", language) ||
                    "Drop your file here or "}
                  <span
                    className={`font-semibold transition-colors ${
                      dragActive
                        ? "text-[#DB2777]"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {phrase(dictionary, "upload_dropzone_subtitle", language) ||
                      "click to browse"}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  .txt (Korean Novel) or .json (Saved Project)
                </p>
                {state.fileName && (
                  <p className="mt-2 text-sm text-[#DB2777] font-medium">
                    Current: {state.fileName}
                  </p>
                )}
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,text/plain"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Divider */}
          <div className="relative" hidden>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {phrase(dictionary, "upload_or_select_sample", language) ||
                  "or select a sample"}
              </span>
            </div>
          </div>

          {/* Thumbnail Grid Selection */}
          <div hidden>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {phrase(dictionary, "upload_select_label", language) ||
                "Sample Webnovels"}
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
                  <div className="p-2 bg-white dark:bg-gray-800">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate text-center">
                      {file.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Analysis/Processing Section - Shows when content is loaded */}
      {hasContent && (
        <>
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#DB2777]/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white dark:bg-gray-800 text-[#DB2777] font-medium">
                {state.currentStep === "analysis" ? "Entity Analysis" : "Processing"}
              </span>
            </div>
          </div>

          {/* Analysis View */}
          {state.currentStep === "analysis" && (
            <AnalysisView
              glossary={state.glossary}
              context={{ text: state.originalFullText, fileUri: state.fileUri }}
              onConfirm={handleGlossaryConfirm}
              onRetake={handleReset}
              apiKey={customApiKey}
            />
          )}

          {/* Processing View */}
          {(state.currentStep === "processing" || state.currentStep === "completed") && currentProjectId && (
            <div className="relative">
              <ProcessingView
                key={`${currentProjectId}-${state.fileName}`}
                projectId={currentProjectId}
                fileName={state.fileName}
                originalText={state.originalFullText}
                glossary={state.glossary}
                initialChunks={state.chunks}
                existingBatchJobId={state.batchJobId}
                onSaveProgress={handleUpdateChunks}
                onBatchJobStarted={handleBatchJobStarted}
                onComplete={handleComplete}
                apiKey={customApiKey}
              />
              {/* Floating Action Menu */}
              <div className="fixed bottom-6 right-6 flex gap-2 z-50">
                <button
                  onClick={saveProject}
                  className="bg-gray-800 hover:bg-gray-700 text-[#DB2777] p-3 rounded-full shadow-lg border border-gray-700"
                  title="Save Project JSON"
                >
                  <Save size={24} />
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 p-3 rounded-full shadow-lg border border-gray-700"
                  title="Reset / New File"
                >
                  <FileUp size={24} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
