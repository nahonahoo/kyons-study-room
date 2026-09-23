// ===== キャラクター定義（あはれ！名作くん） =====
var CHARS = {
  meisaku: { name:'名作くん', color:'#3b82f6', initial:'名' },
  sweets:  { name:'スウィーツ', color:'#f472b6', initial:'ス' },
  musubi:  { name:'むすび', color:'#ef4444', initial:'む' },
  nokio:   { name:'ノキオ', color:'#ca8a04', initial:'ノ' },
  boruto:  { name:'ボルト', color:'#22c55e', initial:'ボ' },
  tsurukou:{ name:'つる公', color:'#94a3b8', initial:'つ' },
};

// ===== 6場面（jpn_kobun_basics.html の Section1〜6と対応） =====
var SCENES = [
  {
    title: 'Section 1 対応：もみぢ狩り', section: '歴史的仮名遣い',
    setting: '名作学園の中庭。もみぢ（紅葉）が色づく秋の放課後。',
    lines: [
      { who:'boruto',  classical:'「けふはまことに良き日なり。もみぢの色、あはれなり」' },
      { who:'meisaku',  modern:'ボルト、「まんねん」つけないの珍しいな。でも今の、ちゃんと古文っぽかったよ' },
      { who:'sweets',   classical:'「われはゐなかより来たる男（をとこ）なり」' },
      { who:'meisaku',  modern:'田舎から来たって言いたいのはわかったけど、その笑い方はそのままなんだな…' },
      { who:'musubi',   classical:'「人々、もみぢを美しと言ふ。むすびも然思ふ」' },
      { who:'meisaku',  modern:'むすび、今日はちゃんと喋れてるじゃないか' },
      { who:'nokio',    classical:'「くだらぬことをまうす者どもかな」' },
      { who:'meisaku',  modern:'ノキオ、なんかいつも辛口だな…' },
      { who:'tsurukou', classical:'「わが声（こゑ）を聞きたまへ」' },
      { who:'meisaku',  modern:'つる公、急に叫んでどうしたんだよ' },
    ]
  },
  {
    title: 'Section 2 対応：早朝の教室', section: '古文単語・言い回し',
    setting: '朝早く（つとめて）の教室。まだ誰もいないはずが……。',
    lines: [
      { who:'sweets',   classical:'「つとめて起きて桃太郎の絵を見しかば、いみじうをかしかりき」' },
      { who:'meisaku',  modern:'早起きしてそんなにテンション上がることある！？' },
      { who:'musubi',   classical:'「むすび、やがて驚きぬ。米俵、いとありがたし」' },
      { who:'meisaku',  modern:'それ「感謝」の意味じゃなくて「珍しい」って意味だからな、念のため' },
      { who:'nokio',    classical:'「うつくしき花を見ても、我は何とも思はず」' },
      { who:'meisaku',  modern:'素直じゃないな、ノキオは' },
      { who:'boruto',   classical:'「ゆかしきかな、この学び舎の歴史。ののしりて騒ぐ者どもよ、静まれ」' },
      { who:'meisaku',  modern:'一番「ののしって」るのボルトだと思うけどな' },
      { who:'tsurukou', classical:'「先輩たちのあはれなる話、心にしみ入り候ふ」' },
      { who:'meisaku',  modern:'つる公、そういうところは後輩らしいこと言うんだよな' },
    ]
  },
  {
    title: 'Section 3 対応：放課後の決闘（？）', section: '呼応の副詞',
    setting: '体育館裏。何かの勝負が始まろうとしている。',
    lines: [
      { who:'nokio',    classical:'「我はロボットなれば、涙はつゆこぼれず」' },
      { who:'meisaku',  modern:'さっき花を見て何か感じてたじゃないか' },
      { who:'sweets',   classical:'「桃太郎の心、さらに知らねど、われは慕ふ」' },
      { who:'meisaku',  modern:'知らないのに慕ってるのかよ' },
      { who:'musubi',   classical:'「な、むすびを食らひそ」' },
      { who:'meisaku',  modern:'誰も食べようとしてないだろ、落ち着け' },
      { who:'boruto',   classical:'「よに負けず」' },
      { who:'meisaku',  modern:'何との勝負かは知らないけど、その意気込みだけは伝わるよ' },
      { who:'tsurukou', classical:'「え逃げず、戦ふのみ」' },
      { who:'meisaku',  classical:'「いかで我も名作とならまほし」', modern:'（名作くんも思わず古文でつぶやいてしまう）' },
    ]
  },
  {
    title: 'Section 4 対応：昔語りの時間', section: '過去・完了・打消の基本',
    setting: '教室で、それぞれが自分の「憧れの名作」との出会いを語り出す。',
    lines: [
      { who:'boruto',   classical:'「拙者、あまたの敵を倒したり。ゆゑに『まんねん』と言はれけり」' },
      { who:'meisaku',  modern:'自分で「まんねん」つけてるだけだろ！' },
      { who:'sweets',   classical:'「桃太郎の話を聞きて、涙こぼれぬ」' },
      { who:'meisaku',  modern:'素直な感想でよかったよ' },
      { who:'musubi',   classical:'「昔、米俵より生まれ出でき」' },
      { who:'meisaku',  modern:'むすびの自己紹介、毎回ちょっと壮大なんだよな' },
      { who:'nokio',    classical:'「今日は誰も我に構はず」' },
      { who:'meisaku',  modern:'今まさに構ってるだろ、俺が' },
      { who:'tsurukou', classical:'「先輩がたと出会ひて、我が人生変はりつ」' },
      { who:'meisaku',  classical:'「われ、名作を目指して机に向かえり」', modern:'（つる公の言葉を聞いて、名作くんもふと本音がこぼれる）' },
    ]
  },
  {
    title: 'Section 5 対応：誰が一番の名作か会議', section: '係り結びの法則',
    setting: '昼休み、いつものメンバーで「本当の名作とは何か」の議論が始まる。',
    lines: [
      { who:'sweets',   classical:'「桃太郎ぞ、まことの名作なりける」' },
      { who:'meisaku',  modern:'文末が変わってるのは「ぞ」があるからだよ、みんな' },
      { who:'musubi',   classical:'「米こそ、この世に尊けれ」' },
      { who:'meisaku',  modern:'むすび、それ話が名作からずれてきてるよ' },
      { who:'nokio',    classical:'「我をロボットと思ふ人やある」' },
      { who:'meisaku',  modern:'いや、みんな薄々気づいてると思うよ' },
      { who:'boruto',   classical:'「拙者に勝る者、いづこにかあらむ」' },
      { who:'meisaku',  modern:'反語ってことは「いない」って言いたいんだな、要するに' },
      { who:'tsurukou', classical:'「誰なむ、われより若きパイセンあらむ」' },
      { who:'meisaku',  modern:'それもう先輩後輩の話ですらないだろ！' },
    ]
  },
  {
    title: 'Section 6 対応：学級会ごっこ', section: '主語をつかむ技術（敬語）',
    setting: '国語の授業の劇で、みんなで「先生」が登場する場面を演じることになった。',
    lines: [
      { who:'boruto',   classical:'「先生、教室におはす」', modern:'（ナレーション役のボルトが場面を説明する）' },
      { who:'musubi',   classical:'「生徒ら、先生に手紙をたてまつる」' },
      { who:'meisaku',  modern:'今の「たてまつる」で、手紙を渡す方じゃなくて先生の方が偉いんだって分かるよな' },
      { who:'sweets',   classical:'「先生、『よくできました』とのたまふ」' },
      { who:'meisaku',  modern:'「のたまふ」も先生の動作だから、これも先生が目上ってわかる合図だ' },
      { who:'nokio',    classical:'「われ、先生に真実をまうす」' },
      { who:'meisaku',  modern:'「まうす」は自分がへりくだる言葉だから、これも先生が目上ってこと' },
      { who:'tsurukou', classical:'「先生、われらに褒美をたまふ」' },
      { who:'meisaku',  modern:'よし、これで敬語から主語を見抜く練習は完璧だな！' },
    ]
  },
];

