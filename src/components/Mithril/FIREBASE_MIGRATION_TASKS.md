# Firebase Migration - Project Tasks

## Overview

Migration from localStorage/IndexedDB to **Firestore + S3** for the Mithril component.

### Architecture Decision

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Metadata, text, prompts | **Firestore** | Real-time sync, structured queries |
| Images (characters, backgrounds, storyboard) | **S3** | Existing infrastructure, cost-effective |
| Videos | **S3** | Already implemented, large files |

**Key Changes:**
- Replace localStorage/IndexedDB with Firestore
- Keep S3 for all binary files
- **Project-based structure** (not user-based) - multiple users can collaborate
- Use existing **NextAuth** for authentication (no Firebase Auth)

---

## Data Structure

### Firestore Structure

```
├── projects/
│   └── {projectId}/
│       ├── metadata                    # (document)
│       │   ├── name: string
│       │   ├── createdAt: timestamp
│       │   ├── updatedAt: timestamp
│       │   └── currentStage: number
│       │
│       ├── chapter                     # (document)
│       │   ├── content: string
│       │   └── filename: string
│       │
│       ├── storySplits                 # (document)
│       │   ├── guidelines: string
│       │   └── parts: array
│       │
│       ├── characterSheet              # (document)
│       │   ├── styleKeyword: string
│       │   ├── basePrompt: string
│       │   └── characters/             # (subcollection)
│       │       └── {characterId}/
│       │           ├── name: string
│       │           ├── description: string
│       │           ├── imageRef: string (S3 URL)
│       │           ├── imagePrompt: string
│       │           └── ...
│       │
│       ├── bgSheet                     # (document)
│       │   ├── styleKeyword: string
│       │   ├── basePrompt: string
│       │   └── backgrounds/            # (subcollection)
│       │       └── {bgId}/
│       │           ├── name: string
│       │           ├── description: string
│       │           ├── angles: map { angle: { imageRef, prompt } }
│       │           └── ...
│       │
│       └── storyboard                  # (document)
│           ├── generatedAt: timestamp
│           ├── aspectRatio: string
│           └── scenes/                 # (subcollection)
│               └── {sceneIndex}/
│                   ├── sceneData...
│                   └── clips/          # (subcollection)
│                       └── {clipIndex}/
│                           ├── prompt: string
│                           ├── voicePrompt: string
│                           ├── imageRef: string (S3 URL)
│                           ├── videoRef: string (S3 URL)
│                           ├── videoStatus: string
│                           └── ...
```

### S3 Key Structure

```
mithril/{projectId}/
├── characters/{characterId}.webp
├── backgrounds/{bgId}/{angle}.webp
├── storyboard/{sceneIndex}_{clipIndex}.webp
└── videos/{clipId}.mp4
```

---

## Phase 1: Firebase Project Setup

### 1.1 Firebase Console Setup
- [ ] Create Firebase project in Firebase Console
- [ ] Enable Firestore database (start in test mode)
- [ ] Generate Firebase config for web app
- [ ] Add Firebase config to environment variables (`.env.local`)

### 1.2 Install Dependencies
- [ ] Install `firebase` package

### 1.3 Firebase Client Initialization
- [ ] Create `src/lib/firebase.ts` - Firebase app initialization
- [ ] Create `src/lib/firestore.ts` - Firestore instance export

---

## Phase 2: Project Management

### 2.1 Project Context
- [ ] Create `src/contexts/ProjectContext.tsx`
  - [ ] `currentProjectId` state
  - [ ] `setCurrentProject(projectId)` method
  - [ ] `clearCurrentProject()` method

### 2.2 Project Service
- [ ] Create `src/components/Mithril/services/firestore/projects.ts`
  - [ ] `createProject(name)` → returns projectId
  - [ ] `getProject(projectId)` → returns metadata
  - [ ] `listProjects()` → returns all projects
  - [ ] `updateProject(projectId, updates)`
  - [ ] `deleteProject(projectId)` → cascade delete all data
  - [ ] `subscribeToProjects(callback)` → real-time list

