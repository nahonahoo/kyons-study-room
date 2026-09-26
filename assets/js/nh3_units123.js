// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   label:'Lv.1 🥚', badge:'NSC入学',       title:'見習い研修生',       status:'きょん「英語？なにそれ食えるの？」' },
  { lv:2, min:20,  label:'Lv.2 🎤', badge:'NSC卒業',       title:'一般社員',           status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:45,  label:'Lv.3 🎭', badge:'劇場デビュー',   title:'主任',               status:'きょん「にっくん、俺英語できるかも」' },
  { lv:4, min:80,  label:'Lv.4 ⭐', badge:'準レギュラー獲得', title:'係長',             status:'きょん「もしかして俺天才？」' },
  { lv:5, min:120, label:'Lv.5 📺', badge:'全国ネット',     title:'課長',               status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:170, label:'Lv.6 🌟', badge:'冠番組獲得',    title:'部長',               status:'きょん「英語で漫才できるかもしれない」' },
  { lv:7, min:230, label:'Lv.7 🏆', badge:'M-1決勝進出',   title:'取締役',             status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:300, label:'Lv.8 👑', badge:'M-1グランプリ優勝', title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
// ===== 旧nh3u_*キーをnh3_*（教科共通プール）に統合（一度だけ実行） =====
// これまでUnit1〜4のXP/weakDBだけ別キー(nh3u_)に保存されていたため、
// ダッシュボードやショップの合計XP・弱点数に反映されない不具合があった。nh3_に統合する。
(function migrateNh3uToNh3(){
  if (localStorage.getItem('nh3u_migrated')) return;
  var oldXp = parseInt(localStorage.getItem('nh3u_xp') || '0', 10);
  if (oldXp > 0) {
    var curXp = parseInt(localStorage.getItem('nh3_xp') || '0', 10);
    localStorage.setItem('nh3_xp', String(curXp + oldXp));
  }
  ['answered','weakdb','grades'].forEach(function(suffix){
    var oldVal = JSON.parse(localStorage.getItem('nh3u_' + suffix) || '{}');
    var newVal = JSON.parse(localStorage.getItem('nh3_' + suffix) || '{}');
    Object.keys(oldVal).forEach(function(k){ newVal[k] = oldVal[k]; });
    localStorage.setItem('nh3_' + suffix, JSON.stringify(newVal));
  });
  localStorage.setItem('nh3u_migrated', '1');
})();

var xp = parseInt(localStorage.getItem('nh3_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('nh3_answered') || '{}');
var unitDone = JSON.parse(localStorage.getItem('nh3u_unitdone') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('nh3u_secdone') || '{}');
var weakDB = JSON.parse(localStorage.getItem('nh3_weakdb') || '{}');
var gradeCache = JSON.parse(localStorage.getItem('nh3_grades') || '{}');
var attemptCounts = {};

function getLevel(x) { for (var i=LEVELS.length-1;i>=0;i--) { if (x>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }
function getNextLevel(x) { var c=getLevel(x); for(var i=0;i<LEVELS.length;i++) { if(LEVELS[i].lv===c.lv+1) return LEVELS[i]; } return null; }

function updateXP() {
  var lv=getLevel(xp), next=getNextLevel(xp);
  var fromXP=lv.min, toXP=next?next.min:400;
  var pct=Math.min(100,Math.round((xp-fromXP)/(toXP-fromXP)*100));
  document.getElementById('xpFill').style.width=pct+'%';
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
  document.getElementById('xpLevel').textContent=lv.label;
  document.getElementById('xpBadge').textContent=lv.badge;
  document.getElementById('xpTitle').textContent=lv.title;
  document.getElementById('xpStatus').textContent=lv.status;
  document.getElementById('xpNext').textContent=next?xp+' XP ／ 次まで '+(next.min-xp)+' XP':'🏆 最高位到達！（'+xp+' XP）';
}
function addXP(pts,qid) {
  if (answeredSet[qid]) return 0;
  answeredSet[qid]=true;
  var prev=getLevel(xp).lv;
  xp+=pts;
  localStorage.setItem('nh3_xp',xp);
  localStorage.setItem('nh3_answered',JSON.stringify(answeredSet));
  updateXP();
  var now=getLevel(xp).lv;
  return now>prev?now:0;
}
function deductXP(pts) {
  var prev=getLevel(xp).lv;
  xp = Math.max(0, xp - pts);

  localStorage.setItem('nh3_xp',xp);
  updateXP();
  return getLevel(xp).lv<prev?prev:0;
}

// ===== AUDIO =====
var audioStore={}, currentAudioId=null;
function playAudio(id) {
  if (!window.speechSynthesis) return;
  var text=audioStore[id]; if (!text) return;
  var btn=document.getElementById('ab_'+id);
  if (currentAudioId===id) { window.speechSynthesis.cancel(); currentAudioId=null; btn&&btn.classList.remove('playing'); return; }
  if (currentAudioId) { var p=document.getElementById('ab_'+currentAudioId); p&&p.classList.remove('playing'); }
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=0.82;
  u.onend=function(){btn&&btn.classList.remove('playing'); if(currentAudioId===id)currentAudioId=null;};
  currentAudioId=id; btn&&btn.classList.add('playing'); window.speechSynthesis.speak(u);
}
function audioBtn(id,text) { audioStore[id]=text; return '<button class="audio-btn" id="ab_'+id+'" onclick="playAudio(\''+id+'\')" title="音声">🔊</button>'; }

// ===== TOAST =====
function showToast(msg,type) {
  var t=document.getElementById('toast');
  t.textContent=msg;
  if(type==='levelup') t.className='toast levelup';
  else if(type==='demote') t.className='toast demote';
  else t.className='toast';
  t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},type==='levelup'?4000:type==='demote'?3500:2500);
}

// ===== ARTIST COMMENTS =====
var ARTISTS = {
  correct:['きょん「合ってる合ってる！すごくない！？」','きょん「やった！正解！天才かも！」','きょん「にっくん見て！私より賢いかも！」','きょん「合ってる！もう英語得意になってるんじゃない！？」'],
  correct_nishi:['西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「正解。次も頼む」','西村「合ってる。広島でも東京でも通用するよ」'],
  wrong:['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！まだまだ大丈夫！！」','きょん「何回間違えてんの！！にっくんに怒られる！！」','きょん「もうやだ！！でも諦めないぞ！！答えを見ちゃおうかな…」'],
};
function getComment(t){var a=ARTISTS[t];return a[Math.floor(Math.random()*a.length)];}

// ===== WEAK DB =====
function recordResult(qid,isCorrect) {
  var meta=qMeta[qid]; if (!meta) return;
  if (!weakDB[qid]) weakDB[qid]={jp:meta.jp||'',answer:meta.answer||'',choices:meta.choices||[],exp:meta.exp||'',type:meta.type||'choice',correct:0,total:0};
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('nh3_weakdb',JSON.stringify(weakDB));
  renderWeakBar(); renderUnitTabs();
}
function getPct(qid){var d=weakDB[qid];if(!d||d.total===0)return 100;return Math.round(d.correct/d.total*100);}
function getWeakQuestions(){return Object.keys(weakDB).filter(function(q){var d=weakDB[q];return d.total>0&&getPct(q)<80;}).sort(function(a,b){return getPct(a)-getPct(b);});}
function renderWeakBar() {
  var wqs=getWeakQuestions(),el=document.getElementById('weakItems');if(!el)return;
  if(wqs.length===0){el.innerHTML='<span class="weak-bar-empty">弱点なし！すごい！</span>';return;}
  var top=wqs.slice(0,8);
  el.innerHTML=top.map(function(qid){
    var d=weakDB[qid],pct=getPct(qid);
    var color=pct<30?'#e94560':pct<60?'#f5c518':'#8b949e';
    var bar='';for(var i=0;i<5;i++)bar+='<span style="color:'+(i<Math.round(pct/20)?color:'#21262d')+'">█</span>';
    return '<div class="weak-item"><span class="weak-item-word">'+(d.jp||qid)+'</span><span>'+bar+'</span><span class="weak-item-pct">'+pct+'%</span></div>';
  }).join('');
}

// ===== QUESTION ENGINE =====
var qMeta={};
function normalize(s){return(s||'').trim().toLowerCase().replace(/[.,!?'"]/g,'').replace(/\s+/g,' ');}
function flexMatch(val,answer){
  var v=normalize(val),a=normalize(answer);
  if(v===a)return true;
  var aWords=a.split(' ').filter(function(w){return w.length>1;});
  return aWords.every(function(w){return v.indexOf(w)!==-1;});
}
function localSmartGrade(val,answer){
  var v=val.trim().toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ');
  var a=answer.trim().toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ');
  if(v===a)return{grade:'◎',xpRate:1.0,comment:'完璧！そのまま覚えよう！'};
  var vW=v.split(' '),aW=a.split(' ');
  var matched=aW.filter(function(w){return vW.indexOf(w)!==-1;});
  var rate=matched.length/aW.length;
  var gWords=['am','is','are','was','were','do','does','did',"don't","doesn't","didn't","wasn't","weren't",'not','been','have','has','had'];
  var aG=aW.filter(function(w){return gWords.indexOf(w)!==-1;});
  var vG=aG.filter(function(w){return vW.indexOf(w)!==-1;});
  var gramOk=aG.length===0||vG.length===aG.length;
  var orderOk=true;
  var key=aW.slice(0,3);var last=-1;
  key.forEach(function(w){var idx=vW.indexOf(w);if(idx===-1||idx<last)orderOk=false;else last=idx;});
  if(rate>=0.9&&gramOk&&orderOk)return{grade:'◎',xpRate:1.0,comment:'ほぼ完璧！文法もバッチリ！'};
  if(rate>=0.75&&gramOk&&orderOk)return{grade:'○',xpRate:0.6,comment:'惜しい！文法はOK、単語が少し違う。'};
  if(gramOk&&rate>=0.5)return{grade:'△',xpRate:0.2,comment:'文法語は合ってるけど単語が足りない。正解文をよく見よう。'};
  if(!gramOk&&rate>=0.6)return{grade:'△',xpRate:0.2,comment:'be動詞・助動詞が違う。もう一度確認！'};
  return{grade:'✗',xpRate:0,comment:'もう一度！正解文をよく見て覚えよう。'};
}

function makeChoices(qid,choices,answer,xpPts,jpText,expText){
  choices = choices.slice().sort(function(){ return Math.random() - 0.5; });
  qMeta[qid]={type:'choice',answer:answer,xp:xpPts,jp:jpText,exp:expText,choices:choices};
  if(answeredSet[qid]){
    return '<div class="choices">'+choices.map(function(c){
      return '<button class="choice-btn'+(c===answer?' show-correct':'')+'" disabled>'+c+'</button>';
    }).join('')+'</div>';
  }
  return '<div class="choices">'+choices.map(function(c){
    return '<button class="choice-btn" data-qid="'+qid+'" data-choice="'+c+'">'+c+'</button>';
  }).join('')+'</div>';
}
function makeCompositionInput(qid,answer,xpPts,jpText,expText){
  qMeta[qid]={type:'composition',answer:answer,xp:xpPts,jp:jpText,exp:expText,choices:[]};
  if(answeredSet[qid]){
    var g=gradeCache[qid]||{cls:'grade-perfect',icon:'✓',comment:'採点済み',xpRate:1,xpNote:''};
    return '<input disabled value="'+answer+'" class="q-input correct" id="qi_'+qid+'" data-qid="'+qid+'">'
      +'<div class="grade-result '+g.cls+'" style="display:block"><span class="grade-icon">'+g.icon+'</span><span class="grade-comment">'+g.comment+'</span><div class="grade-xp-note">'+g.xpNote+'</div></div>';
  }
  return '<input class="q-input" id="qi_'+qid+'" data-qid="'+qid+'" placeholder="英文を入力…（採点あり）">'
    +'<button class="check-btn" data-qid="'+qid+'">採点 ✓</button>'
    +'<div class="grade-result" id="gr_'+qid+'"></div>';
}
function makeFeedback(qid,explanation){
  var shown=answeredSet[qid]?'display:block':'display:none';
  return '<div class="q-feedback correct-fb" id="fb_'+qid+'" style="'+shown+'"><strong>✓ 正解！</strong></div>'
    +'<div class="q-feedback wrong-fb" id="fbw_'+qid+'" style="display:none">✗ もう一度チャレンジ！</div>'
    +'<div class="exp-card" id="exp_card_'+qid+'" style="'+shown+'"><div class="exp-card-title">📌 解説</div><div style="color:#e8e0d0;font-size:13px;line-height:2.0">'+explanation+'</div></div>'
    +'<button class="show-answer-btn" id="sab_'+qid+'" data-qid="'+qid+'">💡 答えを見る（XPなし）</button>'
    +'<div class="answer-revealed" id="ar_'+qid+'"><div class="ans-label">✅ 正解</div><div id="ar_ans_'+qid+'" style="font-size:18px;color:var(--gold);font-weight:bold;margin-bottom:6px"></div></div>'
    +'<div class="artist-comment" id="ac_'+qid+'" style="'+shown+'">'+(answeredSet[qid]?getComment('correct_nishi'):'')+'</div>';
}

function handleCheck(qid){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid])return;
  if(meta.type==='composition'){
    var val=(document.getElementById('qi_'+qid)||{}).value||'';
    if(!val.trim()){showToast('英文を入力してください！');return;}
    gradeComposition(qid,meta,val); return;
  }
  var val=(document.getElementById('qi_'+qid)||{}).value||'';
  if(flexMatch(val,meta.answer)) markCorrect(qid,meta);
  else markWrong(qid,meta);
}
function handleChoice(qid,choice){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid])return;
  if(choice===meta.answer) markCorrect(qid,meta,choice);
  else markWrong(qid,meta,choice);
}
function gradeComposition(qid,meta,val){
  var result=localSmartGrade(val,meta.answer);
  showGradeResult(qid,meta,val,result);
}
function showGradeResult(qid,meta,val,result){
  var grDiv=document.getElementById('gr_'+qid);
  var input=document.getElementById('qi_'+qid);
  var card=document.querySelector('[data-card="'+qid+'"]');
  var sab=document.getElementById('sab_'+qid);
  var grade=result.grade||'✗',xpRate=typeof result.xpRate==='number'?result.xpRate:0,comment=result.comment||'';
  var clsMap={'◎':'grade-perfect','○':'grade-good','△':'grade-partial','✗':'grade-wrong'};
  var iconMap={'◎':'✅','○':'🔵','△':'🟡','✗':'❌'};
  var cls=clsMap[grade]||'grade-wrong',icon=iconMap[grade]||'❌';
  var earnedXP=Math.round(meta.xp*xpRate);
  var xpNote=earnedXP>0?'＋'+earnedXP+' XP 獲得！':'XPなし';
  var wrongAns=grade!=='◎'?'<div style="margin-top:10px;border-radius:8px;overflow:hidden;"><div style="padding:8px 12px;background:rgba(233,69,96,0.08);border-left:3px solid var(--red);"><div style="font-size:11px;color:var(--text2);margin-bottom:3px">❌ あなたの回答</div><div style="font-family:Times New Roman,serif;font-size:16px;color:#f87171;">'+val+'</div></div><div style="padding:8px 12px;background:rgba(63,185,80,0.08);border-left:3px solid var(--green);margin-top:4px;"><div style="font-size:11px;color:var(--text2);margin-bottom:3px">✅ 正しい答え</div><div style="font-family:Times New Roman,serif;font-size:16px;color:var(--gold);font-weight:bold;">'+meta.answer+'</div></div></div>':'';
  var artistComment=xpRate>=1.0?getComment('correct_nishi'):xpRate>=0.5?'きょん「惜しい！あと少し！」':xpRate>0?'きょん「ちょっとだけわかってたよ！もう一回！」':getComment('wrong');
  if(grDiv){
    grDiv.className='grade-result '+cls;
    grDiv.innerHTML='<span class="grade-icon">'+icon+'</span><strong>'+grade+'</strong>　'+comment+wrongAns+'<div class="grade-xp-note" style="margin-top:8px">'+xpNote+'</div><div class="artist-comment" style="display:block;margin-top:6px">'+artistComment+'</div>';
    grDiv.style.display='block';
  }
  var cacheEntry={icon:icon,cls:cls,comment:grade+'　'+comment,xpRate:xpRate,xpNote:xpNote};
  gradeCache[qid]=cacheEntry; localStorage.setItem('nh3_grades',JSON.stringify(gradeCache));
  recordResult(qid,xpRate>0);
  if(xpRate>0){
    var lvUp=addXP(earnedXP,qid);
    if(lvUp){setTimeout(function(){var lv=getLevel(xp);showToast('🎉 昇格！ '+lv.badge+' → '+lv.title,'levelup');},500);}
    if(card)card.classList.add('correct-card');
    if(input)input.classList.add('correct');
    if(xpRate>=0.7)setTimeout(function(){showToast(artistComment);},300);
  } else {
    answeredSet[qid]=true;
    localStorage.setItem('nh3_answered',JSON.stringify(answeredSet));
    if(card)card.classList.add('wrong-card');
    if(input)input.classList.add('wrong');
    if(sab)sab.style.display='inline-block';
    setTimeout(function(){showToast(artistComment);},300);
  }
  checkSectionComplete();
}

function markCorrect(qid,meta,choice){
  recordResult(qid,true);
  var lvUp=addXP(meta.xp,qid);
  var card=document.querySelector('[data-card="'+qid+'"]');
  if(card)card.classList.add('correct-card');
  var input=document.getElementById('qi_'+qid);
  if(input){input.classList.add('correct');input.disabled=true;}
  var btn=document.querySelector('.check-btn[data-qid="'+qid+'"]');if(btn)btn.style.display='none';
  var fb=document.getElementById('fb_'+qid);if(fb)fb.style.display='block';
  var fbw=document.getElementById('fbw_'+qid);if(fbw)fbw.style.display='none';
  var ac=document.getElementById('ac_'+qid);if(ac){ac.textContent=getComment('correct_nishi');ac.style.display='block';}
  if(choice){
    document.querySelectorAll('.choice-btn[data-qid="'+qid+'"]').forEach(function(b){b.disabled=true;if(b.dataset.choice===meta.answer)b.classList.add('selected-correct');});
  }
  if(lvUp){setTimeout(function(){var lv=getLevel(xp);showToast('🎉 昇格！ '+lv.badge+' → '+lv.title,'levelup');},400);}
  else{setTimeout(function(){showToast(getComment('correct'));},300);}
  checkSectionComplete();
}
function markWrong(qid,meta,choice){
  recordResult(qid,false);
  attemptCounts[qid]=(attemptCounts[qid]||0)+1;
  var card=document.querySelector('[data-card="'+qid+'"]');
  if(card){card.classList.add('wrong-card');setTimeout(function(){card.classList.remove('wrong-card');},600);}
  var input=document.getElementById('qi_'+qid);
  if(input){input.classList.add('wrong');setTimeout(function(){input.classList.remove('wrong');},400);}
  var fbw=document.getElementById('fbw_'+qid);if(fbw)fbw.style.display='block';
  if(choice){
    var btn=document.querySelector('.choice-btn[data-qid="'+qid+'"][data-choice="'+choice+'"]');
    if(btn){btn.classList.add('selected-wrong');setTimeout(function(){btn.classList.remove('selected-wrong');},600);}
  }
  if(attemptCounts[qid]>=2){var sab=document.getElementById('sab_'+qid);if(sab)sab.style.display='inline-block';}
  var demoted=deductXP(5);
  var msgs=ARTISTS.wrong;
  var msg=msgs[Math.min(msgs.length-1,attemptCounts[qid]-1)];
  if(demoted){setTimeout(function(){var lv=getLevel(xp);showToast('💦 降格… '+lv.badge+'に戻った… きょん「せっかく昇格したのに！」','demote');},200);}
  else{setTimeout(function(){showToast(msg);},100);}
}
function showAnswer(qid){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid])return;
  answeredSet[qid]=true;
  localStorage.setItem('nh3_answered',JSON.stringify(answeredSet));
  var arAns=document.getElementById('ar_ans_'+qid);if(arAns)arAns.textContent=meta.answer;
  var ar=document.getElementById('ar_'+qid);if(ar)ar.style.display='block';
  var sab=document.getElementById('sab_'+qid);if(sab)sab.style.display='none';
  var input=document.getElementById('qi_'+qid);if(input){input.disabled=true;input.value=meta.answer;}
  var checkBtn=document.querySelector('.check-btn[data-qid="'+qid+'"]');if(checkBtn)checkBtn.style.display='none';
  document.querySelectorAll('.choice-btn[data-qid="'+qid+'"]').forEach(function(b){b.disabled=true;if(b.dataset.choice===meta.answer)b.classList.add('show-correct');});
  var fbw=document.getElementById('fbw_'+qid);if(fbw)fbw.style.display='none';
  var ac=document.getElementById('ac_'+qid);
  if(ac){ac.textContent='きょん「ふーん、そういうことか。覚えた！次は自分でできる！」';ac.style.display='block';}
  showToast('西村「答えを見るのも学習のうち。次は自分で解いてみよう」');
  checkSectionComplete();
}
function checkSectionComplete(){
  var allQ=Object.keys(qMeta);
  var secQ=allQ.filter(function(id){return id.startsWith(currentUnit+'_s'+currentSection+'_');});
  if(secQ.length>0&&secQ.every(function(id){return answeredSet[id];})){
    var key=currentUnit+'_'+currentSection;
    sectionDone[key]=true;
    localStorage.setItem('nh3u_secdone',JSON.stringify(sectionDone));
    renderSectionTabs();
    var nb=document.getElementById('nextBtn');if(nb)nb.style.display='block';
  }
}

