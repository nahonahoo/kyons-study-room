// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「同音異義語？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなく漢字の使い分けがわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺、同音異義語わかるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺、国語できる人間？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより漢字の使い分けくわしくなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「同訓異字でツッコミできるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「紛らわしい漢字、もう怖くない」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var xp           = parseInt(localStorage.getItem('jpn_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('jpn_magi_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('jpn_magi_sections') || '{}');
var weakDB       = JSON.parse(localStorage.getItem('jpn_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;

function updateXP() {
  var lv = getLevel(xp);
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
  localStorage.setItem('jpn_xp', xp);
  localStorage.setItem('jpn_magi_answered', JSON.stringify(answeredSet));
  updateXP();
  return getLevel(xp).lv > oldLv;
}
function deductXP(pts) {
  var oldLv = getLevel(xp).lv;
  xp = Math.max(0, xp - pts);
  localStorage.setItem('jpn_xp', xp);
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
    return id.indexOf('jpn_magi_') === 0 && getPct(id) < 80;
  });
}
function renderWeakBar() {
  var wqs = getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,8);
  var el = document.getElementById('weakItems');
  if (!el) return;
  if (wqs.length === 0) { el.innerHTML = '<span class="weak-bar-empty">弱点なし — よくできています！</span>'; return; }
  el.innerHTML = wqs.map(function(qid) {
    return '<div class="weak-item"><span class="weak-item-word">' + getJpForQid(qid) + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect) {
  if (!weakDB[qid]) weakDB[qid] = {
    jp: (qMeta[qid] && qMeta[qid].jp) || '',
    answer: (qMeta[qid] && qMeta[qid].answer) || '',
    choices: (qMeta[qid] && qMeta[qid].choices) || [],
    correct: 0, total: 0
  };
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('jpn_weakdb', JSON.stringify(weakDB));
  var _today = new Date().toISOString().slice(0,10);
  var _daily = JSON.parse(localStorage.getItem('jpn_daily') || '{}');
  _daily[_today] = (_daily[_today] || 0) + 1;
  localStorage.setItem('jpn_daily', JSON.stringify(_daily));
  renderWeakBar();
}

// ===== TOAST =====
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, type === 'levelup' ? 4000 : 2500);
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

