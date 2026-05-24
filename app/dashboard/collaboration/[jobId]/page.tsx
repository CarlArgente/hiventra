import { notFound } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import TeamCollaboration from "@/components/dashboard/collaboration/TeamCollaboration";
import { getCollaborationData } from "@/app/actions/collaboration";

export default async function CollaborationJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const { job, candidates } = await getCollaborationData(jobId);

  if (!job) notFound();

  return (
    <>
      <Topbar
        title="Team Collaboration"
        subtitle={`${job.title}${job.department ? ` · ${job.department}` : ""}`}
      />
      <main className="flex-1 overflow-y-auto bg-brand-bg">
        <TeamCollaboration job={job} candidates={candidates} />
      </main>
    </>
  );
}
