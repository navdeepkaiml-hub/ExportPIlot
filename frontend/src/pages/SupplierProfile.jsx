import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { countryFlag } from "@/lib/format";
import { PageShell } from "@/components/Common";
import { VerifiedBadge } from "@/components/Widgets";
import { ProductCard } from "@/components/MarketCards";
import { ArrowLeft, Building2, Star, Clock, TrendingUp, ShieldCheck, Globe2, MessageSquare } from "lucide-react";

function Stat({ label, value }) {
  return <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-center"><div className="font-display text-xl font-bold text-slate-900">{value}</div><div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">{label}</div></div>;
}

export default function SupplierProfile() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => { api.getSupplier("supplier-nimbus").then(setData).catch(() => {}); }, []);

  if (!data) return <PageShell><div className="h-64 rounded-2xl shimmer" /></PageShell>;
  const s = data.supplier;

  return (
    <PageShell>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6" data-testid="supplier-back-btn"><ArrowLeft size={16} /> Back</button>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-6">
        <div className="h-28 bg-slate-900 relative" style={{ backgroundImage: "linear-gradient(120deg,#0F172A,#312E81)" }} />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center"><div className="h-full w-full rounded-xl bg-slate-900 flex items-center justify-center"><Building2 className="text-white" size={30} /></div></div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2"><h1 className="font-display text-2xl font-bold text-slate-900">{s.name}</h1><VerifiedBadge verified={s.verified} /></div>
              <div className="text-sm text-slate-500 mt-0.5">{countryFlag(s.country)} {s.country} · {s.years_exporting} years exporting</div>
            </div>
            <button onClick={() => navigate("/app/negotiations")} className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"><MessageSquare size={15} /> Contact Supplier</button>
          </div>
          <p className="text-slate-600 mt-5 leading-relaxed max-w-3xl">{s.description}</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-6">
            <Stat label="Completed" value={s.completed_transactions} />
            <Stat label="Response Rate" value={`${s.response_rate}%`} />
            <Stat label="Avg Response" value={s.avg_response} />
            <Stat label="Rating" value={s.rating} />
            <Stat label="Markets" value={s.markets.length} />
          </div>
          <div className="flex flex-wrap gap-4 mt-6 text-sm">
            <div><div className="overline mb-2 flex items-center gap-1.5"><Globe2 size={12} /> Markets served</div><div className="flex flex-wrap gap-1.5">{s.markets.map((m) => <span key={m} className="text-xs font-medium bg-slate-100 rounded-full px-2.5 py-1">{m}</span>)}</div></div>
            <div><div className="overline mb-2 flex items-center gap-1.5"><ShieldCheck size={12} /> Certifications</div><div className="flex flex-wrap gap-1.5">{s.certifications.map((c) => <span key={c} className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">{c}</span>)}</div></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4"><h2 className="font-display text-xl font-bold text-slate-900">Product Catalog</h2><span className="text-sm text-slate-400">{data.products.length} products</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{data.products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </PageShell>
  );
}
