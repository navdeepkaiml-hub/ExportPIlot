import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtUSD, countryFlag } from "@/lib/format";
import { PageShell, PageHeader } from "@/components/Common";
import { ExportPackPanel } from "@/components/ExportPackPanel";
import { PackageCheck } from "lucide-react";

export default function ExportPack() {
  const [deals, setDeals] = useState([]);
  const [dealId, setDealId] = useState("");

  useEffect(() => {
    api.listDeals().then((ds) => {
      const eligible = ds.filter((d) => !["Lost"].includes(d.stage));
      setDeals(eligible);
      if (eligible.length) setDealId(eligible[0].id);
    });
  }, []);

  const deal = deals.find((d) => d.id === dealId);

  return (
    <PageShell>
      <PageHeader
        overline="Core · Working now" title="Export Pack" icon={PackageCheck}
        subtitle="Generate a complete, review-ready export document pack for any deal in one click."
        actions={
          <select value={dealId} onChange={(e) => setDealId(e.target.value)} data-testid="export-deal-select" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white">
            {deals.map((d) => <option key={d.id} value={d.id}>{d.buyer_name} — {d.product}</option>)}
          </select>
        }
      />
      {deal ? <ExportPackPanel key={deal.id} deal={deal} /> : <div className="h-64 rounded-2xl shimmer" />}
    </PageShell>
  );
}
