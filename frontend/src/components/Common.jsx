import { AlertTriangle } from "lucide-react";

export function PageShell({ children, className = "" }) {
  return <div className={`px-8 py-8 max-w-[1400px] mx-auto w-full ${className}`}>{children}</div>;
}

export function PageHeader({ overline, title, subtitle, icon: Icon, ai, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        {overline && <div className="overline mb-2">{overline}</div>}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${ai ? "bg-indigo-600" : "bg-slate-900"}`}>
              <Icon className="text-white" size={20} strokeWidth={1.9} />
            </div>
          )}
          <h1 className="font-display text-3xl font-bold text-slate-900">{title}</h1>
        </div>
        {subtitle && <p className="text-slate-500 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Disclaimer({ text, className = "" }) {
  return (
    <div className={`flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 ${className}`} data-testid="disclaimer">
      <AlertTriangle size={14} className="shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export function HealthRing({ value, size = 56, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? "#059669" : value >= 50 ? "#D97706" : "#DC2626";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="absolute font-display font-bold text-slate-900" style={{ fontSize: size / 3.6 }}>
        {value}
      </span>
    </div>
  );
}
