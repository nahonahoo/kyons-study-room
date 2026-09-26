// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「方程式？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺数学できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「方程式で漫才できるかもしれない」' },
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
var answeredSet = JSON.parse(localStorage.getItem('math_eq_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('math_eq_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('math_weakdb')      || '{}');
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
  localStorage.setItem('math_xp',          xp);
  localStorage.setItem('math_eq_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('math_eq_') === 0 && getPct(id) < 80;
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
  localStorage.setItem('math_daily',          JSON.stringify(_daily));
  localStorage.setItem('math_eq_lastStudy',   _today);
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
    'きょん「合ってる！数学できるじゃん！！」',
    'きょん「やった！方程式マスターかも！」',
    'きょん「にっくん見て！解けた！！」',
    'きょん「天才！！俺めっちゃ天才！！」',
  ],
  nishi_correct: [
    '西村「正解。よく解けたね」',
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

// 数値・方程式の答え合わせ（数値のみ、または x=数値 形式を許容）
function mathMatch(input, answer) {
  var norm = function(s) {
    return s.trim().replace(/\s+/g,'').toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(c){ return String.fromCharCode(c.charCodeAt(0)-0xFEE0); })
      .replace(/ー/g,'-');
  };
  var ni = norm(input), na = norm(answer);
  if (ni === na) return true;
  // "x=3" と "3" を同一視
  var numOnly = na.replace(/^[a-z]=/, '');
  if (ni === numOnly) return true;
  var inputNum = ni.replace(/^[a-z]=/, '');
  if (inputNum === numOnly) return true;
  // 分数の許容：1/2 と 0.5 は別扱い（厳密）
  return false;
}

function makeInput(qid, jp, answer, xpPts, hint) {
  qMeta[qid] = { type:'input', answer:answer, xp:xpPts, jp:jp };
  var done = answeredSet[qid];
  var hintHtml = hint
    ? '<button class="hint-btn" onclick="toggleHint(\'' + qid + '\')">💡 ヒントを見る</button>'
      + '<div class="hint-box" id="hint_' + qid + '">' + hint + '</div>'
    : '';
  if (done) {
    return hintHtml
      + '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"></div>';
  }
  return hintHtml
    + '<div class="input-wrap">'
    + '<input class="q-input" id="inp_' + qid + '" type="text" placeholder="答え">'
    + '<button class="input-submit" data-qid="' + qid + '">確認</button>'
    + '</div>';
}
function toggleHint(qid) {
  var h = document.getElementById('hint_' + qid);
  if (h) h.style.display = h.style.display === 'block' ? 'none' : 'block';
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
    ? '<button class="hint-btn" onclick="toggleHint(\'' + qid + '\')">💡 途中式ヒント</button>'
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
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度！（移項ミスに注意）</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + '<div class="exp-card-title">📐 解き方</div>'
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
    var msgs = ['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！まだまだ大丈夫！！」','きょん「途中式のヒントを使ってみよう！」'];
    setTimeout(function() { showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100);
  }
  if (!tokkuBannerShown) { tokkuBannerShown = true; setTimeout(function() { showTokkuSuggestion(qid); }, 500); }
}
function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  localStorage.setItem('math_eq_answered', JSON.stringify(answeredSet));
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
  var prefix = 'math_eq_s' + currentSection + '_';
  var sectionQ = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sectionQ.length === 0) return;
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done) {
    sectionDone[currentSection] = true;
    localStorage.setItem('math_eq_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'📐 スタート',   title:'一次方程式',              sub:'中1数学の核心。移項をマスターすれば二次方程式まで解ける！' },
  { id:1, label:'方程式の基本',  title:'方程式の解き方',          sub:'移項・等式の性質・解の確認——計算問題10問' },
  { id:2, label:'比例式・文章題', title:'比例式と文章題',          sub:'a:b=c:d の解き方と文章題への応用' },
  { id:3, label:'確認テスト',    title:'確認テスト',              sub:'一次方程式の総まとめ！計算10問＋文章題5問' },
  { id:4, label:'🔗3年予習',     title:'3年予習：二次方程式',     sub:'因数分解と解の公式への橋渡し' },
  { id:5, label:'📊弱点',        title:'弱点ノート',              sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',        title:'弱点特訓モード',          sub:'間違えた問題だけを集中練習！' },
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
    + '<div class="section-badge">数学 一次方程式 · SECTION ' + id + '</div>'
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
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">方程式って x とか出てきて急に意味わかんなくなる！なんで文字が入るの！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">x は「わからない数を入れておく箱」だ。「何かを入れると5になる足し算は？」を式にすると x + 3 = 5 ——x の箱に 2 を入れたら成立する。これが方程式。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">x は箱！！なんかかわいい！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">解き方は「移項」——等号の反対側に移すとき符号を変える。これだけで一次方程式は全部解ける。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">移項！符号を変えて反対側！！覚えた！！</div></div></div>'
    + '</div>'
    + '<button class="start-btn" onclick="goSection(1)">📐 方程式の解き方から始める →</button>';
}

// ===== SECTION 1: 方程式の解き方 =====
function renderSection1() {
  var html = '';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 等式の性質と移項</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">等式の性質（4つ）</div>'
    + '<div class="ex">A = B なら：</div>'
    + '<div class="ex">① A + C = B + C　　② A − C = B − C</div>'
    + '<div class="ex">③ A × C = B × C　　④ A ÷ C = B ÷ C（C≠0）</div>'
    + '<div class="note">💡 両辺に「同じ操作」をしても等式は成り立つ</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">移項のルール（最重要！）</div>'
    + '<div class="ex">等号をまたいで移すとき → 符号を変える</div>'
    + '<div class="ex">例：x + 3 = 7　→　x = 7 − 3　→　x = 4</div>'
    + '<div class="ex">例：2x = x + 5　→　2x − x = 5　→　x = 5</div>'
    + '<div class="note">💡 「+ を移すと −」「− を移すと +」「左辺に x、右辺に数字」が基本形</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 解き方の手順</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">STEP 1：x を左辺、数を右辺に移項</div>'
    + '<div class="ex">3x + 2 = 11</div>'
    + '<div class="ex">→ 3x = 11 − 2　　（+2 を移項して −2）</div>'
    + '<div class="ex">→ 3x = 9</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">STEP 2：両辺を x の係数で割る</div>'
    + '<div class="ex">3x = 9　→　x = 9 ÷ 3　→　x = 3</div>'
    + '<div class="note">💡 最後に元の式に代入して確認：3×3 + 2 = 11 ✓</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">カッコ・分数がある場合</div>'
    + '<div class="ex">カッコ：先に展開する　2(x + 3) = 10　→　2x + 6 = 10</div>'
    + '<div class="ex">分数：両辺に分母の最小公倍数をかけて分母を消す</div>'
    + '<div class="ex">x/2 = 3　→　x = 6　（両辺×2）</div>'
    + '</div>'
    + '</div>';

  // 計算問題 10問（全て入力形式）
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;letter-spacing:.08em">✏️ 練習問題（答えを入力しよう）</div>';

  var qs = [
    { qid:'math_eq_s1_q0', jp:'次の方程式を解け。', formula:'x + 4 = 9',
      answer:'5', xp:5,
      hint:'x = 9 − 4（4 を右辺に移項、符号 + → −）',
      exp:'x + 4 = 9<br>x = 9 − 4<br><span style="color:var(--gold)">x = 5</span><br>確認：5 + 4 = 9 ✓' },
    { qid:'math_eq_s1_q1', jp:'次の方程式を解け。', formula:'x − 3 = 8',
      answer:'11', xp:5,
      hint:'x = 8 + 3（−3 を右辺に移項、符号 − → +）',
      exp:'x − 3 = 8<br>x = 8 + 3<br><span style="color:var(--gold)">x = 11</span><br>確認：11 − 3 = 8 ✓' },
    { qid:'math_eq_s1_q2', jp:'次の方程式を解け。', formula:'3x = 12',
      answer:'4', xp:5,
      hint:'x = 12 ÷ 3（両辺を係数 3 で割る）',
      exp:'3x = 12<br>x = 12 ÷ 3<br><span style="color:var(--gold)">x = 4</span><br>確認：3×4 = 12 ✓' },
    { qid:'math_eq_s1_q3', jp:'次の方程式を解け。', formula:'2x + 5 = 13',
      answer:'4', xp:6,
      hint:'① 5 を右辺に移項 → 2x = 13 − 5 = 8<br>② 両辺を 2 で割る → x = 4',
      exp:'2x + 5 = 13<br>2x = 13 − 5<br>2x = 8<br><span style="color:var(--gold)">x = 4</span>' },
    { qid:'math_eq_s1_q4', jp:'次の方程式を解け。', formula:'5x − 3 = 17',
      answer:'4', xp:6,
      hint:'① −3 を右辺に移項 → 5x = 17 + 3 = 20<br>② 両辺を 5 で割る → x = 4',
      exp:'5x − 3 = 17<br>5x = 17 + 3<br>5x = 20<br><span style="color:var(--gold)">x = 4</span>' },
    { qid:'math_eq_s1_q5', jp:'次の方程式を解け。', formula:'4x = 3x + 7',
      answer:'7', xp:6,
      hint:'3x を左辺に移項 → 4x − 3x = 7 → x = 7',
      exp:'4x = 3x + 7<br>4x − 3x = 7<br><span style="color:var(--gold)">x = 7</span>' },
    { qid:'math_eq_s1_q6', jp:'次の方程式を解け。', formula:'3x + 2 = x + 10',
      answer:'4', xp:7,
      hint:'① x を左辺に移項：3x − x = 10 − 2<br>② 2x = 8<br>③ x = 4',
      exp:'3x + 2 = x + 10<br>3x − x = 10 − 2<br>2x = 8<br><span style="color:var(--gold)">x = 4</span>' },
    { qid:'math_eq_s1_q7', jp:'次の方程式を解け。', formula:'2(x + 3) = 14',
      answer:'4', xp:7,
      hint:'① カッコを展開：2x + 6 = 14<br>② 移項：2x = 14 − 6 = 8<br>③ x = 4',
      exp:'2(x + 3) = 14<br>2x + 6 = 14<br>2x = 8<br><span style="color:var(--gold)">x = 4</span>' },
    { qid:'math_eq_s1_q8', jp:'次の方程式を解け。', formula:'−3x + 9 = 0',
      answer:'3', xp:7,
      hint:'① 9 を右辺に移項：−3x = −9<br>② 両辺を −3 で割る：x = 3',
      exp:'−3x + 9 = 0<br>−3x = −9<br><span style="color:var(--gold)">x = 3</span><br>（負の係数でも ÷ −3 すれば OK）' },
    { qid:'math_eq_s1_q9', jp:'次の方程式を解け。', formula:'x/2 + 1 = 4',
      answer:'6', xp:8,
      hint:'① 1 を移項：x/2 = 3<br>② 両辺×2：x = 6',
      exp:'x/2 + 1 = 4<br>x/2 = 3<br>x = 3 × 2<br><span style="color:var(--gold)">x = 6</span>' },
  ];

  qs.forEach(function(q) {
    html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });

  return html;
}

// ===== SECTION 2: 比例式・文章題 =====
function renderSection2() {
  var html = '';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 比例式の解き方</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">基本ルール：a:b = c:d → ad = bc（外項の積＝内項の積）</div>'
    + '<div class="ex">2:3 = 4:x　→　2×x = 3×4　→　2x = 12　→　x = 6</div>'
    + '<div class="ex">外々（2と x）をかけたもの＝内々（3と4）をかけたもの</div>'
    + '<div class="note">💡 比例式は必ず「内項・外項の積が等しい」から方程式に変換！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">手順</div>'
    + '<div class="ex">① ad = bc を作る　② 方程式として解く　③ 確認する</div>'
    + '<div class="ex">例：x:5 = 6:10　→　10x = 30　→　x = 3</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 文章題の立式手順</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">3ステップ</div>'
    + '<div class="ex">① 求めるものを x とおく</div>'
    + '<div class="ex">② 等しい関係を見つけて方程式を作る</div>'
    + '<div class="ex">③ 解いて、問題の意味に合うか確認する</div>'
    + '<div class="note">💡 「〇倍」「〇より多い」「合計が〇」がキーワード。まず日本語を式に翻訳！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">典型パターン</div>'
    + '<div class="ex">「Aの3倍は B より2多い」→ 3A = B + 2</div>'
    + '<div class="ex">「合計が C 円」→ 一方を x、もう一方を C-x</div>'
    + '<div class="ex">「個あたり P 円、n 個で合計 Q 円」→ Pn = Q</div>'
    + '</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;letter-spacing:.08em">✏️ 練習問題（答えを入力しよう）</div>';

  var qs = [
    { qid:'math_eq_s2_q0', jp:'比例式を解け。', formula:'2 : 3 = 8 : x',
      answer:'12', xp:5,
      hint:'外項の積＝内項の積 → 2×x = 3×8 → 2x = 24',
      exp:'2 : 3 = 8 : x<br>外項×外項 = 内項×内項<br>2x = 3 × 8<br>2x = 24<br><span style="color:var(--gold)">x = 12</span>' },
    { qid:'math_eq_s2_q1', jp:'比例式を解け。', formula:'x : 5 = 6 : 10',
      answer:'3', xp:5,
      hint:'10x = 5×6 → 10x = 30 → x = 3',
      exp:'x : 5 = 6 : 10<br>10x = 5 × 6<br>10x = 30<br><span style="color:var(--gold)">x = 3</span>' },
    { qid:'math_eq_s2_q2', jp:'比例式を解け。', formula:'4 : x = 2 : 3',
      answer:'6', xp:5,
      hint:'4×3 = 2×x → 12 = 2x → x = 6',
      exp:'4 : x = 2 : 3<br>4 × 3 = 2 × x<br>12 = 2x<br><span style="color:var(--gold)">x = 6</span>' },
    { qid:'math_eq_s2_q3', jp:'比例式を解け。', formula:'3 : 7 = 9 : x',
      answer:'21', xp:5,
      hint:'3x = 7×9 → 3x = 63 → x = 21',
      exp:'3 : 7 = 9 : x<br>3 × x = 7 × 9<br>3x = 63<br><span style="color:var(--gold)">x = 21</span>' },
    { qid:'math_eq_s2_q4', jp:'えんぴつ 5 本が 250 円のとき、8 本では何円か？（x 円として式を立てて解け）', formula:'5 : 250 = 8 : x',
      answer:'400', xp:6,
      hint:'5x = 250×8 → 5x = 2000 → x = 400',
      exp:'5 : 250 = 8 : x<br>5x = 250 × 8<br>5x = 2000<br><span style="color:var(--gold)">x = 400（円）</span>' },
    { qid:'math_eq_s2_q5', jp:'ある数 x の 2 倍から 5 を引くと 11 になる。x はいくつか？', formula:'2x − 5 = 11',
      answer:'8', xp:6,
      hint:'2x = 11 + 5 → 2x = 16 → x = 8',
      exp:'2x − 5 = 11<br>2x = 11 + 5<br>2x = 16<br><span style="color:var(--gold)">x = 8</span><br>確認：2×8 − 5 = 11 ✓' },
    { qid:'math_eq_s2_q6', jp:'1 個 x 円のりんごを 1 個と 100 円のみかんを 3 個買ったら合計 420 円だった。x はいくつか？', formula:'x + 100×3 = 420',
      answer:'120', xp:7,
      hint:'x + 300 = 420 → x = 420 − 300 = 120',
      exp:'x + 100 × 3 = 420<br>x + 300 = 420<br><span style="color:var(--gold)">x = 120（円）</span>' },
    { qid:'math_eq_s2_q7', jp:'兄と弟の所持金の合計は 1200 円。兄は弟の 3 倍持っている。弟の所持金は何円か？', formula:'3x + x = 1200',
      answer:'300', xp:7,
      hint:'弟を x円とすると兄は 3x円。合計 4x = 1200 → x = 300',
      exp:'弟を x 円、兄を 3x 円とおく<br>x + 3x = 1200<br>4x = 1200<br><span style="color:var(--gold)">x = 300（円）</span><br>兄：900円、弟：300円、合計 1200円 ✓' },
    { qid:'math_eq_s2_q8', jp:'父の年齢は子の 4 倍より 2 多く、42 歳である。子の年齢は何歳か？', formula:'4x + 2 = 42',
      answer:'10', xp:7,
      hint:'4x = 42 − 2 → 4x = 40 → x = 10',
      exp:'子の年齢を x 歳とおく<br>4x + 2 = 42<br>4x = 40<br><span style="color:var(--gold)">x = 10（歳）</span><br>確認：4×10 + 2 = 42 ✓' },
    { qid:'math_eq_s2_q9', jp:'大小 2 つの数の差が 8 で、大きい方は小さい方の 3 倍である。小さい方の数は？', formula:'3x − x = 8',
      answer:'4', xp:8,
      hint:'小さい方を x、大きい方は 3x。差が 8 → 3x − x = 8 → 2x = 8',
      exp:'小さい方を x とおく<br>大きい方 = 3x<br>3x − x = 8<br>2x = 8<br><span style="color:var(--gold)">x = 4</span><br>大：12、小：4、差 8 ✓、3倍関係 ✓' },
  ];

  qs.forEach(function(q) {
    html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });

  return html;
}

// ===== SECTION 3: 確認テスト =====
function renderSection3() {
  var html = '';

  html += '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:6px">📝 確認テスト — 一次方程式 まとめ</div>'
    + '<div style="font-size:13px;color:var(--text2);line-height:2.0">計算問題 10問 ＋ 選択問題 5問。Section 1・2 の内容をすべて確認しよう！</div>'
    + '</div>';

  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 14px;font-weight:bold">── 計算問題（入力） ──</div>';

  var inputQs = [
    { qid:'math_eq_s3_in0', jp:'方程式を解け。', formula:'7x − 3 = 18',
      answer:'3', xp:5,
      hint:'7x = 18 + 3 → 7x = 21 → x = 3',
      exp:'7x − 3 = 18<br>7x = 18 + 3 = 21<br><span style="color:var(--gold)">x = 3</span>' },
    { qid:'math_eq_s3_in1', jp:'方程式を解け。', formula:'2x + 7 = x + 15',
      answer:'8', xp:5,
      hint:'2x − x = 15 − 7 → x = 8',
      exp:'2x + 7 = x + 15<br>2x − x = 15 − 7<br><span style="color:var(--gold)">x = 8</span>' },
    { qid:'math_eq_s3_in2', jp:'方程式を解け。', formula:'3(x − 4) = 9',
      answer:'7', xp:6,
      hint:'カッコを展開：3x − 12 = 9 → 3x = 21 → x = 7',
      exp:'3(x − 4) = 9<br>3x − 12 = 9<br>3x = 21<br><span style="color:var(--gold)">x = 7</span>' },
    { qid:'math_eq_s3_in3', jp:'方程式を解け。', formula:'x/3 − 2 = 1',
      answer:'9', xp:6,
      hint:'x/3 = 1 + 2 = 3 → x = 3 × 3 = 9',
      exp:'x/3 − 2 = 1<br>x/3 = 3<br>x = 3 × 3<br><span style="color:var(--gold)">x = 9</span>' },
    { qid:'math_eq_s3_in4', jp:'方程式を解け。', formula:'−2x + 5 = −3',
      answer:'4', xp:6,
      hint:'−2x = −3 − 5 = −8 → x = −8 ÷ (−2) = 4',
      exp:'−2x + 5 = −3<br>−2x = −8<br><span style="color:var(--gold)">x = 4</span>' },
    { qid:'math_eq_s3_in5', jp:'比例式を解け。', formula:'5 : x = 3 : 6',
      answer:'10', xp:6,
      hint:'5×6 = 3×x → 30 = 3x → x = 10',
      exp:'5 : x = 3 : 6<br>5 × 6 = 3 × x<br>30 = 3x<br><span style="color:var(--gold)">x = 10</span>' },
    { qid:'math_eq_s3_in6', jp:'比例式を解け。', formula:'x : 4 = 5 : 2',
      answer:'10', xp:6,
      hint:'2x = 4×5 → 2x = 20 → x = 10',
      exp:'x : 4 = 5 : 2<br>2 × x = 4 × 5<br>2x = 20<br><span style="color:var(--gold)">x = 10</span>' },
    { qid:'math_eq_s3_in7', jp:'ある数の 3 倍から 4 引くと 11 になる。その数は？', formula:'3x − 4 = 11',
      answer:'5', xp:6,
      hint:'3x = 11 + 4 = 15 → x = 5',
      exp:'3x − 4 = 11<br>3x = 15<br><span style="color:var(--gold)">x = 5</span>' },
    { qid:'math_eq_s3_in8', jp:'1 本 x 円のペンを 4 本と 50 円の消しゴム 1 個を買ったら合計 370 円だった。x はいくつか？', formula:'4x + 50 = 370',
      answer:'80', xp:7,
      hint:'4x = 370 − 50 = 320 → x = 80',
      exp:'4x + 50 = 370<br>4x = 320<br><span style="color:var(--gold)">x = 80（円）</span>' },
    { qid:'math_eq_s3_in9', jp:'現在 x 歳の子の 5 年後の年齢が、現在の 2 倍になる。x はいくつか？', formula:'x + 5 = 2x',
      answer:'5', xp:7,
      hint:'x + 5 = 2x → 5 = 2x − x → x = 5',
      exp:'x + 5 = 2x<br>5 = 2x − x<br><span style="color:var(--gold)">x = 5</span><br>確認：5歳→5年後10歳、現在の2倍 ✓' },
  ];

  inputQs.forEach(function(q) {
    html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });

  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 14px;font-weight:bold">── 選択問題 ──</div>';

  var choiceQs = [
    { qid:'math_eq_s3_ch0', jp:'4x + 3 = 15 の解は？',
      answer:'x = 3', choices:['x = 2','x = 3','x = 4','x = 5'],
      exp:'📐 ルール：移項 → 4x = 15 − 3 = 12 → x = 3<br>✅ x = 3<br>確認：4×3 + 3 = 15 ✓' },
    { qid:'math_eq_s3_ch1', jp:'3 : 4 = 6 : x のとき x の値は？',
      answer:'x = 8', choices:['x = 6','x = 7','x = 8','x = 9'],
      exp:'📐 ルール：外項の積＝内項の積 → 3x = 4×6 = 24 → x = 8<br>✅ x = 8' },
    { qid:'math_eq_s3_ch2', jp:'2(x + 5) = 16 の解は？',
      answer:'x = 3', choices:['x = 2','x = 3','x = 4','x = 5'],
      exp:'📐 カッコを展開 → 2x + 10 = 16 → 2x = 6 → x = 3<br>✅ x = 3' },
    { qid:'math_eq_s3_ch3', jp:'−5x = 20 の解は？',
      answer:'x = −4', choices:['x = −4','x = −3','x = 4','x = −25'],
      exp:'📐 両辺を −5 で割る → x = 20 ÷ (−5) = −4<br>✅ x = −4<br>負の係数でも ÷ (負の数) で解ける！' },
    { qid:'math_eq_s3_ch4', jp:'ある数の 3 倍と 7 の和が 22 になる。その数は？',
      answer:'5', choices:['4','5','6','7'],
      exp:'📐 ある数を x とおく → 3x + 7 = 22 → 3x = 15 → x = 5<br>✅ 5<br>確認：3×5 + 7 = 22 ✓' },
  ];

  var shuffledChoice = choiceQs.map(function(q) { q._qid = q.qid; return q; });
  shuffledChoice.forEach(function(q) {
    html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
  });

  return html;
}

// ===== SECTION 4: 3年予習 =====
function renderSection4() {
  return '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:24px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">🔗 一次方程式→二次方程式への接続</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '一次方程式（ax + b = 0）→ <span style="color:var(--gold)">二次方程式（ax² + bx + c = 0）（中3）</span><br>'
    + '移項・等式の性質 → <span style="color:var(--gold)">平方根・因数分解（中3）</span><br>'
    + '文章題の立式 → <span style="color:var(--gold)">連立方程式・二次方程式の文章題（中2・中3）</span><br>'
    + '比例式 a:b=c:d → <span style="color:var(--gold)">相似比・面積比（中3図形）</span>'
    + '</div></div>'
    + '<div style="background:rgba(245,197,24,0.06);border:1px solid rgba(245,197,24,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px">⚡ 中3でよく出る方程式（先取り）</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'x² = a → x = ±√a（平方根）<br>'
    + '（x + a)(x + b) = 0 → x = −a または x = −b（因数分解）<br>'
    + 'x = (−b ± √(b²−4ac)) / 2a（解の公式）'
    + '</div></div>';
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var prefix = 'math_eq_s3_';
  var total   = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; }).length;
  var correct = Object.keys(answeredSet).filter(function(id){ return id.indexOf(prefix) === 0 && answeredSet[id]; }).length;
  if (total === 0) total = 15;
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '😄' : '🐣';
  var msg = pct >= 90
    ? 'きょん「全部解けた！！俺、方程式マスターじゃん！！」<br>西村「よくやった。次は連立方程式に挑もう」'
    : pct >= 70
    ? 'きょん「かなりできた！もう少しで完璧！！」<br>西村「惜しい。移項ミスを見直したら完璧になるよ」'
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
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_eq_') === 0; });
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
    mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div class="tokku-complete-msg">すべて正答率80%以上！<br>きょん「俺、方程式マスターじゃん！！」<br>西村「本当に成長したね」</div><button onclick="goSection(1)" style="margin-top:24px;background:var(--purple);color:#fff;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button></div>';
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
function handleTokkuChoice(qid, choice) { handleTokkuAnswer(qid, choice, true); }
function handleTokkuAnswer(qid, value, isChoice) {
  var d = weakDB[qid]; if (!d) return;
  var correct = isChoice ? value === d.answer : mathMatch(value, d.answer);
  tokkuSession.total++; weakDB[qid].total++;
  if (correct) { weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();
  if (isChoice) {
    document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b) { b.disabled = true; });
    var chosen = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + value + '"]');
    if (chosen) chosen.classList.add(correct ? 'selected-correct' : 'selected-wrong');
    if (!correct) { var ok = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + d.answer + '"]'); if (ok) ok.classList.add('show-correct'); }
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
      showToast('きょん「また間違えた！！移項をもう一度確認！！」');
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