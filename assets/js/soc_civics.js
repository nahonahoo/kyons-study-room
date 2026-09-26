// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「公民？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「三権分立、なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺、公民できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',    title:'課長',          status:'きょん「にっくんより政治に詳しくなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',        title:'部長',          status:'きょん「円高円安で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('soc_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('soc_civ_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('soc_civ_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('soc_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;
var QID_PREFIX = 'soc_civ_';

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
  localStorage.setItem('soc_xp', xp);
  localStorage.setItem('soc_civ_answered', JSON.stringify(answeredSet));
  updateXP(); return getLevel(xp).lv > old;
}
function deductXP(pts){
  var old = getLevel(xp).lv; xp = Math.max(0, xp - pts);
  localStorage.setItem('soc_xp', xp); updateXP(); return getLevel(xp).lv < old;
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
    return '<div class="weak-item"><span class="weak-item-word">' + (d.jp || qid) + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect){
  if(!weakDB[qid]) weakDB[qid] = { jp:(qMeta[qid]&&qMeta[qid].jp)||'', answer:(qMeta[qid]&&qMeta[qid].answer)||'', choices:(qMeta[qid]&&qMeta[qid].choices)||[], correct:0, total:0 };
  weakDB[qid].total++; if(isCorrect) weakDB[qid].correct++;
  localStorage.setItem('soc_weakdb', JSON.stringify(weakDB));
  var _t = new Date().toISOString().slice(0,10);
  var _d = JSON.parse(localStorage.getItem('soc_daily') || '{}');
  _d[_t] = (_d[_t] || 0) + 1; localStorage.setItem('soc_daily', JSON.stringify(_d));
  localStorage.setItem('soc_civ_lastStudy', _t);
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
  correct: ['きょん「合ってる！！公民いけるじゃん！！」', 'きょん「やった！！三権分立、余裕！！」', 'きょん「にっくん見て！解けた！！」'],
  nishi:   ['西村「正解。しくみが見えてる」', '西村「できてる。その調子」', '西村「正確に答えられてる」']
};
function getComment(type){ var a = COMMENTS[type] || COMMENTS.correct; return a[Math.floor(Math.random() * a.length)]; }
function shuffleArray(arr){ var a = arr.slice(); for(var i = a.length-1; i > 0; i--){ var j = Math.floor(Math.random()*(i+1)); var t = a[i]; a[i]=a[j]; a[j]=t; } return a; }
function toggleHint(qid){ var h = document.getElementById('hint_' + qid); if(h) h.style.display = h.style.display === 'block' ? 'none' : 'block'; }
function numMatch(input, answer){
  var ni = input.trim().replace(/\s+/g,'');
  var na = answer.trim().replace(/\s+/g,'');
  if(ni === na) return true;
  var n1 = parseFloat(ni.replace(/[^\d.\-]/g,'')), n2 = parseFloat(na.replace(/[^\d.\-]/g,''));
  if(!isNaN(n1) && !isNaN(n2) && Math.abs(n1-n2) < 0.001) return true;
  return false;
}
function chat(type, name, text){
  var cls = type === 'kyon' ? 'av-kyon' : 'av-nishi';
  var av  = type === 'kyon' ? '😄' : '慶';
  return '<div class="chat-line"><div class="avatar ' + cls + '">' + av + '</div><div><div class="chat-name">' + name + '</div><div class="chat-bubble">' + text + '</div></div></div>';
}
// 入試の「生徒のメモ」風ボックス
function memo(text){
  return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin:6px 0 10px;font-size:15px;line-height:2.1;letter-spacing:0.04em">' + text + '</div>';
}

