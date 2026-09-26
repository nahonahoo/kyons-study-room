// ===== XP LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',      title:'見習い研修生',   status:'きょん「歴史？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',      title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー',  title:'主任',           status:'きょん「にっくん、俺歴史できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー',  title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',    title:'課長',           status:'きょん「にっくんより詳しくなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',        title:'部長',           status:'きょん「歴史で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',      title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',      title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal) {
  for (var i = LEVELS.length-1; i >= 0; i--) { if (xpVal >= LEVELS[i].min) return LEVELS[i]; }
  return LEVELS[0];
}
var xp          = parseInt(localStorage.getItem('soc_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('soc_hist_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('soc_hist_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('soc_weakdb')        || '{}');
var attemptCounts = {};

function updateXP() {
  var lv = getLevel(xp);
  var pct = lv.lv < LEVELS.length ? Math.round((xp-lv.min)/(lv.max-lv.min)*100) : 100;
  document.getElementById('xpBadge').textContent  = lv.badge;
  document.getElementById('xpLevel').textContent  = 'Lv.'+lv.lv+' '+lv.badge.split(' ')[0];
  document.getElementById('xpTitle').textContent  = lv.title;
  document.getElementById('xpStatus').textContent = lv.status;
  document.getElementById('xpNext').textContent   = lv.lv < LEVELS.length ? xp+' XP ／ 次まで '+(lv.max-xp)+' XP' : '🏆 最高ランク達成！（'+xp+' XP）';
  document.getElementById('xpFill').style.width   = Math.min(100,pct)+'%';
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
}
function addXP(pts, qid) {
  if (answeredSet[qid]) return false;
  var oldLv = getLevel(xp).lv;
  xp += pts; answeredSet[qid] = true;
  localStorage.setItem('soc_xp', xp);
  localStorage.setItem('soc_hist_answered', JSON.stringify(answeredSet));
  updateXP();
  return getLevel(xp).lv > oldLv;
}
function deductXP(pts) {
  var oldLv = getLevel(xp).lv;
  xp = Math.max(0, xp - pts);
  localStorage.setItem('soc_xp', xp);
  updateXP();
  return getLevel(xp).lv < oldLv;
}

// ===== WEAK DB =====
function getPct(qid) { var d=weakDB[qid]; if(!d||d.total===0) return 0; return Math.round(d.correct/d.total*100); }
function getWeakQuestions() {
  return Object.keys(weakDB).filter(function(id){ return id.indexOf('soc_hist_') === 0 && getPct(id) < 80; });
}
function renderWeakBar() {
  var wqs = getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,8);
  var el = document.getElementById('weakItems'); if (!el) return;
  if (wqs.length===0) { el.innerHTML='<span class="weak-bar-empty">弱点なし — よくできています！</span>'; return; }
  el.innerHTML = wqs.map(function(qid) {
    var d=weakDB[qid];
    return '<div class="weak-item"><span class="weak-item-word">'+(d.jp||qid)+'</span><span class="weak-item-pct">'+getPct(qid)+'%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect) {
  if (!weakDB[qid]) weakDB[qid]={ jp:(qMeta[qid]&&qMeta[qid].jp)||'', answer:(qMeta[qid]&&qMeta[qid].answer)||'', choices:(qMeta[qid]&&qMeta[qid].choices)||[], correct:0, total:0 };
  weakDB[qid].total++; if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('soc_weakdb', JSON.stringify(weakDB));
  var _today=new Date().toISOString().slice(0,10);
  var _daily=JSON.parse(localStorage.getItem('soc_daily')||'{}');
  _daily[_today]=(_daily[_today]||0)+1;
  localStorage.setItem('soc_daily',           JSON.stringify(_daily));
  localStorage.setItem('soc_hist_lastStudy',  _today);
  renderWeakBar(); renderTabs();
}

// ===== SPEECH =====
var speechEnabled=(typeof window!=='undefined'&&'speechSynthesis' in window);
function speak(text){ if(!speechEnabled) return; try{ window.speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(text); u.lang='ja-JP'; u.rate=1.1; window.speechSynthesis.speak(u); }catch(e){} }

// ===== TOAST =====
function showToast(msg,type){
  var t=document.getElementById('toast'); t.textContent=msg;
  if(type==='levelup') t.className='toast levelup';
  else if(type==='demote') t.className='toast demote';
  else t.className='toast';
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, type==='levelup'?4000:type==='demote'?3500:2500);
}

// ===== COMMENTS =====
var COMMENTS = {
  kyon_correct: ['きょん「合ってる！歴史できるじゃん！！」','きょん「やった！天才かも！」','きょん「にっくん見て！解けた！！」','きょん「天才！！歴史余裕！！」','きょん「俺って実は歴史得意なのかも！！」'],
  nishi_correct: ['西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「ちゃんとわかってる」','西村「正確に答えられてる」','西村「その理解で合ってる。続けよう」'],
};
function getComment(type){ var arr=COMMENTS[type]; return arr[Math.floor(Math.random()*arr.length)]; }

// ===== SHUFFLE =====
function shuffleArray(arr){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }

// ===== CHAT HELPER =====
function chat(type, name, text) {
  var cls = type==='kyon' ? 'av-kyon' : 'av-nishi';
  var av  = type==='kyon' ? '😄' : '慶';
  return '<div class="chat-line">'
    +'<div class="avatar '+cls+'">'+av+'</div>'
    +'<div><div class="chat-name">'+name+'</div>'
    +'<div class="chat-bubble">'+text+'</div></div></div>';
}

// ===== SVG: 全時代タイムライン =====
function makeSvgMainTimeline() {
  var eras = [
    {name:'旧石器', year:'〜1万年前', x:2,   w:58,  c:'#9C7030', bg:'rgba(156,112,48,0.22)'},
    {name:'縄文',   year:'1万年前〜', x:60,  w:68,  c:'#A87830', bg:'rgba(168,120,48,0.22)'},
    {name:'弥生',   year:'BC100〜',  x:128, w:58,  c:'#C07840', bg:'rgba(192,120,64,0.22)'},
    {name:'古墳',   year:'300〜',    x:186, w:50,  c:'#B05840', bg:'rgba(176,88,64,0.22)'},
    {name:'飛鳥',   year:'593〜',    x:236, w:48,  c:'#A84848', bg:'rgba(168,72,72,0.22)'},
    {name:'奈良',   year:'710〜',    x:284, w:52,  c:'#9050A0', bg:'rgba(144,80,160,0.22)'},
    {name:'平安',   year:'794〜',    x:336, w:74,  c:'#5068B8', bg:'rgba(80,104,184,0.22)'},
    {name:'鎌倉',   year:'1185〜',   x:410, w:58,  c:'#3880A8', bg:'rgba(56,128,168,0.22)'},
    {name:'室町',   year:'1336〜',   x:468, w:70,  c:'#2888A0', bg:'rgba(40,136,160,0.22)'},
    {name:'江戸',   year:'1603〜',   x:538, w:78,  c:'#208870', bg:'rgba(32,136,112,0.22)'},
    {name:'明治〜', year:'1868〜',   x:616, w:170, c:'#B09020', bg:'rgba(176,144,32,0.22)'},
  ];
  var o = '<svg viewBox="0 0 790 88" style="width:100%;display:block;overflow:visible">';
  o += '<line x1="2" y1="53" x2="786" y2="53" stroke="#333" stroke-width="1.5"/>';
  eras.forEach(function(e){
    var cx = e.x + e.w/2;
    var fs = e.name.length >= 3 ? '9' : '11';
    o += '<rect x="'+e.x+'" y="16" width="'+e.w+'" height="44" rx="5" fill="'+e.bg+'" stroke="'+e.c+'" stroke-width="1.5"/>';
    o += '<text x="'+cx+'" y="36" text-anchor="middle" fill="'+e.c+'" font-size="'+fs+'" font-family="Noto Serif JP,serif" font-weight="bold">'+e.name+'</text>';
    o += '<text x="'+cx+'" y="50" text-anchor="middle" fill="'+e.c+'" font-size="7.5" font-family="Noto Serif JP,serif">'+e.year+'</text>';
  });
  o += '<polygon points="790,53 781,48 781,58" fill="#555"/>';
  o += '<text x="790" y="68" text-anchor="end" fill="#555" font-size="9" font-family="Noto Serif JP,serif">現在</text>';
  o += '</svg>';
  return o;
}

// ===== SVG: 古代〜奈良 詳細タイムライン =====
function makeSvgSection1Timeline() {
  var events = [
    {label:'旧石器',     sub:'打製石器',       year:'〜1万年前', x:28,  above:true,  c:'#9C7030'},
    {label:'縄文',       sub:'縄文土器・貝塚', year:'1万年前〜', x:110, above:false, c:'#A87830'},
    {label:'弥生',       sub:'稲作・邪馬台国', year:'BC100〜',  x:210, above:true,  c:'#C07840'},
    {label:'古墳',       sub:'前方後円墳',     year:'300年〜',  x:305, above:false, c:'#B05840'},
    {label:'聖徳太子',   sub:'十七条の憲法',   year:'604年',    x:395, above:true,  c:'#A84848'},
    {label:'大化の改新', sub:'中大兄皇子',     year:'645年',    x:480, above:false, c:'#9050A0'},
    {label:'奈良時代',   sub:'平城京・東大寺', year:'710年〜',  x:578, above:true,  c:'#7050A0'},
    {label:'平安時代へ', sub:'桓武天皇',       year:'794年',    x:690, above:false, c:'#5068B8'},
  ];
  var o = '<svg viewBox="0 0 760 138" style="width:100%;display:block;overflow:visible;margin:10px 0 16px">';
  o += '<line x1="10" y1="69" x2="750" y2="69" stroke="#333" stroke-width="2"/>';
  events.forEach(function(e){
    o += '<circle cx="'+e.x+'" cy="69" r="5" fill="'+e.c+'"/>';
    if(e.above){
      o += '<line x1="'+e.x+'" y1="64" x2="'+e.x+'" y2="28" stroke="'+e.c+'" stroke-width="1" stroke-dasharray="3,2"/>';
      o += '<text x="'+e.x+'" y="23" text-anchor="middle" fill="'+e.c+'" font-size="10" font-family="Noto Serif JP,serif" font-weight="bold">'+e.label+'</text>';
      o += '<text x="'+e.x+'" y="35" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif">'+e.sub+'</text>';
      o += '<text x="'+e.x+'" y="46" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif" opacity="0.85">'+e.year+'</text>';
    } else {
      o += '<line x1="'+e.x+'" y1="74" x2="'+e.x+'" y2="106" stroke="'+e.c+'" stroke-width="1" stroke-dasharray="3,2"/>';
      o += '<text x="'+e.x+'" y="119" text-anchor="middle" fill="'+e.c+'" font-size="10" font-family="Noto Serif JP,serif" font-weight="bold">'+e.label+'</text>';
      o += '<text x="'+e.x+'" y="130" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif">'+e.sub+'</text>';
    }
  });
  o += '<polygon points="754,69 745,64 745,74" fill="#555"/>';
  o += '</svg>';
  return o;
}

// ===== SVG: 平安〜鎌倉 詳細タイムライン =====
function makeSvgSection2Timeline() {
  var events = [
    {label:'平安京',   sub:'794年',   year:'平安時代へ',  x:22,  above:true,  c:'#5068B8'},
    {label:'藤原摂関', sub:'858〜',   year:'道長が最盛',  x:110, above:false, c:'#7050A0'},
    {label:'院政開始', sub:'1086年',  year:'白河上皇',   x:210, above:true,  c:'#9050A0'},
    {label:'平清盛',   sub:'1167年',  year:'太政大臣',   x:310, above:false, c:'#A84848'},
    {label:'壇ノ浦',   sub:'1185年',  year:'鎌倉幕府',   x:410, above:true,  c:'#C04848'},
    {label:'承久の乱', sub:'1221年',  year:'六波羅探題',  x:500, above:false, c:'#3880A8'},
    {label:'元寇',     sub:'1274年',  year:'文永の役',   x:595, above:true,  c:'#2888A0'},
    {label:'幕府滅亡', sub:'1333年',  year:'建武の新政',  x:700, above:false, c:'#208870'},
  ];
  var o = '<svg viewBox="0 0 760 138" style="width:100%;display:block;overflow:visible;margin:10px 0 16px">';
  o += '<line x1="10" y1="69" x2="750" y2="69" stroke="#333" stroke-width="2"/>';
  events.forEach(function(e){
    o += '<circle cx="'+e.x+'" cy="69" r="5" fill="'+e.c+'"/>';
    if(e.above){
      o += '<line x1="'+e.x+'" y1="64" x2="'+e.x+'" y2="28" stroke="'+e.c+'" stroke-width="1" stroke-dasharray="3,2"/>';
      o += '<text x="'+e.x+'" y="23" text-anchor="middle" fill="'+e.c+'" font-size="10" font-family="Noto Serif JP,serif" font-weight="bold">'+e.label+'</text>';
      o += '<text x="'+e.x+'" y="35" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif">'+e.sub+'</text>';
      o += '<text x="'+e.x+'" y="46" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif" opacity="0.85">'+e.year+'</text>';
    } else {
      o += '<line x1="'+e.x+'" y1="74" x2="'+e.x+'" y2="106" stroke="'+e.c+'" stroke-width="1" stroke-dasharray="3,2"/>';
      o += '<text x="'+e.x+'" y="119" text-anchor="middle" fill="'+e.c+'" font-size="10" font-family="Noto Serif JP,serif" font-weight="bold">'+e.label+'</text>';
      o += '<text x="'+e.x+'" y="130" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif">'+e.sub+'</text>';
    }
  });
  o += '<polygon points="754,69 745,64 745,74" fill="#555"/>';
  o += '</svg>';
  return o;
}

// ===== QUESTION ENGINE =====
var qMeta = {};

function makeChoices(qid, jp, answer, choices, exp) {
  choices = shuffleArray(choices);
  qMeta[qid]={ type:'choice', answer:answer, xp:4, jp:jp, choices:choices };
  var done=answeredSet[qid];
  return '<div class="q-card" data-card="'+qid+'">'
    +'<div class="q-text">'+jp+'</div>'
    +'<div class="choices">'
    +choices.map(function(c){
        if(done) return '<button class="choice-btn '+(c===answer?'show-correct':'')+'" disabled>'+c+'</button>';
        return '<button class="choice-btn" data-qid="'+qid+'" data-choice="'+c+'">'+c+'</button>';
      }).join('')
    +'</div>'
    +'<div class="q-feedback correct-fb" id="fb_'+qid+'" style="'+(done?'display:block':'display:none')+'">✓ 正解！</div>'
    +'<div class="q-feedback wrong-fb" id="fbw_'+qid+'" style="display:none">✗ もう一度！</div>'
    +'<div class="exp-card" id="exp_card_'+qid+'" style="'+(done?'display:block':'display:none')+'">'
    +'<div class="exp-card-title">📌 解説</div>'
    +'<div style="color:var(--text);font-size:13px;line-height:2.0">'+exp+'</div>'
    +'</div>'
    +'<button class="show-answer-btn" id="sab_'+qid+'" data-qid="'+qid+'">💡 答えを見る（XPなし）</button>'
    +'<div class="answer-revealed" id="ar_'+qid+'"><div class="ans-label">✅ 正解</div><div id="ar_ans_'+qid+'" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    +'<div class="artist-comment" id="ac_'+qid+'" style="'+(done?'display:block':'display:none')+'">'+(done?getComment('nishi_correct'):'')+'</div>'
    +'</div>';
}

function handleChoice(qid, choice){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid]) return;
  if(choice===meta.answer) markCorrect(qid,meta,choice); else markWrong(qid,meta,choice);
}
function markCorrect(qid,meta,choice){
  speak('正解！'); recordResult(qid,true);
  var lvUp=addXP(meta.xp||4,qid);
  var card=document.querySelector('[data-card="'+qid+'"]'); if(card) card.classList.add('correct-card');
  var fb=document.getElementById('fb_'+qid); if(fb) fb.style.display='block';
  var fbw=document.getElementById('fbw_'+qid); if(fbw) fbw.style.display='none';
  var ac=document.getElementById('ac_'+qid); if(ac){ ac.textContent=getComment('nishi_correct'); ac.style.display='block'; }
  document.querySelectorAll('.choice-btn[data-qid="'+qid+'"]').forEach(function(b){ b.disabled=true; if(b.dataset.choice===meta.answer) b.classList.add('selected-correct'); });
  var expEl=document.getElementById('exp_card_'+qid); if(expEl) expEl.style.display='block';
  if(lvUp){ setTimeout(function(){ var lv=getLevel(xp); speak('昇格！'); showToast('🎉 昇格！ '+lv.badge+'　きょん「'+lv.badge+'になったわ！！」','levelup'); },400); }
  else { setTimeout(function(){ showToast(getComment('kyon_correct')); },300); }
  checkSectionComplete();
}
function markWrong(qid,meta,choice){
  speak('もう一度！'); recordResult(qid,false);
  attemptCounts[qid]=(attemptCounts[qid]||0)+1;
  var card=document.querySelector('[data-card="'+qid+'"]');
  if(card){ card.classList.add('wrong-card'); setTimeout(function(){ card.classList.remove('wrong-card'); },600); }
  var fbw=document.getElementById('fbw_'+qid); if(fbw) fbw.style.display='block';
  var btn=document.querySelector('.choice-btn[data-qid="'+qid+'"][data-choice="'+choice+'"]');
  if(btn){ btn.classList.add('selected-wrong'); setTimeout(function(){ btn.classList.remove('selected-wrong'); },600); }
  if(attemptCounts[qid]>=2){ var sab=document.getElementById('sab_'+qid); if(sab) sab.style.display='inline-block'; }
  var demoted=deductXP(5);
  if(demoted){ setTimeout(function(){ showToast('💦 降格…！　きょん「せっかく昇格したのに…！！」','demote'); },200); }
  else { var msgs=['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！まだまだ大丈夫！！」','きょん「もう一回考えよう！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1,attemptCounts[qid]-1)]); },100); }
  if(!tokkuBannerShown){ tokkuBannerShown=true; setTimeout(function(){ showTokkuSuggestion(qid); },500); }
}
function showAnswer(qid){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid]) return;
  answeredSet[qid]=true; localStorage.setItem('soc_hist_answered',JSON.stringify(answeredSet));
  var arAns=document.getElementById('ar_ans_'+qid); if(arAns) arAns.textContent=meta.answer;
  var ar=document.getElementById('ar_'+qid); if(ar) ar.style.display='block';
  var sab=document.getElementById('sab_'+qid); if(sab) sab.style.display='none';
  document.querySelectorAll('.choice-btn[data-qid="'+qid+'"]').forEach(function(b){ b.disabled=true; if(b.dataset.choice===meta.answer) b.classList.add('show-correct'); });
  var fbw=document.getElementById('fbw_'+qid); if(fbw) fbw.style.display='none';
  var ac=document.getElementById('ac_'+qid); if(ac){ ac.textContent='きょん「なるほど！次は自分で答える！」'; ac.style.display='block'; }
  showToast('西村「答えを見るのも学習のうち。しっかり解説を読もう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix='soc_hist_s'+currentSection+'_';
  var sectionQ=Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix)===0; });
  if(sectionQ.length===0) return;
  var done=sectionQ.every(function(id){ return answeredSet[id]; });
  if(done){
    sectionDone[currentSection]=true;
    localStorage.setItem('soc_hist_sections',JSON.stringify(sectionDone));
    renderTabs();
    var nb=document.getElementById('nextBtn');
    if(nb){
      nb.style.display='block';
      if(!document.getElementById('sectionCompleteBanner')){
        var banner=document.createElement('div'); banner.id='sectionCompleteBanner';
        var nextSec=currentSection<5?'Section '+(currentSection+1)+' へ進もう！':'確認テストで腕試し！';
        banner.innerHTML='<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(63,185,80,0.12),rgba(245,158,11,0.08));border:1px solid var(--green);border-radius:14px">'
          +'<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          +'<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:var(--green);letter-spacing:2px;margin-bottom:6px">セクション '+currentSection+' クリア！</div>'
          +'<div style="font-size:14px;color:var(--text2)">きょん「全問解いた！！にっくん、俺やれるじゃん！！」</div>'
          +'<div style="font-size:13px;color:var(--text2);margin-top:4px">西村「よくやった。'+nextSec+'」</div>'
          +'</div>';
        nb.parentNode.insertBefore(banner,nb);
        setTimeout(function(){ banner.scrollIntoView({behavior:'smooth',block:'center'}); },200);
      }
    }
  }
}

