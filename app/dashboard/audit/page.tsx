import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { ShieldCheck } from "lucide-react";

export default function AuditPage() {
  return (
    <PlaceholderPage
      title="AI Transparency & Audit"
      subtitle="Admin-only — Responsible AI oversight"
      description="Review all AI decisions, score override logs, fairness monitoring data, and on-demand AI explainability for any candidate. Immutable audit trail. Export for compliance."
      icon={ShieldCheck}
    />
  );
}
