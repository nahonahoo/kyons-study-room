// ===== 英語 受け身 総復習（何回でもやり直せる）=====
// 中3 Unit1 の受け身を、過去分詞づくり → be動詞えらび → 書きかえ → 疑問・否定 → よく出る形 の順に積み直すページ。
// XP・弱点DB・採点キャッシュは英語共通の nh3_xp / nh3_weakdb / nh3_answered / nh3_grades を使う。
// qid は pv_s{セクション}_q{番号}（例 pv_s1_q0）。セクション完了は nh3_pv_secdone。
// 「最初からやり直す」ボタンは pv_ の解答済み・採点キャッシュ・セクション完了だけを消す（XPと弱点の記録は残す）。

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

var PRE = 'pv';
var SEC_KEY = 'nh3_pv_secdone';
var TEST_SID = 6, TOKKU_SID = 7;

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
  correct:['きょん「合ってる合ってる！すごくない！？」','きょん「やった！正解！天才かも！」','きょん「にっくん見て！俺より賢いかも！」','きょん「合ってる！もう受け身マスターじゃない！？」'],
  correct_nishi:['西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「正解。次も頼む」','西村「合ってる。広島でも東京でも通用するよ」'],
  wrong:['きょん「あれ！間違えた！でも次は大丈夫！！」','きょん「また間違えた…！まだまだ大丈夫！！」','きょん「何回間違えてんの！！にっくんに怒られる！！」','きょん「もうやだ！！でも諦めないぞ！！答えを見ちゃおうかな…」']
};
function getComment(t){var a=ARTISTS[t];return a[Math.floor(Math.random()*a.length)];}

