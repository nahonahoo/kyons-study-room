// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:20,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「比例？なにそれ食えるの？」' },
  { lv:2, min:20,  max:50,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:50,  max:100, badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺比例できるかも」' },
  { lv:4, min:100, max:170, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:170, max:260, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:260, max:370, badge:'🌟 冠番組',       title:'部長',           status:'きょん「比例で漫才できるかもしれない」' },
  { lv:7, min:370, max:500, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:500, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('math_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('math_prop_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('math_prop_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('math_weakdb') || '{}');
var attemptCounts = {};

function updateXP(){
  var lv=getLevel(xp);
  var pct=lv.lv<LEVELS.length?Math.round((xp-lv.min)/(lv.max-lv.min)*100):100;
  document.getElementById('xpBadge').textContent  = lv.badge;
  document.getElementById('xpLevel').textContent  = 'Lv.'+lv.lv+' '+lv.badge.split(' ')[0];
  document.getElementById('xpTitle').textContent  = lv.title;
  document.getElementById('xpStatus').textContent = lv.status;
  document.getElementById('xpNext').textContent   = lv.lv<LEVELS.length?xp+' XP ／ 次まで '+(lv.max-xp)+' XP':'🏆 最高ランク達成！（'+xp+' XP）';
  document.getElementById('xpFill').style.width   = Math.min(100,pct)+'%';
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
}
function addXP(pts,qid){
  if(answeredSet[qid]) return false;
  var old=getLevel(xp).lv; xp+=pts; answeredSet[qid]=true;
  localStorage.setItem('math_xp',xp);
  localStorage.setItem('math_prop_answered',JSON.stringify(answeredSet));
  updateXP(); return getLevel(xp).lv>old;
}
function deductXP(pts){
  var old=getLevel(xp).lv;
  xp=Math.max(0,xp-pts);
  localStorage.setItem('math_xp',xp); updateXP(); return getLevel(xp).lv<old;
}

// ===== WEAK DB =====
function getPct(qid){ var d=weakDB[qid]; if(!d||d.total===0) return 0; return Math.round(d.correct/d.total*100); }
function getWeakQuestions(){ return Object.keys(weakDB).filter(function(id){ return id.indexOf('math_prop_')===0 && getPct(id)<80; }); }
function renderWeakBar(){
  var wqs=getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,8);
  var el=document.getElementById('weakItems'); if(!el) return;
  if(wqs.length===0){ el.innerHTML='<span class="weak-bar-empty">弱点なし！</span>'; return; }
  el.innerHTML=wqs.map(function(qid){ var d=weakDB[qid]; return '<div class="weak-item"><span class="weak-item-word">'+(d.jp||qid)+'</span><span class="weak-item-pct">'+getPct(qid)+'%</span></div>'; }).join('');
}
function recordResult(qid,isCorrect){
  if(!weakDB[qid]) weakDB[qid]={ jp:(qMeta[qid]&&qMeta[qid].jp)||'', answer:(qMeta[qid]&&qMeta[qid].answer)||'', choices:(qMeta[qid]&&qMeta[qid].choices)||[], correct:0, total:0 };
  weakDB[qid].total++; if(isCorrect) weakDB[qid].correct++;
  localStorage.setItem('math_weakdb',JSON.stringify(weakDB));
  var _t=new Date().toISOString().slice(0,10);
  var _d=JSON.parse(localStorage.getItem('math_daily')||'{}');
  _d[_t]=(_d[_t]||0)+1; localStorage.setItem('math_daily',JSON.stringify(_d));
  renderWeakBar(); renderTabs();
}

// ===== HELPERS =====
var speechEnabled=(typeof window!=='undefined'&&'speechSynthesis' in window);
function speak(t){ if(!speechEnabled) return; try{ window.speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(t); u.lang='ja-JP'; u.rate=1.1; window.speechSynthesis.speak(u); }catch(e){} }
function showToast(msg,type){
  var t=document.getElementById('toast'); t.textContent=msg;
  t.className='toast'+(type==='levelup'?' levelup':type==='demote'?' demote':'');
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); },type==='levelup'?4000:type==='demote'?3500:2500);
}
var COMMENTS={
  kyon_correct:['きょん「合ってる！！天才かも！！」','きょん「やった！！比例余裕！！」','きょん「にっくん見て！解けた！！」','きょん「俺すごくない！？！？」'],
  nishi_correct:['西村「正解。よく理解できてる」','西村「できてる。その調子」','西村「ちゃんとわかってる」','西村「正確に答えられてる」'],
};
function getComment(type){ var a=COMMENTS[type]; return a[Math.floor(Math.random()*a.length)]; }
function shuffleArray(arr){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
function toggleHint(qid){ var h=document.getElementById('hint_'+qid); if(h) h.style.display=h.style.display==='block'?'none':'block'; }
function mathMatch(input, answer){
  var ni=input.trim().replace(/\s+/g,'').toLowerCase();
  var na=answer.trim().replace(/\s+/g,'').toLowerCase();
  if(ni===na) return true;
  var parseNum=function(s){ return parseFloat(s.replace(/[^\d.\-\/]/g,'')); };
  var n1=parseNum(ni), n2=parseNum(na);
  if(!isNaN(n1)&&!isNaN(n2)&&Math.abs(n1-n2)<0.001) return true;
  return false;
}

// ===== QUESTION ENGINE =====
var qMeta={};

function makeChoices(qid,jp,answer,choices,exp){
  choices=shuffleArray(choices);
  qMeta[qid]={ type:'choice', answer:answer, xp:4, jp:jp, choices:choices };
  var done=answeredSet[qid];
  return '<div class="q-card" data-card="'+qid+'">'
    +'<div class="q-text">'+jp+'</div>'
    +'<div class="choices">'+choices.map(function(c){
        if(done) return '<button class="choice-btn '+(c===answer?'show-correct':'')+'" disabled>'+c+'</button>';
        return '<button class="choice-btn" data-qid="'+qid+'" data-choice="'+c+'">'+c+'</button>';
      }).join('')+'</div>'
    +'<div class="q-feedback correct-fb" id="fb_'+qid+'"  style="'+(done?'display:block':'display:none')+'">✓ 正解！</div>'
    +'<div class="q-feedback wrong-fb"   id="fbw_'+qid+'" style="display:none">✗ もう一度！</div>'
    +'<div class="exp-card" id="exp_card_'+qid+'" style="'+(done?'display:block':'display:none')+'">'
    +'<div class="exp-card-title">📐 解説</div><div style="color:var(--text);font-size:13px;line-height:2.1">'+exp+'</div></div>'
    +'<button class="show-answer-btn" id="sab_'+qid+'" data-qid="'+qid+'">💡 答えを見る（XPなし）</button>'
    +'<div class="answer-revealed" id="ar_'+qid+'"><div class="ans-label">✅ 正解</div><div id="ar_ans_'+qid+'" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    +'<div class="artist-comment" id="ac_'+qid+'" style="'+(done?'display:block':'display:none')+'">'+(done?getComment('nishi_correct'):'')+'</div>'
    +'</div>';
}

function makeInputCard(qid,jp,formula,answer,xpPts,hint,expText){
  qMeta[qid]={ type:'input', answer:answer, xp:xpPts, jp:jp };
  var done=answeredSet[qid];
  var hintHtml=hint?'<button class="hint-btn" data-hqid="'+qid+'">💡 ヒント</button><div class="hint-box" id="hint_'+qid+'">'+hint+'</div>':'';
  var inputHtml=done
    ?'<div class="input-wrap"><input class="q-input" disabled value="'+answer+'" style="border-color:var(--green);color:var(--green)"><span style="margin-left:4px;color:var(--green)">✓</span></div>'
    :'<div class="input-wrap"><input class="q-input" id="inp_'+qid+'" type="text" placeholder="答え"><button class="input-submit" data-qid="'+qid+'">確認</button></div>';
  return '<div class="q-card" data-card="'+qid+'" id="qcard_'+qid+'">'
    +'<div class="q-text">'+jp+'</div>'
    +(formula?'<div class="q-formula">'+formula+'</div>':'')
    +hintHtml+inputHtml
    +'<div class="q-feedback correct-fb" id="fb_'+qid+'"  style="'+(done?'display:block':'display:none')+'">✓ 正解！</div>'
    +'<div class="q-feedback wrong-fb"   id="fbw_'+qid+'" style="display:none">✗ もう一度！</div>'
    +'<div class="exp-card" id="exp_'+qid+'" style="'+(done?'display:block':'display:none')+'">'
    +'<div class="exp-card-title">📐 解説</div><div style="color:var(--text);font-size:13px;line-height:2.2">'+expText+'</div></div>'
    +'<button class="show-answer-btn" id="sab_'+qid+'" data-qid="'+qid+'">💡 答えを見る（XPなし）</button>'
    +'<div class="answer-revealed" id="ar_'+qid+'"><div class="ans-label">✅ 正解</div><div id="ar_ans_'+qid+'" style="font-size:20px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    +'<div class="artist-comment" id="ac_'+qid+'" style="'+(done?'display:block':'display:none')+'">'+(done?getComment('nishi_correct'):'')+'</div>'
    +'</div>';
}

function handleChoice(qid,choice){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid]) return;
  if(choice===meta.answer) markCorrect(qid,meta); else markWrong(qid,meta,choice);
}
function handleInput(qid){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid]) return;
  var inp=document.getElementById('inp_'+qid); if(!inp) return;
  var val=inp.value.trim(); if(!val){ showToast('答えを入力してください！'); return; }
  if(mathMatch(val,meta.answer)){ inp.style.borderColor='var(--green)'; markCorrect(qid,meta); }
  else { inp.style.borderColor='var(--red)'; markWrong(qid,meta,val); inp.select(); }
}
function markCorrect(qid,meta){
  speak('正解！'); recordResult(qid,true);
  var lvUp=addXP(meta.xp||4,qid);
  var card=document.querySelector('[data-card="'+qid+'"]'); if(card) card.classList.add('correct-card');
  var fb=document.getElementById('fb_'+qid); if(fb) fb.style.display='block';
  var fbw=document.getElementById('fbw_'+qid); if(fbw) fbw.style.display='none';
  var ac=document.getElementById('ac_'+qid); if(ac){ ac.textContent=getComment('nishi_correct'); ac.style.display='block'; }
  document.querySelectorAll('.choice-btn[data-qid="'+qid+'"]').forEach(function(b){ b.disabled=true; if(b.dataset.choice===meta.answer) b.classList.add('selected-correct'); });
  var inp=document.getElementById('inp_'+qid); if(inp){ inp.disabled=true; inp.style.borderColor='var(--green)'; var sb=document.querySelector('.input-submit[data-qid="'+qid+'"]'); if(sb) sb.style.display='none'; }
  var expEl=document.getElementById('exp_card_'+qid)||document.getElementById('exp_'+qid); if(expEl) expEl.style.display='block';
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
  else { var msgs=['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！まだまだ大丈夫！！」','きょん「ルールをもう一度確認！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1,attemptCounts[qid]-1)]); },100); }
  if(!tokkuBannerShown){ tokkuBannerShown=true; setTimeout(function(){ showTokkuSuggestion(qid); },500); }
}
function showAnswer(qid){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid]) return;
  answeredSet[qid]=true; localStorage.setItem('math_prop_answered',JSON.stringify(answeredSet));
  var arAns=document.getElementById('ar_ans_'+qid); if(arAns) arAns.textContent=meta.answer;
  var ar=document.getElementById('ar_'+qid); if(ar) ar.style.display='block';
  var sab=document.getElementById('sab_'+qid); if(sab) sab.style.display='none';
  document.querySelectorAll('.choice-btn[data-qid="'+qid+'"]').forEach(function(b){ b.disabled=true; if(b.dataset.choice===meta.answer) b.classList.add('show-correct'); });
  var fbw=document.getElementById('fbw_'+qid); if(fbw) fbw.style.display='none';
  var ac=document.getElementById('ac_'+qid); if(ac){ ac.textContent='きょん「なるほど！次は自分で解く！」'; ac.style.display='block'; }
  showToast('西村「答えを見るのも学習のうち。解き方を理解しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix='math_prop_s'+currentSection+'_';
  var sectionQ=Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix)===0; });
  if(sectionQ.length===0) return;
  if(sectionQ.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection]=true;
    localStorage.setItem('math_prop_sections',JSON.stringify(sectionDone));
    renderTabs();
    var nb=document.getElementById('nextBtn');
    if(nb){
      nb.style.display='block';
      if(!document.getElementById('sectionCompleteBanner')){
        var banner=document.createElement('div'); banner.id='sectionCompleteBanner';
        var nextSec=currentSection<3?'Section '+(currentSection+1)+' へ進もう！':'確認テストで腕試し！';
        banner.innerHTML='<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(63,185,80,0.12),rgba(163,113,247,0.08));border:1px solid var(--green);border-radius:14px">'
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
  { id:0, label:'📐 スタート',  title:'比例・反比例',       sub:'y = ax と y = a/x ——実生活からグラフまで！' },
  { id:1, label:'比例',         title:'比例の基本',          sub:'対応表・グラフ・比例定数——選択8問＋計算4問' },
  { id:2, label:'反比例',       title:'反比例の基本',        sub:'y = a/x のルールと計算——選択6問＋計算4問' },
  { id:3, label:'文章題',       title:'文章題と応用',        sub:'速度・値段・面積——実生活の比例・反比例' },
  { id:4, label:'確認テスト',   title:'確認テスト',          sub:'比例・反比例まとめ——全セクション総仕上げ' },
  { id:5, label:'📊弱点',       title:'弱点ノート',          sub:'間違えた問題の正答率を確認' },
  { id:6, label:'🔥特訓',       title:'弱点特訓モード',      sub:'弱点問題を集中練習！' },
];

function renderTabs(){
  var html='';
  SECTIONS.forEach(function(s){
    var cls='section-tab';
    if(s.id===currentSection) cls+=' active';
    if(sectionDone[s.id]&&s.id!==currentSection) cls+=' done';
    if(s.id===6) cls+=' tokku';
    html+='<button class="'+cls+'" data-sid="'+s.id+'">'+s.label+'</button>';
  });
  document.getElementById('sectionTabs').innerHTML=html;
  document.querySelectorAll('.section-tab[data-sid]').forEach(function(btn){
    btn.addEventListener('click',function(){ goSection(parseInt(btn.dataset.sid)); });
  });
}
var tokkuBannerShown=false;
function showTokkuSuggestion(qid){
  var wq=getWeakQuestions(); if(wq.length<2) return;
  var banner=document.createElement('div');
  banner.style.cssText='position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#1a0008;border:1px solid var(--red);border-radius:10px;padding:10px 18px;font-size:12px;color:var(--red);z-index:999;cursor:pointer;white-space:nowrap;';
  banner.textContent='🔥 弱点が'+wq.length+'問あります。特訓モードへ！';
  banner.addEventListener('click',function(){ document.body.removeChild(banner); goSection(6); });
  document.body.appendChild(banner);
  setTimeout(function(){ if(document.body.contains(banner)) document.body.removeChild(banner); },5000);
}
function goSection(id){
  currentSection=id; qMeta={}; tokkuBannerShown=false;
  document.getElementById('mainContent').innerHTML=''; renderTabs();
  if(id===0) renderSection0();
  else if(id===1) renderSection1();
  else if(id===2) renderSection2();
  else if(id===3) renderSection3();
  else if(id===4) renderSection4();
  else if(id===5) renderWeakNote();
  else if(id===6) renderTokku();
  window.scrollTo({top:0,behavior:'smooth'});
}
function bindEvents(){
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(b){ b.addEventListener('click',function(){ handleChoice(b.dataset.qid,b.dataset.choice); updateDots(); }); });
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(b){ b.addEventListener('click',function(){ showAnswer(b.dataset.qid); updateDots(); }); });
  document.querySelectorAll('.input-submit[data-qid]').forEach(function(b){ b.addEventListener('click',function(){ handleInput(b.dataset.qid); updateDots(); }); });
  document.querySelectorAll('.q-input[id^="inp_"]').forEach(function(inp){ inp.addEventListener('keydown',function(e){ if(e.key==='Enter') handleInput(inp.id.replace('inp_','')); }); });
  document.querySelectorAll('.hint-btn[data-hqid]').forEach(function(b){ b.addEventListener('click',function(){ toggleHint(b.dataset.hqid); }); });
  if(sectionDone[currentSection]){ var nb=document.getElementById('nextBtn'); if(nb) nb.style.display='block'; }
  checkSectionComplete();
}
function updateDots(){
  var dots=document.querySelectorAll('.dot');
  var prefix='math_prop_s'+currentSection+'_';
  var sqs=Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix)===0; });
  var firstUndone=sqs.findIndex(function(id){ return !answeredSet[id]; });
  dots.forEach(function(dot,i){
    dot.className='dot';
    var qid=sqs[i]; if(!qid) return;
    if(answeredSet[qid]) dot.classList.add('done');
    else if(i===firstUndone) dot.classList.add('current');
  });
}

