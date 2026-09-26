// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「正負の数？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺数学できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「正負の数で漫才できるかもしれない」' },
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
var answeredSet  = JSON.parse(localStorage.getItem('math_nums_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('math_nums_sections') || '{}');
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
  localStorage.setItem('math_nums_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('math_nums_') === 0 && getPct(id) < 80;
  });
}
function renderWeakBar() {
  var wqs = getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,8);
  var el = document.getElementById('weakItems');
  if (!el) return;
  if (wqs.length === 0) { el.innerHTML = '<span class="weak-bar-empty">弱点なし — よくできています！</span>'; return; }
  el.innerHTML = wqs.map(function(qid) {
    var d = weakDB[qid];
    return '<div class="weak-item"><span class="weak-item-word">' + (d.jp || (qMeta[qid] && qMeta[qid].jp) || qid) + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect) {
  if (!weakDB[qid]) weakDB[qid] = {
    jp: (qMeta[qid] && qMeta[qid].jp) || '',
    answer: (qMeta[qid] && qMeta[qid].answer) || '',
    choices: (qMeta[qid] && qMeta[qid].choices) || [],
    correct: 0, total: 0
  };
  if (qMeta[qid] && qMeta[qid].jp) weakDB[qid].jp = qMeta[qid].jp;
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

// ===== QUESTION ENGINE =====
function makeChoices(qid, choices, answer, xpPts, jp) {
  var _jp = jp || (qMeta[qid] && qMeta[qid].jp) || '';
  choices = shuffleArray(choices);
  qMeta[qid] = { type: 'choice', answer: answer, xp: xpPts, choices: choices, jp: _jp };
  if (answeredSet[qid]) {
    return '<div class="choices">' + choices.map(function(c) {
      return '<button class="choice-btn' + (c === answer ? ' show-correct' : '') + '" disabled>' + c + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="choices">' + choices.map(function(c) {
    return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
  }).join('') + '</div>';
}

function makeInput(qid, answer, xpPts, jp) {
  var _jp = jp || (qMeta[qid] && qMeta[qid].jp) || '';
  qMeta[qid] = { type: 'input', answer: answer, xp: xpPts, jp: _jp };
  if (answeredSet[qid]) {
    return '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"></div>';
  }
  return '<div class="input-wrap"><input class="q-input" id="inp_' + qid + '" type="text" placeholder="答えを入力...">'
    + '<button class="input-submit" data-qid="' + qid + '">確認</button></div>';
}

function flexMatch(input, answer) {
  var norm = function(s) { return s.toString().trim().replace(/\s+/g,'').replace(/[−ー]/g,'-').replace(/[＋]/g,'+'); };
  var ni = norm(input), na = norm(answer);
  if (ni === na) return true;
  if (na.charAt(0) === '+' && ni === na.slice(1)) return true;
  return false;
}

function handleInput(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  var inp = document.getElementById('inp_' + qid);
  if (!inp) return;
  var val = inp.value.trim();
  if (!val) { showToast('答えを入力してください！'); return; }
  if (flexMatch(val, meta.answer)) {
    inp.style.borderColor = 'var(--green)';
    markCorrect(qid, meta);
  } else {
    inp.style.borderColor = 'var(--red)';
    markWrong(qid, meta, val);
    inp.select();
  }
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
  var inp = document.getElementById('inp_' + qid);
  if (inp) {
    inp.disabled = true; inp.style.borderColor = 'var(--green)';
    var sb = document.querySelector('.input-submit[data-qid="' + qid + '"]');
    if (sb) sb.style.display = 'none';
  }
  if (lvUp) {
    setTimeout(function() {
      var lv = getLevel(xp);
      showToast('🎉 昇格！ ' + lv.badge + '　きょん「昇格したわ！！」', 'levelup');
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
  var msgs = [
    'きょん「あれ！間違えた！でも次は大丈夫！！」',
    'きょん「また間違えた…！まだまだ大丈夫！！」',
    'きょん「何回間違えてんの！！にっくん助けて！！」',
  ];
  var msg = msgs[Math.min(msgs.length - 1, attemptCounts[qid] - 1)];
  if (demoted) {
    setTimeout(function() { showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」', 'demote'); }, 200);
  } else {
    setTimeout(function() { showToast(msg); }, 100);
  }
}

function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  localStorage.setItem('math_nums_answered', JSON.stringify(answeredSet));
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
  var prefix = 'math_nums_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_nums_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb && nb.style.display === 'none') {
      nb.style.display = 'block';
      if (!document.getElementById('secCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 4 ? 'Section ' + (currentSection + 1) + ' へ進もう！' : '確認テストへ挑戦！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(163,113,247,0.12),rgba(14,165,233,0.08));border:1px solid var(--purple);border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--purple);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
          + '<div style="font-size:14px;color:var(--text2)">きょん「全問解いた！！にっくん、俺やれるじゃん！！」</div>'
          + '<div style="font-size:13px;color:var(--text2);margin-top:4px">西村「よくやった。' + nextMsg + '」</div>'
          + '</div>';
        nb.parentNode.insertBefore(banner, nb);
        setTimeout(function(){ banner.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200);
      }
    }
  }
}

// ===== SECTIONS DEF =====
var SECTIONS = [
  { id:0, label:'🔢 スタート',   title:'正の数・負の数',   sub:'中1数学の出発点。マイナスの世界へようこそ！' },
  { id:1, label:'基本',          title:'正負の数の基本',    sub:'正の数・負の数・絶対値・数直線をマスターしよう' },
  { id:2, label:'加法・減法',    title:'加法と減法',        sub:'正負の数のたし算・ひき算のルール' },
  { id:3, label:'乗法・除法',    title:'乗法と除法',        sub:'正負の数のかけ算・わり算のルール' },
  { id:4, label:'確認テスト',    title:'確認テスト',        sub:'全セクションの総まとめ！何問正解できる？' },
  { id:5, label:'📊弱点',        title:'弱点ノート',        sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',        title:'弱点特訓モード',    sub:'弱点問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab';
    if (s.id >= 5) cls += ' tokku';
    if (s.id === currentSection) cls += ' active';
    if (sectionDone[s.id] && s.id < 5) cls += ' done';
    var label = s.label + (sectionDone[s.id] && s.id < 5 ? ' ✓' : '');
    if (s.id === 6) {
      var wk = getWeakQuestions();
      label = '🔥特訓' + (wk.length > 0 ? '(' + wk.length + ')' : '');
    }
    html += '<button class="section-tab' + (s.id >= 5 ? ' tokku' : '') + (s.id === currentSection ? ' active' : '') + (sectionDone[s.id] && s.id < 5 ? ' done' : '') + '" data-sid="' + s.id + '">' + label + '</button>';
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
  // Progress dots
  html += '<div class="progress-dots">';
  for (var i = 0; i <= 4; i++) {
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  // Header
  html += '<div class="section-header">'
    + '<div class="section-badge">数学 CH.1 · SECTION ' + id + '</div>'
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
    var nextAction = id < 4 ? 'goSection(' + (id + 1) + ')' : 'showFinalResult()';
    html += '<button class="next-section-btn" id="nextBtn" style="display:none" onclick="' + nextAction + '">' + nextLabel + '</button>';
  }

  document.getElementById('mainContent').innerHTML = html;

  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleChoice(btn.dataset.qid, btn.dataset.choice); });
  });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { showAnswer(btn.dataset.qid); });
  });
  document.querySelectorAll('.input-submit[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleInput(btn.dataset.qid); });
  });
  document.querySelectorAll('.q-input[id^="inp_"]').forEach(function(inp) {
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleInput(inp.id.replace('inp_', ''));
    });
  });

  if (sectionDone[id]) {
    var nb = document.getElementById('nextBtn');
    if (nb) nb.style.display = 'block';
  }
  checkSectionComplete();
}

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん、マイナスって何なの？お金とか温度でよく聞くけど、なんか不思議じゃない？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">いいところに気づいた。「正の数・負の数」は中学数学の出発点。0より大きければ正の数、0より小さければ負の数。温度の0℃より低い「−3℃」も、貯金残高がマイナスになる「−1000円」も全部これで表せる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">マイナスって「借金」みたいなイメージかな？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">まさにそれ。プラスが「持っているもの」、マイナスが「借りているもの」。数直線を使うと左右で表せる——0の右が正、左が負。この仕組みを覚えると、加法・減法・乗法・除法のルールが全部スッキリわかる。</div></div></div>'
    + '</div>'
    + '<button class="start-btn" onclick="goSection(1)">📐 Section 1 から始める →</button>';
}

