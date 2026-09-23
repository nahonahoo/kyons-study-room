// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「関数？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺グラフ読めるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「関数で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var xp           = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('math_func_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_func_sections') || '{}');
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
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
}
function addXP(pts, qid) {
  if (answeredSet[qid]) return false;
  var oldLv = getLevel(xp).lv;
  xp += pts;
  answeredSet[qid] = true;
  localStorage.setItem('math_xp', xp);
  localStorage.setItem('math_func_answered', JSON.stringify(answeredSet));
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

// ===== WEAK DB =====
function getPct(qid) {
  var d = weakDB[qid];
  if (!d || d.total === 0) return 0;
  return Math.round(d.correct / d.total * 100);
}
function getWeakQuestions() {
  return Object.keys(weakDB).filter(function(id) {
    return id.indexOf('math_func_') === 0 && getPct(id) < 80;
  });
}
function renderWeakBar() {
  var wqs = getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,8);
  var el = document.getElementById('weakItems');
  if (!el) return;
  if (wqs.length === 0) { el.innerHTML = '<span class="weak-bar-empty">弱点なし — よくできています！</span>'; return; }
  el.innerHTML = wqs.map(function(qid) {
    return '<div class="weak-item"><span class="weak-item-word">' + getJpForQid(qid) + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect) {
  if (!weakDB[qid]) weakDB[qid] = {
    jp: (qMeta[qid] && qMeta[qid].jp) || '',
    answer: (qMeta[qid] && qMeta[qid].answer) || '',
    choices: (qMeta[qid] && qMeta[qid].choices) || [],
    correct: 0, total: 0
  };
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  var _today = new Date().toISOString().slice(0,10);
  var _daily = JSON.parse(localStorage.getItem('math_daily') || '{}');
  _daily[_today] = (_daily[_today] || 0) + 1;
  localStorage.setItem('math_daily', JSON.stringify(_daily));
  renderWeakBar();
}

// ===== TOAST =====
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, type === 'levelup' ? 4000 : 2500);
}

// ===== SHUFFLE =====
function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// ===== COMMENTS =====
var COMMENTS = {
  correct: [
    'きょん「合ってる！天才かも！！」',
    'きょん「やった！にっくんより賢いかも！」',
    'きょん「グラフ、読めてきた！！」',
  ],
  wrong: [
    'きょん「あれ！？間違えた！もう一回！」',
    'きょん「えっ違うの！？にっくん助けて！」',
    'きょん「むずっ！でも諦めない！」',
  ]
};
function getComment(type) {
  var arr = COMMENTS[type] || COMMENTS.correct;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== STATIC QUESTION JP MAP（弱点DB修復用・実際の問題文） =====
var Q_JP_MAP = {
  // Section 1：関数の基礎
  'math_func_s1_q0':'点(3,2)は、原点から右にいくつ、上にいくつ進んだ点？',
  'math_func_s1_q1':'下の図の点Pの座標は？',
  'math_func_s1_q2':'下の図の点Pの座標は？',
  'math_func_s1_q3':'表でx=2のときyはいくつ？',
  'math_func_s1_q4':'xの値を1つ決めたとき、yの値がただ1つに決まるとき、yはxの何と呼ぶ？',
  'math_func_s1_q5':'1本80円のペンをx本買うときの代金y円を式にすると？',
  'math_func_s1_q6':'上のペンの式でx=3のときのyの値は？',
  // Section 2：比例の復習
  'math_func_s2_q0':'y=4xで、xの値が2倍になると、yの値は？',
  'math_func_s2_q1':'y=3xについて、x=5のときのyの値は？',
  'math_func_s2_q2':'点(2,6)を通る比例のグラフの式は？',
  'math_func_s2_q3':'比例のグラフに共通する特徴は？',
  'math_func_s2_q4':'y=-2xのグラフはどんな直線？',
  'math_func_s2_q5':'グラフより、この比例の式は？',
  // Section 3：一次関数 y=ax+b
  'math_func_s3_q0':'y=2x+3の傾きと切片は？',
  'math_func_s3_q1':'y=-3x+1の切片は？',
  'math_func_s3_q2':'傾き4、切片-2の一次関数の式は？',
  'math_func_s3_q3':'y=x+5のグラフは、y軸のどの点を通る？',
  'math_func_s3_q4':'xが1増えるとyが3増える一次関数の傾きは？',
  'math_func_s3_q5':'2点(0,1)と(2,7)を通る一次関数の傾きは？',
  'math_func_s3_q6':'一次関数 y=2x-1 で、x=3のときのyの値は？',
  'math_func_s3_q7':'比例 y=3x と一次関数 y=3x+2 のグラフの関係は？',
  'math_func_s3_q8':'次のうち、原点を通らないグラフはどれ？',
  'math_func_s3_q9':'グラフより、この一次関数の式は？',
  // Section 4：二次関数 y=ax²
  'math_func_s4_q0':'y=2x²で、x=3のときのyの値は？',
  'math_func_s4_q1':'y=-x²で、x=-2のときのyの値は？',
  'math_func_s4_q2':'y=x²のグラフの形は？',
  'math_func_s4_q3':'y=-3x²のグラフは、上に凸？下に凸？',
  'math_func_s4_q4':'y=x²で、x=2のときとx=-2のときのyの値を比べると？',
  'math_func_s4_q5':'表（y=2x²）で、x=-1のときのyの値（?）は？',
  'math_func_s4_q6':'点(2,8)を通るy=ax²のaの値は？',
  'math_func_s4_q7':'y=ax²のグラフがy軸について線対称なのはなぜ？',
  'math_func_s4_q8':'下のグラフのaは正・負どちら？',
  'math_func_s4_q9':'一次関数のグラフは直線、二次関数y=ax²のグラフは？',
  // Section 5（確認テスト）
  'math_func_s5_q0':'点(5,1)は、原点から右にいくつ、上にいくつ進んだ点？',
  'math_func_s5_q1':'xを1つ決めるとyがただ1つに決まる関係を何という？',
  'math_func_s5_q2':'1個150円のりんごをx個買うときの代金y円の式は？',
  'math_func_s5_q3':'y=5xで、x=4のときのyの値は？',
  'math_func_s5_q4':'点(3,9)を通る比例のグラフの式は？',
  'math_func_s5_q5':'比例のグラフの特徴は？',
  'math_func_s5_q6':'y=2x+5の傾きと切片は？',
  'math_func_s5_q7':'y=-x+4の切片は？',
  'math_func_s5_q8':'傾き-3、切片1の一次関数の式は？',
  'math_func_s5_q9':'y=3x-2の、xが1増えるときのyの増え方は？',
  'math_func_s5_q10':'2点(0,2)と(3,11)を通る一次関数の傾きは？',
  'math_func_s5_q11':'y=4x+1で、x=2のときのyの値は？',
  'math_func_s5_q12':'y=2xとy=2x-3のグラフの関係は？',
  'math_func_s5_q13':'y=3x²で、x=2のときのyの値は？',
  'math_func_s5_q14':'y=-2x²で、x=3のときのyの値は？',
  'math_func_s5_q15':'y=x²のグラフはy軸について何？',
  'math_func_s5_q16':'y=-x²のグラフは上に凸？下に凸？',
  'math_func_s5_q17':'点(3,18)を通るy=ax²のaの値は？',
  'math_func_s5_q18':'y=x²で、x=4とx=-4のときのyの値の関係は？',
  'math_func_s5_q19':'二次関数y=ax²のグラフの名前は？',
};

function getJpForQid(qid) {
  if (Q_JP_MAP[qid]) return Q_JP_MAP[qid];
  if (qMeta[qid] && qMeta[qid].jp) return qMeta[qid].jp;
  if (weakDB[qid] && weakDB[qid].jp) return weakDB[qid].jp;
  return qid;
}

function repairWeakDB() {
  var changed = false;
  Object.keys(weakDB).forEach(function(qid) {
    if (qid.indexOf('math_func_') !== 0) return;
    var jp = Q_JP_MAP[qid];
    if (jp && weakDB[qid].jp !== jp) {
      weakDB[qid].jp = jp;
      changed = true;
    }
  });
  if (changed) localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
}

// ===== QUESTION ENGINE =====
function makeChoices(qid, choices, answer, xpPts) {
  choices = shuffleArray(choices);
  qMeta[qid] = Object.assign({ jp: Q_JP_MAP[qid] || '' }, qMeta[qid] || {}, { type:'choice', answer:answer, xp:xpPts, choices:choices });
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
    + '<div class="q-feedback wrong-fb" id="fbw_' + qid + '" style="display:none">✗ もう一度！</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + shown + '">'
    + '<div class="exp-card-title">📌 解説</div>'
    + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + explanation + '</div>'
    + '</div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '">'
    + '<div class="ans-label">✅ 正解</div>'
    + '<div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div>'
    + '</div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + shown + '">'
    + (answeredSet[qid] ? getComment('correct') : '')
    + '</div>';
}

function handleChoice(qid, choice) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  if (choice === meta.answer) markCorrect(qid, meta, choice);
  else markWrong(qid, meta, choice);
}