// ===== SVG HELPERS =====
// 比例グラフ (y=ax)
function makePropGraph(a, color, label){
  // Center (130,120), scale 28px/unit, range ±4
  var cx=130, cy=120, sc=28;
  // clamp line to viewBox 0-260 x 0-240
  // line: y_svg = cy - a*(x_unit)*sc, x_svg = cx + x_unit*sc
  // at x_unit = -2: x_svg = cx-56, y_svg = cy + 2a*sc
  // at x_unit = 2: x_svg = cx+56, y_svg = cy - 2a*sc
  var x1=cx-2*sc, y1=cy-a*(-2)*sc;
  var x2=cx+2*sc, y2=cy-a*2*sc;
  // grid
  var gridLines='';
  for(var i=-4;i<=4;i++){
    var gx=cx+i*sc, gy=cy-i*sc;
    gridLines+='<line x1="'+gx+'" y1="8" x2="'+gx+'" y2="232" stroke="#21262d" stroke-width="1"/>';
    gridLines+='<line x1="8" y1="'+gy+'" x2="252" y2="'+gy+'" stroke="#21262d" stroke-width="1"/>';
  }
  var pt1x=cx+sc, pt1y=cy-a*sc;
  var dots='<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="'+color+'"/>'
    +'<circle cx="'+pt1x+'" cy="'+pt1y+'" r="4" fill="'+color+'"/>'
    +'<text x="'+(pt1x+5)+'" y="'+(pt1y-4)+'" fill="'+color+'" font-size="11">(1,'+a+')</text>';
  return '<svg viewBox="0 0 260 240" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    +gridLines
    +'<line x1="8" y1="'+cy+'" x2="252" y2="'+cy+'" stroke="#8b949e" stroke-width="1.5" marker-end="url(#arr)"/>'
    +'<line x1="'+cx+'" y1="232" x2="'+cx+'" y2="8" stroke="#8b949e" stroke-width="1.5"/>'
    +'<text x="247" y="'+(cy+10)+'" fill="#8b949e" font-size="12">x</text>'
    +'<text x="'+(cx-9)+'" y="14" fill="#8b949e" font-size="12">y</text>'
    +'<text x="'+(cx+4)+'" y="'+(cy+10)+'" fill="#8b949e" font-size="10">O</text>'
    +'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="2.5"/>'
    +dots
    +'<text x="'+(x2+4)+'" y="'+(y2-4)+'" fill="'+color+'" font-size="12">'+label+'</text>'
    +'</svg>';
}

