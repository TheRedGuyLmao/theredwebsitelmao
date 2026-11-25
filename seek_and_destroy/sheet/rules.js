// Правила чарника. Этот файл используют и страница, и сервер,
// поэтому игрок не сможет обойти правила, подправив страницу.

export const POOL = 8;   // очков на распределение при создании
export const MIN = 1;    // стартовое значение каждой характеристики
export const MAX = 6;    // максимум при создании
export const MAX_LVL = 20; // максимальный уровень; каждый новый уровень даёт 1 очко навыков

// [код, название, система, описание для игроков]
export const PLANETS = [
  ["AJ-01-0001", "Плекс", "Аббра-Джонс",
    "Самая технически продвинутая планета галактики и столица. Здесь заседает правительство СверхВселенной, а на орбите висит главная станция ИАБ."],
  ["AU-03-5534", "Пенелид", "Аврора",
    "Самая магически развитая планета. Владение магией здесь ценится выше денег, происхождения и всего остального."],
  ["DE-08-0051", "Элизиум", "Делириум",
    "Тихая меланхоличная планета. Учёные изучают её по сей день: её медленно поглощает странная сила, которую называют Блеклостью."],
  ["VG-23-0512", "Ротфронт", "Вергиллия",
    "Ледяная планета. Работа на износ, рабские условия, и выбраться отсюда удаётся немногим."],
  ["GR-00-2001", "Пфир-Гаас", "Гобор",
    "Дикая планета: джунгли, поля, саванны и пустыни, между ними — деревенские поселения."],
  ["XX-00-0000", "Другая", "",
    "Своя планета. Опиши её сам: мастер решит, как она впишется в мир."],
];
export const OTHER = "XX-00-0000";
// Подсказка для игрока, который придумывает свою планету.
export const OTHER_NOTE = "Любая планета, которую ты придумаешь, находится в пределах СверхВселенной — не на Фронтире.";

// Вера пассивная: +1 к одной характеристике.
export const FAITHS = [
  { id: "none",  name: "Без веры", perk: "Трезвый взгляд",    attr: "int", text: "Ни богов, ни чудес — только голова на плечах." },
  { id: "varos", name: "Варос",    perk: "Благодать",         attr: "psy", text: "Бог чистоты и духовности. Магия и сила духа." },
  { id: "giros", name: "Гирос",    perk: "Дух прогресса",     attr: "phy", text: "Бог прогресса и технологий. Металл, мощь, выносливость." },
  { id: "epos",  name: "Эпос",     perk: "Путеводная память", attr: "mot", text: "Бог памяти и истории. Время, путь, точность движений." },
];

export const ATTRS = [
  { id: "int", name: "Интеллект",  short: "ИНТ", text: "логика, знания, медицина",
    skills: [["logic", "Логика", "Рассуждать, ловить противоречия и складывать факты в выводы."],
             ["an", "Анализ", "Разбирать устройства, улики и данные: понять, как что-то устроено и что здесь произошло."],
             ["med", "Медицина", "Лечить раны, ставить диагнозы, разбираться в лекарствах и ядах."],
             ["enc", "Энциклопедия", "Знания об истории, мирах, расах и всём на свете — полезные и не очень."]] },
  { id: "psy", name: "Психика",    short: "ПСИ", text: "воля, магия, влияние на людей",
    skills: [["auth", "Авторитет", "Убеждать, приказывать, давить и заставлять себя уважать."],
             ["mag", "Магия", "Творить заклинания и чувствовать чужую магию."],
             ["will", "Сила воли", "Держать себя в руках: страх, отчаяние, чужое внушение."],
             ["inl", "Внутренняя империя", "Интуиция, воображение, предчувствия и странные озарения."]] },
  { id: "phy", name: "Физиология", short: "ФИЗ", text: "сила, стойкость, тело",
    skills: [["str", "Сила", "Поднимать, ломать, бить — грубая мускульная мощь."],
             ["end", "Стойкость", "Выносливость и здоровье: яды, холод, усталость, долгие переходы."],
             ["pain", "Болевой порог", "Терпеть боль и оставаться в строю, когда другие падают."],
             ["elc", "Электрохимия", "Как тело ладит с веществами, стимуляторами и имплантами. И тяга к удовольствиям."]] },
  { id: "mot", name: "Моторика",   short: "МОТ", text: "ловкость, восприятие, реакция",
    skills: [["per", "Восприятие", "Замечать детали: звуки, запахи, следы, засады."],
             ["hand", "Ловкость рук", "Взлом, карманы, тонкая работа и быстрые пальцы."],
             ["sth", "Скрытность", "Двигаться незаметно, прятаться, сливаться с толпой."],
             ["equi", "Эквилибристика", "Равновесие, реакция, акробатика, уклонение."]] },
];

