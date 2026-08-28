import { Outlet, Link } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { AIExportManager } from "@/components/AIExportManager";
import { Badge } from "@/components/ui/badge";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full font-semibold text-[11px]" data-testid="demo-badge">
              Demo Workspace
            </Badge>
            <span className="text-xs text-slate-400 hidden sm:inline">Nimbus Agro Exports · India</span>
          </div>
          <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
            View Landing Page →
          </Link>
        </header>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <AIExportManager />
    </div>
  );
}
