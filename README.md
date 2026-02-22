# Family Budget (local-first + Family Code sync)

## Что добавлено
- Local-first архитектура: данные пишутся в IndexedDB, а потом синхронизируются с Supabase.
- Подключение через **семейный код** без логинов/паролей.
- SyncEngine с outbox:
  - `push`: отправка локальных изменений,
  - `pull`: получение изменений после `lastSyncedAt`.
- Soft delete через `deletedAt` для Expense/Category/Settings.
- Защищённый роутинг: пока нет session/workspace -> `/connect`.
- HashRouter + `vite base=/budjet/` для GitHub Pages.

## Архитектура
- `src/store/BudgetContext.tsx` — единый state-контейнер UI.
- `src/sync/localRepository.ts` — локальный репозиторий IndexedDB + outbox.
- `src/sync/remoteRepository.ts` — вызовы Supabase Edge Functions.
- `src/sync/syncEngine.ts` — push/pull + LWW (last write wins по `updatedAt`).
- `src/pages/ConnectPage.tsx` — create/connect flow через семейный код.

## ENV
Создайте `.env`:

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Supabase setup
1. Выполнить SQL из `sql/schema.sql`.
2. Деплойнуть edge functions:
   - `supabase/functions/create/index.ts`
   - `supabase/functions/connect/index.ts`
   - `supabase/functions/sync/index.ts`
3. Для функций задать secrets:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FAMILY_CODE_SALT`

## Security notes по family code
- В БД хранится только `family_code_hash`, не сам код.
- Хэш считается как `sha256(salt + ':' + code)`.
- Компромисс MVP: проверка кода в edge function по service role, затем выдаётся session token.
- Для production стоит добавить TTL токена, rate limit на connect/create и ротацию salt.

## Конфликты синка
- MVP правило: **last write wins** по `updatedAt`.
- Сервер пишет `updated_at` и отдаёт `serverNow`.
- Клиент хранит `lastSyncedAt` и использует его для инкрементального pull.
- Чтобы уменьшить проблемы с часовыми поясами/дрейфом часов, для следующей синхронизации используется серверный `serverNow`.

## Запуск
```bash
npm install
npm run dev
```
