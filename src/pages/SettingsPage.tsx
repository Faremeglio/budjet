import { useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { CurrencyCode } from '../types/models';

const ALL: CurrencyCode[] = ['RUB', 'USD', 'EUR', 'GBP', 'KZT', 'CNY'];

export function SettingsPage() {
  const { settings, updateSettings } = useBudget();
  const [draft, setDraft] = useState(settings);

  if (!settings || !draft) return null;

  return (
    <section className="card stack">
      <h3>Валюты</h3>
      <label>
        Базовая валюта
        <select
          value={draft.baseCurrency}
          onChange={(e) => setDraft({ ...draft, baseCurrency: e.target.value as CurrencyCode })}
        >
          {ALL.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      <label>
        Избранные (ровно 3)
        <div className="grid-row">
          {[0, 1, 2].map((idx) => (
            <select
              key={idx}
              value={draft.favoriteCurrencies[idx]}
              onChange={(e) => {
                const next = [...draft.favoriteCurrencies] as typeof draft.favoriteCurrencies;
                next[idx] = e.target.value as CurrencyCode;
                setDraft({ ...draft, favoriteCurrencies: next });
              }}
            >
              {ALL.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          ))}
        </div>
      </label>

      <label>
        Валюта отображения
        <select
          value={draft.displayCurrency}
          onChange={(e) => setDraft({ ...draft, displayCurrency: e.target.value as CurrencyCode })}
        >
          {[draft.baseCurrency, ...draft.favoriteCurrencies].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      <button onClick={() => void updateSettings(draft)}>Сохранить</button>
    </section>
  );
}
