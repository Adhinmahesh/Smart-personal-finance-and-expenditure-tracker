// ── Helpers ────────────────────────────────────────────────────────────────────
export const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Format an ISO date string (2026-07-18) as "Fri, Jul 18, 2026" */
export function fmtDueDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00"); // force local timezone
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Timezone-safe date → "YYYY-MM-DD" string.
 * NEVER use .toISOString().slice(0,10) because toISOString converts to UTC,
 * which shifts dates back by 1 day for IST/positive-offset timezones!
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get today's date as "YYYY-MM-DD" in local timezone */
export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/** Helper to check whether a loan has any completed/paid cycles */
export function hasLoanPayments(loan: { totalPaid?: number; payments?: { status?: string }[] }): boolean {
  return (loan.totalPaid ?? 0) > 0 || (loan.payments?.some(p => p.status === "on-time" || p.status === "late") ?? false);
}

/**
 * Universal helper to calculate the next due date for a loan based on reminder settings.
 *
 * Rules:
 * 1. If NO payments have been made (`!hasPayments`): anchor from `startDate`.
 *    - Put the reminder day into the start date's month.
 *    - If that date is before the start date, advance +1 month.
 * 2. If payments HAVE been made (`hasPayments === true`):
 *    - The start date is irrelevant. Use `currentNextDue`'s month.
 *    - Simply change the day within that month (the user hasn't paid that month yet).
 *    - Only advance if the resulting date is strictly before TODAY.
 */
/** Helper to extract the latest paid/completed due date string from a loan's payments */
export function getLatestPaidDueDate(loan: { payments?: { dueDate: string; status?: string; paidDate?: string | null }[] }): string | null {
  if (!loan.payments || loan.payments.length === 0) return null;
  const completed = loan.payments.filter(p => p.status === "on-time" || p.status === "late" || p.paidDate !== null);
  if (completed.length === 0) return null;
  return completed.reduce((max, p) => {
    const d = p.dueDate.split("T")[0];
    return d > max ? d : max;
  }, completed[0].dueDate.split("T")[0]);
}

export function computeLoanNextDue(
  startDateStr: string,
  currentNextDueStr: string | undefined | null,
  reminderType: "monthly" | "weekly",
  reminderDay: number,
  reminderWeekday: number,
  hasPayments: boolean,
  lastPaidDateStr?: string | null
): string {
  const start = new Date(startDateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (reminderType === "monthly") {
    const day = reminderDay || 16;

    if (hasPayments && (currentNextDueStr || lastPaidDateStr)) {
      // If currentNextDueStr is missing or <= lastPaidDateStr, anchor strictly after lastPaidDateStr
      let anchorStr = currentNextDueStr;
      if (!anchorStr || (lastPaidDateStr && anchorStr <= lastPaidDateStr)) {
        const refDate = new Date((lastPaidDateStr || startDateStr) + "T00:00:00");
        let nextMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, day);
        if (nextMonthDate.getTime() <= refDate.getTime()) {
          nextMonthDate = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, day);
        }
        while (nextMonthDate.getTime() < today.getTime()) {
          nextMonthDate = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, day);
        }
        return toLocalDateStr(nextMonthDate);
      }

      // Otherwise step day inside currentNextDue's month
      const currentDue = new Date(anchorStr + "T00:00:00");
      let dt = new Date(currentDue.getFullYear(), currentDue.getMonth(), day);
      while (dt.getTime() < today.getTime()) {
        dt = new Date(dt.getFullYear(), dt.getMonth() + 1, day);
      }
      return toLocalDateStr(dt);
    } else {
      // ── NO PAYMENTS: anchor from start date ──
      let dt = new Date(start.getFullYear(), start.getMonth(), day);
      if (dt.getTime() < start.getTime()) {
        dt = new Date(start.getFullYear(), start.getMonth() + 1, day);
      }
      return toLocalDateStr(dt);
    }
  } else {
    // ── WEEKLY ──
    const wd = reminderWeekday ?? 1;

    if (hasPayments && (currentNextDueStr || lastPaidDateStr)) {
      let anchorStr = currentNextDueStr;
      if (!anchorStr || (lastPaidDateStr && anchorStr <= lastPaidDateStr)) {
        const refDate = new Date((lastPaidDateStr || startDateStr) + "T00:00:00");
        let diff = (wd - refDate.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
        let dt = new Date(refDate);
        dt.setDate(refDate.getDate() + diff);
        while (dt.getTime() < today.getTime()) {
          dt.setDate(dt.getDate() + 7);
        }
        return toLocalDateStr(dt);
      }

      const currentDue = new Date(anchorStr + "T00:00:00");
      let diff = (wd - currentDue.getDay() + 7) % 7;
      let dt = new Date(currentDue);
      dt.setDate(currentDue.getDate() + diff);
      while (dt.getTime() < today.getTime()) {
        dt.setDate(dt.getDate() + 7);
      }
      return toLocalDateStr(dt);
    } else {
      // NO PAYMENTS: find first occurrence on or after start date
      let diff = (wd - start.getDay() + 7) % 7;
      let dt = new Date(start);
      dt.setDate(start.getDate() + diff);
      if (dt.getTime() < start.getTime()) {
        dt.setDate(dt.getDate() + 7);
      }
      return toLocalDateStr(dt);
    }
  }
}

interface Transaction {
    id: number;
    category: string;
    date: string;
    amount: number;
    notes: string;
    type: "expense" | "income";
}

export function computeMonthlyTrend(transactions: Transaction[]) {
  const grouped = transactions.reduce((acc, t) => {
    const d = new Date(t.date);
    const m = d.toLocaleString('default', { month: 'short' });
    if (!acc[m]) acc[m] = { month: m, income: 0, expenses: 0, savings: 0 };
    if (t.type === 'income') acc[m].income += t.amount;
    if (t.type === 'expense') acc[m].expenses += t.amount;
    acc[m].savings = acc[m].income - acc[m].expenses;
    return acc;
  }, {} as Record<string, any>);
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dynamicTrend = Object.values(grouped).sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  
  return dynamicTrend.length > 0 ? dynamicTrend : [{ month: "Current", income: 0, expenses: 0, savings: 0 }];
}
