import { NavLink, useNavigate } from "react-router-dom";
import { CORE_NAV, UPCOMING_NAV } from "@/lib/nav";
import { Sparkles, Compass, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function Sidebar() {
  const navigate = useNavigate();

  const reset = async () => {
    toast.loading("Resetting demo workspace...", { id: "reset" });
    await api.resetDemo();
    toast.success("Demo workspace reset", { id: "reset" });
    window.location.href = "/app";
  };

  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
      <div className="px-6 h-16 flex items-center gap-2.5 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
          <Compass className="h-4.5 w-4.5 text-white" strokeWidth={2} size={18} />
        </div>
        <div>
          <div className="font-display font-bold text-[15px] leading-none text-slate-900">ExportPilot</div>
          <div className="text-[10px] text-indigo-600 font-semibold tracking-wide mt-0.5">AI EXPORT DEPARTMENT</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-5">
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="overline text-[10px]">Core — Working Now</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
        <nav className="space-y-0.5 mb-6">
          {CORE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-4.5 w-4.5 ${item.ai && !isActive ? "text-indigo-500" : ""}`} strokeWidth={1.75} size={18} />
                  <span className="flex-1">{item.label}</span>
                  {item.ai && <Sparkles className={`h-3.5 w-3.5 ${isActive ? "text-indigo-300" : "text-indigo-400"}`} size={14} />}
                </>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/app/manager"
            data-testid="nav-ai-export-manager"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-indigo-600 text-white" : "text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100"
              }`
            }
          >
            <Sparkles className="h-4.5 w-4.5" strokeWidth={1.75} size={18} />
            <span className="flex-1">AI Export Manager</span>
          </NavLink>
        </nav>

        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="overline text-[10px]">Expansion — Upcoming</span>
        </div>
        <nav className="space-y-0.5">
          {UPCOMING_NAV.map((item) => (
            <button
              key={item.slug}
              onClick={() => navigate(`/app/upcoming/${item.slug}`)}
              data-testid={`nav-upcoming-${item.slug}`}
              className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors text-left"
            >
              <item.icon className="h-4.5 w-4.5 text-slate-400" strokeWidth={1.75} size={18} />
              <span className="flex-1 truncate">{item.label}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Soon
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={reset}
          data-testid="reset-demo-btn"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" size={14} /> Reset Demo Workspace
        </button>
      </div>
    </aside>
  );
}