// ===== SECTIONS =====
var currentSection=0;
var SECTIONS=[
  { id:0, label:'🌏 スタート',  title:'歴史の学び方',           sub:'きょんと西村が「歴史のコツ」を伝授！タイムラインで全体像を掴もう' },
  { id:1, label:'古代〜奈良',   title:'古代〜飛鳥・奈良時代',   sub:'旧石器・縄文・弥生・古墳・飛鳥・奈良——15問' },
  { id:2, label:'平安〜鎌倉',   title:'平安〜鎌倉時代',         sub:'藤原摂関・院政・平氏政権・鎌倉幕府・元寇——15問' },
  { id:3, label:'室町〜江戸',   title:'室町〜江戸時代',         sub:'応仁の乱・戦国・安土桃山・江戸幕府・幕末——15問' },
  { id:4, label:'明治〜現代',    title:'明治〜現代',             sub:'明治維新・戦争・日本国憲法——15問' },
  { id:5, label:'確認テスト',   title:'確認テスト',             sub:'全範囲まとめ！選択15問' },
  { id:6, label:'📊弱点',       title:'弱点ノート',             sub:'間違えた問題の正答率を確認しよう' },
  { id:7, label:'🔥特訓',       title:'弱点特訓モード',         sub:'間違えた問題だけを集中練習！' },
];

function renderTabs(){
  var html='';
  SECTIONS.forEach(function(s){
    var cls='section-tab';
    if(s.id>=6) cls+=' tokku';
    if(s.id===currentSection) cls+=' active';
    if(sectionDone[s.id]&&s.id<6) cls+=' done';
    var label=s.label+(sectionDone[s.id]&&s.id<6?' ✓':'');
    if(s.id===7){ var wk=getWeakQuestions(); label='🔥特訓'+(wk.length>0?'('+wk.length+')':''); }
    html+='<button class="'+cls+'" data-sid="'+s.id+'">'+label+'</button>';
  });
  document.getElementById('sectionTabs').innerHTML=html;
  document.querySelectorAll('.section-tab[data-sid]').forEach(function(btn){
    btn.addEventListener('click',function(){ goSection(parseInt(btn.dataset.sid)); });
  });
}
function goSection(id){ currentSection=id; renderTabs(); renderSection(id); window.scrollTo(0,0); }
function renderSection(id){
  if(id===6){ renderWeakNote(); return; }
  if(id===7){ renderTokkuMode(); return; }
  var s=SECTIONS[id];
  var html='<div class="progress-dots">';
  for(var i=0;i<=6;i++) html+='<div class="dot'+(i<id?' done':i===id?' current':'')+'"></div>';
  html+='</div>';
  html+='<div class="section-header">'
    +'<div class="section-badge">社会 歴史 · SECTION '+id+'</div>'
    +'<div class="section-title">'+s.title+'</div>'
    +'<div class="section-sub">'+s.sub+'</div>'
    +'</div>';
  if(id===0) html+=renderSection0();
  else if(id===1) html+=renderSection1();
  else if(id===2) html+=renderSection2();
  else if(id===3) html+=renderSection3();
  else if(id===4) html+=renderSection4();
  else if(id===5) html+=renderSection5();
  if(id>=1&&id<=5){
    var nextLabel=id<5?'次のセクションへ →':'🏆 結果を見る！';
    var nextAction=id<5?'goSection('+(id+1)+')':'showFinalResult()';
    html+='<button class="next-section-btn" id="nextBtn" onclick="'+nextAction+'">'+nextLabel+'</button>';
  }
  document.getElementById('mainContent').innerHTML=html;
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn){
    btn.addEventListener('click',function(){ handleChoice(btn.dataset.qid,btn.dataset.choice); });
  });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn){
    btn.addEventListener('click',function(){ showAnswer(btn.dataset.qid); });
  });
  if(sectionDone[id]){ var nb=document.getElementById('nextBtn'); if(nb) nb.style.display='block'; }
  checkSectionComplete();
}

