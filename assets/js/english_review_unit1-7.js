// ===== 中2英語 Unit1〜7 復習 =====
// localStorage prefix: nh3_ (英語共通XP)
// qid prefix: nh3_rev_s{n}_q{n}

// ===== XPレベル定義 =====
var LEVELS=[
  {lv:1,emoji:'🥚',title:'NSC入学',role:'見習い研修生',quote:'「英語？なにそれ食えるの？」',minXp:0},
  {lv:2,emoji:'🎤',title:'NSC卒業',role:'一般社員',quote:'「なんとなくわかってきた気がする」',minXp:100},
  {lv:3,emoji:'🎭',title:'劇場デビュー',role:'主任',quote:'「にっくん、俺英語できるかも」',minXp:250},
  {lv:4,emoji:'⭐',title:'準レギュラー獲得',role:'係長',quote:'「もしかして俺天才？」',minXp:450},
  {lv:5,emoji:'📺',title:'全国ネット',role:'課長',quote:'「にっくんより賢くなってきた」',minXp:700},
  {lv:6,emoji:'🌟',title:'冠番組獲得',role:'部長',quote:'「英語で漫才できるかもしれない」',minXp:1000},
  {lv:7,emoji:'🏆',title:'M-1決勝進出',role:'取締役',quote:'「もうにっくんいらないかも」',minXp:1400},
  {lv:8,emoji:'👑',title:'M-1グランプリ優勝',role:'社長',quote:'「俺、令和ロマンに勝ったわ」',minXp:2000},
];

// ===== セクション定義 =====
var SECTIONS=[
  {id:0,label:'📖 導入'},
  {id:1,label:'Unit1 不定詞'},
  {id:2,label:'Unit2 接続詞'},
  {id:3,label:'Unit3 不定詞・関係代名詞'},
  {id:4,label:'Unit4 助動詞'},
  {id:5,label:'Unit5 疑問詞+to'},
  {id:6,label:'Unit6 比較'},
  {id:7,label:'Unit7 受動態'},
  {id:8,label:'🏁 確認テスト'},
  {id:9,label:'🔥 弱点特訓'},
];

// ===== localStorage =====
var XP_KEY='nh3_xp';
var WEAK_KEY='nh3_weakdb';
var ANS_KEY='nh3_rev_answered';
var SECDONE_KEY='nh3_rev_secdone';

var xp=parseInt(localStorage.getItem(XP_KEY)||'0',10);
var weakDB=JSON.parse(localStorage.getItem(WEAK_KEY)||'{}');
var answeredSet=JSON.parse(localStorage.getItem(ANS_KEY)||'{}');
var secDone=JSON.parse(localStorage.getItem(SECDONE_KEY)||'{}');
var currentSection=0;
var qMeta={};

function saveXp(){localStorage.setItem(XP_KEY,String(xp));}
function saveWeak(){localStorage.setItem(WEAK_KEY,JSON.stringify(weakDB));}
function saveAns(){localStorage.setItem(ANS_KEY,JSON.stringify(answeredSet));}
function saveSec(){localStorage.setItem(SECDONE_KEY,JSON.stringify(secDone));}

// ===== ユーティリティ =====
function shuffle(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function getLevel(v){var l=LEVELS[0];for(var i=0;i<LEVELS.length;i++){if(v>=LEVELS[i].minXp)l=LEVELS[i];}return l;}
function getLevelProgress(v){var cur=getLevel(v);var idx=LEVELS.indexOf(cur);if(idx===LEVELS.length-1)return{pct:100,label:'最高ランク達成！'};var next=LEVELS[idx+1];var pct=Math.round(((v-cur.minXp)/(next.minXp-cur.minXp))*100);return{pct:pct,label:(v-cur.minXp)+' / '+(next.minXp-cur.minXp)+' XP'};}

function showToast(msg,color){
  var t=document.getElementById('toast');
  t.textContent=msg; t.style.background=color||'#1d6334';
  t.style.display='block'; t.style.opacity='1';
  setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.style.display='none';},400);},2200);
}
function updateXpBar(){
  var lv=getLevel(xp); var prog=getLevelProgress(xp);
  document.getElementById('xpBadge').textContent=lv.title;
  document.getElementById('xpLevel').textContent='Lv.'+lv.lv+' '+lv.emoji;
  document.getElementById('xpTitle').textContent=lv.role;
  document.getElementById('xpStatus').textContent='きょん '+lv.quote;
  document.getElementById('xpFill').style.width=Math.min(prog.pct,100)+'%';
  var _xpKeys=['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp'];
  var _total=Math.max(0,_xpKeys.reduce(function(s,k){return s+parseInt(localStorage.getItem(k)||'0',10);},0)-parseInt(localStorage.getItem('shop_spent')||'0',10));
  var _coinEl=document.getElementById('coinTotal');if(_coinEl){_coinEl.textContent='🪙 '+_total.toLocaleString()+' XP';_coinEl.classList.add('bump');setTimeout(function(){_coinEl.classList.remove('bump');},350);}
  document.getElementById('xpNext').textContent=prog.pct>=100?'🏆 最高ランク達成！（'+xp+' XP）':xp+' XP ／ '+prog.label;
}

// ===== 弱点DB =====
function getPct(qid){var d=weakDB[qid];if(!d||d.total===0)return 100;return Math.round(d.correct/d.total*100);}
function recordAnswer(qid,correct){
  if(!weakDB[qid])weakDB[qid]={jp:'',answer:'',choices:[],correct:0,total:0};
  var m=qMeta[qid];
  if(m){weakDB[qid].jp=m.jp;weakDB[qid].answer=m.answer;weakDB[qid].choices=m.choices||[];}
  weakDB[qid].total++;
  if(correct)weakDB[qid].correct++;
  saveWeak();
}
function getWeakQuestions(){
  return Object.keys(weakDB).filter(function(id){
    return id.indexOf('nh3_rev_')===0&&weakDB[id].total>0&&getPct(id)<80;
  });
}
function renderWeakBar(){
  var items=document.getElementById('weakItems'); if(!items)return;
  var wqs=getWeakQuestions().sort(function(a,b){return getPct(a)-getPct(b);}).slice(0,8);
  if(wqs.length===0){items.innerHTML='<span style="font-size:11px;color:var(--text2)">弱点なし 🎉</span>';return;}
  items.innerHTML=wqs.map(function(qid){
    var d=weakDB[qid]; var p=getPct(qid);
    var col=p<40?'var(--red)':p<70?'var(--amber)':'var(--green)';
    return '<span style="background:var(--bg3);border:1px solid '+col+';border-radius:20px;padding:2px 8px;font-size:11px;color:'+col+';">'+p+'% '+(d.jp?d.jp.slice(0,12)+'…':'?')+'</span>';
  }).join('');
}

// ===== タブ描画 =====
function renderTabs(){
  var tabs=document.getElementById('sectionTabs'); if(!tabs)return;
  tabs.innerHTML=SECTIONS.map(function(s){
    var active=s.id===currentSection?'active':'';
    var done=secDone[s.id]?' done-tab':'';
    var special=(s.id===9)?'tokku-tab':'';
    return '<button class="section-tab '+active+done+' '+special+'" data-sid="'+s.id+'">'+s.label+'</button>';
  }).join('');
  tabs.querySelectorAll('.section-tab').forEach(function(btn){
    btn.addEventListener('click',function(){goSection(parseInt(this.dataset.sid,10));});
  });
}
function goSection(id){currentSection=id;renderSection(id);renderTabs();renderWeakBar();}

// ===== NEXT/PREV ボタン =====
function nextBtn(id){
  if(id<8)return '<div style="text-align:center;margin-top:28px;"><button class="start-btn" onclick="goSection('+(id+1)+')">次へ ▶</button></div>';
  return '';
}

// ===== チャットバブル =====
function chat(type,name,text){
  var av=type==='kyon'
    ?'<div class="avatar av-kyon">き</div>'
    :'<div class="avatar av-nishi">西村</div>';
  return '<div class="chat-line">'+av+'<div class="chat-bubble"><div class="chat-name">'+name+'</div>'+text+'</div></div>';
}

// ===== 選択肢問題エンジン =====
function makeChoice(qid,jp,answer,choices,exp){
  choices=shuffle(choices);
  qMeta[qid]={type:'choice',answer:answer,xp:4,jp:jp,choices:choices};
  var done=answeredSet[qid];
  return '<div class="q-card" data-card="'+qid+'">'
    +'<div class="q-text">'+jp+'</div>'
    +'<div class="choices">'
    +choices.map(function(c){
      if(done)return '<button class="choice-btn '+(c===answer?'show-correct':'')+'" disabled>'+c+'</button>';
      return '<button class="choice-btn" data-qid="'+qid+'" data-choice="'+c+'">'+c+'</button>';
    }).join('')
    +'</div>'
    +'<div class="q-feedback correct-fb" id="fb_'+qid+'" style="'+(done?'display:block':'display:none')+'">✓ 正解！</div>'
    +'<div class="q-feedback wrong-fb" id="fbw_'+qid+'" style="display:none">✗ もう一度！</div>'
    +'<div class="exp-card" id="exp_card_'+qid+'" style="'+(done?'display:block':'display:none')+'">'
    +'<div class="exp-card-title">📌 解説</div>'
    +'<div style="font-size:13px;line-height:2.0;color:var(--text)">'+exp+'</div>'
    +'</div>'
    +'<button class="show-answer-btn" id="sab_'+qid+'" data-qid="'+qid+'">💡 答えを見る（XPなし）</button>'
    +'<div class="answer-revealed" id="ar_'+qid+'"><div class="ans-label">✅ 正解</div><div id="ar_ans_'+qid+'" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    +'<div class="artist-comment" id="ac_'+qid+'" style="'+(done?'display:block':'display:none')+'">'+(done?nishiOK():'')+'</div>'
    +'</div>';
}

function nishiOK(){var arr=['西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「ちゃんとわかってる」'];return arr[Math.floor(Math.random()*arr.length)];}
function kyonNG(){var arr=['きょん「あれ！？また間違えた！でも次は大丈夫！！」','きょん「うーん、惜しかった…！」'];return arr[Math.floor(Math.random()*arr.length)];}

