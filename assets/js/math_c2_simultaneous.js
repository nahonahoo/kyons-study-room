// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:20,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「連立方程式？なにそれ食えるの？」' },
  { lv:2, min:20,  max:55,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:55,  max:110, badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺連立できるかも」' },
  { lv:4, min:110, max:185, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:185, max:280, badge:'📺 全国ネット',    title:'課長',          status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:280, max:400, badge:'🌟 冠番組',        title:'部長',          status:'きょん「連立で漫才できるかもしれない」' },
  { lv:7, min:400, max:550, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:550, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('math_sim_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('math_sim_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('math_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;

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
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
}
function addXP(pts, qid){
  if(answeredSet[qid]) return false;
  var old = getLevel(xp).lv; xp += pts; answeredSet[qid] = true;
  localStorage.setItem('math_xp', xp);
  localStorage.setItem('math_sim_answered', JSON.stringify(answeredSet));
  updateXP(); return getLevel(xp).lv > old;
}
function deductXP(pts){
  var old = getLevel(xp).lv; xp = Math.max(0, xp - pts);
  localStorage.setItem('math_xp', xp); updateXP(); return getLevel(xp).lv < old;
}

// ===== WEAK DB =====
function getPct(qid){ var d = weakDB[qid]; if(!d || d.total===0) return 0; return Math.round(d.correct / d.total * 100); }
function getWeakQuestions(){ return Object.keys(weakDB).filter(function(id){ return id.indexOf('math_sim_') === 0 && getPct(id) < 80; }); }
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
  correct: ['きょん「合ってる！！天才かも！！」', 'きょん「やった！！連立余裕！！」', 'きょん「にっくん見て！解けた！！」'],
  nishi:   ['西村「正解。よく理解できてる」', '西村「できてる。その調子」', '西村「正確に答えられてる」'],
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
  else { var msgs = ['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！まだまだ大丈夫！！」','きょん「ルールをもう一度確認！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('math_sim_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で解く！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。解き方を理解しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = 'math_sim_s' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('math_sim_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if(nb && nb.style.display === 'none'){
      nb.style.display = 'block';
      if(!document.getElementById('secCompleteBanner')){
        var banner = document.createElement('div'); banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 4 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '確認テストへ挑戦！';
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
  { id:0, label:'📐 スタート',  title:'連立方程式とは',     sub:'2つの式で2つの未知数を同時に求める！' },
  { id:1, label:'代入法',       title:'代入法',              sub:'一方の式を他方に代入して解く' },
  { id:2, label:'加減法',       title:'加減法',              sub:'足し算・引き算で一方の文字を消去する' },
  { id:3, label:'文章題',       title:'文章題と応用',        sub:'個数・速さ・食塩水・価格%——連立方程式を使おう' },
  { id:4, label:'確認テスト',   title:'確認テスト',          sub:'全セクション総まとめ！' },
  { id:5, label:'📊弱点',       title:'弱点ノート',          sub:'間違えた問題を確認' },
  { id:6, label:'🔥特訓',       title:'弱点特訓モード',      sub:'弱点問題を集中練習！' },
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
  for(var i = 0; i <= 4; i++){
    html += '<div class="dot' + (i < id ? ' done' : i === id ? ' current' : '') + '"></div>';
  }
  html += '</div>';
  html += '<div class="section-header">'
    + '<div class="section-badge">数学 連立方程式 · SECTION ' + id + '</div>'
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
    b.addEventListener('click', function(){
      var g = b.dataset.goto;
      if(g === 'result') showFinalResult(); else goSection(parseInt(g));
    });
  });
  document.querySelectorAll('.start-btn[data-goto]').forEach(function(b){
    b.addEventListener('click', function(){ goSection(parseInt(b.dataset.goto)); });
  });
}

// ===== SVG HELPERS =====
// 2直線の交点グラフ（連立方程式のイメージ）
var svgIntersect = '<svg viewBox="0 0 260 240" style="width:100%;max-width:300px;display:block;margin:0 auto">'
  // Grid
  + (function(){
      var g = '';
      for(var i=0;i<=8;i++){
        g += '<line x1="'+(i*28+18)+'" y1="0" x2="'+(i*28+18)+'" y2="240" stroke="#21262d" stroke-width="1"/>';
        g += '<line x1="0" y1="'+(i*28+8)+'" x2="260" y2="'+(i*28+8)+'" stroke="#21262d" stroke-width="1"/>';
      }
      return g;
    })()
  // Axes (cx=130, cy=120)
  + '<line x1="8" y1="120" x2="252" y2="120" stroke="#8b949e" stroke-width="1.5"/>'
  + '<line x1="130" y1="232" x2="130" y2="8" stroke="#8b949e" stroke-width="1.5"/>'
  + '<text x="247" y="130" fill="#8b949e" font-size="11">x</text>'
  + '<text x="122" y="13" fill="#8b949e" font-size="11">y</text>'
  + '<text x="134" y="130" fill="#8b949e" font-size="10">O</text>'
  // Line1: y = -x + 3  → at x=-2: y=5 (74, -20+120=100); at x=3: y=0 (214,120); at x=4: y=-1 (242, 148)
  // scaled: sc=28, cx=130,cy=120
  // x=-3: (130-84, 120-(-(-3)+3)*28) = (46, 120) hmm let me recalc
  // y = -x + 3: at x=-2, y=5 → svg: (130-56, 120-140)=(74, -20) clipped
  // at x=3, y=0 → (214, 120); at x=0, y=3 → (130, 36)
  // visible: from (74, -20) to (214, 120) – clamp top at y=8: when y_svg=8, y=4, x=-1 → (102, 8)
  + '<line x1="102" y1="8" x2="214" y2="120" stroke="#a371f7" stroke-width="2"/>'
  + '<text x="216" y="118" fill="#a371f7" font-size="12">①</text>'
  // Line2: y = 2x - 3 → at x=0, y=-3 → (130, 204); at x=3, y=3 → (214, 36); at x=1.5, y=0 → (172, 120)
  // visible: from (130,204) to (214,36)
  + '<line x1="130" y1="204" x2="214" y2="36" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="216" y="40" fill="#0ea5e9" font-size="12">②</text>'
  // Intersection: x=2, y=1 → (130+56, 120-28) = (186, 92)
  + '<circle cx="186" cy="92" r="6" fill="#f5c518" stroke="#0d1117" stroke-width="2"/>'
  + '<text x="192" y="88" fill="#f5c518" font-size="12" font-weight="bold">(2, 1)</text>'
  // Dotted lines to axes
  + '<line x1="186" y1="92" x2="186" y2="120" stroke="#f5c518" stroke-width="1" stroke-dasharray="4,3"/>'
  + '<line x1="186" y1="92" x2="130" y2="92" stroke="#f5c518" stroke-width="1" stroke-dasharray="4,3"/>'
  + '<text x="182" y="133" fill="#f5c518" font-size="10">2</text>'
  + '<text x="117" y="96" fill="#f5c518" font-size="10">1</text>'
  + '<text x="60" y="180" fill="#8b949e" font-size="11">①y=-x+3　②y=2x-3</text>'
  + '<text x="60" y="196" fill="#f5c518" font-size="11">交点(2,1)が解！</text>'
  + '</svg>';

// 天秤SVG（2式のイメージ）
var svgBalance = '<svg viewBox="0 0 280 160" style="width:100%;max-width:320px;display:block;margin:0 auto">'
  // fulcrum
  + '<polygon points="140,110 130,130 150,130" fill="#8b949e"/>'
  + '<rect x="60" y="108" width="160" height="4" rx="2" fill="#8b949e"/>'
  // left pan rope
  + '<line x1="80" y1="112" x2="80" y2="75" stroke="#8b949e" stroke-width="1.5"/>'
  + '<rect x="55" y="68" width="50" height="28" rx="4" fill="rgba(163,113,247,0.15)" stroke="#a371f7" stroke-width="1.5"/>'
  + '<text x="80" y="82" fill="#a371f7" font-size="12" text-anchor="middle" font-weight="bold">x + y = 5</text>'
  + '<text x="80" y="96" fill="#8b949e" font-size="10" text-anchor="middle">式①</text>'
  // right pan rope
  + '<line x1="200" y1="112" x2="200" y2="75" stroke="#8b949e" stroke-width="1.5"/>'
  + '<rect x="175" y="68" width="50" height="28" rx="4" fill="rgba(14,165,233,0.15)" stroke="#0ea5e9" stroke-width="1.5"/>'
  + '<text x="200" y="82" fill="#0ea5e9" font-size="12" text-anchor="middle" font-weight="bold">x - y = 1</text>'
  + '<text x="200" y="96" fill="#8b949e" font-size="10" text-anchor="middle">式②</text>'
  // label
  + '<text x="140" y="148" fill="#f5c518" font-size="12" text-anchor="middle">2つの式を同時に満たす x, y を求める</text>'
  + '</svg>';

// ===== SECTION 0: 導入 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">「連立」って何が「連」で「立」ってるの？なんか難しそうな名前……</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">「2つの方程式が連なって立っている」という意味だ。1つの方程式だと x も y も決まらない。でも2つ式があれば、両方を同時に満たす x と y の値がただ1つに決まる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">2つの式で2つの答えを出すってこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。グラフで言えば、2本の直線の交点がその答えだ。解き方は「代入法」と「加減法」の2つを覚えればいい。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">交点！！それならわかる！！2本の線が交わる点が答えってこと！！</div></div></div>'
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 連立方程式とは——グラフで見ると</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgIntersect + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">連立方程式の「解」</div>'
    + '<div class="ex">2つの方程式を<strong style="color:var(--gold)">同時に満たす</strong> x, y の値の組</div>'
    + '<div class="ex">グラフ上では2本の直線の<strong style="color:var(--gold)">交点</strong></div>'
    + '<div class="note">💡 左の例：①x+y=3 と ②y=2x-3 の交点 → <strong style="color:var(--gold)">x=2, y=1</strong></div>'
    + '</div>'
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 連立方程式の書き方と解き方2種</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgBalance + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">書き方：中カッコ { で2式をまとめる</div>'
    + '<div class="ex" style="font-family:monospace;font-size:15px;color:var(--gold)">{ x + y = 5<br>{ x - y = 1</div>'
    + '</div>'
    + '<div class="rule-box" style="margin-top:10px">'
    + '<div class="rule-title">解き方の2種類</div>'
    + '<div class="ex"><strong style="color:var(--purple)">代入法</strong>：一方の式を y = ～ の形に変形し、もう一方に代入する</div>'
    + '<div class="ex"><strong style="color:var(--teal)">加減法</strong>：2式を足したり引いたりして一方の文字を消去する</div>'
    + '<div class="note">💡 どちらを使っても答えは同じ！場合によって使い分けよう</div>'
    + '</div>'
    + '</div>'

    + '<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:16px 20px;margin-top:16px">'
    + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:10px">📐 この単元で学ぶこと</div>'
    + '<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    + 'Section 1：代入法（y = ～ の形に変形して代入）<br>'
    + 'Section 2：加減法（足し算・引き算で文字を消去）<br>'
    + 'Section 3：文章題（個数・速さ・食塩水・価格%）'
    + '</div></div>'

    + '<button class="start-btn" data-goto="1">📐 Section 1：代入法から始める →</button>';
}

// ===== SECTION 1: 代入法 =====
function renderSection1(){

  // SVG: 代入のイメージ（y を矢印で別の式に押し込む）
  var svgSubst = '<svg viewBox="0 0 300 230" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    // タイトル
    + '<text x="150" y="16" fill="#8b949e" font-size="11" text-anchor="middle">代入法の流れ（例題）</text>'
    // 式①ボックス
    + '<rect x="10" y="24" width="135" height="36" rx="6" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="77" y="38" fill="#a371f7" font-size="10" text-anchor="middle" font-weight="bold">式①　y = x + 2</text>'
    + '<text x="77" y="54" fill="#8b949e" font-size="9" text-anchor="middle">←「y = …」の形になっている</text>'
    // 矢印：式①から式②へ（右方向）
    + '<line x1="145" y1="42" x2="185" y2="42" stroke="#a371f7" stroke-width="2"/>'
    + '<polygon points="185,38 193,42 185,46" fill="#a371f7"/>'
    + '<text x="168" y="36" fill="#a371f7" font-size="9" text-anchor="middle">代入</text>'
    // 式②ボックス（代入前）
    + '<rect x="155" y="24" width="135" height="36" rx="6" fill="rgba(14,165,233,0.08)" stroke="#0ea5e9" stroke-width="1"/>'
    + '<text x="222" y="38" fill="#0ea5e9" font-size="10" text-anchor="middle">式②　2x + y = 8</text>'
    + '<text x="222" y="54" fill="#8b949e" font-size="9" text-anchor="middle">← y を (x+2) に置き換える</text>'
    // 矢印下
    + '<line x1="222" y1="62" x2="222" y2="82" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<polygon points="218,82 222,90 226,82" fill="#0ea5e9"/>'
    // 代入後ボックス
    + '<rect x="155" y="90" width="135" height="52" rx="6" fill="rgba(14,165,233,0.14)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="222" y="108" fill="#f5c518" font-size="11" text-anchor="middle">2x + (x+2) = 8</text>'
    + '<text x="222" y="124" fill="#f5c518" font-size="11" text-anchor="middle">3x = 6</text>'
    + '<text x="222" y="138" fill="#3fb950" font-size="11" text-anchor="middle" font-weight="bold">x = 2</text>'
    // 矢印下
    + '<line x1="222" y1="144" x2="222" y2="164" stroke="#3fb950" stroke-width="1.5"/>'
    + '<polygon points="218,164 222,172 226,164" fill="#3fb950"/>'
    // x=2 を①に戻す
    + '<rect x="155" y="172" width="135" height="36" rx="6" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="1.5"/>'
    + '<text x="222" y="188" fill="#3fb950" font-size="10" text-anchor="middle">x=2 を①に代入</text>'
    + '<text x="222" y="202" fill="#f5c518" font-size="11" text-anchor="middle" font-weight="bold">y = 2 + 2 = 4</text>'
    // 答え
    + '<rect x="10" y="188" width="135" height="32" rx="6" fill="rgba(245,197,24,0.15)" stroke="#f5c518" stroke-width="2"/>'
    + '<text x="77" y="202" fill="#f5c518" font-size="12" text-anchor="middle" font-weight="bold">答え: x=2, y=4</text>'
    + '<text x="77" y="218" fill="#8b949e" font-size="9" text-anchor="middle">検算: 2+2=4✅  2×2+4=8✅</text>'
    + '</svg>';

  // SVG: 変形してから代入するパターン
  var svgTransform = '<svg viewBox="0 0 300 130" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="150" y="14" fill="#8b949e" font-size="10" text-anchor="middle">y=…の形がない場合 → 先に変形！</text>'
    // 例1
    + '<rect x="6" y="22" width="124" height="26" rx="4" fill="rgba(163,113,247,0.08)" stroke="#a371f7" stroke-width="1"/>'
    + '<text x="68" y="39" fill="#a371f7" font-size="10" text-anchor="middle">① x + y = 5</text>'
    + '<text x="134" y="39" fill="#f5c518" font-size="14">→</text>'
    + '<rect x="146" y="22" width="148" height="26" rx="4" fill="rgba(245,197,24,0.08)" stroke="#f5c518" stroke-width="1"/>'
    + '<text x="220" y="39" fill="#f5c518" font-size="10" text-anchor="middle">y = 5 − x　に変形</text>'
    // 例2
    + '<rect x="6" y="58" width="124" height="26" rx="4" fill="rgba(163,113,247,0.08)" stroke="#a371f7" stroke-width="1"/>'
    + '<text x="68" y="75" fill="#a371f7" font-size="10" text-anchor="middle">① 2x − y = 3</text>'
    + '<text x="134" y="75" fill="#f5c518" font-size="14">→</text>'
    + '<rect x="146" y="58" width="148" height="26" rx="4" fill="rgba(245,197,24,0.08)" stroke="#f5c518" stroke-width="1"/>'
    + '<text x="220" y="75" fill="#f5c518" font-size="10" text-anchor="middle">y = 2x − 3　に変形</text>'
    + '<text x="150" y="110" fill="#0ea5e9" font-size="10">💡 変形できたら → もう一方の式に代入！</text>'
    + '<text x="150" y="126" fill="#8b949e" font-size="9">「y = ～」の形にするのが代入法のカギ</text>'
    + '</svg>';

  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">代入法って「代わりに入れる」方法なの？どこに何を入れるの？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">たとえば「① y = x + 2」があれば、別の式②に出てくる y を全部「(x + 2)」に置き換える。そうすると式②が x だけの一次方程式になって解ける。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">y を消してしまえば中1でやった一次方程式じゃん！！それなら絶対解ける！！</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">そう。「①の y = … を②の y に代入 → x だけの式 → x を求める → ①に戻して y を求める」——この流れを体に染み込ませよう。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 代入法の手順（例題で確認）</div>'
    + '<div style="overflow-x:auto;margin:12px 0">' + svgSubst + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">例題をもう一度テキストで確認</div>'
    + '<div class="ex" style="font-family:monospace;font-size:14px;line-height:2.4;color:var(--text2)">'
    + '① y = x + 2<br>'
    + '② 2x + y = 8<br><br>'
    + '<span style="color:var(--purple)">【STEP 1】</span> ①はすでに y=… の形 → そのまま使える<br>'
    + '<span style="color:var(--teal)">【STEP 2】</span> ②の y に「(x+2)」を代入<br>'
    + '　2x + <span style="color:var(--gold)">(x+2)</span> = 8<br>'
    + '　3x + 2 = 8<br>'
    + '　3x = 6 → <span style="color:var(--green)">x = 2</span><br>'
    + '<span style="color:var(--green)">【STEP 3】</span> x=2 を①に代入 → y = 2+2 = <span style="color:var(--gold)">4</span><br>'
    + '<span style="color:var(--gold)">【答え】x = 2、y = 4</span>'
    + '</div>'
    + '<div class="note">💡 検算：①に代入 → 4=2+2 ✅　②に代入 → 2×2+4=8 ✅<br>両方の式で成り立てば正解！</div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 y=… の形がないとき → まず変形する</div>'
    + '<div style="overflow-x:auto;margin:12px 0">' + svgTransform + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">変形のコツ</div>'
    + '<div class="ex">x + y = 5 → y = 5 − x　（x を右辺に移項）</div>'
    + '<div class="ex">2x − y = 3 → y = 2x − 3　（−y を移項して両辺に−1をかける）</div>'
    + '<div class="note">💡 「y = ～」の形に変形しやすい式を選んで代入するのが代入法の出番！</div>'
    + '</div>'
    + '</div>';

  // 選択問題
  var qs = [
    {
      qid:'math_sim_s1_q0',
      jp:'次の連立方程式で、代入法の最初のステップとして正しいのはどれですか？<br>① y = 2x<br>② x + y = 9',
      answer:'②の y を「2x」に置き換えて、x + 2x = 9 とする',
      choices:[
        '②の y を「2x」に置き換えて、x + 2x = 9 とする',
        '①と②を足して 2y + 2x = 9 とする',
        '②の x を「2x」に置き換えて 2x + y = 9 とする',
        '①と②を引いて y − y = 9 とする'
      ],
      exp:'📐 ① y = 2x を②の y に代入します。<br>② x + <span style="color:var(--gold)">y</span> = 9 の y を <span style="color:var(--gold)">2x</span> に置き換えると<br>x + 2x = 9 → 3x = 9 → x = 3、y = 6<br>✅ 「y = …」の右辺をそのまま別の式の y にはめ込む！'
    },
    {
      qid:'math_sim_s1_q1',
      jp:'次の連立方程式を代入法で解いたとき、x の値はいくつですか？<br>① y = x − 1<br>② 3x + y = 11',
      answer:'x = 3',
      choices:['x = 3', 'x = 4', 'x = 2', 'x = 5'],
      exp:'📐 ①を②に代入：3x + <span style="color:var(--gold)">(x−1)</span> = 11<br>4x − 1 = 11 → 4x = 12 → <span style="color:var(--gold)">x = 3</span><br>きょん「3x+（x−1）か……展開して4x−1=11！！」<br>✅ x=3 を①に代入 → y = 3−1 = 2。答え：x=3、y=2'
    },
    {
      qid:'math_sim_s1_q2',
      jp:'前の問題の連立方程式（① y = x − 1、② 3x + y = 11）を解いたとき、y の値はいくつですか？',
      answer:'y = 2',
      choices:['y = 2', 'y = 3', 'y = 4', 'y = 1'],
      exp:'📐 x = 3 を① y = x−1 に代入<br>y = 3 − 1 = <span style="color:var(--gold)">2</span><br>答え：x = 3、y = 2<br>💡 検算：3×3+2 = 11 ✅　y = 3−1 = 2 ✅'
    },
    {
      qid:'math_sim_s1_q3',
      jp:'次の連立方程式で、①の式を②に代入すると何になりますか？<br>① y = 3x<br>② x + y = 8',
      answer:'x + 3x = 8',
      choices:['x + 3x = 8', 'x + 3 = 8', '3x + 3x = 8', 'y + 3y = 8'],
      exp:'📐 ①の y = 3x を②の y にあてはめる<br>x + <span style="color:var(--gold)">y</span> = 8　→　x + <span style="color:var(--gold)">3x</span> = 8<br>✅ y の部分を「3x」に置き換えるだけ！<br>4x = 8 → x = 2、y = 6'
    },
    {
      qid:'math_sim_s1_q4',
      jp:'次の連立方程式を代入法で解くとき、まず何をしますか？<br>① x + y = 7<br>② 2x − y = 5',
      answer:'①を y = 7 − x に変形して②に代入する',
      choices:[
        '①を y = 7 − x に変形して②に代入する',
        '②を y = 2x − 5 に変形して①に代入する',
        '①と②をそのまま足す',
        'どちらの式も変形せずに使える'
      ],
      exp:'📐 どちらの式も「y = …」の形ではないので、先に変形が必要です。<br>①: x + y = 7 → <span style="color:var(--gold)">y = 7 − x</span>　（変形しやすい！）<br>②に代入：2x − (7−x) = 5 → 3x = 12 → x = 4、y = 3<br>💡 または②を変形して y = 2x−5 でもOK。どちらでも答えは同じ！'
    },
    {
      qid:'math_sim_s1_q5',
      jp:'次の連立方程式を代入法で解くと、x はいくつですか？<br>① x = 2y + 1<br>② 3x + y = 20',
      answer:'x = 5',
      choices:['x = 5', 'x = 6', 'x = 3', 'x = 7'],
      exp:'📐 ①の x = 2y+1 を②の x に代入<br>3<span style="color:var(--gold)">(2y+1)</span> + y = 20<br>6y + 3 + y = 20 → 7y = 17... <br>ん？計算しやすい問題にしましょう：<br>3(2y+1)+y=20 → 7y=17 → y=17/7... <br>💡 実は①を②に代入：3(2y+1)+y=20 → 7y=17、少し複雑。<br>②を使って：3x+y=20、x=2y+1 → y=3 → x=7<br>✅ 正しい流れで計算：y=3、<span style="color:var(--gold)">x=2×3+1=7</span>... <br>選択肢と合わない場合は検算で確認しよう！<br>※ 正解は x=5: y=2 の場合、3×5+2=17≠20。再確認：7y=17なので整数にならない。<br>この問題はスキップして次に進もう！'
    },
  ];

  // Q5 を差し替え（整合性のある問題に）
  qs[5] = {
    qid:'math_sim_s1_q5',
    jp:'次の連立方程式を代入法で解くと、y はいくつですか？<br>① x = y + 4<br>② 2x + 3y = 23',
    answer:'y = 3',
    choices:['y = 3', 'y = 5', 'y = 2', 'y = 4'],
    exp:'📐 ①の x = y+4 を②の x に代入<br>2<span style="color:var(--gold)">(y+4)</span> + 3y = 23<br>2y + 8 + 3y = 23 → 5y = 15 → <span style="color:var(--gold)">y = 3</span><br>x = 3 + 4 = 7。答え：x = 7、y = 3<br>💡 検算：2×7+3×3 = 14+9 = 23 ✅'
  };

  // 計算入力問題
  var inputQs = [
    {
      qid:'math_sim_s1_in0',
      jp:'次の連立方程式を代入法で解きなさい。x の値を答えなさい。<br>① y = 2x<br>② x + y = 6',
      formula:'②の y に①を代入：x + 2x = 6',
      answer:'2', xp:6,
      hint:'x + 2x = 6 → 3x = 6 → x = 2',
      exp:'②に①を代入：x + <span style="color:var(--gold)">2x</span> = 6<br>3x = 6 → <span style="color:var(--gold)">x = 2</span><br>y = 2×2 = 4。答え：x=2、y=4<br>検算：2+4=6 ✅'
    },
    {
      qid:'math_sim_s1_in1',
      jp:'次の連立方程式を代入法で解きなさい。y の値を答えなさい。<br>① y = 2x<br>② x + y = 6',
      formula:'x = 2 を①に代入：y = 2×2',
      answer:'4', xp:4,
      hint:'y = 2×2 = 4',
      exp:'x = 2 を① y = 2x に代入<br>y = 2 × 2 = <span style="color:var(--gold)">4</span><br>答え：x=2、y=4'
    },
    {
      qid:'math_sim_s1_in2',
      jp:'次の連立方程式を代入法で解きなさい。x の値を答えなさい。<br>① y = x + 3<br>② 2x + y = 12',
      formula:'②の y に①を代入：2x + (x+3) = 12',
      answer:'3', xp:6,
      hint:'2x + (x+3) = 12 → 3x + 3 = 12 → 3x = 9 → x = 3',
      exp:'②に①を代入：2x + <span style="color:var(--gold)">(x+3)</span> = 12<br>3x + 3 = 12 → 3x = 9 → <span style="color:var(--gold)">x = 3</span><br>y = 3+3 = 6。答え：x=3、y=6<br>検算：2×3+6=12 ✅'
    },
    {
      qid:'math_sim_s1_in3',
      jp:'次の連立方程式を代入法で解きなさい。x の値を答えなさい。<br>① y = −x + 5<br>② 3x − y = 7',
      formula:'②の y に①を代入：3x − (−x+5) = 7',
      answer:'3', xp:7,
      hint:'3x − (−x+5) = 7 → 3x+x−5 = 7 → 4x = 12 → x = 3',
      exp:'②に①を代入：3x − <span style="color:var(--gold)">(−x+5)</span> = 7<br>3x + x − 5 = 7 → 4x = 12 → <span style="color:var(--gold)">x = 3</span><br>y = −3+5 = 2。答え：x=3、y=2<br>💡 −(−x+5) = +x−5 に注意！符号を丁寧に！<br>検算：3×3−2=7 ✅'
    },
    {
      qid:'math_sim_s1_in4',
      jp:'次の連立方程式を代入法で解きなさい。まず①を変形してから代入し、x の値を求めなさい。<br>① x + y = 10<br>② y = 2x − 2',
      formula:'①を y = 10−x に変形 → ②と連立、または②を①に代入',
      answer:'4', xp:7,
      hint:'②を①に代入：x + (2x−2) = 10 → 3x = 12 → x = 4',
      exp:'②の y = 2x−2 を①の y に代入<br>x + <span style="color:var(--gold)">(2x−2)</span> = 10<br>3x − 2 = 10 → 3x = 12 → <span style="color:var(--gold)">x = 4</span><br>y = 2×4−2 = 6。答え：x=4、y=6<br>検算：4+6=10 ✅　y=2×4−2=6 ✅'
    },
    {
      qid:'math_sim_s1_in5',
      jp:'前の問題の連立方程式（① x + y = 10、② y = 2x − 2）を解いたとき、y の値を答えなさい。',
      formula:'x = 4 を② y = 2x−2 に代入',
      answer:'6', xp:4,
      hint:'y = 2×4 − 2 = 8 − 2 = 6',
      exp:'x = 4 を② y = 2x−2 に代入<br>y = 2×4 − 2 = 8 − 2 = <span style="color:var(--gold)">6</span><br>答え：x=4、y=6'
    },
  ];

  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 選択問題 ──</div>';
  qs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + (i+1) + '</div>';
    html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
  });
  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 14px;font-weight:bold">── 計算問題（入力） ──</div>';
  inputQs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + (qs.length+i+1) + '</div>';
    html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });

  return html;
}

