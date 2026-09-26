// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「図形？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺図形できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「図形で漫才できるかもしれない」' },
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
var answeredSet  = JSON.parse(localStorage.getItem('math_geo_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_geo_sections') || '{}');
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
  localStorage.setItem('math_geo_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('math_geo_') === 0 && getPct(id) < 80;
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
  // Section 1
  'math_geo_s1_q0':'三角形の3つの内角の和は何度？',
  'math_geo_s1_q1':'四角形の内角の和は何度？',
  'math_geo_s1_q2':'二等辺三角形の「底角」とはどれのこと？',
  'math_geo_s1_q3':'正三角形の1つの角の大きさは何度？',
  'math_geo_s1_q4':'円で、円上の2点を結んだ直線（曲線ではなく）を何という？',
  'math_geo_s1_q5':'半径5cmの円の円周はいくつ？（πを使った式で）',
  'math_geo_s1_q6':'平行四辺形の向かい合う角の性質は？',
  'math_geo_s1_q7':'直角三角形とはどんな三角形？',
  'math_geo_s1_q8':'ひし形の対角線の交わり方は？',
  'math_geo_s1_q9':'半径3cmの円の面積は？（πを使った式で）',
  // Section 2
  'math_geo_s2_q0':'対頂角とはどのような角？',
  'math_geo_s2_q1':'平行な2直線に横断線が交わるとき、同位角の性質は？',
  'math_geo_s2_q2':'平行な2直線に横断線が交わるとき、錯角の性質は？',
  'math_geo_s2_q3':'三角形の2つの角が45°と75°のとき、残りの角は何度？',
  'math_geo_s2_q4':'三角形の外角の大きさは？',
  'math_geo_s2_q5':'五角形の内角の和は何度？',
  'math_geo_s2_q6':'六角形の内角の和は何度？',
  'math_geo_s2_q7':'正六角形の1つの内角の大きさは？',
  'math_geo_s2_q8':'四角形の3角が80°・95°・110°のとき、残りの角は？',
  'math_geo_s2_q9':'どんな多角形でも外角の和は何度？',
  // Section 3
  'math_geo_s3_q0':'底辺8cm・高さ5cmの三角形の面積は？',
  'math_geo_s3_q1':'底辺12cm・高さ7cmの平行四辺形の面積は？',
  'math_geo_s3_q2':'上底4cm・下底10cm・高さ6cmの台形の面積は？',
  'math_geo_s3_q3':'対角線が6cmと8cmのひし形の面積は？',
  'math_geo_s3_q4':'半径6cmの円の面積は？（πを使った式で）',
  'math_geo_s3_q5':'半径4cm・中心角90°の扇形の面積は？（πを使った式で）',
  'math_geo_s3_q6':'底面の半径3cm・高さ10cmの円柱の体積は？（πを使った式で）',
  'math_geo_s3_q7':'縦3cm・横5cm・高さ4cmの直方体の体積は？',
  'math_geo_s3_q8':'底面の半径3cm・高さ6cmの円錐の体積は？（πを使った式で）',
  'math_geo_s3_q9':'同じ底辺・同じ高さの三角形と平行四辺形の面積の比は？',
  // Section 4（確認テスト）
  'math_geo_s4_q0':'三角形の内角の和は何度？',
  'math_geo_s4_q1':'正三角形の1つの角の大きさは何度？',
  'math_geo_s4_q2':'四角形の内角の和は何度？',
  'math_geo_s4_q3':'平行四辺形の向かい合う角（対角）の性質は？',
  'math_geo_s4_q4':'円上の2点を結ぶ直線（線分）を何という？',
  'math_geo_s4_q5':'ひし形の対角線の交わり方は？',
  'math_geo_s4_q6':'半径5cmの円の面積は？（πを使った式で）',
  'math_geo_s4_q7':'対頂角とはどのような角か？',
  'math_geo_s4_q8':'平行線に横断線が交わるとき、同位角は？',
  'math_geo_s4_q9':'三角形の2つの角が40°と65°のとき、残りの角は？',
  'math_geo_s4_q10':'三角形の外角の大きさは？',
  'math_geo_s4_q11':'五角形の内角の和は何度？',
  'math_geo_s4_q12':'どんな多角形でも外角の和は何度？',
  'math_geo_s4_q13':'正六角形の1つの角の大きさは何度？',
  'math_geo_s4_q14':'底辺6cm・高さ9cmの三角形の面積は？',
  'math_geo_s4_q15':'上底3cm・下底9cm・高さ4cmの台形の面積は？',
  'math_geo_s4_q16':'対角線が10cmと8cmのひし形の面積は？',
  'math_geo_s4_q17':'半径4cm・中心角180°の扇形の面積は？（πを使った式で）',
  'math_geo_s4_q18':'底面の半径2cm・高さ5cmの円柱の体積は？（πを使った式で）',
  'math_geo_s4_q19':'底辺8cm・高さ6cmの平行四辺形の面積は？',
};

function getJpForQid(qid) {
  // Q_JP_MAP（実際の問題文）を最優先
  if (Q_JP_MAP[qid]) return Q_JP_MAP[qid];
  if (qMeta[qid] && qMeta[qid].jp) return qMeta[qid].jp;
  if (weakDB[qid] && weakDB[qid].jp) return weakDB[qid].jp;
  return qid;
}