// ===== COMMENTS =====
var COMMENTS = {
  correct: [
    'きょん「合ってる！天才かも！！」',
    'きょん「やった！にっくんより漢字くわしいかも！」',
    'きょん「待って待って、使い分けられてきた！！」',
  ],
  wrong: [
    'きょん「あれ！？間違えた！もう一回！」',
    'きょん「えっ違うの！？にっくん助けて！」',
    'きょん「むずっ！でも諦めない！」',
  ]
};
function getComment(type) {
  var arr = COMMENTS[type] || COMMENTS.correct;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getJpForQid(qid) {
  if (qMeta[qid] && qMeta[qid].jp) return qMeta[qid].jp;
  if (weakDB[qid] && weakDB[qid].jp) return weakDB[qid].jp;
  return qid;
}

// ===== QUESTION ENGINE =====
function makeChoices(qid, choices, answer, xpPts) {
  choices = shuffleArray(choices);
  qMeta[qid] = Object.assign({ jp: '' }, qMeta[qid] || {}, { type:'choice', answer:answer, xp:xpPts, choices:choices });
  if (answeredSet[qid]) {
    return '<div class="choices">' + choices.map(function(c) {
      return '<button class="choice-btn' + (c === answer ? ' show-correct' : '') + '" disabled>' + c + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="choices">' + choices.map(function(c) {
    return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
  }).join('') + '</div>';
}

function makeFeedback(qid, explanation) {
  var shown = answeredSet[qid] ? 'display:block' : 'display:none';
  return '<div class="q-feedback correct-fb" id="fb_' + qid + '" style="' + shown + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb" id="fbw_' + qid + '" style="display:none">✗ もう一度！</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + shown + '">'
    + '<div class="exp-card-title">📌 解説</div>'
    + '<div style="color:var(--text);font-size:13px;line-height:2.0">' + explanation + '</div>'
    + '</div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '">'
    + '<div class="ans-label">✅ 正解</div>'
    + '<div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div>'
    + '</div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + shown + '">'
    + (answeredSet[qid] ? getComment('correct') : '')
    + '</div>';
}

function handleChoice(qid, choice) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  if (choice === meta.answer) markCorrect(qid, meta, choice);
  else markWrong(qid, meta, choice);
}

function markCorrect(qid, meta, choice) {
  recordResult(qid, true);
  var lvUp = addXP(meta.xp, qid);
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) card.classList.add('correct-card');
  var fb = document.getElementById('fb_' + qid);
  if (fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid);
  if (fbw) fbw.style.display = 'none';
  var exp = document.getElementById('exp_' + qid);
  if (exp) exp.style.display = 'block';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = getComment('correct'); ac.style.display = 'block'; }
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true;
    if (b.dataset.choice === meta.answer) b.classList.add('selected-correct');
  });
  if (lvUp) {
    setTimeout(function() {
      showToast('🎉 昇格！ ' + getLevel(xp).badge + '　きょん「昇格したわ！！」', 'levelup');
    }, 400);
  } else {
    setTimeout(function() { showToast(getComment('correct')); }, 300);
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
  var demoted = deductXP(3);
  var msgs = ['きょん「あれ！間違えた！でも次は大丈夫！！」', 'きょん「また間違えた…！まだまだ大丈夫！！」', 'きょん「何回間違えてんの！！にっくん助けて！！」'];
  if (demoted) {
    setTimeout(function() { showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」', 'demote'); }, 200);
  } else {
    setTimeout(function() { showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100);
  }
}

function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  answeredSet[qid] = true;
  localStorage.setItem('jpn_magi_answered', JSON.stringify(answeredSet));
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
  var exp = document.getElementById('exp_' + qid);
  if (exp) exp.style.display = 'block';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = '西村「答えを見るのも学習のうち。次は自分で解いてみよう」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。次は自分で解いてみよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete() {
  var prefix = 'jpn_magi_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('jpn_magi_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb && nb.style.display === 'none') {
      nb.style.display = 'block';
      if (!document.getElementById('secCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 4 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '結果発表！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(163,113,247,0.12),rgba(14,165,233,0.08));border:1px solid var(--purple);border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--purple);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
          + '<div style="font-size:14px;color:var(--text2)">きょん「全問解いた！！にっくん、俺やれるじゃん！！」</div>'
          + '<div style="font-size:13px;color:var(--text2);margin-top:4px">西村「よくやった。' + nextMsg + '」</div>'
          + '</div>';
        nb.parentNode.insertBefore(banner, nb);
        setTimeout(function(){ banner.scrollIntoView({ behavior:'smooth', block:'center' }); }, 200);
      }
    }
  }
}

