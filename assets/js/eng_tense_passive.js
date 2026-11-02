// ===== 英語 時制と受け身 まとめ（主語はぜんぶ I）=====
// 12時制を「時（過去・現在・未来）×形（ふつう・進行・完了・完了進行）」の表で整理し、受け身も同じ表に乗せるページ。
// 例文は本人の空手（10年・今も継続）とピアノ（4歳〜12歳・もうやめた）、芸人ネタ。主語はすべて I。
// 問題は中学範囲だけ。高校の時制は表で「見るだけ」。
// エンジンは eng_passive_review.js と同じ。XP・弱点DB・採点キャッシュは英語共通の nh3_ キー。
// qid は tn_s{セクション}_q{番号}、セクション完了は nh3_tn_secdone。「最初からやり直す」は tn_ の記録だけ消す。

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

var PRE = 'tn';
var SEC_KEY = 'nh3_tn_secdone';
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
  correct:['きょん「合ってる合ってる！すごくない！？」','きょん「やった！正解！天才かも！」','きょん「にっくん見て！俺より賢いかも！」','きょん「合ってる！もう時制マスターじゃない！？」'],
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
// このページ（tn_）の弱点だけを見せる
function getWeakQuestions(){return Object.keys(weakDB).filter(function(q){var d=weakDB[q];return isPv(q)&&d.total>0&&getPct(q)<80;}).sort(function(a,b){return getPct(a)-getPct(b);});}
function renderWeakBar() {
  var wqs=getWeakQuestions(),el=document.getElementById('weakItems');if(!el)return;
  if(wqs.length===0){el.innerHTML='<span class="weak-bar-empty">このページの弱点なし！</span>';return;}
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
function expandNeg(s){return s.replace(/\bwon't\b/g,'will not').replace(/\b(is|are|was|were|have|has|had)n't\b/g,'$1 not');}
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
  // 時制を決める大事な語：be動詞・have・will・been など
  var gWords=['am','is','are','was','were','be','been','being','have','has','had','do','does','did','not','will','can','would','could'];
  var aG=aW.filter(function(w){return gWords.indexOf(w)!==-1;});
  var vG=aG.filter(function(w){return vW.indexOf(w)!==-1;});
  var gramOk=aG.length===0||vG.length===aG.length;
  var orderOk=true;
  var key=aW.slice(0,3);var last=-1;
  key.forEach(function(w){var idx=vW.indexOf(w);if(idx===-1){vW.forEach(function(x,k){if(idx===-1&&oneOff(x,w))idx=k;});}if(idx===-1||idx<last)orderOk=false;else last=idx;});
  if(rate>=0.9&&gramOk&&orderOk&&typo)return{grade:'○',xpRate:0.6,comment:'おしい！形は合ってる。つづりが1文字ちがう語があるよ。下の正しい答えと見くらべよう。'};
  if(rate>=0.9&&gramOk&&orderOk)return{grade:'◎',xpRate:1.0,comment:'ほぼ完璧！文法もバッチリ！'};
  if(rate>=0.75&&gramOk&&orderOk)return{grade:'○',xpRate:0.6,comment:'惜しい！文法はOK、単語が少し違う。'};
  if(gramOk&&rate>=0.5)return{grade:'△',xpRate:0.2,comment:'時制の形は合ってるけど単語が足りない。正解文をよく見よう。'};
  if(!gramOk&&rate>=0.6)return{grade:'△',xpRate:0.2,comment:'時制を決める大事な語（am / was / will / have / been など）がちがう。正しい答えと見くらべよう！'};
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
// このページ（tn_）の「解いた」印と採点キャッシュ、セクション完了だけを消す。XP・弱点DBはそのまま
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
  if(!confirm('このページの〇×を全部消して、最初からやり直します。\n（XP と 弱点の記録はそのまま残ります。もう一度正解すると、またXPがもらえます）\nやり直しますか？'))return;
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
    +'<button class="redo-btn" data-act="reset">🔄 最初からやり直す</button></div>';
}