// ===== SECTION 0: スタート =====
function renderSection0(){
  var html='';

  // 全時代タイムラインSVG
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">⏰ 日本の歴史タイムライン — 全体像をつかもう</div>';
  html+='<div style="font-size:12px;color:var(--text2);margin-bottom:10px;line-height:2.0">';
  html+='まずこのタイムラインを指でなぞりながら声に出して読んでみよう！左が古く、右が新しい。';
  html+='</div>';
  html+=makeSvgMainTimeline();
  html+='<div style="font-size:11px;color:var(--text2);margin-top:8px;text-align:right">← 古い　　　　　　　　　　　　　　　　　　　　新しい →</div>';
  html+='</div>';

  // きょん＆西村の会話
  html+='<div class="intro-box">';
  html+='<div class="intro-box-title">🎤 きょん＆西村の会話</div>';
  html+=chat('kyon','きょん','歴史って名前と年号が多すぎてわけわからん！！どっから覚えたらいいの！？');
  html+=chat('nishi','西村真二（慶應義塾卒・元アナ）','まず「流れ」を掴むことだ。年号より先に「なぜその出来事が起きたか」のストーリーを理解しろ。そうすると人名も年号も芋づる式に出てくる。');
  html+=chat('kyon','きょん','ストーリー！？漫才みたいに起承転結があるってこと！？それなら俺得意かも！！');
  html+=chat('nishi','西村','まさにその通り。たとえば「聖徳太子が仕組みを作った（起）→大化の改新で一新（承）→奈良で文化が花開く（転）→平安でゆっくり変化（結）」という感じだ。');
  html+=chat('kyon','きょん','おー！！漫才の台本みたいに考えたらいい感じ！！聖徳太子ってツッコミ役？ボケ役？');
  html+=chat('nishi','西村','……そのたとえは斜め上すぎるが、まあ聖徳太子は「なぜ仕組みが必要だったか」から入ると記憶に残りやすい。上のタイムラインを頭に入れてから問題に進もう。');
  html+=chat('kyon','きょん','わかった！！タイムライン指でなぞった！！なんかカラフルでかっこいい！！よし俺、歴史の芸人になる！！');
  html+=chat('nishi','西村','その意気だ。Section 1 から始めよう。');
  html+='</div>';

  // 歴史の覚え方コツ
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">📐 歴史の覚え方 — 4つのコツ</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">① 語呂合わせで年号を覚える</div>';
  html+='<div class="ex">604年 → <b>「む（6）し（4）いほど立派な十七条」</b>（聖徳太子）</div>';
  html+='<div class="ex">645年 → <b>「む（6）し（4）ごろ（5）す蘇我氏」</b>（大化の改新）</div>';
  html+='<div class="ex">710年 → <b>「なんと（710）立派な平城京」</b>（奈良時代）</div>';
  html+='<div class="ex">794年 → <b>「なくよ（794）うぐいす平安京」</b>（平安時代）</div>';
  html+='<div class="note">💡 声に出して何度も読むと音声記憶で定着する！</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">② 人物のキャラクターで覚える</div>';
  html+='<div class="ex">聖徳太子 ＝ 「みんな仲よく！」チームワーク推しのリーダー</div>';
  html+='<div class="ex">聖武天皇 ＝ 「でっかい大仏を建てよう！」スケールが異次元</div>';
  html+='<div class="ex">藤原道長 ＝ 「この世は全部俺のもの♪」自信満々の権力者</div>';
  html+='<div class="note">💡 キャラが見えると「その人がやりそうなこと」でセットで覚えられる</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">③「なぜ？」でつないで流れを覚える</div>';
  html+='<div class="ex">稲作が始まる → 食料が安定 → 差が生まれる → 権力者が登場 → 国家ができる</div>';
  html+='<div class="note">💡「稲作が来たから弥生時代」ではなく「稲作が来たから格差が生まれて古墳が作られた」まで繋げよう</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">④ タイムラインを毎回確認する習慣</div>';
  html+='<div class="ex">問題を解く前に上の全体タイムラインを見て、「今どの時代の話か」を確認してから解こう</div>';
  html+='<div class="note">💡 位置感覚があると前後の出来事の推測ができるようになる</div>';
  html+='</div>';
  html+='</div>';

  html+='<button class="start-btn" onclick="goSection(1)">🌏 古代〜飛鳥・奈良 から始める →</button>';
  return html;
}

// ===== SECTION 1: 古代〜飛鳥・奈良 =====
function renderSection1(){
  var html='';

  // 詳細タイムラインSVG
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">⏰ 古代〜奈良タイムライン</div>';
  html+=makeSvgSection1Timeline();
  html+='<div style="font-size:11px;color:var(--text2);text-align:right">← 旧石器　　　　　　　　　　　　　　　　奈良・平安 →</div>';
  html+='</div>';

  // きょん＆西村
  html+='<div class="intro-box">';
  html+='<div class="intro-box-title">🎤 きょん＆西村の会話</div>';
  html+=chat('kyon','きょん','旧石器時代ってなんかかっこいいな！「旧石器キング」とかいたら強そう！');
  html+=chat('nishi','西村','（笑）確かに。重要なのは「打製石器」だ。石を打ち欠いて作った道具で、縄文時代の「磨製石器」と区別してくれ。');
  html+=chat('kyon','きょん','縄文と弥生ってどう違うの？土器の名前だよね？');
  html+=chat('nishi','西村','最大の違いは「稲作」だ。縄文時代は狩り・採集中心、弥生時代から稲作が始まる。稲作が普及すると食料が安定し、格差が生まれて権力者が登場した。');
  html+=chat('kyon','きょん','つまりコメが歴史を変えた！！俺もコメ食べてるから歴史に参加できてる！！');
  html+=chat('nishi','西村','……まあそういうことだ。では年号も確認しておこう。語呂合わせで覚えるのが効果的だ。');
  html+='</div>';

  // 語呂合わせカード
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">🎵 語呂合わせ — この時代の年号</div>';
  var goros=[
    { year:'604年', goro:'むし（604）いほど立派な十七条', event:'聖徳太子「十七条の憲法」制定' },
    { year:'645年', goro:'むし（645）殺す！蘇我氏', event:'大化の改新（中大兄皇子・藤原鎌足）' },
    { year:'710年', goro:'なんと（710）立派な平城京', event:'平城京遷都・奈良時代スタート' },
    { year:'743年', goro:'なしで（743）作った大仏様', event:'聖武天皇が大仏造立を命じる' },
    { year:'794年', goro:'なくよ（794）うぐいす平安京', event:'平安京遷都・平安時代スタート' },
  ];
  html+='<div style="display:grid;gap:8px">';
  goros.forEach(function(g){
    html+='<div style="background:rgba(245,197,24,0.07);border-left:3px solid var(--amber);padding:10px 14px;border-radius:0 8px 8px 0">';
    html+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
    html+='<span style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--amber);flex-shrink:0;letter-spacing:1px">'+g.year+'</span>';
    html+='<span style="font-size:14px;color:var(--gold);font-weight:bold">「'+g.goro+'」</span>';
    html+='</div>';
    html+='<div style="font-size:12px;color:var(--text2);margin-top:4px">→ '+g.event+'</div>';
    html+='</div>';
  });
  html+='</div>';
  html+='</div>';

  // 時代まとめ
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">📖 時代まとめ：旧石器〜奈良</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">原始時代（旧石器・縄文・弥生・古墳）</div>';
  html+='<div class="ex">旧石器：打製石器・狩猟採集（〜約1万年前）</div>';
  html+='<div class="ex">縄文：縄文土器・弓矢・たて穴住居・貝塚（約1万年前〜BC100）</div>';
  html+='<div class="ex">弥生：稲作・弥生土器・金属器・邪馬台国（卑弥呼）（BC100〜300年）</div>';
  html+='<div class="ex">古墳：大和政権・前方後円墳・埴輪（3〜7世紀）</div>';
  html+='<div class="note">💡 縄文→弥生の最大の変化は「稲作の始まり」！</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">飛鳥・奈良時代</div>';
  html+='<div class="ex">飛鳥：聖徳太子（十七条の憲法604年・冠位十二階・遣隋使）→大化の改新645年</div>';
  html+='<div class="ex">奈良：平城京710年・聖武天皇・東大寺・大仏・古事記・万葉集</div>';
  html+='<div class="ex">平安へ：794年に桓武天皇が平安京へ遷都</div>';
  html+='<div class="note">💡 「なんと（710）立派な平城京」→「なくよ（794）うぐいす平安京」をセットで！</div>';
  html+='</div>';
  html+='</div>';

  html+='<div style="font-size:13px;color:var(--text2);margin:16px 0 12px;letter-spacing:.08em">✏️ 練習問題 — 全15問（選択肢から選ぼう）</div>';

  var qs=[
    { qid:'soc_hist_s1_q0',
      jp:'打製石器を使い、狩猟・採集を中心に生活していた日本最古の時代は？',
      answer:'旧石器時代', choices:['旧石器時代','縄文時代','弥生時代','古墳時代'],
      exp:'📌 ルール：<b>打製石器</b>（石を打ち欠いて作る）＝旧石器時代<br>✅ 正例：旧石器→縄文（磨製石器）→弥生（金属器）の順<br>💡 「打（つ）→旧」でセット！' },
    { qid:'soc_hist_s1_q1',
      jp:'縄文時代の特徴として正しいものはどれか？',
      answer:'縄文土器・弓矢・たて穴住居・貝塚', choices:['縄文土器・弓矢・たて穴住居・貝塚','稲作・弥生土器・高床倉庫','前方後円墳・埴輪','鉄砲・石包丁・環濠集落'],
      exp:'📌 縄文時代の特徴：<b>縄文土器</b>（厚い・黒い・縄目模様）・貝塚・弓矢・たて穴住居<br>✅ 縄文土器・弓矢・たて穴住居・貝塚<br>💡 縄文＝縄の模様の土器！' },
    { qid:'soc_hist_s1_q2',
      jp:'縄文時代の人々の住居は何というか？',
      answer:'たて穴住居', choices:['たて穴住居','高床倉庫','竪穴式石室','掘立柱建物'],
      exp:'📌 縄文時代：地面を掘り下げて床とした「たて穴住居」<br>✅ たて穴住居<br>💡 弥生時代の「高床倉庫」（コメの保管）と区別しよう！' },
    { qid:'soc_hist_s1_q3',
      jp:'稲作が大陸から伝わり、青銅器・鉄器などの金属器が使われるようになった時代は？',
      answer:'弥生時代', choices:['縄文時代','弥生時代','古墳時代','飛鳥時代'],
      exp:'📌 弥生時代：稲作・<b>弥生土器</b>（薄い・赤い）・青銅器・鉄器・高床倉庫<br>✅ 弥生時代<br>💡 「弥生土器＝薄くて赤い」で縄文と区別！' },
    { qid:'soc_hist_s1_q4',
      jp:'3世紀、邪馬台国の女王として中国（魏）に使いを送り「親魏倭王」の称号を得た人物は？',
      answer:'卑弥呼', choices:['卑弥呼','持統天皇','推古天皇','神功皇后'],
      exp:'📌 <b>卑弥呼</b>：3世紀の邪馬台国の女王。呪術で国を治め、239年に魏に使者を送った。<br>中国の歴史書「魏志倭人伝」に詳しく記録されている。<br>✅ 卑弥呼' },
    { qid:'soc_hist_s1_q5',
      jp:'古墳時代に大和政権の大王や豪族が作った、前が四角で後ろが丸い大きな墓は？',
      answer:'前方後円墳', choices:['前方後円墳','方墳','円墳','横穴式石室'],
      exp:'📌 <b>前方後円墳</b>：大和政権の権力者の墓。大阪の大仙陵古墳が最大（全長486m）。<br>✅ 前方後円墳<br>💡 「前が方形（四角）、後ろが円形」→前方後円墳！' },
    { qid:'soc_hist_s1_q6',
      jp:'飛鳥時代に「十七条の憲法」を定め、遣隋使を派遣した人物は？',
      answer:'聖徳太子', choices:['聖徳太子','中大兄皇子','藤原鎌足','天武天皇'],
      exp:'📌 <b>聖徳太子</b>（厩戸王）：十七条の憲法（604年）・冠位十二階・遣隋使（小野妹子）<br>✅ 聖徳太子<br>💡 「604年＝むしいほど立派な十七条」' },
    { qid:'soc_hist_s1_q7',
      jp:'聖徳太子が十七条の憲法を定めたのは何年か？',
      answer:'604年', choices:['604年','645年','710年','794年'],
      exp:'📌 十七条の憲法＝<b>604年</b>（飛鳥時代・聖徳太子）<br>✅ 604年<br>💡 語呂：「む（6）し（4）いほど立派な憲法→604年」' },
    { qid:'soc_hist_s1_q8',
      jp:'645年に中大兄皇子と藤原鎌足が蘇我氏を倒して行った改革を何というか？',
      answer:'大化の改新', choices:['大化の改新','壬申の乱','白村江の戦い','応仁の乱'],
      exp:'📌 <b>大化の改新</b>（645年）：蘇我入鹿を暗殺し、公地公民制を導入。日本最初の元号「大化」が制定。<br>✅ 大化の改新<br>💡 「645年＝むし殺す蘇我氏」' },
    { qid:'soc_hist_s1_q9',
      jp:'大化の改新（645年）の2人の中心人物は？',
      answer:'中大兄皇子・藤原鎌足', choices:['中大兄皇子・藤原鎌足','聖徳太子・蘇我馬子','聖武天皇・行基','桓武天皇・坂上田村麻呂'],
      exp:'📌 <b>中大兄皇子</b>（のちの天智天皇）＋<b>藤原鎌足</b> → 蘇我蝦夷・入鹿を打倒<br>✅ 中大兄皇子・藤原鎌足<br>💡 「中大兄＋鎌足」のコンビで覚えよう！' },
    { qid:'soc_hist_s1_q10',
      jp:'710年に都が置かれ、奈良時代が始まった都の名前は？',
      answer:'平城京', choices:['平城京','平安京','難波京','藤原京'],
      exp:'📌 <b>平城京</b>（現在の奈良市）：710年に遷都 → 奈良時代スタート<br>✅ 平城京<br>💡 語呂：「なんと（710）立派な平城京」' },
    { qid:'soc_hist_s1_q11',
      jp:'奈良時代に仏教の力で国を守ろうと国分寺・東大寺を建立した天皇は？',
      answer:'聖武天皇', choices:['聖武天皇','桓武天皇','天武天皇','推古天皇'],
      exp:'📌 <b>聖武天皇</b>：国分寺・国分尼寺を全国に建立。743年に東大寺の大仏造立を命じた。<br>✅ 聖武天皇<br>💡 「聖武＝大仏」のセットで覚える！' },
    { qid:'soc_hist_s1_q12',
      jp:'奈良時代に編纂された、日本最古の和歌集は？',
      answer:'万葉集', choices:['万葉集','古今和歌集','新古今和歌集','竹取物語'],
      exp:'📌 <b>万葉集</b>：奈良時代に成立した日本最古の和歌集。約4500首。天皇から庶民まで様々な人の歌が収録。<br>また奈良時代には歴史書「古事記」「日本書紀」も成立。<br>✅ 万葉集' },
    { qid:'soc_hist_s1_q13',
      jp:'794年に都が移り平安時代が始まった都の名前は？',
      answer:'平安京', choices:['平安京','平城京','難波京','鎌倉'],
      exp:'📌 <b>平安京</b>（現在の京都市）：794年に桓武天皇が遷都 → 平安時代スタート<br>✅ 平安京<br>💡 語呂：「なくよ（794）うぐいす平安京」' },
    { qid:'soc_hist_s1_q14',
      jp:'794年に平安京へ遷都した天皇は？',
      answer:'桓武天皇', choices:['桓武天皇','聖武天皇','天智天皇','後醍醐天皇'],
      exp:'📌 <b>桓武天皇</b>：784年に長岡京 → 794年に平安京（京都）に遷都。奈良仏教の影響を排除する目的もあった。<br>✅ 桓武天皇<br>💡 「かんむ（桓武）り天皇が かんむりの都・京都を作った」' },
  ];

  qs.forEach(function(q){ html+=makeChoices(q.qid,q.jp,q.answer,q.choices,q.exp); });
  return html;
}

