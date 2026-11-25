import * as R from "./rules.js";

const $ = s => document.querySelector(s);
const app = $("#app");
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pl = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; return f[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b > 1 && b < 5 ? 1 : 2]; };

let API, ME, S, mode = "", step = 0, dirty = false, editing = "", list = [], delArm = false, saveT;
let open = {}; // какие списки инвентаря сейчас открыты для правки
let peek = false; // мастер смотрит на лист глазами игрока

function toast(t, bad) {
  const e = $("#toast");
  e.textContent = t; e.className = "toast on" + (bad ? " bad" : "");
  clearTimeout(toast.t); toast.t = setTimeout(() => e.className = "toast", bad ? 4000 : 1800);
}

/* ---------- связь с сервером ---------- */
async function call(method, url, data) {
  const r = await fetch(url, { method, credentials: "same-origin", headers: data ? { "content-type": "application/json" } : {}, body: data ? JSON.stringify(data) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(j?.error || "Ошибка " + r.status);
  return j;
}
const q = (u, p = "sheet") => `api/admin/${p}?u=` + encodeURIComponent(u);
const net = {
  demo: false,
  login: (login, password) => call("POST", "api/login", { login, password }),
  logout: () => call("POST", "api/logout"),
  addUser: (login, password) => call("POST", "api/admin/users", { login, password }),
  setPass: (u, password) => call("PUT", q(u, "users"), { password }),
  me: () => call("GET", "api/me"),
  sheet: () => call("GET", "api/sheet"),
  save: s => call("PUT", "api/sheet", s),
  list: () => call("GET", "api/admin/sheets"),
  load: e => call("GET", q(e)),
  put: (e, s) => call("PUT", q(e), s),
  del: e => call("DELETE", q(e)),
};

/* ---------- демо без сервера: всё в этом браузере ---------- */
function seed() {
  const b = Object.assign(R.blank(), {
    created: true, name: "Брам Окто-Велль", sex: "Мужской", dob: "2049-03-14", planet: "GR-00-2001", race: "Кротолюд", prof: "Техник", h: "148", w: "61",
    look: "Низкий и плотный, шерсть с проседью, на носу треснувшие защитные очки. Пахнет машинным маслом.",
    attr: { int: 4, psy: 2, phy: 3, mot: 3 }, faith: "giros", sig: "an", rk: { an: 2, logic: 1, end: 1 }, sp: 2, cr: 240,
    inv: ["КПК ИАБ (стёртая прошивка)", "Набор отвёрток и паяльник", "Обрез «Пфир-12», 6 патронов", "Фляга грибного самогона"],
    imp: [{ n: "Кибер-глаз с ночным зрением", c: "6" }, { n: "Когти-манипуляторы", c: "4" }],
    ideals: "Любую машину можно починить. Любого человека — не всегда.",
    traits: "Ворчит, но первым лезет помогать. Разговаривает с механизмами вслух.",
    bonds: "Младшая сестра осталась на Пфир-Гаасе, отправляет ей половину заработка.",
    flaws: "Боится открытого неба. Не может пройти мимо сломанной вещи.",
    bio: "Вырос в подземной деревне на Пфир-Гаасе, где чинил всё — от насосов до тракторов старосты.",
    why: "Разобрал на детали трактор старосты, и пришлось бежать. Слышал, что в барах у доков платят техникам наличными.",
    gm: "Должен 300 кредитов перевозчику с Гобора.",
  });
  return { role: "player", users: ["брам", "игрок"], s: { "брам": b } };
}
function demo() {
  const K = "iab-demo-v1";
  let db; try { db = JSON.parse(localStorage.getItem(K)); } catch {}
  if (!db || !db.s || !db.users) db = seed();
  const w = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch {} };
  const me = () => db.role === "admin" ? "theredguylmao" : "игрок";
  const later = v => new Promise(r => setTimeout(() => r(JSON.parse(JSON.stringify(v))), 50));
  return {
    demo: true,
    setRole(r) { db.role = r; w(); },
    reset() { db = seed(); w(); },
    me: () => later({ login: me(), admin: db.role === "admin", name: db.role === "admin" ? "TheRedGuyLmao" : me() }),
    addUser: async (l, p) => { l = String(l).trim().toLowerCase(); if (l.length < 2) throw new Error("Логин: минимум 2 символа"); if (String(p).length < 4) throw new Error("Пароль: минимум 4 символа"); if (db.users.includes(l) || l === "theredguylmao") throw new Error("Такой игрок уже есть"); db.users.push(l); w(); return later({ login: l }); },
    setPass: async (l, p) => { if (String(p).length < 4) throw new Error("Пароль: минимум 4 символа"); return later({ ok: true }); },
    sheet: () => later(R.forPlayer(db.s[me()] || R.blank())),
    save: async s => { const n = R.playerUpdate(db.s[me()], s); db.s[me()] = n; w(); return later(R.forPlayer(n)); },
    list: () => later(db.users.map(l => ({ ...R.summary(l, R.normalize(db.s[l] || R.blank())), fresh: !db.s[l] }))),
    load: async e => later(R.normalize(db.s[e] || R.blank())),
    put: async (e, s) => { db.s[e] = R.adminUpdate(db.s[e], s); w(); return later(db.s[e]); },
    del: async e => { delete db.s[e]; db.users = db.users.filter(x => x !== e); w(); return later({ ok: true }); },
  };
}

async function detect() {
  try {
    const r = await fetch("api/me", { credentials: "same-origin" });
    if ((r.headers.get("content-type") || "").includes("json")) {
      const j = await r.json();
      if (r.ok && j?.login) return { api: net, me: j };
      if (r.status === 401) return { api: net, me: null }; // сервер есть, но вход не выполнен
      if (r.status >= 400) return { err: j?.error || "Ошибка " + r.status };
    }
  } catch {}
  const d = demo();
  return { api: d, me: await d.me() };
}

/* ---------- куски интерфейса ---------- */
const FL = {
  name: ["Полное Федеральное имя"], sex: ["Пол"], dob: ["Дата рождения", "ГГГГ-ММ-ДД, например 2051-01-21"],
  pname: ["Название планеты"], pdesc: ["О планете", "Климат, природа, кто там живёт и чем она знаменита", 1],
  race: ["Раса"], prof: ["Профессия"], h: ["Рост, см"], w: ["Вес, кг"],
  look: ["Внешность", "Лицо, одежда, особые приметы, как он звучит и пахнет", 1],
  ideals: ["Идеалы", "Во что персонаж верит и за что готов бороться", 1],
  traits: ["Свойства личности", "Привычки, манеры, как он ведёт себя с людьми", 1],
  bonds: ["Узы", "Люди, места и вещи, которые для него важны", 1],
  flaws: ["Изъяны", "Слабости, пороки, страхи", 1],
  bio: ["Биография", "Откуда он и что с ним было до этого дня", 1],
  why: ["Почему ты здесь?", "Как и зачем ты оказался в этом баре", 1],
  notes: ["Заметки игрока", "", 1],
  gm: ["Заметки мастера", "Игрок их не видит", 1],
};
const WIDE = ["look", "pdesc", "bio", "why", "notes", "gm"];
function fld(k, cls = "") {
  const [l, h, ta] = FL[k], v = esc(S[k]);
  return `<label class="${cls}">${l}${h ? `<small>${h}</small>` : ""}${ta ? `<textarea data-k="${k}">${v}</textarea>` : `<input data-k="${k}" value="${v}"${k === "h" || k === "w" ? ' inputmode="numeric"' : ""}${k === "dob" ? ` inputmode="numeric" placeholder="ГГГГ-ММ-ДД" maxlength="10"${S.dob && !R.dobOk(S.dob) ? ' class="bad"' : ""}` : ""}>`}</label>`;
}
const num = (k, l) => `<label>${l}<input data-k="${k}" data-n="1" inputmode="numeric" value="${esc(S[k])}"></label>`;
const opt = (v, t, cur) => `<option value="${esc(v)}"${cur === v ? " selected" : ""}>${esc(t)}</option>`;
const planetSel = () => `<label>Планета происхождения<select data-k="planet">${R.PLANETS.map(([c, n]) => opt(c, `${n} · ${c}`, S.planet)).join("")}</select></label>`;
// Карточка под выбором планеты: описание выбранной или своя планета игрока.
function planetInfo() {
  const p = R.PLANETS.find(x => x[0] === S.planet) || R.PLANETS[0];
  const own = S.planet === R.OTHER, done = own && S.pname.trim() && S.pdesc.trim();
  return `<div class="pinfo wide"><div class="toolbar" style="margin:0 0 6px">
      <h3>${own ? esc(S.pname.trim() || "Своя планета") : esc(p[1])}<small>${own ? "система на выбор мастера" : `система ${esc(p[2])} · ${esc(p[0])}`}</small></h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${own ? `<button data-act="pdlg"${done ? "" : ' class="pri"'}>${done ? "Изменить описание" : "Описать планету"}</button>` : ""}<button data-act="atlas">Все планеты</button></div></div>
    <p>${own ? (done ? esc(S.pdesc) : `<span style="color:var(--acc)">Планета ещё не описана.</span>`) : esc(p[3])}</p>
    ${own ? `<p class="hint" style="margin:6px 0 0">${esc(R.OTHER_NOTE)}</p>` : ""}</div>`;
}
// Окно поверх страницы. Поля в нём меняют S так же, как поля на странице.
function dialog(html, foot = `<span></span><button class="pri" data-act="dclose">Готово</button>`) {
  const d = $("#dlg");
  d.innerHTML = `<div class="panel">${html}<div class="nav">${foot}</div></div>`;
  if (!d.open) d.showModal();
}
const planetDlg = () => dialog(`<h2 class="stepH">Своя планета</h2><p class="hint">${esc(R.OTHER_NOTE)}</p><div class="f">${fld("pname", "wide")}${fld("pdesc", "wide")}</div>`);
const atlasDlg = () => dialog(`<h2 class="stepH">Планеты</h2><p class="hint">Обитаемые миры, о которых знает каждый. Можно выбрать и свою планету — тогда опишешь её сам.</p>
  <div class="atlas">${R.PLANETS.map(([c, n, sys, t]) => `<div class="box${S.planet === c ? " on" : ""}"><h3>${esc(n)}<span>${sys ? `${esc(sys)} · ${esc(c)}` : "придумываешь сам"}</span></h3><p>${esc(t)}</p>
    <button data-act="pick" data-c="${esc(c)}" style="margin-top:10px"${S.planet === c ? " disabled" : ""}>${S.planet === c ? "Выбрана" : "Выбрать"}</button></div>`).join("")}</div>`);
const faithSel = () => `<label>Вера<select data-k="faith">${opt("", "Не выбрана", S.faith)}${R.FAITHS.map(f => opt(f.id, `${f.name} — ${f.perk}`, S.faith)).join("")}</select></label>`;
const clsSel = () => `<label>Класс<select data-k="cls">${opt("", "Не выбран", S.cls)}${R.CLASSES.map(c => opt(c.id, c.name, S.cls)).join("")}</select></label>`;
const sigSel = () => `<label>Коронный навык<select data-k="sig">${opt("", "Не выбран", S.sig)}${R.SKILLS.map(x => opt(x.id, x.name, S.sig)).join("")}</select></label>`;
const short = k => R.ATTRS.find(a => a.id === k).short;
function photo(can) {
  return `<label class="photo${can ? " can" : ""}">${S.photo ? `<img src="${esc(S.photo)}" alt="Портрет">` : `<span>${can ? "Нажмите, чтобы загрузить портрет" : "Без портрета"}</span>`}${can ? `<input type="file" accept="image/*" data-photo="1" aria-label="Портрет">` : ""}</label>`;
}

function attrGrid(m) {
  return `<div class="attrs">${R.ATTRS.map(a => {
    const base = S.attr[a.id], e = R.eff(S, a.id);
    const head = `<header><div><h3>${a.name}</h3><small>${e > base ? `${base} + 1 от веры` : a.short}</small></div>${m === "admin"
      ? `<div class="step"><button data-act="aattr" data-k="${a.id}" data-d="-1" aria-label="${a.name} меньше">−</button><span class="num">${base}</span><button data-act="aattr" data-k="${a.id}" data-d="1" aria-label="${a.name} больше">+</button></div>`
      : `<span class="num">${e}</span>`}</header>`;
    return `<div class="at">${head}${a.skills.map(([id, n, tip]) => {
      const r = S.rk[id] || 0, c = R.cap(S, id), sig = S.sig === id;
      let ctl = "";
      if (m === "player" && S.sp > 0) ctl = `<button data-act="up" data-id="${id}"${r >= c ? " disabled" : ""} aria-label="Прокачать: ${n}" style="width:38px;padding:0;font-size:18px">+</button>`;
      if (m === "admin") ctl = `<div class="step"><button data-act="ark" data-id="${id}" data-d="-1" aria-label="${n} меньше">−</button><span class="num">${r}</span><button data-act="ark" data-id="${id}" data-d="1" aria-label="${n} больше">+</button></div>`;
      const md = R.mod(S, id), cl = md ? `класс ${md > 0 ? "+" : "−"}${Math.abs(md)}` : "";
      const note = m === "pick" ? [sig ? "коронный" : "", cl].filter(Boolean).join(" · ") : [sig ? "коронный" : "", `вложено ${r} из ${c}`, cl].filter(Boolean).join(" · ");
      const tot = m === "pick" ? R.skill(S, id) : `${R.skill(S, id)}<small title="Потолок навыка">/${R.ceil(S, id)}</small>`;
      const inner = `${sig || m === "pick" ? `<span class="star" aria-hidden="true">★</span>` : ""}<span class="sn">${n}${note ? `<small>${note}</small>` : ""}</span>${ctl}<span class="tot">${tot}</span>`;
      return m === "pick"
        ? `<button class="sk${sig ? " sig" : ""}" data-act="sig" data-id="${id}" data-tip="${esc(tip)}" aria-pressed="${sig}" style="width:100%;border:0;border-top:1px solid var(--line);border-radius:0;text-align:left;min-height:48px;background:${sig ? "var(--teal2)" : "none"}">${inner}</button>`
        : `<div class="sk${sig ? " sig" : ""}" data-tip="${esc(tip)}" tabindex="0">${inner}</div>`;
    }).join("")}</div>`;
  }).join("")}</div>`;
}

function idCard(m) {
  const A = m === "admin", f = R.faithOf(S), h = R.humanity(S);
  const fact = (l, v) => `<div><dt>${l}</dt><dd>${esc(v || "—")}</dd></div>`;
  const top = A
    ? `<div class="f">${fld("name", "wide")}${fld("sex")}${fld("dob")}${planetSel()}${S.planet === R.OTHER ? fld("pname") + fld("pdesc", "wide") : ""}${fld("race")}${clsSel()}${fld("h")}${fld("w")}${faithSel()}${sigSel()}${num("cr", "Кредиты")}${num("sp", "Очки навыков")}</div>`
    : `<h2 class="nm">${esc(S.name || "Без имени")}</h2><p class="sub">${esc([S.race, R.profName(S), S.sex].filter(Boolean).join(" · ") || "—")}</p>
       <dl class="facts">${fact("Дата рождения", S.dob)}${fact("Планета", `${R.planetName(S)} · ${S.planet}`)}${fact("Рост", S.h && S.h + " см")}${fact("Вес", S.w && S.w + " кг")}${fact("Вера", f ? `${f.name}: ${f.perk}, +1 ${short(f.attr)}` : "")}</dl>`;
  return `<section class="panel idc">${photo(m !== "view")}<div>${top}</div>
    <div class="strip">
      <div class="big"><small>Федеральный номер</small><span id="fid">${esc(R.fid(S))}</span></div>
      <div class="hum${h < 50 ? " low" : ""}"><small style="font-size:13px;color:var(--mute)">Человечность <b id="humv">${h}</b> / 100</small><div class="meter"><i id="humb" style="width:${h}%"></i></div></div>
      <div class="big"><small>Кредиты</small>${m === "player" ? `<input class="crin" data-k="cr" data-n="1" inputmode="numeric" value="${esc(S.cr)}" aria-label="Кредиты">` : esc(S.cr)}</div>
      <div class="big${S.sp ? " acc" : ""}"><small>Очки навыков</small>${S.sp}${A ? ` <button data-act="givesp" style="min-height:34px;padding:0 10px;font-size:14px">+1 очко</button>` : ""}</div>
    </div></section>`;
}

function lvlBand(m) {
  const A = m === "admin";
  return `<section class="lvl"><div><small>Уровень</small><b class="num">${S.lvl}</b></div>
    <div class="lbar" aria-hidden="true">${Array.from({ length: R.MAX_LVL }, (_, i) => `<i class="${i < S.lvl ? "on" : ""}"></i>`).join("")}</div>
    ${A ? `<div class="step"><button data-act="lvl" data-d="-1"${S.lvl <= 1 ? " disabled" : ""} aria-label="Понизить уровень">−</button><button class="pri" data-act="lvl" data-d="1"${S.lvl >= R.MAX_LVL ? " disabled" : ""} style="width:auto;padding:0 14px;font-size:15px">Повысить уровень</button></div>`
      : `<p>${S.lvl >= R.MAX_LVL ? "Максимальный уровень." : "Каждый новый уровень даёт 1 очко навыков."}</p>`}</section>`;
}

// Списки «название + описание»: оружие, импланты (ещё цена в человечности), заклинания.
const DESC = { wpn: ["Название", "Урон, патроны, особенности"], imp: ["Имплант", "Что делает, где установлен"], spl: ["Заклинание", "Эффект, цена, ограничения"] };
function listEdit(k, add) {
  const inp = (i, f, v, ph, extra = "") => `<input data-l="${k}" data-i="${i}" data-f="${f}" value="${esc(v)}" placeholder="${ph}" aria-label="${ph}"${extra}>`;
  const x = i => `<button class="x" data-act="del" data-l="${k}" data-i="${i}" aria-label="Удалить">✕</button>`;
  const rows = DESC[k]
    ? S[k].map((it, i) => `<div class="row ${k === "imp" ? "imp" : "wpn"}">${inp(i, "n", it.n, DESC[k][0])}${k === "imp" ? inp(i, "c", it.c, "0", ' inputmode="numeric" title="Цена в человечности"') : ""}${inp(i, "d", it.d, DESC[k][1])}${x(i)}</div>`)
    : S[k].map((it, i) => `<div class="row"><input data-l="${k}" data-i="${i}" value="${esc(it)}" aria-label="Строка"><button class="x" data-act="del" data-l="${k}" data-i="${i}" aria-label="Удалить">✕</button></div>`);
  return `<div>${rows.join("")}<button class="add" data-act="addl" data-l="${k}">${add}</button></div>`;
}
// Список с кнопкой «Изменить»: сначала просто читается, править — по кнопке.
function listBox(k, title, add, can, note = "") {
  const items = DESC[k]
    ? S[k].filter(x => x.n || x.d).map(x => `<li><b>${esc(x.n || "Без названия")}${k === "imp" && x.c ? ` <em>−${esc(x.c)} человечности</em>` : ""}</b>${x.d ? `<span>${esc(x.d)}</span>` : ""}</li>`)
    : S[k].filter(Boolean).map(x => `<li>${esc(x)}</li>`);
  return `<div class="box"><h3>${title}${can ? `<button class="sm${open[k] ? " pri" : ""}" data-act="invt" data-l="${k}">${open[k] ? "Готово" : "Изменить"}</button>` : ""}</h3>${note}
    ${open[k] && can ? listEdit(k, add) : items.length ? `<ul class="ilist">${items.join("")}</ul>` : `<p class="none">Пусто</p>`}</div>`;
}
const textBox = k => `<div class="box${WIDE.includes(k) ? " wide" : ""}"><h3>${FL[k][0]}</h3>${S[k] ? `<p>${esc(S[k])}</p>` : `<p class="none">—</p>`}</div>`;

function sheetBody(m) {
  const A = m === "admin", P = m === "player", V = m === "view";
  const hint = P ? (S.sp ? `У тебя ${S.sp} ${pl(S.sp, ["очко", "очка", "очков"])} навыков: жми «+» у навыка. Справа — значение навыка и его потолок.` : "Очки навыков выдаёт мастер. Справа — значение навыка и его потолок. Характеристики заморожены.")
    : A ? "Мастер меняет всё: характеристики (заголовки) и вложенные очки навыков (строки). Число справа — значение навыка и его потолок." : "Навык = характеристика + вложенные очки + бонус класса. Справа — значение и потолок.";
  const pers = ["ideals", "traits", "bonds", "flaws", "look", "bio", "why"];
  const ownPlanet = !A && S.planet === R.OTHER ? `<div class="box wide"><h3>${esc(R.planetName(S))}<span>родная планета</span></h3><p>${esc(S.pdesc || "—")}</p></div>` : "";
  const invView = `<div class="two">${listBox("wpn", "Оружие", "+ Добавить оружие", !V)}${listBox("inv", "Предметы", "+ Добавить предмет", !V)}</div>`;
  return lvlBand(m) + idCard(m)
    + `<h2>Инвентарь</h2>${P ? `<p class="hint">Нажми «Изменить», чтобы добавить или убрать вещи, потом «Сохранить» внизу.</p>` : ""}${invView}`
    + `<h2>Характеристики и навыки</h2><p class="hint">${hint}</p>${attrGrid(A ? "admin" : P ? "player" : "view")}`
    + `<div class="two" style="margin-top:36px">${listBox("imp", "Киберимпланты", "+ Добавить имплант", A, freeNote("imp", R.classOf(S)))}${listBox("spl", "Заклинания", "+ Добавить заклинание", A, freeNote("spl", R.classOf(S)))}</div>`
    + `<h2>Личность</h2><div class="two">${ownPlanet}${V ? pers.map(textBox).join("") : [...pers, "notes", ...(A ? ["gm"] : [])].map(k => fld(k, WIDE.includes(k) ? "wide" : "")).join("")}</div>`;
}

/* ---------- мастер создания ---------- */
const STEPS = ["Кто ты", "Внешность", "Характеристики", "Вера", "Коронный навык", "Класс", "Характер", "История", "Проверка"];
const sname = id => R.SKILLS.find(x => x.id === id).name;
const modsText = c => Object.entries(c.mods).map(([id, v]) => `<span class="${v > 0 ? "up" : "down"}">${v > 0 ? "+" : "−"}${Math.abs(v)} ${esc(sname(id))}</span>`).join("");
const picksText = c => [c.imp ? `${c.imp} ${pl(c.imp, ["имплант", "импланта", "имплантов"])} на выбор` : "", c.spl ? `${c.spl} ${pl(c.spl, ["заклинание", "заклинания", "заклинаний"])} на выбор` : ""].filter(Boolean).join(", ");
// Что класс даёт бесплатно на выбор — игрок просит мастера, мастер добавляет.
const freeNote = (k, c) => c?.[k] ? `<p class="hint" style="margin:0 0 8px">Класс ${esc(c.name)}: ${c[k]} ${k === "imp" ? pl(c[k], ["имплант", "импланта", "имплантов"]) : pl(c[k], ["заклинание", "заклинания", "заклинаний"])} на выбор бесплатно, добавляет мастер. Больше — за кредиты.</p>` : "";
const STEP = [
  () => `<h2 class="stepH">Кто ты?</h2><p class="hint">Основное из досье. После регистрации эти данные меняет только мастер.</p>
    <div class="f">${fld("name", "wide")}${fld("sex")}${fld("dob")}${planetSel()}${planetInfo()}${fld("race")}${fld("h")}${fld("w")}</div>`,
  () => `<h2 class="stepH">Как ты выглядишь?</h2><p class="hint">Портрет и описание можно поменять и после регистрации.</p>
    <div class="idc">${photo(true)}<div class="f">${fld("look", "wide")}</div></div>`,
  () => {
    const left = R.POOL - R.spent(S);
    return `<h2 class="stepH">Распредели очки</h2><p class="hint">Каждая характеристика начинается с ${R.MIN}. У тебя ${R.POOL} очков, в одну характеристику можно вложить до ${R.MAX}. После регистрации характеристики заморожены навсегда.</p>
    <div class="pool${left ? "" : " zero"}"><b>${left}</b><span>${left ? pl(left, ["очко осталось", "очка осталось", "очков осталось"]) : "все очки распределены"}</span></div>
    <div class="alloc">${R.ATTRS.map(a => {
      const v = S.attr[a.id];
      return `<div class="arow"><div><h3>${a.name}<small>${a.text}. Навыки: ${a.skills.map(s => s[1]).join(", ")}</small></h3>
        <div class="pips">${Array.from({ length: R.MAX }, (_, i) => `<i class="${i < v ? "on" : ""}"></i>`).join("")}</div></div>
        <div class="step"><button data-act="attr" data-k="${a.id}" data-d="-1"${v <= R.MIN ? " disabled" : ""} aria-label="${a.name} меньше">−</button><span class="num">${v}</span><button data-act="attr" data-k="${a.id}" data-d="1"${v >= R.MAX || !left ? " disabled" : ""} aria-label="${a.name} больше">+</button></div></div>`;
    }).join("")}</div>`;
  },
  () => `<h2 class="stepH">Во что ты веришь?</h2><p class="hint">Вера даёт постоянный пассивный бонус +1 к одной характеристике. Выбрать можно любую, но после регистрации сменить её сможет только мастер.</p>
    <div class="faiths">${R.FAITHS.map(f => `<button class="fc${S.faith === f.id ? " on" : ""}" data-act="faith" data-f="${f.id}" aria-pressed="${S.faith === f.id}"><b>${f.name}</b><em>${f.perk}: +1 ${short(f.attr)}</em><span>${f.text}</span></button>`).join("")}</div>`,
  () => `<h2 class="stepH">Коронный навык</h2><p class="hint">Твоя специальность. Его предел прокачки на 1 выше, чем у остальных. Числа справа — значения навыков с учётом характеристик и веры (бонусы класса добавятся на следующем шаге).</p>${attrGrid("pick")}`,
  () => {
    const c = R.classOf(S);
    return `<h2 class="stepH">Кто ты по жизни?</h2><p class="hint">Класс даёт постоянные прибавки и штрафы к навыкам и стартовое снаряжение. После регистрации сменить его сможет только мастер.</p>
    <div class="clist" role="radiogroup" aria-label="Класс">${R.CLASSES.map(k => `<button class="crow${S.cls === k.id ? " on" : ""}" data-act="cls" data-c="${k.id}" role="radio" aria-checked="${S.cls === k.id}">
      <i class="dot" aria-hidden="true"></i>
      <span class="cn"><b>${esc(k.name)}</b><span>${esc(k.text)}</span></span>
      <span class="mods">${modsText(k)}</span>
      <small>${esc([...k.wpn.map(x => x.n), ...k.inv].join(", ") || "Без стартовых вещей")}${picksText(k) ? `<em>${picksText(k)}</em>` : ""}</small></button>`).join("")}</div>
    ${c && (c.imp || c.spl) ? `<div class="banner" style="margin:18px 0 0">${esc(c.name)}: ${picksText(c)}. Это бесплатно — после регистрации скажи мастеру, что хочешь, и он добавит. Больше можно купить за кредиты.</div>` : ""}`;
  },
  () => `<h2 class="stepH">Какой ты?</h2><p class="hint">Пара честных строк в каждом поле — мастеру этого хватит, чтобы зацепить персонажа за сюжет.</p>
    <div class="two">${fld("ideals")}${fld("traits")}${fld("bonds")}${fld("flaws")}</div>`,
  () => `<h2 class="stepH">Твоя история</h2><p class="hint">Откуда ты и как оказался там, где начинается игра.</p><div class="f">${fld("bio", "wide")}${fld("why", "wide")}</div>`,
  () => {
    const e = R.creationErrors(S);
    return `<h2 class="stepH">Проверка</h2>${e.length
      ? `<div class="errs">${e.map(x => `<p>${esc(x)}</p>`).join("")}</div>`
      : `<p class="hint">Всё готово. После регистрации характеристики, вера, класс и коронный навык будут заморожены, а данные досье будет менять только мастер. Стартовое снаряжение класса появится в инвентаре.</p>`}`;
  },
];
function wizView() {
  const last = step === STEPS.length - 1;
  return `<div class="panel"><div class="steps">${STEPS.map((t, i) => `<button data-act="go" data-i="${i}" class="${i === step ? "cur" : i < step ? "done" : ""}"${i === step ? ' aria-current="step"' : ""}>${t}</button>`).join("")}</div>
    ${STEP[step]()}
    <div class="nav"><button data-act="go" data-i="${step - 1}"${step ? "" : " disabled"}>Назад</button>${last
      ? `<button class="pri" data-act="register"${R.creationErrors(S).length ? " disabled" : ""}>Зарегистрировать персонажа</button>`
      : `<button class="pri" data-act="go" data-i="${step + 1}">Дальше</button>`}</div></div>`
    + (last ? `<div style="margin-top:22px">${sheetBody("view")}</div>` : "");
}

/* ---------- список игроков ---------- */
// Простой пароль для игрока: без похожих символов (0/o, 1/l).
const newPass = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), x => "abcdefghjkmnpqrstuvwxyz23456789"[x % 31]).join("");
function listView() {
  return `<div class="panel"><div class="toolbar"><h2 style="margin:0">Игроки</h2><span class="hint" style="margin:0">${list.length} ${pl(list.length, ["игрок", "игрока", "игроков"])}</span></div>
  <form class="newpl" data-form="adduser"><h3>Новый игрок</h3>
    <label>Логин<input name="login" autocomplete="off" placeholder="например, vasya" required></label>
    <label>Пароль<input name="password" autocomplete="off" value="${newPass()}" required></label>
    <button class="pri" type="submit">Создать</button></form>
  ${list.length ? `<div class="players">${list.map(p => `<button class="pl" data-act="open" data-e="${esc(p.login)}"><b>${esc(p.name || "Без имени")}</b>
    <span>${esc([p.race, p.prof].filter(Boolean).join(" · ") || "—")}</span><span>логин: ${esc(p.login)}</span>
    ${p.fresh ? `<span class="tag acc">Ещё не заходил</span>` : p.created ? `<span class="tag">Уровень ${esc(p.lvl)}</span>` : `<span class="tag acc">Создаёт персонажа</span>`}${p.sp ? ` <span class="tag">Очков навыков: ${esc(p.sp)}</span>` : ""}</button>`).join("")}</div>`
    : `<div class="empty">Игроков пока нет. Создайте игрока выше и передайте ему логин, пароль и ссылку на эту страницу.</div>`}</div>`;
}
// Окно с данными для входа — их нужно передать игроку.
const credDlg = (l, p, title) => dialog(`<h2 class="stepH">${title}</h2><p class="hint">Передайте игроку ссылку, логин и пароль. Пароль больше нигде не будет показан.</p>
  <div class="creds"><div><small>Ссылка</small><b>${esc(location.origin + location.pathname)}</b></div><div><small>Логин</small><b>${esc(l)}</b></div><div><small>Пароль</small><b>${esc(p)}</b></div></div>
  <button data-act="copycred" data-t="${esc(`Чарник ИАБ: ${location.origin + location.pathname}\nЛогин: ${l}\nПароль: ${p}`)}" style="margin-top:12px">Скопировать всё</button>`);