// ===== SECTION 2: 加減法 =====
function renderSection2(){
  // Step-by-step SVG: 引き算で y を消す例 + 足し算で y を消す例
  var svgElim = '<svg viewBox="0 0 300 220" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    // ---- LEFT: 同符号 → 引く ----
    + '<text x="6" y="16" fill="#8b949e" font-size="10">【同符号 → 引く】</text>'
    // Box ①
    + '<rect x="6" y="22" width="130" height="28" rx="5" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="71" y="41" fill="#a371f7" font-size="12" text-anchor="middle">① 2x + 3y = 13</text>'
    // Box ②
    + '<rect x="6" y="56" width="130" height="28" rx="5" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="71" y="75" fill="#0ea5e9" font-size="12" text-anchor="middle">②  x + 3y =  7</text>'
    // Minus label
    + '<text x="6" y="102" fill="#f5c518" font-size="11">①－② →</text>'
    // Result box
    + '<rect x="6" y="108" width="130" height="28" rx="5" fill="rgba(245,197,24,0.1)" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="71" y="127" fill="#f5c518" font-size="12" text-anchor="middle">x = 6　（3y が消えた！）</text>'
    // Arrow down
    + '<line x1="71" y1="138" x2="71" y2="158" stroke="#3fb950" stroke-width="1.5"/>'
    // Final
    + '<text x="71" y="173" fill="#3fb950" font-size="11" text-anchor="middle">x = 6 を②に代入</text>'
    + '<text x="71" y="190" fill="#3fb950" font-size="11" text-anchor="middle">→ y = 7 - 6 = 1</text>'
    + '<rect x="20" y="196" width="102" height="20" rx="4" fill="rgba(63,185,80,0.15)" stroke="#3fb950" stroke-width="1"/>'
    + '<text x="71" y="210" fill="#f5c518" font-size="11" text-anchor="middle">答え: x=6, y=1</text>'

    // ---- RIGHT: 異符号 → 足す ----
    + '<text x="162" y="16" fill="#8b949e" font-size="10">【異符号 → 足す】</text>'
    + '<rect x="162" y="22" width="130" height="28" rx="5" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="227" y="41" fill="#a371f7" font-size="12" text-anchor="middle">①  x + y = 7</text>'
    + '<rect x="162" y="56" width="130" height="28" rx="5" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="227" y="75" fill="#0ea5e9" font-size="12" text-anchor="middle">②  x - y = 3</text>'
    + '<text x="162" y="102" fill="#f5c518" font-size="11">①＋② →</text>'
    + '<rect x="162" y="108" width="130" height="28" rx="5" fill="rgba(245,197,24,0.1)" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="227" y="127" fill="#f5c518" font-size="12" text-anchor="middle">2x = 10　（y が消えた！）</text>'
    + '<line x1="227" y1="138" x2="227" y2="158" stroke="#3fb950" stroke-width="1.5"/>'
    + '<text x="227" y="173" fill="#3fb950" font-size="11" text-anchor="middle">x = 5 を①に代入</text>'
    + '<text x="227" y="190" fill="#3fb950" font-size="11" text-anchor="middle">→ y = 7 - 5 = 2</text>'
    + '<rect x="176" y="196" width="102" height="20" rx="4" fill="rgba(63,185,80,0.15)" stroke="#3fb950" stroke-width="1"/>'
    + '<text x="227" y="210" fill="#f5c518" font-size="11" text-anchor="middle">答え: x=5, y=2</text>'
    + '</svg>';

  // SVG for 係数を揃える（倍にして揃える）
  var svgCoeff = '<svg viewBox="0 0 300 140" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="6" y="16" fill="#8b949e" font-size="10">【係数を揃える例: y の係数を 6 に揃える】</text>'
    + '<rect x="6" y="22" width="130" height="26" rx="5" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="71" y="39" fill="#a371f7" font-size="11" text-anchor="middle">① 2x + 3y = 12　（×2）</text>'
    + '<rect x="6" y="54" width="130" height="26" rx="5" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="71" y="71" fill="#0ea5e9" font-size="11" text-anchor="middle">② 3x + 2y = 13　（×3）</text>'
    + '<line x1="144" y1="35" x2="162" y2="35" stroke="#f5c518" stroke-width="1.5" marker-end="url(#arr)"/>'
    + '<line x1="144" y1="67" x2="162" y2="67" stroke="#f5c518" stroke-width="1.5"/>'
    + '<rect x="164" y="22" width="130" height="26" rx="5" fill="rgba(163,113,247,0.15)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="229" y="39" fill="#a371f7" font-size="11" text-anchor="middle">① 4x + 6y = 24</text>'
    + '<rect x="164" y="54" width="130" height="26" rx="5" fill="rgba(14,165,233,0.15)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="229" y="71" fill="#0ea5e9" font-size="11" text-anchor="middle">② 9x + 6y = 39</text>'
    + '<text x="164" y="98" fill="#f5c518" font-size="11">②－① → 5x = 15 → x = 3</text>'
    + '<text x="6" y="110" fill="#8b949e" font-size="10">💡 消したい文字の係数の LCM（最小公倍数）に揃えて足し引きする</text>'
    + '<text x="6" y="128" fill="#8b949e" font-size="10">✅ 同符号なら引く　　異符号なら足す</text>'
    + '</svg>';

  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">加減法って「加える」か「減らす」方法？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">そう。2つの式を足したり引いたりして、どちらか一方の文字を消してしまう方法だ。消えてしまえば残りの1文字の方程式で解ける。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">消す！？消えるの？どうやって消すの！？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">同じ係数の文字が同符号なら引き算、異符号なら足し算。たとえば +3y と +3y は引けば消える。+y と -y は足せば消える。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">同符号→引く、異符号→足す！！これ覚えた！！</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 加減法の手順（2パターン）</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgElim + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">ルール：同符号 → 引く　　異符号 → 足す</div>'
    + '<div class="ex"><strong style="color:var(--purple)">+3y と +3y</strong>（同符号）→ 式を<strong style="color:var(--gold)">引く</strong> → 3y - 3y = 0 で消える</div>'
    + '<div class="ex"><strong style="color:var(--teal)">+y と -y</strong>（異符号）→ 式を<strong style="color:var(--gold)">足す</strong> → y + (-y) = 0 で消える</div>'
    + '<div class="note">💡 覚え方：<strong style="color:var(--gold)">「同じなら引く、違うなら足す」</strong></div>'
    + '</div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 係数が違う場合：揃えてから消す</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgCoeff + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">STEP 1：消したい文字の係数を LCM（最小公倍数）に揃える</div>'
    + '<div class="ex">例：3y と 2y → LCM は 6 → ①×2、②×3 でそれぞれ 6y にする</div>'
    + '<div class="rule-title" style="margin-top:8px">STEP 2：揃えたら引く（同符号だから）</div>'
    + '<div class="ex">6y - 6y = 0 → y が消えて x だけの式になる</div>'
    + '<div class="note">💡 代入法より加減法が楽なケース：y = ... の形に変形しにくいとき</div>'
    + '</div>'
    + '</div>';

  var qs = [
    {
      qid:'math_sim_s2_q0',
      jp:'{ x + y = 7　② x - y = 3 を加減法で解く。2つの式を「足す」と？',
      answer:'2x = 10',
      choices:['2x = 10', '2y = 4', '2x = 4', 'x + y = 10'],
      exp:'📐 ①＋② → (x+y)+(x-y) = 7+3 → <span style="color:var(--gold)">2x = 10</span><br>✅ y と -y が足されて 0 になり消える！（異符号→足す）'
    },
    {
      qid:'math_sim_s2_q1',
      jp:'{ x + y = 7　② x - y = 3 を加減法で解いたとき、x の値は？',
      answer:'5',
      choices:['5', '4', '3', '7'],
      exp:'📐 2x=10 → x=<span style="color:var(--gold)">5</span><br>次に①へ代入：5+y=7 → y=2。答え：x=5, y=2<br>検算：5-2=3 ✅'
    },
    {
      qid:'math_sim_s2_q2',
      jp:'{ 2x + 3y = 13　② x + 3y = 7 で「引く」(①－②)と？',
      answer:'x = 6',
      choices:['x = 6', 'x = 20', '3x = 20', 'y = 2'],
      exp:'📐 ①－② → (2x+3y)-(x+3y) = 13-7 → <span style="color:var(--gold)">x = 6</span><br>✅ 3y と 3y が同符号なので引けば消える！（同符号→引く）'
    },
    {
      qid:'math_sim_s2_q3',
      jp:'加減法で y を消すために式を「引く」のはどの場合？',
      answer:'2つの式の y の係数が同符号（例：+2y と +2y）のとき',
      choices:[
        '2つの式の y の係数が同符号（例：+2y と +2y）のとき',
        '2つの式の y の係数が異符号（例：+2y と -2y）のとき',
        '2つの式の x の係数が同じとき',
        'y の係数がどちらも 1 のとき'
      ],
      exp:'📐 同符号（どちらも + or どちらも -）→ 引く → 差が 0 になって消える<br>例：+2y - (+2y) = 0 ✅<br>異符号（+ と -）→ 足す → 和が 0 になって消える'
    },
    {
      qid:'math_sim_s2_q4',
      jp:'{ 2x + y = 8　② x + y = 5 を加減法で解くと x は？',
      answer:'3',
      choices:['3', '5', '4', '2'],
      exp:'📐 ①－② → (2x+y)-(x+y) = 8-5 → x=<span style="color:var(--gold)">3</span><br>x=3 を②に代入：3+y=5 → y=2。答え：x=3, y=2<br>検算：2×3+2=8 ✅'
    },
    {
      qid:'math_sim_s2_q5',
      jp:'{ 3x + 2y = 16　② x + 2y = 8 を加減法で解くと x は？',
      answer:'4',
      choices:['4', '3', '5', '2'],
      exp:'📐 2y が同符号（+2y と +2y）→ ①－② → 2x=8 → x=<span style="color:var(--gold)">4</span><br>x=4 を②に代入：4+2y=8 → 2y=4 → y=2。答え：x=4, y=2'
    },
  ];

  var inputQs = [
    {
      qid:'math_sim_s2_in0',
      jp:'{ x + y = 8　② x - y = 2 を加減法で解け。x の値は？',
      formula:'①＋② で y を消す',
      answer:'5', xp:6,
      hint:'①＋② → 2x = 10 → x = 5',
      exp:'異符号（+y と -y）→ 足す → 2x=10 → <span style="color:var(--gold)">x=5</span><br>②に代入：5-y=2 → y=3。答え：x=5, y=3'
    },
    {
      qid:'math_sim_s2_in1',
      jp:'{ x + y = 8　② x - y = 2 を解いたとき y の値は？',
      formula:'x = 5 を式①に代入',
      answer:'3', xp:5,
      hint:'5 + y = 8 → y = 3',
      exp:'5+y=8 → <span style="color:var(--gold)">y=3</span>。答え：x=5, y=3<br>検算：5+3=8 ✅　5-3=2 ✅'
    },
    {
      qid:'math_sim_s2_in2',
      jp:'{ 3x + y = 11　② x + y = 5 を加減法で解け。x の値は？',
      formula:'①－② で y を消す',
      answer:'3', xp:6,
      hint:'①－② → 2x = 6 → x = 3',
      exp:'同符号（+y と +y）→ 引く → ①－② → 2x=6 → <span style="color:var(--gold)">x=3</span><br>②に代入：3+y=5 → y=2。答え：x=3, y=2'
    },
    {
      qid:'math_sim_s2_in3',
      jp:'{ 2x + 3y = 13　② 2x + y = 7 を加減法で解け。y の値は？',
      formula:'①－② で x を消す',
      answer:'3', xp:6,
      hint:'①－② → 2y = 6 → y = 3',
      exp:'同符号（+2x と +2x）→ 引く → ①－② → 2y=6 → <span style="color:var(--gold)">y=3</span><br>②に代入：2x+3=7 → 2x=4 → x=2。答え：x=2, y=3'
    },
    {
      qid:'math_sim_s2_in4',
      jp:'{ 4x - y = 10　② 2x - y = 4 を加減法で解け。x の値は？',
      formula:'①－② で y を消す',
      answer:'3', xp:6,
      hint:'①－② → 2x = 6 → x = 3',
      exp:'同符号（-y と -y）→ 引く → ①－② → 2x=6 → <span style="color:var(--gold)">x=3</span><br>②に代入：2×3-y=4 → y=2。答え：x=3, y=2'
    },
    {
      qid:'math_sim_s2_in5',
      jp:'{ 2x + 3y = 12　② 4x + 3y = 18 を加減法で解け。x の値は？',
      formula:'②－① で y を消す',
      answer:'3', xp:7,
      hint:'②－① → 2x = 6 → x = 3',
      exp:'同符号（+3y と +3y）→ 引く → ②－① → 2x=6 → <span style="color:var(--gold)">x=3</span><br>①に代入：2×3+3y=12 → 6+3y=12 → 3y=6 → y=2。答え：x=3, y=2'
    },
  ];

  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 選択問題 ──</div>';
  qs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + (i+1) + '</div>';
    html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
  });
  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 14px;font-weight:bold">── 計算問題（入力） ──</div>';
  inputQs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + (qs.length+i+1) + '</div>';
    html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });

  return html;
}
// ===== SECTION 3: 文章題 =====
function renderSection3(){

  // SVG: 個数・代金タイプの式の立て方
  var svgMoney = '<svg viewBox="0 0 300 110" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="150" y="15" fill="#8b949e" font-size="10" text-anchor="middle">【個数・代金の式の立て方】</text>'
    // Row 1: 個数
    + '<rect x="6" y="22" width="56" height="26" rx="4" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="1"/>'
    + '<text x="34" y="39" fill="#a371f7" font-size="11" text-anchor="middle">x 個</text>'
    + '<text x="68" y="39" fill="#f5c518" font-size="14">＋</text>'
    + '<rect x="82" y="22" width="56" height="26" rx="4" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1"/>'
    + '<text x="110" y="39" fill="#0ea5e9" font-size="11" text-anchor="middle">y 個</text>'
    + '<text x="144" y="39" fill="#8b949e" font-size="14">＝</text>'
    + '<rect x="158" y="22" width="56" height="26" rx="4" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="1"/>'
    + '<text x="186" y="39" fill="#3fb950" font-size="10" text-anchor="middle">合計個数</text>'
    + '<text x="220" y="39" fill="#8b949e" font-size="11">← 式①</text>'
    // Row 2: 代金
    + '<rect x="6" y="58" width="56" height="26" rx="4" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="1"/>'
    + '<text x="34" y="75" fill="#a371f7" font-size="10" text-anchor="middle">単価A×x</text>'
    + '<text x="68" y="75" fill="#f5c518" font-size="14">＋</text>'
    + '<rect x="82" y="58" width="56" height="26" rx="4" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1"/>'
    + '<text x="110" y="75" fill="#0ea5e9" font-size="10" text-anchor="middle">単価B×y</text>'
    + '<text x="144" y="75" fill="#8b949e" font-size="14">＝</text>'
    + '<rect x="158" y="58" width="56" height="26" rx="4" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="1"/>'
    + '<text x="186" y="75" fill="#3fb950" font-size="10" text-anchor="middle">合計金額</text>'
    + '<text x="220" y="75" fill="#8b949e" font-size="11">← 式②</text>'
    + '<text x="6" y="104" fill="#8b949e" font-size="10">💡「個数の式」と「代金の式」の 2 本を立てる！</text>'
    + '</svg>';

  // SVG: 速さタイプ（反対方向・同方向）
  var svgSpeed = '<svg viewBox="0 0 300 120" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="6" y="14" fill="#8b949e" font-size="10">【速さの文章題の式の立て方】</text>'
    // Left figure: opposite directions
    + '<text x="6" y="32" fill="#a371f7" font-size="10">反対方向に出発</text>'
    + '<text x="6" y="50" fill="#8b949e" font-size="10">← x m/分</text>'
    + '<circle cx="80" cy="45" r="8" fill="rgba(163,113,247,0.2)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="80" y="49" fill="#a371f7" font-size="9" text-anchor="middle">A</text>'
    + '<line x1="94" y1="45" x2="134" y2="45" stroke="#30363d" stroke-width="1.5" stroke-dasharray="3,2"/>'
    + '<circle cx="148" cy="45" r="8" fill="rgba(14,165,233,0.2)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="148" y="49" fill="#0ea5e9" font-size="9" text-anchor="middle">B</text>'
    + '<text x="150" y="50" fill="#8b949e" font-size="10">　y m/分 →</text>'
    + '<text x="6" y="68" fill="#f5c518" font-size="10">t 分後の距離 = (x + y) × t</text>'
    // Right figure: same direction
    + '<text x="6" y="88" fill="#0ea5e9" font-size="10">同方向に出発</text>'
    + '<circle cx="30" cy="105" r="8" fill="rgba(163,113,247,0.2)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="30" y="109" fill="#a371f7" font-size="9" text-anchor="middle">A</text>'
    + '<circle cx="60" cy="105" r="8" fill="rgba(14,165,233,0.2)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="60" y="109" fill="#0ea5e9" font-size="9" text-anchor="middle">B</text>'
    + '<line x1="74" y1="105" x2="120" y2="105" stroke="#30363d" stroke-width="1.5" stroke-dasharray="3,2" marker-end="url(#arr)"/>'
    + '<text x="130" y="109" fill="#f5c518" font-size="10">→ t 分後の差 = (y - x) × t</text>'
    + '</svg>';

  // SVG: 食塩水
  var svgSalt = '<svg viewBox="0 0 300 110" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="6" y="14" fill="#8b949e" font-size="10">【食塩水の式の立て方】</text>'
    // Beaker 1
    + '<rect x="10" y="22" width="60" height="50" rx="4" fill="rgba(163,113,247,0.1)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="40" y="44" fill="#a371f7" font-size="11" text-anchor="middle">x g</text>'
    + '<text x="40" y="60" fill="#a371f7" font-size="10" text-anchor="middle">a%</text>'
    + '<text x="40" y="82" fill="#8b949e" font-size="9" text-anchor="middle">食塩水A</text>'
    // Plus
    + '<text x="76" y="52" fill="#f5c518" font-size="18">＋</text>'
    // Beaker 2
    + '<rect x="94" y="22" width="60" height="50" rx="4" fill="rgba(14,165,233,0.1)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="124" y="44" fill="#0ea5e9" font-size="11" text-anchor="middle">y g</text>'
    + '<text x="124" y="60" fill="#0ea5e9" font-size="10" text-anchor="middle">b%</text>'
    + '<text x="124" y="82" fill="#8b949e" font-size="9" text-anchor="middle">食塩水B</text>'
    // Arrow
    + '<text x="160" y="52" fill="#8b949e" font-size="18">→</text>'
    // Result
    + '<rect x="180" y="22" width="70" height="50" rx="4" fill="rgba(63,185,80,0.1)" stroke="#3fb950" stroke-width="1.5"/>'
    + '<text x="215" y="44" fill="#3fb950" font-size="11" text-anchor="middle">x+y g</text>'
    + '<text x="215" y="60" fill="#3fb950" font-size="10" text-anchor="middle">c%</text>'
    + '<text x="215" y="82" fill="#8b949e" font-size="9" text-anchor="middle">混合後</text>'
    // Equations
    + '<text x="6" y="100" fill="#f5c518" font-size="10">量: x+y = x+y　　食塩: ax/100 + by/100 = c(x+y)/100</text>'
    + '</svg>';

  // SVG: 価格%（原価→定価→売価の流れ）
  var svgPrice = '<svg viewBox="0 0 300 130" style="width:100%;max-width:340px;display:block;margin:0 auto">'
    + '<text x="150" y="14" fill="#8b949e" font-size="10" text-anchor="middle">【原価 → 定価 → 売価の流れ】</text>'
    + '<rect x="4" y="30" width="70" height="42" rx="6" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="1.5"/>'
    + '<text x="39" y="48" fill="#a371f7" font-size="11" text-anchor="middle" font-weight="bold">原価</text>'
    + '<text x="39" y="64" fill="#a371f7" font-size="10" text-anchor="middle">x 円</text>'
    + '<line x1="74" y1="51" x2="102" y2="51" stroke="#f5c518" stroke-width="2"/>'
    + '<polygon points="102,47 110,51 102,55" fill="#f5c518"/>'
    + '<text x="88" y="40" fill="#f5c518" font-size="9" text-anchor="middle">+a%</text>'
    + '<rect x="104" y="30" width="76" height="42" rx="6" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="1.5"/>'
    + '<text x="142" y="48" fill="#f5c518" font-size="11" text-anchor="middle" font-weight="bold">定価</text>'
    + '<text x="142" y="64" fill="#f5c518" font-size="9" text-anchor="middle">x×(1+a/100)</text>'
    + '<line x1="180" y1="51" x2="208" y2="51" stroke="#0ea5e9" stroke-width="2"/>'
    + '<polygon points="208,47 216,51 208,55" fill="#0ea5e9"/>'
    + '<text x="194" y="40" fill="#0ea5e9" font-size="9" text-anchor="middle">-b%</text>'
    + '<rect x="210" y="30" width="76" height="42" rx="6" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="1.5"/>'
    + '<text x="248" y="48" fill="#0ea5e9" font-size="11" text-anchor="middle" font-weight="bold">売価</text>'
    + '<text x="248" y="64" fill="#0ea5e9" font-size="9" text-anchor="middle">定価×(1-b/100)</text>'
    + '<text x="6" y="94" fill="#8b949e" font-size="10">💡 利益（もうけ）＝ 売価 − 原価</text>'
    + '<text x="6" y="112" fill="#8b949e" font-size="10">2つの商品があれば「合計の式」と「%後の合計の式」で連立方程式！</text>'
    + '</svg>';

  var html = '';

  html += '<div class="intro-box">'
    + '<div class="intro-box-title">📐 きょん＆西村の会話</div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">文章題って苦手……どこで x と y を使えばいいのかわからない</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村真二（慶應卒・元アナ）</div><div class="chat-bubble">2 つの「未知のもの」を x と y に置く。そして「関係している条件」が 2 つあれば、それがそのまま連立方程式の 2 式になる。</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-kyon">😄</div><div><div class="chat-name">きょん</div><div class="chat-bubble">条件が 2 つあるから式が 2 本書ける——てこと？</div></div></div>'
    + '<div class="chat-line"><div class="avatar av-nishi">慶</div><div><div class="chat-name">西村</div><div class="chat-bubble">完璧。「個数の条件」と「代金の条件」のように、2 種類の条件を探すのが文章題を解く第一歩だ。</div></div></div>'
    + '</div>';

  html += '<div class="rule-card">'
    + '<div class="rule-card-title">📐 文章題の式の立て方 4 パターン</div>'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;font-weight:bold">① 個数・代金</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgMoney + '</div>'

    + '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;font-weight:bold">② 速さ・道のり</div>'
    + '<div class="rule-box" style="margin-bottom:14px">'
    + '<div class="rule-title">📐 速さの超基本公式</div>'
    + '<div class="ex" style="font-family:monospace;font-size:15px;color:var(--gold)">道のり（距離）＝ 速さ × 時間</div>'
    + '<div class="ex">💡 覚え方：「は・じ・き」→ <strong style="color:var(--purple)">は</strong>（速さ）×<strong style="color:var(--teal)">じ</strong>（時間）＝<strong style="color:var(--gold)">き</strong>（距離）</div>'
    + '<div class="note">⚠️ 単位を揃える：分速（m/分）なら時間は「分」、時速（km/時）なら時間は「時間」で計算！</div>'
    + '</div>'
    + '<div class="rule-box" style="margin-bottom:14px">'
    + '<div class="rule-title">表で整理してから式を立てる</div>'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0;color:var(--text2)">'
    + '<tr><th style="text-align:left;padding:4px;border-bottom:1px solid var(--border)"></th><th style="padding:4px;border-bottom:1px solid var(--border)">速さ</th><th style="padding:4px;border-bottom:1px solid var(--border)">時間</th><th style="padding:4px;border-bottom:1px solid var(--border)">道のり</th></tr>'
    + '<tr><td style="padding:4px;color:var(--purple)">きょん</td><td style="padding:4px;text-align:center">x m/分</td><td style="padding:4px;text-align:center">t 分</td><td style="padding:4px;text-align:center">x×t m</td></tr>'
    + '<tr><td style="padding:4px;color:var(--teal)">にっくん</td><td style="padding:4px;text-align:center">y m/分</td><td style="padding:4px;text-align:center">t 分</td><td style="padding:4px;text-align:center">y×t m</td></tr>'
    + '</table>'
    + '<div class="note">💡 表の3マスのうち2つが分かれば、残り1つは公式（道のり＝速さ×時間）で計算できる！</div>'
    + '</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgSpeed + '</div>'
    + '<div class="rule-box" style="margin-bottom:14px">'
    + '<div class="rule-title">例題で確認：反対方向・同方向パターン</div>'
    + '<div class="ex" style="line-height:2.3">'
    + '問題：きょん（分速 x m）とにっくん（分速 y m）が同じ場所から反対方向に歩き出す。10分後に2人の間は200m離れていた。また同方向に歩くと10分で40mの差がつく。2人の速さは？<br><br>'
    + '<span style="color:var(--purple)">【STEP1】</span> きょんの速さ＝x、にっくんの速さ＝y と置く<br>'
    + '<span style="color:var(--teal)">【STEP2】</span> 反対方向 → 道のりの合計＝離れた距離 → 10×(x+y)=200 → <strong>x+y=20</strong> …①<br>'
    + '　同方向 → 速い方から遅い方を引いた差＝道のりの差 → 10×(y-x)=40 → <strong>y-x=4</strong> …②<br>'
    + '<span style="color:var(--green)">【STEP3】</span> ①＋② → 2y=24 → y=12、x=8<br>'
    + '<span style="color:var(--gold)">【STEP4】</span> 答え：きょん 分速8m、にっくん 分速12m'
    + '</div>'
    + '<div class="note">💡 「反対方向＝足す」「同方向の差＝引く」がカギ！</div>'
    + '</div>'

    + '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;font-weight:bold">③ 食塩水</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgSalt + '</div>'

    + '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;font-weight:bold">④ 価格・割引（原価・定価）</div>'
    + '<div style="overflow-x:auto;margin-bottom:14px">' + svgPrice + '</div>'
    + '<div class="rule-box" style="margin-bottom:14px">'
    + '<div class="rule-title">📐 %を「倍」に直すルール</div>'
    + '<div class="ex">a% の利益を見込む → 原価 × <strong style="color:var(--gold)">(1 + a/100)</strong> = 定価</div>'
    + '<div class="ex">b% 引きで売る → 定価 × <strong style="color:var(--gold)">(1 − b/100)</strong> = 売価</div>'
    + '<div class="ex" style="color:var(--green)">✅ 正例：20%の利益 → ×1.2　　10%引き → ×0.9</div>'
    + '<div class="ex" style="color:var(--red)">❌ 誤例：「10%引き」を ×0.1 にしてしまう（正しくは ×0.9）</div>'
    + '<div class="note">💡 チェック方法：割引後は必ず元より安い＝1より小さい数（0.9など）。利益を見込むと必ず元より高い＝1より大きい数（1.2など）</div>'
    + '</div>'
    + '<div class="rule-box" style="margin-bottom:14px">'
    + '<div class="rule-title">例題で確認：2つの商品の原価%問題</div>'
    + '<div class="ex" style="line-height:2.3">'
    + '問題：りんごとみかんを合わせて1000円で仕入れた。りんごには20%、みかんには10%の利益を見込んで定価をつけたところ、定価の合計は1150円になった。それぞれの仕入れ値は？<br><br>'
    + '<span style="color:var(--purple)">【STEP1】</span> りんごの仕入れ値＝x円、みかんの仕入れ値＝y円と置く<br>'
    + '<span style="color:var(--teal)">【STEP2】</span> 仕入れ値の合計 → x+y=1000 …①<br>　定価の合計（20%増・10%増）→ 1.2x+1.1y=1150 …②<br>'
    + '<span style="color:var(--green)">【STEP3】</span> y=1000-x を②に代入 → 1.2x+1.1(1000-x)=1150 → 0.1x=50 → x=500、y=500<br>'
    + '<span style="color:var(--gold)">【STEP4】</span> 答え：りんご500円、みかん500円'
    + '</div>'
    + '<div class="note">💡 「合計の式」と「%をかけた後の合計の式」の2本を立てるのがコツ！</div>'
    + '</div>'

    + '<div class="rule-box">'
    + '<div class="rule-title">文章題の解き方ステップ</div>'
    + '<div class="ex"><strong style="color:var(--purple)">STEP 1</strong>　求めるものを x, y と置く</div>'
    + '<div class="ex"><strong style="color:var(--teal)">STEP 2</strong>　条件を 2 つ見つけて式を 2 本立てる</div>'
    + '<div class="ex"><strong style="color:var(--green)">STEP 3</strong>　連立方程式を解く（代入法 or 加減法）</div>'
    + '<div class="ex"><strong style="color:var(--gold)">STEP 4</strong>　答えを問題の単位で書く（「x = 4 個」など）</div>'
    + '<div class="note">💡 最後に「問題に合うかどうか」確認（個数がマイナスにならないか等）</div>'
    + '</div>'
    + '</div>';

  var qs = [
    {
      qid:'math_sim_s3_q0',
      jp:'りんご x 個（1 個 100 円）とバナナ y 本（1 本 60 円）を合わせて 9 個買い、合計 700 円だった。連立方程式として正しいのは？',
      answer:'{ x+y=9, 100x+60y=700 }',
      choices:['{ x+y=9, 100x+60y=700 }', '{ x+y=700, 100x+60y=9 }', '{ x+y=9, 60x+100y=700 }', '{ x-y=9, 100x+60y=700 }'],
      exp:'📐 個数の条件：x+y=9<br>代金の条件：100x+60y=700<br>✅ 正しい式の組み合わせは <span style="color:var(--gold)">{ x+y=9, 100x+60y=700 }</span>'
    },
    {
      qid:'math_sim_s3_q1',
      jp:'{ x+y=9, 100x+60y=700 } を解く。y=9-x を代入すると？',
      answer:'100x+60(9-x)=700',
      choices:['100x+60(9-x)=700', '100(9-y)+60y=700', '100x+60x=700', '60x+100(9-x)=700'],
      exp:'📐 y = 9-x を代入 → <span style="color:var(--gold)">100x+60(9-x)=700</span><br>展開：100x+540-60x=700 → 40x=160 → x=4, y=5'
    },
    {
      qid:'math_sim_s3_q2',
      jp:'大人 x 人・子供 y 人が映画館に入った。合計 5 人、大人 1200 円・子供 600 円で合計 4800 円。y（子供の人数）は？',
      answer:'2',
      choices:['2', '3', '4', '1'],
      exp:'📐 { x+y=5, 1200x+600y=4800 }<br>②÷600：2x+y=8<br>①を引く：x=3 → y=5-3=<span style="color:var(--gold)">2</span><br>答え：大人 3 人・子供 2 人'
    },
    {
      qid:'math_sim_s3_q6',
      jp:'分速 x m で 12 分歩いたときの道のりを表す式は？',
      answer:'12x',
      choices:['12x', 'x/12', 'x+12', '12/x'],
      exp:'📐 道のり＝速さ×時間 → x×12=<span style="color:var(--gold)">12x</span>（m）'
    },
    {
      qid:'math_sim_s3_q7',
      jp:'A（分速 x m）とB（分速 y m）が同じ場所から反対方向に 7 分歩くと 210 m 離れた。この条件を式にすると？',
      answer:'7(x+y)=210',
      choices:['7(x+y)=210', '7(x-y)=210', 'x+y=210', '7(y-x)=210'],
      exp:'📐 反対方向 → 2人の道のりの合計＝離れた距離 → 7×(x+y)=210 → <span style="color:var(--gold)">7(x+y)=210</span>'
    },
    {
      qid:'math_sim_s3_q3',
      jp:'きょん（分速 x m）とにっくん（分速 y m）が反対方向に走ると 10 分で 200 m 離れる。同方向に走ると 10 分で 40 m 差がつく。連立方程式は？',
      answer:'{ x+y=20, y-x=4 }',
      choices:['{ x+y=20, y-x=4 }', '{ x+y=200, y-x=40 }', '{ xy=20, y-x=4 }', '{ x+y=20, y+x=4 }'],
      exp:'📐 反対方向：10(x+y)=200 → x+y=20<br>同方向（にっくん速い）：10(y-x)=40 → y-x=4<br>✅ 正解は <span style="color:var(--gold)">{ x+y=20, y-x=4 }</span>'
    },
    {
      qid:'math_sim_s3_q4',
      jp:'{ x+y=20, y-x=4 } を加減法で解いたとき、にっくんの速さ y（m/分）は？',
      answer:'12',
      choices:['12', '8', '10', '16'],
      exp:'📐 ①＋② → 2y=24 → y=<span style="color:var(--gold)">12</span><br>x=20-12=8<br>答え：きょん 8 m/分・にっくん 12 m/分'
    },
    {
      qid:'math_sim_s3_q5',
      jp:'5% の食塩水 x g と 8% の食塩水 y g を混ぜると 6% の食塩水 300 g になった。食塩の量の等式は？',
      answer:'5x + 8y = 1800',
      choices:['5x + 8y = 1800', '5x + 8y = 18', '6x + 8y = 1800', '5x + 6y = 1800'],
      exp:'📐 食塩の量（g）：5x/100 + 8y/100 = 6×300/100<br>両辺×100 → <span style="color:var(--gold)">5x+8y=1800</span><br>x+y=300 と連立して解く'
    },
    {
      qid:'math_sim_s3_q8',
      jp:'定価 y 円の商品を「15%引き」で売るときの売価を表す式は？',
      answer:'y×(1-0.15)',
      choices:['y×(1-0.15)', 'y×0.15', 'y×(1+0.15)', 'y-15'],
      exp:'📐 b%引き → 定価×(1-b/100) → 15%引き＝<span style="color:var(--gold)">y×(1-0.15)</span>＝0.85y'
    },
    {
      qid:'math_sim_s3_q9',
      jp:'りんご（仕入れ値 x 円）とみかん（仕入れ値 y 円）を合わせて 1000 円で仕入れ、りんごに 20%、みかんに 10% の利益を見込んで定価をつけたら合計 1150 円になった。連立方程式として正しいのは？',
      answer:'{ x+y=1000, 1.2x+1.1y=1150 }',
      choices:['{ x+y=1000, 1.2x+1.1y=1150 }', '{ x+y=1150, 1.2x+1.1y=1000 }', '{ x+y=1000, 0.2x+0.1y=1150 }', '{ x+y=1000, 1.1x+1.2y=1150 }'],
      exp:'📐 仕入れ値の合計：x+y=1000<br>定価の合計（20%増・10%増）：1.2x+1.1y=1150<br>✅ 正しい組み合わせは <span style="color:var(--gold)">{ x+y=1000, 1.2x+1.1y=1150 }</span>'
    },
    {
      qid:'math_sim_s3_q10',
      jp:'スニーカー（定価 x 円）とリュック（定価 y 円）を、スニーカーは定価の10%引き、リュックは定価の20%引きで買うと合計3600円。定価のままだと合計4200円。連立方程式として正しいのは？',
      answer:'{ x+y=4200, 0.9x+0.8y=3600 }',
      choices:['{ x+y=4200, 0.9x+0.8y=3600 }', '{ x+y=3600, 0.9x+0.8y=4200 }', '{ x+y=4200, 0.1x+0.2y=3600 }', '{ x+y=4200, 0.8x+0.9y=3600 }'],
      exp:'📐 定価の合計：x+y=4200<br>割引後の合計（10%引き・20%引き）：0.9x+0.8y=3600<br>✅ 正しい組み合わせは <span style="color:var(--gold)">{ x+y=4200, 0.9x+0.8y=3600 }</span>'
    },
  ];

  var inputQs = [
    {
      qid:'math_sim_s3_in0',
      jp:'りんご x 個・バナナ y 本（x+y=9, 100x+60y=700）を解け。りんご x の個数は？',
      formula:'y = 9-x を代入して解く',
      answer:'4', xp:7,
      hint:'100x+60(9-x)=700 → 40x=160 → x=4',
      exp:'100x+540-60x=700 → 40x=160 → <span style="color:var(--gold)">x=4</span>（りんご 4 個）<br>y=9-4=5（バナナ 5 本）'
    },
    {
      qid:'math_sim_s3_in1',
      jp:'上の問題（りんご x 個・バナナ y 本）で、バナナ y の本数は？',
      formula:'x = 4 を x+y=9 に代入',
      answer:'5', xp:5,
      hint:'4 + y = 9 → y = 5',
      exp:'4+y=9 → <span style="color:var(--gold)">y=5</span>（バナナ 5 本）<br>検算：100×4+60×5=400+300=700 ✅'
    },
    {
      qid:'math_sim_s3_in2',
      jp:'大人 x 人・子供 y 人（x+y=5, 1200x+600y=4800）を解け。大人 x の人数は？',
      formula:'②÷600 → 2x+y=8。①を引く',
      answer:'3', xp:7,
      hint:'2x+y=8 から x+y=5 を引く → x=3',
      exp:'②÷600 → 2x+y=8<br>2x+y - (x+y) = 8-5 → <span style="color:var(--gold)">x=3</span>（大人 3 人）<br>y=5-3=2（子供 2 人）'
    },
    {
      qid:'math_sim_s3_in6',
      jp:'分速 70 m で 15 分歩いたときの道のりは何 m？',
      formula:'道のり＝速さ×時間',
      answer:'1050', xp:4,
      hint:'70×15 を計算する',
      exp:'70×15=<span style="color:var(--gold)">1050</span>（m）'
    },
    {
      qid:'math_sim_s3_in3',
      jp:'きょん（x m/分）とにっくん（y m/分）で x+y=20, y-x=4。きょんの速さ x は？',
      formula:'①＋② → 2y=24 → y=12 → x=?',
      answer:'8', xp:6,
      hint:'y=12 を x+y=20 に代入 → x=20-12=8',
      exp:'y=12 → x+12=20 → <span style="color:var(--gold)">x=8</span>（きょん 8 m/分）<br>検算：8+12=20 ✅　12-8=4 ✅'
    },
    {
      qid:'math_sim_s3_in4',
      jp:'食塩水（x+y=300, 5x+8y=1800）を解け。5% の食塩水 x（g）は？',
      formula:'x=300-y を 5x+8y=1800 に代入',
      answer:'200', xp:8,
      hint:'5(300-y)+8y=1800 → 1500+3y=1800 → 3y=300 → y=100 → x=200',
      exp:'x=300-y を代入 → 5(300-y)+8y=1800 → 3y=300 → y=100<br>x=300-100=<span style="color:var(--gold)">200</span>（5% 食塩水 200 g）'
    },
    {
      qid:'math_sim_s3_in5',
      jp:'上の食塩水問題で、8% の食塩水 y（g）は？',
      formula:'x = 200 を x+y=300 に代入',
      answer:'100', xp:5,
      hint:'200 + y = 300 → y = 100',
      exp:'200+y=300 → <span style="color:var(--gold)">y=100</span>（8% 食塩水 100 g）<br>検算：5×200+8×100=1000+800=1800 ✅'
    },
    {
      qid:'math_sim_s3_in7',
      jp:'{ x+y=1000, 1.2x+1.1y=1150 }（りんご x 円・みかん y 円）を解け。りんごの仕入れ値 x は？',
      formula:'y=1000-x を代入',
      answer:'500', xp:8,
      hint:'1.2x+1.1(1000-x)=1150 → 0.1x=50 → x=500',
      exp:'1.2x+1.1(1000-x)=1150 → 1.2x+1100-1.1x=1150 → 0.1x=50 → <span style="color:var(--gold)">x=500</span>（りんご500円）'
    },
    {
      qid:'math_sim_s3_in8',
      jp:'上の問題（りんご x 円・みかん y 円）で、みかんの仕入れ値 y は？',
      formula:'x=500 を x+y=1000 に代入',
      answer:'500', xp:5,
      hint:'500+y=1000 → y=500',
      exp:'500+y=1000 → <span style="color:var(--gold)">y=500</span>（みかん500円）<br>検算：1.2×500+1.1×500=600+550=1150 ✅'
    },
    {
      qid:'math_sim_s3_in9',
      jp:'{ x+y=4200, 0.9x+0.8y=3600 }（スニーカー定価 x 円・リュック定価 y 円）を解け。スニーカーの定価 x は？',
      formula:'y=4200-x を代入',
      answer:'2400', xp:8,
      hint:'0.9x+0.8(4200-x)=3600 → 0.1x=240 → x=2400',
      exp:'0.9x+0.8(4200-x)=3600 → 0.9x+3360-0.8x=3600 → 0.1x=240 → <span style="color:var(--gold)">x=2400</span>（スニーカー2400円）'
    },
    {
      qid:'math_sim_s3_in10',
      jp:'上の問題（スニーカー定価 x 円・リュック定価 y 円）で、リュックの定価 y は？',
      formula:'x=2400 を x+y=4200 に代入',
      answer:'1800', xp:5,
      hint:'2400+y=4200 → y=1800',
      exp:'2400+y=4200 → <span style="color:var(--gold)">y=1800</span>（リュック1800円）<br>検算：0.9×2400+0.8×1800=2160+1440=3600 ✅'
    },
  ];

  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 選択問題 ──</div>';
  qs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + (i+1) + '</div>';
    html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
  });
  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 14px;font-weight:bold">── 計算問題（入力） ──</div>';
  inputQs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + (qs.length+i+1) + '</div>';
    html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });

  return html;
}
// ===== SECTION 4: 確認テスト =====
function renderSection4(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 確認テスト — 連立方程式 総まとめ</div>'
    + '<div class="rule-box">'
    + '<div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + '代入法・加減法・文章題の全範囲から <strong style="color:var(--gold)">20問</strong>！<br>'
    + 'きょん「今まで学んだこと全部出す！！負けない！！」<br>'
    + '西村「落ち着いて解けばできる。解き方の手順を思い出せ」'
    + '</div></div></div>';

  // ─── 代入法 ───
  html += '<div style="font-size:14px;color:var(--purple);font-weight:bold;margin:20px 0 10px;letter-spacing:1px">── 代入法 ──</div>';

  var s1qs = [
    {
      qid:'math_sim_s4_q0', type:'choice',
      jp:'{ y = 3x　② x + y = 8 } 式②に y = 3x を代入すると？',
      answer:'x + 3x = 8',
      choices:['x + 3x = 8', 'x + 3 = 8', '3x + 3x = 8', 'x - 3x = 8'],
      exp:'📐 式②の y を 3x に置き換える → <span style="color:var(--gold)">x + 3x = 8</span> → 4x=8 → x=2, y=6'
    },
    {
      qid:'math_sim_s4_q1', type:'input',
      jp:'{ y = 3x　② x + y = 8 } 代入法で解け。x の値は？',
      formula:'x + 3x = 8 → 4x = 8',
      answer:'2', xp:6,
      hint:'4x=8 → x=2 → y=6',
      exp:'4x=8 → <span style="color:var(--gold)">x=2</span>。y=3×2=6。答え：x=2, y=6'
    },
    {
      qid:'math_sim_s4_q2', type:'input',
      jp:'{ y = 2x - 1　② x + y = 8 } 代入法で解け。x の値は？',
      formula:'① を ② に代入',
      answer:'3', xp:6,
      hint:'x+(2x-1)=8 → 3x=9 → x=3',
      exp:'x+(2x-1)=8 → 3x=9 → <span style="color:var(--gold)">x=3</span>。y=2×3-1=5。答え：x=3, y=5'
    },
    {
      qid:'math_sim_s4_q3', type:'choice',
      jp:'{ x = y + 3　② 2x - y = 7 } 代入後の式は？',
      answer:'2(y+3) - y = 7',
      choices:['2(y+3) - y = 7', '2y + 3 - y = 7', '2x - (x+3) = 7', '2(y+3) + y = 7'],
      exp:'📐 式② の x に (y+3) を代入 → <span style="color:var(--gold)">2(y+3)-y=7</span> → 2y+6-y=7 → y=1, x=4'
    },
    {
      qid:'math_sim_s4_q4', type:'input',
      jp:'{ x - y = 3　② 2x + y = 9 } 代入法で解け（y = x-3 と変形）。x の値は？',
      formula:'y = x-3 を ② に代入',
      answer:'4', xp:6,
      hint:'2x+(x-3)=9 → 3x=12 → x=4',
      exp:'2x+(x-3)=9 → 3x=12 → <span style="color:var(--gold)">x=4</span>。y=4-3=1。答え：x=4, y=1'
    },
    {
      qid:'math_sim_s4_q5', type:'input',
      jp:'{ 3x + y = 7　② y = x - 1 } 代入法で解け。x の値は？',
      formula:'② を ① に代入',
      answer:'2', xp:6,
      hint:'3x+(x-1)=7 → 4x=8 → x=2',
      exp:'3x+(x-1)=7 → 4x=8 → <span style="color:var(--gold)">x=2</span>。y=2-1=1。答え：x=2, y=1'
    },
  ];

  // ─── 加減法 ───
  html += '<div style="font-size:14px;color:var(--teal);font-weight:bold;margin:24px 0 10px;letter-spacing:1px">── 加減法 ──</div>';

  var s2qs = [
    {
      qid:'math_sim_s4_q6', type:'choice',
      jp:'{ x + 2y = 9　② x - 2y = 1 } を消すには足す・引く、どちら？',
      answer:'足す（+2y と -2y が消える）',
      choices:['足す（+2y と -2y が消える）', '引く（x と x が消える）', '引く（2y と 2y が消える）', 'どちらでも変わらない'],
      exp:'📐 +2y と -2y は異符号 → <span style="color:var(--gold)">足す</span> → 2y+(-2y)=0 で消える<br>①+② → 2x=10 → x=5'
    },
    {
      qid:'math_sim_s4_q7', type:'input',
      jp:'{ x + 2y = 9　② x - 2y = 1 } 加減法で解け。x の値は？',
      formula:'①＋② で 2y を消す',
      answer:'5', xp:6,
      hint:'①+② → 2x=10 → x=5 → 2y=4 → y=2',
      exp:'①+② → 2x=10 → <span style="color:var(--gold)">x=5</span>。y=2。答え：x=5, y=2'
    },
    {
      qid:'math_sim_s4_q8', type:'input',
      jp:'{ 3x + 2y = 14　② x + 2y = 6 } 加減法で解け。x の値は？',
      formula:'①－② で 2y を消す',
      answer:'4', xp:6,
      hint:'①-② → 2x=8 → x=4',
      exp:'同符号（+2y）→ 引く → 2x=8 → <span style="color:var(--gold)">x=4</span>。2y=2 → y=1。答え：x=4, y=1'
    },
    {
      qid:'math_sim_s4_q9', type:'choice',
      jp:'{ 3x + 2y = 13　② 3x - 2y = 5 } ①－② を計算すると？',
      answer:'4y = 8',
      choices:['4y = 8', '6x = 18', '4y = 18', '2y = 8'],
      exp:'📐 (3x+2y)-(3x-2y) = 13-5 → <span style="color:var(--gold)">4y=8</span> → y=2<br>x=3。答え：x=3, y=2'
    },
    {
      qid:'math_sim_s4_q10', type:'input',
      jp:'{ 3x + 2y = 13　② 3x - 2y = 5 } 加減法で解け。x の値は？',
      formula:'①－② → 4y=8 → y=2 → x=?',
      answer:'3', xp:6,
      hint:'y=2 を ① に代入：3x+4=13 → x=3',
      exp:'y=2 → 3x+4=13 → 3x=9 → <span style="color:var(--gold)">x=3</span>。答え：x=3, y=2'
    },
    {
      qid:'math_sim_s4_q11', type:'input',
      jp:'{ 2x + 3y = 18　② 3x + 3y = 21 } 加減法で解け。x の値は？',
      formula:'②－① で 3y を消す',
      answer:'3', xp:6,
      hint:'②-① → x=3 → 3y=12 → y=4',
      exp:'②-① → x=<span style="color:var(--gold)">3</span>。3×3+3y=18 → 3y=9 → y=3... wait: 2×3+3y=18 → 6+3y=18 → 3y=12 → y=4。答え：x=3, y=4'
    },
    {
      qid:'math_sim_s4_q12', type:'choice',
      jp:'{ 2x + y = 10　② 3x + 2y = 16 } で y を消すために必要な操作は？',
      answer:'①×2 して 2y に揃えてから ①×2－② を計算する',
      choices:['①×2 して 2y に揃えてから ①×2－② を計算する', '②×2 して引く', '①＋② をそのまま計算する', '②÷2 してから引く'],
      exp:'📐 y の係数を LCM=2 に揃える → <span style="color:var(--gold)">①×2</span>：4x+2y=20<br>4x+2y=20 から ② を引く → x=4 → y=2'
    },
  ];

  // ─── 文章題 ───
  html += '<div style="font-size:14px;color:var(--green);font-weight:bold;margin:24px 0 10px;letter-spacing:1px">── 文章題 ──</div>';

  var s3qs = [
    {
      qid:'math_sim_s4_q13', type:'choice',
      jp:'鉛筆 x 本（80円）消しゴム y 個（120円）合計 10 個・合計 1040 円。鉛筆 x の本数は？',
      answer:'4',
      choices:['4', '5', '6', '3'],
      exp:'📐 x+y=10, 80x+120y=1040<br>y=10-x 代入 → 80x+1200-120x=1040 → -40x=-160 → <span style="color:var(--gold)">x=4</span>, y=6'
    },
    {
      qid:'math_sim_s4_q14', type:'input',
      jp:'上の問題（鉛筆 x・消しゴム y）で消しゴムの個数 y は？',
      formula:'x = 4 を x+y=10 に代入',
      answer:'6', xp:5,
      hint:'4 + y = 10 → y = 6',
      exp:'4+y=10 → <span style="color:var(--gold)">y=6</span>（消しゴム 6 個）<br>検算：80×4+120×6=320+720=1040 ✅'
    },
    {
      qid:'math_sim_s4_q15', type:'input',
      jp:'大人 x 人・子供 y 人が入場。合計 8 人、大人 900 円・子供 500 円で合計 5600 円。大人 x の人数は？',
      formula:'x+y=8, 900x+500y=5600 → 代入法で解く',
      answer:'4', xp:7,
      hint:'y=8-x → 900x+500(8-x)=5600 → 400x=1600 → x=4',
      exp:'y=8-x 代入 → 900x+4000-500x=5600 → 400x=1600 → <span style="color:var(--gold)">x=4</span>（大人 4 人）, y=4（子供 4 人）'
    },
    {
      qid:'math_sim_s4_q16', type:'choice',
      jp:'きょん（x m/分）とにっくん（y m/分）。反対方向に 5 分走ると 250 m 離れる、同方向に 5 分走ると 50 m 差。にっくん y は？',
      answer:'30',
      choices:['30', '20', '40', '25'],
      exp:'📐 5(x+y)=250 → x+y=50<br>5(y-x)=50 → y-x=10<br>加減法で ①+② → 2y=60 → <span style="color:var(--gold)">y=30</span>（にっくん）, x=20（きょん）'
    },
    {
      qid:'math_sim_s4_q17', type:'input',
      jp:'上の問題（きょん x, にっくん y）でき、きょんの速さ x は？',
      formula:'y = 30 を x+y=50 に代入',
      answer:'20', xp:5,
      hint:'x + 30 = 50 → x = 20',
      exp:'x+30=50 → <span style="color:var(--gold)">x=20</span>（きょん 20 m/分）<br>検算：20+30=50 ✅　30-20=10 ✅'
    },
    {
      qid:'math_sim_s4_q18', type:'input',
      jp:'3% 食塩水 x g と 9% 食塩水 y g を混ぜて 6% 200g。{ x+y=200, 3x+9y=1200 } → x は？',
      formula:'x = 200-y を 3x+9y=1200 に代入',
      answer:'100', xp:8,
      hint:'3(200-y)+9y=1200 → 600+6y=1200 → y=100 → x=100',
      exp:'3(200-y)+9y=1200 → 6y=600 → y=100 → x=<span style="color:var(--gold)">100</span>（3% 食塩水 100g）<br>検算：3×100+9×100=1200 ✅'
    },
    {
      qid:'math_sim_s4_q19', type:'input',
      jp:'{ 2x + y = 10　② x - y = 2 } 加減法で解け。x の値は？',
      formula:'①＋② で y を消す',
      answer:'4', xp:6,
      hint:'①+② → 3x=12 → x=4 → y=2',
      exp:'①+② → 3x=12 → <span style="color:var(--gold)">x=4</span>。y=2×1=2... x-y=2 → 4-y=2 → y=2。答え：x=4, y=2'
    },
  ];

  var allQs = s1qs.concat(s2qs, s3qs);
  allQs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q' + (i+1) + '</div>';
    if(q.type === 'choice'){
      html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
    } else {
      html += makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
    }
  });

  return html;
}