// ===== SECTION 2: 平安〜鎌倉 =====
function renderSection2(){
  var html='';

  // SVG Timeline
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">⏰ 平安〜鎌倉タイムライン</div>';
  html+=makeSvgSection2Timeline();
  html+='<div style="font-size:11px;color:var(--text2);text-align:right">← 平安京　　　　　　　　　　　　　　鎌倉幕府滅亡 →</div>';
  html+='</div>';

  // きょん＆西村の会話
  html+='<div class="intro-box">';
  html+='<div class="intro-box-title">🎤 きょん＆西村の会話</div>';
  html+=chat('kyon','きょん','平安時代って貴族がきらびやかな服着てるやつでしょ？あんな服着てたら戦えなくない？？');
  html+=chat('nishi','西村（慶應卒・元アナ）','その通り。平安貴族は政治を独占していたが、実際の武力を持つ武士が台頭してきた。平清盛→源頼朝の流れで貴族の時代は終わっていく。');
  html+=chat('kyon','きょん','貴族から武士へのバトンタッチか！！吉本で先輩から俺たちの時代になるみたいな！！');
  html+=chat('nishi','西村','的を射たたとえだ。藤原道長が「この世をば 我が世とぞ思ふ」と詠んだのが平安の絶頂期。そこから100年後には武士が主役になる。');
  html+=chat('kyon','きょん','100年で主役交代！？俺は待てない！！今すぐ売れたい！！');
  html+=chat('nishi','西村','（笑）。源平合戦から鎌倉幕府成立の流れは試験の超頻出だ。しっかり覚えよう。');
  html+='</div>';

  // 語呂合わせカード
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">🎵 語呂合わせ — この時代の年号</div>';
  var goros=[
    { year:'1086年', goro:'ひーろびろ（1086）と院政をする白河上皇', event:'院政開始（白河上皇）' },
    { year:'1167年', goro:'ひとびとなやむ（1167）平清盛',           event:'平清盛が太政大臣に就任' },
    { year:'1185年', goro:'いい箱（1185）作ろう鎌倉幕府',           event:'壇ノ浦の戦い・鎌倉幕府成立' },
    { year:'1221年', goro:'ふじさんよ（1221）承久の乱',             event:'承久の乱（後鳥羽上皇 vs 北条義時）' },
    { year:'1274年', goro:'ひとなみに（1274）やられた元寇',         event:'文永の役（1度目の元寇）' },
    { year:'1281年', goro:'いにはいれない（1281）モンゴル軍',       event:'弘安の役（2度目の元寇）' },
  ];
  html+='<div style="display:grid;gap:8px">';
  goros.forEach(function(g){
    html+='<div style="background:rgba(245,197,24,0.07);border-left:3px solid var(--amber);padding:10px 14px;border-radius:0 8px 8px 0">';
    html+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
    html+='<span style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--amber);flex-shrink:0;letter-spacing:1px">'+g.year+'</span>';
    html+='<span style="font-size:13px;color:var(--gold);font-weight:bold">「'+g.goro+'」</span>';
    html+='</div>';
    html+='<div style="font-size:12px;color:var(--text2);margin-top:4px">→ '+g.event+'</div>';
    html+='</div>';
  });
  html+='</div>';
  html+='</div>';

  // 時代まとめ
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">📖 時代まとめ：平安〜鎌倉</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">平安時代（794〜1185年）</div>';
  html+='<div class="ex">藤原氏の摂関政治：娘を天皇の后にし、摂政・関白として政治を独占</div>';
  html+='<div class="ex">藤原道長が最盛期：「この世をば 我が世とぞ思ふ」（1018年）</div>';
  html+='<div class="ex">国風文化：源氏物語（紫式部）・枕草子（清少納言）・かな文字の発達</div>';
  html+='<div class="ex">院政（1086年〜）：白河上皇が退位後も政治を行う → 藤原氏の力を弱める</div>';
  html+='<div class="ex">平清盛（1167年太政大臣）：武士として初の太政大臣・日宋貿易を推進</div>';
  html+='<div class="note">💡 権力の移り変わり：藤原氏 → 院政 → 平氏 → 武士（源氏）</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">鎌倉時代（1185〜1333年）</div>';
  html+='<div class="ex">源頼朝：1185年壇ノ浦で平氏滅亡→鎌倉幕府成立・1192年征夷大将軍</div>';
  html+='<div class="ex">御恩と奉公：将軍が土地を与える（御恩）⇔ 御家人が戦で奉仕（奉公）</div>';
  html+='<div class="ex">執権政治：頼朝の死後、北条氏が執権として実権を掌握</div>';
  html+='<div class="ex">承久の乱（1221年）：後鳥羽上皇が幕府に敗北 → 六波羅探題設置</div>';
  html+='<div class="ex">元寇：文永の役（1274年）・弘安の役（1281年）、北条時宗が撃退</div>';
  html+='<div class="note">💡 「いい箱（1185）作ろう鎌倉幕府」は試験必須の語呂合わせ！</div>';
  html+='</div>';
  html+='</div>';

  html+='<div style="font-size:13px;color:var(--text2);margin:16px 0 12px;letter-spacing:.08em">✏️ 練習問題 — 全15問（選択肢から選ぼう）</div>';

  var qs=[
    { qid:'soc_hist_s2_q0',
      jp:'平安時代に天皇に代わり政治の実権を握った、「摂政・関白」を独占した貴族の一族は？',
      answer:'藤原氏', choices:['源氏','平氏','藤原氏','橘氏'],
      exp:'📌 <b>藤原氏</b>：娘を天皇の后にして外戚となり、摂政・関白として政治を支配した。<br>✅ 藤原氏<br>💡 「フジワラ」＝ふじの花のように豪華に平安を支配！' },
    { qid:'soc_hist_s2_q1',
      jp:'「この世をば 我が世とぞ思ふ 望月の 欠けたることも なしと思へば」と詠んだ藤原氏の権力者は？',
      answer:'藤原道長', choices:['藤原道長','藤原頼通','藤原鎌足','藤原純友'],
      exp:'📌 <b>藤原道長</b>：3人の娘を天皇の后にした権力の絶頂期（1018年）に詠んだ歌。<br>満月（望月）に自分を例えた「ドヤ詩」。<br>✅ 藤原道長' },
    { qid:'soc_hist_s2_q2',
      jp:'「源氏物語」を書いた平安時代の女性作家は？',
      answer:'紫式部', choices:['紫式部','清少納言','和泉式部','小野小町'],
      exp:'📌 <b>紫式部</b>＝「源氏物語」（世界最古の長編小説の一つ）<br>清少納言＝「枕草子」（随筆）<br>✅ 紫式部<br>💡 「ムラサキ→源氏物語」でセット！' },
    { qid:'soc_hist_s2_q3',
      jp:'「枕草子」を書いた平安時代の女性作家は？',
      answer:'清少納言', choices:['紫式部','清少納言','与謝野晶子','樋口一葉'],
      exp:'📌 <b>清少納言</b>＝「枕草子」（随筆・日常を生き生きと描く）<br>紫式部＝「源氏物語」<br>✅ 清少納言<br>💡 「まくら→清らか→清少納言」' },
    { qid:'soc_hist_s2_q4',
      jp:'1086年、白河天皇が退位後も政治の実権を握り続けた政治体制を何というか？',
      answer:'院政', choices:['院政','摂関政治','武家政治','執権政治'],
      exp:'📌 <b>院政</b>：上皇（退位した天皇）が「院」から政治を行う体制。藤原氏の力を弱めるために始まった。<br>✅ 院政<br>💡 「院セイ＝上皇（イン）による政治」' },
    { qid:'soc_hist_s2_q5',
      jp:'日宋貿易を積極的に推進し、1167年に武士として初めて太政大臣になった人物は？',
      answer:'平清盛', choices:['平清盛','源頼朝','源義経','平将門'],
      exp:'📌 <b>平清盛</b>：武士として初の太政大臣（1167年）。大輪田泊を整備し日宋貿易を推進。<br>✅ 平清盛<br>💡 「ひとびとなやむ（1167）→清盛が太政大臣」' },
    { qid:'soc_hist_s2_q6',
      jp:'1185年の壇ノ浦の戦いで平氏を滅ぼし、鎌倉に武家政権を開いた人物は？',
      answer:'源頼朝', choices:['源頼朝','源義経','北条時宗','足利尊氏'],
      exp:'📌 <b>源頼朝</b>：弟・義経の活躍で平氏を滅ぼす。1185年に鎌倉幕府成立、1192年に征夷大将軍。<br>✅ 源頼朝<br>💡 「いい箱（1185）作ろう鎌倉幕府」' },
    { qid:'soc_hist_s2_q7',
      jp:'鎌倉時代に将軍が御家人に土地を与え保護した。この将軍側の義務を何というか？',
      answer:'御恩', choices:['御恩','奉公','安堵','恩賞'],
      exp:'📌 <b>御恩</b>：将軍が御家人に土地を与え・保護する ⇔ <b>奉公</b>：御家人が戦で将軍に奉仕する<br>この御恩と奉公の関係が封建制度の基本。<br>✅ 御恩' },
    { qid:'soc_hist_s2_q8',
      jp:'源頼朝の死後、鎌倉幕府の実権を握り「執権」を世襲した一族は？',
      answer:'北条氏', choices:['北条氏','藤原氏','足利氏','畠山氏'],
      exp:'📌 <b>北条氏</b>：源頼朝の妻・北条政子の実家。2代目以降は北条氏が「執権」として実権を掌握。<br>✅ 北条氏<br>💡 「北条政子＝尼将軍」でも有名！' },
    { qid:'soc_hist_s2_q9',
      jp:'1221年、幕府を倒そうとして挙兵したが、北条義時に敗れた上皇は？',
      answer:'後鳥羽上皇', choices:['後鳥羽上皇','後醍醐天皇','後白河上皇','崇徳上皇'],
      exp:'📌 <b>承久の乱</b>（1221年）：後鳥羽上皇が幕府に対して挙兵 → 幕府が勝利 → 六波羅探題設置<br>✅ 後鳥羽上皇<br>💡 「ふじさんよ（1221）承久の乱」' },
    { qid:'soc_hist_s2_q10',
      jp:'承久の乱（1221年）後、幕府が京都に設置した朝廷監視機関は？',
      answer:'六波羅探題', choices:['六波羅探題','問注所','侍所','政所'],
      exp:'📌 <b>六波羅探題</b>：承久の乱後に設置。京都に置いて朝廷・西国の御家人を監視した。<br>✅ 六波羅探題<br>💡 「ロッパラ→六波羅探題」' },
    { qid:'soc_hist_s2_q11',
      jp:'元寇のうち、最初の侵攻（文永の役）が起きたのは何年か？',
      answer:'1274年', choices:['1274年','1281年','1185年','1221年'],
      exp:'📌 <b>文永の役</b>：1274年（1度目の元寇）<br><b>弘安の役</b>：1281年（2度目の元寇）<br>✅ 1274年<br>💡 「ひとなみに（1274）やられた→文永の役」' },
    { qid:'soc_hist_s2_q12',
      jp:'2度の元寇（1274年・1281年）を幕府の執権として撃退した人物は？',
      answer:'北条時宗', choices:['北条時宗','北条政子','北条泰時','源頼朝'],
      exp:'📌 <b>北条時宗</b>（8代執権）：2度の元寇（文永・弘安）を撃退。暴風雨「神風」も助けになった。<br>✅ 北条時宗' },
    { qid:'soc_hist_s2_q13',
      jp:'元寇後、御家人が幕府への忠誠を失っていった最大の原因は何か？',
      answer:'新たな土地をもらえず生活が苦しくなった', choices:['新たな土地をもらえず生活が苦しくなった','たくさんの土地を与えられ豊かになった','幕府から高い俸禄をもらえた','武士をやめて農民になった'],
      exp:'📌 元寇は外敵との戦い → 勝っても新たな土地（敵の土地）が取れない<br>→ 御家人に与える土地がない → 御恩と奉公の関係が崩れる → 幕府の力が弱まる<br>✅ 新たな土地をもらえず生活が苦しくなった' },
    { qid:'soc_hist_s2_q14',
      jp:'後醍醐天皇の呼びかけに足利尊氏らが応じて鎌倉幕府を滅ぼしたのは何年か？',
      answer:'1333年', choices:['1333年','1336年','1281年','1392年'],
      exp:'📌 <b>1333年</b>：足利尊氏・新田義貞らが倒幕に参加し、鎌倉幕府が滅亡。翌年、後醍醐天皇の建武の新政へ。<br>✅ 1333年<br>💡 「ひとなみさんさん（1333）鎌倉終わり」' },
  ];

  qs.forEach(function(q){ html+=makeChoices(q.qid,q.jp,q.answer,q.choices,q.exp); });
  return html;
}

