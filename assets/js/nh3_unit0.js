// ===== XP SYSTEM =====
const LEVELS = [
  {
    lv:1, min:0,
    label:'Lv.1 🥚',
    badge:'NSC入学',
    title:'見習い研修生',
    status:'きょん「英語？なにそれ食えるの？」',
  },
  {
    lv:2, min:15,
    label:'Lv.2 🎤',
    badge:'NSC卒業',
    title:'一般社員',
    status:'きょん「なんとなくわかってきた気がする」',
  },
  {
    lv:3, min:30,
    label:'Lv.3 🎭',
    badge:'劇場デビュー',
    title:'主任',
    status:'きょん「にっくん、俺英語できるかも」',
  },
  {
    lv:4, min:50,
    label:'Lv.4 ⭐',
    badge:'準レギュラー獲得',
    title:'係長',
    status:'きょん「もしかして俺天才？」',
  },
  {
    lv:5, min:75,
    label:'Lv.5 📺',
    badge:'全国ネットレギュラー',
    title:'課長',
    status:'きょん「にっくんより賢くなってきた」',
  },
  {
    lv:6, min:105,
    label:'Lv.6 🌟',
    badge:'冠番組獲得',
    title:'部長',
    status:'きょん「英語で漫才できるかもしれない」',
  },
  {
    lv:7, min:140,
    label:'Lv.7 🏆',
    badge:'M-1決勝進出',
    title:'取締役',
    status:'きょん「もうにっくんいらないかも」',
  },
  {
    lv:8, min:180,
    label:'Lv.8 👑',
    badge:'M-1グランプリ優勝',
    title:'社長',
    status:'きょん「俺、令和ロマンに勝ったわ」',
  },
];
const MAX_XP = 200;
var xp = parseInt(localStorage.getItem('nh3_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('nh3_answered') || '{}');
var attemptCounts = {};
var sectionDone = JSON.parse(localStorage.getItem('nh3_sections') || '{}');

function getLevel(x) {
  for (var i = LEVELS.length-1; i >= 0; i--) {
    if (x >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
function getNextLevel(x) {
  var cur = getLevel(x);
  for (var i = 0; i < LEVELS.length; i++) {
    if (LEVELS[i].lv === cur.lv + 1) return LEVELS[i];
  }
  return null;
}
function updateXP() {
  var lv = getLevel(xp);
  var next = getNextLevel(xp);
  // Bar: progress within current level
  var fromXP = lv.min;
  var toXP = next ? next.min : MAX_XP;
  var pct = Math.min(100, Math.round((xp - fromXP) / (toXP - fromXP) * 100));
  document.getElementById('xpFill').style.width = pct + '%';
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
  document.getElementById('xpLevel').textContent = lv.label;
  document.getElementById('xpBadge').textContent = lv.badge;
  document.getElementById('xpTitle').textContent = lv.title;
  document.getElementById('xpStatus').textContent = lv.status;
  var nextEl = document.getElementById('xpNext');
  if (next) {
    nextEl.textContent = xp + ' XP ／ 次まで ' + (next.min - xp) + ' XP';
  } else {
    nextEl.textContent = '🏆 最高位到達！（' + xp + ' XP）';
  }
}
function addXP(pts, qid) {
  if (answeredSet[qid]) return 0;
  answeredSet[qid] = true;
  var prev = getLevel(xp).lv;
  xp = xp + pts;
  localStorage.setItem('nh3_xp', xp);
  localStorage.setItem('nh3_answered', JSON.stringify(answeredSet));
  updateXP();
  var now = getLevel(xp).lv;
  return now > prev ? now : 0;
}
function deductXP(pts) {
  var prev = getLevel(xp).lv;
  xp = Math.max(0, xp - pts);

  localStorage.setItem('nh3_xp', xp);
  updateXP();
  var now = getLevel(xp).lv;
  return now < prev ? prev : 0;
}

// ===== 弱点データベース =====
var weakDB = JSON.parse(localStorage.getItem('nh3_weakdb') || '{}');
// 構造: { qid: { jp, answer, choices, exp, correct, total, type } }

function recordResult(qid, isCorrect) {
  var meta = qMeta[qid];
  if (!meta) return;
  if (!weakDB[qid]) {
    weakDB[qid] = {
      jp: meta.jp || '',
      answer: meta.answer || '',
      choices: meta.choices || [],
      exp: meta.exp || '',
      type: meta.type || 'choice',
      correct: 0,
      total: 0
    };
  }
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('nh3_weakdb', JSON.stringify(weakDB));
  var _today = new Date().toISOString().slice(0,10);
  var _daily = JSON.parse(localStorage.getItem('nh3_daily') || '{}');
  _daily[_today] = (_daily[_today] || 0) + 1;
  localStorage.setItem('nh3_daily', JSON.stringify(_daily));
  renderWeakBar();
  renderTabs(); // 特訓タブの数を更新
}

function getPct(qid) {
  var d = weakDB[qid];
  if (!d || d.total === 0) return 100;
  return Math.round(d.correct / d.total * 100);
}

function getWeakQuestions() {
  // 正答率50%未満 or 1回以上間違えた問題
  return Object.keys(weakDB).filter(function(qid) {
    var d = weakDB[qid];
    return d.total > 0 && getPct(qid) < 80;
  }).sort(function(a, b) { return getPct(a) - getPct(b); }); // 正答率低い順
}

function renderWeakBar() {
  var wqs = getWeakQuestions();
  var el = document.getElementById('weakItems');
  if (!el) return;
  if (wqs.length === 0) {
    el.innerHTML = '<span class="weak-bar-empty">弱点なし！すごい！</span>';
    return;
  }
  // 正答率低い上位8個を表示
  var top = wqs.slice(0, 8);
  el.innerHTML = top.map(function(qid) {
    var d = weakDB[qid];
    var pct = getPct(qid);
    var color = pct < 30 ? '#e94560' : pct < 60 ? '#f5c518' : '#8b949e';
    var bar = '';
    for (var i = 0; i < 5; i++) {
      bar += '<span style="color:' + (i < Math.round(pct/20) ? color : '#21262d') + '">█</span>';
    }
    return '<div class="weak-item">'
      + '<span class="weak-item-word">' + (d.jp || qid) + '</span>'
      + '<span>' + bar + '</span>'
      + '<span class="weak-item-pct">' + pct + '%</span>'
      + '</div>';
  }).join('');
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

// ===== AUDIO =====
var audioStore = {};
var currentAudioId = null;
function playAudio(id) {
  if (!window.speechSynthesis) return;
  var text = audioStore[id];
  if (!text) return;
  var btn = document.getElementById('ab_' + id);
  if (currentAudioId === id) {
    window.speechSynthesis.cancel();
    currentAudioId = null;
    btn && btn.classList.remove('playing');
    return;
  }
  if (currentAudioId) {
    var prev = document.getElementById('ab_' + currentAudioId);
    prev && prev.classList.remove('playing');
  }
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.82;
  u.onend = function() {
    btn && btn.classList.remove('playing');
    if (currentAudioId === id) currentAudioId = null;
  };
  currentAudioId = id;
  btn && btn.classList.add('playing');
  window.speechSynthesis.speak(u);
}
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.82;
  window.speechSynthesis.speak(u);
}
function speakJa(text) {
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = 1.1;
    window.speechSynthesis.speak(u);
  } catch(e) {}
}
function audioBtn(id, text) {
  audioStore[id] = text;
  return '<button class="audio-btn" id="ab_' + id + '" onclick="playAudio(\'' + id + '\')" title="音声を聞く">🔊</button>';
}

// ===== ARTIST COMMENTS =====
var ARTISTS = {
  kyon_correct: [
    'きょん「合ってる合ってる！すごくない！？」',
    'きょん「やった！正解！天才かも！」',
    'きょん「にっくん見て！私より賢いかも！」',
    'きょん「合ってる！もう英語得意になってるんじゃない！？」',
    'きょん「待って待って、全部合ってるじゃん！めちゃくちゃすごいじゃん！」',
  ],
  nishimura_correct: [
    '西村「正解。よく覚えてたね」',
    '西村「できてる。その調子」',
    '西村「正解。次も頼む」',
    '西村「合ってる。広島でも東京でも通用するよ」',
    '西村「正解！ちゃんとわかってる」',
  ],
  kyon_wrong: [
    'きょん「あれ！？間違えた！もう一回！」',
    'きょん「えっ違うの！？にっくん助けて！」',
    'きょん「むずっ！もう一回やる！」',
  ],
};
function getComment(type) {
  var arr = ARTISTS[type];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== QUESTION ENGINE =====
var qMeta = {};

// 英作文専用（API採点）
function makeCompositionInput(qid, answer, xpPts, jpText) {
  qMeta[qid] = { type: 'composition', answer: answer, xp: xpPts, jp: jpText };
  if (answeredSet[qid]) {
    var grade = gradeCache[qid] || { icon:'✓', cls:'grade-perfect', comment:'採点済み', xpRate:1 };
    return '<input disabled value="' + (answeredSet[qid + '_val'] || answer) + '" class="q-input ' + (grade.xpRate > 0 ? 'correct' : 'wrong') + '" id="qi_' + qid + '" data-qid="' + qid + '">'
      + '<div class="grade-result ' + grade.cls + '" style="display:block"><span class="grade-icon">' + grade.icon + '</span><span class="grade-comment">' + grade.comment + '</span><div class="grade-xp-note">' + grade.xpNote + '</div></div>';
  }
  return '<input class="q-input" id="qi_' + qid + '" data-qid="' + qid + '" placeholder="英文を入力…（AI採点）">'
    + '<button class="check-btn" data-qid="' + qid + '">採点する ✓</button>'
    + '<div class="grade-result" id="gr_' + qid + '"></div>';
}

var gradeCache = JSON.parse(localStorage.getItem('nh3_grades') || '{}');

function makeInput(qid, answer, xpPts) {
  qMeta[qid] = { type: 'input', answer: answer, xp: xpPts };
  var disabled = answeredSet[qid] ? 'disabled value="' + answer + '" class="q-input correct"' : 'class="q-input"';
  return '<input ' + disabled + ' id="qi_' + qid + '" data-qid="' + qid + '" placeholder="英語で入力…">';
}
function makeCheckBtn(qid) {
  if (answeredSet[qid]) return '';
  return '<button class="check-btn" data-qid="' + qid + '">チェック ✓</button>';
}
function makeChoices(qid, choices, answer, xpPts) {
  choices = choices.slice().sort(function(){ return Math.random() - 0.5; });
  qMeta[qid] = { type: 'choice', answer: answer, xp: xpPts };
  if (answeredSet[qid]) {
    return '<div class="choices">' + choices.map(function(c) {
      var cls = c === answer ? 'choice-btn show-correct' : 'choice-btn';
      return '<button class="' + cls + '" disabled>' + c + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="choices">' + choices.map(function(c) {
    return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
  }).join('') + '</div>';
}
function makeFeedback(qid, explanation) {
  var shown = answeredSet[qid] ? 'display:block' : 'display:none';
  return '<div class="q-feedback correct-fb" id="fb_' + qid + '" style="' + shown + '">'
    + '<strong>✓ 正解！</strong>'
    + '</div>'
    + '<div class="q-feedback wrong-fb" id="fbw_' + qid + '" style="display:none">'
    + '✗ もう一度チャレンジ！'
    + '</div>'
    + '<div class="exp-card" id="exp_card_' + qid + '" style="' + shown + '">'
    + '<div class="exp-card-title">📌 解説</div>'
    + '<div style="color:#e8e0d0;font-size:13px;line-height:2.0">' + explanation + '</div>'
    + '</div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '">'
    + '<div class="ans-label">✅ 正解</div>'
    + '<div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);margin-bottom:8px;font-weight:bold"></div>'
    + '</div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + shown + '">'
    + (answeredSet[qid] ? getComment('nishimura_correct') : '')
    + '</div>';
}

function handleCheck(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  if (meta.type === 'composition') {
    var val = (document.getElementById('qi_' + qid) || {}).value || '';
    if (!val.trim()) { showToast('英文を入力してください！'); return; }
    gradeWithAPI(qid, meta, val);
    return;
  }
  var val = '';
  if (meta.type === 'input') {
    val = (document.getElementById('qi_' + qid) || {}).value || '';
  }
  var correct = flexMatch(val, meta.answer);
  if (correct) {
    markCorrect(qid, meta);
  } else {
    markWrong(qid, meta);
  }
}
function handleChoice(qid, choice) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  var correct = choice === meta.answer;
  if (correct) {
    markCorrect(qid, meta, choice);
  } else {
    markWrong(qid, meta, choice);
  }
}
function markCorrect(qid, meta, choice) {
  speakJa('正解！');
  recordResult(qid, true);
  var lvUp = addXP(meta.xp, qid);
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) card.classList.add('correct-card');
  var input = document.getElementById('qi_' + qid);
  if (input) { input.classList.add('correct'); input.disabled = true; }
  var btn = document.querySelector('.check-btn[data-qid="' + qid + '"]');
  if (btn) btn.style.display = 'none';
  var fb = document.getElementById('fb_' + qid);
  if (fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid);
  if (fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid);
  if (ac) { ac.textContent = getComment('nishimura_correct'); ac.style.display = 'block'; }
  // Choice buttons
  if (choice) {
    document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
      b.disabled = true;
      if (b.dataset.choice === meta.answer) b.classList.add('selected-correct');
    });
  }
  if (lvUp) {
    setTimeout(function() {
      var lv = getLevel(xp);
      speakJa('昇格！');
      showToast('🎉 昇格！ ' + lv.badge + ' → ' + lv.title + ' きょん「' + lv.badge + 'になったわ！！」', 'levelup');
    }, 400);
  } else {
    setTimeout(function() {
      showToast(getComment('kyon_correct'));
    }, 300);
  }
  checkSectionComplete();
}
function markWrong(qid, meta, choice) {
  speakJa('もう一度！');
  recordResult(qid, false);
  attemptCounts[qid] = (attemptCounts[qid] || 0) + 1;
  var card = document.querySelector('[data-card="' + qid + '"]');
  if (card) { card.classList.add('wrong-card'); setTimeout(function(){ card.classList.remove('wrong-card'); }, 600); }
  var input = document.getElementById('qi_' + qid);
  if (input) { input.classList.add('wrong'); setTimeout(function(){ input.classList.remove('wrong'); }, 400); }
  var fbw = document.getElementById('fbw_' + qid);
  if (fbw) fbw.style.display = 'block';
  if (choice) {
    var btn = document.querySelector('.choice-btn[data-qid="' + qid + '"][data-choice="' + choice + '"]');
    if (btn) { btn.classList.add('selected-wrong'); setTimeout(function(){ btn.classList.remove('selected-wrong'); }, 600); }
  }
  // 2回以上間違えたら「答えを見る」ボタンを表示
  if (attemptCounts[qid] >= 2) {
    var sab = document.getElementById('sab_' + qid);
    if (sab) sab.style.display = 'inline-block';
  }

  // XP減点（-2）
  var demoted = deductXP(5);
  var curLv = getLevel(xp);

  // トーストメッセージ（間違い回数に応じて変える）
  var wrongMsgs = [
    'きょん「あれ！間違えた！XP -2！！」',
    'きょん「また間違えた…！まだまだ大丈夫！！」',
    'きょん「何回間違えてんの！！にっくんに怒られる！！」',
    'きょん「もうやだ！！でも諦めないぞ！！答えを見ちゃおうかな…」',
  ];
  var msg = wrongMsgs[Math.min(wrongMsgs.length - 1, attemptCounts[qid] - 1)];

  if (demoted) {
    // 降格！
    setTimeout(function() {
      showToast('💦 降格…！ ' + curLv.badge + ' に戻った…　きょん「せっかく昇格したのに…！！」', 'demote');
    }, 200);
  } else {
    setTimeout(function() { showToast(msg); }, 100);
  }
}
function showAnswer(qid) {
  var meta = qMeta[qid];
  if (!meta || answeredSet[qid]) return;
  // Mark as answered WITHOUT giving XP
  answeredSet[qid] = true;
  localStorage.setItem('nh3_answered', JSON.stringify(answeredSet));
  // Populate and show answer
  var arAns = document.getElementById('ar_ans_' + qid);
  if (arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid);
  if (ar) ar.style.display = 'block';
  // Hide show-answer button
  var sab = document.getElementById('sab_' + qid);
  if (sab) sab.style.display = 'none';
  // Disable inputs
  var input = document.getElementById('qi_' + qid);
  if (input) { input.disabled = true; input.value = meta.answer; }
  var checkBtn = document.querySelector('.check-btn[data-qid="' + qid + '"]');
  if (checkBtn) checkBtn.style.display = 'none';
  // Show correct choice
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b) {
    b.disabled = true;
    if (b.dataset.choice === meta.answer) b.classList.add('show-correct');
  });
  // Hide wrong feedback
  var fbw = document.getElementById('fbw_' + qid);
  if (fbw) fbw.style.display = 'none';
  // Artist comment
  var ac = document.getElementById('ac_' + qid);
  if (ac) {
    ac.textContent = 'きょん「ふーん、そういうことか。覚えた！次は自分でできる！」';
    ac.style.display = 'block';
  }
  showToast('西村「答えを見るのも学習のうち。次は自分で解いてみよう」');
  checkSectionComplete();
}

