import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics Dashboard"
      subtitle="Hiring intelligence across all your jobs"
      description="Track time-to-hire, interview completion rate, AI score distributions, skill gaps, and AI vs. human score alignment. Export as CSV or PDF."
      icon={BarChart3}
    />
  );
}
