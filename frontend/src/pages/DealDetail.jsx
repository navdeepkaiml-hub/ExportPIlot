import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtUSD, countryFlag, STAGES, stageColor } from "@/lib/format";
import { PageShell, Disclaimer, HealthRing } from "@/components/Common";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { ExportPackPanel } from "@/components/ExportPackPanel";
import {
  ArrowLeft, Stethoscope, CheckCircle2, AlertTriangle, Sparkles, MessageSquare,
  FileText, PackageCheck, Activity as ActivityIcon, Trophy, User, Bot,
} from "lucide-react";
import { toast } from "sonner";

const TIMELINE = ["Inquiry", "Qualified", "Quotation", "Negotiation", "Won"];
const STAGE_TO_STEP = { "New Inquiry": 0, Qualified: 1, "Quotation Sent": 2, Negotiation: 3, Won: 4, Lost: 4 };

function Timeline({ stage }) {
  const active = STAGE_TO_STEP[stage] ?? 0;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {TIMELINE.map((step, i) => (
        <div key={step} className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            i <= active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"
          }`}>
            {i < active && <CheckCircle2 size={12} />} {step}
          </div>
          {i < TIMELINE.length - 1 && <span className={`h-px w-4 ${i < active ? "bg-slate-900" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function DealDoctor({ dealId, health }) {
  const [doc, setDoc] = useState(null);
  useEffect(() => { api.dealDoctor(dealId).then(setDoc).catch(() => {}); }, [dealId]);
  if (!doc) return <div className="h-40 rounded-2xl shimmer" />;
  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-6 ai-glow" data-testid="deal-doctor">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Stethoscope className="text-white" size={16} /></div>
          <div>
            <div className="overline text-indigo-600">AI Deal Doctor</div>
            <div className="font-display font-bold text-slate-900">Deal Health</div>
          </div>
        </div>
        <HealthRing value={doc.health} size={60} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="overline mb-2 text-emerald-600">Positive</div>
          <ul className="space-y-1.5">
            {doc.positives.map((p) => <li key={p} className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className="text-emerald-500" /> {p}</li>)}
          </ul>
        </div>
        <div>
          <div className="overline mb-2 text-amber-600">Needs attention</div>
          <ul className="space-y-1.5">
            {doc.attention.map((p) => <li key={p} className="flex items-center gap-2 text-sm text-slate-700"><AlertTriangle size={14} className="text-amber-500" /> {p}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 bg-indigo-50/60 rounded-lg px-3 py-2.5">
        <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-[13px] text-slate-700">{doc.recommendation}</p>
      </div>
    </div>
  );
}

function ConversationTab({ dealId }) {
  const [msgs, setMsgs] = useState([]);
  useEffect(() => { api.dealConversation(dealId).then(setMsgs).catch(() => {}); }, [dealId]);
  if (!msgs.length) return <div className="text-sm text-slate-400 text-center py-12">No conversation yet.</div>;
  return (
    <div className="space-y-3" data-testid="conversation-tab">
      {msgs.map((m) => (
        <div key={m.id} className={`flex ${m.sender === "exporter" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${m.sender === "exporter" ? "bg-slate-900 text-white" : m.sender === "ai" ? "bg-indigo-50 text-slate-800 border border-indigo-100" : "bg-white border border-slate-200 text-slate-800"}`}>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-70 mb-1">
              {m.sender === "buyer" ? <User size={11} /> : <Bot size={11} />} {m.sender === "exporter" ? "You" : m.sender === "ai" ? "ExportPilot AI" : "Buyer"}
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTab({ dealId, refreshKey }) {
  const [acts, setActs] = useState([]);
  useEffect(() => { api.dealActivities(dealId).then(setActs).catch(() => {}); }, [dealId, refreshKey]);
  return (
    <div className="space-y-0" data-testid="activity-tab">
      {acts.map((a, i) => (
        <div key={a.id} className="flex gap-3 pb-5 relative">
          <div className="flex flex-col items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 mt-1.5" />
            {i < acts.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
          </div>
          <div className="pb-1">
            <p className="text-sm text-slate-800">{a.text}</p>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
          </div>
        </div>
      ))}
      {!acts.length && <div className="text-sm text-slate-400 text-center py-12">No activity yet.</div>}
    </div>
  );
}

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [deal, setDeal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const tab = params.get("tab") || "overview";

  const load = useCallback(() => api.getDeal(id).then(setDeal).catch(() => {}), [id]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const setTab = (t) => setParams(t === "overview" ? {} : { tab: t });
  const refresh = () => setRefreshKey((k) => k + 1);

  const markWon = async () => {
    await api.updateStage(id, "Won");
    toast.success("Deal marked as Won 🎉");
    refresh();
  };

  if (!deal) return <PageShell><div className="h-64 rounded-2xl shimmer" /></PageShell>;

  return (
    <PageShell>
      <button onClick={() => navigate("/app/deals")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6" data-testid="deal-back-btn">
        <ArrowLeft size={16} /> Back to Deals
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-slate-900">{deal.buyer_name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${stageColor(deal.stage)}`}>{deal.stage}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
              <span>{deal.product}</span><span className="text-slate-300">·</span>
              <span>{deal.quantity}</span><span className="text-slate-300">·</span>
              <span className="font-display font-bold text-slate-900">{fmtUSD(deal.deal_value, true)}</span><span className="text-slate-300">·</span>
              <span>{countryFlag(deal.country)} {deal.country}</span>
            </div>
          </div>
          {deal.stage !== "Won" && deal.stage !== "Lost" && (
            <button onClick={markWon} data-testid="mark-won-btn" className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500 transition-colors">
              <Trophy size={15} /> Mark as Won
            </button>
          )}
        </div>
        <div className="mt-5"><Timeline stage={deal.stage} /></div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="overview" data-testid="tab-overview" className="rounded-lg data-[state=active]:bg-white gap-1.5"><Stethoscope size={14} /> Overview</TabsTrigger>
          <TabsTrigger value="conversation" data-testid="tab-conversation" className="rounded-lg data-[state=active]:bg-white gap-1.5"><MessageSquare size={14} /> Conversation</TabsTrigger>
          <TabsTrigger value="quotation" data-testid="tab-quotation" className="rounded-lg data-[state=active]:bg-white gap-1.5"><FileText size={14} /> Quotation</TabsTrigger>
          <TabsTrigger value="export" data-testid="tab-export" className="rounded-lg data-[state=active]:bg-white gap-1.5"><PackageCheck size={14} /> Export Pack</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity" className="rounded-lg data-[state=active]:bg-white gap-1.5"><ActivityIcon size={14} /> Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><DealDoctor dealId={id} health={deal.health} /></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="overline mb-4">Deal facts</div>
              <dl className="space-y-3 text-sm">
                {[["Destination", deal.destination || "—"], ["Incoterm", deal.incoterm], ["Payment terms", deal.payment_terms || "Not set"], ["Delivery", deal.delivery || "Not set"], ["Grade", deal.grade || "—"], ["Completeness", `${deal.completeness || 0}%`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900 text-right">{v}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conversation"><div className="rounded-2xl border border-slate-200 bg-white p-6"><ConversationTab dealId={id} key={refreshKey} /></div></TabsContent>

        <TabsContent value="quotation"><QuoteBuilder deal={deal} onChange={refresh} /></TabsContent>

        <TabsContent value="export"><ExportPackPanel deal={deal} onChange={refresh} /></TabsContent>

        <TabsContent value="activity"><div className="rounded-2xl border border-slate-200 bg-white p-6"><ActivityTab dealId={id} refreshKey={refreshKey} /></div></TabsContent>
      </Tabs>
    </PageShell>
  );
}