// ===== クリックハンドラ =====
document.addEventListener('click',function(e){
  // 選択肢
  if(e.target.matches('.choice-btn[data-qid]')){
    var btn=e.target; var qid=btn.dataset.qid; var choice=btn.dataset.choice;
    var m=qMeta[qid]; if(!m||answeredSet[qid])return;
    var correct=choice===m.answer;
    var card=document.querySelector('[data-card="'+qid+'"]');
    if(!card)return;
    card.querySelectorAll('.choice-btn').forEach(function(b){b.disabled=true;});
    if(correct){
      xp+=m.xp; saveXp(); updateXpBar();
      answeredSet[qid]=true; saveAns();
      var fb=document.getElementById('fb_'+qid); if(fb)fb.style.display='block';
      var exp=document.getElementById('exp_card_'+qid); if(exp)exp.style.display='block';
      var ac=document.getElementById('ac_'+qid); if(ac){ac.textContent=nishiOK();ac.style.display='block';}
      var sab=document.getElementById('sab_'+qid); if(sab)sab.style.display='none';
      card.style.borderColor='var(--green)';
      showToast('✓ 正解！ +'+m.xp+' XP','#1d6334');
    } else {
      saveXp(); updateXpBar();
      var fbw=document.getElementById('fbw_'+qid); if(fbw){fbw.textContent=kyonNG();fbw.style.display='block';}
      setTimeout(function(){if(fbw)fbw.style.display='none';card.querySelectorAll('.choice-btn').forEach(function(b){b.disabled=false;});},1200);
      showToast('✗ もう一度！','#7c1d1d');
    }
    recordAnswer(qid,correct);
    renderWeakBar();
    checkSectionComplete();
  }
  // 答えを見るボタン
  if(e.target.matches('.show-answer-btn[data-qid]')){
    var qid=e.target.dataset.qid; var m=qMeta[qid]; if(!m)return;
    var ar=document.getElementById('ar_'+qid); var ans=document.getElementById('ar_ans_'+qid);
    if(ar&&ans){ar.style.display='block';ans.textContent=m.answer;}
    var exp=document.getElementById('exp_card_'+qid); if(exp)exp.style.display='block';
    e.target.style.display='none';
    var card=document.querySelector('[data-card="'+qid+'"]');
    if(card)card.querySelectorAll('.choice-btn').forEach(function(b){
      b.disabled=true;
      if(b.dataset.choice===m.answer)b.classList.add('show-correct');
    });
    recordAnswer(qid,false); renderWeakBar();
  }
});

function checkSectionComplete(){
  var prefix='nh3_rev_s'+currentSection+'_';
  var qs=Object.keys(qMeta).filter(function(id){return id.indexOf(prefix)===0;});
  if(qs.length===0)return;
  var done=qs.filter(function(id){return answeredSet[id];}).length;
  if(done>=qs.length){
    if(!secDone[currentSection]){
      secDone[currentSection]=true; saveSec();
      showToast('🎉 Unit'+(currentSection)+'クリア！ セクション完了！','#1d3a6d');
      renderTabs();
    }
  }
}

// ===== ルールカード共通HTML =====
function ruleCard(title,content){
  return '<div class="rule-card"><div class="rule-card-title">'+title+'</div>'+content+'</div>';
}
function ruleBox(title,note){
  return '<div class="rule-box"><div class="rule-title">'+title+'</div><div class="note">'+note+'</div></div>';
}
function exCard(en,ja){
  return '<div style="background:var(--bg2);border-left:3px solid var(--gold);border-radius:6px;padding:10px 14px;margin:6px 0;">'
    +'<div style="font-size:16px;font-family:\'Noto Serif JP\',sans-serif;letter-spacing:0.05em;color:var(--gold);">'+en+'</div>'
    +(ja?'<div style="font-size:13px;color:var(--text2);margin-top:4px;">'+ja+'</div>':'')
    +'</div>';
}
function sectionHeader(badge,title,sub){
  return '<div class="section-header"><div class="section-badge">'+badge+'</div><div class="section-title">'+title+'</div>'+(sub?'<div class="section-sub">'+sub+'</div>':'')+'</div>';
}
function progressDots(n,current){
  var h='<div class="progress-dots">';
  for(var i=0;i<n;i++)h+='<div class="dot '+(i===current?'current':'')+'"></div>';
  return h+'</div>';
}

// ===== SECTION 0: 導入 =====
function renderSection0(){
  var h=sectionHeader('中2英語','Unit 1〜7 文法復習','東京書籍 NEW HORIZON 2年');
  h+='<div class="intro-box">'
    +'<div class="intro-box-title">💬 スタートトーク</div>'
    +chat('kyon','きょん','中2の英語ってUnit1から7まであるじゃん。全部やらないとやばい？')
    +chat('nishi','西村真二','内申点に直結するから大事だよ。不定詞・接続詞・比較・受動態——このあたりが入試でも超頻出。')
    +chat('kyon','きょん','えー！？そんなに！？受動態ってなに？')
    +chat('nishi','西村真二','「〜される」という受け身の表現だよ。「This song is sung by Mika.」みたいな。')
    +chat('kyon','きょん','あ、そういうやつね！なんか聞いたことある！じゃあ全部やる！！')
    +chat('nishi','西村真二','その意気。Unit1から順番に進めよう。間違えても弱点DBに記録されるから後で復習できるよ。')
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">'
    +['Unit1 不定詞・動名詞','Unit2 接続詞（that/because/when）','Unit3 to不定詞副詞用法・have to','Unit4 should/must・動名詞','Unit5 疑問詞+to不定詞','Unit6 比較級・最上級・as...as','Unit7 受動態（be動詞+過去分詞）','🏁 総合確認テスト'].map(function(t,i){
      return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:13px;cursor:pointer;" onclick="goSection('+(i+1)+')">'+(i+1===8?t:'Unit'+(i+1)+' '+t)+'</div>';
    }).join('')
    +'</div>'
    +'<div style="text-align:center;margin-top:24px;"><button class="start-btn" onclick="goSection(1)">▶ Unit 1 からスタート</button></div>';
  return h;
}

// ===== SECTION 1: Unit1 不定詞・動名詞 =====
function renderSection1(){
  var h=sectionHeader('Unit 1','不定詞・動名詞の使い分け','What can we experience on a trip?');
  h+='<div class="intro-box">'
    +'<div class="intro-box-title">💬 Unit1 トーク</div>'
    +chat('kyon','きょん','「to go」と「going」って何が違うの？どっちでも同じじゃないの？')
    +chat('nishi','西村真二','動詞によって後ろに来る形が決まってる。enjoyは必ず「-ing」、wantは必ず「to+動詞」。')
    +chat('kyon','きょん','え、決まってるの！？じゃあ覚えるだけじゃん！！それは得意！！')
    +chat('nishi','西村真二','その通り。パターンで覚えるのが一番。enjoy / finish / stop → -ing。want / hope / decide → to+動詞。')
    +'</div>'
    +ruleCard('📐 不定詞（to + 動詞原形）vs 動名詞（動詞-ing）',
      ruleBox('不定詞のみとる動詞（want/hope/decide/plan/wish）','want <strong>to go</strong> ／ hope <strong>to see</strong> ／ decide <strong>to buy</strong><br>→ 未来志向・これからやること')
      +ruleBox('動名詞のみとる動詞（enjoy/finish/stop/keep/practice）','enjoy <strong>visiting</strong> ／ finish <strong>doing</strong> ／ stop <strong>running</strong><br>→ 実際に行っていること・具体的な行為')
      +ruleBox('形容詞的用法（名詞を修飾）','a place <strong>to visit</strong> ＝ 訪れるための場所<br>something <strong>to eat</strong> ＝ 食べるもの')
      +ruleBox('覚え方','「enjoy/finish/stop は-ingだけ！」←まずここを丸暗記！')
    )
    +exCard('I <strong>enjoyed visiting</strong> Takeshima Museum.','タケシマ水族館を訪れるのを楽しんだ。')
    +exCard('She <strong>wants to go</strong> to Toyoda Stadium next Sunday.','彼女は次の日曜日にトヨダスタジアムに行きたいと思っている。')
    +exCard('I found it <strong>exciting</strong>.（find + O + C）','それが面白いとわかった。')
    +'<div style="font-size:13px;color:var(--text2);margin:16px 0 8px">📝 練習問題（全10問）</div>'
    +progressDots(10,0);

  var qs=[
    {qid:'nh3_rev_s1_q0',jp:'（　）の中から正しい方を選ぼう：<br>I enjoy ( <strong>to swim / swimming</strong> ) in the sea.',ans:'swimming',choices:['swimming','to swim'],exp:'📐 enjoy は動名詞（-ing）のみ取る動詞。<br>✅ I enjoy <strong>swimming</strong>.<br>❌ I enjoy to swim. × <br>💡 enjoy / finish / stop → 必ず -ing！'},
    {qid:'nh3_rev_s1_q1',jp:'（　）の中から正しい方を選ぼう：<br>She wants ( <strong>to visit / visiting</strong> ) Kyoto.',ans:'to visit',choices:['to visit','visiting'],exp:'📐 want は to不定詞のみ取る動詞。<br>✅ She wants <strong>to visit</strong> Kyoto.<br>❌ She wants visiting Kyoto. ×<br>💡 want / hope / decide → 必ず to+動詞！'},
    {qid:'nh3_rev_s1_q2',jp:'正しい英文を選ぼう：<br>「私は宿題を終えた。」',ans:'I finished doing my homework.',choices:['I finished doing my homework.','I finished to do my homework.','I finished do my homework.','I finishs doing my homework.'],exp:'📐 finish は動名詞（-ing）のみとる動詞。<br>✅ I finished <strong>doing</strong> my homework.<br>💡 finish / enjoy / stop → -ing！'},
    {qid:'nh3_rev_s1_q3',jp:'「彼女は走るのをやめた。」— 正しい英文は？',ans:'She stopped running.',choices:['She stopped running.','She stopped to run.','She stopped runs.','She stopp running.'],exp:'📐 stop は動名詞（-ing）のみとる動詞。<br>✅ She stopped <strong>running</strong>.<br>⚠️ "stopped to run" は「走るために立ち止まった」という別の意味になる！'},
    {qid:'nh3_rev_s1_q4',jp:'日本語に合う英文の（　）に入る語は？<br>「私は新しい本を買いたい。」<br>I ( 　 ) to buy a new book.',ans:'want',choices:['want','enjoy','finish','stop'],exp:'📐 want + to + 動詞原形。<br>✅ I <strong>want to</strong> buy a new book.<br>💡 「〜したい」はwant to。enjoy/finish/stopは-ingを取るので不可。'},
    {qid:'nh3_rev_s1_q5',jp:'「これは読むための本です。」— 正しい英文は？',ans:'This is a book to read.',choices:['This is a book to read.','This is a book reading.','This is a book for read.','This is a book reads.'],exp:'📐 to不定詞の形容詞的用法：名詞+to+動詞原形<br>✅ a book <strong>to read</strong> ＝ 読むための本<br>a place to visit / something to eat / time to study — 同じパターン！'},
    {qid:'nh3_rev_s1_q6',jp:'「彼女は英語を勉強することが好きだ。」<br>She likes ( 　 ) English.',ans:'studying',choices:['studying','to study','study','studied'],exp:'📐 like は to+動詞・動名詞どちらもOKだが、この問題は選択肢から。<br>✅ She likes <strong>studying</strong> English. ← 動名詞<br>✅ She likes <strong>to study</strong> English. ← to不定詞も可<br>💡 like / love / hate / start → どちらでもOKな動詞！'},
    {qid:'nh3_rev_s1_q7',jp:'find + O + C の文として正しいのはどれ？<br>「私はそれが面白いとわかった。」',ans:'I found it exciting.',choices:['I found it exciting.','I found it excite.','I found exciting it.','I founded it exciting.'],exp:'📐 find + O（目的語）+ C（補語・形容詞）<br>✅ I found <strong>it exciting</strong>.<br>= Oが〜だとわかった。O → C（形容詞）の語順が大事！<br>💡 find + it + 形容詞 のパターンを丸暗記！'},
    {qid:'nh3_rev_s1_q8',jp:'「私には食べるものが何もない。」<br>I have ( 　 ) to eat.',ans:'nothing',choices:['nothing','something','anything','everything'],exp:'📐 nothing to eat = 食べるもの（食べるべきもの）が何もない<br>something to eat = 何か食べるもの<br>anything to eat = 食べるもの（疑問・否定文で）<br>💡 「食べるものが何もない」→ nothing'},
    {qid:'nh3_rev_s1_q9',jp:'「練習をやめないでください。」— 正しい英文は？',ans:'Please don\'t stop practicing.',choices:['Please don\'t stop practicing.','Please don\'t stop to practice.','Please don\'t stop practice.','Please stop practicing.'],exp:'📐 stop + -ing = 〜するのをやめる<br>✅ Please don\'t stop <strong>practicing</strong>. ← やめないで！<br>⚠️ stop to practice = 練習するために立ち止まる（別の意味）<br>💡 stop + -ing と stop + to不定詞は意味が違う！'},
  ];
  qs.forEach(function(q,i){h+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoice(q.qid,q.jp,q.ans,q.choices,q.exp);});
  h+=nextBtn(1);
  return h;
}

