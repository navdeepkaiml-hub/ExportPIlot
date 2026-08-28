import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtUSD, STAGES, countryFlag, healthColor, timeAgo } from "@/lib/format";
import { PageShell, PageHeader } from "@/components/Common";
import { Briefcase, GripVertical } from "lucide-react";
import { toast } from "sonner";

const COLUMN_STAGES = ["New Inquiry", "Qualified", "Quotation Sent", "Negotiation", "Won", "Lost"];

function DealCard({ deal, onOpen, onDragStart }) {
  const hc = healthColor(deal.health);
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onClick={() => onOpen(deal)}
      data-testid={`deal-card-${deal.id}`}
      className="group rounded-xl border border-slate-200 bg-white p-4 cursor-pointer card-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display font-semibold text-slate-900 text-sm truncate">{deal.buyer_name}</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">{deal.product}</div>
        </div>
        <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-slate-500">{deal.quantity}</span>
        <span className="text-slate-300">·</span>
        <span className="font-display font-bold text-slate-900 text-sm">{fmtUSD(deal.deal_value, true)}</span>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-500 flex items-center gap-1">{countryFlag(deal.country)} {deal.country.split(" ")[0]}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${hc.bg} ${hc.text}`}>{deal.health}/100</span>
        </div>
      </div>
      <div className="text-[10px] text-slate-400 mt-2">{timeAgo(deal.last_activity)}</div>
    </div>
  );
}

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [dragging, setDragging] = useState(null);
  const navigate = useNavigate();

  const load = () => api.listDeals().then(setDeals).catch(() => {});
  useEffect(() => { load(); }, []);

  const onDrop = async (stage) => {
    if (!dragging || dragging.stage === stage) return;
    setDeals((ds) => ds.map((d) => (d.id === dragging.id ? { ...d, stage } : d)));
    try {
      await api.updateStage(dragging.id, stage);
      toast.success(`Moved to ${stage}`);
    } catch { toast.error("Could not update stage"); load(); }
    setDragging(null);
  };

  return (
    <PageShell className="!max-w-none">
      <PageHeader overline="Core · Working now" title="Deals" icon={Briefcase} subtitle="Your export pipeline. Drag deals across stages." />
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {COLUMN_STAGES.map((stage) => {
          const items = deals.filter((d) => d.stage === stage);
          const total = items.reduce((s, d) => s + (d.deal_value || 0), 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(stage)}
              data-testid={`kanban-col-${stage.toLowerCase().replace(/\s+/g, "-")}`}
              className="w-80 shrink-0"
            >
              <div className="flex items-center justify-between px-1 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-slate-900 text-sm">{stage}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{items.length}</span>
                </div>
                <span className="text-xs font-medium text-slate-500">{fmtUSD(total, true)}</span>
              </div>
              <div className="space-y-3 min-h-[120px] rounded-xl bg-slate-100/50 p-2">
                {items.map((d) => (
                  <DealCard key={d.id} deal={d} onOpen={(dd) => navigate(`/app/deals/${dd.id}`)} onDragStart={(e, dd) => setDragging(dd)} />
                ))}
                {items.length === 0 && <div className="text-center text-xs text-slate-400 py-6">No deals</div>}
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