// ===== SECTION 0: スタート (強化版) =====
function renderSection0(){
  // Side-by-side comparison SVG
  var svgCompare = '<svg viewBox="0 0 310 210" style="width:100%;max-width:360px;display:block;margin:0 auto">'
    // --- LEFT PANEL: 比例 y=2x ---
    // Grid (light)
    +'<line x1="15" y1="15" x2="15" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="35" y1="15" x2="35" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="55" y1="15" x2="55" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="75" y1="15" x2="75" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="95" y1="15" x2="95" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="115" y1="15" x2="115" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="135" y1="15" x2="135" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="5" y1="25" x2="145" y2="25" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="5" y1="45" x2="145" y2="45" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="5" y1="65" x2="145" y2="65" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="5" y1="85" x2="145" y2="85" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="5" y1="105" x2="145" y2="105" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="5" y1="125" x2="145" y2="125" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="5" y1="145" x2="145" y2="145" stroke="#21262d" stroke-width="1"/>'
    // Axes (center at 75,85, scale 20px)
    +'<line x1="5" y1="85" x2="145" y2="85" stroke="#555" stroke-width="1.5"/>'
    +'<line x1="75" y1="15" x2="75" y2="155" stroke="#555" stroke-width="1.5"/>'
    +'<text x="139" y="94" fill="#8b949e" font-size="10">x</text>'
    +'<text x="68" y="20" fill="#8b949e" font-size="10">y</text>'
    // y=2x line: at x=-1.5 y=-3 → (75-30,85+60)=(45,145); at x=1.5 y=3 → (75+30,85-60)=(105,25)
    +'<line x1="45" y1="145" x2="105" y2="25" stroke="#a371f7" stroke-width="2.5"/>'
    // Origin dot + point (1,2)
    +'<circle cx="75" cy="85" r="3" fill="#a371f7"/>'
    +'<circle cx="95" cy="45" r="3" fill="#f5c518"/>'
    +'<text x="98" y="42" fill="#f5c518" font-size="9">(1,2)</text>'
    // Label
    +'<text x="75" y="172" fill="#a371f7" font-size="11" text-anchor="middle" font-weight="bold">比例 y=2x</text>'
    +'<text x="75" y="185" fill="#8b949e" font-size="9" text-anchor="middle">原点を通る直線</text>'
    // x が2倍→y が2倍 arrow annotation
    +'<text x="75" y="196" fill="#a371f7" font-size="9" text-anchor="middle">x2倍→y2倍</text>'

    // Divider
    +'<line x1="155" y1="5" x2="155" y2="200" stroke="#30363d" stroke-width="1" stroke-dasharray="4,3"/>'

    // --- RIGHT PANEL: 反比例 y=6/x ---
    // center at (235, 85), scale 20px
    // Grid
    +'<line x1="165" y1="15" x2="165" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="185" y1="15" x2="185" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="205" y1="15" x2="205" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="225" y1="15" x2="225" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="245" y1="15" x2="245" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="265" y1="15" x2="265" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="285" y1="15" x2="285" y2="155" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="165" y1="25" x2="305" y2="25" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="165" y1="45" x2="305" y2="45" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="165" y1="65" x2="305" y2="65" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="165" y1="85" x2="305" y2="85" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="165" y1="105" x2="305" y2="105" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="165" y1="125" x2="305" y2="125" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="165" y1="145" x2="305" y2="145" stroke="#21262d" stroke-width="1"/>'
    // Axes
    +'<line x1="165" y1="85" x2="305" y2="85" stroke="#555" stroke-width="1.5"/>'
    +'<line x1="235" y1="15" x2="235" y2="155" stroke="#555" stroke-width="1.5"/>'
    +'<text x="298" y="94" fill="#8b949e" font-size="10">x</text>'
    +'<text x="228" y="20" fill="#8b949e" font-size="10">y</text>'
    // y=3/x hyperbola (scale 20px, center 235,85):
    // x=1,y=3 → (255,25); x=1.5,y=2 → (265,45); x=3,y=1 → (295,65)
    // x=-1,y=-3 → (215,145); x=-1.5,y=-2 → (205,125); x=-3,y=-1 → (175,105)
    +'<polyline points="255,25 265,45 275,58 285,65 295,68" fill="none" stroke="#0ea5e9" stroke-width="2"/>'
    +'<polyline points="215,145 205,125 195,112 185,105 175,102" fill="none" stroke="#0ea5e9" stroke-width="2"/>'
    +'<circle cx="255" cy="25" r="3" fill="#f5c518"/>'
    +'<text x="259" y="22" fill="#f5c518" font-size="9">(1,3)</text>'
    // Label
    +'<text x="235" y="172" fill="#0ea5e9" font-size="11" text-anchor="middle" font-weight="bold">反比例 y=3/x</text>'
    +'<text x="235" y="185" fill="#8b949e" font-size="9" text-anchor="middle">双曲線（2本の曲線）</text>'
    +'<text x="235" y="196" fill="#0ea5e9" font-size="9" text-anchor="middle">x2倍→y 1/2倍</text>'
    +'</svg>';

  document.getElementById('mainContent').innerHTML=''
    +'<div class="section-header"><div class="section-badge">📐 PROPORTION</div>'
    +'<div class="section-title">比例・反比例</div>'
    +'<div class="section-sub">y = ax と y = a/x ——実生活からグラフまでマスターしよう！</div></div>'
    +'<div class="intro-box"><div class="intro-box-title">📐 きょん＆西村の会話</div>'
    +'<div class="chat-line"><div class="avatar av-kyon">き</div><div class="chat-bubble"><div class="chat-name">きょん</div>「比例」って「～に比べて」みたいな意味？「あいつのツッコミは俺に比例して面白くなってる」的な？</div></div>'
    +'<div class="chat-line"><div class="avatar av-nishi">西村</div><div class="chat-bubble"><div class="chat-name">西村真二（慶應卒・元アナ）</div>惜しい。比例は「xが2倍になるとyも2倍になる」関係だ。y = ax というシンプルな式で表せる。グラフにすると原点を通る直線になる。</div></div>'
    +'<div class="chat-line"><div class="avatar av-kyon">き</div><div class="chat-bubble"><div class="chat-name">きょん</div>反比例は？</div></div>'
    +'<div class="chat-line"><div class="avatar av-nishi">西村</div><div class="chat-bubble"><div class="chat-name">西村真二</div>「xが2倍になるとyが1/2になる」逆の関係。y = a/x。たとえば「速さを2倍にすると時間が半分」——あれが反比例だ。</div></div>'
    +'<div class="chat-line"><div class="avatar av-kyon">き</div><div class="chat-bubble"><div class="chat-name">きょん</div>速さ！！それならわかる！！ネタを2倍速で言えば半分の時間で終わる！！それが反比例！！</div></div>'
    +'<div class="chat-line"><div class="avatar av-nishi">西村</div><div class="chat-bubble"><div class="chat-name">西村真二</div>…正しいけどなぜお笑いに繋げるんだ。まあ、その理解で合ってる。</div></div>'
    +'</div>'

    +'<div class="rule-card"><div class="rule-card-title">📐 比例 vs 反比例——グラフで見る違い</div>'
    +'<div style="overflow-x:auto;margin-bottom:14px">'+svgCompare+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div class="rule-box"><div class="rule-title" style="color:var(--purple)">比例：y = ax</div>'
    +'<div class="ex">a = 比例定数</div>'
    +'<div class="ex">x が n 倍 → y も <strong style="color:var(--gold)">n 倍</strong></div>'
    +'<div class="ex">グラフ：<strong>原点を通る直線</strong></div>'
    +'<div class="note">💡 a＞0→右上がり　a＜0→右下がり</div>'
    +'</div>'
    +'<div class="rule-box"><div class="rule-title" style="color:var(--teal)">反比例：y = a/x</div>'
    +'<div class="ex">a = 比例定数（xy = a）</div>'
    +'<div class="ex">x が n 倍 → y は <strong style="color:var(--gold)">1/n 倍</strong></div>'
    +'<div class="ex">グラフ：<strong>双曲線（2本）</strong></div>'
    +'<div class="note">💡 x×y の値は常に a で一定！</div>'
    +'</div></div></div>'

    +'<div class="rule-card"><div class="rule-card-title">🌍 実生活での比例・反比例</div>'
    +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">'
    +'<tr style="background:var(--bg3);color:var(--purple)"><td style="padding:8px 10px;font-weight:bold">場面</td><td style="padding:8px 10px;font-weight:bold">x</td><td style="padding:8px 10px;font-weight:bold">y</td><td style="padding:8px 10px;font-weight:bold">種類</td></tr>'
    +'<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 10px;color:var(--text2)">1個80円のお菓子を買う</td><td style="padding:8px 10px">個数</td><td style="padding:8px 10px">代金</td><td style="padding:8px 10px;color:var(--purple);font-weight:bold">比例 y=80x</td></tr>'
    +'<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 10px;color:var(--text2)">時速60kmで走る</td><td style="padding:8px 10px">時間(h)</td><td style="padding:8px 10px">距離(km)</td><td style="padding:8px 10px;color:var(--purple);font-weight:bold">比例 y=60x</td></tr>'
    +'<tr style="border-bottom:1px solid var(--border)"><td style="padding:8px 10px;color:var(--text2)">120kmの道を移動する</td><td style="padding:8px 10px">速さ(km/h)</td><td style="padding:8px 10px">時間(h)</td><td style="padding:8px 10px;color:var(--teal);font-weight:bold">反比例 y=120/x</td></tr>'
    +'<tr><td style="padding:8px 10px;color:var(--text2)">24Lの水をタンクに入れる</td><td style="padding:8px 10px">流量(L/分)</td><td style="padding:8px 10px">時間(分)</td><td style="padding:8px 10px;color:var(--teal);font-weight:bold">反比例 y=24/x</td></tr>'
    +'</table></div>'
    +'<div class="note" style="margin-top:10px">💡 <strong>比例</strong>：x×定数＝y（掛け算で一定比率で増える）<br>　　<strong>反比例</strong>：x×y＝定数（掛け算が一定＝総量が決まっている）</div>'
    +'</div>'

    +'<button class="start-btn" data-goto="1">📐 Section 1：比例の基本へ！</button>';

  document.querySelectorAll('.start-btn[data-goto]').forEach(function(b){
    b.addEventListener('click',function(){ goSection(parseInt(b.dataset.goto)); });
  });
}

