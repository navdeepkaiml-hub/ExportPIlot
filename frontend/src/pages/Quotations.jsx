import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtUSD, fmtDate, stageColor } from "@/lib/format";
import { PageShell, PageHeader } from "@/components/Common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ArrowRight } from "lucide-react";

export default function Quotations() {
  const [quotes, setQuotes] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.listQuotations().then(setQuotes).catch(() => {}); }, []);

  return (
    <PageShell>
      <PageHeader overline="Core · Working now" title="Quotations" icon={FileText} subtitle="Every proforma invoice generated across your deals." />
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider">Quote #</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Buyer</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Product</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Incoterm</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-right">Total</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id} className="cursor-pointer" onClick={() => navigate(`/app/deals/${q.deal_id}?tab=quotation`)} data-testid={`quote-row-${q.number}`}>
                <TableCell className="font-mono text-xs text-slate-500">{q.number}</TableCell>
                <TableCell className="font-medium text-slate-900">{q.buyer}</TableCell>
                <TableCell className="text-slate-600">{q.product}</TableCell>
                <TableCell><span className="text-xs font-semibold bg-slate-100 rounded px-2 py-0.5">{q.incoterm}</span></TableCell>
                <TableCell className="text-right font-display font-bold text-slate-900">{fmtUSD(q.total_price, true)}</TableCell>
                <TableCell><span className="text-xs font-medium text-slate-600">{q.status}</span></TableCell>
                <TableCell className="text-slate-400 text-sm">{fmtDate(q.created_at)}</TableCell>
                <TableCell><ArrowRight size={15} className="text-slate-300" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!quotes.length && <div className="text-center text-sm text-slate-400 py-12">No quotations yet.</div>}
      </div>
    </PageShell>
  );
}
