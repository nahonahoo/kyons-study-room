// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「イオン？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺イオンできるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「イオンで漫才できるかもしれない」' },
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
var answeredSet = JSON.parse(localStorage.getItem('sci_ion_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('sci_ion_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('sci_weakdb')       || '{}');
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
  localStorage.setItem('sci_xp',          xp);
  localStorage.setItem('sci_ion_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('sci_ion_') === 0 && getPct(id) < 80;
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
  localStorage.setItem('sci_daily',          JSON.stringify(_daily));
  localStorage.setItem('sci_ion_lastStudy',  _today);
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
    'きょん「合ってる！イオンできるじゃん！！」',
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
    + '<div class="exp-card" id="exp_card_' + qid + '" style="' + (answeredSet[qid] ? '' : 'display:none') + '">'
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
  var _ec = document.getElementById('exp_card_' + qid); if (_ec) _ec.style.display = 'block';
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
  var _ec = document.getElementById('exp_card_' + qid); if (_ec) _ec.style.display = 'block';
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
  deductXP(5);
  var wrongMsgs = [
    'きょん「あれ！間違えた！でも次は大丈夫！！」',
    'きょん「また間違えた…！まだまだ大丈夫！！」',
    'きょん「何回間違えてんの！！にっくんに怒られる！！」',
    'きょん「もうやだ！！でも諦めないぞ！！答えを見ちゃおうかな…」',
  ];
  var msg = wrongMsgs[Math.min(wrongMsgs.length - 1, attemptCounts[qid] - 1)];
  setTimeout(function() { showToast(msg); }, 100);
}
function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  localStorage.setItem('sci_ion_answered', JSON.stringify(answeredSet));
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
  var prefix = 'sci_ion_s' + currentSection + '_';
  var sectionQ = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sectionQ.length === 0) return;
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done) {
    sectionDone[currentSection] = true;
    localStorage.setItem('sci_ion_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb) {
      nb.style.display = 'block';
      if (!document.getElementById('sectionCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'sectionCompleteBanner';
        var nextSec = currentSection === 4 ? '「イオンの数・実験」へ進もう！' : (currentSection < 4 ? 'Section ' + (currentSection + 1) + ' へ進もう！' : '確認テストで腕試し！');
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
  { id:0, label:'⚗️ スタート',   title:'化学変化とイオン',              sub:'中2化学の続き。原子が電気を帯びると「イオン」になる！' },
  { id:1, label:'イオン基礎',    title:'水溶液とイオン・電離',           sub:'電解質・非電解質・電離式——イオンの正体を理解しよう' },
  { id:2, label:'電池',          title:'化学変化と電池',                 sub:'ダニエル電池・イオン化傾向——化学反応で電気を作る仕組み' },
  { id:3, label:'酸・アルカリ',  title:'酸・アルカリとイオン',           sub:'H⁺とOH⁻——酸とアルカリの正体はイオンだった！' },
  { id:4, label:'中和',          title:'中和反応と塩',                   sub:'酸＋アルカリ→塩＋水——打ち消し合いの化学！' },
  { id:8, label:'🧪イオンの数・実験', title:'イオンの数の変化・金属と電池の実験', sub:'中和のイオンのグラフ・Mg＞Zn＞Cu・ダニエル電池・燃料電池（入試頻出）' },
  { id:5, label:'確認テスト',    title:'確認テスト',                     sub:'全単元の総まとめ！愛知県形式20問' },
  { id:6, label:'📊弱点',        title:'弱点ノート',                     sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',        title:'弱点特訓モード',                 sub:'間違えた問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab';
    if (s.id === 6 || s.id === 7) cls += ' tokku';
    if (s.id === currentSection) cls += ' active';
    var normal = s.id !== 6 && s.id !== 7;
    if (sectionDone[s.id] && normal) cls += ' done';
    var label = s.label + (sectionDone[s.id] && normal ? ' ✓' : '');
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

  var s = SECTIONS.filter(function(x) { return x.id === id; })[0];
  var html = '';
  html += '<div class="progress-dots">';
  for (var i = 0; i <= 5; i++) {
    var dc = 'dot' + (i < id ? ' done' : i === id ? ' current' : '');
    html += '<div class="' + dc + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">理科 中3化学 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">'   + s.sub   + '</div>'
    + '</div>';

  if      (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();
  else if (id === 8) html += renderSection8();
  else if (id === 5) html += renderSection5();

  if ((id >= 1 && id <= 5) || id === 8) {
    var NEXT = { 1:2, 2:3, 3:4, 4:8, 8:5 };
    var nextLabel  = id !== 5 ? '次のセクションへ →' : '🏆 結果を見る！';
    var nextAction = id !== 5 ? 'goSection(' + NEXT[id] + ')' : 'showFinalResult()';
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
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">イオンって何？なんか理科でよく聞くけど全然わかんない！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">イオンとは「電気を帯びた原子や分子」のことだ。中2で習った原子・分子が、電子を失ったり得たりすると電気を帯びる——それがイオン。NaCl（塩化ナトリウム）が水に溶けると Na⁺ と Cl⁻ に分かれる、あれがイオンだ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">Na⁺ って「プラス持ちの Na」ってことか！あのスーパーじゃなくて！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">……そうだ。この単元は中2の原子・分子・化学式が土台になる。まず「電離」「電解質・非電解質」からマスターしよう。</div></div></div>'
    + '</div>'
    + '<button class="start-btn" onclick="goSection(1)">⚡ イオン基礎から始める →</button>';
}

// ===== SECTION 1: 水溶液とイオン・電離 =====
function renderSection1() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">電解質と非電解質って何が違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">水に溶けたときにイオンに分かれる物質が電解質。NaCl・HCl・NaOH などがそれ。イオンに分かれない物質（砂糖・エタノール）が非電解質。電解質の水溶液は電気を通す——イオンが電気を運ぶキャリアになるんだ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">砂糖水は電気通らないのか！！じゃあ塩水は通るのか！！めちゃくちゃ面白い！！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 イオンの基礎</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">イオンとは</div>'
    + '<div class="ex">原子が電子を失う→陽イオン（＋）例：Na⁺・H⁺・Ca²⁺</div>'
    + '<div class="ex">原子が電子を得る→陰イオン（−）例：Cl⁻・OH⁻・SO₄²⁻</div>'
    + '<div class="note">💡 陽イオン＝電子を失った（プラス）、陰イオン＝電子を得た（マイナス）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">電解質 vs 非電解質</div>'
    + '<div class="ex">電解質：水に溶けてイオンに分かれる物質（NaCl・HCl・NaOH・H₂SO₄）</div>'
    + '<div class="ex">非電解質：水に溶けてもイオンに分かれない物質（砂糖・エタノール）</div>'
    + '<div class="note">⚡ 電解質の水溶液 → 電気を通す！　非電解質の水溶液 → 電気を通さない</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 電離式（超頻出！）</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">主な電離式</div>'
    + '<div class="ex">塩化ナトリウム：NaCl → Na⁺ + Cl⁻</div>'
    + '<div class="ex">塩化水素（塩酸）：HCl → H⁺ + Cl⁻</div>'
    + '<div class="ex">水酸化ナトリウム：NaOH → Na⁺ + OH⁻</div>'
    + '<div class="ex">塩化銅：CuCl₂ → Cu²⁺ + 2Cl⁻</div>'
    + '<div class="note">💡 係数（数字）で電荷のバランスを合わせる。CuCl₂ → Cu²⁺（+2）と Cl⁻×2（-2）で釣り合う</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">⚡ イオンの移動ビジュアル（塩化銅の電気分解）</div>'
    + '<svg viewBox="0 0 370 130" width="100%" style="display:block;margin:0 auto;max-width:480px">'
    + '<rect x="80" y="25" width="210" height="90" rx="4" fill="none" stroke="#334155" stroke-width="2"/>'
    + '<rect x="81" y="65" width="208" height="49" fill="rgba(14,165,233,0.12)"/>'
    + '<text x="185" y="90" text-anchor="middle" font-size="10" fill="#60a5fa" font-family="Arial,sans-serif">CuCl₂水溶液</text>'
    + '<text x="185" y="105" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="Arial,sans-serif">Cu²⁺（水色）　Cl⁻（緑）</text>'
    + '<rect x="110" y="15" width="8" height="80" rx="3" fill="#475569"/>'
    + '<text x="114" y="11" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">陰極（−）</text>'
    + '<rect x="252" y="15" width="8" height="80" rx="3" fill="#475569"/>'
    + '<text x="256" y="11" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">陽極（+）</text>'
    + '<circle cx="155" cy="75" r="8" fill="#38bdf8" opacity="0.8"/>'
    + '<text x="155" y="79" text-anchor="middle" font-size="7" font-weight="bold" fill="white" font-family="Arial,sans-serif">Cu²⁺</text>'
    + '<text x="133" y="60" text-anchor="middle" font-size="8" fill="#38bdf8" font-family="Arial,sans-serif">← 陰極へ</text>'
    + '<circle cx="220" cy="78" r="8" fill="#4ade80" opacity="0.8"/>'
    + '<text x="220" y="82" text-anchor="middle" font-size="7" font-weight="bold" fill="white" font-family="Arial,sans-serif">Cl⁻</text>'
    + '<text x="242" y="63" text-anchor="middle" font-size="8" fill="#4ade80" font-family="Arial,sans-serif">陽極へ →</text>'
    + '<text x="114" y="122" text-anchor="middle" font-size="9" fill="#f97316" font-family="Arial,sans-serif">Cu析出</text>'
    + '<text x="256" y="122" text-anchor="middle" font-size="9" fill="#a3e635" font-family="Arial,sans-serif">Cl₂発生</text>'
    + '</svg>'
    + '<div style="font-size:11px;color:var(--text2);margin-top:8px;text-align:center">陽イオン（Cu²⁺）は陰極へ、陰イオン（Cl⁻）は陽極へ引き寄せられる</div>'
    + '</div>';

  var qs = [
    { jp:'原子が電子を失って電気を帯びたものを何というか。',
      answer:'陽イオン', choices:['陽イオン','陰イオン','中性原子','分子'],
      exp:'陽イオン：電子を失ってプラスの電気を帯びた粒子。Na→Na⁺（電子1個を失う）。「失った＝プラス」と覚えよう。' },
    { jp:'水に溶けて電気を通す物質を何というか。',
      answer:'電解質', choices:['電解質','非電解質','単体','化合物'],
      exp:'電解質：水に溶けるとイオンに分かれ（電離し）、電気を通す物質。NaCl・HCl・NaOH・H₂SO₄など。' },
    { jp:'砂糖水は電気を通すか。',
      answer:'通さない（非電解質）', choices:['通さない（非電解質）','通す（電解質）','温度によって変わる','量によって変わる'],
      exp:'砂糖（ショ糖）は水に溶けてもイオンに分かれない非電解質。よって電気を通さない。塩水（NaCl水溶液）は通す。' },
    { jp:'NaCl が水に溶けたときの電離式はどれか。',
      answer:'NaCl → Na⁺ + Cl⁻', choices:['NaCl → Na⁺ + Cl⁻','NaCl → Na⁻ + Cl⁺','NaCl → Na + Cl','NaCl → Na₂⁺ + Cl₂⁻'],
      exp:'NaCl（塩化ナトリウム）の電離：NaCl → Na⁺（ナトリウムイオン）+ Cl⁻（塩化物イオン）。Na は電子1個を失い＋に、Cl は電子1個を得て−になる。' },
    { jp:'HCl（塩化水素）の電離式で正しいのはどれか。',
      answer:'HCl → H⁺ + Cl⁻', choices:['HCl → H⁺ + Cl⁻','HCl → H⁻ + Cl⁺','HCl → H₂⁺ + Cl₂⁻','HCl → H + Cl'],
      exp:'HCl → H⁺（水素イオン）+ Cl⁻（塩化物イオン）。酸性の正体は H⁺ だ。塩酸 = HCl の水溶液。' },
    { jp:'塩化銅（CuCl₂）の電気分解で陰極に析出するものはどれか。',
      answer:'銅（Cu）', choices:['銅（Cu）','塩素（Cl₂）','水素（H₂）','酸素（O₂）'],
      exp:'CuCl₂ → Cu²⁺ + 2Cl⁻。Cu²⁺（陽イオン）が陰極に引き寄せられ、電子を受け取って Cu として析出。Cl⁻ は陽極で Cl₂ になる。' },
    { jp:'次のうち陰イオンはどれか。',
      answer:'Cl⁻（塩化物イオン）', choices:['Cl⁻（塩化物イオン）','Na⁺（ナトリウムイオン）','H⁺（水素イオン）','Ca²⁺（カルシウムイオン）'],
      exp:'陰イオン（マイナスの電荷）：Cl⁻・OH⁻・SO₄²⁻など。電子を得てマイナスになったもの。陽イオン（プラス）は Na⁺・H⁺・Ca²⁺など。' },
    { jp:'NaOH（水酸化ナトリウム）の電離で生成されるイオンはどれか。',
      answer:'Na⁺ と OH⁻', choices:['Na⁺ と OH⁻','Na⁻ と OH⁺','Na⁺ と O²⁻','NaO⁺ と H⁻'],
      exp:'NaOH → Na⁺ + OH⁻。OH⁻ はアルカリ性の正体となる水酸化物イオン。NaOH は強アルカリの電解質。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_ion_s1_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 2: 化学変化と電池 =====
function renderSection2() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔋 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">電池ってどうして電気が出るの？なんか不思議！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">化学変化で電子の移動が起き、その流れが電流になる。亜鉛（Zn）と銅（Cu）を電解質溶液に入れると、溶けやすい Zn が電子を出す——その電子が Cu 側に流れて電流になる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">亜鉛が「俺が払う！」って電子を出すのか！太っ腹すぎる！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">……なかなかいい例えだ。金属のイオン化傾向——溶けやすい順を覚えると電池の仕組みが全部わかる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 イオン化傾向と電池の仕組み</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">イオン化傾向（溶けやすい順）</div>'
    + '<div class="ex">中学で比べるのはこの3つ：<b>マグネシウム（Mg）＞ 亜鉛（Zn）＞ 銅（Cu）</b></div>'
    + '<div class="ex">覚え方：「マグ・アエン・ドウ」＝ M・A・D の順（アルファベット順と同じ）</div>'
    + '<div class="note">💡 イオンになりやすい金属ほど電子を出しやすく、電池の<b>−極</b>になる。（「イオン化傾向」は高校で習う言い方。教科書では「イオンへのなりやすさ」）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">ダニエル電池の仕組み</div>'
    + '<div class="ex">Zn板（亜鉛・硫酸亜鉛水溶液）と Cu板（銅・硫酸銅水溶液）を組み合わせた電池</div>'
    + '<div class="ex">−極：Zn → Zn²⁺ + ⊖⊖（電子2個）　（亜鉛がとけて電子を出す）</div>'
    + '<div class="ex">＋極：Cu²⁺ + ⊖⊖（電子2個）→ Cu　（銅が出てくる）</div>'
    + '<div class="note">⚡ イオン化傾向が大きい Zn が−極、小さい Cu が+極になる</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔋 ダニエル電池回路図</div>'
    + '<svg viewBox="0 0 370 135" width="100%" style="display:block;margin:0 auto;max-width:480px">'
    + '<rect x="20" y="30" width="130" height="90" rx="6" fill="rgba(14,165,233,0.08)" stroke="#334155" stroke-width="1.5"/>'
    + '<text x="85" y="55" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="Arial,sans-serif">ZnSO₄水溶液</text>'
    + '<rect x="38" y="20" width="10" height="80" rx="3" fill="#6b7280"/>'
    + '<text x="43" y="16" text-anchor="middle" font-size="9" fill="#fcd34d" font-family="Arial,sans-serif">Zn（−）</text>'
    + '<text x="85" y="75" text-anchor="middle" font-size="10" fill="#38bdf8" font-family="Arial,sans-serif">Zn→Zn²⁺+⊖⊖</text>'
    + '<text x="85" y="108" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">亜鉛が溶ける</text>'
    + '<rect x="220" y="30" width="130" height="90" rx="6" fill="rgba(249,115,22,0.08)" stroke="#334155" stroke-width="1.5"/>'
    + '<text x="285" y="55" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="Arial,sans-serif">CuSO₄水溶液</text>'
    + '<rect x="322" y="20" width="10" height="80" rx="3" fill="#b45309"/>'
    + '<text x="327" y="16" text-anchor="middle" font-size="9" fill="#fb923c" font-family="Arial,sans-serif">Cu（+）</text>'
    + '<text x="285" y="75" text-anchor="middle" font-size="10" fill="#f97316" font-family="Arial,sans-serif">Cu²⁺+⊖⊖→Cu</text>'
    + '<text x="285" y="108" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">銅が析出</text>'
    + '<rect x="149" y="50" width="72" height="22" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1"/>'
    + '<text x="185" y="65" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">素焼き板（隔壁）</text>'
    + '<line x1="48" y1="20" x2="48" y2="10" stroke="#ef4444" stroke-width="2"/>'
    + '<line x1="48" y1="10" x2="322" y2="10" stroke="#ef4444" stroke-width="2"/>'
    + '<line x1="322" y1="10" x2="322" y2="20" stroke="#ef4444" stroke-width="2"/>'
    + '<text x="185" y="8" text-anchor="middle" font-size="8" fill="#ef4444" font-family="Arial,sans-serif">電子の流れ（e⁻）→</text>'
    + '</svg>'
    + '</div>';

  var qs = [
    { jp:'イオン化傾向とは何か。',
      answer:'金属が水溶液中でイオンになりやすい順番', choices:['金属が水溶液中でイオンになりやすい順番','金属の硬さの順番','金属の融点の高さの順番','電気伝導率の順番'],
      exp:'イオン化傾向（イオンへのなりやすさ）：金属が電子を失って陽イオンになりやすいかどうか。中学では マグネシウム ＞ 亜鉛 ＞ 銅 の順を実験で確かめる。' },
    { jp:'ダニエル電池の負極（−極）の金属はどれか。',
      answer:'亜鉛（Zn）', choices:['亜鉛（Zn）','銅（Cu）','鉄（Fe）','アルミニウム（Al）'],
      exp:'ダニエル電池：Zn（イオン化傾向大）が−極、Cu（イオン化傾向小）が+極。−極の Zn が Zn²⁺ になって溶け、電子を出す。' },
    { jp:'ダニエル電池の正極（+極）では何が起きるか。',
      answer:'Cu²⁺ が電子を受け取り Cu が析出する', choices:['Cu²⁺ が電子を受け取り Cu が析出する','Zn が溶け出す','H₂ が発生する','O₂ が発生する'],
      exp:'＋極：Cu²⁺ ＋ 電子2個 → Cu。銅イオンが電子を受け取り、銅板の表面に銅が出てくる（くっつく）。' },
    { jp:'Zn と Cu では、どちらのイオン化傾向が大きいか。',
      answer:'Zn（亜鉛）', choices:['Zn（亜鉛）','Cu（銅）','同じ','その時の温度による'],
      exp:'イオン化傾向：Zn > Cu。亜鉛の方が電子を出しやすく、陽イオンになりやすい。だから Zn が−極（電子を出す側）になる。' },
    { jp:'電池の仕組みとして正しいのはどれか。',
      answer:'化学エネルギーを電気エネルギーに変換する', choices:['化学エネルギーを電気エネルギーに変換する','電気エネルギーを化学エネルギーに変換する','熱エネルギーを電気エネルギーに変換する','電気エネルギーを熱エネルギーに変換する'],
      exp:'電池：化学変化（イオン化）で生じる電子の移動を電流として取り出す装置。化学エネルギー→電気エネルギー。逆は電気分解。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_ion_s2_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 3: 酸・アルカリとイオン =====
function renderSection3() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔬 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">酸っていうと食べ物の酸っぱさのイメージだけど…理科の酸は違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">本質は同じだ。酸性の正体は H⁺（水素イオン）。レモンが酸っぱいのは H⁺ が多いから。アルカリ性の正体は OH⁻（水酸化物イオン）。せっけんがぬるぬるするのはアルカリ性だからだ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">じゃあ H⁺ が多いと酸っぱい！ OH⁻ が多いとぬるぬる！！わかった！！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 酸とアルカリの正体</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">酸（さん）</div>'
    + '<div class="ex">水溶液中で H⁺（水素イオン）を生じる物質</div>'
    + '<div class="ex">例：塩酸 HCl → H⁺ + Cl⁻（強酸）</div>'
    + '<div class="ex">例：硫酸 H₂SO₄ → 2H⁺ + SO₄²⁻（強酸）</div>'
    + '<div class="ex">性質：青色リトマス紙を赤に変える・BTB溶液が黄色・pH 7未満</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">アルカリ</div>'
    + '<div class="ex">水溶液中で OH⁻（水酸化物イオン）を生じる物質</div>'
    + '<div class="ex">例：水酸化ナトリウム NaOH → Na⁺ + OH⁻（強アルカリ）</div>'
    + '<div class="ex">例：水酸化バリウム Ba(OH)₂ → Ba²⁺ + 2OH⁻</div>'
    + '<div class="ex">性質：赤色リトマス紙を青に変える・BTB溶液が青色・pH 7超</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 pH スケール（重要！）</div>'
    + '<svg viewBox="0 0 370 70" width="100%" style="display:block;margin:0 auto;max-width:500px">'
    + '<defs><linearGradient id="phGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="50%" stop-color="#22c55e"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs>'
    + '<rect x="10" y="22" width="350" height="20" rx="4" fill="url(#phGrad)"/>'
    + '<text x="10" y="16" text-anchor="middle" font-size="9" fill="#ef4444" font-family="Arial,sans-serif">pH 0</text>'
    + '<text x="185" y="16" text-anchor="middle" font-size="9" fill="#22c55e" font-family="Arial,sans-serif">pH 7（中性）</text>'
    + '<text x="360" y="16" text-anchor="middle" font-size="9" fill="#60a5fa" font-family="Arial,sans-serif">pH 14</text>'
    + '<text x="60" y="55" text-anchor="middle" font-size="9" fill="#fca5a5" font-family="Arial,sans-serif">強い酸性</text>'
    + '<text x="185" y="55" text-anchor="middle" font-size="9" fill="#86efac" font-family="Arial,sans-serif">中性</text>'
    + '<text x="300" y="55" text-anchor="middle" font-size="9" fill="#93c5fd" font-family="Arial,sans-serif">強いアルカリ性</text>'
    + '<line x1="185" y1="20" x2="185" y2="44" stroke="white" stroke-width="1.5" stroke-dasharray="3,2"/>'
    + '</svg>'
    + '<div style="font-size:11px;color:var(--text2);margin-top:8px;text-align:center">pH ＜ 7：酸性（H⁺多い）　pH ＝ 7：中性　pH ＞ 7：アルカリ性（OH⁻多い）</div>'
    + '</div>';

  var qs = [
    { jp:'酸性の水溶液の正体となるイオンはどれか。',
      answer:'H⁺（水素イオン）', choices:['H⁺（水素イオン）','OH⁻（水酸化物イオン）','Na⁺（ナトリウムイオン）','Cl⁻（塩化物イオン）'],
      exp:'酸性の正体 = H⁺（水素イオン）。H⁺ が多いほど酸性が強く pH が小さい。HCl → H⁺ + Cl⁻ の H⁺ が酸性を示す。' },
    { jp:'アルカリ性の水溶液の正体となるイオンはどれか。',
      answer:'OH⁻（水酸化物イオン）', choices:['OH⁻（水酸化物イオン）','H⁺（水素イオン）','Na⁺（ナトリウムイオン）','SO₄²⁻（硫酸イオン）'],
      exp:'アルカリ性の正体 = OH⁻（水酸化物イオン）。OH⁻ が多いほどアルカリ性が強く pH が大きい。' },
    { jp:'pH 7 は何性か。',
      answer:'中性', choices:['中性','酸性','アルカリ性','強酸性'],
      exp:'pH 7 = 中性。H⁺ と OH⁻ の量が等しい。pH < 7 = 酸性（H⁺ が多い）、pH > 7 = アルカリ性（OH⁻ が多い）。' },
    { jp:'BTB溶液を酸性の水溶液に加えると何色になるか。',
      answer:'黄色', choices:['黄色','青色','緑色','赤色'],
      exp:'BTB溶液：酸性→黄色、中性→緑色、アルカリ性→青色。BTB = ブロモチモールブルー。pH 指示薬の一種。' },
    { jp:'塩酸（HCl 水溶液）の電離式はどれか。',
      answer:'HCl → H⁺ + Cl⁻', choices:['HCl → H⁺ + Cl⁻','HCl → H⁻ + Cl⁺','HCl → H₂ + Cl₂','HCl → OH⁻ + Cl'],
      exp:'HCl → H⁺ + Cl⁻。塩酸の酸性は H⁺ に由来する。HCl は強酸なので水溶液中でほぼ完全に電離する。' },
    { jp:'水酸化ナトリウム水溶液に赤色リトマス紙を入れると何色になるか。',
      answer:'青色', choices:['青色','赤色（変化なし）','緑色','黄色'],
      exp:'アルカリ性 → 赤色リトマス紙が青色に変わる。酸性 → 青色リトマス紙が赤色に変わる。「赤→青はアルカリ」で覚えよう。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_ion_s3_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 4: 中和反応と塩 =====
function renderSection4() {
  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚗️ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">中和って酸とアルカリが打ち消し合うってこと？なんか喧嘩してるみたい！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その通りだ。H⁺ と OH⁻ が結びついて水（H₂O）になる——これが中和反応。同時に酸の陰イオンとアルカリの陽イオンが結合して「塩（えん）」ができる。食塩（NaCl）も塩の一種だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">じゃあ塩酸と NaOH を混ぜると食塩ができるのか！！！なにそれすごい！！！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 中和反応のしくみ</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">中和反応</div>'
    + '<div class="ex">酸 + アルカリ → 塩（えん）+ 水</div>'
    + '<div class="ex">H⁺ + OH⁻ → H₂O（水）← この反応が中和の本質！</div>'
    + '<div class="ex">例：HCl + NaOH → NaCl + H₂O</div>'
    + '<div class="ex">例：H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O</div>'
    + '<div class="note">⚡ 中和点：H⁺ と OH⁻ の量がちょうど等しくなる点 → 中性（pH=7）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">塩（えん）とは</div>'
    + '<div class="ex">酸の陰イオン + アルカリの陽イオン が結合したもの</div>'
    + '<div class="ex">NaCl（食塩）= Na⁺ + Cl⁻　← HCl と NaOH の中和</div>'
    + '<div class="ex">Na₂SO₄（硫酸ナトリウム）= H₂SO₄ と NaOH の中和</div>'
    + '<div class="note">💡 「塩（えん）」は「塩（しお）」と読み方が違う！料理の塩は NaCl = 塩化ナトリウム</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📊 中和のグラフ（NaOH を少しずつ加えたとき）</div>'
    + '<svg viewBox="0 0 370 120" width="100%" style="display:block;margin:0 auto;max-width:480px">'
    + '<line x1="40" y1="10" x2="40" y2="100" stroke="#475569" stroke-width="2"/>'
    + '<line x1="40" y1="100" x2="340" y2="100" stroke="#475569" stroke-width="2"/>'
    + '<text x="20" y="14" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">pH</text>'
    + '<text x="20" y="55" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">7</text>'
    + '<text x="185" y="113" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Arial,sans-serif">加えたNaOH量（mL）</text>'
    + '<line x1="37" y1="55" x2="43" y2="55" stroke="#475569" stroke-width="1"/>'
    + '<polyline points="40,90 100,88 160,82 190,55 220,28 270,18 340,16" fill="none" stroke="#f97316" stroke-width="2.5"/>'
    + '<circle cx="190" cy="55" r="5" fill="#fcd34d"/>'
    + '<text x="200" y="51" font-size="8" fill="#fcd34d" font-family="Arial,sans-serif">中和点（pH=7）</text>'
    + '<text x="70" y="80" font-size="8" fill="#fca5a5" font-family="Arial,sans-serif">酸性</text>'
    + '<text x="260" y="25" font-size="8" fill="#93c5fd" font-family="Arial,sans-serif">アルカリ性</text>'
    + '</svg>'
    + '<div style="font-size:11px;color:var(--text2);margin-top:6px;text-align:center">NaOH を加えるほど pH が上昇。中和点でちょうど中性になる。</div>'
    + '</div>';

  var qs = [
    { jp:'酸とアルカリが打ち消し合う反応を何というか。',
      answer:'中和', choices:['中和','電気分解','酸化','電離'],
      exp:'中和：酸の H⁺ とアルカリの OH⁻ が結合して水（H₂O）になる反応。酸とアルカリの性質が互いに打ち消される。' },
    { jp:'中和反応で必ず生じる物質は何か。',
      answer:'水（H₂O）', choices:['水（H₂O）','塩素（Cl₂）','二酸化炭素（CO₂）','水素（H₂）'],
      exp:'中和：H⁺ + OH⁻ → H₂O（水）。水は必ず生成される。同時に塩（えん）も生成されるが、水が中和反応の本質。' },
    { jp:'HCl と NaOH の中和反応でできる塩（えん）はどれか。',
      answer:'NaCl（塩化ナトリウム）', choices:['NaCl（塩化ナトリウム）','Na₂SO₄（硫酸ナトリウム）','CaCl₂（塩化カルシウム）','NaNO₃（硝酸ナトリウム）'],
      exp:'HCl + NaOH → NaCl + H₂O。塩（えん）= Na⁺（NaOH由来）+ Cl⁻（HCl由来）= NaCl（食塩）。' },
    { jp:'中和点での水溶液の性質はどれか。',
      answer:'中性（pH=7）', choices:['中性（pH=7）','酸性（pH<7）','アルカリ性（pH>7）','強酸性（pH=0）'],
      exp:'中和点：H⁺ と OH⁻ がちょうど等量で反応し、互いに打ち消し合った状態。水溶液は中性（pH=7）になる。' },
    { jp:'塩酸に水酸化ナトリウム水溶液を加えていくとBTB溶液の色はどう変化するか。',
      answer:'黄色 → 緑色 → 青色', choices:['黄色 → 緑色 → 青色','青色 → 緑色 → 黄色','赤色 → 黄色 → 青色','変化しない'],
      exp:'BTB：酸性（黄）→ 中性（緑）→ アルカリ性（青）。塩酸は酸性（黄）。NaOH を加えると中和が進み緑→青へ変化。' },
    { jp:'H₂SO₄（硫酸）と NaOH の中和反応の化学式はどれか。',
      answer:'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O', choices:['H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O','H₂SO₄ + NaOH → NaSO₄ + H₂O','H₂SO₄ + 2NaOH → 2NaCl + H₂O','H₂SO₄ + NaOH → Na₂SO₄ + H₂O'],
      exp:'H₂SO₄ は H⁺ を2個出す（2H⁺ + SO₄²⁻）。だから NaOH が2倍量必要。生成物は Na₂SO₄（硫酸ナトリウム）+ 2H₂O。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_ion_s4_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 8: イオンの数の変化・金属のイオンへのなりやすさ・電池の実験（2026-09-29 追加。入試頻出なのに抜けていた内容） =====
function ionCountSVG() {
  // 横軸：加えた水酸化ナトリウム水溶液の量（0〜2、中和点＝1）、縦軸：イオンの数（0〜2）
  function X(v) { return 50 + v * 140; }
  function Y(n) { return 190 - n * 75; }
  var s = '<svg viewBox="0 0 360 240" style="width:100%;max-width:540px;display:block;margin:8px auto" role="img" aria-label="中和とイオンの数の変化">';
  s += '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(2.05) + '" y2="' + Y(0) + '" stroke="#9aa4b2"/><line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(0) + '" y2="' + Y(2.2) + '" stroke="#9aa4b2"/>';
  s += '<line x1="' + X(1) + '" y1="' + Y(0) + '" x2="' + X(1) + '" y2="' + Y(2.2) + '" stroke="#ffd84d" stroke-dasharray="4 4"/><text x="' + X(1) + '" y="' + (Y(2.2) - 4) + '" text-anchor="middle" fill="#ffd84d" font-size="12" font-weight="bold">中和点</text>';
  s += '<polyline points="' + X(0) + ',' + Y(1) + ' ' + X(1) + ',' + Y(0) + ' ' + X(2) + ',' + Y(0) + '" fill="none" stroke="#ff5c5c" stroke-width="3.5"/>';
  s += '<line x1="' + X(0) + '" y1="' + Y(1) + '" x2="' + X(2) + '" y2="' + Y(1) + '" stroke="#3ddc84" stroke-width="3.5" stroke-dasharray="1 0"/>';
  s += '<line x1="' + X(0) + '" y1="' + (Y(0) - 2) + '" x2="' + X(2) + '" y2="' + Y(2) + '" stroke="#4aa8ff" stroke-width="3.5"/>';
  s += '<polyline points="' + X(0) + ',' + (Y(0) + 3) + ' ' + X(1) + ',' + (Y(0) + 3) + ' ' + X(2) + ',' + Y(1) + '" fill="none" stroke="#b69cff" stroke-width="3.5"/>';
  s += '<text x="' + (X(0) + 6) + '" y="' + (Y(1) - 8) + '" fill="#ff5c5c" font-size="13" font-weight="bold">H⁺</text>';
  s += '<text x="' + (X(2) - 4) + '" y="' + (Y(1) - 8) + '" text-anchor="end" fill="#3ddc84" font-size="13" font-weight="bold">Cl⁻（一定）</text>';
  s += '<text x="' + (X(2) - 4) + '" y="' + (Y(2) + 16) + '" text-anchor="end" fill="#4aa8ff" font-size="13" font-weight="bold">Na⁺</text>';
  s += '<text x="' + (X(2) - 4) + '" y="' + (Y(1) + 26) + '" text-anchor="end" fill="#b69cff" font-size="13" font-weight="bold">OH⁻</text>';
  s += '<text x="' + X(1) + '" y="' + (Y(0) + 20) + '" text-anchor="middle" fill="#e6edf3" font-size="12">加えた水酸化ナトリウム水溶液の量 →</text>';
  s += '<text x="16" y="' + Y(1.1) + '" fill="#e6edf3" font-size="12" transform="rotate(-90 16 ' + Y(1.1) + ')" text-anchor="middle">イオンの数</text>';
  return s + '</svg>';
}
function renderSection8() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">中和のグラフで「イオンの数」って出てくるの、毎回どれがどの線かわからなくなる！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">4つのイオンを1つずつ「増える・減る・そのまま」で考えればいい。ポイントは、H⁺ と OH⁻ は出会うと<b>水になって消える</b>こと。それ以外のイオンは消えない</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 塩酸に水酸化ナトリウム水溶液を加えていくときのイオンの数</div>'
    + '<div class="rule-box">'
    + ionCountSVG()
    + '<div class="ex"><b style="color:#ff5c5c">H⁺</b>：加えたOH⁻と結びついて水になる → <b>減っていき、中和点で0</b></div>'
    + '<div class="ex"><b style="color:#3ddc84">Cl⁻</b>：だれとも結びつかない → <b>ずっと変わらない</b></div>'
    + '<div class="ex"><b style="color:#4aa8ff">Na⁺</b>：加えた分だけ入ってくる → <b>増え続ける</b></div>'
    + '<div class="ex"><b style="color:#b69cff">OH⁻</b>：中和点まではH⁺と結びついて消える → <b>中和点までは0、そのあと増える</b></div>'
    + '<div class="note">📐 イオンの総数：中和点までは「H⁺が1個減ってNa⁺が1個増える」ので<b>変わらない</b>。中和点をこえると<b>増える</b>。<br>💡 中和が起こると熱が出て、水溶液の温度が上がる（発熱反応）。</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">⚪ 沈殿ができる中和</div>'
    + '<div class="rule-box">'
    + '<div class="ex">うすい硫酸 ＋ 水酸化バリウム水溶液 → <b>硫酸バリウム（水にとけにくい塩）</b>が<b>白い沈殿</b>になる ＋ 水</div>'
    + '<div class="ex">ちょうど中和したとき、水溶液中のイオンがほとんどなくなるので、<b>電流がほとんど流れなくなる</b>。</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔩 金属のイオンへのなりやすさ（実験で比べる）</div>'
    + '<div class="rule-box">'
    + '<div class="ex">硫酸銅水溶液に<b>亜鉛板</b>を入れる → 亜鉛の表面に<b>赤い銅</b>がつく（亜鉛がイオンになってとけ、銅イオンが銅になる）</div>'
    + '<div class="ex">硫酸亜鉛水溶液に<b>銅板</b>を入れる → <b>変化しない</b></div>'
    + '<div class="ex">硫酸亜鉛水溶液に<b>マグネシウム板</b>を入れる → マグネシウムの表面に<b>亜鉛</b>がつく</div>'
    + '<div class="note">📐 ルール：イオンへのなりやすさは <b>マグネシウム ＞ 亜鉛 ＞ 銅</b>。なりやすい金属が、なりにくい金属のイオンの水溶液に入ると、自分がとけて相手の金属が出てくる。<br>💡 覚え方：「マグ・アエン・ドウ」＝ M・A・D の順（アルファベット順と同じ！）。</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔋 ダニエル電池と燃料電池</div>'
    + '<div class="rule-box">'
    + '<div class="ex">ダニエル電池：亜鉛板（硫酸亜鉛水溶液）と銅板（硫酸銅水溶液）を<b>セロハン</b>で仕切る。セロハンは<b>2つの水溶液が簡単には混ざらないようにしながら、イオンは通す</b>。</div>'
    + '<div class="ex">しばらく使うと：亜鉛板は<b>とけてうすく</b>なり、銅板には<b>銅がつく</b>。硫酸銅水溶液の<b>青色がうすく</b>なる（銅イオンが減るから）。</div>'
    + '<div class="ex">燃料電池：<b>水素と酸素が反応して水ができる</b>ときの化学変化で電気を取り出す（水の電気分解の逆）。出るのは水だけ。</div>'
    + '<div class="ex">塩酸の電気分解：<b>陰極から水素</b>、<b>陽極から塩素</b>（塩素は水にとけやすく、刺激臭があり、漂白作用がある）。</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { jp:'塩酸に水酸化ナトリウム水溶液を少しずつ加えていく。水素イオン（H⁺）の数はどう変化するか。',
      answer:'減っていき、中和点で0になる', choices:['減っていき、中和点で0になる','変わらない','増え続ける','中和点までは0で、そのあと増える'],
      exp:'📐 ルール：H⁺は加えたOH⁻と結びついて水になる。<br>✅ 減っていき、中和点で0<br>❌ 「中和点までは0、そのあと増える」はOH⁻の変化<br>💡 H⁺はOH⁻に出会うと消える' },
    { jp:'同じ実験で、塩化物イオン（Cl⁻）の数はどう変化するか。',
      answer:'変わらない', choices:['変わらない','減っていき、中和点で0になる','増え続ける','中和点までは0で、そのあと増える'],
      exp:'📐 ルール：Cl⁻はどのイオンとも結びつかず、水溶液中に残る。<br>✅ ずっと変わらない<br>❌ 減らない（NaClは水にとけているので、イオンのまま）<br>💡 グラフでは水平な線' },
    { jp:'同じ実験で、ナトリウムイオン（Na⁺）の数はどう変化するか。',
      answer:'増え続ける', choices:['増え続ける','変わらない','減っていき、中和点で0になる','中和点までは0で、そのあと増える'],
      exp:'📐 ルール：Na⁺は加えた水酸化ナトリウム水溶液から入ってきて、どれとも結びつかない。<br>✅ 加えた分だけ増え続ける<br>❌ 中和点で止まらない<br>💡 原点から右上がりの直線' },
    { jp:'同じ実験で、水酸化物イオン（OH⁻）の数はどう変化するか。',
      answer:'中和点までは0で、そのあと増える', choices:['中和点までは0で、そのあと増える','増え続ける','変わらない','減っていき、中和点で0になる'],
      exp:'📐 ルール：中和点までは、入ってきたOH⁻がすぐH⁺と結びついて水になる。H⁺がなくなると残るようになる。<br>✅ 中和点まで0 → そのあと増える<br>❌ はじめから増えるのはNa⁺<br>💡 H⁺がいなくなってからOH⁻の出番' },
    { jp:'【難】同じ実験で、水溶液中のイオンの総数はどう変化するか。',
      answer:'中和点までは変わらず、そのあと増える', choices:['中和点までは変わらず、そのあと増える','ずっと変わらない','中和点までは減り、そのあと増える','ずっと増え続ける'],
      exp:'📐 ルール：中和点までは「H⁺が1個減るかわりにNa⁺が1個増える」。<br>✅ 中和点まで一定、そのあとNa⁺とOH⁻が増える<br>❌ 中和点まで減る、はまちがい（硫酸と水酸化バリウムなら減る）<br>💡 入れかわるだけなら数は同じ' },
    { jp:'塩酸と水酸化ナトリウム水溶液を混ぜて中和させると、水溶液の温度はどうなるか。',
      answer:'上がる', choices:['上がる','下がる','変わらない','0℃になる'],
      exp:'📐 ルール：中和は熱が出る化学変化（発熱反応）。<br>✅ 温度が上がる<br>❌ 下がるのは吸熱反応<br>💡 中和＝あたたかくなる' },
    { jp:'うすい硫酸に水酸化バリウム水溶液を加えたときに見られる変化はどれか。',
      answer:'白い沈殿ができる', choices:['白い沈殿ができる','青い沈殿ができる','気体が発生する','変化は見られない'],
      exp:'📐 ルール：硫酸＋水酸化バリウム → 硫酸バリウム（水にとけにくい塩）＋水。<br>✅ 硫酸バリウムの白い沈殿<br>❌ 気体は発生しない<br>💡 とけにくい塩は沈殿になる' },
    { jp:'【難】うすい硫酸に水酸化バリウム水溶液を加えていくと、ちょうど中和したときに電流がほとんど流れなくなった。その理由として正しいものはどれか。',
      answer:'水溶液中のイオンがほとんどなくなったから', choices:['水溶液中のイオンがほとんどなくなったから','水溶液が中性になると電流は必ず流れなくなるから','水素が発生したから','温度が下がったから'],
      exp:'📐 ルール：H⁺とOH⁻は水に、Ba²⁺とSO₄²⁻は沈殿（硫酸バリウム）になり、イオンがほぼ残らない。<br>✅ イオンがなくなった<br>❌ 塩酸と水酸化ナトリウムの中和点では、NaClがイオンのまま残るので電流は流れる<br>💡 沈殿になるとイオンではなくなる' },
    { jp:'硫酸銅水溶液に亜鉛板を入れると、亜鉛板の表面に赤い物質がついた。この物質は何か。',
      answer:'銅', choices:['銅','亜鉛','硫黄','酸化亜鉛'],
      exp:'📐 ルール：亜鉛がイオンになってとけ、水溶液中の銅イオンが電子を受け取って銅になる。<br>✅ 赤い物質は銅<br>❌ 亜鉛がつくのではない<br>💡 イオンになりやすい方がとける' },
    { jp:'前の実験からわかることとして正しいものはどれか。',
      answer:'亜鉛は銅よりもイオンになりやすい', choices:['亜鉛は銅よりもイオンになりやすい','銅は亜鉛よりもイオンになりやすい','亜鉛と銅はイオンにならない','どちらもイオンへのなりやすさは同じ'],
      exp:'📐 ルール：なりやすい金属が、なりにくい金属のイオンの水溶液の中でとける。<br>✅ 亜鉛 ＞ 銅<br>❌ 逆にしない<br>💡 とけた方が「なりやすい」' },
    { jp:'マグネシウム・亜鉛・銅を、イオンになりやすい順に並べたものはどれか。',
      answer:'マグネシウム ＞ 亜鉛 ＞ 銅', choices:['マグネシウム ＞ 亜鉛 ＞ 銅','銅 ＞ 亜鉛 ＞ マグネシウム','亜鉛 ＞ マグネシウム ＞ 銅','マグネシウム ＞ 銅 ＞ 亜鉛'],
      exp:'📐 ルール：マグネシウム ＞ 亜鉛 ＞ 銅。<br>✅ M・A・D の順<br>❌ 銅がいちばんなりにくい<br>💡 「マグ・アエン・ドウ」' },
    { jp:'硫酸亜鉛水溶液に銅板を入れるとどうなるか。',
      answer:'変化しない', choices:['変化しない','銅板に亜鉛がつく','銅板がとける','気体が発生する'],
      exp:'📐 ルール：銅は亜鉛よりイオンになりにくいので、亜鉛イオンの水溶液に入れても反応しない。<br>✅ 変化なし<br>❌ 銅板に亜鉛はつかない<br>💡 なりにくい方を入れても何も起こらない' },
    { jp:'ダニエル電池で、2つの水溶液の間にセロハンを入れるのはなぜか。',
      answer:'2つの水溶液が簡単に混ざらないようにしながら、イオンは通すため', choices:['2つの水溶液が簡単に混ざらないようにしながら、イオンは通すため','イオンを完全に通さないようにするため','電子をセロハンの中に通すため','水溶液を冷やすため'],
      exp:'📐 ルール：セロハンには小さな穴があり、イオンは少しずつ通れる。<br>✅ 混ざりにくく、イオンは通す<br>❌ イオンを完全に止めると電流が流れなくなる<br>💡 電子は導線、イオンはセロハンを通る' },
    { jp:'ダニエル電池をしばらく使ったとき、硫酸銅水溶液の色はどうなるか。',
      answer:'青色がうすくなる', choices:['青色がうすくなる','青色がこくなる','赤色になる','無色から青色になる'],
      exp:'📐 ルール：銅板の表面で銅イオンが電子を受け取って銅になるので、水溶液中の銅イオンが減る。<br>✅ 青色がうすくなる<br>❌ こくはならない<br>💡 青色の正体は銅イオン' },
    { jp:'燃料電池について正しいものはどれか。',
      answer:'水素と酸素が反応して水ができるときに電気を取り出す', choices:['水素と酸素が反応して水ができるときに電気を取り出す','水を電気分解して電気を取り出す','二酸化炭素を出しながら電気を取り出す','亜鉛と銅をとかして電気を取り出す'],
      exp:'📐 ルール：燃料電池＝水の電気分解の逆向きの化学変化で電気を取り出す。<br>✅ 出てくるのは水だけ<br>❌ 水の電気分解は電気を「使う」方<br>💡 環境にやさしい電池として使われている' },
    { jp:'塩酸を電気分解したとき、陰極から発生する気体はどれか。',
      answer:'水素', choices:['水素','塩素','酸素','二酸化炭素'],
      exp:'📐 ルール：陽イオンのH⁺は陰極へ行って水素に、陰イオンのCl⁻は陽極へ行って塩素になる。<br>✅ 陰極＝水素、陽極＝塩素<br>❌ 塩素は陽極から<br>💡 ＋のイオンは−極へ、−のイオンは＋極へ' }
  ];
  qs.forEach(function(q, i) { q._qid = 'sci_ion_s8_q' + i; });
  qs.forEach(function(q) {
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });
  return html;
}

// ===== SECTION 5: 確認テスト =====
function renderSection5() {
  var html = '<div style="background:#1a2236;border:1px solid #334155;border-radius:12px;padding:20px 24px;margin-bottom:24px">'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:8px">📋 確認テスト</div>'
    + '<div style="font-size:16px;color:var(--text);line-height:1.8">イオン・電離・電池・酸アルカリ・中和を確認しよう。<br>'
    + '語句記入（8問）＋選択問題（12問）の計20問。</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 12px;letter-spacing:.08em">▍語句記入問題</div>';

  var inputQs = [
    { qid:'sci_ion_s5_in0', jp:'原子が電子を失って電気を帯びた粒子を何というか。', answer:'陽イオン',
      exp:'陽イオン：電子を失いプラスの電荷を持つ粒子。Na⁺・H⁺・Cu²⁺ など。失った電子の数だけプラスになる。' },
    { qid:'sci_ion_s5_in1', jp:'原子が電子を得て電気を帯びた粒子を何というか。', answer:'陰イオン',
      exp:'陰イオン：電子を得てマイナスの電荷を持つ粒子。Cl⁻・OH⁻・SO₄²⁻ など。得た電子の数だけマイナスになる。' },
    { qid:'sci_ion_s5_in2', jp:'水に溶けてイオンに分かれることを何というか。', answer:'電離',
      exp:'電離：電解質が水に溶けてイオンに分かれる現象。NaCl → Na⁺ + Cl⁻ が電離の典型例。' },
    { qid:'sci_ion_s5_in3', jp:'水に溶けて電気を通す物質を何というか。', answer:'電解質',
      exp:'電解質：水溶液中で電離してイオンを生じ、電気を通す物質。NaCl・HCl・NaOH・H₂SO₄ など。' },
    { qid:'sci_ion_s5_in4', jp:'金属がイオンになりやすい順番を何というか。', answer:'イオン化傾向',
      exp:'イオン化傾向（イオンへのなりやすさ）：金属が水溶液中で陽イオンになりやすいかどうか。中学では マグネシウム ＞ 亜鉛 ＞ 銅。' },
    { qid:'sci_ion_s5_in5', jp:'酸性の正体となるイオンは何か（記号で答えよ）。', answer:'H⁺',
      exp:'H⁺（水素イオン）が酸性の正体。H⁺ が多いほど pH が低く強い酸性になる。HCl → H⁺ + Cl⁻ の H⁺ が酸性を示す。' },
    { qid:'sci_ion_s5_in6', jp:'アルカリ性の正体となるイオンは何か（記号で答えよ）。', answer:'OH⁻',
      exp:'OH⁻（水酸化物イオン）がアルカリ性の正体。OH⁻ が多いほど pH が高く強いアルカリ性になる。' },
    { qid:'sci_ion_s5_in7', jp:'酸とアルカリが打ち消し合う反応を何というか。', answer:'中和',
      exp:'中和：H⁺ + OH⁻ → H₂O。酸の H⁺ とアルカリの OH⁻ が結合して水になり、同時に塩（えん）ができる。' },
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

  html += '<div style="font-size:13px;color:var(--text2);margin:28px 0 12px;letter-spacing:.08em">▍選択問題</div>';

  var choiceQs = [
    { jp:'次のうち電解質はどれか。',
      answer:'塩化ナトリウム（NaCl）', choices:['塩化ナトリウム（NaCl）','砂糖','エタノール','デンプン'],
      exp:'NaCl は水に溶けると Na⁺ + Cl⁻ に電離する電解質。砂糖・エタノール・デンプンは非電解質（イオンに分かれない）。' },
    { jp:'ダニエル電池で電子が流れる方向はどれか。',
      answer:'Zn（−極）から Cu（+極）へ外部回路を通って流れる', choices:['Zn（−極）から Cu（+極）へ外部回路を通って流れる','Cu（+極）から Zn（−極）へ外部回路を通って流れる','水溶液の中を流れる','流れない'],
      exp:'電子は−極（Zn）から+極（Cu）へ外部回路を流れる。電流の向きは電子と逆（+極から−極へ）。' },
    { jp:'塩酸にふくまれるH⁺の数と、水酸化ナトリウム水溶液にふくまれるOH⁻の数がちょうど同じになるように混ぜたとき、水溶液の性質はどれか。',
      answer:'中性', choices:['中性','酸性','アルカリ性','強酸性'],
      exp:'HCl + NaOH → NaCl + H₂O。H⁺ と OH⁻ が等量で中和し、中性（pH=7）になる。NaCl（食塩）水溶液。' },
    { jp:'中和反応で生じる「塩（えん）」の定義として正しいのはどれか。',
      answer:'酸の陰イオンとアルカリの陽イオンが結合した物質',
      choices:['酸の陰イオンとアルカリの陽イオンが結合した物質','H⁺ と OH⁻ が結合した物質','酸とアルカリが混ざっただけの混合物','必ずしょっぱい物質'],
      exp:'塩（えん）= 酸の陰イオン（Cl⁻・SO₄²⁻）+ アルカリの陽イオン（Na⁺・K⁺）が結合したもの。NaCl・Na₂SO₄ など。' },
    { jp:'BTB溶液を中性の水溶液に加えると何色か。',
      answer:'緑色', choices:['緑色','黄色','青色','赤色'],
      exp:'BTB：酸性→黄色、中性→緑色、アルカリ性→青色。pH7（中性）のとき緑色。よく出る指示薬の問題。' },
    { jp:'イオン化傾向が大きい金属の説明として正しいのはどれか。',
      answer:'水溶液中で陽イオンになりやすく、電池の−極になりやすい',
      choices:['水溶液中で陽イオンになりやすく、電池の−極になりやすい','水溶液中で電気を通しにくい','融点が高い','硬度が高い'],
      exp:'イオン化傾向大 = 陽イオンになりやすい = 電子を失いやすい = 電池の−極（電子を出す側）になる。Zn > Cu なので Zn が−極。' },
    { jp:'水酸化バリウム Ba(OH)₂ の電離式はどれか。',
      answer:'Ba(OH)₂ → Ba²⁺ + 2OH⁻', choices:['Ba(OH)₂ → Ba²⁺ + 2OH⁻','Ba(OH)₂ → Ba⁺ + OH⁻','Ba(OH)₂ → Ba²⁺ + OH²⁻','Ba(OH)₂ → 2Ba⁺ + 2OH⁻'],
      exp:'Ba(OH)₂ → Ba²⁺（+2価）+ 2OH⁻。電荷の合計：+2 + (−1)×2 = 0 でバランスが取れている。' },
    { jp:'硫酸（H₂SO₄）の電離式はどれか。',
      answer:'H₂SO₄ → 2H⁺ + SO₄²⁻', choices:['H₂SO₄ → 2H⁺ + SO₄²⁻','H₂SO₄ → H⁺ + SO₄⁻','H₂SO₄ → 2H⁺ + 2SO₄⁻','H₂SO₄ → H₂⁺ + SO₄²⁻'],
      exp:'H₂SO₄ → 2H⁺ + SO₄²⁻。H が2個あるので H⁺ が2個出る。電荷：+2 + (−2) = 0 でバランスOK。強酸の典型例。' },
    { jp:'酸性の水溶液にアルカリ性の水溶液を少しずつ加えていくとき、pH はどう変化するか。',
      answer:'小さい値から大きい値へ変化する（上昇する）', choices:['小さい値から大きい値へ変化する（上昇する）','大きい値から小さい値へ変化する','変化しない','急に下がる'],
      exp:'酸性（pH小）の水溶液にアルカリを加えると中和が進み pH が上昇。中和点でちょうど pH=7（中性）になり、過剰に加えるとアルカリ性（pH大）になる。' },
    { jp:'塩化銅水溶液（CuCl₂）の電気分解で陽極から発生する物質はどれか。',
      answer:'塩素（Cl₂）', choices:['塩素（Cl₂）','銅（Cu）','水素（H₂）','酸素（O₂）'],
      exp:'CuCl₂ → Cu²⁺ + 2Cl⁻。陽極（+）にはCl⁻が集まり Cl₂（塩素ガス）が発生。陰極（−）には Cu²⁺ が集まり Cu が析出。' },
    { jp:'NaOH + HCl → NaCl + H₂O の反応で生成される「塩」の名前はどれか。',
      answer:'塩化ナトリウム（NaCl）', choices:['塩化ナトリウム（NaCl）','水酸化ナトリウム（NaOH）','塩化水素（HCl）','炭酸ナトリウム（Na₂CO₃）'],
      exp:'NaCl = 塩化ナトリウム（食塩）。Na⁺（NaOH由来）と Cl⁻（HCl由来）が結合した塩（えん）。' },
    { jp:'次のうち中性の物質はどれか（pH=7）。',
      answer:'砂糖水', choices:['砂糖水','炭酸水','塩酸','NaOH水溶液'],
      exp:'砂糖水は中性（pH=7）。炭酸水と塩酸は酸性、水酸化ナトリウム水溶液はアルカリ性。ちなみに食塩水も中性。' },
  ];

  choiceQs.forEach(function(q, i) {
    q._qid = 'sci_ion_s5_ch' + i;
    html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var allQs = Object.keys(qMeta).filter(function(id) { return id.indexOf('sci_ion_') === 0; });
  var correct = allQs.filter(function(id) { return answeredSet[id] && weakDB[id] && weakDB[id].correct > 0; }).length;
  var total = allQs.length;
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var msg = pct >= 80 ? '🏆 素晴らしい！中3化学マスター！' : pct >= 60 ? '⭐ よくできました！弱点を復習しよう' : '💪 もう一度チャレンジ！弱点特訓で確認しよう';
  var ov = document.getElementById('resultOverlay');
  ov.innerHTML = '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:999">'
    + '<div style="background:#161b22;border:1px solid #30363d;border-radius:20px;padding:40px;max-width:400px;width:90%;text-align:center">'
    + '<div style="font-size:60px;margin-bottom:16px">🎉</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--gold);letter-spacing:3px;margin-bottom:8px">確認テスト完了！</div>'
    + '<div style="font-size:48px;font-weight:bold;color:var(--green);margin:12px 0">' + pct + '<span style="font-size:20px">%</span></div>'
    + '<div style="color:var(--text2);margin-bottom:20px">' + correct + ' / ' + total + ' 問正解</div>'
    + '<div style="font-size:15px;margin-bottom:24px">' + msg + '</div>'
    + '<button class="start-btn" onclick="document.getElementById(\'resultOverlay\').innerHTML=\'\';goSection(6)">📊 弱点ノートを見る</button>'
    + '</div></div>';
}

// ===== WEAK NOTE =====
function renderWeakNote() {
  var wqs = getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); });
  var html = '<div class="intro-box">'
    + '<div class="intro-box-title">📊 弱点ノート</div>'
    + (wqs.length === 0
        ? '<div style="text-align:center;padding:20px;color:var(--green)">🎉 弱点なし！全問80%以上の正答率！</div>'
        : wqs.map(function(qid) {
            var d = weakDB[qid];
            return '<div class="weak-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #21262d">'
              + '<span style="flex:1;font-size:14px">' + (d.jp || qid) + '</span>'
              + '<span style="color:' + (getPct(qid) < 50 ? 'var(--red)' : 'var(--gold)') + ';font-weight:bold;margin-left:12px">' + getPct(qid) + '%</span>'
              + '</div>';
          }).join('')
      )
    + '</div>';
  document.getElementById('mainContent').innerHTML = html;
}

// ===== TOKKU MODE =====
var tokkuBannerShown = false;
function showTokkuSuggestion(qid) {}
function renderTokkuMode() {
  var wqs = getWeakQuestions();
  if (wqs.length === 0) {
    document.getElementById('mainContent').innerHTML = '<div class="intro-box" style="text-align:center;padding:40px">'
      + '<div style="font-size:48px;margin-bottom:16px">🎉</div>'
      + '<div style="font-size:20px;color:var(--green)">弱点なし！全問80%以上！</div>'
      + '<div style="color:var(--text2);margin-top:8px">きょん「俺、無敵になったかも！！」</div>'
      + '</div>';
    return;
  }
  var pool = shuffleArray(wqs).slice(0, 15);
  var html = '<div style="background:linear-gradient(135deg,#3a0010,#1a0008);border:1px solid var(--red);border-radius:14px;padding:20px;margin-bottom:24px">'
    + '<div style="font-size:13px;color:var(--red);font-weight:bold;letter-spacing:1px;margin-bottom:6px">🔥 弱点特訓モード</div>'
    + '<div style="font-size:14px;color:var(--text2)">間違えた ' + pool.length + ' 問に集中チャレンジ！</div>'
    + '</div>';
  pool.forEach(function(qid) {
    var d = weakDB[qid];
    if (!d) return;
    var meta = d;
    var tqid = 'tokku_' + qid;
    if (meta.choices && meta.choices.length > 0) {
      html += makeChoices(tqid, meta.jp || qid, meta.answer, meta.choices, '正答率: ' + getPct(qid) + '%');
    }
  });
  document.getElementById('mainContent').innerHTML = html;
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleChoice(btn.dataset.qid, btn.dataset.choice); });
  });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { showAnswer(btn.dataset.qid); });
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  updateXP();
  renderWeakBar();
  renderTabs();
  goSection(0);
});
