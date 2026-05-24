# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

## Stack

- **Next.js 16.2.6** — App Router. AGENTS.md warning applies: read `node_modules/next/dist/docs/` before writing any Next.js-specific code.
- **React 19.2.4**, **TypeScript 5**, **Tailwind CSS 4**
- **Supabase** via `@supabase/ssr` 0.10.3 — server client uses publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), not service role key
- **Radix UI** — Dialog, DropdownMenu, Tabs, etc. already installed; use these over custom implementations
- **lucide-react** for icons
- **Resend** — transactional email (interview invites)
- **ElevenLabs** — TTS for Carl's voice in interviews (`/api/tts`)
- **Anthropic API** — Claude Haiku for resume scoring, interview question generation, Carl responses, and post-interview analysis

## Architecture

### Route structure
- `/` — landing page
- `/signin` — auth (Supabase magic link / OTP)
- `/dashboard/*` — recruiter UI (protected; redirects candidates to `/portal`)
  - `/dashboard/jobs` — job management
  - `/dashboard/upload` — resume bulk upload + AI scoring
  - `/dashboard/pipeline` — Kanban/list candidate pipeline per job
  - `/dashboard/candidates/[id]` — candidate profile (resume-based AI data)
  - `/dashboard/candidates/[id]/report` — Intelligence Report (interview-based AI data)
  - `/dashboard/carl-config` — Carl interview configuration per job
  - `/dashboard/collaboration/[jobId]` — team collaboration per job
  - `/dashboard/analytics` — hiring metrics dashboard
  - `/dashboard/audit` — AI transparency & audit log
- `/portal` — candidate home (application status, progress, documents, profile)
- `/portal/interview` — live interview room with Carl

### API routes
- `/api/score-resume` — POST: scores a resume PDF/DOCX via Claude Haiku; returns score, summary, strengths, weaknesses
- `/api/carl-questions` — POST: generates interview questions from job config via Claude Haiku
- `/api/carl-respond` — POST: generates Carl's acknowledgment after each candidate answer (no follow-up questions)
- `/api/tts` — POST: converts text to speech via ElevenLabs (`eleven_turbo_v2_5`, voice ID from env)
- `/api/transcribe` — POST: transcribes candidate audio via Whisper/OpenAI

### Auth & RLS pattern
Every server component or server action that reads protected data **must** call `await supabase.auth.getUser()` before any DB query to establish the RLS auth context. Skipping it causes queries to return 0 rows with no error.

RLS policies use a `SECURITY DEFINER` function `get_my_role()` to avoid infinite recursion on the `profiles` table:
```sql
SELECT public.get_my_role() -- returns current user's role without triggering RLS on profiles
```

### Data ownership — candidates vs interviews

**Never mix resume data and interview data.**

| Table | AI fields purpose |
|---|---|
| `candidates.ai_score/recommendation/summary/strengths/weaknesses` | Resume upload scoring only — written by `submitUploadBatch` via `/api/score-resume` |
| `interviews.ai_score/recommendation/summary/strengths/weaknesses/skill_breakdown/interview_highlights/risks/analyzed_at` | Post-interview analysis only — written by `generateInterviewAnalysis` in `app/actions/report.ts` |
| `candidates.ai_analyzed_at` | Lightweight flag: interview analysis is done (mirrors `interviews.ai_analyzed_at`) |

When resetting a candidate for testing, only clear `stage` and `ai_analyzed_at` on candidates plus all fields on interviews. **Never clear `candidates.ai_score` and related resume fields** — those come from `resume_uploads` and represent the resume assessment.

The Intelligence Report (`/dashboard/candidates/[id]/report`) reads:
- **Resume Summary tab**: from `resume_uploads` (primary) → `candidates.ai_*` (fallback)
- **Intelligence Report tab**: from `interviews.ai_*`

### Data flow
Server Components fetch data → pass as props to Client Components. After mutations, call `revalidatePath()` in the server action **and** `router.refresh()` in the client. Sync new props with `useEffect(() => { setState(prop); }, [prop])` — `useState(initialValue)` only runs once.

### Dropdown menus in tables
Use `@radix-ui/react-dropdown-menu` with `<DropdownMenu.Portal>` — renders at body level, bypasses `overflow-hidden` clipping on table wrappers.

### Modal placement in tables
Place `<JobFormModal>` as a sibling **outside** `<tr>` (not nested inside), to avoid invalid DOM nesting. Use controlled `open`/`onOpenChange` props.

### Server actions
Live in `app/actions/`. Always call `revalidatePath()` at the end. Return `{ error: string }` on failure, `{ success: true }` on success.

### Interview flow
1. HR configures Carl for the job (`carl_max_questions`, `carl_duration`, `carl_mode`, `carl_personality`, `carl_topics`)
2. HR sends invite → creates `interviews` row with `status = 'pending'`
3. Candidate visits `/portal/interview` → `getCandidateInterview()` fetches interview + job config
4. `startInterview(id, questions)` sets `status = 'started'`, saves generated questions
5. For each question: Carl speaks via TTS → candidate records voice → `submitAnswer()` appends to `interviews.responses`
6. `completeInterview(id)` sets `status = 'completed'` → triggers `generateInterviewAnalysis()` server-side
7. Analysis writes to `interviews.ai_*` fields; sets `candidates.ai_analyzed_at` as done flag

### Portal decision display
Candidate portal (`/portal`) shows a decision banner when `candidates.stage` is `recommended`, `hired`, or `rejected`. Progress tracker step 4 reflects the exact decision with color coding (green for recommended/hired, red for rejected).

## Key files

### Actions
- `app/actions/jobs.ts` — job CRUD
- `app/actions/candidates.ts` — candidate CRUD, invite sending, stage updates
- `app/actions/uploads.ts` — `submitUploadBatch`: creates candidates + `resume_uploads` rows with AI scores
- `app/actions/interviews.ts` — `startInterview`, `submitAnswer`, `completeInterview` (triggers analysis)
- `app/actions/report.ts` — `getCandidateReport` (fetches from both candidates + interviews + resume_uploads), `generateInterviewAnalysis`
- `app/actions/portal.ts` — candidate-facing data: `getPortalData`, `saveDocument`, `updateCandidateProfile`
- `app/actions/analytics.ts` — hiring metrics queries
- `app/actions/collaboration.ts` — team collaboration per job

### Components
- `components/portal/InterviewRoom.tsx` — live interview UI: pre-check → active → complete states, TTS, voice recording
- `components/portal/PortalHome.tsx` — candidate portal home: progress tracker, interview card, decision banner
- `components/dashboard/candidates/IntelligenceReport.tsx` — tabbed report: Resume Summary + Intelligence Report tabs
- `components/dashboard/candidates/CandidateProfile.tsx` — recruiter view of a candidate
- `components/dashboard/pipeline/KanbanView.tsx` — drag-and-drop pipeline board
- `components/dashboard/upload/ResumeUploadClient.tsx` — bulk resume upload + AI scoring UI
- `components/dashboard/jobs/JobsTable.tsx` — job management table
- `components/dashboard/jobs/JobFormModal.tsx` — create/edit job modal

### Lib
- `lib/supabase/server.ts` — server Supabase client factory
- `lib/supabase/client.ts` — browser Supabase client factory
- `app/dashboard/layout.tsx` — auth guard + role-based redirect (candidates → `/portal`)