// ===== SECTION 2: Unit2 接続詞 =====
function renderSection2(){
  var h=sectionHeader('Unit 2','接続詞：that / because / when','What is local food?');
  h+='<div class="intro-box">'
    +'<div class="intro-box-title">💬 Unit2 トーク</div>'
    +chat('kyon','きょん','「I think that」の that って何？省略できるって聞いたけど…')
    +chat('nishi','西村真二','この that は接続詞で「〜ということ」という意味。省略してもOKだけど、試験では省略した形が出ることも多い。')
    +chat('kyon','きょん','あ、because は「なぜなら」でしょ？それは知ってる！')
    +chat('nishi','西村真二','そう。「なぜ？」→「because 〜だから」。that / because / when の3つをしっかりマスターしよう。')
    +'</div>'
    +ruleCard('📐 接続詞まとめ',
      ruleBox('that（〜ということ）省略可','I think <strong>that</strong> it\'s delicious. → I think it\'s delicious.<br>I know <strong>that</strong> he is kind. / I hope <strong>that</strong> you come.')
      +ruleBox('because（〜なので・〜だから）理由','I like Gamagori <strong>because</strong> it\'s beautiful.<br>「なぜ〜？」→「〜 because 〜」の形で答える')
      +ruleBox('when（〜するとき）時','<strong>When</strong> I came home, she was cooking.<br>= She was cooking <strong>when</strong> I came home.<br>⚠️ when節が前に来るときはカンマ（,）を入れる')
    )
    +exCard('I think <strong>(that)</strong> this is delicious.','これはおいしいと思う。')
    +exCard('I like Gamagori <strong>because</strong> it has a beautiful beach.','美しいビーチがあるのでガマゴリが好きだ。')
    +exCard('<strong>When</strong> I went to the park, it was raining.','公園に行ったとき、雨が降っていた。')
    +'<div style="font-size:13px;color:var(--text2);margin:16px 0 8px">📝 練習問題（全10問）</div>'
    +progressDots(10,0);

  var qs=[
    {qid:'nh3_rev_s2_q0',jp:'「私はそれが本当だと思う。」<br>I think ( 　 ) it is true.',ans:'that',choices:['that','because','when','if'],exp:'📐 I think + that + S + V<br>✅ I think <strong>that</strong> it is true.<br>💡 that は省略可能だが、試験では入れておく方が安全！'},
    {qid:'nh3_rev_s2_q1',jp:'「彼女はとても親切なので、私は彼女が好きです。」<br>I like her ( 　 ) she is very kind.',ans:'because',choices:['because','that','when','but'],exp:'📐 because = 〜なので（理由を表す接続詞）<br>✅ I like her <strong>because</strong> she is very kind.<br>💡 Why do you like her? → Because she is very kind. で答える！'},
    {qid:'nh3_rev_s2_q2',jp:'「家に帰ったとき、母は料理していた。」<br>( 　 ) I came home, my mother was cooking.',ans:'When',choices:['When','Because','That','But'],exp:'📐 when = 〜するとき（時を表す接続詞）<br>✅ <strong>When</strong> I came home, my mother was cooking.<br>💡 when節が前に来るときはカンマ（,）を使う！'},
    {qid:'nh3_rev_s2_q3',jp:'「私はきょんが天才だと知っている。」<br>I know ( 　 ) Kyon is a genius.',ans:'that',choices:['that','when','because','or'],exp:'📐 know + that + S + V<br>✅ I know <strong>that</strong> Kyon is a genius.<br>💡 think / know / hope / believe / be glad のあとは that + S + V！'},
    {qid:'nh3_rev_s2_q4',jp:'「なぜ日本食が好きなの？」に対する正しい答えは？',ans:'Because it is delicious.',choices:['Because it is delicious.','When it is delicious.','That it is delicious.','That is delicious.'],exp:'📐 Why〜? という質問に対して Because〜. で答える。<br>✅ <strong>Because</strong> it is delicious.<br>💡 "Why?" → "Because S+V." のパターンは絶対暗記！'},
    {qid:'nh3_rev_s2_q5',jp:'「私はあなたが来ることを願っています。」<br>I hope ( 　 ) you will come.',ans:'that',choices:['that','because','when','while'],exp:'📐 hope + that + S + V（〜ということを願う）<br>✅ I hope <strong>that</strong> you will come.<br>💡 I hope that〜 はよく使う表現。手紙やメールにもよく出る！'},
    {qid:'nh3_rev_s2_q6',jp:'次の2文を接続詞でつないだとき、正しいものは？<br>「She was tired. She went to bed early.」',ans:'She went to bed early because she was tired.',choices:['She went to bed early because she was tired.','She went to bed early when she was tired.','She went to bed early that she was tired.','Because she was tired she went to bed early without comma.'],exp:'📐 because は理由を表す。「疲れていたので早く寝た」。<br>✅ She went to bed early <strong>because</strong> she was tired.<br>💡 because節は前後どちらでもOK！ただし前に来るときはカンマ。'},
    {qid:'nh3_rev_s2_q7',jp:'「私は彼が来るとき、嬉しい。」<br>I am happy ( 　 ) he comes.',ans:'when',choices:['when','because','that','after'],exp:'📐 when = 〜するとき<br>✅ I am happy <strong>when</strong> he comes.<br>💡 because は理由、when は時。混乱したら日本語の意味で判断！'},
    {qid:'nh3_rev_s2_q8',jp:'下線部が正しいものを選ぼう：<br>「I think ( ア because / イ that / ウ when ) this food is very good.」',ans:'that',choices:['that','because','when'],exp:'📐 think + that + S + V（〜ということを思う）<br>✅ I think <strong>that</strong> this food is very good.<br>💡 think / know / hope → that を続ける！'},
    {qid:'nh3_rev_s2_q9',jp:'「外に出たとき、雨が降っていた。」— 正しい英文は？',ans:'When I went outside, it was raining.',choices:['When I went outside, it was raining.','Because I went outside, it was raining.','That I went outside, it was raining.','When I go outside, it was raining.'],exp:'📐 when + 過去形，過去進行形（〜していた）<br>✅ <strong>When</strong> I went outside, it was raining.<br>💡 外に出た「とき」→ when。過去のことだから went（過去形）！'},
  ];
  qs.forEach(function(q,i){h+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoice(q.qid,q.jp,q.ans,q.choices,q.exp);});
  h+=nextBtn(2);
  return h;
}

