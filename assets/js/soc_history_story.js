// ===== SVG: 戦後日本の「勢い」グラフ（統計ではなくイメージ図） =====
function makeSvgPostwarGraph(){
  var o = '<svg viewBox="0 0 740 215" style="width:100%;display:block;overflow:visible;margin:10px 0 4px">';
  o += '<text x="14" y="26" fill="var(--text2)" font-size="10" font-family="Noto Serif JP,serif">↑好景気</text>';
  o += '<line x1="10" y1="190" x2="730" y2="190" stroke="var(--border)" stroke-width="1" stroke-dasharray="4,3" opacity="0.7"/>';
  o += '<text x="14" y="205" fill="var(--text2)" font-size="10" font-family="Noto Serif JP,serif">↓不景気</text>';
  // 面塗り（曲線の下）
  o += '<path d="M30,165 L190,128 L360,62 L520,40 L690,140 L690,190 L30,190 Z" fill="var(--gold)" opacity="0.08"/>';
  // 折れ線（次の地点の色で塗る）
  o += '<line x1="30" y1="165" x2="190" y2="128" stroke="var(--amber)" stroke-width="3" stroke-linecap="round"/>';
  o += '<line x1="190" y1="128" x2="360" y2="62" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"/>';
  o += '<line x1="360" y1="62" x2="520" y2="40" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"/>';
  o += '<line x1="520" y1="40" x2="690" y2="140" stroke="var(--red)" stroke-width="3" stroke-linecap="round"/>';
  // P1 焼け野原
  o += '<circle cx="30" cy="165" r="6" fill="var(--red)"/>';
  o += '<line x1="30" y1="171" x2="30" y2="185" stroke="var(--red)" stroke-width="1" stroke-dasharray="2,2"/>';
  o += '<text x="30" y="202" text-anchor="middle" fill="var(--red)" font-size="12" font-family="Noto Serif JP,serif" font-weight="bold">焼け野原</text>';
  o += '<text x="30" y="216" text-anchor="middle" fill="var(--text2)" font-size="10" font-family="Noto Serif JP,serif">1945年</text>';
  // P2 特需・独立
  o += '<circle cx="190" cy="128" r="6" fill="var(--amber)"/>';
  o += '<line x1="190" y1="122" x2="190" y2="104" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2,2"/>';
  o += '<text x="190" y="97" text-anchor="middle" fill="var(--amber)" font-size="12" font-family="Noto Serif JP,serif" font-weight="bold">特需&amp;独立</text>';
  o += '<text x="190" y="83" text-anchor="middle" fill="var(--text2)" font-size="10" font-family="Noto Serif JP,serif">1950年代</text>';
  // P3 高度経済成長
  o += '<circle cx="360" cy="62" r="6" fill="var(--gold)"/>';
  o += '<line x1="360" y1="68" x2="360" y2="92" stroke="var(--gold)" stroke-width="1" stroke-dasharray="2,2"/>';
  o += '<text x="360" y="107" text-anchor="middle" fill="var(--gold)" font-size="12" font-family="Noto Serif JP,serif" font-weight="bold">高度経済成長</text>';
  o += '<text x="360" y="121" text-anchor="middle" fill="var(--text2)" font-size="10" font-family="Noto Serif JP,serif">1960〜70年代</text>';
  // P4 バブル絶頂
  o += '<circle cx="520" cy="40" r="6" fill="var(--gold)"/>';
  o += '<line x1="520" y1="34" x2="520" y2="18" stroke="var(--gold)" stroke-width="1" stroke-dasharray="2,2"/>';
  o += '<text x="520" y="13" text-anchor="middle" fill="var(--gold)" font-size="12" font-family="Noto Serif JP,serif" font-weight="bold">バブル絶頂</text>';
  o += '<text x="605" y="13" text-anchor="middle" fill="var(--text2)" font-size="10" font-family="Noto Serif JP,serif">（1980年代後半）</text>';
  // P5 崩壊→停滞
  o += '<circle cx="690" cy="140" r="6" fill="var(--red)"/>';
  o += '<line x1="690" y1="134" x2="690" y2="116" stroke="var(--red)" stroke-width="1" stroke-dasharray="2,2"/>';
  o += '<text x="690" y="109" text-anchor="middle" fill="var(--red)" font-size="12" font-family="Noto Serif JP,serif" font-weight="bold">崩壊→停滞</text>';
  o += '<text x="690" y="95" text-anchor="middle" fill="var(--text2)" font-size="10" font-family="Noto Serif JP,serif">1991年〜</text>';
  o += '</svg>';
  return o;
}