### 2.3 Project List Page
- [ ] Create `/projects` page route
- [ ] Create `ProjectListPage.tsx` component
  - [ ] Display all projects in a grid/list
  - [ ] "Create New Project" button
  - [ ] Click project → navigate to `/mithril?project={projectId}`
- [ ] Create `CreateProjectModal.tsx` component
  - [ ] Project name input
  - [ ] Create button → calls `createProject()`

### 2.4 Mithril Route Integration
- [ ] Update Mithril page to read `projectId` from URL query
- [ ] Redirect to `/projects` if no projectId provided
- [ ] Load project data on mount

---

## Phase 3: Firestore Type Definitions

### 3.1 Create Type Definitions
- [ ] Create `src/components/Mithril/services/firestore/types.ts`

```typescript
// Types to define:
interface ProjectMetadata {
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  currentStage: number;
}

interface ChapterDocument {
  content: string;
  filename: string;
}

interface StorySplitsDocument {
  guidelines: string;
  parts: StoryPart[];
}

interface CharacterSheetDocument {
  styleKeyword: string;
  basePrompt: string;
}

interface CharacterDocument {
  name: string;
  description: string;
  imageRef: string;
  imagePrompt: string;
  // ... other fields
}

interface BgSheetDocument {
  styleKeyword: string;
  basePrompt: string;
}

interface BackgroundDocument {
  name: string;
  description: string;
  angles: Record<string, { imageRef: string; prompt: string }>;
  // ... other fields
}

interface StoryboardDocument {
  generatedAt: Timestamp;
  aspectRatio: string;
}

interface SceneDocument {
  // scene-level data
}

interface ClipDocument {
  prompt: string;
  voicePrompt: string;
  imageRef: string;
  videoRef: string;
  videoStatus: string;
  // ... other fields
}
```

---

## Phase 4: Firestore Service Layer

### 4.1 Metadata Service
- [ ] Create `src/components/Mithril/services/firestore/metadata.ts`
  - [ ] `getMetadata(projectId)`
  - [ ] `updateMetadata(projectId, updates)`
  - [ ] `updateCurrentStage(projectId, stage)`
  - [ ] `subscribeToMetadata(projectId, callback)`

### 4.2 Chapter Service (Stage 1)
- [ ] Create `src/components/Mithril/services/firestore/chapter.ts`
  - [ ] `getChapter(projectId)`
  - [ ] `saveChapter(projectId, content, filename)`
  - [ ] `deleteChapter(projectId)`

### 4.3 Story Splitter Service (Stage 2)
- [ ] Create `src/components/Mithril/services/firestore/storySplitter.ts`
  - [ ] `getStorySplits(projectId)`
  - [ ] `saveStorySplits(projectId, guidelines, parts)`
  - [ ] `deleteStorySplits(projectId)`

### 4.4 Character Sheet Service (Stage 3)
- [ ] Create `src/components/Mithril/services/firestore/characterSheet.ts`
  - [ ] `getCharacterSheetSettings(projectId)`
  - [ ] `saveCharacterSheetSettings(projectId, styleKeyword, basePrompt)`
  - [ ] `getCharacters(projectId)`
  - [ ] `saveCharacter(projectId, character)` - includes S3 `imageRef`
  - [ ] `updateCharacter(projectId, characterId, updates)`
  - [ ] `updateCharacterImage(projectId, characterId, imageRef, imagePrompt)`
  - [ ] `deleteCharacter(projectId, characterId)`
  - [ ] `clearCharacterSheet(projectId)` - delete settings + all characters
  - [ ] `subscribeToCharacters(projectId, callback)`

### 4.5 Background Sheet Service (Stage 4)
- [ ] Create `src/components/Mithril/services/firestore/bgSheet.ts`
  - [ ] `getBgSheetSettings(projectId)`
  - [ ] `saveBgSheetSettings(projectId, styleKeyword, basePrompt)`
  - [ ] `getBackgrounds(projectId)`
  - [ ] `saveBackground(projectId, background)` - includes S3 `imageRefs`
  - [ ] `updateBackground(projectId, bgId, updates)`
  - [ ] `updateBackgroundAngleImage(projectId, bgId, angle, imageRef, prompt)`
  - [ ] `deleteBackground(projectId, bgId)`
  - [ ] `clearBgSheet(projectId)` - delete settings + all backgrounds
  - [ ] `subscribeToBackgrounds(projectId, callback)`

