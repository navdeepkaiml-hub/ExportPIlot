import { Sparkles, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

export function EmptyState({ icon: Icon, title, desc, action, className = "" }) {
  return (
    <div className={`rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center flex flex-col items-center justify-center ${className}`} data-testid="empty-state">
      <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        {Icon ? <Icon className="text-indigo-500" size={26} strokeWidth={1.7} /> : <Sparkles className="text-indigo-500" size={26} />}
      </div>
      <div className="font-display font-semibold text-slate-900 text-lg">{title}</div>
      {desc && <p className="text-sm text-slate-500 mt-1.5 max-w-sm">{desc}</p>}
      {action && (
        <button onClick={action.onClick} data-testid="empty-state-action" className="mt-5 inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors">
          {action.label} <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}

export function AILoader({ label = "Working…" }) {
  return (
    <div className="flex items-center gap-2.5 text-indigo-600" data-testid="ai-loader">
      <span className="relative flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
        <Sparkles size={16} className="relative" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function VerifiedBadge({ verified = true }) {
  if (!verified) return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">Unverified</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5" data-testid="verified-badge">
      <ShieldCheck size={11} /> Verified
    </span>
  );
}

export function MatchScore({ score, label, size = "md" }) {
  const color = score >= 90 ? "text-emerald-600 bg-emerald-50 border-emerald-200" : score >= 82 ? "text-indigo-600 bg-indigo-50 border-indigo-200" : "text-amber-600 bg-amber-50 border-amber-200";
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${color} ${size === "lg" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}`} data-testid="match-score">
      <Sparkles size={size === "lg" ? 14 : 12} /> {score}% {label && <span className="font-medium opacity-80">· {label}</span>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "slate", sub }) {
  const tones = {
    slate: "bg-slate-900 text-white", indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600", sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 card-hover" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between">
        <span className="overline text-[10px]">{label}</span>
        {Icon && <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tones[tone]}`}><Icon size={15} strokeWidth={1.9} /></div>}
      </div>
      <div className="font-display text-2xl font-bold text-slate-900 mt-3">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
