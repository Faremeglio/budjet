import { FormEvent, useMemo, useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { Expense } from '../types/models';
import { todayISO, uid } from '../utils/date';

interface Props {
  existing?: Expense;
  onDone?: () => void;
}

export function ExpenseForm({ existing, onDone }: Props) {
  const { categories, settings, addOrUpdateExpense } = useBudget();
  const activeCategories = useMemo(() => categories.filter((c) => !c.archived), [categories]);

  const [amount, setAmount] = useState(existing?.amount.toString() ?? '');
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [currency, setCurrency] = useState(existing?.currency ?? settings?.displayCurrency ?? 'RUB');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? activeCategories[0]?.id ?? '');
  const [note, setNote] = useState(existing?.note ?? '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    await addOrUpdateExpense({
      id: existing?.id ?? uid(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      amount: Number(amount),
      date,
      currency,
      categoryId,
      note: note || undefined
    });

    if (!existing) {
      setAmount('');
      setNote('');
      setDate(todayISO());
    }
    onDone?.();
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>{existing ? 'Редактировать расход' : 'Новый расход'}</h3>
      <div className="grid-row">
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="Сумма"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Expense['currency'])}>
          {(settings?.favoriteCurrencies ?? ['RUB', 'USD', 'EUR']).map((code) => (
            <option key={code}>{code}</option>
          ))}
        </select>
      </div>

      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
        {activeCategories.map((category) => (
          <option value={category.id} key={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input placeholder="Заметка (опционально)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="submit">{existing ? 'Сохранить' : 'Добавить'}</button>
    </form>
  );
}
