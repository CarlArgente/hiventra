import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings & Admin"
      subtitle="Platform configuration hub"
      description="Manage organization details, users and roles, Carl defaults, scoring thresholds, integrations (ATS, Calendar, Slack), notification preferences, and billing."
      icon={Settings}
    />
  );
}
