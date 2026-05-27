# Hiventra User Guide

Hiventra is an AI-powered hiring platform. It automates resume scoring, conducts voice/video interviews via Carl (AI interviewer), and produces Intelligence Reports — so recruiters can focus on decisions, not screening.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Job Management](#3-job-management)
4. [Resume Upload & AI Scoring](#4-resume-upload--ai-scoring)
5. [Candidate Pipeline](#5-candidate-pipeline)
6. [Carl Config](#6-carl-config)
7. [Sending Interview Invites](#7-sending-interview-invites)
8. [Intelligence Report](#8-intelligence-report)
9. [Talk with Carl](#9-talk-with-carl)
10. [Team Collaboration](#10-team-collaboration)
11. [Analytics](#11-analytics)
12. [AI Audit](#12-ai-audit)
13. [Settings](#13-settings)
14. [Candidate Portal](#14-candidate-portal)
15. [Interview Room (Candidate)](#15-interview-room-candidate)

---

## 1. Getting Started

### Recruiter / HR Login

1. Go to `https://www.hiventra.live/signin`
2. Enter your work email and complete the magic-link or OTP flow
3. You are redirected to `/dashboard`

> Candidates have a separate login at `/candidate/login` using a username + password sent by HR.

---

## 2. Dashboard

The Dashboard is the first screen after sign-in. It shows:

| Card | What it shows |
|------|--------------|
| Active Jobs | Count of currently active job postings |
| Total Candidates | All candidates across all jobs |
| Interviews Completed | Completed interview sessions |
| Avg AI Score | Average AI resume score across all candidates |

Below the KPI cards:
- **Active Jobs list** — quick link to each job's pipeline
- **Pipeline Health** — stage distribution chart
- **Recent Activity** — latest candidate actions

---

## 3. Job Management

**Path:** `/jobs`

### Create a Job

1. Click **Create New Job**
2. Fill in: Title, Department, Company, Location, Employment Type, Required Skills, Job Description
3. Set **Min Resume Score** — candidates below this score are flagged as failed
4. Choose status: **Draft** (hidden) or **Active** (open for candidates)
5. Click **Save**

### Edit / Archive a Job

Click the action menu (⋮) on any job row:
- **Edit** — update any field
- **Archive** — removes from active lists, keeps data
- **Delete** — permanently removes (use with caution)

### Filter Tabs

Use the tabs to filter: **All · Active · Draft · Closed · Archived**

---

## 4. Resume Upload & AI Scoring

**Path:** `/upload`

This is where bulk screening happens. Claude AI reads each resume and scores it against the job.

### Upload Resumes

1. Select a **Job** from the dropdown (top left)
2. Drag and drop PDF or DOCX files into the upload zone (or click to browse)
3. Files are scored automatically — no manual action needed

### Reading Results

Results appear in two tabs:

**Pass tab** — candidates who scored at or above the job's min resume score
- Shows: Name, Email, Score, AI Summary, Strengths/Weaknesses
- Click **Summary** to expand the full AI breakdown
- Click **View Profile** to open the candidate's full profile

**Failed tab** — candidates below the threshold
- Same detail view is available
- These candidates will not receive interview invites

### Create Accounts & Send Invites

Once resumes are scored, click **Create Accounts & Send Invites**:
- Creates login credentials (username + password) for all passing candidates
- Sends credentials via email (MailerSend)
- Updates candidate stage to **Invited**
- Candidates who already have accounts are skipped

> Note: MailerSend trial plan has a 250 unique-recipient cap. Contact support if you hit the limit.

---

## 5. Candidate Pipeline

**Path:** `/pipeline`

Visual Kanban board showing all candidates across hiring stages.

### Stages (Columns)

`New` → `Screening` → `Invited` → `Interview Started` → `Completed` → `Recommended` → `Hired` / `Rejected`

### Moving Candidates

- **Drag the card** to move a candidate to another stage
- Click **View Profile** on a card to open full candidate details

### Candidate Profile

From any card, click **View Profile** to see:
- Personal info (editable: name, email, phone, location)
- AI resume score + summary
- Interview status
- Actions: Send Invite, Recommend, Move to Hired/Rejected

### List View

Toggle to **List View** for a tabular layout with sorting and filtering.

---

## 6. Carl Config

**Path:** `/carl-config`

Configure how Carl (the AI interviewer) behaves for each job.

### Settings

| Setting | Description |
|---------|-------------|
| Job | Which job this config applies to |
| Interview Mode | **Voice** (audio only) · **Video** (Simli avatar) · **Text** (typed answers) |
| Personality | Carl's tone — Professional, Friendly, Formal, etc. |
| Topics | Skills/areas Carl should probe (e.g. React, Leadership) |
| Max Questions | How many questions Carl asks (3–15) |
| Duration | Time limit in minutes |

### How It Works

Carl reads the config when a candidate starts an interview:
- Generates questions tailored to the job and topics
- Applies the chosen personality to his tone
- Respects the max question count and duration

> Carl always opens with a warm welcome and closes with a thank-you — not counted as interview questions.

---

## 7. Sending Interview Invites

**From Candidate Pipeline or Candidate Profile:**

1. Open a candidate's profile
2. Click **Send Interview Invite**
3. Candidate receives an email with a link to `/portal/interview`
4. An `interviews` row is created with status `pending`

The candidate stage updates automatically as they progress:
- `Invited` → `Interview Started` → `Completed`

---

## 8. Intelligence Report

**Path:** `/candidates/[id]/report`

Full AI analysis of a candidate after their interview completes. Two tabs:

### Resume Summary Tab

Shows AI scoring from the resume upload:
- Overall score
- Summary sentence
- Strengths and weaknesses from the resume

### Intelligence Report Tab

Shows post-interview analysis generated by Claude AI:

| Section | Content |
|---------|---------|
| Score | 0–100 based on interview performance only |
| Recommendation | `Strongly Recommend` / `Recommend` / `Review Further` / `Do Not Recommend` |
| Summary | 2–3 sentence assessment |
| Skill Breakdown | Radar/bar chart: Technical, Communication, Problem Solving, Culture, Leadership, Domain |
| Strengths | 3–6 specific things the candidate demonstrated |
| Weaknesses | 1–4 gaps observed from answers |
| Interview Highlights | Key Q&A excerpts tagged Positive / Neutral / Concern |
| Risks | 0–3 concerns (empty if none) |

> Resume data and interview data are **always kept separate**. Interview scores never overwrite resume scores.

### Actions

- **Recommend** — moves candidate to `Recommended` stage
- **Hire** — moves to `Hired`
- **Reject** — moves to `Rejected`

---

## 9. Talk with Carl

**Path:** `/talk-with-carl`

Chat interface where recruiters can ask Carl questions about candidates and hiring data. Carl has access to real Supabase data — scores, pipeline status, job details — and answers based on actual records.

### Example Questions

- "Which candidates scored above 80 for the Frontend Engineer role?"
- "How many interviews were completed this week?"
- "Summarize the strengths of candidates in the pipeline for Job ID X."

Click **New Chat** to start a fresh conversation.

---

## 10. Team Collaboration

**Path:** `/collaboration`

Per-job collaboration workspace for hiring teams.

### Features

- **Candidate comparison table** — side-by-side AI scores and recommendation status
- **Comments** — leave notes on individual candidates visible to the whole team
- **Approvals** — team members can approve or flag candidates

Select a job from the dropdown to load its collaboration workspace.

---

## 11. Analytics

**Path:** `/analytics`

Hiring metrics dashboard. All data is live from Supabase — no placeholders.

### Metrics

| Chart | What it shows |
|-------|--------------|
| Hiring Funnel | Candidate drop-off across pipeline stages |
| Hiring Velocity | Time-to-hire trends over the selected date range |
| AI Performance | Score distribution, avg scores by job |
| Skill Gaps | Required vs. present skills across candidates |

Use the **date filter** to scope all charts to a specific time window.

---

## 12. AI Audit

**Path:** `/audit`

Immutable log of every AI decision made by the platform. Supports compliance and fairness review.

### What's Logged

Every resume score, interview analysis, stage change, and override generates an audit entry with:
- Timestamp
- Candidate name and job
- AI score and recommendation
- Human action taken (if any)
- Whether it was an override

### Features

- **Score Distribution** — histogram of AI scores across all jobs
- **Anomaly Alerts** — flags statistical outliers or fairness concerns
- **Override Tracking** — shows where humans overruled AI decisions
- **Explainability Search** — full-text search across AI justifications

---

## 13. Settings

**Path:** `/settings`

### Users & Roles Tab

Manage team members and their access levels.

| Role | Access |
|------|--------|
| `admin` | Full access |
| `hr_manager` | All hiring features |
| `hiring_manager` | Pipeline, reports, collaboration |
| `interviewer` | Pipeline view only |
| `dept_head` | Analytics and reports |

> Valid roles are exactly as listed above. Do not use `hr` — it will be rejected by the database.

### Carl Defaults Tab

Set system-wide defaults for Carl's interview settings (overridden per-job in Carl Config).

### Integrations Tab

API key management for connected services (ElevenLabs, OpenAI, etc.).

---

## 14. Candidate Portal

**Path:** `/portal`

Candidates see a simplified view after logging in at `/candidate/login`.

### Portal Home

Shows:
- **Progress Tracker** — visual steps: Applied → Shortlisted → Interview → Decision
- **Interview Card** — link to start or continue the interview (when an invite is active)
- **Decision Banner** — displayed when stage is `Recommended`, `Hired`, or `Rejected`

### Profile Page

Candidates can view their profile (name, email, username) and change their password via the avatar badge in the top navigation.

---

## 15. Interview Room (Candidate)

**Path:** `/portal/interview`

Three-phase flow:

### Phase 1 — Pre-Interview Check

Before the interview starts, the candidate checks:
- **Microphone** — confirms audio input works
- **Camera** — confirms video feed is active
- **Face Detection** — the Start button is disabled until a face is detected in the camera frame (requires good lighting and centered framing)

> Use Google Chrome for best compatibility with voice recording.

### Phase 2 — Active Interview

1. Carl greets the candidate with an opening welcome
2. Carl reads each question aloud (TTS via ElevenLabs; browser fallback if unavailable)
3. After Carl finishes speaking, recording starts automatically
4. Candidate speaks their answer, then clicks **Stop**
5. Answer is transcribed and submitted automatically
6. Carl gives a brief acknowledgment, then proceeds to the next question
7. A timer counts down the total interview duration

**Interview Modes:**
- **Voice** — audio only, Carl's voice via ElevenLabs
- **Video** — Carl appears as an animated avatar (Simli), lip-synced to speech
- **Text** — typed questions and answers, no audio

### Phase 3 — Complete

After the last question:
- Carl thanks the candidate
- The system automatically runs AI analysis on the responses
- A completion screen appears — candidate should not close the tab until analysis finishes
- Results become available to the recruiter in the Intelligence Report

---

## Tips & Troubleshooting

| Issue | Fix |
|-------|-----|
| Carl doesn't speak | Check browser (use Chrome). ElevenLabs may fall back to browser TTS |
| Recording doesn't start | Ensure microphone permission is granted in browser |
| Face not detected | Improve lighting, move closer to camera, center your face |
| Email not received | Check spam folder. MailerSend trial has a 250 unique-recipient cap |
| Score didn't update after upload | Refresh the page — the pipeline reads live data |
| "Invalid username and password" | Contact HR to resend credentials via the Resend Invite button |

---

## Roles Quick Reference

| Who | Where to go |
|-----|------------|
| HR / Recruiter | Sign in at `/signin` → Dashboard |
| Hiring Manager | Sign in at `/signin` → Pipeline, Reports, Collaboration |
| Candidate | Sign in at `/candidate/login` → Portal |
