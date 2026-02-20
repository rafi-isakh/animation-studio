"use client";

import { useMemo, useState, ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Key, Eye, EyeOff, Clock, Download, RotateCcw, FolderOpen, Wand2, Shield, Globe, LogOut } from "lucide-react";
import { useMithrilAuth } from "@/components/Mithril/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { langPairList } from "@/utils/phrases";
import type { Language } from "@/components/Types";
import UploadManager from "./UploadManager";
import IdConverter from "./IdConverter";
import StorySplitter from "./StorySplitter";
import CharacterSheetGenerator from "./CharacterSheetGenerator";
import StoryboardGenerator from "./StoryboardGenerator";
import PropDesigner from "./PropDesigner";
import BgSheetGenerator from "./BgSheetGenerator";
import ImageGeneratorWrapper from "./ImageGenerator/ImageGeneratorWrapper";
import VideoGeneratorWrapper from "./VideoGenerator/VideoGeneratorWrapper";
import ImageSplitter from "./ImageToVideo/ImageSplitter";
import ImageToScriptWriter from "./ImageToVideo/ImageToScriptWriter";
import PanelEditor from "./ImageToVideo/PanelEditor";
import StoryboardEditor from "./ImageToVideo/StoryboardEditor";
import I2VVideoGenerator from "./ImageToVideo/VideoGenerator";
import { MithrilProvider, useMithril } from "./MithrilContext";
import { CostProvider, useCostTracker } from "./CostContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { getProjectTypeConfig, getPipelineStages } from "./config/projectTypes";

// Component mapping for dynamic rendering
const STAGE_COMPONENTS: Record<string, ComponentType> = {
  'UploadManager': UploadManager,
  'IdConverter': IdConverter,
  'StorySplitter': StorySplitter,
  'CharacterSheetGenerator': CharacterSheetGenerator,
  'StoryboardGenerator': StoryboardGenerator,
  'PropDesigner': PropDesigner,
  'BgSheetGenerator': BgSheetGenerator,
  'ImageGenerator': ImageGeneratorWrapper,
  'VideoGenerator': VideoGeneratorWrapper,
  'ImageSplitter': ImageSplitter,
  'ImageToScriptWriter': ImageToScriptWriter,
  'PanelEditor': PanelEditor,
  'StoryboardEditor': StoryboardEditor,
  'I2VVideoGenerator': I2VVideoGenerator,
};

