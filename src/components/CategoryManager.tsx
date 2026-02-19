import { FormEvent, useState } from 'react';
import { useBudget } from '../store/BudgetContext';
import { uid } from '../utils/date';

export function CategoryManager() {
  const { categories, addOrUpdateCategory, removeCategory } = useBudget();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addOrUpdateCategory({ id: uid(), name, color, archived: false });
    setName('');
  };

  return (
    <section className="card">
      <h3>Категории</h3>
      <form className="grid-row" onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Новая категория" required />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button type="submit">Добавить</button>
      </form>
      <div className="stack">
        {categories.map((cat) => (
          <div key={cat.id} className="expense-item">
            <div>
              <span className="dot" style={{ background: cat.color }} /> {cat.name} {cat.archived ? '(архив)' : ''}
            </div>
            <div className="actions-inline">
              <button
                onClick={() => {
                  const next = prompt('Переименовать', cat.name);
                  if (next?.trim()) {
                    void addOrUpdateCategory({ ...cat, name: next.trim() });
                  }
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  const next = prompt('Цвет HEX', cat.color);
                  if (next) void addOrUpdateCategory({ ...cat, color: next });
                }}
              >
                🎨
              </button>
              <button onClick={() => void removeCategory(cat.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
