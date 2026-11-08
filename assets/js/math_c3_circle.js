// 数学 中3「円の性質」単独ページ（2026-11-08 新規）
// qid: math_circle_s{セクションid}_q{番号}。問題は末尾に足す（途中に入れると記録がずれる）
// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「円周角？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺円が見えてきたかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「円周角で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' }
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var PREFIX = 'math_circle_';
var xp           = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('math_circle_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_circle_sections') || '{}');
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
function saveAnswered() { localStorage.setItem('math_circle_answered', JSON.stringify(answeredSet)); }
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
function svgBox(w, h, body, maxw) {
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;max-width:' + (maxw || 320) + 'px;display:block;margin:8px auto;background:#0f1520;border-radius:10px">' + body + '</svg>';
}
function dot(p, color) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="' + (color || WH) + '"/>'; }
function unit(o, p) { var x = p[0] - o[0], y = p[1] - o[1], l = Math.sqrt(x * x + y * y); return [x / l, y / l]; }
// 角のしるしと、その角の数字。reflex のときは大きい方の角
function angMark(o, p, q, label, reflex, r) {
  r = r || 22;
  var u = unit(o, p), v = unit(o, q);
  var a1 = Math.atan2(u[1], u[0]), a2 = Math.atan2(v[1], v[0]);
  var d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  var color = label === 'x' ? YE : BL;
  var x1 = o[0] + r * u[0], y1 = o[1] + r * u[1], x2 = o[0] + r * v[0], y2 = o[1] + r * v[1];
  var path = reflex
    ? 'M' + x1 + ' ' + y1 + ' A' + r + ' ' + r + ' 0 1 ' + (d > 0 ? 0 : 1) + ' ' + x2 + ' ' + y2
    : 'M' + x1 + ' ' + y1 + ' A' + r + ' ' + r + ' 0 0 ' + (d > 0 ? 1 : 0) + ' ' + x2 + ' ' + y2;
  var bx = u[0] + v[0], by = u[1] + v[1], bl = Math.sqrt(bx * bx + by * by) || 1;
  bx /= bl; by /= bl;
  if (reflex) { bx = -bx; by = -by; }
  return '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.4"/>' + txt(o[0] + bx * (r + 17), o[1] + by * (r + 17) + 5, label, color, 'middle', 14);
}
var CX = 140, CY = 120, RAD = 92;
function onCircle(d) { var a = d * Math.PI / 180; return [CX + RAD * Math.cos(a), CY - RAD * Math.sin(a)]; }
function crossPt(p1, p2, p3, p4) {
  var d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
  var a = p1[0] * p2[1] - p1[1] * p2[0], b = p3[0] * p4[1] - p3[1] * p4[0];
  return [(a * (p3[0] - p4[0]) - (p1[0] - p2[0]) * b) / d, (a * (p3[1] - p4[1]) - (p1[1] - p2[1]) * b) / d];
}
// c = { pts:{A:角度,...}, lines:['AB','OA',...], dia:'AB', cross:'EACBD', oAt:[dx,dy], ang:[['頂点','端','端','数字', 'R'],...] }
function circ(c) {
  var pos = { O:[CX, CY] }, k;
  for (k in c.pts) pos[k] = onCircle(c.pts[k]);
  if (c.cross) pos[c.cross[0]] = crossPt(pos[c.cross[1]], pos[c.cross[2]], pos[c.cross[3]], pos[c.cross[4]]);
  var s = '<circle cx="' + CX + '" cy="' + CY + '" r="' + RAD + '" fill="none" stroke="#8b949e" stroke-width="2"/>';
  (c.lines || []).forEach(function(l) { s += seg(pos[l[0]], pos[l[1]]); });
  if (c.dia) s += seg(pos[c.dia[0]], pos[c.dia[1]], BL, 2.8);
  (c.ang || []).forEach(function(a) { s += angMark(pos[a[0]], pos[a[1]], pos[a[2]], a[3], a[4] === 'R', a[0] === 'O' ? 19 : 22); });
  for (k in c.pts) {
    var u = unit([CX, CY], pos[k]);
    s += dot(pos[k]) + txt(pos[k][0] + u[0] * 15, pos[k][1] + u[1] * 15 + 5, k);
  }
  var oa = c.oAt || [-13, 19];
  s += dot(pos.O, YE) + txt(CX + oa[0], CY + oa[1], 'O', YE);
  if (c.cross) s += txt(pos[c.cross[0]][0] + 13, pos[c.cross[0]][1] + 5, c.cross[0], YE);
  return svgBox(280, 244, s);
}
// 円外の点 P から2本の接線。t ＝ ∠AOP（度）
function tangentFig(t, L) {
  L = L || {};
  var cx = 92, cy = 112, r = 66, a = t * Math.PI / 180, d = r / Math.cos(a);
  var O = [cx, cy], P = [cx + d, cy], A = [cx + r * Math.cos(a), cy - r * Math.sin(a)], B = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#8b949e" stroke-width="2"/>';
  s += seg(P, A, BL, 2.6) + seg(P, B, BL, 2.6) + seg(O, A) + seg(O, B) + seg(O, P, WH, 1.8, true);
  // 直角のしるし
  function sq(V, to1, to2) {
    var u = unit(V, to1), v = unit(V, to2), n = 10;
    return '<path d="M' + (V[0] + u[0] * n) + ' ' + (V[1] + u[1] * n) + ' L' + (V[0] + (u[0] + v[0]) * n) + ' ' + (V[1] + (u[1] + v[1]) * n) + ' L' + (V[0] + v[0] * n) + ' ' + (V[1] + v[1] * n) + '" fill="none" stroke="' + YE + '" stroke-width="2"/>';
  }
  s += sq(A, O, P) + sq(B, O, P);
  if (L.aop) s += angMark(O, A, P, L.aop, false, 18);
  if (L.aob) s += angMark(O, A, B, L.aob, false, 18);
  if (L.apo) s += angMark(P, O, A, L.apo, false, 26);
  if (L.apb) s += angMark(P, A, B, L.apb, false, 26);
  if (L.pa) s += txt((A[0] + P[0]) / 2 + 8, (A[1] + P[1]) / 2 - 8, L.pa, L.pa === 'x' ? YE : WH);
  if (L.pb) s += txt((B[0] + P[0]) / 2 + 8, (B[1] + P[1]) / 2 + 18, L.pb, L.pb === 'x' ? YE : WH);
  s += dot(O, YE) + txt(cx - 14, cy + 6, 'O', YE) + dot(A) + txt(A[0] - 2, A[1] - 11, 'A') + dot(B) + txt(B[0] - 2, B[1] + 21, 'B') + dot(P) + txt(P[0] + 12, P[1] + 5, 'P');
  return svgBox(Math.max(290, cx + d + 34), 224, s);
}
// 2本の弦が点 P で交わる図（PA × PB ＝ PC × PD になる数を渡す）
function chordsFig(pa, pb, pc, pd, hide) {
  var th = 62 * Math.PI / 180;
  var A0 = [-pa, 0], B0 = [pb, 0], C0 = [-pc * Math.cos(th), pc * Math.sin(th)], D0 = [pd * Math.cos(th), -pd * Math.sin(th)];
  // A0, B0, C0 を通る円の中心
  var ax = A0[0], ay = A0[1], bx = B0[0], by = B0[1], cx = C0[0], cy = C0[1];
  var dd = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  var ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / dd;
  var uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / dd;
  var rr = Math.sqrt((ax - ux) * (ax - ux) + (ay - uy) * (ay - uy)), sc = 88 / rr;
  function M(p) { return [140 + (p[0] - ux) * sc, 116 - (p[1] - uy) * sc]; }
  var P = M([0, 0]), A = M(A0), B = M(B0), C = M(C0), D = M(D0);
  var s = '<circle cx="140" cy="116" r="88" fill="none" stroke="#8b949e" stroke-width="2"/>' + seg(A, B) + seg(C, D, BL, 2.6);
  function lab(Q, v, key, ox, oy) {
    var t = hide === key ? 'x' : String(v);
    return txt((P[0] + Q[0]) / 2 + ox, (P[1] + Q[1]) / 2 + oy, t, t === 'x' ? YE : WH);
  }
  s += lab(A, pa, 'pa', 0, -8) + lab(B, pb, 'pb', 0, -8) + lab(C, pc, 'pc', 12, 8) + lab(D, pd, 'pd', 12, 8);
  function nm(Q, n) { var u = unit([140, 116], Q); return dot(Q) + txt(Q[0] + u[0] * 15, Q[1] + u[1] * 15 + 5, n); }
  s += nm(A, 'A') + nm(B, 'B') + nm(C, 'C') + nm(D, 'D') + dot(P, YE) + txt(P[0] - 13, P[1] + 18, 'P', YE);
  return svgBox(280, 236, s);
}

