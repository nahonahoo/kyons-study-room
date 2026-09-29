// ===== LEVELS =====
var LEVELS = [
  { lv:1, min:0,   max:20,  badge:'🥚 NSC入学',      title:'見習い研修生',  status:'きょん「リスニング？なにそれ食えるの？」' },
  { lv:2, min:20,  max:55,  badge:'🎤 NSC卒業',      title:'一般社員',      status:'きょん「数字だけは聞き取れた気がする」' },
  { lv:3, min:55,  max:110, badge:'🎭 劇場デビュー',  title:'主任',          status:'きょん「にっくん、俺、英語聞こえるかも」' },
  { lv:4, min:110, max:185, badge:'⭐ 準レギュラー',  title:'係長',          status:'きょん「もしかして俺天才？」' },
  { lv:5, min:185, max:280, badge:'📺 全国ネット',    title:'課長',          status:'きょん「にっくんより耳がいいかも」' },
  { lv:6, min:280, max:400, badge:'🌟 冠番組',        title:'部長',          status:'きょん「英語で漫才できるかもしれない」' },
  { lv:7, min:400, max:550, badge:'🏆 M-1決勝',      title:'取締役',        status:'きょん「もうにっくんいらないかも」' },
  { lv:8, min:550, max:9999,badge:'👑 M-1優勝',      title:'社長',          status:'きょん「俺、令和ロマンに勝ったわ」' },
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

var xp          = parseInt(localStorage.getItem('nh3_xp') || '0');
var answeredSet = JSON.parse(localStorage.getItem('nh3_exl_answered') || '{}');
var sectionDone = JSON.parse(localStorage.getItem('nh3_exl_sections') || '{}');
var weakDB      = JSON.parse(localStorage.getItem('nh3_weakdb') || '{}');
var attemptCounts = {};
var qMeta = {};
var currentSection = 0;
var QID_PREFIX = 'eng_ex_';

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
  localStorage.setItem('nh3_xp', xp);
  localStorage.setItem('nh3_exl_answered', JSON.stringify(answeredSet));
  updateXP(); return getLevel(xp).lv > old;
}
function deductXP(pts){
  var old = getLevel(xp).lv; xp = Math.max(0, xp - pts);
  localStorage.setItem('nh3_xp', xp); updateXP(); return getLevel(xp).lv < old;
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
    return '<div class="weak-item"><span class="weak-item-word">' + (d.short || qid) + '</span><span class="weak-item-pct">' + getPct(qid) + '%</span></div>';
  }).join('');
}
function recordResult(qid, isCorrect){
  if(!weakDB[qid]) weakDB[qid] = { jp:(qMeta[qid]&&qMeta[qid].jp)||'', short:(qMeta[qid]&&qMeta[qid].short)||'', answer:(qMeta[qid]&&qMeta[qid].answer)||'', choices:(qMeta[qid]&&qMeta[qid].choices)||[], correct:0, total:0 };
  weakDB[qid].total++; if(isCorrect) weakDB[qid].correct++;
  localStorage.setItem('nh3_weakdb', JSON.stringify(weakDB));
  var _t = new Date().toISOString().slice(0,10);
  var _d = JSON.parse(localStorage.getItem('nh3_daily') || '{}');
  _d[_t] = (_d[_t] || 0) + 1; localStorage.setItem('nh3_daily', JSON.stringify(_d));
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
  correct: ['きょん「聞こえた！！英語が聞こえた！！」', 'きょん「やった！！会話の流れ、読めた！！」', 'きょん「にっくん見て！解けた！！」'],
  nishi:   ['西村「正解。大事な情報を聞き取れてる」', '西村「できてる。その調子」', '西村「前後をよく読めてる」']
};
function getComment(type){ var a = COMMENTS[type] || COMMENTS.correct; return a[Math.floor(Math.random() * a.length)]; }
function shuffleArray(arr){ var a = arr.slice(); for(var i = a.length-1; i > 0; i--){ var j = Math.floor(Math.random()*(i+1)); var t = a[i]; a[i]=a[j]; a[j]=t; } return a; }
function chat(type, name, text){
  var cls = type === 'kyon' ? 'av-kyon' : 'av-nishi';
  var av  = type === 'kyon' ? '😄' : '慶';
  return '<div class="chat-line"><div class="avatar ' + cls + '">' + av + '</div><div><div class="chat-name">' + name + '</div><div class="chat-bubble">' + text + '</div></div></div>';
}

// ===== 音声（リスニング） =====
// 各スクリプト：lines＝[話者, 英文, 和訳]、q＝質問（英）、qj＝質問（和）
var SCRIPTS = {
  demo: { lines:[['N','Hello! This is a listening test. Can you hear me?','こんにちは！リスニングのテストです。聞こえますか？']] },

  L1: { lines:[
      ['Ken','Mom, I’m going to meet Yuta at the station at eleven.','お母さん、11時に駅で雄太と会うんだ。'],
      ['Mom','How will you get there? By bike?','どうやって行くの？自転車？'],
      ['Ken','No, it’s raining. I’ll take the bus.','ううん、雨だからバスで行くよ。'],
      ['Mom','The bus comes at ten twenty and ten forty. It takes thirty minutes to the station.','バスは10時20分と10時40分に来るわ。駅まで30分かかるわよ。'],
      ['Ken','Then I’ll take the earlier one.','じゃあ早い方に乗るよ。']],
    q:'What time will Ken take the bus?', qj:'ケンは何時のバスに乗りますか？' },
  L2: { lines:[
      ['Man','Excuse me. How much is this T-shirt?','すみません。このTシャツはいくらですか？'],
      ['Clerk','It’s fifteen dollars. But today, if you buy two, you can get them for twenty-five dollars.','15ドルです。でも今日は2枚買うと25ドルになります。'],
      ['Man','Great. I’ll take two, then. Oh, and this cap, too.','いいですね。じゃあ2枚ください。あ、この帽子も。'],
      ['Clerk','The cap is ten dollars.','帽子は10ドルです。']],
    q:'How much will the man pay?', qj:'男性はいくら払いますか？' },
  L3: { lines:[
      ['Tom','Hi, Lisa. You look tired.','やあリサ。疲れてるみたいだね。'],
      ['Lisa','Yes. I had a long practice in the gym after school. Our team has a big game on Sunday.','うん。放課後に体育館で長い練習があったの。日曜日に大事な試合があるんだ。'],
      ['Tom','Oh, what sport do you play?','へえ、何のスポーツをしているの？'],
      ['Lisa','Basketball. Will you come and watch?','バスケットボール。見に来てくれる？']],
    q:'What will Lisa do on Sunday?', qj:'リサは日曜日に何をしますか？' },
  L4: { lines:[
      ['Aki','Let’s go to the zoo tomorrow.','明日、動物園に行こうよ。'],
      ['Ben','I’d like to, but it will rain tomorrow. How about next Saturday?','行きたいけど、明日は雨だよ。次の土曜日はどう？'],
      ['Aki','Sorry, I have a piano lesson on Saturday. Sunday is OK.','ごめん、土曜日はピアノのレッスンがあるの。日曜日ならいいよ。'],
      ['Ben','OK. Let’s go on Sunday.','わかった。日曜日に行こう。']],
    q:'When will they go to the zoo?', qj:'2人はいつ動物園に行きますか？' },
  L5: { lines:[
      ['Mika','Hello, this is Mika. Can I speak to Tom?','もしもし、ミカです。トムと話せますか？'],
      ['Mother','Sorry, he’s out now. He’ll be back at five.','ごめんなさい、今出かけているの。5時に戻るわ。'],
      ['Mika','OK. I’ll call again later.','わかりました。あとでまた電話します。']],
    q:'What will Mika do?', qj:'ミカはどうしますか？' },
  L6: { lines:[
      ['Emi','How many students are there in your school, Mark?','マーク、あなたの学校には生徒が何人いるの？'],
      ['Mark','About four hundred and fifty. There are fifteen classes.','約450人。15クラスあるよ。']],
    q:'How many classes are there in Mark’s school?', qj:'マークの学校にはいくつのクラスがありますか？' },
  L7: { lines:[
      ['Jim','Which season do you like the best, Aya?','アヤ、どの季節が一番好き？'],
      ['Aya','I like summer because I can swim in the sea. How about you?','海で泳げるから夏が好き。あなたは？'],
      ['Jim','I like winter. I love skiing.','ぼくは冬。スキーが大好きなんだ。']],
    q:'Why does Aya like summer?', qj:'アヤはなぜ夏が好きなのですか？' },
  L8: { lines:[
      ['Woman','Excuse me. Where is the library?','すみません。図書館はどこですか？'],
      ['Boy','Go straight and turn left at the second corner. It’s next to the post office.','まっすぐ行って、2つ目の角を左に曲がってください。郵便局のとなりです。']],
    q:'Where is the library?', qj:'図書館はどこにありますか？' },

  D1: { lines:[
      ['Emma','Hi, Kota. Did you finish the English homework?','こんにちは、コウタ。英語の宿題終わった？'],
      ['Kota','Not yet. I forgot my notebook at school yesterday.','まだ。昨日、学校にノートを忘れちゃったんだ。'],
      ['Emma','Oh no. We have to give it to Ms. Brown tomorrow morning.','ええっ。明日の朝、ブラウン先生に出さなきゃいけないよ。'],
      ['Kota','I know. I’ll go to school early tomorrow and do it in the classroom.','わかってる。明日早く学校に行って、教室でやるよ。']],
    q:'What will Kota do tomorrow?', qj:'コウタは明日何をしますか？' },
  D2: { lines:[
      ['Sam','Mei, I heard you joined the drama club.','メイ、演劇部に入ったんだってね。'],
      ['Mei','Yes. We are going to perform a play at the school festival next month.','うん。来月の文化祭で劇をやるの。'],
      ['Sam','Wow! What part will you play?','すごい！どの役をやるの？'],
      ['Mei','I’ll be the main character. I’m nervous, but it’s exciting.','主役よ。緊張するけど、わくわくする。']],
    q:'Which is true about Mei?', qj:'メイについて正しいのはどれですか？' },
  A1: { lines:[
      ['N','Good morning, everyone. This is an announcement about today’s school trip. The bus will leave at eight thirty, so please come to the school gate by eight fifteen. It will be sunny and hot today, so please bring something to drink. We will come back to school at four p.m. Thank you.',
       'みなさん、おはようございます。今日の遠足についてのお知らせです。バスは8時30分に出発するので、8時15分までに校門に来てください。今日は晴れて暑くなるので、飲み物を持ってきてください。学校には午後4時に戻ります。以上です。']] },

  T1: { lines:[
      ['Boy','Mom, can I use the computer after dinner?','お母さん、夕食のあとパソコン使っていい？'],
      ['Mom','Sure, but finish your homework first.','いいわよ、でも先に宿題を終わらせてね。'],
      ['Boy','I already finished it before dinner.','夕食の前にもう終わらせたよ。'],
      ['Mom','OK, then you can use it for one hour.','じゃあ1時間使っていいわ。']],
    q:'What will the boy do after dinner?', qj:'男の子は夕食のあと何をしますか？' },
  T2: { lines:[
      ['Man','How long does it take to get to the museum from here?','ここから博物館まで、どのくらいかかりますか？'],
      ['Woman','About twenty minutes by bus, or forty minutes on foot.','バスで約20分、歩くと40分です。'],
      ['Man','I’ll take the bus.','バスに乗ります。']],
    q:'How long will it take the man to get to the museum?', qj:'男性が博物館に着くまで、どのくらいかかりますか？' },
  T3: { lines:[
      ['Rin','What did you do last weekend, Jim?','ジム、先週末は何をしたの？'],
      ['Jim','I went to Nagoya with my family. We visited the castle and ate miso-katsu.','家族と名古屋に行ったよ。お城を見て、みそかつを食べたんだ。']],
    q:'Where did Jim go last weekend?', qj:'ジムは先週末どこへ行きましたか？' },
  T4: { lines:[
      ['Boy','Is this your umbrella, Ms. White?','ホワイト先生、これは先生の傘ですか？'],
      ['Ms. White','No, mine is blue. That red one is Ken’s.','いいえ、私のは青よ。その赤いのはケンのものね。']],
    q:'Whose umbrella is the red one?', qj:'赤い傘はだれのものですか？' },
  T5: { lines:[
      ['Nana','The concert starts at seven. Let’s meet at six thirty.','コンサートは7時に始まるよ。6時半に会おう。'],
      ['Leo','Sorry, my club practice ends at six thirty. How about six forty-five?','ごめん、部活が6時半に終わるんだ。6時45分はどう？'],
      ['Nana','OK.','いいよ。']],
    q:'What time will they meet?', qj:'2人は何時に会いますか？' },
  T6: { lines:[
      ['N','Attention, please. The train for Nagoya will be ten minutes late because of heavy rain. It will arrive at platform three at nine twenty. We are sorry for the trouble.',
       'お知らせします。名古屋行きの電車は大雨のため10分遅れます。3番線に9時20分に到着します。ご迷惑をおかけして申し訳ありません。']],
    q:'Why will the train be late?', qj:'電車はなぜ遅れるのですか？' },
  TD: { lines:[
      ['Nick','Haruka, you look happy.','ハルカ、うれしそうだね。'],
      ['Haruka','Yes! I got a letter from my friend in Australia.','うん！オーストラリアの友だちから手紙が来たの。'],
      ['Nick','That’s nice. What did she write?','いいね。何て書いてあったの？'],
      ['Haruka','She’s going to visit Japan this summer, and she wants to stay at my house.','この夏、日本に来て、うちに泊まりたいんだって。']],
    q:'Which is true?', qj:'正しいのはどれですか？' }
};

