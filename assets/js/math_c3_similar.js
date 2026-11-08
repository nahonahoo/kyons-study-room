// 数学 中3「図形と相似」単独ページ（2026-11-08 新規）
// qid: math_soji_s{セクションid}_q{番号}。問題は末尾に足す（途中に入れると記録がずれる）
// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「相似？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺図形見えてきたかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「相似で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' }
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var PREFIX = 'math_soji_';
var xp           = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('math_soji_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_soji_sections') || '{}');
var weakDB       = JSON.parse(localStorage.getItem('math_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;

function updateXP() {
  var lv = getLevel(xp);
  var pct = lv.lv < LEVELS.length ? Math.round((xp - lv.min) / (lv.max - lv.min) * 100) : 100;
  document.getElementById('xpBadge').textContent  = lv.badge;
  document.getElementById('xpLevel').textContent  = 'Lv.' + lv.lv + ' ' + lv.badge.split(' ')[0];
  document.getElementById('xpTitle').textContent  = lv.title;
  document.getElementById('xpStatus').textContent = lv.status;
  document.getElementById('xpNext').textContent   = lv.lv < LEVELS.length ? xp + ' XP ／ 次まで ' + (lv.max - xp) + ' XP' : '🏆 最高ランク達成！（' + xp + ' XP）';
  document.getElementById('xpFill').style.width   = Math.min(100, pct) + '%';
  var keys = ['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'];
  var total = Math.max(0, keys.reduce(function(s,k){ return s + parseInt(localStorage.getItem(k) || '0', 10); }, 0) - parseInt(localStorage.getItem('shop_spent') || '0', 10));
  var coin = document.getElementById('coinTotal');
  if (coin) { coin.textContent = '🪙 ' + total.toLocaleString() + ' XP'; coin.classList.add('bump'); setTimeout(function(){ coin.classList.remove('bump'); }, 350); }
}
function saveAnswered() { localStorage.setItem('math_soji_answered', JSON.stringify(answeredSet)); }
function addXP(pts, qid) {
  if (answeredSet[qid]) return false;
  var oldLv = getLevel(xp).lv;
  xp += pts;
  answeredSet[qid] = true;
  localStorage.setItem('math_xp', xp);
  saveAnswered();
  updateXP();
  return getLevel(xp).lv > oldLv;
}
function deductXP(pts) {
  var oldLv = getLevel(xp).lv;
  xp = Math.max(0, xp - pts);
  localStorage.setItem('math_xp', xp);
  updateXP();
  return getLevel(xp).lv < oldLv;
}

// ===== 分数を上下の形で表示（文字列の 1/2 を画面に出すときだけ変換。data-choice はそのまま） =====
function prettyFrac(root) {
  if (!root) return;
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n;
  while ((n = w.nextNode())) {
    if (/\d\/[\da-z]/.test(n.nodeValue) && !n.parentNode.closest('svg')) list.push(n);
  }
  list.forEach(function(t) {
    var span = document.createElement('span');
    span.innerHTML = t.nodeValue.replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/(\d+)\/(\d+|[a-z])/g, '<span class="ln-frac"><span>$1</span><span>$2</span></span>');
    t.parentNode.replaceChild(span, t);
  });
}

// ===== 解説カードのフォーマット =====
function E(rule, ok, ng, tip) {
  return '<span class="exp-rule"><span class="label">📐 ルール</span>' + rule + '</span>'
    + '<span class="exp-ok">✅ ' + ok + '</span>'
    + (ng ? '<span class="exp-ng">❌ ' + ng + '</span>' : '')
    + '<span class="exp-tip">💡 ' + tip + '</span>';
}

// ===== 図 =====
var WH = '#e6edf3', BL = '#4aa8ff', YE = '#ffd84d', GR = '#3ddc84', OR = '#ff7a45';
function txt(x, y, t, color, anchor, size) {
  return '<text x="' + x + '" y="' + y + '" fill="' + (color || WH) + '" font-size="' + (size || 15) + '" font-weight="bold" text-anchor="' + (anchor || 'middle') + '" paint-order="stroke" stroke="#0f1520" stroke-width="3">' + t + '</text>';
}
function seg(p, q, color, w, dash) {
  return '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '" stroke="' + (color || WH) + '" stroke-width="' + (w || 2.2) + '"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>';
}
function mid(p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; }
function along(p, q, t) { return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; }
function svgBox(w, h, body, maxw) {
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;max-width:' + (maxw || 330) + 'px;display:block;margin:8px auto;background:#0f1520;border-radius:10px">' + body + '</svg>';
}
// 数字は白、x は金色
function val(p, t, anchor) { return t ? txt(p[0], p[1], t, t === 'x' ? YE : WH, anchor) : ''; }
// 平行の印（＞）
function chev(p, color) {
  return '<path d="M' + (p[0] - 4) + ' ' + (p[1] - 5) + ' L' + (p[0] + 2) + ' ' + p[1] + ' L' + (p[0] - 4) + ' ' + (p[1] + 5) + '" fill="none" stroke="' + (color || BL) + '" stroke-width="2.2"/>';
}
// 角のしるし
function arc(o, p, q, r, color) {
  var a1 = Math.atan2(p[1] - o[1], p[0] - o[0]), a2 = Math.atan2(q[1] - o[1], q[0] - o[0]);
  var d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  var x1 = o[0] + r * Math.cos(a1), y1 = o[1] + r * Math.sin(a1), x2 = o[0] + r * Math.cos(a1 + d), y2 = o[1] + r * Math.sin(a1 + d);
  return '<path d="M' + x1 + ' ' + y1 + ' A' + r + ' ' + r + ' 0 0 ' + (d > 0 ? 1 : 0) + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="' + (color || YE) + '" stroke-width="2.4"/>';
}
// ピラミッド型：t ＝ AD ÷ AB
function pyramid(t, L, opt) {
  L = L || {}; opt = opt || {};
  var A = [140, 24], B = [36, 190], C = [244, 190], D = along(A, B, t), E = along(A, C, t);
  var s = seg(A, B) + seg(A, C) + seg(B, C) + seg(D, E, opt.hideDE ? WH : BL, 2.6);
  if (!opt.noPar) s += chev(along(D, E, 0.72)) + chev(along(B, C, 0.72));
  s += txt(A[0], A[1] - 8, 'A') + txt(B[0] - 12, B[1] + 8, 'B') + txt(C[0] + 12, C[1] + 8, 'C') + txt(D[0] - 12, D[1] + 2, 'D') + txt(E[0] + 12, E[1] + 2, 'E');
  var m;
  m = mid(A, D); s += val([m[0] - 13, m[1] + 2], L.ad, 'end');
  m = mid(D, B); s += val([m[0] - 13, m[1] + 2], L.db, 'end');
  m = mid(A, E); s += val([m[0] + 13, m[1] + 2], L.ae, 'start');
  m = mid(E, C); s += val([m[0] + 13, m[1] + 2], L.ec, 'start');
  m = mid(D, E); s += val([m[0] - 18, m[1] - 7], L.de);
  m = mid(B, C); s += val([m[0], m[1] + 20], L.bc);
  return svgBox(280, 222, s);
}
// ちょうちょ型：r ＝ OA ÷ OD（A・B が上の短い辺）
function butterfly(r, L) {
  L = L || {};
  var O = [140, 92], D = [O[0] + 104, O[1] + 74], C = [O[0] - 104, O[1] + 74], A = [O[0] - 104 * r, O[1] - 74 * r], B = [O[0] + 104 * r, O[1] - 74 * r];
  var s = seg(A, D) + seg(B, C) + seg(A, B, BL, 2.6) + seg(C, D, BL, 2.6) + chev(along(A, B, 0.72)) + chev(along(C, D, 0.72));
  s += txt(A[0] - 11, A[1] - 2, 'A') + txt(B[0] + 11, B[1] - 2, 'B') + txt(C[0] - 11, C[1] + 8, 'C') + txt(D[0] + 11, D[1] + 8, 'D') + txt(O[0], O[1] - 12, 'O', YE);
  var m;
  m = mid(A, O); s += val([m[0] + 3, m[1] + 18], L.oa);
  m = mid(B, O); s += val([m[0] - 3, m[1] + 18], L.ob);
  m = mid(C, O); s += val([m[0] + 3, m[1] - 8], L.oc);
  m = mid(D, O); s += val([m[0] - 3, m[1] - 8], L.od);
  m = mid(A, B); s += val([m[0] - 16, m[1] - 8], L.ab);
  m = mid(C, D); s += val([m[0], m[1] + 20], L.cd);
  return svgBox(280, 198, s);
}
// 3本の平行線
function lines3(t, L) {
  L = L || {};
  var y1 = 26, y3 = 176, y2 = y1 + (y3 - y1) * t;
  var A = [84, y1], C = [40, y3], B = along(A, C, t), D = [176, y1], F = [250, y3], E = along(D, F, t);
  var s = '';
  [y1, y2, y3].forEach(function(y) { s += seg([12, y], [268, y], BL, 2.2) + chev([130, y]); });
  s += seg(A, C) + seg(D, F);
  s += txt(A[0] - 8, A[1] - 8, 'A') + txt(D[0] + 8, D[1] - 8, 'D') + txt(B[0] - 12, B[1] - 7, 'B') + txt(E[0] + 12, E[1] - 7, 'E') + txt(C[0] - 8, C[1] + 20, 'C') + txt(F[0] + 8, F[1] + 20, 'F');
  var m;
  m = mid(A, B); s += val([m[0] + 12, m[1] + 5], L.ab, 'start');
  m = mid(B, C); s += val([m[0] + 12, m[1] + 5], L.bc, 'start');
  m = mid(D, E); s += val([m[0] - 12, m[1] + 5], L.de, 'end');
  m = mid(E, F); s += val([m[0] - 12, m[1] + 5], L.ef, 'end');
  return svgBox(280, 208, s);
}
// 相似な2つの三角形（左が小さい・右が大きい）
function pair(L, sc2) {
  L = L || {};
  var k = sc2 || 1.5;
  function tri(ox, oy, s, n, l) {
    var A = [ox + 34 * s, oy - 80 * s], B = [ox, oy], C = [ox + 88 * s, oy];
    var r = seg(A, B) + seg(B, C) + seg(C, A);
    r += txt(A[0], A[1] - 7, n[0]) + txt(B[0] - 10, B[1] + 8, n[1]) + txt(C[0] + 10, C[1] + 8, n[2]);
    var m;
    m = mid(A, B); r += val([m[0] - 10, m[1] + 2], l[0], 'end');
    m = mid(B, C); r += val([m[0], m[1] + 19], l[1]);
    m = mid(A, C); r += val([m[0] + 10, m[1] + 2], l[2], 'start');
    return r;
  }
  return svgBox(320, 188, tri(28, 150, 1, 'ABC', [L.ab, L.bc, L.ca]) + tri(164, 150, k, 'DEF', [L.de, L.ef, L.fd]), 360);
}
// 中点連結
function midTri(L) {
  L = L || {};
  var A = [130, 24], B = [28, 176], C = [236, 176], M = mid(A, B), N = mid(A, C);
  var s = seg(A, B) + seg(A, C) + seg(B, C) + seg(M, N, BL, 2.6) + chev(along(M, N, 0.72)) + chev(along(B, C, 0.72));
  s += txt(A[0], A[1] - 8, 'A') + txt(B[0] - 12, B[1] + 8, 'B') + txt(C[0] + 12, C[1] + 8, 'C') + txt(M[0] - 13, M[1] + 2, 'M', YE) + txt(N[0] + 13, N[1] + 2, 'N', YE);
  s += seg(along(A, B, 0.22), along(A, B, 0.28), GR, 3) + seg(along(A, B, 0.72), along(A, B, 0.78), GR, 3);
  s += seg(along(A, C, 0.22), along(A, C, 0.28), OR, 3) + seg(along(A, C, 0.72), along(A, C, 0.78), OR, 3);
  var m = mid(M, N); s += val([m[0], m[1] - 8], L.mn);
  m = mid(B, C); s += val([m[0], m[1] + 20], L.bc);
  return svgBox(264, 208, s);
}
// 証明の図：∠ADE ＝ ∠ACB
function proofFig() {
  var A = [100, 22], B = [20, 186], C = [250, 186], D = [51.4, 122], E = [162, 89];
  var s = seg(A, B) + seg(A, C) + seg(B, C) + seg(D, E, BL, 2.6);
  s += arc(D, A, E, 15, GR) + arc(C, A, B, 22, GR) + arc(A, B, C, 18, YE);
  s += txt(A[0], A[1] - 8, 'A') + txt(B[0] - 10, B[1] + 9, 'B') + txt(C[0] + 10, C[1] + 9, 'C') + txt(D[0] - 13, D[1] + 4, 'D') + txt(E[0] + 13, E[1], 'E');
  return svgBox(280, 212, s);
}
// 直角三角形と高さ
function rightAlt() {
  var A = [90, 40], B = [22, 170], C = [252, 170], H = [90, 170];
  var s = seg(A, B) + seg(A, C) + seg(B, C) + seg(A, H, BL, 2.6);
  s += '<path d="M90 158 H102 V170" fill="none" stroke="' + YE + '" stroke-width="2"/>';
  var u = [(B[0] - A[0]), (B[1] - A[1])], v = [(C[0] - A[0]), (C[1] - A[1])];
  var lu = Math.sqrt(u[0] * u[0] + u[1] * u[1]), lv = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  var p1 = [A[0] + u[0] / lu * 13, A[1] + u[1] / lu * 13], p2 = [A[0] + v[0] / lv * 13, A[1] + v[1] / lv * 13], p3 = [p1[0] + v[0] / lv * 13, p1[1] + v[1] / lv * 13];
  s += '<path d="M' + p1[0] + ' ' + p1[1] + ' L' + p3[0] + ' ' + p3[1] + ' L' + p2[0] + ' ' + p2[1] + '" fill="none" stroke="' + YE + '" stroke-width="2"/>';
  s += txt(A[0], A[1] - 8, 'A') + txt(B[0] - 10, B[1] + 9, 'B') + txt(C[0] + 10, C[1] + 9, 'C') + txt(H[0], H[1] + 20, 'H', YE);
  return svgBox(280, 200, s);
}
// 影で高さを求める図
function shadow(a, b, c) {
  var g = 166;
  var s = seg([10, g], [270, g], '#8b949e', 2);
  s += seg([34, g], [34, g - 40], OR, 4) + seg([34, g - 40], [70, g], YE, 2, true) + seg([34, g], [70, g], GR, 4);
  s += seg([140, g], [140, g - 136], OR, 4) + seg([140, g - 136], [262, g], YE, 2, true) + seg([140, g], [262, g], GR, 4);
  s += txt(26, g - 16, a[0], WH, 'end') + txt(52, g + 21, a[1]) + txt(132, g - 66, b, YE, 'end') + txt(201, g + 21, c);
  return svgBox(280, 198, s);
}

// 三角形を取り出して、同じ向きに並べた図（同じ色の角が対応）
function twoTri(nA, lA, nB, lB, k) {
  function one(ox, oy, s, n, l) {
    var T = [ox + 36 * s, oy - 82 * s], L = [ox, oy], Rt = [ox + 84 * s, oy];
    var r = seg(T, L) + seg(L, Rt) + seg(Rt, T) + arc(T, L, Rt, 13, YE) + arc(L, T, Rt, 14, GR) + arc(Rt, T, L, 14, OR);
    r += txt(T[0], T[1] - 7, n[0], YE) + txt(L[0] - 10, L[1] + 9, n[1], GR) + txt(Rt[0] + 10, Rt[1] + 9, n[2], OR);
    var m;
    m = mid(T, L); r += val([m[0] - 9, m[1] + 2], l[0], 'end');
    m = mid(L, Rt); r += val([m[0], m[1] + 19], l[1]);
    m = mid(T, Rt); r += val([m[0] + 9, m[1] + 2], l[2], 'start');
    return r;
  }
  return svgBox(340, 180, one(30, 148, 1, nA, lA) + one(170, 148, k, nB, lB), 380);
}
// 平行四辺形と、BE の延長と CD の延長の交点 F
function pgram() {
  var A = [60, 84], B = [30, 184], C = [190, 184], D = [220, 84], E = [160, 84], F = [238, 24];
  var s = seg(A, B) + seg(B, C) + seg(C, D) + seg(D, A) + seg(B, F, BL, 2.6) + seg(D, F, WH, 2, true);
  s += arc(E, A, B, 15, YE) + arc(E, D, F, 15, YE) + arc(A, B, E, 16, GR) + arc(D, F, E, 16, GR);
  s += txt(A[0] - 11, A[1] - 3, 'A') + txt(B[0] - 11, B[1] + 8, 'B') + txt(C[0] + 11, C[1] + 8, 'C') + txt(D[0] + 13, D[1] + 8, 'D') + txt(E[0] - 3, E[1] - 11, 'E', YE) + txt(F[0] + 12, F[1] + 4, 'F', YE);
  return svgBox(280, 208, s);
}

// ===== 問題データ =====
var QS = {};
// ---- Section 1：相似とは ----
QS[1] = [
  { q:'相似な図形の説明として正しいものは？', a:'一方を拡大・縮小すると、もう一方にぴったり重なる図形', choices:['一方を拡大・縮小すると、もう一方にぴったり重なる図形','面積が等しい図形','周の長さが等しい図形','辺の数が等しい図形'],
    exp:E('相似 ＝ 形が同じ（大きさはちがってもよい）', '拡大コピー・縮小コピーの関係', '面積や周の長さが同じ、ではない', 'コピー機の拡大だと思う') },
  { q:'△ABC ∽ △DEF のとき、頂点 B に対応する頂点は？', a:'E', choices:['E','D','F','B'],
    exp:E('∽ の式は、同じ順番の文字が対応する', '2番目どうし：B と E', '図の見た目で決めない', '順番が席順') },
  { q:'△ABC ∽ △DEF のとき、辺 BC に対応する辺は？', a:'EF', choices:['EF','DE','DF','AC'],
    exp:E('2番目と3番目の文字をつなぐ', 'BC ↔ EF', '文字の順番をずらさない', '式の順番どおりに抜き出す') },
  { q:'△ABC ∽ △PQR で、∠A ＝ 50°、∠B ＝ 70° のとき、∠R は？', a:'60°', choices:['60°','50°','70°','120°'],
    exp:E('相似なら、対応する角は等しい', '∠C ＝ 180° − 50° − 70° ＝ 60° → ∠R ＝ 60°', '∠R は ∠C に対応する', '3番目どうしが対応') },
  { q:'△ABC ∽ △DEF で、AB ＝ 4、DE ＝ 6 のとき、△ABC と △DEF の相似比は？', a:'2:3', choices:['2:3','3:2','1:2','2:5'],
    exp:E('相似比 ＝ 対応する辺の長さの比（いちばん簡単な整数に）', '4:6 ＝ 2:3', '順番を逆にしない', '左の図形：右の図形 の順') },
  { q:'図で △ABC ∽ △DEF（相似比 2:3）のとき、x の値は？', svg:pair({bc:'8',ef:'x'},1.5), a:'12', choices:['12','9','16','10'],
    exp:E('比例式を作る', '8:x ＝ 2:3 → 2x ＝ 24 → x ＝ 12', '8 ＋ (3 − 2) ＝ 9 のように数をたさない', '外側どうし＝内側どうし') },
  { q:'図で △ABC ∽ △DEF のとき、x の値は？', svg:pair({ab:'6',de:'9',ca:'8',fd:'x'},1.5), a:'12', choices:['12','11','16/3','6'],
    exp:E('わかっている辺で比を作る', 'AB:DE ＝ 6:9 ＝ 2:3、8:x ＝ 2:3 → x ＝ 12', '9 − 6 ＝ 3 を 8 にたすのは✕', '相似はたし算ではなく何倍か') },
  { q:'x:12 ＝ 3:4 のとき、x の値は？', a:'9', choices:['9','16','8','3'],
    exp:E('外側どうしの積 ＝ 内側どうしの積', '4x ＝ 36 → x ＝ 9', '3 × 4 ＝ 12 と混ぜない', '比例式の基本') },
  { q:'5:x ＝ 2:6 のとき、x の値は？', a:'15', choices:['15','9','12','5/3'],
    exp:E('外側どうしの積 ＝ 内側どうしの積', '2x ＝ 30 → x ＝ 15', '5 ＋ 4 ＝ 9 にしない', '2:6 ＝ 1:3 と先に簡単にしてもよい') },
  { q:'相似な図形で、必ず等しいものは？', a:'対応する角の大きさ', choices:['対応する角の大きさ','対応する辺の長さ','面積','周の長さ'],
    exp:E('角は同じ、辺は同じ比', '拡大しても角度は変わらない', '辺の長さは比が同じなだけ', '拡大コピーしても角度は変わらない') },
  { q:'いつでも相似になる2つの図形は？', a:'2つの正三角形', choices:['2つの正三角形','2つの長方形','2つの二等辺三角形','2つの直角三角形'],
    exp:E('形が1通りに決まる図形はいつも相似', '正三角形の角はいつも 60°', '長方形は細長いものもある', '正方形・円もいつも相似') }
];
// ---- Section 2：相似条件 ----
var CND = ['3組の辺の比がすべて等しい','2組の辺の比とその間の角がそれぞれ等しい','2組の角がそれぞれ等しい','相似とはいえない'];
QS[2] = [
  { q:'三角形の相似条件ではないものは？', a:'1組の角がそれぞれ等しい', choices:['1組の角がそれぞれ等しい','2組の角がそれぞれ等しい','3組の辺の比がすべて等しい','2組の辺の比とその間の角がそれぞれ等しい'],
    exp:E('相似条件は3つだけ', '角だけなら2組必要', '1組の角だけでは形が決まらない', '角2つで残りの角も決まる') },
  { q:'△ABC と △DEF で、∠A ＝ ∠D ＝ 40°、∠B ＝ ∠E ＝ 60° のとき、どの相似条件？', a:CND[2], choices:CND,
    exp:E('角が2組 → ③', '∠A ＝ ∠D、∠B ＝ ∠E', '辺の情報は必要ない', '入試ではいちばんよく使う') },
  { q:'AB ＝ 2、BC ＝ 3、CA ＝ 4 の △ABC と、DE ＝ 4、EF ＝ 6、FD ＝ 8 の △DEF では、どの相似条件？', a:CND[0], choices:CND,
    exp:E('3つの辺の比を全部調べる', '2:4 ＝ 3:6 ＝ 4:8 ＝ 1:2', 'どれか1組だけ見て決めない', '全部が同じ比のときだけ') },
  { q:'AB ＝ 3、AC ＝ 4、∠A ＝ 50° の △ABC と、DE ＝ 6、DF ＝ 8、∠D ＝ 50° の △DEF では、どの相似条件？', a:CND[1], choices:CND,
    exp:E('等しい角が、比を調べた2辺の間にあるか', '∠A は AB と AC の間の角', '間の角でなければ使えない', '辺・角・辺の順に並ぶ') },
  { q:'AB ＝ 3、AC ＝ 4、∠B ＝ 50° の △ABC と、DE ＝ 6、DF ＝ 8、∠E ＝ 50° の △DEF では、どの相似条件？', a:CND[3], choices:CND,
    exp:E('∠B は AB と AC の間の角ではない', '条件に当てはまらないので相似とはいえない', '2組の辺の比と角があっても、間の角でなければ✕', '角をはさむ2辺かどうかを見る') },
  { q:'∠A ＝ 30°、∠B ＝ 80° の △ABC と、∠D ＝ 30°、∠F ＝ 70° の △DEF では、どの相似条件？', a:CND[2], choices:CND,
    exp:E('残りの角を計算してから比べる', '∠E ＝ 180° − 30° − 70° ＝ 80° ＝ ∠B', '書いてある角だけで判断しない', '内角の和は 180°') },
  { q:'AB ＝ 4、BC ＝ 6、CA ＝ 8 の △ABC と、DE ＝ 6、EF ＝ 9、FD ＝ 10 の △DEF では？', a:CND[3], choices:CND,
    exp:E('3つとも同じ比のときだけ相似', '4:6 ＝ 6:9 だが、8:10 だけちがう', '2組だけ見て決めない', '小さい順に並べて比べる') },
  { q:'頂角がどちらも 40° の2つの二等辺三角形は？', a:CND[2], choices:CND,
    exp:E('二等辺三角形は底角が等しい', '底角はどちらも 70° → 角が2組等しい', '辺の長さがわからなくても言える', '底角を計算する') },
  { q:'図で DE // BC のとき、△ADE ∽ △ABC となる相似条件は？', svg:pyramid(0.45,{}), a:CND[2], choices:CND,
    exp:E('平行線の同位角と共通の角', '∠ADE ＝ ∠ABC（同位角）、∠A は共通', '長さがなくても言える', 'ピラミッド型は共通の角') },
  { q:'図で AB // CD のとき、正しい式は？', svg:butterfly(0.55,{}), a:'△OAB ∽ △ODC', choices:['△OAB ∽ △ODC','△OAB ∽ △OCD','△OAB ∽ △DOC','△OAB ∽ △CDO'],
    exp:E('錯角で対応を決める', '∠OAB ＝ ∠ODC（錯角）なので A と D が対応', '見た目の位置で C と決めない', 'ちょうちょ型は対角に並ぶ') },
  { q:'図は ∠A ＝ 90° の △ABC で、AH は BC に垂直。△ABC と相似な三角形を、対応の順に正しく書いたものは？', svg:rightAlt(), a:'△HBA', choices:['△HBA','△BHA','△AHB','△HAB'],
    exp:E('直角と共通の角で対応を決める', '直角：A と H、∠B は共通 → A→H、B→B、C→A', 'H を3番目にしない', '角が同じ頂点を同じ順番に') }
];
// ---- Section 3：相似の証明 ----
QS[3] = [
  { q:'図で ∠ADE ＝ ∠ACB のとき、△ABC と △AED で ∠A が等しい理由は？', svg:proofFig(), a:'共通な角だから', choices:['共通な角だから','対頂角だから','平行線の錯角だから','仮定だから'],
    exp:E('どちらの三角形にも入っている角は「共通」', '∠BAC ＝ ∠EAD', '問題に書いていない角を仮定にしない', '2つの三角形で同じ角を使っている') },
  { q:'同じ図の証明で、∠ACB ＝ ∠ADE を書くときの理由は？', svg:proofFig(), a:'仮定より', choices:['仮定より','共通な角だから','対頂角は等しいから','円周角の定理より'],
    exp:E('問題文に書いてあることは「仮定」', '問題文で ∠ADE ＝ ∠ACB と与えられている', '別の理由を探しに行かない', 'まず問題文の条件を使う') },
  { q:'同じ図の証明の結論として、正しい書き方は？', svg:proofFig(), a:'△ABC ∽ △AED', choices:['△ABC ∽ △AED','△ABC ∽ △ADE','△ABC ∽ △DEA','△ABC ＝ △AED'],
    exp:E('等しい角の頂点を同じ順番に', 'A と A、C と D が対応 → B と E', '∽ の順番をそろえる', '見た目の順番で書かない') },
  { q:'図で AB // CD のとき、∠AOB ＝ ∠DOC といえる理由は？', svg:butterfly(0.55,{}), a:'対頂角は等しいから', choices:['対頂角は等しいから','共通な角だから','平行線の同位角は等しいから','仮定より'],
    exp:E('2直線が交わってできる向かい合った角', 'O で AD と BC が交わっている', '共通な角ではない', 'ちょうちょの真ん中は対頂角') },
  { q:'同じ図で、∠OAB ＝ ∠ODC といえる理由は？', svg:butterfly(0.55,{}), a:'平行線の錯角は等しいから', choices:['平行線の錯角は等しいから','平行線の同位角は等しいから','対頂角は等しいから','共通な角だから'],
    exp:E('Z の形の角が錯角', 'AB // CD で、AD がよこぎっている', '同位角は F の形', 'Z を探す') },
  { q:'図で DE // BC のとき、∠ADE ＝ ∠ABC といえる理由は？', svg:pyramid(0.45,{}), a:'平行線の同位角は等しいから', choices:['平行線の同位角は等しいから','平行線の錯角は等しいから','対頂角は等しいから','仮定より'],
    exp:E('同じ向きの位置にある角が同位角', 'AB が DE と BC をよこぎっている', '錯角は Z の形', 'F の形を探す') },
  { q:'角が2組等しいと示せたあとに書く言葉は？', a:'2組の角がそれぞれ等しいから、△○ ∽ △□', choices:['2組の角がそれぞれ等しいから、△○ ∽ △□','1組の角が等しいから、△○ ∽ △□','2組の角がそれぞれ等しいから、△○ ≡ △□','3組の辺が等しいから、△○ ∽ △□'],
    exp:E('条件 → 結論の順に書く', '相似条件の言葉をそのまま使う', '≡ は合同の記号', '相似は ∽') },
  { q:'相似の証明で書く順番として正しいものは？', a:'どの三角形か → 根拠 → 相似条件 → 結論', choices:['どの三角形か → 根拠 → 相似条件 → 結論','結論 → 根拠 → どの三角形か','相似条件 → 結論 → 根拠','根拠だけを書く'],
    exp:E('証明は型どおりに書く', '「△ABC と △AED において」から始める', '結論を先に書かない', '4行の型') },
  { q:'△ABC ∽ △AED を証明できたあと、AB ＝ 6、AC ＝ 8、AE ＝ 3 なら AD の長さは？', a:'4', choices:['4','9/4','5','16'],
    exp:E('対応する辺で比を作る', 'AB:AE ＝ AC:AD → 6:3 ＝ 8:AD → AD ＝ 4', 'AD と AE を入れかえない', 'AB ↔ AE、AC ↔ AD') }
];
// ---- Section 4：平行線と比 ----
QS[4] = [
  { q:'図で DE // BC のとき、x の値は？', svg:pyramid(0.6,{ad:'3',db:'2',ae:'6',ec:'x'}), a:'4', choices:['4','9','5','3'],
    exp:E('AD:DB ＝ AE:EC（上：下は左右で同じ比）', '3:2 ＝ 6:x → 3x ＝ 12 → x ＝ 4', '6 ＋ (2 − 3) のように数をたさない', '左の比と右の比をそろえる') },
  { q:'図で DE // BC のとき、AC の長さは？（AD ＝ 4、AB ＝ 10、AE ＝ 6）', svg:pyramid(0.4,{ad:'4',ae:'6'}), a:'15', choices:['15','12','16','9'],
    exp:E('AD:AB ＝ AE:AC', '4:10 ＝ 6:x → 4x ＝ 60 → x ＝ 15', 'AB は 10 全体（DB は 6）', '全体どうしを比べる') },
  { q:'図で DE // BC のとき、x の値は？', svg:pyramid(0.4,{ad:'2',db:'3',de:'4',bc:'x'}), a:'10', choices:['10','6','8','7'],
    exp:E('横の線の比は AD:AB を使う', 'AD:AB ＝ 2:5 → 2:5 ＝ 4:x → x ＝ 10', 'AD:DB ＝ 2:3 を使うと 6 になる（いちばん多いまちがい）', '横の線は、三角形全体の辺と比べる') },
  { q:'図で DE // BC のとき、x の値は？（AD ＝ 3、AB ＝ 9）', svg:pyramid(1/3,{ad:'3',de:'x',bc:'12'}), a:'4', choices:['4','6','3','9'],
    exp:E('AD:AB ＝ DE:BC', '3:9 ＝ x:12 → 9x ＝ 36 → x ＝ 4', '3:6 を使って 6 にしない', '上の小さい三角形：全体') },
  { q:'図で DE // BC のとき、AD:AB と等しい比は？', svg:pyramid(0.45,{}), a:'DE:BC', choices:['DE:BC','DE:DB','AD:DB','BC:DE'],
    exp:E('△ADE ∽ △ABC の対応する辺', 'AD:AB ＝ AE:AC ＝ DE:BC', 'DB は三角形の辺ではない', '相似な2つの三角形の辺どうし') },
  { q:'AD:DB ＝ 1:2 のとき、AD:AB は？', a:'1:3', choices:['1:3','1:2','2:3','3:1'],
    exp:E('全体 ＝ 上 ＋ 下', 'AB は 1 ＋ 2 ＝ 3', 'AD:DB をそのまま使わない', '線分図をかいて確かめる') },
  { q:'図で DE // BC、AD:DB ＝ 2:1、BC ＝ 9 のとき、DE の長さは？', svg:pyramid(2/3,{bc:'9',de:'x'}), a:'6', choices:['6','18','4.5','3'],
    exp:E('まず AD:AB を出す', 'AD:AB ＝ 2:3 → x:9 ＝ 2:3 → x ＝ 6', '2:1 で 18 にしない', '上：全体に直してから') },
  { q:'図で AB // CD のとき、x の値は？', svg:butterfly(0.5,{oa:'3',od:'6',ob:'4',oc:'x'}), a:'8', choices:['8','2','7','5'],
    exp:E('ちょうちょ型：OA:OD ＝ OB:OC', '3:6 ＝ 4:x → x ＝ 8', '対角どうしを対応させる', '直線上に並んだ2つで比を作る') },
  { q:'図で AB // CD のとき、x の値は？', svg:butterfly(1/3,{oa:'2',od:'6',ab:'5',cd:'x'}), a:'15', choices:['15','9','10','5/3'],
    exp:E('OA:OD ＝ AB:DC', '2:6 ＝ 5:x → x ＝ 15', '5 ＋ 4 ＝ 9 にしない', 'AB と DC が対応') },
  { q:'△ABC で、AD ＝ 2、DB ＝ 4、AE ＝ 3、EC ＝ 6 のとき、DE と BC の関係は？', a:'平行である', choices:['平行である','平行ではない','垂直である','長さが等しい'],
    exp:E('AD:DB ＝ AE:EC なら DE // BC', '2:4 ＝ 3:6 ＝ 1:2', '比が同じことを確かめる', '定理の逆') },
  { q:'△ABC で、AD ＝ 2、DB ＝ 4、AE ＝ 3、EC ＝ 5 のとき、DE と BC の関係は？', a:'平行ではない', choices:['平行ではない','平行である','垂直である','長さが等しい'],
    exp:E('比がちがえば平行ではない', '2:4 ＝ 1:2、3:5 はちがう', '数が近くても等しいとは言えない', '必ず比を計算する') }
];
// ---- Section 8：中点連結・平行線 ----
QS[8] = [
  { q:'図で M、N が辺の中点のとき、x の値は？', svg:midTri({bc:'10',mn:'x'}), a:'5', choices:['5','10','20','8'],
    exp:E('中点連結定理：MN ＝ BC の半分', '10 ÷ 2 ＝ 5', '同じ長さにしない', '半分で平行') },
  { q:'図で M、N が辺の中点のとき、x の値は？', svg:midTri({mn:'7',bc:'x'}), a:'14', choices:['14','7','3.5','9'],
    exp:E('BC は MN の 2 倍', '7 × 2 ＝ 14', '半分にしない', '下の辺の方が長い') },
  { q:'中点連結定理で、MN と BC の関係は？', a:'平行で、MN は BC の半分', choices:['平行で、MN は BC の半分','平行で、長さは等しい','垂直で、MN は BC の半分','垂直で、長さは等しい'],
    exp:E('平行＋半分の2点セット', 'MN // BC、MN ＝ 1/2 BC', '片方だけで終わらない', '証明でも両方使う') },
  { q:'3辺が 6、8、10 の三角形で、各辺の中点を結んでできる三角形の周の長さは？', a:'12', choices:['12','24','6','18'],
    exp:E('3本とも元の辺の半分', '3 ＋ 4 ＋ 5 ＝ 12', '元の周 24 にしない', '周も半分になる') },
  { q:'図で 3本の直線が平行のとき、x の値は？', svg:lines3(0.4,{ab:'4',bc:'6',de:'6',ef:'x'}), a:'9', choices:['9','8','4','6'],
    exp:E('AB:BC ＝ DE:EF', '4:6 ＝ 6:x → x ＝ 9', '6 ＋ 2 ＝ 8 にしない', '同じ線の上で比を作る') },
  { q:'図で 3本の直線が平行のとき、x の値は？', svg:lines3(0.375,{ab:'3',bc:'5',de:'6',ef:'x'}), a:'10', choices:['10','8','5','15'],
    exp:E('AB:BC ＝ DE:EF', '3:5 ＝ 6:x → x ＝ 10', 'たし算で 8 にしない', 'DE は AB の 2 倍なので EF も BC の 2 倍') },
  { q:'AD // BC の台形 ABCD で、AD ＝ 4、BC ＝ 10、M は AB の中点、N は DC の中点のとき、MN の長さは？', a:'7', choices:['7','14','6','5'],
    exp:E('対角線で2つの三角形に分けて、中点連結定理を2回', '(4 ＋ 10) ÷ 2 ＝ 7', '÷2 を忘れると 14', '上底と下底の平均') },
  { q:'四角形の4辺の中点を順に結ぶと、いつもどんな四角形になる？', a:'平行四辺形', choices:['平行四辺形','正方形','台形','ひし形'],
    exp:E('対角線で分けて中点連結定理を使う', '向かい合う辺が平行で等しくなる', '正方形になるとは限らない', 'どんな四角形でも平行四辺形') },
  { q:'【発展】△ABC で AB ＝ 6、AC ＝ 4、BC ＝ 5。∠A の二等分線と BC の交点を D とすると、BD の長さは？', a:'3', choices:['3','2','2.5','4'],
    exp:E('角の二等分線：BD:DC ＝ AB:AC', '6:4 ＝ 3:2 → BD ＝ 5 × 3/5 ＝ 3', 'BC を半分にしない', '入試の応用で出る') }
];
// ---- Section 9：面積比・体積比・利用 ----
QS[9] = [
  { q:'相似比 2:3 の図形の面積比は？', a:'4:9', choices:['4:9','2:3','8:27','6:9'],
    exp:E('面積比は 2乗', '2²:3² ＝ 4:9', '8:27 は体積比', '面積は たて × よこ で2回') },
  { q:'相似比 3:5 の三角形で、小さい方の面積が 18 のとき、大きい方の面積は？', a:'50', choices:['50','30','150','75'],
    exp:E('面積比 9:25 で比例式', '9:25 ＝ 18:x → x ＝ 50', '3:5 のままだと 30', '先に2乗する') },
  { q:'面積比が 16:25 の相似な図形の相似比は？', a:'4:5', choices:['4:5','16:25','8:5','2:5'],
    exp:E('面積比から相似比は √', '√16 : √25 ＝ 4:5', '2 で割らない', '2乗の逆') },
  { q:'相似比 1:2 の図形で、小さい方の周の長さが 10 のとき、大きい方の周の長さは？', a:'20', choices:['20','40','10','5'],
    exp:E('周の長さは相似比のまま', '1:2 ＝ 10:x', '周は2乗しない', '長さ → そのまま、面積 → 2乗') },
  { q:'図で DE // BC、AD:DB ＝ 1:2 のとき、△ADE と △ABC の面積比は？', svg:pyramid(1/3,{}), a:'1:9', choices:['1:9','1:4','1:3','1:8'],
    exp:E('まず相似比（上：全体）', '相似比 1:3 → 面積比 1:9', 'AD:DB の 1:2 を2乗して 1:4 にしない', '相似な2つの三角形の比を使う') },
  { q:'前の問題で △ADE の面積が 2 のとき、四角形 DBCE の面積は？', a:'16', choices:['16','18','4','8'],
    exp:E('全体 − 小さい三角形', '△ABC ＝ 18、18 − 2 ＝ 16', '△ABC の 18 で止めない', '面積比は 1:(9 − 1) ＝ 1:8') },
  { q:'半径の比が 1:2 の球の体積比は？', a:'1:8', choices:['1:8','1:4','1:2','1:6'],
    exp:E('体積比は 3乗', '1³:2³ ＝ 1:8', '1:4 は表面積の比', '体積は たて × よこ × 高さ で3回') },
  { q:'半径の比が 1:2 の球の表面積の比は？', a:'1:4', choices:['1:4','1:8','1:2','1:6'],
    exp:E('表面積は「面積」なので 2乗', '1²:2² ＝ 1:4', '立体でも面の話なら2乗', '面積か体積かを見る') },
  { q:'相似比 2:3 の円錐で、小さい方の体積が 16 のとき、大きい方の体積は？', a:'54', choices:['54','24','36','81'],
    exp:E('体積比 8:27 で比例式', '8:27 ＝ 16:x → x ＝ 54', '2乗の 4:9 だと 36', '先に3乗する') },
  { q:'円錐を、高さの半分のところで底面に平行に切った。上の小さい円錐と、下の立体の体積比は？', a:'1:7', choices:['1:7','1:8','1:1','1:3'],
    exp:E('全体と比べてから引く', '小:全体 ＝ 1:8 → 下は 8 − 1 ＝ 7', '1:8 は全体との比', '切り取った残りは引き算') },
  { q:'長さ 1m の棒の影が 0.8m のとき、影が 4m の木の高さは？', svg:shadow(['1m','0.8m'],'x','4m'), a:'5 m', choices:['5 m','3.2 m','4.8 m','4.2 m'],
    exp:E('同じ時刻の影は相似', '1:0.8 ＝ x:4 → 0.8x ＝ 4 → x ＝ 5', '×0.8 で 3.2 にしない', '「高さ:影」の順番をそろえる') },
  { q:'長さ 2m の棒の影が 1.5m のとき、影が 12m の校舎の高さは？', svg:shadow(['2m','1.5m'],'x','12m'), a:'16 m', choices:['16 m','9 m','12.5 m','18 m'],
    exp:E('高さ:影 の比を作る', '2:1.5 ＝ x:12 → 1.5x ＝ 24 → x ＝ 16', '比の順番を入れかえない', '棒も校舎も「高さ:影」') }
];
// ---- Section 5：確認テスト ----
QS[5] = [
  { q:'△ABC ∽ △DEF のとき、辺 AC に対応する辺は？', a:'DF', choices:['DF','DE','EF','BC'],
    exp:E('1番目と3番目', 'AC ↔ DF', '順番をずらさない', '式の順番どおり') },
  { q:'△ABC ∽ △DEF で ∠A ＝ 45°、∠B ＝ 75° のとき、∠F は？', a:'60°', choices:['60°','45°','75°','105°'],
    exp:E('対応する角は等しい', '∠F ＝ ∠C ＝ 180° − 45° − 75° ＝ 60°', '∠F は ∠C に対応', '3番目どうし') },
  { q:'AB ＝ 6、DE ＝ 10 のとき、△ABC と △DEF の相似比は？', a:'3:5', choices:['3:5','5:3','6:5','2:5'],
    exp:E('簡単な整数の比に', '6:10 ＝ 3:5', '順番を逆にしない', '左：右') },
  { q:'x:15 ＝ 2:5 のとき、x の値は？', a:'6', choices:['6','12','3','10'],
    exp:E('外側の積 ＝ 内側の積', '5x ＝ 30', '2 × 5 と混ぜない', '比例式の基本') },
  { q:'三角形の相似条件ではないものは？', a:'2組の辺の比だけが等しい', choices:['2組の辺の比だけが等しい','3組の辺の比がすべて等しい','2組の角がそれぞれ等しい','2組の辺の比とその間の角がそれぞれ等しい'],
    exp:E('辺だけなら3組必要', '2組の辺の比だけでは形が決まらない', '間の角が必要', '相似条件は3つだけ') },
  { q:'∠A ＝ 50°、∠B ＝ 60° の △ABC と、∠D ＝ 50°、∠F ＝ 70° の △DEF は？', a:'2組の角が等しく、相似である', choices:['2組の角が等しく、相似である','1組の角しか等しくないので相似ではない','辺がわからないので決められない','合同である'],
    exp:E('残りの角を計算', '∠E ＝ 60° ＝ ∠B', '書いてある角だけで判断しない', '内角の和は 180°') },
  { q:'図で AB // CD のとき、∠OAB ＝ ∠ODC の理由は？', svg:butterfly(0.55,{}), a:'平行線の錯角は等しいから', choices:['平行線の錯角は等しいから','対頂角は等しいから','共通な角だから','平行線の同位角は等しいから'],
    exp:E('Z の形', 'AD が AB と CD をよこぎる', '対頂角は O の角', 'Z を探す') },
  { q:'図で DE // BC のとき、x の値は？', svg:pyramid(0.5,{ad:'4',db:'4',ae:'5',ec:'x'}), a:'5', choices:['5','4','10','8'],
    exp:E('AD:DB ＝ AE:EC', '4:4 ＝ 5:x → x ＝ 5', '4 にしない', '左と右の比をそろえる') },
  { q:'図で DE // BC のとき、x の値は？', svg:pyramid(0.6,{ad:'3',db:'2',de:'6',bc:'x'}), a:'10', choices:['10','4','9','8'],
    exp:E('横の線は AD:AB', '3:5 ＝ 6:x → x ＝ 10', 'AD:DB ＝ 3:2 を使うと 4', '三角形全体の辺と比べる') },
  { q:'図で AB // CD のとき、x の値は？', svg:butterfly(0.5,{oa:'4',od:'8',ob:'3',oc:'x'}), a:'6', choices:['6','7','1.5','12'],
    exp:E('OA:OD ＝ OB:OC', '4:8 ＝ 3:x → x ＝ 6', 'たして 7 にしない', '直線上の2つで比を作る') },
  { q:'AD ＝ 3、DB ＝ 6、AE ＝ 2、EC ＝ 4 のとき、DE と BC の関係は？', a:'平行である', choices:['平行である','平行ではない','垂直である','長さが等しい'],
    exp:E('比が等しければ平行', '3:6 ＝ 2:4 ＝ 1:2', '計算して確かめる', '定理の逆') },
  { q:'図で M、N が辺の中点のとき、x の値は？', svg:midTri({bc:'12',mn:'x'}), a:'6', choices:['6','12','24','9'],
    exp:E('MN ＝ BC の半分', '12 ÷ 2 ＝ 6', '同じ長さにしない', '平行で半分') },
  { q:'図で 3本の直線が平行のとき、x の値は？', svg:lines3(0.4,{ab:'2',bc:'3',de:'4',ef:'x'}), a:'6', choices:['6','5','3','8'],
    exp:E('AB:BC ＝ DE:EF', '2:3 ＝ 4:x → x ＝ 6', 'たして 5 にしない', '同じ線の上で比を作る') },
  { q:'相似比 3:4 の図形の面積比は？', a:'9:16', choices:['9:16','3:4','27:64','6:8'],
    exp:E('面積は 2乗', '3²:4² ＝ 9:16', '27:64 は体積比', '面積 → 2乗') },
  { q:'相似比 2:5 の図形で、小さい方の面積が 8 のとき、大きい方の面積は？', a:'50', choices:['50','20','125','32'],
    exp:E('面積比 4:25', '4:25 ＝ 8:x → x ＝ 50', '2:5 のままだと 20', '先に2乗') },
  { q:'相似比 1:3 の立体の体積比は？', a:'1:27', choices:['1:27','1:9','1:3','1:6'],
    exp:E('体積は 3乗', '1³:3³ ＝ 1:27', '1:9 は面積比', '体積 → 3乗') },
  { q:'相似比 1:2 の立体で、小さい方の体積が 5 のとき、大きい方の体積は？', a:'40', choices:['40','20','10','80'],
    exp:E('体積比 1:8', '1:8 ＝ 5:x', '2乗の 1:4 で 20 にしない', '先に3乗') },
  { q:'図で DE // BC、AD:DB ＝ 1:1 のとき、△ADE と四角形 DBCE の面積比は？', svg:pyramid(0.5,{}), a:'1:3', choices:['1:3','1:4','1:1','1:2'],
    exp:E('相似比 1:2 → 面積比 1:4 → 残りを引く', '四角形は 4 − 1 ＝ 3', '1:4 は全体との比', '全体 − 小') },
  { q:'長さ 1.5m の棒の影が 2m のとき、影が 8m の木の高さは？', svg:shadow(['1.5m','2m'],'x','8m'), a:'6 m', choices:['6 m','10.7 m','7.5 m','12 m'],
    exp:E('高さ:影', '1.5:2 ＝ x:8 → 2x ＝ 12 → x ＝ 6', '順番を入れかえない', '棒も木も 高さ:影') },
  { q:'相似の証明で「対頂角は等しい」が使えるのは、どの形？', a:'ちょうちょ型', choices:['ちょうちょ型','ピラミッド型','直角三角形の高さの図','正三角形'],
    exp:E('2直線が交わるところ', 'ちょうちょの真ん中', 'ピラミッド型は共通の角', '形で使う根拠が決まる') }
];
// ---- Section 10：対応の見つけ方（2026-11-08 追加） ----
QS[10] = [
  { q:'図で DE // BC。△ADE ∽ △ABC のとき、辺 AD に対応する辺は？', svg:pyramid(0.45,{}), a:'AB', choices:['AB','DB','BC','AC'],
    exp:E('取り出すと、小さい △ADE と大きい △ABC', 'A→A、D→B なので AD ↔ AB', 'DB はどちらの三角形の辺でもない', '小さい三角形の辺 ↔ 大きい三角形の辺') },
  { q:'同じ図で、辺 DE に対応する辺は？', svg:pyramid(0.45,{}), a:'BC', choices:['BC','DB','AB','EC'],
    exp:E('2番目と3番目の文字をつなぐ', 'DE ↔ BC', 'となりの線を選ばない', '式の順番どおり') },
  { q:'図で AB // CD。△OAB ∽ △ODC のとき、辺 OA に対応する辺は？', svg:butterfly(0.55,{}), a:'OD', choices:['OD','OC','CD','AB'],
    exp:E('ちょうちょ型は対角の点が対応', 'A→D なので OA ↔ OD', '近くにある OC を選ばない', '1本の直線の上に並んだ2つが対応') },
  { q:'同じ図で、辺 OB に対応する辺は？', svg:butterfly(0.55,{}), a:'OC', choices:['OC','OD','CD','OA'],
    exp:E('B→C', 'OB ↔ OC', '上下に並ぶ OD を選ばない', 'B から O を通ってまっすぐ進むと C') },
  { q:'図で ∠ADE ＝ ∠ACB。△ABC ∽ △AED のとき、辺 AB に対応する辺は？', svg:proofFig(), a:'AE', choices:['AE','AD','DE','DB'],
    exp:E('裏返しの形は、等しい角の頂点で決める', 'C→D なので B→E。AB ↔ AE', '同じ線の上の AD を選ばない', '見た目ではなく角の色で') },
  { q:'同じ図で、辺 AC に対応する辺は？', svg:proofFig(), a:'AD', choices:['AD','AE','DE','EC'],
    exp:E('C→D', 'AC ↔ AD', '同じ線の上の AE を選ばない', '裏返しは線が入れかわる') },
  { q:'同じ図で AB ＝ 9、AC ＝ 12、AD ＝ 4 のとき、AE の長さは？', svg:proofFig(), a:'3', choices:['3','16/3','27','6'],
    exp:E('対応する辺で比を作る', 'AB:AE ＝ AC:AD → 9:x ＝ 12:4 → x ＝ 3', 'AB:AD ＝ AC:AE とすると 16/3（対応がちがう）', '左の三角形：右の三角形 でそろえる') },
  { q:'同じ図で AE ＝ 6、AD ＝ 4、AC ＝ 10 のとき、AB の長さは？', svg:proofFig(), a:'15', choices:['15','20/3','12','8'],
    exp:E('AB:AE ＝ AC:AD', 'x:6 ＝ 10:4 → 4x ＝ 60 → x ＝ 15', 'AE と AD を入れかえない', '先に対応を書き出す') },
  { q:'図で ∠A ＝ 90°、AH ⊥ BC。△ABC ∽ △HBA のとき、辺 AB に対応する辺は？', svg:rightAlt(), a:'HB', choices:['HB','HA','BA','AC'],
    exp:E('A→H、B→B', 'AB ↔ HB', '同じ AB を選ばない', '順番どおりに読む') },
  { q:'同じ図で AB ＝ 6、BC ＝ 9 のとき、BH の長さは？', svg:rightAlt(), a:'4', choices:['4','9','6','3'],
    exp:E('AB:HB ＝ BC:BA', '6:x ＝ 9:6 → 9x ＝ 36 → x ＝ 4', 'AB が左にも右にも出てくる', '1つの辺が2回使われることもある') }
];
// ---- Section 11：証明ドリル（2026-11-08 追加） ----
QS[11] = [
  { q:'【証明A】DE // BC で △ADE ∽ △ABC を証明する。∠ADE ＝ ∠ABC（同位角）のほかに使う根拠は？', svg:pyramid(0.45,{}), a:'∠DAE ＝ ∠BAC（共通な角）', choices:['∠DAE ＝ ∠BAC（共通な角）','∠ADE ＝ ∠ACB（同位角）','∠AED ＝ ∠ADE（二等辺三角形）','AD ＝ AE（仮定）'],
    exp:E('ピラミッド型は「同位角」と「共通な角」', '∠A は2つの三角形に共通', '問題に書いていない等しさを使わない', 'てっぺんの角は共通') },
  { q:'【証明A】最後の1行として正しいものは？', a:'2組の角がそれぞれ等しいから、△ADE ∽ △ABC', choices:['2組の角がそれぞれ等しいから、△ADE ∽ △ABC','2組の角がそれぞれ等しいから、△ADE ∽ △ACB','1組の角が等しいから、△ADE ∽ △ABC','2組の辺の比が等しいから、△ADE ∽ △ABC'],
    exp:E('条件のあとに、対応の順で結論', 'D→B、E→C', '△ACB は順番がちがう', '条件 → 結論') },
  { q:'【証明B】AB // CD で △OAB ∽ △ODC を証明する。∠OAB と等しい角は？', svg:butterfly(0.55,{}), a:'∠ODC', choices:['∠ODC','∠OCD','∠AOB','∠OBA'],
    exp:E('平行線の錯角（Z の形）', 'AD がよこぎる：∠OAB ＝ ∠ODC', '∠OCD は ∠OBA と等しい角', 'Z を指でなぞる') },
  { q:'【証明B】∠AOB と等しい角とその根拠は？', svg:butterfly(0.55,{}), a:'∠DOC（対頂角）', choices:['∠DOC（対頂角）','∠OCD（錯角）','∠ODC（同位角）','∠BOD（対頂角）'],
    exp:E('向かい合う角が対頂角', '∠AOB と ∠DOC', '∠BOD はとなりの角', 'O をはさんで反対側') },
  { q:'【証明B】OA ＝ 4、OD ＝ 6、AB ＝ 5 のとき、CD の長さは？', svg:butterfly(2/3,{oa:'4',od:'6',ab:'5',cd:'x'}), a:'7.5', choices:['7.5','7','10/3','6'],
    exp:E('OA:OD ＝ AB:DC', '4:6 ＝ 5:x → 4x ＝ 30 → x ＝ 7.5', '5 ＋ 2 ＝ 7 にしない', '比で考える') },
  { q:'【証明C】平行四辺形 ABCD で、BE と CD の延長の交点が F。∠AEB と等しい角とその根拠は？', svg:pgram(), a:'∠DEF（対頂角）', choices:['∠DEF（対頂角）','∠DFE（錯角）','∠EDF（同位角）','∠ABE（錯角）'],
    exp:E('AD と BF が E で交わる', '∠AEB と ∠DEF は向かい合う角', '角の場所を確かめる', '金色どうしが等しい') },
  { q:'【証明C】∠BAE と等しい角とその根拠は？', svg:pgram(), a:'∠FDE（AB // DF の錯角）', choices:['∠FDE（AB // DF の錯角）','∠DFE（AB // DF の錯角）','∠DEF（対頂角）','∠ABE（共通な角）'],
    exp:E('平行四辺形の向かい合う辺は平行', 'CD の延長 DF と AB が平行、AD がよこぎる', '∠DFE は ∠ABE と等しい角', '緑どうしが等しい') },
  { q:'【証明C】結論として正しいものは？', svg:pgram(), a:'△ABE ∽ △DFE', choices:['△ABE ∽ △DFE','△ABE ∽ △DEF','△ABE ∽ △FDE','△ABE ∽ △EFD'],
    exp:E('A→D、E→E なので B→F', '等しい角の頂点を同じ順番に', '△DEF は順番がちがう', '色の順に書く') },
  { q:'【証明C】AE ＝ 5、ED ＝ 3、AB ＝ 10 のとき、DF の長さは？', svg:pgram(), a:'6', choices:['6','50/3','8','15'],
    exp:E('AE:DE ＝ AB:DF', '5:3 ＝ 10:x → 5x ＝ 30 → x ＝ 6', '対応がちがうと 50/3', '△ABE ∽ △DFE の順に読む') },
  { q:'【証明D】∠A ＝ 90°、AH ⊥ BC で △ABC ∽ △HBA を証明する。使う根拠は？', svg:rightAlt(), a:'∠BAC ＝ ∠BHA（直角）と ∠ABC ＝ ∠HBA（共通）', choices:['∠BAC ＝ ∠BHA（直角）と ∠ABC ＝ ∠HBA（共通）','∠BAC ＝ ∠BHA（直角）だけ','∠ACB ＝ ∠HBA（錯角）と AB ＝ AC','AH ＝ BH と ∠B（共通）'],
    exp:E('直角と共通の角で2組', '∠B はどちらの三角形にも入る', '1組だけでは足りない', '直角三角形は1組は直角で決まり') },
  { q:'証明の書き方として✕なのは？', a:'「形が同じに見えるから相似」と書く', choices:['「形が同じに見えるから相似」と書く','「△ABC と △DEF において」から書き始める','根拠のうしろに ①、② と番号をつける','最後に相似条件を書いてから結論を書く'],
    exp:E('見た目は根拠にならない', '根拠は 仮定・共通な角・対頂角・平行線の角・円周角', '「見えるから」は点にならない', '根拠の名前を書く') }
];
// ---- Section 12：テスト対策（2026-11-08 追加） ----
QS[12] = [
  { q:'平行四辺形 ABCD で、AD 上に E を AE:ED ＝ 3:2 となるようにとる。BE と AC の交点を F とすると、AF:FC は？', a:'3:5', choices:['3:5','3:2','2:3','5:3'],
    exp:E('ちょうちょ型 △AEF ∽ △CBF', 'BC ＝ AD ＝ 5 とすると AE ＝ 3、AF:FC ＝ AE:CB ＝ 3:5', 'ED の 2 を使わない', 'AD ＝ BC を比の 5 で置く') },
  { q:'前の問題で、△AEF と △CBF の面積比は？', a:'9:25', choices:['9:25','3:5','27:125','6:10'],
    exp:E('面積比は相似比の 2乗', '3²:5² ＝ 9:25', '3:5 のままにしない', '先に相似比') },
  { q:'AD // BC の台形 ABCD で、AD ＝ 3、BC ＝ 6、対角線の交点を O とすると、AO:OC は？', a:'1:2', choices:['1:2','2:1','3:6','1:3'],
    exp:E('ちょうちょ型 △OAD ∽ △OCB', 'AO:CO ＝ AD:CB ＝ 3:6 ＝ 1:2', '順番を逆にしない', '簡単な比にする') },
  { q:'前の問題で、△AOD の面積が 2 のとき、△BOC の面積は？', a:'8', choices:['8','4','6','16'],
    exp:E('相似比 1:2 → 面積比 1:4', '1:4 ＝ 2:x → x ＝ 8', '2 倍の 4 にしない', '面積は 2乗') },
  { q:'△ABC で DE // BC、AD:DB ＝ 3:1。四角形 DBCE の面積が 14 のとき、△ADE の面積は？', svg:pyramid(0.75,{}), a:'18', choices:['18','42','32','9'],
    exp:E('相似比 3:4 → 面積比 9:16 → 四角形は 7', '7 が 14 にあたるので 1 は 2、△ADE ＝ 9 × 2 ＝ 18', '3:1 を 2乗して 9:1 にしない', '「上：全体」→ 2乗 → 引く') },
  { q:'△ABC で AB ＝ 10、AC ＝ 12、BC ＝ 8。M、N は AB、AC の中点。台形 MBCN の周の長さは？', a:'23', choices:['23','30','19','15'],
    exp:E('MN は BC の半分、MB と NC も半分', 'MN ＝ 4、MB ＝ 5、NC ＝ 6、BC ＝ 8 → 23', 'BC は半分にしない', '4つの辺を全部たす') },
  { q:'3本の平行線で AB ＝ 3、BC ＝ x、DE ＝ 4、DF ＝ 12 のとき、x の値は？', svg:lines3(1/3,{ab:'3',bc:'x',de:'4'}), a:'6', choices:['6','9','4','5'],
    exp:E('EF ＝ DF − DE を先に出す', 'EF ＝ 8、3:x ＝ 4:8 → x ＝ 6', 'DF の 12 をそのまま使わない', 'AB:BC ＝ DE:EF') },
  { q:'円錐を、高さを 1:2 に分けるところで底面に平行に切った。上の円錐と下の立体の体積比は？', a:'1:26', choices:['1:26','1:27','1:8','1:2'],
    exp:E('上：全体 の相似比 1:3 → 体積比 1:27', '下は 27 − 1 ＝ 26', '1:2 を3乗して 1:8 にしない', '全体と比べる → 引く') },
  { q:'△ABC ∽ △AED で AB ＝ 9、AE ＝ 6、BC ＝ 15 のとき、ED の長さは？', a:'10', choices:['10','22.5','12','8'],
    exp:E('AB:AE ＝ BC:ED', '9:6 ＝ 15:x → 9x ＝ 90 → x ＝ 10', '逆にすると 22.5', '∽ の順に辺を読む') },
  { q:'相似比 2:3 の2つの三角錐で、大きい方の体積が 54 のとき、小さい方の体積は？', a:'16', choices:['16','36','24','8'],
    exp:E('体積比 8:27', 'x:54 ＝ 8:27 → x ＝ 16', '2乗だと 24', '体積は 3乗') }
];
// 問題の索引（特訓・弱点ノートはここから引く。ページを開いた直後でも使える）
var QBANK = {};
Object.keys(QS).forEach(function(sid) {
  QS[sid].forEach(function(q, i) { q._qid = PREFIX + 's' + sid + '_q' + i; QBANK[q._qid] = q; });
});

// ===== WEAK DB =====
function getPct(qid) {
  var d = weakDB[qid];
  if (!d || d.total === 0) return 0;
  return Math.round(d.correct / d.total * 100);
}
function getWeakQuestions() {
  return Object.keys(weakDB).filter(function(id) { return QBANK[id] && getPct(id) < 80; });
}
function renderWeakBar() {
  var wqs = getWeakQuestions().sort(function(a,b){ return getPct(a) - getPct(b); }).slice(0, 8);
  var el = document.getElementById('weakItems');
  if (!el) return;
  if (wqs.length === 0) { el.innerHTML = '<span class="weak-bar-empty">弱点なし — よくできています！</span>'; return; }
  el.innerHTML = wqs.map(function(qid) {
    return '<div class="weak-item"><span class="weak-item-word">' + QBANK[qid].q + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
  prettyFrac(el);
}
function recordResult(qid, isCorrect) {
  var q = QBANK[qid];
  if (!weakDB[qid]) weakDB[qid] = { jp:q.q, answer:q.a, choices:q.choices, exp:q.exp, correct:0, total:0 };
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  var today = new Date().toISOString().slice(0, 10);
  var daily = JSON.parse(localStorage.getItem('math_daily') || '{}');
  daily[today] = (daily[today] || 0) + 1;
  localStorage.setItem('math_daily', JSON.stringify(daily));
  renderWeakBar();
}

// ===== TOAST / SHUFFLE / COMMENTS =====
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, type === 'levelup' ? 4000 : 2500);
}
function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}
var COMMENTS = {
  correct: ['きょん「やった！天才かも！！」','きょん「にっくんより賢くなったかも！」','きょん「対応、見えてきた！！」','西村「正解。よく覚えてたね」','西村「できてる。その調子」'],
  wrong: ['きょん「あれ！？また間違えた！降格したくない！！」','きょん「えっ違うの！？にっくん助けて！」','西村「惜しい。解説のルールをもう一度見てみよう」']
};
function getComment(type) {
  var arr = COMMENTS[type] || COMMENTS.correct;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== QUESTION ENGINE =====
function makeChoices(qid, choices, answer) {
  choices = shuffleArray(choices);
  if (answeredSet[qid]) {
    return '<div class="choices">' + choices.map(function(c) {
      return '<button class="choice-btn' + (c === answer ? ' show-correct' : '') + '" disabled>' + c + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="choices">' + choices.map(function(c) {
    return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
  }).join('') + '</div>';
}
function makeFeedback(qid, explanation) {
  var shown = answeredSet[qid] ? 'display:block' : 'display:none';
  return '<div class="q-feedback correct-fb" id="fb_' + qid + '" style="' + shown + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb" id="fbw_' + qid + '" style="display:none">✗ 解説を見て、もう一度！</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + shown + '">'
    + '<div class="exp-card-title">📌 解説</div>'
    + '<div style="color:var(--text);line-height:2.0">' + explanation + '</div>'
    + '</div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '">'
    + '<div class="ans-label">✅ 正解</div>'
    + '<div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div>'
    + '</div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + shown + '">' + (answeredSet[qid] ? getComment('correct') : '') + '</div>';
}
function buttonsOf(qid) {
  return [].filter.call(document.querySelectorAll('.choice-btn[data-qid]'), function(b) { return b.dataset.qid === qid; });
}
function showExp(qid) { var e = document.getElementById('exp_' + qid); if (e) e.style.display = 'block'; }
function handleChoice(qid, choice) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  if (choice === meta.answer) markCorrect(qid, meta); else markWrong(qid, meta, choice);
}
function markCorrect(qid, meta) {
  recordResult(qid, true);
  var lvUp = addXP(meta.xp, qid);
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) card.classList.add('correct-card');
  var fb = document.getElementById('fb_' + qid); if (fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display = 'none';
  var sab = document.getElementById('sab_' + qid); if (sab) sab.style.display = 'none';
  showExp(qid);
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = getComment('correct'); ac.style.display = 'block'; }
  buttonsOf(qid).forEach(function(b) {
    b.disabled = true;
    if (b.dataset.choice === meta.answer) b.classList.add('selected-correct');
  });
  if (lvUp) setTimeout(function() { showToast('🎉 昇格！ ' + getLevel(xp).badge + '　きょん「昇格したわ！！」', 'levelup'); }, 400);
  else setTimeout(function() { showToast(getComment('correct')); }, 300);
  checkSectionComplete();
}
function markWrong(qid, meta, choice) {
  recordResult(qid, false);
  attemptCounts[qid] = (attemptCounts[qid] || 0) + 1;
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) { card.classList.add('wrong-card'); setTimeout(function(){ card.classList.remove('wrong-card'); }, 600); }
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display = 'block';
  showExp(qid); // 不正解でも解説はすぐ見せる（共通仕様）
  buttonsOf(qid).forEach(function(b) { if (b.dataset.choice === choice) { b.classList.add('selected-wrong'); b.disabled = true; } });
  if (attemptCounts[qid] >= 2) { var sab = document.getElementById('sab_' + qid); if (sab) sab.style.display = 'inline-block'; }
  var demoted = deductXP(5);
  if (demoted) setTimeout(function() { showToast('💦 降格した…！！　きょん「せっかく昇格したのに…！！」', 'demote'); }, 200);
  else setTimeout(function() { showToast(getComment('wrong')); }, 100);
}
function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  saveAnswered();
  var arAns = document.getElementById('ar_ans_' + qid);
  if (arAns) { arAns.textContent = meta.answer; prettyFrac(arAns); }
  var ar = document.getElementById('ar_' + qid); if (ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if (sab) sab.style.display = 'none';
  buttonsOf(qid).forEach(function(b) {
    b.disabled = true;
    if (b.dataset.choice === meta.answer) b.classList.add('show-correct');
  });
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display = 'none';
  showExp(qid);
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = '西村「答えを見るのも学習のうち。次は自分で解いてみよう」'; ac.style.display = 'block'; }
  checkSectionComplete();
}

