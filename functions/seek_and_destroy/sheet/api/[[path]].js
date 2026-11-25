// Серверная часть чарника (Cloudflare Pages Functions).
// Вход — через Cloudflare Access: он сам показывает страницу логина,
// а сюда присылает подписанный токен с почтой игрока. Мы проверяем подпись.
import { normalize, playerUpdate, adminUpdate, forPlayer, summary, blank } from "../../../../seek_and_destroy/sheet/rules.js";

const J = (d, status = 200) => new Response(JSON.stringify(d), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const ERR = (msg, status = 400) => J({ error: msg }, status);

const b64 = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return s; };
const bytes = s => Uint8Array.from(atob(b64(s)), c => c.charCodeAt(0));
const text = s => new TextDecoder().decode(bytes(s));

let certCache = { at: 0, keys: [] };
async function accessKeys(env) {
  if (Date.now() - certCache.at < 3600e3 && certCache.keys.length) return certCache.keys;
  const r = await fetch(`https://${env.TEAM_DOMAIN}/cdn-cgi/access/certs`);
  const j = await r.json();
  certCache = { at: Date.now(), keys: j.keys || [] };
  return certCache.keys;
}

async function whoIs(request, env) {
  if (env.DEV_EMAIL) return env.DEV_EMAIL.toLowerCase(); // только для локальной проверки!
  const tok = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!tok || !env.TEAM_DOMAIN || !env.POLICY_AUD) return null;
  try {
    const [h, p, sig] = tok.split(".");
    const head = JSON.parse(text(h)), pl = JSON.parse(text(p));
    const aud = Array.isArray(pl.aud) ? pl.aud : [pl.aud];
    if (!aud.includes(env.POLICY_AUD)) return null;
    if (pl.iss !== `https://${env.TEAM_DOMAIN}`) return null;
    if (!pl.exp || pl.exp < Date.now() / 1000) return null;
    const jwk = (await accessKeys(env)).find(k => k.kid === head.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, bytes(sig), new TextEncoder().encode(h + "." + p));
    return ok && pl.email ? String(pl.email).toLowerCase() : null;
  } catch { return null; }
}

const KEY = e => "s:" + e;
const read = async (env, e) => { const v = await env.SHEETS.get(KEY(e), "json"); return v ? normalize(v) : null; };
const write = (env, e, s) => env.SHEETS.put(KEY(e), JSON.stringify(s));

export async function onRequest({ request, env, params }) {
  if (!env.SHEETS) return ERR("Не подключено хранилище SHEETS (KV)", 500);
  const email = await whoIs(request, env);
  if (!email) return ERR("Нужно войти через Cloudflare Access", 401);
  const admins = String(env.ADMIN_EMAILS || "").toLowerCase().split(/[,\s]+/).filter(Boolean);
  const admin = admins.includes(email);
  const path = [].concat(params.path || []).join("/");
  const m = request.method;
  const url = new URL(request.url);
  const body = async () => { try { return await request.json(); } catch { return null; } };

  try {
    if (path === "me" && m === "GET") return J({ email, admin });

    if (path === "sheet") {
      if (m === "GET") return J(forPlayer((await read(env, email)) || blank()));
      if (m === "PUT") {
        const next = playerUpdate(await read(env, email), await body());
        await write(env, email, next);
        return J(forPlayer(next));
      }
    }

    if (path.startsWith("admin/")) {
      if (!admin) return ERR("Только для мастера", 403);
      if (path === "admin/sheets" && m === "GET") {
        const out = [];
        let cursor;
        do {
          const page = await env.SHEETS.list({ prefix: "s:", cursor });
          for (const k of page.keys) {
            const s = await read(env, k.name.slice(2));
            if (s) out.push(summary(k.name.slice(2), s));
          }
          cursor = page.list_complete ? null : page.cursor;
        } while (cursor);
        return J(out);
      }
      if (path === "admin/sheet") {
        const who = String(url.searchParams.get("e") || "").toLowerCase();
        if (!who) return ERR("Не указан игрок");
        if (m === "GET") { const s = await read(env, who); return s ? J(s) : ERR("Нет такого листа", 404); }
        if (m === "PUT") { const s = adminUpdate(await read(env, who), await body()); await write(env, who, s); return J(s); }
        if (m === "DELETE") { await env.SHEETS.delete(KEY(who)); return J({ ok: true }); }
      }
    }
    return ERR("Нет такого адреса", 404);
  } catch (e) {
    return ERR(e.message || "Ошибка");
  }
}
