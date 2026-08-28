import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { AILoader } from "@/components/Widgets";
import { Disclaimer } from "@/components/Common";
import { ShieldCheck, Sparkles, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function BuyerVerification({ buyerId }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const run = async () => {
    setLoading(true);
    try { setData(await api.verifyBuyer(buyerId)); }
    catch { toast.error("Could not run verification"); } finally { setLoading(false); }
  };

  const bandColor = data?.band === "Strong" ? "text-emerald-600" : data?.band === "Moderate" ? "text-amber-600" : "text-rose-600";

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-6 ai-glow mb-4" data-testid="buyer-verification">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><ShieldCheck className="text-white" size={16} /></div>
          <div><div className="overline text-indigo-600">AI Buyer Verification</div><div className="font-display font-bold text-slate-900">Credibility snapshot</div></div>
        </div>
        {!data && !loading && <button onClick={run} data-testid="run-verification-btn" className="inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors"><Sparkles size={13} /> Run Verification</button>}
      </div>

      {loading && <div className="py-6"><AILoader label="Analyzing buyer credibility signals…" /></div>}

      {data && !loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`font-display text-4xl font-bold ${bandColor}`}>{data.score}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">/ 100</div>
            </div>
            <div>
              <div className={`font-display font-bold ${bandColor}`}>{data.band} credibility</div>
              <p className="text-sm text-slate-600 mt-1 max-w-md">{data.summary}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div><div className="overline mb-2 text-emerald-600">Positive signals</div><ul className="space-y-1.5">{data.signals.map((s) => <li key={s} className="flex items-start gap-2 text-sm text-slate-700"><Check size={14} className="text-emerald-500 mt-0.5" /> {s}</li>)}</ul></div>
            <div><div className="overline mb-2 text-amber-600">Watch-outs</div><ul className="space-y-1.5">{data.watchouts.map((s) => <li key={s} className="flex items-start gap-2 text-sm text-slate-700"><AlertTriangle size={14} className="text-amber-500 mt-0.5" /> {s}</li>)}</ul></div>
          </div>
          <Disclaimer text={data.disclaimer} className="mt-4" />
        </motion.div>
      )}
    </div>
  );
}