// ===== SECTIONS =====
var SECTIONS = [
  { id:0, label:'🔍 スタート',  title:'相似＝拡大コピー',    sub:'形が同じで、大きさがちがう図形' },
  { id:1, label:'相似とは',     title:'相似な図形',              sub:'対応する順番と、相似比' },
  { id:10, label:'対応の見つけ方', title:'対応の見つけ方', sub:'重なった三角形を取り出して、同じ向きに並べる' },
  { id:2, label:'相似条件',     title:'三角形の相似条件',        sub:'3つの条件を見分ける' },
  { id:3, label:'証明',         title:'相似の証明',              sub:'書く順番は4行の型で決まる' },
  { id:11, label:'証明ドリル', title:'証明ドリル', sub:'定期テストの記述に向けて、型どおりに組み立てる' },
  { id:4, label:'平行線と比',   title:'平行線と線分の比',        sub:'ピラミッド型とちょうちょ型' },
  { id:8, label:'中点連結',     title:'中点連結定理・平行線',    sub:'半分で平行・3本の平行線' },
  { id:9, label:'面積・体積',   title:'面積比・体積比と利用',    sub:'面積は2乗、体積は3乗' },
  { id:12, label:'テスト対策', title:'テスト対策', sub:'定期テストで出やすい組み合わせ問題' },
  { id:5, label:'確認テスト',   title:'確認テスト',              sub:'全部まとめて20問。ゆっくりでOK' },
  { id:6, label:'📊弱点',       title:'弱点ノート',              sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',       title:'弱点特訓モード',          sub:'弱点問題だけを集中練習！' }
];
var LEARN = SECTIONS.filter(function(s) { return s.id !== 6 && s.id !== 7; });
function nextOf(id) {
  for (var i = 0; i < LEARN.length - 1; i++) { if (LEARN[i].id === id) return LEARN[i + 1]; }
  return null;
}
function checkSectionComplete() {
  var qs = QS[currentSection];
  if (!qs) return;
  if (!qs.every(function(q) { return answeredSet[q._qid]; })) return;
  sectionDone[currentSection] = true;
  localStorage.setItem('math_soji_sections', JSON.stringify(sectionDone));
  renderTabs();
  var nb = document.getElementById('nextBtn');
  if (nb && nb.style.display === 'none') {
    nb.style.display = 'block';
    if (!document.getElementById('secCompleteBanner')) {
      var nx = nextOf(currentSection);
      var banner = document.createElement('div');
      banner.id = 'secCompleteBanner';
      banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(163,113,247,0.12),rgba(14,165,233,0.08));border:1px solid var(--purple);border-radius:14px">'
        + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
        + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--purple);letter-spacing:2px;margin-bottom:6px">クリア！</div>'
        + '<div style="font-size:15px;color:var(--text2)">きょん「全問解いた！！にっくん、俺やれるじゃん！！」</div>'
        + '<div style="font-size:15px;color:var(--text2);margin-top:4px">西村「よくやった。' + (nx ? '次は「' + nx.label + '」だ」' : '結果を見よう」') + '</div>'
        + '</div>';
      nb.parentNode.insertBefore(banner, nb);
      setTimeout(function(){ banner.scrollIntoView({ behavior:'smooth', block:'center' }); }, 200);
    }
  }
}
function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var special = s.id === 6 || s.id === 7;
    var cls = 'section-tab' + (special ? ' tokku' : '') + (s.id === currentSection ? ' active' : '') + (sectionDone[s.id] && !special ? ' done' : '');
    var label = s.label + (sectionDone[s.id] && !special ? ' ✓' : '');
    if (s.id === 7) { var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '(' + wk.length + ')' : ''); }
    html += '<button class="' + cls + '" data-sid="' + s.id + '">' + label + '</button>';
  });
  document.getElementById('sectionTabs').innerHTML = html;
  document.querySelectorAll('.section-tab[data-sid]').forEach(function(btn) {
    btn.addEventListener('click', function() { goSection(parseInt(btn.dataset.sid)); });
  });
}
function goSection(id) {
  currentSection = id;
  renderTabs();
  renderSection(id);
  window.scrollTo(0, 0);
}
function renderQuestions(id) {
  var qs = QS[id];
  if (!qs) return '';
  var xpPts = id === 5 ? 3 : 5;
  var list = id === 5 ? shuffleArray(qs) : qs;
  var title = id === 5 ? '📝 確認テスト（' + qs.length + '問）' : '✏️ 練習問題';
  var html = '<div class="practice-section"><div class="practice-title">' + title + '</div>';
  list.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:xpPts, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + ' / ' + list.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.svg ? '<div class="ln-qsvg">' + q.svg + '</div>' : '')
      + makeChoices(qid, q.choices, q.a)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  return html + '</div>';
}
function renderSection(id) {
  if (id === 6) { renderWeakNote(); return; }
  if (id === 7) { renderTokkuMode(); return; }
  var s = SECTIONS.filter(function(x) { return x.id === id; })[0];
  var idx = LEARN.indexOf(s);
  var html = '<div class="progress-dots">';
  LEARN.forEach(function(x, i) { html += '<div class="dot' + (i < idx ? ' done' : i === idx ? ' current' : '') + '"></div>'; });
  html += '</div><div class="section-header">'
    + '<div class="section-badge">数学 図形と相似 · SECTION ' + idx + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';
  html += INTRO[id]();
  html += renderQuestions(id);
  if (id !== 0) {
    var nx = nextOf(id);
    html += '<button class="next-section-btn" id="nextBtn" data-goto="' + (nx ? nx.id : 'result') + '" style="display:none">' + (nx ? '次のセクションへ →' : '🏆 結果を見る！') + '</button>';
  }
  var mc = document.getElementById('mainContent');
  mc.innerHTML = html;
  prettyFrac(mc);
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleChoice(btn.dataset.qid, btn.dataset.choice); });
  });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { showAnswer(btn.dataset.qid); });
  });
  var nb = document.getElementById('nextBtn');
  if (nb) nb.addEventListener('click', function() {
    if (nb.dataset.goto === 'result') showFinalResult(); else goSection(parseInt(nb.dataset.goto));
  });
  document.querySelectorAll('.start-btn[data-goto]').forEach(function(btn) {
    btn.addEventListener('click', function() { goSection(parseInt(btn.dataset.goto)); });
  });
  if (sectionDone[id] && nb) nb.style.display = 'block';
  checkSectionComplete();
}

