"use client";

import React, { useState, useRef } from "react";
import { X, Loader2, Sparkles } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: string; // base64 or URL
  characterName: string;
  onSave: (editedImageBase64: string) => void;
  styleReferenceBase64?: string;
  customApiKey?: string;
}

/**
 * ProfileEditModal Component
 *
 * A modal for editing profile images with AI:
 * - View the original image
 * - Enter a prompt describing the desired change
 * - AI generates the edited image while preserving the character
 */
export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  originalImage,
  characterName,
  onSave,
  styleReferenceBase64,
  customApiKey,
}) => {
  const [editPrompt, setEditPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setEditPrompt("");
      setError(null);
    }
  }, [isOpen]);

  // Convert image to base64 for API submission
  const getImageAsBase64 = async (): Promise<string> => {
    // If already base64, extract and return
    if (originalImage.startsWith("data:")) {
      return originalImage.split(",")[1];
    }
    if (!originalImage.startsWith("http://") && !originalImage.startsWith("https://")) {
      // Raw base64 string
      return originalImage;
    }

    // For URLs, use the image proxy
    const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(originalImage)}`);
    if (!response.ok) {
      throw new Error("Failed to load image for processing");
    }
    const data = await response.json();
    if (!data.base64) {
      throw new Error("Failed to convert image");
    }
    return data.base64;
  };

  // Handle edit submission
  const handleSubmit = async () => {
    if (!editPrompt.trim()) {
      setError("Please enter an edit prompt describing what you want to change");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const imageBase64 = await getImageAsBase64();

      const response = await fetch("/api/generate_character_sheet/edit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalImageBase64: imageBase64,
          editPrompt: editPrompt.trim(),
          styleReferenceBase64,
          customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to edit image");
      }

      if (data.imageBase64) {
        onSave(data.imageBase64);
        onClose();
      } else {
        throw new Error("No image returned from API");
      }
    } catch (err) {
      console.error("Edit profile error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">Edit Profile</h2>
            <p className="text-xs text-gray-400">{characterName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {/* Image Preview - using same approach as CharacterDetail */}
          <div className="flex-1 flex items-center justify-center bg-gray-950 rounded-lg overflow-hidden min-h-[300px]">
            <img
              ref={imgRef}
              src={originalImage}
              alt={`${characterName} profile`}
              className="max-w-full max-h-[50vh] object-contain rounded-lg"
            />
          </div>

          {/* Edit Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What do you want to change?
            </label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              disabled={isProcessing}
              placeholder="e.g., Change hair color to blue, Make eyes green, Add a scar on the cheek, Change outfit to a red dress..."
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Be specific about what you want to change. The AI will try to preserve everything else.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !editPrompt.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Apply Edit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;