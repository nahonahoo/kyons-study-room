// ===== 英語の全ページ共通：「📖 時制表」ボタン =====
// 画面の右端（中ほど）に細いタブを出し、押すと時制表（english_reading/eng_tense_chart.html）をその場に重ねて開く。
// ページを移動しないので、解いている途中の状態はそのまま。✕・背景・Escキーで閉じる。
// ページごとにCSSがちがう（english.css / math.css / eng_vocab.css / なし）ので、見た目はこのファイルの中だけで完結させる。
(function(){
  if (location.pathname.indexOf('eng_tense_chart') !== -1) return;
  var me = document.currentScript;
  var chartUrl = new URL('../../english_reading/eng_tense_chart.html', me ? me.src : location.href).href;

  var css = ''
    + '#tenseTab{position:fixed;right:0;top:58%;z-index:9000;background:#f5c518;color:#000;border:none;border-radius:10px 0 0 10px;'
    + 'padding:10px 6px;font-family:"Noto Serif JP",serif;font-size:14px;font-weight:bold;line-height:1.3;cursor:pointer;'
    + 'writing-mode:vertical-rl;letter-spacing:0.1em;box-shadow:-2px 2px 10px rgba(0,0,0,0.5);opacity:0.92;}'
    + '#tenseTab:hover{opacity:1;}'
    + '#tenseOverlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.7);display:none;}'
    + '#tenseOverlay.open{display:flex;justify-content:center;align-items:stretch;}'
    + '#tensePanel{background:#0d1117;width:100%;max-width:780px;display:flex;flex-direction:column;border-left:1px solid #30363d;border-right:1px solid #30363d;}'
    + '#tenseBar{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#161b22;border-bottom:1px solid #30363d;}'
    + '#tenseBar span{color:#f5c518;font-family:"Noto Serif JP",serif;font-weight:bold;font-size:16px;letter-spacing:0.05em;}'
    + '#tenseClose{background:#e94560;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-size:15px;font-weight:bold;font-family:inherit;cursor:pointer;}'
    + '#tenseFrame{flex:1;width:100%;border:0;background:#0d1117;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var tab = document.createElement('button');
  tab.id = 'tenseTab'; tab.type = 'button'; tab.title = '時制表を開く（迷ったらここ）';
  tab.textContent = '📖時制表';

  var ov = document.createElement('div');
  ov.id = 'tenseOverlay';
  ov.innerHTML = '<div id="tensePanel"><div id="tenseBar"><span>📖 時制表</span><button id="tenseClose" type="button">✕ とじる</button></div><iframe id="tenseFrame" title="時制表"></iframe></div>';

  function open(){
    var fr = ov.querySelector('#tenseFrame');
    if (!fr.getAttribute('src')) fr.setAttribute('src', chartUrl);
    ov.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }
  function close(){
    ov.classList.remove('open');
    document.documentElement.style.overflow = '';
    try { var w = ov.querySelector('#tenseFrame').contentWindow; if (w && w.speechSynthesis) w.speechSynthesis.cancel(); } catch(e) {}
  }
  tab.addEventListener('click', open);
  ov.addEventListener('click', function(e){ if (e.target === ov || e.target.id === 'tenseClose') close(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && ov.classList.contains('open')) close(); });

  function mount(){ document.body.appendChild(tab); document.body.appendChild(ov); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
