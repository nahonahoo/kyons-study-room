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
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
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
  xp = Math.max(0, xp - pts);

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
    + '<div class="exp-card" id="exp_card_' + qid + '" style="' + shown + '">'
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