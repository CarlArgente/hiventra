# Hiventra — AI Talent Intelligence Platform
## Feature Specification by Page

> **Tagline:** Intelligent Hiring, Powered by Carl AI
> **Version:** 1.1 — Page-by-Page Specification
> **Last Updated:** 2026-05-20

Each section below represents one UI page or screen in the Hiventra platform.
Every page includes:
- **Purpose** — what this page does
- **Features List** — what it contains and how it works
- **AI Design + Dev Prompt** — paste-ready prompt to build this page

---

## Page Index

| # | Page Name | Who Sees It |
|---|---|---|
| 1 | Login / Auth Page | All users |
| 2 | HR Dashboard (Home) | HR, Hiring Manager, Admin |
| 3 | Job Management Page | HR, Admin |
| 4 | Create / Edit Job Page | HR, Admin |
| 5 | Resume Upload Page | HR |
| 6 | Candidate Pipeline Page | HR, Hiring Manager, Interviewer |
| 7 | Candidate Profile Page | HR, Hiring Manager, Interviewer, Dept. Head |
| 8 | Carl Interview Config Page | HR, Admin |
| 9 | Interview Room Page | Candidate |
| 10 | Candidate Intelligence Report Page | HR, Hiring Manager, Interviewer, Dept. Head |
| 11 | Team Collaboration Page | HR, Hiring Manager, Interviewer, Dept. Head |
| 12 | Analytics Dashboard Page | HR, Admin, Dept. Head |
| 13 | Candidate Portal — Home | Candidate |
| 14 | Candidate Portal — Interview Room | Candidate |
| 15 | AI Transparency & Audit Page | Admin |
| 16 | Settings & Admin Page | Admin |

---

---

## Page 1 — Login / Auth Page

### Purpose
Entry point for all users (HR team and candidates). Handles authentication, account recovery, and first-time login via magic link or OTP.

### Features List
- Email input field for login (primary auth method)
- OTP (one-time password) or magic link sent to email — no password required
- "Remember me" toggle for persistent sessions
- Forgot / resend OTP link
- First-time login flow for auto-created candidate accounts
- Company branding area (logo, name) for white-label support
- Role-based redirect after login:
  - HR/Admin → HR Dashboard
  - Candidate → Candidate Portal Home
- Error states: invalid email, expired OTP, account not found
- Mobile-responsive layout
- Hiventra branding + tagline displayed on auth screen

### AI Design + Dev Prompt

```
Design and build the Login / Authentication page for Hiventra, an AI Talent 
Intelligence Platform for HR teams. The AI interviewer is named Carl.

UI Requirements:
- Split-screen layout: left side shows Hiventra branding (logo, tagline 
  "Intelligent Hiring, Powered by Carl AI", subtle abstract background or 
  animated gradient); right side shows the login form
- Login method: email-only with OTP or magic link (no password field)
- Input: single email field, large CTA button "Send Login Link"
- After submission: show OTP entry screen or "Check your email" confirmation state
- Include "Resend code" link with a countdown timer (30 seconds)
- Add a "Remember this device" checkbox
- Show role-specific welcome message after login redirect
- Error states: empty field, invalid email format, expired OTP, unrecognized account
- Mobile-first responsive; stack layout vertically on mobile
- Design language: modern enterprise SaaS — dark navy/slate tones, accent color 
  indigo or electric blue, clean sans-serif typography (Inter or Geist), minimal 
  shadows, subtle animations

Tech: Build as a React component with form validation. Use Tailwind CSS for 
styling. Implement OTP input as 6 individual digit boxes. 
No localStorage — use in-memory session state.
```

---

---

## Page 2 — HR Dashboard (Home)

### Purpose
The central command center for HR users. Provides an at-a-glance view of active jobs, pipeline health, recent activity, and key hiring metrics.

### Features List
- Welcome header with user name and current date
- Summary KPI cards:
  - Total Active Jobs
  - Resumes Uploaded (last 30 days)
  - Interviews Completed (last 30 days)
  - Candidates Recommended
- Active Jobs panel: list of top active jobs with applicant count and status
- Recent Activity feed: timestamped log of latest actions (resumes uploaded, interviews completed, decisions made)
- Candidate Pipeline Snapshot: mini funnel showing total candidates at each stage across all jobs
- Quick Action buttons:
  - Create New Job
  - Upload Resumes
  - View All Candidates
  - View Reports
- Notification bell with alerts (new interview completed, approval needed, candidate hired)
- Top navigation bar: logo, nav links, user avatar/menu
- Left sidebar navigation (collapsible)

### AI Design + Dev Prompt

```
Design and build the HR Dashboard (Home Page) for Hiventra, an AI Talent 
Intelligence Platform. The AI interviewer is named Carl.

Layout:
- Top navigation bar: Hiventra logo left, main nav links center (Dashboard, 
  Jobs, Candidates, Reports, Analytics), notification bell + user avatar right
- Collapsible left sidebar with full navigation tree
- Main content area: responsive grid

Content Sections (top to bottom):
1. Welcome Header — "Good morning, [Name]" + today's date + short tagline
2. KPI Cards Row — 4 cards: Active Jobs, Resumes Uploaded, Interviews Completed, 
   Candidates Recommended. Each card: icon, large number, label, trend indicator 
   (up/down % vs last month)
3. Two-column layout below:
   Left (60%): Active Jobs list — job title, department, applicant count, status 
   badge (Draft/Active/Closed), "View" CTA per row
   Right (40%): Recent Activity feed — icon + action description + time ago
4. Pipeline Snapshot — horizontal funnel bar showing candidate counts at each 
   stage: Uploaded → Screened → Invited → Interview Started → Completed → 
   Recommended → Hired
5. Quick Actions — 4 large icon buttons: Create Job, Upload Resumes, 
   View Candidates, View Analytics

Design language: enterprise SaaS — dark sidebar (slate-900), white/light gray 
main content area, indigo accent color, card shadows, clean data typography. 
Status badges use color coding: Active=green, Draft=yellow, Closed=gray.

Tech: React with Tailwind CSS. Use recharts for the pipeline funnel visualization. 
Sidebar collapsible with smooth transition. All data from props/mock JSON.
```

---

---

## Page 3 — Job Management Page

### Purpose
A centralized list view of all job postings across the organization. HR can view, filter, search, and manage job statuses from this page.

### Features List
- Page header: "Job Management" title + "Create New Job" primary button
- Search bar: search by job title, department, or location
- Filter tabs: All / Draft / Active / Closed / Archived
- Sort options: Date Created, Title A–Z, Applicant Count
- Job cards or table rows, each showing:
  - Job Title
  - Department
  - Employment Type badge
  - Location
  - Date Created
  - Applicant Count
  - Current Status badge (Draft / Active / Closed / Archived)
  - Action menu (3-dot): Edit, Duplicate, Archive, Close, View Candidates
