// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「文法？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなく文節ってやつがわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺、品詞わかるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺、国語できる人間？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより助動詞くわしくなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「文法でツッコミできるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「識別、もう怖くない」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var xp           = parseInt(localStorage.getItem('jpn_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('jpn_gram_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('jpn_gram_sections') || '{}');
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
  localStorage.setItem('jpn_gram_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('jpn_gram_') === 0 && getPct(id) < 80;
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
    'きょん「やった！にっくんより文法くわしいかも！」',
    'きょん「待って待って、識別できてきた！！」',
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
  var demoted = deductXP(5);
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
  localStorage.setItem('jpn_gram_answered', JSON.stringify(answeredSet));
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
  var prefix = 'jpn_gram_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('jpn_gram_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if (nb && nb.style.display === 'none') {
      nb.style.display = 'block';
      if (!document.getElementById('secCompleteBanner')) {
        var banner = document.createElement('div');
        banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 7 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '結果発表！';
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
  { id:0, label:'📖 スタート',        title:'文法、ぜんぶまとめて片付けよう', sub:'中1〜中3、今まで習った文法を1ページで総復習する' },
  { id:1, label:'文節・文の成分',      title:'文節・文の成分',                 sub:'文をパーツに分けて、それぞれの役割を見抜く（中1）' },
  { id:2, label:'品詞の分類',          title:'品詞の分類（10品詞）',           sub:'単語を10種類に仕分けるルールを覚える（中1〜2）' },
  { id:3, label:'用言の活用',          title:'用言の活用',                     sub:'動詞・形容詞・形容動詞のカタチの変化を覚える（中1〜2）' },
  { id:4, label:'助詞',                title:'助詞のはたらき',                 sub:'体言や活用語にくっつく、意味を添える言葉（中2）' },
  { id:5, label:'助動詞',              title:'助動詞の意味',                   sub:'一番出るところ。意味と接続をセットで覚える（中2）' },
  { id:6, label:'まぎらわしい語の識別', title:'まぎらわしい語の識別',           sub:'入試最頻出！「ない」「れる・られる」などを見分ける（中3）' },
  { id:7, label:'確認テスト',          title:'確認テスト',                     sub:'文法総まとめ25問！全部でどれだけ取れる？' },
  { id:8, label:'📊弱点',              title:'弱点ノート',                     sub:'間違えた問題の正答率を確認しよう' },
  { id:9, label:'🔥特訓',              title:'弱点特訓モード',                 sub:'弱点問題だけを集中練習！' },
];

function renderTabs() {
  var html = '';
  SECTIONS.forEach(function(s) {
    var cls = 'section-tab'
      + (s.id >= 8 ? ' tokku' : '')
      + (s.id === currentSection ? ' active' : '')
      + (sectionDone[s.id] && s.id < 8 ? ' done' : '');
    var label = s.label + (sectionDone[s.id] && s.id < 8 ? ' ✓' : '');
    if (s.id === 9) { var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
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
  if (id === 8) { renderWeakNote(); return; }
  if (id === 9) { renderTokkuMode(); return; }

  var s = SECTIONS[id];
  var html = '';
  html += '<div class="progress-dots">';
  for (var i = 0; i <= 7; i++) {
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">国語 文法総復習 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';

  if      (id === 0) html += renderSection0();
  else if (id === 1) html += renderSection1();
  else if (id === 2) html += renderSection2();
  else if (id === 3) html += renderSection3();
  else if (id === 4) html += renderSection4();
  else if (id === 5) html += renderSection5();
  else if (id === 6) html += renderSection6();
  else if (id === 7) html += renderSection7();

  if (id >= 1 && id <= 7) {
    var nextLabel = id < 7 ? '次のセクションへ →' : '🏆 結果を見る！';
    html += '<button class="next-section-btn" id="nextBtn" data-goto="' + (id < 7 ? id+1 : 'result') + '" style="display:none">' + nextLabel + '</button>';
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

// ===== SVG HELPERS =====
var SVG = {
  posFlow: '<svg viewBox="0 0 340 300" style="width:100%;max-width:380px;display:block;margin:0 auto">'
    + '<rect x="10" y="10" width="320" height="46" rx="8" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
    + '<text x="170" y="30" fill="#a371f7" font-size="12" text-anchor="middle">① それだけで文節を作れる？</text>'
    + '<text x="170" y="46" fill="#8b949e" font-size="10" text-anchor="middle">YES→自立語　NO→付属語</text>'
    + '<path d="M 170,56 L 170,72" stroke="#8b949e" stroke-width="2" marker-end="url(#pArrow)"/>'
    + '<rect x="10" y="74" width="320" height="46" rx="8" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<text x="170" y="94" fill="#0ea5e9" font-size="12" text-anchor="middle">② （自立語なら）活用する？</text>'
    + '<text x="170" y="110" fill="#8b949e" font-size="10" text-anchor="middle">YES→用言（動詞･形容詞･形容動詞）</text>'
    + '<path d="M 170,120 L 170,136" stroke="#8b949e" stroke-width="2" marker-end="url(#pArrow)"/>'
    + '<rect x="10" y="138" width="320" height="46" rx="8" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="170" y="158" fill="#f5c518" font-size="12" text-anchor="middle">③ （活用しないなら）主語になる？</text>'
    + '<text x="170" y="174" fill="#8b949e" font-size="10" text-anchor="middle">YES→名詞　NO→副詞･連体詞･接続詞･感動詞</text>'
    + '<path d="M 170,184 L 170,200" stroke="#8b949e" stroke-width="2" marker-end="url(#pArrow)"/>'
    + '<rect x="10" y="202" width="320" height="46" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="170" y="222" fill="#3fb950" font-size="12" text-anchor="middle">④ （付属語なら）活用する？</text>'
    + '<text x="170" y="238" fill="#8b949e" font-size="10" text-anchor="middle">YES→助動詞　NO→助詞</text>'
    + '<path d="M 170,248 L 170,264" stroke="#8b949e" stroke-width="2" marker-end="url(#pArrow)"/>'
    + '<rect x="10" y="266" width="320" height="30" rx="8" fill="rgba(233,69,96,0.10)" stroke="#e94560" stroke-width="1.5"/>'
    + '<text x="170" y="286" fill="#e94560" font-size="11" text-anchor="middle">用言の言い切り：動詞=ウ段／形容詞=い／形容動詞=だ</text>'
    + '<defs><marker id="pArrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#8b949e"/></marker></defs>'
    + '</svg>',

  reruFlow: '<svg viewBox="0 0 340 220" style="width:100%;max-width:380px;display:block;margin:0 auto">'
    + '<rect x="10" y="10" width="320" height="42" rx="8" fill="rgba(233,69,96,0.12)" stroke="#e94560" stroke-width="2"/>'
    + '<text x="170" y="35" fill="#e94560" font-size="12" text-anchor="middle">「（人）に」を補える → 受身</text>'
    + '<rect x="10" y="58" width="320" height="42" rx="8" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
    + '<text x="170" y="83" fill="#0ea5e9" font-size="12" text-anchor="middle">「ことができる」に言い換え → 可能</text>'
    + '<rect x="10" y="106" width="320" height="42" rx="8" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="170" y="131" fill="#f5c518" font-size="12" text-anchor="middle">「自然と」を補える → 自発</text>'
    + '<rect x="10" y="154" width="320" height="42" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="170" y="179" fill="#3fb950" font-size="12" text-anchor="middle">「お～になる」に言い換え → 尊敬</text>'
    + '</svg>',
};

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん、テスト範囲に「今までの文法全部」って書いてあるんだけど！？中1から中3までって、そんなの覚えてられる！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">落ち着け。文法は積み木と同じで、下から順番に積んでいけば全部つながっている。文節を知らないと品詞は分からない。品詞を知らないと助詞・助動詞は分からない。助詞・助動詞が分かって、初めて一番むずかしい「識別」が解ける。この順番で今日、全部片付けよう。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">一番むずかしいのって最後に出てきたやつ！？「識別」ってやつ！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">その通り。「ない」や「れる・られる」が文の中でどんな意味か見分ける問題——これが入試で一番よく出て、一番みんなが間違える。だから今日はSection 6にたっぷり時間をかける。焦らず、①〜⑤の土台を先に固めてからいこう。</div></div></div>'
    + '</div>'
    + '<div class="konto-box">'
    + '<div class="konto-box-title">🎤 きょんの決意コント</div>'
    + '<div class="chat-line"><div class="avatar charA">芸</div><div><div class="chat-name">きょん（NSC入学志望）</div><div class="chat-bubble">えー、私、文法というものがずっと苦手でして。「ない」って言葉ひとつとっても、3種類も意味があるって知ったときは、もう「ない」わー！ってなりました。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村（審査員役）</div><div class="chat-bubble">…今の「ない」は、感動詞でも助動詞でもなく、単なる相槌だね。0点。</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">📖 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：文節・文の成分（中1）<br>'
    + 'Section 2：品詞の分類 10品詞（中1〜2）<br>'
    + 'Section 3：用言の活用（中1〜2）<br>'
    + 'Section 4：助詞のはたらき（中2）<br>'
    + 'Section 5：助動詞の意味（中2・最重要）<br>'
    + 'Section 6：まぎらわしい語の識別（中3・入試最頻出）<br>'
    + 'Section 7：確認テスト（総合25問）'
    + '</div></div>'
    + '<button class="start-btn" data-goto="1">📖 Section 1 から始める →</button>';
}

// ===== SECTION 1: 文節・文の成分 =====
function renderSection1() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「文節」ってそもそも何？「単語」と何が違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">文を区切るとき、意味が不自然にならない一番小さいまとまりが文節だ。コツは「ネ」「サ」「ヨ」を入れて区切れる場所を探すこと。「私はネ／今日ネ／学校へネ／行くネ」——これが文節。単語はそれをさらに細かく分けたもの、「私」「は」「今日」……という一つ一つの言葉のことだ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">文節が分かったら、次は何をするの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">それぞれの文節が文の中でどんな役割（主語？述語？）を持っているか、そして文節同士がどんな関係で結びついているかを見抜く。ここが「文の成分」だ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 文節の区切り方</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">言葉の単位</div>'
    + '<div class="ex">文章 ＞ 段落 ＞ 文 ＞ 文節 ＞ 単語</div>'
    + '<div class="note">💡 「ネ・サ・ヨ」を入れて自然に切れる場所が文節の切れ目！「私はネ／毎日ネ／学校へネ／歩いてネ／行くネ」→5文節</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 文の成分（文節の役割）</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">5つの成分</div>'
    + '<div class="ex">主語：「何が／誰が」＝「〜が」「〜は」の形が多い</div>'
    + '<div class="ex">述語：「どうする／どんなだ／何だ」＝文末に来ることが多い</div>'
    + '<div class="ex">修飾語：他の文節を詳しくする（連用修飾語＝用言を修飾／連体修飾語＝体言を修飾）</div>'
    + '<div class="ex">接続語：文と文、文節と文節をつなぐ（だから・しかし・そして）</div>'
    + '<div class="ex">独立語：他と直接関係を持たない（感動・呼びかけ・応答・提示）</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 文節と文節の関係</div>'
    + '<div class="rule-box">'
    + '<div class="ex">主・述の関係／修飾・被修飾の関係／接続の関係／独立の関係</div>'
    + '<div class="ex">並立の関係：対等に並ぶ（例：「赤い花と白い花」の「花と」「花」）→入れ替えても意味が変わらない</div>'
    + '<div class="ex">補助の関係：直前の文節の意味を補うだけ（例：「食べて｜いる」「読んで｜みる」）</div>'
    + '<div class="note">⚠️ 「〜て（で）＋いる・ある・みる・おく・しまう」の形は補助の関係の合図！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「私は　毎日　学校へ　歩いて　行く。」の文節数は？', sub:'「ネ」を入れて区切ってみる', a:'5', choices:['5','4','6','3'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>私はネ／毎日ネ／学校へネ／歩いてネ／行くネ → 5文節</span><span class="exp-tip">💡 「ネ」を入れて不自然にならない場所を数える！</span>' },
    { q:'「白い　犬が　庭で　元気に　走る。」の主語はどれ？', sub:'「何が」に当たる文節を探す', a:'犬が', choices:['犬が','白い','庭で','走る'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>主語は「何が」「誰が」に当たる文節</span><span class="exp-tip">💡 「〜が」「〜は」の形を探す！</span>' },
    { q:'「昨日、公園で　友達に　会った。」の述語はどれ？', sub:'文末に来ることが多い', a:'会った', choices:['会った','友達に','公園で','昨日'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>述語は「どうする」に当たり、文末に来ることが多い</span><span class="exp-tip">💡 まず文末を見る！</span>' },
    { q:'「大きな　声で　叫んだ。」の「大きな」が修飾しているのは？', sub:'体言を修飾するか用言を修飾するか', a:'声で', choices:['声で','叫んだ','（文全体）','なし'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>連体修飾語は体言（名詞）を修飾する</span><span class="exp-tip">💡 「大きな」→「声」（名詞）を修飾する連体修飾語！</span>' },
    { q:'「静かに　歩く。」の「静かに」が修飾しているのは？', sub:'用言を修飾するのが連用修飾語', a:'歩く', choices:['歩く','（なし）','静かに自身','主語'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>連用修飾語は用言（動詞・形容詞・形容動詞）を修飾する</span><span class="exp-tip">💡 「静かに」→「歩く」（動詞）を修飾する連用修飾語！</span>' },
    { q:'「雨が降った。だから、試合は中止になった。」の「だから」の文の成分は？', sub:'文と文をつなぐ働き', a:'接続語', choices:['接続語','主語','述語','独立語'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>接続語は文と文をつなぐ働き。「だから」「しかし」「そして」などが代表</span><span class="exp-tip">💡 前後の文の関係（原因→結果など）をつなぐ言葉！</span>' },
    { q:'「はい、私が　やります。」の「はい、」の文の成分は？', sub:'他の文節と直接の関係を持たない', a:'独立語', choices:['独立語','主語','接続語','修飾語'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>独立語は他の文節と直接の関係を持たない（感動・呼びかけ・応答・提示）</span><span class="exp-tip">💡 「はい、」は応答を表す独立語！</span>' },
    { q:'「本を　読んで　いる。」の「読んで」と「いる」の関係は？', sub:'「〜て＋いる」の形に注目', a:'補助の関係', choices:['補助の関係','主・述の関係','並立の関係','修飾・被修飾の関係'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「〜て（で）＋いる・ある・みる・おく」などは補助の関係</span><span class="exp-tip">💡 「読んで」が意味の中心、「いる」は補助！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_gram_s1_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 文節・文の成分</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 2: 品詞の分類 =====
function renderSection2() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">品詞って10種類もあるんでしょ！？全部覚えるの無理じゃない！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar charB">祭</div><div><div class="chat-name">なかむらしゅん（9番街レトロ）</div><div class="chat-bubble">きょん、正攻法いきましょう。品詞は丸暗記じゃなくて「質問に順番に答える」だけで自動的に決まるんです。①単独で文節を作れるか、②活用するか、③言い切りの音は何か——この3つの質問に答えたら、10種類のうちどれか一つに絞れます。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">おお、しゅんありがとう！質問形式なら俺のパターン記憶とも相性いいかも！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 自立語と付属語</div>'
    + '<div class="rule-box">'
    + '<div class="ex">自立語：それだけで文節を作れる語（文節の最初に必ず1つある）</div>'
    + '<div class="ex">付属語：それだけでは文節を作れず、自立語にくっついて使う語</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 10品詞・見分け方フロー</div>'
    + SVG.posFlow
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="rule-title">自立語（8種）</div>'
    + '<div class="ex">用言（活用する）：動詞（言い切りウ段）・形容詞（言い切り「い」）・形容動詞（言い切り「だ」）</div>'
    + '<div class="ex">体言（活用しない・主語になる）：名詞</div>'
    + '<div class="ex">その他（活用しない）：副詞（用言を修飾）・連体詞（体言だけを修飾）・接続詞（つなぐ）・感動詞（独立語になる）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">付属語（2種）</div>'
    + '<div class="ex">助動詞：活用する付属語</div>'
    + '<div class="ex">助詞：活用しない付属語</div>'
    + '<div class="note">⚠️ 「独立語」は文の成分の名前、「感動詞」は品詞の名前。似ているが別物！</div>'
    + '</div>'
    + '</div>';

  html += '<div style="text-align:center;margin-bottom:24px">'
    + '<a href="jpn_pos_reference.html" style="display:inline-block;background:linear-gradient(135deg,var(--purple),#7c3aed);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:bold;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(163,113,247,0.4)">🔖 品詞早見表を見る（同じ例文で10品詞まとめて比較）</a>'
    + '</div>';

  var qs = [
    { q:'「走る」の品詞は？', sub:'言い切りの音を見る', a:'動詞', choices:['動詞','形容詞','形容動詞','名詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>言い切りがウ段（る）＝動詞</span><span class="exp-tip">💡 活用する自立語で単独で述語になれる！</span>' },
    { q:'「美しい」の品詞は？', sub:'言い切りの音を見る', a:'形容詞', choices:['形容詞','形容動詞','動詞','副詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>言い切りが「い」で終わる＝形容詞</span><span class="exp-tip">💡 用言のうち「い」で終わるのは形容詞だけ！</span>' },
    { q:'「静かだ」の品詞は？', sub:'「〜な」の形にできるか', a:'形容動詞', choices:['形容動詞','形容詞','動詞','名詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>言い切りが「だ」で終わる活用する自立語＝形容動詞</span><span class="exp-tip">💡 「静かな（とき）」と体言を修飾できるのも目印！</span>' },
    { q:'「教室」の品詞は？', sub:'活用しない・主語になれる', a:'名詞', choices:['名詞','代名詞','連体詞','副詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用しない自立語で主語になれる（体言）＝名詞</span><span class="exp-tip">💡 「教室が」のように「が」をつけて主語になれる！</span>' },
    { q:'「ゆっくり（歩く）」の品詞は？', sub:'何を修飾しているか', a:'副詞', choices:['副詞','連体詞','形容詞','名詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用しない自立語で、主に用言を修飾する＝副詞</span><span class="exp-tip">💡 「ゆっくり」→「歩く」（動詞）を修飾！</span>' },
    { q:'「あらゆる（手段）」の品詞は？', sub:'体言だけを修飾する', a:'連体詞', choices:['連体詞','副詞','形容詞','接続詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用しない自立語で、体言だけを修飾する＝連体詞</span><span class="exp-tip">💡 「この・その・あの・大きな・いわゆる」も連体詞の仲間！</span>' },
    { q:'「しかし（雨が降った）」の品詞は？', sub:'文と文をつなぐ自立語', a:'接続詞', choices:['接続詞','副詞','感動詞','助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用しない自立語で、文と文・語と語をつなぐ＝接続詞</span><span class="exp-tip">💡 「そして・だから・しかし」など！</span>' },
    { q:'「ああ、（疲れた）」の品詞は？', sub:'それだけで独立語になれる自立語', a:'感動詞', choices:['感動詞','独立語','接続詞','副詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用しない自立語で、単独で独立語になれる＝感動詞</span><span class="exp-ng">❌「独立語」は文の成分の名前であって品詞名ではない！</span><span class="exp-tip">💡 感動・呼びかけ・応答・掛け声を表す言葉！</span>' },
    { q:'「食べ『た』。」の「た」の品詞は？', sub:'付属語で活用する', a:'助動詞', choices:['助動詞','助詞','動詞の一部','形容詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>付属語で活用する＝助動詞</span><span class="exp-tip">💡 「た」は過去・完了などを表す助動詞！</span>' },
    { q:'「本『を』読む」の「を」の品詞は？', sub:'付属語で活用しない', a:'助詞', choices:['助詞','助動詞','名詞','連体詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>付属語で活用しない＝助詞</span><span class="exp-tip">💡 体言について語と語の関係を示す格助詞！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_gram_s2_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 品詞の分類</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 3: 用言の活用 =====
function renderSection3() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">動詞の活用、五段とか上一段とか下一段とか…名前が難しくて頭に入らない！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">見分け方は1つだけ覚えればいい。「ない」をつけて、その直前の音を見る。ア段になれば五段活用、イ段になれば上一段活用、エ段になれば下一段活用。「来る」と「する」だけは特別枠で、それぞれカ行変格活用・サ行変格活用と丸暗記する。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">待って、俺、授業でカ行とサ行しかやったことない！バ行とかマ行とか急に言われても知らない言葉すぎる！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">それは「行（ぎょう）」と「段（だん）」を混同しているだけだ。整理しよう。「段」はア・イ・ウ・エ・オのどの母音かということ。これで五段／上一段／下一段のどれかが決まる。「行」はカ・サ・タ・ナ・バ・マ・ラなど、五十音図のどの子音のグループかということ。これは動詞ごとに違うだけで、活用の種類とは別の情報だ。「書く」はカ行、「叫ぶ」はバ行、「読む」はマ行、「作る」はラ行——でも「ない」をつけて音がア段になるなら、行が何であれ全部五段活用だ。カ行だけが五段活用というわけではない。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 活用形（6つ）</div>'
    + '<div class="rule-box">'
    + '<div class="ex">未然形：ない・う・ように続く</div>'
    + '<div class="ex">連用形：ます・た・てに続く</div>'
    + '<div class="ex">終止形：言い切る</div>'
    + '<div class="ex">連体形：体言（とき・こと・の）に続く</div>'
    + '<div class="ex">仮定形：ばに続く</div>'
    + '<div class="ex">命令形：命令して言い切る</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 動詞の活用の種類</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">「ない」をつけて直前の音を見る</div>'
    + '<div class="ex">五段活用：ア段になる（例：書く→書か-ない）</div>'
    + '<div class="ex">上一段活用：イ段になる（例：見る→見-ない）</div>'
    + '<div class="ex">下一段活用：エ段になる（例：食べる→食べ-ない）</div>'
    + '<div class="ex">カ行変格活用：「来る」だけ／サ行変格活用：「する」だけ（丸暗記）</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 「行（ぎょう）」と「段（だん）」は別の話</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">段（だん）＝活用の種類を決める</div>'
    + '<div class="ex">ア・イ・ウ・エ・オのどの母音か。「ない」をつけた音がア段なら五段、イ段なら上一段、エ段なら下一段</div>'
    + '<div class="rule-title" style="margin-top:10px">行（ぎょう）＝その動詞の子音のグループ（活用の種類とは無関係）</div>'
    + '<div class="ex">カ行（書く）・サ行（話す）・タ行（待つ）・ナ行（死ぬ）・バ行（叫ぶ）・マ行（読む）・ラ行（作る）・ワ行（買う）など</div>'
    + '<div class="note">⚠️ 「カ行だけが五段活用」ではない！ どの行（カでもバでもマでもラでも）でも、「ない」をつけた音がア段になれば五段活用。行の名前は、その動詞がどの子音で変化するかを表しているだけ！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 形容詞・形容動詞の活用</div>'
    + '<div class="rule-box">'
    + '<div class="ex">形容詞（例：高い）：高かろ／高かっ・高く／高い／高い／高けれ／（命令形なし）</div>'
    + '<div class="ex">形容動詞（例：静かだ）：静かだろ／静かだっ・で・に／静かだ／静かな／静かなら／（命令形なし）</div>'
    + '<div class="note">⚠️ 形容詞・形容動詞には命令形がない！これは動詞だけの特別な活用形。</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「書く」に「ない」をつけると？', sub:'直前の音がア段になる', a:'書かない', choices:['書かない','書きない','書けない','書くない'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「ない」をつけて直前の音を見る。書か「ない」→ア段→五段活用</span><span class="exp-tip">💡 これが動詞の活用の種類を見分ける唯一の方法！</span>' },
    { q:'「書く」は何行何段活用？', sub:'未然形がア段', a:'カ行五段活用', choices:['カ行五段活用','カ行上一段活用','カ行下一段活用','カ変'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>未然形がア段（書か-ない）＝五段活用。行はカ行の音で変化（か・き・く・く・け・け）</span><span class="exp-tip">💡 「〜行〜活用」の「〜行」は変化する音の行！</span>' },
    { q:'「見る」に「ない」をつけると？', sub:'直前の音がイ段になる', a:'見ない', choices:['見ない','見らない','見るない','見ろない'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>見「ない」→イ段（み）→上一段活用</span><span class="exp-tip">💡 「み」はマ行のイ段の音！</span>' },
    { q:'「見る」は何活用？', sub:'未然形がイ段', a:'上一段活用', choices:['上一段活用','下一段活用','五段活用','カ変'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>未然形がイ段＝上一段活用</span><span class="exp-tip">💡 「イ段＋る」の形の動詞に多い！</span>' },
    { q:'「食べる」は何活用？', sub:'未然形がエ段', a:'下一段活用', choices:['下一段活用','上一段活用','五段活用','サ変'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>食べ「ない」→エ段（べ）→下一段活用</span><span class="exp-tip">💡 「エ段＋る」の形の動詞に多い！</span>' },
    { q:'「来る」「する」の活用の種類は？', sub:'この2語だけ特別な活用', a:'カ変とサ変', choices:['カ変とサ変','サ変とカ変','五段と五段','上一段と下一段'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「来る」はカ行変格活用、「する」はサ行変格活用</span><span class="exp-tip">💡 この2つだけの特別な活用。丸暗記するしかない！</span>' },
    { q:'「明日、公園へ行く『とき』は傘を持つ。」の「行く」の活用形は？', sub:'あとに体言が続く', a:'連体形', choices:['連体形','終止形','連用形','未然形'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>あとに体言（「とき」）が続く→連体形</span><span class="exp-tip">💡 終止形と形が同じ動詞も多いので、あとに続く言葉で判断！</span>' },
    { q:'「早く『走れ』ば間に合う。」の「走れ」の活用形は？', sub:'あとに「ば」が続く', a:'仮定形', choices:['仮定形','命令形','連用形','未然形'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>あとに「ば」が続く→仮定形</span><span class="exp-ng">❌ 命令形と字面が似ていても、「ば」が続けば仮定形！</span><span class="exp-tip">💡 「走れ。」で言い切りなら命令形、「走れば」なら仮定形！</span>' },
    { q:'「高い」の言い切りの形から分かる品詞は？', sub:'言い切りが「い」', a:'形容詞', choices:['形容詞','動詞','形容動詞','副詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>言い切りが「い」で終わる＝形容詞</span><span class="exp-tip">💡 形容詞と形容動詞には命令形がない（動詞だけの特別な活用形）！</span>' },
    { q:'「静かだ」の連体形は？', sub:'あとに体言が続く形', a:'静かな', choices:['静かな','静かだ','静かに','静かなら'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>形容動詞の連体形はあとに体言が続く形。「静かな（とき）」</span><span class="exp-ng">❌ 終止形「静かだ」と混同しないよう注意！</span><span class="exp-tip">💡 名詞を修飾するときは「〜な」の形になる！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_gram_s3_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 用言の活用</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 4: 助詞 =====
function renderSection4() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">助詞ってめちゃくちゃ数あるじゃん！「が」「の」「を」「から」…全部別々に覚えるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">助詞は4つのグループに分けると一気に整理できる。「体言について関係を示す」格助詞、「活用語について前後をつなぐ」接続助詞、「いろいろな語について意味を添える」副助詞、「文末について気持ちを表す」終助詞。まずグループの働きを覚えて、そのあとで個別の言葉を当てはめていこう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 助詞の4種類</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">格助詞</div>'
    + '<div class="ex">体言について、他の語との関係を示す</div>'
    + '<div class="ex">が・の・を・に・へ・と・より・から・で・や　など</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">接続助詞</div>'
    + '<div class="ex">活用する語（用言・助動詞）について、前後をつなぐ</div>'
    + '<div class="ex">ば・と・ても／でも・けれど（も）・が・のに・ので・から・し・て／で・ながら</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">副助詞</div>'
    + '<div class="ex">いろいろな語について、意味を添える</div>'
    + '<div class="ex">は・も・こそ・さえ・でも・しか・まで・ばかり・だけ・くらい／ぐらい</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">終助詞</div>'
    + '<div class="ex">文の終わりについて、話し手の気持ちを表す</div>'
    + '<div class="ex">か・な・なあ・ぞ・とも・わ・の・ね・よ</div>'
    + '<div class="note">⚠️ 同じ形の言葉（「が」「から」「で」）が種類によって別グループになる。直前が体言か活用語かを必ずチェック！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「学校『に』行く。」の「に」の種類は？', sub:'体言について場所・方向を示す', a:'格助詞', choices:['格助詞','接続助詞','副助詞','終助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>体言「学校」について場所・方向を示す＝格助詞</span><span class="exp-tip">💡 直前が体言なら格助詞の可能性が高い！</span>' },
    { q:'「疲れた『から』休む。」の「から」の種類は？', sub:'活用語について理由を示す', a:'接続助詞', choices:['接続助詞','格助詞','副助詞','終助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用語「疲れた」について、前後を理由でつなぐ＝接続助詞</span><span class="exp-tip">💡 「〜ので」に言い換えられる！</span>' },
    { q:'「これ『だけ』食べたい。」の「だけ」の種類は？', sub:'限定の意味を添える', a:'副助詞', choices:['副助詞','格助詞','接続助詞','終助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>いろいろな語について「限定」の意味を添える＝副助詞</span><span class="exp-tip">💡 体言にも活用語にもいろいろな語につくのが副助詞の特徴！</span>' },
    { q:'「もう帰る『よ』。」の「よ」の種類は？', sub:'文末について気持ちを表す', a:'終助詞', choices:['終助詞','副助詞','格助詞','接続助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>文末について話し手の気持ち（念押し）を表す＝終助詞</span><span class="exp-tip">💡 文の一番最後にくっつく助詞！</span>' },
    { q:'「雨『が』降っている『が』、出かける。」2つの「が」の種類の組み合わせは？', sub:'直前が体言か活用語かをそれぞれ見る', a:'格助詞と接続助詞', choices:['格助詞と接続助詞','接続助詞と格助詞','格助詞と格助詞','接続助詞と接続助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>1つ目は体言「雨」について主語を示す格助詞。2つ目は活用語「降っている」について逆接でつなぐ接続助詞</span><span class="exp-tip">💡 同じ「が」でも直前の語で種類が変わる典型例！</span>' },
    { q:'「彼『も』来る。」の「も」の種類は？', sub:'同類の意味を添える', a:'副助詞', choices:['副助詞','格助詞','終助詞','接続助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>いろいろな語について「同類」の意味を添える＝副助詞</span><span class="exp-tip">💡 「は・も・こそ・さえ・しか」は副助詞の代表選手！</span>' },
    { q:'「東京『から』来た。」の「から」の種類は？', sub:'体言について起点を示す', a:'格助詞', choices:['格助詞','接続助詞','副助詞','終助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>体言「東京」について起点（〜より）を示す＝格助詞</span><span class="exp-tip">💡 直前が体言か活用語かで、格助詞か接続助詞かが決まる！</span>' },
    { q:'「本『を』読ん『で』、感想を書く。」の「で」の種類は？', sub:'活用語について前後をつなぐ', a:'接続助詞', choices:['接続助詞','格助詞','副助詞','断定の助動詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用語「読ん」について前後をつなぐ＝接続助詞（「て」が濁音化した形）</span><span class="exp-tip">💡 「読みて」→「読んで」と変化した形！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_gram_s4_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 助詞のはたらき</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 5: 助動詞 =====
function renderSection5() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">助動詞、ここが一番出るってにっくん言ってたよね…緊張してきた。</div></div></div>'
    + '<div class="chat-line"><div class="avatar charC">車</div><div><div class="chat-name">くるま（令和ロマン）</div><div class="chat-bubble">きょんさん！大丈夫っすよ！助動詞なんて全部で10個くらいしかないんで！たった10個！！コンビニのおにぎりの種類より少ないっすよ！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">くるま、それただの数の話で励ましになってなくない！？でもちょっと元気出た！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">くるまの言う通り、数自体は多くない。ポイントは「同じ助動詞でも意味が複数ある」ことと「意味は接続（直前の言葉の形）で見分けられる」ことの2つだけだ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 主な助動詞の意味（最重要表）</div>'
    + '<div class="rule-box">'
    + '<div class="ex">れる・られる：受身・可能・自発・尊敬</div>'
    + '<div class="ex">せる・させる：使役</div>'
    + '<div class="ex">ない・ぬ（ん）：打消</div>'
    + '<div class="ex">う・よう：推量・意志・勧誘</div>'
    + '<div class="ex">た（だ）：過去・完了・存続・確認</div>'
    + '<div class="ex">そうだ：様態（連用形接続）／伝聞（終止形接続）</div>'
    + '<div class="ex">ようだ：比況・推定・例示</div>'
    + '<div class="ex">らしい：推定</div>'
    + '<div class="ex">だ・です：断定／ます：丁寧</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 接続のルール（見分けの手がかり）</div>'
    + '<div class="rule-box">'
    + '<div class="ex">未然形＋れる・られる・せる・させる・ない・う・よう</div>'
    + '<div class="ex">連用形＋た・そうだ（様態）・ます</div>'
    + '<div class="ex">終止形＋そうだ（伝聞）・らしい</div>'
    + '<div class="ex">体言＋だ・です</div>'
    + '<div class="note">💡 同じ「そうだ」でも接続の形が違えば意味が変わる。これがSection 6の識別問題の土台になる！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「先生に褒め『られる』。」の「られる」の意味は？', sub:'「（人）に〜される」と言い換えられる', a:'受身', choices:['受身','可能','自発','尊敬'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「（人）に〜される」と言い換えられる＝受身</span><span class="exp-tip">💡 「先生に」が動作をする相手を示している！</span>' },
    { q:'「5時に『起きられる』。」の「られる」の意味は？', sub:'「〜することができる」と言い換えられる', a:'可能', choices:['可能','受身','自発','尊敬'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「〜することができる」と言い換えられる＝可能</span><span class="exp-tip">💡 「起きることができる」に置き換え可能！</span>' },
    { q:'「昔のことが『思い出される』。」の「れる」の意味は？', sub:'「自然に〜してしまう」', a:'自発', choices:['自発','受身','可能','尊敬'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「自然に〜してしまう」という意味＝自発</span><span class="exp-tip">💡 「思い出す」「案じる」「感じる」など気持ちを表す動詞によく使われる！</span>' },
    { q:'「先生が『来られる』。」の「られる」の意味は？', sub:'「お（ご）〜になる」と言い換えられる', a:'尊敬', choices:['尊敬','受身','可能','自発'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「お（ご）〜になる」と言い換えられる＝尊敬</span><span class="exp-tip">💡 目上の人の動作に使う！</span>' },
    { q:'「無理やり手伝わ『せる』。」の「せる」の意味は？', sub:'他人に何かをやらせる', a:'使役', choices:['使役','受身','可能','尊敬'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「〜させる」＝他人に何かをやらせる意味＝使役</span><span class="exp-tip">💡 「せる・させる」はほぼ使役の意味だけと覚えてOK！</span>' },
    { q:'「明日は雨が降る『そうだ』。」（天気予報で聞いた）の種類は？', sub:'終止形「降る」に接続', a:'伝聞', choices:['伝聞','様態','推定','比況'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>終止形「降る」＋そうだ＝伝聞</span><span class="exp-tip">💡 人から聞いた情報を伝えるときに使う（〜という話だ）！</span>' },
    { q:'「今にも雨が降り『そうだ』。」（見た目の様子）の種類は？', sub:'連用形「降り」に接続', a:'様態', choices:['様態','伝聞','推定','比況'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>連用形「降り」＋そうだ＝様態</span><span class="exp-tip">💡 接続の形が伝聞（終止形）と違う点に注目！</span>' },
    { q:'「まるで天使の『ようだ』。」の種類は？', sub:'「まるで」がヒント', a:'比況', choices:['比況','推定','例示','伝聞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「まるで〜のようだ」＝比況（たとえ）</span><span class="exp-tip">💡 「まるで」という言葉が目印になることが多い！</span>' },
    { q:'「もうすぐ着く『らしい』。」（確かな根拠がある）の種類は？', sub:'根拠に基づく推定', a:'助動詞（推定）', choices:['助動詞（推定）','形容詞の一部','接尾語','伝聞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>何らかの根拠に基づく推定を表す助動詞</span><span class="exp-tip">💡 「いかにも〜だ」に言い換えられる接尾語の「らしい」とは働きが違う！</span>' },
    { q:'「昨日、公園で遊ん『だ』。」の「だ」の意味は？', sub:'「た」が濁音化した形', a:'過去', choices:['過去','断定','伝聞','推量'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「た」が濁音化した形で、過去の出来事を表す＝過去</span><span class="exp-ng">❌ 「静かだ」の断定の「だ」と形が同じでも意味・接続が違う！</span><span class="exp-tip">💡 動詞の後ろについていれば過去の「だ」の可能性が高い！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_gram_s5_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 助動詞の意味</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 6: まぎらわしい語の識別 =====
function renderSection6() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">ついに来たね…「識別」。ここが一番怖いってずっと聞いてた。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">怖がる必要はない。ここまでSection 1〜5で積んできた「品詞」「活用」「接続」の知識をそのまま使うだけだ。1つずつ、置き換えテストのやり方を覚えていこう。</div></div></div>'
    + '<div class="chat-line"><div class="avatar charD" style="background:#8b5cf6;color:#fff">蛙</div><div><div class="chat-name">イワクラ（蛙亭）</div><div class="chat-bubble">きょん、私からは斜め上のコツ。「ない」を見たら、まず心の中で「ぬ」に変換してみて。「食べぬ」って言えたら助動詞、言えなかったら形容詞。……ちなみに私は「イワクラぬ」とは言えない。名前だから。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">イワクラちゃん、その例えいる！？でも「ぬ」に変換、めっちゃわかりやすい！</div></div></div>'
    + '</div>';

  html += '<div class="konto-box">'
    + '<div class="konto-box-title">🎤 実演コント「『ない』の正体」</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん（挑戦者）</div><div class="chat-bubble">問題です！「お金がない」の「ない」は何でしょう！……えーっと、形容詞！なぜなら財布を見た瞬間の気持ちが形容詞っぽいから！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村（判定役）</div><div class="chat-bubble">気持ちで判定するな。「お金がぬ」と言えるか確認しろ。……言えないな？なら形容詞で正解だ。理由は勘じゃなく「ぬ」に置き換えられるかどうかだ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">結果オーライ！！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 「ない」の識別（3種類）</div>'
    + '<div class="rule-box">'
    + '<div class="ex">助動詞（打消）：動詞について、「ぬ」に置き換えられる（例：食べない→食べぬ ○）</div>'
    + '<div class="ex">形容詞：「存在しない」という意味そのもの、「ぬ」に置き換えられない（例：お金がない→お金がぬ ×）</div>'
    + '<div class="ex">補助形容詞：「〜ではない」の形、直前に「は」を入れられる（例：美しくない→美しくはない ○）</div>'
    + '<div class="note">⚠️ コツ：まず「ぬ」に置き換えてみる。置き換えられれば助動詞。置き換えられなければ形容詞か補助形容詞（「は」を入れられれば補助形容詞）！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 「れる・られる」の識別（4つの意味）</div>'
    + SVG.reruFlow
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 「そうだ」「らしい」「ようだ」の識別</div>'
    + '<div class="rule-box">'
    + '<div class="ex">そうだ：連用形接続→様態（見た目）／終止形接続→伝聞（人から聞いた話）</div>'
    + '<div class="ex">らしい：助動詞（根拠のある推定）／接尾語（「いかにも〜だ」に言い換え可、例：男らしい）</div>'
    + '<div class="ex">ようだ：比況（まるで〜のようだ）・推定（〜らしい様子）・例示（例えば〜のような）</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📖 「の」「で」「から」「が」の識別</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">の（格助詞の4つの用法）</div>'
    + '<div class="ex">主語の代用（〜が）：「私の作った料理」＝「私が作った料理」</div>'
    + '<div class="ex">連体修飾（〜の）：「私の本」</div>'
    + '<div class="ex">体言の代用（〜のもの・こと）：「これは私のだ」</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">で／から／が</div>'
    + '<div class="ex">で：格助詞（場所・手段）／断定の助動詞「だ」の連用形／接続助詞（動詞連用形＋て が濁った形）</div>'
    + '<div class="ex">から：格助詞（体言＋起点）／接続助詞（活用語＋理由）</div>'
    + '<div class="ex">が：格助詞（体言＋主語）／接続助詞（活用語＋逆接）</div>'
    + '<div class="note">💡 共通のコツ：直前が体言なら格助詞、直前が活用語（用言・助動詞）なら接続助詞や断定の助動詞の可能性！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「宿題が全然終わら『ない』。」の「ない」の種類は？', sub:'「ぬ」に置き換えられるか', a:'助動詞（打消）', choices:['助動詞（打消）','形容詞','補助形容詞','連体詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「終わらぬ」と言い換えられる＝助動詞（打消）</span><span class="exp-tip">💡 動詞について「ぬ」に置き換えられたら助動詞！</span>' },
    { q:'「教室に誰もい『ない』。」の「ない」の種類は？', sub:'「いぬ」とは言えない', a:'形容詞', choices:['形容詞','助動詞（打消）','補助形容詞','副詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「存在しない」という意味そのものを表す本来の形容詞</span><span class="exp-ng">❌ 「いぬ」とは言い換えられない！</span><span class="exp-tip">💡 「ある」の反対＝「ない」という単独の形容詞！</span>' },
    { q:'「この料理は辛く『ない』。」の「ない」の種類は？', sub:'「は」を入れられる', a:'補助形容詞', choices:['補助形容詞','助動詞（打消）','形容詞','副詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「辛くはない」と「は」を入れられる＝補助形容詞</span><span class="exp-tip">💡 「〜くない」「〜ではない」の形が目印！</span>' },
    { q:'「今にも泣き出し『そうだ』。」の種類は？', sub:'連用形に接続', a:'様態', choices:['様態','伝聞','推定','比況'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>連用形「泣き出し」に接続＝様態（見た目の様子）</span><span class="exp-tip">💡 見ただけで判断できる様子を表す！</span>' },
    { q:'「あの店は美味しい『そうだ』。」（噂で聞いた）の種類は？', sub:'終止形に接続', a:'伝聞', choices:['伝聞','様態','推定','比況'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>終止形「美味しい」に接続＝伝聞</span><span class="exp-tip">💡 人から聞いた話を伝えるときに使う！</span>' },
    { q:'「彼は転校する『らしい』。」（確かな根拠がある推測）の種類は？', sub:'根拠に基づく推定', a:'助動詞（推定）', choices:['助動詞（推定）','接尾語','形容詞そのもの','副詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>何かの証拠・情報に基づいた推定＝助動詞</span><span class="exp-ng">❌ 「いかにも〜だ」には言い換えられない！</span><span class="exp-tip">💡 「〜という情報がある」ときの推定！</span>' },
    { q:'「彼は本当に男『らしい』性格だ。」の種類は？', sub:'「いかにも〜だ」に言い換え可', a:'接尾語', choices:['接尾語','助動詞（推定）','形容動詞','副詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「いかにも男だ」の意味に言い換えられる＝接尾語（形容詞を作る）</span><span class="exp-tip">💡 性質・特徴を表すときの「らしい」！</span>' },
    { q:'「この本は、『私の』作った本だ。」の「の」の働きは？', sub:'「〜が」に言い換えられるか', a:'主語の代用', choices:['主語の代用','連体修飾','体言の代用','並立'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「私が作った本」と言い換えられる＝主語の代用</span><span class="exp-tip">💡 「〜の」を「〜が」に置き換えて意味が通れば主語の代用！</span>' },
    { q:'「この本は『私の』だ。」の「の」の働きは？', sub:'「私のもの」の意味', a:'体言の代用', choices:['体言の代用','主語の代用','連体修飾','並立'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「私のもの」の意味を表す＝体言の代用</span><span class="exp-tip">💡 「の」のあとに「もの・こと」を補える！</span>' },
    { q:'「駅『で』待ち合わせる。」の「で」の種類は？', sub:'体言について場所を示す', a:'格助詞', choices:['格助詞','断定の助動詞','接続助詞','副助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>体言「駅」について場所を示す＝格助詞</span><span class="exp-tip">💡 直前が体言なので格助詞！</span>' },
    { q:'「疲れた『から』、少し休もう。」の「から」の種類は？', sub:'活用語について理由を示す', a:'接続助詞', choices:['接続助詞','格助詞','副助詞','終助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用語「疲れた」について理由を示す＝接続助詞</span><span class="exp-tip">💡 「ので」に言い換えられる！</span>' },
    { q:'「早く行きたい『が』、時間がない。」の「が」の種類は？', sub:'活用語について逆接を示す', a:'接続助詞', choices:['接続助詞','格助詞','副助詞','終助詞'],
      exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用語「行きたい」について逆接（〜けれど）でつなぐ＝接続助詞</span><span class="exp-tip">💡 体言についていないので格助詞ではない！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_gram_s6_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — まぎらわしい語の識別</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:5, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 5)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

// ===== SECTION 7: 確認テスト =====
function renderSection7() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📖 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">Section 1〜6の総まとめだ。文節・品詞・活用・助詞・助動詞・識別——全部出るよ。焦らず自分のペースで解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'「私は昨日、友達と映画を見た。」の文節数は？', sub:'ネを入れて区切る', a:'5', choices:['5','6','4','7'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>私はネ／昨日ネ／友達とネ／映画をネ／見たネ → 5文節</span><span class="exp-tip">💡 「ネ」を入れて区切ってみる！</span>' },
    { q:'「静かに『座って』いる。」の「座って」と「いる」の関係は？', sub:'「〜て＋いる」の形', a:'補助の関係', choices:['補助の関係','並立の関係','主・述の関係','修飾・被修飾の関係'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「〜て＋いる」は補助の関係</span><span class="exp-tip">💡 前が意味の中心、後ろは補助！</span>' },
    { q:'「まるで、氷『のようだ』。」の「ようだ」の種類は？', sub:'「まるで」がヒント', a:'比況', choices:['比況','推定','例示','伝聞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「まるで〜のようだ」＝比況</span><span class="exp-tip">💡 「まるで」は比況の合図！</span>' },
    { q:'「桜『の』咲く季節。」の「の」の働きは？', sub:'「桜が咲く」と言い換え可', a:'主語の代用', choices:['主語の代用','連体修飾','体言の代用','並立'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「桜が咲く季節」と言い換えられる＝主語の代用</span><span class="exp-tip">💡 「の」を「が」に置き換えて意味が通るか確認！</span>' },
    { q:'「彼女は歌が上手『だ』。」の「だ」の品詞・意味は？', sub:'体言（形容動詞語幹）につく', a:'助動詞（断定）', choices:['助動詞（断定）','助動詞（過去）','形容動詞の一部','助詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>言い切りにつく「だ」で「〜である」の意味＝断定の助動詞</span><span class="exp-tip">💡 「上手だ」の「だ」は名詞的な語につく断定！</span>' },
    { q:'「叫ぶ」の活用の種類は？', sub:'「ない」をつけて直前の音を見る', a:'バ行五段活用', choices:['バ行五段活用','バ行上一段活用','マ行五段活用','バ行下一段活用'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>叫ば「ない」→ア段→五段活用。バ行の音で変化（ば・び・ぶ・ぶ・べ・べ）</span><span class="exp-tip">💡 「行」はカ行だけじゃない。バ行でもマ行でもラ行でも、未然形がア段になれば五段活用（Section 3の「行と段は別の話」を復習！）</span>' },
    { q:'「大きな『声』で笑う。」の「声」の品詞は？', sub:'活用しない自立語で主語になれる', a:'名詞', choices:['名詞','形容詞','連体詞','副詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用しない自立語で主語になれる＝名詞</span><span class="exp-tip">💡 「声が」と「が」をつけられる！</span>' },
    { q:'「あの『大きな』家。」の「大きな」の品詞は？', sub:'活用しない・体言だけを修飾', a:'連体詞', choices:['連体詞','形容詞','形容動詞','副詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用せず体言だけを修飾する＝連体詞</span><span class="exp-ng">❌ 形容詞に見えるが「大きい」のように活用しないので形容詞ではない！</span><span class="exp-tip">💡 「この・その・あの・大きな・小さな」は連体詞の仲間！</span>' },
    { q:'「本『を』貸してください。」の「を」の種類は？', sub:'体言について対象を示す', a:'格助詞', choices:['格助詞','接続助詞','副助詞','終助詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>体言「本」について動作の対象を示す＝格助詞</span><span class="exp-tip">💡 直前が体言なら格助詞！</span>' },
    { q:'「食べたい『けれど』我慢する。」の「けれど」の種類は？', sub:'活用語について逆接でつなぐ', a:'接続助詞', choices:['接続助詞','接続詞','副助詞','終助詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用語「食べたい」にくっついて逆接でつなぐ＝接続助詞</span><span class="exp-ng">❌ 独立した1つの文節を作る「接続詞」とは違う！</span><span class="exp-tip">💡 前の語にくっつく付属語なら助詞！</span>' },
    { q:'「先生に皆さんが褒め『られた』。」の「られ」の意味は？', sub:'「（人）に〜される」', a:'受身', choices:['受身','可能','自発','尊敬'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「（人）に〜される」と言い換えられる＝受身</span><span class="exp-tip">💡 「先生に」が動作をする相手！</span>' },
    { q:'「暗い場所でも黒板の字が読ま『れる』。」の「れる」の意味は？', sub:'「ことができる」に言い換え可', a:'可能', choices:['可能','受身','自発','尊敬'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「読むことができる」と言い換えられる＝可能</span><span class="exp-tip">💡 「〜できる」に置き換えられたら可能！</span>' },
    { q:'「明日は晴れる『そうだ』。」（天気予報で聞いた）の種類は？', sub:'終止形に接続', a:'伝聞', choices:['伝聞','様態','推定','比況'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>終止形「晴れる」に接続＝伝聞</span><span class="exp-tip">💡 情報を人から聞いたときに使う！</span>' },
    { q:'「今にも壊れ『そうだ』。」の種類は？', sub:'連用形に接続', a:'様態', choices:['様態','伝聞','推定','比況'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>連用形「壊れ」に接続＝様態</span><span class="exp-tip">💡 見た目の様子を表す！</span>' },
    { q:'「宿題を忘れ『ない』ようにする。」の「ない」の種類は？', sub:'「忘れぬ」と言い換え可', a:'助動詞（打消）', choices:['助動詞（打消）','形容詞','補助形容詞','連体詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「忘れぬ」と言い換えられる＝助動詞（打消）</span><span class="exp-tip">💡 動詞について「ぬ」に置き換えOK！</span>' },
    { q:'「この料理は辛く『ない』。」の「ない」の種類は？', sub:'「は」を入れられる', a:'補助形容詞', choices:['補助形容詞','助動詞（打消）','形容詞','副詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「辛くはない」と「は」を入れられる＝補助形容詞</span><span class="exp-tip">💡 「〜くない」の形が目印！</span>' },
    { q:'「彼は本当に子供『らしい』笑顔だ。」の「らしい」の種類は？', sub:'「いかにも〜だ」に言い換え可', a:'接尾語', choices:['接尾語','助動詞（推定）','形容動詞','副詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「いかにも子供だ」に言い換えられる＝接尾語</span><span class="exp-tip">💡 性質・特徴を表すときの「らしい」！</span>' },
    { q:'「もうすぐ雨が止む『らしい』。」（ニュースで見た情報から）の種類は？', sub:'根拠に基づく推定', a:'助動詞（推定）', choices:['助動詞（推定）','接尾語','形容詞','副詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>情報・根拠に基づいた推定＝助動詞</span><span class="exp-tip">💡 「いかにも〜だ」には言い換えられない！</span>' },
    { q:'「これは『兄の』カメラだ。」の「の」の働きは？', sub:'そのまま「〜の」の意味', a:'連体修飾', choices:['連体修飾','主語の代用','体言の代用','並立'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「兄の（持ち物である）カメラ」＝連体修飾</span><span class="exp-tip">💡 「〜が」に言い換えると不自然なら連体修飾！</span>' },
    { q:'「公園『で』遊ぶ。」の「で」の種類は？', sub:'体言について場所を示す', a:'格助詞', choices:['格助詞','断定の助動詞','接続助詞','副助詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>体言「公園」について場所を示す＝格助詞</span><span class="exp-tip">💡 直前が体言なので格助詞！</span>' },
    { q:'「彼は学生『で』、まだ働いていない。」の「で」の種類は？', sub:'「学生だ」の連用形', a:'断定の助動詞（だの連用形）', choices:['断定の助動詞（だの連用形）','格助詞','接続助詞','副助詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>「学生だ」の「だ」が連用形に変化した形＝断定の助動詞</span><span class="exp-tip">💡 体言「学生」＋「で」で、あとに文が続く形！</span>' },
    { q:'「駅『から』歩いて5分だ。」の「から」の種類は？', sub:'体言について起点を示す', a:'格助詞', choices:['格助詞','接続助詞','副助詞','終助詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>体言「駅」について起点を示す＝格助詞</span><span class="exp-tip">💡 直前が体言！</span>' },
    { q:'「雨が降っている『が』、傘を持っていない。」の「が」の種類は？', sub:'活用語について逆接', a:'接続助詞', choices:['接続助詞','格助詞','副助詞','終助詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>活用語「降っている」について逆接でつなぐ＝接続助詞</span><span class="exp-tip">💡 直前が活用語！</span>' },
    { q:'「風『が』強い。」の「が」の種類は？', sub:'体言について主語を示す', a:'格助詞', choices:['格助詞','接続助詞','副助詞','終助詞'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>体言「風」について主語を示す＝格助詞</span><span class="exp-tip">💡 直前が体言！</span>' },
    { q:'「明日は早く起き『よう』。」の「よう」の意味は？', sub:'自分の行動についての決意', a:'意志', choices:['意志','推量','勧誘','受身'], exp:'<span class="exp-rule"><span class="label">📖 ルール</span>自分の行動についての決意を表す＝意志</span><span class="exp-tip">💡 「みんなで〜しよう」なら勧誘、一人の決意なら意志！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_gram_s7_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">📝 確認テスト — 全セクション総まとめ（25問）</div>';
  qs.forEach(function(q, i) {
    var qid = q._qid;
    qMeta[qid] = { type:'choice', answer:q.a, xp:3, jp:q.q, choices:q.choices };
    html += '<div class="q-card" data-card="' + qid + '">'
      + '<div class="q-number">Q' + (i+1) + ' / ' + qs.length + '</div>'
      + '<div class="q-text">' + q.q + '</div>'
      + (q.sub ? '<div class="q-sub">' + q.sub + '</div>' : '')
      + makeChoices(qid, q.choices, q.a, 3)
      + makeFeedback(qid, q.exp)
      + '</div>';
  });
  html += '</div>';
  return html;
}

function showFinalResult() {
  var s7qids = [];
  for (var i = 0; i < 25; i++) { s7qids.push('jpn_gram_s7_q' + i); }
  var correct = 0, total = 0;
  s7qids.forEach(function(qid) {
    if (answeredSet[qid]) {
      total++;
      var d = weakDB[qid];
      if (d && d.correct > 0) correct++;
    }
  });
  var pct = total > 0 ? Math.round(correct / total * 100) : 0;
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '📺' : '🎤';
  var msg = pct >= 90
    ? 'きょん「文法、全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。中1〜3の文法は完全に君のものだね」'
    : pct >= 70
    ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50
    ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。識別問題を中心に復習しよう」'
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
  if (rwb) rwb.addEventListener('click', function(){ closeResult(); goSection(8); });
  var rrb = document.getElementById('res_retry_btn');
  if (rrb) rrb.addEventListener('click', function(){ closeResult(); goSection(7); });
  var rsb = document.getElementById('res_s1_btn');
  if (rsb) rsb.addEventListener('click', function(){ closeResult(); goSection(1); });
}

function closeResult() { document.getElementById('resultOverlay').style.display = 'none'; }

// ===== 弱点ノート =====
function renderWeakNote() {
  currentSection = 8;
  renderTabs();
  var mc = document.getElementById('mainContent');
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('jpn_gram_') === 0; });
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
  if (gtb) gtb.addEventListener('click', function() { goSection(9); });
}

// ===== 特訓モード =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };

function renderTokkuMode() {
  currentSection = 9;
  renderTabs();
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');

  if (wqs.length === 0) {
    mc.innerHTML = '<div class="tokku-complete">'
      + '<div class="tokku-complete-emoji">🏆</div>'
      + '<div class="tokku-complete-title">弱点ゼロ！</div>'
      + '<div class="tokku-complete-msg">きょん「俺、文法無敵になったわ！！」<br>西村「本当に成長したね」</div>'
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

  var bodyHtml = '';
  if (hasChoices) {
    bodyHtml = '<div class="tokku-choices">'
      + shuffled.map(function(c) {
          return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c.replace(/"/g, '&quot;') + '">' + c + '</button>';
        }).join('')
      + '</div>';
  } else {
    bodyHtml = '<div class="input-wrap" style="justify-content:center;margin-top:12px">'
      + '<input class="q-input" id="tokku_inp" type="text" placeholder="答えを入力" style="max-width:200px">'
      + '<button id="tokku_inp_btn" style="background:var(--purple);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">確認</button>'
      + '</div>';
  }

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

  var inpBtn = document.getElementById('tokku_inp_btn');
  if (inpBtn) inpBtn.addEventListener('click', function() { handleTokkuInput(qid); });
  var inp = document.getElementById('tokku_inp');
  if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleTokkuInput(qid); });
}

function handleTokkuInput(qid) {
  var inp = document.getElementById('tokku_inp');
  if (!inp) return;
  var val = inp.value.trim();
  if (!val) return;
  var d = weakDB[qid];
  if (!d) return;
  var norm = function(s) { return s.trim().replace(/\s+/g,'').toLowerCase(); };
  var correct = norm(val) === norm(d.answer);
  applyTokkuResult(qid, correct, d);
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
      deductXP(3);
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