// ===== SECTION 1: 比例の基本 (強化版) =====
function renderSection1(){
  // Correspondence table HTML
  var tableY2x = '<div style="overflow-x:auto;margin:14px 0">'
    +'<table style="width:100%;border-collapse:collapse;font-size:14px;text-align:center">'
    +'<tr style="background:var(--bg3)">'
    +'<td style="padding:10px 8px;color:var(--purple);font-weight:bold;border-right:1px solid var(--border)">x</td>'
    +'<td style="padding:10px 12px;color:var(--text2)">…</td>'
    +'<td style="padding:10px 12px;color:var(--text)">-3</td>'
    +'<td style="padding:10px 12px;color:var(--text)">-2</td>'
    +'<td style="padding:10px 12px;color:var(--text)">-1</td>'
    +'<td style="padding:10px 12px;color:var(--gold);font-weight:bold">0</td>'
    +'<td style="padding:10px 12px;color:var(--text)">1</td>'
    +'<td style="padding:10px 12px;color:var(--text)">2</td>'
    +'<td style="padding:10px 12px;color:var(--text)">3</td>'
    +'<td style="padding:10px 12px;color:var(--text2)">…</td>'
    +'</tr>'
    +'<tr style="background:rgba(163,113,247,0.06)">'
    +'<td style="padding:10px 8px;color:var(--purple);font-weight:bold;border-right:1px solid var(--border)">y</td>'
    +'<td style="padding:10px 12px;color:var(--text2)">…</td>'
    +'<td style="padding:10px 12px;color:var(--text)">-6</td>'
    +'<td style="padding:10px 12px;color:var(--text)">-4</td>'
    +'<td style="padding:10px 12px;color:var(--text)">-2</td>'
    +'<td style="padding:10px 12px;color:var(--gold);font-weight:bold">0</td>'
    +'<td style="padding:10px 12px;color:var(--text)">2</td>'
    +'<td style="padding:10px 12px;color:var(--text)">4</td>'
    +'<td style="padding:10px 12px;color:var(--text)">6</td>'
    +'<td style="padding:10px 12px;color:var(--text2)">…</td>'
    +'</tr>'
    +'</table>'
    +'<div style="font-size:12px;color:var(--text2);margin-top:6px;text-align:center">y = 2x の対応表　（y ÷ x = 2 = <strong style="color:var(--gold)">一定</strong>！これが比例定数）</div>'
    +'</div>';

  // Graph SVG for y=2x and y=-x side by side
  var svgGraph = '<svg viewBox="0 0 260 240" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    // Grid (cx=130, cy=120, sc=28)
    +'<line x1="18" y1="0" x2="18" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="46" y1="0" x2="46" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="74" y1="0" x2="74" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="102" y1="0" x2="102" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="130" y1="0" x2="130" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="158" y1="0" x2="158" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="186" y1="0" x2="186" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="214" y1="0" x2="214" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="242" y1="0" x2="242" y2="240" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="8" x2="260" y2="8" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="36" x2="260" y2="36" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="64" x2="260" y2="64" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="92" x2="260" y2="92" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="120" x2="260" y2="120" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="148" x2="260" y2="148" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="176" x2="260" y2="176" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="204" x2="260" y2="204" stroke="#21262d" stroke-width="1"/>'
    +'<line x1="0" y1="232" x2="260" y2="232" stroke="#21262d" stroke-width="1"/>'
    // Axes
    +'<line x1="8" y1="120" x2="252" y2="120" stroke="#8b949e" stroke-width="1.5"/>'
    +'<line x1="130" y1="232" x2="130" y2="8" stroke="#8b949e" stroke-width="1.5"/>'
    +'<text x="247" y="130" fill="#8b949e" font-size="11">x</text>'
    +'<text x="122" y="13" fill="#8b949e" font-size="11">y</text>'
    +'<text x="134" y="130" fill="#8b949e" font-size="10">O</text>'
    // Axis tick labels x
    +'<text x="97" y="134" fill="#8b949e" font-size="10">-1</text>'
    +'<text x="152" y="134" fill="#8b949e" font-size="10">1</text>'
    +'<text x="180" y="134" fill="#8b949e" font-size="10">2</text>'
    // Axis tick labels y
    +'<text x="134" y="96" fill="#8b949e" font-size="10">1</text>'
    +'<text x="134" y="68" fill="#8b949e" font-size="10">2</text>'
    +'<text x="134" y="40" fill="#8b949e" font-size="10">3</text>'
    +'<text x="130" y="152" fill="#8b949e" font-size="10">-1</text>'
    // y=2x line: at x=-2 y=-4 → (74,232), at x=2 y=4 → (186,8)
    +'<line x1="74" y1="232" x2="186" y2="8" stroke="#a371f7" stroke-width="2.5"/>'
    // y=-x line: at x=-2 y=2 → (74,64), at x=2 y=-2 → (186,176)
    +'<line x1="74" y1="64" x2="186" y2="176" stroke="#e94560" stroke-width="2"/>'
    // Key points y=2x
    +'<circle cx="130" cy="120" r="4" fill="#a371f7"/>'
    +'<circle cx="158" cy="64" r="4" fill="#f5c518"/>'
    +'<text x="163" y="61" fill="#f5c518" font-size="11">(1,2)</text>'
    +'<circle cx="186" cy="8" r="3" fill="#a371f7"/>'
    +'<text x="190" y="12" fill="#a371f7" font-size="11">(2,4)</text>'
    // Labels
    +'<text x="188" y="20" fill="#a371f7" font-size="12">y=2x</text>'
    +'<text x="188" y="168" fill="#e94560" font-size="12">y=-x</text>'
    +'</svg>';

  // Slope comparison: a>0 vs a<0
  var svgSlope = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">'
    +'<div style="flex:1;min-width:120px;background:rgba(163,113,247,0.07);border:1px solid rgba(163,113,247,0.3);border-radius:10px;padding:12px;text-align:center">'
    +'<div style="font-size:11px;color:var(--purple);font-weight:bold;margin-bottom:6px">a ＞ 0（正の比例定数）</div>'
    +'<svg viewBox="0 0 80 80" style="width:70px;height:70px"><line x1="5" y1="40" x2="75" y2="40" stroke="#444" stroke-width="1"/><line x1="40" y1="5" x2="40" y2="75" stroke="#444" stroke-width="1"/><line x1="10" y1="70" x2="70" y2="10" stroke="#a371f7" stroke-width="2"/></svg>'
    +'<div style="font-size:11px;color:var(--purple)">右上がりの直線</div>'
    +'</div>'
    +'<div style="flex:1;min-width:120px;background:rgba(233,69,96,0.07);border:1px solid rgba(233,69,96,0.3);border-radius:10px;padding:12px;text-align:center">'
    +'<div style="font-size:11px;color:var(--red);font-weight:bold;margin-bottom:6px">a ＜ 0（負の比例定数）</div>'
    +'<svg viewBox="0 0 80 80" style="width:70px;height:70px"><line x1="5" y1="40" x2="75" y2="40" stroke="#444" stroke-width="1"/><line x1="40" y1="5" x2="40" y2="75" stroke="#444" stroke-width="1"/><line x1="10" y1="10" x2="70" y2="70" stroke="#e94560" stroke-width="2"/></svg>'
    +'<div style="font-size:11px;color:var(--red)">右下がりの直線</div>'
    +'</div>'
    +'</div>';

  var choiceQs=[
    { qid:'math_prop_s1_q0', jp:'「y が x に比例する」とはどういう意味？',
      answer:'y = ax と表せる（a は 0 でない定数）',
      choices:['y = ax と表せる（a は 0 でない定数）','y = x + a と表せる','y = a/x と表せる','x + y = a と表せる'],
      exp:'📐 比例：<span style="color:var(--gold)">y = ax</span>（a は比例定数）。x が決まれば y が1つに決まる。<br>✅ y = 3x → 比例　✅ y = -2x → 比例　❌ y = x + 1 → 一次関数（比例でない）' },
    { qid:'math_prop_s1_q1', jp:'y = 5x のとき、比例定数はいくつ？',
      answer:'5',
      choices:['5','-5','x','1/5'],
      exp:'📐 y = <span style="color:var(--gold)">a</span>x の a が比例定数。y = 5x → 比例定数は <span style="color:var(--gold)">5</span>' },
    { qid:'math_prop_s1_q2', jp:'比例 y = ax のグラフはどんな形？',
      answer:'原点を通る直線',
      choices:['原点を通る直線','原点を通る曲線','y 軸上の直線','x 軸に平行な直線'],
      exp:'📐 比例のグラフは必ず<span style="color:var(--gold)">原点（0, 0）を通る直線</span>。<br>a＞0 → 右上がり　a＜0 → 右下がり。原点を必ず通るのが特徴！' },
    { qid:'math_prop_s1_q3', jp:'次のうち、y が x に比例するのはどれ？',
      answer:'y = -3x',
      choices:['y = -3x','y = x + 2','y = 6/x','y = x²'],
      exp:'📐 y = ax の形（定数×x）が比例。<br>✅ y = -3x → 比例定数 -3<br>❌ y = x + 2（切片あり・一次関数）　❌ y = 6/x（反比例）　❌ y = x²（二乗）' },
    { qid:'math_prop_s1_q4', jp:'y = 2x のとき、x が 3 倍になると y はどうなる？',
      answer:'3 倍になる',
      choices:['3 倍になる','2 倍になる','1/3 になる','6 倍になる'],
      exp:'📐 比例では x が n 倍 → y も <span style="color:var(--gold)">n 倍</span>になる。<br>x が 3 倍 → y も 3 倍。（係数 2 は比例定数——倍率とは別！）' },
    { qid:'math_prop_s1_q5', jp:'y = -4x のグラフの特徴はどれ？',
      answer:'原点を通り、右下がりの直線',
      choices:['原点を通り、右下がりの直線','原点を通り、右上がりの直線','y 軸と交わらない曲線','x 軸と平行な直線'],
      exp:'📐 a = -4 < 0 なので<span style="color:var(--gold)">右下がりの直線</span>。a < 0 のとき x が増えると y は減る。原点は必ず通る。' },
    { qid:'math_prop_s1_q6', jp:'下の表で y が x に比例しているのはどれ？（y÷xが一定のもの）',
      answer:'① x: 1,2,3 のとき y: 2,4,6',
      choices:['① x: 1,2,3 のとき y: 2,4,6','② x: 1,2,3 のとき y: 3,5,7','③ x: 1,2,3 のとき y: 6,3,2','④ x: 1,2,3 のとき y: 1,3,5'],
      exp:'📐 比例は y÷x が一定！<br>① 2÷1=2, 4÷2=2, 6÷3=2 → <span style="color:var(--gold)">一定＝比例！</span><br>② 3÷1=3, 5÷2=2.5 → 一定でない<br>③ 6×1=6, 3×2=6 → x×yが一定＝<strong>反比例</strong>！<br>💡 「y÷x = 一定」なら比例！これが対応表を見るコツ' },
    { qid:'math_prop_s1_q7', jp:'1個80円のお菓子を x 個買ったときの代金 y 円の関係式は？',
      answer:'y = 80x（比例）',
      choices:['y = 80x（比例）','y = 80/x（反比例）','y = x + 80','y = 80（定数）'],
      exp:'📐 1個80円 × x個 = y円 → <span style="color:var(--gold)">y = 80x</span>（比例定数 80）<br>✅ x が増えると y も同じ割合で増える → 比例の典型例！<br>💡 「単価 × 個数 = 合計金額」は必ず比例！' },
  ];
  var inputQs=[
    { qid:'math_prop_s1_in0', jp:'y = 3x のとき、x = 4 のときの y の値は？', formula:'y = 3x　（x = 4）',
      answer:'12', xp:5, hint:'y = 3 × 4 = 12',
      exp:'y = 3x に x = 4 を代入 → y = 3 × 4 = <span style="color:var(--gold)">12</span>' },
    { qid:'math_prop_s1_in1', jp:'y が x に比例し、x = 2 のとき y = 10。比例定数 a は？', formula:'y = ax、x = 2 のとき y = 10',
      answer:'5', xp:5, hint:'10 = a × 2 → a = 10 ÷ 2 = 5',
      exp:'y = ax に x = 2, y = 10 を代入 → 10 = a × 2 → a = <span style="color:var(--gold)">5</span>' },
    { qid:'math_prop_s1_in2', jp:'y = -6x のとき、y = 18 となる x は？', formula:'y = -6x のとき y = 18',
      answer:'-3', xp:6, hint:'18 = -6 × x → x = 18 ÷ (-6) = -3',
      exp:'18 = -6x → x = 18 ÷ (-6) = <span style="color:var(--gold)">-3</span><br>💡 プラス÷マイナス = マイナス！' },
    { qid:'math_prop_s1_in3', jp:'y が x に比例し、x = 3 のとき y = -9。x = -2 のときの y は？', formula:'x = 3 のとき y = -9（比例）、x = -2 のときの y = ?',
      answer:'6', xp:6, hint:'a = -9 ÷ 3 = -3 → y = -3x → y = -3 × (-2) = 6',
      exp:'① 比例定数 a = y ÷ x = -9 ÷ 3 = -3<br>② y = -3x に x = -2 を代入 → y = -3 × (-2) = <span style="color:var(--gold)">6</span><br>💡 マイナス × マイナス = プラス！' },
  ];

  var html='<div class="section-header"><div class="section-badge">SECTION 1</div>'
    +'<div class="section-title">比例の基本</div><div class="section-sub">対応表・グラフ・比例定数——選択8問＋計算4問</div></div>'
    +'<div class="progress-dots">'+Array(12).fill(0).map(function(_,i){ return '<div class="dot '+(i===0?'current':'')+'"></div>'; }).join('')+'</div>'

    +'<div class="intro-box"><div class="intro-box-title">📐 きょん＆西村の会話</div>'
    +'<div class="chat-line"><div class="avatar av-kyon">き</div><div class="chat-bubble"><div class="chat-name">きょん</div>対応表って何を見ればいいの？数字がいっぱい並んでてよくわからん！</div></div>'
    +'<div class="chat-line"><div class="avatar av-nishi">西村</div><div class="chat-bubble"><div class="chat-name">西村真二</div>y÷x を計算してみて。比例なら値が全部同じになる。その値が比例定数 a だ。</div></div>'
    +'<div class="chat-line"><div class="avatar av-kyon">き</div><div class="chat-bubble"><div class="chat-name">きょん</div>y÷x が一定！！じゃあ逆に x×y が一定なのが反比例？</div></div>'
    +'<div class="chat-line"><div class="avatar av-nishi">西村</div><div class="chat-bubble"><div class="chat-name">西村真二</div>完璧。よく理解してる。</div></div>'
    +'</div>'

    +'<div class="rule-card"><div class="rule-card-title">📐 比例の対応表（y = 2x の場合）</div>'
    +tableY2x
    +'<div class="rule-box"><div class="rule-title">対応表から比例定数を求める方法</div>'
    +'<div class="ex">y ÷ x を計算する → すべて同じ値 = <strong style="color:var(--gold)">比例定数 a</strong></div>'
    +'<div class="ex">y = 2x の場合：2÷1=2、4÷2=2、6÷3=2 → a=2</div>'
    +'<div class="note">💡 「y÷x が一定」 ← これが比例かどうかの判定ポイント！</div>'
    +'</div></div>'

    +'<div class="rule-card"><div class="rule-card-title">📐 比例のグラフ（y = 2x と y = -x）</div>'
    +'<div style="overflow-x:auto;margin-bottom:14px">'+svgGraph+'</div>'
    +svgSlope
    +'<div class="rule-box"><div class="rule-title">グラフの特徴まとめ</div>'
    +'<div class="ex">① 必ず<strong style="color:var(--gold)">原点 (0, 0) を通る</strong>——これが比例グラフの絶対条件！</div>'
    +'<div class="ex">② <strong>直線</strong>（曲線にならない）</div>'
    +'<div class="ex">③ |a| が大きいほど<strong>急な傾き</strong>になる（y=3xの方がy=xより急）</div>'
    +'<div class="note">💡 グラフが原点を通らない直線は「一次関数」（比例でない）！中2で学ぶ</div>'
    +'</div></div>'

    +'<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  choiceQs.forEach(function(q,i){ html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoices(q.qid,q.jp,q.answer,q.choices,q.exp); });
  html+='<div style="font-size:13px;color:var(--text2);margin:20px 0 14px;font-weight:bold">── 計算問題（入力） ──</div>';
  inputQs.forEach(function(q,i){ html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(choiceQs.length+i+1)+'</div>'+makeInputCard(q.qid,q.jp,q.formula,q.answer,q.xp,q.hint,q.exp); });
  html+='<button class="next-section-btn" id="nextBtn" data-goto="2" style="display:none">次のセクションへ：反比例 →</button>';
  document.getElementById('mainContent').innerHTML=html;
  bindEvents();
  document.querySelectorAll('.next-section-btn[data-goto]').forEach(function(b){
    b.addEventListener('click',function(){ goSection(parseInt(b.dataset.goto)); });
  });
  updateDots();
}

