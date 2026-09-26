// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「古文？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなく古文の言葉がわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺、古文いけるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺、平安時代に住んでた？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより古語くわしくなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「古文で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「主語、もう見失わない」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (xpVal >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
var xp           = parseInt(localStorage.getItem('jpn_xp') || '0');
var answeredSet  = JSON.parse(localStorage.getItem('jpn_kobun_answered') || '{}');
var sectionDone  = JSON.parse(localStorage.getItem('jpn_kobun_sections') || '{}');
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
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
}
function addXP(pts, qid) {
  if (answeredSet[qid]) return false;
  var oldLv = getLevel(xp).lv;
  xp += pts;
  answeredSet[qid] = true;
  localStorage.setItem('jpn_xp', xp);
  localStorage.setItem('jpn_kobun_answered', JSON.stringify(answeredSet));
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
    return id.indexOf('jpn_kobun_') === 0 && getPct(id) < 80;
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
    'きょん「やった！にっくんより古文くわしいかも！」',
    'きょん「待って待って、平安時代の人の気持ちわかってきた！！」',
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
  localStorage.setItem('jpn_kobun_answered', JSON.stringify(answeredSet));
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
  var prefix = 'jpn_kobun_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id) { return id.indexOf(prefix) === 0; });
  if (sqs.length === 0) return;
  if (sqs.every(function(id) { return answeredSet[id]; })) {
    sectionDone[currentSection] = true;
    localStorage.setItem('jpn_kobun_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'🏯 スタート',        title:'古文、基礎からまとめて片付けよう', sub:'仮名遣い・単語・文法・読解のコツを1ページで総整理' },
  { id:1, label:'歴史的仮名遣い',      title:'歴史的仮名遣い',                   sub:'読み方の変換ルールを覚える（すべての古文の土台）' },
  { id:2, label:'古文単語・言い回し',  title:'古文単語・言い回し',               sub:'現代語と意味が違う「だまされやすい語」を押さえる' },
  { id:3, label:'呼応の副詞',          title:'呼応の副詞（セット言い回し）',     sub:'離れていてもセットで読む決まり文句' },
  { id:4, label:'過去・完了・打消',    title:'過去・完了・打消の基本',           sub:'物語の時間の流れをつかむための最重要助動詞' },
  { id:5, label:'係り結び',            title:'係り結びの法則',                   sub:'「ぞ・なむ・や・か・こそ」の後の変化を見抜く' },
  { id:6, label:'主語をつかむ技術',    title:'主語をつかむ技術',                 sub:'省略された主語を敬語で見抜く、読解の核心スキル' },
  { id:7, label:'確認テスト',          title:'確認テスト',                       sub:'古文基礎の総まとめ20問！' },
  { id:8, label:'📊弱点',              title:'弱点ノート',                       sub:'間違えた問題の正答率を確認しよう' },
  { id:9, label:'🔥特訓',              title:'弱点特訓モード',                   sub:'弱点問題だけを集中練習！' },
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
    + '<div class="section-badge">国語 古文基礎 · SECTION ' + id + '</div>'
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
  keigoFlow: '<svg viewBox="0 0 340 220" style="width:100%;max-width:380px;display:block;margin:0 auto">'
    + '<rect x="10" y="10" width="320" height="52" rx="8" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
    + '<text x="170" y="32" fill="#a371f7" font-size="12" text-anchor="middle">動作に「たまふ・おはす・のたまふ」</text>'
    + '<text x="170" y="50" fill="#a371f7" font-size="12" text-anchor="middle">など尊敬語がついている</text>'
    + '<path d="M 170,62 L 170,78" stroke="#8b949e" stroke-width="2" marker-end="url(#kArrow)"/>'
    + '<rect x="10" y="80" width="320" height="42" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
    + '<text x="170" y="106" fill="#3fb950" font-size="13" text-anchor="middle">→ その動作をする人が目上（貴族・天皇など）</text>'
    + '<rect x="10" y="132" width="320" height="52" rx="8" fill="rgba(233,69,96,0.12)" stroke="#e94560" stroke-width="2"/>'
    + '<text x="170" y="154" fill="#e94560" font-size="12" text-anchor="middle">動作に「たてまつる・まうす」</text>'
    + '<text x="170" y="172" fill="#e94560" font-size="12" text-anchor="middle">など謙譲語がついている</text>'
    + '<path d="M 170,184 L 170,196" stroke="#8b949e" stroke-width="2" marker-end="url(#kArrow)"/>'
    + '<defs><marker id="kArrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#8b949e"/></marker></defs>'
    + '</svg>'
    + '<div style="text-align:center;font-size:12px;color:var(--red);margin-top:4px">→ その動作を受ける人（相手）が目上</div>',
};

// ===== SECTION 0: 導入 =====
function renderSection0() {
  return '<div class="intro-box">'
    + '<div class="intro-box-title">🏯 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">古文、何が書いてあるか本当にわからない…知ってる漢字も少ないし、話の筋も追えない！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">古文が読めない原因は、実はほとんどがたった3つに絞れる。①仮名遣いが読めない、②単語の意味を現代語で誤解している、③主語が省略されていて誰の話かわからなくなる。この3つを順番に潰せば、驚くほど読めるようになる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">3つだけでいいの！？よし、それならいけそうな気がしてきた！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">ちなみに、きょんが好きな「あはれ！名作くん」の「あはれ」は、まさに今日習う古文単語そのものだ。「しみじみと心を動かされる」という意味の古語で、平安時代の人が一番よく使った感動の言葉だった。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">えっ！？あのタイトルの「あはれ」、そういう意味だったの！？知らずに1000回くらい言ってたわ！！</div></div></div>'
    + '</div>'
    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:12px">🏯 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：歴史的仮名遣い（読み方の土台）<br>'
    + 'Section 2：古文単語・言い回し（だまされやすい語）<br>'
    + 'Section 3：呼応の副詞（セットで読む決まり文句）<br>'
    + 'Section 4：過去・完了・打消の基本（時間の流れをつかむ）<br>'
    + 'Section 5：係り結びの法則<br>'
    + 'Section 6：主語をつかむ技術（敬語で人物を見抜く）<br>'
    + 'Section 7：確認テスト（総合20問）'
    + '</div></div>'
    + '<div style="text-align:center;margin-top:16px">'
    + '<a href="jpn_kobun_konto.html" style="display:inline-block;background:linear-gradient(135deg,var(--purple),#7c3aed);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:bold;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(163,113,247,0.4)">🎭 名作くんメンバーの古文コント台本（印刷用）を見る</a>'
    + '</div>'
    + '<div style="text-align:center;margin-top:10px">'
    + '<a href="jpn_kobun_reference.html" style="display:inline-block;background:transparent;border:1px dashed var(--gold);color:var(--gold);text-decoration:none;padding:10px 22px;border-radius:10px;font-size:13px;font-weight:bold;letter-spacing:0.5px">📜 古文まとめ（重要古語60・助動詞・原文などの一覧）を見る</a>'
    + '</div>'
    + '<button class="start-btn" data-goto="1">🏯 Section 1 から始める →</button>';
}

// ===== SECTION 1: 歴史的仮名遣い =====
function renderSection1() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🏯 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">古文の文章、読み方から違うから何が書いてあるか全然わからない！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">それは「歴史的仮名遣い」を知らないだけだ。ルールはそんなに多くない。語の途中や終わりにある「は・ひ・ふ・へ・ほ」は「わ・い・う・え・お」に読み替える——これだけで古文の見た目がぐっと現代語に近づく。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🏯 歴史的仮名遣い→現代仮名遣いの変換ルール</div>'
    + '<div class="rule-box">'
    + '<div class="ex">語の途中・終わりの「は・ひ・ふ・へ・ほ」→「わ・い・う・え・お」（例：いふ→いう）</div>'
    + '<div class="note">⚠️ 語の一番はじめの「は・ひ・ふ・へ・ほ」はそのまま変わらない（例：花＝はな のまま）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="ex">「ゐ・ゑ・を」→「い・え・お」（例：ゐなか→いなか、こゑ→こえ、をとこ→おとこ）</div>'
    + '<div class="ex">「ぢ・づ」→「じ・ず」（例：もみぢ→もみじ）</div>'
    + '<div class="ex">「くわ・ぐわ」→「か・が」</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">母音が連続するときの変化</div>'
    + '<div class="ex">「au」の音→「ou」（例：まうす[mausu]→もうす[mousu]）</div>'
    + '<div class="ex">「iu」の音→「yuu」</div>'
    + '<div class="ex">「eu」の音→「you」（例：けふ[keu]→きょう[kyou]）</div>'
    + '<div class="note">💡 声に出して読むと変化のイメージがつかみやすい！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「いふ」を現代仮名遣いに直すと？', sub:'語中の「ふ」→「う」', a:'いう', choices:['いう','いふ','いゆ','いを'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>語の途中の「ふ」は「う」に読み替える</span><span class="exp-tip">💡 いふ（言ふ）＝現代語の「言う」！</span>' },
    { q:'「あはれ」を現代仮名遣いに直すと？', sub:'語中の「は」→「わ」', a:'あわれ', choices:['あわれ','あはれ','あやれ','あをれ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>語の途中の「は」は「わ」に読み替える</span><span class="exp-tip">💡 「あはれ」は次のSectionで習う超重要な古文単語！</span>' },
    { q:'「ゐなか」を現代仮名遣いに直すと？', sub:'「ゐ」→「い」', a:'いなか', choices:['いなか','ゑなか','をなか','うなか'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ゐ」は「い」に読み替える</span><span class="exp-tip">💡 「ゐなか」＝「田舎」！</span>' },
    { q:'「こゑ」を現代仮名遣いに直すと？', sub:'「ゑ」→「え」', a:'こえ', choices:['こえ','こい','こを','こう'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ゑ」は「え」に読み替える</span><span class="exp-tip">💡 「こゑ」＝「声」！</span>' },
    { q:'「をとこ」を現代仮名遣いに直すと？', sub:'「を」→「お」', a:'おとこ', choices:['おとこ','わとこ','うとこ','いとこ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「を」は「お」に読み替える</span><span class="exp-tip">💡 「をとこ」＝「男」！（助詞の「を」はそのまま）</span>' },
    { q:'「けふ」を現代仮名遣いに直すと？', sub:'母音の連続「eu」→「you」', a:'きょう', choices:['きょう','けう','けふう','きゆう'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「eu」の音は融合して「you」になる</span><span class="exp-tip">💡 「けふ」＝「今日」！</span>' },
    { q:'「まうす」を現代仮名遣いに直すと？', sub:'母音の連続「au」→「ou」', a:'もうす', choices:['もうす','まうす','もおす','みょうす'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「au」の音は融合して「ou」になる</span><span class="exp-tip">💡 「まうす」＝「申す」！</span>' },
    { q:'「もみぢ」を現代仮名遣いに直すと？', sub:'「ぢ」→「じ」', a:'もみじ', choices:['もみじ','もみち','もみぎ','もみひ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ぢ」は「じ」に読み替える</span><span class="exp-tip">💡 「もみぢ」＝「紅葉」！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_kobun_s1_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 歴史的仮名遣い</div>';
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

// ===== SECTION 2: 古文単語・言い回し（だまされやすい語） =====
function renderSection2() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🏯 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">古文の単語って、知ってる漢字と同じ形なのに意味が全然違うことがあるって聞いた！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">それが「古今異義語」だ。一番のひっかけポイントで、入試でも狙われやすい。現代語の感覚のまま読むと、真逆の意味に誤読することもある。今の意味を一度忘れて、古語としての意味を上書きするつもりで覚えよう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🏯 だまされやすい古文単語（古今異義語）</div>'
    + '<div class="rule-box">'
    + '<div class="ex">あはれなり：しみじみと心を動かされる（「かわいそう」だけではない）</div>'
    + '<div class="ex">をかし：趣がある、興味深い（「おかしい＝変」ではない。枕草子で頻出）</div>'
    + '<div class="ex">うつくし：かわいらしい（現代の「美しい」より「かわいい」に近い）</div>'
    + '<div class="ex">ありがたし：めったにない、貴重だ（「感謝」の意味ではない）</div>'
    + '<div class="note">⚠️ 現代語と同じ漢字・見た目でも、意味は別物として覚え直す！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="ex">つとめて：早朝（「努力する」ではない）</div>'
    + '<div class="ex">やがて：すぐに（現代の「やがて＝しばらくして」とは逆に近い）</div>'
    + '<div class="ex">ののしる：大声で騒ぐ（「悪口を言う」ではない）</div>'
    + '<div class="ex">おどろく：はっと気づく、目が覚める（「驚愕する」ではない）</div>'
    + '<div class="ex">あやし：不思議だ／身分が低い</div>'
    + '<div class="ex">いみじ：程度がはなはだしい（良い意味にも悪い意味にも使う）</div>'
    + '<div class="ex">げに：本当に、なるほど</div>'
    + '<div class="ex">ゆかし：見たい、知りたい、心惹かれる</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「あはれなり」の意味は？', sub:'「あはれ！名作くん」の「あはれ」', a:'しみじみと心を動かされる', choices:['しみじみと心を動かされる','かわいそうという意味だけ','怒りを感じる','あきれる'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「あはれなり」＝しみじみとした趣・感動を表す最重要古語</span><span class="exp-ng">❌ 現代語の「哀れ＝かわいそう」だけの意味だと誤解しやすい</span><span class="exp-tip">💡 「あはれ！名作くん」のタイトルの由来と同じ言葉！</span>' },
    { q:'「をかし」の意味は？', sub:'枕草子で頻出', a:'趣がある、興味深い', choices:['趣がある、興味深い','おかしくて笑える','変だ、異常だ','疲れた'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「をかし」＝知的な面白さ・趣を表す（枕草子のキーワード）</span><span class="exp-ng">❌ 現代語の「おかしい＝変」と混同しやすい</span><span class="exp-tip">💡「あはれ」としばしば対で語られる、平安文学の重要語！</span>' },
    { q:'「うつくし」の意味は？', sub:'平安時代の主な意味', a:'かわいらしい', choices:['かわいらしい','美人だ','清潔だ','立派だ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「うつくし」＝小さいものへの「かわいらしい」という気持ち</span><span class="exp-tip">💡 竹取物語のかぐや姫の描写などで頻出！</span>' },
    { q:'「ありがたし」の意味は？', sub:'「有り難し」の元の意味', a:'めったにない、貴重だ', choices:['めったにない、貴重だ','感謝したい気持ち','たやすい','当然だ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「有り」＋「難し」＝存在するのが難しい＝めったにない</span><span class="exp-ng">❌ 現代語の「ありがたい＝感謝」とは違う！</span><span class="exp-tip">💡 漢字をそのまま分解すると意味が見える古今異義語の代表！</span>' },
    { q:'「つとめて」の意味は？', sub:'時間を表す言葉', a:'早朝', choices:['早朝','夜遅く','努力して','急いで'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「つとめて」＝早朝のこと</span><span class="exp-ng">❌ 「努めて（努力して）」と読み間違えやすい！</span><span class="exp-tip">💡 「暁（あかつき）」「つとめて」など時間帯を表す語も頻出！</span>' },
    { q:'「やがて」の意味は？', sub:'現代語とは時間感覚が逆に近い', a:'すぐに', choices:['すぐに','しばらくしてから','結局','ときどき'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「やがて」＝間を置かず、すぐに</span><span class="exp-ng">❌ 現代語の「やがて＝しばらくして」のつもりで読むと時間感覚がずれる！</span><span class="exp-tip">💡 ストーリーの時間の流れを誤読しやすい要注意語！</span>' },
    { q:'「ののしる」の意味は？', sub:'音に関する言葉', a:'大声で騒ぐ', choices:['大声で騒ぐ','悪口を言う','静かに話す','泣き叫ぶ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ののしる」＝大声を立てて騒ぐこと</span><span class="exp-ng">❌ 現代語の「罵る＝悪口を言う」ではない！</span><span class="exp-tip">💡 良い意味（評判が高い）で使われることもある！</span>' },
    { q:'「おどろく」の意味は？', sub:'感覚・意識の変化', a:'はっと気づく、目が覚める', choices:['はっと気づく、目が覚める','非常に驚愕する','怖がる','怒る'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「おどろく」＝意識がはっきりする、気づく</span><span class="exp-ng">❌ 現代語の「驚愕する」ほど強い意味ではない！</span><span class="exp-tip">💡 「目を覚ます」の意味で使われることが特に多い！</span>' },
    { q:'「いみじ」の意味は？', sub:'程度を表す言葉', a:'程度がはなはだしい（良くも悪くも）', choices:['程度がはなはだしい（良くも悪くも）','必ず良いことだ','必ず悪いことだ','少しだけ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「いみじ」＝とても、はなはだしい（プラスにもマイナスにも使う）</span><span class="exp-tip">💡 文脈によって「すばらしい」にも「ひどい」にもなる！</span>' },
    { q:'「ゆかし」の意味は？', sub:'心が向かう気持ち', a:'見たい、知りたい、心惹かれる', choices:['見たい、知りたい、心惹かれる','行きやすい','ゆるやかだ','ゆかいだ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ゆかし」＝心が惹かれて見たい・知りたいと思う気持ち</span><span class="exp-tip">💡 「行く」とは関係ない、感情を表す形容詞！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_kobun_s2_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 古文単語・言い回し</div>';
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

// ===== SECTION 3: 呼応の副詞 =====
function renderSection3() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🏯 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「言い回しの定型文」ってやつ、これのこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">まさにそれだ。「呼応の副詞」は、文の前の方に出てきた言葉が、文の終わりの決まった形と手をつないでセットで意味を作る。前だけ見て訳すと逆の意味に取ってしまうから、必ずセットで覚えよう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🏯 セットで読む決まり文句</div>'
    + '<div class="rule-box">'
    + '<div class="ex">え〜（打消）：〜できない（例：え言はず＝言うことができない）</div>'
    + '<div class="ex">つゆ〜（打消）：まったく〜ない</div>'
    + '<div class="ex">さらに〜（打消）：まったく〜ない</div>'
    + '<div class="ex">よに〜（打消）：決して〜ない</div>'
    + '<div class="note">⚠️ 「え」「つゆ」「さらに」だけを見て訳を決めず、文末の打消（ず・じ等）とセットで初めて意味が完成する！</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="ex">な〜そ：〜するな（禁止）（例：な泣きそ＝泣くな）</div>'
    + '<div class="ex">いかで〜（む）：どうにかして〜したい（願望）</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「え言はず」の意味は？', sub:'「え〜打消」のセット', a:'言うことができない', choices:['言うことができない','決して言わない','すぐに言う','言うつもりだ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「え〜（打消）」＝〜できない</span><span class="exp-tip">💡 「え」だけでは意味が完成しない。文末の打消とセットで訳す！</span>' },
    { q:'「つゆ知らず」の意味は？', sub:'「つゆ〜打消」のセット', a:'まったく知らない', choices:['まったく知らない','少しは知っている','いつか知るだろう','知りたい'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「つゆ〜（打消）」＝まったく〜ない</span><span class="exp-tip">💡 「つゆ」は「少しも」を強調する言葉！</span>' },
    { q:'「さらに知らず」の意味は？', sub:'「さらに〜打消」のセット', a:'まったく知らない', choices:['まったく知らない','さらに詳しく知る','再び知る','とても知りたい'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「さらに〜（打消）」＝まったく〜ない</span><span class="exp-ng">❌ 現代語の「さらに＝もっと」の意味ではない！</span><span class="exp-tip">💡「つゆ」と同じ働きの呼応の副詞！</span>' },
    { q:'「な泣きそ」の意味は？', sub:'「な〜そ」のセット', a:'泣くな', choices:['泣くな','泣いてもいい','泣きたい','泣いてしまった'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「な〜そ」＝〜するな（禁止）</span><span class="exp-tip">💡 動詞を「な」と「そ」で挟み込む特別な禁止の形！</span>' },
    { q:'「いかで見ばや」の意味は？', sub:'「いかで〜」のセット（願望）', a:'どうにかして見たい', choices:['どうにかして見たい','どうやっても見えない','見てはいけない','見るはずがない'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「いかで〜（む・ばや等）」＝どうにかして〜したい</span><span class="exp-tip">💡 「いかで」は疑問（どうして）の意味になることもあるので文脈に注意！</span>' },
    { q:'「よに聞こえず」の意味は？', sub:'「よに〜打消」のセット', a:'決して聞こえない', choices:['決して聞こえない','よく聞こえる','少しは聞こえる','聞こえるはずだ'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「よに〜（打消）」＝決して〜ない</span><span class="exp-tip">💡 「え」「つゆ」「さらに」「よに」はどれも打消と組む仲間！</span>' },
    { q:'呼応の副詞を読むときに一番注意すべきことは？', sub:'この単元全体の要点', a:'副詞だけでなく文末の形とセットで意味を確認する', choices:['副詞だけでなく文末の形とセットで意味を確認する','副詞の前の言葉だけ見る','漢字の意味だけで判断する','文末は無視してよい'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>呼応の副詞は文頭側と文末側がセットで初めて意味が完成する</span><span class="exp-tip">💡 「え」を見た瞬間、文末に打消が来ることを予測しながら読む！</span>' },
    { q:'「え起きず」の意味は？', sub:'「え〜打消」の応用', a:'起きることができない', choices:['起きることができない','すぐに起きる','起きるつもりはない','起きてしまった'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「え〜（打消）」＝〜できない</span><span class="exp-tip">💡 可能の否定（不可能）を表す代表的な呼応表現！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_kobun_s3_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 呼応の副詞</div>';
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

// ===== SECTION 4: 過去・完了・打消の基本 =====
function renderSection4() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🏯 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">古文の「過去形」とか「否定形」って、現代語の「た」「ない」と違うの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">形は違うが役割は同じだ。文末や動詞の後ろについている「き・けり」は過去（〜た）、「つ・ぬ・たり・り」は完了（〜た・〜てしまった）、「ず」は打消（〜ない）。この5つの形を見た瞬間に意味が浮かぶようになれば、話の時間の流れが一気につかめるようになる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🏯 過去・完了・打消の基本助動詞</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">過去（〜た）</div>'
    + '<div class="ex">き：自分が直接体験した過去（例：見き＝見た）</div>'
    + '<div class="ex">けり：伝え聞いた過去・今気づいたこと（物語の書き出しでよく使われる。例：今は昔、〜ありけり）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">完了（〜た・〜てしまった）</div>'
    + '<div class="ex">つ・ぬ：完了（例：花咲きぬ＝花が咲いた）</div>'
    + '<div class="ex">たり・り：完了・存続（〜た、または〜ている）</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">打消（〜ない）</div>'
    + '<div class="ex">ず：打消（例：知らず＝知らない）</div>'
    + '<div class="note">💡 「ず」はSection 3の「え・つゆ・さらに・よに」とセットで出てくることが多い！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「昔、男ありけり。」の「けり」の意味は？', sub:'物語の書き出しの定番表現', a:'過去（〜た）', choices:['過去（〜た）','完了（〜てしまった）','打消（〜ない）','推量（〜だろう）'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「けり」＝過去を表す（物語の地の文で頻出）</span><span class="exp-tip">💡 「今は昔、〜ありけり」は物語の定番の書き出しパターン！</span>' },
    { q:'「花咲きぬ。」の「ぬ」の意味は？', sub:'動詞の後の「ぬ」', a:'完了（〜た）', choices:['完了（〜た）','打消（〜ない）','過去（昔のこと）','推量'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ぬ」＝完了（〜てしまった、〜た）</span><span class="exp-ng">❌ 現代語の「ぬ＝打消」（例：知らぬ）と混同しやすいので要注意！</span><span class="exp-tip">💡 古文の「ぬ」は完了、現代語の「ぬ」は打消——意味が逆になることがある！</span>' },
    { q:'「物語を書きたり。」の「たり」の意味は？', sub:'完了・存続を表す', a:'完了・存続（〜た／〜ている）', choices:['完了・存続（〜た／〜ている）','未来の予定','疑問','禁止'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「たり」＝完了・存続（動作が終わった、または続いている）</span><span class="exp-tip">💡 文脈で「〜した」か「〜している」かを判断する！</span>' },
    { q:'「え知らず。」の「ず」の意味は？', sub:'Section 3の呼応の副詞とセット', a:'打消（〜ない）', choices:['打消（〜ない）','過去（〜た）','完了（〜てしまった）','推量（〜だろう）'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ず」＝打消（〜ない）</span><span class="exp-tip">💡 「え〜ず」＝〜できない、というSection 3の復習！</span>' },
    { q:'「見しことを忘れず。」の「し」の意味は？', sub:'「き」の連体形', a:'過去（〜た）', choices:['過去（〜た）','完了（〜てしまった）','打消（〜ない）','伝聞'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「し」は過去の助動詞「き」が形を変えたもの</span><span class="exp-tip">💡 「き」は自分が直接体験した過去を表す！</span>' },
    { q:'次のうち「完了」の意味を持つ助動詞はどれ？', sub:'グループ分けの確認', a:'たり', choices:['たり','けり','ず','き'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「つ・ぬ・たり・り」が完了グループ、「き・けり」が過去グループ、「ず」が打消</span><span class="exp-tip">💡 3グループに分けて覚えると混同しにくい！</span>' },
    { q:'「鳥鳴けり。」を現代語訳すると？', sub:'過去の「けり」', a:'鳥が鳴いた。', choices:['鳥が鳴いた。','鳥は鳴かない。','鳥が鳴いている。','鳥は鳴くだろう。'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「けり」＝過去（〜た）</span><span class="exp-tip">💡 動詞＋けり、の形をそのまま「〜た」に置き換える！</span>' },
    { q:'「風吹かず。」を現代語訳すると？', sub:'打消の「ず」', a:'風が吹かない。', choices:['風が吹かない。','風が吹いた。','風が吹くだろう。','風が吹いている。'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ず」＝打消（〜ない）</span><span class="exp-tip">💡 動詞＋ず、の形をそのまま「〜ない」に置き換える！</span>' },
    { q:'「日暮れぬ。」を現代語訳すると？', sub:'完了の「ぬ」', a:'日が暮れた。', choices:['日が暮れた。','日が暮れない。','日が暮れるだろう。','日は暮れなかった。'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ぬ」＝完了（〜た）</span><span class="exp-ng">❌ 「暮れぬ」を「暮れない」と誤読するのは古文で最も多いミスの一つ！</span><span class="exp-tip">💡 動詞のすぐ後の「ぬ」は打消ではなく完了！</span>' },
    { q:'「昔、竹取の翁といふ者ありけり。」の話が起きたのはいつ？', sub:'「けり」から時間を読み取る', a:'過去のこと（昔のこと）', choices:['過去のこと（昔のこと）','これから起こること','今まさに起きていること','未来永劫続くこと'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>文末の「けり」から、これが過去に起きた出来事だとわかる</span><span class="exp-tip">💡 竹取物語の有名な書き出し！助動詞から時間の流れをつかむ練習！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_kobun_s4_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 過去・完了・打消の基本</div>';
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

// ===== SECTION 5: 係り結びの法則 =====
function renderSection5() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🏯 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「係り結び」って名前だけ聞いたことあるけど、何が起きるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">文の途中に「ぞ・なむ・や・か・こそ」という言葉が入ると、文末の形がいつもと変わるルールだ。「ぞ・なむ・や・か」があれば文末は連体形に、「こそ」があれば文末は已然形になる。文末の形だけ見て「なぜここで形が変わっているんだろう」と気づけたら、少し手前に「ぞ」や「こそ」が隠れているはずだ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🏯 係り結びの法則</div>'
    + '<div class="rule-box">'
    + '<div class="ex">ぞ・なむ・や・か　→　文末は連体形になる</div>'
    + '<div class="ex">こそ　→　文末は已然形になる</div>'
    + '<div class="note">💡 「ぞ・なむ・こそ」は強調（〜こそ）、「や・か」は疑問・反語（〜か／〜だろうか、いや〜ない）を表す</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「花ぞ咲きける。」文末の形が変化しているのはなぜ？', sub:'係り結びの基本', a:'「ぞ」があるため連体形になっている', choices:['「ぞ」があるため連体形になっている','「ぞ」があるため已然形になっている','文法的な誤りである','特に理由はない'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ぞ」があると文末は連体形になる</span><span class="exp-tip">💡 「ぞ」は強調（〜だなあ）の意味を添える！</span>' },
    { q:'「花こそ咲きけれ。」文末の形が変化しているのはなぜ？', sub:'こそ→已然形', a:'「こそ」があるため已然形になっている', choices:['「こそ」があるため已然形になっている','「こそ」があるため連体形になっている','過去の話だから','疑問文だから'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「こそ」があると文末は已然形になる</span><span class="exp-tip">💡 「ぞ・なむ」とは変化のゴールが違うので区別する！</span>' },
    { q:'「や・か」が文中にあるとき、表す意味として近いのは？', sub:'疑問・反語', a:'疑問・反語（〜か／〜だろうか、いや〜ない）', choices:['疑問・反語（〜か／〜だろうか、いや〜ない）','強い断定','過去の出来事','禁止'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「や・か」は疑問または反語を表す</span><span class="exp-tip">💡 文末は「ぞ・なむ」と同じく連体形になる！</span>' },
    { q:'「ぞ・なむ・や・か・こそ」に共通する働きは？', sub:'係り結び全体の役割', a:'文末の活用形を変えながら意味を強める・疑問にする', choices:['文末の活用形を変えながら意味を強める・疑問にする','文の主語を隠す','文を過去形にする','敬語に変える'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>これらは「係助詞」と呼ばれ、文末の形を変化させながら強調や疑問の意味を添える</span><span class="exp-tip">💡 現代語にはない、古文特有のルール！</span>' },
    { q:'文末がいつもと違う形（連体形や已然形）になっているのを見つけたら、まず何をすべき？', sub:'読解のコツ', a:'少し手前に係助詞（ぞ・なむ・や・か・こそ）がないか探す', choices:['少し手前に係助詞（ぞ・なむ・や・か・こそ）がないか探す','誤字だと判断する','文末を無視する','違う訳し方を諦める'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>文末の変化は係助詞のサイン。手前を見返せば必ず見つかる</span><span class="exp-tip">💡 これができると、なぜその形なのか自分で説明できるようになる！</span>' },
    { q:'「ぞ・なむ・こそ」に共通する意味は？', sub:'強調のグループ', a:'強調（〜だなあ、まさに〜だ）', choices:['強調（〜だなあ、まさに〜だ）','疑問','打消','過去'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ぞ・なむ・こそ」は強調を表す係助詞のグループ</span><span class="exp-tip">💡 「や・か」の疑問グループと2つに分けて覚える！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_kobun_s5_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 係り結びの法則</div>';
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

// ===== SECTION 6: 主語をつかむ技術 =====
function renderSection6() {
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🏯 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">ここまでの知識があっても、結局「誰が」やってることなのか途中でわからなくなる…！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">それが古文最大の壁で、そして最後の鍵でもある。古文は同じ主語が続く間、主語をどんどん省略する。誰の動作かは「敬語」が教えてくれる。尊敬語がついていれば動作をするのは目上の人物、謙譲語がついていれば動作を受けるのが目上の人物だ。この2つを見分けられれば、主語を見失わなくなる。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🏯 敬語で主語を見抜くフロー</div>'
    + SVG.keigoFlow
    + '<div class="rule-box" style="margin-top:14px">'
    + '<div class="ex">尊敬語の例：たまふ・おはす・のたまふ・おほせらる</div>'
    + '<div class="ex">謙譲語の例：たてまつる・まうす・まゐる</div>'
    + '<div class="note">💡 天皇・貴族などの身分が高い人物には尊敬語が使われ、低い身分の人物やその動作には敬語がつかないことが多い</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🏯 主語が省略される・変わる合図</div>'
    + '<div class="rule-box">'
    + '<div class="ex">「〜を」「〜に」の直後で主語が変わりやすい</div>'
    + '<div class="ex">同じ主語が続く間は繰り返し書かれず、省略され続ける</div>'
    + '<div class="ex">会話文には「」がついていないことが多く、「と言ふ」「とて」の前までが発言内容</div>'
    + '<div class="note">⚠️ 「誰の動作か」がわからなくなったら、まず直前の敬語をチェックする習慣をつける！</div>'
    + '</div>'
    + '</div>';

  var qs = [
    { q:'「（帝が）歌をよみたまふ。」の「たまふ」から読み取れることは？', sub:'尊敬語のサイン', a:'動作主（歌をよむ人）が目上の人物である', choices:['動作主（歌をよむ人）が目上の人物である','動作を受ける人が目上の人物である','過去の出来事である','打消の意味を含む'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「たまふ」は尊敬語。動作をする人（この場合、歌をよむ人）が目上とわかる</span><span class="exp-tip">💡 帝や貴族の動作には必ずと言っていいほど尊敬語がつく！</span>' },
    { q:'「（女房が帝に）文をたてまつる。」の「たてまつる」から読み取れることは？', sub:'謙譲語のサイン', a:'動作を受ける人（帝）が目上の人物である', choices:['動作を受ける人（帝）が目上の人物である','動作をする人（女房）が目上の人物である','未来のことである','疑問文である'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「たてまつる」は謙譲語。動作を受ける相手（この場合、帝）が目上とわかる</span><span class="exp-tip">💡 謙譲語は、自分（または低い身分の人）から目上への動作に使う！</span>' },
    { q:'古文で主語が省略されやすいのはどんなとき？', sub:'省略のルール', a:'直前の文と同じ主語が続くとき', choices:['直前の文と同じ主語が続くとき','会話文のとき','過去の出来事のとき','疑問文のとき'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>同じ人物の動作が続く間、主語は繰り返し書かれず省略され続ける</span><span class="exp-tip">💡 主語が変わるまでは「さっきと同じ人」と考えて読み進める！</span>' },
    { q:'主語が変わりやすい合図として挙げられるのは？', sub:'変わり目のサイン', a:'「〜を」「〜に」の直後', choices:['「〜を」「〜に」の直後','「〜は」の直後','文の一番最初','句点（。）の3つ前'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「〜を」「〜に」など動作の対象を示す言葉の直後で、主語が別の人物に切り替わることが多い</span><span class="exp-tip">💡 これを知っておくと、次の動作の主語を予測しながら読める！</span>' },
    { q:'古文の会話文の特徴は？', sub:'カギカッコがない読解', a:'「」がついていないことが多く、「と言ふ」等の前までが発言内容', choices:['「」がついていないことが多く、「と言ふ」等の前までが発言内容','必ず「」がついている','会話文は古文には存在しない','会話文はすべて敬語で書かれる'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>古文の原文には「」がなく、「と言ふ」「とて」などの前が発言の終わりの目印になる</span><span class="exp-tip">💡 「と」を見つけたら、そこから前にさかのぼって発言の始まりを探す！</span>' },
    { q:'「誰の動作かわからなくなった」ときに、まず確認すべきことは？', sub:'読解の実践手順', a:'直前の動詞に尊敬語・謙譲語がついているか確認する', choices:['直前の動詞に尊敬語・謙譲語がついているか確認する','文章全体を読み直すのをあきらめる','漢字の意味だけで推測する','最初の1文だけを信じる'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>敬語の種類から、動作主か動作を受ける人かのどちらが目上かがわかる</span><span class="exp-tip">💡 この手順を習慣にするだけで、主語の見失いが激減する！</span>' },
    { q:'身分の低い人物の動作には、敬語がどうなることが多い？', sub:'敬語の有無も手がかりになる', a:'敬語がつかないことが多い', choices:['敬語がつかないことが多い','必ず謙譲語がつく','必ず尊敬語がつく','過去形にしかならない'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>身分が低い人物の動作には敬語がつかないことが多い</span><span class="exp-tip">💡 「敬語があるかないか」自体も人物を見分ける手がかりになる！</span>' },
    { q:'「（大納言が姫君に）ものをのたまふ。」の主語は誰？', sub:'尊敬語からの主語判定の実践', a:'大納言', choices:['大納言','姫君','わからない','語り手'],
      exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「のたまふ」は尊敬語なので、動作をする人（のたまう人＝大納言）が目上と判断できる</span><span class="exp-tip">💡 尊敬語＝動作主が目上、を実際の文で確認！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_kobun_s6_q' + i; });
  html += '<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 主語をつかむ技術</div>';
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
    + '<div class="intro-box-title">🏯 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應義塾卒・元アナ）</div><div class="chat-bubble">Section 1〜6の総まとめだ。仮名遣い・単語・呼応の副詞・助動詞・係り結び・主語判定——全部出るよ。落ち着いて解いてみよう。</div></div></div>'
    + '</div>';

  var qs = [
    { q:'「いふ」を現代仮名遣いに直すと？', sub:'語中の「ふ」→「う」', a:'いう', choices:['いう','いふ','いよ','いを'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>語の途中の「ふ」は「う」</span><span class="exp-tip">💡 いふ＝言う！</span>' },
    { q:'「ゑ」を現代仮名遣いに直すと？', sub:'ゑ→え', a:'え', choices:['え','い','お','わ'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ゑ」は「え」に読み替える</span><span class="exp-tip">💡 こゑ→こえ！</span>' },
    { q:'「けふ」を現代仮名遣いに直すと？', sub:'母音融合eu→you', a:'きょう', choices:['きょう','けう','けふ','きゅう'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「eu」は融合して「you」になる</span><span class="exp-tip">💡 けふ＝今日！</span>' },
    { q:'「あはれなり」の意味は？', sub:'最重要古今異義語', a:'しみじみと心を動かされる', choices:['しみじみと心を動かされる','怒りを覚える','恐ろしい','退屈だ'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>感動・趣を表す最重要語</span><span class="exp-tip">💡「あはれ！名作くん」の由来と同じ！</span>' },
    { q:'「をかし」の意味は？', sub:'枕草子頻出語', a:'趣がある、興味深い', choices:['趣がある、興味深い','おかしくて笑える','変だ','疲れる'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>知的な面白さ・趣を表す</span><span class="exp-tip">💡 現代語の「おかしい＝変」と混同注意！</span>' },
    { q:'「ありがたし」の意味は？', sub:'漢字を分解すると意味がわかる', a:'めったにない、貴重だ', choices:['めったにない、貴重だ','感謝する気持ち','簡単だ','当然だ'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「有り」＋「難し」＝存在しにくい＝珍しい</span><span class="exp-tip">💡 現代語の「感謝」の意味ではない！</span>' },
    { q:'「つとめて」の意味は？', sub:'時間帯を表す語', a:'早朝', choices:['早朝','夜遅く','正午','努力して'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>早朝を表す時間の言葉</span><span class="exp-tip">💡「努めて」と読み間違えない！</span>' },
    { q:'「やがて」の意味は？', sub:'現代語と時間感覚が違う', a:'すぐに', choices:['すぐに','しばらくしてから','たまに','決して'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>間を置かずすぐに、という意味</span><span class="exp-tip">💡 現代語の感覚のまま読むとずれる要注意語！</span>' },
    { q:'「え言はず」の意味は？', sub:'呼応の副詞', a:'言うことができない', choices:['言うことができない','決して言わない','すぐに言う','言うつもりだ'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「え〜（打消）」＝〜できない</span><span class="exp-tip">💡 セットで訳す呼応の副詞！</span>' },
    { q:'「な泣きそ」の意味は？', sub:'禁止の呼応表現', a:'泣くな', choices:['泣くな','泣いてもいい','泣きたい','泣いてしまった'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「な〜そ」＝禁止（〜するな）</span><span class="exp-tip">💡 動詞を挟み込む特別な形！</span>' },
    { q:'「つゆ知らず」の意味は？', sub:'呼応の副詞', a:'まったく知らない', choices:['まったく知らない','少しは知っている','知りたい','知るだろう'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「つゆ〜（打消）」＝まったく〜ない</span><span class="exp-tip">💡「さらに」「よに」も同じグループ！</span>' },
    { q:'「昔、男ありけり。」の「けり」の意味は？', sub:'物語の書き出しの定番', a:'過去（〜た）', choices:['過去（〜た）','完了','打消','推量'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「けり」は過去を表す</span><span class="exp-tip">💡 物語の地の文でよく使われる！</span>' },
    { q:'「花咲きぬ。」の「ぬ」の意味は？', sub:'完了の「ぬ」注意', a:'完了（〜た）', choices:['完了（〜た）','打消（〜ない）','過去','推量'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ぬ」は完了を表す</span><span class="exp-ng">❌ 現代語の打消の「ぬ」と混同しやすい！</span><span class="exp-tip">💡 動詞のすぐ後の「ぬ」は完了！</span>' },
    { q:'「風吹かず。」を現代語訳すると？', sub:'打消の「ず」', a:'風が吹かない。', choices:['風が吹かない。','風が吹いた。','風が吹くだろう。','風が吹いている。'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ず」＝打消（〜ない）</span><span class="exp-tip">💡 そのまま「〜ない」に置き換える！</span>' },
    { q:'「物語を書きたり。」の「たり」の意味は？', sub:'完了・存続', a:'完了・存続（〜た／〜ている）', choices:['完了・存続（〜た／〜ている）','未来の予定','疑問','禁止'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「たり」は完了・存続を表す</span><span class="exp-tip">💡 文脈で「〜した」か「〜している」か判断！</span>' },
    { q:'「花ぞ咲きける。」文末が連体形になっているのはなぜ？', sub:'係り結び', a:'「ぞ」があるため', choices:['「ぞ」があるため','過去の話だから','疑問文だから','誤りである'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「ぞ」があると文末は連体形になる</span><span class="exp-tip">💡 係り結びの基本パターン！</span>' },
    { q:'「花こそ咲きけれ。」文末が已然形になっているのはなぜ？', sub:'係り結び', a:'「こそ」があるため', choices:['「こそ」があるため','「ぞ」があるため','命令文だから','漢文だから'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「こそ」があると文末は已然形になる</span><span class="exp-tip">💡「ぞ・なむ・や・か」との違いに注意！</span>' },
    { q:'「（帝が）歌をよみたまふ。」の「たまふ」からわかることは？', sub:'尊敬語による主語判定', a:'動作主（歌をよむ人）が目上の人物である', choices:['動作主（歌をよむ人）が目上の人物である','動作を受ける人が目上の人物である','過去のことである','打消の意味である'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「たまふ」は尊敬語。動作主が目上とわかる</span><span class="exp-tip">💡 敬語から主語を推測する読解の核心技術！</span>' },
    { q:'「（女房が帝に）文をたてまつる。」の「たてまつる」からわかることは？', sub:'謙譲語による主語判定', a:'動作を受ける人（帝）が目上の人物である', choices:['動作を受ける人（帝）が目上の人物である','動作をする人が目上の人物である','未来のことである','禁止の意味である'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>「たてまつる」は謙譲語。動作を受ける人が目上とわかる</span><span class="exp-tip">💡 尊敬語と逆の判定になることに注意！</span>' },
    { q:'古文を読んでいて主語がわからなくなったら、最初にすべきことは？', sub:'読解の実践手順まとめ', a:'直前の動詞に尊敬語・謙譲語がついているか確認する', choices:['直前の動詞に尊敬語・謙譲語がついているか確認する','読むのをあきらめる','最初の1文だけを信じる','漢字だけで判断する'], exp:'<span class="exp-rule"><span class="label">🏯 ルール</span>敬語の種類から動作主・動作を受ける人のどちらが目上かがわかる</span><span class="exp-tip">💡 Section 1〜6全部の総まとめ、この習慣が古文読解のゴール！</span>' },
  ];
  qs.forEach(function(q, i) { q._qid = 'jpn_kobun_s7_q' + i; });
  qs = shuffleArray(qs);
  html += '<div class="practice-section"><div class="practice-title">📝 確認テスト — 全セクション総まとめ（20問）</div>';
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
  for (var i = 0; i < 20; i++) { s7qids.push('jpn_kobun_s7_q' + i); }
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
    ? 'きょん「古文、全部わかった！！俺M-1優勝できるわ！！」<br>西村「完璧だ。古文読解の土台は完全に君のものだね」'
    : pct >= 70
    ? 'きょん「なかなかやるじゃん俺！！」<br>西村「よくやった。弱点を特訓して100%を目指そう」'
    : pct >= 50
    ? 'きょん「まだまだだな…でも諦めないぞ！！」<br>西村「半分以上できてる。単語と主語判定を中心に復習しよう」'
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
    + '<button id="res_s1_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">🏯 Section 1へ</button>'
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
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('jpn_kobun_') === 0; });
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
      + '<div class="tokku-complete-msg">きょん「俺、古文無敵になったわ！！」<br>西村「本当に成長したね」</div>'
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
