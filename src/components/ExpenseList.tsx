import { useMemo, useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { Expense } from '../types/models';
import { formatDateLabel } from '../utils/date';
import { ExpenseForm } from './ExpenseForm';

export function ExpenseList() {
  const { expenses, categories, deleteExpense, convertToDisplay, settings } = useBudget();
  const [edit, setEdit] = useState<Expense | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    for (const e of expenses) {
      map[e.date] ||= [];
      map[e.date].push(e);
    }
    return Object.entries(map);
  }, [expenses]);

  return (
    <div className="stack">
      {edit && <ExpenseForm existing={edit} onDone={() => setEdit(null)} />}
      {grouped.map(([day, list]) => (
        <section className="card" key={day}>
          <h3>{formatDateLabel(day)}</h3>
          {list.map((e) => {
            const cat = categories.find((x) => x.id === e.categoryId);
            return (
              <article className="expense-item" key={e.id}>
                <div><span className="dot" style={{ background: cat?.color }} />{cat?.name ?? 'Категория'}<p>{e.note || '—'}</p></div>
                <div className="align-right">
                  <div>{convertToDisplay(e.amount, e.currency).toFixed(2)} {settings?.displayCurrency}</div>
                  <small>{e.amount} {e.currency}</small>
                  <div className="actions-inline">
                    <button onClick={() => setEdit(e)}>✏️</button>
                    <button onClick={() => void deleteExpense(e.id)}>🗑️</button>
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