// ===== 説明パーツ =====
var AV = {
  kyon:  { av:'😄', cls:'av-kyon',  style:'', name:'きょん' },
  nishi: { av:'慶', cls:'av-nishi', style:'', name:'西村' },
  shun:  { av:'🎭', cls:'', style:'background:#b69cff;color:#111', name:'なかむらしゅん' },
  kuru:  { av:'🎤', cls:'', style:'background:#ffb347;color:#111', name:'くるま' },
  iwa:   { av:'🐸', cls:'', style:'background:#7ee0c8;color:#111', name:'イワクラ' }
};
function chat(who, text) {
  var a = AV[who];
  return '<div class="chat-line"><div class="avatar ' + a.cls + '"' + (a.style ? ' style="' + a.style + '"' : '') + '>' + a.av + '</div><div><div class="chat-name">' + a.name + '</div><div class="chat-bubble">' + text + '</div></div></div>';
}
function card(title, body) { return '<div class="rule-card"><div class="rule-card-title">' + title + '</div>' + body + '</div>'; }
function talk(lines) { return '<div class="intro-box">' + lines.join('') + '</div>'; }
function table(rows, cls) {
  return '<table class="ln-tbl' + (cls ? ' ' + cls : '') + '">' + rows.map(function(r, i) {
    return '<tr>' + r.map(function(c) { return i === 0 ? '<th>' + c + '</th>' : '<td>' + c + '</td>'; }).join('') + '</tr>';
  }).join('') + '</table>';
}
function step(title, body) { return '<details class="qd-step"><summary>' + title + '</summary><div class="qd-body">' + body + '</div></details>'; }

