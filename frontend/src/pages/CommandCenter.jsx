import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtUSD } from "@/lib/format";
import { PageShell } from "@/components/Common";
import { toast } from "sonner";
import {
  TrendingUp, Trophy, Clock, AlertOctagon, Sparkles, ArrowRight, Sun, ShieldAlert,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";

function KpiCard({ label, value, icon: Icon, tone, delay }) {
  const tones = {
    slate: "bg-slate-900 text-white", indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", rose: "bg-rose-50 text-rose-600",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl border border-slate-200 bg-white p-6 card-hover"
      data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center justify-between">
        <span className="overline">{label}</span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon size={17} strokeWidth={1.9} />
        </div>
      </div>
      <div className="font-display text-3xl font-bold text-slate-900 mt-4">{value}</div>
    </motion.div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-lg px-3 py-2 shadow-md">
      <div className="text-xs text-slate-400">{payload[0].payload.stage}</div>
      <div className="font-display font-semibold text-slate-900">{fmtUSD(payload[0].value, true)}</div>
    </div>
  );
}

export default function CommandCenter() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.dashboard().then(setData).catch(() => {});
  }, []);

  const handleAction = async (card) => {
    if (card.action === "Generate Follow-up") navigate("/app/followups");
    else if (card.action === "Open Negotiation") navigate("/app/negotiation");
    else navigate(`/app/deals/${card.deal_id}`);
  };

  if (!data) {
    return (
      <PageShell>
        <div className="grid grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl shimmer" />)}
        </div>
      </PageShell>
    );
  }

  const k = data.kpis;

  return (
    <PageShell>
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        <Sun size={16} /> <span className="text-sm font-medium">Good morning</span> 👋
      </div>
      <h1 className="font-display text-3xl font-bold text-slate-900 mb-8">Your AI Export Department is ready.</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <KpiCard label="Pipeline" value={fmtUSD(k.pipeline, true)} icon={TrendingUp} tone="slate" delay={0.02} />
        <KpiCard label="Orders Won" value={fmtUSD(k.orders_won, true)} icon={Trophy} tone="emerald" delay={0.06} />
        <KpiCard label="Follow-ups Due" value={k.followups_due} icon={Clock} tone="amber" delay={0.1} />
        <KpiCard label="Deals Needing Attention" value={k.deals_attention} icon={AlertOctagon} tone="rose" delay={0.14} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Action Center */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="lg:col-span-2 rounded-2xl border border-indigo-200 bg-white p-6 ai-glow"
          data-testid="ai-action-center"
        >
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="text-white" size={16} />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">AI Action Center</h2>
          </div>
          <p className="text-sm text-slate-500 mb-5 ml-11 -mt-1">Here are the opportunities that need your attention.</p>

          <div className="space-y-3">
            {data.action_center.map((card, i) => (
              <div key={card.deal_id} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors" data-testid={`action-card-${i}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-slate-900">{card.buyer}</span>
                      <span className="font-display font-bold text-indigo-600">{fmtUSD(card.value, true)}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{card.status}</div>
                    <div className="flex items-start gap-2 mt-3 bg-indigo-50/60 rounded-lg px-3 py-2">
                      <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                      <p className="text-[13px] text-slate-700 leading-relaxed">{card.recommendation}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAction(card)}
                    data-testid={`action-btn-${i}`}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-full px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    {card.action} <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Revenue at risk */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col"
          data-testid="revenue-at-risk"
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="text-rose-500" size={18} />
            <span className="overline">Revenue at Risk</span>
          </div>
          <div className="font-display text-4xl font-bold text-slate-900 mt-2">{fmtUSD(data.revenue_at_risk, true)}</div>
          <p className="text-sm text-slate-500 mt-1">Potential pipeline requiring action.</p>

          <div className="mt-6 flex-1 min-h-[160px]">
            <div className="overline mb-2">Pipeline by stage</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data.pipeline_by_stage} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="stage" tick={{ fontSize: 9, fill: "#94A3B8" }} tickFormatter={(s) => s.split(" ")[0]} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2.5} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