// ===== SECTIONS DEF =====
var SECTIONS = [
  { id:0, label:'📖 スタート',      title:'紛らわしい漢字を集中攻略しよう', sub:'定期テストの範囲から、意味・用法を間違えやすい漢字だけを絞り込んだ' },
  { id:1, label:'同音異義語',        title:'同音異義語',                     sub:'読みは同じでも、漢字と意味が違う言葉を見分ける' },
  { id:2, label:'同訓異字',          title:'同訓異字',                       sub:'訓読みは同じでも、漢字と意味が違う言葉を見分ける' },
  { id:3, label:'読み間違いやすい漢字', title:'読み間違いやすい漢字',         sub:'つい違う読み方をしてしまう、要注意の漢字' },
  { id:4, label:'確認テスト',        title:'確認テスト',                     sub:'紛らわしい漢字の総まとめ！全部でどれだけ取れる？' },
  { id:5, label:'📊弱点',            title:'弱点ノート',                     sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',            title:'弱点特訓モード',                 sub:'弱点問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab'
      + (s.id >= 5 ? ' tokku' : '')
      + (s.id === currentSection ? ' active' : '')
      + (sectionDone[s.id] && s.id < 5 ? ' done' : '');
    var label = s.label + (sectionDone[s.id] && s.id < 5 ? ' ✓' : '');
    if (s.id === 6) { var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
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
  if (id === 5) { renderWeakNote(); return; }
  if (id === 6) { renderTokkuMode(); return; }

  var s = SECTIONS[id];
  var html = '';
  html += '<div class="progress-dots">';
  for (var i = 0; i <= 4; i++) {
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">国語 紛らわしい漢字 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';

  if      (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();

  if (id >= 1 && id <= 4) {
    var nextLabel = id < 4 ? '次のセクションへ →' : '🏆 結果を見る！';
    html += '<button class="next-section-btn" id="nextBtn" data-goto="' + (id < 4 ? id+1 : 'result') + '" style="display:none">' + nextLabel + '</button>';
  }

  document.getElementById('mainContent').innerHTML = html;

  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleChoice(btn.dataset.qid, btn.dataset.choice); });
  });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { showAnswer(btn.dataset.qid); });
  });
  var nb2 = document.getElementById('nextBtn');
  if (nb2) nb2.addEventListener('click', function() {
    var g = nb2.dataset.goto;
    if (g === 'result') showFinalResult(); else goSection(parseInt(g));
  });
  document.querySelectorAll('.start-btn[data-goto]').forEach(function(btn) {
    btn.addEventListener('click', function() { goSection(parseInt(btn.dataset.goto)); });
  });

  if (sectionDone[id]) {
    var nb = document.getElementById('nextBtn');
    if (nb) nb.style.display = 'block';
  }
  checkSectionComplete();
}

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">今度の定期テスト範囲、同音異義語と同訓異字のプリントが大量にあるんだけど！？全部は覚えきれないよ！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">全部を丸暗記する必要はない。大事なのは「読みが同じでも、意味によって漢字が変わる」という感覚をつかむことだ。プリントの中から、特に間違えやすいものだけをこのページに絞り込んである。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">絞ってくれたのは助かる！　同音異義語と同訓異字って、そもそも何が違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">同音異義語は「音読み」が同じで意味が違う言葉（例：意外・以外）。同訓異字は「訓読み」が同じで意味が違う言葉（例：会う・合う・遭う）。どちらも、文の意味を考えて漢字を選ぶのがコツだ。</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">📖 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：同音異義語（読みが同じ・漢字と意味が違う）<br>'
    + 'Section 2：同訓異字（訓読みが同じ・漢字と意味が違う）<br>'
    + 'Section 3：読み間違いやすい漢字<br>'
    + 'Section 4：確認テスト'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">📖 Section 1 から始める →</button>';
}

