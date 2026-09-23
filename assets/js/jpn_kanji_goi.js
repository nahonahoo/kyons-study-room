// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「漢字？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなく熟語の仕組みがわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺、四字熟語わかるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺、国語できる人間？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより漢字くわしくなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「漢字でツッコミできるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「同音異字、もう怖くない」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var xp           = parseInt(localStorage.getItem('jpn_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('jpn_kanji_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('jpn_kanji_sections') || '{}');
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
  localStorage.setItem('jpn_kanji_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('jpn_kanji_') === 0 && getPct(id) < 80;
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
    'きょん「待って待って、読めてきた！！」',
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
  localStorage.setItem('jpn_kanji_answered', JSON.stringify(answeredSet));
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
  var prefix = 'jpn_kanji_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('jpn_kanji_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'📖 スタート',       title:'漢字・語句を集中攻略しよう', sub:'愛知県入試で実際に一番配点が高いのがここ' },
  { id:1, label:'漢字選択',          title:'漢字選択（カタカナ→漢字）',   sub:'カタカナの読みから正しい漢字を選ぶ（入試そのままの形式）' },
  { id:2, label:'同音異字・多義語',  title:'同音異字・多義語の識別',     sub:'同じ漢字でも意味が変わる。同じ意味で使われている語を選ぶ' },
  { id:3, label:'四字熟語・慣用句',  title:'四字熟語・慣用句',           sub:'定番の四字熟語・慣用句を確実に覚える' },
  { id:4, label:'確認テスト',        title:'確認テスト',                 sub:'漢字・語句の総まとめ！全部でどれだけ取れる？' },
  { id:5, label:'📊弱点',            title:'弱点ノート',                 sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',            title:'弱点特訓モード',             sub:'弱点問題だけを集中練習！' },
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
    + '<div class="section-badge">国語 漢字・語句 · SECTION ' + id + '</div>'
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
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん聞いて！　愛知県の入試の国語、実は品詞とか活用とか、文法の識別問題って1問も出てないらしいよ！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">よく調べたね。その通り。過去3年分の実物を見ても、品詞や活用を直接問う設問はゼロだった。その代わり、漢字・語句は独立問題として毎年必ず出ている。しかも読み書きではなく、選択肢からやや難しい熟語を選ぶ形式だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">えっ、文法があんなに大変だったのに、入試だと漢字のほうが大事だったってこと！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">文法は定期テスト（内申点）対策としては今も大事だ。ただ入試本番の得点に直結するのは、①漢字選択（カタカナ→正しい漢字）、②同じ漢字が違う意味で使われる語の識別、③四字熟語・慣用句、この3つ。今日はこの3本柱を集中的にやろう。</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">📖 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：漢字選択（カタカナの読みから正しい漢字を選ぶ、入試そのままの形式）<br>'
    + 'Section 2：同音異字・多義語の識別（同じ漢字が違う意味で使われる例から選ぶ）<br>'
    + 'Section 3：四字熟語・慣用句（定番の型を確実に覚える）<br>'
    + 'Section 4：確認テスト（総合）'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">📖 Section 1 から始める →</button>';
}

