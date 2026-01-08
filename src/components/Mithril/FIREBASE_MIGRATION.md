# Mithril Firebase Migration Plan


## Overview

This document outlines the migration plan from the current localStorage/IndexedDB/S3 architecture to Firebase (Firestore + Storage).

---

## Current Architecture

### Data Flow

```
Stage 1: File Selection
    │   └─ localStorage["chapter"] + ["chapter_filename"]
    ▼
Stage 2: Story Splitting (API: /api/split_story)
    │   └─ localStorage["story_splitter_result"] → { parts: string[] }
    ▼
Stage 3: Character Analysis (API: /api/generate_character_sheet/analyze)
    │   └─ localStorage["character_sheet_result"]
    │   └─ IndexedDB: character images
    ▼
Stage 4: Background Analysis (API: /api/generate_bg_sheet/analyze)
    │   └─ localStorage["bg_sheet_result"]
    │   └─ IndexedDB: background images (8 angles per BG)
    ▼
Stage 5: Storyboard Generation (API: /api/generate_storyboard)
    │   └─ localStorage["storyboard_result"] + ["storyboard_result_original"]
    │   └─ IndexedDB: scene images
    ▼
Stage 6: Video Generation (Sora API)
```

### Current Storage

| Storage | Purpose |
|---------|---------|
| localStorage | Metadata, text data, prompts |
| IndexedDB | Large binary data (images) via `mithrilIndexedDB.ts` |
| S3 | Cloud session persistence (manual save/load) |
| sessionStorage | Stage restoration after S3 load reload |

### Pain Points

1. **localStorage/IndexedDB** - Client-only, no cross-device sync
2. **S3 sessions** - Manual save/load, no real-time sync
3. **No user authentication** - Sessions tied to browser, not user
4. **Page reload hack** - `sessionStorage` workaround for state restoration

---

## Migration Decision

**Option A: Single Session Model (Selected)**

- No `{sessionId}` level in the data model
- Mirrors current localStorage behavior (one project at a time)
- Simpler paths and code
- Can extend to multi-session later if needed

---

## Firebase Data Model

### Structure Overview

```
users/{userId}/mithril/
│
├── metadata (document)
├── chapter (document)
├── storySplitter (document)
├── characterSheet (document)
│   └── characters (subcollection)
├── bgSheet (document)
│   └── backgrounds (subcollection)
├── storyboard (document)
│   └── scenes (subcollection)
│       └── {sceneIndex}/clips (subcollection)
└── soraVideos (document)
    └── clips (subcollection)
```

### Firebase Storage Structure

```
users/{userId}/mithril/
    ├── characters/{characterId}.webp
    ├── backgrounds/{bgId}/{angle}.webp
    ├── storyboard/{sceneIndex}_{clipIndex}.webp
    └── videos/{clipId}.mp4
```

---

## Sample Data

### 1. Metadata Document

**Path:** `users/{userId}/mithril/metadata`

```json
{
  "currentStage": 3,
  "storyName": "내 딸이 검술천재",
  "updatedAt": "2025-01-08T10:30:00Z",
  "customApiKey": "AIzaSy..."
}
```

### 2. Chapter Document

**Path:** `users/{userId}/mithril/chapter`

```json
{
  "filename": "내 딸이 검술천재",
  "content": "1화. 시작\n\n\"아버지, 저 검술 배우고 싶어요.\"..."
}
```

### 3. Story Splitter Document

**Path:** `users/{userId}/mithril/storySplitter`

```json
{
  "guidelines": "클리프행어는 궁금증과 기대감을 폭발시키는 장면으로서...",
  "parts": [
    "1화. 시작\n\n\"아버지, 저 검술 배우고 싶어요.\"...",
    "2화. 첫 수련\n\n새벽 안개가 도장을 감싸고 있었다...",
    "3화. 재능의 발현\n\n수련을 시작한 지 한 달..."
  ]
}
```

### 4. Character Sheet

**Document Path:** `users/{userId}/mithril/characterSheet`

```json
{
  "styleKeyword": "anime, detailed, vibrant colors",
  "basePrompt": "Korean webtoon style, clean lines, expressive eyes"
}
```

**Subcollection Document:** `characterSheet/characters/{characterId}`

```json
{
  "name": "유하은",
  "appearance": "열 살 소녀, 검은 단발머리, 큰 눈, 작은 체구",
  "clothing": "흰색 도복, 검은 띠",
  "personality": "호기심 많고 끈기 있음, 밝고 활발함",
  "backgroundStory": "검술 명가의 외동딸로 태어났으나...",
  "imagePrompt": "10 year old Korean girl, short black hair...",
  "imageRef": "users/{userId}/mithril/characters/{characterId}.webp"
}
```

### 5. Background Sheet

**Document Path:** `users/{userId}/mithril/bgSheet`

```json
{
  "styleKeyword": "traditional Korean, detailed architecture",
  "basePrompt": "Korean historical setting, Joseon dynasty aesthetic"
}
```

**Subcollection Document:** `bgSheet/backgrounds/{bgId}`

```json
{
  "name": "유가 도장",
  "description": "전통 한옥 양식의 넓은 도장, 나무 바닥, 벽에 걸린 검들",
  "images": {
    "Front View": {
      "prompt": "Traditional Korean dojo interior, front view, anime style",
      "imageRef": "users/{userId}/mithril/backgrounds/{bgId}/front_view.webp"
    },
    "Side View (Left)": {
      "prompt": "Traditional Korean dojo interior, side angle left, anime style",
      "imageRef": "users/{userId}/mithril/backgrounds/{bgId}/side_view_left.webp"
    }
  }
}
```

