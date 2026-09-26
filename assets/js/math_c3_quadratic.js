// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「二次方程式？解の公式？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺解の公式得意かも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「二次方程式で漫才できるかもしれない」' },
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
var answeredSet  = JSON.parse(localStorage.getItem('math_quad_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_quad_sections') || '{}');
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
  localStorage.setItem('math_quad_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('math_quad_') === 0 && getPct(id) < 80;
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
  // Section 1：標準形とa,b,cの見つけ方
  'math_quad_s1_q0':'x²+5x+6=0 の a,b,cは？',
  'math_quad_s1_q1':'x²-3x-10=0 の a,b,cは？',
  'math_quad_s1_q2':'2x²+5x+2=0 の a,b,cは？',
  'math_quad_s1_q3':'x²-5=0 の a,b,cは？',
  'math_quad_s1_q4':'2x²+3x=0 の a,b,cは？',
  'math_quad_s1_q5':'3x²-2x-1=0 の a,b,cは？',
  'math_quad_s1_q6':'x²+3x=5 を ax²+bx+c=0 の形に整えると？',
  'math_quad_s1_q7':'-x²+4x-3=0 を a>0になるように整えると？',
  // Section 2：解の公式の基本
  'math_quad_s2_q0':'x²+5x+6=0を解の公式で解くと？',
  'math_quad_s2_q1':'x²-3x-10=0を解の公式で解くと？',
  'math_quad_s2_q2':'x²-6x+9=0を解の公式で解くと？',
  'math_quad_s2_q3':'2x²+5x+2=0を解の公式で解くと？',
  'math_quad_s2_q4':'2x²-7x+3=0を解の公式で解くと？',
  'math_quad_s2_q5':'3x²-2x-1=0を解の公式で解くと？',
  'math_quad_s2_q6':'x²-5=0を解の公式で解くと？',
  'math_quad_s2_q7':'2x²+3x=0を解の公式で解くと？',
  // Section 3：いろいろなパターン（√が残る・重解・約分）
  'math_quad_s3_q0':'x²+2x-1=0を解の公式で解くと？',
  'math_quad_s3_q1':'x²-4x+2=0を解の公式で解くと？',
  'math_quad_s3_q2':'x²-2x-2=0を解の公式で解くと？',
  'math_quad_s3_q3':'x²+4x+1=0を解の公式で解くと？',
  'math_quad_s3_q4':'x²-2x-4=0を解の公式で解くと？',
  'math_quad_s3_q5':'x²+6x+4=0を解の公式で解くと？',
  'math_quad_s3_q6':'2x²+4x-1=0を解の公式で解くと？',
  'math_quad_s3_q7':'x²-4x-1=0を解の公式で解くと？',
  // Section 4（確認テスト）
  'math_quad_s4_q0':'x²-4x+3=0 の a,b,cは？',
  'math_quad_s4_q1':'x²+7=0 の a,b,cは？',
  'math_quad_s4_q2':'3x²-x=0 の a,b,cは？',
  'math_quad_s4_q3':'x²-2x=8 を ax²+bx+c=0 の形に整えると？',
  'math_quad_s4_q4':'-x²+3x+2=0 を a>0になるように整えると？',
  'math_quad_s4_q5':'x²+7x+10=0を解の公式で解くと？',
  'math_quad_s4_q6':'x²-5x+4=0を解の公式で解くと？',
  'math_quad_s4_q7':'x²-4x+4=0を解の公式で解くと？',
  'math_quad_s4_q8':'2x²+7x+3=0を解の公式で解くと？',
  'math_quad_s4_q9':'3x²+5x+2=0を解の公式で解くと？',
  'math_quad_s4_q10':'x²-9=0を解の公式で解くと？',
  'math_quad_s4_q11':'2x²-5x=0を解の公式で解くと？',
  'math_quad_s4_q12':'x²+2x-2=0を解の公式で解くと？',
  'math_quad_s4_q13':'x²-6x+7=0を解の公式で解くと？',
  'math_quad_s4_q14':'x²+4x-1=0を解の公式で解くと？',
  'math_quad_s4_q15':'x²-2x-1=0を解の公式で解くと？',
  'math_quad_s4_q16':'x²+2x-4=0を解の公式で解くと？',
  'math_quad_s4_q17':'x²-8x+13=0を解の公式で解くと？',
  'math_quad_s4_q18':'2x²+2x-1=0を解の公式で解くと？',
  'math_quad_s4_q19':'x²+6x+2=0を解の公式で解くと？',
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
    if (qid.indexOf('math_quad_') !== 0) return;
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
  localStorage.setItem('math_quad_answered', JSON.stringify(answeredSet));
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
  var prefix = 'math_quad_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_quad_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'📐 スタート',   title:'二次方程式の世界へようこそ', sub:'平方根と多項式の知識を使って、解の公式をマスターする' },
  { id:1, label:'標準形とa,b,c', title:'標準形とa,b,cの見つけ方',    sub:'ax²+bx+c=0 に整えて、正確に係数を読み取る' },
  { id:2, label:'解の公式',      title:'解の公式の使い方',           sub:'4ステップで、どんな二次方程式も解ける' },
  { id:3, label:'いろいろな型',  title:'いろいろなパターン',         sub:'√が残る場合・重解・約分の注意点' },
  { id:4, label:'確認テスト',    title:'確認テスト',                 sub:'全セクション総まとめ！何問正解できる？' },
  { id:5, label:'📊弱点',        title:'弱点ノート',                 sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',        title:'弱点特訓モード',             sub:'弱点問題だけを集中練習！' },
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
    + '<div class="section-badge">数学 二次方程式 · SECTION ' + id + '</div>'
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
  // 解の公式を解く4ステップのフロー図
  formulaFlow: '<svg viewBox="0 0 340 260" style="width:100%;max-width:360px;display:block;margin:0 auto">'
    + '<rect x="20" y="10" width="300" height="42" rx="8" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
    + '<text x="170" y="36" fill="#a371f7" font-size="13" text-anchor="middle">① a, b, c を確認する</text>'
    + '<path d="M 170,52 L 170,68" stroke="#8b949e" stroke-width="2" marker-end="url(#qArrow)"/>'
    + '<rect x="20" y="70" width="300" height="42" rx="8" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<text x="170" y="96" fill="#0ea5e9" font-size="13" text-anchor="middle">② 判別式 b²-4ac を計算</text>'
    + '<path d="M 170,112 L 170,128" stroke="#8b949e" stroke-width="2" marker-end="url(#qArrow)"/>'
    + '<rect x="20" y="130" width="300" height="42" rx="8" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="170" y="156" fill="#f5c518" font-size="13" text-anchor="middle">③ √の中を簡単にする</text>'
    + '<path d="M 170,172 L 170,188" stroke="#8b949e" stroke-width="2" marker-end="url(#qArrow)"/>'
    + '<rect x="20" y="190" width="300" height="42" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="170" y="216" fill="#3fb950" font-size="13" text-anchor="middle">④ 分数全体を約分する</text>'
    + '<defs><marker id="qArrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#8b949e"/></marker></defs>'
    + '</svg>',

  // 約分は分数全体（両方の項）にかける、という注意図
  reduceCare: '<svg viewBox="0 0 320 140" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="80" y="45" fill="#e94560" font-size="22" text-anchor="middle">-6</text>'
    + '<text x="115" y="45" fill="#8b949e" font-size="22" text-anchor="middle">±</text>'
    + '<text x="150" y="45" fill="#e94560" font-size="22" text-anchor="middle">2√5</text>'
    + '<line x1="60" y1="58" x2="175" y2="58" stroke="#e6edf3" stroke-width="2"/>'
    + '<text x="115" y="80" fill="#e6edf3" font-size="22" text-anchor="middle">2</text>'
    + '<path d="M 80,95 L 80,110" stroke="#3fb950" stroke-width="2" marker-end="url(#qArrow2)"/>'
    + '<path d="M 150,95 L 150,110" stroke="#3fb950" stroke-width="2" marker-end="url(#qArrow2)"/>'
    + '<text x="115" y="105" fill="#3fb950" font-size="11" text-anchor="middle">両方とも2で割る！</text>'
    + '<text x="80" y="130" fill="#3fb950" font-size="20" text-anchor="middle">-3</text>'
    + '<text x="115" y="130" fill="#8b949e" font-size="20" text-anchor="middle">±</text>'
    + '<text x="150" y="130" fill="#3fb950" font-size="20" text-anchor="middle">√5</text>'
    + '<defs><marker id="qArrow2" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#3fb950"/></marker></defs>'
    + '</svg>',
};

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん、二次方程式ってなんか名前からして怖いんだけど！一次方程式と何が違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">xの2乗（x²）が入っているのが二次方程式だ。一次方程式みたいに移項だけでは解けない。でも安心していい。「解の公式」という魔法の公式に数字を当てはめるだけで、どんな二次方程式も解けるようになる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">魔法の公式！？覚えられるかな…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">大丈夫。すでに平方根で根号の計算、多項式で係数の扱いを勉強してきた。この単元はその2つの総仕上げだ。今日で「解の公式」を完全に自分のものにしよう。</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">📐 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：標準形とa,b,cの見つけ方<br>'
    + 'Section 2：解の公式の使い方（基本パターン）<br>'
    + 'Section 3：いろいろなパターン（√が残る・重解・約分の注意）'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">📐 Section 1 から始める →</button>';
}

