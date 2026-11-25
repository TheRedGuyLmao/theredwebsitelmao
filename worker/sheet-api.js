// Серверная часть чарника. Её вызывает worker/index.js для адресов /seek_and_destroy/sheet/api/...
//
// Вход — по логину и паролю. Игроков создаёт мастер в своей панели.
// Мастер входит под логином «мастер» с паролем из секрета GM_PASSWORD (задаётся в панели Cloudflare).
// Пароли игроков хранятся только как хэш (PBKDF2), сам пароль сервер не помнит.
//
// Хранилище KV (привязка SHEETS):
//   u:<логин>  учётная запись игрока { salt, hash, v }  (v растёт при смене пароля — старые входы сгорают)
//   s:<логин>  лист персонажа
//   f:<логин>  счётчик неудачных попыток входа (живёт 15 минут)
import { normalize, playerUpdate, adminUpdate, forPlayer, summary, blank } from "../seek_and_destroy/sheet/rules.js";

export const GM = "мастер";
const COOKIE = "iab";
const COOKIE_PATH = "/seek_and_destroy/sheet/";
const DAYS = 30;          // сколько дней держится вход
const MAX_FAILS = 10;     // после стольких неверных паролей логин блокируется на 15 минут

const J = (d, status = 200, headers = {}) => new Response(JSON.stringify(d), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
});
const ERR = (msg, status = 400) => J({ error: msg }, status);

const te = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };

// Логин: 2–32 символа, буквы (любой алфавит), цифры, точка, дефис, подчёркивание. Регистр не важен.
export const cleanLogin = v => String(v ?? "").trim().toLowerCase();
const loginOk = l => /^[\p{L}\p{N}._-]{2,32}$/u.test(l);
const passOk = p => typeof p === "string" && p.length >= 4 && p.length <= 200;

async function pbkdf2(pass, salt) {
  const key = await crypto.subtle.importKey("raw", te.encode(pass), "PBKDF2", false, ["deriveBits"]);
  return b64u(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256));
}
async function sha(s) { return b64u(await crypto.subtle.digest("SHA-256", te.encode(s))); }
// Сравнение без утечки по времени: сравниваем хэши, а не сами строки.
async function same(a, b) {
  const [x, y] = await Promise.all([sha("cmp:" + a), sha("cmp:" + b)]);
  let d = 0; for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}

