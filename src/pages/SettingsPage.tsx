import { useMemo, useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { CurrencyCode } from '../types/models';

const ALL: CurrencyCode[] = ['RUB', 'USD', 'EUR', 'GBP', 'KZT', 'CNY'];

export function SettingsPage() {
  const { settings, saveSettings, syncNow, syncStatus, session, logout } = useBudget();
  const [draft, setDraft] = useState(settings);
  const sessionLabel = useMemo(() => session ? `...${session.workspaceId.slice(-4)}` : '-', [session]);
  if (!settings || !draft) return null;

  return (
    <section className="card stack">
      <h3>Настройки</h3>
      <div className="muted">Workspace: {sessionLabel}</div>
      <div className="muted">Синхронизация: {syncStatus.lastSyncedAt ?? 'ещё не было'} / pending: {syncStatus.unsyncedCount}</div>
      {syncStatus.lastError && <div className="warning">{syncStatus.lastError}</div>}

      <label>Базовая валюта
        <select value={draft.baseCurrency} onChange={(e) => setDraft({ ...draft, baseCurrency: e.target.value as CurrencyCode })}>
          {ALL.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>

      <div className="grid-row">{[0,1,2].map((idx)=><select key={idx} value={draft.favoriteCurrencies[idx]} onChange={(e)=>{const next=[...draft.favoriteCurrencies] as typeof draft.favoriteCurrencies; next[idx]=e.target.value as CurrencyCode; setDraft({...draft, favoriteCurrencies: next});}}>{ALL.map((c)=><option key={c}>{c}</option>)}</select>)}</div>

      <label>Валюта отображения
        <select value={draft.displayCurrency} onChange={(e) => setDraft({ ...draft, displayCurrency: e.target.value as CurrencyCode })}>
          {[draft.baseCurrency, ...draft.favoriteCurrencies].map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>

      <button onClick={() => void saveSettings(draft)}>Сохранить</button>
      <button onClick={() => void syncNow()}>Синхронизировать</button>
      <button onClick={() => void logout()}>Сменить семью / Выйти</button>
    </section>
  );
}
