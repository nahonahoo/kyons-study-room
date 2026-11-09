// 数学 中2「式の計算」単独ページ（2026-11-08 新規）
// qid: math_expr_s{セクションid}_q{番号}。問題は末尾に足す（途中に入れると記録がずれる）
// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「式の計算？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺文字に強いかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「文字式で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' }
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var PREFIX = 'math_expr_';
var xp           = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('math_expr_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_expr_sections') || '{}');
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
function saveAnswered() { localStorage.setItem('math_expr_answered', JSON.stringify(answeredSet)); }
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
    if (/[\dA-Za-z²³)]\/[\dA-Za-zπ]/.test(n.nodeValue) && !n.parentNode.closest('svg')) list.push(n);
  }
  list.forEach(function(t) {
    var span = document.createElement('span');
    span.innerHTML = t.nodeValue.replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/(\([^()]+\)|\d*[A-Za-z]+[²³]?[a-z]*[²³]?|\d+)\/(\d+[A-Za-zπ²³]*|[A-Za-zπ][A-Za-zπ²³]*)/g, function(m, a, b) {
        return '<span class="ln-frac"><span>' + a.replace(/^\(|\)$/g, '') + '</span><span>' + b + '</span></span>';
      });
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

// ===== 問題データ =====
var QS = {};
// ---- Section 1：言葉の整理 ----
QS[1] = [
  { q:'単項式はどれ？', a:'−5ab', choices:['−5ab','2x ＋ 3','a − b','x ＋ y ＋ 1'],
    exp:E('単項式 ＝ 数や文字のかけ算だけでできた式', '−5ab は −5 × a × b', '＋ や − でつながっていたら多項式', 'つなぎ目があるかを見る') },
  { q:'多項式はどれ？', a:'a² − 3b', choices:['a² − 3b','4xy','−7','x²'],
    exp:E('多項式 ＝ 単項式がたし算の形でつながった式', 'a² と −3b の2つがつながっている', '−7 のマイナスはつなぎ目ではなく、数の符号', '項が2つ以上なら多項式') },
  { q:'2x − 3y ＋ 5 の項は？', a:'2x、−3y、5', choices:['2x、−3y、5','2x、3y、5','2x、−3y','2x、3y、−5'],
    exp:E('項は符号もいっしょに切り取る', '2x ＋ (−3y) ＋ 5 と考える', '− を置いていかない', '数だけの項も1つの項') },
  { q:'単項式 3a²b の次数は？', a:'3', choices:['3','2','1','6'],
    exp:E('次数 ＝ かけられている文字の個数', 'a × a × b で3個', '数の 3 は数えない', '文字だけを数える') },
  { q:'単項式 −2xy の次数は？', a:'2', choices:['2','1','−2','3'],
    exp:E('次数 ＝ かけられている文字の個数', 'x と y で2個', '−2 は数なので関係ない', '文字が何人いるか') },
  { q:'単項式 5x の次数は？', a:'1', choices:['1','5','0','2'],
    exp:E('次数 ＝ かけられている文字の個数', 'x が1個', '5 は数', '文字1個なら1次') },
  { q:'多項式 x² − 3xy ＋ 2y の次数は？', a:'2', choices:['2','1','3','5'],
    exp:E('多項式の次数 ＝ 項の中でいちばん大きい次数', 'x² は2、−3xy は2、2y は1 → 最大は2', '全部たして 5 にしない', '合計ではなく最大') },
  { q:'4x³ − x² ＋ 7 は何次式？', a:'3次式', choices:['3次式','2次式','5次式','1次式'],
    exp:E('いちばん大きい次数で呼ぶ', '4x³ の次数3が最大', '3 ＋ 2 で 5次式にしない', '「○次式」は最大の次数') },
  { q:'3a ＋ 2b − a で、同類項の組はどれ？', a:'3a と −a', choices:['3a と −a','3a と 2b','2b と −a','同類項はない'],
    exp:E('同類項 ＝ 文字の部分がまったく同じ項', 'どちらも a だけ', '文字がちがえば別の人', 'a さんと b さんは別人') },
  { q:'2x² と 5x は同類項？', a:'同類項ではない（次数がちがう）', choices:['同類項ではない（次数がちがう）','同類項である（どちらも x があるから）','同類項である（係数がちがうだけ）','同類項ではない（係数がちがう）'],
    exp:E('文字が同じでも、次数がちがえば別物', 'x² は x × x、x は x 1個', '「x があるから同じ」ではない', 'x² は x さん2人組のコンビ') },
  { q:'xy と 3yx は同類項？', a:'同類項である（かける順番がちがうだけ）', choices:['同類項である（かける順番がちがうだけ）','同類項ではない（文字の順番がちがう）','同類項ではない（係数がちがう）','同類項である（どちらも3次だから）'],
    exp:E('かけ算は順番を入れかえても同じ', 'yx ＝ xy なので同類項', '順番だけで別物にしない', 'まとめると 4xy') }
];
// ---- Section 2：たし算・ひき算 ----
QS[2] = [
  { q:'5x ＋ 3y ＋ 2x − y を計算すると？', a:'7x ＋ 2y', choices:['7x ＋ 2y','7x ＋ 3y','9xy','7x ＋ 4y'],
    exp:E('同じ文字どうしだけまとめる', '5x ＋ 2x ＝ 7x、3y − y ＝ 2y', 'x と y はくっつけない', 'y は 1y') },
  { q:'3a² ＋ 2a − a² ＋ 4a を計算すると？', a:'2a² ＋ 6a', choices:['2a² ＋ 6a','8a³','3a² ＋ 6a','2a² ＋ 2a'],
    exp:E('a² と a は別の仲間', '3a² − a² ＝ 2a²、2a ＋ 4a ＝ 6a', 'a² と a を合体させない', '−a² は −1a²') },
  { q:'(3x ＋ 2y) ＋ (x − 5y) を計算すると？', a:'4x − 3y', choices:['4x − 3y','4x ＋ 7y','3x − 3y','2x − 3y'],
    exp:E('前が ＋ のかっこは、そのままはずす', '3x ＋ x ＝ 4x、2y − 5y ＝ −3y', '2y − 5y を 7y にしない', '小さい数から大きい数を引くとマイナス') },
  { q:'(4a − b) − (2a ＋ 3b) を計算すると？', a:'2a − 4b', choices:['2a − 4b','2a ＋ 2b','6a − 4b','2a − 2b'],
    exp:E('前が − のかっこは、中の符号を全部変える', '4a − b − 2a − 3b ＝ 2a − 4b', 'うしろの ＋3b を変え忘れない', '− は全員に配る') },
  { q:'(2x − 3y) − (x − 5y) を計算すると？', a:'x ＋ 2y', choices:['x ＋ 2y','x − 8y','3x − 8y','x − 2y'],
    exp:E('− のかっこ：−5y は ＋5y になる', '2x − 3y − x ＋ 5y ＝ x ＋ 2y', '−5y をそのままにすると −8y になる', 'マイナスのマイナスはプラス') },
  { q:'(x² ＋ 3x − 2) − (2x² − x ＋ 4) を計算すると？', a:'−x² ＋ 4x − 6', choices:['−x² ＋ 4x − 6','−x² ＋ 2x − 6','3x² ＋ 4x ＋ 2','−x² ＋ 4x ＋ 2'],
    exp:E('かっこの中の3つ全部の符号を変える', 'x² ＋ 3x − 2 − 2x² ＋ x − 4', '−x を変え忘れると 2x', '項が3つあっても全員に配る') },
  { q:'ab ＋ 3ba を計算すると？', a:'4ab', choices:['4ab','3ab','4a²b²','2ab'],
    exp:E('ba ＝ ab なので同類項', 'ab は 1ab、1 ＋ 3 ＝ 4', 'たし算で文字の数を増やさない', '文字はふつうアルファベット順に書く') },
  { q:'7x − 2y − (3x − 4y) を計算すると？', a:'4x ＋ 2y', choices:['4x ＋ 2y','4x − 6y','10x − 6y','4x − 2y'],
    exp:E('かっこをはずしてからまとめる', '7x − 2y − 3x ＋ 4y ＝ 4x ＋ 2y', '−4y のままにしない', 'かっこはずし → まとめる の順番') },
  { q:'これ以上まとめられない式はどれ？', a:'3x ＋ 2y', choices:['3x ＋ 2y','3x ＋ 2x','xy ＋ 2yx','4a² − a²'],
    exp:E('文字の部分がちがうと、まとめられない', '3x と 2y は別の人', 'xy と yx は同じ人', '答えが2つの項で残るのは正常') },
  { q:'2a ＋ 3b から a − b をひいた式は？', a:'a ＋ 4b', choices:['a ＋ 4b','a ＋ 2b','3a ＋ 2b','a − 4b'],
    exp:E('「ひく」はかっこをつけて書く', '(2a ＋ 3b) − (a − b) ＝ a ＋ 4b', 'かっこを書かないと −b の符号でまちがえる', '式全体を引くときは必ずかっこ') },
  { q:'ある式に 2x − y をたすと 5x ＋ 3y になった。ある式は？', a:'3x ＋ 4y', choices:['3x ＋ 4y','3x ＋ 2y','7x ＋ 2y','3x − 4y'],
    exp:E('もとの式 ＝ 答え − たした式', '(5x ＋ 3y) − (2x − y) ＝ 3x ＋ 4y', 'たしてしまうと 7x ＋ 2y', 'たしたものを引くと元にもどる') }
];
// ---- Section 3：数×多項式・分数の式 ----
QS[3] = [
  { q:'3(2x − y) を計算すると？', a:'6x − 3y', choices:['6x − 3y','6x − y','5x − 3y','6x ＋ 3y'],
    exp:E('かっこの外の数は、中の全員にかける', '3 × 2x ＝ 6x、3 × (−y) ＝ −3y', 'うしろにかけ忘れない', '全員に配る') },
  { q:'−2(3a − 4b) を計算すると？', a:'−6a ＋ 8b', choices:['−6a ＋ 8b','−6a − 8b','6a − 8b','−6a − 4b'],
    exp:E('マイナスの数も全員にかける', '−2 × (−4b) ＝ ＋8b', 'マイナス × マイナスはプラス', '符号を先に決めてから数をかける') },
  { q:'(6x ＋ 9y) ÷ 3 を計算すると？', a:'2x ＋ 3y', choices:['2x ＋ 3y','2x ＋ 9y','18x ＋ 27y','2x − 3y'],
    exp:E('わり算も全員を割る', '6x ÷ 3 ＝ 2x、9y ÷ 3 ＝ 3y', '前だけ割らない', '分配はかけ算もわり算も同じ') },
  { q:'(4a − 8b) ÷ (−2) を計算すると？', a:'−2a ＋ 4b', choices:['−2a ＋ 4b','2a − 4b','−2a − 4b','−2a − 8b'],
    exp:E('マイナスで割ると全員の符号が変わる', '4a ÷ (−2) ＝ −2a、−8b ÷ (−2) ＝ ＋4b', '片方だけ符号を変えない', '割る数がマイナス → 全部チェンジ') },
  { q:'2(x ＋ 3y) ＋ 3(x − y) を計算すると？', a:'5x ＋ 3y', choices:['5x ＋ 3y','5x ＋ 9y','5x − 3y','6x ＋ 3y'],
    exp:E('かっこをはずす → まとめる', '2x ＋ 6y ＋ 3x − 3y ＝ 5x ＋ 3y', '−3y の符号に注意', '2ステップに分けて書く') },
  { q:'3(2a − b) − 2(a − 4b) を計算すると？', a:'4a ＋ 5b', choices:['4a ＋ 5b','4a − 11b','4a − 5b','8a ＋ 5b'],
    exp:E('うしろの −2 は「−2 をかける」と考える', '6a − 3b − 2a ＋ 8b ＝ 4a ＋ 5b', '−2 × (−4b) を −8b にしない', 'かっこの前の符号ごとかける') },
  { q:'5(x − 2y) − (2x − y) を計算すると？', a:'3x − 9y', choices:['3x − 9y','3x − 11y','7x − 9y','3x ＋ 9y'],
    exp:E('前の − は、−1 をかけるのと同じ', '5x − 10y − 2x ＋ y ＝ 3x − 9y', '−y を −y のままにしない', '数がなくても − は配る') },
  { q:'(x ＋ y)/2 ＋ (x − y)/3 を計算すると？', a:'(5x ＋ y)/6', choices:['(5x ＋ y)/6','(5x − y)/6','5x ＋ y','(2x)/5'],
    exp:E('分母を 6 にそろえて、分子をまとめる', '{3(x ＋ y) ＋ 2(x − y)} ÷ 6 ＝ (5x ＋ y)/6', '分母を消して 5x ＋ y にしない（方程式ではない）', '分母どうしはたさない') },
  { q:'(x ＋ y)/2 − (x − y)/3 を計算すると？', a:'(x ＋ 5y)/6', choices:['(x ＋ 5y)/6','(x ＋ y)/6','x ＋ 5y','(5x ＋ y)/6'],
    exp:E('ひく分子はかっこをつけたまま通分する', '{3(x ＋ y) − 2(x − y)} ÷ 6 ＝ (3x ＋ 3y − 2x ＋ 2y)/6', 'かっこをつけないと ＋2y が −2y になる', 'ひき算の分子は、かっこが命') },
  { q:'(2a − b)/3 − (a − 2b)/2 を計算すると？', a:'(a ＋ 4b)/6', choices:['(a ＋ 4b)/6','(a − 8b)/6','(7a − 8b)/6','a ＋ 4b'],
    exp:E('3 と 2 で通分（分母は 6）', '{2(2a − b) − 3(a − 2b)} ÷ 6 ＝ (4a − 2b − 3a ＋ 6b)/6', '−3 × (−2b) を −6b にしない', '符号はかっこをはずすときに決まる') },
  { q:'x − (x − y)/2 を計算すると？', a:'(x ＋ y)/2', choices:['(x ＋ y)/2','(x − y)/2','(3x − y)/2','y/2'],
    exp:E('分母のない x も分数にそろえる', 'x ＝ 2x/2 → (2x − x ＋ y)/2', 'x の分母をそろえ忘れない', 'x は x/1 と考える') },
  { q:'(x ＋ y)/2 − (x − y)/3 を計算するとき、全体を 6 倍して分母を消してはいけないのは、なぜ？', a:'式には ＝ の相手がなく、6倍すると値が変わってしまうから', choices:['式には ＝ の相手がなく、6倍すると値が変わってしまうから','分数は6倍できないから','分母が2種類あるから','x と y の2文字があるから'],
    exp:E('分母を消せるのは「両辺」がある方程式だけ', '方程式は両辺を6倍しても ＝ が保たれる', '式の計算は通分して分母を残す', '＝ があるかどうかを見る') }
];
// ---- Section 4：単項式のかけ算・わり算 ----
QS[4] = [
  { q:'3x × 4y を計算すると？', a:'12xy', choices:['12xy','7xy','12x ＋ 4y','34xy'],
    exp:E('数は数どうし、文字は文字どうしかける', '3 × 4 ＝ 12、x × y ＝ xy', 'たし算にしない', 'かけ算は全員まとめて1つの項になる') },
  { q:'−2a × 5b を計算すると？', a:'−10ab', choices:['−10ab','10ab','3ab','−7ab'],
    exp:E('符号 → 数 → 文字 の順', 'マイナス1個で −、2 × 5 ＝ 10', 'マイナスが奇数個なら答えはマイナス', '符号を最初に決める') },
  { q:'x² × x³ を計算すると？', a:'x⁵', choices:['x⁵','x⁶','2x⁵','x'],
    exp:E('同じ文字のかけ算は、指数をたす', 'x が 2個 ＋ 3個 ＝ 5個', '指数をかけて x⁶ にしない', 'x² ＝ x × x と書いて数える') },
  { q:'2a² × 3a を計算すると？', a:'6a³', choices:['6a³','5a³','6a²','6a'],
    exp:E('a は a¹ と考える', '2 × 3 ＝ 6、a² × a ＝ a³', '数をたして 5 にしない', '何も書いてない指数は1') },
  { q:'(−3x)² を計算すると？', a:'9x²', choices:['9x²','−9x²','6x²','−6x²'],
    exp:E('かっこごと2回かける', '(−3x) × (−3x) ＝ 9x²', '−3 × 2 ＝ −6 にしない', 'マイナスも2回かかる') },
  { q:'−4x × (−3xy) を計算すると？', a:'12x²y', choices:['12x²y','−12x²y','12xy','−7x²y'],
    exp:E('マイナス2個でプラス', '4 × 3 ＝ 12、x × xy ＝ x²y', 'x が2個あるので x²', '文字を1人ずつ数える') },
  { q:'12xy ÷ 3x を計算すると？', a:'4y', choices:['4y','4xy','9y','4x'],
    exp:E('分数にして約分する', '12xy/3x ＝ 4y', 'x を残さない（分子と分母で消える）', '同じ文字は分子と分母で消える') },
  { q:'−15a²b ÷ 5ab を計算すると？', a:'−3a', choices:['−3a','3a','−3ab','−10a'],
    exp:E('符号 → 数 → 文字', '15 ÷ 5 ＝ 3、a²b ÷ ab ＝ a', '数を引き算しない', 'a² の a が1個だけ残る') },
  { q:'8x²y ÷ (−2xy) を計算すると？', a:'−4x', choices:['−4x','4x','−4xy','−6x'],
    exp:E('マイナス1個で答えはマイナス', '8 ÷ 2 ＝ 4、x²y ÷ xy ＝ x', '符号を落とさない', 'わり算も符号を先に') },
  { q:'6a²b ÷ 3a × 2b を計算すると？', a:'4ab²', choices:['4ab²','ab','4a²b²','a²'],
    exp:E('÷ のうしろの1個だけが分母', '6a²b × 2b ÷ 3a ＝ 4ab²', '3a × 2b を先にかけて分母にしない', '左から順番に計算する') },
  { q:'(2x)³ を計算すると？', a:'8x³', choices:['8x³','6x³','2x³','8x'],
    exp:E('数も文字も3回かける', '2 × 2 × 2 ＝ 8、x × x × x ＝ x³', '2 × 3 ＝ 6 にしない', '3乗は3回かける') },
  { q:'2x²y × 3y ÷ 6xy を計算すると？', a:'xy', choices:['xy','x²y','6xy','y'],
    exp:E('かけるものは分子、÷ のうしろは分母', '6x²y² ÷ 6xy ＝ xy', '途中で文字を数え落とさない', '分子と分母を1列に書く') },
  { q:'6x² ÷ 2x/3 を計算すると？', a:'9x', choices:['9x','4x³','4x','3x'],
    exp:E('分数で割るときは、逆数をかける', '6x² × 3/2x ＝ 9x', 'そのままかけると 4x³', 'ひっくり返すのは ÷ のうしろの分数') }
];
// ---- Section 8：式の値・等式の変形 ----
QS[8] = [
  { q:'x ＝ 2、y ＝ −1 のとき、3x − 2y の値は？', a:'8', choices:['8','4','−4','1'],
    exp:E('負の数はかっこをつけて入れる', '3 × 2 − 2 × (−1) ＝ 6 ＋ 2 ＝ 8', '6 − 2 ＝ 4 にしない', 'かっこが符号を守ってくれる') },
  { q:'a ＝ −2、b ＝ 3 のとき、2(a ＋ b) − (a − b) の値は？', a:'7', choices:['7','−7','5','11'],
    exp:E('先に式を簡単にしてから入れる', 'a ＋ 3b → −2 ＋ 9 ＝ 7', 'そのまま入れると計算が増えてミスしやすい', '簡単にする → 代入 の順番') },
  { q:'x ＝ 3、y ＝ −2 のとき、x²y の値は？', a:'−18', choices:['−18','18','−12','12'],
    exp:E('2乗がかかるのは x だけ', '3² × (−2) ＝ 9 × (−2) ＝ −18', 'y まで2乗しない', '2乗は右上についた文字だけ') },
  { q:'x ＝ −3 のとき、x² の値は？', a:'9', choices:['9','−9','6','−6'],
    exp:E('かっこをつけて2乗する', '(−3)² ＝ 9', '−3² ＝ −9 は別の式', 'かっこがあればマイナスも2回') },
  { q:'x ＝ −3 のとき、−x² の値は？', a:'−9', choices:['−9','9','6','−6'],
    exp:E('先頭の − は2乗されない', '−(−3)² ＝ −9', '符号が2回変わると勘ちがいしない', '2乗してから − をつける') },
  { q:'x ＝ 1/2、y ＝ −3 のとき、6x²y ÷ 3x の値は？', a:'−3', choices:['−3','3','−6','−1'],
    exp:E('先に約分してから入れる', '6x²y ÷ 3x ＝ 2xy → 2 × 1/2 × (−3) ＝ −3', 'いきなり入れると分数の計算が増える', 'ラクな順番を選ぶ') },
  { q:'3x ＋ y ＝ 7 を y について解くと？', a:'y ＝ −3x ＋ 7', choices:['y ＝ −3x ＋ 7','y ＝ 3x ＋ 7','y ＝ −3x − 7','y ＝ 7 − x'],
    exp:E('求めたい文字だけを左に残す', '3x を右へ移項', '符号を変え忘れない', '方程式の移項と同じ') },
  { q:'a ＋ 2b ＝ 6 を a について解くと？', a:'a ＝ −2b ＋ 6', choices:['a ＝ −2b ＋ 6','a ＝ 2b ＋ 6','a ＝ −2b − 6','a ＝ 6b − 2'],
    exp:E('a 以外を右へ', '2b を右へ移項', '＋2b のまま右へ動かさない', '動かしたら符号チェンジ') },
  { q:'2x ＋ 3y ＝ 12 を x について解くと？', a:'x ＝ (−3y ＋ 12)/2', choices:['x ＝ (−3y ＋ 12)/2','x ＝ −3y ＋ 6','x ＝ (3y ＋ 12)/2','x ＝ −3y ＋ 12'],
    exp:E('移項してから、x の前の数で全部を割る', '2x ＝ −3y ＋ 12 → 全部を 2 で割る', '12 だけ割らない', '右辺は全員を割る') },
  { q:'S ＝ 1/2 ah を a について解くと？', a:'a ＝ 2S/h', choices:['a ＝ 2S/h','a ＝ S/2h','a ＝ 2Sh','a ＝ S − 2h'],
    exp:E('分数は両辺に 2 をかけて消す', '2S ＝ ah → a ＝ 2S/h', '割る数と かける数を逆にしない', '三角形の面積の公式') },
  { q:'V ＝ πr²h を h について解くと？', a:'h ＝ V/πr²', choices:['h ＝ V/πr²','h ＝ Vπr²','h ＝ πr²/V','h ＝ V − πr²'],
    exp:E('h にかかっている全部で割る', '両辺を πr² で割る', 'π と r² は別々に動かさない', '円柱の体積の公式') },
  { q:'L ＝ 2(a ＋ b) を a について解くと？', a:'a ＝ L/2 − b', choices:['a ＝ L/2 − b','a ＝ L − 2b','a ＝ L/2 ＋ b','a ＝ 2L − b'],
    exp:E('かっこの外の 2 を先に割る', 'L/2 ＝ a ＋ b → a ＝ L/2 − b', 'L − 2b は L を割り忘れている', '長方形の周の長さの式') },
  { q:'y ＝ 3x − 5 を x について解くと？', a:'x ＝ (y ＋ 5)/3', choices:['x ＝ (y ＋ 5)/3','x ＝ (y − 5)/3','x ＝ 3y ＋ 5','x ＝ y/3 − 5'],
    exp:E('左右を入れかえると見やすい', '3x − 5 ＝ y → 3x ＝ y ＋ 5', '−5 を移項して ＋5', '5 も 3 で割る') },
  { q:'道のり a km を時速 v km で進むと t 時間かかる。a ＝ vt を t について解くと？', a:'t ＝ a/v', choices:['t ＝ a/v','t ＝ v/a','t ＝ av','t ＝ a − v'],
    exp:E('t にかかっている v で割る', '両辺を v で割る', 'v/a と逆にしない', 'は・じ・き と同じ') }
];
// ---- Section 9：文字式で説明する ----
QS[9] = [
  { q:'連続する3つの整数を、いちばん小さい数を n として表すと？', a:'n、n ＋ 1、n ＋ 2', choices:['n、n ＋ 1、n ＋ 2','n、2n、3n','n、n ＋ 2、n ＋ 4','n − 2、n − 1、n'],
    exp:E('1 ずつ増やす', 'n、n ＋ 1、n ＋ 2', '2n は「2倍」で、次の数ではない', '連続＝となりどうし') },
  { q:'n を整数とするとき、偶数を表す式は？', a:'2n', choices:['2n','n ＋ 2','2n ＋ 1','n²'],
    exp:E('偶数 ＝ 2 × （整数）', '2n', 'n ＋ 2 は n が奇数なら奇数', '偶数は2の倍数') },
  { q:'n を整数とするとき、奇数を表す式は？', a:'2n ＋ 1', choices:['2n ＋ 1','2n','n ＋ 1','3n'],
    exp:E('奇数 ＝ 偶数 ＋ 1', '2n ＋ 1', 'n ＋ 1 は偶数のときもある', '偶数のとなりが奇数') },
  { q:'十の位が a、一の位が b の2けたの自然数を表す式は？', a:'10a ＋ b', choices:['10a ＋ b','ab','a ＋ b','10b ＋ a'],
    exp:E('十の位は 10 倍', '53 ＝ 10 × 5 ＋ 3', 'ab は a × b になってしまう', '実際の数字で確かめる') },
  { q:'十の位が a、一の位が b の2けたの自然数の、十の位と一の位を入れかえた数は？', a:'10b ＋ a', choices:['10b ＋ a','10a ＋ b','ba','b ＋ a'],
    exp:E('今度は b が十の位', '10b ＋ a', 'ba は b × a', '十の位に来た文字に 10 をかける') },
  { q:'n ＋ (n ＋ 1) ＋ (n ＋ 2) を計算すると？', a:'3n ＋ 3', choices:['3n ＋ 3','3n ＋ 2','n³ ＋ 3','3n'],
    exp:E('同じ文字をまとめる', 'n が3個、数は 1 ＋ 2 ＝ 3', '掛け算にしない', 'n は3人いる') },
  { q:'連続する3つの整数の和が 3(n ＋ 1) と表せたとき、3の倍数といえる理由は？', a:'n ＋ 1 が整数で、3 × (整数) の形だから', choices:['n ＋ 1 が整数で、3 × (整数) の形だから','n が 3 だから','3 ＋ 1 ＝ 4 だから','3つの数をたしたから'],
    exp:E('倍数 ＝ （その数）×（整数）の形', '3 × (n ＋ 1)', '「3つあるから」は理由にならない', 'かっこの中が整数だと言う') },
  { q:'連続する3つの整数を n − 1、n、n ＋ 1 と表すとき、和は？', a:'3n', choices:['3n','3n ＋ 1','3n − 1','n³'],
    exp:E('−1 と ＋1 が消える', '(n − 1) ＋ n ＋ (n ＋ 1) ＝ 3n', '−1 と ＋1 を残さない', '真ん中を n にすると計算がラク') },
  { q:'偶数 2m と奇数 2n ＋ 1 の和が奇数だとわかる形は？', a:'2(m ＋ n) ＋ 1', choices:['2(m ＋ n) ＋ 1','2(m ＋ n)','3(m ＋ n) ＋ 1','m ＋ n ＋ 1'],
    exp:E('奇数 ＝ 2 × （整数）＋ 1 の形にする', '2m ＋ 2n ＋ 1 ＝ 2(m ＋ n) ＋ 1', '2(m ＋ n) は偶数の形', '2 でくくって ＋1 を残す') },
  { q:'偶数と奇数の和を説明するとき、2m と 2n ＋ 1 のように別の文字を使うのは、なぜ？', a:'同じ文字だと、2n と 2n ＋ 1 のようにとなりの数の場合しか説明できないから', choices:['同じ文字だと、2n と 2n ＋ 1 のようにとなりの数の場合しか説明できないから','同じ文字は2回使えない決まりだから','文字が多いほどよいから','m の方が n より大きいから'],
    exp:E('関係のない2つの数には、別の文字を使う', '偶数も奇数も自由に選べるように別の文字にする', '同じ文字は「同じ数」という意味になる', '同じ文字＝同じ人') },
  { q:'(10a ＋ b) ＋ (10b ＋ a) を変形した形は？', a:'11(a ＋ b)', choices:['11(a ＋ b)','10(a ＋ b)','9(a ＋ b)','11ab'],
    exp:E('同類項をまとめて共通の数でくくる', '11a ＋ 11b ＝ 11(a ＋ b)', 'a × b にはならない', '11 の倍数だとわかる') },
  { q:'(10a ＋ b) − (10b ＋ a) を変形した形は？', a:'9(a − b)', choices:['9(a − b)','11(a − b)','9(a ＋ b)','10(a − b)'],
    exp:E('− のかっこは全員の符号を変える', '10a ＋ b − 10b − a ＝ 9a − 9b', '符号を変え忘れない', '入れかえた差は 9 の倍数') },
  { q:'n を整数とするとき、5n ＋ 10 は何の倍数といえる？', a:'5 の倍数', choices:['5 の倍数','10 の倍数','15 の倍数','n の倍数'],
    exp:E('共通の数でくくる', '5(n ＋ 2)', '10 ではくくれない（5n は 10 で割れるとは限らない）', 'くくった外の数が答え') },
  { q:'たて a cm、横 b cm の長方形で、たてを 2 倍、横を 3 倍すると、面積はもとの何倍？', a:'6 倍', choices:['6 倍','5 倍','2 倍','3 倍'],
    exp:E('文字で計算して比べる', '2a × 3b ＝ 6ab', '2 ＋ 3 にしない', 'かけ算なので倍数もかける') }
];
// ---- Section 5：確認テスト ----
QS[5] = [
  { q:'単項式 4x²y の次数は？', a:'3', choices:['3','4','2','7'],
    exp:E('文字の個数を数える', 'x、x、y で3個', '数の 4 は数えない', '文字だけ') },
  { q:'多項式 x² ＋ 2xy − y の次数は？', a:'2', choices:['2','3','5','1'],
    exp:E('いちばん大きい次数', 'x² と 2xy が2', '合計にしない', '最大を答える') },
  { q:'2a ＋ 5b − a ＋ 2b を計算すると？', a:'a ＋ 7b', choices:['a ＋ 7b','3a ＋ 7b','a ＋ 3b','8ab'],
    exp:E('同じ文字どうし', '2a − a ＝ a、5b ＋ 2b ＝ 7b', 'a と b は合体しない', 'a は 1a') },
  { q:'(5x − 2y) − (3x − 4y) を計算すると？', a:'2x ＋ 2y', choices:['2x ＋ 2y','2x − 6y','8x − 6y','2x − 2y'],
    exp:E('− のかっこは全員の符号を変える', '5x − 2y − 3x ＋ 4y', '−4y のままにしない', 'マイナスは全員に配る') },
  { q:'4(x − 2y) を計算すると？', a:'4x − 8y', choices:['4x − 8y','4x − 2y','4x ＋ 8y','8x − 8y'],
    exp:E('中の全員にかける', '4 × (−2y) ＝ −8y', 'うしろにかけ忘れない', '全員に配る') },
  { q:'−3(2a − b) を計算すると？', a:'−6a ＋ 3b', choices:['−6a ＋ 3b','−6a − 3b','6a − 3b','−6a − b'],
    exp:E('マイナスの数もかける', '−3 × (−b) ＝ ＋3b', '符号を変え忘れない', 'マイナス × マイナスはプラス') },
  { q:'2(a ＋ b) ＋ 3(a − 2b) を計算すると？', a:'5a − 4b', choices:['5a − 4b','5a ＋ 8b','5a − 8b','6a − 4b'],
    exp:E('はずす → まとめる', '2a ＋ 2b ＋ 3a − 6b', '−6b の符号に注意', '2ステップで') },
  { q:'3(x − y) − 2(x − 2y) を計算すると？', a:'x ＋ y', choices:['x ＋ y','x − 7y','x − y','5x ＋ y'],
    exp:E('−2 ごとかける', '3x − 3y − 2x ＋ 4y', '−2 × (−2y) ＝ ＋4y', 'かっこの前の符号ごと') },
  { q:'(3x ＋ y)/2 − (x − y)/4 を計算すると？', a:'(5x ＋ 3y)/4', choices:['(5x ＋ 3y)/4','(5x ＋ y)/4','5x ＋ 3y','(7x ＋ 3y)/4'],
    exp:E('分母を 4 にそろえる', '{2(3x ＋ y) − (x − y)} ÷ 4 ＝ (6x ＋ 2y − x ＋ y)/4', '分母を消さない', 'ひく分子はかっこつき') },
  { q:'5a × (−2b) を計算すると？', a:'−10ab', choices:['−10ab','10ab','3ab','−7ab'],
    exp:E('符号 → 数 → 文字', '5 × 2 ＝ 10、マイナス1個', 'たし算にしない', 'かけ算は1つの項になる') },
  { q:'(−2a)³ を計算すると？', a:'−8a³', choices:['−8a³','8a³','−6a³','6a³'],
    exp:E('かっこごと3回かける', '(−2) × (−2) × (−2) ＝ −8', 'マイナス3個で答えはマイナス', '−2 × 3 にしない') },
  { q:'a³ × a² を計算すると？', a:'a⁵', choices:['a⁵','a⁶','2a⁵','a'],
    exp:E('指数をたす', 'a が 3個 ＋ 2個', '指数をかけない', '個数を数える') },
  { q:'18x²y ÷ 6xy を計算すると？', a:'3x', choices:['3x','3xy','12x','3y'],
    exp:E('分数にして約分', '18 ÷ 6 ＝ 3、x²y ÷ xy ＝ x', 'y を残さない', '同じ文字は消える') },
  { q:'4x²y ÷ 2x × 3y を計算すると？', a:'6xy²', choices:['6xy²','xy','6x²y²','x²'],
    exp:E('÷ のうしろの1個だけ分母', '4x²y × 3y ÷ 2x', '2x × 3y を先にしない', '左から順番に') },
  { q:'x ＝ −1、y ＝ 2 のとき、4x − y の値は？', a:'−6', choices:['−6','−2','2','6'],
    exp:E('かっこをつけて入れる', '4 × (−1) − 2 ＝ −6', '−4 − 2 を −2 にしない', 'どちらもマイナスなので大きくなる') },
  { q:'3x − 2y ＝ 6 を y について解くと？', a:'y ＝ 3/2 x − 3', choices:['y ＝ 3/2 x − 3','y ＝ −3/2 x ＋ 3','y ＝ 3x − 3','y ＝ 3/2 x ＋ 3'],
    exp:E('−2 で割ると全部の符号が変わる', '−2y ＝ −3x ＋ 6 → y ＝ 3/2 x − 3', '片方だけ変えない', '割る数がマイナス → 全部チェンジ') },
  { q:'S ＝ ab を b について解くと？', a:'b ＝ S/a', choices:['b ＝ S/a','b ＝ a/S','b ＝ Sa','b ＝ S − a'],
    exp:E('b にかかっている a で割る', '両辺を a で割る', '分子と分母を逆にしない', '求める文字だけ残す') },
  { q:'連続する3つの整数で、いちばん小さい数を n とすると、いちばん大きい数は？', a:'n ＋ 2', choices:['n ＋ 2','n ＋ 3','3n','n ＋ 1'],
    exp:E('1 ずつ増やす', 'n、n ＋ 1、n ＋ 2', 'n ＋ 3 は4つ目', '最初の数から2つ先') },
  { q:'十の位が a、一の位が b の2けたの自然数は？', a:'10a ＋ b', choices:['10a ＋ b','ab','a ＋ b','10b ＋ a'],
    exp:E('十の位は 10 倍', '10a ＋ b', 'ab は a × b', '53 ＝ 10 × 5 ＋ 3') },
  { q:'(10a ＋ b) ＋ (10b ＋ a) は何の倍数といえる？', a:'11 の倍数', choices:['11 の倍数','10 の倍数','9 の倍数','2 の倍数'],
    exp:E('まとめて共通の数でくくる', '11(a ＋ b)', '10 ではくくれない', 'くくった外の数が答え') }
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
  correct: ['きょん「やった！天才かも！！」','きょん「にっくんより賢くなったかも！」','きょん「文字、仲良くなってきた！！」','西村「正解。よく覚えてたね」','西村「できてる。その調子」'],
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
  { id:0, label:'🧮 スタート',  title:'ルールは3つだけ',    sub:'文字を「人」だと思うと、まちがえにくくなる' },
  { id:1, label:'言葉の整理',   title:'単項式・多項式・次数',  sub:'問題文に出てくる言葉を先にそろえる' },
  { id:2, label:'たす・ひく',   title:'多項式のたし算・ひき算', sub:'同じ文字の仲間だけまとめる' },
  { id:3, label:'分配・分数',   title:'数×多項式・分数の式',    sub:'全員に配る。分母は消さない' },
  { id:4, label:'かける・わる', title:'単項式のかけ算・わり算', sub:'かけ算は数と文字に分ける。わり算は分数に' },
  { id:8, label:'式の値・変形', title:'式の値・等式の変形',    sub:'代入する前に簡単に。○について解く' },
  { id:9, label:'文字で説明',   title:'文字式で説明する',      sub:'偶数・奇数・連続する整数・2けたの数' },
  { id:5, label:'確認テスト',   title:'確認テスト',            sub:'全部まとめて20問。ゆっくりでOK' },
  { id:6, label:'📊弱点',       title:'弱点ノート',            sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',       title:'弱点特訓モード',        sub:'弱点問題だけを集中練習！' }
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
  localStorage.setItem('math_expr_sections', JSON.stringify(sectionDone));
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
    + '<div class="section-badge">数学 式の計算 · SECTION ' + idx + '</div>'
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
    chat('kyon', '式の計算って、数字と文字がごちゃごちゃで、全部くっつけたくなるんだよ'),
    chat('nishi', 'ルールは3つだけだ。計算の種類ごとに、やることが決まっている'),
    chat('iwa', 'きょん、文字を「人」だと思ってみて。a さんと b さんは別人だから、たしても合体しないよ。私も知らない人と急に合体しないもん'),
    chat('kyon', 'イワクラちゃん、それは普通みんなしないよ')
  ])
  + card('🧮 式の計算のルール3つ',
    table([['計算','やること','例'],
      ['<span class="nw">たす・ひく</span>','同じ文字の仲間だけまとめる','3a ＋ 2a ＝ 5a<br>3a ＋ 2b はそのまま'],
      ['<span class="nw">かける</span>','数は数、文字は文字でかける','2x × 3y ＝ 6xy'],
      ['<span class="nw">わる</span>','分数にして約分する','6xy ÷ 2x ＝ 3y']]))
  + '<button class="start-btn" data-goto="1">🧮 言葉の整理 から始める →</button>';
};
INTRO[1] = function() {
  return talk([
    chat('kyon', '「次数」って言われても、次の数？'),
    chat('nishi', '「文字が何人かけられているか」のことだ。数は数えない')
  ])
  + card('📐 言葉はこの4つ',
    table([['言葉','意味','例'],
      ['<span class="nw">単項式</span>','かけ算だけの式','3x、−5ab'],
      ['<span class="nw">多項式</span>','＋ や − でつながった式','2x ＋ 3'],
      ['<span class="nw">次数</span>','かけられた文字の個数（多項式は最大のもの）','3a²b → 3'],
      ['<span class="nw">同類項</span>','文字の部分がまったく同じ項','3a と −a']]));
};
INTRO[2] = function() {
  return talk([
    chat('shun', 'きょんさん、かっこの前のマイナスは、楽屋に差し入れ配るのと一緒ですわ。1人目だけ渡して帰ったら、あとで2人目に怒られますからね'),
    chat('kyon', 'しゅん、俺いつも1人目で満足しちゃうんだよ')
  ])
  + card('📐 まとめられる？まとめられない？',
    table([['式','','理由'],
      ['3a ＋ 2a ＝ 5a','<span class="ln-ok">⭕</span>','a さん3人と2人で5人'],
      ['3a ＋ 2b ＝ 5ab','<span class="ln-ng">✕</span>','別人なのでそのまま'],
      ['3a² ＋ 2a ＝ 5a³','<span class="ln-ng">✕</span>','a² は2人組のコンビで別物'],
      ['xy ＋ 2yx ＝ 3xy','<span class="ln-ok">⭕</span>','かける順番がちがうだけ']]))
  + card('📐 かっこの前が − のとき',
    '<div class="rule-box"><div class="ex"><span class="ln-ok">⭕</span> −(2x − 3y) ＝ −2x ＋ 3y</div><div class="ex"><span class="ln-ng">✕</span> −(2x − 3y) ＝ −2x − 3y</div><div class="note">− は「−1 をかける」という意味なので、中の<b>全員</b>の符号が変わる</div></div>');
};
INTRO[3] = function() {
  return talk([
    chat('kyon', '分数の式って、方程式みたいに分母を消せばいいんでしょ？'),
    chat('nishi', 'そこがいちばんのひっかけだ。方程式と式の計算は、やっていいことがちがう')
  ])
  + card('📐 分母を消していい？',
    table([['','やること'],
      ['方程式（＝がある）','<span class="ln-ok">⭕</span> 両辺を6倍して分母を消せる'],
      ['式の計算（＝がない）','<span class="ln-ng">✕</span> 通分して<b>分母を残す</b>']])
    + '<div class="rule-box"><div class="rule-title">なぜ✕なの？</div><div class="ex">① 方程式は両辺を同じ数倍しても ＝ が保たれる</div><div class="ex">② 式の計算には ＝ の相手がいない</div><div class="ex">③ 6倍すると、答えの値も6倍に変わってしまう</div></div>')
  + card('🔍 例題：(x ＋ y)/2 − (x − y)/3',
    step('STEP 1　分母をそろえる（タップ）', '2 と 3 の最小公倍数は <b>6</b>。分子に 3 と 2 をかける<div class="qd-big">{3(x ＋ y) − 2(x − y)} ÷ 6</div>')
    + step('STEP 2　かっこをはずす（タップ）', '3x ＋ 3y − 2x ＋ 2y<br>⚠️ −2 × (−y) ＝ <b>＋2y</b>。分子にかっこをつけておくと符号をまちがえない')
    + step('STEP 3　まとめる（タップ）', '<div class="qd-big">(x ＋ 5y)/6</div>分母の 6 はそのまま残す'));
};
INTRO[4] = function() {
  return talk([
    chat('kuru', 'きょんさん、かけ算は「数チーム」と「文字チーム」に分けるだけっす！簡単すぎて、僕もう優勝した気分っす！'),
    chat('kyon', 'くるま、お前まだ1問も解いてないだろ')
  ])
  + card('📐 まちがえやすい形',
    table([['式','','理由'],
      ['x × x ＝ x²','<span class="ln-ok">⭕</span>','x が2人'],
      ['x × x ＝ 2x','<span class="ln-ng">✕</span>','2x は x ＋ x のこと'],
      ['x² × x³ ＝ x⁵','<span class="ln-ok">⭕</span>','2人 ＋ 3人 ＝ 5人'],
      ['x² × x³ ＝ x⁶','<span class="ln-ng">✕</span>','指数はかけない'],
      ['(−3x)² ＝ 9x²','<span class="ln-ok">⭕</span>','かっこごと2回かける'],
      ['−3x² は x だけ2乗','<span class="ln-ok">⭕</span>','かっこがないので − と 3 は2乗しない']]))
  + card('📐 わり算は分数にする',
    '<div class="rule-box"><div class="ex">12xy ÷ 3x ＝ 12xy/3x ＝ 4y</div><div class="ex">6a²b ÷ 3a × 2b → 分母は 3a だけ</div><div class="note">÷ のうしろの<b>1個だけ</b>が分母。× のうしろは分子にいく</div></div>');
};
INTRO[8] = function() {
  return talk([
    chat('nishi', 'どちらも、これまでのルールの使い道だ。式の値は「先に簡単にする」、等式の変形は「方程式の移項と同じ」と覚えよう')
  ])
  + card('📐 式の値',
    '<div class="rule-box"><div class="ex">① 式を簡単にする</div><div class="ex">② 文字に数を入れる（負の数はかっこをつける）</div><div class="note">x ＝ −3 のとき、x² ＝ (−3)² ＝ 9、−x² ＝ −(−3)² ＝ −9</div></div>')
  + card('📐 ○について解く ＝ ○だけを左に残す',
    table([['手順','例：2x ＋ 3y ＝ 12 を x について'],
      ['① ○のない項を右へ移項','2x ＝ −3y ＋ 12'],
      ['② ○の前の数で全部を割る','x ＝ (−3y ＋ 12)/2']]));
};
INTRO[9] = function() {
  return talk([
    chat('kyon', '「文字を使って説明しなさい」って、作文じゃん'),
    chat('nishi', '書く順番は毎回同じだ。文字で表す → 計算する → 「○×（整数）」の形にする → 言葉でしめる'),
    chat('shun', '漫才のフリ・ボケ・ツッコミみたいに、型があるんですわ。型どおりにやれば、スベっても点はもらえます')
  ])
  + card('📐 文字の表し方',
    table([['言葉','文字で'],
      ['偶数','2n'],['奇数','2n ＋ 1'],['3の倍数','3n'],
      ['連続する3つの整数','n、n ＋ 1、n ＋ 2'],
      ['2けたの自然数','10a ＋ b'],
      ['十の位と一の位を入れかえた数','10b ＋ a']]))
  + card('🔍 例題：連続する3つの整数の和は3の倍数',
    step('STEP 1　文字で表す（タップ）', 'いちばん小さい数を <b>n</b> とすると、3つの数は n、n ＋ 1、n ＋ 2')
    + step('STEP 2　計算する（タップ）', 'n ＋ (n ＋ 1) ＋ (n ＋ 2) ＝ 3n ＋ 3')
    + step('STEP 3　倍数の形にする（タップ）', '<div class="qd-big">3n ＋ 3 ＝ 3(n ＋ 1)</div>')
    + step('STEP 4　言葉でしめる（タップ）', 'n ＋ 1 は整数なので、3(n ＋ 1) は3の倍数である。<br>したがって、連続する3つの整数の和は3の倍数である。'))
  + card('📐 同じ文字？別の文字？',
    table([['場面','文字','なぜ'],
      ['連続する数','同じ n','1つ決まると次も決まる'],
      ['関係のない偶数と奇数','m と n','自由に選べる数なので別の文字']]));
};
INTRO[5] = function() {
  return talk([ chat('nishi', 'ここまでの総まとめだ。時間は気にしなくていい。途中の式をメモに書いて解こう') ]);
};

// ===== 確認テストの結果 =====
function showFinalResult() {
  var correct = 0, total = 0;
  QS[5].forEach(function(q) {
    if (answeredSet[q._qid]) { total++; var d = weakDB[q._qid]; if (d && d.correct > 0) correct++; }
  });
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '📺' : '🎤';
  var msg = pct >= 90 ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。式の計算は君のものだね」'
    : pct >= 70 ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50 ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。弱点ノートから見直そう」'
    : 'きょん「むずっ…でもここから這い上がる！！」<br>西村「スタートのルール3つにもどって、もう一度やってみよう」';
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
    localStorage.setItem('math_expr_sections', JSON.stringify(sectionDone));
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

// ===== 特訓モード（解説も QBANK から出す） =====
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