var speechOK = (typeof window !== 'undefined' && 'speechSynthesis' in window);
var enVoices = [];
function loadVoices(){
  if(!speechOK) return;
  enVoices = window.speechSynthesis.getVoices().filter(function(v){ return v.lang && v.lang.indexOf('en') === 0; });
  var us = enVoices.filter(function(v){ return v.lang === 'en-US'; });
  if(us.length >= 2) enVoices = us.concat(enVoices.filter(function(v){ return v.lang !== 'en-US'; }));
}
if(speechOK){ loadVoices(); window.speechSynthesis.onvoiceschanged = loadVoices; }

var playingBtn = null;
function stopSpeech(){
  if(speechOK) window.speechSynthesis.cancel();
  if(playingBtn){ playingBtn.classList.remove('playing'); playingBtn = null; }
}
function speakScript(id, slow, btn){
  var s = SCRIPTS[id]; if(!s) return;
  if(!speechOK){ showToast('この端末では音声が使えません。解説の英文を読んでね'); return; }
  if(playingBtn === btn){ stopSpeech(); return; }
  stopSpeech();
  playingBtn = btn; if(btn) btn.classList.add('playing');
  var speakers = [];
  var queue = [];
  s.lines.forEach(function(l){
    if(l[0] !== 'N' && speakers.indexOf(l[0]) < 0) speakers.push(l[0]);
    queue.push({ who:l[0], text:l[1] });
  });
  if(s.q) queue.push({ who:'N', text:'Question. ' + s.q });
  queue.forEach(function(item, i){
    var u = new SpeechSynthesisUtterance(item.text);
    u.lang = 'en-US';
    u.rate = slow ? 0.68 : 0.9;
    var idx = item.who === 'N' ? -1 : speakers.indexOf(item.who);
    u.pitch = idx === 0 ? 1.2 : idx === 1 ? 0.8 : 1.0;
    if(enVoices.length >= 2 && idx >= 0) u.voice = enVoices[idx % enVoices.length];
    else if(enVoices.length) u.voice = enVoices[0];
    if(i === queue.length - 1){
      u.onend = function(){ if(playingBtn === btn){ btn.classList.remove('playing'); playingBtn = null; } };
    }
    window.speechSynthesis.speak(u);
  });
}
document.addEventListener('click', function(e){
  var b = e.target.closest ? e.target.closest('.listen-btn') : null;
  if(b) speakScript(b.getAttribute('data-lid'), b.getAttribute('data-slow') === '1', b);
});
function listenBtns(id){
  return '<div class="listen-row">'
    + '<button class="listen-btn" data-lid="' + id + '" data-slow="0">▶ 英語を聞く</button>'
    + '<button class="listen-btn" data-lid="' + id + '" data-slow="1">🐢 ゆっくり</button>'
    + '</div>';
}
// 解説用：英文スクリプトと和訳
function transcript(id){
  var s = SCRIPTS[id]; if(!s) return '';
  var h = '<div style="background:var(--bg3);border-radius:8px;padding:10px 14px;margin-top:8px">'
    + '<div style="font-size:11px;color:var(--text2);margin-bottom:4px">📄 放送された英文</div>';
  s.lines.forEach(function(l){
    h += '<div style="margin-bottom:6px"><span class="en" style="font-size:15px">' + (l[0] === 'N' ? '' : '<b>' + l[0] + ':</b> ') + l[1] + '</span>'
      + '<div style="font-size:12px;color:var(--text2)">' + l[2] + '</div></div>';
  });
  if(s.q) h += '<div style="margin-top:4px"><span class="en" style="font-size:15px;color:var(--gold)">Q: ' + s.q + '</span><div style="font-size:12px;color:var(--text2)">' + s.qj + '</div></div>';
  return h + '</div>';
}
function qline(id){ var s = SCRIPTS[id]; return '<div class="en" style="color:var(--gold)">Question: ' + s.q + '</div>'; }

