# Part Tabs Implementation Plan — WebnovelTrailer Pipeline

## Problem Summary

Stage 4 (`WebnovelTrailerStoryboardGenerator`) overwrites the single in-memory store and single Firestore path each time a new part is generated. This destroys prior parts' data in both memory and persistence. Downstream stages (5, 6, 7, 8) only ever see the most recently generated part.

**Root cause (MithrilContext.tsx ~line 1014):**
```ts
// On generation complete — replaces everything:
setStoryboardGenerator({ scenes: normalizedScenes, ... })
await clearStoryboard(currentProjectId)  // nukes all Firestore scenes
```

The solution is to namespace all storyboard storage by `partIndex` (0-based), hold all parts simultaneously in context as a keyed map, and add part tab UI to each downstream stage so users can filter by part without losing data.

---

## Design Principles

- Work stays **separated per part** — not merged/accumulated
- Part tabs are a **filter** — switching tabs shows that part's data, doesn't change the underlying data
- All parts are **persisted independently in Firestore** — page reload restores all parts
- **Backward compatibility** — existing projects auto-migrate to `part_0` on first load
- Stages 5/6 (global asset stages): tabs filter which part's storyboard to import from, but generated assets (props, backgrounds) are not per-part
- Stages 7/8: frames/clips carry `partIndex`, tabs filter what's displayed

---

## New Firestore Path Structure

**Before:**
```
projects/{id}/storyboard/data/scenes/scene_{sceneIndex}/clips/clip_{clipIndex}
projects/{id}/storyboard/voicePrompts
```

**After:**
```
projects/{id}/storyboard/parts/part_{partIndex}/scenes/scene_{sceneIndex}/clips/clip_{clipIndex}
projects/{id}/storyboard/parts/part_{partIndex}/meta/data
projects/{id}/storyboard/parts/part_{partIndex}/voicePrompts/data
```

Old path kept intact — only read for migration. New code always writes to the new path.

---

## New TypeScript Types

### `firestore/types.ts`

```ts
// Add partIndex to existing types
interface SceneDocument {
  sceneIndex: number;
  sceneTitle: string;
  partIndex?: number; // NEW
}

interface ClipDocument {
  // ...existing...
  partIndex?: number; // NEW
}

// New type
interface StoryboardPartDocument {
  partIndex: number;
  generatedAt: Timestamp;
  jobId?: string | null;
  characterIdSummary?: Array<{ characterId: string; description: string }>;
  genre?: string;
}

// Add partIndex to:
// - SaveClipInput, UpdateClipInput
// - ImageGenFrameDocument, SaveImageGenFrameInput, UpdateImageGenFrameInput
// - VideoClipDocument (webnovelTrailer), SaveVideoClipInput, UpdateVideoClipInput
```

### `MithrilContext.tsx` — Extended state shape

```ts
interface StoryboardPartState {
  scenes: Scene[];
  voicePrompts: VoicePrompt[];
  characterIdSummary?: CharacterIdSummary[];
  genre?: string;
}

type StoryboardPartsMap = Record<number, StoryboardPartState>;

interface StoryboardGeneratorState {
  isGenerating: boolean;
  error: string | null;
  activePartIndex: number;           // NEW — currently viewed part
  parts: StoryboardPartsMap;         // NEW — all generated parts
  // Convenience accessors (point to parts[activePartIndex]):
  scenes: Scene[];
  voicePrompts: VoicePrompt[];
  characterIdSummary?: CharacterIdSummary[];
  genre?: string;
}
```

---

## Implementation Order

### Phase 1 — Foundation (Firestore layer, no UI)

**1. `services/firestore/types.ts`**
- Add `partIndex?: number` to `SceneDocument`, `ClipDocument`, their input types
- Add `StoryboardPartDocument` interface
- Add `partIndex?: number` to `ImageGenFrameDocument` and its input types
- Add `partIndex?: number` to `WebnovelTrailerClipDocument` and its input types