// ===== SECTION 3: Unit3 to不定詞副詞用法・have to =====
function renderSection3(){
  var h=sectionHeader('Unit 3','to不定詞の副詞用法・have to','What kind of job are you interested in?');
  h+='<div class="intro-box">'
    +'<div class="intro-box-title">💬 Unit3 トーク</div>'
    +chat('kyon','きょん','「have to」って「must」と同じ意味？どっちを使えばいい？')
    +chat('nishi','西村真二','意味はほぼ同じだよ。「have to」の方が日常会話でよく使われる。疑問文・否定文は have to の方が作りやすい。')
    +chat('kyon','きょん','あ、「I am happy to hear that.」って授業で出てきた！toは何なの？')
    +chat('nishi','西村真二','それはto不定詞の副詞用法。「〜して（うれしい）」という感情の原因を表してる。')
    +'</div>'
    +ruleCard('📐 to不定詞の副詞用法',
      ruleBox('①目的「〜するために」','I went to the store <strong>to buy</strong> milk.<br>She studied hard <strong>to pass</strong> the exam.')
      +ruleBox('②感情の原因「〜して（嬉しい/悲しい）」','I\'m happy <strong>to hear</strong> that.<br>I\'m glad <strong>to meet</strong> you.<br>She was sad <strong>to leave</strong> Japan.')
      +ruleBox('📐 have to（〜しなければならない）','You <strong>have to</strong> study English.<br>She <strong>has to</strong> clean her room. ← 3単現はhas<br>Do you <strong>have to</strong> go? ← 疑問文<br>I don\'t <strong>have to</strong> go. ← 否定（不要・〜しなくていい）')
    )
    +exCard('I went to the library <strong>to return</strong> books.','本を返すために図書館に行った。（目的）')
    +exCard('I\'m happy <strong>to see</strong> you again.','また会えて嬉しいです。（感情の原因）')
    +exCard('You <strong>have to</strong> be here by 9 a.m.','午前9時までにここに来なければならない。')
    +ruleCard('📐 関係代名詞（入門）',
      ruleBox('who（先行詞が人）','The teacher <strong>who</strong> teaches us English is kind.<br>→ "who teaches us English" が teacher を説明している')
      +ruleBox('that（先行詞が人・もの）','The book <strong>that</strong> I read was interesting.<br>→ 先行詞がものの場合は that（who は不可）<br>⚠️ 先行詞が人のときは who でも that でも OK！')
      +ruleBox('💡 関係代名詞の見分け方','1. 先行詞（前の名詞）を確認する<br>2. 人 → who（またはthat）<br>3. もの → that（またはwhich）<br>4. who/that の後ろは「動詞」か「主語+動詞」が続く')
    )
    +exCard('The teacher <strong>who</strong> lives in Nagoya is kind.','名古屋に住んでいる先生は親切だ。（who以下がteacherを修飾）')
    +exCard('The book <strong>that</strong> she wrote was very long.','彼女が書いた本はとても長かった。（that以下がbookを修飾）')
    +'<div style="font-size:13px;color:var(--text2);margin:16px 0 8px">📝 練習問題（全13問）</div>'
    +progressDots(13,0);

  var qs=[
    {qid:'nh3_rev_s3_q0',jp:'「私は牛乳を買うためにスーパーに行った。」<br>I went to the supermarket ( 　 ) buy some milk.',ans:'to',choices:['to','of','for','in'],exp:'📐 to不定詞の副詞用法（目的）：to + 動詞原形<br>✅ I went to the supermarket <strong>to</strong> buy some milk.<br>💡 「〜するために」= to + 動詞原形。前置詞のforとは違う！'},
    {qid:'nh3_rev_s3_q1',jp:'「それを聞いて嬉しいです。」— 正しい英文は？',ans:'I\'m happy to hear that.',choices:['I\'m happy to hear that.','I\'m happy hear that.','I\'m happy for hear that.','I\'m happy heard that.'],exp:'📐 to不定詞の副詞用法（感情の原因）<br>✅ I\'m happy <strong>to hear</strong> that.<br>💡 happy / glad / sad / surprised + to + 動詞原形 で感情の理由を表す！'},
    {qid:'nh3_rev_s3_q2',jp:'「あなたは毎日英語を勉強しなければならない。」<br>You ( 　 ) study English every day.',ans:'have to',choices:['have to','has to','must to','should to'],exp:'📐 have to + 動詞原形（〜しなければならない）<br>✅ You <strong>have to</strong> study English every day.<br>💡 主語が三人称単数→ has to。You / I → have to！'},
    {qid:'nh3_rev_s3_q3',jp:'「彼女は部屋を掃除しなければならない。」<br>She ( 　 ) clean her room.',ans:'has to',choices:['has to','have to','must to','should to'],exp:'📐 she（三人称単数）→ has to<br>✅ She <strong>has to</strong> clean her room.<br>💡 I / You / We / They → have to<br>He / She / It → has to（三単現のs！）'},
    {qid:'nh3_rev_s3_q4',jp:'「あなたは今行かなければなりませんか？」— 疑問文として正しいのは？',ans:'Do you have to go now?',choices:['Do you have to go now?','You have to go now?','Have you to go now?','Must you to go now?'],exp:'📐 have to の疑問文：Do/Does + 主語 + have to + 動詞原形？<br>✅ <strong>Do you have to go now?</strong><br>💡 have to は一般動詞扱い → do/does で疑問文を作る！'},
    {qid:'nh3_rev_s3_q5',jp:'「私は今日学校に行かなくていい。（不要）」— 正しい英文は？',ans:'I don\'t have to go to school today.',choices:['I don\'t have to go to school today.','I must not go to school today.','I have not to go to school today.','I doesn\'t have to go to school today.'],exp:'📐 don\'t have to = 〜しなくていい（不要）<br>✅ I <strong>don\'t have to</strong> go to school today.<br>⚠️ must not = 〜してはいけない（禁止）← 意味が全然違う！<br>💡 don\'t have to（不要）vs must not（禁止）は超頻出の区別！'},
    {qid:'nh3_rev_s3_q6',jp:'「彼女はまた会えて嬉しかった。」<br>She was glad ( 　 ) him again.',ans:'to see',choices:['to see','of see','for seeing','seeing'],exp:'📐 be glad + to + 動詞原形（感情の原因）<br>✅ She was glad <strong>to see</strong> him again.<br>💡 glad / happy / sad / surprised + to + 動詞原形！'},
    {qid:'nh3_rev_s3_q7',jp:'「私は試験に合格するために一生懸命勉強した。」<br>I studied hard ( 　 ) the exam.',ans:'to pass',choices:['to pass','of passing','for pass','passing'],exp:'📐 to + 動詞原形（目的：〜するために）<br>✅ I studied hard <strong>to pass</strong> the exam.<br>💡 「〜するために」は to + 動詞の原形。-ing や for + 名詞とは違う！'},
    {qid:'nh3_rev_s3_q8',jp:'次のうち「have to」の文として正しいのはどれ？',ans:'You have to finish your homework.',choices:['You have to finish your homework.','You have to finishing your homework.','You has to finish your homework.','You have finish your homework.'],exp:'📐 have to + 動詞の原形（原形！-ingや三単現はNG）<br>✅ You have to <strong>finish</strong> your homework.<br>❌ finishing / finishes はNG<br>💡 have to の後は必ず動詞の原形！'},
    {qid:'nh3_rev_s3_q9',jp:'下線部の意味として正しいのはどれ？<br>"I don\'t <u>have to</u> wake up early tomorrow."',ans:'明日は早く起きなくてよい（不要）',choices:['明日は早く起きなくてよい（不要）','明日は早く起きてはいけない（禁止）','明日は早く起きるつもりだ（予定）','明日は早く起きるべきだ（アドバイス）'],exp:'📐 don\'t have to = 〜しなくていい（不要・必要がない）<br>✅ 「明日は早く起きなくてよい（不要）」<br>⚠️ must not = してはいけない（禁止）とは違う！<br>💡 この区別は入試で毎年出る！絶対覚えよう！'},
    {qid:'nh3_rev_s3_q10',jp:'「英語を教えてくれる先生のことが好きだ。」<br>I like the teacher ( 　 ) teaches us English.',ans:'who',choices:['who','which','what','where'],exp:'📐 関係代名詞 who（先行詞が人）<br>✅ I like the teacher <strong>who</strong> teaches us English.<br>💡 先行詞（=前の名詞）が「人」のとき → who！<br>who の後ろには動詞（teaches）が続く！'},
    {qid:'nh3_rev_s3_q11',jp:'「彼女が書いた手紙は長かった。」<br>The letter ( 　 ) she wrote was long.',ans:'that',choices:['that','who','which she','what'],exp:'📐 関係代名詞 that（先行詞がもの）<br>✅ The letter <strong>that</strong> she wrote was long.<br>💡 先行詞（letter）がものの場合 → that！<br>that の後ろに she wrote（主語+動詞）が続く形に注意！'},
    {qid:'nh3_rev_s3_q12',jp:'「隣に住んでいる男性は医者だ。」— 正しい英文は？',ans:'The man who lives next door is a doctor.',choices:['The man who lives next door is a doctor.','The man which lives next door is a doctor.','The man that he lives next door is a doctor.','The man who live next door is a doctor.'],exp:'📐 関係代名詞 who + 動詞（三人称単数現在は s がつく！）<br>✅ The man <strong>who lives</strong> next door is a doctor.<br>💡 the man が先行詞（3人称単数）→ who の後ろの動詞は lives（s付き）！'},
  ];
  qs.forEach(function(q,i){h+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoice(q.qid,q.jp,q.ans,q.choices,q.exp);});
  h+=nextBtn(3);
  return h;
}

// ===== SECTION 4: Unit4 should/must・動名詞 =====
function renderSection4(){
  var h=sectionHeader('Unit 4','should / must・動名詞（目的語）','What is a problem in a homestay?');
  h+='<div class="intro-box">'
    +'<div class="intro-box-title">💬 Unit4 トーク</div>'
    +chat('kyon','きょん','「should」と「must」ってどっちも「〜しなきゃ」じゃないの？')
    +chat('nishi','西村真二','強さが違う。shouldは「〜すべき」でアドバイス。mustは「絶対〜しなきゃ」で強い義務・命令。')
    +chat('kyon','きょん','must notって「〜しなくていい」じゃないの？')
    +chat('nishi','西村真二','それはよく間違える！must not は「〜してはいけない」（禁止）。「しなくていい」は don\'t have to。')
    +'</div>'
    +ruleCard('📐 should / must / must not',
      ruleBox('should（〜すべきだ・〜した方がいい）アドバイス','You <strong>should</strong> try the local food.<br>You <strong>should not</strong> be late.')
      +ruleBox('must（〜しなければならない）強い義務','You <strong>must</strong> wear a helmet.<br>You <strong>must not</strong> smoke here. ← 禁止（〜してはいけない）')
      +ruleBox('⚠️ 超重要な区別','must not = してはいけない（禁止）<br>don\'t have to = しなくていい（不要）')
      +ruleBox('動名詞を目的語にとる動詞','enjoy / finish / stop / keep / practice + <strong>-ing</strong><br>look forward to <strong>-ing</strong>（toは前置詞！）<br>be interested in <strong>-ing</strong>')
    )
    +exCard('I\'m looking forward to <strong>visiting</strong> Gamagori.','ガマゴリを訪れることを楽しみにしている。')
    +exCard('You <strong>must not</strong> enter this room.','この部屋に入ってはいけない。（禁止）')
    +exCard('Keep <strong>trying</strong>! Don\'t give up!','挑戦し続けて！あきらめないで！')
    +'<div style="font-size:13px;color:var(--text2);margin:16px 0 8px">📝 練習問題（全10問）</div>'
    +progressDots(10,0);

  var qs=[
    {qid:'nh3_rev_s4_q0',jp:'「あなたはもっと野菜を食べるべきだ。」<br>You ( 　 ) eat more vegetables.',ans:'should',choices:['should','must not','don\'t have to','will'],exp:'📐 should = 〜すべきだ（アドバイス・推奨）<br>✅ You <strong>should</strong> eat more vegetables.<br>💡 医者のアドバイスや軽い義務には should！'},
    {qid:'nh3_rev_s4_q1',jp:'「ここで写真を撮ってはいけない。」<br>You ( 　 ) take pictures here.',ans:'must not',choices:['must not','don\'t have to','should','will not'],exp:'📐 must not = 〜してはいけない（禁止）<br>✅ You <strong>must not</strong> take pictures here.<br>⚠️ don\'t have to は「しなくていい（不要）」で全然違う意味！'},
    {qid:'nh3_rev_s4_q2',jp:'「今日は制服を着なくていい。（不要）」— 正しい英文は？',ans:'You don\'t have to wear your uniform today.',choices:['You don\'t have to wear your uniform today.','You must not wear your uniform today.','You should not wear your uniform today.','You have not to wear your uniform today.'],exp:'📐 don\'t have to = 〜しなくていい（不要・義務なし）<br>✅ You <strong>don\'t have to</strong> wear your uniform today.<br>⚠️ must not（禁止）と混乱しないこと！'},
    {qid:'nh3_rev_s4_q3',jp:'「私はバスケットボールを見ることを楽しんだ。」<br>I enjoyed ( 　 ) basketball.',ans:'watching',choices:['watching','to watch','watch','watched'],exp:'📐 enjoy + -ing（動名詞）<br>✅ I enjoyed <strong>watching</strong> basketball.<br>❌ enjoy to watch は文法的に間違い！<br>💡 enjoy / finish / stop → 必ず -ing！'},
    {qid:'nh3_rev_s4_q4',jp:'「私はガマゴリを訪れることを楽しみにしている。」<br>I am looking forward to ( 　 ) Gamagori.',ans:'visiting',choices:['visiting','visit','to visit','visited'],exp:'📐 look forward to + -ing（toは前置詞！原形でもto+原形でもない！）<br>✅ I am looking forward to <strong>visiting</strong> Gamagori.<br>💡 forward to の「to」は前置詞なので後ろは -ing！超重要！'},
    {qid:'nh3_rev_s4_q5',jp:'「彼女は音楽を聴くことに興味がある。」<br>She is interested in ( 　 ) music.',ans:'listening to',choices:['listening to','listen to','to listen to','listened to'],exp:'📐 be interested in + -ing（in は前置詞）<br>✅ She is interested in <strong>listening to</strong> music.<br>💡 in の後ろ → -ing（前置詞のうしろは動名詞！）'},
    {qid:'nh3_rev_s4_q6',jp:'「あなたはヘルメットをかぶらなければならない。」<br>You ( 　 ) wear a helmet.',ans:'must',choices:['must','should','don\'t have to','must not'],exp:'📐 must = 〜しなければならない（強い義務・ルール）<br>✅ You <strong>must</strong> wear a helmet.<br>💡 should はアドバイス、must は強い義務・命令！'},
    {qid:'nh3_rev_s4_q7',jp:'「挑戦し続けてください！」<br>Keep ( 　 )!',ans:'trying',choices:['trying','to try','try','tried'],exp:'📐 keep + -ing = 〜し続ける<br>✅ Keep <strong>trying</strong>!<br>💡 keep（続ける）も動名詞のみ取る動詞！keep / enjoy / finish / stop → -ing'},
    {qid:'nh3_rev_s4_q8',jp:'下線部が正しい文はどれ？',ans:'I practice speaking English every day.',choices:['I practice speaking English every day.','I practice to speak English every day.','I practice speak English every day.','I practices speaking English every day.'],exp:'📐 practice + -ing = 〜を練習する<br>✅ I practice <strong>speaking</strong> English every day.<br>💡 practice も動名詞のみ取る動詞の一つ！'},
    {qid:'nh3_rev_s4_q9',jp:'「must not」と「don\'t have to」の意味の違いとして正しいのはどれ？',ans:'must not＝してはいけない（禁止）、don\'t have to＝しなくていい（不要）',choices:['must not＝してはいけない（禁止）、don\'t have to＝しなくていい（不要）','must not＝しなくていい（不要）、don\'t have to＝してはいけない（禁止）','どちらも同じ意味','must not＝すべきでない、don\'t have to＝してはいけない'],exp:'📐 これは英語で最も間違えやすい区別の一つ！<br>✅ must not = してはいけない（禁止）← 強い禁止<br>✅ don\'t have to = しなくていい（不要・必要がない）<br>💡 入試で毎年出る！絶対覚えよう！'},
  ];
  qs.forEach(function(q,i){h+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoice(q.qid,q.jp,q.ans,q.choices,q.exp);});
  h+=nextBtn(4);
  return h;
}

