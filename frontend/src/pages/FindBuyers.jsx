import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageShell, PageHeader } from "@/components/Common";
import { RfqCard, FilterBar } from "@/components/MarketCards";
import { EmptyState } from "@/components/Widgets";
import { Search, Users } from "lucide-react";

const COUNTRIES = ["United Arab Emirates", "Germany", "Qatar", "Singapore", "Saudi Arabia", "Netherlands", "Japan"];
const INCOTERMS = ["EXW", "FOB", "CFR", "CIF"];

export default function FindBuyers() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("All");
  const [incoterm, setIncoterm] = useState("All");

  const load = () => { setLoading(true); api.listRfqs({ q: q || undefined, country, incoterm }).then(setRfqs).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [country, incoterm]);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q]);

  return (
    <PageShell>
      <PageHeader overline="Seller marketplace" title="Find Global Buyers" icon={Users} subtitle="Live buyer requirements (RFQs) matched to your catalog." />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search buyer requirements..." data-testid="rfq-search" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <FilterBar value={country} onChange={setCountry} options={COUNTRIES} placeholder="All Countries" testid="filter-rfq-country" />
        <FilterBar value={incoterm} onChange={setIncoterm} options={INCOTERMS} placeholder="All Incoterms" testid="filter-rfq-incoterm" />
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <div key={i} className="h-56 rounded-2xl shimmer" />)}</div>
      ) : rfqs.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{rfqs.map((r) => <RfqCard key={r.id} r={r} />)}</div>
      ) : (
        <EmptyState icon={Search} title="No buyer requests match your filters" desc="Adjust filters to see more live RFQs from global buyers." />
      )}
    </PageShell>
  );
}
