// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「生物っていっぱいわからん！」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺生物できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「遺伝で漫才できるかもしれない」' },
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
var answeredSet = JSON.parse(localStorage.getItem('sci_life_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('sci_life_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('sci_weakdb') || '{}');
var attemptCounts = {};
if (localStorage.getItem('sci_life_ver') !== '2') {
  Object.keys(weakDB).forEach(function(k) { if (/^sci_life_s[1-4]_q\d+$/.test(k)) delete weakDB[k]; });
  Object.keys(answeredSet).forEach(function(k) { if (/^sci_life_s[1-4]_q\d+$/.test(k)) delete answeredSet[k]; });
  [1, 2, 3, 4].forEach(function(n) { delete sectionDone[n]; });
  localStorage.setItem('sci_weakdb', JSON.stringify(weakDB));
  localStorage.setItem('sci_life_answered', JSON.stringify(answeredSet));
  localStorage.setItem('sci_life_sections', JSON.stringify(sectionDone));
  localStorage.setItem('sci_life_ver', '2');
}

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
  localStorage.setItem('sci_xp', xp);
  localStorage.setItem('sci_life_answered', JSON.stringify(answeredSet));
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

function getPct(qid) {
  var d = weakDB[qid];
  if (!d || d.total === 0) return 0;
  return Math.round(d.correct / d.total * 100);
}
function getWeakQuestions() {
  return Object.keys(weakDB).filter(function(id) {
    return id.indexOf('sci_life_') === 0 && getPct(id) < 80;
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
  localStorage.setItem('sci_daily', JSON.stringify(_daily));
  localStorage.setItem('sci_life_lastStudy', _today);
  renderWeakBar();
  renderTabs();
}

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
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  if (type === 'levelup') t.className = 'toast levelup';
  else if (type === 'demote') t.className = 'toast demote';
  else t.className = 'toast';
  t.classList.add('show');
  var dur = type === 'levelup' ? 4000 : type === 'demote' ? 3500 : 2500;
  setTimeout(function() { t.classList.remove('show'); }, dur);
}
var COMMENTS = {
  kyon_correct: ['きょん「合ってる！生物できるじゃん！！」','きょん「やった！天才かも！」','きょん「にっくん見て！わかってきた！！」'],
  nishi_correct: ['西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「ちゃんとわかってる」'],
  kyon_wrong: ['きょん「あれ！？間違えた！もう一回！」','きょん「えっ違うの！？にっくん助けて！」']
};
function getComment(type) { var arr = COMMENTS[type]; return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}
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
    + '<div class="q-feedback correct-fb" id="fb_' + qid + '" style="' + (done ? 'display:block' : 'display:none') + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb" id="fbw_' + qid + '" style="display:none">✗ もう一度チャレンジ！</div>'
    + '<div class="exp-card" id="exp_card_' + qid + '" style="' + (done ? '' : 'display:none') + '">'
    + '<div class="exp-card-title">📌 解説</div>'
    + '<div style="color:var(--text);font-size:15px;line-height:2.0">' + exp + '</div>'
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
  else markWrong(qid, meta, choice);
}
function markCorrect(qid, meta, choice) {
  speak('正解！');
  recordResult(qid, true);
  var lvUp = addXP(meta.xp || 4, qid);
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) card.classList.add('correct-card');
  var fb = document.getElementById('fb_' + qid); if (fb) fb.style.display='block';
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display='none';
  var ac = document.getElementById('ac_' + qid); if (ac) { ac.textContent = getComment('nishi_correct'); ac.style.display='block'; }
  var ec = document.getElementById('exp_card_' + qid); if (ec) ec.style.display = 'block';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true;
    if (b.dataset.choice === meta.answer) b.classList.add('selected-correct');
  });
  var inp = document.getElementById('inp_' + qid); if (inp) inp.disabled = true;
  if (lvUp) showToast('レベルアップ！', 'levelup');
  showToast('正解！', 'good');
  checkSectionComplete();
}
function markWrong(qid, meta, choice) {
  speak('もう一回');
  recordResult(qid, false);
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) card.classList.add('wrong-card');
  var fb = document.getElementById('fb_' + qid); if (fb) fb.style.display='none';
  var fbw = document.getElementById('fbw_' + qid); if (fbw) fbw.style.display='block';
  var ac = document.getElementById('ac_' + qid); if (ac) { ac.textContent = getComment('kyon_wrong'); ac.style.display='block'; }
  var ec = document.getElementById('exp_card_' + qid); if (ec) ec.style.display = 'block';
  var inp = document.getElementById('inp_' + qid); if (inp) inp.style.borderColor='var(--red)';
  attemptCounts[qid] = (attemptCounts[qid] || 0) + 1;
  if (attemptCounts[qid] >= 2) {
    var reveal = document.getElementById('ar_' + qid); if (reveal) reveal.style.display = 'block';
    var ans = document.getElementById('ar_ans_' + qid); if (ans) ans.textContent = meta.answer;
  }
  showToast('もう一度チャレンジ！', 'bad');
}

function checkSectionComplete() {
  var prefix = 'sci_life_s' + currentSection + '_';
  var sectionQ = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sectionQ.length === 0) return;
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done && !sectionDone[currentSection]) {
    sectionDone[currentSection] = true;
    localStorage.setItem('sci_life_sections', JSON.stringify(sectionDone));
    var banner = document.getElementById('sectionCompleteBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'sectionCompleteBanner';
      banner.style.cssText = 'margin:14px 0 18px;padding:14px 16px;border-radius:12px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.5);';
      banner.innerHTML = '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--green);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div><div style="font-size:14px;color:var(--text)">次の単元へ進もう！</div>';
      var main = document.getElementById('mainContent');
      main.prepend(banner);
    }
    renderTabs();
  }
}

var currentSection = 0;
var SECTIONS = [
  { id:0, label:'⚗️ スタート', title:'生命の連続性（成長・生殖・遺伝・進化）', sub:'命のバトンの渡し方を4つの話で整理しよう！' },
  { id:1, label:'成長', title:'細胞分裂と生物の成長', sub:'根の観察・体細胞分裂の順番・染色体' },
  { id:2, label:'生殖', title:'生物のふえ方（無性生殖・有性生殖）', sub:'分裂・栄養生殖・受精・発生・減数分裂' },
  { id:3, label:'遺伝', title:'遺伝の規則性と遺伝子', sub:'顕性・潜性・分離の法則・かけ合わせの計算' },
  { id:5, label:'進化①', title:'生物の種類の多様性と進化①', sub:'5つのなかまの特徴と、地球に現れた順番（化石の順）' },
  { id:6, label:'進化②始祖鳥', title:'生物の種類の多様性と進化②', sub:'始祖鳥・相同器官・進化とは何か' },
  { id:7, label:'進化③入試', title:'生物の種類の多様性と進化③ 入試チャレンジ', sub:'難しめ。特徴の組み合わせ・共通点・文の誤り探し' },
  { id:4, label:'確認', title:'確認テスト（成長・生殖・遺伝）', sub:'入試形式のまとめ問題' }
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab';
    if (s.id === currentSection) cls += ' active';
    if (sectionDone[s.id]) cls += ' done';
    html += '<button class="' + cls + '" data-sid="' + s.id + '">' + s.label + (sectionDone[s.id] ? ' ✓' : '') + '</button>';
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
}
function sectionIndex(id) {
  for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].id === id) return i;
  return 0;
}
function renderSection(id) {
  var s = SECTIONS[sectionIndex(id)];
  var html = '<div class="section-header">'
    + '<div class="section-badge">理科 中3生物 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';
  if (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();
  else if (id === 5) html += renderSection5();
  else if (id === 6) html += renderSection6();
  else if (id === 7) html += renderSection7();
  html += '<div class="section-actions" style="margin-top:20px;display:flex;justify-content:center;">'
    + '<button class="next-section-btn" id="nextBtn">次へ進む →</button>'
    + '</div>';
  document.getElementById('mainContent').innerHTML = html;
  var nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.addEventListener('click', function() {
    var idx = sectionIndex(id);
    if (idx < SECTIONS.length - 1) goSection(SECTIONS[idx + 1].id);
    else showFinalResult();
  });
  renderWeakBar();
  setupEvents();
}
function setupEvents() {
  document.querySelectorAll('.input-submit[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleInput(btn.dataset.qid); });
  });
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleChoice(btn.dataset.qid, btn.dataset.choice); });
  });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var qid = btn.dataset.qid;
      document.getElementById('ar_' + qid).style.display = 'block';
      document.getElementById('ar_ans_' + qid).textContent = qMeta[qid].answer;
    });
  });
  document.querySelectorAll('.start-btn[data-go]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      goSection(parseInt(btn.dataset.go));
    });
  });
}
// ===== Section 0〜4：成長・生殖・遺伝（2026-09-29 全面作り直し。東京書籍「生命の連続性」準拠） =====
function lifeQs(html, sec, qs) {
  qs.forEach(function(q, i) { html += makeChoices('sci_life_s' + sec + '_n' + i, q.jp, q.answer, q.choices, q.exp); });
  return html;
}
function cellDivSVG() {
  function cell(x, y, w, inner) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="90" rx="10" fill="rgba(61,220,132,0.10)" stroke="#3ddc84" stroke-width="2"/>' + inner; }
  function X(cx, cy, c) { return '<line x1="' + (cx - 6) + '" y1="' + (cy - 7) + '" x2="' + (cx + 6) + '" y2="' + (cy + 7) + '" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round"/><line x1="' + (cx + 6) + '" y1="' + (cy - 7) + '" x2="' + (cx - 6) + '" y2="' + (cy + 7) + '" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round"/>'; }
  function I(cx, cy, c) { return '<line x1="' + cx + '" y1="' + (cy - 7) + '" x2="' + cx + '" y2="' + (cy + 7) + '" stroke="' + c + '" stroke-width="3.5" stroke-linecap="round"/>'; }
  var P = '#ff5ca8', Bl = '#4aa8ff';
  var s = '<svg viewBox="0 0 372 250" style="width:100%;max-width:560px;display:block;margin:8px auto" role="img" aria-label="体細胞分裂の順番">';
  // 上段
  s += cell(4, 10, 112, '<circle cx="60" cy="55" r="20" fill="rgba(255,255,255,0.12)" stroke="#9aa4b2"/>');
  s += cell(130, 10, 112, X(165, 38, P) + X(200, 42, Bl) + X(175, 72, Bl) + X(208, 70, P));
  s += cell(256, 10, 112, X(312, 26, P) + X(312, 46, Bl) + X(312, 66, Bl) + X(312, 86, P) + '<line x1="312" y1="14" x2="312" y2="96" stroke="rgba(255,255,255,0.2)" stroke-dasharray="3 3"/>');
  // 下段
  s += cell(4, 138, 112, I(20, 160, P) + I(20, 178, Bl) + I(20, 196, Bl) + I(20, 214, P) + I(100, 160, P) + I(100, 178, Bl) + I(100, 196, Bl) + I(100, 214, P) + '<text x="60" y="192" text-anchor="middle" fill="#ffd84d" font-size="16">⇐ ⇒</text>');
  s += cell(130, 138, 112, '<circle cx="158" cy="183" r="15" fill="rgba(255,255,255,0.12)" stroke="#9aa4b2"/><circle cx="214" cy="183" r="15" fill="rgba(255,255,255,0.12)" stroke="#9aa4b2"/><line x1="186" y1="140" x2="186" y2="226" stroke="#ffd84d" stroke-width="3"/>');
  s += '<rect x="256" y="138" width="52" height="90" rx="10" fill="rgba(61,220,132,0.10)" stroke="#3ddc84" stroke-width="2"/><rect x="316" y="138" width="52" height="90" rx="10" fill="rgba(61,220,132,0.10)" stroke="#3ddc84" stroke-width="2"/><circle cx="282" cy="183" r="13" fill="rgba(255,255,255,0.12)" stroke="#9aa4b2"/><circle cx="342" cy="183" r="13" fill="rgba(255,255,255,0.12)" stroke="#9aa4b2"/>';
  var labels = [[60,'分裂前'],[186,'① 染色体が現れる'],[312,'② 中央に並ぶ'],[60,'③ 両はしへ分かれる'],[186,'④ 核2つ・しきり'],[312,'⑤ 2つの細胞に']];
  labels.forEach(function(l, i) { s += '<text x="' + l[0] + '" y="' + (i < 3 ? 116 : 244) + '" text-anchor="middle" fill="#e6edf3" font-size="12.5" font-weight="bold">' + l[1] + '</text>'; });
  return s + '</svg>';
}
function punnett(p1, p2, cells, cap) {
  var td = 'border:2px solid var(--border);padding:10px;text-align:center;font-size:18px;font-weight:bold;';
  var h = '<table style="border-collapse:collapse;margin:8px auto">'
    + '<tr><td style="' + td + 'color:var(--text2);font-size:13px">' + cap + '</td><td style="' + td + 'color:#4aa8ff">' + p2[0] + '</td><td style="' + td + 'color:#4aa8ff">' + p2[1] + '</td></tr>';
  for (var r = 0; r < 2; r++) {
    h += '<tr><td style="' + td + 'color:#ff5ca8">' + p1[r] + '</td>';
    for (var c = 0; c < 2; c++) {
      var v = cells[r][c];
      h += '<td style="' + td + (v.indexOf('A') !== -1 ? 'color:var(--gold)' : 'color:#b69cff') + '">' + v + '</td>';
    }
    h += '</tr>';
  }
  return h + '</table>';
}

