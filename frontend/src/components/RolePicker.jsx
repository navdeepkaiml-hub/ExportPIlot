import { motion } from "framer-motion";
import { Store, ShoppingBag, ArrowRight, Compass, Check } from "lucide-react";
import { useRole } from "@/context/RoleContext";

const SELLER_POINTS = ["Find global buyers & live RFQs", "AI pricing, quotations & negotiation", "One-click export document pack", "Protected payouts with 0.5% fee"];
const BUYER_POINTS = ["Discover verified global suppliers", "AI supplier matching on your RFQs", "Negotiate & agree deals with AI", "Payment protection on every order"];

export function RolePicker() {
  const { setRole } = useRole();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" data-testid="role-picker">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
        <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center"><Compass className="text-white" size={17} /></div>
            <span className="font-display font-bold text-slate-900">ExportPilot</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">How will you use ExportPilot?</h2>
          <p className="text-sm text-slate-500 mt-1">Choose your workspace. You can switch anytime from the top bar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {[
            { role: "seller", icon: Store, title: "I'm an Exporter", sub: "Find global buyers and grow your exports.", cta: "Start Selling Globally", points: SELLER_POINTS, accent: "bg-slate-900" },
            { role: "buyer", icon: ShoppingBag, title: "I'm a Buyer", sub: "Discover exporters and source products worldwide.", cta: "Find Global Suppliers", points: BUYER_POINTS, accent: "bg-indigo-600" },
          ].map((o) => (
            <button
              key={o.role}
              onClick={() => setRole(o.role)}
              data-testid={`pick-role-${o.role}`}
              className="text-left rounded-2xl border-2 border-slate-200 hover:border-indigo-400 p-6 transition-colors group"
            >
              <div className={`h-12 w-12 rounded-xl ${o.accent} flex items-center justify-center mb-4`}>
                <o.icon className="text-white" size={24} strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">{o.title}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">{o.sub}</p>
              <ul className="space-y-1.5 mb-5">
                {o.points.map((p) => <li key={p} className="flex items-start gap-2 text-[13px] text-slate-600"><Check size={14} className="text-emerald-500 mt-0.5 shrink-0" /> {p}</li>)}
              </ul>
              <span className={`inline-flex items-center gap-1.5 ${o.accent} text-white rounded-full px-4 py-2 text-sm font-semibold group-hover:gap-2.5 transition-all`}>
                {o.cta} <ArrowRight size={15} />
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
