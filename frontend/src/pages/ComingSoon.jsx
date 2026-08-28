import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UPCOMING_NAV, ROADMAP } from "@/lib/nav";
import { ArrowLeft, Rocket, Check } from "lucide-react";
import { PageShell } from "@/components/Common";

export default function ComingSoon() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const feature = UPCOMING_NAV.find((f) => f.slug === slug) || UPCOMING_NAV[0];
  const Icon = feature.icon;

  const statusStyle = {
    Current: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Upcoming: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Future: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <PageShell>
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        data-testid="coming-soon-back"
      >
        <ArrowLeft size={16} /> Back to Command Center
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
        data-testid="coming-soon-panel"
      >
        <div className="p-10 md:p-14 relative">
          <div className="absolute top-8 right-8">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-indigo-600 text-white">
              <Rocket size={12} /> Coming Soon
            </span>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center mb-6">
            <Icon className="text-white" size={30} strokeWidth={1.6} />
          </div>
          <div className="overline mb-3">ExportPilot Roadmap · Expansion</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 max-w-2xl">{feature.title}</h1>
          <p className="text-lg text-slate-600 mt-4 font-medium max-w-2xl">{feature.desc}</p>
          <p className="text-slate-500 mt-3 max-w-2xl leading-relaxed border-l-2 border-indigo-200 pl-4 italic">
            {feature.long}
          </p>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 p-10 md:p-14">
          <div className="overline mb-6">ExportPilot Roadmap</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {ROADMAP.map((p, i) => (
              <div key={p.phase} className="relative rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold text-slate-400 mb-1">{p.phase}</div>
                <div className="font-display font-semibold text-slate-900 text-[15px] leading-snug mb-3">{p.title}</div>
                <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${statusStyle[p.status]}`}>
                  {p.status === "Current" && <Check size={10} />}{p.status}
                </span>
                {i < ROADMAP.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 h-px w-4 bg-slate-200" />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/app")}
            className="mt-8 inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"
            data-testid="coming-soon-back-btn"
          >
            <ArrowLeft size={15} /> Back to Command Center
          </button>
        </div>
      </motion.div>
    </PageShell>
  );
}