- Empty state: illustration + "No jobs yet. Create your first job posting."
- Pagination or infinite scroll
- Bulk actions: Archive selected, Change status

### AI Design + Dev Prompt

```
Design and build the Job Management page for Hiventra, an AI Talent 
Intelligence Platform.

Layout:
- Shared top nav + left sidebar (consistent with dashboard)
- Page header row: "Job Management" (h1) on left, "Create New Job" 
  primary button (indigo) on right
- Below header: search input (left) + filter tabs (All / Draft / Active / 
  Closed / Archived) + sort dropdown (right)
- Main area: table or card grid of job postings

Job Row / Card fields:
- Job Title (bold, clickable → goes to job detail)
- Department (muted text)
- Employment Type badge (Full-time, Part-time, Contract — each a distinct color)
- Location (with map pin icon)
- Created date (formatted: "May 12, 2026")
- Applicant count (person icon + number)
- Status badge: Draft (yellow), Active (green), Closed (gray), Archived (slate)
- Three-dot action menu per row: Edit Job, Duplicate, Archive, Close, 
  View Candidates

States:
- Loading skeleton rows
- Empty state with centered illustration and "Create your first job posting" CTA
- Filtered empty state: "No jobs match your filters"

Design: Clean enterprise table with hover row highlight, sticky header, 
alternating subtle row backgrounds. Status badges are pill-shaped. 
Action menu is a dropdown popover.

Tech: React + Tailwind CSS. Table with sortable columns. Filter tabs update 
list in real time. Mock data array as prop. Confirmation modal for Archive/Close.
```

---

---

## Page 4 — Create / Edit Job Page

### Purpose
A full-form page for creating a new job posting or editing an existing one. This page feeds the AI system with the structured job data used for resume evaluation and Carl interview generation.

### Features List
- Page title: "Create New Job" or "Edit Job: [Job Title]"
- Form sections (grouped by card):
  - **Job Basics:** Title, Company Name, Department, Employment Type, Location
  - **Compensation:** Salary Range (min/max with currency selector) — optional toggle
  - **Job Description:** Rich text editor (bold, bullets, headings, links)
  - **Requirements:** Required Skills (tag input), Preferred Qualifications (rich text), Years of Experience (range slider or min/max number inputs)
- Job Status selector: Draft / Active / Closed (toggle at top of form)
- Carl Interview Configuration (inline):
  - Interview Mode: Text / Voice / Video
  - Carl Personality: Friendly / Professional / Strict / Executive / Technical Deep Dive
  - Interview Duration: 15 / 30 / 45 / 60 min
  - Question Count Limit
- Form actions:
  - Save as Draft
  - Publish (sets to Active)
  - Cancel
- Unsaved changes warning on navigation away
- Edit mode pre-populates all fields from existing job data

### AI Design + Dev Prompt

```
Design and build the Create / Edit Job page for Hiventra, an AI Talent 
Intelligence Platform.

Layout:
- Shared top nav + left sidebar
- Page header: "Create New Job" (or "Edit Job: [Title]" in edit mode)
- Status selector top-right: Draft | Active | Closed — pill toggle component
- Two-column layout: main form (70% left) + sticky sidebar summary card (30% right)

Form Sections (grouped in distinct cards with section headers):

Card 1 — Job Basics:
  - Job Title (text input, required)
  - Company Name (text input, required)
  - Department (dropdown: Engineering, Sales, HR, Marketing, Finance, Operations, Other)
  - Employment Type (segmented control: Full-time | Part-time | Contract | Freelance)
  - Location (text input + "Remote" toggle switch)

Card 2 — Compensation (collapsible, optional):
  - Toggle: "Include Salary Range"
  - When toggled on: Min salary + Max salary inputs + Currency dropdown (USD, PHP, EUR, GBP)

Card 3 — Job Description:
  - Rich text editor with toolbar: Bold, Italic, Bullet List, Numbered List, 
    Heading, Link
  - Placeholder: "Describe the role, responsibilities, and what success looks like..."

Card 4 — Requirements:
  - Required Skills: tag input (type and press Enter to add, click X to remove)
  - Preferred Qualifications: rich text area
  - Years of Experience: dual-handle range slider (0–20+ years) 
    + min/max number display

Card 5 — Carl Interview Setup:
  - Interview Mode: icon button group (Text / Voice / Video)
  - Carl Personality: radio card group with icon + label + short description each
    (Friendly, Professional, Strict, Executive, Technical Deep Dive)
  - Interview Duration: segmented control (15 / 30 / 45 / 60 min)
  - Max Questions: number input (5–20)

Right Sticky Sidebar:
  - Summary card: shows Job Title, Department, Employment Type, Location as 
    filled in
  - "Carl is configured for: [Personality] mode" label
  - Action buttons stacked: "Save as Draft" (outline), "Publish Job" (indigo filled)

Design: Clean multi-section form, each card has subtle shadow and rounded 
corners. Tag inputs are interactive pills. Range slider uses indigo accent. 
Carl Personality cards use hover + selected states with border highlight.

Tech: React + Tailwind CSS. Rich text: use a simple contentEditable div or 
lightweight editor. Tag input: controlled array state. Confirm dialog if 
navigating away with unsaved changes.
```

---

---

## Page 5 — Resume Upload Page

### Purpose
HR uploads candidate resumes against an active job. The system processes each resume and creates candidate profiles with AI match scores automatically.

### Features List
- Job selector at top: choose which active job to upload resumes for
- Drag-and-drop upload zone (supports PDF and DOCX)
- Multi-file select: up to 50 files per session
- Upload queue list showing:
  - File name
  - File size
  - Upload status (Queued / Uploading / Parsing / Scored / Error)
  - Per-file progress indicator
- Supported format notice: PDF, DOCX only
- File validation errors: wrong format, file too large, duplicate file name
- Upload summary after completion:
  - Total uploaded
  - Successfully parsed
  - Failed (with reasons)
  - Average AI Match Score
- "View Candidates" CTA after upload completes
- Cancel / clear queue option before upload starts
- Processing status: real-time AI parse progress per file

### AI Design + Dev Prompt

