import { redirect } from "next/navigation";
import { getPortalData } from "@/app/actions/portal";
import PortalHome from "@/components/portal/PortalHome";

export default async function PortalHomePage() {
  const data = await getPortalData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <span className="text-white font-extrabold text-xl">C</span>
        </div>
        <p className="text-slate-700 text-lg font-bold mb-2">
          No application found
        </p>
        <p className="text-slate-500 text-sm max-w-xs">
          We couldn&apos;t find an application linked to your account. Contact
          your recruiter if this seems wrong.
        </p>
      </div>
    );
  }

  return <PortalHome data={data} />;
}