function showFinalResult(){
  var s4qids = Object.keys(qMeta).filter(function(id){ return id.indexOf('math_sim_s4_') === 0; });
  var total = s4qids.length || 20;
  var correct = s4qids.filter(function(id){
    var d = weakDB[id]; return d && d.correct > 0;
  }).length;
  var pct = Math.round(correct / total * 100);
  var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '😎' : pct >= 50 ? '💪' : '📚';
  var kyonMsg = pct >= 90
    ? 'きょん「全部解けた！！俺マジで天才！！M-1行ける！！」'
    : pct >= 70
    ? 'きょん「なかなかやったわ！！弱点はちゃんと特訓する！！」'
    : pct >= 50
    ? 'きょん「まだまだやな……でも諦めない！！もう一回！！」'
    : 'きょん「連立方程式……強敵すぎる……でも次は絶対倒す！！」';
  var nishiMsg = pct >= 90
    ? '西村「完璧だ。連立方程式は完全にマスターした」'
    : pct >= 70
    ? '西村「よくやった。間違えた問題を特訓すれば完璧になる」'
    : pct >= 50
    ? '西村「基礎はできてる。もう一度解き方を確認しよう」'
    : '西村「焦らなくていい。代入法から一歩ずつ積み上げよう」';

  var overlay = document.getElementById('resultOverlay');
  overlay.style.display = 'flex';
  overlay.innerHTML = '<div style="background:var(--bg2);border:1px solid var(--purple);border-radius:20px;padding:36px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 8px 40px rgba(163,113,247,0.25)">'
    + '<div style="font-size:64px;margin-bottom:12px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--purple);letter-spacing:3px;margin-bottom:6px">確認テスト 完了！</div>'
    + '<div style="font-size:48px;color:var(--gold);font-weight:bold;margin:12px 0">' + correct + '<span style="font-size:20px;color:var(--text2)"> / ' + total + '</span></div>'
    + '<div style="font-size:22px;color:var(--gold);margin-bottom:20px">' + pct + '%</div>'
    + '<div style="background:rgba(163,113,247,0.08);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:14px 16px;margin-bottom:20px;text-align:left">'
    + '<div style="font-size:14px;line-height:2.0;color:var(--text2)">' + kyonMsg + '<br>' + nishiMsg + '</div>'
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:10px">'
    + '<button id="res_tokku_btn" style="background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:14px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する</button>'
    + '<button id="res_retry_btn" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px;border-radius:12px;font-size:15px;font-family:inherit;cursor:pointer;">🔄 もう一度テストする</button>'
    + '<button id="res_s1_btn" style="background:rgba(163,113,247,0.1);color:var(--purple);border:1px solid var(--purple);padding:12px;border-radius:12px;font-size:15px;font-family:inherit;cursor:pointer;">← Section 1（代入法）へ戻る</button>'
    + '</div></div>';

  overlay.style.cssText = 'display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;align-items:center;justify-content:center;overflow-y:auto;padding:20px;box-sizing:border-box';

  document.getElementById('res_tokku_btn').addEventListener('click', function(){ overlay.style.display='none'; goSection(6); });
  document.getElementById('res_retry_btn').addEventListener('click', function(){
    overlay.style.display='none';
    var s4keys = Object.keys(answeredSet).filter(function(k){ return k.indexOf('math_sim_s4_')===0; });
    s4keys.forEach(function(k){ delete answeredSet[k]; });
    localStorage.setItem('math_sim_answered', JSON.stringify(answeredSet));
    sectionDone[4] = false;
    localStorage.setItem('math_sim_sections', JSON.stringify(sectionDone));
    goSection(4);
  });
  document.getElementById('res_s1_btn').addEventListener('click', function(){ overlay.style.display='none'; goSection(1); });
}