### 6. Storyboard

**Document Path:** `users/{userId}/mithril/storyboard`

```json
{
  "generatedAt": "2025-01-08T09:15:00Z"
}
```

**Scene Document:** `storyboard/scenes/{sceneIndex}`

```json
{
  "title": "Scene 1: 딸의 소원"
}
```

**Clip Document:** `storyboard/scenes/{sceneIndex}/clips/{clipIndex}`

```json
{
  "imagePrompt": "Interior of traditional Korean home, afternoon sunlight...",
  "videoPrompt": "Camera slowly zooms in on the daughter's face, soft lighting",
  "dialogue": "아버지, 저 검술 배우고 싶어요.",
  "dialogueEn": "Father, I want to learn swordsmanship.",
  "sfx": "찻잔 내려놓는 소리",
  "sfxEn": "Sound of teacup being set down",
  "bgm": "잔잔한 가야금 연주",
  "bgmEn": "Gentle gayageum melody",
  "soraVideoPrompt": "Interior of traditional Korean home... Camera slowly zooms in...",
  "imageRef": "users/{userId}/mithril/storyboard/0_0.webp"
}
```

### 7. Sora Videos

**Document Path:** `users/{userId}/mithril/soraVideos`

```json
{
  "lastUpdated": "2025-01-08T11:00:00Z"
}
```

**Clip Document:** `soraVideos/clips/{clipId}`

```json
{
  "sceneIndex": 0,
  "clipIndex": 0,
  "status": "done",
  "taskId": "sora_task_abc123",
  "videoRef": "users/{userId}/mithril/videos/0_0.mp4",
  "error": null
}
```

---

## Path Reference

| Data | Firestore Path |
|------|----------------|
| Current stage | `users/{uid}/mithril/metadata` |
| Chapter text | `users/{uid}/mithril/chapter` |
| Split parts | `users/{uid}/mithril/storySplitter` |
| All characters | `users/{uid}/mithril/characterSheet/characters` |
| Single character | `users/{uid}/mithril/characterSheet/characters/{charId}` |
| All backgrounds | `users/{uid}/mithril/bgSheet/backgrounds` |
| Single background | `users/{uid}/mithril/bgSheet/backgrounds/{bgId}` |
| All scenes | `users/{uid}/mithril/storyboard/scenes` |
| Single clip | `users/{uid}/mithril/storyboard/scenes/{idx}/clips/{idx}` |

---

## Mapping: Current Storage to Firebase

### localStorage to Firestore

| localStorage Key | Firestore Path |
|------------------|----------------|
| `chapter` | `users/{uid}/mithril/chapter.content` |
| `chapter_filename` | `users/{uid}/mithril/chapter.filename` |
| `story_splitter_result` | `users/{uid}/mithril/storySplitter` |
| `character_sheet_result` | `users/{uid}/mithril/characterSheet` + subcollection |
| `bg_sheet_result` | `users/{uid}/mithril/bgSheet` + subcollection |
| `storyboard_result` | `users/{uid}/mithril/storyboard` + subcollections |
| `storyboard_result_original` | `users/{uid}/mithril/storyboard.originalSnapshot` |
| `mithril_custom_api_key` | `users/{uid}/mithril/metadata.customApiKey` |

### IndexedDB to Firebase Storage

| IndexedDB Store | Firebase Storage Path |
|-----------------|----------------------|
| Character images | `users/{uid}/mithril/characters/{charId}.webp` |
| Background images | `users/{uid}/mithril/backgrounds/{bgId}/{angle}.webp` |
| Storyboard scene images | `users/{uid}/mithril/storyboard/{scene}_{clip}.webp` |

---

## Security Rules

### Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/mithril/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

### Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/mithril/{allPaths=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

---

## Design Considerations

### Why This Structure?

1. **Document Size Limit (1MB)**: Split large data into separate documents/subcollections
2. **Query Patterns**: Subcollections allow independent queries for characters, backgrounds, scenes
3. **Write Efficiency**: Granular documents mean updating one clip doesn't rewrite entire storyboard
4. **Real-time Listeners**: Targeted listeners on specific documents reduce unnecessary updates
5. **Security Rules**: Hierarchical structure enables clean rule inheritance
6. **Offline Support**: Smaller documents sync faster when back online

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Subcollection | Independent queries, no size limit | More reads for full fetch |
| Nested Object | Single read for all data | 1MB limit, full rewrite on update |

**Decision**: Use subcollections for characters, backgrounds, scenes, clips (frequently updated independently). Use nested objects for background images (8 angles always loaded together).

---

## Migration Phases

1. **Phase 1**: Add Firebase Auth - Gate Mithril behind login
2. **Phase 2**: Migrate metadata to Firestore - Remove sessionStorage hack
3. **Phase 3**: Migrate images to Firebase Storage - Remove IndexedDB
4. **Phase 4**: Remove S3 session endpoints - Delete `/api/mithril_session/*`
5. **Phase 5**: Add real-time sync (optional) - Multiple devices

---

## Benefits After Migration

| Aspect | Before | After (Firebase) |
|--------|--------|------------------|
| Cross-device | No | Real-time sync |
| Auth | No | Firebase Auth |
| Reload hack | sessionStorage | Not needed |
| Offline | IndexedDB | Firestore offline persistence |
| Manual save | S3 buttons | Auto-save |
| Collaboration | No | Possible with listeners |
