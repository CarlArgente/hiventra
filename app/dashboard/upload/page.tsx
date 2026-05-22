import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { Upload } from "lucide-react";

export default function UploadPage() {
  return (
    <PlaceholderPage
      title="Resume Upload"
      subtitle="Upload candidate resumes for AI screening"
      description="Drag and drop up to 50 PDF or DOCX resumes. Hiventra will parse, score, and create candidate profiles automatically using Carl AI."
      icon={Upload}
    />
  );
}
