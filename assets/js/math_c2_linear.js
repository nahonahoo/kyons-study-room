// 数学 中2「一次関数」単独ページ（2026-11-08 新規）
// qid: math_lin_s{セクションid}_q{番号}。問題は末尾に足す（途中に入れると記録がずれる）
// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「一次関数？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺グラフ読めるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「一次関数で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' }
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var PREFIX = 'math_lin_';
var xp           = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('math_lin_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_lin_sections') || '{}');
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
function saveAnswered() { localStorage.setItem('math_lin_answered', JSON.stringify(answeredSet)); }
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

// ===== グラフ =====
function ticks(a, b, step) {
  var r = [];
  for (var v = a; v <= b + 1e-9; v += step) { if (Math.abs(v) > 1e-9) r.push(v); }
  return r;
}
function tickLabel(v) { return v < 0 ? '−' + (-v) : String(v); }
// c = { xmin,xmax,ymin,ymax,sx,sy,gx,gy,xt,yt,xl,yl,maxw, lines:[{a,b,x1,x2,color,dash,label}], segs:[[x1,y1,x2,y2,color]], vlines:[{x,color,label}], stairs:[...], pts:[...] }
function G(c) {
  var L = 34, T = 22, W = (c.xmax - c.xmin) * c.sx, H = (c.ymax - c.ymin) * c.sy;
  function X(x) { return L + (x - c.xmin) * c.sx; }
  function Y(y) { return T + (c.ymax - y) * c.sy; }
  function label(x, y, t, color, anchor, size) {
    return '<text x="' + x + '" y="' + y + '" fill="' + color + '" font-size="' + (size || 14) + '" font-weight="bold"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + ' paint-order="stroke" stroke="#0f1520" stroke-width="3">' + t + '</text>';
  }
  var s = '<svg viewBox="0 0 ' + (W + L + 40) + ' ' + (H + T + 32) + '" style="width:100%;max-width:' + (c.maxw || 340) + 'px;display:block;margin:8px auto;background:#0f1520;border-radius:10px">';
  var v;
  for (v = c.xmin; v <= c.xmax + 1e-9; v += c.gx) s += '<line x1="' + X(v) + '" y1="' + Y(c.ymin) + '" x2="' + X(v) + '" y2="' + Y(c.ymax) + '" stroke="rgba(120,160,255,0.25)"/>';
  for (v = c.ymin; v <= c.ymax + 1e-9; v += c.gy) s += '<line x1="' + X(c.xmin) + '" y1="' + Y(v) + '" x2="' + X(c.xmax) + '" y2="' + Y(v) + '" stroke="rgba(120,160,255,0.25)"/>';
  var ax = c.xmin <= 0 && c.xmax >= 0 ? 0 : c.xmin, ay = c.ymin <= 0 && c.ymax >= 0 ? 0 : c.ymin;
  s += '<line x1="' + X(c.xmin) + '" y1="' + Y(ay) + '" x2="' + X(c.xmax) + '" y2="' + Y(ay) + '" stroke="#e6edf3" stroke-width="1.8"/>';
  s += '<line x1="' + X(ax) + '" y1="' + Y(c.ymin) + '" x2="' + X(ax) + '" y2="' + Y(c.ymax) + '" stroke="#e6edf3" stroke-width="1.8"/>';
  (c.xt || []).forEach(function(t) { s += '<text x="' + X(t) + '" y="' + (Y(ay) + 15) + '" text-anchor="middle" fill="#b6c0cc" font-size="12" paint-order="stroke" stroke="#0f1520" stroke-width="3">' + tickLabel(t) + '</text>'; });
  (c.yt || []).forEach(function(t) { s += '<text x="' + (X(ax) - 5) + '" y="' + (Y(t) + 4) + '" text-anchor="end" fill="#b6c0cc" font-size="12" paint-order="stroke" stroke="#0f1520" stroke-width="3">' + tickLabel(t) + '</text>'; });
  s += label(X(c.xmax) + 4, Y(ay) - 5, c.xl || 'x', '#e6edf3', '', 13);
  s += label(X(ax) + 4, Y(c.ymax) - 6, c.yl || 'y', '#e6edf3', '', 13);
  (c.lines || []).forEach(function(l) {
    var x1 = l.x1 !== undefined ? l.x1 : c.xmin, x2 = l.x2 !== undefined ? l.x2 : c.xmax;
    if (l.a !== 0) {
      var ya = l.a * x1 + l.b, yb = l.a * x2 + l.b;
      if (ya < c.ymin) x1 = (c.ymin - l.b) / l.a; else if (ya > c.ymax) x1 = (c.ymax - l.b) / l.a;
      if (yb < c.ymin) x2 = (c.ymin - l.b) / l.a; else if (yb > c.ymax) x2 = (c.ymax - l.b) / l.a;
    }
    s += '<line x1="' + X(x1) + '" y1="' + Y(l.a * x1 + l.b) + '" x2="' + X(x2) + '" y2="' + Y(l.a * x2 + l.b) + '" stroke="' + l.color + '" stroke-width="3"' + (l.dash ? ' stroke-dasharray="7 5"' : '') + '/>';
    if (l.label) s += label(X(x2) + (l.lx || 3), Y(l.a * x2 + l.b) + (l.ly || 4), l.label, l.color);
  });
  (c.segs || []).forEach(function(g) {
    s += '<line x1="' + X(g[0]) + '" y1="' + Y(g[1]) + '" x2="' + X(g[2]) + '" y2="' + Y(g[3]) + '" stroke="' + (g[4] || '#ff7a45') + '" stroke-width="3"/>';
  });
  (c.vlines || []).forEach(function(l) {
    s += '<line x1="' + X(l.x) + '" y1="' + Y(c.ymin) + '" x2="' + X(l.x) + '" y2="' + Y(c.ymax) + '" stroke="' + l.color + '" stroke-width="3"/>';
    if (l.label) s += label(X(l.x) + 5, Y(c.ymax) + 15, l.label, l.color);
  });
  (c.stairs || []).forEach(function(st) {
    var fx = st.from[0], fy = st.from[1];
    s += '<line x1="' + X(fx) + '" y1="' + Y(fy) + '" x2="' + X(fx + st.dx) + '" y2="' + Y(fy) + '" stroke="#ffd84d" stroke-width="3" stroke-dasharray="5 3"/>';
    s += '<line x1="' + X(fx + st.dx) + '" y1="' + Y(fy) + '" x2="' + X(fx + st.dx) + '" y2="' + Y(fy + st.dy) + '" stroke="#3ddc84" stroke-width="3" stroke-dasharray="5 3"/>';
    if (st.tr) s += label((X(fx) + X(fx + st.dx)) / 2, Y(fy) + (st.dy >= 0 ? 17 : -7), st.tr, '#ffd84d', 'middle', 13);
    if (st.tu) s += label(X(fx + st.dx) + 5, (Y(fy) + Y(fy + st.dy)) / 2 + 4, st.tu, '#3ddc84', '', 13);
  });
  (c.pts || []).forEach(function(p) {
    s += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="5" fill="' + (p.color || '#ffd84d') + '" stroke="#000"/>';
    if (p.label) s += label(X(p.x) + (p.dx !== undefined ? p.dx : 8), Y(p.y) + (p.dy !== undefined ? p.dy : -7), p.label, p.color || '#ffd84d', p.anchor);
  });
  return s + '</svg>';
}
var OR = '#ff7a45', BL = '#4aa8ff', YE = '#ffd84d', GR = '#3ddc84';
// 目盛りの数字をすべて入れた −5〜5 の方眼（「どこを見るか」で迷わないように）
function grid(extra) {
  var c = { xmin:-5, xmax:5, ymin:-5, ymax:5, sx:27, sy:27, gx:1, gy:1, xt:ticks(-4,4,1), yt:ticks(-4,4,1), maxw:360 };
  for (var k in extra) c[k] = extra[k];
  return G(c);
}
function line(a, b, pts, extra) {
  var c = { lines:[{a:a,b:b,color:OR}], pts:(pts || []).map(function(p){ return {x:p[0],y:p[1],color:OR}; }) };
  for (var k in (extra || {})) c[k] = extra[k];
  return grid(c);
}
// 動く点の図：長方形 ABCD（AB＝4、BC＝6）と点 P
function rectFig(px, py, cap) {
  var ax = 30, ay = 18, w = 108, h = 72;
  var X = ax + px * w, Y = ay + py * h;
  return '<div><svg viewBox="0 0 170 116" style="width:100%;max-width:170px;display:block;margin:0 auto;background:#0f1520;border-radius:10px">'
    + '<polygon points="' + ax + ',' + ay + ' ' + X + ',' + Y + ' ' + (ax + w) + ',' + ay + '" fill="rgba(74,168,255,0.35)" stroke="#4aa8ff" stroke-width="2"/>'
    + '<rect x="' + ax + '" y="' + ay + '" width="' + w + '" height="' + h + '" fill="none" stroke="#e6edf3" stroke-width="2"/>'
    + '<text x="' + (ax - 16) + '" y="' + (ay + 6) + '" fill="#e6edf3" font-size="15" font-weight="bold">A</text>'
    + '<text x="' + (ax - 16) + '" y="' + (ay + h + 6) + '" fill="#e6edf3" font-size="15" font-weight="bold">B</text>'
    + '<text x="' + (ax + w + 6) + '" y="' + (ay + h + 6) + '" fill="#e6edf3" font-size="15" font-weight="bold">C</text>'
    + '<text x="' + (ax + w + 6) + '" y="' + (ay + 6) + '" fill="#e6edf3" font-size="15" font-weight="bold">D</text>'
    + '<circle cx="' + X + '" cy="' + Y + '" r="5.5" fill="#ffd84d" stroke="#000"/>'
    + '<text x="' + (X + (px > 0.5 ? -18 : 9)) + '" y="' + (Y + (py > 0.6 ? -8 : 15)) + '" fill="#ffd84d" font-size="15" font-weight="bold">P</text>'
    + '</svg>' + cap + '</div>';
}