```
Design and build the Resume Upload page for Hiventra, an AI Talent 
Intelligence Platform.

Layout:
- Shared top nav + left sidebar
- Page header: "Upload Resumes" + subtitle "Upload up to 50 resumes at once. 
  Hiventra will parse, score, and create candidate profiles automatically."

Section 1 — Job Selector:
  - Dropdown labeled "Upload resumes for:" listing active jobs
  - Selected job shows: Job Title + Department + badge "Active"
  - Warning if no active jobs exist: "You need an active job posting to 
    upload resumes." + "Create Job" link

Section 2 — Upload Zone:
  - Large dashed-border drop zone (center of page)
  - Cloud upload icon + text: "Drag & drop resumes here"
  - Subtext: "Supports PDF and DOCX — up to 50 files per session"
  - "Browse Files" button (opens file picker, multi-select enabled)
  - On drag-over: zone border turns indigo, background lightens

Section 3 — Upload Queue (appears after files are added):
  - List of file rows, each showing:
    - File icon (PDF red / DOCX blue)
    - File name (truncated if long)
    - File size (e.g., "245 KB")
    - Status badge: Queued (gray) / Uploading (blue) / Parsing (purple) / 
      Scored (green) / Error (red)
    - Progress bar (thin, indigo fill) during upload/parsing
    - Remove (X) button when status is Queued
  - Sticky footer of queue: total count, "Clear All" link, "Start Upload" 
    primary button

Section 4 — Completion Summary (replaces queue after all done):
  - Summary card: ✅ 47 Parsed Successfully | ⚠️ 2 Failed | 
    📊 Average Match Score: 72/100
  - Failed files listed with reason (e.g., "Password-protected PDF", 
    "Corrupt file")
  - CTA button: "View Candidates" (indigo filled)
  - Secondary: "Upload More Resumes"

Design: Clean, minimal upload UI. Drop zone is prominent and centered. 
Status badges are pill-shaped with matching icon. Progress is animated.
Errors are clearly surfaced inline — never as modal popups.

Tech: React + Tailwind CSS. File input with multiple attribute. 
Drag events on drop zone div. Upload queue as state array. 
Simulate async parsing with status transitions. No real file upload needed 
for prototype — mock with setTimeout state changes.
```

---

---

## Page 6 — Candidate Pipeline Page

### Purpose
The main hiring workflow view for a specific job. HR and hiring teams see all candidates, their current pipeline stage, AI scores, and can take actions on each candidate.

### Features List
- Job context bar at top: Job Title, Department, Status, Created Date, applicant count
- View toggle: Kanban board view / List table view
- **Kanban view:** column per pipeline stage (Uploaded, Screened, Invited, Interview Started, Completed, Recommended, Rejected, Hired); candidate cards draggable between stages
- **List view:** sortable table with columns: Candidate Name, AI Score, Resume Recommendation, Interview Status, Last Activity, Actions
- Candidate card (Kanban) shows:
  - Name + avatar initials
  - AI Match Score badge (color-coded by range)
  - Recommendation label
  - Interview mode icon
  - Quick action: View Profile
- Filter bar: by AI Score range, Recommendation, Interview Mode, Date
- Search: by candidate name or email
- Bulk actions: Invite Selected, Reject Selected, Move Stage
- Stage count badges on Kanban columns
- Empty column state: "No candidates at this stage"

### AI Design + Dev Prompt

```
Design and build the Candidate Pipeline page for Hiventra, an AI Talent 
Intelligence Platform. This page shows all candidates for a specific job 
in a hiring workflow.

Layout:
- Shared top nav + left sidebar
- Job Context Bar (below top nav): Job Title (bold) | Department | Status badge 
  | "47 Candidates" count | Edit Job link
- Controls row: Search input (left) | Filter button (opens filter panel) | 
  View toggle: Kanban / List (right)

KANBAN VIEW:
- Horizontal scrollable column layout
- One column per pipeline stage:
  Uploaded → Screened → Invited → Interview Started → 
  Completed → Recommended → Rejected → Hired
- Each column header: stage name + count badge (e.g., "Screened (12)")
- Candidate Card (per column):
  - Avatar circle with initials (color from name hash)
  - Candidate name (bold) + job title applied for
  - AI Score badge: 85/100 — color coded (green 80+, yellow 60–79, red <60)
  - Recommendation pill: "Highly Recommended" / "Recommended" / 
    "Review Further" / "Not Recommended"
  - Interview mode icon: 💬 Text / 🎙️ Voice / 🎥 Video
  - "View Profile" link at bottom of card
- Cards are draggable between columns (drag-and-drop)
- Empty column: centered text "No candidates here"

LIST VIEW:
- Table with sortable columns:
  Name | AI Score | Recommendation | Stage | Interview Mode | Last Activity | Actions
- Action column: View Profile button + 3-dot menu (Move Stage, Invite, Reject)
- Row click → opens Candidate Profile page

FILTER PANEL (slide-in drawer):
- AI Score range slider (0–100)
- Recommendation multiselect checkboxes
- Interview Mode filter
- Stage filter
- Date uploaded range

Design: Kanban columns use light background cards with drop shadow. 
Score badge is a pill with bold number. Recommended candidates have a 
subtle green left border on card. Rejected have a red left border.
Column headers are sticky. Drag-and-drop shows a ghost card.

Tech: React + Tailwind CSS. Kanban: use @dnd-kit/core for drag-and-drop. 
List: sortable table with state. Filters: controlled state, update list 
in real time. Mock candidate data array as prop.
```

---

---

## Page 7 — Candidate Profile Page

### Purpose
A detailed view of a single candidate — showing their resume data, AI match score breakdown, interview status, and actions available to the HR team.

### Features List
- Candidate header: Name, avatar, email, phone, current status badge
- Resume Summary card: AI-generated 2–3 sentence profile summary
- AI Match Score card:
  - Overall score (ring/gauge visualization)
  - 5-category score breakdown bars (Skill Match, Experience, Industry Fit, Leadership Fit, Communication Signals)
  - Recommendation badge
  - AI Explanation text
- Strengths list
- Weaknesses list
- Resume viewer / download link (original uploaded file)
- Interview status card:
  - Mode (Text / Voice / Video)
  - Status (Not Invited / Invited / Started / Completed)
  - Date of invitation sent
  - Date of interview completion
  - "View Intelligence Report" CTA (if completed)
- Action buttons: Send Interview Invite / Resend Invite / Move to Stage / Reject / Hire
- Internal Notes & Comments section (team collaboration)
- Activity log: timestamped actions on this candidate

### AI Design + Dev Prompt