// Cost Tracker Dashboard Component
function CostTrackerDashboard() {
  const {
    isClockedIn,
    isSessionEnded,
    totalCost,
    textCost,
    textCount,
    imageCost,
    imageCount,
    clockIn,
    clockOut,
    restartSession,
    downloadInvoice
  } = useCostTracker();

  return (
    <div className="flex flex-col gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700 shadow-inner">
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Cost</span>
          <span className={`font-mono font-black ${isClockedIn ? 'text-green-400' : 'text-slate-200'}`}>
            ${totalCost.toFixed(3)}
          </span>
        </div>
        {(isClockedIn || isSessionEnded) && (
          <>
            <div className="flex flex-col border-l border-slate-600 pl-3">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Text</span>
              <span className="font-mono text-xs text-amber-300">{textCount} (${textCost.toFixed(3)})</span>
            </div>
            <div className="flex flex-col border-l border-slate-600 pl-3">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Images</span>
              <span className="font-mono text-xs text-cyan-300">{imageCount} (${imageCost.toFixed(3)})</span>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {!isClockedIn && !isSessionEnded && (
          <button onClick={clockIn} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-1">
            <Clock className="w-3 h-3" />
            CLOCK IN
          </button>
        )}
        {isClockedIn && (
          <button onClick={clockOut} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all animate-pulse">
            CLOCK OUT
          </button>
        )}
        {isSessionEnded && (
          <div className="flex gap-2">
            <button onClick={downloadInvoice} className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1">
              <Download className="w-3 h-3" />
              INVOICE
            </button>
            <button onClick={restartSession} className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              RESTART
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
}

function ApiKeyInput({ label, value, onChange, show, onToggleShow, placeholder }: ApiKeyInputProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
        <Key className="w-4 h-4 shrink-0" />
        <span className="truncate">{label}</span>
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 pr-10 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface PrevNextButtonsProps {
  currentStage: number;
  totalStages: number;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  finishLabel: string;
  stacked?: boolean;
}

function PrevNextButtons({ currentStage, totalStages, onPrev, onNext, prevLabel, nextLabel, finishLabel, stacked = false }: PrevNextButtonsProps) {
  return (
    <div className={stacked ? "flex flex-col gap-2 w-full" : "flex gap-4 justify-center"}>
      <button
        onClick={onPrev}
        disabled={currentStage === 1}
        className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${stacked ? "w-full" : ""} ${
          currentStage === 1
            ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        {prevLabel}
      </button>
      <button
        onClick={onNext}
        disabled={currentStage === totalStages}
        className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${stacked ? "w-full" : ""} ${
          currentStage === totalStages
            ? "bg-[#DB2777]/50 text-white cursor-not-allowed"
            : "bg-[#DB2777] text-white hover:bg-[#BE185D]"
        }`}
      >
        {currentStage === totalStages ? finishLabel : nextLabel}
      </button>
    </div>
  );
}

// Reusable panel card wrapper
function PanelCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center px-4 h-12 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</span>
      </div>
      {children}
    </div>
  );
}

function MithrilContent() {
  const {
    currentStage,
    setCurrentStage,
    goToNextStage,
    goToPreviousStage,
    customApiKey,
    setCustomApiKey,
    videoApiKey,
    setVideoApiKey,
    projectType,
    isStageSkipped,
  } = useMithril();
  const { language, dictionary } = useLanguage();

  // Auth + navigation
  const { user, logout, isAuthenticated, isAdmin } = useMithrilAuth();
  const { setLanguageOverride } = useLanguage();
  const pathname = usePathname();
  const [openLanguageDialog, setOpenLanguageDialog] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguageOverride(lang);
    setOpenLanguageDialog(false);
  };

  // API key visibility toggles
  const [showApiKey, setShowApiKey] = useState(false);
  const [showVideoApiKey, setShowVideoApiKey] = useState(false);

  // Stage colors
  const stageColors = [
    { bg: 'bg-yellow-500', text: 'text-yellow-500', ring: 'ring-yellow-500/30' },
    { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500/30' },
    { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500/30' },
    { bg: 'bg-purple-500', text: 'text-purple-500', ring: 'ring-purple-500/30' },
    { bg: 'bg-teal-500', text: 'text-teal-500', ring: 'ring-teal-500/30' },
    { bg: 'bg-indigo-500', text: 'text-indigo-500', ring: 'ring-indigo-500/30' },
    { bg: 'bg-sky-500', text: 'text-sky-500', ring: 'ring-sky-500/30' },
    { bg: 'bg-green-500', text: 'text-green-500', ring: 'ring-green-500/30' },
  ];

  const projectTypeConfig = getProjectTypeConfig(projectType);
  const pipelineStages = useMemo(() => getPipelineStages(projectType), [projectType]);
  const stages = useMemo(
    () => pipelineStages.map((stage, index) => ({
      id: stage.id,
      stepNumber: index + 1,
      label: phrase(dictionary, stage.labelKey, language),
      component: stage.component,
      color: stageColors[index % stageColors.length],
    })),
    [pipelineStages, dictionary, language]
  );

  const currentStageConfig = stages.find(s => s.id === currentStage);
  const StageComponent = currentStageConfig ? STAGE_COMPONENTS[currentStageConfig.component] : null;

  const isTextToVideo = projectType === 'text-to-video';
  const isImageToVideo = projectType === 'image-to-video';

  const needsImageApiKey = (
    (isTextToVideo && (currentStage === 1 || (currentStage >= 3 && currentStage <= 7))) ||
    isImageToVideo
  );
  const needsVideoApiKey = isTextToVideo && currentStage === 8;
  const showCostTracker = isTextToVideo && currentStage === 7;

  const prevLabel = phrase(dictionary, "mithril_previous", language);
  const nextLabel = phrase(dictionary, "mithril_next", language);
  const finishLabel = phrase(dictionary, "mithril_finish", language);
  const pipelineLabel = projectTypeConfig ? phrase(dictionary, projectTypeConfig.labelKey, language) : "Pipeline";
  const settingsLabel = phrase(dictionary, "mithril_settings", language) || "Settings";

  // Stepper rows — shared between desktop right panel and mobile top bar
  const stepperRows = stages.map((stage, index) => {
    const skipped = isStageSkipped(stage.id);
    return (
      <div key={stage.id} className="flex flex-col">
        <button
          onClick={() => !skipped && setCurrentStage(stage.id)}
          disabled={skipped}
          className={`flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors w-full
            ${skipped ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
            ${stage.id === currentStage ? 'bg-gray-100 dark:bg-gray-800' : ''}
          `}
          title={skipped ? 'Skipped (Single Chapter upload)' : undefined}
        >
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
            transition-all duration-200
            ${skipped
              ? "bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-500"
              : stage.id === currentStage
              ? `${stage.color.bg} text-white ring-4 ${stage.color.ring}`
              : stage.id < currentStage
              ? `${stage.color.bg} text-white`
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }
          `}>
            {stage.stepNumber}
          </div>
          <span className={`
            text-xs font-medium leading-tight
            ${skipped
              ? "text-gray-400 dark:text-gray-500 line-through"
              : stage.id === currentStage
              ? stage.color.text
              : stage.id < currentStage
              ? stage.color.text
              : "text-gray-500 dark:text-gray-400"
            }
          `}>
            {stage.label}
          </span>
        </button>
        {index < stages.length - 1 && (
          <div className={`w-px h-4 ml-6 shrink-0 ${stage.id < currentStage ? "bg-gray-400 dark:bg-gray-500" : "bg-gray-200 dark:bg-gray-700"}`} />
        )}
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#111]">

      {/* ── TOP HEADER ── */}
      <header className="fixed top-0 left-0 right-0 h-14 z-20
                         bg-white dark:bg-gray-900
                         border-b border-gray-200 dark:border-gray-800
                         flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-[#DB2777] shrink-0" />
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">Mithril</span>
        </div>
        <div className="flex items-center gap-1">
          {isAuthenticated && user && (
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-2 hidden sm:block truncate max-w-[180px]">
              {user.email}
            </span>
          )}
          <button
            onClick={() => setOpenLanguageDialog(true)}
            title="Language"
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Globe size={16} />
          </button>
          {isAdmin && (
            <Link
              href="/mithril/admin"
              title="Admin"
              className={`p-2 rounded-md transition-colors ${
                pathname.startsWith('/mithril/admin')
                  ? "text-[#DB2777]"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Shield size={16} />
            </Link>
          )}
          <Link
            href="/projects"
            title="Projects"
            className={`p-2 rounded-md transition-colors ${
              pathname === '/projects' || pathname === '/'
                ? "text-[#DB2777]"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <FolderOpen size={16} />
          </Link>
          {isAuthenticated && (
            <button
              onClick={() => logout()}
              title="Logout"
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ── DESKTOP: 3-panel card layout ── */}
      <div className="hidden md:flex fixed top-14 left-0 right-0 bottom-0 gap-3 p-3 bg-[#f0f4f9] dark:bg-[#111]">

        {/* Left panel: Settings */}
        <PanelCard title={settingsLabel} className="w-[280px] shrink-0">
          <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
            {needsImageApiKey && (
              <ApiKeyInput
                label={phrase(dictionary, "mithril_gemini_api_key", language)}
                value={customApiKey}
                onChange={setCustomApiKey}
                show={showApiKey}
                onToggleShow={() => setShowApiKey(v => !v)}
                placeholder={phrase(dictionary, "mithril_gemini_api_key_placeholder", language)}
              />
            )}
            {needsVideoApiKey && (
              <ApiKeyInput
                label={phrase(dictionary, "mithril_gemini_video_api_key", language)}
                value={videoApiKey}
                onChange={setVideoApiKey}
                show={showVideoApiKey}
                onToggleShow={() => setShowVideoApiKey(v => !v)}
                placeholder={phrase(dictionary, "mithril_gemini_api_key_placeholder", language)}
              />
            )}
            {showCostTracker && <CostTrackerDashboard />}
            <div className="flex-1" />
            <PrevNextButtons
              currentStage={currentStage}
              totalStages={stages.length}
              onPrev={goToPreviousStage}
              onNext={goToNextStage}
              prevLabel={prevLabel}
              nextLabel={nextLabel}
              finishLabel={finishLabel}
              stacked
            />
          </div>
        </PanelCard>

        {/* Center panel: Stage content */}
        <PanelCard title={currentStageConfig?.label ?? ""} className="flex-1 min-w-0">
          <div className="flex-1 overflow-y-auto p-6">
            {StageComponent ? <StageComponent /> : (
              <div className="text-center py-12 text-gray-500">
                Stage component not found for: {currentStageConfig?.component}
              </div>
            )}
          </div>
        </PanelCard>

        {/* Right panel: Stepper */}
        <PanelCard title={pipelineLabel} className="w-[220px] shrink-0">
          <div className="flex-1 overflow-y-auto p-3">
            {stepperRows}
          </div>
        </PanelCard>

      </div>

      {/* ── MOBILE: vertical stack (below header) ── */}
      <div className="md:hidden flex flex-col min-h-screen pt-14">

        {/* Mobile stepper */}
        <div className="w-full overflow-x-auto p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-14 z-10">
          <div className="flex items-center justify-center min-w-max px-4">
            {stages.map((stage, index) => {
              const skipped = isStageSkipped(stage.id);
              return (
                <div key={stage.id} className="flex items-center">
                  <button
                    onClick={() => !skipped && setCurrentStage(stage.id)}
                    disabled={skipped}
                    className={`flex flex-col items-center group ${skipped ? 'cursor-not-allowed opacity-50' : ''}`}
                    title={skipped ? 'Skipped (Single Chapter upload)' : undefined}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                      transition-all duration-200
                      ${skipped
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-500 line-through cursor-not-allowed"
                        : stage.id === currentStage
                        ? `${stage.color.bg} text-white ring-4 ${stage.color.ring} cursor-pointer`
                        : stage.id < currentStage
                        ? `${stage.color.bg} text-white cursor-pointer`
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                      }
                    `}>
                      {stage.stepNumber}
                    </div>
                    <span className={`
                      mt-2 text-xs font-medium whitespace-nowrap
                      ${skipped
                        ? "text-gray-400 dark:text-gray-500 line-through"
                        : stage.id === currentStage ? stage.color.text
                        : stage.id < currentStage ? stage.color.text
                        : "text-gray-500 dark:text-gray-400"
                      }
                    `}>
                      {stage.label}
                    </span>
                  </button>
                  {index < stages.length - 1 && (
                    <div className={`w-12 h-1 mx-2 self-start mt-5 ${stage.id < currentStage ? "bg-gray-400 dark:bg-gray-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile content */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Mobile API keys */}
          {(needsImageApiKey || needsVideoApiKey) && (
            <div className="space-y-3">
              {needsImageApiKey && (
                <ApiKeyInput
                  label={phrase(dictionary, "mithril_gemini_api_key", language)}
                  value={customApiKey}
                  onChange={setCustomApiKey}
                  show={showApiKey}
                  onToggleShow={() => setShowApiKey(v => !v)}
                  placeholder={phrase(dictionary, "mithril_gemini_api_key_placeholder", language)}
                />
              )}
              {needsVideoApiKey && (
                <ApiKeyInput
                  label={phrase(dictionary, "mithril_gemini_video_api_key", language)}
                  value={videoApiKey}
                  onChange={setVideoApiKey}
                  show={showVideoApiKey}
                  onToggleShow={() => setShowVideoApiKey(v => !v)}
                  placeholder={phrase(dictionary, "mithril_gemini_api_key_placeholder", language)}
                />
              )}
            </div>
          )}

          {/* Stage content */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            {StageComponent ? <StageComponent /> : null}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="p-4 pb-8">
          <PrevNextButtons
            currentStage={currentStage}
            totalStages={stages.length}
            onPrev={goToPreviousStage}
            onNext={goToNextStage}
            prevLabel={prevLabel}
            nextLabel={nextLabel}
            finishLabel={finishLabel}
          />
        </div>
      </div>

      {/* Language Dialog */}
      <Dialog open={openLanguageDialog} onOpenChange={setOpenLanguageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{phrase(dictionary, "language", language) || "Language"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {langPairList.map((langPair) => (
              <Button
                key={langPair.code}
                variant={language === langPair.code ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleLanguageChange(langPair.code as Language)}
              >
                {langPair.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function Mithril() {
  return (
    <CostProvider>
      <MithrilProvider>
        <MithrilContent />
      </MithrilProvider>
    </CostProvider>
  );
}