### 4.6 Storyboard Service (Stage 5)
- [ ] Create `src/components/Mithril/services/firestore/storyboard.ts`
  - [ ] `getStoryboardMeta(projectId)`
  - [ ] `saveStoryboardMeta(projectId, data)`
  - [ ] `getScenes(projectId)`
  - [ ] `saveScene(projectId, sceneIndex, sceneData)`
  - [ ] `getClips(projectId, sceneIndex)`
  - [ ] `saveClip(projectId, sceneIndex, clipIndex, clipData)`
  - [ ] `updateClipField(projectId, sceneIndex, clipIndex, field, value)`
  - [ ] `updateClipImage(projectId, sceneIndex, clipIndex, imageRef)`
  - [ ] `updateClipVideo(projectId, sceneIndex, clipIndex, videoRef, status)`
  - [ ] `clearStoryboard(projectId)` - cascade delete scenes and clips
  - [ ] `subscribeToScenes(projectId, callback)`
  - [ ] `subscribeToClips(projectId, sceneIndex, callback)`

### 4.7 Service Index
- [ ] Create `src/components/Mithril/services/firestore/index.ts` - export all

---

## Phase 5: S3 Service Layer (Refactor)

### 5.1 Consolidate S3 Image Services
- [ ] Create `src/components/Mithril/services/s3/images.ts`
  - [ ] `uploadCharacterImage(projectId, characterId, base64)` → returns S3 URL
  - [ ] `deleteCharacterImage(projectId, characterId)`
  - [ ] `uploadBackgroundImage(projectId, bgId, angle, base64)` → returns S3 URL
  - [ ] `deleteBackgroundImage(projectId, bgId, angle)`
  - [ ] `deleteAllBackgroundImages(projectId, bgId)`
  - [ ] `uploadStoryboardImage(projectId, sceneIndex, clipIndex, base64)` → returns S3 URL
  - [ ] `deleteStoryboardImage(projectId, sceneIndex, clipIndex)`
  - [ ] `uploadVideo(projectId, clipId, data)` → returns S3 URL
  - [ ] `deleteVideo(projectId, clipId)`
  - [ ] `clearAllProjectImages(projectId)`

### 5.2 Update Existing S3 API Routes
- [ ] Update `/api/generate_character_sheet/image` to use projectId in S3 key
- [ ] Update `/api/generate_bg_sheet/image` to use projectId in S3 key
- [ ] Update `/api/storyboard/image` to use projectId in S3 key (if exists)
- [ ] Update `/api/sora_video` routes to use projectId in S3 key

---

## Phase 6: Migrate MithrilContext

### 6.1 Add Project Integration
- [ ] Import `useProject` hook in MithrilContext
- [ ] Get `projectId` from project context
- [ ] Handle no-project state (redirect to project list)

### 6.2 Remove Legacy Patterns
- [ ] Remove `sessionStorage` stage restoration hack
- [ ] Remove localStorage hydration useEffects

### 6.3 Add Firestore Integration
- [ ] Initialize Firestore listeners on mount (when projectId available)
- [ ] Update `currentStage` to sync with Firestore metadata
- [ ] Cleanup listeners on unmount

### 6.4 Migrate storySplitter State
- [ ] Replace localStorage read with Firestore `getStorySplits`
- [ ] Update `startStorySplit` to save to Firestore
- [ ] Update `clearStorySplit` to delete from Firestore
- [ ] Remove localStorage `story_splitter_result` usage

### 6.5 Migrate characterSheetGenerator State
- [ ] Replace localStorage read with Firestore `getCharacterSheet`
- [ ] Update `startCharacterSheetAnalysis` to save to Firestore
- [ ] Update `clearCharacterSheetAnalysis` to delete from Firestore
- [ ] Update `setCharacterSheetResult` to write to Firestore
- [ ] Remove localStorage `character_sheet_result` usage

