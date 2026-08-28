import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtMoney } from "@/lib/format";
import { PageShell, PageHeader } from "@/components/Common";
import { StatCard, EmptyState } from "@/components/Widgets";
import { ShoppingBag, CreditCard, ShieldCheck, ArrowRight, Package } from "lucide-react";

const STATUS_STYLE = {
  "Payment Pending": "bg-amber-50 text-amber-700 border-amber-200",
  "Payment Protected": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Fulfillment In Progress": "bg-sky-50 text-sky-700 border-sky-200",
  "Release Pending": "bg-violet-50 text-violet-700 border-violet-200",
  "Payout Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function Orders() {
  const [txns, setTxns] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.listTransactions().then(setTxns); }, []);

  const spend = txns.reduce((s, t) => s + t.value, 0);
  const protectedCount = txns.filter((t) => t.paid).length;

  return (
    <PageShell>
      <PageHeader overline="Buyer workspace" title="My Orders" icon={ShoppingBag} subtitle="Track your protected purchases from payment to delivery." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Purchase Value" value={fmtMoney(spend, "USD", true)} icon={CreditCard} tone="slate" />
        <StatCard label="Protected" value={protectedCount} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Total Orders" value={txns.length} icon={ShoppingBag} tone="indigo" />
        <StatCard label="In Fulfillment" value={txns.filter((t) => t.status === "Fulfillment In Progress").length} icon={Package} tone="sky" />
      </div>
      {txns.length ? (
        <div className="space-y-3">
          {txns.map((t) => (
            <div key={t.id} onClick={() => navigate(`/app/transactions/${t.id}`)} className="rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer card-hover flex items-center justify-between gap-4" data-testid={`order-${t.id}`}>
              <div><div className="font-display font-semibold text-slate-900">{t.product}</div><div className="text-sm text-slate-500 mt-0.5">{t.number} · {t.seller_name} · {t.quantity}</div></div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                <span className="font-display font-bold text-slate-900">{fmtMoney(t.value, t.currency, true)}</span>
                <ArrowRight size={16} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ShoppingBag} title="No orders yet" desc="Discover suppliers and protect your first transaction to start an order." action={{ label: "Discover Suppliers", onClick: () => navigate("/app/discover") }} />
      )}
    </PageShell>
  );
}