// ===== SVG: 室町〜江戸 詳細タイムライン =====
function makeSvgSection3Timeline() {
  var events = [
    {label:'鎌倉幕府滅亡', sub:'1333年',  year:'建武の新政',  x:25,  above:true,  c:'#208870'},
    {label:'室町幕府',     sub:'1338年',  year:'足利尊氏',   x:120, above:false, c:'#2888A0'},
    {label:'金閣・勘合貿易',sub:'1397〜', year:'足利義満',   x:215, above:true,  c:'#9C7030'},
    {label:'応仁の乱',     sub:'1467年',  year:'戦国時代へ',  x:310, above:false, c:'#A84848'},
    {label:'鉄砲伝来',     sub:'1543年',  year:'信長の台頭',  x:400, above:true,  c:'#B05840'},
    {label:'関ヶ原',       sub:'1600年',  year:'家康が勝利',  x:500, above:false, c:'#7050A0'},
    {label:'江戸幕府',     sub:'1603年',  year:'徳川家康',   x:580, above:true,  c:'#5068B8'},
    {label:'ペリー来航',   sub:'1853年',  year:'幕末へ',     x:690, above:false, c:'#C04848'},
  ];
  var o = '<svg viewBox="0 0 760 138" style="width:100%;display:block;overflow:visible;margin:10px 0 16px">';
  o += '<line x1="10" y1="69" x2="750" y2="69" stroke="#333" stroke-width="2"/>';
  events.forEach(function(e){
    o += '<circle cx="'+e.x+'" cy="69" r="5" fill="'+e.c+'"/>';
    if(e.above){
      o += '<line x1="'+e.x+'" y1="64" x2="'+e.x+'" y2="28" stroke="'+e.c+'" stroke-width="1" stroke-dasharray="3,2"/>';
      o += '<text x="'+e.x+'" y="23" text-anchor="middle" fill="'+e.c+'" font-size="9.5" font-family="Noto Serif JP,serif" font-weight="bold">'+e.label+'</text>';
      o += '<text x="'+e.x+'" y="35" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif">'+e.sub+'</text>';
      o += '<text x="'+e.x+'" y="46" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif" opacity="0.85">'+e.year+'</text>';
    } else {
      o += '<line x1="'+e.x+'" y1="74" x2="'+e.x+'" y2="106" stroke="'+e.c+'" stroke-width="1" stroke-dasharray="3,2"/>';
      o += '<text x="'+e.x+'" y="119" text-anchor="middle" fill="'+e.c+'" font-size="9.5" font-family="Noto Serif JP,serif" font-weight="bold">'+e.label+'</text>';
      o += '<text x="'+e.x+'" y="130" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif">'+e.sub+'</text>';
    }
  });
  o += '<polygon points="754,69 745,64 745,74" fill="#555"/>';
  o += '</svg>';
  return o;
}

// ===== SECTION 3: 室町〜江戸 =====
function renderSection3(){
  var html='';

  // SVG Timeline
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">⏰ 室町〜江戸タイムライン</div>';
  html+=makeSvgSection3Timeline();
  html+='<div style="font-size:11px;color:var(--text2);text-align:right">← 室町幕府成立　　　　　　　　　　　　　　幕末 →</div>';
  html+='</div>';

  // きょん＆西村の会話
  html+='<div class="intro-box">';
  html+='<div class="intro-box-title">🎤 きょん＆西村の会話</div>';
  html+=chat('kyon','きょん','戦国時代って織田信長が超かっこよくない！？鉄砲を最初に使った天才！！');
  html+=chat('nishi','西村（慶應卒・元アナ）','信長は確かに革新的だった。長篠の戦いで鉄砲を組織的に使い、騎馬隊を壊滅させた。しかし1582年の本能寺の変で家臣の明智光秀に討たれる。');
  html+=chat('kyon','きょん','光秀が裏切ったやつ！！「敵は本能寺にあり！」は授業で聞いた！！裏切り者キャラとして記憶に残ってる！！');
  html+=chat('nishi','西村','そのキャラ付けで覚えると良い。信長の後は豊臣秀吉が天下を統一し、さらに徳川家康が関ヶ原（1600年）に勝って江戸幕府を開く。この3人の「三英傑」は絶対に覚えよう。');
  html+=chat('kyon','きょん','「鳴かぬなら……」って語呂合わせの人たちだ！！えーと、信長が「殺してしまえ」秀吉が「鳴かせてみよう」家康が「鳴くまで待とう」！！');
  html+=chat('nishi','西村','完璧だ。江戸幕府は約260年続いたが、1853年のペリー来航で開国を迫られて崩れ始める。');
  html+='</div>';

  // 語呂合わせカード
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">🎵 語呂合わせ — この時代の年号</div>';
  var goros=[
    { year:'1338年', goro:'いざ（13）さあ（38）室町幕府',          event:'足利尊氏が室町幕府を開く' },
    { year:'1467年', goro:'一夜（1467）むなしい応仁の乱',           event:'応仁の乱（〜1477年）→戦国時代へ' },
    { year:'1543年', goro:'以後（15）よ（4）み（3）ろ鉄砲来た',     event:'鉄砲伝来（種子島）' },
    { year:'1582年', goro:'以後（15）は（8）に（2）んまい本能寺',   event:'本能寺の変（信長が討たれる）' },
    { year:'1600年', goro:'ひとむ（1600）れ関ヶ原',                 event:'関ヶ原の戦い（家康が勝利）' },
    { year:'1853年', goro:'一夜一夜（1853）に人見ごろ',             event:'ペリー来航（黒船）' },
  ];
  html+='<div style="display:grid;gap:8px">';
  goros.forEach(function(g){
    html+='<div style="background:rgba(245,197,24,0.07);border-left:3px solid var(--amber);padding:10px 14px;border-radius:0 8px 8px 0">';
    html+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
    html+='<span style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--amber);flex-shrink:0;letter-spacing:1px">'+g.year+'</span>';
    html+='<span style="font-size:13px;color:var(--gold);font-weight:bold">「'+g.goro+'」</span>';
    html+='</div>';
    html+='<div style="font-size:12px;color:var(--text2);margin-top:4px">→ '+g.event+'</div>';
    html+='</div>';
  });
  html+='</div>';
  html+='</div>';

  // 時代まとめ
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">📖 時代まとめ：室町〜江戸</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">室町時代（1336〜1573年）</div>';
  html+='<div class="ex">足利尊氏：1338年に室町幕府を開く（後醍醐天皇の建武の新政を倒す）</div>';
  html+='<div class="ex">足利義満（3代）：南北朝統一・金閣・勘合貿易（日明貿易）</div>';
  html+='<div class="ex">応仁の乱（1467〜77年）：将軍家の跡継ぎ争い → 室町幕府の権威失墜 → 戦国時代へ</div>';
  html+='<div class="note">💡 「いざ（13）さあ（38）室町幕府」で1338年を覚えよう！</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">安土桃山時代（1573〜1603年）</div>';
  html+='<div class="ex">織田信長：長篠の戦い（鉄砲活用）・楽市楽座・1582年本能寺の変で倒れる</div>';
  html+='<div class="ex">豊臣秀吉：太閤検地（1582年〜）・刀狩（1588年）・朝鮮出兵</div>';
  html+='<div class="ex">三英傑の格言：信長「殺してしまえ」秀吉「鳴かせてみよう」家康「鳴くまで待とう」</div>';
  html+='<div class="note">💡 鉄砲は1543年に種子島に伝来。キリスト教は1549年にザビエルが伝来。</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">江戸時代（1603〜1868年）</div>';
  html+='<div class="ex">徳川家康：関ヶ原（1600年）勝利→1603年征夷大将軍→江戸幕府開幕</div>';
  html+='<div class="ex">参勤交代（家光）：大名が1年おきに江戸と領地を往復→大名の財力を消耗</div>';
  html+='<div class="ex">鎖国（1639年完成）：貿易窓口は長崎のみ（オランダ・清）・薩摩・対馬・松前</div>';
  html+='<div class="ex">幕末：ペリー来航（1853年）→日米和親条約（1854年）→大政奉還（1867年）</div>';
  html+='<div class="note">💡 「一夜一夜（1853）に人見ごろ」でペリー来航の年号を覚えよう！</div>';
  html+='</div>';
  html+='</div>';

  html+='<div style="font-size:13px;color:var(--text2);margin:16px 0 12px;letter-spacing:.08em">✏️ 練習問題 — 全15問（選択肢から選ぼう）</div>';

  var qs=[
    { qid:'soc_hist_s3_q0',
      jp:'1338年に室町幕府を開いた人物は？',
      answer:'足利尊氏', choices:['足利尊氏','足利義満','足利義政','北条時頼'],
      exp:'📌 <b>足利尊氏</b>：後醍醐天皇の建武の新政を倒し、1338年に京都に室町幕府を開く。<br>✅ 足利尊氏<br>💡 「いざ（13）さあ（38）室町幕府」' },
    { qid:'soc_hist_s3_q1',
      jp:'室町幕府3代将軍・足利義満が京都の北山に建てた建物は？',
      answer:'金閣', choices:['金閣','銀閣','東大寺','清水寺'],
      exp:'📌 <b>金閣</b>（鹿苑寺金閣）＝足利義満（3代）<br><b>銀閣</b>（慈照寺銀閣）＝足利義政（8代）<br>✅ 金閣<br>💡 「義満→金（3代）、義政→銀（8代）」' },
    { qid:'soc_hist_s3_q2',
      jp:'1467年から始まり室町幕府を弱体化させ、戦国時代のきっかけとなった争乱は？',
      answer:'応仁の乱', choices:['応仁の乱','壬申の乱','承久の乱','島原の乱'],
      exp:'📌 <b>応仁の乱</b>（1467〜77年）：将軍家の跡継ぎ争いで守護大名も二手に分かれて戦い、室町幕府の権威が失墜。<br>✅ 応仁の乱<br>💡 「一夜（1467）むなしい応仁の乱」' },
    { qid:'soc_hist_s3_q3',
      jp:'1543年にポルトガル人が伝えた武器は？また伝えた場所は？',
      answer:'鉄砲・種子島', choices:['鉄砲・種子島','火薬・長崎','大砲・対馬','弓・佐渡島'],
      exp:'📌 1543年：ポルトガル人が<b>種子島</b>に漂着し<b>鉄砲</b>（火縄銃）を伝える。<br>✅ 鉄砲・種子島<br>💡 「以後（15）よ（4）み（3）ろ鉄砲来た→1543年種子島」' },
    { qid:'soc_hist_s3_q4',
      jp:'1549年、キリスト教を日本に伝えたスペイン人宣教師は？',
      answer:'ザビエル', choices:['ザビエル','コロンブス','マゼラン','バスコ・ダ・ガマ'],
      exp:'📌 <b>フランシスコ・ザビエル</b>（イエズス会）：1549年に鹿児島に上陸しキリスト教を伝える。<br>✅ ザビエル<br>💡 「以後（15）よく（49）広まるキリスト教」' },
    { qid:'soc_hist_s3_q5',
      jp:'全国統一を目指したが、1582年の本能寺の変で家臣に討たれた武将は？',
      answer:'織田信長', choices:['織田信長','豊臣秀吉','徳川家康','武田信玄'],
      exp:'📌 <b>織田信長</b>：長篠の戦い（鉄砲活用）・楽市楽座。1582年、本能寺の変で<b>明智光秀</b>に討たれる。<br>✅ 織田信長<br>💡 「以後（15）は（8）に（2）んまい本能寺」' },
    { qid:'soc_hist_s3_q6',
      jp:'豊臣秀吉が田畑の面積・収穫量を調査して年貢の基準を統一した政策は？',
      answer:'太閤検地', choices:['太閤検地','刀狩','楽市楽座','参勤交代'],
      exp:'📌 <b>太閤検地</b>（1582年〜）：土地の広さ・等級・予想収穫高を測定 → 年貢の基準を統一。<br>✅ 太閤検地' },
    { qid:'soc_hist_s3_q7',
      jp:'豊臣秀吉が農民・寺社から刀や弓などの武器を没収した政策は？',
      answer:'刀狩', choices:['刀狩','太閤検地','楽市楽座','参勤交代'],
      exp:'📌 <b>刀狩</b>（1588年）：農民・寺社の武器を没収 → 兵農分離が進む。<br>✅ 刀狩<br>💡 「刀狩＋太閤検地→秀吉の2大政策」でセットで覚える！' },
    { qid:'soc_hist_s3_q8',
      jp:'1600年の関ヶ原の戦いで勝利し、1603年に江戸幕府を開いた人物は？',
      answer:'徳川家康', choices:['徳川家康','徳川家光','豊臣秀吉','石田三成'],
      exp:'📌 <b>徳川家康</b>：関ヶ原の戦い（1600年）で石田三成の西軍に勝利。1603年に征夷大将軍→江戸幕府成立。<br>✅ 徳川家康<br>💡 「ひとむれ（1600）関ヶ原→1603年江戸幕府」' },
    { qid:'soc_hist_s3_q9',
      jp:'江戸幕府3代将軍・徳川家光が定めた、大名を1年おきに江戸と領地を往復させる制度は？',
      answer:'参勤交代', choices:['参勤交代','鎖国','刀狩','楽市楽座'],
      exp:'📌 <b>参勤交代</b>：大名が交互に江戸と領地で生活する制度。移動費・江戸の生活費で大名の財力を消耗させ、反乱を防ぐ狙いがあった。<br>✅ 参勤交代' },
    { qid:'soc_hist_s3_q10',
      jp:'江戸幕府が鎖国中に長崎の出島でのみ交易を認めたヨーロッパの国は？',
      answer:'オランダ', choices:['オランダ','スペイン','ポルトガル','イギリス'],
      exp:'📌 <b>鎖国</b>（1639年完成）：長崎の出島でオランダ・清のみ貿易を許可。スペイン・ポルトガルはキリスト教布教を理由に禁止。<br>✅ オランダ' },
    { qid:'soc_hist_s3_q11',
      jp:'江戸幕府が鎖国中に認めた4つの窓口のうち、長崎（オランダ・中国）以外の3つは？',
      answer:'薩摩・対馬・松前', choices:['薩摩・対馬・松前','琉球・壱岐・隠岐','会津・仙台・金沢','京都・大阪・奈良'],
      exp:'📌 鎖国中の窓口4か所：長崎（オランダ・中国）・<b>薩摩</b>（琉球）・<b>対馬</b>（朝鮮）・<b>松前</b>（蝦夷地/アイヌ）<br>✅ 薩摩・対馬・松前' },
    { qid:'soc_hist_s3_q12',
      jp:'1853年にアメリカの黒船で浦賀に来航し開国を迫った人物は？',
      answer:'ペリー', choices:['ペリー','ハリス','マッカーサー','リンカーン'],
      exp:'📌 <b>ペリー</b>（アメリカ東インド艦隊司令官）：1853年来航 → 翌1854年に日米和親条約。鎖国が終わる。<br>✅ ペリー<br>💡 「一夜一夜（1853）に人見ごろ→ペリー来航」' },
    { qid:'soc_hist_s3_q13',
      jp:'ペリー来航（1853年）後に結ばれた、下田・函館を開港した条約は？',
      answer:'日米和親条約', choices:['日米和親条約','日米修好通商条約','下関条約','ポーツマス条約'],
      exp:'📌 <b>日米和親条約</b>（1854年）：下田・函館を開港し鎖国が終わる。<br>不平等条約の日米修好通商条約（1858年）とは区別しよう。<br>✅ 日米和親条約' },
    { qid:'soc_hist_s3_q14',
      jp:'1867年に最後の将軍・徳川慶喜が朝廷に政権を返上した出来事を何というか？',
      answer:'大政奉還', choices:['大政奉還','王政復古の大号令','廃藩置県','明治維新'],
      exp:'📌 <b>大政奉還</b>（1867年）：徳川慶喜が政権を朝廷に返上 → 265年続いた江戸幕府が終わる。翌1868年に明治維新へ。<br>✅ 大政奉還' },
  ];

  qs.forEach(function(q){ html+=makeChoices(q.qid,q.jp,q.answer,q.choices,q.exp); });
  return html;
}