// ===== 現代語訳（解答） =====
var ANSWERS = [
  [
    '今日は本当に良い日だ。もみじの色は、しみじみと趣深い。',
    '私は田舎からやって来た男だ。',
    '人々は、もみじを美しいと言う。むすびもそう思う。',
    'くだらないことを言う者たちだなあ。',
    '私の声を聞いてください。',
  ],
  [
    '早朝に起きて桃太郎の絵を見たところ、たいそう趣深かった。',
    'むすびはすぐに気づいた。米俵は、とても珍しい（貴重だ）。',
    'かわいらしい花を見ても、俺は何とも思わない。',
    '見てみたい（心惹かれる）ものだなあ、この学び舎の歴史は。大声で騒ぐ者たちよ、静まれ。',
    '先輩たちのしみじみとした話に、心が染み入ります。',
  ],
  [
    '俺はロボットだから、涙は少しもこぼれない。',
    '桃太郎の心はまったく知らないけれど、私は慕う。',
    'むすびを食べるな。',
    '決して負けない。',
    '逃げることはできない、戦うのみだ。',
    'どうにかして自分も名作になりたいものだ。',
  ],
  [
    '拙者は多くの敵を倒した。それゆえに「まんねん」と言われてきた。',
    '桃太郎の話を聞いて、涙がこぼれてしまった。',
    '昔、米俵から生まれ出た。',
    '今日は誰も俺に構わない。',
    '先輩たちと出会って、俺の人生は変わってしまった。',
    '俺は、名作を目指して机に向かっている。',
  ],
  [
    '桃太郎こそ、本当の名作なのだった。',
    '米こそ、この世で尊いのだ。',
    '俺をロボットと思う人はいるだろうか（いや、いないかもしれない）。',
    '拙者に勝る者は、どこにいるだろうか（いや、どこにもいない）。',
    '誰が私より若い先輩だろうか（いや、いない）。',
  ],
  [
    '先生が教室にいらっしゃる。',
    '生徒たちは先生に手紙を差し上げる。',
    '先生は「よくできました」とおっしゃる。',
    '私は先生に真実を申し上げる。',
    '先生は私たちにご褒美をくださる。',
  ],
];

