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
        var nextMsg = currentSection === 8 ? '「因数分解で解く」で練習しよう！' : currentSection === 3 ? '「因数分解で解く」へ進もう！' : currentSection === 7 ? '確認テストへ挑戦！' : (currentSection < 4 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '確認テストへ挑戦！');
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
  { id:8, label:'🆘 対策プリント', title:'学習診断テスト対策：グラフから式 → 交点 → 動く点', sub:'グラフから式を作るところから、1ステップずつ' },
  { id:1, label:'標準形とa,b,c', title:'標準形とa,b,cの見つけ方',    sub:'ax²+bx+c=0 に整えて、正確に係数を読み取る' },
  { id:2, label:'解の公式',      title:'解の公式の使い方',           sub:'4ステップで、どんな二次方程式も解ける' },
  { id:3, label:'いろいろな型',  title:'いろいろなパターン',         sub:'√が残る場合・重解・約分の注意点' },
  { id:7, label:'因数分解で解く', title:'因数分解・平方根で解く／文章題', sub:'教科書で最初に習う解き方と、入試の文章題' },
  { id:4, label:'確認テスト',    title:'確認テスト',                 sub:'全セクション総まとめ！何問正解できる？' },
  { id:5, label:'📊弱点',        title:'弱点ノート',                 sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',        title:'弱点特訓モード',             sub:'弱点問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab'
      + (s.id === 5 || s.id === 6 ? ' tokku' : '')
      + (s.id === currentSection ? ' active' : '')
      + (sectionDone[s.id] && s.id !== 5 && s.id !== 6 ? ' done' : '');
    var label = s.label + (sectionDone[s.id] && s.id !== 5 && s.id !== 6 ? ' ✓' : '');
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

  var s = SECTIONS.filter(function(x) { return x.id === id; })[0];
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
  else if (id === 7) html += renderSection7();
  else if (id === 8) html += renderSection8();

  if ((id >= 1 && id <= 4) || id === 7 || id === 8) {
    var NEXT = { 1:2, 2:3, 3:7, 7:4, 8:7 };
    var nextLabel = id !== 4 ? '次のセクションへ →' : '🏆 結果を見る！';
    html += '<button class="next-section-btn" id="nextBtn" data-goto="' + (id !== 4 ? NEXT[id] : 'result') + '" style="display:none">' + nextLabel + '</button>';
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
    + '<text x="170" y="96" fill="#0ea5e9" font-size="13" text-anchor="middle">② √の中（b²−4ac） b²-4ac を計算</text>'
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
    + '<button class="start-btn" data-goto="8" style="background:#ff5c5c;color:#fff;margin-bottom:10px">🆘 学習診断テスト対策プリントの解き方はこちら →</button><br>'
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
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">丸ごと覚えるしかない公式だが、使い方は4ステップに分ければ簡単だ。a,b,cを確認して、√の中（b²−4ac）を計算して、√を簡単にして、最後に約分する。この順番さえ守れば迷わない。</div></div></div>'
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
    { q:'x²+5x+6=0を解の公式で解くと？', sub:'a=1,b=5,c=6。b²−4ac=25-24=1', a:'x=-2, -3', choices:['x=-2, -3','x=2, 3','x=-2, 3','x=-1, -6'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25-24=1。x=(-5±1)/2 → x=-2, -3</span><span class="exp-tip">💡 √の中（b²−4ac）が1になる＝ちょうどいい数になる典型パターン！</span>' },
    { q:'x²-3x-10=0を解の公式で解くと？', sub:'a=1,b=-3,c=-10。b²−4ac=9+40=49', a:'x=5, -2', choices:['x=5, -2','x=-5, 2','x=5, 2','x=-5, -2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=9+40=49。x=(3±7)/2 → x=5, -2</span><span class="exp-tip">💡 -b=-(-3)=3になることに注意！</span>' },
    { q:'x²-6x+9=0を解の公式で解くと？', sub:'b²−4ac=36-36=0（重解）', a:'x=3（重解）', choices:['x=3（重解）','x=-3（重解）','x=9（重解）','x=3, -3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=36-36=0。x=6/2=3（±0なので解は1つだけ）</span><span class="exp-tip">💡 √の中（b²−4ac）が0のときは、解は1つだけ（重解ともいう）！</span>' },
    { q:'2x²+5x+2=0を解の公式で解くと？', sub:'a=2,b=5,c=2。b²−4ac=25-16=9', a:'x=-1/2, -2', choices:['x=-1/2, -2','x=1/2, 2','x=-1/2, 2','x=1/2, -2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25-16=9。x=(-5±3)/4 → x=-1/2, -2</span><span class="exp-tip">💡 aが1でないときは分母(2a)も変わる。ここでは2a=4！</span>' },
    { q:'2x²-7x+3=0を解の公式で解くと？', sub:'a=2,b=-7,c=3。b²−4ac=49-24=25', a:'x=3, 1/2', choices:['x=3, 1/2','x=-3, -1/2','x=3, -1/2','x=6, 1'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=49-24=25。x=(7±5)/4 → x=3, 1/2</span><span class="exp-tip">💡 分数の解になることも普通にある！</span>' },
    { q:'3x²-2x-1=0を解の公式で解くと？', sub:'a=3,b=-2,c=-1。b²−4ac=4+12=16', a:'x=1, -1/3', choices:['x=1, -1/3','x=-1, 1/3','x=1, 1/3','x=3, -1'],
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
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">√の中（b²−4ac）がきれいな数にならないとき、√がそのまま残っちゃうんだけど…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">それが普通だ。むしろテストではそのパターンの方がよく出る。√の中を平方根の単元でやった素因数分解で簡単にして、最後に分数全体を約分する——ここが一番のヤマ場だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">約分するとき、注意することある？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">大ありだ。分子の「-6±2√5」を2で割るときは、-6と2√5の両方を2で割らないといけない。片方だけ割って満足するのが一番多いミスだ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 約分は分子の全部の項に！</div>'
    + SVG.reduceCare
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">注意点まとめ</div>'
    + '<div class="ex">① √の中（b²−4ac）が0より大きい平方数でない → √が残る（普通のこと！）</div>'
    + '<div class="ex">② √の中は平方根の単元のやり方で簡単にする（√20=2√5など）</div>'
    + '<div class="ex">③ 分子の「-b」と「√の項」の両方を、分母(2a)の共通因数で割る</div>'
    + '<div class="note">⚠️ (-6±2√5)/2 は -3±√5 になる。「-6÷2」と「2√5÷2」の両方を実行して初めて正しい約分！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'x²+2x-1=0を解の公式で解くと？', sub:'b²−4ac=4+4=8=4×2 → √8=2√2', a:'x=-1±√2', choices:['x=-1±√2','x=1±√2','x=-1±2√2','x=-2±√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=4+4=8。x=(-2±2√2)/2 → 両方を2で割って x=-1±√2</span><span class="exp-tip">💡 √8=2√2に簡単化してから、分子全体を2で割る！</span>' },
    { q:'x²-4x+2=0を解の公式で解くと？', sub:'b²−4ac=16-8=8=4×2 → √8=2√2', a:'x=2±√2', choices:['x=2±√2','x=-2±√2','x=2±2√2','x=4±√2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=16-8=8。x=(4±2√2)/2 → x=2±√2</span><span class="exp-tip">💡 4÷2=2、2√2÷2=√2。両方割るのを忘れずに！</span>' },
    { q:'x²-2x-2=0を解の公式で解くと？', sub:'b²−4ac=4+8=12=4×3 → √12=2√3', a:'x=1±√3', choices:['x=1±√3','x=-1±√3','x=1±3√3','x=2±√3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=4+8=12。x=(2±2√3)/2 → x=1±√3</span><span class="exp-tip">💡 √12=2√3への簡略化がポイント！</span>' },
    { q:'x²+4x+1=0を解の公式で解くと？', sub:'b²−4ac=16-4=12=4×3 → √12=2√3', a:'x=-2±√3', choices:['x=-2±√3','x=2±√3','x=-2±2√3','x=-4±√3'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=16-4=12。x=(-4±2√3)/2 → x=-2±√3</span><span class="exp-tip">💡 -4÷2=-2、2√3÷2=√3！</span>' },
    { q:'x²-2x-4=0を解の公式で解くと？', sub:'b²−4ac=4+16=20=4×5 → √20=2√5', a:'x=1±√5', choices:['x=1±√5','x=-1±√5','x=1±2√5','x=2±√5'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=4+16=20。x=(2±2√5)/2 → x=1±√5</span><span class="exp-tip">💡 √20=2√5！</span>' },
    { q:'x²+6x+4=0を解の公式で解くと？', sub:'b²−4ac=36-16=20=4×5 → √20=2√5', a:'x=-3±√5', choices:['x=-3±√5','x=3±√5','x=-3±2√5','x=-6±√5'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=36-16=20。x=(-6±2√5)/2 → x=-3±√5</span><span class="exp-tip">💡 -6と2√5、両方を2で割る！</span>' },
    { q:'2x²+4x-1=0を解の公式で解くと？', sub:'a=2。b²−4ac=16+8=24=4×6 → √24=2√6', a:'x=(-2±√6)/2', choices:['x=(-2±√6)/2','x=-2±√6','x=(-2±√6)/4','x=(-4±√6)/2'],
      exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=16+8=24。x=(-4±2√6)/4 → 分子分母を2で割って x=(-2±√6)/2</span><span class="exp-tip">💡 分母が2aで4になる場合も、分子の共通因数と一緒に約分できるか確認！</span>' },
    { q:'x²-4x-1=0を解の公式で解くと？', sub:'b²−4ac=16+4=20=4×5 → √20=2√5', a:'x=2±√5', choices:['x=2±√5','x=-2±√5','x=2±2√5','x=4±√5'],
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

// ===== SECTION 7: 因数分解・平方根で解く／文章題（2026-09-30 追加。教科書で最初に習う解き方が抜けていた） =====
function renderSection7() {
  var html = '<div class="rule-card">'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">二次方程式は全部、解の公式で解けばいいんでしょ？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">解けるけど遠回りになることが多い。<b>① 因数分解できないか → ② (　)² ＝ 数 の形なら平方根 → ③ どちらもダメなら解の公式</b>。この順番で見ると、入試の計算はほとんど一瞬で終わる</div></div></div>'
    + '</div>';
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 二次方程式の解き方（この順に考える）</div>'
    + '<div class="rule-box">'
    + '<div class="ex">① <b>因数分解</b>：AB ＝ 0 なら A ＝ 0 または B ＝ 0。x² ＋ 5x ＋ 6 ＝ 0 → (x＋2)(x＋3) ＝ 0 → x ＝ −2, −3</div>'
    + '<div class="ex">② <b>平方根</b>：(x − 3)² ＝ 5 → x − 3 ＝ ±√5 → x ＝ 3 ± √5</div>'
    + '<div class="ex">③ <b>解の公式</b>：①②で解けないとき</div>'
    + '<div class="note">⚠️ x² ＝ 3x を x でわって x ＝ 3 だけにしない！ x² − 3x ＝ 0 → x(x − 3) ＝ 0 → <b>x ＝ 0, 3</b>（x ＝ 0 が消えてしまう）<br>⚠️ (x＋1)(x−2) ＝ 4 は「＝0」ではないので、そのまま x＋1＝4 としない。展開して「＝0」にしてから。</div>'
    + '</div>'
    + '<div class="rule-card-title" style="margin-top:14px">📐 文章題・解から係数を求める</div>'
    + '<div class="rule-box">'
    + '<div class="ex">解の1つが x ＝ 3 → 方程式に<b>代入</b>して a を求める → もとの式を解いて<b>もう1つの解</b>を出す</div>'
    + '<div class="ex">文章題：求めたものが<b>問題に合うか</b>確認（長さや個数がマイナスなら不適）</div>'
    + '</div>'
    + '</div>';

  function E(rule, ok, ng, tip) { return '<span class="exp-rule"><span class="label">📐 ルール</span>' + rule + '</span><span class="exp-ok">✅ ' + ok + '</span>' + (ng ? '<span class="exp-ng">❌ ' + ng + '</span>' : '') + '<span class="exp-tip">💡 ' + tip + '</span>'; }
  var qs = [
    { q:'x² ＋ 5x ＋ 6 ＝ 0 を因数分解で解くと？', a:'x ＝ −2, −3', choices:['x ＝ −2, −3','x ＝ 2, 3','x ＝ −1, −6','x ＝ 2, −3'],
      exp:E('足して5・かけて6 → 2と3', '(x＋2)(x＋3) ＝ 0 → x ＝ −2, −3', '(x＋2) の解は x ＝ +2 ではなく −2', 'カッコの中が0になる x を答える') },
    { q:'x² − 7x ＋ 12 ＝ 0 を解くと？', a:'x ＝ 3, 4', choices:['x ＝ 3, 4','x ＝ −3, −4','x ＝ 2, 6','x ＝ −3, 4'],
      exp:E('足して−7・かけて12 → −3と−4', '(x−3)(x−4) ＝ 0 → x ＝ 3, 4', '符号を逆にしない', '確認：9−21+12＝0 ✓') },
    { q:'x² ＋ 2x − 15 ＝ 0 を解くと？', a:'x ＝ −5, 3', choices:['x ＝ −5, 3','x ＝ 5, −3','x ＝ −5, −3','x ＝ 15, −1'],
      exp:E('足して2・かけて−15 → 5と−3', '(x＋5)(x−3) ＝ 0 → x ＝ −5, 3', 'x＝5, −3 は符号が逆', '解はカッコの中の数の符号を逆にしたもの') },
    { q:'x² − 6x ＋ 9 ＝ 0 を解くと？', a:'x ＝ 3', choices:['x ＝ 3','x ＝ −3','x ＝ ±3','x ＝ 9'],
      exp:E('(x−3)² ＝ 0', 'x ＝ 3（解は1つ）', '±3 にはならない', '(　)² ＝ 0 の形は解が1つ') },
    { q:'x² − 16 ＝ 0 を解くと？', a:'x ＝ ±4', choices:['x ＝ ±4','x ＝ 4','x ＝ ±8','x ＝ 16'],
      exp:E('x² ＝ 16 → x ＝ ±√16', 'x ＝ ±4', 'マイナスの解を忘れない', '(x＋4)(x−4)＝0 でも同じ') },
    { q:'x² ＝ 3x を解くと？', a:'x ＝ 0, 3', choices:['x ＝ 0, 3','x ＝ 3','x ＝ ±√3','x ＝ 0'],
      exp:E('移項して x² − 3x ＝ 0 → x(x − 3) ＝ 0', 'x ＝ 0, 3', '両辺を x でわると x＝0 が消える（いちばん多いまちがい）', '文字でわらない。移項して因数分解') },
    { q:'(x − 3)² ＝ 5 を解くと？', a:'x ＝ 3 ± √5', choices:['x ＝ 3 ± √5','x ＝ −3 ± √5','x ＝ 8','x ＝ 3 ± 5'],
      exp:E('( )の中を1つのカタマリと見て平方根', 'x − 3 ＝ ±√5 → x ＝ 3 ± √5', '−3 を移項すると ＋3', '展開しない方が速い') },
    { q:'2x² ＝ 18 を解くと？', a:'x ＝ ±3', choices:['x ＝ ±3','x ＝ ±9','x ＝ 3','x ＝ ±√18'],
      exp:E('x² ＝ 9 にしてから平方根', 'x ＝ ±3', '±√18 は2でわり忘れ', 'x² ＝ 数 の形にそろえる') },
    { q:'【難】(x ＋ 1)(x − 2) ＝ 4 を解くと？', a:'x ＝ 3, −2', choices:['x ＝ 3, −2','x ＝ 3, 6','x ＝ −1, 2','x ＝ −3, 2'],
      exp:E('右辺が0ではないので、展開して移項', 'x² − x − 2 − 4 ＝ 0 → x² − x − 6 ＝ 0 → (x−3)(x＋2) ＝ 0 → x ＝ 3, −2', 'x＋1＝4、x−2＝4 とするのはまちがい', '「AB＝0」のときだけ A＝0 または B＝0') },
    { q:'【難】x² ＋ ax − 12 ＝ 0 の解の1つが x ＝ 3 のとき、a の値は？', a:'a ＝ 1', choices:['a ＝ 1','a ＝ −1','a ＝ 4','a ＝ 7'],
      exp:E('解を代入すると a の方程式になる', '9 ＋ 3a − 12 ＝ 0 → 3a ＝ 3 → a ＝ 1', '−12 を移項し忘れない', '「解が〜のとき」は代入') },
    { q:'【難】前の問題で、もう1つの解は？', a:'x ＝ −4', choices:['x ＝ −4','x ＝ 4','x ＝ −3','x ＝ 12'],
      exp:E('a ＝ 1 をもどして解く', 'x² ＋ x − 12 ＝ 0 → (x＋4)(x−3) ＝ 0 → x ＝ −4', 'x＝3 はすでにわかっている方', 'もとの式にもどして因数分解') },
    { q:'連続する2つの正の整数があり、その積は56である。小さい方の数は？', a:'7', choices:['7','8','−8','14'],
      exp:E('小さい方を n とすると n(n＋1) ＝ 56', 'n² ＋ n − 56 ＝ 0 → (n＋8)(n−7) ＝ 0 → n ＝ 7（正の整数なので −8 は不適）', '−8 は「正の整数」に合わない', '最後に問題の条件に合うか確認') },
    { q:'【難】縦が横より3cm長い長方形の面積が40cm²である。横の長さは？', a:'5cm', choices:['5cm','8cm','−8cm','10cm'],
      exp:E('横を x とすると縦は x＋3、面積 x(x＋3) ＝ 40', 'x² ＋ 3x − 40 ＝ 0 → (x＋8)(x−5) ＝ 0 → x ＝ 5（長さなので −8 は不適）', '8cm は縦の長さ', '長さはマイナスにならない') },
    { q:'【難】ある数を2乗した数と、もとの数を4倍して12をたした数が等しい。ある数をすべて求めると？', a:'6 と −2', choices:['6 と −2','6 だけ','−6 と 2','4 と 3'],
      exp:E('ある数を x として x² ＝ 4x ＋ 12', 'x² − 4x − 12 ＝ 0 → (x−6)(x＋2) ＝ 0 → x ＝ 6, −2', '「正の数」と書いていなければ −2 も答え', '条件をよく読んで不適を判断') }
  ];
  qs.forEach(function(q, i) { q._qid = 'math_quad_s7_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 因数分解・平方根で解く・文章題</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 8: 🆘 学習診断テスト対策プリント「グラフから式を作る → 交点 → 動く点と二次方程式」（2026-09-30 追加） =====
// 座標平面の図（格子・直線・点・「右に□、上に□」の階段）を描く
function qdGraph(c) {
  var W = (c.xmax - c.xmin) * c.sx, H = (c.ymax - c.ymin) * c.sy, L = 34, T = 16;
  function X(x) { return L + (x - c.xmin) * c.sx; }
  function Y(y) { return T + (c.ymax - y) * c.sy; }
  var s = '<svg viewBox="0 0 ' + (W + L + 44) + ' ' + (H + T + 34) + '" style="width:100%;max-width:' + (c.maxw || 420) + 'px;display:block;margin:8px auto;background:#0f1520;border-radius:10px">';
  for (var gx = c.xmin; gx <= c.xmax + 1e-9; gx += c.gx) s += '<line x1="' + X(gx) + '" y1="' + Y(c.ymin) + '" x2="' + X(gx) + '" y2="' + Y(c.ymax) + '" stroke="rgba(120,160,255,0.22)"/>';
  for (var gy = c.ymin; gy <= c.ymax + 1e-9; gy += c.gy) s += '<line x1="' + X(c.xmin) + '" y1="' + Y(gy) + '" x2="' + X(c.xmax) + '" y2="' + Y(gy) + '" stroke="rgba(120,160,255,0.22)"/>';
  var ax = c.xmin <= 0 && c.xmax >= 0 ? 0 : c.xmin, ay = c.ymin <= 0 && c.ymax >= 0 ? 0 : c.ymin;
  s += '<line x1="' + X(c.xmin) + '" y1="' + Y(ay) + '" x2="' + X(c.xmax) + '" y2="' + Y(ay) + '" stroke="#e6edf3" stroke-width="1.6"/>';
  s += '<line x1="' + X(ax) + '" y1="' + Y(c.ymin) + '" x2="' + X(ax) + '" y2="' + Y(c.ymax) + '" stroke="#e6edf3" stroke-width="1.6"/>';
  (c.xt || []).forEach(function(v) { s += '<text x="' + X(v[0]) + '" y="' + (Y(ay) + 15) + '" text-anchor="middle" fill="#9aa4b2" font-size="12">' + v[1] + '</text>'; });
  (c.yt || []).forEach(function(v) { s += '<text x="' + (X(ax) - 6) + '" y="' + (Y(v[0]) + 4) + '" text-anchor="end" fill="#9aa4b2" font-size="12">' + v[1] + '</text>'; });
  if (c.xl) s += '<text x="' + (X(c.xmax) + 4) + '" y="' + (Y(ay) + 4) + '" fill="#e6edf3" font-size="13">' + c.xl + '</text>';
  if (c.yl) s += '<text x="' + (X(ax) + 4) + '" y="' + (Y(c.ymax) + 2) + '" fill="#e6edf3" font-size="13">' + c.yl + '</text>';
  (c.lines || []).forEach(function(l) {
    // y = a x + b を x1〜x2 で描く（枠の外は切る）
    var x1 = l.x1 !== undefined ? l.x1 : c.xmin, x2 = l.x2 !== undefined ? l.x2 : c.xmax;
    if (l.a !== 0) {
      var ya = l.a * x1 + l.b, yb = l.a * x2 + l.b;
      if (ya < c.ymin) x1 = (c.ymin - l.b) / l.a; if (ya > c.ymax) x1 = (c.ymax - l.b) / l.a;
      if (yb < c.ymin) x2 = (c.ymin - l.b) / l.a; if (yb > c.ymax) x2 = (c.ymax - l.b) / l.a;
    }
    s += '<line x1="' + X(x1) + '" y1="' + Y(l.a * x1 + l.b) + '" x2="' + X(x2) + '" y2="' + Y(l.a * x2 + l.b) + '" stroke="' + l.color + '" stroke-width="3"' + (l.dash ? ' stroke-dasharray="7 5"' : '') + '/>';
    if (l.label) s += '<text x="' + (X(x2) + 4) + '" y="' + (Y(l.a * x2 + l.b) + (l.ly || 4)) + '" fill="' + l.color + '" font-size="14" font-weight="bold">' + l.label + '</text>';
  });
  (c.stairs || []).forEach(function(st) {
    var fx = st.from[0], fy = st.from[1];
    s += '<line x1="' + X(fx) + '" y1="' + Y(fy) + '" x2="' + X(fx + st.dx) + '" y2="' + Y(fy) + '" stroke="#ffd84d" stroke-width="3" stroke-dasharray="5 3"/>';
    s += '<line x1="' + X(fx + st.dx) + '" y1="' + Y(fy) + '" x2="' + X(fx + st.dx) + '" y2="' + Y(fy + st.dy) + '" stroke="#3ddc84" stroke-width="3" stroke-dasharray="5 3"/>';
    s += '<text x="' + ((X(fx) + X(fx + st.dx)) / 2) + '" y="' + (Y(fy) + (st.above ? -6 : (st.dy >= 0 ? 16 : -6))) + '" text-anchor="middle" fill="#ffd84d" font-size="12" font-weight="bold">' + st.tr + '</text>';
    s += '<text x="' + (X(fx + st.dx) + 5) + '" y="' + ((Y(fy) + Y(fy + st.dy)) / 2 + 4) + '" fill="#3ddc84" font-size="12" font-weight="bold">' + st.tu + '</text>';
  });
  (c.texts || []).forEach(function(t) {
    s += '<text x="' + X(t.x) + '" y="' + (Y(t.y) + (t.dy || 0)) + '" text-anchor="' + (t.anchor || 'middle') + '" fill="' + (t.color || '#9aa4b2') + '" font-size="12">' + t.t + '</text>';
  });
  (c.pts || []).forEach(function(p) {
    s += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="5" fill="' + p.color + '" stroke="#000"/>';
    if (p.label) s += '<text x="' + (X(p.x) + (p.dx || 7)) + '" y="' + (Y(p.y) + (p.dy || -7)) + '" fill="' + p.color + '" font-size="12" font-weight="bold">' + p.label + '</text>';
  });
  return s + '</svg>';
}
function qdStep(title, body, open) {
  return '<details class="qd-step"' + (open ? ' open' : '') + '><summary>' + title + '</summary><div class="qd-body">' + body + '</div></details>';
}
function qdGrid(extra) {
  var c = { xmin:-5, xmax:5, ymin:-5, ymax:5, sx:32, sy:32, gx:1, gy:1, xl:'x', yl:'y',
    xt:[[-5,'−5'],[5,'5']], yt:[[5,'5'],[-5,'−5']] };
  for (var k in extra) c[k] = extra[k];
  return qdGraph(c);
}
function renderSection8() {
  var css = '<style>'
    + '.qd-step{margin:10px 0;border:2px solid var(--border);border-radius:12px;background:rgba(255,255,255,0.03)}'
    + '.qd-step summary{cursor:pointer;padding:12px 14px;font-size:16px;font-weight:bold;color:var(--gold);line-height:1.7}'
    + '.qd-step[open] summary{border-bottom:1px solid var(--border)}'
    + '.qd-body{padding:12px 16px;font-size:16px;line-height:2.1}'
    + '.qd-big{font-size:20px;font-weight:bold;color:#fff;background:rgba(255,216,77,0.12);border-left:4px solid var(--gold);padding:6px 12px;margin:8px 0;border-radius:6px}'
    + '.qd-ans{font-size:19px;font-weight:bold;color:#3ddc84;border:2px solid #3ddc84;border-radius:10px;padding:8px 12px;margin:10px 0;text-align:center}'
    + '.qd-part{font-family:"Bebas Neue",sans-serif;font-size:22px;letter-spacing:2px;color:var(--purple);margin:26px 0 6px}'
    + '</style>';
  var html = css;
  html += '<div class="rule-card">'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">グラフを見て「式を求めなさい」って言われても、どこを見ればいいのか全然わからない…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">見るところは<b>2つだけ</b>だ。「<b>y軸とぶつかるところ</b>」と「<b>右に何マス進むと、上に何マス上がるか</b>」。この2つが読めれば、式は必ず作れる。まずそこから一緒にやろう</div></div></div>'
    + '<div class="chat-line"><div class="avatar" style="background:#b69cff;color:#111">🎭</div><div><div class="chat-name">なかむらしゅん</div><div class="chat-bubble">きょんさん、各ステップは<b>タップすると開く</b>ようにしてあります。開く前に「たぶんこうかな」って1回考えてから開くと、ぐっと身につきます。答えを先に見るのは、ネタバレしてから映画を見るようなもんです</div></div></div>'
    + '</div>';

  // ---------- PART 1：グラフから式を作る ----------
  html += '<div class="qd-part">PART 1　グラフから直線の式を作る</div>';
  html += '<div class="rule-card"><div class="rule-card-title">📐 直線の式は y ＝ （傾き）x ＋（切片）</div>'
    + '<div class="rule-box">'
    + '<div class="qd-big">① 切片 ＝ 線が y軸（たての軸）とぶつかる目盛り</div>'
    + '<div class="qd-big">② 傾き ＝ 右に1マス進むと、上に何マス上がるか<br>（右に□マスで上に△マスなら　傾き ＝ △ ÷ □）</div>'
    + '<div class="qd-big" style="border-left-color:#3ddc84">③ 線が y軸にとどいていない・目盛りがはんぱで読めないとき<br>→ 切片は<b>計算で出す</b>（通る点を式に入れる）か、<b>線を y軸までのばして</b>考える（PART 3 でくわしく）</div>'
    + '<div class="ex">・下がるときは「上に −△」と考えて、傾きは<b>マイナス</b>。</div>'
    + '<div class="ex">・点は、線が<b>マス目の角（交差点）をぴったり通るところ</b>を使う。中途半端なところは読まない。</div>'
    + '</div></div>';

  html += '<div class="rule-card"><div class="rule-card-title">🔍 対策プリント(4)の直線 ℓ の式を作ってみよう</div>'
    + qdGrid({ lines:[{a:2,b:-2,color:'#ff7a45',label:'ℓ'}], pts:[{x:0,y:-2,color:'#ff7a45',label:'(0, −2)',dx:-56,dy:4},{x:1,y:0,color:'#ff7a45',label:'(1, 0)',dx:8,dy:14},{x:2,y:2,color:'#ff7a45',label:'(2, 2)',dx:8,dy:4}], stairs:[{from:[0,-2],dx:1,dy:2,tr:'右に1',tu:'上に2'}] })
    + qdStep('STEP 1　y軸とぶつかるところは？（タップ）', 'ℓ は y軸の <b>−2</b> のところを通っている → <b>切片は −2</b>', false)
    + qdStep('STEP 2　右に1マス進むと、上に何マス？（タップ）', '(0, −2) から<b>右に1</b>マス進むと、(1, 0) で<b>上に2</b>マス上がっている → <b>傾きは 2</b><br>（(1, 0) から (2, 2) も、右に1・上に2。どこで数えても同じ）', false)
    + qdStep('STEP 3　式にする（タップ）', '<div class="qd-big">y ＝ 2x − 2</div>確認：点 (2, 2) を入れると 2×2 − 2 ＝ 2 → ぴったり ✓<br>💡 もう1つの点で確かめると、読みまちがいに気づける', false)
    + '</div>';

  html += '<div class="rule-card"><div class="rule-card-title">🔍 直線 m の式（傾きが分数になるパターン）</div>'
    + qdGrid({ lines:[{a:1/3,b:2,color:'#4aa8ff',label:'m',ly:-4}], pts:[{x:0,y:2,color:'#4aa8ff',label:'(0, 2)',dx:-44,dy:-8},{x:3,y:3,color:'#4aa8ff',label:'(3, 3)',dx:6,dy:-8}], stairs:[{from:[0,2],dx:3,dy:1,tr:'右に3',tu:'上に1'}] })
    + qdStep('STEP 1　y軸とぶつかるところは？（タップ）', 'm は y軸の <b>2</b> を通る → <b>切片は 2</b>', false)
    + qdStep('STEP 2　傾きは？（タップ）', '右に1マスだと、マス目の角をぴったり通らない。<br>そこで<b>角をぴったり通る次の点</b>をさがすと (3, 3)。<br>(0, 2) → (3, 3) は、<b>右に3</b>マスで<b>上に1</b>マス → 傾き ＝ 1 ÷ 3 ＝ <b>1/3</b>', false)
    + qdStep('STEP 3　式にする（タップ）', '<div class="qd-big">y ＝ 1/3 x ＋ 2</div>確認：x ＝ 3 を入れると 1 ＋ 2 ＝ 3 → (3, 3) ✓', false)
    + '<div class="note">⚠️ 傾きは「上 ÷ 右」。「右 ÷ 上」で 3 にしないこと！　きつい坂（ℓ）は大きい数、ゆるい坂（m）は小さい数になる。</div>'
    + '</div>';

  // ---------- PART 2：交点 ----------
  html += '<div class="qd-part">PART 2　2本の直線の交点（プリント(4)）</div>';
  html += '<div class="rule-card"><div class="rule-card-title">📐 交点 ＝ 2つの式を両方みたす点 → 連立方程式</div>'
    + qdGrid({ lines:[{a:2,b:-2,color:'#ff7a45',label:'ℓ'},{a:1/3,b:2,color:'#4aa8ff',label:'m',ly:-4}], pts:[{x:2.4,y:2.8,color:'#ffd84d',label:'P',dx:-18,dy:-8}] })
    + '<div class="ex">P は目盛りの角にないので、<b>グラフからは読めない</b>。だから計算で出す。</div>'
    + qdStep('STEP 1　y が同じ → 右辺どうしを ＝ でつなぐ（タップ）', 'どちらも「y ＝」なので<div class="qd-big">2x − 2 ＝ 1/3 x ＋ 2</div>', false)
    + qdStep('STEP 2　分数を消して x を求める（タップ）', '両辺を<b>3倍</b>する：6x − 6 ＝ x ＋ 6<br>x を左、数を右に移項：6x − x ＝ 6 ＋ 6 → 5x ＝ 12 → <b>x ＝ 12/5</b>', false)
    + qdStep('STEP 3　y を求める（タップ）', 'ℓ の式に入れる：y ＝ 2 × 12/5 − 2 ＝ 24/5 − 10/5 ＝ <b>14/5</b><br>（m の式に入れても 1/3 × 12/5 ＋ 2 ＝ 4/5 ＋ 10/5 ＝ 14/5 で同じ ✓）', false)
    + '<div class="qd-ans">答え　P（12/5 , 14/5）</div>'
    + '</div>';

  // ---------- PART 3：追いつく問題 ----------
  html += '<div class="qd-part">PART 3　追いついた時刻と場所（プリント(5)）</div>';
  // プリントと同じ目盛り：横1マス＝10分（0〜70分）、たて1マス＝0.5km（0〜3.5km）
  var g5 = { xmin:0, xmax:70, ymin:0, ymax:3.5, sx:5.2, sy:66, gx:10, gy:0.5, xl:'（分）', yl:'（km）',
    xt:[[0,'0'],[20,'20'],[40,'40'],[60,'60']], yt:[[1,'1'],[2,'2'],[3,'3']], maxw:460,
    texts:[{x:0,y:0,t:'（8時）',dy:30,color:'#9aa4b2'},{x:60,y:0,t:'（9時）',dy:30,color:'#9aa4b2'},{x:1,y:3.13,t:'図書館',dy:0,color:'#9aa4b2',anchor:'start'}] };
  g5.lines = [{a:1/15,b:0,x1:0,x2:45,color:'#ff7a45',label:'兄',ly:-4},{a:3/20,b:-3,x1:20,x2:40,color:'#4aa8ff',label:'妹',ly:-8}];
  g5.stairs = [{from:[0,0],dx:30,dy:2,tr:'右に30分',tu:'上に2km',above:true}];
  g5.pts = [{x:30,y:2,color:'#ff7a45',label:'(30, 2)',dx:-52,dy:-6},{x:20,y:0,color:'#4aa8ff',label:'(20, 0)',dx:10,dy:-24},{x:40,y:3,color:'#4aa8ff',label:'(40, 3)',dx:-58,dy:-6},{x:36,y:2.4,color:'#ffd84d',label:'追いついた',dx:8,dy:18}];
  html += '<div class="rule-card"><div class="rule-card-title">📐 横が「時間（分）」、たてが「道のり（km）」のグラフ</div>'
    + qdGraph(g5)
    + '<div class="ex">ここでも同じ。<b>y軸とぶつかるところ</b>と<b>右にいくつで上にいくつ</b>を読む。<b>1マスの大きさに注意</b>：横は<b>1マス10分</b>（目盛りの数字は20分ごとにしか書いていない）、たては<b>1マス0.5km</b>。</div>'
    + qdStep('STEP 1　兄の式（タップ）', '兄は <b>0（原点）</b>から出発 → 切片は 0<br>兄の線がマス目の角をぴったり通るのは <b>(30, 2)</b>（30分のたて線と2kmの横線が交わるところ）。<br>原点から <b>右に30分で上に2km</b> → 傾き ＝ 2 ÷ 30 ＝ <b>1/15</b>（約分）<br>⚠️ 兄の線の先（図書館に着くところ）は45分で、マス目の角ではないので、ここでは読まない<div class="qd-big">兄：y ＝ 1/15 x</div>（x ＝ 45 で y ＝ 3 → 45分で図書館 ✓）', false)
    + qdStep('STEP 2　妹の式：まず傾き（タップ）', '妹の線がマス目の角をぴったり通るのは <b>(20, 0)</b>（出発）と <b>(40, 3)</b>（図書館に着く）。<br>(20, 0) から (40, 3) は <b>右に20分で上に3km</b> → 傾き ＝ 3 ÷ 20 ＝ <b>3/20</b>', false)
    + qdStep('STEP 3　妹の切片（ここがポイント・タップ）', '妹は8時にはまだ家にいて、20分に出発している。だから線が <b>y軸（8時のたて線）までとどいていない</b> → 切片は<b>グラフで読めない</b>。こういうときは、次のどちらかで出す。' + '<div class="qd-big">方法①　通る点の数字を式に入れる</div>' + '1. 切片がわからないので、いったん <b>y ＝ 3/20 x ＋ b</b> と書く（b が切片）<br>2. 線が通る点 <b>(20, 0)</b> の x に 20、y に 0 を入れる<br>　0 ＝ 3/20 × 20 ＋ b<br>　0 ＝ 3 ＋ b<br>　<b>b ＝ −3</b><br>3. 確かめ：もう1つの点 (40, 3) を入れると 3/20 × 40 − 3 ＝ 6 − 3 ＝ 3 → ぴったり ✓' + '<div class="qd-big">方法②　線を y軸までのばしてみる</div>' + qdGraph({ xmin:0, xmax:50, ymin:-3.5, ymax:3.5, sx:6.4, sy:34, gx:10, gy:0.5, xl:'（分）', yl:'（km）', maxw:420, xt:[[20,'20'],[40,'40']], yt:[[3,'3'],[2,'2'],[1,'1'],[-1,'−1'],[-2,'−2'],[-3,'−3']], lines:[{a:3/20,b:-3,x1:20,x2:40,color:'#4aa8ff',label:'妹',ly:-6},{a:3/20,b:-3,x1:0,x2:20,color:'#4aa8ff',dash:true}], stairs:[{from:[0,-3],dx:20,dy:3,tr:'左に20分もどる',tu:'下に3km'}], pts:[{x:20,y:0,color:'#4aa8ff',label:'(20, 0)',dx:8,dy:-8},{x:40,y:3,color:'#4aa8ff',label:'(40, 3)',dx:-58,dy:-4},{x:0,y:-3,color:'#ffd84d',label:'切片 −3',dx:8,dy:-8}] }) + '妹の線は「右に20分で上に3km」の坂。<b>逆にたどると「左に20分もどると下に3km」</b>。<br>(20, 0) から左に20分もどると x ＝ 0（y軸）に着いて、そこで下に3 → <b>y軸の −3</b> でぶつかる（点線）。<br>だから<b>切片は −3</b>。' + '<div class="note">💡 切片がマイナスでも大丈夫。「8時に −3km にいた」わけではなく、式の上で線をのばしたときの数字。<br>💡 切片 ＝「y軸とぶつかる目盛り」。ぶつかっていなければ、①計算するか ②のばす。</div>' + '<div class="qd-big">妹：y ＝ 3/20 x − 3</div>', false)
    + qdStep('STEP 4　追いつく ＝ 2本の線の交点（タップ）', '1/15 x ＝ 3/20 x − 3<br>分母15と20の最小公倍数 <b>60</b> をかける：4x ＝ 9x − 180<br>→ −5x ＝ −180 → <b>x ＝ 36</b><br>y ＝ 1/15 × 36 ＝ 36/15 ＝ <b>12/5（＝2.4）</b>', false)
    + qdStep('STEP 5　問題の聞き方に合わせて答える（タップ）', 'x は「8時から何分たったか」→ 36分 → <b>8時36分</b><br>y は「家からの道のり（km）」→ <b>12/5 km（2.4km）</b>', false)
    + '<div class="qd-ans">答え　8時36分、家から 12/5 km（2.4km）の地点</div>'
    + '</div>';

  // ---------- PART 4：動く点と二次方程式 ----------
  html += '<div class="qd-part">PART 4　動く点と面積 → 二次方程式（プリント(6)）</div>';
  var tri = '<svg viewBox="0 0 360 215" style="width:100%;max-width:480px;display:block;margin:8px auto;background:#0f1520;border-radius:10px">'
    + '<polygon points="40,20 40,62 100,170 310,170" fill="rgba(74,168,255,0.35)" stroke="#4aa8ff" stroke-width="2"/>'
    + '<polygon points="40,62 40,170 100,170" fill="rgba(255,122,69,0.4)" stroke="#ff7a45" stroke-width="2"/>'
    + '<polygon points="40,20 40,170 310,170" fill="none" stroke="#e6edf3" stroke-width="2.5"/>'
    + '<rect x="40" y="158" width="12" height="12" fill="none" stroke="#e6edf3"/>'
    + '<text x="28" y="20" fill="#e6edf3" font-size="15" font-weight="bold">A</text><text x="24" y="185" fill="#e6edf3" font-size="15" font-weight="bold">B</text><text x="316" y="185" fill="#e6edf3" font-size="15" font-weight="bold">C</text>'
    + '<text x="24" y="66" fill="#ffd84d" font-size="15" font-weight="bold">P</text><text x="94" y="190" fill="#ffd84d" font-size="15" font-weight="bold">Q</text>'
    + '<text x="46" y="44" fill="#ffd84d" font-size="13" font-weight="bold">x</text>'
    + '<text x="46" y="122" fill="#ff7a45" font-size="13" font-weight="bold">9−x</text>'
    + '<text x="62" y="205" fill="#ff7a45" font-size="13" font-weight="bold">2x</text>'
    + '<text x="180" y="120" fill="#4aa8ff" font-size="13" font-weight="bold">四角形APQC</text>'
    + '<text x="4" y="100" fill="#9aa4b2" font-size="12">9cm</text><text x="170" y="210" fill="#9aa4b2" font-size="12">BC ＝ 18cm</text>'
    + '</svg>';
  html += '<div class="rule-card"><div class="rule-card-title">📐 x 秒後の長さを、x を使って書く</div>'
    + tri
    + '<div class="ex">P は A から B へ<b>毎秒1cm</b>、Q は B から C へ<b>毎秒2cm</b>。ABは9cm、BCは18cm、∠B＝90°。</div>'
    + qdStep('STEP 1　x 秒後の長さ（タップ）', 'AP ＝ 1 × x ＝ <b>x</b> cm<br>PB ＝ 9 − x cm（AB全体の9cmから AP を引く）<br>BQ ＝ 2 × x ＝ <b>2x</b> cm<div class="note">⚠️ 三角形PBQで使うのは <b>AP（x）ではなく PB（9−x）</b>。ここがいちばんまちがえやすい！</div>', false)
    + qdStep('STEP 2　四角形は「大きい三角形 − 小さい三角形」（タップ）', '四角形APQCはそのままでは面積が出しにくい。<br><b>△ABC 全体から、△PBQ を切り取った形</b>と考える。<br>△ABC ＝ 18 × 9 ÷ 2 ＝ <b>81</b> cm²<br>△PBQ ＝ （底辺 BQ）×（高さ PB）÷ 2 ＝ 2x × (9 − x) ÷ 2 ＝ <b>x(9 − x)</b>', false)
    + qdStep('STEP 3　方程式を作る（タップ）', '<div class="qd-big">81 − x(9 − x) ＝ 67</div>x(9 − x) ＝ 81 − 67 ＝ 14<br>9x − x² ＝ 14<br>全部を左に集めて整える：<b>x² − 9x ＋ 14 ＝ 0</b>', false)
    + qdStep('STEP 4　因数分解で解く（タップ）', '足して −9、かけて 14 になる2つの数 → <b>−2 と −7</b><br>(x − 2)(x − 7) ＝ 0 → <b>x ＝ 2, 7</b>', false)
    + qdStep('STEP 5　その答え、本当に使える？（範囲チェック・タップ）', 'P が B に着くのは 9 ÷ 1 ＝ 9秒後、Q が C に着くのは 18 ÷ 2 ＝ 9秒後 → x は <b>0〜9秒</b>の間だけ。<br>2 も 7 もこの中なので、<b>どちらも答え</b>。<br>確かめ：x＝2 → △PBQ ＝ 4×7÷2 ＝ 14、x＝7 → △PBQ ＝ 14×2÷2 ＝ 14 → どちらも 81−14＝67 ✓<div class="note">💡 範囲の外に出た答え（たとえば 11秒）は「不適」として消す。</div>', false)
    + '<div class="qd-ans">答え　2秒後と7秒後</div>'
    + '</div>';

  // ---------- 練習 ----------
  html += '<div class="qd-part">練習問題（同じ考え方で解けるか確認）</div>';
  function E(rule, ok, ng, tip) { return '<span class="exp-rule"><span class="label">📐 ルール</span>' + rule + '</span><span class="exp-ok">✅ ' + ok + '</span>' + (ng ? '<span class="exp-ng">❌ ' + ng + '</span>' : '') + '<span class="exp-tip">💡 ' + tip + '</span>'; }
  var qs = [
    { q:'下のグラフの直線の式は？' + qdGrid({ lines:[{a:1,b:1,color:'#ff7a45'}], pts:[{x:0,y:1,color:'#ff7a45'},{x:1,y:2,color:'#ff7a45'}], maxw:300 }),
      a:'y ＝ x ＋ 1', choices:['y ＝ x ＋ 1','y ＝ x − 1','y ＝ 2x ＋ 1','y ＝ −x ＋ 1'],
      exp:E('切片 ＝ y軸とぶつかるところ、傾き ＝ 右1マスで上にいくつ', 'y軸の1を通る → 切片1。右に1で上に1 → 傾き1', '切片を x軸とぶつかるところ（−1）で読まない', 'y軸（たて）で読む') },
    { q:'下のグラフの直線の式は？' + qdGrid({ lines:[{a:-2,b:3,color:'#ff7a45'}], pts:[{x:0,y:3,color:'#ff7a45'},{x:1,y:1,color:'#ff7a45'}], stairs:[{from:[0,3],dx:1,dy:-2,tr:'右に1',tu:'下に2'}], maxw:300 }),
      a:'y ＝ −2x ＋ 3', choices:['y ＝ −2x ＋ 3','y ＝ 2x ＋ 3','y ＝ −2x − 3','y ＝ 3x − 2'],
      exp:E('右下がりなら傾きはマイナス', '切片3、右に1で下に2 → 傾き −2', '下がっているのに 2 にしない', '「下に」はマイナス') },
    { q:'下のグラフの直線の式は？' + qdGrid({ lines:[{a:0.5,b:-1,color:'#ff7a45'}], pts:[{x:0,y:-1,color:'#ff7a45'},{x:2,y:0,color:'#ff7a45'}], maxw:300 }),
      a:'y ＝ 1/2 x − 1', choices:['y ＝ 1/2 x − 1','y ＝ 2x − 1','y ＝ 1/2 x ＋ 2','y ＝ −1/2 x − 1'],
      exp:E('角をぴったり通る点を使う', '(0, −1) から (2, 0)：右に2で上に1 → 傾き 1/2、切片 −1', '「右÷上」で 2 にしない（上÷右）', 'ゆるい坂は分数の傾き') },
    { q:'2直線 y ＝ x ＋ 1 と y ＝ −x ＋ 4 の交点の座標は？', a:'(3/2, 5/2)', choices:['(3/2, 5/2)','(5/2, 3/2)','(3, 4)','(1, 2)'],
      exp:E('右辺どうしを ＝ でつなぐ', 'x ＋ 1 ＝ −x ＋ 4 → 2x ＝ 3 → x ＝ 3/2、y ＝ 3/2 ＋ 1 ＝ 5/2', 'x と y を入れかえない', '目盛りで読めない交点は計算で') },
    { q:'兄は8時に家を出て y ＝ 1/15 x（x分後の道のり y km）で進む。妹は8時10分に出発し y ＝ 3/20 x − 3/2 で進む。妹が兄に追いつく時刻は？', a:'8時18分', choices:['8時18分','8時10分','8時36分','8時30分'],
      exp:E('追いつく ＝ 2つの式の交点', '1/15 x ＝ 3/20 x − 3/2 → 60倍して 4x ＝ 9x − 90 → x ＝ 18 → 8時18分（道のり 18/15 ＝ 1.2km）', 'x は「8時から何分後か」', '分数は分母の最小公倍数をかけて消す') },
    { q:'プリント(6)で、x 秒後の PB の長さは？', a:'9 − x (cm)', choices:['9 − x (cm)','x (cm)','2x (cm)','18 − 2x (cm)'],
      exp:E('PB ＝ AB − AP', '9 − x', 'x は AP の長さ', '三角形PBQ に使うのは PB') },
    { q:'プリント(6)で、△PBQ の面積を x で表すと？', a:'x(9 − x)', choices:['x(9 − x)','2x(9 − x)','x × 2x ÷ 2','(9 − x) ÷ 2'],
      exp:E('底辺 BQ ＝ 2x、高さ PB ＝ 9 − x', '2x × (9 − x) ÷ 2 ＝ x(9 − x)', '÷2 を忘れると 2x(9 − x)', '三角形は ÷2') },
    { q:'【類題】AB＝6cm、BC＝12cm、∠B＝90° の直角三角形。P は A→B を毎秒1cm、Q は B→C を毎秒2cm で同時に出発。四角形APQC が 28cm² になるのは何秒後？', a:'2秒後と4秒後', choices:['2秒後と4秒後','2秒後だけ','4秒後だけ','3秒後'],
      exp:E('△ABC − △PBQ ＝ 28', '36 − x(6 − x) ＝ 28 → x² − 6x ＋ 8 ＝ 0 → (x−2)(x−4) ＝ 0。範囲は0〜6秒なので両方OK', '1つだけ答えない', '最後に範囲チェック') },
    { q:'【類題・難】AB＝8cm、BC＝12cm、∠B＝90°。P は A→B を毎秒1cm、Q は B→C を毎秒3cm で同時に出発（Q は C に着いたら止まる）。四角形APQC が 30cm² になるのは何秒後？', a:'2秒後', choices:['2秒後','2秒後と6秒後','6秒後','4秒後'],
      exp:E('Q が C に着くのは 12 ÷ 3 ＝ 4秒後 → x は 0〜4秒', '48 − 3x(8 − x) ÷ 2 ＝ 30 → x² − 8x ＋ 12 ＝ 0 → x ＝ 2, 6。6秒は範囲外なので不適', '6秒後もそのまま答えにしない', '「本当に動いている時間か」を必ず確認') },
    { q:'【切片の練習】傾きが2で、点 (2, 1) を通る直線の式は？', a:'y ＝ 2x − 3', choices:['y ＝ 2x − 3','y ＝ 2x ＋ 1','y ＝ 2x ＋ 3','y ＝ x ＋ 1'],
      exp:E('y ＝ 2x ＋ b に通る点を入れて b を出す', '1 ＝ 2×2 ＋ b → 1 ＝ 4 ＋ b → b ＝ −3', '通る点の y（1）をそのまま切片にしない', '点を入れる → b だけの方程式になる') },
    { q:'【切片の練習】点 (10, 0) と点 (30, 2) を通る直線の式は？（横が分、たてがkmのグラフ）', a:'y ＝ 1/10 x − 1', choices:['y ＝ 1/10 x − 1','y ＝ 1/10 x','y ＝ 10x − 1','y ＝ 1/10 x ＋ 10'],
      exp:E('先に傾き、次に点を入れて切片', '傾き 2÷20＝1/10 → 0 ＝ 1/10×10 ＋ b → b ＝ −1', '線が原点を通っていないのに切片0にしない', '線をのばすと「左に10もどって下に1」→ y軸で −1') },
    { q:'【切片の練習】点 (1, 5) と点 (3, 9) を通る直線の式は？', a:'y ＝ 2x ＋ 3', choices:['y ＝ 2x ＋ 3','y ＝ 2x ＋ 5','y ＝ 4x ＋ 1','y ＝ 2x − 3'],
      exp:E('傾き → 点を入れて切片', '傾き (9−5)÷(3−1)＝2 → 5 ＝ 2×1 ＋ b → b ＝ 3', '5 は x＝1 のときの y。切片（x＝0 のとき）ではない', '確かめ：(3, 9) を入れて 6＋3＝9 ✓') },
  ];
  qs.forEach(function(q, i) { q._qid = 'math_quad_s8_q' + i; });
  html += '<div class="practice-section">';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q.replace(/<svg[\s\S]*<\/svg>/, '（グラフ）'), choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
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
    { q:'x²+7x+10=0を解の公式で解くと？', sub:'b²−4ac=49-40=9', a:'x=-2, -5', choices:['x=-2, -5','x=2, 5','x=-2, 5','x=-1, -10'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=49-40=9。x=(-7±3)/2 → x=-2, -5</span><span class="exp-tip">💡 √の中（b²−4ac）が9のきれいなパターン！</span>' },
    { q:'x²-5x+4=0を解の公式で解くと？', sub:'b²−4ac=25-16=9', a:'x=1, 4', choices:['x=1, 4','x=-1, -4','x=1, -4','x=2, 2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25-16=9。x=(5±3)/2 → x=4, 1</span><span class="exp-tip">💡 -b=5であることに注意！</span>' },
    { q:'x²-4x+4=0を解の公式で解くと？', sub:'b²−4ac=16-16=0（重解）', a:'x=2（重解）', choices:['x=2（重解）','x=-2（重解）','x=4（重解）','x=2, -2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=0。x=4/2=2（重解）</span><span class="exp-tip">💡 √の中（b²−4ac）が0なら解は1つだけ！</span>' },
    { q:'2x²+7x+3=0を解の公式で解くと？', sub:'a=2。b²−4ac=49-24=25', a:'x=-1/2, -3', choices:['x=-1/2, -3','x=1/2, 3','x=-1/2, 3','x=1/2, -3'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=49-24=25。x=(-7±5)/4 → x=-1/2, -3</span><span class="exp-tip">💡 分母4を忘れずに！</span>' },
    { q:'3x²+5x+2=0を解の公式で解くと？', sub:'a=3。b²−4ac=25-24=1', a:'x=-2/3, -1', choices:['x=-2/3, -1','x=2/3, 1','x=-2/3, 1','x=2/3, -1'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25-24=1。x=(-5±1)/6 → x=-2/3, -1</span><span class="exp-tip">💡 分母6できちんと約分する！</span>' },
    { q:'x²-9=0を解の公式で解くと？', sub:'b=0。b²−4ac=0+36=36', a:'x=±3', choices:['x=±3','x=±9','x=3','x=±6'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=36。x=(0±6)/2=±3</span><span class="exp-tip">💡 √36=6ときれいな数に！</span>' },
    { q:'2x²-5x=0を解の公式で解くと？', sub:'c=0。b²−4ac=25-0=25', a:'x=0, 5/2', choices:['x=0, 5/2','x=0, -5/2','x=5/2','x=2, 5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=25。x=(5±5)/4 → x=0, 5/2</span><span class="exp-tip">💡 c=0のときは解の1つが必ず0！</span>' },
    { q:'x²+2x-2=0を解の公式で解くと？', sub:'b²−4ac=4+8=12=4×3', a:'x=-1±√3', choices:['x=-1±√3','x=1±√3','x=-1±2√3','x=-2±√3'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=12。x=(-2±2√3)/2 → x=-1±√3</span><span class="exp-tip">💡 √12=2√3、分子全体を2で割る！</span>' },
    { q:'x²-6x+7=0を解の公式で解くと？', sub:'b²−4ac=36-28=8=4×2', a:'x=3±√2', choices:['x=3±√2','x=-3±√2','x=3±2√2','x=6±√2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=8。x=(6±2√2)/2 → x=3±√2</span><span class="exp-tip">💡 √8=2√2！</span>' },
    { q:'x²+4x-1=0を解の公式で解くと？', sub:'b²−4ac=16+4=20=4×5', a:'x=-2±√5', choices:['x=-2±√5','x=2±√5','x=-2±2√5','x=-4±√5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=20。x=(-4±2√5)/2 → x=-2±√5</span><span class="exp-tip">💡 √20=2√5！</span>' },
    { q:'x²-2x-1=0を解の公式で解くと？', sub:'b²−4ac=4+4=8=4×2', a:'x=1±√2', choices:['x=1±√2','x=-1±√2','x=1±2√2','x=2±√2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=8。x=(2±2√2)/2 → x=1±√2</span><span class="exp-tip">💡 分子全体を2で割るのを忘れずに！</span>' },
    { q:'x²+2x-4=0を解の公式で解くと？', sub:'b²−4ac=4+16=20=4×5', a:'x=-1±√5', choices:['x=-1±√5','x=1±√5','x=-1±2√5','x=-2±√5'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=20。x=(-2±2√5)/2 → x=-1±√5</span><span class="exp-tip">💡 √20=2√5！</span>' },
    { q:'x²-8x+13=0を解の公式で解くと？', sub:'b²−4ac=64-52=12=4×3', a:'x=4±√3', choices:['x=4±√3','x=-4±√3','x=4±2√3','x=8±√3'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=12。x=(8±2√3)/2 → x=4±√3</span><span class="exp-tip">💡 √12=2√3！</span>' },
    { q:'2x²+2x-1=0を解の公式で解くと？', sub:'a=2。b²−4ac=4+8=12=4×3', a:'x=(-1±√3)/2', choices:['x=(-1±√3)/2','x=-1±√3','x=(-1±√3)/4','x=(-2±√3)/2'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=12。x=(-2±2√3)/4 → 分子分母を2で割り x=(-1±√3)/2</span><span class="exp-tip">💡 分母4も約分の対象になる場合がある！</span>' },
    { q:'x²+6x+2=0を解の公式で解くと？', sub:'b²−4ac=36-8=28=4×7', a:'x=-3±√7', choices:['x=-3±√7','x=3±√7','x=-3±2√7','x=-6±√7'], exp:'<span class="exp-rule"><span class="label">📐 手順</span>b²-4ac=28。x=(-6±2√7)/2 → x=-3±√7</span><span class="exp-tip">💡 √28=2√7！</span>' },
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
goSection(location.hash === '#taisaku' ? 8 : 0);
