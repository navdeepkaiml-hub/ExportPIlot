import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtMoney } from "@/lib/format";
import { PageShell, PageHeader } from "@/components/Common";
import { StatCard, EmptyState } from "@/components/Widgets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, TrendingUp, Receipt, Clock, CheckCircle2 } from "lucide-react";

export default function Payouts() {
  const [txns, setTxns] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.listTransactions().then(setTxns); }, []);

  const paid = txns.filter((t) => t.paid);
  const gross = paid.reduce((s, t) => s + t.value, 0);
  const fees = paid.reduce((s, t) => s + t.commission, 0);
  const completed = paid.filter((t) => t.status === "Payout Completed").reduce((s, t) => s + t.payout, 0);
  const pending = paid.filter((t) => t.status !== "Payout Completed").reduce((s, t) => s + t.payout, 0);

  return (
    <PageShell>
      <PageHeader overline="Seller earnings" title="Payouts" icon={Wallet} subtitle="Your protected earnings, fees and payouts across all transactions." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Gross Value" value={fmtMoney(gross, "USD", true)} icon={TrendingUp} tone="slate" />
        <StatCard label="ExportPilot Fees" value={fmtMoney(fees, "USD", true)} icon={Receipt} tone="rose" sub="0.5% per transaction" />
        <StatCard label="Pending Payout" value={fmtMoney(pending, "USD", true)} icon={Clock} tone="amber" />
        <StatCard label="Net Earnings" value={fmtMoney(completed, "USD", true)} icon={CheckCircle2} tone="emerald" />
      </div>
      {paid.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">{["Transaction", "Buyer", "Value", "Fee", "Payout", "Status"].map((h) => <TableHead key={h} className="text-[10px] uppercase tracking-wider">{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {paid.map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/app/transactions/${t.id}`)} data-testid={`payout-row-${t.id}`}>
                  <TableCell className="font-mono text-xs text-slate-500">{t.number}</TableCell>
                  <TableCell className="font-medium text-slate-900">{t.buyer_name}</TableCell>
                  <TableCell>{fmtMoney(t.value, t.currency, true)}</TableCell>
                  <TableCell className="text-rose-600">− {fmtMoney(t.commission, t.currency, true)}</TableCell>
                  <TableCell className="font-display font-bold text-emerald-600">{fmtMoney(t.payout, t.currency, true)}</TableCell>
                  <TableCell><span className="text-xs font-medium text-slate-600">{t.status}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={Wallet} title="No payouts yet" desc="Once buyers fund protected transactions, your earnings and payouts will appear here." action={{ label: "View Transactions", onClick: () => navigate("/app/transactions") }} />
      )}
    </PageShell>
  );
}