```
Design and build the Candidate Profile page for Hiventra, an AI Talent 
Intelligence Platform.

Layout:
- Shared top nav + left sidebar
- Breadcrumb: Jobs > [Job Title] > Candidates > [Candidate Name]
- Two-column layout: left main (65%) + right action sidebar (35%)

LEFT MAIN COLUMN:

Card 1 — Candidate Header:
  - Large avatar circle (initials)
  - Name (h1), email, phone number, LinkedIn icon link
  - Status badge (current pipeline stage)
  - "Applied for: [Job Title]" label

Card 2 — AI Resume Summary:
  - Section header: "AI Resume Summary"
  - 2–3 sentence AI-generated candidate summary paragraph
  - Subtle purple/indigo left border accent

Card 3 — AI Match Score:
  - Overall Score: large circular gauge (donut ring) centered, 
    score number inside (e.g., "85"), label "/ 100" below
  - Score color: green 80+, yellow 60–79, red <60
  - 5 horizontal progress bars below:
    Skill Match | Years of Experience | Industry Fit | 
    Leadership Fit | Communication Signals
    Each bar: label left, percentage right, filled bar with indigo color
  - AI Explanation box: light gray background, italic text, 
    "Carl's Assessment:" label

Card 4 — Strengths & Weaknesses (two-column inside card):
  - Strengths: green check icons + bulleted list
  - Weaknesses: orange warning icons + bulleted list

Card 5 — Resume:
  - "Original Resume" header
  - PDF/DOCX preview thumbnail or filename
  - "Download Resume" button + "View Full Resume" link

Card 6 — Team Notes & Comments:
  - Thread of comments with: avatar, name, timestamp, comment text
  - "Add Note" textarea at bottom with Post button
  - Toggle: Public Comment / Private Note

RIGHT ACTION SIDEBAR:

Action Card:
  - Primary action button (context-aware):
    If not invited → "Send Interview Invite" (indigo filled)
    If invited → "Resend Invite" + "Mark as Started"
    If completed → "View Intelligence Report" (indigo filled)
  - Secondary actions: "Move to Stage" dropdown, "Reject Candidate", "Mark as Hired"
  - Danger zone (red text): "Reject" — with confirmation

Interview Status Card:
  - Mode icon + label (Text / Voice / Video)
  - Status: Not Invited / Invited / Started / Completed
  - Sent on: date
  - Completed on: date (if applicable)

Activity Log Card:
  - Scrollable list of timestamped events (Resume Uploaded, Score Generated, 
    Invite Sent, Interview Completed, Note Added)

Design: Clean two-column profile layout. Score gauge is the hero element 
of the page. Cards have subtle shadows and 8px border radius. 
Action sidebar is sticky on scroll. Status badge colors match pipeline conventions.

Tech: React + Tailwind CSS. Score gauge: SVG circle or recharts RadialBarChart. 
Progress bars: animated on mount. Comments: controlled textarea state. 
Mock candidate object as prop.
```

---

---

## Page 8 — Carl Interview Config Page

### Purpose
HR configures Carl's interview settings for a specific job before inviting candidates. This is the control panel for the AI interviewer.

### Features List
- Job context: which job this config applies to
- Interview Mode selection: Text / Voice / Video (icon cards, selectable)
- Carl Personality selection: Friendly / Professional / Strict / Executive / Technical Deep Dive (descriptive radio cards)
- Interview Duration: segmented buttons (15 / 30 / 45 / 60 min)
- Max Questions: number stepper (5–20)
- Topics to Include: multi-select tag pills (Skills, Experience, Culture Fit, Situational, Technical, Behavioral, Leadership)
- Topics to Exclude: same set minus selected inclusions
- Role Type Override: auto-detected from job title + option to manually set (Developer / Sales / HR / Executive / Support / Finance / Other)
- Preview pane: shows a sample Carl opening question based on current config
- Save Configuration button
- "Restore Defaults" link

### AI Design + Dev Prompt

```
Design and build the Carl Interview Configuration page for Hiventra, an AI 
Talent Intelligence Platform. Carl is the platform's AI interviewer.

Layout:
- Shared top nav + left sidebar
- Page header: "Configure Carl Interview" + job title subtitle
- Two-column layout: config form (65% left) + live preview panel (35% right, sticky)

LEFT COLUMN — Configuration Form:

Section 1 — Interview Mode:
  - Three large selectable icon cards side by side:
    💬 Text Interview | 🎙️ Voice Interview | 🎥 Video Interview
  - Each card: icon (large), label, 1-line description
  - Selected card: indigo border + indigo background tint + checkmark badge

Section 2 — Carl Personality:
  - Five radio cards in a 2–3 column grid:
    Friendly | Professional | Strict | Executive | Technical Deep Dive
  - Each card: emoji/icon, personality name (bold), 2-line description of tone
  - Selected: highlighted border + filled indicator dot

Section 3 — Duration & Questions:
  - "Interview Duration" label + 4-button segmented control: 
    15 min | 30 min | 45 min | 60 min
  - "Max Questions" label + stepper: [ − ] [ 10 ] [ + ] (range 5–20)

Section 4 — Topics:
  - "Topics to Include" — multi-select pill group:
    Skills | Experience | Culture Fit | Situational | Technical | 
    Behavioral | Leadership | Problem Solving
    (click to toggle on/off; selected = indigo filled pill)
  - "Topics to Exclude" — auto-populates with non-selected topics from above; 
    user can lock specific exclusions

Section 5 — Role Type:
  - Label: "Carl will interview as if hiring for a:"
  - Dropdown: Developer / Sales / HR / Executive / Support / Finance / Other
  - Below dropdown: "Auto-detected from job title" italic caption (with override option)

Form Footer:
  - "Restore Defaults" text link (left)
  - "Save Configuration" primary button (right, indigo)

RIGHT STICKY PREVIEW PANEL:
  - Header: "Carl Preview" with Carl avatar icon
  - Label: "Sample opening question based on your settings:"
  - Quote box with italic sample question (updates live as settings change):
    e.g., "Walk me through the most complex API you've architected and 
    the key design decisions you made."
  - Below: "Personality: Professional | Mode: Text | Duration: 30 min" summary
  - Small note: "Carl generates all questions dynamically — this is a sample."

Design: Configuration cards use clear selected vs unselected states. 
Segmented controls are clean pill buttons. Preview panel has subtle indigo 
tint background. Carl avatar icon is a stylized "C" in an indigo circle.

Tech: React + Tailwind CSS. All selections as controlled state. 
Preview question updates based on selected personality + role type combination 
(use a lookup map of sample questions per combination).
```

---

---

## Page 9 — Interview Room Page (Candidate-Facing)

### Purpose
The live interview experience where the candidate interacts with Carl. This page is the primary candidate-facing product surface and must feel professional, calm, and confidence-inspiring.

### Features List
- Pre-interview check screen (before interview starts):
  - Microphone test (Voice/Video modes)
  - Camera test (Video mode)
  - Instructions and what to expect
  - Carl introduction message
  - "I'm Ready — Start Interview" button
