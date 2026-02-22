import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { BudgetProvider, useBudget } from './store/BudgetContext';
import { ConnectPage } from './pages/ConnectPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';

function ProtectedLayout() {
  const { session } = useBudget();
  if (!session) return <Navigate to="/connect" replace />;
  return (
    <div className="app-shell">
      <header><h1>Family Budget</h1></header>
      <main><Routes>
        <Route path="/" element={<ExpensesPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes></main>
      <nav className="bottom-nav">
        <NavLink to="/">Расходы</NavLink>
        <NavLink to="/stats">Статистика</NavLink>
        <NavLink to="/settings">Настройки</NavLink>
      </nav>
    </div>
  );
}

function RootRoutes() {
  const { session, loading } = useBudget();
  if (loading) return <div className="card">Loading...</div>;

  return <Routes>
    <Route path="/connect" element={session ? <Navigate to="/" replace /> : <ConnectPage />} />
    <Route path="/*" element={<ProtectedLayout />} />
  </Routes>;
}

export function App() {
  return <BudgetProvider><RootRoutes /></BudgetProvider>;
}
