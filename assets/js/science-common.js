// ===== XP SYSTEM =====
var LEVELS = [
  { lv:1, min:0,   label:'Lv.1 🥚',  badge:'NSC入学',        title:'見習い研修生',  status:'きょん「理科？なにそれ食えるの？」' },
  { lv:2, min:15,  label:'Lv.2 🎤',  badge:'NSC卒業',        title:'一般社員',      status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:30,  label:'Lv.3 🎭',  badge:'劇場デビュー',    title:'主任',          status:'きょん「にっくん、俺理科できるかも」' },
  { lv:4, min:50,  label:'Lv.4 ⭐',  badge:'準レギュラー獲得', title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:75,  label:'Lv.5 📺',  badge:'全国ネット',      title:'課長',          status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:105, label:'Lv.6 🌟',  badge:'冠番組獲得',      title:'部長',          status:'きょん「理科で漫才できるかもしれない」' },
  { lv:7, min:140, label:'Lv.7 🏆',  badge:'M-1決勝進出',    title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:180, label:'Lv.8 👑',  badge:'M-1グランプリ優勝',title:'社長',         status:'きょん「俺、令和ロマンに勝ったわ」' },
];
var MAX_XP = 200;
var xp = parseInt(localStorage.getItem('sci_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('sci_answered') || '{}');
var attemptCounts = {};
var sectionDone  = JSON.parse(localStorage.getItem('sci_sections') || '{}');

function getLevel(x) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (x >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
function getNextLevel(x) {
  var cur = getLevel(x);
  for (var i = 0; i < LEVELS.length; i++) {
    if (LEVELS[i].lv === cur.lv + 1) return LEVELS[i];
  }
  return null;
}
function updateXP() {
  var lv = getLevel(xp);
  var next = getNextLevel(xp);
  var fromXP = lv.min;
  var toXP   = next ? next.min : MAX_XP;
  var pct    = Math.min(100, Math.round((xp - fromXP) / (toXP - fromXP) * 100));
  document.getElementById('xpFill').style.width  = pct + '%';
  document.getElementById('xpLevel').textContent  = lv.label;
  document.getElementById('xpBadge').textContent  = lv.badge;
  document.getElementById('xpTitle').textContent  = lv.title;
  document.getElementById('xpStatus').textContent = lv.status;
  var nextEl = document.getElementById('xpNext');
  if (next) nextEl.textContent = xp + ' XP ／ 次まで ' + (next.min - xp) + ' XP';
  else       nextEl.textContent = '🏆 最高位到達！（' + xp + ' XP）';
}
function addXP(pts, qid) {
  if (answeredSet[qid]) return 0;
  answeredSet[qid] = true;
  var prev = getLevel(xp).lv;
  xp += pts;
  localStorage.setItem('sci_xp', xp);
  localStorage.setItem('sci_answered', JSON.stringify(answeredSet));
  updateXP();
  var now = getLevel(xp).lv;
  return now > prev ? now : 0;
}
function deductXP(pts) {
  var prev = getLevel(xp).lv;

  localStorage.setItem('sci_xp', xp);
  updateXP();
  var now = getLevel(xp).lv;
  return now < prev ? prev : 0;
}

// ===== 弱点DB =====
var weakDB = JSON.parse(localStorage.getItem('sci_weakdb') || '{}');

function recordResult(qid, isCorrect) {
  var meta = qMeta[qid];
  if (!meta) return;
  if (!weakDB[qid]) {
    weakDB[qid] = { jp: meta.jp || '', answer: meta.answer || '', choices: meta.choices || [], exp: meta.exp || '', type: meta.type || 'choice', correct: 0, total: 0 };
  }
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('sci_weakdb', JSON.stringify(weakDB));
  localStorage.setItem('sci_lastStudy', new Date().toISOString().slice(0, 10));
  var _today = new Date().toISOString().slice(0,10);
  var _daily = JSON.parse(localStorage.getItem('sci_daily') || '{}');
  _daily[_today] = (_daily[_today] || 0) + 1;
  localStorage.setItem('sci_daily', JSON.stringify(_daily));
  renderWeakBar();
  renderTabs();
}
function getPct(qid) {
  var d = weakDB[qid];
  if (!d || d.total === 0) return 100;
  return Math.round(d.correct / d.total * 100);
}
function getWeakQuestions() {
  return Object.keys(weakDB).filter(function(qid) {
    var d = weakDB[qid];
    return d.total > 0 && getPct(qid) < 80;
  }).sort(function(a, b) { return getPct(a) - getPct(b); });
}
function renderWeakBar() {
  var el = document.getElementById('weakItems');
  if (!el) return;
  var wqs = getWeakQuestions();
  if (wqs.length === 0) {
    el.innerHTML = '<span class="weak-bar-empty">弱点なし！すごい！</span>';
    return;
  }
  var top = wqs.slice(0, 8);
  el.innerHTML = top.map(function(qid) {
    var d = weakDB[qid];
    var pct = getPct(qid);
    var color = pct < 30 ? '#e94560' : pct < 60 ? '#f5c518' : '#8b949e';
    var bar = '';
    for (var i = 0; i < 5; i++) {
      bar += '<span style="color:' + (i < Math.round(pct / 20) ? color : '#21262d') + '">█</span>';
    }
    return '<div class="weak-item"><span class="weak-item-word">' + (d.jp || qid) + '</span><span>' + bar + '</span><span class="weak-item-pct">' + pct + '%</span></div>';
  }).join('');
}

// ===== SPEECH =====
var speechEnabled = (typeof window !== 'undefined' && 'speechSynthesis' in window);
function speak(text) {
  if (!speechEnabled) return;
  try {
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 1.1;
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

// ===== ARTIST COMMENTS =====
var COMMENTS = {
  kyon_correct: [
    'きょん「合ってる！理科できるじゃん！！」',
    'きょん「やった！天才かも！」',
    'きょん「にっくん見て！全部わかってきた！！」',
    'きょん「待って待って、合ってるじゃん！めちゃくちゃすごいじゃん！」',
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

function makeInput(qid, answer, xpPts) {
  qMeta[qid] = Object.assign(qMeta[qid] || {}, { type: 'input', answer: answer, xp: xpPts });
  if (answeredSet[qid]) {
    return '<div class="input-wrap">'
      + '<input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)">'
      + '</div>';
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
  // 部分一致（答えがキーワードを含む場合）
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

function makeChoices(qid, choices, answer, xpPts) {
  choices = shuffleArray(choices);
  qMeta[qid] = Object.assign(qMeta[qid] || {}, { type: 'choice', answer: answer, xp: xpPts, choices: choices });
  if (answeredSet[qid]) {
    return '<div class="choices">' + choices.map(function(c) {
      var cls = c === answer ? 'choice-btn show-correct' : 'choice-btn';
      return '<button class="' + cls + '" disabled>' + c + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="choices">' + choices.map(function(c) {
    return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
  }).join('') + '</div>';
}

function makeFeedback(qid, explanation) {
  var shown = answeredSet[qid] ? 'display:block' : 'display:none';
  return '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + shown + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度チャレンジ！</div>'
    + '<div class="exp-card" id="exp_card_' + qid + '">'
    + '<div class="exp-card-title">📌 解説</div>'
    + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + explanation + '</div>'
    + '</div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '">'
    + '<div class="ans-label">✅ 正解</div>'
    + '<div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div>'
    + '</div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + shown + '">'
    + (answeredSet[qid] ? getComment('nishi_correct') : '')
    + '</div>';
}

function handleChoice(qid, choice) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  if (choice === meta.answer) markCorrect(qid, meta, choice);
  else                         markWrong(qid, meta, choice);
}
function markCorrect(qid, meta, choice) {
  recordResult(qid, true);
  speak('正解！');
  var lvUp = addXP(meta.xp, qid);
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
  if (_inp) { _inp.disabled = true; _inp.style.borderColor = 'var(--green)'; var _sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if (_sb) _sb.style.display='none'; }
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
  speak('もう一度！');
  var wrongMsgs = [
    'きょん「あれ！間違えた！でも次は大丈夫！！」',
    'きょん「また間違えた…！まだまだ大丈夫！！」',
    'きょん「何回間違えてんの！！にっくんに怒られる！！」',
    'きょん「もうやだ！！でも諦めないぞ！！答えを見ちゃおうかな…」',
  ];
  var msg = wrongMsgs[Math.min(wrongMsgs.length - 1, attemptCounts[qid] - 1)];
  if (demoted) {
    setTimeout(function() {
      showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」', 'demote');
    }, 200);
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
  localStorage.setItem('sci_answered', JSON.stringify(answeredSet));
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
  if (ac) { ac.textContent = 'きょん「ふーん、そういうことか。覚えた！次は自分でできる！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。次は自分で解いてみよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete() {
  var prefix = 'sci_s' + currentSection + '_';
  var sectionQ = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sectionQ.length === 0) return;
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done) {
    sectionDone[currentSection] = true;
    localStorage.setItem('sci_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb) {
      nb.style.display = 'block';
      if (!document.getElementById('sectionCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'sectionCompleteBanner';
        var nextSec = currentSection < 5 ? 'Section ' + (currentSection + 1) + ' へ進もう！' : '確認テストへ挑戦！';
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
  { id: 0, label: '🧪 スタート', title: '物質・気体・水溶液',  sub: '中1理科の最重要単元。中3「化学変化とイオン」の土台を作ろう！' },
  { id: 1, label: '物質分類',   title: '物質の分類',           sub: '純物質・混合物・単体・化合物——4つの分類をマスターしよう' },
  { id: 2, label: '状態変化',   title: '状態変化',             sub: '融解・蒸発・凝固・昇華と融点・沸点' },
  { id: 3, label: '気体',       title: '気体の性質',            sub: '酸素・水素・二酸化炭素・アンモニアの発生と集め方' },
  { id: 4, label: '水溶液',     title: '水溶液の性質',          sub: '溶質・溶媒・濃度・溶解度・再結晶' },
  { id: 5, label: '確認テスト', title: '確認テスト',            sub: '全単元の総まとめ！何問正解できるかな？' },
  { id: 6, label: '🔗3年予習',  title: '3年予習：化学変化とイオン', sub: 'ここで学んだ内容が中3「化学変化とイオン」に繋がる！' },
  { id: 7, label: '📊弱点',     title: '弱点ノート',            sub: '間違えた問題の正答率を確認しよう' },
  { id: 8, label: '🔥特訓',     title: '弱点特訓モード',         sub: '間違えた問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab';
    if (s.id >= 7) cls += ' tokku';
    if (s.id === currentSection) cls += ' active';
    if (sectionDone[s.id] && s.id < 7) cls += ' done';
    var label = s.label + (sectionDone[s.id] && s.id < 7 ? ' ✓' : '');
    if (s.id === 8) {
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
  if (id === 7) { renderWeakNote();  return; }
  if (id === 8) { renderTokkuMode(); return; }

  var s = SECTIONS[id];
  var html = '';
  // progress dots
  html += '<div class="progress-dots">';
  for (var i = 0; i <= 6; i++) {
    var dc = 'dot' + (i < id ? ' done' : i === id ? ' current' : '');
    html += '<div class="' + dc + '"></div>';
  }
  html += '</div>';
  // header
  html += '<div class="section-header">'
    + '<div class="section-badge">理科 CH.1 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">'   + s.sub   + '</div>'
    + '</div>';

  if      (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();
  else if (id === 5) html += renderSection5();
  else if (id === 6) html += renderSection6();

  // next button
  if (id > 0 && id <= 5) {
    var nextLabel = id < 5 ? '次のセクションへ →' : '🏆 結果を見る！';
    var nextAction = id < 5 ? 'goSection(' + (id + 1) + ')' : 'showFinalResult()';
    html += '<button class="next-section-btn" id="nextBtn" onclick="' + nextAction + '">' + nextLabel + '</button>';
  }

  document.getElementById('mainContent').innerHTML = html;

  // attach events
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
      if (e.key === 'Enter') {
        var qid = inp.id.replace('inp_','');
        handleInput(qid);
      }
    });
  });

  if (sectionDone[id]) {
    var nb = document.getElementById('nextBtn');
    if (nb) nb.style.display = 'block';
  }
  checkSectionComplete();
}

// ===== SECTION 0: TOP =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">🧪 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">ねえにっくん、理科って暗記ばっかりで嫌なんだけど！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">理科も英語と一緒で「ルール」があるんだよ。物質の分類・気体の性質・水溶液……全部パターンで覚えられる。しかも中1のここをちゃんとやれば、中3の「化学変化とイオン」が楽になる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">え、中3に繋がるの！？じゃあやるしかないか！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。まず「物質の分類」から始めよう。純物質・混合物・単体・化合物——4つだけ。</div></div></div>'
    + '</div>'
    + '<button class="start-btn" onclick="goSection(1)">🧪 物質の分類から始める →</button>';
}

// ===== SECTION 1: 物質の分類 =====
function renderSection1() {
  var html = '';

  // きょん・西村の会話
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🧪 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">純物質って何？混合物って何？なんか似てる名前ばっかりだよ！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">シンプルに分けよう。「1種類の物質か、複数混ざってるか」だけ。鉄は鉄だけ→純物質。空気は窒素・酸素・アルゴンが混ざってる→混合物。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">じゃあ純物質をさらに分けると単体と化合物があるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その通り。元素が1種類だけ→単体（酸素O₂・鉄Fe）。2種類以上→化合物（水H₂O・食塩NaCl）。</div></div></div>'
    + '</div>';

  // 分類ルール
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 物質の分類ルール（4つだけ！）</div>'
    + '<div class="classify-tree">'
    + '<div class="ct-root">物質</div>'
    + '<div style="margin:8px 0;color:var(--text2)">┌─────────┬─────────┐</div>'
    + '<div style="display:flex;justify-content:center;gap:80px">'
    + '<div><div class="ct-leaf">純物質</div><div class="ct-ex">1種類の物質からなる</div></div>'
    + '<div><div class="ct-leaf">混合物</div><div class="ct-ex">2種類以上が混ざっている</div></div>'
    + '</div>'
    + '<div style="margin:8px 0;color:var(--text2)">純物質をさらに↓</div>'
    + '<div style="display:flex;justify-content:center;gap:60px">'
    + '<div><div class="ct-leaf">単体</div><div class="ct-ex">元素1種類<br>鉄・銅・酸素</div></div>'
    + '<div><div class="ct-leaf">化合物</div><div class="ct-ex">元素2種類以上<br>水・食塩・CO₂</div></div>'
    + '</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">💡 覚え方のポイント</div>'
    + '<div class="ex">純物質 → 「純粋」＝1種類だけ</div>'
    + '<div class="ex">混合物 → 「混ぜる」＝2種類以上</div>'
    + '<div class="ex">単体   → 「単」＝元素が1種類（原子の種類で判断！）</div>'
    + '<div class="ex">化合物 → 「化合」＝元素が2種類以上</div>'
    + '<div class="note">⚠️ O₂（酸素）は原子が2つでも元素は「O」だけ→ 単体！</div>'
    + '</div>'
    + '</div>';

  // 練習問題
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 物質の分類</div>';

  var qs = [
    {
      q: '鉄（Fe）はどれに分類される？',
      sub: 'Feは鉄原子だけでできている',
      a: '単体',
      choices: ['単体', '化合物', '混合物'],
      jp: '鉄（Fe）の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>元素が1種類だけの純物質 → 単体</span><span class="exp-ok">✅ 鉄（Fe）= 鉄元素だけ → 単体</span><span class="exp-ng">❌ 化合物は元素が2種類以上（水H₂Oなど）</span><span class="exp-tip">💡 単体の例：鉄Fe・銅Cu・酸素O₂・水素H₂・金Au</span>'
    },
    {
      q: '空気はどれに分類される？',
      sub: '空気は窒素N₂・酸素O₂・アルゴンArなどが混ざっている',
      a: '混合物',
      choices: ['純物質', '混合物'],
      jp: '空気の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>2種類以上の物質が混ざっている → 混合物</span><span class="exp-ok">✅ 空気 = 窒素・酸素・アルゴン… → 混合物</span><span class="exp-ng">❌ 純物質は1種類の物質だけ</span><span class="exp-tip">💡 混合物の例：空気・海水・食塩水・合金（ステンレスなど）</span>'
    },
    {
      q: '水（H₂O）はどれに分類される？',
      sub: 'H₂Oは水素Hと酸素Oの2種類の元素でできている',
      a: '化合物',
      choices: ['単体', '化合物', '混合物'],
      jp: '水（H₂O）の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>元素が2種類以上の純物質 → 化合物</span><span class="exp-ok">✅ 水（H₂O）= H（水素）+ O（酸素）→ 化合物</span><span class="exp-ng">❌ 単体は元素が1種類だけ</span><span class="exp-tip">💡 化合物の例：水H₂O・食塩NaCl・二酸化炭素CO₂・アンモニアNH₃</span>'
    },
    {
      q: '酸素（O₂）はどれに分類される？',
      sub: 'O₂は酸素原子2個が結合しているが、元素はOだけ',
      a: '単体',
      choices: ['単体', '化合物', '混合物'],
      jp: '酸素（O₂）の分類',
      exp: '<span class="exp-rule"><span class="label">📐 重要ポイント</span>O₂は原子が2個でも、元素の種類は「O」だけ → 単体</span><span class="exp-ok">✅ O₂ = 酸素元素だけ → 単体</span><span class="exp-ng">❌ 「原子の数」ではなく「元素の種類」で判断する！</span><span class="exp-tip">💡 H₂（水素）・N₂（窒素）・Cl₂（塩素）も同じ考え方で単体</span>'
    },
    {
      q: '食塩水はどれに分類される？',
      sub: '食塩水は食塩（NaCl）を水（H₂O）に溶かしたもの',
      a: '混合物',
      choices: ['純物質', '混合物'],
      jp: '食塩水の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>2種類以上の物質が混ざっている → 混合物</span><span class="exp-ok">✅ 食塩水 = NaCl（食塩）+ H₂O（水）→ 混合物</span><span class="exp-tip">💡 海水・砂糖水・炭酸水も混合物！　水は純物質だが食塩水は混合物</span>'
    },
    {
      q: '食塩（NaCl）はどれに分類される？',
      sub: 'NaClはNa（ナトリウム）とCl（塩素）の2種類の元素でできている',
      a: '化合物',
      choices: ['単体', '化合物', '混合物'],
      jp: '食塩（NaCl）の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>元素が2種類以上の純物質 → 化合物</span><span class="exp-ok">✅ NaCl = Na（ナトリウム）+ Cl（塩素）→ 化合物</span><span class="exp-tip">💡 NaClは純物質！食塩水（NaCl + H₂O）とは違う</span>'
    },
    {
      q: '銅（Cu）はどれに分類される？',
      sub: 'Cuは銅元素だけでできている金属',
      a: '単体',
      choices: ['単体', '化合物', '混合物'],
      jp: '銅（Cu）の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>元素が1種類だけの純物質 → 単体</span><span class="exp-ok">✅ 銅（Cu）= 銅元素だけ → 単体</span><span class="exp-tip">💡 金属の単体：鉄Fe・銅Cu・金Au・銀Ag・亜鉛Zn</span>'
    },
    {
      q: '二酸化炭素（CO₂）はどれに分類される？',
      sub: 'CO₂は炭素Cと酸素Oの2種類の元素でできている',
      a: '化合物',
      choices: ['単体', '化合物', '混合物'],
      jp: '二酸化炭素（CO₂）の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>元素が2種類以上の純物質 → 化合物</span><span class="exp-ok">✅ CO₂ = C（炭素）+ O（酸素）→ 化合物</span><span class="exp-ng">❌ 酸素O₂は単体。CO₂（酸素を含む化合物）と混同しないこと！</span><span class="exp-tip">💡 「C（炭素）と O₂（酸素）が化合」したから化合物！</span>'
    },
    {
      q: '海水はどれに分類される？',
      sub: '海水は水・食塩・マグネシウムなど様々な物質が溶けている',
      a: '混合物',
      choices: ['純物質', '混合物'],
      jp: '海水の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>2種類以上の物質が混ざっている → 混合物</span><span class="exp-ok">✅ 海水 = 水 + 食塩 + ミネラル等 → 混合物</span><span class="exp-tip">💡 「海水」と「水（H₂O）」は別物！水は純物質だが海水は混合物</span>'
    },
    {
      q: '純物質の中で、1種類の元素からできているものを何という？',
      sub: '',
      a: '単体',
      choices: ['単体', '化合物'],
      jp: '単体の定義',
      exp: '<span class="exp-rule"><span class="label">📐 まとめ</span>純物質の分類：元素1種類 → 単体　元素2種類以上 → 化合物</span><span class="exp-ok">✅ 単体の例：O₂・H₂・Fe・Cu・N₂</span><span class="exp-ok">✅ 化合物の例：H₂O・NaCl・CO₂・NH₃</span><span class="exp-tip">💡 「単（単純）」= 1種類だけ！という語呂でOK</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_s1_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type: 'choice', answer: q.a, xp: 4, jp: q.jp, choices: q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 4)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });

  html += '</div>'; // practice-section
  return html;
}

// ===== SECTION 2 〜 6 は今後追加 =====
function renderSection2() {
  var html = '';

  // きょん・西村の会話
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🧪 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">氷が溶けるのも「状態変化」なの？それってどう分類するの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">そう。固体→液体が「融解」、液体→気体が「蒸発」、逆に液体→固体が「凝固」。変化の名前と方向を一緒に覚えるのがコツだよ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">あとドライアイスが直接気体になるやつは？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">固体が液体を経ずに直接気体になるのは「昇華」。ドライアイスが昇華の代表例。もうひとつ大事なのは、状態変化している間は温度が変わらないってこと——これが純物質の証拠になる。</div></div></div>'
    + '</div>';

  // ルールカード①：状態変化の名前
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 状態変化の種類と方向（6つ）</div>'
    + '<div class="rule-box">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:14px;line-height:2.2">'
    + '<div><span style="color:var(--teal)">固体 → 液体</span>　<strong style="color:var(--gold)">融解（ゆうかい）</strong></div>'
    + '<div><span style="color:var(--teal)">液体 → 固体</span>　<strong style="color:var(--gold)">凝固（ぎょうこ）</strong></div>'
    + '<div><span style="color:var(--teal)">液体 → 気体</span>　<strong style="color:var(--gold)">蒸発（じょうはつ）</strong></div>'
    + '<div><span style="color:var(--teal)">気体 → 液体</span>　<strong style="color:var(--gold)">凝縮（ぎょうしゅく）</strong></div>'
    + '<div><span style="color:var(--teal)">固体 → 気体</span>　<strong style="color:var(--gold)">昇華（しょうか）</strong></div>'
    + '<div><span style="color:var(--teal)">気体 → 固体</span>　<strong style="color:var(--gold)">昇華（逆）</strong></div>'
    + '</div>'
    + '<div class="note" style="margin-top:12px">💡 「昇華」はドライアイス・ヨウ素が代表例。液体を通り飛ばす！</div>'
    + '</div>'
    + '</div>';

  // ルールカード②：融点・沸点
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 融点・沸点と純物質の特徴</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">融点（ゆうてん）・沸点（ふってん）</div>'
    + '<div class="ex">融点：固体 → 液体 になる温度（例：水は 0℃）</div>'
    + '<div class="ex">沸点：液体 → 気体 になる温度（例：水は 100℃）</div>'
    + '<div class="note">⭐ 純物質は融点・沸点が <strong>一定</strong>。状態変化している間は温度が変わらない！<br>混合物は一定にならない → これで純物質か判断できる</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">蒸留（じょうりゅう）</div>'
    + '<div class="ex">沸点の違いを利用して混合物を分ける操作</div>'
    + '<div class="ex">例：エタノール（沸点78℃）＋水（沸点100℃）を加熱 → 先にエタノールが出てくる</div>'
    + '</div>'
    + '</div>';

  // 練習問題
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 状態変化</div>';

  var qs = [
    {
      q: '氷（固体）が溶けて水（液体）になる変化を何という？',
      sub: '',
      a: '融解',
      choices: ['融解', '蒸発', '凝固', '昇華'],
      jp: '固体→液体の変化名',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>固体 → 液体 の変化 = 融解（ゆうかい）</span><span class="exp-ok">✅ 氷→水 は融解</span><span class="exp-ng">❌ 蒸発は液体→気体 / 凝固は液体→固体</span><span class="exp-tip">💡 「融」=溶ける。融解は固体が「融ける」変化！</span>'
    },
    {
      q: '水（液体）が水蒸気（気体）になる変化を何という？',
      sub: '',
      a: '蒸発',
      choices: ['融解', '蒸発', '凝固', '昇華'],
      jp: '液体→気体の変化名',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>液体 → 気体 の変化 = 蒸発（じょうはつ）</span><span class="exp-ok">✅ 水→水蒸気 は蒸発</span><span class="exp-tip">💡 沸点に達して激しく蒸発することを特に「沸騰（ふっとう）」という</span>'
    },
    {
      q: '水（液体）が凍って氷（固体）になる変化を何という？',
      sub: '',
      a: '凝固',
      choices: ['融解', '蒸発', '凝固', '昇華'],
      jp: '液体→固体の変化名',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>液体 → 固体 の変化 = 凝固（ぎょうこ）</span><span class="exp-ok">✅ 水→氷 は凝固</span><span class="exp-ng">❌ 融解の逆が凝固！混同しやすいので注意</span><span class="exp-tip">💡 「凝」=固まる。凝固は固体に「凝る」変化！</span>'
    },
    {
      q: 'ドライアイス（固体）が直接気体になる変化を何という？',
      sub: '液体を経由せずに直接変化する',
      a: '昇華',
      choices: ['融解', '蒸発', '凝固', '昇華'],
      jp: '固体→気体（直接）の変化名',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>固体 → 気体（液体を経ない）= 昇華（しょうか）</span><span class="exp-ok">✅ ドライアイス・ヨウ素は昇華する物質</span><span class="exp-tip">💡 「昇」=上にのぼる。固体が液体をとびこえて気体に「昇」る！</span>'
    },
    {
      q: '水の融点は何℃？',
      sub: '1気圧のときの値',
      a: '0℃',
      choices: ['0℃', '100℃', '4℃', '-78℃'],
      jp: '水の融点',
      exp: '<span class="exp-rule"><span class="label">📐 覚え必須</span>水の融点 = 0℃（固体→液体になる温度）</span><span class="exp-ok">✅ 0℃で氷が溶け始める</span><span class="exp-tip">💡 水の融点0℃・沸点100℃はセットで絶対暗記！入試に毎年出る</span>'
    },
    {
      q: '水の沸点は何℃？',
      sub: '1気圧のときの値',
      a: '100℃',
      choices: ['0℃', '100℃', '78℃', '37℃'],
      jp: '水の沸点',
      exp: '<span class="exp-rule"><span class="label">📐 覚え必須</span>水の沸点 = 100℃（液体→気体になる温度）</span><span class="exp-ok">✅ 100℃で水が沸騰（激しく蒸発）する</span><span class="exp-tip">💡 エタノールの沸点は約78℃ → 水より先に気体になる（蒸留の根拠！）</span>'
    },
    {
      q: '状態変化が起きているとき（例：氷が融けている途中）、温度はどうなる？',
      sub: '純物質を一定の熱で加熱し続けた場合',
      a: '一定のまま変わらない',
      choices: ['一定のまま変わらない', 'どんどん上がる', 'どんどん下がる'],
      jp: '状態変化中の温度変化',
      exp: '<span class="exp-rule"><span class="label">📐 重要ポイント</span>純物質が状態変化している間 → 温度は一定（変わらない）</span><span class="exp-ok">✅ 氷が融けている間は0℃のまま / 水が沸騰している間は100℃のまま</span><span class="exp-ng">❌ 混合物は融点・沸点が一定にならない</span><span class="exp-tip">💡 これを使って「純物質かどうか」を見分けられる！グラフ問題で頻出</span>'
    },
    {
      q: '状態変化のとき、変化しないものはどれ？',
      sub: '物質を構成する粒子の数は変わらない',
      a: '質量',
      choices: ['質量', '体積', '形', '温度'],
      jp: '状態変化で変わらないもの',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>状態変化では粒子の数が変わらない → 質量（重さ）は変わらない</span><span class="exp-ok">✅ 氷100gが融けても水100g（質量は同じ）</span><span class="exp-ng">❌ 体積は変わる（水→氷で体積が増える）</span><span class="exp-tip">💡 質量保存！状態変化は粒子の「並び方」が変わるだけ。数は同じ</span>'
    },
    {
      q: 'エタノール（沸点78℃）と水（沸点100℃）の混合物を分けるのに使う操作は？',
      sub: '沸点の違いを利用して分離する',
      a: '蒸留',
      choices: ['蒸留', '再結晶', '昇華', '融解'],
      jp: 'エタノールと水を分ける操作',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>沸点の違いを利用して混合物を分ける操作 = 蒸留（じょうりゅう）</span><span class="exp-ok">✅ 加熱すると沸点の低いエタノール（78℃）が先に蒸発 → 冷やして回収</span><span class="exp-tip">💡 蒸留は「蒸発させてから液体に戻す」。ウイスキー・日本酒の製造にも使われる！</span>'
    },
    {
      q: '融点・沸点が一定（決まった値になる）のは、純物質・混合物どちらの特徴？',
      sub: '加熱したときの温度変化グラフで判断できる',
      a: '純物質',
      choices: ['純物質', '混合物', 'どちらも同じ'],
      jp: '融点・沸点が一定なのは純物質か混合物か',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>融点・沸点が一定 → 純物質の特徴</span><span class="exp-ok">✅ 水：融点0℃・沸点100℃（常に一定）</span><span class="exp-ng">❌ 食塩水（混合物）は沸点が100℃より高くなり、一定にならない</span><span class="exp-tip">💡 加熱曲線グラフで「温度が止まる区間」があれば純物質！止まらなければ混合物</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_s2_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type: 'choice', answer: q.a, xp: 4, jp: q.jp, choices: q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 4)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });

  html += '</div>'; // practice-section
  return html;
}
function renderSection3() {
  var html = '';

  // 導入会話
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🧪 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">気体って酸素・水素・二酸化炭素・アンモニアが出てくるけど、全部覚えなきゃいけないの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">4つだけ。それぞれ「発生方法」「性質」「集め方」の3セットで覚える。集め方のルールが特にシンプルで——水に溶けにくければ水上置換、水に溶けやすくて軽ければ上方置換、重ければ下方置換。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">アンモニアだけ上方置換なの？独特だね！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。アンモニアは水に非常に溶けやすいので水上置換が使えない。しかも空気より軽いから上から集める。この2点がポイント。</div></div></div>'
    + '</div>';

  // 集め方ルールカード
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 気体の集め方（3種類）</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">'
    + '<div style="background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.25);border-radius:10px;padding:14px;text-align:center">'
    + '<div style="font-size:13px;font-weight:bold;color:var(--teal);margin-bottom:8px">水上置換法</div>'
    + '<div style="font-size:12px;color:var(--text2);line-height:1.9">水に<strong style="color:var(--text)">溶けにくい</strong>気体<br>酸素・水素・<br>二酸化炭素</div>'
    + '</div>'
    + '<div style="background:rgba(63,185,80,0.06);border:1px solid rgba(63,185,80,0.25);border-radius:10px;padding:14px;text-align:center">'
    + '<div style="font-size:13px;font-weight:bold;color:var(--green);margin-bottom:8px">上方置換法</div>'
    + '<div style="font-size:12px;color:var(--text2);line-height:1.9">水に溶けやすく<br><strong style="color:var(--text)">空気より軽い</strong><br>アンモニア</div>'
    + '</div>'
    + '<div style="background:rgba(245,197,24,0.06);border:1px solid rgba(245,197,24,0.25);border-radius:10px;padding:14px;text-align:center">'
    + '<div style="font-size:13px;font-weight:bold;color:var(--gold);margin-bottom:8px">下方置換法</div>'
    + '<div style="font-size:12px;color:var(--text2);line-height:1.9">水に溶けやすく<br><strong style="color:var(--text)">空気より重い</strong><br>二酸化炭素も可</div>'
    + '</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="note">💡 一番確実なのは水上置換法（純粋に集めやすい）。まず「水に溶けにくいか？」を確認！</div>'
    + '</div>'
    + '</div>';

  // 4気体まとめ表
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 4つの気体まとめ</div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    + '<tr style="background:var(--bg3);color:var(--teal)">'
    + '<td style="padding:8px 12px;font-weight:bold">気体</td>'
    + '<td style="padding:8px 12px;font-weight:bold">発生方法</td>'
    + '<td style="padding:8px 12px;font-weight:bold">主な性質</td>'
    + '<td style="padding:8px 12px;font-weight:bold">集め方</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 12px;color:var(--gold);font-weight:bold">酸素 O₂</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">二酸化マンガン<br>＋過酸化水素水</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">無色無臭・支燃性<br>（ものを燃やす）</td>'
    + '<td style="padding:8px 12px;color:var(--teal)">水上置換法</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 12px;color:var(--gold);font-weight:bold">水素 H₂</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">亜鉛（鉄）<br>＋塩酸</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">無色無臭・最も軽い<br>可燃性（燃える）</td>'
    + '<td style="padding:8px 12px;color:var(--teal)">水上置換法</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 12px;color:var(--gold);font-weight:bold">二酸化炭素 CO₂</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">石灰石（貝殻）<br>＋塩酸</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">無色無臭・空気より重い<br>石灰水を白濁させる</td>'
    + '<td style="padding:8px 12px;color:var(--teal)">水上置換法<br>下方置換法</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="padding:8px 12px;color:var(--gold);font-weight:bold">アンモニア NH₃</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">塩化アンモニウム<br>＋水酸化カルシウム<br>（加熱）</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">無色・刺激臭<br>水に非常に溶けやすい<br>アルカリ性・空気より軽い</td>'
    + '<td style="padding:8px 12px;color:var(--green)">上方置換法</td>'
    + '</tr>'
    + '</table>'
    + '</div>'
    + '</div>';

  // 練習問題
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 気体の性質</div>';

  var qs = [
    {
      q: '酸素を集めるのに最も適した方法はどれ？',
      sub: '酸素は水に溶けにくい気体',
      a: '水上置換法',
      choices: ['水上置換法', '上方置換法', '下方置換法'],
      jp: '酸素の集め方',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>水に溶けにくい気体 → 水上置換法</span><span class="exp-ok">✅ 酸素は水に溶けにくい → 水上置換法</span><span class="exp-tip">💡 水上置換法は気体を純粋に集められる最も確実な方法。水に溶けにくい気体はすべて使える</span>'
    },
    {
      q: 'アンモニアを集めるのに最も適した方法はどれ？',
      sub: 'アンモニアは水に非常に溶けやすく、空気より軽い',
      a: '上方置換法',
      choices: ['水上置換法', '上方置換法', '下方置換法'],
      jp: 'アンモニアの集め方',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>水に溶けやすく・空気より軽い → 上方置換法</span><span class="exp-ok">✅ アンモニア = 水に溶けやすい＋軽い → 上方置換法</span><span class="exp-ng">❌ 水上置換法は使えない（水に溶けてしまう）</span><span class="exp-tip">💡 上方置換法を使う気体はアンモニアだけ！これは丸ごと覚えてしまおう</span>'
    },
    {
      q: '二酸化炭素を石灰水に通すと、石灰水はどうなる？',
      sub: '石灰水は水酸化カルシウムの水溶液',
      a: '白くにごる',
      choices: ['白くにごる', '赤くなる', '青くなる', '変化しない'],
      jp: 'CO₂と石灰水の反応',
      exp: '<span class="exp-rule"><span class="label">📐 二酸化炭素の検出方法</span>CO₂ + 石灰水 → 白くにごる（炭酸カルシウムが生成）</span><span class="exp-ok">✅ 「石灰水が白くにごったら二酸化炭素」は入試の定番！</span><span class="exp-tip">💡 これはCO₂の確認に使う。「石灰水＝CO₂検出薬」とセットで覚えよう</span>'
    },
    {
      q: '全気体の中で最も軽い（密度が最小の）気体はどれ？',
      sub: '',
      a: '水素',
      choices: ['水素', '酸素', 'アンモニア', '二酸化炭素'],
      jp: '最も軽い気体',
      exp: '<span class="exp-rule"><span class="label">📐 覚え必須</span>最も軽い気体 = 水素（H₂）</span><span class="exp-ok">✅ 水素の分子量は2（H×2）。全気体で最小</span><span class="exp-tip">💡 軽さ順：水素H₂(2) ＜ ヘリウムHe(4) ＜ アンモニアNH₃(17) ＜ 空気(約29) ＜ CO₂(44)</span>'
    },
    {
      q: '酸素を発生させる実験で使う薬品の組み合わせはどれ？',
      sub: '',
      a: '二酸化マンガン＋過酸化水素水',
      choices: ['二酸化マンガン＋過酸化水素水', '亜鉛＋塩酸', '石灰石＋塩酸', '塩化アンモニウム＋水酸化カルシウム'],
      jp: '酸素の発生方法',
      exp: '<span class="exp-rule"><span class="label">📐 酸素の発生</span>二酸化マンガン（触媒）＋過酸化水素水（オキシドール）→ 酸素 ＋ 水</span><span class="exp-ok">✅ 二酸化マンガンは触媒（自分は変化せず反応を速くする）</span><span class="exp-tip">💡 オキシドール＝市販の消毒液。傷口で泡立つのは酸素が発生しているから！</span>'
    },
    {
      q: '水素を発生させる実験で使う薬品の組み合わせはどれ？',
      sub: '',
      a: '亜鉛＋塩酸',
      choices: ['二酸化マンガン＋過酸化水素水', '亜鉛＋塩酸', '石灰石＋塩酸', '塩化アンモニウム＋水酸化カルシウム'],
      jp: '水素の発生方法',
      exp: '<span class="exp-rule"><span class="label">📐 水素の発生</span>亜鉛（または鉄・マグネシウム）＋塩酸 → 水素 ＋ 塩化亜鉛</span><span class="exp-ok">✅ 金属＋酸 → 水素が発生するのが基本パターン</span><span class="exp-tip">💡 水素は火をつけると「ポン」と音を立てて燃える（可燃性）。確認方法として頻出！</span>'
    },
    {
      q: 'アンモニアの性質として正しいのはどれ？',
      sub: '',
      a: '刺激臭がある',
      choices: ['刺激臭がある', '無臭である', '空気より重い', '水に溶けにくい'],
      jp: 'アンモニアの性質',
      exp: '<span class="exp-rule"><span class="label">📐 アンモニアの特徴まとめ</span>①刺激臭あり　②水に非常に溶けやすい　③空気より軽い　④アルカリ性</span><span class="exp-ok">✅ 刺激臭がある → アンモニアの大きな特徴</span><span class="exp-ng">❌ 空気より「軽い」（重くない）　水に「溶けやすい」（溶けにくくない）</span><span class="exp-tip">💡 アンモニア臭は目にしみるような刺激臭。トイレのにおいの原因物質！</span>'
    },
    {
      q: '二酸化炭素を発生させる実験で使う薬品の組み合わせはどれ？',
      sub: '',
      a: '石灰石＋塩酸',
      choices: ['二酸化マンガン＋過酸化水素水', '亜鉛＋塩酸', '石灰石＋塩酸', '塩化アンモニウム＋水酸化カルシウム'],
      jp: '二酸化炭素の発生方法',
      exp: '<span class="exp-rule"><span class="label">📐 二酸化炭素の発生</span>石灰石（炭酸カルシウム CaCO₃）または貝殻・卵の殻 ＋ 塩酸 → CO₂ ＋ 水 ＋ 塩化カルシウム</span><span class="exp-ok">✅ 石灰石（または大理石・貝殻）＋塩酸 がCO₂の基本発生法</span><span class="exp-tip">💡 炭酸飲料の泡もCO₂！身近なところにたくさんある</span>'
    },
    {
      q: '4つの気体（酸素・水素・二酸化炭素・アンモニア）の中で、水に最も溶けやすいのはどれ？',
      sub: '',
      a: 'アンモニア',
      choices: ['酸素', '水素', '二酸化炭素', 'アンモニア'],
      jp: '水に最も溶けやすい気体',
      exp: '<span class="exp-rule"><span class="label">📐 水への溶けやすさ</span>アンモニア＞＞二酸化炭素＞酸素≒水素（ほぼ溶けない）</span><span class="exp-ok">✅ アンモニアは水に非常に溶けやすい → だから水上置換法が使えない</span><span class="exp-tip">💡 アンモニアの噴水実験：フラスコに少量の水を入れると大量に溶けて気圧が下がり、水が噴き上がる！</span>'
    },
    {
      q: '空気より重い気体はどれ？（空気の平均分子量 ≈ 29）',
      sub: '分子量：H₂=2 / NH₃=17 / CO₂=44',
      a: '二酸化炭素',
      choices: ['水素', 'アンモニア', '二酸化炭素', '酸素と水素は同じ'],
      jp: '空気より重い気体',
      exp: '<span class="exp-rule"><span class="label">📐 気体の重さの比較</span>空気の平均分子量≈29。それより大きければ「重い」</span><span class="exp-ok">✅ CO₂の分子量=44＞29 → 空気より重い（下方置換法が使える理由）</span><span class="exp-ng">❌ 水素(2)・アンモニア(17)は空気より軽い</span><span class="exp-tip">💡 CO₂が空気より重いのでドライアイスの霧は地面を這う！</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_s3_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type: 'choice', answer: q.a, xp: 4, jp: q.jp, choices: q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 4)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });

  html += '</div>'; // practice-section
  return html;
}
function renderSection4() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🧪 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">水溶液って、ただ水に溶けてるだけじゃないの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">溶けているものを「溶質」、溶かしているものを「溶媒」、できた液体を「溶液」という。水溶液は水が溶媒の溶液だ。大事なのは均一に混ざっていること——どこを取っても同じ濃度になる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">溶解度曲線って何？ギザギザした線じゃないの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">温度と溶解度の関係を示したグラフだ。KNO₃（硝酸カリウム）は温度が上がると急激に溶けやすくなる。NaCl（食塩）はほぼ変わらない。この差を利用して「再結晶」で物質を分離できる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 溶質・溶媒・溶液の関係</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">用語の定義</div>'
    + '<div class="ex">溶質（ようしつ）： 溶けている物質　例: 食塩水→食塩</div>'
    + '<div class="ex">溶媒（ようばい）： 溶かしている物質　例: 食塩水→水</div>'
    + '<div class="ex">溶液（ようえき）： 溶質 + 溶媒 = できた液体全体</div>'
    + '<div class="note">💡 水溶液＝水が溶媒の溶液。どこを取っても同じ濃さ（均一）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">質量パーセント濃度（%）の公式</div>'
    + '<div class="ex">質量パーセント濃度 = 溶質の質量 ÷ 溶液の質量 × 100</div>'
    + '<div class="ex">溶液の質量 = 溶質の質量 + 溶媒（水）の質量</div>'
    + '<div class="note">⚠️ 溶媒ではなく溶液の質量で割る！ここが頻出ミス</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 溶解度曲線</div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px">'
    + '<svg viewBox="0 0 340 265" style="width:100%;max-width:380px;display:block;margin:0 auto">'
    + '<!-- grid -->'
    + '<line x1="50" y1="180" x2="300" y2="180" stroke="#21262d" stroke-width="1" stroke-dasharray="3,3"/>'
    + '<line x1="50" y1="140" x2="300" y2="140" stroke="#21262d" stroke-width="1" stroke-dasharray="3,3"/>'
    + '<line x1="50" y1="100" x2="300" y2="100" stroke="#21262d" stroke-width="1" stroke-dasharray="3,3"/>'
    + '<line x1="50" y1="60" x2="300" y2="60" stroke="#21262d" stroke-width="1" stroke-dasharray="3,3"/>'
    + '<line x1="100" y1="20" x2="100" y2="220" stroke="#21262d" stroke-width="1" stroke-dasharray="3,3"/>'
    + '<line x1="150" y1="20" x2="150" y2="220" stroke="#21262d" stroke-width="1" stroke-dasharray="3,3"/>'
    + '<line x1="200" y1="20" x2="200" y2="220" stroke="#21262d" stroke-width="1" stroke-dasharray="3,3"/>'
    + '<line x1="250" y1="20" x2="250" y2="220" stroke="#21262d" stroke-width="1" stroke-dasharray="3,3"/>'
    + '<!-- axes -->'
    + '<line x1="50" y1="220" x2="300" y2="220" stroke="#8b949e" stroke-width="1.5"/>'
    + '<line x1="50" y1="20" x2="50" y2="220" stroke="#8b949e" stroke-width="1.5"/>'
    + '<!-- x labels -->'
    + '<text x="50" y="237" fill="#8b949e" font-size="11" text-anchor="middle">0</text>'
    + '<text x="100" y="237" fill="#8b949e" font-size="11" text-anchor="middle">20</text>'
    + '<text x="150" y="237" fill="#8b949e" font-size="11" text-anchor="middle">40</text>'
    + '<text x="200" y="237" fill="#8b949e" font-size="11" text-anchor="middle">60</text>'
    + '<text x="250" y="237" fill="#8b949e" font-size="11" text-anchor="middle">80</text>'
    + '<text x="300" y="237" fill="#8b949e" font-size="11" text-anchor="middle">100</text>'
    + '<text x="175" y="254" fill="#8b949e" font-size="12" text-anchor="middle">温度（℃）</text>'
    + '<!-- y labels -->'
    + '<text x="44" y="224" fill="#8b949e" font-size="11" text-anchor="end">0</text>'
    + '<text x="44" y="184" fill="#8b949e" font-size="11" text-anchor="end">50</text>'
    + '<text x="44" y="144" fill="#8b949e" font-size="11" text-anchor="end">100</text>'
    + '<text x="44" y="104" fill="#8b949e" font-size="11" text-anchor="end">150</text>'
    + '<text x="44" y="64" fill="#8b949e" font-size="11" text-anchor="end">200</text>'
    + '<text x="14" y="124" fill="#8b949e" font-size="11" text-anchor="middle" transform="rotate(-90,14,124)">溶解度（g）</text>'
    + '<!-- KNO3 (gold) -->'
    + '<polyline points="50,210 100,194 150,169 200,133 250,86 300,23" fill="none" stroke="#f5c518" stroke-width="2.5" stroke-linejoin="round"/>'
    + '<text x="304" y="26" fill="#f5c518" font-size="10">KNO₃</text>'
    + '<!-- KCl (teal) -->'
    + '<polyline points="50,198 100,193 150,188 200,183 250,179 300,174" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linejoin="round"/>'
    + '<text x="304" y="178" fill="#0ea5e9" font-size="10">KCl</text>'
    + '<!-- NaCl (green) -->'
    + '<polyline points="50,191 100,191 150,190 200,190 250,190 300,189" fill="none" stroke="#3fb950" stroke-width="2.5" stroke-linejoin="round"/>'
    + '<text x="304" y="193" fill="#3fb950" font-size="10">NaCl</text>'
    + '</svg>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">溶解度と再結晶</div>'
    + '<div class="ex">溶解度：水100gに溶ける溶質の最大質量（g）</div>'
    + '<div class="ex">再結晶：高温で溶かした溶液を冷やし、析出した結晶を取り出す操作</div>'
    + '<div class="note">💡 KNO₃は温度差で溶解度が大きく変わる → 再結晶向き<br>NaClはほぼ変わらない → 再結晶では分離しにくい（蒸発乾固を使う）</div>'
    + '</div>'
    + '</div>';

  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 水溶液の性質</div>';

  var qs = [
    {
      q: '食塩水において、溶けている食塩（NaCl）は何と呼ばれる？',
      sub: '溶液 = 溶質 + 溶媒',
      a: '溶質',
      choices: ['溶質', '溶媒', '溶液'],
      jp: '食塩水の溶質',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>溶けている物質 → 溶質（ようしつ）</span><span class="exp-ok">✅ 食塩水の溶質 = 食塩（NaCl）</span><span class="exp-ng">❌ 溶媒は溶かしている物質（食塩水なら水H₂O）</span><span class="exp-tip">💡 「溶質」を英語で solute（ソルート）。溶かされる側！</span>'
    },
    {
      q: '食塩水において、水（H₂O）は何と呼ばれる？',
      sub: '水溶液は水が溶媒の溶液',
      a: '溶媒',
      choices: ['溶質', '溶媒', '溶液'],
      jp: '食塩水の溶媒',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>溶かしている物質 → 溶媒（ようばい）</span><span class="exp-ok">✅ 食塩水の溶媒 = 水（H₂O）</span><span class="exp-tip">💡 「水溶液」は水が溶媒の溶液。だから「水溶液」という！</span>'
    },
    {
      q: '水溶液の特徴として正しいのはどれ？',
      sub: '砂糖水・食塩水などを思い浮かべて考えよう',
      a: 'どの部分でも濃さが均一',
      choices: ['どの部分でも濃さが均一', '透明でないことがある', '必ず無色である'],
      jp: '水溶液の特徴',
      exp: '<span class="exp-rule"><span class="label">📐 水溶液の特徴</span>①均一（どこも同じ濃さ）②透明（色がついていても可）③粒子が見えない</span><span class="exp-ok">✅ 均一に混ざっている→どの部分でも濃さが同じ</span><span class="exp-ng">❌ 色がついていても透明なら水溶液（硫酸銅水溶液は青い）。必ず無色ではない</span><span class="exp-tip">💡 牛乳や泥水は水溶液ではない（均一でない・粒子が見える）</span>'
    },
    {
      q: '水10gに食塩2gを溶かしたとき、質量パーセント濃度は何%？',
      sub: '質量パーセント濃度 = 溶質 ÷ 溶液 × 100',
      a: '約16.7%',
      choices: ['20%', '約16.7%', '2%', '10%'],
      jp: '質量パーセント濃度の計算',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>濃度(%) = 溶質の質量 ÷ 溶液の質量 × 100</span><span class="exp-ok">✅ 溶液 = 水10g + 食塩2g = 12g　→ 2÷12×100 ≒ 16.7%</span><span class="exp-ng">❌ 「水10gで割る（溶媒で割る）」は間違い！溶液（12g）で割る</span><span class="exp-tip">💡 溶液＝溶質＋溶媒。分母は「溶液全体」！</span>'
    },
    {
      q: '溶解度とは何のことか？',
      sub: 'g（グラム）で表す',
      a: '水100gに溶ける溶質の最大質量',
      choices: ['水100gに溶ける溶質の最大質量', '水1Lに溶ける溶質の最大質量', '溶液100gに溶ける溶質の最大質量'],
      jp: '溶解度の定義',
      exp: '<span class="exp-rule"><span class="label">📐 溶解度の定義</span>一定温度で水100gに溶ける溶質の最大質量（g）</span><span class="exp-ok">✅ 水100g基準！（1Lでも溶液でもなく水100g）</span><span class="exp-tip">💡 20℃での溶解度の例：NaCl ≒ 36g、KNO₃ ≒ 32g</span>'
    },
    {
      q: '硝酸カリウム（KNO₃）の溶解度は60℃で約109g、20℃で約32g。60℃の飽和水溶液を20℃まで冷やすと何g析出するか？',
      sub: '析出量 = 高温の溶解度 − 低温の溶解度',
      a: '約77g',
      choices: ['約77g', '約32g', '約109g', '約141g'],
      jp: 'KNO₃の析出量計算（60℃→20℃）',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>析出量 = 高温の溶解度 − 冷却後の溶解度</span><span class="exp-ok">✅ 109g − 32g = 77g が析出する</span><span class="exp-ng">❌ 溶解度はすべて水100gあたりなので、そのまま引ける</span><span class="exp-tip">💡 これが「再結晶」の仕組み！KNO₃は温度差が大きいので再結晶に向いている</span>'
    },
    {
      q: '溶解度曲線でほぼ直線（温度変化による変化が小さい）なのはどれ？',
      sub: 'グラフを思い出して考えよう',
      a: 'NaCl（食塩）',
      choices: ['NaCl（食塩）', 'KNO₃（硝酸カリウム）', 'KCl（塩化カリウム）'],
      jp: 'NaClの溶解度と温度変化',
      exp: '<span class="exp-rule"><span class="label">📐 特徴</span>NaCl（食塩）は温度が変わっても溶解度がほぼ変わらない（36〜39g）</span><span class="exp-ok">✅ 食塩は再結晶に向かない→蒸発乾固で取り出す</span><span class="exp-ng">❌ KNO₃は温度変化で溶解度が急激に変化する→再結晶向き</span><span class="exp-tip">💡 グラフで「ほぼ水平な線 = NaCl」と覚えよう！</span>'
    },
    {
      q: '飽和水溶液を加熱して水を蒸発させ、溶質を結晶として取り出す操作を何という？',
      sub: 'NaClの分離に使われる操作',
      a: '蒸発乾固',
      choices: ['蒸発乾固', '再結晶', 'ろ過', '蒸留'],
      jp: '蒸発乾固の定義',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>水を蒸発させて溶質を取り出す操作 = 蒸発乾固（じょうはつかんこ）</span><span class="exp-ok">✅ 食塩（NaCl）は再結晶では分離しにくい→蒸発乾固で取り出す</span><span class="exp-ng">❌ 再結晶は冷却で結晶を出す操作（KNO₃向き）</span><span class="exp-tip">💡 「乾固（かんこ）」＝乾燥させて固める。塩田で塩を作る原理がこれ！</span>'
    },
    {
      q: 'ろ過で取り除けるものはどれ？',
      sub: 'ろ紙の穴より大きなものは通れない',
      a: '水に溶けない固体',
      choices: ['水に溶けない固体', '溶質（溶けた物質）', '溶媒（水）'],
      jp: 'ろ過で取り除けるもの',
      exp: '<span class="exp-rule"><span class="label">📐 ろ過の仕組み</span>ろ紙は水・溶質は通過させ、溶けていない固体（粒子）だけをとめる</span><span class="exp-ok">✅ 水に溶けない固体（砂・不純物）→ろ紙に残る</span><span class="exp-ng">❌ 食塩（溶質）は溶けているので通過してしまう</span><span class="exp-tip">💡 ろ過は「溶けていない固体」の分離に使う。溶けているものは取り除けない！</span>'
    },
    {
      q: '溶質が限界まで溶けた水溶液を何という？',
      sub: 'それ以上溶けない状態',
      a: '飽和水溶液',
      choices: ['飽和水溶液', '不飽和水溶液', '過飽和水溶液'],
      jp: '飽和水溶液の定義',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>溶質が最大限（溶解度分）まで溶けた水溶液 = 飽和水溶液（ほうわすいようえき）</span><span class="exp-ok">✅ 飽和＝満杯。これ以上溶けない状態</span><span class="exp-tip">💡 飽和水溶液を冷やすと→析出（再結晶）。高温の飽和水溶液ほど冷やしたときに多く析出する</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_s4_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type: 'choice', answer: q.a, xp: 4, jp: q.jp, choices: q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 4)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });

  html += '</div>';
  return html;
}
function renderSection5() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📝 確認テスト</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二</div><div class="chat-bubble">Section 1〜4の総まとめ。愛知県入試の形式で20問。語句記入（直接入力）と選択肢の混合問題だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">20問！？全部覚えてるかな…にっくん信じてやります！！</div></div></div>'
    + '</div>';

  html += '<div class="practice-section"><div class="practice-title">📝 確認テスト — 全範囲20問</div>';

  // 語句記入問題（input型）
  var inputQs = [
    {
      q: '【物質分類】純物質の中で、1種類の元素からできているものを何という？',
      sub: '例：鉄Fe・酸素O₂・銅Cu',
      a: '単体',
      jp: '単体の定義',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>1種類の元素からなる純物質 → 単体（たんたい）</span><span class="exp-ok">✅ 単体の例：Fe・O₂・Cu・H₂・N₂</span><span class="exp-tip">💡 「単（単純）」＝元素1種類！</span>'
    },
    {
      q: '【状態変化】液体が気体になる変化を何という？',
      sub: '水→水蒸気の変化',
      a: '蒸発',
      jp: '液体→気体の変化名（蒸発）',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>液体 → 気体 = 蒸発（じょうはつ）</span><span class="exp-ok">✅ 水→水蒸気が蒸発。沸点で激しく起こる蒸発を「沸騰」という</span><span class="exp-tip">💡 液→気は蒸発、気→液は凝縮。逆の方向も覚えよう！</span>'
    },
    {
      q: '【状態変化】純物質を加熱し続けたとき、状態変化している間の温度はどうなる？',
      sub: '氷が融けている間・水が沸騰している間を思い浮かべよう',
      a: '一定',
      jp: '状態変化中の温度',
      exp: '<span class="exp-rule"><span class="label">📐 重要</span>純物質が状態変化している間 → 温度は一定に保たれる</span><span class="exp-ok">✅ 氷が融ける間は0℃のまま。沸騰中は100℃のまま</span><span class="exp-tip">💡 これで純物質か混合物かを区別できる。グラフで水平な区間＝状態変化中</span>'
    },
    {
      q: '【気体】酸素の発生実験で、分解を助けるが自身は変化しない物質（触媒）の名前は？',
      sub: '二酸化マンガン + 過酸化水素水 → 酸素 + 水',
      a: '二酸化マンガン',
      jp: '酸素発生の触媒',
      exp: '<span class="exp-rule"><span class="label">📐 触媒</span>反応を速くするが、自身は変化しない物質 → 触媒（しょくばい）</span><span class="exp-ok">✅ 酸素発生の触媒 = 二酸化マンガン（MnO₂）</span><span class="exp-tip">💡 触媒は反応の前後で変化しない。オキシドール（過酸化水素水）に加えると泡（酸素）が出る！</span>'
    },
    {
      q: '【水溶液】食塩水において、溶けている食塩は「溶質」。では、溶かしている水は何と呼ぶ？',
      sub: '溶液 = 溶質 + 〔　　〕',
      a: '溶媒',
      jp: '溶媒の定義',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>溶かしている物質 → 溶媒（ようばい）</span><span class="exp-ok">✅ 食塩水の溶媒 = 水</span><span class="exp-tip">💡 溶質（溶けている）・溶媒（溶かしている）・溶液（全体）の3つをセットで！</span>'
    },
    {
      q: '【水溶液】飽和水溶液を冷やすと溶けていた固体が結晶として出てくる。この操作を何という？',
      sub: 'KNO₃（硝酸カリウム）の精製に使われる操作',
      a: '再結晶',
      jp: '再結晶の定義',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>高温の飽和水溶液を冷やして結晶を取り出す操作 → 再結晶（さいけっしょう）</span><span class="exp-ok">✅ KNO₃は60℃と20℃で溶解度の差が大きい → 再結晶に最適</span><span class="exp-tip">💡 NaClは溶解度があまり変わらないため再結晶に向かない</span>'
    },
    {
      q: '【水溶液】溶液の質量が120g、溶質の質量が12gのとき、質量パーセント濃度は何%？',
      sub: '濃度(%) = 溶質 ÷ 溶液 × 100',
      a: '10',
      jp: '質量パーセント濃度の計算（12g/120g）',
      exp: '<span class="exp-rule"><span class="label">📐 公式</span>質量パーセント濃度 = 溶質の質量 ÷ 溶液の質量 × 100</span><span class="exp-ok">✅ 12 ÷ 120 × 100 = 10%</span><span class="exp-tip">💡 分母は「溶液全体」！（溶媒だけの質量で割らないように！）</span>'
    },
    {
      q: '【気体】水素が空気中で燃えるとき生じる物質は何？（化学式で答えてもOK）',
      sub: '水素の燃焼：H₂ + O₂ →',
      a: '水',
      jp: '水素の燃焼生成物',
      exp: '<span class="exp-rule"><span class="label">📐 水素の燃焼</span>水素（H₂）+ 酸素（O₂）→ 水（H₂O）</span><span class="exp-ok">✅ 水素が燃えると水ができる！</span><span class="exp-tip">💡 水素燃料電池もこの反応を利用。排出物が水だけなので環境に優しい</span>'
    },
    {
      q: '【状態変化】沸点の違いを利用して混合物を分離する操作を何という？',
      sub: 'エタノール（78℃）と水（100℃）の分離に使う',
      a: '蒸留',
      jp: '蒸留の定義',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>沸点の違いを利用して混合物を分離する → 蒸留（じょうりゅう）</span><span class="exp-ok">✅ エタノール（沸点78℃）が先に蒸発→冷やして回収</span><span class="exp-tip">💡 ウイスキー・日本酒の製造も蒸留を使う。「蒸留酒」という！</span>'
    },
    {
      q: '【物質分類】合金（例：ステンレス・真鍮）は純物質・混合物のどちら？',
      sub: '合金は複数の金属が混ざっている',
      a: '混合物',
      jp: '合金の分類（混合物）',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>2種類以上の物質が混ざっている → 混合物</span><span class="exp-ok">✅ ステンレス（鉄+クロム+ニッケル）= 混合物</span><span class="exp-ng">❌ 鉄や銅は単体（元素1種類）。合金は複数の元素→混合物</span><span class="exp-tip">💡 合金の例：ステンレス・真鍮（銅+亜鉛）・青銅（銅+スズ）</span>'
    },
  ];

  // 選択肢問題（choice型）
  var choiceQs = [
    {
      q: '【物質分類】水（H₂O）の分類として正しいのはどれ？',
      sub: 'H（水素）とO（酸素）の2種類の元素からできている',
      a: '化合物',
      choices: ['単体', '化合物', '混合物'],
      jp: '水（H₂O）の分類',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>元素が2種類以上の純物質 → 化合物</span><span class="exp-ok">✅ H₂O = H（水素）+ O（酸素）→ 化合物</span><span class="exp-tip">💡 化合物の例：H₂O・NaCl・CO₂・NH₃</span>'
    },
    {
      q: '【状態変化】ドライアイス（固体CO₂）が直接気体になる変化を何という？',
      sub: '液体を経ずに固体→気体になる',
      a: '昇華',
      choices: ['融解', '蒸発', '凝固', '昇華'],
      jp: '固体→気体（昇華）',
      exp: '<span class="exp-rule"><span class="label">📐 定義</span>固体 → 気体（液体を経ない）= 昇華（しょうか）</span><span class="exp-ok">✅ ドライアイス・ヨウ素が昇華の代表例</span><span class="exp-tip">💡 「昇」＝上がる。液体を通り越して気体に「昇」る！</span>'
    },
    {
      q: '【気体】アンモニア（NH₃）を集めるのに最も適した方法はどれ？',
      sub: 'アンモニアは水に非常に溶けやすく、空気より軽い',
      a: '上方置換法',
      choices: ['水上置換法', '上方置換法', '下方置換法'],
      jp: 'アンモニアの集め方',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>水に溶けやすく・空気より軽い → 上方置換法</span><span class="exp-ok">✅ アンモニアのみ！上方置換法を使う気体はこれだけ</span><span class="exp-tip">💡 水上置換法は水に溶けてしまうためNG</span>'
    },
    {
      q: '【気体】二酸化炭素（CO₂）を石灰水に通すと石灰水はどうなる？',
      sub: '石灰水はCO₂の検出に使われる',
      a: '白くにごる',
      choices: ['白くにごる', '青くなる', '赤くなる', '変化しない'],
      jp: 'CO₂と石灰水の反応',
      exp: '<span class="exp-rule"><span class="label">📐 CO₂検出</span>CO₂ + 石灰水 → 白くにごる（炭酸カルシウムが生成）</span><span class="exp-ok">✅ 石灰水が白くにごる = CO₂の証明！入試必出</span><span class="exp-tip">💡 石灰水＝CO₂の検出薬。セットで覚えよう</span>'
    },
    {
      q: '【水溶液】溶解度について正しい説明はどれ？',
      sub: '温度と水の量が関係する',
      a: '一定温度で水100gに溶ける溶質の最大質量',
      choices: ['一定温度で水100gに溶ける溶質の最大質量', '一定温度で水1Lに溶ける溶質の最大体積', '溶液100gに溶ける溶質の質量'],
      jp: '溶解度の正しい定義',
      exp: '<span class="exp-rule"><span class="label">📐 溶解度の定義</span>一定温度で水100gに溶ける溶質の最大質量（g）</span><span class="exp-ok">✅ 基準は水100g（溶液ではなく水！）</span><span class="exp-tip">💡 溶解度表を読むときは「水100gあたり」と確認しよう</span>'
    },
    {
      q: '【水溶液】NaClとKNO₃が混ざった固体から、KNO₃だけを取り出すのに最も適した操作はどれ？',
      sub: 'KNO₃は温度で溶解度が大きく変わる。NaClはほぼ変わらない',
      a: '再結晶（冷却）',
      choices: ['再結晶（冷却）', '蒸発乾固', 'ろ過', '蒸留'],
      jp: 'KNO₃の精製方法',
      exp: '<span class="exp-rule"><span class="label">📐 再結晶の使いどき</span>温度差で溶解度が大きく変わる物質 → 再結晶（冷却）</span><span class="exp-ok">✅ KNO₃は60℃→20℃で析出量が大きい → 再結晶で精製</span><span class="exp-ng">❌ NaClは温度変化で溶解度がほぼ変わらない → 蒸発乾固向き</span><span class="exp-tip">💡 再結晶で取り出したいのは「温度差で溶解度が大きく変わる物質」</span>'
    },
    {
      q: '【物質分類】空気の成分で最も多く含まれる気体は何？',
      sub: '空気の組成を思い出そう（約78%を占める）',
      a: '窒素',
      choices: ['窒素', '酸素', '二酸化炭素', 'アルゴン'],
      jp: '空気中に最も多い気体',
      exp: '<span class="exp-rule"><span class="label">📐 空気の組成</span>窒素N₂ ≒ 78% → 酸素O₂ ≒ 21% → アルゴンAr ≒ 1% → CO₂ ≒ 0.04%</span><span class="exp-ok">✅ 最多は窒素（N₂）！約78%</span><span class="exp-tip">💡 「ちっそ（窒素）が1番多くて78%」入試頻出の数値！</span>'
    },
    {
      q: '【状態変化】状態変化のとき変化しないものはどれ？',
      sub: '粒子の数と粒子の間隔に注目',
      a: '質量',
      choices: ['質量', '体積', '密度', '形'],
      jp: '状態変化で変わらないもの',
      exp: '<span class="exp-rule"><span class="label">📐 ルール</span>状態変化 = 粒子の「並び方」が変わるだけ → 粒子の数は変わらない → 質量は変わらない</span><span class="exp-ok">✅ 氷100g → 水100g（質量同じ）</span><span class="exp-ng">❌ 体積は変わる（水→氷で体積が増える）</span><span class="exp-tip">💡 体積変化の注意：水が氷になると体積が増える（密度が下がる）→氷が水に浮く理由！</span>'
    },
    {
      q: '【気体】水素（H₂）を発生させるとき使う薬品の組み合わせはどれ？',
      sub: '金属と酸を組み合わせて発生させる',
      a: '亜鉛＋塩酸',
      choices: ['亜鉛＋塩酸', '石灰石＋塩酸', '二酸化マンガン＋過酸化水素水', '塩化アンモニウム＋水酸化カルシウム'],
      jp: '水素の発生方法',
      exp: '<span class="exp-rule"><span class="label">📐 水素の発生</span>亜鉛（または鉄・マグネシウム）＋塩酸 → 水素 ＋ 塩化亜鉛</span><span class="exp-ok">✅ 金属＋酸 → 水素！が基本パターン</span><span class="exp-tip">💡 水素は点火すると「ポン」という音で燃える（可燃性の確認方法）</span>'
    },
    {
      q: '【水溶液】ろ過で取り除ける物質はどれ？',
      sub: 'ろ紙は何を通して何を止めるか',
      a: '水に溶けない固体（泥・砂など）',
      choices: ['水に溶けない固体（泥・砂など）', '溶けた食塩（溶質）', '水（溶媒）'],
      jp: 'ろ過で取り除けるもの',
      exp: '<span class="exp-rule"><span class="label">📐 ろ過のポイント</span>ろ紙の穴より大きな粒子だけ止まる。溶けているものは通過する</span><span class="exp-ok">✅ 水に溶けていない固体（砂・泥）→ろ紙に残る</span><span class="exp-ng">❌ 溶質（食塩など）は溶液中に分散している→ろ紙を通過してしまう</span><span class="exp-tip">💡 ろ過は「溶けていない固体」だけを除く操作。溶質は取り除けない！</span>'
    },
  ];

  // input問題のqid付与とシャッフル
  inputQs.forEach(function(q, i) { q._qid = 'sci_s5_in' + i; q._type = 'input'; });
  choiceQs.forEach(function(q, i) { q._qid = 'sci_s5_ch' + i; q._type = 'choice'; });

  // 混ぜてシャッフル
  var allQs = inputQs.concat(choiceQs);
  allQs = shuffleArray(allQs);

  allQs.forEach(function(q, i) {
    var qid = q._qid;
    if (q._type === 'input') {
      qMeta[qid] = { type: 'input', answer: q.a, xp: 5, jp: q.jp };
      html += '<div class="q-card" data-card="' + qid + '">'
        + '<div class="q-number">Q' + (i + 1) + ' / ' + allQs.length + '</div>'
        + '<div class="q-text">' + q.q + '</div>'
        + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
        + makeInput(qid, q.a, 5)
        + makeFeedback(qid, q.exp)
        + '</div>';
    } else {
      qMeta[qid] = { type: 'choice', answer: q.a, xp: 5, jp: q.jp, choices: q.choices };
      html += '<div class="q-card" data-card="' + qid + '">'
        + '<div class="q-number">Q' + (i + 1) + ' / ' + allQs.length + '</div>'
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
function renderSection6() {
  return '<div class="intro-box"><div class="intro-box-title">🔗 3年予習：化学変化とイオン</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div>'
    + '<div class="chat-bubble">中1でやった「物質の分類・気体・水溶液」は、中3の「化学変化とイオン」の土台になる。特に水溶液の性質・酸とアルカリ・中和——全部ここが出発点。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div>'
    + '<div class="chat-bubble">今やってる内容が中3で役に立つの！？ちゃんと覚えとかないとだ！</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--teal);font-weight:bold;margin-bottom:12px">🔗 中1→中3 繋がり一覧</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '物質・状態変化 → <span style="color:var(--gold)">化学変化とイオン</span>（物質の変化・粒子モデル）<br>'
    + '気体・水溶液   → <span style="color:var(--gold)">酸・アルカリ・中和</span>（酸性・アルカリ性の水溶液）<br>'
    + '溶解度・再結晶 → <span style="color:var(--gold)">電解質・非電解質</span>（水に溶けるとどうなるか）'
    + '</div></div>';
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var prefix = 'sci_s5_';
  var total = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; }).length;
  var correct = Object.keys(answeredSet).filter(function(id){ return id.indexOf(prefix) === 0 && answeredSet[id]; }).length;
  if (total === 0) total = 20;
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '😄' : '🐣';
  var msg = pct >= 90
    ? 'きょん「全部わかった！！にっくんより賢くなったかもしれない！！」<br>西村「よくやった。次の単元に進もう」'
    : pct >= 70
    ? 'きょん「かなりできた！！もうちょっとで完璧！！」<br>西村「惜しい。もう一度見直したら完璧になるよ」'
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
    + '<button class="result-btn" onclick="goSection(1)" style="background:var(--teal)">🔄 Section 1 からやり直す</button>'
    + '</div></div>';
  document.getElementById('resultOverlay').innerHTML = html;
  document.getElementById('resultOverlay').style.display = 'block';
}
function closeResult() {
  document.getElementById('resultOverlay').style.display = 'none';
}

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 7;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var wqs = getWeakQuestions();
  var allQids = Object.keys(weakDB);

  if (allQids.length === 0) {
    mc.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      + '<div style="font-size:48px;margin-bottom:16px">📊</div>'
      + '<div style="font-size:18px;margin-bottom:8px">まだデータがありません</div>'
      + '<div style="font-size:14px">問題を解くと自動で記録されます</div>'
      + '</div>';
    return;
  }

  var sorted = allQids.slice().sort(function(a, b){ return getPct(a) - getPct(b); });
  var html = '<div style="margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap">'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center">'
    + '<div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--gold)">' + allQids.length + '</div>'
    + '<div style="font-size:11px;color:var(--text2)">記録済み問題</div>'
    + '</div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center">'
    + '<div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--red)">' + wqs.length + '</div>'
    + '<div style="font-size:11px;color:var(--text2)">要特訓（80%未満）</div>'
    + '</div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center">'
    + '<div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--green)">' + (allQids.length - wqs.length) + '</div>'
    + '<div style="font-size:11px;color:var(--text2)">習得済み（80%以上）</div>'
    + '</div>'
    + '</div>';

  sorted.forEach(function(qid) {
    var d = weakDB[qid];
    var pct = getPct(qid);
    var barColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
    html += '<div style="background:var(--bg2);border:1px solid ' + barColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(14,165,233,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + '<span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:15px;color:var(--text);margin-bottom:2px;line-height:1.6">' + (d.jp || '') + '</div>'
      + '<div style="font-size:13px;color:' + barColor + '">' + (d.answer || '') + '</div>'
      + '</div>'
      + '<div style="text-align:right;flex-shrink:0">'
      + '<div style="font-size:11px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div>'
      + '<div style="width:80px;height:5px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden">'
      + '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width 0.5s"></div>'
      + '</div></div>'
      + '</div>';
  });

  if (wqs.length > 0) {
    html += '<button onclick="goSection(8)" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;box-shadow:0 4px 20px rgba(233,69,96,0.3)">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }

  mc.innerHTML = html;
}

// ===== 特訓モード =====
var tokkuQueue = [];
var tokkuIndex = 0;
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
    + '<div style="flex:1">'
    + '<div style="font-size:13px;font-weight:bold;color:var(--red);margin-bottom:2px">間違えた問題は特訓モードで克服できる！</div>'
    + '<div style="font-size:12px;color:var(--text2)">弱点問題だけを集中練習。正答率80%で卒業！</div>'
    + '</div>'
    + '<button onclick="goSection(8)" style="background:var(--red);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-family:inherit;font-weight:bold;cursor:pointer;white-space:nowrap;flex-shrink:0">🔥 特訓へ →</button>'
    + '</div>';
  card.parentNode.insertBefore(banner, card.nextSibling);
}

function renderTokkuMode() {
  currentSection = 8;
  renderTabs();
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');

  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete">'
      + '<div class="tokku-complete-emoji">🏆</div>'
      + '<div class="tokku-complete-title">弱点ゼロ！</div>'
      + '<div class="tokku-complete-msg">すべての問題で正答率80%以上！<br>きょん「俺、めちゃくちゃ強くなってるじゃん！！」<br>西村「本当に成長したね」</div>'
      + '<button onclick="goSection(1)" style="margin-top:24px;background:var(--teal);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button>'
      + '</div>';
    return;
  }

  tokkuQueue  = wqs.slice(0, 15);
  tokkuIndex  = 0;
  tokkuSession = { correct: 0, total: 0 };
  renderTokkuCard();
}

function renderTokkuCard() {
  var mc = document.getElementById('mainContent');
  if (tokkuIndex >= tokkuQueue.length) {
    showTokkuComplete(); return;
  }
  var qid = tokkuQueue[tokkuIndex];
  var d = weakDB[qid];
  if (!d) { tokkuIndex++; renderTokkuCard(); return; }

  var pct = getPct(qid);
  var color = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';

  var isChoice = d.choices && d.choices.length > 0;
  var choicesHtml = '';
  if (isChoice) {
    var shuffled = d.choices.slice().sort(function(){ return Math.random() - 0.5; });
    choicesHtml = '<div class="tokku-choices" id="tokku_choices">'
      + shuffled.map(function(c) {
          return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c + '">' + c + '</button>';
        }).join('')
      + '</div>';
  }

  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex + 1) + ' / ' + tokkuQueue.length
    + '　　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
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
      res.innerHTML = '❌ 間違い！ 正答率 → ' + newPct + '%'
        + '<div class="tokku-answer">' + d.answer + '</div>';
      showToast('きょん「また間違えた！！でも諦めない！！」');
    }
    res.style.display = 'block';
  }
  document.getElementById('tokku_next').style.display = 'block';
}

function nextTokkuCard() {
  tokkuIndex++;
  renderTokkuCard();
}

function showTokkuComplete() {
  var mc = document.getElementById('mainContent');
  var pctAll = tokkuSession.total > 0 ? Math.round(tokkuSession.correct / tokkuSession.total * 100) : 0;
  var emoji = pctAll >= 80 ? '🏆' : pctAll >= 60 ? '😎' : '💪';
  var msg = pctAll >= 80
    ? 'きょん「全部わかった！！昇格の予感！！」<br>西村「よくやった。次回も頼む」'
    : pctAll >= 50
    ? 'きょん「半分以上できた！もう一回やる！」<br>西村「続けること。それが大事」'
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
renderWeakBar();
renderTabs();
goSection(0);

// === sci_c1_force.html ===
// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「理科？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺理科できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「理科で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var xp = parseInt(localStorage.getItem('sci_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('sci_force_answered')  || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('sci_force_sections')  || '{}');
var weakDB       = JSON.parse(localStorage.getItem('sci_weakdb')          || '{}');
var attemptCounts = {};

function updateXP() {
  var lv = getLevel(xp);
  var next = LEVELS[Math.min(lv.lv, LEVELS.length - 1)];
  var pct = lv.lv < LEVELS.length ? Math.round((xp - lv.min) / (lv.max - lv.min) * 100) : 100;
  document.getElementById('xpBadge').textContent  = lv.badge;
  document.getElementById('xpLevel').textContent  = 'Lv.' + lv.lv + ' ' + lv.badge.split(' ')[0];
  document.getElementById('xpTitle').textContent  = lv.title;
  document.getElementById('xpStatus').textContent = lv.status;
  document.getElementById('xpNext').textContent   = lv.lv < LEVELS.length ? xp + ' XP ／ 次まで ' + (lv.max - xp) + ' XP' : '🏆 最高ランク達成！（' + xp + ' XP）';
  document.getElementById('xpFill').style.width   = Math.min(100, pct) + '%';
}
function addXP(pts, qid) {
  if (answeredSet[qid]) return false;
  var oldLv = getLevel(xp).lv;
  xp += pts;
  answeredSet[qid] = true;
  localStorage.setItem('sci_xp',             xp);
  localStorage.setItem('sci_force_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('sci_force_') === 0 && getPct(id) < 80;
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
  localStorage.setItem('sci_force_lastStudy', _today);
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
    'きょん「合ってる！理科できるじゃん！！」',
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
function makeChoices(qid, choices, answer, xpPts) {
  choices = shuffleArray(choices);
  qMeta[qid] = Object.assign(qMeta[qid] || {}, { type:'choice', answer:answer, xp:xpPts, choices:choices });
  if (answeredSet[qid]) {
    return '<div class="choices">' + choices.map(function(c) {
      return '<button class="choice-btn ' + (c === answer ? 'show-correct' : '') + '" disabled>' + c + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="choices">' + choices.map(function(c) {
    return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
  }).join('') + '</div>';
}
function makeFeedback(qid, explanation) {
  var shown = answeredSet[qid] ? 'display:block' : 'display:none';
  return '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + shown + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度チャレンジ！</div>'
    + '<div class="exp-card" id="exp_card_' + qid + '">'
    + '<div class="exp-card-title">📌 解説</div>'
    + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + explanation + '</div>'
    + '</div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '">'
    + '<div class="ans-label">✅ 正解</div>'
    + '<div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div>'
    + '</div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + shown + '">'
    + (answeredSet[qid] ? getComment('nishi_correct') : '')
    + '</div>';
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
  var lvUp = addXP(meta.xp, qid);
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
  localStorage.setItem('sci_force_answered', JSON.stringify(answeredSet));
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
  var prefix = 'sci_force_s' + currentSection + '_';
  var sectionQ = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sectionQ.length === 0) return;
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done) {
    sectionDone[currentSection] = true;
    localStorage.setItem('sci_force_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'⚡ スタート',  title:'力・光・音',              sub:'中1理科の第2章。中3「運動とエネルギー」の土台を作ろう！' },
  { id:1, label:'力',           title:'力のはたらき',             sub:'重力・弾性力・摩擦力・垂直抗力の4種類をマスターしよう' },
  { id:2, label:'光',           title:'光の性質',                 sub:'反射・屈折・凸レンズ——光のルールはシンプル！' },
  { id:3, label:'音',           title:'音の性質',                 sub:'振動数・振幅・音速——音の3要素を攻略しよう' },
  { id:4, label:'確認テスト',   title:'確認テスト',               sub:'全単元の総まとめ！愛知県形式20問' },
  { id:5, label:'🔗3年予習',    title:'3年予習：運動とエネルギー', sub:'力と運動・仕事とエネルギーへの橋渡し' },
  { id:6, label:'📊弱点',       title:'弱点ノート',               sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',       title:'弱点特訓モード',           sub:'間違えた問題だけを集中練習！' },
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
    + '<div class="section-badge">理科 CH.2 · SECTION ' + id + '</div>'
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
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">力・光・音って全部バラバラじゃん！どうやって覚えるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">3つとも「ルール」がある。力は"向き"と"大きさ"、光は"角度のルール"、音は"振動数と振幅"——それだけ。しかも全部、中3の「運動とエネルギー」に直結するから今が踏ん張りどころだ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">中3に繋がるの！？じゃあやるしかない！！まず力からやります！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。重力・弾性力・摩擦力・垂直抗力の4種類から。力の単位はN（ニュートン）。まずここを固めよう。</div></div></div>'
    + '</div>'
    + '<button class="start-btn" onclick="goSection(1)">⚡ 力のはたらきから始める →</button>';
}

// ===== SECTION 1: 力 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">重力・弾性力・摩擦力・垂直抗力……4つも覚えるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">「重弾摩垂（じゅうだんますい）」で覚えよう。重力は地球が引く力（真下）、弾性力はばねが戻る力、摩擦力は運動を妨げる力（逆向き）、垂直抗力は面が押す力（面に垂直）。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「じゅうだんますい」……なんか呪文みたいでいい！覚えやすい！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 力の4種類</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">重弾摩垂（じゅうだんますい）で覚える！</div>'
    + '<div class="ex">🌍 重力（じゅうりょく）：地球が物体を引く力。向きは常に真下（地球の中心方向）</div>'
    + '<div class="ex">🌀 弾性力（だんせいりょく）：変形した物体が元に戻ろうとする力（ばね・ゴム）</div>'
    + '<div class="ex">🛑 摩擦力（まさつりょく）：物体の運動を妨げる力。向きは運動と逆</div>'
    + '<div class="ex">⬆️ 垂直抗力（すいちょくこうりょく）：面が物体を垂直に押す力</div>'
    + '<div class="note">💡 「重弾摩垂」＝重力・弾性力・摩擦力・垂直抗力。4つをセットで！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 力の三要素・単位・フックの法則</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">力の三要素（矢印で表す3つの情報）</div>'
    + '<div class="ex">① 大きさ（矢印の長さ）　② 向き（矢印の向き）　③ 作用点（矢印の始点）</div>'
    + '<div class="note">⚠️ 作用点が違えば、同じ力でも効果が異なる</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">単位と基準</div>'
    + '<div class="ex">力の単位：N（ニュートン）</div>'
    + '<div class="ex">100gの物体にかかる重力 ≈ 1N（地球上）</div>'
    + '<div class="note">💡 フックの法則：ばねの伸びは加えた力に比例する（F = kx）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">2力のつり合い（3条件）</div>'
    + '<div class="ex">① 大きさが等しい　② 向きが正反対　③ 同一直線上にある</div>'
    + '<div class="note">💡 3つ全部満たすと物体は静止する。机の上の本は重力と垂直抗力がつり合っている</div>'
    + '</div>'
    + '</div>';

  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 力のはたらき</div>';

  var qs = [
    {
      q:'地球が物体を地球の中心に向けて引く力を何という？',
      sub:'地上のすべての物体にはたらく基本的な力',
      a:'重力',
      choices:['重力','摩擦力','弾性力','垂直抗力'],
      jp:'重力の定義',
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>地球が物体を地球の中心に向けて引く力 → 重力</span><span class="exp-ok">✅ 重力の向きは常に真下（地球の中心方向）</span><span class="exp-tip">💡 月では重力が地球の約1/6。だから月面では体重が軽くなる！</span>'
    },
    {
      q:'ばねが伸びて元の形に戻ろうとする力を何という？',
      sub:'変形した物体が元に戻ろうとする力',
      a:'弾性力',
      choices:['弾性力','摩擦力','重力','磁力'],
      jp:'弾性力の定義',
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>変形した物体が元の形に戻ろうとする力 → 弾性力（だんせいりょく）</span><span class="exp-ok">✅ ばね・ゴム・弓が弾性力の例</span><span class="exp-tip">💡 ばねの弾性力はフックの法則に従う。F（力）に比例して伸びる！</span>'
    },
    {
      q:'机の上に本を置いたとき、机が本を垂直に押す力を何という？',
      sub:'面に接触している物体が受ける力',
      a:'垂直抗力',
      choices:['垂直抗力','摩擦力','重力','弾性力'],
      jp:'垂直抗力の定義',
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>物体が面に接触しているとき、面が物体を垂直に押す力 → 垂直抗力</span><span class="exp-ok">✅ 「垂直」は面に対して垂直という意味（斜面上でも面に垂直！）</span><span class="exp-tip">💡 机の上の本に働く重力（下）と垂直抗力（上）が等しいから静止している</span>'
    },
    {
      q:'力の単位として正しいのはどれ？',
      sub:'国際単位系（SI）での力の単位',
      a:'N（ニュートン）',
      choices:['N（ニュートン）','Pa（パスカル）','J（ジュール）','W（ワット）'],
      jp:'力の単位（ニュートン）',
      exp:'<span class="exp-rule"><span class="label">📐 単位</span>力の単位 = N（ニュートン）</span><span class="exp-ok">✅ 1N ≈ 100gの物体にかかる重力の大きさ</span><span class="exp-tip">💡 ニュートンはリンゴが落ちるのを見て万有引力を発見した科学者の名前！</span>'
    },
    {
      q:'力の三要素として正しい組み合わせはどれ？',
      sub:'矢印で力を表すときに必要な3つの情報',
      a:'大きさ・向き・作用点',
      choices:['大きさ・向き・作用点','大きさ・向き・速さ','向き・作用点・物体の質量'],
      jp:'力の三要素',
      exp:'<span class="exp-rule"><span class="label">📐 力の三要素</span>①大きさ（矢印の長さ）②向き（矢印の向き）③作用点（矢印の始点）</span><span class="exp-ok">✅ 力を矢印で表すとき、この3つがすべて必要</span><span class="exp-tip">💡 「作用点」は力がはたらく点。同じ大きさ・向きでも作用点が違うと効果が変わる</span>'
    },
    {
      q:'500gの物体にはたらく重力は約何N？（100g → 1N）',
      sub:'重力の大きさと質量の関係',
      a:'約5N',
      choices:['約5N','約0.5N','約50N','約500N'],
      jp:'重力の計算（500g）',
      exp:'<span class="exp-rule"><span class="label">📐 計算</span>100g → 1N（地球上の近似値）なので 500g → 5N</span><span class="exp-ok">✅ 500g = 5 × 100g → 5 × 1N = 5N</span><span class="exp-tip">💡 正確には重力加速度 g = 9.8N/kg。試験では 10N/kg で計算することが多い</span>'
    },
    {
      q:'2力がつり合う条件として正しいのはどれ？',
      sub:'物体が静止しているときの2力の関係',
      a:'大きさが等しく・向きが反対で・同一直線上にある',
      choices:['大きさが等しく・向きが反対で・同一直線上にある','大きさが等しく・同じ向きで・同一直線上にある','大きさが違い・向きが反対で・同一直線上にある'],
      jp:'2力のつり合いの3条件',
      exp:'<span class="exp-rule"><span class="label">📐 2力のつり合いの3条件</span>①大きさが等しい　②向きが正反対　③同一直線上にある</span><span class="exp-ok">✅ 3つすべて満たすと物体は静止（つり合いの状態）</span><span class="exp-tip">💡 机の上の本：重力（下）と垂直抗力（上）がこの3条件を満たしている</span>'
    },
    {
      q:'物体が動こうとするとき、運動を妨げる向きにはたらく力を何という？',
      sub:'床と物体の間にはたらく力',
      a:'摩擦力',
      choices:['摩擦力','重力','垂直抗力','弾性力'],
      jp:'摩擦力の定義と向き',
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>物体の運動（または運動しようとする方向）と反対向きにはたらく力 → 摩擦力</span><span class="exp-ok">✅ 摩擦力の向き = 運動の向きと反対</span><span class="exp-tip">💡 氷の上は摩擦力が小さい→滑りやすい。タイヤのギザギザは摩擦力を大きくするため！</span>'
    },
    {
      q:'ばねを2倍の力で引くと、ばねの伸びはどうなる？（フックの法則）',
      sub:'F = kx の法則（k：ばね定数、x：伸び）',
      a:'2倍になる',
      choices:['2倍になる','4倍になる','変わらない','1/2になる'],
      jp:'フックの法則（比例関係）',
      exp:'<span class="exp-rule"><span class="label">📐 フックの法則</span>ばねの伸び（x）は加えた力（F）に比例する。F = kx</span><span class="exp-ok">✅ 力が2倍 → 伸びも2倍（比例）</span><span class="exp-tip">💡 フックの法則はばねが弾性変形する範囲でのみ成り立つ（引きすぎると壊れる）</span>'
    },
    {
      q:'水中の物体にはたらく、上向きの力を何という？',
      sub:'アルキメデスの原理に関係する',
      a:'浮力',
      choices:['浮力','重力','垂直抗力','弾性力'],
      jp:'浮力の定義と方向',
      exp:'<span class="exp-rule"><span class="label">📐 浮力</span>水中の物体が水から受ける上向きの力 → 浮力（ふりょく）</span><span class="exp-ok">✅ 浮力の大きさ = 物体が排除した水の重さ（アルキメデスの原理）</span><span class="exp-tip">💡 浮力 > 重力のとき浮く。浮力 = 重力のとき水中で静止（中性浮力）。潜水艦はこれを制御！</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_force_s1_q' + i; });
  qs = shuffleArray(qs);
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

// ===== SECTION 2: 光の性質 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">💡 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">光って「まっすぐ進む」くらいしか知らないけど、それ以上あるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">反射・屈折・全反射・凸レンズの4つ。どれも「角度のルール」で全部決まる。入射角＝反射角、空気→水なら法線に近づく——これを覚えれば図問題も解ける。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">凸レンズって実像と虚像があるやつ？どっちがどっちかわからなくなる！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">実像はスクリーンに映せる・倒立。虚像は映せない・正立拡大——ルーペで見る像が虚像だ。物体が焦点の外か内かで決まる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 光の反射</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">反射の法則（常に成立）</div>'
    + '<div class="ex">入射角 ＝ 反射角（法線から測った角度）</div>'
    + '<div class="note">⚠️ 「面から」ではなく「法線（面に垂直な線）から」の角度で測る！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">正反射 vs 乱反射</div>'
    + '<div class="ex">正反射（鏡・水面）：平らな面 → 平行に反射 → 特定方向だけに反射</div>'
    + '<div class="ex">乱反射（紙・壁）：凸凹面 → さまざまな方向に反射 → どこからでも見える</div>'
    + '<div class="note">💡 白い紙がどの方向からでも見えるのは乱反射のおかげ！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 光の屈折・全反射</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">屈折のルール（2パターン）</div>'
    + '<div class="ex">空気 → 水（速い→遅い媒質）：法線に近づく　入射角 ＞ 屈折角</div>'
    + '<div class="ex">水 → 空気（遅い→速い媒質）：法線から遠ざかる　入射角 ＜ 屈折角</div>'
    + '<div class="note">💡 「密な媒質に入ると法線に近くなる（密に）」と覚えよう</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">全反射（条件2つ）</div>'
    + '<div class="ex">①光が密な媒質 → 疎な媒質（水→空気）に進む</div>'
    + '<div class="ex">②入射角が臨界角以上になったとき</div>'
    + '<div class="ex">→ 光が境界面を通過せず全て反射する！</div>'
    + '<div class="note">💡 光ファイバーは全反射を利用。光が外に漏れず遠くまで届く</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 凸レンズの像（まとめ表）</div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    + '<tr style="background:var(--bg3);color:var(--teal)">'
    + '<td style="padding:8px 12px;font-weight:bold">物体の位置</td>'
    + '<td style="padding:8px 12px;font-weight:bold">像の種類</td>'
    + '<td style="padding:8px 12px;font-weight:bold">大きさ</td>'
    + '<td style="padding:8px 12px;font-weight:bold">向き</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 12px;color:var(--text2)">2Fより遠い</td>'
    + '<td style="padding:8px 12px;color:var(--gold)">実像</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">縮小</td>'
    + '<td style="padding:8px 12px;color:var(--red)">倒立（逆）</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 12px;color:var(--text2)">2Fの位置</td>'
    + '<td style="padding:8px 12px;color:var(--gold)">実像</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">等倍</td>'
    + '<td style="padding:8px 12px;color:var(--red)">倒立（逆）</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)">'
    + '<td style="padding:8px 12px;color:var(--text2)">F〜2Fの間</td>'
    + '<td style="padding:8px 12px;color:var(--gold)">実像</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">拡大</td>'
    + '<td style="padding:8px 12px;color:var(--red)">倒立（逆）</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="padding:8px 12px;color:var(--text2)">Fの内側</td>'
    + '<td style="padding:8px 12px;color:var(--teal)">虚像</td>'
    + '<td style="padding:8px 12px;color:var(--text2)">拡大</td>'
    + '<td style="padding:8px 12px;color:var(--green)">正立（同じ）</td>'
    + '</tr>'
    + '</table>'
    + '</div>'
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">凸レンズの3本の光線ルール</div>'
    + '<div class="ex">① 光軸に平行な光 → 焦点を通る</div>'
    + '<div class="ex">② 中心を通る光 → そのまま直進</div>'
    + '<div class="ex">③ 焦点を通る光 → 光軸に平行になる</div>'
    + '<div class="note">💡 この3本を作図で描けば像の位置が必ず決まる！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 光の性質</div>';

  var qs = [
    {
      q:'鏡での光の反射について正しいのはどれ？',
      sub:'入射角と反射角の関係（法線から測る）',
      a:'入射角 ＝ 反射角',
      choices:['入射角 ＝ 反射角','入射角 ＞ 反射角','入射角 ＜ 反射角','入射角と反射角は無関係'],
      jp:'反射の法則（入射角＝反射角）',
      exp:'<span class="exp-rule"><span class="label">📐 反射の法則</span>入射角 ＝ 反射角（常に成立）</span><span class="exp-ok">✅ どんな面でも「入射角＝反射角」は必ず成り立つ</span><span class="exp-tip">💡 角度は「面から」ではなく「法線（面に垂直な線）から」で測る！ここが間違えやすい</span>'
    },
    {
      q:'白い紙がどの方向からでも見える理由はどれ？',
      sub:'鏡と紙の反射の違い',
      a:'紙の表面で乱反射しているから',
      choices:['紙の表面で乱反射しているから','紙の表面で正反射しているから','紙が光を吸収しているから'],
      jp:'乱反射の説明',
      exp:'<span class="exp-rule"><span class="label">📐 乱反射</span>凸凹した面に当たった光がさまざまな方向に反射 → 乱反射</span><span class="exp-ok">✅ 乱反射のおかげであらゆる方向から物体が見える</span><span class="exp-ng">❌ 鏡（正反射）は一方向にしか反射しないから特定の角度からしか見えない</span><span class="exp-tip">💡 黒板・壁・本——すべて乱反射している</span>'
    },
    {
      q:'光が空気から水へ進むとき、屈折はどうなる？',
      sub:'光の速さは水中のほうが遅い',
      a:'法線に近づく（入射角 ＞ 屈折角）',
      choices:['法線に近づく（入射角 ＞ 屈折角）','法線から遠ざかる（入射角 ＜ 屈折角）','そのまま直進する'],
      jp:'空気→水の屈折方向',
      exp:'<span class="exp-rule"><span class="label">📐 屈折のルール</span>速い媒質 → 遅い媒質（空気→水）：法線に近づく</span><span class="exp-ok">✅ 入射角 ＞ 屈折角（曲がって法線に近くなる）</span><span class="exp-ng">❌ 水→空気は逆で法線から遠ざかる</span><span class="exp-tip">💡 「密な媒質に入ると密に（法線に近く）なる」で覚えよう</span>'
    },
    {
      q:'光が水から空気へ進むとき、入射角を大きくしていくと最終的にどうなる？',
      sub:'臨界角以上になると起こる現象',
      a:'全反射が起こる',
      choices:['全反射が起こる','屈折角が0°になる','光が消える','屈折角が90°で止まる'],
      jp:'全反射の条件と現象',
      exp:'<span class="exp-rule"><span class="label">📐 全反射</span>水→空気で入射角が臨界角以上になると光が全て反射され、空気側へ出ない</span><span class="exp-ok">✅ 全反射が起こる2条件：①密→疎な媒質（水→空気）②入射角≥臨界角</span><span class="exp-tip">💡 光ファイバーはこの全反射を利用。光が外に漏れず遠くまで伝わる！</span>'
    },
    {
      q:'凸レンズで物体が焦点距離の2倍（2F）より遠い位置にあるとき、できる像はどれ？',
      sub:'スクリーンに映せる像',
      a:'縮小した倒立実像',
      choices:['縮小した倒立実像','拡大した正立虚像','等倍の倒立実像','像はできない'],
      jp:'凸レンズ：2F外→縮小倒立実像',
      exp:'<span class="exp-rule"><span class="label">📐 実像（倒立）</span>物体が2Fより遠い → 縮小・倒立・実像（FとFの間の位置にできる）</span><span class="exp-ok">✅ 実像はスクリーンに映せる・上下左右が逆</span><span class="exp-tip">💡 カメラは凸レンズで縮小倒立実像を作る仕組み。写真が上下逆にならないのはセンサーで補正するから</span>'
    },
    {
      q:'凸レンズで物体が焦点（F）の内側にあるとき、できる像はどれ？',
      sub:'ルーペで物体を大きく見る状況と同じ',
      a:'拡大した正立虚像',
      choices:['拡大した正立虚像','縮小した倒立実像','等倍の倒立実像','像はできない'],
      jp:'凸レンズ：焦点内→正立拡大虚像',
      exp:'<span class="exp-rule"><span class="label">📐 虚像（正立）</span>物体が焦点の内側 → 拡大・正立・虚像（スクリーンに映せない）</span><span class="exp-ok">✅ ルーペ（虫めがね）で物を拡大して見るのはこの原理</span><span class="exp-ng">❌ 虚像は物体と同じ側（レンズの後ろではなく手前）に見かけ上できる</span><span class="exp-tip">💡 「F内→虚像（正立拡大）」「F外→実像（倒立）」で2択！</span>'
    },
    {
      q:'凸レンズで光軸に平行に入った光は、レンズを通過した後どこを通る？',
      sub:'凸レンズの3本の光線ルール①',
      a:'焦点を通る',
      choices:['焦点を通る','レンズの中心を通る','光軸に平行に進む','消える'],
      jp:'凸レンズ：軸平行→焦点を通る',
      exp:'<span class="exp-rule"><span class="label">📐 光線ルール①</span>光軸に平行な光 → レンズを通過後、焦点を通る</span><span class="exp-ok">✅ 3本ルール：①軸平行→焦点　②中心→直進　③焦点→軸平行</span><span class="exp-tip">💡 この3本を使って作図すれば、どこに像ができるか必ず求められる！</span>'
    },
    {
      q:'物体が焦点距離の2倍（2F）の位置にあるとき、実像はどこにどんな大きさでできる？',
      sub:'特別な位置の特別な結果',
      a:'反対側の2Fの位置に等倍の実像',
      choices:['反対側の2Fの位置に等倍の実像','FとFの間に縮小実像','Fより遠くに拡大実像'],
      jp:'凸レンズ：2F→等倍実像',
      exp:'<span class="exp-rule"><span class="label">📐 特別ケース</span>物体が2Fの位置 → 反対側の2Fの位置に等倍・倒立実像</span><span class="exp-ok">✅ 「2F→2Fに等倍」はセットで覚える定番</span><span class="exp-tip">💡 物体がFに近づくほど実像は遠くなり大きくなる。Fの位置では像はできない（無限遠）</span>'
    },
    {
      q:'光ファイバーが利用している光の性質はどれ？',
      sub:'インターネット通信や医療内視鏡に使われる',
      a:'全反射',
      choices:['全反射','乱反射','屈折','正反射'],
      jp:'光ファイバーの原理（全反射）',
      exp:'<span class="exp-rule"><span class="label">📐 全反射の応用</span>光ファイバー = 全反射を繰り返しながら光を遠くまで伝える</span><span class="exp-ok">✅ 光が外に漏れず長距離を伝わる → 高速通信が可能</span><span class="exp-tip">💡 医療の内視鏡・光通信ケーブル・イルミネーション飾りも全反射を利用！</span>'
    },
    {
      q:'凸レンズの中心を通る光はどうなる？',
      sub:'凸レンズの3本の光線ルール②',
      a:'そのまま直進する（方向が変わらない）',
      choices:['そのまま直進する（方向が変わらない）','焦点を通る','光軸に平行になる'],
      jp:'凸レンズ：中心→直進',
      exp:'<span class="exp-rule"><span class="label">📐 光線ルール②</span>レンズの中心を通る光 → そのまま直進（屈折しない）</span><span class="exp-ok">✅ 3本ルール：①軸平行→焦点　②中心→直進　③焦点を通る→軸平行</span><span class="exp-tip">💡 この3本を組み合わせて像の位置を作図しよう。テストに必ず出る！</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_force_s2_q' + i; });
  qs = shuffleArray(qs);
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
function renderSection3() {
  var html = '';

  // Rule cards
  html += '<div class="rule-card">'
    + '<div class="rule-title">📐 音の速さ・伝わり方</div>'
    + '<div class="rule-body">'
    + '<b>音の速さ</b>：空気中で約 <span style="color:var(--gold)">340 m/s</span>（気温15℃）<br>'
    + '　水中や固体ではさらに速い（固体 ＞ 液体 ＞ 気体）<br><br>'
    + '<b>音が伝わる仕組み</b>：物体が振動 → 周囲の空気を振動させて伝わる<br>'
    + '　<span style="color:#f87171">真空中では音は伝わらない</span>（伝える物質＝媒質がないため）<br><br>'
    + '<b>音速の計算</b>：距離 ＝ 音速 × 時間<br>'
    + '　例：雷の光が見えてから3秒後に音が聞こえた → 距離 = 340 × 3 = <span style="color:var(--gold)">1020 m</span>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-title">📐 振動数と振幅</div>'
    + '<div class="rule-body">'
    + '<b>振動数（Hz：ヘルツ）</b>：1秒間に振動する回数<br>'
    + '　振動数が多い → 音が<span style="color:var(--gold)">高い</span><br>'
    + '　振動数が少ない → 音が<span style="color:var(--gold)">低い</span><br><br>'
    + '<b>振幅</b>：振動の幅（大きさ）<br>'
    + '　振幅が大きい → 音が<span style="color:var(--gold)">大きい</span><br>'
    + '　振幅が小さい → 音が<span style="color:var(--gold)">小さい</span><br><br>'
    + '⚡ まとめ：<b>高さ → 振動数</b>、<b>大きさ → 振幅</b>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-title">📐 弦の振動と音の高さ</div>'
    + '<div class="rule-body">'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    + '<tr style="background:#1e293b">'
    + '<th style="padding:8px;border:1px solid #334155">条件変化</th>'
    + '<th style="padding:8px;border:1px solid #334155">音の高さ</th>'
    + '</tr>'
    + '<tr><td style="padding:8px;border:1px solid #334155">弦を短くする</td><td style="padding:8px;border:1px solid #334155;color:var(--gold)">高くなる</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #334155">弦を細くする</td><td style="padding:8px;border:1px solid #334155;color:var(--gold)">高くなる</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #334155">弦を強く張る</td><td style="padding:8px;border:1px solid #334155;color:var(--gold)">高くなる</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #334155">弦を長くする</td><td style="padding:8px;border:1px solid #334155;color:var(--text2)">低くなる</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #334155">弦を太くする</td><td style="padding:8px;border:1px solid #334155;color:var(--text2)">低くなる</td></tr>'
    + '</table>'
    + '</div>'
    + '</div>';

  // Questions
  var qs = [
    { jp: '空気中での音の速さはおよそ何 m/s か。',
      answer: '約340 m/s',
      choices: ['約340 m/s','約3000 m/s','約1500 m/s','約30 m/s'],
      exp: '音は空気中を約340 m/sで伝わる。これは光（約30万km/s）よりはるかに遅い。雷の音と光の時間差で距離を計算できる。' },
    { jp: '音が真空中を伝わらない理由として正しいのはどれか。',
      answer: '音を伝える物質（媒質）がないから',
      choices: ['音を伝える物質（媒質）がないから','空気が冷たいから','光が邪魔するから','重力がないから'],
      exp: '音は空気・水・固体などの物質の振動によって伝わる。真空には媒質がないので音は伝わらない。宇宙空間では爆発しても音は聞こえない。' },
    { jp: '振動数の単位は何か。',
      answer: 'Hz（ヘルツ）',
      choices: ['Hz（ヘルツ）','N（ニュートン）','Pa（パスカル）','W（ワット）'],
      exp: '振動数の単位はHz（ヘルツ）。1Hzは1秒間に1回振動することを意味する。人間の耳は約20Hz〜20000Hzの音を聞くことができる。' },
    { jp: '音の高さを決める要素はどれか。',
      answer: '振動数',
      choices: ['振動数','振幅','音速','波長'],
      exp: '音の高さは振動数（Hz）で決まる。振動数が多いほど高い音になる。振幅は音の大きさを決める要素。' },
    { jp: '音の大きさを決める要素はどれか。',
      answer: '振幅',
      choices: ['振幅','振動数','波長','音速'],
      exp: '音の大きさは振幅で決まる。振幅が大きいほど大きな音になる。ギターを強く弾くと振幅が大きくなり音も大きくなる。' },
    { jp: 'ギターの弦を短くすると音はどうなるか。',
      answer: '高くなる',
      choices: ['高くなる','低くなる','大きくなる','小さくなる'],
      exp: '弦を短くすると振動数が増えるので音は高くなる。ギターのフレットを押さえて弦を短くすると高い音が出る。' },
    { jp: '同じ条件で、太い弦と細い弦では、どちらが低い音を出すか。',
      answer: '太い弦',
      choices: ['太い弦','細い弦','同じ','条件による'],
      exp: '太い弦は振動しにくいため振動数が少なくなり、低い音が出る。ベース（低い音）の弦はギター（高い音）より太い。' },
    { jp: '雷が光ってから4秒後に音が聞こえた。雷までの距離は何mか（音速340m/sとする）。',
      answer: '1360 m',
      choices: ['1360 m','340 m','680 m','4080 m'],
      exp: '距離 = 音速 × 時間 = 340 × 4 = 1360 m。光は瞬時に届くと考えるため、音が遅れた時間が音の伝わった時間になる。' },
  ];

  // Stable qids before shuffle
  qs.forEach(function(q, i) { q._qid = 'sci_force_s3_q' + i; });
  shuffleArray(qs);

  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}
function renderSection4() {
  var html = '<div style="background:#1a2236;border:1px solid #334155;border-radius:12px;padding:20px 24px;margin-bottom:24px">'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:8px">📋 確認テスト</div>'
    + '<div style="font-size:16px;color:var(--text);line-height:1.8">力・光・音の重要用語と法則を確認しよう。<br>'
    + '語句記入問題（10問）＋選択問題（10問）の計20問。</div>'
    + '</div>';

  // --- 語句記入 10問 ---
  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 12px;letter-spacing:.08em">▍語句記入問題</div>';

  var inputQs = [
    { qid:'sci_force_s4_in0', jp:'物体が地球から引っ張られる力を何というか。', answer:'重力', exp:'重力は地球の中心に向かって働く力。単位はN（ニュートン）。質量1kgの物体には約10Nの重力が働く。' },
    { qid:'sci_force_s4_in1', jp:'バネや輪ゴムが元の形に戻ろうとする力を何というか。', answer:'弾性力', exp:'弾性力（ばねの力）は変形したものが元に戻ろうとするときに生じる力。フックの法則に従い、伸びに比例する。' },
    { qid:'sci_force_s4_in2', jp:'面が物体を垂直に押し返す力を何というか。', answer:'垂直抗力', exp:'机の上に置いた本には重力が下向きに働くが、机が上向きに垂直抗力を与えることでつり合いが保たれる。' },
    { qid:'sci_force_s4_in3', jp:'力の大きさを表す単位は何か。', answer:'N（ニュートン）', exp:'力の単位はN（ニュートン）。1Nは約100gの物体にかかる重力の大きさ。500gの物体には約5Nの重力が働く。' },
    { qid:'sci_force_s4_in4', jp:'光が鏡などの面で跳ね返る現象を何というか。', answer:'反射', exp:'反射の法則：入射角＝反射角。光が鏡に当たるとき、入射光と反射光は法線に対して同じ角度になる。' },
    { qid:'sci_force_s4_in5', jp:'光が異なる物質の境界面で折れ曲がる現象を何というか。', answer:'屈折', exp:'光は空気→水に進むとき境界面に近づく方向（法線から遠ざかる）に屈折する。水→空気のときは逆。' },
    { qid:'sci_force_s4_in6', jp:'凸レンズの中心を通る軸（光軸）に平行な光が凸レンズを通った後に集まる点を何というか。', answer:'焦点', exp:'焦点はレンズの中心から等距離に2か所ある。凸レンズによる像の作図では焦点が重要な基準点になる。' },
    { qid:'sci_force_s4_in7', jp:'空気中での音の速さは約何 m/s か。', answer:'340 m/s', exp:'音速は気温や媒質によって異なるが、気温15℃の空気中で約340 m/s。光速（約30万km/s）に比べてはるかに遅い。' },
    { qid:'sci_force_s4_in8', jp:'1秒間に振動する回数を何というか。また単位は何か。', answer:'振動数・Hz', exp:'振動数の単位はHz（ヘルツ）。振動数が多い→音が高い、少ない→音が低い。振幅は音の大きさを決める。' },
    { qid:'sci_force_s4_in9', jp:'フックの法則とは何か。「ばねの伸びは〜」で答えよ。', answer:'ばねの伸びは加えた力に比例する', exp:'フックの法則：ばねの伸びは加えた力に比例する。グラフにすると原点を通る直線になる。比例定数はばね定数。' },
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

  // --- 選択問題 10問 ---
  html += '<div style="font-size:13px;color:var(--text2);margin:32px 0 12px;letter-spacing:.08em">▍選択問題</div>';

  var choiceQs = [
    { jp: '500 g の物体にはたらく重力は何 N か。',
      answer: '5 N',
      choices: ['5 N','50 N','0.5 N','500 N'],
      exp: '重力の計算：100 g → 1 N の関係。500 g = 500 ÷ 100 = 5 N。質量と重力を混同しないこと（質量はkg・gで変わらないが重力は場所で変わる）。' },
    { jp: 'つり合っている2力の条件として正しくないものはどれか。',
      answer: '2力の作用線がずれている',
      choices: ['2力の大きさが等しい','2力の向きが反対','2力が一直線上にある','2力の作用線がずれている'],
      exp: 'つり合いの3条件：①大きさが等しい ②向きが反対 ③同一直線上。同一直線上でないと回転が生じてしまう。' },
    { jp: '光が水中から空気中に出るとき、入射角が一定以上になると全反射する。この一定の角度を何というか。',
      answer: '臨界角',
      choices: ['臨界角','入射角','反射角','屈折角'],
      exp: '臨界角を超えると光は境界面で完全に反射（全反射）する。光ファイバーはこの全反射を利用して光を遠くまで送る。' },
    { jp: '物体が焦点の内側（F内）にあるとき、凸レンズでできる像はどれか。',
      answer: '正立の虚像',
      choices: ['正立の虚像','倒立の実像','倒立の虚像','像はできない'],
      exp: 'F内では光が凸レンズを通っても集まらず、同じ側に正立・拡大の虚像ができる。ルーペ（虫眼鏡）で見えるのがこの像。' },
    { jp: '乱反射について正しく説明しているのはどれか。',
      answer: '表面がでこぼこな物体に光が当たって、あらゆる方向に反射する',
      choices: [
        '表面がでこぼこな物体に光が当たって、あらゆる方向に反射する',
        '光が物体を透過して散乱する現象',
        '反射の法則が成り立たない特殊な反射',
        '平行な光が一点に集まる現象'
      ],
      exp: '乱反射は各点では反射の法則が成り立っているが、表面がでこぼこのため反射する向きがバラバラになる。白い紙や壁が見えるのは乱反射のため。' },
    { jp: '音を真空中で実験すると、どうなるか。',
      answer: '音は聞こえない',
      choices: ['音は聞こえない','音が大きくなる','音が高くなる','音の速さが増す'],
      exp: '音は物質の振動（媒質）によって伝わるため、媒質のない真空中では伝わらない。宇宙空間では音は聞こえない。' },
    { jp: '弦を強く張ると音はどうなるか。',
      answer: '高くなる',
      choices: ['高くなる','低くなる','大きくなる','変わらない'],
      exp: '弦を強く張ると振動しやすくなり振動数が増えるため、音は高くなる。ギターのチューニングはこの原理を使っている。' },
    { jp: '次のうち、浮力について正しいのはどれか。',
      answer: '浮力の大きさは物体が押しのけた液体の重さに等しい',
      choices: [
        '浮力の大きさは物体が押しのけた液体の重さに等しい',
        '浮力は物体の質量が大きいほど大きい',
        '浮力は深さに関係なく一定',
        '浮力は空気中でも液体中でも同じ'
      ],
      exp: 'アルキメデスの原理：浮力 = 押しのけた流体の重さ（密度×体積×g）。同じ体積でも密度の高い液体ほど大きな浮力が生じる。' },
    { jp: '摩擦力はどの方向に働くか。',
      answer: '物体の運動を妨げる方向',
      choices: ['物体の運動を妨げる方向','重力と同じ方向（下向き）','垂直抗力と同じ方向（上向き）','運動の方向と同じ'],
      exp: '摩擦力は物体が動こうとする方向（または動いている方向）と逆向きに働く。だから滑り止めに使われる。' },
    { jp: '物体が2Fより外側にあるとき、凸レンズにできる実像の特徴はどれか。',
      answer: '倒立で縮小した実像',
      choices: ['倒立で縮小した実像','正立で拡大した実像','倒立で拡大した実像','倒立で等倍の実像'],
      exp: '2Fより外側：倒立・縮小の実像。2F上：倒立・等倍の実像。F〜2Fの間：倒立・拡大の実像。F内：正立・拡大の虚像。' },
  ];

  choiceQs.forEach(function(q, i) { q._qid = 'sci_force_s4_ch' + i; });
  shuffleArray(choiceQs);

  choiceQs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}
function renderSection5() {
  return '<div style="background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.2);border-radius:12px;padding:24px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--teal);font-weight:bold;margin-bottom:12px">🔗 中1→中3 繋がり一覧</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '力の三要素・力のつり合い → <span style="color:var(--gold)">力の合成と分解（中3）</span><br>'
    + 'フックの法則・弾性力 → <span style="color:var(--gold)">弾性エネルギー・位置エネルギー（中3）</span><br>'
    + '重力・摩擦力 → <span style="color:var(--gold)">斜面上の運動・エネルギーの変換（中3）</span><br>'
    + '光の屈折・凸レンズ → <span style="color:var(--gold)">波の性質（中3）</span><br>'
    + '振動数・振幅 → <span style="color:var(--gold)">波の基本（波長・振動数・波速）（中3）</span>'
    + '</div></div>';
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var prefix = 'sci_force_s4_';
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
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('sci_force_') === 0; });

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

// === sci_c2_chem.html ===
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

// === sci_c2_electric.html ===
// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「電流？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺電気できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「オームの法則で漫才できるかもしれない」' },
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
var answeredSet = JSON.parse(localStorage.getItem('sci_elec_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('sci_elec_sections') || '{}');
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
}
function addXP(pts, qid) {
  if (answeredSet[qid]) return false;
  var oldLv = getLevel(xp).lv;
  xp += pts;
  answeredSet[qid] = true;
  localStorage.setItem('sci_xp',           xp);
  localStorage.setItem('sci_elec_answered', JSON.stringify(answeredSet));
  updateXP();
  return getLevel(xp).lv > oldLv;
}
function deductXP(pts) {
  var oldLv = getLevel(xp).lv;

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
    return id.indexOf('sci_elec_') === 0 && getPct(id) < 80;
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
  if (!weakDB[qid]) weakDB[qid] = { jp:(qMeta[qid]&&qMeta[qid].jp)||'', answer:(qMeta[qid]&&qMeta[qid].answer)||'', choices:(qMeta[qid]&&qMeta[qid].choices)||[], correct:0, total:0 };
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('sci_weakdb', JSON.stringify(weakDB));
  var _today = new Date().toISOString().slice(0,10);
  var _daily = JSON.parse(localStorage.getItem('sci_daily') || '{}');
  _daily[_today] = (_daily[_today] || 0) + 1;
  localStorage.setItem('sci_daily',           JSON.stringify(_daily));
  localStorage.setItem('sci_elec_lastStudy',  _today);
  renderWeakBar();
  renderTabs();
}

// ===== SPEECH =====
var speechEnabled = (typeof window !== 'undefined' && 'speechSynthesis' in window);
function speak(text) {
  if (!speechEnabled) return;
  try { window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = 1.1; window.speechSynthesis.speak(u); } catch(e) {}
}

// ===== TOAST =====
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  if (type === 'levelup') t.className = 'toast levelup';
  else if (type === 'demote') t.className = 'toast demote';
  else t.className = 'toast';
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, type === 'levelup' ? 4000 : type === 'demote' ? 3500 : 2500);
}

// ===== COMMENTS =====
var COMMENTS = {
  kyon_correct: [
    'きょん「合ってる！電気できるじゃん！！」',
    'きょん「やった！天才かも！」',
    'きょん「にっくん見て！オームの法則わかってきた！！」',
    'きょん「待って、合ってるじゃん！めちゃくちゃすごいじゃん！」',
  ],
  nishi_correct: [
    '西村「正解。よく覚えてたね」',
    '西村「できてる。その調子」',
    '西村「正解。次も頼む」',
    '西村「ちゃんとわかってる」',
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
  qMeta[qid] = Object.assign(qMeta[qid] || {}, { type:'input', answer:answer, xp:xpPts, jp:jp });
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
    inp.style.borderColor = 'var(--green)'; markCorrect(qid, meta);
  } else {
    inp.style.borderColor = 'var(--red)'; markWrong(qid, meta, val); inp.select();
  }
}
function makeChoices(qid, jp, answer, choices, exp) {
  choices = shuffleArray(choices);
  qMeta[qid] = Object.assign(qMeta[qid] || {}, { type:'choice', answer:answer, xp:4, jp:jp, choices:choices });
  var done = answeredSet[qid];
  return '<div class="q-card" data-card="' + qid + '">'
    + '<div class="q-text">' + jp + '</div>'
    + '<div class="choices">'
    + choices.map(function(c) {
        if (done) return '<button class="choice-btn ' + (c===answer?'show-correct':'') + '" disabled>' + c + '</button>';
        return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
      }).join('')
    + '</div>'
    + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
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
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + (done ? getComment('nishi_correct') : '')
    + '</div>'
    + '</div>';
}
function handleChoice(qid, choice) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  if (choice === meta.answer) markCorrect(qid, meta, choice);
  else markWrong(qid, meta, choice);
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
  var expEl = document.getElementById('exp_' + qid);
  if (expEl) expEl.style.display = 'block';
  if (lvUp) {
    setTimeout(function() { var lv = getLevel(xp); speak('昇格！'); showToast('🎉 昇格！ ' + lv.badge + '　きょん「' + lv.badge + 'になったわ！！」', 'levelup'); }, 400);
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
  if (attemptCounts[qid] >= 2) { var sab = document.getElementById('sab_' + qid); if (sab) sab.style.display = 'inline-block'; }
  var demoted = deductXP(5);
  var wrongMsgs = [
    'きょん「あれ！間違えた！でも次は大丈夫！！」',
    'きょん「また間違えた…！まだまだ大丈夫！！」',
    'きょん「何回間違えてんの！！にっくんに怒られる！！」',
    'きょん「もうやだ！！でも諦めないぞ！！答えを見ちゃおうかな…」',
  ];
  if (demoted) {
    setTimeout(function() { showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」', 'demote'); }, 200);
  } else {
    setTimeout(function() { showToast(wrongMsgs[Math.min(wrongMsgs.length-1, attemptCounts[qid]-1)]); }, 100);
  }
  if (!tokkuBannerShown) { tokkuBannerShown = true; setTimeout(function() { showTokkuSuggestion(qid); }, 500); }
}
function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  localStorage.setItem('sci_elec_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid);
  if (arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if (ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if (sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true; if (b.dataset.choice === meta.answer) b.classList.add('show-correct');
  });
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = 'きょん「ふーん、そういうことか。次は自分でできる！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。次は自分で解いてみよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete() {
  var prefix = 'sci_elec_s' + currentSection + '_';
  var sectionQ = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sectionQ.length === 0) return;
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done) {
    sectionDone[currentSection] = true;
    localStorage.setItem('sci_elec_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb) {
      nb.style.display = 'block';
      if (!document.getElementById('sectionCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'sectionCompleteBanner';
        var nextSec = currentSection < 4 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '確認テストで腕試し！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(63,185,80,0.12),rgba(14,165,233,0.08));border:1px solid var(--green);border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--green);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
          + '<div style="font-size:14px;color:var(--text2)">きょん「全問解いた！！にっくん、俺やれるじゃん！！」</div>'
          + '<div style="font-size:13px;color:var(--text2);margin-top:4px">西村「よくやった。' + nextSec + '」</div>'
          + '</div>';
        nb.parentNode.insertBefore(banner, nb);
        setTimeout(function(){ banner.scrollIntoView({ behavior:'smooth', block:'center' }); }, 200);
      }
    }
  }
}

// ===== SECTIONS =====
var currentSection = 0;
var SECTIONS = [
  { id:0, label:'⚡ スタート',  title:'電流・磁界',                sub:'中2理科の電気分野。オームの法則と磁界をマスターしよう！' },
  { id:1, label:'電流・電圧',   title:'電流・電圧・抵抗とオームの法則', sub:'V=IR の公式を使いこなそう' },
  { id:2, label:'回路',        title:'直列・並列回路',              sub:'電流と電圧の流れ方の違いを理解しよう' },
  { id:3, label:'電力・磁界',   title:'電力・電熱・磁界',            sub:'電力の計算と磁界・電磁誘導の仕組み' },
  { id:4, label:'確認テスト',   title:'確認テスト',                 sub:'全単元の総まとめ！愛知県形式20問' },
  { id:5, label:'🔗3年予習',    title:'3年予習：運動とエネルギー',   sub:'仕事・仕事率・エネルギーの保存への橋渡し' },
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
    if (s.id === 7) { var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
    html += '<button class="' + cls + '" data-sid="' + s.id + '">' + label + '</button>';
  });
  document.getElementById('sectionTabs').innerHTML = html;
  document.querySelectorAll('.section-tab[data-sid]').forEach(function(btn) {
    btn.addEventListener('click', function() { goSection(parseInt(btn.dataset.sid)); });
  });
}
function goSection(id) { currentSection = id; renderTabs(); renderSection(id); window.scrollTo(0,0); }
function renderSection(id) {
  if (id === 6) { renderWeakNote(); return; }
  if (id === 7) { renderTokkuMode(); return; }
  var s = SECTIONS[id];
  var html = '<div class="progress-dots">';
  for (var i = 0; i <= 5; i++) {
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">理科 中2電流 · SECTION ' + id + '</div>'
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
    var nextAction = id < 4 ? 'goSection(' + (id+1) + ')' : 'showFinalResult()';
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
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleInput(inp.id.replace('inp_','')); });
  });
  if (sectionDone[id]) { var nb = document.getElementById('nextBtn'); if (nb) nb.style.display = 'block'; }
  checkSectionComplete();
}

// ===== SECTION 0 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">オームの法則って V＝IR でしょ？でも V と I と R どれを求めるか毎回わからなくなる！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">三角形で覚えよう。V・I・R の三角形を書いて、求めたい文字を指で隠す。V を隠せば I×R、I を隠せば V÷R、R を隠せば V÷I——これだけで全部解ける。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">指で隠す！それ天才的！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">直列と並列の違いも重要だ。電流・電圧・合成抵抗の3つでそれぞれ違うルールがある——全部整理して覚えよう。</div></div></div>'
    + '</div>'
    + '<button class="start-btn" onclick="goSection(1)">⚡ 電流・電圧・抵抗から始める →</button>';
}

// ===== SECTION 1: 電流・電圧・抵抗 =====
function renderSection1() {
  var html = '';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 電流・電圧・抵抗の単位</div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    + '<tr style="background:#1e293b;color:var(--teal)"><th style="padding:8px 12px;border:1px solid #334155">量</th><th style="padding:8px 12px;border:1px solid #334155">単位</th><th style="padding:8px 12px;border:1px solid #334155">記号</th><th style="padding:8px 12px;border:1px solid #334155">測定器</th></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold)">電流（I）</td><td style="padding:8px 12px;border:1px solid #334155">アンペア</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--teal)">A（mA）</td><td style="padding:8px 12px;border:1px solid #334155">電流計</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold)">電圧（V）</td><td style="padding:8px 12px;border:1px solid #334155">ボルト</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--teal)">V</td><td style="padding:8px 12px;border:1px solid #334155">電圧計</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold)">抵抗（R）</td><td style="padding:8px 12px;border:1px solid #334155">オーム</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--teal)">Ω</td><td style="padding:8px 12px;border:1px solid #334155">—</td></tr>'
    + '</table>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 オームの法則（最重要！）</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">公式（三角形で覚える）</div>'
    + '<div class="ex" style="font-size:22px;text-align:center;margin:8px 0">V ＝ I × R</div>'
    + '<div class="ex">電圧(V) ＝ 電流(A) × 抵抗(Ω)</div>'
    + '<div class="ex">I ＝ V ÷ R　　R ＝ V ÷ I</div>'
    + '<div class="note">💡 三角形の使い方：求めたい文字を指で隠す。残りが答えの式！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">計算例</div>'
    + '<div class="ex">例1：抵抗20Ω、電圧6Vのとき電流は？　I = V÷R = 6÷20 = <span style="color:var(--gold)">0.3A</span></div>'
    + '<div class="ex">例2：電流0.5A、抵抗10Ωのとき電圧は？　V = I×R = 0.5×10 = <span style="color:var(--gold)">5V</span></div>'
    + '<div class="ex">例3：電圧12V、電流0.4Aのとき抵抗は？　R = V÷I = 12÷0.4 = <span style="color:var(--gold)">30Ω</span></div>'
    + '</div>'
    + '</div>';

  var qs = [
    { jp:'電流の単位はどれか。',
      answer:'A（アンペア）', choices:['A（アンペア）','V（ボルト）','Ω（オーム）','W（ワット）'],
      exp:'電流の単位はA（アンペア）。小さい電流はmA（ミリアンペア）で表す。1A = 1000mA。電流計は回路に直列につなぐ。' },
    { jp:'電圧の単位はどれか。',
      answer:'V（ボルト）', choices:['V（ボルト）','A（アンペア）','Ω（オーム）','J（ジュール）'],
      exp:'電圧の単位はV（ボルト）。電圧は電流を流そうとする「押す力」。電圧計は回路に並列につなぐ。' },
    { jp:'抵抗の単位はどれか。',
      answer:'Ω（オーム）', choices:['Ω（オーム）','A（アンペア）','V（ボルト）','Hz（ヘルツ）'],
      exp:'抵抗の単位はΩ（オーム）。電流の流れにくさを表す。導線は抵抗が小さく、電流が流れやすい。' },
    { jp:'抵抗30Ω の電熱線に電圧6V をかけると、流れる電流は何Aか。',
      answer:'0.2 A', choices:['0.2 A','0.5 A','5 A','180 A'],
      exp:'オームの法則：I = V÷R = 6÷30 = 0.2A。三角形で「I を隠す」と V÷R が残る。' },
    { jp:'電流0.3A、抵抗20Ω のとき、電圧は何Vか。',
      answer:'6 V', choices:['6 V','0.015 V','60 V','66.7 V'],
      exp:'V = I×R = 0.3×20 = 6V。三角形で「V を隠す」と I×R が残る。' },
    { jp:'電圧12V、電流0.4A のとき、抵抗は何Ωか。',
      answer:'30 Ω', choices:['30 Ω','4.8 Ω','0.033 Ω','12.4 Ω'],
      exp:'R = V÷I = 12÷0.4 = 30Ω。三角形で「R を隠す」と V÷I が残る。' },
    { jp:'電流計を回路につなぐ方法として正しいのはどれか。',
      answer:'直列につなぐ', choices:['直列につなぐ','並列につなぐ','どちらでもよい','電源に直接つなぐ'],
      exp:'電流計は回路に直列（一列）につなぐ。並列につなぐと抵抗がほぼ0になり大電流が流れて壊れる。' },
    { jp:'電圧計を回路につなぐ方法として正しいのはどれか。',
      answer:'並列につなぐ', choices:['並列につなぐ','直列につなぐ','どちらでもよい','電源に直接つなぐ'],
      exp:'電圧計は測定する素子に並列につなぐ。直列につなぐと電圧計の抵抗が大きいため電流がほぼ流れなくなる。' },
    { jp:'600mAを Aに換算するといくらか。',
      answer:'0.6 A', choices:['0.6 A','60 A','6000 A','0.006 A'],
      exp:'1A = 1000mA なので、600mA = 600÷1000 = 0.6A。mA→Aは÷1000、A→mAは×1000。' },
    { jp:'電熱線の抵抗と電流の関係（電圧一定のとき）として正しいのはどれか。',
      answer:'抵抗が大きいほど電流は小さい',
      choices:['抵抗が大きいほど電流は小さい','抵抗が大きいほど電流も大きい','抵抗と電流は関係ない','抵抗が大きいと電圧が下がる'],
      exp:'V=IR より I=V/R。電圧Vが一定のとき、R（抵抗）が大きいほど I（電流）は小さくなる（反比例の関係）。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_elec_s1_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

// ===== SECTION 2: 直列・並列回路 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">直列と並列ってどっちがどっちかいつも混乱する！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">「直列」は1本道——電流の通り道が1本。「並列」は2本以上の道が分かれている。電流は道ごとに分かれ、電圧は全部同じになる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">直列は一本道だから電流が同じで、並列は分かれ道だから電圧が同じってこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">完璧だ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 直列回路 vs 並列回路</div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    + '<tr style="background:#1e293b;color:var(--teal)"><th style="padding:8px 12px;border:1px solid #334155"> </th><th style="padding:8px 12px;border:1px solid #334155">直列回路</th><th style="padding:8px 12px;border:1px solid #334155">並列回路</th></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--text2)">電流（A）</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold)">どこも同じ</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--teal)">枝ごとに分かれる（合計＝全体）</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--text2)">電圧（V）</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--teal)">各部分に分かれる（合計＝全体）</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold)">どこも同じ（電源電圧＝各枝）</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--text2)">合成抵抗</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--red)">R = R₁ + R₂（単純に足す）</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--green)">1/R = 1/R₁ + 1/R₂（逆数で計算）</td></tr>'
    + '</table>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 合成抵抗の計算</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">直列の合成抵抗（足すだけ）</div>'
    + '<div class="ex">例：10Ωと20Ωを直列 → 合成抵抗 = 10+20 = 30Ω</div>'
    + '<div class="note">💡 直列は「抵抗が増える」→ 全体の抵抗は大きくなる</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">並列の合成抵抗（逆数で計算）</div>'
    + '<div class="ex">例：10Ωと10Ωを並列 → 1/R = 1/10+1/10 = 2/10　→ R = 5Ω</div>'
    + '<div class="ex">例：10Ωと20Ωを並列 → 1/R = 1/10+1/20 = 3/20 → R ≒ 6.7Ω</div>'
    + '<div class="note">💡 並列は「道が増える」→ 全体の抵抗は各抵抗より小さくなる</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { jp:'直列回路での電流の特徴はどれか。',
      answer:'どこでも同じ大きさ', choices:['どこでも同じ大きさ','枝ごとに分かれる','電源に近いほど大きい','抵抗に比例する'],
      exp:'直列回路は1本道。電流は分かれないのでどこでも同じ。電源から出た電流がそのまま1本道を流れる。' },
    { jp:'並列回路での電圧の特徴はどれか。',
      answer:'どの枝も電源電圧と同じ', choices:['どの枝も電源電圧と同じ','枝ごとに分かれる','抵抗が大きい枝ほど大きい','合計が電源電圧'],
      exp:'並列回路では各枝の電圧が全て等しく、電源電圧に等しい。これが並列回路の最重要ポイント。' },
    { jp:'直列回路の合成抵抗の求め方として正しいのはどれか。',
      answer:'各抵抗の和（R₁+R₂）', choices:['各抵抗の和（R₁+R₂）','各抵抗の積（R₁×R₂）','逆数の和（1/R₁+1/R₂）の逆数','小さいほうの抵抗'],
      exp:'直列の合成抵抗 = R₁+R₂。10Ωと20Ωの直列 = 30Ω。並列より合成抵抗は大きくなる。' },
    { jp:'10Ωと20Ωの抵抗を直列につないだとき、合成抵抗は何Ωか。',
      answer:'30 Ω', choices:['30 Ω','6.7 Ω','200 Ω','10 Ω'],
      exp:'直列の合成抵抗 = 10+20 = 30Ω。シンプルに足すだけ！並列なら1/R = 1/10+1/20 = 3/20 → R ≒ 6.7Ω。' },
    { jp:'10Ωと10Ωの抵抗を並列につないだとき、合成抵抗は何Ωか。',
      answer:'5 Ω', choices:['5 Ω','20 Ω','10 Ω','0.2 Ω'],
      exp:'並列：1/R = 1/10+1/10 = 2/10 = 1/5 → R = 5Ω。同じ抵抗を並列にすると半分になる。' },
    { jp:'直列回路に抵抗R₁=10Ω、R₂=20Ωをつなぎ、電源電圧が6Vのとき、電流はいくらか。',
      answer:'0.2 A', choices:['0.2 A','0.3 A','1 A','0.6 A'],
      exp:'合成抵抗 = 10+20 = 30Ω。電流 I = V÷R = 6÷30 = 0.2A。直列では全体に同じ電流が流れる。' },
    { jp:'並列回路で一方の枝が切れた（断線した）とき、もう一方の枝はどうなるか。',
      answer:'そのまま流れる', choices:['そのまま流れる','一緒に止まる','電流が倍になる','電圧が下がる'],
      exp:'並列回路では各枝が独立。一方の枝が切れても他の枝には影響しない。家庭の電気が並列なのはこのため。' },
    { jp:'直列回路で一方の電球が切れた（断線した）とき、もう一方の電球はどうなるか。',
      answer:'消える（電流が流れなくなる）', choices:['消える（電流が流れなくなる）','そのまま点灯する','明るくなる','電球が壊れる'],
      exp:'直列は1本道。断線すると回路が切れて電流が流れなくなり、全ての電球が消える。クリスマスツリーの古い電球がこの方式で1個切れると全部消える。' },
    { jp:'電源電圧12V、並列回路の各枝の抵抗が6Ωと12Ωのとき、全体の電流はいくらか。',
      answer:'3 A', choices:['3 A','1 A','2 A','0.5 A'],
      exp:'並列では各枝の電圧が12V。枝1：I₁=12÷6=2A、枝2：I₂=12÷12=1A。全体：2+1=3A。' },
    { jp:'並列回路では各抵抗にかかる電圧はどうなるか（電源電圧をVとする）。',
      answer:'全部 V に等しい', choices:['全部 V に等しい','それぞれ異なる','それぞれ V/抵抗の数になる','合計が V'],
      exp:'並列では各枝の電圧 = 電源電圧 V（全部等しい）。これが並列の最大の特徴。家庭のコンセントが100Vなのも同じ理由。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_elec_s2_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

// ===== SECTION 3: 電力・電熱・磁界 =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">磁界って電磁石とか？コイルに電流流すと磁石になるやつ？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。電流が磁界を作り、磁界が電流に力を与え、動く磁界が電流を生む——電気と磁気は切り離せない。モーターも発電機もこの関係から生まれている。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">電気が磁石を作って、磁石が電気を作る！！循環してる！！なんかすごい！！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 電力・電力量・発熱量</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">電力（W：ワット）</div>'
    + '<div class="ex" style="font-size:20px;text-align:center;margin:6px 0">W ＝ V × I</div>'
    + '<div class="ex">電力(W) ＝ 電圧(V) × 電流(A)</div>'
    + '<div class="ex">例：100V × 0.5A = 50W</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">電力量・発熱量</div>'
    + '<div class="ex">電力量(Wh) ＝ 電力(W) × 時間(h)</div>'
    + '<div class="ex">発熱量(J)   ＝ 電力(W) × 時間(s)</div>'
    + '<div class="ex">　　　　　　＝ V × I × t　（ジュール熱）</div>'
    + '<div class="note">💡 1W × 1s = 1J（ジュール）。電力が同じでも時間が長いほど発熱量が増える</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 磁界・電磁力・電磁誘導</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">電流が作る磁界（右ねじの法則）</div>'
    + '<div class="ex">直線電流：電流の周りに同心円状の磁界ができる</div>'
    + '<div class="ex">コイル：中心に棒磁石と同じ磁界ができる（電磁石）</div>'
    + '<div class="note">💡 右手でコイルを握り、4本指が電流の向き → 親指がN極の向き</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">フレミングの左手の法則（電磁力：モーターの原理）</div>'
    + '<div class="ex">左手の3本指を直角に広げる：</div>'
    + '<div class="ex">中指 → 電流の向き　人差し指 → 磁界の向き　親指 → 力の向き</div>'
    + '<div class="note">💡 電流（中）＋磁界（人）→ 力（親）。「電磁力」＝「電流が磁界から受ける力」</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">電磁誘導（発電機の原理）</div>'
    + '<div class="ex">コイルの中の磁界が変化する → 誘導電流が発生</div>'
    + '<div class="ex">磁石を速く動かす / 強い磁石 / コイルの巻数を多く → 誘導電流が大きくなる</div>'
    + '<div class="note">💡 電磁誘導で生じる電流 = 誘導電流。発電機・マイクはこの原理を使う</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { jp:'電力の単位はどれか。',
      answer:'W（ワット）', choices:['W（ワット）','J（ジュール）','Wh（ワット時）','V（ボルト）'],
      exp:'電力の単位はW（ワット）。電力 = 電圧(V) × 電流(A)。1秒間に消費するエネルギーの量。' },
    { jp:'電圧100V、電流2Aの電気器具の電力は何Wか。',
      answer:'200 W', choices:['200 W','50 W','2000 W','98 W'],
      exp:'電力 W = V × I = 100 × 2 = 200W。電力が大きいほど明るい・熱い（エネルギーを多く消費する）。' },
    { jp:'500Wの電気器具を3時間使ったときの電力量は何Whか。',
      answer:'1500 Wh', choices:['1500 Wh','166.7 Wh','500 Wh','1.5 Wh'],
      exp:'電力量 = 電力 × 時間 = 500W × 3h = 1500Wh。電気料金の計算に使われる（kWhに変換することが多い）。' },
    { jp:'発熱量（ジュール熱）の計算式として正しいのはどれか。',
      answer:'Q = V × I × t', choices:['Q = V × I × t','Q = V + I + t','Q = V ÷ I × t','Q = I² × R + t'],
      exp:'発熱量 Q（J）= 電力（W）× 時間（s）= V×I×t。電熱線や電気ストーブはジュール熱を利用している。' },
    { jp:'コイルに電流を流したとき、できる磁界について正しいのはどれか。',
      answer:'棒磁石と同じような磁界ができる',
      choices:['棒磁石と同じような磁界ができる','磁界はできない','螺旋状に外に広がる磁界ができる','電流と直角方向のみに磁界ができる'],
      exp:'コイルに電流を流すと、コイルの中心を通る棒磁石と同じ磁界ができる（電磁石）。右手でコイルを握り親指がN極。' },
    { jp:'磁界の中に電流を流すと電流が力を受ける。この力の向きを覚える法則は何か。',
      answer:'フレミングの左手の法則', choices:['フレミングの左手の法則','フレミングの右手の法則','オームの法則','アルキメデスの法則'],
      exp:'フレミングの左手：中指=電流、人差し指=磁界、親指=力（電磁力）。モーターの回転方向を求めるのに使う。' },
    { jp:'コイルの中で磁石を動かすと電流が発生する。この現象を何というか。',
      answer:'電磁誘導', choices:['電磁誘導','電磁力','電流分解','誘導電圧'],
      exp:'電磁誘導：磁界の変化によってコイルに電流（誘導電流）が生じる現象。発電機・マイク・IH調理器の原理。' },
    { jp:'電磁誘導で発生する誘導電流を大きくする方法として正しいのはどれか。',
      answer:'磁石を速く動かす・強い磁石を使う・コイルの巻数を増やす',
      choices:[
        '磁石を速く動かす・強い磁石を使う・コイルの巻数を増やす',
        '磁石をゆっくり動かす・弱い磁石を使う',
        '電圧を上げる・電流を増やす',
        '抵抗を大きくする'
      ],
      exp:'誘導電流を大きくする3方法：①磁石を速く動かす ②強い磁石を使う ③コイルの巻数を多くする。磁界変化が大きいほど大きな誘導電流が生じる。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_elec_s3_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4() {
  var html = '<div style="background:#1a2236;border:1px solid #334155;border-radius:12px;padding:20px 24px;margin-bottom:24px">'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:8px">📋 確認テスト</div>'
    + '<div style="font-size:16px;color:var(--text);line-height:1.8">電流・電圧・抵抗・回路・電力・磁界の重要事項を確認しよう。<br>'
    + '語句記入問題（10問）＋選択問題（10問）の計20問。</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 12px;letter-spacing:.08em">▍語句記入問題</div>';

  var inputQs = [
    { qid:'sci_elec_s4_in0', jp:'電流の大きさを表す単位は何か。', answer:'A（アンペア）',
      exp:'電流の単位はA（アンペア）。1A = 1000mA。電流計は回路に直列につなぐ。' },
    { qid:'sci_elec_s4_in1', jp:'電圧の大きさを表す単位は何か。', answer:'V（ボルト）',
      exp:'電圧の単位はV（ボルト）。電圧計は測定する素子に並列につなぐ。' },
    { qid:'sci_elec_s4_in2', jp:'抵抗の大きさを表す単位は何か。', answer:'Ω（オーム）',
      exp:'抵抗の単位はΩ（オーム）。電流の流れにくさを表す。オームの法則 V=IR のR。' },
    { qid:'sci_elec_s4_in3', jp:'電圧・電流・抵抗の関係を表す法則を何というか。', answer:'オームの法則',
      exp:'オームの法則：V = I × R。ドイツの物理学者ゲオルク・オームが発見。電気回路計算の基本。' },
    { qid:'sci_elec_s4_in4', jp:'抵抗20Ω、電圧10Vのとき、電流は何Aか。', answer:'0.5 A',
      exp:'I = V÷R = 10÷20 = 0.5A。三角形で「I を隠す」と V÷R が残る。' },
    { qid:'sci_elec_s4_in5', jp:'直列回路では、回路のどこでも何が同じか。', answer:'電流',
      exp:'直列は1本道。電流はどこでも同じ。電圧は各抵抗に分かれてかかる（分圧）。' },
    { qid:'sci_elec_s4_in6', jp:'並列回路では、各枝に同じ大きさの何がかかるか。', answer:'電圧',
      exp:'並列では各枝の電圧 = 電源電圧（全部等しい）。電流は各枝に分かれる。' },
    { qid:'sci_elec_s4_in7', jp:'電力の公式（単位W）を式で表せ。', answer:'W = V × I',
      exp:'電力(W) = 電圧(V) × 電流(A)。1Wは1秒間に1Jのエネルギーを消費する電力。' },
    { qid:'sci_elec_s4_in8', jp:'コイルの中で磁石を動かすと電流が発生する現象を何というか。', answer:'電磁誘導',
      exp:'電磁誘導：磁界の変化でコイルに誘導電流が生じる。発電機・マイク・IHの原理。フレミング右手の法則。' },
    { qid:'sci_elec_s4_in9', jp:'電流が磁界から受ける力の向きを求める法則を何というか。', answer:'フレミングの左手の法則',
      exp:'フレミングの左手の法則：中指=電流、人差し指=磁界、親指=力（電磁力）。モーターの原理。' },
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
    { jp:'抵抗50Ω、電圧5Vのとき電流は何Aか。',
      answer:'0.1 A', choices:['0.1 A','250 A','10 A','0.01 A'],
      exp:'I = V÷R = 5÷50 = 0.1A。オームの法則 I = V/R。三角形で「I を隠す」と V÷R。' },
    { jp:'10Ωと15Ωを直列につないだとき合成抵抗は何Ωか。',
      answer:'25 Ω', choices:['25 Ω','6 Ω','150 Ω','12.5 Ω'],
      exp:'直列の合成抵抗 = 10+15 = 25Ω。直列はただ足すだけ！' },
    { jp:'4Ωと12Ωを並列につないだとき合成抵抗は何Ωか。',
      answer:'3 Ω', choices:['3 Ω','16 Ω','8 Ω','6 Ω'],
      exp:'並列：1/R = 1/4+1/12 = 3/12+1/12 = 4/12 = 1/3 → R = 3Ω。並列は各抵抗より必ず小さくなる。' },
    { jp:'電圧100V、電流3Aの電気器具の電力は何Wか。',
      answer:'300 W', choices:['300 W','33.3 W','97 W','103 W'],
      exp:'電力 = V × I = 100 × 3 = 300W。電力が大きいほど電気をたくさん消費する。' },
    { jp:'並列回路では一方の枝が断線したとき、もう一方の枝はどうなるか。',
      answer:'影響を受けず電流が流れる', choices:['影響を受けず電流が流れる','同時に断線する','電流が2倍になる','電圧が上がる'],
      exp:'並列回路では各枝が独立しているため、一方が断線しても他の枝には影響しない。家庭の電気が並列な理由。' },
    { jp:'電磁誘導について正しいのはどれか。',
      answer:'磁界が変化するとコイルに電流が生じる',
      choices:['磁界が変化するとコイルに電流が生じる','電流が変化すると磁界がなくなる','静止した磁石でも誘導電流が流れる','コイルの巻数は関係ない'],
      exp:'電磁誘導：磁界の変化（磁石を動かす）でコイルに誘導電流が発生する。磁石が静止していると誘導電流は流れない。' },
    { jp:'フレミングの左手の法則で「親指」が表すのは何か。',
      answer:'電磁力（力）の向き', choices:['電磁力（力）の向き','電流の向き','磁界の向き','電圧の向き'],
      exp:'フレミングの左手：中指=電流、人差し指=磁界の向き（N→S）、親指=電磁力（力）の向き。モーターの回転方向。' },
    { jp:'200Wの電熱線を5分間使ったときの発熱量は何Jか。',
      answer:'60000 J', choices:['60000 J','1000 J','200 J','600 J'],
      exp:'発熱量 Q = W×t = 200W × (5×60)s = 200×300 = 60000J。時間は必ず「秒（s）」に換算すること！' },
    { jp:'電流計を回路に接続する方法として正しいのはどれか。',
      answer:'測定する部分に直列に接続する', choices:['測定する部分に直列に接続する','測定する部分に並列に接続する','電源に直接つなぐ','どちらにつないでもよい'],
      exp:'電流計は直列接続（1本道に入れる）。並列にすると短絡（ショート）して大電流が流れ壊れる。電圧計は並列接続。' },
    { jp:'100Vの電源に消費電力1200Wのドライヤーをつないだとき流れる電流は何Aか。',
      answer:'12 A', choices:['12 A','0.083 A','1300 A','120000 A'],
      exp:'W = V×I より I = W÷V = 1200÷100 = 12A。オームの法則と電力の公式を組み合わせる問題。' },
  ];

  choiceQs.forEach(function(q, i) { q._qid = 'sci_elec_s4_ch' + i; });
  choiceQs = shuffleArray(choiceQs);
  choiceQs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

// ===== SECTION 5: 3年予習 =====
function renderSection5() {
  return '<div style="background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.2);border-radius:12px;padding:24px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--teal);font-weight:bold;margin-bottom:12px">🔗 中2電流→中3「運動とエネルギー」への接続</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '電力(W) → <span style="color:var(--gold)">仕事率(W)（中3）：仕事÷時間 = W</span><br>'
    + '電力量(Wh・J) → <span style="color:var(--gold)">力学的エネルギー・熱エネルギー（中3）</span><br>'
    + 'ジュール熱 → <span style="color:var(--gold)">エネルギーの変換と保存（中3）</span><br>'
    + '電磁誘導（発電）→ <span style="color:var(--gold)">発電・エネルギー変換効率（中3）</span><br>'
    + '電磁力（モーター）→ <span style="color:var(--gold)">力のはたらき・エネルギー（中3）</span>'
    + '</div></div>'
    + '<div style="background:rgba(245,197,24,0.06);border:1px solid rgba(245,197,24,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px">⚡ 中3でよく出る計算（先取り）</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '仕事(J) = 力(N) × 距離(m)<br>'
    + '仕事率(W) = 仕事(J) ÷ 時間(s)<br>'
    + '位置エネルギー = mgh（質量×重力加速度×高さ）<br>'
    + '力学的エネルギー保存：位置エネルギー + 運動エネルギー = 一定'
    + '</div></div>';
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var prefix = 'sci_elec_s4_';
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
  currentSection = 6; renderTabs();
  var mc = document.getElementById('mainContent');
  var wqs = getWeakQuestions();
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('sci_elec_') === 0; });
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
    var d = weakDB[qid]; var pct = getPct(qid);
    var barColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
    html += '<div style="background:var(--bg2);border:1px solid ' + barColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(14,165,233,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text);margin-bottom:2px;line-height:1.6">' + (d.jp||'') + '</div><div style="font-size:13px;color:' + barColor + '">' + (d.answer||'') + '</div></div>'
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
var tokkuSession = { correct:0, total:0 };
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
  currentSection = 7; renderTabs();
  var wqs = getWeakQuestions();
  var mc  = document.getElementById('mainContent');
  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div class="tokku-complete-msg">すべての問題で正答率80%以上！<br>きょん「俺、めちゃくちゃ強くなってるじゃん！！」<br>西村「本当に成長したね」</div><button onclick="goSection(1)" style="margin-top:24px;background:var(--teal);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button></div>';
    return;
  }
  tokkuQueue = wqs.slice(0,15); tokkuIndex = 0; tokkuSession = { correct:0, total:0 };
  renderTokkuCard();
}
function renderTokkuCard() {
  var mc = document.getElementById('mainContent');
  if (tokkuIndex >= tokkuQueue.length) { showTokkuComplete(); return; }
  var qid = tokkuQueue[tokkuIndex]; var d = weakDB[qid];
  if (!d) { tokkuIndex++; renderTokkuCard(); return; }
  var pct = getPct(qid); var color = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
  var choicesHtml = '';
  if (d.choices && d.choices.length > 0) {
    choicesHtml = '<div class="tokku-choices" id="tokku_choices">'
      + d.choices.slice().sort(function(){ return Math.random()-0.5; }).map(function(c){
          return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c + '">' + c + '</button>';
        }).join('')
      + '</div>';
  }
  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
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
  var d = weakDB[qid]; if (!d) return;
  var correct = choice === d.answer;
  tokkuSession.total++; weakDB[qid].total++;
  if (correct) { weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('sci_weakdb', JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();
  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b) { b.disabled = true; });
  var chosen = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + choice + '"]');
  if (chosen) chosen.classList.add(correct ? 'selected-correct' : 'selected-wrong');
  if (!correct) { var ok = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + d.answer + '"]'); if (ok) ok.classList.add('show-correct'); }
  var newPct = getPct(qid);
  var res = document.getElementById('tokku_result');
  if (res) {
    if (correct) {
      xp++; localStorage.setItem('sci_xp', xp); updateXP();
      res.className = 'tokku-result tokku-correct';
      res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 正答率'+newPct+'%！この問題は卒業！' : ' 正答率 → '+newPct+'%');
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