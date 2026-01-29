"use client";

import React, { useState, useRef, useCallback } from "react";
import { Prop, getEasyModeCharacterPrompt } from "./types";

interface PropListViewProps {
  props: Prop[];
  genre: string;
  styleKeyword: string;
  onGenerateImage: (
    propId: string,
    prompt: string,
    referenceImages?: string[]
  ) => Promise<void>;
  onSetReferenceImages: (propId: string, images: string[]) => void;
  onUpdateProp: (propId: string, updates: Partial<Prop>) => void;
  onClose: () => void;
  onClearAll: () => void;
  title?: string;
  accentColor?: "purple" | "cyan";
}

export default function PropListView({
  props,
  genre,
  styleKeyword,
  onGenerateImage,
  onSetReferenceImages,
  onUpdateProp,
  onClose,
  onClearAll,
  title = "Design Sheet Generator",
  accentColor = "cyan",
}: PropListViewProps) {
  // Minimized state
  const [isMinimized, setIsMinimized] = useState(false);
  // Easy Mode state
  const [isEasyMode, setIsEasyMode] = useState(false);

  // Editable prompts per prop (keyed by prop id)
  const [editablePrompts, setEditablePrompts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    props.forEach((prop) => {
      // Append description if not already in prompt
      const desc = prop.description ? ` ${prop.description}` : "";
      if (prop.designSheetPrompt.includes(prop.description)) {
        initial[prop.id] = prop.designSheetPrompt;
      } else {
        initial[prop.id] = `${prop.designSheetPrompt}${desc}`;
      }
    });
    return initial;
  });

  // Track which prop is currently generating
  const [activeLoadingId, setActiveLoadingId] = useState<string | null>(null);

  // File input refs for each prop
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Handle Easy Mode toggle
  const toggleEasyMode = useCallback(
    (enabled: boolean) => {
      setIsEasyMode(enabled);
      if (enabled) {
        // Apply Easy Mode Template
        const newPrompts: Record<string, string> = {};
        props.forEach((prop) => {
          if (prop.category === "character") {
            newPrompts[prop.id] = getEasyModeCharacterPrompt(prop);
          } else {
            // For objects, keep the original prompt
            const desc = prop.description ? ` ${prop.description}` : "";
            newPrompts[prop.id] = prop.designSheetPrompt.includes(prop.description)
              ? prop.designSheetPrompt
              : `${prop.designSheetPrompt}${desc}`;
          }
        });
        setEditablePrompts(newPrompts);
      } else {
        // Revert to default prompts
        const defaultPrompts: Record<string, string> = {};
        props.forEach((prop) => {
          const desc = prop.description ? ` ${prop.description}` : "";
          defaultPrompts[prop.id] = prop.designSheetPrompt.includes(prop.description)
            ? prop.designSheetPrompt
            : `${prop.designSheetPrompt}${desc}`;
        });
        setEditablePrompts(defaultPrompts);
      }
    },
    [props]
  );

  // Handle prompt change
  const handlePromptChange = useCallback((propId: string, value: string) => {
    setEditablePrompts((prev) => ({ ...prev, [propId]: value }));
  }, []);

  // Handle file upload for reference images
  const handleFileUpload = useCallback(
    (propId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const prop = props.find((p) => p.id === propId);
      const currentRefs = [...(prop?.referenceImages || [])];

      const promises = Array.from(files).map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((base64s) => {
        onSetReferenceImages(propId, [...currentRefs, ...base64s]);
      });

      if (e.target) e.target.value = "";
    },
    [props, onSetReferenceImages]
  );

  // Remove a reference image
  const removeReference = useCallback(
    (propId: string, refIdx: number) => {
      const prop = props.find((p) => p.id === propId);
      const currentRefs = [...(prop?.referenceImages || [])];
      currentRefs.splice(refIdx, 1);
      onSetReferenceImages(propId, currentRefs);
    },
    [props, onSetReferenceImages]
  );

  // Handle generate button click
  const handleGenerate = useCallback(
    async (propId: string) => {
      setActiveLoadingId(propId);
      try {
        const prop = props.find((p) => p.id === propId);
        const prompt = editablePrompts[propId] || prop?.designSheetPrompt || "";
        await onGenerateImage(propId, prompt, prop?.referenceImages);
      } finally {
        setActiveLoadingId(null);
      }
    },
    [props, editablePrompts, onGenerateImage]
  );

  // Download generated image
  const downloadImage = useCallback((url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    const safeName = name.replace(/[^a-zA-Z0-9\s_]/g, "").replace(/\s+/g, "_");
    link.download = `${safeName}.png`;
    link.click();
  }, []);

  // Get image URL for a prop
  const getImageUrl = (prop: Prop) => {
    return (
      prop.designSheetImageUrl ||
      (prop.designSheetImageBase64
        ? `data:image/png;base64,${prop.designSheetImageBase64}`
        : null)
    );
  };

  if (props.length === 0) {
    return null;
  }

  // Minimized view - just a small floating button
  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 ${accentColor === "purple" ? "right-36" : "right-4"} z-[100]`}>
        <button
          onClick={() => setIsMinimized(false)}
          className={`px-4 py-2 ${accentColor === "purple" ? "bg-purple-700 hover:bg-purple-600" : "bg-cyan-700 hover:bg-cyan-600"} text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-bold transition-colors`}
        >
          {accentColor === "purple" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
              />
            </svg>
          )}
          {accentColor === "purple" ? "Characters" : "Objects"} ({props.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <div>
            <h2 className={`text-xl font-bold ${accentColor === "purple" ? "text-purple-400" : "text-cyan-400"}`}>
              {title}
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">
              {accentColor === "purple" ? "Character Design & Reference Management" : "Prop Design & Reference Management"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Easy Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-700">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isEasyMode ? "text-green-400" : "text-gray-500"
                }`}
              >
                Easy Mode
              </span>
              <button
                onClick={() => toggleEasyMode(!isEasyMode)}
                className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${
                  isEasyMode ? "bg-green-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                    isEasyMode ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-cyan-400 transition-colors"
                title="Minimize (Fold)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                title="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/20">
        {props.map((prop) => {
          const isItemLoading = activeLoadingId === prop.id;
          const imageUrl = getImageUrl(prop);
          const isCharacter = prop.category === "character";

          return (
            <div
              key={prop.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex flex-col md:flex-row gap-4 shadow-sm min-h-[350px]"
            >
              {/* Left Column: Details */}
              <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-gray-100 flex items-center gap-2 truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isCharacter ? "bg-purple-500" : "bg-cyan-500"
                      }`}
                    />
                    {prop.name}
                    {prop.isVariant && (
                      <span className="text-[8px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-800">
                        VARIANT
                      </span>
                    )}
                    <span
                      className={`text-[8px] px-1 rounded border uppercase ${
                        isCharacter
                          ? "bg-purple-900/30 text-purple-400 border-purple-800"
                          : "bg-teal-900/30 text-teal-400 border-teal-800"
                      }`}
                    >
                      {prop.category}
                    </span>
                  </h3>
                  {prop.appearingClips && prop.appearingClips.length > 0 && (
                    <div className="text-[8px] font-bold text-cyan-500 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800 uppercase shrink-0">
                      {prop.appearingClips.slice(0, 5).join(", ")}
                      {prop.appearingClips.length > 5 && "..."}
                    </div>
                  )}
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/10 p-2 rounded border border-gray-700/50">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">
                      Visual Description (EN)
                    </span>
                    <p
                      className="text-[10px] text-gray-400 leading-snug italic line-clamp-3"
                      title={prop.description}
                    >
                      {prop.description}
                    </p>
                  </div>
                  <div className="space-y-1 border-l border-gray-700/50 pl-3">
                    <span className="text-[8px] font-black text-cyan-700 uppercase tracking-widest block">
                      Purpose/Context (KO)
                    </span>
                    <p
                      className="text-[10px] text-cyan-200 leading-snug line-clamp-3"
                      title={prop.descriptionKo}
                    >
                      {prop.descriptionKo}
                    </p>
                  </div>
                </div>

                {/* Easy Mode Metadata Display (for characters with metadata) */}
                {isCharacter && prop.role && (
                  <div className="flex gap-2 text-[9px] text-gray-500 font-mono border-b border-gray-700/30 pb-1 mb-1">
                    <span>
                      Role: <b className="text-gray-300">{prop.role}</b>
                    </span>
                    <span>*</span>
                    <span>
                      Age: <b className="text-gray-300">{prop.age}</b>
                    </span>
                    <span>*</span>
                    <span>
                      Personality: <b className="text-gray-300">{prop.personality}</b>
                    </span>
                  </div>
                )}

                {/* Context Prompts */}
                {prop.contextPrompts && prop.contextPrompts.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                      Appearing Scenes Context
                    </span>
                    <div className="max-h-24 overflow-y-auto bg-black/20 rounded p-1.5 border border-gray-700/30">
                      {prop.contextPrompts.slice(0, 5).map((ctx, cIdx) => (
                        <div key={cIdx} className="text-[9px] mb-1.5 last:mb-0">
                          <span className="text-cyan-600 font-bold shrink-0">
                            [{ctx.clipId}]
                          </span>{" "}
                          <span
                            className="text-gray-500 italic leading-tight"
                            title={ctx.text}
                          >
                            {ctx.text.substring(0, 100)}
                            {ctx.text.length > 100 && "..."}
                          </span>
                        </div>
                      ))}
                      {prop.contextPrompts.length > 5 && (
                        <div className="text-[8px] text-gray-600">
                          +{prop.contextPrompts.length - 5} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Design Sheet Prompt */}
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                      {isEasyMode && isCharacter
                        ? "Design Sheet Prompt (Easy Mode)"
                        : "Design Sheet Prompt (Advanced)"}
                    </span>
                    {isEasyMode && isCharacter && (
                      <span className="text-[8px] text-green-500 animate-pulse">
                        Template Applied
                      </span>
                    )}
                  </div>
                  <textarea
                    value={editablePrompts[prop.id] || ""}
                    onChange={(e) => handlePromptChange(prop.id, e.target.value)}
                    className={`w-full p-2 bg-black/40 border rounded text-[10px] font-mono focus:ring-1 outline-none transition-all resize-none ${
                      isEasyMode && isCharacter
                        ? "border-green-900 text-green-100 focus:ring-green-500"
                        : "border-gray-700 text-gray-300 focus:ring-cyan-500"
                    }`}
                    rows={3}
                  />
                  <div className="flex items-center gap-2 text-[9px] text-gray-600">
                    <span>Genre: {genre}</span>
                    <span>|</span>
                    <span>Style: {styleKeyword}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-700/50">
                  <button
                    onClick={() => handleGenerate(prop.id)}
                    disabled={isItemLoading}
                    className={`flex-1 py-1.5 hover:opacity-90 disabled:bg-gray-700 text-white text-[10px] font-bold rounded transition-all flex items-center justify-center gap-1.5 ${
                      isEasyMode && isCharacter
                        ? "bg-green-700 hover:bg-green-600"
                        : isCharacter
                        ? "bg-purple-600 hover:bg-purple-500"
                        : "bg-cyan-600 hover:bg-cyan-500"
                    }`}
                  >
                    {isItemLoading ? (
                      <svg
                        className="animate-spin h-4 w-4"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                          />
                        </svg>
                        <span>Generate Design</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => fileInputRefs.current[prop.id]?.click()}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                    title="Upload Reference Images (Multiple)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    <span>+Ref</span>
                  </button>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={(el) => {
                      fileInputRefs.current[prop.id] = el;
                    }}
                    onChange={(e) => handleFileUpload(prop.id, e)}
                    accept="image/*"
                  />
                  {imageUrl && (
                    <button
                      onClick={() => downloadImage(imageUrl, prop.name)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                      <span>DL</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Previews */}
              <div className="w-full md:w-1/2 flex flex-col gap-2">
                {/* Generated Design Sheet */}
                <div className="flex-1 w-full bg-black/60 rounded border border-gray-900 flex items-center justify-center relative shadow-inner overflow-hidden min-h-[200px]">
                  {prop.isGenerating || isItemLoading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <svg
                        className="animate-spin h-10 w-10"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={prop.name}
                      className="max-w-full max-h-full w-full h-full object-contain block"
                    />
                  ) : (
                    <div className="text-center text-gray-700 flex flex-col items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                        className="w-10 h-10 mb-1 opacity-10"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                      <p className="text-[8px] font-bold uppercase tracking-tighter opacity-30">
                        Generated Design
                      </p>
                    </div>
                  )}
                </div>

                {/* Multiple Reference Thumbnails */}
                {prop.referenceImages && prop.referenceImages.length > 0 && (
                  <div className="max-h-[140px] overflow-y-auto w-full bg-black/30 p-2 rounded border border-gray-700/50">
                    <span className="text-[8px] font-black text-cyan-700 uppercase mb-2 block tracking-widest">
                      Reference Stack ({prop.referenceImages.length})
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {prop.referenceImages.map((refImg, rIdx) => (
                        <div
                          key={rIdx}
                          className="relative aspect-square rounded border border-cyan-900 group overflow-hidden"
                        >
                          <img
                            src={refImg}
                            alt={`Reference ${rIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeReference(prop.id, rIdx)}
                            className="absolute top-0 right-0 p-1 bg-red-900/80 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-2.5 h-2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
          <div className="text-[10px] text-gray-500">
            {props.length} items | Genre: {genre}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="px-5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
            >
              Fold Window
            </button>
            <button
              onClick={onClearAll}
              className="px-5 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded text-xs font-bold transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}