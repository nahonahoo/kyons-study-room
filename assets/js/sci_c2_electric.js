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
  localStorage.setItem('sci_elec_answered', JSON.stringify(answeredSet));
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
        var nextSec = currentSection < 5 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '確認テストで腕試し！';
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
  { id:0, label:'⚡ スタート',  title:'電流・磁界',                     sub:'中2理科の電気分野。オームの法則と磁界をマスターしよう！' },
  { id:1, label:'電流・電圧',   title:'電流・電圧・抵抗とオームの法則',      sub:'V=IR の公式を使いこなそう' },
  { id:2, label:'直列回路',    title:'直列回路',                         sub:'電流は一定・電圧は分担——1本道の法則をマスター' },
  { id:3, label:'並列回路',    title:'並列回路',                         sub:'電圧は共通・電流は分担——分岐する回路をマスター' },
  { id:4, label:'電力・磁界',   title:'電力・電熱・磁界',                  sub:'電力の計算と磁界・電磁誘導の仕組み' },
  { id:5, label:'確認テスト',   title:'確認テスト',                       sub:'全単元の総まとめ！愛知県形式20問' },
  { id:6, label:'🔗3年予習',    title:'3年予習：運動とエネルギー',          sub:'仕事・仕事率・エネルギーの保存への橋渡し' },
  { id:7, label:'📊弱点',       title:'弱点ノート',                       sub:'間違えた問題の正答率を確認しよう' },
  { id:8, label:'🔥特訓',       title:'弱点特訓モード',                   sub:'間違えた問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab';
    if (s.id >= 7) cls += ' tokku';
    if (s.id === currentSection) cls += ' active';
    if (sectionDone[s.id] && s.id < 7) cls += ' done';
    var label = s.label + (sectionDone[s.id] && s.id < 7 ? ' ✓' : '');
    if (s.id === 8) { var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
    html += '<button class="' + cls + '" data-sid="' + s.id + '">' + label + '</button>';
  });
  document.getElementById('sectionTabs').innerHTML = html;
  document.querySelectorAll('.section-tab[data-sid]').forEach(function(btn) {
    btn.addEventListener('click', function() { goSection(parseInt(btn.dataset.sid)); });
  });
}
function goSection(id) { currentSection = id; renderTabs(); renderSection(id); window.scrollTo(0,0); }
function renderSection(id) {
  if (id === 7) { renderWeakNote(); return; }
  if (id === 8) { renderTokkuMode(); return; }
  var s = SECTIONS.find(function(x){ return x.id === id; }) || SECTIONS[id];
  var html = '<div class="progress-dots">';
  for (var i = 0; i <= 6; i++) {
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
  else if (id === 6) html += renderSection6();
  if (id >= 1 && id <= 5) {
    var nextLabel  = id < 5 ? '次のセクションへ →' : '🏆 結果を見る！';
    var nextAction = id < 5 ? 'goSection(' + (id+1) + ')' : 'showFinalResult()';
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

  // きょん＆西村 導入会話
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">電圧って「電気の圧力」だから高い方がすごいってこと？乾電池1.5Vとコンセント100Vは別物？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">いい質問だ。電圧は「電子を押す力の差」——水で言えば水位の差。乾電池は水位の差が1.5m、コンセントは100m分の勢いで水を押す。同じ管なら勢いが強いほど水がたくさん流れる、それが電流だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">電圧＝水位の差！電流＝流れる水の量！そして抵抗＝管の細さ！！すごいわかりやすい！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">完璧だ。この3つの関係が V＝I×R——オームの法則だ。三角形で求めたい文字を隠すだけで全パターン解ける。</div></div></div>'
    + '</div>';

  // 電圧とは何か（概念説明）
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">💡 電圧とは何か？（電位差・電池の働き）</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">電圧 ＝ 電位差（高低差で電流が流れる）</div>'
    + '<div class="ex">🔋 電池は「＋極（高電位）と－極（低電位）」の電位差を作る装置</div>'
    + '<div class="ex">電位差が大きいほど電子が強く押し流される → <span style="color:var(--gold)">電流が多く流れる</span></div>'
    + '<div class="ex">乾電池 1本 = 1.5V ／ 2本直列 = 3.0V ／ 家庭用コンセント = 100V</div>'
    + '<div class="note">💡 電圧計はいつも「並列」につなぐ——測りたい部品の両端にはさむように。</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">電流 ＝ 電子の流れ（単位時間に通過する電気量）</div>'
    + '<div class="ex">電流は「導線の中の電子が一斉に流れる」現象</div>'
    + '<div class="ex">電流計はいつも「直列」につなぐ——回路の中に割り込ませる。</div>'
    + '<div class="note">⚠️ 電流計を並列につなぐと大電流が流れて壊れる！</div>'
    + '</div>'
    + '</div>';

  // 単位一覧表
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 電流・電圧・抵抗の単位と測定器</div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    + '<tr style="background:#1e293b;color:var(--teal)"><th style="padding:8px 12px;border:1px solid #334155">量</th><th style="padding:8px 12px;border:1px solid #334155">単位</th><th style="padding:8px 12px;border:1px solid #334155">記号</th><th style="padding:8px 12px;border:1px solid #334155">測定器</th><th style="padding:8px 12px;border:1px solid #334155">つなぎ方</th></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold)">電流（I）</td><td style="padding:8px 12px;border:1px solid #334155">アンペア</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--teal)">A（mA）</td><td style="padding:8px 12px;border:1px solid #334155">電流計</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--green)">直列</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold)">電圧（V）</td><td style="padding:8px 12px;border:1px solid #334155">ボルト</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--teal)">V</td><td style="padding:8px 12px;border:1px solid #334155">電圧計</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--green)">並列</td></tr>'
    + '<tr><td style="padding:8px 12px;border:1px solid #334155;color:var(--gold)">抵抗（R）</td><td style="padding:8px 12px;border:1px solid #334155">オーム</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--teal)">Ω</td><td style="padding:8px 12px;border:1px solid #334155">—</td><td style="padding:8px 12px;border:1px solid #334155;color:var(--muted)">—</td></tr>'
    + '</table>'
    + '</div>'
    + '</div>';

  // オームの法則とV-Iグラフ SVG
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 オームの法則 ＋ V-I グラフ</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">'

    // オームの三角形 SVG
    + '<div style="flex:1;min-width:200px">'
    + '<div class="rule-title" style="margin-bottom:8px">① 三角形で覚える</div>'
    + '<svg width="200" height="160" viewBox="0 0 200 160" style="display:block;margin:0 auto">'
    + '<polygon points="100,10 10,150 190,150" fill="none" stroke="#e2a80e" stroke-width="2"/>'
    + '<line x1="100" y1="10" x2="100" y2="150" stroke="#e2a80e" stroke-width="1.5" stroke-dasharray="4,3"/>'
    + '<line x1="10" y1="150" x2="190" y2="150" stroke="#e2a80e" stroke-width="1.5"/>'
    + '<text x="100" y="38" text-anchor="middle" fill="#e2a80e" font-size="22" font-weight="bold">V</text>'
    + '<text x="52" y="148" text-anchor="middle" fill="#38bdf8" font-size="20" font-weight="bold">I</text>'
    + '<text x="148" y="148" text-anchor="middle" fill="#4ade80" font-size="20" font-weight="bold">R</text>'
    + '<text x="100" y="175" text-anchor="middle" fill="#94a3b8" font-size="11">求める文字を指で隠す</text>'
    + '</svg>'
    + '<div style="font-size:13px;line-height:2;margin-top:8px;padding:0 8px">'
    + '<div><span style="color:#e2a80e;font-weight:bold">Vを隠す</span> → I × R</div>'
    + '<div><span style="color:#38bdf8;font-weight:bold">Iを隠す</span> → V ÷ R</div>'
    + '<div><span style="color:#4ade80;font-weight:bold">Rを隠す</span> → V ÷ I</div>'
    + '</div>'
    + '</div>'

    // V-I 比例グラフ SVG
    + '<div style="flex:1;min-width:220px">'
    + '<div class="rule-title" style="margin-bottom:8px">② V-I グラフ（抵抗一定）</div>'
    + '<svg width="220" height="160" viewBox="0 0 220 160" style="display:block;margin:0 auto">'
    // 軸
    + '<line x1="30" y1="140" x2="200" y2="140" stroke="#475569" stroke-width="1.5"/>'
    + '<line x1="30" y1="140" x2="30"  y2="10"  stroke="#475569" stroke-width="1.5"/>'
    // 矢印
    + '<polygon points="200,136 208,140 200,144" fill="#475569"/>'
    + '<polygon points="26,10 30,2 34,10" fill="#475569"/>'
    // 軸ラベル
    + '<text x="210" y="144" fill="#94a3b8" font-size="12">I(A)</text>'
    + '<text x="14" y="9" fill="#94a3b8" font-size="12">V(V)</text>'
    // グリッド点
    + '<line x1="30" y1="100" x2="35" y2="100" stroke="#334155" stroke-width="1"/>'
    + '<text x="5" y="104" fill="#94a3b8" font-size="10">6</text>'
    + '<line x1="30" y1="60"  x2="35" y2="60"  stroke="#334155" stroke-width="1"/>'
    + '<text x="3" y="64"  fill="#94a3b8" font-size="10">12</text>'
    + '<line x1="90"  y1="140" x2="90"  y2="135" stroke="#334155" stroke-width="1"/>'
    + '<text x="82"  y="153" fill="#94a3b8" font-size="10">0.3</text>'
    + '<line x1="150" y1="140" x2="150" y2="135" stroke="#334155" stroke-width="1"/>'
    + '<text x="142" y="153" fill="#94a3b8" font-size="10">0.6</text>'
    // 比例グラフ線（傾き = R = 20Ω → V = 20I）
    + '<line x1="30" y1="140" x2="190" y2="20" stroke="#38bdf8" stroke-width="2.5"/>'
    // 点とラベル
    + '<circle cx="90" cy="100" r="4" fill="#e2a80e"/>'
    + '<text x="94" y="97" fill="#e2a80e" font-size="10">(0.3, 6)</text>'
    + '<circle cx="150" cy="60" r="4" fill="#e2a80e"/>'
    + '<text x="154" y="57" fill="#e2a80e" font-size="10">(0.6, 12)</text>'
    // 傾き注釈
    + '<text x="100" y="125" fill="#4ade80" font-size="11">傾き = R = 20Ω</text>'
    + '</svg>'
    + '<div style="font-size:12px;color:var(--text2);text-align:center;margin-top:4px">V-Iグラフは原点を通る直線<br>傾きが抵抗値（Ω）</div>'
    + '</div>'
    + '</div>'

    + '<div class="rule-box" style="margin-top:12px">'
    + '<div class="rule-title">3パターンの計算例（全部マスターしよう）</div>'
    + '<div class="ex">パターン①【Vを求める】 V ＝ I×R　電流0.5A・抵抗10Ω → V = 0.5×10 = <span style="color:var(--gold)">5 V</span></div>'
    + '<div class="ex">パターン②【Iを求める】 I ＝ V÷R　電圧6V・抵抗30Ω → I = 6÷30 = <span style="color:var(--gold)">0.2 A</span></div>'
    + '<div class="ex">パターン③【Rを求める】 R ＝ V÷I　電圧12V・電流0.4A → R = 12÷0.4 = <span style="color:var(--gold)">30 Ω</span></div>'
    + '</div>'
    + '</div>';

  // 選択肢問題（基礎確認）
  var choiceQs = [
    { jp:'電流計を回路につなぐ方法として正しいのはどれか。',
      answer:'直列につなぐ', choices:['直列につなぐ','並列につなぐ','どちらでもよい','電源に直接つなぐ'],
      exp:'電流計は回路に直列（一列）につなぐ。並列につなぐと抵抗がほぼ0になり大電流が流れて壊れる。' },
    { jp:'電圧計を回路につなぐ方法として正しいのはどれか。',
      answer:'並列につなぐ', choices:['並列につなぐ','直列につなぐ','どちらでもよい','電源に直接つなぐ'],
      exp:'電圧計は測定する素子に並列につなぐ。直列につなぐと電圧計の抵抗が大きいため電流がほぼ流れなくなる。' },
    { jp:'電流の単位はどれか。',
      answer:'A（アンペア）', choices:['A（アンペア）','V（ボルト）','Ω（オーム）','W（ワット）'],
      exp:'電流の単位はA（アンペア）。小さい電流はmA（ミリアンペア）で表す。1A = 1000mA。電流計は回路に直列につなぐ。' },
    { jp:'抵抗の単位はどれか。',
      answer:'Ω（オーム）', choices:['Ω（オーム）','A（アンペア）','V（ボルト）','Hz（ヘルツ）'],
      exp:'抵抗の単位はΩ（オーム）。電流の流れにくさを表す。導線は抵抗が小さく、電流が流れやすい。' },
    { jp:'600mAを Aに換算するといくらか。',
      answer:'0.6 A', choices:['0.6 A','60 A','6000 A','0.006 A'],
      exp:'1A = 1000mA なので、600mA = 600÷1000 = 0.6A。mA→Aは÷1000、A→mAは×1000。' },
    { jp:'電熱線の抵抗と電流の関係（電圧一定のとき）として正しいのはどれか。',
      answer:'抵抗が大きいほど電流は小さい',
      choices:['抵抗が大きいほど電流は小さい','抵抗が大きいほど電流も大きい','抵抗と電流は関係ない','抵抗が大きいと電圧が下がる'],
      exp:'V=IR より I=V/R。電圧Vが一定のとき、R（抵抗）が大きいほど I（電流）は小さくなる（反比例の関係）。' },
    { jp:'V-Iグラフで傾きが表すものはどれか。',
      answer:'抵抗（Ω）', choices:['抵抗（Ω）','電流（A）','電圧（V）','電力（W）'],
      exp:'V-Iグラフ（縦軸V、横軸I）の傾きは V÷I = R（抵抗）。傾きが急なほど抵抗が大きい。' },
    { jp:'電圧を2倍にすると電流はどうなるか（抵抗一定）。',
      answer:'2倍になる', choices:['2倍になる','変わらない','半分になる','4倍になる'],
      exp:'I = V÷R。Rが一定なら I は V に比例するので、電圧が2倍 → 電流も2倍。V-Iグラフが原点を通る直線になる理由。' },
  ];

  // 数値入力計算問題
  var inputQs = [
    { qid:'sci_elec_s1_i0', jp:'【計算①】抵抗20Ωの電熱線に電圧6Vをかけたとき、流れる電流は何Aか。（例：0.3）', answer:'0.3', xp:5 },
    { qid:'sci_elec_s1_i1', jp:'【計算②】電流0.5A・抵抗10Ωのとき、電圧は何Vか。（例：5）', answer:'5', xp:5 },
    { qid:'sci_elec_s1_i2', jp:'【計算③】電圧12V・電流0.4Aのとき、抵抗は何Ωか。（例：30）', answer:'30', xp:5 },
    { qid:'sci_elec_s1_i3', jp:'【計算④】抵抗50Ωの電熱線に電圧10Vをかけたとき、流れる電流は何Aか。（例：0.2）', answer:'0.2', xp:5 },
    { qid:'sci_elec_s1_i4', jp:'【計算⑤】電流2A・抵抗15Ωのとき、電圧は何Vか。（例：30）', answer:'30', xp:5 },
    { qid:'sci_elec_s1_i5', jp:'【計算⑥】電圧9V・電流0.3Aのとき、抵抗は何Ωか。（例：30）', answer:'30', xp:5 },
    { qid:'sci_elec_s1_i6', jp:'【計算⑦】400mAをAに換算すると何Aか。（例：0.4）', answer:'0.4', xp:4 },
    { qid:'sci_elec_s1_i7', jp:'【計算⑧】0.25AをmAに換算すると何mAか。（例：250）', answer:'250', xp:4 },
  ];

  // 入力問題の解説を exp_card として追加するために makeFeedbackInput helper
  function makeInputWithExp(qid, jp, answer, xpPts, expText) {
    qMeta[qid] = Object.assign(qMeta[qid] || {}, { type:'input', answer:answer, xp:xpPts, jp:jp });
    var done = answeredSet[qid];
    return '<div class="q-card" data-card="' + qid + '" ' + (done ? 'style="border-color:var(--green)"' : '') + '>'
      + '<div class="q-text">' + jp + '</div>'
      + (done
        ? '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"></div>'
        : '<div class="input-wrap">'
          + '<input class="q-input" id="inp_' + qid + '" type="text" placeholder="数値を入力...">'
          + '<button class="input-submit" data-qid="' + qid + '">確認</button>'
          + '</div>')
      + '<div class="exp-card" id="exp_' + qid + '" style="' + (done ? 'display:block' : 'display:none') + '">'
      + '<div class="exp-card-title">📌 解説</div>'
      + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + expText + '</div>'
      + '</div>'
      + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
      + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度チャレンジ！</div>'
      + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
      + (done ? getComment('nishi_correct') : '')
      + '</div>'
      + '</div>';
  }

  var inputExps = [
    'I = V÷R = 6÷20 = 0.3A。三角形でIを隠すとV÷Rが残る。',
    'V = I×R = 0.5×10 = 5V。三角形でVを隠すとI×Rが残る。',
    'R = V÷I = 12÷0.4 = 30Ω。三角形でRを隠すとV÷Iが残る。',
    'I = V÷R = 10÷50 = 0.2A。÷50がポイント。',
    'V = I×R = 2×15 = 30V。電流が大きいと電圧も大きい。',
    'R = V÷I = 9÷0.3 = 30Ω。9÷0.3 = 90÷3 = 30と計算してもOK。',
    '1A = 1000mA なので 400mA÷1000 = 0.4A。mA→Aは÷1000。',
    '1A = 1000mA なので 0.25×1000 = 250mA。A→mAは×1000。',
  ];

  html += '<div class="rule-card"><div class="rule-card-title">✏️ 計算練習（数値入力）— 答えは数字のみ</div></div>';
  inputQs.forEach(function(q, i) {
    html += makeInputWithExp(q.qid, q.jp, q.answer, q.xp, inputExps[i]);
  });

  html += '<div class="rule-card"><div class="rule-card-title">📋 基礎確認（選択）</div></div>';
  choiceQs.forEach(function(q, i) { q._qid = 'sci_elec_s1_q' + i; });
  choiceQs = shuffleArray(choiceQs);
  choiceQs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });

  return html;
}

