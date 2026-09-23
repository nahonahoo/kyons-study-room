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
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
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

  // ===== SVG 1: 音波の波形（振動数と振幅の違い）=====
  var svgWave = (function(){
    function wavePts(x0, y0, width, amp, cycles){
      var pts = '';
      for(var px = 0; px <= width; px += 2){
        var py = y0 + amp * Math.sin(px * Math.PI * 2 * cycles / width);
        pts += (x0 + px) + ',' + py.toFixed(1) + ' ';
      }
      return pts;
    }
    return '<svg viewBox="0 0 290 200" style="width:100%;max-width:340px;display:block;margin:0 auto">'
      // ── 左上: 高い音（振動数大） ──
      + '<text x="5" y="14" fill="#a371f7" font-size="10" font-weight="bold">高い音（振動数 多）</text>'
      + '<line x1="5" y1="45" x2="135" y2="45" stroke="#30363d" stroke-width="1"/>'
      + '<polyline points="' + wavePts(5,45,130,18,5) + '" fill="none" stroke="#a371f7" stroke-width="2"/>'
      + '<text x="5" y="88" fill="#8b949e" font-size="9">→ 1秒間の振動が多い → 音が高い</text>'
      // ── 右上: 低い音（振動数小） ──
      + '<text x="155" y="14" fill="#0ea5e9" font-size="10" font-weight="bold">低い音（振動数 少）</text>'
      + '<line x1="155" y1="45" x2="285" y2="45" stroke="#30363d" stroke-width="1"/>'
      + '<polyline points="' + wavePts(155,45,130,18,2) + '" fill="none" stroke="#0ea5e9" stroke-width="2"/>'
      + '<text x="155" y="88" fill="#8b949e" font-size="9">→ 1秒間の振動が少ない → 音が低い</text>'
      // 仕切り
      + '<line x1="0" y1="100" x2="290" y2="100" stroke="#21262d" stroke-width="1.5"/>'
      // ── 左下: 大きい音（振幅大） ──
      + '<text x="5" y="114" fill="#3fb950" font-size="10" font-weight="bold">大きい音（振幅 大）</text>'
      + '<line x1="5" y1="150" x2="135" y2="150" stroke="#30363d" stroke-width="1"/>'
      + '<polyline points="' + wavePts(5,150,130,28,3) + '" fill="none" stroke="#3fb950" stroke-width="2"/>'
      + '<text x="5" y="196" fill="#8b949e" font-size="9">→ 振れ幅（振幅）が大きい → 音が大きい</text>'
      // ── 右下: 小さい音（振幅小） ──
      + '<text x="155" y="114" fill="#f5c518" font-size="10" font-weight="bold">小さい音（振幅 小）</text>'
      + '<line x1="155" y1="150" x2="285" y2="150" stroke="#30363d" stroke-width="1"/>'
      + '<polyline points="' + wavePts(155,150,130,10,3) + '" fill="none" stroke="#f5c518" stroke-width="2"/>'
      + '<text x="155" y="196" fill="#8b949e" font-size="9">→ 振れ幅（振幅）が小さい → 音が小さい</text>'
      + '</svg>';
  })();

  // ===== SVG 2: 音の速さ比較（固体>液体>気体） =====
  var svgSpeed = '<svg viewBox="0 0 290 130" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="145" y="14" fill="#8b949e" font-size="11" text-anchor="middle">音の速さ（媒質の比較）</text>'
    // 固体（鉄）約5000 m/s — 棒を250px幅
    + '<rect x="80" y="24" width="200" height="22" rx="4" fill="rgba(245,197,24,0.2)" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="6" y="40" fill="#f5c518" font-size="11">固体（鉄）</text>'
    + '<text x="285" y="40" fill="#f5c518" font-size="11" text-anchor="end">約5000 m/s</text>'
    // 液体（水）約1500 m/s — 棒を150px幅(5000:1500 ≈ 10:3)
    + '<rect x="80" y="54" width="120" height="22" rx="4" fill="rgba(14,165,233,0.2)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="6" y="70" fill="#0ea5e9" font-size="11">液体（水）</text>'
    + '<text x="285" y="70" fill="#0ea5e9" font-size="11" text-anchor="end">約1500 m/s</text>'
    // 気体（空気）約340 m/s — 棒を68px幅(5000:340 ≈ 10:0.68)
    + '<rect x="80" y="84" width="55" height="22" rx="4" fill="rgba(163,113,247,0.2)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="6" y="100" fill="#a371f7" font-size="11">気体（空気）</text>'
    + '<text x="285" y="100" fill="#a371f7" font-size="11" text-anchor="end">約340 m/s</text>'
    + '<text x="145" y="122" fill="#f5c518" font-size="10" text-anchor="middle">固体 ＞ 液体 ＞ 気体　（密なほど速く伝わる）</text>'
    + '</svg>';

  // ===== SVG 3: 反響（エコー）の模式図 =====
  var svgEcho = '<svg viewBox="0 0 290 110" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="145" y="14" fill="#8b949e" font-size="11" text-anchor="middle">反響（エコー）の仕組み</text>'
    // 音源
    + '<circle cx="30" cy="60" r="16" fill="rgba(163,113,247,0.15)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="30" y="64" fill="#a371f7" font-size="10" text-anchor="middle">音源</text>'
    // 壁
    + '<rect x="258" y="30" width="22" height="60" rx="4" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="269" y="64" fill="#0ea5e9" font-size="9" text-anchor="middle">壁</text>'
    // 往路（音が壁へ）
    + '<line x1="48" y1="52" x2="254" y2="44" stroke="#f5c518" stroke-width="1.5" stroke-dasharray="6,3"/>'
    + '<text x="150" y="42" fill="#f5c518" font-size="9" text-anchor="middle">① 音が壁へ向かう</text>'
    // 復路（反響音）
    + '<line x1="254" y1="72" x2="48" y2="72" stroke="#3fb950" stroke-width="1.5" stroke-dasharray="6,3"/>'
    + '<text x="150" y="85" fill="#3fb950" font-size="9" text-anchor="middle">② 壁で反射して戻る = エコー</text>'
    // 距離計算注記
    + '<text x="145" y="103" fill="#8b949e" font-size="9" text-anchor="middle">距離 = 音速 × 時間 ÷ 2（往復の半分が実際の距離）</text>'
    + '</svg>';

  // ===== 会話 =====
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🎵 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">音って空気が振動してるって聞いたけど、宇宙でも音は聞こえるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">聞こえない。音は媒質（空気・水・固体）の振動で伝わる。宇宙は真空だから媒質がなく、音は伝わらない。SF映画の爆発音は演出だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">えっ、映画で宇宙爆発のドーン！って音は嘘だったの！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。あと音の高さは振動数（Hz）、大きさは振幅で決まる。これと音速をセットで覚えれば音のテストは攻略できる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">高さ→振動数、大きさ→振幅！リズムで覚えた！「振動数・振幅！振動数・振幅！」</div></div></div>'
    + '</div>';

  // ===== Rule Card 1: 音の伝わり方 =====
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 音の伝わり方・媒質</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">音が伝わる仕組み</div>'
    + '<div class="ex">物体が振動 → 周囲の媒質（空気・水・固体）を振動させて伝わる</div>'
    + '<div class="ex" style="color:var(--red)">⚠️ 真空中では音は伝わらない——媒質がないから！</div>'
    + '<div class="note">💡 宇宙空間は真空 → 爆発しても音なし。光は伝わるが音は伝わらない</div>'
    + '</div>'
    + '<div style="overflow-x:auto;margin:12px 0">' + svgSpeed + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">音速のルール（媒質別）</div>'
    + '<div class="ex">固体（鉄など） ≈ 5000 m/s　　液体（水） ≈ 1500 m/s　　気体（空気） ≈ 340 m/s</div>'
    + '<div class="ex"><strong style="color:var(--gold)">固体 ＞ 液体 ＞ 気体</strong>（密なほど速く伝わる）</div>'
    + '<div class="note">💡 覚え方：「固い（固体）ほど音が早く届く」</div>'
    + '</div>'
    + '</div>';

  // ===== Rule Card 2: 振動数・振幅 =====
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 振動数（Hz）と振幅——音の高さ・大きさ</div>'
    + '<div style="overflow-x:auto;margin:12px 0">' + svgWave + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">振動数（ふりどうすう）= 音の高さ</div>'
    + '<div class="ex">1秒間に振動する回数。単位は <strong style="color:var(--gold)">Hz（ヘルツ）</strong></div>'
    + '<div class="ex">振動数 多い → <strong style="color:var(--purple)">高い音</strong>　　振動数 少ない → <strong style="color:var(--teal)">低い音</strong></div>'
    + '<div class="note">💡 人間の聴覚範囲：約20 Hz〜20000 Hz。20000 Hz以上 = 超音波（聞こえない）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">振幅（しんぷく）= 音の大きさ</div>'
    + '<div class="ex">振動の幅（波の山の高さ）。単位はない（相対的な大きさ）</div>'
    + '<div class="ex">振幅 大きい → <strong style="color:var(--green)">大きい音</strong>　　振幅 小さい → <strong style="color:var(--gold)">小さい音</strong></div>'
    + '<div class="note">💡 ギターを強く弾く（振幅大）→ 大きい音。軽く弾く（振幅小）→ 小さい音</div>'
    + '</div>'
    + '</div>';

  // ===== Rule Card 3: 音速計算・反響・弦 =====
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 音速の計算・反響・弦の音</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">音速計算の公式</div>'
    + '<div class="ex"><strong style="color:var(--gold)">距離 ＝ 音速 × 時間</strong>　（音速 = 340 m/s を使う）</div>'
    + '<div class="ex">例：雷が光ってから3秒後に音 → 距離 = 340 × 3 = <strong style="color:var(--gold)">1020 m</strong></div>'
    + '</div>'
    + '<div style="overflow-x:auto;margin:12px 0">' + svgEcho + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">反響（エコー）の計算</div>'
    + '<div class="ex">壁に向かって音を出し、跳ね返りが聞こえるまでの時間 = t 秒</div>'
    + '<div class="ex"><strong style="color:var(--gold)">距離 ＝ 340 × t ÷ 2</strong>（往復の半分 = 実際の距離）</div>'
    + '<div class="note">💡 ÷2 を忘れずに！往復しているから実際の距離は半分</div>'
    + '</div>'
    + '<div style="overflow-x:auto;margin-top:12px">'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    + '<tr style="background:var(--bg3);color:var(--teal)">'
    + '<td style="padding:8px 12px;font-weight:bold">弦の変化</td>'
    + '<td style="padding:8px 12px;font-weight:bold">振動数</td>'
    + '<td style="padding:8px 12px;font-weight:bold">音の高さ</td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 12px;color:var(--text2)">短くする</td><td style="padding:8px 12px;color:var(--text2)">増える</td><td style="padding:8px 12px;color:var(--gold)">高くなる</td></tr>'
    + '<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 12px;color:var(--text2)">細くする</td><td style="padding:8px 12px;color:var(--text2)">増える</td><td style="padding:8px 12px;color:var(--gold)">高くなる</td></tr>'
    + '<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 12px;color:var(--text2)">強く張る</td><td style="padding:8px 12px;color:var(--text2)">増える</td><td style="padding:8px 12px;color:var(--gold)">高くなる</td></tr>'
    + '<tr><td style="padding:8px 12px;color:var(--text2)">長く・太く・弱く張る</td><td style="padding:8px 12px;color:var(--text2)">減る</td><td style="padding:8px 12px;color:var(--teal)">低くなる</td></tr>'
    + '</table>'
    + '<div style="font-size:12px;color:var(--text2);margin-top:6px">💡 「短・細・強張り → 高い音」を3セットで覚えよう</div>'
    + '</div>'
    + '</div>';

  // ===== 練習問題（選択）=====
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 音の性質</div>';

  var qs = [
    {
      q:'音が伝わるために必要な物質を何というか？',
      sub:'真空中では音が伝わらない理由と関係する',
      a:'媒質',
      choices:['媒質','電磁波','音波','振幅'],
      jp:'媒質の定義',
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>音が伝わるために必要な物質 → 媒質（ばいしつ）</span><span class="exp-ok">✅ 空気・水・固体はすべて媒質。真空には媒質がない</span><span class="exp-tip">💡 宇宙は真空（媒質なし）→ 音は伝わらない。光は媒質不要なので伝わる</span>'
    },
    {
      q:'音が真空中を伝わらない理由はどれか？',
      sub:'音の伝わり方の本質を問う問題',
      a:'音を伝える媒質がないから',
      choices:['音を伝える媒質がないから','温度が低すぎるから','重力がないから','光が邪魔するから'],
      jp:'真空中で音が伝わらない理由',
      exp:'<span class="exp-rule"><span class="label">📐 ルール</span>音 = 媒質の振動の伝達 → 媒質がなければ伝わらない</span><span class="exp-ok">✅ 真空 = 媒質ゼロ → 音ゼロ</span><span class="exp-tip">💡 SF映画の宇宙爆発音は演出。本当は宇宙空間では無音！</span>'
    },
    {
      q:'振動数の単位として正しいのはどれか？',
      sub:'1秒間に振動する回数の単位',
      a:'Hz（ヘルツ）',
      choices:['Hz（ヘルツ）','N（ニュートン）','Pa（パスカル）','dB（デシベル）'],
      jp:'振動数の単位（Hz）',
      exp:'<span class="exp-rule"><span class="label">📐 単位</span>振動数 = Hz（ヘルツ）</span><span class="exp-ok">✅ 1Hz = 1秒間に1回振動</span><span class="exp-tip">💡 人間の耳が聞こえる範囲は約20〜20000 Hz。それ以上が超音波</span>'
    },
    {
      q:'音の高さを決める要素はどれか？',
      sub:'振動数・振幅のどちらかで決まる',
      a:'振動数',
      choices:['振動数','振幅','音速','波長'],
      jp:'音の高さ → 振動数',
      exp:'<span class="exp-rule"><span class="label">📐 高さ → 振動数</span>振動数が多い → 高い音、振動数が少ない → 低い音</span><span class="exp-ok">✅ ドレミの「ド（低）→ラ（高）」は振動数の違い</span><span class="exp-ng">❌ 振幅は音の大きさ（強弱）を決める。高さではない</span>'
    },
    {
      q:'音の大きさを決める要素はどれか？',
      sub:'振動数・振幅のどちらかで決まる',
      a:'振幅',
      choices:['振幅','振動数','音速','媒質'],
      jp:'音の大きさ → 振幅',
      exp:'<span class="exp-rule"><span class="label">📐 大きさ → 振幅</span>振幅が大きい → 大きい音、振幅が小さい → 小さい音</span><span class="exp-ok">✅ ギターを強く弾く → 弦が大きく振れる（振幅大）→ 大きい音</span><span class="exp-ng">❌ 振動数は音の高さを決める。大きさではない</span>'
    },
    {
      q:'音の速さが最も速い媒質はどれか？',
      sub:'気体・液体・固体の中で比べる',
      a:'固体（鉄など）',
      choices:['固体（鉄など）','液体（水）','気体（空気）','真空'],
      jp:'音速：固体 > 液体 > 気体',
      exp:'<span class="exp-rule"><span class="label">📐 音速の順</span>固体（≈5000 m/s）＞ 液体（≈1500 m/s）＞ 気体（≈340 m/s）</span><span class="exp-ok">✅ 密な媒質ほど振動が速く伝わる</span><span class="exp-tip">💡 線路に耳を当てると遠くの電車の音が早く聞こえるのは固体（鉄）の音速が速いから</span>'
    },
    {
      q:'ギターの弦を短くすると音はどうなるか？',
      sub:'フレットを押さえることと同じ操作',
      a:'高くなる',
      choices:['高くなる','低くなる','大きくなる','小さくなる'],
      jp:'弦を短くする → 振動数増 → 高い音',
      exp:'<span class="exp-rule"><span class="label">📐 弦を短くする</span>振動しやすくなる → 振動数増加 → 高い音</span><span class="exp-ok">✅ ギターのフレットを押す = 弦を短くする → 高い音になる</span><span class="exp-tip">💡 短・細・強張り → 高い音。長・太・弱張り → 低い音</span>'
    },
    {
      q:'雷が光ってから4秒後に音が聞こえた。雷までの距離は約何mか（音速340 m/s）？',
      sub:'距離 = 音速 × 時間 を使う',
      a:'1360 m',
      choices:['1360 m','340 m','680 m','4080 m'],
      jp:'音速計算：340 × 4 = 1360 m',
      exp:'<span class="exp-rule"><span class="label">📐 計算</span>距離 = 音速 × 時間 = 340 × 4 = 1360 m</span><span class="exp-ok">✅ 光は瞬時に届く → 音が遅れた4秒が音の移動時間</span><span class="exp-tip">💡 1秒遅れたら約340m。3秒なら約1km。「3秒で1km」と覚えておくと便利</span>'
    },
    {
      q:'壁に向かって音を出したら0.6秒後に反響音（エコー）が聞こえた。壁までの距離は何mか（音速340 m/s）？',
      sub:'往復の時間に注意！距離 = 音速 × 時間 ÷ 2',
      a:'102 m',
      choices:['102 m','204 m','340 m','51 m'],
      jp:'反響計算：340 × 0.6 ÷ 2 = 102 m',
      exp:'<span class="exp-rule"><span class="label">📐 反響計算</span>距離 = 音速 × 時間 ÷ 2 = 340 × 0.6 ÷ 2 = 102 m</span><span class="exp-ok">✅ 音は壁に行って戻ってくる（往復）→ 実際の距離は半分</span><span class="exp-ng">❌ ÷2を忘れると204mになってしまう！</span>'
    },
    {
      q:'人間の耳に聞こえない、20000 Hz以上の音波を何というか？',
      sub:'医療診断やコウモリのナビゲーションにも使われる',
      a:'超音波',
      choices:['超音波','赤外線','電磁波','磁波'],
      jp:'超音波の定義（20000 Hz以上）',
      exp:'<span class="exp-rule"><span class="label">📐 超音波</span>20000 Hz以上の音波 → 人間には聞こえない</span><span class="exp-ok">✅ 利用例：医療エコー検査・コウモリのソナー・魚群探知機</span><span class="exp-tip">💡 犬は約40000 Hzまで聞こえる。犬笛が人には聞こえないのはそのため</span>'
    },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_force_s3_q' + i; });
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

  // ===== 計算入力問題 =====
  html += '</div>';
  html += '<div class="practice-section"><div class="practice-title">✏️ 計算問題（数値入力）</div>';

  var inputQs = [
    { qid:'sci_force_s3_in0', jp:'雷が光ってから5秒後に音が聞こえた。雷までの距離は何mか（音速340 m/s）。数字のみ入力。', answer:'1700', xp:8,
      exp:'距離 = 340 × 5 = <strong style="color:var(--gold)">1700 m</strong>' },
    { qid:'sci_force_s3_in1', jp:'壁に向かって音を出したら1秒後に反響が返ってきた。壁までの距離は何mか（音速340 m/s）。数字のみ入力（往復に注意！）。', answer:'170', xp:10,
      exp:'距離 = 340 × 1 ÷ 2 = <strong style="color:var(--gold)">170 m</strong>（往復 → ÷2）' },
    { qid:'sci_force_s3_in2', jp:'ある音波の振動数が440 Hzであるとき、1秒間に何回振動しているか。数字のみ入力。', answer:'440', xp:5,
      exp:'振動数 = 1秒間の振動回数。440 Hz → <strong style="color:var(--gold)">440回</strong>（ラ音の標準周波数！）' },
  ];

  inputQs.forEach(function(q) {
    qMeta[q.qid] = { type:'input', answer:q.answer, xp:q.xp, jp:q.jp };
    html += '<div class="q-card" data-card="' + q.qid + '">'
      + '<div class="q-text">' + q.jp + '</div>'
      + makeInput(q.qid, q.jp, q.answer, q.xp)
      + makeFeedback(q.qid, q.exp)
      + '</div>';
  });

  html += '</div>';
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