var INTRO = {};
INTRO[0] = function() {
  return talk([
    chat('kyon', '相似って、合同とどうちがうの？どっちも「同じ」っぽいじゃん'),
    chat('nishi', '合同は「形も大きさも同じ」。相似は「形だけ同じ」だ。コピー機で拡大したものだと思えばいい'),
    chat('iwa', 'きょん、三角形の親子だと思ってみて。親も子も顔の形は同じで、大きさだけちがうの。A のお子さんは、ちゃんと A の席に座らせてあげてね'),
    chat('kyon', 'イワクラちゃん、三角形にそんな家庭の事情があったんだ')
  ])
  + card('🔍 合同と相似のちがい',
    pair({ab:'3',de:'6',bc:'4',ef:'8'},1.5)
    + table([['','<span class="nw">合同 ≡</span>','<span class="nw">相似 ∽</span>'],
      ['形','同じ','同じ'],
      ['大きさ','同じ','ちがってもよい'],
      ['対応する角','等しい','等しい'],
      ['対応する辺','等しい','<b>比が等しい</b>']]))
  + card('📝 テストまで時間がないときの順番',
    '<div class="rule-box"><div class="ex">① 対応の見つけ方</div><div class="ex">② 平行線と比</div><div class="ex">③ 証明ドリル</div><div class="ex">④ テスト対策</div></div>')
  + '<button class="start-btn" data-goto="1">🔍 相似とは から始める →</button>';
};
INTRO[1] = function() {
  return talk([
    chat('nishi', '△ABC ∽ △DEF と書いたら、<b>同じ順番の文字どうしが対応する</b>。A と D、B と E、C と F だ')
  ])
  + card('📐 比例式の解き方',
    '<div class="rule-box"><div class="ex">a:b ＝ c:d のとき、ad ＝ bc</div><div class="ex">x:12 ＝ 3:4 → 4x ＝ 36 → x ＝ 9</div><div class="note">⚠️ 相似は「何倍か」の話。たし算で長さを出さない</div></div>')
  + card('🔍 最初の例題：△ABC ∽ △DEF、AB ＝ 2、DE ＝ 4、BC ＝ 3 のとき EF は？',
    pair({ab:'2',de:'4',bc:'3',ef:'x'},1.6)
    + step('STEP 1　対応する辺を書く（タップ）', 'AB ↔ DE、BC ↔ EF')
    + step('STEP 2　比例式にする（タップ）', '2:4 ＝ 3:x')
    + step('STEP 3　解く（タップ）', '2 × x ＝ 4 × 3 → 2x ＝ 12<div class="qd-big">x ＝ 6</div>確かめ：どちらも 2 倍 ✓'));
};
INTRO[2] = function() {
  return talk([
    chat('shun', 'きょんさん、入試で使うのはほとんど「2組の角」ですわ。ネタ合わせと一緒で、2か所そろったら、もう同じコンビです'),
    chat('kyon', 'しゅん、俺と西村、合ってるのたぶん1か所だけなんだけど')
  ])
  + card('📐 三角形の条件：合同と相似',
    table([['','合同条件','相似条件'],
      ['①','3組の辺が等しい','3組の辺の<b>比</b>がすべて等しい'],
      ['②','2組の辺とその間の角が等しい','2組の辺の<b>比</b>とその間の角が等しい'],
      ['③','1組の辺とその両端の角が等しい','<b>2組の角</b>が等しい']]))
  + card('📐 どうして✕なの？',
    table([['情報','','理由'],
      ['1組の角だけ','<span class="ln-ng">✕</span>','残りの2つの角が決まらない'],
      ['2組の辺の比だけ','<span class="ln-ng">✕</span>','間の角で形が変わる'],
      ['2組の辺の比と、間でない角','<span class="ln-ng">✕</span>','形が2通りできることがある']]));
};
INTRO[3] = function() {
  return talk([
    chat('kyon', '証明って、何を書けばいいか毎回わからないんだよ'),
    chat('nishi', '書く順番は毎回同じだ。4行の型に当てはめるだけでいい'),
    chat('kuru', 'きょんさん、角の理由は3つ覚えるだけっす！「共通」「対頂角」「平行線」！僕の言い訳より全然少ないっす！')
  ])
  + card('🔍 例題：∠ADE ＝ ∠ACB のとき、△ABC ∽ △AED を証明する',
    proofFig()
    + step('1行目　どの三角形か（タップ）', '△ABC と △AED において')
    + step('2行目　根拠その1（タップ）', '仮定より、∠ACB ＝ ∠ADE …①')
    + step('3行目　根拠その2（タップ）', '共通な角だから、∠BAC ＝ ∠EAD …②')
    + step('4行目　条件と結論（タップ）', '①、②より、<b>2組の角がそれぞれ等しい</b>から<div class="qd-big">△ABC ∽ △AED</div>'))
  + card('📐 図の形で、使う根拠が決まる',
    table([['図の形','使う根拠'],
      ['ピラミッド型','共通な角、同位角'],
      ['ちょうちょ型','対頂角、錯角'],
      ['円があるとき','同じ弧に対する円周角']]));
};
INTRO[4] = function() {
  return talk([
    chat('kyon', 'DE の長さを出すのに、AD:DB を使ったら × だった。なんで？'),
    chat('nishi', 'いちばん多いまちがいだ。DB は小さい三角形にも大きい三角形にも入っていない。横の線は、<b>上の三角形と全体の三角形</b>で比べる')
  ])
  + card('📐 ピラミッド型（DE // BC）',
    pyramid(0.4,{ad:'2',db:'3',de:'4',bc:'10'})
    + table([['<span class="nw">比べる線</span>','使う比','例'],
      ['たての線どうし','AD:DB ＝ AE:EC','上：下 もOK'],
      ['横の線','AD:AB ＝ DE:BC','2:5 ＝ 4:10'],
      ['横の線に AD:DB','<span class="ln-ng">✕</span>','2:3 ＝ 4:6 は誤り']])
    + '<div class="rule-box"><div class="rule-title">なぜ✕なの？</div><div class="ex">① 相似なのは △ADE と △ABC</div><div class="ex">② DE:BC は、この2つの三角形の対応する辺の比</div><div class="ex">③ DB はどちらの三角形の辺でもないので、比に使えない</div></div>')
  + card('📐 ちょうちょ型（AB // CD）',
    butterfly(0.5,{oa:'3',od:'6',ob:'4',oc:'8',ab:'5',cd:'10'})
    + '<div class="rule-box"><div class="ex">OA:OD ＝ OB:OC ＝ AB:DC</div><div class="note">💡 対角にある点が対応する。A と D、B と C</div></div>')
  + card('🔍 最初の例題：x はどの比を使う？',
    pyramid(0.4,{ad:'2',db:'3',de:'4',bc:'x'})
    + step('STEP 1　x はどの線？（タップ）', 'BC は<b>横の線</b> → 「上の三角形：全体の三角形」で比べる')
    + step('STEP 2　比を決める（タップ）', 'AD:AB ＝ 2:(2 ＋ 3) ＝ <b>2:5</b>')
    + step('STEP 3　比例式を解く（タップ）', '2:5 ＝ 4:x → 2x ＝ 20<div class="qd-big">x ＝ 10</div>'));
};
INTRO[8] = function() {
  return talk([
    chat('nishi', '中点連結定理は、ピラミッド型の相似比が 1:2 の特別な場合だ。だから<b>平行で、長さは半分</b>になる')
  ])
  + card('📐 中点連結定理',
    midTri({mn:'5',bc:'10'})
    + '<div class="rule-box"><div class="ex">M、N が中点 → MN // BC、MN ＝ 1/2 BC</div></div>')
  + card('📐 3本の平行線',
    lines3(0.4,{ab:'4',bc:'6',de:'6',ef:'9'})
    + '<div class="rule-box"><div class="ex">AB:BC ＝ DE:EF</div><div class="note">💡 平行線ではさまれた部分の比は、どの直線でも同じ</div></div>');
};
INTRO[9] = function() {
  return talk([
    chat('kyon', '面積は2乗、体積は3乗。なんで？'),
    chat('nishi', '面積は「たて × よこ」で長さを2回かける。体積は「たて × よこ × 高さ」で3回かける。だから2乗と3乗だ')
  ])
  + card('📐 相似比 a:b のとき',
    table([['比べるもの','比','<span class="nw">2:3 なら</span>'],
      ['長さ・周','<span class="nw">a:b</span>','2:3'],
      ['面積・表面積','<span class="nw">a²:b²</span>','4:9'],
      ['体積','<span class="nw">a³:b³</span>','8:27']])
    + '<div class="rule-box"><div class="note">⚠️ ピラミッド型は、AD:DB ではなく、<b>AD:AB（上：全体）</b>を相似比にしてから2乗する</div></div>');
};
INTRO[5] = function() {
  return talk([ chat('nishi', 'ここまでの総まとめだ。時間は気にしなくていい。入試の形は <a href="math_c3_geometry.html" style="color:var(--gold)">円周角・相似・三平方（大問3対策）</a>で練習できるよ') ]);
};