// ===== 解説カードのフォーマット =====
function E(rule, ok, ng, tip) {
  return '<span class="exp-rule"><span class="label">📐 ルール</span>' + rule + '</span>'
    + '<span class="exp-ok">✅ ' + ok + '</span>'
    + (ng ? '<span class="exp-ng">❌ ' + ng + '</span>' : '')
    + '<span class="exp-tip">💡 ' + tip + '</span>';
}

// ===== 問題データ =====
var QS = {};
// ---- Section 1：一次関数とは ----
QS[1] = [
  { q:'次のうち、y が x の一次関数であるものは？', a:'y ＝ 2x − 3', choices:['y ＝ 2x − 3','y ＝ x²','y ＝ 12/x','y ＝ 5'],
    exp:E('y ＝（数）× x ＋（数）の形なら一次関数', 'y ＝ 2x − 3 は a ＝ 2、b ＝ −3', 'x² は2乗、12/x は x が分母、y ＝ 5 は x がない', 'x が「かけ算で1回だけ」出てくる形') },
  { q:'一次関数 y ＝ −4x ＋ 7 の a と b は？', a:'a ＝ −4、b ＝ 7', choices:['a ＝ −4、b ＝ 7','a ＝ 4、b ＝ 7','a ＝ 7、b ＝ −4','a ＝ −4、b ＝ −7'],
    exp:E('x の前が a、残りの数が b（符号もいっしょに読む）', 'a ＝ −4、b ＝ 7', '− を落として a ＝ 4 にしない', '数の前の符号はその数の持ち物') },
  { q:'y ＝ 5x は一次関数といえる？', a:'いえる（b ＝ 0 の形）', choices:['いえる（b ＝ 0 の形）','いえない（b がないから）','いえない（比例だから）','比例でも一次関数でもない'],
    exp:E('比例 y ＝ ax は、一次関数の b ＝ 0 の場合', 'y ＝ 5x ＋ 0 と考える', '比例と一次関数は別物、と思わない', '比例は一次関数の仲間') },
  { q:'一次関数 y ＝ x ＋ 6 の a の値は？', a:'1', choices:['1','0','6','x'],
    exp:E('x の前に何も書いていないときは 1', 'y ＝ 1x ＋ 6 → a ＝ 1', 'a ＝ 0 にしない（0 なら x が消える）', 'x ＝ 1x、−x ＝ −1x') },
  { q:'y ＝ 2x ＋ 5 で、x ＝ 3 のときの y の値は？', a:'11', choices:['11','10','16','6'],
    exp:E('x に数を入れて計算する', '2 × 3 ＋ 5 ＝ 11', '2 と 3 を並べて 23 のように読まない', 'かけ算が先、たし算があと') },
  { q:'y ＝ −3x ＋ 1 で、x ＝ −2 のときの y の値は？', a:'7', choices:['7','−5','5','−7'],
    exp:E('負の数はかっこをつけて入れる', '−3 × (−2) ＋ 1 ＝ 6 ＋ 1 ＝ 7', '−6 ＋ 1 ＝ −5 は符号のまちがい', 'マイナス × マイナス ＝ プラス') },
  { q:'水そうに 5L の水が入っている。ここに毎分 2L ずつ水を入れる。x 分後の水の量を y L とすると？', a:'y ＝ 2x ＋ 5', choices:['y ＝ 2x ＋ 5','y ＝ 5x ＋ 2','y ＝ 2x − 5','y ＝ 7x'],
    exp:E('はじめの量が b、1分あたりの量が a', 'はじめ 5L、毎分 2L → y ＝ 2x ＋ 5', '5 と 2 を入れかえない', '「毎」がついている数が x の前') },
  { q:'長さ 20cm のろうそくが、毎分 2cm ずつ短くなる。x 分後の長さを y cm とすると？', a:'y ＝ −2x ＋ 20', choices:['y ＝ −2x ＋ 20','y ＝ 2x ＋ 20','y ＝ 20x − 2','y ＝ −20x ＋ 2'],
    exp:E('減るときは a がマイナス', 'はじめ 20cm、毎分 −2cm → y ＝ −2x ＋ 20', '短くなるのに ＋2x にしない', '増える→プラス、減る→マイナス') },
  { q:'基本料金が 500 円で、1GB 使うごとに 300 円かかる。x GB 使ったときの料金を y 円とすると？', a:'y ＝ 300x ＋ 500', choices:['y ＝ 300x ＋ 500','y ＝ 500x ＋ 300','y ＝ 800x','y ＝ 300x − 500'],
    exp:E('基本料金は x ＝ 0 のときの金額＝b', '1GB ごと 300 円 → a ＝ 300、基本 500 → b ＝ 500', '500 と 300 をたして 800x にしない', '基本料金は1回だけ、毎回かかるのは 300 円') },
  { q:'前の問題の料金で、4GB 使ったときの料金は？', a:'1700 円', choices:['1700 円','1200 円','3200 円','2000 円'],
    exp:E('式の x に 4 を入れる', '300 × 4 ＋ 500 ＝ 1700', '1200 円は基本料金の入れ忘れ', '求めたいものに合わせて x か y に数を入れる') },
  { q:'次のうち、y が x の一次関数であるものは？', a:'80円のペンを x 本と120円のノートを1冊買ったときの代金 y 円', choices:['80円のペンを x 本と120円のノートを1冊買ったときの代金 y 円','1辺が x cm の正方形の面積 y cm²','面積が 12cm² の長方形のたて x cm と横 y cm','半径が x cm の円の面積 y cm²'],
    exp:E('式にしてから形を見る', 'y ＝ 80x ＋ 120', '正方形は y ＝ x²、長方形は y ＝ 12/x、円は y ＝ πx²', '文章のままでは決められない。必ず式にする') }
];
// ---- Section 2：変化の割合 ----
QS[2] = [
  { q:'y ＝ 3x ＋ 2 の変化の割合は？', a:'3', choices:['3','2','5','1'],
    exp:E('一次関数の変化の割合は、いつも a', 'x の前の数 3', '切片の 2 を答えない', '変化の割合 ＝ 傾き ＝ a') },
  { q:'y ＝ −2x ＋ 5 の変化の割合は？', a:'−2', choices:['−2','2','5','−5'],
    exp:E('a の符号までふくめて答える', 'a ＝ −2', '2 にしない（減る式なのでマイナス）', 'x が増えると y が減る＝マイナス') },
  { q:'y ＝ −x − 3 の変化の割合は？', a:'−1', choices:['−1','1','−3','0'],
    exp:E('−x は −1x', 'a ＝ −1', '−3 は切片', 'x の前に数がなければ 1 か −1') },
  { q:'y ＝ 1/2 x ＋ 4 の変化の割合は？', a:'1/2', choices:['1/2','2','4','1/4'],
    exp:E('分数でも x の前の数が a', 'a ＝ 1/2', '逆数の 2 にしない', 'x が 2 増えると y が 1 増える') },
  { q:'y ＝ 3x − 1 で、x が 2 増えると y はいくつ増える？', a:'6', choices:['6','3','5','2'],
    exp:E('y の増加量 ＝ a × x の増加量', '3 × 2 ＝ 6', '3 だけは x が 1 増えたとき', 'x が増えた分をかける') },
  { q:'y ＝ −2x ＋ 1 で、x の増加量が 3 のとき、y の増加量は？', a:'−6', choices:['−6','6','−5','3'],
    exp:E('y の増加量 ＝ a × x の増加量', '−2 × 3 ＝ −6', '符号を落として 6 にしない', '「−6 増える」＝6 減る') },
  { q:'y ＝ 1/2 x ＋ 3 で、x が 4 増えると y はいくつ増える？', a:'2', choices:['2','4','8','1/2'],
    exp:E('y の増加量 ＝ a × x の増加量', '1/2 × 4 ＝ 2', '4 のままにしない', '分数の傾きは分母の倍数で考えるとラク') },
  { q:'一次関数で、x が 1 から 4 まで増えると、y は 2 から 11 まで増えた。変化の割合は？', a:'3', choices:['3','9','1/3','11'],
    exp:E('変化の割合 ＝ (y の増加量) ÷ (x の増加量)', '(11 − 2) ÷ (4 − 1) ＝ 9 ÷ 3 ＝ 3', '9 は y の増加量だけ', 'y が上、x が下') },
  { q:'x が −1 から 3 まで増えたときの、x の増加量は？', a:'4', choices:['4','2','3','−4'],
    exp:E('増加量 ＝ あとの値 − はじめの値', '3 − (−1) ＝ 3 ＋ 1 ＝ 4', '3 − 1 ＝ 2 にしない', '数直線で −1 から 3 まで何マスかを数える') },
  { q:'一次関数の変化の割合について、正しいものは？', a:'どの区間で調べても同じ値になる', choices:['どの区間で調べても同じ値になる','x が大きいほど大きくなる','切片と同じ値になる','いつも正の数になる'],
    exp:E('直線の坂のきつさはどこでも同じ', '変化の割合はいつも a', 'y ＝ ax² は区間で変わるが、一次関数は変わらない', '直線＝どこを切っても同じ坂') },
  { q:'x が 0, 1, 2, 3 と増えると、y は 7, 4, 1, −2 と変わる一次関数の式は？', a:'y ＝ −3x ＋ 7', choices:['y ＝ −3x ＋ 7','y ＝ 3x ＋ 7','y ＝ −3x − 2','y ＝ 7x − 3'],
    exp:E('表の差が a、x ＝ 0 のときの y が b', 'y は 3 ずつ減る → a ＝ −3、x ＝ 0 で y ＝ 7 → b ＝ 7', '減っているのに 3 にしない', '表の左はし（x ＝ 0）を見る') }
];
// ---- Section 3：グラフ ----
QS[3] = [
  { q:'y ＝ 2x − 1 のグラフを書くとき、最初に打つ点は？', a:'(0, −1)', choices:['(0, −1)','(−1, 0)','(0, 2)','(2, −1)'],
    exp:E('最初の点は切片：(0, b)', 'b ＝ −1 → (0, −1)', '(−1, 0) は x と y が逆', '切片は y軸（x ＝ 0）の上にある') },
  { q:'傾きが −3 の直線の進み方は？', a:'右に1進むと下に3', choices:['右に1進むと下に3','右に1進むと上に3','右に3進むと下に1','上に1進むと右に3'],
    exp:E('傾きは「右に1進んだときの上下」', 'マイナスなので下に3', '−3 を「上に3」としない', 'いつも右に進んでから上下を数える') },
  { q:'傾きが 2/3 の直線の進み方は？', a:'右に3進むと上に2', choices:['右に3進むと上に2','右に2進むと上に3','右に1進むと上に2','右に3進むと下に2'],
    exp:E('分母が右、分子が上', '2/3 → 右に3、上に2', '右に2、上に3 は傾き 3/2', '分母は「下にある数＝地面を進む」') },
  { q:'グラフが右上がりになるものは？', a:'y ＝ 3x − 5', choices:['y ＝ 3x − 5','y ＝ −x ＋ 4','y ＝ −2x','y ＝ −1/3 x − 2'],
    exp:E('a がプラスなら右上がり、マイナスなら右下がり', 'a ＝ 3 はプラス', '切片の −5 は向きに関係ない', '向きを決めるのは a だけ') },
  { q:'グラフの坂がいちばん急なものは？', a:'y ＝ −3x ＋ 1', choices:['y ＝ −3x ＋ 1','y ＝ 2x ＋ 5','y ＝ x','y ＝ 1/2 x ＋ 7'],
    exp:E('急さは、マイナスをとった数の大きさで比べる', '3、2、1、1/2 のうち 3 が最大', 'マイナスだから小さい、ではない', 'マイナスは向き、数の大きさが急さ') },
  { q:'y ＝ 2x ＋ 3 と平行な直線は？', a:'y ＝ 2x − 4', choices:['y ＝ 2x − 4','y ＝ 3x ＋ 2','y ＝ −2x ＋ 3','y ＝ 1/2 x ＋ 3'],
    exp:E('傾きが同じなら平行', 'a が同じ 2', '切片が同じでも平行にはならない（y軸で交わる）', '同じ坂をずらしたのが平行') },
  { q:'y ＝ 3x − 6 の切片は？', a:'−6', choices:['−6','2','3','6'],
    exp:E('切片は式の b（符号もふくめる）', 'x ＝ 0 を入れると y ＝ −6', '2 は x軸とぶつかるところ', '切片は y軸で読む') },
  { q:'グラフの直線の傾きは？', svg:line(-1,2,[[0,2],[1,1]],{stairs:[{from:[0,2],dx:1,dy:-1}]}), a:'−1', choices:['−1','1','2','−2'],
    exp:E('右に1進んで上下にいくつ', '右に1で下に1 → −1', '下がっているのに 1 にしない', '右下がりならマイナス') },
  { q:'グラフの直線の切片は？', svg:line(0.5,-2,[[0,-2],[4,0]]), a:'−2', choices:['−2','4','1/2','2'],
    exp:E('切片は y軸（たて軸）とぶつかる目盛り', 'y軸の −2', '4 は x軸（よこ軸）とぶつかるところ', 'x軸ではなく y軸を見る') },
  { q:'直線 y ＝ 2x ＋ 1 の上にある点は？', a:'(2, 5)', choices:['(2, 5)','(5, 2)','(1, 2)','(0, 2)'],
    exp:E('点の x を式に入れて y が合えば、線の上にある', '2 × 2 ＋ 1 ＝ 5 で合う', '(5, 2) は x と y が逆', '(x, y) の順番を守る') },
  { q:'y ＝ 2x ＋ 1 で、x の変域が −1≦x≦2 のとき、y の変域は？', a:'−1≦y≦5', choices:['−1≦y≦5','1≦y≦5','−1≦y≦2','1≦y≦3'],
    exp:E('直線の変域は両はしを代入', 'x ＝ −1 → −1、x ＝ 2 → 5', 'x の変域をそのまま書かない', '小さい方を左、大きい方を右') },
  { q:'y ＝ −x ＋ 3 で、x の変域が 1≦x≦4 のとき、y の変域は？', a:'−1≦y≦2', choices:['−1≦y≦2','2≦y≦−1','1≦y≦4','−2≦y≦1'],
    exp:E('右下がりは大小が入れかわる', 'x ＝ 1 → 2、x ＝ 4 → −1。小さい方を左に', '2≦y≦−1 と書かない（2 が −1 以下はありえない）', '左に小さい数、右に大きい数') }
];
// ---- Section 4：式を作る（本命） ----
QS[4] = [
  { q:'傾きが 3、切片が −2 の直線の式は？', a:'y ＝ 3x − 2', choices:['y ＝ 3x − 2','y ＝ −2x ＋ 3','y ＝ 3x ＋ 2','y ＝ 2x − 3'],
    exp:E('① 傾きと切片がわかる → そのまま入れる', 'a ＝ 3、b ＝ −2', 'a と b を逆にしない', 'y ＝ （傾き）x ＋（切片）') },
  { q:'傾きが −1 で、点 (0, 4) を通る直線の式は？', a:'y ＝ −x ＋ 4', choices:['y ＝ −x ＋ 4','y ＝ x ＋ 4','y ＝ −x − 4','y ＝ 4x − 1'],
    exp:E('x ＝ 0 の点は切片そのもの', '(0, 4) → b ＝ 4', '(0, ○) 以外の点ではこの読み方はできない', 'x が 0 かどうかを先に見る') },
  { q:'傾きが 2 で、点 (3, 1) を通る直線の式は？', a:'y ＝ 2x − 5', choices:['y ＝ 2x − 5','y ＝ 2x ＋ 1','y ＝ 2x ＋ 3','y ＝ 3x ＋ 1'],
    exp:E('② 傾きと1点 → y ＝ ax ＋ b に点を入れて b を出す', '1 ＝ 2 × 3 ＋ b → b ＝ −5', '点の y の 1 をそのまま切片にしない', '確かめ：2 × 3 − 5 ＝ 1 ✓') },
  { q:'傾きが −3 で、点 (2, −1) を通る直線の式は？', a:'y ＝ −3x ＋ 5', choices:['y ＝ −3x ＋ 5','y ＝ −3x − 1','y ＝ −3x − 7','y ＝ 2x − 3'],
    exp:E('② 点を入れて b を出す', '−1 ＝ −3 × 2 ＋ b → −1 ＝ −6 ＋ b → b ＝ 5', '移項するときの符号に注意（−7 にしない）', '−6 を左へ移すと ＋6') },
  { q:'傾きが 1/2 で、点 (4, 1) を通る直線の式は？', a:'y ＝ 1/2 x − 1', choices:['y ＝ 1/2 x − 1','y ＝ 1/2 x ＋ 1','y ＝ 1/2 x ＋ 3','y ＝ 4x ＋ 1'],
    exp:E('② 分数でも点を入れるだけ', '1 ＝ 1/2 × 4 ＋ b → 1 ＝ 2 ＋ b → b ＝ −1', '点の y を切片にしない', '1/2 × 4 は先に計算する') },
  { q:'y ＝ 3x ＋ 1 に平行で、点 (1, 2) を通る直線の式は？', a:'y ＝ 3x − 1', choices:['y ＝ 3x − 1','y ＝ 3x ＋ 2','y ＝ 3x ＋ 1','y ＝ −3x ＋ 5'],
    exp:E('平行 → 傾きが同じ。あとは②', '傾き 3、2 ＝ 3 × 1 ＋ b → b ＝ −1', '切片まで同じにすると同じ直線になる', '「平行」と書いてあったら傾きをもらう') },
  { q:'2点 (1, 4)、(3, 10) を通る直線の式は？', a:'y ＝ 3x ＋ 1', choices:['y ＝ 3x ＋ 1','y ＝ 3x ＋ 4','y ＝ 6x − 2','y ＝ 2x ＋ 2'],
    exp:E('③ 2点 → 先に傾きを出す → あとは②', '傾き (10 − 4) ÷ (3 − 1) ＝ 3、4 ＝ 3 ＋ b → b ＝ 1', '6 は y の増加量だけ', '確かめ：3 × 3 ＋ 1 ＝ 10 ✓') },
  { q:'2点 (−1, 5)、(2, −1) を通る直線の式は？', a:'y ＝ −2x ＋ 3', choices:['y ＝ −2x ＋ 3','y ＝ 2x ＋ 7','y ＝ −2x ＋ 5','y ＝ −x ＋ 4'],
    exp:E('③ 引く順番を上下でそろえる', '傾き (−1 − 5) ÷ (2 − (−1)) ＝ −6 ÷ 3 ＝ −2、5 ＝ 2 ＋ b → b ＝ 3', '2 − (−1) を 1 にしない', '確かめ：(2, −1) → −4 ＋ 3 ＝ −1 ✓') },
  { q:'2点 (−2, −3)、(2, 1) を通る直線の式は？', a:'y ＝ x − 1', choices:['y ＝ x − 1','y ＝ x ＋ 1','y ＝ −x − 1','y ＝ 2x − 1'],
    exp:E('③ マイナスの座標はかっこをつけて引く', '傾き (1 − (−3)) ÷ (2 − (−2)) ＝ 4 ÷ 4 ＝ 1、1 ＝ 2 ＋ b → b ＝ −1', '傾き 1 は x の前に書かない', '確かめ：(−2, −3) → −2 − 1 ＝ −3 ✓') },
  { q:'グラフの直線の式は？', svg:line(-2,1,[[0,1],[1,-1]]), a:'y ＝ −2x ＋ 1', choices:['y ＝ −2x ＋ 1','y ＝ 2x ＋ 1','y ＝ −2x − 1','y ＝ x − 2'],
    exp:E('④ y軸で読める → 切片と傾きを読む', '切片 1、右に1で下に2 → 傾き −2', '右下がりなのに 2 にしない', 'y軸 → 坂 の順番で見る') },
  { q:'グラフの直線の式は？', svg:line(2/3,-1,[[0,-1],[3,1]]), a:'y ＝ 2/3 x − 1', choices:['y ＝ 2/3 x − 1','y ＝ 3/2 x − 1','y ＝ 2/3 x ＋ 1','y ＝ −2/3 x − 1'],
    exp:E('右に1で目盛りに乗らないときは、角をぴったり通る点まで進む', '(0, −1) → (3, 1)：右に3、上に2 → 傾き 2/3', '「右 ÷ 上」で 3/2 にしない', '傾きは 上 ÷ 右') },
  { q:'グラフの直線の式は？（y軸では目盛りの間を通っている）', svg:line(0.5,2.5,[[1,3],[3,4]]), a:'y ＝ 1/2 x ＋ 5/2', choices:['y ＝ 1/2 x ＋ 5/2','y ＝ 1/2 x ＋ 3','y ＝ 2x ＋ 1','y ＝ 1/2 x ＋ 2'],
    exp:E('⑤ y軸で読めない → 角を通る2点から計算', '(1, 3)、(3, 4) → 傾き 1/2、3 ＝ 1/2 ＋ b → b ＝ 5/2', '切片を目分量で 3 や 2 にしない', '読めないときは必ず計算') },
  { q:'グラフの線は x ＝ 2 から始まっている。この直線の式は？', svg:grid({lines:[{a:1.5,b:-4,x1:2,x2:4,color:OR}],pts:[{x:2,y:-1,color:OR},{x:4,y:2,color:OR}]}), a:'y ＝ 3/2 x − 4', choices:['y ＝ 3/2 x − 4','y ＝ 3/2 x − 1','y ＝ 2/3 x − 4','y ＝ 3/2 x ＋ 2'],
    exp:E('⑤ 線が y軸にとどいていない → 2点から計算（のばしてもOK）', '(2, −1)、(4, 2) → 傾き 3/2、−1 ＝ 3 ＋ b → b ＝ −4', '線の始まりの −1 を切片にしない', '切片は x ＝ 0 のときの y') },
  { q:'「傾き 2 で点 (1, 5) を通る直線」の切片を 5 とするのがまちがいなのは、なぜ？', a:'5 は x ＝ 1 のときの y で、切片は x ＝ 0 のときの y だから', choices:['5 は x ＝ 1 のときの y で、切片は x ＝ 0 のときの y だから','切片はいつも傾きより小さいから','点の y 座標は切片になることがないから','切片は x 座標から求めるものだから'],
    exp:E('切片 ＝ x ＝ 0 のときの y', '5 ＝ 2 × 1 ＋ b → b ＝ 3（切片は 3）', '(0, 5) なら切片は 5。x が 0 かどうかで決まる', '点の x を見てから判断する') }
];
// ---- Section 8：方程式とグラフ・交点 ----
QS[8] = [
  { q:'2x ＋ y ＝ 5 を y について解くと？', a:'y ＝ −2x ＋ 5', choices:['y ＝ −2x ＋ 5','y ＝ 2x ＋ 5','y ＝ 2x − 5','y ＝ −2x − 5'],
    exp:E('y だけを左に残す（移項で符号が変わる）', '2x を右へ → y ＝ −2x ＋ 5', '符号を変え忘れない', '右に動かしたら符号チェンジ') },
  { q:'3x − y ＝ 4 を y について解くと？', a:'y ＝ 3x − 4', choices:['y ＝ 3x − 4','y ＝ −3x ＋ 4','y ＝ 3x ＋ 4','y ＝ −3x − 4'],
    exp:E('−y のときは最後に全部の符号を変える', '−y ＝ −3x ＋ 4 → y ＝ 3x − 4', '−y のまま答えにしない', 'y の前は ＋ にして終わる') },
  { q:'2x ＋ 3y ＝ 6 を y について解くと？', a:'y ＝ −2/3 x ＋ 2', choices:['y ＝ −2/3 x ＋ 2','y ＝ 2/3 x ＋ 2','y ＝ −3/2 x ＋ 2','y ＝ −2/3 x ＋ 6'],
    exp:E('移項してから、y の前の数で全部を割る', '3y ＝ −2x ＋ 6 → y ＝ −2/3 x ＋ 2', '6 を割り忘れない', '右辺は全部の項を割る') },
  { q:'x − 2y ＝ 4 を y について解くと？', a:'y ＝ 1/2 x − 2', choices:['y ＝ 1/2 x − 2','y ＝ −1/2 x ＋ 2','y ＝ 2x − 4','y ＝ 1/2 x ＋ 2'],
    exp:E('−2 で割ると全部の符号が変わる', '−2y ＝ −x ＋ 4 → y ＝ 1/2 x − 2', '片方だけ符号を変えない', '割る数がマイナス → 全部チェンジ') },
  { q:'方程式 y ＝ 3 のグラフは？', a:'x軸に平行な直線', choices:['x軸に平行な直線','y軸に平行な直線','原点を通る直線','傾き 3 の直線'],
    exp:E('y ＝ ○ は「x がなんでも y は ○」', '高さ 3 の横線', '傾き 3 ではない（x がない）', 'y ＝ ○ は横線') },
  { q:'方程式 x ＝ −2 のグラフは？', a:'点 (−2, 0) を通る、y軸に平行な直線', choices:['点 (−2, 0) を通る、y軸に平行な直線','点 (0, −2) を通る、x軸に平行な直線','傾き −2 の直線','原点を通る直線'],
    exp:E('x ＝ ○ は「y がなんでも x は ○」', 'よこの位置が −2 のたて線', '「x だから横線」と思わない', 'x ＝ ○ はたて線') },
  { q:'方程式 2y ＝ −6 のグラフは？', a:'点 (0, −3) を通る、x軸に平行な直線', choices:['点 (0, −3) を通る、x軸に平行な直線','点 (−3, 0) を通る、y軸に平行な直線','傾き −3 の直線','点 (0, −6) を通る、x軸に平行な直線'],
    exp:E('まず y ＝ の形にする', '2y ＝ −6 → y ＝ −3 の横線', '−6 のまま読まない', '両辺を 2 で割ってから判断') },
  { q:'2直線 y ＝ 2x ＋ 1、y ＝ −x ＋ 7 の交点の座標は？', a:'(2, 5)', choices:['(2, 5)','(5, 2)','(3, 7)','(2, 3)'],
    exp:E('交点 → 右辺どうしを ＝ でつなぐ', '2x ＋ 1 ＝ −x ＋ 7 → 3x ＝ 6 → x ＝ 2、y ＝ 5', 'x と y を入れかえない', 'もう一方の式でも確かめ：−2 ＋ 7 ＝ 5 ✓') },
  { q:'2直線 y ＝ x − 2、y ＝ −3x ＋ 6 の交点の座標は？', a:'(2, 0)', choices:['(2, 0)','(0, 2)','(−2, 0)','(1, −1)'],
    exp:E('交点 → 右辺どうしを ＝ でつなぐ', 'x − 2 ＝ −3x ＋ 6 → 4x ＝ 8 → x ＝ 2、y ＝ 0', 'y ＝ 0 でも答えの形は (2, 0)', 'x が出たら必ず y まで出す') },
  { q:'連立方程式 x ＋ y ＝ 4、2x − y ＝ 5 の2つのグラフの交点の座標は？', a:'(3, 1)', choices:['(3, 1)','(1, 3)','(4, 0)','(2, 2)'],
    exp:E('交点の座標 ＝ 連立方程式の解', 'たすと 3x ＝ 9 → x ＝ 3、y ＝ 1', '(1, 3) は x と y が逆', '連立方程式の単元とつながっている') },
  { q:'直線 y ＝ 2x ＋ 3 と x軸の交点の座標は？', a:'(−3/2, 0)', choices:['(−3/2, 0)','(0, 3)','(3/2, 0)','(0, −3/2)'],
    exp:E('x軸の上では y ＝ 0', '0 ＝ 2x ＋ 3 → x ＝ −3/2', '(0, 3) は y軸との交点', 'x軸 → y ＝ 0、y軸 → x ＝ 0') },
  { q:'2直線 y ＝ x ＋ 3、y ＝ −x ＋ 1 の交点を通り、y ＝ 2x に平行な直線の切片は？', a:'4', choices:['4','2','0','−4'],
    exp:E('交点を出す → 傾きをもらう → 点を入れる', '交点 (−1, 2)。y ＝ 2x ＋ b に入れて 2 ＝ −2 ＋ b → b ＝ 4', '2 は交点の y（x ＝ −1 のときの y）', '入試の大問1によく出る形') },
  { q:'グラフの2直線の交点の座標は？', svg:grid({lines:[{a:1,b:1,color:OR},{a:-1,b:3,color:BL}],pts:[{x:1,y:2,color:YE}]}), a:'(1, 2)', choices:['(1, 2)','(2, 1)','(0, 3)','(0, 1)'],
    exp:E('交点が目盛りの角にあれば読める', '右に1、上に2', '(x, y) の順番に注意', '読めないときは計算する') },
  { q:'2直線 y ＝ x ＋ 1、y ＝ −2x ＋ 7 と y軸で囲まれた三角形の面積は？', a:'6', choices:['6','12','3','9'],
    exp:E('y軸の上の長さを底辺、交点までの横の長さを高さに', '交点 (2, 3)、底辺 7 − 1 ＝ 6、高さ 2 → 6 × 2 ÷ 2 ＝ 6', '÷2 を忘れると 12', 'y軸を底辺にすると計算がラク') }
];
// ---- Section 9：文章題とグラフ ----
var TRIP = { xmin:0, xmax:50, ymin:0, ymax:2000, sx:5.6, sy:0.1, gx:10, gy:400, xt:[10,20,30,40,50], yt:[400,800,1200,1600,2000], xl:'分', yl:'m', maxw:380,
  segs:[[0,0,20,1600,OR],[20,1600,30,1600,OR],[30,1600,50,0,OR]], pts:[{x:20,y:1600,color:OR},{x:30,y:1600,color:OR}] };
