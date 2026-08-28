import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageShell, PageHeader } from "@/components/Common";
import { EmptyState } from "@/components/Widgets";
import { ProductCard, FilterBar } from "@/components/MarketCards";
import { Store, Search } from "lucide-react";

const CATEGORIES = ["Agri & Food", "Spices", "Textiles", "Beverages"];
const COUNTRIES = ["India"];
const INCOTERMS = ["EXW", "FOB", "CFR", "CIF"];

export default function DiscoverSuppliers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [incoterm, setIncoterm] = useState("All");

  const load = () => {
    setLoading(true);
    api.listProducts({ q: q || undefined, category, incoterm }).then(setProducts).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [category, incoterm]);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q]);

  return (
    <PageShell>
      <PageHeader overline="Buyer marketplace" title="Discover Global Suppliers" icon={Store} subtitle="Source products from verified exporters worldwide." />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, suppliers or categories..." data-testid="supplier-search" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <FilterBar value={category} onChange={setCategory} options={CATEGORIES} placeholder="All Categories" testid="filter-category" />
        <FilterBar value={incoterm} onChange={setIncoterm} options={INCOTERMS} placeholder="All Incoterms" testid="filter-incoterm" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <div key={i} className="h-80 rounded-2xl shimmer" />)}</div>
      ) : products.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <EmptyState icon={Search} title="No suppliers match your filters" desc="Try broadening your search or clearing filters to see more global suppliers." />
      )}
    </PageShell>
  );
}