- Active interview screen:
  - Carl's question displayed prominently
  - Question counter (e.g., Question 3 of 10)
  - Interview mode-specific input:
    - **Text:** large text input area with character count, Submit button
    - **Voice:** record button, waveform visualization, stop/submit controls
    - **Video:** webcam feed (self-view), record button, countdown
  - Elapsed time indicator
  - Carl "thinking" animation between questions (shows Carl is processing)
  - Progress bar (questions completed / total)
- Post-interview screen:
  - "Interview Complete" confirmation message
  - Thank you note with next steps
  - Redirect to Candidate Portal

### AI Design + Dev Prompt

```
Design and build the Interview Room page for Hiventra, an AI Talent 
Intelligence Platform. This is the candidate-facing live interview experience 
conducted by Carl, the AI interviewer.

This page has three states: Pre-Interview Check, Active Interview, and Complete.

STATE 1 — PRE-INTERVIEW CHECK:
Layout: centered card on dark background (deep navy or slate-900)
Content:
  - Carl avatar (stylized "C" icon in glowing indigo circle) + "Hi, I'm Carl"
  - "Welcome, [Candidate Name]" heading
  - Job title + Company name subheading
  - Interview details: Mode (Text/Voice/Video), Duration (30 min), ~10 questions
  - Instruction list (3 items): "Find a quiet space", 
    "Read each question carefully", "Answer as naturally as you can"
  - For Voice/Video: microphone/camera check widget with green/red status indicator
  - Large CTA button: "Start Interview with Carl" (indigo, full-width on mobile)
  - Subtle: "Carl uses AI to conduct this interview. Your responses will be 
    recorded and analyzed." privacy notice

STATE 2 — ACTIVE INTERVIEW (Text Mode shown as primary):
Layout: clean focused interface, no distractions
  - Top bar: Hiventra logo (left), "Question 3 of 10" (center), 
    elapsed time "12:45" (right)
  - Progress bar: thin indigo line at very top showing question progress
  - Carl section (upper 40% of page):
    - Carl avatar (small, left-aligned)
    - Carl's question in large, readable card:
      "Describe the most complex API architecture you have designed. 
      What were the key trade-offs you considered?"
    - Carl "thinking" animation (3 pulsing dots) shown briefly between questions
  - Candidate response section (lower 50%):
    TEXT MODE:
      - Large textarea placeholder: "Type your answer here..."
      - Character count bottom-right (e.g., "247 characters")
      - "Submit Answer" button (indigo, right-aligned)
      - "Skip this question" text link (muted, use sparingly)
    VOICE MODE:
      - Centered large record button (red circle when recording)
      - Audio waveform visualization (animated bars)
      - "Recording... 0:23" counter
      - Stop + Submit button
    VIDEO MODE:
      - Split: Carl question left, candidate webcam feed right (small self-view)
      - Record/Stop controls below webcam

STATE 3 — INTERVIEW COMPLETE:
Layout: centered card, same dark background as pre-check
  - Large checkmark animation (green)
  - "Interview Complete!" heading
  - "Thank you, [Name]. Carl has recorded your responses."
  - "What happens next:" 3-step mini timeline:
    1. Carl analyzes your responses
    2. Our team reviews the report
    3. You'll hear back within [X] business days
  - CTA: "Return to Your Dashboard" button

Design: Dark, focused UI — slate-900 background, white text, 
indigo accents. Carl's question card uses white background on dark 
for strong contrast. No distracting elements. Mobile responsive.
Carl avatar is consistent throughout all states.

Tech: React + Tailwind CSS. State machine: preCheck → active → complete. 
Question cycling with index state. Text mode: controlled textarea. 
Timer: useEffect + setInterval. Voice: use MediaRecorder API stub. 
No localStorage — all state in memory.
```

---

---

## Page 10 — Candidate Intelligence Report Page

### Purpose
The full AI-generated post-interview report for a candidate. HR team members use this to evaluate the candidate's performance and make hiring decisions.

### Features List
- Report header: Candidate name, job applied for, interview date, report generated date
- Overall Score (0–100) — large ring visualization
- Hiring Recommendation badge (Strongly Recommend / Recommend / Review Further / Do Not Recommend)
- AI Justification block — narrative explanation of the recommendation
- Strengths list (3–7 points, sourced from interview)
- Weaknesses list (2–5 points)
- Risk Indicators (if any) — flagged observations
- Skill Breakdown — domain-by-domain percentage bars
- Interview Highlights — 3–5 curated response excerpts, tagged Positive / Neutral / Concern
- HR team actions:
  - Add to shortlist
  - Move to next stage
  - Reject
  - Add comment
- Download Report as PDF button
- Share Report link (role-permissioned)
- Audit trail: who viewed this report + timestamps

### AI Design + Dev Prompt

```
Design and build the Candidate Intelligence Report page for Hiventra, an AI 
Talent Intelligence Platform. This report is generated by Carl after an 
AI interview is completed.

Layout:
- Shared top nav + left sidebar
- Breadcrumb: Jobs > [Job Title] > [Candidate Name] > Intelligence Report
- Two-column: main report (68% left) + action sidebar (32% right, sticky)
- Full report is printable / PDF exportable

LEFT MAIN COLUMN:

Section 1 — Report Header:
  - Candidate name (h1) + avatar initials circle
  - "Interview Report for: [Job Title]" subheading
  - Interview date + Report generated date (muted)
  - "Generated by Carl AI" badge with Carl icon

Section 2 — Overall Score + Recommendation (hero section):
  - Large circular gauge (donut ring): score number inside (e.g., "84"), 
    "/100" label, ring color green/yellow/red based on score
  - Next to gauge: Recommendation badge (pill, large):
    Strongly Recommend (green) | Recommend (teal) | 
    Review Further (yellow) | Do Not Recommend (red)
  - Below: AI Justification box — light gray background, italic paragraph,
    "Carl's Assessment:" label in indigo

Section 3 — Strengths & Weaknesses (two columns):
  - Strengths: green circle-check icons, bulleted list of 3–7 items
  - Weaknesses: orange triangle-warning icons, bulleted list of 2–5 items

Section 4 — Risk Indicators (conditional, shows only if flags exist):
  - Yellow warning banner at top of section
  - Each risk as a row: risk label + brief description
  - "These are observations, not disqualifying factors."

Section 5 — Skill Breakdown:
  - Section header: "Skill Breakdown"
  - List of skill domains with horizontal bar + percentage:
    Backend Engineering — 92%
    System Design — 87%
    Communication — 82%
    Problem Solving — 78%
    Culture Alignment — 75%
    Leadership Potential — 68%
  - Bars animated on scroll-into-view, indigo fill color

Section 6 — Interview Highlights:
  - Section header: "Interview Highlights"
  - 3–5 quote cards, each with:
    - Quote icon (large)
    - Candidate response excerpt (italicized, in quotes)
    - Question that prompted it (muted text above)
    - Tag badge: Positive (green) / Neutral (gray) / Concern (red)

Section 7 — Team Notes:
  - Existing comments thread
  - Add comment form at bottom

RIGHT ACTION SIDEBAR (sticky):

Decision Card:
  - "Your Decision:" label
  - 3 action buttons stacked:
    "Add to Shortlist" (outlined indigo)
    "Move to Next Stage" (indigo filled)
    "Reject Candidate" (outlined red)
  - Confirm modal for rejection

Report Actions:
  - "Download PDF" button with download icon
  - "Share Report" link (copies permissioned URL)

Who Viewed Card:
  - "Viewed by:" list of team member names + timestamps

Design: Report feels like a polished HR document, not a dashboard. 
White background, generous whitespace. Score gauge is the hero. 
Highlights section feels like annotated interview notes. 
Skill bars animate in. Risk indicators use amber/yellow — 
never red (which is reserved for Do Not Recommend).

Tech: React + Tailwind CSS. Score gauge: SVG donut ring. 
Skill bars: animated via Intersection Observer. PDF export: 
window.print() with print-specific CSS or jsPDF. Mock report data as prop.
```