// ===== LOCAL SMART GRADING =====
function gradeWithAPI(qid, meta, val) {
  var result = localSmartGrade(val, meta.answer, meta.jp);
  showGradeResult(qid, meta, val, result);
}

function localSmartGrade(val, answer, jpText) {
  var v = val.trim().toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
  var a = answer.trim().toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ');

  // 完全一致
  if (v === a) {
    return { grade:'◎', xpRate:1.0, comment:'完璧！そのまま覚えよう！' };
  }

  var vWords = v.split(' ');
  var aWords = a.split(' ');

  // キーワード一致率を計算
  var matched = aWords.filter(function(w) { return vWords.indexOf(w) !== -1; });
  var rate = matched.length / aWords.length;

  // 語順チェック
  var orderOk = checkWordOrder(vWords, aWords);

  // 文法キーワードチェック（be動詞・助動詞など重要語）
  var grammarWords = ['am','is','are','was','were','do','does','did',"don't","doesn't","didn't","wasn't","weren't",'not'];
  var aGrammar = aWords.filter(function(w){ return grammarWords.indexOf(w) !== -1; });
  var vGrammar = aGrammar.filter(function(w){ return vWords.indexOf(w) !== -1; });
  var grammarOk = aGrammar.length === 0 || vGrammar.length === aGrammar.length;

  // 厳しめ判定
  // ◎：完全一致 or 文法語全一致+キーワード90%以上+語順OK
  if (v === a) {
    return { grade:'◎', xpRate:1.0, comment:'完璧！そのまま覚えよう！' };
  }
  if (rate >= 0.9 && grammarOk && orderOk) {
    return { grade:'◎', xpRate:1.0, comment:'ほぼ完璧！余分な単語があるけど文法は正確！' };
  }
  // ○：文法語が全部合っていてキーワード75%以上、語順もOK
  if (rate >= 0.75 && grammarOk && orderOk) {
    return { grade:'○', xpRate:0.6, comment:'惜しい！文法はOK、単語が少し違う。もう一度確認しよう。' };
  }
  // △：文法語が合ってるがキーワード不足 or 語順NG
  if (grammarOk && rate >= 0.5) {
    return { grade:'△', xpRate:0.2, comment:'文法語は合ってるけど単語が足りない。正解文をよく見よう。' };
  }
  if (!grammarOk && rate >= 0.6) {
    return { grade:'△', xpRate:0.2, comment:'be動詞か助動詞が違う。am/is/are/was/wereをもう一度確認！' };
  }
  // ✗
  return { grade:'✗', xpRate:0, comment:'もう一度！正解文をよく見て覚えよう。' };
}

function checkWordOrder(vWords, aWords) {
  // 重要語（文法語）の順序が合ってるかチェック
  var keyWords = aWords.filter(function(w, i) { return i < 3; }); // 最初の3語
  var lastIdx = -1;
  for (var i = 0; i < keyWords.length; i++) {
    var idx = vWords.indexOf(keyWords[i]);
    if (idx === -1) return false;
    if (idx < lastIdx) return false;
    lastIdx = idx;
  }
  return true;
}

function showGradeResult(qid, meta, val, result) {
  var spinner = document.getElementById('gs_' + qid);
  var grDiv = document.getElementById('gr_' + qid);
  var input = document.getElementById('qi_' + qid);
  var card = document.querySelector('[data-card="' + qid + '"]');
  var sab = document.getElementById('sab_' + qid);

  if (spinner) spinner.style.display = 'none';

  var grade = result.grade || '✗';
  var xpRate = typeof result.xpRate === 'number' ? result.xpRate : 0;
  var comment = result.comment || '';

  var clsMap = { '◎':'grade-perfect', '○':'grade-good', '△':'grade-partial', '✗':'grade-wrong' };
  var iconMap = { '◎':'✅', '○':'🔵', '△':'🟡', '✗':'❌' };
  var cls = clsMap[grade] || 'grade-wrong';
  var icon = iconMap[grade] || '❌';

  var earnedXP = Math.round(meta.xp * xpRate);
  var xpNote = earnedXP > 0 ? '＋' + earnedXP + ' XP 獲得！' : 'XPなし';
  var artistComment = '';
  if (xpRate >= 1.0) {
    artistComment = getComment('nishimura_correct');
  } else if (xpRate >= 0.5) {
    artistComment = 'きょん「惜しい！あと少し！」';
  } else if (xpRate > 0) {
    artistComment = 'きょん「ちょっとだけわかってたよ！もう一回！」';
  } else {
    artistComment = getComment('kyon_wrong');
  }

  if (grDiv) {
    grDiv.className = 'grade-result ' + cls;
    // ◎以外は生徒の回答と正解文を並べて表示
    var correctAnsHtml = '';
    if (grade !== '◎') {
      correctAnsHtml = '<div style="margin-top:12px;border-radius:8px;overflow:hidden;">'
        + '<div style="padding:8px 12px;background:rgba(233,69,96,0.08);border-left:3px solid var(--red);">'
        + '<div style="font-size:11px;color:var(--text2);margin-bottom:3px">❌ あなたの回答</div>'
        + '<div style="font-family:Times New Roman,serif;font-size:16px;color:#f87171;">' + val + '</div>'
        + '</div>'
        + '<div style="padding:8px 12px;background:rgba(63,185,80,0.08);border-left:3px solid var(--green);margin-top:4px;">'
        + '<div style="font-size:11px;color:var(--text2);margin-bottom:3px">✅ 正しい答え</div>'
        + '<div style="font-family:Times New Roman,serif;font-size:16px;color:var(--gold);font-weight:bold;">' + meta.answer + '</div>'
        + '</div>'
        + '</div>';
    }
    grDiv.innerHTML = '<span class="grade-icon">' + icon + '</span><strong>' + grade + '</strong>　' + comment
      + correctAnsHtml
      + '<div class="grade-xp-note" style="margin-top:8px">' + xpNote + '</div>'
      + '<div class="artist-comment" style="display:block;margin-top:6px">' + artistComment + '</div>';
    grDiv.style.display = 'block';
  }

  // Cache result
  var cacheEntry = { icon:icon, cls:cls, comment:grade + '　' + comment, xpRate:xpRate, xpNote:xpNote };
  gradeCache[qid] = cacheEntry;
  localStorage.setItem('nh3_grades', JSON.stringify(gradeCache));

  // Save student's answer
  localStorage.setItem('nh3_ans_' + qid, val);

  // Mark answered & add XP
  if (xpRate > 0) {
    var lvUp = addXP(earnedXP, qid);
    if (lvUp) {
      setTimeout(function() {
        var lv = getLevel(xp);
        showToast('🎉 昇格！ ' + lv.badge + ' → ' + lv.title, 'levelup');
      }, 500);
    }
    if (card) card.classList.add('correct-card');
    if (input) input.classList.add('correct');
  } else {
    answeredSet[qid] = true;
    localStorage.setItem('nh3_answered', JSON.stringify(answeredSet));
    if (card) card.classList.add('wrong-card');
    if (input) input.classList.add('wrong');
    // Show "答えを見る" after wrong
    if (sab) sab.style.display = 'inline-block';
  }

  // ◎○△ all mark as done for section completion
  if (xpRate > 0) {
    answeredSet[qid] = true;
    localStorage.setItem('nh3_answered', JSON.stringify(answeredSet));
  }

  checkSectionComplete();
  if (xpRate >= 0.7) {
    setTimeout(function() { showToast(artistComment); }, 300);
  }
}