function markCorrect(qid, meta, choice) {
  recordResult(qid, true);
  var lvUp = addXP(meta.xp, qid);
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) card.classList.add('correct-card');
  var fb = document.getElementById('fb_' + qid);
  if (fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid);
  if (fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = getComment('correct'); ac.style.display = 'block'; }
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true;
    if (b.dataset.choice === meta.answer) b.classList.add('selected-correct');
  });
  if (lvUp) {
    setTimeout(function() {
      showToast('🎉 昇格！ ' + getLevel(xp).badge + '　きょん「昇格したわ！！」', 'levelup');
    }, 400);
  } else {
    setTimeout(function() { showToast(getComment('correct')); }, 300);
  }
  checkSectionComplete();
}

function markWrong(qid, meta, choice) {
  recordResult(qid, false);
  attemptCounts[qid] = (attemptCounts[qid] || 0) + 1;
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) { card.classList.add('wrong-card'); setTimeout(function(){ card.classList.remove('wrong-card'); }, 600); }
  var fbw = document.getElementById('fbw_' + qid);
  if (fbw) fbw.style.display = 'block';
  var btn = document.querySelector('.choice-btn[data-qid="' + qid + '"][data-choice="' + choice + '"]');
  if (btn) { btn.classList.add('selected-wrong'); setTimeout(function(){ btn.classList.remove('selected-wrong'); }, 600); }
  if (attemptCounts[qid] >= 2) {
    var sab = document.getElementById('sab_' + qid);
    if (sab) sab.style.display = 'inline-block';
  }
  var demoted = deductXP(5);
  var msgs = ['きょん「あれ！間違えた！でも次は大丈夫！！」', 'きょん「また間違えた…！まだまだ大丈夫！！」', 'きょん「何回間違えてんの！！にっくん助けて！！」'];
  if (demoted) {
    setTimeout(function() { showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」', 'demote'); }, 200);
  } else {
    setTimeout(function() { showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100);
  }
}

function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  localStorage.setItem('math_func_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid);
  if (arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid);
  if (ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid);
  if (sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true;
    if (b.dataset.choice === meta.answer) b.classList.add('show-correct');
  });
  var fbw = document.getElementById('fbw_' + qid);
  if (fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = '西村「答えを見るのも学習のうち。次は自分で解いてみよう」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。次は自分で解いてみよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete() {
  var prefix = 'math_func_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_func_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb && nb.style.display === 'none') {
      nb.style.display = 'block';
      if (!document.getElementById('secCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 5 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '結果を見よう！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(163,113,247,0.12),rgba(14,165,233,0.08));border:1px solid var(--purple);border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--purple);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
          + '<div style="font-size:14px;color:var(--text2)">きょん「全問解いた！！にっくん、俺やれるじゃん！！」</div>'
          + '<div style="font-size:13px;color:var(--text2);margin-top:4px">西村「よくやった。' + nextMsg + '」</div>'
          + '</div>';
        nb.parentNode.insertBefore(banner, nb);
        setTimeout(function(){ banner.scrollIntoView({ behavior:'smooth', block:'center' }); }, 200);
      }
    }
  }
}

// ===== SECTIONS DEF =====
var SECTIONS = [
  { id:0, label:'📐 スタート',   title:'関数の世界へようこそ',       sub:'座標の読み方から、比例→一次関数→二次関数y=ax²まで、順番に土台を作る' },
  { id:1, label:'関数の基礎',    title:'関数の基礎（座標の読み方）', sub:'「関数」ってそもそも何？座標平面の読み方から始めよう' },
  { id:2, label:'比例の復習',    title:'比例の復習 y=ax',            sub:'中1でやった比例は、関数の中でいちばんシンプルな仲間' },
  { id:3, label:'一次関数',      title:'一次関数 y=ax+b',            sub:'傾きと切片。グラフの書き方を1から積み上げる' },
  { id:4, label:'二次関数',      title:'二次関数 y=ax²',             sub:'xの2乗に比例する関数。グラフは曲線（放物線）になる' },
  { id:5, label:'確認テスト',    title:'確認テスト',                 sub:'全セクション総まとめ！何問正解できる？' },
  { id:6, label:'📊弱点',        title:'弱点ノート',                 sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',        title:'弱点特訓モード',             sub:'弱点問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab'
      + (s.id >= 6 ? ' tokku' : '')
      + (s.id === currentSection ? ' active' : '')
      + (sectionDone[s.id] && s.id < 6 ? ' done' : '');
    var label = s.label + (sectionDone[s.id] && s.id < 6 ? ' ✓' : '');
    if (s.id === 7) { var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
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

function renderSection(id) {
  if (id === 6) { renderWeakNote(); return; }
  if (id === 7) { renderTokkuMode(); return; }

  var s = SECTIONS[id];
  var html = '';
  html += '<div class="progress-dots">';
  for (var i = 0; i <= 5; i++) {
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">数学 関数 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';

  if      (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();
  else if (id === 5) html += renderSection5();

  if (id >= 1 && id <= 5) {
    var nextLabel = id < 5 ? '次のセクションへ →' : '🏆 結果を見る！';
    html += '<button class="next-section-btn" id="nextBtn" data-goto="' + (id < 5 ? id+1 : 'result') + '" style="display:none">' + nextLabel + '</button>';
  }

  document.getElementById('mainContent').innerHTML = html;

  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleChoice(btn.dataset.qid, btn.dataset.choice); });
  });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { showAnswer(btn.dataset.qid); });
  });
  var nb2 = document.getElementById('nextBtn');
  if (nb2) nb2.addEventListener('click', function() {
    var g = nb2.dataset.goto;
    if (g === 'result') showFinalResult(); else goSection(parseInt(g));
  });
  document.querySelectorAll('.start-btn[data-goto]').forEach(function(btn) {
    btn.addEventListener('click', function() { goSection(parseInt(btn.dataset.goto)); });
  });

  if (sectionDone[id]) {
    var nb = document.getElementById('nextBtn');
    if (nb) nb.style.display = 'block';
  }
  checkSectionComplete();
}