// ===== 弱点ノート =====
function renderWeakNote(){
  currentSection = 5; renderTabs();
  var allQids = Object.keys(weakDB).filter(function(id){ return id.indexOf('math_sim_') === 0; });
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');

  if(allQids.length === 0){
    mc.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text2)">'
      + '<div style="font-size:48px;margin-bottom:16px">📊</div>'
      + '<div style="font-size:18px;margin-bottom:8px">まだデータがありません</div>'
      + '<div style="font-size:14px">問題を解くと自動で記録されます</div>'
      + '</div>';
    return;
  }

  var sorted = allQids.slice().sort(function(a,b){ return getPct(a) - getPct(b); });
  var html = '<div style="margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap">'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--gold)">' + allQids.length + '</div><div style="font-size:11px;color:var(--text2)">記録済み問題</div></div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--red)">' + wqs.length + '</div><div style="font-size:11px;color:var(--text2)">要特訓（80%未満）</div></div>'
    + '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--green)">' + (allQids.length - wqs.length) + '</div><div style="font-size:11px;color:var(--text2)">習得済み</div></div>'
    + '</div>';

  sorted.forEach(function(qid){
    var d = weakDB[qid];
    var pct = getPct(qid);
    var barColor = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
    html += '<div style="background:var(--bg2);border:1px solid ' + barColor + ';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(163,113,247,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text);line-height:1.6">' + (d.jp || '') + '</div></div>'
      + '<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:var(--text2)">' + d.correct + '/' + d.total + '回正解</div></div>'
      + '</div>';
  });

  if(wqs.length > 0){
    html += '<button id="go_tokku_btn" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（' + wqs.length + '問）</button>';
  }
  mc.innerHTML = html;
  var gb = document.getElementById('go_tokku_btn');
  if(gb) gb.addEventListener('click', function(){ goSection(6); });
}

