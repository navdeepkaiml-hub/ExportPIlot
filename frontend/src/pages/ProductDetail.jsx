import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtMoney, countryFlag } from "@/lib/format";
import { PageShell, Disclaimer } from "@/components/Common";
import { VerifiedBadge, MatchScore } from "@/components/Widgets";
import { ArrowLeft, Star, Clock, Check, Sparkles, ShieldCheck, MessageSquare, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => { api.getProduct(id).then(setP).catch(() => {}); }, [id]);

  const requestQuote = async () => {
    setRequesting(true);
    try {
      const deal = await api.createDeal({
        buyer_name: "Global Buyer Co.", country: "United Arab Emirates", product: p.name,
        grade: p.grade, quantity: p.moq, quantity_value: parseFloat(p.moq) || 1, unit: p.unit,
        destination: "Dubai", incoterm: (p.incoterms || ["CIF"])[0], deal_value: p.price * (parseFloat(p.moq) || 1),
        source_message: `Buyer requested a quote for ${p.name} (${p.moq}) from marketplace listing.`,
      });
      toast.success("Quote requested — deal created");
      navigate(`/app/deals/${deal.id}`);
    } catch { toast.error("Could not request quote"); } finally { setRequesting(false); }
  };

  if (!p) return <PageShell><div className="h-96 rounded-2xl shimmer" /></PageShell>;

  const matchReasons = [
    `${p.available_qty} available`, "Destination supported",
    `MOQ ${p.moq} compatible`, `${(p.incoterms || []).join("/")} available`,
  ];

  return (
    <PageShell>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6" data-testid="product-back-btn"><ArrowLeft size={16} /> Back to marketplace</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="h-64 bg-slate-100 relative"><img src={p.image} alt={p.name} className="h-full w-full object-cover" /><div className="absolute top-4 left-4"><VerifiedBadge verified={p.verified} /></div></div>
            <div className="p-6">
              <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">{p.category}</div>
              <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">{p.name}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400" /> {p.rating}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> Responds in {p.response_time}</span>
                <span>{countryFlag(p.seller_country)} {p.origin_region || p.origin}</span>
              </div>
              <p className="text-slate-600 mt-4 leading-relaxed">{p.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                {[["Origin", p.origin_region || p.origin], ["Grade", p.grade || "—"], ["Available", p.available_qty], ["MOQ", p.moq], ["Packaging", p.packaging], ["Port", p.port], ["Lead time", p.lead_time], ["Incoterms", (p.incoterms || []).join(", ")]].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5"><div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{k}</div><div className="text-sm font-medium text-slate-900">{v}</div></div>
                ))}
              </div>
              <div className="mt-5">
                <div className="overline mb-2">Certifications</div>
                <div className="flex flex-wrap gap-2">{(p.certifications || []).map((c) => <span key={c} className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-3 py-1"><ShieldCheck size={11} className="text-emerald-500" /> {c}</span>)}</div>
              </div>
            </div>
          </div>

          {/* Seller info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center"><Building2 className="text-white" size={22} /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-display font-semibold text-slate-900">{p.seller_name}</span><VerifiedBadge /></div>
                <div className="text-sm text-slate-500">{countryFlag(p.seller_country)} {p.seller_country} · 47 completed transactions · 96% response rate</div>
              </div>
              <button onClick={() => navigate("/app/profile/supplier")} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">View profile →</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sticky top-24">
            <div className="text-sm text-slate-400">Indicative price</div>
            <div className="font-display text-3xl font-bold text-slate-900 mt-1">{fmtMoney(p.price, p.currency)}<span className="text-base text-slate-400 font-normal">/{p.unit}</span></div>
            <Disclaimer text="Estimated — confirm actual transaction and logistics costs." className="mt-3" />

            <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
              <div className="flex items-center justify-between mb-3"><span className="flex items-center gap-1.5 font-display font-semibold text-slate-900 text-sm"><Sparkles size={15} className="text-indigo-600" /> AI Match</span><MatchScore score={94} label="Excellent" /></div>
              <ul className="space-y-1.5">{matchReasons.map((r) => <li key={r} className="flex items-center gap-2 text-[13px] text-slate-700"><Check size={13} className="text-emerald-500" /> {r}</li>)}</ul>
            </div>

            <button onClick={requestQuote} disabled={requesting} data-testid="request-quote-btn" className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-70">{requesting ? <><Loader2 className="animate-spin" size={16} /> Creating…</> : "Request Quote"}</button>
            <button onClick={() => navigate("/app/negotiations")} data-testid="contact-seller-btn" className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-xl px-5 py-3 text-sm font-semibold hover:border-slate-300 transition-colors"><MessageSquare size={15} /> Contact Seller</button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
