/* Ummah Library — Tajwīd engine + renderer (Noor).
   A heuristic tajwīd tokenizer over Uthmani text with full diacritics. Classifies
   each letter-unit by rule (ghunnah, qalqalah, madd ×3 lengths, ikhfāʾ, idghām,
   iqlāb, silent) following the standard colour-coded-mushaf convention, then renders
   coloured spans. Conservative: anything uncertain stays in the base text colour, so
   it never *mis*-teaches. Exports: TJ (engine), TAJWID_LEGEND, TajwidText. */

const TJ = (function () {
  // diacritics
  const FATHA = "\u064E", DAMMA = "\u064F", KASRA = "\u0650", SUKOON = "\u0652", SHADDA = "\u0651";
  const FATHATAN = "\u064B", DAMMATAN = "\u064C", KASRATAN = "\u064D";
  const SUP_ALEF = "\u0670", MADDA = "\u0653", SMALL_ZERO = "\u06DF", SMALL_HIGH_ROUND = "\u06EC";
  // letters
  const ALEF = "\u0627", ALEF_WASLA = "\u0671", ALEF_MAQSURA = "\u0649", ALEF_MADDA = "\u0622";
  const WAW = "\u0648", YA = "\u064A", NOON = "\u0646", MEEM = "\u0645", LAM = "\u0644";
  const HAMZAS = "\u0621\u0623\u0625\u0624\u0626\u0622";              // ء أ إ ؤ ئ آ
  const QALQ = "\u0642\u0637\u0628\u062C\u062F";                      // ق ط ب ج د
  const THROAT = "\u0621\u0623\u0625\u0624\u0626\u0622\u0647\u0639\u062D\u063A\u062E"; // hamzas + ه ع ح غ خ
  const IDGHAM_G = "\u064A\u0646\u0645\u0648";                        // ي ن م و (with ghunnah)
  const IDGHAM_N = "\u0644\u0631";                                    // ل ر (without ghunnah)
  const IQLAB = "\u0628";                                             // ب
  const TANWEEN = FATHATAN + DAMMATAN + KASRATAN;
  const VOWELS = FATHA + DAMMA + KASRA;
  // any combining mark we attach to the preceding base letter
  const isMark = (ch) =>
    (ch >= "\u064B" && ch <= "\u065F") || ch === "\u0670" ||
    (ch >= "\u06D6" && ch <= "\u06ED") || (ch >= "\u0610" && ch <= "\u061A");

  function parseUnits(s) {
    const u = [];
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (isMark(ch)) { if (u.length) u[u.length - 1].m += ch; continue; }
      if (ch === " " || ch === "\n" || ch === "\u00A0") { u.push({ b: ch, m: "", sp: true }); continue; }
      u.push({ b: ch, m: "" });
    }
    return u;
  }
  const has = (unit, mark) => unit && unit.m.indexOf(mark) >= 0;
  const bareLong = (unit) => unit && !unit.sp && (unit.b === ALEF || unit.b === ALEF_MAQSURA) && unit.m === "";

  // next pronounced letter-unit (skip spaces, skip a silent bare alif after tanwīn)
  function nextLetter(u, i, skipBareAlef) {
    for (let j = i + 1; j < u.length; j++) {
      if (u[j].sp) continue;
      if (skipBareAlef && bareLong(u[j])) { skipBareAlef = false; continue; }
      return u[j];
    }
    return null;
  }
  const inSet = (unit, set) => unit && set.indexOf(unit.b) >= 0;

  function classify(text) {
    const u = parseUnits(text);
    for (let i = 0; i < u.length; i++) {
      const c = u[i]; if (c.sp) continue;
      const prev = (function () { for (let j = i - 1; j >= 0; j--) { if (!u[j].sp) return u[j]; } return null; })();
      const b = c.b;

      // 1 — silent: waṣl alif, sun-lām (lām with no vowel before a shaddah letter), zeroed alif
      if (b === ALEF_WASLA) { c.r = "silent"; continue; }
      if (b === LAM && c.m === "" && has(nextLetter(u, i), SHADDA)) { c.r = "silent"; continue; }
      if ((b === ALEF || b === WAW) && has(c, SMALL_ZERO)) { c.r = "silent"; continue; }

      // 2 — ghunnah: nūn/mīm carrying shaddah
      if ((b === NOON || b === MEEM) && has(c, SHADDA)) { c.r = "ghunnah"; continue; }

      // 3 — nūn sākinah & tanwīn  (bare word-final nūn has no written sukūn but is sākin)
      const noVowel = !(has(c, FATHA) || has(c, DAMMA) || has(c, KASRA) || has(c, SHADDA) || has(c, SUP_ALEF));
      const isNoonSakin = b === NOON && (has(c, SUKOON) || noVowel);
      const isTanwin = TANWEEN.split("").some((t) => has(c, t));
      if (isNoonSakin || isTanwin) {
        const nx = nextLetter(u, i, isTanwin);
        if (nx) {
          if (inSet(nx, THROAT)) { /* iẓhār — clear, no colour */ }
          else if (nx.b === IQLAB) c.r = "iqlab";
          else if (IDGHAM_G.indexOf(nx.b) >= 0) c.r = "ghunnah";       // idghām w/ ghunnah
          else if (IDGHAM_N.indexOf(nx.b) >= 0) c.r = "idgham";        // idghām w/o ghunnah
          else c.r = "ikhfa";
        }
        if (c.r) continue;
      }

      // 4 — mīm sākinah  (explicit sukūn or bare word-final mīm)
      if (b === MEEM && (has(c, SUKOON) || noVowel)) {
        const nx = nextLetter(u, i);
        if (nx && nx.b === IQLAB) c.r = "ikhfa";       // ikhfāʾ shafawī
        else if (nx && nx.b === MEEM) c.r = "ghunnah"; // idghām shafawī
        if (c.r) continue;
      }

      // 5 — qalqalah: قطبجد silent (sukūn) or in pausal end-position
      if (QALQ.indexOf(b) >= 0) {
        const atEnd = !nextLetter(u, i);
        if (has(c, SUKOON) || (atEnd && !VOWELS.split("").some((v) => has(c, v)))) { c.r = "qalqalah"; continue; }
      }

      // 6 — madd (prolongation) + length
      let isMadd = false;
      if (b === ALEF_MADDA) isMadd = true;
      else if (has(c, SUP_ALEF) || has(c, MADDA)) isMadd = true;
      else if ((b === ALEF || b === ALEF_MAQSURA) && c.m === "" && prev && has(prev, FATHA)) isMadd = true;
      else if (b === WAW && c.m === "" && prev && has(prev, DAMMA)) isMadd = true;
      else if ((b === YA) && c.m === "" && prev && has(prev, KASRA)) isMadd = true;
      if (isMadd) {
        const nx = nextLetter(u, i);
        if (nx && HAMZAS.indexOf(nx.b) >= 0) c.r = "madd45";           // muttaṣil / munfaṣil
        else if (nx && (has(nx, SHADDA) || has(nx, SUKOON))) c.r = "madd6"; // lāzim
        else c.r = "madd2";                                            // ṭabīʿī
        continue;
      }
    }

    // merge consecutive same-rule units into spans
    const spans = []; let cur = null;
    for (const unit of u) {
      const r = unit.r || null;
      const t = unit.b + unit.m;
      if (cur && cur.r === r) cur.t += t;
      else { cur = { r, t }; spans.push(cur); }
    }
    return spans;
  }

  const COLORS = {
    ghunnah: "#33B98C", qalqalah: "#4F90FF",
    madd2: "#E2A63F", madd45: "#E9743C", madd6: "#DE4D46",
    ikhfa: "#B677EE", idgham: "#3FB6AE", iqlab: "#EA72AB",
  };
  return { spans: classify, COLORS };
})();

