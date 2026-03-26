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
    const blob = new Blob([JSON.stringify(options, null, 2)], { type: "application/json" });
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
    onStart(sourceText, selected);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E8E8E8] flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-5xl">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-[#E8E8E8] mb-8">
          트레일러 더빙 형식 설정
        </h1>

        {/* File Upload */}
        <div className="mb-6">
          <p className="text-sm text-[#E8E8E8] mb-2">1. 웹소설 텍스트 파일 입로드 (.txt)</p>
          <div className="flex items-center gap-3">
            <input ref={txtFileRef} type="file" accept=".txt" className="hidden" onChange={handleTxtUpload} />
            <button
              onClick={() => txtFileRef.current?.click()}
              className="px-3 py-1 bg-[#3A3A3A] border border-[#555] text-[#E8E8E8] text-sm rounded hover:bg-[#444] transition-colors"
            >
              Choose File
            </button>
            <span className="text-sm text-[#E8E8E8]">
              {fileName || "선택된 파일 없음"}
            </span>
          </div>
          {sourceText && (
            <p className="mt-1.5 text-sm text-green-400">
              파일이 성공적으로 로드되었습니다. ({sourceText.length.toLocaleString()}자)
            </p>
          )}
        </div>

        {/* Generate Button (before options are loaded) */}
        {options.length === 0 && (
          <div className="mb-6 flex items-center gap-3">
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
              className="flex items-center gap-2 px-4 py-2.5 text-sm bg-[#211F21] border border-[#272727] text-[#E8E8E8] rounded-lg hover:border-[#DB2777] transition-colors"
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
            <p className="text-base font-semibold text-[#E8E8E8] mb-4">
              트레일러에 어떤 형식의 더빙이 들어갔으면 하나요?
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {options.map((option) => {
                const isSelected = selectedId === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => setSelectedId(option.id)}
                    className={`rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#DB2777] bg-[#1A1A1C]"
                        : "border-[#272727] bg-[#1A1A1C] hover:border-[#DB2777]/50"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
                      <span className="font-semibold text-[#4FC3F7] text-sm leading-snug">
                        옵션 {option.id}: {option.title}
                      </span>
                      <span className="flex items-start gap-1 text-[10px] text-gray-400 shrink-0 mt-0.5">
                        <Pencil className="w-3 h-3 mt-0.5" />
                        <span style={{ writingMode: "vertical-rl" }}>수정 가능</span>
                      </span>
                    </div>

                    {/* Script Lines */}
                    <div className="mx-3 mb-3 bg-[#141414] rounded-lg px-3 py-3 text-xs text-[#CCCCCC] leading-relaxed space-y-1 max-h-56 overflow-y-auto">
                      {option.script.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleDownloadOptions}
                className="flex items-center gap-2 px-8 py-3 bg-[#2A2A2A] border border-[#3A3A3A] text-[#E8E8E8] font-semibold rounded-lg hover:bg-[#333] transition-colors text-sm"
              >
                JSON 다운로드
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedId === null}
                className="flex items-center gap-2 px-8 py-3 bg-[#1E4A5C] hover:bg-[#25617A] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                선택한 옵션으로 콘텐티 생성 시작
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}