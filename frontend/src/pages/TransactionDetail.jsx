import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtMoney } from "@/lib/format";
import { PageShell, Disclaimer } from "@/components/Common";
import { ArrowLeft, ShieldCheck, Check, CreditCard, Loader2, ArrowRight, Info, Lock } from "lucide-react";
import { toast } from "sonner";

const HOW = [
  ["Buyer Payment", "The buyer funds the transaction to a protected balance."],
  ["Protected Transaction", "Funds are held securely and are not yet released to the seller."],
  ["Seller Fulfillment", "The seller ships and uploads export documents."],
  ["Release Conditions", "Both parties confirm fulfillment conditions are met."],
  ["Seller Payout", "Funds are released to the seller, minus the 0.5% platform fee."],
];

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [t, setT] = useState(null);
  const [paying, setPaying] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const load = () => api.getTransaction(id).then(setT).catch(() => {});
  useEffect(() => { load(); }, [id]);

  const protect = async () => {
    setPaying(true);
    try {
      const res = await api.checkout({ transaction_id: id, origin_url: window.location.origin });
      window.location.href = res.checkout_url;
    } catch { toast.error("Could not start payment"); setPaying(false); }
  };

  const advance = async () => {
    setAdvancing(true);
    try { const updated = await api.advanceTransaction(id); setT(updated); toast.success(`Moved to ${updated.status}`); }
    catch { toast.error("Could not advance"); } finally { setAdvancing(false); }
  };

  if (!t) return <PageShell><div className="h-64 rounded-2xl shimmer" /></PageShell>;

  const done = (step) => t.timeline?.find((s) => s.step === step)?.done;

  return (
    <PageShell>
      <button onClick={() => navigate("/app/transactions")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6" data-testid="txn-back-btn"><ArrowLeft size={16} /> Back to Transactions</button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2"><ShieldCheck size={20} className="text-indigo-600" /><h1 className="font-display text-2xl font-bold text-slate-900">Transaction {t.number}</h1></div>
            <div className="text-sm text-slate-500 mt-1">{t.buyer_name} ↔ {t.seller_name} · {t.product} · {t.quantity}</div>
          </div>
          <div className="text-right"><div className="overline">Transaction Value</div><div className="font-display text-2xl font-bold text-slate-900">{fmtMoney(t.value, t.currency)}</div></div>
        </div>

        {/* Timeline */}
        <div className="mt-8 flex items-center gap-1.5 flex-wrap" data-testid="txn-timeline">
          {t.timeline?.map((s, i) => (
            <div key={s.step} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${s.done ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"}`}>
                {s.done ? <Check size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />} {s.step}
              </div>
              {i < t.timeline.length - 1 && <ArrowRight size={13} className={s.done ? "text-slate-900" : "text-slate-200"} />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Protection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-indigo-200 bg-white p-6 ai-glow" data-testid="payment-protection">
            <div className="flex items-center gap-2.5 mb-1"><div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Lock className="text-white" size={16} /></div><div><div className="overline text-indigo-600">Payment Protection</div><div className="font-display font-bold text-slate-900">Trade with greater confidence.</div></div></div>
            <p className="text-sm text-slate-500 mt-2 mb-5">Fund this transaction to hold the payment securely until fulfillment conditions are met. Test mode — use card <b>4242 4242 4242 4242</b>, any future expiry & CVC.</p>

            {!t.paid ? (
              <button onClick={protect} disabled={paying} data-testid="protect-payment-btn" className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-5 py-4 text-base font-bold hover:bg-slate-800 transition-colors disabled:opacity-70">
                {paying ? <><Loader2 className="animate-spin" size={18} /> Redirecting to secure checkout…</> : <><CreditCard size={18} /> Protect This Transaction · {fmtMoney(t.value, t.currency)}</>}
              </button>
            ) : t.status !== "Payout Completed" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 font-semibold text-sm"><ShieldCheck size={16} /> Payment protected — funds held securely.</div>
                <button onClick={advance} disabled={advancing} data-testid="advance-txn-btn" className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-70">{advancing ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />} Advance to next stage</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 font-semibold text-sm"><Check size={16} /> Payout completed — {fmtMoney(t.payout, t.currency)} released to seller.</div>
            )}
          </div>

          {/* How it works */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2 mb-5"><Info size={16} className="text-slate-500" /><span className="font-display font-bold text-slate-900">How Payment Protection Works</span></div>
            <div className="space-y-0">
              {HOW.map(([title, desc], i) => (
                <div key={title} className="flex gap-3 pb-5 relative">
                  <div className="flex flex-col items-center">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done(["Deal Agreed", "Payment Protected", "Fulfillment In Progress", "Release Pending", "Payout Completed"][i]) ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>{i + 1}</div>
                    {i < HOW.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-1"><p className="font-medium text-slate-900 text-sm">{title}</p><p className="text-xs text-slate-500 mt-0.5">{desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commission breakdown */}
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sticky top-24" data-testid="commission-breakdown">
            <div className="overline mb-4">Transparent breakdown</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Transaction Value</span><span className="font-medium text-slate-900">{fmtMoney(t.value, t.currency)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">ExportPilot Fee <span className="text-xs text-slate-400">({t.commission_pct}%)</span></span><span className="font-medium text-rose-600">− {fmtMoney(t.commission, t.currency)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-3"><span className="font-semibold text-slate-900">Seller Payout</span><span className="font-display font-bold text-emerald-600">{fmtMoney(t.payout, t.currency)}</span></div>
            </div>
            <Disclaimer text="Escrow-style flow via Stripe test mode. No live funds are moved until a live payment account is connected." className="mt-5" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