function loginView(err = "") {
  return `<form class="panel login" data-form="login"><h2 class="stepH">Вход</h2><p class="hint">Логин и пароль выдаёт мастер.</p>
    ${err ? `<div class="errs"><p>${esc(err)}</p></div>` : ""}
    <label>Логин<input name="login" autocomplete="username" required></label>
    <label>Пароль<input name="password" type="password" autocomplete="current-password" required></label>
    <button class="pri" type="submit">Войти</button></form>`;
}

/* ---------- отрисовка ---------- */
const saveBar = () => dirty && (mode === "sheet" || mode === "edit")
  ? `<div class="save"><span>Есть несохранённые изменения</span><div style="display:flex;gap:8px"><button data-act="revert">Отменить</button><button class="pri" data-act="savesheet">Сохранить</button></div></div>` : "";
const banner = () => API.demo ? `<div class="banner" style="margin-top:28px">Это демо: всё хранится только в этом браузере. На сайте вместо переключателя «Игрок / Мастер» будет вход по логину и паролю, и каждый игрок увидит только свой лист.</div>` : "";
function render() {
  const y = scrollY;
  let body = "";
  if (mode === "list") body = listView();
  else if (mode === "wiz") body = wizView();
  else if (mode === "edit") body = `<div class="panel toolbar" style="margin-bottom:14px"><button data-act="back">← Все игроки</button><span style="overflow-wrap:anywhere">логин: ${esc(editing)}</span><div style="display:flex;gap:8px;flex-wrap:wrap"><button data-act="peek"${peek ? ' class="pri"' : ""}>${peek ? "← Вернуться к правке" : "Глазами игрока"}</button>${peek ? "" : `<button data-act="pass">Сменить пароль</button><button class="warn" data-act="delask">Удалить игрока</button>`}</div></div>` + (peek ? peekView() : sheetBody("admin"));
  else body = sheetBody("player");
  app.innerHTML = body + banner() + saveBar();
  scrollTo(0, y);
}
// Лист так, как его видит игрок: без заметок мастера, всё закрыто от нажатий.
function peekView() {
  const keep = S, keepOpen = open;
  S = R.forPlayer(S); open = {};
  const html = `<div class="banner">Так лист видит игрок${dirty ? " (с вашими несохранёнными правками)" : ""}. Здесь ничего нельзя изменить.${keep.created ? "" : " Игрок ещё не закончил создание персонажа."}</div><div inert class="peek">${sheetBody("player")}</div>`;
  S = keep; open = keepOpen;
  return html;
}
function header() {
  $("#who").innerHTML = API.demo
    ? `<span>Демо:</span><button data-act="role" data-r="player" class="${ME.admin ? "" : "on"}">Игрок</button><button data-act="role" data-r="admin" class="${ME.admin ? "on" : ""}">Мастер</button><button data-act="reset">Сбросить</button>`
    : ME ? `<span>${esc(ME.admin ? `${ME.name || ME.login} [мастер]` : `${ME.login} · игрок`)}</span><button data-act="logout">Выйти</button>` : "";
}
async function home() {
  open = {}; peek = false; dirty = false; delArm = false; editing = "";
  if (ME.admin) { mode = "list"; list = await API.list(); }
  else { S = await API.sheet(); mode = S.created ? "sheet" : "wiz"; step = 0; }
  render();
}
const draft = () => { if (mode === "wiz") API.save(S).catch(err => toast(err.message, 1)); };
const draftSoon = () => { clearTimeout(saveT); saveT = setTimeout(draft, 700); };
function markDirty() {
  if (dirty) return;
  dirty = true;
  if (!$(".save")) app.insertAdjacentHTML("beforeend", saveBar());
}

