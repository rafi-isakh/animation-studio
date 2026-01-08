# Firebase Migration - Project Tasks

## Overview

Migration from localStorage/IndexedDB to **Firestore + S3** for the Mithril component.

### Architecture Decision

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Metadata, text, prompts | **Firestore** | Real-time sync, structured queries |
| Images (characters, backgrounds, storyboard) | **S3** | Existing infrastructure, cost-effective |
| Videos | **S3** | Already implemented, large files |

**Key Change:** Replace localStorage/IndexedDB with Firestore. Keep S3 for all binary files.

---

## Phase 1: Project Setup & Authentication

### 1.1 Firebase Project Setup
- [ ] Create Firebase project in Firebase Console
- [ ] Enable Firestore database (start in test mode)
- [ ] Enable Firebase Authentication (Email/Password + Google)
- [ ] Generate Firebase config for web app
- [ ] Add Firebase config to environment variables (`.env.local`)

### 1.2 Install Dependencies
- [ ] Install `firebase` package
- [ ] (Optional) Install `react-firebase-hooks` for easier integration

### 1.3 Firebase Client Initialization
- [ ] Create `src/lib/firebase.ts` - Firebase app initialization
- [ ] Create `src/lib/firestore.ts` - Firestore instance export
- [ ] Create `src/contexts/AuthContext.tsx` - Auth state management

### 1.4 Authentication UI
- [ ] Create login/signup component
- [ ] Add logout functionality to header/sidebar
- [ ] Gate Mithril behind authentication check
- [ ] Handle auth loading and error states

---

## Phase 2: Firestore Data Types

### 2.1 Create Type Definitions
- [ ] Create `src/components/Mithril/services/firestore/types.ts`

```typescript
// Types to define:
- MithrilMetadata
- ChapterDocument
- StorySplitterDocument
- CharacterSheetDocument
- CharacterDocument
- BgSheetDocument
- BackgroundDocument
- StoryboardDocument
- SceneDocument
- ClipDocument
- SoraVideosDocument
- SoraClipDocument
```

---

## Phase 3: Firestore Service Layer

### 3.1 Metadata Service
- [ ] Create `src/components/Mithril/services/firestore/metadata.ts`
  - [ ] `getMetadata(userId)`
  - [ ] `updateMetadata(userId, updates)`
  - [ ] `updateCurrentStage(userId, stage)`
  - [ ] `subscribeToMetadata(userId, callback)`

### 3.2 Chapter Service (Stage 1)
- [ ] Create `src/components/Mithril/services/firestore/chapter.ts`
  - [ ] `getChapter(userId)`
  - [ ] `saveChapter(userId, content, filename)`
  - [ ] `deleteChapter(userId)`

### 3.3 Story Splitter Service (Stage 2)
- [ ] Create `src/components/Mithril/services/firestore/storySplitter.ts`
  - [ ] `getStorySplitter(userId)`
  - [ ] `saveStorySplitter(userId, guidelines, parts)`
  - [ ] `deleteStorySplitter(userId)`

### 3.4 Character Sheet Service (Stage 3)
- [ ] Create `src/components/Mithril/services/firestore/characterSheet.ts`
  - [ ] `getCharacterSheetSettings(userId)`
  - [ ] `saveCharacterSheetSettings(userId, styleKeyword, basePrompt)`
  - [ ] `getCharacters(userId)`
  - [ ] `saveCharacter(userId, character)` - includes S3 `imageRef`
  - [ ] `updateCharacter(userId, characterId, updates)`
  - [ ] `updateCharacterImage(userId, characterId, imageRef, imagePrompt)`
  - [ ] `deleteCharacter(userId, characterId)`
  - [ ] `clearCharacterSheet(userId)` - delete settings + all characters
  - [ ] `subscribeToCharacters(userId, callback)`

### 3.5 Background Sheet Service (Stage 4)
- [ ] Create `src/components/Mithril/services/firestore/bgSheet.ts`
  - [ ] `getBgSheetSettings(userId)`
  - [ ] `saveBgSheetSettings(userId, styleKeyword, basePrompt)`
  - [ ] `getBackgrounds(userId)`
  - [ ] `saveBackground(userId, background)` - includes S3 `imageRefs`
  - [ ] `updateBackground(userId, bgId, updates)`
  - [ ] `updateBackgroundAngleImage(userId, bgId, angle, imageRef, prompt)`
  - [ ] `deleteBackground(userId, bgId)`
  - [ ] `clearBgSheet(userId)` - delete settings + all backgrounds
  - [ ] `subscribeToBackgrounds(userId, callback)`