// ===== SECTION 1: 同音異義語 =====
function renderSection1() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">文の意味を考えて、空欄に入る正しい漢字を選ぼう。意味の違いも一緒に覚えると忘れにくい。</div></div></div>'
    + '</div>';

  var items = [
    { yomi:'いがい', q:'「それは〔　〕な結果だった。」', choices:['意外','以外','異外'], answer:'意外', exp:'意外＝思いがけないこと。以外＝それを除いた他のもの（例：それ以外は考えられない）。' },
    { yomi:'いし', q:'「彼は〔　〕の強い人だ。」', choices:['意志','意思','遺志'], answer:'意志', exp:'意志＝物事をやり抜こうとする心の働き。意思＝考え・思い（例：自分の意思を伝える）。' },
    { yomi:'かいとう', q:'「アンケートに〔　〕する。」', choices:['回答','解答','解凍'], answer:'回答', exp:'回答＝質問に答えること。解答＝問題を解いて答えを出すこと（例：試験の解答）。' },
    { yomi:'かいほう', q:'「病気が〔　〕に向かう。」', choices:['快方','解放','開放'], answer:'快方', exp:'快方＝病気などが良くなっていくこと。解放＝自由にすること。開放＝窓や場所を開け放つこと。' },
    { yomi:'かんしん', q:'「彼女の勇気ある行動に〔　〕した。」', choices:['感心','関心','歓心'], answer:'感心', exp:'感心＝立派だと心を動かされること。関心＝興味を持つこと。歓心＝相手に気に入られようとする気持ち（例：歓心を買う）。' },
    { yomi:'きかい', q:'「絶好の〔　〕を逃す。」', choices:['機会','機械','器械'], answer:'機会', exp:'機会＝物事をするのに良いタイミング。機械／器械＝道具・装置。' },
    { yomi:'きせい', q:'「お盆に実家へ〔　〕する。」', choices:['帰省','規制','既製'], answer:'帰省', exp:'帰省＝実家に帰ること。規制＝ルールで制限すること。既製＝すでに出来上がっていること。' },
    { yomi:'こうえん', q:'「体育館で〔　〕を聞く。」', choices:['講演','公園','公演'], answer:'講演', exp:'講演＝人前で話をすること。公園＝遊び場。公演＝舞台などを人前で見せること。' },
    { yomi:'しんこう', q:'「議論が〔　〕する。」', choices:['進行','信仰','振興'], answer:'進行', exp:'進行＝物事が進むこと。信仰＝神仏を信じること。振興＝盛んにすること。' },
    { yomi:'じき', q:'「今が入試の〔　〕だ。」', choices:['時期','磁気','次期'], answer:'時期', exp:'時期＝季節・頃合い。磁気＝磁石の性質。次期＝次の期間（例：次期会長）。' },
    { yomi:'せいさん', q:'「旅行の費用を〔　〕する。」', choices:['精算','清算','成算'], answer:'精算', exp:'精算＝細かく計算し直すこと。清算＝過去のことにきっぱりけりをつけること。成算＝成功する見込み。' },
    { yomi:'たいしょう', q:'「左右〔　〕の図形。」', choices:['対称','対象','対照'], answer:'対称', exp:'対称＝つりあいがとれていること。対象＝目当てとなるもの。対照＝比べて違いを見ること。' },
    { yomi:'たいせい', q:'「新しい〔　〕を整える。」', choices:['体制','態勢','大成'], answer:'体制', exp:'体制＝組織のしくみ。態勢＝ある物事に対する身構え（例：警戒態勢）。大成＝立派に成し遂げること。' },
    { yomi:'とくい', q:'「数学が〔　〕な科目だ。」', choices:['得意','特異','特意'], answer:'得意', exp:'得意＝上手にできること。特異＝特別で普通と違うこと。' },
    { yomi:'どうこう', q:'「世論の〔　〕を探る。」', choices:['動向','同好','同行'], answer:'動向', exp:'動向＝物事の動き・成り行き。同好＝同じ趣味を持つこと。同行＝一緒に行くこと。' },
  ];

  items.forEach(function(item, i) {
    var qid = 'jpn_magi_s1_q' + i;
    qMeta[qid] = Object.assign({ jp: item.yomi + 'の識別' }, qMeta[qid] || {});
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + '　「' + item.yomi + '」</div>'
      + '<div class="q-text">' + item.q + '</div>'
      + makeChoices(qid, item.choices, item.answer, 2)
      + makeFeedback(qid, '<span class="exp-rule"><span class="label">📖 意味の違い</span>' + item.exp + '</span>')
      + '</div>';
  });

  return html;
}