// ===== SECTION 2: 反比例 =====
function renderSection2(){
  var choiceQs=[
    { qid:'math_prop_s2_q0', jp:'「y が x に反比例する」とはどういう意味？',
      answer:'y = a/x と表せる（a は 0 でない定数）',
      choices:['y = a/x と表せる（a は 0 でない定数）','y = ax と表せる','y = -ax と表せる','y = x/a と表せる'],
      exp:'📐 反比例：<span style="color:var(--gold)">y = a/x</span>（a は比例定数）。<br>xy = a とも書ける。x×y の値が常に一定！' },
    { qid:'math_prop_s2_q1', jp:'y = 12/x のとき、比例定数はいくつ？',
      answer:'12',
      choices:['12','12x','1/12','x'],
      exp:'📐 y = <span style="color:var(--gold)">a</span>/x の a が比例定数。y = 12/x → 比例定数は <span style="color:var(--gold)">12</span>' },
    { qid:'math_prop_s2_q2', jp:'反比例 y = a/x のグラフはどんな形？',
      answer:'双曲線（原点に対して対称な 2 本のなめらかな曲線）',
      choices:['双曲線（原点に対して対称な 2 本のなめらかな曲線）','原点を通る直線','放物線（U字形の曲線）','x 軸に平行な直線'],
      exp:'📐 反比例のグラフは<span style="color:var(--gold)">双曲線</span>。なめらかな2本の曲線で、x 軸・y 軸に近づくが交わらない（漸近線）。原点に対して対称。' },
    { qid:'math_prop_s2_q3', jp:'次のうち、y が x に反比例するのはどれ？',
      answer:'y = 8/x',
      choices:['y = 8/x','y = 8x','y = x - 8','y = x²'],
      exp:'📐 y = a/x の形が反比例。<br>✅ y = 8/x → 比例定数 8<br>❌ y = 8x（比例）　❌ y = x - 8（一次関数）　❌ y = x²（二乗）' },
    { qid:'math_prop_s2_q4', jp:'y = a/x のとき、x × y の値はどうなる？',
      answer:'常に a（一定）',
      choices:['常に a（一定）','x によって変わる','常に 1','常に 0'],
      exp:'📐 y = a/x の両辺に x をかけると <span style="color:var(--gold)">xy = a</span>（一定）。<br>反比例の大事な性質！x×y を計算して比例定数が求められる。' },
    { qid:'math_prop_s2_q5', jp:'y = 6/x のとき、x が 2 倍になると y はどうなる？',
      answer:'1/2 になる',
      choices:['1/2 になる','2 倍になる','6 倍になる','変わらない'],
      exp:'📐 反比例では x が n 倍 → y は <span style="color:var(--gold)">1/n 倍</span>になる。<br>x が 2 倍 → y は 1/2 になる。（比例の逆！）' },
  ];
  var inputQs=[
    { qid:'math_prop_s2_in0', jp:'y = 20/x のとき、x = 4 のときの y の値は？', formula:'y = 20/x　（x = 4）',
      answer:'5', xp:5, hint:'y = 20 ÷ 4 = 5',
      exp:'y = 20/x に x = 4 を代入 → y = 20 ÷ 4 = <span style="color:var(--gold)">5</span>' },
    { qid:'math_prop_s2_in1', jp:'y が x に反比例し、x = 2 のとき y = 9。比例定数 a は？', formula:'y = a/x、x = 2 のとき y = 9',
      answer:'18', xp:5, hint:'a = x × y = 2 × 9 = 18',
      exp:'反比例の比例定数 a = x × y = 2 × 9 = <span style="color:var(--gold)">18</span><br>式は y = 18/x' },
    { qid:'math_prop_s2_in2', jp:'y = 24/x のとき、y = 8 となる x は？', formula:'y = 24/x のとき y = 8',
      answer:'3', xp:6, hint:'8 = 24/x → x = 24 ÷ 8 = 3',
      exp:'8 = 24/x → 8x = 24 → x = 24 ÷ 8 = <span style="color:var(--gold)">3</span>' },
    { qid:'math_prop_s2_in3', jp:'y が x に反比例し、x = 6 のとき y = -4。x = 3 のときの y は？', formula:'x = 6 のとき y = -4（反比例）、x = 3 のときの y = ?',
      answer:'-8', xp:6, hint:'a = 6 × (-4) = -24 → y = -24/3 = -8',
      exp:'① 比例定数 a = x × y = 6 × (-4) = -24<br>② y = -24/x に x = 3 を代入 → y = -24 ÷ 3 = <span style="color:var(--gold)">-8</span>' },
  ];

  var html='<div class="section-header"><div class="section-badge">SECTION 2</div>'
    +'<div class="section-title">反比例の基本</div><div class="section-sub">y = a/x のルールと計算——選択6問＋計算4問</div></div>'
    +'<div class="progress-dots">'+Array(10).fill(0).map(function(_,i){ return '<div class="dot '+(i===0?'current':'')+'"></div>'; }).join('')+'</div>'
    +'<div style="font-size:13px;color:var(--text2);margin:8px 0 16px">── 練習問題 ──</div>';
  choiceQs.forEach(function(q,i){ html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoices(q.qid,q.jp,q.answer,q.choices,q.exp); });
  html+='<div style="font-size:13px;color:var(--text2);margin:20px 0 14px">── 計算問題（入力） ──</div>';
  inputQs.forEach(function(q,i){ html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(choiceQs.length+i+1)+'</div>'+makeInputCard(q.qid,q.jp,q.formula,q.answer,q.xp,q.hint,q.exp); });
  html+='<button class="next-section-btn" id="nextBtn" data-goto="3" style="display:none">次のセクションへ：文章題 →</button>';
  document.getElementById('mainContent').innerHTML=html;
  bindEvents();
  document.querySelectorAll('.next-section-btn[data-goto]').forEach(function(b){
    b.addEventListener('click',function(){ goSection(parseInt(b.dataset.goto)); });
  });
  updateDots();
}

