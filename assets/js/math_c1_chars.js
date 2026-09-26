// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「文字式？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺数学できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「文字式で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var xp          = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('math_chars_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('math_chars_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('math_weakdb')         || '{}');
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
  localStorage.setItem('math_xp',             xp);
  localStorage.setItem('math_chars_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('math_chars_') === 0 && getPct(id) < 80;
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
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  var _today = new Date().toISOString().slice(0,10);
  var _daily = JSON.parse(localStorage.getItem('math_daily') || '{}');
  _daily[_today] = (_daily[_today] || 0) + 1;
  localStorage.setItem('math_daily',             JSON.stringify(_daily));
  localStorage.setItem('math_chars_lastStudy',   _today);
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
    'きょん「合ってる！文字式できるじゃん！！」',
    'きょん「やった！天才かも！」',
    'きょん「にっくん見て！解けた！！」',
    'きょん「天才！！俺めっちゃ天才！！」',
  ],
  nishi_correct: [
    '西村「正解。よく覚えてたね」',
    '西村「できてる。その調子」',
    '西村「正確に解けてる」',
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

function mathMatch(input, answer) {
  var norm = function(s) {
    return s.trim().replace(/\s+/g,'').toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-0xFEE0); })
      .replace(/ー/g,'-');
  };
  var ni = norm(input), na = norm(answer);
  if (ni === na) return true;
  var numOnly = na.replace(/^[a-z]=/, '');
  if (ni === numOnly) return true;
  var inputNum = ni.replace(/^[a-z]=/, '');
  if (inputNum === numOnly) return true;
  return false;
}

function toggleHint(qid) {
  var h = document.getElementById('hint_' + qid);
  if (h) h.style.display = h.style.display === 'block' ? 'none' : 'block';
}