### 3.6 Storyboard Service (Stage 5)
- [ ] Create `src/components/Mithril/services/firestore/storyboard.ts`
  - [ ] `getStoryboardMeta(userId)`
  - [ ] `saveStoryboardMeta(userId, generatedAt)`
  - [ ] `getScenes(userId)`
  - [ ] `saveScene(userId, sceneIndex, sceneData)`
  - [ ] `getClips(userId, sceneIndex)`
  - [ ] `saveClip(userId, sceneIndex, clipIndex, clipData)`
  - [ ] `updateClipField(userId, sceneIndex, clipIndex, field, value)`
  - [ ] `updateClipImage(userId, sceneIndex, clipIndex, imageRef)`
  - [ ] `clearStoryboard(userId)` - cascade delete
  - [ ] `subscribeToScenes(userId, callback)`

### 3.7 Sora Videos Service (Stage 6)
- [ ] Create `src/components/Mithril/services/firestore/soraVideos.ts`
  - [ ] `getSoraVideosMeta(userId)`
  - [ ] `saveSoraVideosMeta(userId, aspectRatio)`
  - [ ] `getSoraClips(userId)`
  - [ ] `saveSoraClip(userId, clipId, data)`
  - [ ] `updateSoraClipStatus(userId, clipId, status, s3FileName?, error?)`
  - [ ] `clearSoraVideos(userId)`

### 3.8 Service Index
- [ ] Create `src/components/Mithril/services/firestore/index.ts` - export all

---

## Phase 4: S3 Service Layer (Refactor)

### 4.1 Consolidate S3 Image Services
- [ ] Create `src/components/Mithril/services/s3/images.ts`
  - [ ] `uploadCharacterImage(userId, characterId, base64)` → returns S3 URL
  - [ ] `deleteCharacterImage(userId, characterId)`
  - [ ] `uploadBackgroundImage(userId, bgId, angle, base64)` → returns S3 URL
  - [ ] `deleteBackgroundImage(userId, bgId, angle)`
  - [ ] `deleteAllBackgroundImages(userId, bgId)`
  - [ ] `uploadStoryboardImage(userId, sceneIndex, clipIndex, base64)` → returns S3 URL
  - [ ] `deleteStoryboardImage(userId, sceneIndex, clipIndex)`
  - [ ] `clearAllUserImages(userId)`

### 4.2 Update S3 Key Structure
- [ ] Update S3 keys to include userId for isolation:
  ```
  mithril/{userId}/characters/{characterId}.webp
  mithril/{userId}/backgrounds/{bgId}/{angle}.webp
  mithril/{userId}/storyboard/{sceneIndex}_{clipIndex}.webp
  mithril/{userId}/videos/{clipId}.mp4
  ```

### 4.3 Update Existing S3 API Routes
- [ ] Update `/api/generate_character_sheet/image` to use userId in S3 key
- [ ] Update `/api/generate_bg_sheet/image` to use userId in S3 key
- [ ] Update `/api/storyboard/image` to use userId in S3 key (if exists)
- [ ] Update `/api/sora_video` routes to use userId in S3 key

---

## Phase 5: Migrate MithrilContext

### 5.1 Add Auth Integration
- [ ] Import `useAuth` hook in MithrilContext
- [ ] Get `userId` from auth context
- [ ] Handle unauthenticated state

### 5.2 Remove Legacy Patterns
- [ ] Remove `sessionStorage` stage restoration hack
- [ ] Remove localStorage hydration useEffects

### 5.3 Add Firestore Integration
- [ ] Initialize Firestore listeners on mount (when userId available)
- [ ] Update `currentStage` to sync with Firestore metadata
- [ ] Cleanup listeners on unmount

### 5.4 Migrate storySplitter State
- [ ] Replace localStorage read with Firestore `getStorySplitter`
- [ ] Update `startStorySplit` to save to Firestore
- [ ] Update `clearStorySplit` to delete from Firestore
- [ ] Remove localStorage `story_splitter_result` usage