export const SKILLS = ATTRS.flatMap(a => a.skills.map(([id, name, text]) => ({ id, name, text, attr: a.id })));

const TEXT = ["name", "sex", "dob", "planet", "pname", "pdesc", "race", "prof", "h", "w", "look", "photo",
  "ideals", "traits", "bonds", "flaws", "bio", "why", "notes", "gm"];
// Что игрок может менять сам после регистрации (плюс инвентарь и кредиты):
const AFTER = ["look", "photo", "ideals", "traits", "bonds", "flaws", "bio", "why", "notes"];

export const blank = () => ({
  created: false, lvl: 1,
  name: "", sex: "", dob: "", planet: "AJ-01-0001", pname: "", pdesc: "", race: "", prof: "", h: "", w: "",
  look: "", photo: "",
  attr: { int: 1, psy: 1, phy: 1, mot: 1 }, faith: "", sig: "",
  ideals: "", traits: "", bonds: "", flaws: "", bio: "", why: "",
  rk: {}, sp: 0, cr: 100,
  inv: [], wpn: [], imp: [], spl: [],
  notes: "", gm: "",
});

const int = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

// Приводит любые присланные данные к правильной форме.
export function normalize(o) {
  o = o && typeof o === "object" ? o : {};
  const s = blank();
  for (const k of TEXT) s[k] = String(o[k] ?? s[k]).slice(0, k === "photo" ? 300000 : 6000);
  if (s.photo && !s.photo.startsWith("data:image/")) s.photo = "";
  if (!PLANETS.some(p => p[0] === s.planet)) s.planet = PLANETS[0][0];
  s.created = o.created === true;
  s.lvl = int(o.lvl, 1, MAX_LVL, 1);
  s.sp = int(o.sp, 0, 999, 0);
  s.cr = int(o.cr, -999999999, 999999999, 100);
  for (const a of ATTRS) s.attr[a.id] = int(o.attr?.[a.id], 1, 10, 1);
  s.faith = FAITHS.some(f => f.id === o.faith) ? o.faith : "";
  s.sig = SKILLS.some(x => x.id === o.sig) ? o.sig : "";
  for (const x of SKILLS) { const r = int(o.rk?.[x.id], 0, 20, 0); if (r) s.rk[x.id] = r; }
  const list = v => Array.isArray(v) ? v.slice(0, 200) : [];
  s.inv = list(o.inv).map(x => String(x ?? "").slice(0, 300));
  s.wpn = list(o.wpn).map(x => ({ n: String(x?.n ?? "").slice(0, 300), d: String(x?.d ?? "").slice(0, 600) }));
  // Заклинания раньше были просто строками — старые листы переводим в {название, описание}.
  s.spl = list(o.spl).map(x => typeof x === "string" ? { n: x.slice(0, 300), d: "" } : { n: String(x?.n ?? "").slice(0, 300), d: String(x?.d ?? "").slice(0, 600) });
  s.imp = list(o.imp).map(x => ({ n: String(x?.n ?? "").slice(0, 300), c: String(x?.c ?? "").slice(0, 6), d: String(x?.d ?? "").slice(0, 600) }));
  return s;
}

