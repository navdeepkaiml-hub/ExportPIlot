import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtUSD } from "@/lib/format";
import { PageShell, PageHeader, Disclaimer } from "@/components/Common";
import { Handshake, Sparkles, Loader2, Check, Pencil, Send, Gauge, TrendingDown, Flame } from "lucide-react";
import { toast } from "sonner";

const SAMPLE = "Your price is 8% higher than another supplier. Can you offer a better price?";

export default function Negotiation() {
  const [deals, setDeals] = useState([]);
  const [dealId, setDealId] = useState("");
  const [buyerMsg, setBuyerMsg] = useState(SAMPLE);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [strategy, setStrategy] = useState(null);
  const [response, setResponse] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    api.listDeals().then((ds) => {
      const open = ds.filter((d) => !["Won", "Lost"].includes(d.stage));
      setDeals(open);
      const neg = open.find((d) => d.stage === "Negotiation") || open[0];
      if (neg) setDealId(neg.id);
    });
  }, []);

  const analyze = async () => {
    if (!dealId) return;
    setAnalyzing(true); setAnalysis(null); setStrategy(null); setResponse(""); setApproved(false);
    try {
      const res = await api.negotiationAnalyze({ deal_id: dealId, buyer_message: buyerMsg });
      setAnalysis(res);
    } catch { toast.error("Analysis failed"); } finally { setAnalyzing(false); }
  };

  const generate = async (strat) => {
    setStrategy(strat); setGenLoading(true); setResponse(""); setApproved(false);
    try {
      const res = await api.negotiationRespond({ deal_id: dealId, buyer_message: buyerMsg, strategy: strat.title, current_margin: analysis.current_margin });
      setResponse(res.response);
    } catch { toast.error("Could not generate response"); } finally { setGenLoading(false); }
  };

  const approve = async () => {
    try {
      await api.negotiationApprove({ deal_id: dealId, text: response });
      setApproved(true);
      toast.success("Response approved & sent — added to conversation");
    } catch { toast.error("Could not send"); }
  };

  const pressureColor = { High: "text-rose-600 bg-rose-50 border-rose-200", Medium: "text-amber-600 bg-amber-50 border-amber-200", Low: "text-emerald-600 bg-emerald-50 border-emerald-200" };

  return (
    <PageShell>
      <PageHeader overline="Core · Working now" title="AI Negotiation Copilot" icon={Handshake} ai subtitle="Analyse buyer objections and craft margin-safe responses." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <label className="overline block mb-2">Deal</label>
            <select value={dealId} onChange={(e) => setDealId(e.target.value)} data-testid="negotiation-deal-select" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 mb-4">
              {deals.map((d) => <option key={d.id} value={d.id}>{d.buyer_name} — {d.product} ({fmtUSD(d.deal_value, true)})</option>)}
            </select>
            <label className="overline block mb-2">Buyer message</label>
            <textarea value={buyerMsg} onChange={(e) => setBuyerMsg(e.target.value)} rows={4} data-testid="buyer-message-input" className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            <button onClick={analyze} disabled={analyzing} data-testid="analyze-objection-btn" className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-70">
              {analyzing ? <><Loader2 className="animate-spin" size={16} /> Analysing…</> : <><Sparkles size={16} /> Analyze Objection</>}
            </button>
          </div>

          {analysis && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="negotiation-analysis">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center"><div className="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1"><Flame size={11} /> Objection</div><div className="font-display font-bold text-slate-900 mt-1">{analysis.objection_type}</div></div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center"><div className="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1"><Gauge size={11} /> Margin</div><div className="font-display font-bold text-slate-900 mt-1">{analysis.current_margin}%</div></div>
                <div className={`rounded-xl border p-3 text-center ${pressureColor[analysis.buyer_pressure] || "bg-slate-50 border-slate-100"}`}><div className="text-[9px] uppercase font-bold opacity-70">Pressure</div><div className="font-display font-bold mt-1">{analysis.buyer_pressure}</div></div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700"><TrendingDown size={15} /> Recommended max discount: <b>{analysis.recommended_max_discount_pct}%</b></div>
              <p className="text-[13px] text-slate-600 mt-3 flex items-start gap-2"><Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" /> {analysis.insight}</p>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          {analysis && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="negotiation-strategies">
              <div className="overline mb-4">Recommended strategies</div>
              <div className="space-y-3">
                {analysis.strategies.map((s, i) => (
                  <button key={i} onClick={() => generate(s)} data-testid={`strategy-${i}`} className={`w-full text-left rounded-xl border p-4 transition-colors ${strategy?.title === s.title ? "border-indigo-400 bg-indigo-50/40" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold text-slate-900 text-sm">Strategy {i + 1}: {s.title}</span>
                      {strategy?.title === s.title ? <Check size={15} className="text-indigo-600" /> : <Sparkles size={14} className="text-slate-300" />}
                    </div>
                    <p className="text-[13px] text-slate-500 mt-1">{s.detail}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(genLoading || response) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="negotiation-response">
              <div className="overline mb-3">Generated response</div>
              {genLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-4 rounded shimmer" />)}</div>
              ) : (
                <>
                  <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={9} data-testid="response-textarea" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-indigo-400" />
                  <Disclaimer text="AI-generated draft — verify before sending." className="mt-3" />
                  {approved ? (
                    <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600 text-sm font-semibold bg-emerald-50 border border-emerald-200 rounded-xl py-3"><Check size={16} /> Approved & added to conversation</div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => toast.info("Edit the text above, then approve")} data-testid="edit-response-btn" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold hover:border-slate-300 transition-colors"><Pencil size={14} /> Edit</button>
                      <button onClick={approve} data-testid="approve-send-btn" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"><Send size={14} /> Approve & Send</button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
