import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { FilePlus } from "lucide-react";

export default function CreateJobPage() {
  return (
    <PlaceholderPage
      title="Create New Job"
      subtitle="Define a new job posting for Carl to interview against"
      description="Fill in job basics, compensation, description, requirements, and configure Carl's interview settings — personality, mode, duration, and question topics."
      icon={FilePlus}
    />
  );
}
