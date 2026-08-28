import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useRole } from "@/context/RoleContext";
import {
  Compass, Store, ShoppingBag, ArrowRight, Search, Brain, Handshake, ShieldCheck,
  FileText, Package, Wallet, Globe2, Check, X, Sparkles,
} from "lucide-react";

const WORKFLOW = [
  { label: "Discover", icon: Search }, { label: "AI Match", icon: Brain },
  { label: "Negotiate", icon: Handshake }, { label: "Protected Trade", icon: ShieldCheck },
  { label: "Export", icon: Package }, { label: "Get Paid", icon: Wallet },
];

const FEATURES = [
  { icon: Globe2, title: "Find Global Buyers", desc: "Live buyer RFQs from markets worldwide, matched to your catalog." },
  { icon: Store, title: "Find Verified Suppliers", desc: "Source from exporters with verification, ratings and response times." },
  { icon: Brain, title: "AI-Powered Matching", desc: "Requirements matched to the right counterpart with clear reasoning." },
  { icon: Handshake, title: "AI Negotiation", desc: "A copilot that analyses objections and drafts margin-safe replies." },
  { icon: ShieldCheck, title: "Payment Protection", desc: "Funds held in a protected transaction until release conditions are met." },
  { icon: FileText, title: "Export Documents", desc: "A complete document pack generated from real deal data in one click." },
  { icon: Package, title: "Trade Management", desc: "Every buyer, deal, quote and shipment in one connected workspace." },
  { icon: Wallet, title: "Secure Payouts", desc: "Transparent 0.5% fee and clear payouts on every completed trade." },
];

const COMPARE = [
  ["Finding buyers manually", "AI buyer & seller matching"],
  ["Endless email chains", "Centralized conversations"],
  ["Spreadsheets & manual quotes", "AI pricing & quotations"],
  ["Guesswork in negotiation", "AI negotiation copilot"],
  ["Hours of document prep", "One-click export pack"],
  ["Payment uncertainty", "Payment protection"],
  ["Missed follow-ups", "AI follow-ups"],
];

