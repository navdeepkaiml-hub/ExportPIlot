import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtUSD, countryFlag, timeAgo, stageColor, healthColor } from "@/lib/format";
import { PageShell, PageHeader } from "@/components/Common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, ArrowRight } from "lucide-react";

export default function Buyers() {
  const [buyers, setBuyers] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.listBuyers().then(setBuyers).catch(() => {}); }, []);

  return (
    <PageShell>
      <PageHeader overline="Core · Working now" title="Buyers" icon={Users} subtitle="Your international buyer CRM." />
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {["Buyer", "Country", "Active Deal", "Deal Value", "Stage", "Health", "Last Contact", ""].map((h) => (
                <TableHead key={h} className="text-[10px] uppercase tracking-wider">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyers.map((b) => {
              const hc = healthColor(b.health);
              return (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate(`/app/buyers/${b.id}`)} data-testid={`buyer-row-${b.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={b.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-slate-900">{b.name}</div>
                        <div className="text-xs text-slate-400">{b.contact_name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{countryFlag(b.country)} {b.country}</TableCell>
                  <TableCell className="text-slate-600">{b.active_deal}</TableCell>
                  <TableCell className="font-display font-bold text-slate-900">{fmtUSD(b.deal_value, true)}</TableCell>
                  <TableCell><span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${stageColor(b.stage)}`}>{b.stage}</span></TableCell>
                  <TableCell>{b.health ? <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hc.bg} ${hc.text}`}>{b.health}</span> : "—"}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{timeAgo(b.last_contact)}</TableCell>
                  <TableCell><ArrowRight size={15} className="text-slate-300" /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!buyers.length && <div className="text-center text-sm text-slate-400 py-12">No buyers yet.</div>}
      </div>
    </PageShell>
  );
}
