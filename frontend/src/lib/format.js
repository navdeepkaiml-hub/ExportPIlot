export const CURRENCY = {
  USD: { symbol: "$", locale: "en-US" }, EUR: { symbol: "€", locale: "de-DE" },
  GBP: { symbol: "£", locale: "en-GB" }, INR: { symbol: "₹", locale: "en-IN" },
  SGD: { symbol: "S$", locale: "en-SG" }, JPY: { symbol: "¥", locale: "ja-JP" },
  AUD: { symbol: "A$", locale: "en-AU" }, AED: { symbol: "AED ", locale: "en-AE" },
};

export const COUNTRY_CURRENCY = {
  "United Arab Emirates": "USD", Qatar: "USD", Germany: "EUR", "Saudi Arabia": "USD",
  Singapore: "SGD", India: "INR", "United Kingdom": "GBP", "United States": "USD",
  Netherlands: "EUR", France: "EUR", Japan: "JPY", Australia: "AUD",
};

export function fmtMoney(n, code = "USD", compact = false) {
  const c = CURRENCY[code] || CURRENCY.USD;
  const v = Number(n || 0);
  if (compact) {
    if (v >= 1_000_000) return `${c.symbol}${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${c.symbol}${(v / 1_000).toFixed(1)}K`;
    return `${c.symbol}${v.toFixed(v % 1 === 0 ? 0 : 2)}`;
  }
  return `${c.symbol}${v.toLocaleString(c.locale, { maximumFractionDigits: 2 })}`;
}

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