INTRO[10] = function() {
  return talk([
    chat('kyon', '三角形が重なってると、どの辺がどの辺かわからなくなるんだよ'),
    chat('nishi', '重なったまま考えないことだ。<b>2つの三角形を取り出して、同じ向きに並べる</b>。見え方が全部変わる'),
    chat('shun', 'きょんさん、舞台で2人が重なってたら、どっちがボケかわからんでしょ？まず並んでもらうんですわ')
  ])
  + card('📐 対応の見つけ方：3ステップ',
    '<div class="rule-box"><div class="ex">① 等しい角に同じ色をつける</div><div class="ex">② 2つの三角形を取り出して、同じ向きに並べる</div><div class="ex">③ 同じ色の順番に頂点を読む → 比を作る</div></div>')
  + card('🔍 ピラミッド型：DE // BC',
    pyramid(0.4,{ad:'2',db:'3',de:'4',bc:'10'})
    + '<div class="qd-big" style="text-align:center">↓ 取り出す</div>'
    + twoTri(['A','D','E'],['2','4',''],['A','B','C'],['5','10',''],1.5)
    + '<div class="rule-box"><div class="ex">△ADE ∽ △ABC</div><div class="note">💡 取り出すと、AB は 2 ＋ 3 ＝ <b>5</b> だとわかる。DB の 3 は三角形の辺ではない</div></div>')
  + card('🔍 ほかの2つの形（タップで開く）',
    step('ちょうちょ型：回して並べる（タップ）',
      butterfly(0.5,{oa:'3',od:'6',ab:'5',cd:'10'})
      + '<div class="qd-big" style="text-align:center">↓ △OAB を半回転</div>'
      + twoTri(['O','B','A'],['','5','3'],['O','C','D'],['','10','6'],1.5)
      + '△OAB ∽ △ODC。A と D、B と C が同じ色になる')
    + step('裏返しの形：裏返して並べる（タップ）',
      proofFig()
      + '<div class="qd-big" style="text-align:center">↓ △AED を裏返す</div>'
      + twoTri(['A','E','D'],['','',''],['A','B','C'],['','',''],1.5)
      + '∠ADE ＝ ∠ACB なので D と C が同じ色。△ABC ∽ △AED'));
};
INTRO[11] = function() {
  return talk([
    chat('nishi', 'テストの記述は、書く順番さえ守れば点がもらえる。下の例を、1行ずつ開きながら見てみよう'),
    chat('iwa', 'きょん、証明はお手紙だと思って。「誰と誰の話か」を最初に書かないと、読む人が困るでしょ'),
    chat('kyon', 'イワクラちゃん、俺の手紙、だいたい宛名から間違ってるわ')
  ])
  + card('🔍 お手本：AB // CD のとき △OAB ∽ △ODC',
    butterfly(0.55,{})
    + step('1行目　誰と誰か（タップ）', '△OAB と △ODC において')
    + step('2行目　根拠その1（タップ）', '対頂角は等しいから、∠AOB ＝ ∠DOC …①')
    + step('3行目　根拠その2（タップ）', 'AB // CD より、錯角は等しいから、∠OAB ＝ ∠ODC …②')
    + step('4行目　条件と結論（タップ）', '①、②より、2組の角がそれぞれ等しいから<div class="qd-big">△OAB ∽ △ODC</div>'))
  + card('📐 書くときの3つのルール',
    table([['ルール','例'],
      ['根拠の名前を書く','対頂角、錯角、共通な角、仮定'],
      ['番号をつける','…①、…②'],
      ['結論は対応の順に書く','△OAB ∽ △ODC']]));
};
INTRO[12] = function() {
  return talk([
    chat('kuru', 'きょんさん、応用問題は「相似を見つける」「上：全体にする」「2乗か3乗する」の順っす！僕の芸歴より順番がはっきりしてるっす！'),
    chat('kyon', 'くるま、お前の芸歴だって順番どおりだよ')
  ])
  + card('📐 長さ・面積を求める順番',
    table([['手順','やること'],
      ['①','相似な三角形を見つける'],
      ['②','比を「上：全体」のように対応でそろえる'],
      ['③','長さはそのまま、面積は2乗、体積は3乗'],
      ['④','聞かれている部分が「残り」なら引く']]));
};