// ===== SVG: 明治〜現代 タイムライン =====
function makeSvgSection4Timeline() {
  var events = [
    {label:'明治維新',     sub:'1868年',  year:'文明開化',   x:22,  above:true,  c:'#B09020'},
    {label:'大日本帝国憲法',sub:'1889年', year:'伊藤博文',   x:120, above:false, c:'#9C7030'},
    {label:'日清戦争',     sub:'1894年',  year:'下関条約',   x:215, above:true,  c:'#C04848'},
    {label:'日露戦争',     sub:'1904年',  year:'ポーツマス',  x:305, above:false, c:'#A84848'},
    {label:'第一次大戦',   sub:'1914年',  year:'大正デモクラシー',x:400,above:true,c:'#7050A0'},
    {label:'普通選挙法',   sub:'1925年',  year:'男子普選',   x:490, above:false, c:'#5068B8'},
    {label:'太平洋戦争',   sub:'1941年',  year:'真珠湾',     x:590, above:true,  c:'#C04848'},
    {label:'終戦・新憲法', sub:'1945〜46',year:'民主化',     x:700, above:false, c:'#208870'},
  ];
  var o = '<svg viewBox="0 0 760 138" style="width:100%;display:block;overflow:visible;margin:10px 0 16px">';
  o += '<line x1="10" y1="69" x2="750" y2="69" stroke="#333" stroke-width="2"/>';
  events.forEach(function(e){
    o += '<circle cx="'+e.x+'" cy="69" r="5" fill="'+e.c+'"/>';
    if(e.above){
      o += '<line x1="'+e.x+'" y1="64" x2="'+e.x+'" y2="28" stroke="'+e.c+'" stroke-width="1" stroke-dasharray="3,2"/>';
      o += '<text x="'+e.x+'" y="23" text-anchor="middle" fill="'+e.c+'" font-size="9" font-family="Noto Serif JP,serif" font-weight="bold">'+e.label+'</text>';
      o += '<text x="'+e.x+'" y="35" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif">'+e.sub+'</text>';
      o += '<text x="'+e.x+'" y="46" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif" opacity="0.85">'+e.year+'</text>';
    } else {
      o += '<line x1="'+e.x+'" y1="74" x2="'+e.x+'" y2="106" stroke="'+e.c+'" stroke-width="1" stroke-dasharray="3,2"/>';
      o += '<text x="'+e.x+'" y="119" text-anchor="middle" fill="'+e.c+'" font-size="9" font-family="Noto Serif JP,serif" font-weight="bold">'+e.label+'</text>';
      o += '<text x="'+e.x+'" y="130" text-anchor="middle" fill="'+e.c+'" font-size="8" font-family="Noto Serif JP,serif">'+e.sub+'</text>';
    }
  });
  o += '<polygon points="754,69 745,64 745,74" fill="#555"/>';
  o += '</svg>';
  return o;
}

