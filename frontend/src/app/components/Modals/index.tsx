import React, { useState } from "react";
import { Clock } from "lucide-react";
import { Category, Transaction, Loan, BudgetItem } from "../../types";
import { inputCls, btnPrimary, btnGhost, Modal, Field } from "../common/Shared";
import { ICON_OPTIONS, COLOR_OPTIONS, LOAN_TYPES, WEEKDAY_NAMES } from "../../utils/constants";
import { fmt, toLocalDateStr, todayStr, fmtDueDate, computeLoanNextDue, hasLoanPayments } from "../../utils/formatters";

export function AddExpenseModal({ categories, onSave, onClose }: {
  categories: Category[];
  onSave: (t: Omit<Transaction, "id">) => void;
  onClose: () => void;
}) {
  const expCats = categories.filter(c => c.type === "expense" || c.type === "both");
  const [form, setForm] = useState({ category: expCats[0]?.name ?? "", date: todayStr(), amount: "", notes: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.amount || !form.category) return;
    onSave({ category: form.category, date: form.date, amount: parseFloat(form.amount), notes: form.notes, type: "expense" });
    onClose();
  };
  return (
    <Modal title="Add Expense" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Category">
          <select value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
            {expCats.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Amount (₹)">
          <input type="number" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Notes (optional)">
          <input type="text" placeholder="Add a note..." value={form.notes} onChange={e => set("notes", e.target.value)} className={inputCls} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={save} className={btnPrimary}>Add Expense</button>
        </div>
      </div>
    </Modal>
  );
}

export function AddIncomeModal({ categories, onSave, onClose }: {
  categories: Category[];
  onSave: (t: Omit<Transaction, "id">) => void;
  onClose: () => void;
}) {
  const incCats = categories.filter(c => c.type === "income" || c.type === "both");
  const [form, setForm] = useState({ category: incCats[0]?.name ?? "Salary", date: todayStr(), amount: "", notes: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.amount || !form.category) return;
    onSave({ category: form.category, date: form.date, amount: parseFloat(form.amount), notes: form.notes, type: "income" });
    onClose();
  };
  return (
    <Modal title="Add Income" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Source">
          <select value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
            {incCats.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Amount (₹)">
          <input type="number" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Notes (optional)">
          <input type="text" placeholder="Add a note..." value={form.notes} onChange={e => set("notes", e.target.value)} className={inputCls} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={save} className={btnPrimary}>Add Income</button>
        </div>
      </div>
    </Modal>
  );
}

export function CategoryModal({ existing, onSave, onClose }: {
  existing?: Category;
  onSave: (c: Omit<Category, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    icon: existing?.icon ?? "🍽️",
    color: existing?.color ?? "#3b82f6",
    type: (existing?.type ?? "expense") as Category["type"],
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };
  return (
    <Modal title={existing ? "Edit Category" : "Add Category"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Name">
          <input type="text" placeholder="Category name" value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={e => set("type", e.target.value)} className={inputCls}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="both">Both</option>
          </select>
        </Field>
        <Field label="Icon">
          <div className="flex flex-wrap gap-2 mt-1">
            {ICON_OPTIONS.map(icon => (
              <button key={icon} onClick={() => set("icon", icon)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border ${form.icon === icon ? "border-primary bg-primary/15" : "border-border bg-muted hover:border-primary/50"}`}>
                {icon}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Color">
          <div className="flex gap-2 flex-wrap mt-1">
            {COLOR_OPTIONS.map(color => (
              <button key={color} onClick={() => set("color", color)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === color ? "border-white scale-110" : "border-transparent"}`}
                style={{ background: color }} />
            ))}
          </div>
        </Field>
        <div className="pt-2 p-3 rounded-lg bg-neu shadow-neu-pressed border-0 flex items-center gap-3">
          <span className="text-2xl">{form.icon}</span>
          <div>
            <p className="text-base font-medium text-foreground">{form.name || "Preview"}</p>
            <p className="text-sm text-muted-foreground capitalize">{form.type}</p>
          </div>
          <span className="ml-auto w-3 h-3 rounded-full" style={{ background: form.color }} />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={save} className={btnPrimary}>{existing ? "Save Changes" : "Add Category"}</button>
        </div>
      </div>
    </Modal>
  );
}

export function AddLoanModal({ onSave, onClose }: { onSave: (l: Omit<Loan, "id" | "payments" | "totalPaid">) => void; onClose: () => void; }) {
  const [form, setForm] = useState({ title: "", type: "Gold Loan", startDate: todayStr(), endDate: "", reminderType: "monthly" as "monthly" | "weekly", reminderDay: "16", reminderWeekday: "1", notes: "", error: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v, error: "" }));
  const save = () => {
    if (!form.title.trim()) return;
    // Validate reminder day
    if (form.reminderType === "monthly") {
      const day = parseInt(form.reminderDay);
      if (!day || day < 1 || day > 31) {
        setForm(f => ({ ...f, error: "Reminder date must be between 1 and 31" }));
        return;
      }
    }
    const nextDue = computeLoanNextDue(
      form.startDate,
      null,
      form.reminderType,
      parseInt(form.reminderDay) || 16,
      parseInt(form.reminderWeekday),
      false
    );
    onSave({
      title: form.title, type: form.type, startDate: form.startDate, endDate: form.endDate,
      reminderType: form.reminderType, reminderDay: parseInt(form.reminderDay) || 16,
      reminderWeekday: parseInt(form.reminderWeekday), nextDue, notes: form.notes, status: "active",
    });
    onClose();
  };
  return (
    <Modal title="Add New Loan" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Loan Title">
          <input type="text" placeholder="e.g. Gold Loan — SBI" value={form.title} onChange={e => set("title", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Loan Type">
          <select value={form.type} onChange={e => set("type", e.target.value)} className={inputCls}>
            {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date">
            <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className={inputCls} />
          </Field>
          <Field label="End Date (opt.)">
            <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Reminder Type">
          <div className="flex gap-2">
            {(["monthly", "weekly"] as const).map(rt => (
              <button key={rt} onClick={() => set("reminderType", rt)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${form.reminderType === rt
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-neu-pressed"
                  : "bg-neu shadow-neu-flat text-muted-foreground hover:text-foreground border border-transparent"}`}>
                {rt}
              </button>
            ))}
          </div>
        </Field>
        {form.error && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium">
            {form.error}
          </div>
        )}
        {form.reminderType === "monthly" ? (
          <Field label="Default Reminder Date (1–31)">
            <input type="number" min={1} max={31} value={form.reminderDay} onChange={e => set("reminderDay", e.target.value)} className={inputCls} />
          </Field>
        ) : (
          <Field label="Default Reminder Day">
            <select value={form.reminderWeekday} onChange={e => set("reminderWeekday", e.target.value)} className={inputCls}>
              {WEEKDAY_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Notes (optional)">
          <input type="text" placeholder="Bank name, account details..." value={form.notes} onChange={e => set("notes", e.target.value)} className={inputCls} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={save} className={btnPrimary}>Add Loan</button>
        </div>
      </div>
    </Modal>
  );
}

export function PayLoanModal({ loan, onPay, onClose }: { loan: Loan; onPay: (loanId: number, amount: number) => void; onClose: () => void; }) {
  const [amount, setAmount] = useState("");
  const save = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    onPay(loan.id, n);
    onClose();
  };
  const reminderLabel = loan.reminderType === "monthly"
    ? `Monthly on ${loan.reminderDay}th`
    : `Weekly on ${WEEKDAY_NAMES[loan.reminderWeekday]}`;
  return (
    <Modal title={`Pay — ${loan.title}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 flex items-center gap-2">
          <Clock size={13} />
          <span>Due date: <strong>{fmtDueDate(loan.nextDue)}</strong> · Reminder: {reminderLabel}</span>
        </div>
        <Field label="Amount Paid (₹)">
          <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} autoFocus />
        </Field>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={save} className={btnPrimary}>Confirm Payment</button>
        </div>
      </div>
    </Modal>
  );
}

export function ChangeDueDateModal({ loan, onSave, onClose }: {
  loan: Loan;
  onSave: (loanId: number, newValue: number, changeType: "temporary" | "permanent") => void;
  onClose: () => void;
}) {
  const [changeType, setChangeType] = useState<"temporary" | "permanent">("temporary");
  const isMonthly = loan.reminderType === "monthly";
  const [newDay, setNewDay] = useState(String(loan.reminderDay));
  const [newWeekday, setNewWeekday] = useState(String(loan.reminderWeekday));
  const [error, setError] = useState("");

  const previewDate = computeLoanNextDue(
    loan.startDate,
    loan.nextDue,
    loan.reminderType,
    isMonthly ? (parseInt(newDay) || loan.reminderDay) : loan.reminderDay,
    isMonthly ? loan.reminderWeekday : parseInt(newWeekday),
    hasLoanPayments(loan)
  );

  const save = () => {
    if (isMonthly) {
      const d = parseInt(newDay);
      if (!d || d < 1 || d > 31) {
        setError("Reminder date must be between 1 and 31");
        return;
      }
      onSave(loan.id, d, changeType);
    } else {
      const wd = parseInt(newWeekday);
      if (wd < 0 || wd > 6) return;
      onSave(loan.id, wd, changeType);
    }
    onClose();
  };

  const currentDefault = isMonthly
    ? `${loan.reminderDay}th of every month`
    : `Every ${WEEKDAY_NAMES[loan.reminderWeekday]}`;

  const tempLabel = isMonthly ? "Change This Month Only" : "Change This Week Only";
  const permLabel = isMonthly ? "Change Default Date" : "Change Default Day";
  const tempDesc = isMonthly
    ? "Only the current month uses the new date. Future reminders revert to the default."
    : "Only the current week uses the new day. Future reminders revert to the default.";
  const permDesc = isMonthly
    ? "The default reminder date is updated. All future reminders use the new date permanently."
    : "The default reminder day is updated. All future reminders use the new day permanently.";

  const previewMsg = (() => {
    if (isMonthly) {
      return changeType === "temporary"
        ? `Next payment will be due on ${previewDate}. After that, reminder reverts to the ${loan.reminderDay}th.`
        : `All future reminders will be set to the ${newDay}th of each month. Next due: ${previewDate}.`;
    } else {
      const selectedDay = WEEKDAY_NAMES[parseInt(newWeekday)] || "—";
      return changeType === "temporary"
        ? `This week's reminder moves to ${selectedDay} (${previewDate}). Next week reverts to ${WEEKDAY_NAMES[loan.reminderWeekday]}.`
        : `All future reminders will be on ${selectedDay}. Next due: ${previewDate}.`;
    }
  })();

  return (
    <Modal title={`Change ${isMonthly ? "Due Date" : "Reminder Day"} — ${loan.title}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Change Type</label>
          <div className="space-y-2">
            {([["temporary", tempLabel, tempDesc], ["permanent", permLabel, permDesc]] as const).map(([t, lbl, desc]) => (
              <button key={t} onClick={() => setChangeType(t as "temporary" | "permanent")}
                className={`w-full text-left p-3 rounded-xl border transition-all ${changeType === t ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:border-primary/40"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${changeType === t ? "border-primary" : "border-muted-foreground"}`}>
                    {changeType === t && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-base font-medium text-foreground">{lbl}</span>
                </div>
                <p className="text-sm text-muted-foreground pl-5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-neu shadow-neu-pressed border-0">
              <p className="text-sm text-muted-foreground">Current Default</p>
              <p className="text-base font-semibold text-foreground mt-0.5">{currentDefault}</p>
            </div>
            <div className="p-3 rounded-lg bg-neu shadow-neu-pressed border-0">
              <p className="text-sm text-muted-foreground">Next Due (current)</p>
              <p className="text-base font-semibold text-amber-400 mt-0.5 font-mono">{fmtDueDate(loan.nextDue)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium">
            {error}
          </div>
        )}

        {isMonthly ? (
          <Field label={changeType === "temporary" ? "New Due Date for This Month (1–31)" : "New Default Reminder Date (1–31)"}>
            <input type="number" min={1} max={31} value={newDay}
              onChange={e => { setNewDay(e.target.value); setError(""); }} className={inputCls} autoFocus />
          </Field>
        ) : (
          <Field label={changeType === "temporary" ? "New Reminder Day for This Week" : "New Default Reminder Day"}>
            <select value={newWeekday} onChange={e => setNewWeekday(e.target.value)} className={inputCls}>
              {WEEKDAY_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
          </Field>
        )}

        <div className={`p-3 rounded-lg border text-sm ${changeType === "temporary" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-primary/10 border-primary/20 text-primary"}`}>
          {previewMsg}
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={save} className={btnPrimary}>Apply Change</button>
        </div>
      </div>
    </Modal>
  );
}

export function AddBudgetModal({ categories, onSave, onClose }: {
  categories: Category[];
  onSave: (b: Omit<BudgetItem, "id">) => void;
  onClose: () => void;
}) {
  const expCats = categories.filter(c => c.type === "expense" || c.type === "both");
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [form, setForm] = useState({ category: expCats[0]?.name ?? "", daily: "", month: currentMonth });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const monthly = Math.round((parseFloat(form.daily) || 0) * 30);
  const save = () => {
    if (!form.daily || !form.category || !form.month) return;
    onSave({ category: form.category, daily: parseFloat(form.daily), monthly, month: form.month });
    onClose();
  };
  return (
    <Modal title="Add Budget Category" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Month">
          <input type="month" value={form.month} onChange={e => set("month", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={e => set("category", e.target.value)} className={inputCls}>
            {expCats.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </Field>
        <Field label="Daily Budget (₹)">
          <input type="number" placeholder="0" value={form.daily} onChange={e => set("daily", e.target.value)} className={inputCls} />
        </Field>
        {parseFloat(form.daily) > 0 && (
          <div className="p-3 rounded-lg bg-neu shadow-neu-pressed border-0 text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Weekly estimate</span>
              <span className="font-mono text-foreground">{fmt(Math.round(parseFloat(form.daily) * 7))}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Monthly (×30)</span>
              <span className="font-mono text-primary font-semibold">{fmt(monthly)}</span>
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className={btnGhost}>Cancel</button>
          <button onClick={save} className={btnPrimary}>Add Budget</button>
        </div>
      </div>
    </Modal>
  );
}
