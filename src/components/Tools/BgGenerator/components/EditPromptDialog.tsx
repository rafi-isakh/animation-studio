"use client";

import { RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface EditPromptDialogProps {
  editingItem: { id: string; prompt: string } | null;
  onClose: () => void;
  onPromptChange: (prompt: string) => void;
  onConfirm: () => void;
}

export default function EditPromptDialog({
  editingItem,
  onClose,
  onPromptChange,
  onConfirm,
}: EditPromptDialogProps) {
  return (
    <AnimatePresence>
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Edit Prompt & Regenerate
              </h3>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">
                Refine your description for the AI:
              </label>
              <textarea
                value={editingItem.prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm ring-offset-zinc-950 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB2777] focus-visible:ring-offset-2 text-zinc-100 h-32 resize-none"
              />
              <p className="text-xs text-zinc-500">
                The current image will be used as a reference. Changes to the
                prompt will guide the editing process.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 py-2 px-4 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 py-2 px-4 bg-[#DB2777] text-white hover:bg-[#BE185D] shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