// ===== SECTION 2: 同訓異字 =====
function renderSection2() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「あう」だけで会う・合う・遭うって3つもあるの、いじわるすぎない！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">人に会うときの「会う」、条件に合うときの「合う」、事故に遭うときの「遭う」。良いことには使わない「遭う」だけ先に覚えると整理しやすい。こういう小さなコツを1つずつ増やしていこう。</div></div></div>'
    + '</div>';

  var items = [
    { yomi:'あう', q:'「駅で友人に〔　〕。」', choices:['会う','合う','遭う'], answer:'会う', exp:'会う＝人と顔を合わせる。合う＝一致する。遭う＝（多くは良くないことに）出くわす（例：事故に遭う）。' },
    { yomi:'あける', q:'「夜が〔　〕、朝になる。」', choices:['明ける','開ける','空ける'], answer:'明ける', exp:'明ける＝夜が終わる。開ける＝閉じていたものを開く。空ける＝中を空にする、時間を空にする。' },
    { yomi:'あつい', q:'「今日はとても〔　〕。」', choices:['暑い','熱い','厚い'], answer:'暑い', exp:'暑い＝気温が高い。熱い＝物の温度が高い。厚い＝厚みがある。' },
    { yomi:'あげる', q:'「賛成の人は手を〔　〕。」', choices:['挙げる','上げる','揚げる'], answer:'挙げる', exp:'挙げる＝手や例を示す。上げる＝位置を高くする。揚げる＝油で揚げる、旗を揚げる。' },
    { yomi:'うつす', q:'「記念に写真を〔　〕。」', choices:['写す','映す','移す'], answer:'写す', exp:'写す＝そのままの形にとる。映す＝画面やスクリーンに表す。移す＝場所を変える。' },
    { yomi:'おさめる', q:'「税金を〔　〕。」', choices:['納める','治める','収める'], answer:'納める', exp:'納める＝金銭・物を渡す。治める＝国や心を統治する。収める＝成果を得る、しまう。' },
    { yomi:'かえりみる', q:'「自分の行いを〔　〕。」', choices:['省みる','顧みる','返りみる'], answer:'省みる', exp:'省みる＝反省する。顧みる＝過去を振り返る、気にかける。' },
    { yomi:'きく', q:'「この薬はよく〔　〕。」', choices:['効く','聞く','聴く'], answer:'効く', exp:'効く＝効果がある。聞く＝音や話が耳に入る。聴く＝注意して耳を傾ける。' },
    { yomi:'すすめる', q:'「先輩が入部を〔　〕。」', choices:['勧める','進める','薦める'], answer:'勧める', exp:'勧める＝そうするように誘う。進める＝物事を進行させる。薦める＝人や物を推挙する。' },
    { yomi:'たずねる', q:'「駅までの道を〔　〕。」', choices:['尋ねる','訪ねる','探ねる'], answer:'尋ねる', exp:'尋ねる＝質問する。訪ねる＝人の家などを訪問する。「探ねる」という書き方はない（探すは「さがす」）。' },
    { yomi:'つとめる', q:'「議長を〔　〕。」', choices:['務める','勤める','努める'], answer:'務める', exp:'務める＝役割を受け持つ。勤める＝会社などに雇われて働く。努める＝努力する。' },
    { yomi:'とる', q:'「資格を〔　〕。」', choices:['取る','撮る','執る'], answer:'取る', exp:'取る＝手に持つ、獲得する。撮る＝写真や映像を記録する。執る＝仕事を行う（例：事務を執る）。' },
    { yomi:'はかる', q:'「体重を〔　〕。」', choices:['量る','測る','計る'], answer:'量る', exp:'量る＝重さ・容積を調べる。測る＝長さ・広さ・程度を調べる。計る＝時間・数を調べる。' },
    { yomi:'のぞむ', q:'「海に〔　〕ホテルに泊まる。」', choices:['臨む','望む','覗む'], answer:'臨む', exp:'臨む＝その場に面する、参加する。望む＝そうあってほしいと願う。「覗む」という書き方はない（覗くは「のぞく」）。' },
    { yomi:'つく', q:'「新しい仕事に〔　〕。」', choices:['就く','着く','付く'], answer:'就く', exp:'就く＝地位や仕事に身を置く。着く＝到着する。付く＝くっつく。' },
  ];

  items.forEach(function(item, i) {
    var qid = 'jpn_magi_s2_q' + i;
    qMeta[qid] = Object.assign({ jp: item.yomi + 'の識別' }, qMeta[qid] || {});
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + '　「' + item.yomi + '」</div>'
      + '<div class="q-text">' + item.q + '</div>'
      + makeChoices(qid, item.choices, item.answer, 2)
      + makeFeedback(qid, '<span class="exp-rule"><span class="label">📖 意味の違い</span>' + item.exp + '</span>')
      + '</div>';
  });

  return html;
}

