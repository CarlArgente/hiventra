import Topbar from "@/components/dashboard/Topbar";
import TalkWithCarlClient from "@/components/dashboard/carl-chat/TalkWithCarlClient";
import { getChatSessions } from "@/app/actions/carl-chat";
import { createClient } from "@/lib/supabase/server";

export default async function TalkWithCarlPage() {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const [sessions, { data: jobRows }, { data: candidateRows }] = await Promise.all([
    getChatSessions(),
    supabase
      .from("jobs")
      .select("id, title, department, status")
      .order("title"),
    supabase
      .from("candidates")
      .select("id, full_name, email, stage, ai_score, job_id, jobs(title)")
      .order("full_name"),
  ]);

  const jobs = (jobRows ?? []) as Array<{
    id: string;
    title: string;
    department: string | null;
    status: string;
  }>;

  const candidates = ((candidateRows ?? []) as unknown as Array<{
    id: string;
    full_name: string;
    email: string;
    stage: string;
    ai_score: number | null;
    job_id: string;
    jobs: { title: string } | { title: string }[] | null;
  }>).map((c) => ({
    ...c,
    jobs: Array.isArray(c.jobs) ? (c.jobs[0] ?? null) : c.jobs,
  })) as Array<{
    id: string;
    full_name: string;
    email: string;
    stage: string;
    ai_score: number | null;
    job_id: string;
    jobs: { title: string } | null;
  }>;

  return (
    <>
      <Topbar
        title="Talk with Carl"
        subtitle="Ask Carl anything about your jobs, candidates, and pipeline."
      />
      <main className="flex-1 overflow-hidden bg-brand-bg">
        <TalkWithCarlClient
          initialSessions={sessions}
          jobs={jobs}
          candidates={candidates}
        />
      </main>
    </>
  );
}