### 6.6 Migrate bgSheetGenerator State
- [ ] Replace localStorage read with Firestore `getBgSheet`
- [ ] Update `startBgSheetAnalysis` to save to Firestore
- [ ] Update `clearBgSheetAnalysis` to delete from Firestore
- [ ] Update `setBgSheetResult` to write to Firestore
- [ ] Remove localStorage `bg_sheet_result` usage

### 6.7 Migrate storyboardGenerator State
- [ ] Replace localStorage read with Firestore `getStoryboard`
- [ ] Update `startStoryboardGeneration` to save to Firestore
- [ ] Update `clearStoryboardGeneration` to delete from Firestore
- [ ] Update `updateClipPrompt` to write to Firestore
- [ ] Remove localStorage `storyboard_result` usage
- [ ] Remove localStorage `storyboard_result_original` usage

### 6.8 Migrate customApiKey
- [ ] Move `customApiKey` to Firestore project metadata
- [ ] Remove localStorage `mithril_custom_api_key` usage

---

## Phase 7: Update Stage Components

### 7.1 UploadManager.tsx (Stage 1)
- [ ] Add project context import
- [ ] Replace localStorage read with Firestore
- [ ] Update `handleFileSelect` to save to Firestore
- [ ] Update `handleClear` to delete from Firestore
- [ ] Remove localStorage usage

### 7.2 StorySplitter.tsx (Stage 2)
- [ ] Add project context import
- [ ] Use context methods (already uses useMithril)
- [ ] Remove S3 save/load buttons
- [ ] Remove `handleSaveToS3` and `handleLoadFromS3`
- [ ] Remove page reload logic

### 7.3 CharacterSheetGenerator/index.tsx (Stage 3)
- [ ] Add project context import
- [ ] Replace IndexedDB calls with S3 service calls
- [ ] Update image URL references to use S3 URLs
- [ ] Remove S3 session save/load buttons
- [ ] Update image generation to use new S3 service

### 7.4 CharacterSheetGenerator/CharacterSheetImageEditor.tsx
- [ ] Update image upload to use S3 service
- [ ] Update image display to use S3 URLs

### 7.5 BgSheetGenerator/index.tsx (Stage 4)
- [ ] Add project context import
- [ ] Replace IndexedDB calls with S3 service calls
- [ ] Update image URL references to use S3 URLs
- [ ] Remove S3 session save/load buttons
- [ ] Update image generation to use new S3 service

### 7.6 BgSheetGenerator/BgSheetImageEditor.tsx
- [ ] Update image upload to use S3 service
- [ ] Update image display to use S3 URLs

### 7.7 StoryboardGenerator Components (Stage 5)
- [ ] Update `StoryboardGenerator.tsx` - remove S3 session buttons
- [ ] Update `StoryboardTable.tsx` - use S3 image URLs
- [ ] Update `ClipTableRow.tsx` - use S3 image URLs

### 7.8 SoraVideoGenerator/index.tsx (Stage 6)
- [ ] Replace localStorage with Firestore for metadata
- [ ] Keep S3 video storage (no change)
- [ ] Remove S3 session save/load buttons
- [ ] Update `autoSave` to write to Firestore
- [ ] Update `handleSave` to write to Firestore
- [ ] Update `handleClear` to delete from Firestore

---

## Phase 8: Security & Rules

### 8.1 Firestore Security Rules
- [ ] Write rules for `/projects/{projectId}/**`
- [ ] Allow read/write for authenticated users (open collaboration)
- [ ] Test with Firebase Emulator
- [ ] Deploy to production

### 8.2 S3 Bucket Policy (if needed)
- [ ] Review S3 bucket policies
- [ ] Ensure signed URLs or proper access control

---

## Phase 9: Cleanup

### 9.1 Remove Deprecated Code
- [ ] Delete `src/components/Mithril/services/mithrilIndexedDB.ts`
- [ ] Remove all localStorage calls from Mithril components
- [ ] Remove sessionStorage usage