**2. `services/firestore/storyboard.ts`**
- Add part-namespaced ref helpers:
  ```ts
  getPartMetaRef(projectId, partIndex)
  getPartVoicePromptsRef(projectId, partIndex)
  getPartScenesCollection(projectId, partIndex)
  getPartSceneRef(projectId, partIndex, sceneIndex)
  getPartClipsCollection(projectId, partIndex, sceneIndex)
  getPartClipRef(projectId, partIndex, sceneIndex, clipIndex)
  ```
- Add new exported functions:
  ```ts
  getAvailablePartIndices(projectId): Promise<number[]>
  getPartMeta(projectId, partIndex): Promise<StoryboardPartDocument | null>
  savePartMeta(projectId, partIndex, data): Promise<void>
  getPartVoicePrompts(projectId, partIndex): Promise<VoicePromptDocument[]>
  savePartVoicePrompts(projectId, partIndex, prompts): Promise<void>
  getPartScenes(projectId, partIndex): Promise<SceneDocument[]>
  getPartClips(projectId, partIndex, sceneIndex): Promise<ClipDocument[]>
  savePartScene(projectId, partIndex, sceneIndex, input): Promise<void>
  savePartClip(projectId, partIndex, sceneIndex, clipIndex, input): Promise<void>
  updatePartClipField(projectId, partIndex, sceneIndex, clipIndex, field, value): Promise<void>
  updatePartClipImage(projectId, partIndex, sceneIndex, clipIndex, imageRef): Promise<void>
  clearStoryboardPart(projectId, partIndex): Promise<void>
  loadStoryboardPart(projectId, partIndex): Promise<{ meta, scenes, clips, voicePrompts }>
  migrateOldStoryboardToPartZero(projectId): Promise<boolean>
  ```
- Keep all existing functions unchanged (still used by other pipeline types)
- `clearStoryboardPart` must use chunked batches if scene+clip count > 500

**3. `services/firestore/imageGen.ts`**
- Add `partIndex` field support to `saveImageGenFrame` and related functions

**4. `services/firestore/webnovelTrailer.ts`**
- Add `partIndex` field support to `saveWebnovelTrailerClip`, `saveWebnovelTrailerClipsBatch`

---

### Phase 2 — MithrilContext

**5. `MithrilContext.tsx`**

New context methods to expose:
```ts
setActiveStoryboardPartIndex: (partIndex: number) => void
getScenesForPart: (partIndex: number) => Scene[]
getGeneratedPartIndices: () => number[]
```

Key changes:

- `StoryboardGeneratorState` shape: add `activePartIndex`, `parts: StoryboardPartsMap`
- Initial state: `{ isGenerating: false, error: null, activePartIndex: 0, parts: {}, scenes: [], voicePrompts: [], ... }`

- `startStoryboardGeneration`: add `partIndex: number` parameter, propagated through to job submission

- `processStoryboardUpdate` (on job complete):
  - Replace `clearStoryboard(currentProjectId)` → `clearStoryboardPart(currentProjectId, partIndex)`
  - Write scenes/clips using `savePartScene` / `savePartClip` instead of old functions
  - Update state with `setStoryboardGenerator(prev => ({ ...prev, parts: { ...prev.parts, [partIndex]: { scenes, voicePrompts, ... } }, activePartIndex: partIndex, scenes, voicePrompts, ... }))`
  - Also update `stageResults[4]` to include `parts` map and `activePartIndex`

- `loadFromFirestore`:
  - Call `migrateOldStoryboardToPartZero(currentProjectId)` first (skip if jobId in old meta)
  - Call `getAvailablePartIndices(currentProjectId)` to find all parts
  - Load each part via `loadStoryboardPart` in parallel
  - Build `StoryboardPartsMap`, set `activePartIndex` to highest available index

- `importStoryboard(scenes, voicePrompts, characterIdSummary, genre, partIndex)`:
  - Add `partIndex` param
  - Replace `clearStoryboard` → `clearStoryboardPart(currentProjectId, partIndex)`
  - Write to part-namespaced Firestore
  - Update `parts[partIndex]` in state

