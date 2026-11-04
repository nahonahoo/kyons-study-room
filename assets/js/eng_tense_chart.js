// ===== 英語 時制表（迷ったらここを見る）=====
// 見るだけの早見表。クイズ・XP・弱点DBなし。🔊ボタン（data-say）で英文を読み上げるだけ。
// 他の英語ページの「📖時制表」ボタンから重ねて開かれたとき（iframe の中）は、🏠を隠し、リンクはページ全体で開く
if(window.self!==window.top){
  document.addEventListener('DOMContentLoaded',function(){
    var home=document.querySelector('.page-head a');if(home)home.style.display='none';
    document.querySelectorAll('.links a').forEach(function(a){a.setAttribute('target','_top');});
  });
}
// 主語の切りかえ（I ／ You ／ He・She）：くるまの表だけ。I から変わる語はピンク
document.addEventListener('click',function(e){
  var b=e.target.closest?e.target.closest('[data-subj]'):null;
  if(!b)return;
  var m=b.getAttribute('data-subj');
  document.body.classList.toggle('subj-you',m==='you');
  document.body.classList.toggle('subj-he',m==='he');
  document.querySelectorAll('[data-subj]').forEach(function(x){x.classList.toggle('on',x===b);});
});
var currentSay=null;
document.addEventListener('click',function(e){
  var btn=e.target.closest?e.target.closest('[data-say]'):null;
  if(!btn||!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  if(currentSay){currentSay.classList.remove('playing');}
  if(currentSay===btn){currentSay=null;return;}
  var u=new SpeechSynthesisUtterance(btn.getAttribute('data-say'));
  u.lang='en-US';u.rate=0.82;
  u.onend=function(){btn.classList.remove('playing');if(currentSay===btn)currentSay=null;};
  currentSay=btn;btn.classList.add('playing');
  window.speechSynthesis.speak(u);
});
