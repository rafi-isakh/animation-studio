# Frontend Integration Guide

This document explains how to integrate the Next.js frontend with the mithril-backend job orchestrator.

## Overview

The orchestrator provides server-side job queue management with:
- Automatic retry logic with exponential backoff
- Real-time status updates via Firestore
- Job cancellation support
- Dead letter queue for failed jobs

## Required Environment Variables

### Next.js Frontend (.env.local or .env.development)

```bash
# Backend URL (local development)
MITHRIL_BACKEND_URL=http://localhost:8000

# Internal service secret (must match backend)
# Generate with: openssl rand -hex 32
INTERNAL_SERVICE_SECRET=your-shared-secret-here

# Feature flag to enable orchestrator mode (optional, defaults to false)
NEXT_PUBLIC_USE_VIDEO_ORCHESTRATOR=true
```

### Mithril Backend (.env)

```bash
# Must match frontend INTERNAL_SERVICE_SECRET
INTERNAL_SERVICE_SECRET=your-shared-secret-here
```

## API Endpoints

The frontend proxy endpoints forward requests to the backend:

| Frontend Endpoint | Backend Endpoint | Method | Purpose |
|-------------------|------------------|--------|---------|
| `/api/video/orchestrator/submit` | `/api/v1/jobs/submit` | POST | Submit single job |
| `/api/video/orchestrator/submit-batch` | `/api/v1/jobs/submit-batch` | POST | Submit multiple jobs |
| `/api/video/orchestrator/status` | `/api/v1/jobs/{jobId}/status` | GET | Get job status |
| `/api/video/orchestrator/cancel` | `/api/v1/jobs/{jobId}/cancel` | POST | Cancel job |

## Feature Flag

The `NEXT_PUBLIC_USE_VIDEO_ORCHESTRATOR` environment variable controls which video generation mode is used:

- `false` (default): Legacy mode with frontend polling
- `true`: Orchestrator mode with real-time Firestore updates

## How It Works

### Legacy Mode (Polling)

1. Frontend calls `/api/video/submit` directly
2. Frontend polls `/api/video/status` every 5-10 seconds
3. Frontend updates UI when status changes to completed/failed

### Orchestrator Mode (Real-time)

1. Frontend calls `/api/video/orchestrator/submit`
2. Backend creates job in Firestore `job_queue` collection
3. Worker processes job asynchronously
4. Frontend subscribes to Firestore `job_queue/{jobId}` for real-time updates
5. UI updates automatically via Firestore onSnapshot listener

## Files Created/Modified

### Backend
- `app/api/deps.py` - Added internal service auth support
- `app/config.py` - Added `INTERNAL_SERVICE_SECRET` setting

### Frontend
- `src/app/api/video/orchestrator/submit/route.ts` - Submit proxy
- `src/app/api/video/orchestrator/submit-batch/route.ts` - Batch submit proxy
- `src/app/api/video/orchestrator/status/route.ts` - Status proxy
- `src/app/api/video/orchestrator/cancel/route.ts` - Cancel proxy
- `src/components/Mithril/services/firestore/jobQueue.ts` - Real-time listeners
- `src/components/Mithril/VideoGenerator/useVideoOrchestrator.ts` - React hook
- `src/components/Mithril/VideoGenerator/VideoGeneratorOrchestrator.tsx` - Orchestrator component
- `src/components/Mithril/VideoGenerator/VideoGeneratorWrapper.tsx` - Feature flag wrapper
- `src/components/Mithril/Mithril.tsx` - Updated to use wrapper

## Testing

1. Start the backend:
   ```bash
   cd mithril-backend
   docker-compose up -d
   ```

2. Add environment variables to frontend .env.local:
   ```bash
   MITHRIL_BACKEND_URL=http://localhost:8000
   INTERNAL_SERVICE_SECRET=your-secret
   NEXT_PUBLIC_USE_VIDEO_ORCHESTRATOR=true
   ```

3. Start the frontend:
   ```bash
   npm run dev
   ```

4. Navigate to VideoGenerator stage and submit a job

## Migration Strategy

1. **Phase 1 (Parallel)**: Deploy with `NEXT_PUBLIC_USE_VIDEO_ORCHESTRATOR=false`
2. **Phase 2 (Shadow)**: Enable for 10% of traffic using feature flags
3. **Phase 3 (Rollout)**: Gradually increase to 100%
4. **Phase 4 (Deprecate)**: Remove legacy code after stable period