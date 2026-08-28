import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { PageShell, PageHeader } from "@/components/Common";
import { ProductCard } from "@/components/MarketCards";
import { EmptyState } from "@/components/Widgets";
import { Package, UserRound } from "lucide-react";

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { api.listProducts().then(setProducts).finally(() => setLoading(false)); }, []);

  return (
    <PageShell>
      <PageHeader
        overline="Seller catalog" title="My Products" icon={Package}
        subtitle="Your published export catalog, visible to global buyers."
        actions={<button onClick={() => navigate("/app/profile/supplier")} data-testid="view-profile-btn" className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm font-semibold hover:border-slate-300 transition-colors"><UserRound size={15} /> View Public Profile</button>}
      />
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <div key={i} className="h-80 rounded-2xl shimmer" />)}</div>
      ) : products.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : (
        <EmptyState icon={Package} title="No products published yet" desc="Add your first export product so global buyers can discover and request quotes." />
      )}
    </PageShell>
  );
}
