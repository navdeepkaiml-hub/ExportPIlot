import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { PageShell } from "@/components/Common";
import { StatCard } from "@/components/Widgets";
import { ProductCard } from "@/components/MarketCards";
import { ClipboardList, Store, Handshake, CreditCard, ShieldCheck, ShoppingBag, Sparkles, ArrowRight, Search } from "lucide-react";

export default function BuyerDashboard() {
  const [k, setK] = useState(null);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.dashboardBuyer().then((d) => setK(d.kpis)).catch(() => {});
    api.listProducts().then((p) => setProducts(p.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <PageShell>
      <div className="flex items-center gap-2 text-slate-400 mb-1"><ShoppingBag size={16} /> <span className="text-sm font-medium">Welcome back</span></div>
      <h1 className="font-display text-3xl font-bold text-slate-900 mb-8">Find better suppliers. Trade with confidence.</h1>

      {k && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="Active RFQs" value={k.active_rfqs} icon={ClipboardList} tone="indigo" />
          <StatCard label="Supplier Matches" value={k.supplier_matches} icon={Store} tone="sky" />
          <StatCard label="Negotiations" value={k.active_negotiations} icon={Handshake} tone="amber" />
          <StatCard label="Pending Payments" value={k.pending_payments} icon={CreditCard} tone="rose" />
          <StatCard label="Protected" value={k.protected_transactions} icon={ShieldCheck} tone="emerald" />
          <StatCard label="Orders" value={k.orders} icon={ShoppingBag} tone="slate" />
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-indigo-200 bg-white p-6 ai-glow mb-6" data-testid="ai-supplier-matches">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Sparkles className="text-white" size={16} /></div>
            <h2 className="font-display text-xl font-bold text-slate-900">AI Supplier Matches</h2>
          </div>
          <button onClick={() => navigate("/app/discover")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500">Browse marketplace <ArrowRight size={14} /></button>
        </div>
        <p className="text-sm text-slate-500 mb-5 ml-11 -mt-1">ExportPilot found <b>{k?.supplier_matches || 0} suppliers</b> matching your latest requirements.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => navigate("/app/discover")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left card-hover flex items-center justify-between">
          <div><div className="flex items-center gap-2 mb-1"><Search size={18} className="text-indigo-600" /><span className="font-display font-semibold text-slate-900">Discover Suppliers</span></div><p className="text-sm text-slate-500">Search verified exporters worldwide.</p></div>
          <ArrowRight className="text-slate-300" />
        </button>
        <button onClick={() => navigate("/app/rfqs/new")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left card-hover flex items-center justify-between">
          <div><div className="flex items-center gap-2 mb-1"><ClipboardList size={18} className="text-indigo-600" /><span className="font-display font-semibold text-slate-900">Create an RFQ</span></div><p className="text-sm text-slate-500">Post a requirement and let AI match suppliers.</p></div>
          <ArrowRight className="text-slate-300" />
        </button>
      </div>
    </PageShell>
  );
}
