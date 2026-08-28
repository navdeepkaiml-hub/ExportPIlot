import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { PageShell, PageHeader } from "@/components/Common";
import { Sparkles, Send, Loader2, ArrowRight, Bot } from "lucide-react";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Which buyer should I follow up with?",
  "Show my highest-value deals.",
  "Which deals are waiting for buyer action?",
  "Which quotations have low margins?",
  "Prepare the export pack for Dubai Harvest Trading.",
];

export default function ManagerPage() {
  const [messages, setMessages] = useState([{ role: "ai", text: "Hi, I'm ExportPilot — your AI export manager. I use your live workspace data. Ask me anything or pick a prompt." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (q) => {
    const question = (q ?? input).trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await api.ask(question);
      setMessages((m) => [...m, { role: "ai", text: res.answer, action: res.action }]);
    } catch { setMessages((m) => [...m, { role: "ai", text: "I couldn't reach the workspace just now." }]); }
    finally { setLoading(false); }
  };

  const runAction = async (action) => {
    if (action.type === "prepare_export_pack") {
      toast.loading("Preparing export pack...", { id: "pack" });
      await api.generateExportPack(action.deal_id);
      toast.success("Export pack prepared", { id: "pack" });
      navigate(`/app/deals/${action.deal_id}?tab=export`);
    }
  };

  return (
    <PageShell>
      <PageHeader overline="Core · Working now" title="AI Export Manager" icon={Sparkles} ai subtitle="Ask ExportPilot what to do next. It answers using your live deals, quotations and follow-ups." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white flex flex-col h-[560px]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
                  {m.role === "ai" && <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 mb-1"><Bot size={12} /> ExportPilot</div>}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.action && (
                    <button onClick={() => runAction(m.action)} data-testid="manager-action-btn" className="mt-3 inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-indigo-500 transition-colors">{m.action.label} <ArrowRight size={13} /></button>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="animate-spin" size={14} /> Thinking…</div></div>}
          </div>
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2.5">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="What should I do next?" data-testid="manager-input" className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
              <button onClick={() => send()} disabled={loading} data-testid="manager-send" className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-colors disabled:opacity-50"><Send size={16} /></button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="overline mb-4">Suggested questions</div>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} data-testid="manager-suggestion" className="w-full text-left text-[13px] text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors">{s}</button>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
