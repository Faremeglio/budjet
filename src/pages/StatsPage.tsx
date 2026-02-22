import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useBudget } from '../store/BudgetContext';
import { PeriodFilter } from '../types/models';
import { getPeriodRange, monthKey } from '../utils/date';

const dayLabels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function StatsPage() {
  const { expenses, categories, convertToDisplay, settings } = useBudget();
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [year, setYear] = useState(new Date().getFullYear());
  const range = getPeriodRange(period);

  const filtered = useMemo(() => expenses.filter((e) => e.date >= range.start && e.date <= range.end), [expenses, range.start, range.end]);
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((e) => m.set(e.categoryId, (m.get(e.categoryId) ?? 0) + convertToDisplay(e.amount, e.currency)));
    return [...m.entries()].map(([id, value]) => ({
      name: categories.find((c) => c.id === id)?.name ?? 'Без категории',
      color: categories.find((c) => c.id === id)?.color ?? '#94a3b8',
      value
    }));
  }, [filtered, categories, convertToDisplay]);

  const byWeekday = useMemo(() => {
    const v = Array.from({ length: 7 }, (_, i) => ({ name: dayLabels[i], value: 0, weekend: i === 0 || i === 6 }));
    filtered.forEach((e) => {
      const day = new Date(e.date).getDay();
      v[day].value += convertToDisplay(e.amount, e.currency);
    });
    return v;
  }, [filtered, convertToDisplay]);

  const byMonth = useMemo(() => {
    const v = Array.from({ length: 12 }, (_, i) => ({ name: String(i + 1).padStart(2, '0'), value: 0 }));
    expenses.forEach((e) => {
      const [y, m] = monthKey(e.date).split('-');
      if (Number(y) === year) v[Number(m) - 1].value += convertToDisplay(e.amount, e.currency);
    });
    return v;
  }, [expenses, year, convertToDisplay]);

  return <div className="stack">
    <section className="card"><h3>Период</h3><div className="actions-inline">{(['week', 'month', 'year', 'last30'] as PeriodFilter[]).map((p)=><button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p}</button>)}</div></section>
    <section className="card chart-card"><h3>По категориям ({settings?.displayCurrency})</h3><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label>{byCategory.map((x)=><Cell key={x.name} fill={x.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></section>
    <section className="card chart-card"><h3>По дням недели</h3><ResponsiveContainer width="100%" height={220}><BarChart data={byWeekday}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value">{byWeekday.map((d)=><Cell key={d.name} fill={d.weekend ? '#f43f5e':'#6366f1'} />)}</Bar></BarChart></ResponsiveContainer></section>
    <section className="card chart-card"><h3>По месяцам</h3><input type="number" value={year} onChange={(e)=>setYear(Number(e.target.value))} /><ResponsiveContainer width="100%" height={220}><BarChart data={byMonth}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#22c55e" /></BarChart></ResponsiveContainer></section>
  </div>;
}
