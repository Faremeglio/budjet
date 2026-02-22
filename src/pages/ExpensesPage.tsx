import { CategoryManager } from '../components/CategoryManager';
import { ExpenseForm } from '../components/ExpenseForm';
import { ExpenseList } from '../components/ExpenseList';
import { useBudget } from '../store/BudgetContext';

export function ExpensesPage() {
  const { rateWarning } = useBudget();
  return (
    <div className="stack">
      {rateWarning && <div className="warning">⚠️ {rateWarning}</div>}
      <ExpenseForm />
      <ExpenseList />
      <CategoryManager />
    </div>
  );
}