// ===== SECTION 5: Unit5 疑問詞+to不定詞 =====
function renderSection5(){
  var h=sectionHeader('Unit 5','疑問詞 + to不定詞','What design is good for everyone?');
  h+='<div class="intro-box">'
    +'<div class="intro-box-title">💬 Unit5 トーク</div>'
    +chat('kyon','きょん','「how to make」って何？どういう意味なの？')
    +chat('nishi','西村真二','「どうやって〜するか・〜の仕方」。how to make = 作り方。what to do = 何をすべきか。疑問詞とtoをセットにした便利な表現だよ。')
    +chat('kyon','きょん','あ！料理レシピでよく見る「how to cook」もそれ？！')
    +chat('nishi','西村真二','そうそう。この形は名詞句として使えるから、文の中でいろんな場所に入れられる。')
    +'</div>'
    +ruleCard('📐 疑問詞 + to + 動詞原形',
      ruleBox('how to + 動詞（〜の仕方・どうやって〜するか）','I know <strong>how to</strong> make takoyaki.<br>Please tell me <strong>how to</strong> get there.')
      +ruleBox('what to + 動詞（何を〜すべきか）','I don\'t know <strong>what to</strong> do.<br>Tell me <strong>what to</strong> buy.')
      +ruleBox('when to + 動詞（いつ〜すべきか）','I\'m not sure <strong>when to</strong> leave.<br>Do you know <strong>when to</strong> start?')
      +ruleBox('where to + 動詞（どこで/に〜すべきか）','I don\'t know <strong>where to</strong> go.<br>Please tell me <strong>where to</strong> find good food.')
      +ruleBox('💡 文の書き換えパターン','I don\'t know <strong>what I should do</strong>.<br>= I don\'t know <strong>what to do</strong>.')
    )
    +exCard('Please tell me <strong>how to</strong> make this dish.','この料理の作り方を教えてください。')
    +exCard('I know <strong>where to</strong> buy the best ramen in Toyohashi.','豊橋で一番おいしいラーメンをどこで買えるか知ってる。')
    +'<div style="font-size:13px;color:var(--text2);margin:16px 0 8px">📝 練習問題（全10問）</div>'
    +progressDots(10,0);

  var qs=[
    {qid:'nh3_rev_s5_q0',jp:'「たこ焼きの作り方を知っている。」<br>I know ( 　 ) make takoyaki.',ans:'how to',choices:['how to','what to','when to','where to'],exp:'📐 how to + 動詞 = 〜の仕方・どうやって〜するか<br>✅ I know <strong>how to</strong> make takoyaki.<br>💡 「作り方」= how to make！レシピでよく使う！'},
    {qid:'nh3_rev_s5_q1',jp:'「何をすべきかわからない。」<br>I don\'t know ( 　 ) do.',ans:'what to',choices:['what to','how to','when to','where to'],exp:'📐 what to + 動詞 = 何を〜すべきか<br>✅ I don\'t know <strong>what to</strong> do.<br>💡 「何をすべきか」= what to do！困ったときの表現！'},
    {qid:'nh3_rev_s5_q2',jp:'「いつ出発すべきか教えてください。」<br>Please tell me ( 　 ) leave.',ans:'when to',choices:['when to','how to','what to','where to'],exp:'📐 when to + 動詞 = いつ〜すべきか<br>✅ Please tell me <strong>when to</strong> leave.<br>💡 「いつ〜するか」= when to。時間・タイミングを聞くとき！'},
    {qid:'nh3_rev_s5_q3',jp:'「どこへ行けばいいかわかる？」<br>Do you know ( 　 ) go?',ans:'where to',choices:['where to','how to','what to','when to'],exp:'📐 where to + 動詞 = どこで/に〜すべきか<br>✅ Do you know <strong>where to</strong> go?<br>💡 「どこへ行けばいいか」= where to go！'},
    {qid:'nh3_rev_s5_q4',jp:'「彼女はカレーの作り方を母に教えた。」— 正しい英文は？',ans:'She taught her mother how to make curry.',choices:['She taught her mother how to make curry.','She taught her mother how making curry.','She taught her mother what to make curry.','She taught her mother how to making curry.'],exp:'📐 how to + 動詞の原形（原形！-ingや三単現はNG）<br>✅ She taught her mother <strong>how to make</strong> curry.<br>💡 how to の後ろは必ず動詞の原形！'},
    {qid:'nh3_rev_s5_q5',jp:'次の2文を疑問詞+toを使って1文にしよう：<br>「I don\'t know. What should I eat here?」',ans:'I don\'t know what to eat here.',choices:['I don\'t know what to eat here.','I don\'t know what eat here.','I don\'t know how to eat here.','I don\'t know what to eating here.'],exp:'📐 what should I eat → what to eat（疑問詞+to の書き換え）<br>✅ I don\'t know <strong>what to eat</strong> here.<br>💡 疑問詞 + should + 動詞原形 → 疑問詞 + to + 動詞原形！'},
    {qid:'nh3_rev_s5_q6',jp:'「電車の乗り方を知らない。」— 「how to」を使った正しい英文は？',ans:'I don\'t know how to take a train.',choices:['I don\'t know how to take a train.','I don\'t know how to taking a train.','I don\'t know what to take a train.','I don\'t know how take a train.'],exp:'📐 how to + 動詞原形（原形のみ！-ingはダメ）<br>✅ I don\'t know <strong>how to take</strong> a train.<br>💡 take a train = 電車に乗る。how to の後ろは必ず原形！'},
    {qid:'nh3_rev_s5_q7',jp:'下線部の日本語訳として正しいのは？<br>"I learned <u>how to cook Japanese food</u> in school."',ans:'日本食の調理の仕方を',choices:['日本食の調理の仕方を','いつ日本食を作るかを','何を日本食に使うかを','どこで日本食を作るかを'],exp:'📐 how to cook = 調理の仕方・どうやって作るか<br>✅「日本食の<strong>調理の仕方</strong>を」<br>💡 how to + 動詞 = 〜の仕方。料理だけでなく様々な動詞に使える！'},
    {qid:'nh3_rev_s5_q8',jp:'次の2文を疑問詞+toで1文にしよう：<br>"I don\'t know. Where should I go?"— 正しいのは？',ans:'I don\'t know where to go.',choices:['I don\'t know where to go.','I don\'t know how to go.','I don\'t know where going.','I don\'t know when to go.'],exp:'📐 where should I go → where to go（疑問詞+to の書き換え）<br>✅ I don\'t know <strong>where to go</strong>.<br>💡 疑問詞 + should + 動詞 → 疑問詞 + to + 動詞原形！'},
    {qid:'nh3_rev_s5_q9',jp:'「彼はどのバスに乗ればいいか知らない。」<br>He doesn\'t know ( 　 ) take.',ans:'which bus to',choices:['which bus to','how to','when bus to','what bus take'],exp:'📐 which + 名詞 + to + 動詞 = どの〜を〜すべきか<br>✅ He doesn\'t know <strong>which bus to</strong> take.<br>💡 which + 名詞 + to + 動詞 という応用形も覚えよう！'},
  ];
  qs.forEach(function(q,i){h+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoice(q.qid,q.jp,q.ans,q.choices,q.exp);});
  h+=nextBtn(5);
  return h;
}