// ===== WEAK DB =====
function isPv(qid){return qid.indexOf(PRE+'_')===0;}
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
// このページでは受け身（pv_）の弱点だけを見せる
function getWeakQuestions(){return Object.keys(weakDB).filter(function(q){var d=weakDB[q];return isPv(q)&&d.total>0&&getPct(q)<80;}).sort(function(a,b){return getPct(a)-getPct(b);});}
function renderWeakBar() {
  var wqs=getWeakQuestions(),el=document.getElementById('weakItems');if(!el)return;
  if(wqs.length===0){el.innerHTML='<span class="weak-bar-empty">受け身の弱点なし！</span>';return;}
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
// 1文字だけのちがい（抜け・余分・入れ替え）かどうか。書き間違いが多い生徒なので、つづりの小さなミスは「おしい」にする
function oneOff(x,y){
  if(x===y)return false;
  if(Math.abs(x.length-y.length)>1||Math.min(x.length,y.length)<3)return false;
  if(x.length===y.length){
    var diff=[];for(var i=0;i<x.length;i++)if(x[i]!==y[i])diff.push(i);
    if(diff.length===1)return true;
    return diff.length===2&&diff[1]===diff[0]+1&&x[diff[0]]===y[diff[1]]&&x[diff[1]]===y[diff[0]];
  }
  var s=x.length<y.length?x:y,l=x.length<y.length?y:x;
  for(var j=0;j<l.length;j++){if(l.slice(0,j)+l.slice(j+1)===s)return true;}
  return false;
}
// wasn't と was not のどちらで書いても同じに採点する
function expandNeg(s){return s.replace(/\b(is|are|was|were)n't\b/g,'$1 not');}
function localSmartGrade(val,answer){
  var v=expandNeg(unifyQuote(val).trim().toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' '));
  var a=expandNeg(unifyQuote(answer).trim().toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' '));
  if(v===a)return{grade:'◎',xpRate:1.0,comment:'完璧！そのまま覚えよう！'};
  var vW=v.split(' '),aW=a.split(' ');
  var typo=false;
  var matched=aW.filter(function(w){
    if(vW.indexOf(w)!==-1)return true;
    if(vW.some(function(x){return oneOff(x,w);})){typo=true;return true;}
    return false;
  });
  var rate=matched.length/aW.length;
  // 受け身の大事な語：be動詞・助動詞と、by のうしろの代名詞（by they ✕ → by them）
  var gWords=['am','is','are','was','were','be','do','does','did','not','can','will','must','me','us','him','her','them'];
  var aG=aW.filter(function(w){return gWords.indexOf(w)!==-1;});
  var vG=aG.filter(function(w){return vW.indexOf(w)!==-1;});
  var gramOk=aG.length===0||vG.length===aG.length;
  var orderOk=true;
  var key=aW.slice(0,3);var last=-1;
  key.forEach(function(w){var idx=vW.indexOf(w);if(idx===-1){vW.forEach(function(x,k){if(idx===-1&&oneOff(x,w))idx=k;});}if(idx===-1||idx<last)orderOk=false;else last=idx;});
  if(rate>=0.9&&gramOk&&orderOk&&typo)return{grade:'○',xpRate:0.6,comment:'おしい！形は合ってる。つづりが1文字ちがう語があるよ。下の正しい答えと見くらべよう。'};
  if(rate>=0.9&&gramOk&&orderOk)return{grade:'◎',xpRate:1.0,comment:'ほぼ完璧！文法もバッチリ！'};
  if(rate>=0.75&&gramOk&&orderOk)return{grade:'○',xpRate:0.6,comment:'惜しい！文法はOK、単語が少し違う。'};
  if(gramOk&&rate>=0.5)return{grade:'△',xpRate:0.2,comment:'be動詞は合ってるけど単語が足りない。正解文をよく見よう。'};
  if(!gramOk&&rate>=0.6)return{grade:'△',xpRate:0.2,comment:'大事な語がちがう。be動詞（is / are / was / were）か、by のうしろの形（him / her / them）を正しい答えと見くらべよう！'};
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
  return '<input class="q-input" id="qi_'+qid+'" data-qid="'+qid+'" placeholder="英語を入力…（採点あり）" autocapitalize="off" autocomplete="off" spellcheck="false">'
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
    if(!val.trim()){showToast('英語を入力してください！');return;}
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
  var pre=PRE+'_s'+currentSection+'_';
  var secQ=Object.keys(qMeta).filter(function(id){return id.indexOf(pre)===0;});
  if(secQ.length>0&&secQ.every(function(id){return answeredSet[id];})){
    var key=PRE+'_'+currentSection;
    if(!sectionDone[key]){
      sectionDone[key]=true;
      localStorage.setItem(SEC_KEY,JSON.stringify(sectionDone));
      renderSectionTabs();
    }
    var nb=document.getElementById('nextBtn');if(nb)nb.style.display='block';
  }
}

// ===== やり直し =====
// 受け身（pv_）の「解いた」印と採点キャッシュ、セクション完了だけを消す。XP・弱点DBはそのまま
function countPv(){
  var all=allQids(),done=all.filter(function(id){return answeredSet[id];});
  return {done:done.length,total:all.length};
}
function allQids(){
  var ids=[];
  SECTIONS.forEach(function(s){
    var d=DATA[s.id];if(!d)return;
    ['qs','qb','qc'].forEach(function(k,ki){
      (d[k]||[]).forEach(function(q,i){ids.push(PRE+'_s'+s.id+'_'+['q','qb','qc'][ki]+i);});
    });
  });
  return ids;
}
function resetPv(){
  if(!confirm('受け身の〇×を全部消して、最初からやり直します。\n（XP と 弱点の記録はそのまま残ります。もう一度正解すると、またXPがもらえます）\nやり直しますか？'))return;
  Object.keys(answeredSet).forEach(function(k){if(isPv(k))delete answeredSet[k];});
  Object.keys(gradeCache).forEach(function(k){if(isPv(k))delete gradeCache[k];});
  sectionDone={};
  attemptCounts={};
  localStorage.setItem('nh3_answered',JSON.stringify(answeredSet));
  localStorage.setItem('nh3_grades',JSON.stringify(gradeCache));
  localStorage.setItem(SEC_KEY,JSON.stringify(sectionDone));
  goSection(0);
  showToast('きょん「よし、まっさらになった！もう一回いくぞ！」');
}
function redoBox(){
  var c=countPv();
  return '<div class="redo-box">📊 いま解いた問題：<strong style="color:var(--gold)">'+c.done+' / '+c.total+'問</strong><br>'
    +'前に解いた問題も、ボタンを押せば全部まっさらに戻せます（XPと弱点の記録は消えません）。<br>'
    +'<button class="redo-btn" data-act="reset">🔄 受け身を最初からやり直す</button></div>';
}

// ===== SECTIONS =====
var currentSection=0;
var SECTIONS=[
  {id:0,label:'導入'},
  {id:1,label:'過去分詞'},
  {id:2,label:'be動詞えらび'},
  {id:3,label:'書きかえ'},
  {id:4,label:'疑問・否定'},
  {id:5,label:'よく出る形'},
  {id:6,label:'確認テスト'},
  {id:7,label:'🔥特訓'}
];

function renderSectionTabs(){
  var wk=getWeakQuestions();
  var html='';
  SECTIONS.forEach(function(s){
    var key=PRE+'_'+s.id;
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
function goSection(sid){currentSection=sid;qMeta={};renderSectionTabs();renderSection(sid);window.scrollTo(0,0);}

// タブ・音声・ボタンはすべて data-* 属性＋イベント委任で動かす（onclick 内の引用符で壊れないように）
document.addEventListener('click',function(e){
  var t=e.target.closest?e.target.closest('[data-sec],[data-audio],[data-act]'):null;
  if(!t)return;
  if(t.hasAttribute('data-sec')){goSection(parseInt(t.getAttribute('data-sec'),10));return;}
  if(t.hasAttribute('data-audio')){playAudio(t.getAttribute('data-audio'));return;}
  var act=t.getAttribute('data-act');
  if(act==='tokku-next'){nextTokkuCard();}
  else if(act==='tokku-again'){renderTokkuMode();}
  else if(act==='reset'){resetPv();}
});

// ===== RENDER =====
function renderSection(sid){
  if(sid===TOKKU_SID){renderTokkuMode();return;}
  var html='<div class="progress-dots">';
  SECTIONS.forEach(function(s){
    if(s.id===TOKKU_SID)return;
    var cls='dot';
    if(s.id<sid)cls+=' done';
    if(s.id===sid)cls+=' current';
    html+='<div class="'+cls+'"></div>';
  });
  html+='</div>';
  html+='<div class="section-badge">受け身 総復習 · SECTION '+sid+'</div>';

  var d=DATA[sid];
  if(d.type==='intro')html+=renderIntroSection(sid,d);
  else if(d.type==='grammar')html+=renderGrammarSection(sid,d);
  else if(d.type==='test')html+=renderTestSection(sid,d);

  var isLast=(sid===TEST_SID);
  var label=isLast?'🔥 特訓で弱点をつぶす →':'次のセクションへ →';
  html+='<button class="next-section-btn" id="nextBtn" data-sec="'+(sid+1)+'">'+label+'</button>';

  document.getElementById('mainContent').innerHTML=html;

  document.querySelectorAll('.check-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){handleCheck(btn.dataset.qid);});});
  document.querySelectorAll('.q-input[data-qid]').forEach(function(inp){inp.addEventListener('keydown',function(e){if(e.key==='Enter')handleCheck(inp.dataset.qid);});});
  document.querySelectorAll('.choice-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){handleChoice(btn.dataset.qid,btn.dataset.choice);});});
  document.querySelectorAll('.show-answer-btn[data-qid]').forEach(function(btn){btn.addEventListener('click',function(){showAnswer(btn.dataset.qid);});});

  if(sectionDone[PRE+'_'+sid]){var nb=document.getElementById('nextBtn');if(nb)nb.style.display='block';}
  checkSectionComplete();
}

function qCard(qid,content){return '<div class="q-card" data-card="'+qid+'">'+content+'</div>';}
function qNum(n,total){return '<div class="q-number">Q'+n+(total?' / '+total:'')+'</div>';}
function blankify(q){return q.replace('___','<span class="blank">＿＿＿</span>');}

// 例文リスト（🔊つき）。tag で同じセクション内の別リストと id を分ける
function exList(sid,arr,tag){
  return '<ul class="example-list">'+arr.map(function(e,i){
    var aid=PRE+'_s'+sid+'_'+(tag||'ex')+'_'+i;
    return '<li class="example-item">'+audioBtn(aid,e[0])+'<span class="en">'+e[0]+'</span><span class="jp">'+e[1]+'</span></li>';
  }).join('')+'</ul>';
}

// 会話。きょん・西村に、ヒント係のなかむらしゅん
var CAST={
  kyon:   {name:'きょん',                      av:'😄', cls:'av-kyon',  style:''},
  nishi:  {name:'西村（慶應卒・元アナ）',      av:'慶', cls:'av-nishi', style:''},
  shun:   {name:'なかむらしゅん（9番街レトロ）', av:'🎭', cls:'',        style:'background:#2d6a4f;'}
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

// 強調用：H＝be動詞＋過去分詞（金）／H2＝主役（青）／H3＝by＋人（ピンク）
function H(s){return '<span class="hl">'+s+'</span>';}
function H2(s){return '<span class="hl2">'+s+'</span>';}
function H3(s){return '<span class="hl3">'+s+'</span>';}
function X(s){return '<span class="strike">'+s+'</span>';}

// 変身図（上の形 → 下の形）
function changeCard(title,rows){
  return '<div class="grammar-card"><div class="grammar-card-title">'+title+'</div>'+rows.map(function(r){
    return '<div class="change-row"><div class="change-from">'+r[0]+'</div><div class="change-arrow">⬇</div><div class="change-to">'+r[1]+'</div>'+(r[2]?'<div class="change-note">'+r[2]+'</div>':'')+'</div>';
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

function choiceBlock(sid,qs,startNum,total){
  var html='';
  qs.forEach(function(q,i){
    var qid=PRE+'_s'+sid+'_q'+i;
    html+=qCard(qid,qNum(startNum+i,total)+'<div class="q-text">'+blankify(q.q)+'</div><div class="q-jp">'+q.jp+'</div>'+makeChoices(qid,q.choices,q.a,q.xp,q.jp,q.exp,q.q)+makeFeedback(qid,q.exp));
  });
  return html;
}
function compBlock(sid,qs,startNum,title){
  var html='<div class="practice-title" style="margin-top:20px">'+(title||'✏️ 英作文（上の例文とほぼ同じでOK！）')+'</div>';
  qs.forEach(function(q,i){
    var qid=PRE+'_s'+sid+'_qb'+i;
    html+=qCard(qid,qNum(startNum+i)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
  });
  return html;
}
function rearrangeBlock(sid,qs,startNum){
  var html='<div class="practice-title" style="margin-top:20px">🔀 語句を並べ替えて英文を完成させよう（打ちこんで答える）</div>';
  qs.forEach(function(q,i){
    var qid=PRE+'_s'+sid+'_qc'+i;
    html+=qCard(qid,qNum(startNum+i)+'<div class="q-jp">🇯🇵 '+q.jp+'</div>'+wordBank(q.words)+makeCompositionInput(qid,q.a,q.xp,q.jp,q.exp)+makeFeedback(qid,q.exp));
  });
  return html;
}

function renderIntroSection(sid,d){
  var html='<div class="section-title">'+d.title+'</div><div class="section-sub">'+d.sub+'</div>';
  html+=redoBox();
  html+=dialog(d.talk);
  html+='<div class="grammar-card"><div class="grammar-card-title">📐 受け身の形は、これ1つだけ</div><div class="formula-box">'+d.formula+'</div>';
  html+='<div class="grammar-rule"><div class="rule-title">'+d.ruleTitle+'</div>'+d.rules.map(function(r){return '<div class="en">'+r+'</div>';}).join('')+'</div></div>';
  if(d.visual)html+=d.visual;
  html+='<div class="practice-title" style="margin-top:18px">🔊 例文（音で覚えよう）</div>'+exList(sid,d.ex,'ex');
  html+='<div class="practice-section"><div class="practice-title">✏️ まずは見分けるだけ（かんたん'+d.qs.length+'問）</div>';
  html+=choiceBlock(sid,d.qs,1);
  html+='</div>';
  return html;
}

function renderGrammarSection(sid,d){
  var html='<div class="section-title">'+d.title+'</div><div class="section-sub">'+d.sub+'</div>';
  if(d.talk)html+=dialog(d.talk);
  html+='<div class="grammar-card"><div class="grammar-card-title">📐 基本の型</div><div class="formula-box">'+d.formula+'</div>';
  html+='<div class="grammar-rule"><div class="rule-title">'+d.ruleTitle+'</div>'+d.rules.map(function(r){return '<div class="en">'+r+'</div>';}).join('')+'</div></div>';
  if(d.visual)html+=d.visual;
  if(d.more)d.more.forEach(function(m,mi){
    html+='<div class="grammar-card" style="margin-top:18px"><div class="grammar-card-title">'+m.title+'</div>'+(m.note?'<div class="grammar-rule">'+m.note+'</div>':'')+exList(sid,m.ex,'more'+mi)+'</div>';
  });
  if(d.ex)html+='<div class="practice-title" style="margin-top:18px">🔊 例文（音で覚えよう）</div>'+exList(sid,d.ex,'ex');
  html+='<div class="practice-section"><div class="practice-title">✏️ 練習問題（えらぶ）</div>';
  html+=choiceBlock(sid,d.qs,1);
  var n=d.qs.length+1;
  if(d.qb){html+=compBlock(sid,d.qb,n,d.qbTitle);n+=d.qb.length;}
  if(d.qc)html+=rearrangeBlock(sid,d.qc,n);
  html+='</div>';
  return html;
}

function renderTestSection(sid,d){
  var html='<div class="section-title">'+d.title+'</div><div class="section-sub">'+d.sub+'</div>';
  if(d.talk)html+=dialog(d.talk);
  html+='<div class="practice-section"><div class="practice-title">📝 確認テスト（全'+d.qs.length+'問）</div>';
  html+=choiceBlock(sid,d.qs,1,d.qs.length);
  html+='</div>';
  html+=redoBox();
  return html;
}

// ===== 特訓モード =====
var tokkuQueue=[],tokkuIndex=0,tokkuSession={correct:0,total:0};

function renderTokkuMode(){
  currentSection=TOKKU_SID;
  renderSectionTabs();
  var wqs=getWeakQuestions();
  var mc=document.getElementById('mainContent');
  if(wqs.length===0){
    mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">受け身の弱点ゼロ！</div><div style="font-size:15px;color:#8b949e;margin-top:12px;line-height:2">きょん「俺、完璧じゃん！！」<br>西村「よくやった。まだ解いていないセクションがあれば進もう」</div><button data-sec="0" style="margin-top:24px;background:var(--gold);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">セクションに戻る</button></div>';
    return;
  }
  tokkuQueue=wqs.slice(0,15);tokkuIndex=0;tokkuSession={correct:0,total:0};
  renderTokkuCard();
}

function renderTokkuCard(){
  var mc=document.getElementById('mainContent');
  if(tokkuIndex>=tokkuQueue.length){showTokkuComplete();return;}
  var qid=tokkuQueue[tokkuIndex];
  var d=weakDB[qid];if(!d){tokkuIndex++;renderTokkuCard();return;}
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
    choices.forEach(function(c){var btn=document.createElement('button');btn.className='choice-btn';btn.textContent=c;btn.style.fontSize='16px';btn.style.padding='12px 24px';btn.addEventListener('click',function(){checkTokkuAnswer(qid,c);});cel.appendChild(btn);});
  }
  var inp=document.getElementById('tokku_input');if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')checkTokkuInput(qid);});
  var sub=document.getElementById('tokku_submit');if(sub)sub.addEventListener('click',function(){checkTokkuInput(qid);});
}

function checkTokkuAnswer(qid,choice){
  var d=weakDB[qid];if(!d)return;
  document.querySelectorAll('.tokku-card .choice-btn').forEach(function(b){b.disabled=true;if(b.textContent===d.answer)b.classList.add('selected-correct');else if(b.textContent===choice&&choice!==d.answer)b.classList.add('selected-wrong');});
  showTokkuResult(qid,d,choice===d.answer);
}
function checkTokkuInput(qid){
  var d=weakDB[qid],inp=document.getElementById('tokku_input');if(!inp||!d||inp.disabled)return;
  var val=inp.value;if(!val.trim()){showToast('英語を入力してください！');return;}
  inp.disabled=true;var sub=document.getElementById('tokku_submit');if(sub)sub.style.display='none';
  showTokkuResult(qid,d,localSmartGrade(val,d.answer).xpRate>=0.6);
}
function showTokkuResult(qid,d,correct){
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
function nextTokkuCard(){tokkuIndex++;renderTokkuCard();}
function showTokkuComplete(){
  var mc=document.getElementById('mainContent');
  var pctAll=tokkuSession.total>0?Math.round(tokkuSession.correct/tokkuSession.total*100):0;
  var emoji=pctAll>=80?'🏆':pctAll>=60?'😎':'💪';
  var msg=pctAll>=80?'きょん「全部わかった！！昇格の予感！！」<br>西村「よくやった。次回も頼む」':pctAll>=50?'きょん「半分以上できた！もう一回やる！」<br>西村「続けること。それが大事」':'きょん「難しかった…でも諦めない！！」<br>西村「何度でもやればいい。繰り返すことが力になる」';
  mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">'+emoji+'</div><div class="tokku-complete-title">特訓終了！</div><div style="font-size:36px;color:var(--gold);font-weight:bold;margin:8px 0">'+pctAll+'%</div><div style="font-size:15px;color:#8b949e">'+tokkuSession.correct+' / '+tokkuSession.total+'問正解</div><div style="font-size:15px;color:#8b949e;margin-top:16px;line-height:2">'+msg+'</div><div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button data-act="tokku-again" style="background:var(--red);color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer;">🔥 もう一回特訓！</button><button data-sec="0" style="background:var(--bg3);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:10px;font-size:15px;font-family:inherit;cursor:pointer;">セクションに戻る</button></div></div>';
  renderWeakBar();
}

// ============================
// 問題データ
// ============================
var DATA={};

// ----- S0 導入：受け身＝主役交代 -----
DATA[0]={type:'intro',
  title:'受け身 総復習：受け身は「主役交代」',
  sub:'「〜される」「〜された」を英語で言う形。まずは仕組みを1つだけ覚えよう。',
  talk:[
    {who:'kyon',text:'にっくん、受け身って前にやったんだけど…正直ふわっとしか覚えてないんだよね。'},
    {who:'nishi',text:'大丈夫。今日は最初から積み直そう。受け身はひとことで言うと「主役交代」だ。'},
    {who:'kyon',text:'主役交代？舞台の？'},
    {who:'nishi',text:'そう。「きょんが台本を書く」なら主役はきょん。でも「台本がきょんによって書かれる」と言うと、主役が台本に変わる。'},
    {who:'shun',text:'きょんさん、台本からしたら「僕、きょんさんに書かれたんですわ〜」って自己紹介してる文なんです。される側が主役になる、これが受け身です！'},
    {who:'kyon',text:'台本がしゃべってる…！ちょっと覚えやすいかも。'},
    {who:'nishi',text:'形は1つだけ。【be動詞＋過去分詞】。ここだけは絶対に崩さない。'}
  ],
  formula:H2('主役')+' ＋ '+H('be動詞 ＋ 過去分詞')+' ＋（'+H3('by ＋ 元の主役')+'）<br><small style="color:var(--text2)">例：'+H2('The script')+' '+H('is written')+' '+H3('by Kyon')+'.（台本はきょんによって書かれる。）</small>',
  ruleTitle:'受け身の3つのパーツ',
  rules:[
    '① be動詞（am / is / are / was / were）を絶対に忘れない',
    '② 動詞は「過去分詞」（過去形ではない！ wrote ではなく written）',
    '③「〜によって」は by。だれがしたか言わなくていいときは省略OK',
    '🇯🇵 日本語の合図：「〜される」「〜された」「〜されている」「〜られる」が出たら受け身'
  ],
  visual:changeCard('🔄 主役交代の変身図',[
    ['Kyon writes the script.（きょんが台本を書く）',H2('The script')+' '+H('is written')+' '+H3('by Kyon')+'.','主役が「台本」に交代 → 台本はきょんによって書かれる'],
    ['Everyone loves this song.（みんながこの歌を愛している）',H2('This song')+' '+H('is loved')+' '+H3('by everyone')+'.','主役が「この歌」に交代 → この歌はみんなに愛されている']
  ])+compareCard('⚠️ 似ている形に注意（be動詞のうしろを見る）',['形','意味','例'],[
    ['be動詞 ＋ 〜ing','〜している（進行形）','Kyon '+H('is writing')+'.<br>きょんは書いている'],
    ['be動詞 ＋ 過去分詞','〜される（受け身）','The script '+H('is written')+'.<br>台本は書かれる']
  ]),
  ex:[
    ['This song is loved by everyone.','この歌はみんなに愛されています。'],
    ['English is spoken in Canada.','英語はカナダで話されています。'],
    ['The script was written by Kyon.','その台本はきょんによって書かれました。'],
    ['This picture was painted by Picasso.','この絵はピカソによって描かれました。']
  ],
  qs:[
    {q:'受け身の文はどれ？',jp:'「この歌はみんなに愛されている」',a:'This song is loved by everyone.',choices:['This song is loved by everyone.','This song loves everyone.','This song is loving everyone.'],exp:E('受け身 ＝ be動詞 ＋ 過去分詞','This song is loved by everyone.','This song is loving everyone.（is ＋ 〜ing は「〜している」）','「愛されている」の「される」が受け身の合図'),xp:2},
    {q:'受け身の文はどれ？',jp:'「英語はカナダで話されている」',a:'English is spoken in Canada.',choices:['English is spoken in Canada.','They speak English in Canada.','She is speaking English.'],exp:E('主役が English（話される側）→ is spoken','English is spoken in Canada.','They speak English in Canada.（意味は近いけど、主役が「人」なので受け身ではない）','受け身は「される側」が主役'),xp:2},
    {q:'受け身の材料はどれ？',jp:'受け身（〜される）の形',a:'be動詞 ＋ 過去分詞',choices:['be動詞 ＋ 過去分詞','be動詞 ＋ 〜ing','have ＋ 過去分詞'],exp:E('受け身 ＝ be動詞 ＋ 過去分詞','The script is written.','be動詞 ＋ 〜ing は進行形、have ＋ 過去分詞 は現在完了','be動詞のうしろが過去分詞なら受け身'),xp:2},
    {q:'The window was broken by Ken.',jp:'この文の意味は？',a:'窓はケンによって割られた',choices:['窓はケンによって割られた','窓がケンを割った','ケンは窓を割っている'],exp:E('主役は The window（窓）。was broken ＝ 割られた','窓はケンによって割られた','窓がケンを割った（主役と「される側」が逆）','by Ken ＝ ケンによって'),xp:2},
    {q:'This picture was painted ___ Picasso.',jp:'この絵はピカソによって描かれた。',a:'by',choices:['by','to','of'],exp:E('「〜によって」＝ by','This picture was painted by Picasso.','This picture was painted to Picasso.','元の主役は by のうしろに回る'),xp:2},
    {q:'The script is written by Kyon.',jp:'この文の主役（主語）はどれ？',a:'The script（台本）',choices:['The script（台本）','Kyon（きょん）','written（書かれる）'],exp:E('主役（主語）は be動詞の前にある語','The script（台本）が主役。きょんは by のうしろに回った','Kyon（書いた人だけど、受け身では主役ではない）','受け身は「される側」が主役。主役交代！'),xp:2}
  ]
};

// ----- S1 過去分詞をそろえる -----
function groupCards(){
  var groups=[
    {title:'① 規則動詞：-ed をつけるだけ（過去形と同じ）',note:'e で終わる → d だけ（use → used）。子音字＋y → y を i にして ed（study → studied）',ex:[['use, used, used','使う'],['clean, cleaned, cleaned','そうじする'],['study, studied, studied','勉強する'],['visit, visited, visited','訪れる']]},
    {title:'② ABB型：過去形と過去分詞が同じ',note:'過去形を覚えていれば、そのまま使える。<strong>make は ed をつけない（maked ✕）</strong>',ex:[['make, made, made','作る'],['build, built, built','建てる'],['buy, bought, bought','買う'],['teach, taught, taught','教える'],['hold, held, held','開く・持つ'],['send, sent, sent','送る'],['sell, sold, sold','売る']]},
    {title:'③ ABC型：3つ全部ちがう（いちばん注意）',note:'受け身でよく出るのはこの型。<strong>最後が n で終わるものが多い</strong>（written / spoken / taken / given / eaten / seen / known / broken / done）。sung は例外',ex:[['write, wrote, written','書く'],['speak, spoke, spoken','話す'],['take, took, taken','とる'],['give, gave, given','あたえる'],['eat, ate, eaten','食べる'],['see, saw, seen','見る'],['know, knew, known','知る'],['break, broke, broken','こわす'],['do, did, done','する'],['sing, sang, sung','歌う']]},
    {title:'④ AAA型：3つ全部同じ',note:'つづりは同じ。read だけは音が変わる（リード → レッド → レッド）',ex:[['cut, cut, cut','切る'],['put, put, put','置く'],['read, read, read','読む']]}
  ];
  return groups.map(function(g,gi){
    return '<div class="grammar-card" style="margin-top:18px"><div class="grammar-card-title">'+g.title+'</div><div class="grammar-rule"><div class="en">'+g.note+'</div></div>'+exList(1,g.ex,'g'+gi)+'</div>';
  }).join('');
}
DATA[1]={type:'grammar',
  title:'① 材料あつめ：過去分詞をそろえる',
  sub:'受け身でいちばんつまずくのは「過去形と過去分詞のちがい」。4つの型に分けて、3拍子のリズムで覚えよう。',
  talk:[
    {who:'kyon',text:'過去分詞って…過去形とどう違うの？ wrote と written とか、もうごちゃごちゃ。'},
    {who:'nishi',text:'そこが受け身でいちばんつまずくところだ。動詞には「原形・過去形・過去分詞」の3つの顔がある。受け身で使うのは3番目の顔だけ。'},
    {who:'shun',text:'きょんさん、3つの顔は「リズム」で言うんがコツです。write, wrote, written！ タン・タン・タタン。3拍子で言うたら口が勝手に覚えますわ。'},
    {who:'kyon',text:'3拍子！ write, wrote, written！ それならいけるかも。'},
    {who:'nishi',text:'しかも変わり方は4つの型しかない。型ごとに🔊で聞いて、声に出してみよう。'}
  ],
  formula:'原形 → 過去形 → '+H('過去分詞')+'<br><small style="color:var(--text2)">受け身で使うのは「3番目」だけ！　write → wrote → '+H('written')+'</small>',
  ruleTitle:'4つの型',
  rules:[
    '① 規則動詞：-ed をつける（play → played → played）',
    '② ABB型：過去形と過去分詞が同じ（make → made → made）',
    '③ ABC型：3つ全部ちがう（write → wrote → written）',
    '④ AAA型：3つ全部同じ（cut → cut → cut）'
  ],
  visual:groupCards(),
  qs:[
    {q:'write（書く）→ wrote → ___',jp:'write の過去分詞は？',a:'written',choices:['written','wrote','writed'],exp:E('ABC型：write → wrote → written','This letter was written in English.','This letter was wrote in English.','wrote は過去形。受け身は3番目の written'),xp:2},
    {q:'speak（話す）→ spoke → ___',jp:'speak の過去分詞は？',a:'spoken',choices:['spoken','spoke','speaked'],exp:E('ABC型：speak → spoke → spoken','English is spoken here.','English is speaked here.','n で終わる仲間：written / spoken / taken'),xp:2},
    {q:'make（作る）→ made → ___',jp:'make の過去分詞は？',a:'made',choices:['made','maked','making'],exp:E('ABB型：make → made → made','This cake was made by my mother.','This cake was maked by my mother.','make は不規則動詞。ed はつけない'),xp:2},
    {q:'use（使う）→ used → ___',jp:'use の過去分詞は？',a:'used',choices:['used','useed','using'],exp:E('規則動詞：e で終わる → d だけ','This room is used every day.','This room is useed every day.','love → loved、like → liked も同じ'),xp:2},
    {q:'take（とる）→ took → ___',jp:'take の過去分詞は？',a:'taken',choices:['taken','took','taked'],exp:E('ABC型：take → took → taken','These photos were taken in Kyoto.','These photos were took in Kyoto.','took は過去形。受け身は taken'),xp:2},
    {q:'build（建てる）→ built → ___',jp:'build の過去分詞は？',a:'built',choices:['built','builded','building'],exp:E('ABB型：build → built → built','This temple was built 300 years ago.','This temple was builded 300 years ago.','過去形と同じ built'),xp:2},
    {q:'know（知る）→ knew → ___',jp:'know の過去分詞は？',a:'known',choices:['known','knew','knowed'],exp:E('ABC型：know → knew → known','This song is known all over Japan.','This song is knew all over Japan.','known も n で終わる仲間'),xp:3},
    {q:'sing（歌う）→ sang → ___',jp:'sing の過去分詞は？',a:'sung',choices:['sung','sang','singed'],exp:E('ABC型：sing → sang → sung','This song was sung by everyone.','This song was sang by everyone.','i → a → u と母音が変わる（sing, sang, sung）'),xp:3},
    {q:'see（見る）→ saw → ___',jp:'see の過去分詞は？',a:'seen',choices:['seen','saw','seed'],exp:E('ABC型：see → saw → seen','Stars can be seen from here.','Stars can be saw from here.','seen も n で終わる仲間'),xp:3},
    {q:'teach（教える）→ taught → ___',jp:'teach の過去分詞は？',a:'taught',choices:['taught','teached','teaching'],exp:E('ABB型：teach → taught → taught','English is taught by Ms. Sato.','English is teached by Ms. Sato.','teach は不規則動詞。ed はつけない'),xp:3},
    {q:'study（勉強する）→ studied → ___',jp:'study の過去分詞は？',a:'studied',choices:['studied','studyed','studying'],exp:E('規則動詞：子音字＋y → y を i にして ed','Japanese is studied by many people.','Japanese is studyed by many people.','try → tried、carry → carried も同じ'),xp:3}
  ],
  qbTitle:'⌨️ 過去分詞を打ってみよう（1語だけ）',
  qb:[
    {jp:'give（あたえる）の過去分詞は？',a:'given',exp:E('ABC型：give → gave → given','A prize was given to Kyon.','A prize was gave to Kyon.','n で終わる仲間'),xp:3},
    {jp:'break（こわす）の過去分詞は？',a:'broken',exp:E('ABC型：break → broke → broken','The window was broken.','The window was broke.','broke は過去形。受け身は broken'),xp:3},
    {jp:'eat（食べる）の過去分詞は？',a:'eaten',exp:E('ABC型：eat → ate → eaten','Rice is eaten every day in Japan.','Rice is ate every day in Japan.','eat に en をつけた形'),xp:3}
  ]
};

// ----- S2 be動詞えらび -----
DATA[2]={type:'grammar',
  title:'② be動詞えらび：「いつ？」×「いくつ？」',
  sub:'is / are / was / were のどれを使うかは、2つの質問だけで決まる。',
  talk:[
    {who:'kyon',text:'過去分詞はわかった！でも is なのか was なのか、そこで毎回まちがえるんだよね。'},
    {who:'nishi',text:'be動詞は2つの質問で決まる。「いつの話？（今か昔か）」と「主役は1つ？それとも2つ以上？」。'},
    {who:'shun',text:'きょんさん、下の表のマス目を見るだけです。ビンゴより簡単ですわ。たてが「主役」、よこが「いつ」。交わったところが答えです！'},
    {who:'kyon',text:'ビンゴ！ 主役とタイミングでマス目を見るだけね。'},
    {who:'nishi',text:'日本語の合図も使える。「〜された」なら昔、「〜される」「〜されている」なら今だ。'}
  ],
  formula:'「いつ？」×「主役はいくつ？」で be動詞が決まる<br><small style="color:var(--text2)">'+H2('This song')+'（1つ）・今 → '+H('is')+' loved ／ '+H2('These photos')+'（2つ以上）・昔 → '+H('were')+' taken</small>',
  ruleTitle:'合図を見つけよう',
  rules:[
    '⏪ 昔の合図：yesterday / last 〜 / 〜 ago / in 2010 ／ 日本語「〜された」',
    '⏺ 今の合図：every day / now / usually ／ 日本語「〜される」「〜されている」',
    '⚠️ 主役は「be動詞の前の語」。by のうしろの人数ではない！（This song is loved by many people. → this song が1つ → is）',
    '⚠️ 言語（English / Japanese）・お米（rice）・水（water）は1つあつかい → is / was'
  ],
  visual:compareCard('🎯 be動詞えらびの表',['主役（主語）','今（〜される）','昔（〜された）'],[
    ['I','am','was'],
    ['he / she / it<br>1つのもの（this book など）','is','was'],
    ['you / we / they<br>2つ以上（these books など）','are','were']
  ]),
  ex:[
    ['This song is loved by many people.','この歌は多くの人に愛されています。'],
    ['These photos were taken by my father.','これらの写真は父によって撮られました。'],
    ['I am called Kyon by my friends.','私は友達に「きょん」と呼ばれています。'],
    ['This temple was built 300 years ago.','この寺は300年前に建てられました。']
  ],
  qs:[
    {q:'This song ___ loved by many people.',jp:'この歌は多くの人に愛されています。',a:'is',choices:['is','are','was'],exp:E('this song（1つ）・今 → is','This song is loved by many people.','This song are loved by many people.','many people は by のうしろ。主役は this song'),xp:3},
    {q:'These photos ___ taken by my father.',jp:'これらの写真は父によって撮られました。',a:'were',choices:['was','were','are'],exp:E('these photos（2つ以上）・昔 → were','These photos were taken by my father.','These photos was taken by my father.','「撮られました」＝昔の合図'),xp:3},
    {q:'I ___ called "Kyon" by my friends.',jp:'私は友達に「きょん」と呼ばれています。',a:'am',choices:['am','is','are'],exp:E('I・今 → am','I am called Kyon by my friends.','I is called Kyon by my friends.','I のときは受け身でも am'),xp:3},
    {q:'English ___ spoken in Australia.',jp:'英語はオーストラリアで話されています。',a:'is',choices:['is','are','am'],exp:E('言語は1つあつかい・今 → is','English is spoken in Australia.','English are spoken in Australia.','Japanese / French なども is'),xp:3},
    {q:'This temple ___ built 300 years ago.',jp:'この寺は300年前に建てられました。',a:'was',choices:['is','was','were'],exp:E('this temple（1つ）・昔 → was','This temple was built 300 years ago.','This temple is built 300 years ago.','〜 ago は昔の合図'),xp:3},
    {q:'Mrs. GREEN APPLE’s songs ___ sung by many students.',jp:'ミセスの歌は多くの生徒に歌われています。',a:'are',choices:['is','are','were'],exp:E('主役は songs（歌たち＝2つ以上）・今 → are','Mrs. GREEN APPLE’s songs are sung by many students.','Mrs. GREEN APPLE’s songs is sung by many students.','’s songs の songs が主役。s がついて2つ以上'),xp:4},
    {q:'The windows ___ cleaned yesterday.',jp:'窓は昨日そうじされました。',a:'were',choices:['was','were','are'],exp:E('the windows（2つ以上）・昔 → were','The windows were cleaned yesterday.','The windows was cleaned yesterday.','yesterday は昔の合図。windows の s で2つ以上'),xp:4},
    {q:'Rice ___ eaten every day in Japan.',jp:'お米は日本で毎日食べられています。',a:'is',choices:['is','are','was'],exp:E('rice は1つあつかい・今 → is','Rice is eaten every day in Japan.','Rice are eaten every day in Japan.','every day は今の合図'),xp:4}
  ],
  qb:[
    {jp:'この部屋は毎日そうじされています。',a:'This room is cleaned every day.',exp:E('this room（1つ）・今 → is ＋ cleaned','This room is cleaned every day.','This room cleaned every day.（be動詞がない）','clean は規則動詞 → cleaned'),xp:6},
    {jp:'これらの手紙は昨日送られました。',a:'These letters were sent yesterday.',exp:E('these letters（2つ以上）・昔 → were ＋ sent','These letters were sent yesterday.','These letters was sent yesterday.','send → sent → sent（ABB型）'),xp:6}
  ],
  qc:[
    {jp:'このコンピューターはケンに使われています。',words:['is','this','used','computer','by','Ken'],a:'This computer is used by Ken.',exp:E('主役 ＋ is ＋ used ＋ by Ken','This computer is used by Ken.','Ken is used by this computer.（主役が逆）','「〜に使われている」の「〜に」は by'),xp:6},
    {jp:'それらのケーキは母によって作られました。',words:['were','those','made','cakes','by','my','mother'],a:'Those cakes were made by my mother.',exp:E('those cakes（2つ以上）・昔 → were made','Those cakes were made by my mother.','Those cakes was made by my mother.','make → made → made'),xp:6}
  ]
};

// ----- S3 書きかえ（主役交代の4ステップ）-----
DATA[3]={type:'grammar',
  title:'③ 書きかえ：主役交代の4ステップ',
  sub:'「ふつうの文を受け身の文に書きかえなさい」は定番問題。毎回同じ手順で解ける。',
  talk:[
    {who:'kyon',text:'「受け身に書きかえなさい」って問題、テストで絶対出るよね…あれ苦手。'},
    {who:'nishi',text:'手順を4つに分ければ、毎回同じやり方で解ける。主役交代の4ステップだ。'},
    {who:'shun',text:'きょんさん、気をつけるんは④です。元の主役は by のうしろに引っこむんですけど、he は him、she は her に着替えるんですわ。舞台袖に下がるときは衣装チェンジです！'},
    {who:'kyon',text:'衣装チェンジ！ by he じゃなくて by him ね。'},
    {who:'nishi',text:'もう1つ。be動詞の「時」は元の文の動詞で決まるけど、「数」は新しい主役で決まる。ここもよく出る。'}
  ],
  formula:'元の文の「〜を」が '+H2('新しい主役')+' に → '+H('be動詞 ＋ 過去分詞')+' → '+H3('by ＋ 元の主役')+'<br><small style="color:var(--text2)">Kyon writes the script. → '+H2('The script')+' '+H('is written')+' '+H3('by Kyon')+'.</small>',
  ruleTitle:'主役交代の4ステップ',
  rules:[
    '① 動詞のすぐうしろの「〜を」にあたる語を、文の先頭に出す → 新しい主役',
    '② be動詞を決める：「時」は元の文の動詞で（writes → 今、wrote → 昔）、「数」は新しい主役で',
    '③ 動詞を過去分詞にする',
    '④ 元の主役を by のうしろへ。he → him ／ she → her ／ they → them ／ I → me ／ we → us に着替える'
  ],
  visual:changeCard('🔄 主役交代の変身図',[
    ['Kyon '+X('writes')+' the script.',H2('The script')+' '+H('is written')+' '+H3('by Kyon')+'.','writes（今）→ is ／ the script（1つ）→ is'],
    ['Ken '+X('broke')+' the window.',H2('The window')+' '+H('was broken')+' '+H3('by Ken')+'.','broke（昔）→ was'],
    ['She '+X('cleans')+' these rooms.',H2('These rooms')+' '+H('are cleaned')+' '+H3('by her')+'.','these rooms（2つ以上）→ are ／ she → her に着替え'],
    ['They '+X('made')+' this cake.',H2('This cake')+' '+H('was made')+' '+H3('by them')+'.','made（昔）→ was ／ they → them に着替え'],
    ['Many people '+X('visit')+' Kyoto.',H2('Kyoto')+' '+H('is visited')+' '+H3('by many people')+'.','⚠️ many people は2つ以上でも、新しい主役は Kyoto（1つ）→ is']
  ])+compareCard('👕 by のうしろの衣装チェンジ表',['元の主役','by のうしろ'],[
    ['I','by '+H3('me')],['we','by '+H3('us')],['you','by '+H3('you')],['he','by '+H3('him')],['she','by '+H3('her')],['they','by '+H3('them')]
  ]),
  ex:[
    ['The script is written by Kyon.','台本はきょんによって書かれます。'],
    ['The window was broken by Ken.','窓はケンによって割られました。'],
    ['These rooms are cleaned by her.','これらの部屋は彼女によってそうじされています。'],
    ['This cake was made by them.','このケーキは彼らによって作られました。']
  ],
  qs:[
    {q:'Ken uses this bike. → This bike ___ used by Ken.',jp:'「ケンはこの自転車を使う」を受け身に',a:'is',choices:['is','was','are'],exp:E('uses は今 ／ this bike は1つ → is','This bike is used by Ken.','This bike was used by Ken.（元の文は今）','「時」は元の文の動詞 uses で決める'),xp:3},
    {q:'Yuki wrote this letter. → This letter was ___ by Yuki.',jp:'「ユキはこの手紙を書いた」を受け身に',a:'written',choices:['written','wrote','write'],exp:E('was のうしろは過去分詞','This letter was written by Yuki.','This letter was wrote by Yuki.','write → wrote → written'),xp:3},
    {q:'He made these chairs. → These chairs were made by ___.',jp:'「彼がこれらのいすを作った」を受け身に',a:'him',choices:['him','he','his'],exp:E('by のうしろは「〜を」の形 → him','These chairs were made by him.','These chairs were made by he.','he → him に衣装チェンジ'),xp:3},
    {q:'She cleans the room. → The room is cleaned by ___.',jp:'「彼女がその部屋をそうじする」を受け身に',a:'her',choices:['her','she','hers'],exp:E('by のうしろは「〜を」の形 → her','The room is cleaned by her.','The room is cleaned by she.','she → her に衣装チェンジ'),xp:3},
    {q:'Many people visit Kyoto. → Kyoto ___ visited by many people.',jp:'「多くの人が京都を訪れる」を受け身に',a:'is',choices:['is','are','was'],exp:E('新しい主役 Kyoto は1つ・今 → is','Kyoto is visited by many people.','Kyoto are visited by many people.','many people につられない！主役は be動詞の前'),xp:4},
    {q:'They sold the tickets. → The tickets ___ sold by them.',jp:'「彼らがそのチケットを売った」を受け身に',a:'were',choices:['was','were','are'],exp:E('sold は昔 ／ the tickets は2つ以上 → were','The tickets were sold by them.','The tickets was sold by them.','sell → sold → sold（ABB型）'),xp:4},
    {q:'My father took these photos. → These photos were ___ by my father.',jp:'「父がこれらの写真を撮った」を受け身に',a:'taken',choices:['taken','took','take'],exp:E('were のうしろは過去分詞','These photos were taken by my father.','These photos were took by my father.','take → took → taken'),xp:4},
    {q:'Kyon loves Nishimura. → ___ is loved by Kyon.',jp:'「きょんは西村を愛している」を受け身に',a:'Nishimura',choices:['Nishimura','Kyon','He'],exp:E('「〜を」にあたる語（Nishimura）が新しい主役','Nishimura is loved by Kyon.','Kyon is loved by Kyon.','loves のすぐうしろの語を先頭へ。にっくん、愛されてる'),xp:4}
  ],
  qbTitle:'✏️ 受け身の文に書きかえよう（4ステップで）',
  qb:[
    {jp:'「Kyon wrote this story.」を受け身の文に',a:'This story was written by Kyon.',exp:E('① this story が主役 ② wrote（昔）・1つ → was ③ written ④ by Kyon','This story was written by Kyon.','This story was wrote by Kyon.','write → wrote → written'),xp:7},
    {jp:'「Ms. Sato teaches English.」を受け身の文に',a:'English is taught by Ms. Sato.',exp:E('① English が主役 ② teaches（今）・1つ → is ③ taught ④ by Ms. Sato','English is taught by Ms. Sato.','English is teached by Ms. Sato.','teach → taught → taught（ABB型）'),xp:7},
    {jp:'「They built this bridge.」を受け身の文に',a:'This bridge was built by them.',exp:E('① this bridge が主役 ② built（昔）・1つ → was ③ built ④ they → them','This bridge was built by them.','This bridge was built by they.','by のうしろは衣装チェンジ（them）'),xp:7}
  ],
  qc:[
    {jp:'この絵はピカソによって描かれました。',words:['was','picture','this','painted','Picasso','by'],a:'This picture was painted by Picasso.',exp:E('主役 ＋ was painted ＋ by ピカソ','This picture was painted by Picasso.','Picasso was painted by this picture.（主役が逆）','描かれた側（絵）が主役'),xp:6}
  ]
};

// ----- S4 疑問文・否定文 -----
DATA[4]={type:'grammar',
  title:'④ 疑問文・否定文：be動詞が動くだけ',
  sub:'受け身の文にはもう be動詞がある。だから do / does / did は出番なし。',
  talk:[
    {who:'kyon',text:'受け身の疑問文って Does this song loved …? でいいの？'},
    {who:'nishi',text:'そこが落とし穴だ。受け身の文にはもう be動詞がいる。だから疑問文は be動詞を前に出すだけ。do / does / did は使わない。'},
    {who:'shun',text:'きょんさん、受け身の文は be動詞さんがもう座ってはるんです。do さんの席はありません！満席です！'},
    {who:'kyon',text:'満席！ be動詞が前に出るだけ、ね。'},
    {who:'nishi',text:'否定文も同じ。be動詞のうしろに not を置くだけだ。答え方も be動詞で答える。'}
  ],
  formula:'疑問文：'+H('Be動詞')+' ＋ 主役 ＋ 過去分詞 〜?<br>答え方：Yes, 〜 '+H('is / was')+'. ／ No, 〜 '+H('isn’t / wasn’t')+'.<br>否定文：主役 ＋ '+H('be動詞 ＋ not')+' ＋ 過去分詞',
  ruleTitle:'ルール3つ',
  rules:[
    '① 疑問文は be動詞を文の先頭へ（Is / Are / Was / Were）',
    '② do / does / did は使わない（be動詞がもういるから）',
    '③ 答えも be動詞で：Yes, it is. ／ No, they weren’t.'
  ],
  visual:changeCard('🔄 疑問文・否定文の変身図',[
    ['This song is loved by young people.',H('Is')+' this song loved by young people?','答え：Yes, it is. ／ No, it isn’t.'],
    ['These pictures were taken in Kyoto.',H('Were')+' these pictures taken in Kyoto?','答え：Yes, they were. ／ No, they weren’t.'],
    ['This room is cleaned every day.','This room '+H('is not')+' cleaned every day.','否定文：is のうしろに not'],
    ['（✕）'+X('Does')+' this song loved …?','（○）'+H('Is')+' this song loved …?','do / does / did は出番なし']
  ]),
  ex:[
    ['Is this song loved by young people?','この歌は若い人たちに愛されていますか。'],
    ['Yes, it is.','はい、愛されています。'],
    ['Were these pictures taken in Kyoto?','これらの写真は京都で撮られましたか。'],
    ['This room was not cleaned yesterday.','この部屋は昨日そうじされませんでした。']
  ],
  qs:[
    {q:'___ this song sung by Mrs. GREEN APPLE?',jp:'この歌はミセスによって歌われていますか。',a:'Is',choices:['Is','Does','Are'],exp:E('受け身の疑問文 → be動詞を前へ。this song（1つ）・今 → Is','Is this song sung by Mrs. GREEN APPLE?','Does this song sung by Mrs. GREEN APPLE?','受け身は be動詞が満席。do さんの出番なし'),xp:3},
    {q:'___ these pictures taken in Kyoto?',jp:'これらの写真は京都で撮られましたか。',a:'Were',choices:['Were','Did','Was'],exp:E('these pictures（2つ以上）・昔 → Were','Were these pictures taken in Kyoto?','Did these pictures taken in Kyoto?','「撮られましたか」は昔 → Were'),xp:3},
    {q:'___ this book written by Natsume Soseki?',jp:'この本は夏目漱石によって書かれましたか。',a:'Was',choices:['Was','Did','Were'],exp:E('this book（1つ）・昔 → Was','Was this book written by Natsume Soseki?','Did this book written by Natsume Soseki?','did ではなく was'),xp:3},
    {q:'Was the window broken by Ken? — Yes, it ___.',jp:'窓はケンによって割られましたか。— はい、割られました。',a:'was',choices:['was','did','is'],exp:E('Was で聞かれたら was で答える','Yes, it was.','Yes, it did.','聞かれた be動詞をそのまま使う'),xp:3},
    {q:'Are these cars made in Japan? — No, they ___.',jp:'これらの車は日本で作られていますか。— いいえ、作られていません。',a:'aren’t',choices:['aren’t','don’t','isn’t'],exp:E('Are で聞かれたら are で答える。No → aren’t','No, they aren’t.','No, they don’t.','these cars は they で受ける → aren’t'),xp:4},
    {q:'This room ___ not cleaned yesterday.',jp:'この部屋は昨日そうじされませんでした。',a:'was',choices:['was','did','is'],exp:E('否定文 → be動詞 ＋ not。昔・1つ → was not','This room was not cleaned yesterday.','This room did not cleaned yesterday.','yesterday は昔の合図'),xp:4},
    {q:'English ___ not spoken in this town.',jp:'この町では英語は話されていません。',a:'is',choices:['is','does','are'],exp:E('否定文 → be動詞 ＋ not。今・言語は1つ → is not','English is not spoken in this town.','English does not spoken in this town.','do / does は使わない'),xp:4},
    {q:'These games were not ___ by children.',jp:'これらのゲームは子どもたちには遊ばれていませんでした。',a:'played',choices:['played','play','playing'],exp:E('否定文でも be動詞 ＋ not のうしろは過去分詞','These games were not played by children.','These games were not play by children.','not が入っても、過去分詞はそのまま'),xp:4}
  ],
  qb:[
    {jp:'この歌は日本で知られていますか。',a:'Is this song known in Japan?',exp:E('Is ＋ this song ＋ known 〜?','Is this song known in Japan?','Does this song known in Japan?','know → knew → known'),xp:7},
    {jp:'この部屋は昨日使われませんでした。',a:'This room was not used yesterday.',exp:E('This room ＋ was not ＋ used','This room was not used yesterday.','This room did not used yesterday.','否定文は be動詞のうしろに not'),xp:7}
  ],
  qc:[
    {jp:'この手紙は英語で書かれていますか。',words:['is','letter','this','written','in','English'],a:'Is this letter written in English?',exp:E('Is ＋ 主役 ＋ 過去分詞 〜?','Is this letter written in English?','This letter is written in English?（疑問文は Is を先頭に）','be動詞を先頭に出すだけ'),xp:6}
  ]
};

// ----- S5 入試によく出る形 -----
DATA[5]={type:'grammar',
  title:'⑤ 入試によく出る形：助動詞つき・by 以外のセット',
  sub:'受け身の仕上げ。「can be 〜」と、by 以外の前置詞を使うセットの言い方。',
  talk:[
    {who:'kyon',text:'受け身ってこれで全部？'},
    {who:'nishi',text:'入試によく出る形があと2つある。1つは「助動詞 ＋ be ＋ 過去分詞」。もう1つは by 以外を使うセットの言い方だ。'},
    {who:'shun',text:'きょんさん、セットの言い方は理屈より「決めゼリフ」で覚えるんが早いです。🔊で何回も聞いて、ネタみたいに口に入れてください！'},
    {who:'kyon',text:'決めゼリフなら得意！ be covered with snow！'},
    {who:'nishi',text:'助動詞のほうはルール1つ。助動詞のうしろは原形だから、is も are も be になる。'}
  ],
  formula:'助動詞（can / will / must）＋ '+H('be')+' ＋ 過去分詞<br><small style="color:var(--text2)">Stars can '+H('be seen')+' from here.（ここから星が見られる）</small>',
  ruleTitle:'助動詞のうしろは、いつも原形',
  rules:[
    '① is / are / am / was / were の原形は be → can '+H('be')+' seen',
    '② ✕ can is seen ／ ✕ will is held',
    '③ can be seen（見られる）／ will be held（開かれるだろう）／ must be done（されなければならない）'
  ],
  ex:[
    ['Stars can be seen from here.','ここから星が見られます。'],
    ['The festival will be held next Sunday.','お祭りは今度の日曜日に開かれるでしょう。'],
    ['This work must be done today.','この仕事は今日やらなければなりません。']
  ],
  more:[
    {title:'🎤 by 以外のセット（決めゼリフで丸ごと覚える）',note:'<div class="en">前置詞は理屈ではなくセットで。<strong>made of</strong> は見て材料がわかる（木の机）、<strong>made from</strong> は見ても材料がわからない（牛乳 → バター）。</div>',ex:[
      ['This song is known to everyone.','この歌はみんなに知られている。（be known to 〜）'],
      ['The mountain is covered with snow.','その山は雪でおおわれている。（be covered with 〜）'],
      ['This desk is made of wood.','この机は木でできている。（be made of 〜）'],
      ['Butter is made from milk.','バターは牛乳から作られる。（be made from 〜）'],
      ['I am interested in comedy.','私はお笑いに興味がある。（be interested in 〜）'],
      ['We were surprised at the news.','私たちはその知らせに驚いた。（be surprised at 〜）']
    ]}
  ],
  qs:[
    {q:'The mountain is covered ___ snow.',jp:'その山は雪でおおわれています。',a:'with',choices:['with','by','of'],exp:E('be covered with 〜 ＝ 〜でおおわれている','The mountain is covered with snow.','The mountain is covered by snow.','決めゼリフ：be covered with snow'),xp:3},
    {q:'This song is known ___ everyone in Japan.',jp:'この歌は日本のみんなに知られています。',a:'to',choices:['to','at','of'],exp:E('be known to 〜 ＝ 〜に知られている','This song is known to everyone in Japan.','This song is known at everyone in Japan.','「〜に知られている」の「に」は to'),xp:3},
    {q:'This desk is made ___ wood.',jp:'この机は木でできています。',a:'of',choices:['of','from','in'],exp:E('見て材料がわかる → made of','This desk is made of wood.','This desk is made from wood.','机を見たら木だとわかる → of'),xp:4},
    {q:'Butter is made ___ milk.',jp:'バターは牛乳から作られます。',a:'from',choices:['from','of','in'],exp:E('見ても材料がわからない → made from','Butter is made from milk.','Butter is made of milk.','バターを見ても牛乳には見えない → from'),xp:4},
    {q:'I am interested ___ Japanese comedy.',jp:'私は日本のお笑いに興味があります。',a:'in',choices:['in','at','to'],exp:E('be interested in 〜 ＝ 〜に興味がある','I am interested in Japanese comedy.','I am interested at Japanese comedy.','興味の「中（in）」に入っていくイメージ'),xp:3},
    {q:'We were surprised ___ the news.',jp:'私たちはその知らせに驚きました。',a:'at',choices:['at','in','of'],exp:E('be surprised at 〜 ＝ 〜に驚く','We were surprised at the news.','We were surprised in the news.','一点（at）にびっくりして目が止まるイメージ'),xp:3},
    {q:'Stars can ___ seen from this hill.',jp:'この丘から星が見られます。',a:'be',choices:['be','are','is'],exp:E('助動詞のうしろは原形 → be','Stars can be seen from this hill.','Stars can are seen from this hill.','can ＋ be ＋ 過去分詞'),xp:4},
    {q:'The festival will be ___ next Sunday.',jp:'お祭りは今度の日曜日に開かれるでしょう。',a:'held',choices:['held','hold','holding'],exp:E('will be のうしろは過去分詞','The festival will be held next Sunday.','The festival will be hold next Sunday.','hold → held → held（ABB型）'),xp:4}
  ],
  qb:[
    {jp:'富士山はここから見ることができます（見られます）。',a:'Mt. Fuji can be seen from here.',exp:E('can ＋ be ＋ seen','Mt. Fuji can be seen from here.','Mt. Fuji can is seen from here.','see → saw → seen'),xp:7},
    {jp:'私は英語に興味があります。',a:'I am interested in English.',exp:E('be interested in 〜','I am interested in English.','I am interesting in English.（interesting は「おもしろい」）','人が主役のときは interested'),xp:6}
  ],
  qc:[
    {jp:'その山は雪でおおわれていました。',words:['mountain','the','was','covered','with','snow'],a:'The mountain was covered with snow.',exp:E('主役 ＋ was covered ＋ with 雪','The mountain was covered with snow.','The mountain was covered by snow.','決めゼリフ：be covered with'),xp:6}
  ]
};

// ----- S6 確認テスト -----
DATA[6]={type:'test',
  title:'受け身 確認テスト',
  sub:'ここまでの全部をまぜた20問。まちがえた問題は🔥特訓に入るから安心して。',
  talk:[
    {who:'nishi',text:'最後は全部まぜた20問。迷ったら「be動詞はある？」「過去分詞になってる？」「いつ？いくつ？」の3つを確認。'},
    {who:'kyon',text:'主役交代・3拍子・満席・衣装チェンジ！ 全部覚えてる！'}
  ],
  qs:[
    {q:'This book ___ written by a famous writer.',jp:'この本は有名な作家によって書かれました。',a:'was',choices:['was','did','were'],exp:E('this book（1つ）・昔 → was','This book was written by a famous writer.','This book did written by a famous writer.','「書かれました」＝昔'),xp:3},
    {q:'Soccer is ___ all over the world.',jp:'サッカーは世界中でプレーされています。',a:'played',choices:['played','play','playing'],exp:E('be動詞のうしろは過去分詞','Soccer is played all over the world.','Soccer is playing all over the world.（「サッカーがプレーしている」になる）','play は規則動詞 → played'),xp:3},
    {q:'These songs ___ loved by young people.',jp:'これらの歌は若い人たちに愛されています。',a:'are',choices:['are','is','was'],exp:E('these songs（2つ以上）・今 → are','These songs are loved by young people.','These songs is loved by young people.',''),xp:3},
    {q:'The letter was sent by ___.',jp:'その手紙は彼女によって送られました。',a:'her',choices:['her','she','hers'],exp:E('by のうしろは衣装チェンジ → her','The letter was sent by her.','The letter was sent by she.',''),xp:3},
    {q:'___ this cake made by your mother?',jp:'このケーキはあなたのお母さんによって作られましたか。',a:'Was',choices:['Was','Did','Does'],exp:E('受け身の疑問文は be動詞を前へ。昔・1つ → Was','Was this cake made by your mother?','Did this cake made by your mother?','be動詞が満席。do さんの出番なし'),xp:3},
    {q:'Japanese is ___ in Japan.',jp:'日本語は日本で話されています。',a:'spoken',choices:['spoken','spoke','speak'],exp:E('speak → spoke → spoken','Japanese is spoken in Japan.','Japanese is spoke in Japan.','spoke は過去形'),xp:3},
    {q:'This temple ___ built in 1200.',jp:'この寺は1200年に建てられました。',a:'was',choices:['was','is','were'],exp:E('in 1200 は昔・1つ → was','This temple was built in 1200.','This temple is built in 1200.',''),xp:3},
    {q:'Are these bags made in Italy? — Yes, they ___.',jp:'これらのかばんはイタリアで作られていますか。— はい、そうです。',a:'are',choices:['are','do','is'],exp:E('Are で聞かれたら are で答える','Yes, they are.','Yes, they do.',''),xp:3},
    {q:'The room was not ___ yesterday.',jp:'その部屋は昨日そうじされませんでした。',a:'cleaned',choices:['cleaned','clean','cleaning'],exp:E('was not のうしろも過去分詞','The room was not cleaned yesterday.','The room was not clean yesterday.',''),xp:3},
    {q:'正しい受け身の文はどれ？',jp:'正しい受け身の文は？（この絵はピカソによって描かれた）',a:'This picture was painted by Picasso.',choices:['This picture was painted by Picasso.','This picture painted by Picasso.','This picture was painting by Picasso.'],exp:E('be動詞 ＋ 過去分詞 がそろっているか','This picture was painted by Picasso.','This picture painted by Picasso.（be動詞がない）','パーツ①be動詞 ②過去分詞 を指さし確認'),xp:4},
    {q:'正しい疑問文はどれ？',jp:'正しい疑問文は？（この手紙はケンによって書かれましたか）',a:'Was this letter written by Ken?',choices:['Was this letter written by Ken?','Did this letter written by Ken?','Was this letter wrote by Ken?'],exp:E('Was ＋ 主役 ＋ 過去分詞 〜?','Was this letter written by Ken?','Did this letter written by Ken? ／ Was this letter wrote by Ken?','did は使わない・wrote は過去形'),xp:4},
    {q:'Ken broke the window. → The window ___ broken by Ken.',jp:'「ケンが窓を割った」を受け身に',a:'was',choices:['was','is','were'],exp:E('broke は昔 ／ the window は1つ → was','The window was broken by Ken.','The window is broken by Ken.','「時」は元の文の動詞で決める'),xp:4},
    {q:'Many people visit this museum. → This museum ___ visited by many people.',jp:'「多くの人がこの博物館を訪れる」を受け身に',a:'is',choices:['is','are','was'],exp:E('新しい主役 this museum は1つ・今 → is','This museum is visited by many people.','This museum are visited by many people.','many people につられない'),xp:4},
    {q:'The ground was covered ___ leaves.',jp:'地面は葉っぱでおおわれていました。',a:'with',choices:['with','of','to'],exp:E('be covered with 〜','The ground was covered with leaves.','The ground was covered of leaves.',''),xp:4},
    {q:'Mt. Fuji can ___ seen from my house.',jp:'私の家から富士山が見られます。',a:'be',choices:['be','is','was'],exp:E('助動詞のうしろは原形 → be','Mt. Fuji can be seen from my house.','Mt. Fuji can is seen from my house.',''),xp:4},
    {q:'I was surprised ___ the news.',jp:'私はその知らせに驚きました。',a:'at',choices:['at','in','to'],exp:E('be surprised at 〜','I was surprised at the news.','I was surprised in the news.',''),xp:4},
    {q:'This chair is made ___ wood.',jp:'このいすは木でできています。',a:'of',choices:['of','from','in'],exp:E('見て材料がわかる → made of','This chair is made of wood.','This chair is made from wood.',''),xp:4},
    {q:'English and French ___ spoken in Canada.',jp:'カナダでは英語とフランス語が話されています。',a:'are',choices:['are','is','was'],exp:E('English and French ＝ 言語が2つ・今 → are','English and French are spoken in Canada.','English and French is spoken in Canada.','and で2つつながると2つ以上あつかい'),xp:4},
    {q:'The concert will be ___ next month.',jp:'コンサートは来月開かれるでしょう。',a:'held',choices:['held','hold','holding'],exp:E('will be ＋ 過去分詞','The concert will be held next month.','The concert will be hold next month.','hold → held → held'),xp:4},
    {q:'This song was ___ by Kyon at the live show.',jp:'この歌はライブできょんによって歌われました。',a:'sung',choices:['sung','sang','sing'],exp:E('sing → sang → sung','This song was sung by Kyon at the live show.','This song was sang by Kyon at the live show.','sang は過去形。受け身は sung'),xp:4}
  ]
};

// ===== INIT =====
updateXP();renderWeakBar();
(function(){
  var params=new URLSearchParams(location.search);
  var reqSec=parseInt(params.get('sec'),10);
  currentSection=(reqSec>=0&&reqSec<=TOKKU_SID)?reqSec:0;
  renderSectionTabs();renderSection(currentSection);
})();