function renderSection0() {
  var box = 'padding:12px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);font-size:15px;line-height:1.9;';
  return evoChat([
      ['kyon', '生命の連続性って、名前がもう難しそう…'],
      ['nishi', '中身は4つの話だけだ。「体が大きくなるしくみ」「子どもをつくるしくみ」「親の特徴が子に伝わるしくみ」「長い時間で生物が変わっていくしくみ」。順番に1つずつ行こう'],
      ['shun', 'きょんさん、ひとことで言うと「命のバトンの渡し方」の単元です。バトンの中身は遺伝子。今日はそのバトンを落とさず最後まで運びましょう']
    ])
    + '<div class="rule-card">'
    + '<div class="rule-card-title">🗺️ この単元の地図</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    + '<div style="' + box + '"><b style="color:var(--gold)">① 成長</b><br>細胞分裂で細胞がふえ、それぞれが大きくなる</div>'
    + '<div style="' + box + '"><b style="color:var(--gold)">② 生殖</b><br>無性生殖と有性生殖。受精・発生・減数分裂</div>'
    + '<div style="' + box + '"><b style="color:var(--gold)">③ 遺伝</b><br>遺伝子・顕性と潜性・分離の法則・3：1の計算</div>'
    + '<div style="' + box + '"><b style="color:var(--gold)">④ 進化</b><br>化石の順番・始祖鳥・相同器官</div>'
    + '</div>'
    + '<div class="note">💡 入試では「観察の手順の理由」「分裂の順番」「染色体の数」「かけ合わせの比の計算」がよく出る。</div>'
    + '</div>'
    + '<button class="start-btn" data-go="1">🧬 成長のしくみから始める →</button>'
    + '<button class="start-btn" data-go="5" style="margin-left:8px">🦅 始祖鳥・進化へジャンプ →</button>';
}

function renderSection1() {
  var html = evoChat([
    ['kyon', '体が大きくなるのって、細胞が1個ずつ大きくなるから？'],
    ['nishi', 'それだけではない。細胞分裂で<b>数がふえて</b>、ふえた細胞が<b>それぞれ大きくなる</b>。この2つのセットで成長するんだ']
  ]);
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🌱 根はどこがのびる？</div>'
    + '<div class="ex">発芽したソラマメなどの根に等間隔の印をつけて数日観察すると、<b>根の先端に近い部分</b>の間隔がいちばん広がる。</div>'
    + '<div class="ex">根の先端近くでは細胞分裂がさかんで、<b>小さい細胞がたくさん</b>ある。根もとに近いほど、細胞は大きい。</div>'
    + '<div class="rule-card-title" style="margin-top:16px">🔬 タマネギの根の観察（手順と理由がセットで出る）</div>'
    + '<div class="ex">① 根の先端を切りとり、<b>うすい塩酸</b>に入れてあたためる → <b>細胞どうしを離れやすくする</b>ため</div>'
    + '<div class="ex">② 水で洗い、<b>染色液（酢酸オルセイン液・酢酸カーミン液など）</b>をたらす → <b>核や染色体を染めて見やすくする</b>ため</div>'
    + '<div class="ex">③ カバーガラスをかけ、ろ紙の上から<b>指で押しつぶす</b> → <b>細胞の重なりを少なくする</b>ため</div>'
    + '<div class="rule-card-title" style="margin-top:16px">✂️ 体細胞分裂の順番</div>'
    + cellDivSVG()
    + '<div class="ex">分裂の前に、染色体は<b>複製されて2倍</b>になっている → ① 核の中に<b>染色体</b>が見えるようになる → ② 染色体が細胞の<b>中央に並ぶ</b> → ③ 染色体が分かれて<b>両はしへ</b>移動 → ④ 両はしに<b>核が2つ</b>でき、中央に<b>しきり</b>ができる → ⑤ <b>2つの細胞</b>になり、それぞれが大きくなる</div>'
    + '<div class="note">📐 ルール：体細胞分裂の前後で、<b>染色体の数は同じ</b>（コピーしてから半分ずつ分けるから）。<br>💡 覚え方：「現れる → 並ぶ → 分かれる → 2つになる」。整列して、左右に解散、の体育の授業。</div>'
    + '</div>';
  return lifeQs(html, 1, [
    { jp:'生物のからだが成長するしくみとして、正しいものはどれか。', answer:'細胞分裂で細胞の数がふえ、それぞれが大きくなる', choices:['細胞分裂で細胞の数がふえ、それぞれが大きくなる','1つ1つの細胞が大きくなるだけで、数は変わらない','細胞がくっついて大きな1つの細胞になる','細胞の数が減って、残った細胞が大きくなる'],
      exp:evoExp('成長＝細胞の数がふえる（細胞分裂）＋ふえた細胞が大きくなる。', '分裂 → ふえる → 大きくなる', '大きくなるだけ、は半分しか合っていない', '成長は「数」と「大きさ」の2段階') },
    { jp:'発芽した根に等間隔で印をつけ、数日後に見た。印の間隔が最も広がっていたのはどこか。', answer:'根の先端に近い部分', choices:['根の先端に近い部分','根もと（種子に近い部分）','どこも同じように広がる','どこも広がらない'],
      exp:evoExp('根の先端近くで細胞分裂がさかんなので、そこがよくのびる。', '先端に近い部分', '根もとはあまりのびない', 'のびるのは「先っぽの近く」') },
    { jp:'根の先端近くの細胞と、根もとの細胞をくらべたときの説明として正しいものはどれか。', answer:'先端近くの細胞は小さく、分裂中のものが多い', choices:['先端近くの細胞は小さく、分裂中のものが多い','先端近くの細胞は大きく、分裂していない','どちらも同じ大きさである','根もとの細胞の方が小さく、分裂中のものが多い'],
      exp:evoExp('分裂したばかりの細胞は小さい。先端近く＝分裂がさかん＝小さい細胞が多い。', '先端近く：小さい・分裂中が多い', '根もと：分裂を終えて大きくなった細胞', '生まれたて＝小さい') },
    { jp:'タマネギの根の観察で、根をうすい塩酸に入れてあたためるのはなぜか。', answer:'細胞どうしを離れやすくするため', choices:['細胞どうしを離れやすくするため','核や染色体を染めるため','細胞分裂を速くするため','細胞の数をふやすため'],
      exp:evoExp('塩酸＝細胞どうしの結びつきを弱めて、ばらばらにしやすくする。', '離れやすくする', '染めるのは染色液の役目', '塩酸は「ほぐす」、染色液は「染める」、押しつぶすは「重なりを減らす」') },
    { jp:'観察で、酢酸オルセイン液などの染色液を使うのはなぜか。', answer:'核や染色体を染めて見やすくするため', choices:['核や染色体を染めて見やすくするため','細胞どうしを離れやすくするため','細胞を生きたままにするため','細胞壁をとかすため'],
      exp:evoExp('染色液は核や染色体を赤っぽく染める。', '核・染色体を染める', '離れやすくするのは塩酸', '「染」色液は「染」める') },
    { jp:'プレパラートをつくるとき、カバーガラスの上から押しつぶすのはなぜか。', answer:'細胞の重なりを少なくして見やすくするため', choices:['細胞の重なりを少なくして見やすくするため','細胞を分裂させるため','染色液を取りのぞくため','細胞を大きくするため'],
      exp:evoExp('細胞が重なっていると観察しにくいので、うすく広げる。', '重なりを減らす', '分裂させるためではない', '手順と理由は3点セットで覚える') },
    { jp:'細胞分裂のときに見られる、ひものようなものを何というか。', answer:'染色体', choices:['染色体','細胞膜','葉緑体','液胞'],
      exp:evoExp('分裂のときに核の中に見える、ひも状のもの＝染色体。遺伝子をふくむ。', '染色体', '葉緑体は光合成をするところ', '染色液でよく「染」まる「体」') },
    { jp:'体細胞分裂の順番として正しいものはどれか。<br>ア 染色体が中央に並ぶ　イ 核の中に染色体が現れる　ウ 2つの核ができ、しきりができる　エ 染色体が分かれて両はしへ移動する', answer:'イ→ア→エ→ウ', choices:['イ→ア→エ→ウ','ア→イ→エ→ウ','イ→エ→ア→ウ','ウ→イ→ア→エ'],
      exp:evoExp('現れる（イ）→ 並ぶ（ア）→ 分かれる（エ）→ 2つになる（ウ）。', 'イ→ア→エ→ウ', '並ぶ前に分かれることはない', '体育：集合 → 整列 → 左右に解散 → 2チーム') },
    { jp:'体細胞分裂の前後で、1つの細胞の染色体の数はどうなるか。', answer:'分裂の前と同じ', choices:['分裂の前と同じ','分裂の前の半分','分裂の前の2倍','分裂するたびに1本ずつ減る'],
      exp:evoExp('分裂の前に染色体が複製されて2倍になり、それを半分ずつ分けるので、数は同じ。', '同じ数', '半分になるのは減数分裂（生殖細胞をつくるとき）', 'コピーしてから分けるので減らない') },
    { jp:'体細胞分裂が始まる前、染色体はどうなっているか。', answer:'複製されて2倍になっている', choices:['複製されて2倍になっている','半分に減っている','すべて消えている','細胞の外に出ている'],
      exp:evoExp('分裂の準備として、染色体は同じものがもう1組つくられる（複製）。', '複製されて2倍', '半分に減るのは減数分裂でできる生殖細胞', 'コピーしてから分ける') },
    { jp:'顕微鏡で分裂中の細胞を探すとき、根のどの部分を観察するとよいか。', answer:'根の先端に近い部分', choices:['根の先端に近い部分','根もとに近い部分','根の表面の毛（根毛）','どこでも同じ'],
      exp:evoExp('分裂がさかんなのは根の先端近く。', '先端近くを観察', '根もとは分裂中の細胞が少ない', 'よくのびる場所＝分裂がさかんな場所') },
    { jp:'体細胞分裂で、植物の細胞と動物の細胞で異なる点はどれか。', answer:'植物の細胞は中央にしきりができて2つに分かれる', choices:['植物の細胞は中央にしきりができて2つに分かれる','動物の細胞だけ染色体が現れる','植物の細胞だけ染色体の数が半分になる','動物の細胞は分裂しない'],
      exp:evoExp('植物の細胞は中央にしきりができ、動物の細胞はくびれるように2つに分かれる。染色体の動きは同じ。', '植物＝しきり', '染色体の数や動きは植物も動物も同じ', '植物は細胞壁があるので「しきり」') }
  ]);
}