function repairWeakDB() {
  var changed = false;
  Object.keys(weakDB).forEach(function(qid) {
    if (qid.indexOf('math_geo_') !== 0) return;
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
  // Object.assign で既存の jp などを保持しつつ更新
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
  localStorage.setItem('math_geo_answered', JSON.stringify(answeredSet));
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
  var prefix = 'math_geo_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_geo_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'📐 スタート',   title:'図形の世界へようこそ',   sub:'形・角度・面積——図形のすべてのスタート地点' },
  { id:1, label:'図形の基本',    title:'図形の基本',              sub:'点・直線・角、三角形・四角形・円の性質' },
  { id:2, label:'角度',          title:'角度の性質と計算',        sub:'内角・外角・対頂角・同位角・錯角のルール' },
  { id:3, label:'面積・体積',    title:'面積と体積の基本',        sub:'公式をマスターして図形の大きさを求めよう' },
  { id:4, label:'確認テスト',    title:'確認テスト',              sub:'全セクション総まとめ！何問正解できる？' },
  { id:5, label:'📊弱点',        title:'弱点ノート',              sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',        title:'弱点特訓モード',          sub:'弱点問題だけを集中練習！' },
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
    + '<div class="section-badge">数学 図形 · SECTION ' + id + '</div>'
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
  // 三角形（内角表示つき）
  triangle: '<svg viewBox="0 0 300 200" style="width:100%;max-width:320px;display:block;margin:0 auto">'
    + '<polygon points="150,20 30,175 270,175" fill="rgba(163,113,247,0.08)" stroke="#a371f7" stroke-width="2"/>'
    + '<text x="145" y="14" fill="#a371f7" font-size="13" text-anchor="middle" font-family="serif">A</text>'
    + '<text x="20" y="190" fill="#a371f7" font-size="13" text-anchor="middle" font-family="serif">B</text>'
    + '<text x="278" y="190" fill="#a371f7" font-size="13" text-anchor="middle" font-family="serif">C</text>'
    + '<text x="150" y="42" fill="#f5c518" font-size="12" text-anchor="middle">∠A</text>'
    + '<text x="52" y="168" fill="#f5c518" font-size="12" text-anchor="middle">∠B</text>'
    + '<text x="250" y="168" fill="#f5c518" font-size="12" text-anchor="middle">∠C</text>'
    + '<text x="150" y="115" fill="#8b949e" font-size="13" text-anchor="middle">∠A＋∠B＋∠C＝180°</text>'
    + '</svg>',

  // 三角形の種類
  triangleTypes: '<svg viewBox="0 0 340 160" style="width:100%;max-width:380px;display:block;margin:0 auto">'
    // 正三角形
    + '<polygon points="55,140 15,140 35,105" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1.8"/>'
    + '<text x="35" y="155" fill="#0ea5e9" font-size="11" text-anchor="middle">正三角形</text>'
    + '<text x="35" y="167" fill="#8b949e" font-size="10" text-anchor="middle">3辺が等しい</text>'
    // 二等辺三角形
    + '<polygon points="130,140 90,140 110,100" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="1.8"/>'
    + '<text x="110" y="155" fill="#3fb950" font-size="11" text-anchor="middle">二等辺三角形</text>'
    + '<text x="110" y="167" fill="#8b949e" font-size="10" text-anchor="middle">2辺が等しい</text>'
    // 直角三角形
    + '<polygon points="220,140 160,140 160,95" fill="rgba(245,197,24,0.1)" stroke="#f5c518" stroke-width="1.8"/>'
    + '<rect x="160" y="130" width="10" height="10" fill="none" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="190" y="155" fill="#f5c518" font-size="11" text-anchor="middle">直角三角形</text>'
    + '<text x="190" y="167" fill="#8b949e" font-size="10" text-anchor="middle">1角が90°</text>'
    // 鋭角三角形
    + '<polygon points="295,140 255,140 280,100" fill="rgba(233,69,96,0.1)" stroke="#e94560" stroke-width="1.8"/>'
    + '<text x="275" y="155" fill="#e94560" font-size="11" text-anchor="middle">鋭角三角形</text>'
    + '<text x="275" y="167" fill="#8b949e" font-size="10" text-anchor="middle">全角が90°未満</text>'
    + '</svg>',

  // 円（半径・直径・弧・弦）
  circle: '<svg viewBox="0 0 280 220" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    + '<circle cx="140" cy="110" r="80" fill="rgba(14,165,233,0.06)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<circle cx="140" cy="110" r="3" fill="#0ea5e9"/>'
    + '<text x="148" y="108" fill="#0ea5e9" font-size="12">O（中心）</text>'
    // 半径
    + '<line x1="140" y1="110" x2="220" y2="110" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="175" y="104" fill="#f5c518" font-size="12">半径r</text>'
    // 直径
    + '<line x1="60" y1="110" x2="220" y2="110" stroke="#3fb950" stroke-width="1.5" stroke-dasharray="5,3"/>'
    + '<text x="90" y="128" fill="#3fb950" font-size="12">直径d＝2r</text>'
    // 弦
    + '<line x1="80" y1="60" x2="210" y2="80" stroke="#a371f7" stroke-width="2"/>'
    + '<text x="115" y="58" fill="#a371f7" font-size="12">弦</text>'
    // 弧
    + '<path d="M 80,60 A 80,80 0 0,1 210,80" fill="none" stroke="#e94560" stroke-width="3"/>'
    + '<text x="155" y="40" fill="#e94560" font-size="12">弧</text>'
    // 円周公式
    + '<text x="140" y="205" fill="#8b949e" font-size="12" text-anchor="middle">円周 ＝ 2πr　面積 ＝ πr²</text>'
    + '</svg>',

  // 四角形の種類
  quadTypes: '<svg viewBox="0 0 340 170" style="width:100%;max-width:380px;display:block;margin:0 auto">'
    // 正方形
    + '<rect x="10" y="60" width="60" height="60" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="2"/>'
    + '<text x="40" y="148" fill="#a371f7" font-size="11" text-anchor="middle">正方形</text>'
    // 長方形
    + '<rect x="90" y="70" width="80" height="50" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<text x="130" y="148" fill="#0ea5e9" font-size="11" text-anchor="middle">長方形</text>'
    // 平行四辺形
    + '<polygon points="200,120 220,70 280,70 260,120" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="240" y="148" fill="#3fb950" font-size="11" text-anchor="middle">平行四辺形</text>'
    // ひし形
    + '<polygon points="315,70 335,95 315,120 295,95" fill="rgba(245,197,24,0.1)" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="315" y="148" fill="#f5c518" font-size="11" text-anchor="middle">ひし形</text>'
    + '</svg>',

  // 対頂角・同位角・錯角
  angles: '<svg viewBox="0 0 300 220" style="width:100%;max-width:320px;display:block;margin:0 auto">'
    // 2直線が交わる点（対頂角）
    + '<line x1="20" y1="20" x2="180" y2="160" stroke="#8b949e" stroke-width="2"/>'
    + '<line x1="180" y1="20" x2="20" y2="160" stroke="#8b949e" stroke-width="2"/>'
    + '<text x="88" y="15" fill="#f5c518" font-size="12">∠a</text>'
    + '<text x="88" y="175" fill="#f5c518" font-size="12">∠a（対頂角）</text>'
    + '<text x="15" y="95" fill="#0ea5e9" font-size="12">∠b</text>'
    + '<text x="155" y="95" fill="#0ea5e9" font-size="12">∠b</text>'
    + '<text x="50" y="195" fill="#8b949e" font-size="11">対頂角は等しい</text>'
    // 平行線と横断線（同位角・錯角）
    + '<line x1="200" y1="50" x2="290" y2="50" stroke="#3fb950" stroke-width="2"/>'
    + '<line x1="200" y1="130" x2="290" y2="130" stroke="#3fb950" stroke-width="2"/>'
    + '<line x1="225" y1="20" x2="265" y2="160" stroke="#e94560" stroke-width="2"/>'
    + '<text x="248" y="44" fill="#f5c518" font-size="11">∠c</text>'
    + '<text x="232" y="125" fill="#f5c518" font-size="11">∠c</text>'
    + '<text x="216" y="44" fill="#a371f7" font-size="11">∠d</text>'
    + '<text x="250" y="125" fill="#a371f7" font-size="11">∠d</text>'
    + '<text x="205" y="175" fill="#3fb950" font-size="10">同位角=等 / 錯角=等</text>'
    + '</svg>',
};

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん、図形って何が難しいの？三角形とか見たらわかるじゃない？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">「見てわかる」と「計算できる」は違う。図形は「定義」と「性質」のセットで覚えるのがコツだ。三角形の内角の和が180°になるのはなぜか——そのルールを使って角度を求めたり、面積を求めたりする。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">内角の和って絶対180°なの？なんで？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">どんな三角形でもね。これは証明できるんだけど、まず「そういうルールがある」と覚えて使いこなすのが先。性質の一覧をしっかり頭に入れれば、あとは当てはめるだけだ。</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">📐 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：図形の基本（点・直線・角、三角形・四角形・円）<br>'
    + 'Section 2：角度の性質（対頂角・同位角・錯角・内角の和）<br>'
    + 'Section 3：面積と体積（公式を使いこなす）'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">📐 Section 1 から始める →</button>';
}

// ===== SECTION 1: 図形の基本 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">三角形ってどのくらい種類があるの？「三角形」ってひとことで言ってもいろいろあるよね？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">「辺の長さ」で3種類：正三角形・二等辺三角形・不等辺三角形。「角度」でも3種類：鋭角三角形・直角三角形・鈍角三角形。これを組み合わせて考えることもある。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">円って半径と直径以外にも名前あるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">弧（弧の部分）と弦（円上の2点を結ぶ直線）がある。弧は曲線で弦は直線——このセットで覚えよう。</div></div></div>'
    + '</div>';

  // 基本用語のルールカード
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 直線・線分・半直線の違い</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">'
    + '<svg viewBox="0 0 320 130" style="width:100%;max-width:360px;display:block;margin:0 auto">'
    // 直線
    + '<line x1="10" y1="30" x2="310" y2="30" stroke="#0ea5e9" stroke-width="2"/>'
    + '<text x="5" y="22" fill="#0ea5e9" font-size="12">←</text>'
    + '<text x="300" y="22" fill="#0ea5e9" font-size="12">→</text>'
    + '<text x="160" y="48" fill="#0ea5e9" font-size="12" text-anchor="middle">直線 AB（両方向に無限に伸びる）</text>'
    + '<circle cx="90" cy="30" r="4" fill="#0ea5e9"/><text x="90" y="26" fill="#0ea5e9" font-size="11" text-anchor="middle">A</text>'
    + '<circle cx="220" cy="30" r="4" fill="#0ea5e9"/><text x="220" y="26" fill="#0ea5e9" font-size="11" text-anchor="middle">B</text>'
    // 線分
    + '<line x1="50" y1="75" x2="270" y2="75" stroke="#3fb950" stroke-width="2"/>'
    + '<circle cx="50" cy="75" r="4" fill="#3fb950"/><text x="50" y="70" fill="#3fb950" font-size="11" text-anchor="middle">A</text>'
    + '<circle cx="270" cy="75" r="4" fill="#3fb950"/><text x="270" y="70" fill="#3fb950" font-size="11" text-anchor="middle">B</text>'
    + '<text x="160" y="93" fill="#3fb950" font-size="12" text-anchor="middle">線分 AB（両端A・Bが決まっている）</text>'
    // 半直線
    + '<line x1="80" y1="115" x2="310" y2="115" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="300" y="107" fill="#f5c518" font-size="12">→</text>'
    + '<circle cx="80" cy="115" r="4" fill="#f5c518"/><text x="80" y="110" fill="#f5c518" font-size="11" text-anchor="middle">A</text>'
    + '<text x="190" y="128" fill="#f5c518" font-size="12" text-anchor="middle">半直線 AB（Aから一方向に無限）</text>'
    + '</svg></div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">交点・垂直・平行</div>'
    + '<div class="ex">交点：2つの直線が交わる点</div>'
    + '<div class="ex">垂直（⊥）：2直線が直角（90°）で交わる</div>'
    + '<div class="ex">平行（∥）：2直線が交わらない（どこまで延ばしても）</div>'
    + '</div>'
    + '</div>';

  // 三角形
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 三角形の種類と内角の和</div>'
    + SVG.triangleTypes
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">内角の和（最重要）</div>'
    + SVG.triangle
    + '<div class="ex" style="margin-top:8px">三角形の3つの内角の和 = <strong style="color:var(--gold)">180°</strong></div>'
    + '<div class="note">💡 どんな三角形でも内角の和は必ず180°！これは入試で毎回使う</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">三角形の辺と角の関係</div>'
    + '<div class="ex">正三角形：3辺が等しい → 3つの角もすべて60°</div>'
    + '<div class="ex">二等辺三角形：2辺が等しい → 底角（等しい2辺に挟まれた2つの角）が等しい</div>'
    + '<div class="note">⚠️ 二等辺三角形の底角は等しい！これも入試頻出</div>'
    + '</div>'
    + '</div>';

  // 四角形
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 四角形の種類と性質</div>'
    + SVG.quadTypes
    + '<div style="overflow-x:auto;margin-top:14px">'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    + '<tr style="background:var(--bg3);color:var(--purple)">'
    + '<td style="padding:8px 10px;font-weight:bold">名前</td>'
    + '<td style="padding:8px 10px;font-weight:bold">辺</td>'
    + '<td style="padding:8px 10px;font-weight:bold">角</td>'
    + '<td style="padding:8px 10px;font-weight:bold">対角線</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 10px;color:var(--gold);font-weight:bold">正方形</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">4辺が等しい</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">4角が90°</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">等しく垂直に交わる</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 10px;color:var(--teal);font-weight:bold">長方形</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">向かい合う辺が等しい</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">4角が90°</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">長さが等しい</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 10px;color:var(--green);font-weight:bold">平行四辺形</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">2組の向かい辺が平行</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">向かい合う角が等しい</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">中点で交わる</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="padding:8px 10px;color:var(--gold);font-weight:bold">ひし形</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">4辺が等しい</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">向かい合う角が等しい</td>'
    + '<td style="padding:8px 10px;color:var(--text2)">垂直に交わる</td>'
    + '</tr>'
    + '</table></div>'
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">四角形の内角の和</div>'
    + '<div class="ex">四角形の内角の和 = <strong style="color:var(--gold)">360°</strong></div>'
    + '<div class="note">💡 三角形2つ分（180°×2）。対角線で2つの三角形に分けて考える！</div>'
    + '</div>'
    + '</div>';

  // 円
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 円の用語と公式</div>'
    + SVG.circle
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">円の公式（必須暗記）</div>'
    + '<div class="ex">円周 ＝ 2πr　または　πd （r：半径、d：直径）</div>'
    + '<div class="ex">面積 ＝ πr²</div>'
    + '<div class="note">💡 πは「円周率」≈ 3.14159…。問題では「π」のまま使うことが多い</div>'
    + '</div>'
    + '</div>';

  // 練習問題
  var qs = [
    {
      q: '三角形の3つの内角の和は何度？',
      sub: 'どんな三角形でも成り立つ基本ルール',
      a: '180°',
      choices: ['90°', '180°', '270°', '360°'],
      jp: '三角形の内角の和',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>三角形の内角の和 = 180°（必ず！）</span><span class="exp-ok">✅ 正三角形も直角三角形も鈍角三角形も、内角の和は180°</span><span class="exp-tip">💡 「三角形 → 180°」は図形問題のすべての出発点！絶対覚えよう</span>'
    },
    {
      q: '四角形の内角の和は何度？',
      sub: '対角線で三角形に分けて考えよう',
      a: '360°',
      choices: ['180°', '270°', '360°', '720°'],
      jp: '四角形の内角の和',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>四角形の内角の和 = 360°（三角形2つ分 = 180°×2）</span><span class="exp-ok">✅ 正方形の4角はすべて90°→90°×4=360°で確認できる</span><span class="exp-tip">💡 対角線を1本引くと2つの三角形に分かれる。180°×2=360°！</span>'
    },
    {
      q: '二等辺三角形の「底角」とはどれのこと？',
      sub: '等しい2辺（腰）がどこにあるか考えよう',
      a: '等しい2辺の両端にある2つの角',
      choices: ['等しい2辺の両端にある2つの角', '頂点（2辺が集まる点）にある角', '最も大きな角', 'すべての角'],
      jp: '二等辺三角形の底角',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>底角 = 等しい2辺（腰）の両端にある角。この2つは必ず等しい</span><span class="exp-ok">✅ 二等辺三角形：底角が2つ等しい → 底辺の両端の角</span><span class="exp-ng">❌ 頂角（2辺が集まる特別な角）と底角は別物！</span><span class="exp-tip">💡 二等辺三角形の底角が等しいことは、図形問題の証明でよく使われる！</span>'
    },
    {
      q: '正三角形の1つの角の大きさは何度？',
      sub: '正三角形は3辺が等しく、3つの角もすべて等しい',
      a: '60°',
      choices: ['45°', '60°', '90°', '120°'],
      jp: '正三角形の1角の大きさ',
      exp: '<span class="exp-rule"><span class="label">📐 計算</span>内角の和180° ÷ 3 = 60°</span><span class="exp-ok">✅ 3角が等しく、和が180°だから1角 = 60°</span><span class="exp-tip">💡 正三角形の角は全部60°！これは暗記しておこう</span>'
    },
    {
      q: '円で、円上の2点を結んだ直線（曲線ではなく）を何という？',
      sub: '円の内部を通る直線の名称',
      a: '弦（げん）',
      choices: ['弦（げん）', '弧（こ）', '直径', '半径'],
      jp: '弦の定義',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>弦 = 円上の2点を結ぶ直線（線分）</span><span class="exp-ok">✅ 弦は直線。弧は曲線（円周の一部）</span><span class="exp-ng">❌ 弧は「円周の一部」で曲線。弦と弧は全然違う！</span><span class="exp-tip">💡 直径は「中心を通る弦」。最も長い弦が直径！</span>'
    },
    {
      q: '半径5cmの円の円周はいくつ？（πを使った式で）',
      sub: '円周 ＝ 2πr',
      a: '10π cm',
      choices: ['5π cm', '10π cm', '25π cm', '50π cm'],
      jp: '半径5cmの円の円周',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>円周 ＝ 2πr = 2 × π × 5 = 10π cm</span><span class="exp-ok">✅ r = 5 → 2×π×5 = 10π</span><span class="exp-ng">❌ 面積の公式（πr²）と混同しないこと！</span><span class="exp-tip">💡 円周は「2πr」、面積は「πr²」。2倍か2乗かで使い分け！</span>'
    },
    {
      q: '平行四辺形の向かい合う角の性質は？',
      sub: '平行四辺形の向かいに位置する角',
      a: '向かい合う角は等しい',
      choices: ['向かい合う角は等しい', '向かい合う角の和が180°', '向かい合う角はすべて90°', '向かい合う角は補角'],
      jp: '平行四辺形の対角の性質',
      exp: '<span class="exp-rule"><span class="label">📐 性質</span>平行四辺形：向かい合う角（対角）は等しい</span><span class="exp-ok">✅ ∠A = ∠C、∠B = ∠D（向かい合う角同士は等しい）</span><span class="exp-ng">❌ 「隣り合う角の和が180°」は正しいが「向かい合う角」ではない</span><span class="exp-tip">💡 平行四辺形の性質：①向かい辺が平行で等しい ②向かい角が等しい ③対角線が中点で交わる</span>'
    },
    {
      q: '直角三角形とはどんな三角形？',
      sub: '角度の観点で定義する',
      a: '1つの角が90°の三角形',
      choices: ['1つの角が90°の三角形', 'すべての角が90°の三角形', '2辺が等しい三角形', '最も長い辺が直角の三角形'],
      jp: '直角三角形の定義',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>直角三角形 = 1つの角が90°（直角）の三角形</span><span class="exp-ok">✅ 90°の角が1つ → 残り2角の和が90°（鋭角）</span><span class="exp-tip">💡 直角三角形は「ピタゴラスの定理」でも使う。直角を挟む2辺を「直角を挟む辺」という</span>'
    },
    {
      q: 'ひし形の対角線の交わり方は？',
      sub: 'ひし形の対角線には特別な性質がある',
      a: '垂直に交わる（90°）',
      choices: ['垂直に交わる（90°）', '平行になる', '等しい長さで交わる', '中点では交わらない'],
      jp: 'ひし形の対角線の性質',
      exp: '<span class="exp-rule"><span class="label">📐 性質</span>ひし形の対角線は垂直に交わる（かつ、互いを2等分する）</span><span class="exp-ok">✅ ひし形の対角線は直角（90°）で交わる</span><span class="exp-ng">❌ 長方形の対角線は等しいが垂直に交わらない</span><span class="exp-tip">💡 正方形は「長方形かつひし形」→ 対角線は等しく・垂直に交わる！</span>'
    },
    {
      q: '半径3cmの円の面積は？（πを使った式で）',
      sub: '面積 ＝ πr²',
      a: '9π cm²',
      choices: ['3π cm²', '6π cm²', '9π cm²', '12π cm²'],
      jp: '半径3cmの円の面積',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>面積 ＝ πr² = π × 3² = 9π cm²</span><span class="exp-ok">✅ r = 3 → π×3² = 9π</span><span class="exp-ng">❌ 円周（2πr = 6π）と混同しないこと！</span><span class="exp-tip">💡 「面積はr²（二乗）」「円周は2r（一乗）」で区別しよう！</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'math_geo_s1_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 図形の基本</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:4, jp:q.q, choices:q.choices};
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 4)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 2: 角度の性質 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">対頂角って何？なんか難しそうな名前だけど…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">2本の直線が交わると、向かい合った角（対頂角）ができる。これは必ず等しい。平行な2直線に横断線が通ると、同位角（同じ位置にある角）と錯角（互い違いの角）ができて、これも等しくなる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">つまり「等しい」系のルールが3つ——対頂角・同位角・錯角ってこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。この3つを使えば角度の計算問題はだいたい解ける。</div></div></div>'
    + '</div>';

  var svgTaicho = '<svg viewBox="0 0 200 185" style="width:100%;max-width:220px;display:block;margin:0 auto">'
    + '<line x1="20" y1="20" x2="180" y2="160" stroke="#8b949e" stroke-width="2"/>'
    + '<line x1="180" y1="20" x2="20" y2="160" stroke="#8b949e" stroke-width="2"/>'
    + '<circle cx="100" cy="90" r="3" fill="#8b949e"/>'
    + '<text x="100" y="22" fill="#f5c518" font-size="14" text-anchor="middle">∠a</text>'
    + '<text x="100" y="172" fill="#f5c518" font-size="14" text-anchor="middle">∠a（対頂角）</text>'
    + '<text x="22" y="94" fill="#0ea5e9" font-size="14" text-anchor="middle">∠b</text>'
    + '<text x="176" y="94" fill="#0ea5e9" font-size="14" text-anchor="middle">∠b</text>'
    + '<text x="100" y="185" fill="#8b949e" font-size="11" text-anchor="middle">対頂角は等しい</text>'
    + '</svg>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 対頂角（たいちょうかく）</div>'
    + svgTaicho
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">対頂角のルール</div>'
    + '<div class="ex">2直線が1点で交わるとき、<strong style="color:var(--gold)">向かい合う角</strong>を対頂角という</div>'
    + '<div class="ex">対頂角は必ず<strong style="color:var(--gold)">等しい</strong></div>'
    + '<div class="note">💡 「向かい合う角」を見つけたら「等しい！」と即反応しよう</div>'
    + '</div>'
    + '</div>';

  var svgDoui = '<svg viewBox="0 0 260 200" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    + '<line x1="20" y1="65" x2="240" y2="65" stroke="#3fb950" stroke-width="2"/>'
    + '<line x1="20" y1="145" x2="240" y2="145" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="6" y="63" fill="#3fb950" font-size="11">∥</text>'
    + '<text x="6" y="143" fill="#3fb950" font-size="11">∥</text>'
    + '<line x1="80" y1="20" x2="160" y2="185" stroke="#e94560" stroke-width="2"/>'
    + '<circle cx="104" cy="65" r="3" fill="#8b949e"/>'
    + '<circle cx="130" cy="145" r="3" fill="#8b949e"/>'
    + '<text x="118" y="58" fill="#f5c518" font-size="13">∠c</text>'
    + '<text x="144" y="138" fill="#f5c518" font-size="13">∠c</text>'
    + '<text x="78" y="84" fill="#a371f7" font-size="13">∠d</text>'
    + '<text x="144" y="162" fill="#a371f7" font-size="13">∠d</text>'
    + '<text x="130" y="194" fill="#8b949e" font-size="11" text-anchor="middle">黄=同位角　紫=錯角　どちらも等しい</text>'
    + '</svg>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 同位角・錯角（平行線のルール）</div>'
    + svgDoui
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title" style="color:var(--gold)">同位角（どういかく）</div>'
    + '<div class="ex">平行な2直線に横断線が交わるとき、<strong style="color:var(--gold)">同じ位置にある角</strong></div>'
    + '<div class="ex">同位角は<strong style="color:var(--gold)">等しい</strong></div>'
    + '</div>'
    + '<div class="rule-box" style="margin-top:8px">'
    + '<div class="rule-title" style="color:var(--purple)">錯角（さっかく）</div>'
    + '<div class="ex">平行な2直線の<strong style="color:var(--purple)">内側で互い違いの位置にある角</strong></div>'
    + '<div class="ex">錯角も<strong style="color:var(--purple)">等しい</strong></div>'
    + '<div class="note">💡 「∥（平行）があったら同位角・錯角を探せ！」が角度問題の鉄則</div>'
    + '</div>'
    + '</div>';

  var svgNagon = '<svg viewBox="0 0 300 165" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<polygon points="40,130 15,130 27,100" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="27" y="147" fill="#a371f7" font-size="11" text-anchor="middle">三角形</text>'
    + '<text x="27" y="160" fill="#8b949e" font-size="10" text-anchor="middle">180°×1</text>'
    + '<polygon points="110,130 70,130 70,95 110,95" fill="rgba(14,165,233,0.08)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<line x1="70" y1="130" x2="110" y2="95" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="4,2"/>'
    + '<text x="90" y="147" fill="#0ea5e9" font-size="11" text-anchor="middle">四角形</text>'
    + '<text x="90" y="160" fill="#8b949e" font-size="10" text-anchor="middle">180°×2</text>'
    + '<polygon points="180,95 155,115 162,130 197,130 205,115" fill="rgba(63,185,80,0.08)" stroke="#3fb950" stroke-width="1.5"/>'
    + '<line x1="180" y1="95" x2="162" y2="130" stroke="#3fb950" stroke-width="1" stroke-dasharray="3,2"/>'
    + '<line x1="180" y1="95" x2="197" y2="130" stroke="#3fb950" stroke-width="1" stroke-dasharray="3,2"/>'
    + '<text x="180" y="147" fill="#3fb950" font-size="11" text-anchor="middle">五角形</text>'
    + '<text x="180" y="160" fill="#8b949e" font-size="10" text-anchor="middle">180°×3</text>'
    + '<polygon points="258,95 240,110 245,130 275,130 280,110" fill="rgba(245,197,24,0.08)" stroke="#f5c518" stroke-width="1.5"/>'
    + '<line x1="258" y1="95" x2="245" y2="130" stroke="#f5c518" stroke-width="1" stroke-dasharray="3,2"/>'
    + '<line x1="258" y1="95" x2="275" y2="130" stroke="#f5c518" stroke-width="1" stroke-dasharray="3,2"/>'
    + '<line x1="258" y1="95" x2="280" y2="110" stroke="#f5c518" stroke-width="1" stroke-dasharray="3,2"/>'
    + '<text x="260" y="147" fill="#f5c518" font-size="11" text-anchor="middle">六角形</text>'
    + '<text x="260" y="160" fill="#8b949e" font-size="10" text-anchor="middle">180°×4</text>'
    + '</svg>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 多角形の内角の和・外角</div>'
    + svgNagon
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">内角の和の公式（必須暗記！）</div>'
    + '<div class="ex">n角形の内角の和 = <strong style="color:var(--gold)">180° × (n − 2)</strong></div>'
    + '<div class="ex">三角形(n=3)：180°×1 = <strong>180°</strong></div>'
    + '<div class="ex">四角形(n=4)：180°×2 = <strong>360°</strong></div>'
    + '<div class="ex">五角形(n=5)：180°×3 = <strong>540°</strong></div>'
    + '<div class="ex">六角形(n=6)：180°×4 = <strong>720°</strong></div>'
    + '<div class="note">💡 「n角形 → (n−2)個の三角形に分割できる」と考えよう！</div>'
    + '</div>'
    + '<div class="rule-box" style="margin-top:8px">'
    + '<div class="rule-title">外角のルール</div>'
    + '<div class="ex">三角形の<strong style="color:var(--gold)">外角 = 隣り合わない2つの内角の和</strong></div>'
    + '<div class="ex">どんな多角形でも<strong style="color:var(--gold)">外角の和 = 360°</strong></div>'
    + '<div class="note">💡 外角の和は常に360°！n角形でも変わらない！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    {
      q: '対頂角とはどのような角？',
      sub: '2直線が1点で交わるときにできる',
      a: '向かい合う角（必ず等しい）',
      choices: ['向かい合う角（必ず等しい）', '隣り合う角（和が180°）', '平行線の同じ側にある角', '直角（90°）'],
      jp: '対頂角の定義',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>対頂角 = 2直線が交わるとき向かい合う角。必ず等しい</span><span class="exp-ok">✅ 対頂角は等しい（∠a = ∠a）</span><span class="exp-ng">❌ 隣り合う角の和が180°は「補角」で対頂角ではない</span><span class="exp-tip">💡 「向かい合う」→「等しい」を即反応！</span>'
    },
    {
      q: '平行な2直線に横断線が交わるとき、「同位角」の性質は？',
      sub: 'まず∥マークを探して平行を確認しよう',
      a: '等しい',
      choices: ['等しい', '和が180°', '和が90°', '差が45°'],
      jp: '同位角の性質',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>平行線では同位角（同じ位置にある角）は等しい</span><span class="exp-ok">✅ ∥があれば同位角 = 等しい</span><span class="exp-tip">💡 同位角・錯角は「平行線があれば等しい」がセット！</span>'
    },
    {
      q: '平行な2直線に横断線が交わるとき、「錯角」の性質は？',
      sub: '錯角 = 内側で互い違いの位置',
      a: '等しい',
      choices: ['等しい', '和が180°', '和が360°', '差が90°'],
      jp: '錯角の性質',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>平行線では錯角（内側の互い違いの角）も等しい</span><span class="exp-ok">✅ ∥があれば錯角 = 等しい</span><span class="exp-tip">💡 同位角と錯角はどちらも「∥があれば等しい」！</span>'
    },
    {
      q: '三角形の2つの角が45°と75°のとき、残りの角は何度？',
      sub: '三角形の内角の和は180°',
      a: '60°',
      choices: ['50°', '55°', '60°', '65°'],
      jp: '三角形の角度計算（45°+75°）',
      exp: '<span class="exp-rule"><span class="label">📐 計算</span>180° − 45° − 75° = 60°</span><span class="exp-ok">✅ 内角の和180°から2つを引く</span><span class="exp-tip">💡 「3角目 = 180° − (角1) − (角2)」が公式！</span>'
    },
    {
      q: '三角形の外角の大きさは？',
      sub: '1辺を延長してできる角を外角という',
      a: '隣り合わない2内角の和',
      choices: ['隣り合わない2内角の和', '隣り合う内角との差', '常に90°', '内角の和の半分'],
      jp: '三角形の外角',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>三角形の外角 = 隣り合わない2つの内角の和</span><span class="exp-ok">✅ 外角∠d = ∠a + ∠b（離れた2角の合計）</span><span class="exp-tip">💡 「外角は離れた2角の合計」——証明問題にも頻出！</span>'
    },
    {
      q: '五角形の内角の和は何度？',
      sub: '公式：n角形の内角の和 = 180°×(n−2)',
      a: '540°',
      choices: ['360°', '450°', '540°', '720°'],
      jp: '五角形の内角の和',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>n=5 → 180°×(5−2) = 180°×3 = 540°</span><span class="exp-ok">✅ 五角形は三角形3つ分 → 180°×3 = 540°</span><span class="exp-tip">💡 「n角形 → (n−2)個の三角形」！</span>'
    },
    {
      q: '六角形の内角の和は何度？',
      sub: '公式：n角形の内角の和 = 180°×(n−2)',
      a: '720°',
      choices: ['540°', '720°', '900°', '1080°'],
      jp: '六角形の内角の和',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>n=6 → 180°×(6−2) = 180°×4 = 720°</span><span class="exp-ok">✅ 六角形 = 三角形4つ分 → 180°×4 = 720°</span><span class="exp-tip">💡 「180×(n−2)」を暗記！数えなくて済む！</span>'
    },
    {
      q: '正六角形の1つの内角の大きさは？',
      sub: '正n角形：全角が等しい。内角の和÷n',
      a: '120°',
      choices: ['90°', '108°', '120°', '135°'],
      jp: '正六角形の1角',
      exp: '<span class="exp-rule"><span class="label">📐 計算</span>内角の和720° ÷ 6 = 120°</span><span class="exp-ok">✅ 720° ÷ 6 = 120°</span><span class="exp-tip">💡 正n角形の1角 = 180°×(n−2)÷n</span>'
    },
    {
      q: '四角形の4つの内角のうち3つが80°・95°・110°のとき、残りの角は？',
      sub: '四角形の内角の和は360°',
      a: '75°',
      choices: ['70°', '75°', '80°', '85°'],
      jp: '四角形の角度計算（3角既知）',
      exp: '<span class="exp-rule"><span class="label">📐 計算</span>360° − 80° − 95° − 110° = 75°</span><span class="exp-ok">✅ 四角形の和360°から3つ引く</span><span class="exp-tip">💡 「4角の和 = 360°」。3つわかれば引くだけ！</span>'
    },
    {
      q: 'どんな多角形でも外角の和は何度？',
      sub: '三角形でも、十角形でも同じ答え',
      a: '360°',
      choices: ['180°', '270°', '360°', 'n×180°'],
      jp: '多角形の外角の和',
      exp: '<span class="exp-rule"><span class="label">📐 定理</span>どんな多角形でも外角の和 = 360°（常に！）</span><span class="exp-ok">✅ 三角形でも百角形でも外角の和は360°</span><span class="exp-tip">💡 外角の和は絶対360°——これは必須暗記！</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'math_geo_s2_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 角度の性質と計算</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:4, jp:q.q, choices:q.choices};
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 4)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 3: 面積と体積 =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">面積って公式がいっぱいあって混乱する！三角形と平行四辺形がもうわからない！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">全部「底辺×高さ」の変形なんだよ。三角形は÷2、台形は(上底+下底)の平均×高さ、ひし形は対角線を使う。構造がわかれば覚えやすい。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">全部「底辺×高さ」のバリエーションか！それなら覚えられる気がする！</div></div></div>'
    + '</div>';

  var svgTri = '<svg viewBox="0 0 280 155" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    + '<polygon points="80,125 220,125 135,30" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="2"/>'
    + '<line x1="135" y1="30" x2="135" y2="125" stroke="#f5c518" stroke-width="1.5" stroke-dasharray="5,3"/>'
    + '<rect x="135" y="115" width="10" height="10" fill="none" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="155" y="82" fill="#f5c518" font-size="13">高さ h</text>'
    + '<text x="150" y="145" fill="#a371f7" font-size="13">底辺 b</text>'
    + '<text x="140" y="155" fill="#f5c518" font-size="13" text-anchor="middle">S = b × h ÷ 2</text>'
    + '</svg>';

  var svgPara = '<svg viewBox="0 0 280 155" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    + '<polygon points="55,125 195,125 240,35 100,35" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<line x1="195" y1="35" x2="195" y2="125" stroke="#f5c518" stroke-width="1.5" stroke-dasharray="5,3"/>'
    + '<rect x="195" y="115" width="10" height="10" fill="none" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="213" y="84" fill="#f5c518" font-size="13">高さ h</text>'
    + '<text x="125" y="145" fill="#0ea5e9" font-size="13" text-anchor="middle">底辺 b</text>'
    + '<text x="140" y="155" fill="#f5c518" font-size="13" text-anchor="middle">S = b × h</text>'
    + '</svg>';

  var svgTrap = '<svg viewBox="0 0 280 155" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    + '<polygon points="75,125 225,125 195,35 105,35" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="2"/>'
    + '<line x1="195" y1="35" x2="195" y2="125" stroke="#f5c518" stroke-width="1.5" stroke-dasharray="5,3"/>'
    + '<rect x="185" y="115" width="10" height="10" fill="none" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="210" y="84" fill="#f5c518" font-size="12">h</text>'
    + '<text x="150" y="28" fill="#3fb950" font-size="12" text-anchor="middle">上底 a</text>'
    + '<text x="150" y="145" fill="#3fb950" font-size="12" text-anchor="middle">下底 b</text>'
    + '<text x="140" y="155" fill="#f5c518" font-size="12" text-anchor="middle">S = (a＋b) × h ÷ 2</text>'
    + '</svg>';

  var svgRhom = '<svg viewBox="0 0 280 155" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    + '<polygon points="140,15 220,85 140,135 60,85" fill="rgba(245,197,24,0.1)" stroke="#f5c518" stroke-width="2"/>'
    + '<line x1="60" y1="85" x2="220" y2="85" stroke="#e94560" stroke-width="2" stroke-dasharray="5,3"/>'
    + '<line x1="140" y1="15" x2="140" y2="135" stroke="#a371f7" stroke-width="2" stroke-dasharray="5,3"/>'
    + '<circle cx="140" cy="85" r="3" fill="#8b949e"/>'
    + '<text x="155" y="82" fill="#e94560" font-size="12">対角線 d₁</text>'
    + '<text x="145" y="50" fill="#a371f7" font-size="12">d₂</text>'
    + '<text x="140" y="152" fill="#f5c518" font-size="12" text-anchor="middle">S = d₁ × d₂ ÷ 2</text>'
    + '</svg>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 面積公式まとめ</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
    + '<div style="background:var(--bg3);border:1px solid rgba(163,113,247,0.3);border-radius:10px;padding:12px">'
    + '<div style="font-size:12px;color:var(--purple);font-weight:bold;margin-bottom:6px">三角形</div>'
    + svgTri + '</div>'
    + '<div style="background:var(--bg3);border:1px solid rgba(14,165,233,0.3);border-radius:10px;padding:12px">'
    + '<div style="font-size:12px;color:var(--teal);font-weight:bold;margin-bottom:6px">平行四辺形</div>'
    + svgPara + '</div>'
    + '<div style="background:var(--bg3);border:1px solid rgba(63,185,80,0.3);border-radius:10px;padding:12px">'
    + '<div style="font-size:12px;color:var(--green);font-weight:bold;margin-bottom:6px">台形</div>'
    + svgTrap + '</div>'
    + '<div style="background:var(--bg3);border:1px solid rgba(245,197,24,0.3);border-radius:10px;padding:12px">'
    + '<div style="font-size:12px;color:var(--gold);font-weight:bold;margin-bottom:6px">ひし形</div>'
    + svgRhom + '</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">公式一覧（暗記必須）</div>'
    + '<div class="ex">三角形：<strong style="color:var(--purple)">底辺 × 高さ ÷ 2</strong></div>'
    + '<div class="ex">平行四辺形：<strong style="color:var(--teal)">底辺 × 高さ</strong></div>'
    + '<div class="ex">台形：<strong style="color:var(--green)">(上底 ＋ 下底) × 高さ ÷ 2</strong></div>'
    + '<div class="ex">ひし形：<strong style="color:var(--gold)">対角線₁ × 対角線₂ ÷ 2</strong></div>'
    + '<div class="note">💡 三角形・台形・ひし形は ÷2！平行四辺形だけ÷2しない！</div>'
    + '</div>'
    + '</div>';

  var svgSector = '<svg viewBox="0 0 200 185" style="width:100%;max-width:220px;display:block;margin:0 auto">'
    + '<circle cx="100" cy="100" r="70" fill="rgba(14,165,233,0.04)" stroke="#8b949e" stroke-width="1" stroke-dasharray="5,3"/>'
    + '<path d="M100,100 L100,30 A70,70 0 0,1 160,135 Z" fill="rgba(14,165,233,0.18)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<circle cx="100" cy="100" r="3" fill="#0ea5e9"/>'
    + '<line x1="100" y1="100" x2="100" y2="30" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="114" y="68" fill="#f5c518" font-size="13">r</text>'
    + '<path d="M100,75 A25,25 0 0,1 121,113" fill="none" stroke="#a371f7" stroke-width="2"/>'
    + '<text x="124" y="98" fill="#a371f7" font-size="12">∠a°</text>'
    + '<text x="100" y="180" fill="#8b949e" font-size="11" text-anchor="middle">面積 = πr² × a ÷ 360</text>'
    + '</svg>';

  var svgCyl = '<svg viewBox="0 0 160 185" style="width:100%;max-width:180px;display:block;margin:0 auto">'
    + '<rect x="30" y="50" width="100" height="100" fill="rgba(14,165,233,0.08)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<ellipse cx="80" cy="50" rx="50" ry="12" fill="rgba(14,165,233,0.15)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<ellipse cx="80" cy="150" rx="50" ry="12" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<line x1="135" y1="50" x2="155" y2="50" stroke="#f5c518" stroke-width="1.5"/>'
    + '<line x1="135" y1="150" x2="155" y2="150" stroke="#f5c518" stroke-width="1.5"/>'
    + '<line x1="145" y1="50" x2="145" y2="150" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="152" y="105" fill="#f5c518" font-size="13">h</text>'
    + '<text x="80" y="43" fill="#a371f7" font-size="12" text-anchor="middle">r</text>'
    + '<text x="80" y="180" fill="#8b949e" font-size="11" text-anchor="middle">V = πr²h</text>'
    + '</svg>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 円・扇形の面積</div>'
    + '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:4px">'
    + '<div style="flex:1;min-width:160px">' + svgSector + '</div>'
    + '<div style="flex:2;min-width:180px">'
    + '<div class="rule-box"><div class="rule-title">円の面積・円周</div>'
    + '<div class="ex">面積 = <strong style="color:var(--gold)">πr²</strong></div>'
    + '<div class="ex">円周 = <strong style="color:var(--gold)">2πr</strong></div></div>'
    + '<div class="rule-box" style="margin-top:8px"><div class="rule-title">扇形（中心角a°）</div>'
    + '<div class="ex">面積 = πr² × <strong style="color:var(--purple)">a ÷ 360</strong></div>'
    + '<div class="ex">弧の長さ = 2πr × <strong style="color:var(--purple)">a ÷ 360</strong></div>'
    + '<div class="note">💡 扇形は円全体の「a/360の割合」分！</div></div>'
    + '</div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 立体の体積</div>'
    + '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">'
    + '<div style="flex:1;min-width:140px">' + svgCyl + '</div>'
    + '<div style="flex:2;min-width:180px">'
    + '<div class="rule-box"><div class="rule-title">柱体の体積</div>'
    + '<div class="ex">直方体：<strong style="color:var(--gold)">縦 × 横 × 高さ</strong></div>'
    + '<div class="ex">円柱：<strong style="color:var(--gold)">πr² × h</strong></div>'
    + '<div class="note">💡 「底面積 × 高さ」が柱体の共通公式！</div></div>'
    + '<div class="rule-box" style="margin-top:8px"><div class="rule-title">錐体（コーン型）</div>'
    + '<div class="ex">三角錐・円錐：<strong style="color:var(--purple)">底面積 × 高さ ÷ 3</strong></div>'
    + '<div class="note">💡 錐体は柱体の1/3！必ず÷3！</div></div>'
    + '</div></div>'
    + '</div>';

  var qs = [
    {
      q: '底辺8cm・高さ5cmの三角形の面積は？',
      sub: '三角形の面積 = 底辺 × 高さ ÷ 2',
      a: '20 cm²',
      choices: ['16 cm²', '20 cm²', '40 cm²', '10 cm²'],
      jp: '三角形の面積（底辺8・高さ5）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>8 × 5 ÷ 2 = 20 cm²</span><span class="exp-ok">✅ 8 × 5 = 40、÷2 = 20</span><span class="exp-ng">❌ ÷2を忘れずに！三角形は平行四辺形の半分</span><span class="exp-tip">💡 「三角形はいつも÷2」を体に染み込ませよう！</span>'
    },
    {
      q: '底辺12cm・高さ7cmの平行四辺形の面積は？',
      sub: '平行四辺形の面積 = 底辺 × 高さ',
      a: '84 cm²',
      choices: ['42 cm²', '70 cm²', '84 cm²', '168 cm²'],
      jp: '平行四辺形の面積（底辺12・高さ7）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>12 × 7 = 84 cm²（÷2しない！）</span><span class="exp-ok">✅ 平行四辺形は÷2しない！</span><span class="exp-ng">❌ 三角形と混同して÷2してしまうミスが多い</span><span class="exp-tip">💡 平行四辺形 → 長方形に変形できる → 底辺 × 高さそのまま！</span>'
    },
    {
      q: '上底4cm・下底10cm・高さ6cmの台形の面積は？',
      sub: '台形の面積 = (上底 + 下底) × 高さ ÷ 2',
      a: '42 cm²',
      choices: ['42 cm²', '84 cm²', '60 cm²', '24 cm²'],
      jp: '台形の面積（上底4・下底10・高さ6）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>(4 + 10) × 6 ÷ 2 = 14 × 6 ÷ 2 = 42 cm²</span><span class="exp-ok">✅ (上底+下底) = 14、×高さ6 = 84、÷2 = 42</span><span class="exp-ng">❌ ÷2を忘れない！台形も÷2が必要</span><span class="exp-tip">💡 「台形は(上+下)の平均×高さ」と覚えると忘れない！</span>'
    },
    {
      q: '対角線が6cmと8cmのひし形の面積は？',
      sub: 'ひし形の面積 = 対角線₁ × 対角線₂ ÷ 2',
      a: '24 cm²',
      choices: ['24 cm²', '48 cm²', '12 cm²', '64 cm²'],
      jp: 'ひし形の面積（対角線6・8）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>6 × 8 ÷ 2 = 48 ÷ 2 = 24 cm²</span><span class="exp-ok">✅ 対角線の積÷2 = 24</span><span class="exp-tip">💡 ひし形も÷2！対角線が垂直に交わるので4つの直角三角形の面積の合計！</span>'
    },
    {
      q: '半径6cmの円の面積は？（πを使った式で）',
      sub: '面積 = πr²',
      a: '36π cm²',
      choices: ['6π cm²', '12π cm²', '36π cm²', '72π cm²'],
      jp: '円の面積（半径6cm）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>πr² = π × 6² = 36π cm²</span><span class="exp-ok">✅ r=6 → 6² = 36 → 36π</span><span class="exp-ng">❌ 円周（2πr = 12π）と混同しないこと！</span><span class="exp-tip">💡 「面積はr²（2乗）」「円周はr（1乗）」で区別！</span>'
    },
    {
      q: '半径4cm・中心角90°の扇形の面積は？（πを使った式で）',
      sub: '扇形の面積 = πr² × (中心角 ÷ 360)',
      a: '4π cm²',
      choices: ['2π cm²', '4π cm²', '8π cm²', '16π cm²'],
      jp: '扇形の面積（半径4・中心角90°）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>π×4²×(90÷360) = 16π×(1/4) = 4π cm²</span><span class="exp-ok">✅ 中心角90° = 円全体の1/4 → 16π÷4 = 4π</span><span class="exp-tip">💡 「90°は1/4」「180°は1/2」とすぐ気づく練習をしよう！</span>'
    },
    {
      q: '底面の半径3cm・高さ10cmの円柱の体積は？（πを使った式で）',
      sub: '円柱の体積 = πr² × h',
      a: '90π cm³',
      choices: ['30π cm³', '60π cm³', '90π cm³', '270π cm³'],
      jp: '円柱の体積（半径3・高さ10）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>π × 3² × 10 = 9π × 10 = 90π cm³</span><span class="exp-ok">✅ 底面積 = πr² = 9π、×高さ10 = 90π</span><span class="exp-tip">💡 「柱体の体積 = 底面積 × 高さ」。底面積を先に出す！</span>'
    },
    {
      q: '縦3cm・横5cm・高さ4cmの直方体の体積は？',
      sub: '直方体の体積 = 縦 × 横 × 高さ',
      a: '60 cm³',
      choices: ['40 cm³', '47 cm³', '60 cm³', '120 cm³'],
      jp: '直方体の体積（3×5×4）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>3 × 5 × 4 = 60 cm³</span><span class="exp-ok">✅ 3つをかけるだけ！単位はcm³</span><span class="exp-tip">💡 直方体 = 底面積(3×5)×高さ(4)と考えてもOK！</span>'
    },
    {
      q: '底面の半径3cm・高さ6cmの円錐の体積は？（πを使った式で）',
      sub: '円錐の体積 = πr² × h ÷ 3',
      a: '18π cm³',
      choices: ['6π cm³', '18π cm³', '27π cm³', '54π cm³'],
      jp: '円錐の体積（半径3・高さ6）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>π × 3² × 6 ÷ 3 = 54π ÷ 3 = 18π cm³</span><span class="exp-ok">✅ 錐体は柱体の1/3！9π × 6 = 54π → ÷3 = 18π</span><span class="exp-ng">❌ ÷3を忘れるミスが多い！錐体は必ず÷3！</span><span class="exp-tip">💡 「錐は1/3（さんぶんのいち）」と唱えながら覚えよう！</span>'
    },
    {
      q: '同じ底辺・同じ高さの三角形と平行四辺形の面積の比は？',
      sub: '公式の違いを確認しよう',
      a: '1 : 2',
      choices: ['1 : 1', '1 : 2', '2 : 1', '1 : 4'],
      jp: '三角形と平行四辺形の面積比',
      exp: '<span class="exp-rule"><span class="label">📐 比較</span>三角形 = 底×高÷2、平行四辺形 = 底×高 → 比は1:2</span><span class="exp-ok">✅ 同じ底辺・高さなら三角形は平行四辺形の半分！</span><span class="exp-tip">💡 三角形2つ合わせると平行四辺形1つ分！これが÷2の理由</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'math_geo_s3_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 面積と体積</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:4, jp:q.q, choices:q.choices};
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 4)
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
    + '<div class="intro-box-title">🏆 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">確認テスト！練習してきたから大丈夫なはず！全問正解してにっくんを驚かせる！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">Section 1〜3の総まとめだ。図形の基本・角度・面積と体積——全部出るよ。自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    // S1: 図形の基本（7問）
    { q:'三角形の内角の和は何度？', sub:'最重要基本ルール', a:'180°', choices:['90°','180°','270°','360°'], jp:'三角形の内角の和', exp:'<span class="exp-rule"><span class="label">📐 基本</span>三角形の内角の和 = 180°（絶対！）</span><span class="exp-tip">💡 全ての三角形問題の出発点！</span>' },
    { q:'正三角形の1つの角の大きさは？', sub:'内角の和÷3', a:'60°', choices:['45°','60°','90°','120°'], jp:'正三角形の1角', exp:'<span class="exp-rule"><span class="label">📐 計算</span>180° ÷ 3 = 60°</span><span class="exp-tip">💡 正三角形の全角は60°！暗記しよう</span>' },
    { q:'四角形の内角の和は何度？', sub:'三角形2つ分で考える', a:'360°', choices:['180°','270°','360°','540°'], jp:'四角形の内角の和', exp:'<span class="exp-rule"><span class="label">📐 基本</span>四角形の内角の和 = 360°（180°×2）</span><span class="exp-tip">💡 対角線で2つの三角形に分けると180°×2！</span>' },
    { q:'平行四辺形の向かい合う角（対角）の性質は？', sub:'平行四辺形の基本性質', a:'等しい', choices:['等しい','和が180°','すべて90°','和が90°'], jp:'平行四辺形の対角', exp:'<span class="exp-rule"><span class="label">📐 性質</span>平行四辺形の対角は等しい</span><span class="exp-tip">💡 隣り合う角の和が180°（対角ではない！）</span>' },
    { q:'円上の2点を結ぶ直線（線分）を何という？', sub:'弧（曲線）と区別して覚える', a:'弦（げん）', choices:['弦（げん）','弧（こ）','半径','中線'], jp:'弦の定義', exp:'<span class="exp-rule"><span class="label">📐 定義</span>弦 = 円上2点を結ぶ直線。弧は円周の一部（曲線）</span><span class="exp-tip">💡 弦は直線、弧は曲線！</span>' },
    { q:'ひし形の対角線の交わり方は？', sub:'ひし形の対角線には特別な性質がある', a:'垂直に交わる（90°）', choices:['垂直に交わる（90°）','平行になる','等しい長さで交わる','中点で交わらない'], jp:'ひし形の対角線', exp:'<span class="exp-rule"><span class="label">📐 性質</span>ひし形の対角線は垂直に交わる（かつ互いを2等分する）</span><span class="exp-tip">💡 長方形の対角線は等しいが垂直でない。正方形はどちらも満たす！</span>' },
    { q:'半径5cmの円の面積は？（πを使った式で）', sub:'面積 = πr²', a:'25π cm²', choices:['5π cm²','10π cm²','25π cm²','50π cm²'], jp:'円の面積（半径5）', exp:'<span class="exp-rule"><span class="label">📐 公式</span>πr² = π × 5² = 25π cm²</span><span class="exp-tip">💡 面積はr²（2乗）！円周の2πrと混同しない！</span>' },
    // S2: 角度（7問）
    { q:'対頂角とはどのような角か？', sub:'2直線が交わるとき', a:'向かい合う角（必ず等しい）', choices:['向かい合う角（必ず等しい）','隣り合う角（和が180°）','平行線が作る同じ側の角','補角'], jp:'対頂角の定義', exp:'<span class="exp-rule"><span class="label">📐 定義</span>対頂角 = 2直線が交わるとき向かい合う角、必ず等しい</span><span class="exp-tip">💡 「向かい合う」→「等しい」を即反応！</span>' },
    { q:'平行線に横断線が交わるとき、同位角は？', sub:'平行線のルール', a:'等しい', choices:['等しい','和が180°','和が90°','2倍の関係'], jp:'同位角の性質', exp:'<span class="exp-rule"><span class="label">📐 ルール</span>平行線では同位角 = 等しい</span><span class="exp-tip">💡 ∥があれば同位角・錯角どちらも等しい！</span>' },
    { q:'三角形の2つの角が40°と65°のとき、残りの角は？', sub:'内角の和180°', a:'75°', choices:['65°','70°','75°','80°'], jp:'三角形の角度計算（40°+65°）', exp:'<span class="exp-rule"><span class="label">📐 計算</span>180° − 40° − 65° = 75°</span><span class="exp-tip">💡 3角目 = 180° − (角1) − (角2)！</span>' },
    { q:'三角形の外角の大きさは？', sub:'外角の性質', a:'隣り合わない2内角の和', choices:['隣り合わない2内角の和','隣り合う内角との差','常に120°','内角の和の半分'], jp:'三角形の外角', exp:'<span class="exp-rule"><span class="label">📐 ルール</span>外角 = 隣り合わない2内角の和</span><span class="exp-tip">💡 外角は「離れた2角の合計」！証明問題でよく出る！</span>' },
    { q:'五角形の内角の和は何度？', sub:'180°×(n−2)', a:'540°', choices:['360°','480°','540°','720°'], jp:'五角形の内角の和', exp:'<span class="exp-rule"><span class="label">📐 公式</span>180°×(5−2) = 180°×3 = 540°</span><span class="exp-tip">💡 五角形は三角形3つ分！</span>' },
    { q:'どんな多角形でも外角の和は何度？', sub:'n角形に関係なく', a:'360°', choices:['180°','270°','360°','n×180°'], jp:'多角形の外角の和', exp:'<span class="exp-rule"><span class="label">📐 定理</span>外角の和 = 360°（n角形に関係なく常に！）</span><span class="exp-tip">💡 外角の和は絶対360°！これは絶対覚える！</span>' },
    { q:'正六角形の1つの角の大きさは何度？', sub:'内角の和÷n', a:'120°', choices:['90°','108°','120°','135°'], jp:'正六角形の1角', exp:'<span class="exp-rule"><span class="label">📐 計算</span>180°×(6−2)÷6 = 720°÷6 = 120°</span><span class="exp-tip">💡 まず内角の和を出してからnで割る！</span>' },
    // S3: 面積・体積（6問）
    { q:'底辺6cm・高さ9cmの三角形の面積は？', sub:'底辺×高さ÷2', a:'27 cm²', choices:['27 cm²','54 cm²','18 cm²','36 cm²'], jp:'三角形の面積（底辺6・高さ9）', exp:'<span class="exp-rule"><span class="label">📐 公式</span>6 × 9 ÷ 2 = 27 cm²</span><span class="exp-tip">💡 三角形はいつも÷2！</span>' },
    { q:'上底3cm・下底9cm・高さ4cmの台形の面積は？', sub:'(上底+下底)×高さ÷2', a:'24 cm²', choices:['24 cm²','48 cm²','36 cm²','12 cm²'], jp:'台形の面積（上底3・下底9・高さ4）', exp:'<span class="exp-rule"><span class="label">📐 公式</span>(3+9)×4÷2 = 12×4÷2 = 24 cm²</span><span class="exp-tip">💡 台形も÷2！(上+下)の平均×高さ！</span>' },
    { q:'対角線が10cmと8cmのひし形の面積は？', sub:'対角線₁×対角線₂÷2', a:'40 cm²', choices:['40 cm²','80 cm²','20 cm²','64 cm²'], jp:'ひし形の面積（対角線10・8）', exp:'<span class="exp-rule"><span class="label">📐 公式</span>10 × 8 ÷ 2 = 40 cm²</span><span class="exp-tip">💡 ひし形も÷2！対角線のかけ算÷2！</span>' },
    { q:'半径4cm・中心角180°の扇形の面積は？（πを使った式で）', sub:'中心角180°は半円', a:'8π cm²', choices:['4π cm²','8π cm²','16π cm²','32π cm²'], jp:'扇形の面積（半径4・中心角180°）', exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×4²×(180÷360) = 16π×(1/2) = 8π cm²</span><span class="exp-tip">💡 中心角180° = 半円！16πの半分 = 8π！</span>' },
    { q:'底面の半径2cm・高さ5cmの円柱の体積は？（πを使った式で）', sub:'πr²×h', a:'20π cm³', choices:['10π cm³','20π cm³','40π cm³','4π cm³'], jp:'円柱の体積（半径2・高さ5）', exp:'<span class="exp-rule"><span class="label">📐 公式</span>π×2²×5 = 4π×5 = 20π cm³</span><span class="exp-tip">💡 底面積（πr²=4π）×高さ5 = 20π！</span>' },
    { q:'底辺8cm・高さ6cmの平行四辺形の面積は？', sub:'底辺×高さ（÷2しない！）', a:'48 cm²', choices:['24 cm²','48 cm²','96 cm²','28 cm²'], jp:'平行四辺形の面積（底辺8・高さ6）', exp:'<span class="exp-rule"><span class="label">📐 公式</span>8 × 6 = 48 cm²（÷2しない！）</span><span class="exp-ng">❌ 三角形と混同して÷2してしまうミスが多い</span><span class="exp-tip">💡 平行四辺形は÷2しない！三角形と混同しないこと！</span>' },
  ];

  qs.forEach(function(q, i) { q._qid = 'math_geo_s4_q' + i; });
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
  for (var i = 0; i < 20; i++) { s4qids.push('math_geo_s4_q' + i); }
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
    ? 'きょん「全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。図形は君のものだね」'
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
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_geo_') === 0; });
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
