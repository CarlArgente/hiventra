import { redirect } from "next/navigation";
import Topbar from "@/components/dashboard/Topbar";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { getDashboardData } from "@/app/actions/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/signin");

  return (
    <>
      <Topbar title="HR Dashboard" subtitle={`Welcome back, ${data.userName}`} />
      <DashboardHome data={data} />
    </>
  );
}
