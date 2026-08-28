import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtUSD, countryFlag } from "@/lib/format";
import { Disclaimer } from "@/components/Common";
import { SendToBuyerDialog } from "@/components/SendToBuyerDialog";
import { PackageCheck, Zap, Eye, Download, FileText, Loader2, CheckCircle2, Send, Rocket } from "lucide-react";
import { toast } from "sonner";

const DOC_LIST = ["Proforma Invoice", "Commercial Invoice", "Packing List", "Sales Contract", "Product Specification", "Shipping Instructions", "Export Document Checklist"];

export function ExportPackPanel({ deal, onChange }) {
  const [docs, setDocs] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  useEffect(() => {
    api.listDocuments(deal.id).then((d) => { setDocs(d); if (d.length) setReady(true); }).catch(() => {});
  }, [deal.id]);

  const generate = async () => {
    setGenerating(true); setReady(false);
    try {
      await new Promise((r) => setTimeout(r, 900));
      const res = await api.generateExportPack(deal.id);
      setDocs(res.documents); setReady(true);
      toast.success(`${res.count} documents prepared`);
      onChange?.();
    } catch { toast.error("Could not generate export pack"); } finally { setGenerating(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 ai-glow">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><PackageCheck className="text-white" size={16} /></div>
            <div><div className="overline text-indigo-600">Signature feature</div><div className="font-display font-bold text-slate-900">One-Click Export Pack</div></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {[["Buyer", deal.buyer_name], ["Product", deal.product], ["Quantity", deal.quantity], ["Destination", `${countryFlag(deal.country)} ${deal.destination || deal.country}`], ["Incoterm", deal.incoterm], ["Order Value", fmtUSD(deal.deal_value, true)]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{k}</div>
                <div className="text-sm font-medium text-slate-900 truncate">{v}</div>
              </div>
            ))}
          </div>

          <Disclaimer text="AI-generated drafts/templates — review before sending." className="mb-5" />

          {!ready ? (
            <button onClick={generate} disabled={generating} data-testid="generate-export-pack-btn" className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-5 py-4 text-base font-bold hover:bg-indigo-500 transition-colors disabled:opacity-70">
              {generating ? <><Loader2 className="animate-spin" size={20} /> Generating documents…</> : <><Zap size={20} /> Generate Export Pack</>}
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid="export-pack-ready">
              <div className="flex items-center gap-2 text-emerald-600 mb-4">
                <CheckCircle2 size={20} />
                <span className="font-display text-lg font-bold text-slate-900">Export Pack Ready</span>
                <span className="text-sm text-slate-500">· {docs.length} documents prepared</span>
              </div>
              <div className="space-y-2">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors" data-testid={`doc-${d.type}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><FileText size={15} className="text-slate-500" /></div>
                      <span className="text-sm font-medium text-slate-900 truncate">{d.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a href={api.docUrl(d.id)} target="_blank" rel="noreferrer" data-testid={`doc-preview-${d.type}`} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"><Eye size={13} /> Preview</a>
                      <a href={api.docDownloadUrl(d.id)} data-testid={`doc-download-${d.type}`} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"><Download size={13} /> Download</a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sticky top-24">
          <div className="overline mb-3">Documents included</div>
          <ul className="space-y-2 mb-6">
            {DOC_LIST.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 size={14} className={ready ? "text-emerald-500" : "text-slate-300"} /> {d}</li>
            ))}
          </ul>
          <button onClick={() => setSendOpen(true)} disabled={!ready} data-testid="export-send-buyer-btn" className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-5 py-4 text-base font-bold hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Rocket size={18} /> Send to Buyer
          </button>
          {!ready && <p className="text-xs text-slate-400 text-center mt-2">Generate the pack to enable sending</p>}
        </div>
      </div>

      <SendToBuyerDialog deal={deal} open={sendOpen} onOpenChange={setSendOpen} onSent={onChange} />
    </div>
  );
}
