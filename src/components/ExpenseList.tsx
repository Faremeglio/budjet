import { useMemo, useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { Expense } from '../types/models';
import { formatDateLabel } from '../utils/date';
import { ExpenseForm } from './ExpenseForm';

export function ExpenseList() {
  const { expenses, categories, removeExpense, convertToDisplay, settings } = useBudget();
  const [editing, setEditing] = useState<Expense | null>(null);

  const grouped = useMemo(() => {
    return expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
      acc[expense.date] ||= [];
      acc[expense.date].push(expense);
      return acc;
    }, {});
  }, [expenses]);

  return (
    <div className="stack">
      {editing && <ExpenseForm existing={editing} onDone={() => setEditing(null)} />}
      {Object.entries(grouped).map(([date, list]) => (
        <section className="card" key={date}>
          <h3>{formatDateLabel(date)}</h3>
          {list.map((expense) => {
            const category = categories.find((c) => c.id === expense.categoryId);
            const converted = convertToDisplay(expense.amount, expense.currency);
            return (
              <article className="expense-item" key={expense.id}>
                <div>
                  <span className="dot" style={{ background: category?.color }} />
                  <strong>{category?.name ?? 'Без категории'}</strong>
                  <p>{expense.note ?? '—'}</p>
                </div>
                <div className="align-right">
                  <div>
                    {converted.toFixed(2)} {settings?.displayCurrency}
                  </div>
                  <small>
                    {expense.amount} {expense.currency}
                  </small>
                  <div className="actions-inline">
                    <button onClick={() => setEditing(expense)}>✏️</button>
                    <button onClick={() => void removeExpense(expense.id)}>🗑️</button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