// ===== SECTION 3: 読み間違いやすい漢字 =====
function renderSection3() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">今度は逆に「見た目からつい違う読み方をしてしまう漢字」を集めた。1つずつ正しい読みを定着させよう。</div></div></div>'
    + '</div>';

  var items = [
    { q:'「相殺」の正しい読みは？', choices:['そうさい','そうさつ','そうころし'], answer:'そうさい', exp:'相殺＝差し引きしてゼロにすること。「殺」を「さつ」と読み間違えやすい。' },
    { q:'「続柄」の正しい読みは？', choices:['つづきがら','ぞくがら','けいがら'], answer:'つづきがら', exp:'続柄＝親族関係を表す言葉。書類でよく見るが「ぞくがら」は誤読。' },
    { q:'「出納」の正しい読みは？', choices:['すいとう','しゅつのう','しゅつとう'], answer:'すいとう', exp:'出納＝金銭やものの出し入れ。「納」を「のう」と読みたくなるが「とう」が正しい。' },
    { q:'「建立」の正しい読みは？', choices:['こんりゅう','けんりつ','けんりゅう'], answer:'こんりゅう', exp:'建立＝寺や塔を建てること。「けんりつ」と読み間違えやすい特殊な読み。' },
    { q:'「消耗」の正しい読みは？', choices:['しょうもう','しょうこう','しょうき'], answer:'しょうもう', exp:'消耗＝使って減ること。「耗」を「こう」と読み間違えやすい。' },
    { q:'「早急」の正しい読みは？', choices:['さっきゅう','そうきゅう','さいきゅう'], answer:'さっきゅう', exp:'早急＝非常に急ぐこと。本来は「さっきゅう」。「そうきゅう」も広く使われるが本来の読みではない。' },
    { q:'「世論」の正しい読みは？', choices:['せろん','よろん','せいろん'], answer:'せろん', exp:'世論＝世間一般の意見。「せろん」「よろん」どちらも使われるが、新聞などでは「せろん」を採用することが多い。' },
    { q:'「貼付」の正しい読みは？', choices:['ちょうふ','てんぷ','ちょうつけ'], answer:'ちょうふ', exp:'貼付＝はりつけること。本来は「ちょうふ」。「てんぷ」は慣用読みとして広まった。' },
  ];

  items.forEach(function(item, i) {
    var qid = 'jpn_magi_s3_q' + i;
    qMeta[qid] = Object.assign({ jp: item.q }, qMeta[qid] || {});
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + '</div>'
      + '<div class="q-text">' + item.q + '</div>'
      + makeChoices(qid, item.choices, item.answer, 2)
      + makeFeedback(qid, '<span class="exp-rule"><span class="label">📖 解説</span>' + item.exp + '</span>')
      + '</div>';
  });

  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">Section 1〜3の総まとめだ。同音異義語・同訓異字・読み間違い、全部出るよ。焦らず自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'「係員〔　〕の入室を禁ず。」に入るのは？', a:'以外', choices:['以外','意外'], exp:'以外＝それを除いた他のもの。' },
    { q:'「提案に〔　〕を唱える。」に入るのは？', a:'異議', choices:['異議','意義'], exp:'異議＝反対意見。意義＝物事の価値・意味。' },
    { q:'「新しい〔　〕を導入する。」（道具）に入るのは？', a:'機械', choices:['機械','機会'], exp:'機械＝装置。機会＝タイミング。' },
    { q:'「窓を〔　〕、換気する。」に入るのは？', a:'開ける', choices:['開ける','空ける','明ける'], exp:'開ける＝閉じていたものを開く。' },
    { q:'「値段を〔　〕。」に入るのは？', a:'上げる', choices:['上げる','挙げる','揚げる'], exp:'上げる＝位置・程度を高くする。' },
    { q:'「絵の具を鏡に〔　〕。」に入るのは？', a:'映す', choices:['映す','写す','移す'], exp:'映す＝画面や鏡に表す。' },
    { q:'「時間を〔　〕。」（ストップウォッチで）に入るのは？', a:'計る', choices:['計る','量る','測る'], exp:'計る＝時間や数を調べる。' },
    { q:'「新しい体〔　〕を整える。」（組織）に入るのは？', a:'制', choices:['制','勢','成'], exp:'体制＝組織のしくみ。' },
    { q:'「相殺」の正しい読みは？', a:'そうさい', choices:['そうさい','そうさつ'], exp:'相殺＝差し引きしてゼロにすること。' },
    { q:'「続柄」の正しい読みは？', a:'つづきがら', choices:['つづきがら','ぞくがら'], exp:'続柄＝親族関係を表す言葉。' },
    { q:'「早急に対応する。」の「早急」の正しい読みは？', a:'さっきゅう', choices:['さっきゅう','そうきゅう'], exp:'本来の読みは「さっきゅう」。' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_magi_s4_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">📝 確認テスト — 紛らわしい漢字 総まとめ（' + qs.length + '問）</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:3, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + makeChoices(qid, q.choices, q.a, 3)
      + makeFeedback(qid, '<span class="exp-rule"><span class="label">📖 解説</span>' + q.exp + '</span>')
      + '</div>';
  });
  html += '</div>';
  return html;
}

