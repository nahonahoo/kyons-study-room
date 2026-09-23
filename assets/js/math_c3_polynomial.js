// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「多項式？乗法公式？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺展開得意かも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「因数分解で漫才できるかもしれない」' },
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
var answeredSet  = JSON.parse(localStorage.getItem('math_poly_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_poly_sections') || '{}');
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
  localStorage.setItem('math_poly_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('math_poly_') === 0 && getPct(id) < 80;
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
  // Section 1：多項式の乗法
  'math_poly_s1_q0':'3a(2a-1)を展開すると？',
  'math_poly_s1_q1':'-2x(x-4)を展開すると？',
  'math_poly_s1_q2':'(6a²+9a)÷3aの値は？',
  'math_poly_s1_q3':'(x+2)(x+3)を展開すると？',
  'math_poly_s1_q4':'(x-4)(x+1)を展開すると？',
  'math_poly_s1_q5':'(2x+1)(x+3)を展開すると？',
  'math_poly_s1_q6':'(a+b)(a-2b)を展開すると？',
  'math_poly_s1_q7':'(2a-3)(a-1)を展開すると？',
  // Section 2：乗法公式
  'math_poly_s2_q0':'(x+4)(x+2)を公式で展開すると？',
  'math_poly_s2_q1':'(x+5)²を展開すると？',
  'math_poly_s2_q2':'(x-3)²を展開すると？',
  'math_poly_s2_q3':'(x+7)(x-7)を展開すると？',
  'math_poly_s2_q4':'(x-6)(x+2)を展開すると？',
  'math_poly_s2_q5':'(2x-1)²を展開すると？',
  'math_poly_s2_q6':'(x+9)(x-9)を展開すると？',
  'math_poly_s2_q7':'(x-8)²を展開すると？',
  // Section 3：因数分解
  'math_poly_s3_q0':'3x+6yを因数分解すると？',
  'math_poly_s3_q1':'x²+5x+6を因数分解すると？',
  'math_poly_s3_q2':'x²-7x+12を因数分解すると？',
  'math_poly_s3_q3':'x²+8x+16を因数分解すると？',
  'math_poly_s3_q4':'x²-10x+25を因数分解すると？',
  'math_poly_s3_q5':'x²-16を因数分解すると？',
  'math_poly_s3_q6':'x²+2x-15を因数分解すると？',
  'math_poly_s3_q7':'2x²+6xを因数分解すると？',
  // Section 4（確認テスト）
  'math_poly_s4_q0':'4a(3a-2)を展開すると？',
  'math_poly_s4_q1':'-3x(2x-5)を展開すると？',
  'math_poly_s4_q2':'(8a²-4a)÷4aの値は？',
  'math_poly_s4_q3':'(x+4)(x+5)を展開すると？',
  'math_poly_s4_q4':'(x-2)(x+6)を展開すると？',
  'math_poly_s4_q5':'(3x+2)(x+1)を展開すると？',
  'math_poly_s4_q6':'(x+6)(x+3)を公式で展開すると？',
  'math_poly_s4_q7':'(x+8)²を展開すると？',
  'math_poly_s4_q8':'(x-5)²を展開すると？',
  'math_poly_s4_q9':'(x+10)(x-10)を展開すると？',
  'math_poly_s4_q10':'(x-9)(x+4)を展開すると？',
  'math_poly_s4_q11':'(3x-2)²を展開すると？',
  'math_poly_s4_q12':'(x+12)(x-12)を展開すると？',
  'math_poly_s4_q13':'5x+10yを因数分解すると？',
  'math_poly_s4_q14':'x²+7x+10を因数分解すると？',
  'math_poly_s4_q15':'x²-9x+20を因数分解すると？',
  'math_poly_s4_q16':'x²+10x+25を因数分解すると？',
  'math_poly_s4_q17':'x²-36を因数分解すると？',
  'math_poly_s4_q18':'x²-2x-24を因数分解すると？',
  'math_poly_s4_q19':'3x²+9xを因数分解すると？',
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
    if (qid.indexOf('math_poly_') !== 0) return;
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
  localStorage.setItem('math_poly_answered', JSON.stringify(answeredSet));
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
  var prefix = 'math_poly_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_poly_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'📐 スタート',   title:'多項式の世界へようこそ',   sub:'展開と因数分解——平方根・二次方程式にもつながる土台' },
  { id:1, label:'多項式の乗法',  title:'多項式の乗法',              sub:'分配法則の拡張・単項式×多項式・多項式×多項式の展開' },
  { id:2, label:'乗法公式',      title:'乗法公式',                  sub:'3つの公式を覚えれば展開が一瞬でできる' },
  { id:3, label:'因数分解',      title:'因数分解',                  sub:'展開の逆——乗法公式を逆向きに使う' },
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
    + '<div class="section-badge">数学 多項式・因数分解 · SECTION ' + id + '</div>'
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
  // 面積モデルで(x+2)(x+3)の展開を視覚化
  areaModel: '<svg viewBox="0 0 300 220" style="width:100%;max-width:320px;display:block;margin:0 auto">'
    + '<rect x="40" y="20" width="140" height="140" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
    + '<rect x="180" y="20" width="60" height="140" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<rect x="40" y="160" width="140" height="40" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
    + '<rect x="180" y="160" width="60" height="40" fill="rgba(63,185,80,0.15)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="110" y="95" fill="#a371f7" font-size="20" text-anchor="middle" font-weight="bold">x²</text>'
    + '<text x="210" y="95" fill="#0ea5e9" font-size="16" text-anchor="middle" font-weight="bold">2x</text>'
    + '<text x="110" y="184" fill="#f5c518" font-size="16" text-anchor="middle" font-weight="bold">3x</text>'
    + '<text x="210" y="184" fill="#3fb950" font-size="16" text-anchor="middle" font-weight="bold">6</text>'
    + '<text x="110" y="12" fill="#8b949e" font-size="12" text-anchor="middle">x</text>'
    + '<text x="210" y="12" fill="#8b949e" font-size="12" text-anchor="middle">2</text>'
    + '<text x="25" y="95" fill="#8b949e" font-size="12" text-anchor="middle">x</text>'
    + '<text x="25" y="184" fill="#8b949e" font-size="12" text-anchor="middle">3</text>'
    + '<text x="140" y="215" fill="#e94560" font-size="13" text-anchor="middle" font-weight="bold">(x+2)(x+3) = x²+2x+3x+6 = x²+5x+6</text>'
    + '</svg>',

  // 展開⇄因数分解の関係
  expandFactor: '<svg viewBox="0 0 340 130" style="width:100%;max-width:380px;display:block;margin:0 auto">'
    + '<rect x="10" y="35" width="130" height="60" rx="10" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<text x="75" y="70" fill="#0ea5e9" font-size="14" text-anchor="middle">(x+2)(x+3)</text>'
    + '<rect x="200" y="35" width="130" height="60" rx="10" fill="rgba(245,197,24,0.1)" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="265" y="70" fill="#f5c518" font-size="14" text-anchor="middle">x²+5x+6</text>'
    + '<path d="M 145,50 L 195,50" stroke="#3fb950" stroke-width="2" marker-end="url(#arrowR)"/>'
    + '<text x="170" y="42" fill="#3fb950" font-size="11" text-anchor="middle">展開</text>'
    + '<path d="M 195,80 L 145,80" stroke="#e94560" stroke-width="2" marker-end="url(#arrowL)"/>'
    + '<text x="170" y="100" fill="#e94560" font-size="11" text-anchor="middle">因数分解</text>'
    + '<defs>'
    + '<marker id="arrowR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3fb950"/></marker>'
    + '<marker id="arrowL" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6 Z" fill="#e94560"/></marker>'
    + '</defs>'
    + '</svg>',
};

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん、(x+2)(x+3)みたいなカッコ同士の掛け算、どうやってバラすの！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">分配法則を2回使うだけだ。でも毎回律儀に計算しなくても、よく出るパターンは「公式」として覚えておくと一瞬で解ける。今日はその公式と、逆に「バラされた式を元のカッコに戻す」因数分解もやる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">展開の逆が因数分解ってこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その通り。展開は「カッコ→バラバラ」、因数分解は「バラバラ→カッコ」。矢印の向きが逆なだけで、使う公式は同じだ。この単元は平方根や二次方程式にも直結する、数学の土台になる部分だよ。</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">📐 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：多項式の乗法（分配法則の拡張・展開の基本）<br>'
    + 'Section 2：乗法公式（3つの公式で展開を一瞬で）<br>'
    + 'Section 3：因数分解（展開の逆——公式を逆向きに使う）'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">📐 Section 1 から始める →</button>';
}

