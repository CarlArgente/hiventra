import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/dashboard/Topbar";
import PipelineClient from "@/components/dashboard/pipeline/PipelineClient";
import { getPipelineJobs, getCandidatesForJob } from "@/app/actions/pipeline";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { job: jobId } = await searchParams;
  const jobs = await getPipelineJobs();
  const selectedJobId = jobId ?? jobs[0]?.id ?? null;
  const initialCandidates = selectedJobId ? await getCandidatesForJob(selectedJobId) : [];

  return (
    <>
      <Topbar
        title="Candidate Pipeline"
        subtitle="Track and move candidates through your hiring stages."
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        <PipelineClient
          jobs={jobs}
          initialJobId={selectedJobId}
          initialCandidates={initialCandidates}
        />
      </main>
    </>
  );
}