// ===== SECTION 1: 標準形とa,b,cの見つけ方 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">解の公式を使う前に、何を準備すればいいの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">まず式を「ax²+bx+c=0」という形に整えて、a,b,cを正確に読み取ること。ここでのミスが一番多い。符号を含めて見る、項がなければ0として扱う——このルールを徹底しよう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 二次方程式の標準形</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">標準形</div>'
    + '<div class="ex">ax²＋bx＋c＝0　（a≠0）</div>'
    + '<div class="note">💡 xの2乗の項がある方程式は、必ずこの形に整えてから考える！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">a,b,cの見つけ方（注意点）</div>'
    + '<div class="ex">① 符号も含めて読む（x²-5x+6=0 → a=1, b=-5, c=6）</div>'
    + '<div class="ex">② 項がなければ0として扱う（x²-5=0 → b=0／2x²+3x=0 → c=0）</div>'
    + '<div class="ex">③ 右辺に数字や文字があれば移項して＝0の形に整える</div>'
    + '<div class="note">⚠️ b=0やc=0を見落として公式に代入し忘れるミスが多い。項がなくても「0」として必ず使う！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'x²+5x+6=0 の a,b,cは？', sub:'そのまま係数を読み取る', a:'a=1, b=5, c=6', choices:['a=1, b=5, c=6','a=1, b=6, c=5','a=1, b=5, c=-6','a=5, b=1, c=6'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>x²の係数がa、xの係数がb、定数項がc</span><span class="exp-tip">💡 x²+5x+6=0 → a=1（省略されているが1）, b=5, c=6</span>' },
    { q:'x²-3x-10=0 の a,b,cは？', sub:'符号を含めて読む', a:'a=1, b=-3, c=-10', choices:['a=1, b=-3, c=-10','a=1, b=3, c=-10','a=1, b=-3, c=10','a=1, b=-10, c=-3'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>マイナスの符号も必ずbやcに含める</span><span class="exp-ng">❌ b=3やc=10は符号を忘れた間違い！</span><span class="exp-tip">💡 「-3x」のマイナスごとbの値！</span>' },
    { q:'2x²+5x+2=0 の a,b,cは？', sub:'x²の係数が1でない場合', a:'a=2, b=5, c=2', choices:['a=2, b=5, c=2','a=1, b=5, c=2','a=2, b=2, c=5','a=2, b=5, c=0'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>x²の前についている数字がそのままa</span><span class="exp-tip">💡 aは1とは限らない。x²の係数をそのまま読む！</span>' },
    { q:'x²-5=0 の a,b,cは？', sub:'xの項がない場合はb=0', a:'a=1, b=0, c=-5', choices:['a=1, b=0, c=-5','a=1, b=-5, c=0','a=0, b=1, c=-5','a=1, b=1, c=-5'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>xの項が書かれていない→b=0として扱う</span><span class="exp-ng">❌「b=-5」はcの値とbを混同した間違い！</span><span class="exp-tip">💡 見た目に無くても、b=0を必ず用意する！</span>' },
    { q:'2x²+3x=0 の a,b,cは？', sub:'定数項がない場合はc=0', a:'a=2, b=3, c=0', choices:['a=2, b=3, c=0','a=2, b=0, c=3','a=2, b=3, c=3','a=0, b=2, c=3'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>定数項が書かれていない→c=0として扱う</span><span class="exp-tip">💡「+3x」で終わっていたら、その後ろにc=0が隠れている！</span>' },
    { q:'3x²-2x-1=0 の a,b,cは？', sub:'符号に注意して読む', a:'a=3, b=-2, c=-1', choices:['a=3, b=-2, c=-1','a=3, b=2, c=-1','a=3, b=-2, c=1','a=3, b=-1, c=-2'],
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>「-2x」のマイナスをbに、「-1」のマイナスをcに含める</span><span class="exp-tip">💡 符号ごと1つのセットとして読み取る！</span>' },
    { q:'x²+3x=5 を ax²+bx+c=0 の形に整えると？', sub:'右辺の5を左辺に移項する', a:'x²+3x-5=0', choices:['x²+3x-5=0','x²+3x+5=0','x²-3x-5=0','x²+8x=0'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>右辺の5を左辺に移項すると符号が変わる → x²+3x-5=0</span><span class="exp-tip">💡 移項は符号を逆にして反対側へ！これは一次方程式と同じルール</span>' },
    { q:'-x²+4x-3=0 を a>0になるように整えると？', sub:'両辺に-1を掛ける', a:'x²-4x+3=0', choices:['x²-4x+3=0','x²+4x-3=0','x²-4x-3=0','x²+4x+3=0'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>両辺に-1を掛けると全部の符号が反転 → x²-4x+3=0</span><span class="exp-tip">💡 aがマイナスのときは、全項の符号をひっくり返してa>0にするのが慣習！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_quad_s1_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 標準形とa,b,cの見つけ方</div>';
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

// ===== SECTION 2: 解の公式の使い方 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">いよいよ解の公式！でも式が長くて覚えられる気がしない…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">丸ごと覚えるしかない公式だが、使い方は4ステップに分ければ簡単だ。a,b,cを確認して、判別式を計算して、√を簡単にして、最後に約分する。この順番さえ守れば迷わない。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 解の公式（最重要暗記）</div>'
    + '<div class="rule-box" style="text-align:center">'
    + '<div style="font-size:22px;color:var(--gold);font-weight:bold;margin:8px 0">x ＝ (－b ± √(b²－4ac)) ／ 2a</div>'
    + '<div class="note" style="text-align:left">💡 ax²+bx+c=0 のとき、この公式にa,b,cを当てはめるだけでxが求まる！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 解き方4ステップ</div>'
    + SVG.formulaFlow
    + '</div>';

  var qs = [
    { q:'x²+5x+6=0を解の公式で解くと？', sub:'a=1,b=5,c=6。判別式=25-24=1', a:'x=-2, -3', choices:['x=-2, -3','x=2, 3','x=-2, 3','x=-1, -6'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25-24=1。x=(-5±1)/2 → x=-2, -3</span><span class="exp-tip">💡 判別式が1になる＝ちょうどいい数になる典型パターン！</span>' },
    { q:'x²-3x-10=0を解の公式で解くと？', sub:'a=1,b=-3,c=-10。判別式=9+40=49', a:'x=5, -2', choices:['x=5, -2','x=-5, 2','x=5, 2','x=-5, -2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=9+40=49。x=(3±7)/2 → x=5, -2</span><span class="exp-tip">💡 -b=-(-3)=3になることに注意！</span>' },
    { q:'x²-6x+9=0を解の公式で解くと？', sub:'判別式=36-36=0（重解）', a:'x=3（重解）', choices:['x=3（重解）','x=-3（重解）','x=9（重解）','x=3, -3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=36-36=0。x=6/2=3（±0なので解は1つだけ）</span><span class="exp-tip">💡 判別式が0のときは「重解」と呼ばれ、答えは1つだけ！</span>' },
    { q:'2x²+5x+2=0を解の公式で解くと？', sub:'a=2,b=5,c=2。判別式=25-16=9', a:'x=-1/2, -2', choices:['x=-1/2, -2','x=1/2, 2','x=-1/2, 2','x=1/2, -2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25-16=9。x=(-5±3)/4 → x=-1/2, -2</span><span class="exp-tip">💡 aが1でないときは分母(2a)も変わる。ここでは2a=4！</span>' },
    { q:'2x²-7x+3=0を解の公式で解くと？', sub:'a=2,b=-7,c=3。判別式=49-24=25', a:'x=3, 1/2', choices:['x=3, 1/2','x=-3, -1/2','x=3, -1/2','x=6, 1'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=49-24=25。x=(7±5)/4 → x=3, 1/2</span><span class="exp-tip">💡 分数の解になることも普通にある！</span>' },
    { q:'3x²-2x-1=0を解の公式で解くと？', sub:'a=3,b=-2,c=-1。判別式=4+12=16', a:'x=1, -1/3', choices:['x=1, -1/3','x=-1, 1/3','x=1, 1/3','x=3, -1'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=4+12=16。x=(2±4)/6 → x=1, -1/3</span><span class="exp-tip">💡 分母6を忘れずに、約分できるところは約分する！</span>' },
    { q:'x²-5=0を解の公式で解くと？', sub:'a=1,b=0,c=-5。b=0を忘れずに代入', a:'x=±√5', choices:['x=±√5','x=±5','x=±√10','x=5'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=0+20=20。x=(0±√20)/2=(0±2√5)/2=±√5</span><span class="exp-tip">💡 b=0でも公式はそのまま使える。√20=2√5への簡略化も忘れずに（平方根の単元の復習）！</span>' },
    { q:'2x²+3x=0を解の公式で解くと？', sub:'a=2,b=3,c=0。c=0を忘れずに代入', a:'x=0, -3/2', choices:['x=0, -3/2','x=0, 3/2','x=3/2','x=-3/2, -3/2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=9-0=9。x=(-3±3)/4 → x=0, -3/2</span><span class="exp-tip">💡 c=0のときは、解の1つが必ずx=0になる！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_quad_s2_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 解の公式の基本</div>';
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

// ===== SECTION 3: いろいろなパターン =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">判別式がきれいな数にならないとき、√がそのまま残っちゃうんだけど…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">それが普通だ。むしろテストではそのパターンの方がよく出る。√の中を平方根の単元でやった素因数分解で簡単にして、最後に分数全体を約分する——ここが一番のヤマ場だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">約分するとき、注意することある？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">大ありだ。分子の「-6±2√5」を2で割るときは、-6と2√5の両方を2で割らないといけない。片方だけ割って満足するのが一番多いミスだ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 約分は分子の全部の項に！</div>'
    + SVG.reduceCare
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">注意点まとめ</div>'
    + '<div class="ex">① 判別式が0より大きい平方数でない → √が残る（普通のこと！）</div>'
    + '<div class="ex">② √の中は平方根の単元のやり方で簡単にする（√20=2√5など）</div>'
    + '<div class="ex">③ 分子の「-b」と「√の項」の両方を、分母(2a)の共通因数で割る</div>'
    + '<div class="note">⚠️ (-6±2√5)/2 は -3±√5 になる。「-6÷2」と「2√5÷2」の両方を実行して初めて正しい約分！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'x²+2x-1=0を解の公式で解くと？', sub:'判別式=4+4=8=4×2 → √8=2√2', a:'x=-1±√2', choices:['x=-1±√2','x=1±√2','x=-1±2√2','x=-2±√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=4+4=8。x=(-2±2√2)/2 → 両方を2で割って x=-1±√2</span><span class="exp-tip">💡 √8=2√2に簡単化してから、分子全体を2で割る！</span>' },
    { q:'x²-4x+2=0を解の公式で解くと？', sub:'判別式=16-8=8=4×2 → √8=2√2', a:'x=2±√2', choices:['x=2±√2','x=-2±√2','x=2±2√2','x=4±√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=16-8=8。x=(4±2√2)/2 → x=2±√2</span><span class="exp-tip">💡 4÷2=2、2√2÷2=√2。両方割るのを忘れずに！</span>' },
    { q:'x²-2x-2=0を解の公式で解くと？', sub:'判別式=4+8=12=4×3 → √12=2√3', a:'x=1±√3', choices:['x=1±√3','x=-1±√3','x=1±3√3','x=2±√3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=4+8=12。x=(2±2√3)/2 → x=1±√3</span><span class="exp-tip">💡 √12=2√3への簡略化がポイント！</span>' },
    { q:'x²+4x+1=0を解の公式で解くと？', sub:'判別式=16-4=12=4×3 → √12=2√3', a:'x=-2±√3', choices:['x=-2±√3','x=2±√3','x=-2±2√3','x=-4±√3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=16-4=12。x=(-4±2√3)/2 → x=-2±√3</span><span class="exp-tip">💡 -4÷2=-2、2√3÷2=√3！</span>' },
    { q:'x²-2x-4=0を解の公式で解くと？', sub:'判別式=4+16=20=4×5 → √20=2√5', a:'x=1±√5', choices:['x=1±√5','x=-1±√5','x=1±2√5','x=2±√5'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=4+16=20。x=(2±2√5)/2 → x=1±√5</span><span class="exp-tip">💡 √20=2√5！</span>' },
    { q:'x²+6x+4=0を解の公式で解くと？', sub:'判別式=36-16=20=4×5 → √20=2√5', a:'x=-3±√5', choices:['x=-3±√5','x=3±√5','x=-3±2√5','x=-6±√5'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=36-16=20。x=(-6±2√5)/2 → x=-3±√5</span><span class="exp-tip">💡 -6と2√5、両方を2で割る！</span>' },
    { q:'2x²+4x-1=0を解の公式で解くと？', sub:'a=2。判別式=16+8=24=4×6 → √24=2√6', a:'x=(-2±√6)/2', choices:['x=(-2±√6)/2','x=-2±√6','x=(-2±√6)/4','x=(-4±√6)/2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=16+8=24。x=(-4±2√6)/4 → 分子分母を2で割って x=(-2±√6)/2</span><span class="exp-tip">💡 分母が2aで4になる場合も、分子の共通因数と一緒に約分できるか確認！</span>' },
    { q:'x²-4x-1=0を解の公式で解くと？', sub:'判別式=16+4=20=4×5 → √20=2√5', a:'x=2±√5', choices:['x=2±√5','x=-2±√5','x=2±2√5','x=4±√5'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=16+4=20。x=(4±2√5)/2 → x=2±√5</span><span class="exp-tip">💡 4÷2=2、2√5÷2=√5！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_quad_s3_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — いろいろなパターン</div>';
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
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">Section 1〜3の総まとめだ。a,b,cの見つけ方・解の公式・いろいろなパターン——全部出るよ。自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'x²-4x+3=0 の a,b,cは？', sub:'そのまま係数を読み取る', a:'a=1, b=-4, c=3', choices:['a=1, b=-4, c=3','a=1, b=4, c=3','a=1, b=-4, c=-3','a=4, b=1, c=3'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>x²の係数a、xの係数b、定数項c</span><span class="exp-tip">💡 符号ごと読み取る！</span>' },
    { q:'x²+7=0 の a,b,cは？', sub:'xの項がない場合はb=0', a:'a=1, b=0, c=7', choices:['a=1, b=0, c=7','a=1, b=7, c=0','a=0, b=1, c=7','a=1, b=1, c=7'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>xの項がない→b=0</span><span class="exp-tip">💡 見た目に無くても0として扱う！</span>' },
    { q:'3x²-x=0 の a,b,cは？', sub:'定数項がない場合はc=0', a:'a=3, b=-1, c=0', choices:['a=3, b=-1, c=0','a=3, b=0, c=-1','a=3, b=1, c=0','a=0, b=3, c=-1'], exp:'<span class="exp-rule"><span class="label">📐 ルール</span>定数項がない→c=0。「-x」は「-1x」だからb=-1</span><span class="exp-tip">💡 xの係数が省略された1にも注意！</span>' },
    { q:'x²-2x=8 を ax²+bx+c=0 の形に整えると？', sub:'右辺を移項する', a:'x²-2x-8=0', choices:['x²-2x-8=0','x²-2x+8=0','x²+2x-8=0','x²-8x=0'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>右辺の8を左辺に移項 → x²-2x-8=0</span><span class="exp-tip">💡 移項で符号が変わる！</span>' },
    { q:'-x²+3x+2=0 を a>0になるように整えると？', sub:'両辺に-1を掛ける', a:'x²-3x-2=0', choices:['x²-3x-2=0','x²+3x+2=0','x²-3x+2=0','x²+3x-2=0'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>全項に-1を掛けて符号反転 → x²-3x-2=0</span><span class="exp-tip">💡 aがマイナスならa>0にする慣習！</span>' },
    { q:'x²+7x+10=0を解の公式で解くと？', sub:'判別式=49-40=9', a:'x=-2, -5', choices:['x=-2, -5','x=2, 5','x=-2, 5','x=-1, -10'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=49-40=9。x=(-7±3)/2 → x=-2, -5</span><span class="exp-tip">💡 判別式が9のきれいなパターン！</span>' },
    { q:'x²-5x+4=0を解の公式で解くと？', sub:'判別式=25-16=9', a:'x=1, 4', choices:['x=1, 4','x=-1, -4','x=1, -4','x=2, 2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25-16=9。x=(5±3)/2 → x=4, 1</span><span class="exp-tip">💡 -b=5であることに注意！</span>' },
    { q:'x²-4x+4=0を解の公式で解くと？', sub:'判別式=16-16=0（重解）', a:'x=2（重解）', choices:['x=2（重解）','x=-2（重解）','x=4（重解）','x=2, -2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=0。x=4/2=2（重解）</span><span class="exp-tip">💡 判別式0は解が1つだけ！</span>' },
    { q:'2x²+7x+3=0を解の公式で解くと？', sub:'a=2。判別式=49-24=25', a:'x=-1/2, -3', choices:['x=-1/2, -3','x=1/2, 3','x=-1/2, 3','x=1/2, -3'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=49-24=25。x=(-7±5)/4 → x=-1/2, -3</span><span class="exp-tip">💡 分母4を忘れずに！</span>' },
    { q:'3x²+5x+2=0を解の公式で解くと？', sub:'a=3。判別式=25-24=1', a:'x=-2/3, -1', choices:['x=-2/3, -1','x=2/3, 1','x=-2/3, 1','x=2/3, -1'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25-24=1。x=(-5±1)/6 → x=-2/3, -1</span><span class="exp-tip">💡 分母6できちんと約分する！</span>' },
    { q:'x²-9=0を解の公式で解くと？', sub:'b=0。判別式=0+36=36', a:'x=±3', choices:['x=±3','x=±9','x=3','x=±6'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=36。x=(0±6)/2=±3</span><span class="exp-tip">💡 √36=6ときれいな数に！</span>' },
    { q:'2x²-5x=0を解の公式で解くと？', sub:'c=0。判別式=25-0=25', a:'x=0, 5/2', choices:['x=0, 5/2','x=0, -5/2','x=5/2','x=2, 5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25。x=(5±5)/4 → x=0, 5/2</span><span class="exp-tip">💡 c=0のときは解の1つが必ず0！</span>' },
    { q:'x²+2x-2=0を解の公式で解くと？', sub:'判別式=4+8=12=4×3', a:'x=-1±√3', choices:['x=-1±√3','x=1±√3','x=-1±2√3','x=-2±√3'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=12。x=(-2±2√3)/2 → x=-1±√3</span><span class="exp-tip">💡 √12=2√3、分子全体を2で割る！</span>' },
    { q:'x²-6x+7=0を解の公式で解くと？', sub:'判別式=36-28=8=4×2', a:'x=3±√2', choices:['x=3±√2','x=-3±√2','x=3±2√2','x=6±√2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=8。x=(6±2√2)/2 → x=3±√2</span><span class="exp-tip">💡 √8=2√2！</span>' },
    { q:'x²+4x-1=0を解の公式で解くと？', sub:'判別式=16+4=20=4×5', a:'x=-2±√5', choices:['x=-2±√5','x=2±√5','x=-2±2√5','x=-4±√5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=20。x=(-4±2√5)/2 → x=-2±√5</span><span class="exp-tip">💡 √20=2√5！</span>' },
    { q:'x²-2x-1=0を解の公式で解くと？', sub:'判別式=4+4=8=4×2', a:'x=1±√2', choices:['x=1±√2','x=-1±√2','x=1±2√2','x=2±√2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=8。x=(2±2√2)/2 → x=1±√2</span><span class="exp-tip">💡 分子全体を2で割るのを忘れずに！</span>' },
    { q:'x²+2x-4=0を解の公式で解くと？', sub:'判別式=4+16=20=4×5', a:'x=-1±√5', choices:['x=-1±√5','x=1±√5','x=-1±2√5','x=-2±√5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=20。x=(-2±2√5)/2 → x=-1±√5</span><span class="exp-tip">💡 √20=2√5！</span>' },
    { q:'x²-8x+13=0を解の公式で解くと？', sub:'判別式=64-52=12=4×3', a:'x=4±√3', choices:['x=4±√3','x=-4±√3','x=4±2√3','x=8±√3'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=12。x=(8±2√3)/2 → x=4±√3</span><span class="exp-tip">💡 √12=2√3！</span>' },
    { q:'2x²+2x-1=0を解の公式で解くと？', sub:'a=2。判別式=4+8=12=4×3', a:'x=(-1±√3)/2', choices:['x=(-1±√3)/2','x=-1±√3','x=(-1±√3)/4','x=(-2±√3)/2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=12。x=(-2±2√3)/4 → 分子分母を2で割り x=(-1±√3)/2</span><span class="exp-tip">💡 分母4も約分の対象になる場合がある！</span>' },
    { q:'x²+6x+2=0を解の公式で解くと？', sub:'判別式=36-8=28=4×7', a:'x=-3±√7', choices:['x=-3±√7','x=3±√7','x=-3±2√7','x=-6±√7'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=28。x=(-6±2√7)/2 → x=-3±√7</span><span class="exp-tip">💡 √28=2√7！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_quad_s4_q' + i; });
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
  for (var i = 0; i < 20; i++) { s4qids.push('math_quad_s4_q' + i); }
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
    ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。解の公式は完全に君のものだね」'
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
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_quad_') === 0; });
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
