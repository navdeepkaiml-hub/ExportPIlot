import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { SELLER_NAV, BUYER_NAV, UPCOMING_NAV } from "@/lib/nav";
import { useRole } from "@/context/RoleContext";
import { Sparkles, Compass, RotateCcw, ChevronDown, Rocket } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function Sidebar() {
  const navigate = useNavigate();
  const { isSeller } = useRole();
  const [openUpcoming, setOpenUpcoming] = useState(false);
  const nav = isSeller ? SELLER_NAV : BUYER_NAV;

  const reset = async () => {
    toast.loading("Resetting demo workspace...", { id: "reset" });
    await api.resetDemo();
    toast.success("Demo workspace reset", { id: "reset" });
    window.location.href = "/app";
  };

  return (
    <aside className="w-[264px] shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col" data-testid="sidebar">
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
          <Compass className="text-white" strokeWidth={2} size={18} />
        </div>
        <div>
          <div className="font-display font-bold text-[15px] leading-none text-slate-900">ExportPilot</div>
          <div className="text-[10px] text-indigo-600 font-semibold tracking-wide mt-0.5">{isSeller ? "SELLER WORKSPACE" : "BUYER WORKSPACE"}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4">
        <nav className="space-y-0.5 mb-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-[18px] w-[18px] ${item.ai && !isActive ? "text-indigo-500" : ""}`} strokeWidth={1.75} size={18} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.ai && <Sparkles className={`h-3.5 w-3.5 ${isActive ? "text-indigo-300" : "text-indigo-400"}`} size={14} />}
                </>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/app/manager"
            data-testid="nav-ai-manager"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors ${
                isActive ? "bg-indigo-600 text-white" : "text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100"
              }`
            }
          >
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} size={18} />
            <span className="flex-1">{isSeller ? "AI Export Manager" : "AI Trade Assistant"}</span>
          </NavLink>
        </nav>

        <button
          onClick={() => setOpenUpcoming((o) => !o)}
          data-testid="upcoming-toggle"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
        >
          <span className="overline text-[10px] flex items-center gap-1.5"><Rocket size={11} /> Coming Soon</span>
          <ChevronDown size={14} className={`transition-transform ${openUpcoming ? "rotate-180" : ""}`} />
        </button>
        {openUpcoming && (
          <nav className="space-y-0.5 mt-1">
            {UPCOMING_NAV.map((item) => (
              <button
                key={item.slug}
                onClick={() => navigate(`/app/upcoming/${item.slug}`)}
                data-testid={`nav-upcoming-${item.slug}`}
                className="w-full group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-slate-50 transition-colors text-left"
              >
                <item.icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} size={16} />
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
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
