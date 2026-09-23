// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「扇形？円錐？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺円錐できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「立体図形で漫才できるかもしれない」' },
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
var answeredSet  = JSON.parse(localStorage.getItem('math_solid_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_solid_sections') || '{}');
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
  localStorage.setItem('math_solid_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('math_solid_') === 0 && getPct(id) < 80;
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
  // Section 1：おうぎ形
  'math_solid_s1_q0':'半径6cm・中心角120°の扇形の弧の長さは？（πを使った式で）',
  'math_solid_s1_q1':'半径6cm・中心角120°の扇形の面積は？（πを使った式で）',
  'math_solid_s1_q2':'半径9cm・中心角40°の扇形の弧の長さは？（πを使った式で）',
  'math_solid_s1_q3':'半径5cmで弧の長さが2πcmの扇形の中心角は？',
  'math_solid_s1_q4':'半径8cm・中心角45°の扇形の面積は？（πを使った式で）',
  'math_solid_s1_q5':'弧の長さ6π・半径9cmの扇形の面積は？（公式 S=½lr を使って）',
  'math_solid_s1_q6':'半径12cm・中心角30°の扇形の弧の長さは？（πを使った式で）',
  'math_solid_s1_q7':'半径10cm・中心角216°の扇形の面積は？（πを使った式で）',
  // Section 2：柱体
  'math_solid_s2_q0':'底面の半径5cm・高さ8cmの円柱の体積は？（πを使った式で）',
  'math_solid_s2_q1':'底面の半径5cm・高さ8cmの円柱の側面積は？（πを使った式で）',
  'math_solid_s2_q2':'底面の半径5cm・高さ8cmの円柱の表面積は？（πを使った式で）',
  'math_solid_s2_q3':'底面が1辺4cmの正方形・高さ10cmの四角柱の体積は？',
  'math_solid_s2_q4':'底面の半径3cm・高さ12cmの円柱の表面積は？（πを使った式で）',
  'math_solid_s2_q5':'底面の半径4cmの円柱の側面を展開すると、長方形の横の長さは？（πを使った式で）',
  'math_solid_s2_q6':'底面の半径2cm・高さ9cmの円柱の体積は？（πを使った式で）',
  'math_solid_s2_q7':'底面積20cm²・高さ7cmの角柱の体積は？',
  // Section 3：錐体
  'math_solid_s3_q0':'底面の半径3cm・高さ8cmの円錐の体積は？（πを使った式で）',
  'math_solid_s3_q1':'底面の半径6cm・母線10cmの円錐の側面積は？（公式 πrl を使って）',
  'math_solid_s3_q2':'底面の半径6cm・母線10cmの円錐の表面積は？（πを使った式で）',
  'math_solid_s3_q3':'底面の半径3cm・母線9cmの円錐を展開したとき、側面のおうぎ形の中心角は？',
  'math_solid_s3_q4':'底面1辺6cmの正方形・高さ4cmの四角錐の体積は？',
  'math_solid_s3_q5':'底面の半径4cm・母線6cmの円錐の側面積は？（πを使った式で）',
  'math_solid_s3_q6':'底面の半径5cm・高さ12cmの円錐の体積は？（πを使った式で）',
  'math_solid_s3_q7':'底面の半径5cm・母線13cmの円錐の表面積は？（πを使った式で）',
  // Section 4（確認テスト）
  'math_solid_s4_q0':'半径6cm・中心角90°の扇形の弧の長さは？（πを使った式で）',
  'math_solid_s4_q1':'半径6cm・中心角90°の扇形の面積は？（πを使った式で）',
  'math_solid_s4_q2':'半径10cm・中心角36°の扇形の弧の長さは？（πを使った式で）',
  'math_solid_s4_q3':'半径4cmで弧の長さがπcmの扇形の中心角は？',
  'math_solid_s4_q4':'半径6cm・中心角180°の扇形の面積は？（πを使った式で）',
  'math_solid_s4_q5':'弧の長さ8π・半径8cmの扇形の面積は？（公式 S=½lr を使って）',
  'math_solid_s4_q6':'底面の半径4cm・高さ9cmの円柱の体積は？（πを使った式で）',
  'math_solid_s4_q7':'底面の半径4cm・高さ9cmの円柱の側面積は？（πを使った式で）',
  'math_solid_s4_q8':'底面の半径4cm・高さ9cmの円柱の表面積は？（πを使った式で）',
  'math_solid_s4_q9':'底面が1辺6cmの正方形・高さ5cmの四角柱の体積は？',
  'math_solid_s4_q10':'底面の半径2cmの円柱の側面を展開すると、長方形の横の長さは？（πを使った式で）',
  'math_solid_s4_q11':'底面積15cm²・高さ6cmの角柱の体積は？',
  'math_solid_s4_q12':'底面の半径3cm・高さ4cmの円錐の体積は？（πを使った式で）',
  'math_solid_s4_q13':'底面の半径5cm・母線8cmの円錐の側面積は？（πを使った式で）',
  'math_solid_s4_q14':'底面の半径5cm・母線8cmの円錐の表面積は？（πを使った式で）',
  'math_solid_s4_q15':'底面の半径4cm・母線12cmの円錐を展開したとき、側面のおうぎ形の中心角は？',
  'math_solid_s4_q16':'底面1辺4cmの正方形・高さ6cmの四角錐の体積は？',
  'math_solid_s4_q17':'底面の半径6cm・高さ8cmの円錐の体積は？（πを使った式で）',
  'math_solid_s4_q18':'底面の半径2cm・母線5cmの円錐の側面積は？（πを使った式で）',
  'math_solid_s4_q19':'底面の半径3cm・母線5cmの円錐の表面積は？（πを使った式で）',
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
    if (qid.indexOf('math_solid_') !== 0) return;
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
  localStorage.setItem('math_solid_answered', JSON.stringify(answeredSet));
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
  var prefix = 'math_solid_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_solid_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'📐 スタート',   title:'扇形・柱体・錐体の世界へ', sub:'つまずきやすいポイントを今日でまとめて得意にする' },
  { id:1, label:'おうぎ形',      title:'おうぎ形（弧の長さ・面積）', sub:'「円の何割か」で考える——弧の長さと面積のルール' },
  { id:2, label:'柱体',          title:'柱体（円柱・角柱）',        sub:'体積・側面積・表面積。展開図で「なぜ」を理解する' },
  { id:3, label:'錐体',          title:'錐体（円錐・角錐）',        sub:'柱体の1/3。円錐は「扇形の展開図」とつながっている' },
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
    + '<div class="section-badge">数学 扇形・柱体・錐体 · SECTION ' + id + '</div>'
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
  // おうぎ形（半径・弧・中心角）
  sector: '<svg viewBox="0 0 300 220" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    + '<path d="M 150,110 L 150,30 A 80,80 0 0,1 220,150 Z" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
    + '<circle cx="150" cy="110" r="80" fill="none" stroke="#30363d" stroke-width="1.2" stroke-dasharray="3,4"/>'
    + '<circle cx="150" cy="110" r="3" fill="#f5c518"/>'
    + '<text x="158" y="107" fill="#f5c518" font-size="12">O</text>'
    + '<line x1="150" y1="110" x2="150" y2="30" stroke="#0ea5e9" stroke-width="2"/>'
    + '<text x="120" y="65" fill="#0ea5e9" font-size="12">半径r</text>'
    + '<path d="M 150,30 A 80,80 0 0,1 220,150" fill="none" stroke="#e94560" stroke-width="3"/>'
    + '<text x="210" y="60" fill="#e94560" font-size="12">弧の長さ l</text>'
    + '<path d="M 170,110 A 20,20 0 0,1 163,131" fill="none" stroke="#3fb950" stroke-width="1.5"/>'
    + '<text x="176" y="126" fill="#3fb950" font-size="12">中心角a°</text>'
    + '<text x="150" y="205" fill="#8b949e" font-size="12" text-anchor="middle">扇形＝円の (a÷360) の割合</text>'
    + '</svg>',

  // 円柱：立体＋展開図
  cylinderNet: '<svg viewBox="0 0 360 220" style="width:100%;max-width:400px;display:block;margin:0 auto">'
    // 立体（円柱）
    + '<ellipse cx="70" cy="45" rx="45" ry="14" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<line x1="25" y1="45" x2="25" y2="140" stroke="#0ea5e9" stroke-width="2"/>'
    + '<line x1="115" y1="45" x2="115" y2="140" stroke="#0ea5e9" stroke-width="2"/>'
    + '<path d="M 25,140 A 45,14 0 0,0 115,140" fill="none" stroke="#0ea5e9" stroke-width="2"/>'
    + '<path d="M 25,140 A 45,14 0 0,1 115,140" fill="none" stroke="#0ea5e9" stroke-width="1.2" stroke-dasharray="3,3"/>'
    + '<text x="70" y="180" fill="#0ea5e9" font-size="12" text-anchor="middle">円柱（底面 半径r・高さh）</text>'
    + '<text x="130" y="95" fill="#f5c518" font-size="16" text-anchor="middle">→</text>'
    // 展開図
    + '<circle cx="220" cy="45" r="30" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="220" y="49" fill="#3fb950" font-size="11" text-anchor="middle">底面</text>'
    + '<rect x="180" y="90" width="80" height="70" fill="rgba(233,69,96,0.08)" stroke="#e94560" stroke-width="2"/>'
    + '<text x="220" y="130" fill="#e94560" font-size="11" text-anchor="middle">側面</text>'
    + '<circle cx="220" cy="195" r="30" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="220" y="199" fill="#3fb950" font-size="11" text-anchor="middle">底面</text>'
    + '<path d="M 260,90 L 320,90" stroke="#8b949e" stroke-width="1" stroke-dasharray="2,3"/>'
    + '<path d="M 260,160 L 320,160" stroke="#8b949e" stroke-width="1" stroke-dasharray="2,3"/>'
    + '<text x="330" y="128" fill="#e94560" font-size="11" transform="rotate(90 330 128)" text-anchor="middle">横＝2πr（底面の円周と同じ長さ！）</text>'
    + '</svg>',

  // 円錐：立体＋展開図
  coneNet: '<svg viewBox="0 0 360 220" style="width:100%;max-width:400px;display:block;margin:0 auto">'
    // 立体（円錐）
    + '<ellipse cx="65" cy="150" rx="45" ry="14" fill="rgba(14,165,233,0.08)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<path d="M 20,150 L 65,35 L 110,150" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<path d="M 20,150 A 45,14 0 0,0 110,150" fill="none" stroke="#0ea5e9" stroke-width="1.2" stroke-dasharray="3,3"/>'
    + '<text x="90" y="90" fill="#f5c518" font-size="12">母線l</text>'
    + '<text x="65" y="170" fill="#0ea5e9" font-size="11" text-anchor="middle">底面 半径r</text>'
    + '<text x="130" y="95" fill="#f5c518" font-size="16" text-anchor="middle">→</text>'
    // 展開図
    + '<path d="M 220,190 L 220,90 A 100,100 0 0,1 300,140 Z" fill="rgba(233,69,96,0.1)" stroke="#e94560" stroke-width="2"/>'
    + '<text x="238" y="120" fill="#e94560" font-size="11">側面（おうぎ形）</text>'
    + '<text x="205" y="150" fill="#f5c518" font-size="11">母線l</text>'
    + '<circle cx="255" cy="205" r="16" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="255" y="209" fill="#3fb950" font-size="10" text-anchor="middle">底面</text>'
    + '<text x="270" y="80" fill="#e94560" font-size="11">弧の長さ＝底面の円周(2πr)と同じ！</text>'
    + '</svg>',
};

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん、扇形とか円柱とか円錐とか、急に立体になるとわけわかんなくなるんだけど！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">みんなそこでつまずく。でも実はこの4つ、全部「円」でつながってるんだ。扇形は円の一部。円柱と円錐は、底面が円。しかも円錐の側面を開くと——扇形になる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">え、円錐の中に扇形が隠れてるってこと！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その通り。円錐をペラッと切り開くと、底面の円と、扇形の側面に分かれる。この「つながり」が見えるようになれば、もう怖くない。今日はそこを徹底的にやる。</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">📐 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：おうぎ形（弧の長さ・面積の公式と使い方）<br>'
    + 'Section 2：柱体（円柱・角柱の体積・側面積・表面積）<br>'
    + 'Section 3：錐体（円錐・角錐の体積・表面積、扇形とのつながり）'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">📐 Section 1 から始める →</button>';
}