// ===== SECTION 1: 漢字選択 =====
function renderSection1() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">入試の漢字問題は「書き取り」ではなく「選択」だ。カタカナで書かれた熟語を見て、正しい漢字を選択肢から選ぶ。似た読み方の漢字がまぎれ込んでいるから、意味とセットで覚えるのがコツだ。</div></div></div>'
    + '</div>';

  var words = [
    { kata:'ヒヨクな大地', kanji:'肥沃', mean:'土地が農作物によく肥えていること', parts:[
      { part:'肥', choices:['肥','皮','被','悲'] },
      { part:'沃', choices:['沃','浴','欲','翌'] },
    ]},
    { kata:'シュウシュウがつかない', kanji:'収拾', mean:'混乱した物事をおさめてまとめること', parts:[
      { part:'収', choices:['収','週','宗','秋'] },
      { part:'拾', choices:['拾','就','衆','秀'] },
    ]},
    { kata:'カンマンな動き', kanji:'緩慢', mean:'動きがゆるやかで、のろいこと', parts:[
      { part:'緩', choices:['緩','官','観','慣'] },
      { part:'慢', choices:['慢','漫','満','曼'] },
    ]},
    { kata:'ケンチョな差', kanji:'顕著', mean:'誰の目にもはっきりと分かるほど際立っていること', parts:[
      { part:'顕', choices:['顕','険','検','験'] },
      { part:'著', choices:['著','貯','緒','猪'] },
    ]},
    { kata:'ジンソクな対応', kanji:'迅速', mean:'非常にすばやいこと', parts:[
      { part:'迅', choices:['迅','陣','尋','尽'] },
      { part:'速', choices:['速','束','測','側'] },
    ]},
    { kata:'カンケツに述べる', kanji:'簡潔', mean:'簡単で要点がすっきりまとまっていること', parts:[
      { part:'簡', choices:['簡','間','監','寛'] },
      { part:'潔', choices:['潔','欠','決','血'] },
    ]},
    { kata:'コウミョウな手口', kanji:'巧妙', mean:'技術や工夫が非常に優れていて上手なこと', parts:[
      { part:'巧', choices:['巧','効','攻','幸'] },
      { part:'妙', choices:['妙','名','明','命'] },
    ]},
    { kata:'アイマイな返事', kanji:'曖昧', mean:'物事がはっきりせず、ぼんやりしていること', parts:[
      { part:'曖', choices:['曖','愛','哀','挨'] },
      { part:'昧', choices:['昧','毎','妹','枚'] },
    ]},
  ];

  html += '<div class="acc-lead" style="font-size:13px;color:var(--text2);line-height:1.9;margin-bottom:16px">🎯 熟語ごとに①②2つの漢字を選ぶよ。実際の入試と同じ形式。</div>';

  words.forEach(function(w, wi) {
    html += '<div class="rule-card"><div class="rule-card-title">「' + w.kata + '」＝' + w.kanji + '（' + w.mean + '）</div>';
    w.parts.forEach(function(p, pi) {
      var qid = 'jpn_kanji_s1_q' + (wi * 2 + pi);
      qMeta[qid] = Object.assign({ jp: '「' + w.kata + '」の' + (pi === 0 ? '①' : '②') }, qMeta[qid] || {});
      html += '<div class="q-card" data-card="' + qid + '">'
        + '<div class="q-number">' + (pi === 0 ? '①' : '②') + '</div>'
        + '<div class="q-text">「' + w.kata + '」の' + (pi === 0 ? '①' : '②') + 'にあたる漢字を選べ</div>'
        + makeChoices(qid, p.choices, p.part, 2)
        + makeFeedback(qid, '<span class="exp-rule"><span class="label">📖 正解</span>「' + w.kanji + '」の「' + p.part + '」</span><span class="exp-tip">💡 熟語全体の意味（' + w.mean + '）とセットで覚えよう。</span>')
        + '</div>';
    });
    html += '</div>';
  });

  return html;
}

// ===== SECTION 2: 同音異字・多義語の識別 =====
function renderSection2() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">同じ漢字なのに意味が変わるってどういうこと！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">例えば「厳」。「厳か（おごそか）」の厳と、「厳選（きびしく選ぶ）」の厳は、同じ漢字でも意味が違う。入試では『傍線部と同じ意味で使われている語を選べ』という形で出る。まず意味の違いを整理してから解こう。</div></div></div>'
    + '</div>';

  var items = [
    { title:'「厳」', ref:'厳か（おごそか・気高い様子）', choices:['厳選（きびしく選ぶ）','厳粛（おごそかである）','厳禁（きびしく禁じる）','厳守（きびしく守る）'], answer:'厳粛（おごそかである）', exp:'「厳」には①きびしい②おごそか、の2つの意味がある。「厳か」は②の意味。同じ②の意味を持つのは「厳粛」。' },
    { title:'「著」', ref:'著しい（いちじるしい・際立っている）', choices:['著者（書きあらわす人）','顕著（際立っている）','著述（書きあらわす）','著書（書きあらわした本）'], answer:'顕著（際立っている）', exp:'「著」には①あらわす②いちじるしい、の2つの意味がある。「著しい」は②の意味。同じ②の意味を持つのは「顕著」。' },
    { title:'「解」', ref:'理解（わかる・意味をつかむ）', choices:['解答（といて答えを出す）','解散（ばらばらにする）','了解（わかる）','分解（ばらばらにする）'], answer:'了解（わかる）', exp:'「解」には①とく②わかる③ほどく、の意味がある。「理解」は②の意味。同じ②の意味を持つのは「了解」。' },
    { title:'「治」', ref:'自治（おさめる・統治する）', choices:['治療（病気をなおす）','完治（病気がなおる）','政治（おさめる）','主治医（なおす担当の医者）'], answer:'政治（おさめる）', exp:'「治」には①おさめる（統治する）②なおす（治療する）、の2つの意味がある。「自治」は①の意味。同じ①の意味を持つのは「政治」。' },
    { title:'「計」', ref:'統計（かぞえる・集計する）', choices:['計画（たくらむ・企てる）','体重計（はかる器具）','合計（かぞえる）','計略（たくらむ）'], answer:'合計（かぞえる）', exp:'「計」には①はかる②たくらむ③かぞえる、の意味がある。「統計」は③の意味。同じ③の意味を持つのは「合計」。' },
    { title:'「省」', ref:'反省（かえりみる・振り返る）', choices:['省略（はぶく）','外務省（役所）','帰省（実家に帰る）','猛省（強くかえりみる）'], answer:'猛省（強くかえりみる）', exp:'「省」には①はぶく②かえりみる③役所、の意味がある。「反省」は②の意味。同じ②の意味を持つのは「猛省」。' },
  ];

  items.forEach(function(item, i) {
    var qid = 'jpn_kanji_s2_q' + i;
    qMeta[qid] = Object.assign({ jp: item.title + 'の識別' }, qMeta[qid] || {});
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + '</div>'
      + '<div class="q-text">' + item.title + 'の「' + item.ref + '」と同じ意味で使われている語はどれ？</div>'
      + makeChoices(qid, item.choices, item.answer, 2)
      + makeFeedback(qid, '<span class="exp-rule"><span class="label">📖 ルール</span>' + item.exp + '</span>')
      + '</div>';
  });

  return html;
}