// ===== SECTION 4: 明治〜現代 =====
function renderSection4(){
  var html='';

  // SVG Timeline
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">⏰ 明治〜現代タイムライン</div>';
  html+=makeSvgSection4Timeline();
  html+='<div style="font-size:11px;color:var(--text2);text-align:right">← 明治維新　　　　　　　　　　　　　終戦・日本国憲法 →</div>';
  html+='</div>';

  // きょん＆西村の会話
  html+='<div class="intro-box">';
  html+='<div class="intro-box-title">🎤 きょん＆西村の会話</div>';
  html+=chat('kyon','きょん','明治時代ってちょんまげをやめた時代でしょ！？急に西洋っぽくなったやつ！！');
  html+=chat('nishi','西村（慶應卒・元アナ）','そうだ。1868年の明治維新で「富国強兵・殖産興業」を掲げ、急速に近代化を進めた。廃藩置県・学制・徴兵令の3つが明治初期の主な改革だ。');
  html+=chat('kyon','きょん','日清・日露ってどっちが中国でどっちがロシアだっけ！？');
  html+=chat('nishi','西村','「清」は中国の王朝名だ。日清戦争（1894年）→下関条約。「露」はロシアの漢字。日露戦争（1904年）→ポーツマス条約。「清→中国、露→ロシア」でセットで覚えよう。');
  html+=chat('kyon','きょん','なるほど！！じゃあ太平洋戦争は1941年でしょ！！真珠湾攻撃！！これは映画で見た！！');
  html+=chat('nishi','西村','正確だ。1945年8月15日の終戦後、GHQの占領下で日本国憲法が1946年に公布・1947年に施行された。この流れは試験でよく出る。');
  html+='</div>';

  // 語呂合わせカード
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">🎵 語呂合わせ — この時代の年号</div>';
  var goros=[
    { year:'1868年', goro:'一発（18）や（6）れ（8）！明治維新',         event:'明治維新・明治政府成立' },
    { year:'1889年', goro:'一発（18）はっくう（89）大日本帝国憲法',     event:'大日本帝国憲法発布（伊藤博文）' },
    { year:'1894年', goro:'一発（18）くん（94）で日清戦争',             event:'日清戦争（〜1895年）→下関条約' },
    { year:'1904年', goro:'行く（190）ぞ（4）日露戦争',                 event:'日露戦争（〜1905年）→ポーツマス条約' },
    { year:'1925年', goro:'行く（19）ぞ（2）5普通選挙',                 event:'普通選挙法（25歳以上男子に選挙権）' },
    { year:'1945年', goro:'行くよ（194）ご（5）！終戦',                 event:'太平洋戦争終戦（8月15日）' },
    { year:'1946年', goro:'行くよ（194）む（6）かし日本国憲法',         event:'日本国憲法公布（11月3日）' },
  ];
  html+='<div style="display:grid;gap:8px">';
  goros.forEach(function(g){
    html+='<div style="background:rgba(245,197,24,0.07);border-left:3px solid var(--amber);padding:10px 14px;border-radius:0 8px 8px 0">';
    html+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
    html+='<span style="font-family:Bebas Neue,sans-serif;font-size:20px;color:var(--amber);flex-shrink:0;letter-spacing:1px">'+g.year+'</span>';
    html+='<span style="font-size:13px;color:var(--gold);font-weight:bold">「'+g.goro+'」</span>';
    html+='</div>';
    html+='<div style="font-size:12px;color:var(--text2);margin-top:4px">→ '+g.event+'</div>';
    html+='</div>';
  });
  html+='</div>';
  html+='</div>';

  // 時代まとめ
  html+='<div class="rule-card">';
  html+='<div class="rule-card-title">📖 時代まとめ：明治〜現代</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">明治時代（1868〜1912年）</div>';
  html+='<div class="ex">明治維新の3大改革：廃藩置県（1871年）・学制（1872年）・徴兵令（1873年）</div>';
  html+='<div class="ex">文明開化：西洋文化の流入（洋服・ガス灯・鉄道）</div>';
  html+='<div class="ex">大日本帝国憲法（1889年）：伊藤博文がプロイセン憲法を参考に作成</div>';
  html+='<div class="ex">日清戦争（1894年）→ 下関条約（1895年）：台湾・遼東半島を獲得</div>';
  html+='<div class="ex">日露戦争（1904年）→ ポーツマス条約（1905年）：南満州鉄道・樺太南部を獲得</div>';
  html+='<div class="note">💡 「清＝中国、露＝ロシア」で戦争相手をセットで覚えよう！</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">大正〜昭和（1912〜1945年）</div>';
  html+='<div class="ex">大正デモクラシー：民主主義・自由主義の高まり</div>';
  html+='<div class="ex">普通選挙法（1925年）：25歳以上の男子に選挙権（女性は1945年〜）</div>';
  html+='<div class="ex">満州事変（1931年）→ 日中戦争（1937年）→ 太平洋戦争（1941〜45年）</div>';
  html+='<div class="ex">太平洋戦争：1941年真珠湾攻撃で開戦 → 1945年8月15日終戦（玉音放送）</div>';
  html+='<div class="note">💡 「行くよご（1945）！終戦」で8月15日を覚えよう！</div>';
  html+='</div>';
  html+='<div class="rule-box">';
  html+='<div class="rule-title">戦後〜現代（1945年〜）</div>';
  html+='<div class="ex">GHQ占領下の改革：農地改革・財閥解体・女性参政権（1945年）</div>';
  html+='<div class="ex">日本国憲法：公布1946年11月3日 → 施行1947年5月3日（三原則：主権在民・基本的人権・平和主義）</div>';
  html+='<div class="ex">サンフランシスコ平和条約（1951年）：主権回復 / 日米安保条約も同時締結</div>';
  html+='<div class="note">💡 「憲法の三原則」は試験最頻出！</div>';
  html+='</div>';
  html+='</div>';

  html+='<div style="font-size:13px;color:var(--text2);margin:16px 0 12px;letter-spacing:.08em">✏️ 練習問題 — 全15問（選択肢から選ぼう）</div>';

  var qs=[
    { qid:'soc_hist_s4_q0',
      jp:'1868年の明治維新で掲げられた、軍事力と産業の強化を表す2つのスローガンは？',
      answer:'富国強兵・殖産興業', choices:['富国強兵・殖産興業','廃藩置県・学制','文明開化・脱亜入欧','刀狩・太閤検地'],
      exp:'📌 <b>富国強兵</b>（軍事力強化）・<b>殖産興業</b>（産業育成）：明治政府が近代化を進める基本方針。<br>✅ 富国強兵・殖産興業<br>💡 「富む（ふこく）＝強兵、植える（しょくさん）＝興業」' },
    { qid:'soc_hist_s4_q1',
      jp:'明治初期の3大改革「廃藩置県・学制・○○令」。○○に入る言葉は？',
      answer:'徴兵', choices:['徴兵','参勤交代','刀狩','版籍奉還'],
      exp:'📌 明治初期の3大改革：<b>廃藩置県</b>（1871年）・<b>学制</b>（1872年）・<b>徴兵令</b>（1873年）<br>✅ 徴兵<br>💡 「廃学徴（はいがくちょう）」で3つをセット暗記！' },
    { qid:'soc_hist_s4_q2',
      jp:'大日本帝国憲法（1889年）を作成した中心人物は？',
      answer:'伊藤博文', choices:['伊藤博文','大久保利通','西郷隆盛','坂本龍馬'],
      exp:'📌 <b>伊藤博文</b>：ドイツ（プロイセン）の憲法を参考に大日本帝国憲法を起草。初代内閣総理大臣でもある。<br>✅ 伊藤博文<br>💡 「一発（18）はっくう（89）伊藤博文」' },
    { qid:'soc_hist_s4_q3',
      jp:'1894年に始まった日清戦争の講和条約は何か？また何年に結ばれたか？',
      answer:'下関条約・1895年', choices:['下関条約・1895年','ポーツマス条約・1905年','サンフランシスコ条約・1951年','日米和親条約・1854年'],
      exp:'📌 日清戦争（1894〜95年）→ <b>下関条約</b>（1895年）：台湾・遼東半島を獲得、清から賠償金<br>✅ 下関条約・1895年<br>💡 「清→下関、露→ポーツマス」の対応を覚えよう！' },
    { qid:'soc_hist_s4_q4',
      jp:'1904年に始まった日露戦争の講和条約は何か？',
      answer:'ポーツマス条約', choices:['ポーツマス条約','下関条約','サンフランシスコ条約','日英同盟'],
      exp:'📌 日露戦争（1904〜05年）→ <b>ポーツマス条約</b>（1905年）：南満州鉄道の権益・樺太南部を獲得<br>アメリカのルーズベルト大統領が仲介。<br>✅ ポーツマス条約' },
    { qid:'soc_hist_s4_q5',
      jp:'1925年に制定された、25歳以上の男子すべてに選挙権を認めた法律は？',
      answer:'普通選挙法', choices:['普通選挙法','治安維持法','大日本帝国憲法','日本国憲法'],
      exp:'📌 <b>普通選挙法</b>（1925年）：納税額に関係なく25歳以上の男子に選挙権。女性の選挙権は1945年。<br>✅ 普通選挙法<br>💡 「行くぞ（192）5普通選挙→1925年」' },
    { qid:'soc_hist_s4_q6',
      jp:'1931年、日本の関東軍が南満州鉄道を爆破し、満州を占領したきっかけとなった事件は？',
      answer:'満州事変', choices:['満州事変','日中戦争','太平洋戦争','盧溝橋事件'],
      exp:'📌 <b>満州事変</b>（1931年）：関東軍が南満州鉄道を自ら爆破し、これを中国のせいにして満州を占領した。<br>翌年、満州国を建国。<br>✅ 満州事変' },
    { qid:'soc_hist_s4_q7',
      jp:'1941年12月8日、日本がアメリカの軍港を奇襲攻撃して太平洋戦争が始まった場所は？',
      answer:'真珠湾', choices:['真珠湾','ミッドウェー','広島','沖縄'],
      exp:'📌 <b>真珠湾</b>（パールハーバー、ハワイ）：1941年12月8日に日本海軍が奇襲攻撃 → 太平洋戦争開始。<br>✅ 真珠湾<br>💡 「行くよ一（1941）度！真珠湾」' },
    { qid:'soc_hist_s4_q8',
      jp:'太平洋戦争が終結した年月日は？',
      answer:'1945年8月15日', choices:['1945年8月15日','1945年9月2日','1944年6月6日','1941年12月8日'],
      exp:'📌 <b>1945年8月15日</b>：昭和天皇が「玉音放送」で終戦を告知。広島（8月6日）・長崎（8月9日）への原爆投下、ソ連参戦を受けてのポツダム宣言受諾。<br>✅ 1945年8月15日' },
    { qid:'soc_hist_s4_q9',
      jp:'日本国憲法の三大原則を3つ選べ。',
      answer:'主権在民・基本的人権の尊重・平和主義', choices:['主権在民・基本的人権の尊重・平和主義','天皇主権・国防義務・経済発展','民主主義・資本主義・自由主義','廃藩置県・学制・徴兵令'],
      exp:'📌 日本国憲法の三大原則：<b>主権在民</b>（国民が主役）・<b>基本的人権の尊重</b>・<b>平和主義</b>（戦争放棄）<br>✅ 主権在民・基本的人権の尊重・平和主義' },
    { qid:'soc_hist_s4_q10',
      jp:'日本国憲法が公布された年月日は？',
      answer:'1946年11月3日', choices:['1946年11月3日','1947年5月3日','1945年8月15日','1889年2月11日'],
      exp:'📌 日本国憲法：公布<b>1946年11月3日</b>（文化の日）→ 施行<b>1947年5月3日</b>（憲法記念日）<br>✅ 1946年11月3日<br>💡 「公布は11月3日（文化の日）、施行は5月3日（憲法記念日）」' },
    { qid:'soc_hist_s4_q11',
      jp:'明治時代に韓国（朝鮮）を植民地として支配下に置いた出来事を何というか？（1910年）',
      answer:'韓国併合', choices:['韓国併合','日清戦争','日露戦争','下関条約'],
      exp:'📌 <b>韓国併合</b>（1910年）：日本が大韓帝国を完全に植民地化。「一句（1910）ひとつ韓国併合」で覚えよう。<br>✅ 韓国併合' },
    { qid:'soc_hist_s4_q12',
      jp:'1951年、日本が主権を回復した際に結んだ条約は何か？',
      answer:'サンフランシスコ平和条約', choices:['サンフランシスコ平和条約','ポーツマス条約','下関条約','日米和親条約'],
      exp:'📌 <b>サンフランシスコ平和条約</b>（1951年）：48か国と締結し、GHQ占領が終わり日本が主権回復。同時に日米安全保障条約も締結。<br>✅ サンフランシスコ平和条約' },
    { qid:'soc_hist_s4_q13',
      jp:'大日本帝国憲法の下での主権は誰にあったか？',
      answer:'天皇', choices:['天皇','国民','内閣','議会'],
      exp:'📌 <b>大日本帝国憲法</b>（1889年）：主権は<b>天皇</b>にある（天皇主権）。<br>⇔ <b>日本国憲法</b>（1946年）：主権は<b>国民</b>にある（主権在民）<br>✅ 天皇' },
    { qid:'soc_hist_s4_q14',
      jp:'太平洋戦争末期、1945年8月6日と9日に原子爆弾が投下された2つの都市は？',
      answer:'広島・長崎', choices:['広島・長崎','東京・大阪','沖縄・京都','横浜・名古屋'],
      exp:'📌 <b>広島</b>（8月6日）と<b>長崎</b>（8月9日）に原子爆弾が投下された。その後ソ連参戦・ポツダム宣言受諾 → 8月15日終戦。<br>✅ 広島・長崎' },
  ];

  qs.forEach(function(q){ html+=makeChoices(q.qid,q.jp,q.answer,q.choices,q.exp); });
  return html;
}

// ===== SECTION 5: 確認テスト =====
function renderSection5(){
  var html='';

  html+='<div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">'
    +'<div style="font-size:13px;color:var(--amber);font-weight:bold;margin-bottom:6px">📝 確認テスト — 歴史 まとめ</div>'
    +'<div style="font-size:13px;color:var(--text2);line-height:2.0">Section 1〜4 の全範囲から15問。確認してみよう！</div>'
    +'</div>';

  var qs=[
    { qid:'soc_hist_s5_q0', jp:'縄文時代と弥生時代を区別する最大の違いは何か？',
      answer:'稲作の有無', choices:['稲作の有無','土器の色','言語の違い','人口の差'],
      exp:'📌 弥生時代の最大の特徴＝稲作の開始（大陸から伝来）<br>✅ 稲作の有無' },
    { qid:'soc_hist_s5_q1', jp:'「魏志倭人伝」に記録された邪馬台国の女王は？',
      answer:'卑弥呼', choices:['卑弥呼','神功皇后','持統天皇','推古天皇'],
      exp:'📌 卑弥呼：3世紀の邪馬台国の女王。呪術で国を治めた。<br>✅ 卑弥呼' },
    { qid:'soc_hist_s5_q2', jp:'大化の改新（645年）を行った中心人物の組み合わせは？',
      answer:'中大兄皇子・藤原鎌足', choices:['中大兄皇子・藤原鎌足','聖徳太子・蘇我馬子','聖武天皇・行基','桓武天皇・坂上田村麻呂'],
      exp:'📌 中大兄皇子（のちの天智天皇）＋藤原鎌足 → 蘇我氏を打倒<br>✅ 中大兄皇子・藤原鎌足' },
    { qid:'soc_hist_s5_q3', jp:'奈良時代に聖武天皇が建てた大仏がある寺院は？',
      answer:'東大寺', choices:['東大寺','法隆寺','薬師寺','興福寺'],
      exp:'📌 東大寺（奈良）：聖武天皇が仏教の力で国を守ろうと建立（743年）<br>✅ 東大寺' },
    { qid:'soc_hist_s5_q4', jp:'「源氏物語」を書いた平安時代の女性作家は？',
      answer:'紫式部', choices:['紫式部','清少納言','与謝野晶子','小野小町'],
      exp:'📌 紫式部＝源氏物語　清少納言＝枕草子（随筆）<br>✅ 紫式部' },
    { qid:'soc_hist_s5_q5', jp:'元軍が2度日本に攻めてきた際（元寇）、鎌倉幕府の執権として対応したのは？',
      answer:'北条時宗', choices:['北条時宗','北条政子','源頼朝','足利尊氏'],
      exp:'📌 北条時宗（8代執権）：2度の元寇を撃退。神風（暴風雨）も助けになった。<br>✅ 北条時宗' },
    { qid:'soc_hist_s5_q6', jp:'室町時代に3代将軍・足利義満が京都の北山に建てたのは？',
      answer:'金閣', choices:['金閣','銀閣','東大寺','法隆寺'],
      exp:'📌 金閣（鹿苑寺金閣）＝足利義満（3代）　銀閣（慈照寺銀閣）＝足利義政（8代）<br>✅ 金閣' },
    { qid:'soc_hist_s5_q7', jp:'鉄砲が日本に伝わった年（1543年）と場所は？',
      answer:'1543年・種子島', choices:['1543年・種子島','1549年・長崎','1600年・大阪','1615年・江戸'],
      exp:'📌 1543年、ポルトガル人が種子島に漂着し鉄砲（火縄銃）を伝える<br>✅ 1543年・種子島' },
    { qid:'soc_hist_s5_q8', jp:'豊臣秀吉が行った、田畑の広さ・収穫高を調査した政策は？',
      answer:'太閤検地', choices:['太閤検地','刀狩','楽市楽座','参勤交代'],
      exp:'📌 太閤検地（1582年〜）：土地の広さ・等級・予想収穫高を測定 → 年貢の基準を統一<br>✅ 太閤検地' },
    { qid:'soc_hist_s5_q9', jp:'江戸幕府が鎖国中に唯一貿易を許したヨーロッパの国は？',
      answer:'オランダ', choices:['オランダ','スペイン','ポルトガル','イギリス'],
      exp:'📌 鎖国（17世紀）：長崎の出島でオランダ（とキリスト教を布教しない中国）のみ貿易を許可<br>✅ オランダ' },
    { qid:'soc_hist_s5_q10', jp:'江戸幕府を開いた徳川家康が関ヶ原で破った敵の中心人物は？',
      answer:'石田三成', choices:['石田三成','豊臣秀頼','明智光秀','上杉謙信'],
      exp:'📌 関ヶ原の戦い（1600年）：東軍（家康）vs 西軍（石田三成）→ 家康の勝利<br>✅ 石田三成' },
    { qid:'soc_hist_s5_q11', jp:'平安京（794年）に都を移した天皇は？',
      answer:'桓武天皇', choices:['桓武天皇','聖武天皇','天武天皇','後醍醐天皇'],
      exp:'📌 桓武天皇：784年に長岡京→794年に平安京（京都）に遷都<br>✅ 桓武天皇　「なくよ（794）うぐいす平安京」' },
    { qid:'soc_hist_s5_q12', jp:'鎌倉時代に武士と主君が土地を通じて結んだ主従関係を何というか？',
      answer:'御恩と奉公', choices:['御恩と奉公','刀狩と検地','参勤と交代','律令と班田'],
      exp:'📌 御恩：将軍が土地を与え保護　奉公：御家人が戦で奉仕 → 封建制度の基本<br>✅ 御恩と奉公' },
    { qid:'soc_hist_s5_q13', jp:'ペリー来航（1853年）後に結ばれた条約で、下田・函館を開港したのは？',
      answer:'日米和親条約', choices:['日米和親条約','日米修好通商条約','下関条約','ポーツマス条約'],
      exp:'📌 日米和親条約（1854年）：下田・函館を開港、鎖国の終わり<br>✅ 日米和親条約' },
    { qid:'soc_hist_s5_q14', jp:'応仁の乱が始まった年と、それが起きた時代は？',
      answer:'1467年・室町時代', choices:['1467年・室町時代','1600年・江戸時代','1281年・鎌倉時代','1338年・南北朝時代'],
      exp:'📌 応仁の乱（1467〜77年）：将軍家の跡継ぎ争いで室町幕府が弱体化 → 戦国時代へ<br>✅ 1467年・室町時代' },
  ];

  var shuffled=shuffleArray(qs); var idx=0;
  shuffled.forEach(function(q){ q._qid='soc_hist_s5_q'+idx; idx++; });
  shuffled.forEach(function(q){ html+=makeChoices(q._qid,q.jp,q.answer,q.choices,q.exp); });
  return html;
}