// ===== SECTION 3: 文章題と応用 =====
function renderSection3(){
  // SVG: 速さ×時間=距離（反比例イメージ）
  var svgSpeed = '<svg viewBox="0 0 280 130" style="width:100%;max-width:320px;display:block;margin:0 auto">'
    // road
    +'<rect x="10" y="60" width="260" height="30" rx="4" fill="rgba(14,165,233,0.08)" stroke="#0ea5e9" stroke-width="1.5"/>'
    +'<line x1="10" y1="75" x2="270" y2="75" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="12,8"/>'
    // car
    +'<rect x="20" y="48" width="44" height="24" rx="5" fill="rgba(163,113,247,0.18)" stroke="#a371f7" stroke-width="1.5"/>'
    +'<circle cx="30" cy="74" r="6" fill="#a371f7"/>'
    +'<circle cx="54" cy="74" r="6" fill="#a371f7"/>'
    +'<text x="42" y="63" fill="#a371f7" font-size="10" text-anchor="middle">🚗</text>'
    // arrow showing distance
    +'<line x1="20" y1="105" x2="200" y2="105" stroke="#f5c518" stroke-width="2" marker-end="url(#arr)"/>'
    +'<text x="110" y="120" fill="#f5c518" font-size="12" text-anchor="middle">距離 = 速さ × 時間</text>'
    // labels
    +'<text x="42" y="43" fill="#a371f7" font-size="11" text-anchor="middle">速さ x km/h</text>'
    +'<text x="200" y="48" fill="#8b949e" font-size="11">時間 y 時間</text>'
    +'<text x="200" y="62" fill="#f5c518" font-size="11">x × y = 距離（一定）</text>'
    +'<text x="200" y="76" fill="#0ea5e9" font-size="11">→ 反比例！</text>'
    +'</svg>';

  // SVG: 値段×個数=合計（比例イメージ）
  var svgPrice = '<svg viewBox="0 0 260 110" style="width:100%;max-width:300px;display:block;margin:0 auto">'
    +'<rect x="10" y="20" width="40" height="50" rx="4" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="1.5"/>'
    +'<text x="30" y="50" fill="#a371f7" font-size="11" text-anchor="middle">🍬</text>'
    +'<text x="30" y="85" fill="#a371f7" font-size="10" text-anchor="middle">1個80円</text>'
    +'<rect x="60" y="20" width="40" height="50" rx="4" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="1.5"/>'
    +'<text x="80" y="50" fill="#a371f7" font-size="11" text-anchor="middle">🍬</text>'
    +'<rect x="110" y="20" width="40" height="50" rx="4" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="1.5"/>'
    +'<text x="130" y="50" fill="#a371f7" font-size="11" text-anchor="middle">🍬</text>'
    +'<text x="30" y="10" fill="#8b949e" font-size="10" text-anchor="middle">x個</text>'
    +'<text x="170" y="50" fill="#f5c518" font-size="14">→</text>'
    +'<text x="200" y="45" fill="#f5c518" font-size="13" font-weight="bold">y = 80x</text>'
    +'<text x="200" y="62" fill="#8b949e" font-size="11">x が増えると</text>'
    +'<text x="200" y="76" fill="#a371f7" font-size="11">y も増える → 比例！</text>'
    +'</svg>';

  var choiceQs = [
    {
      qid:'math_prop_s3_q0',
      jp:'1個80円のお菓子を x 個買ったときの代金 y 円の関係式は？',
      answer:'y = 80x（比例）',
      choices:['y = 80x（比例）','y = 80/x（反比例）','y = x + 80','y = 80'],
      exp:'📐 1個80円 × x個 = y円 → <span style="color:var(--gold)">y = 80x</span>（比例）<br>✅ 個数が増えると代金も同じ割合で増える<br>💡 「単価×個数=合計」は比例の典型！'
    },
    {
      qid:'math_prop_s3_q1',
      jp:'120km の道のりを時速 x km で走ると y 時間かかる。y と x の関係式は？',
      answer:'y = 120/x（反比例）',
      choices:['y = 120/x（反比例）','y = 120x（比例）','y = x + 120','y = 120 - x'],
      exp:'📐 速さ × 時間 = 距離 → x × y = 120 → <span style="color:var(--gold)">y = 120/x</span>（反比例）<br>✅ 速くなるほど時間が短くなる → 反比例の典型！<br>💡 「総量が一定 → 反比例」のパターン！'
    },
    {
      qid:'math_prop_s3_q2',
      jp:'毎分 x L でタンクに水を入れる。タンクの容量は 60 L。満水になるまで y 分かかる。関係式は？',
      answer:'y = 60/x（反比例）',
      choices:['y = 60/x（反比例）','y = 60x（比例）','y = x/60','y = 60 + x'],
      exp:'📐 x × y = 60（水量一定）→ <span style="color:var(--gold)">y = 60/x</span>（反比例）<br>✅ 流量が多いほど時間が短くなる<br>💡 「総量÷単位量＝時間」も x×y=一定パターン！'
    },
    {
      qid:'math_prop_s3_q3',
      jp:'底辺 x cm・高さ 6cm の三角形の面積 y cm²。y と x の関係は？',
      answer:'y = 3x（比例）',
      choices:['y = 3x（比例）','y = 6/x（反比例）','y = 6x（比例）','y = x/6（比例）'],
      exp:'📐 三角形の面積 = 底辺 × 高さ ÷ 2 = x × 6 ÷ 2 = <span style="color:var(--gold)">y = 3x</span>（比例）<br>✅ 高さが一定なら、底辺が増えると面積も比例して増える<br>💡 「高さ固定 → 面積と底辺は比例」！'
    },
    {
      qid:'math_prop_s3_q4',
      jp:'縦 x cm・横 y cm で面積が 24 cm² の長方形。y と x の関係式は？',
      answer:'y = 24/x（反比例）',
      choices:['y = 24/x（反比例）','y = 24x（比例）','y = x + 24','y = 24 - x'],
      exp:'📐 縦 × 横 = 面積 → x × y = 24 → <span style="color:var(--gold)">y = 24/x</span>（反比例）<br>✅ 縦が長くなると横は短くなる → x×y=一定＝反比例！<br>💡 面積一定なら縦と横は反比例！'
    },
    {
      qid:'math_prop_s3_q5',
      jp:'時速 x km で走るとき、1時間で進む距離 y km の関係式は？',
      answer:'y = x（比例、a=1）',
      choices:['y = x（比例、a=1）','y = 1/x（反比例）','y = x + 1','y = x²'],
      exp:'📐 距離 = 速さ × 時間 = x × 1 = x → <span style="color:var(--gold)">y = x</span>（比例定数 1）<br>✅ 速さが2倍 → 距離も2倍。1時間なら距離は速さに比例！<br>💡 比例定数が1のときは「y = x」。シンプル！'
    },
  ];

  var inputQs = [
    {
      qid:'math_prop_s3_in0',
      jp:'1冊 x 円のノートを5冊買った。代金 y 円を x の式で表すと？（式のみ入力）',
      formula:'1冊x円のノート × 5冊',
      answer:'y=5x', xp:5,
      hint:'y = 1冊の値段 × 冊数 = x × 5',
      exp:'y = x × 5 = <span style="color:var(--gold)">5x</span>（比例定数 5）'
    },
    {
      qid:'math_prop_s3_in1',
      jp:'時速60km で走ると 240km の道のりに何時間かかるか？',
      formula:'距離÷速さ＝時間　（距離240km、速さ60km/h）',
      answer:'4', xp:5,
      hint:'y = 240/x に x = 60 を代入 → 240 ÷ 60 = 4',
      exp:'y = 240 ÷ 60 = <span style="color:var(--gold)">4</span> 時間<br>（反比例 y = 240/x に x=60 を代入）'
    },
    {
      qid:'math_prop_s3_in2',
      jp:'面積 30 cm² の長方形で、縦 x = 5 cm のとき横 y cm は？',
      formula:'縦×横=30 （x=5）',
      answer:'6', xp:5,
      hint:'y = 30/x に x = 5 を代入 → 30 ÷ 5 = 6',
      exp:'y = 30 ÷ 5 = <span style="color:var(--gold)">6</span> cm（反比例 y = 30/x）'
    },
    {
      qid:'math_prop_s3_in3',
      jp:'1分間に x L 汲み上げるポンプで 90 L 汲み出す。x = 15 のとき何分かかるか？',
      formula:'y = 90/x　（x = 15）',
      answer:'6', xp:6,
      hint:'y = 90 ÷ 15 = 6',
      exp:'y = 90 ÷ 15 = <span style="color:var(--gold)">6</span> 分<br>（反比例 y = 90/x に x=15 を代入）'
    },
  ];

  var html = '<div class="section-header"><div class="section-badge">SECTION 3</div>'
    +'<div class="section-title">文章題と応用</div><div class="section-sub">速度・値段・面積——実生活の比例・反比例</div></div>'
    +'<div class="progress-dots">'+Array(10).fill(0).map(function(_,i){ return '<div class="dot '+(i===0?'current':'')+'"></div>'; }).join('')+'</div>'

    +'<div class="intro-box"><div class="intro-box-title">📐 きょん＆西村の会話</div>'
    +'<div class="chat-line"><div class="avatar av-kyon">き</div><div class="chat-bubble"><div class="chat-name">きょん</div>文章題ってどこから手をつければいいの？「何が x で何が y か」がわからなくなる！</div></div>'
    +'<div class="chat-line"><div class="avatar av-nishi">西村</div><div class="chat-bubble"><div class="chat-name">西村真二（慶應卒・元アナ）</div>まず「何と何が関係しているか」を整理する。そして「x が増えたとき y はどうなるか」を考える。増えるなら比例、逆に減るなら反比例だ。</div></div>'
    +'<div class="chat-line"><div class="avatar av-kyon">き</div><div class="chat-bubble"><div class="chat-name">きょん</div>速さが上がると時間が減る……だから反比例！！お菓子の個数が増えると代金が増える……比例！！あ、わかるかも！！</div></div>'
    +'<div class="chat-line"><div class="avatar av-nishi">西村</div><div class="chat-bubble"><div class="chat-name">西村真二</div>正確に理解できてる。もう一つコツを言うと——「総量が一定」のときは必ず反比例になる。</div></div>'
    +'</div>'

    +'<div class="rule-card"><div class="rule-card-title">📐 文章題の見分け方</div>'
    +'<div style="overflow-x:auto;margin-bottom:12px">'+svgPrice+'</div>'
    +'<div style="overflow-x:auto;margin-bottom:12px">'+svgSpeed+'</div>'
    +'<div class="rule-box"><div class="rule-title">比例になる場面（y = ax）</div>'
    +'<div class="ex">・単価 × 個数 = 代金（個数↑→代金↑）</div>'
    +'<div class="ex">・速さ × 時間 = 距離（時間↑→距離↑）</div>'
    +'<div class="ex">・高さ一定の三角形：底辺↑→面積↑</div>'
    +'<div class="note">💡 「x が増えると y も増える」→ 比例！</div>'
    +'</div>'
    +'<div class="rule-box" style="margin-top:8px"><div class="rule-title">反比例になる場面（y = a/x）</div>'
    +'<div class="ex">・距離一定で速さ×時間=距離（速さ↑→時間↓）</div>'
    +'<div class="ex">・容量一定でポンプ流量×時間=容量（流量↑→時間↓）</div>'
    +'<div class="ex">・面積一定の長方形：縦↑→横↓</div>'
    +'<div class="note">💡 「総量が一定 → x×y=定数 → 反比例」！</div>'
    +'</div>'

    +'<div style="overflow-x:auto;margin-top:14px"><table style="width:100%;border-collapse:collapse;font-size:13px">'
    +'<tr style="background:var(--bg3);color:var(--purple)">'
    +'<td style="padding:8px 10px;font-weight:bold">見分け方</td>'
    +'<td style="padding:8px 10px;font-weight:bold">比例</td>'
    +'<td style="padding:8px 10px;font-weight:bold">反比例</td>'
    +'</tr>'
    +'<tr style="border-bottom:1px solid var(--border)">'
    +'<td style="padding:8px 10px;color:var(--text2)">x が増えると y は？</td>'
    +'<td style="padding:8px 10px;color:var(--purple)">増える</td>'
    +'<td style="padding:8px 10px;color:var(--teal)">減る</td>'
    +'</tr>'
    +'<tr style="border-bottom:1px solid var(--border)">'
    +'<td style="padding:8px 10px;color:var(--text2)">一定なもの</td>'
    +'<td style="padding:8px 10px;color:var(--purple)">y ÷ x</td>'
    +'<td style="padding:8px 10px;color:var(--teal)">x × y</td>'
    +'</tr>'
    +'<tr>'
    +'<td style="padding:8px 10px;color:var(--text2)">式の形</td>'
    +'<td style="padding:8px 10px;color:var(--purple)">y = ax</td>'
    +'<td style="padding:8px 10px;color:var(--teal)">y = a/x</td>'
    +'</tr>'
    +'</table></div>'
    +'</div>'

    +'<div style="font-size:13px;color:var(--text2);margin:20px 0 14px;font-weight:bold">── 練習問題（選択） ──</div>';

  choiceQs.forEach(function(q,i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'
      + makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp);
  });
  html += '<div style="font-size:13px;color:var(--text2);margin:24px 0 14px;font-weight:bold">── 計算問題（入力） ──</div>';
  inputQs.forEach(function(q,i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(choiceQs.length+i+1)+'</div>'
      + makeInputCard(q.qid, q.jp, q.formula, q.answer, q.xp, q.hint, q.exp);
  });
  html += '<button class="next-section-btn" id="nextBtn" data-goto="4" style="display:none">次のセクションへ：確認テスト →</button>';

  document.getElementById('mainContent').innerHTML = html;
  bindEvents();
  document.querySelectorAll('.next-section-btn[data-goto]').forEach(function(b){
    b.addEventListener('click', function(){ goSection(parseInt(b.dataset.goto)); });
  });
  updateDots();
}

