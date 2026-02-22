import { FormEvent, useState } from 'react';
import { useBudget } from '../store/BudgetContext';

export function CategoryManager() {
  const { categories, upsertCategory, deleteCategory } = useBudget();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#22c55e');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await upsertCategory({ name, color });
    setName('');
  };

  return (
    <section className="card stack">
      <h3>Категории</h3>
      <form className="grid-row" onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button type="submit">Добавить</button>
      </form>
      {categories.map((c) => (
        <div className="expense-item" key={c.id}>
          <div><span className="dot" style={{ background: c.color }} />{c.name}</div>
          <div className="actions-inline">
            <button onClick={() => { const next = prompt('Имя', c.name); if (next) void upsertCategory({ ...c, name: next }); }}>✏️</button>
            <button onClick={() => { const next = prompt('Цвет', c.color); if (next) void upsertCategory({ ...c, color: next }); }}>🎨</button>
            <button onClick={() => void deleteCategory(c.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </section>
  );
}
