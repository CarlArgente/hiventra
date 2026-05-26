# Hiventra — AI Talent Intelligence Platform

> Intelligent Hiring, Powered by Carl AI

Hiventra is a full-stack AI-powered hiring platform. Recruiters upload resumes, configure an AI interviewer named Carl, invite candidates, and receive structured intelligence reports — all without manual screening.

---

## Features

### Recruiter (Dashboard)
- **Job Management** — create and manage job postings with Carl interview config (mode, personality, duration, topics)
- **Resume Upload** — bulk upload PDFs/DOCXs; Claude Haiku scores each resume instantly and creates candidate profiles
- **Candidate Pipeline** — Kanban and list views; drag candidates across stages; filter by score and recommendation
- **Candidate Profile** — resume AI breakdown, interview status, team notes, invite sending
- **Intelligence Report** — two-tab post-interview report: Resume Summary (upload AI data) + Interview Analysis (Carl's assessment with score, skill breakdown, highlights, risks)
- **Team Collaboration** — per-job hiring team workspace: candidate comparison, approval workflow, comment threads
- **Analytics** — pipeline funnel, time-to-hire trends, interview completion rates, skill gap analysis
- **AI Audit** — immutable log of all AI decisions with override tracking and fairness monitoring

### Candidate (Portal)
- **Portal Home** — application progress tracker (Applied → Resume Reviewed → Interview → Decision), interview card, document uploads, profile editing
- **Decision Banner** — when recruiter marks recommended/hired/rejected, the portal shows a contextual banner with the outcome
- **Interview Room** — live AI interview with Carl: voice recording, TTS question delivery, real-time acknowledgments between answers
- **Post-Interview** — completion screen; analysis runs server-side after interview ends
- **Candidate Login** — username + password login at `/candidate/login` (separate from recruiter Google/OTP auth); credentials emailed via MailerSend when accounts are created

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database & Auth | Supabase (PostgreSQL + RLS + Auth) |
| UI Primitives | Radix UI |
| Icons | lucide-react |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| TTS | ElevenLabs (`eleven_turbo_v2_5`) |
| Email (candidates) | MailerSend (credential emails) |
| Email (recruiters) | Resend (interview invites) |
| Storage | Supabase Storage (resumes, candidate documents) |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# ElevenLabs (TTS for Carl's voice)
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=your-voice-id

# MailerSend (candidate credential emails)
MAILERSEND_API_KEY=mlsn....

# Resend (interview invite emails)
RESEND_API_KEY=re_...

# App URL (used in email links — set to production URL in Vercel env vars)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Recruiters sign in and land on `/dashboard`
- Candidates sign in and land on `/portal`

---

## Project Structure

```
app/
  actions/          # Server actions (jobs, candidates, interviews, report, portal, uploads,
  |                 #   candidate-accounts, candidate-signin)
  api/              # API routes (score-resume, carl-questions, carl-respond, tts, transcribe)
  candidate/        # Candidate auth pages (login)
  dashboard/        # Recruiter pages
  portal/           # Candidate-facing pages
  globals.css

components/
  dashboard/        # Recruiter UI components (pipeline, candidates, jobs, upload, analytics)
  portal/           # Candidate UI components (InterviewRoom, PortalHome)

lib/
  supabase/         # server.ts + client.ts factory functions
```

---

## Key Workflows

### Resume Upload → Candidate Created
1. HR selects a job, uploads PDF/DOCX resumes
2. `/api/score-resume` sends each resume to Claude Haiku → returns score, summary, strengths, weaknesses
3. `submitUploadBatch` creates a `candidates` row (with `ai_score`, `ai_summary`, etc.) and a `resume_uploads` row per file
4. Candidates appear in the pipeline at `uploaded` stage

### Create Candidate Accounts
1. HR clicks "Create Accounts & Send Invites" on the upload/pipeline page
2. `createCandidateAccounts(jobId)` finds all scored candidates without credentials
3. Generates username (e.g. `john.doe1234`) and random password per candidate
4. Creates Supabase Auth user via `create_candidate_auth_user` SECURITY DEFINER function
5. Stores username in `candidate_credentials`; sends credentials email via MailerSend
6. Advances candidate stage to `invited`
7. Candidate logs in at `/candidate/login` with username + password

### Interview Invite → Analysis
1. HR sends invite from candidate profile → `interviews` row created (`status = pending`)
2. Candidate visits `/portal/interview` → Carl generates questions via `/api/carl-questions`
3. Carl speaks each question via ElevenLabs TTS; candidate records voice
4. Each answer saved to `interviews.responses` via `submitAnswer`
5. On completion, `completeInterview` triggers `generateInterviewAnalysis` server-side
6. Analysis written to `interviews.ai_*` fields; never overwrites resume data on `candidates`

### Intelligence Report
- **Resume Summary tab** reads from `resume_uploads` (primary source) → `candidates.ai_*` (fallback)
- **Intelligence Report tab** reads from `interviews.ai_*`
- No re-analysis on page load — purely a DB viewer

---

## Data Ownership

| Table | What lives there |
|---|---|
| `candidates.ai_*` | Resume upload AI scoring (never overwritten by interview analysis) |
| `interviews.ai_*` | Post-interview AI analysis (Carl's assessment) |
| `candidates.ai_analyzed_at` | Flag: interview analysis complete |
| `resume_uploads` | Per-file upload record with AI scores; primary source for Resume Summary tab |

---

## Scripts

```bash
npm run dev      # development server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```
