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
  { key:'kenpo',   label:'⑫ 憲法',    href:'soc_story_kenpo.html' },
  { key:'nichiro', label:'⑬ 日清・日露', href:'soc_story_nichiro.html' },
  { key:'meijibunka',label:'⑭ 明治の文化', href:'soc_story_meijibunka.html' },
  { key:'taisen1', label:'⑮ 第一次大戦', href:'soc_story_taisen1.html' },
  { key:'taisho',  label:'⑯ 大正デモクラシー', href:'soc_story_taisho.html' },
  { key:'showa1',  label:'⑰ 戦争への道', href:'soc_story_showa1.html' },
  { key:'taisen2', label:'⑱ 第二次大戦', href:'soc_story_taisen2.html' },
  { key:'postwar', label:'📰 戦後日本', href:'soc_history_story.html' }
];

// 会話のキャラ（口調ルールが確定しているメンバーのみ）
var CAST = {
  kyon:   { name:'きょん',          av:'😄' },
  nishi:  { name:'西村',            av:'慶' },
  shun:   { name:'なかむらしゅん',  av:'🎭' },   // 9番街レトロ・ツッコミ。大阪出身の関西弁。きょんには「きょんさん」＋です・ます＋関西弁（ほんまに・〜やと思います・できひん）。僕。ひょうきんで熱い。相方は「京極」。賭け事ネタは本人が「言うたらあかん」と止める自虐の形だけOK
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
  nishida:{ name:'ニシダ（ラランド）', av:'📚' },             // ツッコミ。僕。相方は「サーヤさん」。読書家・小説も書く。ひねくれた理屈と自虐。遅刻ネタまで（生活面のクズエピソードは使わない）
  // 2026-10-14 追加（4本の並列調査で確認。詳細ルールは CLAUDE-rpg.md）
  // 板橋ハウス（NSC東京22期の同期3人。きょんの5期後輩 →「きょんさん」＋敬語。3人どうしは名字の呼び捨て・タメ口。ボケ/ツッコミを「攻撃/防御」と言う）
  yoshino:  { name:'吉野（板橋ハウス）',   av:'🦊' },  // めぞんのボケ。北九州出身だが基本標準語（たまに「〜んや」）。僕。熱い自信と自虐、「圧勝！」。企画を言い出す、かまってちゃん。アニメ好き
  tsurumaru:{ name:'つるまる（板橋ハウス）', av:'🧤' }, // 軟水のツッコミ。大阪・堺の関西弁（なんでやねん・〜へん・ちゃう）。僕。何にでも乗っかるマスコット。GK・フリースタイルラップ
  takeuchi: { name:'竹内（板橋ハウス）',   av:'🥤' },  // ピュートのツッコミ。愛知・名古屋出身（名古屋弁は使わない）。僕。短く冷静に落とす「防御・フィニッシャー」。健康オタク（豆乳に青汁）
  // 空気階段（NSC東京17期＝きょん・西村の同期 → タメ口・呼び捨て。方言なし）
  mogura:   { name:'もぐら（空気階段）',   av:'♟️' },  // 俺。だらっとした標準語「〜じゃん」「〜なのよ」。かしこまると「〜でございます」。人のいい兄貴分。将棋アマ2段。借金・ギャンブル・酒・離婚の話は一切使わない（自虐ネタの形でも不可）
  katamari: { name:'かたまり（空気階段）', av:'⚽' },  // 俺/僕。言い切るツッコミ「なんでだよ」、説明は理屈っぽく丁寧。まじめで心配性。慶應法学部中退。欧州サッカー・血液型当て・テトリス。相方は「もぐら」
  // ドンデコルテ（渡辺＝NSC東京14期＝きょんの先輩、小橋＝19期＝後輩。方言なし）
  watanabe: { name:'渡辺（ドンデコルテ）', av:'🪀' },  // 演説モードは一人称「私」：「いいですか皆さん」「お答えしましょう」と、どうでもいい理屈を格調高く言い切る。素は「僕」で丁寧。国文学科卒・けん玉。きょんからは「渡辺さん」。相方は「小橋」
  kobashi:  { name:'小橋（ドンデコルテ）', av:'💪' },  // 僕。やわらかい「〜ですね」、ツッコミは「〜じゃねーかよ！」。沖縄出身だが方言なし。相方は「ナベさん」。筋トレ・英語を猛勉強した過去。きょんには「きょんさん」＋敬語
  // レインボー（NSC東京18期＝きょんの1期後輩。ジャンボは「きょんさんは一番仲が良い先輩」と公言）
  jumbo:    { name:'ジャンボたかお（レインボー）', av:'🍱' }, // 俺/僕。標準語「マジで」「めちゃくちゃ」。熱くて涙もろい。きょんに甘える敬語。國學院アナウンス研究会会長・小説家・大食い
  ikeda:    { name:'池田（レインボー）',   av:'💄' },  // 俺/僕。標準語ベースにときどき関西弁（〜やん・めっちゃ）。器用、美容（化粧品検定1級）、元子役、将棋・ポケモン。きょん・西村とは吉本坂46 REDの仲間
  // なすなかにし（松竹芸能・いとこ同士・2001年結成の大先輩 → きょんは「那須さん」「中西さん」＋敬語。関西弁）
  nasu:     { name:'那須（なすなかにし）', av:'🐶' },  // ツッコミ。僕。やわらかい関西弁。犬好き・歌好き。2人同時の「シンクロツッコミ」。病気・滑舌・音程の話は使わない
  nakanishi:{ name:'中西（なすなかにし）', av:'🖍️' }, // ボケ・ネタ作り。僕。はっきりした関西弁。相方は「那須くん」（大好き）。仏像鑑賞・イラスト・介護福祉士
  // 元うしろシティ（松竹→2022年解散。芸歴・年齢ともきょんの先輩 → きょんは「阿諏訪さん」「金子さん」。標準語。解散・休養の話は使わない）
  asuwa:    { name:'阿諏訪（元うしろシティ）', av:'🏕️' }, // 僕/俺「〜っすよね」「〜なぁ」。ひとり好きの職人肌、料理とキャンプで急に饒舌。相方は「金子」
  kaneko:   { name:'金子（元うしろシティ）', av:'🧶' }   // 僕/俺「〜じゃん」「〜もんな」。淡々と変な角度の質問でいじる。新潟・津南町の豪雪地帯、遺跡発掘バイト、ヘヴィメタル編み物世界選手権で優勝
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
    if(s.extra) html += '<div class="clip-extra">' + s.extra + '</div>';   // 比較表など（任意）
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
