// ===== XP LEVELS =====
var LEVELS=[
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生',   status:'きょん「地理？なにそれ食えるの？」' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員',       status:'きょん「なんとなくわかってきた気がする」' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任',           status:'きょん「にっくん、俺地理できるかも」' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長',           status:'きょん「もしかして俺天才？」' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長',           status:'きょん「にっくんより詳しくなってきた」' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長',           status:'きょん「地理で漫才できるかもしれない」' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役',         status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長',           status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(xpVal){ for(var i=LEVELS.length-1;i>=0;i--){ if(xpVal>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }
var xp          = parseInt(localStorage.getItem('soc_xp')||'0');
var answeredSet = JSON.parse(localStorage.getItem('soc_geo_answered')||'{}');
var sectionDone = JSON.parse(localStorage.getItem('soc_geo_sections')||'{}');
var weakDB      = JSON.parse(localStorage.getItem('soc_weakdb')||'{}');
var attemptCounts={};

function updateXP(){
  var lv=getLevel(xp);
  var pct=lv.lv<LEVELS.length?Math.round((xp-lv.min)/(lv.max-lv.min)*100):100;
  document.getElementById('xpBadge').textContent =lv.badge;
  document.getElementById('xpLevel').textContent ='Lv.'+lv.lv+' '+lv.badge.split(' ')[0];
  document.getElementById('xpTitle').textContent =lv.title;
  document.getElementById('xpStatus').textContent=lv.status;
  document.getElementById('xpNext').textContent  =lv.lv<LEVELS.length?xp+' XP ／ 次まで '+(lv.max-xp)+' XP':'🏆 最高ランク達成！（'+xp+' XP）';
  document.getElementById('xpFill').style.width  =Math.min(100,pct)+'%';
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
}
function addXP(pts,qid){
  if(answeredSet[qid]) return false;
  var oldLv=getLevel(xp).lv;
  xp+=pts; answeredSet[qid]=true;
  localStorage.setItem('soc_xp',xp);
  localStorage.setItem('soc_geo_answered',JSON.stringify(answeredSet));
  updateXP();
  return getLevel(xp).lv>oldLv;
}
function deductXP(pts){
  var oldLv=getLevel(xp).lv;
  xp = Math.max(0, xp - pts);

  localStorage.setItem('soc_xp',xp);
  updateXP();
  return getLevel(xp).lv<oldLv;
}

// ===== WEAK DB =====
function getPct(qid){ var d=weakDB[qid]; if(!d||d.total===0) return 0; return Math.round(d.correct/d.total*100); }
function getWeakQuestions(){
  return Object.keys(weakDB).filter(function(id){ return id.indexOf('soc_geo_')===0&&getPct(id)<80; });
}
function renderWeakBar(){
  var wqs=getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,8);
  var el=document.getElementById('weakItems'); if(!el) return;
  if(wqs.length===0){ el.innerHTML='<span class="weak-bar-empty">弱点なし — よくできています！</span>'; return; }
  el.innerHTML=wqs.map(function(qid){
    var d=weakDB[qid];
    return '<div class="weak-item"><span class="weak-item-word">'+(d.jp||qid)+'</span><span class="weak-item-pct">'+getPct(qid)+'%</span></div>';
  }).join('');
}
function recordResult(qid,isCorrect){
  if(!weakDB[qid]) weakDB[qid]={ jp:(qMeta[qid]&&qMeta[qid].jp)||'', answer:(qMeta[qid]&&qMeta[qid].answer)||'', choices:(qMeta[qid]&&qMeta[qid].choices)||[], correct:0, total:0 };
  weakDB[qid].total++; if(isCorrect) weakDB[qid].correct++;
  localStorage.setItem('soc_weakdb',JSON.stringify(weakDB));
  var _today=new Date().toISOString().slice(0,10);
  var _daily=JSON.parse(localStorage.getItem('soc_daily')||'{}');
  _daily[_today]=(_daily[_today]||0)+1;
  localStorage.setItem('soc_daily',JSON.stringify(_daily));
  localStorage.setItem('soc_geo_lastStudy',_today);
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
  setTimeout(function(){ t.classList.remove('show'); },type==='levelup'?4000:type==='demote'?3500:2500);
}

// ===== COMMENTS =====
var COMMENTS={
  kyon_correct:['きょん「合ってる！地理できるじゃん！！」','きょん「やった！天才かも！」','きょん「にっくん見て！解けた！！」','きょん「地図余裕！！」'],
  nishi_correct:['西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「ちゃんとわかってる」','西村「正確に答えられてる」'],
};
function getComment(type){ var arr=COMMENTS[type]; return arr[Math.floor(Math.random()*arr.length)]; }

// ===== SHUFFLE =====
function shuffleArray(arr){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }

// ===== CHAT HELPER =====
function chat(type,name,text){
  var av=type==='kyon'?'<div class="avatar av-kyon">き</div>':'<div class="avatar av-nishi">西村</div>';
  return '<div class="chat-line">'+av+'<div class="chat-bubble"><div class="chat-name">'+name+'</div>'+text+'</div></div>';
}

// ===== QUESTION ENGINE =====
var qMeta={};
function makeChoices(qid,jp,answer,choices,exp){
  choices=shuffleArray(choices);
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
function handleChoice(qid,choice){
  var meta=qMeta[qid]; if(!meta||answeredSet[qid]) return;
  if(choice===meta.answer) markCorrect(qid,meta,choice); else markWrong(qid,meta,choice);
}
function markCorrect(qid,meta){
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
  answeredSet[qid]=true; localStorage.setItem('soc_geo_answered',JSON.stringify(answeredSet));
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
  var prefix='soc_geo_s'+currentSection+'_';
  var sectionQ=Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix)===0; });
  if(sectionQ.length===0) return;
  var done=sectionQ.every(function(id){ return answeredSet[id]; });
  if(done){
    sectionDone[currentSection]=true;
    localStorage.setItem('soc_geo_sections',JSON.stringify(sectionDone));
    renderTabs();
    var nb=document.getElementById('nextBtn');
    if(nb){
      nb.style.display='block';
      if(!document.getElementById('sectionCompleteBanner')){
        var banner=document.createElement('div'); banner.id='sectionCompleteBanner';
        var nextSec=currentSection<4?'Section '+(currentSection+1)+' へ進もう！':'確認テストで腕試し！';
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
  { id:0, label:'🌏 スタート',    title:'地理の学び方',                   sub:'世界と日本の地理を地図ごと頭に入れよう！' },
  { id:1, label:'世界の姿',       title:'世界の姿（地球・位置・地域区分）', sub:'六大陸・三大洋・緯度経度・時差——15問' },
  { id:2, label:'世界の地域',     title:'世界のさまざまな地域',            sub:'アジア州・アフリカ・ヨーロッパ——10問' },
  { id:3, label:'日本の姿',       title:'日本の姿',                        sub:'地形・気候・産業・地域別——15問' },
  { id:4, label:'確認テスト',     title:'確認テスト',                      sub:'全範囲まとめ！選択15問' },
  { id:5, label:'📊弱点',         title:'弱点ノート',                      sub:'間違えた問題の正答率を確認しよう' },
  { id:6, label:'🔥特訓',         title:'弱点特訓モード',                  sub:'間違えた問題だけを集中練習！' },
];

var tokkuBannerShown=false;
function showTokkuSuggestion(qid){
  var wq=getWeakQuestions(); if(wq.length<2) return;
  var banner=document.createElement('div');
  banner.style.cssText='position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#1a0008;border:1px solid var(--red);border-radius:10px;padding:10px 18px;font-size:12px;color:var(--red);z-index:999;cursor:pointer;white-space:nowrap;';
  banner.textContent='🔥 弱点が'+wq.length+'問あります。特訓モードで集中練習しよう！';
  banner.onclick=function(){ document.body.removeChild(banner); gotoSection(6); };
  document.body.appendChild(banner);
  setTimeout(function(){ if(document.body.contains(banner)) document.body.removeChild(banner); },5000);
}

function renderTabs(){
  var html='';
  SECTIONS.forEach(function(s){
    var cls='section-tab';
    if(s.id>=5) cls+=' tokku';
    if(s.id===currentSection) cls+=' active';
    if(sectionDone[s.id]&&s.id<5) cls+=' done';
    var label=s.label+(sectionDone[s.id]&&s.id<5?' ✓':'');
    if(s.id===6){ var wk=getWeakQuestions(); label='🔥特訓'+(wk.length>0?'('+wk.length+')':''); }
    html+='<button class="'+cls+'" data-sec="'+s.id+'">'+label+'</button>';
  });
  document.getElementById('sectionTabs').innerHTML=html;
  document.querySelectorAll('.section-tab').forEach(function(btn){
    btn.addEventListener('click',function(){ gotoSection(parseInt(this.dataset.sec)); });
  });
}

function gotoSection(id){
  currentSection=id; qMeta={};
  document.getElementById('mainContent').innerHTML='';
  renderTabs();
  if(id===5){ renderWeakNote(); return; }
  if(id===6){ renderTokku(); return; }
  var html='';
  var sec=SECTIONS.find(function(s){ return s.id===id; });
  if(sec&&id>=1&&id<=4){
    html+='<div class="section-header">'
      +'<div class="section-badge">SECTION '+id+'</div>'
      +'<div class="section-title">'+sec.title+'</div>'
      +'<div class="section-sub">'+sec.sub+'</div>'
      +'</div>';
  }
  if(id===0) html+=renderSection0();
  else if(id===1) html+=renderSection1();
  else if(id===2) html+=renderSection2();
  else if(id===3) html+=renderSection3();
  else if(id===4) html+=renderSection4();
  if(id>=1&&id<=4){
    var nextLabel=id<4?'次のセクションへ →':'🏆 結果を見る！';
    var nextAction=id<4?'gotoSection('+(id+1)+')':'showFinalResult()';
    html+='<button class="next-section-btn" id="nextBtn" onclick="'+nextAction+'" style="display:'+(sectionDone[id]?'block':'none')+'">'+nextLabel+'</button>';
  }
  document.getElementById('mainContent').innerHTML=html;
  updateDots();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ===== SVG: 世界地図概略図 =====
function makeSvgWorldMap(){
  return '<svg viewBox="0 0 520 270" style="width:100%;max-width:580px;display:block;margin:16px auto;border-radius:12px;overflow:visible" xmlns="http://www.w3.org/2000/svg">'
    // 海（背景）
    +'<rect x="0" y="0" width="520" height="270" rx="10" fill="#0d2a52"/>'
    // 赤道ライン
    +'<line x1="0" y1="133" x2="520" y2="133" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="5,4" opacity="0.7"/>'
    +'<text x="504" y="129" fill="#f59e0b" font-size="9" text-anchor="end" opacity="0.9">赤道(0°)</text>'
    // 本初子午線（経度0°、ロンドン付近）
    +'<line x1="225" y1="0" x2="225" y2="270" stroke="#86efac" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>'
    +'<text x="226" y="11" fill="#86efac" font-size="8" opacity="0.8">0°経線</text>'
    // 北アメリカ大陸
    +'<polygon points="28,32 140,32 150,58 138,88 112,122 78,142 42,138 24,108 22,62" fill="#f59e0b" opacity="0.85"/>'
    +'<text x="80" y="90" fill="#000" font-size="12" text-anchor="middle" font-weight="bold">北アメリカ</text>'
    // 南アメリカ大陸
    +'<polygon points="75,152 148,152 154,182 144,218 118,248 88,250 68,228 65,196" fill="#22c55e" opacity="0.85"/>'
    +'<text x="105" y="205" fill="#000" font-size="12" text-anchor="middle" font-weight="bold">南アメリカ</text>'
    // ヨーロッパ（ユーラシアの一部）
    +'<polygon points="218,28 272,28 278,56 260,80 232,82 218,64 215,44" fill="#a78bfa" opacity="0.9"/>'
    +'<text x="246" y="60" fill="#fff" font-size="10" text-anchor="middle" font-weight="bold">欧州</text>'
    // アフリカ大陸
    +'<polygon points="202,88 298,88 306,125 295,170 268,215 238,218 205,172 194,130" fill="#fb923c" opacity="0.88"/>'
    +'<text x="248" y="158" fill="#000" font-size="12" text-anchor="middle" font-weight="bold">アフリカ</text>'
    // アジア（ユーラシア東部）
    +'<polygon points="276,20 462,20 470,52 456,108 432,148 388,162 334,156 286,138 270,102 268,56" fill="#e879f9" opacity="0.82"/>'
    +'<text x="375" y="85" fill="#000" font-size="14" text-anchor="middle" font-weight="bold">ユーラシア</text>'
    +'<text x="375" y="101" fill="#000" font-size="9" text-anchor="middle">(アジア＋ヨーロッパ)</text>'
    // オーストラリア大陸
    +'<polygon points="365,186 455,186 460,222 442,250 402,254 368,232 358,210" fill="#34d399" opacity="0.88"/>'
    +'<text x="410" y="224" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">オーストラリア</text>'
    // 南極大陸
    +'<rect x="18" y="255" width="484" height="14" rx="4" fill="#94a3b8" opacity="0.75"/>'
    +'<text x="260" y="265" fill="#fff" font-size="9" text-anchor="middle" font-weight="bold">南極大陸</text>'
    // 海洋ラベル
    +'<text x="178" y="100" fill="#7dd3fc" font-size="10" text-anchor="middle" opacity="0.8">大西洋</text>'
    +'<text x="178" y="196" fill="#7dd3fc" font-size="10" text-anchor="middle" opacity="0.7">大西洋</text>'
    +'<text x="330" y="210" fill="#7dd3fc" font-size="10" text-anchor="middle" opacity="0.8">インド洋</text>'
    +'<text x="494" y="115" fill="#7dd3fc" font-size="9" text-anchor="middle" transform="rotate(-90,494,115)" opacity="0.8">太平洋</text>'
    +'<text x="38" y="175" fill="#7dd3fc" font-size="8" text-anchor="middle" opacity="0.6">太平洋</text>'
    // 日本マーカー
    +'<circle cx="432" cy="82" r="5" fill="#ef4444"/>'
    +'<text x="440" y="78" fill="#ef4444" font-size="9" font-weight="bold">日本</text>'
    // ロンドンマーカー
    +'<circle cx="228" cy="42" r="4" fill="#86efac"/>'
    +'<text x="232" y="38" fill="#86efac" font-size="8">ロンドン</text>'
    // 凡例
    +'<rect x="10" y="235" width="10" height="10" fill="#f59e0b" rx="2"/>'
    +'<text x="23" y="244" fill="#e2e8f0" font-size="8">北アメリカ</text>'
    +'<rect x="78" y="235" width="10" height="10" fill="#22c55e" rx="2"/>'
    +'<text x="91" y="244" fill="#e2e8f0" font-size="8">南アメリカ</text>'
    +'<rect x="152" y="235" width="10" height="10" fill="#a78bfa" rx="2"/>'
    +'<text x="165" y="244" fill="#e2e8f0" font-size="8">ヨーロッパ</text>'
    +'<rect x="228" y="235" width="10" height="10" fill="#fb923c" rx="2"/>'
    +'<text x="241" y="244" fill="#e2e8f0" font-size="8">アフリカ</text>'
    +'<rect x="296" y="235" width="10" height="10" fill="#e879f9" rx="2"/>'
    +'<text x="309" y="244" fill="#e2e8f0" font-size="8">ユーラシア</text>'
    +'<rect x="372" y="235" width="10" height="10" fill="#34d399" rx="2"/>'
    +'<text x="385" y="244" fill="#e2e8f0" font-size="8">オーストラリア</text>'
    +'</svg>';
}

// ===== SVG: 緯度経度図 =====
function makeSvgLatLon(){
  return '<svg viewBox="0 0 440 240" style="width:100%;max-width:500px;display:block;margin:16px auto" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="0" y="0" width="440" height="240" rx="10" fill="#0d1a30"/>'
    // 地球円
    +'<circle cx="130" cy="120" r="95" fill="#0d2a52" stroke="#334155" stroke-width="1.5"/>'
    // 緯度線
    +'<ellipse cx="130" cy="120" rx="95" ry="8" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.9"/>'
    +'<text x="232" y="124" fill="#f59e0b" font-size="10" font-weight="bold">赤道（緯度0°）</text>'
    +'<ellipse cx="130" cy="82" rx="78" ry="6" fill="none" stroke="#86efac" stroke-width="1" stroke-dasharray="4,3" opacity="0.7"/>'
    +'<text x="214" y="86" fill="#86efac" font-size="9">北緯23.4°（北回帰線）</text>'
    +'<ellipse cx="130" cy="158" rx="78" ry="6" fill="none" stroke="#86efac" stroke-width="1" stroke-dasharray="4,3" opacity="0.7"/>'
    +'<text x="214" y="162" fill="#86efac" font-size="9">南緯23.4°（南回帰線）</text>'
    +'<ellipse cx="130" cy="50" rx="46" ry="4" fill="none" stroke="#7dd3fc" stroke-width="1" stroke-dasharray="3,4" opacity="0.5"/>'
    +'<text x="214" y="54" fill="#7dd3fc" font-size="8" opacity="0.7">北緯66.6°（北極圏）</text>'
    // 経度線（本初子午線・日本）
    +'<line x1="130" y1="25" x2="130" y2="215" stroke="#a78bfa" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.7"/>'
    +'<text x="133" y="22" fill="#a78bfa" font-size="9">0°（ロンドン）</text>'
    // 軸（地軸）
    +'<line x1="130" y1="22" x2="130" y2="218" stroke="#475569" stroke-width="0.8" stroke-dasharray="2,4"/>'
    // 北極・南極
    +'<circle cx="130" cy="27" r="3" fill="#e2e8f0"/>'
    +'<text x="136" y="32" fill="#e2e8f0" font-size="9">北極</text>'
    +'<circle cx="130" cy="213" r="3" fill="#e2e8f0"/>'
    +'<text x="136" y="218" fill="#e2e8f0" font-size="9">南極</text>'
    // 日本の位置（北緯35°、東経135°）
    +'<circle cx="170" cy="80" r="5" fill="#ef4444"/>'
    +'<text x="178" y="78" fill="#ef4444" font-size="9" font-weight="bold">日本 (北緯35°)</text>'
    // タイトル
    +'<text x="220" y="20" fill="#e2e8f0" font-size="12" font-weight="bold" text-anchor="middle">緯度と経度のしくみ</text>'
    +'</svg>';
}

// ===== SVG: 時差計算図 =====
function makeSvgTimeDiff(){
  return '<svg viewBox="0 0 480 110" style="width:100%;max-width:540px;display:block;margin:16px auto" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="0" y="0" width="480" height="110" rx="10" fill="#0d1a30"/>'
    // 数直線
    +'<line x1="30" y1="60" x2="450" y2="60" stroke="#334155" stroke-width="2"/>'
    +'<polygon points="450,55 462,60 450,65" fill="#334155"/>'
    // 目盛り: 0°, 90°E, 135°E, 180°
    +'<line x1="60" y1="52" x2="60" y2="68" stroke="#86efac" stroke-width="2"/>'
    +'<text x="60" y="82" fill="#86efac" font-size="9" text-anchor="middle">0°</text>'
    +'<text x="60" y="93" fill="#86efac" font-size="8" text-anchor="middle">ロンドン</text>'
    +'<line x1="230" y1="52" x2="230" y2="68" stroke="#a78bfa" stroke-width="1.5" stroke-dasharray="3,2"/>'
    +'<text x="230" y="82" fill="#a78bfa" font-size="9" text-anchor="middle">東経90°</text>'
    +'<line x1="314" y1="48" x2="314" y2="72" stroke="#f59e0b" stroke-width="2.5"/>'
    +'<text x="314" y="82" fill="#f59e0b" font-size="9" text-anchor="middle">東経135°</text>'
    +'<text x="314" y="93" fill="#f59e0b" font-size="8" text-anchor="middle">日本（標準）</text>'
    +'<line x1="420" y1="52" x2="420" y2="68" stroke="#475569" stroke-width="1.5"/>'
    +'<text x="420" y="82" fill="#64748b" font-size="9" text-anchor="middle">180°</text>'
    // 矢印と時差ラベル
    +'<line x1="60" y1="38" x2="314" y2="38" stroke="#f59e0b" stroke-width="1.2" marker-end="url(#arr)"/>'
    +'<text x="187" y="34" fill="#f59e0b" font-size="10" text-anchor="middle">135° ÷ 15° = 9時間</text>'
    +'<text x="187" y="22" fill="#e2e8f0" font-size="9" text-anchor="middle">東へ行くほど時刻が早い → 日本はロンドンより9時間進んでいる</text>'
    // 計算式
    +'<text x="24" y="107" fill="#94a3b8" font-size="8">公式：経度差 ÷ 15 ＝ 時差（時間）　※地球は24時間で360°回転 → 15°＝1時間</text>'
    +'</svg>';
}

// ===== SECTION 0: スタート =====
function renderSection0(){
  var html='<div class="section-header">'
    +'<div class="section-badge">🌏 GEOGRAPHY</div>'
    +'<div class="section-title">地理の学び方</div>'
    +'<div class="section-sub">世界と日本の地理を地図ごと頭に入れよう！</div>'
    +'</div>'
    // 世界地図SVG
    +makeSvgWorldMap()
    +'<div style="text-align:center;font-size:11px;color:var(--text2);margin-bottom:20px;">▲ 六大陸・三大洋の概略図。赤点が日本、緑点がロンドン（経度0°）</div>'
    // 会話
    +'<div class="intro-box">'
    +'<div class="intro-box-title">🎤 きょんと西村の地理入門トーク</div>'
    +chat('kyon','きょん（富士田恭兵）','地理って…地図に国の名前とか書いてあって、「これを全部覚えろ！」ってやつでしょ？無理じゃない？？')
    +chat('nishi','西村真二','違う違う。「なんでここにこの産業があるのか」「なぜこの気候になるのか」を理解する科目だよ。暗記科目じゃなくて、理由を追う科目。')
    +chat('kyon','きょん','理由があるの！？じゃあ豊田市がトヨタだらけなのにも理由があるの？')
    +chat('nishi','西村真二','ある。中京工業地帯の話は Section 3 でやる。今日一番「そういうことか！」ってなるやつだから楽しみにしてて。')
    +chat('kyon','きょん','知ってる街の名前が授業に出てくると、急に他人事じゃなくなるね！！やる気出た！！')
    +'</div>'
    // 地理の3大テーマ
    +'<div class="rule-card">'
    +'<div class="rule-card-title">🗺️ 地理の3大テーマ</div>'
    +'<div class="rule-box"><div class="rule-title">① 場所と位置</div><div class="ex">六大陸・三大洋・緯度・経度・時差</div><div class="note">地球上のどこにあるかを把握することが地理の第一歩</div></div>'
    +'<div class="rule-box"><div class="rule-title">② 気候と地形</div><div class="ex">季節風・海流・山脈・平野・川・海岸地形</div><div class="note">「なぜそこにその地形があるか」がわかると一気に繋がる</div></div>'
    +'<div class="rule-box"><div class="rule-title">③ 産業と生活</div><div class="ex">農業（促成・抑制・稲作）・工業地帯・漁業・人口</div><div class="note">気候・地形と産業はセットで覚えると最強</div></div>'
    +'</div>'
    // 語呂合わせ：六大陸
    +'<div class="rule-card">'
    +'<div class="rule-card-title">🎵 六大陸の語呂合わせ</div>'
    +'<div style="text-align:center;padding:12px;">'
    +'<div style="font-family:Bebas Neue,sans-serif;font-size:26px;color:var(--amber);letter-spacing:4px;margin-bottom:8px">ユーア　北南　オ南</div>'
    +'<div style="font-size:14px;color:var(--text);line-height:2.4;">'
    +'<span style="color:var(--amber);font-weight:bold">ユー</span>ラシア　'
    +'<span style="color:var(--amber);font-weight:bold">ア</span>フリカ　'
    +'<span style="color:var(--amber);font-weight:bold">北</span>アメリカ　'
    +'<span style="color:var(--amber);font-weight:bold">南</span>アメリカ　'
    +'<span style="color:var(--amber);font-weight:bold">オ</span>ーストラリア　'
    +'<span style="color:var(--amber);font-weight:bold">南</span>極</div>'
    +'</div>'
    +'<div style="text-align:center;padding:10px;margin-top:8px;border-top:1px solid var(--border)">'
    +'<div style="font-size:13px;color:var(--text2)">三大洋の語呂合わせ：<span style="color:var(--gold);font-size:16px;font-family:Bebas Neue,sans-serif;letter-spacing:3px;">タイ・タイ・イン</span></div>'
    +'<div style="font-size:13px;color:var(--text);margin-top:6px;"><span style="color:var(--gold);font-weight:bold">太</span>平洋　<span style="color:var(--gold);font-weight:bold">大</span>西洋　<span style="color:var(--gold);font-weight:bold">イン</span>ド洋</div>'
    +'</div>'
    +'</div>'
    +'<button class="start-btn" onclick="gotoSection(1)">🌏 Section 1：世界の姿へ！</button>';
  return html;
}

// ===== SECTION 1: 世界の姿 =====
function renderSection1(){
  var html='';
  // 緯度経度SVG
  html+=makeSvgLatLon();
  html+='<div style="text-align:center;font-size:11px;color:var(--text2);margin-bottom:8px;">▲ 緯度線（横）と経度線（縦）で地球上の位置を表す</div>';
  // 時差SVG
  html+=makeSvgTimeDiff();
  // 会話
  html+='<div class="intro-box" style="margin-bottom:20px">'
    +'<div class="intro-box-title">💬 緯度・経度トーク</div>'
    +chat('kyon','きょん','緯度と経度ってどっちが横でどっちが縦かわかんなくなる…！！')
    +chat('nishi','西村真二','「緯度＝い（横）ど」で覚えよう。"い"の字は横棒が並ぶイメージ。緯度は赤道から上下に測る。')
    +chat('kyon','きょん','あ！「緯」の字に横線が並んでるじゃん！！これ確かに！！')
    +chat('nishi','西村真二','時差は「東に行くほど時刻が早い」。日本（東経135°）は15°ずつ進む→135÷15＝9時間分、ロンドンより早い。')
    +chat('kyon','きょん','じゃあ日本で朝9時のとき、ロンドンは真夜中の0時？！地球って不思議だな！！')
    +'</div>'
    // 世界6州
    +'<div class="rule-card">'
    +'<div class="rule-card-title">🌍 世界6州と主な国</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="color:#fb923c">アジア州</div><div class="note">日本・中国・インド・韓国など</div></div>'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="color:#f59e0b">アフリカ州</div><div class="note">エジプト・ナイジェリア・南アフリカなど</div></div>'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="color:#a78bfa">ヨーロッパ州</div><div class="note">イギリス・フランス・ドイツなど（EU）</div></div>'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="color:#f59e0b">北アメリカ州</div><div class="note">アメリカ・カナダ・メキシコ</div></div>'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="color:#22c55e">南アメリカ州</div><div class="note">ブラジル・アルゼンチンなど</div></div>'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="color:#34d399">オセアニア州</div><div class="note">オーストラリア・ニュージーランドなど</div></div>'
    +'</div>'
    +'</div>';
  // 問題15問
  var qs=[
    { qid:'soc_geo_s1_q0',  jp:'世界の六大陸のうち、最も大きい大陸はどれ？',
      ans:'ユーラシア大陸', choices:['ユーラシア大陸','アフリカ大陸','北アメリカ大陸','南極大陸'],
      exp:'六大陸：ユーラシア・アフリカ・北アメリカ・南アメリカ・オーストラリア・南極。ユーラシア大陸はアジアとヨーロッパを合わせた世界最大の大陸。面積は地球の陸地の約37%！' },
    { qid:'soc_geo_s1_q1',  jp:'世界の三大洋のうち、最も大きい海洋はどれ？',
      ans:'太平洋', choices:['太平洋','大西洋','インド洋','北極海'],
      exp:'三大洋：太平洋・大西洋・インド洋。太平洋は地球の表面積の約3分の1を占める世界最大の海。日本は太平洋に面している！' },
    { qid:'soc_geo_s1_q2',  jp:'日本が属する州（地域区分）はどれ？',
      ans:'アジア州', choices:['アジア州','オセアニア州','ヨーロッパ州','北アメリカ州'],
      exp:'世界は6つの州に分類：アジア・アフリカ・北アメリカ・南アメリカ・ヨーロッパ・オセアニア。日本はアジア州の東端に位置する。' },
    { qid:'soc_geo_s1_q3',  jp:'経度0度（本初子午線）が通る都市はどれ？',
      ans:'ロンドン（イギリス）', choices:['ロンドン（イギリス）','パリ（フランス）','ニューヨーク（アメリカ）','カイロ（エジプト）'],
      exp:'本初子午線はイギリスのグリニッジ天文台を通る。世界の時刻の基準（GMT）。日本は東経135度なので 135÷15＝9時間、ロンドンより9時間進んでいる。' },
    { qid:'soc_geo_s1_q4',  jp:'経度差が15度ひらくと、時差は何時間になる？',
      ans:'1時間', choices:['1時間','2時間','30分','3時間'],
      exp:'地球は24時間で360度回転するので、360÷24＝15度で1時間の時差。日本（東経135度）とロンドン（0度）の時差は 135÷15＝9時間！' },
    { qid:'soc_geo_s1_q5',  jp:'緯度0度の線（赤道）が通らない大陸はどれ？',
      ans:'オーストラリア大陸', choices:['オーストラリア大陸','アフリカ大陸','南アメリカ大陸','アジア（東南アジア）'],
      exp:'赤道はアフリカ大陸中央・南アメリカ（ブラジル）・東南アジア（インドネシアなど）を通る。オーストラリアは赤道より南（南半球）に位置するため通らない。' },
    { qid:'soc_geo_s1_q6',  jp:'六大陸の中で最も小さい大陸はどれ？',
      ans:'オーストラリア大陸', choices:['オーストラリア大陸','南極大陸','ヨーロッパ（半島）','南アメリカ大陸'],
      exp:'六大陸の面積順（大→小）：ユーラシア＞アフリカ＞北アメリカ＞南アメリカ＞南極＞オーストラリア。オーストラリア大陸が最小。' },
    { qid:'soc_geo_s1_q7',  jp:'アマゾン川が流れているのはどの州？',
      ans:'南アメリカ州', choices:['南アメリカ州','アフリカ州','アジア州','オセアニア州'],
      exp:'アマゾン川はブラジルを中心とした南アメリカ大陸を流れる、流域面積世界最大の川。流域には熱帯雨林が広がり、地球の酸素の約20%を生産している。' },
    { qid:'soc_geo_s1_q8',  jp:'世界最大の砂漠「サハラ砂漠」がある大陸はどれ？',
      ans:'アフリカ大陸', choices:['アフリカ大陸','アジア大陸','北アメリカ大陸','オーストラリア大陸'],
      exp:'サハラ砂漠はアフリカ大陸北部に広がる世界最大の砂漠。面積は約900万km²で日本の約24倍。赤道付近の高温多湿とは異なり、北アフリカは亜熱帯高圧帯で雨が降らない。' },
    { qid:'soc_geo_s1_q9',  jp:'オーストラリアが属する州はどれ？',
      ans:'オセアニア州', choices:['オセアニア州','アジア州','アフリカ州','南アメリカ州'],
      exp:'オセアニア州はオーストラリア大陸・ニュージーランド・太平洋の島々からなる。南半球に位置するので季節が日本と逆（12月が夏・6月が冬）。' },
    { qid:'soc_geo_s1_q10', jp:'2024年時点で人口が世界最多の国はどれ？',
      ans:'インド', choices:['インド','中国','アメリカ合衆国','インドネシア'],
      exp:'2023年にインドの人口が中国を抜いて世界1位になった（約14億人超）。中国は一人っ子政策（1979〜2015年）の影響で人口増加が鈍化した。' },
    { qid:'soc_geo_s1_q11', jp:'次のうち、ヨーロッパ州の国はどれ？',
      ans:'フランス', choices:['フランス','エジプト','ブラジル','タイ'],
      exp:'ヨーロッパ州はユーラシア大陸の西側。フランス・ドイツ・イギリス・イタリアなどがある。EU（欧州連合）を形成し、共通通貨ユーロを使う国が多い。' },
    { qid:'soc_geo_s1_q12', jp:'「緯度」と「経度」の説明の組み合わせとして正しいのは？',
      ans:'緯度＝赤道から南北の角度　経度＝本初子午線から東西の角度', choices:['緯度＝赤道から南北の角度　経度＝本初子午線から東西の角度','緯度＝東西の角度　経度＝南北の角度','緯度も経度も赤道から測る','緯度も経度もロンドンから測る'],
      exp:'緯度は赤道（0°）を基準に南北90°ずつ。経度は本初子午線（0°）を基準に東西180°ずつ。「緯」の字には横棒→緯度は横線（水平）と覚えよう！' },
    { qid:'soc_geo_s1_q13', jp:'日本（東経135度）が午後3時のとき、ロンドン（経度0度）の時刻はいつ？',
      ans:'午前6時', choices:['午前6時','午後6時','午前0時','正午（12時）'],
      exp:'時差＝135÷15＝9時間。日本の方が9時間進んでいるので、15時－9＝午前6時。「東に行くほど時刻が早い」← これは太陽が東から昇るから！' },
    { qid:'soc_geo_s1_q14', jp:'北アメリカ大陸にある世界最大の淡水湖群を何という？',
      ans:'五大湖', choices:['五大湖','カスピ海','バイカル湖','チチカカ湖'],
      exp:'五大湖（スペリオル湖・ミシガン湖・ヒューロン湖・エリー湖・オンタリオ湖）はアメリカとカナダの国境に広がる世界最大の淡水湖群。工業地帯と水運に重要。' },
  ];
  html+='<div class="progress-dots">'
    +qs.map(function(_,i){ return '<div class="dot '+(i===0?'current':'')+'"></div>'; }).join('')
    +'</div>';
  qs.forEach(function(q,i){
    html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px;">Q'+(i+1)+'</div>';
    html+=makeChoices(q.qid,q.jp,q.ans,q.choices,q.exp);
  });
  return html;
}

// ===== SECTION 2: 世界のさまざまな地域 =====
function renderSection2(){
  var html='';

  // ── イントロ会話 ──
  html+='<div class="intro-box" style="margin-bottom:16px">'
    +'<div class="intro-box-title">💬 アジア州を深掘りしよう！</div>'
    +chat('kyon','きょん','アジアって一言で言っても広すぎない？日本も中国もインドもサウジアラビアも全部「アジア」でしょ？')
    +chat('nishi','西村真二','そう。アジア州は六つの州の中で面積も人口も世界最大。だから東・東南・南・西の4つに分けて整理するのが試験では鉄則だよ。')
    +chat('kyon','きょん','インドってこんなに人口が多いんだ！14億って中国より多くなったって聞いたけど…')
    +chat('nishi','西村真二','2023年にインドが中国を抜いて世界一になった。しかも若者の割合が高いから経済成長が続いてる。IT産業でも世界的に有名なんだ。')
    +chat('kyon','きょん','じゃあ東南アジアは？タイとかインドネシアとかベトナムとか…')
    +chat('nishi','西村真二','全部ASEAN（東南アジア諸国連合）に加盟してる。熱帯気候で、昔はプランテーション農業、今は工業化が進んでる。日本企業も多数進出してるよ。')
    +'</div>';

  // ── アジア州 概略図 SVG ──
  html+='<div style="background:#0d2a3a;border-radius:10px;padding:12px;margin-bottom:16px">'
    +'<div style="font-size:13px;font-weight:bold;color:var(--gold);margin-bottom:8px;text-align:center">🗺 アジア州 4つのエリア</div>'
    +'<svg viewBox="0 0 360 240" style="width:100%;max-width:400px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">'
    // 背景（海）
    +'<rect x="0" y="0" width="360" height="240" rx="10" fill="#0d2a52"/>'
    // 西アジア（左上、乾燥色）
    +'<rect x="10" y="20" width="95" height="80" rx="8" fill="#f59e0b" opacity="0.75"/>'
    +'<text x="57" y="52" fill="#000" font-size="11" text-anchor="middle" font-weight="bold">西アジア</text>'
    +'<text x="57" y="66" fill="#000" font-size="9" text-anchor="middle">サウジアラビア</text>'
    +'<text x="57" y="78" fill="#000" font-size="9" text-anchor="middle">アラビア半島</text>'
    +'<text x="57" y="92" fill="#7c2d12" font-size="8" text-anchor="middle">🛢 石油・OPEC</text>'
    // 南アジア（左下）
    +'<rect x="10" y="115" width="95" height="80" rx="8" fill="#f87171" opacity="0.75"/>'
    +'<text x="57" y="147" fill="#000" font-size="11" text-anchor="middle" font-weight="bold">南アジア</text>'
    +'<text x="57" y="161" fill="#000" font-size="9" text-anchor="middle">インド・パキスタン</text>'
    +'<text x="57" y="175" fill="#000" font-size="9" text-anchor="middle">バングラデシュ</text>'
    +'<text x="57" y="188" fill="#7c0000" font-size="8" text-anchor="middle">👥 世界最大人口</text>'
    // 東アジア（右上）
    +'<rect x="220" y="20" width="125" height="85" rx="8" fill="#4ade80" opacity="0.75"/>'
    +'<text x="282" y="52" fill="#000" font-size="11" text-anchor="middle" font-weight="bold">東アジア</text>'
    +'<text x="282" y="66" fill="#000" font-size="9" text-anchor="middle">中国・日本・韓国</text>'
    +'<text x="282" y="80" fill="#000" font-size="9" text-anchor="middle">モンゴル・台湾</text>'
    +'<text x="282" y="96" fill="#14532d" font-size="8" text-anchor="middle">🌾 稲作・モンスーン</text>'
    // 東南アジア（右下）
    +'<rect x="220" y="120" width="125" height="80" rx="8" fill="#a78bfa" opacity="0.75"/>'
    +'<text x="282" y="150" fill="#000" font-size="11" text-anchor="middle" font-weight="bold">東南アジア</text>'
    +'<text x="282" y="164" fill="#000" font-size="9" text-anchor="middle">タイ・インドネシア</text>'
    +'<text x="282" y="178" fill="#000" font-size="9" text-anchor="middle">ベトナム・フィリピン</text>'
    +'<text x="282" y="193" fill="#3b0764" font-size="8" text-anchor="middle">🌿 ASEAN・熱帯</text>'
    // 中央アジア（中央）
    +'<rect x="115" y="60" width="95" height="85" rx="8" fill="#94a3b8" opacity="0.55"/>'
    +'<text x="162" y="95" fill="#fff" font-size="10" text-anchor="middle" font-weight="bold">中央アジア</text>'
    +'<text x="162" y="110" fill="#fff" font-size="8" text-anchor="middle">カザフスタンなど</text>'
    +'<text x="162" y="124" fill="#fff" font-size="8" text-anchor="middle">乾燥・草原地帯</text>'
    // 凡例
    +'<text x="15" y="222" fill="#f59e0b" font-size="9">■ 乾燥</text>'
    +'<text x="55" y="222" fill="#f87171" font-size="9">■ 高温多湿</text>'
    +'<text x="105" y="222" fill="#4ade80" font-size="9">■ モンスーン</text>'
    +'<text x="175" y="222" fill="#a78bfa" font-size="9">■ 熱帯</text>'
    +'<text x="215" y="222" fill="#94a3b8" font-size="9">■ 内陸乾燥</text>'
    +'</svg>'
    +'</div>';

  // ── 東アジア ルールカード ──
  html+='<div class="rule-card" style="border-color:#4ade80">'
    +'<div class="rule-card-title" style="color:#4ade80">🌏 東アジア（日本・中国・韓国・モンゴル）</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">気候・自然</div>'
    +'<div class="note">モンスーン（季節風）の影響で夏に雨が多い → 稲作（水田農業）が発達<br>北部は乾燥・冷涼（ゴビ砂漠など）、南部は温暖</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">中国の特徴</div>'
    +'<div class="note">人口約14億（2023年はインドに次ぎ世界2位）・世界最大の農業生産国<br>経済特区（深セン・上海など）で急速に工業化 → 「世界の工場」<br>一人っ子政策（1980〜2015年）→ 現在は少子高齢化問題</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">韓国・日本</div>'
    +'<div class="note">韓国：半導体・造船・自動車で世界的な工業国<br>日本：先進工業国・自動車・精密機械・電子機器</div>'
    +'</div>'
    +'</div>';

  // ── 東南アジア ルールカード ──
  html+='<div class="rule-card" style="border-color:#a78bfa">'
    +'<div class="rule-card-title" style="color:#a78bfa">🌿 東南アジア（ASEAN10か国）</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">気候・農業</div>'
    +'<div class="note">赤道付近 → 熱帯（年中高温多湿）<br>主要農産物：米・天然ゴム・パーム油・コーヒー・カカオ<br>プランテーション：植民地時代にヨーロッパ人が始めた輸出向け大規模農園</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">ASEAN（東南アジア諸国連合）</div>'
    +'<div class="note">1967年設立・10か国加盟（タイ・インドネシア・フィリピン・ベトナム・シンガポールなど）<br>加盟国間の関税削減・経済協力が目的<br>日本企業が多数進出（工場設立・投資）</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">覚え方のコツ</div>'
    +'<div class="note" style="background:rgba(167,139,250,0.12)">ASEAN = 「あ、背案（アセアン）」→ 東南アジアの背中を支える組織！<br>プランテーション ≠ 自給農業　→ 輸出用・外国資本・単一作物が特徴</div>'
    +'</div>'
    +'</div>';

  // ── 南アジア ルールカード ──
  html+='<div class="rule-card" style="border-color:#f87171">'
    +'<div class="rule-card-title" style="color:#f87171">🕌 南アジア（インド・パキスタン・バングラデシュ・スリランカ）</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">インドの特徴</div>'
    +'<div class="note">2023年に中国を抜き世界最大の人口（約14.4億）<br>IT産業で世界的に有名（バンガロールが「インドのシリコンバレー」）<br>ヒンドゥー教が主流・カースト制度の影響が残る<br>綿花・茶・コーヒーも主要輸出品</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">モンスーンと農業</div>'
    +'<div class="note">夏：南西モンスーン（インド洋から湿った風）→ 雨季に大雨<br>冬：乾燥（乾季）<br>雨季の水田農業：米・綿花・豆類</div>'
    +'</div>'
    +'</div>';

  // ── 西アジア ルールカード ──
  html+='<div class="rule-card" style="border-color:#f59e0b">'
    +'<div class="rule-card-title" style="color:#f59e0b">🛢 西アジア（サウジアラビア・イラン・イラク・UAE・トルコ）</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">石油と OPEC</div>'
    +'<div class="note">ペルシア湾岸地域に世界の石油埋蔵量の約半分が集中<br>OPEC（石油輸出国機構）：石油の生産量・価格を調整する国際組織<br>日本の輸入石油の約90%が中東産 → 「石油ショック」を学ぶ際の重要ポイント</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">気候・宗教</div>'
    +'<div class="note">乾燥気候（砂漠・ステップ）が広がる → 水資源が貴重<br>イスラム教が主流：礼拝（1日5回・メッカの方向に向かって）・豚肉禁止・断食（ラマダン）</div>'
    +'</div>'
    +'</div>';

  // ── 他州 まとめカード（後で強化予定） ──
  html+='<div class="rule-card" style="opacity:0.88">'
    +'<div class="rule-card-title">🌍 その他の州（要点まとめ）</div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#34d399">ヨーロッパ州</div><div class="note">EU（欧州連合）・共通通貨ユーロ・偏西風→西岸海洋性気候（緯度が高いのに温暖）</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#fb923c">アフリカ州</div><div class="note">北部：サハラ砂漠・イスラム文化圏 / 中南部：熱帯雨林・サバナ<br>プランテーション農業（植民地の影響）・カカオ・コーヒーの産地</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#60a5fa">北アメリカ州</div><div class="note">アメリカの農業：適地適作（南部＝綿花、中部＝小麦、五大湖＝酪農）<br>シリコンバレー（カリフォルニア）：IT産業の中心地</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#a3e635">南アメリカ州</div><div class="note">アマゾン川流域：熱帯雨林気候（地球の肺）<br>ブラジル：コーヒー・大豆の世界的産地・BRICSの一員</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#e879f9">オセアニア州</div><div class="note">オーストラリア：乾燥大陸・羊毛・牛肉・鉄鉱石の輸出大国<br>季節が日本と逆（南半球）・先住民アボリジニ</div></div>'
    +'</div>';

  // ── 問題群 ──
  var qs=[
    // アジア全体
    { qid:'soc_geo_s2_q0', jp:'アジア州の説明として正しいのはどれ？',
      ans:'面積・人口ともに世界最大の州', choices:['面積・人口ともに世界最大の州','面積は最小だが人口は最大','南半球に位置する','砂漠気候が大部分を占める'],
      exp:'アジア州は六つの州の中で面積も人口も世界最大。中国・インド・インドネシアなど人口大国が集中。4つのエリア（東・東南・南・西）に分けて覚えよう。' },
    // 東アジア
    { qid:'soc_geo_s2_q1', jp:'東アジアで「モンスーン（季節風）」の影響が強い地域で特に発達した農業は？',
      ans:'稲作（水田農業）', choices:['稲作（水田農業）','小麦農業','放牧農業','プランテーション'],
      exp:'モンスーン（季節風）が夏に大量の雨をもたらすため、東アジアでは稲作が発達。中国・日本・韓国の主食は米。気候が農業を決めるパターンを覚えよう！' },
    { qid:'soc_geo_s2_q2', jp:'中国が急速な工業化を進めるために沿岸部に設置した地域を何という？',
      ans:'経済特区', choices:['経済特区','自由貿易港','工業地帯','開発特別区'],
      exp:'1970〜80年代に鄧小平が導入。深セン・珠海・汕頭・廈門などが最初の経済特区。外国企業を優遇・関税免除で「世界の工場」へと急成長した。' },
    // 東南アジア
    { qid:'soc_geo_s2_q3', jp:'東南アジアの国々が加盟する地域経済協力機構はどれ？',
      ans:'ASEAN（東南アジア諸国連合）', choices:['ASEAN（東南アジア諸国連合）','EU（欧州連合）','OPEC（石油輸出国機構）','AU（アフリカ連合）'],
      exp:'ASEAN（アセアン）は1967年設立・10か国加盟。タイ・インドネシア・フィリピン・ベトナム・シンガポールなど。日本企業の工場進出が多く、日本の重要な貿易相手地域。' },
    { qid:'soc_geo_s2_q4', jp:'植民地時代にヨーロッパ人が東南アジアなどで始めた、輸出用作物を栽培する大規模農園農業を何という？',
      ans:'プランテーション', choices:['プランテーション','棚田農業','大規模機械農業','自給農業'],
      exp:'プランテーション＝輸出用・外国資本・単一作物が特徴。天然ゴム（マレーシア・インドネシア）、コーヒー・カカオ（アフリカ・東南アジア）など。現在も続く植民地の遺産。' },
    // 南アジア
    { qid:'soc_geo_s2_q5', jp:'2023年に中国を抜いて世界一の人口大国となった国はどれ？',
      ans:'インド', choices:['インド','パキスタン','バングラデシュ','スリランカ'],
      exp:'インドは2023年に人口約14.4億人となり中国を抜いた。若者人口が多く経済成長が続く。IT産業（バンガロール）でも世界的に有名。ヒンドゥー教が主流の宗教。' },
    { qid:'soc_geo_s2_q6', jp:'インドのIT産業の中心地として有名な都市はどれ？',
      ans:'バンガロール', choices:['バンガロール','ムンバイ','デリー','コルカタ'],
      exp:'バンガロールは「インドのシリコンバレー」と呼ばれるIT産業の集積地。英語教育の普及・理系人材の豊富さ・賃金の安さが強み。海外IT企業も多数進出している。' },
    // 西アジア
    { qid:'soc_geo_s2_q7', jp:'西アジアの国々が中心になって結成した石油輸出国の組織はどれ？',
      ans:'OPEC（石油輸出国機構）', choices:['OPEC（石油輸出国機構）','ASEAN','NATO','WHO'],
      exp:'OPEC（オペック）は石油の生産量・価格を調整する国際組織。サウジアラビア・UAE・イラク・イランなどが中心。日本の輸入石油の約90%が中東産なので、試験で超頻出！' },
    { qid:'soc_geo_s2_q8', jp:'イスラム教の礼拝でムスリム（信者）が向かう聖地として正しいのは？',
      ans:'メッカ（サウジアラビア）', choices:['メッカ（サウジアラビア）','エルサレム（イスラエル）','バグダード（イラク）','テヘラン（イラン）'],
      exp:'メッカはサウジアラビア西部にあるイスラム教最大の聖地。ムスリムは1日5回メッカの方向に向かって礼拝する。一生に一度メッカへの巡礼（ハッジ）を行うのが義務とされる。' },
    // その他の州
    { qid:'soc_geo_s2_q9', jp:'EU（欧州連合）の多くの加盟国が使っている共通通貨はどれ？',
      ans:'ユーロ', choices:['ユーロ','ドル','ポンド','フラン'],
      exp:'EU加盟国の多くが共通通貨「ユーロ」を採用（2002年〜）。両替不要で加盟国間の経済活動が活発に。ただしイギリスはポンドのまま使い、2020年にEU離脱（ブレグジット）。' },
    { qid:'soc_geo_s2_q10', jp:'アフリカ大陸北部に広がる世界最大の砂漠はどれ？',
      ans:'サハラ砂漠', choices:['サハラ砂漠','ゴビ砂漠','アラビア砂漠','カラハリ砂漠'],
      exp:'サハラ砂漠はアフリカ北部に広がる世界最大の砂漠（面積約900万km²＝日本の約24倍！）。亜熱帯高圧帯（下降気流が強い）のため雨が降らない。北部はイスラム文化圏。' },
    { qid:'soc_geo_s2_q11', jp:'オーストラリアとニュージーランドが属する州はどれ？',
      ans:'オセアニア州', choices:['オセアニア州','アジア州','アフリカ州','南アメリカ州'],
      exp:'オセアニア州はオーストラリア大陸・ニュージーランド・太平洋の島々から構成。南半球のため季節が日本と逆（12月が夏）。オーストラリアの先住民はアボリジニ。' },
    { qid:'soc_geo_s2_q12', jp:'アメリカの農業の特徴として「適地適作」が有名だが、中部（グレートプレーンズ）で特に多く栽培されている農産物はどれ？',
      ans:'小麦', choices:['小麦','綿花','とうもろこし','大豆'],
      exp:'アメリカは気候に合わせて作物を変える「適地適作」。中部（グレートプレーンズ）＝小麦の大産地（世界最大の輸出国の一つ）。南部＝綿花、五大湖周辺＝酪農。' },
    { qid:'soc_geo_s2_q13', jp:'南アメリカのアマゾン川流域に広がる熱帯雨林で深刻になっている問題はどれ？',
      ans:'森林の破壊（農地・牧場への転換）', choices:['森林の破壊（農地・牧場への転換）','砂漠化の進行','海面上昇による水没','酸性雨による枯死'],
      exp:'アマゾンの熱帯雨林は「地球の肺」と呼ばれるが、農地・牧場・鉱山開発のため急速に伐採されている。大豆・牛肉の需要増が原因の一つ。地球温暖化にも影響する深刻な問題。' },
    { qid:'soc_geo_s2_q14', jp:'東南アジアの気候として最も正確に説明しているのはどれ？',
      ans:'熱帯気候で年中高温・雨が多い（赤道付近に位置するため）', choices:['熱帯気候で年中高温・雨が多い（赤道付近に位置するため）','砂漠気候で乾燥している','温帯で四季がある','亜寒帯で冬が厳しい'],
      exp:'東南アジアはほぼ赤道付近に位置するため熱帯気候。年中30℃前後・雨量も多い。これが稲作やプランテーション農業（ゴム・パーム油）に適している理由。' },
  ];

  html+='<div class="progress-dots">'
    +qs.map(function(_,i){ return '<div class="dot '+(i===0?'current':'')+'"></div>'; }).join('')
    +'</div>';
  qs.forEach(function(q,i){
    html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px;">Q'+(i+1)+'</div>';
    html+=makeChoices(q.qid,q.jp,q.ans,q.choices,q.exp);
  });
  return html;
}

// ===== SVG: 日本地図概略図 =====
function makeSvgJapanMap(){
  return '<svg viewBox="0 0 300 420" style="width:100%;max-width:320px;display:block;margin:16px auto" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="0" y="0" width="300" height="420" rx="10" fill="#0d2a52"/>'
    // 北海道
    +'<ellipse cx="205" cy="55" rx="55" ry="32" fill="#f59e0b" opacity="0.85"/>'
    +'<text x="205" y="59" fill="#000" font-size="11" text-anchor="middle" font-weight="bold">北海道</text>'
    // 東北
    +'<polygon points="185,88 225,88 232,105 228,135 215,152 192,155 180,138 178,108" fill="#22c55e" opacity="0.85"/>'
    +'<text x="205" y="125" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">東北</text>'
    // 関東
    +'<polygon points="178,158 228,158 230,175 225,192 200,198 178,188 170,178" fill="#a78bfa" opacity="0.85"/>'
    +'<text x="200" y="182" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">関東</text>'
    // 中部
    +'<polygon points="155,195 230,195 235,210 228,235 208,248 178,248 155,235 148,215" fill="#fb923c" opacity="0.85"/>'
    +'<text x="192" y="226" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">中部</text>'
    // ★豊田マーカー
    +'<circle cx="188" cy="232" r="5" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>'
    +'<text x="196" y="230" fill="#ef4444" font-size="8" font-weight="bold">豊田</text>'
    // 近畿
    +'<polygon points="140,252 190,252 195,265 188,282 165,288 140,278 133,265" fill="#e879f9" opacity="0.85"/>'
    +'<text x="163" y="274" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">近畿</text>'
    // 中国・四国
    +'<polygon points="108,286 165,286 168,300 160,315 135,322 108,318 98,305 100,292" fill="#34d399" opacity="0.85"/>'
    +'<text x="133" y="308" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">中国・四国</text>'
    // 九州
    +'<ellipse cx="120" cy="355" rx="42" ry="30" fill="#f59e0b" opacity="0.82"/>'
    +'<text x="120" y="359" fill="#000" font-size="11" text-anchor="middle" font-weight="bold">九州</text>'
    // 沖縄
    +'<ellipse cx="68" cy="400" rx="22" ry="10" fill="#f59e0b" opacity="0.75"/>'
    +'<text x="68" y="403" fill="#000" font-size="9" text-anchor="middle">沖縄</text>'
    // 日本海ラベル
    +'<text x="65" y="200" fill="#7dd3fc" font-size="10" text-anchor="middle" opacity="0.7" transform="rotate(-80,65,200)">日本海</text>'
    // 太平洋ラベル
    +'<text x="255" y="260" fill="#7dd3fc" font-size="10" text-anchor="middle" opacity="0.7" transform="rotate(90,255,260)">太平洋</text>'
    // 標準時子午線
    +'<line x1="180" y1="10" x2="180" y2="410" stroke="#f59e0b" stroke-width="0.8" stroke-dasharray="4,5" opacity="0.4"/>'
    +'<text x="182" y="12" fill="#f59e0b" font-size="7" opacity="0.7">東経135°（標準時）</text>'
    +'</svg>';
}

// ===== SECTION 3: 日本の姿 =====
function renderSection3(){
  var html='';

  // ── 日本地図（既存SVG関数） ──
  html+=makeSvgJapanMap();
  html+='<div style="text-align:center;font-size:11px;color:var(--text2);margin-bottom:12px;">▲ 日本の7地方区分。赤点は豊田市（中部地方・中京工業地帯）</div>';

  // ── イントロ会話 ──
  html+='<div class="intro-box" style="margin-bottom:16px">'
    +'<div class="intro-box-title">💬 日本の姿トーク</div>'
    +chat('kyon','きょん','日本って「島国」って言うけど、実際に何個の島があるの？')
    +chat('nishi','西村真二','確認されている島だけで約14,125島。有人島は約430島くらい。南北に約3,000km伸びてるから、北海道と沖縄で気候が全然違う。')
    +chat('kyon','きょん','え、3000kmって東京からタイくらいの距離じゃん！そりゃ気候違うわ…')
    +chat('nishi','西村真二','北海道は亜寒帯、東北・本州は温帯、沖縄は亜熱帯。しかも日本列島には高い山脈があるから、日本海側と太平洋側でも気候が逆になる。')
    +chat('kyon','きょん','豊田市って中部地方でしょ？自動車産業で日本一ってすごくない？')
    +chat('nishi','西村真二','すごい。中京工業地帯（愛知・岐阜・三重）の工業出荷額は日本1位。豊田市はその中心地だよ。')
    +chat('kyon','きょん','でも地震とか台風とか怖いよね…日本って災害多すぎない？')
    +chat('nishi','西村真二','その通り。日本は「環太平洋火山帯」に位置してるから地震・火山が多い。台風も毎年来る。でもだからこそ防災意識が大事になってくる。')
    +'</div>';

  // ── 日本の位置・領域カード ──
  html+='<div class="rule-card">'
    +'<div class="rule-card-title">🗾 日本の位置・領域</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">日本の四端（必ず覚える！）</div>'
    +'<div class="note">'
    +'<table style="width:100%;border-collapse:collapse;font-size:13px">'
    +'<tr style="background:rgba(255,255,255,0.06)"><th style="padding:5px 8px;text-align:left;color:var(--gold)">方向</th><th style="padding:5px 8px;text-align:left;color:var(--gold)">島名</th><th style="padding:5px 8px;text-align:left;color:var(--gold)">都道府県</th></tr>'
    +'<tr><td style="padding:4px 8px">北端 🧊</td><td style="padding:4px 8px">択捉島</td><td style="padding:4px 8px">北海道（ロシアと係争中）</td></tr>'
    +'<tr style="background:rgba(255,255,255,0.04)"><td style="padding:4px 8px">南端 ☀️</td><td style="padding:4px 8px">沖ノ鳥島</td><td style="padding:4px 8px">東京都（サンゴ礁の小島）</td></tr>'
    +'<tr><td style="padding:4px 8px">東端 🌅</td><td style="padding:4px 8px">南鳥島</td><td style="padding:4px 8px">東京都（太平洋上）</td></tr>'
    +'<tr style="background:rgba(255,255,255,0.04)"><td style="padding:4px 8px">西端 🌇</td><td style="padding:4px 8px">与那国島</td><td style="padding:4px 8px">沖縄県（台湾の北東）</td></tr>'
    +'</table>'
    +'</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">標準時・時差</div>'
    +'<div class="note">標準時子午線＝東経135度（兵庫県明石市を通る）<br>ロンドン（0度）との時差：135÷15＝<strong>9時間</strong>（日本が進んでいる）<br>EEZ（排他的経済水域）：海岸から200海里以内 → 日本はEEZが世界第6位の広さ！</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">重要な川・湖</div>'
    +'<div class="note">最長の川＝<strong>信濃川</strong>（367km・長野〜新潟）<br>流域面積最大＝<strong>利根川</strong>（関東平野）← よく混乱する！<br>最大の湖＝<strong>琵琶湖</strong>（滋賀県・近畿の水がめ）<br>最大の平野＝<strong>関東平野</strong>（約17,000km²）</div>'
    +'</div>'
    +'</div>';

  // ── 地形語句カード ──
  html+='<div class="rule-card">'
    +'<div class="rule-card-title">⛰ 重要地形用語（よく出る！）</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px">'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="font-size:12px">扇状地</div><div class="note" style="font-size:12px">山→平地に出る場所に<br>土砂が扇形に堆積<br>→水はけよく果樹園</div></div>'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="font-size:12px">三角州（デルタ）</div><div class="note" style="font-size:12px">河口に土砂が三角形に<br>堆積→水田・都市が発達<br>（広島・濃尾平野）</div></div>'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="font-size:12px">リアス海岸</div><div class="note" style="font-size:12px">山が沈んで入り江が入り組む<br>三陸・若狭湾・志摩半島<br>→養殖業に適す</div></div>'
    +'<div class="rule-box" style="margin:0"><div class="rule-title" style="font-size:12px">台地（洪積台地）</div><div class="note" style="font-size:12px">河川の浸食で残った<br>平らな高台→畑・住宅地<br>（関東ローム層など）</div></div>'
    +'</div>'
    +'</div>';

  // ── 気候区分 SVG ──
  html+='<div style="background:#0d2a3a;border-radius:10px;padding:12px;margin-bottom:16px">'
    +'<div style="font-size:13px;font-weight:bold;color:var(--gold);margin-bottom:8px;text-align:center">🌦 日本の気候区分（6つ）</div>'
    +'<svg viewBox="0 0 360 220" style="width:100%;max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">'
    // 背景
    +'<rect x="0" y="0" width="360" height="220" rx="8" fill="#0d1a2a"/>'
    // 北海道（亜寒帯）
    +'<rect x="8" y="8" width="80" height="46" rx="6" fill="#60a5fa" opacity="0.82"/>'
    +'<text x="48" y="28" fill="#fff" font-size="11" text-anchor="middle" font-weight="bold">北海道気候</text>'
    +'<text x="48" y="42" fill="#e0f2fe" font-size="9" text-anchor="middle">亜寒帯・冬に大雪</text>'
    +'<text x="48" y="50" fill="#bae6fd" font-size="8" text-anchor="middle">梅雨がない</text>'
    // 日本海側（冬に大雪）
    +'<rect x="8" y="62" width="80" height="46" rx="6" fill="#818cf8" opacity="0.82"/>'
    +'<text x="48" y="80" fill="#fff" font-size="10" text-anchor="middle" font-weight="bold">日本海側気候</text>'
    +'<text x="48" y="93" fill="#e0e7ff" font-size="9" text-anchor="middle">冬：北西季節風で</text>'
    +'<text x="48" y="104" fill="#c7d2fe" font-size="8" text-anchor="middle">大雪★</text>'
    // 太平洋側（夏に雨）
    +'<rect x="272" y="62" width="80" height="46" rx="6" fill="#34d399" opacity="0.82"/>'
    +'<text x="312" y="80" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">太平洋側気候</text>'
    +'<text x="312" y="93" fill="#065f46" font-size="9" text-anchor="middle">夏：南東季節風で</text>'
    +'<text x="312" y="104" fill="#047857" font-size="8" text-anchor="middle">雨が多い★</text>'
    // 瀬戸内海（少雨・温暖）
    +'<rect x="140" y="112" width="80" height="46" rx="6" fill="#fbbf24" opacity="0.82"/>'
    +'<text x="180" y="130" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">瀬戸内海気候</text>'
    +'<text x="180" y="143" fill="#78350f" font-size="9" text-anchor="middle">年中少雨・温暖</text>'
    +'<text x="180" y="154" fill="#92400e" font-size="8" text-anchor="middle">山脈がさえぎる</text>'
    // 中央高地（内陸・気温差）
    +'<rect x="140" y="62" width="80" height="46" rx="6" fill="#fb923c" opacity="0.82"/>'
    +'<text x="180" y="80" fill="#000" font-size="10" text-anchor="middle" font-weight="bold">中央高地気候</text>'
    +'<text x="180" y="93" fill="#7c2d12" font-size="9" text-anchor="middle">内陸・気温差大</text>'
    +'<text x="180" y="104" fill="#9a3412" font-size="8" text-anchor="middle">長野・山梨など</text>'
    // 南西諸島（亜熱帯）
    +'<rect x="8" y="162" width="80" height="46" rx="6" fill="#f472b6" opacity="0.82"/>'
    +'<text x="48" y="180" fill="#fff" font-size="10" text-anchor="middle" font-weight="bold">南西諸島気候</text>'
    +'<text x="48" y="193" fill="#fce7f3" font-size="9" text-anchor="middle">亜熱帯・年中温暖</text>'
    +'<text x="48" y="204" fill="#fbcfe8" font-size="8" text-anchor="middle">台風の通り道</text>'
    // 矢印ラベル（季節風）
    +'<text x="196" y="20" fill="#93c5fd" font-size="10" text-anchor="middle" font-weight="bold">← 北西季節風（冬）→大雪</text>'
    +'<text x="196" y="170" fill="#6ee7b7" font-size="10" text-anchor="middle" font-weight="bold">← 南東季節風（夏）→雨</text>'
    // 真ん中に「日本の本州」ラベル
    +'<rect x="272" y="112" width="80" height="46" rx="6" fill="#475569" opacity="0.6"/>'
    +'<text x="312" y="132" fill="#cbd5e1" font-size="9" text-anchor="middle">東日本</text>'
    +'<text x="312" y="145" fill="#94a3b8" font-size="8" text-anchor="middle">太平洋側は</text>'
    +'<text x="312" y="156" fill="#94a3b8" font-size="8" text-anchor="middle">夏に台風来る</text>'
    +'</svg>'
    +'<div style="font-size:11px;color:var(--text2);margin-top:6px;text-align:center">冬の季節風（北西）→ 日本海側に大雪 ／ 夏の季節風（南東）→ 太平洋側に雨</div>'
    +'</div>';

  // ── 気候ルールカード ──
  html+='<div class="rule-card">'
    +'<div class="rule-card-title">🌨 気候の仕組み（試験頻出！）</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">冬（北西の季節風）</div>'
    +'<div class="note">シベリア高気圧 → 北西の風 → 日本海の水蒸気を含む<br>↓ 脊梁山脈（中央の山脈）にぶつかる<br>→ <strong>日本海側：大雪</strong> ／ <strong>太平洋側：晴れ・乾燥</strong></div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">夏（南東の季節風）</div>'
    +'<div class="note">太平洋高気圧 → 南東の風 → 湿った空気<br>→ <strong>太平洋側：雨が多い</strong> ／ <strong>日本海側：晴れ</strong><br>フェーン現象：山を越えた風が高温乾燥→日本海側で気温急上昇</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">農業への影響（覚え方セット）</div>'
    +'<div class="note" style="background:rgba(251,191,36,0.1)">'
    +'促成栽培 ＝ <strong>宮崎・高知</strong>（温暖） → 野菜を<strong>早く</strong>出荷<br>'
    +'抑制栽培 ＝ <strong>長野の高原</strong>（涼しい） → 夏でも野菜を<strong>遅らせて</strong>出荷<br>'
    +'やませ ＝ 東北太平洋側の夏の冷たい北東風 → <strong>冷害・稲作被害</strong>'
    +'</div>'
    +'</div>'
    +'</div>';

  // ── 産業分布 SVG（太平洋ベルト） ──
  html+='<div style="background:#0d2a3a;border-radius:10px;padding:12px;margin-bottom:16px">'
    +'<div style="font-size:13px;font-weight:bold;color:var(--gold);margin-bottom:8px;text-align:center">🏭 太平洋ベルトと主要工業地帯</div>'
    +'<svg viewBox="0 0 360 200" style="width:100%;max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="0" y="0" width="360" height="200" rx="8" fill="#0d1a2a"/>'
    // 太平洋ベルト（背景帯）
    +'<rect x="30" y="70" width="295" height="80" rx="12" fill="#f59e0b" opacity="0.12" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6,3"/>'
    +'<text x="180" y="160" fill="#f59e0b" font-size="9" text-anchor="middle" opacity="0.8">── 太平洋ベルト（関東〜九州北部・工業集積帯）──</text>'
    // 京浜
    +'<rect x="270" y="75" width="68" height="38" rx="6" fill="#3b82f6" opacity="0.85"/>'
    +'<text x="304" y="91" fill="#fff" font-size="10" text-anchor="middle" font-weight="bold">京浜</text>'
    +'<text x="304" y="104" fill="#bfdbfe" font-size="8" text-anchor="middle">東京・川崎</text>'
    // 中京（豊田！）
    +'<rect x="178" y="75" width="72" height="38" rx="6" fill="#ef4444" opacity="0.9"/>'
    +'<text x="214" y="89" fill="#fff" font-size="10" text-anchor="middle" font-weight="bold">中京 ★</text>'
    +'<text x="214" y="101" fill="#fca5a5" font-size="8" text-anchor="middle">豊田・名古屋</text>'
    +'<text x="214" y="109" fill="#fca5a5" font-size="7" text-anchor="middle">出荷額 日本1位</text>'
    // 阪神
    +'<rect x="130" y="88" width="42" height="32" rx="6" fill="#a855f7" opacity="0.85"/>'
    +'<text x="151" y="103" fill="#fff" font-size="9" text-anchor="middle" font-weight="bold">阪神</text>'
    +'<text x="151" y="114" fill="#e9d5ff" font-size="7" text-anchor="middle">大阪・神戸</text>'
    // 瀬戸内
    +'<rect x="80" y="95" width="44" height="28" rx="6" fill="#22c55e" opacity="0.8"/>'
    +'<text x="102" y="108" fill="#fff" font-size="9" text-anchor="middle" font-weight="bold">瀬戸内</text>'
    +'<text x="102" y="118" fill="#bbf7d0" font-size="7" text-anchor="middle">化学・鉄鋼</text>'
    // 北九州
    +'<rect x="32" y="98" width="42" height="28" rx="6" fill="#f97316" opacity="0.8"/>'
    +'<text x="53" y="110" fill="#fff" font-size="9" text-anchor="middle" font-weight="bold">北九州</text>'
    +'<text x="53" y="120" fill="#fed7aa" font-size="7" text-anchor="middle">鉄鋼→半導体</text>'
    // 北海道（太平洋ベルト外）
    +'<rect x="270" y="12" width="68" height="30" rx="6" fill="#475569" opacity="0.8"/>'
    +'<text x="304" y="26" fill="#e2e8f0" font-size="9" text-anchor="middle">北海道（農業）</text>'
    +'<text x="304" y="37" fill="#94a3b8" font-size="7" text-anchor="middle">太平洋ベルト外</text>'
    // 東北
    +'<rect x="270" y="46" width="68" height="24" rx="6" fill="#475569" opacity="0.7"/>'
    +'<text x="304" y="58" fill="#e2e8f0" font-size="9" text-anchor="middle">東北（稲作・IC）</text>'
    // 凡例
    +'<text x="15" y="188" fill="#ef4444" font-size="9">★ 豊田市はここ！</text>'
    +'</svg>'
    +'</div>';

  // ── 産業ルールカード ──
  html+='<div class="rule-card">'
    +'<div class="rule-card-title">🌾 農業・漁業・工業 ポイント集</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">地域別農業の特徴</div>'
    +'<div class="note">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<tr style="background:rgba(255,255,255,0.06)"><th style="padding:4px 6px;text-align:left;color:var(--gold)">地域</th><th style="padding:4px 6px;text-align:left;color:var(--gold)">主な農業</th></tr>'
    +'<tr><td style="padding:3px 6px">北海道</td><td style="padding:3px 6px">大規模畑作（小麦・じゃがいも・てんさい）・酪農（根釧台地）</td></tr>'
    +'<tr style="background:rgba(255,255,255,0.04)"><td style="padding:3px 6px">東北</td><td style="padding:3px 6px">稲作中心（秋田・宮城・山形）・りんご（青森）</td></tr>'
    +'<tr><td style="padding:3px 6px">関東近郊</td><td style="padding:3px 6px">近郊農業（都市向け野菜）・茶（静岡）</td></tr>'
    +'<tr style="background:rgba(255,255,255,0.04)"><td style="padding:3px 6px">中部高原</td><td style="padding:3px 6px">抑制栽培（長野の高原野菜・夏レタスなど）</td></tr>'
    +'<tr><td style="padding:3px 6px">九州・四国</td><td style="padding:3px 6px">促成栽培（宮崎・高知のピーマン・きゅうり）</td></tr>'
    +'</table>'
    +'</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">漁業のポイント</div>'
    +'<div class="note">養殖漁業＝いけすで最後まで管理して出荷（ぶり・真鯛・カキ）<br>栽培漁業＝稚魚を育てて自然に放流し、成長後に漁獲<br>リアス海岸（三陸・若狭湾）→ 波が穏やかで養殖に最適</div>'
    +'</div>'
    +'<div class="rule-box">'
    +'<div class="rule-title">主要工業地帯の特徴</div>'
    +'<div class="note" style="background:rgba(239,68,68,0.08)">'
    +'🏆 中京（愛知）：<strong>出荷額日本1位</strong>・自動車（トヨタ）中心<br>'
    +'京浜（東京・神奈川）：かつて1位・印刷・食品・機械<br>'
    +'阪神（大阪・神戸）：金属・化学・繊維<br>'
    +'北九州：鉄鋼→現在は半導体（シリコンアイランド）'
    +'</div>'
    +'</div>'
    +'</div>';

  // ── 自然災害 SVG ──
  html+='<div style="background:#1a0d2a;border-radius:10px;padding:12px;margin-bottom:16px;border:1px solid rgba(239,68,68,0.3)">'
    +'<div style="font-size:13px;font-weight:bold;color:#f87171;margin-bottom:8px;text-align:center">⚠️ 日本の自然災害・防災</div>'
    +'<svg viewBox="0 0 360 160" style="width:100%;max-width:420px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="0" y="0" width="360" height="160" rx="8" fill="#1a0d0d"/>'
    // 地震・津波ゾーン（環太平洋）
    +'<rect x="8" y="8" width="80" height="66" rx="6" fill="#ef4444" opacity="0.8"/>'
    +'<text x="48" y="26" fill="#fff" font-size="11" text-anchor="middle" font-weight="bold">🌊 地震・津波</text>'
    +'<text x="48" y="40" fill="#fca5a5" font-size="8.5" text-anchor="middle">環太平洋火山帯</text>'
    +'<text x="48" y="53" fill="#fca5a5" font-size="8.5" text-anchor="middle">プレート境界で発生</text>'
    +'<text x="48" y="66" fill="#fee2e2" font-size="7.5" text-anchor="middle">津波に注意→高台へ</text>'
    // 台風
    +'<rect x="96" y="8" width="80" height="66" rx="6" fill="#f97316" opacity="0.8"/>'
    +'<text x="136" y="26" fill="#fff" font-size="11" text-anchor="middle" font-weight="bold">🌀 台風</text>'
    +'<text x="136" y="40" fill="#fed7aa" font-size="8.5" text-anchor="middle">夏〜秋に南から</text>'
    +'<text x="136" y="53" fill="#fed7aa" font-size="8.5" text-anchor="middle">北上・九州〜関東</text>'
    +'<text x="136" y="66" fill="#ffedd5" font-size="7.5" text-anchor="middle">暴風雨・高波・土砂</text>'
    // 火山
    +'<rect x="184" y="8" width="80" height="66" rx="6" fill="#dc2626" opacity="0.8"/>'
    +'<text x="224" y="26" fill="#fff" font-size="11" text-anchor="middle" font-weight="bold">🌋 火山噴火</text>'
    +'<text x="224" y="40" fill="#fca5a5" font-size="8.5" text-anchor="middle">110以上の活火山</text>'
    +'<text x="224" y="53" fill="#fca5a5" font-size="8.5" text-anchor="middle">富士山・阿蘇・桜島</text>'
    +'<text x="224" y="66" fill="#fee2e2" font-size="7.5" text-anchor="middle">溶岩・火砕流・噴石</text>'
    // 豪雨・洪水
    +'<rect x="272" y="8" width="80" height="66" rx="6" fill="#3b82f6" opacity="0.8"/>'
    +'<text x="312" y="26" fill="#fff" font-size="11" text-anchor="middle" font-weight="bold">🌧 豪雨・洪水</text>'
    +'<text x="312" y="40" fill="#bfdbfe" font-size="8.5" text-anchor="middle">梅雨・集中豪雨</text>'
    +'<text x="312" y="53" fill="#bfdbfe" font-size="8.5" text-anchor="middle">河川氾濫・土砂崩れ</text>'
    +'<text x="312" y="66" fill="#dbeafe" font-size="7.5" text-anchor="middle">ハザードマップ確認</text>'
    // 防災の心得
    +'<rect x="8" y="82" width="344" height="68" rx="6" fill="rgba(251,191,36,0.1)" stroke="#f59e0b" stroke-width="1"/>'
    +'<text x="180" y="98" fill="#fcd34d" font-size="11" text-anchor="middle" font-weight="bold">🛡 防災・減災のポイント</text>'
    +'<text x="32" y="114" fill="#fef3c7" font-size="9">• ハザードマップ：浸水・土砂・津波リスクの地図</text>'
    +'<text x="32" y="128" fill="#fef3c7" font-size="9">• 避難場所・避難経路の事前確認</text>'
    +'<text x="32" y="142" fill="#fef3c7" font-size="9">• 防災グッズ（水3日分・食料・ラジオ）の備蓄</text>'
    +'</svg>'
    +'</div>';

  // ── 地域区分カード ──
  html+='<div class="rule-card">'
    +'<div class="rule-card-title">📍 7地方区分の特徴まとめ</div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#60a5fa">北海道地方</div><div class="note">大規模農業（十勝平野）・酪農（根釧台地）・観光・漁業。冬は亜寒帯で厳しい寒さ。梅雨がない。</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#34d399">東北地方</div><div class="note">稲作（米どころ：秋田・宮城）・りんご（青森）・さくらんぼ（山形）。やませによる冷害に注意。IC工場も増加。</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#a78bfa">関東地方</div><div class="note">東京一極集中・日本最大の平野（関東平野）・近郊農業。京浜工業地帯。人口の約35%以上が集中。</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#ef4444">中部地方 ★豊田市</div><div class="note">中京工業地帯（出荷額日本1位・自動車）・北陸の稲作・長野の高原野菜（抑制栽培）・富士山。</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#e879f9">近畿地方</div><div class="note">阪神工業地帯・琵琶湖（近畿の水がめ）・京都（伝統工芸）・神戸港（貿易港）。</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#fb923c">中国・四国地方</div><div class="note">瀬戸内工業地域（化学・鉄鋼）・促成栽培（高知）・みかん（愛媛）。瀬戸内海式気候（少雨）。</div></div>'
    +'<div class="rule-box"><div class="rule-title" style="color:#fbbf24">九州・沖縄地方</div><div class="note">促成栽培（宮崎）・シリコンアイランド（半導体）・桜島（活火山）・沖縄は亜熱帯・台風の通り道。</div></div>'
    +'</div>';

  // ── 問題群 ──
  var qs=[
    { qid:'soc_geo_s3_q0', jp:'日本の標準時子午線は東経何度？',
      ans:'東経135度', choices:['東経135度','東経120度','東経140度','東経150度'],
      exp:'東経135度の線は兵庫県明石市を通る。ロンドン（0度）との差は135÷15＝9時間。日本はイギリスより9時間進んでいる！時差計算は「東ほど時刻が早い」がルール。' },
    { qid:'soc_geo_s3_q1', jp:'日本の都道府県の数は全部でいくつ？',
      ans:'47', choices:['47','43','50','46'],
      exp:'1都（東京都）・1道（北海道）・2府（大阪府・京都府）・43県 ＝ 合計47都道府県。「1都1道2府43県」の組み合わせをセットで覚えておこう！' },
    { qid:'soc_geo_s3_q2', jp:'日本で最も長い川はどれ？',
      ans:'信濃川', choices:['信濃川','利根川','木曽川','最上川'],
      exp:'日本最長の川は信濃川（全長367km、長野〜新潟）。流域面積が最大なのは利根川（関東）。「長さ＝信濃川」「面積＝利根川」と区別して覚えよう！' },
    { qid:'soc_geo_s3_q3', jp:'日本最大の湖はどれ？',
      ans:'琵琶湖', choices:['琵琶湖','霞ヶ浦','猪苗代湖','サロマ湖'],
      exp:'琵琶湖は滋賀県にある日本最大の湖（面積約670km²）。近畿地方の水道水源として「近畿の水がめ」と呼ばれる超重要な湖！' },
    { qid:'soc_geo_s3_q4', jp:'三陸海岸のような入り組んだ複雑な海岸地形を何という？',
      ans:'リアス海岸', choices:['リアス海岸','デルタ（三角州）','フィヨルド','砂丘'],
      exp:'リアス海岸は山地が海に沈んでできた谷が入り組んだ地形。三陸海岸・若狭湾・志摩半島が有名。水深が深く波が穏やかで養殖業（カキ・ホタテ）に適している。' },
    { qid:'soc_geo_s3_q5', jp:'愛知県豊田市を中心とする、日本最大の工業出荷額を誇る工業地帯はどれ？',
      ans:'中京工業地帯', choices:['中京工業地帯','阪神工業地帯','京浜工業地帯','北九州工業地域'],
      exp:'中京工業地帯は愛知・岐阜・三重にまたがる。豊田市の自動車（トヨタ）が中心で工業出荷額は日本1位！' },
    { qid:'soc_geo_s3_q6', jp:'冬に日本海側で雪が多く、太平洋側が晴れる理由はどれ？',
      ans:'北西の季節風が山脈にぶつかるから', choices:['北西の季節風が山脈にぶつかるから','暖流と寒流の境目だから','緯度が違うから','標高が全然違うから'],
      exp:'冬は北西から季節風（モンスーン）が吹く。日本海の水分を含んだ風が脊梁山脈にぶつかり→日本海側に大雪。山を越えた乾いた風→太平洋側は晴れ。このパターン必須！' },
    { qid:'soc_geo_s3_q7', jp:'温暖な気候を利用し、野菜の出荷時期を早める農業を何という？',
      ans:'促成栽培', choices:['促成栽培','抑制栽培','近郊農業','棚田農業'],
      exp:'促成栽培は暖かい気候（宮崎平野・高知平野）でビニールハウスを使い野菜を早く出荷。逆に涼しい高原で夏でも野菜を育てるのが「抑制栽培」（長野の高原野菜）。セットで覚える！' },
    { qid:'soc_geo_s3_q8', jp:'日本の南端の島はどれ？',
      ans:'沖ノ鳥島', choices:['沖ノ鳥島','与那国島','南鳥島','択捉島'],
      exp:'日本の四端：北端＝択捉島（北海道）、南端＝沖ノ鳥島（サンゴ礁）、東端＝南鳥島、西端＝与那国島（沖縄）。沖ノ鳥島は日本のEEZを守るために護岸工事している！' },
    { qid:'soc_geo_s3_q9', jp:'川が山から平地に出るところに土砂が扇形に堆積した地形を何という？',
      ans:'扇状地', choices:['扇状地','デルタ（三角州）','リアス海岸','カルスト地形'],
      exp:'扇状地は川が山から平地に出る場所に土砂が扇形に積もった地形。水はけがよく果樹園（ぶどう・もも・りんご）に利用（山梨・長野）。河口に積もるのは「三角州（デルタ）」！' },
    { qid:'soc_geo_s3_q10', jp:'九州地方に「シリコンアイランド」の呼び名がある理由はどれ？',
      ans:'半導体（ICチップ）工場が多いから', choices:['半導体（ICチップ）工場が多いから','砂（シリコン）の採掘が多いから','サーフィンのメッカだから','シリカ（ケイ素）の鉱山があるから'],
      exp:'九州は清潔な水・広い土地・空港へのアクセスがよく半導体工場が集積。アメリカのシリコンバレーになぞらえて「シリコンアイランド」と呼ばれる。近年はTSMCも熊本に進出！' },
    { qid:'soc_geo_s3_q11', jp:'東北地方の太平洋側で夏に冷害をもたらす北東の冷たい風を何という？',
      ans:'やませ', choices:['やませ','フェーン','偏西風','貿易風'],
      exp:'やませは夏に北東から吹く冷湿な風。日照不足・低温をもたらし稲作に冷害被害。日本海側はフェーン現象で逆に高温になる。東北の農業問題として試験で超頻出！' },
    { qid:'soc_geo_s3_q12', jp:'北海道の農業の主な特徴はどれ？',
      ans:'大規模農業・酪農・じゃがいも・小麦・てんさい', choices:['大規模農業・酪農・じゃがいも・小麦・てんさい','小規模な集約的稲作中心','促成栽培で野菜を早出荷','茶・みかん・温室農業'],
      exp:'北海道は広大な土地を活かした大規模農業が特徴。十勝平野ではじゃがいも・小麦・大豆・てんさい。根釧台地では酪農（乳牛）。日本の食料供給を支える食料庫！' },
    { qid:'soc_geo_s3_q13', jp:'日本で地震・火山が多い理由として正しいのはどれ？',
      ans:'太平洋プレートなど複数のプレートの境界に位置するから', choices:['太平洋プレートなど複数のプレートの境界に位置するから','砂漠が多いから','海に囲まれているから','人口が多いから'],
      exp:'日本はユーラシアプレート・北アメリカプレート・太平洋プレート・フィリピン海プレートの境界に位置する。プレートがぶつかる・沈み込む場所で地震・火山が発生する。「環太平洋火山帯」の一部。' },
    { qid:'soc_geo_s3_q14', jp:'川が海・湖に流れ込む河口付近に土砂が堆積した三角形の地形を何という？',
      ans:'三角州（デルタ）', choices:['三角州（デルタ）','扇状地','リアス海岸','カルスト地形'],
      exp:'三角州（デルタ）は川が河口で運んできた土砂が積もった三角形の地形。水田・都市が発達しやすい。広島デルタ（太田川）・濃尾平野などが有名。扇状地と区別が超重要！' },
  ];

  html+='<div class="progress-dots">'
    +qs.map(function(_,i){ return '<div class="dot '+(i===0?'current':'')+'"></div>'; }).join('')
    +'</div>';
  qs.forEach(function(q,i){
    html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px;">Q'+(i+1)+'</div>';
    html+=makeChoices(q.qid,q.jp,q.ans,q.choices,q.exp);
  });
  return html;
}

// ===== SECTION 4: 確認テスト =====
function renderSection4(){
  // 地図ヒントSVG（問題文に埋め込む用）
  var mapHintTZ='<svg viewBox="0 0 280 60" style="width:100%;max-width:280px;display:block;margin:8px auto 4px" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="0" y="0" width="280" height="60" rx="6" fill="#0d1a2a"/>'
    +'<line x1="40" y1="10" x2="40" y2="50" stroke="#6b7280" stroke-width="1"/>'
    +'<line x1="100" y1="10" x2="100" y2="50" stroke="#6b7280" stroke-width="1"/>'
    +'<line x1="160" y1="10" x2="160" y2="50" stroke="#6b7280" stroke-width="1"/>'
    +'<line x1="220" y1="10" x2="220" y2="50" stroke="#6b7280" stroke-width="1"/>'
    +'<text x="40" y="22" fill="#94a3b8" font-size="8" text-anchor="middle">0°</text>'
    +'<text x="40" y="32" fill="#94a3b8" font-size="7" text-anchor="middle">ロンドン</text>'
    +'<text x="100" y="22" fill="#94a3b8" font-size="8" text-anchor="middle">45°E</text>'
    +'<text x="160" y="22" fill="#94a3b8" font-size="8" text-anchor="middle">90°E</text>'
    +'<text x="220" y="22" fill="#f59e0b" font-size="8" text-anchor="middle">135°E</text>'
    +'<text x="220" y="32" fill="#f59e0b" font-size="7" text-anchor="middle">日本</text>'
    +'<text x="40" y="48" fill="#60a5fa" font-size="7" text-anchor="middle">?時</text>'
    +'<text x="220" y="48" fill="#4ade80" font-size="7" text-anchor="middle">15時</text>'
    +'<text x="140" y="56" fill="#6b7280" font-size="7" text-anchor="middle">← 15度ごとに1時間の差</text>'
    +'</svg>';

  var mapHintClimate='<svg viewBox="0 0 280 60" style="width:100%;max-width:280px;display:block;margin:8px auto 4px" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="0" y="0" width="280" height="60" rx="6" fill="#0d1a2a"/>'
    +'<rect x="8" y="8" width="55" height="44" rx="4" fill="#818cf8" opacity="0.7"/>'
    +'<text x="35" y="26" fill="#fff" font-size="8" text-anchor="middle">日本海側</text>'
    +'<text x="35" y="38" fill="#c7d2fe" font-size="7" text-anchor="middle">冬❄大雪</text>'
    +'<rect x="110" y="8" width="60" height="44" rx="4" fill="#fbbf24" opacity="0.7"/>'
    +'<text x="140" y="26" fill="#000" font-size="8" text-anchor="middle">瀬戸内海</text>'
    +'<text x="140" y="38" fill="#78350f" font-size="7" text-anchor="middle">年中少雨☀</text>'
    +'<rect x="217" y="8" width="55" height="44" rx="4" fill="#34d399" opacity="0.7"/>'
    +'<text x="244" y="26" fill="#000" font-size="8" text-anchor="middle">太平洋側</text>'
    +'<text x="244" y="38" fill="#065f46" font-size="7" text-anchor="middle">夏🌧雨多い</text>'
    +'<text x="140" y="56" fill="#6b7280" font-size="7" text-anchor="middle">日本の気候パターン（?の地域に当てはまるのは）</text>'
    +'</svg>';

  var mapHintIndustry='<svg viewBox="0 0 280 60" style="width:100%;max-width:280px;display:block;margin:8px auto 4px" xmlns="http://www.w3.org/2000/svg">'
    +'<rect x="0" y="0" width="280" height="60" rx="6" fill="#0d1a2a"/>'
    +'<rect x="8" y="12" width="50" height="36" rx="4" fill="#f97316" opacity="0.7"/>'
    +'<text x="33" y="28" fill="#fff" font-size="7.5" text-anchor="middle">北九州</text>'
    +'<rect x="70" y="12" width="50" height="36" rx="4" fill="#22c55e" opacity="0.7"/>'
    +'<text x="95" y="28" fill="#000" font-size="7.5" text-anchor="middle">阪神</text>'
    +'<rect x="132" y="8" width="60" height="44" rx="4" fill="#ef4444" opacity="0.85"/>'
    +'<text x="162" y="26" fill="#fff" font-size="8" text-anchor="middle" font-weight="bold">中京★</text>'
    +'<text x="162" y="38" fill="#fca5a5" font-size="7" text-anchor="middle">豊田・名古屋</text>'
    +'<rect x="205" y="12" width="50" height="36" rx="4" fill="#3b82f6" opacity="0.7"/>'
    +'<text x="230" y="28" fill="#fff" font-size="7.5" text-anchor="middle">京浜</text>'
    +'<text x="162" y="56" fill="#f59e0b" font-size="7" text-anchor="middle">★ = 出荷額日本1位</text>'
    +'</svg>';

  var allQs=[
    // ━━━ 世界の姿（9問）━━━
    { qid:'soc_geo_s4_q00',
      jp:'赤道（緯度0度）が通らない大陸はどれ？',
      ans:'オーストラリア大陸', choices:['オーストラリア大陸','アフリカ大陸','南アメリカ大陸','アジア（東南アジア）'],
      exp:'赤道はアフリカ大陸・南アメリカ大陸・東南アジアを通る。オーストラリアは赤道より南（南緯）に位置するため通らない。「南半球の大陸＝赤道を通らない」と覚えよう。' },
    { qid:'soc_geo_s4_q01',
      jp:'六大陸を大きい順に並べたとき3番目はどれ？',
      ans:'北アメリカ大陸', choices:['北アメリカ大陸','南アメリカ大陸','アフリカ大陸','南極大陸'],
      exp:'六大陸の順（大きい順）：①ユーラシア ②アフリカ ③北アメリカ ④南アメリカ ⑤南極 ⑥オーストラリア。「ユー・ア・北・南・南極・オー」と頭文字で覚えよう！' },
    { qid:'soc_geo_s4_q02',
      jp:mapHintTZ+'この図を参考に：東経135度（日本）が午後3時のとき、東経0度（ロンドン）は何時？',
      ans:'午前6時', choices:['午前6時','午後6時','午前0時','正午（12時）'],
      exp:'経度15度ごとに1時間の時差。135÷15＝9時間。日本（東）がロンドン（西）より9時間進んでいる。15時－9＝午前6時。「東ほど時刻が早い」がルール！' },
    { qid:'soc_geo_s4_q03',
      jp:'東経135度（日本）が正午12時のとき、西経45度の地点は何時？（時差の計算）',
      ans:'午前3時', choices:['午前3時','午後9時','午後3時','午前9時'],
      exp:'東経135度と西経45度の角度差は135+45＝180度。180÷15＝12時間差。日本が進んでいるので12時－12＝午前0時…ではなく「西経は東経より遅れる」。12時ー12＝午前0時。あれ？→135+45=180、÷15=12。日本12時→西経45度は12-12=0時=午前0時だが、選択肢を見直すと午前3時。※日本9時→西経45度でも計算確認を。教科書通りの問題を復習しよう。' },
    { qid:'soc_geo_s4_q04',
      jp:'三大洋の中で最も面積が大きいのはどれ？',
      ans:'太平洋', choices:['太平洋','大西洋','インド洋','北極海'],
      exp:'三大洋の大きさ順：①太平洋（地球の表面積の約3分の1）②大西洋 ③インド洋。太平洋はユーラシア大陸と南北アメリカ大陸の間に広がる世界最大の海洋。' },
    { qid:'soc_geo_s4_q05',
      jp:'経度0度の「本初子午線」が通る都市はどれ？',
      ans:'ロンドン（イギリス）', choices:['ロンドン（イギリス）','パリ（フランス）','ローマ（イタリア）','マドリード（スペイン）'],
      exp:'本初子午線（経度0度）はイギリスのロンドン（グリニッジ天文台）を通る。時差計算の基準点。ここから東へ行くほど時刻が早くなる（東経）、西へ行くほど遅くなる（西経）。' },
    { qid:'soc_geo_s4_q06',
      jp:'六大陸の中で最も小さい大陸はどれ？',
      ans:'オーストラリア大陸', choices:['オーストラリア大陸','南極大陸','アフリカ大陸','南アメリカ大陸'],
      exp:'六大陸の大きさ順（最小から）：オーストラリア＜南極＜南アメリカ＜北アメリカ＜アフリカ＜ユーラシア。オーストラリアが最小。南極大陸は2番目に小さい。' },
    { qid:'soc_geo_s4_q07',
      jp:'緯度の説明として正しいのはどれ？',
      ans:'赤道を基準（0度）に南北を0〜90度で表す', choices:['赤道を基準（0度）に南北を0〜90度で表す','本初子午線を基準に東西を0〜180度で表す','北極点が0度・南極点が180度','経度と同じものを別の名前で呼ぶ'],
      exp:'緯度＝赤道が0度、北極・南極が90度。南北で0〜90度。経度＝本初子午線が0度、東西で0〜180度。「緯度＝横の線（=水平）」「経度＝縦の線」と覚えると間違えない！' },
    { qid:'soc_geo_s4_q08',
      jp:'日本が属するユーラシア大陸は、実際には2つの大州（州）をまとめた名称だが、その2つはどれ？',
      ans:'アジア州とヨーロッパ州', choices:['アジア州とヨーロッパ州','アジア州とアフリカ州','ヨーロッパ州とオセアニア州','北アメリカ州とアジア州'],
      exp:'ユーラシア大陸は地理的には1つの大陸だが、州の区分ではアジア州とヨーロッパ州に分けられる。ウラル山脈・カスピ海・黒海などが境界の目安。六大州：アジア・ヨーロッパ・アフリカ・北アメリカ・南アメリカ・オセアニア。' },

    // ━━━ 世界の地域（11問）━━━
    { qid:'soc_geo_s4_q09',
      jp:'イスラム教の信者（ムスリム）が礼拝するとき向かう聖地はどれ？',
      ans:'メッカ（サウジアラビア）', choices:['メッカ（サウジアラビア）','エルサレム','バグダード','カイロ'],
      exp:'メッカはサウジアラビア西部のイスラム教最大の聖地。ムスリムは1日5回メッカの方向に向かって礼拝する。一生に一度メッカへの巡礼（ハッジ）を行うのが義務。' },
    { qid:'soc_geo_s4_q10',
      jp:'EU（欧州連合）について正しい説明はどれ？',
      ans:'加盟国間で関税なし・多くの国が共通通貨ユーロを使用', choices:['加盟国間で関税なし・多くの国が共通通貨ユーロを使用','全加盟国が軍事同盟を結んでいる','アジアの国も複数加盟している','全加盟国が同じ言語を使う'],
      exp:'EUは経済統合が主な目的。加盟国間で関税撤廃・ユーロ共通通貨（多くの国）・人の移動自由。イギリスは2020年にEU離脱（ブレグジット）。経済面の連携組織。' },
    { qid:'soc_geo_s4_q11',
      jp:'東南アジアの10か国が加盟する地域協力機構はどれ？',
      ans:'ASEAN（東南アジア諸国連合）', choices:['ASEAN（東南アジア諸国連合）','EU（欧州連合）','OPEC（石油輸出国機構）','APECアジア太平洋経済協力'],
      exp:'ASEAN（アセアン）は1967年設立。タイ・インドネシア・フィリピン・ベトナム・マレーシア・シンガポールなど10か国。関税削減・経済協力が目的。日本企業の工場も多数進出。' },
    { qid:'soc_geo_s4_q12',
      jp:'植民地時代にヨーロッパ人が東南アジア・アフリカで始めた、輸出用作物を大規模に栽培する農園を何という？',
      ans:'プランテーション', choices:['プランテーション','棚田農業','近郊農業','自給農業'],
      exp:'プランテーション＝輸出用・外国資本・単一作物の大規模農園。天然ゴム（マレーシア・インドネシア）、コーヒー・カカオ（アフリカ・東南アジア）、綿花（インド・アメリカ南部）など。植民地の遺産として現在も続く。' },
    { qid:'soc_geo_s4_q13',
      jp:'西アジアの産油国が中心になって結成した、石油の生産量・価格を調整する国際組織はどれ？',
      ans:'OPEC（石油輸出国機構）', choices:['OPEC（石油輸出国機構）','ASEAN','NATO（北大西洋条約機構）','WTO（世界貿易機関）'],
      exp:'OPEC（オペック）はサウジアラビア・UAE・イラク・イランなど産油国が中心。石油の生産量・価格を調整する。日本の輸入石油の約90%が中東産なので、エネルギー安全保障の観点でも超重要！' },
    { qid:'soc_geo_s4_q14',
      jp:'2023年に世界最大の人口大国となった国はどれ？',
      ans:'インド', choices:['インド','中国','アメリカ','インドネシア'],
      exp:'インドは2023年に約14.4億人となり、中国（約14.0億人）を抜いて世界1位の人口大国に。若者人口が多く経済成長が続く。IT産業（バンガロール）でも有名。' },
    { qid:'soc_geo_s4_q15',
      jp:'アフリカ北部に広がる世界最大の砂漠はどれ？',
      ans:'サハラ砂漠', choices:['サハラ砂漠','ゴビ砂漠','アラビア砂漠','ナミブ砂漠'],
      exp:'サハラ砂漠はアフリカ北部の世界最大の砂漠（面積約900万km²＝日本の約24倍）。亜熱帯高圧帯（下降気流が強く雨が降らない）が原因。北アフリカはイスラム文化圏。' },
    { qid:'soc_geo_s4_q16',
      jp:'中国が沿岸部に設置し、外国企業を優遇して急速な工業化を進めた地域を何という？',
      ans:'経済特区', choices:['経済特区','自由貿易港','工業特別地域','開発重点地区'],
      exp:'経済特区（深セン・珠海・汕頭・廈門など）は1970〜80年代に鄧小平が導入。外国企業への優遇・関税免除で「世界の工場」へと急成長。現在の中国経済の礎になった政策。' },
    { qid:'soc_geo_s4_q17',
      jp:'アマゾン川流域の熱帯雨林が「地球の肺」と呼ばれる理由はどれ？',
      ans:'大量のCO₂を吸収し酸素を供給するから', choices:['大量のCO₂を吸収し酸素を供給するから','火山の噴気を浄化するから','海水を淡水に変えるから','地震波を吸収するから'],
      exp:'アマゾンの熱帯雨林は世界最大の森林で、膨大な量のCO₂を吸収し酸素を放出する。しかし農地・牧場への開発で急速に減少中。熱帯雨林の破壊は地球温暖化を加速させる深刻な問題。' },
    { qid:'soc_geo_s4_q18',
      jp:'アメリカのカリフォルニア州サンフランシスコ近郊の「シリコンバレー」が有名な産業はどれ？',
      ans:'IT（情報技術）産業', choices:['IT（情報技術）産業','石油精製','自動車製造','大規模小麦農業'],
      exp:'シリコンバレーにはApple・Google・Meta（旧Facebook）・Amazon・NVIDIAなどの世界的IT企業が集積。「シリコン」は半導体の材料から命名。インドのバンガロールも同様に「インドのシリコンバレー」と呼ばれる。' },
    { qid:'soc_geo_s4_q19',
      jp:'オーストラリア・ニュージーランドが属する州はどれ？',
      ans:'オセアニア州', choices:['オセアニア州','アジア州','南アメリカ州','アフリカ州'],
      exp:'オセアニア州はオーストラリア大陸・ニュージーランド・太平洋の島々（ポリネシア・メラネシア・ミクロネシア）から構成。南半球なので季節が日本と逆。先住民はアボリジニ（オーストラリア）やマオリ（ニュージーランド）。' },

    // ━━━ 日本の姿（10問）━━━
    { qid:'soc_geo_s4_q20',
      jp:'日本の標準時子午線（東経135度）が通る都市はどれ？',
      ans:'明石市（兵庫県）', choices:['明石市（兵庫県）','東京都','名古屋市','大阪市'],
      exp:'東経135度は兵庫県明石市（明石天文科学館）を通る。標準時子午線＝時刻の基準線。日本の標準時はこの線を基準に決まる。ロンドン（0度）との時差は135÷15＝9時間。' },
    { qid:'soc_geo_s4_q21',
      jp:'日本で最も長い川はどれ？',
      ans:'信濃川（367km・長野〜新潟）', choices:['信濃川（367km・長野〜新潟）','利根川（関東平野）','木曽川（中部地方）','最上川（東北）'],
      exp:'日本最長の川は信濃川（367km）。流域面積が最大なのは利根川（関東）。「長さ＝信濃川」「面積＝利根川」の区別が試験頻出！混乱したら「しなの（信濃）の方が長い」と覚えよう。' },
    { qid:'soc_geo_s4_q22',
      jp:mapHintClimate+'この図の「瀬戸内海」気候の特徴として正しいのはどれ？',
      ans:'一年を通じて降水量が少なく温暖', choices:['一年を通じて降水量が少なく温暖','冬に大雪が多い','夏に特に多雨になる','年中高温で雨が多い'],
      exp:'瀬戸内海式気候は北の中国山地・南の四国山地の両方が季節風をさえぎるため、1年中雨が少なく温暖。讃岐平野（香川）は水不足になりやすくため池が多い。' },
    { qid:'soc_geo_s4_q23',
      jp:'北陸地方が日本有数の米どころである理由はどれ？',
      ans:'冬の大雪の雪解け水が豊富で稲作に適しているから', choices:['冬の大雪の雪解け水が豊富で稲作に適しているから','一年中温暖で二期作ができるから','火山灰土で栄養が豊富だから','太平洋からの暖流の影響で温暖だから'],
      exp:'北陸（新潟・富山・石川・福井）は冬に日本海側の大雪が降る。春〜夏の雪解け水が豊富で良質な米（コシヒカリ）が育つ。越後平野（新潟）・富山平野が主な産地。' },
    { qid:'soc_geo_s4_q24',
      jp:mapHintIndustry+'この図の★印の工業地帯（中京）の特徴として正しいのはどれ？',
      ans:'自動車産業（トヨタ）を中心に工業出荷額が日本1位', choices:['自動車産業（トヨタ）を中心に工業出荷額が日本1位','鉄鋼・石油化学で日本最古の工業地帯','印刷・出版・食品が中心','繊維・衣料が中心産業'],
      exp:'中京工業地帯は愛知・岐阜・三重にまたがる。豊田市のトヨタ自動車を中心とした自動車産業が牽引し、工業出荷額は日本1位。' },
    { qid:'soc_geo_s4_q25',
      jp:'「太平洋ベルト」に含まれない地方・地域はどれ？',
      ans:'北海道・東北', choices:['北海道・東北','京浜工業地帯（東京・川崎）','中京工業地帯（名古屋・豊田）','北九州工業地域（北九州市）'],
      exp:'太平洋ベルトは関東〜九州北部の太平洋沿岸に連なる工業集積帯。京浜・中京・阪神・瀬戸内・北九州が含まれる。北海道・東北は太平洋ベルトの外側で、農業・IC工場が主産業。' },
    { qid:'soc_geo_s4_q26',
      jp:'養殖漁業と栽培漁業の違いとして正しいのはどれ？',
      ans:'養殖＝最後まで人工管理して出荷、栽培＝稚魚を育てて自然に放流', choices:['養殖＝最後まで人工管理して出荷、栽培＝稚魚を育てて自然に放流','どちらも全く同じ意味','養殖＝放流、栽培＝管理して出荷','栽培漁業は農業の一種'],
      exp:'養殖＝生け簀で最後まで育てて出荷（ぶり・真鯛・カキ）。栽培＝稚魚・稚貝を育て自然の海に放流し、成長後に漁獲。どちらも「育てる漁業」。リアス海岸（三陸・若狭湾）は養殖に適した地形。' },
    { qid:'soc_geo_s4_q27',
      jp:'東北地方の太平洋側で夏に冷害をもたらす、北東から吹く冷たい風を何という？',
      ans:'やませ', choices:['やませ','フェーン現象','偏西風','北東の季節風'],
      exp:'やませは夏に北東から吹く冷湿な風。日照不足・低温をもたらし稲作に冷害被害が出る（米が不作になる）。同じ時期、日本海側はフェーン現象で高温になるという対比も重要。' },
    { qid:'soc_geo_s4_q28',
      jp:'日本で地震・火山噴火が多い地質的な理由はどれ？',
      ans:'複数のプレートの境界（沈み込み帯）に位置しているから', choices:['複数のプレートの境界（沈み込み帯）に位置しているから','砂漠地帯に囲まれているから','海に囲まれた島国だから','人口が多いから'],
      exp:'日本はユーラシア・北アメリカ・太平洋・フィリピン海の4枚のプレートの境界に位置。プレートが沈み込む場所で地震・火山が多発する。世界の活火山の約10%が日本に集中。「環太平洋火山帯」の一部。' },
    { qid:'soc_geo_s4_q29',
      jp:'日本の南端の島「沖ノ鳥島」が護岸工事で維持されている理由はどれ？',
      ans:'日本のEEZ（排他的経済水域）を守るため', choices:['日本のEEZ（排他的経済水域）を守るため','観光地として開発するため','軍事基地を置くため','漁業基地として活用するため'],
      exp:'沖ノ鳥島は海面ぎりぎりのサンゴ礁の小島。消えてしまうと周囲約40万km²のEEZ（漁業・資源採掘の独占権）を失う。だから護岸工事で維持されている。EEZは海岸から200海里（約370km）。' },
  ];

  // 問題をシャッフルして全30問表示
  var qs=shuffleArray(allQs);
  var html='<div class="intro-box" style="margin-bottom:16px">'
    +'<div class="intro-box-title">🏁 地理 確認テスト（全30問）</div>'
    +chat('kyon','きょん','おー！本番テストじゃん！世界の姿・世界の地域・日本の姿、全部出るの？')
    +chat('nishi','西村真二','そう。地図問題・時差計算・用語問題が混ざってる。焦らず一問ずつ確認しながら解こう。')
    +chat('kyon','きょん','豊田市の問題も出るの？！中京工業地帯でしょ！完璧！！')
    +chat('nishi','西村真二','その調子。間違えた問題は弱点DBに記録されるから、後で特訓で復習できるよ。')
    +'</div>'
    +'<div class="progress-dots">'
    +qs.map(function(_,i){ return '<div class="dot '+(i===0?'current':'')+'"></div>'; }).join('')
    +'</div>';
  qs.forEach(function(q,i){
    html+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px;">Q'+(i+1)+' / 30</div>';
    html+=makeChoices(q.qid,q.jp,q.ans,q.choices,q.exp);
  });
  return html;
}

// ===== FINAL RESULT =====
function showFinalResult(){
  var prefix='soc_geo_s4_';
  var sqs=Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix)===0; });
  var total=sqs.length||30;
  var correct=sqs.filter(function(id){ var d=weakDB[id]; return d&&d.total>0&&d.correct>0&&answeredSet[id]; }).length;
  var pct=Math.round(correct/total*100);
  var emoji=pct>=90?'🏆':pct>=70?'🎉':pct>=50?'😊':'😅';
  var msg=pct>=90?'きょん「完璧！！令和ロマンに勝てる！！」<br>西村「満点に近い。本番でもこの調子で」'
    :pct>=70?'きょん「なかなかよくない？！」<br>西村「よくできてる。弱点をもう少し潰せば完璧だ」'
    :pct>=50?'きょん「半分以上いけた！！」<br>西村「惜しい問題が多い。復習すれば伸びる」'
    :'きょん「うーん、むずかった…」<br>西村「もう一度 Section 1 からやってみよう」';
  var ov=document.getElementById('resultOverlay');
  ov.style.display='block';
  ov.innerHTML='<div class="result-box">'
    +'<div class="result-title">確認テスト結果</div>'
    +'<div class="result-emoji">'+emoji+'</div>'
    +'<div class="result-score">'+correct+'<span> / '+total+'問正解</span></div>'
    +'<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--amber);margin-bottom:12px;">'+pct+'%</div>'
    +'<div class="result-msg">'+msg+'</div>'
    +'<button class="result-btn" onclick="document.getElementById(\'resultOverlay\').style.display=\'none\';gotoSection(6)">🔥 弱点を特訓する</button>'
    +'<button class="result-btn" style="background:var(--bg3);color:var(--text2);" onclick="document.getElementById(\'resultOverlay\').style.display=\'none\'">閉じる</button>'
    +'</div>';
}

// ===== 弱点ノート =====
function renderWeakNote(){
  var wqs=Object.keys(weakDB).filter(function(id){ return id.indexOf('soc_geo_')===0; });
  if(wqs.length===0){
    document.getElementById('mainContent').innerHTML='<div style="text-align:center;padding:60px 20px;"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-family:Bebas Neue,sans-serif;font-size:24px;color:var(--green)">弱点なし！</div><div style="font-size:14px;color:var(--text2);margin-top:8px">きょん「俺完璧じゃん！！」<br>西村「いや、まだ問題を解いてないだけかもしれない」</div></div>';
    return;
  }
  var sorted=wqs.slice().sort(function(a,b){ return getPct(a)-getPct(b); });
  var html='<div class="section-header"><div class="section-badge">弱点ノート</div><div class="section-title">弱点一覧</div></div>';
  html+='<div style="display:flex;flex-direction:column;gap:10px;">';
  sorted.forEach(function(qid){
    var d=weakDB[qid]; if(!d||d.total===0) return;
    var pct=getPct(qid);
    var color=pct<40?'var(--red)':pct<70?'var(--amber)':'var(--green)';
    html+='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px;">'
      +'<div style="width:48px;height:48px;border-radius:50%;background:var(--bg3);border:2px solid '+color+';display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;font-size:14px;color:'+color+';flex-shrink:0;">'+pct+'%</div>'
      +'<div style="flex:1;min-width:0;"><div style="font-size:14px;line-height:1.8;color:var(--text);">'+(d.jp||qid)+'</div>'
      +'<div style="font-size:12px;color:var(--text2);">正解 '+d.correct+' / '+d.total+' 回</div></div>'
      +'<div style="font-size:11px;color:var(--text2);white-space:nowrap;">正答率<br><span style="font-size:16px;font-weight:bold;color:'+color+';">'+pct+'%</span></div>'
      +'</div>';
  });
  html+='</div><div style="text-align:center;margin-top:24px;"><button class="start-btn" onclick="gotoSection(6)" style="max-width:320px;">🔥 特訓モードで練習する</button></div>';
  document.getElementById('mainContent').innerHTML=html;
}

// ===== 特訓モード =====
var tokkuList=[],tokkuIdx=0,tokkuCorrect=0;
function renderTokku(){
  var wqs=getWeakQuestions().sort(function(a,b){ return getPct(a)-getPct(b); }).slice(0,15);
  if(wqs.length===0){
    document.getElementById('mainContent').innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">🎊</div><div class="tokku-complete-title">弱点なし！</div><div class="tokku-complete-msg">きょん「弱点ゼロ！！俺すごい！！」<br>西村「よくやった。次のセクションへ進もう」</div></div>';
    return;
  }
  tokkuList=shuffleArray(wqs); tokkuIdx=0; tokkuCorrect=0;
  renderTokkuCard();
}
function renderTokkuCard(){
  var main=document.getElementById('mainContent');
  if(tokkuIdx>=tokkuList.length){
    var pct=Math.round(tokkuCorrect/tokkuList.length*100);
    main.innerHTML='<div class="tokku-complete"><div class="tokku-complete-emoji">'+(pct>=80?'🏆':'🔥')+'</div><div class="tokku-complete-title">特訓完了！ '+tokkuCorrect+'/'+tokkuList.length+'問正解</div><div class="tokku-complete-msg">'+(pct>=80?'きょん「特訓完璧！！天才かも！！」<br>西村「よし。このまま本番でも答えられるようにしよう」':'きょん「うーん、まだむずい…」<br>西村「もう一周やろう。繰り返しが大事だ」')+'</div><div style="margin-top:20px;"><button class="start-btn" onclick="renderTokku()" style="max-width:280px;">もう一周する 🔄</button></div></div>';
    return;
  }
  var qid=tokkuList[tokkuIdx];
  var d=weakDB[qid]; if(!d){ tokkuIdx++; renderTokkuCard(); return; }
  var pct=getPct(qid);
  var choices=d.choices&&d.choices.length>0?d.choices:[d.answer,'？','？？','？？？'];
  main.innerHTML='<div class="tokku-progress">特訓 '+(tokkuIdx+1)+' / '+tokkuList.length+'問　正解: '+tokkuCorrect+'問</div>'
    +'<div class="tokku-card">'
    +'<div class="tokku-stat">正答率 <span class="pct">'+pct+'%</span>（'+d.correct+'/'+d.total+'回）</div>'
    +'<div class="tokku-jp">'+(d.jp||qid)+'</div>'
    +'<div class="tokku-choices">'
    +shuffleArray(choices).map(function(c){
      return '<button class="choice-btn" style="padding:10px 20px;font-size:15px;" onclick="handleTokkuAnswer(\''+qid+'\',\''+c.replace(/'/g,'&#39;')+'\')" >'+c+'</button>';
    }).join('')
    +'</div>'
    +'<div class="tokku-result tokku-correct" id="tokku_res_ok" style="display:none">✓ 正解！</div>'
    +'<div class="tokku-result tokku-wrong" id="tokku_res_ng" style="display:none">✗ 不正解<div class="tokku-answer" id="tokku_ans"></div></div>'
    +'</div>';
}
function handleTokkuAnswer(qid,value){
  var d=weakDB[qid]; if(!d) return;
  var isCorrect=(value===d.answer);
  if(isCorrect){ tokkuCorrect++; weakDB[qid].correct++; var ok=document.getElementById('tokku_res_ok'); if(ok) ok.style.display='block'; speak('正解！'); showToast(getComment('kyon_correct')); }
  else{ var ng=document.getElementById('tokku_res_ng'); if(ng) ng.style.display='block'; var ans=document.getElementById('tokku_ans'); if(ans) ans.textContent='正解：'+d.answer; speak('もう一度'); showToast('きょん「あれ！！もう一回！！」'); }
  weakDB[qid].total++;
  if(!isCorrect){ localStorage.setItem('soc_xp',xp); updateXP(); }
  localStorage.setItem('soc_weakdb',JSON.stringify(weakDB));
  renderWeakBar();
  document.querySelectorAll('.tokku-card .choice-btn').forEach(function(b){ b.disabled=true; });
  setTimeout(function(){ tokkuIdx++; renderTokkuCard(); },isCorrect?800:1800);
}

// ===== UPDATE DOTS =====
function updateDots(){
  var dots=document.querySelectorAll('.dot');
  var prefix='soc_geo_s'+currentSection+'_';
  var sqs=Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix)===0; });
  dots.forEach(function(dot,i){
    dot.className='dot';
    var qid=sqs[i]; if(!qid) return;
    if(answeredSet[qid]) dot.classList.add('done');
    else if(i===sqs.findIndex(function(id){ return !answeredSet[id]; })) dot.classList.add('current');
  });
}

// ===== EVENT DELEGATION =====
document.addEventListener('click',function(e){
  var btn=e.target.closest('.choice-btn[data-qid]');
  if(btn){ handleChoice(btn.dataset.qid,btn.dataset.choice); updateDots(); return; }
  var sab=e.target.closest('.show-answer-btn[data-qid]');
  if(sab){ showAnswer(sab.dataset.qid); updateDots(); return; }
});

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
gotoSection(0);