// ===== 号外！戦後日本ストーリー新聞 のデータ =====
var STAGES = [
  { no:'1', theme:'red',
    title:'焼け野原とアメリカの「大改造」計画（1945年〜）',
    items:[
      'すべてを失う：<span class="hl-red">1945年8月</span>、日本は戦争に負けて焼け野原に',
      'アメリカ軍がやってきた：<span class="hl">GHQ</span>（連合国軍総司令部）が日本を事実上支配',
      '大改革ラッシュ：軍隊をなくし、<span class="hl-blue">女性に選挙権</span>を与え、農地を農民にタダ同然で分け与え（<span class="hl">農地改革</span>）、<span class="hl">財閥解体</span>も実施'
    ],
    sticky:'📌', stickyText:'→ こうして日本は「戦争できない・みんなが選挙に参加する」国に生まれ変わった' },
  { no:'2', theme:'amber',
    title:'まさかのラッキーと独立（1950年代）',
    items:[
      '<span class="hl-red">朝鮮戦争</span>が始まり、日本に注文が殺到する「<span class="hl">特需</span>」で経済がグングン回復',
      '<span class="hl-blue">1951年</span>、<span class="hl">サンフランシスコ平和条約</span>でついに独立を回復',
      '同時にアメリカと<span class="hl">日米安全保障条約</span>も結び、「守ってもらう代わりにアメリカ寄り」の立場に'
    ],
    sticky:'📌', stickyText:'→ 経済が上向いたところに、次はいよいよ本格成長へ' },
  { no:'3', theme:'gold',
    title:'モーレツに働く！高度経済成長（1955年〜1973年頃）',
    items:[
      '「<span class="hl">三種の神器</span>」白黒テレビ・洗濯機・冷蔵庫が各家庭に普及',
      '<span class="hl-blue">1964年</span>、<span class="hl">東京オリンピック</span>開催で「復活した日本」を世界にアピール',
      '気づけばアメリカに次ぐ<span class="hl">世界第2位の経済大国</span>に'
    ],
    sticky:'📌', stickyText:'→ 「日本すごい」ムードが最高潮に達し、次はその勢いが暴走していく' },
  { no:'4', theme:'gold',
    title:'バブルの狂騒と目覚め（1980年代後半〜1990年代以降）',
    items:[
      '土地と株の値段がとにかく上がり続ける「<span class="hl">バブル景気</span>」でみんな浮かれる',
      '<span class="hl-blue">1991年</span>ごろ<span class="hl-red">バブル崩壊</span>、一気に「<span class="hl-red">失われた30年</span>」と呼ばれる長い停滞へ'
    ],
    sticky:'⚠️', stickyText:'好景気は続かない、調子に乗りすぎた反動が来る——というのがこの物語の教訓！', warn:true }
];

var THEME = {
  red:  { tape:'var(--red)',   num:'var(--red)'   },
  amber:{ tape:'var(--amber)', num:'var(--amber)' },
  gold: { tape:'var(--gold)',  num:'var(--gold)'  }
};

function renderStoryPage(){
  var html = '';

  html += '<div class="masthead">';
  html += '<div class="masthead-kicker">号外！</div>';
  html += '<div class="masthead-title">戦後日本ストーリー新聞</div>';
  html += '<div class="masthead-sub">🗞️ テスト前にサクッと読んで「流れ」を掴もう！（クイズじゃないよ）</div>';
  html += '<div class="masthead-rule"></div>';
  html += '</div>';

  html += '<div class="tagline-box">焼け野原からのスタート、空前の好景気、そしてバブルと平成の停滞——まるでジェットコースターのような激動のドラマ！</div>';

  html += '<div class="graph-card">';
  html += '<div class="graph-card-title">📈 号外グラフ：日本の「勢い」の推移</div>';
  html += makeSvgPostwarGraph();
  html += '<div class="graph-note">※実際の統計データではなく、日本の「勢い」をイメージで表した図だよ</div>';
  html += '</div>';

  STAGES.forEach(function(s, i){
    var t = THEME[s.theme];
    html += '<div class="clip-card">';
    html += '<div class="clip-tape" style="background:'+t.tape+'"></div>';
    html += '<div class="clip-head">';
    html += '<div class="clip-num" style="background:'+t.num+'">'+s.no+'</div>';
    html += '<div class="clip-title">'+s.title+'</div>';
    html += '</div>';
    html += '<ul class="clip-body">';
    s.items.forEach(function(it){ html += '<li>'+it+'</li>'; });
    html += '</ul>';
    var stickyColor = s.warn ? 'var(--red)' : 'var(--gold)';
    var stickyBg = s.warn ? 'rgba(233,69,96,0.1)' : 'rgba(245,197,24,0.08)';
    html += '<div class="sticky" style="border-color:'+stickyColor+';background:'+stickyBg+';color:'+stickyColor+'">';
    html += '<span class="sticky-icon">'+s.sticky+'</span>'+s.stickyText;
    html += '</div>';
    html += '</div>';
    if(i < STAGES.length-1) html += '<div class="arrow-down" style="color:var(--amber)">↓</div>';
  });

  html += '<div class="end-note">📰 発行：きょん＆西村新聞社　／　これは「流れ」を掴むための読み物です。年号や語句のくわしい暗記は、歴史タブの語呂合わせ・クイズで確認しよう！</div>';

  document.getElementById('paperMain').innerHTML = html;
}

renderStoryPage();