### 5.5 Migrate characterSheetGenerator State
- [ ] Replace localStorage read with Firestore `getCharacterSheet`
- [ ] Update `startCharacterSheetAnalysis` to save to Firestore
- [ ] Update `clearCharacterSheetAnalysis` to delete from Firestore
- [ ] Update `setCharacterSheetResult` to write to Firestore
- [ ] Remove localStorage `character_sheet_result` usage

### 5.6 Migrate bgSheetGenerator State
- [ ] Replace localStorage read with Firestore `getBgSheet`
- [ ] Update `startBgSheetAnalysis` to save to Firestore
- [ ] Update `clearBgSheetAnalysis` to delete from Firestore
- [ ] Update `setBgSheetResult` to write to Firestore
- [ ] Remove localStorage `bg_sheet_result` usage

### 5.7 Migrate storyboardGenerator State
- [ ] Replace localStorage read with Firestore `getStoryboard`
- [ ] Update `startStoryboardGeneration` to save to Firestore
- [ ] Update `clearStoryboardGeneration` to delete from Firestore
- [ ] Update `updateClipPrompt` to write to Firestore
- [ ] Update `getOriginalClipPrompt` to read from Firestore (or remove)
- [ ] Remove localStorage `storyboard_result` usage
- [ ] Remove localStorage `storyboard_result_original` usage

### 5.8 Migrate customApiKey
- [ ] Move `customApiKey` to Firestore metadata (encrypted)
- [ ] Remove localStorage `mithril_custom_api_key` usage

---

## Phase 6: Update Stage Components

### 6.1 UploadManager.tsx (Stage 1)
- [ ] Add auth context import
- [ ] Replace localStorage read with Firestore
- [ ] Update `handleFileSelect` to save to Firestore
- [ ] Update `handleClear` to delete from Firestore
- [ ] Remove localStorage usage

### 6.2 StorySplitter.tsx (Stage 2)
- [ ] Add auth context import
- [ ] Use context methods (already uses useMithril)
- [ ] Remove S3 save/load buttons
- [ ] Remove `handleSaveToS3` and `handleLoadFromS3`
- [ ] Remove page reload logic

### 6.3 CharacterSheetGenerator/index.tsx (Stage 3)
- [ ] Add auth context import
- [ ] Replace IndexedDB calls with S3 service calls
- [ ] Update image URL references to use S3 URLs
- [ ] Remove S3 session save/load buttons
- [ ] Update image generation to use new S3 service

### 6.4 CharacterSheetGenerator/CharacterSheetImageEditor.tsx
- [ ] Update image upload to use S3 service
- [ ] Update image display to use S3 URLs

### 6.5 BgSheetGenerator/index.tsx (Stage 4)
- [ ] Add auth context import
- [ ] Replace IndexedDB calls with S3 service calls
- [ ] Update image URL references to use S3 URLs
- [ ] Remove S3 session save/load buttons
- [ ] Update image generation to use new S3 service

### 6.6 BgSheetGenerator/BgSheetImageEditor.tsx
- [ ] Update image upload to use S3 service
- [ ] Update image display to use S3 URLs

### 6.7 StoryboardGenerator Components (Stage 5)
- [ ] Update `StoryboardGenerator.tsx` - remove S3 session buttons
- [ ] Update `StoryboardTable.tsx` - use S3 image URLs
- [ ] Update `ClipTableRow.tsx` - use S3 image URLs

### 6.8 SoraVideoGenerator/index.tsx (Stage 6)
- [ ] Replace localStorage with Firestore for metadata
- [ ] Keep S3 video storage (no change)
- [ ] Remove S3 session save/load buttons
- [ ] Update `autoSave` to write to Firestore
- [ ] Update `handleSave` to write to Firestore
- [ ] Update `handleClear` to delete from Firestore

---

## Phase 7: Security & Rules

### 7.1 Firestore Security Rules
- [ ] Write rules for `/users/{userId}/mithril/**`
- [ ] Ensure only authenticated owner can read/write
- [ ] Test with Firebase Emulator
- [ ] Deploy to production