function showFinalResult() {
  var count = 11;
  var s4qids = [];
  for (var i = 0; i < count; i++) { s4qids.push('jpn_magi_s4_q' + i); }
  var correct = 0, total = 0;
  s4qids.forEach(function(qid) {
    if (answeredSet[qid]) {
      total++;
      var d = weakDB[qid];
      if (d && d.correct > 0) correct++;
    }
  });
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '📺' : '🎤';
  var msg = pct >= 90
    ? 'きょん「紛らわしい漢字、全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。定期テストも安心だね」'
    : pct >= 70
    ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50
    ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。同訓異字を中心に復習しよう」'
    : 'きょん「むずっ…でもここから這い上がる！！」<br>西村「Section 1から復習してもう一度挑戦しよう」';

  var overlay = document.getElementById('resultOverlay');
  overlay.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;box-sizing:border-box">'
    + '<div style="background:var(--bg2);border:2px solid var(--gold);border-radius:20px;padding:36px 28px;max-width:480px;width:100%;text-align:center">'
    + '<div style="font-size:64px;margin-bottom:12px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--gold);letter-spacing:3px;margin-bottom:8px">テスト終了！</div>'
    + '<div style="font-size:60px;color:var(--gold);font-weight:bold;margin:8px 0">' + pct + '<span style="font-size:28px">%</span></div>'
    + '<div style="font-size:16px;color:var(--text2);margin-bottom:4px">' + correct + ' / ' + total + ' 問正解</div>'
    + '<div style="font-size:15px;line-height:1.8;color:var(--text2);margin:16px 0;padding:16px;background:var(--bg3);border-radius:12px">' + msg + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">'
    + '<button id="res_weak_btn" style="background:var(--red);color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を見る</button>'
    + '<button id="res_retry_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">🔄 もう一度</button>'
    + '<button id="res_s1_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">📖 Section 1へ</button>'
    + '</div>'
    + '</div></div>';
  overlay.style.display = 'block';
  var rwb = document.getElementById('res_weak_btn');
  if (rwb) rwb.addEventListener('click', function(){ closeResult(); goSection(5); });
  var rrb = document.getElementById('res_retry_btn');
  if (rrb) rrb.addEventListener('click', function(){ closeResult(); goSection(4); });
  var rsb = document.getElementById('res_s1_btn');
  if (rsb) rsb.addEventListener('click', function(){ closeResult(); goSection(1); });
}

function closeResult() { document.getElementById('resultOverlay').style.display = 'none'; }

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 5;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('jpn_magi_') === 0; });
  var wqs = getWeakQuestions();

  if (allQids.length === 0) {
    mc.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      + '<div style="font-size:48px;margin-bottom:16px">📊</div>'
      + '<div style="font-size:18px;margin-bottom:8px">まだデータがありません</div>'
      + '<div style="font-size:14px">問題を解くと自動で記録されます</div>'
      + '</div>';
    return;
  }

  var sorted = allQids.slice().sort(function(a,b){ return getPct(a)-getPct(b); });
  var html = '<div style="margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap">'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--gold)">' + allQids.length + '</div><div style="font-size:11px;color:var(--text2)">記録済み問題</div></div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--red)">' + wqs.length + '</div><div style="font-size:11px;color:var(--text2)">要特訓（80%未満）</div></div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--green)">' + (allQids.length - wqs.length) + '</div><div style="font-size:11px;color:var(--text2)">習得済み</div></div>'
    + '</div>';

  sorted.forEach(function(qid) {
    var d = weakDB[qid];
    var pct = getPct(qid);
    var barColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
    html += '<div style="background:var(--bg2);border:1px solid ' + barColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(163,113,247,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text);line-height:1.6">' + getJpForQid(qid) + '</div><div style="font-size:13px;color:' + barColor + '">' + (d.answer || '') + '</div></div>'
      + '<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div>'
      + '<div style="width:80px;height:5px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px"></div></div></div>'
      + '</div>';
  });

  if (wqs.length > 0) {
    html += '<button id="go_tokku_btn" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }
  mc.innerHTML = html;
  var gtb = document.getElementById('go_tokku_btn');
  if (gtb) gtb.addEventListener('click', function() { goSection(6); });
}

// ===== 特訓モード =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };

function renderTokkuMode() {
  currentSection = 6;
  renderTabs();
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');

  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete">'
      + '<div class="tokku-complete-emoji">🏆</div>'
      + '<div class="tokku-complete-title">弱点ゼロ！</div>'
      + '<div class="tokku-complete-msg">きょん「俺、紛らわしい漢字無敵になったわ！！」<br>西村「本当に成長したね」</div>'
      + '<button id="tokku_zero_back" style="margin-top:24px;background:var(--purple);color:#fff;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button>'
      + '</div>';
    var zb = document.getElementById('tokku_zero_back');
    if (zb) zb.addEventListener('click', function() { goSection(1); });
    return;
  }

  tokkuQueue = wqs.slice(0, 15);
  tokkuIndex = 0;
  tokkuSession = { correct:0, total:0 };
  renderTokkuCard();
}