// ===== QUESTION ENGINE =====
function makeChoices(qid, jp, answer, choices, exp){
  choices = shuffleArray(choices);
  qMeta[qid] = { type:'choice', answer:answer, xp:4, jp:jp, choices:choices };
  var done = answeredSet[qid];
  return '<div class="q-card" data-card="' + qid + '">'
    + '<div class="q-text">' + jp + '</div>'
    + '<div class="choices">' + choices.map(function(c){
        if(done) return '<button class="choice-btn ' + (c===answer?'show-correct':'') + '" disabled>' + c + '</button>';
        return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
      }).join('') + '</div>'
    + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度！</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + '<div class="exp-card-title">📐 解説</div><div style="color:var(--text);font-size:13px;line-height:2.1">' + exp + '</div></div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '"><div class="ans-label">✅ 正解</div><div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">' + (done?getComment('nishi'):'') + '</div>'
    + '</div>';
}
function makeInputCard(qid, jp, formula, answer, xpPts, hint, expText){
  qMeta[qid] = { type:'input', answer:answer, xp:xpPts, jp:jp };
  var done = answeredSet[qid];
  var hintHtml = hint ? '<button class="hint-btn" data-hqid="' + qid + '">💡 ヒント</button><div class="hint-box" id="hint_' + qid + '">' + hint + '</div>' : '';
  var inputHtml = done
    ? '<div class="input-wrap"><input class="q-input" disabled value="' + answer + '" style="border-color:var(--green);color:var(--green)"><span style="margin-left:4px;color:var(--green)">✓</span></div>'
    : '<div class="input-wrap"><input class="q-input" id="inp_' + qid + '" type="text" placeholder="答え"><button class="input-submit" data-qid="' + qid + '">確認</button></div>';
  return '<div class="q-card" data-card="' + qid + '">'
    + '<div class="q-text">' + jp + '</div>'
    + (formula ? '<div class="q-formula">' + formula + '</div>' : '')
    + hintHtml + inputHtml
    + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度！</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + '<div class="exp-card-title">📐 解説</div><div style="color:var(--text);font-size:13px;line-height:2.2">' + expText + '</div></div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '"><div class="ans-label">✅ 正解</div><div id="ar_ans_' + qid + '" style="font-size:20px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">' + (done?getComment('nishi'):'') + '</div>'
    + '</div>';
}
function handleChoice(qid, choice){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  if(choice === meta.answer) markCorrect(qid, meta); else markWrong(qid, meta, choice);
}
function handleInput(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  var inp = document.getElementById('inp_' + qid); if(!inp) return;
  var val = inp.value.trim(); if(!val){ showToast('答えを入力してください！'); return; }
  if(numMatch(val, meta.answer)){ inp.style.borderColor = 'var(--green)'; markCorrect(qid, meta); }
  else { inp.style.borderColor = 'var(--red)'; markWrong(qid, meta, val); inp.select(); }
}
function markCorrect(qid, meta){
  recordResult(qid, true);
  var lvUp = addXP(meta.xp || 4, qid);
  var card = document.querySelector('[data-card="' + qid + '"]'); if(card) card.classList.add('correct-card');
  var fb = document.getElementById('fb_' + qid); if(fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = getComment('nishi'); ac.style.display = 'block'; }
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('selected-correct'); });
  var inp = document.getElementById('inp_' + qid); if(inp){ inp.disabled = true; var sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if(sb) sb.style.display = 'none'; }
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
  else { var msgs = ['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！しくみをもう一回！！」','きょん「ルールカードを見直す！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('soc_civ_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var inp = document.getElementById('inp_' + qid); if(inp){ inp.disabled = true; inp.value = meta.answer; var sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if(sb) sb.style.display = 'none'; }
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で解く！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。しくみを理解しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = QID_PREFIX + 's' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('soc_civ_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if(nb && nb.style.display === 'none'){
      nb.style.display = 'block';
      if(!document.getElementById('secCompleteBanner')){
        var banner = document.createElement('div'); banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 4 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '確認テストへ挑戦！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(245,158,11,0.12),rgba(163,113,247,0.08));border:1px solid var(--gold);border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--gold);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
          + '<div style="font-size:14px;color:var(--text2)">きょん「全問解いた！！にっくん、俺やれるじゃん！！」</div>'
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
  { id:0, label:'⚖️ スタート',  title:'公民とは',                 sub:'入試の大問5・6はまるごと公民。しくみを4つの部屋に分けて覚える' },
  { id:1, label:'人権・憲法',   title:'現代社会・人権・憲法',      sub:'効率と公正・契約・法の支配・人権の種類・公共の福祉・憲法改正' },
  { id:2, label:'政治',         title:'民主政治のしくみ',          sub:'選挙・国会・内閣・裁判所・三権分立・地方自治' },
  { id:3, label:'経済',         title:'経済のしくみ',              sub:'需要と供給・物価と景気・日本銀行・為替・財政・社会保障' },
  { id:4, label:'確認テスト',   title:'確認テスト',                sub:'愛知県入試形式20問' },
  { id:5, label:'📊弱点',       title:'弱点ノート',                sub:'間違えた問題を確認' },
  { id:6, label:'🔥特訓',       title:'弱点特訓モード',            sub:'弱点問題を集中練習！' },
];

function renderTabs(){
  var html = '';
  SECTIONS.forEach(function(s){
    var cls = 'section-tab'
      + (s.id === currentSection ? ' active' : '')
      + (sectionDone[s.id] && s.id < 5 ? ' done' : '')
      + (s.id === 6 ? ' tokku' : '');
    var label = s.label + (sectionDone[s.id] && s.id < 5 ? ' ✓' : '');
    if(s.id === 6){ var wk = getWeakQuestions(); label = '🔥特訓' + (wk.length > 0 ? '('+wk.length+')' : ''); }
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
  if(id === 5){ renderWeakNote(); return; }
  if(id === 6){ renderTokkuMode(); return; }
  var s = SECTIONS[id];
  var html = '<div class="progress-dots">';
  for(var i = 0; i <= 4; i++){ html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>'; }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">社会 公民 · SECTION ' + id + '</div>'
    + '<div class="section-title">' + s.title + '</div>'
    + '<div class="section-sub">' + s.sub + '</div>'
    + '</div>';
  if     (id === 0) html += renderSection0();
  else if(id === 1) html += renderSection1();
  else if(id === 2) html += renderSection2();
  else if(id === 3) html += renderSection3();
  else if(id === 4) html += renderSection4();
  if(id >= 1 && id <= 4){
    var nextLabel  = id < 4 ? '次のセクションへ →' : '🏆 結果を見る！';
    html += '<button class="next-section-btn" id="nextBtn" data-goto="' + (id < 4 ? id+1 : 'result') + '" style="display:none">' + nextLabel + '</button>';
  }
  document.getElementById('mainContent').innerHTML = html;
  bindEvents();
  if(sectionDone[id]){ var nb = document.getElementById('nextBtn'); if(nb) nb.style.display = 'block'; }
  checkSectionComplete();
}
function bindEvents(){
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(b){ b.addEventListener('click', function(){ handleChoice(b.dataset.qid, b.dataset.choice); }); });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(b){ b.addEventListener('click', function(){ showAnswer(b.dataset.qid); }); });
  document.querySelectorAll('.input-submit[data-qid]').forEach(function(b){ b.addEventListener('click', function(){ handleInput(b.dataset.qid); }); });
  document.querySelectorAll('.q-input[id^="inp_"]').forEach(function(inp){ inp.addEventListener('keydown', function(e){ if(e.key==='Enter') handleInput(inp.id.replace('inp_','')); }); });
  document.querySelectorAll('.hint-btn[data-hqid]').forEach(function(b){ b.addEventListener('click', function(){ toggleHint(b.dataset.hqid); }); });
  document.querySelectorAll('.next-section-btn[data-goto]').forEach(function(b){
    b.addEventListener('click', function(){ var g = b.dataset.goto; if(g === 'result') showFinalResult(); else goSection(parseInt(g)); });
  });
  document.querySelectorAll('.start-btn[data-goto]').forEach(function(b){ b.addEventListener('click', function(){ goSection(parseInt(b.dataset.goto)); }); });
}
function renderQs(qs, startNo){
  var html = ''; var n = startNo || 1;
  qs.forEach(function(q){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + n + '</div>';
    if(q.type === 'input') html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
    else html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
    n++;
  });
  return html;
}

// ===== SVG =====
// 三権分立
var svgSanken = '<svg viewBox="0 0 320 250" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="16" fill="#8b949e" font-size="10" text-anchor="middle">【三権分立：3つの力がお互いを見張る】</text>'
  // 国会 (top)
  + '<rect x="110" y="26" width="100" height="40" rx="8" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" stroke-width="1.5"/>'
  + '<text x="160" y="43" fill="#f59e0b" font-size="12" text-anchor="middle" font-weight="bold">国会（立法）</text>'
  + '<text x="160" y="58" fill="#8b949e" font-size="9" text-anchor="middle">法律をつくる・国民の代表</text>'
  // 内閣 (bottom-left)
  + '<rect x="10" y="170" width="110" height="40" rx="8" fill="rgba(14,165,233,0.15)" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<text x="65" y="187" fill="#0ea5e9" font-size="12" text-anchor="middle" font-weight="bold">内閣（行政）</text>'
  + '<text x="65" y="202" fill="#8b949e" font-size="9" text-anchor="middle">法律を実行する・首相と大臣</text>'
  // 裁判所 (bottom-right)
  + '<rect x="200" y="170" width="110" height="40" rx="8" fill="rgba(163,113,247,0.15)" stroke="#a371f7" stroke-width="1.5"/>'
  + '<text x="255" y="187" fill="#a371f7" font-size="12" text-anchor="middle" font-weight="bold">裁判所（司法）</text>'
  + '<text x="255" y="202" fill="#8b949e" font-size="9" text-anchor="middle">法律で裁く・憲法の番人</text>'
  // arrows 国会→内閣
  + '<line x1="118" y1="68" x2="70" y2="166" stroke="#f59e0b" stroke-width="1.2"/>'
  + '<text x="40" y="112" fill="#f59e0b" font-size="8">内閣不信任決議</text>'
  + '<text x="40" y="123" fill="#f59e0b" font-size="8">首相の指名</text>'
  // 内閣→国会
  + '<line x1="90" y1="166" x2="140" y2="68" stroke="#0ea5e9" stroke-width="1.2"/>'
  + '<text x="112" y="140" fill="#0ea5e9" font-size="8">衆議院の解散</text>'
  // 国会→裁判所
  + '<line x1="202" y1="68" x2="250" y2="166" stroke="#f59e0b" stroke-width="1.2"/>'
  + '<text x="228" y="100" fill="#f59e0b" font-size="8">弾劾裁判所</text>'
  // 裁判所→国会
  + '<line x1="230" y1="166" x2="180" y2="68" stroke="#a371f7" stroke-width="1.2"/>'
  + '<text x="170" y="140" fill="#a371f7" font-size="8">違憲審査</text>'
  // 内閣↔裁判所
  + '<line x1="120" y1="185" x2="200" y2="185" stroke="#8b949e" stroke-width="1.2"/>'
  + '<text x="160" y="181" fill="#0ea5e9" font-size="8" text-anchor="middle">裁判官の任命</text>'
  + '<text x="160" y="197" fill="#a371f7" font-size="8" text-anchor="middle">違憲審査</text>'
  // 国民
  + '<rect x="100" y="222" width="120" height="22" rx="11" fill="rgba(63,185,80,0.15)" stroke="#3fb950" stroke-width="1.5"/>'
  + '<text x="160" y="237" fill="#3fb950" font-size="10" text-anchor="middle" font-weight="bold">国民（選挙・世論・国民審査）</text>'
  + '</svg>';

// 需要と供給
var svgDemand = '<svg viewBox="0 0 300 190" style="width:100%;max-width:340px;display:block;margin:0 auto">'
  + '<text x="150" y="14" fill="#8b949e" font-size="10" text-anchor="middle">【需要と供給：価格はどこで決まる？】</text>'
  + '<line x1="40" y1="160" x2="280" y2="160" stroke="#8b949e" stroke-width="1.5"/>'
  + '<line x1="40" y1="160" x2="40" y2="25" stroke="#8b949e" stroke-width="1.5"/>'
  + '<text x="270" y="175" fill="#8b949e" font-size="9">数量</text>'
  + '<text x="8" y="30" fill="#8b949e" font-size="9">価格</text>'
  + '<line x1="60" y1="40" x2="250" y2="150" stroke="#e94560" stroke-width="2"/>'
  + '<text x="230" y="140" fill="#e94560" font-size="10" font-weight="bold">需要（買いたい）</text>'
  + '<line x1="60" y1="150" x2="250" y2="40" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="200" y="38" fill="#0ea5e9" font-size="10" font-weight="bold">供給（売りたい）</text>'
  + '<circle cx="155" cy="95" r="6" fill="#f5c518" stroke="#0d1117" stroke-width="2"/>'
  + '<text x="165" y="92" fill="#f5c518" font-size="10" font-weight="bold">均衡価格</text>'
  + '<line x1="155" y1="95" x2="40" y2="95" stroke="#f5c518" stroke-width="1" stroke-dasharray="4,3"/>'
  + '<text x="50" y="183" fill="#8b949e" font-size="9">💡 需要＞供給→価格↑　需要＜供給→価格↓（不景気）</text>'
  + '</svg>';

// 為替
var svgKawase = '<svg viewBox="0 0 300 130" style="width:100%;max-width:340px;display:block;margin:0 auto">'
  + '<text x="150" y="14" fill="#8b949e" font-size="10" text-anchor="middle">【円高・円安：1ドルが何円か】</text>'
  + '<rect x="10" y="28" width="130" height="44" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="1.5"/>'
  + '<text x="75" y="45" fill="#3fb950" font-size="11" text-anchor="middle" font-weight="bold">1ドル＝100円</text>'
  + '<text x="75" y="62" fill="#3fb950" font-size="10" text-anchor="middle">円高（円の価値が高い）</text>'
  + '<rect x="160" y="28" width="130" height="44" rx="8" fill="rgba(233,69,96,0.12)" stroke="#e94560" stroke-width="1.5"/>'
  + '<text x="225" y="45" fill="#e94560" font-size="11" text-anchor="middle" font-weight="bold">1ドル＝150円</text>'
  + '<text x="225" y="62" fill="#e94560" font-size="10" text-anchor="middle">円安（円の価値が安い）</text>'
  + '<text x="10" y="92" fill="#e6edf3" font-size="10">15000円を持ってアメリカへ：</text>'
  + '<text x="10" y="108" fill="#3fb950" font-size="10">円高（100円）→ 150ドル受け取れる（多い）</text>'
  + '<text x="10" y="124" fill="#e94560" font-size="10">円安（150円）→ 100ドルしか受け取れない（少ない）</text>'
  + '</svg>';

// 裁判のしくみ（民事・刑事）
var svgSaiban = '<svg viewBox="0 0 320 150" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="80" y="14" fill="#0ea5e9" font-size="11" text-anchor="middle" font-weight="bold">A 民事裁判</text>'
  + '<rect x="8" y="24" width="50" height="28" rx="5" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9"/>'
  + '<text x="33" y="42" fill="#e6edf3" font-size="9" text-anchor="middle">原告</text>'
  + '<text x="80" y="42" fill="#8b949e" font-size="9" text-anchor="middle">訴える→</text>'
  + '<rect x="102" y="24" width="50" height="28" rx="5" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9"/>'
  + '<text x="127" y="42" fill="#e6edf3" font-size="9" text-anchor="middle">被告</text>'
  + '<rect x="40" y="70" width="80" height="26" rx="5" fill="rgba(163,113,247,0.15)" stroke="#a371f7"/>'
  + '<text x="80" y="87" fill="#a371f7" font-size="9" text-anchor="middle">裁判所</text>'
  + '<text x="80" y="115" fill="#8b949e" font-size="8" text-anchor="middle">お金・土地などの争い</text>'
  + '<text x="80" y="128" fill="#8b949e" font-size="8" text-anchor="middle">弁護士は依頼人の利益を守る</text>'
  + '<line x1="160" y1="20" x2="160" y2="140" stroke="#30363d" stroke-width="1"/>'
  + '<text x="240" y="14" fill="#e94560" font-size="11" text-anchor="middle" font-weight="bold">B 刑事裁判</text>'
  + '<rect x="168" y="24" width="50" height="28" rx="5" fill="rgba(233,69,96,0.12)" stroke="#e94560"/>'
  + '<text x="193" y="42" fill="#e6edf3" font-size="9" text-anchor="middle">検察官</text>'
  + '<text x="240" y="42" fill="#8b949e" font-size="9" text-anchor="middle">起訴→</text>'
  + '<rect x="262" y="24" width="50" height="28" rx="5" fill="rgba(233,69,96,0.12)" stroke="#e94560"/>'
  + '<text x="287" y="42" fill="#e6edf3" font-size="9" text-anchor="middle">被告人</text>'
  + '<rect x="200" y="70" width="80" height="26" rx="5" fill="rgba(163,113,247,0.15)" stroke="#a371f7"/>'
  + '<text x="240" y="87" fill="#a371f7" font-size="9" text-anchor="middle">裁判所＋裁判員</text>'
  + '<text x="240" y="115" fill="#8b949e" font-size="8" text-anchor="middle">犯罪を裁く（警察→検察→起訴）</text>'
  + '<text x="240" y="128" fill="#8b949e" font-size="8" text-anchor="middle">弁護人は被告人の利益を守る</text>'
  + '</svg>';

// ===== SECTION 0 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">⚖️ きょん＆西村の会話</div>'
    + chat('kyon','きょん（富士田恭兵）','公民って、政治とか経済とか…大人の話じゃん。俺、選挙も行ったことないし。')
    + chat('nishi','西村真二（慶應卒・元アナ）','愛知県の入試では、大問5と6がまるごと公民で、毎年8問前後。しかも「知っていれば取れる」問題が多い。地理・歴史より暗記で点になる教科だ。')
    + chat('kyon','きょん','8問！？それって結構でかいじゃん！')
    + chat('nishi','西村','公民は4つの部屋に分けると整理しやすい。①人権と憲法（ルールの土台）②政治（国会・内閣・裁判所）③経済（お金の流れ）④現代社会（効率と公正、契約、消費者）。吉本で言えば、①が就業規則、②が会社の組織、③が給料とギャラ、④が日々のトラブル対応だ。')
    + chat('kyon','きょん','会社に例えるとわかる！！俺、社長になる予定だし！！')
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 公民の4つの部屋（入試の出方）</div>'
    + '<div class="rule-box"><div class="rule-title">① 現代社会・人権・憲法 → Section 1</div><div class="ex">効率と公正／契約・PL法・クーリングオフ／法の支配／人権の種類（平等・自由・社会・参政・請求）／新しい人権／公共の福祉／憲法改正の手続き</div><div class="note">入試：R5「効率と公正」「15歳ができる政治参加」「公共の福祉」／R6「法の支配」「憲法改正」「再婚禁止期間＝平等権」「環境アセスメント」</div></div>'
    + '<div class="rule-box"><div class="rule-title">② 民主政治 → Section 2</div><div class="ex">選挙の原則と18歳／国会（衆議院の優越・弾劾裁判所）／内閣（議院内閣制）／裁判所（三審制・裁判員・違憲審査・国民審査）／三権分立／地方自治</div><div class="note">入試：R7「裁判員」「弁護士と国選弁護人」「三審制・弾劾裁判所・憲法の番人・法テラス」</div></div>'
    + '<div class="rule-box"><div class="rule-title">③ 経済 → Section 3</div><div class="ex">需要と供給／インフレ・デフレ／景気対策（日銀の公開市場操作・政府の減税）／為替（円高円安）／税金と財政／社会保障／労働三法</div><div class="note">入試：R7「景況感と減税」「需要が供給を下回り物価が下がる」「円高と受け取るドル」／R6「石油危機と物価」「デフレの期間」／R5「公共事業とニューディール政策」</div></div>'
    + '<div class="rule-box"><div class="rule-title">④ 出題の形</div><div class="ex">「生徒のメモ」の（①）（②）に入る語の<strong style="color:var(--gold)">組み合わせ</strong>を選ぶ／正しい文を<strong style="color:var(--gold)">二つ</strong>選ぶ／<strong style="color:var(--red)">誤っている</strong>文を一つ選ぶ</div><div class="note">💡 用語を「1語」で覚えるより、「AだからB」のセット（例：不景気→減税→所得が増える）で覚えると組み合わせ問題に強い</div></div>'
    + '</div>'

    + '<button class="start-btn" data-goto="1">⚖️ Section 1：人権・憲法から始める →</button>';
}

// ===== SECTION 1: 現代社会・人権・憲法 =====
function renderSection1(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚖️ きょん＆西村の会話</div>'
    + chat('kyon','きょん','「効率と公正」って何？どっちも良さそうな言葉なんだけど。')
    + chat('nishi','西村真二（慶應卒・元アナ）','効率は「ムダがないか」、公正は「みんなに公平か」。高速道路を作るとき、古墳の下にトンネルを掘って文化財を守るのは「公正」、建設費を安くするのは「効率」。R5の入試でそのまま出た。')
    + chat('kyon','きょん','ライブの出番順を決めるとき、先輩優先は効率、じゃんけんは公正…みたいな？')
    + chat('nishi','西村','その感覚で合ってる。次に「人権」。憲法が保障する自由や権利は、平等権・自由権・社会権・参政権・請求権の5つに分かれる。自由権はさらに精神・身体・経済の3つ。この分類が入試の組み合わせ問題で毎年問われる。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 現代社会：効率と公正・契約</div>'
    + '<div class="rule-box"><div class="rule-title">効率と公正</div><div class="ex"><strong style="color:var(--teal)">効率</strong>＝ムダを省く（費用を抑える・時間を短く）<br><strong style="color:var(--gold)">公正</strong>＝みんなに公平（手続きの公正・機会の公正・結果の公正）</div><div class="note">💡 「文化財を守る」「弱い立場の人に配慮」→公正。「費用を抑える」「早く終わる」→効率</div></div>'
    + '<div class="rule-box"><div class="rule-title">契約と消費者保護</div><div class="ex">契約は<strong style="color:var(--gold)">お互いが合意した時点</strong>で成立（口約束でも成立）<br><strong style="color:var(--gold)">クーリングオフ</strong>＝訪問販売などは8日以内なら無条件で解約<br><strong style="color:var(--gold)">製造物責任法（PL法）</strong>＝製品の欠陥で被害→企業に過失がなくても賠償責任<br>消費者契約法・消費者庁（2009年）</div><div class="note">💡 R6：「契約は（お互いが合意した）時点で成立」「PL法は（製品の欠陥によって消費者が損害をこうむった）場合」</div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 憲法と人権</div>'
    + '<div class="rule-box"><div class="rule-title">法の支配・憲法の三原則</div><div class="ex"><strong style="color:var(--gold)">法の支配</strong>＝権力を法で制限して、国民の自由と権利を守る考え方（人の支配の反対）<br>三原則＝<strong>国民主権・基本的人権の尊重・平和主義</strong>　天皇は「象徴」</div></div>'
    + '<div class="rule-box"><div class="rule-title">人権の5分類（組み合わせ問題の定番）</div>'
    + '<div class="ex">① <strong style="color:var(--gold)">平等権</strong>：法の下の平等、男女平等（例：女性だけ再婚禁止期間→違憲）<br>'
    + '② <strong style="color:var(--gold)">自由権</strong>：精神の自由（思想・信教・表現）／身体の自由（不当な逮捕の禁止）／<strong>経済活動の自由</strong>（居住・移転・職業選択、財産権）<br>'
    + '③ <strong style="color:var(--gold)">社会権</strong>：生存権（健康で文化的な最低限度の生活）、教育を受ける権利、勤労の権利、労働基本権<br>'
    + '④ <strong style="color:var(--gold)">参政権</strong>：選挙権・被選挙権・国民審査・国民投票<br>'
    + '⑤ <strong style="color:var(--gold)">請求権</strong>：裁判を受ける権利、国家賠償請求</div>'
    + '<div class="note">💡 覚え方：「びょう（平等）・じ（自由）・しゃ（社会）・さん（参政）・せい（請求）」＝びょうじしゃさんせい</div></div>'
    + '<div class="rule-box"><div class="rule-title">新しい人権（憲法に書いていないが認められた）</div><div class="ex"><strong style="color:var(--gold)">プライバシーの権利</strong>（例：小説のモデルが出版差し止め）／<strong style="color:var(--gold)">知る権利</strong>（情報公開法）／<strong style="color:var(--gold)">環境権</strong>（環境影響評価＝環境アセスメント）／<strong style="color:var(--gold)">自己決定権</strong>（インフォームド・コンセント）</div></div>'
    + '<div class="rule-box"><div class="rule-title">公共の福祉（第12条・13条）</div><div class="ex">自由や権利は「公共の福祉」のために制限されることがある。例：高速道路建設のために住民の居住の自由・財産権が制限される（R5）</div></div>'
    + '<div class="rule-box"><div class="rule-title">憲法改正の手続き（数字を正確に）</div><div class="ex">各議院の<strong style="color:var(--gold)">総議員の3分の2以上</strong>の賛成で国会が発議 → <strong style="color:var(--gold)">満18歳以上</strong>の国民投票で<strong style="color:var(--gold)">有効投票の過半数</strong>の賛成 → 天皇が公布</div><div class="note">⚠️ 「出席議員」ではなく「総議員」。法律の再可決（出席議員の3分の2）と混同しない</div></div>'
    + '</div>';

  var qs = [
    { qid:'soc_civ_s1_q0', jp:'高速道路の建設で古墳群が見つかった。<br>' + memo('工事は当初の予定より延びたが、古墳群の下にトンネルを建設して文化財を保存することにした。これは（　）の観点に配慮したものである。') + '（　）にあてはまるのは？',
      answer:'公正', choices:['公正','効率','利潤','独占'],
      exp:'📐 文化財を守る・弱い立場に配慮＝<strong>公正</strong>。費用を抑える・早く終える＝効率<br>✅ R5の入試そのまま。「保存」「配慮」→公正' },
    { qid:'soc_civ_s1_q1', jp:'次のうち、「効率」の観点にあたるものはどれ？',
      answer:'道路本体の建設費を抑える', choices:['道路本体の建設費を抑える','文化財を保存する','住民全員の意見を聞く','弱い立場の人に配慮する'],
      exp:'📐 効率＝ムダを省く（費用・時間）<br>✅ 建設費を抑える＝効率。ほかの3つは公正（手続き・結果の公平）' },
    { qid:'soc_civ_s1_q2', jp:memo('売買の契約は（③）時点で成立し、売る側と買う側ともに権利と義務が発生します。買う側の消費者を守るために製造物責任法（PL法）が制定されました。この法律では（④）場合の生産者の責任について定められています。') + '（③）（④）の組み合わせは？',
      answer:'③お互いが合意した／④製品の欠陥によって消費者が損害をこうむった', choices:['③お互いが合意した／④製品の欠陥によって消費者が損害をこうむった','③お互いが合意した／④強引なセールスによって契約が行われた','③一方がその意思を表示した／④製品の欠陥によって消費者が損害をこうむった','③一方がその意思を表示した／④強引なセールスによって契約が行われた'],
      exp:'📐 契約＝<strong>合意</strong>で成立（一方だけでは成立しない）。PL法＝<strong>製品の欠陥</strong>による被害<br>✅ R6の入試そのまま<br>💡 強引なセールス→クーリングオフや消費者契約法の話' },
    { qid:'soc_civ_s1_q3', jp:'訪問販売で契約したあと、一定期間内なら無条件で契約を解除できる制度を何という？',
      answer:'クーリングオフ', choices:['クーリングオフ','インフォームド・コンセント','ユニバーサルデザイン','製造物責任'],
      exp:'📐 クーリングオフ＝頭を冷やす（cool off）期間。訪問販売・電話勧誘などは<strong>8日以内</strong><br>💡 店で自分から買ったものには使えない' },
    { qid:'soc_civ_s1_q4', jp:memo('法の支配とは、（①）ことで国民の自由や権利を守ろうとする考え方です。') + '（①）にあてはまるのは？',
      answer:'権力を法で制限する', choices:['権力を法で制限する','国家に立法権をゆだねる','国民が法律に従う','天皇が法を定める'],
      exp:'📐 法の支配＝<strong>権力（国王・政府）を法で縛る</strong>。人の支配（王の気まぐれ）の反対<br>✅ R6の入試。「国民が従う」ではなく「権力を制限」' },
    { qid:'soc_civ_s1_q5', jp:memo('憲法の改正にあたっては、各議院の（②）の3分の2以上の賛成で国会が憲法改正を発議し、満（③）歳以上の国民による国民投票において、有効投票の過半数の賛成を得なければならない。') + '（②）（③）の組み合わせは？',
      answer:'②総議員／③18', choices:['②総議員／③18','②総議員／③20','②出席議員／③18','②出席議員／③20'],
      exp:'📐 憲法改正の発議＝<strong>総議員</strong>の3分の2以上。国民投票＝<strong>18歳</strong>以上<br>⚠️ 法律案の再可決は「出席議員の3分の2」。憲法改正は「総議員」' },
    { qid:'soc_civ_s1_q6', jp:'「女性のみ離婚後6か月たたないと再婚できない」と定めた民法の規定を、裁判所は憲法違反と判断した。守られるべきと判断された権利は？',
      answer:'平等権', choices:['平等権','自由権','社会権','プライバシーの権利'],
      exp:'📐 「女性のみ」＝男女で扱いが違う→<strong>法の下の平等</strong>（平等権）<br>✅ R6の入試（2015年の最高裁判決）' },
    { qid:'soc_civ_s1_q7', jp:'小説のモデルとなった人物が「名誉を侵害された」と訴え、裁判所が出版差し止めを命じた。守られるべきと判断された権利は？',
      answer:'プライバシーの権利', choices:['プライバシーの権利','社会権','参政権','経済活動の自由'],
      exp:'📐 私生活を勝手に公開されない権利＝<strong>プライバシーの権利</strong>（新しい人権）<br>✅ R6の入試。表現の自由とぶつかるが、プライバシーが優先された例' },
    { qid:'soc_civ_s1_q8', jp:'高速道路の建設のため、住民が用地の提供に応じて移転した。このとき制限されたのは、憲法第22条・第29条が保障する何の自由か？',
      answer:'経済活動の自由', choices:['経済活動の自由','精神の自由','身体の自由','法の下の平等'],
      exp:'📐 第22条＝居住・移転・職業選択の自由、第29条＝財産権 → まとめて<strong>経済活動の自由</strong><br>✅ R5の入試。「公共の福祉」のために制限される代表例' },
    { qid:'soc_civ_s1_q9', jp:'日本国憲法第12条：国民の自由や権利は「濫用してはならないのであって、常に（　）のためにこれを利用する責任を負う」。（　）は？',
      answer:'公共の福祉', choices:['公共の福祉','法の下の平等','国民主権','平和主義'],
      exp:'📐 <strong>公共の福祉</strong>＝社会全体の利益。自由や権利はこれのために制限されることがある<br>✅ R5の入試' },
    { qid:'soc_civ_s1_q10', jp:'基本的人権に関する法律について述べた文として<strong style="color:var(--red)">誤っているもの</strong>はどれ？',
      answer:'公害対策基本法は、大規模な開発を行う場合に環境アセスメントの実施を義務づけている', choices:['公害対策基本法は、大規模な開発を行う場合に環境アセスメントの実施を義務づけている','男女雇用機会均等法は、募集・採用について性別にかかわりなく均等な機会を与えることを定めている','教育基本法は、すべて国民はその能力に応じた教育を受ける機会が与えられなければならないと定めている','情報公開法は、知る権利を守るために行政機関に対して原則として情報公開を義務づけている'],
      exp:'📐 環境アセスメント（環境影響評価）を義務づけるのは<strong>環境影響評価法</strong>（1997年）。公害対策基本法（1967年）ではない<br>✅ R6の入試。「誤っているもの」を選ぶ問題' },
    { qid:'soc_civ_s1_q11', jp:'15歳の中学生が「法律の上で認められていない」政治参加はどれ？',
      answer:'市議会議員選挙に立候補する', choices:['市議会議員選挙に立候補する','文化財の保存を求める請願書を市議会に提出する','署名活動に参加する','ボランティアガイドをつとめる'],
      exp:'📐 選挙権は<strong>18歳</strong>、市議会議員の被選挙権は<strong>25歳</strong>。15歳は投票も立候補もできない<br>✅ 請願・署名・ボランティアは年齢に関係なくできる（R5の入試）' },
    { qid:'soc_civ_s1_q12', jp:'医師が患者に治療の内容を十分に説明し、患者が納得して同意することを何という？',
      answer:'インフォームド・コンセント', choices:['インフォームド・コンセント','ユニバーサルデザイン','クーリングオフ','バリアフリー'],
      exp:'📐 <strong>インフォームド・コンセント</strong>＝説明と同意。自己決定権（新しい人権）の考え方<br>💡 ユニバーサルデザイン＝誰もが使いやすい設計（R7の入試で出た）' },
    { qid:'soc_civ_s1_q13', type:'input', jp:'憲法改正の国民投票で投票できるのは、満何歳以上？（数字だけ）', formula:'選挙権と同じ年齢', answer:'18', xp:5, hint:'2016年から選挙権も引き下げられた',
      exp:'✅ <strong>18</strong>歳。選挙権・国民投票権ともに18歳以上<br>💡 被選挙権は衆議院25歳・参議院30歳' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 2: 民主政治 =====
function renderSection2(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚖️ きょん＆西村の会話</div>'
    + chat('kyon','きょん','国会と内閣と裁判所、名前は聞いたことあるけど何が違うの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','吉本で言えば、国会は「ルールを決める会議」、内閣は「決まったことを実行する現場」、裁判所は「もめたときの審判」。3つに分けて、お互いを見張らせるのが三権分立だ。')
    + chat('kyon','きょん','全部同じ人がやったら、好き放題できちゃうもんね。')
    + chat('nishi','西村','そう。だから国会が内閣を「不信任」できて、内閣は衆議院を「解散」できて、裁判所は法律を「違憲」と判断できる。この矢印の向きが入試で問われる。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 三権分立</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgSanken + '</div>'
    + '<div class="rule-box"><div class="rule-title">矢印の向き（誰が誰を見張る）</div><div class="ex">国会→内閣：内閣不信任決議・首相の指名<br>内閣→国会：衆議院の解散<br>国会→裁判所：<strong style="color:var(--gold)">弾劾裁判所</strong>（裁判官をやめさせる。国会に設置）<br>裁判所→国会・内閣：<strong style="color:var(--gold)">違憲審査</strong>（法律・命令が憲法に反しないか）<br>内閣→裁判所：最高裁長官の指名・裁判官の任命<br>国民→裁判所：<strong style="color:var(--gold)">国民審査</strong>（最高裁の裁判官を、衆議院議員総選挙のときに審査）</div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 選挙・国会・内閣</div>'
    + '<div class="rule-box"><div class="rule-title">選挙の4原則と年齢</div><div class="ex"><strong>普通</strong>選挙（18歳以上なら誰でも）・<strong>平等</strong>選挙（1人1票）・<strong>直接</strong>選挙・<strong>秘密</strong>選挙<br>選挙権18歳／被選挙権：衆議院・市町村長・地方議員25歳、参議院・都道府県知事30歳<br>衆議院＝小選挙区比例代表並立制、参議院＝選挙区＋比例代表</div></div>'
    + '<div class="rule-box"><div class="rule-title">国会（立法）</div><div class="ex">衆議院（定数465・任期4年・<strong>解散あり</strong>）と参議院（定数248・任期6年・3年ごと半数改選・解散なし）の二院制<br><strong style="color:var(--gold)">衆議院の優越</strong>：予算の先議、予算・条約・首相指名は衆議院の議決が優先、法律案は衆議院で<strong>出席議員の3分の2</strong>以上で再可決<br>国会の種類：常会（1月・150日）、臨時会、特別会（解散総選挙後・首相指名）<br>国会の仕事：法律の制定、予算の議決、条約の承認、首相の指名、弾劾裁判所、国政調査権、憲法改正の発議</div></div>'
    + '<div class="rule-box"><div class="rule-title">内閣（行政）と議院内閣制</div><div class="ex">内閣総理大臣は<strong>国会議員の中から国会が指名</strong>→天皇が任命。国務大臣の過半数は国会議員<br><strong style="color:var(--gold)">議院内閣制</strong>＝内閣は国会の信任で成り立つ。衆議院が不信任を決議→内閣は10日以内に<strong>衆議院を解散</strong>するか<strong>総辞職</strong></div><div class="note">💡 R7の歴史でも「1928年の普通選挙で政友会が最多議席→総裁の田中義一が首相」という議院内閣制につながる問題が出た</div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 裁判所（司法）</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgSaiban + '</div>'
    + '<div class="rule-box"><div class="rule-title">民事裁判と刑事裁判</div><div class="ex"><strong style="color:var(--teal)">民事</strong>＝私人どうしの争い。原告が被告を訴える。弁護士は依頼人の<strong>利益を守る</strong><br><strong style="color:var(--red)">刑事</strong>＝犯罪を裁く。警察が捜査→<strong>検察官が起訴</strong>→被疑者は「被告人」になる。弁護人は被告人の利益を守る。お金がない場合は<strong style="color:var(--gold)">国が費用を負担</strong>する国選弁護人</div></div>'
    + '<div class="rule-box"><div class="rule-title">裁判の制度（正誤問題の定番）</div><div class="ex">✅ <strong>三審制</strong>：判決に不満なら<strong>どちらの側も</strong>控訴・上告できる（3回まで）<br>✅ <strong>裁判員制度</strong>：重大な<strong>刑事事件の第一審</strong>で、くじで選ばれた国民6人が裁判官3人と一緒に判決を出す<br>✅ <strong>違憲審査権</strong>：すべての裁判所が持つ。最高裁は最終決定をするので「<strong>憲法の番人</strong>」<br>✅ <strong>国民審査</strong>：最高裁の裁判官を、<strong>衆議院議員総選挙</strong>のときに国民が審査<br>✅ <strong>弾劾裁判所</strong>：<strong>国会</strong>が設置。裁判官をやめさせる<br>✅ <strong>法テラス</strong>（日本司法支援センター）：誰でも弁護士に相談できるように設置<br>✅ 司法権の独立：裁判官は良心と憲法・法律にのみ従う</div><div class="note">⚠️ R7の誤文：「国民審査は<span style="color:var(--red)">参議院</span>議員選挙の際」「弾劾裁判所は<span style="color:var(--red)">内閣</span>が設置」「三審制は<span style="color:var(--red)">訴えられた側のみ</span>」——全部ここが違う</div></div>'
    + '<div class="rule-box"><div class="rule-title">地方自治</div><div class="ex">住民が首長（知事・市町村長）と地方議員を<strong>両方直接選挙</strong>で選ぶ（国とは違う）<br><strong>直接請求権</strong>：条例の制定・改廃は有権者の<strong>50分の1</strong>以上の署名、首長・議員の解職（リコール）・議会の解散は<strong>3分の1</strong>以上<br>「地方自治は民主主義の学校」</div></div>'
    + '</div>';

  var qs = [
    { qid:'soc_civ_s2_q0', jp:'内閣不信任決議は、国会のどの議院が行える？',
      answer:'衆議院のみ', choices:['衆議院のみ','参議院のみ','両議院','裁判所'],
      exp:'📐 内閣不信任決議は<strong>衆議院だけ</strong>の権限。可決されると内閣は10日以内に衆議院を解散するか総辞職<br>💡 解散があるのも衆議院だけ' },
    { qid:'soc_civ_s2_q1', jp:'裁判官をやめさせるかどうかを判断する「弾劾裁判所」を設置するのはどこ？',
      answer:'国会', choices:['国会','内閣','最高裁判所','国民'],
      exp:'📐 弾劾裁判所は<strong>国会</strong>が設置（国会→裁判所への見張り）<br>✅ R7の誤文「内閣が設置する弾劾裁判所」は×' },
    { qid:'soc_civ_s2_q2', jp:'最高裁判所の裁判官に対する国民審査は、いつ行われる？',
      answer:'衆議院議員総選挙のとき', choices:['衆議院議員総選挙のとき','参議院議員選挙のとき','3年ごと','憲法改正の国民投票のとき'],
      exp:'📐 国民審査＝<strong>衆議院議員総選挙</strong>と同時。×をつけた票が過半数なら罷免<br>✅ R7の誤文「参議院議員選挙の際」は×' },
    { qid:'soc_civ_s2_q3', jp:'日本の司法制度について述べた文として<strong>正しいもの</strong>はどれ？',
      answer:'裁判所は法令が憲法に違反していないか審査でき、最高裁判所は「憲法の番人」とよばれる', choices:['裁判所は法令が憲法に違反していないか審査でき、最高裁判所は「憲法の番人」とよばれる','第一審の判決に不満があった場合、訴えられた側のみ3回まで上級の裁判所に申し立てできる','最高裁判所の裁判官は参議院議員選挙の際に国民審査によって選ばれる','内閣が設置する弾劾裁判所は裁判官をやめさせることができる'],
      exp:'📐 違憲審査権＋憲法の番人＝正しい<br>❌ 三審制は<strong>どちらの側も</strong>／国民審査は<strong>衆議院</strong>総選挙／弾劾裁判所は<strong>国会</strong><br>✅ R7の入試（正しいものを二つ：エ・オ）' },
    { qid:'soc_civ_s2_q4', jp:memo('私は（　）に選ばれましたが、市民は裁判所に行くだけでも緊張します。しかし裁判長から「（　）と裁判官が一つのチームとなり、何が最善の判断なのかをみんなで考えていきましょう」と話があり、勇気づけられました。評議の中で、私たちは刑罰について何年という年数を判断しました。') + '（　）にあてはまるのは？',
      answer:'裁判員', choices:['裁判員','傍聴人','代理人','証人'],
      exp:'📐 くじで選ばれ、裁判官と一緒に<strong>刑罰を判断</strong>する＝<strong>裁判員</strong><br>✅ R7の入試。「刑罰の年数を判断」→刑事裁判→カードB' },
    { qid:'soc_civ_s2_q5', jp:'裁判員制度が対象とする裁判はどれ？',
      answer:'重大な刑事事件の第一審', choices:['重大な刑事事件の第一審','すべての民事裁判','すべての刑事裁判の第三審','憲法違反の審査'],
      exp:'📐 裁判員制度＝<strong>重大な刑事事件</strong>（殺人・強盗致傷など）の<strong>第一審（地方裁判所）</strong>だけ<br>💡 民事裁判には裁判員はいない' },
    { qid:'soc_civ_s2_q6', jp:memo('Aのカードの裁判（民事）では、弁護士は原告や被告の依頼を受け、その（①）ために活動する。Bのカードの裁判（刑事）では、弁護士は弁護人として被告人の（①）ために活動する。経済的な理由により被告人が弁護人を依頼できない場合は、（②）が費用を負担する弁護人をつけることができる。') + '（①）（②）の組み合わせは？',
      answer:'①利益を守る／②国', choices:['①利益を守る／②国','①利益を守る／②地方公共団体','①判決を下す／②国','①判決を下す／②地方公共団体'],
      exp:'📐 弁護士＝依頼人の<strong>利益を守る</strong>（判決を下すのは裁判官）。国選弁護人の費用は<strong>国</strong><br>✅ R7の入試そのまま' },
    { qid:'soc_civ_s2_q7', jp:'刑事裁判で、被疑者を裁判所に起訴するのは誰？',
      answer:'検察官', choices:['検察官','警察官','裁判官','弁護人'],
      exp:'📐 警察が捜査・取り調べ→<strong>検察官</strong>が起訴→裁判。起訴されると「被疑者」は「被告人」に<br>💡 民事裁判は「原告」が「被告」を訴える（検察官は登場しない）' },
    { qid:'soc_civ_s2_q8', jp:'法律の専門家が少ない地域でも、だれもが弁護士と身近に相談できるように設立された機関は？',
      answer:'法テラス', choices:['法テラス','弾劾裁判所','消費者庁','公正取引委員会'],
      exp:'📐 <strong>法テラス</strong>（日本司法支援センター、2006年）＝司法制度改革の一つ<br>✅ R7の入試の正文' },
    { qid:'soc_civ_s2_q9', jp:'内閣総理大臣はどのように決まる？',
      answer:'国会議員の中から国会が指名し、天皇が任命する', choices:['国会議員の中から国会が指名し、天皇が任命する','国民が直接選挙で選ぶ','最高裁判所が指名する','衆議院議長が任命する'],
      exp:'📐 <strong>国会が指名</strong>→天皇が任命。これが議院内閣制（内閣は国会の信任で成立）<br>💡 首相指名で両院が一致しなければ<strong>衆議院の議決が優先</strong>' },
    { qid:'soc_civ_s2_q10', jp:'衆議院の優越にあてはまらないものはどれ？',
      answer:'憲法改正の発議', choices:['憲法改正の発議','予算の先議','内閣総理大臣の指名','条約の承認'],
      exp:'📐 憲法改正の発議は<strong>両院それぞれ総議員の3分の2</strong>が必要で、衆議院の優越はない<br>✅ 予算先議・予算議決・条約承認・首相指名・法律案の再可決は衆議院が優越' },
    { qid:'soc_civ_s2_q11', jp:'選挙の4原則のうち、「一定の年齢に達したすべての国民に選挙権がある」ことを何という？',
      answer:'普通選挙', choices:['普通選挙','平等選挙','直接選挙','秘密選挙'],
      exp:'📐 <strong>普通</strong>選挙＝財産や性別で制限しない（1925年は男子のみ25歳以上、1945年に女性も、2016年から18歳）<br>平等＝1人1票、直接＝自分で投票、秘密＝誰に入れたか秘密' },
    { qid:'soc_civ_s2_q12', jp:'地方自治で、条例の制定・改廃を直接請求するのに必要な署名は有権者の何分の1以上？',
      answer:'50分の1', choices:['50分の1','3分の1','2分の1','10分の1'],
      exp:'📐 条例の制定・改廃、監査の請求＝<strong>50分の1</strong>以上（署名→首長へ）<br>首長・議員の解職（リコール）、議会の解散＝<strong>3分の1</strong>以上（署名→選挙管理委員会→住民投票）' },
    { qid:'soc_civ_s2_q13', jp:'衆議院と参議院について正しいものはどれ？',
      answer:'衆議院には解散があり、参議院には解散がない', choices:['衆議院には解散があり、参議院には解散がない','参議院の任期は4年である','衆議院の任期は6年である','両院とも3年ごとに半数を改選する'],
      exp:'📐 衆議院：任期4年・解散あり。参議院：任期6年・3年ごと半数改選・解散なし<br>💡 「解散がある方が国民の意見を反映しやすい」から衆議院の優越がある' },
    { qid:'soc_civ_s2_q14', type:'input', jp:'衆議院が内閣不信任を決議したとき、内閣は何日以内に衆議院を解散するか総辞職しなければならない？（数字だけ）', formula:'議院内閣制のルール', answer:'10', xp:5, hint:'憲法第69条',
      exp:'✅ <strong>10</strong>日以内<br>💡 解散→総選挙→特別会で首相を指名' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 3: 経済 =====
function renderSection3(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">⚖️ きょん＆西村の会話</div>'
    + chat('kyon','きょん','経済って数字ばっかりで苦手…円高とか円安とか、どっちが高いのかもわからない。')
    + chat('nishi','西村真二（慶應卒・元アナ）','「1ドル＝何円か」で考える。1ドルが100円なら、100円でドルが買える。1ドルが150円なら150円払わないと買えない。<strong>円の値打ちが高いのが円高</strong>だから、少ない円でドルが買える100円の方が円高だ。')
    + chat('kyon','きょん','数字が小さい方が円高！？逆じゃん！！')
    + chat('nishi','西村','そこが毎年ひっかけになる。R7の入試では「1ドル150円のときより130円のときの方が、同じ額の円をドルに交換したとき受け取るドルが多くなる」と出た。130円の方が円高だから、受け取るドルは多い。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 市場と物価・景気</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgDemand + '</div>'
    + '<div class="rule-box"><div class="rule-title">需要と供給</div><div class="ex"><strong style="color:var(--red)">需要</strong>＝買いたい量（価格が下がると増える）／<strong style="color:var(--teal)">供給</strong>＝売りたい量（価格が上がると増える）<br>需要＞供給→価格が<strong>上がる</strong>　需要＜供給→価格が<strong>下がる</strong>　つり合う点＝<strong>均衡価格</strong></div><div class="note">💡 R7：「不景気になると家計の所得が減り、商品の需要が供給を<strong>下回り</strong>、物価が<strong>下がります</strong>」</div></div>'
    + '<div class="rule-box"><div class="rule-title">インフレとデフレ</div><div class="ex"><strong style="color:var(--red)">インフレーション</strong>＝物価が上がり続ける（お金の価値が下がる）。例：1974年の<strong>石油危機</strong>で物価が急上昇<br><strong style="color:var(--teal)">デフレーション</strong>＝物価が下がり続ける（不景気のとき）。例：1999〜2003年ごろ、ハンバーガーが59円</div><div class="note">💡 R6：消費者物価指数のグラフで「1974年が高いのは石油危機」「物価が下がり続けた期間はZ（2000年前後）」</div></div>'
    + '<div class="rule-box"><div class="rule-title">景気対策（誰が・何を）</div><div class="ex"><strong style="color:var(--gold)">日本銀行（金融政策）</strong>：<strong>公開市場操作</strong>。不景気→銀行から<strong>国債を買う</strong>（お金を市場に出す）／好景気→国債を売る<br><strong style="color:var(--gold)">政府（財政政策）</strong>：不景気→<strong>減税</strong>・<strong>公共事業を増やす</strong>（企業の仕事を増やす）／好景気→増税・公共事業を減らす</div><div class="note">💡 R7：「政府は<strong>減税を行い、家計の所得を増やす</strong>」（公開市場操作は日銀の仕事なので×）。R5：「公共事業＝<strong>企業の仕事を増やす</strong>」「世界恐慌のときの<strong>ニューディール政策</strong>（アメリカ）」</div></div>'
    + '<div class="rule-box"><div class="rule-title">日本銀行の3つの役割</div><div class="ex"><strong>発券銀行</strong>（お札を発行）・<strong>政府の銀行</strong>（税金の出し入れ）・<strong>銀行の銀行</strong>（一般の銀行にお金を貸す）。個人は口座を作れない</div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 為替・財政・社会保障・労働</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgKawase + '</div>'
    + '<div class="rule-box"><div class="rule-title">円高・円安（数字が小さいほど円高）</div><div class="ex">1ドル＝150円→130円：<strong style="color:var(--green)">円高</strong>（円の価値が上がった）。円を買う動きが強くなると円高<br>円高＝<strong>輸入に有利・海外旅行に有利</strong>（同じ円でドルをたくさん受け取れる）、<strong>輸出に不利</strong>（日本製品が海外で高くなる）<br>円安＝その逆（輸出に有利、訪日外国人が増える）</div><div class="note">💡 計算：15000円→1ドル150円なら100ドル、1ドル100円なら150ドル。円高の方が受け取るドルが<strong>多い</strong></div></div>'
    + '<div class="rule-box"><div class="rule-title">税金と財政</div><div class="ex"><strong>直接税</strong>（払う人＝納める人）：所得税・法人税・住民税。所得税は<strong>累進課税</strong>（所得が多いほど税率が高い）<br><strong>間接税</strong>（払う人≠納める人）：消費税・酒税。消費税は所得に関係なく同じ率→低所得者の負担が重い（逆進性）<br>財政の役割：公共事業・社会保障・景気の安定。歳入が足りないと<strong>国債</strong>（借金）</div></div>'
    + '<div class="rule-box"><div class="rule-title">社会保障の4本柱</div><div class="ex"><strong>社会保険</strong>（医療・年金・介護・雇用）・<strong>公的扶助</strong>（生活保護）・<strong>社会福祉</strong>（高齢者・障がい者・子ども）・<strong>公衆衛生</strong>（感染症予防・上下水道）</div></div>'
    + '<div class="rule-box"><div class="rule-title">労働・企業</div><div class="ex">労働三法＝<strong>労働基準法</strong>（1日8時間・週40時間）・<strong>労働組合法</strong>・<strong>労働関係調整法</strong><br>株式会社＝株式を発行して資金を集める。株主は<strong>配当</strong>を受け、<strong>株主総会</strong>で議決<br><strong>独占禁止法</strong>を運用するのは<strong>公正取引委員会</strong><br>社会資本（インフラ）＝道路・橋・水道など。老朽化に備え「予防保全」（壊れる前に直す）が課題</div></div>'
    + '</div>';

  var qs = [
    { qid:'soc_civ_s3_q0', jp:memo('景況感が悪化している場合、一般的に政府は（③）などの対策をします。また、一般的に不景気になると家計の所得が減り、商品の（④）。') + '（③）（④）の組み合わせは？',
      answer:'③減税を行い、家計の所得を増やす／④需要が供給を下回り、物価が下がります', choices:['③減税を行い、家計の所得を増やす／④需要が供給を下回り、物価が下がります','③減税を行い、家計の所得を増やす／④需要が供給を上回り、物価が上がります','③公開市場操作を行い、国債を買う／④需要が供給を下回り、物価が下がります','③公開市場操作を行い、国債を買う／④需要が供給を上回り、物価が上がります'],
      exp:'📐 <strong>政府</strong>の景気対策＝減税・公共事業（公開市場操作は<strong>日銀</strong>）。不景気→所得減→買えない→需要＜供給→物価<strong>下がる</strong><br>✅ R7の入試そのまま' },
    { qid:'soc_civ_s3_q1', jp:memo('外国通貨を売買する市場で、円を買う動きが強くなれば（⑤）となります。また、「1ドル＝150円」のときより「1ドル＝130円」のときの方が、同じ額の円をドルに交換するとき、受け取るドルが（⑥）なります。') + '（⑤）（⑥）の組み合わせは？',
      answer:'⑤円高／⑥多く', choices:['⑤円高／⑥多く','⑤円高／⑥少なく','⑤円安／⑥多く','⑤円安／⑥少なく'],
      exp:'📐 円が買われる→円の価値が上がる→<strong>円高</strong>。130円の方が円高＝少ない円で1ドル→同じ円なら受け取るドルは<strong>多い</strong><br>✅ R7の入試そのまま。計算：13000円→150円なら約87ドル、130円なら100ドル' },
    { qid:'soc_civ_s3_q2', jp:'1ドル＝100円から1ドル＝120円になった。これは円高・円安のどちらで、輸出企業にとって有利・不利のどちら？',
      answer:'円安・輸出に有利', choices:['円安・輸出に有利','円安・輸出に不利','円高・輸出に有利','円高・輸出に不利'],
      exp:'📐 100円→120円＝1ドル買うのに多くの円が必要＝円の価値が下がった＝<strong>円安</strong><br>円安だと日本製品が海外で安くなる→<strong>輸出に有利</strong>。訪日外国人にも有利（R7の資料で2023年に消費額が急増）' },
    { qid:'soc_civ_s3_q3', jp:memo('先生：消費者物価指数のグラフで、1974年はどうしてこんなに高い値なのでしょうか。<br>生徒：これは（①）の影響だと思います。') + '（①）にあてはまるのは？',
      answer:'石油危機', choices:['石油危機','朝鮮戦争','東京オリンピック開催','バブル経済の崩壊'],
      exp:'📐 1973年に第四次中東戦争→<strong>石油危機（オイルショック）</strong>→1974年に物価が20%以上上昇（狂乱物価）<br>✅ R6の入試。朝鮮戦争は1950年（特需景気）、東京オリンピックは1964年' },
    { qid:'soc_civ_s3_q4', jp:'物価が下がり続ける現象を何という？',
      answer:'デフレーション', choices:['デフレーション','インフレーション','スタグフレーション','バブル'],
      exp:'📐 <strong>デフレ</strong>＝物価が下がり続ける（不景気・お金の価値が上がる）。<strong>インフレ</strong>＝物価が上がり続ける<br>✅ R6：グラフで前年比がマイナスの期間（Z：2000年前後）がデフレ' },
    { qid:'soc_civ_s3_q5', jp:'不景気のとき、日本銀行が行う金融政策として正しいものは？',
      answer:'銀行から国債を買い、世の中に出回るお金を増やす', choices:['銀行から国債を買い、世の中に出回るお金を増やす','銀行に国債を売り、世の中に出回るお金を減らす','減税を行い、家計の所得を増やす','公共事業を減らす'],
      exp:'📐 日銀の<strong>公開市場操作</strong>：不景気→<strong>買いオペ</strong>（国債を買う→銀行にお金が入る→貸し出しが増える）<br>💡 減税・公共事業は<strong>政府</strong>の財政政策' },
    { qid:'soc_civ_s3_q6', jp:memo('不景気のときには、国や地方公共団体は、（⑩）ことを目的として公共事業関係の予算額を増やし、景気の回復を図ろうとすることがある。世界恐慌の際に（⑪）の中にも、こうした試みがみられる。') + '（⑩）（⑪）の組み合わせは？',
      answer:'⑩企業の仕事を増やす／⑪アメリカのとったニューディール政策', choices:['⑩企業の仕事を増やす／⑪アメリカのとったニューディール政策','⑩企業の仕事を増やす／⑪イギリスのとったブロック経済','⑩各銀行の国債を買う／⑪アメリカのとったニューディール政策','⑩各銀行の国債を買う／⑪イギリスのとったブロック経済'],
      exp:'📐 公共事業＝道路やダムを作る→<strong>企業に仕事</strong>→雇用が増える。世界恐慌（1929）→アメリカの<strong>ニューディール政策</strong>（ダム建設など）<br>✅ R5の入試。ブロック経済は植民地との貿易を囲い込む政策（イギリス・フランス）' },
    { qid:'soc_civ_s3_q7', jp:'日本銀行の役割として<strong style="color:var(--red)">誤っているもの</strong>はどれ？',
      answer:'個人や企業から預金を受け入れる', choices:['個人や企業から預金を受け入れる','日本銀行券（紙幣）を発行する','政府のお金の出し入れをする','一般の銀行にお金を貸す'],
      exp:'📐 日銀は<strong>発券銀行・政府の銀行・銀行の銀行</strong>。個人や一般企業は取引できない<br>💡 「銀行の銀行」＝一般の銀行だけが相手' },
    { qid:'soc_civ_s3_q8', jp:'所得が多い人ほど高い税率で課税されるしくみを何という？',
      answer:'累進課税', choices:['累進課税','間接税','逆進性','国債'],
      exp:'📐 <strong>累進課税</strong>＝所得税・相続税。所得の格差を小さくする働き<br>💡 消費税は誰でも同じ率→低所得者ほど負担が重い（逆進性）' },
    { qid:'soc_civ_s3_q9', jp:'次のうち間接税はどれ？',
      answer:'消費税', choices:['消費税','所得税','法人税','住民税'],
      exp:'📐 <strong>間接税</strong>＝税を払う人（消費者）と納める人（お店）が違う。消費税・酒税・関税<br>直接税＝所得税・法人税・住民税・相続税' },
    { qid:'soc_civ_s3_q10', jp:'社会保障制度の4本柱のうち、生活に困っている人に生活費を支給する「生活保護」はどれにあたる？',
      answer:'公的扶助', choices:['公的扶助','社会保険','社会福祉','公衆衛生'],
      exp:'📐 <strong>公的扶助</strong>＝生活保護（税金でまかなう）<br>社会保険＝医療・年金・介護・雇用（保険料を払う）、社会福祉＝高齢者・障がい者・子どもの支援、公衆衛生＝感染症予防・上下水道' },
    { qid:'soc_civ_s3_q11', jp:'労働三法にあてはまらないものはどれ？',
      answer:'男女雇用機会均等法', choices:['男女雇用機会均等法','労働基準法','労働組合法','労働関係調整法'],
      exp:'📐 労働三法＝<strong>労働基準法・労働組合法・労働関係調整法</strong><br>💡 男女雇用機会均等法（1985年）は大事だが「三法」には入らない' },
    { qid:'soc_civ_s3_q12', jp:'企業どうしの公正な競争を守るため、独占禁止法を運用している機関は？',
      answer:'公正取引委員会', choices:['公正取引委員会','消費者庁','日本銀行','法テラス'],
      exp:'📐 <strong>公正取引委員会</strong>＝独占禁止法の番人。カルテル（価格の話し合い）などを取り締まる<br>💡 消費者庁は消費者保護（2009年）' },
    { qid:'soc_civ_s3_q13', jp:memo('表1をみると、現在15歳の私たちが30歳を超えるころには、道路施設の老朽化が進むことがわかる。また、そのころには、現在よりも（⑥）ことが予測されていることから、国は「予防保全」への転換という方針を示している。') + '（⑥）にあてはまるのは？',
      answer:'少子高齢化が進んで労働人口が減少し、税収が減る', choices:['少子高齢化が進んで労働人口が減少し、税収が減る','電気自動車が増加し、住宅への充電設備の設置が進む','第一次産業に従事する人が減り、食料自給率が低下する','訪日外国人が増え、観光収入が増える'],
      exp:'📐 「税収が減る」から、壊れてから直す（事後保全・2.4倍）より、壊れる前に直す（予防保全・1.3倍）方針に<br>✅ R5の入試。社会資本の老朽化＋財政の話' },
    { qid:'soc_civ_s3_q14', type:'input', jp:'1ドル＝150円のとき、15000円をドルに交換すると何ドル？（数字だけ）', formula:'15000 ÷ 150', answer:'100', xp:5, hint:'円 ÷ 1ドルあたりの円',
      exp:'✅ 15000÷150＝<strong>100</strong>ドル<br>💡 1ドル＝100円なら150ドル。円高の方が多く受け取れる' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 確認テスト — 公民 総まとめ（愛知県入試形式）</div>'
    + '<div class="rule-box"><div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + '人権・憲法／政治／経済から <strong style="color:var(--gold)">20問</strong>。生徒のメモ穴埋め・正誤問題・組み合わせ問題を本番形式で！<br>'
    + 'きょん「公民、全部覚えた！！社長になる準備できた！！」<br>'
    + '西村「設問の「誤っているもの」「二つ」を見落とすな」'
    + '</div></div></div>';

  var qs = [
    { qid:'soc_civ_s4_q0', jp:'高速道路の建設で古墳群の下にトンネルを建設して文化財を保存した。「効率と公正」のどちらの観点？',
      answer:'公正', choices:['公正','効率'],
      exp:'📐 文化財の保存・配慮＝<strong>公正</strong>' },
    { qid:'soc_civ_s4_q1', jp:memo('法の支配とは、（①）ことで国民の自由や権利を守ろうとする考え方です。憲法の改正にあたっては、各議院の（②）の3分の2以上の賛成で国会が発議し、満（③）歳以上の国民による国民投票で有効投票の過半数の賛成が必要です。') + '①②③の組み合わせは？',
      answer:'①権力を法で制限する／②総議員／③18', choices:['①権力を法で制限する／②総議員／③18','①権力を法で制限する／②出席議員／③18','①国家に立法権をゆだねる／②総議員／③20','①国家に立法権をゆだねる／②出席議員／③20'],
      exp:'📐 法の支配＝権力を法で制限。憲法改正＝<strong>総議員</strong>の3分の2、国民投票<strong>18歳</strong><br>✅ R6の入試（8択の組み合わせ）' },
    { qid:'soc_civ_s4_q2', jp:'A「女性のみ再婚禁止期間を定めた民法の規定は違憲」　B「小説のモデルの訴えで出版差し止め」。守られた権利の組み合わせは？',
      answer:'A：平等権／B：プライバシーの権利', choices:['A：平等権／B：プライバシーの権利','A：平等権／B：自由権','A：社会権／B：プライバシーの権利','A：社会権／B：自由権'],
      exp:'📐 「女性のみ」→<strong>平等権</strong>。私生活の公開→<strong>プライバシーの権利</strong><br>✅ R6の入試そのまま' },
    { qid:'soc_civ_s4_q3', jp:'憲法第22条・第29条が保障する居住・移転の自由と財産権は、まとめて何という？',
      answer:'経済活動の自由', choices:['経済活動の自由','精神の自由','身体の自由','社会権'],
      exp:'📐 自由権の3分類：精神・身体・<strong>経済活動</strong>。居住・移転・職業選択・財産権＝経済活動の自由' },
    { qid:'soc_civ_s4_q4', jp:'契約について正しいものはどれ？',
      answer:'売買の契約はお互いが合意した時点で成立する', choices:['売買の契約はお互いが合意した時点で成立する','契約は書面がなければ成立しない','契約は一方が意思を表示すれば成立する','契約はお金を払った時点で成立する'],
      exp:'📐 契約＝<strong>合意</strong>で成立。口約束でも成立する<br>✅ R6の入試' },
    { qid:'soc_civ_s4_q5', jp:'製品の欠陥によって消費者が損害を受けた場合の生産者の責任を定めた法律は？',
      answer:'製造物責任法（PL法）', choices:['製造物責任法（PL法）','消費者契約法','独占禁止法','労働基準法'],
      exp:'📐 <strong>PL法</strong>＝製品の欠陥→企業に過失がなくても賠償責任' },
    { qid:'soc_civ_s4_q6', jp:'日本の司法制度について述べた文として<strong style="color:var(--red)">誤っているもの</strong>はどれ？',
      answer:'第一審の判決に不満があった場合、訴えられた側のみ上級の裁判所に申し立てできる', choices:['第一審の判決に不満があった場合、訴えられた側のみ上級の裁判所に申し立てできる','裁判所は法令が憲法に違反していないかを審査できる','法律の専門家が少ない地域でも相談できるように法テラスが設立された','裁判官は憲法・法律と良心にのみ従って裁判を行う'],
      exp:'📐 三審制は<strong>どちらの側も</strong>控訴・上告できる<br>✅ R7の入試の誤文' },
    { qid:'soc_civ_s4_q7', jp:'弾劾裁判所を設置する機関と、最高裁判所裁判官の国民審査が行われる選挙の組み合わせは？',
      answer:'国会／衆議院議員総選挙', choices:['国会／衆議院議員総選挙','内閣／衆議院議員総選挙','国会／参議院議員選挙','内閣／参議院議員選挙'],
      exp:'📐 弾劾裁判所＝<strong>国会</strong>。国民審査＝<strong>衆議院</strong>議員総選挙のとき<br>✅ R7の誤文2つを組み合わせで確認' },
    { qid:'soc_civ_s4_q8', jp:'刑事裁判のしくみを表したカードとして正しいものは？',
      answer:'警察が捜査し、検察官が起訴し、被告人を裁判所が裁く', choices:['警察が捜査し、検察官が起訴し、被告人を裁判所が裁く','原告が被告を訴え、裁判所が判断する','弁護士が起訴し、裁判員が判決を下す','被疑者が検察官を訴える'],
      exp:'📐 刑事＝警察→<strong>検察官が起訴</strong>→被告人。民事＝原告→被告<br>✅ R7のカードB' },
    { qid:'soc_civ_s4_q9', jp:'経済的な理由で弁護人を依頼できない被告人に、費用を負担して弁護人をつけるのは？',
      answer:'国', choices:['国','地方公共団体','裁判所','弁護士会'],
      exp:'📐 <strong>国選弁護人</strong>＝国が費用を負担<br>✅ R7の入試' },
    { qid:'soc_civ_s4_q10', jp:'内閣について正しいものはどれ？',
      answer:'衆議院で内閣不信任が決議されると、10日以内に衆議院を解散するか総辞職する', choices:['衆議院で内閣不信任が決議されると、10日以内に衆議院を解散するか総辞職する','内閣総理大臣は国民の直接選挙で選ばれる','参議院は内閣不信任を決議できる','内閣は参議院を解散できる'],
      exp:'📐 議院内閣制：不信任→10日以内に<strong>解散か総辞職</strong>。不信任も解散も<strong>衆議院</strong>だけ' },
    { qid:'soc_civ_s4_q11', jp:'衆議院の優越として正しいものはどれ？',
      answer:'予算は先に衆議院に提出される', choices:['予算は先に衆議院に提出される','憲法改正の発議は衆議院だけでできる','条約は参議院の議決が優先される','法律案は参議院で再可決できる'],
      exp:'📐 <strong>予算の先議権</strong>は衆議院。憲法改正に優越なし。法律案の再可決は<strong>衆議院</strong>で出席議員の3分の2' },
    { qid:'soc_civ_s4_q12', jp:'2016年から選挙権年齢は満何歳以上になった？',
      answer:'18歳', choices:['18歳','20歳','25歳','16歳'],
      exp:'📐 選挙権<strong>18歳</strong>。国民投票も18歳。被選挙権は衆議院25歳・参議院30歳' },
    { qid:'soc_civ_s4_q13', jp:'地方自治で、首長や議員の解職（リコール）を請求するのに必要な署名は有権者の？',
      answer:'3分の1以上', choices:['3分の1以上','50分の1以上','過半数','3分の2以上'],
      exp:'📐 解職・解散＝<strong>3分の1</strong>（重い）。条例の制定・改廃＝<strong>50分の1</strong>（軽い）' },
    { qid:'soc_civ_s4_q14', jp:memo('景況感が悪化している場合、政府は（③）などの対策をします。不景気になると家計の所得が減り、商品の（④）。') + '③④の組み合わせは？',
      answer:'③減税を行い、家計の所得を増やす／④需要が供給を下回り、物価が下がります', choices:['③減税を行い、家計の所得を増やす／④需要が供給を下回り、物価が下がります','③公開市場操作を行い、国債を買う／④需要が供給を下回り、物価が下がります','③減税を行い、家計の所得を増やす／④需要が供給を上回り、物価が上がります','③公開市場操作を行い、国債を買う／④需要が供給を上回り、物価が上がります'],
      exp:'📐 政府＝<strong>減税</strong>（公開市場操作は日銀）。不景気→需要＜供給→物価<strong>下がる</strong><br>✅ R7の入試' },
    { qid:'soc_civ_s4_q15', jp:'1ドル＝150円から1ドル＝130円になった。正しいものはどれ？',
      answer:'円高になり、同じ額の円で受け取るドルは多くなる', choices:['円高になり、同じ額の円で受け取るドルは多くなる','円高になり、同じ額の円で受け取るドルは少なくなる','円安になり、同じ額の円で受け取るドルは多くなる','円安になり、同じ額の円で受け取るドルは少なくなる'],
      exp:'📐 数字が小さくなる＝<strong>円高</strong>。1ドルが安く買える→ドルを<strong>多く</strong>受け取れる<br>✅ R7の入試' },
    { qid:'soc_civ_s4_q16', jp:'消費者物価指数の前年比が1974年に20%を超えた。原因は？',
      answer:'石油危機', choices:['石油危機','世界恐慌','バブル崩壊','朝鮮戦争'],
      exp:'📐 1973年の石油危機→1974年に<strong>狂乱物価</strong>（インフレ）<br>✅ R6の入試' },
    { qid:'soc_civ_s4_q17', jp:'不景気のときの日本銀行と政府の対策の組み合わせとして正しいものは？',
      answer:'日銀：国債を買う／政府：公共事業を増やす', choices:['日銀：国債を買う／政府：公共事業を増やす','日銀：国債を売る／政府：公共事業を増やす','日銀：国債を買う／政府：増税する','日銀：国債を売る／政府：増税する'],
      exp:'📐 不景気→お金を世の中に増やす：日銀は<strong>買いオペ</strong>、政府は<strong>減税・公共事業増</strong><br>✅ R5「公共事業＝企業の仕事を増やす」' },
    { qid:'soc_civ_s4_q18', jp:'社会保障の4本柱の組み合わせとして正しいものは？',
      answer:'社会保険・公的扶助・社会福祉・公衆衛生', choices:['社会保険・公的扶助・社会福祉・公衆衛生','社会保険・生活保護・年金・医療','公的扶助・累進課税・国債・公共事業','社会福祉・労働基準法・労働組合法・労働関係調整法'],
      exp:'📐 <strong>社会保険・公的扶助・社会福祉・公衆衛生</strong>。生活保護は公的扶助の中身、年金・医療は社会保険の中身' },
    { qid:'soc_civ_s4_q19', jp:'基本的人権に関する法律について<strong style="color:var(--red)">誤っているもの</strong>はどれ？',
      answer:'公害対策基本法は環境アセスメントの実施を義務づけている', choices:['公害対策基本法は環境アセスメントの実施を義務づけている','男女雇用機会均等法は募集・採用で性別による差別を禁じている','情報公開法は知る権利を守るために行政機関に情報公開を義務づけている','教育基本法は能力に応じて教育を受ける機会を保障している'],
      exp:'📐 環境アセスメント＝<strong>環境影響評価法</strong>。公害対策基本法は1967年の公害対策の法律で、環境アセスメントの義務づけはない<br>✅ R6の入試' },
  ];
  html += renderQs(qs);
  return html;
}

function showFinalResult(){
  var s4qids = Object.keys(qMeta).filter(function(id){ return id.indexOf(QID_PREFIX + 's4_') === 0; });
  var total = s4qids.length || 20;
  var correct = s4qids.filter(function(id){ var d = weakDB[id]; return d && d.correct > 0; }).length;
  var pct = Math.round(correct / total * 100);
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '🎭' : '🥚';
  var msg = pct >= 90 ? 'きょん「公民、完璧！！社長の器！！」<br>西村「文句なし。入試の大問5・6は取れる」'
          : pct >= 70 ? 'きょん「だいぶわかってきた！！」<br>西村「あと少し。間違えた分野を特訓で潰そう」'
          : pct >= 50 ? 'きょん「半分は取れた…！」<br>西村「弱点ノートで、どの部屋が弱いか見よう」'
          : 'きょん「公民難しい…」<br>西村「大丈夫。ルールカードの4つの部屋に戻ろう。特訓モードで反復」';
  var overlay = document.getElementById('resultOverlay');
  overlay.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--gold);border-radius:20px;padding:36px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 8px 40px rgba(245,158,11,0.25)">'
    + '<div style="font-size:60px;margin-bottom:12px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:26px;color:var(--gold);letter-spacing:2px;margin-bottom:8px">確認テスト結果</div>'
    + '<div style="font-size:44px;color:var(--gold);font-weight:bold;font-family:Bebas Neue,sans-serif">' + correct + ' / ' + total + '</div>'
    + '<div style="font-size:22px;color:var(--gold);margin-bottom:20px">' + pct + '%</div>'
    + '<div style="font-size:14px;color:var(--text2);line-height:2.1;margin-bottom:24px">' + msg + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    + '<button id="resBtnWeak" style="background:var(--purple);color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">📊 弱点を見る</button>'
    + '<button id="resBtnTokku" style="background:var(--red);color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 特訓する</button>'
    + '<button id="resBtnClose" style="background:var(--bg3);color:var(--text2);border:1px solid var(--border);padding:12px 20px;border-radius:10px;font-size:14px;font-family:inherit;cursor:pointer;">閉じる</button>'
    + '</div></div>';
  overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center;overflow-y:auto;padding:20px;box-sizing:border-box';
  document.getElementById('resBtnWeak').addEventListener('click', function(){ overlay.style.display='none'; goSection(5); });
  document.getElementById('resBtnTokku').addEventListener('click', function(){ overlay.style.display='none'; goSection(6); });
  document.getElementById('resBtnClose').addEventListener('click', function(){ overlay.style.display='none'; });
}

// ===== 弱点ノート =====
function renderWeakNote(){
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf(QID_PREFIX) === 0; });
  var wqs = getWeakQuestions();
  var html = '<div class="section-header"><div class="section-badge">社会 公民 · 弱点ノート</div><div class="section-title">弱点ノート</div><div class="section-sub">間違えた問題を確認しよう</div></div>';
  if(allQids.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">📊</div><div style="font-size:16px;line-height:2">まだ記録がありません。<br>Section 1 から始めよう！</div></div>';
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
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:14px;color:var(--text);margin-bottom:2px">' + d.jp + '</div><div style="font-size:12px;color:var(--text2)">正解：' + d.answer + '　（' + d.correct + '/' + d.total + '回）</div></div>'
      + '</div>';
  });
  if(wqs.length > 0){
    html += '<button id="go_tokku_btn" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }
  document.getElementById('mainContent').innerHTML = html;
  var gb = document.getElementById('go_tokku_btn'); if(gb) gb.addEventListener('click', function(){ goSection(6); });
}

// ===== 特訓モード =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };
function renderTokkuMode(){
  var wqs = getWeakQuestions();
  var html = '<div class="section-header"><div class="section-badge" style="background:var(--red)">社会 公民 · 特訓</div><div class="section-title">弱点特訓モード</div><div class="section-sub">弱点問題を集中練習！</div></div>';
  if(wqs.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-size:16px;line-height:2">弱点なし！<br>きょん「公民マスター！！社長だ！！」</div></div>';
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
  var isInput = !d.choices || d.choices.length === 0;
  var html = '<div class="tokku-progress">問題 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　正解 ' + tokkuSession.correct + '</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span class="pct" style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp" style="text-align:left">' + d.jp + '</div>';
  if(isInput){
    html += '<div class="input-wrap" style="justify-content:center"><input class="q-input" id="tokkuInput" type="text" placeholder="答え"><button class="input-submit" id="tokkuSubmit">確認</button></div>';
  } else {
    var choices = shuffleArray(d.choices);
    html += '<div class="tokku-choices">' + choices.map(function(c){ return '<button class="choice-btn" data-tchoice="' + c + '">' + c + '</button>'; }).join('') + '</div>';
  }
  html += '<div class="tokku-result" id="tokkuResult"></div>'
    + '<button id="tokkuNext" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:12px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer">次へ →</button>'
    + '</div>';
  area.innerHTML = html;
  area.querySelectorAll('.choice-btn[data-tchoice]').forEach(function(b){ b.addEventListener('click', function(){ applyTokkuResult(qid, b.dataset.tchoice === d.answer, b.dataset.tchoice); }); });
  var ts = document.getElementById('tokkuSubmit');
  if(ts){ ts.addEventListener('click', function(){ var v = document.getElementById('tokkuInput').value.trim(); if(!v){ showToast('答えを入力してください！'); return; } applyTokkuResult(qid, numMatch(v, d.answer), v); }); }
}
function applyTokkuResult(qid, correct, choice){
  var d = weakDB[qid]; if(!d) return;
  d.total++; if(correct) d.correct++;
  localStorage.setItem('soc_weakdb', JSON.stringify(weakDB));
  tokkuSession.total++; if(correct) tokkuSession.correct++;
  var res = document.getElementById('tokkuResult'); var newPct = getPct(qid);
  document.querySelectorAll('#tokkuArea .choice-btn[data-tchoice]').forEach(function(b){ b.disabled = true; if(b.dataset.tchoice === d.answer) b.classList.add('selected-correct'); else if(b.dataset.tchoice === choice && !correct) b.classList.add('selected-wrong'); });
  var ti = document.getElementById('tokkuInput'); if(ti){ ti.disabled = true; } var ts = document.getElementById('tokkuSubmit'); if(ts) ts.style.display = 'none';
  if(correct){ res.className = 'tokku-result tokku-correct'; res.style.display = 'block'; res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 この問題は卒業！' : ' 正答率 → ' + newPct + '%'); }
  else { deductXP(3); res.className = 'tokku-result tokku-wrong'; res.style.display = 'block'; res.innerHTML = '❌ 間違い！ 正答率 → ' + newPct + '%<div class="tokku-answer">' + d.answer + '</div>'; }
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
    + (pctAll >= 80 ? 'きょん「公民、固まってきた！！」' : 'きょん「まだ穴がある…もう一回！！」') + '</div>'
    + '<button id="tokkuAgain" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer">🔥 もう一度特訓</button>'
    + '</div>';
  document.getElementById('tokkuAgain').addEventListener('click', function(){ renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
renderSection(0);
