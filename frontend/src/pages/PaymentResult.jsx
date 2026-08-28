import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { PageShell } from "@/components/Common";
import { AILoader } from "@/components/Widgets";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cancelled = location.pathname.endsWith("/cancel");
  const sessionId = params.get("session_id");
  const [state, setState] = useState(cancelled ? "cancel" : "checking");
  const [txnId, setTxnId] = useState(null);

  useEffect(() => {
    if (cancelled || !sessionId) return;
    let tries = 0;
    const poll = async () => {
      tries += 1;
      try {
        const res = await api.paymentStatus(sessionId);
        setTxnId(res.transaction_id);
        if (res.payment_status === "paid") { setState("success"); return; }
      } catch {}
      if (tries >= 8) { setState("timeout"); return; }
      setTimeout(poll, 2000);
    };
    poll();
  }, [sessionId, cancelled]);

  return (
    <PageShell className="!max-w-lg">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-10 text-center mt-10" data-testid="payment-result">
        {state === "checking" && <div className="py-8 flex flex-col items-center gap-4"><AILoader label="Confirming your protected payment…" /><p className="text-sm text-slate-500">Please wait while we verify with the payment provider.</p></div>}
        {state === "success" && (
          <>
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="text-emerald-600" size={32} /></div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Payment Protected</h1>
            <p className="text-sm text-slate-500 mt-2">Funds are now held securely. The seller can begin fulfillment.</p>
            <button onClick={() => navigate(txnId ? `/app/transactions/${txnId}` : "/app/transactions")} data-testid="view-txn-btn" className="mt-6 inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors">View Transaction <ArrowRight size={15} /></button>
          </>
        )}
        {(state === "cancel" || state === "timeout") && (
          <>
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"><XCircle className="text-slate-500" size={32} /></div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{state === "cancel" ? "Payment cancelled" : "Still processing"}</h1>
            <p className="text-sm text-slate-500 mt-2">{state === "cancel" ? "No funds were captured. You can try protecting this transaction again." : "Payment is taking longer than expected. Check the transaction shortly."}</p>
            <button onClick={() => navigate("/app/transactions")} className="mt-6 inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors">Back to Transactions</button>
          </>
        )}
      </motion.div>
    </PageShell>
  );
}
