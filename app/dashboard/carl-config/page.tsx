import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { Bot } from "lucide-react";

export default function CarlConfigPage() {
  return (
    <PlaceholderPage
      title="Carl Interview Config"
      subtitle="Configure how Carl conducts interviews"
      description="Set interview mode (Text / Voice / Video), Carl's personality, duration, max questions, and topics to include or exclude. Preview Carl's sample questions live."
      icon={Bot}
    />
  );
}