// ===== SECTION 1: 正負の数の基本 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">絶対値って何？絶対値が大きいほど強い、みたいな？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">近い！絶対値は「0からの距離」。+3も−3も、0から3だけ離れているから絶対値は両方3。符号（＋か−か）は関係なく、大きさだけを表す。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">じゃあ−100の絶対値は100？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">正解。絶対値は必ず0以上の数になる。記号は |−100| = 100 と書く。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 正の数・負の数のルール</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">定義</div>'
    + '<div class="ex">正の数：0より大きい数。＋をつけて表す（例：+3, +0.5）</div>'
    + '<div class="ex">負の数：0より小さい数。−をつけて表す（例：−3, −0.5）</div>'
    + '<div class="ex">0は正でも負でもない</div>'
    + '<div class="note">💡 中学から「−（マイナス）」が登場！小学校は0以上の数しかなかった</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">数直線</div>'
    + '<div class="ex">← 負の数　　0　　正の数 →</div>'
    + '<div class="ex">右にいくほど大きい。左にいくほど小さい</div>'
    + '<div class="ex">例：−3 ＜ −1 ＜ 0 ＜ +2 ＜ +5</div>'
    + '<div class="note">⚠️ −3は−1より小さい！「数が大きい＝数直線で右」</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">絶対値</div>'
    + '<div class="ex">絶対値 = 数直線上で0からの距離（符号を無視した大きさ）</div>'
    + '<div class="ex">|+5| = 5　　|−5| = 5　　|0| = 0</div>'
    + '<div class="note">💡 絶対値は必ず0以上。プラスもマイナスも「大きさ」は同じ場合がある</div>'
    + '</div>'
    + '</div>';

  var qs = [
    {
      q: '−7の絶対値はいくつ？',
      sub: '絶対値 = 0からの距離（符号を外した大きさ）',
      a: '7',
      choices: ['7', '−7', '0', '14'],
      jp: '−7の絶対値',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>絶対値は0からの距離。符号（＋−）を取り除いた数</span><span class="exp-ok">✅ |−7| = 7（マイナスを外すだけ）</span><span class="exp-ng">❌ −7ではない。絶対値は必ず0以上</span><span class="exp-tip">💡 |+7| も |−7| も 絶対値は同じ 7 ！</span>'
    },
    {
      q: '次のうち、最も小さい数はどれ？',
      sub: '数直線で最も左にある数が最小',
      a: '−5',
      choices: ['−5', '−2', '0', '+3'],
      jp: '最小の数の選択',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>数直線で左にあるほど小さい → 負の数は0より小さく、絶対値が大きいほど小さい</span><span class="exp-ok">✅ −5 ＜ −2 ＜ 0 ＜ +3 なので最小は −5</span><span class="exp-tip">💡 「マイナスの数は絶対値が大きいほど小さい」！これが逆に感じるポイント</span>'
    },
    {
      q: '−3より大きく、+2より小さい整数は何個ある？',
      sub: '整数とは …−2, −1, 0, 1, 2… のような数',
      a: '4個',
      choices: ['3個', '4個', '5個', '6個'],
      jp: '−3と+2の間の整数の個数',
      exp: '<span class="exp-rule"><span class="label">📐 考え方</span>−3より大きく+2より小さい整数：−2, −1, 0, +1 の4つ</span><span class="exp-ok">✅ −3と+2は含まない（「より大きく」「より小さい」だから）</span><span class="exp-tip">💡 「以上・以下」は端を含む。「より大きい・より小さい」は端を含まない！</span>'
    },
    {
      q: '絶対値が4である数をすべて答えると？',
      sub: '0から距離が4の点は数直線上に2つある',
      a: '+4と−4',
      choices: ['+4と−4', '+4だけ', '−4だけ', '0と4'],
      jp: '絶対値が4の数',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>絶対値が4 → 0から距離4の点は2つ：+4 と −4</span><span class="exp-ok">✅ |+4| = 4 かつ |−4| = 4</span><span class="exp-tip">💡 0の絶対値だけは1つ（|0| = 0）。それ以外は正負の2つ！</span>'
    },
    {
      q: '次の数を小さい順に並べると：−1, +3, −5, 0, +1',
      sub: '数直線で左から右に並べよう',
      a: '−5, −1, 0, +1, +3',
      choices: ['−5, −1, 0, +1, +3', '+3, +1, 0, −1, −5', '−1, −5, 0, +1, +3', '0, −1, +1, −5, +3'],
      jp: '正負の数を小さい順に並べる',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>数直線の左から右の順に並べると小さい順になる</span><span class="exp-ok">✅ −5 ＜ −1 ＜ 0 ＜ +1 ＜ +3</span><span class="exp-tip">💡 負の数は「絶対値が大きいほど小さい」。−5は−1よりずっと左！</span>'
    },
    {
      q: '「海抜−30m」は海面から何mの位置？',
      sub: '海抜0m = 海面の高さ',
      a: '海面より30m低い',
      choices: ['海面より30m低い', '海面より30m高い', '海面と同じ高さ', '地下30km'],
      jp: '海抜−30mの意味',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>正の数 = 基準より多い・高い・上。負の数 = 基準より少ない・低い・下</span><span class="exp-ok">✅ 海抜−30m → 海面(0)より30m低い位置（死海など）</span><span class="exp-tip">💡 気温−5℃も「0℃より5度低い」。負の数は「基準より下」の表現！</span>'
    },
    {
      q: '−8と+8を比べると？',
      sub: '符号と大きさの両方に注目',
      a: '−8 ＜ +8（+8の方が大きい）',
      choices: ['−8 ＜ +8（+8の方が大きい）', '−8 ＞ +8（−8の方が大きい）', '−8 = +8（同じ大きさ）', '比べられない'],
      jp: '−8と+8の大小比較',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>負の数は正の数より常に小さい。0より左にあるから</span><span class="exp-ok">✅ −8 ＜ 0 ＜ +8 なので −8 ＜ +8</span><span class="exp-tip">💡 絶対値は同じ8でも、−8の方がずっと小さい。「大きさ」と「大小」は違う！</span>'
    },
    {
      q: '自然数とはどれ？',
      sub: '中学で使う数の分類',
      a: '正の整数（1, 2, 3, …）',
      choices: ['正の整数（1, 2, 3, …）', '0と正の整数', '負の整数も含む整数全体', '小数も含む'],
      jp: '自然数の定義',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>自然数 = 1, 2, 3, … の正の整数（0は含まない）</span><span class="exp-ok">✅ 自然数 ⊂ 整数 ⊂ 有理数 という包含関係になる</span><span class="exp-tip">💡 0は整数だが自然数ではない！小学校で習った「1から始まる数」が自然数</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'math_nums_s1_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 正負の数の基本</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:4, jp:q.jp, choices:q.choices };
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

// ===== SECTION 2: 加法・減法 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">（+3）+（−5）って…どっちの符号が勝つの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">絶対値が大きい方の符号が答えの符号になる。+3と−5なら絶対値は3と5。5の方が大きいからマイナスが勝って、差は5−3=2。だから答えは−2。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">減法って、符号を変えて加法にするの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">正解。A−B = A+（−B）。引く数の符号を変えてたし算に直す。これで加法と減法を統一して考えられる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 加法のルール</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">同符号の和（符号が同じ）</div>'
    + '<div class="ex">（+a）+（+b）= +（a+b）　例：(+3)+(+4) = +7</div>'
    + '<div class="ex">（−a）+（−b）= −（a+b）　例：(−3)+(−4) = −7</div>'
    + '<div class="note">💡 同符号：符号はそのまま、絶対値をたし算</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">異符号の和（符号が違う）</div>'
    + '<div class="ex">絶対値の大きい方の符号 + 絶対値の差</div>'
    + '<div class="ex">例：(+5)+(−3) = +(5−3) = +2</div>'
    + '<div class="ex">例：(+2)+(−6) = −(6−2) = −4</div>'
    + '<div class="note">⚠️ 絶対値の大きい方の符号が答えの符号！差を計算する</div>'
    + '</div>'
    + '</div>'
    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 減法のルール</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">引く数の符号を変えて加法に直す</div>'
    + '<div class="ex">A − B = A + (−B)</div>'
    + '<div class="ex">例：(+5) − (+3) = (+5) + (−3) = +2</div>'
    + '<div class="ex">例：(+2) − (−4) = (+2) + (+4) = +6</div>'
    + '<div class="note">💡 「マイナス×マイナス = プラス」→ −(−4) = +4 ！ここが最重要ポイント</div>'
    + '</div>'
    + '</div>';

  var qs = [
    {
      q: '(+4) + (−7) を計算すると？',
      sub: '異符号の和：絶対値の大きい方の符号、差を計算',
      a: '−3',
      choices: ['−3', '+3', '+11', '−11'],
      jp: '(+4)+(−7)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>異符号の和 → 絶対値の大きい方の符号 + 絶対値の差</span><span class="exp-ok">✅ 絶対値は4と7。7の方が大きいから「−」。差は7−4=3 → −3</span><span class="exp-tip">💡 「どちらが絶対値大きい？」→ その符号が答えの符号！</span>'
    },
    {
      q: '(−3) + (−8) を計算すると？',
      sub: '同符号の和：符号はそのまま、絶対値をたし算',
      a: '−11',
      choices: ['−11', '+11', '−5', '+5'],
      jp: '(−3)+(−8)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>同符号の和 → 符号はそのまま、絶対値をたす</span><span class="exp-ok">✅ 両方マイナス → 符号は「−」。絶対値は3+8=11 → −11</span><span class="exp-tip">💡 マイナス同士を足すとさらにマイナスが大きくなる！</span>'
    },
    {
      q: '(+6) − (−4) を計算すると？',
      sub: 'ひく数の符号を変えて加法に直す',
      a: '+10',
      choices: ['+10', '+2', '−10', '−2'],
      jp: '(+6)−(−4)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>A − B = A + (−B) → (−4)の符号を変えると (+4)</span><span class="exp-ok">✅ (+6) − (−4) = (+6) + (+4) = +10</span><span class="exp-ng">❌ マイナスを引くと「プラス」になる！ここが間違いやすい</span><span class="exp-tip">💡 「−(−4) = +4」。負の数を引くと正になる！</span>'
    },
    {
      q: '(−5) − (+3) を計算すると？',
      sub: 'ひく数の符号を変えてたし算に直す',
      a: '−8',
      choices: ['−8', '+8', '−2', '+2'],
      jp: '(−5)−(+3)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>(−5) − (+3) = (−5) + (−3)</span><span class="exp-ok">✅ 同符号の和 → −(5+3) = −8</span><span class="exp-tip">💡 正の数を引くとさらにマイナスが大きくなる！</span>'
    },
    {
      q: '(+3) + (−3) を計算すると？',
      sub: '絶対値が等しく符号が反対の場合',
      a: '0',
      choices: ['0', '+6', '−6', '+3'],
      jp: '(+3)+(−3)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>異符号で絶対値が同じ → 和は0</span><span class="exp-ok">✅ +3と−3は打ち消し合って 0 になる</span><span class="exp-tip">💡 「逆数」ならぬ「逆符号」！正と負が同じ絶対値なら足すと必ず0</span>'
    },
    {
      q: '(−2) − (−7) を計算すると？',
      sub: 'ひく数 −7 の符号を変えると？',
      a: '+5',
      choices: ['+5', '−5', '+9', '−9'],
      jp: '(−2)−(−7)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>(−2) − (−7) = (−2) + (+7)</span><span class="exp-ok">✅ 異符号の和。絶対値は2と7。7が大きいから「+」。差は7−2=5 → +5</span><span class="exp-tip">💡 マイナスを引くとプラスになる！これが減法の最重要ポイント</span>'
    },
    {
      q: '4 − 9 を計算すると？（符号省略の場合、4 = +4）',
      sub: '符号の省略：+は省略できる',
      a: '−5',
      choices: ['−5', '+5', '+13', '−13'],
      jp: '4−9の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>4 = +4, 9 = +9 として計算。(+4) − (+9) = (+4) + (−9)</span><span class="exp-ok">✅ 異符号の和。絶対値4と9。9が大きいから「−」。差9−4=5 → −5</span><span class="exp-tip">💡 符号のない数は「正の数」！+は省略OK</span>'
    },
    {
      q: '3つの数の和：(+2) + (−5) + (+8) を計算すると？',
      sub: '正の数と負の数をそれぞれまとめる方法が楽',
      a: '+5',
      choices: ['+5', '−5', '+15', '−1'],
      jp: '(+2)+(−5)+(+8)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 コツ</span>正の数の和と負の数の和を別々に計算してから合わせる</span><span class="exp-ok">✅ 正：+2+8 = +10　負：−5　合計：+10+(−5) = +5</span><span class="exp-tip">💡 正・負を分けてから合計すると計算ミスが減る！</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'math_nums_s2_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 加法・減法</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:4, jp:q.jp, choices:q.choices };
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

// ===== SECTION 3: 乗法・除法 =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">（−3）×（−2）ってなんで+6になるの？マイナス×マイナスがプラスって意味わからん！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">符号のルールはこうだ。正×正=正、正×負=負、負×正=負、負×負=正。負が2つかけ合わさると符号が元に戻る。覚え方は「マイナスは偶数個で打ち消し合う」。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">じゃあ（−2）×（−3）×（−1）は？マイナスが3個だからマイナス？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">正解！負の数が奇数個 → 積は負。偶数個 → 積は正。絶対値はふつうにかけ算するだけ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 乗法・除法の符号ルール</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">符号のルール（かけ算・わり算共通）</div>'
    + '<div class="ex">（+）×（+）= +　　（+）×（−）= −</div>'
    + '<div class="ex">（−）×（+）= −　　（−）×（−）= +</div>'
    + '<div class="note">💡 覚え方：同符号 → +　異符号 → −　除法も同じ！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">複数の数のかけ算：負の数が何個？</div>'
    + '<div class="ex">負の数が偶数個 → 積は正（+）</div>'
    + '<div class="ex">負の数が奇数個 → 積は負（−）</div>'
    + '<div class="ex">例：(−2)×(−3)×(−1) → 負3個(奇数) → − (絶対値6) → −6</div>'
    + '<div class="note">💡 絶対値のかけ算はいつも通り。符号だけ別に考える！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">逆数とわり算</div>'
    + '<div class="ex">わり算 = 逆数のかけ算：A ÷ B = A × (1/B)</div>'
    + '<div class="ex">例：(−6) ÷ (−2) = (−6) × (−1/2) = +3</div>'
    + '<div class="note">💡 わり算は逆数のかけ算に変換！符号ルールはかけ算と同じ</div>'
    + '</div>'
    + '</div>';

  var qs = [
    {
      q: '(−4) × (+3) を計算すると？',
      sub: '異符号のかけ算',
      a: '−12',
      choices: ['−12', '+12', '−7', '+7'],
      jp: '(−4)×(+3)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>異符号のかけ算 → 積は負（−）</span><span class="exp-ok">✅ 符号：異符号 → −　絶対値：4×3=12 → −12</span><span class="exp-tip">💡 正×負 or 負×正 は必ずマイナス！</span>'
    },
    {
      q: '(−5) × (−6) を計算すると？',
      sub: '同符号（負×負）のかけ算',
      a: '+30',
      choices: ['+30', '−30', '+11', '−11'],
      jp: '(−5)×(−6)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>同符号のかけ算 → 積は正（+）</span><span class="exp-ok">✅ 符号：負×負 → +　絶対値：5×6=30 → +30</span><span class="exp-tip">💡 マイナス×マイナス = プラス！これが最重要ルール</span>'
    },
    {
      q: '(−2) × (−3) × (−4) を計算すると？',
      sub: '負の数が何個かを先に数えよう',
      a: '−24',
      choices: ['−24', '+24', '−9', '+9'],
      jp: '(−2)×(−3)×(−4)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>負の数が3個（奇数）→ 積は負（−）</span><span class="exp-ok">✅ 絶対値：2×3×4=24　負3個(奇数) → −24</span><span class="exp-tip">💡 負の個数が奇数 → −、偶数 → + とまず符号を決めよう！</span>'
    },
    {
      q: '(+12) ÷ (−3) を計算すると？',
      sub: '異符号のわり算',
      a: '−4',
      choices: ['−4', '+4', '−36', '+36'],
      jp: '(+12)÷(−3)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>異符号のわり算 → 商は負（−）</span><span class="exp-ok">✅ 符号：異符号 → −　絶対値：12÷3=4 → −4</span><span class="exp-tip">💡 わり算の符号ルールはかけ算と全く同じ！</span>'
    },
    {
      q: '(−18) ÷ (−6) を計算すると？',
      sub: '同符号のわり算',
      a: '+3',
      choices: ['+3', '−3', '+108', '−108'],
      jp: '(−18)÷(−6)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>同符号のわり算 → 商は正（+）</span><span class="exp-ok">✅ 符号：同符号 → +　絶対値：18÷6=3 → +3</span><span class="exp-tip">💡 負÷負 = 正。同符号は必ず+！</span>'
    },
    {
      q: '(−3)² を計算すると？',
      sub: '(−3)² = (−3) × (−3)',
      a: '+9',
      choices: ['+9', '−9', '+6', '−6'],
      jp: '(−3)²の計算',
      exp: '<span class="exp-rule"><span class="label">📐 重要区別</span>(−3)² = (−3)×(−3) = +9　vs　−3² = −(3×3) = −9</span><span class="exp-ok">✅ (−3)² は「−3を2乗」→ 負×負 = 正 → +9</span><span class="exp-ng">❌ −3² は「3を2乗してマイナスをつける」→ −9（別物！）</span><span class="exp-tip">💡 カッコの有無で意味が全然違う！入試頻出の落とし穴</span>'
    },
    {
      q: '(−4) × (+3) ÷ (−2) を計算すると？',
      sub: '負の数が何個か数えてから計算',
      a: '+6',
      choices: ['−6', '+6', '−24', '+24'],
      jp: '(−4)×(+3)÷(−2)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 手順</span>①負の数の個数：−4と−2の2個（偶数）→ 符号は +　②絶対値：4×3÷2=6　→ +6</span><span class="exp-ok">✅ 負2個（偶数）→ +、絶対値6 → +6</span><span class="exp-tip">💡 まず負の個数で符号を決める！偶数→+、奇数→−</span>'
    },
    {
      q: '0 × (−99) を計算すると？',
      sub: '0との計算',
      a: '0',
      choices: ['0', '−99', '+99', '計算できない'],
      jp: '0×(−99)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>0 × どんな数 = 0　（0との積は必ず0）</span><span class="exp-ok">✅ 0×(−99) = 0</span><span class="exp-tip">💡 どんな大きな数をかけても、どんな小さな数をかけても、0×□は常に0！</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'math_nums_s3_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 乗法・除法</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:4, jp:q.jp, choices:q.choices };
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
    + '<div class="intro-box-title">📝 確認テスト</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二</div><div class="chat-bubble">Section 1〜3の総まとめ。計算問題中心で20問。直接入力と選択肢の混合問題だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">20問！！全部解いたる！！にっくんより先に全問正解してやる！！</div></div></div>'
    + '</div>';

  // 入力問題
  var inputQs = [
    {
      q: '【基本】|−15| の値を答えよ',
      sub: '絶対値 = 0からの距離',
      a: '15',
      jp: '|−15|の絶対値',
      exp: '<span class="exp-rule"><span class="label">📐 絶対値</span>|−15| = 0からの距離 = 15</span><span class="exp-ok">✅ 符号を取り除くだけ → 15</span><span class="exp-tip">💡 絶対値は必ず0以上。マイナスは消える！</span>'
    },
    {
      q: '【加法】(+7) + (−10) を計算せよ',
      sub: '',
      a: '−3',
      jp: '(+7)+(−10)',
      exp: '<span class="exp-rule"><span class="label">📐 異符号の和</span>絶対値大きい方の符号 + 絶対値の差</span><span class="exp-ok">✅ 10 ＞ 7 → 符号は「−」。差10−7=3 → −3</span><span class="exp-tip">💡 異符号は「どちらが絶対値大きい？」を先に判断！</span>'
    },
    {
      q: '【加法】(−6) + (−9) を計算せよ',
      sub: '',
      a: '−15',
      jp: '(−6)+(−9)',
      exp: '<span class="exp-rule"><span class="label">📐 同符号の和</span>符号はそのまま、絶対値をたす</span><span class="exp-ok">✅ 同符号（両方−）→ 符号は−。6+9=15 → −15</span><span class="exp-tip">💡 マイナス同士たすとさらにマイナスが大きくなる！</span>'
    },
    {
      q: '【減法】(+3) − (−8) を計算せよ',
      sub: 'ひく数の符号を変えて加法に直す',
      a: '+11',
      jp: '(+3)−(−8)',
      exp: '<span class="exp-rule"><span class="label">📐 減法→加法</span>(+3)−(−8) = (+3)+(+8) = +11</span><span class="exp-ok">✅ −(−8) = +8 → +3+8 = +11</span><span class="exp-tip">💡 マイナスを引く = プラスになる！最重要ポイント</span>'
    },
    {
      q: '【乗法】(−7) × (−8) を計算せよ',
      sub: '同符号のかけ算',
      a: '+56',
      jp: '(−7)×(−8)',
      exp: '<span class="exp-rule"><span class="label">📐 乗法</span>同符号 → + 、絶対値7×8=56 → +56</span><span class="exp-ok">✅ 負×負 = 正。+56</span><span class="exp-tip">💡 マイナス×マイナス = プラス！これが乗法の核心</span>'
    },
    {
      q: '【除法】(−24) ÷ (+4) を計算せよ',
      sub: '',
      a: '−6',
      jp: '(−24)÷(+4)',
      exp: '<span class="exp-rule"><span class="label">📐 除法</span>異符号 → − 、24÷4=6 → −6</span><span class="exp-ok">✅ −24÷+4 = 異符号 → − 、絶対値6 → −6</span><span class="exp-tip">💡 わり算の符号もかけ算と同じルール！</span>'
    },
    {
      q: '【乗法】(−2) × (+5) × (−3) を計算せよ',
      sub: '負の数の個数を先に数えよう',
      a: '+30',
      jp: '(−2)×(+5)×(−3)',
      exp: '<span class="exp-rule"><span class="label">📐 手順</span>負の数：−2と−3の2個（偶数）→ + 、絶対値：2×5×3=30 → +30</span><span class="exp-ok">✅ 負が偶数個 → 積は正 → +30</span><span class="exp-tip">💡 まず負の個数！偶数なら+、奇数なら−</span>'
    },
    {
      q: '【四則混合】(−3) × 4 + (−5) × (−2) を計算せよ',
      sub: 'かけ算を先に、その後たし算',
      a: '−2',
      jp: '(−3)×4+(−5)×(−2)',
      exp: '<span class="exp-rule"><span class="label">📐 計算順序</span>乗除 → 加減の順。(−3)×4=−12、(−5)×(−2)=+10</span><span class="exp-ok">✅ −12 + (+10) = −12 + 10 = −2</span><span class="exp-tip">💡 かけ算・わり算が先！たし算・ひき算は後から</span>'
    },
  ];

  // 選択肢問題
  var choiceQs = [
    {
      q: '【基本】次の中で最も大きい数はどれ？',
      sub: '−10, −1, 0, +0.5',
      a: '+0.5',
      choices: ['−10', '−1', '0', '+0.5'],
      jp: '最大の数の選択',
      exp: '<span class="exp-rule"><span class="label">📐 大小比較</span>数直線で最も右にある数が最大</span><span class="exp-ok">✅ −10 ＜ −1 ＜ 0 ＜ +0.5 → 最大は +0.5</span><span class="exp-tip">💡 正の数は負の数より常に大きい！</span>'
    },
    {
      q: '【基本】絶対値が等しく符号が反対の2数の和は？',
      sub: '例：+5と−5、+100と−100',
      a: '必ず0になる',
      choices: ['必ず0になる', '必ず正になる', '必ず負になる', '符号が大きい方の数'],
      jp: '逆符号同値の和',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>|a|=|b| かつ 符号が逆 → a+b = 0（打ち消し合う）</span><span class="exp-ok">✅ (+5)+(−5) = 0、(+100)+(−100) = 0</span><span class="exp-tip">💡 加法の逆元！正と負が打ち消し合う重要な性質</span>'
    },
    {
      q: '【乗法】(−1)^10 を計算すると？',
      sub: '(−1)を10回かける',
      a: '+1',
      choices: ['+1', '−1', '10', '−10'],
      jp: '(−1)^10の計算',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>負の数の偶数乗 → 正（+）、奇数乗 → 負（−）</span><span class="exp-ok">✅ 10は偶数 → (−1)^10 = +1</span><span class="exp-tip">💡 (−1)^偶数 = +1、(−1)^奇数 = −1。シンプルなパターン！</span>'
    },
    {
      q: '【減法】a − (−b) を簡単にすると？',
      sub: '文字式での減法',
      a: 'a + b',
      choices: ['a + b', 'a − b', '−a + b', '−a − b'],
      jp: 'a−(−b)の簡略化',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>−(−b) = +b → a − (−b) = a + b</span><span class="exp-ok">✅ マイナスを引く = プラス足す</span><span class="exp-tip">💡 文字式でも数字と同じ！−(−b) = +b</span>'
    },
    {
      q: '【四則混合】3 + (−5) × 2 − (−1) を計算すると？',
      sub: '計算順序に注意：乗法が先',
      a: '−6',
      choices: ['−6', '+6', '−4', '+4'],
      jp: '3+(−5)×2−(−1)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 手順</span>①乗法先：(−5)×2=−10　②代入：3+(−10)−(−1) = 3+(−10)+(+1) = −6</span><span class="exp-ok">✅ 3−10+1 = −6</span><span class="exp-tip">💡 乗除 → 加減の順番！括弧の中も最優先</span>'
    },
    {
      q: '【乗法】(−3)² − (−2)³ を計算すると？',
      sub: '指数の計算に注意',
      a: '+17',
      choices: ['+17', '−17', '+1', '−1'],
      jp: '(−3)²−(−2)³',
      exp: '<span class="exp-rule"><span class="label">📐 手順</span>(−3)²=(+9)、(−2)³=(−8)　→　9−(−8) = 9+8 = 17</span><span class="exp-ok">✅ (−3)²=9（偶数乗→+）、(−2)³=−8（奇数乗→−）→ 9−(−8)=+17</span><span class="exp-tip">💡 指数の奇偶で符号が決まる！偶数乗→+、奇数乗→−</span>'
    },
    {
      q: '【数の性質】a ＜ 0 のとき、a² の値は？',
      sub: '負の数を2乗すると…',
      a: '必ず正（a² ＞ 0）',
      choices: ['必ず正（a² ＞ 0）', '必ず負（a² ＜ 0）', '0になる', 'aの符号による'],
      jp: 'a<0のときa²の符号',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>負の数を2乗（偶数乗）→ 必ず正</span><span class="exp-ok">✅ a ＜ 0 → a = a×a = 負×負 = 正（+）</span><span class="exp-tip">💡 どんな数の2乗も0以上！（0²=0だけが例外）</span>'
    },
    {
      q: '【四則混合】36 ÷ (−4) × (−3) を計算すると？',
      sub: '左から順に計算（乗除は同優先順位）',
      a: '+27',
      choices: ['+27', '−27', '+3', '−3'],
      jp: '36÷(−4)×(−3)',
      exp: '<span class="exp-rule"><span class="label">📐 手順</span>左から順に：36÷(−4)=−9 → (−9)×(−3)=+27</span><span class="exp-ok">✅ 乗法と除法は同じ優先順位なので左から計算 → +27</span><span class="exp-tip">💡 掛け算・割り算は「左から右へ」。まとめて符号を判断してもOK</span>'
    },
    {
      q: '【加法】−0.5 + 1.2 + (−0.8) を計算すると？',
      sub: '小数の正負計算',
      a: '−0.1',
      choices: ['−0.1', '+0.1', '−1.5', '+1.5'],
      jp: '−0.5+1.2+(−0.8)の計算',
      exp: '<span class="exp-rule"><span class="label">📐 コツ</span>正：+1.2　負：−0.5+(−0.8)=−1.3　合計：1.2+(−1.3)=−0.1</span><span class="exp-ok">✅ 正の和1.2、負の和−1.3 → 1.2−1.3 = −0.1</span><span class="exp-tip">💡 正・負に分けて計算すると小数でもミスが減る！</span>'
    },
    {
      q: '【乗法】(−1/2) × (−4) × (+6) を計算すると？',
      sub: '分数の乗法',
      a: '+12',
      choices: ['+12', '−12', '+3', '−3'],
      jp: '(−1/2)×(−4)×(+6)',
      exp: '<span class="exp-rule"><span class="label">📐 手順</span>負の数：2個（偶数）→ 符号は +。絶対値：1/2×4×6=12 → +12</span><span class="exp-ok">✅ 負2個（偶数）→ +、絶対値：(1/2)×4×6=12 → +12</span><span class="exp-tip">💡 分数でも同じ手順！符号を先に決めてから絶対値を計算</span>'
    },
    {
      q: '【基本】次の中で正しいものはどれ？',
      sub: '',
      a: '負の整数も整数である',
      choices: ['負の整数も整数である', '0は正の数である', '自然数には0が含まれる', '整数は負の数を含まない'],
      jp: '数の分類の正誤判断',
      exp: '<span class="exp-rule"><span class="label">📐 数の分類</span>整数 = 正の整数(自然数) + 0 + 負の整数</span><span class="exp-ok">✅ 負の整数（−1,−2,−3…）も整数に含まれる</span><span class="exp-ng">❌ 0は正でも負でもない / 自然数は1以上 / 整数は負も含む</span><span class="exp-tip">💡 数の包含関係：自然数 ⊂ 整数 ⊂ 有理数</span>'
    },
    {
      q: '【四則混合】(−4)² ÷ (−2)³ を計算すると？',
      sub: '指数を先に計算してから割る',
      a: '−2',
      choices: ['−2', '+2', '−8', '+8'],
      jp: '(−4)²÷(−2)³の計算',
      exp: '<span class="exp-rule"><span class="label">📐 手順</span>(−4)²=16（偶数乗→+）、(−2)³=−8（奇数乗→−）→ 16÷(−8)=−2</span><span class="exp-ok">✅ 16÷(−8) → 異符号 → − 、絶対値2 → −2</span><span class="exp-tip">💡 指数を先に処理してから割り算の符号を判断！</span>'
    },
  ];

  inputQs.forEach(function(q, i) { q._qid = 'math_nums_s4_in' + i; q._type = 'input'; });
  choiceQs.forEach(function(q, i) { q._qid = 'math_nums_s4_ch' + i; q._type = 'choice'; });

  var allQs = shuffleArray(inputQs.concat(choiceQs));

  html += '<div class="practice-section"><div class="practice-title">📝 確認テスト — 全範囲20問</div>';
  allQs.forEach(function(q, i) {
    var qid = q._qid;
    if (q._type === 'input') {
      qMeta[qid] = { type:'input', answer:q.a, xp:5, jp:q.jp };
      html += '<div class="q-card" data-card="' + qid + '">'
        + '<div class="q-number">Q' + (i+1) + ' / ' + allQs.length + '</div>'
        + '<div class="q-text">' + q.q + '</div>'
        + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
        + makeInput(qid, q.a, 5)
        + makeFeedback(qid, q.exp)
        + '</div>';
    } else {
      qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.jp, choices:q.choices };
      html += '<div class="q-card" data-card="' + qid + '">'
        + '<div class="q-number">Q' + (i+1) + ' / ' + allQs.length + '</div>'
        + '<div class="q-text">' + q.q + '</div>'
        + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
        + makeChoices(qid, q.choices, q.a, 5)
        + makeFeedback(qid, q.exp)
        + '</div>';
    }
  });
  html += '</div>';
  return html;
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var prefix = 'math_nums_s4_';
  var total = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; }).length;
  var correct = Object.keys(answeredSet).filter(function(id){ return id.indexOf(prefix) === 0 && answeredSet[id]; }).length;
  if (total === 0) total = 20;
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '😄' : '🐣';
  var msg = pct >= 90
    ? 'きょん「全部わかった！！令和ロマンより賢いかも！！」<br>西村「よくやった。次の単元に進もう」'
    : pct >= 70
    ? 'きょん「かなりできた！！あとちょっとで完璧！！」<br>西村「惜しい。見直したら完璧になるよ」'
    : pct >= 50
    ? 'きょん「半分はわかった！！まだまだやれる！！」<br>西村「基礎をもう一回確認してみよう」'
    : 'きょん「難しかった！でも絶対諦めない！！」<br>西村「焦らなくていい。もう一度セクションを復習してから来よう」';
  var html = '<div class="result-box">'
    + '<div class="result-title">📊 確認テスト 結果</div>'
    + '<div class="result-emoji">' + emoji + '</div>'
    + '<div class="result-score">' + correct + '<span> / ' + total + '問正解</span></div>'
    + '<div style="font-size:28px;color:var(--gold);font-weight:bold;margin-bottom:8px">' + pct + '%</div>'
    + '<div class="result-msg">' + msg + '</div>'
    + '<div style="margin-top:24px">'
    + '<button class="result-btn" onclick="closeResult()">📖 見直しをする</button>'
    + '<button class="result-btn" onclick="goSection(1)" style="background:var(--purple)">🔄 Section 1 からやり直す</button>'
    + '</div></div>';
  document.getElementById('resultOverlay').innerHTML = html;
  document.getElementById('resultOverlay').style.display = 'block';
}
function closeResult() {
  document.getElementById('resultOverlay').style.display = 'none';
}

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 5;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var wqs = getWeakQuestions();
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_nums_') === 0; });

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
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--green)">' + (allQids.length - wqs.length) + '</div><div style="font-size:11px;color:var(--text2)">習得済み（80%以上）</div></div>'
    + '</div>';

  sorted.forEach(function(qid) {
    var d = weakDB[qid];
    var pct = getPct(qid);
    var barColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
    html += '<div style="background:var(--bg2);border:1px solid ' + barColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(163,113,247,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text);margin-bottom:2px;line-height:1.6">' + (d.jp || '') + '</div><div style="font-size:13px;color:' + barColor + '">' + (d.answer || '') + '</div></div>'
      + '<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div>'
      + '<div style="width:80px;height:5px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px"></div></div></div>'
      + '</div>';
  });

  if (wqs.length > 0) {
    html += '<button onclick="goSection(6)" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }
  mc.innerHTML = html;
}

