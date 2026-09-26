// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:20,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「大問1？なにそれ食えるの？」' },
  { lv:2, min:20,  max:55,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「計算だけなら、いけるかも」' },
  { lv:3, min:55,  max:110, badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺、大問1いけるかも」' },
  { lv:4, min:110, max:185, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:185, max:280, badge:'📺 全国ネット',    title:'課長',          status:'きょん「にっくんより計算ミス減ってきた」' },
  { lv:6, min:280, max:400, badge:'🌟 冠番組',        title:'部長',          status:'きょん「大問1で漫才できるかもしれない」' },
  { lv:7, min:400, max:550, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:550, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('math_q1_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('math_q1_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('math_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;
var QID_PREFIX = 'math_q1_';

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
  localStorage.setItem('math_q1_answered', JSON.stringify(answeredSet));
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
  correct: ['きょん「合ってる！！大問1、余裕！！」', 'きょん「やった！！計算ミスしてない！！」', 'きょん「にっくん見て！解けた！！」'],
  nishi:   ['西村「正解。手順どおりにできてる」', '西村「できてる。その調子」', '西村「正確に計算できてる」']
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
// 数式を大きく表示
function fx(t){ return '<div style="font-size:19px;letter-spacing:0.06em;line-height:2;margin:4px 0 8px;color:var(--text)">' + t + '</div>'; }

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
  else { var msgs = ['きょん「あれ！間違えた！符号かな？もう一回！！」','きょん「また間違えた…！手順を一つずつ！！」','きょん「ルールカードを見直す！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('math_q1_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var inp = document.getElementById('inp_' + qid); if(inp){ inp.disabled = true; inp.value = meta.answer; var sb = document.querySelector('.input-submit[data-qid="' + qid + '"]'); if(sb) sb.style.display = 'none'; }
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で解く！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。解き方の手順を確認しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = QID_PREFIX + 's' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('math_q1_sections', JSON.stringify(sectionDone));
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
  { id:0, label:'📐 スタート',  title:'大問1は「10問セット」',   sub:'毎年同じ順番・同じ型。ここを全問取るのが最短ルート' },
  { id:1, label:'計算',         title:'(1)〜(4) 計算4問',       sub:'正負の数・文字式の分数・単項式の乗除・平方根' },
  { id:2, label:'方程式・関数', title:'(5)〜(7) 方程式・関数・文章題', sub:'二次方程式・%の文章題・不等式・一次関数・反比例' },
  { id:3, label:'データ・確率', title:'(7)〜(9) 確率・データ・整数', sub:'確率・標本調査・箱ひげ図・整数の性質・平方根の正誤' },
  { id:4, label:'図形',         title:'(10) 図形の小問',         sub:'角度・平行線と比・円周角・空間の平面' },
  { id:5, label:'模擬テスト',   title:'模擬 大問1（2セット）',    sub:'本番と同じ順番で10問×2セット' },
  { id:6, label:'📊弱点',       title:'弱点ノート',              sub:'間違えた問題を確認' },
  { id:7, label:'🔥特訓',       title:'弱点特訓モード',          sub:'弱点問題を集中練習！' },
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
    + '<div class="section-badge">数学 入試大問1 · SECTION ' + id + '</div>'
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
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">' + (q.no ? q.no : 'Q' + n) + '</div>';
    if(q.type === 'input') html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
    else html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
    n++;
  });
  return html;
}

// ===== SVG =====
var svgBox = '<svg viewBox="0 0 320 130" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="14" fill="#8b949e" font-size="10" text-anchor="middle">【箱ひげ図の5つの値】</text>'
  + '<line x1="30" y1="60" x2="90" y2="60" stroke="#e6edf3" stroke-width="2"/>'
  + '<rect x="90" y="42" width="130" height="36" fill="rgba(163,113,247,0.15)" stroke="#a371f7" stroke-width="2"/>'
  + '<line x1="150" y1="42" x2="150" y2="78" stroke="#f5c518" stroke-width="2.5"/>'
  + '<line x1="220" y1="60" x2="290" y2="60" stroke="#e6edf3" stroke-width="2"/>'
  + '<line x1="30" y1="50" x2="30" y2="70" stroke="#e6edf3" stroke-width="2"/>'
  + '<line x1="290" y1="50" x2="290" y2="70" stroke="#e6edf3" stroke-width="2"/>'
  + '<text x="30" y="95" fill="#8b949e" font-size="9" text-anchor="middle">最小値</text>'
  + '<text x="90" y="95" fill="#a371f7" font-size="9" text-anchor="middle">第1四分位数</text>'
  + '<text x="150" y="30" fill="#f5c518" font-size="9" text-anchor="middle" font-weight="bold">中央値（第2四分位数）</text>'
  + '<text x="220" y="95" fill="#a371f7" font-size="9" text-anchor="middle">第3四分位数</text>'
  + '<text x="290" y="95" fill="#8b949e" font-size="9" text-anchor="middle">最大値</text>'
  + '<line x1="90" y1="108" x2="220" y2="108" stroke="#a371f7" stroke-width="1" stroke-dasharray="3,2"/>'
  + '<text x="155" y="122" fill="#a371f7" font-size="9" text-anchor="middle">四分位範囲 ＝ 第3四分位数 − 第1四分位数（箱の長さ）</text>'
  + '</svg>';

var svgCircle = '<svg viewBox="0 0 320 150" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【円周角の3ルール】</text>'
  // circle 1: central angle
  + '<circle cx="60" cy="80" r="42" fill="none" stroke="#30363d" stroke-width="1.5"/>'
  + '<circle cx="60" cy="80" r="2" fill="#8b949e"/>'
  + '<line x1="60" y1="80" x2="30" y2="50" stroke="#f5c518" stroke-width="1.5"/>'
  + '<line x1="60" y1="80" x2="95" y2="55" stroke="#f5c518" stroke-width="1.5"/>'
  + '<line x1="60" y1="122" x2="30" y2="50" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="60" y1="122" x2="95" y2="55" stroke="#a371f7" stroke-width="1.5"/>'
  + '<text x="60" y="76" fill="#f5c518" font-size="9" text-anchor="middle">2a</text>'
  + '<text x="60" y="116" fill="#a371f7" font-size="9" text-anchor="middle">a</text>'
  + '<text x="60" y="140" fill="#e6edf3" font-size="9" text-anchor="middle">中心角＝円周角×2</text>'
  // circle 2: same arc
  + '<circle cx="160" cy="80" r="42" fill="none" stroke="#30363d" stroke-width="1.5"/>'
  + '<line x1="130" y1="112" x2="135" y2="45" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="130" y1="112" x2="195" y2="60" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="175" y1="118" x2="135" y2="45" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<line x1="175" y1="118" x2="195" y2="60" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<text x="134" y="104" fill="#a371f7" font-size="9">a</text>'
  + '<text x="170" y="112" fill="#0ea5e9" font-size="9">a</text>'
  + '<text x="160" y="140" fill="#e6edf3" font-size="9" text-anchor="middle">同じ弧→円周角は等しい</text>'
  // circle 3: diameter
  + '<circle cx="260" cy="80" r="42" fill="none" stroke="#30363d" stroke-width="1.5"/>'
  + '<line x1="218" y1="80" x2="302" y2="80" stroke="#e94560" stroke-width="2"/>'
  + '<line x1="218" y1="80" x2="245" y2="42" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="302" y1="80" x2="245" y2="42" stroke="#a371f7" stroke-width="1.5"/>'
  + '<text x="247" y="56" fill="#a371f7" font-size="9" text-anchor="middle">90°</text>'
  + '<text x="260" y="95" fill="#e94560" font-size="8" text-anchor="middle">直径</text>'
  + '<text x="260" y="140" fill="#e6edf3" font-size="9" text-anchor="middle">直径の上の円周角＝90°</text>'
  + '</svg>';

var svgAngle = '<svg viewBox="0 0 320 120" style="width:100%;max-width:360px;display:block;margin:0 auto">'
  + '<text x="160" y="12" fill="#8b949e" font-size="10" text-anchor="middle">【角度の基本ツール】</text>'
  // triangle exterior angle
  + '<polygon points="20,100 110,100 70,40" fill="none" stroke="#a371f7" stroke-width="1.5"/>'
  + '<line x1="110" y1="100" x2="150" y2="100" stroke="#a371f7" stroke-width="1.5" stroke-dasharray="3,2"/>'
  + '<text x="40" y="96" fill="#f5c518" font-size="9">a</text>'
  + '<text x="68" y="58" fill="#f5c518" font-size="9">b</text>'
  + '<text x="112" y="92" fill="#e94560" font-size="9">a+b</text>'
  + '<text x="80" y="116" fill="#e6edf3" font-size="9" text-anchor="middle">外角＝となり合わない2つの内角の和</text>'
  // parallel lines
  + '<line x1="190" y1="45" x2="310" y2="45" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<line x1="190" y1="90" x2="310" y2="90" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<line x1="215" y1="105" x2="285" y2="30" stroke="#e6edf3" stroke-width="1.5"/>'
  + '<text x="262" y="42" fill="#f5c518" font-size="9">a</text>'
  + '<text x="232" y="102" fill="#f5c518" font-size="9">a</text>'
  + '<text x="250" y="116" fill="#e6edf3" font-size="9" text-anchor="middle">平行線→錯角・同位角は等しい</text>'
  + '</svg>';

// ===== SECTION 0 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん（富士田恭兵）','入試の数学って、難しい図形とか関数とか、全部できないと無理でしょ…')
    + chat('nishi','西村真二（慶應卒・元アナ）','愛知県の数学は大問1が10問あって、毎年ほぼ同じ順番・同じ型で出る。(1)正負の計算、(2)文字式、(3)単項式か平方根、(4)平方根、(5)二次方程式、(6)文章題か不等式か関数、(7)反比例か確率、(8)標本調査か平方根の正誤、(9)確率かデータ、(10)図形の小問。')
    + chat('kyon','きょん','毎年同じ！？じゃあ型を覚えれば…')
    + chat('nishi','西村','そう。出版社の分析でも「大問1は正答率が高い。ここで点を落とさないように類題で練習を」と書かれている。難しい大問2・3の後半は捨ててもいい。大問1を全問取るのが最短ルートだ。')
    + chat('kyon','きょん','10問全部取る！！それなら俺にもできる気がしてきた！！')
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 大問1の10問マップ（R5〜R7の3年分から）</div>'
    + '<div class="rule-box"><div class="rule-title">(1)〜(4) 計算 → Section 1</div><div class="ex">(1) 正負の数の四則（÷と−が混ざる）<br>(2) 文字式の加減（分数の通分つき）<br>(3) 単項式の乗除 または 平方根の計算<br>(4) 平方根（乗法公式・式の値）</div></div>'
    + '<div class="rule-box"><div class="rule-title">(5)〜(7) 方程式・関数 → Section 2</div><div class="ex">(5) 二次方程式（展開して整理→因数分解 or 解の公式）<br>(6) 1次方程式の文章題（%の増減）／不等式／一次関数の判別／交点と平行な直線<br>(7) 反比例のグラフの性質（二つ選ぶ）／反比例の整数点</div></div>'
    + '<div class="rule-box"><div class="rule-title">(7)〜(9) 確率・データ → Section 3</div><div class="ex">確率（カード・さいころ）／標本調査（比例式）／ヒストグラム→箱ひげ図／整数の性質／平方根の正誤（二つ選ぶ）／変化の割合</div></div>'
    + '<div class="rule-box"><div class="rule-title">(10) 図形の小問 → Section 4</div><div class="ex">角度（三角形・円周角）／平行四辺形と線分の比／空間の平面（全て選ぶ）</div></div>'
    + '<div class="note">💡 全問マークシートの4択（(7)のように「二つ選ぶ」もある）。計算は選択肢と見比べて検算できるのが強み</div>'
    + '</div>'

    + '<button class="start-btn" data-goto="1">📐 Section 1：計算4問から始める →</button>';
}

// ===== SECTION 1: 計算 =====
function renderSection1(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん','6＋10÷(−2)って、6＋10を先にやって16÷(−2)＝−8じゃないの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','それが選択肢アの「−8」。ひっかけだ。<strong>÷と×は＋−より先</strong>。10÷(−2)＝−5を先に出して、6＋(−5)＝1。')
    + chat('kyon','きょん','選択肢に「間違えたときの答え」が並んでるのか…こわっ。')
    + chat('nishi','西村','だから「手順どおりに計算して、選択肢と照らす」だけでいい。大問1の計算4問は、手順を守れば必ず取れる。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 計算4問のルール</div>'
    + '<div class="rule-box"><div class="rule-title">(1) 正負の数：順番と符号</div><div class="ex">① かっこの中 → ② ×÷（左から）→ ③ ＋−（左から）<br>−(−6)＝＋6　　÷(−2)は「2で割って符号を反転」<br>例：4×(−3)−(−6)÷3 ＝ −12 − (−2) ＝ −12＋2 ＝ <strong style="color:var(--gold)">−10</strong></div></div>'
    + '<div class="rule-box"><div class="rule-title">(2) 文字式の加減：分数は通分して分子にかっこ</div><div class="ex">(3x−2)/6 − (2x−3)/9 → 分母を18にそろえる → {3(3x−2) − 2(2x−3)}/18<br>＝ (9x−6−4x+6)/18 ＝ <strong style="color:var(--gold)">5x/18</strong></div><div class="note">⚠️ 「−2(2x−3)」＝−4x<strong>＋6</strong>。マイナスをかっこの中の両方に配る</div></div>'
    + '<div class="rule-box"><div class="rule-title">(3) 単項式の乗除：÷は逆数のかけ算・2乗は全部に</div><div class="ex">(6a²b−12ab²)÷(2/3)ab ＝ (6a²b−12ab²)×3/(2ab) ＝ <strong style="color:var(--gold)">9a−18b</strong><br>6x²÷(−3xy)²×27xy² ＝ 6x²÷9x²y²×27xy² ＝ <strong style="color:var(--gold)">18x</strong></div><div class="note">⚠️ (−3xy)²＝9x²y²。マイナスも2乗するとプラス</div></div>'
    + '<div class="rule-box"><div class="rule-title">(4) 平方根：√の中を小さく・有理化・乗法公式</div><div class="ex">√12＝2√3、√20＝2√5（√の中を「□²×」に分ける）<br>9/√3 ＝ 9√3/3 ＝ 3√3（分母の√を消す＝有理化）<br>(√5−√2)(√5＋√2) ＝ 5−2 ＝ 3（和と差の積）<br>(√3＋√2)² ＝ 3＋2√6＋2 ＝ 5＋2√6</div></div>'
    + '</div>';

  var qs = [
    { qid:'math_q1_s1_q0', jp:'(1) 次を計算した結果として正しいものは？' + fx('6 ＋ 10 ÷ (−2)'),
      answer:'1', choices:['−8','1','8','11'],
      exp:'📐 ÷が先：10÷(−2)＝−5<br>6＋(−5)＝<strong style="color:var(--gold)">1</strong><br>❌ −8 は「6＋10を先に計算」した誤り。R7の入試そのまま' },
    { qid:'math_q1_s1_q1', jp:'(1) 次を計算した結果として正しいものは？' + fx('4 × (−3) − (−6) ÷ 3'),
      answer:'−10', choices:['−14','−10','−2','4'],
      exp:'📐 ×÷が先：4×(−3)＝−12、(−6)÷3＝−2<br>−12 − (−2) ＝ −12＋2 ＝ <strong style="color:var(--gold)">−10</strong><br>❌ −14 は「−12−2」とした誤り（−(−2)＝＋2）。R6の入試' },
    { qid:'math_q1_s1_q2', jp:'(1) 次を計算した結果として正しいものは？' + fx('6 − (−4) ÷ 2'),
      answer:'8', choices:['1','4','5','8'],
      exp:'📐 (−4)÷2＝−2 → 6−(−2)＝6＋2＝<strong style="color:var(--gold)">8</strong><br>❌ 1 は「6−(−4)＝10、10÷2」とした誤り。R5の入試' },
    { qid:'math_q1_s1_q3', jp:'(2) 次を計算した結果として正しいものは？' + fx('3(2x＋3) − 2(x−3)'),
      answer:'4x＋15', choices:['4x','4x＋3','4x＋6','4x＋15'],
      exp:'📐 6x＋9 −2x<strong>＋6</strong> ＝ <strong style="color:var(--gold)">4x＋15</strong><br>❌ 4x＋3 は「−2×(−3)」を−6にした誤り。マイナス×マイナス＝プラス。R7の入試' },
    { qid:'math_q1_s1_q4', jp:'(2) 次を計算した結果として正しいものは？' + fx('(3x−2)/6 − (2x−3)/9'),
      answer:'5x/18', choices:['(5x−12)/18','(13x−12)/18','5x/18','−2/3'],
      exp:'📐 通分（18）：{3(3x−2) − 2(2x−3)}/18<br>＝ (9x−6−4x＋6)/18 ＝ <strong style="color:var(--gold)">5x/18</strong><br>💡 定数は −6＋6＝0 で消える。R5の入試' },
    { qid:'math_q1_s1_q5', jp:'(2) 次を計算した結果として正しいものは？' + fx('(−2x＋1)/4 − (x−3)/3'),
      answer:'(−10x＋15)/12', choices:['−10x＋15','(−10x−9)/12','(−10x＋15)/12','(−5x＋5)/2'],
      exp:'📐 通分（12）：{3(−2x＋1) − 4(x−3)}/12 ＝ (−6x＋3−4x＋12)/12 ＝ <strong style="color:var(--gold)">(−10x＋15)/12</strong><br>⚠️ 5で約分できそうに見えるが、分母12は5で割れないのでこのまま。R6の入試' },
    { qid:'math_q1_s1_q6', jp:'(3) 次を計算した結果として正しいものは？' + fx('(6a²b − 12ab²) ÷ (2/3)ab'),
      answer:'9a−18b', choices:['−9ab','4a−8b','9a−2b','9a−18b'],
      exp:'📐 ÷(2/3)ab ＝ ×3/(2ab)<br>6a²b×3/(2ab)＝9a、12ab²×3/(2ab)＝18b → <strong style="color:var(--gold)">9a−18b</strong><br>💡 両方の項に同じものをかける。R6の入試' },
    { qid:'math_q1_s1_q7', jp:'(3) 次を計算した結果として正しいものは？' + fx('6x² ÷ (−3xy)² × 27xy²'),
      answer:'18x', choices:['−54x²y','−18xy','18x','54x²y²'],
      exp:'📐 (−3xy)²＝9x²y²（マイナスは消える）<br>6x²×27xy² ÷ 9x²y² ＝ 162x³y² ÷ 9x²y² ＝ <strong style="color:var(--gold)">18x</strong><br>R5の入試' },
    { qid:'math_q1_s1_q8', jp:'(3) 次を計算した結果として正しいものは？' + fx('9/√3 ＋ √2 × √6'),
      answer:'5√3', choices:['3√3','5√3','5√6','3√30'],
      exp:'📐 9/√3＝9√3/3＝3√3（有理化）　√2×√6＝√12＝2√3<br>3√3＋2√3＝<strong style="color:var(--gold)">5√3</strong><br>R7の入試' },
    { qid:'math_q1_s1_q9', jp:'(4) 次を計算した結果として正しいものは？' + fx('(√5 − √2)(√20 ＋ √8)'),
      answer:'6', choices:['6','4√5','2√21','14'],
      exp:'📐 √20＝2√5、√8＝2√2 → (√5−√2)×2(√5＋√2) ＝ 2×(5−2) ＝ <strong style="color:var(--gold)">6</strong><br>💡 和と差の積 (a−b)(a＋b)＝a²−b²。R5の入試' },
    { qid:'math_q1_s1_q10', jp:'(4) x＝√3＋√2、y＝√3−√2 のとき、x²＋xy−y² の値として正しいものは？',
      answer:'4√6＋1', choices:['1','11','4√6＋1','4√6＋11'],
      exp:'📐 x²＝3＋2√6＋2＝5＋2√6　y²＝5−2√6　xy＝3−2＝1<br>(5＋2√6)＋1−(5−2√6) ＝ <strong style="color:var(--gold)">4√6＋1</strong><br>⚠️ −y² のマイナスを (5−2√6) の両方に配る。R6の入試' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題（本番の4択形式） ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 2: 方程式・関数・文章題 =====
function renderSection2(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん','「11月は10月より30%増加」って、どう式にするの？30%って0.3？')
    + chat('nishi','西村真二（慶應卒・元アナ）','30%<strong>増加</strong>は「元の1.3倍」。10月をx人とすると11月は1.3x人。12月はさらに20%増だから1.3x×1.2＝1.56x人。「12月は10月より2800人多い」から 1.56x − x ＝ 2800。')
    + chat('kyon','きょん','0.56x＝2800 → x＝5000！選択肢のウ！')
    + chat('nishi','西村','正解。ポイントは「増加は×(1＋割合)、引きは×(1−割合)」。連立方程式で練習した「%を倍に直すルール」と同じだ。')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 (5)〜(7) のルール</div>'
    + '<div class="rule-box"><div class="rule-title">(5) 二次方程式：3ステップ</div><div class="ex">① 展開して全部左辺に集め、<strong>ax²＋bx＋c＝0</strong> の形にする<br>② 因数分解できる？（かけてc・たしてbの2数を探す）→ できたら (x＋p)(x＋q)＝0<br>③ できなければ解の公式 x＝{−b±√(b²−4ac)}/2a</div><div class="note">💡 選択肢が「x＝−4，3」なら因数分解型、「(−7±√37)/2」なら解の公式型。選択肢の形でどちらか予想できる</div></div>'
    + '<div class="rule-box"><div class="rule-title">(6) %の文章題：増加は×(1＋割合)、引きは×(1−割合)</div><div class="ex">30%増 → ×1.3　　20%引き → ×0.8　　「AはBより〜多い」→ A − B ＝ 〜</div></div>'
    + '<div class="rule-box"><div class="rule-title">(6) 不等式・関数の判別</div><div class="ex">「〜より軽い（小さい）」→ ＜　「〜以下」→ ≦　「〜以上」→ ≧<br>一次関数＝ y＝ax＋b の形（y＝3x のような比例も一次関数）。y＝100/x（反比例）、y＝πx²、y＝x³ は違う</div></div>'
    + '<div class="rule-box"><div class="rule-title">(6) 交点を通り、ある直線に平行な直線</div><div class="ex">① 2直線を連立して交点を求める → ② 平行＝<strong>傾きが同じ</strong> → ③ 交点を代入して切片bを求める</div></div>'
    + '<div class="rule-box"><div class="rule-title">(7) 反比例 y＝a/x</div><div class="ex">グラフは双曲線：<strong>原点について点対称</strong>、x軸・y軸とは<strong>交わらない</strong>、y＝x とは2点で交わる（a＞0のとき）<br>整数点＝aの約数のペア（正と負の両方を数える）</div></div>'
    + '</div>';

  var qs = [
    { qid:'math_q1_s2_q0', jp:'(5) 方程式の解として正しいものは？' + fx('x(x＋4) ＝ −3(x＋1)'),
      answer:'x＝(−7±√37)/2', choices:['x＝(−7±√37)/2','x＝(−7±√61)/2','x＝(7±√61)/2','x＝(7±√37)/2'],
      exp:'📐 展開：x²＋4x＝−3x−3 → x²＋7x＋3＝0（因数分解できない）<br>解の公式：x＝{−7±√(49−12)}/2＝<strong style="color:var(--gold)">(−7±√37)/2</strong><br>⚠️ b²−4ac＝49−12＝37。R7の入試' },
    { qid:'math_q1_s2_q1', jp:'(5) 方程式の解として正しいものは？' + fx('(x＋3)² − 11 ＝ 5(x＋2)'),
      answer:'x＝−4，3', choices:['x＝−4，−3','x＝−4，3','x＝−3，4','x＝3，4'],
      exp:'📐 x²＋6x＋9−11＝5x＋10 → x²＋x−12＝0<br>かけて−12・たして1 → 4と−3 → (x＋4)(x−3)＝0 → <strong style="color:var(--gold)">x＝−4，3</strong><br>R6の入試' },
    { qid:'math_q1_s2_q2', jp:'(5) 方程式の解として正しいものは？' + fx('(x−3)² ＝ −x ＋ 15'),
      answer:'x＝−1，6', choices:['x＝−6，1','x＝−3，−2','x＝−1，6','x＝2，3'],
      exp:'📐 x²−6x＋9＋x−15＝0 → x²−5x−6＝0<br>かけて−6・たして−5 → −6と1 → (x−6)(x＋1)＝0 → <strong style="color:var(--gold)">x＝−1，6</strong><br>R5の入試' },
    { qid:'math_q1_s2_q3', jp:'(6) ある飲食店の来店者数は、11月は10月より30%増加し、12月は11月より20%増加した。また、12月の来店者数は10月より2800人多かった。10月の来店者数として正しいものは？',
      answer:'5000人', choices:['4200人','4368人','5000人','5600人'],
      exp:'📐 10月をx人：11月＝1.3x、12月＝1.3x×1.2＝1.56x<br>1.56x − x ＝ 2800 → 0.56x＝2800 → x＝<strong style="color:var(--gold)">5000</strong><br>💡 答えるのは「10月」。R7の入試' },
    { qid:'math_q1_s2_q4', type:'input', jp:'(6) 定価 x 円の商品を25%引きで買ったら1500円だった。定価 x は何円？（数字だけ）', formula:'25%引き → ×0.75', answer:'2000', xp:6, hint:'0.75x＝1500',
      exp:'✅ 0.75x＝1500 → x＝1500÷0.75＝<strong>2000</strong>円<br>💡 25%引き＝元の75%＝×0.75' },
    { qid:'math_q1_s2_q5', jp:'(6) 1個 a g のトマト3個と、1本 b g のきゅうり2本をあわせた重さが900gより軽い。この関係を表す不等式は？',
      answer:'3a＋2b＜900', choices:['3a＋2b≦900','3a＋2b＜900','3a＋2b≧900','3a＋2b＞900'],
      exp:'📐 「900gより軽い」＝900は含まない＝<strong style="color:var(--gold)">＜</strong><br>「900g以下」なら≦。R6の入試' },
    { qid:'math_q1_s2_q6', jp:'(6) 次のうち、y が x の一次関数となるものはどれ？',
      answer:'1辺の長さが x cm の正三角形の周の長さ y cm', choices:['面積が100cm²で、たての長さが x cm の長方形の横の長さ y cm','1辺の長さが x cm の正三角形の周の長さ y cm','半径が x cm の円の面積 y cm²','1辺の長さが x cm の立方体の体積 y cm³'],
      exp:'📐 正三角形の周：y＝3x（一次関数。比例も一次関数に含まれる）<br>❌ 長方形：y＝100/x（反比例）　円：y＝πx²　立方体：y＝x³<br>R5の入試' },
    { qid:'math_q1_s2_q7', jp:'(6) 2直線 y＝x−3、y＝−2x−6 の交点を通り、直線 y＝2x＋1 に平行な直線の切片は？',
      answer:'−2', choices:['−4','−2','0','4'],
      exp:'📐 交点：x−3＝−2x−6 → 3x＝−3 → x＝−1、y＝−4 → (−1, −4)<br>平行→傾き2：y＝2x＋b に代入 −4＝−2＋b → b＝<strong style="color:var(--gold)">−2</strong><br>R7の入試' },
    { qid:'math_q1_s2_q8', jp:'(7) 関数 y＝6/x のグラフについて正しく述べた文の組み合わせは？<br><span style="font-size:13px;color:var(--text2)">ア 原点を対称の中心として点対称である／イ x軸を対称の軸として線対称である／ウ x軸と交わる／エ y軸と交わる／オ 関数 y＝x のグラフと2点で交わる／カ 関数 y＝x² のグラフと2点で交わる</span>',
      answer:'アとオ', choices:['アとオ','イとウ','ウとエ','エとカ'],
      exp:'📐 反比例のグラフ（双曲線）は<strong>原点について点対称</strong>（ア○）。x軸・y軸とは交わらない（ウ×エ×）。x軸対称ではない（イ×）<br>y＝x と：x²＝6 → x＝±√6 の<strong>2点</strong>（オ○）。y＝x² と：x³＝6 → x＝1点だけ（カ×）<br>✅ R7の入試「二つ選ぶ」問題' },
    { qid:'math_q1_s2_q9', jp:'(7) y が x に反比例し、x＝4 のとき y＝3 である。このグラフ上の点で、x座標とy座標がともに整数で、x座標がy座標より小さい点は何個？',
      answer:'6個', choices:['1個','2個','3個','6個'],
      exp:'📐 a＝4×3＝12 → y＝12/x。整数点は12の約数のペア<br>正：(1,12)(2,6)(3,4)　負：(−12,−1)(−6,−2)(−4,−3)　→ x＜y は全部で<strong style="color:var(--gold)">6個</strong><br>⚠️ 負の側を忘れると3個になる。R6の入試' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 3: 確率・データ・整数 =====
function renderSection3(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん','確率って「なんとなく半分くらい」じゃダメなの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','ダメだ。確率＝「あてはまる数 ÷ 全部の数」。全部の数を数えるとき、「同時に2枚」なら順番は関係ない、「1枚ずつ続けて」なら順番が関係する。ここだけ区別すれば、あとは数えるだけ。')
    + chat('kyon','きょん','数えるだけ！それなら神経衰弱で鍛えた俺の出番！！')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 確率・データ・整数のルール</div>'
    + '<div class="rule-box"><div class="rule-title">確率＝あてはまる数 ÷ 全部の数</div><div class="ex">「<strong>同時に2枚</strong>」＝順番なし → 6枚から2枚なら (6×5)÷2＝15通り<br>「<strong>1枚ずつ続けて</strong>」＝順番あり → 4枚から3枚なら 4×3×2＝24通り<br>さいころ2個＝36通り（表を書く）<br>「異なる確率」は「同じ確率」を出して 1 から引くと速い</div></div>'
    + '<div class="rule-box"><div class="rule-title">標本調査＝比例式</div><div class="ex">50個中9個 → 8000個中x個：x＝8000×9/50＝<strong style="color:var(--gold)">1440</strong>個<br>「およそ」＝推定なのでぴったりでなくてよい</div></div>'
    + '<div class="rule-box"><div class="rule-title">箱ひげ図</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgBox + '</div>'
    + '<div class="ex">データを小さい順に並べ、4等分する点が四分位数。<strong>箱の長さ＝四分位範囲</strong>。ヒストグラムから作るときは「何番目の値がどの区間にあるか」を累計で数える</div></div>'
    + '<div class="rule-box"><div class="rule-title">整数の性質</div><div class="ex">偶数＝2n、奇数＝2n＋1。「必ず奇数」を選ぶ→ 4n＋5＝2(2n＋2)＋1 の形になるもの<br>変化の割合＝(yの増加量)÷(xの増加量)。一次関数では傾きと同じ</div></div>'
    + '<div class="rule-box"><div class="rule-title">平方根の正誤（二つ選ぶ）</div><div class="ex">✅ 64の平方根は±8（2つある）　✅ √21÷√7＝√3<br>❌ √16＝±4（√16は<strong>4だけ</strong>。「16の平方根」なら±4）　❌ √(−6)²＝−6（＝<strong>6</strong>）　❌ √16−√9＝√7（4−3＝1）　❌ √3×5＝√15（＝5√3）</div></div>'
    + '</div>';

  var qs = [
    { qid:'math_q1_s3_q0', jp:'(9) 箱の中にAのカードが3枚、Bが2枚、Cが1枚。同時に2枚取り出すとき、2枚の文字が<strong>異なる</strong>確率は？',
      answer:'11/15', choices:['4/15','7/18','11/18','11/15'],
      exp:'📐 全部：6枚から2枚（同時）＝15通り<br>同じ文字：A同士3通り＋B同士1通り＝4通り → 同じ確率 4/15<br>異なる＝1−4/15＝<strong style="color:var(--gold)">11/15</strong><br>⚠️ 4/15 は「同じ」の確率。答えるのは「異なる」。R7の入試' },
    { qid:'math_q1_s3_q1', jp:'(7) 1のカードが2枚、2が1枚、3が1枚の箱から、1枚ずつ続けて3枚取り出し、順に百・十・一の位として3けたの整数をつくる。213以上になる確率は？',
      answer:'5/12', choices:['7/24','1/3','5/12','1/2'],
      exp:'📐 全部：4×3×2＝24通り（2枚の1は区別する）<br>百の位3：残り2枚の並び 3×2＝6通り（全部213以上）<br>百の位2：213以上は「2,1,3」「2,3,1」— 1が2枚あるので各2通り → 4通り<br>10/24＝<strong style="color:var(--gold)">5/12</strong>。R5の入試' },
    { qid:'math_q1_s3_q2', jp:'(9) 大小2つのさいころを投げるとき、出た目の和が5になる確率は？',
      answer:'1/9', choices:['1/9','1/6','5/36','1/12'],
      exp:'📐 全部36通り。和が5：(1,4)(2,3)(3,2)(4,1)＝4通り → 4/36＝<strong style="color:var(--gold)">1/9</strong><br>💡 大小を区別するので(1,4)と(4,1)は別' },
    { qid:'math_q1_s3_q3', jp:'(8) キャベツ8000個から無作為に50個抽出し重さを調べた。0.7kg以上1.3kg未満は50個中9個だった。8000個のうち0.7kg以上1.3kg未満はおよそ何個と推定される？',
      answer:'およそ1440個', choices:['およそ640個','およそ800個','およそ1440個','およそ5600個'],
      exp:'📐 比例式：50：9＝8000：x → x＝8000×9/50＝<strong style="color:var(--gold)">1440</strong><br>💡 表の「0.7〜1.1：4個」と「1.1〜1.3：5個」を足して9個。R7の入試' },
    { qid:'math_q1_s3_q4', type:'input', jp:'(8) 袋の中の玉300個から30個取り出したら、赤玉が2個あった。袋の中の赤玉はおよそ何個と推定される？（数字だけ）', formula:'30：2 ＝ 300：x', answer:'20', xp:6, hint:'300×2÷30',
      exp:'✅ x＝300×2/30＝<strong>20</strong>個' },
    { qid:'math_q1_s3_q5', jp:'8人の得点を小さい順に並べると 2, 4, 5, 6, 8, 9, 11, 15 だった。四分位範囲は？',
      answer:'5.5', choices:['5.5','7','13','4.5'],
      exp:'📐 下半分 2,4,5,6 の中央＝(4＋5)/2＝4.5（第1四分位数）　上半分 8,9,11,15 の中央＝(9＋11)/2＝10（第3四分位数）<br>四分位範囲＝10−4.5＝<strong style="color:var(--gold)">5.5</strong><br>💡 中央値は(6＋8)/2＝7。範囲（最大−最小）は13' },
    { qid:'math_q1_s3_q6', jp:'40人の記録をヒストグラムにまとめた。小さい方から数えて10番目・11番目の値が「15m以上20m未満」の区間にあるとき、箱ひげ図の第1四分位数はどの区間にある？',
      answer:'15m以上20m未満', choices:['15m以上20m未満','5m以上10m未満','25m以上30m未満','35m以上40m未満'],
      exp:'📐 40人→下半分は20人→その中央＝10番目と11番目の平均＝第1四分位数<br>その値がある区間＝<strong style="color:var(--gold)">15〜20m</strong><br>💡 中央値は20・21番目、第3四分位数は30・31番目。R6(9)はこの数え方で解く' },
    { qid:'math_q1_s3_q7', jp:'(8) n がどんな整数であっても、式の値が必ず奇数となるものは？',
      answer:'4n＋5', choices:['n−2','4n＋5','3n','n²−1'],
      exp:'📐 4n は必ず偶数 → 4n＋5＝偶数＋奇数＝<strong style="color:var(--gold)">必ず奇数</strong><br>❌ n−2 と 3n は n が偶数なら偶数。n²−1 は n が奇数なら偶数。R5の入試' },
    { qid:'math_q1_s3_q8', jp:'(9) x の値が1から3まで増加するときの変化の割合が、関数 y＝2x² と同じ関数は？',
      answer:'y＝8x＋6', choices:['y＝2x＋1','y＝3x−1','y＝5x−4','y＝8x＋6'],
      exp:'📐 y＝2x²：x＝1で2、x＝3で18 → (18−2)/(3−1)＝<strong>8</strong><br>一次関数の変化の割合＝傾き → 傾き8の <strong style="color:var(--gold)">y＝8x＋6</strong>。R5の入試' },
    { qid:'math_q1_s3_q9', jp:'(8) 平方根について正しく述べたものの組み合わせは？<br><span style="font-size:13px;color:var(--text2)">ア 64の平方根は±8である／イ √16は±4である／ウ √(−6)²は−6である／エ √16−√9は√7である／オ √3×5は√15である／カ √21÷√7は√3である</span>',
      answer:'アとカ', choices:['アとカ','イとエ','ウとオ','アとイ'],
      exp:'📐 ア○（平方根は2つ）　カ○（√21/√7＝√3）<br>❌ イ：√16＝4だけ　ウ：√36＝6　エ：4−3＝1　オ：5√3<br>✅ R6の入試「二つ選ぶ」' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 4: 図形 =====
function renderSection4(){
  var html = '';
  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + chat('kyon','きょん','図形の角度って、どこから手をつければいいの？')
    + chat('nishi','西村真二（慶應卒・元アナ）','わかっている角を図に全部書き込む。三角形は180°、四角形は360°、外角、対頂角、平行線の錯角、円周角。この6つの道具で、大問1の(10)と大問3(1)はほぼ解ける。')
    + chat('kyon','きょん','道具は6つ！全部書き込む！')
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 図形の小問のルール</div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgAngle + '</div>'
    + '<div class="rule-box"><div class="rule-title">角度の6つの道具</div><div class="ex">① 三角形の内角の和＝180°　② 四角形の内角の和＝360°　③ 外角＝となり合わない2つの内角の和<br>④ 対頂角は等しい　⑤ 平行線→錯角・同位角は等しい　⑥ 二等辺三角形→底角は等しい</div></div>'
    + '<div style="overflow-x:auto;margin:8px 0">' + svgCircle + '</div>'
    + '<div class="rule-box"><div class="rule-title">円周角の3ルール（大問3(1)は毎年ここ）</div><div class="ex">① 中心角＝円周角×2（同じ弧に対して）<br>② 同じ弧に対する円周角は等しい（等しい弦・等しい弧でも等しい）<br>③ 直径の上に立つ円周角＝90°</div></div>'
    + '<div class="rule-box"><div class="rule-title">平行線と線分の比（相似）</div><div class="ex">平行な2直線にはさまれた三角形は相似。対応する辺の比が等しい<br>例：平行四辺形ABCD、DE：EC＝2：3、F＝AC∩EB → EC//AB より △FEC∽△FBA、EC：AB＝6：10＝3：5 → CF：FA＝3：5</div></div>'
    + '<div class="rule-box"><div class="rule-title">空間の平面（全て選ぶ）</div><div class="ex">平面が<strong>1つに決まる</strong>：一直線上にない3点／交わる2直線／平行な2直線／直線と、その上にない1点<br>決まらない：2点だけ／一直線上の3点（その直線を軸にいくらでも回転できる）</div></div>'
    + '</div>';

  var qs = [
    { qid:'math_q1_s4_q0', jp:'△ABCで∠A＝50°、∠B＝60°。辺BCをCの方に延長した点をDとするとき、∠ACDの大きさは？',
      answer:'110°', choices:['110°','70°','120°','130°'],
      exp:'📐 外角＝となり合わない2つの内角の和＝50＋60＝<strong style="color:var(--gold)">110°</strong><br>💡 ∠ACB＝70°、その外角なので180−70＝110°でも同じ' },
    { qid:'math_q1_s4_q1', jp:'平行な2直線 l, m に直線 n が交わり、l と n のなす角の一つが 65° のとき、m と n のなす錯角の大きさは？',
      answer:'65°', choices:['65°','115°','25°','130°'],
      exp:'📐 平行線の錯角は等しい → <strong style="color:var(--gold)">65°</strong><br>💡 同じ側のとなりの角なら 180−65＝115°' },
    { qid:'math_q1_s4_q2', jp:'円Oで、弧ABに対する中心角∠AOBが 96° のとき、同じ弧ABに対する円周角∠APBの大きさは？',
      answer:'48°', choices:['48°','96°','192°','42°'],
      exp:'📐 円周角＝中心角÷2＝<strong style="color:var(--gold)">48°</strong>' },
    { qid:'math_q1_s4_q3', jp:'線分ABを直径とする円で、点Cが円周上にあるとき、∠ACBの大きさは？',
      answer:'90°', choices:['90°','45°','60°','180°'],
      exp:'📐 直径の上に立つ円周角は<strong style="color:var(--gold)">90°</strong>（中心角180°の半分）<br>💡 大問3(1)でよく使う。R7でも「ABが直径」から∠ACB＝90°を使う' },
    { qid:'math_q1_s4_q4', jp:'C、Dは線分ABを直径とする円Oの周上の点で、CB＝CD。∠COA＝48°のとき、∠OBDの大きさは？',
      answer:'42°', choices:['42°','24°','48°','66°'],
      exp:'📐 ∠COA＝48°（中心角）→ 弧ACの円周角∠CBA＝24°<br>∠ACB＝90°（直径）→ ∠CAB＝66° → 同じ弧CBの円周角 ∠CDB＝66°<br>CB＝CD → ∠CBD＝∠CDB＝66°<br>∠OBD＝∠CBD−∠CBA＝66−24＝<strong style="color:var(--gold)">42°</strong><br>✅ R7 大問3(1)。答えは「アイ」に4と2をマーク' },
    { qid:'math_q1_s4_q5', jp:'四角形ABCDは平行四辺形。Eは辺DC上の点でDE：EC＝2：3、Fは線分ACとEBの交点、Gは辺BC上の点でAB//FG。AB＝10cmのとき、線分FGの長さは？',
      answer:'15/4 cm', choices:['3cm','18/5 cm','15/4 cm','4cm'],
      exp:'📐 DC＝AB＝10 → EC＝6。EC//AB → △FEC∽△FBA → CF：FA＝EC：AB＝6：10＝3：5 → CF：CA＝3：8<br>FG//AB → △CFG∽△CAB → FG＝AB×3/8＝<strong style="color:var(--gold)">15/4</strong> cm<br>R6の入試' },
    { qid:'math_q1_s4_q6', jp:'空間内の平面について正しく述べたものの組み合わせは？<br><span style="font-size:13px;color:var(--text2)">ア 異なる2点をふくむ平面は1つしかない／イ 交わる2直線をふくむ平面は1つしかない／ウ 平行な2直線をふくむ平面は1つしかない／エ 同じ直線上にある3点をふくむ平面は1つしかない</span>',
      answer:'イとウ', choices:['イとウ','アとイ','ウとエ','アとエ'],
      exp:'📐 交わる2直線・平行な2直線 → 平面は<strong>1つに決まる</strong>（イ○ウ○）<br>❌ 2点だけ／一直線上の3点 → その直線を軸に回転できるので無数（ア×エ×）<br>✅ R5の入試「全て選ぶ」' },
    { qid:'math_q1_s4_q7', jp:'図で、Eは線分ACとDBの交点。∠BAE＝36°、∠AED＝82°、∠EBC＝50°、∠ECD＝46°のとき、∠DAEの大きさは？<br><span style="font-size:12px;color:var(--text2)">（R7 大問1(10)。ヒント：∠BAC と ∠BDC を比べる）</span>',
      answer:'50°', choices:['46°','48°','49°','50°'],
      exp:'📐 ∠DEC＝∠AEB＝180−82＝98°（対頂角）→ △DEC：∠EDC＝180−98−46＝<strong>36°</strong><br>∠BAC＝36°＝∠BDC → 「同じ線分BCを同じ側から見て角が等しい」＝A,B,C,Dは<strong>同じ円の上</strong>（円周角の定理の逆）<br>→ ∠DAE（弧DCの円周角）＝∠DBC＝<strong style="color:var(--gold)">50°</strong><br>💡 大問1の中では難しい方。時間がなければ飛ばして最後に' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 5: 模擬 大問1 =====
function renderSection5(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 模擬 大問1 — 本番の順番で10問×2セット</div>'
    + '<div class="rule-box"><div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + 'セットA＝2025年（R7）の本物。セットB＝同じ型で数字を変えた問題。<br>'
    + 'きょん「時間は気にしない！一問ずつ手順どおり！！」<br>'
    + '西村「(7)は二つ選ぶ。設問を最後まで読め」'
    + '</div></div></div>';

  var setA = [
    { no:'セットA (1)', qid:'math_q1_s5_q0', jp:'次を計算した結果として正しいものは？' + fx('6 ＋ 10 ÷ (−2)'), answer:'1', choices:['−8','1','8','11'], exp:'📐 10÷(−2)＝−5 → 6−5＝<strong style="color:var(--gold)">1</strong>' },
    { no:'セットA (2)', qid:'math_q1_s5_q1', jp:'次を計算した結果として正しいものは？' + fx('3(2x＋3) − 2(x−3)'), answer:'4x＋15', choices:['4x','4x＋3','4x＋6','4x＋15'], exp:'📐 6x＋9−2x＋6＝<strong style="color:var(--gold)">4x＋15</strong>' },
    { no:'セットA (3)', qid:'math_q1_s5_q2', jp:'次を計算した結果として正しいものは？' + fx('9/√3 ＋ √2 × √6'), answer:'5√3', choices:['3√3','5√3','5√6','3√30'], exp:'📐 3√3＋2√3＝<strong style="color:var(--gold)">5√3</strong>' },
    { no:'セットA (4)', qid:'math_q1_s5_q3', jp:'方程式の解として正しいものは？' + fx('x(x＋4) ＝ −3(x＋1)'), answer:'x＝(−7±√37)/2', choices:['x＝(−7±√37)/2','x＝(−7±√61)/2','x＝(7±√61)/2','x＝(7±√37)/2'], exp:'📐 x²＋7x＋3＝0 → 解の公式 → <strong style="color:var(--gold)">(−7±√37)/2</strong>' },
    { no:'セットA (5)', qid:'math_q1_s5_q4', jp:'ある飲食店の来店者数は、11月は10月より30%増加し、12月は11月より20%増加した。12月は10月より2800人多かった。10月の来店者数は？', answer:'5000人', choices:['4200人','4368人','5000人','5600人'], exp:'📐 1.56x−x＝2800 → x＝<strong style="color:var(--gold)">5000</strong>' },
    { no:'セットA (6)', qid:'math_q1_s5_q5', jp:'2直線 y＝x−3、y＝−2x−6 の交点を通り、直線 y＝2x＋1 に平行な直線の切片は？', answer:'−2', choices:['−4','−2','0','4'], exp:'📐 交点(−1,−4)、傾き2 → −4＝−2＋b → b＝<strong style="color:var(--gold)">−2</strong>' },
    { no:'セットA (7)', qid:'math_q1_s5_q6', jp:'関数 y＝6/x のグラフについて正しく述べた文を<strong>二つ</strong>選ぶとき、その組み合わせは？<br><span style="font-size:13px;color:var(--text2)">ア 原点を対称の中心として点対称／イ x軸を対称の軸として線対称／ウ x軸と交わる／エ y軸と交わる／オ y＝x のグラフと2点で交わる／カ y＝x² のグラフと2点で交わる</span>', answer:'アとオ', choices:['アとオ','イとウ','ウとエ','エとカ'], exp:'📐 双曲線は原点対称（ア）、y＝x とは±√6 の2点で交わる（オ）' },
    { no:'セットA (8)', qid:'math_q1_s5_q7', jp:'8000個から50個を抽出したところ、0.7kg以上1.3kg未満は9個。8000個のうち0.7kg以上1.3kg未満はおよそ何個？', answer:'およそ1440個', choices:['およそ640個','およそ800個','およそ1440個','およそ5600個'], exp:'📐 8000×9/50＝<strong style="color:var(--gold)">1440</strong>' },
    { no:'セットA (9)', qid:'math_q1_s5_q8', jp:'Aが3枚、Bが2枚、Cが1枚のカードから同時に2枚取り出すとき、文字が異なる確率は？', answer:'11/15', choices:['4/15','7/18','11/18','11/15'], exp:'📐 1−4/15＝<strong style="color:var(--gold)">11/15</strong>' },
    { no:'セットA (10)', qid:'math_q1_s5_q9', jp:'Eは線分ACとDBの交点。∠BAE＝36°、∠AED＝82°、∠EBC＝50°、∠ECD＝46°のとき、∠DAEは？', answer:'50°', choices:['46°','48°','49°','50°'], exp:'📐 ∠EDC＝36°＝∠BAC → 4点は同一円周上 → ∠DAC＝∠DBC＝<strong style="color:var(--gold)">50°</strong>' },
  ];
  var setB = [
    { no:'セットB (1)', qid:'math_q1_s5_q10', jp:'次を計算した結果として正しいものは？' + fx('−8 ＋ 12 ÷ (−4)'), answer:'−11', choices:['−11','−5','1','−1'], exp:'📐 12÷(−4)＝−3 → −8−3＝<strong style="color:var(--gold)">−11</strong><br>❌ 1 は「−8＋12を先に」した誤り' },
    { no:'セットB (2)', qid:'math_q1_s5_q11', jp:'次を計算した結果として正しいものは？' + fx('2(3x−1) − 3(x−2)'), answer:'3x＋4', choices:['3x−8','3x＋4','3x−4','9x＋4'], exp:'📐 6x−2−3x<strong>＋6</strong>＝<strong style="color:var(--gold)">3x＋4</strong>' },
    { no:'セットB (3)', qid:'math_q1_s5_q12', jp:'次を計算した結果として正しいものは？' + fx('12ab² ÷ (−4b) × 3a'), answer:'−9a²b', choices:['−9a²b','9a²b','−ab','−9ab²'], exp:'📐 12ab²÷(−4b)＝−3ab → ×3a＝<strong style="color:var(--gold)">−9a²b</strong>' },
    { no:'セットB (4)', qid:'math_q1_s5_q13', jp:'次を計算した結果として正しいものは？' + fx('√27 − √12 ＋ √3'), answer:'2√3', choices:['2√3','6√3','√18','4√3'], exp:'📐 3√3−2√3＋√3＝<strong style="color:var(--gold)">2√3</strong>' },
    { no:'セットB (5)', qid:'math_q1_s5_q14', jp:'方程式の解として正しいものは？' + fx('x² − 2x − 15 ＝ 0'), answer:'x＝−3，5', choices:['x＝−3，5','x＝3，−5','x＝−3，−5','x＝3，5'], exp:'📐 かけて−15・たして−2 → −5と3 → (x−5)(x＋3)＝0 → <strong style="color:var(--gold)">x＝−3，5</strong>' },
    { no:'セットB (6)', qid:'math_q1_s5_q15', jp:'定価 x 円の商品を25%引きで買ったら1500円だった。定価は？', answer:'2000円', choices:['1875円','2000円','1125円','6000円'], exp:'📐 0.75x＝1500 → <strong style="color:var(--gold)">2000</strong>円' },
    { no:'セットB (7)', qid:'math_q1_s5_q16', jp:'直線 y＝−3x＋6 と x 軸との交点の x 座標は？', answer:'2', choices:['2','6','−2','−3'], exp:'📐 x軸上は y＝0 → 0＝−3x＋6 → x＝<strong style="color:var(--gold)">2</strong>' },
    { no:'セットB (8)', qid:'math_q1_s5_q17', jp:'300個の製品から30個を取り出して調べたら不良品が2個あった。300個の中の不良品はおよそ何個？', answer:'およそ20個', choices:['およそ20個','およそ2個','およそ60個','およそ10個'], exp:'📐 300×2/30＝<strong style="color:var(--gold)">20</strong>' },
    { no:'セットB (9)', qid:'math_q1_s5_q18', jp:'大小2つのさいころを投げるとき、出た目の和が5になる確率は？', answer:'1/9', choices:['1/9','1/6','5/36','1/12'], exp:'📐 4通り/36通り＝<strong style="color:var(--gold)">1/9</strong>' },
    { no:'セットB (10)', qid:'math_q1_s5_q19', jp:'△ABCで∠A＝50°、∠B＝60°。辺BCをCの方に延長した点をDとするとき、∠ACDは？', answer:'110°', choices:['110°','70°','120°','130°'], exp:'📐 外角＝50＋60＝<strong style="color:var(--gold)">110°</strong>' },
  ];
  html += '<div style="font-size:14px;color:var(--purple);font-weight:bold;margin:20px 0 10px;letter-spacing:1px">── セットA（2025年 本物） ──</div>';
  html += renderQs(setA);
  html += '<div style="font-size:14px;color:var(--teal);font-weight:bold;margin:24px 0 10px;letter-spacing:1px">── セットB（同じ型・数字ちがい） ──</div>';
  html += renderQs(setB);
  return html;
}

function showFinalResult(){
  var s5qids = Object.keys(qMeta).filter(function(id){ return id.indexOf(QID_PREFIX + 's5_') === 0; });
  var total = s5qids.length || 20;
  var correct = s5qids.filter(function(id){ var d = weakDB[id]; return d && d.correct > 0; }).length;
  var pct = Math.round(correct / total * 100);
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '🎭' : '🥚';
  var msg = pct >= 90 ? 'きょん「大問1、全部取れる！！」<br>西村「文句なし。本番でも同じ手順で」'
          : pct >= 70 ? 'きょん「だいぶ取れるようになった！！」<br>西村「あと少し。間違えた型だけ特訓で潰そう」'
          : pct >= 50 ? 'きょん「半分は取れた…！」<br>西村「弱点ノートで、どの型が弱いか見よう」'
          : 'きょん「大問1でも難しい…」<br>西村「大丈夫。Section 1の計算から手順を一つずつ。特訓モードで反復」';
  var overlay = document.getElementById('resultOverlay');
  overlay.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--purple);border-radius:20px;padding:36px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 8px 40px rgba(163,113,247,0.25)">'
    + '<div style="font-size:60px;margin-bottom:12px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:26px;color:var(--purple);letter-spacing:2px;margin-bottom:8px">模擬 大問1 結果</div>'
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
  var html = '<div class="section-header"><div class="section-badge">数学 入試大問1 · 弱点ノート</div><div class="section-title">弱点ノート</div><div class="section-sub">間違えた問題を確認しよう</div></div>';
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
  var html = '<div class="section-header"><div class="section-badge" style="background:var(--red)">数学 入試大問1 · 特訓</div><div class="section-title">弱点特訓モード</div><div class="section-sub">弱点問題を集中練習！</div></div>';
  if(wqs.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-size:16px;line-height:2">弱点なし！<br>きょん「大問1マスター！！」</div></div>';
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
    + (pctAll >= 80 ? 'きょん「大問1、固まってきた！！」' : 'きょん「まだ穴がある…もう一回！！」') + '</div>'
    + '<button id="tokkuAgain" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer">🔥 もう一度特訓</button>'
    + '</div>';
  document.getElementById('tokkuAgain').addEventListener('click', function(){ renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
renderSection(0);
