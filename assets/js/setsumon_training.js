// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:20,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「設問？なにそれ食えるの？」' },
  { lv:2, min:20,  max:55,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「『二つ選べ』ってちゃんと書いてあった…」' },
  { lv:3, min:55,  max:110, badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺、設問読めるかも」' },
  { lv:4, min:110, max:185, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:185, max:280, badge:'📺 全国ネット',    title:'課長',          status:'きょん「にっくんより読み落とし少なくなってきた」' },
  { lv:6, min:280, max:400, badge:'🌟 冠番組',        title:'部長',          status:'きょん「設問で漫才できるかもしれない」' },
  { lv:7, min:400, max:550, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:550, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('exam_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('exam_setsu_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('exam_setsu_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('exam_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;
var QID_PREFIX = 'exam_setsu_';

// ===== XP =====
function updateXP(){
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
function addXP(pts, qid){
  if(answeredSet[qid]) return false;
  var old = getLevel(xp).lv; xp += pts; answeredSet[qid] = true;
  localStorage.setItem('exam_xp', xp);
  localStorage.setItem('exam_setsu_answered', JSON.stringify(answeredSet));
  updateXP(); return getLevel(xp).lv > old;
}
function deductXP(pts){
  var old = getLevel(xp).lv; xp = Math.max(0, xp - pts);
  localStorage.setItem('exam_xp', xp); updateXP(); return getLevel(xp).lv < old;
}

// ===== WEAK DB =====
function getPct(qid){ var d = weakDB[qid]; if(!d || d.total===0) return 0; return Math.round(d.correct / d.total * 100); }
function getWeakQuestions(){ return Object.keys(weakDB).filter(function(id){ return id.indexOf(QID_PREFIX) === 0 && getPct(id) < 80; }); }
function renderWeakBar(){
  var wqs = getWeakQuestions().sort(function(a,b){ return getPct(a) - getPct(b); }).slice(0, 8);
  var el = document.getElementById('weakItems'); if(!el) return;
  if(wqs.length === 0){ el.innerHTML = '<span class="weak-bar-empty">弱点なし！</span>'; return; }
  el.innerHTML = wqs.map(function(qid){
    var d = weakDB[qid];
    return '<div class="weak-item"><span class="weak-item-word">' + (d.short || qid) + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect){
  if(!weakDB[qid]) weakDB[qid] = { jp:(qMeta[qid]&&qMeta[qid].jp)||'', short:(qMeta[qid]&&qMeta[qid].short)||'', answer:(qMeta[qid]&&qMeta[qid].answer)||'', choices:(qMeta[qid]&&qMeta[qid].choices)||[], correct:0, total:0 };
  weakDB[qid].total++; if(isCorrect) weakDB[qid].correct++;
  localStorage.setItem('exam_weakdb', JSON.stringify(weakDB));
  var _t = new Date().toISOString().slice(0,10);
  var _d = JSON.parse(localStorage.getItem('exam_daily') || '{}');
  _d[_t] = (_d[_t] || 0) + 1; localStorage.setItem('exam_daily', JSON.stringify(_d));
  renderWeakBar();
}

// ===== HELPERS =====
function showToast(msg, type){
  var t = document.getElementById('toast'); t.textContent = msg;
  t.className = 'toast' + (type === 'levelup' ? ' levelup' : type === 'demote' ? ' demote' : '');
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, type === 'levelup' ? 4000 : type === 'demote' ? 3500 : 2500);
}
var COMMENTS = {
  correct: ['きょん「読めた！！設問に勝った！！」', 'きょん「『二つ』って書いてあるの見えた！！」', 'きょん「にっくん見て！読み落としてない！！」'],
  nishi:   ['西村「正解。設問に線を引く癖がついてきた」', '西村「できてる。指示語を拾えてる」', '西村「正確に読めてる。その調子」']
};
function getComment(type){ var a = COMMENTS[type] || COMMENTS.correct; return a[Math.floor(Math.random() * a.length)]; }
function shuffleArray(arr){ var a = arr.slice(); for(var i = a.length-1; i > 0; i--){ var j = Math.floor(Math.random()*(i+1)); var t = a[i]; a[i]=a[j]; a[j]=t; } return a; }

// 設問文カード（各問題の中に埋め込む。特訓モードでも単独で意味が通るように）
var SUBJ_COLOR = { '数学':'#a371f7', '理科':'#0ea5e9', '社会':'#f59e0b', '英語':'#3b82f6', '国語':'#3fb950' };
function stem(subject, text){
  var c = SUBJ_COLOR[subject] || '#8b949e';
  return '<div style="background:var(--bg3);border-left:4px solid ' + c + ';border-radius:8px;padding:14px 16px;margin-bottom:12px">'
    + '<span style="display:inline-block;background:' + c + ';color:#0d1117;font-size:11px;font-weight:bold;padding:1px 8px;border-radius:4px;margin-bottom:6px">' + subject + '</span>'
    + '<div style="font-size:16px;line-height:2.2;letter-spacing:0.05em;color:var(--text)">' + text + '</div>'
    + '</div>';
}
// ask: 設問カードの下に置く「問い」
function ask(label){ return '<div style="font-size:15px;color:var(--gold);font-weight:bold">🔍 ' + label + '</div>'; }

// ===== QUESTION ENGINE =====
function makeChoices(qid, jp, answer, choices, exp, short){
  choices = shuffleArray(choices);
  qMeta[qid] = { type:'choice', answer:answer, xp:4, jp:jp, choices:choices, short:short || '' };
  var done = answeredSet[qid];
  return '<div class="q-card" data-card="' + qid + '">'
    + '<div class="q-text">' + jp + '</div>'
    + '<div class="choices">' + choices.map(function(c){
        if(done) return '<button class="choice-btn ' + (c===answer?'show-correct':'') + '" disabled>' + c + '</button>';
        return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
      }).join('') + '</div>'
    + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度！設問をもう一回ゆっくり読もう</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + '<div class="exp-card-title">📐 解説</div><div style="color:var(--text);font-size:13px;line-height:2.1">' + exp + '</div></div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '"><div class="ans-label">✅ 正解</div><div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">' + (done?getComment('nishi'):'') + '</div>'
    + '</div>';
}

function handleChoice(qid, choice){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  if(choice === meta.answer) markCorrect(qid, meta); else markWrong(qid, meta, choice);
}
function markCorrect(qid, meta){
  recordResult(qid, true);
  var lvUp = addXP(meta.xp || 4, qid);
  var card = document.querySelector('[data-card="' + qid + '"]'); if(card) card.classList.add('correct-card');
  var fb = document.getElementById('fb_' + qid); if(fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = getComment('nishi'); ac.style.display = 'block'; }
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('selected-correct'); });
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  if(lvUp){ setTimeout(function(){ showToast('🎉 昇格！ ' + getLevel(xp).badge + '　きょん「昇格したわ！！」', 'levelup'); }, 400); }
  else { setTimeout(function(){ showToast(getComment('correct')); }, 300); }
  checkSectionComplete();
}
function markWrong(qid, meta, choice){
  recordResult(qid, false);
  attemptCounts[qid] = (attemptCounts[qid] || 0) + 1;
  var card = document.querySelector('[data-card="' + qid + '"]');
  if(card){ card.classList.add('wrong-card'); setTimeout(function(){ card.classList.remove('wrong-card'); }, 600); }
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'block';
  var btn = document.querySelector('.choice-btn[data-qid="' + qid + '"][data-choice="' + choice + '"]');
  if(btn){ btn.classList.add('selected-wrong'); setTimeout(function(){ btn.classList.remove('selected-wrong'); }, 600); }
  if(attemptCounts[qid] >= 2){ var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'inline-block'; }
  var demoted = deductXP(5);
  if(demoted){ setTimeout(function(){ showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」', 'demote'); }, 200); }
  else { var msgs = ['きょん「あれ！読み飛ばした！設問をもう一回！！」','きょん「また読み飛ばした…！指で追いながら読む！！」','きょん「ゆっくり、一文字ずつ！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('exam_setsu_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で読む！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。設問のどこに書いてあったか確認しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = QID_PREFIX + 's' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('exam_setsu_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if(nb && nb.style.display === 'none'){
      nb.style.display = 'block';
      if(!document.getElementById('secCompleteBanner')){
        var banner = document.createElement('div'); banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 5 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '確認テストへ挑戦！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(163,113,247,0.12),rgba(245,197,24,0.08));border:1px solid var(--purple);border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--purple);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
          + '<div style="font-size:14px;color:var(--text2)">きょん「全部読めた！！にっくん、俺やれるじゃん！！」</div>'
          + '<div style="font-size:13px;color:var(--text2);margin-top:4px">西村「よくやった。' + nextMsg + '」</div>'
          + '</div>';
        nb.parentNode.insertBefore(banner, nb);
        setTimeout(function(){ banner.scrollIntoView({ behavior:'smooth', block:'center' }); }, 200);
      }
    }
  }
}

// ===== TABS =====
var SECTIONS = [
  { id:0, label:'🔍 スタート',   title:'設問は「指示書」',        sub:'解く前に、設問が何を命令しているか読む' },
  { id:1, label:'いくつ選ぶ？',  title:'いくつ選ぶ？',            sub:'一つ・二つ・全て・（　）ごとに——ここを見落とすと0点' },
  { id:2, label:'否定形',        title:'「でない」を見逃すな',    sub:'適当なもの／適当でないもの／最も遠いもの' },
  { id:3, label:'何を答える？',  title:'何を答える？',            sub:'10月？12月？x座標？面積？——聞かれているものだけを答える' },
  { id:4, label:'答え方',        title:'単位・答え方・ただし書き', sub:'度／人／cm、数字マーク、「ただし」の条件' },
  { id:5, label:'確認テスト',    title:'確認テスト',              sub:'本物の設問で、4つのチェックを一気に' },
  { id:6, label:'📊弱点',        title:'弱点ノート',              sub:'読み落としやすいパターンを確認' },
  { id:7, label:'🔥特訓',        title:'弱点特訓モード',          sub:'読み落としパターンを集中練習！' },
];

function renderTabs(){
  var html = '';
  SECTIONS.forEach(function(s){
    var cls = 'section-tab'
      + (s.id === currentSection ? ' active' : '')
      + (sectionDone[s.id] && s.id < 6 ? ' done' : '')
      + (s.id === 7 ? ' tokku' : '');
    var label = s.label + (sectionDone[s.id] && s.id < 6 ? ' ✓' : '');
    if(s.id === 7){ var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
    html += '<button class="' + cls + '" data-sid="' + s.id + '">' + label + '</button>';
  });
  document.getElementById('sectionTabs').innerHTML = html;
  document.querySelectorAll('.section-tab[data-sid]').forEach(function(btn){
    btn.addEventListener('click', function(){ goSection(parseInt(btn.dataset.sid)); });
  });
}

function goSection(id){
  currentSection = id; qMeta = {};
  renderTabs();
  renderSection(id);
  window.scrollTo({ top:0, behavior:'smooth' });
}

function renderSection(id){
  if(id === 6){ renderWeakNote(); return; }
  if(id === 7){ renderTokkuMode(); return; }

  var s = SECTIONS[id];
  var html = '<div class="progress-dots">';
  for(var i = 0; i <= 5; i++){
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">設問の読み方 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';

  if     (id === 0) html += renderSection0();
  else if(id === 1) html += renderSection1();
  else if(id === 2) html += renderSection2();
  else if(id === 3) html += renderSection3();
  else if(id === 4) html += renderSection4();
  else if(id === 5) html += renderSection5();

  if(id >= 1 && id <= 5){
    var nextLabel  = id < 5 ? '次のセクションへ →' : '🏆 結果を見る！';
    html += '<button class="next-section-btn" id="nextBtn" data-goto="' + (id < 5 ? id+1 : 'result') + '" style="display:none">' + nextLabel + '</button>';
  }

  document.getElementById('mainContent').innerHTML = html;
  bindEvents();
  if(sectionDone[id]){ var nb = document.getElementById('nextBtn'); if(nb) nb.style.display = 'block'; }
  checkSectionComplete();
}

function bindEvents(){
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(b){ b.addEventListener('click', function(){ handleChoice(b.dataset.qid, b.dataset.choice); }); });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(b){ b.addEventListener('click', function(){ showAnswer(b.dataset.qid); }); });
  document.querySelectorAll('.next-section-btn[data-goto]').forEach(function(b){
    b.addEventListener('click', function(){
      var g = b.dataset.goto;
      if(g === 'result') showFinalResult(); else goSection(parseInt(g));
    });
  });
  document.querySelectorAll('.start-btn[data-goto]').forEach(function(b){
    b.addEventListener('click', function(){ goSection(parseInt(b.dataset.goto)); });
  });
}

// 問題リストをまとめて描画
function renderQs(qs){
  var html = '';
  qs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + (i+1) + '</div>';
    html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp, q.short);
  });
  return html;
}

// ===== SVG: 設問に印をつける見本 =====
var svgMark = '<svg viewBox="0 0 320 150" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="16" fill="#8b949e" font-size="10" text-anchor="middle">【設問文に、読んだ順に印をつける】</text>'
  // line 1
  + '<text x="10" y="44" fill="#e6edf3" font-size="12">関数のグラフについて</text>'
  + '<rect x="146" y="31" width="80" height="18" rx="4" fill="rgba(233,69,96,0.18)" stroke="#e94560" stroke-width="1.5"/>'
  + '<text x="150" y="44" fill="#e94560" font-size="12" font-weight="bold">正しく述べた</text>'
  + '<text x="230" y="44" fill="#e6edf3" font-size="12">文を、次の</text>'
  // line 2
  + '<text x="10" y="74" fill="#e6edf3" font-size="12">アからカまでの中から</text>'
  + '<rect x="146" y="61" width="44" height="18" rx="4" fill="rgba(245,197,24,0.2)" stroke="#f5c518" stroke-width="1.5"/>'
  + '<text x="150" y="74" fill="#f5c518" font-size="12" font-weight="bold">二つ</text>'
  + '<text x="194" y="74" fill="#e6edf3" font-size="12">選びなさい。</text>'
  // line 3
  + '<rect x="6" y="91" width="48" height="18" rx="4" fill="rgba(14,165,233,0.18)" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<text x="10" y="104" fill="#0ea5e9" font-size="12" font-weight="bold">ただし</text>'
  + '<text x="58" y="104" fill="#e6edf3" font-size="12">、マーク欄は1行につき一つだけ</text>'
  + '<text x="10" y="124" fill="#e6edf3" font-size="12">塗りつぶすこと。</text>'
  // legend
  + '<text x="10" y="144" fill="#e94560" font-size="9">■ 正か否定か</text>'
  + '<text x="100" y="144" fill="#f5c518" font-size="9">■ いくつ選ぶ</text>'
  + '<text x="190" y="144" fill="#0ea5e9" font-size="9">■ ただし書き（条件）</text>'
  + '</svg>';

// ===== SECTION 0 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">🔍 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">にっくん！模試の数学、答え合ってたのに0点だった問題があるんだけど！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">設問を見せて。……「二つ選びなさい」だね。きょんは一つしか塗ってない。愛知県の入試は全部マークシートで、「二つ選ぶ」問題は二つとも合っていないと0点だ。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">えっ、そんなの書いてあった！？……あ、書いてある。「二つ」って。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">設問は「指示書」だ。解く前に、①何を答えるか ②いくつ選ぶか ③「でない」があるか ④単位や答え方 ⑤「ただし」の条件——この5つを確認する。ここでは問題は解かない。設問を読む練習だけをする。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">解かなくていいの！？それなら俺、得意かも！！</div></div></div>'
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 設問チェック5か条（解く前に必ず見る）</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgMark + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">① 何を答える？</div>'
    + '<div class="ex">「10月の来店者数」「点Hのx座標」「3回目に等しくなるとき」——聞かれているものは1つ。似たものと取り違えない</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">② いくつ選ぶ？</div>'
    + '<div class="ex">「一つ」「二つ」「三つ」「全て選んで、その組み合わせ」「（X）は…から、（Y）は…からそれぞれ」</div>'
    + '<div class="note">💡 「二つ」で一つしか塗らない＝0点。「組み合わせ」はマークは一つだけ</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">③ 否定形があるか？</div>'
    + '<div class="ex">「適当なもの」↔「適当<strong style="color:var(--red)">でない</strong>もの」、「正しいもの」↔「誤っているもの」、「最も近い」↔「最も<strong style="color:var(--red)">遠い</strong>」</div>'
    + '<div class="note">💡 「でない」「ない」「遠い」を見つけたら赤で囲む</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">④ 単位・答え方は？</div>'
    + '<div class="ex">度／cm／人／個、記号をマーク、数字を2桁でマーク、「2番目・4番目・6番目」だけ答える</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">⑤ 「ただし」「なお」の条件は？</div>'
    + '<div class="ex">「ただし、糸の体積は無視できる」「なお、2か所の（①）には同じ人名」「ただし、マーク欄は1行につき一つ」</div>'
    + '<div class="note">💡 「ただし」は問題を解くためのヒントか、マークの注意。読み飛ばすと解けないか、塗り方で失点する</div>'
    + '</div>'
    + '</div>'

    + '<div style="background:rgba(245,197,24,0.06);border:1px solid rgba(245,197,24,0.25);border-radius:12px;padding:16px 20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:10px">🔍 このページの使い方</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + '設問文を読んで、「いくつ選ぶ？」「否定形？」などのチェックだけに答える。<br>'
    + '問題そのものは解かなくてOK。<strong style="color:var(--text)">指で文字を追いながら、一文字ずつ読む</strong>のがコツ。<br>'
    + 'Section 1：いくつ選ぶ？　Section 2：否定形　Section 3：何を答える？　Section 4：答え方・ただし書き　Section 5：確認テスト'
    + '</div></div>'

    + '<button class="start-btn" data-goto="1">🔍 Section 1：いくつ選ぶ？から始める →</button>';
}

// ===== SECTION 1: いくつ選ぶ？ =====
function renderSection1(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔍 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「一つ選びなさい」ばっかりじゃないの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">愛知県は毎年、全教科で「二つ選びなさい」「全て選んで、その組み合わせ」が出る。数は文の最後の方に書いてあることが多い。「選びなさい」の直前を見る癖をつけよう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 「いくつ」の4パターン</div>'
    + '<div class="rule-box"><div class="rule-title">一つ</div><div class="ex">「…の中から一つ選びなさい」「最も適当なものを選びなさい」→ マークは1個</div></div>'
    + '<div class="rule-box"><div class="rule-title">二つ・三つ</div><div class="ex">「…二つ選びなさい」→ マークは2個。1個だけだと0点。「ただし、マーク欄は1行につき一つだけ」がセットで付く</div></div>'
    + '<div class="rule-box"><div class="rule-title">全て選んで、その組み合わせ</div><div class="ex">「正しいものを全て選んで、その組み合わせとして最も適当なものを、アからコまでの中から選びなさい」→ 頭の中で全部○×をつけて、<strong style="color:var(--gold)">最後にマークするのは記号1個</strong></div></div>'
    + '<div class="rule-box"><div class="rule-title">（　）ごとに一つずつ</div><div class="ex">「（X）にあてはまる文をアからウの中から、（Y）にあてはまる文をaからcの中からそれぞれ選びなさい」→ Xに1個、Yに1個。選択肢の群が違う</div></div>'
    + '<div class="note">💡 英語の並べ替えは「アからキまでの中から六つ選んで並べ、2番目・4番目・6番目を答える」→ 1語余る。答えるのは3か所</div>'
    + '</div>';

  var qs = [
    { qid:'exam_setsu_s1_q0', short:'数学：二つ選ぶ',
      jp: stem('数学','関数 y＝6/x のグラフについて正しく述べた文を、次のアからカまでの中から二つ選びなさい。ただし、マーク欄は1行につき一つだけ塗りつぶすこと。') + ask('この設問では、いくつ選ぶ？'),
      answer:'二つ', choices:['一つ','二つ','三つ','全て選んで組み合わせ'],
      exp:'📐 「二つ選びなさい」と書いてある。<br>✅ マークは2個。「ただし、マーク欄は1行につき一つ」は、2個を別々の行に塗れという意味<br>💡 「選びなさい」の直前の数字を見る' },
    { qid:'exam_setsu_s1_q1', short:'理科：2つ選ぶ',
      jp: stem('理科','遺伝に関する次のアからオまでの文の中から正しいものを2つ選びなさい。ただし、マーク欄は1行につき1つだけ塗りつぶすこと。') + ask('この設問では、いくつ選ぶ？'),
      answer:'二つ', choices:['一つ','二つ','全て選んで組み合わせ','（　）ごとに一つずつ'],
      exp:'📐 「2つ選びなさい」。数字で書かれることもある<br>✅ マークは2個<br>💡 漢数字「二つ」でも算用数字「2つ」でも同じ' },
    { qid:'exam_setsu_s1_q2', short:'理科：全て選んで組み合わせ',
      jp: stem('理科','〔観察2〕の結果から、表のAからEまでの中から、選んだ2つの種子がともに純系であることがわかるものを全て選んで、その組み合わせとして最も適当なものを、次のアからケまでの中から選びなさい。') + ask('この設問では、最後にマークするのはいくつ？'),
      answer:'記号を一つ（組み合わせ）', choices:['記号を一つ（組み合わせ）','AからEを全部マーク','二つ','五つ'],
      exp:'📐 「全て選んで、その組み合わせとして最も適当なものを…選びなさい」<br>✅ AからEに頭の中で○×をつけ、その組み合わせに合う記号（アからケ）を<strong>1個</strong>マーク<br>💡 「全て選ぶ」と「マークは1個」は矛盾しない。組み合わせ問題の定番' },
    { qid:'exam_setsu_s1_q3', short:'社会：それぞれ一つずつ',
      jp: stem('社会','図中の（X）にあてはまる文として最も適当なものを、下のアからウまでの中から、（Y）にあてはまる文として最も適当なものを、下のaからcまでの中からそれぞれ選びなさい。') + ask('この設問では、いくつ選ぶ？'),
      answer:'（　）ごとに一つずつ', choices:['一つ','二つ','（　）ごとに一つずつ','全て選んで組み合わせ'],
      exp:'📐 「（X）は…から、（Y）は…からそれぞれ選びなさい」<br>✅ Xに1個（アからウ）、Yに1個（aからc）。合計2か所マーク<br>💡 Xとyで選択肢の群が違う（ア〜ウ／a〜c）。混ぜない' },
    { qid:'exam_setsu_s1_q4', short:'国語：三つ選ぶ',
      jp: stem('国語','本文の内容と一致するものを、次のアからカまでの中から三つ選びなさい。') + ask('この設問では、いくつ選ぶ？'),
      answer:'三つ', choices:['一つ','二つ','三つ','全て選んで組み合わせ'],
      exp:'📐 「三つ選びなさい」<br>✅ マークは3個。国語の内容一致では三つ選ぶ年もある<br>💡 二つと思い込まない。毎回数える' },
    { qid:'exam_setsu_s1_q5', short:'国語：全て選ぶ',
      jp: stem('国語','波線部アからカまでのうち、主語が同じものを全て選びなさい。') + ask('この設問では、いくつ選ぶ？'),
      answer:'あてはまるもの全部（数は決まっていない）', choices:['一つ','二つ','あてはまるもの全部（数は決まっていない）','六つ全部'],
      exp:'📐 「全て選びなさい」＝あてはまるものを全部。2個かもしれないし3個かもしれない<br>✅ アからカを1つずつ調べて、該当するものを全部マーク<br>💡 「全て」＝「六つ全部」ではない' },
    { qid:'exam_setsu_s1_q6', short:'英語：六つ選んで並べ替え',
      jp: stem('英語','下線部③にあてはまるように、次のアからキまでの中から六つ選んで正しく並べ替えるとき、2番目、4番目、6番目にくるものをそれぞれ選びなさい。') + ask('アからキ（7語）のうち、使う語はいくつ？'),
      answer:'六つ（一つ余る）', choices:['七つ全部','六つ（一つ余る）','三つだけ','二つ'],
      exp:'📐 「アからキまでの中から六つ選んで」→ 7語のうち6語を使い、<strong>1語は使わない</strong><br>✅ 並べたあと、答えるのは2番目・4番目・6番目の3か所<br>💡 余る1語をわざと入れてある。全部使おうとすると文が壊れる' },
    { qid:'exam_setsu_s1_q7', short:'数学：一つ選ぶ',
      jp: stem('数学','6＋10÷(−2) を計算した結果として正しいものを、次のアからエまでの中から一つ選びなさい。') + ask('この設問では、いくつ選ぶ？'),
      answer:'一つ', choices:['一つ','二つ','全て選んで組み合わせ','（　）ごとに一つずつ'],
      exp:'📐 「一つ選びなさい」<br>✅ マークは1個<br>💡 大問1はほとんど「一つ」。でも(7)のように「二つ」が混ざる年がある' },
    { qid:'exam_setsu_s1_q8', short:'社会：二つ選ぶ',
      jp: stem('社会','次のアからオまでの中から、日本の司法制度について述べた文として正しいものを二つ選びなさい。ただし、マーク欄は1行につき一つだけ塗りつぶすこと。') + ask('この設問では、いくつ選ぶ？'),
      answer:'二つ', choices:['一つ','二つ','三つ','全て選んで組み合わせ'],
      exp:'📐 「正しいものを二つ選びなさい」<br>✅ 5つの文に○×をつけて、○の2つをマーク<br>💡 社会の「正文を二つ」は毎年出る' },
    { qid:'exam_setsu_s1_q9', short:'理科：全て選んで組み合わせ（アからコ）',
      jp: stem('理科','次のⅠからⅣまでの文の中から正しいものを全て選んで、その組み合わせとして最も適当なものを、下のアからコまでの中から選びなさい。') + ask('この設問では、最後にマークするのはいくつ？'),
      answer:'記号を一つ（組み合わせ）', choices:['記号を一つ（組み合わせ）','ⅠからⅣを全部マーク','二つ','四つ'],
      exp:'📐 「全て選んで、その組み合わせ…アからコまでの中から選びなさい」<br>✅ ⅠからⅣに○×→ 合う記号を1個マーク<br>💡 10択に見えて、Ⅰが○とわかれば選択肢は半分に減る（消去法）' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 設問を読んで答えよう ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 2: 否定形 =====
function renderSection2(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔍 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「適当なもの」と「適当でないもの」って、たった3文字の差じゃん…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">その3文字で答えが真逆になる。国語で毎年、「適当でないもの」が出る。見つけたら「でない」を赤で囲む。それだけで防げる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「最も遠い」もあるの？「近い」だと思って読んでた…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">社会で出た。「描かれた年代から最も遠い年代のできごと」。反対の意味の言葉は全部マークの対象だ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 否定形・反対語の見つけ方</div>'
    + '<div class="rule-box"><div class="rule-title">✅ 正のパターン</div><div class="ex">適当なもの／正しいもの／一致するもの／最も近いもの／あてはまるもの</div></div>'
    + '<div class="rule-box"><div class="rule-title">❌ 否定のパターン（赤で囲む）</div><div class="ex">適当<strong style="color:var(--red)">でない</strong>もの／<strong style="color:var(--red)">誤っている</strong>もの／一致<strong style="color:var(--red)">しない</strong>もの／最も<strong style="color:var(--red)">遠い</strong>もの／あてはまら<strong style="color:var(--red)">ない</strong>もの</div></div>'
    + '<div class="note">💡 チェック方法：設問を読み終わったら「正？否定？」と口に出して言う。否定なら選択肢の中で「変なもの」を探す</div>'
    + '</div>';

  var C = ['正しい・適当なものを選ぶ','適当でない・誤っているものを選ぶ','最も遠い（近いではない）ものを選ぶ'];
  var qs = [
    { qid:'exam_setsu_s2_q0', short:'国語：適当でないもの',
      jp: stem('国語','第3・4段落の内容について述べた生徒の説明のうち、適当でないものを、次のアからオまでの中から一つ選びなさい。') + ask('正？それとも否定？'),
      answer:C[1], choices:C,
      exp:'📐 「適当<strong style="color:var(--red)">でない</strong>もの」<br>✅ 5人の説明のうち、本文と合わない1人を探す<br>💡 「でない」を赤で囲んでから選択肢を読む' },
    { qid:'exam_setsu_s2_q1', short:'国語：適当でないものを二つ',
      jp: stem('国語','第四段落以降で述べられている建築に関する筆者の考えとして適当でないものを、次のアからカまでの中から二つ選びなさい。') + ask('正？それとも否定？'),
      answer:C[1], choices:C,
      exp:'📐 「適当<strong style="color:var(--red)">でない</strong>ものを<strong style="color:var(--gold)">二つ</strong>」——否定形と「二つ」の二重トラップ<br>✅ 本文と合わない2つを探してマーク2個<br>💡 実際にR7の国語で出た形。両方見落とすと0点' },
    { qid:'exam_setsu_s2_q2', short:'理科：最も適当なもの',
      jp: stem('理科','この〔実験〕において、試験管内で起こった化学変化について説明した文として最も適当なものを、次のアからカまでの中から選びなさい。') + ask('正？それとも否定？'),
      answer:C[0], choices:C,
      exp:'📐 「最も適当なもの」＝正のパターン<br>✅ 正しい説明を1つ選ぶ<br>💡 否定形ではないことも確認して安心して進む' },
    { qid:'exam_setsu_s2_q3', short:'英語：一致するもの',
      jp: stem('英語','次のアからカまでの中から、その内容が文章中に書かれていることと一致するものを二つ選びなさい。') + ask('正？それとも否定？'),
      answer:C[0], choices:C,
      exp:'📐 「一致するもの」＝正のパターン<br>✅ 本文に書いてあるものを2つ<br>💡 英語の内容真偽は「一致するもの」が基本。ただし年によって「一致しないもの」になる可能性もあるので毎回見る' },
    { qid:'exam_setsu_s2_q4', short:'社会：最も遠い年代',
      jp: stem('社会','Ⅲの絵画が描かれた年代から最も遠い年代のヨーロッパのできごとについて述べた文を、次のアからウまでの中から選びなさい。') + ask('正？否定？それとも反対語？'),
      answer:C[2], choices:C,
      exp:'📐 「最も<strong style="color:var(--red)">遠い</strong>年代」。「近い」と読み間違えやすい反対語<br>✅ 3つのできごとの年代を並べて、絵画の年代から一番離れたものを選ぶ<br>💡 「遠い／近い」「多い／少ない」「高い／低い」は全部チェック対象' },
    { qid:'exam_setsu_s2_q5', short:'社会：読み取れる内容として最も適当',
      jp: stem('社会','Ⅰ、Ⅱの資料から読み取ることができる内容をまとめた文章として最も適当なものを、次のアからエまでの中から選びなさい。') + ask('正？それとも否定？'),
      answer:C[0], choices:C,
      exp:'📐 「最も適当なもの」＝正<br>✅ 資料と合っている文章を1つ<br>💡 「読み取ることができる」＝資料に書いてあることだけ。自分の知識で判断しない' },
    { qid:'exam_setsu_s2_q6', short:'理科：誤っているもの',
      jp: stem('理科','次のアからエまでの文の中から、誤っているものを一つ選びなさい。') + ask('正？それとも否定？'),
      answer:C[1], choices:C,
      exp:'📐 「<strong style="color:var(--red)">誤っている</strong>もの」＝否定<br>✅ 4つのうち間違っている1つを探す<br>💡 正しい文を選んでしまうのが典型的な読み飛ばし' },
    { qid:'exam_setsu_s2_q7', short:'国語：表現の特徴として適当なもの',
      jp: stem('国語','この文章の表現の特徴として適当なものを、次のアからカまでの中から二つ選びなさい。') + ask('正？それとも否定？'),
      answer:C[0], choices:C,
      exp:'📐 「適当なもの」＝正<br>✅ 合っている2つをマーク<br>💡 同じ大問の前の小問が「適当でないもの」だったとしても、この小問は「適当なもの」。設問ごとに毎回確認' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 設問を読んで答えよう ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 3: 何を答える？ =====
function renderSection3(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔍 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">計算は合ってたのに、12月の人数を答えちゃった。聞かれてたのは10月だった…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">それが一番もったいない失点だ。設問の「〜として正しいもの」「〜は何か」の「〜」の部分が「答えるもの」。そこに線を引いてから解き始める。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「点Hのx座標」って書いてあったら、y座標を答えたらダメってことか…</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 「答えるもの」の見つけ方</div>'
    + '<div class="rule-box"><div class="rule-title">「〜として正しいもの」「〜は何か」の「〜」</div><div class="ex">「10月の来店者数として正しいもの」→ 答えるのは<strong style="color:var(--gold)">10月</strong>の来店者数<br>「点Hのx座標として正しいもの」→ <strong style="color:var(--gold)">x座標</strong>（y座標ではない）<br>「像の大きさは何cmか」→ <strong style="color:var(--gold)">像の大きさ</strong>（距離ではない）</div></div>'
    + '<div class="rule-box"><div class="rule-title">「何回目」「どれ」「どこ」の限定</div><div class="ex">「3回目に等しくなるとき」→ 1回目・2回目は答えではない<br>「【X】と【Y】にあてはまるもの」→ WとZは答えない</div></div>'
    + '<div class="note">💡 チェック方法：解く前に「答えるのは＿＿＿」と空欄を埋めてから計算する</div>'
    + '</div>';

  var qs = [
    { qid:'exam_setsu_s3_q0', short:'数学：10月の来店者数',
      jp: stem('数学','ある飲食店の来店者数は、11月は10月より30%増加し、12月は11月より20%増加した。また、12月の来店者数は、10月の来店者数より2800人多かった。このとき、10月の来店者数として正しいものを、次のアからエまでの中から一つ選びなさい。') + ask('答えるものはどれ？'),
      answer:'10月の来店者数', choices:['10月の来店者数','11月の来店者数','12月の来店者数','増えた人数（2800人）'],
      exp:'📐 「10月の来店者数として正しいもの」<br>✅ 10月をx人とおいて解き、<strong>xそのもの</strong>を答える。12月（1.56x）を答えない<br>💡 実際のR7の問題。選択肢には12月の数も混ざっている' },
    { qid:'exam_setsu_s3_q1', short:'数学：8000個のうちの推定個数',
      jp: stem('数学','表は、あるキャベツ農園でとれたキャベツ8000個から無作為に抽出した50個のキャベツについて、重さを度数分布表にまとめたものである。この農園でとれたキャベツ8000個のうち、重さが0.7kg以上1.3kg未満のキャベツの個数はおよそ何個と推定されるか、正しいものを次のアからエまでの中から一つ選びなさい。') + ask('答えるものはどれ？'),
      answer:'8000個のうち、0.7kg以上1.3kg未満の個数', choices:['8000個のうち、0.7kg以上1.3kg未満の個数','50個のうち、0.7kg以上1.3kg未満の個数','1.3kg以上の個数','キャベツの平均の重さ'],
      exp:'📐 「8000個のうち…およそ何個と推定されるか」<br>✅ 50個中の割合を出して、8000個に引き伸ばす。50個中の個数（9個）で止めない<br>💡 「以上」「未満」の範囲も答えるものの一部。0.7〜1.1と1.1〜1.3の2行を足す' },
    { qid:'exam_setsu_s3_q2', short:'数学：点Hのx座標',
      jp: stem('数学','四角形DFOHと四角形HOGEの面積が等しいとき、点Hのx座標として正しいものを、次のアからオまでの中から一つ選びなさい。') + ask('答えるものはどれ？'),
      answer:'点Hのx座標', choices:['点Hのx座標','点Hのy座標','四角形DFOHの面積','点Gのx座標'],
      exp:'📐 「点Hのx座標として正しいもの」<br>✅ 面積が等しいという条件は「解くための条件」、答えるのは<strong>Hのx座標</strong><br>💡 途中で出てくる面積の値を答えない' },
    { qid:'exam_setsu_s3_q3', short:'数学：3回目に等しくなる時間の範囲',
      jp: stem('数学','3点P、Q、Rが同時に出発してから8秒後までの間で、△APQの面積と△ABRの面積が等しくなるときが何回かある。3回目に等しくなるときは何秒後から何秒後までの間にあるか、正しいものを次のアからカまでの中から一つ選びなさい。') + ask('答えるものはどれ？'),
      answer:'3回目に等しくなる時間の範囲', choices:['3回目に等しくなる時間の範囲','1回目に等しくなる時間','等しくなる回数','8秒後の面積'],
      exp:'📐 「3回目に等しくなるときは何秒後から何秒後までの間にあるか」<br>✅ 「何回か」は数えるだけで答えではない。<strong>3回目</strong>の「〜秒後から〜秒後の間」を答える<br>💡 グラフを描いて交点を数え、3つ目の交点の場所を見る' },
    { qid:'exam_setsu_s3_q4', short:'理科：金属柱Bの水面',
      jp: stem('理科','〔実験〕の結果、金属柱Aは質量が10.00g、体積3.7cm³であり、金属柱Bは質量が15.00gであった。また、金属柱A、Bの密度が同じであることがわかった。金属柱Bの体積を測定したときの水面とメスシリンダーの目盛りのようすを模式的に表した図として最も適当なものを、次のアからオまでの中から選びなさい。') + ask('答えるものはどれ？'),
      answer:'金属柱Bを沈めたときの水面の図', choices:['金属柱Bを沈めたときの水面の図','金属柱Aを沈めたときの水面の図','金属柱Bの質量','金属柱Bの密度'],
      exp:'📐 「金属柱<strong>B</strong>の体積を測定したときの…図」<br>✅ Aのデータは密度を求めるための材料。答えるのはBを沈めたときの図<br>💡 AとBを取り違えるのが典型的な読み違え' },
    { qid:'exam_setsu_s3_q5', short:'理科：像の大きさ（cm）',
      jp: stem('理科','〔実験〕で、光源側からスクリーンを観察したとき、スクリーンに映る矢印の形の像の大きさは何cmか。最も適当なものを、次のアからケまでの中から選びなさい。なお、右の図を必要に応じて使ってもよい。') + ask('答えるものはどれ？'),
      answer:'像の大きさ（cm）', choices:['像の大きさ（cm）','レンズからスクリーンまでの距離','焦点距離','厚紙の矢印の大きさ（4.0cm）'],
      exp:'📐 「像の大きさは何cmか」<br>✅ 作図して出るのは距離も大きさも両方。答えるのは<strong>像の大きさ</strong><br>💡 問題文に出てくる4.0cm（元の矢印）をそのまま答えない' },
    { qid:'exam_setsu_s3_q6', short:'英語：XとYだけ答える',
      jp: stem('英語','【W】から【Z】までのそれぞれに、あとのアからエまでをあてはめるとき、【X】と【Y】にあてはまる最も適当なものを選びなさい。') + ask('答えるものはどれ？'),
      answer:'XとYの2か所だけ', choices:['XとYの2か所だけ','WからZまで4か所全部','Xだけ','WとZ'],
      exp:'📐 「【X】と【Y】にあてはまる…ものを選びなさい」<br>✅ WからZ全部にあてはめて考えるが、<strong>マークするのはXとY</strong>だけ<br>💡 4つ全部埋めると自然にXとYも決まる。答える場所を間違えない' },
    { qid:'exam_setsu_s3_q7', short:'国語：同じ意味で使われている語',
      jp: stem('国語','傍線部「厳か」の「厳」と同じ意味で使われている語を、次のアからエまでの中から一つ選びなさい。') + ask('答えるものはどれ？'),
      answer:'「厳」が同じ意味で使われている語', choices:['「厳」が同じ意味で使われている語','「厳」と同じ読み方の語','「厳」と反対の意味の語','「厳」と画数が同じ語'],
      exp:'📐 「同じ<strong>意味</strong>で使われている語」<br>✅ 厳選・厳粛・厳禁・厳守のうち、「おごそか」の意味の「厳」を探す（厳粛）<br>💡 「同じ読み」ではない。意味を1つずつ考える' },
    { qid:'exam_setsu_s3_q8', short:'国語：一文が入る箇所',
      jp: stem('国語','本文中の（1）から（4）までのうち、抜けている一文が入る最も適当な箇所を、次のアからエまでの中から一つ選びなさい。') + ask('答えるものはどれ？'),
      answer:'一文が入る場所（番号）', choices:['一文が入る場所（番号）','抜けている一文の内容','段落の要旨','筆者の主張'],
      exp:'📐 「一文が入る最も適当な<strong>箇所</strong>」<br>✅ 答えるのは場所（(1)〜(4)のどこか）<br>💡 一文の内容を読み取るのは手段。答えは「どこに入るか」' },
    { qid:'exam_setsu_s3_q9', short:'英語：2・4・6番目',
      jp: stem('英語','次のアからキまでの中から六つ選んで正しく並べ替えるとき、2番目、4番目、6番目にくるものをそれぞれ選びなさい。') + ask('答えるものはどれ？'),
      answer:'2番目・4番目・6番目の語', choices:['2番目・4番目・6番目の語','1番目・3番目・5番目の語','六つ全部の順番','余った1語'],
      exp:'📐 「2番目、4番目、6番目にくるものをそれぞれ」<br>✅ 全部並べたあと、偶数番目の3つだけをマーク<br>💡 1番目を2番目の欄に塗るミスが多い。並べた文に番号を振る' },
    { qid:'exam_setsu_s3_q10', short:'数学：文字が異なる確率',
      jp: stem('数学','箱の中にAが書かれているカードが3枚、Bが書かれているカードが2枚、Cが書かれているカードが1枚入っている。中を見ないで、この箱からカードを同時に2枚取り出す。取り出した2枚のカードに書かれた文字が異なる確率として正しいものを、次のアからエまでの中から一つ選びなさい。') + ask('答えるものはどれ？'),
      answer:'2枚の文字が異なる確率', choices:['2枚の文字が異なる確率','2枚の文字が同じ確率','Aが出る確率','取り出し方の総数'],
      exp:'📐 「文字が<strong>異なる</strong>確率」<br>✅ 「同じ」の確率を出してから1から引く解き方もあるが、答えるのは「異なる」の方<br>💡 途中で出た「同じ確率」を答えない' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 設問を読んで答えよう ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 4: 単位・答え方・ただし書き =====
function renderSection4(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔍 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「ただし」って、読まなくてもいいやつでしょ？おまけみたいな。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">逆だ。「ただし」は解くためのヒントか、マークの注意。「ただし、糸の体積は無視できる」を読まなければ、糸の分を足すか引くかで迷って解けない。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">数学の大問3は記号じゃなくて数字を塗るの！？知らなかった…</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">「[アイ]度」なら、アの欄に十の位、イの欄に一の位の数字を塗る。答え方が違う問題が混ざっているのが愛知県の特徴だ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 単位・答え方・ただし書きのパターン</div>'
    + '<div class="rule-box"><div class="rule-title">単位</div><div class="ex">度／cm／cm²／cm³／g／人／個／％／秒後——「何cmか」「何人か」の直前の単位を確認</div></div>'
    + '<div class="rule-box"><div class="rule-title">答え方</div><div class="ex">記号を一つ（ア〜エ）／記号を組み合わせで一つ（ア〜ク）／数字をマーク（[アイ]＝2桁）／2番目・4番目・6番目</div></div>'
    + '<div class="rule-box"><div class="rule-title">ただし・なお（条件）</div><div class="ex">「ただし、糸の体積は無視できる」「ただし、地軸を23.4°傾けたまま」「なお、2か所の（①）には同じ人名」「ただし、分数は約分できない形で」</div></div>'
    + '<div class="note">💡 チェック方法：「ただし」「なお」を見つけたら青で囲む。解き始める前に、それが「ヒント」か「マークの注意」かを判断する</div>'
    + '</div>';

  var qs = [
    { qid:'exam_setsu_s4_q0', short:'数学：数字を2桁でマーク',
      jp: stem('数学','図で、C、Dは線分ABを直径とする円Oの周上の点で、CB＝CDである。∠COA＝48°のとき、∠OBDの大きさは[アイ]度である。') + ask('この問題の答え方は？'),
      answer:'アに十の位、イに一の位の数字をマーク', choices:['アに十の位、イに一の位の数字をマーク','記号ア・イのどちらかを選ぶ','角度を分数で答える','記述で答える'],
      exp:'📐 大問3は「[アイ]などに入る数字をそれぞれ答えなさい」<br>✅ 答えが33度なら、アに3、イに3をマーク<br>💡 記号選択ではない。数字をそのまま塗る。桁数が枠の数と合うか確認' },
    { qid:'exam_setsu_s4_q1', short:'数学：約分・根号を簡単に',
      jp: stem('数学','解答方法については、表紙の裏にある【解答上の注意】に従うこと。ただし、分数は、それ以上約分できない形で、また、根号の中は、最も簡単な数で答えること。') + ask('この「ただし」は何を指示している？'),
      answer:'約分しきった分数、√の中を最小にして答える', choices:['約分しきった分数、√の中を最小にして答える','小数に直して答える','分数のままでよい','根号は使わない'],
      exp:'📐 「約分できない形」「根号の中は最も簡単な数」<br>✅ 6/8 なら 3/4、√12 なら 2√3 にしてからマーク<br>💡 約分しないと枠の数と合わずマークできない' },
    { qid:'exam_setsu_s4_q2', short:'理科：糸の体積は無視',
      jp: stem('理科','金属柱Bの体積を測定したときの水面とメスシリンダーの目盛りのようすを模式的に表した図として最も適当なものを、次のアからオまでの中から選びなさい。ただし、糸の体積は無視できるものとする。') + ask('この「ただし」は何を指示している？'),
      answer:'糸の体積は0として、金属柱だけで考える', choices:['糸の体積は0として、金属柱だけで考える','糸の体積を足す','糸の質量を引く','糸は水に浮くと考える'],
      exp:'📐 「糸の体積は無視できる」＝糸の分は考えなくてよい<br>✅ 水面の上がり方＝金属柱Bの体積だけ<br>💡 これは「解くためのヒント」タイプのただし書き' },
    { qid:'exam_setsu_s4_q3', short:'理科：角度（度）',
      jp: stem('理科','夏至の日の南中時刻に発電量が最大になるように設置するとき、水平面と太陽電池の間の角度xとして最も適当なものを、次のアからコまでの中から選びなさい。ただし、地球は公転面に垂直な方向に対して地軸を23.4°傾けたまま公転しているとする。') + ask('答えの単位は？'),
      answer:'度（角度）', choices:['度（角度）','cm','℃','％'],
      exp:'📐 「角度xとして最も適当なもの」<br>✅ 単位は度。選択肢は0°〜58.4°<br>💡 「ただし、地軸を23.4°傾けたまま」は計算に使う数字を教えてくれるヒント。北緯35°と23.4°を使う' },
    { qid:'exam_setsu_s4_q4', short:'社会：2か所の①は同じ人名',
      jp: stem('社会','Ⅰの資料中の（①）にあてはまる人名として最も適当なものを、次のアからエまでの中から選びなさい。なお、Ⅰの資料中の2か所の（①）には、同じ人名があてはまる。') + ask('この「なお」は何を指示している？'),
      answer:'2か所の①には同じ人名が入る', choices:['2か所の①には同じ人名が入る','2か所の①には別の人名が入る','①は人名ではない','①は空欄のままでよい'],
      exp:'📐 「2か所の（①）には、同じ人名があてはまる」<br>✅ 両方の①の文脈に合う人物を1人選ぶ（2つの手がかりが使える）<br>💡 これもヒント。2か所の情報を両方使うと絞れる' },
    { qid:'exam_setsu_s4_q5', short:'数学：マーク欄は1行につき一つ',
      jp: stem('数学','関数 y＝6/x のグラフについて正しく述べた文を、次のアからカまでの中から二つ選びなさい。ただし、マーク欄は1行につき一つだけ塗りつぶすこと。') + ask('この「ただし」は何を指示している？'),
      answer:'答えの記号を、別々の行に1つずつ塗る', choices:['答えの記号を、別々の行に1つずつ塗る','1行に2つ塗る','塗らなくてよい','鉛筆以外で塗る'],
      exp:'📐 「マーク欄は1行につき一つだけ」＝「二つ選ぶ」問題のマークの注意<br>✅ 1行目にア、2行目にウ、のように分けて塗る<br>💡 これは「マークの注意」タイプ。解答用紙を見て行が2つあることを確認' },
    { qid:'exam_setsu_s4_q6', short:'理科：組み合わせを記号一つ',
      jp: stem('理科','文章中の（Ⅰ）から（Ⅲ）までにあてはまる語句の組み合わせとして最も適当なものを、下のアからクまでの中から選びなさい。') + ask('この問題の答え方は？'),
      answer:'アからクの記号を一つマーク', choices:['アからクの記号を一つマーク','Ⅰ・Ⅱ・Ⅲそれぞれに記号をマーク','語句を書く','三つ選ぶ'],
      exp:'📐 「組み合わせとして最も適当なものを…選びなさい」<br>✅ Ⅰ〜Ⅲの正しい組み合わせになっている記号を1個<br>💡 Ⅰが確実なら、8択が4択に減る。消去法' },
    { qid:'exam_setsu_s4_q7', short:'社会：国外1つ＋国内1つの組み合わせ',
      jp: stem('社会','次のa、bの文は日本国外の、c、dの文は日本国内のようすについて述べたものである。普通選挙法が制定されたときの国外、国内のようすについて述べた文の組み合わせとして最も適当なものを、下のアからエまでの中から選びなさい。') + ask('この問題の答え方は？'),
      answer:'国外から1つ・国内から1つの組み合わせを、記号一つで', choices:['国外から1つ・国内から1つの組み合わせを、記号一つで','aからdを全部マーク','国外の文だけ選ぶ','記述で答える'],
      exp:'📐 「a、bは国外、c、dは国内」「組み合わせとして…アからエまでの中から」<br>✅ 国外（aかb）と国内（cかd）を1つずつ決めて、その組み合わせの記号を1個<br>💡 選択肢は「a、c」「a、d」「b、c」「b、d」の4通り' },
    { qid:'exam_setsu_s4_q8', short:'数学：単位は個',
      jp: stem('数学','この農園でとれたキャベツ8000個のうち、重さが0.7kg以上1.3kg未満のキャベツの個数はおよそ何個と推定されるか、正しいものを次のアからエまでの中から一つ選びなさい。') + ask('答えの単位は？'),
      answer:'個', choices:['個','kg','％','人'],
      exp:'📐 「およそ何個」<br>✅ 単位は個。割合（％）で止めずに個数まで出す<br>💡 「およそ」＝推定なので、ぴったりでなくてよい' },
    { qid:'exam_setsu_s4_q9', short:'理科：図を使ってもよい',
      jp: stem('理科','スクリーンに映る矢印の形の像の大きさは何cmか。最も適当なものを、次のアからケまでの中から選びなさい。なお、右の図を必要に応じて使ってもよい。') + ask('この「なお」は何を指示している？'),
      answer:'図に作図して考えてよい（使わなくてもよい）', choices:['図に作図して考えてよい（使わなくてもよい）','必ず図に書き込んで提出する','図は使ってはいけない','図を採点する'],
      exp:'📐 「必要に応じて使ってもよい」＝作図用の方眼。採点はされない<br>✅ 光の道すじを描いて像の大きさを数える<br>💡 「使ってもよい」＝使った方が確実に解ける、というサイン' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 設問を読んで答えよう ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 5: 確認テスト =====
function renderSection5(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 確認テスト — 本物の設問で5か条チェック</div>'
    + '<div class="rule-box">'
    + '<div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + '8つの設問について、「何を答える・いくつ・否定・答え方・ただし」を続けて答える。全 <strong style="color:var(--gold)">20問</strong>！<br>'
    + 'きょん「設問、全部読む！！一文字も飛ばさない！！」<br>'
    + '西村「指で追え。読み終わったら口に出して確認」'
    + '</div></div></div>';

  var C_NEG = ['正しい・適当なものを選ぶ','適当でない・誤っているものを選ぶ','最も遠い（近いではない）ものを選ぶ'];
  var s1 = stem('国語','第四段落以降で述べられている建築に関する筆者の考えとして適当でないものを、次のアからカまでの中から二つ選びなさい。ただし、マーク欄は1行につき一つだけ塗りつぶすこと。');
  var s2 = stem('数学','3点P、Q、Rが同時に出発してから8秒後までの間で、△APQの面積と△ABRの面積が等しくなるときが何回かある。3回目に等しくなるときは何秒後から何秒後までの間にあるか、正しいものを次のアからカまでの中から一つ選びなさい。ただし、点Rが辺AB上にあるとき、△ABRの面積は0とする。');
  var s3 = stem('英語','下線部③にあてはまるように、次のアからキまでの中から六つ選んで正しく並べ替えるとき、2番目、4番目、6番目にくるものをそれぞれ選びなさい。');
  var s4 = stem('理科','〔観察2〕の結果から、表のAからEまでの中から、選んだ2つの種子がともに純系であることがわかるものを全て選んで、その組み合わせとして最も適当なものを、次のアからケまでの中から選びなさい。');
  var s5 = stem('社会','次のアからオまでの中から、日本の司法制度について述べた文として正しいものを二つ選びなさい。ただし、マーク欄は1行につき一つだけ塗りつぶすこと。');
  var s6 = stem('数学','ある飲食店の来店者数は、11月は10月より30%増加し、12月は11月より20%増加した。また、12月の来店者数は、10月の来店者数より2800人多かった。このとき、10月の来店者数として正しいものを、次のアからエまでの中から一つ選びなさい。');
  var s7 = stem('理科','金属柱Bの体積を測定したときの水面とメスシリンダーの目盛りのようすを模式的に表した図として最も適当なものを、次のアからオまでの中から選びなさい。ただし、糸の体積は無視できるものとする。');
  var s8 = stem('社会','図中の（X）にあてはまる文として最も適当なものを、下のアからウまでの中から、（Y）にあてはまる文として最も適当なものを、下のaからcまでの中からそれぞれ選びなさい。');

  var qs = [
    // 設問1（国語・二重トラップ）
    { qid:'exam_setsu_s5_q0', short:'テスト：国語 いくつ', jp: s1 + ask('いくつ選ぶ？'), answer:'二つ', choices:['一つ','二つ','三つ','全て選んで組み合わせ'],
      exp:'📐 「二つ選びなさい」<br>✅ マーク2個（別々の行）' },
    { qid:'exam_setsu_s5_q1', short:'テスト：国語 否定', jp: s1 + ask('正？それとも否定？'), answer:C_NEG[1], choices:C_NEG,
      exp:'📐 「適当<strong style="color:var(--red)">でない</strong>もの」<br>✅ 否定形＋二つの二重トラップ。本文と合わない2つを探す' },
    { qid:'exam_setsu_s5_q2', short:'テスト：国語 ただし', jp: s1 + ask('「ただし」は何の指示？'), answer:'答えの記号を別々の行に1つずつ塗る', choices:['答えの記号を別々の行に1つずつ塗る','1行に2つ塗る','四段落だけ読む','塗らなくてよい'],
      exp:'📐 「マーク欄は1行につき一つだけ」<br>✅ マークの注意タイプ' },
    // 設問2（数学・動点）
    { qid:'exam_setsu_s5_q3', short:'テスト：数学 何を答える', jp: s2 + ask('答えるものはどれ？'), answer:'3回目に等しくなる時間の範囲', choices:['3回目に等しくなる時間の範囲','等しくなる回数','1回目に等しくなる時間','8秒後の面積'],
      exp:'📐 「3回目に等しくなるときは何秒後から何秒後までの間にあるか」<br>✅ 回数は答えではない。3回目の範囲' },
    { qid:'exam_setsu_s5_q4', short:'テスト：数学 ただし', jp: s2 + ask('「ただし」は何の指示？'), answer:'Rが辺AB上にあるとき△ABRの面積を0として計算する', choices:['Rが辺AB上にあるとき△ABRの面積を0として計算する','Rは辺AB上を動かない','面積は常に0','8秒後で止める'],
      exp:'📐 「点Rが辺AB上にあるとき、△ABRの面積は0とする」<br>✅ 解くためのヒント。Rが辺AB上にいる間は三角形がつぶれて面積0' },
    { qid:'exam_setsu_s5_q5', short:'テスト：数学 いくつ', jp: s2 + ask('いくつ選ぶ？'), answer:'一つ', choices:['一つ','二つ','三つ','全て選んで組み合わせ'],
      exp:'📐 「一つ選びなさい」<br>✅ マーク1個' },
    // 設問3（英語・並べ替え）
    { qid:'exam_setsu_s5_q6', short:'テスト：英語 使う語の数', jp: s3 + ask('アからキ（7語）のうち、使う語はいくつ？'), answer:'六つ（一つ余る）', choices:['七つ全部','六つ（一つ余る）','三つだけ','二つ'],
      exp:'📐 「六つ選んで」<br>✅ 1語は使わない' },
    { qid:'exam_setsu_s5_q7', short:'テスト：英語 答えるもの', jp: s3 + ask('答えるものはどれ？'), answer:'2番目・4番目・6番目の語', choices:['2番目・4番目・6番目の語','1番目・3番目・5番目の語','六つ全部の順番','余った1語'],
      exp:'📐 「2番目、4番目、6番目にくるものをそれぞれ」<br>✅ 偶数番目の3か所' },
    // 設問4（理科・純系）
    { qid:'exam_setsu_s5_q8', short:'テスト：理科 いくつ', jp: s4 + ask('最後にマークするのはいくつ？'), answer:'記号を一つ（組み合わせ）', choices:['記号を一つ（組み合わせ）','AからEを全部マーク','二つ','五つ'],
      exp:'📐 「全て選んで、その組み合わせ…選びなさい」<br>✅ ○×をつけて、合う記号を1個' },
    { qid:'exam_setsu_s5_q9', short:'テスト：理科 何を答える', jp: s4 + ask('答えるものはどれ？'), answer:'2つの種子がともに純系だとわかる組', choices:['2つの種子がともに純系だとわかる組','しわ形が出た組','丸形だけが出た組','種子の数'],
      exp:'📐 「選んだ2つの種子がともに純系であることがわかるもの」<br>✅ 「ともに」＝両方とも純系。片方だけでは不可' },
    { qid:'exam_setsu_s5_q10', short:'テスト：理科 答え方', jp: s4 + ask('答え方は？'), answer:'アからケの記号を一つマーク', choices:['アからケの記号を一つマーク','AからEに○×を書く','記述で答える','数字をマーク'],
      exp:'📐 「アからケまでの中から選びなさい」<br>✅ 記号1個' },
    // 設問5（社会・司法）
    { qid:'exam_setsu_s5_q11', short:'テスト：社会 いくつ', jp: s5 + ask('いくつ選ぶ？'), answer:'二つ', choices:['一つ','二つ','三つ','全て選んで組み合わせ'],
      exp:'📐 「二つ選びなさい」<br>✅ マーク2個' },
    { qid:'exam_setsu_s5_q12', short:'テスト：社会 否定', jp: s5 + ask('正？それとも否定？'), answer:C_NEG[0], choices:C_NEG,
      exp:'📐 「正しいものを」＝正<br>✅ 5つに○×をつけて○を2つ' },
    { qid:'exam_setsu_s5_q13', short:'テスト：社会 ただし', jp: s5 + ask('「ただし」は何の指示？'), answer:'答えの記号を別々の行に1つずつ塗る', choices:['答えの記号を別々の行に1つずつ塗る','1行に2つ塗る','裁判の話だけ読む','塗らなくてよい'],
      exp:'📐 「マーク欄は1行につき一つだけ」<br>✅ マークの注意タイプ' },
    // 設問6（数学・%）
    { qid:'exam_setsu_s5_q14', short:'テスト：数学 何を答える', jp: s6 + ask('答えるものはどれ？'), answer:'10月の来店者数', choices:['10月の来店者数','11月の来店者数','12月の来店者数','増えた人数（2800人）'],
      exp:'📐 「10月の来店者数として正しいもの」<br>✅ xそのもの' },
    { qid:'exam_setsu_s5_q15', short:'テスト：数学 単位', jp: s6 + ask('答えの単位は？'), answer:'人', choices:['人','％','円','月'],
      exp:'📐 「来店者数」＝人<br>✅ 選択肢は4200人〜5600人' },
    { qid:'exam_setsu_s5_q16', short:'テスト：数学 否定', jp: s6 + ask('正？それとも否定？'), answer:C_NEG[0], choices:C_NEG,
      exp:'📐 「正しいものを」＝正<br>✅ 否定形なし' },
    // 設問7（理科・メスシリンダー）
    { qid:'exam_setsu_s5_q17', short:'テスト：理科 何を答える', jp: s7 + ask('答えるものはどれ？'), answer:'金属柱Bを沈めたときの水面の図', choices:['金属柱Bを沈めたときの水面の図','金属柱Aを沈めたときの水面の図','金属柱Bの質量','金属柱Bの密度'],
      exp:'📐 「金属柱<strong>B</strong>の体積を測定したときの…図」<br>✅ Bの図。Aと取り違えない' },
    { qid:'exam_setsu_s5_q18', short:'テスト：理科 ただし', jp: s7 + ask('「ただし」は何の指示？'), answer:'糸の体積は0として、金属柱だけで考える', choices:['糸の体積は0として、金属柱だけで考える','糸の体積を足す','糸の質量を引く','糸は水に浮くと考える'],
      exp:'📐 「糸の体積は無視できる」<br>✅ ヒントタイプ。水面の上昇＝Bの体積だけ' },
    // 設問8（社会・XY）
    { qid:'exam_setsu_s5_q19', short:'テスト：社会 いくつ', jp: s8 + ask('いくつ選ぶ？'), answer:'（　）ごとに一つずつ', choices:['一つ','二つ','（　）ごとに一つずつ','全て選んで組み合わせ'],
      exp:'📐 「（X）は…から、（Y）は…からそれぞれ」<br>✅ Xにア〜ウから1個、Yにa〜cから1個。合計2か所' },
  ];

  html += renderQs(qs);
  return html;
}

function showFinalResult(){
  var s5qids = Object.keys(qMeta).filter(function(id){ return id.indexOf(QID_PREFIX + 's5_') === 0; });
  var total = s5qids.length || 20;
  var correct = s5qids.filter(function(id){
    var d = weakDB[id]; return d && d.correct > 0;
  }).length;
  var pct = Math.round(correct / total * 100);
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '🎭' : '🥚';
  var msg = pct >= 90 ? 'きょん「設問、完全に読めた！！本番でも読み落とさない！！」<br>西村「文句なし。この読み方を全教科で使え」'
          : pct >= 70 ? 'きょん「だいぶ読めるようになった！！」<br>西村「あと少し。間違えたパターンを特訓で潰そう」'
          : pct >= 50 ? 'きょん「半分は読めた…！」<br>西村「弱点ノートで、どのチェックを落としたか見よう」'
          : 'きょん「設問って難しい…」<br>西村「大丈夫。指で追いながら、一文字ずつ。特訓モードでもう一度」';
  var overlay = document.getElementById('resultOverlay');
  overlay.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--purple);border-radius:20px;padding:36px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 8px 40px rgba(163,113,247,0.25)">'
    + '<div style="font-size:60px;margin-bottom:12px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:26px;color:var(--purple);letter-spacing:2px;margin-bottom:8px">確認テスト結果</div>'
    + '<div style="font-size:44px;color:var(--gold);font-weight:bold;font-family:Bebas Neue,sans-serif">' + correct + ' / ' + total + '</div>'
    + '<div style="font-size:22px;color:var(--gold);margin-bottom:20px">' + pct + '%</div>'
    + '<div style="font-size:14px;color:var(--text2);line-height:2.1;margin-bottom:24px">' + msg + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    + '<button id="resBtnWeak" style="background:var(--purple);color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">📊 弱点を見る</button>'
    + '<button id="resBtnTokku" style="background:var(--red);color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 特訓する</button>'
    + '<button id="resBtnClose" style="background:var(--bg3);color:var(--text2);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:14px;font-family:inherit;cursor:pointer;">閉じる</button>'
    + '</div></div>';
  overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center;overflow-y:auto;padding:20px;box-sizing:border-box';
  document.getElementById('resBtnWeak').addEventListener('click', function(){ overlay.style.display='none'; goSection(6); });
  document.getElementById('resBtnTokku').addEventListener('click', function(){ overlay.style.display='none'; goSection(7); });
  document.getElementById('resBtnClose').addEventListener('click', function(){ overlay.style.display='none'; });
}

// ===== SECTION 6: 弱点ノート =====
function renderWeakNote(){
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf(QID_PREFIX) === 0; });
  var wqs = getWeakQuestions();
  var html = '<div class="section-header"><div class="section-badge">設問の読み方 · 弱点ノート</div><div class="section-title">弱点ノート</div><div class="section-sub">読み落としやすいパターンを確認しよう</div></div>';
  if(allQids.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">📊</div><div style="font-size:16px;line-height:2">まだ記録がありません。<br>Section 1 から設問を読み始めよう！</div></div>';
    document.getElementById('mainContent').innerHTML = html; return;
  }
  var sorted = allQids.slice().sort(function(a,b){ return getPct(a) - getPct(b); });
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--gold)">' + allQids.length + '</div><div style="font-size:11px;color:var(--text2)">記録済み問題</div></div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--red)">' + wqs.length + '</div><div style="font-size:11px;color:var(--text2)">要特訓（80%未満）</div></div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--green)">' + (allQids.length - wqs.length) + '</div><div style="font-size:11px;color:var(--text2)">習得済み</div></div>'
    + '</div>';
  html += '<div style="font-size:13px;color:var(--text2);margin-bottom:12px">正答率の低い順</div>';
  sorted.forEach(function(qid){
    var d = weakDB[qid]; var pct = getPct(qid);
    var barColor = pct < 50 ? 'var(--red)' : pct < 80 ? 'var(--gold)' : 'var(--green)';
    html += '<div style="background:var(--bg2);border:1px solid var(--border);border-left:4px solid ' + barColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:14px">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(163,113,247,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:14px;color:var(--text);margin-bottom:2px">' + (d.short || qid) + '</div><div style="font-size:12px;color:var(--text2)">正解：' + d.answer + '　（' + d.correct + '/' + d.total + '回）</div></div>'
      + '</div>';
  });
  if(wqs.length > 0){
    html += '<button id="go_tokku_btn" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }
  document.getElementById('mainContent').innerHTML = html;
  var gb = document.getElementById('go_tokku_btn'); if(gb) gb.addEventListener('click', function(){ goSection(7); });
}

// ===== SECTION 7: 特訓モード =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };
function renderTokkuMode(){
  var wqs = getWeakQuestions();
  var html = '<div class="section-header"><div class="section-badge" style="background:var(--red)">設問の読み方 · 特訓</div><div class="section-title">弱点特訓モード</div><div class="section-sub">読み落としパターンを集中練習！</div></div>';
  if(wqs.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-size:16px;line-height:2">弱点なし！<br>きょん「全部読めてる！！設問マスター！！」</div></div>';
    document.getElementById('mainContent').innerHTML = html; return;
  }
  tokkuQueue = shuffleArray(wqs).slice(0, 15); tokkuIndex = 0; tokkuSession = { correct:0, total:0 };
  document.getElementById('mainContent').innerHTML = html + '<div id="tokkuArea"></div>';
  renderTokkuCard();
}
function renderTokkuCard(){
  var area = document.getElementById('tokkuArea'); if(!area) return;
  if(tokkuIndex >= tokkuQueue.length){ showTokkuComplete(); return; }
  var qid = tokkuQueue[tokkuIndex]; var d = weakDB[qid];
  if(!d){ tokkuIndex++; renderTokkuCard(); return; }
  var pct = getPct(qid); var color = pct < 50 ? 'var(--red)' : 'var(--gold)';
  var choices = shuffleArray(d.choices && d.choices.length ? d.choices : [d.answer]);
  var html = '<div class="tokku-progress">問題 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　正解 ' + tokkuSession.correct + '</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span class="pct" style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp" style="text-align:left">' + d.jp + '</div>'
    + '<div class="tokku-choices">' + choices.map(function(c){ return '<button class="choice-btn" data-tchoice="' + c + '">' + c + '</button>'; }).join('') + '</div>'
    + '<div class="tokku-result" id="tokkuResult"></div>'
    + '<button id="tokkuNext" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:12px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer">次へ →</button>'
    + '</div>';
  area.innerHTML = html;
  area.querySelectorAll('.choice-btn[data-tchoice]').forEach(function(b){
    b.addEventListener('click', function(){ handleTokkuChoice(qid, b.dataset.tchoice); });
  });
}
function handleTokkuChoice(qid, choice){
  var d = weakDB[qid]; if(!d) return;
  var correct = choice === d.answer;
  d.total++; if(correct) d.correct++;
  localStorage.setItem('exam_weakdb', JSON.stringify(weakDB));
  tokkuSession.total++; if(correct) tokkuSession.correct++;
  var res = document.getElementById('tokkuResult');
  var newPct = getPct(qid);
  document.querySelectorAll('#tokkuArea .choice-btn[data-tchoice]').forEach(function(b){ b.disabled = true; if(b.dataset.tchoice === d.answer) b.classList.add('selected-correct'); else if(b.dataset.tchoice === choice && !correct) b.classList.add('selected-wrong'); });
  if(correct){
    res.className = 'tokku-result tokku-correct'; res.style.display = 'block';
    res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 この問題は卒業！' : ' 正答率 → ' + newPct + '%');
  } else {
    deductXP(3);
    res.className = 'tokku-result tokku-wrong'; res.style.display = 'block';
    res.innerHTML = '❌ 間違い！ 正答率 → ' + newPct + '%<div class="tokku-answer">' + d.answer + '</div>';
  }
  renderWeakBar(); renderTabs();
  var nb = document.getElementById('tokkuNext'); if(nb){ nb.style.display = 'inline-block'; nb.addEventListener('click', function(){ tokkuIndex++; renderTokkuCard(); }); }
}
function showTokkuComplete(){
  var area = document.getElementById('tokkuArea'); if(!area) return;
  var pctAll = tokkuSession.total ? Math.round(tokkuSession.correct / tokkuSession.total * 100) : 0;
  area.innerHTML = '<div class="tokku-complete">'
    + '<div class="tokku-complete-emoji">' + (pctAll >= 80 ? '🏆' : '💪') + '</div>'
    + '<div class="tokku-complete-title">特訓終了！</div>'
    + '<div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div>'
    + '<div class="tokku-complete-msg">' + tokkuSession.correct + ' / ' + tokkuSession.total + ' 問正解<br>'
    + (pctAll >= 80 ? 'きょん「読み落とし、ほぼゼロ！！」' : 'きょん「まだ飛ばしてる…もう一回！！」') + '</div>'
    + '<button id="tokkuAgain" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer">🔥 もう一度特訓</button>'
    + '</div>';
  document.getElementById('tokkuAgain').addEventListener('click', function(){ renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
renderSection(0);
