export const PIPELINE_STAGES = [
  "uploaded",
  "screened",
  "invited",
  "interview_started",
  "completed",
  "recommended",
  "rejected",
  "hired",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  uploaded: "Uploaded",
  screened: "Screened",
  invited: "Invited",
  interview_started: "Interview Started",
  completed: "Completed",
  recommended: "Recommended",
  rejected: "Rejected",
  hired: "Hired",
};

export interface PipelineJob {
  id: string;
  title: string;
  department: string | null;
  status: string;
  created_at: string;
  carl_mode: string;
}

export interface PipelineCandidate {
  id: string;
  full_name: string;
  email: string;
  stage: PipelineStage;
  ai_score: number | null;
  ai_recommendation: string | null;
  ai_summary: string | null;
  resume_filename: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
  interview_mode: string | null;
  interview_status: string | null;
}