### 7.2 S3 Bucket Policy (if needed)
- [ ] Review S3 bucket policies for user isolation
- [ ] Ensure signed URLs or proper access control

---

## Phase 8: Cleanup

### 8.1 Remove Deprecated Code
- [ ] Delete `src/components/Mithril/services/mithrilIndexedDB.ts`
- [ ] Remove all localStorage calls from Mithril components
- [ ] Remove sessionStorage usage

### 8.2 Remove S3 Session API Routes
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

### 8.3 Update Imports
- [ ] Remove unused imports
- [ ] Update barrel exports

---

## Phase 9: Testing

### 9.1 Unit Tests
- [ ] Test Firestore service functions
- [ ] Test S3 service functions
- [ ] Test auth context

### 9.2 Integration Tests
- [ ] Test Stage 1 → 2 data flow
- [ ] Test Stage 2 → 3 data flow
- [ ] Test Stage 3 → 4 data flow
- [ ] Test Stage 4 → 5 data flow
- [ ] Test Stage 5 → 6 data flow

### 9.3 Manual Testing Checklist
- [ ] New user signup → empty state
- [ ] File upload → persists on refresh
- [ ] Story split → data saved
- [ ] Character generation → images stored in S3, metadata in Firestore
- [ ] Background generation → all 8 angles work
- [ ] Storyboard generation → clips editable, auto-saved
- [ ] Sora video generation → videos work
- [ ] Logout → login → data restored
- [ ] Clear data → clean slate
- [ ] Cross-device sync (login on two devices)

---

## Phase 10: Documentation & Deployment

### 10.1 Documentation
- [ ] Update FIREBASE_MIGRATION.md with final details
- [ ] Document environment variables needed
- [ ] Document auth flow for users

### 10.2 Deployment
- [ ] Add Firebase config to production env
- [ ] Deploy Firestore security rules
- [ ] Deploy application
- [ ] Monitor for errors
- [ ] Verify functionality

---

## Task Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 11 | Project Setup & Auth |
| 2 | 1 | Data Types |
| 3 | 41 | Firestore Service Layer |
| 4 | 11 | S3 Service Refactor |
| 5 | 27 | Migrate MithrilContext |
| 6 | 14 | Update Stage Components |
| 7 | 4 | Security Rules |
| 8 | 13 | Cleanup |
| 9 | 15 | Testing |
| 10 | 5 | Docs & Deploy |
| **Total** | **~142** | |

---

## Recommended Timeline

| Week | Phases | Deliverables |
|------|--------|--------------|
| 1 | 1, 2 | Firebase setup, auth working, types defined |
| 2 | 3 | All Firestore services complete |
| 3 | 4, 5.1-5.4 | S3 refactor, context auth + Stage 1-2 |
| 4 | 5.5-5.8 | Context Stage 3-6 migration |
| 5 | 6 | All components updated |
| 6 | 7, 8 | Security rules, cleanup |
| 7 | 9, 10 | Testing, deployment |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  AuthContext    │  │  MithrilContext │                   │
│  │  (Firebase Auth)│  │  (State Mgmt)   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────────────────────────────┐                │
│  │         Firestore Services              │                │
│  │  (metadata, chapter, characters, etc.)  │                │
│  └────────────────────┬────────────────────┘                │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌───────────────┐               ┌───────────────┐
│   Firestore   │               │      S3       │
│               │               │               │
│ • metadata    │               │ • characters/ │
│ • chapter     │               │ • backgrounds/│
│ • splitter    │               │ • storyboard/ │
│ • characters  │◄─── refs ────►│ • videos/     │
│ • backgrounds │               │               │
│ • storyboard  │               │               │
│ • soraVideos  │               │               │
└───────────────┘               └───────────────┘
```

---

## Key Differences from Firebase Storage Plan

| Aspect | Firebase Storage Plan | S3 Plan (This) |
|--------|----------------------|----------------|
| Image storage | Firebase Storage | S3 (existing) |
| Video storage | Firebase Storage | S3 (existing) |
| New dependencies | firebase, storage SDK | firebase only |
| S3 routes | Remove all | Keep image/video routes |
| Migration effort | Higher (move images) | Lower (keep images) |
| Cost | Firebase Storage pricing | Existing S3 costs |
