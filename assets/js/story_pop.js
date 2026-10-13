// ===== 歴史ストーリー新聞シリーズ：共通の描画（POP広告デザイン） =====
// 各号のJSは STORY オブジェクトを作って renderStory(STORY) を呼ぶだけ。
// クイズ・XP・弱点DBとは非連携の読み物ページ（3秒チェックもXPなし）

// シリーズ目次（href が空なら「準備中」）
var STORY_SERIES = [
  { key:'asuka',   label:'① 飛鳥',   href:'soc_story_asuka.html' },
  { key:'nara',    label:'② 奈良',   href:'soc_story_nara.html' },
  { key:'heian',   label:'③ 平安',   href:'soc_story_heian.html' },
  { key:'kamakura',label:'④ 鎌倉',   href:'soc_story_kamakura.html' },
  { key:'muromachi',label:'⑤ 室町',  href:'soc_story_muromachi.html' },
  { key:'azuchi',  label:'⑥ 安土桃山', href:'soc_story_azuchi.html' },
  { key:'edo1',    label:'⑦ 江戸前半', href:'soc_story_edo1.html' },
  { key:'edo2',    label:'⑧ 江戸中期', href:'soc_story_edo2.html' },
  { key:'edo3',    label:'⑨ 江戸後半', href:'soc_story_edo3.html' },
  { key:'bakumatsu',label:'⑩ 開国',    href:'soc_story_bakumatsu.html' },
  { key:'meiji',   label:'⑪ 明治維新', href:'soc_story_meiji.html' },
  { key:'postwar', label:'📰 戦後日本', href:'soc_history_story.html' }
];

// 会話のキャラ（口調ルールが確定しているメンバーのみ）
var CAST = {
  kyon:   { name:'きょん',          av:'😄' },
  nishi:  { name:'西村',            av:'慶' },
  shun:   { name:'なかむらしゅん',  av:'🎭' },   // 9番街レトロ・ツッコミ。大阪出身の関西弁。きょんには「きょんさん」＋です・ます＋関西弁（ほんまに・〜やと思います・できひん）。僕。ひょうきんで熱い。相方は「京極」。賭け事・お金ネタ禁止
  kuruma: { name:'くるま',          av:'🚗' },
  iwakura:{ name:'イワクラ',        av:'🎸' },
  // 2026-10-06 追加（口調はWebで確認。どちらもきょんの後輩で敬語）
  kemuri: { name:'ケムリ',          av:'🚬' },   // 令和ロマン。一人称「僕」、淡々・低テンション、「〜だと思います」と断定しない、大喜利の細かいボケ
  kyogoku:{ name:'京極風斗',        av:'🖼️' },  // 9番街レトロ・ボケ。大阪出身の関西弁（2026-10-14 訂正：以前の「関西弁なし」は誤り）。きょんには です・ます＋薄い関西弁。僕。低音・淡々・理屈で言語化。相方は「なかむら」「お前」。京都・浮世絵・骨格好き
  sasaki: { name:'佐々木（エバース）', av:'⚾' }, // ボケ。宮城出身・元野球部。日常の雑談からシュールな詭弁へ
  machida:{ name:'町田（エバース）',  av:'🚗' },  // ツッコミ。神奈川出身・元カーディーラー営業。佐々木の詭弁に翻弄される
  // 2026-10-14 追加（Wikipedia・吉本公式・QJWeb・ORICON・テレ東プラス等で確認。きょん・西村＝NSC東京17期から見て全員後輩 → 「きょんさん」＋敬語）
  yasu:   { name:'ヤス（ナイチンゲールダンス）', av:'🤳' },   // ツッコミ・NSC東京22期。僕。なかるてぃんには「なかるてぃん」「お前」とタメ口で短く鋭く。「絶対なかるてぃんが〇〇した方がいいよ」と振る。熱く自信家。しゅんの元ルームメイト
  nakaru: { name:'中野なかるてぃん', av:'🎓' },               // ボケ。僕。ヤスを「ヤスさん」（大学で1学年下）、です・ますとタメ口が混ざる。高い声でたたみかける・マイペース。一橋大卒、塾なしで合格
  paul:   { name:'ポール（サンタモニカ）', av:'🏈' },         // ボケ・NSC東京23期（令和ロマンと同期）。僕。相方は「マイム」。ガッツ担当、元アメフト部、ギター・三線
  maimu:  { name:'マイム（サンタモニカ）', av:'💃' },         // ツッコミ・ネタ作り。僕。相方は「ポール」。明るい・駄洒落ツッコミ・きつい毒舌はなし。北海道育ち、日ハムファン、社交ダンス・空手
  saaya:  { name:'サーヤ（ラランド）', av:'🎤' },             // ボケ・ネタ作り。私。吉本外（個人事務所の社長）。テキパキ仕切る。毒はニシダにだけ（「ニシダ」）。上智大スペイン語学科卒。くるまとは学生お笑い時代からの仲
  nishida:{ name:'ニシダ（ラランド）', av:'📚' }              // ツッコミ。僕。相方は「サーヤさん」。読書家・小説も書く。ひねくれた理屈と自虐。遅刻ネタまで（生活面のクズエピソードは使わない）
};

// 記事ごとの色（帯・番号・★）
var BANDS = ['var(--pop-v)','var(--pop-y)','var(--pop-o)','var(--pop-p)','var(--pop-c)','var(--pop-r)','var(--pop-g)'];