// ===== QUESTION ENGINE =====
function makeChoices(qid, jp, answer, choices, exp, short, keepOrder){
  if(!keepOrder) choices = shuffleArray(choices);
  qMeta[qid] = { type:'choice', answer:answer, xp:4, jp:jp, choices:choices, short:short || '' };
  var done = answeredSet[qid];
  return '<div class="q-card" data-card="' + qid + '">'
    + '<div class="q-text">' + jp + '</div>'
    + '<div class="choices">' + choices.map(function(c){
        if(done) return '<button class="choice-btn ' + (c===answer?'show-correct':'') + '" disabled>' + c + '</button>';
        return '<button class="choice-btn" data-qid="' + qid + '" data-choice="' + c + '">' + c + '</button>';
      }).join('') + '</div>'
    + '<div class="q-feedback correct-fb" id="fb_'  + qid + '" style="' + (done?'display:block':'display:none') + '">✓ 正解！</div>'
    + '<div class="q-feedback wrong-fb"   id="fbw_' + qid + '" style="display:none">✗ もう一度！（🐢ゆっくりで聞き直してもOK）</div>'
    + '<div class="exp-card" id="exp_' + qid + '" style="' + (done?'display:block':'display:none') + '">'
    + '<div class="exp-card-title">📌 解説</div><div style="color:var(--text);font-size:13px;line-height:2.1">' + exp + '</div></div>'
    + '<button class="show-answer-btn" id="sab_' + qid + '" data-qid="' + qid + '">💡 答えを見る（XPなし）</button>'
    + '<div class="answer-revealed" id="ar_' + qid + '"><div class="ans-label">✅ 正解</div><div id="ar_ans_' + qid + '" style="font-size:18px;color:var(--gold);font-weight:bold;margin-top:4px"></div></div>'
    + '<div class="artist-comment" id="ac_' + qid + '" style="' + (done?'display:block':'display:none') + '">' + (done?getComment('nishi'):'') + '</div>'
    + '</div>';
}
function handleChoice(qid, choice){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  if(choice === meta.answer) markCorrect(qid, meta); else markWrong(qid, meta, choice);
}
function markCorrect(qid, meta){
  recordResult(qid, true);
  var lvUp = addXP(meta.xp || 4, qid);
  var card = document.querySelector('[data-card="' + qid + '"]'); if(card) card.classList.add('correct-card');
  var fb = document.getElementById('fb_' + qid); if(fb) fb.style.display = 'block';
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = getComment('nishi'); ac.style.display = 'block'; }
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('selected-correct'); });
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
  else { var msgs = ['きょん「あれ！聞き逃した！もう一回聞く！！」','きょん「また間違えた…！ゆっくりで聞く！！」','きょん「前と後ろの文を読む！！」']; setTimeout(function(){ showToast(msgs[Math.min(msgs.length-1, attemptCounts[qid]-1)]); }, 100); }
}
function showAnswer(qid){
  var meta = qMeta[qid]; if(!meta || answeredSet[qid]) return;
  answeredSet[qid] = true; localStorage.setItem('nh3_exl_answered', JSON.stringify(answeredSet));
  var arAns = document.getElementById('ar_ans_' + qid); if(arAns) arAns.textContent = meta.answer;
  var ar = document.getElementById('ar_' + qid); if(ar) ar.style.display = 'block';
  var sab = document.getElementById('sab_' + qid); if(sab) sab.style.display = 'none';
  document.querySelectorAll('.choice-btn[data-qid="' + qid + '"]').forEach(function(b){ b.disabled = true; if(b.dataset.choice === meta.answer) b.classList.add('show-correct'); });
  var fbw = document.getElementById('fbw_' + qid); if(fbw) fbw.style.display = 'none';
  var expEl = document.getElementById('exp_' + qid); if(expEl) expEl.style.display = 'block';
  var ac = document.getElementById('ac_' + qid); if(ac){ ac.textContent = 'きょん「なるほど！次は自分で聞き取る！」'; ac.style.display = 'block'; }
  showToast('西村「答えを見るのも学習のうち。英文をもう一度聞いて確認しよう」');
  checkSectionComplete();
}

