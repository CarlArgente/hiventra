import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/dashboard/Topbar";
import ResumeUploadClient from "@/components/dashboard/upload/ResumeUploadClient";

export default async function UploadPage() {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: activeJobs } = await supabase
    .from("jobs")
    .select("id, title, department, required_skills, description")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <>
      <Topbar
        title="Upload Resumes"
        subtitle="Upload up to 50 resumes at once. Hiventra will parse, score, and create candidate profiles automatically."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <ResumeUploadClient activeJobs={activeJobs ?? []} />
      </main>
    </>
  );
}