---

---

## Page 11 — Team Collaboration Page

### Purpose
A shared workspace for the hiring team to discuss candidates, compare scores, manage approvals, and reach collaborative hiring decisions for a specific job.

### Features List
- Job header context
- Candidate comparison table:
  - Side-by-side view of multiple candidates' AI scores and skill breakdowns
  - Sortable by score, recommendation, stage
- Approval Workflow tracker per candidate:
  - HR Review → Hiring Manager Approval → Dept. Head Sign-off
  - Visual progress indicator with action buttons per stage
- Team comment threads (candidate-specific)
- Score Alignment indicator: shows where AI score and human reviewer scores diverge significantly
- Notification list: pending approvals, unread comments, stage changes
- Team members panel: list of users assigned to this job's hiring team

### AI Design + Dev Prompt

```
Design and build the Team Collaboration page for Hiventra, an AI Talent 
Intelligence Platform. This page enables hiring teams to collaborate on 
candidate decisions for a specific job.

Layout:
- Shared top nav + left sidebar
- Page header: "Hiring Team — [Job Title]" + team member avatars (small, stacked)
- Tabbed navigation below header: 
  Candidate Comparison | Approval Workflow | Team Comments | Score Alignment

TAB 1 — Candidate Comparison:
  - Table comparing top candidates side by side:
    Columns: Candidate | Overall Score | Skill Match | Experience | 
    Communication | Culture Fit | Recommendation | Status
  - Each score cell: number + mini colored bar
  - Row hover highlights entire candidate row
  - Sort by any column
  - "View Report" link per row
  - "Compare Selected" toggle: select 2–3 candidates for focused side-by-side view

TAB 2 — Approval Workflow:
  - Per-candidate approval cards:
    - Candidate name + score badge
    - 3-stage approval pipeline (horizontal stepper):
      HR Review (✅ Done) → Hiring Manager (⏳ Pending) → Dept. Head (○ Waiting)
    - Action button for current stage owner: "Approve" | "Request Review" | "Reject"
    - Approved stages show who approved + date

TAB 3 — Team Comments:
  - Left panel: candidate list (name + score) — clicking switches comment thread
  - Right panel: full comment thread for selected candidate
    - Comment: avatar, name, role badge, timestamp, comment text
    - Threaded replies (one level deep)
    - @mention support
    - "Private Note" toggle on compose box
    - Compose textarea + Post button

TAB 4 — Score Alignment:
  - Section header: "Where do AI and human scores diverge?"
  - Per-candidate rows: Candidate name | AI Score | Avg Human Score | 
    Divergence (±X points) | Status (Aligned / Diverged)
  - Diverged rows highlighted in amber
  - Tooltip on divergence: "Carl scored 84, reviewers averaged 71. 
    Consider reviewing the Intelligence Report."

Design: Collaboration-focused UI — emphasizes team activity, 
approval status, and discussion. Approval stepper uses clear 
pending/complete states. Comment threads are readable and compact.
Score alignment table uses color coding (green=aligned, amber=diverged).

Tech: React + Tailwind CSS. Tab state controlled. Comparison table: 
sortable. Approval stages: state machine per candidate. Comments: 
array state with reply nesting (1 level). @mention: 
simple text match from team members list.
```

---

---

## Page 12 — Analytics Dashboard Page

### Purpose
Hiring intelligence metrics and visualizations for HR leaders and admins. Surfaces pipeline health, hiring velocity, AI performance, and skill gaps across all jobs.

### Features List
- Date range filter (Last 7 / 30 / 90 days / Custom range)
- Filter by: Job, Department, Employment Type, Location
- KPI Summary row:
  - Avg Time to Hire (days)
  - Interview Completion Rate (%)
  - Resume Acceptance Rate (%)
  - AI Recommendation Accuracy (%)
- Candidate Funnel chart (pipeline drop-off visualization)
- AI Score Distribution histogram (per job or all jobs)
- Time-to-Hire trend line chart (over selected period)
- Interview Completion Rate by Job (bar chart)
- Top Skill Gaps heatmap / ranked list
- AI vs Human Score Alignment scatter plot
- Export options: CSV, PDF report

### AI Design + Dev Prompt