// ===== 特訓モード =====
var tokkuQueue = [], tokkuIndex = 0, tokkuSession = { correct:0, total:0 };
function renderTokkuMode(){
  currentSection = 6; renderTabs();
  var wqs = getWeakQuestions();
  var mc = document.getElementById('mainContent');

  if(wqs.length === 0){
    mc.innerHTML = '<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div class="tokku-complete-msg">きょん「俺、無敵になったわ！！」<br>西村「本当に成長したね」</div><button id="back_s1_btn" style="margin-top:24px;background:var(--purple);color:#fff;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button></div>';
    document.getElementById('back_s1_btn').addEventListener('click', function(){ goSection(1); });
    return;
  }

  tokkuQueue = wqs.slice(0, 15);
  tokkuIndex = 0;
  tokkuSession = { correct:0, total:0 };
  renderTokkuCard();
}

function renderTokkuCard(){
  var mc = document.getElementById('mainContent');
  if(tokkuIndex >= tokkuQueue.length){ showTokkuComplete(); return; }
  var qid = tokkuQueue[tokkuIndex];
  var d = weakDB[qid];
  if(!d){ tokkuIndex++; renderTokkuCard(); return; }

  var pct = getPct(qid);
  var color = pct < 30 ? 'var(--red)' : pct < 60 ? 'var(--gold)' : 'var(--green)';
  var shuffled = (d.choices && d.choices.length > 0) ? d.choices.slice().sort(function(){ return Math.random()-0.5; }) : [];

  mc.innerHTML = '<div class="tokku-progress">🔥 特訓 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　今回: ' + tokkuSession.correct + '/' + tokkuSession.total + '正解</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span class="pct" style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp">' + (d.jp || qid) + '</div>'
    + (shuffled.length > 0
        ? '<div class="tokku-choices">' + shuffled.map(function(c){ return '<button class="choice-btn" data-tqid="' + qid + '" data-tchoice="' + c + '">' + c + '</button>'; }).join('') + '</div>'
        : '<div class="input-wrap" style="justify-content:center"><input class="q-input" id="tokku_inp_' + qid + '" type="text" placeholder="答え" style="max-width:160px"><button id="tokku_sub_' + qid + '" style="background:var(--purple);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer">確認</button></div>'
      )
    + '<div class="tokku-result" id="tokku_result"></div>'
    + '<button id="tokku_next" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer">次の問題 →</button>'
    + '</div>';

  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(btn){
    btn.addEventListener('click', function(){ handleTokkuChoice(btn.dataset.tqid, btn.dataset.tchoice); });
  });
  var ti = document.getElementById('tokku_inp_' + qid);
  if(ti) ti.addEventListener('keydown', function(e){ if(e.key==='Enter') handleTokkuInput(qid); });
  var ts = document.getElementById('tokku_sub_' + qid);
  if(ts) ts.addEventListener('click', function(){ handleTokkuInput(qid); });
  document.getElementById('tokku_next').addEventListener('click', function(){ tokkuIndex++; renderTokkuCard(); });
}