// ===== SECTION 1: 多項式の乗法 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">3a(2a-1)みたいなのは、中1でやった分配法則と同じ？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">全く同じだ。3aを(2aと-1)それぞれに配るだけ。(x+2)(x+3)のようにカッコ同士の場合は、左のカッコの中身を1つずつ、右のカッコ全体に配る——これを2回繰り返すイメージだ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 単項式×多項式・多項式÷単項式</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">分配法則の拡張</div>'
    + '<div class="ex">a(b+c) ＝ <strong style="color:var(--gold)">ab＋ac</strong>（中1の分配法則そのまま）</div>'
    + '<div class="ex">例：3a(2a-1) ＝ 6a²－3a</div>'
    + '<div class="ex">多項式÷単項式：(6a²+9a)÷3a ＝ 2a＋3（各項を割る）</div>'
    + '<div class="note">💡 割り算も「配る」考え方。各項をそれぞれ単項式で割るだけ！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 多項式×多項式の展開（面積モデルで理解する）</div>'
    + SVG.areaModel
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">解き方3ステップ</div>'
    + '<div class="ex">① 左のカッコの中の項を1つずつ取り出す</div>'
    + '<div class="ex">② それぞれを右のカッコ全体に掛ける（分配法則を2回）</div>'
    + '<div class="ex">③ 出てきた4つの項の中で、同類項があればまとめる</div>'
    + '<div class="note">💡 図のように「面積」として考えると、4つの部分（x²・2x・3x・6）に分かれているのが見える！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'3a(2a-1)を展開すると？', sub:'分配法則：3aを2aと-1それぞれに配る', a:'6a²-3a', choices:['6a²-3a','6a-3a','5a²-3a','6a²-1'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>3a×2a＝6a²、3a×(-1)＝-3a → 6a²-3a</span><span class="exp-tip">💡 中1の分配法則a(b+c)=ab+acと同じ！</span>' },
    { q:'-2x(x-4)を展開すると？', sub:'符号に注意して配る', a:'-2x²+8x', choices:['-2x²+8x','-2x²-8x','-2x+8x','2x²-8x'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>-2x×x＝-2x²、-2x×(-4)＝+8x → -2x²+8x</span><span class="exp-ng">❌ マイナス×マイナスはプラスになるのを忘れずに！</span><span class="exp-tip">💡 符号だけ先に決めてから計算すると間違えにくい！</span>' },
    { q:'(6a²+9a)÷3aの値は？', sub:'各項をそれぞれ3aで割る', a:'2a+3', choices:['2a+3','2a+9','3a+3','2a+3a'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>6a²÷3a＝2a、9a÷3a＝3 → 2a+3</span><span class="exp-tip">💡 割り算も1項ずつ配って計算する！</span>' },
    { q:'(x+2)(x+3)を展開すると？', sub:'左のx,2をそれぞれ(x+3)に配る', a:'x²+5x+6', choices:['x²+5x+6','x²+6x+5','x²+5x+5','x²+6'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>x²+3x+2x+6 → 同類項3x+2x=5xをまとめて x²+5x+6</span><span class="exp-tip">💡 4つの項が出てきたら、同類項をまとめるのを忘れずに！</span>' },
    { q:'(x-4)(x+1)を展開すると？', sub:'符号に注意して4つの項を作る', a:'x²-3x-4', choices:['x²-3x-4','x²+3x-4','x²-3x+4','x²-5x-4'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>x²+x-4x-4 → x²-3x-4</span><span class="exp-tip">💡 -4x+x=-3x。符号ミスに注意！</span>' },
    { q:'(2x+1)(x+3)を展開すると？', sub:'係数がついた項の掛け算', a:'2x²+7x+3', choices:['2x²+7x+3','2x²+6x+3','2x²+7x+4','x²+7x+3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>2x²+6x+x+3 → 同類項6x+x=7xをまとめて2x²+7x+3</span><span class="exp-tip">💡 係数がある場合も同じ手順。掛け算をていねいに！</span>' },
    { q:'(a+b)(a-2b)を展開すると？', sub:'文字が2種類でも手順は同じ', a:'a²-ab-2b²', choices:['a²-ab-2b²','a²+ab-2b²','a²-3ab-2b²','a²-ab-b²'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>a²-2ab+ab-2b² → 同類項-2ab+ab=-abをまとめてa²-ab-2b²</span><span class="exp-tip">💡 文字が増えても「4つの項を作って同類項をまとめる」手順は同じ！</span>' },
    { q:'(2a-3)(a-1)を展開すると？', sub:'マイナス同士の掛け算に注意', a:'2a²-5a+3', choices:['2a²-5a+3','2a²-a+3','2a²-5a-3','2a²-3a+3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>2a²-2a-3a+3 → 同類項-2a-3a=-5aをまとめて2a²-5a+3</span><span class="exp-tip">💡 (-3)×(-1)=+3。マイナス×マイナス＝プラス！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_poly_s1_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 多項式の乗法</div>';
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

// ===== SECTION 2: 乗法公式 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">毎回4つの項を作って同類項まとめるの、面倒じゃない？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">だからこそ「公式」がある。よく出るパターンは3つだけ。これを覚えておけば、計算せずに答えの形がすぐ分かるようになる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 3つの乗法公式（最重要暗記）</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">公式①：(x+a)(x+b)</div>'
    + '<div class="ex">(x+a)(x+b) ＝ <strong style="color:var(--gold)">x²＋(a+b)x＋ab</strong></div>'
    + '<div class="note">💡 xの係数は「aとbの和」、定数項は「aとbの積」！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">公式②：(x±a)²（平方の公式）</div>'
    + '<div class="ex">(x+a)² ＝ <strong style="color:var(--purple)">x²＋2ax＋a²</strong></div>'
    + '<div class="ex">(x-a)² ＝ <strong style="color:var(--purple)">x²－2ax＋a²</strong></div>'
    + '<div class="note">⚠️ 真ん中の「2ax」を忘れるミスが超多い！(x+a)²は絶対にx²+a²だけにはならない</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">公式③：(x+a)(x-a)（差の積）</div>'
    + '<div class="ex">(x+a)(x-a) ＝ <strong style="color:var(--teal)">x²－a²</strong></div>'
    + '<div class="note">💡 真ん中の項が消えて、2乗の引き算だけになる特別なパターン！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'(x+4)(x+2)を公式で展開すると？', sub:'x²+(a+b)x+ab の形。a=4,b=2', a:'x²+6x+8', choices:['x²+6x+8','x²+8x+6','x²+6x+6','x²+2x+8'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²+(4+2)x+4×2 ＝ x²+6x+8</span><span class="exp-tip">💡 xの係数＝4+2=6、定数項＝4×2=8！</span>' },
    { q:'(x+5)²を展開すると？', sub:'x²+2ax+a² の形。a=5', a:'x²+10x+25', choices:['x²+10x+25','x²+5x+25','x²+10x+5','x²+25'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²+2×5×x+5² ＝ x²+10x+25</span><span class="exp-ng">❌「x²+25」は真ん中の2ax(=10x)を忘れた間違い！</span><span class="exp-tip">💡 (x+a)²は必ず3項になる。真ん中を忘れない！</span>' },
    { q:'(x-3)²を展開すると？', sub:'x²-2ax+a² の形。a=3', a:'x²-6x+9', choices:['x²-6x+9','x²+6x+9','x²-3x+9','x²-6x-9'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²-2×3×x+3² ＝ x²-6x+9</span><span class="exp-tip">💡 a²は必ずプラス（マイナスを2乗すると+になる）！</span>' },
    { q:'(x+7)(x-7)を展開すると？', sub:'x²-a² の形。a=7', a:'x²-49', choices:['x²-49','x²+49','x²-14x-49','x²-14'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²-7² ＝ x²-49</span><span class="exp-tip">💡 真ん中の項が消える特別公式。xの項は出てこない！</span>' },
    { q:'(x-6)(x+2)を展開すると？', sub:'x²+(a+b)x+ab の形。a=-6,b=2', a:'x²-4x-12', choices:['x²-4x-12','x²+4x-12','x²-4x+12','x²-8x-12'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²+(-6+2)x+(-6)×2 ＝ x²-4x-12</span><span class="exp-tip">💡 aやbが負の数でも公式はそのまま使える！</span>' },
    { q:'(2x-1)²を展開すると？', sub:'2xをひとかたまりとして公式を使う', a:'4x²-4x+1', choices:['4x²-4x+1','2x²-4x+1','4x²-2x+1','4x²-4x-1'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>(2x)²-2×2x×1+1² ＝ 4x²-4x+1</span><span class="exp-tip">💡 「2x」を1つの文字のように扱うのがコツ！</span>' },
    { q:'(x+9)(x-9)を展開すると？', sub:'x²-a² の形。a=9', a:'x²-81', choices:['x²-81','x²+81','x²-18x-81','x²-18'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²-9² ＝ x²-81</span><span class="exp-tip">💡 差の積の公式。xの項は消える！</span>' },
    { q:'(x-8)²を展開すると？', sub:'x²-2ax+a² の形。a=8', a:'x²-16x+64', choices:['x²-16x+64','x²+16x+64','x²-8x+64','x²-16x-64'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²-2×8×x+8² ＝ x²-16x+64</span><span class="exp-tip">💡 2ax=16x、a²=64。両方プラスマイナスに注意！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_poly_s2_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 乗法公式</div>';
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

// ===== SECTION 3: 因数分解 =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">因数分解って、Section2の公式を逆から読むだけでいいの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その通り。x²+5x+6を見たら「足して5、掛けて6になる2つの数」を探す——それが2と3。だから(x+2)(x+3)になる。公式を覚えていれば、パズルのように答えが見えてくる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 展開と因数分解は逆の関係</div>'
    + SVG.expandFactor
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 因数分解の4パターン</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">① 共通因数でくくる（一番最初に確認！）</div>'
    + '<div class="ex">ma＋mb ＝ <strong style="color:var(--gold)">m(a+b)</strong></div>'
    + '<div class="note">⚠️ どのパターンでも、まず共通因数がないか確認するのが鉄則！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">② x²+(a+b)x+ab の形</div>'
    + '<div class="ex">x²+(a+b)x+ab ＝ <strong style="color:var(--purple)">(x+a)(x+b)</strong></div>'
    + '<div class="note">💡 「足してxの係数、掛けて定数項」になる2つの数を探す！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">③ x²±2ax+a² の形（平方の形）</div>'
    + '<div class="ex">x²+2ax+a² ＝ <strong style="color:var(--purple)">(x+a)²</strong>　　x²-2ax+a² ＝ (x-a)²</div>'
    + '<div class="note">💡 定数項が「何かの2乗」になっていないか確認！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">④ x²-a² の形（差の平方）</div>'
    + '<div class="ex">x²-a² ＝ <strong style="color:var(--teal)">(x+a)(x-a)</strong></div>'
    + '<div class="note">💡 「◯²-□²」の形を見たら、この公式を疑う！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'3x+6yを因数分解すると？', sub:'共通因数3でくくる', a:'3(x+2y)', choices:['3(x+2y)','3(x+6y)','x(3+6y)','3x(1+2y)'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>3xと6yの共通因数は3。3x÷3=x、6y÷3=2y → 3(x+2y)</span><span class="exp-tip">💡 因数分解は必ず「共通因数がないか」から確認！</span>' },
    { q:'x²+5x+6を因数分解すると？', sub:'足して5、掛けて6になる2数を探す', a:'(x+2)(x+3)', choices:['(x+2)(x+3)','(x+1)(x+6)','(x+2)(x+4)','(x-2)(x-3)'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>足して5・掛けて6 → 2と3。 (x+2)(x+3)</span><span class="exp-tip">💡 (x+1)(x+6)は足すと7になるので違う！2数の組み合わせを丁寧に探す</span>' },
    { q:'x²-7x+12を因数分解すると？', sub:'足して-7、掛けて12になる2数を探す', a:'(x-3)(x-4)', choices:['(x-3)(x-4)','(x+3)(x+4)','(x-2)(x-6)','(x-3)(x+4)'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>足して-7・掛けて12 → -3と-4。 (x-3)(x-4)</span><span class="exp-tip">💡 掛けてプラス・足してマイナス → 両方マイナスの数！</span>' },
    { q:'x²+8x+16を因数分解すると？', sub:'定数項16が4²になっている', a:'(x+4)²', choices:['(x+4)²','(x+8)²','(x+2)(x+8)','(x+4)(x+16)'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>16=4²、8=2×4だから公式③にぴったり当てはまる → (x+4)²</span><span class="exp-tip">💡 定数項が2乗の形になっていたら、まず公式③を疑う！</span>' },
    { q:'x²-10x+25を因数分解すると？', sub:'定数項25が5²になっている', a:'(x-5)²', choices:['(x-5)²','(x+5)²','(x-25)','(x-5)(x+5)'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>25=5²、10=2×5だから公式③ → (x-5)²</span><span class="exp-tip">💡 xの係数がマイナスなので(x-5)²。符号に注意！</span>' },
    { q:'x²-16を因数分解すると？', sub:'x²-a²の形。16=4²', a:'(x+4)(x-4)', choices:['(x+4)(x-4)','(x-4)²','(x+8)(x-2)','(x-16)(x+1)'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>16=4²なので公式④ → (x+4)(x-4)</span><span class="exp-tip">💡 xの項がない「◯²-□²」の形を見たら差の平方公式！</span>' },
    { q:'x²+2x-15を因数分解すると？', sub:'足して2、掛けて-15になる2数を探す', a:'(x+5)(x-3)', choices:['(x+5)(x-3)','(x-5)(x+3)','(x+5)(x+3)','(x-5)(x-3)'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>足して2・掛けて-15 → 5と-3。 (x+5)(x-3)</span><span class="exp-tip">💡 掛けてマイナス → 符号が違う2数！大きい方の符号がそのまま和の符号になる</span>' },
    { q:'2x²+6xを因数分解すると？', sub:'共通因数を最後までくくり切る', a:'2x(x+3)', choices:['2x(x+3)','2(x²+3x)','x(2x+6)','2x(x+6)'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>2x²と6xの共通因数は2x。2x²÷2x=x、6x÷2x=3 → 2x(x+3)</span><span class="exp-ng">❌「2(x²+3x)」はまだx²が残っていて、共通因数のxをくくり切れていない！</span><span class="exp-tip">💡 共通因数は「数字」と「文字」両方チェック。くくれるだけくくる！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_poly_s3_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 因数分解</div>';
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
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">Section 1〜3の総まとめだ。多項式の乗法・乗法公式・因数分解——全部出るよ。自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'4a(3a-2)を展開すると？', sub:'分配法則で配る', a:'12a²-8a', choices:['12a²-8a','12a-8a','7a²-8a','12a²-2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>4a×3a=12a²、4a×(-2)=-8a → 12a²-8a</span><span class="exp-tip">💡 分配法則をていねいに！</span>' },
    { q:'-3x(2x-5)を展開すると？', sub:'符号に注意', a:'-6x²+15x', choices:['-6x²+15x','-6x²-15x','-6x+15x','6x²-15x'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>-3x×2x=-6x²、-3x×(-5)=+15x → -6x²+15x</span><span class="exp-tip">💡 マイナス×マイナス＝プラス！</span>' },
    { q:'(8a²-4a)÷4aの値は？', sub:'各項を4aで割る', a:'2a-1', choices:['2a-1','2a-4','8a-1','2a-4a'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>8a²÷4a=2a、4a÷4a=1 → 2a-1</span><span class="exp-tip">💡 1項ずつ割るのを忘れずに！</span>' },
    { q:'(x+4)(x+5)を展開すると？', sub:'x²+(a+b)x+ab の形', a:'x²+9x+20', choices:['x²+9x+20','x²+20x+9','x²+9x+9','x²+20'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²+(4+5)x+4×5 ＝ x²+9x+20</span><span class="exp-tip">💡 和と積を求めるだけ！</span>' },
    { q:'(x-2)(x+6)を展開すると？', sub:'x²+(a+b)x+ab の形', a:'x²+4x-12', choices:['x²+4x-12','x²-4x-12','x²+4x+12','x²+8x-12'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²+(-2+6)x+(-2)×6 ＝ x²+4x-12</span><span class="exp-tip">💡 符号ありでも公式は同じ！</span>' },
    { q:'(3x+2)(x+1)を展開すると？', sub:'係数付きの展開', a:'3x²+5x+2', choices:['3x²+5x+2','3x²+2x+2','3x²+5x+1','x²+5x+2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>3x²+3x+2x+2 → 同類項3x+2x=5xでまとめる</span><span class="exp-tip">💡 4項作ってから同類項をまとめる基本手順！</span>' },
    { q:'(x+6)(x+3)を公式で展開すると？', sub:'x²+(a+b)x+ab の形', a:'x²+9x+18', choices:['x²+9x+18','x²+18x+9','x²+9x+9','x²+3x+18'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²+(6+3)x+6×3 ＝ x²+9x+18</span><span class="exp-tip">💡 和9、積18！</span>' },
    { q:'(x+8)²を展開すると？', sub:'x²+2ax+a² の形', a:'x²+16x+64', choices:['x²+16x+64','x²+8x+64','x²+16x+8','x²+64'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²+2×8×x+8² ＝ x²+16x+64</span><span class="exp-tip">💡 真ん中の項を忘れずに！</span>' },
    { q:'(x-5)²を展開すると？', sub:'x²-2ax+a² の形', a:'x²-10x+25', choices:['x²-10x+25','x²+10x+25','x²-5x+25','x²-10x-25'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²-2×5×x+5² ＝ x²-10x+25</span><span class="exp-tip">💡 a²は必ずプラス！</span>' },
    { q:'(x+10)(x-10)を展開すると？', sub:'x²-a² の形', a:'x²-100', choices:['x²-100','x²+100','x²-20x-100','x²-20'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²-10² ＝ x²-100</span><span class="exp-tip">💡 xの項は消える！</span>' },
    { q:'(x-9)(x+4)を展開すると？', sub:'x²+(a+b)x+ab の形', a:'x²-5x-36', choices:['x²-5x-36','x²+5x-36','x²-5x+36','x²-13x-36'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²+(-9+4)x+(-9)×4 ＝ x²-5x-36</span><span class="exp-tip">💡 和-5、積-36！</span>' },
    { q:'(3x-2)²を展開すると？', sub:'3xをひとかたまりとして公式を使う', a:'9x²-12x+4', choices:['9x²-12x+4','9x²-6x+4','9x²-12x-4','6x²-12x+4'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>(3x)²-2×3x×2+2² ＝ 9x²-12x+4</span><span class="exp-tip">💡 「3x」を1つの文字のように扱う！</span>' },
    { q:'(x+12)(x-12)を展開すると？', sub:'x²-a² の形', a:'x²-144', choices:['x²-144','x²+144','x²-24x-144','x²-24'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>x²-12² ＝ x²-144</span><span class="exp-tip">💡 差の積の公式！</span>' },
    { q:'5x+10yを因数分解すると？', sub:'共通因数5でくくる', a:'5(x+2y)', choices:['5(x+2y)','5(x+10y)','x(5+10y)','5x(1+2y)'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>共通因数5でくくる → 5(x+2y)</span><span class="exp-tip">💡 まず共通因数をチェック！</span>' },
    { q:'x²+7x+10を因数分解すると？', sub:'足して7、掛けて10になる2数', a:'(x+2)(x+5)', choices:['(x+2)(x+5)','(x+1)(x+10)','(x+2)(x+7)','(x-2)(x-5)'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>足して7・掛けて10 → 2と5</span><span class="exp-tip">💡 2数の組み合わせを丁寧に探す！</span>' },
    { q:'x²-9x+20を因数分解すると？', sub:'足して-9、掛けて20になる2数', a:'(x-4)(x-5)', choices:['(x-4)(x-5)','(x+4)(x+5)','(x-2)(x-10)','(x-4)(x+5)'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>足して-9・掛けて20 → -4と-5</span><span class="exp-tip">💡 掛けてプラス・足してマイナス → 両方マイナス！</span>' },
    { q:'x²+10x+25を因数分解すると？', sub:'定数項25が5²', a:'(x+5)²', choices:['(x+5)²','(x+10)²','(x+2)(x+13)','(x+5)(x+10)'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>25=5²、10=2×5 → 公式③ (x+5)²</span><span class="exp-tip">💡 定数項が2乗の形になっていないか確認！</span>' },
    { q:'x²-36を因数分解すると？', sub:'x²-a²の形。36=6²', a:'(x+6)(x-6)', choices:['(x+6)(x-6)','(x-6)²','(x+9)(x-4)','(x-36)(x+1)'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>36=6²なので差の平方公式 → (x+6)(x-6)</span><span class="exp-tip">💡 xの項がない形は差の平方を疑う！</span>' },
    { q:'x²-2x-24を因数分解すると？', sub:'足して-2、掛けて-24になる2数', a:'(x+4)(x-6)', choices:['(x+4)(x-6)','(x-4)(x+6)','(x+2)(x-12)','(x-2)(x+12)'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>足して-2・掛けて-24 → 4と-6</span><span class="exp-tip">💡 掛けてマイナスは符号が違う2数を探す！</span>' },
    { q:'3x²+9xを因数分解すると？', sub:'共通因数をくくり切る', a:'3x(x+3)', choices:['3x(x+3)','3(x²+3x)','x(3x+9)','3x(x+9)'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>共通因数3xでくくる → 3x(x+3)</span><span class="exp-tip">💡 数字と文字、両方の共通因数を見つける！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_poly_s4_q' + i; });
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
  for (var i = 0; i < 20; i++) { s4qids.push('math_poly_s4_q' + i); }
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
    ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。展開も因数分解も、君のものだね」'
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
    + '<button id="res_s1_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">📐 Section 1へ</button>'
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
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_poly_') === 0; });
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
