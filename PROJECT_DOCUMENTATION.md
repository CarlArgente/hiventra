# Hiventra — Project Documentation

> **Product:** Hiventra — AI Talent Intelligence Platform  
> **Tagline:** Intelligent Hiring, Powered by Carl AI  
> **Domain:** https://www.hiventra.live  
> **Generated:** 2026-05-27

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Infrastructure & Deployment](#2-infrastructure--deployment)
3. [Tech Stack with Versions](#3-tech-stack-with-versions)
4. [Third-Party APIs & Services](#4-third-party-apis--services)
5. [Architecture](#5-architecture)
6. [Database Schema (Supabase)](#6-database-schema-supabase)
7. [Route Structure](#7-route-structure)
8. [AI Pipeline](#8-ai-pipeline)
9. [Auth System](#9-auth-system)
10. [Design System](#10-design-system)
11. [Key Engineering Decisions & Solutions](#11-key-engineering-decisions--solutions)
12. [Environment Variables](#12-environment-variables)

---

## 1. Product Overview

Hiventra is a B2B SaaS AI hiring platform built for HR managers and talent teams. It automates resume screening, conducts AI video/voice interviews via an avatar named **Carl**, analyzes candidates post-interview, and provides a collaborative workspace for hiring teams.

**Primary personas:** HR Managers, Talent Acquisition Leaders, Founders, CHROs  
**Secondary personas:** Hiring Managers, Department Heads  
**Candidate-facing:** Dedicated portal at `/portal` and `/candidate/login`

### Core Features

| Feature | Description |
|---|---|
| Resume Upload & AI Scoring | Bulk PDF/DOCX upload; Claude scores each resume against job requirements |
| Carl AI Interviewer | Configurable AI interviewer with TTS voice, asks generated questions, records candidate voice answers |
| Post-Interview Intelligence Report | Claude analyzes interview transcript; produces score, skill breakdown, highlights, risks |
| Candidate Portal | Candidate-facing progress tracker, interview room, profile, documents |
| Team Collaboration | Per-job comments, approvals, ratings for hiring team |
| Analytics Dashboard | Hiring funnel metrics, score distributions, time-to-hire |
| AI Audit Log | Immutable log of every AI decision with explainability per candidate |
| Kanban Pipeline | Drag-and-drop candidate stage management per job |

---

## 2. Infrastructure & Deployment

| Layer | Service | Notes |
|---|---|---|
| Hosting | **Vercel** | Auto-deploys from `main` branch |
| DNS | **Namecheap** | Points to Vercel |
| Database | **Supabase** (PostgreSQL) | Auth, RLS, Storage, RPCs |
| CDN/Assets | Vercel Edge Network | |
| Domain | `https://www.hiventra.live` | Production |

**Supabase Auth config:**
- Site URL: `https://www.hiventra.live`
- Redirect URLs: `https://www.hiventra.live/auth/callback`, `https://hiventra.live/auth/callback`

**Critical protected account:**  
`556aada9-8fef-4be1-99ca-0fda0fcf826b` — recruiter/admin (`carlargente0156@gmail.com`) — **never delete**

---

## 3. Tech Stack with Versions

### Core Framework

| Package | Version | Role |
|---|---|---|
| `next` | 16.2.6 | Full-stack framework (App Router) |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | DOM renderer |
| `typescript` | ^5 | Type safety |

### Database & Auth

| Package | Version | Role |
|---|---|---|
| `@supabase/supabase-js` | ^2.106.1 | Supabase client SDK |
| `@supabase/ssr` | 0.10.3 | SSR-safe Supabase client (cookie-based auth) |

**Note:** Server client uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not service role key). All protected queries require `await supabase.auth.getUser()` before DB calls to establish RLS context.

### UI & Styling

| Package | Version | Role |
|---|---|---|
| `tailwindcss` | ^4 | Utility CSS (v4 — new config format) |
| `@tailwindcss/postcss` | ^4 | PostCSS integration for Tailwind 4 |
| `class-variance-authority` | ^0.7.1 | Component variant management |
| `clsx` | ^2.1.1 | Conditional class merging |
| `tailwind-merge` | ^3.6.0 | Tailwind class conflict resolution |
| `lucide-react` | ^1.16.0 | Icon library |
| `react-markdown` | ^10.1.0 | Markdown rendering in reports |
| `recharts` | ^3.8.1 | Analytics charts |

### Radix UI Primitives

| Package | Version |
|---|---|
| `@radix-ui/react-accordion` | ^1.2.12 |
| `@radix-ui/react-dialog` | ^1.1.15 |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 |
| `@radix-ui/react-navigation-menu` | ^1.2.14 |
| `@radix-ui/react-slot` | ^1.2.4 |
| `@radix-ui/react-tabs` | ^1.1.13 |

**Pattern:** `<DropdownMenu.Portal>` required in tables — renders at body level to bypass `overflow-hidden` clipping.

### Interaction & Media

| Package | Version | Role |
|---|---|---|
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop for Kanban pipeline |
| `face-api.js` | ^0.22.2 | Face detection (pre-interview check) |
| `simli-client` | ^3.0.1 | Avatar video streaming for Carl |

### Email

| Package | Version | Role |
|---|---|---|
| `mailersend` | ^3.0.0 | Candidate credential emails (trial plan — 250 unique recipients limit) |
| `resend` | ^6.12.3 | Interview invite emails; also used for candidate credential resends |

---

## 4. Third-Party APIs & Services

### Anthropic (Claude AI)

- **API Version:** `2023-06-01`
- **Model used:** `claude-haiku-4-5-20251001`
- **Beta header for PDFs:** `anthropic-beta: pdfs-2024-09-25`
- **Base URL:** `https://api.anthropic.com/v1/messages`
- **Env var:** `ANTHROPIC_API_KEY`

| Use case | Route/Action | Details |
|---|---|---|
| Resume scoring | `POST /api/score-resume` | Reads PDF natively (base64 document block) or DOCX via regex XML extraction; returns score 0–100, strengths, weaknesses, summary, extracted name/email |
| Interview question generation | `POST /api/carl-questions` | Generates 3–15 questions based on job config (title, company, topics, personality, count) |
| Carl's per-answer acknowledgment | `POST /api/carl-respond` | 1–2 sentence response after each candidate answer; post-processing strips any sentences ending in `?` |
| Post-interview analysis | `app/actions/report.ts` → `generateInterviewAnalysis()` | Full transcript analysis: score, recommendation, summary, strengths, weaknesses, skill breakdown (6 dimensions), interview highlights (Q+excerpt+tag), risks; max_tokens: 2000 |
| General Carl chat | `POST /api/carl-chat` | Live conversation mode |

**Resume scoring prompt strategy:** Sends PDF as native `document` block for Claude to read directly. DOCX files are parsed via `<w:t>` tag regex extraction (6000 char limit) and sent as text.

### ElevenLabs (TTS)

- **Model:** `eleven_turbo_v2_5`
- **Voice settings:** `stability: 0.5`, `similarity_boost: 0.75`
- **Timeout:** 10 seconds per request; retries once on 401/429 with 600ms delay
- **Fallback:** Browser Web Speech API when ElevenLabs fails or is unconfigured
- **Env vars:** `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` (default: `JBFqnCBsd6RMkjVDRZzb`)

### OpenAI (Whisper)

- **Model:** `whisper-1`
- **Language:** `en`
- **Timeout:** 30 seconds
- **Accepts:** webm, mp4, wav
- **Env var:** `OPENAI_API_KEY`

### Supabase

- **SDK:** `@supabase/supabase-js` ^2.106.1 + `@supabase/ssr` 0.10.3
- **Auth method:** Magic link / OTP for recruiters; username+password (custom hashed) for candidates
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Resend

- **SDK:** `resend` ^6.12.3
- **From address:** `noreply@hiventra.live`
- **Env var:** `RESEND_API_KEY`
- **Use:** Candidate credential emails (primary), interview invites

### MailerSend

- **SDK:** `mailersend` ^3.0.0
- **Trial limit:** Unique recipients cap (error code `MS42225` — `"You have reached trial account unique recipients limit"`)
- **Resolution:** Upgrade plan or add recipients as verified senders

### Simli

- **SDK:** `simli-client` ^3.0.1
- **Use:** Carl's avatar video stream in the interview room

---

## 5. Architecture

### Pattern: Server Components + Server Actions

```
Server Component (fetch data)
    → passes props to Client Component
    → mutation triggers Server Action
    → Server Action calls revalidatePath()
    → Client calls router.refresh()
    → useEffect([prop]) syncs new props into state
```

**Critical:** `useState(initialValue)` only runs once. New server props must sync via `useEffect(() => { setState(prop) }, [prop])`.

### Supabase RLS Pattern

Every server component/action that reads protected data **must** call `await supabase.auth.getUser()` before any DB query. Skipping it causes queries to return 0 rows with no error (RLS context not established).

```typescript
// Required pattern
const supabase = await createClient();
await supabase.auth.getUser(); // ← establishes RLS context
const { data } = await supabase.from("candidates").select("*");
```

### SECURITY DEFINER RPCs

Used to bypass RLS for cross-context operations (e.g., candidate auth writing analysis):

| RPC | Purpose |
|---|---|
| `get_my_role()` | Returns current user's role without RLS recursion on `profiles` |
| `get_interview_for_analysis(p_candidate_id)` | Fetches interview data regardless of auth context |
| `save_interview_analysis(...)` | Writes analysis results without auth context |
| `get_credentialed_candidate_ids(p_candidate_ids)` | Checks which candidates already have credentials |
| `get_candidate_username(p_candidate_id)` | Candidate username lookup |
| `update_candidate_password_hash(...)` | Password reset |
| `get_candidate_email_for_login(p_username)` | Username → email lookup for candidate login |
| `create_candidate_auth_user(...)` | Creates GoTrue auth.users + auth.identities rows |

### Candidate Auth System

GoTrue requires both `auth.users` and `auth.identities` rows. Critical invariants:
- `email_change`, `email_change_token_new`, `email_change_token_current`, `reauthentication_token` → `''` (empty string, NOT NULL)
- `phone`, `phone_change`, `phone_change_token` → NULL (unique constraint prevents `''` for multiple users)
- `auth.identities`: `provider='email'`, `provider_id=email`, `identity_data={"sub": user_id, "email": email}`

**Password hashing:** Node.js `crypto.scryptSync` with params `N=16384, r=8, p=1, dkLen=64`. Stored as `salt:hash` hex strings. Timing-safe comparison via `timingSafeEqual`.

---

## 6. Database Schema (Supabase)

### Core Tables

| Table | Purpose |
|---|---|
| `profiles` | Recruiter/team profiles linked to `auth.users`; role: `admin`, `hr_manager`, `hiring_manager`, `interviewer`, `dept_head`, `candidate` |
| `jobs` | Job postings with Carl config (`carl_max_questions`, `carl_duration`, `carl_mode`, `carl_personality`, `carl_topics`, `min_resume_score`) |
| `candidates` | Candidate records linked to jobs; holds resume AI scores (from upload) and `ai_analyzed_at` flag (from interview) |
| `resume_uploads` | Resume files + AI scores per upload batch — primary source for Resume Summary tab |
| `interviews` | Interview sessions; holds all post-interview AI analysis fields |
| `candidate_credentials` | Username, hashed password, `must_change_password`, `can_logged_in` |

### AI Data Separation

**Never mix resume data and interview data.**

| Table.Field | Written by | Purpose |
|---|---|---|
| `candidates.ai_score/recommendation/summary/strengths/weaknesses` | `submitUploadBatch` via `/api/score-resume` | Resume assessment |
| `candidates.ai_analyzed_at` | `save_interview_analysis` RPC | Flag: interview analysis done |
| `interviews.ai_score/recommendation/summary/strengths/weaknesses/skill_breakdown/interview_highlights/risks/analyzed_at` | `generateInterviewAnalysis` | Post-interview assessment |
| `resume_uploads.ai_*` | `submitUploadBatch` | Per-upload resume scores (primary source) |

### Collaboration Tables

| Table | Purpose |
|---|---|
| `collaboration_comments` | Per-job, per-candidate threaded comments with privacy flag |
| `collaboration_approvals` | Stage approval records with rating, recommendation, timestamp |

### Audit Tables

| Table | Purpose |
|---|---|
| `ai_audit_log` | Immutable log of every AI decision (resume scored, interview analyzed, stage changed) |
| `fairness_anomaly_alerts` | Detected scoring anomalies with severity and review status |

---

## 7. Route Structure

### Dashboard (Recruiter, protected)

| Route | Page |
|---|---|
| `/dashboard` | Dashboard home |
| `/dashboard/jobs` | Job management table |
| `/dashboard/jobs/new` | Create job |
| `/dashboard/upload` | Bulk resume upload + AI scoring |
| `/dashboard/pipeline` | Kanban/list candidate pipeline |
| `/dashboard/candidates/[id]` | Candidate profile (resume data) |
| `/dashboard/candidates/[id]/report` | Intelligence Report (interview + resume tabs) |
| `/dashboard/carl-config` | Carl configuration per job |
| `/dashboard/collaboration` | Job selector for collaboration |
| `/dashboard/collaboration/[jobId]` | Team collaboration view |
| `/dashboard/analytics` | Hiring metrics dashboard |
| `/dashboard/audit` | AI transparency & audit log |
| `/dashboard/settings` | User settings |
| `/dashboard/talk-with-carl` | Live Carl conversation |

### Portal (Candidate-facing)

| Route | Page |
|---|---|
| `/portal` | Home: progress tracker, interview card, decision banner |
| `/portal/interview` | Live interview room (Carl TTS + voice recording) |
| `/portal/profile` | Candidate profile editor |
| `/candidate/login` | Username/password login |

### Public

| Route | Page |
|---|---|
| `/` | Landing page |
| `/signin` | Recruiter auth (Supabase magic link / OTP) |
| `/auth/callback` | Supabase auth callback |

### API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/score-resume` | POST | Resume scoring via Claude Haiku |
| `/api/carl-questions` | POST | Interview question generation |
| `/api/carl-respond` | POST | Per-answer acknowledgment generation |
| `/api/carl-chat` | POST | Live Carl conversation |
| `/api/tts` | POST | ElevenLabs TTS with browser fallback |
| `/api/transcribe` | POST | Whisper voice transcription |
| `/api/generate-analysis` | POST | Trigger post-interview analysis |

---

## 8. AI Pipeline

### 1. Resume Scoring Pipeline

```
HR uploads PDFs/DOCXs
  → /api/score-resume (Claude Haiku)
     → PDF: native document block (base64)
     → DOCX: regex <w:t> XML extraction → text
  → Returns: score, strengths, weaknesses, summary, name, email
  → submitUploadBatch creates candidates + resume_uploads rows
  → writeAuditEntry("resume_scored")
```

### 2. Interview Pipeline

```
HR configures Carl (topics, personality, question count, duration)
HR sends invite → interviews row created (status: pending)

Candidate visits /portal/interview
  → getCandidateInterview() fetches config
  → /api/carl-questions generates question set (Claude Haiku)
  → startInterview() sets status: started, saves questions

Per question loop:
  → Carl speaks via /api/tts (ElevenLabs → browser fallback)
  → Candidate records audio
  → /api/transcribe (Whisper) → transcript
  → submitAnswer() appends to interviews.responses
  → /api/carl-respond generates acknowledgment (Claude Haiku)

completeInterview() sets status: completed
  → triggers generateInterviewAnalysis() server-side
  → Claude Haiku analyzes full transcript
  → save_interview_analysis RPC writes to interviews.ai_*
  → candidates.ai_analyzed_at = now
  → writeAuditEntry("interview_analyzed")
```

### 3. Intelligence Report

**Resume Summary tab:** reads `resume_uploads` (primary) → `candidates.ai_*` (fallback)  
**Intelligence Report tab:** reads `interviews.ai_*`

---

## 9. Auth System

### Recruiter Auth

- Supabase magic link / email OTP
- Protected by `app/(dashboard)/layout.tsx` — auth guard + role check
- Candidates authenticated as recruiter are redirected to `/portal`

### Candidate Auth

- Custom username/password system layered on Supabase GoTrue
- Credentials stored in `candidate_credentials` (no passwords — only scrypt hash)
- Login: `/candidate/login` — username → email via `get_candidate_email_for_login()` RPC → Supabase `signInWithPassword()`
- `must_change_password` flag forces password change on first login

### Role Values

Valid `profiles.role`: `admin`, `hr_manager`, `hiring_manager`, `interviewer`, `dept_head`, `candidate`  
**Never use `'hr'`** — `profiles_role_check` constraint rejects it.

---

## 10. Design System

**Style:** Corporate Trust — modern enterprise SaaS aesthetic

### Tokens

| Token | Value |
|---|---|
| Background | `#F8FAFC` (Slate 50) |
| Surface | `#FFFFFF` |
| Primary | `#4F46E5` (Indigo 600) |
| Secondary | `#7C3AED` (Violet 600) |
| Text Main | `#0F172A` (Slate 900) |
| Text Muted | `#64748B` (Slate 500) |
| Success | `#10B981` (Emerald 500) |
| Border | `#E2E8F0` (Slate 200) |

### Typography

- **Font:** Plus Jakarta Sans (geometric sans-serif)
- **Scale:** Major Third (1.250)
- **Heading weight:** ExtraBold 800 / Bold 700
- **Body:** Regular 400

### Visual Signatures

- Colored shadows (indigo-tinted, not neutral gray)
- Gradient text: `bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600`
- Atmospheric blur orbs (absolute positioned, `blur-3xl`, 20–50% opacity)
- Isometric 3D card transforms (`perspective-[2000px]`, `rotate-x-[5deg] rotate-y-[-12deg]`)
- Hover lift: `hover:-translate-y-1 transition-all duration-200`
- Primary gradient: `from-indigo-600 to-violet-600`

---

## 11. Key Engineering Decisions & Solutions

### RLS + Auth Context
**Problem:** Queries returning 0 rows silently when auth context not established.  
**Solution:** Mandatory `await supabase.auth.getUser()` before every DB query in server context.

### Candidate Interview Analysis Auth Gap
**Problem:** Interview completes in candidate auth context; analysis needs recruiter-level DB write.  
**Solution:** `SECURITY DEFINER` RPCs (`get_interview_for_analysis`, `save_interview_analysis`) bypass RLS entirely.

### GoTrue Candidate Accounts
**Problem:** Creating Supabase auth users programmatically — NULL vs empty string causes GoTrue panic.  
**Solution:** `create_candidate_auth_user` SECURITY DEFINER function handles both `auth.users` and `auth.identities`. String fields must be `''` not NULL; phone fields must be NULL not `''`.

### ElevenLabs Reliability
**Problem:** Transient 401/429 failures on concurrent requests; TTS timeout.  
**Solution:** 10s AbortController timeout; single retry after 600ms on 401/429; browser Web Speech API fallback on all failures.

### DOCX Text Extraction
**Problem:** No server-side DOCX parser available in edge/Node environment.  
**Solution:** Regex extraction of `<w:t>` XML text runs from raw DOCX bytes (DOCX is ZIP + XML). Capped at 6000 chars.

### Carl Response Quality
**Problem:** Claude occasionally generates questions in acknowledgment responses despite instructions.  
**Solution:** Post-processing filter splits on sentence boundaries and removes any sentence ending with `?`.

### Dropdown Menus in Tables
**Problem:** `overflow-hidden` on table wrappers clips dropdown menus.  
**Solution:** `@radix-ui/react-dropdown-menu` with `<DropdownMenu.Portal>` — renders at body level.

### Modal Placement in Tables
**Problem:** `<tr>` nesting modals causes invalid DOM.  
**Solution:** Place modals as siblings outside `<tr>`, use controlled `open`/`onOpenChange` props.

### Data Ownership Separation
**Rule:** Resume AI data (`candidates.ai_*`) and interview AI data (`interviews.ai_*`) are written by separate pipelines and must never be mixed or overwritten by the wrong process. Resetting a candidate for testing: clear `stage` + `ai_analyzed_at` on candidates + all fields on interviews — never clear `candidates.ai_score`.

---

## 12. Environment Variables

| Variable | Service | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase | Yes |
| `ANTHROPIC_API_KEY` | Anthropic Claude | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS | Yes (falls back to browser) |
| `ELEVENLABS_VOICE_ID` | ElevenLabs | No (default: `JBFqnCBsd6RMkjVDRZzb`) |
| `OPENAI_API_KEY` | OpenAI Whisper | Yes |
| `RESEND_API_KEY` | Resend email | Yes |
| `NEXT_PUBLIC_APP_URL` | App | Yes — `https://www.hiventra.live` |
| `NEXT_PUBLIC_SITE_URL` | App | Yes — `https://www.hiventra.live` |

---

## 13. Claude Session History

Chronological summary of all prompts used to build this application across Claude Code sessions.

---

### Phase 1 — Project Bootstrap & Auth Setup

- "Using Supabase MCP, can you list the database that you can access?"
- "Create a sign-in page. We don't need username and password — only Continue with Google. Pause the resume-reviewer so we can create a new database and auth. Also check the landing page buttons (Login, Start free trial, See Carl)."
- "Provide a step by step on how to setup."
- "Now lets start creating the pages for after sign in." *(provided full Page Index from features.md: HR Dashboard, Job Management, Resume Upload, Candidate Pipeline, Candidate Profile, Carl Config, Interview Room, Intelligence Report, Team Collaboration, Analytics, Audit, Settings, Candidate Portal)*

---

### Phase 2 — Job Management Page

- "Lets modify now the Job Management page." *(spec: search, filter tabs All/Active/Draft/Closed/Archived, CRUD actions)*
- "Step 1: Start on DB layer first. Use Supabase MCP. Step 2: Build UI layer. Step 3: Wire DB + UI. Step 4: Build and verify."
- "When I clicked the Create New Job button, it is not working — use Radix UI dialog popup for CRUD."
- "There is an error on publishing job."
- "Please empty the values of jobs, let me create from scratch."
- "I successfully added a job but it didn't refresh the table. Make sure to always refresh the table for CRUD changes."
- "The table is weird when I clicked the action."
- "In edit mode, some data are not populated properly."
- "When I clicked the job title in the table, there is an error."
- "Initialize Claude. Please analyze this codebase and create a CLAUDE.md file."

---

### Phase 3 — Resume Upload Page

- "Lets modify now the Resume Upload page." *(spec: bulk PDF upload, AI scoring, drop zone, status badges, progress animation)*
- "Can we do full width?"
- "It is looping — use Claude API to score the resume and give feedback. I will provide Claude API key."
- *(Shared `.env.local`)* "JSON.parse error at `score-resume.ts:59`." → fix JSON parse of Claude response
- "Still has error."
- "Please evaluate properly the resume — they are all the same scores. Scan the PDF for each candidate and score it."
- "Please fix — score is 2 but it is not considered as failed. The passing rate is 75."
- "Change the layout: 1st column = Upload Resumes + job description dropdown. 2nd column = stats cards (Parsed Successfully, Failed, Avg Match Score, AI Scoring Results) + upload section."
- "Please fix layout — descriptions not wrapping, horizontal scrollbar. Make 1st column wider."
- "Cards not aligned at top. Adjust job description height. Add drawer button beside Details to preview the resume."
- "There must be a Details button also for failed files. Rename 'Failed Files' to 'Failed Resumes'."
- "When I click Upload More Resumes, the uploader appeared but other content disappeared. Also previous candidates not listed."
- "We need summary even for failed candidates."
- "Please clear the bucket."
- "Remove the highlighted label."

---

### Phase 4 — Candidate Pipeline Page

- "It is good now. Now lets create the Candidate Pipeline page." *(spec: job context bar, Kanban view with drag-and-drop, candidate cards with AI score, stage columns)*
- "The email is showing as placeholder (`parsed_xxx@placeholder.com`) — you can access the PDF so get their real email."
- "I can still see the placeholder email."
- "In Candidate Pipeline, I need to hold the 6 dots before I move to another column. Make the card itself draggable but keep View Profile clickable."
- "I can't drop and hold."
- "There is a horizontal scrollbar appearing — please fix that."
- "Still appearing."
- "In Candidate Pipeline profile, add a way to edit all data of the candidate (name, email, etc.)."

---

### Phase 5 — Carl Interview Config Page

- "Let's create Carl Interview Config page." *(spec: job selector, interview mode Voice/Text/Video, personality, topics, max questions, duration, preview panel)*
- "Please display active jobs only."

---

### Phase 6 — Candidate Profile Page

- "Let's create Candidate Profile page." *(spec: candidate header, resume summary, AI match score breakdown, interview status, actions)*

---

### Phase 7 — Interview Room Page (Candidate-Facing)

- "Let's create Interview Room Page." *(spec: preCheck → active → complete state machine, pre-interview check, Carl TTS, voice recording with MediaRecorder, question cycling, timer)*
- "Let's modify the 'Send Interview Invite' button — use Resend to send emails. Also the page `/portal/interview` is showing an error."
- "You removed other data in `.env.local`."
- "I didn't receive an email — but it shows in terminal that `sendInterviewInvite` ran in 2100ms."
- "Fix the alignment in email — the C circle is off, the number inside circle is off."
- "I want Carl to talk like a person in voice interview mode. I can provide ElevenLabs API for voice."
- "Help me create a voice for Carl in ElevenLabs (male)."
- "It didn't speak."
- "I've already started an interview but the status in Candidate Pipeline didn't update — still 'Invited', must be 'Interview Started'. Also candidate finished but status didn't update to 'Completed'."

---

### Phase 8 — Intelligence Report Page

- "Let's create the Candidate Intelligence Report page." *(spec: report header, score gauge, skill bars, strengths/weaknesses, interview highlights, recommendation)*
- "Their breadcrumbs UI is different. Also where is shortlist?"
- "It is confusing — instead of 'Add to Shortlist', change it to something like 'Recommend this'."

---

### Phase 9 — Voice Interview Flow Debugging (extended)

- "Please fix — transform first to text in the background so we can analyze it."
- "After the AI talks, I don't want the user to click the Record button — I want it auto-triggered after AI finishes speaking."
- "After I talk, it didn't detect."
- "After the AI talks, it didn't give me time to talk."
- "After I clicked Stop, it didn't automatically submit the answer." *(repeated multiple sessions)*
- "It is loading and nothing else."
- "Still the same — it didn't start to talk now."
- "We need to transcribe no matter what — we need responses to record them and use in Claude API report."
- "I asked a question in the middle but the AI still moved to the next question. Fix that — make sure to transcribe properly."
- "Upon refreshing the page, the AI didn't talk again."
- "When I clicked stop, it didn't record or transcribe. It keeps showing 'No transcription detected. Please re-record your answer.'"
- "How about we use Web Speech API to transcribe the answer?" *(Request interrupted twice)*
- "Still the same — we just need Web Speech API for speech-to-text."
- "Can we add notification that the user needs to change the browser?"
- "The AI has a follow-up question but still proceeds to the next question. Fix that. Also in the closing, it didn't say thank you."
- "Please reset the interview of James Argente."
- "Can we do it so it does NOT ask follow-up questions — only initial interview — but it can give acknowledgements like 'Great, that... now let's proceed to the next question'."
- "It is still asking follow-up questions, not acknowledging before proceeding."
- "After the interview, it must start to assess. Currently it is assessing through Intelligence Report which is not correct — it must assess directly in `/portal/interview` after interview is completed. Also add a note not to close the window."
- "This is the first question — please add some opening welcome before proceeding."
- "I can't see any welcome or opening message before the first question."
- "In Intelligence Report, it is still assessing the interview which is not correct — it should assess AFTER the interview."

---

### Phase 10 — Interview Data Separation

- "In Intelligence Report, it must NOT generate/analyze in that page. The `/portal/interview` page should store the overall assessment after interview is complete, then display it in Intelligence Report."
- "It is good now — it is assessing after the interview. But another issue: it affects the resume assessment in candidate profile which must NOT happen. Create a new database/table to handle interview data for candidates. Currently you are overriding all the resume fields."
- "Something is off — when I resume interview or continue to the next step, the AI is not speaking; it directly records."

---

### Phase 11 — Intelligence Report Tabs

- "In Intelligence Report, add tabs: Tab 1 = Resume Upload summary, Tab 2 = Intelligence Report itself."
- "Currently it is just a placeholder — there is no data — but when I go to Resume Upload there is data for this candidate."

---

### Phase 12 — Candidate Portal Decision Display

- "The candidate has a decision now — Recommended, Hired, or Rejected. In the Candidate Portal, if there is a decision, please display it. Also update the Decision status in the portal."

---

### Phase 13 — CLAUDE.md & README Update

- "Update the CLAUDE.md. Also update the README.md."

---

### Phase 14 — Team Collaboration Page

- "Let's create the Team Collaboration page." *(spec: job header, candidate comparison table, side-by-side scores, comments, approval workflow)*
- "Check error."
- "Please check all the values from Analytics — make sure they are accurate in DB. I don't want placeholder values. I want dynamic data."

---

### Phase 15 — Analytics Dashboard

- "Let's create the Analytics Dashboard page." *(spec: date filter, funnel chart, hiring velocity, AI performance, skill gaps — all from Supabase)*
- "Check error."

---

### Phase 16 — AI Transparency & Audit Page

- "Let's create AI Transparency & Audit Page." *(spec: audit log table, AI decisions with timestamps, score distribution, anomaly alerts, override tracking, explainability search)*

---

### Phase 17 — Settings & Admin Page

- "Let's create Settings & Admin Page." *(spec: tabbed settings — Organization, Users & Roles, Carl Defaults, Integrations, Notifications)*
- "In Settings page, remove Organization and Notifications tabs."

---

### Phase 18 — Topbar & Navigation

- "Remove the search area. When I click the badge, add a way to sign out."
- "Display profile picture of logged-in user instead of 'CA' initials."

---

### Phase 19 — Avatar AI Research & Simli Integration

- "I use ElevenLabs for voice. Can you recommend something for video (avatar AI for Carl)? Want free or trial."
- "I am trying HeyGen — can you provide a script for testing?"
- "Does Simli have a default voice, or is it just an avatar with no sound?"
- "In the interview client, the voice is already good. Don't change anything there. Now add another component for video — same concept as voice but with an avatar. We can use Simli."
- "Just proceed with implementation — I will add values in `.env` file after you finish."
- "It didn't speak and lip-sync on the question."
- "The avatar didn't appear."
- "There is an issue with transcribing — it is resetting the transcribe. Don't reset it."

---

### Phase 20 — Icon & Branding Updates

- "Before testing, change the C icon — use `carl_avatar.png`."
- "I uploaded a new icon for the app in the public folder: `hiventra_icon.png` — use this everywhere (preload, landing page, navigation, etc.)."
- "In Candidate Portal, remove these cards: Interview Window, Documents, Upload Supporting Documents, Your Profile."

---

### Phase 21 — Landing Page Hero Updates

- "In hero section, change the floating image on the right. I uploaded `hiventra_hero.png` — use that. Also add a bounce effect."
- "There is a background/rectangle behind the image — remove that."
- "There is still like a shadow."
- "Can we add floating status badges around the image? '✓ AI Report Ready · Maria Santos' and '✓ 3 interviews live right now'."
- "Please align properly."
- "'AI Report Ready · Maria Santos' has no bouncing effect like '3 interviews live right now'."
- "Still the same."
- "I attached new image `hiventra_hero_new.png` — use that instead."

---

### Phase 22 — Dashboard Home Page

- "Let's update the dashboard page — currently it is placeholder." *(spec: welcome header, KPI cards, active jobs, pipeline health, recent activity)*
- "Replace this item to Analytics page."

---

### Phase 23 — Carl Config Verification

- "May I know if you are reading the Carl config / considering it in the candidate interview at `/portal/interview`?"

---

### Phase 24 — Talk With Carl Page

- "Add new page 'Talk with Carl'. This page is for chatting with Carl AI. Use Claude API and make sure all AI answers are based on data from Supabase. Steps: 1) proceed no approval needed, 2) DB layer via Supabase MCP, 3) build UI."
- "I clicked New Chat and there is an error."
- "Please fix — there are a lot of `**` in output. Also it said Carl accesses real data but in chat it says 'I don't have access to candidate details'."

---

### Phase 25 — Navigation & URL Fixes

- "Move this to the top."
- "Fix the URL of every page — currently Job Management is `/dashboard/jobs` and Resume Upload is `/dashboard/upload`. There is `/dashboard` in the path which looks incorrect. Fix all pages' URLs."

---

### Phase 26 — Responsive Layout Fixes

- "Fix this card in Upload Resume page."
- "AI Scoring Results is overlaying in their container."
- "In Carl Config page, make this full width."
- "In Settings, Users & Roles — fix the table, it must be responsive."
- "In Job Management, fix layout in mobile view of All, Active, Draft, Closed, and Archived tabs."

---

### Phase 27 — Candidate Account System (Create & Send Credentials)

- "I attached an image showing a new button in Resume Upload page. This button is for one-tap creation of accounts and sending emails. Add or create a new table for (username, password, can_logged_in)."
- "404 — the URL must be something like `/candidate/login`."
- "The username and password I entered is same as in email but it says 'invalid username and password'."
- "There is an issue."
- "In Candidate Portal: if the user clicks the Badge/'CA' in nav, go to their profile showing full name, email, username. Also allow password change."
- "Add sign-out dropdown when clicking CA badge."
- "Add confirmation message when user clicks 'Create Accounts & Send Emails' — 'It will create an account and send email to candidates who passed'."
- "In account creation, don't create account for candidates who already have one. Check first."
- "In the `/candidate` page, modify resend invite — it must resend invite with their credentials. Also fix the icon in the email."
- "Change the label of button to 'Create Accounts & Send Invites'."

---

### Phase 28 — Upload Page: View Candidates Modal

- "In Resume Upload page, currently there is no View Candidates page. When user clicks View Candidates, show a modal/popup with list of candidates and a 'Go to Profile' link."
- "In Create Account and Send Email — add a label that it will change the status to Invited. Change the status to Invited for the user who sends an email."
- "Please reset all the status of candidates."
- "Delete the candidates including all their data."
- "There are still failed candidates."
- "Change layout — use tabs for Pass and Failed."
- "Remove View Candidates button. Move View Profile beside Details. Change Details label to 'Summary'."

---

### Phase 29 — Video Interview Avatar Debugging

- "In the interview page, this is video interview mode but the greeting before Question #1 is not video."
- "Reset the interview of carl.emerson1755."
- "The welcoming video before Question #1 is not synced — it starts speaking even if the avatar is still loading. Fix and reset again."
- "Fix the avatar layout — it is cut off before proceeding to Question #1 and still cut off during ongoing questions."

---

### Phase 30 — Face Detection in Pre-Interview Check

- "In device check, in camera — is there a way to validate or check if the camera has a person in frame?"
- "Go with option 1."
- "Please add detection — if no person visible in frame, disable the 'Start Interview with Carl' button."
- "I am in frame now but the button is still disabled."
- "I don't know if it is working."

---

### Phase 31 — Recent Sessions (Last 4 days)

- "Verify resume upload scorer AI basis." *(confirmed Claude reads PDF natively and scores based on actual resume content)*
- "Remove email from users and roles." *(Settings page Users & Roles cleanup)*
- "Replace hero section image on landing page."
- "After I clicked Stop, it didn't automatically submit the answer." *(voice interview auto-submit fix)*
- "Run development server."
- "List accessible databases with Supabase." *(initial project start)*
- "Scan the app and Claude history prompts. Document the instructions used, solutions made, infrastructure of the code, API/third party software used with versioning." *(this session)*