/* ---------- события ---------- */
document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.k === "dob") {
    // Только цифры, тире ставятся сами: 20510121 → 2051-01-21
    const d = t.value.replace(/\D/g, "").slice(0, 8);
    t.value = d.length > 6 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
    t.classList.toggle("bad", t.value.length === 10 && !R.dobOk(t.value));
  }
  if (t.dataset.k === "h" || t.dataset.k === "w") t.value = t.value.replace(/\D/g, "").slice(0, 4);
  if (t.dataset.k) S[t.dataset.k] = t.dataset.n ? (parseInt(t.value) || 0) : t.value;
  else if (t.dataset.l) { const i = +t.dataset.i; if (t.dataset.f) S[t.dataset.l][i][t.dataset.f] = t.value; else S[t.dataset.l][i] = t.value; }
  else return;
  if (mode === "wiz") draftSoon(); else markDirty();
  if (t.dataset.k === "planet" && mode === "wiz") { render(); if (S.planet === R.OTHER) planetDlg(); return; }
  if (t.tagName === "SELECT" && mode === "edit") return render();
  const f = $("#fid"); if (f) f.textContent = R.fid(S);
  const hv = $("#humv");
  if (hv) { const h = R.humanity(S); hv.textContent = h; $("#humb").style.width = h + "%"; hv.closest(".hum").classList.toggle("low", h < 50); }
});

