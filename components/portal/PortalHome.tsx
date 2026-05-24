"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Circle,
  Bot,
  Calendar,
  FileText,
  ChevronRight,
  MessageSquare,
  Mic,
  Video,
  Upload,
  Trash2,
  CheckCheck,
  Link2,
  Phone,
  MapPin,
  Clock3,
  Save,
  User,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Star,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  saveDocument,
  deleteDocument,
  updateCandidateProfile,
} from "@/app/actions/portal";
import type { PortalData, PortalDocument } from "@/app/actions/portal";

const MODE_CONFIG = {
  text: { label: "Text Interview", icon: MessageSquare },
  voice: { label: "Voice Interview", icon: Mic },
  video: { label: "Video Interview", icon: Video },
};

const DOC_TYPES = [
  { value: "portfolio", label: "Portfolio" },
  { value: "certification", label: "Certification" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "id", label: "ID Document" },
  { value: "other", label: "Other" },
];

const DECISION_STAGES = ["recommended", "hired", "rejected"];

function getDecisionLabel(stage: string): string {
  if (stage === "hired") return "Hired!";
  if (stage === "recommended") return "Recommended";
  if (stage === "rejected") return "Not Selected";
  return "Decision";
}

function getStepStatus(
  stage: string,
  stepIndex: number
): "done" | "current" | "upcoming" | "rejected" {
  const stageToStep: Record<string, number> = {
    uploaded: 0,
    screened: 1,
    invited: 1,
    interview_started: 2,
    completed: 2,
    recommended: 3,
    hired: 3,
    rejected: 3,
  };
  const current = stageToStep[stage] ?? 0;
  // Decision stages mark ALL steps as done (including step 3)
  if (DECISION_STAGES.includes(stage)) {
    if (stepIndex < 3) return "done";
    if (stepIndex === 3) return stage === "rejected" ? "rejected" : "done";
  }
  if (stepIndex < current) return "done";
  if (stepIndex === current) return "current";
  return "upcoming";
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function welcomeSubtext(stage: string): string {
  if (stage === "recommended" || stage === "hired")
    return "Great news — our team has reviewed your application!";
  if (stage === "rejected")
    return "Thank you for your interest in this position.";
  return "Your application is being reviewed by our team.";
}

export default function PortalHome({ data }: { data: PortalData }) {
  const { candidate, job, interview, documents: initialDocs } = data;
  const router = useRouter();

  const [docs, setDocs] = useState<PortalDocument[]>(initialDocs);
  useEffect(() => {
    setDocs(initialDocs);
  }, [initialDocs]);

  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("portfolio");
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    full_name: candidate.full_name,
    phone: candidate.phone ?? "",
    linkedin_url: candidate.linkedin_url ?? "",
    availability: candidate.availability ?? "",
    preferred_location: candidate.preferred_location ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${candidate.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("candidate-documents")
        .upload(path, file);
      if (upErr) throw new Error(upErr.message);

      const result = await saveDocument({
        candidate_id: candidate.id,
        filename: file.name,
        storage_path: path,
        doc_type: docType,
        file_size: file.size,
      });
      if (result.error) throw new Error(result.error);
      router.refresh();
    } catch (err: any) {
      alert(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(doc: PortalDocument) {
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    const result = await deleteDocument(doc.id, doc.storage_path);
    if (result.error) return alert(result.error);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const result = await updateCandidateProfile({
      candidateId: candidate.id,
      ...profile,
    });
    setSavingProfile(false);
    setProfileMsg(
      result.error ? `Error: ${result.error}` : "Saved successfully"
    );
    setTimeout(() => setProfileMsg(null), 3000);
  }

  const modeConf =
    MODE_CONFIG[interview?.mode as keyof typeof MODE_CONFIG] ?? MODE_CONFIG.text;
  const ModeIcon = modeConf.icon;

  const answeredCount = interview?.responses?.length ?? 0;
  const totalCount =
    interview?.questions?.length ?? job.carl_max_questions ?? 10;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  const expiryDays = daysUntil(interview?.expires_at ?? null);

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Welcome back, {candidate.full_name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {job.title} at {job.company}
        </p>
        <p className="text-slate-400 text-xs mt-2">
          {welcomeSubtext(candidate.stage)}
        </p>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-5">Application Progress</h2>
        <div className="flex items-center">
          {["Applied", "Resume Reviewed", "Interview", getDecisionLabel(candidate.stage)].map((label, i) => {
            const status = getStepStatus(candidate.stage, i);
            const isDone = status === "done";
            const isCurrent = status === "current";
            const isRejected = status === "rejected";
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isRejected
                        ? "bg-red-500"
                        : isDone
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-indigo-600"
                        : "bg-slate-200"
                    }`}
                  >
                    {isRejected ? (
                      <XCircle className="w-4 h-4 text-white" />
                    ) : isDone ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium whitespace-nowrap ${
                      isRejected
                        ? "text-red-500"
                        : isCurrent
                        ? "text-indigo-600"
                        : isDone
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 mb-5 ${
                      isDone || isRejected ? "bg-emerald-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Banner */}
      {DECISION_STAGES.includes(candidate.stage) && (
        <div
          className={`rounded-xl border shadow-sm p-6 ${
            candidate.stage === "hired"
              ? "bg-emerald-50 border-emerald-200"
              : candidate.stage === "recommended"
              ? "bg-indigo-50 border-indigo-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                candidate.stage === "hired"
                  ? "bg-emerald-500"
                  : candidate.stage === "recommended"
                  ? "bg-indigo-600"
                  : "bg-slate-400"
              }`}
            >
              {candidate.stage === "hired" ? (
                <Star className="w-6 h-6 text-white" />
              ) : candidate.stage === "recommended" ? (
                <ThumbsUp className="w-6 h-6 text-white" />
              ) : (
                <ThumbsDown className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p
                className={`font-extrabold text-lg ${
                  candidate.stage === "hired"
                    ? "text-emerald-800"
                    : candidate.stage === "recommended"
                    ? "text-indigo-800"
                    : "text-slate-700"
                }`}
              >
                {candidate.stage === "hired"
                  ? "Congratulations — You're Hired!"
                  : candidate.stage === "recommended"
                  ? "You've Been Recommended!"
                  : "Application Decision Made"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  candidate.stage === "hired"
                    ? "text-emerald-700"
                    : candidate.stage === "recommended"
                    ? "text-indigo-600"
                    : "text-slate-500"
                }`}
              >
                {candidate.stage === "hired"
                  ? "Welcome to the team! Your recruiter will be in touch with next steps."
                  : candidate.stage === "recommended"
                  ? "Our team has reviewed your interview and recommends you for the role. You'll hear from us soon."
                  : "After careful review, we've decided to move forward with other candidates. Thank you for your time and interest."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Areas for Development — shown to rejected candidates with interview analysis */}
      {candidate.stage === "rejected" && interview?.ai_weaknesses && interview.ai_weaknesses.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm p-6">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Areas for Development</p>
          <p className="text-sm text-amber-600 mb-4">Based on your interview, here are some areas to focus on for your next opportunity:</p>
          <ul className="space-y-3">
            {interview.ai_weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <span className="text-sm text-slate-700 leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interview Card */}
      {!(candidate.stage === "rejected" && interview?.ai_weaknesses && interview.ai_weaknesses.length > 0) && (
      <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Your Interview with Carl</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <ModeIcon className="w-3 h-3" />
                {modeConf.label} · ~{job.carl_duration} min ·{" "}
                {job.carl_max_questions} questions
              </p>
            </div>
          </div>

          {!interview ||
          interview.status === "pending" ||
          interview.status === "invited" ? (
            <>
              <p className="text-sm text-slate-600 mb-5">
                Your interview is ready. Take it at your own pace — Carl will
                guide you through each question.
              </p>
              <a
                href="/portal/interview"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm"
              >
                Start Interview with Carl <ChevronRight className="w-4 h-4" />
              </a>
            </>
          ) : interview.status === "started" ? (
            <>
              <p className="text-sm text-slate-600 mb-2">
                You&apos;ve answered {answeredCount} of {totalCount} questions.
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-5">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <a
                href="/portal/interview"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm"
              >
                Continue Interview <ChevronRight className="w-4 h-4" />
              </a>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  Interview Complete!
                </p>
                <p className="text-xs text-slate-500">
                  Thank you! Our team will review your results and be in touch.
                </p>
              </div>
            </div>
          )}

          {expiryDays !== null &&
            expiryDays > 0 &&
            interview?.status !== "completed" && (
              <p className="text-xs text-slate-400 mt-3">
                Interview link expires in {expiryDays} day
                {expiryDays !== 1 ? "s" : ""}
              </p>
            )}
        </div>
      </div>
      )}

      {!DECISION_STAGES.includes(candidate.stage) && <>
      {/* Schedule & Documents quick view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Interview Window
            </h3>
          </div>
          {interview?.window_start && interview?.window_end ? (
            <>
              <p className="text-sm text-slate-600">
                {new Date(interview.window_start).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                {" – "}
                {new Date(interview.window_end).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Complete your interview within this window.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No window set — complete anytime.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900 text-sm">Documents</h3>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-slate-500">No documents uploaded yet.</p>
          ) : (
            <p className="text-sm text-slate-600">
              {docs.length} file{docs.length !== 1 ? "s" : ""} uploaded
            </p>
          )}
          <button
            onClick={() =>
              document
                .getElementById("doc-upload-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            + Upload portfolio or certifications
          </button>
        </div>
      </div>

      {/* Documents Upload */}
      <div
        id="doc-upload-section"
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-4 h-4 text-indigo-500" />
          <h2 className="font-bold text-slate-900">Upload Supporting Documents</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          PDF, DOC, DOCX, JPG, PNG — max 10 MB
        </p>
        <div className="flex items-center gap-3 mb-5">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              uploading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Choose File
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx"
              onChange={handleUpload}
            />
          </label>
        </div>

        {docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-slate-400">
                    {DOC_TYPES.find((t) => t.value === doc.doc_type)?.label ??
                      doc.doc_type}
                    {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ""}
                  </p>
                </div>
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex-shrink-0"
                  >
                    View
                  </a>
                )}
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-indigo-500" />
          <h2 className="font-bold text-slate-900">Your Profile</h2>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={candidate.email}
                readOnly
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-400 bg-slate-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+1 555 000 0000"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> LinkedIn URL
              </label>
              <input
                type="url"
                value={profile.linkedin_url}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, linkedin_url: e.target.value }))
                }
                placeholder="https://linkedin.com/in/..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Clock3 className="w-3 h-3" /> Availability
              </label>
              <input
                type="text"
                value={profile.availability}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, availability: e.target.value }))
                }
                placeholder="e.g. Immediate, 2 weeks notice"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Preferred Location
              </label>
              <input
                type="text"
                value={profile.preferred_location}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    preferred_location: e.target.value,
                  }))
                }
                placeholder="e.g. Remote, New York, London"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Your resume cannot be edited after submission.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
            {profileMsg && (
              <span
                className={`text-xs font-medium ${
                  profileMsg.startsWith("Error")
                    ? "text-red-500"
                    : "text-emerald-600"
                }`}
              >
                {profileMsg}
              </span>
            )}
          </div>
        </form>
      </div>
      </>}
    </div>
  );
}