// ===== 確認テストの結果 =====
function showFinalResult() {
  var correct = 0, total = 0;
  QS[5].forEach(function(q) {
    if (answeredSet[q._qid]) { total++; var d = weakDB[q._qid]; if (d && d.correct > 0) correct++; }
  });
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '📺' : '🎤';
  var msg = pct >= 90 ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。相似は君のものだね」'
    : pct >= 70 ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50 ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。弱点ノートから見直そう」'
    : 'きょん「むずっ…でもここから這い上がる！！」<br>西村「「平行線と比」の表にもどって、もう一度やってみよう」';
  var overlay = document.getElementById('resultOverlay');
  overlay.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;box-sizing:border-box">'
    + '<div style="background:var(--bg2);border:2px solid var(--gold);border-radius:20px;padding:30px 22px;max-width:480px;width:100%;text-align:center">'
    + '<div style="font-size:60px;margin-bottom:10px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--gold);letter-spacing:3px;margin-bottom:8px">テスト終了！</div>'
    + '<div style="font-size:56px;color:var(--gold);font-weight:bold;margin:8px 0">' + pct + '<span style="font-size:28px">%</span></div>'
    + '<div style="font-size:16px;color:var(--text2);margin-bottom:4px">' + correct + ' / ' + total + ' 問正解</div>'
    + '<div style="font-size:15px;line-height:2.0;color:var(--text2);margin:16px 0;padding:16px;background:var(--bg3);border-radius:12px">' + msg + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px">'
    + '<button id="res_weak_btn" style="background:var(--red);color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を見る</button>'
    + '<button id="res_retry_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">🔄 テストをやり直す</button>'
    + '</div></div></div>';
  overlay.style.display = 'block';
  document.getElementById('res_weak_btn').addEventListener('click', function(){ closeResult(); goSection(6); });
  document.getElementById('res_retry_btn').addEventListener('click', function(){
    QS[5].forEach(function(q) { delete answeredSet[q._qid]; });
    saveAnswered();
    delete sectionDone[5];
    localStorage.setItem('math_soji_sections', JSON.stringify(sectionDone));
    closeResult();
    goSection(5);
  });
}
function closeResult() { document.getElementById('resultOverlay').style.display = 'none'; }

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 6;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var allQids = Object.keys(weakDB).filter(function(id){ return QBANK[id]; });
  var wqs = getWeakQuestions();
  if (allQids.length === 0) {
    mc.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">📊</div><div style="font-size:18px;margin-bottom:8px">まだデータがありません</div><div style="font-size:15px">問題を解くと自動で記録されます</div></div>';
    return;
  }
  function box(n, label, color) {
    return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:' + color + '">' + n + '</div><div style="font-size:13px;color:var(--text2)">' + label + '</div></div>';
  }
  var html = '<div style="margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap">' + box(allQids.length, '記録済み問題', 'var(--gold)') + box(wqs.length, '要特訓（80%未満）', 'var(--red)') + box(allQids.length - wqs.length, '習得済み', 'var(--green)') + '</div>';
  allQids.slice().sort(function(a,b){ return getPct(a) - getPct(b); }).forEach(function(qid) {
    var d = weakDB[qid], pct = getPct(qid);
    var barColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
    html += '<div style="background:var(--bg2);border:1px solid ' + barColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(163,113,247,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:180px"><div style="font-size:15px;color:var(--text);line-height:1.8">' + QBANK[qid].q + '</div><div style="font-size:15px;color:' + barColor + '">' + QBANK[qid].a + '</div></div>'
      + '<div style="text-align:right;flex-shrink:0;font-size:13px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div>'
      + '</div>';
  });
  if (wqs.length > 0) html += '<button id="go_tokku_btn" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  mc.innerHTML = html;
  prettyFrac(mc);
  var gtb = document.getElementById('go_tokku_btn');
  if (gtb) gtb.addEventListener('click', function() { goSection(7); });
}