```
Design and build the Analytics Dashboard page for Hiventra, an AI Talent 
Intelligence Platform.

Layout:
- Shared top nav + left sidebar
- Page header: "Analytics" + subtitle "Hiring intelligence across all your jobs"
- Filter bar: Date range selector (Last 7d | 30d | 90d | Custom) + 
  Job dropdown + Department dropdown

SECTION 1 — KPI Cards Row (4 cards):
  1. Avg Time to Hire — "18 days" — trend arrow down (good)
  2. Interview Completion Rate — "76%" — trend arrow up (good)
  3. Resume Acceptance Rate — "62%" — trend arrow neutral
  4. AI Recommendation Accuracy — "89%" — trend arrow up (good)
  Each card: metric label, large number, trend arrow + % vs last period, 
  color-coded trend (green=improvement, red=decline)

SECTION 2 — Candidate Funnel (full width):
  - Funnel or Sankey chart showing candidate volume at each pipeline stage:
    Uploaded (500) → Screened (420) → Invited (310) → 
    Started (248) → Completed (201) → Recommended (87) → Hired (24)
  - Each stage: label, count, and drop-off % from previous stage
  - Indigo color palette, lighter as funnel narrows

SECTION 3 — Two Charts Side by Side:
  Left: Time-to-Hire Trend Line Chart
    - X axis: dates (weekly or monthly)
    - Y axis: avg days to hire
    - Single line chart with data points, indigo line, subtle area fill below
  Right: Interview Completion Rate by Job
    - Horizontal bar chart
    - Y axis: job titles (last 5–8 jobs)
    - X axis: completion rate %
    - Color: gradient from red (low) to green (high)

SECTION 4 — Two Charts Side by Side:
  Left: AI Score Distribution Histogram
    - X axis: score ranges (0–10, 10–20, ..., 90–100)
    - Y axis: candidate count
    - Bar chart, indigo fill, highlights the 80–100 range differently
  Right: AI vs Human Score Scatter Plot
    - X axis: AI score
    - Y axis: Avg Human reviewer score
    - Each dot = one candidate (hover shows name)
    - Diagonal reference line (perfect alignment)
    - Dots off the line = divergence

SECTION 5 — Top Skill Gaps (full width):
  - Header: "Most Common Missing Skills"
  - Ranked list with bar:
    1. Cloud Architecture — 67% of candidates lacking
    2. System Design — 54% lacking
    3. Leadership Experience — 49% lacking
    (etc.)
  - Each row: rank number | skill name | horizontal bar | percentage

Export Row (bottom of page):
  - "Export as CSV" button | "Download PDF Report" button

Design: Data-dense but visually clean. KPI cards use large numbers 
with strong contrast. Charts use recharts library. 
Color system: indigo primary, green positive, red/amber negative. 
Responsive — charts stack on smaller screens.

Tech: React + Tailwind CSS + recharts for all charts 
(LineChart, BarChart, ScatterChart, custom funnel). 
All data from mock JSON props. Date filter updates all charts simultaneously. 
CSV export: generate from mock data with Blob download.
```

---

---

## Page 13 — Candidate Portal — Home

### Purpose
The candidate's personal dashboard after logging into Hiventra. Shows their application status, interview progress, upcoming actions, and profile management.

### Features List
- Welcome header with candidate name
- Application Status card: which job they applied for, current pipeline stage
- Progress Tracker: visual timeline (Applied → Screened → Interview → Decision)
- Interview Status card:
  - Mode (Text / Voice / Video)
  - Status: Not Started / In Progress / Completed
  - "Start Interview" CTA (if not started)
  - "Resume Interview" CTA (if in progress)
  - Completion confirmation (if done)
- Upcoming Schedule card (if interview window is set by HR)
- Document Upload: upload certifications, portfolio, cover letter
- Profile section: update contact info, LinkedIn, availability, preferred location
- Notification: any messages from the HR team (if HR enables candidate messaging)
- Carl introduction blurb ("Your interview will be conducted by Carl, our AI interviewer…")

### AI Design + Dev Prompt

```
Design and build the Candidate Portal Home page for Hiventra, an AI Talent 
Intelligence Platform. This is the personal dashboard for job candidates.

Design tone: welcoming, modern, non-intimidating. Candidates may be nervous — 
the UI should feel supportive and clear.

Layout:
- Top nav: Hiventra logo (left), candidate name + avatar (right), 
  no sidebar (candidates have a simpler nav)
- Simple top nav links: Home | My Interview | My Profile | Documents
- Centered content layout (max-width 800px for readability on all devices)

SECTION 1 — Welcome Card:
  - "Welcome back, [Name]" heading
  - Job applied for: "[Job Title] at [Company]"
  - "Your application is being reviewed by our team"

SECTION 2 — Application Progress:
  - Horizontal step tracker with 4 stages:
    ✅ Applied | ✅ Resume Reviewed | ⏳ Interview | ○ Decision
  - Current stage highlighted in indigo, completed in green, future in gray
  - Subtext below current stage: "Your interview is ready to begin."

SECTION 3 — Interview Action Card (most prominent card on page):
  - Carl avatar (indigo circle with "C")
  - "Your Interview with Carl"
  - Mode: 💬 Text Interview (or Voice / Video)
  - Estimated duration: 30 minutes
  - Status-based content:
    NOT STARTED:
      "Your interview is ready. Take it at your own pace."
      CTA: "Start Interview" (large, indigo, full-width on mobile)
    IN PROGRESS:
      "You've completed 4 of 10 questions."
      Progress bar (40% filled)
      CTA: "Continue Interview"
    COMPLETED:
      Green checkmark + "Interview Complete!"
      "Thank you! Our team will review your results and be in touch."
  - Expiry notice (if applicable): "Interview link expires in 3 days"

SECTION 4 — Upcoming Schedule (if set):
  - Calendar icon + "Interview Window:"
  - Date range: "Available May 22–26, 2026"
  - Add to Calendar: Google Calendar | Outlook buttons

SECTION 5 — Documents:
  - "Upload Supporting Documents" section
  - Accepted: Portfolio, Certifications, Cover Letter, ID
  - Upload zone (simple, smaller than HR upload page)
  - List of already-uploaded files with remove option

SECTION 6 — Profile:
  - Edit: Email, Phone, LinkedIn URL, Availability, Preferred Location
  - "Save Changes" button
  - Note: "Your resume cannot be edited after submission."

Design: Light, friendly UI — white cards on light gray background. 
Interview card is the most prominent element. Carl avatar is consistent 
with interview room. Progress tracker is clear and motivating. 
Mobile-first — all sections stack vertically.

Tech: React + Tailwind CSS. Step tracker: array of stages with status. 
Interview card: conditional rendering based on interview status state. 
File upload: simple input with file list state. Profile: controlled form.
```

---

---

## Page 14 — Candidate Portal — Interview Room

### Purpose
The candidate's live interview interface. Identical in function to Page 9 but accessed from within the Candidate Portal (rather than a standalone link).

> See **Page 9 — Interview Room Page** for full specification and prompt.
> Difference: this version includes the Candidate Portal top nav and a 
> "Return to Dashboard" link post-completion instead of a standalone redirect.

---

---

## Page 15 — AI Transparency & Audit Page

### Purpose
An admin-only control center for monitoring AI decision quality, reviewing audit logs, and ensuring responsible AI usage across the platform.

### Features List
- Audit log table: all AI decisions with timestamps, candidate, job, score, recommendation
- Filter: by job, date, recommendation value, HR user who took action
- Score override log: cases where HR overrode AI recommendation
- Fairness Monitoring panel:
  - Statistical summary: scoring distribution across candidate groups
  - Alert flags if significant anomaly is detected
  - "No demographic data is used in scoring" disclaimer