function renderTokkuCard() {
  var mc = document.getElementById('mainContent');
  if (tokkuIndex >= tokkuQueue.length) { showTokkuComplete(); return; }
  var qid = tokkuQueue[tokkuIndex];
  var d = weakDB[qid];
  if (!d) { tokkuIndex++; renderTokkuCard(); return; }

  var pct = getPct(qid);
  var color = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
  var hasChoices = d.choices && d.choices.length > 0;
  var shuffled = hasChoices ? d.choices.slice().sort(function(){ return Math.random()-0.5; }) : [];

  var bodyHtml = '<div class="tokku-choices">'
    + shuffled.map(function(c) {
        return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c.replace(/"/g, '&quot;') + '">' + c + '</button>';
      }).join('')
    + '</div>';

  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp">' + getJpForQid(qid) + '</div>'
    + bodyHtml
    + '<div class="tokku-result" id="tokku_result" style="display:none"></div>'
    + '<button id="tokku_next" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題 →</button>'
    + '</div>';

  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleTokkuChoice(btn.dataset.tqid, btn.dataset.tchoice); });
  });
  var nextBtn = document.getElementById('tokku_next');
  if (nextBtn) nextBtn.addEventListener('click', function() { tokkuIndex++; renderTokkuCard(); });
}

function handleTokkuChoice(qid, choice) {
  var d = weakDB[qid];
  if (!d) return;
  var correct = choice === d.answer;
  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b) { b.disabled = true; });
  var chosenBtn = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + choice.replace(/"/g, '&quot;') + '"]');
  if (chosenBtn) chosenBtn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
  if (!correct) {
    var okBtn = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + d.answer.replace(/"/g, '&quot;') + '"]');
    if (okBtn) okBtn.classList.add('show-correct');
  }
  applyTokkuResult(qid, correct, d);
}

function applyTokkuResult(qid, correct, d) {
  tokkuSession.total++;
  weakDB[qid].total++;
  if (correct) { weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('jpn_weakdb', JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();

  var newPct = getPct(qid);
  var res = document.getElementById('tokku_result');
  if (res) {
    if (correct) {
      xp += 1; localStorage.setItem('jpn_xp', xp); updateXP();
      res.className = 'tokku-result tokku-correct';
      res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 この問題は卒業！' : ' 正答率 → ' + newPct + '%');
      showToast(getComment('correct'));
    } else {
      deductXP(2);
      res.className = 'tokku-result tokku-wrong';
      res.innerHTML = '❌ 間違い！　正答率 → ' + newPct + '%<div class="tokku-answer">正解: ' + d.answer + '</div>';
      showToast('きょん「また間違えた！！でも諦めない！！」');
    }
    res.style.display = 'block';
  }
  var nb = document.getElementById('tokku_next');
  if (nb) nb.style.display = 'block';
}

function showTokkuComplete() {
  var mc = document.getElementById('mainContent');
  var pctAll = tokkuSession.total > 0 ? Math.round(tokkuSession.correct / tokkuSession.total * 100) : 0;
  var emoji = pctAll >= 80 ? '🏆' : pctAll >= 60 ? '😎' : '💪';
  mc.innerHTML = '<div class="tokku-complete">'
    + '<div class="tokku-complete-emoji">' + emoji + '</div>'
    + '<div class="tokku-complete-title">特訓終了！</div>'
    + '<div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div>'
    + '<div class="tokku-complete-msg">' + (pctAll >= 80 ? 'きょん「全部わかった！！」<br>西村「よくやった」' : 'きょん「難しかった…でも諦めない！！」<br>西村「繰り返すことが力になる」') + '</div>'
    + '<div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button id="tokku_retry_btn" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回！</button>'
    + '<button id="tokku_back_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">Section 1 へ戻る</button>'
    + '</div></div>';
  renderWeakBar();
  var rb = document.getElementById('tokku_retry_btn');
  if (rb) rb.addEventListener('click', function() { renderTokkuMode(); });
  var bb = document.getElementById('tokku_back_btn');
  if (bb) bb.addEventListener('click', function() { goSection(1); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
goSection(0);