function renderSection2() {
  var box = 'padding:12px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);font-size:15px;line-height:1.9;';
  var html = evoChat([
    ['kyon', 'ジャガイモって、いもを植えたらまたジャガイモになるよね。あれも子ども？'],
    ['nishi', 'そうだ。オスとメスが関係しないふえ方を<b>無性生殖</b>という。受精するふえ方は<b>有性生殖</b>。この2つのちがいは「子の遺伝子が親と同じかどうか」だ'],
    ['shun', 'きょんさん、無性生殖はコピー機、有性生殖はミックスジュースです。コピーは親とまったく同じ、ミックスは2人分の材料が半分ずつ入るので、味がちょっと変わります']
  ]);
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔁 無性生殖（受精しない）</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'
    + '<div style="' + box + '"><b style="color:var(--gold)">分裂</b><br>ゾウリムシ・ミカヅキモ・アメーバ</div>'
    + '<div style="' + box + '"><b style="color:var(--gold)">出芽</b><br>酵母・ヒドラ</div>'
    + '<div style="' + box + '"><b style="color:var(--gold)">栄養生殖</b><br>ジャガイモのいも・サツマイモ・オランダイチゴのほふく茎・さし木</div>'
    + '</div>'
    + '<div class="note">📐 ルール：無性生殖の子は、親と<b>まったく同じ遺伝子</b> → 形質も親と同じ。</div>'

    + '<div class="rule-card-title" style="margin-top:16px">💞 有性生殖（生殖細胞が受精する）</div>'
    + '<div class="ex"><b>動物</b>：卵巣で<b>卵</b>、精巣で<b>精子</b>がつくられる → 受精して<b>受精卵</b> → 細胞分裂をくり返して<b>胚</b>になる → 親と同じ形に育つ。受精卵から親になるまでの過程を<b>発生</b>という。</div>'
    + '<div class="ex"><b>被子植物</b>：花粉がめしべの柱頭につく（受粉）→ <b>花粉管</b>がのびる → 花粉管の中の<b>精細胞</b>と、胚珠の中の<b>卵細胞</b>が受精 → 受精卵は<b>胚</b>、胚珠は<b>種子</b>、子房は<b>果実</b>になる。</div>'
    + '<div class="note">💡 植物は「卵細胞・精細胞」、動物は「卵・精子」と呼び方がちがう。</div>'

    + '<div class="rule-card-title" style="margin-top:16px">➗ 減数分裂＝生殖細胞をつくる特別な分裂</div>'
    + '<div style="' + box + 'text-align:center">'
    + '親の体細胞 <b style="color:var(--gold)">46本</b>（ヒトの場合）<br>↓ 減数分裂（半分に）<br>卵 <b style="color:#ff5ca8">23本</b> ＋ 精子 <b style="color:#4aa8ff">23本</b><br>↓ 受精（合わせる）<br>受精卵 <b style="color:var(--gold)">46本</b>（もとの数にもどる）'
    + '</div>'
    + '<div class="note">📐 ルール：生殖細胞の染色体は体細胞の<b>半分</b>。受精で<b>もとの数</b>にもどる。だから何代たっても染色体の数は変わらない。<br>📐 有性生殖の子は、両親から遺伝子を<b>半分ずつ</b>受けつぐ → 親と<b>ちがう形質</b>が現れることがある。</div>'
    + '</div>';
  return lifeQs(html, 2, [
    { jp:'受精によらず、親のからだの一部から新しい個体ができるふえ方を何というか。', answer:'無性生殖', choices:['無性生殖','有性生殖','減数分裂','発生'],
      exp:evoExp('受精しない＝無性生殖。', 'ゾウリムシの分裂・ジャガイモのいも', '受精する＝有性生殖', '「無」性＝オス・メスが関係ない') },
    { jp:'ゾウリムシやミカヅキモのふえ方はどれか。', answer:'分裂', choices:['分裂','出芽','栄養生殖','受精'],
      exp:evoExp('からだが2つに分かれてふえる＝分裂（無性生殖）。', 'ゾウリムシ・アメーバ', '出芽は酵母・ヒドラ', '単細胞生物は「分裂」') },
    { jp:'ジャガイモのいもや、さし木のように、植物のからだの一部から新しい個体ができるふえ方を何というか。', answer:'栄養生殖', choices:['栄養生殖','出芽','分裂','受粉'],
      exp:evoExp('植物の根・茎・葉など（栄養器官）からふえる＝栄養生殖。', 'ジャガイモ・サツマイモ・さし木・オランダイチゴ', '受粉は有性生殖の一部', '「栄養」をたくわえた部分からふえる') },
    { jp:'無性生殖でできた子の形質について正しいものはどれか。', answer:'親とまったく同じ形質になる', choices:['親とまったく同じ形質になる','親と必ずちがう形質になる','両親の形質が半分ずつ現れる','形質は親と関係なく決まる'],
      exp:evoExp('無性生殖の子は親と同じ遺伝子をもつので、形質も同じ。', '親と同じ（コピー）', '両親の遺伝子を半分ずつ＝有性生殖', 'コピー機は同じものしか出さない') },
    { jp:'農家がイチゴやジャガイモを無性生殖でふやすことが多い理由として適切なものはどれか。', answer:'親と同じよい形質をもつ個体をふやせるから', choices:['親と同じよい形質をもつ個体をふやせるから','いろいろな形質の個体ができるから','受精させる必要があるから','染色体の数を半分にできるから'],
      exp:evoExp('おいしい・よく育つなど、親のよい形質をそのまま受けつげる。', '同じ形質でそろう', 'いろいろな形質ができるのは有性生殖', '品質をそろえたいときは無性生殖') },
    { jp:'動物で、卵と精子が受精してできる細胞を何というか。', answer:'受精卵', choices:['受精卵','胚','卵細胞','精細胞'],
      exp:evoExp('卵と精子の核が合体＝受精 → 受精卵。', '受精卵', '胚は受精卵が分裂を始めてからのもの', '受精「した」「卵」') },
    { jp:'受精卵が細胞分裂を始めてから、自分で食物をとり始めるまでの間の子を何というか。', answer:'胚', choices:['胚','受精卵','成体','生殖細胞'],
      exp:evoExp('分裂を始めた受精卵〜自分で食物をとる前＝胚（動物）。', '胚', '受精卵は分裂前', '植物では、種子の中の赤ちゃん部分も胚') },
    { jp:'受精卵から、親と同じ形のからだができあがっていく過程を何というか。', answer:'発生', choices:['発生','成長','進化','遺伝'],
      exp:evoExp('受精卵 → 胚 → 親と同じ形、の過程＝発生。', 'カエルの受精卵 → オタマジャクシ → カエル', '進化は何世代もかけた変化', '発生は1個体の中の変化') },
    { jp:'被子植物で、花粉が柱頭についたあと、胚珠に向かってのびる管を何というか。', answer:'花粉管', choices:['花粉管','道管','師管','気孔'],
      exp:evoExp('花粉から胚珠へのびる管＝花粉管。中を精細胞が運ばれる。', '花粉管', '道管・師管は水や養分の通り道', '精細胞の「専用通路」') },
    { jp:'被子植物で受精が起こったあと、胚珠は何になるか。', answer:'種子', choices:['種子','果実','花粉','葉'],
      exp:evoExp('胚珠 → 種子、子房 → 果実、受精卵 → 胚。', '胚珠 → 種子', '子房 → 果実と混同しない', '「しゅ」珠 → 「しゅ」子') },
    { jp:'被子植物の受精で、花粉管の中を運ばれて卵細胞と受精するものはどれか。', answer:'精細胞', choices:['精細胞','精子','花粉','胚珠'],
      exp:evoExp('植物は「精細胞」と「卵細胞」。動物は「精子」と「卵」。', '植物＝精細胞', '精子は動物の呼び方', '植物は「細胞」がつく') },
    { jp:'卵や精子などの生殖細胞がつくられるときに行われる、染色体の数が半分になる細胞分裂を何というか。', answer:'減数分裂', choices:['減数分裂','体細胞分裂','出芽','栄養生殖'],
      exp:evoExp('生殖細胞をつくるとき＝減数分裂。染色体が半分になる。', '減数分裂', '体細胞分裂は数が変わらない', '「減」数＝数が減る') },
    { jp:'ヒトの体細胞の染色体は46本である。卵の染色体は何本か。', answer:'23本', choices:['23本','46本','92本','12本'],
      exp:evoExp('生殖細胞（卵・精子）は、減数分裂で体細胞の半分になる。', '46 ÷ 2 ＝ 23本', '46本のままだと、受精卵が92本になってしまう', '生殖細胞は半分') },
    { jp:'ヒトの受精卵の染色体は何本か。', answer:'46本', choices:['46本','23本','92本','69本'],
      exp:evoExp('卵23本＋精子23本＝46本。もとの数にもどる。', '46本', '92本にはならない（生殖細胞が半分だから）', '半分 ＋ 半分 ＝ もとどおり') },
    { jp:'有性生殖でできた子に、親と異なる形質が現れることがある理由として正しいものはどれか。', answer:'両親から遺伝子を半分ずつ受けつぐから', choices:['両親から遺伝子を半分ずつ受けつぐから','片方の親の遺伝子だけを受けつぐから','遺伝子を受けつがないから','体細胞分裂でふえるから'],
      exp:evoExp('有性生殖では、両親の遺伝子が半分ずつ組み合わさる。', 'ミックスジュース', '片方だけ、は誤り', 'この「組み合わせの変化」が進化にもつながる') }
  ]);
}