// ===== UNITS =====
var currentUnit=1, currentSection=0;
var UNITS=[
  {id:1,label:'受け身',title:'受け身'},
  {id:2,label:'現在完了①',title:'現在完了①'},
  {id:3,label:'現在完了②',title:'現在完了②'},
  {id:4,label:'不定詞',title:'不定詞のいろいろな形（教科書 実Unit3）'},
];

var UNIT_SECTIONS={
  1:[
    {id:0,label:'導入'},
    {id:1,label:'基本形'},
    {id:2,label:'疑問・否定'},
    {id:3,label:'過去の受け身'},
    {id:4,label:'確認テスト'},
    {id:5,label:'🔥特訓'},
  ],
  2:[
    {id:0,label:'導入'},
    {id:1,label:'経験（have+pp）'},
    {id:2,label:'never/ever'},
    {id:3,label:'回数・疑問文'},
    {id:4,label:'確認テスト'},
    {id:5,label:'🔥特訓'},
  ],
  3:[
    {id:0,label:'導入'},
    {id:1,label:'継続（for/since）'},
    {id:2,label:'完了（just/already）'},
    {id:3,label:'混合練習'},
    {id:4,label:'確認テスト'},
    {id:5,label:'🔥特訓'},
  ],
  4:[
    {id:0,label:'単語準備'},
    {id:1,label:'It is...for to'},
    {id:2,label:'want/tell+to'},
    {id:3,label:'let/help+原形'},
    {id:4,label:'確認テスト'},
    {id:5,label:'🔥特訓'},
  ],
};

function renderUnitTabs(){
  var html='';
  UNITS.forEach(function(u){
    var cls='unit-tab'+(u.id===currentUnit?' active':'');
    html+='<button class="'+cls+'" onclick="goUnit('+u.id+')">'+u.label+'</button>';
  });
  document.getElementById('unitTabs').innerHTML=html;
}
function renderSectionTabs(){
  var secs=UNIT_SECTIONS[currentUnit];
  var html='';
  secs.forEach(function(s){
    var key=currentUnit+'_'+s.id;
    var cls='section-tab';
    if(s.id===currentSection)cls+=' active';
    if(s.id===5)cls+=' tokku';
    if(sectionDone[key]&&s.id!==5)cls+=' done';
    var wk=getWeakQuestions().filter(function(q){return q.startsWith(currentUnit+'_');});
    var label=s.label+(sectionDone[key]&&s.id!==5?' ✓':'');
    if(s.id===5)label='🔥特訓'+(wk.length>0?'('+wk.length+')':'');
    html+='<button class="'+cls+'" onclick="goSection('+s.id+')">'+label+'</button>';
  });
  document.getElementById('sectionTabs').innerHTML=html;
}
function goUnit(uid){currentUnit=uid;currentSection=0;qMeta={};renderUnitTabs();renderSectionTabs();renderSection(uid,0);window.scrollTo(0,0);}
function goSection(sid){currentSection=sid;qMeta={};renderSectionTabs();renderSection(currentUnit,sid);window.scrollTo(0,0);}

// ===== RENDER =====
function renderSection(uid,sid){
  if(sid===5){renderTokkuMode(uid);return;}
  var secData=UNIT_SECTIONS[uid][sid];
  var secs=UNIT_SECTIONS[uid];
  var html='<div class="progress-dots">';
  secs.forEach(function(s){
    var cls='dot';
    if(s.id<sid)cls+=' done';
    if(s.id===sid)cls+=' current';
    html+='<div class="'+cls+'"></div>';
  });
  html+='</div>';
  var _uObj=UNITS.filter(function(u){return u.id===uid;})[0];
  html+='<div class="section-badge">'+(_uObj?_uObj.label:('UNIT '+uid))+' · SECTION '+sid+'</div>';

  if(uid===1)html+=renderUnit1Section(sid);
  else if(uid===2)html+=renderUnit2Section(sid);
  else if(uid===3)html+=renderUnit3Section(sid);
  else if(uid===4)html+=renderUnit4Section(sid);

  var isLast=(sid===4);
  html+='<button class="next-section-btn" id="nextBtn" onclick="'+(isLast?'goUnit('+(uid<4?uid+1:1)+')':'goSection('+(sid+1)+')')+'">'+(isLast?'✓ 次のUnitへ →':'次のセクションへ →')+'</button>';

  document.getElementById('mainContent').innerHTML=html;

  document.querySelectorAll('.check-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){handleCheck(btn.dataset.qid);});});
  document.querySelectorAll('.q-input[data-qid]').forEach(function(inp){inp.addEventListener('keydown',function(e){if(e.key==='Enter')handleCheck(inp.dataset.qid);});});
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){handleChoice(btn.dataset.qid,btn.dataset.choice);});});
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){showAnswer(btn.dataset.qid);});});

  var key=currentUnit+'_'+sid;
  if(sectionDone[key]){var nb=document.getElementById('nextBtn');if(nb)nb.style.display='block';}
  checkSectionComplete();
}

function qCard(qid,content){return '<div class="q-card" data-card="'+qid+'">'+content+'</div>';}
function qNum(n){return '<div class="q-number">Q'+n+'</div>';}
function exList(uid,sid,arr){
  return '<ul class="example-list">'+arr.map(function(e,i){
    var aid=uid+'_s'+sid+'_ex_'+i; audioStore[aid]=e[0];
    return '<li class="example-item"><button class="audio-btn" id="ab_'+aid+'" onclick="playAudio(\''+aid+'\')" title="音声">🔊</button><span class="en">'+e[0]+'</span><span class="jp">'+e[1]+'</span></li>';
  }).join('')+'</ul>';
}
function dialog(lines){
  return '<div class="intro-box"><div class="intro-box-title">📺 きょん＆西村の会話</div>'+lines.map(function(l){
    var isK=l.who==='kyon';
    return '<div class="chat-line"><div class="avatar '+(isK?'av-kyon':'av-nishi')+'">'+(isK?'😄':'慶')+'</div><div><div class="chat-name">'+(isK?'きょん':'西村（慶応卒・元アナ）')+'</div><div class="chat-bubble">'+l.text+'</div></div></div>';
  }).join('')+'</div>';
}

