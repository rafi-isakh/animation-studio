"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type {
  ProjectItem,
  PromptSlot,
  ModelProvider,
  TimeOfDay,
  BgGeneratorWorkspace,
} from "../types";
import { TIME_MODIFIERS, WORKSPACE_VERSION } from "../constants";
import {
  useBgGeneratorOrchestrator,
  type BgJobUpdate,
} from "./useBgGeneratorOrchestrator";
import { uploadBackgroundImage } from "@/components/Mithril/services/s3/images";

const DEFAULT_FRAMEWORK_GUIDE_PATH = "/prompt/Bidirectional Framework.txt";
const API_KEY_STORAGE_KEY = "bg-generator-api-key";
const WORLDLABS_API_KEY_STORAGE_KEY = "bg-generator-worldlabs-api-key";
const SESSION_PROJECT_PREFIX = "standalone-bg-";
const WORLDLABS_POLL_INTERVAL_MS = 5000;

function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
}

function getStoredWorldLabsApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(WORLDLABS_API_KEY_STORAGE_KEY) || "";
}

function generateSessionProjectId(): string {
  return `${SESSION_PROJECT_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Extract raw base64 data from a data URI or return as-is if already raw.
 */
function extractBase64(dataUri: string): string {
  if (dataUri.includes(",")) {
    return dataUri.split(",")[1];
  }
  return dataUri;
}

export function useBgGenerator() {
  const [style, setStyle] = useState("Makoto Shinkai");
  const [modelProvider, setModelProvider] = useState<ModelProvider>("gemini");
  const [prompts, setPrompts] = useState<PromptSlot[]>([
    { text: "", image: null },
    { text: "", image: null },
    { text: "", image: null },
    { text: "", image: null },
  ]);
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [view, setView] = useState<"input" | "gallery">("input");
  const [isGlobalGenerating, setIsGlobalGenerating] = useState(false);
  const [frameworkGuide, setFrameworkGuide] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    id: string;
    prompt: string;
  } | null>(null);
  const [apiKey, setApiKeyState] = useState(getStoredApiKey);
  const [worldLabsApiKey, setWorldLabsApiKeyState] = useState(getStoredWorldLabsApiKey);

  // Map of itemId → polling interval ID
  const worldLabsPollingRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Session-based project ID for orchestrator job tracking
  const sessionProjectId = useMemo(() => generateSessionProjectId(), []);

  const frameworkInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const galleryFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Ref to access latest items in callbacks without stale closure
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Load default framework guide on mount
  useEffect(() => {
    if (frameworkGuide === null) {
      fetch(DEFAULT_FRAMEWORK_GUIDE_PATH)
        .then((res) => {
          if (res.ok) return res.text();
          throw new Error("Failed to load default framework guide");
        })
        .then((text) => setFrameworkGuide(text))
        .catch((err) => console.error(err));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Orchestrator job update handler ---

  const handleJobUpdate = useCallback((update: BgJobUpdate) => {
    const { itemId, viewKey, status, imageUrl } = update;

    if (status === "completed" && imageUrl) {
      setItems((current) =>
        current.map((item) => {
          if (item.id !== itemId) return item;

          // Front view completion
          if (viewKey === "front") {
            return {
              ...item,
              frontImage: imageUrl,
              status: "idle" as const,
              timeVariants: {
                ...item.timeVariants,
                day: { ...item.timeVariants.day, front: imageUrl },
              },
            };
          }

          // Front view regeneration
          if (viewKey === "front-regen") {
            return {
              ...item,
              frontImage: imageUrl,
              status: "idle" as const,
              timeVariants: {
                ...item.timeVariants,
                day: { ...item.timeVariants.day, front: imageUrl },
              },
            };
          }

          // Back view completion (back-0 or back-1)
          if (viewKey === "back-0" || viewKey === "back-1") {
            const backIdx = viewKey === "back-0" ? 0 : 1;
            const newBackImages = [...item.backImages];
            newBackImages[backIdx] = imageUrl;

            // Check if both back images are done
            const bothDone = newBackImages.length === 2 && newBackImages.every(Boolean);

            return {
              ...item,
              backImages: newBackImages,
              selectedBackImageIndex: bothDone ? 0 : item.selectedBackImageIndex,
              status: bothDone ? ("done" as const) : item.status,
              timeVariants: bothDone
                ? {
                    ...item.timeVariants,
                    day: { ...item.timeVariants.day, back: newBackImages[0] },
                  }
                : item.timeVariants,
            };
          }

          // Time variant completion (e.g., "morning-front", "morning-back")
          const timeMatch = viewKey.match(/^(morning|evening|night)-(front|back)$/);
          if (timeMatch) {
            const [, time, side] = timeMatch;
            const timeKey = time as TimeOfDay;
            const newVariants = { ...item.timeVariants };
            newVariants[timeKey] = {
              ...newVariants[timeKey],
              [side]: imageUrl,
            };

            // If both front and back for this time are done (or back wasn't submitted), set idle
            const frontDone = side === "front" ? true : !!newVariants[timeKey].front;
            const backDone = side === "back" ? true : !!newVariants[timeKey].back;
            // Check if we even submitted a back job - if original has no back, we won't
            const hasOriginalBack = item.backImages.length > 0;
            const allDone = frontDone && (backDone || !hasOriginalBack);

            return {
              ...item,
              status: allDone ? ("idle" as const) : item.status,
              timeVariants: newVariants,
            };
          }

          return item;
        })
      );
    } else if (status === "failed") {
      console.error(`Job failed for ${itemId}/${viewKey}:`, update.error);
      setItems((current) =>
        current.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, status: "idle" as const };
        })
      );
    }
    // For pending/preparing/generating/uploading - no state change needed,
    // the UI already shows generating status from when we submitted
  }, []);

  // --- Orchestrator hook ---

  const orchestrator = useBgGeneratorOrchestrator({
    projectId: sessionProjectId,
    onJobUpdate: handleJobUpdate,
    enabled: true,
  });

  // Apply pending updates from initial Firestore snapshot
  useEffect(() => {
    if (orchestrator.pendingUpdates.length > 0) {
      orchestrator.pendingUpdates.forEach((update) => {
        handleJobUpdate(update);
      });
      orchestrator.clearPendingUpdates();
    }
  }, [orchestrator.pendingUpdates, orchestrator.clearPendingUpdates, handleJobUpdate]);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (typeof window !== "undefined") {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    }
  }, []);

  const setWorldLabsApiKey = useCallback((key: string) => {
    setWorldLabsApiKeyState(key);
    if (typeof window !== "undefined") {
      localStorage.setItem(WORLDLABS_API_KEY_STORAGE_KEY, key);
    }
  }, []);

  // --- S3 upload helper ---

  /**
   * Upload a base64 data URI image to S3 and return the S3 URL.
   * Used for user-uploaded images that need to become reference URLs.
   */
  const uploadImageToS3 = useCallback(
    async (itemId: string, angle: string, dataUri: string): Promise<string> => {
      const base64 = extractBase64(dataUri);
      return uploadBackgroundImage(sessionProjectId, itemId, angle, base64, "image/png");
    },
    [sessionProjectId]
  );

  // --- Direct API helper (for text generation, not image) ---

  const analyzeBackView = useCallback(
    async (
      frontImageBase64: string,
      frontPrompt: string
    ): Promise<string> => {
      const res = await fetch("/api/tools/bg-generator/analyze-back", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontImageBase64,
          frontPrompt,
          style,
          frameworkGuide: frameworkGuide || undefined,
          customApiKey: apiKey || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }
      const data = await res.json();
      return data.description;
    },
    [style, frameworkGuide, apiKey]
  );

  // --- Prompt slot actions ---

  const addPromptSlot = useCallback(() => {
    setPrompts((prev) => [...prev, { text: "", image: null }]);
  }, []);

  const removePromptSlot = useCallback(
    (index: number) => {
      if (prompts.length > 1) {
        setPrompts((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [prompts.length]
  );

  const updatePromptText = useCallback((index: number, value: string) => {
    setPrompts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text: value };
      return updated;
    });
  }, []);

  const handleFrontImageUpload = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrompts((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], image: reader.result as string };
          return updated;
        });
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const removeFrontImage = useCallback(
    (index: number) => {
      setPrompts((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], image: null };
        return updated;
      });
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
    },
    []
  );

  const handleBulkUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fileReaders: Promise<PromptSlot>[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileReaders.push(
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({ text: "", image: reader.result as string });
            };
            reader.readAsDataURL(file);
          })
        );
      }

      Promise.all(fileReaders).then((newItems) => {
        setPrompts((prev) => {
          const updatedPrompts = [...prev];
          let itemIndex = 0;

          for (
            let i = 0;
            i < updatedPrompts.length && itemIndex < newItems.length;
            i++
          ) {
            if (!updatedPrompts[i].text && !updatedPrompts[i].image) {
              updatedPrompts[i] = newItems[itemIndex];
              itemIndex++;
            }
          }

          while (itemIndex < newItems.length) {
            updatedPrompts.push(newItems[itemIndex]);
            itemIndex++;
          }

          return updatedPrompts;
        });
      });

      if (bulkInputRef.current) bulkInputRef.current.value = "";
    },
    []
  );

  // --- Framework guide ---

  const handleFrameworkUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setFrameworkGuide(text);
      };
      reader.readAsText(file);
    },
    []
  );

  // --- Generation via Orchestrator ---

  const handleGenerateFrontViews = useCallback(async () => {
    const validPrompts = prompts.filter(
      (p) => p.text.trim() !== "" || p.image !== null
    );
    if (validPrompts.length === 0) return;

    setIsGlobalGenerating(true);
    setView("gallery");

    const newItems: ProjectItem[] = validPrompts.map((p) => ({
      id: Math.random().toString(36).substring(7),
      frontPrompt: p.text,
      frontImage: p.image,
      backPrompt: null,
      backImages: [],
      selectedBackImageIndex: 0,
      status: p.image ? ("idle" as const) : ("generating-front" as const),
      timeVariants: {
        morning: { front: null, back: null },
        day: { front: p.image, back: null },
        evening: { front: null, back: null },
        night: { front: null, back: null },
      },
      selectedTime: "day" as const,
    }));

    setItems((prev) => [...newItems, ...prev]);

    // For items with uploaded images, upload to S3 so they can be used as references later
    // For items without images, submit generation jobs
    for (const item of newItems) {
      if (item.frontImage) {
        // Upload user-provided image to S3 for future reference use
        try {
          const s3Url = await uploadImageToS3(item.id, "front", item.frontImage);
          setItems((current) =>
            current.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    frontImage: s3Url,
                    timeVariants: {
                      ...i.timeVariants,
                      day: { ...i.timeVariants.day, front: s3Url },
                    },
                  }
                : i
            )
          );
        } catch (error) {
          console.error("Failed to upload front image to S3:", error);
        }
        continue;
      }

      try {
        const fullPrompt = `2D anime background art, ${style} style. ${item.frontPrompt}`;
        await orchestrator.submitJob({
          projectId: sessionProjectId,
          bgId: item.id,
          bgAngle: "front",
          bgName: item.frontPrompt.substring(0, 100) || "Front View",
          prompt: fullPrompt,
          aspectRatio: "16:9",
          apiKey: apiKey || undefined,
        });
      } catch (error) {
        console.error("Failed to submit front view job for", item.id, error);
        setItems((current) =>
          current.map((i) =>
            i.id === item.id ? { ...i, status: "idle" as const } : i
          )
        );
      }
    }
    setIsGlobalGenerating(false);
  }, [prompts, style, sessionProjectId, apiKey, orchestrator, uploadImageToS3]);

  const handleRegenerateFrontView = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setEditingItem({ id, prompt: item.frontPrompt });
    },
    [items]
  );

  const confirmRegenerateFrontView = useCallback(async () => {
    if (!editingItem) return;
    const { id, prompt } = editingItem;
    setEditingItem(null);

    const item = items.find((i) => i.id === id);
    if (!item) return;

    setItems((current) =>
      current.map((i) =>
        i.id === id
          ? { ...i, status: "generating-front" as const, frontPrompt: prompt }
          : i
      )
    );

    try {
      const fullPrompt = `2D anime background art, ${style} style. ${prompt}`;

      // Use existing front image as reference if it's an S3 URL
      const referenceUrl =
        item.frontImage && !item.frontImage.startsWith("data:")
          ? item.frontImage
          : undefined;

      // If front image is a data URI, upload to S3 first
      let uploadedRef = referenceUrl;
      if (!uploadedRef && item.frontImage && item.frontImage.startsWith("data:")) {
        uploadedRef = await uploadImageToS3(id, "front-ref", item.frontImage);
      }

      await orchestrator.submitJob({
        projectId: sessionProjectId,
        bgId: id,
        bgAngle: "front-regen",
        bgName: prompt.substring(0, 100) || "Front Regen",
        prompt: fullPrompt,
        aspectRatio: "16:9",
        referenceUrl: uploadedRef,
        apiKey: apiKey || undefined,
      });
    } catch (error) {
      console.error("Failed to submit front regen job", error);
      setItems((current) =>
        current.map((i) =>
          i.id === id ? { ...i, status: "idle" as const } : i
        )
      );
    }
  }, [editingItem, items, style, sessionProjectId, apiKey, orchestrator, uploadImageToS3]);

  const handleReplaceFrontImage = useCallback(
    (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        // Upload to S3 immediately so it's available as reference
        try {
          const s3Url = await uploadImageToS3(id, "front", dataUri);
          setItems((current) =>
            current.map((i) =>
              i.id === id
                ? {
                    ...i,
                    frontImage: s3Url,
                    timeVariants: {
                      ...i.timeVariants,
                      day: { ...i.timeVariants.day, front: s3Url },
                    },
                  }
                : i
            )
          );
        } catch (error) {
          console.error("Failed to upload replacement image:", error);
          // Fallback to data URI
          setItems((current) =>
            current.map((i) =>
              i.id === id ? { ...i, frontImage: dataUri } : i
            )
          );
        }
      };
      reader.readAsDataURL(file);
    },
    [uploadImageToS3]
  );

  const handleGenerateBackView = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || !item.frontImage) return;

      setItems((current) =>
        current.map((i) =>
          i.id === id ? { ...i, status: "generating-back" as const } : i
        )
      );

      try {
        // Get base64 for the analyze-back API call
        let base64Data: string;
        if (item.frontImage.startsWith("data:")) {
          base64Data = extractBase64(item.frontImage);
        } else {
          // It's an S3 URL - fetch and convert to base64
          const response = await fetch(item.frontImage);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          base64Data = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
        }

        // Step 1: Analyze back view description (direct API call - text generation)
        const backPromptDescription = await analyzeBackView(
          base64Data,
          item.frontPrompt || "A scene matching the reference image"
        );

        // Store the back prompt
        setItems((current) =>
          current.map((i) =>
            i.id === id ? { ...i, backPrompt: backPromptDescription } : i
          )
        );

        const fullBackPrompt = `2D anime background art, ${style} style.
This is the 180-degree REAR VIEW of the provided reference image.
Scene description: ${backPromptDescription}
IMPORTANT: The edges of this image must visually connect with the reference image to form a seamless 360 panorama.
Match the ground texture, horizon line, sky gradient, and lighting direction EXACTLY.`.trim();

        // Ensure front image is on S3 for reference
        let referenceUrl = item.frontImage;
        if (referenceUrl.startsWith("data:")) {
          referenceUrl = await uploadImageToS3(id, "front", referenceUrl);
          // Update item with S3 URL
          setItems((current) =>
            current.map((i) =>
              i.id === id ? { ...i, frontImage: referenceUrl } : i
            )
          );
        }

        // Step 2: Submit 2 back view generation jobs in parallel via orchestrator
        // Initialize backImages array with 2 empty slots
        setItems((current) =>
          current.map((i) =>
            i.id === id ? { ...i, backImages: [null as unknown as string, null as unknown as string] } : i
          )
        );

        await Promise.all([
          orchestrator.submitJob({
            projectId: sessionProjectId,
            bgId: id,
            bgAngle: "back-0",
            bgName: `Back View Option 1`,
            prompt: fullBackPrompt,
            aspectRatio: "16:9",
            referenceUrl,
            apiKey: apiKey || undefined,
          }),
          orchestrator.submitJob({
            projectId: sessionProjectId,
            bgId: id,
            bgAngle: "back-1",
            bgName: `Back View Option 2`,
            prompt: fullBackPrompt,
            aspectRatio: "16:9",
            referenceUrl,
            apiKey: apiKey || undefined,
          }),
        ]);
      } catch (error) {
        console.error("Failed to generate back view", error);
        setItems((current) =>
          current.map((i) =>
            i.id === id ? { ...i, status: "idle" as const } : i
          )
        );
      }
    },
    [items, style, sessionProjectId, apiKey, orchestrator, analyzeBackView, uploadImageToS3]
  );

  const handleGenerateAllBackViews = useCallback(() => {
    items.forEach((item) => {
      if (
        item.frontImage &&
        item.backImages.length === 0 &&
        item.status === "idle"
      ) {
        handleGenerateBackView(item.id);
      }
    });
  }, [items, handleGenerateBackView]);

  const handleGenerateTimeVariant = useCallback(
    async (id: string, time: TimeOfDay) => {
      const item = items.find((i) => i.id === id);
      if (!item || !item.frontImage) return;

      // If variant already cached, just switch
      if (item.timeVariants[time].front) {
        setItems((current) =>
          current.map((i) =>
            i.id === id ? { ...i, selectedTime: time } : i
          )
        );
        return;
      }

      // If selecting 'day', just switch (day is the original)
      if (time === "day") {
        setItems((current) =>
          current.map((i) =>
            i.id === id ? { ...i, selectedTime: "day" } : i
          )
        );
        return;
      }

      setItems((current) =>
        current.map((i) =>
          i.id === id
            ? {
                ...i,
                status: "generating-front" as const,
                selectedTime: time,
              }
            : i
        )
      );

      try {
        const modifier = TIME_MODIFIERS[time];

        // Get the original day front image URL for reference
        const originalFront = item.timeVariants.day.front || item.frontImage;
        if (!originalFront) throw new Error("No base image");

        // Ensure it's on S3
        let frontRefUrl = originalFront;
        if (frontRefUrl.startsWith("data:")) {
          frontRefUrl = await uploadImageToS3(id, "front", frontRefUrl);
        }

        const frontPrompt = `2D anime background art, ${style} style. ${item.frontPrompt}. Time of day: ${modifier}. Maintain the exact same composition and structure as the reference image, only change the lighting and colors to match the time of day.`;

        // Submit front variant job
        await orchestrator.submitJob({
          projectId: sessionProjectId,
          bgId: id,
          bgAngle: `${time}-front`,
          bgName: `${time} Front`,
          prompt: frontPrompt,
          aspectRatio: "16:9",
          referenceUrl: frontRefUrl,
          apiKey: apiKey || undefined,
        });

        // Submit back variant job if we have a back image
        const originalBack =
          item.timeVariants.day.back ||
          (item.backImages.length > 0
            ? item.backImages[item.selectedBackImageIndex]
            : null);

        if (originalBack) {
          let backRefUrl = originalBack;
          if (backRefUrl.startsWith("data:")) {
            backRefUrl = await uploadImageToS3(id, `back-${item.selectedBackImageIndex}`, backRefUrl);
          }

          const backPrompt = `2D anime background art, ${style} style. ${item.backPrompt || "Back view of the scene"}. Time of day: ${modifier}. Maintain the exact same composition and structure as the reference image, only change the lighting and colors to match the time of day.`;

          await orchestrator.submitJob({
            projectId: sessionProjectId,
            bgId: id,
            bgAngle: `${time}-back`,
            bgName: `${time} Back`,
            prompt: backPrompt,
            aspectRatio: "16:9",
            referenceUrl: backRefUrl,
            apiKey: apiKey || undefined,
          });
        }
      } catch (error) {
        console.error("Failed to submit time variant jobs", error);
        setItems((current) =>
          current.map((i) =>
            i.id === id ? { ...i, status: "idle" as const } : i
          )
        );
      }
    },
    [items, style, sessionProjectId, apiKey, orchestrator, uploadImageToS3]
  );

  // --- WorldLabs 3D Generation ---

  const stopWorldLabsPolling = useCallback((itemId: string) => {
    const interval = worldLabsPollingRefs.current.get(itemId);
    if (interval !== undefined) {
      clearInterval(interval);
      worldLabsPollingRefs.current.delete(itemId);
    }
  }, []);

  // Clean up all polling on unmount
  useEffect(() => {
    return () => {
      worldLabsPollingRefs.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  const pollWorldLabsStatus = useCallback(
    (itemId: string, operationId: string, apiKey: string) => {
      const doFetch = async () => {
        try {
          const res = await fetch(
            `/api/tools/bg-generator/worldlabs/status?operationId=${encodeURIComponent(operationId)}&apiKey=${encodeURIComponent(apiKey)}`
          );
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Status poll failed");
          }

          if (data.status === "completed") {
            stopWorldLabsPolling(itemId);
            setItems((current) =>
              current.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      worldLabs: {
                        operationId,
                        status: "completed",
                        worldId: data.worldId,
                        worldMarbleUrl: data.worldMarbleUrl,
                        thumbnailUrl: data.thumbnailUrl,
                        panoUrl: data.panoUrl,
                        splatUrls: data.splatUrls,
                        meshUrl: data.meshUrl,
                      },
                    }
                  : i
              )
            );
          } else if (data.status === "failed") {
            stopWorldLabsPolling(itemId);
            setItems((current) =>
              current.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      worldLabs: {
                        operationId,
                        status: "failed",
                        error: data.error || "WorldLabs generation failed",
                      },
                    }
                  : i
              )
            );
          }
          // "generating" → keep polling
        } catch (err) {
          console.error("[WorldLabs poll]", err);
          stopWorldLabsPolling(itemId);
          setItems((current) =>
            current.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    worldLabs: {
                      ...(i.worldLabs ?? { operationId }),
                      operationId,
                      status: "failed",
                      error: err instanceof Error ? err.message : "Poll error",
                    },
                  }
                : i
            )
          );
        }
      };

      // Poll immediately, then on interval
      doFetch();
      const interval = setInterval(doFetch, WORLDLABS_POLL_INTERVAL_MS);
      worldLabsPollingRefs.current.set(itemId, interval);
    },
    [stopWorldLabsPolling]
  );

  const handleGenerate3DWorld = useCallback(
    async (id: string) => {
      if (!worldLabsApiKey) {
        alert("Please enter your WorldLabs API key first.");
        return;
      }

      const item = itemsRef.current.find((i) => i.id === id);
      if (!item) return;

      // Get the currently displayed front and back images
      const frontUrl =
        item.timeVariants[item.selectedTime]?.front || item.frontImage;
      const backUrl =
        item.timeVariants[item.selectedTime]?.back ||
        item.backImages[item.selectedBackImageIndex];

      if (!frontUrl || !backUrl) {
        alert("Both front and back images are required to generate a 3D world.");
        return;
      }

      // Mark as uploading
      setItems((current) =>
        current.map((i) =>
          i.id === id
            ? {
                ...i,
                worldLabs: {
                  operationId: "",
                  status: "uploading",
                },
              }
            : i
        )
      );

      try {
        const res = await fetch("/api/tools/bg-generator/worldlabs/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontImageUrl: frontUrl,
            backImageUrl: backUrl,
            displayName: item.frontPrompt.substring(0, 80) || "BG World",
            apiKey: worldLabsApiKey,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation request failed");

        const { operationId } = data;

        // Mark as generating and start polling
        setItems((current) =>
          current.map((i) =>
            i.id === id
              ? {
                  ...i,
                  worldLabs: { operationId, status: "generating" },
                }
              : i
          )
        );

        pollWorldLabsStatus(id, operationId, worldLabsApiKey);
      } catch (err) {
        console.error("[WorldLabs generate]", err);
        setItems((current) =>
          current.map((i) =>
            i.id === id
              ? {
                  ...i,
                  worldLabs: {
                    operationId: "",
                    status: "failed",
                    error: err instanceof Error ? err.message : "Unknown error",
                  },
                }
              : i
          )
        );
      }
    },
    [worldLabsApiKey, pollWorldLabsStatus]
  );

  // --- Item actions ---

  const handleDeleteItem = useCallback((id: string) => {
    setItems((current) => current.filter((i) => i.id !== id));
  }, []);

  const setSelectedBackImageIndex = useCallback(
    (id: string, index: number) => {
      setItems((current) =>
        current.map((i) =>
          i.id === id ? { ...i, selectedBackImageIndex: index } : i
        )
      );
    },
    []
  );

  const setSelectedTime = useCallback((id: string, time: TimeOfDay) => {
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, selectedTime: time } : i))
    );
  }, []);

  // --- Download ---

  const downloadImage = useCallback((url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    // For S3 URLs, we need to fetch and create a blob
    if (url.startsWith("http")) {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        })
        .catch(() => {
          // Fallback: try direct link
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // --- Project management ---

  const exportProject = useCallback(() => {
    const projectData: BgGeneratorWorkspace = {
      version: WORKSPACE_VERSION,
      timestamp: new Date().toISOString(),
      style,
      modelProvider,
      prompts,
      items,
      frameworkGuide,
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(projectData));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute(
      "download",
      `bg_generator_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [style, modelProvider, prompts, items, frameworkGuide]);

  const importProject = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.style) setStyle(json.style);
          if (json.modelProvider) setModelProvider(json.modelProvider);
          if (json.prompts) setPrompts(json.prompts);
          if (json.items) setItems(json.items);
          if (json.frameworkGuide) setFrameworkGuide(json.frameworkGuide);

          if (json.items && json.items.length > 0) {
            setView("gallery");
          }
        } catch (error) {
          console.error("Failed to import project", error);
          alert("Invalid project file.");
        }
      };
      reader.readAsText(file);
      if (importInputRef.current) importInputRef.current.value = "";
    },
    []
  );

  return {
    // State
    style,
    setStyle,
    modelProvider,
    setModelProvider,
    prompts,
    items,
    view,
    setView,
    isGlobalGenerating,
    frameworkGuide,
    editingItem,
    setEditingItem,
    apiKey,
    setApiKey,
    worldLabsApiKey,
    setWorldLabsApiKey,

    // Refs
    frameworkInputRef,
    fileInputRefs,
    galleryFileInputRefs,
    bulkInputRef,
    importInputRef,

    // Prompt slot actions
    addPromptSlot,
    removePromptSlot,
    updatePromptText,
    handleFrontImageUpload,
    removeFrontImage,
    handleBulkUpload,

    // Framework
    handleFrameworkUpload,

    // Generation
    handleGenerateFrontViews,
    handleRegenerateFrontView,
    confirmRegenerateFrontView,
    handleReplaceFrontImage,
    handleGenerateBackView,
    handleGenerateAllBackViews,
    handleGenerateTimeVariant,

    // Item actions
    handleDeleteItem,
    setSelectedBackImageIndex,
    setSelectedTime,

    // Download
    downloadImage,

    // Project
    exportProject,
    importProject,

    // WorldLabs
    handleGenerate3DWorld,
  };
}