function renderSection3() {
  var html = evoChat([
    ['kyon', '顕性とか潜性とか、漢字がもう強そう…'],
    ['nishi', '顕性は「顕（あらわ）れる」、潜性は「潜（ひそ）む」。子に<b>現れる方</b>が顕性、<b>かくれる方</b>が潜性だ。遺伝子を<b>A</b>と<b>a</b>の記号で考えると、計算問題もパターンで解ける'],
    ['shun', 'きょんさん、Aは声の大きい先輩、aは静かな後輩です。2人が同じ部屋にいたら、聞こえるのは先輩の声だけ。後輩の声が聞こえるのは、後輩2人きり（aa）のときだけです']
  ]);
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🧬 言葉の整理</div>'
    + '<div class="ex"><b>形質</b>＝形や性質などの特徴／<b>遺伝</b>＝親の形質が子に伝わること</div>'
    + '<div class="ex"><b>遺伝子</b>＝形質を決めるもの。細胞の核の中の<b>染色体</b>にある。遺伝子の本体は<b>DNA（デオキシリボ核酸）</b>という物質</div>'
    + '<div class="ex"><b>純系</b>＝何代自家受粉しても同じ形質しか現れない系統／<b>対立形質</b>＝丸としわのように、どちらか一方しか現れない形質どうし</div>'
    + '<div class="ex"><b>顕性形質</b>＝純系どうしをかけ合わせたとき子に<b>現れる</b>形質（前の呼び方：優性）／<b>潜性形質</b>＝子に<b>現れない</b>形質（前の呼び方：劣性）</div>'
    + '<div class="ex"><b>分離の法則</b>＝減数分裂のとき、対になっている遺伝子が<b>別々の生殖細胞</b>に入ること（メンデルがエンドウで発見）</div>'

    + '<div class="rule-card-title" style="margin-top:16px">📐 かけ合わせの表（エンドウの種子の形：丸A＝顕性、しわa＝潜性）</div>'
    + '<div class="ex"><b>親</b>：丸の純系（AA）× しわの純系（aa）→ 生殖細胞はAとa → <b>子はすべてAa＝丸</b></div>'
    + punnett(['A','A'], ['a','a'], [['Aa','Aa'],['Aa','Aa']], '親')
    + '<div class="ex"><b>子どうし</b>：Aa × Aa → <b>孫は AA：Aa：aa ＝ 1：2：1</b> → <b>丸：しわ ＝ 3：1</b></div>'
    + punnett(['A','a'], ['A','a'], [['AA','Aa'],['Aa','aa']], '子')
    + '<div class="note">📐 ルール：Aが1つでもあれば顕性（丸）。aaのときだけ潜性（しわ）。<br>💡 計算のコツ：孫が全部で□個 → しわは□の4分の1、丸は4分の3。<br>💡 発展：Aa × aa（しわ）→ 丸：しわ＝1：1。丸がAAかAaかは、しわ（aa）とかけ合わせてしわが出るかで見分けられる。</div>'
    + '</div>';
  return lifeQs(html, 3, [
    { jp:'形や性質などの特徴を何というか。', answer:'形質', choices:['形質','遺伝子','染色体','純系'],
      exp:evoExp('形・色・性質などの特徴＝形質。', '種子の丸・しわ、子葉の黄・緑', '遺伝子は形質を「決めるもの」', '形質＝見た目や性質そのもの') },
    { jp:'形質を決めるもとになるものは何か。また、それは細胞の何の中にあるか。', answer:'遺伝子・染色体', choices:['遺伝子・染色体','染色体・遺伝子','DNA・細胞膜','形質・細胞壁'],
      exp:evoExp('遺伝子は、核の中の染色体にある。', '遺伝子は染色体の中', '逆（染色体が遺伝子の中）ではない', '染色体＝本棚、遺伝子＝本') },
    { jp:'遺伝子の本体である物質を何というか。', answer:'DNA（デオキシリボ核酸）', choices:['DNA（デオキシリボ核酸）','デンプン','タンパク質','ブドウ糖'],
      exp:evoExp('遺伝子の本体はDNA（デオキシリボ核酸）。', 'DNA', 'タンパク質やデンプンではない', '本の「文字」にあたるのがDNA') },
    { jp:'エンドウを使って遺伝の規則性を発見した人物はだれか。', answer:'メンデル', choices:['メンデル','ダーウィン','ニュートン','フック'],
      exp:evoExp('メンデルはエンドウのかけ合わせで遺伝の規則性（分離の法則など）を見つけた。', 'メンデル', 'フックは細胞を名づけた人', 'エンドウ＝メンデル') },
    { jp:'何代自家受粉をくり返しても、親と同じ形質しか現れない系統を何というか。', answer:'純系', choices:['純系','雑種','顕性','対立形質'],
      exp:evoExp('ずっと同じ形質＝純系（遺伝子の組み合わせがAAやaa）。', 'AAの丸、aaのしわ', 'Aaは純系ではない', '「純」粋に同じ') },
    { jp:'丸い種子（純系）としわのある種子（純系）をかけ合わせたところ、子はすべて丸い種子になった。「丸」のような形質を何というか。', answer:'顕性形質', choices:['顕性形質','潜性形質','対立形質','純系'],
      exp:evoExp('純系どうしのかけ合わせで子に現れる形質＝顕性形質（前の呼び方は優性）。', '丸は顕性', '「すぐれている」という意味ではない', '顕＝あらわれる') },
    { jp:'減数分裂のとき、対になっている遺伝子が別々の生殖細胞に入ることを何というか。', answer:'分離の法則', choices:['分離の法則','顕性の法則','体細胞分裂','受精'],
      exp:evoExp('Aaの親 → 生殖細胞はAかaのどちらか1つ＝分離の法則。', 'Aa → A と a', '体細胞分裂では遺伝子は分かれない', 'ペアが「分離」して別々の細胞へ') },
    { jp:'丸の純系（AA）としわの純系（aa）をかけ合わせた。子の遺伝子の組み合わせはどれか。', answer:'Aa', choices:['Aa','AA','aa','AAとaaが半分ずつ'],
      exp:evoExp('親の生殖細胞はAとaだけ → 子はすべてAa。', 'Aa（形質は丸）', 'AAやaaはできない', '表を書けば必ずわかる') },
    { jp:'遺伝子の組み合わせがAaの種子どうしをかけ合わせた。できる種子の遺伝子の組み合わせの比 AA：Aa：aa はどれか。', answer:'1：2：1', choices:['1：2：1','1：1：1','3：0：1','2：1：1'],
      exp:evoExp('表を書くと AA 1マス、Aa 2マス、aa 1マス。', '1：2：1', 'Aaは表に2マスあるので2', 'かけ算の表を書く') },
    { jp:'前の問題で、丸い種子としわのある種子の数の比はどれか。', answer:'3：1', choices:['3：1','1：1','1：3','2：1'],
      exp:evoExp('AAとAaは丸（1＋2＝3）、aaだけしわ（1）。', '丸：しわ＝3：1', '1：2：1を形質の比と混同しない', 'Aが1つでもあれば丸') },
    { jp:'Aa どうしのかけ合わせで種子が8000個できた。しわのある種子はおよそ何個か。', answer:'およそ2000個', choices:['およそ2000個','およそ6000個','およそ4000個','およそ8000個'],
      exp:evoExp('しわは全体の4分の1。8000 × 1/4 ＝ 2000。', '2000個', '6000個は丸の数', '3：1 → 全体を4つに分ける') },
    { jp:'【難】Aa どうしのかけ合わせでできた丸い種子のうち、遺伝子の組み合わせがAaのものの割合はどれか。', answer:'3分の2', choices:['3分の2','2分の1','4分の1','3分の1'],
      exp:evoExp('丸はAA（1）とAa（2）の合計3。そのうちAaは2 → 2/3。', '3分の2', '全体の中のAa（2/4＝1/2）と混同しない', '「丸いものの中で」に注意') },
    { jp:'【難】遺伝子の組み合わせがAaの丸い種子と、しわのある種子（aa）をかけ合わせた。丸：しわの比はどれか。', answer:'1：1', choices:['1：1','3：1','1：0','1：3'],
      exp:evoExp('Aa × aa → Aa：aa ＝ 2：2 ＝ 1：1。', '丸：しわ＝1：1', '3：1はAa×Aaのとき', '表を書くとAaが2マス、aaが2マス') },
    { jp:'【難】丸い種子がAAかAaかを調べたい。どの種子とかけ合わせて調べるとよいか。', answer:'しわのある種子（aa）', choices:['しわのある種子（aa）','丸い種子（AA）','丸い種子（Aa）','どれとかけ合わせても同じ'],
      exp:evoExp('aaとかけ合わせると、AAなら子はすべて丸、Aaなら丸：しわ＝1：1でしわが出る。', 'しわとかけ合わせる', 'AAとかけ合わせると、どちらでも全部丸になって区別できない', 'しわが「出るか出ないか」で判定') }
  ]);
}

function renderSection4() {
  var html = '<div class="rule-card">'
    + '<div class="rule-card-title">📘 確認テスト（成長・生殖・遺伝）</div>'
    + '<div class="ex">入試と同じように、手順の理由・順番・数・比を問う問題です。迷ったら、前のセクションの図と表を思い出そう。</div>'
    + '</div>';
  return lifeQs(html, 4, [
    { jp:'タマネギの根の観察の手順と理由の組み合わせとして正しいものはどれか。', answer:'うすい塩酸 → 細胞どうしを離れやすくする', choices:['うすい塩酸 → 細胞どうしを離れやすくする','うすい塩酸 → 核を染める','染色液 → 細胞の重なりを少なくする','押しつぶす → 細胞分裂を進める'],
      exp:evoExp('塩酸＝ほぐす、染色液＝染める、押しつぶす＝重なりを減らす。', '塩酸 → 離れやすく', '染めるのは染色液', '3点セットで覚える') },
    { jp:'体細胞分裂と減数分裂のちがいとして正しいものはどれか。', answer:'減数分裂では、できる細胞の染色体の数がもとの半分になる', choices:['減数分裂では、できる細胞の染色体の数がもとの半分になる','体細胞分裂では、染色体の数が半分になる','どちらも染色体の数は2倍になる','減数分裂は根の先端でだけ起こる'],
      exp:evoExp('体細胞分裂：数は同じ。減数分裂：数が半分（生殖細胞をつくるとき）。', '減数分裂＝半分', '体細胞分裂で半分になる、は誤り', '「減」数分裂') },
    { jp:'ある植物の体細胞の染色体は16本である。この植物の精細胞と、受精卵からできた胚の細胞の染色体はそれぞれ何本か。', answer:'精細胞8本、胚の細胞16本', choices:['精細胞8本、胚の細胞16本','精細胞16本、胚の細胞16本','精細胞8本、胚の細胞8本','精細胞16本、胚の細胞32本'],
      exp:evoExp('生殖細胞（精細胞）は半分の8本。受精卵は8＋8＝16本、胚の細胞は体細胞分裂でふえるので16本のまま。', '8本と16本', '胚の細胞を8本にしない', '生殖細胞だけが半分') },
    { jp:'次のうち、無性生殖だけを選んだ組み合わせはどれか。<br>ア ゾウリムシの分裂　イ カエルの受精　ウ ジャガイモのいもからの芽　エ アブラナの受粉', answer:'アとウ', choices:['アとウ','アとイ','イとエ','ウとエ'],
      exp:evoExp('受精・受粉が関係するものは有性生殖。', 'ア（分裂）とウ（栄養生殖）', 'イ・エは有性生殖', '「受」の字がついたら有性生殖') },
    { jp:'被子植物で受精したあと、子房と胚珠はそれぞれ何になるか。', answer:'子房 → 果実、胚珠 → 種子', choices:['子房 → 果実、胚珠 → 種子','子房 → 種子、胚珠 → 果実','子房 → 胚、胚珠 → 果実','子房 → 花粉、胚珠 → 種子'],
      exp:evoExp('子房 → 果実、胚珠 → 種子、受精卵 → 胚。', '子房が果実', '逆にしない', '子房（外側）が果実、胚珠（内側）が種子') },
    { jp:'カエルの発生の順番として正しいものはどれか。', answer:'受精卵 → 細胞分裂 → 胚 → オタマジャクシ → カエル', choices:['受精卵 → 細胞分裂 → 胚 → オタマジャクシ → カエル','胚 → 受精卵 → オタマジャクシ → カエル','オタマジャクシ → 受精卵 → 胚 → カエル','受精卵 → カエル → 胚 → オタマジャクシ'],
      exp:evoExp('受精卵が分裂をくり返して胚になり、やがて自分で食物をとる個体になる。', '受精卵 → 胚 → 個体', '胚が受精卵より先、はない', '発生は「受精卵」からスタート') },
    { jp:'有性生殖と無性生殖をくらべた説明として正しいものはどれか。', answer:'有性生殖では、親と異なる形質の子が生まれることがある', choices:['有性生殖では、親と異なる形質の子が生まれることがある','無性生殖では、両親の遺伝子を半分ずつ受けつぐ','有性生殖の子は、必ず親とまったく同じ形質になる','無性生殖では、減数分裂でできた生殖細胞が受精する'],
      exp:evoExp('有性生殖：両親の遺伝子を半分ずつ → 形質が変わることがある。無性生殖：親と同じ遺伝子。', '有性生殖は形質が変わりうる', '無性生殖に受精や減数分裂はない', 'コピー（無性）とミックス（有性）') },
    { jp:'純系の丸（AA）と純系のしわ（aa）をかけ合わせてできた子を、自家受粉させた。孫の丸としわの比はどれか。', answer:'3：1', choices:['3：1','1：1','1：2：1','すべて丸'],
      exp:evoExp('子はすべてAa → Aa × Aa → 丸：しわ＝3：1。', '3：1', '1：2：1は遺伝子の組み合わせの比', '「子」はすべて丸、「孫」で3：1') },
    { jp:'前の問題で、孫の種子が1200個できた。丸い種子はおよそ何個か。', answer:'およそ900個', choices:['およそ900個','およそ300個','およそ600個','およそ1200個'],
      exp:evoExp('丸は全体の4分の3。1200 × 3/4 ＝ 900。', '900個', '300個はしわの数', '4つに分けて3つ分') },
    { jp:'【難】前の問題の孫の丸い種子900個のうち、遺伝子の組み合わせがAAのものはおよそ何個か。', answer:'およそ300個', choices:['およそ300個','およそ600個','およそ450個','およそ900個'],
      exp:evoExp('丸の中は AA：Aa ＝ 1：2。900 × 1/3 ＝ 300。', 'AAは300個（Aaは600個）', '丸全体の半分（450）ではない', '1：2：1 の「1」と「2」をよく見る') },
    { jp:'遺伝子について正しいものはどれか。', answer:'遺伝子は染色体にあり、本体はDNAである', choices:['遺伝子は染色体にあり、本体はDNAである','遺伝子は細胞膜にあり、本体はタンパク質である','遺伝子は体細胞分裂のたびに半分に減る','遺伝子は親から子へ伝わることはない'],
      exp:evoExp('遺伝子＝核の中の染色体にある。本体はDNA。', '染色体・DNA', '体細胞分裂で遺伝子は減らない', '染色体＝本棚、遺伝子＝本、DNA＝文字') },
    { jp:'【難】ある遺伝子の組み合わせが不明な丸い種子を、しわのある種子（aa）とかけ合わせたところ、丸としわがほぼ同じ数できた。この丸い種子の遺伝子の組み合わせはどれか。', answer:'Aa', choices:['Aa','AA','aa','決められない'],
      exp:evoExp('AA × aa なら子はすべて丸。しわが出た（1：1）ので、もとの丸はAa。', 'Aa', 'AAならしわは出ない', 'しわが出た ＝ aをもっていた') }
  ]);
}