QS[9] = [
  { q:'水そうに 10L の水が入っている。毎分 3L ずつ入れると、40L になるのは何分後？', a:'10 分後', choices:['10 分後','13 分後','30 分後','4 分後'],
    exp:E('求めたい量を y に入れて x を解く', '3x ＋ 10 ＝ 40 → 3x ＝ 30 → x ＝ 10', '10 を引き忘れると 13 分後', 'はじめの量を引いてから割る') },
  { q:'長さ 15cm の線香が毎分 0.5cm ずつ短くなる。全部燃えるのは何分後？', a:'30 分後', choices:['30 分後','7.5 分後','15 分後','14.5 分後'],
    exp:E('なくなる ＝ y が 0', '−0.5x ＋ 15 ＝ 0 → x ＝ 30', '× 0.5 ではなく ÷ 0.5', '「全部」「空」→ y に 0 を入れる') },
  { q:'おもりの重さ x g とばねの長さ y cm は一次関数で、x が 0, 10, 20 のとき y は 8, 10, 12。式は？', a:'y ＝ 0.2x ＋ 8', choices:['y ＝ 0.2x ＋ 8','y ＝ 2x ＋ 8','y ＝ 0.2x ＋ 10','y ＝ 8x ＋ 0.2'],
    exp:E('傾き ＝ y の増加量 ÷ x の増加量', '2 ÷ 10 ＝ 0.2、x ＝ 0 で y ＝ 8', 'x が 10 増えて y が 2 増える。2x ではない', '理科のばねと同じ形') },
  { q:'前の問題で、ばねの長さが 20cm になるおもりの重さは？', a:'60 g', choices:['60 g','12 g','100 g','40 g'],
    exp:E('y に 20 を入れて x を解く', '0.2x ＋ 8 ＝ 20 → 0.2x ＝ 12 → x ＝ 60', '12 は 0.2x の値で、まだ途中', '最後に ÷ 0.2 までやる') },
  { q:'A店は基本料金 1500 円＋1時間 200 円、B店は基本料金なしで1時間 500 円。料金が同じになるのは何時間使ったとき？', a:'5 時間', choices:['5 時間','3 時間','7 時間','2 時間'],
    exp:E('同じになる → 2つの式の交点', '200x ＋ 1500 ＝ 500x → 300x ＝ 1500 → x ＝ 5', '3 時間は 1500 ÷ 500 で、A店の時間料金を忘れている', '両方の式を作ってから ＝ でつなぐ') },
  { q:'前の問題で、8時間使うときはどちらが何円安い？', a:'A店が 900 円安い', choices:['A店が 900 円安い','B店が 900 円安い','A店が 300 円安い','同じ金額'],
    exp:E('それぞれの式に x ＝ 8 を入れて比べる', 'A：1600 ＋ 1500 ＝ 3100、B：4000、差 900', '大小を逆に読まない', '交点の右と左で、安い店が入れかわる') },
  { q:'グラフは、家から図書館へ行って帰るまでの時間 x 分と道のり y m を表す。行きの速さは？', svg:G(TRIP), a:'毎分 80m', choices:['毎分 80m','毎分 1600m','毎分 20m','毎分 40m'],
    exp:E('道のりのグラフでは、傾き ＝ 速さ', '1600 ÷ 20 ＝ 80', '目盛り1マスは横 10分、たて 400m', '坂が急なほど速い') },
  { q:'同じグラフで、図書館にいた時間は？', svg:G(TRIP), a:'10 分', choices:['10 分','20 分','30 分','50 分'],
    exp:E('平らなところ ＝ 止まっている', '20 分から 30 分まで', '20 や 30 は時刻（出発からの分）', '時間の長さは「あと − はじめ」') },
  { q:'同じグラフで、帰り（30≦x≦50）の式は？', svg:G(TRIP), a:'y ＝ −80x ＋ 4000', choices:['y ＝ −80x ＋ 4000','y ＝ 80x − 4000','y ＝ −80x ＋ 1600','y ＝ −80x ＋ 2400'],
    exp:E('線が y軸にとどいていない → 点を入れて b を出す', '傾き −1600 ÷ 20 ＝ −80、(50, 0) を入れて 0 ＝ −4000 ＋ b → b ＝ 4000', '帰りは右下がりなのでマイナス', '切片の 4000 は計算上の数（のばしたときの値）') },
  { q:'きょんは8時に家を出て毎分 60m で歩く。しゅんは8時10分に家を出て、毎分 100m で同じ道を追いかけた。追いつく時刻は？', a:'8時25分', choices:['8時25分','8時10分','8時15分','8時40分'],
    exp:E('追いつく → 交点。x は8時からの分', 'きょん y ＝ 60x、しゅん y ＝ 100x − 1000 → 60x ＝ 100x − 1000 → x ＝ 25', 'しゅんの式は x ＝ 10 で y ＝ 0 になるように作る', '出発が遅い人は切片がマイナス') },
  { q:'前の問題で、追いついた場所は家から何m？', a:'1500 m', choices:['1500 m','600 m','2500 m','1000 m'],
    exp:E('x を y の式に入れる', '60 × 25 ＝ 1500', '時刻を答えたら場所も忘れずに', 'しゅんの式でも 2500 − 1000 ＝ 1500 ✓') },
  { q:'長方形 ABCD（AB＝4cm、BC＝6cm）で、点 P は A を出発し、B、C を通って D まで毎秒 1cm で進む。x 秒後の △APD の面積を y cm² とする。x ＝ 2 のときの y は？', a:'6', choices:['6','12','3','4'],
    exp:E('底辺 AD ＝ 6、高さ ＝ AP ＝ x', '6 × 2 ÷ 2 ＝ 6', '÷2 を忘れない', 'P が AB の上：y ＝ 3x') },
  { q:'同じ図で、x ＝ 7 のときの y は？', a:'12', choices:['12','21','7','24'],
    exp:E('P が BC の上：高さはずっと AB ＝ 4', '6 × 4 ÷ 2 ＝ 12', '3x に入れて 21 にしない（式が変わる）', 'P がいる辺ごとに式が変わる') },
  { q:'同じ図で、x ＝ 12 のときの y は？', a:'6', choices:['6','36','12','3'],
    exp:E('P が CD の上：高さ ＝ PD ＝ 14 − x', 'PD ＝ 2、6 × 2 ÷ 2 ＝ 6', '36 は 3x に入れたときの数', '全体 14 秒から引くと残りの長さ') },
  { q:'同じ図で、グラフの形は？', a:'上がる → 平ら → 下がる の折れ線', choices:['上がる → 平ら → 下がる の折れ線','ずっと右上がりの直線','ずっと右下がりの直線','放物線'],
    exp:E('高さが変わるときは坂、高さが同じなら平ら', 'AB で増え、BC で一定、CD で減る', '動く点は1本の直線にならない', '入試の大問2でよく出る形') },
  { q:'同じ図で、P が辺 CD の上にあるとき（10≦x≦14）の y の式は？', a:'y ＝ −3x ＋ 42', choices:['y ＝ −3x ＋ 42','y ＝ 3x','y ＝ −3x ＋ 14','y ＝ 12'],
    exp:E('高さ PD ＝ 14 − x を面積の式に入れる', 'y ＝ 6 × (14 − x) ÷ 2 ＝ −3x ＋ 42', '14 にしない（3 × 14 ＝ 42）', 'x ＝ 10 で 12、x ＝ 14 で 0 になるか確かめる') }
];
// ---- Section 5：確認テスト ----
QS[5] = [
  { q:'y が x の一次関数であるものは？', a:'y ＝ −x ＋ 1', choices:['y ＝ −x ＋ 1','y ＝ x² − 1','y ＝ 6/x','y ＝ 9'],
    exp:E('y ＝ ax ＋ b の形', 'a ＝ −1、b ＝ 1', '2乗・分母の x・x なしは✕', 'x が1回だけかけ算で出る') },
  { q:'y ＝ 4x − 7 の傾きと切片は？', a:'傾き 4、切片 −7', choices:['傾き 4、切片 −7','傾き −7、切片 4','傾き 4、切片 7','傾き −4、切片 7'],
    exp:E('x の前が傾き、残りが切片', '傾き 4、切片 −7', '− を落とさない', '符号も切片の一部') },
  { q:'y ＝ −5x ＋ 2 の変化の割合は？', a:'−5', choices:['−5','5','2','−3'],
    exp:E('変化の割合 ＝ a', 'a ＝ −5', '切片の 2 と混ぜない', '一次関数ではいつも同じ') },
  { q:'y ＝ 3x ＋ 1 で、x の増加量が 4 のときの y の増加量は？', a:'12', choices:['12','13','7','4'],
    exp:E('y の増加量 ＝ a × x の増加量', '3 × 4 ＝ 12', '切片はたさない', '増えた分だけを見る') },
  { q:'x が 2 から 6 まで増えると、y が 3 から 11 まで増える一次関数の変化の割合は？', a:'2', choices:['2','8','1/2','4'],
    exp:E('(y の増加量) ÷ (x の増加量)', '8 ÷ 4 ＝ 2', '8 は y の増加量だけ', 'y が上、x が下') },
  { q:'y ＝ −1/3 x ＋ 2 のグラフの進み方は？', a:'右に3進むと下に1', choices:['右に3進むと下に1','右に3進むと上に1','右に1進むと下に3','右に1進むと上に3'],
    exp:E('分母が右、分子が上下、マイナスは下', '右に3、下に1', '右に1、下に3 は傾き −3', '分母は地面を進む数') },
  { q:'y ＝ x ＋ 5 のグラフが y軸と交わる点は？', a:'(0, 5)', choices:['(0, 5)','(5, 0)','(0, 1)','(1, 5)'],
    exp:E('切片の点は (0, b)', 'b ＝ 5', '(5, 0) は x と y が逆', 'y軸の上は x ＝ 0') },
  { q:'グラフの直線の式は？', svg:line(2,-3,[[0,-3],[1,-1]]), a:'y ＝ 2x − 3', choices:['y ＝ 2x − 3','y ＝ 2x ＋ 3','y ＝ −2x − 3','y ＝ 3x − 2'],
    exp:E('切片 → 傾き の順に読む', '切片 −3、右に1で上に2', '切片を x軸で読まない', 'y軸 → 坂') },
  { q:'グラフの直線の式は？', svg:line(-0.5,2,[[0,2],[2,1]]), a:'y ＝ −1/2 x ＋ 2', choices:['y ＝ −1/2 x ＋ 2','y ＝ 1/2 x ＋ 2','y ＝ −2x ＋ 2','y ＝ −1/2 x − 2'],
    exp:E('角をぴったり通る点で読む', '(0, 2) → (2, 1)：右に2、下に1 → −1/2', '「右 ÷ 上」で −2 にしない', '傾きは 上 ÷ 右') },
  { q:'傾きが 4 で、点 (1, 2) を通る直線の式は？', a:'y ＝ 4x − 2', choices:['y ＝ 4x − 2','y ＝ 4x ＋ 2','y ＝ 2x ＋ 4','y ＝ 4x − 1'],
    exp:E('点を入れて b を出す', '2 ＝ 4 ＋ b → b ＝ −2', '点の y を切片にしない', '確かめ：4 − 2 ＝ 2 ✓') },
  { q:'2点 (2, 1)、(4, 7) を通る直線の式は？', a:'y ＝ 3x − 5', choices:['y ＝ 3x − 5','y ＝ 3x ＋ 1','y ＝ 6x − 11','y ＝ 2x − 3'],
    exp:E('傾き → 点を入れる', '傾き 6 ÷ 2 ＝ 3、1 ＝ 6 ＋ b → b ＝ −5', '6 は y の増加量だけ', '確かめ：12 − 5 ＝ 7 ✓') },
  { q:'2点 (−2, 7)、(1, −2) を通る直線の式は？', a:'y ＝ −3x ＋ 1', choices:['y ＝ −3x ＋ 1','y ＝ 3x ＋ 13','y ＝ −3x ＋ 7','y ＝ −x ＋ 5'],
    exp:E('引く順番をそろえる', '傾き (−2 − 7) ÷ (1 − (−2)) ＝ −3、−2 ＝ −3 ＋ b → b ＝ 1', '1 − (−2) ＝ 3（−1 ではない）', '確かめ：6 ＋ 1 ＝ 7 ✓') },
  { q:'y ＝ 5x − 1 に平行で、点 (1, 7) を通る直線の式は？', a:'y ＝ 5x ＋ 2', choices:['y ＝ 5x ＋ 2','y ＝ 5x − 1','y ＝ 5x ＋ 7','y ＝ x ＋ 6'],
    exp:E('平行 → 傾きが同じ', '7 ＝ 5 ＋ b → b ＝ 2', '切片までは同じにしない', '「平行」＝傾きをもらう') },
  { q:'y ＝ 2x ＋ 1 で、0≦x≦3 のときの y の変域は？', a:'1≦y≦7', choices:['1≦y≦7','0≦y≦3','0≦y≦7','1≦y≦3'],
    exp:E('両はしを代入', 'x ＝ 0 → 1、x ＝ 3 → 7', 'x の変域をそのまま書かない', '直線は両はしが最小・最大') },
  { q:'3x ＋ y ＝ 2 を y について解くと？', a:'y ＝ −3x ＋ 2', choices:['y ＝ −3x ＋ 2','y ＝ 3x ＋ 2','y ＝ 3x − 2','y ＝ −3x − 2'],
    exp:E('y だけ左に残す', '3x を右へ移項', '符号を変え忘れない', '動かしたら符号チェンジ') },
  { q:'方程式 x ＝ 4 のグラフは？', a:'y軸に平行な直線', choices:['y軸に平行な直線','x軸に平行な直線','傾き 4 の直線','原点を通る直線'],
    exp:E('x ＝ ○ はたて線', 'よこの位置がいつも 4', '「x だから横線」は✕', 'y がなんでも x は 4') },
  { q:'2直線 y ＝ 3x − 2、y ＝ x ＋ 4 の交点の座標は？', a:'(3, 7)', choices:['(3, 7)','(7, 3)','(2, 6)','(3, 5)'],
    exp:E('右辺どうしを ＝ でつなぐ', '3x − 2 ＝ x ＋ 4 → x ＝ 3、y ＝ 7', 'x だけで終わらない', 'もう一方でも確かめ：9 − 2 ＝ 7 ✓') },
  { q:'水が 8L 入った水そうから、毎分 2L ずつ水をぬく。空になるのは何分後？', a:'4 分後', choices:['4 分後','16 分後','6 分後','10 分後'],
    exp:E('空 ＝ y が 0', '−2x ＋ 8 ＝ 0 → x ＝ 4', '8 × 2 にしない', '「空」→ y に 0') },
  { q:'入場料 300 円で、1回乗るごとに 50 円かかる。x 回乗ったときの代金 y 円の式は？', a:'y ＝ 50x ＋ 300', choices:['y ＝ 50x ＋ 300','y ＝ 300x ＋ 50','y ＝ 350x','y ＝ 50x − 300'],
    exp:E('1回ごとが a、はじめが b', 'a ＝ 50、b ＝ 300', '入れかえない', '「ごと」がつく数が x の前') },
  { q:'長方形 ABCD（AB＝3cm、BC＝8cm）で、点 P が A から B へ毎秒 1cm で動く。2 秒後の △APD の面積は？', a:'8 cm²', choices:['8 cm²','4 cm²','16 cm²','12 cm²'],
    exp:E('底辺 AD ＝ 8、高さ AP ＝ 2', '8 × 2 ÷ 2 ＝ 8', '÷2 を忘れると 16', 'P が AB の上なら高さは AP') }
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
  correct: ['きょん「やった！天才かも！！」','きょん「にっくんより賢くなったかも！」','きょん「グラフ、読めてきた！！」','西村「正解。よく見えてるね」','西村「できてる。その調子」'],
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
  { id:0, label:'📈 スタート',   title:'一次関数は2つだけ見ればいい', sub:'式は y ＝ ax ＋ b だけ。決めるのは a と b の2つ' },
  { id:1, label:'一次関数とは',  title:'一次関数ってなに？',          sub:'式の形で見分ける・文章から式を作る' },
  { id:2, label:'変化の割合',    title:'変化の割合',                  sub:'x が増えると y はどれだけ増える？' },
  { id:3, label:'グラフ',        title:'グラフを読む・かく',          sub:'切片に点を打って、坂をのぼる' },
  { id:4, label:'式を作る',      title:'直線の式を作る',              sub:'グラフや点から式を作る。ここがいちばん大事' },
  { id:8, label:'方程式と交点',  title:'方程式とグラフ・交点',        sub:'たて線・横線と、2本の直線の交わるところ' },
  { id:9, label:'文章題',        title:'文章題とグラフ',              sub:'水そう・料金・速さ・動く点' },
  { id:5, label:'確認テスト',    title:'確認テスト',                  sub:'全部まとめて20問。ゆっくりでOK' },
  { id:6, label:'📊弱点',        title:'弱点ノート',                  sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',        title:'弱点特訓モード',              sub:'弱点問題だけを集中練習！' }
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
  localStorage.setItem('math_lin_sections', JSON.stringify(sectionDone));
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
    + '<div class="section-badge">数学 一次関数 · SECTION ' + idx + '</div>'
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
  kuru:  { av:'🎤', cls:'', style:'background:#ffb347;color:#111', name:'くるま' }
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
    chat('kyon', 'グラフが出てきた瞬間に、頭がまっしろになるんだよ…'),
    chat('nishi', '大丈夫。一次関数の式は <b>y ＝ ax ＋ b</b> の形しかない。決めるのは <b>a と b の2つだけ</b>だ'),
    chat('shun', 'きょんさん、言うたら b はスタート地点、a はそこからの坂のきつさです。漫才でいうたら、b がツカミで、a がそのあとの盛り上がり方ですわ'),
    chat('kyon', '俺のツカミ、だいたいマイナスなんだけど'),
    chat('nishi', '切片がマイナスでも、傾きが大きければ巻き返せる。数学的にはな')
  ])
  + card('📈 見るところは2つだけ',
    grid({ lines:[{a:2,b:1,color:OR}], pts:[{x:0,y:1,color:YE,label:'切片 1',dx:-8,dy:-8,anchor:'end'},{x:1,y:3,color:OR}], stairs:[{from:[0,1],dx:1,dy:2,tr:'右に1',tu:'上に2'}] })
    + '<div class="qd-big" style="text-align:center">y ＝ 2x ＋ 1</div>'
    + table([['<span class="nw">名前</span>','グラフで見るところ'],['<span class="nw">切片 b</span>','線が <b>y軸（たて軸）</b>とぶつかる目盛り'],['<span class="nw">傾き a</span>','<b>右に1</b>進むと<b>上にいくつ</b>（下がるならマイナス）']]))
  + '<button class="start-btn" data-goto="1">📈 一次関数とは から始める →</button>';
};
INTRO[1] = function() {
  return talk([
    chat('kyon', '一次関数と比例って、何がちがうの？'),
    chat('nishi', '比例 y ＝ ax に「＋ b」がついただけだ。比例は <b>b ＝ 0 の一次関数</b>だよ')
  ])
  + card('📐 式の形で見分ける',
    table([['式','一次関数？','理由'],
      ['y ＝ 3x ＋ 2','<span class="ln-ok">⭕</span>','a ＝ 3、b ＝ 2'],
      ['y ＝ 5x','<span class="ln-ok">⭕</span>','b ＝ 0 の形（比例）'],
      ['y ＝ −x ＋ 4','<span class="ln-ok">⭕</span>','a ＝ −1、b ＝ 4'],
      ['y ＝ x²','<span class="ln-ng">✕</span>','x が2乗'],
      ['y ＝ 6/x','<span class="ln-ng">✕</span>','x が分母（反比例）'],
      ['y ＝ 7','<span class="ln-ng">✕</span>','x がない']]))
  + card('📐 文章から式を作る',
    table([['文章の言葉','式のどこ'],['はじめの量・基本料金','b（x ＝ 0 のときの量）'],['毎分・1個ごと・1GBごと','a（増えるならプラス、減るならマイナス）']])
    + '<div class="rule-box"><div class="ex">はじめ 5L、毎分 2L 入れる → y ＝ 2x ＋ 5</div><div class="ex">はじめ 20cm、毎分 2cm 短くなる → y ＝ −2x ＋ 20</div></div>');
};
INTRO[2] = function() {
  return talk([
    chat('kyon', '「変化の割合」って名前がもうむずかしい'),
    chat('nishi', '「x が 1 増えると y がいくつ増えるか」のことだ。一次関数では <b>a（傾き）と同じ</b>になる')
  ])
  + card('📐 変化の割合 ＝ (y の増加量) ÷ (x の増加量)',
    table([['x','0','1','2','3'],['y ＝ 2x ＋ 1','1','3','5','7']], 'center')
    + '<div class="rule-box"><div class="ex">x が 1 増えるたびに y は 2 増える → 変化の割合は <b>2</b></div><div class="ex">x が 3 増えたら → y は 2 × 3 ＝ <b>6</b> 増える</div><div class="note">⚠️ 増加量は「あとの値 − はじめの値」。−1 から 3 までなら 3 − (−1) ＝ 4</div></div>');
};
INTRO[3] = function() {
  return talk([
    chat('kuru', 'きょんさん、グラフは「最初にどこに立つか」と「どっちに歩くか」だけっすよ！僕なんか自分の切片、いまだにどこかわかってないっすけど！'),
    chat('kyon', 'くるま、それは数学じゃなくて人生の話だろ')
  ])
  + card('📐 グラフのかき方：3ステップ',
    grid({ lines:[{a:2/3,b:1,color:OR}], pts:[{x:0,y:1,color:YE,label:'① 切片',dx:-8,dy:-8,anchor:'end'},{x:3,y:3,color:OR,label:'②',dx:-6,dy:-9,anchor:'end'}], stairs:[{from:[0,1],dx:3,dy:2,tr:'右に3',tu:'上に2'}] })
    + '<div class="qd-big" style="text-align:center">y ＝ 2/3 x ＋ 1</div>'
    + '<div class="rule-box"><div class="ex">① 切片 (0, b) に点を打つ</div><div class="ex">② そこから「右に進む・上下に動く」で2つ目の点を打つ</div><div class="ex">③ 2点を結ぶ</div><div class="note">💡 傾きが分数のときは 分母が右、分子が上。2/3 なら右に3、上に2</div></div>')
  + card('📐 傾きで線の形が決まる',
    table([['傾き a','<span class="nw">線の形</span>'],['プラス','<span class="nw">右上がり</span>'],['マイナス','<span class="nw">右下がり</span>'],['マイナスをとった数が大きい','<span class="nw">坂が急</span>'],['2本の a が同じ','<span class="nw">平行</span>']]));
};
INTRO[4] = function() {
  return talk([
    chat('kyon', 'ここだよ！グラフを見て「式を求めなさい」が全然できない'),
    chat('nishi', 'わかっていることは5パターンしかない。下の表のどれかに当てはめればいい'),
    chat('shun', 'きょんさん、どれも最後は「a と b を見つける」だけです。犯人2人のうち、1人つかまえたらもう1人は自白してくれるようなもんですわ')
  ])
  + card('📐 わかっていること → やること',
    table([['わかっていること','やること'],
      ['① 傾きと切片','そのまま a と b に入れる'],
      ['② 傾きと通る1点','y ＝ ax ＋ b に点を入れて b を出す'],
      ['③ 通る2点','先に傾きを出す → あとは ②'],
      ['④ グラフ（y軸で読める）','切片と傾きを読む → あとは ①'],
      ['⑤ グラフ（y軸で読めない）','角をぴったり通る2点をさがす → あとは ③']])
    + '<div class="rule-box"><div class="ex">⚠️ 通る点の y は、切片ではない</div><div class="note">切片は <b>x ＝ 0 のときの y</b> だけ。点 (1, 5) の 5 は x ＝ 1 のときの y なので切片ではない。点 (0, 5) なら切片は 5。</div></div>')
  + card('🔍 例題A：y軸で読めるグラフ（④）',
    grid({ lines:[{a:3,b:-2,color:OR}], pts:[{x:0,y:-2,color:OR,label:'(0, −2)',dx:-8,dy:-9,anchor:'end'},{x:1,y:1,color:OR,label:'(1, 1)',dx:8,dy:4}], stairs:[{from:[0,-2],dx:1,dy:3,tr:'右に1',tu:'上に3'}] })
    + step('STEP 1　y軸とぶつかるところは？（タップ）', 'y軸の <b>−2</b> → <b>切片は −2</b>')
    + step('STEP 2　右に1進むと、上にいくつ？（タップ）', '(0, −2) から右に1で (1, 1)。<b>上に3</b> → <b>傾きは 3</b>')
    + step('STEP 3　式にする（タップ）', '<div class="qd-big">y ＝ 3x − 2</div>確かめ：(1, 1) を入れると 3 − 2 ＝ 1 ✓'))
  + card('🔍 例題B：y軸で読めないグラフ（⑤）',
    grid({ lines:[{a:0.5,b:1.5,color:BL}], pts:[{x:1,y:2,color:BL,label:'(1, 2)',dx:-4,dy:-9,anchor:'end'},{x:3,y:3,color:BL,label:'(3, 3)',dx:8,dy:-6}], stairs:[{from:[1,2],dx:2,dy:1,tr:'右に2',tu:'上に1'}] })
    + '<div class="rule-box"><div class="ex">y軸では 1 と 2 の間を通っている → 目分量で読まない！</div></div>'
    + step('STEP 1　角をぴったり通る2点をさがす（タップ）', '<b>(1, 2)</b> と <b>(3, 3)</b>')
    + step('STEP 2　傾きを出す（タップ）', '右に2で上に1 → 傾き ＝ 1 ÷ 2 ＝ <b>1/2</b>')
    + step('STEP 3　点を入れて切片を出す（タップ）', 'y ＝ 1/2 x ＋ b に (1, 2) を入れる<br>2 ＝ 1/2 ＋ b<br>b ＝ 2 − 1/2 ＝ <b>3/2</b>')
    + step('STEP 4　式にして確かめる（タップ）', '<div class="qd-big">y ＝ 1/2 x ＋ 3/2</div>確かめ：(3, 3) を入れると 3/2 ＋ 3/2 ＝ 3 ✓'))
  + card('🔍 例題C：線が y軸にとどいていないグラフ（⑤）',
    grid({ lines:[{a:1.5,b:-3,x1:2,x2:4,color:OR},{a:1.5,b:-3,x1:0,x2:2,color:OR,dash:true}], pts:[{x:2,y:0,color:OR,label:'(2, 0)',dx:8,dy:14},{x:4,y:3,color:OR,label:'(4, 3)',dx:-8,dy:-8,anchor:'end'},{x:0,y:-3,color:YE,label:'切片 −3',dx:8,dy:14}], stairs:[{from:[2,0],dx:2,dy:3,tr:'右に2',tu:'上に3'}] })
    + step('方法①　点を入れて計算する（タップ）', '傾き ＝ 3 ÷ 2 ＝ <b>3/2</b><br>y ＝ 3/2 x ＋ b に (2, 0) を入れる<br>0 ＝ 3 ＋ b → <b>b ＝ −3</b>')
    + step('方法②　線を y軸までのばす（タップ）', '「右に2で上に3」の坂を逆にたどると「<b>左に2で下に3</b>」。<br>(2, 0) から左に2もどると y軸に着いて、下に3 → <b>y軸の −3</b>（点線）')
    + '<div class="qd-big" style="text-align:center">y ＝ 3/2 x − 3</div>'
    + '<div class="rule-box"><div class="note">💡 文章題のグラフの長い例は <a href="math_c3_quadratic.html#taisaku" style="color:var(--gold)">学習診断テスト対策</a> にもあるよ</div></div>');
};
INTRO[8] = function() {
  return talk([
    chat('kyon', 'x ＝ 2 って、x だから横線でしょ？'),
    chat('nishi', 'よくあるまちがいだ。「x がいつも 2」の点を集めると、<b>たて</b>に並ぶ。下の図で確かめよう')
  ])
  + card('📐 式の形 → グラフ',
    grid({ lines:[{a:0,b:3,color:OR,label:'y ＝ 3',lx:-46,ly:-8}], vlines:[{x:2,color:BL,label:'x ＝ 2'}], pts:[{x:2,y:3,color:YE,label:'交点 (2, 3)',dx:-8,dy:-9,anchor:'end'}] })
    + table([['式の形','すること','グラフ'],
      ['2x ＋ y ＝ 5','y について解く：y ＝ −2x ＋ 5','ふつうの直線'],
      ['y ＝ 3','そのまま','x軸に平行（横線）'],
      ['x ＝ 2','そのまま','y軸に平行（たて線）']]))
  + card('📐 交点 ＝ 2つの式を両方みたす点',
    '<div class="rule-box"><div class="ex">y ＝ x ＋ 1 と y ＝ −2x ＋ 7</div><div class="ex">どちらも「y ＝」なので右辺をつなぐ</div><div class="ex">x ＋ 1 ＝ −2x ＋ 7 → 3x ＝ 6 → x ＝ 2</div><div class="ex">y ＝ 2 ＋ 1 ＝ 3 → 交点 (2, 3)</div><div class="note">💡 連立方程式の解と同じもの。x が出たら y まで出して (x, y) で答える</div></div>');
};
INTRO[9] = function() {
  return talk([
    chat('kuru', 'きょんさん、文章題は「はじめ」と「毎分」を見つけるだけっす！僕これ、漫才の設定を作るときと一緒だと思ってるんすよ'),
    chat('kyon', 'お前の漫才、そんな式でできてたの！？'),
    chat('nishi', '問題の言葉を、グラフの言葉に置きかえよう。対応は下の表の4つだ')
  ])
  + card('📐 問題の言葉 → 式・グラフ',
    table([['問題の言葉','式・グラフ'],
      ['はじめの量・基本料金','切片'],
      ['毎分・1時間あたり・速さ','傾き'],
      ['追いつく・同じになる','交点（2つの式を ＝ でつなぐ）'],
      ['○○になるのはいつ','y に ○○ を入れて x を解く']]))
  + card('🔍 動く点と面積（入試の大問2に出る形）',
    '<div class="rule-box"><div class="ex">長方形 ABCD（AB＝4、BC＝6）。P が A → B → C → D と毎秒 1cm で動く。△APD の面積 y は？</div></div>'
    + '<div class="ln-figs">'
    + rectFig(0, 0.5, 'P が AB の上<br>y ＝ 3x')
    + rectFig(0.5, 1, 'P が BC の上<br>y ＝ 12')
    + rectFig(1, 0.5, 'P が CD の上<br>y ＝ −3x ＋ 42')
    + '</div>'
    + G({ xmin:0, xmax:14, ymin:0, ymax:14, sx:20, sy:14, gx:2, gy:2, xt:[2,4,6,8,10,12,14], yt:[4,8,12], xl:'秒', yl:'cm²', maxw:380, segs:[[0,0,4,12,BL],[4,12,10,12,BL],[10,12,14,0,BL]], pts:[{x:4,y:12,color:BL,label:'(4, 12)',dx:-4,dy:-9,anchor:'end'},{x:10,y:12,color:BL,label:'(10, 12)',dx:4,dy:-9}] })
    + '<div class="rule-box"><div class="note">💡 底辺 AD はずっと 6。変わるのは<b>高さ</b>だけ。P がどの辺にいるかで式が変わるので、辺ごとに分けて考える</div></div>');
};
INTRO[5] = function() {
  return talk([ chat('nishi', 'ここまでの総まとめだ。時間は気にしなくていい。迷ったらメモに図をかいて考えよう') ]);
};

// ===== 確認テストの結果 =====
function showFinalResult() {
  var correct = 0, total = 0;
  QS[5].forEach(function(q) {
    if (answeredSet[q._qid]) { total++; var d = weakDB[q._qid]; if (d && d.correct > 0) correct++; }
  });
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '📺' : '🎤';
  var msg = pct >= 90 ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。一次関数は君のものだね」'
    : pct >= 70 ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50 ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。弱点ノートから見直そう」'
    : 'きょん「むずっ…でもここから這い上がる！！」<br>西村「「式を作る」の表にもどって、もう一度やってみよう」';
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
    localStorage.setItem('math_lin_sections', JSON.stringify(sectionDone));
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

// ===== 特訓モード（グラフも解説も QBANK から出す） =====
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
