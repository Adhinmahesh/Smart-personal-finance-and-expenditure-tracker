import { describe, it, expect } from 'vitest';
import { fmt, computeMonthlyTrend } from '../formatters';

describe('fmt (currency formatter)', () => {
  it('formats positive numbers with ₹ symbol', () => {
    expect(fmt(1000)).toBe('₹1,000');
  });

  it('formats zero correctly', () => {
    expect(fmt(0)).toBe('₹0');
  });

  it('formats negative amounts', () => {
    const res = fmt(-500);
    expect(res).toContain('-');
    expect(res).toContain('500');
  });

  it('formats decimal amounts properly', () => {
    expect(fmt(1234.56)).toContain('1,234.56');
  });
});

describe('computeMonthlyTrend', () => {
  it('returns fallback array when transactions list is empty', () => {
    const trend = computeMonthlyTrend([]);
    expect(trend).toEqual([{ month: 'Current', income: 0, expenses: 0, savings: 0 }]);
  });

  it('aggregates income, expenses, and savings grouped by month', () => {
    const transactions = [
      { id: 1, category: 'Salary', date: '2026-06-01', amount: 50000, notes: '', type: 'income' as const },
      { id: 2, category: 'Food', date: '2026-06-15', amount: 10000, notes: '', type: 'expense' as const },
      { id: 3, category: 'Bonus', date: '2026-07-01', amount: 20000, notes: '', type: 'income' as const }
    ];

    const trend = computeMonthlyTrend(transactions);
    expect(trend).toHaveLength(2);

    const june = trend.find(m => m.month === 'Jun');
    expect(june).toBeDefined();
    expect(june?.income).toBe(50000);
    expect(june?.expenses).toBe(10000);
    expect(june?.savings).toBe(40000);

    const july = trend.find(m => m.month === 'Jul');
    expect(july).toBeDefined();
    expect(july?.income).toBe(20000);
    expect(july?.expenses).toBe(0);
    expect(july?.savings).toBe(20000);
  });
});
