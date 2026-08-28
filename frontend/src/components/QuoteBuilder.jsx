import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { fmtUSD } from "@/lib/format";
import { Disclaimer } from "@/components/Common";
import { SendToBuyerDialog } from "@/components/SendToBuyerDialog";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Calculator, Sparkles, FileText, Download, Send, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { API } from "@/lib/api";

const INCOTERMS = ["EXW", "FOB", "CFR", "CIF"];

function CostInput({ label, value, onChange, prefix = "$" }) {
  return (
    <div>
      <label className="overline block mb-1.5 text-[9px]">{label}</label>
      <div className="flex items-center rounded-lg border border-slate-200 focus-within:border-indigo-400 transition-colors">
        <span className="pl-3 text-slate-400 text-sm">{prefix}</span>
        <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full bg-transparent px-2 py-2 text-sm outline-none" />
      </div>
    </div>
  );
}

function quotationHtml(q, deal) {
  return `<!doctype html><html><head><meta charset='utf-8'><title>${q.number}</title>
<style>body{font-family:Arial,sans-serif;color:#0F172A;padding:40px;max-width:800px;margin:auto}
.disc{background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;padding:8px 14px;border-radius:8px;font-size:12px;margin-bottom:20px}
h1{margin:0}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{border:1px solid #E2E8F0;padding:10px;text-align:left;font-size:13px}
th{background:#F8FAFC}.row{display:flex;justify-content:space-between;font-size:13px;margin:4px 0}.k{color:#64748B}</style></head>
<body><div class='disc'>⚠ AI-generated draft — verify before sending.</div>
<div style="display:flex;justify-content:space-between"><div><h1>Proforma Invoice</h1><div style="color:#64748B">${q.exporter}</div></div>
<div style="text-align:right;color:#64748B">Ref: ${q.number}<br>${new Date().toLocaleDateString()}</div></div><hr>
<div class='row'><span class='k'>Buyer</span><span>${q.buyer} (${q.buyer_country})</span></div>
<div class='row'><span class='k'>Incoterm</span><span>${q.incoterm} ${q.destination}</span></div>
<table><tr><th>Description</th><th>Quantity</th><th>Unit Price (USD)</th><th>Amount (USD)</th></tr>
<tr><td>${q.product} (${q.grade})</td><td>${q.quantity}</td><td>${q.unit_price.toLocaleString()}</td><td>${q.total_price.toLocaleString()}</td></tr></table>
<div class='row'><span class='k'>Payment Terms</span><span>${q.payment_terms}</span></div>
<div class='row'><span class='k'>Delivery</span><span>${q.delivery}</span></div>
<div class='row'><span class='k'>Validity</span><span>${q.validity}</span></div>
<h2 style="text-align:right">Total: USD ${q.total_price.toLocaleString()}</h2>
<p style="color:#64748B;font-size:12px">${q.notes}</p></body></html>`;
}