// ===== SVG HELPERS =====
// 座標グリッド＋軸（目盛り数字つき）の下地パーツ
function gridAxesParts(cx, cy, sc, range, vw, vh) {
  var grid = '';
  for (var i = -range; i <= range; i++) {
    var gx = cx + i * sc, gy = cy - i * sc;
    grid += '<line x1="' + gx + '" y1="8" x2="' + gx + '" y2="' + (vh-8) + '" stroke="#21262d" stroke-width="1"/>';
    grid += '<line x1="8" y1="' + gy + '" x2="' + (vw-8) + '" y2="' + gy + '" stroke="#21262d" stroke-width="1"/>';
    if (i !== 0) {
      grid += '<text x="' + gx + '" y="' + (cy+14) + '" fill="#6e7681" font-size="9" text-anchor="middle">' + i + '</text>';
      grid += '<text x="' + (cx-14) + '" y="' + (gy+3) + '" fill="#6e7681" font-size="9" text-anchor="middle">' + i + '</text>';
    }
  }
  var axes = '<line x1="8" y1="' + cy + '" x2="' + (vw-8) + '" y2="' + cy + '" stroke="#8b949e" stroke-width="1.5"/>'
    + '<line x1="' + cx + '" y1="' + (vh-8) + '" x2="' + cx + '" y2="8" stroke="#8b949e" stroke-width="1.5"/>'
    + '<text x="' + (vw-14) + '" y="' + (cy+14) + '" fill="#8b949e" font-size="11">x</text>'
    + '<text x="' + (cx-8) + '" y="16" fill="#8b949e" font-size="11">y</text>'
    + '<text x="' + (cx+4) + '" y="' + (cy+14) + '" fill="#8b949e" font-size="9">O</text>';
  return grid + axes;
}

// 比例 y=ax のグラフ
function propGraph(a, color, reveal) {
  var cx=130, cy=120, sc=28, vw=260, vh=240;
  var x1=cx-2*sc, y1=cy-a*(-2)*sc, x2=cx+2*sc, y2=cy-a*2*sc;
  var pt1x=cx+sc, pt1y=cy-a*sc;
  var dots='<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="'+color+'"/>'
    +'<circle cx="'+pt1x+'" cy="'+pt1y+'" r="4" fill="'+color+'"/>';
  if (reveal) dots += '<text x="'+(pt1x+6)+'" y="'+(pt1y-6)+'" fill="'+color+'" font-size="11">(1,'+a+')</text>';
  return '<svg viewBox="0 0 260 240" style="width:100%;max-width:280px;display:block;margin:0 auto">'
    + gridAxesParts(cx,cy,sc,4,vw,vh)
    + '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="2.5"/>'
    + dots
    + '</svg>';
}

// 一次関数 y=ax+b のグラフ（|a|<=2, |b|<=3程度で使用）
function linearGraph(a, b, color, reveal) {
  var cx=130, cy=120, sc=22, vw=260, vh=240;
  var x1p=-2, y1v=a*x1p+b, x2p=2, y2v=a*x2p+b;
  var gx1=cx+x1p*sc, gy1=cy-y1v*sc, gx2=cx+x2p*sc, gy2=cy-y2v*sc;
  var interceptY=cy-b*sc;
  var dots='<circle cx="'+cx+'" cy="'+interceptY+'" r="4.5" fill="'+color+'"/>'
    +'<circle cx="'+gx2+'" cy="'+gy2+'" r="4" fill="'+color+'"/>';
  if (reveal) dots += '<text x="'+(cx+6)+'" y="'+(interceptY-6)+'" fill="'+color+'" font-size="11">切片(0,'+b+')</text>';
  return '<svg viewBox="0 0 260 240" style="width:100%;max-width:280px;display:block;margin:0 auto">'
    + gridAxesParts(cx,cy,sc,5,vw,vh)
    + '<line x1="'+gx1+'" y1="'+gy1+'" x2="'+gx2+'" y2="'+gy2+'" stroke="'+color+'" stroke-width="2.5"/>'
    + dots
    + '</svg>';
}

// 二次関数 y=ax² のグラフ（放物線）
function parabolaGraph(a, color, reveal) {
  var cx=130, cy=120, sc=22, vw=260, vh=240;
  var arr=[];
  for (var xi=-20; xi<=20; xi++) {
    var x=xi/10, y=a*x*x;
    arr.push((cx+x*sc).toFixed(1)+','+(cy-y*sc).toFixed(1));
  }
  var path='M '+arr.join(' L ');
  var markX=2, markY=a*markX*markX;
  var mgx=cx+markX*sc, mgy=cy-markY*sc;
  var dots='<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="'+color+'"/>'
    +'<circle cx="'+mgx+'" cy="'+mgy+'" r="4" fill="'+color+'"/>';
  if (reveal) dots += '<text x="'+(mgx+6)+'" y="'+(mgy+(a>0?14:-6))+'" fill="'+color+'" font-size="11">('+markX+','+markY+')</text>';
  return '<svg viewBox="0 0 260 240" style="width:100%;max-width:280px;display:block;margin:0 auto">'
    + gridAxesParts(cx,cy,sc,5,vw,vh)
    + '<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="2.5"/>'
    + dots
    + '</svg>';
}

// 座標の読み方ガイド（第1象限のみ・ガイド点線つき）
var coordGuideSVG = '<svg viewBox="0 0 200 200" style="width:100%;max-width:220px;display:block;margin:0 auto">'
  + '<line x1="30" y1="10" x2="30" y2="180" stroke="#8b949e" stroke-width="1.5"/>'
  + '<line x1="20" y1="170" x2="190" y2="170" stroke="#8b949e" stroke-width="1.5"/>'
  + '<text x="185" y="185" fill="#8b949e" font-size="11">x</text>'
  + '<text x="10" y="20" fill="#8b949e" font-size="11">y</text>'
  + '<text x="20" y="185" fill="#8b949e" font-size="10">O</text>'
  + '<line x1="102" y1="122" x2="102" y2="170" stroke="#f5c518" stroke-width="1.5" stroke-dasharray="4,3"/>'
  + '<line x1="30" y1="122" x2="102" y2="122" stroke="#f5c518" stroke-width="1.5" stroke-dasharray="4,3"/>'
  + '<circle cx="102" cy="122" r="5" fill="#a371f7"/>'
  + '<text x="108" y="118" fill="#a371f7" font-size="13" font-weight="bold">P(3,2)</text>'
  + '<text x="94" y="184" fill="#f5c518" font-size="12">右に3</text>'
  + '<text x="2" y="126" fill="#f5c518" font-size="12">上に2</text>'
  + '</svg>';

// 点Pの座標を読み取る問題用（ラベルなし）
function pointReadSVG(px, py, color) {
  var cx=100, cy=100, sc=16, vw=200, vh=200;
  var gx=cx+px*sc, gy=cy-py*sc;
  return '<svg viewBox="0 0 200 200" style="width:100%;max-width:220px;display:block;margin:0 auto">'
    + gridAxesParts(cx,cy,sc,5,vw,vh)
    + '<circle cx="'+gx+'" cy="'+gy+'" r="5" fill="'+color+'"/>'
    + '<text x="'+(gx+8)+'" y="'+(gy-8)+'" fill="'+color+'" font-size="13" font-weight="bold">P</text>'
    + '</svg>';
}

