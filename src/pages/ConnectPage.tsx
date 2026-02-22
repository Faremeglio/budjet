import { FormEvent, useState } from 'react';
import { useBudget } from '../store/BudgetContext';

export function ConnectPage() {
  const { createFamily, connectWithCode } = useBudget();
  const [code, setCode] = useState('');
  const [newCode, setNewCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  const connect = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await connectWithCode(code.trim().toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения');
    }
  };

  const create = async () => {
    try {
      setError('');
      const generated = await createFamily();
      setNewCode(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания семьи');
    }
  };

  return (
    <section className="card stack">
      <h2>Подключение семьи</h2>
      {error && <div className="warning">{error}</div>}
      {newCode && <div className="success">Семейный код: <b>{newCode}</b>. Сохраните его.</div>}
      <button onClick={() => void create()}>Создать семью</button>
      <form className="stack" onSubmit={connect}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Введите семейный код" required />
        <button type="submit">Подключиться по коду</button>
      </form>
    </section>
  );
}
