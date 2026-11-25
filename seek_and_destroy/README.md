# Чарник ИАБ — как поставить на свой сайт

Что внутри:

```
public/index.html   страница
public/app.js       создание персонажа, лист игрока, панель мастера
public/rules.js     ПРАВИЛА: планеты, вера, навыки, очки. Меняйте здесь.
functions/api/[[path]].js   сервер: хранит листы и проверяет, кто вошёл
```

Если открыть страницу без сервера, она работает в демо-режиме: всё хранится в браузере,
вверху есть переключатель «Игрок / Мастер».

Как это работает на сайте: вход делает **Cloudflare Access** (бесплатно до 50 человек).
Игрок открывает ссылку, вводит почту, получает код на почту и попадает на свой лист.
Пароли хранить не нужно. Мастер — тот, чья почта указана в `ADMIN_EMAILS`.
Листы лежат в **Cloudflare KV**.

## 1. GitHub

Загрузите эту папку в репозиторий: новый или подпапкой в уже существующий.

## 2. Cloudflare Pages

1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → выберите репозиторий.
2. Настройки сборки:
   - Framework preset: **None**
   - Build command: пусто
   - Build output directory: `public`
   - Если папка лежит не в корне репозитория, укажите её в **Root directory** (например `charnik`).
3. **Save and Deploy**.

## 3. Хранилище листов (KV)

1. **Storage & Databases** → **KV** → **Create** → имя, например `iab-sheets`.
2. Проект Pages → **Settings** → **Bindings** → **Add** → **KV namespace**:
   имя переменной `SHEETS`, хранилище `iab-sheets`.

## 4. Адрес

Проект Pages → **Custom domains** → добавьте, например, `charnik.вашдомен.se`.

## 5. Вход (Cloudflare Access)

1. **Zero Trust** (в меню слева) → при первом входе выберите имя команды и бесплатный план.
2. **Access** → **Applications** → **Add an application** → **Self-hosted**.
   - Домен: `charnik.вашдомен.se`.
   - Добавьте второй домен: `имя-проекта.pages.dev`, чтобы туда тоже нельзя было зайти без входа.
3. Политика (**Policy**): Action **Allow**, правило **Emails** — почты игроков и ваша.
4. Способ входа: **One-time PIN** (код на почту) — включён по умолчанию.
5. Сохраните, затем откройте приложение и скопируйте **Application Audience (AUD) Tag**.
6. Имя команды видно в **Settings** → **Custom Pages**: `ваша-команда.cloudflareaccess.com`.

## 6. Переменные

Проект Pages → **Settings** → **Variables and Secrets** → добавьте (для Production):

| Имя | Значение |
|---|---|
| `ADMIN_EMAILS` | ваша почта (несколько — через запятую) |
| `TEAM_DOMAIN` | `ваша-команда.cloudflareaccess.com` |
| `POLICY_AUD` | AUD Tag из шага 5 |

Потом **Deployments** → **Retry deployment**, чтобы переменные подхватились.

## Новый игрок

Добавьте его почту в политику Access (шаг 5.3) и отправьте ссылку.
Его лист появится у вас в списке, как только он войдёт.

## Если хочется именно папку `вашдомен.se/charnik`, а не поддомен

Положите `public/*` в папку `charnik/` вашего сайта, а функцию — в
`functions/charnik/api/[[path]].js` (и поправьте в ней путь импорта до `rules.js`).
Сайт должен собираться через тот же Cloudflare Pages. Страница сама ищет сервер
по относительному адресу `api/`, так что работает из любой папки.

## Проверка на компьютере

`npx wrangler pages dev public --kv SHEETS --binding DEV_EMAIL=you@test.se ADMIN_EMAILS=you@test.se`

`DEV_EMAIL` пускает без входа. **Никогда не ставьте его на сайте.**