// ===== SECTION 3: 四字熟語・慣用句 =====
function renderSection3() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">四字熟語・慣用句は、意味を知っていれば一瞬で解ける。逆に知らないとどうにもならない。だから、まず定番の型を確実に頭に入れておこう。</div></div></div>'
    + '</div>';

  var items = [
    { q:'「彼はどんな状況でも泰然〔　〕としていて、少しも慌てない。」の〔　〕に入る語は？', choices:['篤実','虚心','自若','余裕'], answer:'自若', exp:'泰然自若（たいぜんじじゃく）＝何が起きても動じず落ち着いている様子。' },
    { q:'技術が日に日に急速に進歩することを表す四字熟語は？', choices:['東奔西走','不易流行','一触即発','日進月歩'], answer:'日進月歩', exp:'日進月歩（にっしんげっぽ）＝日に日に急速に進歩すること。' },
    { q:'一つのことをして同時に二つの利益を得ることを表す四字熟語は？', choices:['一石二鳥','一長一短','一挙一動','一朝一夕'], answer:'一石二鳥', exp:'一石二鳥（いっせきにちょう）＝一つの行動で二つの利益を得ること。' },
    { q:'短時間ではなく、長い年月をかけて成し遂げることを表す四字熟語は？「決して〔　　〕に成し遂げたのではない」', choices:['一朝一夕','単刀直入','臨機応変','半信半疑'], answer:'一朝一夕', exp:'一朝一夕（いっちょういっせき）＝わずかな時間。「〜ではない」の形で「長い年月がかかった」の意味になる。' },
    { q:'多くの人が口をそろえて同じことを言うことを表す四字熟語は？', choices:['異口同音','自画自賛','因果応報','十人十色'], answer:'異口同音', exp:'異口同音（いくどうおん）＝多くの人が口をそろえて同じことを言うこと。' },
    { q:'昔のことを学び直し、そこから新しい知識や考えを得ることを表す四字熟語は？', choices:['温故知新','大器晩成','起死回生','千載一遇'], answer:'温故知新', exp:'温故知新（おんこちしん）＝昔のことを学んで新しい知識・考えを得ること。' },
    { q:'めったに訪れない良い機会のことを表す四字熟語は？', choices:['一期一会','千載一遇','一朝一夕','七転八起'], answer:'千載一遇', exp:'千載一遇（せんざいいちぐう）＝千年に一度しかないほどの、めったにない好機。' },
    { q:'見かけによらず、真の実力者は遅れて頭角を現すことを表す四字熟語は？', choices:['大器晩成','大同小異','器用貧乏','粉骨砕身'], answer:'大器晩成', exp:'大器晩成（たいきばんせい）＝大人物は世に出るまでに時間がかかるということ。' },
    { q:'話や態度に一貫性がなく、言うこととすることが違うことを表す四字熟語は？', choices:['言語道断','自業自得','言行不一致','支離滅裂'], answer:'言行不一致', exp:'言行不一致（げんこうふいっち）＝言うこととすることが食い違っていること。' },
    { q:'半分は信じ、半分は疑っている気持ちを表す四字熟語は？', choices:['半信半疑','玉石混交','付和雷同','優柔不断'], answer:'半信半疑', exp:'半信半疑（はんしんはんぎ）＝半分信じ、半分疑うこと。' },
  ];

  items.forEach(function(item, i) {
    var qid = 'jpn_kanji_s3_q' + i;
    qMeta[qid] = Object.assign({ jp: '四字熟語 Q' + (i + 1) }, qMeta[qid] || {});
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i + 1) + '</div>'
      + '<div class="q-text">' + item.q + '</div>'
      + makeChoices(qid, item.choices, item.answer, 2)
      + makeFeedback(qid, '<span class="exp-rule"><span class="label">📖 意味</span>' + item.exp + '</span>')
      + '</div>';
  });

  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">Section 1〜3の総まとめだ。漢字選択・同音異字・四字熟語、全部出るよ。焦らず自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'「ケンメイな判断」の「ケン」にあたる漢字は？（賢明）', a:'賢', choices:['賢','堅','剣','険'], exp:'「賢明（けんめい）」＝かしこく的確な判断ができること。' },
    { q:'「ドウヨウを隠せない」の「ヨウ」にあたる漢字は？（動揺）', a:'揺', choices:['揺','謡','陽','揚'], exp:'「動揺（どうよう）」＝心が乱れて落ち着かないこと。' },
    { q:'「カンケツな説明」の「カン」にあたる漢字は？（簡潔）', a:'簡', choices:['簡','官','巻','看'], exp:'「簡潔（かんけつ）」＝簡単で要点がまとまっていること。' },
    { q:'「ジンソクな行動」の「ジン」にあたる漢字は？（迅速）', a:'迅', choices:['迅','陣','尽','尋'], exp:'「迅速（じんそく）」＝非常にすばやいこと。' },
    { q:'「フキュウの真理」の「キュウ」にあたる漢字は？（不朽）', a:'朽', choices:['朽','旧','久','急'], exp:'「不朽（ふきゅう）」＝いつまでも価値が失われないこと。' },
    { q:'「意図」の「図」と同じ意味で使われている語は？（たくらみ・はかりごと）', a:'企図（たくらみ・はかりごと）', choices:['図書（え・書物）','地図（え）','企図（たくらみ・はかりごと）','図鑑（え）'], exp:'「図」には①え②はかる（たくらむ）の意味がある。「意図」は②の意味。同じ②の意味は「企図」。' },
    { q:'「集計」の「計」と同じ意味で使われている語は？（かぞえる）', a:'合計（かぞえる）', choices:['計略（たくらむ）','体温計（はかる器具）','合計（かぞえる）','設計（計画する）'], exp:'「集計」は「かぞえる」の意味。同じ意味は「合計」。' },
    { q:'「反省」の「省」と同じ意味で使われている語は？（かえりみる）', a:'猛省（かえりみる）', choices:['省略（はぶく）','経済産業省（役所）','猛省（かえりみる）','帰省（実家に帰る）'], exp:'「反省」は「かえりみる」の意味。同じ意味は「猛省」。' },
    { q:'意見が異なることを恐れず、前置きなしにすぐ本題に入ることを表す四字熟語は？', a:'単刀直入', choices:['単刀直入','大同小異','我田引水','自業自得'], exp:'単刀直入（たんとうちょくにゅう）＝前置きなしにすぐ本題に入ること。' },
    { q:'見かけや条件がほとんど同じで、大きな違いがないことを表す四字熟語は？', a:'大同小異', choices:['大同小異','十人十色','空前絶後','付和雷同'], exp:'大同小異（だいどうしょうい）＝細かい違いはあるが、だいたい同じであること。' },
    { q:'自分に都合のよいように、物事を進めたり解釈したりすることを表す四字熟語は？', a:'我田引水', choices:['我田引水','呉越同舟','虎視眈々','独立独歩'], exp:'我田引水（がでんいんすい）＝自分に都合のよいように物事を運ぶこと。' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_kanji_s4_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">📝 確認テスト — 漢字・語句 総まとめ（' + qs.length + '問）</div>';
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
  for (var i = 0; i < count; i++) { s4qids.push('jpn_kanji_s4_q' + i); }
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
    ? 'きょん「漢字、全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。これで入試の得点源が1つ増えたね」'
    : pct >= 70
    ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50
    ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。四字熟語を中心に復習しよう」'
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
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('jpn_kanji_') === 0; });
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
      + '<div class="tokku-complete-msg">きょん「俺、漢字無敵になったわ！！」<br>西村「本当に成長したね」</div>'
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