// 一次関数のグラフの書き方（3ステップフロー）
var drawStepsSVG = '<svg viewBox="0 0 340 200" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<rect x="20" y="10" width="300" height="42" rx="8" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
  + '<text x="170" y="36" fill="#a371f7" font-size="13" text-anchor="middle">① 切片(0,b)に点を打つ</text>'
  + '<path d="M 170,52 L 170,68" stroke="#8b949e" stroke-width="2" marker-end="url(#fArrow)"/>'
  + '<rect x="20" y="70" width="300" height="42" rx="8" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="170" y="96" fill="#0ea5e9" font-size="13" text-anchor="middle">② 右に1、上にaだけ動いて点を打つ</text>'
  + '<path d="M 170,112 L 170,128" stroke="#8b949e" stroke-width="2" marker-end="url(#fArrow)"/>'
  + '<rect x="20" y="130" width="300" height="42" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
  + '<text x="170" y="156" fill="#3fb950" font-size="13" text-anchor="middle">③ 2つの点を通る直線を引く</text>'
  + '<defs><marker id="fArrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#8b949e"/></marker></defs>'
  + '</svg>';

// 傾き（変化の割合）＝ rise/run の階段図
var slopeStairSVG = '<svg viewBox="0 0 260 180" style="width:100%;max-width:280px;display:block;margin:0 auto">'
  + '<line x1="40" y1="140" x2="200" y2="40" stroke="#a371f7" stroke-width="2.5"/>'
  + '<circle cx="80" cy="115" r="4" fill="#a371f7"/>'
  + '<circle cx="160" cy="65" r="4" fill="#a371f7"/>'
  + '<line x1="80" y1="115" x2="160" y2="115" stroke="#f5c518" stroke-width="1.5" stroke-dasharray="4,3"/>'
  + '<line x1="160" y1="115" x2="160" y2="65" stroke="#3fb950" stroke-width="1.5" stroke-dasharray="4,3"/>'
  + '<text x="120" y="132" fill="#f5c518" font-size="11" text-anchor="middle">→ xの増加量</text>'
  + '<text x="200" y="95" fill="#3fb950" font-size="11">↑ yの増加量</text>'
  + '<text x="20" y="20" fill="#8b949e" font-size="12">傾き a ＝ yの増加量 ／ xの増加量</text>'
  + '</svg>';

// ===== SECTION 0: 導入 =====
function renderSection0() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん、関数ってやつが全然わかんない…比例も一次関数も二次関数もごちゃごちゃになってる…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">大丈夫。実は関数は全部「xを1つ決めると、yがただ1つに決まる」という同じ考え方の仲間なんだ。今日は基礎の基礎、座標の読み方から始めて、比例→一次関数→二次関数の順に、一つずつ積み上げていこう。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">座標の読み方から!? そんな前からやるの?</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">うん。土台がないまま応用をやっても崩れてしまう。今日でその土台を完全に作ろう。焦らなくていい。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 3つの関数を見比べてみよう</div>'
    + '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'
    + '<div style="flex:1;min-width:130px;text-align:center"><div style="font-size:12px;color:var(--purple);margin-bottom:4px;font-weight:bold">比例 y=x</div>' + propGraph(1,'#a371f7',false) + '</div>'
    + '<div style="flex:1;min-width:130px;text-align:center"><div style="font-size:12px;color:#0ea5e9;margin-bottom:4px;font-weight:bold">一次関数 y=x+2</div>' + linearGraph(1,2,'#0ea5e9',false) + '</div>'
    + '<div style="flex:1;min-width:130px;text-align:center"><div style="font-size:12px;color:var(--gold);margin-bottom:4px;font-weight:bold">二次関数 y=x²</div>' + parabolaGraph(1,'#f5c518',false) + '</div>'
    + '</div>'
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="note">💡 比例は原点を通る直線、一次関数は原点を通らないこともある直線、二次関数y=ax²は曲線（放物線）。形はちがうけど、どれも「xを決めるとyが決まる」仲間！</div>'
    + '</div>'
    + '</div>';

  html += '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">📐 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：関数の基礎（座標の読み方）<br>'
    + 'Section 2：比例の復習 y=ax<br>'
    + 'Section 3：一次関数 y=ax+b（傾きと切片）<br>'
    + 'Section 4：二次関数 y=ax²（放物線）'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">📐 Section 1 から始める →</button>';
  return html;
}