// ============================
// UNIT 1: 受け身
// ============================
function renderUnit1Section(sid){
  var uid=1,html='';
  if(sid===0){
    html+='<div class="section-title">受け身（受動態）</div><div class="section-sub">「〜される・〜された」という表現。英語では be動詞 + 過去分詞 で作ります。</div>';
    html+=dialog([
      {who:'kyon',text:'「この絵はピカソによって描かれた」って英語でどう言うの？'},
      {who:'nishi',text:'受け身、つまり受動態だよ。be動詞＋過去分詞で作る。「This picture was painted by Picasso.」こんな形。'},
      {who:'kyon',text:'was painted！過去分詞ってwatchedとかwentみたいなやつ？'},
      {who:'nishi',text:'正確。規則動詞はedをつける。不規則動詞は別の形になる。paint→painted、make→made、write→written という感じ。'},
      {who:'kyon',text:'by Picasso の「by」は「〜によって」ってこと？知ってる！'},
    ]);
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 受け身の基本構造</div>';
    html+='<div class="formula-box">主語 + <span class="highlight">be動詞</span> + <span class="highlight">過去分詞</span> + （by 〜）<br><small style="color:var(--text2)">能動態: The chef <strong>cooks</strong> the food.</small><br><span class="arrow">↓ 受け身に変換</span><br>受動態: The food <span class="highlight">is cooked</span> by the chef.</div>';
    html+=exList(uid,sid,[
      ['English is spoken in many countries.','英語は多くの国で話されています。'],
      ['This song is loved by young people.','この歌は若者に愛されています。'],
      ['The book was written by a famous author.','その本は有名な作家によって書かれました。'],
      ['Mt. Fuji is known all over the world.','富士山は世界中に知られています。'],
      ['These photos were taken by my friend.','これらの写真は私の友達が撮りました。'],
    ]);
    html+='</div>';
    html+='<div style="text-align:center;margin-top:24px"><button onclick="goSection(1)" class="unit-complete-btn">📖 練習問題へ →</button></div>';
  }
  else if(sid===1){
    html+='<div class="section-title">受け身の基本形</div><div class="section-sub">現在の受け身：am/is/are + 過去分詞</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 ポイント：重要な過去分詞</div>';
    html+='<div class="grammar-rule"><div class="rule-title">規則動詞（-ed）</div><div class="en">use→used, love→loved, make→made, call→called, teach→taught</div></div>';
    html+='<div class="grammar-rule"><div class="rule-title">不規則動詞（要暗記）</div><div class="en">write→written, speak→spoken, sing→sung, take→taken, see→seen, know→known, give→given, break→broken</div></div></div>';
    html+='<div class="practice-section"><div class="practice-title">✏️ 練習問題 — 受け身の文を完成させよう</div>';
    var qs=[
      {q:'English ___ spoken in Australia.',jp:'英語はオーストラリアで話されています。',a:'is',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身の基本形</span>主語 + <strong>is/are/am</strong> + 過去分詞</span><span class="exp-ok">✅ English is spoken in Australia.</span><span class="exp-tip">💡 English（単数）→ is。受け身 = be動詞 + 過去分詞</span>',xp:3},
      {q:'These cars ___ made in Japan.',jp:'これらの車は日本で作られています。',a:'are',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身：複数主語</span>複数 → <strong>are</strong> + 過去分詞</span><span class="exp-ok">✅ These cars are made in Japan.</span><span class="exp-tip">💡 These cars（複数）→ are。make の過去分詞は made</span>',xp:3},
      {q:'This letter ___ written by Kyon.',jp:'この手紙はきょんによって書かれました。',a:'is',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身</span>This letter（単数）→ <strong>is</strong> + 過去分詞</span><span class="exp-ok">✅ This letter is written by Kyon.</span><span class="exp-tip">💡 write の過去分詞は written（不規則）</span>',xp:3},
      {q:'Manzai ___ loved by many people.',jp:'漫才は多くの人に愛されています。',a:'is',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身</span>Manzai（単数）→ <strong>is</strong> loved</span><span class="exp-ok">✅ Manzai is loved by many people.</span><span class="exp-tip">💡 「by + 人」= 〜によって（省略できる場合もある）</span>',xp:3},
      {q:'I ___ called "Kyon" by everyone.',jp:'私はみんなに「きょん」と呼ばれています。',a:'am',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身：I の場合</span>I → <strong>am</strong> + 過去分詞</span><span class="exp-ok">✅ I am called "Kyon" by everyone.</span><span class="exp-tip">💡 I → am。受け身でも am/is/are の使い分けは変わらない</span>',xp:3},
      {q:'The rules ___ known by all players.',jp:'ルールは全選手に知られています。',a:'are',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身：複数</span>The rules（複数）→ <strong>are</strong> known</span><span class="exp-ok">✅ The rules are known by all players.</span><span class="exp-tip">💡 know の過去分詞は known（不規則）</span>',xp:4},
      {q:'Japanese ___ spoken in this town.',jp:'この町では日本語が話されています。',a:'is',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身：言語名</span>Japanese / English / French → 単数扱い → <strong>is</strong></span><span class="exp-ok">✅ Japanese is spoken in this town.</span><span class="exp-tip">💡 言語名は常に単数扱い → is</span>',xp:4},
      {q:'Cotton ___ known as a great duo.',jp:'コットンは素晴らしいコンビとして知られています。',a:'is',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身：固有名詞</span>Cotton（グループ名・単数扱い）→ <strong>is</strong> known</span><span class="exp-ok">✅ Cotton is known as a great duo.</span><span class="exp-tip">💡 as ＝「〜として」。known as 〜 でよく使う表現</span>',xp:4},
    ];
    qs.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='<div class="practice-title" style="margin-top:20px">✏️ 英作文問題</div>';
    var qb=[
      {jp:'この映画は世界中で見られています。',a:'This movie is watched all over the world.',exp:'<span class="exp-rule"><span class="label">📐 受け身の作り方</span>This movie（単数）→ is + watched</span><span class="exp-ok">✅ This movie is watched all over the world.</span><span class="exp-tip">💡 watch は規則動詞なので過去分詞は watched（ed）</span>',xp:6},
      {jp:'これらの歌は若者に好かれています。',a:'These songs are liked by young people.',exp:'<span class="exp-rule"><span class="label">📐 受け身：複数</span>These songs（複数）→ are liked</span><span class="exp-ok">✅ These songs are liked by young people.</span><span class="exp-tip">💡 like は規則動詞：liked。eで終わるのでdだけつける</span>',xp:6},
      {jp:'英語はニュージーランドで話されています。',a:'English is spoken in New Zealand.',exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>speak → spoke → <strong>spoken</strong></span><span class="exp-ok">✅ English is spoken in New Zealand.</span><br><span class="exp-ng">❌ is speaked（×）</span><span class="exp-tip">💡 speak-spoke-spoken。受け身では過去分詞 spoken を使う</span>',xp:7},
      {jp:'このケーキはきょんの母によって作られました。',a:'This cake is made by Kyon&#39;s mother.',exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>make → made → <strong>made</strong>（過去形も過去分詞も同じ）</span><span class="exp-ok">✅ This cake is made by Kyon&#39;s mother.</span><span class="exp-tip">💡 make-made-made。過去形と過去分詞が同じ動詞</span>',xp:7},
    ];
    qb.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===2){
    html+='<div class="section-title">受け身の疑問文・否定文</div><div class="section-sub">疑問文はbe動詞を文頭に・否定文はbe動詞の後にnot</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 疑問文と否定文のパターン</div>';
    html+='<div class="formula-box">疑問文: <span class="highlight">Be動詞</span> + 主語 + 過去分詞 ...?<br>否定文: 主語 + <span class="highlight">be動詞 + not</span> + 過去分詞</div>';
    html+=exList(uid,sid,[
      ['Is this language spoken in Brazil?','この言語はブラジルで話されますか？'],
      ['Yes, it is. / No, it is not (isn\'t).','はい。/ いいえ。'],
      ['Was this book written by Natsume Soseki?','この本は夏目漱石によって書かれましたか？'],
      ['English is not spoken in Japan as a first language.','英語は日本では第一言語として話されていません。'],
      ['This song was not sung by Cotton.','この歌はコットンによって歌われたのではありません。'],
    ]);
    html+='</div><div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs2=[
      {q:'___ this picture painted by a student?',jp:'この絵は学生によって描かれましたか？',a:'Was',choices:['Is','Was','Were'],exp:'<span class="exp-rule"><span class="label">📐 受け身の疑問文</span><strong>Was/Were</strong> + 主語 + 過去分詞 ...?</span><span class="exp-ok">✅ Was this picture painted by a student?</span><span class="exp-tip">💡 受け身の疑問文 → be動詞を文頭に。過去なので Was</span>',xp:4},
      {q:'___ these cars made in Germany?',jp:'これらの車はドイツで作られていますか？',a:'Are',choices:['Is','Are','Were'],exp:'<span class="exp-rule"><span class="label">📐 受け身の疑問文（現在・複数）</span><strong>Are</strong> + these cars + 過去分詞 ...?</span><span class="exp-ok">✅ Are these cars made in Germany?</span><span class="exp-tip">💡 現在・複数 → Are。過去・複数 → Were</span>',xp:4},
      {q:'This room ___ not cleaned yesterday.',jp:'この部屋は昨日掃除されませんでした。',a:'was',choices:['is','was','were'],exp:'<span class="exp-rule"><span class="label">📐 受け身の否定文</span>主語 + be動詞 + <strong>not</strong> + 過去分詞</span><span class="exp-ok">✅ This room was not cleaned yesterday.</span><br><span class="exp-ok">✅ This room wasn<span class="exp-rule"><span class="label">📐 受け身の否定文</span>主語 + be動詞 + <strong>not</strong> + 過去分詞</span><span class="exp-ok">✅ This room was not cleaned yesterday.</span><br><span class="exp-ok">✅ This room wasn&#39;t cleaned yesterday.</span><span class="exp-tip">💡 yesterday → 過去 → was not</span>',xp:4},
      {q:'French ___ not spoken in this area.',jp:'この地域ではフランス語は話されていません。',a:'is',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身の否定（現在）</span>主語 + <strong>is not</strong> + 過去分詞</span><span class="exp-ok">✅ French is not spoken in this area.</span><span class="exp-tip">💡 French（言語名・単数）→ is not spoken</span>',xp:4},
      {q:'___ the concert canceled last week?',jp:'コンサートは先週中止されましたか？',a:'Was',choices:['Is','Was','Were'],exp:'<span class="exp-rule"><span class="label">📐 過去受け身疑問文</span><strong>Was</strong> + 単数主語 + 過去分詞 ...?</span><span class="exp-ok">✅ Was the concert canceled last week?</span><span class="exp-tip">💡 cancel の過去分詞は canceled（規則動詞）</span>',xp:5},
      {q:'___ these rules understood by everyone?',jp:'これらのルールは皆に理解されましたか？',a:'Were',choices:['Was','Were','Are'],exp:'<span class="exp-rule"><span class="label">📐 過去受け身疑問文（複数）</span><strong>Were</strong> + 複数主語 + 過去分詞 ...?</span><span class="exp-ok">✅ Were these rules understood by everyone?</span><span class="exp-tip">💡 understand の過去分詞は understood（不規則）</span>',xp:5},
    ];
    qs2.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    var qb2=[
      {jp:'この歌はプロによって歌われましたか？',a:'Was this song sung by a professional?',exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>sing → sang → <strong>sung</strong></span><span class="exp-ok">✅ Was this song sung by a professional?</span><br><span class="exp-ng">❌ Was this song singed（×）</span><span class="exp-tip">💡 sing-sang-sung（原形-過去-過去分詞）</span>',xp:7},
      {jp:'この建物は学生には使われていません。',a:'This building is not used by students.',exp:'<span class="exp-rule"><span class="label">📐 受け身の否定</span>is not + 過去分詞</span><span class="exp-ok">✅ This building is not used by students.</span><span class="exp-tip">💡 use は規則動詞：used（eで終わるのでdだけ）</span>',xp:7},
      {jp:'その試合は昨日テレビで放送されましたか？',a:'Was the game broadcast on TV yesterday?',exp:'broadcast の過去分詞は broadcast（変化なし）。過去受け身疑問文。',xp:8},
    ];
    qb2.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs2.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===3){
    html+='<div class="section-title">過去の受け身</div><div class="section-sub">was/were + 過去分詞 ＝「〜された（過去）」</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 現在の受け身 vs 過去の受け身</div>';
    html+='<div class="formula-box">現在: <span class="highlight">am/is/are</span> + 過去分詞<br>過去: <span class="highlight">was/were</span> + 過去分詞</div>';
    html+=exList(uid,sid,[
      ['The Eiffel Tower was built in 1889.','エッフェル塔は1889年に建てられました。'],
      ['This novel was written 100 years ago.','この小説は100年前に書かれました。'],
      ['The windows were broken by the wind.','窓は風によって割られました。'],
      ['Many people were injured in the accident.','その事故で多くの人が負傷しました。'],
      ['Cotton was formed in 2013.','コットンは2013年に結成されました。'],
    ]);
    html+='</div><div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs3=[
      {q:'The letter ___ written by Kyon yesterday.',jp:'その手紙は昨日きょんによって書かれました。',a:'was',choices:['is','was','were'],exp:'<span class="exp-rule"><span class="label">📐 過去の受け身</span>was/were + 過去分詞</span><span class="exp-ok">✅ The letter was written by Kyon yesterday.</span><span class="exp-tip">💡 単数+過去 → was。write の過去分詞は written</span>',xp:3},
      {q:'These buildings ___ built 50 years ago.',jp:'これらの建物は50年前に建てられました。',a:'were',choices:['was','were','are'],exp:'<span class="exp-rule"><span class="label">📐 過去の受け身：複数</span>These buildings（複数・過去）→ <strong>were built</strong></span><span class="exp-ok">✅ These buildings were built 50 years ago.</span><span class="exp-tip">💡 build の過去分詞は built（不規則）</span>',xp:3},
      {q:'The M-1 Grand Prix ___ held last year.',jp:'M-1グランプリは去年開催されました。',a:'was',choices:['is','was','were'],exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>hold → held → <strong>held</strong></span><span class="exp-ok">✅ The M-1 Grand Prix was held last year.</span><span class="exp-tip">💡 hold-held-held（過去形と過去分詞が同じ）</span>',xp:4},
      {q:'Many songs ___ sung at the concert.',jp:'コンサートでは多くの歌が歌われました。',a:'were',choices:['was','were','are'],exp:'<span class="exp-rule"><span class="label">📐 過去受け身：複数</span>Many songs（複数・過去）→ <strong>were sung</strong></span><span class="exp-ok">✅ Many songs were sung at the concert.</span><span class="exp-tip">💡 sing-sang-sung（過去分詞は sung）</span>',xp:4},
      {q:'The new park ___ opened last month.',jp:'その新しい公園は先月オープンしました。',a:'was',choices:['is','was','were'],exp:'<span class="exp-rule"><span class="label">📐 過去受け身</span>The new park（単数・過去）→ <strong>was opened</strong></span><span class="exp-ok">✅ The new park was opened last month.</span><span class="exp-tip">💡 open は規則動詞：opened（ed）</span>',xp:4},
      {q:'Japanese comedy ___ introduced to the world.',jp:'日本のお笑いは世界に紹介されました。',a:'was',choices:['is','was','were'],exp:'<span class="exp-rule"><span class="label">📐 過去受け身</span>Japanese comedy（単数・過去）→ <strong>was introduced</strong></span><span class="exp-ok">✅ Japanese comedy was introduced to the world.</span><span class="exp-tip">💡 introduce は規則動詞：introduced</span>',xp:4},
      {q:'These jokes ___ not understood abroad.',jp:'これらのジョークは海外では理解されませんでした。',a:'were',choices:['was','were','are'],exp:'<span class="exp-rule"><span class="label">📐 過去受け身の否定</span>These jokes（複数・過去否定）→ <strong>were not understood</strong></span><span class="exp-ok">✅ These jokes were not understood abroad.</span><span class="exp-tip">💡 understand の過去分詞は understood（不規則）</span>',xp:5},
      {q:'The game ___ played on a big stage.',jp:'その試合は大きなステージで行われました。',a:'was',choices:['is','was','were'],exp:'<span class="exp-rule"><span class="label">📐 過去受け身</span>The game（単数・過去）→ <strong>was played</strong></span><span class="exp-ok">✅ The game was played on a big stage.</span><span class="exp-tip">💡 play は規則動詞：played（ed）</span>',xp:4},
    ];
    qs3.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    var qb3=[
      {jp:'その映画は2年前に作られました。',a:'The movie was made two years ago.',exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>make → made → <strong>made</strong></span><span class="exp-ok">✅ The movie was made two years ago.</span><span class="exp-tip">💡 make-made-made（過去形も過去分詞も made）</span>',xp:6},
      {jp:'たくさんのメダルが選手たちに与えられました。',a:'Many medals were given to the athletes.',exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>give → gave → <strong>given</strong></span><span class="exp-ok">✅ Many medals were given to the athletes.</span><span class="exp-tip">💡 give-gave-given。「〜に与えられた」→ given to 〜</span>',xp:7},
      {jp:'この歌はコットンに歌われましたか？',a:'Was this song sung by Cotton?',exp:'<span class="exp-rule"><span class="label">📐 過去受け身の疑問文</span><strong>Was</strong> + this song + 過去分詞 ...?</span><span class="exp-ok">✅ Was this song sung by Cotton?</span><span class="exp-tip">💡 sing-sang-sung（過去分詞は sung）</span>',xp:7},
      {jp:'そのビルは100年前に建てられました。',a:'The building was built 100 years ago.',exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>build → built → <strong>built</strong></span><span class="exp-ok">✅ The building was built 100 years ago.</span><span class="exp-tip">💡 build-built-built（過去形と過去分詞が同じ）</span>',xp:6},
    ];
    qb3.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs3.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===4){
    html+='<div class="section-title">受け身 確認テスト</div><div class="section-sub">受け身の総まとめ！全問正解を目指そう。</div>';
    html+='<div class="practice-section"><div class="practice-title">📝 確認テスト（全20問）</div>';
    var test=[
      {q:'English ___ spoken in Canada.',jp:'英語はカナダで話されています。',a:'is',choices:['am','is','are'],exp:'Canada全体→単数扱い → is spoken。',xp:2},
      {q:'These books ___ read by many students.',jp:'これらの本は多くの生徒に読まれています。',a:'are',choices:['am','is','are'],exp:'These books（複数）→ are read。',xp:2},
      {q:'I ___ called "Nishimura" at work.',jp:'私は職場で「西村」と呼ばれています。',a:'am',choices:['am','is','are'],exp:'<span class="exp-rule"><span class="label">📐 受け身：I の場合</span>I → <strong>am</strong> + 過去分詞</span><span class="exp-ok">✅ I am called "Kyon" by everyone.</span><span class="exp-tip">💡 I → am。受け身でも am/is/are の使い分けは変わらない</span>',xp:2},
      {q:'This song ___ loved by everyone.',jp:'この歌は皆に愛されています。',a:'is',choices:['am','is','are'],exp:'This song（単数）→ is loved。',xp:2},
      {q:'___ this letter written by Kyon?',jp:'この手紙はきょんによって書かれましたか？',a:'Was',choices:['Is','Was','Were'],exp:'過去受け身疑問文（単数）→ Was。',xp:3},
      {q:'The windows ___ not broken by us.',jp:'窓は私たちによって割られたのではありません。',a:'were',choices:['is','was','were'],exp:'過去の受け身否定（複数）→ were not broken。',xp:3},
      {q:'This museum ___ built in 1920.',jp:'この美術館は1920年に建てられました。',a:'was',choices:['is','was','were'],exp:'過去の受け身（単数）→ was built。buildの過去分詞はbuilt。',xp:3},
      {q:'Many people ___ invited to the party.',jp:'多くの人がパーティーに招待されました。',a:'were',choices:['was','were','are'],exp:'過去の受け身（複数）→ were invited。',xp:3},
      {q:'___ French spoken in this country?',jp:'この国ではフランス語が話されていますか？',a:'Is',choices:['Is','Was','Are'],exp:'現在受け身疑問文（French=単数）→ Is。',xp:3},
      {q:'The M-1 ___ watched by millions of people.',jp:'M-1は何百万人もの人に見られました。',a:'was',choices:['is','was','were'],exp:'過去の受け身（単数）→ was watched。',xp:3},
      {q:'Rice ___ grown in many parts of Japan.',jp:'米は日本の多くの地域で育てられています。',a:'is',choices:['am','is','are'],exp:'現在の受け身（Rice=単数）→ is grown。',xp:3},
      {q:'These rules ___ not followed by everyone.',jp:'これらのルールは全員によって守られているわけではありません。',a:'are',choices:['am','is','are'],exp:'現在の受け身否定（複数）→ are not followed。',xp:3},
      {q:'The cake ___ eaten by the children.',jp:'そのケーキは子供たちに食べられました。',a:'was',choices:['is','was','were'],exp:'過去の受け身（The cake=単数）→ was eaten。',xp:3},
      {q:'___ these pictures taken by a professional?',jp:'これらの写真はプロによって撮られましたか？',a:'Were',choices:['Is','Was','Were'],exp:'過去受け身疑問文（複数）→ Were。',xp:4},
      {q:'The letter ___ not sent yesterday.',jp:'その手紙は昨日送られませんでした。',a:'was',choices:['is','was','were'],exp:'過去の受け身否定（単数）→ was not sent。',xp:4},
      {q:'Japanese is ___ all over the world.',jp:'日本語は世界中で話されています。',a:'spoken',choices:['speak','spoke','spoken'],exp:'受け身の文 → be動詞 + 過去分詞。speakの過去分詞はspoken。',xp:4},
      {q:'This bridge was ___ 200 years ago.',jp:'この橋は200年前に建てられました。',a:'built',choices:['build','built','building'],exp:'受け身の文 → be動詞 + 過去分詞。buildの過去分詞はbuilt。',xp:4},
      {q:'The song was ___ by Shimofuriboshi.',jp:'その歌は霜降り明星によって歌われました。',a:'sung',choices:['sing','sang','sung'],exp:'受け身の文 → be動詞 + 過去分詞。singの過去分詞はsung。',xp:4},
      {q:'These letters ___ written in English.',jp:'これらの手紙は英語で書かれています。',a:'are',choices:['am','is','are'],exp:'現在の受け身（These letters=複数）→ are written。',xp:3},
      {q:'The book ___ not ___ by students.',jp:'その本は学生によっては読まれていません（現在）。',a:'is',choices:['am','is','are'],exp:'現在の受け身否定（単数）→ is not read。',xp:4},
    ];
    test.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'/20<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  return html;
}

// ============================
// UNIT 2: 現在完了① 経験
// ============================
function renderUnit2Section(sid){
  var uid=2,html='';
  if(sid===0){
    html+='<div class="section-title">現在完了①（経験）</div><div class="section-sub">「〜したことがある」という経験を表す表現。</div>';
    html+=dialog([
      {who:'kyon',text:'「私はM-1のライブに行ったことがある」って英語で言いたいんだけど？'},
      {who:'nishi',text:'現在完了の経験用法だよ。have + 過去分詞で作る。「I have been to an M-1 live show.」こんな感じ。'},
      {who:'kyon',text:'have been！過去形のwent じゃないの？'},
      {who:'nishi',text:'そこが大事なポイント。現在完了は「今の時点でその経験がある」というニュアンス。beenはgoの現在完了形で「行ったことがある」という経験を表す。'},
      {who:'kyon',text:'haveとhas の使い分けもあるの？'},
      {who:'nishi',text:'I / you / we / they は have、he / she / it は has を使う。過去分詞は受け身のときと同じ形だよ。'},
    ]);
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 現在完了の基本構造（経験）</div>';
    html+='<div class="formula-box">主語 + <span class="highlight">have / has</span> + <span class="highlight">過去分詞</span><br><small style="color:var(--text2)">I / You / We / They → have　　He / She / It → has</small></div>';
    html+=exList(uid,sid,[
      ['I have visited Tokyo three times.','私は東京を3回訪れたことがあります。'],
      ['She has eaten sushi before.','彼女は以前寿司を食べたことがあります。'],
      ['We have seen that movie.','私たちはその映画を見たことがあります。'],
      ['He has never been to Osaka.','彼は大阪に行ったことがありません。'],
      ['Have you ever tried manzai?','あなたは漫才をやってみたことがありますか？'],
    ]);
    html+='</div><div style="text-align:center;margin-top:24px"><button onclick="goSection(1)" class="unit-complete-btn">📖 練習問題へ →</button></div>';
  }
  else if(sid===1){
    html+='<div class="section-title">経験 have/has + 過去分詞</div><div class="section-sub">「〜したことがある」の基本パターンを練習しよう</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 重要：have / has の使い分け</div>';
    html+='<div class="formula-box"><span class="highlight">have</span>: I, You, We, They<br><span class="highlight">has</span>: He, She, It（三人称単数）</div>';
    html+='<div class="grammar-rule"><div class="rule-title">よく出る過去分詞（現在完了用）</div><div class="en">go → gone / been, see → seen, eat → eaten, visit → visited, try → tried, read → read, write → written, speak → spoken, meet → met, win → won</div></div></div>';
    html+='<div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs=[
      {q:'I ___ visited Kyoto twice.',jp:'私は京都を2回訪れたことがあります。',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 現在完了の基本</span>I → <strong>have</strong> + 過去分詞</span><span class="exp-ok">✅ I have visited Kyoto twice.</span><br><span class="exp-ng">❌ I has visited（×）</span><span class="exp-tip">💡 I/You/We/They → have　He/She/It → has</span>',xp:3},
      {q:'She ___ eaten takoyaki before.',jp:'彼女は以前たこ焼きを食べたことがあります。',a:'has',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 現在完了：三単現</span>She → <strong>has</strong> + 過去分詞</span><span class="exp-ok">✅ She has eaten takoyaki before.</span><br><span class="exp-ng">❌ She have eaten（×）</span><span class="exp-tip">💡 eat の過去分詞は eaten（不規則）</span>',xp:3},
      {q:'We ___ seen Kamaitachi live.',jp:'私たちはかまいたちのライブを見たことがあります。',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 現在完了</span>We → <strong>have</strong> + 過去分詞</span><span class="exp-ok">✅ We have seen Kamaitachi live.</span><span class="exp-tip">💡 see の過去分詞は seen（不規則）</span>',xp:3},
      {q:'He ___ read this book many times.',jp:'彼はこの本を何回も読んだことがあります。',a:'has',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 変化しない不規則動詞</span>read → read → <strong>read</strong>（発音は変わる：リード→レッド）</span><span class="exp-ok">✅ He has read this book many times.</span><span class="exp-tip">💡 read は原形・過去形・過去分詞が同じスペル。発音注意！</span>',xp:4},
      {q:'Kyon ___ won a comedy award.',jp:'きょんはお笑いの賞を取ったことがあります。',a:'has',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>win → won → <strong>won</strong>（過去形も過去分詞も同じ）</span><span class="exp-ok">✅ Kyon has won a comedy award.</span><span class="exp-tip">💡 win-won-won。run-ran-run と混同しないように</span>',xp:4},
      {q:'They ___ visited many countries.',jp:'彼らは多くの国を訪れたことがあります。',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 現在完了</span>They → <strong>have</strong> + 過去分詞</span><span class="exp-ok">✅ They have visited many countries.</span><span class="exp-tip">💡 visit は規則動詞：visited</span>',xp:3},
      {q:'My teacher ___ spoken at a big event.',jp:'私の先生は大きなイベントでスピーチしたことがあります。',a:'has',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>speak → spoke → <strong>spoken</strong></span><span class="exp-ok">✅ My teacher has spoken at a big event.</span><span class="exp-tip">💡 speak-spoke-spoken</span>',xp:4},
      {q:'I ___ met that comedian before.',jp:'私は以前その芸人に会ったことがあります。',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>meet → met → <strong>met</strong>（過去形と過去分詞が同じ）</span><span class="exp-ok">✅ I have met that comedian before.</span><span class="exp-tip">💡 meet-met-met。before = 以前に（文末に置く）</span>',xp:4},
    ];
    qs.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    var qb=[
      {jp:'私は富士山に登ったことがあります。',a:'I have climbed Mt. Fuji.',exp:'<span class="exp-rule"><span class="label">📐 規則動詞の現在完了</span>climb → <strong>climbed</strong>（規則動詞）</span><span class="exp-ok">✅ I have climbed Mt. Fuji.</span><span class="exp-tip">💡 I have + 過去分詞（経験）。「登ったことがある」</span>',xp:6},
      {jp:'彼女は令和ロマンのライブを見たことがあります。',a:'She has seen a Reiwa Roman live show.',exp:'<span class="exp-rule"><span class="label">📐 不規則動詞の過去分詞</span>see → saw → <strong>seen</strong></span><span class="exp-ok">✅ She has seen a Reiwa Roman live show.</span><span class="exp-tip">💡 see-saw-seen。「見たことがある」</span>',xp:7},
      {jp:'私たちは以前その映画を見たことがあります。',a:'We have seen that movie before.',exp:'<span class="exp-rule"><span class="label">📐 before の使い方</span>「以前に」= <strong>before</strong>（文末に置く）</span><span class="exp-ok">✅ We have seen that movie before.</span><span class="exp-tip">💡 before は経験の現在完了でよく使う副詞。文末がお決まりの位置</span>',xp:6},
    ];
    qb.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===2){
    html+='<div class="section-title">never / ever / before</div><div class="section-sub">経験の有無を強調する表現をマスターしよう</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 重要副詞</div>';
    html+='<div class="grammar-rule"><div class="rule-title">neverとeverの使い方</div><div class="en">never: 「一度も〜ない」→ 否定の意味を含む（not は不要）</div><div class="en">ever: 「今までに」→ 疑問文でよく使う</div><div class="en">before: 「以前に」→ 文末に置くことが多い</div></div>';
    html+=exList(uid,sid,[
      ['I have never eaten natto.','私は納豆を一度も食べたことがありません。'],
      ['She has never been to Osaka.','彼女は大阪に一度も行ったことがありません。'],
      ['Have you ever tried comedy?','あなたは今までにお笑いをやってみたことがありますか？'],
      ['Yes, I have. / No, I have not (haven\'t).','はい。/ いいえ。'],
      ['I have seen that show before.','私は以前そのショーを見たことがあります。'],
    ]);
    html+='</div><div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs2=[
      {q:'I have ___ been to Hokkaido.',jp:'私は北海道に一度も行ったことがありません。',a:'never',choices:['ever','never','before'],exp:'<span class="exp-rule"><span class="label">📐 neverの使い方</span>have + <strong>never</strong> + 過去分詞（否定の意味を含む）</span><span class="exp-ok">✅ I have never been to Hokkaido.</span><br><span class="exp-ng">❌ I have not never（×　notは不要）</span><span class="exp-tip">💡 never には既に否定の意味がある。not は不要！</span>',xp:4},
      {q:'Have you ___ eaten sushi?',jp:'あなたは今までに寿司を食べたことがありますか？',a:'ever',choices:['ever','never','before'],exp:'<span class="exp-rule"><span class="label">📐 everの使い方</span>Have you <strong>ever</strong> + 過去分詞 ...?（疑問文で使う）</span><span class="exp-ok">✅ Have you ever eaten sushi?</span><span class="exp-tip">💡 ever は「今までに」という意味。疑問文専用！</span>',xp:4},
      {q:'She has ___ seen a manzai show.',jp:'彼女は以前漫才のショーを見たことがあります。',a:'before',choices:['ever','never','before'],exp:'<span class="exp-rule"><span class="label">📐 beforeの使い方</span>have + 過去分詞 + <strong>before</strong>（文末）</span><span class="exp-ok">✅ She has seen a manzai show before.</span><span class="exp-tip">💡 before は肯定文で「以前に」。文末が定位置</span>',xp:4},
      {q:'He has ___ tried sushi.',jp:'彼は一度も寿司を食べてみたことがありません。',a:'never',choices:['ever','never','before'],exp:'<span class="exp-rule"><span class="label">📐 never（三単現）</span>has + <strong>never</strong> + 過去分詞</span><span class="exp-ok">✅ He has never tried sushi.</span><span class="exp-tip">💡 主語が三単現（He/She/It）→ has never + 過去分詞</span>',xp:4},
      {q:'Have they ___ visited Japan?',jp:'彼らは今までに日本を訪れたことがありますか？',a:'ever',choices:['ever','never','before'],exp:'<span class="exp-rule"><span class="label">📐 everの疑問文</span>Have + 主語 + <strong>ever</strong> + 過去分詞 ...?</span><span class="exp-ok">✅ Have they ever visited Japan?</span><span class="exp-tip">💡 ever の位置：have と過去分詞の間</span>',xp:4},
      {q:'I have seen this movie ___ .',jp:'私は以前この映画を見たことがあります。',a:'before',choices:['ever','never','before'],exp:'「以前に」は before。肯定文の文末に置く。',xp:3},
    ];
    qs2.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    var qb2=[
      {jp:'私は一度もたこ焼きを食べたことがありません。',a:"I have never eaten takoyaki.",exp:'<span class="exp-rule"><span class="label">📐 neverの位置</span>have + <strong>never</strong> + 過去分詞（have と過去分詞の間）</span><span class="exp-ok">✅ I have never eaten takoyaki.</span><span class="exp-tip">💡 eat の過去分詞は eaten（不規則）</span>',xp:6},
      {jp:'あなたは今までに漫才をやったことがありますか？',a:'Have you ever tried manzai?',exp:'<span class="exp-rule"><span class="label">📐 経験の疑問文</span>Have you <strong>ever</strong> + 過去分詞 ...?</span><span class="exp-ok">✅ Have you ever tried manzai?</span><span class="exp-tip">💡 try の過去分詞は tried（子音+y → ied）</span>',xp:7},
      {jp:'彼女は以前コットンのライブを見たことがあります。',a:'She has seen a Cotton live show before.',exp:'<span class="exp-rule"><span class="label">📐 経験の表現</span>She has + 過去分詞 + <strong>before</strong></span><span class="exp-ok">✅ She has seen a Cotton live show before.</span><span class="exp-tip">💡 see-saw-seen。before は文末</span>',xp:7},
    ];
    qb2.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs2.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===3){
    html+='<div class="section-title">回数と疑問文</div><div class="section-sub">「何回〜したことがあるか」の表現と疑問文</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 回数の表現</div>';
    html+='<div class="grammar-rule"><div class="en">once（1回）/ twice（2回）/ three times（3回）...</div><div class="en">How many times have you + 過去分詞？（何回〜したことがある？）</div></div>';
    html+=exList(uid,sid,[
      ['I have visited Kyoto twice.','私は京都を2回訪れたことがあります。'],
      ['She has been to Paris three times.','彼女はパリに3回行ったことがあります。'],
      ['How many times have you seen this movie?','この映画を何回見たことがありますか？'],
      ['I have watched it five times.','私はそれを5回見たことがあります。'],
      ['How many times has she performed on stage?','彼女は何回ステージで演じたことがありますか？'],
    ]);
    html+='</div><div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs3=[
      {q:'I have seen that show ___ .',jp:'私はそのショーを2回見たことがあります。',a:'twice',choices:['once','twice','three times'],exp:'<span class="exp-rule"><span class="label">📐 回数の表現</span>1回 = once　2回 = <strong>twice</strong>　3回以上 = ～ times</span><span class="exp-ok">✅ I have seen that show twice.</span><span class="exp-tip">💡 once/twice は特別な形。3回からは numbers + times</span>',xp:3},
      {q:'She has visited Tokyo ___ .',jp:'彼女は東京を3回訪れたことがあります。',a:'three times',choices:['once','twice','three times'],exp:'<span class="exp-rule"><span class="label">📐 回数の表現</span>3回 = <strong>three times</strong></span><span class="exp-ok">✅ She has visited Tokyo three times.</span><span class="exp-tip">💡 4回以上も同様：four times, five times...</span>',xp:3},
      {q:'___ many times have you tried manzai?',jp:'あなたは漫才を何回やったことがありますか？',a:'How',choices:['How','What','Which'],exp:'<span class="exp-rule"><span class="label">📐 回数を尋ねる疑問文</span><strong>How many times</strong> have you + 過去分詞 ...?</span><span class="exp-ok">✅ How many times have you tried manzai?</span><span class="exp-tip">💡 How many times は文頭。その後は have you + 過去分詞の語順</span>',xp:4},
      {q:'How many times ___ she won the prize?',jp:'彼女は何回その賞を取ったことがありますか？',a:'has',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 回数疑問文（三単現）</span>How many times <strong>has</strong> she + 過去分詞 ...?</span><span class="exp-ok">✅ How many times has she won the prize?</span><span class="exp-tip">💡 主語が三単現 → has を使う</span>',xp:4},
      {q:'I have been there ___ .',jp:'私はそこに1回行ったことがあります。',a:'once',choices:['once','twice','three times'],exp:'<span class="exp-rule"><span class="label">📐 回数の表現</span>1回 = <strong>once</strong></span><span class="exp-ok">✅ I have been there once.</span><span class="exp-tip">💡 once = one time の意味。「いつか」ではなく「1回」</span>',xp:3},
      {q:'How many times have you ___ this book?',jp:'あなたはこの本を何回読んだことがありますか？',a:'read',choices:['read','reads','reading'],exp:'<span class="exp-rule"><span class="label">📐 変化しない不規則動詞</span>read → read → <strong>read</strong>（スペル同じ・発音変わる）</span><span class="exp-ok">✅ How many times have you read this book?</span><span class="exp-tip">💡 原形 read（リード）・過去/過去分詞 read（レッド）</span>',xp:5},
    ];
    qs3.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    var qb3=[
      {jp:'あなたはかまいたちのライブを何回見たことがありますか？',a:'How many times have you seen a Kamaitachi live show?',exp:'<span class="exp-rule"><span class="label">📐 回数疑問文</span>How many times have you + 過去分詞 ...?</span><span class="exp-ok">✅ How many times have you seen a Kamaitachi live show?</span><span class="exp-tip">💡 see の過去分詞は seen（不規則）</span>',xp:8},
      {jp:'私は令和ロマンを2回見たことがあります。',a:'I have seen Reiwa Roman twice.',exp:'<span class="exp-rule"><span class="label">📐 経験の表現（回数）</span>I have + 過去分詞 + <strong>twice</strong></span><span class="exp-ok">✅ I have seen Reiwa Roman twice.</span><span class="exp-tip">💡 twice = 2回。文末に置く</span>',xp:6},
      {jp:'彼は一度もお笑いのライブに行ったことがありません。',a:'He has never been to a comedy live show.',exp:'<span class="exp-rule"><span class="label">📐 have been to の経験用法</span>has never been to 〜 = 「〜に行ったことがない」</span><span class="exp-ok">✅ He has never been to a comedy live show.</span><span class="exp-tip">💡 been to 〜 = 「〜に行ったことがある」。never で否定</span>',xp:7},
    ];
    qb3.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs3.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===4){
    html+='<div class="section-title">現在完了① 確認テスト</div><div class="section-sub">現在完了（経験）の総まとめ！</div>';
    html+='<div class="practice-section"><div class="practice-title">📝 確認テスト（全20問）</div>';
    var test=[
      {q:'I ___ visited London twice.',jp:'私はロンドンを2回訪れたことがあります。',a:'have',choices:['have','has','had'],exp:'I → have + 過去分詞。',xp:2},
      {q:'She ___ eaten natto before.',jp:'彼女は以前納豆を食べたことがあります。',a:'has',choices:['have','has','had'],exp:'She（三単現）→ has + 過去分詞。',xp:2},
      {q:'I have ___ seen that movie.',jp:'私はその映画を一度も見たことがありません。',a:'never',choices:['ever','never','before'],exp:'「一度も〜ない」→ never。have never + 過去分詞。',xp:2},
      {q:'Have you ___ tried Osaka food?',jp:'あなたは今までに大阪の食べ物を食べたことがありますか？',a:'ever',choices:['ever','never','before'],exp:'疑問文「今までに」→ ever。',xp:2},
      {q:'He has visited Kyoto ___ .',jp:'彼は京都を3回訪れたことがあります。',a:'three times',choices:['once','twice','three times'],exp:'<span class="exp-rule"><span class="label">📐 回数の表現</span>3回 = <strong>three times</strong></span><span class="exp-ok">✅ She has visited Tokyo three times.</span><span class="exp-tip">💡 4回以上も同様：four times, five times...</span>',xp:3},
      {q:'We ___ seen Reiwa Roman live.',jp:'私たちは令和ロマンのライブを見たことがあります。',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 現在完了</span>We → <strong>have</strong> + 過去分詞</span><span class="exp-ok">✅ We have seen Kamaitachi live.</span><span class="exp-tip">💡 see の過去分詞は seen（不規則）</span>',xp:2},
      {q:'___ many times have you been to Tokyo?',jp:'あなたは何回東京に行ったことがありますか？',a:'How',choices:['How','What','Which'],exp:'回数を尋ねる → How many times have you + 過去分詞？',xp:3},
      {q:'She has ___ spoken in public.',jp:'彼女は一度も人前でスピーチしたことがありません。',a:'never',choices:['ever','never','before'],exp:'「一度も〜ない」→ has never + 過去分詞。',xp:3},
      {q:'I have seen him ___ .',jp:'私は以前彼を見たことがあります。',a:'before',choices:['ever','never','before'],exp:'「以前に」→ before（文末）。',xp:2},
      {q:'How many times ___ she met that comedian?',jp:'彼女はその芸人に何回会ったことがありますか？',a:'has',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 回数疑問文（三単現）</span>How many times <strong>has</strong> she + 過去分詞 ...?</span><span class="exp-ok">✅ How many times has she won the prize?</span><span class="exp-tip">💡 主語が三単現 → has を使う</span>',xp:4},
      {q:'I have ___ read this novel.',jp:'私は以前この小説を読んだことがあります。',a:'before',choices:['ever','never','before'],exp:'「以前に」→ before。肯定文では文末。',xp:3},
      {q:'They have visited Japan ___ .',jp:'彼らは日本を1回訪れたことがあります。',a:'once',choices:['once','twice','three times'],exp:'<span class="exp-rule"><span class="label">📐 回数の表現</span>1回 = <strong>once</strong></span><span class="exp-ok">✅ I have been there once.</span><span class="exp-tip">💡 once = one time の意味。「いつか」ではなく「1回」</span>',xp:2},
      {q:'Have you ever ___ Mt. Fuji?',jp:'あなたは今までに富士山に登ったことがありますか？',a:'climbed',choices:['climb','climbed','climbing'],exp:'have ever + 過去分詞。climbの過去分詞はclimbed。',xp:4},
      {q:'Kyon has never ___ to Paris.',jp:'きょんはパリに行ったことがありません。',a:'been',choices:['go','went','been'],exp:'has never + 過去分詞。beの現在完了はbeen（been to = 行ったことがある）。',xp:5},
      {q:'I have ___ that song many times.',jp:'私はその歌を何回も聞いたことがあります。',a:'heard',choices:['hear','heard','hearing'],exp:'have + 過去分詞。hearの過去分詞はheard。',xp:4},
      {q:'She ___ tried sushi once.',jp:'彼女は寿司を1回食べたことがあります。',a:'has',choices:['have','has','had'],exp:'She（三単現）→ has tried。',xp:2},
      {q:'How many times have you ___ this game?',jp:'あなたはこのゲームを何回やったことがありますか？',a:'played',choices:['play','played','playing'],exp:'have + 過去分詞。playの過去分詞はplayed。',xp:3},
      {q:'We have ___ won an award.',jp:'私たちは一度も賞を取ったことがありません。',a:'never',choices:['ever','never','before'],exp:'「一度も〜ない」→ have never + 過去分詞。',xp:3},
      {q:'He has been to Osaka ___ .',jp:'彼は大阪に2回行ったことがあります。',a:'twice',choices:['once','twice','three times'],exp:'2回 → twice。',xp:2},
      {q:'Have you ever ___ a speech in English?',jp:'あなたは今までに英語でスピーチをしたことがありますか？',a:'given',choices:['give','gave','given'],exp:'Have you ever + 過去分詞。giveの過去分詞はgiven。',xp:5},
    ];
    test.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'/20<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  return html;
}

// ============================
// UNIT 3: 現在完了② 継続・完了
// ============================
function renderUnit3Section(sid){
  var uid=3,html='';
  if(sid===0){
    html+='<div class="section-title">現在完了②（継続・完了）</div><div class="section-sub">「ずっと〜している」（継続）と「〜してしまった」（完了）の2用法を学ぼう。</div>';
    html+=dialog([
      {who:'kyon',text:'現在完了ってまだあるの？経験用法だけじゃないの？'},
      {who:'nishi',text:'あと2つある。継続用法と完了用法だよ。「ずっと〜している」は継続、「もう〜した・ちょうど〜した」は完了。'},
      {who:'kyon',text:'継続って例えば？'},
      {who:'nishi',text:'「I have lived in Aichi for ten years.」（愛知に10年住んでいる）これが継続。for や since と一緒に使うことが多い。'},
      {who:'kyon',text:'forとsinceって何が違うの？'},
      {who:'nishi',text:'for は「〜の間」（期間の長さ）、since は「〜から」（起点の時点）。「for ten years」「since 2015」という感じで使い分ける。'},
    ]);
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 継続用法と完了用法</div>';
    html+='<div class="formula-box">継続: 主語 + <span class="highlight">have/has</span> + 過去分詞 + <span class="highlight">for / since</span> 〜<br>完了: 主語 + <span class="highlight">have/has</span> + <span class="highlight">just / already / yet</span> + 過去分詞</div>';
    html+=exList(uid,sid,[
      ['I have lived here for five years.','私はここに5年間住んでいます。'],
      ['She has studied English since 2020.','彼女は2020年から英語を勉強しています。'],
      ['I have just finished my homework.','私はちょうど宿題を終えたところです。'],
      ['She has already eaten dinner.','彼女はもう夕食を食べてしまいました。'],
      ['Have you done your homework yet?','もう宿題をやりましたか？'],
    ]);
    html+='</div><div style="text-align:center;margin-top:24px"><button onclick="goSection(1)" class="unit-complete-btn">📖 練習問題へ →</button></div>';
  }
  else if(sid===1){
    html+='<div class="section-title">継続：for / since</div><div class="section-sub">「ずっと〜している」という継続の表現を練習しよう</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 for と since の使い分け</div>';
    html+='<div class="grammar-rule"><div class="rule-title">for：期間の長さ</div><div class="en">for two years / for a long time / for three months</div><div class="jp">（2年間 / 長い間 / 3ヶ月間）</div></div>';
    html+='<div class="grammar-rule"><div class="rule-title">since：起点の時点</div><div class="en">since 2020 / since last year / since I was ten</div><div class="jp">（2020年から / 去年から / 10歳から）</div></div></div>';
    html+='<div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs=[
      {q:'I have studied English ___ three years.',jp:'私は3年間英語を勉強しています。',a:'for',choices:['for','since','during'],exp:'<span class="exp-rule"><span class="label">📐 継続：forの使い方</span><strong>for</strong> + 期間の長さ（数字＋時間単位）</span><span class="exp-ok">✅ I have studied English for three years.</span><span class="exp-tip">💡 for = 「〜の間」。for two hours / for a week なども同様</span>',xp:3},
      {q:'She has lived in Osaka ___ 2018.',jp:'彼女は2018年から大阪に住んでいます。',a:'since',choices:['for','since','from'],exp:'<span class="exp-rule"><span class="label">📐 継続：sinceの使い方</span><strong>since</strong> + 過去の時点（年・月・日・曜日など）</span><span class="exp-ok">✅ She has lived in Osaka since 2018.</span><span class="exp-tip">💡 since = 「〜から（ずっと）」。起点となる時点を示す</span>',xp:3},
      {q:'They have been friends ___ many years.',jp:'彼らは何年も友達です。',a:'for',choices:['for','since','during'],exp:'<span class="exp-rule"><span class="label">📐 for + 期間</span>for + 期間の長さ</span><span class="exp-ok">✅ They have been friends for many years.</span><span class="exp-tip">💡 for many years = 何年も。for a long time = 長い間</span>',xp:3},
      {q:'Kyon has wanted to do comedy ___ she was a child.',jp:'きょんは子どもの頃からお笑いをやりたいと思っています。',a:'since',choices:['for','since','from'],exp:'<span class="exp-rule"><span class="label">📐 since + 節</span>since + 過去の時点を表す節（since I was a child）</span><span class="exp-ok">✅ Kyon has wanted to do comedy since she was a child.</span><span class="exp-tip">💡 since の後に「主語+過去形」の節も使える</span>',xp:4},
      {q:'I ___ known him for ten years.',jp:'私は彼と10年来の知り合いです。',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 継続の現在完了</span>I have + 過去分詞 + for 〜</span><span class="exp-ok">✅ I have known him for ten years.</span><span class="exp-tip">💡 know の過去分詞は known（不規則）</span>',xp:4},
      {q:'She ___ practiced manzai since last spring.',jp:'彼女は去年の春から漫才を練習しています。',a:'has',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 継続（三単現）</span>She → has + 過去分詞 + since 〜</span><span class="exp-ok">✅ She has practiced manzai since last spring.</span><span class="exp-tip">💡 practice は規則動詞：practiced</span>',xp:4},
      {q:'How long ___ you lived here?',jp:'あなたはここに住んでいてどのくらいになりますか？',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 継続の疑問文</span><strong>How long</strong> have you + 過去分詞 ...?</span><span class="exp-ok">✅ How long have you lived here?</span><span class="exp-tip">💡 How long = 「どのくらいの間」。for や since のある文の疑問形</span>',xp:5},
      {q:'Cotton has performed together ___ 2013.',jp:'コットンは2013年から一緒に活動しています。',a:'since',choices:['for','since','from'],exp:'<span class="exp-rule"><span class="label">📐 since（起点）</span><strong>since</strong> 2013</span><span class="exp-ok">✅ Cotton has performed together since 2013.</span><span class="exp-tip">💡 since の後には過去の時点を表す語が来る</span>',xp:4},
    ];
    qs.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    var qb=[
      {jp:'私は5年間英語を勉強しています。',a:'I have studied English for five years.',exp:'<span class="exp-rule"><span class="label">📐 継続の現在完了</span>I have + 過去分詞 + <strong>for</strong> + 期間</span><span class="exp-ok">✅ I have studied English for five years.</span><span class="exp-tip">💡 「ずっと〜している」＝現在完了の継続用法</span>',xp:6},
      {jp:'彼女は2021年からここに住んでいます。',a:'She has lived here since 2021.',exp:'<span class="exp-rule"><span class="label">📐 継続（since）</span>She has + 過去分詞 + <strong>since</strong> + 起点</span><span class="exp-ok">✅ She has lived here since 2021.</span><span class="exp-tip">💡 since の後は「年・月・日」など過去の時点</span>',xp:6},
      {jp:'あなたはどのくらいの間お笑いが好きですか？',a:'How long have you liked comedy?',exp:'<span class="exp-rule"><span class="label">📐 継続の疑問文</span>How long have you + 過去分詞 ...?</span><span class="exp-ok">✅ How long have you liked comedy?</span><span class="exp-tip">💡 答えは「For ～ years.」または「Since ～.」</span>',xp:8},
      {jp:'きょんと西村は長い間友達です。',a:'Kyon and Nishimura have been friends for a long time.',exp:'<span class="exp-rule"><span class="label">📐 状態の継続</span>have been + 名詞/形容詞 + for/since</span><span class="exp-ok">✅ Kyon and Nishimura have been friends for a long time.</span><span class="exp-tip">💡 「ずっと〜の状態だ」も現在完了で表せる</span>',xp:7},
    ];
    qb.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===2){
    html+='<div class="section-title">完了：just / already / yet</div><div class="section-sub">「ちょうど〜した」「もう〜した」「まだ〜していない」の表現を練習しよう</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 完了の副詞</div>';
    html+='<div class="grammar-rule"><div class="rule-title">just（ちょうど〜したところ）→ have/has + just + 過去分詞</div><div class="en">I have just finished my homework.（ちょうど宿題を終えたところ）</div></div>';
    html+='<div class="grammar-rule"><div class="rule-title">already（もう〜した）→ 肯定文で使う</div><div class="en">She has already eaten dinner.（もう夕食を食べた）</div></div>';
    html+='<div class="grammar-rule"><div class="rule-title">yet（まだ / もう）→ 否定文・疑問文で使う</div><div class="en">I have not finished yet.（まだ終わっていない）</div><div class="en">Have you finished yet?（もう終わりましたか？）</div></div></div>';
    html+='<div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs2=[
      {q:'I have ___ finished the report.',jp:'私はちょうどレポートを終えたところです。',a:'just',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：just</span>have + <strong>just</strong> + 過去分詞（「ちょうど〜したところ」）</span><span class="exp-ok">✅ I have just finished the report.</span><span class="exp-tip">💡 just の位置：have と過去分詞の間</span>',xp:3},
      {q:'She has ___ done her homework.',jp:'彼女はもう宿題をやってしまいました。',a:'already',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：already</span>has + <strong>already</strong> + 過去分詞（肯定文）</span><span class="exp-ok">✅ Kyon has already learned the lines.</span><span class="exp-tip">💡 already は肯定文専用。位置は have と過去分詞の間</span>',xp:3},
      {q:'I have not read the book ___ .',jp:'私はまだその本を読んでいません。',a:'yet',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：yet（否定文）</span>have not + 過去分詞 + <strong>yet</strong>（「まだ〜ない」）</span><span class="exp-ok">✅ I have not read the book yet.</span><span class="exp-tip">💡 yet は文末。否定文では「まだ〜ない」の意味</span>',xp:3},
      {q:'Have you eaten lunch ___ ?',jp:'もう昼食を食べましたか？',a:'yet',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：yet（疑問文）</span>Have you + 過去分詞 + <strong>yet</strong>?（「もう〜しましたか」）</span><span class="exp-ok">✅ Have you eaten lunch yet?</span><span class="exp-tip">💡 yet は疑問文でも使える。「もう〜しましたか」の意味</span>',xp:3},
      {q:'He has ___ left for Osaka.',jp:'彼はちょうど大阪に向けて出発したところです。',a:'just',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：just</span>have + <strong>just</strong> + 過去分詞</span><span class="exp-ok">✅ He has just left for Osaka.</span><span class="exp-tip">💡 just は「ちょうど〜したばかり」</span>',xp:4},
      {q:'Kyon has ___ learned the lines.',jp:'きょんはもうセリフを覚えてしまいました。',a:'already',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：already</span>has + <strong>already</strong> + 過去分詞（肯定文）</span><span class="exp-ok">✅ Kyon has already learned the lines.</span><span class="exp-tip">💡 already は肯定文専用。位置は have と過去分詞の間</span>',xp:4},
      {q:'Has she arrived ___?',jp:'もう彼女は到着しましたか？',a:'yet',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 yet（疑問文）</span>Has she + 過去分詞 + <strong>yet</strong>?</span><span class="exp-ok">✅ Has she arrived yet?</span><span class="exp-tip">💡 三単現の疑問文は Has。yet は文末</span>',xp:4},
      {q:'They have ___ not decided.',jp:'彼らはまだ決めていません。',a:'yet',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 yet（否定文）</span>have not + 過去分詞 + <strong>yet</strong></span><span class="exp-ok">✅ They have not decided yet.</span><span class="exp-tip">💡 yet は文末。have not ... yet = 「まだ〜していない」</span>',xp:4},
    ];
    qs2.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    var qb2=[
      {jp:'私はちょうどその映画を見終わったところです。',a:'I have just finished watching the movie.',exp:'<span class="exp-rule"><span class="label">📐 just + finish -ing</span>I have just + finished + watching（動名詞）</span><span class="exp-ok">✅ I have just finished watching the movie.</span><span class="exp-tip">💡 finish は動名詞（-ing形）を目的語にとる</span>',xp:7},
      {jp:'彼女はもう夕食を作ってしまいました。',a:'She has already made dinner.',exp:'<span class="exp-rule"><span class="label">📐 already の用法</span>She has + <strong>already</strong> + 過去分詞</span><span class="exp-ok">✅ She has already made dinner.</span><span class="exp-tip">💡 make の過去分詞は made。already = もう・すでに</span>',xp:6},
      {jp:'あなたはもうその本を読みましたか？',a:'Have you read the book yet?',exp:'<span class="exp-rule"><span class="label">📐 yet（疑問文）</span>Have you + 過去分詞 + <strong>yet</strong>?</span><span class="exp-ok">✅ Have you read the book yet?</span><span class="exp-tip">💡 read の過去分詞は read（同形。レッドと発音）</span>',xp:7},
      {jp:'私はまだ宿題を終えていません。',a:'I haven&#39;t finished my homework yet.',exp:'<span class="exp-rule"><span class="label">📐 yet（否定）</span>have not + 過去分詞 + yet</span><span class="exp-ok">✅ I haven&#39;t finished my homework yet.</span><span class="exp-tip">💡 haven&#39;t = have not の短縮形。yet は文末</span>',xp:7},
    ];
    qb2.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs2.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===3){
    html+='<div class="section-title">混合練習</div><div class="section-sub">経験・継続・完了をまとめて練習しよう</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 3つの用法の見分け方</div>';
    html+='<div class="grammar-rule"><div class="rule-title">経験（〜したことがある）</div><div class="en">キーワード: ever, never, before, once, twice, how many times</div></div>';
    html+='<div class="grammar-rule"><div class="rule-title">継続（ずっと〜している）</div><div class="en">キーワード: for, since, how long</div></div>';
    html+='<div class="grammar-rule"><div class="rule-title">完了（〜したところ/もう〜/まだ〜）</div><div class="en">キーワード: just, already, yet</div></div></div>';
    html+='<div class="practice-section"><div class="practice-title">✏️ 混合練習</div>';
    var qs3=[
      {q:'I have never ___ sushi.',jp:'私は一度も寿司を食べたことがありません。',a:'eaten',choices:['eat','ate','eaten'],exp:'<span class="exp-rule"><span class="label">📐 経験：never</span>have + <strong>never</strong> + 過去分詞（経験の否定）</span><span class="exp-ok">✅ I have never eaten sushi.</span><span class="exp-tip">💡 eat-ate-eaten。never = 一度も〜ない</span>',xp:4},
      {q:'She has lived here ___ 2019.',jp:'彼女は2019年からここに住んでいます。',a:'since',choices:['for','since','yet'],exp:'<span class="exp-rule"><span class="label">📐 継続：since</span>has lived here since <strong>2019</strong></span><span class="exp-ok">✅ She has lived here since 2019.</span><span class="exp-tip">💡 since + 過去の時点。ずっとその状態が続いている</span>',xp:3},
      {q:'I have ___ finished my work.',jp:'私はちょうど仕事を終えたところです。',a:'just',choices:['just','already','never'],exp:'<span class="exp-rule"><span class="label">📐 完了：just</span>have + <strong>just</strong> + 過去分詞（完了）</span><span class="exp-ok">✅ I have just finished my work.</span><span class="exp-tip">💡 just は「ちょうど〜したばかり」</span>',xp:3},
      {q:'How ___ have you studied English?',jp:'あなたはどのくらいの間英語を勉強していますか？',a:'long',choices:['long','many','much'],exp:'<span class="exp-rule"><span class="label">📐 継続の疑問文</span><strong>How long</strong> have you + 過去分詞 ...?</span><span class="exp-ok">✅ How long have you studied English?</span><span class="exp-tip">💡 答え：For ～ years. / Since ～.</span>',xp:4},
      {q:'Have you done the dishes ___?',jp:'もうお皿を洗いましたか？',a:'yet',choices:['just','already','yet'],exp:'疑問文の「もう」（完了）→ yet。',xp:4},
      {q:'He has ___ visited that country once.',jp:'彼はその国を1回訪れたことがあります。',a:'visited',choices:['visit','visited','visiting'],exp:'<span class="exp-rule"><span class="label">📐 経験の現在完了</span>have + <strong>visited</strong>（規則動詞）</span><span class="exp-ok">✅ He has visited that country once.</span><span class="exp-tip">💡 visit は規則動詞：visited</span>',xp:4},
      {q:'Cotton has performed ___ more than ten years.',jp:'コットンは10年以上活動しています。',a:'for',choices:['for','since','yet'],exp:'<span class="exp-rule"><span class="label">📐 継続：for</span>has performed + <strong>for</strong> + 期間</span><span class="exp-ok">✅ Cotton has performed for more than ten years.</span><span class="exp-tip">💡 more than = 「〜以上」</span>',xp:4},
      {q:'She has ___ read the email.',jp:'彼女はもうそのメールを読んでしまいました。',a:'already',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：already</span>has + <strong>already</strong> + 過去分詞</span><span class="exp-ok">✅ She has already read the email.</span><span class="exp-tip">💡 already の位置：has と過去分詞の間</span>',xp:3},
      {q:'How many times ___ you seen Kamaitachi?',jp:'あなたはかまいたちを何回見たことがありますか？',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 回数疑問文</span>How many times have you + 過去分詞?</span><span class="exp-ok">✅ How many times have you seen Kamaitachi?</span><span class="exp-tip">💡 答え：I have seen them ～ times.</span>',xp:4},
      {q:'I ___ not finished my homework ___.',jp:'私はまだ宿題を終えていません。',a:'have',choices:['have','has','had'],exp:'<span class="exp-rule"><span class="label">📐 完了の否定</span>I have not + 過去分詞 + <strong>yet</strong></span><span class="exp-ok">✅ I have not finished my homework yet.</span><span class="exp-tip">💡 I → have。yet は文末</span>',xp:4},
    ];
    qs3.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    var qb4=[
      {jp:'私は3年間英語を勉強しています。',a:'I have studied English for three years.',exp:'<span class="exp-rule"><span class="label">📐 継続</span>I have + 過去分詞 + <strong>for</strong> + 期間</span><span class="exp-ok">✅ I have studied English for three years.</span><span class="exp-tip">💡 「ずっと〜している」＝継続用法</span>',xp:6},
      {jp:'彼女は今までにM-1のライブを見たことがありますか？',a:'Has she ever seen an M-1 live show?',exp:'<span class="exp-rule"><span class="label">📐 経験の疑問文（三単現）</span>Has she <strong>ever</strong> + 過去分詞 ...?</span><span class="exp-ok">✅ Has she ever seen an M-1 live show?</span><span class="exp-tip">💡 三単現の経験疑問文 → Has she ever + 過去分詞？</span>',xp:8},
      {jp:'私はちょうど夕食を食べたところです。',a:'I have just eaten dinner.',exp:'<span class="exp-rule"><span class="label">📐 完了：just</span>I have + <strong>just</strong> + 過去分詞</span><span class="exp-ok">✅ I have just eaten dinner.</span><span class="exp-tip">💡 eat の過去分詞は eaten（不規則）</span>',xp:6},
      {jp:'あなたはまだ宿題をやっていませんか？',a:"Haven't you done your homework yet?",exp:'完了の否定疑問文。Have you not done ... yet?またはHaven\'t you done ... yet?',xp:9},
    ];
    qb4.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs3.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  else if(sid===4){
    html+='<div class="section-title">現在完了② 確認テスト</div><div class="section-sub">現在完了（継続・完了）の総まとめ！</div>';
    html+='<div class="practice-section"><div class="practice-title">📝 確認テスト（全20問）</div>';
    var test=[
      {q:'I have lived here ___ five years.',jp:'私はここに5年間住んでいます。',a:'for',choices:['for','since','yet'],exp:'「5年間」という期間の長さ → for。',xp:2},
      {q:'She has studied English ___ 2021.',jp:'彼女は2021年から英語を勉強しています。',a:'since',choices:['for','since','during'],exp:'「2021年から」という起点 → since。',xp:2},
      {q:'I have ___ finished my dinner.',jp:'私はちょうど夕食を終えたところです。',a:'just',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：just</span>have + <strong>just</strong> + 過去分詞</span><span class="exp-ok">✅ He has just left for Osaka.</span><span class="exp-tip">💡 just は「ちょうど〜したばかり」</span>',xp:2},
      {q:'She has ___ done the dishes.',jp:'彼女はもう皿洗いをしてしまいました。',a:'already',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：already</span>has + <strong>already</strong> + 過去分詞（肯定文）</span><span class="exp-ok">✅ Kyon has already learned the lines.</span><span class="exp-tip">💡 already は肯定文専用。位置は have と過去分詞の間</span>',xp:2},
      {q:'Have you eaten lunch ___?',jp:'もう昼食を食べましたか？',a:'yet',choices:['just','already','yet'],exp:'疑問文の「もう〜しましたか」→ yet。',xp:2},
      {q:'I have not read the book ___.',jp:'私はまだその本を読んでいません。',a:'yet',choices:['just','already','yet'],exp:'否定文の「まだ〜ない」→ yet（文末）。',xp:2},
      {q:'He ___ known her for a long time.',jp:'彼は彼女と長い付き合いです。',a:'has',choices:['have','has','had'],exp:'He（三単現）→ has + 過去分詞（known）。',xp:3},
      {q:'___ long have you practiced manzai?',jp:'あなたはどのくらい漫才を練習していますか？',a:'How',choices:['How','What','Which'],exp:'<span class="exp-rule"><span class="label">📐 継続の疑問文</span><strong>How long</strong> have you + 過去分詞 ...?</span><span class="exp-ok">✅ How long have you studied English?</span><span class="exp-tip">💡 答え：For ～ years. / Since ～.</span>',xp:3},
      {q:'Cotton has performed together ___ over ten years.',jp:'コットンは10年以上一緒に活動しています。',a:'for',choices:['for','since','yet'],exp:'「10年以上」という期間 → for。',xp:3},
      {q:'Kyon has practiced comedy ___ she was young.',jp:'きょんは若い頃からお笑いを練習しています。',a:'since',choices:['for','since','during'],exp:'「若い頃から」という起点（節）→ since。',xp:4},
      {q:'I have ___ seen this movie.',jp:'私はちょうどこの映画を見たところです。',a:'just',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：just</span>have + <strong>just</strong> + 過去分詞</span><span class="exp-ok">✅ He has just left for Osaka.</span><span class="exp-tip">💡 just は「ちょうど〜したばかり」</span>',xp:3},
      {q:'She has ___ left for school.',jp:'彼女はもう学校に出発してしまいました。',a:'already',choices:['just','already','yet'],exp:'「もう〜した」肯定文 → already。',xp:3},
      {q:'Have they arrived ___?',jp:'もう彼らは着きましたか？',a:'yet',choices:['just','already','yet'],exp:'疑問文「もう〜しましたか」→ yet。',xp:3},
      {q:'I ___ studied English for three years.',jp:'私は3年間英語を勉強しています。',a:'have',choices:['have','has','had'],exp:'I → have + 過去分詞。継続用法。',xp:2},
      {q:'She ___ lived in Tokyo since 2019.',jp:'彼女は2019年から東京に住んでいます。',a:'has',choices:['have','has','had'],exp:'She（三単現）→ has + 過去分詞。継続用法。',xp:2},
      {q:'We have not decided ___.',jp:'私たちはまだ決めていません。',a:'yet',choices:['just','already','yet'],exp:'否定文「まだ〜ない」→ yet（文末）。',xp:3},
      {q:'How long ___ she been a comedian?',jp:'彼女はどのくらいの間芸人をしていますか？',a:'has',choices:['have','has','had'],exp:'she（三単現）→ How long has she + 過去分詞？',xp:4},
      {q:'I have ___ finished reading the book.',jp:'私はちょうど本を読み終わったところです。',a:'just',choices:['just','already','yet'],exp:'<span class="exp-rule"><span class="label">📐 完了：just</span>have + <strong>just</strong> + 過去分詞</span><span class="exp-ok">✅ He has just left for Osaka.</span><span class="exp-tip">💡 just は「ちょうど〜したばかり」</span>',xp:3},
      {q:'They have been friends ___ they were children.',jp:'彼らは子どもの頃からずっと友達です。',a:'since',choices:['for','since','during'],exp:'「子どもの頃から」という起点（節）→ since。',xp:4},
      {q:'Has Kyon ___ performed at a big event?',jp:'きょんはもう大きなイベントで公演しましたか？',a:'already',choices:['just','already','yet'],exp:'肯定の意味の疑問文「もう〜しましたか」→ already（または yet も可）。',xp:4},
    ];
    test.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'/20<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  return html;
}

// ============================
// UNIT 4: 不定詞のいろいろな形
// ============================
function wordBank(words){
  words = words.slice().sort(function(){ return Math.random() - 0.5; });
  return '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px">'+words.map(function(w){
    return '<span style="background:var(--bg3,#1c2230);border:1px solid var(--border,#30363d);border-radius:8px;padding:6px 14px;font-family:Georgia,serif;font-size:15px;color:var(--gold,#f5c518)">'+w+'</span>';
  }).join('')+'</div>';
}
function rearrangeQs(uid,sid,startNum,items){
  var html='<div class="practice-title" style="margin-top:20px">🔀 語句を並べ替えて英文を完成させよう</div>';
  items.forEach(function(q,i){
    var qid=uid+'_s'+sid+'_qc'+i;
    html+=qCard(qid,qNum(startNum+i)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+wordBank(q.words)+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
  });
  return html;
}
function vocabCard(uid,sid,words){
  var html='<div class="grammar-card"><div class="grammar-card-title">📚 覚えておきたい単語（先に音だけ聞いてみよう）</div><ul class="example-list">';
  words.forEach(function(w,i){
    var aid=uid+'_s'+sid+'_vocab_'+i; audioStore[aid]=w[0];
    html+='<li class="example-item"><button class="audio-btn" id="ab_'+aid+'" onclick="playAudio(\''+aid+'\')" title="音声">🔊</button><span class="en">'+w[0]+'</span><span class="jp">'+w[1]+'</span></li>';
  });
  html+='</ul><div class="grammar-rule" style="margin-top:10px"><div class="en" style="color:#8b949e">💡 全部覚えなくて大丈夫。🔊を何回も押して、音と意味をセットで慣らしておくだけでOK。</div></div></div>';
  return html;
}
function renderUnit4Section(sid){
  var uid=4,html='';
  if(sid===0){
    html+='<div class="section-title">不定詞のいろいろな形</div><div class="section-sub">英語、正直しんどいよね。今日は3つのパターンだけ。単語も先に確認してから始めるから安心して。</div>';
    html+=dialog([
      {who:'kyon',text:'にっくん…正直に言うと、私、英語ずっと苦手で…単語もぜんぜん覚えてないし、テストで点取れたことないんだよね…'},
      {who:'nishi',text:'大丈夫。単語を全部覚えてから文法、じゃなくていい。今日使う単語だけ、先に一緒に耳から慣らそう。この下にリストがあるから、🔊を何回も押して聞いてみて。'},
      {who:'kyon',text:'聞くだけでいいの？書けなくても？'},
      {who:'nishi',text:'今はそれでいい。今日やるのはたった3つのパターンだけだ。「It is 〜 for 人 to …」「want/tell 人 to …」「let/help 人 …」。この3つの型に単語をはめこむだけで、実はどんな文でも作れるようになる。'},
      {who:'kyon',text:'型さえ覚えればいいってこと？なんか…できる気がしてきたかも！'},
      {who:'nishi',text:'その調子だ。1問ずつでいい。間違えても減点はソフトにしてある。焦らず一緒にやろう。'},
    ]);
    html+=vocabCard(uid,sid,[
      ['important','大切な・重要な'],
      ['necessary','必要な'],
      ['difficult','難しい'],
      ['easy','簡単な'],
      ['exciting','わくわくする'],
      ['hard','大変な・難しい'],
      ['protect','守る'],
      ['survive','生き残る'],
      ['understand','理解する'],
      ['endangered','絶滅の危機にある'],
      ['danger','危険'],
      ['environment','環境'],
      ['everyone','みんな・誰でも'],
      ['article','記事'],
    ]);
    html+='<div class="practice-section"><div class="practice-title">✏️ まずは単語だけ確認（かんたん5問）</div>';
    var vq=[
      {q:'"important" の意味は？',jp:'（英単語の意味を選ぼう）',a:'大切な・重要な',choices:['大切な・重要な','危険な','簡単な'],exp:'<span class="exp-ok">✅ important＝大切な・重要な</span><span class="exp-tip">💡 このあとの文法パターンでたくさん出てくる単語！</span>',xp:2},
      {q:'"protect" の意味は？',jp:'（英単語の意味を選ぼう）',a:'守る',choices:['守る','逃げる','食べる'],exp:'<span class="exp-ok">✅ protect＝守る</span><span class="exp-tip">💡 「動物を守る」＝ protect animals</span>',xp:2},
      {q:'「難しい」を表す英単語は？',jp:'（日本語に合う英単語を選ぼう）',a:'difficult',choices:['difficult','easy','exciting'],exp:'<span class="exp-ok">✅ 難しい＝difficult</span><span class="exp-tip">💡 反対語 easy（簡単な）とセットで覚えよう</span>',xp:2},
      {q:'"survive" の意味は？',jp:'（英単語の意味を選ぼう）',a:'生き残る',choices:['生き残る','消える','眠る'],exp:'<span class="exp-ok">✅ survive＝生き残る</span><span class="exp-tip">💡 endangered animals（絶滅危惧種）が survive（生き残る）という文でよく使う</span>',xp:2},
      {q:'「絶滅の危機にある」を表す英単語は？',jp:'（日本語に合う英単語を選ぼう）',a:'endangered',choices:['endangered','excited','educated'],exp:'<span class="exp-ok">✅ 絶滅の危機にある＝endangered</span><span class="exp-tip">💡 endangered animals＝絶滅危惧種の動物</span>',xp:2},
    ];
    vq.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
    html+='<div style="text-align:center;margin-top:24px"><button onclick="goSection(1)" class="unit-complete-btn">📖 文法パターンへ →</button></div>';
  }
  else if(sid===1){
    html+='<div class="section-title">① It is ... for 人 to ～</div><div class="section-sub">「(人)にとって〜することは…です」という形。まずこの型だけ覚えよう。</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 基本の型</div>';
    html+='<div class="formula-box">It is + <span class="highlight">形容詞</span> + (for + 人) + <span class="highlight">to + 動詞の原形</span> ....<br><small style="color:var(--text2)">例: It is important for us to protect animals.<br>（動物を守ることは私たちにとって大切です。）</small></div>';
    html+='<div class="grammar-rule"><div class="rule-title">組み立て3ステップ</div><div class="en">① It is + 形容詞（important, difficult, easy など）</div><div class="en">② for + 人（誰にとって、を付け加えたいとき。無くてもOK）</div><div class="en">③ to + 動詞の原形（〜すること、の部分）</div></div></div>';
    html+=exList(uid,sid,[
      ['It is important for us to protect animals.','動物を守ることは私たちにとって大切です。'],
      ['It is difficult for pandas to survive.','パンダにとって生き残ることは難しいです。'],
      ['It is easy for Kyon to speak English.','英語を話すことはきょんにとって簡単です。'],
      ['It is exciting for us to learn about animals.','動物について学ぶことは私たちにとってわくわくします。'],
      ['It is necessary for everyone to care about the environment.','環境について気にかけることはみんなにとって必要です。'],
      ['It is fun for us to watch a Kamaitachi live show.','かまいたちのライブを見ることは私たちにとって楽しいです。'],
    ]);
    html+='</div><div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs=[
      {q:'It is important ___ us to protect animals.',jp:'動物を守ることは私たちにとって大切です。',a:'for',choices:['for','to','of'],exp:'<span class="exp-rule"><span class="label">📐 型</span>It is 形容詞 + <strong>for</strong> + 人 + to ～</span><span class="exp-ok">✅ It is important for us to protect animals.</span><span class="exp-tip">💡 「〜にとって」は for + 人。まずこの位置を覚えよう！</span>',xp:3},
      {q:'It is difficult for pandas ___ find food.',jp:'パンダにとって食べ物を見つけることは難しいです。',a:'to',choices:['to','for','of'],exp:'<span class="exp-rule"><span class="label">📐 型</span>for + 人 + <strong>to</strong> + 動詞の原形</span><span class="exp-ok">✅ It is difficult for pandas to find food.</span><span class="exp-tip">💡 「〜すること」の部分は必ず to + 原形！</span>',xp:3},
      {q:'It is easy ___ Kyon to make people laugh.',jp:'人を笑わせることはきょんにとって簡単です。',a:'for',choices:['for','to','with'],exp:'<span class="exp-rule"><span class="label">📐 型</span>形容詞のすぐあとは <strong>for</strong> + 人</span><span class="exp-ok">✅ It is easy for Kyon to make people laugh.</span><span class="exp-tip">💡 「誰にとって」を先に、その後で「何をすること」！</span>',xp:3},
      {q:'It is exciting for us ___ learn about wild animals.',jp:'野生動物について学ぶことは私たちにとってわくわくします。',a:'to',choices:['to','for','at'],exp:'<span class="exp-rule"><span class="label">📐 型</span>for us の後は <strong>to</strong> + 動詞の原形</span><span class="exp-ok">✅ It is exciting for us to learn about wild animals.</span><span class="exp-tip">💡 learn（学ぶ）は原形のまま使う！</span>',xp:3},
      {q:'___ is important for us to take action now.',jp:'今行動することは私たちにとって大切です。',a:'It',choices:['It','This','That'],exp:'<span class="exp-rule"><span class="label">📐 文頭</span>この型はいつも <strong>It</strong> から始まる（形式主語）</span><span class="exp-ok">✅ It is important for us to take action now.</span><span class="exp-tip">💡 It は「それ」という意味ではなく、後ろの to〜 の内容を指す形だけの主語！</span>',xp:3},
      {q:'It is hard for endangered animals ___ survive.',jp:'絶滅危惧種の動物にとって生き残ることは難しいです。',a:'to',choices:['to','for','of'],exp:'<span class="exp-rule"><span class="label">📐 型</span>for + 人・もの + <strong>to</strong> + 原形</span><span class="exp-ok">✅ It is hard for endangered animals to survive.</span><span class="exp-tip">💡 「人」だけでなく「動物」にも for が使える！</span>',xp:4},
      {q:'It is necessary ___ everyone to care about animals.',jp:'動物について気にかけることはみんなにとって必要です。',a:'for',choices:['for','to','with'],exp:'<span class="exp-rule"><span class="label">📐 型</span>necessary（必要な）の後も <strong>for</strong> + 人</span><span class="exp-ok">✅ It is necessary for everyone to care about animals.</span><span class="exp-tip">💡 important も necessary も同じ型で使える！</span>',xp:4},
      {q:'It is fun for us ___ watch pandas.',jp:'パンダを見ることは私たちにとって楽しいです。',a:'to',choices:['to','for','watch'],exp:'<span class="exp-rule"><span class="label">📐 型</span>for us の後は <strong>to</strong> + 動詞の原形</span><span class="exp-ok">✅ It is fun for us to watch pandas.</span><span class="exp-tip">💡 to の後は必ず動詞の原形（動詞そのままの形）！</span>',xp:4},
    ];
    qs.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='<div class="practice-title" style="margin-top:20px">✏️ 英作文問題（例文とほぼ同じでOK！）</div>';
    var qb=[
      {jp:'私たちにとってこの問題を理解することは大切です。',a:'It is important for us to understand this problem.',exp:'<span class="exp-rule"><span class="label">📐 型</span>It is important for us to understand ...</span><span class="exp-ok">✅ It is important for us to understand this problem.</span><span class="exp-tip">💡 これは教科書に出てくる文とほぼ同じ！そのまま覚えてOK</span>',xp:6},
      {jp:'パンダにとって生き残ることは難しいです。',a:'It is difficult for pandas to survive.',exp:'<span class="exp-rule"><span class="label">📐 型</span>It is difficult for + 人・動物 + to survive</span><span class="exp-ok">✅ It is difficult for pandas to survive.</span><span class="exp-tip">💡 さっきの練習問題と同じ文！自信を持って！</span>',xp:6},
      {jp:'きょんにとって英語を話すことは簡単です。',a:'It is easy for Kyon to speak English.',exp:'<span class="exp-rule"><span class="label">📐 型</span>It is easy for Kyon to speak English.</span><span class="exp-ok">✅ It is easy for Kyon to speak English.</span><span class="exp-tip">💡 exampleでも出てきた文！型を覚えれば書ける</span>',xp:6},
    ];
    qb.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+=rearrangeQs(uid,sid,qs.length+qb.length+1,[
      {jp:'令和ロマンのライブを見ることは私たちにとってわくわくします。',words:['It is','exciting','for us','to watch','a Reiwa Roman live show'],a:'It is exciting for us to watch a Reiwa Roman live show.',exp:'<span class="exp-rule"><span class="label">📐 型</span>It is + 形容詞 + for + 人 + to + 原形</span><span class="exp-ok">✅ It is exciting for us to watch a Reiwa Roman live show.</span><span class="exp-tip">💡 単語の順番はいつも同じ！形→for人→to原形</span>',xp:7},
      {jp:'かまいたちにとって面白いことを言うのは簡単です。',words:['It is','easy','for Kamaitachi','to say','funny things'],a:'It is easy for Kamaitachi to say funny things.',exp:'<span class="exp-rule"><span class="label">📐 型</span>It is + easy + for + 人 + to + 原形</span><span class="exp-ok">✅ It is easy for Kamaitachi to say funny things.</span><span class="exp-tip">💡 for のあとは「誰にとって」の部分！</span>',xp:7},
      {jp:'英語を勉強することは私たちにとって大切です。',words:['It is','important','for us','to study','English'],a:'It is important for us to study English.',exp:'<span class="exp-rule"><span class="label">📐 型</span>It is + important + for us + to + 原形</span><span class="exp-ok">✅ It is important for us to study English.</span><span class="exp-tip">💡 この型が出たら、まず「It is + 形容詞」から並べる！</span>',xp:7},
    ]);
    html+='</div>';
  }
  else if(sid===2){
    html+='<div class="section-title">② want/tell + 人 + to ～</div><div class="section-sub">「(人)に〜してほしい」「(人)に〜するように言う」という形。</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 基本の型</div>';
    html+='<div class="formula-box">want / tell / ask + <span class="highlight">人</span> + <span class="highlight">to + 動詞の原形</span> ....<br><small style="color:var(--text2)">例: I want everyone to know about this problem.<br>（私はみんなにこの問題について知ってほしいです。）</small></div>';
    html+='<div class="grammar-rule"><div class="rule-title">動詞ごとの意味の違い</div><div class="en">want + 人 + to ～ ＝ (人)に〜してほしい</div><div class="en">tell + 人 + to ～ ＝ (人)に〜するように言う</div><div class="en">ask + 人 + to ～ ＝ (人)に〜するように頼む</div></div></div>';
    html+=exList(uid,sid,[
      ['I want everyone to know about this problem.','私はみんなにこの問題について知ってほしいです。'],
      ['My teacher told us to bring our dictionaries.','先生は私たちに辞書を持ってくるように言いました。'],
      ['I asked my father to take me to the zoo.','私は父に動物園に連れて行ってくれるように頼みました。'],
      ['I want more people to protect wild animals.','私はもっと多くの人に野生動物を守ってほしいです。'],
      ['She wants me to come with her.','彼女は私に一緒に来てほしいと思っています。'],
      ['I want Cotton to perform at our school festival.','私はコットンに学園祭で漫才をしてほしいです。'],
    ]);
    html+='</div><div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs2=[
      {q:'I want you ___ help me.',jp:'私はあなたに手伝ってほしいです。',a:'to',choices:['to','that','for'],exp:'<span class="exp-rule"><span class="label">📐 型</span>want + 人 + <strong>to</strong> + 動詞の原形</span><span class="exp-ok">✅ I want you to help me.</span><span class="exp-tip">💡 「人」のすぐ後に to が来る！</span>',xp:3},
      {q:'Riko wants Eddy ___ write the article.',jp:'理子はエディに記事を書いてほしいと思っています。',a:'to',choices:['to','write','writes'],exp:'<span class="exp-rule"><span class="label">📐 型</span>want + 人（Eddy）+ <strong>to</strong> + 動詞の原形</span><span class="exp-ok">✅ Riko wants Eddy to write the article.</span><span class="exp-tip">💡 主語がRikoでも、Eddyのすぐ後にtoが来るのは同じ！</span>',xp:3},
      {q:'My teacher told us ___ study harder.',jp:'先生は私たちにもっと勉強するように言いました。',a:'to',choices:['to','for','that'],exp:'<span class="exp-rule"><span class="label">📐 型</span>told + 人（us）+ <strong>to</strong> + 動詞の原形</span><span class="exp-ok">✅ My teacher told us to study harder.</span><span class="exp-tip">💡 tell の過去形は told。「〜するように言った」</span>',xp:3},
      {q:'I asked my mother ___ help me.',jp:'私は母に手伝ってくれるよう頼みました。',a:'to',choices:['to','help','helping'],exp:'<span class="exp-rule"><span class="label">📐 型</span>asked + 人（my mother）+ <strong>to</strong> + 動詞の原形</span><span class="exp-ok">✅ I asked my mother to help me.</span><span class="exp-tip">💡 ask も want/tell と同じ型！</span>',xp:3},
      {q:'I want everyone ___ know about endangered animals.',jp:'私はみんなに絶滅危惧種について知ってほしいです。',a:'to',choices:['to','for','that'],exp:'<span class="exp-rule"><span class="label">📐 型</span>want + everyone + <strong>to</strong> + know</span><span class="exp-ok">✅ I want everyone to know about endangered animals.</span><span class="exp-tip">💡 endangered animals＝絶滅危惧種（単語準備で覚えた語）</span>',xp:4},
      {q:'She wants ___ to come with her.',jp:'彼女は私に一緒に来てほしいと思っています。',a:'me',choices:['me','I','my'],exp:'<span class="exp-rule"><span class="label">📐 「人」の形</span>want の後の「人」は目的格（me, him, her, us, them）</span><span class="exp-ok">✅ She wants me to come with her.</span><span class="exp-tip">💡 I ではなく me！「人」の部分は目的格になる</span>',xp:4},
      {q:'Can you tell Kyon ___ call me later?',jp:'きょんに後で電話するように伝えてくれますか？',a:'to',choices:['to','for','call'],exp:'<span class="exp-rule"><span class="label">📐 型</span>tell + 人（Kyon）+ <strong>to</strong> + 動詞の原形</span><span class="exp-ok">✅ Can you tell Kyon to call me later?</span><span class="exp-tip">💡 Can you tell 人 to ～? ＝ 「〜するように伝えてくれますか」</span>',xp:4},
      {q:'We want more people ___ protect animals.',jp:'私たちはもっと多くの人に動物を守ってほしいです。',a:'to',choices:['to','for','protecting'],exp:'<span class="exp-rule"><span class="label">📐 型</span>want + more people + <strong>to</strong> + protect</span><span class="exp-ok">✅ We want more people to protect animals.</span><span class="exp-tip">💡 protect＝守る（単語準備で覚えた語）</span>',xp:4},
    ];
    qs2.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='<div class="practice-title" style="margin-top:20px">✏️ 英作文問題（例文とほぼ同じでOK！）</div>';
    var qb2=[
      {jp:'私はみんなにこの問題について知ってほしいです。',a:'I want everyone to know about this problem.',exp:'<span class="exp-rule"><span class="label">📐 型</span>I want everyone to know about ...</span><span class="exp-ok">✅ I want everyone to know about this problem.</span><span class="exp-tip">💡 教科書に出てくる文そのまま！自信を持って書こう</span>',xp:6},
      {jp:'母は私に部屋を掃除するように言いました。',a:'My mother told me to clean my room.',exp:'<span class="exp-rule"><span class="label">📐 型</span>told + me + to clean ...</span><span class="exp-ok">✅ My mother told me to clean my room.</span><span class="exp-tip">💡 told（tellの過去形）＋人＋to＋原形</span>',xp:6},
    ];
    qb2.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs2.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+=rearrangeQs(uid,sid,qs2.length+qb2.length+1,[
      {jp:'私はきょんに漫才をやってほしいです。',words:['I','want','Kyon','to do','manzai'],a:'I want Kyon to do manzai.',exp:'<span class="exp-rule"><span class="label">📐 型</span>want + 人 + to + 原形</span><span class="exp-ok">✅ I want Kyon to do manzai.</span><span class="exp-tip">💡 want の直後に「してほしい相手」が来る！</span>',xp:7},
      {jp:'先生は私たちに漫才を見るように言いました。',words:['Our teacher','told','us','to watch','manzai'],a:'Our teacher told us to watch manzai.',exp:'<span class="exp-rule"><span class="label">📐 型</span>told + 人 + to + 原形</span><span class="exp-ok">✅ Our teacher told us to watch manzai.</span><span class="exp-tip">💡 tellの過去形はtold！</span>',xp:7},
      {jp:'私は父に令和ロマンのライブに連れて行ってくれるよう頼みました。',words:['I','asked','my father','to take me','to a Reiwa Roman live show'],a:'I asked my father to take me to a Reiwa Roman live show.',exp:'<span class="exp-rule"><span class="label">📐 型</span>asked + 人 + to + 原形</span><span class="exp-ok">✅ I asked my father to take me to a Reiwa Roman live show.</span><span class="exp-tip">💡 askも同じ型で使える！</span>',xp:8},
    ]);
    html+='</div>';
  }
  else if(sid===3){
    html+='<div class="section-title">③ let/help + 人 + 動詞の原形</div><div class="section-sub">この型だけ to が付かない！「(人)に〜させる」「(人)が〜するのを手伝う」</div>';
    html+='<div class="grammar-card"><div class="grammar-card-title">📐 基本の型（要注意：toなし！）</div>';
    html+='<div class="formula-box">let / help + <span class="highlight">人</span> + <span class="highlight">動詞の原形</span>（toはつけない）....<br><small style="color:var(--text2)">例: Let us tell you about sea otters.<br>（ラッコについてお話しさせてください。）</small></div>';
    html+='<div class="grammar-rule"><div class="rule-title">②との違いに注意！</div><div class="en">want / tell / ask → 人 の後に <strong>to</strong> がつく</div><div class="en">let / help → 人 の後は <strong>to なし</strong>、動詞の原形そのまま</div></div></div>';
    html+=exList(uid,sid,[
      ['Let us tell you about sea otters.','ラッコについてお話しさせてください。'],
      ['People helped sea otters live safely.','人々はラッコが安全に生きる手助けをしました。'],
      ['Can you help me finish my homework?','宿題を終えるのを手伝ってくれますか？'],
      ['Let me know if you have any questions.','質問があれば私に知らせてください。'],
      ['Don\'t let him play video games today.','今日は彼にテレビゲームをさせないでください。'],
      ['Let me tell you about my favorite comedians.','私の好きな芸人についてお話しさせてください。'],
    ]);
    html+='</div><div class="practice-section"><div class="practice-title">✏️ 練習問題</div>';
    var qs3=[
      {q:'Let me ___ you.',jp:'私にあなたを手伝わせてください。',a:'help',choices:['help','to help','helping'],exp:'<span class="exp-rule"><span class="label">📐 型</span>let + me + <strong>help</strong>（to なし・原形のまま）</span><span class="exp-ok">✅ Let me help you.</span><br><span class="exp-ng">❌ Let me to help you（×　toは不要）</span><span class="exp-tip">💡 let の後は絶対に to をつけない！</span>',xp:3},
      {q:'People helped sea otters ___ safely.',jp:'人々はラッコが安全に生きるのを助けました。',a:'live',choices:['live','to live','living'],exp:'<span class="exp-rule"><span class="label">📐 型</span>helped + sea otters + <strong>live</strong>（原形のまま）</span><span class="exp-ok">✅ People helped sea otters live safely.</span><span class="exp-tip">💡 help も to なし！これが②との一番の違い</span>',xp:3},
      {q:'Can you help me ___ my homework?',jp:'宿題を終えるのを手伝ってくれますか？',a:'finish',choices:['finish','to finish','finishing'],exp:'<span class="exp-rule"><span class="label">📐 型</span>help + me + <strong>finish</strong>（原形のまま）</span><span class="exp-ok">✅ Can you help me finish my homework?</span><span class="exp-tip">💡 finish（終える）を原形のまま使う</span>',xp:3},
      {q:'Let us ___ you about endangered animals.',jp:'絶滅危惧種についてお話しさせてください。',a:'tell',choices:['tell','to tell','telling'],exp:'<span class="exp-rule"><span class="label">📐 型</span>Let + us + <strong>tell</strong>（原形のまま）</span><span class="exp-ok">✅ Let us tell you about endangered animals.</span><span class="exp-tip">💡 Let us 〜＝「私たちに〜させてください」という決まり文句</span>',xp:4},
      {q:'Don\'t let him ___ video games today.',jp:'今日は彼にテレビゲームをさせないでください。',a:'play',choices:['play','to play','plays'],exp:'<span class="exp-rule"><span class="label">📐 否定形</span>Don\'t let + him + <strong>play</strong>（原形のまま）</span><span class="exp-ok">✅ Don\'t let him play video games today.</span><span class="exp-tip">💡 否定文でも let の後の動詞は原形のまま変わらない</span>',xp:4},
      {q:'Ken helped me ___ my umbrella.',jp:'ケンは私が傘を見つけるのを手伝ってくれました。',a:'find',choices:['find','to find','found'],exp:'<span class="exp-rule"><span class="label">📐 型</span>helped + me + <strong>find</strong>（原形のまま）</span><span class="exp-ok">✅ Ken helped me find my umbrella.</span><span class="exp-tip">💡 過去の文でも、help の後の動詞は原形のまま！</span>',xp:4},
      {q:'Let me ___ if you have any questions.',jp:'質問があれば私に知らせてください。',a:'know',choices:['know','to know','knowing'],exp:'<span class="exp-rule"><span class="label">📐 型</span>Let + me + <strong>know</strong>（原形のまま）</span><span class="exp-ok">✅ Let me know if you have any questions.</span><span class="exp-tip">💡 Let me know ＝ よく使う決まり文句「知らせてください」</span>',xp:4},
      {q:'My father helped me ___ my bike.',jp:'父は私が自転車を直すのを手伝ってくれました。',a:'fix',choices:['fix','to fix','fixed'],exp:'<span class="exp-rule"><span class="label">📐 型</span>helped + me + <strong>fix</strong>（原形のまま）</span><span class="exp-ok">✅ My father helped me fix my bike.</span><span class="exp-tip">💡 fix（直す）も原形のまま使う</span>',xp:4},
    ];
    qs3.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='<div class="practice-title" style="margin-top:20px">✏️ 英作文問題（例文とほぼ同じでOK！）</div>';
    var qb3=[
      {jp:'ラッコについてお話しさせてください。',a:'Let us tell you about sea otters.',exp:'<span class="exp-rule"><span class="label">📐 型</span>Let us tell you about ...</span><span class="exp-ok">✅ Let us tell you about sea otters.</span><span class="exp-tip">💡 教科書に出てくる文そのまま！toを付けないのを忘れずに</span>',xp:7},
      {jp:'人々はラッコが安全に生きる手助けをしました。',a:'People helped sea otters live safely.',exp:'<span class="exp-rule"><span class="label">📐 型</span>helped + sea otters + live safely</span><span class="exp-ok">✅ People helped sea otters live safely.</span><span class="exp-tip">💡 live の前に to を入れないよう注意！</span>',xp:7},
    ];
    qb3.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_qb'+i;
      html+=qCard(qid,qNum(qs3.length+i+1)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+=rearrangeQs(uid,sid,qs3.length+qb3.length+1,[
      {jp:'私にあなたを手伝わせてください。',words:['Let','me','help','you'],a:'Let me help you.',exp:'<span class="exp-rule"><span class="label">📐 型</span>Let + 人 + 原形（toなし）</span><span class="exp-ok">✅ Let me help you.</span><span class="exp-tip">💡 一番短い形。まずこれを丸ごと覚えよう！</span>',xp:6},
      {jp:'きょんは私が宿題を終えるのを手伝ってくれました。',words:['Kyon','helped','me','finish','my homework'],a:'Kyon helped me finish my homework.',exp:'<span class="exp-rule"><span class="label">📐 型</span>helped + 人 + 原形（toなし）</span><span class="exp-ok">✅ Kyon helped me finish my homework.</span><span class="exp-tip">💡 過去の文でも、helpの後は原形のまま！</span>',xp:7},
      {jp:'ケンは私が漫才の台本を書くのを手伝ってくれました。',words:['Ken','helped','me','write','a manzai script'],a:'Ken helped me write a manzai script.',exp:'<span class="exp-rule"><span class="label">📐 型</span>helped + 人 + 原形（toなし）</span><span class="exp-ok">✅ Ken helped me write a manzai script.</span><span class="exp-tip">💡 write も原形のまま使う！</span>',xp:7},
    ]);
    html+='</div>';
  }
  else if(sid===4){
    html+='<div class="section-title">不定詞 確認テスト</div><div class="section-sub">3つの型の総まとめ！ここまで来られたら、もう自信を持っていい。</div>';
    html+='<div class="practice-section"><div class="practice-title">📝 確認テスト（全20問）</div>';
    var test=[
      {q:'It is important ___ us to protect animals.',jp:'動物を守ることは私たちにとって大切です。',a:'for',choices:['for','to','of'],exp:'It is 形容詞 + for + 人 + to ～。',xp:2},
      {q:'It is necessary ___ everyone to care about the environment.',jp:'環境について気にかけることはみんなにとって必要です。',a:'for',choices:['for','to','with'],exp:'necessary の後も for + 人。',xp:2},
      {q:'It is difficult ___ endangered animals to survive.',jp:'絶滅危惧種の動物にとって生き残ることは難しいです。',a:'for',choices:['for','to','of'],exp:'「人・もの」の前は for。',xp:2},
      {q:'It is exciting for us ___ learn about wild animals.',jp:'野生動物について学ぶことは私たちにとってわくわくします。',a:'to',choices:['to','for','learn'],exp:'for us の後は to + 原形。',xp:2},
      {q:'___ is hard for me to say goodbye.',jp:'さよならを言うことは私にとってつらいです。',a:'It',choices:['It','This','That'],exp:'この型はいつも It から始まる。',xp:3},
      {q:'I want everyone ___ know about the IUCN Red List.',jp:'私はみんなにレッドリストについて知ってほしいです。',a:'to',choices:['to','for','knowing'],exp:'want + 人 + to ～。',xp:2},
      {q:'Riko wants Eddy ___ write the newspaper article.',jp:'理子はエディに新聞記事を書いてほしいと思っています。',a:'to',choices:['to','write','writes'],exp:'want + 人（Eddy）+ to ～。',xp:3},
      {q:'My teacher told us ___ bring our textbooks.',jp:'先生は私たちに教科書を持ってくるように言いました。',a:'to',choices:['to','for','that'],exp:'told + 人 + to ～。',xp:3},
      {q:'I asked my father ___ take me to the zoo.',jp:'私は父に動物園に連れて行ってくれるように頼みました。',a:'to',choices:['to','for','taking'],exp:'asked + 人 + to ～。',xp:3},
      {q:'She wants ___ to come with her.',jp:'彼女は私に一緒に来てほしいと思っています。',a:'me',choices:['me','I','my'],exp:'want の後の「人」は目的格（me）。',xp:4},
      {q:'Let us ___ you about endangered animals.',jp:'絶滅危惧種についてお話しさせてください。',a:'tell',choices:['tell','to tell','telling'],exp:'let + 人 + 動詞の原形（toなし）。',xp:3},
      {q:'People helped sea otters ___ safely.',jp:'人々はラッコが安全に生きる手助けをしました。',a:'live',choices:['live','to live','living'],exp:'help + 人 + 動詞の原形（toなし）。',xp:3},
      {q:'Can you help me ___ my homework?',jp:'宿題を終えるのを手伝ってくれますか？',a:'finish',choices:['finish','to finish','finishing'],exp:'help + 人 + 動詞の原形（toなし）。',xp:3},
      {q:'Don\'t let him ___ video games today.',jp:'今日は彼にテレビゲームをさせないでください。',a:'play',choices:['play','to play','plays'],exp:'否定文でも let の後は原形のまま。',xp:4},
      {q:'Ken helped me ___ my umbrella.',jp:'ケンは私が傘を見つけるのを手伝ってくれました。',a:'find',choices:['find','to find','found'],exp:'help + 人 + 動詞の原形（toなし）。',xp:4},
      {q:'Let me ___ if you have any questions.',jp:'質問があれば私に知らせてください。',a:'know',choices:['know','to know','knowing'],exp:'Let me know ＝決まり文句。',xp:3},
      {q:'It is important for us ___ save endangered animals.',jp:'絶滅危惧種の動物を救うことは私たちにとって大切です。',a:'to',choices:['to','for','saving'],exp:'for us の後は to + 原形。',xp:3},
      {q:'I want more people ___ protect wild animals.',jp:'私はもっと多くの人に野生動物を守ってほしいです。',a:'to',choices:['to','for','protecting'],exp:'want + 人 + to ～。',xp:3},
      {q:'My mother told me ___ clean my room.',jp:'母は私に部屋を掃除するように言いました。',a:'to',choices:['to','for','cleaning'],exp:'told + 人 + to ～。',xp:3},
      {q:'Let me ___ you carry your bag.',jp:'あなたのかばんを運ぶのを手伝わせてください。',a:'help',choices:['help','to help','helping'],exp:'let + 人 + 動詞の原形（toなし）。',xp:4},
    ];
    test.forEach(function(q,i){
      var qid=uid+'_s'+sid+'_q'+i;
      html+=qCard(qid,qNum(i+1)+'/20<div class="q-text">'+q.q.replace('___','<span class="blank">___</span>')+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
    });
    html+='</div>';
  }
  return html;
}

// ===== 特訓モード =====
var tokkuQueue=[],tokkuIndex=0,tokkuSession={correct:0,total:0};

function renderTokkuMode(uid){
  currentSection=5;
  renderSectionTabs();
  var wqs=getWeakQuestions().filter(function(q){return q.startsWith(uid+'_');});
  var mc=document.getElementById('mainContent');
  if(wqs.length===0){
    mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div style="font-size:15px;color:#8b949e;margin-top:12px">きょん「俺、完璧じゃん！！」<br>西村「よくやった。次のUnitに進もう」</div><button onclick="goSection(0)" style="margin-top:24px;background:var(--gold);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">セクションに戻る</button></div>';
    return;
  }
  tokkuQueue=wqs.slice(0,15);tokkuIndex=0;tokkuSession={correct:0,total:0};
  renderTokkuCard(uid);
}

function renderTokkuCard(uid){
  var mc=document.getElementById('mainContent');
  if(tokkuIndex>=tokkuQueue.length){showTokkuComplete(uid);return;}
  var qid=tokkuQueue[tokkuIndex];
  var d=weakDB[qid];if(!d){tokkuIndex++;renderTokkuCard(uid);return;}
  var pct=getPct(qid);
  var color=pct<30?'#e94560':pct<60?'#f5c518':'#3fb950';
  var isChoice=d.choices&&d.choices.length>0;
  var choicesHtml=isChoice?'<div class="tokku-choices" id="tokku_choices"></div>':'<input class="q-input" id="tokku_input" placeholder="英語で入力…" style="font-size:17px;margin-bottom:10px"><button id="tokku_submit" class="check-btn" style="width:100%;padding:12px;font-size:15px">採点 ✓</button>';
  if(isChoice)window._tokkuChoices={qid:qid,choices:d.choices.slice().sort(function(){return Math.random()-0.5;})};
  else{window._tokkuChoices=null;window._tokkuQid=qid;}
  mc.innerHTML='<div class="tokku-progress">🔥 特訓 '+(tokkuIndex+1)+' / '+tokkuQueue.length+'　今回: '+tokkuSession.correct+'/'+tokkuSession.total+'正解</div>'
    +'<div class="tokku-card"><div class="tokku-stat">正答率: <span style="color:'+color+';font-weight:bold">'+pct+'%</span>（'+d.correct+'/'+d.total+'回正解）</div>'
    +'<div class="tokku-jp">🇯🇵 '+d.jp+'</div>'+choicesHtml
    +'<div class="tokku-result" id="tokku_result"></div></div>'
    +'<button onclick="nextTokkuCard('+uid+')" id="tokku_next" style="display:none;width:100%;margin-top:12px;background:var(--blue);color:#fff;border:none;padding:14px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題へ →</button>';
  if(window._tokkuChoices){
    var tc=window._tokkuChoices,cel=document.getElementById('tokku_choices');
    if(cel){tc.choices.forEach(function(c){var btn=document.createElement('button');btn.className='choice-btn';btn.textContent=c;btn.style.fontSize='16px';btn.style.padding='12px 24px';btn.addEventListener('click',function(){checkTokkuAnswer(tc.qid,c,uid);});cel.appendChild(btn);});}
  }
  var inp=document.getElementById('tokku_input');if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')checkTokkuInput(qid,uid);});
  var sub=document.getElementById('tokku_submit');if(sub)sub.addEventListener('click',function(){checkTokkuInput(qid,uid);});
}

function checkTokkuAnswer(qid,choice,uid){
  var d=weakDB[qid];if(!d)return;
  document.querySelectorAll('.tokku-card .choice-btn').forEach(function(b){b.disabled=true;if(b.textContent===d.answer)b.classList.add('selected-correct');else if(b.textContent===choice&&choice!==d.answer)b.classList.add('selected-wrong');});
  showTokkuResult(qid,d,choice===d.answer,choice,uid);
}
function checkTokkuInput(qid,uid){
  var d=weakDB[qid],inp=document.getElementById('tokku_input');if(!inp||!d)return;
  var val=inp.value;inp.disabled=true;showTokkuResult(qid,d,flexMatch(val,d.answer),val,uid);
}
function showTokkuResult(qid,d,correct,val,uid){
  tokkuSession.total++;
  var resEl=document.getElementById('tokku_result');if(!resEl)return;
  if(!weakDB[qid])return;
  weakDB[qid].total++;
  if(correct){weakDB[qid].correct++;tokkuSession.correct++;xp+=1;localStorage.setItem('nh3_xp',xp);updateXP();}
  else{deductXP(3);}
  localStorage.setItem('nh3_weakdb',JSON.stringify(weakDB));
  renderWeakBar();renderSectionTabs();
  var newPct=getPct(qid);
  if(correct){
    resEl.className='tokku-result tokku-correct';
    resEl.innerHTML='✅ 正解！'+(newPct>=80?' 🎉 正答率'+newPct+'%！':'  正答率 → '+newPct+'%')+'<div style="font-size:12px;color:#8b949e;margin-top:4px">'+d.exp+'</div>';
    showToast(getComment('correct'));
  } else {
    resEl.className='tokku-result tokku-wrong';
    resEl.innerHTML='❌ 間違い！正答率 → '+newPct+'%<div class="tokku-answer">'+d.answer+'</div><div style="font-size:11px;color:#8b949e;margin-top:4px">'+d.exp+'</div>';
    showToast('きょん「また間違えた！！でも諦めない！！」');
  }
  resEl.style.display='block';
  document.getElementById('tokku_next').style.display='block';
}
function nextTokkuCard(uid){tokkuIndex++;renderTokkuCard(uid);}
function showTokkuComplete(uid){
  var mc=document.getElementById('mainContent');
  var pctAll=tokkuSession.total>0?Math.round(tokkuSession.correct/tokkuSession.total*100):0;
  var emoji=pctAll>=80?'🏆':pctAll>=60?'😎':'💪';
  var msg=pctAll>=80?'きょん「全部わかった！！昇格の予感！！」<br>西村「よくやった。次回も頼む」':pctAll>=50?'きょん「半分以上できた！もう一回やる！」<br>西村「続けること。それが大事」':'きょん「難しかった…でも諦めない！！」<br>西村「何度でもやればいい。繰り返すことが力になる」';
  mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">'+emoji+'</div><div class="tokku-complete-title">特訓終了！</div><div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">'+pctAll+'%</div><div style="font-size:14px;color:#8b949e">'+tokkuSession.correct+' / '+tokkuSession.total+'問正解</div><div style="font-size:14px;color:#8b949e;margin-top:16px;line-height:1.8">'+msg+'</div><div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button onclick="renderTokkuMode('+uid+')" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回特訓！</button><button onclick="goSection(0)" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">セクションに戻る</button></div></div>';
  renderWeakBar();
}

// ===== INIT =====
updateXP();renderWeakBar();renderUnitTabs();
(function(){
  var params=new URLSearchParams(location.search);
  var reqUnit=parseInt(params.get('unit'),10);
  var validIds=UNITS.map(function(u){return u.id;});
  if(validIds.indexOf(reqUnit)!==-1){
    currentUnit=reqUnit;currentSection=0;
    renderUnitTabs();renderSectionTabs();renderSection(reqUnit,0);
  } else {
    renderSectionTabs();renderSection(1,0);
  }
})();