// ===== 生物の種類の多様性と進化（Section 5・6・7） =====
// 解説は CLAUDE.md の解説カード形式（📐ルール ✅正例 ❌誤例 💡覚え方）
function evoExp(rule, ok, ng, tip) {
  return '📐 ルール：' + rule
    + (ok ? '<br>✅ ' + ok : '')
    + (ng ? '<br>❌ ' + ng : '')
    + (tip ? '<br>💡 ' + tip : '');
}
function evoChat(lines) {
  var AV = {
    kyon:  ['av-kyon', '😄', 'きょん', ''],
    nishi: ['av-nishi', '慶', '西村', ''],
    shun:  ['', '🎭', 'なかむらしゅん', 'background:#b69cff;color:#111;']
  };
  var h = '<div class="chat-card">';
  lines.forEach(function(l) {
    var a = AV[l[0]];
    h += '<div class="chat-line"><div class="avatar ' + a[0] + '" style="' + a[3] + '">' + a[1] + '</div><div><div class="chat-name">' + a[2] + '</div><div class="chat-bubble">' + l[1] + '</div></div></div>';
  });
  return h + '</div>';
}
var EVO_BOX = 'padding:12px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);font-size:15px;line-height:2.0;';
var EVO_TD = 'border:1px solid var(--border);padding:8px;font-size:14px;line-height:1.8;vertical-align:top;';
function evoMark(t, c) { return '<b style="color:' + c + '">' + t + '</b>'; }
var EVO_BIRD = '#5cc8ff', EVO_REP = '#ff9f43';

// ---- Section 5：なかま分けと化石の順番 ----
function renderSection5() {
  var rows = [
    ['魚類',   '水中',                 '一生えら',                    'うろこ',         '水中に殻のない卵', '変温'],
    ['両生類', '子は水中・親は陸上と水辺', '子はえらと皮膚<br>親は肺と皮膚', 'しめった皮膚',   '水中に殻のない卵', '変温'],
    ['は虫類', '陸上',                 '肺',                          'かたいうろこ',   '陸上に殻のある卵', '変温'],
    ['鳥類',   '陸上（空）',           '肺',                          '羽毛',           '陸上に殻のある卵', '恒温'],
    ['哺乳類', '陸上',                 '肺',                          '毛',             '胎生（子を産む）',  '恒温']
  ];
  var html = evoChat([
    ['kyon', '始祖鳥ってやつが出てきたとたん、何の話かわからなくなった…'],
    ['nishi', '始祖鳥は、いきなり覚えるとわからなくなる。先に「5つのなかまの特徴」と「地球に現れた順番」をおさえると、始祖鳥がなぜ大事なのかが自然にわかるよ'],
    ['shun', 'きょんさん、今日は「水の中 → 水辺 → 陸 → 空」の引っ越し物語です。脊椎動物の一族が、何億年もかけてお引っ越しした記録を読んでいきましょう']
  ]);
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📋 脊椎動物（背骨がある動物）の5つのなかま</div>'
    + '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;margin-top:8px;min-width:560px">'
    + '<tr><th style="' + EVO_TD + '">なかま</th><th style="' + EVO_TD + '">生活場所</th><th style="' + EVO_TD + '">呼吸</th><th style="' + EVO_TD + '">体表</th><th style="' + EVO_TD + '">生まれ方</th><th style="' + EVO_TD + '">体温</th></tr>';
  rows.forEach(function(r) {
    html += '<tr><td style="' + EVO_TD + 'color:var(--gold);font-weight:bold">' + r[0] + '</td><td style="' + EVO_TD + '">' + r[1] + '</td><td style="' + EVO_TD + '">' + r[2] + '</td><td style="' + EVO_TD + '">' + r[3] + '</td><td style="' + EVO_TD + '">' + r[4] + '</td><td style="' + EVO_TD + '">' + r[5] + '</td></tr>';
  });
  html += '</table></div>'
    + '<div class="note">💡 表は横にスクロールできます。<b>変温</b>＝まわりの温度で体温が変わる／<b>恒温</b>＝体温がほぼ一定（鳥類と哺乳類だけ）。<b>卵生</b>＝卵を産む／<b>胎生</b>＝母親の体内で育ててから産む（哺乳類だけ）。</div>'

    + '<div class="rule-card-title" style="margin-top:18px">⏳ 化石が見つかる順番＝地球に現れた順番</div>'
    + '<div class="ex">古い地層（ふつうは下の地層）から見つかる化石ほど、昔からいた生物。見つかり始める時代をくらべると、現れた順番がわかる。</div>'
    + '<div style="margin-top:10px">';
  var bars = [['魚類', 100, '#29c5f6', 'およそ5億年前〜'], ['両生類', 80, '#3ddc84', 'およそ4億年前〜'], ['は虫類', 60, '#ff9f43', 'およそ3億年前〜'], ['哺乳類', 40, '#ff5ca8', 'およそ2億年前〜'], ['鳥類', 30, '#b69cff', 'およそ1.5億年前〜']];
  bars.forEach(function(b, i) {
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
      + '<div style="width:118px;flex-shrink:0;white-space:nowrap;line-height:1.5"><div style="font-weight:bold;font-size:15px;color:' + b[2] + '">' + (i + 1) + '. ' + b[0] + '</div><div style="font-size:12px;color:var(--text2)">' + b[3] + '</div></div>'
      + '<div style="flex:1;position:relative;height:26px;background:rgba(255,255,255,0.04);border-radius:6px">'
      + '<div style="position:absolute;right:0;top:0;bottom:0;width:' + b[1] + '%;background:' + b[2] + ';border-radius:6px"></div>'
      + '</div></div>';
  });
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-left:126px"><span>← 大昔</span><span>現在 →</span></div>'
    + '</div>'
    + '<div class="note">💡 年数は「およそ」でOK。テストで問われるのは<b>順番</b>：<b>魚類 → 両生類 → は虫類 → 哺乳類 → 鳥類</b>。<br>⚠️ いちばんのひっかけ：<b>鳥類は哺乳類よりあと</b>。</div>'

    + '<div class="rule-card-title" style="margin-top:18px">🌳 どこから分かれた？（系統のイメージ）</div>'
    + '<div style="' + EVO_BOX + 'text-align:center">'
    + '魚類 <span style="color:var(--gold)">→</span> 両生類 <span style="color:var(--gold)">→</span> <b style="color:' + EVO_REP + '">は虫類</b>'
    + '<div style="display:flex;justify-content:center;gap:24px;margin-top:6px"><div>↙<br><b style="color:#ff5ca8">哺乳類</b></div><div>↘<br><b style="color:' + EVO_BIRD + '">鳥類</b></div></div>'
    + '<div style="font-size:14px;color:var(--text2);margin-top:6px">哺乳類も鳥類も、どちらも<b>は虫類のなかまから</b>分かれたと考えられている<br>（鳥類は哺乳類から進化したのではない！）</div>'
    + '</div>'

    + '<div class="rule-card-title" style="margin-top:18px">📐 ルール：お引っ越しの理由を「水」で考える</div>'
    + '<div class="ex">① 魚類：水中だけ（えら・殻のない卵）</div>'
    + '<div class="ex">② 両生類：子は水中、親は陸にも上がれる（肺も使う）。でも<b>卵は水中</b>、皮膚は乾燥に弱い</div>'
    + '<div class="ex">③ は虫類：<b>殻のある卵を陸上に産める</b>・かたいうろこで乾燥に強い → 水辺をはなれて陸で一生くらせる</div>'
    + '<div class="ex">④ 哺乳類・鳥類：体温を一定に保てる（恒温）→ 寒い場所でも活動できる</div>'
    + '<div class="note">💡 「水中でしか生きられない → 陸でも生きられる」方向に、少しずつ特徴が変わっていった。これが<b>進化</b>の流れ。</div>'
    + '</div>';

  var qs = [
    { jp:'背骨をもつ動物をまとめて何というか。', answer:'脊椎動物', choices:['脊椎動物','無脊椎動物','節足動物','軟体動物'],
      exp:evoExp('背骨（脊椎）がある動物＝脊椎動物。魚類・両生類・は虫類・鳥類・哺乳類の5つ。', '魚もカエルもヒトも脊椎動物', '昆虫（節足動物）やイカ（軟体動物）は無脊椎動物', '「せきつい」＝背骨') },
    { jp:'一生を水中で過ごし、えらで呼吸し、体表がうろこでおおわれているなかまはどれか。', answer:'魚類', choices:['魚類','両生類','は虫類','哺乳類'],
      exp:evoExp('一生えら呼吸＋うろこ＋水中に殻のない卵＝魚類。', 'フナ・メダカ', 'クジラは水中にいるが肺で呼吸する哺乳類', '「一生えら」は魚類だけ') },
    { jp:'子は水中でえらと皮膚で呼吸し、親になると肺と皮膚で呼吸するなかまはどれか。', answer:'両生類', choices:['両生類','魚類','は虫類','鳥類'],
      exp:evoExp('子と親で呼吸のしかたが変わる＝両生類（カエル・イモリなど）。', 'オタマジャクシ（えら）→ カエル（肺と皮膚）', 'ヤモリは両生類ではなくは虫類', '「両」生類＝水と陸の両方') },
    { jp:'陸上に殻のある卵を産み、体表がかたいうろこでおおわれている変温動物はどれか。', answer:'は虫類', choices:['は虫類','鳥類','両生類','魚類'],
      exp:evoExp('殻のある卵＋かたいうろこ＋変温＝は虫類（トカゲ・ヘビ・カメなど）。', 'トカゲ・ワニ', '鳥類も殻のある卵を産むが、羽毛があり恒温', '殻のある卵は「鳥類とは虫類」の2つ') },
    { jp:'体表が羽毛でおおわれ、殻のある卵を産む恒温動物はどれか。', answer:'鳥類', choices:['鳥類','は虫類','哺乳類','両生類'],
      exp:evoExp('羽毛＝鳥類だけの特徴。', 'ハト・ペンギン（飛べなくても羽毛があれば鳥類）', 'コウモリは空を飛ぶが毛のある哺乳類', '羽毛を見たら鳥類') },
    { jp:'子が母親の体内である程度育ってから生まれる生まれ方を何というか。', answer:'胎生', choices:['胎生','卵生','分裂','出芽'],
      exp:evoExp('胎生＝母親の体内で育ってから生まれる（哺乳類）。卵生＝卵で生まれる。', 'ヒト・イヌ・クジラは胎生', '鳥類は卵生', '「胎」＝おなかの中') },
    { jp:'まわりの温度が変わっても、体温がほぼ一定に保たれる動物を何というか。', answer:'恒温動物', choices:['恒温動物','変温動物','草食動物','無脊椎動物'],
      exp:evoExp('恒温動物＝体温がほぼ一定。変温動物＝まわりの温度で体温が変わる。', '鳥類・哺乳類は恒温', 'は虫類（トカゲなど）は変温', '「恒」＝いつも同じ') },
    { jp:'恒温動物のなかまの組み合わせとして正しいものはどれか。', answer:'鳥類と哺乳類', choices:['鳥類と哺乳類','魚類と両生類','は虫類と鳥類','両生類と哺乳類'],
      exp:evoExp('恒温動物は、鳥類と哺乳類の2つだけ。', '鳥類・哺乳類', 'は虫類は鳥類に近いが変温', '5つのなかまのうち、あとから現れた2つが恒温') },
    { jp:'5つのなかまのうち、化石がいちばん古い地層から見つかるのはどれか。', answer:'魚類', choices:['魚類','両生類','は虫類','鳥類'],
      exp:evoExp('脊椎動物で最初に現れたのは魚類（およそ5億年前）。', '魚類 → 両生類 → は虫類 → 哺乳類 → 鳥類', '両生類がいちばん古い、は誤り', 'すべては水中から始まった') },
    { jp:'脊椎動物が地球上に現れた順番として正しいものはどれか。', answer:'魚類→両生類→は虫類→哺乳類→鳥類', choices:['魚類→両生類→は虫類→哺乳類→鳥類','魚類→両生類→は虫類→鳥類→哺乳類','両生類→魚類→は虫類→哺乳類→鳥類','魚類→は虫類→両生類→鳥類→哺乳類'],
      exp:evoExp('化石が見つかる順：魚類 → 両生類 → は虫類 → 哺乳類 → 鳥類。', '哺乳類（およそ2億年前）→ 鳥類（およそ1.5億年前）', '鳥類 → 哺乳類 の順、は誤り', '最後の2つは「ほ → ちょう」。ホッチョウ（哺・鳥）と唱える') },
    { jp:'哺乳類と鳥類では、どちらが先に地球上に現れたと考えられているか。', answer:'哺乳類', choices:['哺乳類','鳥類','同じころ'],
      exp:evoExp('化石は哺乳類の方が古い地層から見つかる。', '哺乳類が先、鳥類があと', '鳥類の方が先、は誤り（いちばん多いまちがい）', 'どちらもは虫類から分かれたが、分かれた時期は哺乳類が先') },
    { jp:'鳥類は、どのなかまから進化したと考えられているか。', answer:'は虫類', choices:['は虫類','哺乳類','両生類','魚類'],
      exp:evoExp('鳥類はは虫類のなかまから進化したと考えられている（証拠のひとつが始祖鳥）。', 'は虫類 → 鳥類', '哺乳類 → 鳥類、は誤り', '次のセクションの始祖鳥につながる！') },
    { jp:'両生類が「水中から陸上へ」の途中の特徴をもつといえるのはなぜか。', answer:'子は水中でえら呼吸、親は陸上でも肺で呼吸できるから', choices:['子は水中でえら呼吸、親は陸上でも肺で呼吸できるから','一生を水中で過ごすから','陸上に殻のある卵を産むから','体表が羽毛でおおわれているから'],
      exp:evoExp('両生類は、子（水中の生活）と親（陸上にも出られる）で、魚類とは虫類の間のような特徴をもつ。', 'オタマジャクシは水中、カエルは陸にも上がる', '殻のある卵を陸上に産むのはは虫類・鳥類', '「両方」の特徴＝両生類') },
    { jp:'は虫類が、両生類よりも陸上の生活に適しているといえる特徴はどれか。', answer:'殻のある卵を陸上に産み、体表がかたいうろこでおおわれている', choices:['殻のある卵を陸上に産み、体表がかたいうろこでおおわれている','水中に殻のない卵を産み、皮膚がしめっている','子はえらで呼吸する','体温がまわりの温度で変わる'],
      exp:evoExp('陸上の生活で困るのは「乾燥」。殻のある卵とかたいうろこは乾燥に強い。', 'は虫類は水辺をはなれても卵を産める', '「変温」は両生類もは虫類も同じなので理由にならない', '乾燥に強い＝陸上に強い') }
  ];
  qs.forEach(function(q, i) { html += makeChoices('sci_life_s5_q' + i, q.jp, q.answer, q.choices, q.exp); });
  html += '<button class="start-btn" data-go="6">🦅 次は始祖鳥へ →</button>';
  return html;
}

