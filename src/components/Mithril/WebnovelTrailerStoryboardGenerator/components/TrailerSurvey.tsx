"use client";

import { useState, useRef } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Download, Upload, Sparkles } from "lucide-react";
import type { TrailerOption } from "../../StoryboardGenerator/types";

interface TrailerSurveyProps {
  onStart: (text: string, option: TrailerOption) => void;
  initialSourceText?: string;
}

export default function TrailerSurvey({ onStart, initialSourceText }: TrailerSurveyProps) {
  const { currentProjectId } = useProject();
  const { toast } = useToast();

  const [sourceText, setSourceText] = useState(initialSourceText || "");
  const [fileName, setFileName] = useState("");
  const [options, setOptions] = useState<TrailerOption[]>([]);
  const [editedScripts, setEditedScripts] = useState<Record<number, string>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const txtFileRef = useRef<HTMLInputElement>(null);
  const optionsFileRef = useRef<HTMLInputElement>(null);

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSourceText(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
      toast({ variant: "destructive", title: "웹소설 텍스트를 먼저 업로드하세요." });
      return;
    }
    setIsLoading(true);
    setOptions([]);
    setSelectedId(null);
    try {
      const res = await fetch("/api/storyboard/trailer-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText, projectId: currentProjectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate trailer options");
      setOptions(data);
      const initial: Record<number, string> = {};
      (data as TrailerOption[]).forEach((opt) => {
        initial[opt.id] = opt.script.join("\n\n");
      });
      setEditedScripts(initial);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "트레일러 옵션 생성 실패",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadOptions = () => {
    if (options.length === 0) return;
    const withEdits = options.map((opt) => ({
      ...opt,
      script: (editedScripts[opt.id] || "")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    }));
    const blob = new Blob([JSON.stringify(withEdits, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "trailer_options.json";
    link.click();
  };

  const handleUploadOptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          setOptions(parsed);
          toast({ variant: "success", title: "옵션을 불러왔습니다." });
        }
      } catch {
        toast({ variant: "destructive", title: "파일 파싱 실패" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirm = () => {
    const selected = options.find((o) => o.id === selectedId);
    if (!selected) {
      toast({ variant: "destructive", title: "트레일러 옵션을 선택하세요." });
      return;
    }
    const finalScript = (editedScripts[selected.id] || "")
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    onStart(sourceText, { ...selected, script: finalScript });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-center mb-2">
        트레일러 더빙 형식 설정
      </h1>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          1. 웹소설 텍스트 파일 입로드 (.txt)
        </label>
        <div className="flex items-center gap-3">
          <input ref={txtFileRef} type="file" accept=".txt" className="hidden" onChange={handleTxtUpload} />
          <button
            onClick={() => txtFileRef.current?.click()}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Choose File
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {fileName || "선택된 파일 없음"}
          </span>
        </div>
        {sourceText && (
          <p className="mt-1.5 text-sm text-green-600 dark:text-green-400">
            파일이 성공적으로 로드되었습니다. ({sourceText.length.toLocaleString()}자)
          </p>
        )}
      </div>

      {/* Generate Button (before options are loaded) */}
      {options.length === 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !sourceText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? "생성 중..." : "트레일러 옵션 생성"}
          </button>
          <input ref={optionsFileRef} type="file" accept=".json" className="hidden" onChange={handleUploadOptions} />
          <button
            onClick={() => optionsFileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            저장된 옵션 불러오기
          </button>
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#DB2777]" />
        </div>
      )}

      {/* Options */}
      {options.length > 0 && (
        <>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
            트레일러에 어떤 형식의 더빙이 들어갔으면 하나요?
          </p>

          <div className="grid grid-cols-3 gap-4">
            {options.map((option) => {
              const isSelected = selectedId === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedId(option.id)}
                  className={`rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#DB2777] bg-gray-50 dark:bg-gray-800"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#DB2777]/50"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
                    <span className="font-semibold text-blue-500 dark:text-blue-400 text-sm leading-snug">
                      옵션 {option.id}: {option.title}
                    </span>
                    <span className="flex items-start gap-1 text-[10px] text-gray-400 shrink-0 mt-0.5">
                      <Pencil className="w-3 h-3 mt-0.5" />
                      <span style={{ writingMode: "vertical-rl" }}>수정 가능</span>
                    </span>
                  </div>

                  {/* Script (editable) */}
                  <textarea
                    className="mx-3 mb-3 w-[calc(100%-1.5rem)] h-56 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#DB2777]"
                    value={editedScripts[option.id] || ""}
                    onChange={(e) =>
                      setEditedScripts({ ...editedScripts, [option.id]: e.target.value })
                    }
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => setSelectedId(option.id)}
                  />
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleDownloadOptions}
              className="flex items-center gap-2 px-8 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              JSON 다운로드
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedId === null}
              className="flex items-center gap-2 px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              선택한 옵션으로 콘텐티 생성 시작
            </button>
          </div>
        </>
      )}
    </div>
  );
}