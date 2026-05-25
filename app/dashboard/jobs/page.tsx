import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/dashboard/Topbar";
import JobsTable from "@/components/dashboard/jobs/JobsTable";

export default async function JobsPage() {
  const supabase = await createClient();

  // Ensure auth context is established before RLS-dependent queries
  await supabase.auth.getUser();

  const [{ data: jobs }, { data: candidateRows }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, company, department, employment_type, location, is_remote, status, created_at, description, required_skills, experience_min, experience_max, salary_min, salary_max, currency, carl_mode, carl_personality, carl_duration, carl_max_questions")
      .order("created_at", { ascending: false }),
    supabase.from("candidates").select("job_id"),
  ]);

  const countByJob = (candidateRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.job_id] = (acc[row.job_id] ?? 0) + 1;
    return acc;
  }, {});

  const jobsWithCounts = (jobs ?? []).map((job) => ({
    ...job,
    applicant_count: countByJob[job.id] ?? 0,
  }));

  return (
    <>
      <Topbar title="Job Management" subtitle="Create, manage, and track all job postings" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <JobsTable jobs={jobsWithCounts} />
      </main>
    </>
  );
}
