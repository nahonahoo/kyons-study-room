// 中3 Unit4以降の単語練習（english_reading/nh3_words_u4.html）
// 単語データは nh3_words_u4_data.js の NHW。読み上げは Web Speech API（英語＝en-US、呪文と意味＝ja-JP）。
// 記録：nh3_nhw_stats（単語ごとの正解・不正解）、nh3_nhw_set（設定）。XP は英語共通の nh3_xp に加算（間違えても減点なし：ネタ帳と同じ方針）。
(function () {
'use strict';

var W = window.NHW || [];
var BY = {};
W.forEach(function (e, i) { e.key = e.w.toLowerCase(); e.i = i; BY[e.key] = e; });

var STATS_KEY = 'nh3_nhw_stats', SET_KEY = 'nh3_nhw_set';
function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
var stats = load(STATS_KEY, {}) || {};
var set = load(SET_KEY, {}) || {};
if (!set.rate) set.rate = 0.85;
if (set.exRead === undefined) set.exRead = true;

var SPK = {
  'き': { name: 'きょん', face: '😄', cls: 'k' },
  'に': { name: 'にっくん', face: '慶', cls: 'n' },
  'し': { name: 'しゅん', face: '🎭', cls: 's' },
  'く': { name: 'くるま', face: '🚗', cls: 'r' },
  'イ': { name: 'イワクラ', face: '🎸', cls: 'i' }
};
var PRAISE = [
  ['き', 'やった！天才かも！'], ['に', '正解。よく覚えてたね'], ['に', '呪文が効いてるね'],
  ['し', 'きょんさん、完璧です！ほんまに僕の出番なくなりますわ'], ['く', 'えぐいっす！今の正解、劇場ドッカンっす！'],
  ['イ', 'やるじゃん。ちょっと見直した']
];
var CONSOLE = [
  ['に', '惜しい。呪文をもう一回唱えてみよう。次は取れるよ'],
  ['に', '大丈夫。一回間違えた単語のほうが、あとで覚えやすいんだ'],
  ['し', 'きょんさん、ドンマイです！今のは“フリ”です。次でオチつけましょ'],
  ['イ', '間違えた単語のほうが記憶に残るらしいよ。今ので一個残った'],
  ['く', '今のは助走っす！次で跳ぶっす！']
];

// ====== 小道具 ======
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function isGap(c) { return c === ' ' || c === '~' || c === '' || /^[?.,!]+$/.test(c); }
function speakForm(w) { return w.replace(/~/g, 'something'); }
function unify(s) { return String(s || '').replace(/[‘’`]/g, "'").replace(/[～〜]/g, '~').replace(/\s+/g, ' ').trim().toLowerCase(); }
var toastTimer = null;
function toast(msg) { var t = $('toast'); t.textContent = msg; t.className = 'toast show'; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'toast'; }, 2400); }
function lev(a, b) {
  var m = a.length, n = b.length, d = [], i, j;
  for (i = 0; i <= m; i++) d[i] = [i];
  for (j = 1; j <= n; j++) d[0][j] = j;
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function bubble(l) { var s = SPK[l[0]]; return '<div class="bub ' + s.cls + '"><span class="face">' + s.face + '</span><span class="who">' + s.name + '</span><span class="txt">' + esc(l[1]) + '</span></div>'; }

// ====== XP・記録 ======
function getXp() { try { return parseInt(localStorage.getItem('nh3_xp') || '0', 10) || 0; } catch (e) { return 0; } }
function addXp(n) {
  try { localStorage.setItem('nh3_xp', String(getXp() + n)); } catch (e) {}
  try { var k = new Date().toISOString().slice(0, 10); var d = JSON.parse(localStorage.getItem('nh3_daily') || '{}'); d[k] = (d[k] || 0) + 1; localStorage.setItem('nh3_daily', JSON.stringify(d)); } catch (e) {}
  var p = document.createElement('div'); p.className = 'xp-pop'; p.textContent = '+' + n + ' XP'; document.body.appendChild(p);
  setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 1000);
  renderNav();
}
function record(e, ok) {
  var s = stats[e.key] || { ok: 0, ng: 0, last: 0 };
  if (ok) s.ok++; else s.ng++;
  s.last = ok ? 1 : -1;
  stats[e.key] = s; save(STATS_KEY, stats);
}
function isWeak(e) { var s = stats[e.key]; if (!s) return false; return s.last === -1 || (s.ng > 0 && s.ok / (s.ok + s.ng) < 0.8); }
function isDone(e) { var s = stats[e.key]; return !!s && s.ok >= 3 && s.last === 1; }
function renderNav() {
  $('navXp').textContent = getXp();
  var done = W.filter(isDone).length;
  $('navDone').textContent = done + ' / ' + W.length;
}

// ====== 音声 ======
var TTS = {
  ok: typeof window.speechSynthesis !== 'undefined' && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== 'undefined',
  en: null, ja: null, gen: 0,
  init: function () {
    if (!this.ok) return;
    var self = this;
    var bad = /bubbles|bad news|good news|bells|boing|cellos|jester|organ|pipe|trinoids|whisper|wobble|zarvox|albert|bahh|deranged|hysterical|superstar|fred|junior|ralph|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i;
    function best(vs, lang) {
      var c = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().replace('_', '-').indexOf(lang) === 0 && !bad.test(v.name); });
      function score(v) { return (/natural|online|neural/i.test(v.name) ? 4 : 0) + (/premium|enhanced/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/samantha|ava|allison|kyoko|o-ren/i.test(v.name) ? 1 : 0) + (lang === 'en' && /en-us/i.test(v.lang.replace('_', '-')) ? 1 : 0); }
      c.sort(function (a, b) { return score(b) - score(a); });
      return c[0] || null;
    }
    function pickV() { var vs = speechSynthesis.getVoices(); if (vs.length) { self.en = best(vs, 'en'); self.ja = best(vs, 'ja'); } }
    pickV();
    try { speechSynthesis.addEventListener('voiceschanged', pickV); } catch (e) { speechSynthesis.onvoiceschanged = pickV; }
  },
  cancel: function () { this.gen++; if (this.ok) try { speechSynthesis.cancel(); } catch (e) {} },
  speak: function (text, lang, rate) {
    var self = this;
    return new Promise(function (res) {
      if (!self.ok || !text) { setTimeout(res, 300); return; }
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'ja' ? 'ja-JP' : 'en-US';
      var v = lang === 'ja' ? self.ja : self.en; if (v) u.voice = v;
      u.rate = rate || 1;
      var done = false; function fin() { if (!done) { done = true; res(); } }
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 1500 + text.length * (lang === 'ja' ? 260 : 140) / (rate || 1));
      try { speechSynthesis.speak(u); } catch (e) { fin(); }
    });
  }
};
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function sayWord(e) { TTS.cancel(); return TTS.speak(speakForm(e.w), 'en', set.rate); }
function sayEx(e) { TTS.cancel(); return TTS.speak(e.ex, 'en', set.rate); }
// 呪文をかたまりごとに読み、そのかたまりを光らせる（カラオケ）
function chant(e, root, keepGen) {
  if (!keepGen) TTS.cancel();
  var g = TTS.gen;
  var els = root ? root.querySelectorAll('.chunks .ch') : [];
  var i = 0;
  function clear() { for (var j = 0; j < els.length; j++) els[j].classList.remove('lit'); }
  function step() {
    if (g !== TTS.gen || i >= e.c.length) { clear(); return Promise.resolve(g === TTS.gen); }
    var idx = i++;
    if (isGap(e.c[idx])) return wait(250).then(step);
    clear(); if (els[idx]) els[idx].classList.add('lit');
    return TTS.speak(e.k[idx], 'ja', 1.0).then(step);
  }
  return step();
}
function chantText(e) { return e.k.filter(function (k, i) { return !isGap(e.c[i]); }).join('・'); }

// ====== 表示部品 ======
function chunksHtml(e) {
  return '<div class="chunks">' + e.c.map(function (c, i) {
    if (c === ' ') return '<span class="gap"> </span>';
    var trap = e.x && e.x.indexOf(i) >= 0;
    return '<span class="ch' + (trap ? ' trap' : '') + '"><span class="cw">' + esc(c) + '</span><span class="ck">' + esc(e.k[i] || '') + '</span></span>';
  }).join('') + '</div>';
}
function cardHtml(e, opt) {
  opt = opt || {};
  var s = stats[e.key];
  var badge = isDone(e) ? '<span class="tag ok">覚えた</span>' : isWeak(e) ? '<span class="tag ng">苦手</span>' : s ? '<span class="tag">練習中</span>' : '';
  return '<div class="wcard" data-key="' + esc(e.key) + '">'
    + '<div class="wtop"><button class="say big" data-act="say" data-key="' + esc(e.key) + '" title="読み上げ">🔊</button>'
    + '<div class="wword">' + esc(e.w) + '</div>' + badge + (e.wk ? '<span class="tag wk">📒ワーク</span>' : '') + '</div>'
    + '<div class="wmean"><span class="pos">' + esc(e.pos) + '</span>' + esc(e.m) + (e.r ? '<span class="pron">（' + esc(e.r) + '）</span>' : '') + '</div>'
    + chunksHtml(e)
    + (e.my ? '<div class="myspell">⚠️ まちがえやすい：<s>' + esc(e.my) + '</s> → <b>' + esc(e.w) + '</b></div>' : '')
    + '<div class="wbtns"><button class="mini" data-act="chant" data-key="' + esc(e.key) + '">🪄 書くための呪文を聞く</button></div>'
    + '<div class="wex"><button class="say" data-act="ex" data-key="' + esc(e.key) + '" title="例文">🔊</button><div><div class="exen">' + esc(e.ex) + '</div><div class="exjp">' + esc(e.exj) + '</div></div></div>'
    + (opt.neta && e.n ? '<div class="neta">' + e.n.map(bubble).join('') + '</div>' : '')
    + (opt.page ? '<div class="wpage">教科書 Unit' + e.u + '・' + esc(e.s) + (e.nb ? '・ネタ帳にもあり' : '') + (s ? '・正解 ' + s.ok + ' / ' + (s.ok + s.ng) : '') + '</div>' : '')
    + '</div>';
}

// ====== 絞り込み ======
var view = { unit: 0, weak: false, wk: false, tab: 'list' };
function pool() {
  return W.filter(function (e) { return (!view.unit || e.u === view.unit) && (!view.weak || isWeak(e)) && (!view.wk || e.wk); });
}
function renderFilters() {
  var units = [[0, '全部'], [4, 'Unit4'], [5, 'Unit5'], [6, 'Unit6']];
  $('filters').innerHTML = units.map(function (u) {
    var n = W.filter(function (e) { return !u[0] || e.u === u[0]; }).length;
    return '<button class="chip' + (view.unit === u[0] ? ' on' : '') + '" data-unit="' + u[0] + '">' + u[1] + '<small>' + n + '語</small></button>';
  }).join('') + '<button class="chip weak' + (view.weak ? ' on' : '') + '" data-act="weak">🔴 苦手だけ<small>' + W.filter(isWeak).length + '語</small></button>'
    + '<button class="chip' + (view.wk ? ' on' : '') + '" data-act="wk">📒 ワークの語だけ<small>' + W.filter(function (e) { return e.wk; }).length + '語</small></button>';
  var tabs = [['list', '📖 一覧'], ['listen', '🎧 聞き流し'], ['quiz', '🎯 練習']];
  $('tabs').innerHTML = tabs.map(function (t) { return '<button class="tab' + (view.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('');
}
function render() {
  TTS.cancel(); listenStop();
  renderFilters(); renderNav();
  if (view.tab === 'list') renderList();
  else if (view.tab === 'listen') renderListen();
  else renderQuizStart();
  window.scrollTo(0, 0);
}

// ====== 📖 一覧 ======
function renderList() {
  var p = pool(), html = '';
  if (!p.length) { $('main').innerHTML = '<div class="empty">' + (view.weak ? '苦手な単語はまだありません。🎯練習で出てきたらここに集まります。' : '単語がありません。') + '</div>'; return; }
  html += '<div class="hint">🔊 で英語の音、🪄 で「書くための呪文」（つづりをローマ字読みした音）。赤い点線のかたまりは「わな」＝発音からは想像できない文字。</div>';
  var lastSec = '';
  p.forEach(function (e) {
    var sec = 'Unit' + e.u + '　' + e.s;
    if (sec !== lastSec) { html += '<h3 class="sec">' + esc(sec) + '</h3>'; lastSec = sec; }
    html += cardHtml(e, { neta: true, page: true });
  });
  $('main').innerHTML = html;
}

// ====== 🎧 聞き流し ======
var L = { on: false, idx: 0, gen: -1 };
function listenStop() { L.on = false; }
function renderListen() {
  var p = pool();
  $('main').innerHTML = '<div class="hint">英語 → 英語 → 呪文 → 意味' + (set.exRead ? ' → 例文' : '') + ' の順に、自動で読み上げます。画面を見ながら耳で覚えよう。</div>'
    + '<div class="lctl"><button class="big-btn" data-act="lplay">▶ 聞き流しスタート</button><button class="big-btn sub" data-act="lstop">⏸ 止める</button></div>'
    + '<div class="lset">速さ：<button class="chip' + (set.rate < 0.8 ? ' on' : '') + '" data-rate="0.7">🐢 ゆっくり</button><button class="chip' + (set.rate >= 0.8 ? ' on' : '') + '" data-rate="0.85">ふつう</button>'
    + '　<button class="chip' + (set.exRead ? ' on' : '') + '" data-act="exread">例文も読む</button></div>'
    + '<div class="lprog" id="lprog">' + (p.length ? '1 / ' + p.length : '単語がありません') + '</div>'
    + '<div id="lcard">' + (p[0] ? cardHtml(p[0], {}) : '') + '</div>';
  L.idx = 0;
}
function listenPlay() {
  var p = pool(); if (!p.length) return;
  TTS.cancel(); L.on = true; var g = TTS.gen;
  function one() {
    if (!L.on || g !== TTS.gen) return;
    if (L.idx >= p.length) { L.on = false; toast('🎧 ぜんぶ聞き終わった！ きょん「耳が英語になってきた気がする」'); return; }
    var e = p[L.idx];
    $('lprog').textContent = (L.idx + 1) + ' / ' + p.length;
    $('lcard').innerHTML = cardHtml(e, {});
    var root = $('lcard');
    TTS.speak(speakForm(e.w), 'en', set.rate)
      .then(function () { return wait(500); })
      .then(function () { if (g === TTS.gen) return TTS.speak(speakForm(e.w), 'en', set.rate); })
      .then(function () { if (g === TTS.gen) return wait(400); })
      .then(function () { if (g === TTS.gen) return chant(e, root, true); })
      .then(function () { if (g === TTS.gen) return TTS.speak(e.m.replace(/（.*?）/g, ''), 'ja', 1.0); })
      .then(function () { if (g === TTS.gen && set.exRead) return wait(300).then(function () { return TTS.speak(e.ex, 'en', set.rate); }); })
      .then(function () { if (g === TTS.gen) return wait(900); })
      .then(function () { if (g === TTS.gen && L.on) { L.idx++; one(); } });
  }
  one();
}

// ====== 🎯 練習 ======
var Q = null;
function renderQuizStart() {
  var p = pool();
  var weakN = p.filter(isWeak).length, newN = p.filter(function (e) { return !stats[e.key]; }).length;
  $('main').innerHTML = '<div class="hint">10問ずつ。まだやっていない単語・苦手な単語から先に出ます。<br>正解の回数が増えると「意味をえらぶ」→「聞いてつづりをえらぶ」→「書いてみる」と、だんだんレベルアップ。間違えても減点なし！</div>'
    + '<div class="qstat">この範囲：' + p.length + '語（まだ ' + newN + '語・苦手 ' + weakN + '語・覚えた ' + p.filter(isDone).length + '語）</div>'
    + '<div class="lctl"><button class="big-btn" data-act="qstart"' + (p.length ? '' : ' disabled') + '>🎯 10問スタート</button></div>'
    + '<div class="lctl"><button class="big-btn sub" data-act="qstart-write"' + (p.length ? '' : ' disabled') + '>✍️ 書く練習だけ10問</button></div>';
}
function levelOf(e) { var s = stats[e.key]; return s ? s.ok : 0; }
function startQuiz(onlyWrite) {
  var p = pool(); if (!p.length) return;
  var order = shuffle(p).sort(function (a, b) {
    function pri(e) { return isWeak(e) ? 0 : (e.my && !isDone(e)) ? 1 : !stats[e.key] ? 2 : isDone(e) ? 4 : 3; }
    return pri(a) - pri(b);
  }).slice(0, 10);
  Q = { items: order.map(function (e) {
    var lv = levelOf(e), t = onlyWrite ? 'type' : lv <= 0 ? 'mean' : lv === 1 ? 'spell' : 'type';
    if (t === 'spell' && e.w.length > 18) t = 'mean';
    return { e: e, t: t };
  }), idx: 0, ok: 0, wrong: [] };
  showQ();
}
function progressHtml() { return '<div class="qprog">🎯 ' + (Q.idx + 1) + ' / ' + Q.items.length + '　正解 ' + Q.ok + '</div>'; }
function showQ() {
  TTS.cancel();
  if (Q.idx >= Q.items.length) return finishQuiz();
  var it = Q.items[Q.idx], e = it.e, html = progressHtml();
  if (it.t === 'mean') {
    var others = shuffle(W.filter(function (x) { return x.key !== e.key && meanHead(x) !== meanHead(e); })).slice(0, 3);
    it.choices = shuffle([e].concat(others)).map(function (x) { return meanHead(x); });
    it.answer = meanHead(e);
    html += '<div class="qtype">意味をえらぼう</div><div class="qword"><button class="say big" data-act="say" data-key="' + esc(e.key) + '">🔊</button>' + esc(e.w) + '</div>';
    html += '<div class="qchoices">' + it.choices.map(function (c, i) { return '<button class="qc" data-ci="' + i + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    $('main').innerHTML = html; sayWord(e);
  } else if (it.t === 'spell') {
    var cands = misspellings(e, 3);
    it.choices = shuffle([e.w].concat(cands));
    it.answer = e.w;
    html += '<div class="qtype">音を聞いて、正しいつづりをえらぼう</div><div class="qword"><button class="say big" data-act="say" data-key="' + esc(e.key) + '">🔊 もう一回</button></div><div class="qmean">意味：' + esc(e.m) + '</div>';
    html += '<div class="qchoices">' + it.choices.map(function (c, i) { return '<button class="qc en" data-ci="' + i + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    $('main').innerHTML = html; sayWord(e);
  } else {
    it.hint = 0;
    html += '<div class="qtype">聞いて、書いてみよう</div><div class="qword"><button class="say big" data-act="say" data-key="' + esc(e.key) + '">🔊 もう一回</button></div><div class="qmean">意味：' + esc(e.m) + '</div>';
    html += '<input id="qin" class="qin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="英語でタイプ">'
      + '<div class="lctl"><button class="big-btn" data-act="qcheck">答え合わせ</button></div>'
      + '<div class="lctl"><button class="mini" data-act="qhint">🪄 ヒント（呪文を聞く）</button></div><div id="qhintbox"></div>';
    $('main').innerHTML = html; sayWord(e);
    var inp = $('qin'); inp.focus();
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') checkType(); });
  }
}
// 選択肢用の短い意味：カッコの中（補足）を消す。「（社会のための）運動」→「運動・キャンペーン」
function meanHead(e) { var s = String(e.m).replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim(); return s || e.m; }
// まちがいやすいつづり（カタカナ読みで書いたとき・文字の重ね忘れなど）を作る
function misspellings(e, n) {
  var w = e.w, out = [];
  function add(s) { if (s && s !== w && out.indexOf(s) < 0 && /[a-z]/i.test(s)) out.push(s); }
  if (e.my) add(e.my); // ワークで出てきた書きまちがい
  var rules = [
    function () { return w.replace(/([a-z])\1/i, '$1'); },                      // 重ね文字を1つに
    function () { return w.replace(/([bcdfglmnprst])(?!\1)([aeiou])/i, '$1$1$2'); }, // 文字を重ねすぎ
    function () { return w.replace(/er\b/, 'ar'); },
    function () { return w.replace(/tion/, 'shon'); },
    function () { return w.replace(/gh/, ''); },
    function () { return w.replace(/ea/, 'ee'); },
    function () { return w.replace(/ou/, 'au'); },
    function () { return w.replace(/c([eiy])/, 's$1'); },
    function () { return w.replace(/e\b/, ''); },
    function () { return w.replace(/y\b/, 'ie'); },
    function () { return w.replace(/v/, 'b'); },
    function () { return w.replace(/l/, 'r'); },
    function () { return w.replace(/th/, 's'); },
    function () { return w.replace(/a/, 'u'); },
    function () { return w.replace(/o/, 'a'); },
    function () { return w.replace(/i/, 'e'); },
    function () { return w.replace(/u/, 'a'); }
  ];
  shuffle(rules).forEach(function (r) { if (out.length < n) add(r()); });
  // 短い語などで足りないとき：1文字抜け・となりの文字の入れかえ・最後に e を足す
  var letters = [];
  for (var i = 1; i < w.length; i++) if (/[a-z]/i.test(w.charAt(i))) letters.push(i);
  shuffle(letters).forEach(function (i) {
    if (out.length >= n) return;
    add(w.slice(0, i) + w.slice(i + 1));
    if (out.length < n && /[a-z]/i.test(w.charAt(i - 1))) add(w.slice(0, i - 1) + w.charAt(i) + w.charAt(i - 1) + w.slice(i + 1));
  });
  if (out.length < n) add(w + 'e');
  return out.slice(0, n);
}
function judgeChoice(i) {
  var it = Q.items[Q.idx]; if (it.done) return;
  it.done = true;
  var ok = it.choices[i] === it.answer;
  var btns = document.querySelectorAll('.qc');
  for (var j = 0; j < btns.length; j++) {
    btns[j].disabled = true;
    if (it.choices[j] === it.answer) btns[j].classList.add('right');
    else if (j === i) btns[j].classList.add('wrong');
  }
  after(it, ok, it.t === 'spell' ? 1 : 1);
}
function checkType() {
  var it = Q.items[Q.idx]; if (it.done) return;
  // 熟語の「~」「...」（何かが入る場所）は打たなくてもよい
  function core(x) { return unify(x).replace(/\.\.\.|…|~/g, ' ').replace(/\s+/g, ' ').trim(); }
  var v = core($('qin').value), a = core(it.e.w);
  if (!v) { toast('英語を入力してね'); return; }
  it.done = true; $('qin').disabled = true;
  var ok = v === a || v === a.replace(/[.!?]$/, '');
  var close = !ok && lev(v, a) === 1;
  it.your = $('qin').value;
  after(it, ok, it.hint ? 1 : 2, close);
}
function after(it, ok, xp, close) {
  var e = it.e;
  record(e, ok);
  if (ok) { Q.ok++; addXp(xp); } else Q.wrong.push(e);
  var line = ok ? pick(PRAISE) : close ? ['に', '1文字ちがいの惜しい！呪文をもう一回唱えて、ちがう1文字を見つけよう'] : pick(CONSOLE);
  var fb = '<div class="fb ' + (ok ? 'ok' : 'ng') + '">' + (ok ? '✅ 正解！' : close ? '🟡 惜しい！' : '❌ ざんねん') + '</div>'
    + (it.your && !ok ? '<div class="yours">あなた：<span>' + esc(it.your) + '</span></div>' : '')
    + bubble(line) + '<div id="fbcard">' + cardHtml(e, { neta: true }) + '</div>'
    + '<div class="lctl"><button class="big-btn" data-act="qnext">' + (Q.idx + 1 >= Q.items.length ? '結果を見る ▶' : '次へ ▶') + '</button></div>';
  var box = document.createElement('div'); box.className = 'fbwrap'; box.innerHTML = fb;
  $('main').appendChild(box);
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  renderNav();
  if (!ok) { sayWord(e).then(function () { return wait(300); }).then(function () { chant(e, $('fbcard'), true); }); }
}
function finishQuiz() {
  var pct = Math.round(Q.ok / Q.items.length * 100);
  var msg = pct >= 80 ? ['く', 'えぐいっす！ほぼ全問っす！きょんさん、もう単語王っす！'] : pct >= 50 ? ['に', '半分以上できてる。間違えた単語は「苦手だけ」でもう一回やろう'] : ['し', 'きょんさん、大丈夫です！今日のは仕込みです。明日ウケますんで'];
  var html = '<div class="result"><div class="rbig">' + Q.ok + ' / ' + Q.items.length + '</div>' + bubble(msg) + '</div>';
  if (Q.wrong.length) html += '<h3 class="sec">もう一回見ておこう</h3>' + Q.wrong.map(function (e) { return cardHtml(e, {}); }).join('');
  html += '<div class="lctl"><button class="big-btn" data-act="qstart">🎯 もう10問</button></div><div class="lctl"><button class="big-btn sub" data-tab="list">📖 一覧へ</button></div>';
  $('main').innerHTML = html; renderFilters(); renderNav(); window.scrollTo(0, 0);
}

// ====== イベント（data-* 属性＋委任） ======
document.addEventListener('click', function (ev) {
  var t = ev.target.closest ? ev.target.closest('[data-act],[data-unit],[data-tab],[data-rate],[data-ci]') : null;
  if (!t) return;
  if (t.hasAttribute('data-unit')) { view.unit = parseInt(t.getAttribute('data-unit'), 10); render(); return; }
  if (t.hasAttribute('data-tab')) { view.tab = t.getAttribute('data-tab'); render(); return; }
  if (t.hasAttribute('data-rate')) { set.rate = parseFloat(t.getAttribute('data-rate')); save(SET_KEY, set); renderListen(); return; }
  if (t.hasAttribute('data-ci')) { judgeChoice(parseInt(t.getAttribute('data-ci'), 10)); return; }
  var a = t.getAttribute('data-act'), e = BY[t.getAttribute('data-key')];
  if (a === 'weak') { view.weak = !view.weak; render(); }
  else if (a === 'wk') { view.wk = !view.wk; render(); }
  else if (a === 'say' && e) sayWord(e);
  else if (a === 'ex' && e) sayEx(e);
  else if (a === 'chant' && e) chant(e, t.closest('.wcard'));
  else if (a === 'lplay') listenPlay();
  else if (a === 'lstop') { L.on = false; TTS.cancel(); }
  else if (a === 'exread') { set.exRead = !set.exRead; save(SET_KEY, set); renderListen(); }
  else if (a === 'qstart') { view.tab = 'quiz'; renderFilters(); startQuiz(false); window.scrollTo(0, 0); }
  else if (a === 'qstart-write') startQuiz(true);
  else if (a === 'qcheck') checkType();
  else if (a === 'qhint') {
    var it = Q.items[Q.idx]; it.hint = 1;
    $('qhintbox').innerHTML = '<div class="hintcard">呪文：' + esc(chantText(it.e)) + chunksHtml({ c: it.e.c.map(function (c) { return isGap(c) ? c : c.replace(/[a-z]/gi, '＿'); }), k: it.e.k, x: [] }) + '</div>';
    chant(it.e, $('qhintbox'));
  }
  else if (a === 'qnext') { Q.idx++; showQ(); window.scrollTo(0, 0); }
});

TTS.init();
if (!TTS.ok) { var w = $('ttsWarn'); if (w) w.style.display = 'block'; }
render();
// 自動テスト用の入口
window.__nhw = { startQuiz: startQuiz, misspellings: misspellings, view: view, render: render, getQ: function () { return Q; } };
})();
