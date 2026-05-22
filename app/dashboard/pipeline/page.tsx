import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { Users } from "lucide-react";

export default function PipelinePage() {
  return (
    <PlaceholderPage
      title="Candidate Pipeline"
      subtitle="Track candidates through your hiring stages"
      description="Kanban and list views of all candidates across pipeline stages: Uploaded → Screened → Invited → Interview → Completed → Recommended → Hired. Drag to move stages."
      icon={Users}
    />
  );
}
