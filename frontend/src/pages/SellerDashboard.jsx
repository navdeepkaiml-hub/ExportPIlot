import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtUSD, fmtMoney } from "@/lib/format";
import { PageShell } from "@/components/Common";
import { StatCard } from "@/components/Widgets";
import { toast } from "sonner";
import {
  Package, Inbox, Handshake, TrendingUp, ShieldCheck, Wallet, Sparkles, ArrowRight, Sun, Trophy, Target,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-lg px-3 py-2 shadow-md"><div className="text-xs text-slate-400">{payload[0].payload.stage}</div><div className="font-display font-semibold text-slate-900">{fmtUSD(payload[0].value, true)}</div></div>;
}

export default function SellerDashboard() {
  const [k, setK] = useState(null);
  const [dash, setDash] = useState(null);
  const [win, setWin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.dashboardSeller().then((d) => setK(d.kpis)).catch(() => {});
    api.dashboard().then(setDash).catch(() => {});
    api.winrate().then(setWin).catch(() => {});
  }, []);

  const handleAction = (card) => {
    if (card.action === "Generate Follow-up") navigate("/app/followups");
    else if (card.action === "Open Negotiation") navigate("/app/negotiations");
    else navigate(`/app/deals/${card.deal_id}`);
  };

  return (
    <PageShell>
      <div className="flex items-center gap-2 text-slate-400 mb-1"><Sun size={16} /> <span className="text-sm font-medium">Good morning, Nimbus Agro</span> 👋</div>
      <h1 className="font-display text-3xl font-bold text-slate-900 mb-8">Your AI Export Department is ready.</h1>

      {k && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="Active Products" value={k.active_products} icon={Package} tone="indigo" />
          <StatCard label="Buyer Requests" value={k.buyer_requests} icon={Inbox} tone="sky" />
          <StatCard label="Negotiations" value={k.active_negotiations} icon={Handshake} tone="amber" />
          <StatCard label="Pipeline" value={fmtUSD(k.pipeline_value, true)} icon={TrendingUp} tone="slate" />
          <StatCard label="Protected" value={k.protected_transactions} icon={ShieldCheck} tone="emerald" />
          <StatCard label="Pending Payout" value={fmtUSD(k.pending_payout, true)} icon={Wallet} tone="rose" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl border border-indigo-200 bg-white p-6 ai-glow" data-testid="ai-action-center">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Sparkles className="text-white" size={16} /></div>
            <h2 className="font-display text-xl font-bold text-slate-900">AI Action Center</h2>
          </div>
          <p className="text-sm text-slate-500 mb-5 ml-11 -mt-1">Opportunities that need your attention.</p>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2"><Inbox size={16} className="text-indigo-500 mt-0.5" /><p className="text-[13px] text-slate-700"><b>{dash ? 5 : "…"} buyers</b> are currently looking for products matching your catalog.</p></div>
              <button onClick={() => navigate("/app/find-buyers")} className="shrink-0 inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors">Find Buyers <ArrowRight size={13} /></button>
            </div>
            {dash?.action_center?.map((card, i) => (
              <div key={card.deal_id} className="rounded-xl border border-slate-200 p-4" data-testid={`action-card-${i}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="font-display font-semibold text-slate-900">{card.buyer}</span><span className="font-display font-bold text-indigo-600">{fmtUSD(card.value, true)}</span></div>
                    <div className="text-xs text-slate-500 mt-0.5">{card.status}</div>
                    <div className="flex items-start gap-2 mt-3 bg-indigo-50/60 rounded-lg px-3 py-2"><Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" /><p className="text-[13px] text-slate-700 leading-relaxed">{card.recommendation}</p></div>
                  </div>
                  <button onClick={() => handleAction(card)} data-testid={`action-btn-${i}`} className="shrink-0 inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors">{card.action} <ArrowRight size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="revenue-at-risk">
            <div className="overline mb-1">Revenue at Risk</div>
            <div className="font-display text-3xl font-bold text-slate-900 mt-1">{fmtUSD(dash?.revenue_at_risk || 0, true)}</div>
            <p className="text-xs text-slate-500 mt-1 mb-4">Pipeline requiring action.</p>
            {dash && (
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={dash.pipeline_by_stage} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                  <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="stage" tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={(s) => s.split(" ")[0]} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2.5} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {win && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="winrate-card">
              <div className="flex items-center gap-2 mb-3"><Target size={16} className="text-emerald-600" /><span className="overline">Win-Rate Insights</span></div>
              <div className="flex items-baseline gap-2"><span className="font-display text-3xl font-bold text-slate-900">{win.overall_win_rate}%</span><span className="text-xs text-slate-400">overall win rate</span></div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Trophy size={14} className="text-amber-500" /> Best product: <b className="text-slate-900">{win.best_product}</b></div>
                <div className="flex items-center gap-2 text-slate-600"><Trophy size={14} className="text-amber-500" /> Best market: <b className="text-slate-900">{win.best_country}</b></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