// ===== 特訓モード =====
var tokkuQueue = [];
var tokkuIndex = 0;
var tokkuSession = { correct: 0, total: 0 };

function preloadQMeta() {
  var dummy = document.createElement('div');
  var mc = document.getElementById('mainContent');
  var saved = mc.innerHTML;
  [1, 2, 3, 4].forEach(function(n) {
    try { renderSection(n); } catch(e) {}
  });
  mc.innerHTML = saved;
}

function renderTokkuMode() {
  preloadQMeta();
  currentSection = 6;
  renderTabs();
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');

  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div class="tokku-complete-msg">きょん「俺、無敵になったわ！！」<br>西村「本当に成長したね」</div><button onclick="goSection(1)" style="margin-top:24px;background:var(--purple);color:#fff;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button></div>';
    return;
  }

  tokkuQueue  = wqs.slice(0, 15);
  tokkuIndex  = 0;
  tokkuSession = { correct: 0, total: 0 };
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
  var shuffled = (d.choices && d.choices.length > 0) ? d.choices.slice().sort(function(){ return Math.random()-0.5; }) : [];
  var choicesHtml = shuffled.length > 0
    ? '<div class="tokku-choices" id="tokku_choices">' + shuffled.map(function(c){ return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c + '">' + c + '</button>'; }).join('') + '</div>'
    : '<div class="input-wrap"><input class="q-input" id="tokku_inp" type="text" placeholder="答えを入力..."><button onclick="handleTokkuInput(\'' + qid + '\')" class="input-submit">確認</button></div>';

  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span class="pct" style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp">' + (d.jp || (qMeta[qid] && qMeta[qid].jp) || qid) + '</div>'
    + choicesHtml
    + '<div class="tokku-result" id="tokku_result"></div>'
    + '<button id="tokku_next" onclick="nextTokkuCard()" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題 →</button>'
    + '</div>';

  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleTokkuChoice(btn.dataset.tqid, btn.dataset.tchoice); });
  });
}