// ===== SECTIONS =====
var currentSection=0;
var SECTIONS=[
  {id:0,label:'時制の表'},
  {id:1,label:'過去・現在・未来'},
  {id:2,label:'進行形'},
  {id:3,label:'完了形'},
  {id:4,label:'受け身×時制'},
  {id:5,label:'芸人でまとめ'},
  {id:8,label:'もしも（仮定法）'},
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
  // セクションidは記録とずれないよう固定。並び順（タブの順）は SECTIONS の順で決める
  var order=SECTIONS.map(function(s){return s.id;}),pos=order.indexOf(sid);
  var html='<div class="progress-dots">';
  SECTIONS.forEach(function(s,i){
    if(s.id===TOKKU_SID)return;
    var cls='dot';
    if(i<pos)cls+=' done';
    if(i===pos)cls+=' current';
    html+='<div class="'+cls+'"></div>';
  });
  html+='</div>';
  html+='<div class="section-badge">時制と受け身 · SECTION '+sid+'</div>';

  var d=DATA[sid];
  if(d.type==='intro')html+=renderIntroSection(sid,d);
  else if(d.type==='grammar')html+=renderGrammarSection(sid,d);
  else if(d.type==='test')html+=renderTestSection(sid,d);

  var isLast=(sid===TEST_SID);
  var label=isLast?'🔥 特訓で弱点をつぶす →':'次のセクションへ →';
  html+='<button class="next-section-btn" id="nextBtn" data-sec="'+order[pos+1]+'">'+label+'</button>';

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

// 会話。きょん・西村に、ヒント係のなかむらしゅんと応援係のくるま
var CAST={
  kyon:   {name:'きょん',                      av:'😄', cls:'av-kyon',  style:''},
  nishi:  {name:'西村（慶應卒・元アナ）',      av:'慶', cls:'av-nishi', style:''},
  shun:   {name:'なかむらしゅん（9番街レトロ）', av:'🎭', cls:'',        style:'background:#2d6a4f;'},
  kuruma: {name:'くるま（令和ロマン）',        av:'🚗', cls:'',        style:'background:#6d28d9;'}
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

// 強調用：H＝時を決める先頭の1語（金）／H2＝形の部品（青）／H3＝合図の語（ピンク）
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
  html+='<div class="grammar-card"><div class="grammar-card-title">'+(d.formulaTitle||'📐 基本の型')+'</div><div class="formula-box">'+d.formula+'</div>';
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
    mc.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">🏆</div><div class="tokku-complete-title">弱点ゼロ！</div><div style="font-size:15px;color:#8b949e;margin-top:12px;line-height:2">きょん「俺、完璧じゃん！！」<br>西村「よくやった。まだ解いていないセクションがあれば進もう」</div><button data-sec="0" style="margin-top:24px;background:var(--gold);color:#000;border:none;padding:14px 32px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer;">セクションに戻る</button></div>';
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
// 問題データ（主語はすべて I）
// 空手＝10年・今も続けている → 現在完了 ／ ピアノ＝4歳〜12歳・もうやめた → 過去形
// ============================
var DATA={};

// ----- S0 時制の表 -----
DATA[0]={type:'intro',
  title:'時制：動詞だけが変身する',
  sub:'主語はずっと I。変わるのは金色の動詞だけ。<br>📖 迷ったらいつでも <a href="eng_tense_chart.html" style="color:var(--gold);font-weight:bold">時制表</a> を見てOK。',
  talk:[
    {who:'kyon',text:'時制って12個もあるんでしょ？ 名前だけで頭が痛い…'},
    {who:'nishi',text:'中学で使うのは7つだけ。変わるのは動詞のところだけだ。下を眺めるだけでいい。'}
  ],
  formulaTitle:'📐 空手で7つ',
  formula:'I '+H('practice')+' karate.（練習する）<br>I '+H('practiced')+' karate.（練習した）<br>I '+H('will practice')+' karate.（練習するだろう）<br>I '+H('am practicing')+' karate.（練習している）<br>I '+H('was practicing')+' karate.（練習していた）<br>I '+H('have practiced')+' karate.（ずっと続けている）<br>I '+H('have been practicing')+' karate.（ずっとやり続けている）',
  ruleTitle:'見るところは1つ',
  rules:[
    '先頭の語で「いつ？」が決まる：was・過去形 → 過去 ／ am・have・原形 → 現在 ／ will → 未来'
  ],
  ex:[
    ['I practice karate.','私は空手を練習します。'],
    ['I am practicing karate.','私は空手を練習しているところです。'],
    ['I have practiced karate for ten years.','私は10年間空手を続けています。']
  ],
  qs:[
    {q:'I have been practicing karate.',jp:'この文の「いつ？（現在）」を決めている語は？',a:'have',choices:['have','been','practicing'],exp:E('時を決めるのは先頭の1語','I <strong>have</strong> been practicing karate.（have ＝ 現在）','been や practicing を見ても時はわからない','先頭が had なら過去、will なら未来になる'),xp:2},
    {q:'I am practicing karate now.',jp:'この文の「形」は？',a:'進行形（〜している最中）',choices:['進行形（〜している最中）','完了形（ずっと・もう・したことある）','ふつうの形'],exp:E('be ＋ 〜ing ＝ 進行形','I am practicing karate now.（今、練習している最中）','',''),xp:2},
    {q:'I have practiced karate for ten years.',jp:'この文の時制の名前は？',a:'現在完了形',choices:['現在完了形','過去形','現在進行形'],exp:E('have ＋ 過去分詞 ＝ 完了形。先頭が have ＝ 現在 → 現在完了形','I have practiced karate for ten years.（10年間ずっと続けている）','',''),xp:2},
    {q:'I will practice karate tomorrow.',jp:'この文の「いつ？」は？',a:'未来',choices:['未来','過去','現在'],exp:E('will ＋ 原形 ＝ 未来','I will practice karate tomorrow.','','tomorrow も未来の合図'),xp:2},
    {q:'完了形の部品はどれ？',jp:'完了形を作る部品',a:'have ＋ 過去分詞',choices:['have ＋ 過去分詞','be ＋ 〜ing','will ＋ 原形'],exp:E('完了形 ＝ have ＋ 過去分詞','I have practiced karate.','be ＋ 〜ing は進行形、will ＋ 原形 は未来',''),xp:2},
    {q:'I was practicing karate.',jp:'この文の「いつ？」は？',a:'過去',choices:['過去','現在','未来'],exp:E('先頭の was ＝ 過去','I was practicing karate.（練習している最中だった）','','先頭が am なら現在'),xp:2}
  ]
};

// ----- S1 過去・現在・未来（ふつうの形）-----
DATA[1]={type:'grammar',
  title:'① ふつうの形：過去・現在・未来',
  sub:'もう終わったこと・いつものこと・これからのこと。',
  talk:[
    {who:'shun',text:'きょんさん、ピアノはもうやめたから played。played の ed は「エンディング」の ed ですわ。'},
    {who:'kyon',text:'ed はエンディング！'}
  ],
  formula:'過去：I '+H('played')+' the piano.（もうやめた）<br>現在：I '+H('practice')+' karate every week.<br>未来：I '+H('will practice')+' karate tomorrow.',
  ruleTitle:'合図',
  rules:[
    '過去 → yesterday / 〜 ago / when I was 〜',
    '未来 → tomorrow / next 〜（will のうしろは原形）'
  ],
  ex:[
    ['I played the piano from age four to age twelve.','私は4歳から12歳までピアノを弾いていました。'],
    ['I practice karate every week.','私は毎週空手を練習します。'],
    ['I will practice karate tomorrow.','私は明日空手を練習するでしょう。']
  ],
  qs:[
    {q:'I ___ karate every Saturday.',jp:'私は毎週土曜日に空手を練習します。',a:'practice',choices:['practice','practiced','practicing'],exp:E('every Saturday（毎週）→ 現在','I practice karate every Saturday.','I practiced karate every Saturday.（昔のことになる）','いつもしていることは現在形'),xp:3},
    {q:'I ___ the piano when I was in elementary school.',jp:'小学生のとき、私はピアノを弾いていました。',a:'played',choices:['played','play','will play'],exp:E('when I was 〜 → 過去','I played the piano when I was in elementary school.','I play the piano when I was in elementary school.','ed はエンディングの ed'),xp:3},
    {q:'I ___ practice karate tomorrow.',jp:'私は明日空手を練習するでしょう。',a:'will',choices:['will','was','am'],exp:E('tomorrow → 未来 → will ＋ 原形','I will practice karate tomorrow.','I was practice karate tomorrow.',''),xp:3},
    {q:'I ___ going to practice karate after school.',jp:'私は放課後に空手を練習するつもりです。',a:'am',choices:['am','was','will'],exp:E('be going to ＋ 原形 ＝ 〜するつもり。I → am','I am going to practice karate after school.','I will going to practice karate.',''),xp:3},
    {q:'I ___ a karate tournament.',jp:'私は空手の大会で優勝しました。',a:'won',choices:['won','win','will win'],exp:E('「優勝しました」→ 過去。win → won','I won a karate tournament.','I winned a karate tournament.','win は不規則動詞（win → won → won）'),xp:3},
    {q:'I stopped playing the piano when I ___ twelve.',jp:'私は12歳のときにピアノをやめました。',a:'was',choices:['was','am','will be'],exp:E('12歳だったのは過去 → was','I stopped playing the piano when I was twelve.','I stopped playing the piano when I am twelve.',''),xp:3},
    {q:'Will you practice karate tomorrow? — Yes, I ___.',jp:'明日空手を練習しますか。— はい、します。',a:'will',choices:['will','do','am'],exp:E('Will で聞かれたら will で答える','Yes, I will.','Yes, I do.',''),xp:3},
    {q:'I will ___ karate next Sunday.',jp:'私は今度の日曜日に空手を練習するでしょう。',a:'practice',choices:['practice','practiced','practicing'],exp:E('will のうしろは原形','I will practice karate next Sunday.','I will practiced karate next Sunday.',''),xp:3}
  ],
  qb:[
    {jp:'私は毎日空手を練習します。',a:'I practice karate every day.',exp:E('every day → 現在形','I practice karate every day.','',''),xp:5},
    {jp:'私は明日空手を練習するでしょう（will を使って）。',a:'I will practice karate tomorrow.',exp:E('will ＋ 原形','I will practice karate tomorrow.','I will practiced karate tomorrow.',''),xp:5}
  ],
  qc:[
    {jp:'私は12歳でピアノをやめました。',words:['I','stopped','playing','the','piano','at','twelve'],a:'I stopped playing the piano at twelve.',exp:E('stop ＋ 〜ing ＝ 〜するのをやめる','I stopped playing the piano at twelve.','I stopped to play the piano at twelve.（「弾くために立ち止まった」になる）',''),xp:6}
  ]
};

// ----- S2 進行形 -----
DATA[2]={type:'grammar',
  title:'② 進行形：今まさに〜している最中',
  sub:'be ＋ 〜ing。',
  talk:[
    {who:'shun',text:'きょんさん、進行形はテレビの「生中継」です。ing は「いま中継中」の ing ですわ。'}
  ],
  formula:'今：I '+H('am practicing')+' karate now.<br>そのとき：I '+H('was practicing')+' karate when Kyon called me.',
  ruleTitle:'気をつけること1つ',
  rules:[
    'love / like / know / want は 〜ing にしない（気持ちには「途中」がないから）'
  ],
  visual:compareCard('⭕ と ✕',['⭕','✕'],[
    ['I love Mrs. GREEN APPLE.','I am loving Mrs. GREEN APPLE.'],
    ['I know the answer.','I am knowing the answer.']
  ]),
  ex:[
    ['I am practicing karate now.','私は今、空手を練習しているところです。'],
    ['I was practicing karate when Kyon called me.','きょんから電話が来たとき、私は空手を練習していました。']
  ],
  qs:[
    {q:'I ___ practicing karate now.',jp:'私は今、空手を練習しているところです。',a:'am',choices:['am','was','have'],exp:E('now → 今 → am ＋ 〜ing','I am practicing karate now.','I was practicing karate now.',''),xp:3},
    {q:'I ___ practicing karate when Kyon called me.',jp:'きょんから電話が来たとき、私は空手を練習していました。',a:'was',choices:['was','am','have'],exp:E('called（過去）のとき → was ＋ 〜ing','I was practicing karate when Kyon called me.','I am practicing karate when Kyon called me.',''),xp:3},
    {q:'I am ___ my karate uniform.',jp:'私は空手着を着ています。',a:'wearing',choices:['wearing','wear','wore'],exp:E('am のうしろは 〜ing','I am wearing my karate uniform.','I am wear my karate uniform.',''),xp:3},
    {q:'I was ___ karate at seven last night.',jp:'昨夜7時、私は空手を練習していました。',a:'practicing',choices:['practicing','practice','practiced'],exp:E('was のうしろは 〜ing','I was practicing karate at seven last night.','I was practiced karate at seven last night.（受け身の形になってしまう）',''),xp:3},
    {q:'I ___ Mrs. GREEN APPLE.',jp:'私はミセスが大好きです。',a:'love',choices:['love','am loving','loving'],exp:E('love は「気持ち」の動詞 → 進行形にしない','I love Mrs. GREEN APPLE.','I am loving Mrs. GREEN APPLE.','I’m lovin’ it はCMだけの特別な言い方'),xp:4},
    {q:'I ___ the answer.',jp:'私は答えを知っています。',a:'know',choices:['know','am knowing','knowing'],exp:E('know は「状態」の動詞 → 進行形にしない','I know the answer.','I am knowing the answer.',''),xp:4},
    {q:'I ___ laughing at Kuruma’s joke now.',jp:'私は今、くるまのギャグで笑っているところです。',a:'am',choices:['am','was','do'],exp:E('now → am ＋ 〜ing','I am laughing at Kuruma’s joke now.','I do laughing at Kuruma’s joke now.',''),xp:3},
    {q:'What were you doing then? — I ___ practicing karate.',jp:'そのとき何をしていましたか。— 空手を練習していました。',a:'was',choices:['was','am','did'],exp:E('were で聞かれた過去の進行形 → I was ＋ 〜ing','I was practicing karate.','I did practicing karate.',''),xp:4},
    {q:'進行形にできない動詞はどれ？',jp:'「〜している最中」と言えない動詞',a:'know',choices:['know','practice','watch'],exp:E('know は「知っている」という状態。始まり・途中・終わりがない → 〜ing をつけられない','I know the answer.','I am knowing the answer.','チェック：「今まさに知っている最中」→ 変 → 状態の動詞'),xp:4},
    {q:'I have ___ this song for three years.',jp:'私はこの歌が3年間ずっと好きです。',a:'loved',choices:['loved','been loving','love'],exp:E('love は 〜ing が入るマスに入れない。「ずっと好き」は完了形 have loved','I have loved this song for three years.','I have been loving this song for three years.（完了進行形の中に 〜ing が入っている）','完了形（have ＋ 過去分詞）なら 〜ing がないので OK'),xp:4}
  ],
  qb:[
    {jp:'私は今、空手を練習しています。',a:'I am practicing karate now.',exp:E('am ＋ practicing','I am practicing karate now.','I practicing karate now.（am がない）',''),xp:5},
    {jp:'私はそのとき空手を練習していました。',a:'I was practicing karate then.',exp:E('was ＋ practicing','I was practicing karate then.','',''),xp:5}
  ],
  qc:[
    {jp:'きょんから電話が来たとき、私は空手を練習していました。',words:['I','was','practicing','karate','when','Kyon','called','me'],a:'I was practicing karate when Kyon called me.',exp:E('was ＋ 〜ing ＋ when 〜','I was practicing karate when Kyon called me.','',''),xp:6}
  ]
};

// ----- S3 完了形（空手とピアノのちがい）-----
DATA[3]={type:'grammar',
  title:'③ 完了形：空手は have、ピアノは過去形',
  sub:'今も続けている → have。もうやめた → 過去形。',
  talk:[
    {who:'shun',text:'きょんさん、have は「今も手に持ってる」の have です。空手はまだ手に持ってる。ピアノはもう手放した。'},
    {who:'kyon',text:'今も手に持ってたら have！'}
  ],
  formula:'空手（今も続けている）：I '+H('have practiced')+' karate for ten years.<br>ピアノ（もうやめた）：I '+H('played')+' the piano for eight years.',
  ruleTitle:'気をつけること',
  rules:[
    '✕ I have played the piano for eight years.（今も続けている意味になる）',
    'ago / yesterday / when I was 〜 があったら have は使わない'
  ],
  ex:[
    ['I have practiced karate for ten years.','私は10年間空手を続けています。'],
    ['I have been practicing karate for ten years.','私は10年間ずっと空手をやり続けています。'],
    ['I played the piano for eight years.','私は8年間ピアノを弾いていました。（もうやめた）']
  ],
  qs:[
    {q:'I ___ practiced karate for ten years.',jp:'私は10年間空手を続けています。',a:'have',choices:['have','has','am'],exp:E('今も続いている → I have ＋ 過去分詞','I have practiced karate for ten years.','I has practiced karate.（I のときは have）','空手は今も手に持ってる → have'),xp:3},
    {q:'I ___ the piano for eight years. I stopped at twelve.',jp:'私は8年間ピアノを弾いていました。12歳でやめました。',a:'played',choices:['played','have played','play'],exp:E('もうやめた → 過去形','I played the piano for eight years.','I have played the piano for eight years.（今も続けている意味になる）','ピアノはもう手放した → 過去形'),xp:4},
    {q:'I have practiced karate ___ ten years.',jp:'私は10年間空手を続けています。',a:'for',choices:['for','since','ago'],exp:E('for ＋ 期間（ten years）','I have practiced karate for ten years.','I have practiced karate since ten years.','since のうしろは「始まった時」（since I was little）'),xp:3},
    {q:'I have ___ a karate tournament before.',jp:'私は前に空手の大会で優勝したことがあります。',a:'won',choices:['won','win','winning'],exp:E('have のうしろは過去分詞。win → won → won','I have won a karate tournament before.','I have win a karate tournament before.','before は経験の合図'),xp:3},
    {q:'I have ___ finished my karate practice.',jp:'私はもう空手の練習を終えました。',a:'already',choices:['already','yet','ago'],exp:E('「もう〜した」＝ already（ふつうの文）','I have already finished my karate practice.','I have yet finished my karate practice.','yet は疑問文・否定文で使う'),xp:3},
    {q:'Have you ___ seen Reiwa Roman’s manzai live?',jp:'令和ロマンの漫才を生で見たことがありますか。',a:'ever',choices:['ever','never','ago'],exp:E('経験の疑問文 → Have you ever 〜?','Have you ever seen Reiwa Roman’s manzai live?','Have you ago seen 〜?',''),xp:3},
    {q:'I have been ___ karate for ten years.',jp:'私は10年間ずっと空手をやり続けています。',a:'practicing',choices:['practicing','practiced','practice'],exp:E('have been ＋ 〜ing ＝ 現在完了進行形','I have been practicing karate for ten years.','I have been practiced karate.（受け身の形になってしまう）',''),xp:4},
    {q:'I ___ playing the piano when I was twelve.',jp:'私は12歳のときにピアノをやめました。',a:'stopped',choices:['stopped','have stopped','stop'],exp:E('when I was 〜 がある文は現在完了にしない → 過去形','I stopped playing the piano when I was twelve.','I have stopped playing the piano when I was twelve.','「いつ」をはっきり言う文は過去形'),xp:4}
  ],
  qb:[
    {jp:'私は10年間空手を続けています（今も続けている）。',a:'I have practiced karate for ten years.',exp:E('今も続いている → have ＋ practiced ＋ for','I have practiced karate for ten years.','I practiced karate for ten years.（もうやめた意味になる）',''),xp:7},
    {jp:'私は8年間ピアノを弾いていました（もうやめた）。',a:'I played the piano for eight years.',exp:E('もうやめた → 過去形','I played the piano for eight years.','I have played the piano for eight years.',''),xp:7}
  ],
  qc:[
    {jp:'私は10年間ずっと空手をやり続けています。',words:['I','have','been','practicing','karate','for','ten','years'],a:'I have been practicing karate for ten years.',exp:E('have been ＋ 〜ing ＋ for 期間','I have been practicing karate for ten years.','',''),xp:6}
  ]
};

// ----- S4 受け身×時制 -----
DATA[4]={type:'grammar',
  title:'④ 受け身：be のところだけ変わる',
  sub:'受け身は be ＋ 過去分詞。うしろはずっと同じ。',
  talk:[
    {who:'kyon',text:'にっくんに見張られる文なの！？'},
    {who:'shun',text:'きょんさん、変わるのは前の am のとこだけ。頭だけかぶりかえてる着ぐるみですわ。'}
  ],
  formula:'I '+H('am')+' watched by Nishimura.（見張られる）<br>I '+H('was')+' watched by Nishimura.（見張られた）<br>I '+H('will be')+' watched by Nishimura.（見張られるだろう）<br>I '+H('have been')+' watched by Nishimura.（ずっと見張られている）',
  ruleTitle:'気をつけること',
  rules:[
    'will のうしろは be、have のうしろは been'
  ],
  ex:[
    ['I was praised by my coach after the tournament.','大会のあと、私はコーチにほめられました。'],
    ['I will be invited to Kyon’s live show.','私はきょんのライブに招待されるでしょう。'],
    ['I am called a genius by Kyon.','私はきょんに天才と呼ばれています。']
  ],
  qs:[
    {q:'I ___ watched by Nishimura every day.',jp:'私は毎日、西村に見張られています。',a:'am',choices:['am','was','have'],exp:E('every day → 現在 → am ＋ 過去分詞','I am watched by Nishimura every day.','I was watched by Nishimura every day.',''),xp:3},
    {q:'I ___ praised by my coach after the tournament.',jp:'大会のあと、私はコーチにほめられました。',a:'was',choices:['was','am','have'],exp:E('「ほめられました」→ 過去 → was ＋ 過去分詞','I was praised by my coach after the tournament.','I am praised by my coach after the tournament.',''),xp:3},
    {q:'I will ___ invited to Kyon’s live show.',jp:'私はきょんのライブに招待されるでしょう。',a:'be',choices:['be','am','being'],exp:E('will のうしろは原形 → be','I will be invited to Kyon’s live show.','I will am invited to Kyon’s live show.',''),xp:4},
    {q:'I have ___ watched by Nishimura since this morning.',jp:'私は今朝からずっと西村に見張られています。',a:'been',choices:['been','be','being'],exp:E('have のうしろは過去分詞。be の過去分詞は been','I have been watched by Nishimura since this morning.','I have be watched by Nishimura.','be → was → been'),xp:4},
    {q:'I was ___ by Mrs. GREEN APPLE’s song.',jp:'私はミセスの歌に感動しました。',a:'moved',choices:['moved','move','moving'],exp:E('受け身 → be ＋ 過去分詞（moved ＝ 感動させられた）','I was moved by Mrs. GREEN APPLE’s song.','I was moving by 〜（「動いていた」になる）',''),xp:4},
    {q:'I am ___ a genius by Kyon.',jp:'私はきょんに天才と呼ばれています。',a:'called',choices:['called','call','calling'],exp:E('am ＋ 過去分詞','I am called a genius by Kyon.','I am calling a genius by Kyon.（「天才に電話している」になる）',''),xp:4},
    {q:'受け身の文はどれ？',jp:'「私はコーチにほめられた」',a:'I was praised by my coach.',choices:['I was praised by my coach.','I praised my coach.','I was praising my coach.'],exp:E('be ＋ 過去分詞 ＝ 受け身','I was praised by my coach.','I praised my coach.（私がコーチをほめた）／ I was praising my coach.（ほめている最中だった）',''),xp:4},
    {q:'I can ___ seen from the back of the hall.',jp:'会場のうしろからでも、私の姿は見えます（見られます）。',a:'be',choices:['be','am','been'],exp:E('助動詞のうしろは原形 → can be ＋ 過去分詞','I can be seen from the back of the hall.','I can am seen from the back of the hall.',''),xp:4}
  ],
  qb:[
    {jp:'私はきょんのライブに招待されました。',a:'I was invited to Kyon’s live show.',exp:E('過去の受け身 → was ＋ invited','I was invited to Kyon’s live show.','I invited to Kyon’s live show.（was がない）',''),xp:6},
    {jp:'私は毎日、西村に見張られています。',a:'I am watched by Nishimura every day.',exp:E('現在の受け身 → am ＋ watched','I am watched by Nishimura every day.','',''),xp:6}
  ],
  qc:[
    {jp:'私は今朝からずっと西村に見張られています。',words:['I','have','been','watched','by','Nishimura','since','this','morning'],a:'I have been watched by Nishimura since this morning.',exp:E('have been ＋ 過去分詞（現在完了の受け身）','I have been watched by Nishimura since this morning.','',''),xp:6}
  ]
};

// ----- S5 芸人でまとめ（主語はぜんぶ I）-----
DATA[5]={type:'grammar',
  title:'⑤ 芸人でまとめ',
  sub:'主語はずっと I。動詞だけが変わる。',
  talk:[
    {who:'kuruma',text:'きょんさん！主語は I のままで、動詞だけタイムマシンに乗せたらいいんすよ！'}
  ],
  formula:'I '+H('watch')+' 〜（毎日）→ I '+H('watched')+' 〜（去年）→ I '+H('am watching')+' 〜（今）→ I '+H('have seen')+' 〜（何回も）',
  ruleTitle:'迷ったら',
  rules:[
    '合図の語を見る（every day / last 〜 / now / many times）'
  ],
  ex:[
    ['I watch Reiwa Roman’s manzai every day.','私は毎日、令和ロマンの漫才を見ます。'],
    ['I watched the M-1 final last December.','私は去年の12月にM-1の決勝を見ました。'],
    ['I have seen Reiwa Roman’s manzai many times.','私は令和ロマンの漫才を何回も見たことがあります。']
  ],
  qs:[
    {q:'I ___ Reiwa Roman’s manzai every day.',jp:'私は毎日、令和ロマンの漫才を見ます。',a:'watch',choices:['watch','watched','watching'],exp:E('every day → 現在形','I watch Reiwa Roman’s manzai every day.','',''),xp:3},
    {q:'I ___ the M-1 final last December.',jp:'私は去年の12月にM-1の決勝を見ました。',a:'watched',choices:['watched','watch','have watched'],exp:E('last December → 過去形（現在完了にしない）','I watched the M-1 final last December.','I have watched the M-1 final last December.','last 〜 は過去の合図'),xp:3},
    {q:'I ___ going to go to Kyon’s live show next month.',jp:'私は来月、きょんのライブに行くつもりです。',a:'am',choices:['am','will','was'],exp:E('be going to ＋ 原形。I → am','I am going to go to Kyon’s live show next month.','I will going to go 〜',''),xp:3},
    {q:'I ___ laughing at Cotton’s comedy sketch now.',jp:'私は今、コットンのコントで笑っているところです。',a:'am',choices:['am','was','have'],exp:E('now → am ＋ 〜ing','I am laughing at Cotton’s comedy sketch now.','',''),xp:3},
    {q:'I have ___ Reiwa Roman’s manzai many times.',jp:'私は令和ロマンの漫才を何回も見たことがあります。',a:'seen',choices:['seen','saw','see'],exp:E('have のうしろは過去分詞。see → saw → seen','I have seen Reiwa Roman’s manzai many times.','I have saw 〜',''),xp:4},
    {q:'I have been laughing ___ Kuruma started talking.',jp:'くるまが話し始めてから、私はずっと笑っています。',a:'since',choices:['since','for','ago'],exp:E('since ＋ 始まった時','I have been laughing since Kuruma started talking.','I have been laughing for Kuruma started talking.','for のうしろは期間（for ten minutes）'),xp:4},
    {q:'I was surprised ___ Kuruma’s joke.',jp:'私はくるまのギャグに驚きました。',a:'at',choices:['at','in','to'],exp:E('be surprised at 〜 ＝ 〜に驚く','I was surprised at Kuruma’s joke.','',''),xp:4},
    {q:'I ___ invited to Kyon’s live show last week.',jp:'先週、私はきょんのライブに招待されました。',a:'was',choices:['was','am','have'],exp:E('last week → 過去の受け身 → was ＋ 過去分詞','I was invited to Kyon’s live show last week.','',''),xp:4}
  ],
  qb:[
    {jp:'私は令和ロマンの漫才を何回も見たことがあります。',a:'I have seen Reiwa Roman’s manzai many times.',exp:E('経験 → have ＋ seen','I have seen Reiwa Roman’s manzai many times.','',''),xp:7},
    {jp:'私はミセスの歌に感動しました。',a:'I was moved by Mrs. GREEN APPLE’s song.',exp:E('過去の受け身 → was ＋ moved','I was moved by Mrs. GREEN APPLE’s song.','',''),xp:7}
  ]
};

// ----- S6 確認テスト -----
DATA[6]={type:'test',
  title:'時制と受け身 確認テスト',
  sub:'全部まぜた22問。まちがえた問題は🔥特訓に入るから安心して。',
  talk:[
    {who:'kyon',text:'ed はエンディング！ ing は生中継！ have は今も手に持ってる！'}
  ],
  qs:[
    {q:'I ___ karate every week.',jp:'私は毎週空手を練習します。',a:'practice',choices:['practice','practiced','practicing'],exp:E('every week → 現在形','I practice karate every week.','',''),xp:3},
    {q:'I ___ the piano for eight years.',jp:'私は8年間ピアノを弾いていました（12歳でやめた）。',a:'played',choices:['played','have played','am playing'],exp:E('もうやめた → 過去形','I played the piano for eight years.','I have played the piano for eight years.（今も続けている意味）',''),xp:3},
    {q:'I have ___ karate for ten years.',jp:'私は10年間空手を続けています。',a:'practiced',choices:['practiced','practice','practicing'],exp:E('have ＋ 過去分詞','I have practiced karate for ten years.','',''),xp:3},
    {q:'I ___ practicing karate when Kyon called me.',jp:'きょんから電話が来たとき、私は空手を練習していました。',a:'was',choices:['was','am','have'],exp:E('過去の進行形 → was ＋ 〜ing','I was practicing karate when Kyon called me.','',''),xp:3},
    {q:'I will ___ karate tomorrow.',jp:'私は明日空手を練習するでしょう。',a:'practice',choices:['practice','practiced','practicing'],exp:E('will ＋ 原形','I will practice karate tomorrow.','',''),xp:3},
    {q:'I ___ been practicing karate for ten years.',jp:'私は10年間ずっと空手をやり続けています。',a:'have',choices:['have','am','was'],exp:E('現在完了進行形 → have been ＋ 〜ing','I have been practicing karate for ten years.','',''),xp:3},
    {q:'I stopped playing the piano ___ I was twelve.',jp:'私は12歳のときにピアノをやめました。',a:'when',choices:['when','for','since'],exp:E('when ＋ 主語 ＋ 動詞 ＝ 〜のとき','I stopped playing the piano when I was twelve.','',''),xp:3},
    {q:'I have practiced karate ___ I was a little child.',jp:'私は小さいころから空手を続けています。',a:'since',choices:['since','for','ago'],exp:E('since ＋ 始まった時','I have practiced karate since I was a little child.','I have practiced karate for I was a little child.',''),xp:4},
    {q:'I ___ Mrs. GREEN APPLE’s songs.',jp:'私はミセスの歌が大好きです。',a:'love',choices:['love','am loving','loving'],exp:E('love は進行形にしない','I love Mrs. GREEN APPLE’s songs.','I am loving Mrs. GREEN APPLE’s songs.',''),xp:4},
    {q:'Have you ever ___ Cotton’s live show?',jp:'コットンのライブを見たことがありますか。',a:'seen',choices:['seen','saw','see'],exp:E('Have you ever ＋ 過去分詞','Have you ever seen Cotton’s live show?','',''),xp:4},
    {q:'I ___ watched by Nishimura every day.',jp:'私は毎日、西村に見張られています。',a:'am',choices:['am','was','have'],exp:E('現在の受け身 → am ＋ 過去分詞','I am watched by Nishimura every day.','',''),xp:4},
    {q:'I ___ praised by my coach yesterday.',jp:'私は昨日、コーチにほめられました。',a:'was',choices:['was','am','have'],exp:E('yesterday → 過去の受け身 → was','I was praised by my coach yesterday.','',''),xp:4},
    {q:'I will ___ invited to the live show.',jp:'私はそのライブに招待されるでしょう。',a:'be',choices:['be','am','been'],exp:E('will のうしろは原形 be','I will be invited to the live show.','',''),xp:4},
    {q:'I have ___ watched by Nishimura since this morning.',jp:'私は今朝からずっと西村に見張られています。',a:'been',choices:['been','be','being'],exp:E('have ＋ been ＋ 過去分詞','I have been watched by Nishimura since this morning.','',''),xp:4},
    {q:'I was ___ by Kuruma’s funny answer.',jp:'私はくるまのおもしろい答えに驚きました。',a:'surprised',choices:['surprised','surprising','surprise'],exp:E('私が驚く → was surprised（受け身の形）','I was surprised by Kuruma’s funny answer.','I was surprising 〜（「私が人を驚かせていた」になる）',''),xp:4},
    {q:'正しい文はどれ？',jp:'「私は10年間空手を続けている（今も）」',a:'I have practiced karate for ten years.',choices:['I have practiced karate for ten years.','I practiced karate for ten years.','I am practice karate for ten years.'],exp:E('今も続いている → 現在完了','I have practiced karate for ten years.','I practiced karate for ten years.（もうやめた意味になる）',''),xp:4},
    {q:'正しい文はどれ？',jp:'「私は8年間ピアノを弾いていた（12歳でやめた）」',a:'I played the piano for eight years.',choices:['I played the piano for eight years.','I have played the piano for eight years.','I have been playing the piano for eight years.'],exp:E('もうやめた → 過去形','I played the piano for eight years.','have played / have been playing は「今も続けている」意味',''),xp:4},
    {q:'I had been practicing karate.',jp:'この文の「いつ？」を決めている語は？',a:'had',choices:['had','been','practicing'],exp:E('時を決めるのは先頭の1語。had ＝ 過去','I <strong>had</strong> been practicing karate.（過去完了進行形・高校）','','高校の形でも、ルールは同じ'),xp:4},
    {q:'I ___ going to watch the M-1 final this year.',jp:'私は今年M-1の決勝を見るつもりです。',a:'am',choices:['am','will','was'],exp:E('be going to ＋ 原形。I → am','I am going to watch the M-1 final this year.','',''),xp:4},
    {q:'I ___ the M-1 final last year.',jp:'私は去年M-1の決勝を見ました。',a:'watched',choices:['watched','have watched','watch'],exp:E('last year → 過去形（現在完了にしない）','I watched the M-1 final last year.','I have watched the M-1 final last year.',''),xp:4},
    {q:'If I ___ Kuruma, I would make everyone laugh.',jp:'もし私がくるまなら、みんなを笑わせるのに。',a:'were',choices:['were','am','be'],exp:E('現実とちがう → 1つ過去にずらす。I でも were','If I were Kuruma, I would make everyone laugh.','If I am Kuruma, 〜',''),xp:4},
    {q:'I wish I ___ play the piano like a pro.',jp:'プロみたいにピアノが弾けたらいいのに。',a:'could',choices:['could','can','will'],exp:E('I wish ＋ could ＋ 原形','I wish I could play the piano like a pro.','I wish I can play the piano like a pro.',''),xp:4}
  ]
};

// ----- S8 もしも（仮定法）：4つ目のスイッチ -----
// id は 8（確認テスト6・特訓7 の記録とずれないよう新しい番号）。タブでは「芸人でまとめ」と「確認テスト」の間
DATA[8]={type:'grammar',
  title:'⑥ もしも：過去形なのに「今」の話',
  sub:'現実とちがう「もしも」は、過去形にずらす。',
  talk:[
    {who:'shun',text:'きょんさん、過去形は「遠い」って意味なんです。現実から遠い「もしも」も、過去形を使うんですわ。'}
  ],
  formula:'If I '+H('were')+' Kuruma, I '+H('would')+' make everyone laugh.（もし私がくるまなら、みんなを笑わせるのに）<br>I wish I '+H('could')+' see Kyon’s live show.（きょんのライブが見られたらいいのに）',
  ruleTitle:'気をつけること',
  rules:[
    'be動詞は I でも were',
    '明日の雨のように本当に起こりうる話はずらさない：If it rains tomorrow, I will stay home.'
  ],
  ex:[
    ['If I were Kuruma, I would make everyone laugh.','もし私がくるまなら、みんなを笑わせるのに。'],
    ['If I still played the piano, I would play Mrs. GREEN APPLE’s songs.','もし今もピアノを弾いていたら、ミセスの曲を弾くのに。'],
    ['I wish I could see Kyon’s live show.','きょんのライブが見られたらいいのに。']
  ],
  qs:[
    {q:'If I ___ rich, I would buy a new piano.',jp:'もしお金持ちなら、新しいピアノを買うのに。',a:'were',choices:['were','am','will be'],exp:E('現実とちがう → 1つ過去にずらす。be動詞は I でも were','If I were rich, I would buy a new piano.','If I am rich, I would buy a new piano.','過去形は「現実から遠い」の印'),xp:3},
    {q:'If I were Kuruma, I ___ make everyone laugh.',jp:'もし私がくるまなら、みんなを笑わせるのに。',a:'would',choices:['would','will','am'],exp:E('結果の部分は would ＋ 原形（will を1つ過去にずらす）','If I were Kuruma, I would make everyone laugh.','If I were Kuruma, I will make everyone laugh.',''),xp:3},
    {q:'I wish I ___ as funny as Kuruma.',jp:'くるまくらいおもしろかったらいいのに。',a:'were',choices:['were','am','be'],exp:E('I wish ＋ 過去形。be動詞は were','I wish I were as funny as Kuruma.','I wish I am as funny as Kuruma.',''),xp:3},
    {q:'I wish I ___ see Kyon’s live show.',jp:'きょんのライブが見られたらいいのに。',a:'could',choices:['could','can','will'],exp:E('I wish ＋ could ＋ 原形（can を1つ過去にずらす）','I wish I could see Kyon’s live show.','I wish I can see Kyon’s live show.',''),xp:3},
    {q:'If I had more time, I would ___ karate every day.',jp:'もっと時間があれば、毎日空手を練習するのに。',a:'practice',choices:['practice','practiced','practicing'],exp:E('would のうしろは原形','If I had more time, I would practice karate every day.','I would practiced 〜',''),xp:3},
    {q:'If it ___ tomorrow, I will stay home.',jp:'もし明日雨が降ったら、家にいます。',a:'rains',choices:['rains','rained','would rain'],exp:E('本当に起こりうる話 → ずらさないふつうの if（現在形）','If it rains tomorrow, I will stay home.','If it rained tomorrow, I would stay home.（雨が「ありえない」意味になる）','見分け方：現実とちがう？ → ずらす ／ 起こりうる？ → ずらさない'),xp:4},
    {q:'If I were not busy, I could practice karate.',jp:'この文はいつの話？',a:'今（でも現実は忙しい）',choices:['今（でも現実は忙しい）','過去（昔は忙しくなかった）','未来（これから忙しくなくなる）'],exp:E('仮定法の過去形は「今」の話','今、もし忙しくなければ練習できるのに（実際は忙しい）','過去の話だと思う（were を見て「昔」と思わない）','「先頭の1語で時が決まる」のただ1つの例外'),xp:4},
    {q:'If I ___ the piano now, I would play Mrs. GREEN APPLE’s songs.',jp:'もし今もピアノを弾いていたら、ミセスの曲を弾くのに。',a:'played',choices:['played','play','have played'],exp:E('今のことでも、現実とちがう（もうやめた）→ 過去形にずらす','If I played the piano now, I would play Mrs. GREEN APPLE’s songs.','If I play the piano now, I would 〜',''),xp:4}
  ],
  qb:[
    {jp:'くるまくらいおもしろかったらいいのに。',a:'I wish I were as funny as Kuruma.',exp:E('I wish ＋ were','I wish I were as funny as Kuruma.','I wish I am as funny as Kuruma.',''),xp:6},
    {jp:'もし私がくるまなら、みんなを笑わせるのに。',a:'If I were Kuruma, I would make everyone laugh.',exp:E('If I were 〜, I would ＋ 原形','If I were Kuruma, I would make everyone laugh.','',''),xp:7}
  ]
};

// ===== INIT =====
updateXP();renderWeakBar();
(function(){
  var params=new URLSearchParams(location.search);
  var reqSec=parseInt(params.get('sec'),10);
  currentSection=(DATA[reqSec]||reqSec===TOKKU_SID)?reqSec:0;
  renderSectionTabs();renderSection(currentSection);
})();