// ===== SECTION 6: Unit6 比較 =====
function renderSection6(){
  var h=sectionHeader('Unit 6','比較級・最上級・as...as構文','How can we make a good presentation?');
  h+='<div class="intro-box">'
    +'<div class="intro-box-title">💬 Unit6 トーク</div>'
    +chat('kyon','きょん','「taller」と「more tall」どっちが正しいの？')
    +chat('nishi','西村真二','短い単語（1〜2音節）は -er。長い単語（3音節以上）は more を前に置く。tallは短いから taller が正しい。')
    +chat('kyon','きょん','「as tall as」って何？「〜と同じくらい背が高い」？')
    +chat('nishi','西村真二','そう！Aとbが同じくらいのときに使う。否定にすると「AはBほど〜でない」になる。')
    +'</div>'
    +ruleCard('📐 比較級・最上級の作り方',
      ruleBox('規則変化','短い語：-er / -est　（tall→taller→tallest / fast→faster→fastest）<br>長い語：more / most（popular→more popular→most popular）<br>語尾がe：-r / -st（nice→nicer→nicest）<br>子音+y：y→i+er / y→i+est（happy→happier→happiest）')
      +ruleBox('不規則変化（要暗記！）','good/well → better → best<br>many/much → more → most<br>bad → worse → worst')
      +ruleBox('比較の文型','A is <strong>-er than</strong> B. / A is <strong>more〜 than</strong> B. →AはBより〜<br>A is <strong>the -est</strong> （of/in〜）. →Aが最も〜<br>A is <strong>as 〜 as</strong> B. →AはBと同じくらい〜<br>A is <strong>not as 〜 as</strong> B. →AはBほど〜でない')
    )
    +exCard('Yuki is <strong>taller than</strong> Mayu.','ユキはマユより背が高い。')
    +exCard('Kiso River is <strong>the longest</strong> river in Aichi.','木曽川は愛知で最も長い川だ。')
    +exCard('Toyohashi is <strong>as large as</strong> Nishio.','豊橋は西尾と同じくらいの広さだ。')
    +'<div style="font-size:13px;color:var(--text2);margin:16px 0 8px">📝 練習問題（全10問）</div>'
    +progressDots(10,0);

  var qs=[
    {qid:'nh3_rev_s6_q0',jp:'「マユはユキより速く走る。」<br>Mayu runs ( 　 ) Yuki.',ans:'faster than',choices:['faster than','more fast than','fast than','the fastest'],exp:'📐 fast（短い語）の比較級 → -er<br>✅ Mayu runs <strong>faster than</strong> Yuki.<br>💡 短い語（1音節）は -er + than の形。more fast は間違い！'},
    {qid:'nh3_rev_s6_q1',jp:'「このリンゴジュースはオレンジジュースより人気がある。」<br>This apple juice is ( 　 ) orange juice.',ans:'more popular than',choices:['more popular than','popularer than','the most popular','popular than'],exp:'📐 popular（3音節・長い語）の比較級 → more popular<br>✅ This apple juice is <strong>more popular than</strong> orange juice.<br>💡 3音節以上の語 → more を前に置く！'},
    {qid:'nh3_rev_s6_q2',jp:'「愛知で最も有名な観光地はどこですか？」<br>What is ( 　 ) place in Aichi?',ans:'the most famous',choices:['the most famous','the famousest','most famous','more famous'],exp:'📐 famous（3音節）の最上級 → the most famous<br>✅ What is <strong>the most famous</strong> place in Aichi?<br>💡 最上級には必ず the を付ける！"the most + 形容詞"'},
    {qid:'nh3_rev_s6_q3',jp:'「good の比較級と最上級は？」',ans:'better / best',choices:['better / best','gooder / goodest','more good / most good','gooder / most good'],exp:'📐 good は不規則変化！<br>✅ good → <strong>better</strong> → <strong>best</strong><br>💡 good/well → better → best は必須の不規則変化！<br>bad → worse → worst も一緒に覚えよう！'},
    {qid:'nh3_rev_s6_q4',jp:'「きょんは西村と同じくらい背が高い。」<br>Kyon is ( 　 ) Nishimura.',ans:'as tall as',choices:['as tall as','taller than','the tallest in','tall as'],exp:'📐 as + 形容詞（原級）+ as = AはBと同じくらい〜<br>✅ Kyon is <strong>as tall as</strong> Nishimura.<br>💡 as ... as の中は必ず原級（比較級ではない）！'},
    {qid:'nh3_rev_s6_q5',jp:'「私は彼女ほど速く走れない。」<br>I can\'t run ( 　 ) she can.',ans:'as fast as',choices:['as fast as','faster than','the fastest','more fast'],exp:'📐 not as + 原級 + as = AはBほど〜でない<br>✅ I can\'t run <strong>as fast as</strong> she can.<br>💡 not as〜as はよく使う！「ほど〜でない」という表現！'},
    {qid:'nh3_rev_s6_q6',jp:'「木曽川は愛知で最も長い川だ。」<br>Kiso River is ( 　 ) river in Aichi.',ans:'the longest',choices:['the longest','the most long','longer than','longest'],exp:'📐 long（短い語）の最上級 → the longest<br>✅ Kiso River is <strong>the longest</strong> river in Aichi.<br>💡 最上級には必ず the！短い語の最上級は -est！'},
    {qid:'nh3_rev_s6_q7',jp:'「happy の比較級は？」',ans:'happier',choices:['happier','more happy','happyer','more happier'],exp:'📐 子音+yで終わる語：y → i + er<br>✅ happy → <strong>happier</strong><br>💡 easy→easier, busy→busier, early→earlier も同じパターン！'},
    {qid:'nh3_rev_s6_q8',jp:'「この映画は去年より面白い。」— 正しい英文は？',ans:'This movie is more interesting than last year\'s.',choices:['This movie is more interesting than last year\'s.','This movie is interestinger than last year\'s.','This movie is most interesting than last year\'s.','This movie is more interestinger than last year\'s.'],exp:'📐 interesting（4音節）の比較級 → more interesting<br>✅ This movie is <strong>more interesting than</strong> last year\'s.<br>💡 長い語は more〜 than。-er + than にはしない！'},
    {qid:'nh3_rev_s6_q9',jp:'「クラスで（の中で）最も上手な歌手はだれですか？」<br>Who is ( 　 ) singer ( 　 ) your class?',ans:'the best / in',choices:['the best / in','better / in','the best / of','most good / in'],exp:'📐 最上級 + in + 場所（建物・場所・グループ）<br>　最上級 + of + 複数名詞（比べる対象の集まり）<br>✅ Who is <strong>the best</strong> singer <strong>in</strong> your class?<br>💡 in クラス・学校・都市 / of all / of the five のように使い分ける！'},
  ];
  qs.forEach(function(q,i){h+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoice(q.qid,q.jp,q.ans,q.choices,q.exp);});
  h+=nextBtn(6);
  return h;
}

// ===== SECTION 7: Unit7 受動態 =====
function renderSection7(){
  var h=sectionHeader('Unit 7','受動態（be動詞 + 過去分詞）','What are World Heritage Sites and their problems?');
  h+='<div class="intro-box">'
    +'<div class="intro-box-title">💬 Unit7 トーク</div>'
    +chat('kyon','きょん','受動態って何？普通の文と何が違うの？')
    +chat('nishi','西村真二','「〜する」が能動態、「〜される」が受動態。主語が動作を受ける側になる。')
    +chat('kyon','きょん','「English is used all over the world.」ってプリントにあったけど、これ受動態？')
    +chat('nishi','西村真二','そう！「英語は世界中で使われる」。be動詞+過去分詞。現在ならis/are、過去ならwas/were。')
    +'</div>'
    +ruleCard('📐 受動態（Passive Voice）',
      ruleBox('基本形：be動詞 + 過去分詞','現在：am/is/are + 過去分詞<br>過去：was/were + 過去分詞')
      +ruleBox('行為者：by + 人','This letter <strong>was written by</strong> him.<br>⚠️ 行為者が不明・一般の人のときはbyを省く')
      +ruleBox('否定文・疑問文','否定：be動詞 + not + 過去分詞<br>疑問：Be動詞 + 主語 + 過去分詞 〜?')
      +ruleBox('重要な不規則過去分詞（暗記必須！）','write→written / see→seen / make→made<br>use→used / know→known / give→given<br>speak→spoken / sing→sung / take→taken')
    )
    +exCard('<strong>English is used</strong> all over the world.','英語は世界中で使われている。')
    +exCard('<strong>This book was written by</strong> Dazai Osamu.','この本は太宰治によって書かれた。')
    +exCard('<strong>Was Mt. Fuji seen</strong> from here?','ここから富士山は見えましたか？')
    +'<div style="font-size:13px;color:var(--text2);margin:16px 0 8px">📝 練習問題（全10問）</div>'
    +progressDots(10,0);

  var qs=[
    {qid:'nh3_rev_s7_q0',jp:'「英語は世界中で使われている。」<br>English ( 　 ) all over the world.',ans:'is used',choices:['is used','uses','used','is using'],exp:'📐 受動態（現在）：is/am/are + 過去分詞<br>✅ English <strong>is used</strong> all over the world.<br>💡 English（単数）→ is used。use の過去分詞は used！'},
    {qid:'nh3_rev_s7_q1',jp:'「この本は太宰治によって書かれた。」<br>This book ( 　 ) Dazai Osamu.',ans:'was written by',choices:['was written by','written by','is written by','was write by'],exp:'📐 受動態（過去）：was/were + 過去分詞 + by 人<br>✅ This book <strong>was written by</strong> Dazai Osamu.<br>💡 write の過去分詞は written（不規則！）。by で行為者を表す。'},
    {qid:'nh3_rev_s7_q2',jp:'「この車はトヨタによって製造されている。」<br>This car ( 　 ) by Toyota.',ans:'is made',choices:['is made','was made','made','is making'],exp:'📐 受動態（現在）：is + 過去分詞<br>✅ This car <strong>is made</strong> by Toyota.<br>💡 make の過去分詞は made。is made = 作られている。'},
    {qid:'nh3_rev_s7_q3',jp:'「この歌はミカによって歌われた。」<br>This song ( 　 ) Mika.',ans:'was sung by',choices:['was sung by','is sung by','was sing by','sang by'],exp:'📐 受動態（過去）：was + 過去分詞 + by<br>✅ This song <strong>was sung by</strong> Mika.<br>💡 sing の過去分詞は sung（不規則！）。sing→sang→sung'},
    {qid:'nh3_rev_s7_q4',jp:'「ここから富士山は見えましたか？」— 疑問文として正しいのは？',ans:'Was Mt. Fuji seen from here?',choices:['Was Mt. Fuji seen from here?','Is Mt. Fuji seen from here?','Did Mt. Fuji see from here?','Was Mt. Fuji saw from here?'],exp:'📐 受動態の疑問文：Was/Were + 主語 + 過去分詞?<br>✅ <strong>Was</strong> Mt. Fuji <strong>seen</strong> from here?<br>💡 see の過去分詞は seen。過去の疑問文なので was！'},
    {qid:'nh3_rev_s7_q5',jp:'「この映画はここでは上映されていない。」— 正しい否定文は？',ans:'This movie is not shown here.',choices:['This movie is not shown here.','This movie not is shown here.','This movie is not show here.','This movie was not shown here.'],exp:'📐 受動態の否定文：be動詞 + not + 過去分詞<br>✅ This movie <strong>is not shown</strong> here.<br>💡 「現在」上映されていない → is not（現在形）<br>show の過去分詞は shown！'},
    {qid:'nh3_rev_s7_q6',jp:'次の能動態を受動態に書き換えよう：<br>「They use English all over the world.」',ans:'English is used all over the world.',choices:['English is used all over the world.','English is use all over the world.','English was used all over the world.','English uses all over the world.'],exp:'📐 能動態 → 受動態：目的語が主語になる<br>They use English → <strong>English is used</strong> (by them)<br>✅ English <strong>is used</strong> all over the world.<br>💡 by them は一般的なので省略OK！'},
    {qid:'nh3_rev_s7_q7',jp:'「その公園は1993年に建てられた。」<br>The park ( 　 ) in 1993.',ans:'was built',choices:['was built','is built','built','was build'],exp:'📐 受動態（過去）：was/were + 過去分詞<br>✅ The park <strong>was built</strong> in 1993.<br>💡 build（建てる）の過去分詞は built（不規則！）<br>1993年 = 過去 → was'},
    {qid:'nh3_rev_s7_q8',jp:'「make の過去分詞として正しいのは？」',ans:'made',choices:['made','maked','making','maden'],exp:'📐 make（作る）の活用：make → made → <strong>made</strong><br>✅ made が過去分詞<br>💡 make/made/made は不規則動詞。<br>write/wrote/written、see/saw/seen も確認しよう！'},
    {qid:'nh3_rev_s7_q9',jp:'下線部の説明として正しいのはどれ？<br>"Japanese is <u>spoken</u> in Japan."',ans:'「話されている」という受動態の過去分詞',choices:['「話されている」という受動態の過去分詞','「話している」という現在進行形','「話した」という過去形','「話す」という動詞の原形'],exp:'📐 is spoken = 話されている（受動態・現在）<br>speak → spoke → <strong>spoken</strong>（不規則変化）<br>✅ Japanese is <strong>spoken</strong> in Japan. = 日本では日本語が話されている<br>💡 受動態ではbe動詞+過去分詞のセットを見抜く！'},
  ];
  qs.forEach(function(q,i){h+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+'</div>'+makeChoice(q.qid,q.jp,q.ans,q.choices,q.exp);});
  h+=nextBtn(7);
  return h;
}