function handleTokkuInput(qid) {
  var d = weakDB[qid];
  if (!d) return;
  var inp = document.getElementById('tokku_inp');
  if (!inp) return;
  var val = inp.value.trim();
  if (!val) { showToast('答えを入力！'); return; }
  handleTokkuAnswer(qid, val, flexMatch(val, d.answer));
}

function handleTokkuChoice(qid, choice) {
  var d = weakDB[qid];
  if (!d) return;
  handleTokkuAnswer(qid, choice, choice === d.answer);
}

function handleTokkuAnswer(qid, choice, correct) {
  var d = weakDB[qid];
  if (qMeta[qid] && qMeta[qid].jp && !weakDB[qid].jp) weakDB[qid].jp = qMeta[qid].jp;
  tokkuSession.total++;
  weakDB[qid].total++;
  if (correct) { weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();

  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b) { b.disabled = true; });
  var chosen = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + choice + '"]');
  if (chosen) chosen.classList.add(correct ? 'selected-correct' : 'selected-wrong');
  if (!correct) {
    var ok = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + d.answer + '"]');
    if (ok) ok.classList.add('show-correct');
  }

  var newPct = getPct(qid);
  var res = document.getElementById('tokku_result');
  if (res) {
    if (correct) {
      xp += 1; localStorage.setItem('math_xp', xp); updateXP();
      res.className = 'tokku-result tokku-correct';
      res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 正答率' + newPct + '%！この問題は卒業！' : ' 正答率 → ' + newPct + '%');
      showToast(getComment('correct'));
    } else {
      deductXP(3);
      res.className = 'tokku-result tokku-wrong';
      res.innerHTML = '❌ 間違い！正答率 → ' + newPct + '%<div class="tokku-answer">' + d.answer + '</div>';
      showToast('きょん「また間違えた！！でも諦めない！！」');
    }
    res.style.display = 'block';
  }
  document.getElementById('tokku_next').style.display = 'block';
}