// ===== SECTION 1: 関数の基礎 =====
function renderSection1() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">そもそも「関数」ってどういう意味なの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">xの値を1つ決めると、yの値がただ1つに決まる——この関係のことだ。たとえばきょんの出演料は「出演回数×1000円」で決まる。回数(x)を決めれば、給料(y)は自動的に1つに決まるだろう？それが関数だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">なるほど…！じゃあグラフの点の読み方も教えて！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 関数とは</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">関数の定義</div>'
    + '<div class="ex">xの値を1つ決めると、yの値がただ1つに決まるとき、「yはxの関数」という</div>'
    + '<div class="note">💡 例：1回1000円のバイトで、出演回数x回のときの給料y円 → y=1000x（xを決めるとyが必ず1つに決まる！）</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 座標の読み方</div>'
    + coordGuideSVG
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">点(a,b)の読み方</div>'
    + '<div class="ex">原点Oから「右にa、上にb」進んだ点が(a,b)</div>'
    + '<div class="note">⚠️ aやbがマイナスのときは、右→左、上→下 に読み替える（例：(-2,3)は左に2、上に3）</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'点(3,2)は、原点から右にいくつ、上にいくつ進んだ点？', sub:'座標(a,b)は右にa、上にb', a:'右に3、上に2', choices:['右に3、上に2','右に2、上に3','右に3、下に2','左に3、上に2'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>点(a,b)は原点から右にa、上にb進んだ点</span><span class="exp-tip">💡 (3,2)なら右に3、上に2！</span>' },
    { q:'下の図の点Pの座標は？', svg:pointReadSVG(4,3,'#a371f7'), sub:'グリッドの目盛りを数えて読む', a:'(4,3)', choices:['(4,3)','(3,4)','(4,-3)','(-4,3)'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>右に何マス、上に何マスか目盛りを数える</span><span class="exp-tip">💡 右に4、上に3 → (4,3)！</span>' },
    { q:'下の図の点Pの座標は？', svg:pointReadSVG(-2,3,'#0ea5e9'), sub:'左方向はマイナスで表す', a:'(-2,3)', choices:['(-2,3)','(2,-3)','(-2,-3)','(2,3)'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>左に進んだ分はマイナスの数で表す</span><span class="exp-tip">💡 左に2、上に3 → (-2,3)！</span>' },
    { q:'表でx=2のときyはいくつ？', sub: xyTable([1,2,3],[2,4,6]), a:'4', choices:['4','2','6','8'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>表はxとyの対応を表す。同じ列を縦に読む</span><span class="exp-tip">💡 x=2の列を見るとy=4！</span>' },
    { q:'xの値を1つ決めたとき、yの値がただ1つに決まるとき、yはxの何と呼ぶ？', sub:'今日学んだ言葉の確認', a:'xの関数', choices:['xの関数','xの比例','xの変数','xの定数'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>「xを決めるとyがただ1つに決まる」関係を関数と呼ぶ</span><span class="exp-tip">💡 比例・一次関数・二次関数は、すべて関数の仲間！</span>' },
    { q:'1本80円のペンをx本買うときの代金y円を式にすると？', sub:'代金＝1本の値段×本数', a:'y=80x', choices:['y=80x','y=80+x','y=x/80','y=80-x'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>代金＝単価×個数 なので y=80×x=80x</span><span class="exp-tip">💡 xを決めればyがただ1つに決まる、これも関数！</span>' },
    { q:'上のペンの式でx=3のときのyの値は？', sub:'y=80xにx=3を代入', a:'240', choices:['240','83','27','83.3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=80×3=240</span><span class="exp-tip">💡 式にxの値をそのまま代入するだけ！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_func_s1_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 関数の基礎</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.svg ? q.svg : '')
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// 表を組み立てる簡易ヘルパー
function xyTable(xArr, yArr) {
  var xCells = xArr.map(function(v){ return '<td style="padding:6px 12px;text-align:center;color:var(--text)">'+v+'</td>'; }).join('');
  var yCells = yArr.map(function(v){ return '<td style="padding:6px 12px;text-align:center;color:var(--gold);font-weight:bold">'+v+'</td>'; }).join('');
  return '<table style="border-collapse:collapse;margin:10px auto;font-size:14px">'
    + '<tr><td style="padding:6px 12px;color:var(--text2);font-weight:bold;border-right:1px solid var(--border)">x</td>'+xCells+'</tr>'
    + '<tr><td style="padding:6px 12px;color:var(--text2);font-weight:bold;border-right:1px solid var(--border)">y</td>'+yCells+'</tr>'
    + '</table>';
}

// ===== SECTION 2: 比例の復習 =====
function renderSection2() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">比例なら中1でやったから覚えてるかも！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">いい調子だ。比例は関数の中でいちばんシンプルな形。ここをしっかり固めておけば、この後の一次関数がすごく理解しやすくなる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 比例の式とグラフ</div>'
    + propGraph(2,'#a371f7',true)
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">比例の式</div>'
    + '<div class="ex">y＝ax　（aは比例定数）</div>'
    + '<div class="note">💡 xが2倍、3倍…になると、yも2倍、3倍…になる。グラフは必ず原点(0,0)を通る直線！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'y=4xで、xの値が2倍になると、yの値は？', sub:'比例の一番の性質', a:'2倍になる', choices:['2倍になる','4倍になる','変わらない','半分になる'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>比例はxがn倍になるとyもn倍になる</span><span class="exp-tip">💡 xが2倍ならyも2倍！</span>' },
    { q:'y=3xについて、x=5のときのyの値は？', sub:'式にxの値を代入する', a:'15', choices:['15','8','35','53'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=3×5=15</span><span class="exp-tip">💡 式にそのまま数を入れるだけ！</span>' },
    { q:'点(2,6)を通る比例のグラフの式は？', sub:'a=yの値÷xの値', a:'y=3x', choices:['y=3x','y=2x','y=6x','y=4x'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>a=6÷2=3 なので y=3x</span><span class="exp-tip">💡 比例定数aは「yの値÷xの値」で求まる！</span>' },
    { q:'比例のグラフに共通する特徴は？', sub:'グラフの形の確認', a:'原点を通る直線', choices:['原点を通る直線','y軸に平行な直線','曲線（放物線）','x軸に平行な直線'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>比例y=axのグラフは必ず原点(0,0)を通る直線</span><span class="exp-tip">💡 x=0のときy=a×0=0だから、必ず原点を通る！</span>' },
    { q:'y=-2xのグラフはどんな直線？', sub:'aがマイナスの場合', a:'右下がりの直線（原点を通る）', choices:['右下がりの直線（原点を通る）','右上がりの直線（原点を通る）','原点を通らない直線','曲線'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>a>0なら右上がり、a<0なら右下がり</span><span class="exp-tip">💡 -2xはaがマイナスだから右下がり！</span>' },
    { q:'グラフより、この比例の式は？', svg:propGraph(-1,'#0ea5e9',false), sub:'グリッドから直線が通る点を読む', a:'y=-x', choices:['y=-x','y=x','y=-2x','y=2x'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>x=1のときy=-1を通っている → a=-1</span><span class="exp-tip">💡 原点と(1,-1)を通る右下がりの直線！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_func_s2_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 比例の復習</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.svg ? q.svg : '')
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 3: 一次関数 y=ax+b =====
function renderSection3() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">一次関数ってやつ、比例と何が違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">比例y=axに「+b」がついた形だ。y=ax+b。実は比例は、一次関数の中でb=0になっている特別な場合にすぎない。だからさっきの比例の知識がそのまま使える。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">aとbって何を表してるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">aは「傾き」。xが1増えるとyがaだけ増える度合いだ。bは「切片」。x=0のときのyの値で、グラフがy軸と交わる点になる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 一次関数の式</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">一次関数の式</div>'
    + '<div class="ex">y＝ax＋b　（a：傾き、b：切片）</div>'
    + '<div class="note">💡 比例y=axは、一次関数のb=0の特別な場合！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">a（傾き）とb（切片）の意味</div>'
    + '<div class="ex">a＝傾き＝変化の割合＝xが1増えたときのyの増加量</div>'
    + '<div class="ex">b＝切片＝x=0のときのyの値＝グラフがy軸と交わる点</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 傾きの求め方</div>'
    + slopeStairSVG
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="ex">2点(x1,y1),(x2,y2)から a＝(y2－y1)／(x2－x1)</div>'
    + '<div class="note">💡 「yがどれだけ変わったか」÷「xがどれだけ変わったか」で傾きが求まる！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 グラフの書き方（3ステップ）</div>'
    + drawStepsSVG
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="ex">例：y=2x+1 なら、(0,1)に点 → 右に1・上に2で(1,3)に点 → 直線で結ぶ</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'y=2x+3の傾きと切片は？', sub:'y=ax+bのaとbを読む', a:'傾き2、切片3', choices:['傾き2、切片3','傾き3、切片2','傾き2、切片-3','傾き-2、切片3'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>xの前の数が傾きa、+のあとの数が切片b</span><span class="exp-tip">💡 y=2x+3 → 傾き2、切片3！</span>' },
    { q:'y=-3x+1の切片は？', sub:'切片＝x=0のときのyの値', a:'1', choices:['1','-3','-1','3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>x=0を代入 → y=-3×0+1=1</span><span class="exp-tip">💡 切片は+のあとの数字がそのまま答え！</span>' },
    { q:'傾き4、切片-2の一次関数の式は？', sub:'a=4, b=-2をy=ax+bに当てはめる', a:'y=4x-2', choices:['y=4x-2','y=-2x+4','y=4x+2','y=2x-4'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=ax+bにa=4,b=-2を代入 → y=4x-2</span><span class="exp-tip">💡 傾きがxの前、切片がそのあとに来る！</span>' },
    { q:'y=x+5のグラフは、y軸のどの点を通る？', sub:'切片＝y軸との交点', a:'(0,5)', choices:['(0,5)','(5,0)','(0,-5)','(1,5)'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>切片bのグラフは必ず(0,b)を通る</span><span class="exp-tip">💡 y=x+5の切片は5だから(0,5)！</span>' },
    { q:'xが1増えるとyが3増える一次関数の傾きは？', sub:'傾き＝yの増加量÷xの増加量', a:'3', choices:['3','1','-3','1/3'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>xが1増えたときのyの増加量が、そのまま傾き</span><span class="exp-tip">💡 傾き＝3÷1＝3！</span>' },
    { q:'2点(0,1)と(2,7)を通る一次関数の傾きは？', sub:'a=(y2-y1)/(x2-x1)', a:'3', choices:['3','2','6','1/3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>a=(7-1)/(2-0)=6/2=3</span><span class="exp-tip">💡 yの変化6をxの変化2で割る！</span>' },
    { q:'一次関数 y=2x-1 で、x=3のときのyの値は？', sub:'式にxを代入する', a:'5', choices:['5','6','7','4'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=2×3-1=6-1=5</span><span class="exp-tip">💡 代入の順番：かけ算を先にしてからひき算！</span>' },
    { q:'比例 y=3x と一次関数 y=3x+2 のグラフの関係は？', sub:'傾きが同じで切片だけ違う', a:'平行な直線（比例のグラフを上に2ずらした形）', choices:['平行な直線（比例のグラフを上に2ずらした形）','同じ直線','垂直に交わる直線','曲線と直線'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>傾きaが同じ2直線は必ず平行になる</span><span class="exp-tip">💡 切片だけ違う＝比例のグラフを上下にずらした形！</span>' },
    { q:'次のうち、原点を通らないグラフはどれ？', sub:'切片b≠0なら原点を通らない', a:'y=2x+1', choices:['y=2x+1','y=2x','y=-x','y=0.5x'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>切片b=0のときだけ原点を通る</span><span class="exp-tip">💡 y=2x+1は切片が1（0ではない）から原点を通らない！</span>' },
    { q:'グラフより、この一次関数の式は？', svg:linearGraph(-1,3,'#e94560',false), sub:'y軸との交点（切片）と傾きを読む', a:'y=-x+3', choices:['y=-x+3','y=x+3','y=-x-3','y=-3x+1'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>切片は(0,3)、右へ1進むと下へ1（傾き-1）</span><span class="exp-tip">💡 切片3、傾き-1 → y=-x+3！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_func_s3_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 一次関数 y=ax+b</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.svg ? q.svg : '')
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 4: 二次関数 y=ax² =====
function renderSection4() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">やっと二次関数だ…でも比例や一次関数と全然違う気がする！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">式の形は似ている。y=ax²、つまり「xの2乗に比例する」関数だ。ただしグラフは直線じゃなく、曲線（放物線）になる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">なんで曲線になるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">xを2乗すると、xが少し増えるだけでyが急に大きくなるからだ。表を作って確かめてみよう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 二次関数の式と対応表</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">二次関数の式</div>'
    + '<div class="ex">y＝ax²　（xの2乗に比例）</div>'
    + '</div>'
    + '<div style="text-align:center">' + xyTable([-3,-2,-1,0,1,2,3],[9,4,1,0,1,4,9]) + '</div>'
    + '<div class="rule-box" style="margin-top:8px">'
    + '<div class="note">💡 y=x²の表。x=-3もx=3もyは同じ9になっている（xとーxで同じ値になる）！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 グラフの形（放物線）</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    + '<div style="flex:1;min-width:130px;text-align:center"><div style="font-size:12px;color:var(--purple);margin-bottom:4px;font-weight:bold">a=1（下に凸）</div>' + parabolaGraph(1,'#a371f7',true) + '</div>'
    + '<div style="flex:1;min-width:130px;text-align:center"><div style="font-size:12px;color:var(--red);margin-bottom:4px;font-weight:bold">a=-1（上に凸）</div>' + parabolaGraph(-1,'#e94560',true) + '</div>'
    + '</div>'
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">二次関数y=ax²の性質</div>'
    + '<div class="ex">① グラフは放物線（曲線）で、必ず原点(0,0)を通る</div>'
    + '<div class="ex">② y軸について線対称（xと-xを代入すると同じ値になるため）</div>'
    + '<div class="ex">③ a＞0のとき下に凸（お椀型）、a＜0のとき上に凸</div>'
    + '<div class="note">⚠️ 一次関数までとちがい、直線ではなく曲線になることを忘れずに！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'y=2x²で、x=3のときのyの値は？', sub:'式にxを代入する（2乗を先に計算）', a:'18', choices:['18','6','9','36'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=2×3²=2×9=18</span><span class="exp-tip">💡 先に3²=9を計算してから2をかける！</span>' },
    { q:'y=-x²で、x=-2のときのyの値は？', sub:'(-2)²は必ずプラスになることに注意', a:'-4', choices:['-4','4','-2','2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>(-2)²=4。y=-1×4=-4</span><span class="exp-tip">💡 2乗の計算が先、マイナスをかけるのはそのあと！</span>' },
    { q:'y=x²のグラフの形は？', sub:'グラフの基本形', a:'放物線（下に凸）', choices:['放物線（下に凸）','直線','放物線（上に凸）','円'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>a>0の二次関数y=ax²は下に凸の放物線</span><span class="exp-tip">💡 y=x²はa=1でプラスだから下に凸！</span>' },
    { q:'y=-3x²のグラフは、上に凸？下に凸？', sub:'aの符号を確認', a:'上に凸', choices:['上に凸','下に凸','直線','わからない'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>a<0のときは上に凸</span><span class="exp-tip">💡 -3x²はaがマイナスだから上に凸！</span>' },
    { q:'y=x²で、x=2のときとx=-2のときのyの値を比べると？', sub:'y軸対称の性質', a:'同じ値になる', choices:['同じ値になる','x=2の方が大きい','x=-2の方が大きい','符号が逆になる'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>xと-xを代入すると(-x)²=x²で同じ値になる</span><span class="exp-tip">💡 2²=4、(-2)²=4で同じ！だからy軸に対して線対称！</span>' },
    { q:'表（y=2x²）で、x=-1のときのyの値（?）は？', svg:'', sub: xyTable([-2,-1,0,1,2],[8,'?',0,2,8]), a:'2', choices:['2','-2','4','1'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=2×(-1)²=2×1=2</span><span class="exp-tip">💡 (-1)²=1を忘れずに！</span>' },
    { q:'点(2,8)を通るy=ax²のaの値は？', sub:'8=a×2² からaを求める', a:'2', choices:['2','4','8','16'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>8=a×4 なので a=8÷4=2</span><span class="exp-tip">💡 座標をy=ax²に代入してaを逆算する！</span>' },
    { q:'y=ax²のグラフがy軸について線対称なのはなぜ？', sub:'対称になる理由', a:'xと-xを代入すると同じ(-x)²=x²になるから', choices:['xと-xを代入すると同じ(-x)²=x²になるから','aの値が正だから','xが2乗されないから','グラフが直線だから'],
      exp:'<span class="exp-rule"><span class="label">📐 理由</span>(-x)²=x²なので、xとーxで必ずyの値が同じになる</span><span class="exp-tip">💡 これが二次関数だけが持つ「対称性」の理由！</span>' },
    { q:'下のグラフのaは正・負どちら？', svg:parabolaGraph(-1,'#0ea5e9',false), sub:'上に凸か下に凸かで判断', a:'負（マイナス）', choices:['負（マイナス）','正（プラス）','0','わからない'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>上に凸のグラフはa<0</span><span class="exp-tip">💡 このグラフは上に凸だからaは負！</span>' },
    { q:'一次関数のグラフは直線、二次関数y=ax²のグラフは？', sub:'グラフの形の違い', a:'曲線（放物線）', choices:['曲線（放物線）','直線','点だけ','関係ない図形'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>二次関数のグラフは直線ではなく曲線（放物線）</span><span class="exp-tip">💡 xの2乗が入っているから、まっすぐな線にはならない！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_func_s4_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 二次関数 y=ax²</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.svg ? q.svg : '')
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 5: 確認テスト =====
function renderSection5() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">Section 1〜4の総まとめだ。関数の基礎・比例・一次関数・二次関数——全部出るよ。自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'点(5,1)は、原点から右にいくつ、上にいくつ進んだ点？', a:'右に5、上に1', choices:['右に5、上に1','右に1、上に5','右に5、下に1','左に5、上に1'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>点(a,b)は右にa、上にb</span>' },
    { q:'xを1つ決めるとyがただ1つに決まる関係を何という？', a:'xの関数', choices:['xの関数','xの比例','xの変数','xの整数'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>これが関数の定義</span>' },
    { q:'1個150円のりんごをx個買うときの代金y円の式は？', a:'y=150x', choices:['y=150x','y=150+x','y=x/150','y=150-x'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>代金＝単価×個数</span>' },
    { q:'y=5xで、x=4のときのyの値は？', a:'20', choices:['20','9','1.25','54'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=5×4=20</span>' },
    { q:'点(3,9)を通る比例のグラフの式は？', a:'y=3x', choices:['y=3x','y=9x','y=6x','y=1/3x'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>a=9÷3=3</span>' },
    { q:'比例のグラフの特徴は？', a:'原点を通る直線', choices:['原点を通る直線','曲線','y軸に平行','x軸に平行'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>比例は必ず原点を通る</span>' },
    { q:'y=2x+5の傾きと切片は？', a:'傾き2、切片5', choices:['傾き2、切片5','傾き5、切片2','傾き2、切片-5','傾き-2、切片5'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>xの前が傾き、+のあとが切片</span>' },
    { q:'y=-x+4の切片は？', a:'4', choices:['4','-1','-4','1'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>x=0を代入するとy=4</span>' },
    { q:'傾き-3、切片1の一次関数の式は？', a:'y=-3x+1', choices:['y=-3x+1','y=1x-3','y=-3x-1','y=3x+1'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=ax+bにa=-3,b=1を代入</span>' },
    { q:'y=3x-2の、xが1増えるときのyの増え方は？', a:'3増える', choices:['3増える','2増える','-2増える','1増える'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>傾き3がそのままyの増加量</span>' },
    { q:'2点(0,2)と(3,11)を通る一次関数の傾きは？', a:'3', choices:['3','9','11','1/3'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>a=(11-2)/(3-0)=9/3=3</span>' },
    { q:'y=4x+1で、x=2のときのyの値は？', a:'9', choices:['9','8','7','10'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=4×2+1=9</span>' },
    { q:'y=2xとy=2x-3のグラフの関係は？', a:'平行な直線', choices:['平行な直線','同じ直線','垂直な直線','無関係'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>傾きが同じ2直線は平行</span>' },
    { q:'y=3x²で、x=2のときのyの値は？', a:'12', choices:['12','6','9','36'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=3×2²=3×4=12</span>' },
    { q:'y=-2x²で、x=3のときのyの値は？', a:'-18', choices:['-18','18','-6','-36'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>y=-2×3²=-2×9=-18</span>' },
    { q:'y=x²のグラフはy軸について何？', a:'線対称', choices:['線対称','点対称','平行','垂直'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>(-x)²=x²なのでy軸対称</span>' },
    { q:'y=-x²のグラフは上に凸？下に凸？', a:'上に凸', choices:['上に凸','下に凸','直線','円'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>aがマイナスなので上に凸</span>' },
    { q:'点(3,18)を通るy=ax²のaの値は？', a:'2', choices:['2','3','6','9'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>18=a×9 なのでa=2</span>' },
    { q:'y=x²で、x=4とx=-4のときのyの値の関係は？', a:'同じ値になる', choices:['同じ値になる','符号が逆になる','xの分だけ違う','関係ない'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>4²=16、(-4)²=16で同じ</span>' },
    { q:'二次関数y=ax²のグラフの名前は？', a:'放物線', choices:['放物線','双曲線','直線','円'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>二次関数のグラフは放物線と呼ぶ</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_func_s5_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">📝 確認テスト — 全セクション総まとめ（20問）</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:3, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + makeChoices(qid, q.choices, q.a, 3)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

function showFinalResult() {
  var s5qids = [];
  for (var i = 0; i < 20; i++) { s5qids.push('math_func_s5_q' + i); }
  var correct = 0, total = 0;
  s5qids.forEach(function(qid) {
    if (answeredSet[qid]) {
      total++;
      var d = weakDB[qid];
      if (d && d.correct > 0) correct++;
    }
  });
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '📺' : '🎤';
  var msg = pct >= 90
    ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。関数は完全に君のものだね」'
    : pct >= 70
    ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50
    ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。復習してもう一度挑戦しよう」'
    : 'きょん「むずっ…でもここから這い上がる！！」<br>西村「Section 1〜4を復習してから再挑戦しよう」';

  var overlay = document.getElementById('resultOverlay');
  overlay.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;box-sizing:border-box">'
    + '<div style="background:var(--bg2);border:2px solid var(--gold);border-radius:20px;padding:36px 28px;max-width:480px;width:100%;text-align:center">'
    + '<div style="font-size:64px;margin-bottom:12px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--gold);letter-spacing:3px;margin-bottom:8px">テスト終了！</div>'
    + '<div style="font-size:60px;color:var(--gold);font-weight:bold;margin:8px 0">' + pct + '<span style="font-size:28px">%</span></div>'
    + '<div style="font-size:16px;color:var(--text2);margin-bottom:4px">' + correct + ' / ' + total + ' 問正解</div>'
    + '<div style="font-size:15px;line-height:1.8;color:var(--text2);margin:16px 0;padding:16px;background:var(--bg3);border-radius:12px">' + msg + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">'
    + '<button id="res_weak_btn" style="background:var(--red);color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を見る</button>'
    + '<button id="res_retry_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">🔄 もう一度</button>'
    + '<button id="res_s1_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">📐 Section 1へ</button>'
    + '</div>'
    + '</div></div>';
  overlay.style.display = 'block';
  var rwb = document.getElementById('res_weak_btn');
  if (rwb) rwb.addEventListener('click', function(){ closeResult(); goSection(6); });
  var rrb = document.getElementById('res_retry_btn');
  if (rrb) rrb.addEventListener('click', function(){ closeResult(); goSection(5); });
  var rsb = document.getElementById('res_s1_btn');
  if (rsb) rsb.addEventListener('click', function(){ closeResult(); goSection(1); });
}

function closeResult() { document.getElementById('resultOverlay').style.display = 'none'; }

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 6;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_func_') === 0; });
  var wqs = getWeakQuestions();

  if (allQids.length === 0) {
    mc.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      + '<div style="font-size:48px;margin-bottom:16px">📊</div>'
      + '<div style="font-size:18px;margin-bottom:8px">まだデータがありません</div>'
      + '<div style="font-size:14px">問題を解くと自動で記録されます</div>'
      + '</div>';
    return;
  }

  var sorted = allQids.slice().sort(function(a,b){ return getPct(a)-getPct(b); });
  var html = '<div style="margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap">'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--gold)">' + allQids.length + '</div><div style="font-size:11px;color:var(--text2)">記録済み問題</div></div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--red)">' + wqs.length + '</div><div style="font-size:11px;color:var(--text2)">要特訓（80%未満）</div></div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--green)">' + (allQids.length - wqs.length) + '</div><div style="font-size:11px;color:var(--text2)">習得済み</div></div>'
    + '</div>';

  sorted.forEach(function(qid) {
    var d = weakDB[qid];
    var pct = getPct(qid);
    var barColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
    html += '<div style="background:var(--bg2);border:1px solid ' + barColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(163,113,247,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text);line-height:1.6">' + getJpForQid(qid) + '</div><div style="font-size:13px;color:' + barColor + '">' + (d.answer || '') + '</div></div>'
      + '<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div>'
      + '<div style="width:80px;height:5px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px"></div></div></div>'
      + '</div>';
  });

  if (wqs.length > 0) {
    html += '<button id="go_tokku_btn" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }
  mc.innerHTML = html;
  var gtb = document.getElementById('go_tokku_btn');
  if (gtb) gtb.addEventListener('click', function() { goSection(7); });
}

// ===== 特訓モード =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };

function renderTokkuMode() {
  currentSection = 7;
  renderTabs();
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');

  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete">'
      + '<div class="tokku-complete-emoji">🏆</div>'
      + '<div class="tokku-complete-title">弱点ゼロ！</div>'
      + '<div class="tokku-complete-msg">きょん「俺、無敵になったわ！！」<br>西村「本当に成長したね」</div>'
      + '<button id="tokku_zero_back" style="margin-top:24px;background:var(--purple);color:#fff;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button>'
      + '</div>';
    var zb = document.getElementById('tokku_zero_back');
    if (zb) zb.addEventListener('click', function() { goSection(1); });
    return;
  }

  tokkuQueue = wqs.slice(0, 15);
  tokkuIndex = 0;
  tokkuSession = { correct:0, total:0 };
  renderTokkuCard();
}

function renderTokkuCard() {
  var mc = document.getElementById('mainContent');
  if (tokkuIndex >= tokkuQueue.length) { showTokkuComplete(); return; }
  var qid = tokkuQueue[tokkuIndex];
  var d = weakDB[qid];
  if (!d) { tokkuIndex++; renderTokkuCard(); return; }

  var pct = getPct(qid);
  var color = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
  var hasChoices = d.choices && d.choices.length > 0;
  var shuffled = hasChoices ? d.choices.slice().sort(function(){ return Math.random()-0.5; }) : [];

  var bodyHtml = '';
  if (hasChoices) {
    bodyHtml = '<div class="tokku-choices">'
      + shuffled.map(function(c) {
          return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c.replace(/"/g, '&quot;') + '">' + c + '</button>';
        }).join('')
      + '</div>';
  } else {
    bodyHtml = '<div class="input-wrap" style="justify-content:center;margin-top:12px">'
      + '<input class="q-input" id="tokku_inp" type="text" placeholder="答えを入力" style="max-width:200px">'
      + '<button id="tokku_inp_btn" style="background:var(--purple);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">確認</button>'
      + '</div>';
  }

  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp">' + getJpForQid(qid) + '</div>'
    + bodyHtml
    + '<div class="tokku-result" id="tokku_result" style="display:none"></div>'
    + '<button id="tokku_next" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題 →</button>'
    + '</div>';

  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleTokkuChoice(btn.dataset.tqid, btn.dataset.tchoice); });
  });
  var nextBtn = document.getElementById('tokku_next');
  if (nextBtn) nextBtn.addEventListener('click', function() { tokkuIndex++; renderTokkuCard(); });

  var inpBtn = document.getElementById('tokku_inp_btn');
  if (inpBtn) inpBtn.addEventListener('click', function() { handleTokkuInput(qid); });
  var inp = document.getElementById('tokku_inp');
  if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleTokkuInput(qid); });
}

function handleTokkuInput(qid) {
  var inp = document.getElementById('tokku_inp');
  if (!inp) return;
  var val = inp.value.trim();
  if (!val) return;
  var d = weakDB[qid];
  if (!d) return;
  var norm = function(s) { return s.trim().replace(/\s+/g,'').toLowerCase(); };
  var correct = norm(val) === norm(d.answer);
  applyTokkuResult(qid, correct, d);
}

function handleTokkuChoice(qid, choice) {
  var d = weakDB[qid];
  if (!d) return;
  var correct = choice === d.answer;
  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b) { b.disabled = true; });
  var chosenBtn = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + choice.replace(/"/g, '&quot;') + '"]');
  if (chosenBtn) chosenBtn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
  if (!correct) {
    var okBtn = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + d.answer.replace(/"/g, '&quot;') + '"]');
    if (okBtn) okBtn.classList.add('show-correct');
  }
  applyTokkuResult(qid, correct, d);
}

function applyTokkuResult(qid, correct, d) {
  tokkuSession.total++;
  weakDB[qid].total++;
  if (correct) { weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();

  var newPct = getPct(qid);
  var res = document.getElementById('tokku_result');
  if (res) {
    if (correct) {
      xp += 1; localStorage.setItem('math_xp', xp); updateXP();
      res.className = 'tokku-result tokku-correct';
      res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 この問題は卒業！' : ' 正答率 → ' + newPct + '%');
      showToast(getComment('correct'));
    } else {
      deductXP(3);
      res.className = 'tokku-result tokku-wrong';
      res.innerHTML = '❌ 間違い！　正答率 → ' + newPct + '%<div class="tokku-answer">正解: ' + d.answer + '</div>';
      showToast('きょん「また間違えた！！でも諦めない！！」');
    }
    res.style.display = 'block';
  }
  var nb = document.getElementById('tokku_next');
  if (nb) nb.style.display = 'block';
}

function showTokkuComplete() {
  var mc = document.getElementById('mainContent');
  var pctAll = tokkuSession.total > 0 ? Math.round(tokkuSession.correct / tokkuSession.total * 100) : 0;
  var emoji = pctAll >= 80 ? '🏆' : pctAll >= 60 ? '😎' : '💪';
  mc.innerHTML = '<div class="tokku-complete">'
    + '<div class="tokku-complete-emoji">' + emoji + '</div>'
    + '<div class="tokku-complete-title">特訓終了！</div>'
    + '<div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div>'
    + '<div class="tokku-complete-msg">' + (pctAll >= 80 ? 'きょん「全部わかった！！」<br>西村「よくやった」' : 'きょん「難しかった…でも諦めない！！」<br>西村「繰り返すことが力になる」') + '</div>'
    + '<div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button id="tokku_retry_btn" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回！</button>'
    + '<button id="tokku_back_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">Section 1 へ戻る</button>'
    + '</div></div>';
  renderWeakBar();
  var rb = document.getElementById('tokku_retry_btn');
  if (rb) rb.addEventListener('click', function() { renderTokkuMode(); });
  var bb = document.getElementById('tokku_back_btn');
  if (bb) bb.addEventListener('click', function() { goSection(1); });
}

// ===== INIT =====
repairWeakDB();
updateXP();
renderWeakBar();
renderTabs();
goSection(0);