// ===== SECTION 8: 総合確認テスト =====
function renderSection8(){
  var h=sectionHeader('🏁 確認テスト','Unit1〜7 総合テスト','全問題から出題（シャッフル）');
  h+='<div class="intro-box" style="margin-bottom:16px">'
    +'<div class="intro-box-title">💬 確認テスト開始！</div>'
    +chat('kyon','きょん','全部のUnitから出るの！？やばい！準備できてるかな…')
    +chat('nishi','西村真二','Unit1〜7の全範囲からランダムに20問。間違えた問題は弱点DBに記録されるから安心して。')
    +chat('kyon','きょん','わかった！！全部正解して特訓ゼロにする！！')
    +'</div>'
    +progressDots(20,0);

  var allQs=[
    // Unit1
    {qid:'nh3_rev_s8_q00',jp:'「彼女は歌うことを楽しんだ。」<br>She enjoyed ( 　 ) a song.',ans:'singing',choices:['singing','to sing','sing','sings'],exp:'📐 enjoy + -ing（動名詞のみ）<br>✅ She enjoyed <strong>singing</strong> a song.<br>💡 enjoy / finish / stop → -ing！'},
    {qid:'nh3_rev_s8_q01',jp:'「食べるための何かが欲しい。」— 正しいのは？',ans:'I want something to eat.',choices:['I want something to eat.','I want something eating.','I want something eat.','I want to eat something.'],exp:'📐 something to eat = 食べるための何か（to不定詞の形容詞用法）<br>✅ I want <strong>something to eat</strong>.<br>💡 名詞+to+動詞原形 = 〜するための名詞！'},
    // Unit2
    {qid:'nh3_rev_s8_q02',jp:'「私はこれが正しいと思う。」<br>I think ( 　 ) this is right.',ans:'that',choices:['that','because','when','which'],exp:'📐 think + that + S+V<br>✅ I think <strong>that</strong> this is right.<br>💡 think/know/hope のあと → that！'},
    {qid:'nh3_rev_s8_q03',jp:'「疲れていたので早く寝た。」— 正しい英文は？',ans:'I went to bed early because I was tired.',choices:['I went to bed early because I was tired.','I went to bed early when I was tired.','I went to bed early that I was tired.','Because I was tired, I went to bed early, too.'],exp:'📐 because = 〜なので（理由）<br>✅ I went to bed early <strong>because</strong> I was tired.<br>💡 「なぜ〜？」→「〜だから because」！'},
    // Unit3
    {qid:'nh3_rev_s8_q04',jp:'「あなたは今日学校に行かなくていい。」<br>You ( 　 ) go to school today.',ans:'don\'t have to',choices:['don\'t have to','must not','should not','will not'],exp:'📐 don\'t have to = 〜しなくていい（不要）<br>✅ You <strong>don\'t have to</strong> go to school today.<br>⚠️ must not = してはいけない（禁止）と混乱しないこと！'},
    {qid:'nh3_rev_s8_q05',jp:'「また会えて嬉しいです。」<br>I\'m happy ( 　 ) you again.',ans:'to see',choices:['to see','see','seeing','of seeing'],exp:'📐 to不定詞の副詞用法（感情の原因）：be + 形容詞 + to + 動詞原形<br>✅ I\'m happy <strong>to see</strong> you again.<br>💡 happy/glad/sad/surprised + to + 動詞原形！'},
    // Unit4
    {qid:'nh3_rev_s8_q06',jp:'「ここでは禁煙です（タバコを吸ってはいけない）。」<br>You ( 　 ) smoke here.',ans:'must not',choices:['must not','don\'t have to','should','will not'],exp:'📐 must not = 〜してはいけない（禁止）<br>✅ You <strong>must not</strong> smoke here.<br>💡 must not（禁止）vs don\'t have to（不要）は最重要区別！'},
    {qid:'nh3_rev_s8_q07',jp:'「あなたは新鮮な魚を食べるべきだ。」<br>You ( 　 ) eat fresh fish.',ans:'should',choices:['should','must not','don\'t have to','will'],exp:'📐 should = 〜すべきだ（アドバイス・推奨）<br>✅ You <strong>should</strong> eat fresh fish.<br>💡 should はアドバイス・提案に使う助動詞！'},
    // Unit4（動名詞）
    {qid:'nh3_rev_s8_q08',jp:'「私は英語を話す練習を毎日している。」<br>I practice ( 　 ) English every day.',ans:'speaking',choices:['speaking','to speak','speak','spoke'],exp:'📐 practice + -ing（動名詞のみ）<br>✅ I practice <strong>speaking</strong> English every day.<br>💡 practice も動名詞のみとる動詞！'},
    {qid:'nh3_rev_s8_q09',jp:'「彼は試合を見ることを楽しみにしている。」<br>He is looking forward to ( 　 ) the game.',ans:'watching',choices:['watching','watch','to watch','watched'],exp:'📐 look forward to + -ing（toは前置詞！）<br>✅ He is looking forward to <strong>watching</strong> the game.<br>💡 forward to の「to」は前置詞 → 後ろは -ing！'},
    // Unit5
    {qid:'nh3_rev_s8_q10',jp:'「この料理の作り方を教えてください。」<br>Please tell me ( 　 ) this dish.',ans:'how to make',choices:['how to make','what to make','when to make','where to make'],exp:'📐 how to + 動詞 = 〜の仕方<br>✅ Please tell me <strong>how to make</strong> this dish.<br>💡 作り方 = how to make！'},
    {qid:'nh3_rev_s8_q11',jp:'「何を注文すればいいかわからない。」<br>I don\'t know ( 　 ) order.',ans:'what to',choices:['what to','how to','when to','where to'],exp:'📐 what to + 動詞 = 何を〜すべきか<br>✅ I don\'t know <strong>what to</strong> order.<br>💡 「何を〜すべきか」= what to！'},
    // Unit6
    {qid:'nh3_rev_s8_q12',jp:'「この映画はあれよりも面白い。」<br>This movie is ( 　 ) that one.',ans:'more interesting than',choices:['more interesting than','interestinger than','most interesting than','more interesting of'],exp:'📐 interesting（長い語）の比較級 → more interesting than<br>✅ This movie is <strong>more interesting than</strong> that one.<br>💡 長い語は more〜 than！-er はつけない！'},
    {qid:'nh3_rev_s8_q13',jp:'「goodの最上級は？」',ans:'best',choices:['best','most good','goodest','better'],exp:'📐 good → better → <strong>best</strong>（不規則変化）<br>✅ <strong>best</strong><br>💡 good/well → better → best は必須！文中では the best の形で使う。'},
    {qid:'nh3_rev_s8_q14',jp:'「きょんは西村と同じくらい面白い。」<br>Kyon is ( 　 ) Nishimura.',ans:'as funny as',choices:['as funny as','funnier than','the funniest','more funny than'],exp:'📐 as + 原級 + as = AはBと同じくらい〜<br>✅ Kyon is <strong>as funny as</strong> Nishimura.<br>💡 as〜asの中は必ず原級（funny）！'},
    // Unit7
    {qid:'nh3_rev_s8_q15',jp:'「このケーキはマイコによって作られた。」<br>This cake ( 　 ) Maiko.',ans:'was made by',choices:['was made by','is made by','made by','was make by'],exp:'📐 受動態（過去）：was + 過去分詞 + by<br>✅ This cake <strong>was made by</strong> Maiko.<br>💡 make の過去分詞は made（不規則！）'},
    {qid:'nh3_rev_s8_q16',jp:'「この歌は多くの若者に知られている。」<br>This song ( 　 ) many young people.',ans:'is known to',choices:['is known to','is known by','was known to','knows'],exp:'📐 be known to 人 = （人に）知られている<br>✅ This song <strong>is known to</strong> many young people.<br>💡 know の過去分詞は known。by でなく to を使うことに注意！'},
    {qid:'nh3_rev_s8_q17',jp:'次の文を受動態に書き換えよう：<br>「Mika sings this song.」',ans:'This song is sung by Mika.',choices:['This song is sung by Mika.','This song is sing by Mika.','This song was sung by Mika.','This song is singed by Mika.'],exp:'📐 能動態 → 受動態：目的語(this song)が主語に<br>✅ This song <strong>is sung by</strong> Mika.<br>💡 sing の過去分詞は sung（sing→sang→sung）。現在形なので is！'},
    {qid:'nh3_rev_s8_q18',jp:'「write の過去分詞は？」',ans:'written',choices:['written','wrote','writed','writing'],exp:'📐 write（書く）の活用：write → wrote → <strong>written</strong><br>✅ <strong>written</strong> が過去分詞<br>💡 受動態でよく出る！This book was written by〜'},
    {qid:'nh3_rev_s8_q19',jp:'「その学校は昨年建てられた。」— 正しい英文は？',ans:'The school was built last year.',choices:['The school was built last year.','The school is built last year.','The school built last year.','The school was build last year.'],exp:'📐 受動態（過去）：was + 過去分詞<br>✅ The school <strong>was built</strong> last year.<br>💡 build の過去分詞は built（不規則！）。昨年=過去 → was！'},
    // Unit3 関係代名詞
    {qid:'nh3_rev_s8_q20',jp:'「音楽が好きな友達が一人いる。」<br>I have a friend ( 　 ) likes music.',ans:'who',choices:['who','which','that she','what'],exp:'📐 関係代名詞 who（先行詞が人）<br>✅ I have a friend <strong>who</strong> likes music.<br>💡 先行詞（friend）が人 → who！後ろに動詞（likes）が続く！'},
    {qid:'nh3_rev_s8_q21',jp:'「これは私が読んだ本だ。」<br>This is the book ( 　 ) I read.',ans:'that',choices:['that','who','which I','what'],exp:'📐 関係代名詞 that（先行詞がもの）<br>✅ This is the book <strong>that</strong> I read.<br>💡 先行詞（book）がもの → that！後ろに I read（S+V）が続く！'},
    // Unit1 追加
    {qid:'nh3_rev_s8_q22',jp:'「私は毎朝ジョギングをするのを楽しんでいる。」<br>I enjoy ( 　 ) every morning.',ans:'jogging',choices:['jogging','to jog','jog','joged'],exp:'📐 enjoy + -ing（動名詞のみ）<br>✅ I enjoy <strong>jogging</strong> every morning.<br>💡 enjoy の後ろは必ず -ing！to jog は使えない！'},
    {qid:'nh3_rev_s8_q23',jp:'「どこに座ればいいか（座るための場所を）探している。」<br>I\'m looking for a place ( 　 ) sit.',ans:'to',choices:['to','of','for','in'],exp:'📐 to不定詞の形容詞的用法：名詞 + to + 動詞原形<br>✅ a place <strong>to</strong> sit = 座るための場所<br>💡 名詞+to+動詞原形 = 〜するための名詞！'},
    // Unit6 追加
    {qid:'nh3_rev_s8_q24',jp:'「bad の比較級と最上級は？」',ans:'worse / worst',choices:['worse / worst','badder / baddest','more bad / most bad','worse / most bad'],exp:'📐 bad は不規則変化！<br>✅ bad → <strong>worse</strong> → <strong>worst</strong><br>💡 good→better→best / bad→worse→worst はセットで暗記！'},
    {qid:'nh3_rev_s8_q25',jp:'「彼女はクラスで最も背が高い。」<br>She is ( 　 ) student in the class.',ans:'the tallest',choices:['the tallest','the most tall','taller than','tall'],exp:'📐 最上級（短い語）：the + -est<br>✅ She is <strong>the tallest</strong> student in the class.<br>💡 最上級には必ず the！in + 場所・グループ！'},
    // Unit2 追加
    {qid:'nh3_rev_s8_q26',jp:'「私はあなたに会えてうれしいと思った。」<br>I was glad ( 　 ) you.',ans:'to meet',choices:['to meet','meeting','of meet','met'],exp:'📐 to不定詞の副詞用法（感情の原因）：be glad + to + 動詞原形<br>✅ I was glad <strong>to meet</strong> you.<br>💡 be glad/happy/sad/surprised + to + 動詞原形！'},
    // Unit7 追加
    {qid:'nh3_rev_s8_q27',jp:'「工場でおもちゃが作られている。」<br>Toys ( 　 ) in the factory.',ans:'are made',choices:['are made','is made','make','were made'],exp:'📐 受動態（現在・複数主語）：are + 過去分詞<br>✅ Toys <strong>are made</strong> in the factory.<br>💡 Toys（複数）→ are！is ではない。make → made（不規則）'},
  ];

  var qs=shuffle(allQs).slice(0,20);
  qs.forEach(function(q,i){h+='<div style="font-size:12px;color:var(--text2);margin-bottom:6px">Q'+(i+1)+' / 20</div>'+makeChoice(q.qid,q.jp,q.ans,q.choices,q.exp);});
  h+='<div style="text-align:center;margin-top:28px;"><button class="start-btn" onclick="showFinalResult()">📊 結果を見る</button></div>';
  return h;
}