document.addEventListener("change", e => {
  const t = e.target;
  if (!t.dataset.photo) return;
  const file = t.files[0]; if (!file) return;
  const im = new Image(), u = URL.createObjectURL(file);
  im.onload = () => {
    const W = 240, H = 300, c = document.createElement("canvas"); c.width = W; c.height = H;
    const r = Math.max(W / im.width, H / im.height), w = im.width * r, h = im.height * r;
    c.getContext("2d").drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
    S.photo = c.toDataURL("image/jpeg", .82); URL.revokeObjectURL(u);
    if (mode === "wiz") draftSoon(); else dirty = true;
    render();
  };
  im.onerror = () => toast("Не удалось открыть картинку", 1);
  im.src = u;
});

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  const a = b.dataset.act, d = +b.dataset.d || 0;
  try {
    switch (a) {
      case "role": API.setRole(b.dataset.r); ME = await API.me(); header(); await home(); scrollTo(0, 0); break;
      case "reset": API.reset(); ME = await API.me(); header(); await home(); toast("Демо сброшено"); break;
      case "go": {
        const i = +b.dataset.i; if (i < 0 || i >= STEPS.length) return;
        const bad = R.basicsErrors(S);
        if (i > 0 && bad.length) {
          step = 0; render(); scrollTo(0, 0);
          $("#app .stepH").insertAdjacentHTML("afterend", `<div class="errs">${bad.map(x => `<p>${esc(x)}</p>`).join("")}</div>`);
          if (!R.dobOk(S.dob)) $('#app [data-k="dob"]').classList.add("bad");
          return toast("Сначала исправь досье", 1);
        }
        step = i; render(); scrollTo(0, 0); draft(); break; }
      case "attr": { const k = b.dataset.k, v = S.attr[k] + d; if (v < R.MIN || v > R.MAX || (d > 0 && R.spent(S) >= R.POOL)) return; S.attr[k] = v; render(); draftSoon(); break; }
      case "pdlg": planetDlg(); break;
      case "atlas": atlasDlg(); break;
      case "pick": S.planet = b.dataset.c; draftSoon(); if (S.planet === R.OTHER) planetDlg(); else $("#dlg").close(); break;
      case "dclose": $("#dlg").close(); break;
      case "faith": S.faith = b.dataset.f; render(); draftSoon(); break;
      case "cls": S.cls = b.dataset.c; render(); draftSoon(); break;
      case "sig": S.sig = b.dataset.id; render(); draftSoon(); break;
      case "register": clearTimeout(saveT); S = await API.save({ ...S, created: true }); mode = "sheet"; render(); scrollTo(0, 0); toast("Персонаж зарегистрирован в Бюро"); break;
      case "up": {
        const x = R.SKILLS.find(k => k.id === b.dataset.id), now = R.skill(S, x.id);
        dialog(`<h2 class="stepH">Прокачать «${esc(x.name)}»?</h2><p class="hint">${esc(x.text)}</p>
          <p style="font:800 34px 'Exo 2',sans-serif;margin:6px 0">${now} → <span style="color:var(--acc)">${now + 1}</span> <small style="font:500 15px Inter,sans-serif;color:var(--mute)">потолок ${R.ceil(S, x.id)}</small></p>
          <p>Потратится 1 очко навыков, останется ${S.sp - 1}. Отменить прокачку сможет только мастер.</p>`,
          `<button data-act="dclose">Отмена</button><button class="pri" data-act="upok" data-id="${x.id}">Прокачать</button>`);
        break;
      }
      case "upok": {
        $("#dlg").close();
        const next = JSON.parse(JSON.stringify(S)); next.rk[b.dataset.id] = (next.rk[b.dataset.id] || 0) + 1;
        S = await API.save(next); dirty = false; render(); toast("Навык прокачан"); break;
      }
      case "peek": peek = !peek; delArm = false; render(); scrollTo(0, 0); break;
      case "invt": open[b.dataset.l] = !open[b.dataset.l]; render(); break;
      case "lvl": {
        const v = S.lvl + d; if (v < 1 || v > R.MAX_LVL) return;
        S.lvl = v; S.sp = Math.max(0, S.sp + d); dirty = true; render();
        toast(d > 0 ? `Уровень ${v}: выдано 1 очко навыков. Нажмите «Сохранить».` : `Уровень ${v}: одно очко навыков снято`); break;
      }
      case "givesp": S.sp += 1; dirty = true; render(); toast("Выдано 1 очко навыков. Нажмите «Сохранить»."); break;
      case "aattr": S.attr[b.dataset.k] = Math.min(10, Math.max(1, S.attr[b.dataset.k] + d)); dirty = true; render(); break;
      case "ark": S.rk[b.dataset.id] = Math.max(0, (S.rk[b.dataset.id] || 0) + d); dirty = true; render(); break;
      case "addl": {
        const k = b.dataset.l; S[k].push(k === "imp" ? { n: "", c: "", d: "" } : DESC[k] ? { n: "", d: "" } : ""); dirty = true; render();
        const ins = document.querySelectorAll(`input[data-l="${k}"]`); (DESC[k] ? ins[ins.length - (k === "imp" ? 3 : 2)] : ins[ins.length - 1])?.focus();
        break;
      }
      case "del": S[b.dataset.l].splice(+b.dataset.i, 1); dirty = true; render(); break;
      case "savesheet": S = mode === "edit" ? await API.put(editing, S) : await API.save(S); dirty = false; render(); toast("Сохранено"); break;
      case "revert": dirty = false; S = mode === "edit" ? await API.load(editing) : await API.sheet(); render(); break;
      case "open": {
        const who = b.dataset.e;
        try { S = await API.load(who); }
        catch (err) { list = list.filter(p => p.login !== who); render(); throw err; } // игрок уже удалён — убираем его из списка
        open = {}; peek = false; editing = who; mode = "edit"; dirty = false; delArm = false; render(); scrollTo(0, 0); break;
      }
      case "back":
        if (dirty && !b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Не сохранено! Ещё раз — выйти"; return; }
        await home(); scrollTo(0, 0); break;
      case "delask":
        if (!delArm) { delArm = true; b.textContent = "Удалить игрока и его лист? Нажмите ещё раз"; return; }
        { const gone = editing; await API.del(gone); await home(); list = list.filter(p => p.login !== gone); render(); toast("Игрок удалён"); } break;
      case "pass": { const p = newPass(); await API.setPass(editing, p); credDlg(editing, p, "Новый пароль"); break; }
      case "copycred": await navigator.clipboard.writeText(b.dataset.t); toast("Скопировано"); break;
      case "logout": await API.logout(); ME = null; S = null; header(); app.innerHTML = loginView(); break;
    }
  } catch (err) { toast(err.message || "Ошибка", 1); }
});

