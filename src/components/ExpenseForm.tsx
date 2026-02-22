import { FormEvent, useMemo, useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { Expense } from '../types/models';
import { todayISO } from '../utils/date';

export function ExpenseForm({ existing, onDone }: { existing?: Expense; onDone?: () => void }) {
  const { categories, settings, upsertExpense } = useBudget();
  const activeCategories = useMemo(() => categories.filter((c) => !c.deletedAt), [categories]);

  const [amount, setAmount] = useState(existing?.amount.toString() ?? '');
  const [currency, setCurrency] = useState(existing?.currency ?? settings?.displayCurrency ?? 'RUB');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? activeCategories[0]?.id ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? todayISO());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;
    await upsertExpense({ id: existing?.id, amount: Number(amount), currency, categoryId, note, date });
    if (!existing) {
      setAmount('');
      setNote('');
      setDate(todayISO());
    }
    onDone?.();
  };

  return (
    <form className="card stack" onSubmit={submit}>
      <h3>{existing ? 'Редактировать расход' : 'Новый расход'}</h3>
      <div className="grid-row">
        <input type="number" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Expense['currency'])}>
          {[settings?.baseCurrency, ...(settings?.favoriteCurrencies ?? ['RUB', 'USD', 'EUR'])].filter(Boolean).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {activeCategories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input placeholder="Заметка" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="submit">Сохранить</button>
    </form>
  );
}