// ===== 問題データ =====
var QS = {};
// ---- Section 1：円周角の定理 ----
QS[1] = [
  { q:'1つの弧に対する円周角の大きさは、その弧に対する中心角の何倍？', a:'1/2 倍', choices:['1/2 倍','2 倍','1 倍','3 倍'],
    exp:E('① 円周角 ＝ 中心角の半分', '中心角が 2 倍の大きさ', '逆にしない', '中心の方が広く見える') },
  { q:'図で、x の値は？', svg:circ({pts:{A:220,B:320,P:90},lines:['AP','BP','OA','OB'],ang:[['O','A','B','100°'],['P','A','B','x']],oAt:[0,-12]}), a:'50°', choices:['50°','100°','200°','40°'],
    exp:E('① 円周角 ＝ 中心角の半分', '100° ÷ 2 ＝ 50°', '同じ大きさにしない', '弧 AB を見ている2つの角') },
  { q:'図で、x の値は？', svg:circ({pts:{A:235,B:305,P:100},lines:['AP','BP','OA','OB'],ang:[['P','A','B','35°'],['O','A','B','x']],oAt:[0,-12]}), a:'70°', choices:['70°','35°','17.5°','145°'],
    exp:E('① 中心角 ＝ 円周角の 2 倍', '35° × 2 ＝ 70°', '半分にしない', '中心の角の方が大きい') },
  { q:'図で、x の値は？', svg:circ({pts:{A:228,B:312,P:125,Q:55},lines:['AP','BP','AQ','BQ'],ang:[['P','A','B','42°'],['Q','A','B','x']],oAt:[0,-12]}), a:'42°', choices:['42°','84°','21°','138°'],
    exp:E('② 同じ弧に対する円周角は等しい', '弧 AB を見ているので 42°', '2 倍や半分にしない（どちらも円周の角）', 'どの席から見ても同じ') },
  { q:'同じ弧に対する円周角について、正しいものは？', a:'どれも大きさが等しい', choices:['どれも大きさが等しい','中心に近いほど大きい','弧に近いほど大きい','点によってばらばらになる'],
    exp:E('② 同じ弧に対する円周角は等しい', 'P をどこに動かしても同じ', '見た目の大きさに引っぱられない', '円周上ならどこでも') },
  { q:'図で AB が直径のとき、x の値は？', svg:circ({pts:{A:180,B:0,P:120},lines:['AP','BP'],dia:'AB',ang:[['P','A','B','x']],oAt:[0,19]}), a:'90°', choices:['90°','180°','45°','60°'],
    exp:E('③ 直径に対する円周角は 90°', '中心角 180° の半分', '180° にしない', '直径を見たら直角') },
  { q:'図で AB が直径のとき、x の値は？', svg:circ({pts:{A:180,B:0,P:70},lines:['AP','BP'],dia:'AB',ang:[['A','P','B','35°'],['B','P','A','x']],oAt:[0,19]}), a:'55°', choices:['55°','35°','90°','145°'],
    exp:E('③ ∠P ＝ 90° の直角三角形になる', '180° − 90° − 35° ＝ 55°', '∠P が 90° なのを忘れない', '直径 → 直角 → 内角の和') },
  { q:'図で、x の値は？', svg:circ({pts:{A:205,B:335,P:90},lines:['AP','BP','OA','OB'],ang:[['O','A','B','130°'],['P','A','B','x']],oAt:[0,-12]}), a:'65°', choices:['65°','130°','260°','50°'],
    exp:E('① 円周角 ＝ 中心角の半分', '130° ÷ 2 ＝ 65°', '同じ大きさにしない', '半分') },
  { q:'図で、x（大きい方の中心角）の値は？', svg:circ({pts:{A:200,B:340,P:270},lines:['AP','BP','OA','OB'],ang:[['P','A','B','110°'],['O','A','B','x','R']],oAt:[0,20]}), a:'220°', choices:['220°','110°','55°','140°'],
    exp:E('円周角と中心角は、同じ弧を見ている', 'P が見ているのは上の大きい弧 → 110° × 2 ＝ 220°', '140° は下の小さい中心角', 'どの弧を見ているかを先に見る') },
  { q:'図で、x（小さい方の ∠AOB）の値は？', svg:circ({pts:{A:220,B:320,P:270},lines:['AP','BP','OA','OB'],ang:[['P','A','B','130°'],['O','A','B','x']],oAt:[0,-12]}), a:'100°', choices:['100°','130°','260°','65°'],
    exp:E('大きい方の中心角を出してから 360° から引く', '130° × 2 ＝ 260°、360° − 260° ＝ 100°', '260° は上側の大きい角', 'P は上の弧を見ている') },
  { q:'円周角が 30° のとき、同じ弧に対する中心角は？', a:'60°', choices:['60°','30°','15°','90°'],
    exp:E('中心角 ＝ 円周角の 2 倍', '30° × 2 ＝ 60°', '半分にしない', '中心の角の方が大きい') }
];
// ---- Section 2：いろいろな角度 ----
QS[2] = [
  { q:'図で、x の値は？（O は円の中心）', svg:circ({pts:{A:230,B:330},lines:['OA','OB','AB'],ang:[['O','A','B','100°'],['A','O','B','x']],oAt:[0,-12]}), a:'40°', choices:['40°','50°','80°','100°'],
    exp:E('OA ＝ OB（どちらも半径）→ 二等辺三角形', '(180° − 100°) ÷ 2 ＝ 40°', '50° は円周角', '中心から2本 → 二等辺') },
  { q:'図で、x の値は？', svg:circ({pts:{A:235,B:305,P:90},lines:['AP','BP','OA','OB','AB'],ang:[['P','A','B','35°'],['A','O','B','x']],oAt:[0,-12]}), a:'55°', choices:['55°','35°','70°','110°'],
    exp:E('中心角を出す → 二等辺三角形', '∠AOB ＝ 70°、(180° − 70°) ÷ 2 ＝ 55°', '70° で止めない', '2段階で解く') },
  { q:'図で、x の値は？', svg:circ({pts:{A:235,B:345,P:95},lines:['OA','OB','OP','AP','BP'],ang:[['A','O','P','20°'],['B','O','P','35°'],['P','A','B','x']],oAt:[-2,24]}), a:'55°', choices:['55°','20°','35°','110°'],
    exp:E('OP を引くと二等辺三角形が2つできる', '∠OPA ＝ 20°、∠OPB ＝ 35° → 20° ＋ 35° ＝ 55°', 'どちらか片方だけにしない', '中心と結ぶ補助線') },
  { q:'図で AB が直径のとき、x の値は？', svg:circ({pts:{A:180,B:0,C:60,D:270},lines:['AC','BC','AD','CD'],dia:'AB',ang:[['A','C','B','30°'],['D','A','C','x']],oAt:[-2,-10]}), a:'60°', choices:['60°','30°','90°','120°'],
    exp:E('∠ACB ＝ 90° → ∠ABC ＝ 60°、同じ弧 AC の円周角', '∠ADC ＝ ∠ABC ＝ 60°', '30° のままにしない', '等しい角を移動させる') },
  { q:'図で、x の値は？', svg:circ({pts:{A:200,B:280,C:20,D:90},lines:['AC','BD','AD'],cross:'EACBD',ang:[['D','A','B','40°'],['A','D','C','35°'],['E','A','B','x']],oAt:[-22,-16]}), a:'75°', choices:['75°','40°','35°','105°'],
    exp:E('三角形の外角 ＝ となりでない2つの内角の和', '△AED の外角：35° ＋ 40° ＝ 75°', '△AED の内角 ∠AED は 105°', 'x は △AED の外角') },
  { q:'【発展】図の四角形 ABCD は円に内接している。x の値は？', svg:circ({pts:{A:100,B:190,C:270,D:350},lines:['AB','BC','CD','DA'],ang:[['A','B','D','80°'],['C','B','D','x']],oAt:[-2,-10]}), a:'100°', choices:['100°','80°','160°','90°'],
    exp:E('内接四角形の向かい合う角の和は 180°', '180° − 80° ＝ 100°', '同じ大きさにしない', '反対側の弧を見ている') },
  { q:'図で AB ＝ AC のとき、x の値は？', svg:circ({pts:{A:90,B:220,C:320},lines:['AB','AC','BC','OB','OC'],ang:[['O','B','C','100°'],['B','A','C','x']],oAt:[0,-12]}), a:'65°', choices:['65°','50°','80°','130°'],
    exp:E('∠A を出して、二等辺三角形の底角を出す', '∠A ＝ 50°、(180° − 50°) ÷ 2 ＝ 65°', '50° は頂角', '円周角 → 底角 の順') },
  { q:'図で AB が直径のとき、x の値は？', svg:circ({pts:{A:180,B:0,C:50},lines:['AC','OC'],dia:'AB',ang:[['A','O','C','25°'],['O','C','B','x']],oAt:[-2,19]}), a:'50°', choices:['50°','25°','130°','65°'],
    exp:E('① 中心角 ＝ 円周角の 2 倍', '∠COB は弧 BC の中心角、∠CAB はその円周角 → 25° × 2', '130° は ∠AOC', '弧 BC を見ている') },
  { q:'図で、x の値は？', svg:circ({pts:{A:230,B:310,C:10,P:120},lines:['OA','OB','OC','AP','CP'],ang:[['O','A','B','80°'],['O','B','C','60°'],['P','A','C','x']],oAt:[-14,-10]}), a:'70°', choices:['70°','140°','40°','30°'],
    exp:E('弧 AC 全体の中心角を出す', '80° ＋ 60° ＝ 140°、÷ 2 ＝ 70°', '140° で止めない', '弧 AC を見ている') }
];
// ---- Section 3：弧と円周角 ----
QS[3] = [
  { q:'1つの円で、等しい弧に対する円周角は？', a:'等しい', choices:['等しい','弧が長いほど大きい','弧の両端で変わる','必ず 90°'],
    exp:E('弧の長さが同じ → 円周角も同じ', '逆も成り立つ', '見た目で決めない', '弧と角はセット') },
  { q:'1つの円で、等しい円周角に対する弧は？', a:'等しい', choices:['等しい','長い方が半分になる','必ず半円になる','比べられない'],
    exp:E('円周角が同じ → 弧も同じ', '定理の逆向きも使える', '円が2つのときはそのまま使えない', '同じ円の中の話') },
  { q:'弧 AB と弧 BC の長さの比が 1:2 で、弧 AB に対する円周角が 20° のとき、弧 BC に対する円周角は？', a:'40°', choices:['40°','20°','10°','60°'],
    exp:E('弧の長さと円周角は比例する', '2 倍の弧 → 2 倍の角', '半分にしない', '弧が2倍なら角も2倍') },
  { q:'長さ 6cm の弧に対する円周角が 30° のとき、同じ円で円周角が 45° の弧の長さは？', a:'9 cm', choices:['9 cm','4 cm','21 cm','12 cm'],
    exp:E('弧の長さと円周角は比例する', '6:30 ＝ x:45 → x ＝ 9', 'たし算にしない', '比例式で解く') },
  { q:'円周を 6 等分したとき、1 つの弧に対する円周角は？', a:'30°', choices:['30°','60°','15°','45°'],
    exp:E('中心角 → 半分', '360° ÷ 6 ＝ 60°、÷ 2 ＝ 30°', '60° は中心角', '等分は先に中心角') },
  { q:'図は円周を 8 等分している。x の値は？', svg:circ({pts:{A:90,B:45,C:0,D:315,E:270,F:225,G:180,H:135},lines:['AC','CE'],ang:[['C','A','E','x']],oAt:[-2,-10]}), a:'90°', choices:['90°','45°','135°','180°'],
    exp:E('見ている弧が何個分かを数える', '弧 AE は 4 個分：45° × 4 ＝ 180°、÷ 2 ＝ 90°', 'C のある側の弧を数えない', 'AE は直径') },
  { q:'時計の文字盤で、12時・3時・5時の位置の点を A、B、C とする。∠ACB は？', svg:circ({pts:{A:90,B:0,C:300},lines:['AC','BC'],ang:[['C','A','B','x']],oAt:[-2,-10]}), a:'45°', choices:['45°','90°','30°','60°'],
    exp:E('文字盤の 1 目盛りは中心角 30°', '弧 AB は 3 目盛り：90°、÷ 2 ＝ 45°', '90° は中心角', '1 目盛りの円周角は 15°') },
  { q:'1つの円で弧の長さを 2 倍にすると、弦の長さは？', a:'ちょうど 2 倍にはならない', choices:['ちょうど 2 倍にはならない','ちょうど 2 倍になる','変わらない','半分になる'],
    exp:E('円周角と比例するのは弧。弦は比例しない', '弧は曲がっている、弦はまっすぐ', '弦まで比例させない', '比例するのは「弧」だけ') },
  { q:'円周の 1/4 の弧に対する円周角は？', a:'45°', choices:['45°','90°','180°','22.5°'],
    exp:E('中心角 → 半分', '360° ÷ 4 ＝ 90°、÷ 2 ＝ 45°', '90° は中心角', '割合からも中心角が出せる') },
  { q:'半径 6cm の円で、円周角が 30° の弧の長さは？', a:'2π cm', choices:['2π cm','π cm','4π cm','6π cm'],
    exp:E('円周角 → 中心角 → おうぎ形の弧', '中心角 60°：2π × 6 × 60/360 ＝ 2π', '円周角をそのまま使わない', '弧の式は中心角で計算') }
];
// ---- Section 4：円周角の定理の逆 ----
QS[4] = [
  { q:'2点 P、Q が直線 AB の同じ側にあり、∠APB ＝ ∠AQB のとき、正しいものは？', a:'4点 A、B、P、Q は1つの円周上にある', choices:['4点 A、B、P、Q は1つの円周上にある','4点は一直線上にある','AB は必ず直径である','PQ と AB は必ず平行である'],
    exp:E('円周角の定理の逆', '同じ側で等しい角 → 同じ円周上', '反対側では使えない', '「同じ側」が条件') },
  { q:'2点 P、Q が直線 AB の反対側にあり、∠APB ＝ ∠AQB のとき、4点は同じ円周上にあるといえる？', a:'これだけではいえない', choices:['これだけではいえない','必ずいえる','必ず直径になる','必ず一直線上にある'],
    exp:E('定理の逆は「同じ側」のときだけ', '反対側の円周角は、たして 180° になるとき同じ円周上', '等しいだけでは使えない', 'まず同じ側かを見る') },
  { q:'2点 P、Q が直線 AB の同じ側にあり、∠APB ＝ 50°、∠AQB ＝ 60° のとき、4点は同じ円周上にある？', a:'ない', choices:['ない','ある','半分だけある','AB の長さによる'],
    exp:E('角が等しくなければ同じ円周上ではない', '50° と 60° はちがう', '近い数でも等しくない', '等しいときだけ') },
  { q:'四角形 ABCD で ∠BAC ＝ ∠BDC ＝ 35° のとき、4点 A、B、C、D は？', a:'1つの円周上にある', choices:['1つの円周上にある','一直線上にある','どれも円の外にある','AB ＝ CD となる'],
    exp:E('A と D は BC の同じ側で等しい角', 'BC を見ている角が等しい', '見ている弧（線分）を確かめる', 'どの線分を見ているかが大事') },
  { q:'図で ∠ACB ＝ ∠ADB ＝ 35°、∠ABD ＝ 40° のとき、x の値は？', svg:circ({pts:{A:200,B:270,C:30,D:120},lines:['AB','AC','BC','AD','BD','CD'],ang:[['C','A','B','35°'],['D','A','B','35°'],['B','A','D','40°'],['C','A','D','x']],oAt:[20,8]}), a:'40°', choices:['40°','35°','75°','105°'],
    exp:E('4点が同じ円周上なら、円周角の定理が使える', '弧 AD を見ている ∠ABD ＝ ∠ACD ＝ 40°', '35° は弧 AB の角', '定理の逆 → 定理 の順') },
  { q:'∠ACB ＝ ∠ADB ＝ 90° のとき、点 C、D は？', a:'AB を直径とする円の周上にある', choices:['AB を直径とする円の周上にある','AB の中点にある','直線 AB の上にある','必ず同じ点になる'],
    exp:E('③ の逆：90° を見ている線分は直径', 'AB の中点が円の中心', '90° なら直径が決まる', '三角形の外接円') },
  { q:'弧 AB と同じ側の点 P が円の内側にあるとき、∠APB は円周角と比べて？', a:'大きい', choices:['大きい','小さい','等しい','いつも 90°'],
    exp:E('円の中に入ると角は開く', '内側 → 大きい、外側 → 小さい', '逆にしない', '近づくと広く見える') },
  { q:'弧 AB と同じ側の点 P が円の外側にあるとき、∠APB は円周角と比べて？', a:'小さい', choices:['小さい','大きい','等しい','いつも 90°'],
    exp:E('円の外に出ると角は閉じる', '外側 → 小さい', '逆にしない', '遠ざかると小さく見える') }
];
// ---- Section 8：接線 ----
QS[8] = [
  { q:'円の接線と、接点を通る半径の関係は？', a:'垂直に交わる', choices:['垂直に交わる','平行である','45° で交わる','長さが等しい'],
    exp:E('接線 ⊥ 接点を通る半径', '∠OAP ＝ 90°', '図に直角の印がなくても使う', '接線を見たら半径を引く') },
  { q:'図で PA は円 O の接線、A は接点。x の値は？', svg:tangentFig(50,{aop:'50°',apo:'x'}), a:'40°', choices:['40°','50°','90°','130°'],
    exp:E('∠OAP ＝ 90° の直角三角形', '180° − 90° − 50° ＝ 40°', '直角を忘れない', '接点には必ず直角') },
  { q:'図で PA、PB は円 O の接線で、PA ＝ 5cm のとき、PB の長さは？', svg:tangentFig(55,{pa:'5',pb:'x'}), a:'5 cm', choices:['5 cm','10 cm','2.5 cm','7 cm'],
    exp:E('円外の1点から引いた2本の接線の長さは等しい', 'PA ＝ PB', '半分や 2 倍にしない', '左右対称') },
  { q:'図で PA、PB は円 O の接線。∠APB ＝ 60° のとき、x の値は？', svg:tangentFig(60,{apb:'60°',aob:'x'}), a:'120°', choices:['120°','60°','90°','30°'],
    exp:E('四角形の内角の和は 360°', '360° − 90° − 90° − 60° ＝ 120°', '2 倍や半分にしない（円周角ではない）', '接点の直角が2つ') },
  { q:'図で PA、PB は円 O の接線。∠AOB ＝ 100° のとき、x の値は？', svg:tangentFig(50,{aob:'100°',apb:'x'}), a:'80°', choices:['80°','100°','50°','40°'],
    exp:E('四角形 PAOB の角の和', '360° − 90° − 90° − 100° ＝ 80°', '50° は半分にしたまちがい', '∠P ＋ ∠O ＝ 180°') },
  { q:'△ABC の内接円が辺 AB と D で接する。AB ＝ 7、BC ＝ 6、CA ＝ 5 のとき、AD の長さは？', a:'3', choices:['3','3.5','2','4'],
    exp:E('同じ頂点から出た接線の長さは等しい', 'AD ＝ x → BE ＝ 7 − x、CE ＝ 5 − x、(7 − x) ＋ (5 − x) ＝ 6 → x ＝ 3', '半分の 3.5 にしない', '接点で辺を2つに分ける') },
  { q:'円 O の外の点 P から接線を作図するとき、最初にかくものは？', a:'線分 OP の中点を中心とする、OP を直径とする円', choices:['線分 OP の中点を中心とする、OP を直径とする円','点 P を中心とする半径 OP の円','O を中心とする半径 OP の円','OP に垂直な直線'],
    exp:E('OP を直径とする円をかく', '円 O との交点が接点になる', 'O や P を中心にしない', '中点を先に作図する') },
  { q:'接線の作図で、OP を直径とする円をかくのはなぜ？', a:'直径に対する円周角が 90° になり、接線と半径が垂直になるから', choices:['直径に対する円周角が 90° になり、接線と半径が垂直になるから','円の面積が半分になるから','OP が接線になるから','2つの円の半径が等しくなるから'],
    exp:E('③ 直径に対する円周角は 90°', '∠OAP ＝ 90° になる点 A が接点', '「形がきれいだから」ではない', '円周角の定理の使い道') },
  { q:'【発展】点 A で円に接する直線上に T をとる。弦 AB と AT がつくる角 ∠BAT に等しいのは？（C は AB について T と反対側の円周上の点）', a:'∠ACB', choices:['∠ACB','∠ABC','∠BAC','90°'],
    exp:E('接線と弦のつくる角は、その内側の弧の円周角に等しい', '∠BAT ＝ ∠ACB', 'となりの角と混ぜない', '入試の応用で役に立つ') }
];
// ---- Section 9：円と相似 ----
QS[9] = [
  { q:'図のように弦 AB、CD が P で交わる。∠ACP ＝ ∠DBP の理由は？', svg:chordsFig(3,8,4,6), a:'同じ弧に対する円周角は等しいから', choices:['同じ弧に対する円周角は等しいから','対頂角は等しいから','平行線の錯角は等しいから','半径は等しいから'],
    exp:E('どちらも弧 AD を見ている', '∠ACD ＝ ∠ABD', '平行線は書かれていない', '円では同じ弧の角を探す') },
  { q:'同じ図で、∠APC ＝ ∠DPB の理由は？', svg:chordsFig(3,8,4,6), a:'対頂角は等しいから', choices:['対頂角は等しいから','同じ弧に対する円周角は等しいから','共通な角だから','平行線の同位角は等しいから'],
    exp:E('2本の弦が交わっている', 'P の向かい合う角', '円周角ではない（P は円周上にない）', 'ちょうちょの真ん中') },
  { q:'同じ図で、正しい相似の式は？', svg:chordsFig(3,8,4,6), a:'△PAC ∽ △PDB', choices:['△PAC ∽ △PDB','△PAC ∽ △PBD','△PAC ∽ △DPB','△PAC ∽ △BDP'],
    exp:E('等しい角の頂点を同じ順番に', 'P と P、A と D（弧 CB）、C と B（弧 AD）', '見た目の位置で決めない', 'A は D と、C は B と対応') },
  { q:'図で x の値は？（PA ＝ 3、PB ＝ 8、PC ＝ 4）', svg:chordsFig(3,8,4,6,'pd'), a:'6', choices:['6','7','32/3','12'],
    exp:E('△PAC ∽ △PDB より PA × PB ＝ PC × PD', '3 × 8 ＝ 4 × x → x ＝ 6', 'たし算にしない', '交わる弦の積は等しい') },
  { q:'図で x の値は？（PA ＝ 2、PB ＝ 6、PD ＝ 3）', svg:chordsFig(2,6,4,3,'pc'), a:'4', choices:['4','9','5','1'],
    exp:E('PA × PB ＝ PC × PD', '2 × 6 ＝ x × 3 → x ＝ 4', '比の組み合わせをまちがえない', '同じ弦の2つをかける') },
  { q:'【発展】円外の点 P を通る2本の直線が円と A、B および C、D で交わる。PA ＝ 3、PB ＝ 8、PC ＝ 4 のとき、PD は？', a:'6', choices:['6','7','5','32/3'],
    exp:E('円の外でも PA × PB ＝ PC × PD', '3 × 8 ＝ 4 × PD → PD ＝ 6', '相似の形は変わっても積は同じ', '△PAC ∽ △PDB') },
  { q:'△ABC の外接円で AD は直径、AH は BC に垂直。△ABD ∽ △AHC となる相似条件は？', a:'2組の角がそれぞれ等しい', choices:['2組の角がそれぞれ等しい','3組の辺の比がすべて等しい','2組の辺の比とその間の角がそれぞれ等しい','1組の角が等しい'],
    exp:E('∠ABD ＝ ∠AHC ＝ 90°、∠ADB ＝ ∠ACH（同じ弧 AB）', '直角と円周角の2組', '1組では足りない', '円の相似はほぼ2組の角') },
  { q:'前の問題で AB ＝ 6、AC ＝ 8、AD ＝ 12 のとき、AH の長さは？', a:'4', choices:['4','9','16','6'],
    exp:E('△ABD ∽ △AHC → AB:AH ＝ AD:AC', '6:AH ＝ 12:8 → 12 AH ＝ 48 → AH ＝ 4', '比の順番をそろえる', 'AB × AC ＝ AD × AH でも同じ') }
];
// ---- Section 5：確認テスト ----
QS[5] = [
  { q:'図で、x の値は？', svg:circ({pts:{A:222,B:318,P:95},lines:['AP','BP','OA','OB'],ang:[['O','A','B','96°'],['P','A','B','x']],oAt:[0,-12]}), a:'48°', choices:['48°','96°','192°','42°'],
    exp:E('円周角 ＝ 中心角の半分', '96° ÷ 2 ＝ 48°', '同じ大きさにしない', '半分') },
  { q:'図で、x の値は？', svg:circ({pts:{A:240,B:300,P:100},lines:['AP','BP','OA','OB'],ang:[['P','A','B','30°'],['O','A','B','x']],oAt:[0,-12]}), a:'60°', choices:['60°','30°','15°','150°'],
    exp:E('中心角 ＝ 円周角の 2 倍', '30° × 2 ＝ 60°', '半分にしない', '2 倍') },
  { q:'図で、x の値は？', svg:circ({pts:{A:225,B:315,P:130,Q:50},lines:['AP','BP','AQ','BQ'],ang:[['P','A','B','45°'],['Q','A','B','x']],oAt:[0,-12]}), a:'45°', choices:['45°','90°','22.5°','135°'],
    exp:E('同じ弧の円周角は等しい', '45°', '2 倍にしない', '弧 AB を見ている') },
  { q:'図で AB が直径のとき、x の値は？', svg:circ({pts:{A:180,B:0,P:80},lines:['AP','BP'],dia:'AB',ang:[['A','P','B','40°'],['B','P','A','x']],oAt:[0,19]}), a:'50°', choices:['50°','40°','90°','140°'],
    exp:E('直径 → ∠P ＝ 90°', '180° − 90° − 40° ＝ 50°', '直角を忘れない', '内角の和') },
  { q:'図で、x（大きい方の中心角）の値は？', svg:circ({pts:{A:210,B:330,P:270},lines:['AP','BP','OA','OB'],ang:[['P','A','B','120°'],['O','A','B','x','R']],oAt:[0,20]}), a:'240°', choices:['240°','120°','60°','140°'],
    exp:E('P が見ているのは上の大きい弧', '120° × 2 ＝ 240°', '小さい方の中心角と間違えない', 'どの弧を見ているか') },
  { q:'図で、x の値は？', svg:circ({pts:{A:235,B:325},lines:['OA','OB','AB'],ang:[['O','A','B','90°'],['A','O','B','x']],oAt:[0,-12]}), a:'45°', choices:['45°','90°','60°','30°'],
    exp:E('OA ＝ OB の二等辺三角形', '(180° − 90°) ÷ 2 ＝ 45°', '半径が等しいことを使う', '中心から2本') },
  { q:'図で、x の値は？', svg:circ({pts:{A:235,B:335,P:105},lines:['OA','OB','OP','AP','BP'],ang:[['A','O','P','25°'],['B','O','P','25°'],['P','A','B','x']],oAt:[-2,24]}), a:'50°', choices:['50°','25°','100°','130°'],
    exp:E('OP で二等辺三角形2つに分ける', '25° ＋ 25° ＝ 50°', '片方だけにしない', '補助線 OP') },
  { q:'図で、x の値は？', svg:circ({pts:{A:210,B:290,C:30,D:110},lines:['AC','BD','AD'],cross:'EACBD',ang:[['D','A','B','40°'],['A','D','C','40°'],['E','A','B','x']],oAt:[-24,-20]}), a:'80°', choices:['80°','40°','100°','140°'],
    exp:E('三角形の外角', '△AED の外角：40° ＋ 40° ＝ 80°', '100° は内角 ∠AED', '外角はとなりでない2角の和') },
  { q:'弧 AB と弧 BC の長さの比が 1:3 で、弧 AB の円周角が 15° のとき、弧 BC の円周角は？', a:'45°', choices:['45°','15°','5°','60°'],
    exp:E('弧の長さと円周角は比例', '15° × 3 ＝ 45°', '3 で割らない', '弧が 3 倍なら角も 3 倍') },
  { q:'円周を 12 等分したとき、1 つの弧に対する円周角は？', a:'15°', choices:['15°','30°','12°','60°'],
    exp:E('中心角 → 半分', '360° ÷ 12 ＝ 30°、÷ 2 ＝ 15°', '30° は中心角', '時計の 1 目盛り') },
  { q:'比例するのはどれ？', a:'弧の長さと円周角', choices:['弧の長さと円周角','弦の長さと円周角','弦の長さと弧の長さ','半径と円周角'],
    exp:E('比例するのは「弧」と「角」', '弧が 2 倍なら角も 2 倍', '弦は比例しない', '弧だけ') },
  { q:'同じ側の点 P、Q で ∠APB ＝ ∠AQB のとき、4点は？', a:'1つの円周上にある', choices:['1つの円周上にある','一直線上にある','いつも正方形になる','決められない'],
    exp:E('円周角の定理の逆', '同じ側で等しい', '反対側はこの形では使えない', '「同じ側」を確認') },
  { q:'点 P が円の外にあるとき、∠APB は同じ側の円周角と比べて？', a:'小さい', choices:['小さい','大きい','等しい','いつも 90°'],
    exp:E('外 → 小さい、内 → 大きい', '離れると小さく見える', '逆にしない', '近いと広い') },
  { q:'円の接線と、接点を通る半径のつくる角は？', a:'90°', choices:['90°','45°','180°','60°'],
    exp:E('接線 ⊥ 半径', 'いつも 90°', '図に印がなくても使う', '接線を見たら半径') },
  { q:'図で PA は円 O の接線、A は接点。x の値は？', svg:tangentFig(40,{aop:'40°',apo:'x'}), a:'50°', choices:['50°','40°','90°','140°'],
    exp:E('∠OAP ＝ 90°', '180° − 90° − 40° ＝ 50°', '直角を忘れない', '接点の直角') },
  { q:'図で PA、PB は円 O の接線。∠AOB ＝ 110° のとき、x の値は？', svg:tangentFig(55,{aob:'110°',apb:'x'}), a:'70°', choices:['70°','110°','55°','35°'],
    exp:E('四角形の内角の和', '360° − 90° − 90° − 110° ＝ 70°', '半分にしない（円周角ではない）', '∠P ＋ ∠O ＝ 180°') },
  { q:'△ABC の内接円が AB と D で接する。AB ＝ 8、BC ＝ 7、CA ＝ 5 のとき、AD の長さは？', a:'3', choices:['3','4','2.5','5'],
    exp:E('接線の長さは等しい', 'AD ＝ x：(8 − x) ＋ (5 − x) ＝ 7 → x ＝ 3', '半分にしない', '頂点ごとに同じ長さ') },
  { q:'弦 AB、CD が P で交わる。PA ＝ 2、PB ＝ 9、PC ＝ 3 のとき、PD は？', svg:chordsFig(2,9,3,6,'pd'), a:'6', choices:['6','8','27/2','5'],
    exp:E('PA × PB ＝ PC × PD', '2 × 9 ＝ 3 × x → x ＝ 6', 'たし算にしない', '同じ弦の2つをかける') },
  { q:'弦 AB、CD が P で交わるとき、△PAC と相似な三角形は？', a:'△PDB', choices:['△PDB','△PBD','△DPB','△BPD'],
    exp:E('A は D と、C は B と対応', '同じ弧を見ている頂点どうし', '順番をそろえる', '等しい角の順に書く') },
  { q:'直径に対する円周角の定理が使われているのは？', a:'接線の作図', choices:['接線の作図','中点連結定理','内角の和','対頂角'],
    exp:E('OP を直径とする円をかくのは 90° を作るため', '接線 ⊥ 半径', '別の定理と混ぜない', '③の使い道') }
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
  correct: ['きょん「やった！天才かも！！」','きょん「にっくんより賢くなったかも！」','きょん「どの弧か、見えてきた！！」','西村「正解。よく覚えてたね」','西村「できてる。その調子」'],
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
  { id:0, label:'⭕ スタート',   title:'円周角は3ルール',      sub:'中心角の半分・同じ弧なら等しい・直径なら 90°' },
  { id:1, label:'円周角',        title:'円周角の定理',            sub:'どの弧を見ているかを先に決める' },
  { id:2, label:'いろいろな角', title:'いろいろな角度',          sub:'二等辺三角形・補助線・外角と組み合わせる' },
  { id:3, label:'弧と角',        title:'弧と円周角',              sub:'比例するのは弧。弦は比例しない' },
  { id:4, label:'定理の逆',      title:'円周角の定理の逆',        sub:'同じ側で角が等しければ、同じ円周上' },
  { id:8, label:'接線',          title:'円の接線',                sub:'接線と半径は垂直。接線の長さは等しい' },
  { id:9, label:'円と相似',      title:'円と相似',                sub:'円周角で角をそろえて、相似につなげる' },
  { id:5, label:'確認テスト',    title:'確認テスト',              sub:'全部まとめて20問。ゆっくりでOK' },
  { id:6, label:'📊弱点',        title:'弱点ノート',              sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',        title:'弱点特訓モード',          sub:'弱点問題だけを集中練習！' }
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
  localStorage.setItem('math_circle_sections', JSON.stringify(sectionDone));
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
    + '<div class="section-badge">数学 円の性質 · SECTION ' + idx + '</div>'
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
    chat('kyon', '円の問題、どこを見ればいいのか全然わからない'),
    chat('nishi', '先に決めるのは「その角がどの弧を見ているか」だ。あとはルール3つで解ける'),
    chat('iwa', 'きょん、弧を舞台だと思ってみて。中心の O さんは舞台の真ん中で見てるから、円周の客席の人より2倍広く見えるの。客席はどの席でも同じ広さに見えるんだよ'),
    chat('kyon', 'イワクラちゃん、俺の単独ライブ、どの席からも空席しか見えないんだけど')
  ])
  + card('⭕ 円周角の3ルール',
    circ({pts:{A:220,B:320,P:90},lines:['AP','BP','OA','OB'],ang:[['O','A','B','100°'],['P','A','B','50°']],oAt:[0,-12]})
    + table([['','ルール','例'],
      ['①','円周角 ＝ 中心角の<b>半分</b>','100° → 50°'],
      ['②','同じ弧の円周角は<b>等しい</b>','どこでも 50°'],
      ['③','直径の円周角は <b>90°</b>','180° の半分']]))
  + '<button class="start-btn" data-goto="1">⭕ 円周角 から始める →</button>';
};
INTRO[1] = function() {
  return talk([
    chat('kyon', 'x が円周角なのか中心角なのか、すぐ混ざる'),
    chat('nishi', '頂点の場所を見ればいい。<b>中心 O が頂点なら中心角、円周上の点が頂点なら円周角</b>だ')
  ])
  + card('📐 どちらの角？',
    table([['頂点','名前','どちらが大きい？'],
      ['中心 O','中心角','大きい方（円周角の 2 倍）'],
      ['円周上の点','円周角','小さい方（中心角の半分）']])
    + '<div class="rule-box"><div class="note">⚠️ P が小さい弧の上にいるときは、P が見ているのは<b>反対側の大きい弧</b>。中心角も大きい方（180° より大きい角）を使う</div></div>');
};
INTRO[2] = function() {
  return talk([
    chat('shun', 'きょんさん、中心 O から線が2本出てたら二等辺三角形ですわ。半径はみんな同じ長さなんで。コンビの身長がそろってるようなもんです'),
    chat('kyon', 'しゅん、俺と西村、身長そろってないよ')
  ])
  + card('📐 見つけたら使うもの',
    table([['図に出てきたら','使うもの'],
      ['中心から2本の半径','二等辺三角形'],
      ['直径','直角（③）'],
      ['2本の弦の交わり','三角形の外角'],
      ['円周上の点と中心','OP を結ぶ補助線']]))
  + card('🔍 例題：補助線 OP を引く',
    circ({pts:{A:235,B:345,P:95},lines:['OA','OB','OP','AP','BP'],ang:[['A','O','P','20°'],['B','O','P','35°'],['P','A','B','x']],oAt:[-2,24]})
    + step('STEP 1　同じ長さをさがす（タップ）', 'OA、OB、OP はどれも半径なので等しい')
    + step('STEP 2　二等辺三角形の底角（タップ）', '△OAP は二等辺 → ∠OPA ＝ ∠OAP ＝ 20°<br>△OBP は二等辺 → ∠OPB ＝ ∠OBP ＝ 35°')
    + step('STEP 3　たす（タップ）', '<div class="qd-big">x ＝ 20° ＋ 35° ＝ 55°</div>'));
};
INTRO[3] = function() {
  return talk([
    chat('nishi', '弧と円周角は比例する。弧が 2 倍なら円周角も 2 倍だ。ただし<b>弦は比例しない</b>')
  ])
  + card('📐 比例する？しない？',
    table([['2つの量','<span class="nw">比例</span>','理由'],
      ['弧の長さと円周角','<span class="ln-ok">⭕</span>','中心角と弧が比例するから'],
      ['弧の長さと中心角','<span class="ln-ok">⭕</span>','おうぎ形の弧の式'],
      ['弦の長さと円周角','<span class="ln-ng">✕</span>','弦はまっすぐなので、2倍の弧でも2倍より短い']]))
  + card('📐 等分の問題',
    '<div class="rule-box"><div class="ex">① 1 つ分の中心角を出す（360° ÷ 等分の数）</div><div class="ex">② 見ている弧が何個分かを数える</div><div class="ex">③ 全部の中心角の半分が円周角</div></div>');
};
INTRO[4] = function() {
  return talk([
    chat('kuru', 'きょんさん、定理の逆は「同じ側」だけ確認っす！僕も逆から読んだら、だいたい意味変わるっすけど！'),
    chat('nishi', '角が等しいことから「同じ円周上にある」と言える。ただし<b>2点が直線の同じ側にある</b>ときだけだ')
  ])
  + card('📐 4点は同じ円周上？',
    table([['条件','結果'],
      ['同じ側で、角が等しい','<span class="ln-ok">⭕</span> 同じ円周上'],
      ['同じ側で、角がちがう','<span class="ln-ng">✕</span> 同じ円周上ではない'],
      ['反対側で、角が等しい','<span class="ln-ng">✕</span> これだけではいえない']])
    + '<div class="rule-box"><div class="note">💡 点が円の内側 → 角は大きい。外側 → 角は小さい</div></div>');
};
INTRO[8] = function() {
  return talk([
    chat('kyon', '接線って、円にちょっとだけさわってる線？'),
    chat('nishi', 'そう。そして<b>接点に向かう半径と、必ず垂直</b>になる。図に直角の印がなくても使える')
  ])
  + card('📐 接線の2つのルール',
    tangentFig(55,{pa:'5',pb:'5'})
    + table([['ルール','内容'],
      ['接線 ⊥ 半径','∠OAP ＝ ∠OBP ＝ 90°'],
      ['接線の長さ','PA ＝ PB']]))
  + card('🔍 円外の点 P から接線を作図する',
    step('STEP 1（タップ）', '線分 OP の垂直二等分線をかいて、中点 M を求める')
    + step('STEP 2（タップ）', 'M を中心に、MO を半径とする円をかく（OP が直径の円）')
    + step('STEP 3（タップ）', '円 O との交点が接点 A、B。P と A、P と B を結ぶ<br>OP が直径なので ∠OAP ＝ 90°（ルール③）になる'));
};
INTRO[9] = function() {
  return talk([
    chat('nishi', '円の相似は、ほとんど「2組の角」だ。同じ弧の円周角で角をそろえる')
  ])
  + card('🔍 例題：2本の弦が交わるとき',
    chordsFig(3,8,4,6)
    + step('1行目（タップ）', '△PAC と △PDB において')
    + step('2行目（タップ）', '対頂角は等しいから、∠APC ＝ ∠DPB …①')
    + step('3行目（タップ）', '弧 AD に対する円周角は等しいから、∠ACP ＝ ∠DBP …②')
    + step('4行目（タップ）', '①、②より、2組の角がそれぞれ等しいから<div class="qd-big">△PAC ∽ △PDB</div>')
    + step('長さを求める（タップ）', 'PA:PD ＝ PC:PB なので <b>PA × PB ＝ PC × PD</b><br>3 × 8 ＝ 4 × 6 ✓'))
  + '<div class="rule-box"><div class="note">💡 相似の基本は <a href="math_c3_similar.html" style="color:var(--gold)">図形と相似</a> で確認できるよ</div></div>';
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
  var msg = pct >= 90 ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。円は君のものだね」'
    : pct >= 70 ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50 ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。弱点ノートから見直そう」'
    : 'きょん「むずっ…でもここから這い上がる！！」<br>西村「スタートの3ルールにもどって、もう一度やってみよう」';
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
    localStorage.setItem('math_circle_sections', JSON.stringify(sectionDone));
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