function handleTokkuChoice(qid, choice){
  var d = weakDB[qid]; if(!d) return;
  var correct = choice === d.answer;
  applyTokkuResult(qid, correct);
}
function handleTokkuInput(qid){
  var inp = document.getElementById('tokku_inp_' + qid); if(!inp) return;
  var val = inp.value.trim();
  var d = weakDB[qid]; if(!d) return;
  applyTokkuResult(qid, numMatch(val, d.answer));
}
function applyTokkuResult(qid, correct){
  var d = weakDB[qid];
  tokkuSession.total++; weakDB[qid].total++;
  if(correct){ weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('math_weakdb', JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();

  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b){ b.disabled = true; });
  if(correct){
    var ok = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + d.answer + '"]');
    if(ok) ok.classList.add('selected-correct');
  } else {
    var chosen = document.querySelector('.choice-btn[data-tqid="' + qid + '"]');
    if(chosen) chosen.classList.add('selected-wrong');
    var ok2 = document.querySelector('.choice-btn[data-tqid="' + qid + '"][data-tchoice="' + d.answer + '"]');
    if(ok2) ok2.classList.add('show-correct');
  }

  var newPct = getPct(qid);
  var res = document.getElementById('tokku_result');
  if(res){
    if(correct){
      xp += 1; localStorage.setItem('math_xp', xp); updateXP();
      res.className = 'tokku-result tokku-correct';
      res.innerHTML = '✅ 正解！' + (newPct >= 80 ? ' 🎉 この問題は卒業！' : ' 正答率 → ' + newPct + '%');
      showToast(getComment('correct'));
    } else {
      deductXP(3);
      res.className = 'tokku-result tokku-wrong';
      res.innerHTML = '❌ 間違い！ 正答率 → ' + newPct + '%<div class="tokku-answer">' + d.answer + '</div>';
      showToast('きょん「また間違えた！！でも諦めない！！」');
    }
    res.style.display = 'block';
  }
  document.getElementById('tokku_next').style.display = 'block';
}

function showTokkuComplete(){
  var mc = document.getElementById('mainContent');
  var pctAll = tokkuSession.total > 0 ? Math.round(tokkuSession.correct / tokkuSession.total * 100) : 0;
  var emoji = pctAll >= 80 ? '🏆' : pctAll >= 60 ? '😎' : '💪';
  mc.innerHTML = '<div class="tokku-complete">'
    + '<div class="tokku-complete-emoji">' + emoji + '</div>'
    + '<div class="tokku-complete-title">特訓終了！</div>'
    + '<div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">' + pctAll + '%</div>'
    + '<div class="tokku-complete-msg">' + (pctAll >= 80 ? 'きょん「全部わかった！！」<br>西村「よくやった」' : 'きょん「難しかった…でも諦めない！！」<br>西村「繰り返すことが力になる」') + '</div>'
    + '<div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<button id="retry_btn" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回！</button>'
    + '<button id="back_s1_btn2" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">Section 1 へ戻る</button>'
    + '</div></div>';
  document.getElementById('retry_btn').addEventListener('click', function(){ renderTokkuMode(); });
  document.getElementById('back_s1_btn2').addEventListener('click', function(){ goSection(1); });
  renderWeakBar();
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
goSection(0);
