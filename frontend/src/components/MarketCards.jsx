import { useNavigate } from "react-router-dom";
import { fmtMoney, countryFlag } from "@/lib/format";
import { VerifiedBadge, MatchScore } from "@/components/Widgets";
import { Star, Clock, ArrowRight, Sparkles, MapPin } from "lucide-react";

export function ProductCard({ p, onQuote }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden card-hover flex flex-col" data-testid={`product-card-${p.id}`}>
      <div className="h-40 bg-slate-100 relative overflow-hidden">
        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
        <div className="absolute top-3 left-3"><VerifiedBadge verified={p.verified} /></div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">{p.category}</div>
        <h3 className="font-display font-semibold text-slate-900 text-[16px] mt-1 leading-snug">{p.name}</h3>
        <div className="text-xs text-slate-500 mt-1">{p.seller_name} · {countryFlag(p.seller_country)} {p.seller_country}</div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div><div className="text-slate-400">Available</div><div className="font-medium text-slate-800">{p.available_qty}</div></div>
          <div><div className="text-slate-400">MOQ</div><div className="font-medium text-slate-800">{p.moq}</div></div>
          <div><div className="text-slate-400">Price</div><div className="font-display font-bold text-slate-900">{fmtMoney(p.price, p.currency)}<span className="text-slate-400 font-normal">/{p.unit}</span></div></div>
          <div><div className="text-slate-400">Incoterms</div><div className="font-medium text-slate-800">{(p.incoterms || []).join(", ")}</div></div>
        </div>
        <div className="flex items-center gap-3 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /> {p.rating}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {p.response_time}</span>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => navigate(`/app/products/${p.id}`)} data-testid={`view-product-${p.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-semibold hover:border-slate-300 transition-colors">View Product</button>
          <button onClick={() => (onQuote ? onQuote(p) : navigate(`/app/products/${p.id}`))} data-testid={`quote-product-${p.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors">Request Quote</button>
        </div>
      </div>
    </div>
  );
}

export function RfqCard({ r, onOffer }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 card-hover" data-testid={`rfq-card-${r.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-slate-900">{r.buyer_name}</span>
            <span className="text-xs text-slate-400">{countryFlag(r.country)} {r.destination}</span>
          </div>
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide mt-1">{r.category}</div>
        </div>
        {r.match_score != null && <MatchScore score={r.match_score} label={r.match_score >= 90 ? "Excellent" : r.match_score >= 82 ? "Strong" : "Good"} />}
      </div>
      <h3 className="font-display font-semibold text-slate-900 text-[15px] mt-3">{r.product}</h3>
      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div><div className="text-slate-400">Quantity</div><div className="font-medium text-slate-800">{r.quantity}</div></div>
        <div><div className="text-slate-400">Incoterm</div><div className="font-medium text-slate-800">{r.incoterm}</div></div>
        <div><div className="text-slate-400">Target</div><div className="font-display font-bold text-slate-900">{fmtMoney(r.target_price, r.currency, true)}</div></div>
      </div>
      <div className="text-xs text-slate-400 mt-3">{r.payment_terms}</div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <button onClick={() => navigate(`/app/rfqs/${r.id}`)} data-testid={`view-rfq-${r.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-semibold hover:border-slate-300 transition-colors">View RFQ</button>
        <button onClick={() => navigate(`/app/rfqs/${r.id}`)} data-testid={`offer-rfq-${r.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors">Send Offer <ArrowRight size={13} /></button>
      </div>
    </div>
  );
}

export function FilterBar({ value, onChange, options, placeholder, testid }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400">
      <option value="All">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
