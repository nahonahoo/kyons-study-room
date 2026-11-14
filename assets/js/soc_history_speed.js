// ===== 歴史 1問1答タイムアタック（記述式） =====
// 問題データは soc_history_speed_data.js（HQ_RAW）。
// XP・弱点DB は社会共通（soc_xp / soc_weakdb）。qid は 'soc_hq_' + id。このページ専用のキーは soc_hq_ で始める。
// 採点はやさしめ：ひらがなでも正解／別の書き方もOK／4文字以上は1文字ちがいまで「おしい！」で正解。
//   ただし「第一次↔第二次」「平城京↔平安京」のように、1文字ちがいで別の用語（ほかの問題の答え・まちがいリスト）になるものは不正解。

var QID_PREFIX = 'soc_hq_';
var ERA_NAME = { 1:'古代まで', 2:'中世', 3:'近世', 4:'近代（開国〜明治）', 5:'二度の世界大戦', 6:'現代' };
var NUMERIC = { h001:1, h002:1, h003:1 };   // 数字だけで答えてもよい問題

// ===== データ =====
function kata2hira(s){ return s.replace(/[ァ-ヶ]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 0x60); }); }
function norm(s){
  s = String(s || '');
  if(s.normalize) s = s.normalize('NFKC');
  s = s.toLowerCase();
  s = kata2hira(s);
  // 空白・中黒・句読点・かっこ類を消す（長音「ー」は残す）
  s = s.replace(/[\s・･·、。，．,.「」『』（）()\[\]【】〈〉《》！？!?〜～\-‐－―]/g, '');
  return s;
}
function digits(s){ s = String(s || ''); if(s.normalize) s = s.normalize('NFKC'); return s.replace(/[^0-9]/g, ''); }

var QUESTIONS = HQ_RAW.map(function(r){
  return { id:r[0], era:r[1], q:r[2], a:r[3], y:r[4], alt:r[5], x:r[6], note:r[7] };
});
var byId = {};
var OWNER = {};   // 正規化した答え → それが答えになっている問題idの一覧（1文字ちがいの判定で使う）
QUESTIONS.forEach(function(q){
  byId[q.id] = q;
  q.cands = [q.a].concat(q.alt).map(norm);
  if(q.y) q.cands.push(norm(q.y));
  q.xs = q.x.map(norm);
  q.cands.forEach(function(c){ (OWNER[c] = OWNER[c] || []).push(q.id); });
});
function qidOf(q){ return QID_PREFIX + q.id; }

