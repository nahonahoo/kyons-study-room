// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「平方根？ルート？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺ルート得意かも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「根号で漫才できるかもしれない」' },
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
var answeredSet  = JSON.parse(localStorage.getItem('math_sqrt_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_sqrt_sections') || '{}');
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
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
}
function addXP(pts, qid) {
  if (answeredSet[qid]) return false;
  var oldLv = getLevel(xp).lv;
  xp += pts;
  answeredSet[qid] = true;
  localStorage.setItem('math_xp', xp);
  localStorage.setItem('math_sqrt_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('math_sqrt_') === 0 && getPct(id) < 80;
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
    'きょん「待って待って、全部わかってきた！！」',
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
  // Section 1：基本（意味・比較・整数で挟む）
  'math_sqrt_s1_q0':'16の平方根を求めよ',
  'math_sqrt_s1_q1':'√25の値は？',
  'math_sqrt_s1_q2':'√7と√10の大小関係を正しく表したものは？',
  'math_sqrt_s1_q3':'3 < √a < 4 となる整数aは何個ある？',
  'math_sqrt_s1_q4':'-√16の値は？',
  'math_sqrt_s1_q5':'√(5²)の値は？',
  'math_sqrt_s1_q6':'n < √50 < n+1 となる整数nは？',
  'math_sqrt_s1_q7':'√2, √3, 2 を小さい順に正しく並べたものは？',
  // Section 2：変形・計算
  'math_sqrt_s2_q0':'√2×√8の値は？',
  'math_sqrt_s2_q1':'√12を簡単にすると？',
  'math_sqrt_s2_q2':'√18を簡単にすると？',
  'math_sqrt_s2_q3':'√45を簡単にすると？',
  'math_sqrt_s2_q4':'√48÷√3の値は？',
  'math_sqrt_s2_q5':'1/√3を有理化すると？',
  'math_sqrt_s2_q6':'√8×√2の値は？',
  'math_sqrt_s2_q7':'√72を簡単にすると？',
  // Section 3：加法・減法・展開
  'math_sqrt_s3_q0':'3√2+5√2の値は？',
  'math_sqrt_s3_q1':'7√3-2√3の値は？',
  'math_sqrt_s3_q2':'√8+√2の値は？',
  'math_sqrt_s3_q3':'√18-√2の値は？',
  'math_sqrt_s3_q4':'(√2+1)(√2-1)の値は？',
  'math_sqrt_s3_q5':'(√3+√2)²の値は？',
  'math_sqrt_s3_q6':'(√5+2)(√5-2)の値は？',
  'math_sqrt_s3_q7':'2√3+√12の値は？',
  // Section 4（確認テスト）
  'math_sqrt_s4_q0':'25の平方根を求めよ',
  'math_sqrt_s4_q1':'√49の値は？',
  'math_sqrt_s4_q2':'-√9の値は？',
  'math_sqrt_s4_q3':'√(7²)の値は？',
  'math_sqrt_s4_q4':'4 < √a < 5 となる整数aは何個ある？',
  'math_sqrt_s4_q5':'√5, √6, 2.5 を小さい順に正しく並べたものは？',
  'math_sqrt_s4_q6':'√3×√12の値は？',
  'math_sqrt_s4_q7':'√20を簡単にすると？',
  'math_sqrt_s4_q8':'√32を簡単にすると？',
  'math_sqrt_s4_q9':'√27÷√3の値は？',
  'math_sqrt_s4_q10':'1/√5を有理化すると？',
  'math_sqrt_s4_q11':'√50を簡単にすると？',
  'math_sqrt_s4_q12':'√24÷√6の値は？',
  'math_sqrt_s4_q13':'4√5+3√5の値は？',
  'math_sqrt_s4_q14':'9√2-4√2の値は？',
  'math_sqrt_s4_q15':'√12+√3の値は？',
  'math_sqrt_s4_q16':'√20-√5の値は？',
  'math_sqrt_s4_q17':'(√6+1)(√6-1)の値は？',
  'math_sqrt_s4_q18':'(√2+√3)²の値は？',
  'math_sqrt_s4_q19':'3√5+√20の値は？',
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
    if (qid.indexOf('math_sqrt_') !== 0) return;
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
  localStorage.setItem('math_sqrt_answered', JSON.stringify(answeredSet));
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
  var prefix = 'math_sqrt_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_sqrt_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb && nb.style.display === 'none') {
      nb.style.display = 'block';
      if (!document.getElementById('secCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 4 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '確認テストへ挑戦！';
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
  { id:0, label:'√ スタート',    title:'平方根の世界へようこそ',   sub:'二学期最初のテスト範囲！今日でルートを得意にする' },
  { id:1, label:'基本',          title:'平方根の基本',              sub:'意味・大小比較・整数で挟む考え方' },
  { id:2, label:'変形・計算',    title:'根号の変形と計算',          sub:'掛け算・割り算・簡単にする・有理化' },
  { id:3, label:'加減・展開',    title:'根号の加法・減法・展開',    sub:'同類項としてまとめる・乗法公式の利用' },
  { id:4, label:'確認テスト',    title:'確認テスト',                sub:'全セクション総まとめ！何問正解できる？' },
  { id:5, label:'📊弱点',        title:'弱点ノート',                sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',        title:'弱点特訓モード',            sub:'弱点問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab'
      + (s.id >= 5 ? ' tokku' : '')
      + (s.id === currentSection ? ' active' : '')
      + (sectionDone[s.id] && s.id < 5 ? ' done' : '');
    var label = s.label + (sectionDone[s.id] && s.id < 5 ? ' ✓' : '');
    if (s.id === 6) { var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
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
  if (id === 5) { renderWeakNote(); return; }
  if (id === 6) { renderTokkuMode(); return; }

  var s = SECTIONS[id];
  var html = '';
  html += '<div class="progress-dots">';
  for (var i = 0; i <= 4; i++) {
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">数学 平方根 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';

  if      (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();

  if (id >= 1 && id <= 4) {
    var nextLabel = id < 4 ? '次のセクションへ →' : '🏆 結果を見る！';
    html += '<button class="next-section-btn" id="nextBtn" data-goto="' + (id < 4 ? id+1 : 'result') + '" style="display:none">' + nextLabel + '</button>';
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
var SVG = {
  // 数直線上での平方根の位置（整数で挟む考え方）
  numberLine: '<svg viewBox="0 0 340 130" style="width:100%;max-width:380px;display:block;margin:0 auto">'
    + '<line x1="20" y1="60" x2="320" y2="60" stroke="#8b949e" stroke-width="2"/>'
    + '<circle cx="20" cy="60" r="3" fill="#8b949e"/><text x="20" y="80" fill="#8b949e" font-size="12" text-anchor="middle">3</text>'
    + '<circle cx="170" cy="60" r="3" fill="#8b949e"/><text x="170" y="80" fill="#8b949e" font-size="12" text-anchor="middle">4</text>'
    + '<circle cx="320" cy="60" r="3" fill="#8b949e"/><text x="320" y="80" fill="#8b949e" font-size="12" text-anchor="middle">5</text>'
    + '<text x="20" y="45" fill="#3fb950" font-size="11" text-anchor="middle">3²=9</text>'
    + '<text x="170" y="45" fill="#3fb950" font-size="11" text-anchor="middle">4²=16</text>'
    + '<text x="320" y="45" fill="#3fb950" font-size="11" text-anchor="middle">5²=25</text>'
    + '<circle cx="128" cy="60" r="5" fill="#e94560"/>'
    + '<text x="128" y="105" fill="#e94560" font-size="13" text-anchor="middle" font-weight="bold">√14 ≈ 3.74</text>'
    + '<text x="170" y="120" fill="#8b949e" font-size="11" text-anchor="middle">9 &lt; 14 &lt; 16 だから 3 &lt; √14 &lt; 4</text>'
    + '</svg>',

  // 素因数分解で根号を簡単にする（√12の例）
  factorTree: '<svg viewBox="0 0 320 180" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<circle cx="160" cy="25" r="22" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
    + '<text x="160" y="30" fill="#a371f7" font-size="14" text-anchor="middle">12</text>'
    + '<line x1="160" y1="47" x2="100" y2="85" stroke="#8b949e" stroke-width="1.5"/>'
    + '<line x1="160" y1="47" x2="220" y2="85" stroke="#8b949e" stroke-width="1.5"/>'
    + '<circle cx="100" cy="95" r="20" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<text x="100" y="100" fill="#0ea5e9" font-size="13" text-anchor="middle">4</text>'
    + '<circle cx="220" cy="95" r="20" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="220" y="100" fill="#f5c518" font-size="13" text-anchor="middle">3</text>'
    + '<line x1="100" y1="115" x2="70" y2="145" stroke="#8b949e" stroke-width="1.5"/>'
    + '<line x1="100" y1="115" x2="130" y2="145" stroke="#8b949e" stroke-width="1.5"/>'
    + '<circle cx="70" cy="155" r="16" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="70" y="160" fill="#3fb950" font-size="12" text-anchor="middle">2</text>'
    + '<circle cx="130" cy="155" r="16" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="130" y="160" fill="#3fb950" font-size="12" text-anchor="middle">2</text>'
    + '<text x="100" y="178" fill="#3fb950" font-size="10" text-anchor="middle">同じ数が2つ＝ペア！外に出せる</text>'
    + '<text x="255" y="150" fill="#8b949e" font-size="12">√12 ＝ √(2×2×3)</text>'
    + '<text x="255" y="168" fill="#e94560" font-size="13" font-weight="bold">＝ 2√3</text>'
    + '</svg>',
};

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">√ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん、二学期最初のテストが平方根と二次方程式らしいんだけど、ルートって記号からしてもう嫌なんだけど！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">√（根号）は「2乗するとこの数になる」という意味を表す記号なだけだ。9の平方根は3と-3——2乗すると9になる数が2つある、それだけ。怖くない。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">√12とか、キリの悪い数字が出てきたらどうすんの！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">素因数分解して「同じ数のペア」を探すだけだ。ペアを見つけたら√の外に出せる。このパターンさえ覚えれば、二次方程式の解の公式にもそのままつながる。今日で土台を固めよう。</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">√ この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：平方根の基本（意味・大小比較・整数で挟む）<br>'
    + 'Section 2：根号の変形と計算（掛け算・割り算・簡単にする・有理化）<br>'
    + 'Section 3：根号の加法・減法・展開（同類項としてまとめる・乗法公式）'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">√ Section 1 から始める →</button>';
}

// ===== SECTION 1: 平方根の基本 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">√ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「9の平方根」と「√9」って同じ意味じゃないの？なんか違う気がする！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">いいところに気づいた。「9の平方根」は2乗して9になる数、つまり+3と-3の両方。でも「√9」は根号記号がついた「正の方だけ」を表す——だから√9＝3（+3だけ）。ここを混同する人が本当に多い。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">√ 平方根の意味</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">定義</div>'
    + '<div class="ex">aの平方根 ＝ 2乗するとaになる数（正と負の<strong style="color:var(--gold)">2つ</strong>）</div>'
    + '<div class="ex">例：9の平方根 ＝ <strong style="color:var(--gold)">±3</strong>（3²=9、(-3)²=9）</div>'
    + '<div class="note">⚠️「9の平方根を求めよ」→ ±3（2つ答える）。「√9の値は？」→ 3（正の方だけ）。この違いが最重要！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">√(a²)の形</div>'
    + '<div class="ex">√(a²) ＝ a（aが正のとき）</div>'
    + '<div class="note">💡 根号の中が「2乗の形」なら、根号を外すだけでOK！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">√ 大小比較と「整数で挟む」考え方</div>'
    + SVG.numberLine
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">大小比較のルール</div>'
    + '<div class="ex">根号の中の数が大きいほど、平方根も大きい（a&lt;bなら√a&lt;√b）</div>'
    + '<div class="ex">整数と比べるときは、整数も√の形に変える。例：2 ＝ √4</div>'
    + '<div class="note">💡 √2, √3, 2 を比べたいなら 2＝√4 にして、√2&lt;√3&lt;√4（＝2）と考える！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">解き方3ステップ（n &lt; √a &lt; n+1 となる整数nを求める）</div>'
    + '<div class="ex">① aの近くにある「きれいな2乗の数」を探す（9, 16, 25...）</div>'
    + '<div class="ex">② その2乗の数でaを挟む（例：9&lt;14&lt;16）</div>'
    + '<div class="ex">③ 2乗の数を√に戻して整数にする（√9=3, √16=4 → 3&lt;√14&lt;4）</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'16の平方根を求めよ', sub:'2乗して16になる数は2つある', a:'±4', choices:['±4','±8','4','±2'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>16の平方根＝2乗して16になる数＝＋4と－4</span><span class="exp-ng">❌「4」だけでは不十分。平方根を求めるときは必ず±で2つ答える！</span><span class="exp-tip">💡 4²=16、(-4)²=16。両方とも成り立つ！</span>' },
    { q:'√25の値は？', sub:'√の記号がついていたら正の方だけ', a:'5', choices:['5','±5','25','-5'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>√25は「25の平方根のうち正の方」＝5</span><span class="exp-ng">❌「±5」は「25の平方根を求めよ」の答え。√25はあくまで正の値だけ！</span><span class="exp-tip">💡 √が付いたら「正の1つだけ」、平方根と聞かれたら「±の2つ」！</span>' },
    { q:'√7と√10の大小関係を正しく表したものは？', sub:'根号の中の数で比べる', a:'√7 < √10', choices:['√7 < √10','√7 > √10','√7 = √10','比べられない'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>7&lt;10だから√7&lt;√10</span><span class="exp-tip">💡 根号の中の数の大小が、そのまま平方根の大小になる！</span>' },
    { q:'3 < √a < 4 となる整数aは何個ある？', sub:'3²=9、4²=16で挟んで考える', a:'6個', choices:['4個','5個','6個','7個'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>3&lt;√a&lt;4 → 9&lt;a&lt;16 → aは10,11,12,13,14,15の6個</span><span class="exp-tip">💡 両辺を2乗して整数の範囲にしてから、個数を数える！</span>' },
    { q:'-√16の値は？', sub:'マイナスは根号の外についている', a:'-4', choices:['4','-4','±4','-8'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>√16＝4なので、-√16＝-4</span><span class="exp-ng">❌「±4」ではない。マイナスの符号がすでについているので、答えは-4の1つだけ！</span><span class="exp-tip">💡 まず√16を計算してから、マイナスをつける！</span>' },
    { q:'√(5²)の値は？', sub:'根号の中がすでに2乗の形', a:'5', choices:['5','49','±5','10'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>√(a²)＝a（aが正のとき）。5²=25、√25=5</span><span class="exp-tip">💡 中身が2乗の形なら、根号を外して中の数字だけにするだけ！</span>' },
    { q:'n < √50 < n+1 となる整数nは？', sub:'49と64（7²と8²）で挟む', a:'7', choices:['6','7','8','9'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>7²=49、8²=64。49&lt;50&lt;64だから7&lt;√50&lt;8 → n=7</span><span class="exp-tip">💡 50に近い2乗の数（49と64）を探すのがコツ！</span>' },
    { q:'√2, √3, 2 を小さい順に正しく並べたものは？', sub:'2を√の形に変えて比べる：2＝√4', a:'√2<√3<2', choices:['√2<√3<2','2<√2<√3','√3<√2<2','2<√3<√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>2＝√4に変換。√2, √3, √4を比べると2&lt;3&lt;4なので√2&lt;√3&lt;√4（＝2）</span><span class="exp-tip">💡 整数はいつでも√の形に変換して比べられる！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_sqrt_s1_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 平方根の基本</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 2: 根号の変形と計算 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">√ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">√12みたいなキリの悪い数、テストでそのまま書いたらダメなの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">ダメだ。必ず「これ以上簡単にできない形」にする決まりがある。やり方は素因数分解——中の数を「同じ数のペア」に分解して、ペアを√の外に出す。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">分母に√があるのもダメなんだっけ？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">それも決まりだ。「有理化」といって、分母と分子に同じ√をかけて、分母から√を追い出す。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">√ 掛け算・割り算のルール</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">公式</div>'
    + '<div class="ex">√a × √b ＝ <strong style="color:var(--gold)">√(ab)</strong></div>'
    + '<div class="ex">√a ÷ √b ＝ <strong style="color:var(--gold)">√(a÷b)</strong></div>'
    + '<div class="note">💡 根号同士の掛け算・割り算は、中身をそのまま掛け算・割り算するだけ！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">√ 素因数分解で簡単にする</div>'
    + SVG.factorTree
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">解き方3ステップ</div>'
    + '<div class="ex">① 中の数を素因数分解する（例：12＝2×2×3）</div>'
    + '<div class="ex">② 同じ数が2個（ペア）あったら、1個だけ√の外に出す</div>'
    + '<div class="ex">③ ペアになれなかった数はそのまま中に残す</div>'
    + '<div class="note">💡 √12＝√(2×2×3)＝2√3。ペアの2は外に出て「2」に、ペアになれない3は中に残る！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">√ 分母の有理化</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">やり方</div>'
    + '<div class="ex">1/√a ＝ <strong style="color:var(--purple)">√a/a</strong>（分母・分子に同じ√aをかける）</div>'
    + '<div class="note">💡 分母と分子に同じ数をかけても、値は変わらない。分母の√を消すのが目的！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'√2×√8の値は？', sub:'中身同士を掛け算：2×8=16', a:'4', choices:['2√2','4','2√10','16'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>√2×√8＝√(2×8)＝√16＝4</span><span class="exp-tip">💡 中身を先に掛けてから、√を外せるか確認する！</span>' },
    { q:'√12を簡単にすると？', sub:'12＝2×2×3と素因数分解', a:'2√3', choices:['2√3','3√2','4√3','2√6'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>12＝2×2×3 → √12＝√(2²×3)＝2√3</span><span class="exp-tip">💡 2のペアを外に出して「2」、残った3は中に！</span>' },
    { q:'√18を簡単にすると？', sub:'18＝2×3×3と素因数分解', a:'3√2', choices:['3√2','2√3','6√2','9√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>18＝2×3×3 → √18＝√(3²×2)＝3√2</span><span class="exp-tip">💡 3のペアを外に出して「3」、残った2は中に！</span>' },
    { q:'√45を簡単にすると？', sub:'45＝3×3×5と素因数分解', a:'3√5', choices:['3√5','5√3','9√5','15'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>45＝3×3×5 → √45＝√(3²×5)＝3√5</span><span class="exp-tip">💡 3のペアを外に出して「3」、残った5は中に！</span>' },
    { q:'√48÷√3の値は？', sub:'中身同士を割り算：48÷3=16', a:'4', choices:['4','8','16','√45'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>√48÷√3＝√(48÷3)＝√16＝4</span><span class="exp-tip">💡 割り算も中身を先に計算してから√を外す！</span>' },
    { q:'1/√3を有理化すると？', sub:'分母・分子に√3をかける', a:'√3/3', choices:['√3/3','1/3','3√3','√3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>1/√3 ＝ (1×√3)/(√3×√3) ＝ √3/3</span><span class="exp-tip">💡 分母の√3×√3＝3になって、根号が消える！</span>' },
    { q:'√8×√2の値は？', sub:'中身同士を掛け算：8×2=16', a:'4', choices:['4','8','16','4√2'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>√8×√2＝√(8×2)＝√16＝4</span><span class="exp-tip">💡 掛けた後に16になるので、そのまま√が外れる！</span>' },
    { q:'√72を簡単にすると？', sub:'72＝2×2×2×3×3と素因数分解', a:'6√2', choices:['6√2','4√3','2√6','8√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>72＝36×2 → √72＝√(6²×2)＝6√2</span><span class="exp-tip">💡 大きい数は「何かの2乗×残り」の形を探すと早い！36×2＝72に気づけるかがポイント</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_sqrt_s2_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 根号の変形と計算</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 3: 根号の加法・減法・展開 =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">√ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">3√2＋5√2は8√2でいいの？でも3√2＋5√3は8√5になったりする！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そこが一番の勘違いポイントだ。3√2＋5√2は「文字式のxと同じ」——同じ√2という仲間同士だから8√2にまとめられる。でも√2と√3は違う仲間だから、3√2＋5√3はこれ以上まとめられない。そのまま！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">じゃあ√8＋√2はどうなるの？形が違うけど…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">いい質問だ。√8はまだ簡単にできる（＝2√2）。先に簡単にしてから見ると、2√2＋√2で同じ仲間になる。「まとめる前に、まず簡単にできないか確認する」——これが鉄則だ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">√ 同類項としてまとめる</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">ルール</div>'
    + '<div class="ex">a√m ＋ b√m ＝ <strong style="color:var(--gold)">(a+b)√m</strong>（√の中身が同じときだけ！）</div>'
    + '<div class="ex">√の中身が違う場合（例：3√2＋5√3）は、これ以上まとめられない</div>'
    + '<div class="note">⚠️ 先に根号を簡単にしてから、中身が同じかどうか確認する！（例：√8＋√2＝2√2＋√2＝3√2）</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">√ 展開・乗法公式の利用</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">よく使う公式</div>'
    + '<div class="ex">(√a＋√b)(√a－√b) ＝ <strong style="color:var(--purple)">a－b</strong></div>'
    + '<div class="ex">(√a＋b)² ＝ a＋2b√a＋b²</div>'
    + '<div class="note">⚠️ 一番多いミス：√a×√b＝√(ab)なのに、√a＋√bのような足し算だと勘違いして計算してしまうこと（例：√3×√2を√5と間違える）。掛け算は中身も掛け算、と徹底しよう！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'3√2+5√2の値は？', sub:'同じ√2の仲間同士なので係数だけ足す', a:'8√2', choices:['8√2','8√4','15√2','8'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>3√2＋5√2＝(3+5)√2＝8√2</span><span class="exp-ng">❌「8√4」は根号の中まで足してしまった間違い。中身の2はそのまま！</span><span class="exp-tip">💡 文字式の3x+5x=8xと全く同じ考え方！</span>' },
    { q:'7√3-2√3の値は？', sub:'同じ√3の仲間同士なので係数だけ引く', a:'5√3', choices:['5√3','5','5√6','9√3'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>7√3－2√3＝(7-2)√3＝5√3</span><span class="exp-tip">💡 係数（7と2）だけ計算して、√3はそのまま残す！</span>' },
    { q:'√8+√2の値は？', sub:'先に√8を簡単にする：√8=2√2', a:'3√2', choices:['3√2','√10','2√2','4√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>√8＝2√2に簡単化 → 2√2＋√2＝3√2</span><span class="exp-ng">❌「√10」は形が違うのに中身を足してしまった間違い。まずは簡単にする！</span><span class="exp-tip">💡 見た目が違っても、簡単にすると同じ仲間になることがある！</span>' },
    { q:'√18-√2の値は？', sub:'先に√18を簡単にする：√18=3√2', a:'2√2', choices:['2√2','4','3√2','5√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>√18＝3√2に簡単化 → 3√2－√2＝2√2</span><span class="exp-tip">💡 引き算も同じ。まず簡単にしてから同類項をまとめる！</span>' },
    { q:'(√2+1)(√2-1)の値は？', sub:'(√a+b)(√a-b)=a-b²の形', a:'1', choices:['1','-1','2','3'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>(√2)²－1²＝2－1＝1</span><span class="exp-tip">💡 (a+b)(a-b)=a²-b²の公式が根号でもそのまま使える！</span>' },
    { q:'(√3+√2)²の値は？', sub:'(a+b)²=a²+2ab+b²の形', a:'5+2√6', choices:['5+2√6','5','7','5+2√5'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>(√3)²＋2×√3×√2＋(√2)²＝3＋2√6＋2＝5+2√6</span><span class="exp-ng">❌「5+2√5」は√3×√2を足し算のように√5と間違えた計算。掛け算は√(3×2)=√6！</span><span class="exp-tip">💡 真ん中の「2ab」の項を忘れずに、しかも掛け算は中身同士を掛ける！</span>' },
    { q:'(√5+2)(√5-2)の値は？', sub:'(√a+b)(√a-b)=a-b²の形', a:'1', choices:['1','3','9','2√5'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>(√5)²－2²＝5－4＝1</span><span class="exp-ng">❌「3」は2を2乗せず5-2としてしまった間違い。2²=4を忘れずに！</span><span class="exp-tip">💡 差の積の公式では、両方ちゃんと2乗するのがポイント！</span>' },
    { q:'2√3+√12の値は？', sub:'先に√12を簡単にする：√12=2√3', a:'4√3', choices:['4√3','2√15','4√6','6√3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>√12＝2√3に簡単化 → 2√3＋2√3＝4√3</span><span class="exp-tip">💡 形が違って見えても、簡単にすれば同じ仲間になることがある。これがこの単元の一番のポイント！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_sqrt_s3_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 加法・減法・展開</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">√ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">Section 1〜3の総まとめだ。基本・変形・計算・展開——全部出るよ。自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'25の平方根を求めよ', sub:'2乗して25になる数は2つ', a:'±5', choices:['±5','5','±10','25'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>25の平方根＝±5（5²=25、(-5)²=25）</span><span class="exp-tip">💡 平方根を求めるときは必ず±で2つ！</span>' },
    { q:'√49の値は？', sub:'√がついていたら正の方だけ', a:'7', choices:['7','±7','49','14'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>√49は正の値だけ＝7</span><span class="exp-tip">💡 √マークが付いたら1つだけ！</span>' },
    { q:'-√9の値は？', sub:'マイナスは根号の外', a:'-3', choices:['-3','3','±3','-9'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>√9＝3。-√9＝-3</span><span class="exp-tip">💡 先に√9を計算してからマイナスをつける！</span>' },
    { q:'√(7²)の値は？', sub:'中身がすでに2乗の形', a:'7', choices:['7','49','±7','14'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>√(a²)＝a。7²=49、√49=7</span><span class="exp-tip">💡 中身が2乗なら根号がそのまま外れる！</span>' },
    { q:'4 < √a < 5 となる整数aは何個ある？', sub:'16と25で挟む', a:'8個', choices:['6個','7個','8個','9個'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>4&lt;√a&lt;5 → 16&lt;a&lt;25 → aは17〜24の8個</span><span class="exp-tip">💡 両辺を2乗してから整数を数える！</span>' },
    { q:'√5, √6, 2.5 を小さい順に正しく並べたものは？', sub:'2.5＝√6.25に変換して比べる', a:'√5<√6<2.5', choices:['√5<√6<2.5','2.5<√5<√6','√6<√5<2.5','2.5<√6<√5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>2.5＝√6.25。5&lt;6&lt;6.25だから√5&lt;√6&lt;2.5</span><span class="exp-tip">💡 小数もいったん√の形に変換すれば比べやすい！</span>' },
    { q:'√3×√12の値は？', sub:'中身同士を掛け算：3×12=36', a:'6', choices:['6','2√3','36','3√4'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>√3×√12＝√36＝6</span><span class="exp-tip">💡 掛けた中身がきれいな2乗数になることも多い！</span>' },
    { q:'√20を簡単にすると？', sub:'20＝2×2×5', a:'2√5', choices:['2√5','4√5','2√10','5√2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>20＝2²×5 → √20＝2√5</span><span class="exp-tip">💡 2のペアを外に出す！</span>' },
    { q:'√32を簡単にすると？', sub:'32＝2×2×2×2×2', a:'4√2', choices:['4√2','2√8','8√2','4√4'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>32＝4²×2 → √32＝4√2</span><span class="exp-tip">💡 16×2＝32に気づけると早い！</span>' },
    { q:'√27÷√3の値は？', sub:'中身同士を割り算：27÷3=9', a:'3', choices:['3','9','27','√3'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>√27÷√3＝√9＝3</span><span class="exp-tip">💡 割った中身がきれいな2乗数になった！</span>' },
    { q:'1/√5を有理化すると？', sub:'分母・分子に√5をかける', a:'√5/5', choices:['√5/5','1/5','5√5','√5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>1/√5＝(√5)/(√5×√5)＝√5/5</span><span class="exp-tip">💡 分母の√5×√5=5で根号が消える！</span>' },
    { q:'√50を簡単にすると？', sub:'50＝2×5×5', a:'5√2', choices:['5√2','2√5','10√5','25√2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>50＝5²×2 → √50＝5√2</span><span class="exp-tip">💡 5のペアを外に出す！</span>' },
    { q:'√24÷√6の値は？', sub:'中身同士を割り算：24÷6=4', a:'2', choices:['2','4','6','8'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>√24÷√6＝√4＝2</span><span class="exp-tip">💡 割った中身が4というきれいな2乗数に！</span>' },
    { q:'4√5+3√5の値は？', sub:'同じ√5の仲間同士', a:'7√5', choices:['7√5','7√10','12√5','7'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>(4+3)√5＝7√5</span><span class="exp-tip">💡 係数だけ足す。中身の5はそのまま！</span>' },
    { q:'9√2-4√2の値は？', sub:'同じ√2の仲間同士', a:'5√2', choices:['5√2','5','5√4','13√2'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>(9-4)√2＝5√2</span><span class="exp-tip">💡 係数だけ引く！</span>' },
    { q:'√12+√3の値は？', sub:'先に√12を簡単にする：√12=2√3', a:'3√3', choices:['3√3','√15','2√3','4√3'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>√12＝2√3 → 2√3＋√3＝3√3</span><span class="exp-tip">💡 まず簡単にしてから同類項をまとめる！</span>' },
    { q:'√20-√5の値は？', sub:'先に√20を簡単にする：√20=2√5', a:'√5', choices:['√5','3√5','2√5','5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>√20＝2√5 → 2√5－√5＝√5</span><span class="exp-tip">💡 係数が1になるだけで、√5は消えない！</span>' },
    { q:'(√6+1)(√6-1)の値は？', sub:'(√a+b)(√a-b)=a-b²の形', a:'5', choices:['5','7','2√6','35'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>(√6)²－1²＝6－1＝5</span><span class="exp-tip">💡 差の積の公式がそのまま使える！</span>' },
    { q:'(√2+√3)²の値は？', sub:'(a+b)²=a²+2ab+b²の形', a:'5+2√6', choices:['5+2√6','5','7','5+2√5'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>2＋2√6＋3＝5+2√6</span><span class="exp-ng">❌「5+2√5」は√2×√3を足し算のように間違えた計算。掛け算は√6！</span><span class="exp-tip">💡 真ん中の項（2ab）を忘れずに！</span>' },
    { q:'3√5+√20の値は？', sub:'先に√20を簡単にする：√20=2√5', a:'5√5', choices:['5√5','3√25','6√5','5√25'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>√20＝2√5 → 3√5＋2√5＝5√5</span><span class="exp-tip">💡 簡単にしてから足すのを忘れずに！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_sqrt_s4_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">📝 確認テスト — 全セクション総まとめ（20問）</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:3, jp:q.q, choices:q.choices};
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 3)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

function showFinalResult() {
  var s4qids = [];
  for (var i = 0; i < 20; i++) { s4qids.push('math_sqrt_s4_q' + i); }
  var correct = 0, total = 0;
  s4qids.forEach(function(qid) {
    if (answeredSet[qid]) {
      total++;
      var d = weakDB[qid];
      if (d && d.correct > 0) correct++;
    }
  });
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '📺' : '🎤';
  var msg = pct >= 90
    ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。ルートはもう君のものだね」'
    : pct >= 70
    ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50
    ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。復習してもう一度挑戦しよう」'
    : 'きょん「むずっ…でもここから這い上がる！！」<br>西村「Section 1〜3を復習してから再挑戦しよう」';

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
    + '<button id="res_s1_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">√ Section 1へ</button>'
    + '</div>'
    + '</div></div>';
  overlay.style.display = 'block';
  var rwb = document.getElementById('res_weak_btn');
  if (rwb) rwb.addEventListener('click', function(){ closeResult(); goSection(5); });
  var rrb = document.getElementById('res_retry_btn');
  if (rrb) rrb.addEventListener('click', function(){ closeResult(); goSection(4); });
  var rsb = document.getElementById('res_s1_btn');
  if (rsb) rsb.addEventListener('click', function(){ closeResult(); goSection(1); });
}

function closeResult() { document.getElementById('resultOverlay').style.display = 'none'; }

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 5;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_sqrt_') === 0; });
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
  if (gtb) gtb.addEventListener('click', function() { goSection(6); });
}

// ===== 特訓モード =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };

function renderTokkuMode() {
  currentSection = 6;
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