export const spent = s => ATTRS.reduce((a, x) => a + s.attr[x.id] - MIN, 0);
export const faithOf = s => FAITHS.find(f => f.id === s.faith);
export const attrOf = id => SKILLS.find(x => x.id === id)?.attr;
export const eff = (s, k) => s.attr[k] + (faithOf(s)?.attr === k ? 1 : 0);
export const cap = (s, id) => s.attr[attrOf(id)] + (s.sig === id ? 1 : 0);
export const skill = (s, id) => eff(s, attrOf(id)) + (s.rk[id] || 0);
// Потолок навыка: значение, когда в него вложено максимум очков.
export const ceil = (s, id) => eff(s, attrOf(id)) + cap(s, id);
export const humanity = s => Math.max(0, 100 - s.imp.reduce((a, i) => a + (parseInt(i.c) || 0), 0));
export const planetName = s => s.planet === OTHER ? (s.pname.trim() || "Другая") : PLANETS.find(p => p[0] === s.planet)?.[1] || "";
export function fid(s) {
  let h = 7;
  for (const ch of s.name) h = (h * 31 + ch.charCodeAt(0)) % 99991;
  return s.planet + "/" + String(h % 10000).padStart(4, "0");
}

// Дата рождения строго ГГГГ-ММ-ДД и должна существовать (никаких 31 февраля).
export function dobOk(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
// Ошибки первого шага (досье) — без них дальше не пустит.
export function basicsErrors(s) {
  const e = [];
  if (!s.name.trim()) e.push("Не указано имя");
  if (!dobOk(s.dob)) e.push("Дата рождения: нужен формат ГГГГ-ММ-ДД, например 2051-01-21");
  if (s.planet === OTHER && (!s.pname.trim() || !s.pdesc.trim())) e.push("Своя планета: нужно название и описание");
  return e;
}

export function creationErrors(s) {
  const e = basicsErrors(s);
  for (const a of ATTRS) if (s.attr[a.id] < MIN || s.attr[a.id] > MAX) e.push(`${a.name}: от ${MIN} до ${MAX}`);
  if (spent(s) !== POOL) e.push(`Распределено ${spent(s)} из ${POOL} очков характеристик`);
  if (!faithOf(s)) e.push("Не выбрана вера");
  if (!s.sig) e.push("Не выбран коронный навык");
  return e;
}

// Изменения от игрока. Бросает Error с понятным текстом, если что-то нельзя.
export function playerUpdate(oldS, inc) {
  const old = normalize(oldS || blank());
  inc = normalize(inc);
  const n = normalize(old);
  if (!old.created) {
    for (const k of ["name", "sex", "dob", "planet", "pname", "pdesc", "race", "prof", "h", "w", ...AFTER]) n[k] = inc[k];
    n.inv = inc.inv; n.wpn = inc.wpn;
    n.attr = inc.attr; n.faith = inc.faith; n.sig = inc.sig;
    for (const a of ATTRS) if (n.attr[a.id] > MAX) throw new Error(`${a.name} не может быть больше ${MAX}`);
    if (spent(n) > POOL) throw new Error(`Можно распределить только ${POOL} очков`);
    if (inc.created) {
      const e = creationErrors(n);
      if (e.length) throw new Error(e.join(". "));
      n.created = true;
    }
    return n;
  }
  for (const k of AFTER) n[k] = inc[k];
  n.inv = inc.inv; n.wpn = inc.wpn; n.cr = inc.cr;
  let cost = 0;
  for (const x of SKILLS) {
    const a = old.rk[x.id] || 0, b = inc.rk[x.id] || 0;
    if (b < a) throw new Error("Навыки нельзя понижать");
    if (b > cap(old, x.id) && b > a) throw new Error(`${x.name}: достигнут предел ${cap(old, x.id)}`);
    cost += b - a;
  }
  if (cost > old.sp) throw new Error("Не хватает очков навыков");
  n.rk = inc.rk; n.sp = old.sp - cost;
  return n;
}

// Мастер может менять всё.
export const adminUpdate = (oldS, inc) => normalize(inc);

// То, что видит игрок: без заметок мастера.
export const forPlayer = s => { const c = normalize(s); delete c.gm; return c; };

export const summary = (login, s) => ({
  login, name: s.name, lvl: s.lvl, created: s.created, race: s.race, prof: s.prof, sp: s.sp, photo: s.photo ? 1 : 0,
});
