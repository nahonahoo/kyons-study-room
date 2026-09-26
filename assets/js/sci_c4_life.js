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
  { id:0, label:'⚗️ スタート', title:'生物の成長と生殖・遺伝', sub:'実験の流れ・観察・グラフ読み取りを意識して整理しよう！' },
  { id:1, label:'成長', title:'生物の成長と観察', sub:'細胞分裂・成長の様子・実験の手順を整理する' },
  { id:2, label:'生殖', title:'生殖のしくみと条件設定', sub:'受精・発生・観察結果の読み取り' },
  { id:3, label:'遺伝', title:'遺伝の規則性とグラフ読み取り', sub:'優性・劣性・遺伝子の関係を図で考える' },
  { id:4, label:'確認', title:'確認テスト', sub:'実験イメージ・条件比較・因果関係を問う' }
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
function renderSection(id) {
  var s = SECTIONS[id];
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
  html += '<div class="section-actions" style="margin-top:20px;display:flex;justify-content:center;">'
    + '<button class="next-section-btn" id="nextBtn">次へ進む →</button>'
    + '</div>';
  document.getElementById('mainContent').innerHTML = html;
  var nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.addEventListener('click', function() {
    if (id < 4) goSection(id + 1);
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
function renderSection0() {
  return '<div class="chat-card">'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">生物の成長と遺伝って、なんかめちゃくちゃ大事っぽい！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">この単元は「なぜ細胞が増えるのか」「どんな形で子どもに受け継がれるのか」を理解すると、テストが楽になる。実験では、条件を決めて、観察して、結果を表やグラフで読み取ることが大切だ。 </div></div></div>'
    + '</div>'
    + '<div class="rule-card">'
    + '<div class="rule-card-title">🧪 実験で大事な流れ</div>'
    + '<div class="ex">1. 条件を決める（例：水の量・温度・日光の有無）</div>'
    + '<div class="ex">2. 実験器具を用意して操作する（ビーカー・温度計・種子・ろ紙など）</div>'
    + '<div class="ex">3. 観察して記録する（発芽数・日数・高さ）</div>'
    + '<div class="ex">4. 表やグラフで比較する</div>'
    + '<div class="ex">5. 因果関係を説明する</div>'
    + '<div class="note">💡 実験問題では「何を変えたか」「何を見たか」「どうしてそうなったか」がセットで問われることが多い。</div>'
    + '<div class="rule-card-title" style="margin-top:14px;">🧭 視覚で見る実験イメージ</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;align-items:center;">'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);text-align:center;">条件設定<br><span style="font-size:11px;color:var(--text2);">水・温度・光</span></div>'
    + '<div style="text-align:center;color:var(--gold);font-size:18px;">→</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);text-align:center;">観察<br><span style="font-size:11px;color:var(--text2);">発芽数・高さ</span></div>'
    + '<div style="text-align:center;color:var(--gold);font-size:18px;">→</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);text-align:center;">表・グラフ<br><span style="font-size:11px;color:var(--text2);">比較・読み取り</span></div>'
    + '<div style="text-align:center;color:var(--gold);font-size:18px;">→</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);text-align:center;">因果関係<br><span style="font-size:11px;color:var(--text2);">なぜそうなったか</span></div>'
    + '</div>'
    + '</div>'
    + '<button class="start-btn" data-go="1">🧬 成長のしくみから始める →</button>';
}
function renderSection1() {
  var html = '<div class="rule-card">'
    + '<div class="rule-card-title">📐 生物の成長と観察の流れ</div>'
    + '<div class="rule-title">1. どの条件で調べるか</div>'
    + '<div class="ex">温度や水の量、日光の有無などを同じにするか変えるかを決める。</div>'
    + '<div class="rule-title">2. 何を観察するか</div>'
    + '<div class="ex">発芽数、発芽した日数、草の高さなどを記録する。</div>'
    + '<div class="rule-title">3. 結果を表やグラフに表す</div>'
    + '<div class="ex">表やグラフから、どの条件でよく育つかを読み取る。</div>'
    + '<div class="rule-title">4. なぜそうなったかを考える</div>'
    + '<div class="ex">水や温度が適していると、発芽や成長が進みやすい。</div>'
    + '<div class="note">💡 実験では「条件をそろえる」「結果を比較する」「因果関係を説明する」が重要です。重要語句は漢字で正しく書けるようにしましょう。</div>'
    + '<div class="rule-card-title" style="margin-top:14px;">🧪 実験器具の例</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">'
    + '<div style="font-weight:bold;color:var(--gold);">器具</div>'
    + '<div>ビーカー、ろ紙、種子、温度計、日光の有無をそろえるケース</div>'
    + '</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">'
    + '<div style="font-weight:bold;color:var(--gold);">観察項目</div>'
    + '<div>発芽数、発芽した日数、草の高さ</div>'
    + '</div>'
    + '</div>'
    + '<div class="rule-card-title" style="margin-top:14px;">📊 例：発芽数の比較</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">'
    + '<div style="font-weight:bold;color:var(--gold);">条件A</div>'
    + '<div>水あり・20℃ → 8個発芽</div>'
    + '</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">'
    + '<div style="font-weight:bold;color:var(--gold);">条件B</div>'
    + '<div>水なし・20℃ → 1個発芽</div>'
    + '</div>'
    + '</div>'
    + '<div style="margin-top:10px;font-size:13px;color:var(--text2);">→ 水があるほうが発芽しやすいと考えられる。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">📈 グラフで見ると</div>'
    + '<div style="display:flex;align-items:flex-end;gap:10px;min-height:120px;margin-top:6px;">'
    + '<div style="flex:1;text-align:center;">'
    + '<div style="height:70px;background:linear-gradient(180deg,#34d399,#0f766e);border-radius:8px 8px 0 0;display:flex;align-items:flex-end;justify-content:center;color:#fff;font-weight:bold;">8</div>'
    + '<div style="margin-top:4px;font-size:12px;">条件A</div>'
    + '</div>'
    + '<div style="flex:1;text-align:center;">'
    + '<div style="height:18px;background:linear-gradient(180deg,#fca5a5,#b91c1c);border-radius:8px 8px 0 0;display:flex;align-items:flex-end;justify-content:center;color:#fff;font-weight:bold;">1</div>'
    + '<div style="margin-top:4px;font-size:12px;">条件B</div>'
    + '</div>'
    + '</div>'
    + '<div class="note" style="margin-top:10px;">💡 グラフの高さの違いから、どの条件が効果的かを読み取る練習をする。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">🔗 1年・2年のつながる復習</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">🔹 1年：物質の状態変化 → 水が液体→気体になるとき、粒の動きが変わる。</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">🔹 1年：光と音・力 → 実験条件の違いが結果にどう影響するかを見る。</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">🔹 2年：化学変化と物質の質量 → 変わっても、何が残るかを見極める。</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">🔹 2年：生物をつくる細胞 → 細胞が増えることが成長のもとになる。</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">🔹 2年：消化と吸収・呼吸 → 生物がエネルギーを取り入れる流れを思い出す。</div>'
    + '<div class="mini-box" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(255,255,255,0.03);">🔹 2年：気象観測・天気の変化 → 水蒸気や気温の変化と生物の成長を関連づけて考える。</div>'
    + '</div>'
    + '</div>';
  var qs = [
    { jp:'生物が大きくなるのは、細胞がどうなるからか。', answer:'分裂して増える', choices:['分裂して増える','蒸発する','消える','固まる'], exp:'細胞分裂によって細胞数が増え、からだが成長する。実験では「何が増えたか」を数値で確認する。' },
    { jp:'実験で結果を比べるとき、変えるのはどこか。', answer:'条件', choices:['条件','結果だけ','名前','順番'], exp:'実験では条件をそろえたうえで、1つだけ変えて比較する。これで因果関係を見つけやすくなる。' },
    { jp:'水が少ない条件で発芽数が少なかったとき、考えられることはどれか。', answer:'水分が少ないため発芽しにくかった', choices:['水分が少ないため発芽しにくかった','水が多いと成長しない','温度が下がっても同じだ','実験は無意味だった'], exp:'水分は発芽に関係しているので、条件の違いが結果の違いにつながると考える。' }
  ];
  qs.forEach(function(q, i) { q._qid = 'sci_life_s1_q' + i; });
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}
function renderSection2() {
  var html = '<div class="rule-card">'
    + '<div class="rule-card-title">📐 生殖のしくみと実験の見方</div>'
    + '<div class="rule-title">受精の流れ</div>'
    + '<div class="ex">精細胞と卵細胞が合体 → 受精卵ができる → 細胞分裂を繰り返して発生する。</div>'
    + '<div class="rule-title">観察のポイント</div>'
    + '<div class="ex">生殖では、どの時期にどんな変化が起きるかを順番で整理する。</div>'
    + '<div class="ex">受精前の細胞と受精後の受精卵の違いを比較してイメージできるようにする。</div>'
    + '<div class="note">💡 実験の図や模式図では、順番を追って「どこからどこへ変化したか」を説明できることが大切です。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">🧫 観察表の読み取り例</div>'
    + '<table style="width:100%;border-collapse:collapse;margin-top:8px;">'
    + '<tr><th style="border:1px solid var(--border);padding:8px;">時期</th><th style="border:1px solid var(--border);padding:8px;">変化の内容</th></tr>'
    + '<tr><td style="border:1px solid var(--border);padding:8px;">受精前</td><td style="border:1px solid var(--border);padding:8px;">精細胞と卵細胞は別々にある</td></tr>'
    + '<tr><td style="border:1px solid var(--border);padding:8px;">受精後</td><td style="border:1px solid var(--border);padding:8px;">2つが合体し、受精卵になる</td></tr>'
    + '<tr><td style="border:1px solid var(--border);padding:8px;">発生</td><td style="border:1px solid var(--border);padding:8px;">受精卵が細胞分裂を繰り返して成長する</td></tr>'
    + '</table>'
    + '<div class="note" style="margin-top:10px;">→ 「受精前」「受精後」「発生」の順序を説明できると、図や表の読み取りが安定します。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">🔍 因果関係を言葉にするコツ</div>'
    + '<div class="ex">「受精が起きると、受精卵ができる」「受精卵が分裂すると成長する」のように、原因と結果をつなげて書く。</div>'
    + '</div>';
  var qs = [
    { jp:'卵細胞と精細胞が合体することを何というか。', answer:'受精', choices:['受精','発育','分裂','消化'], exp:'受精とは、卵細胞と精細胞が合体して新しい個体の始まりを作ること。' },
    { jp:'受精した後にできる細胞を何というか。', answer:'受精卵', choices:['受精卵','精子','排卵','子房'], exp:'受精卵は受精してできた細胞で、そこから分裂が始まる。' },
    { jp:'図や模式図で「受精→受精卵→分裂」と見たとき、何をつないで説明すべきか。', answer:'変化の順番', choices:['変化の順番','色だけ','名前の大きさ','数字の並び'], exp:'実験や図の読み取りでは、どの順番で何が起きたかを整理できることが大切。' }
  ];
  qs.forEach(function(q, i) { q._qid = 'sci_life_s2_q' + i; });
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}
function renderSection3() {
  var html = '<div class="rule-card">'
    + '<div class="rule-card-title">📐 遺伝の規則性とグラフ読み取り</div>'
    + '<div class="rule-title">遺伝子とは</div>'
    + '<div class="ex">遺伝子は、形や性質を決める情報である。</div>'
    + '<div class="ex">親から子に受け継がれ、特徴の現れ方に関係する。</div>'
    + '<div class="rule-title">優性と劣性</div>'
    + '<div class="ex">形質が現れやすいものを優性、現れにくいものを劣性という。</div>'
    + '<div class="ex">丸い種子（優性）× しわのある種子（劣性）は、子の形は丸い種子が出やすい。</div>'
    + '<div class="note">💡 形質の見え方は、優性遺伝子があるかないかで変わる。表や図で「どちらが現れやすいか」を読み取ろう。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">📊 例：丸い種子としわのある種子</div>'
    + '<table style="width:100%;border-collapse:collapse;margin-top:8px;">'
    + '<tr><th style="border:1px solid var(--border);padding:8px;">親</th><th style="border:1px solid var(--border);padding:8px;">子どもの形質</th></tr>'
    + '<tr><td style="border:1px solid var(--border);padding:8px;">丸い種子 × しわのある種子</td><td style="border:1px solid var(--border);padding:8px;">丸い種子が多い</td></tr>'
    + '<tr><td style="border:1px solid var(--border);padding:8px;">丸い種子 × 丸い種子</td><td style="border:1px solid var(--border);padding:8px;">丸い種子が多いが、しわの種子も出ることがある</td></tr>'
    + '</table>'
    + '<div class="note" style="margin-top:10px;">→ 表から、優性が現れやすいことを読み取れる。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">📈 観察結果の見方</div>'
    + '<div class="ex">表の結果から、「優性の形質が多かった」「劣性の形質は少なかった」というように、割合の違いを説明できることが大切。</div>'
    + '<div class="ex">グラフで「どの形質がどれだけ多いか」を見て、何が優性かを判断する。</div>'
    + '</div>';
  var qs = [
    { jp:'形質が現れやすい遺伝子を何というか。', answer:'優性', choices:['優性','劣性','中性','複合'], exp:'優性遺伝子は、他の遺伝子があっても形質として現れやすい。' },
    { jp:'形質が現れにくい遺伝子を何というか。', answer:'劣性', choices:['劣性','優性','増殖','変異'], exp:'劣性遺伝子は、優性遺伝子がある場合は表に出にくい。' },
    { jp:'親から子に受け継がれる情報を何というか。', answer:'遺伝子', choices:['遺伝子','細胞膜','核酸','酵素'], exp:'遺伝子は、形質を決める情報をもつ。' },
    { jp:'丸い種子を作る遺伝子がある場合、子の形を調べたときに最も起こりやすいのはどれか。', answer:'丸い種子が現れやすい', choices:['丸い種子が現れやすい','しわのある種子だけになる','どちらも現れない','形は決まらない'], exp:'優性遺伝子があると、形質は現れやすくなる。図や表から比較できるように整理しよう。' }
  ];
  qs.forEach(function(q, i) { q._qid = 'sci_life_s3_q' + i; });
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
}
function renderSection4() {
  var html = '<div class="rule-card">'
    + '<div class="rule-card-title">📘 確認テスト</div>'
    + '<div class="rule-title">実験イメージ・条件比較・因果関係でまとめる</div>'
    + '<div class="ex">実験で見るべきは「何を変えたか」「何を観察したか」「なぜそうなったか」。</div>'
    + '<div class="rule-title">考え方の整理</div>'
    + '<div class="ex">① 条件を決める　② 観察結果を表にする　③ グラフで比較する　④ 因果関係を説明する</div>'
    + '<div class="note">💡 近年の出題は、実験操作の流れをイメージできるか、表やグラフから原因と結果をつなげられるかが鍵です。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">📝 まとめの書き方</div>'
    + '<div class="ex">「条件Aでは発芽数が多かったため、水が必要だったと考えられる。」のように、結果と原因をつなぐ形で書く。</div>'
    + '</div>';
  var qs = [
    { jp:'同じ種子を使い、温度だけを変えて観察した。どの条件をそろえるのが大切か。', answer:'種子の種類', choices:['種子の種類','観察者の名前','時間の長さ','机の色'], exp:'比較実験では、結果に影響する要因をできるだけ同じにして、変える条件を1つにする。' },
    { jp:'発芽数が多かった実験結果から、最も言えることはどれか。', answer:'その条件のほうが発芽しやすかった', choices:['その条件のほうが発芽しやすかった','実験は失敗だった','水は関係ない','結果が読めない'], exp:'結果の違いは条件の違いに由来すると考え、因果関係を説明する。' },
    { jp:'受精卵が分裂を繰り返してできる状態を何というか。', answer:'発生', choices:['発生','凍結','変形','脱落'], exp:'受精後は細胞分裂を繰り返しながら発生していく。' },
    { jp:'卵細胞と精細胞が合体することを何というか。', answer:'受精', choices:['受精','消化','呼吸','分離'], exp:'受精は卵細胞と精細胞が合体すること。' },
    { jp:'親から子に受け継がれる情報のもとを何というか。', answer:'遺伝子', choices:['遺伝子','細胞膜','液胞','核'], exp:'遺伝子は形質を決める情報の単位。' },
    { jp:'形質が現れやすい遺伝子を何というか。', answer:'優性', choices:['優性','劣性','中性','同位'], exp:'優性は、現れやすい遺伝子。' },
    { jp:'形質を現しにくい遺伝子を何というか。', answer:'劣性', choices:['劣性','優性','増強','潜性'], exp:'劣性は、優性がないと現れにくい遺伝子。' },
    { jp:'同じ種子を使い、水の量だけを変えた実験で、発芽数が多かったのはどの条件か。', answer:'水の量が多い条件', choices:['水の量が多い条件','水の量が少ない条件','温度が高い条件','日光がない条件'], exp:'実験では、変えた条件と結果の関係を対応させて考える。' },
    { jp:'表で「条件Aでは8個、条件Bでは1個」だったとき、どの条件がよく発芽したといえるか。', answer:'条件A', choices:['条件A','条件B','どちらも同じ','わからない'], exp:'表の数の大きいほうが、よく発芽したと判断できる。' },
    { jp:'発芽した種子の高さを調べたとき、実験で必ず記録するものはどれか。', answer:'高さの数値', choices:['高さの数値','机の色','観察者の気分','教科書のページ数'], exp:'観察結果は数値や量で記録すると比較しやすい。' },
    { jp:'実験結果をグラフで見るとき、最初に確認するのはどれか。', answer:'どの高さが高いか', choices:['どの高さが高いか','色の濃さ','書いた人の名前','試験管の形'], exp:'グラフを見るときは、縦の高さや差を読み取ることが大切。' },
    { jp:'同じ条件で2回観察した結果が違ったとき、まず考えることはどれか。', answer:'観察ミスや条件のずれがないか', choices:['観察ミスや条件のずれがないか','結果は何でもよい','実験はやり直しだ','図を消す'], exp:'結果がばらつくときは、条件や観察の仕方を見直す必要がある。' },
    { jp:'受精後の受精卵がどのように成長していくか。', answer:'細胞分裂をくり返して成長する', choices:['細胞分裂をくり返して成長する','そのまま消える','形を変えない','卵細胞に戻る'], exp:'受精卵は細胞分裂を繰り返して、発生に向かう。' },
    { jp:'遺伝子を調べるとき、何を見て判断するのが大切か。', answer:'形質の現れ方', choices:['形質の現れ方','試験管の大きさ','部屋の明るさ','時計の針'], exp:'遺伝子は形質の現れ方からその性質を推測する。' },
    { jp:'親の形質と子の形質を比較するとき、どちらを見て理由を説明するか。', answer:'どの形質が多く現れたか', choices:['どの形質が多く現れたか','音の大きさ','書いた順番','紙の色'], exp:'優性と劣性を見分けるためには、現れた形質の割合に注目する。' },
    { jp:'「温度が高いほど発芽数が増えた」と言えるのは、どんなときか。', answer:'温度だけを変えて他は同じにしたとき', choices:['温度だけを変えて他は同じにしたとき','複数の条件を同時に変えたとき','結果を見ないとき','条件が書いていないとき'], exp:'条件を1つに絞って比較しないと、原因をはっきりさせにくい。' },
    { jp:'実験の考察で大切なのは、結果だけでなく何か。', answer:'その結果になった理由', choices:['その結果になった理由','見た人の数','机の高さ','言葉の長さ'], exp:'考察では、なぜその結果になったのかを原因とつなげて書く。' }
  ];
  qs.forEach(function(q, i) { q._qid = 'sci_life_s4_q' + i; });
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
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
