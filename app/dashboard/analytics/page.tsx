import Topbar from "@/components/dashboard/Topbar";
import AnalyticsLoader from "@/components/dashboard/analytics/AnalyticsLoader";
import { getAnalyticsData } from "@/app/actions/analytics";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <>
      <Topbar
        title="Analytics"
        subtitle="Hiring intelligence across all your jobs"
      />
      <main className="flex-1 overflow-y-auto bg-brand-bg">
        <AnalyticsLoader data={data} />
      </main>
    </>
  );
}
