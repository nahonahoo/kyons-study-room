// 英単語ネタ帳（english_reading/eng_vocab.html）
// 中学3年間の英単語を「書くための呪文（つづりのローマ字読み）」＋キャラのネタ＋間隔反復で覚えるページ。
// 単語データは eng_vocab_data.js の VOCAB。記録は localStorage（nh3_ 接頭辞なので progress_sync.html で持ち運べる）。
(function () {
'use strict';

// ====== 定数 ======
const SRS_KEY = 'nh3_vocab_srs';    // { 単語(小文字): {b:箱, d:次に出す日, s:出題数, ok:正解数, ng:不正解数, f:初めて覚えた日} }
const META_KEY = 'nh3_vocab_meta';  // 連続日数・設定など
const INT = [0, 1, 2, 4, 7, 14, 30, 60]; // 箱ごとの次の出題までの日数（箱1〜7）
const LEARNED_BOX = 3;              // この箱以上を「覚えた（お客さん）」とする
const MASTER_BOX = 6;               // この箱以上を「殿堂入り」
const LIVE_NAME = '『AB型の左利き専用右利き滅びろライブ』';
const MILES = [10, 30, 50, 100, 200, 300, 500, 800, 1000, 1200, 1400];

const SPK = {
  'き': { name: 'きょん', face: '🎤', cls: 'k' },
  'に': { name: 'にっくん', face: '📺', cls: 'n' },
  'し': { name: 'しゅん', face: '🎭', cls: 's' },
  'く': { name: 'くるま', face: '🚗', cls: 'r' },
  'イ': { name: 'イワクラ', face: '🎸', cls: 'i' },
};

const PRAISE = [
  ['き', 'やった！天才かも！'], ['き', 'にっくんより賢くなったかも！'], ['き', '今の、ネタ帳に書いとこ'],
  ['に', '正解。よく覚えてたね'], ['に', 'できてる。その調子'], ['に', '呪文が効いてるね'],
  ['し', 'きょんさん、完璧です！僕の出番がなくなります'], ['し', 'お見事です。拍手の音、脳内で流しておきます'],
  ['く', 'えぐいっす！天才っす！もうM-1獲れるっす！'], ['く', '今の正解、劇場ドッカンっす！'],
  ['イ', 'やるじゃん。ちょっと見直した'], ['イ', '正解。私の心のシャッター音が鳴った'],
];
const CONSOLE = [
  ['に', '惜しい。呪文をもう一回唱えてみよう。次は取れるよ'],
  ['に', '大丈夫。一回間違えた単語のほうが、あとで覚えやすいんだ'],
  ['し', 'きょんさん、ドンマイです！今のは“フリ”です。次でオチをつけましょう'],
  ['き', 'あれ！？また間違えた！…でも呪文はもう覚えたから次はいける'],
  ['イ', '間違えた単語のほうが記憶に残るらしいよ。今ので一個残った'],
  ['く', '今のは助走っす！次で跳ぶっす！'],
];

// つづりのパターン（芸人ユニット）。id は単語データの p と対応
const PATTERNS = [
  { id: 'magic_e', name: 'サイレントe（裏方の魔術師）', rule: '最後の e は読まない。でも前の母音を「アルファベット読み」（a→エイ、i→アイ、o→オウ、u→ユー）に変える魔法をかける。', tip: '呪文では最後の e を「エ」とはっきり唱える。make＝マ・ケ、time＝ティ・メ。' },
  { id: 'gh', name: 'gh（無言コンビ）', rule: 'gh はほとんど読まない（night、eight、daughter）。たまに「フ」と読む（laugh、enough）。', tip: '呪文では「グハ」と唱えて存在をアピール。night＝ニ・グハ・ト。' },
  { id: 'kn', name: 'kn（しゃべらない k）', rule: '単語の頭の kn は、k を読まない。know、knife、knee、knock。', tip: '呪文では k を「ク」と声に出す。know＝ク・ノウ。' },
  { id: 'wr', name: 'wr（しゃべらない w）', rule: '単語の頭の wr は、w を読まない。write、wrong、wrap。', tip: '呪文では w を「ウ」と声に出す。write＝ウ・リ・テ。' },
  { id: 'silent', name: 'その他の黙る文字（無言芸の達人たち）', rule: '聞こえないのに書く文字。climb の b、walk の l、listen の t、hour の h、island の s、answer の w、autumn の n。', tip: '聞こえない文字こそ呪文で大きく唱える。listen＝リス・テン。' },
  { id: 'ph', name: 'ph（フの変装コンビ）', rule: '「フ」の音が ph で書かれることがある。phone、photo、elephant、alphabet。', tip: '呪文では ph＝「フ」と唱え、見た目で p と h を確認。' },
  { id: 'ck', name: 'ck（ック兄弟）', rule: '短い母音のあとの「ック」は ck。back、clock、kick、pocket。', tip: '「ック」と聞こえたら c と k のコンビを思い出す。' },
  { id: 'ee_ea', name: 'ee・ea（イーの二枚看板）', rule: '「イー」は ee か ea で書くことが多い。tree、see／eat、sea。', tip: '呪文で ee＝エエ、ea＝エア と言い分けると区別できる。' },
  { id: 'oo', name: 'oo（ウーのメガネ芸人）', rule: '「ウー」「ウ」は oo のことが多い。book、school、food、good。', tip: 'o が2つ並んだ顔＝メガネ。呪文では オオ と唱える。' },
  { id: 'ou_ow', name: 'ou・ow（アウの叫び隊）', rule: '「アウ」は ou か ow。house、out、mouth／now、down、town。', tip: '呪文は ou も ow も「オウ」。クラウド→ク・ル・オウ・ド。' },
  { id: 'ai_ay', name: 'ai・ay（エイの兄弟）', rule: '「エイ」は単語の中なら ai、最後なら ay。rain、wait／day、play。', tip: '呪文では ai＝アイ、ay＝アイ と唱える。rain＝ラ・イン。' },
  { id: 'oa_ow', name: 'oa・ow（オウの二人組）', rule: '「オウ」は oa か ow。boat、road／snow、window。', tip: '呪文では oa＝オア、ow＝オウ。' },
  { id: 'tion', name: 'tion・sion（ション一座）', rule: '単語の最後の「ション」はほぼ tion。たまに sion（vision、television）。', tip: '呪文では tion＝ティオン、sion＝シオン。station＝スタ・ティオン。' },
  { id: 'ture', name: 'ture（チャーの人）', rule: '最後の「チャー」は ture。picture、future、nature、culture。', tip: '呪文では ture＝ツレ。picture＝ピク・ツレ。' },
  { id: 'er_ir_ur', name: 'er・ir・ur（アーのあいまいトリオ）', rule: 'あいまいな「アー」は er、ir、ur のどれか。her、bird、turn。どれになるかは単語ごとに覚える。', tip: '呪文で エル・イル・ウル と言い分ける。bird＝ビ・ル・ド。' },
  { id: 'ar_or', name: 'ar・or（アーとオーの漫才コンビ）', rule: 'はっきりした「アー」は ar（car、park）、「オー」は or（short、sport）。', tip: '呪文で アル／オル と唱える。' },
  { id: 'al', name: 'al（オールの人）', rule: '「オー」「オール」が al になる。all、ball、call、talk、walk（l は黙る）。', tip: '呪文では アル と唱える。walk＝ワル・ク。' },
  { id: 'wh', name: 'wh（疑問詞ファミリー）', rule: 'what、where、when、who、which、why… 疑問詞はほとんど wh で始まる。white、whale も。', tip: 'h を忘れがち。呪文で ウハ と入れる。what＝ウハ・ト。' },
  { id: 'th', name: 'th（舌出し芸人）', rule: '舌を歯ではさむ「ス」「ズ」の音は th。this、that、three、mother。', tip: '呪文では th＝ス（またはズ）。見た目は必ず t と h の2文字。' },
  { id: 'sh_ch', name: 'sh・ch・tch（シュとチの一門）', rule: '「シュ」は sh、「チ」は ch。短い母音のあとの「ッチ」は tch（watch、catch）。', tip: '呪文で sh＝シュ、ch＝チ、tch＝トチ。' },
  { id: 'qu', name: 'qu（離れられない二人）', rule: 'q のうしろには必ず u がつく。queen、quiet、question、quick。', tip: 'q を書いたら u を連れてくる。呪文では qu＝クウ。' },
  { id: 'soft_cg', name: 'c・g（e と i の前で変身）', rule: 'c は e・i・y の前で「ス」（city、ice、center）。g は e・i・y の前で「ジ」になりやすい（orange、large、giraffe）。', tip: '「ス」なのに c、「ジ」なのに g の単語はここで覚える。' },
  { id: 'y_end', name: '語尾の y（二つの顔を持つ男）', rule: '最後の y は「イー」（happy、city）か「アイ」（my、fly、cry）。', tip: '呪文では y＝イ。happy＝ハップ・イ。' },
  { id: 'double', name: 'ダブル文字（そっくり双子）', rule: '同じ文字を2つ重ねる単語。little、coffee、swimming、happy、butterfly。音では1つにしか聞こえない。', tip: '呪文で「ッ」を入れて重ねを感じる。happy＝ハップ・イ。' },
  { id: 'le_end', name: '-le（最後のルの人）', rule: '最後の「ル」は le と書くことが多い。apple、table、little、people。', tip: '呪文では le＝レ。apple＝アップ・レ。' },
  { id: 'suffix', name: 'くっつき芸人（-ful -ly -ment など）', rule: '後ろにくっついて意味を足すパーツ。-ful（いっぱいの）、-ly（〜に）、-ment・-ness（こと）、-er（人・もっと）、-est（いちばん）。', tip: '元の単語＋くっつき芸人、と分けて覚えれば長い単語もこわくない。' },
  { id: 'odd', name: 'ピン芸人（例外）', rule: 'ルールでは説明できない、ひとりで勝負している単語。one、two、said、people、friend、women、Wednesday。', tip: '数は少ない。呪文を歌詞みたいに丸暗記するのがいちばん早い。' },
];
const PAT_BY_ID = {};
PATTERNS.forEach(p => { PAT_BY_ID[p.id] = p; });

// ====== データ ======
const V = (window.VOCAB || []);
const BY = {};
V.forEach((e, i) => { e.key = e.w.toLowerCase(); e.i = i; BY[e.key] = e; });
const WORDSET = new Set(V.map(e => e.key));

// ====== 保存 ======
function load(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
let srs = load(SRS_KEY, {});
if (!srs || typeof srs !== 'object') srs = {};
const META_DEF = { streak: 0, last: -1, days: {}, newPer: 5, order: 'unk', rate: 0.85, typing: true, autoChant: true, pins: [], seenHowto: false, doneDay: -1, mile: 0, seed: 0 };
let meta = Object.assign({}, META_DEF, load(META_KEY, {}));
if (!meta.seed) { meta.seed = Math.floor(Math.random() * 1e9) + 1; }
function saveAll() { save(SRS_KEY, srs); save(META_KEY, meta); }

function today() { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }

function getXp() { try { return parseInt(localStorage.getItem('nh3_xp') || '0', 10) || 0; } catch (e) { return 0; } }
function addXp(n) {
  if (!n) return;
  try { localStorage.setItem('nh3_xp', String(Math.max(0, getXp() + n))); } catch (e) {}
  const p = document.createElement('div'); p.className = 'xp-pop'; p.textContent = '+' + n + ' XP';
  document.body.appendChild(p); setTimeout(() => p.remove(), 1000);
  renderNav();
}
// ダッシュボードの学習カレンダー用（他の英語ページと同じ書き方）
function countDaily() {
  try {
    const k = new Date().toISOString().slice(0, 10);
    const d = JSON.parse(localStorage.getItem('nh3_daily') || '{}');
    d[k] = (d[k] || 0) + 1;
    localStorage.setItem('nh3_daily', JSON.stringify(d));
  } catch (e) {}
}
function markActive() {
  const t = today();
  if (meta.last !== t) {
    meta.streak = (meta.last === t - 1) ? meta.streak + 1 : 1;
    meta.last = t;
    if (meta.streak > 1) toast('🔥 ' + meta.streak + '日連続！ きょん「続いてる俺、えらくない？」', true);
  }
  meta.days[t] = (meta.days[t] || 0) + 1;
  const keys = Object.keys(meta.days).map(Number).sort((a, b) => a - b);
  while (keys.length > 60) delete meta.days[keys.shift()];
}
function curStreak() { const t = today(); return (meta.last === t || meta.last === t - 1) ? meta.streak : 0; }

// ====== 集計 ======
function learnedCount() { let n = 0; for (const k in srs) if (srs[k].b >= LEARNED_BOX && BY[k]) n++; return n; }
function dueKeys() {
  const t = today();
  return Object.keys(srs).filter(k => BY[k] && srs[k].d <= t)
    .sort((a, b) => (srs[a].d - srs[b].d) || (srs[a].b - srs[b].b));
}
function status(k) {
  const s = srs[k];
  if (!s) return { lv: 0, label: 'まだ' };
  if (s.b >= MASTER_BOX) return { lv: 4, label: '殿堂入り' };
  if (s.b >= LEARNED_BOX) return { lv: 3, label: '覚えた' };
  if (s.d <= today()) return { lv: 1, label: '復習どき' };
  return { lv: 2, label: '練習中' };
}

// ====== 新しく覚える順番 ======
function seeded(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
let ORDER = null;
function getOrder() {
  if (ORDER) return ORDER;
  let list = V.slice();
  if (meta.order === 'random') {
    const r = seeded(meta.seed);
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  } else {
    list.sort((a, b) => (meta.order === 'unk' ? (b.u - a.u) : 0) || (a.g - b.g) || (a.i - b.i));
  }
  ORDER = list.map(e => e.key);
  return ORDER;
}
function nextNew(n) {
  const out = [];
  meta.pins = (meta.pins || []).filter(k => BY[k] && !srs[k]);
  for (const k of meta.pins) { if (out.length >= n) break; out.push(k); }
  for (const k of getOrder()) { if (out.length >= n) break; if (!srs[k] && out.indexOf(k) < 0) out.push(k); }
  return out;
}

// ====== 小道具 ======
const $ = id => document.getElementById(id);
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
let toastTimer = null;
function toast(msg, gold) {
  const t = $('toast'); t.textContent = msg; t.className = 'toast show' + (gold ? ' gold' : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = 'toast'; }, 2600);
}
function lev(a, b) {
  const m = a.length, n = b.length, d = [];
  for (let i = 0; i <= m; i++) { d[i] = [i]; }
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function gradeLabel(g) { return '中' + g; }

// ====== 音声 ======
const TTS = {
  ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
  en: null, ja: null, gen: 0,
  init() {
    if (!this.ok) return;
    const best = (vs, lang) => {
      const c = vs.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').indexOf(lang) === 0);
      const score = v => (/natural|online|neural/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (lang === 'en' && /en-us/i.test(v.lang.replace('_', '-')) ? 1 : 0);
      c.sort((a, b) => score(b) - score(a));
      return c[0] || null;
    };
    const pickV = () => { const vs = speechSynthesis.getVoices(); if (vs.length) { this.en = best(vs, 'en'); this.ja = best(vs, 'ja'); } };
    pickV();
    try { speechSynthesis.addEventListener('voiceschanged', pickV); } catch (e) { speechSynthesis.onvoiceschanged = pickV; }
  },
  cancel() { this.gen++; if (this.ok) try { speechSynthesis.cancel(); } catch (e) {} },
  speak(text, lang, rate) {
    return new Promise(res => {
      if (!this.ok || !text) { setTimeout(res, 300); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'ja' ? 'ja-JP' : 'en-US';
      const v = lang === 'ja' ? this.ja : this.en; if (v) u.voice = v;
      u.rate = rate || 1;
      let done = false; const fin = () => { if (!done) { done = true; res(); } };
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 1500 + text.length * (lang === 'ja' ? 260 : 140) / (rate || 1)); // onend が来ない環境の保険
      try { speechSynthesis.speak(u); } catch (e) { fin(); }
    });
  },
};
const wait = ms => new Promise(r => setTimeout(r, ms));
function sayWord(e) { TTS.cancel(); return TTS.speak(e.w, 'en', meta.rate); }
// 呪文をチャンクごとに読み、そのチャンクを光らせる（カラオケ）
async function chant(e, root) {
  TTS.cancel(); const g = TTS.gen;
  const els = root ? root.querySelectorAll('.chunks .ch') : [];
  for (let i = 0; i < e.c.length; i++) {
    if (g !== TTS.gen) break;
    if (e.c[i] === ' ') { await wait(250); continue; }
    els.forEach(x => x.classList.remove('lit'));
    if (els[i]) els[i].classList.add('lit');
    await TTS.speak(e.k[i], 'ja', 1.0);
  }
  if (g === TTS.gen) await wait(200);
  els.forEach(x => x.classList.remove('lit'));
  return g === TTS.gen;
}
function letterText(w) { return w.split(' ').map(x => x.toUpperCase().split('').filter(c => /[A-Z]/.test(c)).join(', ')).join('. . '); }
function spellOut(e) { TTS.cancel(); return TTS.speak(letterText(e.w), 'en', Math.min(meta.rate, 0.85)); }

// ====== 単語カード ======
function chunksHtml(e, small) {
  const x = e.x || [];
  let ci = 0;
  return '<div class="chunks' + (small ? ' small' : '') + '">' + e.c.map((c, i) => {
    if (c === ' ') return '<span class="ch sp" data-i="' + i + '"></span>';
    const cls = 'ch c' + (ci++ % 3) + (x.indexOf(i) >= 0 ? ' trap' : '');
    return '<span class="' + cls + '" data-i="' + i + '"><b>' + esc(c) + '</b><i>' + esc(e.k[i]) + '</i></span>';
  }).join('') + '</div>';
}
function chantText(e) { return e.k.filter((k, i) => e.c[i] !== ' ').join('・'); }
// which：1＝1本目のネタ、2＝2本目（わからない単語だけにある）
function netaHtml(e, which) {
  const two = which === 2 && e.n2 && e.n2.length;
  const lines = two ? e.n2 : e.n;
  if (!lines || !lines.length) return '';
  return '<div class="neta" data-w="' + (two ? 2 : 1) + '"><div class="neta-title">🎤 覚え方ネタ' + (e.n2 ? (two ? '（2本目）' : '（1本目）') : '') + '</div>' + lines.map(l => {
    const s = SPK[l[0]] || SPK['き'];
    return '<div class="bub ' + s.cls + '"><div class="who"><span>' + s.face + '</span>' + s.name + '</div><div class="txt">' + esc(l[1]) + '</div></div>';
  }).join('') +
  (e.n2 && e.n2.length ? '<div class="btn-row" style="margin:0"><button class="pill" data-act="swapNeta" data-k="' + esc(e.key) + '">🔄 ' + (two ? '1本目のネタにもどす' : '別のネタを見る（2本目）') + '</button></div>' : '') + '</div>';
}
function vsHtml(e) { return e.vs ? '<div class="vs-note">👯 そっくりさん注意：' + esc(e.vs) + '</div>' : ''; }
function exHtml(e) {
  if (!e.ex) return '';
  let h = esc(e.ex);
  const w = esc(e.w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try { h = h.replace(new RegExp('\\b(' + w + ')', 'i'), '<mark>$1</mark>'); } catch (er) {}
  return '<div class="ex"><div class="muted">例文</div><div class="en">' + h + '</div>' +
    '<div class="btn-row" style="margin:6px 0 0"><button class="pill" data-act="sayEx" data-k="' + esc(e.key) + '">🔊 例文を聞く</button></div></div>';
}
function patHtml(e) {
  if (!e.p || !e.p.length) return '';
  return '<div class="pat-chips">' + e.p.map(id => PAT_BY_ID[id] ? '<button class="pat-chip" data-act="gotoPat" data-p="' + id + '">🎭 ' + esc(PAT_BY_ID[id].name) + '</button>' : '').join('') + '</div>';
}
function trapHtml(e) {
  if (!e.x || !e.x.length) return '';
  return '<div class="trap-note">⚠ わな：' + e.x.map(i => '<b class="en">' + esc(e.c[i]) + '</b>').join('、') + '（聞こえる音からは想像しにくい文字）</div>';
}
function cardHtml(e, opt) {
  opt = opt || {};
  const st = status(e.key);
  return '<div class="wcard" data-k="' + esc(e.key) + '">' +
    '<div class="wc-tags">' + (opt.label ? '<span class="tag box">' + opt.label + '</span>' : '') +
      '<span class="tag">' + gradeLabel(e.g) + '</span><span class="tag">' + esc(e.pos) + '</span>' +
      (e.u ? '<span class="tag unk">わからないリスト</span>' : '') +
      (st.lv ? '<span class="tag box">' + st.label + '</span>' : '') + '</div>' +
    '<div class="wc-meaning">' + esc(e.m) + (e.m2 ? '<small>ほかに：' + esc(e.m2) + '</small>' : '') + '</div>' +
    chunksHtml(e) +
    '<div class="sound-row">聞こえる音：<b>' + esc(e.r) + '</b>　／　書くための呪文：<span class="spell">' + esc(chantText(e)) + '</span></div>' +
    trapHtml(e) + vsHtml(e) +
    '<div class="btn-row"><button class="pill gold" data-act="say" data-k="' + esc(e.key) + '">🔊 本当の音</button>' +
      '<button class="pill gold" data-act="chant" data-k="' + esc(e.key) + '">🗣 呪文を唱える</button>' +
      '<button class="pill" data-act="spell" data-k="' + esc(e.key) + '">🔤 1文字ずつ</button></div>' +
    netaHtml(e, 1) + exHtml(e) + patHtml(e) +
    (opt.extra || '') + '</div>';
}

// ====== 誤答（まちがいつづり）づくり ======
const MIS = [
  [/ou/, 'au'], [/ou/, 'o'], [/u/, 'a'], [/a/, 'u'], [/ea/, 'ee'], [/ee/, 'ea'], [/ie/, 'ei'], [/ei/, 'ie'],
  [/([bcdfglmnprstz])\1/, '$1'], [/([aeiou])([bdglmnpt])([aeiouy])/, '$1$2$2$3'], [/e$/, ''], [/([^aeiou])$/, '$1e'],
  [/ph/, 'f'], [/tion/, 'shon'], [/tion/, 'sion'], [/ture/, 'cher'], [/ck/, 'k'], [/c/, 'k'], [/k/, 'c'],
  [/l/, 'r'], [/r/, 'l'], [/er/, 'ar'], [/ar/, 'er'], [/ir/, 'er'], [/ur/, 'er'], [/y$/, 'i'], [/y$/, 'ey'],
  [/igh/, 'ai'], [/gh/, ''], [/^kn/, 'n'], [/^wr/, 'r'], [/wh/, 'w'], [/th/, 's'], [/th/, 'z'], [/ow/, 'ou'],
  [/ay/, 'ei'], [/ai/, 'ei'], [/oo/, 'u'], [/i/, 'e'], [/e/, 'i'], [/o/, 'a'], [/qu/, 'kw'], [/le$/, 'ru'], [/v/, 'b'],
];
function misspell(e, n) {
  const w = e.w, low = w.toLowerCase();
  const out = []; const seen = new Set([low]);
  // わなチャンクの範囲（そこを変えた誤答を優先）
  let pos = 0; const trapRanges = [];
  e.c.forEach((c, i) => { if ((e.x || []).indexOf(i) >= 0) trapRanges.push([pos, pos + c.length]); pos += c.length; });
  (e.my || []).forEach(m => { if (out.length < n && !seen.has(m.toLowerCase())) { seen.add(m.toLowerCase()); out.push(m); } });
  const cands = [];
  const tryAdd = (s, pri) => {
    const l = s.toLowerCase();
    if (!s || seen.has(l) || WORDSET.has(l) || Math.abs(s.length - w.length) > 3) return;
    seen.add(l); cands.push([s, pri + Math.random()]);
  };
  MIS.forEach(([re, rep]) => {
    if (!re.test(w)) return;
    const s = w.replace(re, rep);
    const m = w.match(re); const at = m ? m.index : -1;
    const inTrap = trapRanges.some(r => at >= r[0] && at < r[1]);
    tryAdd(s, inTrap ? 2 : 1);
  });
  // 2段階の変形（候補が足りないとき）
  if (cands.length < n + 2) {
    cands.slice().forEach(([s]) => MIS.forEach(([re, rep]) => { if (re.test(s)) tryAdd(s.replace(re, rep), 0); }));
  }
  if (cands.length < n) { // 最後の手段：隣の文字を入れ替える
    for (let i = 0; i < w.length - 1 && cands.length < n + 3; i++) tryAdd(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2), 0);
  }
  cands.sort((a, b) => b[1] - a[1]);
  for (const c of cands) { if (out.length >= n) break; out.push(c[0]); }
  return out.slice(0, n);
}
function meaningHead(m) { return String(m).split(/[・（(、]/)[0].replace(/^〜/, ''); }
function meaningChoices(e, n) {
  const head = meaningHead(e.m);
  const pool = shuffle(V.filter(o => o.key !== e.key && o.m !== e.m && meaningHead(o.m) !== head && o.m.indexOf(head) < 0));
  const same = pool.filter(o => o.pos === e.pos);
  const res = []; const used = new Set([e.m]);
  for (const o of same.concat(pool)) { if (res.length >= n) break; if (!used.has(o.m)) { used.add(o.m); res.push(o.m); } }
  return res;
}

// ====== 画面：タブ ======
let curTab = 'home';
function setTab(t) {
  curTab = t;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  render();
  window.scrollTo(0, 0);
}
function render() {
  renderNav();
  const v = $('view');
  if (!V.length) { v.innerHTML = '<div class="card">単語データが読み込めませんでした。ページを再読み込みしてください。</div>'; return; }
  if (curTab === 'home') v.innerHTML = homeHtml();
  else if (curTab === 'howto') v.innerHTML = howtoHtml();
  else if (curTab === 'pattern') v.innerHTML = patternHtml();
  else if (curTab === 'book') { v.innerHTML = bookShellHtml(); renderBookList(); }
  else if (curTab === 'settings') v.innerHTML = settingsHtml();
}
function renderNav() { $('navStreak').textContent = curStreak(); $('navXp').textContent = getXp(); }

// ====== ホーム ======
function kyonLine() {
  const t = today(), st = curStreak(), done = meta.doneDay === t, n = learnedCount(), due = dueKeys().length;
  if (done) return ['🎤', 'きょん', '今日のネタ合わせ完了！お客さん ' + n + '人。明日も来てくれよな', 'おかわりや⚡1分だけもOK。やるほどお客さんが増える'];
  if (meta.last === t) return ['🎤', 'きょん', 'お、来たね。今日の分、あと少しで終わるよ', '途中でやめても記録は全部残ってる'];
  if (st >= 2) return ['🎤', 'きょん', '🔥' + st + '日連続中！今日もやれば記録更新！', '1分だけでも連続記録はつながる'];
  if (!Object.keys(srs).length) return ['🎤', 'きょん', '英語？なにそれ食えるの？…って言ってる場合じゃない。まずは5語だけ！', '最初は「📜 覚え方」を読むと、呪文の意味がわかるよ'];
  if (due > 20) return ['📺', 'にっくん', 'きょん、復習が' + due + '語たまってる。今日は新しいのは少なめにしておいたよ', '一気にやらなくていい。⚡1分だけを何回かでも大丈夫'];
  return pick([
    ['🎤', 'きょん', '今日のネタ合わせしよう！5分で終わるから！', 'にっくん「5分って言って20分やるのがきょんだけどね」'],
    ['🎭', 'しゅん', 'きょんさん、今日の新ネタ、もう仕込んであります！', '開いた時点でえらいです。僕が保証します'],
    ['🚗', 'くるま', 'きょんさん！単語は筋トレっす！毎日ちょっとずつっす！', '1日サボると、くるまが寂しがる'],
    ['🎸', 'イワクラ', '単語って、毎日ちょっと会うと勝手に仲良くなるよ。人間と一緒', '1分だけでもいいから、顔だけ出してあげて'],
  ]);
}
function homeHtml() {
  const t = today();
  const due = dueKeys();
  const done = meta.doneDay === t;
  const nNew = done ? 0 : (due.length > 25 ? Math.min(2, meta.newPer) : meta.newPer);
  const newAvail = nextNew(nNew).length;
  const n = learnedCount();
  const total = V.length;
  const L = kyonLine();
  const mins = Math.max(1, Math.round((Math.min(due.length, 40) * 0.25) + newAvail * 0.8));
  let h = '<div class="card"><div class="hero"><div class="face">' + L[0] + '</div><div class="say"><b>' + L[1] + '</b>「' + esc(L[2]) + '」<small>' + esc(L[3]) + '</small>' +
    (curStreak() ? '<span class="streak">🔥 ' + curStreak() + '日連続</span>' : '') + '</div></div></div>';

  h += '<div class="card">';
  if (!done) {
    h += '<button class="big-btn" data-act="startDaily">▶ 今日のネタ合わせ<small>復習 ' + Math.min(due.length, 40) + '語 ＋ 新ネタ ' + newAvail + '語（約' + mins + '分）</small></button>';
  } else {
    h += '<button class="big-btn done" data-act="startMore">✅ 今日の分は完了！<small>おかわり：新ネタ +' + meta.newPer + '語' + (due.length ? '（復習 ' + due.length + '語も）' : '') + '</small></button>';
  }
  h += '<div class="sub-btns">' +
    '<button class="sub-btn" data-act="startMini">⚡ 1分だけ<small>3問だけ。すきま時間に</small></button>' +
    '<button class="sub-btn" data-act="startRadio">🎧 聞き流し<small>音→呪文→つづり→意味を自動で</small></button>' +
    '</div></div>';

  h += boostCardHtml();
  // ライブ動員（覚えた単語＝お客さん）
  const nextMile = MILES.find(m => m > n) || total;
  h += '<div class="card live"><div class="muted">きょんの夢のライブ ' + esc(LIVE_NAME) + '</div>' +
    '<div class="seats">' + n + '<span> / ' + total + '席</span></div>' +
    '<div class="bar"><div style="width:' + (n / total * 100).toFixed(1) + '%"></div></div>' +
    '<div class="mile">覚えた単語 1語 ＝ お客さん 1人。次の目標：' + nextMile + '人（あと ' + (nextMile - n) + '人）</div></div>';

  // 学年ごとの進み具合
  h += '<div class="card"><h2>📊 学年ごとの進み具合</h2>';
  [1, 2, 3].forEach(g => {
    const ws = V.filter(e => e.g === g); const got = ws.filter(e => srs[e.key] && srs[e.key].b >= LEARNED_BOX).length;
    const seen = ws.filter(e => srs[e.key]).length;
    h += '<div class="grade-row"><div>中' + g + '</div><div class="bar"><div style="width:' + (got / ws.length * 100).toFixed(1) + '%"></div></div><div class="num">' + got + '/' + ws.length + '</div></div>';
    h += '<div class="muted" style="margin:-4px 0 6px 94px;font-size:12px">練習した ' + seen + '語</div>';
  });
  const uw = V.filter(e => e.u); const ug = uw.filter(e => srs[e.key] && srs[e.key].b >= LEARNED_BOX).length;
  h += '<div class="grade-row"><div style="color:var(--pink);font-size:12px;line-height:1.4">わからない<br>リスト</div><div class="bar"><div style="width:' + (ug / uw.length * 100).toFixed(1) + '%;background:var(--pink)"></div></div><div class="num">' + ug + '/' + uw.length + '</div></div>';
  h += '<p class="note" style="margin-top:8px">「わからない単語一覧」の単語から先に出します（⚙設定で変えられます）。「覚えた」は3回続けて思い出せた単語です。</p></div>';

  h += '<div class="card"><h2>💡 毎日のおすすめ</h2><p class="note">① 1日1回「今日のネタ合わせ」（5分くらい）<br>② すきま時間に「⚡1分だけ」<br>③ 耳がヒマなとき（歯みがき・移動中）は「🎧聞き流し」<br>忘れかけたころに同じ単語がまた出てくるしくみです。間違えても減点はありません。</p></div>';
  return h;
}

function boostCardHtml() {
  const uw = V.filter(e => e.u);
  const left = uw.filter(e => !(srs[e.key] && srs[e.key].b >= LEARNED_BOX)).length;
  const themes = {};
  uw.forEach(e => { if (e.t) (themes[e.t] = themes[e.t] || []).push(e); });
  const chips = Object.keys(themes).filter(t => themes[t].length >= 3)
    .map(t => '<button class="filter" data-act="startMedley" data-t="' + esc(t) + '">🎧 ' + esc(t) + '（' + themes[t].length + '）</button>').join('');
  return '<div class="card"><h2>🎯 わからない単語 特訓</h2>' +
    '<p class="note">自分で「わからない」と書き出した ' + uw.length + '語だけを、苦手な順に10問。まだ覚えていないのは あと <b style="color:var(--pink)">' + left + '語</b>。</p>' +
    '<button class="sub-btn wide" data-act="startBoost">🎯 特訓スタート（10問）<small>間違えた単語 → まだ覚えていない単語の順</small></button>' +
    '<div class="muted" style="margin-top:14px">🎧 テーマ別メドレー（呪文を歌詞みたいに続けて聞く）</div><div class="filters">' + chips + '</div></div>';
}

// ====== 覚え方 ======
function bubble(sp, txt) { const s = SPK[sp]; return '<div class="bub ' + s.cls + '"><div class="who"><span>' + s.face + '</span>' + s.name + '</div><div class="txt">' + txt + '</div></div>'; }
function howtoHtml() {
  const bf = BY['butterfly'];
  let h = '<div class="card"><h2>📜 なぜ英単語は覚えにくいのか</h2><div class="neta">' +
    bubble('き', 'バタフライは… <b class="en">b-a-t-t-e-r-f-l-y</b>！') +
    bubble('に', '惜しい。正しくは <b class="en">b-u-t-t-e-r-f-l-y</b>。でもね、きょんが悪いんじゃない。英語は<b>「聞こえる音」と「書いてある文字」がズレてる</b>言葉なんだ。カタカナの音のまま書こうとすると、誰でも間違える') +
    bubble('し', 'そこで作戦です、きょんさん。単語にもう一つの読み方をつけます。<b>「書くための呪文」</b>。つづりを<b>ローマ字読み</b>するんです。butterfly なら「<b style="color:var(--gold)">ブッ・テル・フルイ</b>」') +
    bubble('き', 'ぶってる、古い…？意味わかんないけど一回で覚えた') +
    bubble('に', 'その呪文をローマ字で書けば、ほぼそのまま正しいつづりになる。きょんは<b>音で覚えるのが得意</b>だから、歌詞みたいに唱えればいいんだ') +
    bubble('イ', '聞こえない文字は「黙ってる芸人」だと思って。know の k とか。呪文では、わざと声に出してあげて。<b>ク・ノウ</b>') +
    bubble('く', 'しかもっすね！つづりのクセは<b>「芸人ユニット」</b>になってるっす！gh とか tion とか、ユニットで覚えたら一気にいけるっす！') +
    '</div></div>';
  if (bf) h += '<div class="card"><h2>🧪 やってみよう</h2><p class="note">下の「🗣 呪文を唱える」を押すと、呪文に合わせて文字のかたまりが光ります。<b>光った文字を目で追いながら、一緒に声に出す</b>のがコツです。</p></div>' + cardHtml(bf, { label: 'お手本' });
  h += '<div class="card" style="margin-top:16px"><h2>🔁 1語の覚え方（3ステップ）</h2><p class="note">' +
    '① <b>🔊 本当の音</b>を聞く（意味と音をつなげる）<br>' +
    '② <b>🗣 呪文</b>を3回唱える。色のかたまりを目で追う（音と見た目をつなげる）<br>' +
    '③ <b>🧩 パーツを並べる</b>（自分で組み立てて確かめる）<br><br>' +
    '次の日、2日後、4日後、1週間後…と、<b>忘れかけたころにまた出てきます</b>。3回続けて思い出せたら「覚えた」になり、ライブのお客さんが1人増えます。<br><br>' +
    '<span style="color:var(--red)">⚠ 赤い点線のかたまり</span>は「わな」。聞こえる音からは想像しにくい文字です。呪文でいちばん大きく唱えてください。</p></div>';
  h += '<div class="card"><h2>📖 呪文の読み方ルール（ローマ字読み）</h2><p class="note">' +
    'a＝ア　i＝イ　u＝ウ　e＝エ　o＝オ／ka＝カ　ki＝キ… はローマ字と同じ<br>' +
    '子音だけ余ったら：b＝ブ　c＝ク　d＝ド　f＝フ　g＝グ　k＝ク　l／r＝ル　m＝ム　n＝ン　p＝プ　s＝ス　t＝ト　v＝ヴ　x＝クス　z＝ズ<br>' +
    'よく出るかたまり：sh＝シュ　ch＝チ　th＝ス　ph＝フ　ck＝ック　tion＝ティオン　ture＝ツレ　gh＝グハ　ou／ow＝オウ　ee＝エエ　ea＝エア　oo＝オオ<br>' +
    'くわしくは「🎭 パターン芸人」へ。</p></div>';
  h += '<button class="big-btn" data-act="startFromHowto">わかった！ネタ合わせを始める ▶</button>';
  return h;
}

// ====== パターン芸人 ======
let openPat = null;
function patternHtml() {
  let h = '<div class="card"><h2>🎭 パターン芸人（つづりのクセ）</h2><p class="note">英語のつづりには「いつも同じクセ」があります。クセごとに芸人ユニットにしました。ユニットを1つ覚えると、仲間の単語がまとめて書けるようになります。タップで開きます。</p></div>';
  PATTERNS.forEach(p => {
    const mem = V.filter(e => e.p && e.p.indexOf(p.id) >= 0);
    if (!mem.length) return;
    const got = mem.filter(e => srs[e.key] && srs[e.key].b >= LEARNED_BOX).length;
    h += '<div class="card pat' + (openPat === p.id ? ' open' : '') + '" id="pat_' + p.id + '" data-act="togglePat" data-p="' + p.id + '">' +
      '<div class="pat-head"><div class="pat-name">' + esc(p.name) + '</div><div class="pat-cnt">メンバー ' + mem.length + '語（覚えた ' + got + '）</div></div>' +
      '<div class="pat-rule">📐 ' + esc(p.rule) + '</div>' +
      '<div class="pat-body"><div class="fb-sec">💡 ' + esc(p.tip) + '</div>' +
      '<div class="member-list">' + mem.slice(0, 80).map(e => '<button class="member' + (srs[e.key] && srs[e.key].b >= LEARNED_BOX ? ' got' : '') + '" data-act="openWord" data-k="' + esc(e.key) + '">' + esc(e.w) + '</button>').join('') + (mem.length > 80 ? '<span class="muted">…ほか' + (mem.length - 80) + '語</span>' : '') + '</div>' +
      '<div class="btn-row"><button class="pill gold" data-act="startPat" data-p="' + p.id + '">🧩 このユニットで8問</button></div></div></div>';
  });
  return h;
}

// ====== ネタ帳（図鑑） ======
const book = { q: '', f: 'all', limit: 60 };
const FILTERS = [['all', 'ぜんぶ'], ['g1', '中1'], ['g2', '中2'], ['g3', '中3'], ['unk', 'わからないリスト'], ['due', '復習どき'], ['learning', '練習中'], ['got', '覚えた'], ['none', 'まだ'], ['trap', '⚠わなあり']];
function bookShellHtml() {
  return '<div class="card"><h2>📒 ネタ帳（全' + V.length + '語）</h2>' +
    '<input class="search" id="bookQ" type="search" placeholder="英語か日本語でさがす（例：friend／友達）" value="' + esc(book.q) + '" autocomplete="off">' +
    '<div class="filters">' + FILTERS.map(f => '<button class="filter' + (book.f === f[0] ? ' on' : '') + '" data-act="bookFilter" data-f="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>' +
    '<div id="bookList"></div></div>';
}
function bookMatches() {
  const q = book.q.trim().toLowerCase(); const t = today();
  return V.filter(e => {
    const s = srs[e.key];
    switch (book.f) {
      case 'g1': if (e.g !== 1) return false; break;
      case 'g2': if (e.g !== 2) return false; break;
      case 'g3': if (e.g !== 3) return false; break;
      case 'unk': if (!e.u) return false; break;
      case 'due': if (!s || s.d > t) return false; break;
      case 'learning': if (!s || s.b >= LEARNED_BOX) return false; break;
      case 'got': if (!s || s.b < LEARNED_BOX) return false; break;
      case 'none': if (s) return false; break;
      case 'trap': if (!e.x || !e.x.length) return false; break;
    }
    if (!q) return true;
    return e.key.indexOf(q) >= 0 || e.m.indexOf(q) >= 0 || (e.m2 && e.m2.indexOf(q) >= 0) || (e.r && e.r.indexOf(q) >= 0);
  });
}
function renderBookList() {
  const el = $('bookList'); if (!el) return;
  const list = bookMatches();
  let h = '<div class="muted">' + list.length + '語</div>';
  h += list.slice(0, book.limit).map(e => {
    const st = status(e.key);
    return '<div class="wrow" data-act="openWord" data-k="' + esc(e.key) + '"><div class="w">' + esc(e.w) + '</div><div class="st st-' + st.lv + '">' + st.label + '<br><span class="muted" style="font-size:11px">中' + e.g + '</span></div><div class="m">' + esc(e.m) + '</div></div>';
  }).join('');
  if (list.length > book.limit) h += '<div class="btn-row" style="justify-content:center"><button class="pill" data-act="bookMore">もっと見る（あと' + (list.length - book.limit) + '語）</button></div>';
  el.innerHTML = h;
}
function openWord(k) {
  const e = BY[k]; if (!e) return;
  const s = srs[k];
  let extra = '<div class="btn-row" style="margin-top:14px">';
  if (!s) extra += (meta.pins.indexOf(k) >= 0 ? '<span class="muted">✔ 次の新ネタに入れました</span>' : '<button class="pill gold" data-act="pin" data-k="' + esc(k) + '">✚ 次の新ネタに入れる</button>');
  else extra += '<span class="muted">練習 ' + (s.s || 0) + '回・正解 ' + (s.ok || 0) + '回</span>';
  extra += '</div>';
  $('modalBody').innerHTML = cardHtml(e, { extra: extra });
  $('modal').classList.add('open');
}
function closeModal() { $('modal').classList.remove('open'); TTS.cancel(); }

// ====== 設定 ======
function seg(name, opts, cur) {
  return '<span class="seg">' + opts.map(o => '<button class="' + (String(cur) === String(o[0]) ? 'on' : '') + '" data-act="set" data-name="' + name + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</span>';
}
function settingsHtml() {
  let h = '<div class="card"><h2>⚙ 設定</h2>';
  h += '<div class="set-row"><label>1日の新ネタの数</label>' + seg('newPer', [[3, '3語'], [5, '5語'], [8, '8語'], [10, '10語']], meta.newPer) + '</div>';
  h += '<div class="set-row"><label>新ネタを出す順番</label>' + seg('order', [['unk', 'わからない単語から'], ['grade', '中1から順に'], ['random', 'ランダム']], meta.order) + '</div>';
  h += '<div class="set-row"><label>英語の声の速さ</label>' + seg('rate', [[0.7, 'ゆっくり'], [0.85, 'ふつう'], [1, 'はやめ']], meta.rate) + '</div>';
  h += '<div class="set-row"><label>キーボードで書く問題</label>' + seg('typing', [['1', 'あり'], ['0', 'なし']], meta.typing ? 1 : 0) + '</div>';
  h += '<div class="set-row"><label>新ネタで呪文を自動で読む</label>' + seg('autoChant', [['1', 'あり'], ['0', 'なし']], meta.autoChant ? 1 : 0) + '</div>';
  h += '<div class="set-row"><label>声のテスト</label><button class="pill" data-act="voiceTest">🔊 鳴らしてみる</button></div>';
  h += '<p class="note" style="margin-top:12px">' + (TTS.ok ? '音が出ないときは、パソコンやスマホの音量・マナーモードを確認してください。' : 'このブラウザは読み上げに対応していません。文字だけで練習できます。') + '</p>';
  h += '<p class="note">記録はこの端末のブラウザに保存されます。別の端末に持っていくときは、ホームの「進捗の引っ越し」（progress_sync）を使ってください。</p></div>';
  return h;
}
function applySetting(name, v) {
  if (name === 'newPer') meta.newPer = parseInt(v, 10);
  else if (name === 'order') { meta.order = v; ORDER = null; }
  else if (name === 'rate') meta.rate = parseFloat(v);
  else if (name === 'typing') meta.typing = v === '1';
  else if (name === 'autoChant') meta.autoChant = v === '1';
  saveAll(); render();
}

// ====== 出題セッション ======
let S = null; // { mode, queue, idx, ok, ng, newWords, answered, retried:Set }
function typeFor(k) {
  const s = srs[k]; const e = BY[k]; const b = s ? s.b : 1;
  const short = e.w.replace(/[^A-Za-z]/g, '').length <= 2;
  if (short) return 'meaning';
  if (b <= 1) return pick(['build', 'meaning']);
  if (b === 2) return 'spell';
  if (b === 3) return pick(['meaning', 'spell', meta.typing ? 'type' : 'build']);
  return meta.typing ? pick(['type', 'type', 'spell']) : pick(['spell', 'build']);
}
function startSession(mode, opt) {
  opt = opt || {};
  const t = today();
  const q = [];
  let newWords = [];
  if (mode === 'daily' || mode === 'more') {
    const due = dueKeys().slice(0, 40);
    const nNew = mode === 'more' ? meta.newPer : (due.length > 25 ? Math.min(2, meta.newPer) : meta.newPer);
    newWords = nextNew(nNew);
    const rev = due.map(k => ({ k: k, t: typeFor(k) }));
    // 復習2問 → 新ネタ1語（紹介＋並べ）… の順に混ぜる
    let ri = 0;
    newWords.forEach(k => {
      for (let j = 0; j < 2 && ri < rev.length; j++) q.push(rev[ri++]);
      q.push({ k: k, t: 'intro' }); q.push({ k: k, t: 'build', fresh: true });
    });
    while (ri < rev.length) q.push(rev[ri++]);
    // 最後にもう一度：今日の新ネタをつづり選択で確認
    shuffle(newWords).forEach(k => q.push({ k: k, t: BY[k].w.replace(/[^A-Za-z]/g, '').length <= 2 ? 'meaning' : 'spell', late: true }));
  } else if (mode === 'mini') {
    let ks = dueKeys().slice(0, 3);
    if (ks.length < 3) {
      const known = shuffle(Object.keys(srs).filter(k => BY[k] && ks.indexOf(k) < 0)).sort((a, b) => srs[a].b - srs[b].b);
      ks = ks.concat(known.slice(0, 3 - ks.length));
    }
    ks.forEach(k => q.push({ k: k, t: typeFor(k) }));
    if (q.length < 3) {
      newWords = nextNew(1);
      newWords.forEach(k => { q.push({ k: k, t: 'intro' }); q.push({ k: k, t: 'build', fresh: true }); });
    }
  } else if (mode === 'boost') {
    const seenU = V.filter(e => e.u && srs[e.key] && srs[e.key].b < MASTER_BOX).map(e => e.key)
      .sort((a, b) => ((srs[a].d <= t ? 0 : 1) - (srs[b].d <= t ? 0 : 1)) || (srs[a].b - srs[b].b) || ((srs[b].ng || 0) - (srs[a].ng || 0)));
    seenU.slice(0, 7).forEach(k => q.push({ k: k, t: typeFor(k) }));
    const nNew = Math.min(5, Math.max(2, Math.ceil((10 - q.length) / 2)));
    newWords = getOrder().filter(k => BY[k].u && !srs[k]).slice(0, nNew);
    newWords.forEach(k => { q.push({ k: k, t: 'intro' }); q.push({ k: k, t: 'build', fresh: true }); });
  } else if (mode === 'pat') {
    const mem = shuffle(V.filter(e => e.p && e.p.indexOf(opt.p) >= 0 && e.w.replace(/[^A-Za-z]/g, '').length > 2)).slice(0, 8);
    mem.forEach((e, i) => q.push({ k: e.key, t: i % 2 ? 'build' : 'spell', practice: true }));
  }
  if (!q.length) { toast('今は出す問題がありません。新ネタを増やすか、明日また来てね！'); return; }
  S = { mode: mode, queue: q, idx: 0, ok: 0, ng: 0, newWords: newWords, retried: new Set(), xp: 0, pat: opt.p };
  $('stage').classList.add('open');
  document.body.style.overflow = 'hidden';
  showItem();
}
function stageProgress() {
  const n = S.queue.length;
  $('progFill').style.width = (S.idx / n * 100) + '%';
  $('stageCount').textContent = Math.min(S.idx + 1, n) + ' / ' + n;
}
function quitSession() {
  TTS.cancel(); RADIO.stop();
  $('stage').classList.remove('open'); document.body.style.overflow = '';
  S = null; saveAll(); render();
}
function showItem() {
  TTS.cancel();
  if (S.idx >= S.queue.length) { finish(); return; }
  stageProgress();
  const it = S.queue[S.idx]; const e = BY[it.k];
  const body = $('stageBody');
  if (it.t === 'intro') renderIntro(body, e);
  else if (it.t === 'meaning') renderMeaning(body, e);
  else if (it.t === 'spell') renderSpell(body, e);
  else if (it.t === 'build') renderBuild(body, e, it);
  else if (it.t === 'type') renderType(body, e);
  $('stage').scrollTop = 0;
}
function nextItem() { S.idx++; showItem(); }
function nextBar(label) { return '<div class="next-bar"><button class="next-btn" data-act="next">' + (label || '次へ ▶') + '</button></div>'; }

// --- 新ネタ紹介 ---
function renderIntro(body, e) {
  body.innerHTML = '<div class="q-label">🆕 新ネタ（まずは見て・聞いて・唱える）</div>' + cardHtml(e, { label: '新ネタ' }) +
    '<p class="note" style="margin-top:12px">🗣 呪文を<b>声に出して3回</b>唱えたら、下のボタンへ。</p>' +
    nextBar('唱えた！パーツを並べてみる 🧩');
  const root = body.querySelector('.wcard');
  (async () => { const p = sayWord(e); const g = TTS.gen; await p; if (g !== TTS.gen) return; await wait(300); if (meta.autoChant && g === TTS.gen) chant(e, root); })();
}

// --- 意味を選ぶ ---
function renderMeaning(body, e) {
  const opts = shuffle([e.m].concat(meaningChoices(e, 3)));
  body.innerHTML = '<div class="q-label">🔤 意味はどれ？</div>' +
    '<div class="q-word">' + esc(e.w) + '</div>' +
    '<div class="btn-row" style="justify-content:center"><button class="pill" data-act="say" data-k="' + esc(e.key) + '">🔊 もう一回</button></div>' +
    '<div class="choices">' + opts.map((o, i) => '<button class="choice" data-act="pickMeaning" data-i="' + i + '">' + (i + 1) + '. ' + esc(o) + '</button>').join('') + '</div><div id="fb"></div>';
  body._opts = opts;
  sayWord(e);
}
// --- 音からつづりを選ぶ ---
function renderSpell(body, e) {
  const opts = shuffle([e.w].concat(misspell(e, 3)));
  body.innerHTML = '<div class="q-label">👂 音を聞いて、正しいつづりはどれ？</div>' +
    '<div class="q-prompt">' + esc(e.m) + '</div>' +
    '<div class="btn-row"><button class="pill gold" data-act="say" data-k="' + esc(e.key) + '">🔊 音を聞く</button>' +
    '<button class="pill" data-act="hintChant">🗣 呪文ヒント</button></div><div id="hint"></div>' +
    '<div class="choices">' + opts.map((o, i) => '<button class="choice en" data-act="pickSpell" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div><div id="fb"></div>';
  body._opts = opts; body._hinted = false;
  sayWord(e);
}
// --- パーツを並べる ---
function mutateChunk(c, avoid) {
  const rules = [[/u/, 'a'], [/a/, 'u'], [/o/, 'u'], [/e/, 'i'], [/i/, 'e'], [/([a-z])\1/, '$1'], [/^k/, ''], [/^w/, ''], [/gh/, ''], [/e$/, ''], [/c/, 'k'], [/k/, 'c'], [/l/, 'r'], [/r/, 'l'], [/y$/, 'i'], [/ou/, 'au'], [/ea/, 'ee'], [/th/, 's'], [/ph/, 'f'], [/tion/, 'shon'], [/ture/, 'cher'], [/ai/, 'ei']];
  for (const [re, rep] of shuffle(rules)) {
    if (re.test(c)) { const m = c.replace(re, rep); if (m && avoid.indexOf(m) < 0) return m; }
  }
  return null;
}
function renderBuild(body, e, it) {
  let parts = e.c.filter(c => c !== ' ');
  if (parts.length < 2) parts = e.w.replace(/ /g, '').split('');
  const avoid = parts.slice(); const decoys = [];
  for (const c of shuffle(parts)) { if (decoys.length >= 2) break; const m = mutateChunk(c, avoid.concat(decoys)); if (m) decoys.push(m); }
  const tiles = shuffle(parts.concat(decoys));
  body._b = { parts: parts, tiles: tiles, picked: [], tries: 0 };
  body.innerHTML = '<div class="q-label">🧩 呪文を聞いて、パーツを順番に並べよう' + (it.fresh ? '（いま覚えた単語）' : '') + '</div>' +
    '<div class="q-prompt">' + esc(e.m) + '</div>' +
    '<div class="chant-hint">' + e.k.filter((k, i) => e.c[i] !== ' ').map(k => '<span>' + esc(k) + '</span>').join('') + '</div>' +
    '<div class="btn-row"><button class="pill gold" data-act="chantOnly">🗣 呪文を聞く</button><button class="pill" data-act="say" data-k="' + esc(e.key) + '">🔊 本当の音</button></div>' +
    '<div class="slots" id="slots"></div><div class="tiles" id="tiles"></div><div id="fb"></div>';
  drawBuild(body);
  if (it.fresh) chantSilent(e); else sayWord(e);
}
async function chantSilent(e) { TTS.cancel(); const g = TTS.gen; for (let i = 0; i < e.c.length; i++) { if (g !== TTS.gen) return; if (e.c[i] !== ' ') await TTS.speak(e.k[i], 'ja', 1.0); } }
function drawBuild(body) {
  const b = body._b;
  $('slots').innerHTML = b.parts.map((p, i) => b.picked[i] != null ? '<div class="slot filled">' + esc(b.tiles[b.picked[i]]) + '</div>' : '<div class="slot"></div>').join('');
  $('tiles').innerHTML = b.tiles.map((t, i) => '<button class="tile" data-act="pickTile" data-i="' + i + '"' + (b.picked.indexOf(i) >= 0 ? ' disabled' : '') + '>' + esc(t) + '</button>').join('');
}
// --- 書く（キーボード） ---
function renderType(body, e) {
  body.innerHTML = '<div class="q-label">✍ 音を聞いて、書いてみよう（呪文を思い出して）</div>' +
    '<div class="q-prompt">' + esc(e.m) + '</div>' +
    '<div class="btn-row"><button class="pill gold" data-act="say" data-k="' + esc(e.key) + '">🔊 音を聞く</button><button class="pill" data-act="hintChant">🗣 呪文ヒント</button></div><div id="hint"></div>' +
    '<input class="type-in" id="typeIn" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="ここに英語で">' +
    '<div class="btn-row" style="justify-content:center"><button class="pill gold" data-act="submitType">こたえる</button></div><div id="fb"></div>';
  body._tries = 0; body._hinted = false;
  sayWord(e);
  setTimeout(() => { const i = $('typeIn'); if (i) i.focus(); }, 50);
}

// --- 採点と記録 ---
function record(it, score) {
  const t = today(); const k = it.k;
  countDaily(); markActive();
  let s = srs[k];
  if (it.fresh) { // 新ネタを初めて組み立てた
    if (!s) { s = srs[k] = { b: 1, d: t + 1, s: 0, ok: 0, ng: 0, f: t }; }
  }
  if (s) { s.s = (s.s || 0) + 1; if (score >= 1) s.ok = (s.ok || 0) + 1; else if (score === 0) s.ng = (s.ng || 0) + 1; }
  const before = learnedCount();
  if (s && !it.fresh && !it.late && !it.practice) {
    if (it.retry) { s.d = t + 1; }
    else if (s.d <= t) {               // 復習どきの単語
      if (score >= 1) { s.b = Math.min(7, s.b + 1); s.d = t + INT[s.b]; }
      else if (score > 0) { s.d = t + 1; }
      else { s.b = Math.max(1, s.b - 2); s.d = t + 1; }
    } else if (score === 0) { s.d = t + 1; } // まだ先の単語を間違えた → 明日もう一度
  }
  if (s && it.late && score === 0) { s.d = t + 1; }
  // 間違えたら、このセッションの少しあとにやさしい形でもう一度（1回だけ）
  if (score < 1 && !S.retried.has(k)) {
    S.retried.add(k);
    const pos = Math.min(S.queue.length, S.idx + 3);
    S.queue.splice(pos, 0, { k: k, t: BY[k].w.replace(/[^A-Za-z]/g, '').length <= 2 ? 'meaning' : 'build', retry: true, practice: it.practice });
  }
  if (score >= 1) { S.ok++; const g = it.t === 'type' ? 2 : 1; S.xp += g; addXp(g); } else if (score === 0) S.ng++;
  const after = learnedCount();
  if (after > before) checkMile(before, after);
  saveAll();
}
function checkMile(before, after) {
  const m = MILES.find(x => before < x && after >= x);
  if (m) { setTimeout(() => toast('🎉 お客さん' + m + '人突破！ きょん「' + (m >= 500 ? 'もう武道館いけるんじゃない？' : 'ライブの客席が埋まってきた！') + '」', true), 600); }
}
function feedbackHtml(e, kind, your, isJp, headTxt) {
  const line = kind === 'ok' ? pick(PRAISE) : pick(CONSOLE);
  const s = SPK[line[0]];
  const head = headTxt || (kind === 'ok' ? '⭕ 正解！' : kind === 'close' ? '🔷 おしい！あと1文字' : '🔶 おしい！ここで覚えちゃおう');
  let h = '<div class="fb ' + kind + '"><div class="fb-head">' + head + '</div>' +
    '<div class="muted">' + s.face + ' ' + s.name + '「' + esc(line[1]) + '」</div>';
  if (kind !== 'ok' && your != null) {
    h += '<div class="cmp"><span class="muted">あなた</span><span class="' + (isJp ? 'jp-your' : 'your') + '">' + (isJp ? esc(your) : diffHtml(your, e.w)) + '</span>' +
      '<span class="muted">正しい</span><span class="' + (isJp ? 'jp-right' : 'right') + '">' + esc(isJp ? e.m : e.w) + '</span></div>';
  }
  h += '<div class="fb-sec"><b>📌 ' + esc(e.w) + '</b>＝' + esc(e.m) + '</div>' + chunksHtml(e, true) +
    '<div class="sound-row">聞こえる音：<b>' + esc(e.r) + '</b>　／　呪文：<span class="spell">' + esc(chantText(e)) + '</span></div>' + trapHtml(e) + vsHtml(e);
  if (kind !== 'ok') {
    (e.p || []).forEach(id => { const p = PAT_BY_ID[id]; if (p) h += '<div class="fb-sec"><b>📐 ルール（' + esc(p.name) + '）</b>：' + esc(p.rule) + '</div>'; });
    h += netaHtml(e, e.n2 ? 2 : 1);
  }
  h += '<div class="btn-row"><button class="pill" data-act="say" data-k="' + esc(e.key) + '">🔊 本当の音</button><button class="pill" data-act="chantFb" data-k="' + esc(e.key) + '">🗣 呪文</button></div></div>';
  return h;
}
function diffHtml(your, right) {
  // 正しいつづりと比べて、違う文字に波線をつける
  const a = String(your), b = right; let h = '';
  for (let i = 0; i < a.length; i++) h += (a[i] && b[i] && a[i].toLowerCase() === b[i].toLowerCase()) ? esc(a[i]) : '<span class="bad">' + esc(a[i]) + '</span>';
  if (a.length < b.length) h += '<span class="miss">' + '_'.repeat(b.length - a.length) + '</span>';
  return h || '（空らん）';
}
function showFeedback(kind, your, isJp, headTxt) {
  const it = S.queue[S.idx]; const e = BY[it.k];
  const fb = $('fb'); fb.innerHTML = feedbackHtml(e, kind, your, isJp, headTxt) + nextBar();
  setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  if (kind === 'ok') sayWord(e);
}
function finish() {
  TTS.cancel();
  const t = today();
  let bonus = 0;
  if ((S.mode === 'daily' || S.mode === 'more') && meta.doneDay !== t) { meta.doneDay = t; bonus = 5; }
  else if (S.mode === 'daily' || S.mode === 'more') meta.doneDay = t;
  if (bonus) { addXp(bonus); S.xp += bonus; }
  saveAll();
  $('progFill').style.width = '100%';
  const n = learnedCount();
  const rate = S.ok + S.ng ? Math.round(S.ok / (S.ok + S.ng) * 100) : 100;
  const line = rate >= 90 ? ['く', 'えぐいっす！今日のきょんさん、劇場の空気ぜんぶ持っていったっす！'] : rate >= 60 ? ['に', 'いいね。間違えた単語は、明日また出すから大丈夫'] : ['し', 'きょんさん、今日はフリの日です。明日オチがつきます。来てくれただけで満点です'];
  const s = SPK[line[0]];
  let h = '<div class="card result"><div class="big">' + (rate >= 90 ? '🏆' : rate >= 60 ? '🎉' : '🌱') + '</div>' +
    '<div class="fb-head">' + (S.mode === 'pat' ? 'ユニット練習おわり！' : S.mode === 'boost' ? '🎯 特訓おわり！' : S.mode === 'mini' ? '⚡ 1分ネタ合わせ完了！' : '今日のネタ合わせ完了！') + '</div>' +
    '<div class="score">' + S.ok + ' 正解</div><div class="muted">+' + S.xp + ' XP' + (bonus ? '（完了ボーナス +5 込み）' : '') + '</div>' +
    '<p style="margin-top:10px">' + s.face + ' ' + s.name + '「' + esc(line[1]) + '」</p>';
  if (S.newWords.length) h += '<div class="muted" style="margin-top:12px">今日の新ネタ</div><div class="learned-list">' + S.newWords.map(k => '<span>' + esc(BY[k].w) + '</span>').join('') + '</div>';
  h += '<div class="muted" style="margin-top:8px">ライブのお客さん：<b style="color:var(--gold)">' + n + '人</b>／' + V.length + '席　🔥' + curStreak() + '日連続</div></div>';
  h += '<button class="big-btn" data-act="quit">ホームにもどる</button>';
  if (S.mode === 'boost') h += '<div class="sub-btns"><button class="sub-btn" data-act="startBoost">🎯 もう10問<small>わからない単語 特訓</small></button><button class="sub-btn" data-act="startRadio">🎧 今日の単語を聞き流す<small>耳で復習</small></button></div>';
  else if (S.mode !== 'pat') h += '<div class="sub-btns"><button class="sub-btn" data-act="startMore">➕ おかわり<small>新ネタ +' + meta.newPer + '語</small></button><button class="sub-btn" data-act="startRadio">🎧 今日の単語を聞き流す<small>耳で復習</small></button></div>';
  $('stageBody').innerHTML = h;
  $('stageCount').textContent = '';
}

// ====== 聞き流し ======
const RADIO = {
  on: false, paused: false, list: [], i: 0, gen: 0, resume: null,
  start(keys, title) {
    this.title = title || '';
    let ks = Object.keys(srs).filter(k => BY[k]).sort((a, b) => (srs[a].b - srs[b].b) || ((srs[b].f || 0) - (srs[a].f || 0))).slice(0, 30);
    if (!ks.length) ks = nextNew(10);
    if (S && S.newWords && S.newWords.length) ks = S.newWords.concat(ks.filter(k => S.newWords.indexOf(k) < 0)).slice(0, 30);
    if (keys && keys.length) ks = keys;
    this.list = ks; this.i = 0; this.on = true; this.paused = false; this.gen++;
    S = { mode: 'radio', queue: [], idx: 0, ok: 0, ng: 0, newWords: [], retried: new Set(), xp: 0 };
    $('stage').classList.add('open'); document.body.style.overflow = 'hidden';
    this.loop(this.gen);
  },
  stop() { this.on = false; this.gen++; if (this.resume) { this.resume(); this.resume = null; } },
  async hold(g) { while (this.paused && g === this.gen) await new Promise(r => { this.resume = r; }); return g === this.gen; },
  async loop(g) {
    while (this.on && g === this.gen && this.i < this.list.length) {
      const e = BY[this.list[this.i]];
      $('progFill').style.width = (this.i / this.list.length * 100) + '%';
      $('stageCount').textContent = (this.i + 1) + ' / ' + this.list.length;
      $('stageBody').innerHTML = '<div class="q-label">🎧 ' + (this.title ? 'メドレー：' + esc(this.title) : '聞き流し') + '（音 → 呪文 → つづり → 意味）</div>' +
        '<div class="radio-step" id="rStep"></div><div class="radio-word">' + chunksHtml(e) + '</div>' +
        '<div class="radio-letters" id="rLetters"></div><div class="radio-meaning" id="rMean"></div>' +
        '<div class="btn-row" style="justify-content:center;margin-top:20px"><button class="pill gold" data-act="radioPause">' + (this.paused ? '▶ 再開' : '⏸ 一時停止') + '</button><button class="pill" data-act="radioNext">⏭ 次の単語</button></div>' +
        '<p class="note" style="text-align:center;margin-top:16px">画面を見なくてもOK。呪文のところは一緒に口に出すと効果大。</p>';
      const root = $('stageBody');
      const step = (s) => { const el = $('rStep'); if (el) el.textContent = s; };
      const ok = async () => (g === this.gen) && await this.hold(g);
      step('🔊 本当の音'); await TTS.speak(e.w, 'en', meta.rate); if (!await ok()) return; await wait(400);
      step('🗣 書くための呪文');
      for (let i = 0; i < e.c.length; i++) {
        if (!await ok()) return;
        if (e.c[i] === ' ') { await wait(250); continue; }
        root.querySelectorAll('.ch').forEach(x => x.classList.remove('lit'));
        const el = root.querySelector('.ch[data-i="' + i + '"]'); if (el) el.classList.add('lit');
        await TTS.speak(e.k[i], 'ja', 1.0);
      }
      root.querySelectorAll('.ch').forEach(x => x.classList.remove('lit'));
      if (!await ok()) return; await wait(300);
      step('🔤 1文字ずつ'); const L = $('rLetters'); if (L) L.textContent = e.w.toUpperCase();
      await TTS.speak(letterText(e.w), 'en', Math.min(meta.rate, 0.85)); if (!await ok()) return; await wait(300);
      step('💬 意味'); const M = $('rMean'); if (M) M.textContent = e.m;
      await TTS.speak(meaningHead(e.m) || e.m, 'ja', 1.0); if (!await ok()) return; await wait(300);
      step('🔊 もう一回'); await TTS.speak(e.w, 'en', meta.rate); if (!await ok()) return;
      await wait(1200); if (!await ok()) return;
      this.i++;
    }
    if (g === this.gen && this.on) {
      this.on = false;
      $('progFill').style.width = '100%';
      $('stageBody').innerHTML = '<div class="card result"><div class="big">🎧</div><div class="fb-head">聞き流し完了！</div><p>📺 にっくん「耳で覚えた呪文は、書くときに勝手に出てくるよ」</p></div><button class="big-btn" data-act="quit">ホームにもどる</button>';
    }
  },
};

// ====== クリック操作（すべてここで受ける） ======
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act; const k = el.dataset.k;
  const body = $('stageBody');
  switch (act) {
    case 'say': if (BY[k]) sayWord(BY[k]); break;
    case 'sayEx': if (BY[k]) { TTS.cancel(); TTS.speak(BY[k].ex, 'en', meta.rate); } break;
    case 'chant': if (BY[k]) chant(BY[k], el.closest('.wcard')); break;
    case 'chantFb': if (BY[k]) chant(BY[k], el.closest('.fb')); break;
    case 'spell': if (BY[k]) spellOut(BY[k]); break;
    case 'gotoPat': closeModal(); openPat = el.dataset.p; if (S) quitSession(); setTab('pattern'); setTimeout(() => { const p = $('pat_' + openPat); if (p) p.scrollIntoView({ block: 'start' }); }, 50); break;
    case 'togglePat': if (ev.target.closest('button')) break; openPat = openPat === el.dataset.p ? null : el.dataset.p; el.classList.toggle('open', openPat === el.dataset.p); break;
    case 'openWord': ev.stopPropagation(); openWord(k); break;
    case 'closeModal': closeModal(); break;
    case 'pin': if (meta.pins.indexOf(k) < 0) meta.pins.push(k); saveAll(); openWord(k); toast('次の新ネタに入れました'); break;
    case 'bookFilter': book.f = el.dataset.f; book.limit = 60; document.querySelectorAll('.filter').forEach(b => b.classList.toggle('on', b.dataset.f === book.f)); renderBookList(); break;
    case 'bookMore': book.limit += 120; renderBookList(); break;
    case 'set': applySetting(el.dataset.name, el.dataset.v); break;
    case 'voiceTest': (async () => { TTS.cancel(); await TTS.speak('friend', 'en', meta.rate); await TTS.speak('フリ', 'ja', 1); await TTS.speak('エンド', 'ja', 1); })(); break;
    case 'startDaily': startSession('daily'); break;
    case 'startMore': if (S) { S = null; } startSession('more'); break;
    case 'startMini': startSession('mini'); break;
    case 'startPat': startSession('pat', { p: el.dataset.p }); break;
    case 'startRadio': TTS.cancel(); RADIO.start(); break;
    case 'startBoost': startSession('boost'); break;
    case 'startMedley': TTS.cancel(); RADIO.start(V.filter(e => e.u && e.t === el.dataset.t).map(e => e.key), el.dataset.t); break;
    case 'swapNeta': { const box = el.closest('.neta'); if (box && BY[k]) box.outerHTML = netaHtml(BY[k], box.dataset.w === '2' ? 1 : 2); break; }
    case 'startFromHowto': meta.seenHowto = true; saveAll(); setTab('home'); startSession(meta.doneDay === today() ? 'more' : 'daily'); break;
    case 'quit': quitSession(); break;
    case 'next': nextItem(); break;
    case 'radioPause': RADIO.paused = !RADIO.paused; el.textContent = RADIO.paused ? '▶ 再開' : '⏸ 一時停止'; if (RADIO.paused) { try { speechSynthesis.cancel(); } catch (e) {} } else if (RADIO.resume) { RADIO.resume(); RADIO.resume = null; } break;
    case 'radioNext': RADIO.gen++; try { speechSynthesis.cancel(); } catch (e) {} RADIO.paused = false; if (RADIO.resume) { RADIO.resume(); RADIO.resume = null; } RADIO.i++; RADIO.loop(RADIO.gen); break;
    case 'hintChant': {
      const e = BY[S.queue[S.idx].k]; body._hinted = true;
      $('hint').innerHTML = '<div class="chant-hint">' + e.k.filter((x, i) => e.c[i] !== ' ').map(x => '<span>' + esc(x) + '</span>').join('') + '</div>';
      chantSilent(e); break;
    }
    case 'chantOnly': chantSilent(BY[S.queue[S.idx].k]); break;
    case 'pickMeaning': case 'pickSpell': {
      if (body.querySelector('.choice:disabled')) break;
      const it = S.queue[S.idx]; const e = BY[it.k];
      const i = +el.dataset.i; const val = body._opts[i];
      const right = act === 'pickMeaning' ? e.m : e.w;
      const okk = val === right;
      body.querySelectorAll('.choice').forEach((b, j) => { b.disabled = true; if (body._opts[j] === right) b.classList.add('ok'); });
      if (!okk) el.classList.add('ng');
      record(it, okk ? 1 : 0);
      showFeedback(okk ? 'ok' : 'ng', okk ? null : val, act === 'pickMeaning');
      break;
    }
    case 'pickTile': {
      const b = body._b; if (!b || b.done) break;
      const i = +el.dataset.i; if (b.picked.indexOf(i) >= 0) break;
      const slot = b.picked.length;
      if (b.tiles[i] !== b.parts[slot]) { // 違うパーツ → その場でやさしく知らせる
        b.tries++; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400);
        if (b.tries === 2) toast('🎭 しゅん「きょんさん、呪文の' + (slot + 1) + '番目を思い出してください！」');
        if (b.tries >= 3) { // 3回目からは正解のパーツを光らせる
          const ri = b.tiles.findIndex((t, j) => t === b.parts[slot] && b.picked.indexOf(j) < 0);
          const tb = $('tiles').children[ri]; if (tb) { tb.style.borderColor = 'var(--gold)'; }
        }
        break;
      }
      b.picked.push(i); drawBuild(body);
      if (b.picked.length === b.parts.length) {
        b.done = true;
        const it = S.queue[S.idx]; const score = b.tries === 0 ? 1 : (b.tries <= 2 ? 0.5 : 0);
        record(it, score);
        showFeedback(score >= 1 ? 'ok' : score > 0 ? 'close' : 'ng', null, false, score > 0 && score < 1 ? '🔷 正解！（ちょっと迷ったね）' : null);
      }
      break;
    }
    case 'submitType': submitType(); break;
  }
});
function submitType() {
  const body = $('stageBody'); const inp = $('typeIn'); if (!inp || inp.disabled) return;
  const it = S.queue[S.idx]; const e = BY[it.k];
  const norm = s => s.trim().replace(/\s+/g, ' ').replace(/[’`]/g, "'");
  const v = norm(inp.value); if (!v) return;
  const right = norm(e.w);
  body._tries++;
  if (v.toLowerCase() === right.toLowerCase()) {
    inp.disabled = true;
    const score = body._tries === 1 ? 1 : 0.5;
    record(it, score);
    showFeedback(score >= 1 ? 'ok' : 'close', null, false, score < 1 ? '🔷 2回目で正解！' : null);
    if (v !== right) toast('📺 にっくん「正解。' + e.w + ' は大文字で始めるよ」');
    return;
  }
  const d = lev(v.toLowerCase(), right.toLowerCase());
  if (body._tries === 1) { // 1回目のまちがい：呪文ヒントを出してもう一回
    $('hint').innerHTML = '<div class="diff">' + diffHtml(v, e.w) + '</div><div class="muted" style="text-align:center">' + (d <= 1 ? 'おしい！あと1文字。' : '') + '呪文ヒントを聞いて、もう一回！</div>' +
      '<div class="chant-hint" style="justify-content:center;display:flex">' + e.k.filter((x, i) => e.c[i] !== ' ').map(x => '<span>' + esc(x) + '</span>').join('') + '</div>';
    chantSilent(e); inp.select();
    return;
  }
  inp.disabled = true;
  record(it, d <= 1 ? 0.5 : 0);
  showFeedback(d <= 1 ? 'close' : 'ng', v, false);
}
document.addEventListener('keydown', ev => {
  if (!S || !$('stage').classList.contains('open')) { if (ev.key === 'Escape') closeModal(); return; }
  if (ev.key === 'Enter') {
    if (ev.target && ev.target.id === 'typeIn') { ev.preventDefault(); submitType(); return; }
    const nb = document.querySelector('.next-btn'); if (nb) { ev.preventDefault(); nb.click(); }
  } else if (/^[1-4]$/.test(ev.key) && !(ev.target && ev.target.tagName === 'INPUT')) {
    const c = document.querySelectorAll('#stageBody .choice')[+ev.key - 1]; if (c && !c.disabled) c.click();
  }
});
document.addEventListener('input', ev => {
  if (ev.target && ev.target.id === 'bookQ') { book.q = ev.target.value; book.limit = 60; renderBookList(); }
});
$('tabs').addEventListener('click', ev => { const b = ev.target.closest('.tab'); if (b) setTab(b.dataset.tab); });
$('modal').addEventListener('click', ev => { if (ev.target === $('modal')) closeModal(); });

// ====== 起動 ======
TTS.init();
saveAll();
setTab(meta.seenHowto || Object.keys(srs).length ? 'home' : 'howto');
})();
