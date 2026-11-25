// Правила чарника. Этот файл используют и страница, и сервер,
// поэтому игрок не сможет обойти правила, подправив страницу.

export const POOL = 8;   // очков на распределение при создании
export const MIN = 1;    // стартовое значение каждой характеристики
export const MAX = 6;    // максимум при создании
// Время кампании. Возраст = YEAR − год рождения (3033 → 18 лет).
export const YEAR = 3051;
export const DOB_MIN = 2955;   // самый ранний год рождения
export const DOB_MAX = 3033;   // самый поздний год рождения
export const YEAR_NOTE = "Действия происходят в 3051 году. Минимальный год 3033, максимальный - 2955";
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

// Классы. mods — постоянные прибавки к навыкам (id навыка: число),
// wpn/inv — что выдаётся при регистрации, imp/spl — сколько имплантов/заклинаний на выбор игрок может
// бесплатно попросить у мастера (больше — уже покупать за кредиты). Добавляет их мастер.
export const CLASSES = [
  { id: "adv", name: "Авантюрист", text: "Самый скучный вариант, когда не хочется выбирать.",
    mods: { equi: 1, will: 1, auth: -1 }, wpn: [], inv: ["Телефон"], imp: 1, spl: 0 },
  { id: "gun", name: "Стрелок", text: "Эксперт в оружии, глаз-алмаз, запах пороха завораживает.",
    mods: { per: 1, auth: 1, med: -1 }, wpn: [{ n: "Пистолет Hugger-22", d: "Магазин: 10/10 патр." }], inv: ["Патроны 9 мм (30 шт.)"], imp: 1, spl: 0 },
  { id: "tech", name: "Техник", text: "Золотые руки, умник, собирай крутые прибамбасы.",
    mods: { hand: 1, an: 1, end: -1 }, wpn: [], inv: ["Пояс с инструментами", "Самодельное радио", "Лёгкие материалы"], imp: 2, spl: 0 },
  { id: "mage", name: "Маг", text: "На одной волне с маной, используй фантазию в свою пользу.",
    mods: { mag: 1, enc: 1, str: -1 }, wpn: [], inv: ["Большая шляпа колдуна", "Зелье лечения", "Пергамент и карандаш"], imp: 0, spl: 3 },
  { id: "det", name: "Детектив", text: "Логический склад ума, находи связь там, где другие слепы.",
    mods: { logic: 1, inl: 1, elc: 1, enc: -2 }, wpn: [{ n: "Карманный револьвер", d: "Барабан: 5/5 патр." }], inv: ["Журнал заметок", "Патроны .358 магнум (15 шт.)"], imp: 1, spl: 0 },
  { id: "bers", name: "Берсерк", text: "Да кому нужны роскошества будущего? Твоих кулаков достаточно!",
    mods: { str: 1, pain: 1, sth: -1 }, wpn: [{ n: "Кулаки", d: "Что тебе ещё нужно для счастья?" }], inv: ["Боевой стимулятор (3 шт.)"], imp: 0, spl: 1 },
  { id: "rogue", name: "Плут", text: "Скрытность — твоё второе имя. Пропадай перед глазами у врагов. Кради, что неровно лежит.",
    mods: { sth: 1, hand: 1, pain: -1 }, wpn: [], inv: ["Воровские инструменты", "Антикварная монета", "Оценочный инструмент"], imp: 0, spl: 1 },
  { id: "medic", name: "Медик", text: "Клятва Гиппократа.",
    mods: { med: 2, elc: -1 }, wpn: [], inv: ["Набор первой помощи (5 использований)", "Медицинский анализатор", "Шприц с морфином"], imp: 0, spl: 0 },
  { id: "chum", name: "Чумба", text: "Плоть слаба, чипуйся!",
    mods: { end: 1, equi: 1, mag: -1 }, wpn: [{ n: "Пистолет Лексингтон", d: "Магазин: 21/21 патр." }], inv: ["Магазин для Лексингтона, 21 патр. (3 шт.)"], imp: 3, spl: 0 },
];

const TEXT = ["name", "sex", "dob", "planet", "pname", "pdesc", "pcode", "race", "prof", "h", "w", "look", "photo",
  "ideals", "traits", "bonds", "flaws", "bio", "why", "notes", "gm"];
// Что игрок может менять сам после регистрации (плюс инвентарь и кредиты):
const AFTER = ["look", "photo", "ideals", "traits", "bonds", "flaws", "bio", "why", "notes"];