// ===== SECTION COMPLETE =====
function checkSectionComplete(){
  var prefix = QID_PREFIX + 's' + currentSection + '_';
  var sqs = Object.keys(qMeta).filter(function(id){ return id.indexOf(prefix) === 0; });
  if(sqs.length === 0) return;
  if(sqs.every(function(id){ return answeredSet[id]; })){
    sectionDone[currentSection] = true;
    localStorage.setItem('nh3_exl_sections', JSON.stringify(sectionDone));
    renderTabs();
    var nb = document.getElementById('nextBtn');
    if(nb && nb.style.display === 'none'){
      nb.style.display = 'block';
      if(!document.getElementById('secCompleteBanner')){
        var banner = document.createElement('div'); banner.id = 'secCompleteBanner';
        var nextMsg = currentSection < 5 ? 'Section ' + (currentSection+1) + ' へ進もう！' : '結果を見よう！';
        banner.innerHTML = '<div style="text-align:center;padding:20px;margin-bottom:12px;background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(245,197,24,0.08));border:1px solid #3b82f6;border-radius:14px">'
          + '<div style="font-size:36px;margin-bottom:8px">🎉</div>'
          + '<div style="font-family:Bebas Neue,sans-serif;font-size:22px;color:#93c5fd;letter-spacing:2px;margin-bottom:6px">セクション ' + currentSection + ' クリア！</div>'
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
  { id:0, label:'🎧 スタート',  title:'英語は「聞く」と「流れ」',   sub:'英作文も文法問題もない。配点の約4分の1がリスニング' },
  { id:1, label:'聞き取り①',    title:'対話を聞いて答える',          sub:'第1問型：時間・数字・場所を聞き取る' },
  { id:2, label:'聞き取り②',    title:'正誤判定とアナウンス',        sub:'第2問・第3問型：a〜dを一つずつ正か誤か' },
  { id:3, label:'会話文',       title:'会話文の空所補充',            sub:'筆記1型：前の文と後ろの文から「次の一言」を選ぶ' },
  { id:4, label:'グラフ・表',   title:'グラフ・表の英語と並べ替え',  sub:'筆記2・4型：the most popular／the number of／2・4・6番目' },
  { id:5, label:'確認テスト',   title:'確認テスト',                  sub:'本番形式20問' },
  { id:6, label:'📊弱点',       title:'弱点ノート',                  sub:'間違えた問題を確認' },
  { id:7, label:'🔥特訓',       title:'弱点特訓モード',              sub:'弱点問題を集中練習！' },
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
  stopSpeech();
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
    + '<div class="section-badge">英語 入試対策 · SECTION ' + id + '</div>'
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
  document.querySelectorAll('.next-section-btn[data-goto]').forEach(function(b){
    b.addEventListener('click', function(){ var g = b.dataset.goto; if(g === 'result') showFinalResult(); else goSection(parseInt(g)); });
  });
  document.querySelectorAll('.start-btn[data-goto]').forEach(function(b){ b.addEventListener('click', function(){ goSection(parseInt(b.dataset.goto)); }); });
}
function renderQs(qs){
  var html = '';
  qs.forEach(function(q, i){
    html += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">' + (q.no || ('Q' + (i+1))) + '</div>';
    html += makeChoices(q.qid, q.jp, q.answer, q.choices, q.exp, q.short, q.keep);
  });
  return html;
}

// 正誤判定（第2問型）の問題を4つ作る
function tfSet(prefix, lid, items, shortBase){
  return items.map(function(it, i){
    var letter = ['a','b','c','d'][i];
    return {
      qid: prefix + i, short: shortBase + ' ' + letter, keep:true,
      jp: listenBtns(lid) + qline(lid) + '<div style="margin-top:10px;font-size:14px;color:var(--text2)">次の文は正しい？誤り？</div><div class="en">' + letter + '. ' + it[0] + '</div>',
      answer: it[1] ? '正' : '誤', choices:['正','誤'],
      exp: '📐 ' + it[2] + transcript(lid)
    };
  });
}
// 会話文の空所（前後の文を毎回表示）
function dlg(lines){
  return '<div class="dlg">' + lines.map(function(l){ return '<div class="en"><b>' + l[0] + ':</b> ' + l[1] + '</div>'; }).join('') + '</div>';
}
var BL = '<span class="blank">（　）</span>';
// 並べ替え（アからキ）
function wordBox(words){
  var labels = ['ア','イ','ウ','エ','オ','カ','キ'];
  return '<div class="dlg" style="display:flex;flex-wrap:wrap;gap:8px 18px">' + words.map(function(w, i){ return '<span class="en">' + labels[i] + ' ' + w + '</span>'; }).join('') + '</div>';
}
function tableHtml(head, rows){
  var h = '<div style="overflow-x:auto;margin:6px 0 10px"><table style="border-collapse:collapse;font-size:13px;min-width:260px">';
  h += '<tr>' + head.map(function(c){ return '<th style="border:1px solid var(--border);padding:4px 8px;background:var(--bg3);color:var(--text2);font-weight:normal;white-space:nowrap">' + c + '</th>'; }).join('') + '</tr>';
  rows.forEach(function(r){ h += '<tr>' + r.map(function(c){ return '<td style="border:1px solid var(--border);padding:4px 8px;text-align:center;white-space:nowrap">' + c + '</td>'; }).join('') + '</tr>'; });
  return h + '</table></div>';
}

// ===== SECTION 0 =====
function renderSection0(){
  return '<div class="intro-box">'
    + '<div class="intro-box-title">🎧 きょん＆西村の会話</div>'
    + chat('kyon','きょん（富士田恭兵）','英語の入試って、英作文とか文法の穴埋めとか、いっぱい書かされるんでしょ…')
    + chat('nishi','西村真二（慶應卒・元アナ）','愛知県は違う。英作文も、文法だけを聞く問題も<strong>一つもない</strong>。全部マークシート。代わりに<strong>聞き取り検査が5問（約4分の1）</strong>あって、筆記は会話文・グラフの発表・長文・表の読み取り。')
    + chat('kyon','きょん','聞き取りが4分の1！？俺、外郎売も歌詞も耳で覚えたし、聞くのは得意かも！！')
    + chat('nishi','西村','そこが武器になる。リスニングは「全部わかる」必要はない。<strong>質問が聞いていること（時間？場所？理由？）だけ</strong>を聞き取ればいい。筆記の会話文も同じで、<strong>空所の前の文と後ろの文</strong>を見れば答えは決まる。')
    + '</div>'

    + '<div class="rule-card">'
    + '<div class="rule-card-title">📐 愛知県の英語（R5〜R7）</div>'
    + '<div class="rule-box"><div class="rule-title">聞き取り検査（放送）</div><div class="ex">第1問：対話と質問を聞いて、答えを選ぶ<br>第2問：対話と質問を聞いたあと、a〜dの答えが読まれる。<strong>一つずつ「正」か「誤」かをマーク</strong><br>第3問：アナウンスやスピーチを聞いて、問1・問2に答える</div><div class="note">💡 コツ：①数字（時刻・値段・人数）はメモ ②「but」「then」「so」のあとが大事 ③最後の一言で予定が変わることが多い</div></div>'
    + '<div class="rule-box"><div class="rule-title">筆記検査</div><div class="ex">1 会話文の空所に入る文を選ぶ（3問）<br>2 グラフ2つ＋英語の発表原稿の空所・<strong>並べ替え（7語から6語、2・4・6番目を答える）</strong><br>3 長文（空所補充・内容一致を二つ選ぶ）<br>4 会話文＋表（料金表・時間表を読んで正しいものを二つ）</div></div>'
    + '<div class="rule-box"><div class="rule-title">🔊 音声テスト</div><div class="ex">下のボタンを押して、英語が聞こえるか確かめよう（スマホはマナーモードを解除）</div>' + listenBtns('demo') + '<div class="note">💡 2人の会話は声の高さを変えて読み上げる。🐢で何回でもゆっくり聞ける。答えたあとに解説で英文と和訳が見られる</div></div>'
    + '</div>'

    + '<button class="start-btn" data-goto="1">🎧 Section 1：対話を聞いて答える →</button>';
}

// ===== SECTION 1 =====
function renderSection1(){
  var html = '<div class="intro-box">'
    + '<div class="intro-box-title">🎧 きょん＆西村の会話</div>'
    + chat('kyon','きょん','聞いてる途中で知らない単語が出ると、そこで頭が真っ白になる…')
    + chat('nishi','西村真二（慶應卒・元アナ）','知らない単語は飛ばしていい。先に<strong>質問（Question）を読んでから聞く</strong>。「What time」なら時刻だけ、「Where」なら場所だけ待ち構える。')
    + '</div>'
    + '<div class="rule-card"><div class="rule-card-title">📐 聞く前の3ステップ</div>'
    + '<div class="rule-box"><div class="ex">① 画面の Question を先に読む（What time／How much／Where／Why／When）<br>② 選択肢をざっと見て、何が違うかを確認（数字？場所？）<br>③ ▶で聞く。わからなければ 🐢 で何回でも</div>'
    + '<div class="note">💡 疑問詞の意味：What time＝何時　How much＝いくら　How many＝いくつ　How long＝どのくらい（時間）　When＝いつ　Where＝どこ　Why＝なぜ（Because〜で答える）　Whose＝だれの</div></div></div>';

  var qs = [
    { qid:'eng_ex_s1_q0', short:'聞き取り：バスの時刻', jp: listenBtns('L1') + qline('L1'),
      answer:'At ten twenty.', choices:['At ten twenty.','At ten forty.','At ten fifty.','At eleven.'],
      exp:'📐 11時に駅で待ち合わせ。10時40分のバスだと30分かかって11時10分に着く→遅刻。だから「the earlier one（早い方）」＝10時20分<br>💡 最後の一言「the earlier one」が決め手' + transcript('L1') },
    { qid:'eng_ex_s1_q1', short:'聞き取り：合計金額', jp: listenBtns('L2') + qline('L2'),
      answer:'Thirty-five dollars.', choices:['Twenty-five dollars.','Thirty dollars.','Thirty-five dollars.','Forty dollars.'],
      exp:'📐 Tシャツ2枚で25ドル（今日だけの値段）＋帽子10ドル＝35ドル<br>❌ 15×2＝30＋10＝40 は「today, if you buy two」を聞き逃した答え' + transcript('L2') },
    { qid:'eng_ex_s1_q2', short:'聞き取り：日曜日の予定', jp: listenBtns('L3') + qline('L3'),
      answer:'She will play in a basketball game.', choices:['She will play in a basketball game.','She will watch a basketball game.','She will practice in the gym after school.','She will go shopping with Tom.'],
      exp:'📐 「Our team has a big game on Sunday」＝自分のチームが試合 → 試合に出る<br>❌ watch（見る）のはトムの方（Will you come and watch?）' + transcript('L3') },
    { qid:'eng_ex_s1_q3', short:'聞き取り：いつ行く', jp: listenBtns('L4') + qline('L4'),
      answer:'Next Sunday.', choices:['Tomorrow.','Next Saturday.','Next Sunday.','Today.'],
      exp:'📐 明日→雨でだめ。土曜日→ピアノでだめ。「Sunday is OK」「Let’s go on Sunday」<br>💡 予定は会話の最後で決まることが多い' + transcript('L4') },
    { qid:'eng_ex_s1_q4', short:'聞き取り：ミカはどうする', jp: listenBtns('L5') + qline('L5'),
      answer:'She will call Tom again later.', choices:['She will call Tom again later.','She will leave a message for Tom.','She will visit Tom’s house at five.','She will wait for Tom at the station.'],
      exp:'📐 「I’ll call again later.」＝あとでまた電話する' + transcript('L5') },
    { qid:'eng_ex_s1_q5', short:'聞き取り：fifteenとfifty', jp: listenBtns('L6') + qline('L6'),
      answer:'Fifteen.', choices:['Fifteen.','Fifty.','Four hundred and fifty.','Four hundred.'],
      exp:'📐 生徒は約450人、クラスは15（fifteen）。聞かれているのは classes（クラス数）<br>💡 fifteen（ﾌｨﾌ<b>ﾃｨｰﾝ</b>：後ろを強く伸ばす）と fifty（<b>ﾌｨﾌ</b>ﾃｨ：前を強く）を聞き分ける' + transcript('L6') },
    { qid:'eng_ex_s1_q6', short:'聞き取り：理由（Why）', jp: listenBtns('L7') + qline('L7'),
      answer:'Because she can swim in the sea.', choices:['Because she can swim in the sea.','Because she loves skiing.','Because summer vacation is long.','Because she likes ice cream.'],
      exp:'📐 Why の答えは「because」のあと。「I like summer because I can swim in the sea.」<br>❌ skiing はジムの好きなこと' + transcript('L7') },
    { qid:'eng_ex_s1_q7', short:'聞き取り：場所', jp: listenBtns('L8') + qline('L8'),
      answer:'Next to the post office.', choices:['Next to the post office.','At the first corner.','In front of the station.','Next to the hospital.'],
      exp:'📐 「It’s next to the post office.」 next to＝〜のとなり<br>💡 道案内：go straight（まっすぐ）turn left（左に曲がる）the second corner（2つ目の角）' + transcript('L8') },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 聞いて答えよう ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 2 =====
function renderSection2(){
  var html = '<div class="intro-box">'
    + '<div class="intro-box-title">🎧 きょん＆西村の会話</div>'
    + chat('kyon','きょん','第2問って、答えが4つ読まれて、全部に正か誤をつけるの？めんどくさっ！')
    + chat('nishi','西村真二（慶應卒・元アナ）','逆にチャンスだ。<strong>一つずつ「会話の内容と合っているか」だけ</strong>を判断すればいい。正しいのは基本1つ。主語が入れかわっている（Kota と Emma）、時間がずれている（today と tomorrow）ものが「誤」の典型。')
    + chat('kyon','きょん','「だれが」「いつ」を確認するのか！')
    + '</div>'
    + '<div class="rule-card"><div class="rule-card-title">📐 正誤判定のチェックポイント</div>'
    + '<div class="rule-box"><div class="ex">① <strong>だれが</strong>：主語がすりかわっていないか（Mei ↔ Sam）<br>② <strong>いつ</strong>：yesterday／today／tomorrow／next month<br>③ <strong>何を</strong>：play（出る）と watch（見る）、give（渡す）と get（もらう）<br>④ <strong>否定</strong>：not や never が入っていないか</div>'
    + '<div class="note">💡 第3問のアナウンスは、数字（時刻）と「please 〜」（お願いされたこと）を聞き取る</div></div></div>';

  var d1 = tfSet('eng_ex_s2_q', 'D1', [
    ['He will give his notebook to Emma.', false, 'ノートを渡す話は出ていない。宿題を出す相手は Ms. Brown'],
    ['He will go to school early.', true, '「I’ll go to school early tomorrow」→ 正'],
    ['He will finish the homework at home tonight.', false, 'ノートは学校にある。家ではなく「in the classroom」でやる'],
    ['He will forget his homework.', false, '忘れたのは「昨日、ノートを学校に」。明日忘れるとは言っていない']
  ], 'コウタの明日');
  var d2 = tfSet('eng_ex_s2_q', 'D2', [
    ['Mei joined the brass band.', false, '入ったのは drama club（演劇部）'],
    ['Mei will perform in a play at the school festival next month.', true, '「We are going to perform a play at the school festival next month.」→ 正'],
    ['Mei is going to watch a play with Sam.', false, 'メイは見るのではなく演じる（perform）'],
    ['Sam will be the main character.', false, '主役（the main character）はメイ。主語のすりかえ']
  ], 'メイと演劇部');
  // qidを4〜7に振り直す
  d2.forEach(function(q, i){ q.qid = 'eng_ex_s2_q' + (4 + i); });
  var a1 = [
    { qid:'eng_ex_s2_q8', short:'アナウンス：集合時刻',
      jp: listenBtns('A1') + '<div class="en" style="color:var(--gold)">問1 What time should students come to the school gate?</div>',
      answer:'At eight fifteen.', choices:['At eight.','At eight fifteen.','At eight thirty.','At four.'],
      exp:'📐 バスの出発は 8:30、でも「come to the school gate by eight fifteen」<br>💡 数字が2つ出たら、どちらが何の数字かをメモ' + transcript('A1') },
    { qid:'eng_ex_s2_q9', short:'アナウンス：含まれる情報',
      jp: listenBtns('A1') + '<div class="en" style="color:var(--gold)">問2 Which information is in this announcement?</div>',
      answer:'Students should bring something to drink.', choices:['Students should bring something to drink.','The bus will leave at four p.m.','It will rain in the afternoon.','Students will have lunch at school.'],
      exp:'📐 「please bring something to drink」＝飲み物を持ってきて<br>❌ 4時は学校に「戻る」時刻。天気は sunny and hot' + transcript('A1') },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 第2問型：1番（a〜d を一つずつ判定） ──</div>';
  html += renderQs(d1);
  html += '<div style="font-size:13px;color:var(--text2);margin:20px 0 16px;font-weight:bold">── 第2問型：2番 ──</div>';
  html += renderQs(d2);
  html += '<div style="font-size:13px;color:var(--text2);margin:20px 0 16px;font-weight:bold">── 第3問型：アナウンス ──</div>';
  html += renderQs(a1);
  return html;
}

// ===== SECTION 3 =====
function renderSection3(){
  var html = '<div class="intro-box">'
    + '<div class="intro-box-title">🎧 きょん＆西村の会話</div>'
    + chat('kyon','きょん','会話文の空所って、どれも英語としては正しいから迷う…')
    + chat('nishi','西村真二（慶應卒・元アナ）','だから<strong>空所の後ろの文</strong>を見る。R7の本番では、空所のすぐ後ろが「Vegetable soup, for example.（たとえば野菜スープ）」。だから空所は「健康に良いものを食べたい」。後ろの文が答えを教えてくれている。')
    + chat('kyon','きょん','漫才のツッコミみたい！ボケがわかればツッコミが決まる！')
    + chat('nishi','西村','いい例えだ。前の人の発言と、後ろの人の返事。その両方とかみ合う一言を選ぶ。')
    + '</div>'
    + '<div class="rule-card"><div class="rule-card-title">📐 空所補充の3つのサイン</div>'
    + '<div class="rule-box"><div class="ex">① <strong>後ろの文</strong>：「for example」「Sure」「Sorry」「Thank you」→ 空所の内容を受けている<br>② <strong>つなぎ言葉</strong>：but（逆のこと）・so（結果）・because（理由）・then（それなら）<br>③ <strong>疑問文には答え</strong>：Yes/No、場所なら場所、理由なら理由</div>'
    + '<div class="note">💡 本番は各選択肢の日本語訳がない。わからない単語があっても、前後とかみ合わないものを消していけばいい</div></div></div>';

  var qs = [
    { qid:'eng_ex_s3_q0', short:'会話文：R7(1) 健康に良いもの', jp:'（R7 本番）夕食の買い物中' + dlg([['Santos','Well, what do we have for dinner tonight? I’m hungry.'],['Hiroko', BL + ' Vegetable soup, for example.'],['Santos','Sounds good!']]),
      answer:'I feel like eating something good for my health.', choices:['Actually, I want to buy and eat many cookies.','I feel like eating something good for my health.','How about eating a lot of sweets?','How do you make vegetable soup?'],
      exp:'📐 後ろの「Vegetable soup, for example（たとえば野菜スープ）」→ 野菜スープの例になる内容＝「健康に良いものが食べたい」<br>❌ クッキー・お菓子は野菜スープの例にならない。「どうやって作るの？」は自分の提案と合わない' },
    { qid:'eng_ex_s3_q1', short:'会話文：R7(2) 予定を変える', jp:'（R7 本番）' + dlg([['Hiroko','Oh, just a moment. The prices of vegetables are higher today than last week.'],['Santos','What happened?'],['Hiroko','I’m not sure, but I think the weather affected the prices. I want ' + BL + '. What about making something different, like spaghetti?']]),
      answer:'to change our dinner plan', choices:['to have dinner together','to eat spaghetti at a restaurant','to change our dinner plan','to buy more vegetables'],
      exp:'📐 野菜が高い → 後ろで「何か別のもの（something different）を作るのはどう？」→「夕食の予定を変えたい」<br>❌ 野菜を「もっと買う」は高い話と逆。レストランは「making（作る）」と合わない' },
    { qid:'eng_ex_s3_q2', short:'会話文：R7(3) ソースを買えば', jp:'（R7 本番）' + dlg([['Santos','Sure. No problem. I can help you because I sometimes cook spaghetti at home.'],['Hiroko','Thank you, Santos. We can cook delicious spaghetti ' + BL + '.'],['Santos','I agree. Let’s get a sauce over there.']]),
      answer:'if we buy a tomato sauce instead of vegetables', choices:['if we buy a tomato sauce instead of vegetables','if we find enough food at a nice restaurant','because the prices of vegetables are lower','because the weather is nice and vegetables are growing'],
      exp:'📐 後ろの「Let’s get a sauce over there（あそこのソースを買おう）」→ ソースの話<br>❌ 野菜は「高い」と言っていたので lower（安い）は逆。instead of＝〜の代わりに' },
    { qid:'eng_ex_s3_q3', short:'会話文：だれを待っている', jp:'放課後、ALTのスミス先生と' + dlg([['Mr. Smith','Hi, Yuki. What are you doing here?'],['Yuki','I’m waiting for my friend. ' + BL],['Mr. Smith','Oh, what will you do at the festival?']]),
      answer:'We are going to practice for the school festival together.', choices:['We are going to practice for the school festival together.','I finished practicing an hour ago.','I don’t have any friends here.','I’m going home alone now.'],
      exp:'📐 後ろの「what will you do at the festival?」→ 空所で festival の話が出ている必要がある<br>❌ 友だちを待っているのに「友だちがいない」「一人で帰る」は矛盾' },
    { qid:'eng_ex_s3_q4', short:'会話文：お笑いをやる', jp:dlg([['Mr. Smith','Oh, what will you do at the festival?'],['Yuki','We’ll do a comedy show. ' + BL],['Mr. Smith','That’s great! I’d love to see it.']]),
      answer:'I want to make everyone laugh.', choices:['I want to make everyone laugh.','I don’t like comedy.','I will sing a song alone.','I have never seen a comedy show.'],
      exp:'📐 コメディショーをやる → 「みんなを笑わせたい」→ 先生が「すばらしい！見たい」<br>💡 make＋人＋動詞の原形＝人に〜させる（make everyone laugh＝みんなを笑わせる）' },
    { qid:'eng_ex_s3_q5', short:'会話文：時間と場所を伝える', jp:dlg([['Mr. Smith','That’s great! I’d love to see it.'],['Yuki','Thank you. ' + BL],['Mr. Smith','OK, I’ll be there.']]),
      answer:'The show starts at two in the gym.', choices:['The show starts at two in the gym.','Please don’t come.','It was very fun.','I watched it on TV.'],
      exp:'📐 後ろの「I’ll be there（そこに行くよ）」→ 空所で「いつ・どこ」を伝えている<br>❌ It was（過去形）はまだやっていないショーと合わない' },
    { qid:'eng_ex_s3_q6', short:'会話文：プレゼントを探す', jp:'お店で' + dlg([['Clerk','May I help you?'],['Aya','Yes. I’m looking for a bag for my sister. ' + BL],['Clerk','How about this one? It’s very popular.']]),
      answer:'Her birthday is next week.', choices:['Her birthday is next week.','She bought a bag yesterday.','I don’t have a sister.','I want to buy shoes.'],
      exp:'📐 姉（妹）へのかばんを探している理由 → 誕生日<br>❌ sister のためと言ったあとに「姉妹はいない」は矛盾。探しているのは bag（shoes ではない）' },
    { qid:'eng_ex_s3_q7', short:'会話文：but のあと', jp:dlg([['Clerk','How about this one? It’s very popular.'],['Aya','It’s nice, but ' + BL],['Clerk','Then, how about this one? It’s cheaper.']]),
      answer:'it’s a little too expensive for me.', choices:['it’s a little too expensive for me.','I’ll take it.','it’s very cheap.','I like it very much.'],
      exp:'📐 「nice, but（いいけど、）」→ 逆の内容が来る。後ろで店員が「It’s cheaper（こっちの方が安い）」→ 空所は「高すぎる」<br>💡 but のあとは前と反対のこと' },
  ];
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 空所に入る一言を選ぼう ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 4 =====
function renderSection4(){
  var html = '<div class="intro-box">'
    + '<div class="intro-box-title">🎧 きょん＆西村の会話</div>'
    + chat('kyon','きょん','グラフの英語、the second and third most popular って何？')
    + chat('nishi','西村真二（慶應卒・元アナ）','「2番目と3番目に人気」。the most popular（一番人気）の前に second や third がつく。グラフ問題は決まった言い回しが10個くらいしかない。覚えれば読める。')
    + chat('kyon','きょん','10個！パターンなら得意！')
    + chat('nishi','西村','それと並べ替えは「7語から6語を選んで、2・4・6番目だけ答える」。1語は必ず余る。余る語を先に見つけると楽になる。')
    + '</div>'
    + '<div class="rule-card"><div class="rule-card-title">📐 グラフ・表の定番表現</div>'
    + '<div class="rule-box"><div class="ex en" style="font-size:15px">the most popular 〜＝一番人気の〜<br>the second (third) most popular＝2番目（3番目）に人気<br>more than 60%＝60%より多く　less than＝〜より少なく<br>the number of 〜＝〜の数（the number of visitors＝来館者数）<br>increase＝増える　decrease＝減る<br>high／low＝（数が）多い／少ない<br>both A and B＝AとBの両方　according to 〜＝〜によると<br>However,＝しかし</div></div>'
    + '<div class="rule-box"><div class="rule-title">並べ替え（7語から6語）の手順</div><div class="ex">① 余りそうな語を探す（before と after、is と are、use と uses など<strong>ペアの片方</strong>）<br>② 前後の文とつながる「かたまり」を作る（the number of 〜／books borrowed by students）<br>③ 並べたら番号を振って、2・4・6番目を読む</div></div></div>';

  var g1 = tableHtml(['Popular Kinds of Books','July','December'], [['adventure','27%','24%'],['fantasy','23%','14%'],['horror','12%','12%'],['history','11%','20%'],['love story','10%','17%'],['others','17%','13%']]);
  var qs = [
    { qid:'eng_ex_s4_q0', short:'表現：second and third most popular', jp:'<span class="en">Fantasy and horror were the second and third most popular in July.</span><br>の意味は？',
      answer:'7月は、ファンタジーとホラーが2番目と3番目に人気だった', choices:['7月は、ファンタジーとホラーが2番目と3番目に人気だった','7月は、ファンタジーとホラーが一番人気だった','7月は、ファンタジーとホラーが2回と3回借りられた','7月は、ファンタジーとホラーが人気がなかった'],
      exp:'📐 the second (third) most popular＝2番目（3番目）に人気' },
    { qid:'eng_ex_s4_q1', short:'R7 2(1) グラフと発表', jp:'（R7 本番）' + g1 + '<div class="en" style="font-size:15px">Graph 2 では、来館者数（the number of visitors）は4月と9月が約210〜220人で、他の月（約90〜130人）より多い。</div>'
      + '<div class="dlg"><div class="en">However, ① were the second and third most popular in December. … The number of visitors was ② both in April and in September.</div></div>①②の組み合わせは？',
      answer:'① history and love story　② high', choices:['① fantasy and history　② high','① fantasy and history　② low','① history and love story　② high','① history and love story　② low'],
      exp:'📐 12月：adventure 24%（1位）、history 20%（2位）、love story 17%（3位）→ ① history and love story<br>4月と9月は来館者数が多い → ② high<br>✅ R7 2(1)（ウ）' },
    { qid:'eng_ex_s4_q2', short:'表現：the number of', jp:'<span class="en">The number of borrowed books decreased in August.</span><br>の意味は？',
      answer:'8月は、借りられた本の数が減った', choices:['8月は、借りられた本の数が減った','8月は、借りられた本の数が増えた','8月は、本を借りた人が一番多かった','8月は、本の番号が変わった'],
      exp:'📐 the number of 〜＝〜の数、decrease＝減る（increase＝増える）、borrowed books＝借りられた本' },
    { qid:'eng_ex_s4_q3', short:'表現：more than', jp:'<span class="en">More than 60% of us help our families at home.</span><br>の意味は？',
      answer:'私たちの60%より多くが家で家族の手伝いをしている', choices:['私たちの60%より多くが家で家族の手伝いをしている','私たちの60%より少ない人が手伝っている','私たちのちょうど60%が手伝っている','私たちの60%が手伝いをもっとしたい'],
      exp:'📐 more than＝〜より多く、less than＝〜より少なく（R6 2 の発表で出た表現）' },
    { qid:'eng_ex_s4_q4', short:'R7 2(2) 並べ替え', jp:'（R7 本番）The number of visitors was high both in April and in September, and the number of ③ summer vacation and winter vacation.<br>③に入るように、アからキから<strong>六つ</strong>選んで並べ替えたとき、2番目・4番目・6番目は？' + wordBox(['students','borrowed','increased','before','after','by','books']),
      answer:'2番目イ・4番目ア・6番目エ', choices:['2番目イ・4番目ア・6番目エ','2番目イ・4番目ア・6番目オ','2番目キ・4番目カ・6番目エ','2番目ア・4番目イ・6番目ウ'],
      exp:'📐 books borrowed by students increased before（生徒に借りられた本の数は夏休みと冬休みの前に増えた）<br>1 books 2 <b>borrowed</b>（イ） 3 by 4 <b>students</b>（ア） 5 increased 6 <b>before</b>（エ） → after（オ）が余る<br>💡 グラフは7月・12月（休みの前）に増えている → before。borrowed by students＝生徒によって借りられた（後ろから books を説明）<br>✅ R7 2(2)' },
    { qid:'eng_ex_s4_q5', short:'並べ替え：the number of students who', jp:'This graph shows ③ smartphones every day.<br>③に入るように六つ選んで並べ替えたとき、2番目・4番目・6番目は？' + wordBox(['number','students','the','who','of','use','uses']),
      answer:'2番目ア・4番目イ・6番目カ', choices:['2番目ア・4番目イ・6番目カ','2番目ア・4番目イ・6番目キ','2番目オ・4番目エ・6番目カ','2番目ウ・4番目オ・6番目エ'],
      exp:'📐 the number of students who use（スマートフォンを毎日使う生徒の数）<br>1 the 2 <b>number</b>（ア） 3 of 4 <b>students</b>（イ） 5 who 6 <b>use</b>（カ）<br>💡 who の前は students（複数）→ use。uses（キ）が余る' },
    { qid:'eng_ex_s4_q6', short:'並べ替え：比較', jp:'I think ③ watching TV.<br>③に入るように六つ選んで並べ替えたとき、2番目・4番目・6番目は？' + wordBox(['interesting','reading','than','is','books','more','most']),
      answer:'2番目オ・4番目カ・6番目ウ', choices:['2番目オ・4番目カ・6番目ウ','2番目オ・4番目キ・6番目ウ','2番目エ・4番目ア・6番目ウ','2番目イ・4番目カ・6番目ア'],
      exp:'📐 reading books is more interesting than（本を読むことはテレビを見るより面白い）<br>1 reading 2 <b>books</b>（オ） 3 is 4 <b>more</b>（カ） 5 interesting 6 <b>than</b>（ウ）<br>💡 than があるから比較級 more。most（キ）が余る' },
  ];
  var tk = tableHtml(['','','General','Special','Afternoon'], [['Weekday','Adult (13+)','$16.99','$26.99','$21.99'],['','Child (4-12)','$8.99','$12.99','$10.99'],['Weekend','Adult (13+)','$19.99','$29.99','$24.99'],['','Child (4-12)','$9.99','$14.99','$12.99'],['Event','','○','○','○'],['Attraction','','×','○','○']])
    + '<div style="font-size:12px;color:var(--text2)">*Afternoon tickets: Visitors can enter after 2 p.m.</div>'
    + tableHtml(['Event','Time','Place'], [['Short Movie “Hero”','10:30-10:50 / 12:30-12:50','Theater'],['Stage “Animal Life”','11:00-11:30','Hall'],['Stage “Festival”','13:00-13:30 / 16:30-17:00','Hall'],['The Guitar Concert','14:30-15:30','Central Park'],['The Great Dance Party','16:00-17:00','Central Park']])
    + '<div style="font-size:12px;color:var(--text2)">*You need to come to the place 15 minutes before each event starts.</div>';
  qs.push({ qid:'eng_ex_s4_q7', short:'R7 4(4) 表の読み取り', jp:'（R7 本番・遊園地のウェブサイト）' + tk + '正しいものを<strong>二つ</strong>選んだ組み合わせは？<br><span class="en" style="font-size:14px">ア According to the website, Akira can ride attractions with all types of tickets.<br>イ The price of the afternoon ticket on Sunday is higher than the price of the special ticket on Monday.<br>ウ If Akira buys the general ticket, he can enjoy both the short movie and the guitar concert.<br>エ If Akira wants to see the stage “Animal Life,” he needs to arrive at the hall by 10:50.<br>オ Akira can enjoy the guitar concert before the great dance party with any type of ticket.<br>カ Akira can enjoy all of the events held in the hall and the central park with the afternoon ticket.</span>',
    answer:'ウとオ', choices:['ウとオ','アとエ','イとカ','エとオ'],
    exp:'📐 ア×：General は Attraction が×<br>イ×：日曜の Afternoon（大人$24.99）＜ 月曜の Special（大人$26.99）<br>ウ○：General でも Event は○（映画もコンサートもイベント）<br>エ×：11:00開始の15分前＝<b>10:45</b>まで（10:50では遅い）<br>オ○：コンサート14:30〜15:30、ダンスは16:00〜。どのチケットもEventは○<br>カ×：Afternoon は午後2時から入場 → 11:00の Animal Life は見られない<br>✅ R7 4(4)（ウ、オ）' });
  qs.push({ qid:'eng_ex_s4_q8', short:'表：週末の子どもの午後券', jp:'同じ料金表で、<span class="en">weekend</span> に <span class="en">child (4-12)</span> が <span class="en">afternoon ticket</span> を買うといくら？' + tk,
    answer:'$12.99', choices:['$12.99','$10.99','$14.99','$24.99'],
    exp:'📐 Weekend の段 → Child の行 → Afternoon の列 ＝ $12.99<br>💡 表は「行（横）」と「列（縦）」を指でなぞって交わる所を読む' });
  html += '<div style="font-size:13px;color:var(--text2);margin:8px 0 16px;font-weight:bold">── 練習問題 ──</div>';
  html += renderQs(qs);
  return html;
}

// ===== SECTION 5: 確認テスト =====
function renderSection5(){
  var html = '<div class="rule-card" style="margin-bottom:20px">'
    + '<div class="rule-card-title">🏆 確認テスト — 聞き取り＋筆記 本番形式</div>'
    + '<div class="rule-box"><div style="font-size:14px;line-height:2.2;color:var(--text2)">'
    + '聞き取り10問＋筆記10問の <strong style="color:var(--gold)">20問</strong>！<br>'
    + 'きょん「Question を先に読んで、数字はメモ！！」<br>'
    + '西村「会話文は後ろの文。並べ替えは余る1語から」'
    + '</div></div></div>';

  var qs = [
    { no:'聞き取り Q1', qid:'eng_ex_s5_q0', short:'テスト：夕食のあと', jp: listenBtns('T1') + qline('T1'),
      answer:'He will use the computer.', choices:['He will use the computer.','He will do his homework.','He will cook dinner.','He will go to bed.'],
      exp:'📐 宿題は夕食前に終わった → パソコンを1時間使ってよい' + transcript('T1') },
    { no:'聞き取り Q2', qid:'eng_ex_s5_q1', short:'テスト：博物館まで何分', jp: listenBtns('T2') + qline('T2'),
      answer:'About twenty minutes.', choices:['About twenty minutes.','About forty minutes.','About one hour.','About ten minutes.'],
      exp:'📐 バスで20分、歩くと40分。「I’ll take the bus」→ 20分' + transcript('T2') },
    { no:'聞き取り Q3', qid:'eng_ex_s5_q2', short:'テスト：どこへ行った', jp: listenBtns('T3') + qline('T3'),
      answer:'He went to Nagoya.', choices:['He went to Nagoya.','He went to Tokyo.','He went to Osaka.','He went to Kyoto.'],
      exp:'📐 「I went to Nagoya with my family.」' + transcript('T3') },
    { no:'聞き取り Q4', qid:'eng_ex_s5_q3', short:'テスト：だれの傘', jp: listenBtns('T4') + qline('T4'),
      answer:'It’s Ken’s.', choices:['It’s Ken’s.','It’s Ms. White’s.','It’s the boy’s.','Nobody knows.'],
      exp:'📐 「mine is blue（私のは青）」「That red one is Ken’s」<br>💡 mine＝私のもの、Ken’s＝ケンのもの' + transcript('T4') },
    { no:'聞き取り Q5', qid:'eng_ex_s5_q4', short:'テスト：待ち合わせ時刻', jp: listenBtns('T5') + qline('T5'),
      answer:'At six forty-five.', choices:['At six thirty.','At six forty-five.','At seven.','At six.'],
      exp:'📐 最初は6:30 → 部活で無理 → 6:45を提案 → OK' + transcript('T5') },
    { no:'聞き取り Q6', qid:'eng_ex_s5_q5', short:'テスト：電車が遅れる理由', jp: listenBtns('T6') + qline('T6'),
      answer:'Because of heavy rain.', choices:['Because of heavy rain.','Because of an accident.','Because of snow.','Because the train is broken.'],
      exp:'📐 「ten minutes late because of heavy rain」' + transcript('T6') },
  ];
  var tdl = tfSet('eng_ex_s5_q', 'TD', [
    ['Haruka wrote a letter to Nick.', false, '手紙はオーストラリアの友だちから Haruka に来た'],
    ['Haruka’s friend lives in Australia.', true, '「my friend in Australia」→ 正'],
    ['Haruka will go to Australia this summer.', false, '来るのは友だちの方（visit Japan）'],
    ['Nick got a letter from Haruka’s friend.', false, '手紙をもらったのは Haruka']
  ], 'テスト：ハルカの手紙');
  tdl.forEach(function(q, i){ q.qid = 'eng_ex_s5_q' + (6 + i); q.no = '聞き取り Q' + (7 + i); });
  qs = qs.concat(tdl);
  qs = qs.concat([
    { no:'筆記 Q11', qid:'eng_ex_s5_q10', short:'テスト：会話 断る', jp: dlg([['Sho','Do you want to go to the movies this Saturday?'],['Ann', BL + ' I have to go to my grandmother’s house.']]),
      answer:'I’m sorry, I can’t.', choices:['I’m sorry, I can’t.','Yes, I’d love to.','I went there yesterday.','It was a great movie.'],
      exp:'📐 後ろ「おばあちゃんの家に行かなきゃ」→ 断る' },
    { no:'筆記 Q12', qid:'eng_ex_s5_q11', short:'テスト：会話 日曜ならOK', jp: dlg([['Sho','OK. How about Sunday?'],['Ann', BL],['Sho','Great! Let’s meet at the station at ten.']]),
      answer:'Sunday is fine.', choices:['Sunday is fine.','I’m busy on Sunday, too.','I don’t like movies.','Saturday is better.'],
      exp:'📐 後ろ「Great! 10時に駅で会おう」→ 日曜はOK' },
    { no:'筆記 Q13', qid:'eng_ex_s5_q12', short:'テスト：会話 写真を頼まれる', jp: dlg([['Tourist','Excuse me. Could you take a picture of us?'],['Rina', BL],['Tourist','Thank you so much.']]),
      answer:'Sure. Please give me your camera.', choices:['Sure. Please give me your camera.','No, thank you.','It’s mine.','I took it yesterday.'],
      exp:'📐 頼まれて、後ろで「ありがとう」→ 引き受けている<br>💡 Could you 〜?＝〜していただけますか' },
    { no:'筆記 Q14', qid:'eng_ex_s5_q13', short:'テスト：会話 鍵をなくした', jp: dlg([['Mao','I lost my key. I’ve looked for it everywhere.'],['Dan', BL],['Mao','Oh, you’re right! Here it is. Thank you.']]),
      answer:'Did you check your bag?', choices:['Did you check your bag?','I found my key.','You should buy a new house.','I don’t have a key.'],
      exp:'📐 後ろ「本当だ！ここにあった」→ 探す場所を提案している' },
    { no:'筆記 Q15', qid:'eng_ex_s5_q14', short:'テスト：表現 the most popular', jp:'<span class="en">Soccer was the most popular sport in our class.</span><br>の意味は？',
      answer:'サッカーはクラスで一番人気のスポーツだった', choices:['サッカーはクラスで一番人気のスポーツだった','サッカーはクラスで2番目に人気だった','サッカーはクラスで人気がなかった','サッカーをする人が増えた'],
      exp:'📐 the most popular＝一番人気' },
    { no:'筆記 Q16', qid:'eng_ex_s5_q15', short:'テスト：表現 increased', jp:'<span class="en">The number of visitors increased in July.</span><br>の意味は？',
      answer:'7月に来館者数が増えた', choices:['7月に来館者数が増えた','7月に来館者数が減った','7月の来館者数は少なかった','7月は来館者の番号が変わった'],
      exp:'📐 the number of visitors＝来館者数、increase＝増える' },
    { no:'筆記 Q17', qid:'eng_ex_s5_q16', short:'テスト：表現 less than', jp:'<span class="en">Less than 20% of the students walk to school.</span><br>の意味は？',
      answer:'歩いて通学する生徒は20%より少ない', choices:['歩いて通学する生徒は20%より少ない','歩いて通学する生徒は20%より多い','歩いて通学する生徒はちょうど20%','20%の生徒が歩きたいと思っている'],
      exp:'📐 less than＝〜より少なく（more than の反対）' },
    { no:'筆記 Q18', qid:'eng_ex_s5_q17', short:'テスト：並べ替え 人を笑わせる', jp:'I want ③ make people laugh.<br>六つ選んで並べ替えたとき、2番目・4番目・6番目は？' + wordBox(['person','can','be','who','to','a','is']),
      answer:'2番目ウ・4番目ア・6番目イ', choices:['2番目ウ・4番目ア・6番目イ','2番目ウ・4番目カ・6番目イ','2番目キ・4番目ア・6番目イ','2番目オ・4番目カ・6番目エ'],
      exp:'📐 to be a person who can（人を笑わせられる人になりたい）<br>1 to 2 <b>be</b>（ウ） 3 a 4 <b>person</b>（ア） 5 who 6 <b>can</b>（イ） → is（キ）が余る<br>💡 want to の後ろは原形 be' },
    { no:'筆記 Q19', qid:'eng_ex_s5_q18', short:'テスト：並べ替え 間接疑問', jp:'Do you know ③?<br>六つ選んで並べ替えたとき、2番目・4番目・6番目は？' + wordBox(['what','time','the','concert','will','start','starts']),
      answer:'2番目イ・4番目エ・6番目カ', choices:['2番目イ・4番目エ・6番目カ','2番目イ・4番目エ・6番目キ','2番目ウ・4番目オ・6番目カ','2番目ア・4番目ウ・6番目オ'],
      exp:'📐 what time the concert will start（コンサートが何時に始まるか）<br>1 what 2 <b>time</b>（イ） 3 the 4 <b>concert</b>（エ） 5 will 6 <b>start</b>（カ） → will のあとは原形なので starts（キ）が余る<br>💡 Do you know の後ろは「疑問詞＋主語＋動詞」の順（間接疑問）' },
    { no:'筆記 Q20', qid:'eng_ex_s5_q19', short:'テスト：表 平日の大人の特別券', jp:'料金表（R7 4(4)）で、<span class="en">weekday</span> に <span class="en">adult (13+)</span> が <span class="en">special ticket</span> を買うといくら？'
      + tableHtml(['','','General','Special','Afternoon'], [['Weekday','Adult (13+)','$16.99','$26.99','$21.99'],['','Child (4-12)','$8.99','$12.99','$10.99'],['Weekend','Adult (13+)','$19.99','$29.99','$24.99'],['','Child (4-12)','$9.99','$14.99','$12.99']]),
      answer:'$26.99', choices:['$26.99','$29.99','$21.99','$16.99'],
      exp:'📐 Weekday → Adult → Special の列 ＝ $26.99' },
  ]);
  html += renderQs(qs);
  return html;
}

function showFinalResult(){
  var s5qids = Object.keys(qMeta).filter(function(id){ return id.indexOf(QID_PREFIX + 's5_') === 0; });
  var total = s5qids.length || 20;
  var correct = s5qids.filter(function(id){ var d = weakDB[id]; return d && d.correct > 0; }).length;
  var pct = Math.round(correct / total * 100);
  var emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '🎭' : '🥚';
  var msg = pct >= 90 ? 'きょん「英語が聞こえる！！会話も読める！！」<br>西村「文句なし。聞き取りは得点源になる」'
          : pct >= 70 ? 'きょん「だいぶ聞き取れるようになった！！」<br>西村「あと少し。間違えた型だけ特訓で潰そう」'
          : pct >= 50 ? 'きょん「半分は取れた…！」<br>西村「弱点ノートで、聞き取りか筆記かどちらが弱いか見よう」'
          : 'きょん「英語むずかしい…」<br>西村「大丈夫。🐢ゆっくりで何回でも聞いていい。特訓モードで反復」';
  var overlay = document.getElementById('resultOverlay');
  overlay.innerHTML = '<div style="background:var(--bg2);border:1px solid #3b82f6;border-radius:20px;padding:36px 28px;max-width:420px;width:92%;text-align:center;box-shadow:0 8px 40px rgba(59,130,246,0.25)">'
    + '<div style="font-size:60px;margin-bottom:12px">' + emoji + '</div>'
    + '<div style="font-family:Bebas Neue,sans-serif;font-size:26px;color:#93c5fd;letter-spacing:2px;margin-bottom:8px">確認テスト結果</div>'
    + '<div style="font-size:44px;color:var(--gold);font-weight:bold;font-family:Bebas Neue,sans-serif">' + correct + ' / ' + total + '</div>'
    + '<div style="font-size:22px;color:var(--gold);margin-bottom:20px">' + pct + '%</div>'
    + '<div style="font-size:14px;color:var(--text2);line-height:2.1;margin-bottom:24px">' + msg + '</div>'
    + '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    + '<button id="resBtnWeak" style="background:#3b82f6;color:#fff;border:none;padding:12px 20px;border-radius:10px;font-size:14px;font-family:inherit;font-weight:bold;cursor:pointer;">📊 弱点を見る</button>'
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
  var html = '<div class="section-header"><div class="section-badge">英語 入試対策 · 弱点ノート</div><div class="section-title">弱点ノート</div><div class="section-sub">間違えた問題を確認しよう</div></div>';
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
      + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(59,130,246,0.08);border:2px solid ' + barColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:13px;font-weight:bold;color:' + barColor + '">' + pct + '%</span></div>'
      + '<div style="flex:1;min-width:0"><div style="font-size:14px;color:var(--text);margin-bottom:2px">' + (d.short || qid) + '</div><div style="font-size:12px;color:var(--text2)">正解：' + d.answer + '　（' + d.correct + '/' + d.total + '回）</div></div>'
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
  var html = '<div class="section-header"><div class="section-badge" style="background:var(--red)">英語 入試対策 · 特訓</div><div class="section-title">弱点特訓モード</div><div class="section-sub">弱点問題を集中練習！（リスニングは▶で聞ける）</div></div>';
  if(wqs.length === 0){
    html += '<div style="text-align:center;padding:60px 20px;color:var(--text2)"><div style="font-size:48px;margin-bottom:16px">🎉</div><div style="font-size:16px;line-height:2">弱点なし！<br>きょん「英語マスター！！」</div></div>';
    document.getElementById('mainContent').innerHTML = html; return;
  }
  tokkuQueue = shuffleArray(wqs).slice(0, 15); tokkuIndex = 0; tokkuSession = { correct:0, total:0 };
  document.getElementById('mainContent').innerHTML = html + '<div id="tokkuArea"></div>';
  renderTokkuCard();
}
function renderTokkuCard(){
  stopSpeech();
  var area = document.getElementById('tokkuArea'); if(!area) return;
  if(tokkuIndex >= tokkuQueue.length){ showTokkuComplete(); return; }
  var qid = tokkuQueue[tokkuIndex]; var d = weakDB[qid];
  if(!d){ tokkuIndex++; renderTokkuCard(); return; }
  var pct = getPct(qid); var color = pct < 50 ? 'var(--red)' : 'var(--gold)';
  var choices = d.choices && d.choices.length === 2 ? d.choices : shuffleArray(d.choices || [d.answer]);
  var html = '<div class="tokku-progress">問題 ' + (tokkuIndex+1) + ' / ' + tokkuQueue.length + '　正解 ' + tokkuSession.correct + '</div>'
    + '<div class="tokku-card">'
    + '<div class="tokku-stat">正答率: <span class="pct" style="color:' + color + '">' + pct + '%</span>（' + d.correct + '/' + d.total + '回正解）</div>'
    + '<div class="tokku-jp" style="text-align:left;font-size:16px">' + d.jp + '</div>'
    + '<div class="tokku-choices">' + choices.map(function(c){ return '<button class="choice-btn" data-tchoice="' + c + '">' + c + '</button>'; }).join('') + '</div>'
    + '<div class="tokku-result" id="tokkuResult"></div>'
    + '<button id="tokkuNext" style="display:none;margin-top:14px;background:#3b82f6;color:#fff;border:none;padding:12px 28px;border-radius:10px;font-size:15px;font-family:inherit;font-weight:bold;cursor:pointer">次へ →</button>'
    + '</div>';
  area.innerHTML = html;
  area.querySelectorAll('.choice-btn[data-tchoice]').forEach(function(b){ b.addEventListener('click', function(){ applyTokkuResult(qid, b.dataset.tchoice === d.answer, b.dataset.tchoice); }); });
}
function applyTokkuResult(qid, correct, choice){
  var d = weakDB[qid]; if(!d) return;
  d.total++; if(correct) d.correct++;
  localStorage.setItem('nh3_weakdb', JSON.stringify(weakDB));
  tokkuSession.total++; if(correct) tokkuSession.correct++;
  var res = document.getElementById('tokkuResult'); var newPct = getPct(qid);
  document.querySelectorAll('#tokkuArea .choice-btn[data-tchoice]').forEach(function(b){ b.disabled = true; if(b.dataset.tchoice === d.answer) b.classList.add('selected-correct'); else if(b.dataset.tchoice === choice && !correct) b.classList.add('selected-wrong'); });
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
    + (pctAll >= 80 ? 'きょん「英語の耳、できてきた！！」' : 'きょん「まだ聞き逃す…もう一回！！」') + '</div>'
    + '<button id="tokkuAgain" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:14px 28px;border-radius:12px;font-size:16px;font-family:inherit;font-weight:bold;cursor:pointer">🔥 もう一度特訓</button>'
    + '</div>';
  document.getElementById('tokkuAgain').addEventListener('click', function(){ renderTokkuMode(); });
}

// ===== INIT =====
updateXP();
renderWeakBar();
renderTabs();
renderSection(0);
