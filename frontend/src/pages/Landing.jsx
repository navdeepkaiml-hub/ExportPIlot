import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass, Brain, DollarSign, Handshake, PackageCheck, Clock, ArrowRight,
  Video, Ship, CreditCard, Building2, Sparkles, Check,
} from "lucide-react";

const WORKFLOW = ["Buyer Inquiry", "AI Understands", "Quote", "Negotiate", "Export Pack", "Follow-up"];

const FEATURES = [
  { icon: Brain, title: "Understand Buyers", desc: "Paste any buyer message and ExportPilot extracts product, quantity, destination, incoterm and what's missing." },
  { icon: DollarSign, title: "Quote Smarter", desc: "Build costed quotations with a live margin simulator so you never discount below your floor." },
  { icon: Handshake, title: "Negotiate Better", desc: "An AI copilot analyses buyer objections and drafts margin-safe responses you can approve and send." },
  { icon: PackageCheck, title: "Export in One Click", desc: "Generate a 7-document export pack — proforma, invoice, packing list, contract and more — from real deal data." },
  { icon: Clock, title: "Never Lose a Lead", desc: "AI follow-ups keep every high-value opportunity moving, prioritised by value and days since contact." },
];

const EXPANSION = [
  { icon: Video, title: "Global Communication", desc: "Video calls & live voice translation" },
  { icon: Ship, title: "Logistics", desc: "Freight marketplace & shipment tracking" },
  { icon: CreditCard, title: "Trade Finance", desc: "Working capital for confirmed orders" },
  { icon: Building2, title: "Enterprise", desc: "Teams, SSO, ERP & compliance" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Compass className="text-white" size={18} />
            </div>
            <span className="font-display font-bold text-[15px]">ExportPilot <span className="text-indigo-600">AI</span></span>
          </div>
          <Link to="/app" data-testid="header-try-demo" className="bg-slate-900 text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors">
            Try Demo
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1626428091984-48f9ffbf927c?auto=format&fit=crop&w=1920&q=80)", backgroundSize: "cover" }}
        />
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 relative">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 mb-6">
              <Sparkles size={13} /> Your AI Export Department
            </span>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-900 leading-[1.05]">
              Turn buyer inquiries into <span className="text-indigo-600">closed export orders</span>.
            </h1>
            <p className="text-lg text-slate-600 mt-6 leading-relaxed max-w-2xl">
              ExportPilot turns international buyer inquiries into quotations, negotiations, export documents and
              follow-ups — from one AI-powered workspace built for small and medium exporters.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link to="/app" data-testid="hero-try-demo" className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-full px-6 py-3 text-sm font-semibold hover:bg-slate-800 transition-colors">
                Try Demo <ArrowRight size={16} />
              </Link>
              <a href="#how" data-testid="hero-how-it-works" className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-full px-6 py-3 text-sm font-semibold hover:border-slate-300 transition-colors">
                See How It Works
              </a>
            </div>
          </motion.div>

          {/* Workflow strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-16 flex flex-wrap items-center gap-2" id="how">
            {WORKFLOW.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className="text-[10px] text-slate-400 font-semibold">STEP {i + 1}</div>
                  <div className="font-display font-semibold text-slate-900 text-sm">{step}</div>
                </div>
                {i < WORKFLOW.length - 1 && <ArrowRight className="text-slate-300" size={18} />}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="overline mb-3">One connected workflow</div>
        <h2 className="font-display text-4xl font-bold text-slate-900 max-w-2xl">Everything an export desk does — assisted by AI.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border border-slate-200 bg-white p-7 card-hover ${i === 0 ? "lg:col-span-2 lg:row-span-1" : ""}`}
            >
              <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-5">
                <f.icon className="text-indigo-600" size={22} strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-xl font-semibold text-slate-900">{f.title}</h3>
              <p className="text-slate-500 mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="overline mb-3 text-indigo-300">The bigger vision</div>
          <h2 className="font-display text-4xl font-bold max-w-2xl">Built for the future of global trade.</h2>
          <p className="text-slate-300 mt-4 max-w-2xl">
            The AI export workflow is live today. Next, ExportPilot expands into communication, logistics, finance and
            enterprise trade infrastructure.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
            {EXPANSION.map((e) => (
              <div key={e.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <e.icon className="text-indigo-300 mb-4" size={26} strokeWidth={1.6} />
                <h3 className="font-display font-semibold text-lg">{e.title}</h3>
                <p className="text-slate-400 text-sm mt-1.5">{e.desc}</p>
                <span className="inline-block mt-4 text-[10px] uppercase font-bold tracking-wider text-slate-400 border border-white/15 rounded-full px-2 py-0.5">Upcoming</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-4xl font-bold text-slate-900">Ready to run your export desk with AI?</h2>
        <p className="text-slate-500 mt-3">Jump straight into a fully-loaded demo workspace — no signup required.</p>
        <Link to="/app" data-testid="cta-try-demo" className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-full px-8 py-3.5 text-sm font-semibold hover:bg-indigo-500 transition-colors mt-8">
          Enter Demo Workspace <ArrowRight size={16} />
        </Link>
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-500" /> No login required</span>
          <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-500" /> Realistic demo data</span>
          <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-500" /> Full AI workflow</span>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        ExportPilot AI · Competition MVP · Documents and pricing are AI-generated drafts — verify before sending.
      </footer>
    </div>
  );
}
