// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「地層？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「凝灰岩は火山、覚えた」' },
  { lv:3, min:40,  max:80, badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺、柱状図読めるかも」' },
  { lv:4, min:80, max:140, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',    title:'課長',          status:'きょん「南中高度、にっくんより速く計算できるかも」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',        title:'部長',          status:'きょん「天体で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('sci_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('sci_earth_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('sci_earth_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('sci_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;
var QID_PREFIX = 'sci_earth_';

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
  localStorage.setItem('sci_xp', xp);
  localStorage.setItem('sci_earth_answered', JSON.stringify(answeredSet));
  updateXP(); return getLevel(xp).lv > old;
}
function deductXP(pts){
  var old = getLevel(xp).lv; xp = Math.max(0, xp - pts);
  localStorage.setItem('sci_xp', xp); updateXP(); return getLevel(xp).lv < old;
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
    return '<div class="weak-item"><span class="weak-item-word">' + (d.short || d.jp || qid) + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect){
  if(!weakDB[qid]) weakDB[qid] = { jp:(qMeta[qid]&&qMeta[qid].jp)||'', short:(qMeta[qid]&&qMeta[qid].short)||'', answer:(qMeta[qid]&&qMeta[qid].answer)||'', choices:(qMeta[qid]&&qMeta[qid].choices)||[], correct:0, total:0 };
  weakDB[qid].total++; if(isCorrect) weakDB[qid].correct++;
  localStorage.setItem('sci_weakdb', JSON.stringify(weakDB));
  var _t = new Date().toISOString().slice(0,10);
  var _d = JSON.parse(localStorage.getItem('sci_daily') || '{}');
  _d[_t] = (_d[_t] || 0) + 1; localStorage.setItem('sci_daily', JSON.stringify(_d));
  localStorage.setItem('sci_earth_lastStudy', _t);
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
  correct: ['きょん「合ってる！！地層、読めた！！」', 'きょん「やった！！星の動き、わかった！！」', 'きょん「にっくん見て！解けた！！」'],
  nishi:   ['西村「正解。図が読めてる」', '西村「できてる。その調子」', '西村「しくみがわかってる証拠だ」']
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
function tbl(head, rows){
  var h = '<div style="overflow-x:auto;margin:6px 0 10px"><table style="border-collapse:collapse;font-size:13px;min-width:260px">';
  h += '<tr>' + head.map(function(c){ return '<th style="border:1px solid var(--border);padding:4px 8px;background:var(--bg3);color:var(--text2);font-weight:normal;white-space:nowrap">' + c + '</th>'; }).join('') + '</tr>';
  rows.forEach(function(r){ h += '<tr>' + r.map(function(c){ return '<td style="border:1px solid var(--border);padding:4px 8px;text-align:center;white-space:nowrap">' + c + '</td>'; }).join('') + '</tr>'; });
  return h + '</table></div>';
}

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
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度！</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + '<div class="exp-card-title">🌏 解説</div><div style="color:var(--text);font-size:13px;line-height:2.1">' + exp + '</div></div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '"><div class="ans-label">✅ 正解</div><div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">' + (done?getComment('nishi'):'') + '</div>'
    + '</div>';
}
function makeInputCard(qid, jp, formula, answer, xpPts, hint, expText, short){
  qMeta[qid] = { type:'input', answer:answer, xp:xpPts, jp:jp, short:short || '' };
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
    + '<div class="exp-card-title">🌏 解説</div><div style="color:var(--text);font-size:13px;line-height:2.2">' + expText + '</div></div>'
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
  else { var msgs = ['きょん「あれ！間違えた！図をもう一回見る！！」','きょん「また間違えた…！標高から引き算！！」','きょん「ルールカードを見直す！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('sci_earth_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var inp = document.getElementById('inp_' + qid); if(inp){ inp.disabled = true; inp.value = meta.answer; var sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if(sb) sb.style.display = 'none'; }
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で解く！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。図のどこを見たか確認しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = QID_PREFIX + 's' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('sci_earth_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if(nb && nb.style.display === 'none'){
      nb.style.display = 'block';
      if(!document.getElementById('secCompleteBanner')){
        var banner = document.createElement('div'); banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 4 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '結果を見よう！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(14,165,233,0.12),rgba(163,113,247,0.08));border:1px solid var(--teal);border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--teal);letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
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
  { id:0, label:'🌏 スタート',  title:'大地と宇宙は「図を読む」単元', sub:'柱状図・南中高度・星の動き——3年連続出題なのにページが無かった' },
  { id:1, label:'地層',         title:'地層と岩石',               sub:'堆積岩の見分け・化石・柱状図と標高・かぎ層' },
  { id:2, label:'火山・地震',   title:'火山と地震',               sub:'火成岩の組織・マグマの性質・P波S波・震度とマグニチュード' },
  { id:3, label:'天体',         title:'地球と宇宙',               sub:'日周運動・年周運動・南中高度・季節・月と金星' },
  { id:4, label:'確認テスト',   title:'確認テスト',               sub:'入試形式20問' },
  { id:5, label:'📊弱点',       title:'弱点ノート',               sub:'間違えた問題を確認' },
  { id:6, label:'🔥特訓',       title:'弱点特訓モード',           sub:'弱点問題を集中練習！' },
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
    + '<div class="section-badge">理科 大地と宇宙 · SECTION ' + id + '</div>'
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
    if(q.type === 'input') html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp, q.short);
    else html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp, q.short);
    n++;
  });
  return html;
}

// ===== SVG =====
// 柱状図（R7 5 地点C・F）
function svgColumn(x, label, layers){
  var s = '<text x="' + (x + 30) + '" y="14" fill="#e6edf3" font-size="10" text-anchor="middle">' + label + '</text>';
  var colors = { '砂岩':'rgba(245,197,24,0.25)', 'れき岩':'rgba(233,69,96,0.25)', '泥岩':'rgba(139,148,158,0.35)', '凝灰岩':'rgba(14,165,233,0.35)', '石灰岩':'rgba(63,185,80,0.3)' };
  layers.forEach(function(l){
    var y0 = 20 + l[0] * 5, h = (l[1] - l[0]) * 5;
    s += '<rect x="' + x + '" y="' + y0 + '" width="60" height="' + h + '" fill="' + (colors[l[2]] || '#333') + '" stroke="#8b949e" stroke-width="0.8"/>';
    if(h >= 10) s += '<text x="' + (x + 30) + '" y="' + (y0 + h/2 + 3) + '" fill="#e6edf3" font-size="8" text-anchor="middle">' + l[2] + '</text>';
  });
  return s;
}
var svgStrata = '<svg viewBox="0 0 320 150" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="8" y="14" fill="#8b949e" font-size="8">深さ(m)</text>'
  + [0,4,8,12,16,20,24].map(function(d){ return '<text x="30" y="' + (20 + d*5 + 3) + '" fill="#8b949e" font-size="8" text-anchor="end">' + d + '</text><line x1="34" y1="' + (20 + d*5) + '" x2="300" y2="' + (20 + d*5) + '" stroke="#30363d" stroke-dasharray="2,2"/>'; }).join('')
  + svgColumn(60, '地点C（標高64m）', [[0,4,'砂岩'],[4,8,'れき岩'],[8,10,'凝灰岩'],[10,12,'泥岩'],[12,16,'砂岩'],[16,18,'れき岩'],[18,20,'砂岩'],[20,24,'石灰岩']])
  + svgColumn(190, '地点F（標高70m）', [[0,2,'砂岩'],[2,6,'石灰岩'],[6,12,'泥岩'],[12,16,'砂岩'],[16,20,'れき岩'],[20,22,'凝灰岩'],[22,24,'泥岩']])
  + '<text x="160" y="146" fill="#0ea5e9" font-size="9" text-anchor="middle">凝灰岩（火山灰）は1回の噴火→1枚だけ→かぎ層</text>'
  + '</svg>';

var svgNanchu = '<svg viewBox="0 0 320 150" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【南中高度：北緯35°の場合】</text>'
  + '<line x1="20" y1="120" x2="300" y2="120" stroke="#8b949e" stroke-width="1.5"/>'
  + '<text x="24" y="134" fill="#8b949e" font-size="9">南</text><text x="288" y="134" fill="#8b949e" font-size="9">北</text>'
  + '<circle cx="160" cy="120" r="3" fill="#e6edf3"/><text x="160" y="134" fill="#e6edf3" font-size="8" text-anchor="middle">観測者</text>'
  + '<line x1="160" y1="120" x2="70" y2="45" stroke="#e94560" stroke-width="2"/><circle cx="70" cy="45" r="7" fill="#e94560"/><text x="40" y="40" fill="#e94560" font-size="9">夏至 78.4°</text>'
  + '<line x1="160" y1="120" x2="60" y2="70" stroke="#f5c518" stroke-width="2"/><circle cx="60" cy="70" r="7" fill="#f5c518"/><text x="22" y="74" fill="#f5c518" font-size="9">春分・秋分 55°</text>'
  + '<line x1="160" y1="120" x2="70" y2="95" stroke="#0ea5e9" stroke-width="2"/><circle cx="70" cy="95" r="7" fill="#0ea5e9"/><text x="40" y="112" fill="#0ea5e9" font-size="9">冬至 31.6°</text>'
  + '<text x="200" y="50" fill="#e6edf3" font-size="10">春分・秋分：90−緯度</text>'
  + '<text x="200" y="68" fill="#e6edf3" font-size="10">夏至：90−緯度＋23.4</text>'
  + '<text x="200" y="86" fill="#e6edf3" font-size="10">冬至：90−緯度−23.4</text>'
  + '<text x="200" y="106" fill="#8b949e" font-size="9">23.4°＝地軸の傾き</text>'
  + '</svg>';

var svgStar = '<svg viewBox="0 0 320 140" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【星の動き：日周運動と年周運動】</text>'
  + '<text x="8" y="34" fill="#f5c518" font-size="10" font-weight="bold">東の空</text>'
  + '<line x1="20" y1="110" x2="90" y2="40" stroke="#f5c518" stroke-width="1.5"/><polygon points="90,40 82,44 88,50" fill="#f5c518"/>'
  + '<text x="20" y="126" fill="#8b949e" font-size="8">右上へのぼる</text>'
  + '<text x="118" y="34" fill="#f5c518" font-size="10" font-weight="bold">南の空</text>'
  + '<path d="M110,110 Q160,30 210,110" fill="none" stroke="#f5c518" stroke-width="1.5"/><polygon points="210,110 203,104 209,100" fill="#f5c518"/>'
  + '<text x="128" y="126" fill="#8b949e" font-size="8">東→西へ（左→右）</text>'
  + '<text x="240" y="34" fill="#f5c518" font-size="10" font-weight="bold">北の空</text>'
  + '<circle cx="275" cy="80" r="26" fill="none" stroke="#f5c518" stroke-width="1.5" stroke-dasharray="4,2"/><circle cx="275" cy="80" r="2.5" fill="#e6edf3"/>'
  + '<polygon points="249,80 254,72 258,80" fill="#f5c518"/>'
  + '<text x="240" y="126" fill="#8b949e" font-size="8">北極星を中心に反時計回り</text>'
  + '<text x="160" y="138" fill="#0ea5e9" font-size="9" text-anchor="middle">1時間で15°（日周・地球の自転）　1か月で30°（年周・地球の公転）</text>'
  + '</svg>';

// ===== SECTION 0 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">🌏 きょん＆西村の会話</div>'
    + chat('kyon','きょん（富士田恭兵）','地層とか天体って、暗記することが多くて後回しにしてた…')
    + chat('nishi','西村真二（慶應卒・元アナ）','愛知県の入試では、地学分野が3年連続で出ている。R7は地層の柱状図と太陽電池の角度、R6は前線と湿度、R5は天気と地震。しかも「図を読む」問題ばかりで、暗記は最低限でいい。')
    + chat('kyon','きょん','図を読む？計算じゃなくて？')
    + chat('nishi','西村','柱状図なら「標高から深さを引く」だけ。南中高度なら「90−緯度」の足し引きだけ。天体なら「1時間15°、1か月30°」の2つの数字だけ。ルールが少なくて、パターンが決まっている。きょん向きだ。')
    + chat('kyon','きょん','ルールが少ない！それなら覚えられる！！')
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">🌏 この単元の3つの部屋と入試での出方</div>'
    + '<div class="rule-box"><div class="rule-title">① 地層と岩石 → Section 1</div><div class="ex">堆積岩の見分け（粒の大きさ・塩酸で泡）・化石（示相／示準）・柱状図と標高・かぎ層（凝灰岩）</div><div class="note">入試：R7 5 地点A〜Hの標高と柱状図（凝灰岩を基準に傾きを読む・石灰岩とチャートの区別）</div></div>'
    + '<div class="rule-box"><div class="rule-title">② 火山と地震 → Section 2</div><div class="ex">火成岩（等粒状／斑状）・マグマのねばりけと火山の形・P波S波と初期微動継続時間・震度とマグニチュード</div><div class="note">入試：R5 5 地震（P波の速さ・震源からの距離）／R6 5 ミョウバンの結晶＝火成岩の組織の考え方</div></div>'
    + '<div class="rule-box"><div class="rule-title">③ 地球と宇宙 → Section 3</div><div class="ex">日周運動（1時間15°）・年周運動（1か月30°）・南中高度（90−緯度±23.4）・季節・月の満ち欠け・金星</div><div class="note">入試：R7 1(2) 夏至の南中高度と太陽電池の角度（北緯35°、地軸23.4°）</div></div>'
    + '<div class="note">💡 天気（前線・湿度）は既存の「中2 天気」単元が未作成のため、Section 2の末尾に最小限だけ入れてある</div>'
    + '</div>'

    + '<button class="start-btn" data-goto="1">🌏 Section 1：地層から始める →</button>';
}

// ===== SECTION 1: 地層 =====
function renderSection1(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🌏 きょん＆西村の会話</div>'
    + chat('kyon','きょん','柱状図って、地点ごとに深さが書いてあるけど、地点によって地面の高さが違うから比べられないんじゃ…')
    + chat('nishi','西村真二（慶應卒・元アナ）','だから<strong>標高に直す</strong>。地点Cは標高64mで、凝灰岩の上面が深さ8mなら、凝灰岩の上面は「標高56m」。地点Fは標高70mで深さ20mなら「標高50m」。標高にそろえれば比べられる。')
    + chat('kyon','きょん','引き算するだけ！')
    + chat('nishi','西村','そう。そして<strong>凝灰岩は火山灰が固まった岩</strong>で、噴火が1回なら1枚しかない。だからどの地点でも「同じ時代の目印」になる。これを「かぎ層」という。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🌏 地層と岩石のルール</div>'
    + '<div class="rule-box"><div class="rule-title">堆積岩の見分け方</div><div class="ex">粒の大きさ：<strong>れき岩</strong>（2mm以上）＞<strong>砂岩</strong>（0.06〜2mm）＞<strong>泥岩</strong>（0.06mm未満）。粒は<strong>丸い</strong>（流されて角がとれる）<br><strong>凝灰岩</strong>＝火山灰。粒が<strong>角ばっている</strong><br><strong>石灰岩</strong>＝生物の死がい（炭酸カルシウム）。塩酸で<strong>二酸化炭素の泡</strong>、くぎで傷がつく<br><strong>チャート</strong>＝生物の死がい（二酸化ケイ素）。塩酸で泡が<strong>出ない</strong>、非常にかたい</div></div>'
    + '<div class="rule-box"><div class="rule-title">河口からの距離</div><div class="ex">大きく重い粒ほど<strong>河口の近く</strong>に沈む → れき（近）→砂→泥（遠・深い海）<br>泥岩の上に砂岩→海が浅くなった（陸に近づいた）</div></div>'
    + '<div class="rule-box"><div class="rule-title">化石</div><div class="ex"><strong>示相化石</strong>＝当時の<strong>環境</strong>がわかる（サンゴ→あたたかく浅い海、シジミ→河口や湖、ブナ→やや寒い）<br><strong>示準化石</strong>＝当時の<strong>時代</strong>がわかる（古生代：サンヨウチュウ・フズリナ／中生代：アンモナイト・恐竜／新生代：ビカリア・ナウマンゾウ）</div></div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgStrata + '</div>'
    + '<div class="rule-box"><div class="rule-title">柱状図の読み方（3ステップ）</div><div class="ex">① <strong>かぎ層</strong>（凝灰岩）を見つける → ② 各地点で「標高 − 深さ」で層の標高に直す → ③ 標高の差から傾きの向きと割合を求める<br>例（R7）：地点C 64−8＝56m、地点F 70−20＝50m → CからFへ3地点分で6m下がる → 1地点ごとに2m</div></div>'
    + '<div class="note">💡 「上下の逆転や断層はない」「一定の割合で傾いている」というただし書きがあるから、単純な引き算で解ける</div>'
    + '</div>';

  var qs = [
    { qid:'sci_earth_s1_q0', short:'堆積岩：粒の大きさ', jp:'れき岩・砂岩・泥岩は何で区別する？',
      answer:'粒の大きさ', choices:['粒の大きさ','色','かたさ','含まれる化石'],
      exp:'🌏 れき（2mm以上）・砂・泥（0.06mm未満）の<strong>粒の大きさ</strong>で分ける' },
    { qid:'sci_earth_s1_q1', short:'凝灰岩：何が固まった', jp:'凝灰岩は何が固まってできた岩石？',
      answer:'火山灰', choices:['火山灰','生物の死がい','川の砂','マグマ'],
      exp:'🌏 <strong>火山灰</strong>が積もって固まった岩。粒は角ばっている。噴火の目印（かぎ層）になる' },
    { qid:'sci_earth_s1_q2', short:'石灰岩とチャート', jp:'地点CのY層に含まれるれきが「石灰岩」か「チャート」かを確かめる方法として正しいものは？',
      answer:'塩酸をたらして泡が出れば石灰岩', choices:['塩酸をたらして泡が出れば石灰岩','塩酸をたらして泡が出ればチャート','水にとければ石灰岩','磁石につけばチャート'],
      exp:'🌏 石灰岩（炭酸カルシウム）＋塩酸→<strong>二酸化炭素の泡</strong>。チャート（二酸化ケイ素）は泡が出ない。くぎで傷がつくのも石灰岩<br>✅ R7 5(3) I…c、II…ア' },
    { qid:'sci_earth_s1_q3', short:'示相化石：シジミ', jp:'地点FのX層からシジミの化石が見つかった。この層が堆積した当時の環境は？',
      answer:'河口や湖', choices:['河口や湖','あたたかく浅い海','深い海','寒い陸地'],
      exp:'🌏 シジミ＝<strong>示相化石</strong>（環境がわかる）。河口・湖に住む<br>💡 サンゴ→あたたかく浅い海、ブナ→やや寒い陸' },
    { qid:'sci_earth_s1_q4', short:'示準化石：アンモナイト', jp:'アンモナイトの化石が見つかった地層の時代は？',
      answer:'中生代', choices:['中生代','古生代','新生代','わからない'],
      exp:'🌏 アンモナイト・恐竜＝<strong>中生代</strong>。サンヨウチュウ・フズリナ＝古生代、ビカリア・ナウマンゾウ＝新生代<br>💡 示準化石＝時代がわかる（広い範囲・短い期間に栄えた生物）' },
    { qid:'sci_earth_s1_q5', short:'柱状図：凝灰岩上面の標高（C）', type:'input', jp:'地点Cは標高64m、凝灰岩の層の上面は地表から深さ8m。凝灰岩の上面の標高は何m？（数字だけ）', formula:'標高 − 深さ', answer:'56', xp:5, hint:'64−8',
      exp:'✅ 64−8＝<strong>56</strong>m<br>✅ R7 5(4) の第一歩' },
    { qid:'sci_earth_s1_q6', short:'柱状図：凝灰岩上面の標高（F）', type:'input', jp:'地点Fは標高70m、凝灰岩の層の上面は地表から深さ20m。凝灰岩の上面の標高は何m？（数字だけ）', formula:'標高 − 深さ', answer:'50', xp:5, hint:'70−20',
      exp:'✅ 70−20＝<strong>50</strong>m' },
    { qid:'sci_earth_s1_q7', short:'柱状図：傾きの割合', jp:'地点A〜Hは等間隔で一直線に並ぶ。地点C（凝灰岩上面 標高56m）から地点F（同50m）へ3地点分で6m下がっている。1地点分では何m下がる？',
      answer:'2m', choices:['2m','6m','3m','18m'],
      exp:'🌏 6÷3＝<strong>2m</strong>。「一定の割合で傾いている」ので割り算でよい<br>✅ R7 5(4) の解説そのまま' },
    { qid:'sci_earth_s1_q8', short:'柱状図：地点Bの凝灰岩の標高', jp:'同じ地域で、地点Cの1つ左が地点B（標高62m）。地点Cより1地点左なので凝灰岩の上面は2m高い。地点Bで凝灰岩の上面は地表から深さ何m？',
      answer:'4m', choices:['4m','6m','8m','2m'],
      exp:'🌏 凝灰岩上面の標高＝56＋2＝58m → 深さ＝62−58＝<strong>4m</strong><br>✅ R7 5(4) の答え（イ）。標高57mは凝灰岩の層（58〜56m）の中' },
    { qid:'sci_earth_s1_q9', short:'柱状図：X層の位置', jp:'地点Fで、シジミの化石を含む砂岩のX層は凝灰岩の層の「2つ上」にある。凝灰岩が1枚しかない（噴火は1回）とき、地点CのX層はどこ？',
      answer:'凝灰岩の2つ上の層（地表から4mまでの砂岩）', choices:['凝灰岩の2つ上の層（地表から4mまでの砂岩）','凝灰岩のすぐ上のれき岩','凝灰岩の2つ下の砂岩','地点Cには存在しない'],
      exp:'🌏 凝灰岩はどの地点でも同じ層（かぎ層）→ Fで凝灰岩の2つ上なら、Cでも凝灰岩の2つ上＝<strong>地表〜4mの砂岩</strong><br>✅ R7 5(2) III…ア' },
    { qid:'sci_earth_s1_q10', short:'海の深さの変化', jp:'ある地点の柱状図で、下から「泥岩→砂岩→れき岩」の順に重なっていた。この間に海の深さはどう変化した？',
      answer:'だんだん浅くなった', choices:['だんだん浅くなった','だんだん深くなった','変わらない','一度深くなってから浅くなった'],
      exp:'🌏 泥（遠く・深い）→砂→れき（近く・浅い）と粒が大きくなる＝河口に近づいた＝<strong>浅くなった</strong>' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 2: 火山・地震 =====
function renderSection2(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🌏 きょん＆西村の会話</div>'
    + chat('kyon','きょん','地震の問題で「P波」「S波」って出てくるけど、何が違うの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','P波は速くて小さいゆれ（初期微動）、S波は遅くて大きいゆれ（主要動）。P波が来てからS波が来るまでの時間が「初期微動継続時間」で、<strong>震源から遠いほど長い</strong>。')
    + chat('kyon','きょん','遠いほど差が開く…先に出発した速い方がどんどん引き離すってことか。')
    + chat('nishi','西村','その通り。連立方程式の「速さ」と同じ考え方だ。あと火成岩は、ミョウバンの結晶の実験と同じで、<strong>ゆっくり冷えると大きな結晶</strong>になる。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🌏 火山のルール</div>'
    + '<div class="rule-box"><div class="rule-title">マグマのねばりけと火山の形</div><div class="ex">ねばりけ<strong>強い</strong>→ 盛り上がった形（溶岩ドーム）・<strong>激しい</strong>噴火・<strong>白っぽい</strong>岩石（例：雲仙普賢岳）<br>ねばりけ<strong>弱い</strong>→ 平らな形（盾状）・おだやかな噴火・<strong>黒っぽい</strong>岩石（例：ハワイのキラウエア）<br>中間 → 円すい形（成層火山、例：富士山）</div></div>'
    + '<div class="rule-box"><div class="rule-title">火成岩の2種類</div><div class="ex"><strong>火山岩</strong>：地表近くで<strong>急に</strong>冷える → <strong>斑状組織</strong>（大きな結晶＝斑晶＋細かい石基）。玄武岩・安山岩・流紋岩<br><strong>深成岩</strong>：地下深くで<strong>ゆっくり</strong>冷える → <strong>等粒状組織</strong>（大きな結晶がぎっしり）。はんれい岩・せん緑岩・花こう岩</div><div class="note">💡 覚え方：「新幹線は借り上げ」＝しん（深成岩）かんせん（花こう岩・せん緑岩・はんれい岩）／かりあげ（火山岩：流紋岩・安山岩・玄武岩）。R6 5のミョウバンの実験（ゆっくり冷やす→大きな結晶）はこの原理</div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🌏 地震のルール</div>'
    + '<div class="rule-box"><div class="rule-title">P波とS波</div><div class="ex"><strong>P波</strong>＝速い（約6〜8km/s）・小さいゆれ＝<strong>初期微動</strong><br><strong>S波</strong>＝遅い（約3〜4km/s）・大きいゆれ＝<strong>主要動</strong><br><strong>初期微動継続時間</strong>＝P波が来てからS波が来るまで。<strong>震源からの距離に比例</strong>（遠いほど長い）</div></div>'
    + '<div class="rule-box"><div class="rule-title">震度とマグニチュード</div><div class="ex"><strong>震度</strong>＝その場所のゆれの大きさ（0〜7の10段階、場所ごとに違う）<br><strong>マグニチュード（M）</strong>＝地震そのものの規模（1つの地震に1つ。1大きいとエネルギー約32倍）<br><strong>震源</strong>＝地下で地震が起きた点、<strong>震央</strong>＝真上の地表の点</div></div>'
    + '<div class="rule-box"><div class="rule-title">計算：速さ＝距離÷時間</div><div class="ex">震源から60kmの地点にP波が10秒で届いた → P波の速さ＝6km/s<br>初期微動継続時間が10秒の地点の震源距離：P波（6km/s）とS波（3km/s）なら、距離d÷3−d÷6＝10 → d＝60km<br><strong>緊急地震速報</strong>＝速いP波を検知して、遅いS波が来る前に知らせる</div></div>'
    + '<div class="rule-box"><div class="rule-title">天気（最小限）</div><div class="ex"><strong>寒冷前線</strong>通過→気温が<strong>急に下がり</strong>、風向が<strong>南寄り→北寄り</strong>に変わる、短時間の強い雨<br><strong>温暖前線</strong>通過→気温が上がり、風向が東寄り→南寄り、長時間の弱い雨<br><strong>湿度</strong>：乾湿計で乾球と湿球の差を表で読む。差が大きいほど乾燥。露点＝水蒸気が水滴になり始める温度。気温が高いほど空気は多くの水蒸気を含める</div><div class="note">✅ R5 5：3月21日3〜9時に寒冷前線通過→風向が南寄りから北寄りへ（ウ）。同じ湿度なら気温が高い時刻の方が露点が高い</div></div>'
    + '</div>';

  var qs = [
    { qid:'sci_earth_s2_q0', short:'火山：ねばりけと形', jp:'マグマのねばりけが強い火山の特徴として正しいものは？',
      answer:'盛り上がった形で、激しい噴火をし、岩石は白っぽい', choices:['盛り上がった形で、激しい噴火をし、岩石は白っぽい','平らな形で、おだやかな噴火をし、岩石は黒っぽい','円すい形で、噴火しない','平らな形で、激しい噴火をする'],
      exp:'🌏 ねばりけ強→流れにくい→<strong>盛り上がる</strong>→ガスが抜けにくく<strong>激しく噴火</strong>→<strong>白っぽい</strong>（雲仙普賢岳）' },
    { qid:'sci_earth_s2_q1', short:'火成岩：等粒状組織', jp:'大きな結晶がぎっしり並んだ「等粒状組織」をもつ火成岩はどれで、どこでできた？',
      answer:'深成岩。地下深くでゆっくり冷えた', choices:['深成岩。地下深くでゆっくり冷えた','火山岩。地表近くで急に冷えた','深成岩。地表近くで急に冷えた','火山岩。地下深くでゆっくり冷えた'],
      exp:'🌏 ゆっくり冷える→結晶が大きく育つ→<strong>等粒状</strong>→<strong>深成岩</strong>（花こう岩など）<br>💡 R6 5 のミョウバン：湯でゆっくり冷やす→大きな結晶' },
    { qid:'sci_earth_s2_q2', short:'火成岩：斑状組織', jp:'「斑状組織」の説明として正しいものは？',
      answer:'大きな結晶（斑晶）のまわりを細かい粒（石基）が埋めている。火山岩の組織', choices:['大きな結晶（斑晶）のまわりを細かい粒（石基）が埋めている。火山岩の組織','大きな結晶だけがぎっしり並ぶ。深成岩の組織','丸い粒が積もっている。堆積岩の組織','結晶が全くない'],
      exp:'🌏 地下で少し育った結晶（<strong>斑晶</strong>）＋地表で急に固まった<strong>石基</strong>＝<strong>斑状組織</strong>（火山岩）' },
    { qid:'sci_earth_s2_q3', short:'火成岩の分類', jp:'次のうち深成岩はどれ？',
      answer:'花こう岩', choices:['花こう岩','玄武岩','安山岩','凝灰岩'],
      exp:'🌏 深成岩＝<strong>花こう岩</strong>・せん緑岩・はんれい岩（新幹線）。玄武岩・安山岩は火山岩。凝灰岩は堆積岩' },
    { qid:'sci_earth_s2_q4', short:'地震：P波とS波', jp:'P波とS波について正しいものは？',
      answer:'P波の方が速く、小さなゆれ（初期微動）を起こす', choices:['P波の方が速く、小さなゆれ（初期微動）を起こす','S波の方が速く、大きなゆれを起こす','P波とS波は同じ速さ','P波が主要動を起こす'],
      exp:'🌏 <strong>P</strong>波＝Primary（先に来る）＝速い＝初期微動。<strong>S</strong>波＝Secondary＝遅い＝主要動' },
    { qid:'sci_earth_s2_q5', short:'地震：初期微動継続時間', jp:'震源から遠い地点ほど、初期微動継続時間はどうなる？',
      answer:'長くなる', choices:['長くなる','短くなる','変わらない','0になる'],
      exp:'🌏 速いP波が遅いS波をどんどん引き離す→遠いほど差（初期微動継続時間）が<strong>長い</strong>。距離に比例' },
    { qid:'sci_earth_s2_q6', short:'地震：P波の速さ', type:'input', jp:'震源から120km離れた地点に、地震発生から20秒後にP波が届いた。P波の速さは何km/s？（数字だけ）', formula:'距離÷時間', answer:'6', xp:6, hint:'120÷20',
      exp:'✅ 120÷20＝<strong>6</strong>km/s' },
    { qid:'sci_earth_s2_q7', short:'地震：震源距離', type:'input', jp:'P波6km/s、S波3km/s。初期微動継続時間が15秒だった地点の震源からの距離は何km？（数字だけ）', formula:'d÷3 − d÷6 ＝ 15', answer:'90', xp:8, hint:'d÷6＝15 → d＝90',
      exp:'✅ S波の到着時間 d/3、P波の到着時間 d/6 → 差 d/6＝15 → d＝<strong>90</strong>km' },
    { qid:'sci_earth_s2_q8', short:'震度とマグニチュード', jp:'震度とマグニチュードの違いとして正しいものは？',
      answer:'震度は場所ごとのゆれの大きさ、マグニチュードは地震の規模で1つの地震に1つ', choices:['震度は場所ごとのゆれの大きさ、マグニチュードは地震の規模で1つの地震に1つ','震度は地震の規模、マグニチュードは場所ごとのゆれ','どちらも同じ意味','震度は10段階、マグニチュードも10段階'],
      exp:'🌏 <strong>震度</strong>＝場所で違う（震源に近いほど大きい）。<strong>M</strong>＝地震のエネルギー（1つの地震に1つ）' },
    { qid:'sci_earth_s2_q9', short:'寒冷前線の通過', jp:'寒冷前線が通過したあとの変化として正しいものは？',
      answer:'気温が急に下がり、風向が南寄りから北寄りに変わる', choices:['気温が急に下がり、風向が南寄りから北寄りに変わる','気温が上がり、風向が北寄りから南寄りに変わる','気温は変わらず、雨が長く降り続く','気温が上がり、風向が東寄りから西寄りに変わる'],
      exp:'🌏 寒冷前線＝寒気が暖気の下にもぐりこむ→通過後は寒気→<strong>気温急降下</strong>・<strong>北寄りの風</strong>・短時間の強い雨<br>✅ R5 5(2)（ウ）' },
    { qid:'sci_earth_s2_q10', short:'露点と気温', jp:'湿度が同じ3つの時刻A、B、Cのうち、露点が最も高いのは？',
      answer:'気温が最も高い時刻', choices:['気温が最も高い時刻','気温が最も低い時刻','どれも同じ','気圧が最も高い時刻'],
      exp:'🌏 気温が高いほど空気は多くの水蒸気を含める → 同じ湿度なら<strong>気温が高い方が水蒸気量が多い</strong>→露点も高い<br>✅ R5 5(4) III…ア' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 3: 天体 =====
function renderSection3(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🌏 きょん＆西村の会話</div>'
    + chat('kyon','きょん','夏至の太陽の高さって、どうやって計算するの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','まず春分・秋分は「<strong>90°−緯度</strong>」。北緯35°なら55°。夏至はそれに地軸の傾き<strong>23.4°を足す</strong>から78.4°。冬至は<strong>引く</strong>から31.6°。')
    + chat('kyon','きょん','90引く緯度、それに23.4を足すか引くか！')
    + chat('nishi','西村','R7の入試では「太陽電池に垂直に光が当たると発電量が最大」という問題で、南中高度78.4°のとき、パネルを水平から何度傾けるかを聞かれた。答えは90−78.4＝11.6°。南中高度が出れば、あとは引き算だ。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🌏 天体のルール</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgStar + '</div>'
    + '<div class="rule-box"><div class="rule-title">日周運動（地球の自転・1日1回転）</div><div class="ex">太陽も星も<strong>東からのぼり、南を通って、西に沈む</strong>。<strong>1時間に15°</strong>（360°÷24）<br>北の空：<strong>北極星</strong>を中心に<strong>反時計回り</strong>。透明半球で太陽の位置を1時間ごとに記録すると等間隔</div></div>'
    + '<div class="rule-box"><div class="rule-title">年周運動（地球の公転・1年1周）</div><div class="ex">同じ時刻に見える星は<strong>1か月で30°</strong>（360°÷12）東→西へずれる<br>1か月後に同じ位置に見えるのは<strong>2時間早い</strong>時刻（30°÷15°）</div></div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgNanchu + '</div>'
    + '<div class="rule-box"><div class="rule-title">南中高度と季節</div><div class="ex">春分・秋分：<strong>90°−緯度</strong>　夏至：90°−緯度<strong>＋23.4°</strong>　冬至：90°−緯度<strong>−23.4°</strong><br>季節がある理由＝<strong>地軸が23.4°傾いたまま公転</strong>するから。夏至は昼が最も長く、日の出・日の入りの位置が最も北寄り<br>太陽の南中時刻は場所（経度）で違う。東の地点ほど早い</div></div>'
    + '<div class="rule-box"><div class="rule-title">月と金星</div><div class="ex"><strong>月</strong>：新月→三日月→上弦（右半分）→満月→下弦（左半分）→新月（約29.5日）。<strong>日食</strong>＝太陽−月−地球（新月）、<strong>月食</strong>＝太陽−地球−月（満月）<br><strong>金星</strong>：地球より内側→<strong>夕方の西</strong>（宵の明星）か<strong>明け方の東</strong>（明けの明星）にしか見えない。<strong>真夜中には見えない</strong>。満ち欠けし、近いほど大きく欠けて見える</div></div>'
    + '</div>';

  var qs = [
    { qid:'sci_earth_s3_q0', short:'日周運動：1時間の角度', jp:'太陽や星が1時間に動く角度は？',
      answer:'15°', choices:['15°','30°','1°','360°'],
      exp:'🌏 360°÷24時間＝<strong>15°</strong>（地球の自転）' },
    { qid:'sci_earth_s3_q1', short:'年周運動：1か月の角度', jp:'同じ時刻に同じ星を観察すると、1か月後には何度動いて見える？',
      answer:'30°', choices:['30°','15°','1°','90°'],
      exp:'🌏 360°÷12か月＝<strong>30°</strong>（地球の公転）' },
    { qid:'sci_earth_s3_q2', short:'年周運動：同じ位置に見える時刻', jp:'ある星が今日の午後10時に南中した。1か月後に同じ星が南中するのは何時ごろ？',
      answer:'午後8時', choices:['午後8時','午前0時','午後10時','午後9時'],
      exp:'🌏 1か月で30°東→西へ進む＝2時間分（30÷15）→ <strong>2時間早く</strong>南中＝午後8時' },
    { qid:'sci_earth_s3_q3', short:'北の空の星', jp:'北の空の星の動きとして正しいものは？',
      answer:'北極星を中心に反時計回りに回る', choices:['北極星を中心に反時計回りに回る','北極星を中心に時計回りに回る','東から西へ直線的に動く','動かない'],
      exp:'🌏 北極星は地軸の延長上にあるのでほぼ動かず、他の星は<strong>反時計回り</strong>' },
    { qid:'sci_earth_s3_q4', short:'南中高度：春分', type:'input', jp:'北緯35°の地点で、春分の日の太陽の南中高度は何度？（数字だけ）', formula:'90 − 緯度', answer:'55', xp:5, hint:'90−35',
      exp:'✅ 90−35＝<strong>55°</strong>' },
    { qid:'sci_earth_s3_q5', short:'南中高度：夏至', type:'input', jp:'北緯35°の地点で、夏至の日の太陽の南中高度は何度？（小数第1位まで）', formula:'90 − 緯度 ＋ 23.4', answer:'78.4', xp:6, hint:'55＋23.4',
      exp:'✅ 90−35＋23.4＝<strong>78.4°</strong>' },
    { qid:'sci_earth_s3_q6', short:'太陽電池の角度（R7）', jp:'北緯35°で、夏至の南中時に太陽電池に垂直に光が当たるようにする。水平面と太陽電池の角度は？',
      answer:'11.6°', choices:['11.6°','78.4°','23.4°','35.0°'],
      exp:'🌏 南中高度78.4° → 光に垂直＝パネルを水平から<strong>90−78.4＝11.6°</strong>傾ける<br>✅ R7 1(2)（ウ）。「南を低くして」＝南向きに少し傾ける' },
    { qid:'sci_earth_s3_q7', short:'南中高度：冬至', type:'input', jp:'北緯35°の地点で、冬至の日の太陽の南中高度は何度？（小数第1位まで）', formula:'90 − 緯度 − 23.4', answer:'31.6', xp:6, hint:'55−23.4',
      exp:'✅ 90−35−23.4＝<strong>31.6°</strong>' },
    { qid:'sci_earth_s3_q8', short:'季節がある理由', jp:'日本に季節がある理由として正しいものは？',
      answer:'地軸が23.4°傾いたまま地球が公転しているから', choices:['地軸が23.4°傾いたまま地球が公転しているから','太陽と地球の距離が季節で変わるから','地球の自転の速さが変わるから','月の引力が変わるから'],
      exp:'🌏 <strong>地軸の傾き＋公転</strong>→太陽の高さと昼の長さが変わる。距離ではない' },
    { qid:'sci_earth_s3_q9', short:'夏至の日の出の位置', jp:'夏至の日の太陽の日の出の位置は、春分の日と比べてどちら寄り？',
      answer:'北寄り', choices:['北寄り','南寄り','同じ','西寄り'],
      exp:'🌏 夏至は太陽が最も<strong>北寄り</strong>からのぼり、北寄りに沈む。昼が最も長い' },
    { qid:'sci_earth_s3_q10', short:'月：上弦の月', jp:'夕方、南の空に右半分が光った月が見えた。この月は？',
      answer:'上弦の月', choices:['上弦の月','下弦の月','満月','新月'],
      exp:'🌏 右半分＝<strong>上弦</strong>（夕方に南中）。左半分＝下弦（明け方に南中）' },
    { qid:'sci_earth_s3_q11', short:'日食のとき', jp:'日食が起こるときの月の形は？',
      answer:'新月', choices:['新月','満月','上弦','下弦'],
      exp:'🌏 日食＝太陽−<strong>月</strong>−地球の順に並ぶ＝<strong>新月</strong>。月食は満月' },
    { qid:'sci_earth_s3_q12', short:'金星が見える時間', jp:'金星について正しいものは？',
      answer:'夕方の西の空か明け方の東の空に見え、真夜中には見えない', choices:['夕方の西の空か明け方の東の空に見え、真夜中には見えない','一晩中見える','真夜中に南の空に見える','北の空に見える'],
      exp:'🌏 金星は地球より<strong>内側</strong>を回る→太陽から大きく離れない→<strong>真夜中には見えない</strong>。宵の明星（西）・明けの明星（東）' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 確認テスト — 大地の変化・地球と宇宙</div>'
    + '<div class="rule-box"><div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + '地層・火山・地震・天体から <strong style="color:var(--gold)">20問</strong>！<br>'
    + 'きょん「標高から引く！90から引く！15と30！！」<br>'
    + '西村「図を見て、数字を書き込んでから答えろ」'
    + '</div></div></div>';

  var qs = [
    { qid:'sci_earth_s4_q0', short:'テスト：泥岩', jp:'粒の大きさが0.06mm未満の堆積岩は？', answer:'泥岩', choices:['泥岩','砂岩','れき岩','凝灰岩'], exp:'🌏 最も細かい粒＝<strong>泥岩</strong>' },
    { qid:'sci_earth_s4_q1', short:'テスト：かぎ層', jp:'離れた地点の地層を対比するときの目印になる、火山灰の層を何という？', answer:'かぎ層', choices:['かぎ層','断層','しゅう曲','不整合'], exp:'🌏 凝灰岩など、広い範囲に同時に積もった層＝<strong>かぎ層</strong>' },
    { qid:'sci_earth_s4_q2', short:'テスト：サンゴ', jp:'サンゴの化石が見つかった地層が堆積した環境は？', answer:'あたたかく浅い海', choices:['あたたかく浅い海','冷たく深い海','河口や湖','寒い陸地'], exp:'🌏 サンゴ＝示相化石＝<strong>あたたかく浅い海</strong>' },
    { qid:'sci_earth_s4_q3', short:'テスト：サンヨウチュウ', jp:'サンヨウチュウの化石が示す地質年代は？', answer:'古生代', choices:['古生代','中生代','新生代','先カンブリア時代'], exp:'🌏 サンヨウチュウ・フズリナ＝<strong>古生代</strong>' },
    { qid:'sci_earth_s4_q4', short:'テスト：柱状図の標高', type:'input', jp:'標高80mの地点で、凝灰岩の上面が地表から深さ12m。凝灰岩上面の標高は何m？（数字だけ）', formula:'標高 − 深さ', answer:'68', xp:5, hint:'80−12', exp:'✅ 80−12＝<strong>68</strong>m' },
    { qid:'sci_earth_s4_q5', short:'テスト：傾きの向き', jp:'地点P（標高60m）で凝灰岩上面は深さ5m、地点Q（標高64m）で深さ13m。凝灰岩の層はPとQのどちらへ向かって低くなっている？', answer:'Q（Pで55m、Qで51m）', choices:['Q（Pで55m、Qで51m）','P（Pで55m、Qで51m）','水平（同じ高さ）','わからない'], exp:'🌏 P：60−5＝55m、Q：64−13＝51m → <strong>Qの方が低い</strong>。深さではなく標高で比べる' },
    { qid:'sci_earth_s4_q6', short:'テスト：チャート', jp:'塩酸をかけても泡が出ず、くぎでも傷がつかないかたい岩石は？', answer:'チャート', choices:['チャート','石灰岩','凝灰岩','砂岩'], exp:'🌏 二酸化ケイ素でできた<strong>チャート</strong>。石灰岩は泡が出る' },
    { qid:'sci_earth_s4_q7', short:'テスト：おだやかな噴火', jp:'マグマのねばりけが弱い火山の特徴は？', answer:'平らな形で、おだやかな噴火、岩石は黒っぽい', choices:['平らな形で、おだやかな噴火、岩石は黒っぽい','盛り上がった形で、激しい噴火、岩石は白っぽい','円すい形で、白っぽい','盛り上がった形で、黒っぽい'], exp:'🌏 ねばりけ弱→流れやすい→<strong>平ら</strong>・おだやか・黒っぽい' },
    { qid:'sci_earth_s4_q8', short:'テスト：火山岩', jp:'次のうち火山岩はどれ？', answer:'玄武岩', choices:['玄武岩','花こう岩','はんれい岩','せん緑岩'], exp:'🌏 火山岩＝流紋岩・安山岩・<strong>玄武岩</strong>（かりあげ）' },
    { qid:'sci_earth_s4_q9', short:'テスト：斑晶と石基', jp:'火山岩の斑状組織で、細かい粒の部分を何という？', answer:'石基', choices:['石基','斑晶','等粒','結晶'], exp:'🌏 大きな結晶＝斑晶、細かい部分＝<strong>石基</strong>' },
    { qid:'sci_earth_s4_q10', short:'テスト：初期微動', jp:'地震のとき、最初に来る小さなゆれを何という？', answer:'初期微動', choices:['初期微動','主要動','余震','本震'], exp:'🌏 P波による<strong>初期微動</strong>→S波による主要動' },
    { qid:'sci_earth_s4_q11', short:'テスト：S波の速さ', type:'input', jp:'震源から90km離れた地点に、地震発生から30秒後にS波が届いた。S波の速さは何km/s？（数字だけ）', formula:'距離÷時間', answer:'3', xp:6, hint:'90÷30', exp:'✅ 90÷30＝<strong>3</strong>km/s' },
    { qid:'sci_earth_s4_q12', short:'テスト：緊急地震速報', jp:'緊急地震速報のしくみとして正しいものは？', answer:'速いP波を検知して、遅いS波が来る前に知らせる', choices:['速いP波を検知して、遅いS波が来る前に知らせる','S波を検知してP波が来る前に知らせる','地震を予知して発生前に知らせる','震度を測ってから知らせる'], exp:'🌏 P波（速い・小さい）で検知→S波（遅い・大きい）の前に警報' },
    { qid:'sci_earth_s4_q13', short:'テスト：マグニチュード', jp:'マグニチュードが1大きくなると、地震のエネルギーは約何倍？', answer:'約32倍', choices:['約32倍','約2倍','約10倍','約1000倍'], exp:'🌏 M＋1→約<strong>32倍</strong>、M＋2→約1000倍' },
    { qid:'sci_earth_s4_q14', short:'テスト：星の動き（南）', jp:'南の空の星は、時間とともにどちらへ動く？', answer:'東から西へ（左から右へ）', choices:['東から西へ（左から右へ）','西から東へ（右から左へ）','上から下へ','動かない'], exp:'🌏 日周運動：東→南→西。南を向くと<strong>左（東）から右（西）へ</strong>' },
    { qid:'sci_earth_s4_q15', short:'テスト：3時間後の角度', type:'input', jp:'星は3時間で何度動く？（数字だけ）', formula:'15°×時間', answer:'45', xp:5, hint:'15×3', exp:'✅ 15×3＝<strong>45°</strong>' },
    { qid:'sci_earth_s4_q16', short:'テスト：南中高度（北緯40°夏至）', type:'input', jp:'北緯40°の地点での夏至の南中高度は何度？（小数第1位まで）', formula:'90 − 40 ＋ 23.4', answer:'73.4', xp:6, hint:'50＋23.4', exp:'✅ 90−40＋23.4＝<strong>73.4°</strong>' },
    { qid:'sci_earth_s4_q17', short:'テスト：太陽電池の角度', jp:'南中高度が60°のとき、太陽電池に光が垂直に当たるようにするには水平面から何度傾ける？', answer:'30°', choices:['30°','60°','90°','23.4°'], exp:'🌏 90−60＝<strong>30°</strong>（R7 1(2)と同じ考え方）' },
    { qid:'sci_earth_s4_q18', short:'テスト：月食', jp:'月食が起こるときの並び順と月の形は？', answer:'太陽−地球−月の順で、満月', choices:['太陽−地球−月の順で、満月','太陽−月−地球の順で、新月','太陽−地球−月の順で、新月','太陽−月−地球の順で、満月'], exp:'🌏 地球の影に月が入る＝<strong>太陽−地球−月</strong>＝<strong>満月</strong>' },
    { qid:'sci_earth_s4_q19', short:'テスト：宵の明星', jp:'夕方、西の空に明るく見える金星を何という？', answer:'宵の明星', choices:['宵の明星','明けの明星','北極星','シリウス'], exp:'🌏 夕方の西＝<strong>宵の明星</strong>、明け方の東＝明けの明星' },
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
  var msg = pct >= 90 ? 'きょん「地層も天体も完璧！！」<br>西村「文句なし。地学分野は取れる」'
          : pct >= 70 ? 'きょん「だいぶ図が読めてきた！！」<br>西村「あと少し。間違えた分野だけ特訓で潰そう」'
          : pct >= 50 ? 'きょん「半分は取れた…！」<br>西村「弱点ノートで、どの部屋が弱いか見よう」'
          : 'きょん「地学むずかしい…」<br>西村「大丈夫。ルールは少ない。特訓モードで反復」';
  var overlay = document.getElementById('resultOverlay');
  overlay.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--teal);border-radius:20px;padding:36px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 8px 40px rgba(14,165,233,0.25)">'
    + '<div style="font-size:60px;margin-bottom:12px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:26px;color:var(--teal);letter-spacing:2px;margin-bottom:8px">確認テスト結果</div>'
    + '<div style="font-size:44px;color:var(--gold);font-weight:bold;font-family:Bebas Neue,sans-serif">' + correct + ' / ' + total + '</div>'
    + '<div style="font-size:22px;color:var(--gold);margin-bottom:20px">' + pct + '%</div>'
    + '<div style="font-size:14px;color:var(--text2);line-height:2.1;margin-bottom:24px">' + msg + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    + '<button id="resBtnWeak" style="background:var(--teal);color:#000;border:none;padding:12px 20px;border-radius:10px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">📊 弱点を見る</button>'
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
  var html = '<div class="section-header"><div class="section-badge">理科 大地と宇宙 · 弱点ノート</div><div class="section-title">弱点ノート</div><div class="section-sub">間違えた問題を確認しよう</div></div>';
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
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(14,165,233,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:14px;color:var(--text);margin-bottom:2px">' + (d.short || d.jp) + '</div><div style="font-size:12px;color:var(--text2)">正解：' + d.answer + '　（' + d.correct + '/' + d.total + '回）</div></div>'
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
  var html = '<div class="section-header"><div class="section-badge" style="background:var(--red)">理科 大地と宇宙 · 特訓</div><div class="section-title">弱点特訓モード</div><div class="section-sub">弱点問題を集中練習！</div></div>';
  if(wqs.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-size:16px;line-height:2">弱点なし！<br>きょん「地学マスター！！」</div></div>';
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
    + '<button id="tokkuNext" style="display:none;margin-top:14px;background:var(--teal);color:#000;border:none;padding:12px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer">次へ →</button>'
    + '</div>';
  area.innerHTML = html;
  area.querySelectorAll('.choice-btn[data-tchoice]').forEach(function(b){ b.addEventListener('click', function(){ applyTokkuResult(qid, b.dataset.tchoice === d.answer, b.dataset.tchoice); }); });
  var ts = document.getElementById('tokkuSubmit');
  if(ts){ ts.addEventListener('click', function(){ var v = document.getElementById('tokkuInput').value.trim(); if(!v){ showToast('答えを入力してください！'); return; } applyTokkuResult(qid, numMatch(v, d.answer), v); }); }
}
function applyTokkuResult(qid, correct, choice){
  var d = weakDB[qid]; if(!d) return;
  d.total++; if(correct) d.correct++;
  localStorage.setItem('sci_weakdb', JSON.stringify(weakDB));
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
    + (pctAll >= 80 ? 'きょん「地学、固まってきた！！」' : 'きょん「まだ穴がある…もう一回！！」') + '</div>'
    + '<button id="tokkuAgain" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer">🔥 もう一度特訓</button>'
    + '</div>';
  document.getElementById('tokkuAgain').addEventListener('click', function(){ renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
renderSection(0);