function lev(a, b){
  if(a === b) return 0;
  var m = a.length, n = b.length, i, j, prev = [], cur;
  for(j = 0; j <= n; j++) prev[j] = j;
  for(i = 1; i <= m; i++){
    cur = [i];
    for(j = 1; j <= n; j++){
      cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a.charAt(i-1) === b.charAt(j-1) ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
// 採点：{ ok, near（1文字ちがい）, kana（ひらがなで正解） }
function grade(q, input){
  var n = norm(input);
  if(!n) return null;
  if(q.cands.indexOf(n) >= 0){
    var isKana = !!q.y && n === norm(q.y) && n !== norm(q.a);
    return { ok:true, near:false, kana:isKana };
  }
  if(NUMERIC[q.id] && digits(input) && digits(input) === digits(q.a)) return { ok:true, near:false, kana:false };
  // 1文字ちがい：ほかの問題の答えや、まちがいリストの用語と一致したら不正解
  var owners = OWNER[n] || [];
  var blocked = q.xs.indexOf(n) >= 0 || owners.some(function(id){ return id !== q.id; });
  if(!blocked){
    for(var i = 0; i < q.cands.length; i++){
      var c = q.cands[i];
      // 数字が入る答え（年・数）は1文字ちがいを認めない（100年と1000年はちがう）
      if(c.length >= 4 && !/[0-9]/.test(c) && !/[0-9]/.test(n) && lev(n, c) <= 1) return { ok:true, near:true, kana:false };
    }
  }
  return { ok:false, near:false, kana:false };
}

// ===== レベル（社会共通の soc_xp） =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長' }
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

// ===== 保存 =====
function lsGet(k, def){ try{ var v = localStorage.getItem(k); return v === null ? def : v; }catch(e){ return def; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function lsJSON(k){ try{ return JSON.parse(lsGet(k, '{}')) || {}; }catch(e){ return {}; } }

var xp = parseInt(lsGet('soc_xp', '0'), 10) || 0;
var answeredSet = lsJSON('soc_hq_answered');
var weakDB = lsJSON('soc_weakdb');
var best = lsJSON('soc_hq_best');
var settings = lsJSON('soc_hq_settings');
if(!settings.range) settings.range = 'all';
if(settings.count === undefined) settings.count = 20;
if(!settings.time) settings.time = 30;
if(!settings.order) settings.order = 'random';

// ===== 小道具 =====
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function shuffle(arr){ var a = arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function pctOf(qid){ var d = weakDB[qid]; if(!d || !d.total) return 100; return Math.round(d.correct / d.total * 100); }
function weakIds(){
  return Object.keys(weakDB).filter(function(id){ return id.indexOf(QID_PREFIX) === 0 && weakDB[id].total > 0 && pctOf(id) < 80 && byId[id.slice(QID_PREFIX.length)]; });
}
var toastTimer = null;
function showToast(msg, type){
  var t = $('toast'); t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  setTimeout(function(){ t.classList.add('show'); }, 10);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove('show'); }, type ? 3500 : 2200);
}

// ===== XP =====
function totalXP(){
  var keys = ['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'], s = 0;
  for(var i=0;i<keys.length;i++){ s += parseInt(lsGet(keys[i], '0'), 10) || 0; }
  return Math.max(0, s - (parseInt(lsGet('shop_spent', '0'), 10) || 0));
}
function renderXP(){
  var lv = getLevel(xp);
  var pct = lv.lv < LEVELS.length ? Math.round((xp - lv.min) / (lv.max - lv.min) * 100) : 100;
  $('navXp').textContent = '🪙 ' + totalXP().toLocaleString() + ' XP';
  $('lvBadge').textContent = 'Lv.' + lv.lv + ' ' + lv.badge;
  $('lvTitle').textContent = lv.title;
  $('lvNext').textContent = '社会 ' + xp + ' XP' + (lv.lv < LEVELS.length ? '／次の昇格まで ' + (lv.max - xp) + ' XP' : '（最高ランク）');
  $('lvFill').style.width = Math.min(100, pct) + '%';
}
function changeXP(delta){
  if(!delta) return;
  var old = getLevel(xp).lv;
  xp = Math.max(0, xp + delta);
  lsSet('soc_xp', String(xp));
  renderXP();
  var now = getLevel(xp).lv;
  if(now > old) showToast('🎉 昇格！ ' + getLevel(xp).badge + '　きょん「昇格したわ！！」', 'levelup');
  else if(now < old) showToast('💦 降格…！　きょん「降格した…！！でも取り返す！！」', 'demote');
}

// ===== 弱点DB =====
function recordResult(q, isCorrect){
  var qid = qidOf(q);
  if(!weakDB[qid]) weakDB[qid] = { correct:0, total:0 };
  weakDB[qid].jp = q.q; weakDB[qid].answer = q.a; weakDB[qid].choices = []; weakDB[qid].exp = q.note || '';
  weakDB[qid].total++; if(isCorrect) weakDB[qid].correct++;
  lsSet('soc_weakdb', JSON.stringify(weakDB));
  var today = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  var daily = lsJSON('soc_daily'); daily[today] = (daily[today] || 0) + 1;
  lsSet('soc_daily', JSON.stringify(daily));
  lsSet('soc_hq_lastStudy', today);
}

// ===== スタート画面 =====
var RANGE_OPTS = [
  { key:'all', label:'ぜんぶ' },
  { key:'1', label:'古代まで' },
  { key:'2', label:'中世' },
  { key:'3', label:'近世' },
  { key:'4', label:'近代（開国〜明治）' },
  { key:'5', label:'二度の世界大戦' },
  { key:'6', label:'現代' },
  { key:'weak', label:'🔥 弱点だけ' }
];
var ORDER_OPTS = [ { key:'random', label:'ランダム' }, { key:'book', label:'教科書の順' } ];
var COUNT_OPTS = [10, 20, 50, 0];
var TIME_OPTS = [20, 30, 45, 60];

function poolFor(range){
  if(range === 'weak') return weakIds().map(function(id){ return byId[id.slice(QID_PREFIX.length)]; });
  if(range === 'all') return QUESTIONS.slice();
  var e = parseInt(range, 10);
  return QUESTIONS.filter(function(q){ return q.era === e; });
}
function bestKey(){ return settings.range + '_' + settings.count + '_' + settings.time; }

function chips(id, opts, cur, attr, label){
  $(id).innerHTML = opts.map(function(o){
    var key = (typeof o === 'object') ? o.key : o;
    var text = label(o);
    return '<button class="chip' + (String(cur) === String(key) ? ' on' : '') + '" data-' + attr + '="' + key + '">' + text + '</button>';
  }).join('');
}
function renderChips(){
  var weakN = weakIds().length;
  if(settings.range === 'weak' && weakN === 0) settings.range = 'all';
  $('chipRange').innerHTML = RANGE_OPTS.map(function(o){
    var n = poolFor(o.key).length;
    var dis = (o.key === 'weak' && n === 0) ? ' disabled' : '';
    return '<button class="chip' + (settings.range === o.key ? ' on' : '') + '" data-range="' + o.key + '"' + dis + '>' + esc(o.label) + '（' + n + '）</button>';
  }).join('');
  $('rangeNote').textContent = weakN === 0 ? '「弱点だけ」は、まちがえた問題がたまると選べるようになるよ。' : '弱点（正答率80%未満）が ' + weakN + ' 問あるよ。';
  chips('chipOrder', ORDER_OPTS, settings.order, 'order', function(o){ return esc(o.label); });
  chips('chipCount', COUNT_OPTS, settings.count, 'count', function(c){ return c === 0 ? 'ぜんぶ' : c + '問'; });
  chips('chipTime', TIME_OPTS, settings.time, 'time', function(t){ return t + '秒'; });
  var b = best[bestKey()];
  $('bestLine').textContent = b ? '🏆 この設定のベスト：' + b + ' PT' : 'この設定ではまだ記録なし';
}
function renderWeak(){
  var ids = weakIds().sort(function(a,b){ return pctOf(a) - pctOf(b); }).slice(0, 8);
  if(ids.length === 0){ $('weakList').innerHTML = '<div class="note" style="margin:0">弱点なし！（まちがえた問題がここに出るよ）</div>'; return; }
  $('weakList').innerHTML = ids.map(function(id){
    var q = byId[id.slice(QID_PREFIX.length)];
    return '<div class="weak-item"><span>' + esc(q.a) + '<span style="color:var(--sub);font-size:13px">（' + esc(ERA_NAME[q.era]) + '）</span></span><span class="pct">' + pctOf(id) + '%</span></div>';
  }).join('');
}
function showStart(){
  stopTimer();
  $('scrStart').classList.remove('hide'); $('scrGame').classList.add('hide'); $('scrResult').classList.add('hide');
  renderXP(); renderChips(); renderWeak();
  window.scrollTo(0, 0);
}
function saveSettings(){ lsSet('soc_hq_settings', JSON.stringify(settings)); }

// ===== ゲーム =====
var G = null;
var timerId = null;

function startGame(list){
  var qs;
  if(list){ qs = list.slice(); }
  else {
    var pool = poolFor(settings.range);
    qs = settings.order === 'book' && settings.range !== 'weak' ? pool : shuffle(pool);
    if(settings.count > 0){
      // 教科書の順で一部だけのときは、続きから出す（毎回最初の数問にならないように）
      if(settings.order === 'book' && settings.range !== 'weak' && settings.count < qs.length){
        var posKey = 'pos_' + settings.range;
        var pos = (settings[posKey] || 0) % qs.length;
        qs = qs.slice(pos).concat(qs.slice(0, pos)).slice(0, settings.count);
        settings[posKey] = (pos + settings.count) % pool.length; saveSettings();
      } else {
        qs = qs.slice(0, settings.count);
      }
    }
  }
  if(qs.length === 0) return;
  G = { qs:qs, i:0, score:0, combo:0, maxCombo:0, right:0, xpGain:0, miss:[], answered:false,
        timeLimit:settings.time, left:settings.time, paused:false, retry:!!list, key:bestKey() };
  $('scrStart').classList.add('hide'); $('scrResult').classList.add('hide'); $('scrGame').classList.remove('hide');
  showQuestion();
}
function showQuestion(){
  var q = G.qs[G.i];
  G.answered = false; G.paused = false; G.left = G.timeLimit; G.tries = 0; G.hint = false; G.firstWrong = '';
  $('hudNo').textContent = 'Q ' + (G.i + 1) + ' / ' + G.qs.length;
  $('hudScore').textContent = G.score + ' PT';
  $('hudCombo').textContent = G.combo >= 2 ? '🔥 ' + G.combo + ' COMBO' : '';
  $('qTag').textContent = ERA_NAME[q.era];
  $('qText').textContent = q.q;
  $('pausedCover').classList.add('hide');
  $('ansArea').style.visibility = 'visible';
  $('btnPause').textContent = '⏸ 一時停止'; $('btnPause').disabled = false;
  var inp = $('ansInput');
  inp.value = ''; inp.disabled = false; inp.className = 'ans-input';
  $('btnSubmit').disabled = false; $('btnHint').disabled = false; $('btnGiveup').disabled = false;
  $('tryMsg').textContent = ''; $('tryMsg').className = 'try-msg';
  $('hintBox').innerHTML = ''; $('hintBox').classList.add('hide');
  $('fbArea').innerHTML = '';
  renderTimer();
  startTimer();
  window.scrollTo(0, 0);
  // 「次へ」などのタップの流れの中で呼ばれるので、スマホでもキーボードが開く
  try{ inp.focus({ preventScroll:true }); }catch(e){ inp.focus(); }
}

function startTimer(){
  stopTimer();
  var last = Date.now();
  timerId = setInterval(function(){
    var now = Date.now();
    if(!G || G.answered || G.paused){ last = now; return; }
    G.left -= (now - last) / 1000; last = now;
    if(G.left <= 0){ G.left = 0; renderTimer(); finish(false, null, 'timeout', null); return; }
    renderTimer();
  }, 100);
}
function stopTimer(){ if(timerId){ clearInterval(timerId); timerId = null; } }
function renderTimer(){
  var r = G.left / G.timeLimit;
  var f = $('tFill'), n = $('tNum');
  f.style.width = (r * 100) + '%';
  f.className = 'tfill' + (r <= 0.25 ? ' low' : r <= 0.5 ? ' mid' : '');
  n.textContent = Math.ceil(G.left);
  n.className = 'tnum' + (r <= 0.25 ? ' low' : '');
}
function togglePause(){
  if(!G || G.answered) return;
  G.paused = !G.paused;
  $('pausedCover').classList.toggle('hide', !G.paused);
  $('ansArea').style.visibility = G.paused ? 'hidden' : 'visible';
  $('btnPause').textContent = G.paused ? '▶ 再開' : '⏸ 一時停止';
  if(!G.paused){ try{ $('ansInput').focus({ preventScroll:true }); }catch(e){} }
}

var LINES = {
  ok:      ['きょん「やった！天才かも！」','きょん「にっくんより賢くなったかも！」','きょん「歴史、書けるじゃん俺！」','西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「書けたね。速いし正確」'],
  near:    ['西村「ほぼ正解。字だけ、もう一回見ておこう」','きょん「おしい！でも合ってることにする！字は覚え直す！」'],
  kana:    ['西村「ひらがなで正解。漢字でも書けるとテストで強いよ」','きょん「読みは完ぺき！あとは漢字だ！」'],
  ng:      ['きょん「あれ！？また間違えた！降格したくない！！」','西村「惜しい。答えを声に出して1回読んでおこう」','西村「ここは迷いやすいところ。下のメモを見ておこう」','きょん「ここ、俺もひっかかるやつだ…！」'],
  giveup:  ['西村「わからないって言えるのは大事。答えを1回見て、次に覚えよう」','きょん「パスもアリ！答えを見たから次は書ける！」'],
  timeout: ['きょん「時間切れ…！でも考えてたのは見てたよ！」','西村「時間切れは気にしなくていい。答えを1回見ておこう」']
};
var RETRY_LINES = ['きょん「ちがうっぽい！もう1回いける！」','西村「惜しいかも。もう1回だけ書いてみよう」','きょん「あと1回！落ち着いて！」'];
var COMBO_LINES = {
  3:  'くるま「3連続っす！きょんさん、もう歴史の人っすよ！」',
  5:  'くるま「5連続！僕、拍手しすぎて手が痛いっす！」',
  10: 'くるま「10連続っす！！歴史の教科書に載るレベルっす！！」',
  15: 'くるま「15連続！？僕もう、きょんさんの年表つくるっす！！」',
  20: 'くるま「20連続っす！！これは歴史に名を残すやつっす！！」'
};

function submit(){
  if(!G || G.answered || G.paused) return;
  var q = G.qs[G.i];
  var input = $('ansInput').value;
  var g = grade(q, input);
  if(!g){ $('tryMsg').textContent = '答えを入力してね（わからなければ「わからない」）'; $('tryMsg').className = 'try-msg warn'; return; }
  if(g.ok){ finish(true, input, null, g); return; }
  G.tries++;
  if(G.tries < 2){
    // 1回目のまちがい：もう1回チャンス（時計は進んだまま）
    G.firstWrong = input;
    var inp = $('ansInput');
    inp.className = 'ans-input shake';
    setTimeout(function(){ if(inp.className.indexOf('shake') >= 0) inp.className = 'ans-input'; }, 500);
    inp.select();
    $('tryMsg').textContent = pick(RETRY_LINES) + '（あと1回）';
    $('tryMsg').className = 'try-msg retry';
    return;
  }
  finish(false, input, 'wrong', g);
}
function giveUp(){
  if(!G || G.answered || G.paused) return;
  finish(false, $('ansInput').value, 'giveup', null);
}
function showHint(){
  if(!G || G.answered || G.paused || G.hint) return;
  G.hint = true;
  var q = G.qs[G.i];
  var shown = q.a.replace(/[・]/g, '');
  var first = q.a.charAt(0);
  var body = 'ヒントいきます！最初の字は「' + esc(first) + '」で、全部で' + shown.length + '文字ですねん。きょんさんならいけますって！';
  if(q.y && q.y.charAt(0) !== first) body += '<span class="hint-sub">（読みの最初は「' + esc(q.y.charAt(0)) + '」）</span>';
  $('hintBox').innerHTML = '<div class="chat shun"><div class="ic">🧢</div><div class="bub"><span class="nm">なかむらしゅん</span>' + body + '</div></div>';
  $('hintBox').classList.remove('hide');
  $('btnHint').disabled = true;
  try{ $('ansInput').focus({ preventScroll:true }); }catch(e){}
}

// why：null＝正解／'wrong'＝2回まちがい／'giveup'＝わからない／'timeout'＝時間切れ
function finish(correct, input, why, g){
  if(!G || G.answered) return;
  G.answered = true;
  var q = G.qs[G.i];
  var qid = qidOf(q);
  recordResult(q, correct);
  $('ansInput').disabled = true; $('btnSubmit').disabled = true; $('btnHint').disabled = true; $('btnGiveup').disabled = true;
  $('btnPause').disabled = true;
  $('tryMsg').textContent = '';

  var pts = 0, xpd = 0, bannerCls, bannerTxt, line, comboLine = '';
  if(correct){
    G.combo++; G.right++;
    if(G.combo > G.maxCombo) G.maxCombo = G.combo;
    var speed = Math.round(G.left / G.timeLimit * 100);
    pts = 100 + speed + Math.min(G.combo - 1, 10) * 10;
    if(G.tries > 0) pts -= 30;          // 2回目で正解
    if(G.hint) pts = Math.round(pts / 2);
    if(g && g.near) pts -= 20;
    pts = Math.max(10, pts);
    G.score += pts;
    if(answeredSet[qid]) xpd = 1;
    else { xpd = G.hint ? 2 : 5; answeredSet[qid] = true; lsSet('soc_hq_answered', JSON.stringify(answeredSet)); }
    bannerCls = 'ok';
    bannerTxt = g && g.near ? '⭕ おしい！ほぼ正解' : '⭕ 正解！';
    line = pick(g && g.near ? LINES.near : g && g.kana ? LINES.kana : LINES.ok);
    if(COMBO_LINES[G.combo]) comboLine = COMBO_LINES[G.combo];
  } else {
    G.combo = 0;
    G.miss.push({ q:q, input:(why === 'timeout' ? null : (input || G.firstWrong || '')), why:why });
    // 書きまちがいが多い特性に合わせてやさしめ：2回まちがい −3／時間切れ −2／わからない 0
    xpd = why === 'wrong' ? -3 : why === 'timeout' ? -2 : 0;
    bannerCls = why === 'timeout' ? 'to' : 'ng';
    bannerTxt = why === 'timeout' ? '⏰ 時間切れ' : why === 'giveup' ? '🙋 答えを見よう' : '❌ ざんねん';
    line = pick(LINES[why] || LINES.ng);
  }
  G.xpGain += xpd;
  changeXP(xpd);
  $('hudScore').textContent = G.score + ' PT';
  $('hudCombo').textContent = G.combo >= 2 ? '🔥 ' + G.combo + ' COMBO' : '';

  var html = '<div class="fb">';
  html += '<div class="banner ' + bannerCls + '">' + bannerTxt +
          '<span class="pts">' + (correct ? '+' + pts + ' PT ／ ' : '') + 'XP ' + (xpd > 0 ? '+' : '') + xpd + '</span></div>';
  var yomi = q.y ? '<small class="yomi">' + esc(q.y) + '</small>' : '';
  if(!correct || (g && (g.near || g.kana))){
    var yours = why === 'timeout' ? '（時間切れ）' : why === 'giveup' && !input ? '（わからない）' : esc(input || G.firstWrong || '');
    html += '<div class="cmp"><div class="yours' + (correct ? ' okish' : '') + '"><small>あなたの答え</small>' + yours + '</div>' +
            '<div class="ans"><small>正しい答え</small>' + esc(q.a) + yomi + '</div></div>';
  } else {
    html += '<div class="cmp one"><div class="ans"><small>正しい答え</small>' + esc(q.a) + yomi + '</div></div>';
  }
  html += '<div class="exp"><div class="h">📌 解説</div>' +
          '<p><span class="lbl">📐 答え：</span>' + esc(q.a) + (q.y ? '（' + esc(q.y) + '）' : '') + '</p>' +
          '<p><span class="lbl">✅ 覚える文：</span>' + esc(q.q.replace(/[？?]$/, '')) + ' → <b>' + esc(q.a) + '</b></p>' +
          (q.alt.length ? '<p><span class="lbl">🆗 これでも正解：</span>' + esc(q.alt.join('／')) + '</p>' : '') +
          (q.note ? '<p><span class="lbl">❌ まちがえやすい：</span>' + esc(q.note) + '</p>' : '') +
          (g && g.near ? '<p><span class="lbl">💡 字のチェック：</span>あなたの答えは1文字だけちがったよ。正しくは「' + esc(q.a) + '」</p>' : '') +
          (g && g.kana ? '<p><span class="lbl">💡 漢字で：</span>テストでは「' + esc(q.a) + '」と漢字で書けるようにしよう</p>' : '') +
          '</div>';
  html += chatHTML(line);
  if(comboLine) html += chatHTML(comboLine);
  var last = G.i >= G.qs.length - 1;
  html += '<button class="next-btn" id="btnNext">' + (last ? '🏁 結果を見る' : '次へ ▶') + '<small>Enter</small></button>';
  html += '</div>';
  $('fbArea').innerHTML = html;
  $('btnNext').addEventListener('click', nextQuestion);
  // スマホのキーボードを閉じて、結果が見えるようにする
  try{ $('ansInput').blur(); }catch(e){}
  setTimeout(function(){ var el = document.querySelector('#fbArea .banner'); if(el && el.scrollIntoView) el.scrollIntoView({ behavior:'smooth', block:'nearest' }); }, 80);
}
function chatHTML(line){
  var m = line.match(/^(.+?)「([\s\S]*)」$/);
  var name = m ? m[1] : '', body = m ? m[2] : line;
  var cls = name === 'きょん' ? ' kyon' : name === 'くるま' ? ' kuruma' : '';
  var icon = name === 'きょん' ? '🙋‍♂️' : name === 'くるま' ? '📣' : '🎙️';
  return '<div class="chat' + cls + '"><div class="ic">' + icon + '</div><div class="bub"><span class="nm">' + esc(name) + '</span>' + esc(body) + '</div></div>';
}
function nextQuestion(){
  if(!G || !G.answered) return;
  G.i++;
  if(G.i >= G.qs.length) showResult(); else showQuestion();
}

// ===== 結果 =====
function rankFor(rate){
  if(rate >= 100) return '👑 M-1グランプリ優勝';
  if(rate >= 90)  return '🏆 M-1決勝進出';
  if(rate >= 80)  return '🌟 冠番組獲得';
  if(rate >= 70)  return '📺 全国ネット';
  if(rate >= 60)  return '⭐ 準レギュラー獲得';
  if(rate >= 40)  return '🎭 劇場デビュー';
  if(rate >= 20)  return '🎤 NSC卒業';
  return '🥚 NSC入学';
}
function resultLine(rate){
  if(rate >= 100) return 'きょん「全問書けた！？俺、令和ロマンに勝ったわ！！」';
  if(rate >= 80)  return '西村「書いて答えられるのは本物の力。テストでもいける」';
  if(rate >= 60)  return 'きょん「半分以上書けた！にっくん、俺、歴史できるかも！」';
  if(rate >= 40)  return '西村「書けなかった問題が見えたのが大事。下の一覧からもう一回やろう」';
  return 'きょん「書くのは選ぶよりずっと難しい！まちがえた問題だけ、もう一回いこう！」';
}
function showResult(){
  stopTimer();
  var n = G.qs.length, rate = Math.round(G.right / n * 100);
  var isNew = false;
  if(!G.retry && (!best[G.key] || G.score > best[G.key])){ isNew = true; best[G.key] = G.score; lsSet('soc_hq_best', JSON.stringify(best)); }
  var h = '<div class="res-hero"><div style="color:var(--sub);font-size:14px">' + (G.retry ? 'まちがえた問題のやり直し' : 'SCORE') + '</div>' +
          '<div class="res-score">' + G.score + ' PT</div>' +
          '<div class="res-rank">' + rankFor(rate) + '</div>' +
          (isNew ? '<div class="res-new">🏆 ベスト更新！</div>' : '') + '</div>';
  h += '<div class="stats"><div class="stat"><b>' + G.right + '/' + n + '</b>正解</div>' +
       '<div class="stat"><b>' + rate + '%</b>正答率</div>' +
       '<div class="stat"><b>' + G.maxCombo + '</b>最大コンボ</div></div>';
  h += '<div style="text-align:center;font-size:15px;color:var(--gold)">社会XP ' + (G.xpGain >= 0 ? '+' : '') + G.xpGain + '</div>';
  h += chatHTML(resultLine(rate));
  h += '<button class="big-btn" id="btnAgain">▶ もう一回（同じ設定）</button>';
  if(G.miss.length) h += '<button class="sub-btn" id="btnRetryMiss">🔁 まちがえた ' + G.miss.length + ' 問だけもう一回</button>';
  h += '<button class="sub-btn" id="btnBack">⚙️ 設定にもどる</button>';
  if(G.miss.length){
    h += '<div class="miss"><h3>📝 まちがえた問題</h3>' + G.miss.map(function(m){
      var you = m.why === 'timeout' ? '時間切れ' : (m.input ? esc(m.input) : 'わからない');
      return '<div class="miss-item">' + esc(m.q.q) + '<br><span class="a">→ ' + esc(m.q.a) + (m.q.y ? '（' + esc(m.q.y) + '）' : '') + '</span>' +
             '<br><span class="y">あなた：' + you + (m.q.note ? '　💡 ' + esc(m.q.note) : '') + '</span></div>';
    }).join('') + '</div>';
  }
  $('scrResult').innerHTML = h;
  $('scrGame').classList.add('hide'); $('scrResult').classList.remove('hide');
  var missList = G.miss.map(function(m){ return m.q; });
  $('btnAgain').addEventListener('click', function(){ startGame(); });
  $('btnBack').addEventListener('click', showStart);
  if($('btnRetryMiss')) $('btnRetryMiss').addEventListener('click', function(){ startGame(missList); });
  window.scrollTo(0, 0);
}

// ===== 操作 =====
document.addEventListener('click', function(e){
  var t = e.target.closest ? e.target.closest('button') : null;
  if(!t) return;
  if(t.getAttribute('data-range')){ settings.range = t.getAttribute('data-range'); saveSettings(); renderChips(); return; }
  if(t.getAttribute('data-order')){ settings.order = t.getAttribute('data-order'); saveSettings(); renderChips(); return; }
  if(t.getAttribute('data-count') !== null){ settings.count = parseInt(t.getAttribute('data-count'), 10); saveSettings(); renderChips(); return; }
  if(t.getAttribute('data-time')){ settings.time = parseInt(t.getAttribute('data-time'), 10); saveSettings(); renderChips(); return; }
});
// 変換中・変換を確定した直後の Enter では送信しない（Safari は確定の Enter が compositionend の後に来る）
var lastCompEnd = 0;
$('ansInput').addEventListener('compositionend', function(){ lastCompEnd = Date.now(); });
$('ansInput').addEventListener('keydown', function(e){
  if(e.key !== 'Enter') return;
  e.stopPropagation();   // 正解したときに同じ Enter で「次へ」まで進まないように
  if(e.isComposing || e.keyCode === 229 || Date.now() - lastCompEnd < 120) return;
  e.preventDefault(); submit();
});
document.addEventListener('keydown', function(e){
  if(!G || $('scrGame').classList.contains('hide')) return;
  if(G.answered && (e.key === 'Enter' || e.key === ' ')){ nextQuestion(); e.preventDefault(); }
});
$('btnSubmit').addEventListener('click', submit);
$('btnGiveup').addEventListener('click', giveUp);
$('btnHint').addEventListener('click', showHint);
$('btnStart').addEventListener('click', function(){ startGame(); });
$('btnPause').addEventListener('click', togglePause);
document.addEventListener('visibilitychange', function(){
  if(document.hidden && G && !G.answered && !G.paused && !$('scrGame').classList.contains('hide')) togglePause();
});
$('btnQuit').addEventListener('click', function(){
  if(!G) return;
  var wasPaused = G.paused; G.paused = true;
  if(window.confirm('ここでやめる？（ここまでの記録は弱点DBに残るよ）')){ G = null; showStart(); }
  else if(G){ G.paused = wasPaused; }
});

showStart();
