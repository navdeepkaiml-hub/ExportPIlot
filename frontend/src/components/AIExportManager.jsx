import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Which buyer should I follow up with?",
  "Show my highest-value deals.",
  "Which deals are waiting for buyer action?",
  "Which quotations have low margins?",
  "Prepare the export pack for Dubai Harvest Trading.",
];

export function AIExportManager() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi, I'm ExportPilot — your AI export manager. Ask me what to do next, or pick a prompt below." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async (q) => {
    const question = (q ?? input).trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await api.ask(question);
      setMessages((m) => [...m, { role: "ai", text: res.answer, action: res.action }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "I couldn't reach the workspace just now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action) => {
    if (action.type === "prepare_export_pack") {
      toast.loading("Preparing export pack...", { id: "pack" });
      try {
        await api.generateExportPack(action.deal_id);
        toast.success("Export pack prepared", { id: "pack" });
        setOpen(false);
        navigate(`/app/deals/${action.deal_id}?tab=export`);
      } catch {
        toast.error("Could not prepare export pack", { id: "pack" });
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="ai-manager-fab"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-colors pulse-ring"
        aria-label="Ask ExportPilot"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
            data-testid="ai-manager-panel"
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5 bg-slate-900 text-white">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="font-display font-semibold text-sm">Ask ExportPilot</div>
                <div className="text-[11px] text-slate-400">AI Export Manager · uses your data</div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.action && (
                      <button
                        onClick={() => runAction(m.action)}
                        data-testid="ai-manager-action-btn"
                        className="mt-2.5 w-full flex items-center justify-center gap-1.5 bg-indigo-600 text-white rounded-lg px-3 py-2 text-xs font-semibold hover:bg-indigo-500 transition-colors"
                      >
                        {m.action.label} <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 text-slate-500 text-[13px]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" size={14} /> Thinking…
                  </div>
                </div>
              )}
              {messages.length === 1 && (
                <div className="pt-1 space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      data-testid="ai-manager-suggestion"
                      className="w-full text-left text-[12.5px] text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="What should I do next?"
                  data-testid="ai-manager-input"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => send()}
                  disabled={loading}
                  data-testid="ai-manager-send"
                  className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