export default function Landing() {
  const navigate = useNavigate();
  const { setRole } = useRole();
  const go = (r) => { setRole(r); navigate("/app"); };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center"><Compass className="text-white" size={18} /></div>
            <span className="font-display font-bold text-[15px]">ExportPilot <span className="text-indigo-600">AI</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => go("buyer")} className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">For Buyers</button>
            <button onClick={() => go("seller")} data-testid="header-try-demo" className="bg-slate-900 text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors">Try Demo</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1920&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 relative">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-4xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 mb-6"><Sparkles size={13} /> AI infrastructure for global trade</span>
            <h1 className="font-display font-bold text-slate-900 leading-[0.98] text-5xl sm:text-6xl lg:text-7xl tracking-tight">
              Export Globally.<br /><span className="text-indigo-600">As Easily As Selling Locally.</span>
            </h1>
            <p className="text-lg text-slate-600 mt-6 leading-relaxed max-w-2xl">
              ExportPilot helps small businesses find global buyers, discover trusted suppliers, negotiate deals with AI and manage international trade — all from one platform.
            </p>
          </motion.div>

          {/* Two equal paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-12">
            {[
              { role: "seller", icon: Store, kicker: "I'M AN EXPORTER", title: "Find global buyers and grow your exports.", cta: "Start Selling Globally", accent: "bg-slate-900", border: "hover:border-slate-900" },
              { role: "buyer", icon: ShoppingBag, kicker: "I'M A BUYER", title: "Discover exporters and source products worldwide.", cta: "Find Global Suppliers", accent: "bg-indigo-600", border: "hover:border-indigo-500" },
            ].map((o, i) => (
              <motion.button
                key={o.role} onClick={() => go(o.role)} data-testid={`landing-role-${o.role}`}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }}
                className={`group text-left rounded-2xl border-2 border-slate-200 ${o.border} bg-white p-7 transition-all card-hover`}
              >
                <div className={`h-12 w-12 rounded-xl ${o.accent} flex items-center justify-center mb-4`}><o.icon className="text-white" size={24} strokeWidth={1.8} /></div>
                <div className="overline text-[10px] mb-2">{o.kicker}</div>
                <div className="font-display text-xl font-bold text-slate-900 mb-5 leading-snug">{o.title}</div>
                <span className={`inline-flex items-center gap-2 ${o.accent} text-white rounded-full px-5 py-2.5 text-sm font-semibold group-hover:gap-3 transition-all`}>{o.cta} <ArrowRight size={15} /></span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="overline text-indigo-300 mb-3">The entire journey</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold max-w-2xl">One platform. The entire global trade journey.</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-12">
            {WORKFLOW.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="relative rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="h-11 w-11 rounded-xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-3"><s.icon className="text-indigo-300" size={22} /></div>
                <div className="text-[10px] text-slate-400 font-semibold">STEP {i + 1}</div>
                <div className="font-display font-semibold text-sm mt-0.5">{s.label}</div>
                {i < WORKFLOW.length - 1 && <ArrowRight className="hidden md:block absolute top-1/2 -right-2.5 text-white/20" size={16} />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.05 }} className="rounded-2xl border border-slate-200 bg-white p-6 card-hover">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4"><f.icon className="text-indigo-600" size={21} strokeWidth={1.8} /></div>
              <h3 className="font-display font-semibold text-slate-900 text-[17px]">{f.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BUILT FOR SMALL BUSINESS */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-slate-900 max-w-3xl leading-tight">Global trade shouldn't require a large export department.</h2>
          <p className="text-lg text-slate-600 mt-5 max-w-2xl">ExportPilot gives small businesses the tools to discover international opportunities, negotiate confidently and manage exports — without building a complicated trade operation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="overline text-slate-400 mb-4">Traditional Exporting</div>
              <ul className="space-y-3">
                {COMPARE.map(([t]) => <li key={t} className="flex items-center gap-3 text-[15px] text-slate-500"><span className="h-6 w-6 rounded-full bg-rose-50 flex items-center justify-center shrink-0"><X size={13} className="text-rose-500" /></span> {t}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-indigo-200 bg-white p-7 ai-glow">
              <div className="overline text-indigo-600 mb-4">ExportPilot</div>
              <ul className="space-y-3">
                {COMPARE.map(([, e]) => <li key={e} className="flex items-center gap-3 text-[15px] font-medium text-slate-800"><span className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><Check size={13} className="text-emerald-600" /></span> {e}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900">Start trading globally in minutes.</h2>
        <p className="text-slate-500 mt-3">Jump into a fully-loaded demo — no signup required.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button onClick={() => go("seller")} data-testid="cta-seller" className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-7 py-3.5 text-sm font-semibold hover:bg-slate-800 transition-colors">I'm an Exporter <ArrowRight size={16} /></button>
          <button onClick={() => go("buyer")} data-testid="cta-buyer" className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-full px-7 py-3.5 text-sm font-semibold hover:bg-indigo-500 transition-colors">I'm a Buyer <ArrowRight size={16} /></button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3"><div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center"><Compass className="text-white" size={15} /></div><span className="font-display font-bold text-white">ExportPilot</span></div>
              <p className="text-sm text-slate-400 max-w-xs">AI-powered infrastructure for global trade.</p>
            </div>
            {[
              ["Product", ["For Exporters", "For Buyers", "Features", "Roadmap"]],
              ["Company", ["About", "Contact", "Security"]],
              ["Legal", ["Terms", "Privacy"]],
            ].map(([h, items]) => (
              <div key={h}>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{h}</div>
                <ul className="space-y-2">{items.map((x) => <li key={x}><span className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">{x}</span></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 text-xs text-slate-500 flex flex-wrap justify-between gap-2">
            <span>© 2026 ExportPilot AI. Competition MVP.</span>
            <span>Documents & pricing are AI-generated drafts — verify before sending.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