- AI Explainability panel: view full scoring rationale for any candidate on demand
- Immutable record: audit entries cannot be edited or deleted
- Export: download audit log as CSV for compliance

### AI Design + Dev Prompt

```
Design and build the AI Transparency & Audit page for Hiventra, an AI Talent 
Intelligence Platform. This is an admin-only page for responsible AI oversight.

Layout:
- Shared top nav + left sidebar
- Page header: "AI Transparency & Audit" + subtitle 
  "Monitor AI decisions, review scoring rationale, and ensure fair hiring."
- Admin access badge: "Admin Only" pill in header

SECTION 1 — Audit Log:
  - Full-width table with columns:
    Date | Candidate | Job | AI Score | Recommendation | 
    Human Action Taken | Action By | Override?
  - "Override?" column: red badge if HR overrode AI recommendation, 
    green if followed AI
  - Row click: expands inline to show full AI Justification text
  - Filter bar above table: date range | job | recommendation value | 
    override filter
  - "Export CSV" button top right of table
  - Pagination: 25 rows per page

SECTION 2 — Fairness Monitoring:
  - Section header: "Fairness Monitoring"
  - Disclaimer box (light blue tint):
    "Hiventra does not use demographic data in scoring. 
    This panel monitors proxy signals only."
  - Score Distribution panel:
    - Box plots or violin charts showing score spread per job
    - "No statistically significant anomaly detected" 
      (green banner when OK, amber banner when flagged)
  - Anomaly Alert log: timestamp | description | severity | status (Reviewed/Open)
  - "Request Bias Audit Report" button (generates PDF summary)

SECTION 3 — AI Explainability on Demand:
  - Search bar: "Look up a candidate's full scoring rationale"
  - Input candidate name or email → show:
    - Score breakdown table (all 5 resume categories + all interview domains)
    - Full AI Justification paragraph
    - Which resume sentences and interview answers contributed to which scores
    - Timestamp: "Score generated on [date] at [time]"

Design: Serious, compliance-focused UI. Table is dense but clean. 
Fairness section uses neutral language and reassuring visual states. 
Override badges are color-coded clearly. 
Immutability is visually communicated (lock icon on audit rows, 
"Immutable Record" label).

Tech: React + Tailwind CSS. Audit table: sortable + filterable + 
row expand on click. Anomaly alerts: array state. 
Explainability: mock lookup from candidate array. 
CSV export: Blob download from table data.
```

---

---

## Page 16 — Settings & Admin Page

### Purpose
Platform configuration hub for Admin users. Manages user accounts, organization settings, Carl defaults, integrations, and notification preferences.

### Features List
- Tabbed settings layout:
  - **Organization:** company name, logo, brand color, timezone
  - **Users & Roles:** invite users, assign roles, deactivate accounts
  - **Carl Defaults:** default personality, default interview mode, default duration
  - **Scoring Thresholds:** customize recommendation value boundaries (e.g., Highly Recommended = 85+)
  - **Integrations:** ATS (Greenhouse, Lever, Workday), Calendar (Google, Outlook), Email/SMTP config, SSO setup
  - **Notifications:** configure which events trigger email notifications and to whom
  - **Billing & Plan:** (placeholder) current plan, usage stats, upgrade CTA
- Changes auto-save or require explicit Save button (per section)
- User Management table: name, email, role, status (Active/Deactivated), last login, action menu

### AI Design + Dev Prompt

```
Design and build the Settings & Admin page for Hiventra, an AI Talent 
Intelligence Platform. This is the platform configuration hub, admin-only.

Layout:
- Shared top nav + left sidebar
- Page header: "Settings"
- Left sub-navigation (within page): vertical tab list:
  Organization | Users & Roles | Carl Defaults | Scoring | 
  Integrations | Notifications | Billing
- Right content area: changes per selected tab

TAB — Organization:
  - Company Name (text input)
  - Company Logo (image upload with preview circle)
  - Brand Primary Color (color picker)
  - Timezone (dropdown)
  - "Save Changes" button

TAB — Users & Roles:
  - "Invite User" button (top right) → opens modal: email input + role dropdown
  - Table: Name | Email | Role (badge) | Status | Last Login | Actions
  - Actions: Edit Role (dropdown) | Deactivate | Remove
  - Roles: Admin | HR Manager | Hiring Manager | Interviewer | Department Head
  - Status badge: Active (green) / Deactivated (gray)

TAB — Carl Defaults:
  - Default Personality (radio cards: Friendly / Professional / Strict / 
    Executive / Technical Deep Dive)
  - Default Interview Mode (segmented: Text / Voice / Video)
  - Default Duration (segmented: 15 / 30 / 45 / 60 min)
  - Default Max Questions (number input)
  - "These defaults apply to all new jobs unless overridden per job." caption
  - Save button

TAB — Scoring Thresholds:
  - 4 threshold sliders:
    Highly Recommended: starts at 85
    Recommended: starts at 70
    Review Further: starts at 50
    Not Recommended: below 50
  - Visual range bar showing color bands across 0–100
  - Thresholds enforce non-overlapping ranges
  - Save button

TAB — Integrations:
  - Integration cards in a grid (4 per row):
    Each card: service logo | name | "Connected" badge (green) or 
    "Connect" button (indigo outline)
    Services: Greenhouse | Lever | Workday | BambooHR | Google Calendar | 
    Outlook | Slack | SendGrid | Google SSO | Microsoft SSO
  - "Connected" cards show: connected email/account + "Disconnect" link

TAB — Notifications:
  - Table of notification events:
    Event | Email HR Manager | Email Hiring Manager | Email Dept. Head | 
    Slack (if connected)
    Toggle checkboxes per event per role
    Events: Resume Uploaded, Interview Completed, Report Ready, 
    Approval Needed, Candidate Hired

TAB — Billing:
  - Current Plan card: plan name, seats used / total, renewal date
  - Usage stats: interviews this month, resumes processed
  - "Upgrade Plan" CTA (indigo)
  - (Placeholder — no real billing logic)

Design: Clean settings UI — each tab is a separate content panel. 
Forms use consistent field spacing. Integration cards use actual 
service brand colors on logos. Toggle switches for notification matrix. 
Sliders for score thresholds show live color band preview.

Tech: React + Tailwind CSS. Tab navigation: state-controlled. 
User table: mock array with role dropdown inline editing. 
Threshold sliders: constrained so they don't overlap. 
Integration cards: connected/disconnected toggle state. 
Notification matrix: 2D boolean state array.
```

---

---

*Hiventra Feature Specification v1.1 — Page-by-Page with AI Design + Dev Prompts*
*© 2026 Hiventra. Confidential & Proprietary.*
