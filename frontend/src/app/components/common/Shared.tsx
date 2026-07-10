import React from "react";
import { X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fmt } from "../../utils/formatters";

export const inputCls = "w-full bg-neu shadow-neu-pressed border-0 text-foreground text-base rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground";
export const btnPrimary = "w-full bg-primary text-white text-base font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors";
export const btnGhost = "w-full bg-muted text-foreground text-base font-medium py-2.5 rounded-lg hover:bg-secondary transition-colors";

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neu shadow-neu-flat rounded-[2rem] p-3 shadow-xl text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neu shadow-neu-flat rounded-[2rem] shadow-2xl w-full max-w-md z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export function MetricCard({ label, value, sub, icon: Icon, color, trend, trendLabel }: {
  label: string; value: string; sub?: string; icon: any; color: string;
  trend?: "up" | "down" | "neutral"; trendLabel?: string;
}) {
  return (
    <div className="relative bg-neu shadow-neu-flat rounded-[2rem] p-6 transition-all hover:shadow-neu-sm group">
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <span className="text-[#1e293b] text-sm font-semibold uppercase tracking-wider">{label}</span>
          <div>
            <p className="text-2xl font-bold text-[#000000] tracking-tight">{value}</p>
            {sub && <p className="text-sm text-[#1e293b] mt-1">{sub}</p>}
          </div>
        </div>
        <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-neu-flat bg-neu">
          <Icon size={24} style={{ color }} />
        </div>
      </div>
      {trendLabel && (
        <div className="mt-5 flex items-center gap-2 relative z-10">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full shadow-neu-pressed ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-[#1e293b]"}`}>
            {trend === "up" && <ArrowUpRight size={14} />}
            {trend === "down" && <ArrowDownRight size={14} />}
          </div>
          <span className={`text-sm font-medium ${trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-[#1e293b]"}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export type Period = "daily" | "monthly" | "yearly";
export interface DateSel { period: Period; value: string; }
const YEARS = ["2024", "2025", "2026"];

export function DatePeriodFilter({ sel, onChange }: { sel: DateSel; onChange: (s: DateSel) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg border border-border">
        {(["daily", "monthly", "yearly"] as Period[]).map(p => (
          <button key={p} onClick={() => onChange({ period: p, value: p === "daily" ? new Date().toISOString().slice(0, 10) : p === "monthly" ? new Date().toISOString().slice(0, 7) : "2026" })}
            className={`px-3 py-1 rounded-md text-sm font-medium capitalize transition-all
              ${sel.period === p ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {p}
          </button>
        ))}
      </div>
      {sel.period === "daily" && (
        <input type="date" value={sel.value} onChange={e => onChange({ ...sel, value: e.target.value })}
          className="text-sm bg-neu shadow-neu-pressed border-0 text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
      )}
      {sel.period === "monthly" && (
        <input type="month" value={sel.value} onChange={e => onChange({ ...sel, value: e.target.value })}
          className="text-sm bg-neu shadow-neu-pressed border-0 text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
      )}
      {sel.period === "yearly" && (
        <select value={sel.value} onChange={e => onChange({ ...sel, value: e.target.value })}
          className="text-sm bg-neu shadow-neu-pressed border-0 text-foreground rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
      )}
    </div>
  );
}

export function applyPeriodFilter(txns: any[], sel: DateSel): any[] {
  if (sel.period === "daily") return txns.filter(t => t.date === sel.value);
  if (sel.period === "monthly") return txns.filter(t => t.date.startsWith(sel.value));
  return txns.filter(t => t.date.startsWith(sel.value));
}

export function periodLabel(sel: DateSel): string {
  if (sel.period === "daily") return sel.value;
  if (sel.period === "monthly") {
    const [y, m] = sel.value.split("-");
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
  }
  return sel.value;
}

export function CircularProgress({ percentage }: { percentage: number }) {
  const dash = 283;
  const offset = dash - (dash * percentage) / 100;
  return (
    <div className="relative w-48 h-48 rounded-full shadow-neu-flat flex items-center justify-center p-4">
       <div className="w-full h-full rounded-full shadow-neu-pressed flex items-center justify-center relative bg-neu">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="none" stroke="transparent" strokeWidth="10" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#purpleGradient)" strokeWidth="10" strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <span className="text-3xl font-bold text-[#000000] tracking-tight">{percentage}%</span>
       </div>
    </div>
  );
}

export function PillGraph({ data }: { data: { label: string; value: number; colorFrom: string; colorTo: string; percent: number }[] }) {
   return (
      <div className="flex justify-between items-end gap-5 h-32 px-2 mt-8 w-full max-w-[240px]">
         {data.map(item => (
            <div key={item.label} className="flex flex-col items-center gap-3 w-full">
              <div className="w-6 h-24 bg-neu shadow-neu-pressed rounded-full relative flex items-end p-1 justify-center">
                 <div className="w-4 rounded-full" style={{ height: `${item.percent}%`, background: `linear-gradient(to top, ${item.colorTo}, ${item.colorFrom})` }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#1e293b] uppercase tracking-wider">{item.label}</p>
                <p className="text-sm font-bold text-[#000000]">{item.percent}%</p>
              </div>
            </div>
         ))}
      </div>
   );
}