document.addEventListener("submit", async e => {
  const f = e.target.closest("[data-form]"); if (!f) return;
  e.preventDefault();
  const v = Object.fromEntries(new FormData(f));
  try {
    if (f.dataset.form === "login") {
      ME = await API.login(v.login, v.password); header(); await home(); scrollTo(0, 0);
    } else if (f.dataset.form === "adduser") {
      const r = await API.addUser(v.login, v.password);
      list = await API.list();
      if (!list.some(p => p.login === r.login)) list.push({ ...R.summary(r.login, R.blank()), fresh: true });
      render(); credDlg(r.login, v.password, "Игрок создан");
    }
  } catch (err) {
    if (f.dataset.form === "login") {
      // Пароль подошёл, но браузер не сохранил вход (например, сайт открыт не по https) — не делаем вид, что вошли.
      const saved = ME && err.message === "Нужно войти";
      ME = null; header();
      app.innerHTML = loginView(saved ? "Пароль верный, но браузер не сохранил вход. Откройте страницу по адресу, начинающемуся с https://, и войдите ещё раз." : err.message);
    } else toast(err.message, 1);
  }
});

// Подсказка с описанием навыка при наведении (и при фокусе — для клавиатуры и телефона).
const tip = document.createElement("div"); tip.className = "tip"; tip.setAttribute("role", "tooltip"); document.body.append(tip);
function showTip(el) {
  tip.textContent = el.dataset.tip; tip.classList.add("on");
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
  tip.style.top = (r.top - h - 8 > 0 ? r.top - h - 8 : r.bottom + 8) + "px";
}
const hideTip = () => tip.classList.remove("on");
document.addEventListener("mouseover", e => { const el = e.target.closest("[data-tip]"); el ? showTip(el) : hideTip(); });
document.addEventListener("focusin", e => { const el = e.target.closest("[data-tip]"); el ? showTip(el) : hideTip(); });
addEventListener("scroll", hideTip, { passive: true });

// Окно закрыли (кнопкой или Esc) — перерисовать страницу под ним.
$("#dlg").addEventListener("close", () => { if (S) render(); });

(async () => {
  const d = await detect();
  if (d.err) { app.innerHTML = `<div class="panel"><h2 style="margin-top:0">Нет доступа</h2><p>${esc(d.err)}</p></div>`; return; }
  API = d.api; ME = d.me; header();
  if (!ME) { app.innerHTML = loginView(); return; }
  try { await home(); } catch (err) { app.innerHTML = `<div class="panel"><h2 style="margin-top:0">Ошибка</h2><p>${esc(err.message)}</p></div>`; }
})();
