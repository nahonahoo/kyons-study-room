// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「化学？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺化学できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「化学式で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var xp          = parseInt(localStorage.getItem('sci_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('sci_chem_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('sci_chem_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('sci_weakdb')        || '{}');
var attemptCounts = {};

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
  localStorage.setItem('sci_xp',           xp);
  localStorage.setItem('sci_chem_answered', JSON.stringify(answeredSet));
  updateXP();
  return getLevel(xp).lv > oldLv;
}
function deductXP(pts) {
  var oldLv = getLevel(xp).lv;
  xp = Math.max(0, xp - pts);
  localStorage.setItem('sci_xp', xp);
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
    return id.indexOf('sci_chem_') === 0 && getPct(id) < 80;
  });
}
function renderWeakBar() {
  var wqs = getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,8);
  var el = document.getElementById('weakItems');
  if (!el) return;
  if (wqs.length === 0) { el.innerHTML = '<span class="weak-bar-empty">弱点なし — よくできています！</span>'; return; }
  el.innerHTML = wqs.map(function(qid) {
    var d = weakDB[qid];
    return '<div class="weak-item"><span class="weak-item-word">' + (d.jp || qid) + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect) {
  if (!weakDB[qid]) weakDB[qid] = { jp: (qMeta[qid] && qMeta[qid].jp) || '', answer: (qMeta[qid] && qMeta[qid].answer) || '', choices: (qMeta[qid] && qMeta[qid].choices) || [], correct: 0, total: 0 };
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('sci_weakdb', JSON.stringify(weakDB));
  var _today = new Date().toISOString().slice(0,10);
  var _daily = JSON.parse(localStorage.getItem('sci_daily') || '{}');
  _daily[_today] = (_daily[_today] || 0) + 1;
  localStorage.setItem('sci_daily',           JSON.stringify(_daily));
  localStorage.setItem('sci_chem_lastStudy',  _today);
  renderWeakBar();
  renderTabs();
}

// ===== SPEECH =====
var speechEnabled = (typeof window !== 'undefined' && 'speechSynthesis' in window);
function speak(text) {
  if (!speechEnabled) return;
  try {
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = 1.1;
    window.speechSynthesis.speak(u);
  } catch(e) {}
}

// ===== TOAST =====
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  if (type === 'levelup')    t.className = 'toast levelup';
  else if (type === 'demote') t.className = 'toast demote';
  else                        t.className = 'toast';
  t.classList.add('show');
  var dur = type === 'levelup' ? 4000 : type === 'demote' ? 3500 : 2500;
  setTimeout(function() { t.classList.remove('show'); }, dur);
}