// ---- Section 6：始祖鳥と進化の証拠 ----
function evoArchaeopteryxSVG() {
  var teeth = '';
  for (var i = 0; i < 5; i++) teeth += '<polygon points="' + (262 + i * 7) + ',92 ' + (265 + i * 7) + ',99 ' + (268 + i * 7) + ',92" fill="#fff"/>';
  var tail = '';
  for (var j = 0; j < 9; j++) {
    var x = 118 - j * 11, y = 132 + j * 5;
    tail += '<line x1="' + x + '" y1="' + y + '" x2="' + (x - 6) + '" y2="' + (y - 14) + '" stroke="#5cc8ff" stroke-width="3"/>'
      + '<line x1="' + x + '" y1="' + y + '" x2="' + (x - 6) + '" y2="' + (y + 14) + '" stroke="#5cc8ff" stroke-width="3"/>'
      + '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="#ff9f43"/>';
  }
  return '<svg viewBox="0 0 380 230" style="width:100%;max-width:520px;display:block;margin:6px auto" role="img" aria-label="始祖鳥の特徴の図">'
    + tail
    + '<ellipse cx="170" cy="120" rx="55" ry="34" fill="#8b6b3d"/>'
    + '<polygon points="150,100 95,45 60,58 78,70 70,86 92,92 88,108 125,125" fill="#5cc8ff" opacity="0.85"/>'
    + '<path d="M95,45 q-6,-10 2,-14 M84,50 q-8,-8 -2,-14 M74,55 q-9,-6 -4,-13" stroke="#ff9f43" stroke-width="3" fill="none"/>'
    + '<circle cx="240" cy="82" r="22" fill="#8b6b3d"/>'
    + '<polygon points="256,76 300,86 256,93" fill="#c9a36a"/>' + teeth
    + '<circle cx="246" cy="76" r="4" fill="#fff"/><circle cx="247" cy="76" r="2" fill="#111"/>'
    + '<line x1="175" y1="152" x2="170" y2="190" stroke="#c9a36a" stroke-width="4"/><line x1="195" y1="150" x2="200" y2="190" stroke="#c9a36a" stroke-width="4"/>'
    + '<text x="252" y="120" fill="' + EVO_REP + '" font-size="13" font-weight="bold">↑口に歯（は虫類）</text>'
    + '<text x="6" y="18" fill="' + EVO_REP + '" font-size="14" font-weight="bold">つばさの先にツメ（は虫類）</text>'
    + '<text x="150" y="50" fill="' + EVO_BIRD + '" font-size="14" font-weight="bold">つばさ・羽毛（鳥類）</text>'
    + '<text x="6" y="222" fill="' + EVO_REP + '" font-size="14" font-weight="bold">長い尾に骨（は虫類）＋ 尾にも羽毛（鳥類）</text>'
    + '</svg>';
}
function evoForelimbSVG() {
  var R = '#ff5c5c', B = '#4aa8ff', Y = '#ffd84d';
  function bone(x1, y1, x2, y2, c, w) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }
  function limb(cx, up, fore, fingers, extra) {
    var s = extra || '';
    s += bone(cx, 20, cx, 20 + up, R, 9);
    s += bone(cx - 4, 24 + up, cx - 4, 20 + up + fore, B, 5) + bone(cx + 4, 24 + up, cx + 4, 20 + up + fore, B, 5);
    var y0 = 24 + up + fore;
    fingers.forEach(function(f) { s += bone(cx + f[0], y0, cx + f[1], y0 + f[2], Y, 3.5); });
    return s;
  }
  var human = limb(45, 55, 50, [[-6,-14,26],[-3,-6,32],[0,0,34],[3,6,32],[6,14,24]]);
  var whale = limb(140, 22, 22, [[-6,-16,70],[-2,-6,95],[2,4,95],[6,14,70]], '<ellipse cx="140" cy="120" rx="28" ry="80" fill="rgba(255,255,255,0.08)"/>');
  var bat = limb(235, 40, 58, [[-3,-42,85],[-1,-20,95],[1,6,95],[3,34,80]], '<polygon points="235,60 190,210 215,215 240,212 262,214 280,200" fill="rgba(255,255,255,0.08)"/>');
  var bird = limb(325, 45, 48, [[-2,-4,26],[2,6,20]], '<polygon points="325,20 300,200 350,200" fill="rgba(255,255,255,0.08)"/>');
  return '<svg viewBox="0 0 370 262" style="width:100%;max-width:560px;display:block;margin:6px auto" role="img" aria-label="前あしの骨のくらべ">'
    + human + whale + bat + bird
    + '<text x="45" y="236" text-anchor="middle" fill="#e6edf3" font-size="14" font-weight="bold">ヒト</text><text x="45" y="254" text-anchor="middle" fill="#9aa4b2" font-size="13">（うで）</text>'
    + '<text x="140" y="236" text-anchor="middle" fill="#e6edf3" font-size="14" font-weight="bold">クジラ</text><text x="140" y="254" text-anchor="middle" fill="#9aa4b2" font-size="13">（ひれ）</text>'
    + '<text x="235" y="236" text-anchor="middle" fill="#e6edf3" font-size="14" font-weight="bold">コウモリ</text><text x="235" y="254" text-anchor="middle" fill="#9aa4b2" font-size="13">（つばさ）</text>'
    + '<text x="325" y="236" text-anchor="middle" fill="#e6edf3" font-size="14" font-weight="bold">ハト</text><text x="325" y="254" text-anchor="middle" fill="#9aa4b2" font-size="13">（つばさ）</text>'
    + '</svg>'
    + '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;font-size:14px;font-weight:bold">'
    + '<span style="color:' + R + '">■ 上腕の骨（1本）</span><span style="color:' + B + '">■ 前腕の骨（2本）</span><span style="color:' + Y + '">■ 手の骨</span></div>';
}
function renderSection6() {
  var html = evoChat([
    ['kyon', 'で、始祖鳥って結局なに？鳥？トカゲ？'],
    ['nishi', '化石で見つかった生物で、<b>鳥類の特徴</b>と<b>は虫類の特徴</b>の両方をもっている。だから「鳥類はは虫類から進化した」と考える手がかりになるんだ'],
    ['shun', 'きょんさん、始祖鳥は「は虫類時代の制服を、まだ半分着たまま鳥デビューした新人」だと思ってください。制服（歯・ツメ・尾の骨）が残ってるから、どこの学校出身かバレちゃうんです']
  ]);
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🦅 始祖鳥（しそちょう）＝およそ1億5000万年前の地層から化石が見つかった</div>'
    + evoArchaeopteryxSVG()
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">'
    + '<div style="' + EVO_BOX + 'border-color:' + EVO_BIRD + '"><div style="font-weight:bold;color:' + EVO_BIRD + '">🕊️ 鳥類の特徴</div>・体が<b>羽毛</b>でおおわれている<br>・前あしが<b>つばさ</b>になっている</div>'
    + '<div style="' + EVO_BOX + 'border-color:' + EVO_REP + '"><div style="font-weight:bold;color:' + EVO_REP + '">🦎 は虫類の特徴</div>・<b>口に歯</b>がある<br>・<b>つばさの先にツメ</b>がある<br>・<b>長い尾に骨</b>がある</div>'
    + '</div>'
    + '<div class="note">📐 ルール：始祖鳥は<b>は虫類と鳥類の両方の特徴</b>をもつ → <b>鳥類はは虫類から進化した</b>と考えられる証拠。<br>⚠️ 始祖鳥は「は虫類と鳥類の間に生まれた子ども（雑種）」ではない。両方の特徴をあわせもった、1つの生物。</div>'
    + '<div class="note">💡 覚え方：は虫類の特徴は「<b>歯・ツメ・尾</b>」の3つ →「<b>ハ・ツ・オ</b>（初お目見え）」。鳥デビューの初お目見えなのに、は虫類の名残がある。</div>'

    + '<div class="rule-card-title" style="margin-top:18px">🧬 進化とは</div>'
    + '<div class="ex">生物が、<b>長い年月をかけて代を重ねるうちに</b>、形質（特徴）が変化すること。</div>'
    + '<div class="ex">親から子へ遺伝子が受けつがれるとき、遺伝子が変化することがある。その変化が子孫に受けつがれ、長い時間をかけて積み重なっていく。</div>'
    + '<div class="note">❌ 1ぴきの生物が、一生のうちに別の生物に変わる → これは進化ではない。<br>❌ 「飛びたい！」と思ってがんばったら、子どもにつばさが生える → これもちがう。</div>'

    + '<div class="rule-card-title" style="margin-top:18px">🦴 相同器官（そうどうきかん）＝もとは同じ器官</div>'
    + '<div class="ex">形やはたらきはちがうのに、<b>骨の基本的なつくり（並び方）が似ている</b>器官。</div>'
    + evoForelimbSVG()
    + '<div class="note">📐 ルール：どれも「上腕の骨1本 → 前腕の骨2本 → 手の骨」という同じ並び。<br>→ もとは同じ前あしから、生活に合わせて形が変わった＝<b>共通の祖先から進化した</b>証拠。<br>⚠️ チョウのはねとハトのつばさは、どちらも飛ぶためのものだが、もとの器官（体のつくり）がまったくちがうので相同器官ではない。</div>'

    + '<div class="rule-card-title" style="margin-top:18px">🧩 ほかにも「両方の特徴」をもつ生物</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    + '<div style="' + EVO_BOX + '"><b>カモノハシ</b><br>哺乳類なのに<b>卵を産む</b>（は虫類のような特徴）</div>'
    + '<div style="' + EVO_BOX + '"><b>ハイギョ</b><br>魚類なのに<b>肺でも呼吸</b>できる（両生類のような特徴）</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { jp:'始祖鳥の特徴のうち、<b>は虫類</b>の特徴はどれか。', answer:'口に歯がある', choices:['口に歯がある','羽毛がある','前あしがつばさになっている','くちばしだけで歯がない'],
      exp:evoExp('始祖鳥のは虫類の特徴＝口に歯・つばさの先にツメ・長い尾に骨。', '口に歯がある', '羽毛・つばさは鳥類の特徴', '「ハ・ツ・オ」＝歯・ツメ・尾') },
    { jp:'始祖鳥の特徴のうち、<b>鳥類</b>の特徴はどれか。', answer:'羽毛がある', choices:['羽毛がある','口に歯がある','つばさの先にツメがある','長い尾に骨がある'],
      exp:evoExp('始祖鳥の鳥類の特徴＝羽毛・つばさ。', '羽毛がある', '歯・ツメ・尾の骨はは虫類の特徴', '羽毛を見たら鳥類') },
    { jp:'始祖鳥のつばさの先にある、は虫類の特徴はどれか。', answer:'ツメ', choices:['ツメ','吸盤','ひれ','うろこだけ'],
      exp:evoExp('始祖鳥のつばさの先にはツメがある（は虫類の前あしの名残）。', 'つばさの先にツメ', 'つばさそのもの（羽毛）は鳥類の特徴', '「ハ・ツ・オ」のツ') },
    { jp:'始祖鳥の尾について正しいものはどれか。', answer:'長い尾に骨がある', choices:['長い尾に骨がある','尾がまったくない','尾はうろこだけでできている','尾がひれになっている'],
      exp:evoExp('始祖鳥の尾は長く、中に骨がつながっている（は虫類の特徴）。尾にも羽毛が生えている。', '長い尾に骨がある', '今の鳥の尾は短い骨＋羽根', '「ハ・ツ・オ」のオ') },
    { jp:'始祖鳥の化石が見つかった地層は、およそ何年前のものか。', answer:'およそ1億5000万年前', choices:['およそ1億5000万年前','およそ1万年前','およそ50億年前','およそ1000年前'],
      exp:evoExp('始祖鳥はおよそ1億5000万年前（恐竜がいた時代）の地層から見つかった。', '1億5000万年前', '50億年前は地球ができたころより前（地球はおよそ46億年前）', '鳥類が現れたころ＝およそ1.5億年前') },
    { jp:'始祖鳥の化石から考えられることとして、最も適切なものはどれか。', answer:'鳥類はは虫類から進化した', choices:['鳥類はは虫類から進化した','は虫類は鳥類から進化した','鳥類は哺乳類から進化した','鳥類とは虫類は関係がない'],
      exp:evoExp('は虫類と鳥類の両方の特徴をもつ始祖鳥は、鳥類がは虫類から進化した証拠と考えられる。', 'は虫類 → 鳥類', 'は虫類の方が先に現れているので、逆向きではない', '化石の順：は虫類が先、鳥類があと') },
    { jp:'始祖鳥について正しく説明しているものはどれか。', answer:'は虫類と鳥類の両方の特徴をもつ生物である', choices:['は虫類と鳥類の両方の特徴をもつ生物である','は虫類と鳥類の間に生まれた子どもである','哺乳類と鳥類の両方の特徴をもつ生物である','現在も生きている鳥である'],
      exp:evoExp('始祖鳥は、両方の特徴を「あわせもった」1つの生物。親がは虫類と鳥類なのではない。', '両方の特徴をもつ', '「間に生まれた子ども（雑種）」は誤り', '始祖鳥は化石で見つかった、今はいない生物') },
    { jp:'生物が長い年月をかけて代を重ねるうちに、形質が変化することを何というか。', answer:'進化', choices:['進化','発生','成長','遺伝'],
      exp:evoExp('進化＝長い年月・代を重ねる・形質が変化。', '魚類から両生類が現れた', '発生＝受精卵から体ができていくこと（別の言葉）', '「代を重ねる」がキーワード') },
    { jp:'進化について正しく説明しているものはどれか。', answer:'何代も世代を重ねるうちに、少しずつ形質が変化する', choices:['何代も世代を重ねるうちに、少しずつ形質が変化する','1ぴきの生物が一生のうちに別の生物に変わる','生物が変わりたいと強く思うと、その子どもが変わる','一度進化した生物は、それ以上変化しない'],
      exp:evoExp('進化は「1ぴき」ではなく「世代をこえて」起こる。', '何代もかけて少しずつ', '一生のうちに変わる（それは成長）', '進化＝バトンリレー。1人では走りきれない') },
    { jp:'ヒトのうで、クジラのひれ、コウモリのつばさのように、形やはたらきはちがうが、もとは同じ器官だったと考えられるものを何というか。', answer:'相同器官', choices:['相同器官','消化器官','感覚器官','生殖器官'],
      exp:evoExp('もとは同じ器官＝相同器官。骨の基本的なつくりが似ている。', 'ヒトのうでとクジラのひれ', '感覚器官＝目や耳など（別の言葉）', '相同＝「相（たがいに）同じ」') },
    { jp:'相同器官で、共通しているものはどれか。', answer:'骨の基本的なつくり（並び方）', choices:['骨の基本的なつくり（並び方）','はたらき','外から見た形','大きさ'],
      exp:evoExp('相同器官は、形やはたらきがちがっても「骨のつくり」が共通。', '上腕1本 → 前腕2本 → 手の骨', 'はたらきは、うで（つかむ）・ひれ（泳ぐ）・つばさ（飛ぶ）でバラバラ', '見た目じゃなく中身（骨）で判断') },
    { jp:'次のうち、相同器官の組み合わせはどれか。', answer:'ヒトのうでとクジラのひれ', choices:['ヒトのうでとクジラのひれ','チョウのはねとハトのつばさ','トンボのはねとコウモリのつばさ','ヒトの歯とハトのくちばし'],
      exp:evoExp('相同器官は、脊椎動物の前あしどうしなど「もとが同じ器官」。', 'ヒトのうで・クジラのひれ（どちらも前あし）', 'チョウ・トンボのはねは、脊椎動物の前あしとはもとがちがう', 'はたらきが同じでも、もとがちがえば相同器官ではない') },
    { jp:'相同器官があることから、どのようなことが考えられるか。', answer:'共通の祖先から進化した', choices:['共通の祖先から進化した','同じ場所に住んでいる','同じものを食べている','同じ時代に現れた'],
      exp:evoExp('骨のつくりが同じ＝もとは同じ前あしをもつ祖先がいた。', '共通の祖先から、生活に合わせて形が変わった', '住む場所や食べ物が同じという意味ではない（クジラは海、コウモリは空）', '相同器官は進化の証拠のひとつ') },
    { jp:'カモノハシは哺乳類だが、どのような点がめずらしいか。', answer:'卵を産む', choices:['卵を産む','肺で呼吸する','体が毛でおおわれている','子に乳をあたえる'],
      exp:evoExp('ふつう哺乳類は胎生だが、カモノハシは卵を産む。', '卵を産む哺乳類', '肺呼吸・毛・乳はふつうの哺乳類の特徴なのでめずらしくない', '哺乳類なのに、は虫類のような生まれ方') }
  ];
  qs.forEach(function(q, i) { html += makeChoices('sci_life_s6_q' + i, q.jp, q.answer, q.choices, q.exp); });
  html += '<button class="start-btn" data-go="7">🔥 入試チャレンジへ →</button>';
  return html;
}

