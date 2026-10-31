// ===== 英語 中3 Unit4〜6（New Horizon 3・令和7年度版）=====
// Unit4 間接疑問文・SVOO(what節)・分詞の後置修飾 / Unit5 接触節・関係代名詞 / Unit6 仮定法・主語を説明する関係代名詞
// XP・弱点DB・採点キャッシュは英語共通の nh3_xp / nh3_weakdb / nh3_answered / nh3_grades を使う。
// qid は u{Unit番号}_s{セクション}_q{番号}（例 u4_s1_q0）。セクション完了は nh3_u456_secdone。

// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   label:'Lv.1 🥚', badge:'NSC入学',       title:'見習い研修生',       status:'きょん「英語？なにそれ食えるの？」' },
  { lv:2, min:15,  label:'Lv.2 🎤', badge:'NSC卒業',       title:'一般社員',           status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  label:'Lv.3 🎭', badge:'劇場デビュー',   title:'主任',               status:'きょん「にっくん、俺英語できるかも」' },
  { lv:4, min:80,  label:'Lv.4 ⭐', badge:'準レギュラー獲得', title:'係長',             status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, label:'Lv.5 📺', badge:'全国ネット',     title:'課長',               status:'きょん「にっくんより賢くなってきた」' },
  { lv:6, min:220, label:'Lv.6 🌟', badge:'冠番組獲得',    title:'部長',               status:'きょん「英語で漫才できるかもしれない」' },
  { lv:7, min:320, label:'Lv.7 🏆', badge:'M-1決勝進出',   title:'取締役',             status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, label:'Lv.8 👑', badge:'M-1グランプリ優勝', title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' }
];

var SEC_KEY = 'nh3_u456_secdone';
var TEST_SID = 5, TOKKU_SID = 6;
function qp(uid){ return 'u'+uid; }