// ===== SECTION 1: おうぎ形 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">扇形って、円の一部っていうのはわかるけど、公式が全然覚えられない！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">扇形は「円全体のうち、中心角a°の分だけ」——それだけなんだ。円周や面積の公式に、a÷360を掛け算するだけでいい。中心角が360°なら円そのもの、180°なら半分、90°なら4分の1、と考えると楽になる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 おうぎ形の弧の長さと面積</div>'
    + SVG.sector
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">公式（最重要）</div>'
    + '<div class="ex">弧の長さ l ＝ <strong style="color:var(--gold)">2πr × (a ÷ 360)</strong></div>'
    + '<div class="ex">面積 S ＝ <strong style="color:var(--gold)">πr² × (a ÷ 360)</strong></div>'
    + '<div class="note">💡 「円周2πr」「円の面積πr²」に、a÷360（中心角の割合）を掛けるだけ！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">解き方3ステップ</div>'
    + '<div class="ex">① 半径rと中心角aを確認する</div>'
    + '<div class="ex">② a÷360を計算する（例：120°→1/3、90°→1/4、45°→1/8）</div>'
    + '<div class="ex">③ 円周・面積の公式に掛ける</div>'
    + '<div class="note">⚠️ 360°で割るのを忘れると、答えが円全体の大きさになってしまう！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">裏ワザ公式（弧の長さがわかっているとき）</div>'
    + '<div class="ex">面積 S ＝ <strong style="color:var(--purple)">½ × l × r</strong>（l：弧の長さ、r：半径）</div>'
    + '<div class="note">💡 中心角を求めなくても、弧の長さと半径だけで面積が出せる！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'半径6cm・中心角120°の扇形の弧の長さは？（πを使った式で）', sub:'l = 2πr×(a÷360)。120÷360＝1/3',
      a:'4π cm', choices:['2π cm','4π cm','6π cm','8π cm'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>2π×6×(120÷360) = 12π×(1/3) = 4π cm</span><span class="exp-tip">💡 120°は360°の1/3。円周12πの1/3で4π！</span>' },
    { q:'半径6cm・中心角120°の扇形の面積は？（πを使った式で）', sub:'S = πr²×(a÷360)',
      a:'12π cm²', choices:['6π cm²','12π cm²','18π cm²','24π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×6²×(120÷360) = 36π×(1/3) = 12π cm²</span><span class="exp-tip">💡 円の面積36πの1/3で12π！</span>' },
    { q:'半径9cm・中心角40°の扇形の弧の長さは？（πを使った式で）', sub:'40÷360＝1/9',
      a:'2π cm', choices:['π cm','2π cm','3π cm','4π cm'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>2π×9×(40÷360) = 18π×(1/9) = 2π cm</span><span class="exp-tip">💡 円周18πの1/9で2π！</span>' },
    { q:'半径5cmで弧の長さが2πcmの扇形の中心角は？', sub:'公式を逆から使う：2π＝2π×5×(a÷360)',
      a:'72°', choices:['36°','72°','90°','144°'],
      exp:'<span class="exp-rule"><span class="label">📐 逆算</span>2π＝10π×(a÷360) → a÷360＝1/5 → a＝72°</span><span class="exp-tip">💡 「弧の長さ÷円周」＝「中心角÷360」という比の関係！</span>' },
    { q:'半径8cm・中心角45°の扇形の面積は？（πを使った式で）', sub:'45÷360＝1/8',
      a:'8π cm²', choices:['4π cm²','6π cm²','8π cm²','16π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×8²×(45÷360) = 64π×(1/8) = 8π cm²</span><span class="exp-tip">💡 面積64πの1/8で8π！</span>' },
    { q:'弧の長さ6π・半径9cmの扇形の面積は？（公式 S=½lr を使って）', sub:'中心角を求めなくても解ける',
      a:'27π cm²', choices:['18π cm²','27π cm²','36π cm²','54π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 裏ワザ公式</span>S＝½×l×r＝½×6π×9＝27π cm²</span><span class="exp-tip">💡 弧の長さと半径さえわかれば、中心角なしで面積が出せる！</span>' },
    { q:'半径12cm・中心角30°の扇形の弧の長さは？（πを使った式で）', sub:'30÷360＝1/12',
      a:'2π cm', choices:['π cm','2π cm','3π cm','4π cm'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>2π×12×(30÷360) = 24π×(1/12) = 2π cm</span><span class="exp-tip">💡 円周24πの1/12で2π！</span>' },
    { q:'半径10cm・中心角216°の扇形の面積は？（πを使った式で）', sub:'216÷360＝0.6',
      a:'60π cm²', choices:['54π cm²','60π cm²','66π cm²','72π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×10²×(216÷360) = 100π×0.6 = 60π cm²</span><span class="exp-tip">💡 216÷360は約分すると3/5。100π×3/5＝60π！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_solid_s1_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — おうぎ形</div>';
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

// ===== SECTION 2: 柱体 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">円柱の「表面積」って、なんで底面と側面を分けて考えるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">円柱をハサミで切って広げてみるとわかる。上下に円が2枚、真ん中に長方形が1枚——これが展開図だ。その長方形の「横の長さ」が、実は底面の円周とぴったり同じになる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">えっ、円をぐるっと巻いた分がそのまま長方形の横になるってこと！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その通り。だから側面積は「底面の円周 × 高さ」で求められる。これがわかれば、あとは底面積を2つ分足すだけだ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 円柱の展開図と公式</div>'
    + SVG.cylinderNet
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">柱体の体積（円柱・角柱共通）</div>'
    + '<div class="ex">体積 V ＝ <strong style="color:var(--gold)">底面積 × 高さ</strong></div>'
    + '<div class="ex">円柱：V ＝ πr² × h</div>'
    + '<div class="note">💡 底面積を先に求めてから、高さを掛ける！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">円柱の側面積・表面積</div>'
    + '<div class="ex">側面積 ＝ <strong style="color:var(--purple)">2πr × h</strong>（底面の円周 × 高さ）</div>'
    + '<div class="ex">表面積 ＝ 側面積 ＋ 底面積 × 2</div>'
    + '<div class="note">⚠️ 底面は上下2枚あるので「×2」を忘れない！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'底面の半径5cm・高さ8cmの円柱の体積は？（πを使った式で）', sub:'V＝πr²×h',
      a:'200π cm³', choices:['160π cm³','180π cm³','200π cm³','220π cm³'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×5²×8 = 25π×8 = 200π cm³</span><span class="exp-tip">💡 底面積25π×高さ8＝200π！</span>' },
    { q:'底面の半径5cm・高さ8cmの円柱の側面積は？（πを使った式で）', sub:'側面積＝2πr×h（底面の円周×高さ）',
      a:'80π cm²', choices:['40π cm²','80π cm²','120π cm²','160π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>2π×5×8 = 10π×8 = 80π cm²</span><span class="exp-tip">💡 底面の円周（10π）× 高さ（8）＝ 展開図の長方形の面積！</span>' },
    { q:'底面の半径5cm・高さ8cmの円柱の表面積は？（πを使った式で）', sub:'表面積＝側面積＋底面積×2',
      a:'130π cm²', choices:['100π cm²','115π cm²','130π cm²','150π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 計算</span>側面80π ＋ 底面(25π×2＝50π) ＝ 130π cm²</span><span class="exp-tip">💡 側面積と底面積を別々に出してから足す！</span>' },
    { q:'底面が1辺4cmの正方形・高さ10cmの四角柱の体積は？', sub:'V＝底面積×高さ',
      a:'160 cm³', choices:['80 cm³','120 cm³','160 cm³','200 cm³'],
      exp:'<span class="exp-rule"><span class="label">📐 計算</span>底面積4×4＝16、16×10＝160 cm³</span><span class="exp-tip">💡 角柱も考え方は同じ。「底面積×高さ」！</span>' },
    { q:'底面の半径3cm・高さ12cmの円柱の表面積は？（πを使った式で）', sub:'側面2πr×h、底面πr²×2',
      a:'90π cm²', choices:['72π cm²','81π cm²','90π cm²','108π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 計算</span>側面2π×3×12＝72π、底面9π×2＝18π、合計90π cm²</span><span class="exp-tip">💡 側面積と底面積を分けて計算し、最後に足す！</span>' },
    { q:'底面の半径4cmの円柱の側面を展開すると、長方形の横の長さは？（πを使った式で）', sub:'展開図の横＝底面の円周',
      a:'8π cm', choices:['4π cm','6π cm','8π cm','16π cm'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>底面の円周 ＝ 2π×4 ＝ 8π cm</span><span class="exp-tip">💡 側面の長方形の横は、必ず底面の円周と同じ長さになる！</span>' },
    { q:'底面の半径2cm・高さ9cmの円柱の体積は？（πを使った式で）', sub:'V＝πr²×h',
      a:'36π cm³', choices:['18π cm³','27π cm³','36π cm³','72π cm³'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×2²×9 = 4π×9 = 36π cm³</span><span class="exp-tip">💡 底面積4π×高さ9＝36π！</span>' },
    { q:'底面積20cm²・高さ7cmの角柱の体積は？', sub:'底面積が先に与えられているパターン',
      a:'140 cm³', choices:['100 cm³','120 cm³','140 cm³','160 cm³'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>V＝底面積×高さ＝20×7＝140 cm³</span><span class="exp-tip">💡 底面積が最初からわかっていれば、高さを掛けるだけ！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_solid_s2_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 柱体（円柱・角柱）</div>';
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

// ===== SECTION 3: 錐体 =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">円錐が一番わけわかんない…側面積とか、なんで急に「母線」とか出てくるの！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">母線（ぼせん）は、円錐の頂点から底面の円周までの「斜めの辺」の長さ。円錐をペラッと開くと、底面の円と、扇形の側面に分かれる——その扇形の半径が母線なんだ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">Section 1でやった扇形が、ここでつながってくるってこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その通り！しかもその扇形の「弧の長さ」は、底面の円周とぴったり同じになる。これさえわかれば、円錐は一気に得意になる。体積は柱体の1/3、というルールも合わせて覚えよう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 円錐の展開図と公式</div>'
    + SVG.coneNet
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">錐体の体積（円錐・角錐共通）</div>'
    + '<div class="ex">体積 V ＝ <strong style="color:var(--gold)">底面積 × 高さ ÷ 3</strong></div>'
    + '<div class="ex">円錐：V ＝ πr² × h ÷ 3</div>'
    + '<div class="note">⚠️ 柱体の公式に「÷3」を付け忘れるミスが超多い！同じ底面・高さなら、錐体は柱体の1/3の体積</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">円錐の側面積・表面積（母線 l、底面の半径 r）</div>'
    + '<div class="ex">側面積 ＝ <strong style="color:var(--purple)">π × r × l</strong>（πrl）</div>'
    + '<div class="ex">表面積 ＝ 側面積 ＋ 底面積（πr²）</div>'
    + '<div class="note">💡 この公式は「扇形の弧の長さ＝底面の円周」という関係から導かれている</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">展開図の扇形の中心角を求める公式</div>'
    + '<div class="ex">中心角 a ＝ <strong style="color:var(--gold)">360 × r ÷ l</strong></div>'
    + '<div class="note">💡 「弧の長さ(2πr) ＝ 円周(2πl)×(a÷360)」を整理するとこの式になる。丸ごと覚えてOK！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'底面の半径3cm・高さ8cmの円錐の体積は？（πを使った式で）', sub:'V＝πr²×h÷3。÷3を忘れずに',
      a:'24π cm³', choices:['18π cm³','24π cm³','27π cm³','72π cm³'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×3²×8÷3 = 72π÷3 = 24π cm³</span><span class="exp-ng">❌ 72π cm³は「÷3」を忘れた間違い！</span><span class="exp-tip">💡 円柱なら72πだけど、円錐はその1/3で24π！</span>' },
    { q:'底面の半径6cm・母線10cmの円錐の側面積は？（公式 πrl を使って）', sub:'側面積＝π×r×l',
      a:'60π cm²', choices:['30π cm²','60π cm²','90π cm²','120π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×6×10 = 60π cm²</span><span class="exp-tip">💡 底面の半径と母線をπrlに当てはめるだけ！</span>' },
    { q:'底面の半径6cm・母線10cmの円錐の表面積は？（πを使った式で）', sub:'表面積＝側面積＋底面積',
      a:'96π cm²', choices:['72π cm²','84π cm²','96π cm²','106π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 計算</span>側面60π ＋ 底面(6²π＝36π) ＝ 96π cm²</span><span class="exp-tip">💡 側面積πrlと底面積πr²を別々に出して足す！</span>' },
    { q:'底面の半径3cm・母線9cmの円錐を展開したとき、側面のおうぎ形の中心角は？', sub:'中心角a＝360×r÷l',
      a:'120°', choices:['60°','90°','120°','150°'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>a＝360×3÷9＝120°</span><span class="exp-tip">💡 r÷lの比がそのまま中心角÷360になる！</span>' },
    { q:'底面1辺6cmの正方形・高さ4cmの四角錐の体積は？', sub:'V＝底面積×高さ÷3',
      a:'48 cm³', choices:['36 cm³','48 cm³','72 cm³','144 cm³'],
      exp:'<span class="exp-rule"><span class="label">📐 計算</span>底面積6×6＝36、36×4÷3＝48 cm³</span><span class="exp-tip">💡 角錐も円錐と同じ「÷3」を忘れずに！</span>' },
    { q:'底面の半径4cm・母線6cmの円錐の側面積は？（πを使った式で）', sub:'側面積＝πrl',
      a:'24π cm²', choices:['12π cm²','20π cm²','24π cm²','48π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×4×6 = 24π cm²</span><span class="exp-tip">💡 r＝4、l＝6をπrlに代入するだけ！</span>' },
    { q:'底面の半径5cm・高さ12cmの円錐の体積は？（πを使った式で）', sub:'V＝πr²×h÷3',
      a:'100π cm³', choices:['80π cm³','100π cm³','150π cm³','300π cm³'],
      exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×5²×12÷3 = 300π÷3 = 100π cm³</span><span class="exp-tip">💡 300πの1/3で100π。÷3を先にやっても後でやってもOK！</span>' },
    { q:'底面の半径5cm・母線13cmの円錐の表面積は？（πを使った式で）', sub:'側面πrl＋底面πr²',
      a:'90π cm²', choices:['65π cm²','80π cm²','90π cm²','100π cm²'],
      exp:'<span class="exp-rule"><span class="label">📐 計算</span>側面π×5×13＝65π、底面5²π＝25π、合計90π cm²</span><span class="exp-tip">💡 側面積と底面積、それぞれ計算してから足す！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_solid_s3_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 錐体（円錐・角錐）</div>';
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
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">Section 1〜3の総まとめだ。おうぎ形・柱体・錐体——全部出るよ。自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'半径6cm・中心角90°の扇形の弧の長さは？（πを使った式で）', sub:'l＝2πr×(a÷360)', a:'3π cm', choices:['2π cm','3π cm','4π cm','6π cm'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>2π×6×(90÷360)＝12π×(1/4)＝3π cm</span><span class="exp-tip">💡 中心角90°は円周の1/4！</span>' },
    { q:'半径6cm・中心角90°の扇形の面積は？（πを使った式で）', sub:'S＝πr²×(a÷360)', a:'9π cm²', choices:['6π cm²','9π cm²','12π cm²','18π cm²'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×6²×(90÷360)＝36π×(1/4)＝9π cm²</span><span class="exp-tip">💡 面積36πの1/4で9π！</span>' },
    { q:'半径10cm・中心角36°の扇形の弧の長さは？（πを使った式で）', sub:'36÷360＝1/10', a:'2π cm', choices:['π cm','2π cm','3π cm','5π cm'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>2π×10×(36÷360)＝20π×(1/10)＝2π cm</span><span class="exp-tip">💡 円周20πの1/10で2π！</span>' },
    { q:'半径4cmで弧の長さがπcmの扇形の中心角は？', sub:'π＝2π×4×(a÷360)', a:'45°', choices:['30°','45°','60°','90°'], exp:'<span class="exp-rule"><span class="label">📐 逆算</span>π＝8π×(a÷360) → a÷360＝1/8 → a＝45°</span><span class="exp-tip">💡 弧の長さと円周の比＝中心角と360°の比！</span>' },
    { q:'半径6cm・中心角180°の扇形の面積は？（πを使った式で）', sub:'180°は半円', a:'18π cm²', choices:['9π cm²','12π cm²','18π cm²','36π cm²'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×6²×(180÷360)＝36π×(1/2)＝18π cm²</span><span class="exp-tip">💡 中心角180°＝半円。面積36πの半分！</span>' },
    { q:'弧の長さ8π・半径8cmの扇形の面積は？（公式 S=½lr を使って）', sub:'中心角なしで解ける裏ワザ公式', a:'32π cm²', choices:['16π cm²','24π cm²','32π cm²','40π cm²'], exp:'<span class="exp-rule"><span class="label">📐 裏ワザ公式</span>S＝½×8π×8＝32π cm²</span><span class="exp-tip">💡 弧の長さ×半径÷2でOK！</span>' },
    { q:'底面の半径4cm・高さ9cmの円柱の体積は？（πを使った式で）', sub:'V＝πr²×h', a:'144π cm³', choices:['108π cm³','126π cm³','144π cm³','162π cm³'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×4²×9＝16π×9＝144π cm³</span><span class="exp-tip">💡 底面積16π×高さ9！</span>' },
    { q:'底面の半径4cm・高さ9cmの円柱の側面積は？（πを使った式で）', sub:'側面積＝2πr×h', a:'72π cm²', choices:['36π cm²','54π cm²','72π cm²','90π cm²'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>2π×4×9＝8π×9＝72π cm²</span><span class="exp-tip">💡 底面の円周8π×高さ9！</span>' },
    { q:'底面の半径4cm・高さ9cmの円柱の表面積は？（πを使った式で）', sub:'側面積＋底面積×2', a:'104π cm²', choices:['88π cm²','96π cm²','104π cm²','112π cm²'], exp:'<span class="exp-rule"><span class="label">📐 計算</span>側面72π＋底面(16π×2＝32π)＝104π cm²</span><span class="exp-tip">💡 底面2枚分を足すのを忘れずに！</span>' },
    { q:'底面が1辺6cmの正方形・高さ5cmの四角柱の体積は？', sub:'V＝底面積×高さ', a:'180 cm³', choices:['150 cm³','160 cm³','180 cm³','200 cm³'], exp:'<span class="exp-rule"><span class="label">📐 計算</span>6×6×5＝180 cm³</span><span class="exp-tip">💡 底面積36×高さ5！</span>' },
    { q:'底面の半径2cmの円柱の側面を展開すると、長方形の横の長さは？（πを使った式で）', sub:'展開図の横＝底面の円周', a:'4π cm', choices:['2π cm','4π cm','8π cm','16π cm'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>2π×2＝4π cm</span><span class="exp-tip">💡 側面の横幅は必ず底面の円周と同じ！</span>' },
    { q:'底面積15cm²・高さ6cmの角柱の体積は？', sub:'底面積が先に与えられているパターン', a:'90 cm³', choices:['75 cm³','80 cm³','90 cm³','96 cm³'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>15×6＝90 cm³</span><span class="exp-tip">💡 底面積×高さでそのまま計算！</span>' },
    { q:'底面の半径3cm・高さ4cmの円錐の体積は？（πを使った式で）', sub:'V＝πr²×h÷3', a:'12π cm³', choices:['9π cm³','12π cm³','16π cm³','36π cm³'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×3²×4÷3＝36π÷3＝12π cm³</span><span class="exp-tip">💡 ÷3を忘れずに！</span>' },
    { q:'底面の半径5cm・母線8cmの円錐の側面積は？（πを使った式で）', sub:'側面積＝πrl', a:'40π cm²', choices:['20π cm²','40π cm²','60π cm²','80π cm²'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×5×8＝40π cm²</span><span class="exp-tip">💡 半径×母線×πでOK！</span>' },
    { q:'底面の半径5cm・母線8cmの円錐の表面積は？（πを使った式で）', sub:'側面積＋底面積', a:'65π cm²', choices:['50π cm²','55π cm²','65π cm²','75π cm²'], exp:'<span class="exp-rule"><span class="label">📐 計算</span>側面40π＋底面25π＝65π cm²</span><span class="exp-tip">💡 側面積と底面積を足す！</span>' },
    { q:'底面の半径4cm・母線12cmの円錐を展開したとき、側面のおうぎ形の中心角は？', sub:'中心角a＝360×r÷l', a:'120°', choices:['90°','100°','120°','150°'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>a＝360×4÷12＝120°</span><span class="exp-tip">💡 r÷lの比＝a÷360の比！</span>' },
    { q:'底面1辺4cmの正方形・高さ6cmの四角錐の体積は？', sub:'V＝底面積×高さ÷3', a:'32 cm³', choices:['16 cm³','24 cm³','32 cm³','48 cm³'], exp:'<span class="exp-rule"><span class="label">📐 計算</span>4×4×6÷3＝96÷3＝32 cm³</span><span class="exp-tip">💡 底面積16×高さ6÷3！</span>' },
    { q:'底面の半径6cm・高さ8cmの円錐の体積は？（πを使った式で）', sub:'V＝πr²×h÷3', a:'96π cm³', choices:['72π cm³','84π cm³','96π cm³','288π cm³'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×6²×8÷3＝288π÷3＝96π cm³</span><span class="exp-ng">❌ 288π cm³は「÷3」を忘れた間違い！</span><span class="exp-tip">💡 円柱なら288π、円錐はその1/3！</span>' },
    { q:'底面の半径2cm・母線5cmの円錐の側面積は？（πを使った式で）', sub:'側面積＝πrl', a:'10π cm²', choices:['5π cm²','10π cm²','15π cm²','20π cm²'], exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×2×5＝10π cm²</span><span class="exp-tip">💡 r×l×πでOK！</span>' },
    { q:'底面の半径3cm・母線5cmの円錐の表面積は？（πを使った式で）', sub:'側面積＋底面積', a:'24π cm²', choices:['15π cm²','21π cm²','24π cm²','27π cm²'], exp:'<span class="exp-rule"><span class="label">📐 計算</span>側面π×3×5＝15π、底面9π、合計24π cm²</span><span class="exp-tip">💡 側面積と底面積を足すのを忘れずに！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_solid_s4_q' + i; });
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
  for (var i = 0; i < 20; i++) { s4qids.push('math_solid_s4_q' + i); }
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
    ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。扇形も円錐も、君のものだね」'
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
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_solid_') === 0; });
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
