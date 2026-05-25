import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { FileText } from "lucide-react";

export default function ReportPage() {
  return (
    <PlaceholderPage
      title="Candidate Intelligence Report"
      subtitle="Full AI-generated post-interview report"
      description="Review Carl's assessment: overall score, recommendation, strengths, weaknesses, skill breakdown, and interview highlights. Download as PDF or share with your team."
      icon={FileText}
    />
  );
}