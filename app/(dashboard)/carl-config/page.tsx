import Topbar from "@/components/dashboard/Topbar";
import CarlConfigClient from "@/components/dashboard/carl-config/CarlConfigClient";
import { getJobsForCarlConfig } from "@/app/actions/jobs";

export default async function CarlConfigPage() {
  const jobs = await getJobsForCarlConfig();

  return (
    <>
      <Topbar
        title="Configure Carl Interview"
        subtitle="Set how Carl conducts AI-powered interviews for each job"
      />
      <CarlConfigClient jobs={jobs} />
    </>
  );
}
