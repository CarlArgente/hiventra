import Topbar from "@/components/dashboard/Topbar";
import SettingsClient from "@/components/dashboard/settings/SettingsClient";
import { getSettingsData } from "@/app/actions/settings";

export default async function SettingsPage() {
  const { carlDefaults, thresholds, users } = await getSettingsData();

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Platform configuration hub — Admin only"
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SettingsClient
          carlDefaults={carlDefaults}
          thresholds={thresholds}
          users={users}
        />
      </div>
    </>
  );
}