export const blank = () => ({
  created: false, lvl: 1,
  name: "", sex: "", dob: "", planet: "AJ-01-0001", pname: "", pdesc: "", pcode: "", race: "", prof: "", cls: "", h: "", w: "",
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
  s.cls = CLASSES.some(c => c.id === o.cls) ? o.cls : "";
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
export const classOf = s => CLASSES.find(c => c.id === s.cls);
// Профессия в листе — это класс (у старых листов мог остаться свободный текст).
export const profName = s => classOf(s)?.name || s.prof;
// Прибавка класса к навыку (может быть отрицательной).
export const mod = (s, id) => classOf(s)?.mods[id] || 0;
export const eff = (s, k) => s.attr[k] + (faithOf(s)?.attr === k ? 1 : 0);
export const cap = (s, id) => s.attr[attrOf(id)] + (s.sig === id ? 1 : 0);
export const skill = (s, id) => Math.max(0, eff(s, attrOf(id)) + (s.rk[id] || 0) + mod(s, id));
// Потолок навыка: значение, когда в него вложено максимум очков.
export const ceil = (s, id) => Math.max(0, eff(s, attrOf(id)) + cap(s, id) + mod(s, id));
export const humanity = s => Math.max(0, 100 - s.imp.reduce((a, i) => a + (parseInt(i.c) || 0), 0));
// Код своей планеты: СИСТЕМА-НН-НННН, например KR-07-1234. Пустой — значит XX-00-0000.
export const pcodeOk = v => /^[A-Z]{2}-\d{2}-\d{4}$/.test(v);
export const planetCode = s => s.planet === OTHER ? (pcodeOk(s.pcode) ? s.pcode : OTHER) : s.planet;
export const planetName = s => s.planet === OTHER ? (s.pname.trim() || "Другая") : PLANETS.find(p => p[0] === s.planet)?.[1] || "";
export function fid(s) {
  let h = 7;
  for (const ch of s.name) h = (h * 31 + ch.charCodeAt(0)) % 99991;
  return planetCode(s) + "/" + String(h % 10000).padStart(4, "0");
}

// Дата рождения строго ГГГГ-ММ-ДД и должна существовать (никаких 31 февраля).
export function dobOk(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
// Возраст по дате рождения (или null, если дата неполная).
export const age = dob => dobOk(dob) ? YEAR - +dob.slice(0, 4) : null;
export const ageText = n => n === null ? "" : `${n} ${n % 100 > 10 && n % 100 < 20 ? "лет" : n % 10 === 1 ? "год" : n % 10 > 1 && n % 10 < 5 ? "года" : "лет"}`;
// Ошибки первого шага (досье) — без них дальше не пустит.
export function basicsErrors(s) {
  const e = [];
  if (!s.name.trim()) e.push("Не указано имя");
  if (!dobOk(s.dob)) e.push(`Дата рождения: нужен формат ГГГГ-ММ-ДД, например ${DOB_MAX - 3}-01-21`);
  else if (+s.dob.slice(0, 4) < DOB_MIN || +s.dob.slice(0, 4) > DOB_MAX) e.push(`Дата рождения: год от ${DOB_MIN} до ${DOB_MAX} (сейчас ${YEAR} год)`);
  if (s.planet === OTHER && (!s.pname.trim() || !s.pdesc.trim())) e.push("Своя планета: нужно название и описание");
  if (s.planet === OTHER && s.pcode) {
    if (!pcodeOk(s.pcode)) e.push("Код планеты: нужен формат СИСТЕМА-НН-НННН, например KR-07-1234");
    else if (PLANETS.some(p => p[0] === s.pcode && p[0] !== OTHER)) e.push("Код планеты: такой код уже занят известной планетой");
  }
  return e;
}

export function creationErrors(s) {
  const e = basicsErrors(s);
  for (const a of ATTRS) if (s.attr[a.id] < MIN || s.attr[a.id] > MAX) e.push(`${a.name}: от ${MIN} до ${MAX}`);
  if (spent(s) !== POOL) e.push(`Распределено ${spent(s)} из ${POOL} очков характеристик`);
  if (!faithOf(s)) e.push("Не выбрана вера");
  if (!classOf(s)) e.push("Не выбран класс");
  if (!s.sig) e.push("Не выбран коронный навык");
  return e;
}

// Изменения от игрока. Бросает Error с понятным текстом, если что-то нельзя.
export function playerUpdate(oldS, inc) {
  const old = normalize(oldS || blank());
  inc = normalize(inc);
  const n = normalize(old);
  if (!old.created) {
    for (const k of ["name", "sex", "dob", "planet", "pname", "pdesc", "pcode", "race", "prof", "h", "w", ...AFTER]) n[k] = inc[k];
    n.inv = inc.inv; n.wpn = inc.wpn;
    n.attr = inc.attr; n.faith = inc.faith; n.sig = inc.sig; n.cls = inc.cls;
    const c = classOf(n); // импланты и заклинания игрок сам не добавляет — это делает мастер
    for (const a of ATTRS) if (n.attr[a.id] > MAX) throw new Error(`${a.name} не может быть больше ${MAX}`);
    if (spent(n) > POOL) throw new Error(`Можно распределить только ${POOL} очков`);
    if (inc.created) {
      const e = creationErrors(n);
      if (e.length) throw new Error(e.join(". "));
      n.created = true;
      // Стартовое снаряжение класса.
      n.wpn = [...c.wpn.map(x => ({ ...x })), ...n.wpn];
      n.inv = [...c.inv, ...n.inv];
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
  login, name: s.name, lvl: s.lvl, created: s.created, race: s.race, prof: profName(s), sp: s.sp, photo: s.photo ? 1 : 0,
});