function makeChoices(qid, jp, answer, choices, exp) {
  choices = shuffleArray(choices);
  qMeta[qid] = { type:'choice', answer:answer, xp:4, jp:jp, choices:choices };
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

function makeInputCard(qid, jp, formula, answer, xpPts, hint, expText) {
  qMeta[qid] = { type:'input', answer:answer, xp:xpPts, jp:jp };
  var done = answeredSet[qid];
  var hintHtml = hint
    ? '<button class="hint-btn" onclick="toggleHint(\'' + qid + '\')">💡 ヒント</button>'
      + '<div class="hint-box" id="hint_' + qid + '">' + hint + '</div>'
    : '';
  var inputHtml = done
    ? '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"><span class="input-unit" style="margin-left:4px;color:var(--green)">✓</span></div>'
    : '<div class="input-wrap">'
      + '<input class="q-input" id="inp_' + qid + '" type="text" placeholder="答え">'
      + '<button class="input-submit" data-qid="' + qid + '">確認</button>'
      + '</div>';
  return '<div class="q-card" data-card="' + qid + '" id="qcard_' + qid + '">'
    + '<div class="q-text">' + jp + '</div>'
    + (formula ? '<div class="q-formula">' + formula + '</div>' : '')
    + hintHtml
    + inputHtml
    + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度！</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + '<div class="exp-card-title">📐 解説</div>'
    + '<div style="color:var(--text);font-size:13px;line-height:2.2">' + expText + '</div>'
    + '</div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '">'
    + '<div class="ans-label">✅ 正解</div>'
    + '<div id="ar_ans_' + qid + '" style="font-size:20px;color:var(--gold);font-weight:bold;margin-top:4px"></div>'
    + '</div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + (done ? getComment('nishi_correct') : '')
    + '</div>'
    + '</div>';
}

function handleInput(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  var inp = document.getElementById('inp_' + qid);
  if (!inp) return;
  var val = inp.value.trim();
  if (!val) { showToast('答えを入力してください！'); return; }
  if (mathMatch(val, meta.answer)) {
    inp.style.borderColor = 'var(--green)'; markCorrect(qid, meta);
  } else {
    inp.style.borderColor = 'var(--red)'; markWrong(qid, meta, val); inp.select();
  }
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
  var fb = document.getElementById('fb_' + qid); if (fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = getComment('nishi_correct'); ac.style.display = 'block'; }
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true; if (b.dataset.choice === meta.answer) b.classList.add('selected-correct');
  });
  var _inp = document.getElementById('inp_' + qid);
  if (_inp) { _inp.disabled = true; _inp.style.borderColor = 'var(--green)'; var _sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if (_sb) _sb.style.display = 'none'; }
  var expEl = document.getElementById('exp_' + qid) || document.getElementById('exp_card_' + qid);
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
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display = 'block';
  var btn = document.querySelector('.choice-btn[data-qid="' + qid + '"][data-choice="' + choice + '"]');
  if (btn) { btn.classList.add('selected-wrong'); setTimeout(function(){ btn.classList.remove('selected-wrong'); }, 600); }
  if (attemptCounts[qid] >= 2) { var sab = document.getElementById('sab_' + qid); if (sab) sab.style.display = 'inline-block'; }
  var demoted = deductXP(5);
  if (demoted) {
    setTimeout(function() { showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」', 'demote'); }, 200);
  } else {
    var msgs = ['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！まだまだ大丈夫！！」','きょん「ルールをもう一度確認！！」'];
    setTimeout(function() { showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100);
  }
  if (!tokkuBannerShown) { tokkuBannerShown = true; setTimeout(function() { showTokkuSuggestion(qid); }, 500); }
}
function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  localStorage.setItem('math_chars_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if (arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if (ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if (sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true; if (b.dataset.choice === meta.answer) b.classList.add('show-correct');
  });
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = 'きょん「なるほど！次は自分で解く！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。解き方を理解しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete() {
  var prefix = 'math_chars_s' + currentSection + '_';
  var sectionQ = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sectionQ.length === 0) return;
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_chars_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb) {
      nb.style.display = 'block';
      if (!document.getElementById('sectionCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'sectionCompleteBanner';
        var nextSec = currentSection < 3 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '確認テストで腕試し！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(63,185,80,0.12),rgba(163,113,247,0.08));border:1px solid var(--green);border-radius:14px">'
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
  { id:0, label:'📐 スタート',   title:'文字式',              sub:'x や a って何？文字が入る理由から始めよう！' },
  { id:1, label:'文字式の書き方', title:'文字式の書き方',      sub:'×省略・÷分数・係数1は省く——書き方ルール10問' },
  { id:2, label:'式の計算・代入', title:'式の計算と代入',      sub:'同類項・展開・代入——計算問題10問' },
  { id:3, label:'確認テスト',    title:'確認テスト',          sub:'文字式の総まとめ！選択10問＋代入5問' },
  { id:4, label:'🔗3年予習',     title:'3年予習：多項式・因数分解', sub:'文字式→多項式・因数分解への橋渡し' },
  { id:5, label:'📊弱点',        title:'弱点ノート',          sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',        title:'弱点特訓モード',      sub:'間違えた問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab';
    if (s.id >= 5) cls += ' tokku';
    if (s.id === currentSection) cls += ' active';
    if (sectionDone[s.id] && s.id < 5) cls += ' done';
    var label = s.label + (sectionDone[s.id] && s.id < 5 ? ' ✓' : '');
    if (s.id === 6) { var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
    html += '<button class="' + cls + '" data-sid="' + s.id + '">' + label + '</button>';
  });
  document.getElementById('sectionTabs').innerHTML = html;
  document.querySelectorAll('.section-tab[data-sid]').forEach(function(btn) {
    btn.addEventListener('click', function() { goSection(parseInt(btn.dataset.sid)); });
  });
}
function goSection(id) { currentSection = id; renderTabs(); renderSection(id); window.scrollTo(0,0); }
function renderSection(id) {
  if (id === 5) { renderWeakNote(); return; }
  if (id === 6) { renderTokkuMode(); return; }
  var s = SECTIONS[id];
  var html = '<div class="progress-dots">';
  for (var i = 0; i <= 4; i++) {
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">数学 文字式 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">'   + s.sub   + '</div>'
    + '</div>';
  if      (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();
  if (id >= 1 && id <= 3) {
    var nextLabel  = id < 3 ? '次のセクションへ →' : '🏆 結果を見る！';
    var nextAction = id < 3 ? 'goSection(' + (id+1) + ')' : 'showFinalResult()';
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

// ===== SECTION 0: スタート =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「2x+3」とか「ab」とか、なんで急に文字が出てくるの！？数字じゃダメなの！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">文字は「まだわからない数」や「何でも入れられる箱」だ。たとえば「1本 a 円のえんぴつを 3 本買うと合計は？」→ 3a 円。どんな値段でも使える万能な式になる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">えんぴつの値段がわからなくても 3a って書けるのか！！なんか便利！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">書き方にはルールがある。「×は省く」「数字は文字の前に書く」「÷は分数にする」——この3つを覚えれば文字式は完璧だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「×省く」「数字先」「÷分数」！！覚えた！！俺天才かも！！</div></div></div>'
    + '</div>'
    + '<button class="start-btn" onclick="goSection(1)">📐 文字式の書き方から始める →</button>';
}

// ===== SECTION 1: 文字式の書き方 =====
function renderSection1() {
  var html = '';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 文字式の書き方ルール</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">① × は省く。数字は文字の前に書く</div>'
    + '<div class="ex">4 × x → 4x　　a × b × 3 → 3ab</div>'
    + '<div class="ex">係数が 1 または -1 のときは省く：1×x → x　　(-1)×y → -y</div>'
    + '<div class="note">💡 文字は普通アルファベット順（ab, abc…）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">② ÷ は分数で書く</div>'
    + '<div class="ex">x ÷ 4 → x/4　　(a+2) ÷ 3 → (a+2)/3</div>'
    + '<div class="note">💡 分子が式全体のときはカッコを忘れずに！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">③ 同じ文字の積は指数で書く</div>'
    + '<div class="ex">a × a → a²　　a × a × a → a³</div>'
    + '<div class="note">💡 「2a」は a+a ではなく a×2。「a²」は a×a</div>'
    + '</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;letter-spacing:.08em">✏️ 練習問題（正しい文字式を選ぼう）</div>';

  var qs = [
    { qid:'math_chars_s1_q0', jp:'4 × x を文字式で書くと？',
      answer:'4x', choices:['4x','x4','4+x','4/x'],
      exp:'📐 × は省く。数字は文字の前 → <span style="color:var(--gold)">4x</span><br>✅ 4x　❌ x4（数字は前！）' },
    { qid:'math_chars_s1_q1', jp:'a × b × 3 を文字式で書くと？',
      answer:'3ab', choices:['3ab','ab3','a3b','3+ab'],
      exp:'📐 数字は先頭。文字はアルファベット順 → <span style="color:var(--gold)">3ab</span>' },
    { qid:'math_chars_s1_q2', jp:'x × x を文字式で書くと？',
      answer:'x²', choices:['x²','2x','x+x','xx'],
      exp:'📐 同じ文字の積は指数 → <span style="color:var(--gold)">x²</span>（x の2乗）<br>✅ x²　❌ 2x（これは x+x と同じ意味！）' },
    { qid:'math_chars_s1_q3', jp:'(-1) × y を文字式で書くと？',
      answer:'-y', choices:['-y','-1y','y-1','1-y'],
      exp:'📐 係数が -1 のとき 1 は省く → <span style="color:var(--gold)">-y</span><br>✅ -y　❌ -1y（1 は不要）' },
    { qid:'math_chars_s1_q4', jp:'x ÷ 4 を文字式で書くと？',
      answer:'x/4', choices:['x/4','4x','4/x','x-4'],
      exp:'📐 ÷ は分数の形に → <span style="color:var(--gold)">x/4</span><br>✅ x/4　❌ 4x（これは x×4）' },
    { qid:'math_chars_s1_q5', jp:'次のうち「正しい」文字式の表し方は？',
      answer:'5a', choices:['5a','a5','5×a','a÷(1/5)'],
      exp:'📐 × は省く。数字は文字の前 → <span style="color:var(--gold)">5a</span><br>❌ a5（数字は先頭）　❌ 5×a（× を省く）' },
    { qid:'math_chars_s1_q6', jp:'(x + 2) ÷ 3 を文字式で書くと？',
      answer:'(x+2)/3', choices:['(x+2)/3','x+2/3','3/(x+2)','x/3+2'],
      exp:'📐 分子全体をカッコでくくる → <span style="color:var(--gold)">(x+2)/3</span><br>⚠️ x+2/3 は「x + (2/3)」を意味してしまう！' },
    { qid:'math_chars_s1_q7', jp:'a × a × a を文字式で書くと？',
      answer:'a³', choices:['a³','3a','a+a+a','3×a'],
      exp:'📐 3つ同じ文字の積 → <span style="color:var(--gold)">a³</span>（a の3乗）<br>✅ a³　❌ 3a（これは a×3）' },
    { qid:'math_chars_s1_q8', jp:'1 × x を文字式で書くと？',
      answer:'x', choices:['x','1x','x/1','1+x'],
      exp:'📐 係数が 1 のとき省く → <span style="color:var(--gold)">x</span><br>✅ x　❌ 1x（1 は不要）' },
    { qid:'math_chars_s1_q9', jp:'次の中で「正しくない」表し方はどれ？',
      answer:'a×b', choices:['a×b','ab','2ab','-3ab'],
      exp:'📐 文字式では × を省くのがルール → <span style="color:var(--gold)">a×b は正しくない</span><br>✅ ab・2ab・-3ab は正しい表し方' },
  ];

  var shuffled = qs.map(function(q){ q._qid=q.qid; return q; });
  shuffled.forEach(function(q) {
    html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 2: 式の計算・代入 =====
function renderSection2() {
  var html = '';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 同類項をまとめる</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">同類項（文字の部分が同じ項）を足し引きできる</div>'
    + '<div class="ex">3x + 2x = (3+2)x = 5x</div>'
    + '<div class="ex">4a - a = (4-1)a = 3a　　（係数 1 は省略）</div>'
    + '<div class="ex">2x + 3 + x - 5 → 2x と x を足す、3 と -5 を足す → 3x - 2</div>'
    + '<div class="note">💡 異なる文字の項（3x と 4y など）はまとめられない！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">カッコの展開（分配法則）</div>'
    + '<div class="ex">3(x + 2) = 3×x + 3×2 = 3x + 6</div>'
    + '<div class="ex">-2(x - 4) = -2×x + (-2)×(-4) = -2x + 8</div>'
    + '<div class="note">💡 マイナス×マイナス = プラス　に注意！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 代入（数値を文字に入れる）</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">代入のやり方</div>'
    + '<div class="ex">x = 3 を 2x + 1 に代入 → 2×3 + 1 = 7</div>'
    + '<div class="ex">a = -2 を a² + 3 に代入 → (-2)² + 3 = 4 + 3 = 7</div>'
    + '<div class="note">💡 負の数を代入するときは必ず（）をつけて！</div>'
    + '</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;letter-spacing:.08em">✏️ 練習問題</div>';

  var choiceQs = [
    { qid:'math_chars_s2_q0', jp:'3x + 2x を計算すると？',
      answer:'5x', choices:['5x','6x','5x²','3x²'],
      exp:'📐 同類項：係数を足す → (3+2)x = <span style="color:var(--gold)">5x</span>' },
    { qid:'math_chars_s2_q1', jp:'5a - 3a を計算すると？',
      answer:'2a', choices:['2a','2','8a','15a'],
      exp:'📐 (5-3)a = <span style="color:var(--gold)">2a</span>' },
    { qid:'math_chars_s2_q2', jp:'4y - y を計算すると？',
      answer:'3y', choices:['3y','4','y³','3'],
      exp:'📐 4y - 1y = (4-1)y = <span style="color:var(--gold)">3y</span>　（係数 1 は省略）' },
    { qid:'math_chars_s2_q3', jp:'3x + 2 + x - 5 を計算すると？',
      answer:'4x-3', choices:['4x-3','4x+7','4x-7','2x-3'],
      exp:'📐 x の項：3x+x = 4x　数の項：2-5 = -3 → <span style="color:var(--gold)">4x - 3</span>' },
    { qid:'math_chars_s2_q4', jp:'2a + 3b + a - b を計算すると？',
      answer:'3a+2b', choices:['3a+2b','3a-2b','2a+3b','3a+b'],
      exp:'📐 a の項：2a+a = 3a　b の項：3b-b = 2b → <span style="color:var(--gold)">3a + 2b</span>' },
    { qid:'math_chars_s2_q5', jp:'3(x + 2) を展開すると？',
      answer:'3x+6', choices:['3x+6','3x+2','x+6','6x+2'],
      exp:'📐 分配法則：3×x + 3×2 = <span style="color:var(--gold)">3x + 6</span>' },
    { qid:'math_chars_s2_q6', jp:'2(a - 3) + 4 を計算すると？',
      answer:'2a-2', choices:['2a-2','2a+2','2a-8','2a+8'],
      exp:'📐 2a - 6 + 4 = <span style="color:var(--gold)">2a - 2</span>' },
    { qid:'math_chars_s2_q7', jp:'-3(2x - 1) を展開すると？',
      answer:'-6x+3', choices:['-6x+3','-6x-3','6x-3','-6x+1'],
      exp:'📐 (-3)×2x + (-3)×(-1) = -6x + 3 → <span style="color:var(--gold)">-6x + 3</span><br>💡 (-3)×(-1) = +3 に注意！' },
  ];

  choiceQs.forEach(function(q){ html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp); });

  html += '<div style="font-size:13px;color:var(--text2);margin:20px 0 14px;font-weight:bold">── 代入問題（数値を入力） ──</div>';

  var inputQs = [
    { qid:'math_chars_s2_q8', jp:'x = 3 のとき、2x + 1 の値は？', formula:'2x + 1　（x = 3）',
      answer:'7', xp:5,
      hint:'x に 3 を代入 → 2×3 + 1 = 6 + 1 = 7',
      exp:'2x + 1 に x = 3 を代入<br>2 × 3 + 1 = 6 + 1 = <span style="color:var(--gold)">7</span>' },
    { qid:'math_chars_s2_q9', jp:'a = -2, b = 3 のとき、2a + b の値は？', formula:'2a + b　（a = -2, b = 3）',
      answer:'-1', xp:6,
      hint:'2×(-2) + 3 = -4 + 3 = -1',
      exp:'2a + b に a = -2, b = 3 を代入<br>2 × (-2) + 3 = -4 + 3 = <span style="color:var(--gold)">-1</span>' },
  ];

  inputQs.forEach(function(q) {
    html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });

  return html;
}

// ===== SECTION 3: 確認テスト =====
function renderSection3() {
  var html = '';

  html += '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:6px">📝 確認テスト — 文字式 まとめ</div>'
    + '<div style="font-size:13px;color:var(--text2);line-height:2.0">選択問題 10問 ＋ 代入問題 5問。Section 1・2 の内容をすべて確認しよう！</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 14px;font-weight:bold">── 選択問題 ──</div>';

  var choiceQs = [
    { qid:'math_chars_s3_ch0', jp:'3 × a × b × 2 を文字式で書くと？',
      answer:'6ab', choices:['6ab','6a+b','3a2b','5ab'],
      exp:'📐 × 省略、数字先頭 → 3×2=6, ab → <span style="color:var(--gold)">6ab</span>' },
    { qid:'math_chars_s3_ch1', jp:'7x - 3x + x を計算すると？',
      answer:'5x', choices:['5x','4x','5x²','3x'],
      exp:'📐 (7-3+1)x = <span style="color:var(--gold)">5x</span>' },
    { qid:'math_chars_s3_ch2', jp:'4(2a - 1) を展開すると？',
      answer:'8a-4', choices:['8a-4','8a-1','8a+4','6a-4'],
      exp:'📐 4×2a - 4×1 = <span style="color:var(--gold)">8a - 4</span>' },
    { qid:'math_chars_s3_ch3', jp:'2x + 5y - x - 3y を計算すると？',
      answer:'x+2y', choices:['x+2y','x-2y','2x+2y','x+8y'],
      exp:'📐 x の項：2x-x = x　y の項：5y-3y = 2y → <span style="color:var(--gold)">x + 2y</span>' },
    { qid:'math_chars_s3_ch4', jp:'-2(x - 4) を展開すると？',
      answer:'-2x+8', choices:['-2x+8','-2x-8','2x-8','-2x+4'],
      exp:'📐 (-2)×x + (-2)×(-4) = -2x + 8 → <span style="color:var(--gold)">-2x + 8</span>' },
    { qid:'math_chars_s3_ch5', jp:'縦 a cm、横 b cm の長方形の面積を文字式で表すと？',
      answer:'ab cm²', choices:['ab cm²','2(a+b) cm','a+b cm²','a²b cm²'],
      exp:'📐 面積 = 縦 × 横 = a × b = <span style="color:var(--gold)">ab cm²</span>' },
    { qid:'math_chars_s3_ch6', jp:'5(a + 2) - 3(a - 1) を計算すると？',
      answer:'2a+13', choices:['2a+13','2a+7','2a+11','5a+13'],
      exp:'📐 5a+10 - 3a+3 = (5a-3a) + (10+3) = <span style="color:var(--gold)">2a + 13</span><br>⚠️ -3×(-1) = +3 に注意！' },
    { qid:'math_chars_s3_ch7', jp:'1本 x 円のえんぴつ 3 本と 200 円のノート 1 冊の合計は？',
      answer:'3x+200（円）', choices:['3x+200（円）','3+200x（円）','200x+3（円）','x+600（円）'],
      exp:'📐 えんぴつ 3 本：x×3 = 3x（円）　ノート：200円<br>合計 = <span style="color:var(--gold)">3x + 200（円）</span>' },
    { qid:'math_chars_s3_ch8', jp:'次のうち正しい文字式の表し方は？',
      answer:'-ab', choices:['-ab','-1ab','-a×b','ab÷(-1)'],
      exp:'📐 係数 -1 は省く → -1×ab = <span style="color:var(--gold)">-ab</span>' },
    { qid:'math_chars_s3_ch9', jp:'4(3x - 2) - 2(x + 3) を計算すると？',
      answer:'10x-14', choices:['10x-14','10x+14','10x-2','12x-14'],
      exp:'📐 12x-8 - 2x-6 = (12x-2x) + (-8-6) = <span style="color:var(--gold)">10x - 14</span>' },
  ];

  choiceQs.forEach(function(q){ html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp); });

  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 14px;font-weight:bold">── 代入問題（入力） ──</div>';

  var inputQs = [
    { qid:'math_chars_s3_in0', jp:'x = 5 のとき、3x - 7 の値は？', formula:'3x − 7　（x = 5）',
      answer:'8', xp:5,
      hint:'3×5 - 7 = 15 - 7 = 8',
      exp:'3 × 5 - 7 = 15 - 7 = <span style="color:var(--gold)">8</span>' },
    { qid:'math_chars_s3_in1', jp:'a = -3 のとき、a + 10 の値は？', formula:'a + 10　（a = -3）',
      answer:'7', xp:5,
      hint:'(-3) + 10 = 7',
      exp:'(-3) + 10 = <span style="color:var(--gold)">7</span>' },
    { qid:'math_chars_s3_in2', jp:'x = 2 のとき、x² - 1 の値は？', formula:'x² − 1　（x = 2）',
      answer:'3', xp:6,
      hint:'2² = 4 → 4 - 1 = 3',
      exp:'x² - 1 に x = 2 を代入<br>2² - 1 = 4 - 1 = <span style="color:var(--gold)">3</span>' },
    { qid:'math_chars_s3_in3', jp:'a = 4, b = -1 のとき、2a + 3b の値は？', formula:'2a + 3b　（a = 4, b = -1）',
      answer:'5', xp:6,
      hint:'2×4 + 3×(-1) = 8 - 3 = 5',
      exp:'2 × 4 + 3 × (-1) = 8 - 3 = <span style="color:var(--gold)">5</span>' },
    { qid:'math_chars_s3_in4', jp:'x = 6 のとき、x/3 + 1 の値は？', formula:'x/3 + 1　（x = 6）',
      answer:'3', xp:6,
      hint:'6/3 + 1 = 2 + 1 = 3',
      exp:'6/3 + 1 = 2 + 1 = <span style="color:var(--gold)">3</span>' },
  ];

  inputQs.forEach(function(q) {
    html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });

  return html;
}

// ===== SECTION 4: 3年予習 =====
function renderSection4() {
  return '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:24px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">🔗 文字式→多項式・因数分解への接続</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '文字式の計算 → <span style="color:var(--gold)">多項式の加法・減法・乗法（中2）</span><br>'
    + '分配法則 3(x+2) → <span style="color:var(--gold)">因数分解 3x+6 = 3(x+2)（中3）の逆方向</span><br>'
    + '同類項整理 → <span style="color:var(--gold)">多項式・二次式の展開（中3）</span><br>'
    + '代入 → <span style="color:var(--gold)">関数 y=ax²（中3）の値の求め方</span>'
    + '</div></div>'
    + '<div style="background:rgba(245,197,24,0.06);border:1px solid rgba(245,197,24,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px">⚡ 中3でよく出る文字式（先取り）</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '(a + b)² = a² + 2ab + b²　（乗法の公式）<br>'
    + 'a² - b² = (a+b)(a-b)　（因数分解の公式）<br>'
    + 'x² + (a+b)x + ab = (x+a)(x+b)　（たすき掛け）'
    + '</div></div>';
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var prefix = 'math_chars_s3_';
  var total   = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; }).length;
  var correct = Object.keys(answeredSet).filter(function(id){ return id.indexOf(prefix) === 0 && answeredSet[id]; }).length;
  if (total === 0) total = 15;
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '😄' : '🐣';
  var msg = pct >= 90
    ? 'きょん「全部解けた！！俺、文字式マスターじゃん！！」<br>西村「よくやった。次は連立方程式に挑もう」'
    : pct >= 70
    ? 'きょん「かなりできた！もう少しで完璧！！」<br>西村「惜しい。同類項整理を見直したら完璧になるよ」'
    : 'きょん「難しかった！！でも諦めない！！」<br>西村「焦らなくていい。もう一度Section 1から復習しよう」';
  var html = '<div class="result-box">'
    + '<div class="result-title">📐 確認テスト 結果</div>'
    + '<div class="result-emoji">' + emoji + '</div>'
    + '<div class="result-score">' + correct + '<span> / ' + total + '問正解</span></div>'
    + '<div style="font-size:28px;color:var(--gold);font-weight:bold;margin-bottom:8px">' + pct + '%</div>'
    + '<div class="result-msg">' + msg + '</div>'
    + '<div style="margin-top:24px">'
    + '<button class="result-btn" onclick="closeResult()">📖 見直しをする</button>'
    + '<button class="result-btn" onclick="goSection(1)" style="background:var(--purple);color:#fff">🔄 Section 1 からやり直す</button>'
    + '</div></div>';
  document.getElementById('resultOverlay').innerHTML = html;
  document.getElementById('resultOverlay').style.display = 'block';
}
function closeResult() { document.getElementById('resultOverlay').style.display = 'none'; }

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 5; renderTabs();
  var mc = document.getElementById('mainContent');
  var wqs = getWeakQuestions();
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_chars_') === 0; });
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
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(163,113,247,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text);margin-bottom:2px;line-height:1.6">' + (d.jp||'') + '</div><div style="font-size:20px;color:' + barColor + ';font-family:Bebas Neue,sans-serif">' + (d.answer||'') + '</div></div>'
      + '<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div><div style="width:80px;height:5px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px"></div></div></div>'
      + '</div>';
  });
  if (wqs.length > 0) {
    html += '<button onclick="goSection(6)" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
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
    + '<div style="flex:1"><div style="font-size:13px;font-weight:bold;color:var(--red);margin-bottom:2px">間違えた問題は特訓モードで克服！</div><div style="font-size:12px;color:var(--text2)">正答率80%で卒業！</div></div>'
    + '<button onclick="goSection(6)" style="background:var(--red);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-family:inherit;font-weight:bold;cursor:pointer;flex-shrink:0">🔥 特訓へ →</button>'
    + '</div>';
  card.parentNode.insertBefore(banner, card.nextSibling);
}
function renderTokkuMode() {
  currentSection = 6; renderTabs();
  var wqs = getWeakQuestions();
  var mc  = document.getElementById('mainContent');
  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div class="tokku-complete-msg">すべて正答率80%以上！<br>きょん「俺、文字式マスターじゃん！！」<br>西村「本当に成長したね」</div><button onclick="goSection(1)" style="margin-top:24px;background:var(--purple);color:#fff;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button></div>';
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
  var isChoice = d.choices && d.choices.length > 0;
  var answerArea = '';
  if (isChoice) {
    answerArea = '<div class="tokku-choices">'
      + d.choices.slice().sort(function(){ return Math.random()-0.5; }).map(function(c){
          return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c + '">' + c + '</button>';
        }).join('')
      + '</div>';
  } else {
    answerArea = '<div class="input-wrap" style="justify-content:center">'
      + '<input class="q-input" id="tokku_inp_' + qid + '" type="text" placeholder="答え" style="max-width:160px">'
      + '<button onclick="handleTokkuInput(\'' + qid + '\')" style="background:var(--purple);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">確認</button>'
      + '</div>';
  }
  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span class="pct" style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp">' + (d.jp || qid) + '</div>'
    + answerArea
    + '<div class="tokku-result" id="tokku_result"></div>'
    + '<button id="tokku_next" onclick="nextTokkuCard()" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題 →</button>'
    + '</div>';
  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleTokkuChoice(btn.dataset.tqid, btn.dataset.tchoice); });
  });
  var ti = document.getElementById('tokku_inp_' + qid);
  if (ti) ti.addEventListener('keydown', function(e){ if(e.key==='Enter') handleTokkuInput(qid); });
}
function handleTokkuInput(qid) {
  var d = weakDB[qid]; if (!d) return;
  var inp = document.getElementById('tokku_inp_' + qid);
  if (!inp || !inp.value.trim()) return;
  handleTokkuAnswer(qid, inp.value.trim(), false);
}
function normExpr(s) { return typeof s === 'string' ? s.replace(/\s*([-+])\s*/g, '$1').trim() : s; }
function handleTokkuChoice(qid, choice) { handleTokkuAnswer(qid, choice, true); }
function handleTokkuAnswer(qid, value, isChoice) {
  var d = weakDB[qid]; if (!d) return;
  var correct = isChoice ? normExpr(value) === normExpr(d.answer) : mathMatch(value, d.answer);
  tokkuSession.total++; weakDB[qid].total++;
  if (correct) { weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();
  if (isChoice) {
    document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b) { b.disabled = true; });
    var chosen = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + value + '"]');
    if (chosen) chosen.classList.add(correct ? 'selected-correct' : 'selected-wrong');
    if (!correct) {
      document.querySelectorAll('.choice-btn[data-tqid="' + qid + '"]').forEach(function(b) {
        if (normExpr(b.dataset.tchoice) === normExpr(d.answer)) b.classList.add('show-correct');
      });
    }
  }
  var newPct = getPct(qid);
  var res = document.getElementById('tokku_result');
  if (res) {
    if (correct) {
      xp++; localStorage.setItem('math_xp', xp); updateXP();
      res.className = 'tokku-result tokku-correct';
      res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 正答率'+newPct+'%！この問題は卒業！' : ' 正答率 → '+newPct+'%');
      showToast(getComment('kyon_correct'));
    } else {
      deductXP(3);
      res.className = 'tokku-result tokku-wrong';
      res.innerHTML = '❌ 間違い！ 正答率 → ' + newPct + '%<div class="tokku-answer">正解：' + d.answer + '</div>';
      showToast('きょん「また間違えた！！ルールをもう一度確認！！」');
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
    ? 'きょん「全部解けた！！昇格の予感！！」<br>西村「よくやった。次回も頼む」'
    : 'きょん「難しかった…でも諦めない！！」<br>西村「繰り返すことが力になる」';
  mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">' + emoji + '</div><div class="tokku-complete-title">特訓終了！</div><div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div><div style="font-size:14px;color:var(--text2)">' + tokkuSession.correct + ' / ' + tokkuSession.total + '問正解</div><div class="tokku-complete-msg" style="margin-top:16px">' + msg + '</div><div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button onclick="renderTokkuMode()" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回特訓！</button><button onclick="goSection(1)" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">Section 1 へ戻る</button></div></div>';
  renderWeakBar();
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
goSection(0);