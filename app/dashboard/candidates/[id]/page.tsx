import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { UserCircle } from "lucide-react";

export default function CandidateProfilePage() {
  return (
    <PlaceholderPage
      title="Candidate Profile"
      subtitle="Detailed candidate view with AI scoring and interview status"
      description="View AI match score breakdown, resume summary, strengths and weaknesses, interview status, and team notes. Take actions: invite, move stage, reject, or hire."
      icon={UserCircle}
    />
  );
}