function nextTokkuCard() { tokkuIndex++; renderTokkuCard(); }

function showTokkuComplete() {
  var mc = document.getElementById('mainContent');
  var pctAll = tokkuSession.total > 0 ? Math.round(tokkuSession.correct / tokkuSession.total * 100) : 0;
  var emoji = pctAll >= 80 ? '🏆' : pctAll >= 60 ? '😎' : '💪';
  var msg = pctAll >= 80 ? 'きょん「全部わかった！！昇格の予感！！」<br>西村「よくやった。次回も頼む」'
    : pctAll >= 50 ? 'きょん「半分以上できた！もう一回やる！」<br>西村「続けること。それが大事」'
    : 'きょん「難しかった…でも諦めない！！」<br>西村「何度でもやればいい。繰り返すことが力になる」';
  mc.innerHTML = '<div class="tokku-complete">'
    + '<div class="tokku-complete-emoji">' + emoji + '</div>'
    + '<div class="tokku-complete-title">特訓終了！</div>'
    + '<div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div>'
    + '<div style="font-size:14px;color:var(--text2)">' + tokkuSession.correct + ' / ' + tokkuSession.total + '問正解</div>'
    + '<div class="tokku-complete-msg" style="margin-top:16px">' + msg + '</div>'
    + '<div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button onclick="renderTokkuMode()" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回特訓！</button>'
    + '<button onclick="goSection(1)" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">Section 1 へ戻る</button>'
    + '</div></div>';
  renderWeakBar();
}

// ===== INIT =====
updateXP();
preloadQMeta();
renderWeakBar();
renderTabs();
goSection(0);
