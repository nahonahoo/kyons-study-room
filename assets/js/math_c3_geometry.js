// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:20,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「円周角？なにそれ食えるの？」' },
  { lv:2, min:20,  max:55,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「直径なら90°、覚えた」' },
  { lv:3, min:55,  max:110, badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺、相似わかるかも」' },
  { lv:4, min:110, max:185, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:185, max:280, badge:'📺 全国ネット',    title:'課長',          status:'きょん「三平方、にっくんより速いかも」' },
  { lv:6, min:280, max:400, badge:'🌟 冠番組',        title:'部長',          status:'きょん「図形で漫才できるかもしれない」' },
  { lv:7, min:400, max:550, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:550, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('math_geo3_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('math_geo3_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('math_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;
var QID_PREFIX = 'math_geo3_';

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
  localStorage.setItem('math_xp', xp);
  localStorage.setItem('math_geo3_answered', JSON.stringify(answeredSet));
  updateXP(); return getLevel(xp).lv > old;
}
function deductXP(pts){
  var old = getLevel(xp).lv; xp = Math.max(0, xp - pts);
  localStorage.setItem('math_xp', xp); updateXP(); return getLevel(xp).lv < old;
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
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  var _t = new Date().toISOString().slice(0,10);
  var _d = JSON.parse(localStorage.getItem('math_daily') || '{}');
  _d[_t] = (_d[_t] || 0) + 1; localStorage.setItem('math_daily', JSON.stringify(_d));
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
  correct: ['きょん「合ってる！！図形、見えた！！」', 'きょん「やった！！角度ぴったり！！」', 'きょん「にっくん見て！解けた！！」'],
  nishi:   ['西村「正解。定理が使えてる」', '西村「できてる。その調子」', '西村「図が見えてる証拠だ」']
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
  else { var msgs = ['きょん「あれ！間違えた！図に角度を書き込む！！」','きょん「また間違えた…！どの定理か確認！！」','きょん「ルールカードを見直す！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('math_geo3_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var inp = document.getElementById('inp_' + qid); if(inp){ inp.disabled = true; inp.value = meta.answer; var sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if(sb) sb.style.display = 'none'; }
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で解く！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。どの定理を使ったか確認しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = QID_PREFIX + 's' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('math_geo3_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if(nb && nb.style.display === 'none'){
      nb.style.display = 'block';
      if(!document.getElementById('secCompleteBanner')){
        var banner = document.createElement('div'); banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 4 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '結果を見よう！';
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

// ===== TABS =====
var SECTIONS = [
  { id:0, label:'📐 スタート',  title:'中3図形は「3つの定理」',    sub:'円周角・相似・三平方——大問3(1)は毎年ここ' },
  { id:1, label:'円周角',       title:'円周角の定理',              sub:'中心角の半分・同じ弧・直径は90°・定理の逆' },
  { id:2, label:'相似',         title:'相似な図形',                sub:'相似条件・平行線と線分の比・中点連結・面積比' },
  { id:3, label:'三平方',       title:'三平方の定理',              sub:'a²＋b²＝c²・特別な三角形・座標・立体' },
  { id:4, label:'確認テスト',   title:'確認テスト',                sub:'入試形式20問（数字マークの答え方も）' },
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
    + '<div class="section-badge">数学 中3図形 · SECTION ' + id + '</div>'
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
var svgCircle3 = '<svg viewBox="0 0 320 150" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【円周角の3ルール】</text>'
  + '<circle cx="60" cy="80" r="42" fill="none" stroke="#30363d" stroke-width="1.5"/>'
  + '<circle cx="60" cy="80" r="2" fill="#8b949e"/>'
  + '<line x1="60" y1="80" x2="30" y2="50" stroke="#f5c518" stroke-width="1.5"/>'
  + '<line x1="60" y1="80" x2="95" y2="55" stroke="#f5c518" stroke-width="1.5"/>'
  + '<line x1="60" y1="122" x2="30" y2="50" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="60" y1="122" x2="95" y2="55" stroke="#a371f7" stroke-width="1.5"/>'
  + '<text x="60" y="76" fill="#f5c518" font-size="9" text-anchor="middle">2a</text>'
  + '<text x="60" y="116" fill="#a371f7" font-size="9" text-anchor="middle">a</text>'
  + '<text x="60" y="140" fill="#e6edf3" font-size="9" text-anchor="middle">①中心角＝円周角×2</text>'
  + '<circle cx="160" cy="80" r="42" fill="none" stroke="#30363d" stroke-width="1.5"/>'
  + '<line x1="130" y1="112" x2="135" y2="45" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="130" y1="112" x2="195" y2="60" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="175" y1="118" x2="135" y2="45" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<line x1="175" y1="118" x2="195" y2="60" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<text x="134" y="104" fill="#a371f7" font-size="9">a</text>'
  + '<text x="170" y="112" fill="#0ea5e9" font-size="9">a</text>'
  + '<text x="160" y="140" fill="#e6edf3" font-size="9" text-anchor="middle">②同じ弧→円周角は等しい</text>'
  + '<circle cx="260" cy="80" r="42" fill="none" stroke="#30363d" stroke-width="1.5"/>'
  + '<line x1="218" y1="80" x2="302" y2="80" stroke="#e94560" stroke-width="2"/>'
  + '<line x1="218" y1="80" x2="245" y2="42" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="302" y1="80" x2="245" y2="42" stroke="#a371f7" stroke-width="1.5"/>'
  + '<text x="247" y="56" fill="#a371f7" font-size="9" text-anchor="middle">90°</text>'
  + '<text x="260" y="95" fill="#e94560" font-size="8" text-anchor="middle">直径</text>'
  + '<text x="260" y="140" fill="#e6edf3" font-size="9" text-anchor="middle">③直径の上の円周角＝90°</text>'
  + '</svg>';

var svgSimilar = '<svg viewBox="0 0 320 150" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【平行線と線分の比】</text>'
  + '<polygon points="80,30 20,130 140,130" fill="none" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="50" y1="80" x2="110" y2="80" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="80" y="26" fill="#e6edf3" font-size="10" text-anchor="middle">A</text>'
  + '<text x="42" y="82" fill="#0ea5e9" font-size="10" text-anchor="end">D</text>'
  + '<text x="118" y="82" fill="#0ea5e9" font-size="10">E</text>'
  + '<text x="14" y="140" fill="#e6edf3" font-size="10">B</text>'
  + '<text x="142" y="140" fill="#e6edf3" font-size="10">C</text>'
  + '<text x="80" y="146" fill="#f5c518" font-size="9" text-anchor="middle">DE//BC → AD:AB＝AE:AC＝DE:BC</text>'
  + '<polygon points="240,30 190,130 300,130" fill="none" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="215" y1="80" x2="270" y2="80" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="240" y="26" fill="#e6edf3" font-size="10" text-anchor="middle">A</text>'
  + '<text x="207" y="82" fill="#0ea5e9" font-size="10" text-anchor="end">M</text>'
  + '<text x="278" y="82" fill="#0ea5e9" font-size="10">N</text>'
  + '<text x="184" y="140" fill="#e6edf3" font-size="10">B</text>'
  + '<text x="302" y="140" fill="#e6edf3" font-size="10">C</text>'
  + '<text x="245" y="146" fill="#f5c518" font-size="9" text-anchor="middle">中点連結：MN//BC、MN＝BC÷2</text>'
  + '</svg>';

var svgPytha = '<svg viewBox="0 0 320 160" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【三平方の定理と特別な直角三角形】</text>'
  + '<polygon points="20,130 100,130 100,60" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="1.5"/>'
  + '<rect x="90" y="120" width="10" height="10" fill="none" stroke="#a371f7" stroke-width="1"/>'
  + '<text x="60" y="145" fill="#e6edf3" font-size="10" text-anchor="middle">a</text>'
  + '<text x="108" y="98" fill="#e6edf3" font-size="10">b</text>'
  + '<text x="50" y="90" fill="#f5c518" font-size="10">c</text>'
  + '<text x="60" y="40" fill="#f5c518" font-size="11" text-anchor="middle" font-weight="bold">a²＋b²＝c²</text>'
  + '<polygon points="130,130 200,130 200,60" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<text x="165" y="145" fill="#e6edf3" font-size="10" text-anchor="middle">1</text>'
  + '<text x="206" y="98" fill="#e6edf3" font-size="10">1</text>'
  + '<text x="152" y="90" fill="#0ea5e9" font-size="10">√2</text>'
  + '<text x="175" y="40" fill="#0ea5e9" font-size="10" text-anchor="middle">45°-45°-90°</text>'
  + '<text x="175" y="52" fill="#8b949e" font-size="9" text-anchor="middle">1：1：√2</text>'
  + '<polygon points="230,130 310,130 310,84" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="1.5"/>'
  + '<text x="270" y="145" fill="#e6edf3" font-size="10" text-anchor="middle">√3</text>'
  + '<text x="314" y="110" fill="#e6edf3" font-size="10">1</text>'
  + '<text x="258" y="100" fill="#3fb950" font-size="10">2</text>'
  + '<text x="270" y="40" fill="#3fb950" font-size="10" text-anchor="middle">30°-60°-90°</text>'
  + '<text x="270" y="52" fill="#8b949e" font-size="9" text-anchor="middle">1：2：√3</text>'
  + '</svg>';

// ===== SECTION 0 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん（富士田恭兵）','中3の図形って、円とか相似とか三平方とか、いっぱいあって何から手をつければ…')
    + chat('nishi','西村真二（慶應卒・元アナ）','愛知県の入試の大問3は3年連続で「(1)円周角で角度、(2)相似で長さや面積、(3)三平方で面積や体積」。この3つの定理だけだ。しかも(1)は毎年、円周角の定理を1〜2回使うだけで解ける。')
    + chat('kyon','きょん','定理は3つ！それなら覚えられる！')
    + chat('nishi','西村','大問3は答えを記号ではなく<strong>数字でマーク</strong>する。「[アイ]度」なら十の位と一の位を別々に塗る。ここも練習しよう。')
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 3つの定理と入試での出方</div>'
    + '<div class="rule-box"><div class="rule-title">① 円周角の定理 → Section 1</div><div class="ex">中心角の半分・同じ弧なら等しい・直径なら90°</div><div class="note">入試：R7 3(1) ∠OBD＝42°／R6 3(3) 半円と直径／R5 3(1) ∠ADC＝66°</div></div>'
    + '<div class="rule-box"><div class="rule-title">② 相似 → Section 2</div><div class="ex">平行線があれば相似な三角形を探す。対応する辺の比が等しい</div><div class="note">入試：R6 (10) 平行四辺形とFG＝15/4／R5 3(2) 長方形とFE//DB／R7 3(2) 長方形の中の相似</div></div>'
    + '<div class="rule-box"><div class="rule-title">③ 三平方の定理 → Section 3</div><div class="ex">直角三角形の斜辺²＝他の2辺²の和。長さを求めたら面積・体積へ</div><div class="note">入試：R6 3(2) EF＝√5／R5 3(3) 台形の高さ4→面積24／R7 3(3) 正四角すいの高さ</div></div>'
    + '<div class="note">💡 答え方：大問3は「[アイ]度」「√[ア]cm」「[アイ]/[ウ]cm²」のように<strong>数字をそのままマーク</strong>。分数は約分、√の中は最小に</div>'
    + '</div>'

    + '<button class="start-btn" data-goto="1">📐 Section 1：円周角から始める →</button>';
}

// ===== SECTION 1: 円周角 =====
function renderSection1(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん','円周角って、円の周りにある角？')
    + chat('nishi','西村真二（慶應卒・元アナ）','円周上の1点から、弧の両端に引いた2本の線がつくる角。同じ弧を「中心」から見た角が中心角で、円周角はその<strong>ちょうど半分</strong>。')
    + chat('kyon','きょん','中心から見ると2倍に見えるってこと？近いから大きく見える、みたいな。')
    + chat('nishi','西村','その感覚でいい。そして<strong>同じ弧を見ている円周角はどこから見ても同じ大きさ</strong>。直径を見ている円周角は中心角180°の半分で90°。この3つで大問3(1)は解ける。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 円周角の定理</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgCircle3 + '</div>'
    + '<div class="rule-box"><div class="rule-title">3つのルール</div><div class="ex">① 中心角＝円周角×2（円周角＝中心角÷2）<br>② 同じ弧（同じ弦）に対する円周角は等しい<br>③ 直径（半円の弧）に対する円周角＝90°</div></div>'
    + '<div class="rule-box"><div class="rule-title">よく組み合わせる道具</div><div class="ex">・円の半径は全部等しい → OA＝OB → △OAB は<strong>二等辺三角形</strong>（底角が等しい）<br>・弧の長さと円周角は比例（弧が2倍→円周角も2倍）<br>・円に内接する四角形：向かい合う角の和＝180°<br>・<strong>定理の逆</strong>：2点C,Dが直線ABの同じ側にあって ∠ACB＝∠ADB なら、4点A,B,C,Dは同じ円の上（R7 (10)で使う）</div></div>'
    + '<div class="note">💡 解く手順：①わかっている角を全部書き込む → ②「同じ弧」を探して円周角を移す → ③二等辺三角形で底角をそろえる</div>'
    + '</div>';

  var qs = [
    { qid:'math_geo3_s1_q0', jp:'円Oで、弧ABに対する中心角∠AOBが100°のとき、同じ弧に対する円周角∠APBは？',
      answer:'50°', choices:['50°','100°','200°','80°'],
      exp:'📐 円周角＝中心角÷2＝<strong style="color:var(--gold)">50°</strong>' },
    { qid:'math_geo3_s1_q1', jp:'円周角∠APBが35°のとき、同じ弧ABに対する中心角∠AOBは？',
      answer:'70°', choices:['70°','35°','17.5°','145°'],
      exp:'📐 中心角＝円周角×2＝<strong style="color:var(--gold)">70°</strong>' },
    { qid:'math_geo3_s1_q2', jp:'円周上の点P、Qから弧ABを見て、∠APB＝40°のとき∠AQBは？',
      answer:'40°', choices:['40°','80°','20°','140°'],
      exp:'📐 同じ弧に対する円周角は等しい → <strong style="color:var(--gold)">40°</strong>' },
    { qid:'math_geo3_s1_q3', jp:'ABが円Oの直径で、Cが円周上の点。∠CAB＝35°のとき∠CBAは？',
      answer:'55°', choices:['55°','35°','45°','65°'],
      exp:'📐 直径→∠ACB＝90° → ∠CBA＝180−90−35＝<strong style="color:var(--gold)">55°</strong>' },
    { qid:'math_geo3_s1_q4', jp:'円Oで、弧AB：弧BC＝1：2。弧ABに対する円周角が25°のとき、弧BCに対する円周角は？',
      answer:'50°', choices:['50°','25°','12.5°','75°'],
      exp:'📐 弧の長さと円周角は比例 → 2倍の<strong style="color:var(--gold)">50°</strong>' },
    { qid:'math_geo3_s1_q5', jp:'円に内接する四角形ABCDで∠A＝110°のとき、∠Cは？',
      answer:'70°', choices:['70°','110°','55°','250°'],
      exp:'📐 向かい合う角の和＝180° → 180−110＝<strong style="color:var(--gold)">70°</strong>' },
    { qid:'math_geo3_s1_q6', type:'input', jp:'A、B、C、Dは円Oの周上の点で、AO//BC。∠AOB＝48°のとき、∠ADCは何度？（数字だけ）<br><span style="font-size:12px;color:var(--text2)">（R5 大問3(1)。答えは「アイ」に2桁でマーク）</span>', formula:'錯角 → 二等辺三角形 → 中心角の合計 → 半分', answer:'66', xp:8, hint:'AO//BC → ∠OBC＝48°（錯角）。OB＝OC → ∠OCB＝48° → ∠BOC＝84°。∠AOC＝48＋84',
      exp:'✅ AO//BC → ∠OBC＝∠AOB＝48°（錯角）<br>OB＝OC → ∠OCB＝48° → ∠BOC＝180−96＝84°<br>弧ABCに対する中心角 ∠AOC＝48＋84＝132° → 円周角 ∠ADC＝132÷2＝<strong>66°</strong>' },
    { qid:'math_geo3_s1_q7', jp:'C、Dは線分ABを直径とする円Oの周上の点で、CB＝CD。∠COA＝48°のとき∠OBDは？<br><span style="font-size:12px;color:var(--text2)">（R7 大問3(1)）</span>',
      answer:'42°', choices:['42°','24°','48°','66°'],
      exp:'📐 ∠COA＝48°（中心角）→ 弧ACの円周角 ∠CBA＝24°<br>直径 → ∠ACB＝90° → ∠CAB＝66° → 同じ弧CBの円周角 ∠CDB＝66°<br>CB＝CD → ∠CBD＝66° → ∠OBD＝66−24＝<strong style="color:var(--gold)">42°</strong><br>💡 「アイ」に4と2をマーク' },
    { qid:'math_geo3_s1_q8', jp:'2点C、Dが直線ABの同じ側にあり、∠ACB＝∠ADB＝50°である。正しいものは？',
      answer:'4点A、B、C、Dは同じ円の周上にある', choices:['4点A、B、C、Dは同じ円の周上にある','CDはABに平行である','ABは円の直径である','∠CAD＝50°である'],
      exp:'📐 <strong>円周角の定理の逆</strong>：同じ側から同じ線分を同じ角で見る2点は、同一円周上<br>💡 R7 (10) で「∠BAC＝∠BDC＝36°→4点が同一円周上→∠DAC＝∠DBC」と使った' },
    { qid:'math_geo3_s1_q9', type:'input', jp:'ABを直径とする半円で、Cは弧上の点、CA＝CB。∠CABは何度？（数字だけ）', formula:'直径→90°、二等辺→底角が等しい', answer:'45', xp:6, hint:'∠ACB＝90°、残り90°を2等分',
      exp:'✅ 直径 → ∠ACB＝90°。CA＝CB → ∠CAB＝∠CBA＝(180−90)÷2＝<strong>45°</strong><br>💡 R6 3(3) の「CA＝CB の半円」はこの直角二等辺三角形' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 2: 相似 =====
function renderSection2(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん','相似って「形が同じで大きさが違う」でしょ？何を求めるの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','長さと面積だ。入試では「平行な線があるとき、その中に相似な三角形が隠れている」。平行線を見つけたら、向かい合う2つの三角形を探して、対応する辺の比を書く。')
    + chat('kyon','きょん','平行線＝相似のサイン！')
    + chat('nishi','西村','そう。あと相似比が2:3なら面積比は4:9、体積比は8:27。「2乗・3乗」も毎年どこかで出る。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 相似のルール</div>'
    + '<div class="rule-box"><div class="rule-title">三角形の相似条件（3つ）</div><div class="ex">① 3組の辺の比がすべて等しい　② 2組の辺の比とその間の角が等しい　③ <strong style="color:var(--gold)">2組の角がそれぞれ等しい</strong>（入試ではほぼこれ。平行線の錯角・対頂角で角をそろえる）</div></div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgSimilar + '</div>'
    + '<div class="rule-box"><div class="rule-title">平行線と線分の比・中点連結定理</div><div class="ex">DE//BC → △ADE∽△ABC → AD:AB＝AE:AC＝DE:BC<br>AD:DB＝AE:EC も成り立つ<br>M、Nが中点 → MN//BC、MN＝BC÷2</div></div>'
    + '<div class="rule-box"><div class="rule-title">相似比と面積比・体積比</div><div class="ex">相似比 m:n → 面積比 <strong style="color:var(--gold)">m²:n²</strong> → 体積比 <strong style="color:var(--gold)">m³:n³</strong><br>例：相似比2:3 → 面積比4:9、体積比8:27</div></div>'
    + '<div class="note">💡 解く手順：①平行線を見つける → ②「ちょうちょ型（対頂角）」か「ピラミッド型（共通の角）」の相似を探す → ③対応する辺を「小さい方：大きい方」でそろえて比例式</div>'
    + '</div>';

  var qs = [
    { qid:'math_geo3_s2_q0', jp:'△ABCと△DEFで、∠A＝∠D、∠B＝∠Eのとき、相似である根拠は？',
      answer:'2組の角がそれぞれ等しい', choices:['2組の角がそれぞれ等しい','3組の辺の比がすべて等しい','2組の辺の比とその間の角が等しい','相似ではない'],
      exp:'📐 角が2組等しい → 3つ目も自動的に等しい → 相似<br>💡 入試の相似はほぼこの条件' },
    { qid:'math_geo3_s2_q1', jp:'△ABCで、DE//BC、AD＝4cm、DB＝2cm、AE＝6cm のとき、ECは？',
      answer:'3cm', choices:['3cm','4cm','2cm','9cm'],
      exp:'📐 AD:DB＝AE:EC → 4:2＝6:x → x＝<strong style="color:var(--gold)">3</strong>cm' },
    { qid:'math_geo3_s2_q2', jp:'△ABCで、DE//BC、AD:DB＝2:1、BC＝9cm のとき、DEは？',
      answer:'6cm', choices:['6cm','4.5cm','3cm','18cm'],
      exp:'📐 AD:AB＝2:3（DBが1なのでABは3）→ DE:BC＝2:3 → DE＝9×2/3＝<strong style="color:var(--gold)">6</strong>cm<br>⚠️ AD:DB＝2:1 を DE:BC にそのまま使わない。AB全体との比にする' },
    { qid:'math_geo3_s2_q3', jp:'△ABCで、M、NがそれぞれAB、ACの中点。BC＝12cm のとき、MNは？',
      answer:'6cm', choices:['6cm','12cm','4cm','24cm'],
      exp:'📐 中点連結定理：MN＝BC÷2＝<strong style="color:var(--gold)">6</strong>cm' },
    { qid:'math_geo3_s2_q4', jp:'△ABC∽△DEFで、AB＝6cm、DE＝9cm、BC＝8cm のとき、EFは？',
      answer:'12cm', choices:['12cm','11cm','10cm','5.3cm'],
      exp:'📐 相似比 AB:DE＝6:9＝2:3 → BC:EF＝2:3 → EF＝8×3/2＝<strong style="color:var(--gold)">12</strong>cm' },
    { qid:'math_geo3_s2_q5', jp:'相似比が2:3の2つの三角形で、小さい方の面積が8cm²のとき、大きい方の面積は？',
      answer:'18cm²', choices:['18cm²','12cm²','27cm²','16cm²'],
      exp:'📐 面積比＝2²:3²＝4:9 → 8×9/4＝<strong style="color:var(--gold)">18</strong>cm²' },
    { qid:'math_geo3_s2_q6', jp:'相似比が1:2の2つの立体で、小さい方の体積が5cm³のとき、大きい方の体積は？',
      answer:'40cm³', choices:['40cm³','10cm³','20cm³','8cm³'],
      exp:'📐 体積比＝1³:2³＝1:8 → 5×8＝<strong style="color:var(--gold)">40</strong>cm³' },
    { qid:'math_geo3_s2_q7', jp:'平行四辺形ABCD、Eは辺DC上でDE:EC＝2:3、Fは線分ACとEBの交点、Gは辺BC上でAB//FG。AB＝10cmのとき、FGは？<br><span style="font-size:12px;color:var(--text2)">（R6 大問1(10)）</span>',
      answer:'15/4 cm', choices:['15/4 cm','3cm','18/5 cm','4cm'],
      exp:'📐 DC＝AB＝10 → EC＝6。EC//AB → △FEC∽△FBA（ちょうちょ型）→ CF:FA＝EC:AB＝6:10＝3:5 → CF:CA＝3:8<br>FG//AB → △CFG∽△CAB（ピラミッド型）→ FG＝AB×3/8＝<strong style="color:var(--gold)">15/4</strong>cm' },
    { qid:'math_geo3_s2_q8', type:'input', jp:'長方形ABCD（AB＝6cm、AD＝10cm）で、Eは辺ABの中点、Fは辺AD上の点で FE//DB。AFは何cm？（数字だけ）<br><span style="font-size:12px;color:var(--text2)">（R5 大問3(2)の前半）</span>', formula:'FE//DB → △AFE∽△ADB', answer:'5', xp:7, hint:'AE:AB＝1:2 → AF:AD＝1:2',
      exp:'✅ FE//DB → △AFE∽△ADB → AF:AD＝AE:AB＝3:6＝1:2 → AF＝10÷2＝<strong>5</strong>cm<br>💡 このあと三平方で FE＝√(5²＋3²)＝√34（Section 3）' },
    { qid:'math_geo3_s2_q9', jp:'△ABCで、点DはAB上、点EはAC上にあり、AD:AB＝AE:AC＝1:3。△ADEと△ABCの面積比は？',
      answer:'1:9', choices:['1:9','1:3','1:6','2:3'],
      exp:'📐 相似比1:3 → 面積比1²:3²＝<strong style="color:var(--gold)">1:9</strong>' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 3: 三平方 =====
function renderSection3(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん','三平方の定理って、3・4・5のやつ？')
    + chat('nishi','西村真二（慶應卒・元アナ）','そう。直角三角形なら、<strong>直角をはさむ2辺を2乗して足すと、斜辺の2乗</strong>になる。3²＋4²＝9＋16＝25＝5²。')
    + chat('kyon','きょん','斜辺は一番長い辺だよね。直角の向かい側。')
    + chat('nishi','西村','その通り。入試では「長さを求めて、面積や体積を出す」流れ。直角三角形が見えないときは、<strong>自分で垂線を引いて直角三角形を作る</strong>。台形の高さ、正四角すいの高さ、全部これだ。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 三平方の定理</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgPytha + '</div>'
    + '<div class="rule-box"><div class="rule-title">定理と使い方</div><div class="ex">直角三角形で <strong style="color:var(--gold)">a²＋b²＝c²</strong>（cは斜辺＝直角の向かい側）<br>斜辺を求める：c＝√(a²＋b²)　　他の辺を求める：a＝√(c²−b²)<br>覚えておく組：3-4-5、5-12-13、6-8-10、8-15-17</div></div>'
    + '<div class="rule-box"><div class="rule-title">特別な直角三角形（比で一発）</div><div class="ex">45°-45°-90°（直角二等辺）：1：1：<strong>√2</strong> → 正方形の対角線＝1辺×√2<br>30°-60°-90°：1：2：<strong>√3</strong> → 正三角形の高さ＝1辺×√3/2</div></div>'
    + '<div class="rule-box"><div class="rule-title">よく出る使い方</div><div class="ex">・座標：2点間の距離＝√((x差)²＋(y差)²)<br>・台形の高さ：脚を斜辺とする直角三角形を作る<br>・立方体の対角線＝1辺×√3、直方体の対角線＝√(a²＋b²＋c²)<br>・円錐：母線²＝半径²＋高さ²<br>・逆：3辺が a²＋b²＝c² を満たせば直角三角形</div></div>'
    + '</div>';

  var qs = [
    { qid:'math_geo3_s3_q0', jp:'直角をはさむ2辺が3cmと4cmの直角三角形の斜辺は？',
      answer:'5cm', choices:['5cm','7cm','√7cm','12cm'],
      exp:'📐 √(9＋16)＝√25＝<strong style="color:var(--gold)">5</strong>cm' },
    { qid:'math_geo3_s3_q1', jp:'斜辺が13cm、1辺が5cmの直角三角形の、もう1辺は？',
      answer:'12cm', choices:['12cm','8cm','√194cm','18cm'],
      exp:'📐 √(169−25)＝√144＝<strong style="color:var(--gold)">12</strong>cm<br>⚠️ 斜辺から引く' },
    { qid:'math_geo3_s3_q2', jp:'1辺が4cmの正方形の対角線の長さは？',
      answer:'4√2 cm', choices:['4√2 cm','8cm','4√3 cm','2√2 cm'],
      exp:'📐 直角二等辺 1:1:√2 → 4×√2＝<strong style="color:var(--gold)">4√2</strong>cm' },
    { qid:'math_geo3_s3_q3', jp:'1辺が6cmの正三角形の高さは？',
      answer:'3√3 cm', choices:['3√3 cm','3cm','6√3 cm','3√2 cm'],
      exp:'📐 30-60-90 → 高さ＝6×√3/2＝<strong style="color:var(--gold)">3√3</strong>cm<br>（または √(36−9)＝√27＝3√3）' },
    { qid:'math_geo3_s3_q4', jp:'2点A(1, 2)、B(4, 6)の距離は？',
      answer:'5', choices:['5','7','√7','25'],
      exp:'📐 x差3、y差4 → √(9＋16)＝<strong style="color:var(--gold)">5</strong>' },
    { qid:'math_geo3_s3_q5', type:'input', jp:'正方形ABCD（1辺4cm）で、Eは辺DCの中点、Fは線分EBの中点。線分EFの長さは √[ア] cm。アに入る数字は？<br><span style="font-size:12px;color:var(--text2)">（R6 大問3(2)①）</span>', formula:'EB＝√(BC²＋CE²)、EF＝EB÷2', answer:'5', xp:8, hint:'CE＝2、BC＝4 → EB＝√20＝2√5 → 半分',
      exp:'✅ EB＝√(4²＋2²)＝√20＝2√5 → EF＝√5 → ア＝<strong>5</strong>' },
    { qid:'math_geo3_s3_q6', jp:'ABを直径とする半円で、CA＝CB、CA＝6cm。Dは弧CB上の点で DA:DB＝3:1。△DABの面積は？<br><span style="font-size:12px;color:var(--text2)">（R6 大問3(3)①）</span>',
      answer:'54/5 cm²', choices:['54/5 cm²','18cm²','27/5 cm²','36cm²'],
      exp:'📐 CA＝CB、∠C＝90° → AB＝6√2。∠ADB＝90°（直径）→ DA＝3k、DB＝k → 9k²＋k²＝72 → k²＝36/5<br>面積＝½×3k×k＝(3/2)×36/5＝<strong style="color:var(--gold)">54/5</strong>cm²<br>💡 「アイ/ウ」に5,4,5をマーク' },
    { qid:'math_geo3_s3_q7', type:'input', jp:'台形ABCDで AB//DC、AB＝3cm、DC＝9cm、CB＝DA＝5cm。台形の面積は何cm²？（数字だけ）<br><span style="font-size:12px;color:var(--text2)">（R5 大問3(3)①）</span>', formula:'高さ＝√(5²−3²)', answer:'24', xp:8, hint:'両端のはみ出しは(9−3)÷2＝3ずつ。高さ＝√(25−9)＝4',
      exp:'✅ 下底のはみ出し(9−3)÷2＝3 → 高さ＝√(5²−3²)＝4 → 面積＝(3＋9)×4÷2＝<strong>24</strong>cm²' },
    { qid:'math_geo3_s3_q8', jp:'1辺が3cmの立方体の対角線の長さは？',
      answer:'3√3 cm', choices:['3√3 cm','3√2 cm','9cm','√27 cm'],
      exp:'📐 対角線＝1辺×√3＝<strong style="color:var(--gold)">3√3</strong>cm（√27と同じだが、√の中は最小にする）' },
    { qid:'math_geo3_s3_q9', jp:'底面の半径6cm、母線10cmの円錐の高さは？',
      answer:'8cm', choices:['8cm','4cm','2√34 cm','16cm'],
      exp:'📐 高さ＝√(10²−6²)＝√64＝<strong style="color:var(--gold)">8</strong>cm（6-8-10）' },
    { qid:'math_geo3_s3_q10', jp:'3辺の長さが次のうち、直角三角形になるものは？',
      answer:'6cm、8cm、10cm', choices:['6cm、8cm、10cm','5cm、6cm、7cm','4cm、5cm、6cm','2cm、3cm、4cm'],
      exp:'📐 36＋64＝100＝10² → 直角三角形（三平方の定理の逆）' },
    { qid:'math_geo3_s3_q11', type:'input', jp:'底面が台形（面積24cm²）の四角柱で、高さが7cm。体積は何cm³？（数字だけ）', formula:'底面積×高さ', answer:'168', xp:5, hint:'24×7',
      exp:'✅ 24×7＝<strong>168</strong>cm³<br>💡 R5 3(3)② は、この四角柱から一部を切り取った立体の体積（70cm³）を求める発展問題' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 確認テスト — 円周角・相似・三平方 総まとめ</div>'
    + '<div class="rule-box"><div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + '3つの定理から <strong style="color:var(--gold)">20問</strong>。入力問題は大問3の「数字マーク」の練習！<br>'
    + 'きょん「定理は3つ！図に書き込む！！」<br>'
    + '西村「斜辺はどれか、平行線はどこか、同じ弧はどれか」'
    + '</div></div></div>';

  var qs = [
    { qid:'math_geo3_s4_q0', jp:'中心角∠AOB＝120°のとき、円周角∠APBは？', answer:'60°', choices:['60°','120°','240°','30°'], exp:'📐 120÷2＝<strong style="color:var(--gold)">60°</strong>' },
    { qid:'math_geo3_s4_q1', jp:'ABが直径、Cが円周上。∠ABC＝28°のとき∠BACは？', answer:'62°', choices:['62°','28°','52°','90°'], exp:'📐 ∠ACB＝90° → 180−90−28＝<strong style="color:var(--gold)">62°</strong>' },
    { qid:'math_geo3_s4_q2', jp:'円周上の点P、Qから弧ABを見て∠APB＝55°。∠AQBは？', answer:'55°', choices:['55°','110°','27.5°','125°'], exp:'📐 同じ弧 → <strong style="color:var(--gold)">55°</strong>' },
    { qid:'math_geo3_s4_q3', type:'input', jp:'円Oで、弧ABに対する円周角が32°。中心角∠AOBは何度？（数字だけ）', formula:'円周角×2', answer:'64', xp:5, hint:'32×2', exp:'✅ <strong>64°</strong>' },
    { qid:'math_geo3_s4_q4', type:'input', jp:'△ABCはAB＝ACの二等辺三角形、Dは辺AC上でAC⊥DB、Eは直線DB上、FはEを通りBCに平行な直線とABの交点。∠FEB＝21°のとき∠ABDは何度？（数字だけ）<br><span style="font-size:12px;color:var(--text2)">（R6 大問3(1)）</span>', formula:'錯角 → 直角三角形 → 二等辺の底角 → 引く', answer:'48', xp:9, hint:'FE//BC → ∠DBC＝21°。△DBCで∠DCB＝69°。AB＝AC → ∠ABC＝69°',
      exp:'✅ FE//BC → ∠EBC＝∠FEB＝21°（錯角）→ ∠DBC＝21°<br>∠BDC＝90° → ∠DCB＝69° ＝ ∠ACB → AB＝AC → ∠ABC＝69°<br>∠ABD＝69−21＝<strong>48°</strong>' },
    { qid:'math_geo3_s4_q5', type:'input', jp:'A、B、C、Dは円Oの周上の点でAO//BC。∠AOB＝48°のとき∠ADCは何度？（数字だけ）', formula:'R5 大問3(1)', answer:'66', xp:8, hint:'∠AOC＝48＋84', exp:'✅ ∠OBC＝48°（錯角）、OB＝OC → ∠BOC＝84° → ∠AOC＝132° → <strong>66°</strong>' },
    { qid:'math_geo3_s4_q6', jp:'△ABCでDE//BC、AD＝3、DB＝6、DE＝4のとき、BCは？', answer:'12', choices:['12','8','6','2'], exp:'📐 AD:AB＝3:9＝1:3 → DE:BC＝1:3 → BC＝<strong style="color:var(--gold)">12</strong>' },
    { qid:'math_geo3_s4_q7', jp:'相似比3:4の2つの図形の面積比は？', answer:'9:16', choices:['9:16','3:4','27:64','6:8'], exp:'📐 2乗 → <strong style="color:var(--gold)">9:16</strong>' },
    { qid:'math_geo3_s4_q8', jp:'相似比1:3の2つの立体の体積比は？', answer:'1:27', choices:['1:27','1:9','1:3','1:6'], exp:'📐 3乗 → <strong style="color:var(--gold)">1:27</strong>' },
    { qid:'math_geo3_s4_q9', jp:'M、NがAB、ACの中点でMN＝7cmのとき、BCは？', answer:'14cm', choices:['14cm','3.5cm','7cm','21cm'], exp:'📐 中点連結：BC＝MN×2＝<strong style="color:var(--gold)">14</strong>cm' },
    { qid:'math_geo3_s4_q10', jp:'平行四辺形ABCD、E は辺DC上でDE:EC＝2:3、F はACとEBの交点、G は辺BC上でAB//FG。AB＝10cm のとき FG は？', answer:'15/4 cm', choices:['15/4 cm','3cm','18/5 cm','4cm'], exp:'📐 CF:CA＝3:8 → FG＝10×3/8＝<strong style="color:var(--gold)">15/4</strong>' },
    { qid:'math_geo3_s4_q11', jp:'長方形ABCD（AB＝6、AD＝10）、Eは辺ABの中点、Fは辺AD上でFE//DB。FEの長さは？<br><span style="font-size:12px;color:var(--text2)">（R5 大問3(2)①：√[アイ]）</span>', answer:'√34 cm', choices:['√34 cm','√61 cm','5cm','√29 cm'], exp:'📐 相似でAF＝5、AE＝3 → FE＝√(25＋9)＝<strong style="color:var(--gold)">√34</strong>cm → アイ＝34' },
    { qid:'math_geo3_s4_q12', jp:'直角をはさむ2辺が5cmと12cmの直角三角形の斜辺は？', answer:'13cm', choices:['13cm','17cm','√119 cm','7cm'], exp:'📐 √(25＋144)＝<strong style="color:var(--gold)">13</strong>' },
    { qid:'math_geo3_s4_q13', jp:'斜辺10cm、1辺6cmの直角三角形のもう1辺は？', answer:'8cm', choices:['8cm','4cm','√136 cm','16cm'], exp:'📐 √(100−36)＝<strong style="color:var(--gold)">8</strong>' },
    { qid:'math_geo3_s4_q14', jp:'1辺が5cmの正方形の対角線は？', answer:'5√2 cm', choices:['5√2 cm','10cm','5√3 cm','√10 cm'], exp:'📐 1:1:√2 → <strong style="color:var(--gold)">5√2</strong>' },
    { qid:'math_geo3_s4_q15', jp:'30°-60°-90°の直角三角形で斜辺が8cmのとき、最も短い辺は？', answer:'4cm', choices:['4cm','4√3 cm','8√3 cm','2cm'], exp:'📐 1:2:√3 → 短辺＝斜辺÷2＝<strong style="color:var(--gold)">4</strong>cm' },
    { qid:'math_geo3_s4_q16', jp:'2点(−2, 1)、(4, 9)の距離は？', answer:'10', choices:['10','8','6','14'], exp:'📐 x差6、y差8 → √(36＋64)＝<strong style="color:var(--gold)">10</strong>' },
    { qid:'math_geo3_s4_q17', type:'input', jp:'正方形ABCD（1辺4cm）で、Eは辺DCの中点、Fは線分EBの中点。EF＝√[ア] cm。アは？（数字だけ）', formula:'R6 大問3(2)①', answer:'5', xp:7, hint:'EB＝2√5', exp:'✅ EF＝√5 → <strong>5</strong>' },
    { qid:'math_geo3_s4_q18', type:'input', jp:'台形ABCDで AB//DC、AB＝3cm、DC＝9cm、CB＝DA＝5cm。面積は何cm²？（数字だけ）', formula:'R5 大問3(3)①', answer:'24', xp:7, hint:'高さ4', exp:'✅ (3＋9)×4÷2＝<strong>24</strong>' },
    { qid:'math_geo3_s4_q19', jp:'底面の半径3cm、高さ4cmの円錐の母線の長さは？', answer:'5cm', choices:['5cm','7cm','√7 cm','12cm'], exp:'📐 √(9＋16)＝<strong style="color:var(--gold)">5</strong>cm' },
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
  var msg = pct >= 90 ? 'きょん「3つの定理、完璧！！」<br>西村「文句なし。大問3(1)は取れる」'
          : pct >= 70 ? 'きょん「だいぶ図が見えてきた！！」<br>西村「あと少し。間違えた定理だけ特訓で潰そう」'
          : pct >= 50 ? 'きょん「半分は取れた…！」<br>西村「弱点ノートで、どの定理が弱いか見よう」'
          : 'きょん「図形難しい…」<br>西村「大丈夫。図に角度と長さを全部書き込む癖から。特訓モードで反復」';
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
  document.getElementById('resBtnWeak').addEventListener('click', function(){ overlay.style.display='none'; goSection(5); });
  document.getElementById('resBtnTokku').addEventListener('click', function(){ overlay.style.display='none'; goSection(6); });
  document.getElementById('resBtnClose').addEventListener('click', function(){ overlay.style.display='none'; });
}

// ===== 弱点ノート =====
function renderWeakNote(){
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf(QID_PREFIX) === 0; });
  var wqs = getWeakQuestions();
  var html = '<div class="section-header"><div class="section-badge">数学 中3図形 · 弱点ノート</div><div class="section-title">弱点ノート</div><div class="section-sub">間違えた問題を確認しよう</div></div>';
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
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(163,113,247,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
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
  var html = '<div class="section-header"><div class="section-badge" style="background:var(--red)">数学 中3図形 · 特訓</div><div class="section-title">弱点特訓モード</div><div class="section-sub">弱点問題を集中練習！</div></div>';
  if(wqs.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-size:16px;line-height:2">弱点なし！<br>きょん「図形マスター！！」</div></div>';
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
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
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
    + (pctAll >= 80 ? 'きょん「定理が体に入ってきた！！」' : 'きょん「まだ図が見えてない…もう一回！！」') + '</div>'
    + '<button id="tokkuAgain" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer">🔥 もう一度特訓</button>'
    + '</div>';
  document.getElementById('tokkuAgain').addEventListener('click', function(){ renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
renderSection(0);