// ---- Section 7：入試チャレンジ（難しめ） ----
function renderSection7() {
  var html = evoChat([
    ['nishi', 'ここからは入試レベル。1つの特徴だけでは決まらない問題、正しい文を選ぶ問題、ほかの単元とつながる問題が出る'],
    ['shun', 'きょんさん、ここは「ひっかけ見つけゲーム」です。選択肢の中に1か所だけウソがまぎれてます。探偵になったつもりでどうぞ。…僕、探偵の格好だけは得意なんです'],
    ['kyon', 'よし、全部見やぶってやる！']
  ]);
  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🎯 入試で差がつく3つのポイント</div>'
    + '<div class="ex">① <b>特徴1つだけで決めない</b>：「うろこ」は魚類にもは虫類にもある。「卵を産む」は4つのなかまにある。組み合わせで決める。</div>'
    + '<div class="ex">② <b>共通点の問題</b>：「AとBに共通する特徴」は表を横に見くらべる。</div>'
    + '<div class="ex">③ <b>文の1か所だけウソ</b>：「1ぴきが一生のうちに」「はたらきが同じだから相同器官」などのすりかえに注意。</div>'
    + '</div>';

  var qs = [
    { jp:'ある動物Xは「体表がうろこでおおわれ、卵を産む変温動物」である。Xがは虫類だと決めるために、あと1つ必要な特徴はどれか。', answer:'肺で呼吸する', choices:['肺で呼吸する','卵を産む','背骨がある','変温動物である'],
      exp:evoExp('うろこ・卵・変温は魚類にもあてはまる。魚類と区別するには「肺で呼吸」（または陸上に殻のある卵）。', '肺呼吸＋うろこ＋変温＝は虫類', '背骨・卵・変温は魚類も同じなので区別できない', '特徴1つでは決めない。ほかのなかまにないものを探す') },
    { jp:'魚類と両生類に共通する特徴はどれか。', answer:'水中に殻のない卵を産む', choices:['水中に殻のない卵を産む','一生えらで呼吸する','体表がうろこでおおわれている','恒温動物である'],
      exp:evoExp('魚類も両生類も、水中に殻のない卵を産む。', '卵の産み方が共通', '一生えら呼吸は魚類だけ、うろこは両生類にはない', '表を横に見くらべる') },
    { jp:'は虫類と鳥類に共通する特徴はどれか。', answer:'陸上に殻のある卵を産む', choices:['陸上に殻のある卵を産む','恒温動物である','体表が羽毛でおおわれている','体表がしめった皮膚である'],
      exp:evoExp('は虫類と鳥類は、どちらも陸上に殻のある卵を産む（鳥類がは虫類に近い理由のひとつ）。', '殻のある卵', '恒温は鳥類だけ（は虫類は変温）', '殻のある卵＝は虫類・鳥類') },
    { jp:'鳥類と哺乳類に共通する特徴はどれか。', answer:'恒温動物である', choices:['恒温動物である','胎生である','体表が羽毛でおおわれている','殻のある卵を産む'],
      exp:evoExp('鳥類と哺乳類は、どちらも恒温動物。', '恒温', '胎生は哺乳類だけ、羽毛・殻のある卵は鳥類だけ', '恒温＝あとから現れた2つ') },
    { jp:'始祖鳥の特徴として、次のア〜エのうちは虫類の特徴だけを選んだ組み合わせはどれか。<br>ア 羽毛がある　イ 口に歯がある　ウ 前あしがつばさになっている　エ つばさの先にツメがある', answer:'イとエ', choices:['イとエ','アとイ','アとウ','ウとエ'],
      exp:evoExp('は虫類の特徴＝口に歯（イ）・つばさの先にツメ（エ）・長い尾に骨。', 'イとエ', 'ア（羽毛）・ウ（つばさ）は鳥類の特徴', '「ハ・ツ・オ」に入っているものを選ぶ') },
    { jp:'「化石が古い地層から見つかるなかまほど、早く地球上に現れた」と考えるとき、前提にしている地層のきまりはどれか。', answer:'ふつう、下にある地層ほど古い', choices:['ふつう、下にある地層ほど古い','上にある地層ほど古い','厚い地層ほど古い','色がこい地層ほど古い'],
      exp:evoExp('地層は下から順に積み重なるので、ふつう下の地層ほど古い（中1の大地の単元）。', '下の地層ほど古い', '厚さや色で古さは決まらない', '地層の問題と進化の問題はつながっている') },
    { jp:'ヒトのうで・クジラのひれ・コウモリのつばさについて、正しい説明はどれか。', answer:'形やはたらきはちがうが、骨の基本的なつくりが似ている', choices:['形やはたらきはちがうが、骨の基本的なつくりが似ている','形もはたらきも同じである','骨の基本的なつくりがまったくちがう','同じ環境で生活しているので形が似ている'],
      exp:evoExp('相同器官＝形・はたらきはちがう＋骨のつくりが似ている。', 'うで（つかむ）・ひれ（泳ぐ）・つばさ（飛ぶ）', '「はたらきも同じ」は誤り', '違うのは外見と役目、同じなのは骨') },
    { jp:'チョウのはねとハトのつばさが相同器官といえない理由はどれか。', answer:'もとになった体のつくりがちがうから', choices:['もとになった体のつくりがちがうから','はたらきがちがうから','大きさがちがうから','色がちがうから'],
      exp:evoExp('相同器官かどうかは「もとが同じか」で決まる。チョウ（昆虫）のはねは、脊椎動物の前あしとはもとがちがう。', 'もとの体のつくりがちがう', '「はたらきがちがう」は誤り（どちらも飛ぶため＝はたらきは同じ）', 'はたらきが同じでも相同器官とはかぎらない') },
    { jp:'脊椎動物が水中から陸上へ生活場所を広げていく中で、陸上の生活に有利になった変化の組み合わせはどれか。', answer:'えら呼吸から肺呼吸へ・殻のない卵から殻のある卵へ', choices:['えら呼吸から肺呼吸へ・殻のない卵から殻のある卵へ','肺呼吸からえら呼吸へ・殻のある卵から殻のない卵へ','恒温から変温へ・胎生から卵生へ','羽毛からうろこへ・肺呼吸からえら呼吸へ'],
      exp:evoExp('陸上では空気から酸素をとる肺と、乾燥に強い殻のある卵が有利。', '魚類（えら・殻なし）→ は虫類（肺・殻あり）', '向きが逆の選択肢に注意', '変化は「水中向き → 陸上向き」') },
    { jp:'次の文の下線部のうち、誤っているものはどれか。<br>「進化とは、生物が ア<u>長い年月をかけて</u>、イ<u>1ぴきの体が一生のうちに</u>、ウ<u>形質が</u> エ<u>変化すること</u>である。」', answer:'イ', choices:['イ','ア','ウ','エ'],
      exp:evoExp('進化は「代を重ねるうちに」起こる。1ぴきの一生の変化ではない。', 'イを「代を重ねるうちに」に直す', 'ア・ウ・エは正しい', '1か所だけのすりかえを探す') },
    { jp:'進化が起こるもとになっていると考えられるものはどれか。', answer:'遺伝子の変化が子孫に受けつがれること', choices:['遺伝子の変化が子孫に受けつがれること','親が努力して身につけた力が子に伝わること','体細胞分裂で細胞の数が増えること','食べ物の量が増えること'],
      exp:evoExp('親から子へ遺伝子が受けつがれるときに遺伝子が変化することがあり、それが子孫に受けつがれて形質が変わっていく。', '遺伝子の変化が受けつがれる', '努力で身につけた力（筋肉など）は遺伝子に書きこまれないので子に伝わらない', '遺伝の単元とつながる') },
    { jp:'ハイギョは魚類だが肺でも呼吸できる。ハイギョはどのなかまとどのなかまの両方の特徴をもつといえるか。', answer:'魚類と両生類', choices:['魚類と両生類','魚類と鳥類','両生類と哺乳類','は虫類と鳥類'],
      exp:evoExp('えら（魚類）＋肺（両生類の親のような特徴）。', '魚類と両生類', 'は虫類と鳥類の両方の特徴をもつのは始祖鳥', '「両方の特徴」の生物は、となり合うなかまどうし') },
    { jp:'カモノハシは、どのなかまとどのなかまの両方の特徴をもつといえるか。', answer:'は虫類と哺乳類', choices:['は虫類と哺乳類','魚類と両生類','鳥類と両生類','魚類と哺乳類'],
      exp:evoExp('毛があり乳で子を育てる（哺乳類）＋卵を産む（は虫類のような特徴）。', 'は虫類と哺乳類', '魚類・両生類の特徴ではない', '哺乳類はは虫類から分かれた') },
    { jp:'コケ植物やシダ植物にくらべて、種子植物が乾燥した陸上に広く生活場所を広げられた理由として適切なものはどれか。', answer:'受精に水を必要とせず、乾燥にたえる種子でふえるから', choices:['受精に水を必要とせず、乾燥にたえる種子でふえるから','胞子でふえるから','根・茎・葉の区別がないから','水中でしか受精できないから'],
      exp:evoExp('コケ・シダは受精に水が必要で胞子でふえる。種子植物は花粉で受精でき、種子は乾燥にたえられる。', '種子植物は乾燥に強い', '胞子でふえるのはコケ植物・シダ植物', '植物も「水中 → 陸上」へ進化した') },
    { jp:'種子植物のうち、先に地球上に現れたと考えられているのはどちらか。', answer:'裸子植物', choices:['裸子植物','被子植物','同じころ'],
      exp:evoExp('種子植物では、裸子植物（マツ・イチョウなど）が先、被子植物があと。', '裸子植物 → 被子植物', '被子植物が先、は誤り', 'むき出しの胚珠（裸子）→ 子房で包まれた胚珠（被子）へ') },
    { jp:'5つのなかまを地球上に現れた順に並べたとき、3番目と5番目の組み合わせはどれか。', answer:'3番目：は虫類　5番目：鳥類', choices:['3番目：は虫類　5番目：鳥類','3番目：両生類　5番目：哺乳類','3番目：は虫類　5番目：哺乳類','3番目：哺乳類　5番目：鳥類'],
      exp:evoExp('魚類（1）→ 両生類（2）→ は虫類（3）→ 哺乳類（4）→ 鳥類（5）。', '3番目は虫類、5番目鳥類', '5番目を哺乳類にするのは、いちばん多いまちがい', '最後は「ホッチョウ（哺・鳥）」') }
  ];
  qs.forEach(function(q, i) { html += makeChoices('sci_life_s7_q' + i, q.jp, q.answer, q.choices, q.exp); });
  return html;
}

function showFinalResult() {
  var wqs = getWeakQuestions();
  var html = '<div class="result-card">'
    + '<div class="result-title">📊 まとめ</div>'
    + '<div class="result-message">生物の成長と生殖、遺伝の規則性を確認したね。弱点が残っていれば特訓で復習しよう。</div>'
    + '<button class="result-btn" id="retryBtn">🔄 最初からやり直す</button>'
    + '<button class="result-btn" id="weakBtn" style="background:var(--red);color:#fff">🔥 弱点を特訓する</button>'
    + '</div>';
  document.getElementById('mainContent').innerHTML = html;
  document.getElementById('retryBtn').addEventListener('click', function(){ goSection(0); });
  document.getElementById('weakBtn').addEventListener('click', function(){
    var w = getWeakQuestions();
    if (w.length === 0) showToast('弱点はありません！');
    else goSection(0);
  });
}
function init() {
  updateXP();
  renderTabs();
  goSection(0);
}
window.addEventListener('load', init);
