import Topbar from "@/components/dashboard/Topbar";
import { LucideIcon, Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  description: string;
  icon?: LucideIcon;
}

export default function PlaceholderPage({ title, subtitle, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
            {Icon ? (
              <Icon className="w-7 h-7 text-indigo-600" />
            ) : (
              <Construction className="w-7 h-7 text-indigo-600" />
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
          <div className="mt-6 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-indigo-600">Coming soon</span>
          </div>
        </div>
      </main>
    </>
  );
}
