import { notFound } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import CandidateProfile from "@/components/dashboard/candidates/CandidateProfile";
import { getCandidateProfile, getCandidateNotes } from "@/app/actions/candidates";
import type { CandidateProfileData, NoteItem } from "@/components/dashboard/candidates/CandidateProfile";

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rawCandidate, rawNotes] = await Promise.all([
    getCandidateProfile(id),
    getCandidateNotes(id),
  ]);

  if (!rawCandidate) notFound();

  const candidate = rawCandidate as unknown as CandidateProfileData;
  const notes = rawNotes as unknown as NoteItem[];

  return (
    <>
      <Topbar
        title={candidate.full_name}
        subtitle={candidate.jobs?.title ?? "Candidate Profile"}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        <CandidateProfile candidate={candidate} notes={notes} />
      </main>
    </>
  );
}