function normalize(s) {
  return (s || '').trim().toLowerCase().replace(/[.,!?'"]/g,'').replace(/\s+/g,' ');
}
// キーワードマッチ採点：答えの主要キーワードが全部含まれていれば正解
function flexMatch(val, answer) {
  var v = normalize(val);
  var a = normalize(answer);
  if (v === a) return true;
  // 答えの全単語がvalに含まれていればOK（順不同・余分な単語は許容）
  var aWords = a.split(' ').filter(function(w) { return w.length > 1; });
  var allIn = aWords.every(function(w) { return v.indexOf(w) !== -1; });
  return allIn;
}
function checkSectionComplete() {
  var allQ = Object.keys(qMeta);
  var sectionQ = allQ.filter(function(id) { return id.startsWith('s' + currentSection + '_'); });
  var done = sectionQ.every(function(id) { return answeredSet[id]; });
  if (done && sectionQ.length > 0) {
    sectionDone[currentSection] = true;
    localStorage.setItem('nh3_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb) nb.style.display = 'block';
  }
}

// ===== SECTIONS DATA =====
var currentSection = 0;
var SECTIONS = [
  { id: 0, label: 'Unit 0', title: '基礎総復習', sub: 'ニューホライズン3年を始める前に、中1・中2の重要文法を完全マスターしよう！' },
  { id: 1, label: 'be動詞', title: 'be動詞（現在形）', sub: 'am / is / are の使い分けをマスターしよう' },
  { id: 2, label: 'be過去', title: 'be動詞（過去形）', sub: 'was / were の使い分けと疑問文・否定文' },
  { id: 3, label: '一般動詞', title: '一般動詞（現在形）', sub: '三単現のs・疑問文・否定文' },
  { id: 4, label: '一般過去', title: '一般動詞（過去形）', sub: '規則動詞・不規則動詞・疑問文・否定文' },
  { id: 5, label: '確認テスト', title: 'Unit 0 確認テスト', sub: '全セクションの総まとめ！何点取れるかな？' },
  { id: 6, label: '📊弱点', title: '弱点ノート', sub: '間違えた問題の正答率を確認しよう' },
  { id: 7, label: '🔥特訓', title: '弱点特訓モード', sub: '間違えた問題だけを集中練習！正答率を上げよう' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab';
    if (s.id === 6 || s.id === 7) cls += ' tokku';
    if (s.id === currentSection) cls += ' active';
    if (sectionDone[s.id] && s.id < 6) cls += ' done';
    var label = s.label + (sectionDone[s.id] && s.id < 6 ? ' ✓' : '');
    // 特訓タブは弱点数を表示
    if (s.id === 7) {
      var wk = getWeakQuestions();
      label = '🔥特訓' + (wk.length > 0 ? '(' + wk.length + ')' : '');
    }
    html += '<button class="' + cls + '" onclick="goSection(' + s.id + ')">' + label + '</button>';
  });
  document.getElementById('sectionTabs').innerHTML = html;
}

function goSection(id) {
  currentSection = id;
  qMeta = {};
  renderTabs();
  renderSection(id);
  window.scrollTo(0, 0);
}

// ===== RENDER SECTIONS =====
function renderSection(id) {
  var s = SECTIONS[id];
  var html = '';
  // Progress dots
  html += '<div class="progress-dots">';
  SECTIONS.forEach(function(sec) {
    var cls = 'dot';
    if (sec.id < id) cls += ' done';
    if (sec.id === id) cls += ' current';
    html += '<div class="' + cls + '"></div>';
  });
  html += '</div>';
  // Header
  html += '<div class="section-header">'
    + '<div class="section-badge">UNIT 0 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';

  if (id === 0) html += renderSectionTop();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();
  else if (id === 5) html += renderFinalTest();
  else if (id === 6) { document.getElementById('mainContent').innerHTML = ''; renderWeakNote(); return; }
  else if (id === 7) { document.getElementById('mainContent').innerHTML = ''; renderTokkuMode(); return; }

  // Next button
  var nextLabel = id < 5 ? '次のセクションへ →' : '🏆 結果を見る！';
  html += '<button class="next-section-btn" id="nextBtn" onclick="' + (id < 5 ? 'goSection(' + (id+1) + ')' : 'showFinalResult()') + '">' + nextLabel + '</button>';

  document.getElementById('mainContent').innerHTML = html;

  // Attach events
  document.querySelectorAll('.check-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleCheck(btn.dataset.qid); });
  });
  document.querySelectorAll('.q-input[data-qid]').forEach(function(inp) {
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleCheck(inp.dataset.qid); });
  });
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { handleChoice(btn.dataset.qid, btn.dataset.choice); });
  });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn) {
    btn.addEventListener('click', function() { showAnswer(btn.dataset.qid); });
  });

  // Show next button if already complete
  if (sectionDone[id]) {
    var nb = document.getElementById('nextBtn');
    if (nb) nb.style.display = 'block';
  }
  checkSectionComplete();
}

// ===== SECTION 0: TOP =====
function renderSectionTop() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📺 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">ねえにっくん、中3の英語って難しいの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村（慶応卒・元アナ）</div><div class="chat-bubble">中3の文法は確かに増えるけど、実は中1・中2の基礎がちゃんとできてれば大丈夫なんだよ。be動詞・一般動詞・過去形——これが全部わかってれば3年の内容はすんなり入ってくる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">じゃあまず基礎からやる！でも教えてくれる？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">もちろん。一緒にやっていこう。まずbe動詞から始めるよ。</div></div></div>'
    + '</div>'
    + '<div style="text-align:center;margin:24px 0;">'
    + '<button onclick="goSection(1)" class="unit-test-btn">📖 基礎復習を始める →</button>'
    + '</div>';
}