var xp = parseInt(localStorage.getItem('nh3_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('nh3_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem(SEC_KEY) || '{}');
var weakDB = JSON.parse(localStorage.getItem('nh3_weakdb') || '{}');
var gradeCache = JSON.parse(localStorage.getItem('nh3_grades') || '{}');
var attemptCounts = {};

function getLevel(x) { for (var i=LEVELS.length-1;i>=0;i--) { if (x>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }
function getNextLevel(x) { var c=getLevel(x); for(var i=0;i<LEVELS.length;i++) { if(LEVELS[i].lv===c.lv+1) return LEVELS[i]; } return null; }

function updateXP() {
  var lv=getLevel(xp), next=getNextLevel(xp);
  var fromXP=lv.min, toXP=next?next.min:lv.min+100;
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
function audioBtn(id,text) { audioStore[id]=text; return '<button class="audio-btn" id="ab_'+id+'" data-audio="'+id+'" title="音声">🔊</button>'; }

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
  correct:['きょん「合ってる合ってる！すごくない！？」','きょん「やった！正解！天才かも！」','きょん「にっくん見て！俺より賢いかも！」','きょん「合ってる！もう英語得意になってるんじゃない！？」'],
  correct_nishi:['西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「正解。次も頼む」','西村「合ってる。広島でも東京でも通用するよ」'],
  wrong:['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！まだまだ大丈夫！！」','きょん「何回間違えてんの！！にっくんに怒られる！！」','きょん「もうやだ！！でも諦めないぞ！！答えを見ちゃおうかな…」']
};
function getComment(t){var a=ARTISTS[t];return a[Math.floor(Math.random()*a.length)];}

// ===== WEAK DB =====
function recordResult(qid,isCorrect) {
  var meta=qMeta[qid]; if (!meta) return;
  if (!weakDB[qid]) weakDB[qid]={jp:meta.jp||'',answer:meta.answer||'',choices:meta.choices||[],exp:meta.exp||'',type:meta.type||'choice',correct:0,total:0};
  if (meta.q) weakDB[qid].q=meta.q;
  weakDB[qid].total++;
  if (isCorrect) weakDB[qid].correct++;
  localStorage.setItem('nh3_weakdb',JSON.stringify(weakDB));
  renderWeakBar(); renderSectionTabs();
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
// スマホのキーボードが打つ ’ ‘ をふつうの ' にそろえてから比べる
function unifyQuote(s){return (s||'').replace(/[‘’`]/g,"'");}
function normalize(s){return unifyQuote(s).trim().toLowerCase().replace(/[.,!?'"]/g,'').replace(/\s+/g,' ');}
function flexMatch(val,answer){
  var v=normalize(val),a=normalize(answer);
  if(v===a)return true;
  var aWords=a.split(' ').filter(function(w){return w.length>1;});
  return aWords.every(function(w){return v.indexOf(w)!==-1;});
}
function localSmartGrade(val,answer){
  var v=unifyQuote(val).trim().toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ');
  var a=unifyQuote(answer).trim().toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ');
  if(v===a)return{grade:'◎',xpRate:1.0,comment:'完璧！そのまま覚えよう！'};
  var vW=v.split(' '),aW=a.split(' ');
  var matched=aW.filter(function(w){return vW.indexOf(w)!==-1;});
  var rate=matched.length/aW.length;
  var gWords=['am','is','are','was','were','do','does','did',"don't","doesn't","didn't","wasn't","weren't",'not','been','have','has','had','who','which','that','would','could','will','can','if','wish'];
  var aG=aW.filter(function(w){return gWords.indexOf(w)!==-1;});
  var vG=aG.filter(function(w){return vW.indexOf(w)!==-1;});
  var gramOk=aG.length===0||vG.length===aG.length;
  var orderOk=true;
  var key=aW.slice(0,3);var last=-1;
  key.forEach(function(w){var idx=vW.indexOf(w);if(idx===-1||idx<last)orderOk=false;else last=idx;});
  if(rate>=0.9&&gramOk&&orderOk)return{grade:'◎',xpRate:1.0,comment:'ほぼ完璧！文法もバッチリ！'};
  if(rate>=0.75&&gramOk&&orderOk)return{grade:'○',xpRate:0.6,comment:'惜しい！文法はOK、単語が少し違う。'};
  if(gramOk&&rate>=0.5)return{grade:'△',xpRate:0.2,comment:'文法の大事な語は合ってるけど単語が足りない。正解文をよく見よう。'};
  if(!gramOk&&rate>=0.6)return{grade:'△',xpRate:0.2,comment:'文法の大事な語（who / which / were / would など）が違う。もう一度確認！'};
  return{grade:'✗',xpRate:0,comment:'もう一度！正解文をよく見て覚えよう。'};
}

function makeChoices(qid,choices,answer,xpPts,jpText,expText,qText){
  choices = choices.slice().sort(function(){ return Math.random() - 0.5; });
  qMeta[qid]={type:'choice',answer:answer,xp:xpPts,jp:jpText,exp:expText,choices:choices,q:qText||''};
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
  return '<input class="q-input" id="qi_'+qid+'" data-qid="'+qid+'" placeholder="英文を入力…（採点あり）" autocapitalize="off" autocomplete="off" spellcheck="false">'
    +'<button class="check-btn" data-qid="'+qid+'">採点 ✓</button>'
    +'<div class="grade-result" id="gr_'+qid+'"></div>';
}
function makeFeedback(qid,explanation){
  var shown=answeredSet[qid]?'display:block':'display:none';
  return '<div class="q-feedback correct-fb" id="fb_'+qid+'" style="'+shown+'"><strong>✓ 正解！</strong></div>'
    +'<div class="q-feedback wrong-fb" id="fbw_'+qid+'" style="display:none">✗ もう一度チャレンジ！</div>'
    +'<div class="exp-card" id="exp_card_'+qid+'" style="'+shown+'"><div class="exp-card-title">📌 解説</div><div style="color:#e8e0d0;font-size:15px;line-height:2.0">'+explanation+'</div></div>'
    +'<button class="show-answer-btn" id="sab_'+qid+'" data-qid="'+qid+'">💡 答えを見る（XPなし）</button>'
    +'<div class="answer-revealed" id="ar_'+qid+'"><div class="ans-label">✅ 正解</div><div id="ar_ans_'+qid+'" style="font-size:18px;color:var(--gold);font-weight:bold;margin-bottom:6px"></div></div>'
    +'<div class="artist-comment" id="ac_'+qid+'" style="'+shown+'">'+(answeredSet[qid]?getComment('correct_nishi'):'')+'</div>';
}
function showExp(qid){
  var ec=document.getElementById('exp_card_'+qid);if(ec)ec.style.display='block';
}

function handleCheck(qid){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid])return;
  var val=(document.getElementById('qi_'+qid)||{}).value||'';
  if(meta.type==='composition'){
    if(!val.trim()){showToast('英文を入力してください！');return;}
    gradeComposition(qid,meta,val); return;
  }
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
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function showGradeResult(qid,meta,val,result){
  var grDiv=document.getElementById('gr_'+qid);
  var input=document.getElementById('qi_'+qid);
  var card=document.querySelector('[data-card="'+qid+'"]');
  var sab=document.getElementById('sab_'+qid);
  var chk=document.querySelector('.check-btn[data-qid="'+qid+'"]');
  var grade=result.grade||'✗',xpRate=typeof result.xpRate==='number'?result.xpRate:0,comment=result.comment||'';
  var clsMap={'◎':'grade-perfect','○':'grade-good','△':'grade-partial','✗':'grade-wrong'};
  var iconMap={'◎':'✅','○':'🔵','△':'🟡','✗':'❌'};
  var cls=clsMap[grade]||'grade-wrong',icon=iconMap[grade]||'❌';
  var earnedXP=Math.round(meta.xp*xpRate);
  var xpNote=earnedXP>0?'＋'+earnedXP+' XP 獲得！':'XPなし';
  var wrongAns=grade!=='◎'?'<div style="margin-top:10px;border-radius:8px;overflow:hidden;"><div style="padding:8px 12px;background:rgba(233,69,96,0.08);border-left:3px solid var(--red);"><div style="font-size:12px;color:var(--text2);margin-bottom:3px">❌ あなたの回答</div><div style="font-family:Times New Roman,serif;font-size:17px;color:#f87171;">'+escHtml(val)+'</div></div><div style="padding:8px 12px;background:rgba(63,185,80,0.08);border-left:3px solid var(--green);margin-top:4px;"><div style="font-size:12px;color:var(--text2);margin-bottom:3px">✅ 正しい答え</div><div style="font-family:Times New Roman,serif;font-size:17px;color:var(--gold);font-weight:bold;">'+meta.answer+'</div></div></div>':'';
  var artistComment=xpRate>=1.0?getComment('correct_nishi'):xpRate>=0.5?'きょん「惜しい！あと少し！」':xpRate>0?'きょん「ちょっとだけわかってたよ！もう一回！」':getComment('wrong');
  if(grDiv){
    grDiv.className='grade-result '+cls;
    grDiv.innerHTML='<span class="grade-icon">'+icon+'</span><strong>'+grade+'</strong>　'+comment+wrongAns+'<div class="grade-xp-note" style="margin-top:8px">'+xpNote+'</div><div class="artist-comment" style="display:block;margin-top:6px">'+artistComment+'</div>';
    grDiv.style.display='block';
  }
  var cacheEntry={icon:icon,cls:cls,comment:grade+'　'+comment,xpRate:xpRate,xpNote:xpNote};
  gradeCache[qid]=cacheEntry; localStorage.setItem('nh3_grades',JSON.stringify(gradeCache));
  recordResult(qid,xpRate>0);
  if(chk)chk.style.display='none';
  if(input)input.disabled=true;
  showExp(qid);
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
    if(sab)sab.style.display='none';
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
  var sab=document.getElementById('sab_'+qid);if(sab)sab.style.display='none';
  showExp(qid);
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
  // 不正解でも解説はすぐ見せる（共通仕様）
  showExp(qid);
  if(choice){
    var btn=document.querySelector('.choice-btn[data-qid="'+qid+'"][data-choice="'+choice+'"]');
    if(btn){btn.classList.add('selected-wrong');btn.disabled=true;}
  }
  if(attemptCounts[qid]>=2){var sab=document.getElementById('sab_'+qid);if(sab)sab.style.display='inline-block';}
  var demoted=deductXP(5);
  var msgs=ARTISTS.wrong;
  var msg=msgs[Math.min(msgs.length-1,attemptCounts[qid]-1)];
  if(demoted){setTimeout(function(){var lv=getLevel(xp);showToast('💦 降格… '+lv.badge+'に戻った… きょん「降格した…！！せっかく昇格したのに！」','demote');},200);}
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
  showExp(qid);
  var ac=document.getElementById('ac_'+qid);
  if(ac){ac.textContent='きょん「ふーん、そういうことか。覚えた！次は自分でできる！」';ac.style.display='block';}
  showToast('西村「答えを見るのも学習のうち。次は自分で解いてみよう」');
  checkSectionComplete();
}
function checkSectionComplete(){
  var pre=qp(currentUnit)+'_s'+currentSection+'_';
  var secQ=Object.keys(qMeta).filter(function(id){return id.indexOf(pre)===0;});
  if(secQ.length>0&&secQ.every(function(id){return answeredSet[id];})){
    var key=qp(currentUnit)+'_'+currentSection;
    if(!sectionDone[key]){
      sectionDone[key]=true;
      localStorage.setItem(SEC_KEY,JSON.stringify(sectionDone));
      renderSectionTabs();
    }
    var nb=document.getElementById('nextBtn');if(nb)nb.style.display='block';
  }
}

// ===== UNITS =====
var currentUnit=4, currentSection=0;
var UNITS=[
  {id:4,label:'Unit4 間接疑問・分詞',title:'教科書 Unit4（防災）'},
  {id:5,label:'Unit5 関係代名詞',title:'教科書 Unit5（ガンディー）'},
  {id:6,label:'Unit6 仮定法',title:'教科書 Unit6（地球市民）'}
];
var UNIT_SECTIONS={
  4:[{id:0,label:'単語準備'},{id:1,label:'間接疑問文'},{id:2,label:'tell 人 what'},{id:3,label:'〜ingで説明'},{id:4,label:'過去分詞で説明'},{id:5,label:'確認テスト'},{id:6,label:'🔥特訓'}],
  5:[{id:0,label:'単語準備'},{id:1,label:'名詞+主語+動詞'},{id:2,label:'who'},{id:3,label:'which/that①'},{id:4,label:'which/that②'},{id:5,label:'確認テスト'},{id:6,label:'🔥特訓'}],
  6:[{id:0,label:'単語準備'},{id:1,label:'I wish'},{id:2,label:'If I were'},{id:3,label:'If+過去形'},{id:4,label:'長い主語'},{id:5,label:'確認テスト'},{id:6,label:'🔥特訓'}]
};

function renderUnitTabs(){
  var html='';
  UNITS.forEach(function(u){
    var cls='unit-tab'+(u.id===currentUnit?' active':'');
    html+='<button class="'+cls+'" data-unit="'+u.id+'">'+u.label+'</button>';
  });
  document.getElementById('unitTabs').innerHTML=html;
}
function renderSectionTabs(){
  var secs=UNIT_SECTIONS[currentUnit];
  var wk=getWeakQuestions().filter(function(q){return q.indexOf(qp(currentUnit)+'_')===0;});
  var html='';
  secs.forEach(function(s){
    var key=qp(currentUnit)+'_'+s.id;
    var cls='section-tab';
    if(s.id===currentSection)cls+=' active';
    if(s.id===TOKKU_SID)cls+=' tokku';
    if(sectionDone[key]&&s.id!==TOKKU_SID)cls+=' done';
    var label=s.label+(sectionDone[key]&&s.id!==TOKKU_SID?' ✓':'');
    if(s.id===TOKKU_SID)label='🔥特訓'+(wk.length>0?'('+wk.length+')':'');
    html+='<button class="'+cls+'" data-sec="'+s.id+'">'+label+'</button>';
  });
  document.getElementById('sectionTabs').innerHTML=html;
}
function goUnit(uid){currentUnit=uid;currentSection=0;qMeta={};renderUnitTabs();renderSectionTabs();renderSection(uid,0);window.scrollTo(0,0);}
function goSection(sid){currentSection=sid;qMeta={};renderSectionTabs();renderSection(currentUnit,sid);window.scrollTo(0,0);}

// タブ・音声・ボタンはすべて data-* 属性＋イベント委任で動かす（onclick 内の引用符で壊れないように）
document.addEventListener('click',function(e){
  var t=e.target.closest?e.target.closest('[data-unit],[data-sec],[data-audio],[data-go],[data-act]'):null;
  if(!t)return;
  if(t.hasAttribute('data-unit')){goUnit(parseInt(t.getAttribute('data-unit'),10));return;}
  if(t.hasAttribute('data-sec')){goSection(parseInt(t.getAttribute('data-sec'),10));return;}
  if(t.hasAttribute('data-audio')){playAudio(t.getAttribute('data-audio'));return;}
  if(t.hasAttribute('data-go')){var g=t.getAttribute('data-go').split(':');if(g[0]==='u')goUnit(parseInt(g[1],10));else goSection(parseInt(g[1],10));return;}
  var act=t.getAttribute('data-act');
  if(act==='tokku-next'){nextTokkuCard(currentUnit);}
  else if(act==='tokku-again'){renderTokkuMode(currentUnit);}
});

// ===== RENDER =====
function renderSection(uid,sid){
  if(sid===TOKKU_SID){renderTokkuMode(uid);return;}
  var secs=UNIT_SECTIONS[uid];
  var html='<div class="progress-dots">';
  secs.forEach(function(s){
    if(s.id===TOKKU_SID)return;
    var cls='dot';
    if(s.id<sid)cls+=' done';
    if(s.id===sid)cls+=' current';
    html+='<div class="'+cls+'"></div>';
  });
  html+='</div>';
  var uObj=UNITS.filter(function(u){return u.id===uid;})[0];
  html+='<div class="section-badge">'+uObj.title+' · SECTION '+sid+'</div>';

  var d=UNIT_DATA[uid][sid];
  if(d.type==='vocab')html+=renderVocabSection(uid,sid,d);
  else if(d.type==='grammar')html+=renderGrammarSection(uid,sid,d);
  else if(d.type==='test')html+=renderTestSection(uid,sid,d);

  var isLast=(sid===TEST_SID);
  var go=isLast?(uid<6?'u:'+(uid+1):'s:'+TOKKU_SID):'s:'+(sid+1);
  var label=isLast?(uid<6?'✓ 次のUnitへ →':'🔥 特訓で弱点をつぶす →'):'次のセクションへ →';
  html+='<button class="next-section-btn" id="nextBtn" data-go="'+go+'">'+label+'</button>';

  document.getElementById('mainContent').innerHTML=html;

  document.querySelectorAll('.check-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){handleCheck(btn.dataset.qid);});});
  document.querySelectorAll('.q-input[data-qid]').forEach(function(inp){inp.addEventListener('keydown',function(e){if(e.key==='Enter')handleCheck(inp.dataset.qid);});});
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){handleChoice(btn.dataset.qid,btn.dataset.choice);});});
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){showAnswer(btn.dataset.qid);});});

  if(sectionDone[qp(uid)+'_'+sid]){var nb=document.getElementById('nextBtn');if(nb)nb.style.display='block';}
  checkSectionComplete();
}

function qCard(qid,content){return '<div class="q-card" data-card="'+qid+'">'+content+'</div>';}
function qNum(n,total){return '<div class="q-number">Q'+n+(total?' / '+total:'')+'</div>';}
function blankify(q){return q.replace('___','<span class="blank">＿＿＿</span>');}

// 例文リスト（🔊つき）。tag で同じセクション内の別リストと id を分ける
function exList(uid,sid,arr,tag){
  return '<ul class="example-list">'+arr.map(function(e,i){
    var aid=qp(uid)+'_s'+sid+'_'+(tag||'ex')+'_'+i;
    return '<li class="example-item">'+audioBtn(aid,e[0])+'<span class="en">'+e[0]+'</span><span class="jp">'+e[1]+'</span></li>';
  }).join('')+'</ul>';
}

// 会話。きょん・西村に加えて、Unitごとのゲスト（しゅん・くるま・イワクラ）
var CAST={
  kyon:   {name:'きょん',                      av:'😄', cls:'av-kyon',  style:''},
  nishi:  {name:'西村（慶應卒・元アナ）',      av:'慶', cls:'av-nishi', style:''},
  shun:   {name:'なかむらしゅん（9番街レトロ）', av:'🎭', cls:'',        style:'background:#2d6a4f;'},
  kuruma: {name:'くるま（令和ロマン）',        av:'🚗', cls:'',        style:'background:#6d28d9;'},
  iwakura:{name:'イワクラ（蛙亭）',            av:'🎸', cls:'',        style:'background:#b45309;'}
};
function dialog(lines){
  var guest=lines.some(function(l){return l.who!=='kyon'&&l.who!=='nishi';});
  return '<div class="intro-box"><div class="intro-box-title">📺 '+(guest?'きょん＆西村＋ゲスト':'きょん＆西村の会話')+'</div>'+lines.map(function(l){
    var c=CAST[l.who];
    return '<div class="chat-line"><div class="avatar '+c.cls+'" style="'+c.style+'">'+c.av+'</div><div><div class="chat-name">'+c.name+'</div><div class="chat-bubble">'+l.text+'</div></div></div>';
  }).join('')+'</div>';
}

// 解説カード：📐ルール／✅正例／❌誤例／💡覚え方
function E(rule,ok,ng,tip){
  return '<span class="exp-rule"><span class="label">📐 ルール</span>'+rule+'</span>'
    +'<span class="exp-ok">✅ '+ok+'</span>'
    +(ng?'<span class="exp-ng">❌ '+ng+'</span>':'')
    +(tip?'<span class="exp-tip">💡 '+tip+'</span>':'');
}

// 強調用
function H(s){return '<span class="hl">'+s+'</span>';}
function H2(s){return '<span class="hl2">'+s+'</span>';}
function X(s){return '<span class="strike">'+s+'</span>';}

// 変身図（上の形 → 下の形）
function changeCard(title,rows){
  return '<div class="grammar-card"><div class="grammar-card-title">'+title+'</div>'+rows.map(function(r){
    return '<div class="change-row"><div class="change-from">'+r[0]+'</div><div class="change-arrow">⬇</div><div class="change-to">'+r[1]+'</div>'+(r[2]?'<div class="change-note">'+r[2]+'</div>':'')+'</div>';
  }).join('')+'</div>';
}
// 後ろから説明する図：［名詞］←［説明］
function backCard(title,rows){
  return '<div class="grammar-card"><div class="grammar-card-title">'+title+'</div>'+rows.map(function(r){
    return '<div class="back-row"><div class="back-boxes"><span class="box-noun">'+r[0]+'</span><span class="box-arrow">◀</span><span class="box-mod">'+r[1]+'</span></div><div class="back-jp">'+r[2]+'</div></div>';
  }).join('')+'</div>';
}
// 比べる表
function compareCard(title,head,rows){
  return '<div class="grammar-card"><div class="grammar-card-title">'+title+'</div><div class="cmp-wrap"><table class="cmp"><tr>'+head.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr>'
    +rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';}).join('')+'</table></div></div>';
}

function wordBank(words){
  words = words.slice().sort(function(){ return Math.random() - 0.5; });
  return '<div class="word-bank">'+words.map(function(w){return '<span class="word-chip">'+w+'</span>';}).join('')+'</div>';
}

function choiceBlock(uid,sid,qs,startNum,total){
  var html='';
  qs.forEach(function(q,i){
    var qid=qp(uid)+'_s'+sid+'_q'+i;
    html+=qCard(qid,qNum(startNum+i,total)+'<div class="q-text">'+blankify(q.q)+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp,q.q)+makeFeedback(qid,q.exp));
  });
  return html;
}
function compBlock(uid,sid,qs,startNum){
  var html='<div class="practice-title" style="margin-top:20px">✏️ 英作文（上の例文とほぼ同じでOK！）</div>';
  qs.forEach(function(q,i){
    var qid=qp(uid)+'_s'+sid+'_qb'+i;
    html+=qCard(qid,qNum(startNum+i)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
  });
  return html;
}
function rearrangeBlock(uid,sid,qs,startNum){
  var html='<div class="practice-title" style="margin-top:20px">🔀 語句を並べ替えて英文を完成させよう（打ちこんで答える）</div>';
  qs.forEach(function(q,i){
    var qid=qp(uid)+'_s'+sid+'_qc'+i;
    html+=qCard(qid,qNum(startNum+i)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+wordBank(q.words)+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
  });
  return html;
}

function renderVocabSection(uid,sid,d){
  var html='<div class="section-title">'+d.title+'</div><div class="section-sub">'+d.sub+'</div>';
  html+=dialog(d.talk);
  if(d.info)html+=d.info;
  html+='<div class="grammar-card"><div class="grammar-card-title">📚 このUnitの単語（先に音だけ聞いてみよう）</div>'+exList(uid,sid,d.words,'vocab')
    +'<div class="grammar-rule" style="margin-top:10px"><div class="en" style="color:#8b949e">💡 全部覚えなくて大丈夫。🔊を何回も押して、音と意味をセットで慣らしておくだけでOK。</div></div></div>';
  html+='<div class="practice-section"><div class="practice-title">✏️ まずは単語だけ確認（かんたん'+d.qs.length+'問）</div>';
  html+=choiceBlock(uid,sid,d.qs,1);
  html+='</div>';
  html+='<div style="text-align:center;margin-top:24px"><button data-sec="1" class="unit-complete-btn">📖 文法へ進む →</button></div>';
  return html;
}

function renderGrammarSection(uid,sid,d){
  var html='<div class="section-title">'+d.title+'</div><div class="section-sub">'+d.sub+'</div>';
  if(d.talk)html+=dialog(d.talk);
  html+='<div class="grammar-card"><div class="grammar-card-title">📐 基本の型</div><div class="formula-box">'+d.formula+'</div>';
  html+='<div class="grammar-rule"><div class="rule-title">'+d.ruleTitle+'</div>'+d.rules.map(function(r){return '<div class="en">'+r+'</div>';}).join('')+'</div></div>';
  if(d.visual)html+=d.visual;
  html+='<div class="practice-title" style="margin-top:18px">🔊 例文（音で覚えよう）</div>'+exList(uid,sid,d.ex,'ex');
  if(d.more)d.more.forEach(function(m,mi){
    html+='<div class="grammar-card" style="margin-top:18px"><div class="grammar-card-title">'+m.title+'</div>'+(m.note?'<div class="grammar-rule">'+m.note+'</div>':'')+exList(uid,sid,m.ex,'more'+mi)+'</div>';
  });
  html+='<div class="practice-section"><div class="practice-title">✏️ 練習問題（えらぶ）</div>';
  html+=choiceBlock(uid,sid,d.qs,1);
  html+=compBlock(uid,sid,d.qb,d.qs.length+1);
  html+=rearrangeBlock(uid,sid,d.qc,d.qs.length+d.qb.length+1);
  html+='</div>';
  return html;
}

function renderTestSection(uid,sid,d){
  var html='<div class="section-title">'+d.title+'</div><div class="section-sub">'+d.sub+'</div>';
  if(d.talk)html+=dialog(d.talk);
  html+='<div class="practice-section"><div class="practice-title">📝 確認テスト（全'+d.qs.length+'問）</div>';
  html+=choiceBlock(uid,sid,d.qs,1,d.qs.length);
  html+='</div>';
  return html;
}

// ===== 特訓モード =====
var tokkuQueue=[],tokkuIndex=0,tokkuSession={correct:0,total:0};

function renderTokkuMode(uid){
  currentSection=TOKKU_SID;
  renderSectionTabs();
  var wqs=getWeakQuestions().filter(function(q){return q.indexOf(qp(uid)+'_')===0;});
  var mc=document.getElementById('mainContent');
  if(wqs.length===0){
    mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div style="font-size:15px;color:#8b949e;margin-top:12px;line-height:2">きょん「俺、完璧じゃん！！」<br>西村「よくやった。まだ解いていないセクションがあれば進もう」</div><button data-sec="0" style="margin-top:24px;background:var(--gold);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">セクションに戻る</button></div>';
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
  var choicesHtml=isChoice?'<div class="tokku-choices" id="tokku_choices"></div>':'<input class="q-input" id="tokku_input" placeholder="英語で入力…" autocapitalize="off" autocomplete="off" spellcheck="false" style="font-size:17px;margin-bottom:10px"><button id="tokku_submit" class="check-btn" style="width:100%;padding:12px;font-size:15px">採点 ✓</button>';
  var choices=isChoice?d.choices.slice().sort(function(){return Math.random()-0.5;}):[];
  mc.innerHTML='<div class="tokku-progress">🔥 特訓 '+(tokkuIndex+1)+' / '+tokkuQueue.length+'　今回: '+tokkuSession.correct+'/'+tokkuSession.total+'正解</div>'
    +'<div class="tokku-card"><div class="tokku-stat">正答率: <span style="color:'+color+';font-weight:bold">'+pct+'%</span>（'+d.correct+'/'+d.total+'回正解）</div>'
    +(d.q?'<div class="q-text" style="margin-bottom:8px">'+blankify(d.q)+'</div>':'')
    +'<div class="tokku-jp">🇯🇵 '+d.jp+'</div>'+choicesHtml
    +'<div class="tokku-result" id="tokku_result"></div></div>'
    +'<button data-act="tokku-next" id="tokku_next" style="display:none;width:100%;margin-top:12px;background:var(--blue);color:#fff;border:none;padding:14px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">次の問題へ →</button>';
  if(isChoice){
    var cel=document.getElementById('tokku_choices');
    choices.forEach(function(c){var btn=document.createElement('button');btn.className='choice-btn';btn.textContent=c;btn.style.fontSize='16px';btn.style.padding='12px 24px';btn.addEventListener('click',function(){checkTokkuAnswer(qid,c,uid);});cel.appendChild(btn);});
  }
  var inp=document.getElementById('tokku_input');if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')checkTokkuInput(qid,uid);});
  var sub=document.getElementById('tokku_submit');if(sub)sub.addEventListener('click',function(){checkTokkuInput(qid,uid);});
}

function checkTokkuAnswer(qid,choice,uid){
  var d=weakDB[qid];if(!d)return;
  document.querySelectorAll('.tokku-card .choice-btn').forEach(function(b){b.disabled=true;if(b.textContent===d.answer)b.classList.add('selected-correct');else if(b.textContent===choice&&choice!==d.answer)b.classList.add('selected-wrong');});
  showTokkuResult(qid,d,choice===d.answer,uid);
}
function checkTokkuInput(qid,uid){
  var d=weakDB[qid],inp=document.getElementById('tokku_input');if(!inp||!d||inp.disabled)return;
  var val=inp.value;if(!val.trim()){showToast('英文を入力してください！');return;}
  inp.disabled=true;var sub=document.getElementById('tokku_submit');if(sub)sub.style.display='none';
  showTokkuResult(qid,d,localSmartGrade(val,d.answer).xpRate>=0.6,uid);
}
function showTokkuResult(qid,d,correct,uid){
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
    resEl.innerHTML='✅ 正解！'+(newPct>=80?' 🎉 正答率'+newPct+'%！':'  正答率 → '+newPct+'%')+'<div style="font-size:14px;color:#c9d1d9;margin-top:6px;line-height:2">'+d.exp+'</div>';
    showToast(getComment('correct'));
  } else {
    resEl.className='tokku-result tokku-wrong';
    resEl.innerHTML='❌ 間違い！正答率 → '+newPct+'%<div class="tokku-answer">'+d.answer+'</div><div style="font-size:14px;color:#c9d1d9;margin-top:6px;line-height:2">'+d.exp+'</div>';
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
  mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">'+emoji+'</div><div class="tokku-complete-title">特訓終了！</div><div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">'+pctAll+'%</div><div style="font-size:15px;color:#8b949e">'+tokkuSession.correct+' / '+tokkuSession.total+'問正解</div><div style="font-size:15px;color:#8b949e;margin-top:16px;line-height:2">'+msg+'</div><div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button data-act="tokku-again" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回特訓！</button><button data-sec="0" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">セクションに戻る</button></div></div>';
  renderWeakBar();
}

// ============================
// Unit4 How can we help each other in a disaster?（防災）
// 間接疑問文 / tell・show＋人＋疑問詞のかたまり（SVOO what節）/ 分詞の後置修飾
// ============================
var U4={};
U4[0]={type:'vocab',
  title:'Unit4 防災：単語準備',
  sub:'テーマは「災害のとき、どう助け合う？」。文法は3つ。先に単語を耳から慣らしておこう。',
  talk:[
    {who:'kyon',text:'にっくん、Unit4って防災の話なんでしょ？地震とか台風とか、英語で言える気がしないんだけど…'},
    {who:'nishi',text:'単語は先に音から慣らそう。今回の文法は3つだけ。①「彼女がどこに住んでいるか知ってる」みたいに、疑問文を文の中に入れる形。②「サッカーをしている男の子」。③「ケンが撮った写真」。'},
    {who:'kyon',text:'3つもあるの…？'},
    {who:'shun',text:'きょんさん、大丈夫です！3つとも、ほんまにルールひとつずつで片づくんですわ。僕、途中でヒント出しますんで。'},
    {who:'kyon',text:'しゅん！来てくれたの！？心強い！'},
    {who:'nishi',text:'まずは単語。🔊を押して、音と意味をセットで聞いておけばいい。'}
  ],
  words:[
    ['disaster','災害'],['earthquake','地震'],['typhoon','台風'],['prepare','準備する'],['emergency','緊急（のとき）'],
    ['shelter','避難所'],['evacuation drill','避難訓練'],['flashlight','懐中電灯'],['information','情報'],['foreign','外国の'],
    ['resident','住民'],['survey','調査'],['community','地域（社会）'],['each other','お互い'],['safe','安全な']
  ],
  qs:[
    {q:'disaster',jp:'disaster の意味は？',a:'災害',choices:['災害','準備','情報'],exp:E('disaster ＝ 災害','a natural disaster（自然災害）','','Unit4のテーマそのもの。ディ・ザ・スター（星が落ちてくる災害）で覚えよう'),xp:2},
    {q:'「地震」を英語で言うと？',jp:'「地震」は英語で？',a:'earthquake',choices:['earthquake','typhoon','shelter'],exp:E('地震 ＝ earthquake','earth（地球）＋ quake（ゆれる）＝ 地球がゆれる','','2つの単語のくっつきでできている。typhoon は台風'),xp:2},
    {q:'shelter',jp:'shelter の意味は？',a:'避難所',choices:['避難所','懐中電灯','住民'],exp:E('shelter ＝ 避難所','Where is the shelter?（避難所はどこですか）','','このあと「避難所がどこにあるか教えて」という文でたくさん出てくる'),xp:2},
    {q:'prepare',jp:'prepare の意味は？',a:'準備する',choices:['準備する','助ける','守る'],exp:E('prepare ＝ 準備する','prepare for a disaster（災害に備える）','','pre（前もって）＋ pare（用意する）'),xp:2},
    {q:'「お互い」を英語で言うと？',jp:'「お互い」は英語で？',a:'each other',choices:['each other','every one','another'],exp:E('お互い ＝ each other','help each other（お互いに助け合う）','','Unit4のタイトル How can we help each other in a disaster? にも入っている'),xp:2}
  ]
};

U4[1]={type:'grammar',
  title:'① 間接疑問文：疑問文を文の中に入れる',
  sub:'「彼女がどこに住んでいるか知っています」のように、疑問文が文の一部になる形。',
  talk:[
    {who:'kyon',text:'「彼女がどこに住んでるか知ってる」って…Where does she live? をそのままくっつけて、I know where does she live. でいいでしょ？'},
    {who:'nishi',text:'おしい。そこが一番大事なところだ。文の中に入ったら、疑問詞のあとは「ふつうの文の順番」に戻る。正しくは I know where she lives. do も does も消える。'},
    {who:'shun',text:'きょんさん、疑問文って「ハテナ？」の顔してるやないですか。でも文の中に入ったら、もう質問してへんから、ふつうの顔に戻るんですわ。【疑問詞＋主語＋動詞】。これだけです！'},
    {who:'kyon',text:'疑問詞のあとは「主語→動詞」！ふつうの顔！'},
    {who:'nishi',text:'その覚え方でいい。下の変身図で、いろいろな疑問詞で同じことが起きるのを確かめよう。'}
  ],
  formula:'文 ＋ '+H('疑問詞')+' ＋ '+H2('主語 ＋ 動詞')+' …<br><small style="color:var(--text2)">例：I know '+H('where')+' '+H2('she lives')+'.（私は彼女がどこに住んでいるか知っています。）</small>',
  ruleTitle:'組み立て3ステップ',
  rules:[
    '① 疑問詞（where / what / who / when / how old など）はそのまま置く',
    '② そのあとは「主語 → 動詞」のふつうの順番',
    '③ do / does / did は消す。そのぶん動詞の形を合わせる（does live → lives、did come → came）'
  ],
  visual:changeCard('🔄 変身図：疑問文 → 文の中（どの疑問詞でも同じルール）',[
    ['Where '+X('does')+' she live?','I know where '+H2('she lives')+'.','does が消えて live → lives'],
    ['What is this?','Do you know what '+H2('this is')+'?','is が主語のうしろへ'],
    ['Who is that man?','I don’t know who '+H2('that man is')+'.','is が主語のうしろへ'],
    ['When '+X('did')+' he come to Japan?','Tell me when '+H2('he came')+' to Japan.','did が消えて come → came'],
    ['How old is she?','Do you know how old '+H2('she is')+'?','how old までが疑問詞のかたまり'],
    ['Who made this cake?','I know who made this cake.','⚠️ 疑問詞（who）が主語のときは、もとから「疑問詞＋動詞」なので順番はそのまま']
  ]),
  ex:[
    ['I know where she lives.','私は彼女がどこに住んでいるか知っています。'],
    ['Do you know what this is?','これが何か知っていますか。'],
    ['I don’t know who that man is.','あの男の人がだれなのか、私は知りません。'],
    ['Can you tell me where the shelter is?','避難所がどこにあるか教えてくれますか。'],
    ['Do you know when the evacuation drill is?','避難訓練がいつあるか知っていますか。'],
    ['I know who sings this song. It’s Mrs. GREEN APPLE!','この歌をだれが歌っているか知ってるよ。ミセスだよ！']
  ],
  qs:[
    {q:'Do you know where ___?',jp:'彼がどこに住んでいるか知っていますか。',a:'he lives',choices:['he lives','does he live','he live'],exp:E('疑問詞のあとは「主語＋動詞」。does は消える','Do you know where he lives?','Do you know where does he live?','does が消えたぶん、live に s がつく！'),xp:3},
    {q:'I don’t know what ___.',jp:'これが何なのか、私はわかりません。',a:'this is',choices:['this is','is this','this'],exp:E('what のあとは「主語（this）＋動詞（is）」','I don’t know what this is.','I don’t know what is this.','is this は「ハテナの顔」。文の中ではふつうの顔 this is に戻す'),xp:3},
    {q:'Can you tell me ___?',jp:'避難所がどこにあるか教えてくれますか。',a:'where the shelter is',choices:['where the shelter is','where is the shelter','where does the shelter'],exp:E('where ＋ 主語（the shelter）＋ 動詞（is）','Can you tell me where the shelter is?','Can you tell me where is the shelter?','文の最後が is で終わるのがポイント'),xp:3},
    {q:'Do you know ___ he came to Japan?',jp:'彼がいつ日本に来たか知っていますか。',a:'when',choices:['when','where','who'],exp:E('「いつ」＝ when、「どこ」＝ where、「だれ」＝ who','Do you know when he came to Japan?','','疑問詞の意味は、ふつうの疑問文のときと同じ'),xp:3},
    {q:'I know when he ___ to Japan.',jp:'彼がいつ日本に来たか、私は知っています。',a:'came',choices:['came','did come','comes'],exp:E('did は消えて、動詞を過去形にする','I know when he came to Japan.','I know when he did come to Japan.','When did he come? → when he came（did の「過去」が came にうつる）'),xp:3},
    {q:'Please tell me what you ___.',jp:'あなたが何を必要としているか教えてください。',a:'need',choices:['need','do need','needs'],exp:E('what ＋ 主語（you）＋ 動詞（need）','Please tell me what you need.','Please tell me what do you need.','What do you need? の do が消えるだけ'),xp:3},
    {q:'Do you know ___?',jp:'あの女の人がだれか知っていますか。',a:'who that woman is',choices:['who that woman is','who is that woman','that woman who'],exp:E('who ＋ 主語（that woman）＋ 動詞（is）','Do you know who that woman is?','Do you know who is that woman?','主語が2語（that woman）でも、そのあとに is を置く'),xp:4},
    {q:'I know who ___ this song.',jp:'この歌をだれが歌っているか私は知っています。',a:'sings',choices:['sings','does sing','sing'],exp:E('who が主語のときは、もとの疑問文と同じ「who＋動詞」','I know who sings this song.','I know who does sing this song.','Who sings this song? → I know who sings this song.（順番はそのまま）'),xp:4},
    {q:'Do you know how old ___?',jp:'彼女が何歳か知っていますか。',a:'she is',choices:['she is','is she','she'],exp:E('how old までが疑問詞のかたまり。そのあとは主語＋動詞','Do you know how old she is?','Do you know how old is she?','how many / how old / what time なども、かたまりごと前に置く'),xp:4}
  ],
  qb:[
    {jp:'私は彼女がどこに住んでいるか知っています。',a:'I know where she lives.',exp:E('I know ＋ where ＋ she lives','I know where she lives.','I know where does she live.','この単元の基本の文。丸ごと音で覚えよう'),xp:6},
    {jp:'避難所がどこにあるか教えてくれますか。',a:'Can you tell me where the shelter is?',exp:E('Can you tell me ＋ where ＋ the shelter is','Can you tell me where the shelter is?','Can you tell me where is the shelter?','最後が is で終わる形。災害のときに本当に使える文'),xp:6}
  ],
  qc:[
    {jp:'これが何か知っていますか。',words:['Do you know','what','this','is'],a:'Do you know what this is?',exp:E('Do you know ＋ what ＋ this is','Do you know what this is?','Do you know what is this?','what のあとは this → is の順'),xp:6},
    {jp:'くるまはケムリがどこにいるか知っています。',words:['Kuruma','knows','where','Kemuri','is'],a:'Kuruma knows where Kemuri is.',exp:E('where ＋ 主語（Kemuri）＋ 動詞（is）','Kuruma knows where Kemuri is.','Kuruma knows where is Kemuri.','相方の居場所はちゃんと知っている（はず）'),xp:7},
    {jp:'私はだれがこの漫才の台本を書いたか知っています。',words:['I know','who','wrote','this manzai script'],a:'I know who wrote this manzai script.',exp:E('who が主語なので「who＋動詞」のまま','I know who wrote this manzai script.','I know who did write this manzai script.','Who wrote this? の形がそのまま入る'),xp:7}
  ]
};

U4[2]={type:'grammar',
  title:'② tell / show / ask ＋ 人 ＋ 疑問詞のかたまり',
  sub:'「(人)に何を〜か教える」。①で作った「疑問詞＋主語＋動詞」のかたまりを、人のうしろに置くだけ。',
  talk:[
    {who:'nishi',text:'①の「疑問詞＋主語＋動詞」のかたまりは、tell や show のうしろにも置ける。tell ＋ 人 ＋ かたまり で「人に〜かを教える」だ。'},
    {who:'kyon',text:'Tell me what you need. ＝「何が必要か教えて」？'},
    {who:'nishi',text:'その通り。災害のときは「何が必要か」「どこへ行けばいいか」を伝え合うのが大事だから、教科書でもこの形が出てくる。'},
    {who:'kyon',text:'つまり、①のかたまりを「人」のうしろに置くだけね。順番は「tell → 人 → かたまり」！'},
    {who:'nishi',text:'そう。最後に、困っている人に声をかける表現（Shall I ～? など）もおまけで覚えよう。'}
  ],
  formula:'tell / show / ask ＋ '+H('人')+' ＋ '+H2('疑問詞 ＋ 主語 ＋ 動詞')+' …<br><small style="color:var(--text2)">例：Please tell '+H('me')+' '+H2('what you need')+'.（何が必要か私に教えてください。）</small>',
  ruleTitle:'動詞ごとの意味',
  rules:[
    'tell ＋ 人 ＋ what … ＝ (人)に何を…か教える・伝える',
    'show ＋ 人 ＋ how … ＝ (人)にどうやって…かを見せる',
    'ask ＋ 人 ＋ where … ＝ (人)にどこで…かをたずねる',
    '「人」は me / us / him / her / them の形（I や we ではない）'
  ],
  visual:compareCard('🧩 並べる順番（いつも同じ）',['動詞','人','疑問詞のかたまり'],[
    ['Please tell','me','what you need.'],
    ['Let’s tell','them','what we should do.'],
    ['Can you show','me','how you made this?'],
    ['Ask','the teacher','where we should go.']
  ]),
  ex:[
    ['Please tell me what you need.','何が必要か私に教えてください。'],
    ['Let’s tell them what we should do.','何をすべきか彼らに伝えよう。'],
    ['Can you show me how you made this?','これをどうやって作ったか見せてくれる？'],
    ['Ask the teacher where we should go.','どこへ行けばいいか先生にたずねて。'],
    ['Please show us where the shelter is.','避難所がどこにあるか私たちに見せて（教えて）ください。']
  ],
  more:[
    {title:'🤝 おまけ：困っている人に声をかける表現',
     note:'<div class="en">Can I help you? ＝ 何かお手伝いしましょうか</div><div class="en">Shall I ～? ＝（私が）～しましょうか</div><div class="en">Would you like me to ～? ＝（私が）～しましょうか（ていねい）</div><div class="en">答え方：Yes, please.（はい、お願いします）／ No, thank you.（いいえ、だいじょうぶです）</div>',
     ex:[
      ['Can I help you?','何かお手伝いしましょうか。'],
      ['Shall I take you to the station?','駅まで連れて行きましょうか。'],
      ['Would you like me to carry your bag?','かばんを運びましょうか。'],
      ['Yes, please. Thank you.','はい、お願いします。ありがとう。']
    ]}
  ],
  qs:[
    {q:'Please tell ___ what you need.',jp:'何が必要か私に教えてください。',a:'me',choices:['me','I','my'],exp:E('tell のうしろの「人」は me / us / him / her / them','Please tell me what you need.','Please tell I what you need.','「〜に」の人は I ではなく me'),xp:3},
    {q:'Can you tell me what ___?',jp:'あなたが何を買ったか教えてくれる？',a:'you bought',choices:['you bought','did you buy','you buy'],exp:E('what ＋ 主語（you）＋ 動詞（bought）。did は消えて過去形に','Can you tell me what you bought?','Can you tell me what did you buy?','What did you buy? → what you bought'),xp:3},
    {q:'Please show me how ___ this radio.',jp:'このラジオをどうやって使うのか見せてください。',a:'you use',choices:['you use','do you use','use you'],exp:E('how ＋ 主語（you）＋ 動詞（use）','Please show me how you use this radio.','Please show me how do you use this radio.','How do you use it? の do が消える'),xp:3},
    {q:'Let’s tell them ___ we should do.',jp:'何をすべきか彼らに伝えよう。',a:'what',choices:['what','where','who'],exp:E('「何を」＝ what','Let’s tell them what we should do.','','what we should do ＝「私たちが何をすべきか」'),xp:3},
    {q:'Ask the teacher ___ we should go.',jp:'どこへ行けばいいか先生にたずねて。',a:'where',choices:['where','what','who'],exp:E('「どこへ」＝ where','Ask the teacher where we should go.','','ask ＋ 人 ＋ 疑問詞のかたまり ＝「人に〜かをたずねる」'),xp:3},
    {q:'Tell me ___.',jp:'あなたの誕生日がいつか教えて。',a:'when your birthday is',choices:['when your birthday is','when is your birthday','your birthday when'],exp:E('when ＋ 主語（your birthday）＋ 動詞（is）','Tell me when your birthday is.','Tell me when is your birthday.','①と同じ「ふつうの顔」ルール'),xp:4},
    {q:'___ carry your bag?',jp:'（私が）かばんを運びましょうか。',a:'Shall I',choices:['Shall I','Shall we','Can you'],exp:E('Shall I ～? ＝（私が）～しましょうか','Shall I carry your bag?','Shall we carry your bag?（「一緒に運びましょうか」になってしまう）','Shall we ～? は「（一緒に）～しましょうか」'),xp:4},
    {q:'Would you like me ___ you?',jp:'（私が）お手伝いしましょうか。',a:'to help',choices:['to help','help','helping'],exp:E('Would you like me ＋ to ＋ 動詞の原形','Would you like me to help you?','Would you like me help you?','Unit3 の「want ＋ 人 ＋ to」と同じ並び（like me to）'),xp:4},
    {q:'Shall I open the window? — ___',jp:'「窓を開けましょうか」に「はい、お願いします」と答える。',a:'Yes, please.',choices:['Yes, please.','Yes, I shall.','No, I don’t.'],exp:E('Shall I ～? への答えは Yes, please. / No, thank you.','Yes, please.','Yes, I shall.','セットで丸ごと覚えよう'),xp:4}
  ],
  qb:[
    {jp:'何が必要か私に教えてください。',a:'Please tell me what you need.',exp:E('Please tell ＋ me ＋ what you need','Please tell me what you need.','Please tell me what do you need.','例文の1番目そのまま'),xp:6},
    {jp:'避難所がどこにあるか私たちに見せて（教えて）ください。',a:'Please show us where the shelter is.',exp:E('show ＋ us ＋ where the shelter is','Please show us where the shelter is.','Please show us where is the shelter.','「私たちに」は we ではなく us'),xp:6}
  ],
  qc:[
    {jp:'あなたが何を買ったか私に教えて。',words:['Tell','me','what','you','bought'],a:'Tell me what you bought.',exp:E('Tell ＋ 人 ＋ what ＋ 主語 ＋ 動詞','Tell me what you bought.','Tell me what did you buy.','did を使わず bought（過去形）にする'),xp:6},
    {jp:'何をすべきかみんなに伝えよう。',words:['Let’s tell','everyone','what','we','should do'],a:'Let’s tell everyone what we should do.',exp:E('Let’s tell ＋ 人 ＋ what ＋ we should do','Let’s tell everyone what we should do.','','should do のところも「主語のあと」に置く'),xp:7},
    {jp:'駅まで連れて行きましょうか。',words:['Shall I','take you','to','the station'],a:'Shall I take you to the station?',exp:E('Shall I ＋ 動詞の原形 ～?','Shall I take you to the station?','','道に迷っている人に使える一言'),xp:6}
  ]
};

U4[3]={type:'grammar',
  title:'③「〜している◯◯」＝ ◯◯ ＋ 〜ing',
  sub:'名詞のうしろに「〜ing＋語句」を置くと、「〜している◯◯」と説明できる。',
  talk:[
    {who:'kyon',text:'「サッカーをしている男の子」って、日本語だと「サッカーをしている」が先にくるのに…英語だとどうなるの？'},
    {who:'nishi',text:'英語は逆。まず「男の子」を言って、あとから「サッカーをしてるよ」と説明を足す。the boy playing soccer。'},
    {who:'shun',text:'漫才の始まりと一緒ですわ。「どうも、9番街レトロです！」ってまず名前言うて、そのあとで説明を足していくでしょ。英語も名詞が先、説明はあとからなんです。'},
    {who:'kyon',text:'名詞が先、説明があと！'},
    {who:'nishi',text:'ただし、説明が1語だけのときは日本語と同じで前に置く。a sleeping baby（眠っている赤ちゃん）。2語以上になったら後ろ。これもルールとして覚えておこう。'}
  ],
  formula:H('名詞')+' ＋ '+H2('〜ing ＋ 語句')+'（うしろから説明）<br><small style="color:var(--text2)">例：the '+H('boy')+' '+H2('playing soccer')+'（サッカーをしている男の子）</small>',
  ruleTitle:'ルール',
  rules:[
    '名詞が「自分で〜している」→ 〜ing（現在分詞）',
    '説明が2語以上 → 名詞のうしろ：a baby sleeping in the bed（ベッドで眠っている赤ちゃん）',
    '説明が1語だけ → 名詞の前：a sleeping baby（眠っている赤ちゃん）',
    '⚠️ The boy is playing soccer.（is がある＝文「男の子はサッカーをしている」）／ the boy playing soccer（is がない＝かたまり「サッカーをしている男の子」）'
  ],
  visual:backCard('👉 名詞を先に言って、うしろから説明（どの名詞でも同じ）',[
    ['the boy','playing soccer','サッカーをしている → 男の子'],
    ['the girl','practicing karate','空手の練習をしている → 女の子'],
    ['the man','standing by the door','ドアのそばに立っている → 男の人'],
    ['people','helping each other','お互いに助け合っている → 人々']
  ]),
  ex:[
    ['The boy playing soccer is my brother.','サッカーをしている男の子は私の弟です。'],
    ['Look at the girl practicing karate.','空手の練習をしている女の子を見て。'],
    ['Who is the man standing by the door?','ドアのそばに立っている男の人はだれですか。'],
    ['There are many people helping each other.','お互いに助け合っている人がたくさんいます。'],
    ['The comedian talking on the stage is Kyon.','舞台でしゃべっている芸人はきょんです。'],
    ['Look at that sleeping cat.','あの眠っているネコを見て。']
  ],
  qs:[
    {q:'The boy ___ soccer is my brother.',jp:'サッカーをしている男の子は私の弟です。',a:'playing',choices:['playing','played','plays'],exp:E('名詞（the boy）＋ 〜ing ＋ 語句','The boy playing soccer is my brother.','The boy plays soccer is my brother.','男の子が「自分でしている」ので 〜ing'),xp:3},
    {q:'Look at the girl ___ karate.',jp:'空手の練習をしている女の子を見て。',a:'practicing',choices:['practicing','practiced','practices'],exp:E('the girl ＋ practicing karate','Look at the girl practicing karate.','Look at the girl practiced karate.','女の子が自分で練習している → 〜ing'),xp:3},
    {q:'Who is the man ___ by the door?',jp:'ドアのそばに立っている男の人はだれですか。',a:'standing',choices:['standing','stood','stands'],exp:E('the man ＋ standing by the door','Who is the man standing by the door?','','立っているのは男の人自身 → 〜ing'),xp:3},
    {q:'I know the woman ___ with Ms. Brown.',jp:'ブラウン先生と話している女の人を私は知っています。',a:'talking',choices:['talking','talked','talks'],exp:E('the woman ＋ talking with Ms. Brown','I know the woman talking with Ms. Brown.','','with 以下までが説明のかたまり'),xp:3},
    {q:'Look at that ___ cat.',jp:'あの眠っているネコを見て。',a:'sleeping',choices:['sleeping','sleep','slept'],exp:E('説明が1語だけなら名詞の前','Look at that sleeping cat.','Look at that sleep cat.','1語（sleeping）→ 前、2語以上（sleeping on the sofa）→ うしろ'),xp:3},
    {q:'The girl ___ the piano is Emi.',jp:'ピアノをひいている女の子はエミです。',a:'playing',choices:['playing','is playing','plays'],exp:E('かたまりの中に is は入れない','The girl playing the piano is Emi.','The girl is playing the piano is Emi.（is が2つになって文がこわれる）','文の本当の動詞は最後の is だけ'),xp:4},
    {q:'「ベッドで眠っている赤ちゃん」はどれ？',jp:'「ベッドで眠っている赤ちゃん」を英語で',a:'a baby sleeping in the bed',choices:['a baby sleeping in the bed','a sleeping in the bed baby','a baby sleep in the bed'],exp:E('2語以上の説明は名詞のうしろ','a baby sleeping in the bed','a sleeping in the bed baby','sleeping in the bed は3語 → うしろに置く'),xp:4},
    {q:'People ___ in the shelter helped each other.',jp:'避難所に泊まっている人々はお互いに助け合いました。',a:'staying',choices:['staying','stayed','stays'],exp:E('people ＋ staying in the shelter','People staying in the shelter helped each other.','','文の本当の動詞は helped。staying 〜 は people の説明'),xp:4}
  ],
  qb:[
    {jp:'サッカーをしている男の子は私の弟です。',a:'The boy playing soccer is my brother.',exp:E('The boy ＋ playing soccer ＋ is my brother','The boy playing soccer is my brother.','The boy is playing soccer is my brother.','例文の1番目そのまま'),xp:6},
    {jp:'空手の練習をしている女の子を見て。',a:'Look at the girl practicing karate.',exp:E('the girl ＋ practicing karate','Look at the girl practicing karate.','','practice（練習する）＋ ing'),xp:6}
  ],
  qc:[
    {jp:'舞台でしゃべっている芸人はきょんです。',words:['The comedian','talking','on the stage','is','Kyon'],a:'The comedian talking on the stage is Kyon.',exp:E('名詞 ＋ 〜ing ＋ 語句 ＋ is ...','The comedian talking on the stage is Kyon.','','まず「芸人」、そのあと「しゃべっている」、最後に「は きょんです」'),xp:7},
    {jp:'ギターをひいている男の人はだれですか。',words:['Who is','the man','playing','the guitar'],a:'Who is the man playing the guitar?',exp:E('the man ＋ playing the guitar','Who is the man playing the guitar?','','サンタモニカのポールもギターをひく'),xp:7}
  ]
};

U4[4]={type:'grammar',
  title:'④「〜された◯◯」＝ ◯◯ ＋ 過去分詞',
  sub:'名詞のうしろに「過去分詞＋語句」を置くと、「〜された・〜されている◯◯」と説明できる。Unit1（受け身）で覚えた過去分詞がそのまま使える！',
  talk:[
    {who:'kyon',text:'③と同じで、名詞が先？'},
    {who:'nishi',text:'そう。並べ方は③とまったく同じ。ちがうのは中身だけだ。名詞が「する」側なら 〜ing、「される」側なら過去分詞。'},
    {who:'shun',text:'写真で考えたらわかりやすいと思います。「撮ってる人」は自分でやってるから taking。「撮られた写真」は、写真がやられてる側やから taken。写真が自分でシャッター押してたら、ほんまに怖いでしょ！'},
    {who:'kyon',text:'写真は撮られる側！だから taken！'},
    {who:'nishi',text:'迷ったら、名詞を主語にして「◯◯が〜している？」「◯◯が〜される？」と自分に聞けばいい。'}
  ],
  formula:H('名詞')+' ＋ '+H2('過去分詞 ＋ 語句')+'（うしろから説明）<br><small style="color:var(--text2)">例：a '+H('picture')+' '+H2('taken by Ken')+'（ケンによって撮られた写真）</small>',
  ruleTitle:'ルール',
  rules:[
    '名詞が「〜される」側 → 過去分詞（taken, made, written, spoken, loved など）',
    '説明が2語以上 → 名詞のうしろ：a window broken by the typhoon（台風で割れた窓）',
    '説明が1語だけ → 名詞の前：a broken window（割れた窓）、a used car（中古車）',
    '迷ったら：「名詞が〜している」→ 〜ing ／「名詞が〜される」→ 過去分詞'
  ],
  visual:compareCard('⚖️ 〜ing と 過去分詞の見分け',['名詞は…','形','例'],[
    ['自分で〜している','〜ing','the man '+H2('taking')+' a picture（写真を撮っている男の人）'],
    ['〜される・〜された','過去分詞','the picture '+H2('taken')+' by the man（その男の人に撮られた写真）'],
    ['自分で〜している','〜ing','a girl '+H2('writing')+' a letter（手紙を書いている女の子）'],
    ['〜される・〜された','過去分詞','a letter '+H2('written')+' in English（英語で書かれた手紙）']
  ]),
  ex:[
    ['This is a picture taken by Ken.','これはケンによって撮られた写真です。'],
    ['English is a language spoken in many countries.','英語は多くの国で話されている言語です。'],
    ['I have a book written in English.','私は英語で書かれた本を持っています。'],
    ['This is a bag made in Italy.','これはイタリアで作られたかばんです。'],
    ['The window broken by the typhoon was fixed.','台風で割れた窓は修理されました。'],
    ['Ao to Natsu is a song loved by many people.','「青と夏」は多くの人に愛されている歌です。']
  ],
  qs:[
    {q:'This is a picture ___ by Ken.',jp:'これはケンによって撮られた写真です。',a:'taken',choices:['taken','taking','took'],exp:E('写真は「撮られる」側 → 過去分詞','This is a picture taken by Ken.','This is a picture taking by Ken.','take - took - taken。by Ken（ケンによって）も受け身のサイン'),xp:3},
    {q:'English is a language ___ in many countries.',jp:'英語は多くの国で話されている言語です。',a:'spoken',choices:['spoken','speaking','spoke'],exp:E('言語は「話される」側 → 過去分詞','English is a language spoken in many countries.','English is a language speaking in many countries.','speak - spoke - spoken'),xp:3},
    {q:'I have a book ___ in English.',jp:'私は英語で書かれた本を持っています。',a:'written',choices:['written','writing','wrote'],exp:E('本は「書かれる」側 → 過去分詞','I have a book written in English.','','write - wrote - written'),xp:3},
    {q:'Look at the man ___ a picture.',jp:'写真を撮っている男の人を見て。',a:'taking',choices:['taking','taken','took'],exp:E('男の人は「自分で撮っている」→ 〜ing','Look at the man taking a picture.','Look at the man taken a picture.','Q1 と比べよう：写真（撮られる）→ taken、人（撮る）→ taking'),xp:3},
    {q:'This is a bag ___ in Italy.',jp:'これはイタリアで作られたかばんです。',a:'made',choices:['made','making','makes'],exp:E('かばんは「作られる」側 → 過去分詞','This is a bag made in Italy.','','make - made - made。made in Japan（日本製）と同じ形'),xp:3},
    {q:'There is a ___ window.',jp:'割れた窓があります。',a:'broken',choices:['broken','breaking','broke'],exp:E('説明が1語だけなら名詞の前','There is a broken window.','','break - broke - broken。窓は「割られる」側'),xp:4},
    {q:'Ao to Natsu is a song ___ by many people.',jp:'「青と夏」は多くの人に愛されている歌です。',a:'loved',choices:['loved','loving','loves'],exp:E('歌は「愛される」側 → 過去分詞','Ao to Natsu is a song loved by many people.','','by many people（多くの人によって）がヒント'),xp:4},
    {q:'The food ___ at the shelter was rice balls.',jp:'避難所で配られた食べ物はおにぎりでした。',a:'given',choices:['given','giving','gave'],exp:E('食べ物は「配られる（与えられる）」側 → 過去分詞','The food given at the shelter was rice balls.','','give - gave - given。文の本当の動詞は was'),xp:4},
    {q:'Do you know the boy ___ to Emi?',jp:'エミと話している男の子を知っていますか。',a:'talking',choices:['talking','talked','talks'],exp:E('男の子は「自分で話している」→ 〜ing','Do you know the boy talking to Emi?','','人が主役のときは、たいてい 〜ing'),xp:4}
  ],
  qb:[
    {jp:'これはケンによって撮られた写真です。',a:'This is a picture taken by Ken.',exp:E('a picture ＋ taken by Ken','This is a picture taken by Ken.','This is a picture taking by Ken.','例文の1番目そのまま'),xp:6},
    {jp:'英語は多くの国で話されている言語です。',a:'English is a language spoken in many countries.',exp:E('a language ＋ spoken in many countries','English is a language spoken in many countries.','','spoken（話される）を忘れずに'),xp:6}
  ],
  qc:[
    {jp:'私は英語で書かれた本を持っています。',words:['I have','a book','written','in English'],a:'I have a book written in English.',exp:E('a book ＋ written in English','I have a book written in English.','','本 → 書かれた → 英語で'),xp:6},
    {jp:'これは令和ロマンによって書かれた漫才の台本です。',words:['This is','a manzai script','written','by Reiwa Roman'],a:'This is a manzai script written by Reiwa Roman.',exp:E('名詞 ＋ 過去分詞 ＋ by ～','This is a manzai script written by Reiwa Roman.','','台本は「書かれる」側 → written'),xp:7}
  ]
};

U4[5]={type:'test',
  title:'Unit4 確認テスト',
  sub:'間接疑問文・tell 人 what・〜ing・過去分詞のまとめ。間違えた問題は🔥特訓に入るから安心して。',
  talk:[
    {who:'shun',text:'きょんさん、ここまで来たらもう大丈夫です。迷ったら「ふつうの顔」と「名詞が先」、この2つだけ思い出してください！'},
    {who:'kyon',text:'ふつうの顔、名詞が先！いってきます！'}
  ],
  qs:[
    {q:'I know where she ___.',jp:'彼女がどこに住んでいるか私は知っています。',a:'lives',choices:['lives','does live','live'],exp:E('疑問詞のあとは主語＋動詞。does は消えて lives','I know where she lives.','I know where does she live.','ふつうの顔に戻す'),xp:3},
    {q:'Do you know ___?',jp:'これが何か知っていますか。',a:'what this is',choices:['what this is','what is this','this what is'],exp:E('what ＋ this ＋ is','Do you know what this is?','Do you know what is this?','is は主語のうしろ'),xp:3},
    {q:'Can you tell me where the station ___?',jp:'駅がどこにあるか教えてくれますか。',a:'is',choices:['is','does','are'],exp:E('where ＋ the station ＋ is','Can you tell me where the station is?','','the station は1つなので is'),xp:3},
    {q:'I don’t know when he ___ to Japan.',jp:'彼がいつ日本に来たか、私は知りません。',a:'came',choices:['came','did come','comes'],exp:E('did は消えて過去形に','I don’t know when he came to Japan.','I don’t know when he did come to Japan.','did come → came'),xp:3},
    {q:'I know who ___ this cake.',jp:'だれがこのケーキを作ったか私は知っています。',a:'made',choices:['made','did make','makes'],exp:E('who が主語のときは「who＋動詞」のまま','I know who made this cake.','I know who did make this cake.','Who made this cake? がそのまま入る'),xp:4},
    {q:'Please tell ___ what you need.',jp:'何が必要か私に教えてください。',a:'me',choices:['me','I','my'],exp:E('tell のうしろの人は me','Please tell me what you need.','Please tell I what you need.','「〜に」は me / us / him / her / them'),xp:3},
    {q:'Let’s tell them ___ we should do.',jp:'何をすべきか彼らに伝えよう。',a:'what',choices:['what','who','when'],exp:E('「何を」＝ what','Let’s tell them what we should do.','',''),xp:3},
    {q:'___ carry your bag?',jp:'（私が）かばんを運びましょうか。',a:'Shall I',choices:['Shall I','Shall we','Do you'],exp:E('Shall I ～? ＝（私が）～しましょうか','Shall I carry your bag?','Shall we carry your bag?','Shall we は「一緒に〜しましょうか」'),xp:3},
    {q:'Would you like me ___ you?',jp:'（私が）お手伝いしましょうか。',a:'to help',choices:['to help','help','helped'],exp:E('Would you like me ＋ to ＋ 原形','Would you like me to help you?','Would you like me help you?','like me to の to を忘れずに'),xp:3},
    {q:'The boy ___ soccer is Ken.',jp:'サッカーをしている男の子はケンです。',a:'playing',choices:['playing','played','plays'],exp:E('名詞 ＋ 〜ing ＋ 語句','The boy playing soccer is Ken.','The boy plays soccer is Ken.','男の子が自分でしている → 〜ing'),xp:3},
    {q:'Look at the girl ___ karate.',jp:'空手の練習をしている女の子を見て。',a:'practicing',choices:['practicing','practiced','practices'],exp:E('the girl ＋ practicing karate','Look at the girl practicing karate.','',''),xp:3},
    {q:'Look at that ___ baby.',jp:'あの眠っている赤ちゃんを見て。',a:'sleeping',choices:['sleeping','slept','sleeps'],exp:E('1語の説明は名詞の前','Look at that sleeping baby.','',''),xp:3},
    {q:'This is a picture ___ by my father.',jp:'これは父によって撮られた写真です。',a:'taken',choices:['taken','taking','took'],exp:E('写真は撮られる側 → 過去分詞','This is a picture taken by my father.','This is a picture taking by my father.','by ～ は受け身のサイン'),xp:3},
    {q:'English is a language ___ in many countries.',jp:'英語は多くの国で話されている言語です。',a:'spoken',choices:['spoken','speaking','speaks'],exp:E('言語は話される側 → 過去分詞','English is a language spoken in many countries.','',''),xp:3},
    {q:'I have a bag ___ in Italy.',jp:'私はイタリアで作られたかばんを持っています。',a:'made',choices:['made','making','make'],exp:E('かばんは作られる側 → 過去分詞','I have a bag made in Italy.','',''),xp:3},
    {q:'Look at the man ___ a picture.',jp:'写真を撮っている男の人を見て。',a:'taking',choices:['taking','taken','takes'],exp:E('人が自分で撮っている → 〜ing','Look at the man taking a picture.','Look at the man taken a picture.','Q13 と比べよう'),xp:4},
    {q:'There is a ___ window.',jp:'割れた窓があります。',a:'broken',choices:['broken','breaking','breaks'],exp:E('窓は割られる側。1語なので前','There is a broken window.','',''),xp:4},
    {q:'Do you know how old ___?',jp:'彼が何歳か知っていますか。',a:'he is',choices:['he is','is he','he'],exp:E('how old ＋ 主語 ＋ 動詞','Do you know how old he is?','Do you know how old is he?',''),xp:4},
    {q:'The people ___ in the shelter helped each other.',jp:'避難所に泊まっている人々はお互いに助け合いました。',a:'staying',choices:['staying','stayed','stay'],exp:E('people ＋ staying in the shelter','The people staying in the shelter helped each other.','','本当の動詞は helped'),xp:4},
    {q:'「台風で割れた窓」はどれ？',jp:'「台風で割れた窓」を英語で',a:'the window broken by the typhoon',choices:['the window broken by the typhoon','the window breaking by the typhoon','the broken by the typhoon window'],exp:E('名詞 ＋ 過去分詞 ＋ by ～（2語以上はうしろ）','the window broken by the typhoon','the broken by the typhoon window',''),xp:4}
  ]
};

// ============================
// Unit5 What makes a good leader?（ガンディー）
// 名詞を修飾する文（接触節）/ 関係代名詞 who / that・which（主格・目的格）
// ============================
var U5={};
U5[0]={type:'vocab',
  title:'Unit5 リーダー：単語準備',
  sub:'テーマは「よいリーダーとは？」。インドのガンディーが出てくる。文法は「名詞をうしろから説明する」仲間たち。',
  talk:[
    {who:'kyon',text:'Unit5はガンディー！…って、だれだっけ。'},
    {who:'nishi',text:'インドの独立を導いたリーダーだ。暴力を使わずに、イギリスの支配に立ち向かった。'},
    {who:'kyon',text:'暴力なしで国を動かしたの！？すごすぎる…'},
    {who:'kuruma',text:'きょんさん、今回の文法めちゃくちゃ便利っすよ！人やものを、うしろから説明できるようになるんで。たとえば「僕が尊敬する先輩」＝ the senior I respect。きょんさんのことっす！'},
    {who:'kyon',text:'くるま！急に褒めるじゃん！'},
    {who:'nishi',text:'今回の型は4つ。①名詞＋主語＋動詞　②人＋who＋動詞　③もの＋which/that＋動詞　④もの＋which/that＋主語＋動詞。全部「名詞のあとから説明を足す」仲間だ。Unit4の分詞と同じ考え方だよ。'}
  ],
  info:'<div class="grammar-card"><div class="grammar-card-title">📜 ガンディーってどんな人？</div><div class="grammar-rule">'
    +'<div class="en">・1869年、インドで生まれる</div>'
    +'<div class="en">・イギリスのロンドンで法律を学び、弁護士（lawyer）になる</div>'
    +'<div class="en">・南アフリカで、インド系の人々への差別と戦う</div>'
    +'<div class="en">・インドに戻り、暴力を使わない方法（nonviolence）でイギリスの支配に反対</div>'
    +'<div class="en">・1930年「塩の行進（Salt March）」：塩に税をかける法律に反対し、海まで歩いた</div>'
    +'<div class="en">・1947年、インドは独立（independence）</div>'
    +'</div></div>',
  words:[
    ['leader','リーダー・指導者'],['lawyer','弁護士'],['freedom','自由'],['rights','権利'],['independence','独立'],
    ['violence','暴力'],['nonviolence','非暴力（暴力を使わないこと）'],['protest','抗議（する）'],['salt','塩'],['march','行進'],
    ['unfair','不公平な'],['law','法律'],['respect','尊敬する'],['follow','ついていく・従う'],['peaceful','平和的な']
  ],
  qs:[
    {q:'leader',jp:'leader の意味は？',a:'リーダー・指導者',choices:['リーダー・指導者','弁護士','法律'],exp:E('leader ＝ リーダー・指導者','a good leader（よいリーダー）','','Unit5のタイトル What makes a good leader? に入っている'),xp:2},
    {q:'「暴力」を英語で言うと？',jp:'「暴力」は英語で？',a:'violence',choices:['violence','violin','freedom'],exp:E('暴力 ＝ violence','nonviolence ＝ 非暴力（non ＝ 〜でない）','','violin（バイオリン）とつづりが似ているので注意'),xp:2},
    {q:'independence',jp:'independence の意味は？',a:'独立',choices:['独立','行進','抗議'],exp:E('independence ＝ 独立','India’s independence（インドの独立）','','in（〜でない）＋ dependence（たよること）＝ だれにもたよらない ＝ 独立'),xp:2},
    {q:'respect',jp:'respect の意味は？',a:'尊敬する',choices:['尊敬する','ついていく','反対する'],exp:E('respect ＝ 尊敬する','Many people respect Gandhi.（多くの人がガンディーを尊敬している）','','このあとの文法の例文でたくさん出てくる'),xp:2},
    {q:'「弁護士」を英語で言うと？',jp:'「弁護士」は英語で？',a:'lawyer',choices:['lawyer','leader','law'],exp:E('弁護士 ＝ lawyer','law（法律）＋ yer（人）＝ 法律の人','','law（法律）とセットで覚えよう'),xp:2}
  ]
};

U5[1]={type:'grammar',
  title:'① 名詞 ＋ 主語 ＋ 動詞（うしろから説明）',
  sub:'「私が昨日買った本」＝ the book I bought yesterday。名詞のうしろに「主語＋動詞」を置くだけ。',
  talk:[
    {who:'kyon',text:'「私が昨日買った本」…日本語だと「本」が最後にくるけど、英語だと？'},
    {who:'nishi',text:'Unit4 と同じで、名詞が先。まず the book、そのうしろに I bought yesterday（私が昨日買った）をくっつける。'},
    {who:'kuruma',text:'これ「接触節」って名前なんすけど、名詞と「主語＋動詞」がピタッとくっついてるだけっす。間に何も入らないのがポイントっす！'},
    {who:'kyon',text:'the book と I bought がくっついてる！'},
    {who:'nishi',text:'もう一つ大事なこと。bought のうしろに it は置かない。「何を買ったか」はもう the book が言っているからだ。'}
  ],
  formula:H('名詞')+' ＋ '+H2('主語 ＋ 動詞 …')+'<br><small style="color:var(--text2)">例：This is the '+H('book')+' '+H2('I bought yesterday')+'.（これは私が昨日買った本です。）</small>',
  ruleTitle:'組み立て3ステップ',
  rules:[
    '① まず名詞（the book）',
    '② そのうしろに「だれが＋どうした」（I bought yesterday）',
    '③ 日本語にするときは、うしろから：「私が昨日買った → 本」',
    '⚠️ かたまりの中の動詞のうしろに、もう一度名詞を置かない（× the book I bought it）'
  ],
  visual:backCard('👉 人・もの・場所、どの名詞でも同じ形',[
    ['the book','I bought yesterday','私が昨日買った → 本'],
    ['a leader','many people respect','多くの人が尊敬する → リーダー'],
    ['the man','I met yesterday','私が昨日会った → 男の人'],
    ['the city','we visited last year','私たちが去年訪れた → 都市']
  ]),
  ex:[
    ['This is the book I bought yesterday.','これは私が昨日買った本です。'],
    ['Gandhi is a leader many people respect.','ガンディーは多くの人が尊敬するリーダーです。'],
    ['The song I like best is Lilac.','私がいちばん好きな歌は「ライラック」です。'],
    ['The man I met yesterday was kind.','私が昨日会った男の人は親切でした。'],
    ['Kyoto is the city we visited last year.','京都は私たちが去年訪れた都市です。'],
    ['Kyon is a comedian everyone knows.','きょんはみんなが知っている芸人です。']
  ],
  qs:[
    {q:'This is the book ___ yesterday.',jp:'これは私が昨日買った本です。',a:'I bought',choices:['I bought','bought I','I bought it'],exp:E('名詞 ＋ 主語（I）＋ 動詞（bought）','This is the book I bought yesterday.','This is the book I bought it yesterday.','it はいらない。the book がもう「何を」を言っている'),xp:3},
    {q:'Gandhi is a leader many people ___.',jp:'ガンディーは多くの人が尊敬するリーダーです。',a:'respect',choices:['respect','respects','respecting'],exp:E('a leader ＋ many people ＋ respect','Gandhi is a leader many people respect.','Gandhi is a leader many people respects.','かたまりの主語は many people（複数）なので s はつかない'),xp:3},
    {q:'The song ___ best is Lilac.',jp:'私がいちばん好きな歌は「ライラック」です。',a:'I like',choices:['I like','like I','I like it'],exp:E('The song ＋ I like best ＋ is Lilac','The song I like best is Lilac.','The song I like it best is Lilac.','主語が長くなっても、本当の動詞は is'),xp:3},
    {q:'The man I ___ yesterday was kind.',jp:'私が昨日会った男の人は親切でした。',a:'met',choices:['met','meet','meeting'],exp:E('yesterday なので過去形 met','The man I met yesterday was kind.','','meet - met - met'),xp:3},
    {q:'Is this the cake ___?',jp:'これはあなたが作ったケーキですか。',a:'you made',choices:['you made','made you','you made it'],exp:E('the cake ＋ you made','Is this the cake you made?','Is this the cake you made it?','「主語→動詞」の順番'),xp:3},
    {q:'「私たちが去年訪れた都市」はどれ？',jp:'「私たちが去年訪れた都市」を英語で',a:'the city we visited last year',choices:['the city we visited last year','we visited the city last year','the city visited we last year'],exp:E('名詞（the city）が先、説明（we visited last year）があと','the city we visited last year','we visited the city last year（これは「私たちは去年その都市を訪れた」という文）','かたまり（名詞）なのか、文なのかを見分けよう'),xp:4},
    {q:'The movie we watched ___ exciting.',jp:'私たちが見た映画はわくわくしました。',a:'was',choices:['was','were','did'],exp:E('[The movie we watched] が主語。本当の動詞は was','The movie we watched was exciting.','','主語の中心は the movie（1つ）なので was'),xp:4},
    {q:'Everything ___ is true.',jp:'彼女が言ったことはすべて本当です。',a:'she said',choices:['she said','said she','she said it'],exp:E('Everything ＋ she said','Everything she said is true.','Everything she said it is true.','everything（すべてのこと）も名詞。うしろから説明できる'),xp:4}
  ],
  qb:[
    {jp:'これは私が昨日買った本です。',a:'This is the book I bought yesterday.',exp:E('the book ＋ I bought yesterday','This is the book I bought yesterday.','This is the book I bought it yesterday.','例文の1番目そのまま'),xp:6},
    {jp:'ガンディーは多くの人が尊敬するリーダーです。',a:'Gandhi is a leader many people respect.',exp:E('a leader ＋ many people respect','Gandhi is a leader many people respect.','','教科書のテーマそのものの文'),xp:6}
  ],
  qc:[
    {jp:'私がいちばん好きな歌は「ライラック」です。',words:['The song','I like','best','is','Lilac'],a:'The song I like best is Lilac.',exp:E('[The song I like best] ＋ is ＋ Lilac','The song I like best is Lilac.','','ミセスの曲で練習！'),xp:6},
    {jp:'ケムリはくるまが信頼している相方です。',words:['Kemuri','is','the partner','Kuruma','trusts'],a:'Kemuri is the partner Kuruma trusts.',exp:E('the partner ＋ Kuruma trusts','Kemuri is the partner Kuruma trusts.','','trust ＝ 信頼する。Kuruma（1人）なので trusts'),xp:7}
  ]
};

U5[2]={type:'grammar',
  title:'② 人 ＋ who ＋ 動詞',
  sub:'「〜する人」「〜した人」。人を説明するときは who のうしろに動詞を続ける。',
  talk:[
    {who:'nishi',text:'今度は「人」の説明。a friend who lives in Canada ＝ カナダに住んでいる友達。'},
    {who:'kyon',text:'who って「だれ」でしょ？質問してないのに？'},
    {who:'nishi',text:'いい疑問だ。ここの who は質問じゃない。前の「人」と、うしろの説明をつなぐ「接着剤」なんだ。関係代名詞という。'},
    {who:'kuruma',text:'who が出てきたら「どんな人かっていうと…」って読めばいいっす。I have a friend who… 「友達がいて、どんな友達かっていうと…カナダに住んでる」って感じっす！'},
    {who:'kyon',text:'「どんな人かっていうと」！それなら読める！'}
  ],
  formula:H('人')+' ＋ who ＋ '+H2('動詞 …')+'<br><small style="color:var(--text2)">例：I have a '+H('friend')+' who '+H2('lives in Canada')+'.（私にはカナダに住んでいる友達がいます。）</small>',
  ruleTitle:'ルール',
  rules:[
    'who の前は必ず「人」（a friend, a man, a leader, people など）',
    'who のすぐうしろに動詞',
    '動詞の形は、who の前の人に合わせる：a friend who lives（1人 → s）／ friends who live（2人以上 → s なし）'
  ],
  visual:backCard('👉 who は「どんな人かっていうと…」',[
    ['a friend','who lives in Canada','カナダに住んでいる → 友達'],
    ['a leader','who fought for freedom','自由のために戦った → リーダー'],
    ['a comedian','who won the M-1 Grand Prix twice','M-1で2回優勝した → 芸人'],
    ['an actor','who makes people happy','人を幸せにする → 俳優']
  ]),
  ex:[
    ['I have a friend who lives in Canada.','私にはカナダに住んでいる友達がいます。'],
    ['Gandhi was a leader who fought for freedom.','ガンディーは自由のために戦ったリーダーでした。'],
    ['He was a lawyer who worked in South Africa.','彼は南アフリカで働いた弁護士でした。'],
    ['Kuruma is a comedian who won the M-1 Grand Prix twice.','くるまはM-1グランプリで2回優勝した芸人です。'],
    ['A teacher is a person who teaches students.','先生とは、生徒に教える人のことです。'],
    ['I want to be an actor who makes people happy.','私は人を幸せにする俳優になりたい。']
  ],
  qs:[
    {q:'I have a friend ___ lives in Canada.',jp:'私にはカナダに住んでいる友達がいます。',a:'who',choices:['who','which','he'],exp:E('人（a friend）の説明 → who','I have a friend who lives in Canada.','I have a friend he lives in Canada.','he を入れると文が2つくっついてしまう。つなぐのは who'),xp:3},
    {q:'Gandhi was a leader who ___ for freedom.',jp:'ガンディーは自由のために戦ったリーダーでした。',a:'fought',choices:['fought','fight','fighting'],exp:E('who のすぐうしろに動詞。昔の話なので過去形','Gandhi was a leader who fought for freedom.','','fight - fought - fought'),xp:3},
    {q:'I have a friend who ___ in Canada.',jp:'私にはカナダに住んでいる友達がいます。',a:'lives',choices:['lives','live','living'],exp:E('動詞は who の前の人に合わせる。a friend（1人）→ lives','I have a friend who lives in Canada.','I have a friend who live in Canada.','who の前を見て、s をつけるか決める'),xp:3},
    {q:'I have two friends who ___ in Canada.',jp:'私にはカナダに住んでいる友達が2人います。',a:'live',choices:['live','lives','living'],exp:E('two friends（2人）→ live（s なし）','I have two friends who live in Canada.','I have two friends who lives in Canada.','Q3 と比べよう'),xp:4},
    {q:'Kuruma is a comedian who ___ the M-1 Grand Prix twice.',jp:'くるまはM-1グランプリで2回優勝した芸人です。',a:'won',choices:['won','win','winning'],exp:E('who ＋ 動詞（過去の出来事なので過去形）','Kuruma is a comedian who won the M-1 Grand Prix twice.','','win - won - won。2023年と2024年に2連覇'),xp:3},
    {q:'A doctor is a person ___ helps sick people.',jp:'医者とは病気の人を助ける人のことです。',a:'who',choices:['who','which','what'],exp:E('a person（人）→ who','A doctor is a person who helps sick people.','A doctor is a person which helps sick people.','which は「もの・動物」用（次のセクション）'),xp:3},
    {q:'「人を幸せにする俳優」はどれ？',jp:'「人を幸せにする俳優」を英語で',a:'an actor who makes people happy',choices:['an actor who makes people happy','an actor which makes people happy','an actor who make people happy'],exp:E('人 → who。an actor（1人）→ makes','an actor who makes people happy','an actor who make people happy','who と s の2か所をチェック'),xp:4},
    {q:'Do you know the girl who ___ karate every day?',jp:'毎日空手を練習している女の子を知っていますか。',a:'practices',choices:['practices','practice','practicing'],exp:E('the girl（1人）→ practices','Do you know the girl who practices karate every day?','','every day（毎日）なので現在形'),xp:4}
  ],
  qb:[
    {jp:'私にはカナダに住んでいる友達がいます。',a:'I have a friend who lives in Canada.',exp:E('a friend ＋ who lives in Canada','I have a friend who lives in Canada.','I have a friend who live in Canada.','lives の s を忘れずに'),xp:6},
    {jp:'ガンディーは自由のために戦ったリーダーでした。',a:'Gandhi was a leader who fought for freedom.',exp:E('a leader ＋ who fought for freedom','Gandhi was a leader who fought for freedom.','','fought（戦った）は fight の過去形'),xp:6}
  ],
  qc:[
    {jp:'くるまはM-1グランプリで2回優勝した芸人です。',words:['Kuruma','is a comedian','who','won','the M-1 Grand Prix twice'],a:'Kuruma is a comedian who won the M-1 Grand Prix twice.',exp:E('a comedian ＋ who won ～','Kuruma is a comedian who won the M-1 Grand Prix twice.','','くるま本人も満足の一文'),xp:7},
    {jp:'私は人を幸せにする俳優になりたい。',words:['I want to be','an actor','who','makes','people happy'],a:'I want to be an actor who makes people happy.',exp:E('an actor ＋ who makes people happy','I want to be an actor who makes people happy.','','make ＋ 人 ＋ happy ＝ 人を幸せにする'),xp:7}
  ]
};

U5[3]={type:'grammar',
  title:'③ もの・動物 ＋ which / that ＋ 動詞',
  sub:'「もの」や「動物」を説明するときは、who ではなく which か that を使う。',
  talk:[
    {who:'kyon',text:'じゃあ、ものを説明するときも who？'},
    {who:'nishi',text:'もの・動物なら which か that に変わる。a bus which goes to the station ＝ 駅へ行くバス。'},
    {who:'kuruma',text:'見分けは簡単っす。前が人なら who、前がもの・動物なら which。that はどっちにも使える万能選手っす！'},
    {who:'kyon',text:'that、俺みたい。どこでも使える！'},
    {who:'nishi',text:'…どこでも使えるかどうかは、今日のがんばりしだいだな。'}
  ],
  formula:H('もの・動物')+' ＋ which / that ＋ '+H2('動詞 …')+'<br><small style="color:var(--text2)">例：This is a '+H('bus')+' which '+H2('goes to the station')+'.（これは駅へ行くバスです。）</small>',
  ruleTitle:'ルール',
  rules:[
    '前が人 → who（that でもOK）',
    '前がもの・動物 → which または that',
    'which / that のすぐうしろに動詞（この形では which / that を省略できない）',
    '動詞の形は、前の名詞に合わせる：a bus which goes ／ ideas that changed'
  ],
  visual:compareCard('🔍 前の名詞で決める',['前の名詞','使う語','例'],[
    ['人（a friend, a leader）','who / that','a friend '+H2('who')+' lives in Canada'],
    ['もの（a bus, a book, a song）','which / that','a bus '+H2('which')+' goes to the station'],
    ['動物（a dog, a cat）','which / that','a dog '+H2('that')+' has long ears']
  ]),
  ex:[
    ['This is a bus which goes to the station.','これは駅へ行くバスです。'],
    ['I have a dog that has long ears.','私は耳の長いイヌを飼っています。'],
    ['The Salt March was a protest which started in 1930.','塩の行進は1930年に始まった抗議運動でした。'],
    ['This is a song that makes me happy.','これは私を幸せな気持ちにしてくれる歌です。'],
    ['Look at the cat which is sleeping on the sofa.','ソファの上で眠っているネコを見て。'],
    ['Gandhi had ideas that changed the world.','ガンディーは世界を変えた考えを持っていました。']
  ],
  qs:[
    {q:'This is a bus ___ goes to the station.',jp:'これは駅へ行くバスです。',a:'which',choices:['which','who','where'],exp:E('もの（a bus）→ which','This is a bus which goes to the station.','This is a bus who goes to the station.','who は人だけ'),xp:3},
    {q:'I have a dog ___ has long ears.',jp:'私は耳の長いイヌを飼っています。',a:'that',choices:['that','who','it'],exp:E('動物（a dog）→ that / which','I have a dog that has long ears.','I have a dog it has long ears.','it を入れると文が2つくっついてしまう'),xp:3},
    {q:'I know a girl ___ can speak three languages.',jp:'私は3つの言語を話せる女の子を知っています。',a:'who',choices:['who','which','what'],exp:E('人（a girl）→ who','I know a girl who can speak three languages.','I know a girl which can speak three languages.','前の名詞が人か、ものかを最初に見る'),xp:3},
    {q:'This is a song that ___ me happy.',jp:'これは私を幸せな気持ちにしてくれる歌です。',a:'makes',choices:['makes','make','making'],exp:E('a song（1つ）→ makes','This is a song that makes me happy.','This is a song that make me happy.','that の前の名詞に合わせて s'),xp:3},
    {q:'The Salt March was a protest which ___ in 1930.',jp:'塩の行進は1930年に始まった抗議運動でした。',a:'started',choices:['started','start','starting'],exp:E('which のすぐうしろに動詞。1930年なので過去形','The Salt March was a protest which started in 1930.','',''),xp:3},
    {q:'Look at the cat which ___ sleeping on the sofa.',jp:'ソファの上で眠っているネコを見て。',a:'is',choices:['is','are','be'],exp:E('the cat（1匹）→ is sleeping','Look at the cat which is sleeping on the sofa.','','Unit4 の the cat sleeping on the sofa と同じ意味'),xp:4},
    {q:'I want a robot ___ can cook dinner.',jp:'私は夕食を作れるロボットがほしい。',a:'which',choices:['which','who','what'],exp:E('ロボットは「もの」→ which','I want a robot which can cook dinner.','I want a robot who can cook dinner.','人みたいに動いても、ロボットはもの扱い'),xp:4},
    {q:'Gandhi had ideas that ___ the world.',jp:'ガンディーは世界を変えた考えを持っていました。',a:'changed',choices:['changed','changing','changes'],exp:E('ideas ＋ that ＋ 動詞（過去形）','Gandhi had ideas that changed the world.','','that のすぐうしろに動詞がくる形'),xp:4}
  ],
  qb:[
    {jp:'これは駅へ行くバスです。',a:'This is a bus which goes to the station.',exp:E('a bus ＋ which goes to the station','This is a bus which goes to the station.','This is a bus who goes to the station.','goes の es を忘れずに'),xp:6},
    {jp:'これは私を幸せな気持ちにしてくれる歌です。（that を使って）',a:'This is a song that makes me happy.',exp:E('a song ＋ that makes me happy','This is a song that makes me happy.','',''),xp:6}
  ],
  qc:[
    {jp:'私は夕食を作れるロボットがほしい。',words:['I want','a robot','which','can cook','dinner'],a:'I want a robot which can cook dinner.',exp:E('a robot ＋ which can cook dinner','I want a robot which can cook dinner.','',''),xp:6},
    {jp:'塩の行進は1930年に始まった抗議運動でした。',words:['The Salt March','was','a protest','which','started in 1930'],a:'The Salt March was a protest which started in 1930.',exp:E('a protest ＋ which started in 1930','The Salt March was a protest which started in 1930.','','教科書の内容とつながる文'),xp:7}
  ]
};

U5[4]={type:'grammar',
  title:'④ もの ＋ which / that ＋ 主語 ＋ 動詞',
  sub:'①の「名詞＋主語＋動詞」に which / that をはさんだ形。だから、この which / that は省略できる。',
  talk:[
    {who:'kyon',text:'③と何がちがうの？'},
    {who:'nishi',text:'which のうしろを見る。③は which のうしろがすぐ動詞。④は which のうしろに「主語＋動詞」がくる。'},
    {who:'kyon',text:'the book which I bought…「私が買った本」！これ、①と同じ意味じゃん！'},
    {who:'nishi',text:'その通り。①の形に which か that をはさんだだけだ。だから④の which / that は消しても文が成り立つ。'},
    {who:'kuruma',text:'見分けの呪文っす。「which のうしろ、動詞ならキープ、主語なら消してOK」！'}
  ],
  formula:H('もの')+' ＋ which / that ＋ '+H2('主語 ＋ 動詞 …')+'<br><small style="color:var(--text2)">例：This is the '+H('book')+' which '+H2('I bought')+' yesterday.（これは私が昨日買った本です。）</small>',
  ruleTitle:'③と④の見分け方',
  rules:[
    'which / that のうしろが「主語＋動詞」→ ④の形（which / that は省略できる）',
    'which / that のうしろがすぐ動詞 → ③の形（省略できない）',
    '人を説明するこの形では、教科書では that を使う（または省略する）'
  ],
  visual:compareCard('🟰 3つとも同じ意味（これは私が昨日買った本です）',['形','文'],[
    ['which をはさむ','This is the book '+H2('which')+' I bought yesterday.'],
    ['that をはさむ','This is the book '+H2('that')+' I bought yesterday.'],
    ['何もはさまない（①）','This is the book I bought yesterday.']
  ])+compareCard('✂️ 省略できる？できない？',['文','which / that のうしろ','省略'],[
    ['the cake which I made','I（主語）＋ made','⭕ できる'],
    ['a bus which goes to the station','goes（動詞）','❌ できない'],
    ['a person that many people respect','many people（主語）＋ respect','⭕ できる']
  ]),
  ex:[
    ['This is the book which I bought yesterday.','これは私が昨日買った本です。'],
    ['The movie that we watched was exciting.','私たちが見た映画はわくわくしました。'],
    ['Gandhi is a person that many people respect.','ガンディーは多くの人が尊敬する人物です。'],
    ['The food which my mother makes is delicious.','母が作る料理はとてもおいしい。'],
    ['Is this the bag that you lost?','これはあなたがなくしたかばんですか。'],
    ['The song that I sing every day is Soranji.','私が毎日歌う歌は「Soranji」です。']
  ],
  qs:[
    {q:'This is the book ___ I bought yesterday.',jp:'これは私が昨日買った本です。',a:'which',choices:['which','who','what'],exp:E('もの（the book）＋ which ＋ 主語 ＋ 動詞','This is the book which I bought yesterday.','This is the book who I bought yesterday.','この which は省略してもOK'),xp:3},
    {q:'The movie that we ___ was exciting.',jp:'私たちが見た映画はわくわくしました。',a:'watched',choices:['watched','watching','watches'],exp:E('that ＋ 主語（we）＋ 動詞（watched）','The movie that we watched was exciting.','','文の本当の動詞は was'),xp:3},
    {q:'Gandhi is a person ___ many people respect.',jp:'ガンディーは多くの人が尊敬する人物です。',a:'that',choices:['that','which','what'],exp:E('人の説明で、うしろが「主語＋動詞」→ that','Gandhi is a person that many people respect.','Gandhi is a person which many people respect.','which は もの・動物用'),xp:3},
    {q:'which / who を省略できる文はどれ？',jp:'which / who を省略できる文',a:'This is the cake which I made.',choices:['This is the cake which I made.','This is a bus which goes to the station.','I have a friend who lives in Kyoto.'],exp:E('which のうしろが「主語＋動詞」なら省略できる','This is the cake (which) I made.','This is a bus goes to the station.（which を消すと文がこわれる）','呪文：動詞ならキープ、主語なら消してOK'),xp:4},
    {q:'The food which my mother ___ is delicious.',jp:'母が作る料理はとてもおいしい。',a:'makes',choices:['makes','make','making'],exp:E('which ＋ 主語（my mother）＋ 動詞（makes）','The food which my mother makes is delicious.','','my mother（1人）なので makes'),xp:4},
    {q:'Is this the bag ___ you lost?',jp:'これはあなたがなくしたかばんですか。',a:'that',choices:['that','who','what'],exp:E('もの（the bag）＋ that ＋ 主語 ＋ 動詞','Is this the bag that you lost?','Is this the bag who you lost?','lose - lost - lost'),xp:4},
    {q:'「私が昨日会った男の人」はどれ？',jp:'「私が昨日会った男の人」を英語で',a:'the man I met yesterday',choices:['the man I met yesterday','the man which I met yesterday','the man I met him yesterday'],exp:E('人の説明 → 何もはさまない（または that）','the man I met yesterday','the man which I met yesterday（which は人に使わない）','him はいらない（①のルール）'),xp:4},
    {q:'The pictures which Ken took ___ beautiful.',jp:'ケンが撮った写真はきれいです。',a:'are',choices:['are','is','am'],exp:E('主語の中心は the pictures（複数）→ are','The pictures which Ken took are beautiful.','The pictures which Ken took is beautiful.','Ken に引っぱられない。カッコの前の名詞を見る'),xp:4}
  ],
  qb:[
    {jp:'これは私が昨日買った本です。（which を使って）',a:'This is the book which I bought yesterday.',exp:E('the book ＋ which I bought yesterday','This is the book which I bought yesterday.','This is the book which I bought it yesterday.','it はいらない'),xp:6},
    {jp:'私たちが見た映画はわくわくしました。（that を使って）',a:'The movie that we watched was exciting.',exp:E('[The movie that we watched] ＋ was exciting','The movie that we watched was exciting.','',''),xp:6}
  ],
  qc:[
    {jp:'私が毎日歌う歌は「Soranji」です。',words:['The song','that','I sing','every day','is Soranji'],a:'The song that I sing every day is Soranji.',exp:E('[The song that I sing every day] ＋ is ～','The song that I sing every day is Soranji.','','ミセスの曲名で覚えよう'),xp:7},
    {jp:'これはしゅんが作った料理です。',words:['This is','the dish','that','Shun','made'],a:'This is the dish that Shun made.',exp:E('the dish ＋ that ＋ Shun made','This is the dish that Shun made.','','しゅんは料理が得意'),xp:6}
  ]
};

U5[5]={type:'test',
  title:'Unit5 確認テスト',
  sub:'名詞＋主語＋動詞・who・which / that のまとめ。前の名詞（人？もの？）と、うしろの形（動詞？主語？）を見よう。',
  talk:[
    {who:'kuruma',text:'きょんさん、ラストっす！前の名詞が人かもの、うしろが動詞か主語。これだけ見ればいけるっす！'},
    {who:'kyon',text:'よし、くるまの前で恥はかけない！'}
  ],
  qs:[
    {q:'This is the book ___ yesterday.',jp:'これは私が昨日買った本です。',a:'I bought',choices:['I bought','bought I','I bought it'],exp:E('名詞 ＋ 主語 ＋ 動詞','This is the book I bought yesterday.','This is the book I bought it yesterday.','it はいらない'),xp:3},
    {q:'Gandhi is a leader many people ___.',jp:'ガンディーは多くの人が尊敬するリーダーです。',a:'respect',choices:['respect','respects','respecting'],exp:E('many people（複数）＋ respect','Gandhi is a leader many people respect.','',''),xp:3},
    {q:'I have a friend ___ lives in Canada.',jp:'私にはカナダに住んでいる友達がいます。',a:'who',choices:['who','which','he'],exp:E('人 → who','I have a friend who lives in Canada.','I have a friend he lives in Canada.',''),xp:3},
    {q:'I have a friend who ___ in Canada.',jp:'私にはカナダに住んでいる友達がいます。',a:'lives',choices:['lives','live','living'],exp:E('a friend（1人）→ lives','I have a friend who lives in Canada.','',''),xp:3},
    {q:'I have two friends who ___ in Canada.',jp:'私にはカナダに住んでいる友達が2人います。',a:'live',choices:['live','lives','living'],exp:E('two friends（2人）→ live','I have two friends who live in Canada.','',''),xp:3},
    {q:'A doctor is a person ___ helps sick people.',jp:'医者とは病気の人を助ける人のことです。',a:'who',choices:['who','which','what'],exp:E('人 → who','A doctor is a person who helps sick people.','',''),xp:3},
    {q:'This is a bus ___ goes to the station.',jp:'これは駅へ行くバスです。',a:'which',choices:['which','who','where'],exp:E('もの → which','This is a bus which goes to the station.','This is a bus who goes to the station.',''),xp:3},
    {q:'I have a dog ___ has long ears.',jp:'私は耳の長いイヌを飼っています。',a:'that',choices:['that','who','it'],exp:E('動物 → that / which','I have a dog that has long ears.','',''),xp:3},
    {q:'This is a song that ___ me happy.',jp:'これは私を幸せな気持ちにしてくれる歌です。',a:'makes',choices:['makes','make','making'],exp:E('a song（1つ）→ makes','This is a song that makes me happy.','',''),xp:3},
    {q:'This is the cake ___ I made.',jp:'これは私が作ったケーキです。',a:'which',choices:['which','who','what'],exp:E('もの ＋ which ＋ 主語 ＋ 動詞','This is the cake which I made.','','省略しても OK'),xp:3},
    {q:'Gandhi is a person ___ many people respect.',jp:'ガンディーは多くの人が尊敬する人物です。',a:'that',choices:['that','which','what'],exp:E('人 ＋ that ＋ 主語 ＋ 動詞','Gandhi is a person that many people respect.','',''),xp:4},
    {q:'The movie that we watched ___ exciting.',jp:'私たちが見た映画はわくわくしました。',a:'was',choices:['was','were','did'],exp:E('本当の動詞は was（the movie は1つ）','The movie that we watched was exciting.','',''),xp:4},
    {q:'「人を幸せにする俳優」はどれ？',jp:'「人を幸せにする俳優」を英語で',a:'an actor who makes people happy',choices:['an actor who makes people happy','an actor which makes people happy','an actor makes people happy'],exp:E('人 → who。who は省略できない（うしろが動詞）','an actor who makes people happy','an actor makes people happy',''),xp:4},
    {q:'「私が昨日会った男の人」はどれ？',jp:'「私が昨日会った男の人」を英語で',a:'the man I met yesterday',choices:['the man I met yesterday','the man I met him yesterday','the man met I yesterday'],exp:E('名詞 ＋ 主語 ＋ 動詞','the man I met yesterday','the man I met him yesterday',''),xp:4},
    {q:'which / that を省略できる文はどれ？',jp:'which / that を省略できる文',a:'This is the picture that I took.',choices:['This is the picture that I took.','This is a train that goes to Nagoya.','I have a cat which likes fish.'],exp:E('うしろが「主語＋動詞」なら省略できる','This is the picture (that) I took.','This is a train goes to Nagoya.','動詞ならキープ、主語なら消してOK'),xp:4},
    {q:'Kuruma is a comedian who ___ the M-1 Grand Prix twice.',jp:'くるまはM-1グランプリで2回優勝した芸人です。',a:'won',choices:['won','win','winning'],exp:E('who ＋ 動詞（過去形）','Kuruma is a comedian who won the M-1 Grand Prix twice.','',''),xp:3},
    {q:'Is this the bag ___ you lost?',jp:'これはあなたがなくしたかばんですか。',a:'that',choices:['that','who','what'],exp:E('もの ＋ that ＋ 主語 ＋ 動詞','Is this the bag that you lost?','',''),xp:3},
    {q:'I know a girl ___ can speak three languages.',jp:'私は3つの言語を話せる女の子を知っています。',a:'who',choices:['who','which','what'],exp:E('人 → who','I know a girl who can speak three languages.','',''),xp:3},
    {q:'The Salt March was a protest which ___ in 1930.',jp:'塩の行進は1930年に始まった抗議運動でした。',a:'started',choices:['started','start','starting'],exp:E('which ＋ 動詞（過去形）','The Salt March was a protest which started in 1930.','',''),xp:3},
    {q:'The pictures Ken took ___ beautiful.',jp:'ケンが撮った写真はきれいです。',a:'are',choices:['are','is','am'],exp:E('主語の中心は the pictures（複数）','The pictures Ken took are beautiful.','The pictures Ken took is beautiful.',''),xp:4}
  ]
};

// ============================
// Unit6 What does it mean to be a global citizen?（地球市民）
// 仮定法（I wish ／ If＋were ／ If＋過去形）/ 主語を説明する関係代名詞
// ============================
var U6={};
U6[0]={type:'vocab',
  title:'Unit6 地球市民：単語準備',
  sub:'テーマは「国をこえて助け合う」。文法は「現実とちがう〈もしも〉」の言い方。',
  talk:[
    {who:'kyon',text:'Unit6は「地球市民」…ちきゅうしみん？宇宙人と戦うやつ？'},
    {who:'nishi',text:'戦わない。国をこえて助け合う人のことだ。使わなくなったランドセルや文房具を、海外の子供たちに送る活動も出てくる。'},
    {who:'iwakura',text:'きょん、今回の文法は「もしも」の話だよ。「もし私が鳥だったら」とか「〜だったらいいのに」とか。'},
    {who:'kyon',text:'イワクラちゃん！「もしも」なら得意。毎日「もし俺がM-1王者だったら」って考えてるもん。'},
    {who:'iwakura',text:'それ、まさに今回の形。現実とちがう「もしも」は、英語だと動詞を過去形にするの。今の話なのに過去形。変でしょ？でも、それがルール。'},
    {who:'nishi',text:'4つの型をやる。①I wish ～（〜だったらいいのに）②If I were ～（もし私が〜だったら）③If ＋ 過去形（もし〜したら）④長い主語（Unit5 の who を主語のところで使う形）。'}
  ],
  words:[
    ['global','世界的な・地球の'],['citizen','市民'],['donate','寄付する'],['school supplies','学用品'],['support','支える・支援'],
    ['education','教育'],['situation','状況'],['abroad','海外に・海外で'],['wish','願う'],['imagine','想像する'],
    ['international','国際的な'],['share','分け合う'],['rich','お金持ちの'],['wing','つばさ'],['dream','夢']
  ],
  qs:[
    {q:'donate',jp:'donate の意味は？',a:'寄付する',choices:['寄付する','想像する','分け合う'],exp:E('donate ＝ 寄付する','donate school supplies（学用品を寄付する）','','ドネート。名詞は donation（寄付）'),xp:2},
    {q:'「教育」を英語で言うと？',jp:'「教育」は英語で？',a:'education',choices:['education','situation','imagination'],exp:E('教育 ＝ education','Every child needs education.（どの子供にも教育が必要だ）','','-tion で終わる名詞がこのUnitには多い'),xp:2},
    {q:'abroad',jp:'abroad の意味は？',a:'海外に・海外で',choices:['海外に・海外で','国内で','学校で'],exp:E('abroad ＝ 海外に・海外で','study abroad（留学する）','','go abroad（海外へ行く）。to はつけない'),xp:2},
    {q:'wish',jp:'wish の意味は？',a:'願う',choices:['願う','洗う','選ぶ'],exp:E('wish ＝ 願う','I wish I could fly.（空を飛べたらいいのに）','','wash（洗う）とまちがえないで'),xp:2},
    {q:'「市民」を英語で言うと？',jp:'「市民」は英語で？',a:'citizen',choices:['citizen','city','situation'],exp:E('市民 ＝ citizen','a global citizen（地球市民）','','city（都市）に住む人 → citizen'),xp:2}
  ]
};

U6[1]={type:'grammar',
  title:'① I wish ＋ 主語 ＋ 過去形（〜だったらいいのに）',
  sub:'「本当はちがうけど、〜だったらいいのに」という願い。動詞を過去形にするのがルール。',
  talk:[
    {who:'kyon',text:'「空を飛べたらいいのに」って、I wish I can fly. でしょ？'},
    {who:'nishi',text:'おしい。現実とちがう願いは、動詞を1つ過去にずらす。can → could。I wish I could fly.'},
    {who:'kyon',text:'過去形！？でも今の話だよ？'},
    {who:'iwakura',text:'そう、過去形なのに「今」の話。過去形は「これは現実からはなれてるよ」っていう合図なの。時間が遠いんじゃなくて、現実から遠い。'},
    {who:'kyon',text:'現実から遠い…俺のM-1優勝くらい遠い！'},
    {who:'nishi',text:'…まあ、そういうことだ。下の表で、can / have / be動詞 のどれでも同じように「1つ過去へ」になるのを確かめよう。'}
  ],
  formula:'I wish ＋ 主語 ＋ '+H('過去形')+' …<br><small style="color:var(--text2)">例：I wish I '+H('could')+' fly.（空を飛べたらいいのに。）</small>',
  ruleTitle:'1つ過去へずらす',
  rules:[
    'can → could：I wish I could speak English.',
    'have → had：I wish I had a dog.',
    'be動詞 → were（主語が I でも he でも my brother でも were）：I wish I were a bird.',
    '意味は「今」の願い。「〜だったらいいのに（でも実際はちがう）」'
  ],
  visual:compareCard('🌏 現実 → 願い（I wish）',['現実','I wish の文'],[
    ['I can’t fly.（飛べない）','I wish I '+H2('could')+' fly.'],
    ['I don’t have a dog.（イヌを飼っていない）','I wish I '+H2('had')+' a dog.'],
    ['I am not a bird.（鳥じゃない）','I wish I '+H2('were')+' a bird.'],
    ['My brother isn’t here.（兄はいない）','I wish my brother '+H2('were')+' here.']
  ]),
  ex:[
    ['I wish I could fly.','空を飛べたらいいのに。'],
    ['I wish I had a dog.','イヌを飼っていたらいいのに。'],
    ['I wish I were a bird.','私が鳥だったらいいのに。'],
    ['I wish I could speak English well.','英語を上手に話せたらいいのに。'],
    ['I wish I had more time.','もっと時間があればいいのに。'],
    ['I wish I could go to a Mrs. GREEN APPLE concert.','ミセスのライブに行けたらいいのに。']
  ],
  qs:[
    {q:'I wish I ___ fly.',jp:'空を飛べたらいいのに。',a:'could',choices:['could','can','will'],exp:E('I wish のあとは1つ過去へ。can → could','I wish I could fly.','I wish I can fly.','過去形 ＝「現実から遠い」の合図'),xp:3},
    {q:'I wish I ___ a dog.',jp:'イヌを飼っていたらいいのに。',a:'had',choices:['had','have','has'],exp:E('have → had','I wish I had a dog.','I wish I have a dog.','今飼っていないから、had'),xp:3},
    {q:'I wish I ___ a bird.',jp:'私が鳥だったらいいのに。',a:'were',choices:['were','am','be'],exp:E('be動詞は were','I wish I were a bird.','I wish I am a bird.','I のときも was ではなく were（テストでは were）'),xp:3},
    {q:'I wish I ___ speak English well.',jp:'英語を上手に話せたらいいのに。',a:'could',choices:['could','can','am'],exp:E('can → could','I wish I could speak English well.','',''),xp:3},
    {q:'I wish I ___ more time.',jp:'もっと時間があればいいのに。',a:'had',choices:['had','have','having'],exp:E('have → had','I wish I had more time.','',''),xp:3},
    {q:'I wish my brother ___ here.',jp:'兄がここにいたらいいのに。',a:'were',choices:['were','is','be'],exp:E('主語が my brother でも were','I wish my brother were here.','I wish my brother is here.','仮定法の be動詞は、だれでも were'),xp:4},
    {q:'「I wish I could fly.」の意味は？',jp:'I wish I could fly. の意味',a:'空を飛べたらいいのに（実際は飛べない）',choices:['空を飛べたらいいのに（実際は飛べない）','空を飛べた（昔の話）','空を飛べるだろう'],exp:E('過去形でも「今」の願い','I wish I could fly. ＝ 空を飛べたらいいのに','「昔は飛べた」ではない','過去形 ＝ 時間が遠いのではなく、現実から遠い'),xp:4},
    {q:'I wish I ___ go to a Mrs. GREEN APPLE concert.',jp:'ミセスのライブに行けたらいいのに。',a:'could',choices:['could','can','will'],exp:E('can → could','I wish I could go to a Mrs. GREEN APPLE concert.','',''),xp:4}
  ],
  qb:[
    {jp:'空を飛べたらいいのに。',a:'I wish I could fly.',exp:E('I wish ＋ I could ＋ 原形','I wish I could fly.','I wish I can fly.','この単元の基本の文'),xp:6},
    {jp:'イヌを飼っていたらいいのに。',a:'I wish I had a dog.',exp:E('I wish ＋ I had ～','I wish I had a dog.','I wish I have a dog.',''),xp:6}
  ],
  qc:[
    {jp:'英語を上手に話せたらいいのに。',words:['I wish','I','could speak','English','well'],a:'I wish I could speak English well.',exp:E('I wish ＋ I could ＋ 原形','I wish I could speak English well.','',''),xp:6},
    {jp:'私がM-1チャンピオンだったらいいのに。',words:['I wish','I','were','an M-1 champion'],a:'I wish I were an M-1 champion.',exp:E('be動詞 → were','I wish I were an M-1 champion.','I wish I am an M-1 champion.','きょんの毎日の願い'),xp:6}
  ]
};

U6[2]={type:'grammar',
  title:'② If ＋ 主語 ＋ were ～, 主語 ＋ would / could ＋ 原形',
  sub:'「もし私が〜だったら、…するのに」。前半は were、後半は would か could ＋動詞の原形。',
  talk:[
    {who:'kyon',text:'「もし私が鳥だったら」は If I were a bird！①と同じ were だ！'},
    {who:'nishi',text:'そう。そして後半の「…するのに」は、would（〜するのに）か could（〜できるのに）＋動詞の原形で作る。'},
    {who:'iwakura',text:'前半が「もしもの世界」の入り口、後半が「その世界でやること」。入り口で were を使ったら、中では would か could。セットで覚えて。'},
    {who:'kyon',text:'入り口 were、中は would / could！'},
    {who:'nishi',text:'If I were you, ～ は「もし私があなたなら〜するよ」。人にアドバイスするときの決まり文句だ。'}
  ],
  formula:'If ＋ 主語 ＋ '+H('were')+' ～, 主語 ＋ '+H2('would / could')+' ＋ 動詞の原形 …<br><small style="color:var(--text2)">例：If I '+H('were')+' a bird, I '+H2('could')+' fly to you.（もし私が鳥なら、あなたのところへ飛んでいけるのに。）</small>',
  ruleTitle:'ルール',
  rules:[
    '前半（If ～）：be動詞は were（I でも he でも were）',
    '後半：would ＋ 原形（〜するのに）／ could ＋ 原形（〜できるのに）',
    'If I were you, I would ～ ＝「私だったら〜するよ」（アドバイス）',
    '意味は「今」の話（現実はちがう）'
  ],
  visual:compareCard('🚪 入り口と中身はセット',['入り口（If ～）','中身（後半）','意味'],[
    ['If I '+H2('were')+' a bird,','I '+H2('could')+' fly to you.','鳥なら、飛んでいけるのに'],
    ['If I '+H2('were')+' you,','I '+H2('would')+' ask the teacher.','私なら、先生にたずねるよ'],
    ['If he '+H2('were')+' here,','he '+H2('would')+' help us.','彼がいれば、手伝ってくれるのに']
  ]),
  ex:[
    ['If I were a bird, I could fly to you.','もし私が鳥なら、あなたのところへ飛んでいけるのに。'],
    ['If I were you, I would ask the teacher.','もし私があなたなら、先生にたずねるよ。'],
    ['If I were rich, I would donate a lot of money.','もし私がお金持ちなら、たくさんのお金を寄付するのに。'],
    ['If he were here, he would help us.','もし彼がここにいれば、私たちを手伝ってくれるのに。'],
    ['If I were a teacher, I would make tests easy.','もし私が先生なら、テストを簡単にするのに。'],
    ['If I were an actor, I would act in a famous play.','もし私が俳優なら、有名な劇に出るのに。']
  ],
  qs:[
    {q:'If I ___ a bird, I could fly to you.',jp:'もし私が鳥なら、あなたのところへ飛んでいけるのに。',a:'were',choices:['were','am','be'],exp:E('入り口の be動詞は were','If I were a bird, I could fly to you.','If I am a bird, I could fly to you.','I でも were'),xp:3},
    {q:'If I were a bird, I ___ fly to you.',jp:'もし私が鳥なら、あなたのところへ飛んでいけるのに。',a:'could',choices:['could','can','will'],exp:E('後半は could ＋ 原形（〜できるのに）','If I were a bird, I could fly to you.','If I were a bird, I can fly to you.','入り口が were なら、中は would / could'),xp:3},
    {q:'If I were you, I ___ ask the teacher.',jp:'もし私があなたなら、先生にたずねるよ。',a:'would',choices:['would','will','am'],exp:E('後半は would ＋ 原形（〜するのに）','If I were you, I would ask the teacher.','If I were you, I will ask the teacher.','If I were you ＝ アドバイスの決まり文句'),xp:3},
    {q:'If he ___ here, he would help us.',jp:'もし彼がここにいれば、私たちを手伝ってくれるのに。',a:'were',choices:['were','is','was being'],exp:E('he でも were','If he were here, he would help us.','If he is here, he would help us.',''),xp:3},
    {q:'If I were rich, I would ___ a lot of money.',jp:'もし私がお金持ちなら、たくさんのお金を寄付するのに。',a:'donate',choices:['donate','donated','donating'],exp:E('would のうしろは動詞の原形','If I were rich, I would donate a lot of money.','If I were rich, I would donated a lot of money.','would / could / will / can のうしろはいつも原形'),xp:4},
    {q:'「If I were you, I would ～.」はどんなときに使う？',jp:'If I were you, I would ～. の使いどころ',a:'相手にアドバイスするとき',choices:['相手にアドバイスするとき','昔の思い出を話すとき','未来の予定を言うとき'],exp:E('If I were you ＝「もし私があなたなら」','If I were you, I would sleep early.（私なら早く寝るよ）','','「〜したほうがいいよ」をやわらかく言える'),xp:4},
    {q:'If I were a teacher, I ___ make tests easy.',jp:'もし私が先生なら、テストを簡単にするのに。',a:'would',choices:['would','will','did'],exp:E('後半は would ＋ 原形','If I were a teacher, I would make tests easy.','',''),xp:4},
    {q:'If my sister ___ a doctor, she could help many people.',jp:'もし姉が医者なら、多くの人を助けられるのに。',a:'were',choices:['were','is','are'],exp:E('主語が my sister でも were','If my sister were a doctor, she could help many people.','',''),xp:4}
  ],
  qb:[
    {jp:'もし私が鳥なら、あなたのところへ飛んでいけるのに。',a:'If I were a bird, I could fly to you.',exp:E('If I were ～, I could ＋ 原形','If I were a bird, I could fly to you.','If I am a bird, I can fly to you.','この単元でいちばん有名な文'),xp:7},
    {jp:'もし私があなたなら、先生にたずねるよ。',a:'If I were you, I would ask the teacher.',exp:E('If I were you, I would ＋ 原形','If I were you, I would ask the teacher.','',''),xp:7}
  ],
  qc:[
    {jp:'もし私がお金持ちなら、たくさんのお金を寄付するのに。',words:['If I were','rich,','I would','donate','a lot of money'],a:'If I were rich, I would donate a lot of money.',exp:E('入り口 were → 中身 would ＋ 原形','If I were rich, I would donate a lot of money.','',''),xp:7},
    {jp:'もし私が俳優なら、有名な劇に出るのに。',words:['If I were','an actor,','I would','act in','a famous play'],a:'If I were an actor, I would act in a famous play.',exp:E('入り口 were → 中身 would ＋ 原形','If I were an actor, I would act in a famous play.','','act in ～ ＝ ～に出演する'),xp:7}
  ]
};

U6[3]={type:'grammar',
  title:'③ If ＋ 主語 ＋ 過去形 ～, 主語 ＋ would / could ＋ 原形',
  sub:'be動詞以外でも同じ。「もし〜を持っていたら」「もし〜を知っていたら」。そして、ふつうの if との見分けが最重要！',
  talk:[
    {who:'nishi',text:'were 以外の動詞でも作れる。If I had a lot of money, I would build a school.（もしたくさんのお金があれば、学校を建てるのに）'},
    {who:'kyon',text:'have → had で、うしろは would！①②と同じルールだ！'},
    {who:'nishi',text:'ただし注意。If it rains tomorrow, I will stay home. これは「明日雨が降ったら」。本当に起こりうる話だから、ふつうの現在形と will のままなんだ。'},
    {who:'iwakura',text:'見分け方は「それ、本当に起こりそう？」って自分に聞くこと。明日の雨は起こりそう → ふつうの if。私が鳥になる → ならない → 過去形の if。'},
    {who:'kyon',text:'俺がM-1で優勝する…起こりそう！'},
    {who:'iwakura',text:'…それはきょんが決めて。'}
  ],
  formula:'If ＋ 主語 ＋ '+H('過去形')+' ～, 主語 ＋ '+H2('would / could')+' ＋ 動詞の原形 …<br><small style="color:var(--text2)">例：If I '+H('had')+' a lot of money, I '+H2('would')+' build a school.</small>',
  ruleTitle:'ふつうの if と仮定法の見分け方',
  rules:[
    '本当に起こりうる → ふつうの if：If ＋ 現在形, ～ will ＋ 原形',
    '現実とちがう（起こらない）→ 仮定法：If ＋ 過去形, ～ would / could ＋ 原形',
    '迷ったら「それ、本当に起こりそう？」と自分に聞く'
  ],
  visual:compareCard('⚖️ ふつうの if ／ 仮定法',['','前半','後半','例'],[
    ['起こりうる','現在形','will ＋ 原形','If it '+H2('rains')+' tomorrow, I '+H2('will')+' stay home.'],
    ['現実とちがう','過去形','would / could ＋ 原形','If I '+H2('had')+' wings, I '+H2('would')+' fly to school.'],
    ['起こりうる','現在形','命令文など','If you '+H2('are')+' hungry, eat this.'],
    ['現実とちがう','過去形','would / could ＋ 原形','If I '+H2('knew')+' her number, I '+H2('could')+' call her.']
  ]),
  ex:[
    ['If I had a lot of money, I would build a school.','もしたくさんのお金があれば、学校を建てるのに。'],
    ['If I knew her phone number, I could call her.','もし彼女の電話番号を知っていれば、電話できるのに。'],
    ['If I lived near the sea, I would swim every day.','もし海の近くに住んでいれば、毎日泳ぐのに。'],
    ['If we had more time, we could talk more.','もしもっと時間があれば、もっと話せるのに。'],
    ['If it rains tomorrow, I will stay home.','もし明日雨が降れば、私は家にいます。（ふつうの if）'],
    ['If you are free, let’s go to a comedy show.','もしひまなら、お笑いライブに行こうよ。（ふつうの if）']
  ],
  qs:[
    {q:'If I ___ a lot of money, I would build a school.',jp:'もしたくさんのお金があれば、学校を建てるのに。',a:'had',choices:['had','have','has'],exp:E('現実とちがう → 過去形（have → had）','If I had a lot of money, I would build a school.','If I have a lot of money, I would build a school.','後半に would があるのがヒント'),xp:3},
    {q:'If I knew her phone number, I ___ call her.',jp:'もし彼女の電話番号を知っていれば、電話できるのに。',a:'could',choices:['could','can','will'],exp:E('前半が過去形 → 後半は could ＋ 原形','If I knew her phone number, I could call her.','','know - knew'),xp:3},
    {q:'If I ___ near the sea, I would swim every day.',jp:'もし海の近くに住んでいれば、毎日泳ぐのに。',a:'lived',choices:['lived','live','living'],exp:E('現実とちがう → 過去形 lived','If I lived near the sea, I would swim every day.','',''),xp:3},
    {q:'If it ___ tomorrow, I will stay home.',jp:'もし明日雨が降れば、私は家にいます。',a:'rains',choices:['rains','rained','would rain'],exp:E('明日の雨は「起こりうる」→ ふつうの if（現在形）','If it rains tomorrow, I will stay home.','If it rained tomorrow, I will stay home.','後半が will なら、前半は現在形'),xp:4},
    {q:'If you ___ free tomorrow, let’s play tennis.',jp:'もし明日ひまなら、テニスをしよう。',a:'are',choices:['are','were','would be'],exp:E('起こりうる → ふつうの if','If you are free tomorrow, let’s play tennis.','If you were free tomorrow, let’s play tennis.','明日ひまかどうかは本当にありうる話'),xp:4},
    {q:'If we ___ more time, we could talk more.',jp:'もしもっと時間があれば、もっと話せるのに。',a:'had',choices:['had','have','has'],exp:E('後半が could → 前半は過去形','If we had more time, we could talk more.','',''),xp:3},
    {q:'現実とちがう「もしも」の文（仮定法）はどれ？',jp:'仮定法の文はどれ？',a:'If I had wings, I would fly.',choices:['If I had wings, I would fly.','If it is sunny, I will go out.','If you are hungry, eat this.'],exp:E('過去形 ＋ would のセット ＝ 仮定法','If I had wings, I would fly.（つばさがあれば飛ぶのに）','','ほかの2つは本当に起こりうる話（ふつうの if）'),xp:4},
    {q:'If I had a computer, I ___ make videos.',jp:'もしパソコンを持っていたら、動画を作るのに。',a:'would',choices:['would','will','am'],exp:E('前半が過去形 → 後半は would ＋ 原形','If I had a computer, I would make videos.','If I had a computer, I will make videos.',''),xp:4}
  ],
  qb:[
    {jp:'もしたくさんのお金があれば、学校を建てるのに。',a:'If I had a lot of money, I would build a school.',exp:E('If I had ～, I would ＋ 原形','If I had a lot of money, I would build a school.','',''),xp:7},
    {jp:'もし明日雨が降れば、私は家にいます。',a:'If it rains tomorrow, I will stay home.',exp:E('起こりうる → If ＋ 現在形, will ＋ 原形','If it rains tomorrow, I will stay home.','If it rained tomorrow, I would stay home.','ふつうの if も書けるようにしておこう'),xp:6}
  ],
  qc:[
    {jp:'もし海の近くに住んでいれば、毎日泳ぐのに。',words:['If I','lived','near the sea,','I would','swim every day'],a:'If I lived near the sea, I would swim every day.',exp:E('If ＋ 過去形, would ＋ 原形','If I lived near the sea, I would swim every day.','',''),xp:7},
    {jp:'もし彼女の電話番号を知っていれば、電話できるのに。',words:['If I','knew','her phone number,','I could','call her'],a:'If I knew her phone number, I could call her.',exp:E('If ＋ 過去形, could ＋ 原形','If I knew her phone number, I could call her.','',''),xp:7}
  ]
};

U6[4]={type:'grammar',
  title:'④ 長い主語：［名詞 ＋ who / which / that ～］＋ 動詞',
  sub:'Unit5 の who / which を主語のところで使うと、主語が長くなる。「本当の動詞」を見つけるのがコツ。',
  talk:[
    {who:'kyon',text:'The girl who is talking with Ken is my sister. …is が2つあるんだけど！？'},
    {who:'nishi',text:'1つ目の is は who のかたまりの中。2つ目の is が文全体の動詞だ。［The girl who is talking with Ken］is my sister.'},
    {who:'iwakura',text:'主語に長いマフラーが巻いてあるって思って。マフラーを外すと The girl is my sister. 中身はシンプル。'},
    {who:'kyon',text:'マフラー外したら、ただの「その女の子は私の姉です」！'},
    {who:'nishi',text:'読むときは who のかたまりをカッコでくくって、そのあとの動詞を探す。それだけだ。'}
  ],
  formula:'［'+H('名詞')+' ＋ who / which / that ～］＋ '+H2('動詞')+' …<br><small style="color:var(--text2)">例：［The '+H('girl')+' who is talking with Ken］'+H2('is')+' my sister.（ケンと話している女の子は私の姉です。）</small>',
  ruleTitle:'読み方・書き方3ステップ',
  rules:[
    '① who / which / that のかたまりをカッコでくくる（マフラー）',
    '② カッコのあとの動詞が「文の本当の動詞」',
    '③ 本当の動詞の形は、カッコの前の名詞に合わせる：［The boys who live here］are … （boys → are）'
  ],
  visual:compareCard('🧣 マフラーを外すと…',['長い主語の文','マフラーを外すと'],[
    ['［The girl '+X('who is talking with Ken')+'］'+H2('is')+' my sister.','The girl '+H2('is')+' my sister.'],
    ['［The man '+X('who lives next door')+'］'+H2('is')+' a doctor.','The man '+H2('is')+' a doctor.'],
    ['［The boys '+X('who are playing soccer')+'］'+H2('are')+' my friends.','The boys '+H2('are')+' my friends.'],
    ['［The book '+X('that I read yesterday')+'］'+H2('was')+' interesting.','The book '+H2('was')+' interesting.']
  ]),
  ex:[
    ['The girl who is talking with Ken is my sister.','ケンと話している女の子は私の姉です。'],
    ['Children who need school supplies live all over the world.','学用品を必要としている子供たちは世界中にいます。'],
    ['The randoseru which you donated will help a child abroad.','あなたが寄付したランドセルは、海外の子供の役に立ちます。'],
    ['The man who lives next door is a doctor.','となりに住んでいる男の人は医者です。'],
    ['The book that I read yesterday was interesting.','私が昨日読んだ本はおもしろかった。'],
    ['People who help others are cool.','人を助ける人はかっこいい。']
  ],
  qs:[
    {q:'The girl who is talking with Ken ___ my sister.',jp:'ケンと話している女の子は私の姉です。',a:'is',choices:['is','are','am'],exp:E('［The girl who is talking with Ken］＋ is','The girl who is talking with Ken is my sister.','','主語の中心は the girl（1人）→ is'),xp:3},
    {q:'The man who lives next door ___ a doctor.',jp:'となりに住んでいる男の人は医者です。',a:'is',choices:['is','lives','are'],exp:E('カッコのあとに本当の動詞','The man who lives next door is a doctor.','The man who lives next door lives a doctor.','lives はカッコの中。カッコの外に is が必要'),xp:3},
    {q:'The boys who are playing soccer ___ my friends.',jp:'サッカーをしている男の子たちは私の友達です。',a:'are',choices:['are','is','am'],exp:E('the boys（複数）→ are','The boys who are playing soccer are my friends.','The boys who are playing soccer is my friends.','カッコの前の名詞に合わせる'),xp:3},
    {q:'Children who ___ school supplies live all over the world.',jp:'学用品を必要としている子供たちは世界中にいます。',a:'need',choices:['need','needs','needing'],exp:E('children（複数）→ need','Children who need school supplies live all over the world.','Children who needs school supplies live all over the world.','children は child の複数形'),xp:4},
    {q:'The book that I read yesterday ___ interesting.',jp:'私が昨日読んだ本はおもしろかった。',a:'was',choices:['was','were','did'],exp:E('［The book that I read yesterday］＋ was','The book that I read yesterday was interesting.','','the book（1冊）・昨日 → was'),xp:4},
    {q:'The comedian who made us laugh is Kyon.',jp:'この文の「本当の動詞」はどれ？',a:'is',choices:['is','made','laugh'],exp:E('who のかたまりをカッコでくくる','［The comedian who made us laugh］is Kyon.','made はカッコの中の動詞','本当の動詞はカッコの外'),xp:4},
    {q:'The randoseru which you donated ___ a child abroad.',jp:'あなたが寄付したランドセルは、海外の子供の役に立ちます。',a:'will help',choices:['will help','will helps','helping'],exp:E('［The randoseru which you donated］＋ will help','The randoseru which you donated will help a child abroad.','The randoseru which you donated will helps a child abroad.','will のうしろは原形'),xp:4},
    {q:'People who help others ___ cool.',jp:'人を助ける人はかっこいい。',a:'are',choices:['are','is','am'],exp:E('people（複数）→ are','People who help others are cool.','People who help others is cool.',''),xp:4}
  ],
  qb:[
    {jp:'となりに住んでいる男の人は医者です。',a:'The man who lives next door is a doctor.',exp:E('［The man who lives next door］＋ is a doctor','The man who lives next door is a doctor.','The man who lives next door a doctor.','カッコの外の is を忘れずに'),xp:7},
    {jp:'私が昨日読んだ本はおもしろかった。（that を使って）',a:'The book that I read yesterday was interesting.',exp:E('［The book that I read yesterday］＋ was interesting','The book that I read yesterday was interesting.','','read（読んだ）は過去形でも read（発音はレッド）'),xp:7}
  ],
  qc:[
    {jp:'ケンと話している女の子は私の姉です。',words:['The girl','who','is talking with Ken','is','my sister'],a:'The girl who is talking with Ken is my sister.',exp:E('［The girl who is talking with Ken］＋ is ＋ my sister','The girl who is talking with Ken is my sister.','','is が2回出てくるのが正解'),xp:7},
    {jp:'私たちを笑わせた芸人はきょんです。',words:['The comedian','who','made us laugh','is','Kyon'],a:'The comedian who made us laugh is Kyon.',exp:E('［The comedian who made us laugh］＋ is Kyon','The comedian who made us laugh is Kyon.','','make ＋ 人 ＋ 原形 ＝ 人に〜させる'),xp:7}
  ]
};

U6[5]={type:'test',
  title:'Unit6 確認テスト',
  sub:'I wish・If I were・If＋過去形・長い主語のまとめ。迷ったら「それ、本当に起こりそう？」と「マフラーを外す」。',
  talk:[
    {who:'iwakura',text:'きょん、最後だよ。「現実から遠いなら過去形」「主語のマフラーは外す」。この2つだけ持っていって。'},
    {who:'kyon',text:'イワクラちゃん、ありがと！もし俺が天才だったら全問正解するのに…いや、するんだよ！'}
  ],
  qs:[
    {q:'I wish I ___ fly.',jp:'空を飛べたらいいのに。',a:'could',choices:['could','can','will'],exp:E('I wish ＋ 過去形（can → could）','I wish I could fly.','I wish I can fly.',''),xp:3},
    {q:'I wish I ___ a dog.',jp:'イヌを飼っていたらいいのに。',a:'had',choices:['had','have','has'],exp:E('have → had','I wish I had a dog.','',''),xp:3},
    {q:'I wish I ___ a bird.',jp:'私が鳥だったらいいのに。',a:'were',choices:['were','am','be'],exp:E('be動詞 → were','I wish I were a bird.','I wish I am a bird.',''),xp:3},
    {q:'I wish my brother ___ here.',jp:'兄がここにいたらいいのに。',a:'were',choices:['were','is','be'],exp:E('だれが主語でも were','I wish my brother were here.','',''),xp:3},
    {q:'If I ___ a bird, I could fly to you.',jp:'もし私が鳥なら、あなたのところへ飛んでいけるのに。',a:'were',choices:['were','am','be'],exp:E('入り口は were','If I were a bird, I could fly to you.','',''),xp:3},
    {q:'If I were you, I ___ ask the teacher.',jp:'もし私があなたなら、先生にたずねるよ。',a:'would',choices:['would','will','am'],exp:E('中身は would ＋ 原形','If I were you, I would ask the teacher.','If I were you, I will ask the teacher.',''),xp:3},
    {q:'If he were here, he would ___ us.',jp:'もし彼がここにいれば、私たちを手伝ってくれるのに。',a:'help',choices:['help','helped','helps'],exp:E('would のうしろは原形','If he were here, he would help us.','',''),xp:3},
    {q:'If I ___ a lot of money, I would build a school.',jp:'もしたくさんのお金があれば、学校を建てるのに。',a:'had',choices:['had','have','has'],exp:E('現実とちがう → 過去形','If I had a lot of money, I would build a school.','',''),xp:3},
    {q:'If I knew her phone number, I ___ call her.',jp:'もし彼女の電話番号を知っていれば、電話できるのに。',a:'could',choices:['could','can','will'],exp:E('前半が過去形 → could ＋ 原形','If I knew her phone number, I could call her.','',''),xp:3},
    {q:'If it ___ tomorrow, I will stay home.',jp:'もし明日雨が降れば、私は家にいます。',a:'rains',choices:['rains','rained','would rain'],exp:E('起こりうる → ふつうの if（現在形）','If it rains tomorrow, I will stay home.','',''),xp:4},
    {q:'If you ___ free tomorrow, let’s play tennis.',jp:'もし明日ひまなら、テニスをしよう。',a:'are',choices:['are','were','would be'],exp:E('起こりうる → ふつうの if','If you are free tomorrow, let’s play tennis.','',''),xp:4},
    {q:'「I wish I could fly.」の意味は？',jp:'I wish I could fly. の意味',a:'空を飛べたらいいのに（実際は飛べない）',choices:['空を飛べたらいいのに（実際は飛べない）','空を飛べた（昔の話）','空を飛べるだろう'],exp:E('過去形でも「今」の願い','空を飛べたらいいのに','',''),xp:4},
    {q:'現実とちがう「もしも」の文（仮定法）はどれ？',jp:'仮定法の文はどれ？',a:'If I had wings, I would fly.',choices:['If I had wings, I would fly.','If it is sunny, I will go out.','If you are hungry, eat this.'],exp:E('過去形 ＋ would ＝ 仮定法','If I had wings, I would fly.','',''),xp:4},
    {q:'The girl who is talking with Ken ___ my sister.',jp:'ケンと話している女の子は私の姉です。',a:'is',choices:['is','are','am'],exp:E('マフラーを外すと The girl is ～','The girl who is talking with Ken is my sister.','',''),xp:3},
    {q:'The boys who are playing soccer ___ my friends.',jp:'サッカーをしている男の子たちは私の友達です。',a:'are',choices:['are','is','am'],exp:E('the boys（複数）→ are','The boys who are playing soccer are my friends.','',''),xp:4},
    {q:'Children who ___ school supplies live all over the world.',jp:'学用品を必要としている子供たちは世界中にいます。',a:'need',choices:['need','needs','needing'],exp:E('children（複数）→ need','Children who need school supplies live all over the world.','',''),xp:4},
    {q:'The book that I read yesterday ___ interesting.',jp:'私が昨日読んだ本はおもしろかった。',a:'was',choices:['was','were','did'],exp:E('the book（1冊）・昨日 → was','The book that I read yesterday was interesting.','',''),xp:4},
    {q:'The man who lives next door is a doctor.',jp:'この文の「本当の動詞」はどれ？',a:'is',choices:['is','lives','next'],exp:E('who のかたまりをカッコでくくる','［The man who lives next door］is a doctor.','lives はカッコの中',''),xp:4},
    {q:'If I ___ near the sea, I would swim every day.',jp:'もし海の近くに住んでいれば、毎日泳ぐのに。',a:'lived',choices:['lived','live','living'],exp:E('現実とちがう → 過去形','If I lived near the sea, I would swim every day.','',''),xp:3},
    {q:'If I were rich, I would ___ a lot of money.',jp:'もし私がお金持ちなら、たくさんのお金を寄付するのに。',a:'donate',choices:['donate','donated','donating'],exp:E('would のうしろは原形','If I were rich, I would donate a lot of money.','',''),xp:3}
  ]
};

var UNIT_DATA={4:U4,5:U5,6:U6};

// ===== INIT =====
updateXP();renderWeakBar();
(function(){
  var params=new URLSearchParams(location.search);
  var reqUnit=parseInt(params.get('unit'),10);
  var validIds=UNITS.map(function(u){return u.id;});
  currentUnit=validIds.indexOf(reqUnit)!==-1?reqUnit:4;
  currentSection=0;
  renderUnitTabs();renderSectionTabs();renderSection(currentUnit,0);
})();