// ===== SECTION 2: 直列回路 =====
function renderSection2() {
  var html = '';

  // きょん＆西村 導入会話
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">直列って「直（じか）につなぐ」から直列？電球を1本のひもみたいにつないでいくやつ？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">いいイメージだ。電流の通り道が1本しかない——だから電流はどこで測っても必ず同じ値になる。水道管が1本つながっていると思えばいい。水は途中で消えないから流量はどこでも同じだろう？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">電流＝水の流量！1本道だから量は変わらない！！でも電圧は抵抗ごとに消費されるってこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">完璧だ。「電流は一定、電圧は分担」——この2行が直列回路の全てだ。</div></div></div>'
    + '</div>';

  // 直列回路とは + 回路図 SVG
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔌 直列回路の模式図</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start">'

    // 直列回路図 SVG
    + '<div style="flex:1;min-width:260px">'
    + '<div class="rule-title" style="margin-bottom:8px">電池→R₁→R₂（1本道）</div>'
    + '<svg width="280" height="160" viewBox="0 0 280 160" style="display:block;margin:0 auto;overflow:visible">'
    // 上側の導線
    + '<line x1="30" y1="40" x2="250" y2="40" stroke="#38bdf8" stroke-width="2"/>'
    // 下側の導線
    + '<line x1="30" y1="120" x2="250" y2="120" stroke="#38bdf8" stroke-width="2"/>'
    // 左の導線（電池へ）
    + '<line x1="30" y1="40" x2="30" y2="120" stroke="#38bdf8" stroke-width="2"/>'
    // 右の導線（R2から）
    + '<line x1="250" y1="40" x2="250" y2="120" stroke="#38bdf8" stroke-width="2"/>'

    // 電池（左縦）
    + '<line x1="22" y1="65" x2="38" y2="65" stroke="#e2a80e" stroke-width="3"/>'
    + '<line x1="25" y1="75" x2="35" y2="75" stroke="#e2a80e" stroke-width="2"/>'
    + '<text x="30" y="94" text-anchor="middle" fill="#e2a80e" font-size="11">電池</text>'
    + '<text x="30" y="106" text-anchor="middle" fill="#e2a80e" font-size="10">12V</text>'

    // R1 抵抗（上側中央左）
    + '<rect x="80" y="32" width="50" height="16" fill="#1e3a5f" stroke="#38bdf8" stroke-width="1.5" rx="3"/>'
    + '<text x="105" y="44" text-anchor="middle" fill="#38bdf8" font-size="12" font-weight="bold">R₁</text>'
    + '<text x="105" y="58" text-anchor="middle" fill="#94a3b8" font-size="10">10 Ω</text>'
    + '<text x="105" y="69" text-anchor="middle" fill="#e2a80e" font-size="10">V₁ = ?</text>'

    // R2 抵抗（上側中央右）
    + '<rect x="155" y="32" width="50" height="16" fill="#1e3a5f" stroke="#4ade80" stroke-width="1.5" rx="3"/>'
    + '<text x="180" y="44" text-anchor="middle" fill="#4ade80" font-size="12" font-weight="bold">R₂</text>'
    + '<text x="180" y="58" text-anchor="middle" fill="#94a3b8" font-size="10">20 Ω</text>'
    + '<text x="180" y="69" text-anchor="middle" fill="#e2a80e" font-size="10">V₂ = ?</text>'

    // 電流の矢印（上側）
    + '<polygon points="130,34 138,38 130,42" fill="#fbbf24"/>'
    + '<text x="135" y="28" text-anchor="middle" fill="#fbbf24" font-size="10">I →</text>'

    // 電流の矢印（下側）
    + '<polygon points="150,116 142,120 150,124" fill="#fbbf24"/>'
    + '<text x="145" y="136" text-anchor="middle" fill="#fbbf24" font-size="10">← I</text>'

    // 電源電圧ラベル
    + '<text x="145" y="155" text-anchor="middle" fill="#e2a80e" font-size="11">電源電圧 V = 12V</text>'
    + '</svg>'
    + '</div>'

    // 電圧分配 説明図 SVG
    + '<div style="flex:1;min-width:220px">'
    + '<div class="rule-title" style="margin-bottom:8px">電圧の分かれ方（分担）</div>'
    + '<svg width="220" height="160" viewBox="0 0 220 160" style="display:block;margin:0 auto">'
    // 棒グラフ風の電圧分配
    + '<rect x="20" y="20" width="50" height="120" fill="none" stroke="#475569" stroke-width="1.5" rx="4"/>'
    + '<text x="45" y="14" text-anchor="middle" fill="#94a3b8" font-size="11">全体 12V</text>'
    // V1 部分（40px = 4V分）
    + '<rect x="20" y="20" width="50" height="40" fill="rgba(56,189,248,0.25)" stroke="#38bdf8" stroke-width="1" rx="4"/>'
    + '<text x="45" y="46" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="bold">V₁</text>'
    + '<text x="45" y="60" text-anchor="middle" fill="#38bdf8" font-size="11">4 V</text>'
    // V2 部分（80px = 8V分）
    + '<rect x="20" y="60" width="50" height="80" fill="rgba(74,222,128,0.25)" stroke="#4ade80" stroke-width="1" rx="4"/>'
    + '<text x="45" y="100" text-anchor="middle" fill="#4ade80" font-size="13" font-weight="bold">V₂</text>'
    + '<text x="45" y="116" text-anchor="middle" fill="#4ade80" font-size="11">8 V</text>'
    // 矢印と式
    + '<text x="85" y="50" fill="#38bdf8" font-size="12">V₁ = I×R₁</text>'
    + '<text x="85" y="65" fill="#38bdf8" font-size="12">= 0.4×10</text>'
    + '<text x="85" y="80" fill="#38bdf8" font-size="12">= 4 V</text>'
    + '<text x="85" y="105" fill="#4ade80" font-size="12">V₂ = I×R₂</text>'
    + '<text x="85" y="120" fill="#4ade80" font-size="12">= 0.4×20</text>'
    + '<text x="85" y="135" fill="#4ade80" font-size="12">= 8 V</text>'
    + '<text x="45" y="152" text-anchor="middle" fill="#e2a80e" font-size="10">4+8 = 12V ✓</text>'
    + '</svg>'
    + '</div>'
    + '</div>'
    + '</div>';

  // 直列回路の3つのルール
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 直列回路の3つのルール（暗記必須）</div>'
    + '<div class="rule-box" style="border-left:3px solid var(--gold)">'
    + '<div class="rule-title" style="color:var(--gold)">① 電流はどこでも同じ</div>'
    + '<div class="ex">I₁ ＝ I₂ ＝ I（全部同じ）</div>'
    + '<div class="note">💡 1本道だから電流は分かれようがない。消えない水のイメージ。</div>'
    + '</div>'
    + '<div class="rule-box" style="border-left:3px solid var(--teal)">'
    + '<div class="rule-title" style="color:var(--teal)">② 電圧は分担する（合計＝電源電圧）</div>'
    + '<div class="ex">V ＝ V₁ ＋ V₂ （全体 ＝ 各部分の合計）</div>'
    + '<div class="ex">各部分の電圧：V₁ ＝ I×R₁　V₂ ＝ I×R₂</div>'
    + '<div class="note">💡 抵抗が大きい部品ほど多くの電圧を受け持つ（比例関係）。</div>'
    + '</div>'
    + '<div class="rule-box" style="border-left:3px solid var(--red)">'
    + '<div class="rule-title" style="color:var(--red)">③ 合成抵抗 ＝ 足すだけ</div>'
    + '<div class="ex">R ＝ R₁ ＋ R₂</div>'
    + '<div class="ex">例：10Ωと20Ωを直列 → 合成抵抗 = 10+20 = <span style="color:var(--gold)">30Ω</span></div>'
    + '<div class="note">💡 直列は「抵抗の障害物が増える」→ 全体抵抗は必ず大きくなる。</div>'
    + '</div>'
    + '</div>';

  // 解き方の手順
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔑 直列回路の解き方（手順）</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">STEP 1：合成抵抗を求める（R = R₁ + R₂）</div>'
    + '<div class="rule-title">STEP 2：全体の電流を求める（I = V ÷ R）</div>'
    + '<div class="rule-title">STEP 3：各部分の電圧を求める（V₁ = I×R₁、V₂ = I×R₂）</div>'
    + '<div class="rule-title">STEP 4：確認（V₁ + V₂ = V になっているか）</div>'
    + '<div class="ex" style="margin-top:8px">例：電源12V・R₁=10Ω・R₂=20Ω</div>'
    + '<div class="ex">STEP1：R = 10+20 = 30Ω</div>'
    + '<div class="ex">STEP2：I = 12÷30 = <span style="color:var(--gold)">0.4A</span></div>'
    + '<div class="ex">STEP3：V₁ = 0.4×10 = <span style="color:var(--teal)">4V</span>　V₂ = 0.4×20 = <span style="color:var(--green)">8V</span></div>'
    + '<div class="ex">STEP4：4+8 = <span style="color:var(--gold)">12V ✓</span></div>'
    + '</div>'
    + '</div>';

  // ---- 入力形式 計算問題 ----
  function makeS2Input(qid, jp, answer, xpPts, expText) {
    qMeta[qid] = Object.assign(qMeta[qid] || {}, { type:'input', answer:answer, xp:xpPts, jp:jp });
    var done = answeredSet[qid];
    return '<div class="q-card" data-card="' + qid + '" ' + (done ? 'style="border-color:var(--green)"' : '') + '>'
      + '<div class="q-text">' + jp + '</div>'
      + (done
        ? '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"></div>'
        : '<div class="input-wrap">'
          + '<input class="q-input" id="inp_' + qid + '" type="text" placeholder="数値を入力...">'
          + '<button class="input-submit" data-qid="' + qid + '">確認</button>'
          + '</div>')
      + '<div class="exp-card" id="exp_' + qid + '" style="' + (done ? 'display:block' : 'display:none') + '">'
      + '<div class="exp-card-title">📌 解説</div>'
      + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + expText + '</div>'
      + '</div>'
      + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
      + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度チャレンジ！</div>'
      + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
      + (done ? getComment('nishi_correct') : '')
      + '</div>'
      + '</div>';
  }

  html += '<div class="rule-card"><div class="rule-card-title">✏️ 直列回路 計算練習（数値入力）</div></div>';

  html += makeS2Input('sci_elec_s2_i0',
    '【計算①】10Ωと20Ωの抵抗を直列につないだときの合成抵抗は何Ωか。',
    '30',  5,
    'R = R₁+R₂ = 10+20 = 30Ω。直列の合成抵抗は足すだけ！');

  html += makeS2Input('sci_elec_s2_i1',
    '【計算②】電源電圧12V・合成抵抗30Ωの直列回路に流れる電流は何Aか。',
    '0.4', 5,
    'I = V÷R = 12÷30 = 0.4A。直列では全体にこの電流が流れる。');

  html += makeS2Input('sci_elec_s2_i2',
    '【計算③】電源電圧12V・R₁=10Ω・R₂=20Ωの直列回路で、R₁にかかる電圧V₁は何Vか。（I=0.4A）',
    '4',   5,
    'V₁ = I×R₁ = 0.4×10 = 4V。電流はどこでも0.4Aなので各部分にオームの法則を使う。');

  html += makeS2Input('sci_elec_s2_i3',
    '【計算④】電源電圧12V・R₁=10Ω・R₂=20Ωの直列回路で、R₂にかかる電圧V₂は何Vか。（I=0.4A）',
    '8',   5,
    'V₂ = I×R₂ = 0.4×20 = 8V。確認：V₁+V₂ = 4+8 = 12V ✓（電源電圧に一致）');

  html += makeS2Input('sci_elec_s2_i4',
    '【計算⑤】R₁=15Ω・R₂=5Ωを直列につなぎ電源電圧を10Vかけたとき、流れる電流は何Aか。',
    '0.5', 5,
    '合成抵抗 R = 15+5 = 20Ω。電流 I = V÷R = 10÷20 = 0.5A。');

  html += makeS2Input('sci_elec_s2_i5',
    '【計算⑥】上の回路（電源10V・I=0.5A）で、R₁=15Ωにかかる電圧V₁は何Vか。',
    '7.5', 5,
    'V₁ = I×R₁ = 0.5×15 = 7.5V。確認：V₁+V₂ = 7.5+2.5 = 10V ✓');

  html += makeS2Input('sci_elec_s2_i6',
    '【計算⑦】直列回路で電源電圧18V・R₁=6Ω・R₂=?Ωのとき、電流が1Aであった。R₂は何Ωか。',
    '12',  6,
    '合成抵抗 R = V÷I = 18÷1 = 18Ω。R₂ = R-R₁ = 18-6 = 12Ω。合成抵抗から引けば求まる。');

  html += makeS2Input('sci_elec_s2_i7',
    '【計算⑧】直列回路にR₁=20Ω・R₂=30Ωをつなぎ、R₁の電圧が8Vであった。電源電圧は何Vか。',
    '20',  6,
    '電流 I = V₁÷R₁ = 8÷20 = 0.4A。V₂ = I×R₂ = 0.4×30 = 12V。電源電圧 = V₁+V₂ = 8+12 = 20V。');

  // ---- 選択問題（概念確認）----
  html += '<div class="rule-card"><div class="rule-card-title">📋 基礎確認（選択）</div></div>';

  var qs = [
    { jp:'直列回路での電流の特徴はどれか。',
      answer:'どこでも同じ大きさ', choices:['どこでも同じ大きさ','枝ごとに分かれる','電源に近いほど大きい','抵抗に比例する'],
      exp:'直列回路は1本道。電流は分かれないのでどこでも同じ。電源から出た電流がそのまま1本道を流れる。' },
    { jp:'直列回路で各抵抗にかかる電圧の合計はどうなるか。',
      answer:'電源電圧に等しい', choices:['電源電圧に等しい','電源電圧より大きい','電源電圧より小さい','抵抗の数で割った値'],
      exp:'直列回路：V = V₁+V₂。各部分の電圧の合計は必ず電源電圧に等しい。これが電圧保存則。' },
    { jp:'直列回路でより大きい抵抗にかかる電圧はどうなるか。',
      answer:'大きくなる（比例関係）', choices:['大きくなる（比例関係）','小さくなる','変わらない','抵抗と関係ない'],
      exp:'V = I×R より、電流Iが同じなら、抵抗Rが大きい部品ほど電圧Vが大きくなる（比例）。' },
    { jp:'直列回路の合成抵抗の求め方はどれか。',
      answer:'R = R₁ + R₂（足すだけ）', choices:['R = R₁ + R₂（足すだけ）','R = R₁ × R₂','1/R = 1/R₁ + 1/R₂','R = R₁ - R₂'],
      exp:'直列の合成抵抗 = R₁+R₂。簡単に足すだけ！抵抗が増えるので合成抵抗はどちらの抵抗より大きくなる。' },
    { jp:'直列回路で一方の電球が切れたとき、もう一方はどうなるか。',
      answer:'消える（電流が流れなくなる）', choices:['消える（電流が流れなくなる）','そのまま点灯する','明るくなる','暗くなる'],
      exp:'直列は1本道。どこか1つが断線すると道が完全に切れて、全ての電球が消える。古いクリスマスイルミネーションが1つ切れると全部消えるのはこのため。' },
    { jp:'電源電圧6V・R₁=10Ω・R₂=20Ωの直列回路に流れる電流はいくらか。',
      answer:'0.2 A', choices:['0.2 A','0.3 A','1 A','0.6 A'],
      exp:'合成抵抗 R = 10+20 = 30Ω。電流 I = V÷R = 6÷30 = 0.2A。直列では全体にこの電流が流れる。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_elec_s2_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

// ===== SECTION 3: 並列回路 =====
function renderSection3() {
  var html = '';

  // きょん＆西村 導入会話
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">並列って道が分かれてるやつでしょ？でも分岐したら電流ってどうなるの？電源から来た電流が2つに割れるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">そう、電流は分岐したところで分かれる。ただし電圧は分かれない——各枝に全部同じ電圧がかかる。コンセントをイメージしよう。壁の100Vから何本もタコ足配線しても、それぞれのコンセントに100Vがかかるだろう？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">分岐したら電流が分かれるんだ！！電圧は共通で電流は分担！！直列と逆だ！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">完璧だ。「電圧は共通、電流は分担」——これが並列回路の全てだ。家庭のコンセントが全部並列なのは、どの機器も同じ100Vで動くようにするためだよ。</div></div></div>'
    + '</div>';

  // 並列回路図 + 電流分配図
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔌 並列回路の模式図</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start">'

    // 並列回路図 SVG
    + '<div style="flex:1;min-width:260px">'
    + '<div class="rule-title" style="margin-bottom:8px">電池から R₁・R₂ が分岐</div>'
    + '<svg width="280" height="180" viewBox="0 0 280 180" style="display:block;margin:0 auto;overflow:visible">'
    // 左縦の導線（電源側）
    + '<line x1="30" y1="20" x2="30" y2="160" stroke="#38bdf8" stroke-width="2"/>'
    // 右縦の導線（戻り側）
    + '<line x1="250" y1="20" x2="250" y2="160" stroke="#38bdf8" stroke-width="2"/>'
    // 上側の水平导线
    + '<line x1="30" y1="20" x2="250" y2="20" stroke="#38bdf8" stroke-width="2"/>'
    // 下側の水平导线
    + '<line x1="30" y1="160" x2="250" y2="160" stroke="#38bdf8" stroke-width="2"/>'
    // R1 の枝（上段）
    + '<line x1="30" y1="60" x2="80" y2="60" stroke="#38bdf8" stroke-width="2"/>'
    + '<line x1="180" y1="60" x2="250" y2="60" stroke="#38bdf8" stroke-width="2"/>'
    // R2 の枝（下段）
    + '<line x1="30" y1="120" x2="80" y2="120" stroke="#4ade80" stroke-width="2"/>'
    + '<line x1="180" y1="120" x2="250" y2="120" stroke="#4ade80" stroke-width="2"/>'
    // 電池（左縦中央）
    + '<line x1="22" y1="85" x2="38" y2="85" stroke="#e2a80e" stroke-width="3"/>'
    + '<line x1="25" y1="95" x2="35" y2="95" stroke="#e2a80e" stroke-width="2"/>'
    + '<text x="14" y="105" fill="#e2a80e" font-size="10">12V</text>'
    // R1 抵抗ボックス
    + '<rect x="80" y="52" width="100" height="16" fill="#1e3a5f" stroke="#38bdf8" stroke-width="1.5" rx="3"/>'
    + '<text x="130" y="64" text-anchor="middle" fill="#38bdf8" font-size="12" font-weight="bold">R₁ = 6 Ω</text>'
    + '<text x="130" y="78" text-anchor="middle" fill="#e2a80e" font-size="10">I₁ = V÷R₁ = 2A →</text>'
    // R2 抵抗ボックス
    + '<rect x="80" y="112" width="100" height="16" fill="#1e3a5f" stroke="#4ade80" stroke-width="1.5" rx="3"/>'
    + '<text x="130" y="124" text-anchor="middle" fill="#4ade80" font-size="12" font-weight="bold">R₂ = 12 Ω</text>'
    + '<text x="130" y="138" text-anchor="middle" fill="#e2a80e" font-size="10">I₂ = V÷R₂ = 1A →</text>'
    // 電源電流
    + '<text x="15" y="50" fill="#fbbf24" font-size="10">↑</text>'
    + '<text x="6" y="42" fill="#fbbf24" font-size="9">3A</text>'
    // 電源電圧ラベル
    + '<text x="140" y="176" text-anchor="middle" fill="#e2a80e" font-size="11">電源電圧 V = 12V（各枝も12V）</text>'
    + '</svg>'
    + '</div>'

    // 電流分配図 SVG
    + '<div style="flex:1;min-width:220px">'
    + '<div class="rule-title" style="margin-bottom:8px">電流の分かれ方（分担）</div>'
    + '<svg width="220" height="180" viewBox="0 0 220 180" style="display:block;margin:0 auto">'
    // 全体電流 3A
    + '<line x1="30" y1="90" x2="80" y2="90" stroke="#fbbf24" stroke-width="3"/>'
    + '<polygon points="74,85 84,90 74,95" fill="#fbbf24"/>'
    + '<text x="50" y="83" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="bold">3A</text>'
    + '<text x="50" y="108" text-anchor="middle" fill="#94a3b8" font-size="10">全体</text>'
    // 分岐点
    + '<circle cx="90" cy="90" r="5" fill="#e2a80e"/>'
    // I1 の矢印（上）
    + '<line x1="90" y1="90" x2="90" y2="45" stroke="#38bdf8" stroke-width="2"/>'
    + '<line x1="90" y1="45" x2="170" y2="45" stroke="#38bdf8" stroke-width="2"/>'
    + '<polygon points="164,40 174,45 164,50" fill="#38bdf8"/>'
    + '<text x="130" y="38" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="bold">2A</text>'
    + '<text x="130" y="55" text-anchor="middle" fill="#38bdf8" font-size="10">R₁=6Ω の枝</text>'
    // I2 の矢印（下）
    + '<line x1="90" y1="90" x2="90" y2="135" stroke="#4ade80" stroke-width="2"/>'
    + '<line x1="90" y1="135" x2="170" y2="135" stroke="#4ade80" stroke-width="2"/>'
    + '<polygon points="164,130 174,135 164,140" fill="#4ade80"/>'
    + '<text x="130" y="128" text-anchor="middle" fill="#4ade80" font-size="13" font-weight="bold">1A</text>'
    + '<text x="130" y="148" text-anchor="middle" fill="#4ade80" font-size="10">R₂=12Ω の枝</text>'
    // 検算
    + '<text x="110" y="170" text-anchor="middle" fill="#e2a80e" font-size="11">2+1 = 3A ✓</text>'
    + '</svg>'
    + '</div>'
    + '</div>'
    + '</div>';

  // 並列回路の3つのルール
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 並列回路の3つのルール（暗記必須）</div>'
    + '<div class="rule-box" style="border-left:3px solid var(--teal)">'
    + '<div class="rule-title" style="color:var(--teal)">① 電圧はどこでも同じ（電源電圧＝各枝）</div>'
    + '<div class="ex">V₁ ＝ V₂ ＝ V（全部電源電圧と同じ）</div>'
    + '<div class="note">💡 コンセントのイメージ——どの差し込み口も100V。並列は電圧を全員に配る。</div>'
    + '</div>'
    + '<div class="rule-box" style="border-left:3px solid var(--gold)">'
    + '<div class="rule-title" style="color:var(--gold)">② 電流は分担する（合計＝全体電流）</div>'
    + '<div class="ex">I ＝ I₁ ＋ I₂ （全体 ＝ 各枝の合計）</div>'
    + '<div class="ex">各枝の電流：I₁ ＝ V÷R₁　I₂ ＝ V÷R₂</div>'
    + '<div class="note">💡 抵抗が小さい枝ほど多くの電流が流れる（反比例）。</div>'
    + '</div>'
    + '<div class="rule-box" style="border-left:3px solid var(--green)">'
    + '<div class="rule-title" style="color:var(--green)">③ 合成抵抗は逆数で計算</div>'
    + '<div class="ex">1/R ＝ 1/R₁ ＋ 1/R₂　→ R を求める</div>'
    + '<div class="ex">例：6Ωと12Ωを並列 → 1/R = 1/6+1/12 = 2/12+1/12 = 3/12 = 1/4 → <span style="color:var(--gold)">R = 4Ω</span></div>'
    + '<div class="note">💡 並列は「道が増える」→ 合成抵抗は各抵抗より必ず小さくなる。</div>'
    + '</div>'
    + '</div>';

  // 直列 vs 並列 比較表 SVG
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📊 直列 vs 並列 まとめ比較</div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px">'
    + '<tr style="background:#1e293b;color:var(--teal)"><th style="padding:10px 14px;border:1px solid #334155"> </th><th style="padding:10px 14px;border:1px solid #334155">🔵 直列回路</th><th style="padding:10px 14px;border:1px solid #334155">🟢 並列回路</th></tr>'
    + '<tr><td style="padding:10px 14px;border:1px solid #334155;color:var(--text2);font-weight:bold">電流（A）</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--gold)">✅ どこでも同じ（I₁=I₂=I）</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--teal)">枝ごとに分かれる（I=I₁+I₂）</td></tr>'
    + '<tr><td style="padding:10px 14px;border:1px solid #334155;color:var(--text2);font-weight:bold">電圧（V）</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--teal)">各部分に分かれる（V=V₁+V₂）</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--gold)">✅ どこでも同じ（V₁=V₂=V）</td></tr>'
    + '<tr><td style="padding:10px 14px;border:1px solid #334155;color:var(--text2);font-weight:bold">合成抵抗</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--red)">R=R₁+R₂（足すだけ・大きくなる）</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--green)">1/R=1/R₁+1/R₂（逆数・小さくなる）</td></tr>'
    + '<tr><td style="padding:10px 14px;border:1px solid #334155;color:var(--text2);font-weight:bold">断線時</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--red)">全部消える（1本道が切れる）</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--green)">他の枝は影響なし</td></tr>'
    + '<tr><td style="padding:10px 14px;border:1px solid #334155;color:var(--text2);font-weight:bold">身近な例</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--text2)">古いクリスマスツリー電球</td><td style="padding:10px 14px;border:1px solid #334155;color:var(--text2)">家庭のコンセント・電球</td></tr>'
    + '</table>'
    + '</div>'
    + '</div>';

  // 解き方の手順
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔑 並列回路の解き方（手順）</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">STEP 1：各枝の電流を求める（Iₙ = V÷Rₙ）※電圧は全枝共通</div>'
    + '<div class="rule-title">STEP 2：全体電流を求める（I = I₁ + I₂）</div>'
    + '<div class="rule-title">STEP 3：合成抵抗を求める（1/R = 1/R₁ + 1/R₂）</div>'
    + '<div class="rule-title">STEP 4：確認（I = V÷R になっているか）</div>'
    + '<div class="ex" style="margin-top:8px">例：電源12V・R₁=6Ω・R₂=12Ω</div>'
    + '<div class="ex">STEP1：I₁ = 12÷6 = <span style="color:var(--teal)">2A</span>　I₂ = 12÷12 = <span style="color:var(--green)">1A</span></div>'
    + '<div class="ex">STEP2：I = 2+1 = <span style="color:var(--gold)">3A</span></div>'
    + '<div class="ex">STEP3：1/R = 1/6+1/12 = 3/12 = 1/4 → R = <span style="color:var(--red)">4Ω</span></div>'
    + '<div class="ex">STEP4：V÷R = 12÷4 = <span style="color:var(--gold)">3A ✓</span></div>'
    + '</div>'
    + '</div>';

  // ---- 入力計算問題 ----
  function makeS3Input(qid, jp, answer, xpPts, expText) {
    qMeta[qid] = Object.assign(qMeta[qid] || {}, { type:'input', answer:answer, xp:xpPts, jp:jp });
    var done = answeredSet[qid];
    return '<div class="q-card" data-card="' + qid + '" ' + (done ? 'style="border-color:var(--green)"' : '') + '>'
      + '<div class="q-text">' + jp + '</div>'
      + (done
        ? '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"></div>'
        : '<div class="input-wrap">'
          + '<input class="q-input" id="inp_' + qid + '" type="text" placeholder="数値を入力...">'
          + '<button class="input-submit" data-qid="' + qid + '">確認</button>'
          + '</div>')
      + '<div class="exp-card" id="exp_' + qid + '" style="' + (done ? 'display:block' : 'display:none') + '">'
      + '<div class="exp-card-title">📌 解説</div>'
      + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + expText + '</div>'
      + '</div>'
      + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
      + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度チャレンジ！</div>'
      + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
      + (done ? getComment('nishi_correct') : '')
      + '</div>'
      + '</div>';
  }

  html += '<div class="rule-card"><div class="rule-card-title">✏️ 並列回路 計算練習（数値入力）</div></div>';

  html += makeS3Input('sci_elec_s3_i0',
    '【計算①】電源電圧12V・R₁=6Ωの並列回路で、R₁に流れる電流I₁は何Aか。',
    '2', 5,
    'I₁ = V÷R₁ = 12÷6 = 2A。並列では各枝の電圧 = 電源電圧 = 12V。各枝ごとにオームの法則を使う。');

  html += makeS3Input('sci_elec_s3_i1',
    '【計算②】電源電圧12V・R₂=12Ωの並列回路で、R₂に流れる電流I₂は何Aか。',
    '1', 5,
    'I₂ = V÷R₂ = 12÷12 = 1A。電流は抵抗に反比例（抵抗が大きいほど電流は小さい）。');

  html += makeS3Input('sci_elec_s3_i2',
    '【計算③】上の並列回路（I₁=2A・I₂=1A）で電源から流れ出る全体の電流は何Aか。',
    '3', 5,
    'I = I₁+I₂ = 2+1 = 3A。並列では全体電流＝各枝の電流の合計。');

  html += makeS3Input('sci_elec_s3_i3',
    '【計算④】6Ωと12Ωを並列につないだときの合成抵抗は何Ωか。（1/R = 1/6 + 1/12）',
    '4', 6,
    '1/R = 1/6+1/12 = 2/12+1/12 = 3/12 = 1/4 → R = 4Ω。並列の合成抵抗は各抵抗より小さくなる（4 < 6 < 12 ✓）。');

  html += makeS3Input('sci_elec_s3_i4',
    '【計算⑤】10Ωと10Ωを並列につないだときの合成抵抗は何Ωか。',
    '5', 5,
    '1/R = 1/10+1/10 = 2/10 → R = 5Ω。同じ抵抗を2つ並列にすると合成抵抗は半分になる。');

  html += makeS3Input('sci_elec_s3_i5',
    '【計算⑥】電源電圧20V・R₁=4Ω・R₂=20Ωの並列回路で、全体の電流は何Aか。',
    '6', 6,
    'I₁ = 20÷4 = 5A。I₂ = 20÷20 = 1A。I = 5+1 = 6A。各枝の電圧は全部20V。');

  html += makeS3Input('sci_elec_s3_i6',
    '【計算⑦】並列回路で全体電流3A・R₁の電流1A のとき、R₂を流れる電流は何Aか。',
    '2', 5,
    'I = I₁+I₂ → I₂ = I-I₁ = 3-1 = 2A。全体電流から枝1を引けば枝2が出る。');

  html += makeS3Input('sci_elec_s3_i7',
    '【計算⑧】電源電圧6V・R₁=3Ω・R₂=6Ωの並列回路の合成抵抗は何Ωか。',
    '2', 6,
    '1/R = 1/3+1/6 = 2/6+1/6 = 3/6 = 1/2 → R = 2Ω。確認：I = 6÷2 = 3A = (6÷3)+(6÷6) = 2+1 = 3A ✓');

  // ---- 選択問題 ----
  html += '<div class="rule-card"><div class="rule-card-title">📋 基礎確認（選択）</div></div>';

  var qs = [
    { jp:'並列回路での電圧の特徴はどれか。',
      answer:'全枝で電源電圧と同じ', choices:['全枝で電源電圧と同じ','枝ごとに分かれる','抵抗が大きいほど電圧が大きい','合計が電源電圧'],
      exp:'並列回路では各枝の電圧 = 電源電圧（全部等しい）。コンセントが全部100Vなのと同じ原理。' },
    { jp:'並列回路での電流の特徴はどれか。',
      answer:'枝ごとに分かれる（合計＝全体）', choices:['枝ごとに分かれる（合計＝全体）','全枝で同じ','電源に近いほど大きい','電圧に反比例する'],
      exp:'並列では電流は分岐して各枝に流れる。I = I₁+I₂。抵抗が小さい枝ほど多く流れる。' },
    { jp:'並列回路で一方の電球が切れたとき、もう一方はどうなるか。',
      answer:'そのまま点灯し続ける', choices:['そのまま点灯し続ける','一緒に消える','明るくなる','暗くなる'],
      exp:'並列では各枝が独立。一方が断線しても他の枝に影響しない。家庭の電球が並列なのはこのため。' },
    { jp:'並列の合成抵抗の性質について正しいのはどれか。',
      answer:'各抵抗のどれよりも小さくなる', choices:['各抵抗のどれよりも小さくなる','各抵抗のどれよりも大きくなる','各抵抗の平均値になる','変わらない'],
      exp:'並列は「道が増える」ので電流が通りやすくなる＝抵抗が減る。合成抵抗は必ず最小の枝の抵抗より小さい。' },
    { jp:'電源電圧9V・R₁=3Ωの並列回路でR₁に流れる電流はいくらか。',
      answer:'3 A', choices:['3 A','0.33 A','27 A','1 A'],
      exp:'並列では各枝に電源電圧がかかる。I₁ = V÷R₁ = 9÷3 = 3A。' },
    { jp:'4Ωと4Ωを並列につないだ合成抵抗はいくらか。',
      answer:'2 Ω', choices:['2 Ω','8 Ω','4 Ω','16 Ω'],
      exp:'1/R = 1/4+1/4 = 2/4 = 1/2 → R = 2Ω。同じ抵抗2本の並列は半分になる。' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_elec_s3_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

// ===== SECTION 4: 電力・電熱・磁界 =====
function renderSection4() {
  var html = '';

  // きょん＆西村 導入会話
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚡ きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">電力ってワットでしょ？ドライヤーに1200Wって書いてある。あれって何の数字？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">1秒間に1200Jのエネルギーを消費するという意味だ。電力 = 電圧 × 電流——家のコンセント100Vに繋いだら12Aの電流が流れることになる。だからドライヤーはブレーカーが落ちやすい。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">W = V×I！！だから大きいワット数ほど電気をたくさん食うってこと？電気代も高くなるやつ？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。そして電流が磁界を作り、磁界が電流に力を与える——この関係がモーターや発電機につながる。左手でフレミングの法則を覚えよう。中指が電流、人差し指が磁界、親指が力だ。</div></div></div>'
    + '</div>';

  // 電力 ＋ W-V-I 三角形 SVG
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 電力の公式（W = V × I）</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">'

    // W/V/I 三角形 SVG
    + '<div style="flex:0 0 auto;text-align:center">'
    + '<div class="rule-title" style="margin-bottom:6px">三角形で覚える</div>'
    + '<svg width="180" height="155" viewBox="0 0 180 155" style="display:block;margin:0 auto">'
    + '<polygon points="90,8 8,145 172,145" fill="none" stroke="#e2a80e" stroke-width="2"/>'
    + '<line x1="90" y1="8" x2="90" y2="145" stroke="#e2a80e" stroke-width="1.5" stroke-dasharray="4,3"/>'
    + '<line x1="8" y1="145" x2="172" y2="145" stroke="#e2a80e" stroke-width="1.5"/>'
    + '<text x="90" y="36" text-anchor="middle" fill="#e2a80e" font-size="22" font-weight="bold">W</text>'
    + '<text x="42" y="143" text-anchor="middle" fill="#38bdf8" font-size="20" font-weight="bold">V</text>'
    + '<text x="138" y="143" text-anchor="middle" fill="#4ade80" font-size="20" font-weight="bold">I</text>'
    + '</svg>'
    + '<div style="font-size:12px;line-height:2;margin-top:4px">'
    + '<div><span style="color:#e2a80e;font-weight:bold">Wを隠す</span> → V × I</div>'
    + '<div><span style="color:#38bdf8;font-weight:bold">Vを隠す</span> → W ÷ I</div>'
    + '<div><span style="color:#4ade80;font-weight:bold">Iを隠す</span> → W ÷ V</div>'
    + '</div>'
    + '</div>'

    // 公式一覧
    + '<div style="flex:1;min-width:200px">'
    + '<div class="rule-box">'
    + '<div class="rule-title">電力（W）</div>'
    + '<div class="ex" style="font-size:18px">W ＝ V × I</div>'
    + '<div class="ex">例：100V × 1.5A = <span style="color:var(--gold)">150W</span></div>'
    + '<div class="note">💡 1200Wのドライヤーを100Vに繋ぐと電流 = 1200÷100 = 12A</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">電力量（Wh）・発熱量（J）</div>'
    + '<div class="ex">電力量 ＝ W × 時間(h)　（電気料金の計算）</div>'
    + '<div class="ex">発熱量(J) ＝ W × 時間(s) ＝ V × I × t</div>'
    + '<div class="ex">例：100W × 60s = <span style="color:var(--gold)">6000J</span></div>'
    + '<div class="note">💡 時間は必ず「秒(s)」に換算！ 5分 = 300s</div>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';

  // 磁界 ＋ フレミング左手 SVG
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🧲 磁界・電磁力・電磁誘導</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">'

    // フレミング左手 SVG
    + '<div style="flex:0 0 auto;text-align:center">'
    + '<div class="rule-title" style="margin-bottom:6px">フレミングの左手</div>'
    + '<svg width="180" height="180" viewBox="0 0 180 180" style="display:block;margin:0 auto">'
    // 手のひら（矩形）
    + '<rect x="55" y="60" width="70" height="80" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>'
    // 親指（上）
    + '<rect x="30" y="55" width="28" height="14" rx="7" fill="#e2a80e" stroke="#e2a80e" stroke-width="1"/>'
    + '<text x="44" y="66" text-anchor="middle" fill="#0d1117" font-size="9" font-weight="bold">親指</text>'
    // 人差し指（右上へ）
    + '<rect x="125" y="42" width="40" height="14" rx="7" fill="#38bdf8" stroke="#38bdf8" stroke-width="1"/>'
    + '<text x="145" y="53" text-anchor="middle" fill="#0d1117" font-size="9" font-weight="bold">人差し指</text>'
    // 中指（手前）
    + '<rect x="72" y="145" width="40" height="14" rx="7" fill="#4ade80" stroke="#4ade80" stroke-width="1"/>'
    + '<text x="92" y="156" text-anchor="middle" fill="#0d1117" font-size="9" font-weight="bold">中指</text>'
    // 矢印
    + '<line x1="55" y1="62" x2="40" y2="62" stroke="#e2a80e" stroke-width="2"/>'
    + '<polygon points="30,58 40,62 30,66" fill="#e2a80e"/>'
    + '<line x1="120" y1="70" x2="130" y2="56" stroke="#38bdf8" stroke-width="2"/>'
    + '<polygon points="125,44 135,50 127,58" fill="#38bdf8"/>'
    + '<line x1="92" y1="140" x2="92" y2="152" stroke="#4ade80" stroke-width="2"/>'
    + '<polygon points="88,152 92,162 96,152" fill="#4ade80"/>'
    // ラベル
    + '<text x="90" y="20" text-anchor="middle" fill="#e2a80e" font-size="11">← 力（モーター）</text>'
    + '<text x="155" y="90" text-anchor="middle" fill="#38bdf8" font-size="10">↗磁界</text>'
    + '<text x="60" y="175" text-anchor="middle" fill="#4ade80" font-size="10">↓電流</text>'
    + '</svg>'
    + '</div>'

    // 3つのルール
    + '<div style="flex:1;min-width:200px">'
    + '<div class="rule-box" style="border-left:3px solid #e2a80e">'
    + '<div class="rule-title" style="color:#e2a80e">① 電流が磁界を作る（右手・コイル）</div>'
    + '<div class="ex">直線電流 → 周りに同心円状の磁界</div>'
    + '<div class="ex">コイル → 棒磁石と同じ磁界（電磁石）</div>'
    + '<div class="note">💡 右手でコイルを握り、4指 = 電流の向き → 親指 = N極</div>'
    + '</div>'
    + '<div class="rule-box" style="border-left:3px solid #38bdf8">'
    + '<div class="rule-title" style="color:#38bdf8">② 磁界中の電流が力を受ける（左手）</div>'
    + '<div class="ex">中指 → 電流　人差し指 → 磁界　親指 → 力</div>'
    + '<div class="note">💡 モーターの原理。「電・磁・力」を中・人・親で覚える。</div>'
    + '</div>'
    + '<div class="rule-box" style="border-left:3px solid #4ade80">'
    + '<div class="rule-title" style="color:#4ade80">③ 磁界の変化が電流を生む（電磁誘導）</div>'
    + '<div class="ex">コイル内の磁界変化 → 誘導電流が発生</div>'
    + '<div class="ex">大きくする：磁石を速く・強く・巻数多く</div>'
    + '<div class="note">💡 発電機・マイク・IH調理器の原理。磁石が静止すると電流は流れない。</div>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';

  // 入力計算問題（電力・発熱量）
  function makeS4Input(qid, jp, answer, xpPts, expText) {
    qMeta[qid] = Object.assign(qMeta[qid] || {}, { type:'input', answer:answer, xp:xpPts, jp:jp });
    var done = answeredSet[qid];
    return '<div class="q-card" data-card="' + qid + '" ' + (done ? 'style="border-color:var(--green)"' : '') + '>'
      + '<div class="q-text">' + jp + '</div>'
      + (done
        ? '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"></div>'
        : '<div class="input-wrap">'
          + '<input class="q-input" id="inp_' + qid + '" type="text" placeholder="数値を入力...">'
          + '<button class="input-submit" data-qid="' + qid + '">確認</button>'
          + '</div>')
      + '<div class="exp-card" id="exp_' + qid + '" style="' + (done ? 'display:block' : 'display:none') + '">'
      + '<div class="exp-card-title">📌 解説</div>'
      + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + expText + '</div>'
      + '</div>'
      + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
      + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度チャレンジ！</div>'
      + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
      + (done ? getComment('nishi_correct') : '')
      + '</div>'
      + '</div>';
  }

  html += '<div class="rule-card"><div class="rule-card-title">✏️ 電力・発熱量 計算練習（数値入力）</div></div>';

  html += makeS4Input('sci_elec_s4_i0',
    '【計算①】電圧100V・電流2Aの電気器具の電力は何Wか。',
    '200', 5,
    'W = V×I = 100×2 = 200W。三角形で「W を隠す」と V×I が残る。');

  html += makeS4Input('sci_elec_s4_i1',
    '【計算②】1200Wのドライヤーを100Vのコンセントに繋いだとき流れる電流は何Aか。',
    '12', 5,
    'I = W÷V = 1200÷100 = 12A。三角形で「I を隠す」と W÷V が残る。');

  html += makeS4Input('sci_elec_s4_i2',
    '【計算③】電流3A・電力150Wのとき電圧は何Vか。',
    '50', 5,
    'V = W÷I = 150÷3 = 50V。三角形で「V を隠す」と W÷I が残る。');

  html += makeS4Input('sci_elec_s4_i3',
    '【計算④】100Wの電球を5分間使ったときの発熱量は何Jか。（5分 = 300秒）',
    '30000', 6,
    '発熱量 Q = W×t = 100×300 = 30000J。時間は秒に換算！5分×60 = 300秒。');

  html += makeS4Input('sci_elec_s4_i4',
    '【計算⑤】電圧100V・電流0.5A・時間60sのときの発熱量は何Jか。',
    '3000', 6,
    'Q = V×I×t = 100×0.5×60 = 3000J。先に電力 W = 100×0.5 = 50W を求めてから ×60s でもOK。');

  html += makeS4Input('sci_elec_s4_i5',
    '【計算⑥】500Wの電気器具を3時間使ったときの電力量は何Whか。',
    '1500', 5,
    '電力量 = W×時間(h) = 500×3 = 1500Wh。電気料金の計算に使う単位。1kWh = 1000Wh。');

  // 選択問題（概念・磁界）
  html += '<div class="rule-card"><div class="rule-card-title">📋 基礎確認（選択）</div></div>';

  var qs = [
    { jp:'電力の単位はどれか。',
      answer:'W（ワット）', choices:['W（ワット）','J（ジュール）','Wh（ワット時）','V（ボルト）'],
      exp:'電力の単位はW（ワット）。電力 = 電圧(V) × 電流(A)。1秒間に消費するエネルギーの量。' },
    { jp:'発熱量（ジュール熱）の計算式として正しいのはどれか。',
      answer:'Q = V × I × t', choices:['Q = V × I × t','Q = V + I + t','Q = V ÷ I × t','Q = I² ÷ R × t'],
      exp:'発熱量 Q（J）= 電力（W）× 時間（s）= V×I×t。電熱線や電気ストーブはジュール熱を利用している。' },
    { jp:'コイルに電流を流したとき、できる磁界について正しいのはどれか。',
      answer:'棒磁石と同じような磁界ができる',
      choices:['棒磁石と同じような磁界ができる','磁界はできない','螺旋状に外に広がる磁界ができる','電流と直角方向のみに磁界ができる'],
      exp:'コイルに電流を流すと、コイルの中心を通る棒磁石と同じ磁界ができる（電磁石）。右手でコイルを握り親指がN極。' },
    { jp:'フレミングの左手の法則で「中指」が表すのは何か。',
      answer:'電流の向き', choices:['電流の向き','磁界の向き','力の向き','電圧の向き'],
      exp:'フレミングの左手：中指=電流、人差し指=磁界（N→S方向）、親指=力（電磁力）。モーターの回転方向を求めるのに使う。' },
    { jp:'コイルの中で磁石を動かすと電流が発生する。この現象を何というか。',
      answer:'電磁誘導', choices:['電磁誘導','電磁力','磁界誘導','誘導電圧'],
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
    { jp:'フレミングの右手の法則が表すのは何か。',
      answer:'電磁誘導での誘導電流の向き（発電機の原理）',
      choices:[
        '電磁誘導での誘導電流の向き（発電機の原理）',
        'モーターの回転方向',
        '電流が磁界から受ける力の向き',
        'コイルのN極の向き'
      ],
      exp:'右手の法則：磁界の中で導線を動かしたとき流れる誘導電流の向きを表す。発電機の原理。左手（電動機）と右手（発電機）で使い分ける。' },
    { jp:'200Wの電熱線を10分間使ったときの発熱量は何Jか。',
      answer:'120000 J', choices:['120000 J','2000 J','200 J','12000 J'],
      exp:'10分 = 600秒。Q = W×t = 200×600 = 120000J。時間の秒換算を忘れずに！' },
  ];

  qs.forEach(function(q, i) { q._qid = 'sci_elec_s4_q' + i; });
  qs = shuffleArray(qs);
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

// ===== SECTION 5: 確認テスト =====
function renderSection5() {
  var html = '';

  // きょん 導入コメント
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📋 確認テストへようこそ</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">ここまで電流・電圧・直列・並列・電力・磁界を全部やってきた！！全部復習してからテスト始めよう！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">下の公式まとめをひと通り確認してからテストに入ろう。語句記入10問＋選択10問、計20問だ。</div></div></div>'
    + '</div>';

  // 公式まとめカード（全セクション）
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📌 テスト前 公式まとめ（全セクション）</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">'

    + '<div class="rule-box" style="border-left:3px solid var(--gold)">'
    + '<div class="rule-title" style="color:var(--gold)">⚡ オームの法則</div>'
    + '<div class="ex" style="font-size:17px;font-weight:bold">V = I × R</div>'
    + '<div class="ex" style="font-size:13px">I = V÷R　　R = V÷I</div>'
    + '<div class="note" style="font-size:12px">三角形で求めたい文字を隠す</div>'
    + '</div>'

    + '<div class="rule-box" style="border-left:3px solid #38bdf8">'
    + '<div class="rule-title" style="color:#38bdf8">🔵 直列回路</div>'
    + '<div class="ex" style="font-size:13px">電流：I₁=I₂=I（どこも同じ）</div>'
    + '<div class="ex" style="font-size:13px">電圧：V=V₁+V₂（分担）</div>'
    + '<div class="ex" style="font-size:13px">抵抗：R=R₁+R₂（足すだけ）</div>'
    + '</div>'

    + '<div class="rule-box" style="border-left:3px solid #4ade80">'
    + '<div class="rule-title" style="color:#4ade80">🟢 並列回路</div>'
    + '<div class="ex" style="font-size:13px">電圧：V₁=V₂=V（どこも同じ）</div>'
    + '<div class="ex" style="font-size:13px">電流：I=I₁+I₂（分担）</div>'
    + '<div class="ex" style="font-size:13px">抵抗：1/R=1/R₁+1/R₂（逆数）</div>'
    + '</div>'

    + '<div class="rule-box" style="border-left:3px solid #e2a80e">'
    + '<div class="rule-title" style="color:#e2a80e">💡 電力・発熱量</div>'
    + '<div class="ex" style="font-size:17px;font-weight:bold">W = V × I</div>'
    + '<div class="ex" style="font-size:13px">発熱量 Q = W × t（秒）= V×I×t</div>'
    + '<div class="note" style="font-size:12px">時間は必ず「秒」に換算！</div>'
    + '</div>'

    + '<div class="rule-box" style="border-left:3px solid var(--teal)">'
    + '<div class="rule-title" style="color:var(--teal)">🧲 磁界・電磁</div>'
    + '<div class="ex" style="font-size:13px">左手：中指=電流・人差し指=磁界・親指=力</div>'
    + '<div class="ex" style="font-size:13px">電磁誘導：磁界変化→誘導電流</div>'
    + '<div class="note" style="font-size:12px">速く・強く・巻数多く → 電流大</div>'
    + '</div>'

    + '<div class="rule-box" style="border-left:3px solid var(--red)">'
    + '<div class="rule-title" style="color:var(--red)">⚠️ 間違えやすいポイント</div>'
    + '<div class="ex" style="font-size:13px">電流計→直列　電圧計→並列</div>'
    + '<div class="ex" style="font-size:13px">直列断線→全消灯　並列断線→他は無影響</div>'
    + '<div class="ex" style="font-size:13px">並列の合成抵抗は各抵抗より小さい</div>'
    + '</div>'

    + '</div>'
    + '</div>';

  html += '<div style="background:#1a2236;border:1px solid #334155;border-radius:12px;padding:16px 24px;margin-bottom:24px">'
    + '<div style="font-size:14px;color:var(--text);line-height:1.8">📋 語句記入問題（10問）＋選択問題（10問）の計20問。<br>'
    + '全問解くと結果が表示されます。</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 12px;letter-spacing:.08em">▍語句記入問題</div>';

  var inputQs = [
    { qid:'sci_elec_s5_in0', jp:'電流の大きさを表す単位は何か。', answer:'A（アンペア）',
      exp:'電流の単位はA（アンペア）。1A = 1000mA。電流計は回路に直列につなぐ。' },
    { qid:'sci_elec_s5_in1', jp:'電圧の大きさを表す単位は何か。', answer:'V（ボルト）',
      exp:'電圧の単位はV（ボルト）。電圧計は測定する素子に並列につなぐ。' },
    { qid:'sci_elec_s5_in2', jp:'抵抗の大きさを表す単位は何か。', answer:'Ω（オーム）',
      exp:'抵抗の単位はΩ（オーム）。電流の流れにくさを表す。オームの法則 V=IR のR。' },
    { qid:'sci_elec_s5_in3', jp:'電圧・電流・抵抗の関係を表す法則を何というか。', answer:'オームの法則',
      exp:'オームの法則：V = I × R。ドイツの物理学者ゲオルク・オームが発見。電気回路計算の基本。' },
    { qid:'sci_elec_s5_in4', jp:'抵抗20Ω、電圧10Vのとき、電流は何Aか。', answer:'0.5 A',
      exp:'I = V÷R = 10÷20 = 0.5A。三角形で「I を隠す」と V÷R が残る。' },
    { qid:'sci_elec_s5_in5', jp:'直列回路では、回路のどこでも何が同じか。', answer:'電流',
      exp:'直列は1本道。電流はどこでも同じ。電圧は各抵抗に分かれてかかる（分圧）。' },
    { qid:'sci_elec_s5_in6', jp:'並列回路では、各枝に同じ大きさの何がかかるか。', answer:'電圧',
      exp:'並列では各枝の電圧 = 電源電圧（全部等しい）。電流は各枝に分かれる。' },
    { qid:'sci_elec_s5_in7', jp:'電力の公式（単位W）を式で表せ。', answer:'W = V × I',
      exp:'電力(W) = 電圧(V) × 電流(A)。1Wは1秒間に1Jのエネルギーを消費する電力。' },
    { qid:'sci_elec_s5_in8', jp:'コイルの中で磁石を動かすと電流が発生する現象を何というか。', answer:'電磁誘導',
      exp:'電磁誘導：磁界の変化でコイルに誘導電流が生じる。発電機・マイク・IHの原理。フレミング右手の法則。' },
    { qid:'sci_elec_s5_in9', jp:'電流が磁界から受ける力の向きを求める法則を何というか。', answer:'フレミングの左手の法則',
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

  choiceQs.forEach(function(q, i) { q._qid = 'sci_elec_s5_ch' + i; });
  choiceQs = shuffleArray(choiceQs);
  choiceQs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

// ===== SECTION 6: 3年予習 =====
function renderSection6() {
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
  var prefix = 'sci_elec_s5_';
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
  currentSection = 7; renderTabs();
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
  currentSection = 8; renderTabs();
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