// ===== 特訓モード（図も解説も QBANK から出す） =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };
function renderTokkuMode() {
  currentSection = 7;
  renderTabs();
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');
  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div class="tokku-complete-msg">きょん「俺、無敵になったわ！！」<br>西村「本当に成長したね」</div></div>';
    return;
  }
  tokkuQueue = shuffleArray(wqs).slice(0, 15);
  tokkuIndex = 0;
  tokkuSession = { correct:0, total:0 };
  renderTokkuCard();
}
function renderTokkuCard() {
  var mc = document.getElementById('mainContent');
  if (tokkuIndex >= tokkuQueue.length) { showTokkuComplete(); return; }
  var qid = tokkuQueue[tokkuIndex], q = QBANK[qid], pct = getPct(qid);
  var color = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex + 1) + ' / ' + tokkuQueue.length + '　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span style="color:' + color + '">' + pct + '%</span>（' + weakDB[qid].correct + '/' + weakDB[qid].total + '回正解）</div>'
    + '<div class="tokku-jp">' + q.q + '</div>'
    + (q.svg ? '<div class="ln-qsvg">' + q.svg + '</div>' : '')
    + '<div class="tokku-choices">' + shuffleArray(q.choices).map(function(c) { return '<button class="choice-btn" data-tchoice="' + c + '">' + c + '</button>'; }).join('') + '</div>'
    + '<div class="tokku-result" id="tokku_result" style="display:none"></div>'
    + '<div class="exp-card" id="tokku_exp" style="display:none;text-align:left"><div class="exp-card-title">📌 解説</div><div style="color:var(--text);line-height:2.0">' + q.exp + '</div></div>'
    + '<button id="tokku_next" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題 →</button>'
    + '</div>';
  prettyFrac(mc);
  document.querySelectorAll('.choice-btn[data-tchoice]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleTokkuChoice(qid, btn.dataset.tchoice); });
  });
  document.getElementById('tokku_next').addEventListener('click', function() { tokkuIndex++; renderTokkuCard(); });
}
function handleTokkuChoice(qid, choice) {
  var q = QBANK[qid], ok = choice === q.a;
  document.querySelectorAll('.choice-btn[data-tchoice]').forEach(function(b) {
    b.disabled = true;
    if (b.dataset.tchoice === choice) b.classList.add(ok ? 'selected-correct' : 'selected-wrong');
    if (!ok && b.dataset.tchoice === q.a) b.classList.add('show-correct');
  });
  tokkuSession.total++;
  weakDB[qid].total++;
  if (ok) { weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();
  var newPct = getPct(qid), res = document.getElementById('tokku_result');
  if (ok) {
    xp += 1; localStorage.setItem('math_xp', xp); updateXP();
    res.className = 'tokku-result tokku-correct';
    res.textContent = '✅ 正解！' + (newPct >= 80 ? ' 🎉 この問題は卒業！' : ' 正答率 → ' + newPct + '%');
    showToast(getComment('correct'));
  } else {
    deductXP(3);
    res.className = 'tokku-result tokku-wrong';
    res.innerHTML = '❌ 惜しい！　正答率 → ' + newPct + '%<div class="tokku-answer">正解: ' + q.a + '</div>';
    prettyFrac(res);
    showToast('きょん「また間違えた！！でも諦めない！！」');
  }
  res.style.display = 'block';
  document.getElementById('tokku_exp').style.display = 'block';
  document.getElementById('tokku_next').style.display = 'block';
}
function showTokkuComplete() {
  var mc = document.getElementById('mainContent');
  var pctAll = tokkuSession.total > 0 ? Math.round(tokkuSession.correct / tokkuSession.total * 100) : 0;
  mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">' + (pctAll >= 80 ? '🏆' : pctAll >= 60 ? '😎' : '💪') + '</div>'
    + '<div class="tokku-complete-title">特訓終了！</div>'
    + '<div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div>'
    + '<div class="tokku-complete-msg">' + (pctAll >= 80 ? 'きょん「全部わかった！！」<br>西村「よくやった」' : 'きょん「難しかった…でも諦めない！！」<br>西村「繰り返すことが力になる」') + '</div>'
    + '<button id="tokku_retry_btn" style="margin-top:24px;background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回！</button>'
    + '</div>';
  renderWeakBar();
  document.getElementById('tokku_retry_btn').addEventListener('click', function() { renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
goSection(0);