- `clearStoryboardGeneration(partIndex?: number)`:
  - If `partIndex` provided: clear only that part from Firestore + remove from `parts` map
  - If no `partIndex`: clear all parts

- `setActiveStoryboardPartIndex(partIndex)`:
  - Reads `parts[partIndex]`, updates `activePartIndex` + convenience accessors
  - Syncs `stageResults[4]` active part

- `updateClipPrompt` / `updateClipImageRef` / `splitStartEndFrames`:
  - Change to use `updatePartClipField` / `updatePartClipImage` with `storyboardGenerator.activePartIndex`

- `originalStoryboard` → change to `originalStoryboards: Record<number, { scenes, voicePrompts, ... }>`

**⚠️ Risk: Search for all `getStageResult(4)` usages before deploying:**
```bash
grep -r "getStageResult(4)" src/
```
All consumers of `stageResults[4]` must handle the new shape `{ parts, activePartIndex, scenes, ... }`.

---

### Phase 3 — Stage 4 UI

**6. `WebnovelTrailerStoryboardGenerator/components/WebnovelTrailerStoryboardGenerator.tsx`**

- Rename `selectedPartIndex` → `selectedSourcePartIndex` (selects which text chunk to generate from)
- Add "Generated Parts" tab bar showing `getGeneratedPartIndices()` — clicking calls `setActiveStoryboardPartIndex`
- Active generated part tab shows the storyboard table for that part
- Pass `selectedSourcePartIndex` to `startStoryboardGeneration`
- `handleGenerate` now passes `partIndex: selectedSourcePartIndex`
- JSON/CSV downloads use `storyboardGenerator.activePartIndex + 1` for filenames
- `handleImportJSON` calls `importStoryboard(data.scenes, ..., storyboardGenerator.activePartIndex)`
- Add "Clear This Part" button → `clearStoryboardGeneration(storyboardGenerator.activePartIndex)`

