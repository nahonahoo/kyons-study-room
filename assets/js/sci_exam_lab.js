// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:20,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「実験？なにそれ食えるの？」' },
  { lv:2, min:20,  max:55,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「顕微鏡は低倍率から、覚えた」' },
  { lv:3, min:55,  max:110, badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺、実験文読めるかも」' },
  { lv:4, min:110, max:185, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:185, max:280, badge:'📺 全国ネット',    title:'課長',          status:'きょん「表の読み取り、にっくんより速いかも」' },
  { lv:6, min:280, max:400, badge:'🌟 冠番組',        title:'部長',          status:'きょん「実験で漫才できるかもしれない」' },
  { lv:7, min:400, max:550, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:550, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('sci_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('sci_lab_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('sci_lab_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('sci_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;
var QID_PREFIX = 'sci_lab_';

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
  localStorage.setItem('sci_lab_answered', JSON.stringify(answeredSet));
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
  localStorage.setItem('sci_lab_lastStudy', _t);
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
  correct: ['きょん「合ってる！！実験、読めた！！」', 'きょん「やった！！表から読み取れた！！」', 'きょん「にっくん見て！解けた！！」'],
  nishi:   ['西村「正解。手順を正確に読めてる」', '西村「できてる。その調子」', '西村「表の意味がわかってる証拠だ」']
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
// 実験文ボックス（入試の〔実験〕そっくりに）
function labBox(title, steps){
  return '<div style="background:var(--bg3);border:1px solid var(--border);border-left:4px solid var(--teal);border-radius:8px;padding:12px 16px;margin:6px 0 10px;font-size:15px;line-height:2.1;letter-spacing:0.04em">'
    + '<div style="color:var(--teal);font-weight:bold;font-size:13px;margin-bottom:4px">' + title + '</div>'
    + steps.map(function(s, i){ return '<div>' + (i+1) + '　' + s + '</div>'; }).join('')
    + '</div>';
}
function tbl(head, rows){
  var h = '<div style="overflow-x:auto;margin:6px 0 10px"><table style="border-collapse:collapse;font-size:13px;min-width:280px">';
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
    + '<div class="exp-card-title">🔬 解説</div><div style="color:var(--text);font-size:13px;line-height:2.1">' + exp + '</div></div>'
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
    + '<div class="exp-card-title">🔬 解説</div><div style="color:var(--text);font-size:13px;line-height:2.2">' + expText + '</div></div>'
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
  else { var msgs = ['きょん「あれ！間違えた！実験文をもう一回！！」','きょん「また間違えた…！表を指でなぞる！！」','きょん「ルールカードを見直す！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('sci_lab_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var inp = document.getElementById('inp_' + qid); if(inp){ inp.disabled = true; inp.value = meta.answer; var sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if(sb) sb.style.display = 'none'; }
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で解く！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。実験文のどこに書いてあったか確認しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = QID_PREFIX + 's' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('sci_lab_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'🔬 スタート',  title:'理科は「実験文」を読む教科', sub:'器具・手順・表——知識より読み方で点が決まる' },
  { id:1, label:'器具',         title:'実験器具の使い方',           sub:'顕微鏡・ルーペ・メスシリンダー・ガスバーナー・電流計・気体——暗記で確実に取れる小問' },
  { id:2, label:'実験文',       title:'実験文の読み方',             sub:'何を変えた？何を測った？何を同じにした？——本物の〔実験〕で練習' },
  { id:3, label:'表・グラフ',   title:'表とグラフから読む',         sub:'過不足なく反応した点・比例の関係・グラフの傾き' },
  { id:4, label:'確認テスト',   title:'確認テスト',                 sub:'入試形式20問（組み合わせ選択・全て選ぶ）' },
  { id:5, label:'📊弱点',       title:'弱点ノート',                 sub:'間違えた問題を確認' },
  { id:6, label:'🔥特訓',       title:'弱点特訓モード',             sub:'弱点問題を集中練習！' },
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
    + '<div class="section-badge">理科 実験の読み方 · SECTION ' + id + '</div>'
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
var svgMicro = '<svg viewBox="0 0 320 130" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【顕微鏡：見える向きとプレパラートの動かし方】</text>'
  + '<circle cx="70" cy="75" r="42" fill="rgba(14,165,233,0.06)" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<circle cx="95" cy="52" r="6" fill="#f5c518"/>'
  + '<text x="70" y="128" fill="#8b949e" font-size="9" text-anchor="middle">視野：右上に見える</text>'
  + '<text x="160" y="72" fill="#e6edf3" font-size="14" text-anchor="middle">→</text>'
  + '<rect x="200" y="45" width="90" height="60" rx="4" fill="rgba(163,113,247,0.08)" stroke="#a371f7" stroke-width="1.5"/>'
  + '<circle cx="222" cy="88" r="6" fill="#f5c518"/>'
  + '<line x1="232" y1="80" x2="262" y2="58" stroke="#3fb950" stroke-width="2"/><polygon points="262,58 254,60 260,66" fill="#3fb950"/>'
  + '<text x="245" y="128" fill="#8b949e" font-size="9" text-anchor="middle">実物は左下にある→プレパラートを右上へ</text>'
  + '</svg>';

var svgMeasure = '<svg viewBox="0 0 320 120" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【メスシリンダーの読み方】</text>'
  + '<rect x="60" y="25" width="50" height="85" fill="none" stroke="#8b949e" stroke-width="1.5"/>'
  + '<path d="M60,62 Q85,72 110,62" fill="rgba(14,165,233,0.25)" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<rect x="60" y="66" width="50" height="44" fill="rgba(14,165,233,0.25)"/>'
  + '<line x1="60" y1="50" x2="70" y2="50" stroke="#8b949e"/><text x="52" y="53" fill="#8b949e" font-size="8" text-anchor="end">60</text>'
  + '<line x1="60" y1="70" x2="70" y2="70" stroke="#8b949e"/><text x="52" y="73" fill="#8b949e" font-size="8" text-anchor="end">50</text>'
  + '<line x1="60" y1="90" x2="70" y2="90" stroke="#8b949e"/><text x="52" y="93" fill="#8b949e" font-size="8" text-anchor="end">40</text>'
  + '<line x1="30" y1="67" x2="60" y2="67" stroke="#f5c518" stroke-width="1" stroke-dasharray="3,2"/>'
  + '<text x="28" y="70" fill="#f5c518" font-size="8" text-anchor="end">目の高さ</text>'
  + '<text x="140" y="50" fill="#e6edf3" font-size="10">① 水平な台に置く</text>'
  + '<text x="140" y="68" fill="#e6edf3" font-size="10">② 目を液面と同じ高さに</text>'
  + '<text x="140" y="86" fill="#f5c518" font-size="10" font-weight="bold">③ へこんだ面の底を読む</text>'
  + '<text x="140" y="104" fill="#8b949e" font-size="9">最小目盛りの1/10まで（例：51.5cm³）</text>'
  + '</svg>';

var svgCircuit = '<svg viewBox="0 0 320 120" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【電流計と電圧計のつなぎ方】</text>'
  + '<rect x="40" y="40" width="60" height="24" rx="3" fill="none" stroke="#e6edf3" stroke-width="1.5"/><text x="70" y="56" fill="#e6edf3" font-size="10" text-anchor="middle">電熱線</text>'
  + '<circle cx="140" cy="52" r="12" fill="none" stroke="#e94560" stroke-width="1.5"/><text x="140" y="56" fill="#e94560" font-size="11" text-anchor="middle">A</text>'
  + '<line x1="100" y1="52" x2="128" y2="52" stroke="#e6edf3" stroke-width="1.5"/>'
  + '<text x="140" y="80" fill="#e94560" font-size="9" text-anchor="middle">電流計：直列</text>'
  + '<text x="140" y="92" fill="#8b949e" font-size="8" text-anchor="middle">（流れる量を数える）</text>'
  + '<rect x="200" y="40" width="60" height="24" rx="3" fill="none" stroke="#e6edf3" stroke-width="1.5"/><text x="230" y="56" fill="#e6edf3" font-size="10" text-anchor="middle">電熱線</text>'
  + '<circle cx="230" cy="95" r="12" fill="none" stroke="#3fb950" stroke-width="1.5"/><text x="230" y="99" fill="#3fb950" font-size="11" text-anchor="middle">V</text>'
  + '<line x1="200" y1="52" x2="190" y2="52" stroke="#e6edf3"/><line x1="190" y1="52" x2="190" y2="95" stroke="#e6edf3"/><line x1="190" y1="95" x2="218" y2="95" stroke="#e6edf3"/>'
  + '<line x1="260" y1="52" x2="270" y2="52" stroke="#e6edf3"/><line x1="270" y1="52" x2="270" y2="95" stroke="#e6edf3"/><line x1="270" y1="95" x2="242" y2="95" stroke="#e6edf3"/>'
  + '<text x="300" y="80" fill="#3fb950" font-size="9" text-anchor="middle">電圧計</text>'
  + '<text x="300" y="92" fill="#3fb950" font-size="9" text-anchor="middle">：並列</text>'
  + '<text x="160" y="116" fill="#8b949e" font-size="9" text-anchor="middle">どちらも＋端子は電源の＋側。−端子は最初は最大（5A／300V）から</text>'
  + '</svg>';

// ===== SECTION 0 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">🔬 きょん＆西村の会話</div>'
    + chat('kyon','きょん（富士田恭兵）','理科の入試って、〔実験〕①②③…って長い文章が出てきて、読んでるうちに何の話かわからなくなる。')
    + chat('nishi','西村真二（慶應卒・元アナ）','愛知県の理科は、大問2〜5が全部〔実験〕か〔観察〕の手順文と表から始まる。出版社の分析にも「学校で行った実験を整理して、目的や期待される結果を理解しておくことが重要」「実験内容を読み込む時間が必要」と書かれている。')
    + chat('kyon','きょん','つまり、知識より「実験文を読む力」？')
    + chat('nishi','西村','その通り。読むときのコツは3つ。①<strong>何を変えたか</strong>（例：炭素の質量）②<strong>何を測ったか</strong>（例：反応後の質量）③<strong>何を同じにしたか</strong>（例：酸化銅4.00g）。これがわかれば表の意味が見える。あと、器具の使い方の小問は暗記で確実に取れる。')
    + chat('kyon','きょん','器具は暗記、実験文は3つのコツ！')
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">🔬 このページの3つの技と入試での出方</div>'
    + '<div class="rule-box"><div class="rule-title">① 器具の使い方（暗記）→ Section 1</div><div class="ex">顕微鏡・ルーペ・メスシリンダー・ガスバーナー・電流計/電圧計・気体の集め方・ろ過・石灰水・BTB液</div><div class="note">入試：R7 6(2) 顕微鏡の正しい操作を全て選ぶ／R7 5(1) ルーペの使い方／R7 6(1) メスシリンダーの水面／R7 3(2) ガラス管とピンチコックの理由</div></div>'
    + '<div class="rule-box"><div class="rule-title">② 実験文の読み方 → Section 2</div><div class="ex">手順①②③…を読んで「変えた・測った・同じにした」を拾う。「ただし」「なお」は解くためのヒント</div><div class="note">入試：R7 3 酸化銅と炭素（炭素の質量を変えて反応後の質量を測る）／R7 4 電熱線（抵抗を変えて温度上昇を測る）／R6 5 ミョウバンの結晶（冷え方を変える）</div></div>'
    + '<div class="rule-box"><div class="rule-title">③ 表・グラフの読み取り → Section 3</div><div class="ex">「質量が減らなくなった点＝過不足なく反応」「比例なら比例式」「グラフの傾き＝抵抗の逆数」</div><div class="note">入試：R7 3(3)(4) 酸化銅4.00gと炭素0.30gがちょうど／R7 4(1)〜(4) 電圧と電流のグラフから抵抗、温度上昇から時間</div></div>'
    + '</div>'

    + '<button class="start-btn" data-goto="1">🔬 Section 1：器具の使い方から始める →</button>';
}

// ===== SECTION 1: 器具 =====
function renderSection1(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔬 きょん＆西村の会話</div>'
    + chat('kyon','きょん','顕微鏡って、いきなり一番大きい倍率で見ればいいんじゃないの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','逆だ。最初は<strong>低倍率</strong>。視野が広くて明るいから、まず見たいものを探す。見つけてから高倍率にする。')
    + chat('kyon','きょん','視野の右上に見えてるやつを真ん中にしたいときは、プレパラートを左下に動かす？')
    + chat('nishi','西村','それが定番のひっかけ。顕微鏡は上下左右が逆に見えるから、右上に見えるものの実物は左下にある。だからプレパラートを<strong>右上に</strong>動かすと、実物が中央に来る。「見えた方向と同じ方向に動かす」と覚える。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔬 顕微鏡・ルーペ</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgMicro + '</div>'
    + '<div class="rule-box"><div class="rule-title">顕微鏡の手順</div><div class="ex">① 直射日光の当たらない明るい場所に置く　② <strong>低倍率</strong>から（接眼レンズ→対物レンズの順につける）　③ 横から見ながら対物レンズとプレパラートを<strong>近づける</strong>　④ 接眼レンズをのぞきながら<strong>遠ざけて</strong>ピントを合わせる<br>・倍率＝接眼×対物（例：10×40＝400倍）<br>・高倍率にすると：視野は<strong>せまく暗く</strong>なり、対物レンズとプレパラートの距離は<strong>短く</strong>なる<br>・見えた方向と<strong>同じ方向</strong>にプレパラートを動かす（上下左右が逆に見えるため）</div></div>'
    + '<div class="rule-box"><div class="rule-title">ルーペ</div><div class="ex">ルーペは<strong>目に近づけて固定</strong>。動かせるもの（化石・花）→ <strong>ものを動かす</strong>。動かせないもの（木の幹）→ <strong>顔を動かす</strong></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔬 メスシリンダー・ガスバーナー・電流計</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgMeasure + '</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgCircuit + '</div>'
    + '<div class="rule-box"><div class="rule-title">ガスバーナー</div><div class="ex">点火：元栓→コック→<strong>ガス調節ねじ</strong>（下）を開けて点火→<strong>空気調節ねじ</strong>（上）で青い炎に<br>消火：逆の順（空気→ガス→コック→元栓）<br>ねじは両方とも<strong>反時計回りで開く</strong></div></div>'
    + '<div class="rule-box"><div class="rule-title">電流計・電圧計</div><div class="ex">電流計＝<strong>直列</strong>、電圧計＝<strong>並列</strong>。＋端子は電源の＋側。−端子は<strong>最大の端子から</strong>（電流計5A、電圧計300V）。針が小さすぎたら小さい端子へ</div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔬 気体・液体の操作</div>'
    + '<div class="rule-box"><div class="rule-title">気体の集め方</div><div class="ex"><strong>水上置換</strong>：水にとけにくい気体（酸素・水素・二酸化炭素も可）　<strong>上方置換</strong>：水にとけやすく空気より軽い（アンモニア）　<strong>下方置換</strong>：水にとけやすく空気より重い（二酸化炭素・塩化水素）<br>最初に出てくる気体は装置内の空気なので<strong>集めない</strong></div></div>'
    + '<div class="rule-box"><div class="rule-title">加熱実験の注意（R7 3で出た）</div><div class="ex">試験管の口を<strong>少し下げる</strong>（水が加熱部に流れて割れるのを防ぐ）<br>火を消す前に<strong>ガラス管を石灰水から抜く</strong>（石灰水が逆流するのを防ぐ）<br>冷めるまで<strong>ピンチコックでゴム管を閉じる</strong>（空気が入って銅が再び酸化されるのを防ぐ）</div></div>'
    + '<div class="rule-box"><div class="rule-title">指示薬・検出</div><div class="ex">石灰水→二酸化炭素で<strong>白くにごる</strong>　BTB液→酸性<strong>黄</strong>・中性<strong>緑</strong>・アルカリ性<strong>青</strong>　リトマス紙→酸性で青→赤、アルカリ性で赤→青　フェノールフタレイン→アルカリ性で<strong>赤</strong>　塩化コバルト紙→水で青→<strong>赤</strong>　ヨウ素液→デンプンで<strong>青紫</strong>　石灰岩＋塩酸→<strong>二酸化炭素</strong>の泡</div></div>'
    + '<div class="rule-box"><div class="rule-title">ろ過・密度</div><div class="ex">ろ過：ろうとの先を<strong>ビーカーの壁につける</strong>、液は<strong>ガラス棒を伝わらせて</strong>注ぐ<br>密度＝質量÷体積（g/cm³）。同じ密度なら、質量が1.5倍→体積も1.5倍</div></div>'
    + '</div>';

  var qs = [
    { qid:'sci_lab_s1_q0', short:'顕微鏡：倍率の順', jp:'顕微鏡で観察するとき、最初に使う倍率は？',
      answer:'低倍率', choices:['低倍率','高倍率','どちらでもよい','中倍率'],
      exp:'🔬 <strong>低倍率</strong>から。視野が広く明るいので、見たいものを探しやすい<br>✅ R7 6(2) Ⅱ「初めは高倍率で」は誤り' },
    { qid:'sci_lab_s1_q1', short:'顕微鏡：プレパラートの向き', jp:'視野の右上に見えた対象物を視野の中心に動かすには、プレパラートをどちらへ動かす？',
      answer:'右上', choices:['右上','左下','右下','左上'],
      exp:'🔬 上下左右が逆に見える → 実物は左下にある → プレパラートを<strong>右上</strong>へ動かすと実物が中央へ<br>✅ R7 6(2) Ⅰ「左下に動かす」は誤り。「見えた方向と同じ方向」と覚える' },
    { qid:'sci_lab_s1_q2', short:'顕微鏡：正しい操作の組み合わせ', jp:'顕微鏡の使い方について、正しいものを<strong>全て選んだ</strong>組み合わせは？<br><span style="font-size:13px;color:var(--text2)">Ⅰ 視野の右上に見えたものを中心に動かすには、プレパラートを左下に動かす／Ⅱ 対象の大きさがわからないときは、初めは高倍率で観察する／Ⅲ 接眼レンズを変えずに対物レンズを10倍から40倍にすると、対物レンズとプレパラートの間の距離は短くなる／Ⅳ ピントを合わせるときは、接眼レンズをのぞきながら対物レンズとプレパラートを少しずつ遠ざける</span>',
      answer:'ⅢとⅣ', choices:['ⅢとⅣ','ⅠとⅡ','ⅠとⅢ','ⅡとⅣ'],
      exp:'🔬 Ⅰ×（右上に動かす）Ⅱ×（低倍率から）Ⅲ○（高倍率ほど対物レンズが長く、距離が短い）Ⅳ○（近づけてから、のぞきながら遠ざける）<br>✅ R7 6(2) そのまま。答えはカ' },
    { qid:'sci_lab_s1_q3', short:'ルーペ：化石の観察', jp:'手に持った化石をルーペで観察するときの正しい手順は？',
      answer:'ルーペを目に近づけ、化石だけを前後に動かしてピントを合わせる', choices:['ルーペを目に近づけ、化石だけを前後に動かしてピントを合わせる','ルーペを化石に近づけ、ルーペと化石を一緒に動かす','ルーペを化石に近づけ、ルーペだけを動かす','ルーペを目に近づけ、ルーペだけを動かす'],
      exp:'🔬 ルーペは<strong>目に近づけて固定</strong>。動かせるものは<strong>ものを動かす</strong><br>✅ R7 5(1) そのまま（エ）' },
    { qid:'sci_lab_s1_q4', short:'メスシリンダー：読み方', jp:'メスシリンダーの目盛りを読むときの正しい方法は？',
      answer:'目を液面と同じ高さにして、へこんだ液面の底を読む', choices:['目を液面と同じ高さにして、へこんだ液面の底を読む','上からのぞきこんで、液面の一番高いところを読む','目を液面より上にして、液面の縁を読む','斜め下から見上げて読む'],
      exp:'🔬 水平な台・目の高さ・<strong>へこんだ面の底</strong>。最小目盛りの1/10まで読む<br>✅ R7 6(1) はこの読み方で水面の図を選ぶ' },
    { qid:'sci_lab_s1_q5', short:'密度：金属柱Bの体積', type:'input', jp:'金属柱Aは質量10.00g、体積3.7cm³。金属柱Bは質量15.00gで、密度はAと同じ。Bの体積はおよそ何cm³？（小数第1位まで）<br><span style="font-size:12px;color:var(--text2)">（R7 6(1)。メスシリンダーの水50.0cm³に沈めると水面は約55.6cm³になる）</span>', formula:'同じ密度 → 質量の比＝体積の比', answer:'5.6', xp:7, hint:'15÷10＝1.5倍 → 3.7×1.5',
      exp:'✅ 密度が同じ → 体積も1.5倍 → 3.7×1.5＝5.55 ≒ <strong>5.6</strong>cm³ → 水面は50.0＋5.6＝55.6cm³付近' },
    { qid:'sci_lab_s1_q6', short:'ガスバーナー：点火の順', jp:'ガスバーナーに火をつけるとき、最後に調節するねじは？',
      answer:'空気調節ねじ（青い炎にする）', choices:['空気調節ねじ（青い炎にする）','ガス調節ねじ','元栓','コック'],
      exp:'🔬 元栓→コック→<strong>ガス調節ねじ</strong>を開けて点火→<strong>空気調節ねじ</strong>で青い炎に<br>💡 赤い炎＝空気不足' },
    { qid:'sci_lab_s1_q7', short:'電流計・電圧計のつなぎ方', jp:'電流計と電圧計のつなぎ方の組み合わせとして正しいものは？',
      answer:'電流計は直列、電圧計は並列', choices:['電流計は直列、電圧計は並列','電流計は並列、電圧計は直列','両方とも直列','両方とも並列'],
      exp:'🔬 電流計＝流れる量を数える→<strong>直列</strong>。電圧計＝両端の差を測る→<strong>並列</strong><br>✅ R7 4・R5 6 の回路図はすべてこの形' },
    { qid:'sci_lab_s1_q8', short:'電流計：−端子', jp:'電流の大きさが予想できないとき、電流計の−端子はどれにつなぐ？',
      answer:'5A（最大）', choices:['5A（最大）','50mA（最小）','500mA','どれでもよい'],
      exp:'🔬 <strong>最大の端子</strong>から。針が振り切れて壊れるのを防ぐ。小さすぎたら小さい端子へ' },
    { qid:'sci_lab_s1_q9', short:'ガラス管を抜く理由', jp:'酸化銅と炭素を加熱する実験で、ガスバーナーの火を消す前にガラス管を石灰水から取り出す理由は？',
      answer:'試験管の中に石灰水が流れ込むのを防ぐため', choices:['試験管の中に石灰水が流れ込むのを防ぐため','試験管の中で発生した気体を集めるため','試験管の中に空気が入り込むのを防ぐため','試験管の中の物質が押し出されるのを防ぐため'],
      exp:'🔬 火を消すと試験管内の気体が冷えて縮む → 石灰水が<strong>逆流</strong>して試験管が割れる<br>✅ R7 3(2) Ⅰ（エ）' },
    { qid:'sci_lab_s1_q10', short:'ピンチコックの理由', jp:'同じ実験で、火を消したあとピンチコックでゴム管をとめる理由は？',
      answer:'試験管の中に空気が入り込むのを防ぐため', choices:['試験管の中に空気が入り込むのを防ぐため','試験管の中に石灰水が流れ込むのを防ぐため','発生した気体を集めるため','物質が押し出されるのを防ぐため'],
      exp:'🔬 空気（酸素）が入ると、できた<strong>銅が再び酸化</strong>されて黒くなる<br>✅ R7 3(2) Ⅱ（ウ）' },
    { qid:'sci_lab_s1_q11', short:'気体の集め方：アンモニア', jp:'水にとけやすく、空気より軽い気体（アンモニア）の集め方は？',
      answer:'上方置換', choices:['上方置換','下方置換','水上置換','どれでもよい'],
      exp:'🔬 水にとける→水上置換は×。空気より<strong>軽い</strong>→上にたまる→<strong>上方置換</strong>' },
    { qid:'sci_lab_s1_q12', short:'石灰水・BTB', jp:'二酸化炭素を通すと白くにごる液体と、酸性で黄色になる指示薬の組み合わせは？',
      answer:'石灰水／BTB液', choices:['石灰水／BTB液','BTB液／石灰水','フェノールフタレイン液／石灰水','石灰水／ヨウ素液'],
      exp:'🔬 <strong>石灰水</strong>＝CO₂で白濁。<strong>BTB</strong>＝酸性黄・中性緑・アルカリ青<br>💡 R7 5(3)：石灰岩に塩酸→泡＝二酸化炭素' },
    { qid:'sci_lab_s1_q13', short:'砂糖・食塩・デンプンの区別', jp:'白い物質A、B、Cを水に入れると、A・Bはとけて透明、Cはとけずに白くにごった。加熱するとA・Cは黒くこげ、Bはこげなかった。A・B・Cは？',
      answer:'A：砂糖　B：食塩　C：デンプン', choices:['A：砂糖　B：食塩　C：デンプン','A：食塩　B：砂糖　C：デンプン','A：デンプン　B：食塩　C：砂糖','A：砂糖　B：デンプン　C：食塩'],
      exp:'🔬 水にとけない→<strong>デンプン</strong>（C）。こげない→無機物の<strong>食塩</strong>（B）。とけて、こげる→<strong>砂糖</strong>（A）<br>✅ R6 1(2) そのまま（ア）' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 2: 実験文の読み方 =====
function renderSection2(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔬 きょん＆西村の会話</div>'
    + chat('kyon','きょん','〔実験〕①から⑦まで読んだけど、結局何をしたのかわからない…')
    + chat('nishi','西村真二（慶應卒・元アナ）','全部覚えなくていい。探すのは3つだけ。①<strong>変えたもの</strong>——「〜を0.18g、0.24g、0.30g…に変えて」と書いてある。②<strong>測ったもの</strong>——「〜の質量を測定した」。③<strong>同じにしたもの</strong>——「酸化銅の質量は4.00gのまま」。')
    + chat('kyon','きょん','「変えた・測った・同じ」を線で囲めばいいのか！')
    + chat('nishi','西村','そう。あと「ただし」「なお」は必ず読む。「ただし、熱は全て水の温度上昇に使われる」「なお、電熱線Cの抵抗はAの2倍」——これがないと解けない。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔬 実験文を読む3つのコツ</div>'
    + '<div class="rule-box"><div class="rule-title">① 変えたもの（横軸になるもの）</div><div class="ex">「〜を…に変えて」「〜をかえて同じことを行った」→ 表の横に並ぶ数字</div></div>'
    + '<div class="rule-box"><div class="rule-title">② 測ったもの（結果・縦軸になるもの）</div><div class="ex">「〜を測定した」「〜のようすを観察した」→ 表の下の行・グラフの縦軸</div></div>'
    + '<div class="rule-box"><div class="rule-title">③ 同じにしたもの（条件）</div><div class="ex">「〜のまま」「同じ質量の水」「電圧計の目盛りが③と同じ値」→ 比べるために固定した条件。<strong>比べたいもの以外は全部同じにする</strong>のが実験の基本</div></div>'
    + '<div class="rule-box"><div class="rule-title">「ただし」「なお」＝ヒント</div><div class="ex">「ただし、反応後の気体の質量は無視できる」「なお、電熱線Cの抵抗はAの2倍」→ 計算に使う前提</div></div>'
    + '</div>';

  var lab1 = labBox('〔実験〕（R7 大問3 酸化銅と炭素）', [
    '黒色の酸化銅4.00gと乾燥した炭素粉末0.12gをよく混ぜ合わせ、試験管に入れた。',
    '①の試験管をスタンドに取り付け、ビーカーに石灰水を入れて装置を組み立てた。',
    'ガスバーナーで試験管を十分に加熱して気体を発生させ、この気体を石灰水に通して、石灰水のようすを観察した。',
    '気体が発生しなくなってから、ガラス管をビーカーから取り出し、火を消してから、ピンチコックでゴム管をとめた。',
    '試験管を室温まで冷ましてから、試験管内の物質のようすを観察し、質量を測定した。',
    '試験管内の物質の一部を薬さじで強くこすり、ようすを観察した。',
    '酸化銅の質量は4.00gのまま、炭素粉末の質量を0.18g、0.24g、0.30g、0.36g、0.42gに変えて、①から⑥までと同じことを行った。'
  ]);
  var lab2 = labBox('〔実験2〕（R7 大問4 電熱線）', [
    '2つの空の発泡ポリスチレン容器a、bのそれぞれに、室温で同じ質量の水を入れた。',
    '電源装置、スイッチ、電熱線A、電圧計を導線でつなぎ、電熱線Aを容器aの水の中に入れた。',
    '回路のスイッチを入れ、電圧計の目盛りがある値を示すように電源装置を調整した。',
    '容器aの水の温度を測定し、すぐにストップウォッチのスタートボタンを押した。',
    '容器aの水をかき混ぜながら、水の温度を1分ごとに測定した。',
    '次に、電熱線Aを電熱線Bに、容器aを容器bにかえて、②から⑤までと同じことを行った。ただし、電圧計の目盛りが③と同じ値を示すように電源装置を調整した。'
  ]);
  var lab3 = labBox('〔実験〕（R6 大問5 ミョウバンの結晶）', [
    '同じ大きさのペトリ皿W、X、Y、Zを用意した。',
    '水100gにミョウバン50gをすべてとかして60℃の水溶液をつくり、60℃にあたためたペトリ皿W、Xに半分ずつ入れた。',
    '水100gにミョウバン30gをすべてとかして60℃の水溶液をつくり、60℃にあたためたペトリ皿Y、Zに半分ずつ入れた。',
    'W、Yは「小さな結晶が十数個できた後、氷水に浮かべて放置」、X、Zは「60℃の湯に浮かべて放置」という条件で冷やし、60分後の結晶のようすを観察した。'
  ]);

  var qs = [
    { qid:'sci_lab_s2_q0', short:'酸化銅実験：変えたもの', jp:lab1 + 'この〔実験〕で<strong>変えたもの</strong>は？',
      answer:'炭素粉末の質量', choices:['炭素粉末の質量','酸化銅の質量','加熱時間','石灰水の量'],
      exp:'🔬 ⑦「炭素粉末の質量を0.18g、0.24g…に変えて」<br>✅ 表1の横に並ぶのは炭素の質量' },
    { qid:'sci_lab_s2_q1', short:'酸化銅実験：同じにしたもの', jp:'同じ〔実験〕で<strong>同じにしたもの</strong>は？',
      answer:'酸化銅の質量（4.00g）', choices:['酸化銅の質量（4.00g）','炭素粉末の質量','反応後の物質の質量','発生した気体の量'],
      exp:'🔬 ⑦「酸化銅の質量は4.00gのまま」<br>💡 比べたいもの（炭素の量）以外は固定する' },
    { qid:'sci_lab_s2_q2', short:'酸化銅実験：測ったもの', jp:'同じ〔実験〕で<strong>測ったもの</strong>は？',
      answer:'反応後の試験管内の物質の質量', choices:['反応後の試験管内の物質の質量','発生した気体の体積','石灰水の温度','加熱にかかった時間'],
      exp:'🔬 ⑤「試験管内の物質の質量を測定した」<br>✅ 表1の下の行「反応後の試験管内の物質の質量」' },
    { qid:'sci_lab_s2_q3', short:'酸化銅実験：起こった化学変化', jp:'同じ〔実験〕で、③では石灰水が白くにごり、⑥では赤色の金属光沢が見られた。試験管内で起こった化学変化として最も適当なものは？',
      answer:'反応した物質は酸化銅と炭素であり、酸化銅は還元され、炭素は酸化された', choices:['反応した物質は酸化銅と炭素であり、酸化銅は還元され、炭素は酸化された','反応した物質は酸化銅のみであり、酸化銅は還元された','反応した物質は酸化銅と炭素であり、どちらも酸化された','反応した物質は酸化銅と炭素であり、酸化銅は酸化され、炭素は還元された'],
      exp:'🔬 白濁＝<strong>二酸化炭素</strong>（炭素が酸素をもらった＝酸化）。赤色の金属光沢＝<strong>銅</strong>（酸化銅が酸素を失った＝還元）<br>2CuO＋C→2Cu＋CO₂<br>✅ R7 3(1)（オ）' },
    { qid:'sci_lab_s2_q4', short:'電熱線実験2：変えたもの', jp:lab2 + '〔実験2〕で<strong>変えたもの</strong>は？',
      answer:'電熱線（AからBへ）', choices:['電熱線（AからBへ）','電圧','水の質量','測定する時間'],
      exp:'🔬 ⑥「電熱線Aを電熱線Bにかえて」。電圧は「③と同じ値」で固定<br>💡 抵抗の違いによる発熱の差を調べる実験' },
    { qid:'sci_lab_s2_q5', short:'電熱線実験2：ただし書き', jp:'〔実験2〕の⑥「ただし、電圧計の目盛りが③と同じ値を示すように調整した」は何のため？',
      answer:'電圧を同じにして、電熱線の違いだけを比べるため', choices:['電圧を同じにして、電熱線の違いだけを比べるため','電流を大きくするため','水の温度を同じにするため','電熱線を長持ちさせるため'],
      exp:'🔬 電圧が違うと発熱も変わってしまう → <strong>電圧をそろえて</strong>、抵抗の違いだけを見る<br>💡 これが「同じにしたもの」' },
    { qid:'sci_lab_s2_q6', short:'電熱線：抵抗の比', jp:'〔実験2〕の結果、6分後に容器aの水は8.0℃、容器bの水は2.0℃上昇した。電熱線Aと電熱線Bの抵抗の比は？',
      answer:'A：B＝1：4', choices:['A：B＝1：4','A：B＝4：1','A：B＝1：2','A：B＝2：1'],
      exp:'🔬 同じ電圧なら 発熱量＝電圧²÷抵抗 → 発熱が1/4ならBの抵抗は<strong>4倍</strong><br>✅ R7 4(2)（エ）。「電圧が同じ」という条件を使う' },
    { qid:'sci_lab_s2_q7', short:'ミョウバン：何を比べる実験か', jp:lab3 + '「結晶の大きさの違いが、<strong>冷え方の違い</strong>によるもの」だと調べるには、ペトリ皿Wとどれを比べる？',
      answer:'X（同じ濃さで、冷え方だけ違う）', choices:['X（同じ濃さで、冷え方だけ違う）','Y（同じ冷え方で、濃さが違う）','Z（濃さも冷え方も違う）','W以外の全部'],
      exp:'🔬 冷え方だけを比べたい → <strong>濃さは同じ</strong>にする → Wと同じ50gの<strong>X</strong><br>✅ R6 5(3) Ⅱ。「比べたいもの以外は同じにする」の典型' },
    { qid:'sci_lab_s2_q8', short:'ミョウバン：結晶と冷え方', jp:'〔実験〕の結果、湯に浮かべてゆっくり冷やしたX、Zでは「同じくらいの大きさの、大きな結晶」ができた。ここからわかることは？',
      answer:'ゆっくり冷えると大きな結晶ができる', choices:['ゆっくり冷えると大きな結晶ができる','急に冷えると大きな結晶ができる','濃いほど大きな結晶ができる','温度は結晶の大きさに関係ない'],
      exp:'🔬 <strong>ゆっくり冷える→大きな結晶</strong>（火成岩の等粒状組織＝地下深くでゆっくり）、急に冷える→小さな結晶＋ガラス質（斑状組織＝地表付近）<br>✅ R6 5(4) につながる' },
    { qid:'sci_lab_s2_q9', short:'発芽実験：対照実験', jp:'「種子の発芽に光が必要か」を調べたい。正しい実験の組み方は？',
      answer:'光の有無だけを変え、水・温度・空気は同じにする', choices:['光の有無だけを変え、水・温度・空気は同じにする','光と水の両方を変える','光を当てた種子だけを観察する','温度を変えて比べる'],
      exp:'🔬 <strong>対照実験</strong>：調べたい条件だけを変え、他は全部同じ。2つ以上変えると、どちらが原因かわからない' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題（本物の実験文で） ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 3: 表・グラフ =====
function renderSection3(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">🔬 きょん＆西村の会話</div>'
    + chat('kyon','きょん','表の数字がいっぱいあって、どこを見ればいいのかわからない。')
    + chat('nishi','西村真二（慶應卒・元アナ）','「変化が止まったところ」を探す。酸化銅の表なら、炭素を増やしても反応後の質量が減らなくなった点。そこが「ちょうど反応した」点で、それより先は炭素が余っている。')
    + chat('kyon','きょん','減らなくなったところがゴール！')
    + chat('nishi','西村','そう。グラフなら「原点を通る直線＝比例」。電圧と電流なら、傾きが大きいほど電流が流れやすい＝抵抗が小さい。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">🔬 表・グラフの読み方</div>'
    + '<div class="rule-box"><div class="rule-title">「変化が止まった点」＝過不足なく反応</div><div class="ex">表で数値が減らなく（増えなく）なった最初の点を探す。その点の比が「ちょうど反応する比」。<br>それより少ない→片方が余る、多い→もう片方が余る</div></div>'
    + '<div class="rule-box"><div class="rule-title">比例式で計算</div><div class="ex">4.00gの酸化銅と0.30gの炭素がちょうど → 3.60gの酸化銅には 3.60×0.30/4.00＝0.27gの炭素が必要</div></div>'
    + '<div class="rule-box"><div class="rule-title">グラフ</div><div class="ex">原点を通る直線＝<strong>比例</strong>。電圧－電流グラフの傾き＝1/抵抗（傾きが急＝抵抗小）<br>抵抗＝電圧÷電流、発熱量（J）＝電力（W）×時間（秒）、電力＝電圧×電流<br>温度上昇のグラフ：同じ時間で高い方が発熱大。同じ温度に達するまでの時間は発熱に反比例</div></div>'
    + '</div>';

  var t1 = tbl(['酸化銅〔g〕','4.00','4.00','4.00','4.00','4.00','4.00'], [
    ['炭素粉末〔g〕','0.12','0.18','0.24','0.30','0.36','0.42'],
    ['反応後の質量〔g〕','3.68','3.52','3.36','<strong style="color:var(--gold)">3.20</strong>','3.26','3.32'],
    ['物質のようす','赤＋黒','赤＋黒','赤＋黒','<strong style="color:var(--gold)">赤のみ</strong>','赤＋黒','赤＋黒']
  ]);
  var t2 = tbl(['','A','B','C','D','E','F'], [
    ['酸化銅〔g〕','1.00','1.50','2.00','2.50','3.00','3.50'],
    ['炭素粉末〔g〕','0.06','0.14','0.20','0.20','0.25','0.25']
  ]);

  var qs = [
    { qid:'sci_lab_s3_q0', short:'表：ちょうど反応した点', jp:t1 + '酸化銅4.00gと過不足なく反応する炭素の質量は？',
      answer:'0.30g', choices:['0.30g','0.24g','0.36g','0.42g'],
      exp:'🔬 反応後の質量が<strong>減らなくなった点</strong>＝0.30g。しかも「赤色のみ」（黒い物質が残らない）<br>💡 0.36g以降は質量が増える＝余った炭素が加わっている' },
    { qid:'sci_lab_s3_q1', short:'表：発生した気体の質量', type:'input', jp:'同じ表で、炭素0.30gのとき発生した二酸化炭素の質量は何g？（4.00＋0.30−反応後の質量）', formula:'反応前の合計 − 反応後の質量', answer:'1.10', xp:6, hint:'4.30−3.20',
      exp:'✅ 4.00＋0.30−3.20＝<strong>1.10</strong>g（質量保存の法則：減った分が気体として出ていった）' },
    { qid:'sci_lab_s3_q2', short:'表：黒い物質は何か', jp:'酸化銅を3.60g、炭素を0.24gに変えて同じ実験をした。反応後に残る<strong>黒い物質</strong>の質量と化学式は？',
      answer:'0.40g、CuO', choices:['0.40g、CuO','0.03g、C','0.27g、C','0.32g、Cu'],
      exp:'🔬 3.60gの酸化銅に必要な炭素＝3.60×0.30/4.00＝0.27g。あるのは0.24g → <strong>炭素が足りない＝酸化銅が余る</strong><br>炭素0.24gと反応する酸化銅＝0.24×4.00/0.30＝3.20g → 余り＝3.60−3.20＝<strong>0.40g</strong>の<strong>CuO</strong>（黒）<br>✅ R7 3(3)（f・ウ）' },
    { qid:'sci_lab_s3_q3', short:'表：炭素だけが余る組み合わせ', jp:t2 + '表のAからFのうち、反応後に黒い物質が<strong>炭素のみ</strong>となる（炭素が余る）組み合わせは？<br><span style="font-size:12px;color:var(--text2)">ちょうど反応する比は 酸化銅：炭素＝4.00：0.30</span>',
      answer:'B、C、D、E', choices:['B、C、D、E','A、C','A、F','D、E、F'],
      exp:'🔬 必要な炭素＝酸化銅×0.075：A 0.075（0.06は不足→CuO余り）、B 0.1125（0.14余る✓）、C 0.15（0.20✓）、D 0.1875（0.20✓）、E 0.225（0.25✓）、F 0.2625（0.25不足）<br>✅ R7 3(4)（キ）' },
    { qid:'sci_lab_s3_q4', short:'グラフ：抵抗を求める', jp:'電熱線Aの電圧と電流のグラフが原点を通る直線で、5.0Vのとき2.5Aだった。電熱線Aの抵抗は？',
      answer:'2.0Ω', choices:['2.0Ω','0.5Ω','1.0Ω','4.0Ω'],
      exp:'🔬 抵抗＝電圧÷電流＝5.0÷2.5＝<strong>2.0Ω</strong><br>✅ R7 4(1)（エ）' },
    { qid:'sci_lab_s3_q5', short:'グラフ：傾きと抵抗', jp:'電圧－電流グラフで、電熱線Aの直線の方が電熱線Bより傾きが急だった。正しいものは？',
      answer:'Aの方が抵抗が小さい', choices:['Aの方が抵抗が小さい','Aの方が抵抗が大きい','抵抗は同じ','電圧が同じなら電流も同じ'],
      exp:'🔬 傾き急＝同じ電圧で電流が多い＝流れやすい＝<strong>抵抗が小さい</strong>' },
    { qid:'sci_lab_s3_q6', short:'温度上昇：時間を読む', jp:'電熱線Aで6分間に水温が8.0℃上昇した（比例）。同じ条件で4.0℃上昇するのは何分後？',
      answer:'3分後', choices:['3分後','2分後','4分後','12分後'],
      exp:'🔬 比例 → 8.0℃で6分なら4.0℃は<strong>3分</strong><br>✅ R7 4(3) Ⅱ（ウ）' },
    { qid:'sci_lab_s3_q7', short:'並列：抵抗2倍の電熱線', jp:'電熱線A（抵抗R）と電熱線C（抵抗2R）を<strong>並列</strong>につなぎ、同じ電圧をかけた。それぞれの水の温度の関係は？',
      answer:'Aの水の方が高い（Cの発熱はAの半分）', choices:['Aの水の方が高い（Cの発熱はAの半分）','Cの水の方が高い','同じ','電圧によって変わる'],
      exp:'🔬 並列＝<strong>電圧が同じ</strong>。発熱＝電圧²÷抵抗 → 抵抗2倍のCは発熱<strong>半分</strong><br>✅ R7 4(3) Ⅰ（x）' },
    { qid:'sci_lab_s3_q8', short:'直列：時間が9倍', jp:'同じ2本を<strong>直列</strong>につなぎ、全体に実験2と同じ電圧をかけた。電熱線Aの水が4.0℃上昇するのは何分後？（並列のときは3分だった）',
      answer:'27分後', choices:['27分後','9分後','6分後','3分後'],
      exp:'🔬 直列＝全体の抵抗3R → 電流は1/3 → Aの発熱＝電流²×R＝<strong>1/9</strong> → 時間は9倍 → 3×9＝<strong>27分</strong><br>✅ R7 4(4)（コ）。並列と直列で「同じ電圧」の意味が変わる' },
    { qid:'sci_lab_s3_q9', short:'並列と直列の電流の比', jp:'電熱線A（50Ω）と電熱線B（100Ω）。3.0Vで並列につないだときの電流計の値は、直列につないだときの何倍？',
      answer:'4.5倍', choices:['4.5倍','2.0倍','3.0倍','1.5倍'],
      exp:'🔬 並列：A 60mA＋B 30mA＝90mA。直列：150Ωで20mA。90÷20＝<strong>4.5倍</strong><br>✅ R5 6(2)（ケ）' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 確認テスト — 器具・実験文・表の読み取り</div>'
    + '<div class="rule-box"><div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + '入試形式で <strong style="color:var(--gold)">20問</strong>。組み合わせ選択・全て選ぶ形式も！<br>'
    + 'きょん「変えた・測った・同じ！！」<br>'
    + '西村「表は変化が止まった点を探せ」'
    + '</div></div></div>';

  var qs = [
    { qid:'sci_lab_s4_q0', short:'テスト：顕微鏡の順', jp:'顕微鏡のピント合わせで正しいものは？', answer:'横から見ながら近づけ、のぞきながら遠ざける', choices:['横から見ながら近づけ、のぞきながら遠ざける','のぞきながら近づける','のぞきながら近づけ、横から見て遠ざける','最初から遠ざける'], exp:'🔬 近づけるときにレンズがぶつからないよう<strong>横から見る</strong>' },
    { qid:'sci_lab_s4_q1', short:'テスト：高倍率にすると', jp:'顕微鏡を高倍率にすると視野と明るさはどうなる？', answer:'視野はせまく、暗くなる', choices:['視野はせまく、暗くなる','視野は広く、明るくなる','視野はせまく、明るくなる','視野は広く、暗くなる'], exp:'🔬 拡大するほど見える範囲が<strong>せまく</strong>、光が分散して<strong>暗く</strong>' },
    { qid:'sci_lab_s4_q2', short:'テスト：倍率', type:'input', jp:'接眼レンズ15倍、対物レンズ40倍のときの顕微鏡の倍率は何倍？（数字だけ）', formula:'接眼×対物', answer:'600', xp:5, hint:'15×40', exp:'✅ 15×40＝<strong>600</strong>倍' },
    { qid:'sci_lab_s4_q3', short:'テスト：ルーペ（木の幹）', jp:'動かせない木の幹をルーペで観察するときは？', answer:'ルーペを目に近づけたまま、顔を前後に動かす', choices:['ルーペを目に近づけたまま、顔を前後に動かす','ルーペを幹に近づけ、ルーペを動かす','幹を動かす','ルーペを目から離して持つ'], exp:'🔬 動かせないものは<strong>顔（自分）を動かす</strong>' },
    { qid:'sci_lab_s4_q4', short:'テスト：メスシリンダー', jp:'メスシリンダーで液体の体積をはかるときの注意として正しいものは？', answer:'目を液面の高さに合わせ、へこんだ面の底を読む', choices:['目を液面の高さに合わせ、へこんだ面の底を読む','手に持って読む','液面の一番高い縁を読む','上から見下ろして読む'], exp:'🔬 水平な台・目の高さ・<strong>底</strong>' },
    { qid:'sci_lab_s4_q5', short:'テスト：気体の集め方（CO₂）', jp:'二酸化炭素を集める方法として適切なものを二つ選んだ組み合わせは？', answer:'水上置換と下方置換', choices:['水上置換と下方置換','上方置換と下方置換','水上置換と上方置換','上方置換のみ'], exp:'🔬 CO₂は水に少しとけるだけで空気より<strong>重い</strong> → 水上置換・下方置換' },
    { qid:'sci_lab_s4_q6', short:'テスト：試験管の口', jp:'固体を加熱する実験で、試験管の口を少し下げる理由は？', answer:'発生した水が加熱部に流れて試験管が割れるのを防ぐため', choices:['発生した水が加熱部に流れて試験管が割れるのを防ぐため','気体を集めやすくするため','火が近づきすぎないようにするため','固体がこぼれないようにするため'], exp:'🔬 口の方で水滴になった水が<strong>熱い底に流れる</strong>と割れる' },
    { qid:'sci_lab_s4_q7', short:'テスト：フェノールフタレイン', jp:'アルカリ性の水溶液に入れると赤色になる指示薬は？', answer:'フェノールフタレイン液', choices:['フェノールフタレイン液','BTB液','ヨウ素液','石灰水'], exp:'🔬 フェノールフタレイン＝<strong>アルカリ性で赤</strong>（酸性・中性は無色）。BTBはアルカリ性で青' },
    { qid:'sci_lab_s4_q8', short:'テスト：電圧計の−端子', jp:'電圧の大きさが予想できないとき、電圧計の−端子はどれにつなぐ？', answer:'300V', choices:['300V','3V','15V','どれでもよい'], exp:'🔬 <strong>最大</strong>から。針が振り切れるのを防ぐ' },
    { qid:'sci_lab_s4_q9', short:'テスト：対照実験', jp:'「植物の成長に肥料が必要か」を調べる対照実験として正しいものは？', answer:'肥料の有無だけを変え、水・光・温度は同じにする', choices:['肥料の有無だけを変え、水・光・温度は同じにする','肥料と水の両方を変える','肥料を与えた植物だけを観察する','光の量を変える'], exp:'🔬 調べたい条件<strong>だけ</strong>を変える' },
    { qid:'sci_lab_s4_q10', short:'テスト：変えたもの', jp:'「水の質量を100g、200g、300gに変えて、同じ電熱線で5分間加熱し、温度上昇を測った」。この実験で変えたものと測ったものは？', answer:'変えた：水の質量／測った：温度上昇', choices:['変えた：水の質量／測った：温度上昇','変えた：温度上昇／測った：水の質量','変えた：電熱線／測った：時間','変えた：時間／測った：水の質量'], exp:'🔬 「〜に変えて」＝変えたもの、「〜を測った」＝測ったもの' },
    { qid:'sci_lab_s4_q11', short:'テスト：ただし書き', jp:'「ただし、電熱線で生じた熱は全て水の温度上昇に使われるものとする」というただし書きの意味は？', answer:'熱が逃げないと考えて、発熱量＝水が受け取った熱として計算してよい', choices:['熱が逃げないと考えて、発熱量＝水が受け取った熱として計算してよい','水は温まらない','電熱線は発熱しない','容器が熱を吸収する'], exp:'🔬 現実には逃げる熱を<strong>無視してよい</strong>という前提。計算を単純にするためのヒント' },
    { qid:'sci_lab_s4_q12', short:'テスト：過不足なく反応', jp:'マグネシウムの質量を変えて加熱し、できた酸化マグネシウムの質量を測ったら「0.3→0.5、0.6→1.0、0.9→1.5、1.2→2.0（g）」だった。マグネシウム：酸素の質量比は？', answer:'3：2', choices:['3：2','3：5','2：3','1：1'], exp:'🔬 0.3gのMgから0.5gの酸化物 → 結びついた酸素0.2g → Mg：O＝0.3：0.2＝<strong>3：2</strong>' },
    { qid:'sci_lab_s4_q13', short:'テスト：質量保存', type:'input', jp:'酸化銅4.00gと炭素0.36gを加熱し、反応後の質量が3.26gだった。発生した気体の質量は何g？（小数第2位まで）', formula:'（4.00＋0.36）−3.26', answer:'1.10', xp:6, hint:'4.36−3.26', exp:'✅ 4.36−3.26＝<strong>1.10</strong>g。0.30gのときと同じ（炭素が余っただけで反応量は同じ）' },
    { qid:'sci_lab_s4_q14', short:'テスト：抵抗の計算', type:'input', jp:'電熱線に6.0Vの電圧をかけたら1.5Aの電流が流れた。抵抗は何Ω？（数字だけ）', formula:'電圧÷電流', answer:'4', xp:5, hint:'6.0÷1.5', exp:'✅ 6.0÷1.5＝<strong>4</strong>Ω' },
    { qid:'sci_lab_s4_q15', short:'テスト：電力', type:'input', jp:'同じ電熱線（6.0V、1.5A）の電力は何W？（数字だけ）', formula:'電圧×電流', answer:'9', xp:5, hint:'6.0×1.5', exp:'✅ 6.0×1.5＝<strong>9</strong>W' },
    { qid:'sci_lab_s4_q16', short:'テスト：発熱量', type:'input', jp:'9Wの電熱線で2分間加熱したときの発熱量は何J？（数字だけ）', formula:'電力×時間（秒）', answer:'1080', xp:6, hint:'9×120', exp:'✅ 9×120＝<strong>1080</strong>J。時間は<strong>秒</strong>に直す' },
    { qid:'sci_lab_s4_q17', short:'テスト：並列の発熱', jp:'抵抗の異なる2本の電熱線を並列につないだとき、発熱量が大きいのは？', answer:'抵抗が小さい方', choices:['抵抗が小さい方','抵抗が大きい方','同じ','電圧による'], exp:'🔬 並列＝電圧が同じ → 発熱＝電圧²÷抵抗 → 抵抗<strong>小</strong>が大' },
    { qid:'sci_lab_s4_q18', short:'テスト：直列の発熱', jp:'抵抗の異なる2本の電熱線を直列につないだとき、発熱量が大きいのは？', answer:'抵抗が大きい方', choices:['抵抗が大きい方','抵抗が小さい方','同じ','電圧による'], exp:'🔬 直列＝電流が同じ → 発熱＝電流²×抵抗 → 抵抗<strong>大</strong>が大<br>💡 並列と逆になる。R7 4(3)(4)の核心' },
    { qid:'sci_lab_s4_q19', short:'テスト：染色体', jp:'雌の体細胞に染色体が2本（黒）、雄の体細胞に2本（白）ある動物。雄の生殖細胞と受精卵の染色体の組み合わせは？', answer:'生殖細胞：白1本／受精卵：黒1本＋白1本', choices:['生殖細胞：白1本／受精卵：黒1本＋白1本','生殖細胞：白2本／受精卵：黒2本＋白2本','生殖細胞：白1本／受精卵：白2本','生殖細胞：黒1本／受精卵：黒1本＋白1本'], exp:'🔬 生殖細胞は<strong>減数分裂</strong>で半分（1本）。受精卵は雌1本＋雄1本で元の数に戻る<br>✅ R5 6(1)（イ・オ）' },
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
  var msg = pct >= 90 ? 'きょん「実験文、完全に読めた！！」<br>西村「文句なし。器具の小問は満点でいける」'
          : pct >= 70 ? 'きょん「だいぶ読めるようになった！！」<br>西村「あと少し。間違えた器具だけ特訓で潰そう」'
          : pct >= 50 ? 'きょん「半分は取れた…！」<br>西村「弱点ノートで、器具か表かどちらが弱いか見よう」'
          : 'きょん「実験文、まだ迷子になる…」<br>西村「大丈夫。「変えた・測った・同じ」に線を引く癖から。特訓モードで反復」';
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
  var html = '<div class="section-header"><div class="section-badge">理科 実験の読み方 · 弱点ノート</div><div class="section-title">弱点ノート</div><div class="section-sub">間違えた問題を確認しよう</div></div>';
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
  var html = '<div class="section-header"><div class="section-badge" style="background:var(--red)">理科 実験の読み方 · 特訓</div><div class="section-title">弱点特訓モード</div><div class="section-sub">弱点問題を集中練習！</div></div>';
  if(wqs.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-size:16px;line-height:2">弱点なし！<br>きょん「実験マスター！！」</div></div>';
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
    + (pctAll >= 80 ? 'きょん「実験文、読めるようになった！！」' : 'きょん「まだ迷子になる…もう一回！！」') + '</div>'
    + '<button id="tokkuAgain" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer">🔥 もう一度特訓</button>'
    + '</div>';
  document.getElementById('tokkuAgain').addEventListener('click', function(){ renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
renderSection(0);
