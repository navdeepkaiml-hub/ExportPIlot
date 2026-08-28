import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { fmtMoney, countryFlag, timeAgo } from "@/lib/format";
import { PageShell, PageHeader } from "@/components/Common";
import { EmptyState, MatchScore } from "@/components/Widgets";
import { ClipboardList, Plus, ArrowRight } from "lucide-react";

export default function MyRFQs() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { api.listRfqs().then(setRfqs).finally(() => setLoading(false)); }, []);

  return (
    <PageShell>
      <PageHeader
        overline="Buyer workspace" title="My RFQs" icon={ClipboardList}
        subtitle="Your requests for quotation. ExportPilot matches each one with suppliers."
        actions={<button onClick={() => navigate("/app/rfqs/new")} data-testid="create-rfq-btn" className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"><Plus size={16} /> Create RFQ</button>}
      />
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer" />)}</div>
      ) : rfqs.length ? (
        <div className="space-y-3">
          {rfqs.map((r) => (
            <div key={r.id} onClick={() => navigate(`/app/rfqs/${r.id}`)} className="rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer card-hover flex items-center justify-between gap-4" data-testid={`myrfq-${r.id}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-slate-900">{r.product}</span>
                  <span className="text-xs font-medium bg-slate-100 rounded-full px-2 py-0.5">{r.status}</span>
                </div>
                <div className="text-sm text-slate-500 mt-1">{r.quantity} · {r.incoterm} · {countryFlag(r.country)} {r.destination} · {r.offers_count} offers</div>
              </div>
              <div className="flex items-center gap-4">
                {r.match_score != null && <MatchScore score={r.match_score} />}
                <span className="font-display font-bold text-slate-900">{fmtMoney(r.target_price, r.currency, true)}</span>
                <ArrowRight className="text-slate-300" size={16} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="No active RFQs yet" desc="Create your first Request for Quotation and let ExportPilot find matching suppliers." action={{ label: "Create RFQ", onClick: () => navigate("/app/rfqs/new") }} />
      )}
    </PageShell>
  );
}