**Part tab bar UI pattern (use for all stages):**
```tsx
{generatedPartIndices.length > 0 && (
  <div className="p-1 bg-[#211F21] border border-[#272727] rounded-lg flex gap-1 flex-wrap">
    {generatedPartIndices.map((partIdx) => (
      <button
        key={partIdx}
        onClick={() => setActiveStoryboardPartIndex(partIdx)}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          activeDisplayPartIndex === partIdx
            ? 'bg-[#DB2777] text-white hover:bg-[#BE185D]'
            : 'text-gray-400 hover:text-[#E8E8E8]'
        }`}
      >
        Part {partIdx + 1}
      </button>
    ))}
  </div>
)}
```

---

### Phase 4 — Downstream Stages (can be done in any order)

**7. `PropDesigner/index.tsx`**
- Add local `selectedPartIndex` state (view-only, does not change context)
- Add part tab bar using `getGeneratedPartIndices()` — tabs filter which part's scenes are used for detection
- `activeScenes` derived from `getScenesForPart(selectedPartIndex)` when no CSV imported
- Add "Scan All Parts" option that concatenates all parts' scenes for detection:
  ```ts
  const scenesForDetection = scanAllParts
    ? getGeneratedPartIndices().flatMap(idx => getScenesForPart(idx))
    : activeScenes;
  ```

**8. `WebnovelTrailerBgSheetGenerator/index.tsx`**
- Add local `selectedPartIndex` state
- Add part tab bar above "Import from Storyboard" button
- `handleImportFromStoryboard` uses `getScenesForPart(selectedPartIndex)` instead of `storyboardGenerator.scenes`
- Import button disabled when `getScenesForPart(selectedPartIndex).length === 0`

**9. `WebnovelTrailerImageGenerator/ImageGeneratorOrchestrator.tsx`**
- Add `partIndex?: number` to `ImageGenFrame` type
- Add local `selectedPartIndex` state
- `loadFramesFromStoryboard` iterates all generated parts:
  ```ts
  for (const partIdx of getGeneratedPartIndices()) {
    getScenesForPart(partIdx).forEach((scene, sceneIndex) => {
      scene.clips.forEach((clip, clipIndex) => {
        newFrames.push({ ...frame, partIndex: partIdx });
      });
    });
  }
  ```
- `filteredFrames = frames.filter(f => (f.partIndex ?? 0) === selectedPartIndex)`
- Display uses `filteredFrames`, all Firestore operations still target full `frames`
- `saveCompletedFrame` persists `partIndex: frame.partIndex ?? 0` in Firestore doc
- Add part tab bar

**10. `WebnovelTrailer/index.tsx`**
- Add `partIndex?: number` to `CsvFrame` type
- Add local `selectedPartIndex` state
- `filteredFrames = frames.filter(f => (f.partIndex ?? 0) === selectedPartIndex)`
- Display grid uses `filteredFrames`; all bulk operations (Generate All, ZIP download) also operate only on `filteredFrames` for the selected part
- `handleLoadFromStage7`: tag each loaded frame with `imageFrame.partIndex ?? 0`
- CSV append: new frames default to `partIndex: selectedPartIndex`
- Manual "Add Clip": defaults to `partIndex: selectedPartIndex`
- Firestore save: include `partIndex` in clip document
- Restore from Firestore: read `clip.partIndex ?? 0`
- Part tabs derived from distinct `partIndex` values in all loaded `frames`
- Add part tab bar

---

## Known Risks & Edge Cases

| Risk | Mitigation |
|------|-----------|
| Old projects have data at `storyboard/data/scenes/...` | `migrateOldStoryboardToPartZero` auto-migrates on first load; skips if `part_0` already exists or if a jobId is active |
| `scene_0` collision between parts | Fixed by including `partIndex` in the Firestore path: `parts/part_{partIndex}/scenes/scene_{sceneIndex}` |
| Firestore batch > 500 ops in `clearStoryboardPart` | Use chunked batches committed sequentially |
| `splitStartEndFrames` in MithrilContext uses old Firestore path | Update to use `updatePartClipField(currentProjectId, activePartIndex, ...)` |
| `originalStoryboard` reset state only holds one part | Change to `Record<number, StoryboardPartState>` |
| `getStageResult(4)` consumers may break on new shape | Search and audit all consumers before Phase 2 deploy |
| CSV import into Stage 7 (not from Stage 4) — what partIndex? | Default to `selectedPartIndex` at time of import |
| Bulk "Generate All" in Stage 8 — should it span all parts or just selected? | Only the selected part's `filteredFrames` |
| PropDesigner CSV import overrides context scenes | Keep as-is — CSV import path is separate, tabs only affect context path |
| Pre-existing bug: `clearStoryboardGeneration` calls `clearStageResult(5)` not `clearStageResult(4)` | Do not fix in this PR — separate issue |

---

## Files Changed Summary

| File | Type of Change |
|------|---------------|
| `services/firestore/types.ts` | Add `partIndex` fields to 6+ types, add `StoryboardPartDocument` |
| `services/firestore/storyboard.ts` | Add ~12 new exported functions + ref helpers, keep all existing |
| `services/firestore/imageGen.ts` | Add `partIndex` to save functions |
| `services/firestore/webnovelTrailer.ts` | Add `partIndex` to save functions |
| `MithrilContext.tsx` | Refactor `StoryboardGeneratorState`, update 5+ functions, add 3 new methods |
| `WebnovelTrailerStoryboardGenerator.tsx` | Add generated-parts tab bar, rename state, wire generation |
| `PropDesigner/index.tsx` | Add part tab bar, update scene source |
| `WebnovelTrailerBgSheetGenerator/index.tsx` | Add part tab bar, update import source |
| `WebnovelTrailerImageGenerator/ImageGeneratorOrchestrator.tsx` | Add `partIndex` to frames, multi-part load, part tab bar |
| `WebnovelTrailer/index.tsx` | Add `partIndex` to clips, part tab bar, filter display |