// ===== SECTION 4: 確認テスト =====
function renderSection4(){
  var choiceQs=[
    { qid:'math_prop_s4_ch0', jp:'y = 7x の比例定数はいくつ？',
      answer:'7', choices:['7','-7','1/7','x'],
      exp:'📐 y = ax → 比例定数は a = <span style="color:var(--gold)">7</span>' },
    { qid:'math_prop_s4_ch1', jp:'y が x に比例し、x = 5 のとき y = 15。y を x の式で表すと？',
      answer:'y = 3x', choices:['y = 3x','y = 5x','y = 15x','y = 75x'],
      exp:'📐 a = y ÷ x = 15 ÷ 5 = 3 → <span style="color:var(--gold)">y = 3x</span>' },
    { qid:'math_prop_s4_ch2', jp:'比例 y = ax で a > 0 のとき、グラフはどちら向き？',
      answer:'右上がりの直線', choices:['右上がりの直線','右下がりの直線','U 字形の曲線','水平な直線'],
      exp:'📐 a > 0（正の比例定数）→ x が増えると y も増える → <span style="color:var(--gold)">右上がりの直線</span>' },
    { qid:'math_prop_s4_ch3', jp:'y = -4/x の比例定数はいくつ？',
      answer:'-4', choices:['-4','4','1/4','-1/4'],
      exp:'📐 y = <span style="color:var(--gold)">a</span>/x → 比例定数 a = <span style="color:var(--gold)">-4</span>' },
    { qid:'math_prop_s4_ch4', jp:'反比例で x × y = 15 のとき、比例定数はいくつ？',
      answer:'15', choices:['15','-15','1/15','x'],
      exp:'📐 反比例 y = a/x → xy = a。xy = 15 → 比例定数 a = <span style="color:var(--gold)">15</span>' },
    { qid:'math_prop_s4_ch5', jp:'次のうち比例はどれ？',
      answer:'y = 2x', choices:['y = 2x','y = 2/x','y = 2x + 1','y = 2x²'],
      exp:'📐 y = ax の形が比例。<br>✅ y = 2x → 比例定数 2<br>❌ y = 2/x（反比例）　❌ y = 2x + 1（一次関数）　❌ y = 2x²（二乗）' },
    { qid:'math_prop_s4_ch6', jp:'次のうち反比例はどれ？',
      answer:'y = 10/x', choices:['y = 10/x','y = 10x','y = x + 10','y = 10'],
      exp:'📐 y = a/x の形が反比例。<br>✅ y = 10/x → 比例定数 10<br>❌ y = 10x（比例）' },
    { qid:'math_prop_s4_ch7', jp:'y = 3x のグラフが通る点はどれ？',
      answer:'(2, 6)', choices:['(2, 6)','(3, 6)','(2, 9)','(1, 4)'],
      exp:'📐 y = 3x に x = 2 を代入 → y = 3 × 2 = 6 → 点 <span style="color:var(--gold)">(2, 6)</span> を通る' },
    { qid:'math_prop_s4_ch8', jp:'毎分 x L で水を入れ、満水 30 L になるまで y 分かかる。y と x の関係は？',
      answer:'y = 30/x（反比例）', choices:['y = 30/x（反比例）','y = 30x（比例）','y = x + 30','y = 30'],
      exp:'📐 x × y = 30（一定）→ <span style="color:var(--gold)">y = 30/x</span>（反比例）<br>💡 速さと時間の積が距離（一定）→ 反比例の典型例！' },
    { qid:'math_prop_s4_ch9', jp:'y = -2x のとき、x = -3 のときの y は？',
      answer:'6', choices:['6','-6','-1/6','2/3'],
      exp:'📐 y = -2 × (-3) = <span style="color:var(--gold)">6</span><br>💡 マイナス × マイナス = プラス！' },
  ];
  var inputQs=[
    { qid:'math_prop_s4_in0', jp:'y = 5x のとき、x = -3 のときの y は？', formula:'y = 5x　（x = -3）',
      answer:'-15', xp:5, hint:'y = 5 × (-3) = -15',
      exp:'y = 5 × (-3) = <span style="color:var(--gold)">-15</span>' },
    { qid:'math_prop_s4_in1', jp:'y が x に比例し、x = 4 のとき y = 20。x = 7 のときの y は？', formula:'x = 4 のとき y = 20（比例）、x = 7 のときの y = ?',
      answer:'35', xp:5, hint:'a = 20 ÷ 4 = 5 → y = 5x → y = 5 × 7 = 35',
      exp:'① a = 20 ÷ 4 = 5 → y = 5x<br>② y = 5 × 7 = <span style="color:var(--gold)">35</span>' },
    { qid:'math_prop_s4_in2', jp:'y = 36/x のとき、x = 9 のときの y は？', formula:'y = 36/x　（x = 9）',
      answer:'4', xp:5, hint:'y = 36 ÷ 9 = 4',
      exp:'y = 36 ÷ 9 = <span style="color:var(--gold)">4</span>' },
    { qid:'math_prop_s4_in3', jp:'y が x に反比例し、x = 3 のとき y = 8。比例定数は？', formula:'x = 3 のとき y = 8（反比例）',
      answer:'24', xp:6, hint:'a = x × y = 3 × 8 = 24',
      exp:'比例定数 a = x × y = 3 × 8 = <span style="color:var(--gold)">24</span>' },
    { qid:'math_prop_s4_in4', jp:'y = 12/x のとき、y = 3 となる x は？', formula:'y = 12/x のとき y = 3',
      answer:'4', xp:6, hint:'3 = 12/x → x = 12 ÷ 3 = 4',
      exp:'3 = 12/x → 3x = 12 → x = 12 ÷ 3 = <span style="color:var(--gold)">4</span>' },
  ];

  var html='<div class="section-header"><div class="section-badge">SECTION 4</div>'
    +'<div class="section-title">確認テスト</div><div class="section-sub">比例・反比例 まとめ——選択10問＋計算5問</div></div>'
    +'<div style="background:rgba(163,113,247,0.06);border:1px solid rgba(163,113,247,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">'
    +'<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:4px">📝 Section 1・2 の全範囲</div>'
    +'<div style="font-size:13px;color:var(--text2)">選択10問 ＋ 計算入力5問。全問解いたら結果を見よう！</div></div>'
    +'<div class="progress-dots">'+Array(15).fill(0).map(function(_,i){ return '<div class="dot '+(i===0?'current':'')+'"></div>'; }).join('')+'</div>'
    +'<div style="font-size:13px;color:var(--text2);margin:8px 0 14px;font-weight:bold">── 選択問題 ──</div>';
  choiceQs.forEach(function(q,i){ html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoices(q.qid,q.jp,q.answer,q.choices,q.exp); });
  html+='<div style="font-size:13px;color:var(--text2);margin:24px 0 14px;font-weight:bold">── 計算問題（入力） ──</div>';
  inputQs.forEach(function(q,i){ html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(choiceQs.length+i+1)+'</div>'+makeInputCard(q.qid,q.jp,q.formula,q.answer,q.xp,q.hint,q.exp); });
  html+='<button class="next-section-btn" id="nextBtn" data-goto="result" style="display:none">🏁 結果を見る！</button>';
  document.getElementById('mainContent').innerHTML=html;
  bindEvents();
  document.querySelectorAll('.next-section-btn[data-goto="result"]').forEach(function(b){
    b.addEventListener('click',function(){ showFinalResult(); });
  });
  updateDots();
}

