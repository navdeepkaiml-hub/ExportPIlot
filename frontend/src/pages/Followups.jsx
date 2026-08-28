import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtUSD } from "@/lib/format";
import { PageShell, PageHeader, Disclaimer } from "@/components/Common";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Sparkles, Loader2, Send, Pencil, CalendarClock, Flame, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SECTIONS = [
  { key: "High Priority", icon: Flame, color: "text-rose-600" },
  { key: "Due Today", icon: Clock, color: "text-amber-600" },
  { key: "Upcoming", icon: CalendarClock, color: "text-indigo-600" },
  { key: "Completed", icon: CheckCircle2, color: "text-emerald-600" },
];

export default function Followups() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => api.listFollowups().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const openGenerate = async (fu) => {
    setActive(fu); setMessage(""); setLoading(true);
    try {
      const res = await api.generateFollowup(fu.id);
      setMessage(res.message);
    } catch { toast.error("Could not generate follow-up"); } finally { setLoading(false); }
  };

  const send = async () => {
    await api.completeFollowup(active.id);
    toast.success("Follow-up sent");
    setActive(null); load();
  };

  const schedule = async () => {
    toast.success("Follow-up scheduled");
    setActive(null);
  };

  return (
    <PageShell>
      <PageHeader overline="Core · Working now" title="AI Follow-ups" icon={Clock} subtitle="Never lose a lead. Prioritised follow-ups with AI-drafted messages." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SECTIONS.map((sec) => {
          const list = items.filter((i) => i.priority === sec.key);
          return (
            <div key={sec.key} data-testid={`followup-section-${sec.key.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="flex items-center gap-2 mb-3">
                <sec.icon size={16} className={sec.color} />
                <span className="font-display font-semibold text-slate-900">{sec.key}</span>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{list.length}</span>
              </div>
              <div className="space-y-3">
                {list.map((fu) => (
                  <motion.div key={fu.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 card-hover" data-testid={`followup-${fu.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display font-semibold text-slate-900">{fu.buyer_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{fu.product} · <span className="font-semibold text-slate-700">{fmtUSD(fu.deal_value, true)}</span></div>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{fu.days_since}d since contact</span>
                    </div>
                    <div className="flex items-start gap-2 mt-3 bg-indigo-50/60 rounded-lg px-3 py-2">
                      <Sparkles size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                      <p className="text-[12.5px] text-slate-700">{fu.recommendation}</p>
                    </div>
                    {sec.key !== "Completed" && (
                      <button onClick={() => openGenerate(fu)} data-testid={`generate-followup-${fu.id}`} className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors">
                        <Sparkles size={13} /> Generate Follow-up
                      </button>
                    )}
                  </motion.div>
                ))}
                {!list.length && <div className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">Nothing here</div>}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-xl" data-testid="followup-dialog">
          <DialogHeader><DialogTitle className="flex items-center gap-2 font-display"><Sparkles size={18} className="text-indigo-600" /> Follow-up for {active?.buyer_name}</DialogTitle></DialogHeader>
          {loading ? (
            <div className="space-y-2 py-4">{[...Array(5)].map((_, i) => <div key={i} className="h-4 rounded shimmer" />)}</div>
          ) : (
            <div className="space-y-4">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={9} data-testid="followup-message" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-indigo-400" />
              <Disclaimer text="AI-generated draft — verify before sending." />
              <div className="flex gap-2">
                <button onClick={() => toast.info("Edit the message above")} data-testid="followup-edit-btn" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold hover:border-slate-300 transition-colors"><Pencil size={14} /> Edit</button>
                <button onClick={schedule} data-testid="followup-schedule-btn" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold hover:border-slate-300 transition-colors"><CalendarClock size={14} /> Schedule</button>
                <button onClick={send} data-testid="followup-send-btn" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"><Send size={14} /> Send</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
