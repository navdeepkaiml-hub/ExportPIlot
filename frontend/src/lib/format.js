export function fmtUSD(n, compact = false) {
  const v = Number(n || 0);
  if (compact) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  }
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) {
    const hrs = Math.floor(diff / 3600000);
    if (hrs <= 0) return "just now";
    return `${hrs}h ago`;
  }
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export const STAGES = ["New Inquiry", "Qualified", "Quotation Sent", "Negotiation", "Won", "Lost"];

export function healthColor(h) {
  if (h >= 75) return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "#059669", border: "border-emerald-200" };
  if (h >= 50) return { text: "text-amber-600", bg: "bg-amber-50", ring: "#D97706", border: "border-amber-200" };
  return { text: "text-rose-600", bg: "bg-rose-50", ring: "#DC2626", border: "border-rose-200" };
}

export function stageColor(stage) {
  const map = {
    "New Inquiry": "bg-slate-100 text-slate-700 border-slate-200",
    Qualified: "bg-sky-50 text-sky-700 border-sky-200",
    "Quotation Sent": "bg-indigo-50 text-indigo-700 border-indigo-200",
    Negotiation: "bg-amber-50 text-amber-700 border-amber-200",
    Won: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Lost: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return map[stage] || "bg-slate-100 text-slate-700 border-slate-200";
}

export function countryFlag(country) {
  const map = {
    "United Arab Emirates": "🇦🇪", Qatar: "🇶🇦", Germany: "🇩🇪",
    "Saudi Arabia": "🇸🇦", Singapore: "🇸🇬", India: "🇮🇳",
  };
  return map[country] || "🌐";
}
