import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtUSD, countryFlag, fmtDate, stageColor } from "@/lib/format";
import { PageShell } from "@/components/Common";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, MessageSquare, FileText, Activity } from "lucide-react";

export default function BuyerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  useEffect(() => { api.getBuyer(id).then(setData).catch(() => {}); }, [id]);

  if (!data) return <PageShell><div className="h-64 rounded-2xl shimmer" /></PageShell>;
  const { buyer, deals, conversations, documents, activities } = data;
  const totalValue = deals.reduce((s, d) => s + (d.deal_value || 0), 0);

  return (
    <PageShell>
      <button onClick={() => navigate("/app/buyers")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6" data-testid="buyer-back-btn">
        <ArrowLeft size={16} /> Back to Buyers
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <div className="flex items-start gap-4">
          <img src={buyer.avatar} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-slate-900">{buyer.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">{countryFlag(buyer.country)} {buyer.country}</span>
              <span className="flex items-center gap-1.5"><Mail size={13} /> {buyer.email}</span>
              <span className="flex items-center gap-1.5"><Phone size={13} /> {buyer.phone}</span>
              {buyer.city && <span className="flex items-center gap-1.5"><MapPin size={13} /> {buyer.city}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="overline">Total pipeline</div>
            <div className="font-display text-2xl font-bold text-slate-900">{fmtUSD(totalValue, true)}</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white gap-1.5"><Briefcase size={14} /> Overview</TabsTrigger>
          <TabsTrigger value="deals" className="rounded-lg data-[state=active]:bg-white gap-1.5">Deals ({deals.length})</TabsTrigger>
          <TabsTrigger value="conversations" className="rounded-lg data-[state=active]:bg-white gap-1.5"><MessageSquare size={14} /> Conversations</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-white gap-1.5"><FileText size={14} /> Documents</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-white gap-1.5"><Activity size={14} /> Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[["Deals", deals.length], ["Open pipeline", fmtUSD(totalValue, true)], ["Documents", documents.length]].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-slate-200 bg-white p-6"><div className="overline">{k}</div><div className="font-display text-2xl font-bold text-slate-900 mt-2">{v}</div></div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deals">
          <div className="space-y-3">
            {deals.map((d) => (
              <div key={d.id} onClick={() => navigate(`/app/deals/${d.id}`)} className="rounded-xl border border-slate-200 bg-white p-4 cursor-pointer card-hover flex items-center justify-between" data-testid={`buyer-deal-${d.id}`}>
                <div><div className="font-display font-semibold text-slate-900">{d.product}</div><div className="text-xs text-slate-500">{d.quantity} · {fmtUSD(d.deal_value, true)}</div></div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${stageColor(d.stage)}`}>{d.stage}</span>
              </div>
            ))}
            {!deals.length && <div className="text-sm text-slate-400 text-center py-8">No deals</div>}
          </div>
        </TabsContent>

        <TabsContent value="conversations">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            {conversations.map((m) => (
              <div key={m.id} className={`rounded-xl px-4 py-3 max-w-[75%] ${m.sender === "exporter" ? "bg-slate-900 text-white ml-auto" : "bg-slate-100 text-slate-800"}`}>
                <div className="text-[11px] font-semibold opacity-60 mb-1">{m.sender === "exporter" ? "You" : m.sender === "ai" ? "AI" : "Buyer"}</div>
                <p className="text-sm">{m.text}</p>
              </div>
            ))}
            {!conversations.length && <div className="text-sm text-slate-400 text-center py-8">No conversations</div>}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((d) => (
              <a key={d.id} href={api.docUrl(d.id)} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3 card-hover">
                <FileText size={16} className="text-slate-400" /><span className="text-sm font-medium text-slate-900">{d.title}</span>
              </a>
            ))}
            {!documents.length && <div className="text-sm text-slate-400 text-center py-8 col-span-2">No documents yet</div>}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            {activities.map((a) => (
              <div key={a.id} className="flex gap-3"><div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5" /><div><p className="text-sm text-slate-800">{a.text}</p><p className="text-xs text-slate-400">{fmtDate(a.created_at)}</p></div></div>
            ))}
            {!activities.length && <div className="text-sm text-slate-400 text-center py-8">No activity</div>}
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
