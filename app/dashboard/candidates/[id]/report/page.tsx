import { notFound } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import IntelligenceReport from "@/components/dashboard/candidates/IntelligenceReport";
import { getCandidateReport } from "@/app/actions/report";
import { getCandidateNotes } from "@/app/actions/candidates";
import type { NoteItem } from "@/components/dashboard/candidates/CandidateProfile";

export default async function IntelligenceReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [candidate, rawNotes] = await Promise.all([
    getCandidateReport(id),
    getCandidateNotes(id),
  ]);

  if (!candidate) notFound();

  const notes = rawNotes as unknown as NoteItem[];

  return (
    <>
      <Topbar
        title="Intelligence Report"
        subtitle={`${candidate.full_name} · ${candidate.jobs?.title ?? ""}`}
      />
      <main className="flex-1 overflow-y-auto bg-brand-bg">
        <IntelligenceReport candidate={candidate} notes={notes} />
      </main>
    </>
  );
}
