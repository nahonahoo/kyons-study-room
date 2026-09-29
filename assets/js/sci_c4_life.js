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
  { id:0, label:'⚗️ スタート', title:'生物の成長と生殖・遺伝', sub:'実験の流れ・観察・グラフ読み取りを意識して整理しよう！' },
  { id:1, label:'成長', title:'生物の成長と観察', sub:'細胞分裂・成長の様子・実験の手順を整理する' },
  { id:2, label:'生殖', title:'生殖のしくみと条件設定', sub:'受精・発生・観察結果の読み取り' },
  { id:3, label:'遺伝', title:'遺伝の規則性とグラフ読み取り', sub:'顕性・潜性・遺伝子の関係を図で考える' },
  { id:5, label:'進化①', title:'生物の種類の多様性と進化①', sub:'5つのなかまの特徴と、地球に現れた順番（化石の順）' },
  { id:6, label:'進化②始祖鳥', title:'生物の種類の多様性と進化②', sub:'始祖鳥・相同器官・進化とは何か' },
  { id:7, label:'進化③入試', title:'生物の種類の多様性と進化③ 入試チャレンジ', sub:'難しめ。特徴の組み合わせ・共通点・文の誤り探し' },
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
    + '<button class="start-btn" data-go="1">🧬 成長のしくみから始める →</button>'
    + '<button class="start-btn" data-go="5" style="margin-left:8px">🦅 始祖鳥・進化へジャンプ →</button>';
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
    + '<div class="rule-title">顕性と潜性（前の呼び方：優性・劣性）</div>'
    + '<div class="ex">対立する形質の純系どうしをかけ合わせたとき、子に現れる形質を<b>顕性形質</b>、子に現れない形質を<b>潜性形質</b>という。</div>'
    + '<div class="ex">丸い種子（純系）× しわのある種子（純系）→ 子はすべて丸い種子。丸が顕性、しわが潜性。</div>'
    + '<div class="note">💡 今の教科書は「顕性・潜性」。「優性・劣性」は前の言い方で、「すぐれている・おとっている」という意味ではない。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">📊 例：丸い種子としわのある種子</div>'
    + '<table style="width:100%;border-collapse:collapse;margin-top:8px;">'
    + '<tr><th style="border:1px solid var(--border);padding:8px;">親</th><th style="border:1px solid var(--border);padding:8px;">子どもの形質</th></tr>'
    + '<tr><td style="border:1px solid var(--border);padding:8px;">丸い種子（純系）× しわのある種子（純系）</td><td style="border:1px solid var(--border);padding:8px;">子はすべて丸い種子</td></tr>'
    + '<tr><td style="border:1px solid var(--border);padding:8px;">その子（丸い種子）どうし</td><td style="border:1px solid var(--border);padding:8px;">孫は 丸：しわ ＝ 3：1（しわがまた現れる）</td></tr>'
    + '</table>'
    + '<div class="note" style="margin-top:10px;">→ 子の代では顕性形質（丸）だけ、孫の代では潜性形質（しわ）も約4分の1現れる。</div>'
    + '<div class="rule-card-title" style="margin-top:16px;">📈 観察結果の見方</div>'
    + '<div class="ex">表の結果から、「顕性形質が多かった」「潜性形質は少なかった」というように、割合の違いを説明できることが大切。</div>'
    + '<div class="ex">グラフで「どの形質がどれだけ多いか」を見て、どちらが顕性形質かを判断する。</div>'
    + '</div>';
  var qs = [
    { jp:'丸い種子（純系）としわのある種子（純系）をかけ合わせると、子はすべて丸い種子になった。子に現れた「丸」のような形質を何というか。', answer:'顕性形質', choices:['顕性形質','潜性形質','中性形質','複合形質'], exp:'子に現れる形質＝顕性形質（前の呼び方は優性）。「すぐれている」という意味ではない。' },
    { jp:'同じかけ合わせで、子に現れなかった「しわ」のような形質を何というか。', answer:'潜性形質', choices:['潜性形質','顕性形質','中性形質','変異形質'], exp:'子に現れない形質＝潜性形質（前の呼び方は劣性）。孫の代で約4分の1現れる。' },
    { jp:'親から子に受け継がれる情報を何というか。', answer:'遺伝子', choices:['遺伝子','細胞膜','核酸','酵素'], exp:'遺伝子は、形質を決める情報をもつ。' },
    { jp:'丸い種子を作る遺伝子がある場合、子の形を調べたときに最も起こりやすいのはどれか。', answer:'丸い種子が現れやすい', choices:['丸い種子が現れやすい','しわのある種子だけになる','どちらも現れない','形は決まらない'], exp:'顕性の遺伝子（丸）を1つでももっていれば、丸い種子になる。図や表から比較できるように整理しよう。' }
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
    { jp:'対立形質の純系どうしをかけ合わせたとき、子に現れる方の形質を何というか。', answer:'顕性形質', choices:['顕性形質','潜性形質','中性形質','同位形質'], exp:'子に現れる形質＝顕性形質（前の呼び方は優性）。' },
    { jp:'対立形質の純系どうしをかけ合わせたとき、子に現れない方の形質を何というか。', answer:'潜性形質', choices:['潜性形質','顕性形質','増強形質','中性形質'], exp:'子に現れない形質＝潜性形質（前の呼び方は劣性）。' },
    { jp:'同じ種子を使い、水の量だけを変えた実験で、発芽数が多かったのはどの条件か。', answer:'水の量が多い条件', choices:['水の量が多い条件','水の量が少ない条件','温度が高い条件','日光がない条件'], exp:'実験では、変えた条件と結果の関係を対応させて考える。' },
    { jp:'表で「条件Aでは8個、条件Bでは1個」だったとき、どの条件がよく発芽したといえるか。', answer:'条件A', choices:['条件A','条件B','どちらも同じ','わからない'], exp:'表の数の大きいほうが、よく発芽したと判断できる。' },
    { jp:'発芽した種子の高さを調べたとき、実験で必ず記録するものはどれか。', answer:'高さの数値', choices:['高さの数値','机の色','観察者の気分','教科書のページ数'], exp:'観察結果は数値や量で記録すると比較しやすい。' },
    { jp:'実験結果をグラフで見るとき、最初に確認するのはどれか。', answer:'どの高さが高いか', choices:['どの高さが高いか','色の濃さ','書いた人の名前','試験管の形'], exp:'グラフを見るときは、縦の高さや差を読み取ることが大切。' },
    { jp:'同じ条件で2回観察した結果が違ったとき、まず考えることはどれか。', answer:'観察ミスや条件のずれがないか', choices:['観察ミスや条件のずれがないか','結果は何でもよい','実験はやり直しだ','図を消す'], exp:'結果がばらつくときは、条件や観察の仕方を見直す必要がある。' },
    { jp:'受精後の受精卵がどのように成長していくか。', answer:'細胞分裂をくり返して成長する', choices:['細胞分裂をくり返して成長する','そのまま消える','形を変えない','卵細胞に戻る'], exp:'受精卵は細胞分裂を繰り返して、発生に向かう。' },
    { jp:'遺伝子を調べるとき、何を見て判断するのが大切か。', answer:'形質の現れ方', choices:['形質の現れ方','試験管の大きさ','部屋の明るさ','時計の針'], exp:'遺伝子は形質の現れ方からその性質を推測する。' },
    { jp:'親の形質と子の形質を比較するとき、どちらを見て理由を説明するか。', answer:'どの形質が多く現れたか', choices:['どの形質が多く現れたか','音の大きさ','書いた順番','紙の色'], exp:'顕性と潜性を見分けるためには、現れた形質の割合に注目する。' },
    { jp:'「温度が高いほど発芽数が増えた」と言えるのは、どんなときか。', answer:'温度だけを変えて他は同じにしたとき', choices:['温度だけを変えて他は同じにしたとき','複数の条件を同時に変えたとき','結果を見ないとき','条件が書いていないとき'], exp:'条件を1つに絞って比較しないと、原因をはっきりさせにくい。' },
    { jp:'実験の考察で大切なのは、結果だけでなく何か。', answer:'その結果になった理由', choices:['その結果になった理由','見た人の数','机の高さ','言葉の長さ'], exp:'考察では、なぜその結果になったのかを原因とつなげて書く。' }
  ];
  qs.forEach(function(q, i) { q._qid = 'sci_life_s4_q' + i; });
  qs.forEach(function(q) { html += makeChoices(q._qid, q.jp, q.answer, q.choices, q.exp); });
  return html;
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
