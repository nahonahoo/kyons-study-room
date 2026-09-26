// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:20,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「確率？なにそれ食えるの？」' },
  { lv:2, min:20,  max:55,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「数えるだけなら、いけるかも」' },
  { lv:3, min:55,  max:110, badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺、箱ひげ図読めるかも」' },
  { lv:4, min:110, max:185, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:185, max:280, badge:'📺 全国ネット',    title:'課長',          status:'きょん「にっくんより数え漏れ少なくなってきた」' },
  { lv:6, min:280, max:400, badge:'🌟 冠番組',        title:'部長',          status:'きょん「確率で漫才できるかもしれない」' },
  { lv:7, min:400, max:550, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:550, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('math_pd_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('math_pd_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('math_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;
var QID_PREFIX = 'math_pd_';

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
  localStorage.setItem('math_pd_answered', JSON.stringify(answeredSet));
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
  correct: ['きょん「合ってる！！数え漏れなし！！」', 'きょん「やった！！箱ひげ図、読めた！！」', 'きょん「にっくん見て！解けた！！」'],
  nishi:   ['西村「正解。数え方が正確だ」', '西村「できてる。その調子」', '西村「正しく読み取れてる」']
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
function dataBox(t){ return '<div style="font-family:monospace;font-size:16px;letter-spacing:0.08em;background:var(--bg3);border-radius:8px;padding:8px 14px;margin:6px 0 10px;color:var(--gold)">' + t + '</div>'; }

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
  else { var msgs = ['きょん「あれ！間違えた！数え直す！！」','きょん「また間違えた…！表を書いて一つずつ！！」','きょん「ルールカードを見直す！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('math_pd_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var inp = document.getElementById('inp_' + qid); if(inp){ inp.disabled = true; inp.value = meta.answer; var sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if(sb) sb.style.display = 'none'; }
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で解く！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。数え方を確認しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = QID_PREFIX + 's' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('math_pd_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if(nb && nb.style.display === 'none'){
      nb.style.display = 'block';
      if(!document.getElementById('secCompleteBanner')){
        var banner = document.createElement('div'); banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 5 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '結果を見よう！';
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
  { id:0, label:'🎲 スタート',  title:'確率・データの「3つの技」', sub:'数える・並べる・比例式——計算より数え方' },
  { id:1, label:'確率',         title:'確率（中2）',              sub:'表と樹形図・同時と順番・「少なくとも」' },
  { id:2, label:'度数分布',     title:'データの整理（中1）',       sub:'度数分布表・相対度数・平均値・中央値・最頻値' },
  { id:3, label:'箱ひげ図',     title:'四分位数と箱ひげ図（中2）', sub:'5つの値・四分位範囲・ヒストグラムとの対応' },
  { id:4, label:'標本調査',     title:'標本調査（中3）',           sub:'無作為抽出・比例式で全体を推定' },
  { id:5, label:'確認テスト',   title:'確認テスト',                sub:'入試形式20問' },
  { id:6, label:'📊弱点',       title:'弱点ノート',                sub:'間違えた問題を確認' },
  { id:7, label:'🔥特訓',       title:'弱点特訓モード',            sub:'弱点問題を集中練習！' },
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
  for(var i = 0; i <= 5; i++){ html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>'; }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">数学 確率・データ · SECTION ' + id + '</div>'
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
// 2枚の硬貨の樹形図
var svgTree = '<svg viewBox="0 0 300 130" style="width:100%;max-width:340px;display:block;margin:0 auto">'
  + '<text x="150" y="14" fill="#8b949e" font-size="10" text-anchor="middle">【樹形図：2枚の硬貨を投げる】</text>'
  + '<text x="20" y="72" fill="#8b949e" font-size="10">1枚目</text>'
  + '<text x="120" y="30" fill="#8b949e" font-size="10">2枚目</text>'
  + '<rect x="60" y="40" width="30" height="20" rx="4" fill="rgba(163,113,247,0.15)" stroke="#a371f7"/><text x="75" y="54" fill="#a371f7" font-size="11" text-anchor="middle">表</text>'
  + '<rect x="60" y="85" width="30" height="20" rx="4" fill="rgba(163,113,247,0.15)" stroke="#a371f7"/><text x="75" y="99" fill="#a371f7" font-size="11" text-anchor="middle">裏</text>'
  + '<line x1="90" y1="50" x2="150" y2="38" stroke="#8b949e"/><line x1="90" y1="50" x2="150" y2="62" stroke="#8b949e"/>'
  + '<line x1="90" y1="95" x2="150" y2="83" stroke="#8b949e"/><line x1="90" y1="95" x2="150" y2="107" stroke="#8b949e"/>'
  + '<text x="158" y="42" fill="#e6edf3" font-size="11">表 → 表表 ✅</text>'
  + '<text x="158" y="66" fill="#e6edf3" font-size="11">裏 → 表裏</text>'
  + '<text x="158" y="87" fill="#e6edf3" font-size="11">表 → 裏表</text>'
  + '<text x="158" y="111" fill="#e6edf3" font-size="11">裏 → 裏裏</text>'
  + '<text x="150" y="127" fill="#f5c518" font-size="10" text-anchor="middle">全部で4通り → 2枚とも表は 1/4</text>'
  + '</svg>';

// さいころ2個の表（和が7）
var svgDice = (function(){
  var s = '<svg viewBox="0 0 300 200" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="150" y="14" fill="#8b949e" font-size="10" text-anchor="middle">【表：さいころ2個の目の和（36通り）】</text>';
  var x0 = 50, y0 = 30, w = 34, h = 24;
  s += '<text x="' + (x0 - 6) + '" y="' + (y0 + 16) + '" fill="#8b949e" font-size="9" text-anchor="end">大＼小</text>';
  for(var c = 1; c <= 6; c++){ s += '<text x="' + (x0 + (c-1)*w + w/2) + '" y="' + (y0 + 16) + '" fill="#0ea5e9" font-size="10" text-anchor="middle">' + c + '</text>'; }
  for(var r = 1; r <= 6; r++){
    s += '<text x="' + (x0 - 6) + '" y="' + (y0 + r*h + 16) + '" fill="#a371f7" font-size="10" text-anchor="end">' + r + '</text>';
    for(var c2 = 1; c2 <= 6; c2++){
      var sum = r + c2; var hit = sum === 7;
      s += '<rect x="' + (x0 + (c2-1)*w) + '" y="' + (y0 + r*h) + '" width="' + w + '" height="' + h + '" fill="' + (hit ? 'rgba(245,197,24,0.25)' : 'none') + '" stroke="#30363d"/>';
      s += '<text x="' + (x0 + (c2-1)*w + w/2) + '" y="' + (y0 + r*h + 16) + '" fill="' + (hit ? '#f5c518' : '#e6edf3') + '" font-size="10" text-anchor="middle"' + (hit ? ' font-weight="bold"' : '') + '>' + sum + '</text>';
    }
  }
  s += '<text x="150" y="196" fill="#f5c518" font-size="10" text-anchor="middle">和が7になるのは対角線の6マス → 6/36 ＝ 1/6</text>';
  s += '</svg>';
  return s;
})();

// 箱ひげ図（数字つき）
function svgBoxPlot(min, q1, med, q3, max, label, color){
  var scale = function(v){ return 30 + (v / 100) * 250; };
  var s = '<svg viewBox="0 0 320 90" style="width:100%;max-width:360px;display:block;margin:0 auto 6px">';
  if(label) s += '<text x="8" y="14" fill="' + (color || '#a371f7') + '" font-size="11" font-weight="bold">' + label + '</text>';
  s += '<line x1="30" y1="70" x2="280" y2="70" stroke="#30363d"/>';
  for(var v = 0; v <= 100; v += 20){ s += '<line x1="' + scale(v) + '" y1="66" x2="' + scale(v) + '" y2="74" stroke="#30363d"/><text x="' + scale(v) + '" y="86" fill="#8b949e" font-size="9" text-anchor="middle">' + v + '</text>'; }
  s += '<line x1="' + scale(min) + '" y1="42" x2="' + scale(q1) + '" y2="42" stroke="#e6edf3" stroke-width="2"/>';
  s += '<line x1="' + scale(q3) + '" y1="42" x2="' + scale(max) + '" y2="42" stroke="#e6edf3" stroke-width="2"/>';
  s += '<line x1="' + scale(min) + '" y1="32" x2="' + scale(min) + '" y2="52" stroke="#e6edf3" stroke-width="2"/>';
  s += '<line x1="' + scale(max) + '" y1="32" x2="' + scale(max) + '" y2="52" stroke="#e6edf3" stroke-width="2"/>';
  s += '<rect x="' + scale(q1) + '" y="26" width="' + (scale(q3) - scale(q1)) + '" height="32" fill="rgba(163,113,247,0.15)" stroke="' + (color || '#a371f7') + '" stroke-width="2"/>';
  s += '<line x1="' + scale(med) + '" y1="26" x2="' + scale(med) + '" y2="58" stroke="#f5c518" stroke-width="2.5"/>';
  s += '</svg>';
  return s;
}

// ===== SECTION 0 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">🎲 きょん＆西村の会話</div>'
    + chat('kyon','きょん（富士田恭兵）','確率とかデータとか、計算が難しそう…')
    + chat('nishi','西村真二（慶應卒・元アナ）','逆だ。この単元は計算がほとんどない。やることは3つだけ。①<strong>数える</strong>（確率：全部で何通り、あてはまるのは何通り）②<strong>並べる</strong>（データ：小さい順に並べて真ん中を探す）③<strong>比例式</strong>（標本調査：一部から全体を推定）。')
    + chat('kyon','きょん','数える・並べる・比例式…それだけ？')
    + chat('nishi','西村','それだけ。愛知県の入試では大問1の(8)(9)と大問2の(1)で毎年出る。確率のカード問題、標本調査の推定、箱ひげ図の読み取り。神経衰弱で「どこに何があったか」を数えていたきょんなら得意なはずだ。')
    + chat('kyon','きょん','神経衰弱は学年優勝したからな！！数えるのは任せろ！！')
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 この単元の3つの技と入試での出方</div>'
    + '<div class="rule-box"><div class="rule-title">① 数える（確率）→ Section 1</div><div class="ex">全部の場合の数を表か樹形図で数え、あてはまる数を数える。確率＝あてはまる÷全部</div><div class="note">入試：R7 (9) カード6枚から2枚で文字が異なる確率／R5 (7) 3けたの整数が213以上になる確率</div></div>'
    + '<div class="rule-box"><div class="rule-title">② 並べる（データ）→ Section 2・3</div><div class="ex">小さい順に並べて、真ん中（中央値）、4等分の点（四分位数）を探す。箱ひげ図はこの5つの数を図にしたもの</div><div class="note">入試：R7 2(1) 箱ひげ図から分野を当てる／R6 (9) ヒストグラムから箱ひげ図を選ぶ／R5 2(1) 箱ひげ図</div></div>'
    + '<div class="rule-box"><div class="rule-title">③ 比例式（標本調査）→ Section 4</div><div class="ex">一部を調べて全体を推定。「50個中9個」→「8000個中x個」</div><div class="note">入試：R7 (8) キャベツ8000個の推定</div></div>'
    + '</div>'

    + '<button class="start-btn" data-goto="1">🎲 Section 1：確率から始める →</button>';
}

// ===== SECTION 1: 確率 =====
function renderSection1(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🎲 きょん＆西村の会話</div>'
    + chat('kyon','きょん','さいころ2個で和が7になる確率って、どう数えるの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','大きいさいころを縦、小さいさいころを横にした<strong>6×6の表</strong>を書く。全部で36マス。和が7になるマスに印をつけると6マス。だから6/36＝1/6。')
    + chat('kyon','きょん','表を書けば数え漏れしない！')
    + chat('nishi','西村','そう。硬貨やカードなら樹形図。「同時に2枚」なら順番は関係ないから、(A,B)と(B,A)は同じものとして数える。ここだけ注意。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 確率のルール</div>'
    + '<div class="rule-box"><div class="rule-title">確率 ＝ あてはまる場合の数 ÷ 全部の場合の数</div><div class="ex">どの場合も同じくらい起こりやすい（同様に確からしい）とき。0以上1以下。<br>「起こらない確率」＝ 1 − 起こる確率　→ 「少なくとも1つ」は「1つも〜ない」を1から引く</div></div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgTree + '</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgDice + '</div>'
    + '<div class="rule-box"><div class="rule-title">「同時に」と「1枚ずつ」</div><div class="ex"><strong style="color:var(--gold)">同時に2枚</strong>（順番なし）：AB と BA は同じ → 6枚から2枚は (6×5)÷2＝15通り<br><strong style="color:var(--teal)">1枚ずつ続けて</strong>（順番あり）：AB と BA は別 → 4枚から3枚は 4×3×2＝24通り<br>同じ文字のカードが2枚あるときは、A①・A② のように<strong>区別して</strong>数える</div></div>'
    + '<div class="note">💡 チェック方法：分子が分母より大きくなったら数え間違い。答えは必ず約分</div>'
    + '</div>';

  var qs = [
    { qid:'math_pd_s1_q0', jp:'さいころを1個投げるとき、3の倍数の目が出る確率は？',
      answer:'1/3', choices:['1/3','1/6','1/2','2/3'],
      exp:'📐 全部6通り。3の倍数は3と6の2通り → 2/6＝<strong style="color:var(--gold)">1/3</strong>' },
    { qid:'math_pd_s1_q1', jp:'2枚の硬貨を同時に投げるとき、2枚とも表になる確率は？',
      answer:'1/4', choices:['1/4','1/2','1/3','3/4'],
      exp:'📐 樹形図：表表・表裏・裏表・裏裏の4通り。表表は1通り → <strong style="color:var(--gold)">1/4</strong><br>⚠️ 「表裏」と「裏表」は別の場合' },
    { qid:'math_pd_s1_q2', jp:'2枚の硬貨を同時に投げるとき、少なくとも1枚は表になる確率は？',
      answer:'3/4', choices:['3/4','1/4','1/2','2/3'],
      exp:'📐 「少なくとも1枚表」＝「2枚とも裏」ではない → 1 − 1/4 ＝ <strong style="color:var(--gold)">3/4</strong><br>💡 「少なくとも」は 1 から引く' },
    { qid:'math_pd_s1_q3', jp:'大小2つのさいころを投げるとき、出た目の和が7になる確率は？',
      answer:'1/6', choices:['1/6','1/9','7/36','1/12'],
      exp:'📐 表の対角線：(1,6)(2,5)(3,4)(4,3)(5,2)(6,1)＝6通り → 6/36＝<strong style="color:var(--gold)">1/6</strong>' },
    { qid:'math_pd_s1_q4', jp:'大小2つのさいころを投げるとき、出た目の積が奇数になる確率は？',
      answer:'1/4', choices:['1/4','1/2','1/3','3/4'],
      exp:'📐 積が奇数＝両方とも奇数（1,3,5）→ 3×3＝9通り → 9/36＝<strong style="color:var(--gold)">1/4</strong>' },
    { qid:'math_pd_s1_q5', jp:'1〜5の数字を書いた5枚のカードから同時に2枚取り出すとき、2枚とも奇数である確率は？',
      answer:'3/10', choices:['3/10','2/5','3/5','1/5'],
      exp:'📐 全部：5枚から2枚（同時）＝(5×4)÷2＝10通り<br>奇数は1,3,5の3枚 → そこから2枚＝(3×2)÷2＝3通り → <strong style="color:var(--gold)">3/10</strong>' },
    { qid:'math_pd_s1_q6', jp:'A、B、Cの3人から委員長と副委員長を1人ずつ選ぶとき、Aが委員長になる確率は？',
      answer:'1/3', choices:['1/3','1/6','1/2','2/3'],
      exp:'📐 順番あり：委員長3通り×副委員長2通り＝6通り。Aが委員長＝副はBかC＝2通り → 2/6＝<strong style="color:var(--gold)">1/3</strong>' },
    { qid:'math_pd_s1_q7', jp:'A、B、Cの3人から2人の代表を選ぶとき、Aが選ばれる確率は？',
      answer:'2/3', choices:['2/3','1/3','1/2','1/6'],
      exp:'📐 順番なし：AB・AC・BCの3通り。Aが入るのはAB・ACの2通り → <strong style="color:var(--gold)">2/3</strong><br>💡 「委員長と副委員長」（順番あり）との違いに注意' },
    { qid:'math_pd_s1_q8', jp:'赤玉2個、白玉3個が入った袋から1個取り出すとき、赤玉である確率は？',
      answer:'2/5', choices:['2/5','1/2','2/3','1/5'],
      exp:'📐 全部5個、赤2個 → <strong style="color:var(--gold)">2/5</strong>' },
    { qid:'math_pd_s1_q9', jp:'くじを1本引いて当たる確率が 2/7 のとき、はずれる確率は？',
      answer:'5/7', choices:['5/7','2/7','1/7','7/2'],
      exp:'📐 起こらない確率＝1−2/7＝<strong style="color:var(--gold)">5/7</strong>' },
    { qid:'math_pd_s1_q10', jp:'Aが3枚、Bが2枚、Cが1枚のカード6枚から同時に2枚取り出すとき、2枚の文字が異なる確率は？',
      answer:'11/15', choices:['11/15','4/15','1/2','2/3'],
      exp:'📐 全部15通り。同じ文字：A同士(3×2)÷2＝3通り、B同士1通り → 4/15<br>異なる＝1−4/15＝<strong style="color:var(--gold)">11/15</strong>。R7の入試' },
    { qid:'math_pd_s1_q11', type:'input', jp:'1、2、3、4の4枚のカードから1枚ずつ続けて2枚取り出し、順に十の位・一の位として2けたの整数をつくる。整数は全部で何通りできる？（数字だけ）', formula:'順番あり：1枚目×2枚目', answer:'12', xp:5, hint:'4×3',
      exp:'✅ 1枚目4通り×2枚目3通り＝<strong>12</strong>通り' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 2: データの整理 =====
function renderSection2(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🎲 きょん＆西村の会話</div>'
    + chat('kyon','きょん','平均値と中央値って何が違うの？どっちも真ん中でしょ？')
    + chat('nishi','西村真二（慶應卒・元アナ）','平均値は「合計÷個数」。中央値は「小さい順に並べたときの真ん中の値」。1人だけ100点で他が0点なら、平均は上がるけど中央値は0のまま。だから入試では「どちらが適切か」も問われる。')
    + chat('kyon','きょん','最頻値は？')
    + chat('nishi','西村','一番多く出てくる値。度数分布表なら、度数が一番大きい階級の「階級値（真ん中の値）」だ。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 データの整理のルール</div>'
    + '<div class="rule-box"><div class="rule-title">代表値（3つ）</div><div class="ex"><strong style="color:var(--gold)">平均値</strong>＝合計÷個数<br><strong style="color:var(--gold)">中央値</strong>＝小さい順に並べて真ん中。個数が偶数なら真ん中2つの平均<br><strong style="color:var(--gold)">最頻値</strong>＝いちばん多く出る値（度数分布表では度数最大の階級の階級値）<br><strong>範囲</strong>＝最大値−最小値</div></div>'
    + '<div class="rule-box"><div class="rule-title">度数分布表のことば</div><div class="ex"><strong>階級</strong>＝区間（例：20以上30未満）　<strong>階級値</strong>＝区間の真ん中（25）　<strong>度数</strong>＝その区間の個数<br><strong>相対度数</strong>＝度数÷全体（例：6÷20＝0.30）　<strong>累積度数</strong>＝その階級までの度数の合計<br>ヒストグラム＝度数分布表を柱のグラフにしたもの</div></div>'
    + '<div class="note">💡 「以上」は含む、「未満」は含まない。20以上30未満に「30」は入らない</div>'
    + '</div>';

  var D = '3, 5, 5, 6, 7, 7, 7, 8, 9, 10';
  var qs = [
    { qid:'math_pd_s2_q0', jp:'10人の小テストの得点（点）：' + dataBox(D) + '平均値は？',
      answer:'6.7点', choices:['6.7点','7点','6.5点','7.5点'],
      exp:'📐 合計＝3+5+5+6+7+7+7+8+9+10＝67 → 67÷10＝<strong style="color:var(--gold)">6.7</strong>点' },
    { qid:'math_pd_s2_q1', jp:'同じデータ：' + dataBox(D) + '中央値は？',
      answer:'7点', choices:['7点','6.7点','6.5点','5点'],
      exp:'📐 10個（偶数）→ 5番目と6番目の平均。並べると5番目＝7、6番目＝7 → <strong style="color:var(--gold)">7</strong>点' },
    { qid:'math_pd_s2_q2', jp:'同じデータ：' + dataBox(D) + '最頻値は？',
      answer:'7点', choices:['7点','5点','10点','3点'],
      exp:'📐 7が3回でいちばん多い → <strong style="color:var(--gold)">7</strong>点' },
    { qid:'math_pd_s2_q3', type:'input', jp:'同じデータ：' + dataBox(D) + '範囲（レンジ）は何点？（数字だけ）', formula:'最大値 − 最小値', answer:'7', xp:5, hint:'10−3',
      exp:'✅ 10−3＝<strong>7</strong>点' },
    { qid:'math_pd_s2_q4', jp:'度数分布表で「20分以上30分未満」の階級の階級値は？',
      answer:'25分', choices:['25分','20分','30分','10分'],
      exp:'📐 階級値＝区間の真ん中＝(20+30)÷2＝<strong style="color:var(--gold)">25</strong>分' },
    { qid:'math_pd_s2_q5', jp:'全体40人のうち、ある階級の度数が6人のとき、この階級の相対度数は？',
      answer:'0.15', choices:['0.15','0.6','6','0.40'],
      exp:'📐 相対度数＝6÷40＝<strong style="color:var(--gold)">0.15</strong><br>💡 相対度数は全部足すと1になる' },
    { qid:'math_pd_s2_q6', jp:'度数分布表の度数が「0〜10：2人、10〜20：5人、20〜30：8人、30〜40：5人」のとき、最頻値は？',
      answer:'25', choices:['25','8','20','30'],
      exp:'📐 度数最大は20〜30の8人 → その階級値＝<strong style="color:var(--gold)">25</strong><br>⚠️ 度数の「8」ではなく階級値を答える' },
    { qid:'math_pd_s2_q7', jp:'同じ度数分布表（0〜10：2人、10〜20：5人、20〜30：8人、30〜40：5人）で、20未満の累積度数は？',
      answer:'7人', choices:['7人','5人','15人','2人'],
      exp:'📐 0〜10の2人＋10〜20の5人＝<strong style="color:var(--gold)">7</strong>人' },
    { qid:'math_pd_s2_q8', jp:'5人の得点が 10, 20, 30, 40, 100 のとき、平均値と中央値の関係として正しいものは？',
      answer:'平均値40、中央値30で、100点の人がいるため平均値の方が大きい', choices:['平均値40、中央値30で、100点の人がいるため平均値の方が大きい','平均値30、中央値40','平均値と中央値は等しい','中央値の方が大きい'],
      exp:'📐 平均＝200÷5＝40。中央値＝3番目＝30<br>💡 極端に大きい値があると平均値は引っぱられる。「代表値として中央値が適切」と言われる理由' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 3: 箱ひげ図 =====
function renderSection3(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🎲 きょん＆西村の会話</div>'
    + chat('kyon','きょん','箱ひげ図って、箱から線が出てるやつ？何を表してるの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','データを小さい順に並べて4等分したときの<strong>5つの値</strong>を図にしたもの。左のひげの端が最小値、箱の左が第1四分位数、箱の中の線が中央値、箱の右が第3四分位数、右のひげの端が最大値。')
    + chat('kyon','きょん','箱の中にデータの半分が入ってるってこと？')
    + chat('nishi','西村','そう。箱の長さ＝四分位範囲。箱が短い＝データが真ん中に集まっている。入試では「ヒストグラムに合う箱ひげ図はどれか」「どの分野の得点か」を読み取らせる。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 四分位数と箱ひげ図のルール</div>'
    + '<div class="rule-box"><div class="rule-title">四分位数の求め方（3ステップ）</div><div class="ex">① 小さい順に並べる → ② 中央値で前半と後半に分ける（奇数個なら真ん中の値はどちらにも入れない）→ ③ 前半の中央値＝<strong>第1四分位数</strong>、後半の中央値＝<strong>第3四分位数</strong><br>例：2, 3, 5, 6, 8, 9, 11, 12, 15（9個）→ 中央値8 → 前半 2,3,5,6 の中央＝4 → 後半 9,11,12,15 の中央＝11.5<br><strong>四分位範囲</strong>＝11.5−4＝7.5　<strong>範囲</strong>＝15−2＝13</div></div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgBoxPlot(20, 40, 50, 60, 90, '例：最小20・第1四分位数40・中央値50・第3四分位数60・最大90') + '</div>'
    + '<div class="rule-box"><div class="rule-title">箱ひげ図から読めること・読めないこと</div><div class="ex">✅ 最小値・最大値・中央値・四分位数・四分位範囲・範囲<br>✅ 「全体の約半分（50%）が箱の中」「約25%が各ひげの中」<br>❌ <strong>平均値</strong>はわからない　❌ 人数（度数）はわからない</div></div>'
    + '<div class="rule-box"><div class="rule-title">ヒストグラムから箱ひげ図を選ぶとき</div><div class="ex">40人なら：中央値＝20・21番目、第1四分位数＝10・11番目、第3四分位数＝30・31番目。度数を左から累計して「何番目がどの階級か」を探す</div></div>'
    + '</div>';

  var D9 = '2, 3, 5, 6, 8, 9, 11, 12, 15';
  var qs = [
    { qid:'math_pd_s3_q0', jp:'9個のデータ：' + dataBox(D9) + '中央値は？',
      answer:'8', choices:['8','7.5','9','6'],
      exp:'📐 9個（奇数）→ 5番目＝<strong style="color:var(--gold)">8</strong>' },
    { qid:'math_pd_s3_q1', jp:'同じ9個のデータ：' + dataBox(D9) + '第1四分位数は？',
      answer:'4', choices:['4','3','5','4.5'],
      exp:'📐 前半 2, 3, 5, 6（中央値8は入れない）→ 中央＝(3+5)÷2＝<strong style="color:var(--gold)">4</strong>' },
    { qid:'math_pd_s3_q2', jp:'同じ9個のデータ：' + dataBox(D9) + '第3四分位数は？',
      answer:'11.5', choices:['11.5','11','12','10'],
      exp:'📐 後半 9, 11, 12, 15 → 中央＝(11+12)÷2＝<strong style="color:var(--gold)">11.5</strong>' },
    { qid:'math_pd_s3_q3', type:'input', jp:'同じ9個のデータ：' + dataBox(D9) + '四分位範囲は？（数字だけ）', formula:'第3四分位数 − 第1四分位数', answer:'7.5', xp:6, hint:'11.5−4',
      exp:'✅ 11.5−4＝<strong>7.5</strong><br>💡 範囲（15−2＝13）と混同しない' },
    { qid:'math_pd_s3_q4', jp:'次の箱ひげ図で、四分位範囲は？' + svgBoxPlot(10, 20, 30, 45, 60, '', '#0ea5e9'),
      answer:'25', choices:['25','50','30','20'],
      exp:'📐 箱の左（第1四分位数）20、箱の右（第3四分位数）45 → 45−20＝<strong style="color:var(--gold)">25</strong>' },
    { qid:'math_pd_s3_q5', jp:'同じ箱ひげ図（最小10・第1四分位数20・中央値30・第3四分位数45・最大60）から読み取れることとして<strong style="color:var(--red)">正しくないもの</strong>は？',
      answer:'平均値は30である', choices:['平均値は30である','データの約半分は20以上45以下にある','範囲は50である','中央値は30である'],
      exp:'📐 箱ひげ図から<strong>平均値はわからない</strong>。箱の中の線は中央値<br>✅ 範囲＝60−10＝50、約半分が箱（20〜45）の中' },
    { qid:'math_pd_s3_q6', jp:'A組とB組の得点の箱ひげ図。四分位範囲が大きいのはどちら？' + svgBoxPlot(20, 40, 50, 60, 90, 'A組', '#a371f7') + svgBoxPlot(30, 45, 55, 80, 85, 'B組', '#0ea5e9'),
      answer:'B組（35）', choices:['B組（35）','A組（20）','同じ','箱ひげ図からはわからない'],
      exp:'📐 A組：60−40＝20　B組：80−45＝35 → <strong style="color:var(--gold)">B組</strong>の方が箱が長い＝真ん中の半分のばらつきが大きい' },
    { qid:'math_pd_s3_q7', jp:'同じ2つの箱ひげ図（A組：最小20・Q1 40・中央50・Q3 60・最大90／B組：最小30・Q1 45・中央55・Q3 80・最大85）について正しいものは？',
      answer:'中央値はB組の方が大きい', choices:['中央値はB組の方が大きい','最大値はB組の方が大きい','範囲はB組の方が大きい','A組の平均値は50である'],
      exp:'📐 中央値 A50＜B55 ○。最大値 A90＞B85 ×。範囲 A70＞B55 ×。平均値は読めない ×' },
    { qid:'math_pd_s3_q8', jp:'40人の記録のヒストグラムで、度数が「5〜10m：1人、10〜15m：4人、15〜20m：5人、20〜25m：5人、25〜30m：10人、30〜35m：8人、35〜40m：4人、40〜45m：2人、45〜50m：1人」のとき、中央値はどの階級にある？',
      answer:'25m以上30m未満', choices:['25m以上30m未満','20m以上25m未満','30m以上35m未満','15m以上20m未満'],
      exp:'📐 40人→中央値は20番目と21番目の平均。累計：1,5,10,15,<strong>25</strong>… → 20・21番目は25〜30mの階級 → <strong style="color:var(--gold)">25m以上30m未満</strong><br>💡 R6 (9) はこの数え方で正しい箱ひげ図を選ぶ' },
    { qid:'math_pd_s3_q9', jp:'同じヒストグラム（40人）で、第3四分位数はどの階級にある？',
      answer:'30m以上35m未満', choices:['30m以上35m未満','25m以上30m未満','35m以上40m未満','40m以上45m未満'],
      exp:'📐 第3四分位数＝後半20人の中央＝30番目と31番目。累計：…15, 25, <strong>33</strong> → 30・31番目は30〜35mの階級' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 4: 標本調査 =====
function renderSection4(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🎲 きょん＆西村の会話</div>'
    + chat('kyon','きょん','キャベツ8000個の重さを全部量るの？大変すぎない？')
    + chat('nishi','西村真二（慶應卒・元アナ）','だから<strong>一部だけ調べて全体を推定</strong>する。それが標本調査。50個調べて9個が条件に合えば、8000個なら 8000×9/50＝1440個くらいだろう、と考える。')
    + chat('kyon','きょん','比例式だ！！これなら得意！')
    + chat('nishi','西村','大事なのは「偏りなく選ぶ」こと。無作為抽出という。くじや乱数を使う。「先頭から50個」は偏るからダメ。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 標本調査のルール</div>'
    + '<div class="rule-box"><div class="rule-title">ことば</div><div class="ex"><strong>全数調査</strong>＝全部調べる（国勢調査、学校の健康診断）<br><strong>標本調査</strong>＝一部を調べて全体を推定（テレビの視聴率、製品の検査、川の水質）<br><strong>母集団</strong>＝調べたい全体　<strong>標本</strong>＝取り出した一部　<strong>無作為抽出</strong>＝偏りなく選ぶ（くじ・乱数さいころ・乱数表）</div></div>'
    + '<div class="rule-box"><div class="rule-title">推定＝比例式</div><div class="ex">標本の割合＝母集団の割合 と考える<br>50個中9個 → 8000個中 x 個：50：9＝8000：x → x＝8000×9÷50＝<strong style="color:var(--gold)">1440</strong><br>池の魚：50匹に印をつけて放し、あとで60匹つかまえたら印つきが12匹 → 全体x匹：x：50＝60：12 → x＝250</div></div>'
    + '<div class="note">💡 「およそ」がつく＝推定。ぴったりの数ではない</div>'
    + '</div>';

  var qs = [
    { qid:'math_pd_s4_q0', jp:'次のうち、全数調査が適しているものは？',
      answer:'国勢調査', choices:['国勢調査','テレビ番組の視聴率調査','電球の寿命の検査','川の水質調査'],
      exp:'📐 国勢調査は全国民を調べる<strong>全数調査</strong>。他は一部を調べる標本調査（電球は全部調べたら売る物がなくなる）' },
    { qid:'math_pd_s4_q1', jp:'標本の選び方として適切なものは？',
      answer:'くじや乱数を使って偏りなく選ぶ', choices:['くじや乱数を使って偏りなく選ぶ','名簿の先頭から順に選ぶ','協力してくれる人だけ選ぶ','一番近くにあるものを選ぶ'],
      exp:'📐 <strong>無作為抽出</strong>＝どれも同じ確率で選ばれるようにする。先頭から・近くから・協力者だけ は偏る' },
    { qid:'math_pd_s4_q2', jp:'ある工場の製品500個から20個を無作為に取り出して調べたら、不良品が3個あった。500個の中の不良品はおよそ何個と推定される？',
      answer:'およそ75個', choices:['およそ75個','およそ3個','およそ150個','およそ25個'],
      exp:'📐 20：3＝500：x → x＝500×3÷20＝<strong style="color:var(--gold)">75</strong>個' },
    { qid:'math_pd_s4_q3', type:'input', jp:'池の魚50匹に印をつけて放した。後日60匹つかまえたら印のついた魚が12匹いた。池の魚は全部でおよそ何匹？（数字だけ）', formula:'全体 x：印50 ＝ 60：12', answer:'250', xp:7, hint:'12/60＝1/5 が印つき → 50匹が全体の1/5',
      exp:'✅ x：50＝60：12 → 12x＝3000 → x＝<strong>250</strong>匹' },
    { qid:'math_pd_s4_q4', jp:'キャベツ8000個から無作為に50個を抽出し、0.7kg以上1.3kg未満が9個だった。8000個のうち0.7kg以上1.3kg未満はおよそ何個？',
      answer:'およそ1440個', choices:['およそ1440個','およそ640個','およそ800個','およそ5600個'],
      exp:'📐 8000×9÷50＝<strong style="color:var(--gold)">1440</strong>。R7の入試' },
    { qid:'math_pd_s4_q5', jp:'この問題で「8000個のキャベツ」と「取り出した50個」をそれぞれ何という？',
      answer:'母集団と標本', choices:['母集団と標本','標本と母集団','全数と一部','度数と階級'],
      exp:'📐 調べたい全体＝<strong>母集団</strong>（8000個）、取り出した一部＝<strong>標本</strong>（50個）' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 5: 確認テスト =====
function renderSection5(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 確認テスト — 確率・データ 総まとめ</div>'
    + '<div class="rule-box"><div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + '確率・度数分布・箱ひげ図・標本調査から <strong style="color:var(--gold)">20問</strong>！<br>'
    + 'きょん「数える・並べる・比例式！！」<br>'
    + '西村「同時か順番か。平均か中央値か。設問を読め」'
    + '</div></div></div>';

  var D8 = '4, 5, 7, 8, 10, 12, 13, 21';
  var qs = [
    { qid:'math_pd_s5_q0', jp:'さいころを1個投げるとき、4以下の目が出る確率は？', answer:'2/3', choices:['2/3','1/3','1/2','4/5'], exp:'📐 1,2,3,4の4通り → 4/6＝<strong style="color:var(--gold)">2/3</strong>' },
    { qid:'math_pd_s5_q1', jp:'3枚の硬貨を同時に投げるとき、3枚とも表になる確率は？', answer:'1/8', choices:['1/8','1/6','1/3','3/8'], exp:'📐 2×2×2＝8通り、全部表は1通り → <strong style="color:var(--gold)">1/8</strong>' },
    { qid:'math_pd_s5_q2', jp:'3枚の硬貨を同時に投げるとき、少なくとも1枚は裏になる確率は？', answer:'7/8', choices:['7/8','1/8','1/2','3/8'], exp:'📐 1−（全部表 1/8）＝<strong style="color:var(--gold)">7/8</strong>' },
    { qid:'math_pd_s5_q3', jp:'大小2つのさいころを投げるとき、出た目の和が4になる確率は？', answer:'1/12', choices:['1/12','1/9','1/6','1/18'], exp:'📐 (1,3)(2,2)(3,1)＝3通り → 3/36＝<strong style="color:var(--gold)">1/12</strong>' },
    { qid:'math_pd_s5_q4', jp:'大小2つのさいころを投げるとき、出た目が同じになる確率は？', answer:'1/6', choices:['1/6','1/36','1/3','1/2'], exp:'📐 (1,1)〜(6,6)の6通り → 6/36＝<strong style="color:var(--gold)">1/6</strong>' },
    { qid:'math_pd_s5_q5', jp:'1〜6のカード6枚から同時に2枚取り出すとき、取り出し方は全部で何通り？', answer:'15通り', choices:['15通り','30通り','36通り','12通り'], exp:'📐 (6×5)÷2＝<strong style="color:var(--gold)">15</strong>通り（同時＝順番なし）' },
    { qid:'math_pd_s5_q6', jp:'1〜6のカード6枚から同時に2枚取り出すとき、2枚の和が7になる確率は？', answer:'1/5', choices:['1/5','1/6','1/3','2/15'], exp:'📐 15通りのうち (1,6)(2,5)(3,4)＝3通り → 3/15＝<strong style="color:var(--gold)">1/5</strong>' },
    { qid:'math_pd_s5_q7', jp:'1が2枚、2が1枚、3が1枚の4枚から1枚ずつ続けて3枚取り出して3けたの整数をつくるとき、全部で何通り？', answer:'24通り', choices:['24通り','12通り','6通り','64通り'], exp:'📐 2枚の1を区別して 4×3×2＝<strong style="color:var(--gold)">24</strong>通り。R5の入試の前半' },
    { qid:'math_pd_s5_q8', jp:'8個のデータ：' + dataBox(D8) + '中央値は？', answer:'9', choices:['9','8','10','10.5'], exp:'📐 8個→4番目8と5番目10の平均＝<strong style="color:var(--gold)">9</strong>' },
    { qid:'math_pd_s5_q9', jp:'同じ8個のデータ：' + dataBox(D8) + '第1四分位数は？', answer:'6', choices:['6','5','7','5.5'], exp:'📐 前半 4,5,7,8 の中央＝(5+7)÷2＝<strong style="color:var(--gold)">6</strong>' },
    { qid:'math_pd_s5_q10', jp:'同じ8個のデータ：' + dataBox(D8) + '第3四分位数は？', answer:'12.5', choices:['12.5','12','13','11'], exp:'📐 後半 10,12,13,21 の中央＝(12+13)÷2＝<strong style="color:var(--gold)">12.5</strong>' },
    { qid:'math_pd_s5_q11', type:'input', jp:'同じ8個のデータ：' + dataBox(D8) + '四分位範囲は？（数字だけ）', formula:'第3四分位数 − 第1四分位数', answer:'6.5', xp:6, hint:'12.5−6', exp:'✅ 12.5−6＝<strong>6.5</strong>' },
    { qid:'math_pd_s5_q12', jp:'同じ8個のデータ：' + dataBox(D8) + '平均値は？', answer:'10', choices:['10','9','12','8'], exp:'📐 合計80÷8＝<strong style="color:var(--gold)">10</strong>' },
    { qid:'math_pd_s5_q13', jp:'箱ひげ図から読み取れないものは？', answer:'平均値', choices:['平均値','中央値','最大値','四分位範囲'], exp:'📐 箱ひげ図の5つの値に<strong>平均値</strong>は含まれない' },
    { qid:'math_pd_s5_q14', jp:'箱ひげ図の「箱」の中には、データ全体のおよそ何%が入っている？', answer:'約50%', choices:['約50%','約25%','約75%','約100%'], exp:'📐 第1四分位数〜第3四分位数＝真ん中の<strong style="color:var(--gold)">約半分</strong>' },
    { qid:'math_pd_s5_q15', jp:'全体50人で、ある階級の度数が8人のとき相対度数は？', answer:'0.16', choices:['0.16','0.8','8','0.42'], exp:'📐 8÷50＝<strong style="color:var(--gold)">0.16</strong>' },
    { qid:'math_pd_s5_q16', jp:'度数分布表「0〜5：3人、5〜10：7人、10〜15：6人、15〜20：4人」の最頻値は？', answer:'7.5', choices:['7.5','7','10','5'], exp:'📐 度数最大は5〜10の7人 → 階級値＝<strong style="color:var(--gold)">7.5</strong>' },
    { qid:'math_pd_s5_q17', jp:'次のうち標本調査が適しているものは？', answer:'テレビ番組の視聴率', choices:['テレビ番組の視聴率','学校の健康診断','国勢調査','クラスの出席確認'], exp:'📐 全世帯を調べるのは不可能 → 一部を調べて推定する<strong>標本調査</strong>' },
    { qid:'math_pd_s5_q18', jp:'袋の中の白玉の数を推定するため、黒玉を40個入れてよく混ぜ、30個取り出したら黒玉が6個だった。もとの白玉はおよそ何個？', answer:'およそ160個', choices:['およそ160個','およそ200個','およそ120個','およそ240個'], exp:'📐 黒の割合 6/30＝1/5 → 全体は40×5＝200個 → 白玉＝200−40＝<strong style="color:var(--gold)">160</strong>個<br>⚠️ 「白玉」を答える（全体200ではない）' },
    { qid:'math_pd_s5_q19', jp:'1200個の製品から60個を無作為に取り出したら不良品が2個あった。1200個の中の不良品はおよそ何個？', answer:'およそ40個', choices:['およそ40個','およそ20個','およそ60個','およそ2個'], exp:'📐 1200×2÷60＝<strong style="color:var(--gold)">40</strong>個' },
  ];
  html += renderQs(qs);
  return html;
}

function showFinalResult(){
  var s5qids = Object.keys(qMeta).filter(function(id){ return id.indexOf(QID_PREFIX + 's5_') === 0; });
  var total = s5qids.length || 20;
  var correct = s5qids.filter(function(id){ var d = weakDB[id]; return d && d.correct > 0; }).length;
  var pct = Math.round(correct / total * 100);
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '🎭' : '🥚';
  var msg = pct >= 90 ? 'きょん「確率もデータも完璧！！神経衰弱王の実力！！」<br>西村「文句なし。入試の(8)(9)は取れる」'
          : pct >= 70 ? 'きょん「だいぶ数えられるようになった！！」<br>西村「あと少し。間違えた型だけ特訓で潰そう」'
          : pct >= 50 ? 'きょん「半分は取れた…！」<br>西村「弱点ノートで、確率かデータかどちらが弱いか見よう」'
          : 'きょん「数え漏れが多い…」<br>西村「大丈夫。表と樹形図を書く癖をつけよう。特訓モードで反復」';
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

// ===== 弱点ノート =====
function renderWeakNote(){
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf(QID_PREFIX) === 0; });
  var wqs = getWeakQuestions();
  var html = '<div class="section-header"><div class="section-badge">数学 確率・データ · 弱点ノート</div><div class="section-title">弱点ノート</div><div class="section-sub">間違えた問題を確認しよう</div></div>';
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
  var gb = document.getElementById('go_tokku_btn'); if(gb) gb.addEventListener('click', function(){ goSection(7); });
}

// ===== 特訓モード =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };
function renderTokkuMode(){
  var wqs = getWeakQuestions();
  var html = '<div class="section-header"><div class="section-badge" style="background:var(--red)">数学 確率・データ · 特訓</div><div class="section-title">弱点特訓モード</div><div class="section-sub">弱点問題を集中練習！</div></div>';
  if(wqs.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-size:16px;line-height:2">弱点なし！<br>きょん「確率マスター！！」</div></div>';
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
    + (pctAll >= 80 ? 'きょん「数え方、固まってきた！！」' : 'きょん「まだ数え漏れがある…もう一回！！」') + '</div>'
    + '<button id="tokkuAgain" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer">🔥 もう一度特訓</button>'
    + '</div>';
  document.getElementById('tokkuAgain').addEventListener('click', function(){ renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
renderSection(0);
