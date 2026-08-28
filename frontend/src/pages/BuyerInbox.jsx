import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { PageShell, PageHeader, Disclaimer, HealthRing } from "@/components/Common";
import { Brain, Sparkles, Loader2, ArrowRight, CheckCircle2, AlertCircle, Wand2 } from "lucide-react";
import { toast } from "sonner";

const SAMPLE = "Hello, we are interested in purchasing premium Indian makhana. We need approximately 10 MT delivered to Dubai. Please provide your CIF price and payment terms.";

function Field({ label, value }) {
  const empty = !value || value === "Not specified";
  return (
    <div className="border border-slate-200 rounded-lg px-4 py-3">
      <div className="overline text-[9px] mb-1">{label}</div>
      <div className={`text-sm font-medium ${empty ? "text-slate-400 italic" : "text-slate-900"}`}>{value || "Not specified"}</div>
    </div>
  );
}

export default function BuyerInbox() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [creating, setCreating] = useState(false);
  const [questions, setQuestions] = useState(null);
  const navigate = useNavigate();

  const analyze = async () => {
    if (!message.trim()) { toast.error("Paste a buyer inquiry first"); return; }
    setLoading(true); setResult(null); setQuestions(null);
    try {
      const res = await api.analyzeInquiry(message);
      await new Promise((r) => setTimeout(r, 600));
      setResult(res);
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async () => {
    setCreating(true);
    try {
      const deal = await api.createDeal({
        buyer_name: result.buyer, country: result.country, product: result.product,
        grade: result.grade, quantity: result.quantity, quantity_value: result.quantity_value,
        unit: result.unit, destination: result.destination, incoterm: result.incoterm,
        payment_terms: result.payment, delivery: result.delivery, email: result.contact_email,
        source_message: result.source_message, missing_info: result.missing_info, completeness: result.completeness,
      });
      toast.success("Deal created");
      navigate(`/app/deals/${deal.id}`);
    } catch {
      toast.error("Could not create deal");
    } finally {
      setCreating(false);
    }
  };

  const genQuestions = () => {
    const qs = (result.missing_info || []).map((m) => `Could you confirm the ${m.toLowerCase()}?`);
    setQuestions(qs.length ? qs : ["Could you confirm your preferred payment terms and delivery timeline?"]);
  };

  return (
    <PageShell>
      <PageHeader
        overline="Core · Working now" title="AI Buyer Inbox" icon={Brain} ai
        subtitle="Turn a buyer message into a structured export opportunity."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="overline">Buyer message</span>
              <button onClick={() => setMessage(SAMPLE)} className="text-xs font-medium text-indigo-600 hover:text-indigo-500" data-testid="load-sample-btn">
                Load sample inquiry
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste the buyer's inquiry here…"
              rows={9}
              data-testid="inquiry-textarea"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
            />
            <button
              onClick={analyze}
              disabled={loading}
              data-testid="analyze-inquiry-btn"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-70"
            >
              {loading ? <><Loader2 className="animate-spin" size={16} /> Analyzing inquiry…</> : <><Sparkles size={16} /> Analyze Inquiry</>}
            </button>
          </div>

          {questions && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-indigo-200 bg-white p-6 ai-glow" data-testid="clarifying-questions">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 size={16} className="text-indigo-600" />
                <span className="font-display font-semibold text-slate-900">Clarifying questions to send</span>
              </div>
              <ul className="space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-indigo-400">→</span>{q}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        <div>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 mb-2"><Sparkles size={16} className="animate-pulse" /> <span className="text-sm font-medium">Extracting requirements…</span></div>
                {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-lg shimmer" />)}
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="extraction-result">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="overline mb-1 text-indigo-600">AI Extracted Requirements</div>
                    <div className="font-display text-lg font-bold text-slate-900">{result.buyer}</div>
                  </div>
                  <div className="text-center">
                    <HealthRing value={result.completeness} size={60} />
                    <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mt-1">Complete</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Country" value={result.country} />
                  <Field label="Product" value={result.product} />
                  <Field label="Quantity" value={result.quantity} />
                  <Field label="Destination" value={result.destination} />
                  <Field label="Incoterm" value={result.incoterm} />
                  <Field label="Payment" value={result.payment} />
                  <Field label="Delivery" value={result.delivery} />
                  <Field label="Grade" value={result.grade} />
                </div>

                <div className="mt-5">
                  <div className="overline mb-2 flex items-center gap-1.5"><AlertCircle size={12} className="text-amber-500" /> Missing information</div>
                  <div className="flex flex-wrap gap-2">
                    {(result.missing_info || []).map((m) => (
                      <span key={m} className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">{m}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 bg-indigo-50/60 rounded-lg px-3 py-2.5">
                  <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-slate-700 leading-relaxed">{result.summary}</p>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={createDeal} disabled={creating} data-testid="create-deal-btn" className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-70">
                    {creating ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Create Deal
                  </button>
                  <button onClick={genQuestions} data-testid="gen-questions-btn" className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold hover:border-slate-300 transition-colors">
                    <Wand2 size={15} /> Clarifying Questions
                  </button>
                </div>
              </motion.div>
            )}

            {!result && !loading && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-10 text-center h-full flex flex-col items-center justify-center min-h-[360px]">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Brain className="text-indigo-500" size={26} />
                </div>
                <div className="font-display font-semibold text-slate-900">AI extraction appears here</div>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">Paste a buyer inquiry and click Analyze. ExportPilot extracts a structured export opportunity.</p>
              </motion.div>
            )}
          </AnimatePresence>
          <Disclaimer text="AI extraction is a draft — verify buyer details before creating a contract." className="mt-4" />
        </div>
      </div>
    </PageShell>
  );
}