// ===== SECTION 1: be動詞現在形 =====
function renderSection1() {
  var html = '';
  // Intro
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📺 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">be動詞ってam・is・areだっけ？なんで3種類もあるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">主語によって使い分けるんだよ。I の時は am、he/she/it の時は is、you/we/they の時は are。ルールさえわかれば簡単。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「I am funny.」（私は面白い）って言いたい時は am なの！なるほど！</div></div></div>'
    + '</div>';

  // Grammar explanation
  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">📐 be動詞の使い分け（現在形）</div>'
    + '<div class="formula-box">'
    + '<span class="highlight">I</span> → am　　'
    + '<span class="highlight">He / She / It</span> → is　　'
    + '<span class="highlight">You / We / They</span> → are'
    + '</div>'
    + '<ul class="example-list">';

  var ex1 = [
    ['I am a student.', '私は学生です。'],
    ['She is funny.', '彼女は面白い。'],
    ['He is from Osaka.', '彼は大阪出身です。'],
    ['We are good friends.', '私たちは良い友達です。'],
    ['They are comedians.', '彼らは芸人です。'],
    ['It is very interesting.', 'それはとても面白い。'],
  ];
  ex1.forEach(function(e, i) {
    var aid = 's1_ex_' + i;
    html += '<li class="example-item">' + audioBtn(aid, e[0])
      + '<span class="en">' + e[0] + '</span><span class="jp">' + e[1] + '</span></li>';
  });
  html += '</ul></div>';

  // Negative & Question
  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">❓ 疑問文と否定文</div>'
    + '<div class="formula-box">'
    + '疑問文: <span class="highlight">Be動詞</span> + 主語 ～ ?<br>'
    + '否定文: 主語 + <span class="highlight">be動詞 + not</span> ～'
    + '</div>'
    + '<ul class="example-list">';
  var ex2 = [
    ['Are you a student?', 'あなたは学生ですか？'],
    ['Yes, I am. / No, I am not (I\'m not).', 'はい。/ いいえ。'],
    ['Is she funny?', '彼女は面白いですか？'],
    ['Yes, she is. / No, she is not (she\'s not).', 'はい。/ いいえ。'],
    ['I am not from Tokyo.', '私は東京出身ではありません。'],
    ['He is not (isn\'t) a comedian.', '彼は芸人ではありません。'],
  ];
  ex2.forEach(function(e, i) {
    var aid = 's1_exb_' + i;
    html += '<li class="example-item">' + audioBtn(aid, e[0])
      + '<span class="en">' + e[0] + '</span><span class="jp">' + e[1] + '</span></li>';
  });
  html += '</ul></div>';

  // Practice
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — be動詞を選ぼう</div>';

  var qs1 = [
    { q: '___ you a student?', jp: 'あなたは学生ですか？', a: 'Are', choices: ['Am','Is','Are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>You → <strong>are</strong>（複数・二人称）<br>疑問文はbe動詞を文頭に移動する</span><span class="exp-ok">✅ Are you a student?</span><br><span class="exp-ng">❌ You are a student? （疑問文ではない）</span><span class="exp-tip">💡 主語が you/we/they → are</span>', xp: 3 },
    { q: 'I ___ from Aichi.', jp: '私は愛知出身です。', a: 'am', choices: ['am','is','are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>I → <strong>am</strong>（一人称単数・専用）</span><span class="exp-ok">✅ I am from Aichi.</span><br><span class="exp-ng">❌ I is / I are</span><span class="exp-tip">💡 I だけが am。他の主語には使えない</span>', xp: 3 },
    { q: 'She ___ very funny.', jp: '彼女はとても面白い。', a: 'is', choices: ['am','is','are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>He / She / It → <strong>is</strong>（三人称単数）</span><span class="exp-ok">✅ She is very funny.</span><br><span class="exp-ng">❌ She are / She am</span><span class="exp-tip">💡 三人称単数（一人の人・ひとつの物）→ is</span>', xp: 3 },
    { q: 'We ___ good friends.', jp: '私たちは良い友達です。', a: 'are', choices: ['am','is','are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>We → <strong>are</strong>（一人称複数）</span><span class="exp-ok">✅ We are good friends.</span><br><span class="exp-ng">❌ We is / We am</span><span class="exp-tip">💡 we / they / you（複数）→ are</span>', xp: 3 },
    { q: 'Reiwa Roman ___ a comedy duo.', jp: '令和ロマンはコンビです。', a: 'is', choices: ['am','is','are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>コンビ名・グループ名 → 単数扱い → <strong>is</strong></span><span class="exp-ok">✅ Reiwa Roman is a comedy duo.</span><br><span class="exp-ok">✅ Cotton is funny.</span><span class="exp-tip">💡 複数の人でもグループ全体を一つとして見ると is</span>', xp: 4 },
    { q: 'He ___ not from Tokyo.', jp: '彼は東京出身ではありません。', a: 'is', choices: ['am','is','are'], exp: '<span class="exp-rule"><span class="label">📐 否定文のルール</span>主語 + be動詞 + <strong>not</strong> + ...</span><span class="exp-ok">✅ He is not a comedian.</span><br><span class="exp-ok">✅ He isn&#39;t a comedian.（短縮形）</span><span class="exp-tip">💡 be動詞の直後にnotを置くだけ</span>', xp: 3 },
    { q: 'They ___ comedians.', jp: '彼らは芸人です。', a: 'are', choices: ['am','is','are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>They → <strong>are</strong>（三人称複数）</span><span class="exp-ok">✅ They are comedians.</span><span class="exp-tip">💡 複数の人・物を指す代名詞 → are</span>', xp: 3 },
    { q: '___ it interesting?', jp: 'それは面白いですか？', a: 'Is', choices: ['Am','Is','Are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>It → <strong>is</strong>（三人称単数）<br>疑問文 → Is を文頭に</span><span class="exp-ok">✅ Is it interesting?</span><br><span class="exp-ng">❌ It is interesting?（疑問文の形ではない）</span><span class="exp-tip">💡 Is it ...? の語順を覚えよう</span>', xp: 3 },
    { q: 'Kemuri and Kuruma ___ a great team.', jp: 'ケムリとくるまは素晴らしいチームです。', a: 'are', choices: ['am','is','are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>A and B（２人・複数）→ <strong>are</strong></span><span class="exp-ok">✅ Kemuri and Kuruma are a great team.</span><span class="exp-tip">💡 and でつないだ主語は複数扱い → are</span>', xp: 4 },
    { q: 'I ___ not good at English yet.', jp: '私はまだ英語が得意ではありません。', a: 'am', choices: ['am','is','are'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>I → <strong>am</strong>　否定 → am not（= I&#39;m not）</span><span class="exp-ok">✅ I am not good at English yet.</span><br><span class="exp-ng">❌ I isn&#39;t / I aren&#39;t</span><span class="exp-tip">💡 I am not の短縮形は I&#39;m not（I amn&#39;t とは言わない）</span>', xp: 4 },
  ];
  qs1.forEach(function(q, i) {
    var qid = 's1_q' + i;
    qMeta[qid] = { type:'choice', answer: q.a, xp: q.xp };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + '</div>'
      + '<div class="q-text">' + q.q.replace('___', '<span class="blank">___</span>') + '</div>'
      + '<div class="q-jp">' + q.jp + '</div>'
      + makeChoices(qid, q.choices, q.a, q.xp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });

  // Input practice
  html += '<div class="practice-title" style="margin-top:20px">✏️ 練習問題 — 英文を作ろう</div>';
  var qs1b = [
    { jp: '彼は芸人ではありません。', a: 'He is not a comedian.', exp: '<span class="exp-rule"><span class="label">📐 否定文</span>主語 + be動詞 + not + 残り</span><span class="exp-ok">✅ He is not a comedian.</span><br><span class="exp-ok">✅ He isn&#39;t a comedian.（短縮形）</span><span class="exp-tip">💡 He → is。否定は is not</span>', xp: 5 },
    { jp: 'あなたたちは良い友達ですか？', a: 'Are you good friends?', exp: '<span class="exp-rule"><span class="label">📐 疑問文</span>Be動詞 + 主語 + ...?</span><span class="exp-ok">✅ Are you good friends?</span><br><span class="exp-tip">💡 you/we/they の疑問文 → Are で始める</span>', xp: 5 },
    { jp: 'コットンは面白いコンビです。', a: 'Cotton is a funny duo.', exp: '<span class="exp-rule"><span class="label">📐 ルール</span>コンビ名 → 単数扱い → <strong>is</strong></span><span class="exp-ok">✅ Cotton is a funny duo.</span><span class="exp-tip">💡 グループ名は単数扱い。is を使う</span>', xp: 5 },
    { jp: '私は愛知県出身です。', a: 'I am from Aichi.', exp: '<span class="exp-rule"><span class="label">📐 ルール</span>I → am　出身地 → from + 場所</span><span class="exp-ok">✅ I am from Aichi.</span><span class="exp-tip">💡 「〜出身です」は be from 〜 で表す</span>', xp: 5 },
    { jp: '彼らはとても有名ですか？', a: 'Are they very famous?', exp: '<span class="exp-rule"><span class="label">📐 疑問文</span>They → are　疑問文 → Are + they ...?</span><span class="exp-ok">✅ Are they very famous?</span><span class="exp-tip">💡 they の疑問文は Are they ...? の語順</span>', xp: 5 },
    { jp: '彼女は学生ではありません。', a: 'She is not a student.', exp: '<span class="exp-rule"><span class="label">📐 否定文</span>She → is　否定 → is not</span><span class="exp-ok">✅ She is not a student.</span><br><span class="exp-ok">✅ She isn&#39;t a student.</span><span class="exp-tip">💡 She → is not（isn&#39;t）</span>', xp: 5 },
  ];
  qs1b.forEach(function(q, i) {
    var qid = 's1_qb' + i;
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (qs1.length+i+1) + '</div>'
      + '<div class="q-jp">🇯🇵 ' + q.jp + '</div>'
      + makeCompositionInput(qid, q.a, q.xp, q.jp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 2: be動詞過去形 =====
function renderSection2() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📺 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">be動詞って過去になるとどう変わるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">am と is は was に、are は were になるよ。「昨日は〜だった」って言いたい時に使う。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「I was happy.」（私は嬉しかった）！was だ！</div></div></div>'
    + '</div>';

  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">📐 be動詞の過去形</div>'
    + '<div class="formula-box">'
    + '<span class="highlight">am / is</span> <span class="arrow">→</span> <span class="highlight">was</span>　　'
    + '<span class="highlight">are</span> <span class="arrow">→</span> <span class="highlight">were</span>'
    + '</div>'
    + '<ul class="example-list">';
  var ex3 = [
    ['I was happy yesterday.', '私は昨日嬉しかった。'],
    ['She was a student last year.', '彼女は去年学生だった。'],
    ['We were very tired.', '私たちはとても疲れていた。'],
    ['They were funny on stage.', '彼らはステージで面白かった。'],
    ['Was he at school?', '彼は学校にいましたか？'],
    ['He was not (wasn\'t) at home.', '彼は家にいなかった。'],
    ['Were you busy yesterday?', '昨日忙しかったですか？'],
    ['Yes, I was. / No, I wasn\'t.', 'はい。/ いいえ。'],
  ];
  ex3.forEach(function(e, i) {
    var aid = 's2_ex_' + i;
    html += '<li class="example-item">' + audioBtn(aid, e[0])
      + '<span class="en">' + e[0] + '</span><span class="jp">' + e[1] + '</span></li>';
  });
  html += '</ul></div>';

  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">💡 ポイント：よく出る過去の時間表現</div>'
    + '<div class="grammar-rule">'
    + '<div class="en">yesterday / last week / last year / two days ago / in 2020</div>'
    + '<div class="jp">昨日 / 先週 / 去年 / 2日前 / 2020年に</div>'
    + '<div class="point">これらの言葉が文にあったら → 過去形を使う！</div>'
    + '</div></div>';

  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
  var qs2 = [
    { q: 'I ___ very tired yesterday.', jp: '私は昨日とても疲れていた。', a: 'was', choices: ['am','was','were'], exp: '<span class="exp-rule"><span class="label">📐 過去形のルール</span>I → am → <strong>was</strong>（過去）<br>yesterday / last〜 / ago → 過去形のサイン！</span><span class="exp-ok">✅ I was very tired yesterday.</span><span class="exp-tip">💡 I/He/She/It → was　We/You/They → were</span>', xp: 3 },
    { q: 'They ___ funny on stage last night.', jp: '彼らは昨夜ステージで面白かった。', a: 'were', choices: ['are','was','were'], exp: '<span class="exp-rule"><span class="label">📐 過去形のルール</span>They → are → <strong>were</strong>（過去）</span><span class="exp-ok">✅ They were funny on stage last night.</span><span class="exp-tip">💡 複数（They/We/You）の過去 → were</span>', xp: 3 },
    { q: '___ she a student last year?', jp: '彼女は去年学生でしたか？', a: 'Was', choices: ['Is','Was','Were'], exp: '<span class="exp-rule"><span class="label">📐 過去疑問文</span>Was/Were を文頭に移動するだけ</span><span class="exp-ok">✅ Was she a student last year?</span><br><span class="exp-ok">✅ Yes, she was. / No, she wasn&#39;t.</span><span class="exp-tip">💡 She の過去疑問文 → Was she ...?</span>', xp: 4 },
    { q: 'We ___ not at home yesterday.', jp: '私たちは昨日家にいなかった。', a: 'were', choices: ['am','was','were'], exp: '<span class="exp-rule"><span class="label">📐 過去否定文</span>We → were → <strong>were not（weren&#39;t）</strong></span><span class="exp-ok">✅ We were not at home yesterday.</span><span class="exp-tip">💡 複数の過去否定 → were not</span>', xp: 4 },
    { q: 'Kamaitachi ___ very popular two years ago.', jp: 'かまいたちは2年前とても人気があった。', a: 'was', choices: ['is','was','were'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>グループ名 → 単数扱い → <strong>was</strong>（過去）<br>two years ago → 過去のサイン</span><span class="exp-ok">✅ Kamaitachi was very popular two years ago.</span><span class="exp-tip">💡 「〜前に」は ～ ago（必ず過去形）</span>', xp: 5 },
    { q: 'He ___ at school last Monday.', jp: '彼は先週月曜日学校にいた。', a: 'was', choices: ['is','was','were'], exp: '<span class="exp-rule"><span class="label">📐 ルール</span>He → was（過去）<br>last Monday = 先週月曜日 → 過去のサイン</span><span class="exp-ok">✅ He was at school last Monday.</span><span class="exp-tip">💡 last + 曜日/週/年/月 → 必ず過去形</span>', xp: 3 },
    { q: '___ you happy then?', jp: 'その時あなたは嬉しかったですか？', a: 'Were', choices: ['Was','Were','Are'], exp: '<span class="exp-rule"><span class="label">📐 過去疑問文</span>You → were → <strong>Were you ...?</strong></span><span class="exp-ok">✅ Were you happy then?</span><br><span class="exp-ok">✅ Yes, I was. / No, I wasn&#39;t.</span><span class="exp-tip">💡 then（その時）も過去のサイン</span>', xp: 4 },
    { q: 'It ___ not cold last week.', jp: '先週は寒くなかった。', a: 'was', choices: ['is','was','were'], exp: '<span class="exp-rule"><span class="label">📐 過去否定</span>It → was → <strong>was not（wasn&#39;t）</strong></span><span class="exp-ok">✅ It was not cold last week.</span><span class="exp-tip">💡 It の過去否定 → was not / wasn&#39;t</span>', xp: 4 },
    { q: 'Cotton ___ not famous five years ago.', jp: 'コットンは5年前有名ではなかった。', a: 'was', choices: ['is','was','were'], exp: '<span class="exp-rule"><span class="label">📐 過去否定</span>Cotton（単数）→ was not（過去否定）</span><span class="exp-ok">✅ Cotton was not famous five years ago.</span><span class="exp-tip">💡 グループ名も単数扱い → was not</span>', xp: 5 },
    { q: '___ they at the live show yesterday?', jp: '彼らは昨日ライブに来ていましたか？', a: 'Were', choices: ['Was','Were','Did'], exp: '<span class="exp-rule"><span class="label">📐 重要ポイント</span>be動詞の疑問文 → <strong>Was/Were</strong>（Didは使わない！）</span><span class="exp-ok">✅ Were they at the live show yesterday?</span><br><span class="exp-ng">❌ Did they be at the live show?（×）</span><span class="exp-tip">💡 be動詞とDo/Doesは混ぜない！</span>', xp: 5 },
  ];
  qs2.forEach(function(q, i) {
    var qid = 's2_q' + i;
    qMeta[qid] = { type:'choice', answer: q.a, xp: q.xp };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + '</div>'
      + '<div class="q-text">' + q.q.replace('___', '<span class="blank">___</span>') + '</div>'
      + '<div class="q-jp">' + q.jp + '</div>'
      + makeChoices(qid, q.choices, q.a, q.xp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });
  var qs2b = [
    { jp: '彼は昨日学校にいませんでした。', a: 'He was not at school yesterday.', exp: '<span class="exp-rule"><span class="label">📐 過去否定文の語順</span>主語 + was/were + not + 残り + 時の表現</span><span class="exp-ok">✅ He was not at school yesterday.</span><span class="exp-tip">💡 He の過去否定 → was not</span>', xp: 5 },
    { jp: '昨日忙しかったですか？', a: 'Were you busy yesterday?', exp: '<span class="exp-rule"><span class="label">📐 過去疑問文</span>Were + you + 形容詞/場所 + 時の表現 ?</span><span class="exp-ok">✅ Were you busy yesterday?</span><span class="exp-tip">💡 答えは Yes, I was. / No, I wasn&#39;t.</span>', xp: 5 },
    { jp: '私たちは去年同じクラスでした。', a: 'We were in the same class last year.', exp: '<span class="exp-rule"><span class="label">📐 ルール</span>We → were（過去）　in the same class = 同じクラスに（所属）</span><span class="exp-ok">✅ We were in the same class last year.</span><span class="exp-tip">💡 「in the same ＋ 人が継続的に所属するカテゴリ名詞」<br>✅ class / club / group / team<br>❌ rain / Takashimaya（所属できない）</span>', xp: 5 },
    { jp: '彼女は昨日家にいましたか？', a: 'Was she at home yesterday?', exp: '<span class="exp-rule"><span class="label">📐 過去疑問文</span>Was + she + 場所/形容詞 + 時の表現 ?</span><span class="exp-ok">✅ Was she at home yesterday?</span><span class="exp-tip">💡 She の過去疑問文 → Was she ...?</span>', xp: 5 },
  ];
  qs2b.forEach(function(q, i) {
    var qid = 's2_qb' + i;
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (qs2.length+i+1) + '</div>'
      + '<div class="q-jp">🇯🇵 ' + q.jp + '</div>'
      + makeCompositionInput(qid, q.a, q.xp, q.jp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 3: 一般動詞現在形 =====
function renderSection3() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📺 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">一般動詞って何？be動詞と何が違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">be動詞は「〜です・〜にいる」。一般動詞は「食べる・走る・好き」みたいな動作や状態を表す動詞全部だよ。注意点は主語が3人称単数（he/she/it）の時、動詞にsをつけること。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「三単現のs」ってやつ！Heがsubjectの時はlikesになるやつ！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">正確。覚えてたんだね。</div></div></div>'
    + '</div>';

  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">📐 一般動詞の三単現（3rd person singular present）</div>'
    + '<div class="formula-box">'
    + '主語が <span class="highlight">He / She / It</span> のとき → 動詞に <span class="highlight">s / es</span> をつける！<br>'
    + '<small style="color:var(--text2)">I / You / We / They の時はそのまま</small>'
    + '</div>'
    + '<div class="grammar-rule">'
    + '<div class="rule-title">sのつけ方ルール</div>'
    + '<div class="en">普通：play → plays, like → likes</div>'
    + '<div class="en">-s/-sh/-ch/-x/-o 終わり：watch → watches, go → goes</div>'
    + '<div class="en">子音+y 終わり：study → studies（yをiに変えてes）</div>'
    + '<div class="en">不規則：have → has</div>'
    + '</div>'
    + '<ul class="example-list">';
  var ex4 = [
    ['I like comedy.', '私はお笑いが好きです。'],
    ['She likes comedy too.', '彼女もお笑いが好きです。'],
    ['He watches many videos every day.', '彼は毎日たくさんの動画を見る。'],
    ['Kuruma always speaks calmly.','くるまはいつも落ち着いて話す。'],
    ['They study English hard.', '彼らは一生懸命英語を勉強する。'],
    ['She studies English hard.', '彼女は一生懸命英語を勉強する。'],
  ];
  ex4.forEach(function(e, i) {
    var aid = 's3_ex_' + i;
    html += '<li class="example-item">' + audioBtn(aid, e[0])
      + '<span class="en">' + e[0] + '</span><span class="jp">' + e[1] + '</span></li>';
  });
  html += '</ul></div>';

  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">❓ 疑問文・否定文（一般動詞現在）</div>'
    + '<div class="formula-box">'
    + '疑問文: <span class="highlight">Do / Does</span> + 主語 + 動詞の原形 ～ ?<br>'
    + '否定文: 主語 + <span class="highlight">do not / does not</span> + 動詞の原形 ～<br>'
    + '<small style="color:var(--text2)">He/She/It → Does / doesn\'t　　それ以外 → Do / don\'t</small>'
    + '</div>'
    + '<ul class="example-list">';
  var ex5 = [
    ['Do you like manzai?', '漫才が好きですか？'],
    ['Yes, I do. / No, I don\'t.', 'はい。/ いいえ。'],
    ['Does she watch comedy videos?', '彼女はお笑い動画を見ますか？'],
    ['Yes, she does. / No, she doesn\'t.', 'はい。/ いいえ。'],
    ['I don\'t understand advanced comedy.', '私は高度なお笑いが理解できない。'],
    ['He doesn\'t speak Kansai dialect.', '彼は関西弁を話さない。'],
  ];
  ex5.forEach(function(e, i) {
    var aid = 's3_exb_' + i;
    html += '<li class="example-item">' + audioBtn(aid, e[0])
      + '<span class="en">' + e[0] + '</span><span class="jp">' + e[1] + '</span></li>';
  });
  html += '</ul></div>';

  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
  var qs3 = [
    { q: 'She ___ comedy every night.', jp: '彼女は毎晩お笑いを見る。', a: 'watches', choices: ['watch','watches','watching'], exp: '<span class="exp-rule"><span class="label">📐 三単現のsルール</span>-ch/-sh/-s/-x/-o で終わる → <strong>es</strong></span><span class="exp-ok">✅ She watches</span><br><span class="exp-ng">❌ She watchs（×）</span><span class="exp-tip">💡 watch→watches、go→goes、do→does</span>', xp: 4 },
    { q: '___ he like Reiwa Roman?', jp: '彼は令和ロマンが好きですか？', a: 'Does', choices: ['Do','Does','Is'], exp: '<span class="exp-rule"><span class="label">📐 三単現の疑問文</span><strong>Does</strong> + He/She/It + 動詞の<strong>原形</strong> ...?</span><span class="exp-ok">✅ Does he like Reiwa Roman?</span><br><span class="exp-ng">❌ Does he likes ...（×）</span><span class="exp-tip">💡 Does を使ったら動詞はsなし（原形）</span>', xp: 4 },
    { q: 'I ___ have a pencil.', jp: '私は鉛筆を持っていない。', a: "don't", choices: ["don't","doesn't","isn't"], exp: 'I の否定文 → don\'t（do not）。', xp: 4 },
    { q: 'Kemuri ___ (have) a calm voice.', jp: 'ケムリは落ち着いた声を持っている。', a: 'has', choices: ['have','has','haves'], exp: '<span class="exp-rule"><span class="label">📐 have の三単現は特別！</span>He/She/It + have → <strong>has</strong></span><span class="exp-ok">✅ Kemuri has a calm voice.</span><br><span class="exp-ng">❌ Kemuri haves（×）</span><span class="exp-tip">💡 have の三単現は has 一択！</span>', xp: 5 },
    { q: 'She ___ (study) very hard.', jp: '彼女はとても一生懸命勉強する。', a: 'studies', choices: ['studys','studies','study'], exp: '<span class="exp-rule"><span class="label">📐 子音+y → ies</span>study → <strong>studies</strong></span><span class="exp-ok">✅ She studies very hard.</span><br><span class="exp-ng">❌ studys（×）</span><span class="exp-tip">💡 study/try/carry/worry → ies</span>', xp: 5 },
    { q: 'He ___ (go) to school by bike.', jp: '彼は自転車で学校に行く。', a: 'goes', choices: ['go','goes','gos'], exp: '<span class="exp-rule"><span class="label">📐 三単現：-oで終わる</span>go → <strong>goes</strong></span><span class="exp-ok">✅ He goes to school by bike.</span><br><span class="exp-ng">❌ He gos（×）</span><span class="exp-tip">💡 go→goes、do→does</span>', xp: 4 },
    { q: 'They ___ English every day.', jp: '彼らは毎日英語を勉強する。', a: 'study', choices: ['study','studies','studys'], exp: '<span class="exp-rule"><span class="label">📐 ポイント</span>They → 三単現でない → 動詞はそのまま</span><span class="exp-ok">✅ They study English every day.</span><br><span class="exp-ng">❌ They studies（×）</span><span class="exp-tip">💡 sがつくのは He/She/It だけ！</span>', xp: 4 },
    { q: 'She ___ (not, like) math.', jp: '彼女は数学が好きではない。', a: "doesn't like", choices: ["don't like","doesn't like","isn't like"], exp: 'She（三単現）の否定 → doesn\'t + 原形（like）。', xp: 5 },
    { q: '___ your teacher speak English well?', jp: 'あなたの先生は英語を上手に話しますか？', a: 'Does', choices: ['Do','Does','Is'], exp: '<span class="exp-rule"><span class="label">📐 三単現の疑問文</span>Does + 三単現の主語 + 動詞の原形 ...?</span><span class="exp-ok">✅ Does your teacher speak English well?</span><span class="exp-tip">💡 your teacher → 一人の人 → Does</span>', xp: 4 },
    { q: 'Kyon ___ (try) very hard every day.', jp: 'きょんは毎日一生懸命頑張る。', a: 'tries', choices: ['trys','tries','try'], exp: '<span class="exp-rule"><span class="label">📐 三単現：子音+y → ies</span>try → <strong>tries</strong></span><span class="exp-ok">✅ Kyon tries very hard every day.</span><br><span class="exp-ng">❌ Kyon trys（×）</span><span class="exp-tip">💡 try/study/carry/worry → ies</span>', xp: 5 },
  ];
  qs3.forEach(function(q, i) {
    var qid = 's3_q' + i;
    qMeta[qid] = { type:'choice', answer: q.a, xp: q.xp };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + '</div>'
      + '<div class="q-text">' + q.q.replace('___', '<span class="blank">___</span>') + '</div>'
      + '<div class="q-jp">' + q.jp + '</div>'
      + makeChoices(qid, q.choices, q.a, q.xp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });
  var qs3b = [
    { jp: '彼は関西弁を話しますか？', a: 'Does he speak Kansai dialect?', exp: '<span class="exp-rule"><span class="label">📐 三単現の疑問文</span>Does + he + 動詞の原形 ...?</span><span class="exp-ok">✅ Does he speak Kansai dialect?</span><span class="exp-tip">💡 答え：Yes, he does. / No, he doesn&#39;t.</span>', xp: 5 },
    { jp: '私は毎日英語を勉強しない。', a: "I don't study English every day.", exp: 'I の否定 → don\'t + 原形。', xp: 5 },
    { jp: '彼女は毎朝早く起きます。', a: 'She gets up early every morning.', exp: '<span class="exp-rule"><span class="label">📐 三単現のs</span>get → <strong>gets</strong></span><span class="exp-ok">✅ She gets up early every morning.</span><span class="exp-tip">💡 get up（起きる）の三単現 → gets up</span>', xp: 5 },
    { jp: 'きょんはよく動画を見ますか？', a: 'Does Kyon often watch videos?', exp: '<span class="exp-rule"><span class="label">📐 三単現の疑問文</span>Does + Kyon + 動詞の原形 ...?</span><span class="exp-ok">✅ Does Kyon often watch videos?</span><span class="exp-tip">💡 often の位置：does の後・動詞の前</span>', xp: 5 },
  ];
  qs3b.forEach(function(q, i) {
    var qid = 's3_qb' + i;
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (qs3.length+i+1) + '</div>'
      + '<div class="q-jp">🇯🇵 ' + q.jp + '</div>'
      + makeCompositionInput(qid, q.a, q.xp, q.jp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 4: 一般動詞過去形 =====
function renderSection4() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📺 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">一般動詞の過去形って全部edつければいいの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">規則動詞はedをつければいいんだけど、不規則動詞は形が全部変わるから覚えるしかないんだよ。go→went、see→saw、come→came とかね。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">えー、全部覚えなきゃいけないの！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">よく使う不規則動詞は30個くらい。繰り返せば自然に覚えられるよ。</div></div></div>'
    + '</div>';

  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">📐 規則動詞の過去形（edをつける）</div>'
    + '<div class="grammar-rule">'
    + '<div class="rule-title">edのつけ方</div>'
    + '<div class="en">普通: play → played, watch → watched</div>'
    + '<div class="en">eで終わる: like → liked, use → used</div>'
    + '<div class="en">子音+y: study → studied（yをiに変えてed）</div>'
    + '<div class="en">短母音+子音: stop → stopped（子音を重ねてed）</div>'
    + '</div>'
    + '<ul class="example-list">';
  var ex6 = [
    ['I watched a comedy show last night.', '昨夜お笑い番組を見た。'],
    ['She liked the performance very much.', '彼女はその公演がとても好きだった。'],
    ['We studied English yesterday.', '私たちは昨日英語を勉強した。'],
    ['He stopped talking suddenly.', '彼は突然話すのを止めた。'],
  ];
  ex6.forEach(function(e, i) {
    var aid = 's4_ex_' + i;
    html += '<li class="example-item">' + audioBtn(aid, e[0])
      + '<span class="en">' + e[0] + '</span><span class="jp">' + e[1] + '</span></li>';
  });
  html += '</ul></div>';

  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">⚡ よく出る不規則動詞（絶対覚えよう！）</div>'
    + '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px;">'
    + '<tr style="background:var(--bg3);color:var(--gold)"><td style="padding:8px 12px">原形</td><td style="padding:8px 12px">過去形</td><td style="padding:8px 12px">意味</td><td style="padding:8px 12px">音声</td></tr>';
  var irregulars = [
    ['go','went','行く'], ['come','came','来る'], ['see','saw','見る'],
    ['do','did','する'], ['have','had','持つ'], ['say','said','言う'],
    ['get','got','得る'], ['make','made','作る'], ['know','knew','知る'],
    ['think','thought','思う'], ['take','took','取る'], ['give','gave','与える'],
    ['buy','bought','買う'], ['eat','ate','食べる'], ['write','wrote','書く'],
    ['read','read','読む（発音変わる）'], ['speak','spoke','話す'], ['run','ran','走る'],
  ];
  irregulars.forEach(function(v, i) {
    var aid = 's4_irr_' + i;
    audioStore['s4_irr_' + i] = v[0] + '... ' + v[1];
    html += '<tr style="border-bottom:1px solid var(--border)">'
      + '<td style="padding:8px 12px;font-family:Times New Roman;font-size:16px">' + v[0] + '</td>'
      + '<td style="padding:8px 12px;font-family:Times New Roman;font-size:16px;color:var(--gold)">' + v[1] + '</td>'
      + '<td style="padding:8px 12px;color:var(--text2)">' + v[2] + '</td>'
      + '<td style="padding:8px 12px"><button class="audio-btn" id="ab_s4_irr_' + i + '" onclick="playAudio(\'s4_irr_' + i + '\')" title="音声">🔊</button></td>'
      + '</tr>';
  });
  html += '</table></div></div>';

  html += '<div class="grammar-card">'
    + '<div class="grammar-card-title">❓ 過去形の疑問文・否定文</div>'
    + '<div class="formula-box">'
    + '疑問文: <span class="highlight">Did</span> + 主語 + 動詞の<span class="highlight">原形</span> ～ ?<br>'
    + '否定文: 主語 + <span class="highlight">did not (didn\'t)</span> + 動詞の<span class="highlight">原形</span> ～<br>'
    + '<small style="color:var(--text2)">過去の疑問・否定では動詞は必ず原形！Didがすでに過去を表している</small>'
    + '</div>'
    + '<ul class="example-list">';
  var ex7 = [
    ['Did you watch the show?', 'ショーを見ましたか？'],
    ['Yes, I did. / No, I didn\'t.', 'はい。/ いいえ。'],
    ['I didn\'t study yesterday.', '私は昨日勉強しなかった。'],
    ['She didn\'t go to school last week.', '彼女は先週学校に行かなかった。'],
  ];
  ex7.forEach(function(e, i) {
    var aid = 's4_exb_' + i;
    html += '<li class="example-item">' + audioBtn(aid, e[0])
      + '<span class="en">' + e[0] + '</span><span class="jp">' + e[1] + '</span></li>';
  });
  html += '</ul></div>';

  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
  var qs4 = [
    { q: 'I ___ (go) to Osaka last week.', jp: '私は先週大阪に行った。', a: 'went', choices: ['goed','went','go'], exp: '<span class="exp-rule"><span class="label">📐 不規則動詞</span>go → <strong>went</strong></span><span class="exp-ok">✅ I went to Osaka last week.</span><br><span class="exp-ng">❌ I goed（×）</span><span class="exp-tip">💡 go-went は超頻出！絶対覚えよう</span>', xp: 4 },
    { q: 'She ___ (study) English hard yesterday.', jp: '彼女は昨日一生懸命英語を勉強した。', a: 'studied', choices: ['studyed','studied','studded'], exp: '<span class="exp-rule"><span class="label">📐 規則動詞：子音+y → ied</span>study → <strong>studied</strong></span><span class="exp-ok">✅ She studied English hard yesterday.</span><br><span class="exp-ng">❌ studyed（×）</span><span class="exp-tip">💡 子音+y → y をiに変えてed</span>', xp: 4 },
    { q: '___ you see the show last night?', jp: '昨夜ショーを見ましたか？', a: 'Did', choices: ['Do','Does','Did'], exp: '<span class="exp-rule"><span class="label">📐 一般動詞の過去疑問文</span><strong>Did</strong> + 主語 + 動詞の<strong>原形</strong> ...?</span><span class="exp-ok">✅ Did you see the show last night?</span><br><span class="exp-ng">❌ Did you saw（×）</span><span class="exp-tip">💡 Did の後は必ず原形！</span>', xp: 4 },
    { q: 'He ___ (not, come) to school yesterday.', jp: '彼は昨日学校に来なかった。', a: "didn't come", choices: ["didn't come","don't come","wasn't come"], exp: '過去の否定 → didn\'t + 原形（come）。', xp: 5 },
    { q: 'Cotton ___ (make) everyone laugh.', jp: 'コットンは皆を笑わせた。', a: 'made', choices: ['maked','made','making'], exp: '<span class="exp-rule"><span class="label">📐 不規則動詞</span>make → <strong>made</strong></span><span class="exp-ok">✅ Cotton made everyone laugh.</span><br><span class="exp-ng">❌ Cotton maked（×）</span><span class="exp-tip">💡 make-made は頻出不規則動詞</span>', xp: 5 },
    { q: 'She ___ (buy) a ticket last week.', jp: '彼女は先週チケットを買った。', a: 'bought', choices: ['buyed','bought','buys'], exp: '<span class="exp-rule"><span class="label">📐 不規則動詞</span>buy → <strong>bought</strong></span><span class="exp-ok">✅ She bought a ticket last week.</span><br><span class="exp-ng">❌ She buyed（×）</span><span class="exp-tip">💡 buy-bought。bring-brought も同じ形！</span>', xp: 4 },
    { q: 'I ___ (not, know) the answer.', jp: '私は答えを知らなかった。', a: "didn't know", choices: ["didn't know","don't know","wasn't know"], exp: '過去否定 → didn\'t + 原形（know）。', xp: 5 },
    { q: 'He ___ (speak) too fast.', jp: '彼は話すのが速すぎた。', a: 'spoke', choices: ['speaked','spoke','spoken'], exp: '<span class="exp-rule"><span class="label">📐 不規則動詞</span>speak → <strong>spoke</strong></span><span class="exp-ok">✅ He spoke too fast.</span><br><span class="exp-ng">❌ He speaked（×）</span><span class="exp-tip">💡 speak-spoke-spoken（原形-過去-過去分詞）</span>', xp: 5 },
    { q: '___ she write the answer?', jp: '彼女は答えを書きましたか？', a: 'Did', choices: ['Does','Did','Was'], exp: '<span class="exp-rule"><span class="label">📐 過去疑問文</span>Did + 主語 + 動詞の原形 ...?</span><span class="exp-ok">✅ Did she write the answer?</span><br><span class="exp-ng">❌ Did she wrote（×）</span><span class="exp-tip">💡 write の過去は wrote だが Did の後は原形 write</span>', xp: 4 },
    { q: 'They ___ (eat) takoyaki after the show.', jp: '彼らはショーの後でたこ焼きを食べた。', a: 'ate', choices: ['eated','ate','eaten'], exp: '<span class="exp-rule"><span class="label">📐 不規則動詞</span>eat → <strong>ate</strong></span><span class="exp-ok">✅ They ate takoyaki after the show.</span><br><span class="exp-ng">❌ They eated（×）</span><span class="exp-tip">💡 eat-ate-eaten（原形-過去-過去分詞）</span>', xp: 5 },
  ];
  qs4.forEach(function(q, i) {
    var qid = 's4_q' + i;
    qMeta[qid] = { type:'choice', answer: q.a, xp: q.xp };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + '</div>'
      + '<div class="q-text">' + q.q.replace('___', '<span class="blank">___</span>') + '</div>'
      + '<div class="q-jp">' + q.jp + '</div>'
      + makeChoices(qid, q.choices, q.a, q.xp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });
  var qs4b = [
    { jp: '彼は昨日英語を勉強しましたか？', a: 'Did he study English yesterday?', exp: '<span class="exp-rule"><span class="label">📐 過去疑問文</span>Did + he + 動詞の原形 ...?</span><span class="exp-ok">✅ Did he study English yesterday?</span><span class="exp-tip">💡 答え：Yes, he did. / No, he didn&#39;t.</span>', xp: 5 },
    { jp: '私は昨夜お笑いを見なかった。', a: "I didn't watch comedy last night.", exp: '過去否定 → didn\'t + 原形（watch）。', xp: 5 },
    { jp: '彼女は昨日何を食べましたか？', a: 'What did she eat yesterday?', exp: '<span class="exp-rule"><span class="label">📐 疑問詞のある過去疑問文</span>What + did + 主語 + 動詞の原形 ...?</span><span class="exp-ok">✅ What did she eat yesterday?</span><span class="exp-tip">💡 疑問詞→文頭、その後は did + 主語 + 原形</span>', xp: 6 },
    { jp: '私たちは先週その映画を見た。', a: 'We saw the movie last week.', exp: '<span class="exp-rule"><span class="label">📐 不規則動詞</span>see → <strong>saw</strong></span><span class="exp-ok">✅ We saw the movie last week.</span><br><span class="exp-ng">❌ We seed（×）</span><span class="exp-tip">💡 see-saw-seen（原形-過去-過去分詞）</span>', xp: 5 },
  ];
  qs4b.forEach(function(q, i) {
    var qid = 's4_qb' + i;
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (qs4.length+i+1) + '</div>'
      + '<div class="q-jp">🇯🇵 ' + q.jp + '</div>'
      + makeCompositionInput(qid, q.a, q.xp, q.jp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 5: 確認テスト =====
function renderFinalTest() {
  var html = '<div class="intro-box">'
    + '<div class="intro-box-title">📺 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">ついにテストか！全部やってきたし大丈夫なはず！たぶん！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">全部の文法が混ざって出てくるよ。be動詞か一般動詞か、現在か過去か、よく考えて。</div></div></div>'
    + '</div>';

  html += '<div class="practice-section"><div class="practice-title">📝 総合確認テスト（全20問）</div>';
  var testQs = [
    // be動詞現在
    { q: 'I ___ from Aichi prefecture.', jp: '私は愛知県出身です。', a: 'am', choices: ['am','is','are'], exp: 'I → am（現在）', xp: 2 },
    { q: 'Shimofuriboshi ___ a popular comedy duo.', jp: '霜降り明星は人気のコンビです。', a: 'is', choices: ['am','is','are'], exp: '三人称単数 → is', xp: 2 },
    { q: '___ they good comedians?', jp: '彼らは良い芸人ですか？', a: 'Are', choices: ['Am','Is','Are'], exp: 'They の疑問文 → Are', xp: 2 },
    { q: 'She ___ not funny at all.', jp: '彼女は全然面白くない。', a: 'is', choices: ['am','is','are'], exp: 'She → is（現在否定）', xp: 2 },
    // be動詞過去
    { q: 'I ___ very happy yesterday.', jp: '私は昨日とても嬉しかった。', a: 'was', choices: ['am','was','were'], exp: 'I の過去形 → was', xp: 2 },
    { q: 'They ___ at the show last night.', jp: '彼らは昨夜ショーにいた。', a: 'were', choices: ['was','were','are'], exp: 'They の過去形 → were', xp: 2 },
    { q: '___ she a student in 2022?', jp: '彼女は2022年に学生でしたか？', a: 'Was', choices: ['Is','Was','Were'], exp: 'She の過去疑問文 → Was', xp: 3 },
    // 一般動詞現在
    { q: 'He ___ (watch) YouTube every day.', jp: '彼は毎日YouTubeを見る。', a: 'watches', choices: ['watch','watches','watched'], exp: 'He（三単現）→ watches（-chなのでes）', xp: 3 },
    { q: '___ she like Reiwa Roman?', jp: '彼女は令和ロマンが好きですか？', a: 'Does', choices: ['Do','Does','Did'], exp: 'She の疑問文（現在）→ Does', xp: 3 },
    { q: 'I ___ understand this grammar.', jp: '私はこの文法がわからない。', a: "don't", choices: ["don't","doesn't","didn't"], exp: 'I の現在否定 → don\'t', xp: 3 },
    // 三単現s
    { q: 'She ___ (have) a great sense of humor.', jp: '彼女はユーモアのセンスがある。', a: 'has', choices: ['have','has','haves'], exp: 'have の三単現は特別 → has！', xp: 4 },
    { q: 'Kyogoku ___ (speak) in a calm voice.', jp: '京極は落ち着いた声で話す。', a: 'speaks', choices: ['speak','speaks','spoke'], exp: 'Kyogoku（三単現）→ speaks', xp: 3 },
    // 一般動詞過去
    { q: 'I ___ (go) to see a comedy show last week.', jp: '私は先週お笑いショーを見に行った。', a: 'went', choices: ['goed','went','goes'], exp: 'go の過去形は went（不規則）', xp: 4 },
    { q: 'She ___ (study) very hard for the exam.', jp: '彼女は試験のためとても一生懸命勉強した。', a: 'studied', choices: ['studyed','studied','study'], exp: 'study → y→iに変えてed → studied', xp: 4 },
    { q: '___ you watch the show yesterday?', jp: '昨日ショーを見ましたか？', a: 'Did', choices: ['Do','Does','Did'], exp: '過去の疑問文 → Did', xp: 3 },
    { q: 'He ___ (not, go) to school last Monday.', jp: '彼は先週の月曜日学校に行かなかった。', a: "didn't go", choices: ["didn't go","don't go","wasn't go"], exp: '過去否定 → didn\'t + 原形（go）', xp: 4 },
    // 混合
    { q: 'Cotton ___ (make) us laugh a lot last night.', jp: 'コットンは昨夜私たちをたくさん笑わせた。', a: 'made', choices: ['maked','made','makes'], exp: 'make の過去形 → made（不規則）', xp: 4 },
    { q: 'Kyon ___ not good at studying.', jp: 'きょんは勉強が得意ではない（現在）。', a: 'is', choices: ['am','is','was'], exp: 'Kyon（三人称単数）現在 → is not', xp: 3 },
    { q: '___ Nakamura ___ a lot yesterday?', jp: 'なかむらは昨日たくさん笑いましたか？', a: 'Did laugh', choices: ['Did laugh','Does laugh','Was laugh'], exp: '過去疑問文 → Did + 主語 + 原形（laugh）', xp: 5 },
    { q: 'I ___ (buy) a ticket for the show last week.', jp: '私は先週ショーのチケットを買った。', a: 'bought', choices: ['buyed','bought','buys'], exp: 'buy の過去形 → bought（不規則）', xp: 4 },
    { q: 'He ___ (go) to school by bike every day.', jp: '彼は毎日自転車で学校に行く。', a: 'goes', choices: ['go','goes','went'], exp: 'He（三単現）→ goes。goのs→goes', xp: 3 },
    { q: 'She ___ (not, study) last night.', jp: '彼女は昨夜勉強しなかった。', a: "didn't study", choices: ["doesn't study","didn't study","wasn't study"], exp: '過去否定 → didn\'t + 原形（study）', xp: 4 },
    { q: '___ they at the concert yesterday?', jp: '彼らは昨日コンサートにいましたか？', a: 'Were', choices: ['Was','Were','Did'], exp: 'They のbe動詞過去疑問文 → Were。', xp: 4 },
    { q: 'I ___ (see) that comedian last week.', jp: '私は先週その芸人を見た。', a: 'saw', choices: ['seed','saw','seen'], exp: '<span class="exp-rule"><span class="label">📐 不規則動詞</span>see → <strong>saw</strong></span><span class="exp-ok">✅ We saw the movie last week.</span><br><span class="exp-ng">❌ We seed（×）</span><span class="exp-tip">💡 see-saw-seen（原形-過去-過去分詞）</span>', xp: 4 },
    { q: 'She ___ (try) her best yesterday.', jp: '彼女は昨日ベストを尽くした。', a: 'tried', choices: ['tryed','tried','try'], exp: 'try → y をiに変えてed → tried。', xp: 4 },
    { q: '___ Kyon practice every day?', jp: 'きょんは毎日練習しますか？', a: 'Does', choices: ['Do','Does','Did'], exp: 'Kyon（三単現）の現在疑問文 → Does。', xp: 4 },
    { q: 'We ___ (not, speak) to each other then.', jp: '私たちはその時お互いに話さなかった。', a: "didn't speak", choices: ["don't speak","didn't speak","weren't speak"], exp: '過去否定 → didn\'t + 原形（speak）', xp: 5 },
    { q: 'He ___ (write) a long message last night.', jp: '彼は昨夜長いメッセージを書いた。', a: 'wrote', choices: ['writed','wrote','written'], exp: 'write の過去形は wrote（不規則）。', xp: 5 },
    { q: 'It ___ very hot last summer.', jp: '去年の夏はとても暑かった。', a: 'was', choices: ['is','was','were'], exp: 'It の過去形は was。last summer で過去。', xp: 3 },
    { q: 'She ___ (have) long hair then.', jp: '彼女はその時長い髪をしていた。', a: 'had', choices: ['haved','had','have'], exp: 'have の過去形は had（不規則）。', xp: 4 },
  ];

  testQs.forEach(function(q, i) {
    var qid = 's5_q' + i;
    qMeta[qid] = { type:'choice', answer: q.a, xp: q.xp };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / 20</div>'
      + '<div class="q-text">' + q.q.replace('___', '<span class="blank">___</span>') + '</div>'
      + '<div class="q-jp">' + q.jp + '</div>'
      + makeChoices(qid, q.choices, q.a, q.xp)
      + makeFeedback(qid, exp_fix(q.exp))
      + '</div>';
  });
  html += '</div>';
  return html;
}

function exp_fix(s) { return s; }

// ===== 弱点ノートページ =====
function renderWeakNote() {
  currentSection = 6;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var wqs = getWeakQuestions();
  var allQids = Object.keys(weakDB);

  if (allQids.length === 0) {
    mc.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      + '<div style="font-size:48px;margin-bottom:16px">📊</div>'
      + '<div style="font-size:18px;margin-bottom:8px">まだデータがありません</div>'
      + '<div style="font-size:14px">問題を解くと自動で記録されます</div>'
      + '</div>';
    return;
  }

  // 正答率で並べ替え
  var sorted = allQids.sort(function(a,b){ return getPct(a)-getPct(b); });

  var html = '<div style="margin-bottom:20px">'
    + '<div style="font-size:11px;color:var(--text2);margin-bottom:4px;letter-spacing:1px">TOTAL QUESTIONS ATTEMPTED</div>'
    + '<div style="display:flex;gap:16px;flex-wrap:wrap">'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center">'
    + '<div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--gold)">' + allQids.length + '</div>'
    + '<div style="font-size:11px;color:var(--text2)">記録済み問題</div>'
    + '</div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center">'
    + '<div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--red)">' + wqs.length + '</div>'
    + '<div style="font-size:11px;color:var(--text2)">要特訓（80%未満）</div>'
    + '</div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center">'
    + '<div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--green)">' + (allQids.length - wqs.length) + '</div>'
    + '<div style="font-size:11px;color:var(--text2)">習得済み（80%以上）</div>'
    + '</div>'
    + '</div></div>';

  html += '<div style="margin-bottom:12px;font-size:12px;color:var(--text2)">正答率が低い順に表示</div>';

  // 問題リスト
  sorted.forEach(function(qid) {
    var d = weakDB[qid];
    var pct = getPct(qid);
    var barColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
    var bgColor = pct < 30 ? 'rgba(233,69,96,0.06)' : pct < 60 ? 'rgba(245,197,24,0.06)' : 'rgba(63,185,80,0.06)';
    var borderColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';

    html += '<div style="background:var(--bg2);border:1px solid ' + borderColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      // 正答率円
      + '<div style="width:48px;height:48px;border-radius:50%;background:' + bgColor + ';border:2px solid ' + borderColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + '<span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span>'
      + '</div>'
      // 問題情報
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:15px;color:var(--text);margin-bottom:2px;line-height:1.6">' + (d.jp||'') + '</div>'
      + '<div style="font-family:Times New Roman,serif;font-size:13px;color:' + barColor + '">' + (d.answer||'') + '</div>'
      + '</div>'
      // 回数
      + '<div style="text-align:right;flex-shrink:0">'
      + '<div style="font-size:11px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div>'
      // プログレスバー
      + '<div style="width:80px;height:5px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden">'
      + '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width 0.5s"></div>'
      + '</div>'
      + '</div>'
      + '</div>';
  });

  if (wqs.length > 0) {
    html += '<button onclick="goSection(7)" style="width:100%;margin-top:16px;background:linear-gradient(135deg,#e94560,#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;box-shadow:0 4px 20px rgba(233,69,96,0.3)">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }

  mc.innerHTML = html;
}

// ===== 特訓モード =====
var tokkuQueue = [];
var tokkuIndex = 0;
var tokkuSession = { correct: 0, total: 0 };

function renderTokkuMode() {
  currentSection = 6;
  renderTabs();
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');

  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete">'
      + '<div class="tokku-complete-emoji">🏆</div>'
      + '<div class="tokku-complete-title">弱点ゼロ！</div>'
      + '<div class="tokku-complete-msg">すべての問題で正答率80%以上！<br>きょん「俺、めちゃくちゃ強くなってるじゃん！！」<br>西村「本当に成長したね。Unit 1に進もう」</div>'
      + '<button onclick="goSection(0)" style="margin-top:24px;background:var(--gold);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Unit 1へ進む →</button>'
      + '</div>';
    return;
  }

  // キューをシャッフル（弱点順に並べる）
  tokkuQueue = wqs.slice(0, 15); // 最大15問
  tokkuIndex = 0;
  tokkuSession = { correct: 0, total: 0 };
  renderTokkuCard();
}

function renderTokkuCard() {
  var mc = document.getElementById('mainContent');
  if (tokkuIndex >= tokkuQueue.length) {
    showTokkuComplete();
    return;
  }

  var qid = tokkuQueue[tokkuIndex];
  var d = weakDB[qid];
  if (!d) { tokkuIndex++; renderTokkuCard(); return; }

  var pct = getPct(qid);
  var color = pct < 30 ? '#e94560' : pct < 60 ? '#f5c518' : '#3fb950';

    var choicesHtml = '';
  var isChoice = (d.choices && d.choices.length > 0);
  if (isChoice) {
    choicesHtml = '<div class="tokku-choices" id="tokku_choices"></div>';
    window._tokkuChoices = { qid: qid, choices: d.choices.slice().sort(function(){ return Math.random()-0.5; }) };
  } else {
    choicesHtml = '<input class="q-input" id="tokku_input" placeholder="英語で入力…" style="font-size:17px;margin-bottom:10px">'
      + '<button id="tokku_submit" class="check-btn" style="width:100%;padding:12px;font-size:15px">採点 ✓</button>';
    window._tokkuChoices = null;
    window._tokkuQid = qid;
  }
  mc.innerHTML = '<div class="tokku-progress">'
      + '🔥 特訓 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length
      + '　　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解'
      + '</div>'
      + '<div class="tokku-card">'
      + '<div class="tokku-stat">正答率: <span class="pct" style="color:' + color + '">' + pct + '%</span>'
      + '（' + d.correct + '/' + d.total + '回正解）</div>'
      + '<div style="font-size:12px;color:var(--text2);margin-bottom:6px;letter-spacing:1px">次の日本語を英語にしたとき使うのはどれ？</div>'
      + '<div class="tokku-jp">' + (d.jp || '（問題文を読み込み中…）') + '</div>'
      + choicesHtml
      + '<div class="tokku-result" id="tokku_result"></div>'
      + '</div>'
      + '<button onclick="nextTokkuCard()" id="tokku_next" style="display:none;width:100%;margin-top:12px;background:var(--blue);color:#fff;border:none;padding:14px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題へ →</button>';

  // Attach choice buttons after render
  if (window._tokkuChoices) {
    var tc = window._tokkuChoices;
    var choicesEl = document.getElementById('tokku_choices');
    if (choicesEl) {
      tc.choices.forEach(function(c) {
        var btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = c;
        btn.style.fontSize = '16px';
        btn.style.padding = '12px 24px';
        btn.addEventListener('click', function() {
          checkTokkuAnswer(tc.qid, c);
        });
        choicesEl.appendChild(btn);
      });
    }
    window._tokkuChoices = null;
  }

  // Enter key for input
  var inp = document.getElementById('tokku_input');
  if (inp) {
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') checkTokkuInput(qid);
    });
  }
}

function checkTokkuAnswer(qid, choice) {
  var d = weakDB[qid];
  if (!d) return;
  // Disable buttons
  document.querySelectorAll('.tokku-card .choice-btn').forEach(function(b) {
    b.disabled = true;
    if (b.textContent === d.answer) b.classList.add('selected-correct');
    else if (b.textContent === choice && choice !== d.answer) b.classList.add('selected-wrong');
  });
  var correct = (choice === d.answer);
  showTokkuResult(qid, d, correct, choice);
}

function checkTokkuInput(qid) {
  var d = weakDB[qid];
  var inp = document.getElementById('tokku_input');
  if (!inp || !d) return;
  var val = inp.value;
  var correct = flexMatch(val, d.answer);
  inp.disabled = true;
  showTokkuResult(qid, d, correct, val);
}

function showTokkuResult(qid, d, correct, val) {
  tokkuSession.total++;
  var resEl = document.getElementById('tokku_result');
  if (!resEl) return;

  // DBに記録
  if (!weakDB[qid]) return;
  weakDB[qid].total++;
  if (correct) {
    weakDB[qid].correct++;
    tokkuSession.correct++;
  }
  localStorage.setItem('nh3_weakdb', JSON.stringify(weakDB));
  renderWeakBar();
  renderTabs();

  var newPct = getPct(qid);

  if (correct) {
    // XP少しもらえる
    xp += 1;
    localStorage.setItem('nh3_xp', xp);
    updateXP();
    resEl.className = 'tokku-result tokku-correct';
    resEl.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 正答率' + newPct + '%！この問題は卒業！' : ' 正答率 → ' + newPct + '%')
      + '<div style="color:#8b949e;font-size:12px;margin-top:4px">' + d.exp + '</div>';
    showToast(getComment('kyon_correct'));
  } else {
    deductXP(3);
    resEl.className = 'tokku-result tokku-wrong';
    resEl.innerHTML = '❌ 間違い！ 正答率 → ' + newPct + '%'
      + '<div class="tokku-answer">' + d.answer + '</div>'
      + '<div style="font-size:11px;color:#8b949e;margin-top:4px">' + d.exp + '</div>';
    showToast('きょん「また間違えた！！でも諦めない！！」');
  }

  resEl.style.display = 'block';
  document.getElementById('tokku_next').style.display = 'block';
}

function nextTokkuCard() {
  tokkuIndex++;
  renderTokkuCard();
}

function showTokkuComplete() {
  var mc = document.getElementById('mainContent');
  var pctAll = tokkuSession.total > 0 ? Math.round(tokkuSession.correct/tokkuSession.total*100) : 0;
  var emoji = pctAll >= 80 ? '🏆' : pctAll >= 60 ? '😎' : '💪';
  var msg = pctAll >= 80
    ? 'きょん「全部わかった！！昇格の予感！！」<br>西村「よくやった。次回も頼む」'
    : pctAll >= 50
    ? 'きょん「半分以上できた！もう一回やる！」<br>西村「続けること。それが大事」'
    : 'きょん「難しかった…でも諦めない！！」<br>西村「何度でもやればいい。繰り返すことが力になる」';

  mc.innerHTML = '<div class="tokku-complete">'
    + '<div class="tokku-complete-emoji">' + emoji + '</div>'
    + '<div class="tokku-complete-title">特訓終了！</div>'
    + '<div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div>'
    + '<div style="font-size:14px;color:#8b949e">' + tokkuSession.correct + ' / ' + tokkuSession.total + '問正解</div>'
    + '<div class="tokku-complete-msg" style="margin-top:16px">' + msg + '</div>'
    + '<div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button onclick="renderTokkuMode()" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回特訓！</button>'
    + '<button onclick="goSection(0)" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">セクションに戻る</button>'
    + '</div></div>';

  renderWeakBar();
}

// ===== FINAL RESULT =====
function showFinalResult() {
  var total = 0;
  var correct = 0;
  Object.keys(qMeta).forEach(function(qid) {
    if (qid.startsWith('s5_')) {
      total++;
      if (answeredSet[qid]) correct++;
    }
  });
  if (total === 0) total = 30;
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '😄' : '🐣';
  var msg = pct >= 90
    ? 'きょん「全部わかった！！にっくんより賢くなったかもしれない！！」<br>西村「よくやった。Unit 1に進もう」'
    : pct >= 70
    ? 'きょん「かなりできた！！もうちょっとで完璧！！」<br>西村「惜しい。もう一度見直したら完璧になるよ」'
    : pct >= 50
    ? 'きょん「半分くらいはわかった！！まだまだやれる！！」<br>西村「基礎の復習をもう一回やってみよう」'
    : 'きょん「難しかった！！でも諦めない！！」<br>西村「焦らなくていい。もう一度セクションを復習してから来よう」';

  var html = '<div class="result-box">'
    + '<div class="result-title">📊 確認テスト 結果</div>'
    + '<div class="result-emoji">' + emoji + '</div>'
    + '<div class="result-score">' + correct + '<span> / ' + total + '問正解</span></div>'
    + '<div style="font-size:28px;color:var(--gold);font-weight:bold;margin-bottom:8px">' + pct + '%</div>'
    + '<div class="result-msg">' + msg + '</div>'
    + '<div class="result-xp">現在のステータス：' + getLevel(xp).badge + ' / ' + getLevel(xp).title + '</div>'
    + '<div style="font-size:14px;color:var(--text2);margin-bottom:8px">総獲得XP: ' + xp + ' XP（' + getLevel(xp).label + '）</div>'
    + '<div style="margin-top:24px">'
    + '<button class="result-btn" onclick="closeResult()">📖 見直しをする</button>'
    + '<button class="result-btn" onclick="goSection(1)">🔄 最初からやり直す</button>'
    + '</div></div>';
  document.getElementById('resultOverlay').innerHTML = html;
  document.getElementById('resultOverlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeResult() {
  document.getElementById('resultOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// ===== INIT =====
var ALL_QUESTION_DATA = {
  's1_q0': {jp:'あなたは学生ですか？',answer:'Are',choices:['Am','Is','Are']},
  's1_q1': {jp:'私は愛知出身です。',answer:'am',choices:['am','is','are']},
  's1_q2': {jp:'彼女はとても面白い。',answer:'is',choices:['am','is','are']},
  's1_q3': {jp:'私たちは良い友達です。',answer:'are',choices:['am','is','are']},
  's1_q4': {jp:'令和ロマンはコンビです。',answer:'is',choices:['am','is','are']},
  's1_q5': {jp:'彼は東京出身ではありません。',answer:'is',choices:['am','is','are']},
  's1_q6': {jp:'彼らは芸人です。',answer:'are',choices:['am','is','are']},
  's1_q7': {jp:'それは面白いですか？',answer:'Is',choices:['Am','Is','Are']},
  's1_q8': {jp:'ケムリとくるまは素晴らしいチームです。',answer:'are',choices:['am','is','are']},
  's1_q9': {jp:'私はまだ英語が得意ではありません。',answer:'am',choices:['am','is','are']},
  's1_qb0': {jp:'彼は芸人ではありません。',answer:'He is not a comedian.',choices:[]},
  's1_qb1': {jp:'あなたたちは良い友達ですか？',answer:'Are you good friends?',choices:[]},
  's1_qb2': {jp:'コットンは面白いコンビです。',answer:'Cotton is a funny duo.',choices:[]},
  's1_qb3': {jp:'私は愛知県出身です。',answer:'I am from Aichi.',choices:[]},
  's1_qb4': {jp:'彼らはとても有名ですか？',answer:'Are they very famous?',choices:[]},
  's1_qb5': {jp:'彼女は学生ではありません。',answer:'She is not a student.',choices:[]},
  's2_q0': {jp:'私は昨日とても疲れていた。',answer:'was',choices:['am','was','were']},
  's2_q1': {jp:'彼らは昨夜ステージで面白かった。',answer:'were',choices:['are','was','were']},
  's2_q2': {jp:'彼女は去年学生でしたか？',answer:'Was',choices:['Is','Was','Were']},
  's2_q3': {jp:'私たちは昨日家にいなかった。',answer:'were',choices:['am','was','were']},
  's2_q4': {jp:'かまいたちは2年前とても人気があった。',answer:'was',choices:['is','was','were']},
  's2_q5': {jp:'彼は先週月曜日学校にいた。',answer:'was',choices:['is','was','were']},
  's2_q6': {jp:'その時あなたは嬉しかったですか？',answer:'Were',choices:['Was','Were','Are']},
  's2_q7': {jp:'先週は寒くなかった。',answer:'was',choices:['is','was','were']},
  's2_q8': {jp:'コットンは5年前有名ではなかった。',answer:'was',choices:['is','was','were']},
  's2_q9': {jp:'彼らは昨日ライブに来ていましたか？',answer:'Were',choices:['Was','Were','Did']},
  's2_qb0': {jp:'彼は昨日学校にいませんでした。',answer:'He was not at school yesterday.',choices:[]},
  's2_qb1': {jp:'昨日忙しかったですか？',answer:'Were you busy yesterday?',choices:[]},
  's2_qb2': {jp:'私たちは去年同じクラスでした。',answer:'We were in the same class last year.',choices:[]},
  's2_qb3': {jp:'彼女は昨日家にいましたか？',answer:'Was she at home yesterday?',choices:[]},
  's3_q0': {jp:'彼女は毎晩お笑いを見る。',answer:'watches',choices:['watch','watches','watching']},
  's3_q1': {jp:'彼は令和ロマンが好きですか？',answer:'Does',choices:['Do','Does','Is']},
  's3_q2': {jp:'私は鉛筆を持っていない。',answer:'don\'t',choices:['don\'t','doesn\'t','isn\'t']},
  's3_q3': {jp:'ケムリは落ち着いた声を持っている。',answer:'has',choices:['have','has','haves']},
  's3_q4': {jp:'彼女はとても一生懸命勉強する。',answer:'studies',choices:['studys','studies','study']},
  's3_q5': {jp:'彼は自転車で学校に行く。',answer:'goes',choices:['go','goes','gos']},
  's3_q6': {jp:'彼らは毎日英語を勉強する。',answer:'study',choices:['study','studies','studys']},
  's3_q7': {jp:'彼女は数学が好きではない。',answer:'doesn\'t like',choices:['don\'t like','doesn\'t like','isn\'t like']},
  's3_q8': {jp:'あなたの先生は英語を上手に話しますか？',answer:'Does',choices:['Do','Does','Is']},
  's3_q9': {jp:'きょんは毎日一生懸命頑張る。',answer:'tries',choices:['trys','tries','try']},
  's3_qb0': {jp:'彼は関西弁を話しますか？',answer:'Does he speak Kansai dialect?',choices:[]},
  's3_qb1': {jp:'私は毎日英語を勉強しない。',answer:'I don\'t study English every day.',choices:[]},
  's3_qb2': {jp:'彼女は毎朝早く起きます。',answer:'She gets up early every morning.',choices:[]},
  's3_qb3': {jp:'きょんはよく動画を見ますか？',answer:'Does Kyon often watch videos?',choices:[]},
  's4_q0': {jp:'私は先週大阪に行った。',answer:'went',choices:['goed','went','go']},
  's4_q1': {jp:'彼女は昨日一生懸命英語を勉強した。',answer:'studied',choices:['studyed','studied','studded']},
  's4_q2': {jp:'昨夜ショーを見ましたか？',answer:'Did',choices:['Do','Does','Did']},
  's4_q3': {jp:'彼は昨日学校に来なかった。',answer:'didn\'t come',choices:['didn\'t come','don\'t come','wasn\'t come']},
  's4_q4': {jp:'コットンは皆を笑わせた。',answer:'made',choices:['maked','made','making']},
  's4_q5': {jp:'彼女は先週チケットを買った。',answer:'bought',choices:['buyed','bought','buys']},
  's4_q6': {jp:'私は答えを知らなかった。',answer:'didn\'t know',choices:['didn\'t know','don\'t know','wasn\'t know']},
  's4_q7': {jp:'彼は話すのが速すぎた。',answer:'spoke',choices:['speaked','spoke','spoken']},
  's4_q8': {jp:'彼女は答えを書きましたか？',answer:'Did',choices:['Does','Did','Was']},
  's4_q9': {jp:'彼らはショーの後でたこ焼きを食べた。',answer:'ate',choices:['eated','ate','eaten']},
  's4_qb0': {jp:'彼は昨日英語を勉強しましたか？',answer:'Did he study English yesterday?',choices:[]},
  's4_qb1': {jp:'私は昨夜お笑いを見なかった。',answer:'I didn\'t watch comedy last night.',choices:[]},
  's4_qb2': {jp:'彼女は昨日何を食べましたか？',answer:'What did she eat yesterday?',choices:[]},
  's4_qb3': {jp:'私たちは先週その映画を見た。',answer:'We saw the movie last week.',choices:[]},
  's5_q0': {jp:'私は愛知県出身です。',answer:'am',choices:['am','is','are']},
  's5_q1': {jp:'霜降り明星は人気のコンビです。',answer:'is',choices:['am','is','are']},
  's5_q2': {jp:'彼らは良い芸人ですか？',answer:'Are',choices:['Am','Is','Are']},
  's5_q3': {jp:'彼女は全然面白くない。',answer:'is',choices:['am','is','are']},
  's5_q4': {jp:'私は昨日とても嬉しかった。',answer:'was',choices:['am','was','were']},
  's5_q5': {jp:'彼らは昨夜ショーにいた。',answer:'were',choices:['was','were','are']},
  's5_q6': {jp:'彼女は2022年に学生でしたか？',answer:'Was',choices:['Is','Was','Were']},
  's5_q7': {jp:'彼は毎日YouTubeを見る。',answer:'watches',choices:['watch','watches','watched']},
  's5_q8': {jp:'彼女は令和ロマンが好きですか？',answer:'Does',choices:['Do','Does','Did']},
  's5_q9': {jp:'私はこの文法がわからない。',answer:'don\'t',choices:['don\'t','doesn\'t','didn\'t']},
  's5_q10': {jp:'彼女はユーモアのセンスがある。',answer:'has',choices:['have','has','haves']},
  's5_q11': {jp:'京極は落ち着いた声で話す。',answer:'speaks',choices:['speak','speaks','spoke']},
  's5_q12': {jp:'私は先週お笑いショーを見に行った。',answer:'went',choices:['goed','went','goes']},
  's5_q13': {jp:'彼女は試験のためとても一生懸命勉強した。',answer:'studied',choices:['studyed','studied','study']},
  's5_q14': {jp:'昨日ショーを見ましたか？',answer:'Did',choices:['Do','Does','Did']},
  's5_q15': {jp:'彼は先週の月曜日学校に行かなかった。',answer:'didn\'t go',choices:['didn\'t go','don\'t go','wasn\'t go']},
  's5_q16': {jp:'コットンは昨夜私たちをたくさん笑わせた。',answer:'made',choices:['maked','made','makes']},
  's5_q17': {jp:'きょんは勉強が得意ではない（現在）。',answer:'is',choices:['am','is','was']},
  's5_q18': {jp:'なかむらは昨日たくさん笑いましたか？',answer:'Did laugh',choices:['Did laugh','Does laugh','Was laugh']},
  's5_q19': {jp:'私は先週ショーのチケットを買った。',answer:'bought',choices:['buyed','bought','buys']},
  's5_q20': {jp:'彼は毎日自転車で学校に行く。',answer:'goes',choices:['go','goes','went']},
  's5_q21': {jp:'彼女は昨夜勉強しなかった。',answer:'didn\'t study',choices:['doesn\'t study','didn\'t study','wasn\'t study']},
  's5_q22': {jp:'彼らは昨日コンサートにいましたか？',answer:'Were',choices:['Was','Were','Did']},
  's5_q23': {jp:'私は先週その芸人を見た。',answer:'saw',choices:['seed','saw','seen']},
  's5_q24': {jp:'彼女は昨日ベストを尽くした。',answer:'tried',choices:['tryed','tried','try']},
  's5_q25': {jp:'きょんは毎日練習しますか？',answer:'Does',choices:['Do','Does','Did']},
  's5_q26': {jp:'私たちはその時お互いに話さなかった。',answer:'didn\'t speak',choices:['don\'t speak','didn\'t speak','weren\'t speak']},
  's5_q27': {jp:'彼は昨夜長いメッセージを書いた。',answer:'wrote',choices:['writed','wrote','written']},
  's5_q28': {jp:'去年の夏はとても暑かった。',answer:'was',choices:['is','was','were']},
  's5_q29': {jp:'彼女はその時長い髪をしていた。',answer:'had',choices:['haved','had','have']},
};
// ===== 弱点DB修復 =====
function repairWeakDB() {
  var repaired = 0;
  Object.keys(weakDB).forEach(function(qid) {
    var d = weakDB[qid];
    var src = ALL_QUESTION_DATA[qid];
    if (src && (!d.jp || d.jp === '' || d.jp === 'JP')) {
      d.jp = src.jp;
      d.answer = src.answer || d.answer;
      if (src.choices && src.choices.length > 0) d.choices = src.choices;
      repaired++;
    }
  });
  if (repaired > 0) {
    localStorage.setItem('nh3_weakdb', JSON.stringify(weakDB));
    console.log('弱点DB修復: ' + repaired + '件');
  }
}

updateXP();
repairWeakDB();
renderWeakBar();
renderTabs();
goSection(0);