// Ключ подписи входа выводится из пароля мастера: сменил GM_PASSWORD — все входы сгорели.
async function signKey(env) {
  const raw = await crypto.subtle.digest("SHA-256", te.encode("iab-session:" + env.GM_PASSWORD));
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function makeToken(env, u, v) {
  const body = b64u(te.encode(JSON.stringify({ u, v, exp: Math.floor(Date.now() / 1000) + DAYS * 86400 })));
  const sig = b64u(await crypto.subtle.sign("HMAC", await signKey(env), te.encode(body)));
  return body + "." + sig;
}
async function readToken(env, tok) {
  try {
    const [body, sig] = String(tok).split(".");
    if (!body || !sig) return null;
    if (!await crypto.subtle.verify("HMAC", await signKey(env), unb64u(sig), te.encode(body))) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return p.exp > Date.now() / 1000 ? p : null;
  } catch { return null; }
}
const cookieOf = request => (request.headers.get("cookie") || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
const setCookie = (val, maxAge) => `${COOKIE}=${val}; Path=${COOKIE_PATH}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

const userKey = l => "u:" + l, sheetKey = l => "s:" + l, failKey = l => "f:" + l;
const getUser = (env, l) => env.SHEETS.get(userKey(l), "json");
const read = async (env, l) => { const v = await env.SHEETS.get(sheetKey(l), "json"); return v ? normalize(v) : null; };
const write = (env, l, s) => env.SHEETS.put(sheetKey(l), JSON.stringify(s));
async function hashUser(pass, v) { const salt = crypto.getRandomValues(new Uint8Array(16)); return { salt: b64u(salt), hash: await pbkdf2(pass, salt), v }; }
const gmVersion = env => sha("gm:" + env.GM_PASSWORD);

// Кто сейчас вошёл: { login, admin } или null.
async function whoIs(request, env) {
  if (env.DEV_LOGIN) return { login: cleanLogin(env.DEV_LOGIN), admin: cleanLogin(env.DEV_LOGIN) === GM }; // только для локальной проверки!
  const p = await readToken(env, cookieOf(request));
  if (!p) return null;
  if (p.u === GM) return p.v === await gmVersion(env) ? { login: GM, admin: true } : null;
  const u = await getUser(env, p.u);
  return u && u.v === p.v ? { login: p.u, admin: false } : null;
}

async function login(env, body) {
  const l = cleanLogin(body?.login), pass = String(body?.password ?? "");
  if (!l || !pass) return ERR("Введите логин и пароль");
  const fails = Number(await env.SHEETS.get(failKey(l))) || 0;
  if (fails >= MAX_FAILS) return ERR("Слишком много неверных попыток. Подождите 15 минут.", 429);
  let v = null;
  if (l === GM) { if (await same(pass, env.GM_PASSWORD)) v = await gmVersion(env); }
  else {
    const u = await getUser(env, l);
    if (u && await same(await pbkdf2(pass, unb64u(u.salt)), u.hash)) v = u.v;
  }
  if (v === null) {
    await env.SHEETS.put(failKey(l), String(fails + 1), { expirationTtl: 900 });
    return ERR("Неверный логин или пароль", 401);
  }
  if (fails) await env.SHEETS.delete(failKey(l));
  return J({ login: l, admin: l === GM }, 200, { "set-cookie": setCookie(await makeToken(env, l, v), DAYS * 86400) });
}

// path — часть адреса после /api/, например "me" или "admin/sheets".
export async function handleApi(request, env, path) {
  if (!env.SHEETS) return ERR("Не подключено хранилище SHEETS (KV)", 500);
  if (!env.GM_PASSWORD && !env.DEV_LOGIN) return ERR("Не задан пароль мастера GM_PASSWORD", 500);
  const m = request.method;
  const url = new URL(request.url);
  const body = async () => { try { return await request.json(); } catch { return null; } };

  try {
    if (path === "login" && m === "POST") return login(env, await body());
    if (path === "logout" && m === "POST") return J({ ok: true }, 200, { "set-cookie": setCookie("", 0) });

    const me = await whoIs(request, env);
    if (!me) return ERR("Нужно войти", 401);

    if (path === "me" && m === "GET") return J(me);

    if (path === "sheet") {
      if (me.admin) return ERR("У мастера нет своего листа", 403);
      if (m === "GET") return J(forPlayer((await read(env, me.login)) || blank()));
      if (m === "PUT") {
        const next = playerUpdate(await read(env, me.login), await body());
        await write(env, me.login, next);
        return J(forPlayer(next));
      }
    }

    if (path.startsWith("admin/")) {
      if (!me.admin) return ERR("Только для мастера", 403);
      const who = cleanLogin(url.searchParams.get("u"));

      // Все игроки — и те, кто ещё не заходил.
      if (path === "admin/sheets" && m === "GET") {
        const out = [];
        let cursor;
        do {
          const page = await env.SHEETS.list({ prefix: "u:", cursor });
          for (const k of page.keys) {
            const l = k.name.slice(2), s = await read(env, l);
            out.push({ ...summary(l, s || blank()), fresh: !s });
          }
          cursor = page.list_complete ? null : page.cursor;
        } while (cursor);
        return J(out);
      }

      if (path === "admin/users") {
        if (m === "POST") {
          const b = await body(), l = cleanLogin(b?.login);
          if (!loginOk(l)) return ERR("Логин: 2–32 символа — буквы, цифры, точка, дефис или _");
          if (l === GM) return ERR("Этот логин занят мастером");
          if (!passOk(b?.password)) return ERR("Пароль: минимум 4 символа");
          if (await getUser(env, l)) return ERR("Такой игрок уже есть", 409);
          await env.SHEETS.put(userKey(l), JSON.stringify(await hashUser(b.password, 1)));
          return J({ login: l });
        }
        if (m === "PUT") {
          const b = await body(), u = who && await getUser(env, who);
          if (!u) return ERR("Нет такого игрока", 404);
          if (!passOk(b?.password)) return ERR("Пароль: минимум 4 символа");
          await env.SHEETS.put(userKey(who), JSON.stringify(await hashUser(b.password, (u.v || 1) + 1)));
          return J({ ok: true });
        }
      }

      if (path === "admin/sheet") {
        if (!who) return ERR("Не указан игрок");
        if (m === "GET") { if (!await getUser(env, who)) return ERR("Нет такого игрока", 404); return J((await read(env, who)) || blank()); }
        if (m === "PUT") { const s = adminUpdate(await read(env, who), await body()); await write(env, who, s); return J(s); }
        if (m === "DELETE") {
          await Promise.all([env.SHEETS.delete(sheetKey(who)), env.SHEETS.delete(userKey(who)), env.SHEETS.delete(failKey(who))]);
          return J({ ok: true });
        }
      }
    }
    return ERR("Нет такого адреса", 404);
  } catch (e) {
    return ERR(e.message || "Ошибка");
  }
}
