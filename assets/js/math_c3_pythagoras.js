// 数学 中3「三平方の定理」単独ページ（2026-11-08 新規）
// qid: math_sanp_s{セクションid}_q{番号}。問題は末尾に足す（途中に入れると記録がずれる）
// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「三平方？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺斜辺が見えてきたかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「三平方で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' }
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var PREFIX = 'math_sanp_';
var xp           = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('math_sanp_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_sanp_sections') || '{}');
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
function saveAnswered() { localStorage.setItem('math_sanp_answered', JSON.stringify(answeredSet)); }
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
      .replace(/(\d*√\d+|\d+)\/(\d+|[a-z])/g, '<span class="ln-frac"><span>$1</span><span>$2</span></span>');
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
function svgBox(w, h, body, maxw) {
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;max-width:' + (maxw || 320) + 'px;display:block;margin:8px auto;background:#0f1520;border-radius:10px">' + body + '</svg>';
}
function mid(p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; }
function unit(o, p) { var x = p[0] - o[0], y = p[1] - o[1], l = Math.sqrt(x * x + y * y) || 1; return [x / l, y / l]; }
function dot(p, color) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="' + (color || WH) + '"/>'; }
function lab(p, t, anchor) { return t ? txt(p[0], p[1], t, t === 'x' ? YE : WH, anchor) : ''; }
// 直角のしるし
function sq(V, to1, to2, n) {
  var u = unit(V, to1), v = unit(V, to2); n = n || 11;
  return '<path d="M' + (V[0] + u[0] * n) + ' ' + (V[1] + u[1] * n) + ' L' + (V[0] + (u[0] + v[0]) * n) + ' ' + (V[1] + (u[1] + v[1]) * n) + ' L' + (V[0] + v[0] * n) + ' ' + (V[1] + v[1] * n) + '" fill="none" stroke="' + YE + '" stroke-width="2"/>';
}
// 角のしるしと数字
function angMark(o, p, q, label, r) {
  r = r || 20;
  var u = unit(o, p), v = unit(o, q);
  var a1 = Math.atan2(u[1], u[0]), a2 = Math.atan2(v[1], v[0]);
  var d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  var x1 = o[0] + r * u[0], y1 = o[1] + r * u[1], x2 = o[0] + r * v[0], y2 = o[1] + r * v[1];
  var bx = u[0] + v[0], by = u[1] + v[1], bl = Math.sqrt(bx * bx + by * by) || 1;
  return '<path d="M' + x1 + ' ' + y1 + ' A' + r + ' ' + r + ' 0 0 ' + (d > 0 ? 1 : 0) + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="' + BL + '" stroke-width="2.4"/>' + txt(o[0] + bx / bl * (r + 17), o[1] + by / bl * (r + 17) + 5, label, BL, 'middle', 13);
}
// 直角三角形：a、b は直角をはさむ2辺の実際の長さ、rot は回転（度）
// L＝[a の字, b の字, 斜辺の字]、opt.n＝[直角の点, a の端の点, b の端の点]、opt.hi＝斜辺を金色に、opt.ang＝{a:'30°',b:'60°'}
function rtn(a, b, rot, L, opt) {
  L = L || []; opt = opt || {};
  var th = (rot || 0) * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
  function ro(p) { return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  var R0 = ro([0, 0]), A0 = ro([a, 0]), B0 = ro([0, -b]);
  var xs = [R0[0], A0[0], B0[0]], ys = [R0[1], A0[1], B0[1]];
  var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
  var sc = Math.min(200 / (maxx - minx), 150 / (maxy - miny));
  var W = 290, H = 208, ox = (W - (maxx - minx) * sc) / 2 - minx * sc, oy = (H - (maxy - miny) * sc) / 2 - miny * sc;
  function M(p) { return [ox + p[0] * sc, oy + p[1] * sc]; }
  var P = M(R0), Q = M(A0), T = M(B0), G = [(P[0] + Q[0] + T[0]) / 3, (P[1] + Q[1] + T[1]) / 3];
  function outer(m, d) { var u = unit(G, m); return [m[0] + u[0] * (d || 16), m[1] + u[1] * (d || 16) + 5]; }
  var r = seg(P, Q) + seg(P, T) + seg(Q, T, opt.hi ? YE : WH, opt.hi ? 3.4 : 2.2) + sq(P, Q, T);
  if (opt.ang) { if (opt.ang.a) r += angMark(Q, P, T, opt.ang.a); if (opt.ang.b) r += angMark(T, P, Q, opt.ang.b); }
  r += lab(outer(mid(P, Q)), L[0]) + lab(outer(mid(P, T)), L[1]) + lab(outer(mid(Q, T)), L[2]);
  if (opt.n) r += txt.apply(null, outer(P, 15).concat([opt.n[0], GR])) + txt.apply(null, outer(Q, 15).concat([opt.n[1], GR])) + txt.apply(null, outer(T, 15).concat([opt.n[2], GR]));
  return svgBox(W, H, r);
}
// 二等辺三角形と高さ
function iso(base, leg, L) {
  L = L || {};
  var h = Math.sqrt(leg * leg - base * base / 4), sc = Math.min(200 / base, 150 / h);
  var B = [145 - base * sc / 2, 180], C = [145 + base * sc / 2, 180], A = [145, 180 - h * sc], H = [145, 180];
  var s = seg(A, B) + seg(A, C) + seg(B, C) + seg(A, H, OR, 2.6, true) + sq(H, A, C);
  s += txt(A[0], A[1] - 8, 'A', GR) + txt(B[0] - 11, B[1] + 8, 'B', GR) + txt(C[0] + 11, C[1] + 8, 'C', GR) + txt(H[0], H[1] + 20, 'H', OR);
  s += lab([(A[0] + B[0]) / 2 - 12, (A[1] + B[1]) / 2], L.leg, 'end') + lab([(A[0] + C[0]) / 2 + 12, (A[1] + C[1]) / 2], L.leg, 'start') + lab([145 + 40, 200], L.base) + lab([145 + 12, (A[1] + H[1]) / 2 + 5], L.h, 'start');
  return svgBox(290, 210, s);
}
// 長方形と対角線
function rectDiag(w, h, L) {
  L = L || {};
  var sc = Math.min(200 / w, 130 / h), W = w * sc, Hh = h * sc, x0 = 145 - W / 2, y0 = 100 - Hh / 2;
  var A = [x0, y0], B = [x0, y0 + Hh], C = [x0 + W, y0 + Hh], D = [x0 + W, y0];
  var s = seg(A, B) + seg(B, C) + seg(C, D) + seg(D, A) + seg(A, C, YE, 3.2) + sq(B, A, C);
  s += txt(A[0] - 11, A[1] - 3, 'A', GR) + txt(B[0] - 11, B[1] + 9, 'B', GR) + txt(C[0] + 11, C[1] + 9, 'C', GR) + txt(D[0] + 11, D[1] - 3, 'D', GR);
  s += lab([B[0] - 12, (A[1] + B[1]) / 2 + 5], L.h, 'end') + lab([(B[0] + C[0]) / 2, C[1] + 20], L.w) + lab([(A[0] + C[0]) / 2 + 14, (A[1] + C[1]) / 2 - 8], L.d);
  return svgBox(290, 200, s);
}
// 座標：A(ax,ay)、B(bx,by)
function coord(ax, ay, bx, by) {
  var xmin = -3, xmax = 5, ymin = -2, ymax = 7, sc = 25, L = 26, T = 18;
  function X(x) { return L + (x - xmin) * sc; } function Y(y) { return T + (ymax - y) * sc; }
  var s = '', v;
  for (v = xmin; v <= xmax; v++) s += '<line x1="' + X(v) + '" y1="' + Y(ymin) + '" x2="' + X(v) + '" y2="' + Y(ymax) + '" stroke="rgba(120,160,255,0.25)"/>';
  for (v = ymin; v <= ymax; v++) s += '<line x1="' + X(xmin) + '" y1="' + Y(v) + '" x2="' + X(xmax) + '" y2="' + Y(v) + '" stroke="rgba(120,160,255,0.25)"/>';
  s += seg([X(xmin), Y(0)], [X(xmax), Y(0)], WH, 1.8) + seg([X(0), Y(ymin)], [X(0), Y(ymax)], WH, 1.8);
  for (v = xmin + 1; v < xmax; v++) if (v) s += '<text x="' + X(v) + '" y="' + (Y(0) + 15) + '" text-anchor="middle" fill="#b6c0cc" font-size="12" paint-order="stroke" stroke="#0f1520" stroke-width="3">' + (v < 0 ? '−' + (-v) : v) + '</text>';
  for (v = ymin + 1; v < ymax; v++) if (v) s += '<text x="' + (X(0) - 5) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="#b6c0cc" font-size="12" paint-order="stroke" stroke="#0f1520" stroke-width="3">' + (v < 0 ? '−' + (-v) : v) + '</text>';
  var A = [X(ax), Y(ay)], B = [X(bx), Y(by)], C = [X(bx), Y(ay)];
  s += seg(A, C, YE, 2.6, true) + seg(C, B, GR, 2.6, true) + seg(A, B, OR, 3) + sq(C, A, B, 9) + dot(A, OR) + dot(B, OR);
  s += txt(A[0] - 11, A[1] - 7, 'A', OR) + txt(B[0] - 11, B[1] - 6, 'B', OR);
  return svgBox(L + (xmax - xmin) * sc + 22, T + (ymax - ymin) * sc + 26, s);
}
// 円と弦：r＝半径、d＝中心から弦までの距離
function chord(r, d, L) {
  L = L || {};
  var R = 86, cx = 145, cy = 104, y = cy + R * d / r, hw = Math.sqrt(R * R - (y - cy) * (y - cy));
  var O = [cx, cy], H = [cx, y], A = [cx - hw, y], B = [cx + hw, y];
  var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#8b949e" stroke-width="2"/>' + seg(A, B, BL, 2.8) + seg(O, H, OR, 2.6, true) + seg(O, B) + sq(H, O, B);
  s += dot(O, YE) + txt(cx - 14, cy + 4, 'O', YE) + dot(A) + txt(A[0] - 11, A[1] + 12, 'A', GR) + dot(B) + txt(B[0] + 11, B[1] + 12, 'B', GR) + txt(H[0] - 12, H[1] + 20, 'H', OR);
  s += lab([(O[0] + B[0]) / 2 + 12, (O[1] + B[1]) / 2 - 6], L.r) + lab([cx + 12, (cy + y) / 2 + 5], L.d, 'start') + lab([cx + hw / 2, y + 20], L.hb);
  return svgBox(290, 212, s);
}
// 円の接線：r＝半径、op＝OP
function tan1(r, op, L) {
  L = L || {};
  var R = 62, cx = 88, cy = 110, a = Math.acos(r / op), d = R * op / r;
  var O = [cx, cy], P = [cx + d, cy], A = [cx + R * Math.cos(a), cy - R * Math.sin(a)];
  var W = Math.max(290, cx + d + 34);
  var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#8b949e" stroke-width="2"/>' + seg(O, A) + seg(O, P, YE, 3) + seg(A, P, BL, 2.8) + sq(A, O, P);
  s += dot(O, YE) + txt(cx - 14, cy + 5, 'O', YE) + dot(A) + txt(A[0], A[1] - 11, 'A', GR) + dot(P) + txt(P[0] + 12, P[1] + 5, 'P', GR);
  s += lab([(O[0] + A[0]) / 2 - 12, (O[1] + A[1]) / 2], L.r, 'end') + lab([(O[0] + P[0]) / 2, cy + 20], L.op) + lab([(A[0] + P[0]) / 2 + 10, (A[1] + P[1]) / 2 - 8], L.pa);
  return svgBox(W, 190, s);
}
// 直方体（A の真下が E、対角線 AG）
function cuboid(L) {
  L = L || {};
  var E = [34, 176], F = [186, 176], G = [246, 122], H_ = [94, 122], A = [34, 74], B = [186, 74], C = [246, 20], D = [94, 20];
  var s = seg(H_, E, WH, 1.6, true) + seg(H_, G, WH, 1.6, true) + seg(H_, D, WH, 1.6, true);
  s += seg(A, B) + seg(B, C) + seg(C, D) + seg(D, A) + seg(E, F) + seg(F, G) + seg(A, E) + seg(B, F) + seg(C, G);
  s += seg(E, G, GR, 2.6, true) + seg(A, G, YE, 3.2) + sq(E, A, G, 10);
  s += txt(A[0] - 11, A[1] - 2, 'A', YE) + txt(E[0] - 11, E[1] + 8, 'E', GR) + txt(G[0] + 12, G[1] + 8, 'G', YE) + txt(F[0], F[1] + 19, 'F', GR);
  s += lab([(E[0] + F[0]) / 2 - 10, E[1] + 20], L.a) + lab([(F[0] + G[0]) / 2 + 14, (F[1] + G[1]) / 2 + 8], L.b) + lab([E[0] - 11, (A[1] + E[1]) / 2 + 5], L.c, 'end');
  return svgBox(290, 206, s);
}
// 円錐
function cone(L) {
  L = L || {};
  var A = [145, 22], O = [145, 166], B = [230, 166];
  var s = '<ellipse cx="145" cy="166" rx="85" ry="20" fill="none" stroke="#e6edf3" stroke-width="2.2"/>' + seg(A, [60, 166]) + seg(A, B, YE, 3.2) + seg(A, O, OR, 2.6, true) + seg(O, B, GR, 2.6, true) + sq(O, A, B, 10) + dot(O, WH);
  s += lab([190, 88], L.l, 'start') + lab([136, 96], L.h, 'end') + lab([188, 182], L.r);
  return svgBox(290, 200, s);
}
// 正四角錐
function pyr(L) {
  L = L || {};
  var O = [145, 18], A = [46, 178], B = [190, 178], C = [246, 128], D = [102, 128], H_ = [146, 153];
  var s = seg(O, D, WH, 1.6, true) + seg(A, D, WH, 1.6, true) + seg(D, C, WH, 1.6, true) + seg(O, A) + seg(O, B) + seg(O, C, YE, 3) + seg(A, B) + seg(B, C);
  s += seg(O, H_, OR, 2.6, true) + seg(H_, C, GR, 2.6, true) + sq(H_, O, C, 9) + dot(H_, OR);
  s += txt(O[0], O[1] - 3, 'O', GR) + txt(H_[0] - 13, H_[1] + 5, 'H', OR) + txt(A[0] - 10, A[1] + 7, 'A', GR) + txt(B[0], B[1] + 18, 'B', GR) + txt(C[0] + 11, C[1] + 6, 'C', GR);
  s += lab([(A[0] + B[0]) / 2, 197], L.base) + lab([(O[0] + C[0]) / 2 + 15, (O[1] + C[1]) / 2], L.edge, 'start') + lab([O[0] + 10, (O[1] + H_[1]) / 2 + 5], L.h, 'start');
  return svgBox(290, 206, s);
}
// 直方体の展開：2面をひらいて最短距離
function netFig(a, b, c, L) {
  L = L || {};
  var sc = Math.min(210 / (a + b), 130 / c), W = (a + b) * sc, Hh = c * sc, x0 = 145 - W / 2, y0 = 26;
  var P = [x0, y0 + Hh], Q = [x0 + W, y0];
  var s = '<rect x="' + x0 + '" y="' + y0 + '" width="' + W + '" height="' + Hh + '" fill="none" stroke="#e6edf3" stroke-width="2.2"/>' + seg([x0 + a * sc, y0], [x0 + a * sc, y0 + Hh], WH, 1.8, true) + seg(P, Q, YE, 3.2);
  s += txt(P[0] - 11, P[1] + 8, 'P', YE) + txt(Q[0] + 11, Q[1] + 2, 'Q', YE);
  s += lab([x0 + a * sc / 2, y0 + Hh + 20], L.a) + lab([x0 + a * sc + b * sc / 2, y0 + Hh + 20], L.b) + lab([x0 - 11, y0 + Hh / 2 + 5], L.c, 'end');
  return svgBox(290, y0 + Hh + 38, s);
}
// 定理の証明の図：1辺 a＋b の正方形の中に、1辺 c の正方形
function proofSq(a, b) {
  var sc = 170 / (a + b), x0 = 60, y0 = 18, S = (a + b) * sc;
  var p1 = [x0 + a * sc, y0], p2 = [x0 + S, y0 + a * sc], p3 = [x0 + b * sc, y0 + S], p4 = [x0, y0 + b * sc];
  var s = '<rect x="' + x0 + '" y="' + y0 + '" width="' + S + '" height="' + S + '" fill="rgba(74,168,255,0.16)" stroke="#e6edf3" stroke-width="2.2"/>';
  s += '<polygon points="' + p1 + ' ' + p2 + ' ' + p3 + ' ' + p4 + '" fill="#0f1520" stroke="' + YE + '" stroke-width="3"/>';
  s += txt(x0 + a * sc / 2, y0 - 4, 'a', WH, 'middle', 14) + txt(x0 + a * sc + b * sc / 2, y0 - 4, 'b', WH, 'middle', 14);
  s += txt(x0 + S / 2, y0 + S / 2 + 5, 'c の正方形', YE, 'middle', 14);
  s += txt((p1[0] + p2[0]) / 2 + 9, (p1[1] + p2[1]) / 2 + 16, 'c', YE, 'middle', 14);
  return svgBox(290, 206, s);
}

// ===== 問題データ =====
var QS = {};
// ---- Section 10：斜辺はどれ？ ----
QS[10] = [
  { q:'図の直角三角形で、斜辺はどれ？', svg:rtn(4,3,0,[],{n:['C','A','B']}), a:'AB', choices:['AB','BC','CA','どれでもない'],
    exp:E('斜辺 ＝ 直角の向かい側の辺', '直角は C なので、C の向かいの AB', '「下にある辺」ではない', '直角の点と反対側') },
  { q:'図の直角三角形で、斜辺はどれ？', svg:rtn(4,3,120,[],{n:['A','B','C']}), a:'BC', choices:['BC','AB','CA','どれでもない'],
    exp:E('向きが変わっても同じ', '直角は A → 向かいの BC', '傾いていても見つけ方は同じ', '直角の印を先にさがす') },
  { q:'図の直角三角形で、斜辺はどれ？', svg:rtn(5,3,215,[],{n:['B','C','A']}), a:'CA', choices:['CA','AB','BC','どれでもない'],
    exp:E('直角の向かい側', '直角は B → 向かいの CA', '長く見える辺を当てずっぽうで選ばない', 'B をふくまない辺') },
  { q:'斜辺の説明として正しいものは？', a:'直角の向かい側の辺', choices:['直角の向かい側の辺','いちばん短い辺','直角をはさむ辺','底辺のこと'],
    exp:E('斜辺 ＝ 直角の向かい側', 'いちばん長い辺でもある', '底辺とは関係ない', '直角の点をふくまない辺') },
  { q:'直角三角形の3つの辺のうち、いちばん長いのは？', a:'斜辺', choices:['斜辺','直角をはさむ辺','底辺','長さは決まらない'],
    exp:E('斜辺がいちばん長い', '計算の答えの確かめに使える', '斜辺より長い答えが出たら計算ミス', '答えの見直しに使う') },
  { q:'図の直角三角形で、正しい式は？', svg:rtn(12,5,0,['12','5','x'],{hi:true}), a:'5² ＋ 12² ＝ x²', choices:['5² ＋ 12² ＝ x²','5² ＋ x² ＝ 12²','x² ＋ 12² ＝ 5²','5 ＋ 12 ＝ x'],
    exp:E('斜辺だけが ＝ の右', '金色の x が斜辺', '2乗を忘れない', '斜辺は右にひとりだけ') },
  { q:'図の直角三角形で、正しい式は？', svg:rtn(12,5,0,['x','5','13'],{hi:true}), a:'5² ＋ x² ＝ 13²', choices:['5² ＋ x² ＝ 13²','5² ＋ 13² ＝ x²','x² ＝ 5 × 13','5 ＋ x ＝ 13'],
    exp:E('斜辺は 13 なので右', 'x は直角をはさむ辺', '13 を左に置かない', '何が斜辺かを先に決める') },
  { q:'図の直角三角形で、正しい式は？', svg:rtn(8,6,140,['8','x','10'],{hi:true}), a:'x² ＋ 8² ＝ 10²', choices:['x² ＋ 8² ＝ 10²','x² ＋ 10² ＝ 8²','8² ＋ 10² ＝ x²','x ＋ 8 ＝ 10'],
    exp:E('傾いていても斜辺は右', '金色の 10 が斜辺', '数の位置で決めない', '直角の向かいはどれ？') },
  { q:'求める辺が斜辺ではないとき、計算のしかたは？', a:'斜辺の2乗から、もう1つの辺の2乗をひく', choices:['斜辺の2乗から、もう1つの辺の2乗をひく','2つの辺の2乗をたす','2つの辺をそのままひく','2つの辺をかける'],
    exp:E('斜辺を求める → たす、それ以外 → ひく', 'x² ＝ 13² − 5²', 'たしてしまうと斜辺より長くなる', 'x は斜辺より短いはず') }
];
// ---- Section 1：定理を使う ----
QS[1] = [
  { q:'x の値は？', svg:rtn(4,3,0,['4','3','x'],{hi:true}), a:'5', choices:['5','7','25','√7'],
    exp:E('x² ＝ 3² ＋ 4²', '9 ＋ 16 ＝ 25 → x ＝ 5', '3 ＋ 4 ＝ 7 にしない', '最後に √ をとる') },
  { q:'x の値は？', svg:rtn(12,5,0,['12','5','x'],{hi:true}), a:'13', choices:['13','17','7','169'],
    exp:E('x² ＝ 5² ＋ 12²', '25 ＋ 144 ＝ 169 → x ＝ 13', '169 で止めない', '√ をとるのを忘れない') },
  { q:'x の値は？', svg:rtn(8,6,0,['8','6','x'],{hi:true}), a:'10', choices:['10','14','100','2√7'],
    exp:E('x² ＝ 6² ＋ 8²', '36 ＋ 64 ＝ 100 → x ＝ 10', 'たし算で 14 にしない', '3:4:5 の 2 倍') },
  { q:'x の値は？', svg:rtn(2,1,0,['2','1','x'],{hi:true}), a:'√5', choices:['√5','3','5','√3'],
    exp:E('x² ＝ 1² ＋ 2²', '1 ＋ 4 ＝ 5 → x ＝ √5', '√ がついたままでよい', 'きれいな数にならないこともある') },
  { q:'x の値は？', svg:rtn(3,2,0,['3','2','x'],{hi:true}), a:'√13', choices:['√13','5','13','√5'],
    exp:E('x² ＝ 2² ＋ 3²', '4 ＋ 9 ＝ 13', '5 にしない', '2乗してからたす') },
  { q:'x の値は？', svg:rtn(4,2,0,['4','2','x'],{hi:true}), a:'2√5', choices:['2√5','6','4√5','√12'],
    exp:E('√ の中を簡単にする', 'x² ＝ 20 → √20 ＝ 2√5', '√12 は引き算のまちがい', '√ の中の 2乗をくくり出す') },
  { q:'x の値は？', svg:rtn(12,5,0,['x','5','13'],{hi:true}), a:'12', choices:['12','8','√194','18'],
    exp:E('斜辺以外は ひく', 'x² ＝ 13² − 5² ＝ 144', 'たすと √194 で斜辺より長くなる', 'x は 13 より短いはず') },
  { q:'x の値は？', svg:rtn(4,3,0,['4','x','5'],{hi:true}), a:'3', choices:['3','1','√41','9'],
    exp:E('斜辺以外は ひく', 'x² ＝ 25 − 16 ＝ 9', '5 − 4 ＝ 1 にしない', '2乗してからひく') },
  { q:'x の値は？', svg:rtn(2,Math.sqrt(5),0,['2','x','3'],{hi:true}), a:'√5', choices:['√5','1','√13','5'],
    exp:E('斜辺以外は ひく', 'x² ＝ 9 − 4 ＝ 5', '√13 はたしてしまったときの数', '斜辺は 3') },
  { q:'x の値は？', svg:rtn(2,2*Math.sqrt(3),0,['2','x','4'],{hi:true}), a:'2√3', choices:['2√3','2','2√5','4√3'],
    exp:E('√ の中を簡単にする', 'x² ＝ 16 − 4 ＝ 12 → 2√3', '4 − 2 ＝ 2 にしない', '12 ＝ 4 × 3') },
  { q:'x の値は？', svg:rtn(Math.sqrt(3),Math.sqrt(2),0,['√3','√2','x'],{hi:true}), a:'√5', choices:['√5','√6','5','√2 ＋ √3'],
    exp:E('√ を2乗すると √ がとれる', 'x² ＝ 2 ＋ 3 ＝ 5', '√2 ＋ √3 のままにしない', '(√3)² ＝ 3') },
  { q:'x の値は？', svg:rtn(3,3,0,['3','3','x'],{hi:true}), a:'3√2', choices:['3√2','6','18','9'],
    exp:E('x² ＝ 3² ＋ 3²', '18 → 3√2', '18 で止めない', '18 ＝ 9 × 2') }
];
// ---- Section 2：定理の逆 ----
QS[2] = [
  { q:'直角三角形になる3辺は？', a:'3, 4, 5', choices:['3, 4, 5','2, 3, 4','4, 5, 6','1, 2, 3'],
    exp:E('いちばん長い辺を c にして確かめる', '9 ＋ 16 ＝ 25', '短い2辺の2乗の和と比べる', '小 ＋ 中 ＝ 大（2乗で）') },
  { q:'直角三角形になる3辺は？', a:'5, 12, 13', choices:['5, 12, 13','5, 10, 13','6, 12, 13','5, 12, 15'],
    exp:E('2乗の和を比べる', '25 ＋ 144 ＝ 169', '近い数でも等しくなければ✕', 'よく出る組は覚える') },
  { q:'直角三角形になる3辺は？', a:'8, 15, 17', choices:['8, 15, 17','7, 15, 17','8, 14, 17','8, 15, 18'],
    exp:E('2乗の和を比べる', '64 ＋ 225 ＝ 289', '計算を省略しない', '17² ＝ 289') },
  { q:'直角三角形になる3辺は？', a:'1, 1, √2', choices:['1, 1, √2','1, 1, 2','1, 2, 2','√2, √2, √2'],
    exp:E('√ は 2乗すると √ がとれる', '1 ＋ 1 ＝ 2', '1, 1, 2 は三角形にもならない', '45° の直角三角形') },
  { q:'直角三角形になる3辺は？', a:'1, √3, 2', choices:['1, √3, 2','1, √2, 2','1, 2, 3','√3, 2, 3'],
    exp:E('いちばん長い 2 を c に', '1 ＋ 3 ＝ 4', '√3 を最大と思わない（√3 は約 1.7）', '30°・60° の直角三角形') },
  { q:'直角三角形になる3辺は？', a:'√2, √3, √5', choices:['√2, √3, √5','√2, √3, √6','1, √3, √5','2, √3, √5'],
    exp:E('√ の中の数で比べる', '2 ＋ 3 ＝ 5', '√2 × √3 ＝ √6 と混ぜない', '2乗すると中の数') },
  { q:'3辺が 2, √5, 3 の三角形で、式の右辺（c）にする辺は？', a:'3', choices:['3','√5','2','どれでもよい'],
    exp:E('c はいちばん長い辺', '√5 は約 2.2 なので 3 が最大', '式の順番で決めない', '√ は 2乗して比べる') },
  { q:'AB ＝ 6、BC ＝ 8、CA ＝ 10 の三角形で、直角はどこ？', a:'∠B', choices:['∠B','∠A','∠C','直角はない'],
    exp:E('最長の辺の向かいの角が直角', 'CA が最長 → 向かいは B', '∠C ではない', '斜辺の向かいが直角') },
  { q:'【発展】3辺が x, x ＋ 1, x ＋ 2 の直角三角形で、x の値は？', a:'3', choices:['3','4','5','1'],
    exp:E('いちばん長い x ＋ 2 を c に', 'x² ＋ (x ＋ 1)² ＝ (x ＋ 2)² → x² − 2x − 3 ＝ 0 → x ＝ 3', 'x ＝ −1 は長さなので✕', '長さは正の数') }
];
// ---- Section 3：特別な直角三角形 ----
var A45 = {a:'45°',b:'45°'}, A30 = {a:'30°',b:'60°'};
QS[3] = [
  { q:'45°, 45°, 90° の直角三角形の辺の比（短：短：斜辺）は？', a:'1 : 1 : √2', choices:['1 : 1 : √2','1 : √2 : 2','1 : 2 : √3','1 : √3 : 2'],
    exp:E('直角二等辺三角形', '1 : 1 : √2', '30°・60° の比と混ぜない', '同じ長さが2つ') },
  { q:'30°, 60°, 90° の直角三角形の辺の比（短い辺：長い辺：斜辺）は？', a:'1 : √3 : 2', choices:['1 : √3 : 2','1 : 2 : √3','√3 : 1 : 2','1 : 1 : √2'],
    exp:E('斜辺がいちばん長いので 2', '1 : √3 : 2', '√3 が最後ではない（√3 は約 1.7）', '小さい順に 1, √3, 2') },
  { q:'x の値は？', svg:rtn(1,1,0,['3','3','x'],{ang:A45,hi:true}), a:'3√2', choices:['3√2','6','3','9'],
    exp:E('1 : 1 : √2 の 3 倍', '斜辺 ＝ 3 × √2', '3 ＋ 3 にしない', '短い辺 × √2') },
  { q:'x の値は？', svg:rtn(1,1,0,['5','','x'],{ang:A45,hi:true}), a:'5√2', choices:['5√2','10','5','√10'],
    exp:E('短い辺 × √2', '5 × √2', '2 倍にしない', '45° なら × √2') },
  { q:'x の値は？', svg:rtn(1,1,0,['x','','8'],{ang:A45,hi:true}), a:'4√2', choices:['4√2','8√2','4','2√2'],
    exp:E('斜辺 ÷ √2', '8 ÷ √2 ＝ 8√2/2 ＝ 4√2', '× √2 にしない（短くなるはず）', '分母の √ をなくす') },
  { q:'x の値は？', svg:rtn(1,1,0,['x','','6'],{ang:A45,hi:true}), a:'3√2', choices:['3√2','6√2','3','2√3'],
    exp:E('斜辺 ÷ √2', '6 ÷ √2 ＝ 3√2', '半分の 3 にしない', '斜辺より短いか確かめる') },
  { q:'x の値は？', svg:rtn(Math.sqrt(3),1,0,['','2','x'],{ang:A30,hi:true}), a:'4', choices:['4','2√3','√3','6'],
    exp:E('1 : √3 : 2 の 2 倍', '斜辺 ＝ 2 × 2 ＝ 4', '30° の向かいが短い辺', '斜辺は短い辺の 2 倍') },
  { q:'x の値は？', svg:rtn(Math.sqrt(3),1,0,['x','2',''],{ang:A30}), a:'2√3', choices:['2√3','4','√3','2√2'],
    exp:E('長い辺 ＝ 短い辺 × √3', '2 × √3', '× 2 にしない', '60° の向かいが長い辺') },
  { q:'x の値は？', svg:rtn(Math.sqrt(3),1,0,['','x','10'],{ang:A30,hi:true}), a:'5', choices:['5','5√3','10√3','20'],
    exp:E('短い辺 ＝ 斜辺 の半分', '10 ÷ 2 ＝ 5', '× √3 にしない', '斜辺の半分') },
  { q:'x の値は？', svg:rtn(Math.sqrt(3),1,0,['x','','10'],{ang:A30,hi:true}), a:'5√3', choices:['5√3','5','10√3','20'],
    exp:E('短い辺 5 を先に出す → × √3', '5 × √3', '5 で止めない', 'まず短い辺') },
  { q:'x の値は？', svg:rtn(Math.sqrt(3),1,0,['6','x',''],{ang:A30}), a:'2√3', choices:['2√3','6√3','3','2'],
    exp:E('長い辺 ÷ √3 ＝ 短い辺', '6 ÷ √3 ＝ 6√3/3 ＝ 2√3', '× √3 にしない', '短い辺は長い辺より小さい') },
  { q:'傾いた図でも同じ。x の値は？', svg:rtn(Math.sqrt(3),1,115,['','x','8'],{ang:A30,hi:true}), a:'4', choices:['4','4√3','8√3','16'],
    exp:E('30° の向かいが短い辺', '8 ÷ 2 ＝ 4', '図の向きに引っぱられない', '角と向かいの辺で判断') }
];
// ---- Section 4：平面図形 ----
QS[4] = [
  { q:'1辺が 5cm の正方形の対角線の長さは？', a:'5√2 cm', choices:['5√2 cm','10 cm','5 cm','25 cm'],
    exp:E('直角二等辺三角形', '5 × √2', '2 倍にしない', '1 : 1 : √2') },
  { q:'図の長方形で、対角線 AC の長さは？', svg:rectDiag(4,3,{w:'4',h:'3',d:'x'}), a:'5', choices:['5','7','12','√7'],
    exp:E('△ABC は直角三角形', '3² ＋ 4² ＝ 25', 'たし算で 7 にしない', '対角線は斜辺') },
  { q:'たて 2cm、横 6cm の長方形の対角線の長さは？', a:'2√10 cm', choices:['2√10 cm','8 cm','4√2 cm','√32 cm'],
    exp:E('2乗をたす', '4 ＋ 36 ＝ 40 → 2√10', '√32 はひき算のまちがい', '40 ＝ 4 × 10') },
  { q:'図の二等辺三角形で、高さ AH は？', svg:iso(6,5,{leg:'5',base:'6',h:'x'}), a:'4', choices:['4','√34','√11','3'],
    exp:E('高さは底辺を2等分する', 'BH ＝ 3、x² ＝ 25 − 9 ＝ 16', '底辺の 6 のまま使わない', '半分の 3 を使う') },
  { q:'前の問題の三角形の面積は？', a:'12', choices:['12','24','15','20'],
    exp:E('底辺 × 高さ ÷ 2', '6 × 4 ÷ 2 ＝ 12', '÷ 2 を忘れない', '高さを出してから面積') },
  { q:'底辺 4、等しい辺 6 の二等辺三角形の高さは？', svg:iso(4,6,{leg:'6',base:'4',h:'x'}), a:'4√2', choices:['4√2','2√10','4','√52'],
    exp:E('底辺の半分 2 を使う', 'x² ＝ 36 − 4 ＝ 32', '4² をひくと 2√5', '32 ＝ 16 × 2') },
  { q:'1辺が 6 の正三角形の高さは？', svg:iso(6,6,{leg:'6',base:'6',h:'x'}), a:'3√3', choices:['3√3','6√3','3','3√2'],
    exp:E('1 : √3 : 2 の形', '半分の 3 × √3', '6√3 にしない', '斜辺 6 の半分が 3') },
  { q:'1辺が 6 の正三角形の面積は？', a:'9√3', choices:['9√3','18√3','18','6√3'],
    exp:E('底辺 × 高さ ÷ 2', '6 × 3√3 ÷ 2 ＝ 9√3', '÷ 2 を忘れない', '高さを先に') },
  { q:'1辺が 4 の正三角形の面積は？', a:'4√3', choices:['4√3','8√3','16','2√3'],
    exp:E('高さ 2√3', '4 × 2√3 ÷ 2 ＝ 4√3', '÷ 2 を忘れない', '半分の 2 × √3') },
  { q:'2点 A(1, 2)、B(4, 6) の距離は？', svg:coord(1,2,4,6), a:'5', choices:['5','7','25','√7'],
    exp:E('横の差と たての差で直角三角形', '横 3、たて 4 → 5', 'そのままたさない', '差を 2乗してたす') },
  { q:'2点 A(−1, 1)、B(2, 3) の距離は？', svg:coord(-1,1,2,3), a:'√13', choices:['√13','5','√5','13'],
    exp:E('マイナスの座標は引き算に注意', '横 2 − (−1) ＝ 3、たて 2 → √13', '横を 1 にしない', '図で何マスか数える') },
  { q:'2点 A(−2, −1)、B(2, 2) の距離は？', svg:coord(-2,-1,2,2), a:'5', choices:['5','7','√7','√5'],
    exp:E('横の差と たての差', '横 4、たて 3 → 5', '符号でまちがえない', '数直線で距離を見る') },
  { q:'図で半径 5、中心から弦までの距離 3 のとき、弦 AB の長さは？', svg:chord(5,3,{r:'5',d:'3'}), a:'8', choices:['8','4','√34','2√34'],
    exp:E('OH は弦を 2 等分する', 'BH ＝ √(25 − 9) ＝ 4 → AB ＝ 8', '4 で止めない', '最後に 2 倍') },
  { q:'半径 6、弦の長さ 8 のとき、中心から弦までの距離は？', svg:chord(6,2*Math.sqrt(5),{r:'6',hb:'4',d:'x'}), a:'2√5', choices:['2√5','2','2√13','√28'],
    exp:E('弦の半分 4 を使う', 'x² ＝ 36 − 16 ＝ 20', '8 のまま使わない', '半分にする') },
  { q:'図で PA は接線。半径 3、OP ＝ 5 のとき、PA の長さは？', svg:tan1(3,5,{r:'3',op:'5',pa:'x'}), a:'4', choices:['4','2','√34','8'],
    exp:E('接線 ⊥ 半径 → OP が斜辺', 'x² ＝ 25 − 9 ＝ 16', 'OP を直角をはさむ辺にしない', '円の性質とのセット') },
  { q:'半径 2、OP ＝ 6 のとき、接線 PA の長さは？', svg:tan1(2,6,{r:'2',op:'6',pa:'x'}), a:'4√2', choices:['4√2','2√10','4','√40'],
    exp:E('OP が斜辺', 'x² ＝ 36 − 4 ＝ 32', 'たさない', '32 ＝ 16 × 2') }
];
// ---- Section 8：空間図形 ----
QS[8] = [
  { q:'たて 3、横 4、高さ 5 の直方体の対角線 AG の長さは？', svg:cuboid({a:'4',b:'3',c:'5'}), a:'5√2', choices:['5√2','12','√41','50'],
    exp:E('√(たて² ＋ 横² ＋ 高さ²)', '9 ＋ 16 ＋ 25 ＝ 50 → 5√2', '50 で止めない', '3つの2乗をたす') },
  { q:'1辺が 2 の立方体の対角線の長さは？', a:'2√3', choices:['2√3','2√2','6','12'],
    exp:E('√(2² ＋ 2² ＋ 2²)', '12 → 2√3', '2√2 は面の対角線', '立方体は √3 倍') },
  { q:'たて 3、横 4 の底面の対角線 EG の長さは？', svg:cuboid({a:'4',b:'3'}), a:'5', choices:['5','7','12','√7'],
    exp:E('底面の直角三角形', '3² ＋ 4² ＝ 25', '緑の線', 'まず底面') },
  { q:'たて 2、横 3、高さ 6 の直方体の対角線の長さは？', svg:cuboid({a:'3',b:'2',c:'6'}), a:'7', choices:['7','11','49','√13'],
    exp:E('√(たて² ＋ 横² ＋ 高さ²)', '4 ＋ 9 ＋ 36 ＝ 49', '49 で止めない', '3つの2乗') },
  { q:'底面の半径 3、母線 5 の円錐の高さは？', svg:cone({r:'3',l:'5',h:'x'}), a:'4', choices:['4','√34','2','8'],
    exp:E('高さ・半径・母線で直角三角形', '母線が斜辺：25 − 9 ＝ 16', '半径 3 を直径にしない', '母線は斜辺') },
  { q:'前の問題の円錐の体積は？', a:'12π', choices:['12π','36π','4π','15π'],
    exp:E('1/3 × 底面積 × 高さ', '1/3 × 9π × 4 ＝ 12π', '1/3 を忘れない', '底面積は πr²') },
  { q:'底面の半径 6、高さ 8 の円錐の母線の長さは？', svg:cone({r:'6',h:'8',l:'x'}), a:'10', choices:['10','14','2√7','100'],
    exp:E('母線が斜辺', '36 ＋ 64 ＝ 100', 'ひかない', 'x は斜辺') },
  { q:'底面の1辺 4、辺 OC ＝ 6 の正四角錐の高さ OH は？', svg:pyr({base:'4',edge:'6',h:'x'}), a:'2√7', choices:['2√7','4√2','2√5','6'],
    exp:E('底面の対角線の半分 HC を使う', 'AC ＝ 4√2、HC ＝ 2√2、x² ＝ 36 − 8 ＝ 28', 'HC を 2 にしない', 'H は対角線の交点') },
  { q:'前の問題の正四角錐の体積は？', a:'32√7/3', choices:['32√7/3','32√7','16√7','8√7'],
    exp:E('1/3 × 底面積 × 高さ', '1/3 × 16 × 2√7', '1/3 を忘れない', '底面積は 4 × 4') },
  { q:'図のように直方体の2面をひらいた。糸を P から Q まで張るときの最短の長さは？', svg:netFig(2,4,8,{a:'2',b:'4',c:'8'}), a:'10', choices:['10','14','2√17','√68'],
    exp:E('展開図で直線にする', '横 2 ＋ 4 ＝ 6、高さ 8 → 10', '立体のまま考えない', '最短 ＝ 展開図の直線') },
  { q:'底面の周の長さが 5cm、高さ 12cm の円柱の側面に、1周ぐるりと糸をかけるときの最短の長さは？', a:'13 cm', choices:['13 cm','17 cm','√119 cm','10 cm'],
    exp:E('側面は長方形にひらける', '横 5、たて 12 → 13', '半径ではなく周の長さを使う', '円柱の側面は長方形') },
  { q:'半径 5 の球を、中心から 3 の距離の平面で切った。切り口の円の半径は？', a:'4', choices:['4','2','√34','8'],
    exp:E('球の半径が斜辺', '25 − 9 ＝ 16', '球の半径を直角をはさむ辺にしない', '断面で考える') }
];
// ---- Section 12：テスト対策 ----
QS[12] = [
  { q:'AD // BC の等脚台形で、AD ＝ 4、BC ＝ 10、AB ＝ DC ＝ 5。この台形の面積は？', a:'28', choices:['28','56','35','24'],
    exp:E('高さをおろして両はしの直角三角形', 'はみ出し (10 − 4) ÷ 2 ＝ 3、高さ 4、(4 ＋ 10) × 4 ÷ 2', '÷ 2 を2回忘れない', '台形は高さが命') },
  { q:'長方形 ABCD（AB ＝ 6、BC ＝ 10）を、D が BC 上の点 E に重なるように A を通る線で折る。BE の長さは？', a:'8', choices:['8','6','2√34','4'],
    exp:E('折っても長さは同じ：AE ＝ AD ＝ 10', 'BE² ＝ 100 − 36 ＝ 64', 'AE は AD と等しい', '折り返しは同じ長さをさがす') },
  { q:'前の問題で、折り目が DC と交わる点を F とする。DF の長さは？', a:'10/3', choices:['10/3','3','8/3','4'],
    exp:E('DF ＝ EF ＝ x で方程式', 'EC ＝ 2、FC ＝ 6 − x → x² ＝ (6 − x)² ＋ 4 → x ＝ 10/3', 'x² が消えることを確かめる', '1次方程式になる') },
  { q:'△ABC で AB ＝ 8、∠B ＝ 60°、BC ＝ 10。AC の長さは？', a:'2√21', choices:['2√21','2√41','6','√164'],
    exp:E('A から BC に垂線をおろす', 'BH ＝ 4、AH ＝ 4√3、HC ＝ 6 → AC² ＝ 48 ＋ 36 ＝ 84', '60° を見たら 1 : √3 : 2', '特別な三角形を作る') },
  { q:'△ABC で AB ＝ 6√2、∠B ＝ 45°、BC ＝ 8。AC の長さは？', a:'2√10', choices:['2√10','2√34','6','10'],
    exp:E('A から BC に垂線をおろす', 'BH ＝ AH ＝ 6、HC ＝ 2 → AC² ＝ 36 ＋ 4 ＝ 40', 'HC ＝ 8 − 6', '45° なら直角二等辺') },
  { q:'3辺が 13、14、15 の △ABC で、BC ＝ 14 を底辺とする高さは？（AB ＝ 13、AC ＝ 15）', a:'12', choices:['12','84','14','13'],
    exp:E('BH ＝ x で AH² を2通りに表す', '169 − x² ＝ 225 − (14 − x)² → x ＝ 5、AH ＝ 12', '84 は面積', '同じ高さで方程式') },
  { q:'3辺が 3, x, x ＋ 1 の直角三角形で、斜辺が x ＋ 1 のとき、x の値は？', a:'4', choices:['4','3','5','8'],
    exp:E('9 ＋ x² ＝ (x ＋ 1)²', '9 ＝ 2x ＋ 1 → x ＝ 4', 'x² が消える', '右辺を展開する') },
  { q:'AB が直径の円で、AB ＝ 10、AC ＝ 6（C は円周上）のとき、BC の長さは？', a:'8', choices:['8','4','2√34','16'],
    exp:E('直径の円周角は 90°', 'BC² ＝ 100 − 36 ＝ 64', 'AB が斜辺', '円の性質と組み合わせ') },
  { q:'∠A ＝ 90° の △ABC で AB ＝ 3、AC ＝ 4、AH は BC への垂線。AH の長さは？', a:'12/5', choices:['12/5','5/2','2','5'],
    exp:E('面積を2通りに表す', 'BC ＝ 5、3 × 4 ÷ 2 ＝ 5 × AH ÷ 2', '相似で解いても同じ', '面積で高さを出す') },
  { q:'3点 A(1, 1)、B(4, 1)、C(4, 5) を結ぶ三角形の周の長さは？', a:'12', choices:['12','7','10','6'],
    exp:E('横・たて・斜めの3本', '3 ＋ 4 ＋ 5', '斜辺を忘れない', '∠B が直角') },
  { q:'1辺が 4 の正六角形の面積は？', a:'24√3', choices:['24√3','12√3','96','16√3'],
    exp:E('正三角形 6 個に分ける', '1個 4√3 × 6', '1個分で止めない', '正六角形 ＝ 正三角形 6 個') }
];
// ---- Section 5：確認テスト ----
QS[5] = [
  { q:'図の直角三角形で、斜辺はどれ？', svg:rtn(4,3,70,[],{n:['B','C','A']}), a:'CA', choices:['CA','AB','BC','どれでもない'],
    exp:E('直角の向かい側', '直角は B', '見た目で選ばない', 'B をふくまない辺') },
  { q:'x の値は？', svg:rtn(3,1,0,['3','1','x'],{hi:true}), a:'√10', choices:['√10','4','10','2√2'],
    exp:E('x² ＝ 1 ＋ 9', '√10', 'たし算で 4 にしない', '2乗してたす') },
  { q:'x の値は？', svg:rtn(15,8,0,['15','8','x'],{hi:true}), a:'17', choices:['17','23','7','289'],
    exp:E('x² ＝ 64 ＋ 225', '289 → 17', '289 で止めない', '√ をとる') },
  { q:'x の値は？', svg:rtn(4,Math.sqrt(33),0,['4','x','7'],{hi:true}), a:'√33', choices:['√33','3','√65','11'],
    exp:E('斜辺以外は ひく', '49 − 16 ＝ 33', 'たさない', '斜辺は 7') },
  { q:'x の値は？', svg:rtn(4,4,0,['4','4','x'],{hi:true}), a:'4√2', choices:['4√2','8','32','16'],
    exp:E('x² ＝ 32', '4√2', '32 で止めない', '32 ＝ 16 × 2') },
  { q:'直角三角形になる3辺は？', a:'6, 8, 10', choices:['6, 8, 10','6, 8, 12','5, 8, 10','6, 9, 10'],
    exp:E('2乗の和を比べる', '36 ＋ 64 ＝ 100', '近い数で決めない', '3:4:5 の 2 倍') },
  { q:'直角三角形になる3辺は？', a:'2, 2, 2√2', choices:['2, 2, 2√2','2, 2, 4','2, 3, 4','2, √2, 2√2'],
    exp:E('√ は 2乗してから', '4 ＋ 4 ＝ 8 ＝ (2√2)²', '2, 2, 4 は三角形にならない', '1 : 1 : √2 の 2 倍') },
  { q:'30°, 60°, 90° の直角三角形の辺の比は？', a:'1 : √3 : 2', choices:['1 : √3 : 2','1 : 2 : √3','1 : 1 : √2','√3 : 1 : 2'],
    exp:E('斜辺が 2', '小さい順に 1, √3, 2', '√3 は最大ではない', '√3 は約 1.7') },
  { q:'x の値は？', svg:rtn(1,1,0,['6','','x'],{ang:A45,hi:true}), a:'6√2', choices:['6√2','12','6','3√2'],
    exp:E('短い辺 × √2', '6√2', '2 倍にしない', '45° → × √2') },
  { q:'x の値は？', svg:rtn(1,1,0,['x','','10'],{ang:A45,hi:true}), a:'5√2', choices:['5√2','10√2','5','2√5'],
    exp:E('斜辺 ÷ √2', '10 ÷ √2 ＝ 5√2', '× √2 にしない', '短くなるはず') },
  { q:'x の値は？', svg:rtn(Math.sqrt(3),1,0,['x','','8'],{ang:A30,hi:true}), a:'4√3', choices:['4√3','4','8√3','16'],
    exp:E('短い辺 4 → × √3', '4√3', '4 で止めない', 'まず短い辺') },
  { q:'1辺が 8 の正三角形の高さは？', svg:iso(8,8,{leg:'8',base:'8',h:'x'}), a:'4√3', choices:['4√3','8√3','4','4√2'],
    exp:E('1 : √3 : 2', '4 × √3', '半分の 4 × √3', '30°・60° の形') },
  { q:'底辺 8、等しい辺 5 の二等辺三角形の高さは？', svg:iso(8,5,{leg:'5',base:'8',h:'x'}), a:'3', choices:['3','√89','√41','4'],
    exp:E('底辺の半分 4 を使う', '25 − 16 ＝ 9', '8 のまま使わない', '半分') },
  { q:'2点 A(−1, −1)、B(2, 3) の距離は？', svg:coord(-1,-1,2,3), a:'5', choices:['5','7','√5','√17'],
    exp:E('横 3、たて 4', '5', '符号に注意', '図で数える') },
  { q:'半径 13、中心から弦までの距離 5 のとき、弦の長さは？', svg:chord(13,5,{r:'13',d:'5'}), a:'24', choices:['24','12','2√194','18'],
    exp:E('弦の半分 12 → 2 倍', '√(169 − 25) ＝ 12', '12 で止めない', '最後に 2 倍') },
  { q:'半径 5、OP ＝ 13 のとき、接線 PA の長さは？', svg:tan1(5,13,{r:'5',op:'13',pa:'x'}), a:'12', choices:['12','8','√194','18'],
    exp:E('OP が斜辺', '169 − 25 ＝ 144', 'たさない', '接線 ⊥ 半径') },
  { q:'1辺が 3 の立方体の対角線の長さは？', a:'3√3', choices:['3√3','3√2','9','27'],
    exp:E('√(3² ＋ 3² ＋ 3²)', '27 → 3√3', '3√2 は面の対角線', '立方体は √3 倍') },
  { q:'底面の半径 5、母線 13 の円錐の高さは？', svg:cone({r:'5',l:'13',h:'x'}), a:'12', choices:['12','8','√194','18'],
    exp:E('母線が斜辺', '169 − 25 ＝ 144', 'たさない', '母線は斜辺') },
  { q:'底面の半径 3、高さ 4 の円錐の体積は？', a:'12π', choices:['12π','36π','48π','4π'],
    exp:E('1/3 × 底面積 × 高さ', '1/3 × 9π × 4', '1/3 を忘れない', 'πr²') },
  { q:'図のように2面をひらいた。P から Q の最短の長さは？', svg:netFig(3,1,3,{a:'3',b:'1',c:'3'}), a:'5', choices:['5','7','√10','√34'],
    exp:E('横 3 ＋ 1 ＝ 4、たて 3', '4 と 3 → 5', '展開図で直線に', '最短 ＝ 直線') }
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
  var today = new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
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
  correct: ['きょん「やった！天才かも！！」','きょん「にっくんより賢くなったかも！」','きょん「斜辺、見つけた！！」','西村「正解。よく覚えてたね」','西村「できてる。その調子」'],
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
  { id:0,  label:'📏 スタート',  title:'三平方は式ひとつ',       sub:'a² ＋ b² ＝ c²。c は斜辺' },
  { id:10, label:'斜辺はどれ？', title:'斜辺はどれ？',           sub:'三平方は、まずここから' },
  { id:1,  label:'定理を使う',   title:'三平方の定理',           sub:'斜辺を求める → たす、それ以外 → ひく' },
  { id:2,  label:'定理の逆',     title:'定理の逆',               sub:'3辺から直角三角形か見分ける' },
  { id:3,  label:'特別な三角形', title:'特別な直角三角形',       sub:'1 : 1 : √2 と 1 : √3 : 2' },
  { id:4,  label:'平面図形',     title:'平面図形への利用',       sub:'高さ・対角線・座標・円' },
  { id:8,  label:'空間図形',     title:'空間図形への利用',       sub:'立体の中の直角三角形を取り出す' },
  { id:12, label:'テスト対策',   title:'テスト対策',             sub:'定期テストと入試で出やすい組み合わせ' },
  { id:5,  label:'確認テスト',   title:'確認テスト',             sub:'全部まとめて20問。ゆっくりでOK' },
  { id:6,  label:'📊弱点',       title:'弱点ノート',             sub:'間違えた問題の正答率を確認しよう' },
  { id:7,  label:'🔥特訓',       title:'弱点特訓モード',         sub:'弱点問題だけを集中練習！' }
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
  localStorage.setItem('math_sanp_sections', JSON.stringify(sectionDone));
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
    + '<div class="section-badge">数学 三平方の定理 · SECTION ' + idx + '</div>'
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
    chat('kyon', '三平方の定理って名前だけで強そうなんだけど'),
    chat('nishi', '式はひとつだけだ。<b>直角三角形なら a² ＋ b² ＝ c²</b>。c は斜辺、つまり直角の向かい側の辺だ'),
    chat('shun', 'きょんさん、斜辺はセンターマイクの向かいに立ってるツッコミみたいなもんですわ。ひとりだけ ＝ の右に立ってはるんです'),
    chat('kyon', 'しゅん、そのたとえ、いちばん難しいよ')
  ])
  + card('📏 三平方の定理',
    rtn(4,3,0,['a','b','c'],{hi:true})
    + '<div class="qd-big" style="text-align:center">a² ＋ b² ＝ c²</div>'
    + table([['求める辺','計算'],['斜辺','2乗を<b>たす</b>：c² ＝ a² ＋ b²'],['それ以外','2乗を<b>ひく</b>：a² ＝ c² − b²']]))
  + '<button class="start-btn" data-goto="10">📏 斜辺はどれ？ から始める →</button>';
};
INTRO[10] = function() {
  return talk([
    chat('kyon', '図が傾いてると、どこが斜辺かわからなくなる'),
    chat('nishi', '見た目で探さないことだ。<b>先に直角の印を探す</b>。その向かい側が斜辺になる'),
    chat('iwa', 'きょん、直角さんの真正面に座ってるのが斜辺だよ。席替えしても真正面は変わらないでしょ'),
    chat('kyon', 'イワクラちゃん、俺の真正面、だいたい西村なんだけど')
  ])
  + card('📐 式を作るまでの3ステップ',
    '<div class="rule-box"><div class="ex">① 直角の印を見つける</div><div class="ex">② その向かい側の辺が斜辺</div><div class="ex">③ 斜辺だけを ＝ の右に書く</div></div>')
  + card('🔍 向きが変わっても、金色が斜辺',
    rtn(4,3,0,['','',''],{hi:true}) + rtn(4,3,120,['','',''],{hi:true}));
};
INTRO[1] = function() {
  return talk([
    chat('nishi', '計算の順番は毎回同じだ。<b>式を書く → 2乗を計算 → √ をとる → √ の中を簡単にする</b>')
  ])
  + card('🔍 最初の例題：斜辺を求める',
    rtn(4,3,0,['4','3','x'],{hi:true})
    + step('STEP 1　式を書く（タップ）', '斜辺が x なので<div class="qd-big">3² ＋ 4² ＝ x²</div>')
    + step('STEP 2　2乗を計算する（タップ）', '9 ＋ 16 ＝ 25 → x² ＝ 25')
    + step('STEP 3　√ をとる（タップ）', 'x は長さなのでプラスだけ<div class="qd-big">x ＝ 5</div>'))
  + card('🔍 次の例題：斜辺以外を求める',
    rtn(12,5,0,['x','5','13'],{hi:true})
    + step('STEP 1　式を書く（タップ）', '斜辺は 13<div class="qd-big">5² ＋ x² ＝ 13²</div>')
    + step('STEP 2　x² だけにする（タップ）', 'x² ＝ 169 − 25 ＝ 144')
    + step('STEP 3　√ をとる（タップ）', '<div class="qd-big">x ＝ 12</div>斜辺の 13 より短いので OK'))
  + card('📐 なぜ成り立つの？（読まなくてOK）',
    step('面積で確かめる（タップ）', proofSq(2,3) + '大きい正方形の1辺は a ＋ b<br>大きい正方形 ＝ 真ん中の正方形 ＋ 直角三角形 4 個<br>(a ＋ b)² ＝ c² ＋ 4 × ab/2<br>a² ＋ 2ab ＋ b² ＝ c² ＋ 2ab<br><b>a² ＋ b² ＝ c²</b>'));
};
INTRO[2] = function() {
  return talk([
    chat('kyon', '逆って、何をするの？'),
    chat('nishi', '3辺の長さだけで、直角三角形かどうかを判定する。<b>いちばん長い辺を c</b> にして式が成り立つか調べるんだ')
  ])
  + card('📐 判定の手順',
    '<div class="rule-box"><div class="ex">① いちばん長い辺を見つける（√ は 2乗して比べる）</div><div class="ex">② 残り2つの2乗をたす</div><div class="ex">③ いちばん長い辺の2乗と等しければ直角三角形</div></div>'
    + table([['よく出る組','確かめ'],['3, 4, 5','9 ＋ 16 ＝ 25'],['5, 12, 13','25 ＋ 144 ＝ 169'],['8, 15, 17','64 ＋ 225 ＝ 289']]));
};
INTRO[3] = function() {
  return talk([
    chat('kuru', 'きょんさん、45° と 30° を見たら計算しなくていいっす！比を当てはめるだけっす！僕、計算しないの大好きっす！'),
    chat('kyon', 'くるま、それは計算したくないだけだろ')
  ])
  + card('📐 比はこの2つだけ',
    rtn(1,1,0,['1','1','√2'],{ang:A45,hi:true})
    + rtn(Math.sqrt(3),1,0,['√3','1','2'],{ang:A30,hi:true})
    + table([['三角形','短い → 長い'],['45°, 45°, 90°','1 : 1 : √2'],['30°, 60°, 90°','1 : √3 : 2']])
    + '<div class="rule-box"><div class="note">⚠️ 30° の向かいがいちばん短い。斜辺はいちばん長いので、√3 ではなく <b>2</b></div></div>')
  + card('🔍 最初の例題：斜辺が 10 の 30°, 60°, 90°',
    rtn(Math.sqrt(3),1,0,['y','x','10'],{ang:A30,hi:true})
    + step('STEP 1　短い辺（タップ）', '斜辺 ÷ 2<div class="qd-big">x ＝ 5</div>')
    + step('STEP 2　長い辺（タップ）', '短い辺 × √3<div class="qd-big">y ＝ 5√3</div>'));
};
INTRO[4] = function() {
  return talk([
    chat('nishi', 'コツはひとつ。<b>図の中に直角三角形を作る</b>。高さをおろす、半径を引く、横とたての差をとる')
  ])
  + card('📐 直角三角形の作り方',
    table([['図','やること'],
      ['二等辺・正三角形','頂点から高さをおろす（底辺は半分）'],
      ['長方形・正方形','対角線を斜辺にする'],
      ['座標の2点','横の差と たての差'],
      ['円の弦','中心から垂線（弦は半分）'],
      ['円の接線','接点に半径を引く（OP が斜辺）']]))
  + card('🔍 最初の例題：二等辺三角形の高さ',
    iso(6,5,{leg:'5',base:'6',h:'x'})
    + step('STEP 1　底辺を半分にする（タップ）', '高さは底辺を2等分するので BH ＝ <b>3</b>')
    + step('STEP 2　直角三角形で式にする（タップ）', '△ABH で、斜辺は 5<div class="qd-big">x² ＋ 3² ＝ 5²</div>')
    + step('STEP 3　解く（タップ）', 'x² ＝ 16<div class="qd-big">x ＝ 4</div>'));
};
INTRO[8] = function() {
  return talk([
    chat('kyon', '立体になると、もう見えない'),
    chat('nishi', '立体のまま考えないことだ。<b>中にある直角三角形を1枚取り出す</b>。あとは平面と同じだ')
  ])
  + card('📐 取り出す直角三角形',
    table([['立体','直角三角形','斜辺'],
      ['直方体','AE、EG、AG','対角線 AG'],
      ['円錐','高さ、半径、母線','母線'],
      ['正四角錐','高さ、HC、OC','辺 OC'],
      ['最短距離','展開図で作る','糸の線']]))
  + card('🔍 最初の例題：直方体の対角線',
    cuboid({a:'4',b:'3',c:'5'})
    + step('STEP 1　底面の対角線（タップ）', '緑の EG：3² ＋ 4² ＝ 25 → EG² ＝ 25')
    + step('STEP 2　立てた三角形（タップ）', '△AEG は E が直角<div class="qd-big">AG² ＝ 25 ＋ 5² ＝ 50</div>')
    + step('STEP 3　√ をとる（タップ）', '<div class="qd-big">AG ＝ 5√2</div>公式：√(たて² ＋ 横² ＋ 高さ²)'));
};
INTRO[12] = function() {
  return talk([
    chat('shun', 'きょんさん、難しい問題ほど「直角三角形を作って、わからん長さを x にする」だけですわ。ネタ帳の最初の1行を書くようなもんです'),
    chat('kyon', 'しゅん、その1行が出ないんだよ')
  ])
  + card('📐 解く順番',
    table([['手順','やること'],
      ['①','直角三角形を作る（垂線・半径・対角線）'],
      ['②','45° や 60° があれば比を使う'],
      ['③','長さが2つわからないときは x で方程式'],
      ['④','聞かれている面積や体積まで計算する']]));
};
INTRO[5] = function() {
  return talk([ chat('nishi', 'ここまでの総まとめだ。時間は気にしなくていい。入試の形は <a href="math_c3_geometry.html" style="color:var(--gold)">円周角・相似・三平方（大問3対策）</a>で練習できるよ') ]);
};

// ===== 確認テストの結果 =====
function showFinalResult() {
  var correct = 0, total = 0;
  QS[5].forEach(function(q) {
    if (answeredSet[q._qid]) { total++; var d = weakDB[q._qid]; if (d && d.correct > 0) correct++; }
  });
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '📺' : '🎤';
  var msg = pct >= 90 ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。三平方は君のものだね」'
    : pct >= 70 ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50 ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。弱点ノートから見直そう」'
    : 'きょん「むずっ…でもここから這い上がる！！」<br>西村「「斜辺はどれ？」にもどって、もう一度やってみよう」';
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
    localStorage.setItem('math_sanp_sections', JSON.stringify(sectionDone));
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