// ===== SECTION 6: 3年予習 =====
function renderSection6(){
  return '<div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:24px;margin-top:16px">'
    +'<div style="font-size:13px;color:var(--amber);font-weight:bold;margin-bottom:12px">🔗 江戸時代末→近現代（中3の予習）</div>'
    +'<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    +'大政奉還（1867年）→ <span style="color:var(--gold)">明治維新・文明開化（1868年〜）</span><br>'
    +'富国強兵・殖産興業 → <span style="color:var(--gold)">日清戦争（1894）・日露戦争（1904）</span><br>'
    +'大正デモクラシー → <span style="color:var(--gold)">普通選挙法（1925）・労働運動</span><br>'
    +'第一次〜第二次世界大戦 → <span style="color:var(--gold)">日本国憲法（1946年公布）</span>'
    +'</div></div>'
    +'<div style="background:rgba(245,197,24,0.06);border:1px solid rgba(245,197,24,0.2);border-radius:12px;padding:20px;margin-top:16px">'
    +'<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px">⚡ 試験で狙われる近現代（先取り）</div>'
    +'<div style="font-size:14px;line-height:2.4;color:var(--text2)">'
    +'明治維新の3つの改革：廃藩置県・学制・徴兵令<br>'
    +'日清戦争の講和条約：下関条約（1895年）<br>'
    +'日露戦争の講和条約：ポーツマス条約（1905年）<br>'
    +'太平洋戦争の終戦：1945年8月15日'
    +'</div></div>';
}

// ===== FINAL RESULT =====
function showFinalResult(){
  var prefix='soc_hist_s5_';
  var total=Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix)===0; }).length;
  var correct=Object.keys(answeredSet).filter(function(id){ return id.indexOf(prefix)===0&&answeredSet[id]; }).length;
  if(total===0) total=15;
  var pct=total>0?Math.round(correct/total*100):0;
  var emoji=pct>=90?'🏆':pct>=70?'😎':pct>=50?'😄':'🐣';
  var msg=pct>=90
    ?'きょん「全部解けた！！俺、歴史マスターじゃん！！」<br>西村「よくやった。次は近現代に挑もう」'
    :pct>=70
    ?'きょん「かなりできた！もう少しで完璧！！」<br>西村「惜しい。年代の確認をしたら完璧になるよ」'
    :'きょん「難しかった！！でも諦めない！！」<br>西村「焦らなくていい。Section 1からもう一度復習しよう」';
  var html='<div class="result-box">'
    +'<div class="result-title">🌏 確認テスト 結果</div>'
    +'<div class="result-emoji">'+emoji+'</div>'
    +'<div class="result-score">'+correct+'<span> / '+total+'問正解</span></div>'
    +'<div style="font-size:28px;color:var(--gold);font-weight:bold;margin-bottom:8px">'+pct+'%</div>'
    +'<div class="result-msg">'+msg+'</div>'
    +'<div style="margin-top:24px">'
    +'<button class="result-btn" onclick="closeResult()">📖 見直しをする</button>'
    +'<button class="result-btn" onclick="goSection(1)" style="background:var(--amber);color:#000">🔄 Section 1 からやり直す</button>'
    +'</div></div>';
  document.getElementById('resultOverlay').innerHTML=html;
  document.getElementById('resultOverlay').style.display='block';
}
function closeResult(){ document.getElementById('resultOverlay').style.display='none'; }

// ===== 弱点ノート =====
function renderWeakNote(){
  currentSection=6; renderTabs();
  var mc=document.getElementById('mainContent');
  var wqs=getWeakQuestions();
  var allQids=Object.keys(weakDB).filter(function(id){ return id.indexOf('soc_hist_')===0; });
  if(allQids.length===0){
    mc.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">📊</div><div style="font-size:18px;margin-bottom:8px">まだデータがありません</div><div style="font-size:14px">問題を解くと自動で記録されます</div></div>';
    return;
  }
  var sorted=allQids.slice().sort(function(a,b){ return getPct(a)-getPct(b); });
  var html='<div style="margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap">'
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--gold)">'+allQids.length+'</div><div style="font-size:11px;color:var(--text2)">記録済み問題</div></div>'
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--red)">'+wqs.length+'</div><div style="font-size:11px;color:var(--text2)">要特訓（80%未満）</div></div>'
    +'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center"><div style="font-size:28px;font-family:Bebas Neue,sans-serif;color:var(--green)">'+(allQids.length-wqs.length)+'</div><div style="font-size:11px;color:var(--text2)">習得済み（80%以上）</div></div>'
    +'</div>';
  sorted.forEach(function(qid){
    var d=weakDB[qid]; var pct=getPct(qid);
    var barColor=pct<30?'var(--red)':pct<60?'var(--gold)':'var(--green)';
    html+='<div style="background:var(--bg2);border:1px solid '+barColor+';border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      +'<div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.08);border:2px solid '+barColor+';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:'+barColor+'">'+pct+'%</span></div>'
      +'<div style="flex:1;min-width:0"><div style="font-size:15px;color:var(--text);margin-bottom:2px;line-height:1.6">'+(d.jp||'')+'</div><div style="font-size:20px;color:'+barColor+';font-family:Bebas Neue,sans-serif">'+(d.answer||'')+'</div></div>'
      +'<div style="text-align:right;flex-shrink:0"><div style="font-size:11px;color:var(--text2)">'+d.correct+'/'+d.total+'回正解</div><div style="width:80px;height:5px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+barColor+';border-radius:3px"></div></div></div>'
      +'</div>';
  });
  if(wqs.length>0){
    html+='<button onclick="goSection(6)" style="width:100%;margin-top:16px;background:linear-gradient(135deg,var(--red),#c73652);color:#fff;border:none;padding:16px;border-radius:12px;font-size:17px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 弱点を特訓する（'+wqs.length+'問）</button>';
  }
  mc.innerHTML=html;
}

// ===== 特訓モード =====
var tokkuQueue=[]; var tokkuIndex=0; var tokkuSession={correct:0,total:0}; var tokkuBannerShown=false;

function showTokkuSuggestion(qid){
  if(document.getElementById('tokkuSuggestBanner')) return;
  var card=document.querySelector('[data-card="'+qid+'"]'); if(!card) return;
  var banner=document.createElement('div'); banner.id='tokkuSuggestBanner';
  banner.innerHTML='<div style="margin:16px 0;padding:14px 18px;background:linear-gradient(135deg,rgba(233,69,96,0.1),rgba(233,69,96,0.05));border:1px solid var(--red);border-left:4px solid var(--red);border-radius:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    +'<div style="font-size:28px">🔥</div>'
    +'<div style="flex:1"><div style="font-size:13px;font-weight:bold;color:var(--red);margin-bottom:2px">間違えた問題は特訓モードで克服！</div><div style="font-size:12px;color:var(--text2)">正答率80%で卒業！</div></div>'
    +'<button onclick="goSection(6)" style="background:var(--red);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-family:inherit;font-weight:bold;cursor:pointer;flex-shrink:0">🔥 特訓へ →</button>'
    +'</div>';
  card.parentNode.insertBefore(banner,card.nextSibling);
}
function renderTokkuMode(){
  currentSection=7; renderTabs();
  var wqs=getWeakQuestions(); var mc=document.getElementById('mainContent');
  if(wqs.length===0){
    mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div class="tokku-complete-msg">すべて正答率80%以上！<br>きょん「俺、歴史マスターじゃん！！」<br>西村「本当に成長したね」</div><button onclick="goSection(1)" style="margin-top:24px;background:var(--amber);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">Section 1 へ →</button></div>';
    return;
  }
  tokkuQueue=wqs.slice(0,15); tokkuIndex=0; tokkuSession={correct:0,total:0};
  renderTokkuCard();
}
function renderTokkuCard(){
  var mc=document.getElementById('mainContent');
  if(tokkuIndex>=tokkuQueue.length){ showTokkuComplete(); return; }
  var qid=tokkuQueue[tokkuIndex]; var d=weakDB[qid];
  if(!d){ tokkuIndex++; renderTokkuCard(); return; }
  var pct=getPct(qid); var color=pct<30?'var(--red)':pct<60?'var(--gold)':'var(--green)';
  var answerArea='<div class="tokku-choices">'
    +d.choices.slice().sort(function(){ return Math.random()-0.5; }).map(function(c){
        return '<button class="choice-btn" data-tqid="'+qid+'" data-tchoice="'+c+'">'+c+'</button>';
      }).join('')
    +'</div>';
  mc.innerHTML='<div class="tokku-progress">🔥 特訓 '+(tokkuIndex+1)+' / '+tokkuQueue.length+'　今回: '+tokkuSession.correct+'/'+tokkuSession.total+'正解</div>'
    +'<div class="tokku-card">'
    +'<div class="tokku-stat">正答率: <span class="pct" style="color:'+color+'">'+pct+'%</span>（'+d.correct+'/'+d.total+'回正解）</div>'
    +'<div class="tokku-jp">'+(d.jp||qid)+'</div>'
    +answerArea
    +'<div class="tokku-result" id="tokku_result"></div>'
    +'<button id="tokku_next" onclick="nextTokkuCard()" style="display:none;margin-top:14px;background:var(--amber);color:#000;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題 →</button>'
    +'</div>';
  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(btn){
    btn.addEventListener('click',function(){ handleTokkuAnswer(btn.dataset.tqid,btn.dataset.tchoice); });
  });
}
function handleTokkuAnswer(qid,value){
  var d=weakDB[qid]; if(!d) return;
  var correct=value===d.answer;
  tokkuSession.total++; weakDB[qid].total++;
  if(correct){ weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('soc_weakdb',JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();
  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b){ b.disabled=true; });
  var chosen=document.querySelector('.choice-btn[data-tqid="'+qid+'"][data-tchoice="'+value+'"]');
  if(chosen) chosen.classList.add(correct?'selected-correct':'selected-wrong');
  if(!correct){ var ok=document.querySelector('.choice-btn[data-tqid="'+qid+'"][data-tchoice="'+d.answer+'"]'); if(ok) ok.classList.add('show-correct'); }
  var newPct=getPct(qid);
  var res=document.getElementById('tokku_result');
  if(res){
    if(correct){
      xp++; localStorage.setItem('soc_xp',xp); updateXP();
      res.className='tokku-result tokku-correct';
      res.innerHTML='✅ 正解！'+(newPct>=80?' 🎉 正答率'+newPct+'%！この問題は卒業！':' 正答率 → '+newPct+'%');
      showToast(getComment('kyon_correct'));
    } else {
      deductXP(3);
      res.className='tokku-result tokku-wrong';
      res.innerHTML='❌ 間違い！ 正答率 → '+newPct+'%<div class="tokku-answer">正解：'+d.answer+'</div>';
      showToast('きょん「また間違えた！！解説をしっかり読もう！！」');
    }
    res.style.display='block';
  }
  document.getElementById('tokku_next').style.display='block';
}
function nextTokkuCard(){ tokkuIndex++; renderTokkuCard(); }
function showTokkuComplete(){
  var mc=document.getElementById('mainContent');
  var pctAll=tokkuSession.total>0?Math.round(tokkuSession.correct/tokkuSession.total*100):0;
  var emoji=pctAll>=80?'🏆':pctAll>=60?'😎':'💪';
  var msg=pctAll>=80
    ?'きょん「全部解けた！！昇格の予感！！」<br>西村「よくやった。次回も頼む」'
    :'きょん「難しかった…でも諦めない！！」<br>西村「繰り返すことが力になる」';
  mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">'+emoji+'</div><div class="tokku-complete-title">特訓終了！</div><div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">'+pctAll+'%</div><div style="font-size:14px;color:var(--text2)">'+tokkuSession.correct+' / '+tokkuSession.total+'問正解</div><div class="tokku-complete-msg" style="margin-top:16px">'+msg+'</div><div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button onclick="renderTokkuMode()" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回特訓！</button><button onclick="goSection(1)" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">Section 1 へ戻る</button></div></div>';
  renderWeakBar();
}

// ===== INIT =====
updateXP(); renderWeakBar(); renderTabs(); goSection(0);
