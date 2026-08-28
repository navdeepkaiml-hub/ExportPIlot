import { Outlet, Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AIExportManager } from "@/components/AIExportManager";
import { RolePicker } from "@/components/RolePicker";
import { useRole } from "@/context/RoleContext";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Store, ShoppingBag, ChevronsUpDown, Check } from "lucide-react";

export default function Layout() {
  const { role, isSeller, setRole } = useRole();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const r = params.get("role");
    if (r && (r === "seller" || r === "buyer") && r !== role) {
      setRole(r);
      const next = new URLSearchParams(params);
      next.delete("role");
      setParams(next, { replace: true });
    }
  }, [params, role, setRole, setParams]);

  if (!role) return <RolePicker />;

  const switchRole = (r) => { setRole(r); window.location.href = `/app?role=${r}`; };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full font-semibold text-[11px]" data-testid="demo-badge">Demo Workspace</Badge>
            <span className="text-xs text-slate-400 hidden sm:inline">{isSeller ? "Nimbus Agro Exports · India" : "Global Buyer · Sourcing"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:inline">Landing →</Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="role-switcher" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-2 pr-3 py-1.5 hover:border-slate-300 transition-colors">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isSeller ? "bg-slate-900" : "bg-indigo-600"}`}>
                    {isSeller ? <Store size={13} className="text-white" /> : <ShoppingBag size={13} className="text-white" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{isSeller ? "Exporter" : "Buyer"}</span>
                  <ChevronsUpDown size={13} className="text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-slate-400">Switch workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => switchRole("seller")} data-testid="switch-seller" className="gap-2">
                  <Store size={15} /> Exporter {isSeller && <Check size={14} className="ml-auto text-emerald-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchRole("buyer")} data-testid="switch-buyer" className="gap-2">
                  <ShoppingBag size={15} /> Buyer {!isSeller && <Check size={14} className="ml-auto text-emerald-500" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 min-w-0"><Outlet /></main>
      </div>
      <AIExportManager />
    </div>
  );
}