// ===== COMMENTS =====
var COMMENTS = {
  kyon_correct: [
    'きょん「合ってる！化学できるじゃん！！」',
    'きょん「やった！天才かも！」',
    'きょん「にっくん見て！全部わかってきた！！」',
    'きょん「待って、合ってるじゃん！めちゃくちゃすごいじゃん！」',
  ],
  nishi_correct: [
    '西村「正解。よく覚えてたね」',
    '西村「できてる。その調子」',
    '西村「正解。次も頼む」',
    '西村「ちゃんとわかってる」',
  ],
  kyon_wrong: [
    'きょん「あれ！？間違えた！もう一回！」',
    'きょん「えっ違うの！？にっくん助けて！」',
    'きょん「むずっ！もう一回やる！」',
  ],
};
function getComment(type) {
  var arr = COMMENTS[type];
  return arr[Math.floor(Math.random() * arr.length)];
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

// ===== QUESTION ENGINE =====
var qMeta = {};

function makeInput(qid, jp, answer, xpPts) {
  qMeta[qid] = Object.assign(qMeta[qid] || {}, { type: 'input', answer: answer, xp: xpPts, jp: jp });
  if (answeredSet[qid]) {
    return '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"></div>';
  }
  return '<div class="input-wrap">'
    + '<input class="q-input" id="inp_' + qid + '" type="text" placeholder="答えを入力...">'
    + '<button class="input-submit" data-qid="' + qid + '">確認</button>'
    + '</div>';
}
function flexMatchSci(input, answer) {
  var norm = function(s) {
    return s.trim().replace(/\s+/g,'').toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-0xFEE0); });
  };
  var ni = norm(input), na = norm(answer);
  if (ni === na) return true;
  if (na.length >= 2 && ni.indexOf(na) !== -1) return true;
  if (ni.length >= 2 && na.indexOf(ni) !== -1 && ni.length >= Math.ceil(na.length * 0.5)) return true;
  return false;
}
function handleInput(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  var inp = document.getElementById('inp_' + qid);
  if (!inp) return;
  var val = inp.value.trim();
  if (!val) { showToast('答えを入力してください！'); return; }
  if (flexMatchSci(val, meta.answer)) {
    inp.style.borderColor = 'var(--green)';
    markCorrect(qid, meta);
  } else {
    inp.style.borderColor = 'var(--red)';
    markWrong(qid, meta, val);
    inp.select();
  }
}
function makeChoices(qid, jp, answer, choices, exp) {
  choices = shuffleArray(choices);
  qMeta[qid] = Object.assign(qMeta[qid] || {}, { type:'choice', answer:answer, xp:4, jp:jp, choices:choices });
  var done = answeredSet[qid];
  var html = '<div class="q-card" data-card="' + qid + '">'
    + '<div class="q-text">' + jp + '</div>'
    + '<div class="choices">'
    + choices.map(function(c) {
        if (done) return '<button class="choice-btn ' + (c === answer ? 'show-correct' : '') + '" disabled>' + c + '</button>';
        return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
      }).join('')
    + '</div>'
    + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done ? 'display:block' : 'display:none') + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度チャレンジ！</div>'
    + '<div class="exp-card" id="exp_card_' + qid + '">'
    + '<div class="exp-card-title">📌 解説</div>'
    + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + exp + '</div>'
    + '</div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '">'
    + '<div class="ans-label">✅ 正解</div>'
    + '<div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div>'
    + '</div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done ? 'display:block' : 'display:none') + '">'
    + (done ? getComment('nishi_correct') : '')
    + '</div>'
    + '</div>';
  return html;
}
function handleChoice(qid, choice) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  if (choice === meta.answer) markCorrect(qid, meta, choice);
  else                         markWrong(qid, meta, choice);
}
function markCorrect(qid, meta, choice) {
  speak('正解！');
  recordResult(qid, true);
  var lvUp = addXP(meta.xp || 4, qid);
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) card.classList.add('correct-card');
  var fb = document.getElementById('fb_' + qid);
  if (fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid);
  if (fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = getComment('nishi_correct'); ac.style.display = 'block'; }
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true;
    if (b.dataset.choice === meta.answer) b.classList.add('selected-correct');
  });
  var _inp = document.getElementById('inp_' + qid);
  if (_inp) { _inp.disabled = true; _inp.style.borderColor = 'var(--green)'; var _sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if (_sb) _sb.style.display = 'none'; }
  var expCard = document.getElementById('exp_' + qid);
  if (expCard) expCard.style.display = 'block';
  if (lvUp) {
    setTimeout(function() {
      var lv = getLevel(xp);
      speak('昇格！');
      showToast('🎉 昇格！ ' + lv.badge + '　きょん「' + lv.badge + 'になったわ！！」', 'levelup');
    }, 400);
  } else {
    setTimeout(function() { showToast(getComment('kyon_correct')); }, 300);
  }
  checkSectionComplete();
}
function markWrong(qid, meta, choice) {
  speak('もう一度！');
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
  var wrongMsgs = [
    'きょん「あれ！間違えた！でも次は大丈夫！！」',
    'きょん「また間違えた…！まだまだ大丈夫！！」',
    'きょん「何回間違えてんの！！にっくんに怒られる！！」',
    'きょん「もうやだ！！でも諦めないぞ！！答えを見ちゃおうかな…」',
  ];
  var msg = wrongMsgs[Math.min(wrongMsgs.length - 1, attemptCounts[qid] - 1)];
  if (demoted) {
    setTimeout(function() { showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」', 'demote'); }, 200);
  } else {
    setTimeout(function() { showToast(msg); }, 100);
  }
  if (!tokkuBannerShown) {
    tokkuBannerShown = true;
    setTimeout(function() { showTokkuSuggestion(qid); }, 500);
  }
}
function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  localStorage.setItem('sci_chem_answered', JSON.stringify(answeredSet));
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
  if (ac) { ac.textContent = 'きょん「ふーん、そういうことか。次は自分でできる！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。次は自分で解いてみよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete() {
  var prefix = 'sci_chem_s' + currentSection + '_';
  var sectionQ = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sectionQ.length === 0) return;
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done) {
    sectionDone[currentSection] = true;
    localStorage.setItem('sci_chem_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb) {
      nb.style.display = 'block';
      if (!document.getElementById('sectionCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'sectionCompleteBanner';
        var nextSec = currentSection < 4 ? 'Section ' + (currentSection + 1) + ' へ進もう！' : '確認テストで腕試し！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(63,185,80,0.12),rgba(14,165,233,0.08));border:1px solid var(--green);border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--green);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
          + '<div style="font-size:14px;color:var(--text2)">きょん「全問解いた！！にっくん、俺やれるじゃん！！」</div>'
          + '<div style="font-size:13px;color:var(--text2);margin-top:4px">西村「よくやった。' + nextSec + '」</div>'
          + '</div>';
        nb.parentNode.insertBefore(banner, nb);
        setTimeout(function(){ banner.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 200);
      }
    }
  }
}

// ===== SECTIONS =====
var currentSection = 0;
var SECTIONS = [
  { id:0, label:'⚗️ スタート',  title:'化学変化・原子分子',        sub:'中2理科の化学分野。中3「化学変化とイオン」の土台を作ろう！' },
  { id:1, label:'原子・分子',   title:'原子・分子・化学式',         sub:'H・O・C・N……元素記号と化学式のルールをマスターしよう' },
  { id:2, label:'化合・分解',   title:'化合・分解・化学反応式',     sub:'化学変化の2パターンと化学反応式の書き方を攻略！' },
  { id:3, label:'酸化・還元',   title:'酸化・還元・燃焼',           sub:'酸素との化合・切り離し——中3化学の根幹！' },
  { id:4, label:'確認テスト',   title:'確認テスト',                 sub:'全単元の総まとめ！愛知県形式20問' },
  { id:5, label:'🔗3年予習',    title:'3年予習：化学変化とイオン',  sub:'酸・アルカリ・中和——中2化学の続き' },
  { id:6, label:'📊弱点',       title:'弱点ノート',                 sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',       title:'弱点特訓モード',             sub:'間違えた問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab';
    if (s.id >= 6) cls += ' tokku';
    if (s.id === currentSection) cls += ' active';
    if (sectionDone[s.id] && s.id < 6) cls += ' done';
    var label = s.label + (sectionDone[s.id] && s.id < 6 ? ' ✓' : '');
    if (s.id === 7) {
      var wk = getWeakQuestions();
      label = '🔥特訓' + (wk.length > 0 ? '(' + wk.length + ')' : '');
    }
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
  if (id === 6) { renderWeakNote();  return; }
  if (id === 7) { renderTokkuMode(); return; }

  var s = SECTIONS[id];
  var html = '';
  html += '<div class="progress-dots">';
  for (var i = 0; i <= 5; i++) {
    var dc = 'dot' + (i < id ? ' done' : i === id ? ' current' : '');
    html += '<div class="' + dc + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">理科 中2化学 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">'   + s.sub   + '</div>'
    + '</div>';

  if      (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();
  else if (id === 5) html += renderSection5();

  if (id >= 1 && id <= 4) {
    var nextLabel  = id < 4 ? '次のセクションへ →' : '🏆 結果を見る！';
    var nextAction = id < 4 ? 'goSection(' + (id + 1) + ')' : 'showFinalResult()';
    html += '<button class="next-section-btn" id="nextBtn" onclick="' + nextAction + '">' + nextLabel + '</button>';
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
      if (e.key === 'Enter') { handleInput(inp.id.replace('inp_','')); }
    });
  });

  if (sectionDone[id]) {
    var nb = document.getElementById('nextBtn');
    if (nb) nb.style.display = 'block';
  }
  checkSectionComplete();
}

// ===== SECTION 0: スタート =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">⚗️ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">化学式って H₂O とか CO₂ とか…なんかアルファベットと数字が並んでるだけで意味わかんない！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">それぞれ意味がある。H は水素、O は酸素、C は炭素——元素記号は物質の「名前の略語」だと思えばいい。H₂O は水素2個と酸素1個でできてる、というレシピだ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">レシピ！なるほど！それならわかる！！化学式って料理のレシピなんだ！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">ちょうどいい。そしてこの単元は中3の「化学変化とイオン」に直結する——今マスターしないと後で困る。</div></div></div>'
    + '</div>'
    + '<button class="start-btn" onclick="goSection(1)">⚗️ 原子・分子・化学式から始める →</button>';
}

// ===== SECTION 1: 原子・分子・化学式 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚗️ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">原子と分子ってどう違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">原子は「それ以上分けられない最小の粒」。分子は「原子がいくつか結合したもの」。水（H₂O）は水素原子2個＋酸素原子1個の分子だ。原子 = レンガのピース、分子 = 完成した形、と覚えよう。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">レンガと建物みたいな！わかりやすい！！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 主な元素記号（必須11種）</div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    + '<tr style="background:#1e293b;color:var(--teal)">'
    + '<th style="padding:8px 12px;border:1px solid #334155">元素記号</th>'
    + '<th style="padding:8px 12px;border:1px solid #334155">元素名</th>'
    + '<th style="padding:8px 12px;border:1px solid #334155">元素記号</th>'
    + '<th style="padding:8px 12px;border:1px solid #334155">元素名</th>'
    + '</tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">H</td><td style="padding:8px 12px;border:1px solid #334155">水素</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">Na</td><td style="padding:8px 12px;border:1px solid #334155">ナトリウム</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">O</td><td style="padding:8px 12px;border:1px solid #334155">酸素</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">Cl</td><td style="padding:8px 12px;border:1px solid #334155">塩素</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">C</td><td style="padding:8px 12px;border:1px solid #334155">炭素</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">Fe</td><td style="padding:8px 12px;border:1px solid #334155">鉄</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">N</td><td style="padding:8px 12px;border:1px solid #334155">窒素</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">Cu</td><td style="padding:8px 12px;border:1px solid #334155">銅</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">S</td><td style="padding:8px 12px;border:1px solid #334155">硫黄</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">Mg</td><td style="padding:8px 12px;border:1px solid #334155">マグネシウム</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold);font-weight:bold">Zn</td><td style="padding:8px 12px;border:1px solid #334155">亜鉛</td><td colspan="2" style="padding:8px 12px;border:1px solid #334155;color:var(--text2)"> </td></tr>'
    + '</table>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 化学式の読み方・単体と化合物</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">主な化学式</div>'
    + '<div class="ex">H₂O（水）・CO₂（二酸化炭素）・O₂（酸素）・H₂（水素）・N₂（窒素）</div>'
    + '<div class="ex">NaCl（塩化ナトリウム）・HCl（塩化水素）・NH₃（アンモニア）</div>'
    + '<div class="ex">CuO（酸化銅）・Fe₂O₃（酸化鉄）・MgO（酸化マグネシウム）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">単体 vs 化合物</div>'
    + '<div class="ex">単体：1種類の元素だけでできた物質（O₂・H₂・Cu・Fe）</div>'
    + '<div class="ex">化合物：2種類以上の元素でできた物質（H₂O・CO₂・NaCl）</div>'
    + '<div class="note">💡 「単体」は同じ元素のみ。NaCl は Na と Cl の2種類 → 化合物</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">⚛️ 原子の球体カラーモデル（色で覚えよう！）</div>'
    + '<svg viewBox="0 0 372 85" width="100%" style="display:block;margin:0 auto;max-width:500px">'
    + '<circle cx="32" cy="38" r="26" fill="#3b82f6"/>'
    + '<text x="32" y="44" text-anchor="middle" font-size="18" font-weight="bold" fill="white" font-family="Arial,sans-serif">H</text>'
    + '<text x="32" y="72" text-anchor="middle" font-size="9" fill="#93c5fd" font-family="Arial,sans-serif">水素</text>'
    + '<circle cx="96" cy="38" r="26" fill="#ef4444"/>'
    + '<text x="96" y="44" text-anchor="middle" font-size="18" font-weight="bold" fill="white" font-family="Arial,sans-serif">O</text>'
    + '<text x="96" y="72" text-anchor="middle" font-size="9" fill="#fca5a5" font-family="Arial,sans-serif">酸素</text>'
    + '<circle cx="160" cy="38" r="26" fill="#6b7280"/>'
    + '<text x="160" y="44" text-anchor="middle" font-size="18" font-weight="bold" fill="white" font-family="Arial,sans-serif">C</text>'
    + '<text x="160" y="72" text-anchor="middle" font-size="9" fill="#d1d5db" font-family="Arial,sans-serif">炭素</text>'
    + '<circle cx="224" cy="38" r="26" fill="#8b5cf6"/>'
    + '<text x="224" y="44" text-anchor="middle" font-size="18" font-weight="bold" fill="white" font-family="Arial,sans-serif">N</text>'
    + '<text x="224" y="72" text-anchor="middle" font-size="9" fill="#c4b5fd" font-family="Arial,sans-serif">窒素</text>'
    + '<circle cx="288" cy="38" r="26" fill="#d97706"/>'
    + '<text x="288" y="43" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial,sans-serif">Na</text>'
    + '<text x="288" y="72" text-anchor="middle" font-size="9" fill="#fcd34d" font-family="Arial,sans-serif">ナトリウム</text>'
    + '<circle cx="352" cy="38" r="26" fill="#16a34a"/>'
    + '<text x="352" y="43" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial,sans-serif">Cl</text>'
    + '<text x="352" y="72" text-anchor="middle" font-size="9" fill="#86efac" font-family="Arial,sans-serif">塩素</text>'
    + '</svg>'
    + '<div style="font-size:11px;color:var(--text2);margin-top:10px;text-align:center">H=青・O=赤・C=灰・N=紫・Na=黄・Cl=緑 で覚えよう</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔬 分子モデル：H₂O・CO₂・O₂</div>'
    + '<svg viewBox="0 0 375 95" width="100%" style="display:block;margin:0 auto;max-width:520px">'
    + '<text x="55" y="11" text-anchor="middle" font-size="10" fill="#93c5fd" font-family="Arial,sans-serif">H₂O（水）</text>'
    + '<circle cx="18" cy="56" r="16" fill="#3b82f6"/>'
    + '<text x="18" y="61" text-anchor="middle" font-size="11" font-weight="bold" fill="white" font-family="Arial,sans-serif">H</text>'
    + '<circle cx="56" cy="42" r="22" fill="#ef4444"/>'
    + '<text x="56" y="47" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial,sans-serif">O</text>'
    + '<circle cx="94" cy="56" r="16" fill="#3b82f6"/>'
    + '<text x="94" y="61" text-anchor="middle" font-size="11" font-weight="bold" fill="white" font-family="Arial,sans-serif">H</text>'
    + '<line x1="33" y1="52" x2="40" y2="48" stroke="white" stroke-width="2.5"/>'
    + '<line x1="79" y1="48" x2="72" y2="52" stroke="white" stroke-width="2.5"/>'
    + '<text x="56" y="82" text-anchor="middle" font-size="9" fill="#60a5fa" font-family="Arial,sans-serif">水素×2 酸素×1</text>'
    + '<text x="195" y="11" text-anchor="middle" font-size="10" fill="#d1d5db" font-family="Arial,sans-serif">CO₂（二酸化炭素）</text>'
    + '<circle cx="145" cy="48" r="19" fill="#ef4444"/>'
    + '<text x="145" y="53" text-anchor="middle" font-size="13" font-weight="bold" fill="white" font-family="Arial,sans-serif">O</text>'
    + '<circle cx="195" cy="48" r="23" fill="#6b7280"/>'
    + '<text x="195" y="53" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial,sans-serif">C</text>'
    + '<circle cx="245" cy="48" r="19" fill="#ef4444"/>'
    + '<text x="245" y="53" text-anchor="middle" font-size="13" font-weight="bold" fill="white" font-family="Arial,sans-serif">O</text>'
    + '<line x1="166" y1="45" x2="170" y2="43" stroke="white" stroke-width="2"/>'
    + '<line x1="166" y1="51" x2="170" y2="53" stroke="white" stroke-width="2"/>'
    + '<line x1="224" y1="43" x2="220" y2="45" stroke="white" stroke-width="2"/>'
    + '<line x1="224" y1="53" x2="220" y2="51" stroke="white" stroke-width="2"/>'
    + '<text x="195" y="82" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="Arial,sans-serif">炭素×1 酸素×2</text>'
    + '<text x="325" y="11" text-anchor="middle" font-size="10" fill="#fca5a5" font-family="Arial,sans-serif">O₂（酸素・単体）</text>'
    + '<circle cx="302" cy="48" r="21" fill="#ef4444"/>'
    + '<text x="302" y="53" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial,sans-serif">O</text>'
    + '<circle cx="350" cy="48" r="21" fill="#ef4444"/>'
    + '<text x="350" y="53" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial,sans-serif">O</text>'
    + '<line x1="324" y1="45" x2="328" y2="43" stroke="white" stroke-width="2"/>'
    + '<line x1="324" y1="51" x2="328" y2="53" stroke="white" stroke-width="2"/>'
    + '<text x="326" y="82" text-anchor="middle" font-size="9" fill="#fca5a5" font-family="Arial,sans-serif">酸素×2（同じ元素のみ）</text>'
    + '</svg>'
    + '</div>';

  var qs = [
    { jp:'元素記号 H が表す元素はどれか。',
      answer:'水素', choices:['水素','酸素','炭素','ヘリウム'],
      exp:'H = Hydrogen（水素）。元素記号の最初の文字は大文字、2文字目は小文字。水素は最も軽い元素。' },
    { jp:'元素記号 O が表す元素はどれか。',
      answer:'酸素', choices:['酸素','窒素','炭素','硫黄'],
      exp:'O = Oxygen（酸素）。空気の約21%を占める。呼吸や燃焼に必要な元素。' },
    { jp:'元素記号 Fe が表す元素はどれか。',
      answer:'鉄', choices:['鉄','銅','亜鉛','マグネシウム'],
      exp:'Fe = Ferrum（鉄）。ラテン語の名前が由来。Fe は2文字で鉄を表す。自転車や鉄骨の主成分。' },
    { jp:'元素記号 Cu が表す元素はどれか。',
      answer:'銅', choices:['銅','鉄','亜鉛','ナトリウム'],
      exp:'Cu = Cuprum（銅）。10円玉の主な成分。電気をよく通すため電線にも使われる。' },
    { jp:'化学式 H₂O が表す物質はどれか。',
      answer:'水', choices:['水','水素','酸素','アンモニア'],
      exp:'H₂O = 水。水素（H）2個と酸素（O）1個が結合した分子。「H₂O = 水」は最重要化学式のひとつ。' },
    { jp:'化学式 CO₂ が表す物質はどれか。',
      answer:'二酸化炭素', choices:['二酸化炭素','一酸化炭素','炭素','二酸化硫黄'],
      exp:'CO₂ = 二酸化炭素。炭素1個と酸素2個が結合。呼吸で吐き出したり、燃焼で発生する気体。' },
    { jp:'次のうち「単体」に分類されるのはどれか。',
      answer:'O₂（酸素）', choices:['O₂（酸素）','H₂O（水）','CO₂（二酸化炭素）','NaCl（塩化ナトリウム）'],
      exp:'単体 = 1種類の元素のみでできた物質。O₂ は O（酸素）のみ。H₂O は H と O の2種類なので化合物。' },
    { jp:'次のうち「化合物」に分類されるのはどれか。',
      answer:'NaCl（塩化ナトリウム）', choices:['NaCl（塩化ナトリウム）','O₂（酸素）','H₂（水素）','Cu（銅）'],
      exp:'化合物 = 2種類以上の元素でできた物質。NaCl は Na（ナトリウム）と Cl（塩素）の2種類 → 化合物。' },
    { jp:'化学変化の前後で、原子の総数と質量はどうなるか。',
      answer:'変わらない（質量保存の法則）', choices:['変わらない（質量保存の法則）','増える','減る','変化は予測できない'],
      exp:'質量保存の法則：化学変化の前後で原子の種類と数は変わらず、総質量も変わらない。ラボアジェが発見。' },
    { jp:'元素記号 Na が表す元素はどれか。',
      answer:'ナトリウム', choices:['ナトリウム','窒素','ニッケル','ネオン'],
      exp:'Na = Natrium（ナトリウム）。食塩（NaCl）の成分。水に入れると激しく反応し水素を発生させる。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_chem_s1_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 2: 化合・分解・化学反応式 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚗️ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">化合って「合体」で、分解って「バラバラ」ってこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そのとおり。化合は2つ以上の物質が合わさって1つの新しい物質になること。分解は逆で1つの物質が2つ以上に分かれること。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">漫才コンビが合体するのが化合で、解散するのが分解！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">……まあ間違ってない。あと化学反応式は「左に反応前・右に反応後」で、左右の原子の数を揃えるのがポイントだ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 化合と分解</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">化合（かごう）</div>'
    + '<div class="ex">2種類以上の物質 → 1種類の新しい物質（化合物）</div>'
    + '<div class="ex">例：鉄 + 硫黄 → 硫化鉄　Fe + S → FeS</div>'
    + '<div class="ex">例：銅 + 酸素 → 酸化銅　2Cu + O₂ → 2CuO</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">分解（ぶんかい）</div>'
    + '<div class="ex">1種類の物質 → 2種類以上の物質</div>'
    + '<div class="ex">熱分解：炭酸水素ナトリウム → 炭酸ナトリウム + 水 + CO₂</div>'
    + '<div class="ex">電気分解：水 → 水素 + 酸素（水素:酸素 = 2:1）</div>'
    + '<div class="note">💡 水の電気分解で陰極（-）から水素、陽極（+）から酸素が発生</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 化学反応式のルール</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">化学反応式 = 原子の数のレシピ</div>'
    + '<div class="ex">左辺（反応前）＝ 右辺（反応後）で原子の種類と数を合わせる</div>'
    + '<div class="ex">例：水の生成　2H₂ + O₂ → 2H₂O</div>'
    + '<div class="ex">　　左：H×4、O×2　右：H×4、O×2　← 一致！</div>'
    + '<div class="note">⚠️ 係数（数字）で調節する。分子式の右下の数字は変えない！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">炭酸水素ナトリウムの熱分解（超頻出！）</div>'
    + '<div class="ex">2NaHCO₃ → Na₂CO₃ + H₂O + CO₂</div>'
    + '<div class="ex">確認方法：① 発生した気体（CO₂）→ 石灰水に通す → 白く濁る</div>'
    + '<div class="ex">　　　　　② 発生した水 → 塩化コバルト紙 → 赤く変わる</div>'
    + '<div class="note">💡 NaHCO₃（ベーキングパウダーの成分）が加熱で分解する実験</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">⚡ 水の電気分解ビジュアル</div>'
    + '<svg viewBox="0 0 370 148" width="100%" style="display:block;margin:0 auto;max-width:460px">'
    + '<rect x="105" y="28" width="160" height="108" rx="4" fill="none" stroke="#334155" stroke-width="2.5"/>'
    + '<rect x="106" y="72" width="158" height="63" fill="rgba(59,130,246,0.13)"/>'
    + '<text x="185" y="100" text-anchor="middle" font-size="11" fill="#60a5fa" font-family="Arial,sans-serif">H₂O（水）</text>'
    + '<rect x="143" y="15" width="9" height="95" rx="3" fill="#475569"/>'
    + '<text x="147" y="11" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="Arial,sans-serif">陰極（−）</text>'
    + '<rect x="218" y="15" width="9" height="95" rx="3" fill="#475569"/>'
    + '<text x="222" y="11" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="Arial,sans-serif">陽極（+）</text>'
    + '<circle cx="128" cy="66" r="6" fill="none" stroke="#60a5fa" stroke-width="1.8"/>'
    + '<circle cx="120" cy="52" r="5" fill="none" stroke="#60a5fa" stroke-width="1.8"/>'
    + '<circle cx="133" cy="40" r="7" fill="none" stroke="#60a5fa" stroke-width="1.8"/>'
    + '<text x="100" y="30" text-anchor="middle" font-size="10" fill="#93c5fd" font-family="Arial,sans-serif">H₂ × 2</text>'
    + '<circle cx="240" cy="60" r="8" fill="none" stroke="#ef4444" stroke-width="1.8"/>'
    + '<circle cx="248" cy="44" r="6" fill="none" stroke="#ef4444" stroke-width="1.8"/>'
    + '<text x="268" y="30" text-anchor="middle" font-size="10" fill="#fca5a5" font-family="Arial,sans-serif">O₂ × 1</text>'
    + '<text x="185" y="140" text-anchor="middle" font-size="11" fill="#fcd34d" font-family="Arial,sans-serif">体積比　水素：酸素 ＝ 2：1</text>'
    + '</svg>'
    + '<div style="font-size:11px;color:var(--text2);margin-top:8px;text-align:center">電気分解：2H₂O → 2H₂（陰極）＋ O₂（陽極）</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔩 化合の反応モデル：Fe ＋ S → FeS</div>'
    + '<svg viewBox="0 0 370 90" width="100%" style="display:block;margin:0 auto;max-width:480px">'
    + '<text x="80" y="13" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="Arial,sans-serif">── 反応前 ──</text>'
    + '<circle cx="38" cy="50" r="28" fill="#94a3b8"/>'
    + '<text x="38" y="55" text-anchor="middle" font-size="15" font-weight="bold" fill="white" font-family="Arial,sans-serif">Fe</text>'
    + '<text x="38" y="83" text-anchor="middle" font-size="8" fill="#cbd5e1" font-family="Arial,sans-serif">鉄（磁石◎）</text>'
    + '<text x="82" y="55" text-anchor="middle" font-size="22" fill="#fcd34d" font-family="Arial,sans-serif">+</text>'
    + '<circle cx="120" cy="50" r="22" fill="#eab308"/>'
    + '<text x="120" y="55" text-anchor="middle" font-size="15" font-weight="bold" fill="white" font-family="Arial,sans-serif">S</text>'
    + '<text x="120" y="83" text-anchor="middle" font-size="8" fill="#fef08a" font-family="Arial,sans-serif">硫黄（黄）</text>'
    + '<text x="168" y="48" text-anchor="middle" font-size="9" fill="#fb923c" font-family="Arial,sans-serif">加熱</text>'
    + '<text x="168" y="60" text-anchor="middle" font-size="24" fill="#4ade80" font-family="Arial,sans-serif">→</text>'
    + '<text x="270" y="13" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="Arial,sans-serif">── 反応後（化合物）──</text>'
    + '<circle cx="270" cy="50" r="33" fill="#374151"/>'
    + '<text x="270" y="55" text-anchor="middle" font-size="15" font-weight="bold" fill="#d1d5db" font-family="Arial,sans-serif">FeS</text>'
    + '<text x="270" y="83" text-anchor="middle" font-size="8" fill="#9ca3af" font-family="Arial,sans-serif">硫化鉄（磁石×・性質が変わる）</text>'
    + '</svg>'
    + '</div>';

  var qs = [
    { jp:'2種類以上の物質が合わさって1種類の新しい物質になる変化を何というか。',
      answer:'化合', choices:['化合','分解','酸化','還元'],
      exp:'化合：2種類以上の物質が結合して1種類の新しい化合物ができる変化。鉄+硫黄→硫化鉄が典型例。' },
    { jp:'1種類の物質が2種類以上の物質に分かれる変化を何というか。',
      answer:'分解', choices:['分解','化合','酸化','蒸発'],
      exp:'分解：1種類の物質が2種類以上の物質に分かれる変化。熱による分解を熱分解、電気による分解を電気分解という。' },
    { jp:'炭酸水素ナトリウムを加熱すると何が発生するか（3つ）。',
      answer:'炭酸ナトリウム・水・二酸化炭素',
      choices:['炭酸ナトリウム・水・二酸化炭素','塩化ナトリウム・水素・酸素','炭酸カルシウム・水・酸素','食塩・水・水素'],
      exp:'2NaHCO₃ → Na₂CO₃（炭酸ナトリウム）+ H₂O（水）+ CO₂（二酸化炭素）。石灰水が白濁することでCO₂を確認できる。' },
    { jp:'水を電気分解すると、陰極（-極）から発生する気体はどれか。',
      answer:'水素', choices:['水素','酸素','二酸化炭素','窒素'],
      exp:'水の電気分解：陰極（-）から水素H₂、陽極（+）から酸素O₂が発生。水素:酸素 = 2:1 の体積比（重要！）。' },
    { jp:'水の電気分解で発生する水素と酸素の体積の比はどれか。',
      answer:'水素:酸素 = 2:1', choices:['水素:酸素 = 2:1','水素:酸素 = 1:2','水素:酸素 = 1:1','水素:酸素 = 3:1'],
      exp:'2H₂O → 2H₂ + O₂。水素2分子に対して酸素1分子が発生するので、体積比は水素:酸素 = 2:1。' },
    { jp:'鉄と硫黄が化合してできる物質は何か。',
      answer:'硫化鉄', choices:['硫化鉄','酸化鉄','塩化鉄','炭酸鉄'],
      exp:'Fe + S → FeS（硫化鉄）。化合前の鉄は磁石につくが、硫化鉄になると磁石につかなくなる（性質が変わる）。' },
    { jp:'化学反応式 2H₂ + O₂ → 2H₂O で、左辺の水素原子の総数はいくつか。',
      answer:'4個', choices:['4個','2個','6個','1個'],
      exp:'2H₂ は「H₂ が2分子」なので H 原子は 2×2 = 4個。右辺 2H₂O も H が 2×2 = 4個 → 一致して反応式が成立。' },
    { jp:'化学反応式で、左辺と右辺の何を等しくする必要があるか。',
      answer:'原子の種類と数', choices:['原子の種類と数','分子の数','体積','質量のみ'],
      exp:'質量保存の法則：化学変化の前後で原子の種類と数は変わらない。反応式の左右で各原子の数を揃えることで表現する。' },
    { jp:'炭酸水素ナトリウムの熱分解で発生するCO₂を確認するための試薬はどれか。',
      answer:'石灰水', choices:['石灰水','塩化コバルト紙','BTB溶液','フェノールフタレイン液'],
      exp:'CO₂ + 石灰水（Ca(OH)₂水溶液）→ 白く濁る（炭酸カルシウムCaCO₃が生成）。塩化コバルト紙は水（H₂O）の確認に使う。' },
    { jp:'銅と硫黄が化合してできる物質は何か。',
      answer:'硫化銅', choices:['硫化銅','酸化銅','塩化銅','炭酸銅'],
      exp:'Cu + S → CuS（硫化銅）。黒い固体。化合後は銅とは異なる性質を持つ新しい物質になる。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_chem_s2_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 3: 酸化・還元・燃焼 =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔥 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">酸化って錆びること？でも燃えるのも酸化？同じなの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">どちらも「酸素と結合する」変化だ。燃焼は急激な酸化、鉄の錆は緩やかな酸化——速さが違うだけで本質は同じ。そして還元は逆に酸素を「奪う」変化。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">奪う！じゃあ酸化と還元って同時に起きる泥棒みたいなやつ？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その例えはなかなかいい。酸化が起きれば必ず還元も起きる——セットで覚えよう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 酸化・還元</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">酸化（さんか）</div>'
    + '<div class="ex">物質が酸素（O）と結合する変化</div>'
    + '<div class="ex">例：2Cu + O₂ → 2CuO（酸化銅）　← 銅の酸化</div>'
    + '<div class="ex">例：2Mg + O₂ → 2MgO（酸化マグネシウム）</div>'
    + '<div class="note">💡 燃焼 = 激しい酸化（光や熱を伴う）/ 鉄の錆 = 緩やかな酸化</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">還元（かんげん）</div>'
    + '<div class="ex">物質が酸素（O）を<b>失う</b>変化</div>'
    + '<div class="ex">例：酸化銅 + 炭素 → 銅 + 二酸化炭素</div>'
    + '<div class="ex">　　2CuO + C → 2Cu + CO₂</div>'
    + '<div class="ex">→ CuO が O を失った（還元）、C が O を得た（酸化）</div>'
    + '<div class="note">⚡ 酸化と還元は常に同時に起こる！（どちらか片方だけは起こらない）</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 燃焼と有機物</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">有機物の燃焼</div>'
    + '<div class="ex">炭素(C)を含む有機物（砂糖・紙・ろうそく）が燃えると：</div>'
    + '<div class="ex">→ 必ず CO₂（二酸化炭素）と H₂O（水）が発生</div>'
    + '<div class="ex">例：C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O（ブドウ糖の燃焼）</div>'
    + '<div class="note">💡 スチールウール（細い鉄の繊維）は酸素中でよく燃え酸化鉄になる</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔄 酸化・還元サイクル図：Cu と炭素の反応</div>'
    + '<svg viewBox="0 0 370 105" width="100%" style="display:block;margin:0 auto;max-width:520px">'
    + '<circle cx="52" cy="55" r="30" fill="#f97316"/>'
    + '<text x="52" y="51" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial,sans-serif">Cu</text>'
    + '<text x="52" y="65" text-anchor="middle" font-size="9" fill="#fed7aa" font-family="Arial,sans-serif">銅</text>'
    + '<text x="52" y="93" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">赤茶色</text>'
    + '<line x1="84" y1="55" x2="126" y2="55" stroke="#ef4444" stroke-width="2.5"/>'
    + '<polygon points="120,49 134,55 120,61" fill="#ef4444"/>'
    + '<text x="106" y="45" text-anchor="middle" font-size="9" fill="#ef4444" font-family="Arial,sans-serif">酸化</text>'
    + '<text x="106" y="70" text-anchor="middle" font-size="8" fill="#fca5a5" font-family="Arial,sans-serif">＋ O₂</text>'
    + '<circle cx="185" cy="55" r="30" fill="#1f2937"/>'
    + '<text x="185" y="51" text-anchor="middle" font-size="13" font-weight="bold" fill="#9ca3af" font-family="Arial,sans-serif">CuO</text>'
    + '<text x="185" y="65" text-anchor="middle" font-size="9" fill="#6b7280" font-family="Arial,sans-serif">酸化銅</text>'
    + '<text x="185" y="93" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">黒色</text>'
    + '<line x1="217" y1="55" x2="259" y2="55" stroke="#22c55e" stroke-width="2.5"/>'
    + '<polygon points="253,49 267,55 253,61" fill="#22c55e"/>'
    + '<text x="240" y="45" text-anchor="middle" font-size="9" fill="#22c55e" font-family="Arial,sans-serif">還元</text>'
    + '<text x="240" y="70" text-anchor="middle" font-size="8" fill="#86efac" font-family="Arial,sans-serif">＋ C（炭素）</text>'
    + '<circle cx="318" cy="55" r="30" fill="#f97316"/>'
    + '<text x="318" y="51" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial,sans-serif">Cu</text>'
    + '<text x="318" y="65" text-anchor="middle" font-size="9" fill="#fed7aa" font-family="Arial,sans-serif">銅</text>'
    + '<text x="318" y="93" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">赤茶色に戻る</text>'
    + '<text x="350" y="25" text-anchor="middle" font-size="8" fill="#fcd34d" font-family="Arial,sans-serif">→ CO₂発生</text>'
    + '</svg>'
    + '<div style="font-size:11px;color:var(--text2);margin-top:8px;text-align:center">⚡ CuO が還元される（O を失う）とき、C が酸化される（O を得てCO₂になる）——必ず同時進行！</div>'
    + '</div>';

  var qs = [
    { jp:'物質が酸素と結合する変化を何というか。',
      answer:'酸化', choices:['酸化','還元','中和','分解'],
      exp:'酸化 = 酸素と結合する変化。燃焼（激しい酸化）から錆びる（緩やかな酸化）まで、すべて酸化反応。' },
    { jp:'物質が酸素を失う変化を何というか。',
      answer:'還元', choices:['還元','酸化','化合','電気分解'],
      exp:'還元 = 酸素を失う変化。「還（かえ）す」という字のとおり、酸素を返す（失う）変化をイメージしよう。' },
    { jp:'銅を加熱すると酸化銅（CuO）ができる。このとき銅は何gから何gに変化するか（銅0.64g→酸化銅0.80g）。',
      answer:'質量が増加する（0.64g→0.80g）',
      choices:['質量が増加する（0.64g→0.80g）','質量が減少する','質量は変わらない','反応しない'],
      exp:'酸化では酸素が結合するため質量が増加する。増加分（0.16g）が結合した酸素の質量。銅:酸素 = 4:1 の割合で結合。' },
    { jp:'酸化銅（CuO）と炭素（C）を混ぜて加熱すると、酸化銅は還元される。このとき炭素はどうなるか。',
      answer:'酸化される（CO₂ になる）',
      choices:['酸化される（CO₂ になる）','還元される','分解する','何も変わらない'],
      exp:'2CuO + C → 2Cu + CO₂。CuO が酸素を失う（還元）と同時に、C が酸素を得て CO₂ になる（酸化）。酸化と還元は同時進行。' },
    { jp:'燃焼とはどのような変化か。',
      answer:'光と熱を出す激しい酸化反応',
      choices:['光と熱を出す激しい酸化反応','物質が液体になる変化','物質が分解する変化','電気を通す変化'],
      exp:'燃焼 = 光と熱を出す激しい酸化反応。ろうそくの炎・木が燃えるのは燃焼。鉄の錆は遅い酸化で燃焼とは言わない。' },
    { jp:'有機物が完全に燃焼すると必ず何が発生するか。',
      answer:'二酸化炭素と水', choices:['二酸化炭素と水','水素と酸素','窒素と水','一酸化炭素のみ'],
      exp:'有機物は炭素(C)と水素(H)を含むため、完全燃焼すると C → CO₂、H → H₂O が必ず発生する。石灰水と塩化コバルト紙で確認。' },
    { jp:'マグネシウムを空気中で燃やすと何ができるか。',
      answer:'酸化マグネシウム（MgO）',
      choices:['酸化マグネシウム（MgO）','塩化マグネシウム','硫化マグネシウム','炭酸マグネシウム'],
      exp:'2Mg + O₂ → 2MgO（酸化マグネシウム）。白い粉末状の物質ができる。燃やす前より質量が増える（酸素が結合するため）。' },
    { jp:'酸化と還元の関係として正しいのはどれか。',
      answer:'酸化と還元は必ず同時に起こる',
      choices:['酸化と還元は必ず同時に起こる','酸化と還元は別々に起こる','酸化の後に還元が起こる','還元は酸化の10倍速く起こる'],
      exp:'酸化と還元は必ず同時進行。ある物質が酸素を得る（酸化）とき、必ず別の物質が酸素を失う（還元）。一方だけは起こらない。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_chem_s3_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4() {
  var html = '<div style="background:#1a2236;border:1px solid #334155;border-radius:12px;padding:20px 24px;margin-bottom:24px">'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:8px">📋 確認テスト</div>'
    + '<div style="font-size:16px;color:var(--text);line-height:1.8">原子・分子・化学式・化合・分解・酸化・還元を確認しよう。<br>'
    + '語句記入問題（10問）＋選択問題（10問）の計20問。</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 12px;letter-spacing:.08em">▍語句記入問題</div>';

  var inputQs = [
    { qid:'sci_chem_s4_in0', jp:'物質を構成する最小の粒子を何というか。', answer:'原子',
      exp:'原子（げんし）は物質を構成する最小の粒子。これ以上分けると元素の性質を失う。現在118種類の元素が確認されている。' },
    { qid:'sci_chem_s4_in1', jp:'いくつかの原子が結合した粒子を何というか。', answer:'分子',
      exp:'分子（ぶんし）は原子が結合してできた粒子。H₂O は H 原子2個と O 原子1個が結合した分子。' },
    { qid:'sci_chem_s4_in2', jp:'1種類の元素だけでできた物質を何というか。', answer:'単体',
      exp:'単体 = 1種類の元素のみ（O₂・H₂・Fe・Cu）。化合物 = 2種類以上の元素（H₂O・CO₂・NaCl）。' },
    { qid:'sci_chem_s4_in3', jp:'2種類以上の物質が結合して新しい1種類の物質になる変化を何というか。', answer:'化合',
      exp:'化合：Fe + S → FeS（硫化鉄）、Cu + S → CuS（硫化銅）が典型例。化合後は元の物質と異なる性質になる。' },
    { qid:'sci_chem_s4_in4', jp:'1種類の物質が2種類以上の物質に分かれる変化を何というか。', answer:'分解',
      exp:'分解：熱分解（炭酸水素ナトリウム）と電気分解（水）が頻出。エネルギーを加えて物質をバラバラにする。' },
    { qid:'sci_chem_s4_in5', jp:'水を電気分解したとき、陽極（+）から発生する気体は何か。', answer:'酸素',
      exp:'陽極（+）→ 酸素O₂、陰極（-）→ 水素H₂が発生。体積比は水素:酸素 = 2:1。電気分解: 2H₂O → 2H₂ + O₂。' },
    { qid:'sci_chem_s4_in6', jp:'物質が酸素と結合する変化を何というか。', answer:'酸化',
      exp:'酸化 = 酸素と結合する変化。燃焼（激しい酸化）から錆（緩やかな酸化）まで含む。' },
    { qid:'sci_chem_s4_in7', jp:'光や熱を出す急激な酸化反応を特に何というか。', answer:'燃焼',
      exp:'燃焼 = 光と熱を出す激しい酸化反応。木・ろうそく・エタノールなどが燃えるのが燃焼。' },
    { qid:'sci_chem_s4_in8', jp:'物質が酸素を失う変化を何というか。', answer:'還元',
      exp:'還元 = 酸素を失う変化。酸化銅 + 炭素 → 銅 + CO₂ で、酸化銅が還元（酸素を失う）される。' },
    { qid:'sci_chem_s4_in9', jp:'化学変化の前後で物質の総質量は変わらない。この法則を何というか。', answer:'質量保存の法則',
      exp:'質量保存の法則（ラボアジェ発見）：化学変化の前後で原子の種類と数は変わらないため、総質量も変わらない。' },
  ];

  inputQs.forEach(function(q) {
    html += '<div class="q-card" id="qcard_' + q.qid + '">'
      + '<div class="q-text">' + q.jp + '</div>'
      + makeInput(q.qid, q.jp, q.answer, 10)
      + '<div id="exp_' + q.qid + '" class="exp-card" style="display:none">'
      + '<div style="font-size:13px;color:var(--text2);margin-bottom:4px">📌 解説</div>'
      + '<div style="font-size:14px;line-height:1.9">' + q.exp + '</div>'
      + '</div>'
      + '</div>';
  });

  html += '<div style="font-size:13px;color:var(--text2);margin:32px 0 12px;letter-spacing:.08em">▍選択問題</div>';

  var choiceQs = [
    { jp:'元素記号 Cu の元素名はどれか。',
      answer:'銅', choices:['銅','炭素','塩素','クロム'],
      exp:'Cu = Cuprum（銅）。10円玉の主成分。電気をよく通し、電線にも使われる。' },
    { jp:'次のうち化合物はどれか。',
      answer:'H₂O（水）', choices:['H₂O（水）','O₂（酸素）','Fe（鉄）','Cu（銅）'],
      exp:'H₂O は H と O の2種類の元素でできた化合物。O₂・Fe・Cu はそれぞれ1種類の元素のみ → 単体。' },
    { jp:'炭酸水素ナトリウムを加熱したとき発生する気体を確認するための試薬はどれか。',
      answer:'石灰水', choices:['石灰水','BTB溶液','リトマス紙','フェノールフタレイン液'],
      exp:'発生する CO₂ は石灰水（白濁）で確認。発生する水は塩化コバルト紙（青→赤）で確認。' },
    { jp:'水の電気分解で、水素と酸素の体積比はどれか。',
      answer:'水素:酸素 = 2:1', choices:['水素:酸素 = 2:1','水素:酸素 = 1:2','水素:酸素 = 1:1','水素:酸素 = 3:1'],
      exp:'2H₂O → 2H₂ + O₂。水素2分子:酸素1分子 = 2:1。陰極（-）から水素、陽極（+）から酸素が発生。' },
    { jp:'銅を加熱すると何ができるか。',
      answer:'酸化銅（CuO）', choices:['酸化銅（CuO）','硫化銅（CuS）','塩化銅（CuCl₂）','炭酸銅'],
      exp:'2Cu + O₂ → 2CuO（酸化銅）。加熱で空気中の酸素と結合（酸化）し、黒い酸化銅になる。' },
    { jp:'酸化銅と炭素を混ぜて加熱するとき、酸化銅はどう変化するか。',
      answer:'還元されて銅になる', choices:['還元されて銅になる','酸化されてCO₂になる','分解して酸素と銅になる','変化しない'],
      exp:'2CuO + C → 2Cu + CO₂。CuO が酸素を失う（還元）→ Cu に。同時に C が酸素を得る（酸化）→ CO₂ に。' },
    { jp:'有機物が完全に燃焼したとき必ず発生する物質はどれか。',
      answer:'CO₂と H₂O', choices:['CO₂と H₂O','H₂と O₂','CO₂と H₂','N₂と H₂O'],
      exp:'有機物は C と H を含むため、完全燃焼で CO₂ と H₂O が必ず発生。石灰水で CO₂、塩化コバルト紙で H₂O を確認。' },
    { jp:'鉄と硫黄を混ぜて加熱したとき、生成する物質は何か。',
      answer:'硫化鉄（FeS）', choices:['硫化鉄（FeS）','酸化鉄（Fe₂O₃）','塩化鉄（FeCl₂）','炭酸鉄'],
      exp:'Fe + S → FeS（硫化鉄）。磁石につかず、塩酸を加えると硫化水素（H₂S、腐卵臭）が発生する。' },
    { jp:'酸化と還元の関係として正しいのはどれか。',
      answer:'必ず同時に起こる', choices:['必ず同時に起こる','交互に起こる','どちらかのみ起こる','温度によって異なる'],
      exp:'酸化と還元は必ず同時進行（酸化還元反応）。ある物質が酸素を得れば、必ず別の物質が酸素を失う。' },
    { jp:'化学変化の前後で保存される（変わらない）のは何か。',
      answer:'物質全体の質量', choices:['物質全体の質量','体積','密度','色'],
      exp:'質量保存の法則：化学変化前後で原子の種類・数が変わらないため、物質全体の質量も変わらない。' },
  ];

  choiceQs.forEach(function(q, i) { q._qid = 'sci_chem_s4_ch' + i; });
  choiceQs = shuffleArray(choiceQs);

  choiceQs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 5: 3年予習 =====
function renderSection5() {
  return '<div style="background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.2);border-radius:12px;padding:24px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--teal);font-weight:bold;margin-bottom:12px">🔗 中2化学→中3「化学変化とイオン」への接続</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '原子・元素記号 → <span style="color:var(--gold)">イオン（原子が電子を失う/得る）（中3）</span><br>'
    + '電気分解（水）→ <span style="color:var(--gold)">電解質の電気分解・イオン化（中3）</span><br>'
    + '酸・アルカリの基礎 → <span style="color:var(--gold)">酸・アルカリ・中和・塩（中3）</span><br>'
    + '化学反応式のバランス → <span style="color:var(--gold)">イオン反応式（中3）</span><br>'
    + '酸化銅の還元 → <span style="color:var(--gold)">金属イオンの析出（中3）</span>'
    + '</div></div>'
    + '<div style="background:rgba(245,197,24,0.06);border:1px solid rgba(245,197,24,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px">⚡ 中3でよく出る化学式（先取り）</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'HCl（塩化水素）→ 水に溶けると H⁺ + Cl⁻ に電離<br>'
    + 'NaOH（水酸化ナトリウム）→ Na⁺ + OH⁻ に電離<br>'
    + 'H₂SO₄（硫酸）→ 強い酸性<br>'
    + 'H⁺ + OH⁻ → H₂O（中和反応の基本）'
    + '</div></div>';
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var prefix = 'sci_chem_s4_';
  var total   = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; }).length;
  var correct = Object.keys(answeredSet).filter(function(id){ return id.indexOf(prefix) === 0 && answeredSet[id]; }).length;
  if (total === 0) total = 20;
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '😄' : '🐣';
  var msg = pct >= 90
    ? 'きょん「全部わかった！！令和ロマンより賢い！！」<br>西村「よくやった。次の単元に進もう」'
    : pct >= 70
    ? 'きょん「かなりできた！もう少しで完璧！！」<br>西村「惜しい。もう一度見直したら完璧になるよ」'
    : pct >= 50
    ? 'きょん「半分くらいはわかった！！まだまだやれる！！」<br>西村「基礎の復習をもう一回やってみよう」'
    : 'きょん「難しかった！！でも諦めない！！」<br>西村「焦らなくていい。もう一度セクションを復習してから来よう」';
  var html = '<div class="result-box">'
    + '<div class="result-title">📊 確認テスト 結果</div>'
    + '<div class="result-emoji">' + emoji + '</div>'
    + '<div class="result-score">' + correct + '<span> / ' + total + '問正解</span></div>'
    + '<div style="font-size:28px;color:var(--gold);font-weight:bold;margin-bottom:8px">' + pct + '%</div>'
    + '<div class="result-msg">' + msg + '</div>'
    + '<div style="margin-top:24px">'
    + '<button class="result-btn" onclick="closeResult()">📖 見直しをする</button>'
    + '<button class="result-btn" onclick="goSection(1)" style="background:var(--teal);color:#000">🔄 Section 1 からやり直す</button>'
    + '</div></div>';
  document.getElementById('resultOverlay').innerHTML = html;
  document.getElementById('resultOverlay').style.display = 'block';
}
function closeResult() { document.getElementById('resultOverlay').style.display = 'none'; }

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 6;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var wqs = getWeakQuestions();
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('sci_chem_') === 0; });

  if (allQids.length === 0) {
    mc.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">📊</div><div style="font-size:18px;margin-bottom:8px">まだデータがありません</div><div style="font-size:14px">問題を解くと自動で記録されます</div></div>';
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
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(14,165,233,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text);margin-bottom:2px;line-height:1.6">' + (d.jp || '') + '</div><div style="font-size:13px;color:' + barColor + '">' + (d.answer || '') + '</div></div>'
      + '<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div><div style="width:80px;height:5px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px"></div></div></div>'
      + '</div>';
  });

  if (wqs.length > 0) {
    html += '<button onclick="goSection(7)" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;box-shadow:0 4px 20px rgba(233,69,96,0.3)">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }
  mc.innerHTML = html;
}

// ===== 特訓モード =====
var tokkuQueue   = [];
var tokkuIndex   = 0;
var tokkuSession = { correct: 0, total: 0 };
var tokkuBannerShown = false;

function showTokkuSuggestion(qid) {
  if (document.getElementById('tokkuSuggestBanner')) return;
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (!card) return;
  var banner = document.createElement('div');
  banner.id = 'tokkuSuggestBanner';
  banner.innerHTML = '<div style="margin:16px 0;padding:14px 18px;background:linear-gradient(135deg,rgba(233,69,96,0.1),rgba(233,69,96,0.05));border:1px solid var(--red);border-left:4px solid var(--red);border-radius:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<div style="font-size:28px">🔥</div>'
    + '<div style="flex:1"><div style="font-size:13px;font-weight:bold;color:var(--red);margin-bottom:2px">間違えた問題は特訓モードで克服できる！</div><div style="font-size:12px;color:var(--text2)">弱点問題だけを集中練習。正答率80%で卒業！</div></div>'
    + '<button onclick="goSection(7)" style="background:var(--red);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-family:inherit;font-weight:bold;cursor:pointer;white-space:nowrap;flex-shrink:0">🔥 特訓へ →</button>'
    + '</div>';
  card.parentNode.insertBefore(banner, card.nextSibling);
}

function renderTokkuMode() {
  currentSection = 7;
  renderTabs();
  var wqs = getWeakQuestions();
  var mc  = document.getElementById('mainContent');
  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div class="tokku-complete-msg">すべての問題で正答率80%以上！<br>きょん「俺、めちゃくちゃ強くなってるじゃん！！」<br>西村「本当に成長したね」</div><button onclick="goSection(1)" style="margin-top:24px;background:var(--teal);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button></div>';
    return;
  }
  tokkuQueue   = wqs.slice(0, 15);
  tokkuIndex   = 0;
  tokkuSession = { correct: 0, total: 0 };
  renderTokkuCard();
}
function renderTokkuCard() {
  var mc = document.getElementById('mainContent');
  if (tokkuIndex >= tokkuQueue.length) { showTokkuComplete(); return; }
  var qid = tokkuQueue[tokkuIndex];
  var d   = weakDB[qid];
  if (!d) { tokkuIndex++; renderTokkuCard(); return; }
  var pct   = getPct(qid);
  var color = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
  var isChoice = d.choices && d.choices.length > 0;
  var choicesHtml = '';
  if (isChoice) {
    var shuffled = d.choices.slice().sort(function(){ return Math.random() - 0.5; });
    choicesHtml = '<div class="tokku-choices" id="tokku_choices">'
      + shuffled.map(function(c){ return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c + '">' + c + '</button>'; }).join('')
      + '</div>';
  }
  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex + 1) + ' / ' + tokkuQueue.length + '　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span class="pct" style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp">' + (d.jp || qid) + '</div>'
    + choicesHtml
    + '<div class="tokku-result" id="tokku_result"></div>'
    + '<button id="tokku_next" onclick="nextTokkuCard()" style="display:none;margin-top:14px;background:var(--teal);color:#000;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題 →</button>'
    + '</div>';
  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleTokkuChoice(btn.dataset.tqid, btn.dataset.tchoice); });
  });
}
function handleTokkuChoice(qid, choice) {
  var d = weakDB[qid];
  if (!d) return;
  var correct = choice === d.answer;
  tokkuSession.total++;
  weakDB[qid].total++;
  if (correct) { weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('sci_weakdb', JSON.stringify(weakDB));
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
      xp += 1; localStorage.setItem('sci_xp', xp); updateXP();
      res.className = 'tokku-result tokku-correct';
      res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 正答率' + newPct + '%！この問題は卒業！' : ' 正答率 → ' + newPct + '%');
      showToast(getComment('kyon_correct'));
    } else {
      deductXP(3);
      res.className = 'tokku-result tokku-wrong';
      res.innerHTML = '❌ 間違い！ 正答率 → ' + newPct + '%<div class="tokku-answer">' + d.answer + '</div>';
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
  var msg = pctAll >= 80
    ? 'きょん「全部わかった！！昇格の予感！！」<br>西村「よくやった。次回も頼む」'
    : pctAll >= 50
    ? 'きょん「半分以上できた！もう一回やる！」<br>西村「続けること。それが大事」'
    : 'きょん「難しかった…でも諦めない！！」<br>西村「何度でもやればいい。繰り返すことが力になる」';
  mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">' + emoji + '</div><div class="tokku-complete-title">特訓終了！</div><div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div><div style="font-size:14px;color:var(--text2)">' + tokkuSession.correct + ' / ' + tokkuSession.total + '問正解</div><div class="tokku-complete-msg" style="margin-top:16px">' + msg + '</div><div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button onclick="renderTokkuMode()" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回特訓！</button><button onclick="goSection(1)" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">Section 1 へ戻る</button></div></div>';
  renderWeakBar();
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
goSection(0);