// ===== 最終結果 =====
function showFinalResult(){
  var prefix='nh3_rev_s8_';
  var sqs=Object.keys(qMeta).filter(function(id){return id.indexOf(prefix)===0;});
  var total=sqs.length||20;
  var correct=sqs.filter(function(id){var d=weakDB[id];return d&&d.total>0&&answeredSet[id]&&d.correct>0;}).length;
  var pct=Math.round(correct/total*100);
  var emoji=pct>=90?'🏆':pct>=70?'🎉':pct>=50?'😊':'😅';
  var msg=pct>=90?'きょん「完璧！！令和ロマンに勝てる！！」<br>西村「満点に近い。本番でもこの調子で」'
    :pct>=70?'きょん「なかなかよくない？！」<br>西村「よくできてる。弱点をもう少し潰せば完璧だ」'
    :pct>=50?'きょん「半分以上いけた！！」<br>西村「惜しい問題が多い。復習すれば伸びる」'
    :'きょん「うーん、むずかった…」<br>西村「Unit1から順番にもう一度やり直してみよう」';
  var ov=document.getElementById('resultOverlay');
  ov.style.display='block';
  ov.innerHTML='<div class="result-box">'
    +'<div class="result-title">確認テスト結果</div>'
    +'<div class="result-emoji">'+emoji+'</div>'
    +'<div class="result-score">'+correct+'<span> / '+total+'問正解</span></div>'
    +'<div style="font-family:Bebas Neue,sans-serif;font-size:28px;color:var(--amber);margin-bottom:12px;">'+pct+'%</div>'
    +'<div class="result-msg">'+msg+'</div>'
    +'<button class="result-btn" onclick="document.getElementById(\'resultOverlay\').style.display=\'none\';goSection(9)">🔥 弱点を特訓する</button>'
    +'<button class="result-btn" style="background:var(--bg3);color:var(--text2);" onclick="document.getElementById(\'resultOverlay\').style.display=\'none\'">閉じる</button>'
    +'</div>';
}

// ===== SECTION 9: 弱点特訓 =====
var tokkuList=[],tokkuIdx=0,tokkuCorrect=0;
function renderSection9(){
  var wqs=getWeakQuestions().sort(function(a,b){return getPct(a)-getPct(b);}).slice(0,15);
  if(wqs.length===0){
    document.getElementById('mainContent').innerHTML='<div style="text-align:center;padding:60px 20px;">'
      +'<div style="font-size:48px;margin-bottom:16px">🎉</div>'
      +'<div style="font-family:Bebas Neue,sans-serif;font-size:24px;color:var(--green)">弱点なし！</div>'
      +'<div style="font-size:14px;color:var(--text2);margin-top:8px">きょん「俺完璧じゃん！！天才！！」<br>西村「よし。本番でも同じように答えられるようにしよう」</div>'
      +'</div>';
    return;
  }
  tokkuList=shuffle(wqs); tokkuIdx=0; tokkuCorrect=0;
  renderTokkuCard();
}
function renderTokkuCard(){
  var main=document.getElementById('mainContent');
  if(tokkuIdx>=tokkuList.length){
    var pct=Math.round(tokkuCorrect/tokkuList.length*100);
    main.innerHTML='<div class="tokku-complete">'
      +'<div class="tokku-complete-emoji">'+(pct>=80?'🏆':'🔥')+'</div>'
      +'<div class="tokku-complete-title">特訓完了！ '+tokkuCorrect+'/'+tokkuList.length+'問正解</div>'
      +'<div class="tokku-complete-msg">'+(pct>=80
        ?'きょん「特訓完璧！！天才かも！！」<br>西村「よし。このまま本番でも答えられるようにしよう」'
        :'きょん「うーん、まだむずい…」<br>西村「もう一周やろう。繰り返しが大事だ」')+'</div>'
      +'<div style="margin-top:20px;"><button class="start-btn" onclick="renderSection9()" style="max-width:280px;">もう一周する 🔄</button></div>'
      +'</div>';
    return;
  }
  var qid=tokkuList[tokkuIdx];
  var d=weakDB[qid]; if(!d){tokkuIdx++;renderTokkuCard();return;}
  var p=getPct(qid);
  var choices=d.choices&&d.choices.length>0?d.choices:[d.answer,'？','？？'];
  choices=shuffle(choices);
  main.innerHTML='<div class="section-header"><div class="section-badge">特訓</div><div class="section-title">'+(tokkuIdx+1)+' / '+tokkuList.length+'問</div></div>'
    +'<div style="text-align:center;font-size:12px;color:var(--text2);margin-bottom:8px">正答率: '+p+'%（弱点）</div>'
    +'<div class="q-card">'
    +'<div class="q-text">'+d.jp+'</div>'
    +'<div class="choices">'
    +choices.map(function(c){return '<button class="choice-btn tokku-btn" data-ans="'+(c===d.answer?'1':'0')+'" data-qid="'+qid+'">'+c+'</button>';}).join('')
    +'</div></div>';
  main.querySelectorAll('.tokku-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var correct=this.dataset.ans==='1'; var qid=this.dataset.qid;
      main.querySelectorAll('.tokku-btn').forEach(function(b){b.disabled=true;if(b.dataset.ans==='1')b.classList.add('show-correct');});
      if(correct){xp+=3;saveXp();updateXpBar();tokkuCorrect++;showToast('✓ 正解！ +3 XP','#1d6334');}
      else{saveXp();updateXpBar();showToast('✗ もう一度！','#7c1d1d');}
      recordAnswer(qid,correct);
      setTimeout(function(){tokkuIdx++;renderTokkuCard();},900);
    });
  });
}

// ===== メインルーター =====
function renderSection(id){
  var main=document.getElementById('mainContent');
  var h='';
  if(id===0)h=renderSection0();
  else if(id===1)h=renderSection1();
  else if(id===2)h=renderSection2();
  else if(id===3)h=renderSection3();
  else if(id===4)h=renderSection4();
  else if(id===5)h=renderSection5();
  else if(id===6)h=renderSection6();
  else if(id===7)h=renderSection7();
  else if(id===8)h=renderSection8();
  else if(id===9){renderSection9();return;}
  main.innerHTML=h;
  main.scrollTop=0;
}

// ===== 初期化 =====
function init(){
  updateXpBar();
  renderTabs();
  renderWeakBar();
  renderSection(0);
}
init();