export function QuoteBuilder({ deal, onChange }) {
  const base = deal.deal_value || 4200;
  const [inputs, setInputs] = useState({
    product_cost: Math.round(base * 0.62), packaging_cost: Math.round(base * 0.04),
    inland_transport: Math.round(base * 0.03), freight: Math.round(base * 0.05),
    insurance: Math.round(base * 0.01), other_costs: Math.round(base * 0.02),
    desired_margin: 15, incoterm: deal.incoterm || "CIF", quantity: deal.quantity_value || 1,
  });
  const [result, setResult] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [sim, setSim] = useState(null);
  const [quote, setQuote] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const set = (k, v) => setInputs((s) => ({ ...s, [k]: v }));

  const calculate = async () => {
    const res = await api.calcPricing(inputs);
    setResult(res); setSim(null); setDiscount(0);
    toast.success("Pricing calculated");
  };

  const runSim = async (d) => {
    setDiscount(d);
    if (!result) return;
    const s = await api.simulate({ total_cost: result.total_estimated_cost, base_selling_price: result.recommended_selling_price, discount_pct: d });
    setSim(s);
  };

  const generateQuote = async () => {
    setGenLoading(true);
    try {
      const unit = result ? (sim ? sim.new_selling_price / inputs.quantity : result.unit_price) : undefined;
      const q = await api.createQuotation({ deal_id: deal.id, unit_price: unit ? Math.round(unit * 100) / 100 : undefined });
      setQuote(q);
      toast.success(`Quotation ${q.number} generated`);
      onChange?.();
    } catch { toast.error("Could not generate quotation"); } finally { setGenLoading(false); }
  };

  const download = () => {
    if (!quote) return;
    const blob = new Blob([quotationHtml(quote, deal)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${quote.number}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quote Builder */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><DollarSign className="text-white" size={16} /></div>
          <div><div className="overline text-indigo-600">AI Pricing Engine</div><div className="font-display font-bold text-slate-900">Quote Builder</div></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CostInput label="Product Cost" value={inputs.product_cost} onChange={(v) => set("product_cost", v)} />
          <CostInput label="Packaging Cost" value={inputs.packaging_cost} onChange={(v) => set("packaging_cost", v)} />
          <CostInput label="Inland Transport" value={inputs.inland_transport} onChange={(v) => set("inland_transport", v)} />
          <CostInput label="Freight" value={inputs.freight} onChange={(v) => set("freight", v)} />
          <CostInput label="Insurance" value={inputs.insurance} onChange={(v) => set("insurance", v)} />
          <CostInput label="Other Costs" value={inputs.other_costs} onChange={(v) => set("other_costs", v)} />
          <CostInput label="Desired Margin" value={inputs.desired_margin} onChange={(v) => set("desired_margin", v)} prefix="%" />
          <div>
            <label className="overline block mb-1.5 text-[9px]">Incoterm</label>
            <div className="flex gap-1">
              {INCOTERMS.map((t) => (
                <button key={t} onClick={() => set("incoterm", t)} data-testid={`incoterm-${t}`} className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors ${inputs.incoterm === t ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={calculate} data-testid="calculate-pricing-btn" className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-indigo-500 transition-colors">
          <Calculator size={16} /> Calculate
        </button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 grid grid-cols-2 gap-3" data-testid="pricing-result">
            {[["Total est. cost", fmtUSD(result.total_estimated_cost)], ["Recommended price", fmtUSD(result.recommended_selling_price)], ["Estimated margin", `${result.estimated_margin_pct}%`], ["Total order value", fmtUSD(result.total_order_value)]].map(([k, v], i) => (
              <div key={k} className={`rounded-xl p-4 ${i === 1 ? "bg-slate-900 text-white" : "bg-slate-50 border border-slate-100"}`}>
                <div className={`text-[10px] uppercase font-bold tracking-wider ${i === 1 ? "text-slate-300" : "text-slate-400"}`}>{k}</div>
                <div className={`font-display text-lg font-bold ${i === 1 ? "text-white" : "text-slate-900"}`}>{v}</div>
              </div>
            ))}
            <Disclaimer text="Estimated — confirm actual transaction and logistics costs." className="col-span-2" />
          </motion.div>
        )}
      </div>

      {/* Margin simulator + quotation */}
      <div className="space-y-6">
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid="margin-simulator">
            <div className="overline mb-4">Margin Simulator</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">Discount</span>
              <span className="font-display font-bold text-slate-900">{discount}%</span>
            </div>
            <Slider value={[discount]} max={12} step={1} onValueChange={(v) => runSim(v[0])} data-testid="discount-slider" className="my-3" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center"><div className="text-[10px] uppercase font-bold text-slate-400">Current</div><div className="font-display font-bold text-slate-900">{(sim?.current_margin_pct ?? result.estimated_margin_pct)}%</div></div>
              <div className="text-center"><div className="text-[10px] uppercase font-bold text-slate-400">Discount</div><div className="font-display font-bold text-amber-600">{discount}%</div></div>
              <div className="text-center"><div className="text-[10px] uppercase font-bold text-slate-400">New margin</div><div className={`font-display font-bold ${(sim?.new_margin_pct ?? result.estimated_margin_pct) < 8 ? "text-rose-600" : "text-emerald-600"}`}>{sim?.new_margin_pct ?? result.estimated_margin_pct}%</div></div>
            </div>
            {sim && <div className="mt-4 flex items-start gap-2 bg-indigo-50/60 rounded-lg px-3 py-2.5"><Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" /><p className="text-[13px] text-slate-700">{sim.recommendation}</p></div>}
          </motion.div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><FileText size={18} className="text-slate-700" /><span className="font-display font-bold text-slate-900">Quotation</span></div>
          </div>
          {!quote ? (
            <>
              <p className="text-sm text-slate-500 mb-4">Generate a professional proforma invoice using this deal's data.</p>
              <button onClick={generateQuote} disabled={genLoading} data-testid="generate-quotation-btn" className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-70">
                {genLoading ? <><Loader2 className="animate-spin" size={16} /> Generating…</> : <><FileText size={16} /> Generate Quotation</>}
              </button>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="quotation-preview">
              <div className="rounded-xl border border-slate-200 p-5 text-sm">
                <div className="flex justify-between items-start mb-3">
                  <div><div className="font-display font-bold text-slate-900">Proforma Invoice</div><div className="text-xs text-slate-400">{quote.number}</div></div>
                  <div className="text-right text-xs text-slate-500">{quote.exporter}</div>
                </div>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between"><span>Buyer</span><span className="text-slate-900 font-medium">{quote.buyer}</span></div>
                  <div className="flex justify-between"><span>Product</span><span className="text-slate-900 font-medium">{quote.product}</span></div>
                  <div className="flex justify-between"><span>Quantity</span><span className="text-slate-900 font-medium">{quote.quantity}</span></div>
                  <div className="flex justify-between"><span>Unit Price</span><span className="text-slate-900 font-medium">{fmtUSD(quote.unit_price)}</span></div>
                  <div className="flex justify-between"><span>Incoterm</span><span className="text-slate-900 font-medium">{quote.incoterm} {quote.destination}</span></div>
                  <div className="flex justify-between"><span>Payment</span><span className="text-slate-900 font-medium text-right max-w-[60%]">{quote.payment_terms}</span></div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 mt-2"><span className="font-semibold text-slate-900">Total Order Value</span><span className="font-display font-bold text-slate-900">{fmtUSD(quote.total_price)}</span></div>
                </div>
              </div>
              <Disclaimer text="AI-generated draft — verify before sending." className="mt-3" />
              <div className="flex gap-2 mt-3">
                <a href={API + `/deals/${deal.id}/quotation`} onClick={(e) => e.preventDefault()} />
                <button onClick={download} data-testid="quotation-download-btn" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold hover:border-slate-300 transition-colors"><Download size={15} /> Download</button>
                <button onClick={() => setSendOpen(true)} data-testid="quotation-send-btn" className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"><Send size={15} /> Send to Buyer</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <SendToBuyerDialog deal={deal} open={sendOpen} onOpenChange={setSendOpen} onSent={onChange} />
    </div>
  );
}
