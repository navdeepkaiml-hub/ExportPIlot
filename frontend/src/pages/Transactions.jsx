import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtMoney, timeAgo } from "@/lib/format";
import { PageShell, PageHeader } from "@/components/Common";
import { EmptyState } from "@/components/Widgets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Plus, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLE = {
  "Payment Pending": "bg-amber-50 text-amber-700 border-amber-200",
  "Payment Protected": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Fulfillment In Progress": "bg-sky-50 text-sky-700 border-sky-200",
  "Release Pending": "bg-violet-50 text-violet-700 border-violet-200",
  "Payout Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function Transactions() {
  const [txns, setTxns] = useState([]);
  const [deals, setDeals] = useState([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = () => api.listTransactions().then(setTxns);
  useEffect(() => { load(); api.listDeals().then((d) => setDeals(d.filter((x) => ["Won", "Negotiation", "Quotation Sent"].includes(x.stage)))); }, []);

  const createFromDeal = async (deal) => {
    setCreating(true);
    try {
      const t = await api.createTransaction({ deal_id: deal.id, buyer_name: deal.buyer_name, product: deal.product, quantity: deal.quantity, value: deal.deal_value, currency: "USD" });
      toast.success("Protected transaction created");
      setOpen(false);
      navigate(`/app/transactions/${t.id}`);
    } catch { toast.error("Could not create transaction"); } finally { setCreating(false); }
  };

  return (
    <PageShell>
      <PageHeader
        overline="Trade with confidence" title="Protected Transactions" icon={ShieldCheck}
        subtitle="Fund and track escrow-style transactions from payment to payout."
        actions={<button onClick={() => setOpen(true)} data-testid="new-transaction-btn" className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"><Plus size={16} /> Protect a Deal</button>}
      />
      {txns.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">{["Transaction", "Buyer", "Product", "Value", "Payout", "Status", ""].map((h) => <TableHead key={h} className="text-[10px] uppercase tracking-wider">{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {txns.map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/app/transactions/${t.id}`)} data-testid={`txn-row-${t.id}`}>
                  <TableCell className="font-mono text-xs text-slate-500">{t.number}</TableCell>
                  <TableCell className="font-medium text-slate-900">{t.buyer_name}</TableCell>
                  <TableCell className="text-slate-600">{t.product}</TableCell>
                  <TableCell className="font-display font-bold text-slate-900">{fmtMoney(t.value, t.currency, true)}</TableCell>
                  <TableCell className="text-slate-600">{fmtMoney(t.payout, t.currency, true)}</TableCell>
                  <TableCell><span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[t.status]}`}>{t.status}</span></TableCell>
                  <TableCell><ArrowRight size={15} className="text-slate-300" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={ShieldCheck} title="No protected transactions yet" desc="Protect a deal to hold the buyer's payment securely until fulfillment conditions are met." action={{ label: "Protect a Deal", onClick: () => setOpen(true) }} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="protect-deal-dialog">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-600" /> Protect a Deal</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {deals.map((d) => (
              <button key={d.id} onClick={() => createFromDeal(d)} disabled={creating} className="w-full text-left rounded-xl border border-slate-200 p-4 hover:border-indigo-300 transition-colors flex items-center justify-between disabled:opacity-60" data-testid={`protect-deal-${d.id}`}>
                <div><div className="font-display font-semibold text-slate-900 text-sm">{d.buyer_name}</div><div className="text-xs text-slate-500">{d.product} · {d.quantity}</div></div>
                <div className="flex items-center gap-2"><span className="font-display font-bold text-slate-900">{fmtMoney(d.deal_value, "USD", true)}</span>{creating ? <Loader2 className="animate-spin text-slate-400" size={15} /> : <ArrowRight size={15} className="text-slate-300" />}</div>
              </button>
            ))}
            {!deals.length && <div className="text-sm text-slate-400 text-center py-8">No eligible deals to protect.</div>}
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