function renderScene(scene, idx) {
  var html = '<div class="scene-box">'
    + '<div class="scene-num">場面 ' + (idx+1) + ' ／ ' + scene.section + '</div>'
    + '<div class="scene-title">' + scene.title + '</div>'
    + '<div class="scene-setting">📍 ' + scene.setting + '</div>';

  scene.lines.forEach(function(line) {
    var c = CHARS[line.who];
    html += '<div class="konto-line">'
      + '<div class="konto-avatar" style="background:' + c.color + '">' + c.initial + '</div>'
      + '<div class="konto-body">'
      + '<div class="konto-speaker">' + c.name + '</div>';
    if (line.classical) {
      html += '<div class="konto-classical">' + line.classical + '</div>'
        + '<div class="konto-blank"></div>'
        + '<div class="konto-blank-label">↑ 現代語訳をここに書く</div>';
      if (line.modern) html += '<div class="konto-modern">' + line.modern + '</div>';
    } else if (line.modern) {
      html += '<div class="konto-modern">' + line.modern + '</div>';
    }
    html += '</div></div>';
  });

  html += '</div>';
  return html;
}

function renderAnswerKey() {
  var html = '<div class="answer-key-section" id="answerKey">'
    + '<div class="answer-key-title">📖 解答（現代語訳）— 保護者の方の丸つけ用</div>';
  SCENES.forEach(function(scene, i) {
    html += '<div style="margin-bottom:20px">'
      + '<div style="font-size:13px;color:var(--purple);font-weight:bold;margin-bottom:8px">場面' + (i+1) + '：' + scene.title + '</div>';
    var classicalLines = scene.lines.filter(function(l){ return l.classical; });
    classicalLines.forEach(function(line, j) {
      var c = CHARS[line.who];
      html += '<div class="answer-line">'
        + '<span class="a-classical">' + c.name + '「' + line.classical.replace(/[「」]/g,'') + '」</span><br>'
        + '<span class="a-modern">→ ' + (ANSWERS[i][j] || '') + '</span>'
        + '</div>';
    });
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function render() {
  var html = '';
  html += '<div class="ref-intro">🎭 「あはれ！名作くん」の名作学園を舞台にした、オリジナルの古文コント台本。全6場面は、古文基礎ページのSection 1〜6にそれぞれ対応している。<strong style="color:var(--gold)">名作くんの現代語のセリフ</strong>はヒント・合いの手として読み、<strong style="color:var(--gold)">それ以外のキャラの古文セリフ</strong>を1つずつ現代語訳してみよう。プリントアウトして書き込んで使うのがおすすめ。</div>';

  SCENES.forEach(function(scene, i) {
    html += renderScene(scene, i);
  });

  html += '<div class="ref-actions">'
    + '<button class="print-btn" id="printBtn">🖨️ 印刷して書き込む</button>'
    + '<button class="toggle-answer-btn" id="toggleAnswerBtn">📖 解答を見る（保護者用）</button>'
    + '<a class="back-link" href="jpn_kobun_basics.html">← 古文基礎にもどる</a>'
    + '</div>';

  html += '<div id="answerKeyWrap" style="display:none">' + renderAnswerKey() + '</div>';

  document.getElementById('refMain').innerHTML = html;

  var pb = document.getElementById('printBtn');
  if (pb) pb.addEventListener('click', function() { window.print(); });

  var tb = document.getElementById('toggleAnswerBtn');
  var wrap = document.getElementById('answerKeyWrap');
  if (tb && wrap) {
    tb.addEventListener('click', function() {
      var showing = wrap.style.display !== 'none';
      wrap.style.display = showing ? 'none' : 'block';
      tb.textContent = showing ? '📖 解答を見る（保護者用）' : '🙈 解答を隠す';
      if (!showing) wrap.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  }
}

render();