const TAJWID_LEGEND = [
  { k: "ghunnah", c: "#33B98C", ar: "غُنَّة", en: "Ghunnah", d: "Nasal sound held ~2 counts — nūn/mīm with shaddah, and merged nūn." },
  { k: "qalqalah", c: "#4F90FF", ar: "قَلْقَلَة", en: "Qalqalah", d: "An echoing bounce on ق ط ب ج د when they carry a sukūn or end a pause." },
  { k: "madd2", c: "#E2A63F", ar: "مَدّ طَبِيعِي", en: "Madd · natural", d: "Stretch the long vowel about 2 counts." },
  { k: "madd45", c: "#E9743C", ar: "مَدّ مُتَّصِل", en: "Madd · 4–5", d: "Longer madd when a hamza follows the vowel." },
  { k: "madd6", c: "#DE4D46", ar: "مَدّ لَازِم", en: "Madd · necessary", d: "Obligatory 6-count stretch before a sukūn or shaddah." },
  { k: "ikhfa", c: "#B677EE", ar: "إِخْفَاء", en: "Ikhfāʾ", d: "Hide the nūn/mīm with a light nasal sound into the next letter." },
  { k: "idgham", c: "#3FB6AE", ar: "إِدْغَام", en: "Idghām", d: "Merge the nūn into a following ل or ر with no ghunnah." },
  { k: "iqlab", c: "#EA72AB", ar: "إِقْلَاب", en: "Iqlāb", d: "Nūn turns into a mīm sound before the letter ب." },
  { k: "silent", c: "#8C93A3", ar: "وَصْل", en: "Silent", d: "Not pronounced — joining hamza (waṣl) and the sun lām." },
];

// Renderer. `onRule(key)` makes coloured letters tappable to explain the rule.
function TajwidText({ text, className, style, onRule }) {
  let spans;
  try { spans = TJ.spans(text); } catch (e) { return <span className={className} style={style}>{text}</span>; }
  return (
    <span className={className} style={style}>
      {spans.map((sp, i) => {
        if (!sp.r) return <React.Fragment key={i}>{sp.t}</React.Fragment>;
        const silent = sp.r === "silent";
        return (
          <span key={i}
            onClick={onRule ? (e) => { e.stopPropagation(); onRule(sp.r); } : undefined}
            style={{ color: silent ? "currentColor" : TJ.COLORS[sp.r], opacity: silent ? 0.4 : 1, cursor: onRule ? "pointer" : "inherit" }}>
            {sp.t}
          </span>
        );
      })}
    </span>
  );
}

Object.assign(window, { TJ, TAJWID_LEGEND, TajwidText });
