import { NavLink, Route, Routes } from 'react-router-dom';
import { ExpensesPage } from './pages/ExpensesPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BudgetProvider } from './store/BudgetContext';

export function App() {
  return (
    <BudgetProvider>
      <div className="app-shell">
        <header>
          <h1>Family Budget</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<ExpensesPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <nav className="bottom-nav">
          <NavLink to="/">Расходы</NavLink>
          <NavLink to="/stats">Статистика</NavLink>
          <NavLink to="/settings">Настройки</NavLink>
        </nav>
      </div>
    </BudgetProvider>
  );
}
