import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtMoney, countryFlag } from "@/lib/format";
import { useRole } from "@/context/RoleContext";
import { PageShell, Disclaimer } from "@/components/Common";
import { AILoader, MatchScore } from "@/components/Widgets";
import { ProductCard } from "@/components/MarketCards";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Sparkles, Check, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSeller } = useRole();
  const [rfq, setRfq] = useState(null);
  const [matching, setMatching] = useState(true);
  const [result, setResult] = useState(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offer, setOffer] = useState({ price: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.getRfq(id).then(setRfq).catch(() => {});
    setMatching(true);
    api.matchRfq(id).then((r) => setResult(r)).catch(() => {}).finally(() => setMatching(false));
  }, [id]);

  const sendOffer = async () => {
    setSending(true);
    try {
      await api.createOffer({ rfq_id: id, buyer_name: rfq.buyer_name, seller_name: "Nimbus Agro Exports", price: parseFloat(offer.price) || rfq.target_price, quantity: rfq.quantity, incoterm: rfq.incoterm, message: offer.message });
      toast.success("Offer sent to buyer");
      setOfferOpen(false);
      navigate("/app/negotiations");
    } catch { toast.error("Could not send offer"); } finally { setSending(false); }
  };

  if (!rfq) return <PageShell><div className="h-64 rounded-2xl shimmer" /></PageShell>;

  return (
    <PageShell>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6" data-testid="rfq-back-btn"><ArrowLeft size={16} /> Back</button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-slate-900">{rfq.product}</h1>
              <span className="text-xs font-medium bg-slate-100 rounded-full px-2 py-0.5">{rfq.status}</span>
            </div>
            <div className="text-sm text-slate-500 mt-1">{rfq.buyer_name} · {countryFlag(rfq.country)} {rfq.destination}, {rfq.country}</div>
          </div>
          {isSeller && <button onClick={() => setOfferOpen(true)} data-testid="send-offer-btn" className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"><Send size={15} /> Send Offer</button>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {[["Quantity", rfq.quantity], ["Incoterm", rfq.incoterm], ["Target Price", fmtMoney(rfq.target_price, rfq.currency, true)], ["Payment", rfq.payment_terms], ["Delivery", rfq.delivery]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2"><div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{k}</div><div className="text-sm font-medium text-slate-900 truncate">{v}</div></div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-white p-6 ai-glow" data-testid="ai-match-panel">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Sparkles className="text-white" size={16} /></div>
          <div><div className="overline text-indigo-600">AI Supplier Matching</div><div className="font-display font-bold text-slate-900">{isSeller ? "How well you match this buyer" : "Best global suppliers for you"}</div></div>
        </div>
        {matching ? (
          <div className="py-10 flex flex-col items-center gap-3"><AILoader label="Finding the best global suppliers..." /><div className="w-full max-w-md space-y-2 mt-4">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)}</div></div>
        ) : (
          <>
            <div className="flex items-start gap-2 bg-indigo-50/60 rounded-lg px-3 py-2.5 mb-5"><Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" /><p className="text-[13px] text-slate-700">{result?.summary}</p></div>
            <div className="space-y-4">
              {result?.matches?.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={m.product.image} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="font-display font-semibold text-slate-900">{m.product.name}</div>
                        <div className="text-xs text-slate-500">{m.product.seller_name} · {fmtMoney(m.product.price, m.product.currency)}/{m.product.unit}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">{m.reasons.map((r) => <span key={r} className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><Check size={10} /> {r}</span>)}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <MatchScore score={m.score} label={m.label} size="lg" />
                      <button onClick={() => navigate(`/app/products/${m.product.id}`)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">View →</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <Disclaimer text="AI match scores reflect fit on product, incoterm and destination — verify supplier details before contracting." className="mt-5" />
          </>
        )}
      </div>

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent data-testid="offer-dialog">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Send size={18} className="text-indigo-600" /> Send Offer to {rfq.buyer_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="overline block mb-1.5">Offer Price (USD / {rfq.unit})</label><input type="number" value={offer.price} onChange={(e) => setOffer({ ...offer, price: e.target.value })} placeholder={String(rfq.target_price)} data-testid="offer-price" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
            <div><label className="overline block mb-1.5">Message</label><textarea value={offer.message} onChange={(e) => setOffer({ ...offer, message: e.target.value })} rows={4} placeholder="Introduce your offer, quality and terms..." data-testid="offer-message" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
            <button onClick={sendOffer} disabled={sending} data-testid="submit-offer-btn" className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-70">{sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Send Offer</button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
