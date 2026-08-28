import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { PageShell, PageHeader } from "@/components/Common";
import { ClipboardList, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Product", "Quantity & Quality", "Destination", "Incoterm & Payment", "Delivery", "Review"];
const CATEGORIES = ["Agri & Food", "Spices", "Textiles", "Beverages"];
const COUNTRIES = ["United Arab Emirates", "Germany", "Qatar", "Singapore", "Saudi Arabia", "Netherlands", "Japan", "United States"];
const INCOTERMS = ["EXW", "FOB", "CFR", "CIF"];

function Input({ label, ...props }) {
  return <div><label className="overline block mb-1.5 text-[9px]">{label}</label><input {...props} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>;
}
function Select({ label, options, ...props }) {
  return <div><label className="overline block mb-1.5 text-[9px]">{label}</label><select {...props} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>;
}

export default function RFQCreate() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [f, setF] = useState({
    product: "", category: "Agri & Food", grade: "", quantity: "", quantity_value: 0, unit: "MT",
    destination: "", country: "United Arab Emirates", incoterm: "CIF", payment_terms: "30% advance, 70% on documents",
    target_price: 0, delivery: "Within 30-45 days", industry: "Import & Distribution", buyer_name: "Global Buyer Co.",
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const canNext = () => {
    if (step === 0) return f.product && f.category;
    if (step === 1) return f.quantity;
    if (step === 2) return f.destination && f.country;
    return true;
  };

  const publish = async () => {
    setSaving(true);
    try {
      const r = await api.createRfq({ ...f, quantity_value: parseFloat(f.quantity) || 0, target_price: parseFloat(f.target_price) || 0 });
      toast.success("RFQ published — finding suppliers");
      navigate(`/app/rfqs/${r.id}`);
    } catch { toast.error("Could not publish RFQ"); } finally { setSaving(false); }
  };

  return (
    <PageShell className="!max-w-3xl">
      <PageHeader overline="Buyer workspace" title="Create RFQ" icon={ClipboardList} subtitle="Post a requirement in a few steps and let AI match suppliers." />

      <div className="flex items-center gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5 flex-1">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>{i < step ? <Check size={14} /> : i + 1}</div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-emerald-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="overline mb-5">Step {step + 1} · {STEPS[step]}</div>
        <div className="space-y-4">
          {step === 0 && <><Input label="Product" placeholder="e.g. Premium Makhana" value={f.product} onChange={(e) => set("product", e.target.value)} data-testid="rfq-product" /><Select label="Category" options={CATEGORIES} value={f.category} onChange={(e) => set("category", e.target.value)} data-testid="rfq-category" /></>}
          {step === 1 && <div className="grid grid-cols-2 gap-4"><Input label="Quantity" placeholder="e.g. 10 MT" value={f.quantity} onChange={(e) => set("quantity", e.target.value)} data-testid="rfq-quantity" /><Input label="Grade / Quality" placeholder="e.g. 5 Sutta HS" value={f.grade} onChange={(e) => set("grade", e.target.value)} /></div>}
          {step === 2 && <div className="grid grid-cols-2 gap-4"><Input label="Destination City/Port" placeholder="e.g. Dubai" value={f.destination} onChange={(e) => set("destination", e.target.value)} data-testid="rfq-destination" /><Select label="Country" options={COUNTRIES} value={f.country} onChange={(e) => set("country", e.target.value)} data-testid="rfq-country" /></div>}
          {step === 3 && <div className="grid grid-cols-2 gap-4"><Select label="Incoterm" options={INCOTERMS} value={f.incoterm} onChange={(e) => set("incoterm", e.target.value)} data-testid="rfq-incoterm" /><Input label="Target Price (USD)" type="number" value={f.target_price} onChange={(e) => set("target_price", e.target.value)} /><div className="col-span-2"><Input label="Payment Terms" value={f.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} /></div></div>}
          {step === 4 && <><Input label="Delivery Requirement" value={f.delivery} onChange={(e) => set("delivery", e.target.value)} /><Input label="Industry" value={f.industry} onChange={(e) => set("industry", e.target.value)} /></>}
          {step === 5 && (
            <div className="space-y-2 text-sm" data-testid="rfq-review">
              {[["Product", f.product], ["Category", f.category], ["Quantity", f.quantity], ["Grade", f.grade || "—"], ["Destination", `${f.destination}, ${f.country}`], ["Incoterm", f.incoterm], ["Target Price", f.target_price ? `$${f.target_price}` : "—"], ["Payment", f.payment_terms], ["Delivery", f.delivery]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-100 py-2"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-900">{v}</span></div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} data-testid="rfq-back" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-40"><ArrowLeft size={15} /> Back</button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => canNext() ? setStep((s) => s + 1) : toast.error("Please complete this step")} data-testid="rfq-next" className="inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors">Continue <ArrowRight size={15} /></button>
          ) : (
            <button onClick={publish} disabled={saving} data-testid="rfq-publish" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-70">{saving ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />} Publish & Find Suppliers</button>
          )}
        </div>
      </motion.div>
    </PageShell>
  );
}