function showFinalResult(){
  var prefix='math_prop_s4_';
  var sqs=Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix)===0; });
  var total=sqs.length||15;
  var correct=sqs.filter(function(id){ var d=weakDB[id]; return d&&d.total>0&&d.correct>0&&answeredSet[id]; }).length;
  var pct=Math.round(correct/total*100);
  var emoji=pct>=90?'🏆':pct>=70?'🎉':pct>=50?'😊':'😅';
  var msg=pct>=90?'きょん「完璧！！令和ロマンより賢い！！」<br>西村「満点に近い。本番でも間違えない」'
    :pct>=70?'きょん「なかなかやるじゃん俺！！」<br>西村「よくできてる。弱点をもう少し潰せば完璧だ」'
    :pct>=50?'きょん「半分以上いけた！！」<br>西村「惜しい問題が多い。解き直せば伸びる」'
    :'きょん「うーん、むずかった…」<br>西村「もう一度 Section 1 からやってみよう」';
  var ov=document.getElementById('resultOverlay');
  ov.style.display='block';
  ov.innerHTML='<div class="result-box">'
    +'<div class="result-title">確認テスト結果</div>'
    +'<div class="result-emoji">'+emoji+'</div>'
    +'<div class="result-score">'+correct+'<span> / '+total+'問正解</span></div>'
    +'<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--purple);margin-bottom:12px;">'+pct+'%</div>'
    +'<div class="result-msg">'+msg+'</div>'
    +'<button class="result-btn" id="res_tokku">🔥 弱点を特訓する</button>'
    +'<button class="result-btn" id="res_close" style="background:var(--bg3);color:var(--text2);">閉じる</button>'
    +'</div>';
  document.getElementById('res_tokku').addEventListener('click',function(){ ov.style.display='none'; goSection(6); });
  document.getElementById('res_close').addEventListener('click',function(){ ov.style.display='none'; });
}

// ===== SECTION 5: 弱点ノート =====
function renderWeakNote(){
  var wqs=Object.keys(weakDB).filter(function(id){ return id.indexOf('math_prop_')===0; });
  if(wqs.length===0){ document.getElementById('mainContent').innerHTML='<div style="text-align:center;padding:60px 20px"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-family:Bebas Neue,sans-serif;font-size:24px;color:var(--green)">弱点なし！</div><div style="font-size:14px;color:var(--text2);margin-top:8px">きょん「俺完璧じゃん！！」<br>西村「よくやった。次の単元へ進もう」</div></div>'; return; }
  var sorted=wqs.slice().sort(function(a,b){ return getPct(a)-getPct(b); });
  var html='<div class="section-header"><div class="section-badge">弱点ノート</div><div class="section-title">弱点一覧</div></div>';
  html+='<div style="display:flex;flex-direction:column;gap:10px;">';
  sorted.forEach(function(qid){
    var d=weakDB[qid]; if(!d||d.total===0) return;
    var pct=getPct(qid); var color=pct<40?'var(--red)':pct<70?'var(--purple)':'var(--green)';
    html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px;">'
      +'<div style="width:48px;height:48px;border-radius:50%;background:var(--bg3);border:2px solid '+color+';display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;font-size:14px;color:'+color+';flex-shrink:0;">'+pct+'%</div>'
      +'<div style="flex:1;min-width:0"><div style="font-size:14px;line-height:1.8;color:var(--text)">'+(d.jp||qid)+'</div><div style="font-size:12px;color:var(--text2)">正解 '+d.correct+' / '+d.total+' 回</div></div>'
      +'<div style="font-size:11px;color:var(--text2);white-space:nowrap">正答率<br><span style="font-size:16px;font-weight:bold;color:'+color+';">'+pct+'%</span></div></div>';
  });
  html+='</div><div style="text-align:center;margin-top:24px;"><button class="start-btn" id="go_tokku" style="max-width:320px;">🔥 特訓モードで練習する</button></div>';
  document.getElementById('mainContent').innerHTML=html;
  document.getElementById('go_tokku').addEventListener('click',function(){ goSection(6); });
}

// ===== SECTION 6: 特訓 =====
var tokkuQueue=[], tokkuIdx=0, tokkuSession={correct:0,total:0};
function renderTokku(){
  currentSection=6; renderTabs();
  var wqs=getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,15);
  var mc=document.getElementById('mainContent');
  if(wqs.length===0){ mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">🎊</div><div class="tokku-complete-title">弱点なし！</div><div class="tokku-complete-msg">きょん「弱点ゼロ！！天才！！」<br>西村「よくやった。次の単元へ進もう」</div></div>'; return; }
  tokkuQueue=shuffleArray(wqs); tokkuIdx=0; tokkuSession={correct:0,total:0};
  renderTokkuCard();
}
function renderTokkuCard(){
  var mc=document.getElementById('mainContent');
  if(tokkuIdx>=tokkuQueue.length){
    var pct=tokkuSession.total>0?Math.round(tokkuSession.correct/tokkuSession.total*100):0;
    mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">'+(pct>=80?'🏆':'🔥')+'</div>'
      +'<div class="tokku-complete-title">特訓完了！ '+tokkuSession.correct+'/'+tokkuSession.total+'問正解</div>'
      +'<div class="tokku-complete-msg">'+(pct>=80?'きょん「特訓完璧！！天才かも！！」<br>西村「よし。本番でも答えられるようにしよう」':'きょん「うーん、まだむずい…」<br>西村「もう一周やろう。繰り返しが大事だ」')+'</div>'
      +'<div style="margin-top:20px"><button class="start-btn" id="tokku_retry" style="max-width:280px;">もう一周する 🔄</button></div></div>';
    document.getElementById('tokku_retry').addEventListener('click',function(){ renderTokku(); });
    return;
  }
  var qid=tokkuQueue[tokkuIdx]; var d=weakDB[qid];
  if(!d){ tokkuIdx++; renderTokkuCard(); return; }
  var pct=getPct(qid); var color=pct<30?'var(--red)':pct<60?'var(--purple)':'var(--green)';
  var isChoice=d.choices&&d.choices.length>0;
  var answerArea='';
  if(isChoice){
    answerArea='<div class="tokku-choices">'+shuffleArray(d.choices).map(function(c){
      return '<button class="choice-btn" data-tqid="'+qid+'" data-tchoice="'+c.replace(/'/g,'&#39;')+'">'+c+'</button>';
    }).join('')+'</div>';
  } else {
    answerArea='<div class="input-wrap" style="justify-content:center">'
      +'<input class="q-input" id="tokku_inp_'+qid+'" type="text" placeholder="答え" style="max-width:160px">'
      +'<button id="tokku_sub_'+qid+'" style="background:var(--purple);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer">確認</button>'
      +'</div>';
  }
  mc.innerHTML='<div class="tokku-progress">🔥 特訓 '+(tokkuIdx+1)+' / '+tokkuQueue.length+'　今回: '+tokkuSession.correct+'/'+tokkuSession.total+'正解</div>'
    +'<div class="tokku-card">'
    +'<div class="tokku-stat">正答率: <span class="pct" style="color:'+color+'">'+pct+'%</span>（'+d.correct+'/'+d.total+'回）</div>'
    +'<div class="tokku-jp">'+(d.jp||qid)+'</div>'
    +answerArea
    +'<div class="tokku-result" id="tokku_result"></div>'
    +'<button id="tokku_next" style="display:none;margin-top:14px;background:var(--purple);color:#fff;border:none;padding:10px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer">次の問題 →</button>'
    +'</div>';
  document.querySelectorAll('.choice-btn[data-tqid]').forEach(function(b){
    b.addEventListener('click',function(){ handleTokkuAnswer(b.dataset.tqid, b.dataset.tchoice, true); });
  });
  var ti=document.getElementById('tokku_inp_'+qid);
  if(ti) ti.addEventListener('keydown',function(e){ if(e.key==='Enter') handleTokkuAnswer(qid,ti.value.trim(),false); });
  var tsub=document.getElementById('tokku_sub_'+qid);
  if(tsub) tsub.addEventListener('click',function(){ handleTokkuAnswer(qid,document.getElementById('tokku_inp_'+qid).value.trim(),false); });
  document.getElementById('tokku_next').addEventListener('click',function(){ tokkuIdx++; renderTokkuCard(); });
}
function normExpr(s){ return typeof s==='string'?s.replace(/\s*([-+])\s*/g,'$1').trim():s; }
function handleTokkuAnswer(qid,value,isChoice){
  var d=weakDB[qid]; if(!d) return;
  var correct=isChoice?normExpr(value)===normExpr(d.answer):mathMatch(value,d.answer);
  tokkuSession.total++; weakDB[qid].total++;
  if(correct){ weakDB[qid].correct++; tokkuSession.correct++; }
  localStorage.setItem('math_weakdb',JSON.stringify(weakDB));
  renderWeakBar(); renderTabs();
  if(isChoice){
    document.querySelectorAll('.tokku-card .choice-btn').forEach(function(b){ b.disabled=true; });
    document.querySelectorAll('.tokku-card .choice-btn').forEach(function(b){
      if(b.dataset.tchoice===value) b.classList.add(correct?'selected-correct':'selected-wrong');
      if(!correct && normExpr(b.dataset.tchoice||'')===normExpr(d.answer)) b.classList.add('show-correct');
    });
  }
  var newPct=getPct(qid);
  var res=document.getElementById('tokku_result');
  if(res){
    if(correct){
      xp++; localStorage.setItem('math_xp',xp); updateXP();
      res.className='tokku-result tokku-correct';
      res.innerHTML='✅ 正解！'+(newPct>=80?' 🎉 正答率'+newPct+'%！この問題は卒業！':' 正答率 → '+newPct+'%');
      showToast(getComment('kyon_correct'));
    } else {
      deductXP(3);
      res.className='tokku-result tokku-wrong';
      res.innerHTML='❌ 間違い！ 正答率 → '+newPct+'%<div class="tokku-answer">正解：'+d.answer+'</div>';
      showToast('きょん「また間違えた！！もう一回！！」');
    }
    res.style.display='block';
  }
  var tnext=document.getElementById('tokku_next');
  if(tnext) tnext.style.display='block';
}

// ===== INIT =====
updateXP(); renderWeakBar(); renderTabs(); goSection(0);