### 9.2 Remove S3 Session API Routes
- [ ] Delete `/api/mithril_session/storysplitter/save`
- [ ] Delete `/api/mithril_session/storysplitter/load`
- [ ] Delete `/api/mithril_session/charactersheet/save`
- [ ] Delete `/api/mithril_session/charactersheet/load`
- [ ] Delete `/api/mithril_session/bgsheet/save`
- [ ] Delete `/api/mithril_session/bgsheet/load`
- [ ] Delete `/api/mithril_session/storyboard/save`
- [ ] Delete `/api/mithril_session/storyboard/load`
- [ ] Delete `/api/mithril_session/sora/save`
- [ ] Delete `/api/mithril_session/sora/load`

### 9.3 Update Imports
- [ ] Remove unused imports
- [ ] Update barrel exports

---

## Phase 10: Testing

### 10.1 Unit Tests
- [ ] Test Firestore service functions
- [ ] Test S3 service functions
- [ ] Test project context

### 10.2 Integration Tests
- [ ] Test project creation flow
- [ ] Test Stage 1 → 2 data flow
- [ ] Test Stage 2 → 3 data flow
- [ ] Test Stage 3 → 4 data flow
- [ ] Test Stage 4 → 5 data flow
- [ ] Test Stage 5 → 6 data flow

### 10.3 Manual Testing Checklist
- [ ] Create new project → empty state
- [ ] File upload → persists on refresh
- [ ] Story split → data saved
- [ ] Character generation → images stored in S3, metadata in Firestore
- [ ] Background generation → all 8 angles work
- [ ] Storyboard generation → clips editable, auto-saved
- [ ] Sora video generation → videos work
- [ ] Navigate away → return → data restored
- [ ] Clear data → clean slate
- [ ] Multiple browser tabs → same project syncs

---

## Phase 11: Documentation & Deployment

### 11.1 Documentation
- [ ] Update FIREBASE_MIGRATION.md with final details
- [ ] Document environment variables needed
- [ ] Document project workflow for users

### 11.2 Deployment
- [ ] Add Firebase config to production env
- [ ] Deploy Firestore security rules
- [ ] Deploy application
- [ ] Monitor for errors
- [ ] Verify functionality

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 6 | Firebase Project Setup |
| 2 | 12 | Project Management |
| 3 | 1 | Type Definitions |
| 4 | 35 | Firestore Service Layer |
| 5 | 12 | S3 Service Refactor |
| 6 | 26 | Migrate MithrilContext |
| 7 | 14 | Update Stage Components |
| 8 | 4 | Security Rules |
| 9 | 13 | Cleanup |
| 10 | 14 | Testing |
| 11 | 5 | Docs & Deploy |
| **Total** | **~142** | |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  ProjectContext │  │  MithrilContext │                   │
│  │  (Project Mgmt) │  │  (State Mgmt)   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────────────────────────────┐                │
│  │         Firestore Services              │                │
│  │  (projects, chapter, characters, etc.)  │                │
│  └────────────────────┬────────────────────┘                │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌───────────────┐               ┌───────────────┐
│   Firestore   │               │      S3       │
│               │               │               │
│ projects/     │               │ mithril/      │
│  {projectId}/ │               │  {projectId}/ │
│   ├─metadata  │               │   ├─characters/│
│   ├─chapter   │◄─── refs ────►│   ├─backgrounds/│
│   ├─storySplits│              │   ├─storyboard/│
│   ├─characterSheet│           │   └─videos/   │
│   │  └─characters/│           │               │
│   ├─bgSheet   │               │               │
│   │  └─backgrounds/│          │               │
│   └─storyboard│               │               │
│      └─scenes/│               │               │
│        └─clips/│              │               │
└───────────────┘               └───────────────┘
```

---

## Key Differences from Previous Plan

| Aspect | Previous (User-based) | Current (Project-based) |
|--------|----------------------|------------------------|
| Data isolation | Per user | Per project |
| Collaboration | Not supported | Multiple users can edit |
| URL structure | `/mithril` | `/mithril?project={id}` |
| Project selection | N/A | Project list page |
| Firebase Auth | Required | Not needed (use NextAuth) |
| User tracking | Required | Not needed |
| S3 keys | `mithril/{userId}/...` | `mithril/{projectId}/...` |