function talk(lines){
  var h = '<div class="talk">';
  lines.forEach(function(l){
    var c = CAST[l[0]];
    h += '<div class="chat-line c-' + l[0] + '"><div class="avatar">' + c.av + '</div><div style="flex:1"><div class="chat-name">' + c.name + '</div><div class="chat-bubble">' + l[1] + '</div></div></div>';
  });
  return h + '</div>';
}
// 語呂合わせ（付箋。「🎵 語呂合わせ」のラベルはCSSで付ける）
function goro(t){ return '<div class="goro lite">' + t + '</div>'; }
// POP札：📌＝ココ出る!!／🔗＝つづく!!／⚠️＝まちがえ注意!!
function sticky(icon, text){
  var kind = icon === '🔗' ? 'next' : icon === '⚠️' ? 'warn' : '';
  var tag = kind === 'next' ? 'つづく!!' : kind === 'warn' ? 'まちがえ注意!!' : 'ココ出る!!';
  var body = text.replace(/^(テストに出る！|まちがえ注意！　|→ )/, '');
  return '<div class="pop-point ' + kind + '"><span class="pop-tag">' + tag + '</span>' + body + '</div>';
}
function secHead(text, color){ return '<div class="sec-head ' + (color || '') + '"><span>' + text + '</span></div>'; }

function seriesNav(cur){
  var h = '<div class="series">';
  STORY_SERIES.forEach(function(s){
    if(s.key === cur) h += '<span class="now">' + s.label + '（いまここ）</span>';
    else if(!s.href) h += '<span class="soon">' + s.label + '（準備中）</span>';
    else h += '<a href="' + s.href + '">' + s.label + '</a>';
  });
  return h + '</div>';
}

function renderStory(S){
  var html = '';

  html += '<div class="masthead">';
  html += '<div class="burst">号外<br>!!</div>';
  html += '<div class="masthead-title"><span class="t1">' + S.era + '</span><br><span class="t2">ストーリー</span>新聞</div>';
  html += '<div class="masthead-sub">🗞️ ' + S.span + '<br>サクッと読んで「流れ」をつかもう！（クイズじゃないよ）</div>';
  html += seriesNav(S.key);
  html += '</div>';

  html += '<div class="catch lite">' + S.catchText + '<small>' + S.catchSmall + '</small></div>';

  // 登場人物
  html += secHead('🎭 まずは登場人物（キャラ図鑑）');
  html += '<div class="chara-grid">';
  S.charas.forEach(function(c, i){
    html += '<div class="chara k' + (i % 6) + '"><div class="chara-top"><div class="chara-emo">' + c[0] + '</div><div class="chara-name">' + c[1] + '<small>' + c[2] + '</small></div></div><div class="chara-desc">' + c[3] + '</div></div>';
  });
  html += '</div>';

  // 年表
  html += secHead('📅 たての年表（上から古い順）', 'c');
  html += '<div class="tl">';
  S.timeline.forEach(function(t){ html += '<div class="tl-item"><span class="tl-year">' + t[0] + '</span><span>' + t[1] + '</span></div>'; });
  html += '</div>';

  // 記事
  html += secHead('📰 本日の記事（全' + S.stages.length + '本）', 'o');
  S.stages.forEach(function(s, i){
    html += '<div class="clip-card" style="--band:' + BANDS[i % BANDS.length] + '">';
    html += '<div class="clip-head"><div class="clip-num">' + s.no + '</div><div class="clip-title">' + s.title + '</div></div>';
    html += '<ul class="clip-body">';
    s.items.forEach(function(it){ html += '<li>' + it + '</li>'; });
    html += '</ul>';
    if(s.talk) html += talk(s.talk);
    if(s.goro) html += goro(s.goro);
    if(s.stickyText) html += sticky(s.stickyIcon, s.stickyText);
    html += '</div>';
    if(i < S.stages.length - 1) html += '<div class="arrow-down">👇</div>';
  });

  // まとめ
  html += secHead('🧭 ' + S.onelineHead, 'g');
  html += '<div class="oneline lite">' + S.oneline + '</div>';

  // 勘違い
  html += secHead('🚫 よくある勘違い（ここで直そう）');
  S.myths.forEach(function(m){
    html += '<div class="myth"><span class="stamp">✕</span><div><span class="ng-text">' + m[0] + '</span><span class="ok-text">' + m[1] + '</span></div></div>';
  });

  // 組み合わせ表
  html += secHead('🔗 人物とできごとの組み合わせ', 'v');
  html += '<div class="pair-wrap"><table class="pair-table"><tr><th>人物</th><th>できごと</th></tr>';
  S.pairs.forEach(function(p){ html += '<tr><td style="white-space:nowrap;font-weight:900">' + p[0] + '</td><td>' + p[1] + '</td></tr>'; });
  html += '</table></div>';

  // 3秒チェック
  html += secHead('⏱️ 3秒チェック（考えてからタップ）', 'c');
  S.checks.forEach(function(c, i){
    html += '<div class="flip"><div><span class="flip-q">Q' + (i + 1) + '</span>' + c[0] + '</div><button class="flip-btn" data-flip="' + i + '">答えを見る</button><div class="flip-ans" id="flip_' + i + '">→ ' + c[1] + '</div></div>';
  });

  html += '<div class="end-note">📰 発行：きょん＆西村新聞社<br>これは「流れ」をつかむための読み物です。<br>クイズで確かめたいときは、ホームの「歴史」ページへ！<br>' + S.nextNote + '</div>';

  document.getElementById('paperMain').innerHTML = html;

  document.querySelectorAll('.flip-btn[data-flip]').forEach(function(b){
    b.addEventListener('click', function(){
      var a = document.getElementById('flip_' + b.getAttribute('data-flip'));
      var open = a.style.display === 'block';
      a.style.display = open ? 'none' : 'block';
      b.textContent = open ? '答えを見る' : 'かくす';
    });
  });
}
