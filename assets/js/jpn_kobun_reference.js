// ===== 古文まとめ（jpn_kobun_reference.html）=====
// クイズなしの一覧・辞書リファレンス。XP/弱点DBとは非連携。

// ----- ① 重要古語60（グループごとに区切り線） -----
var KOGO60 = [
  { n:1,  w:'うつくし',     m:'かわいい・いとおしい・立派だ' },
  { n:2,  w:'おどろく',     m:'目が覚める・はっと気づく' },
  { n:3,  w:'いと',         m:'たいそう・非常に' },
  { n:4,  w:'つゆ（〜打消）', m:'まったく（〜ない）・少しも（〜ない）' },
  { n:5,  w:'ふみ',         m:'手紙・書物・学問' },
  { n:6,  w:'けしき',       m:'様子・景色' },
  { n:7,  w:'つきづきし',   m:'似つかわしい・ふさわしい' },
  { n:8,  w:'いとほし',     m:'かわいそうだ・気の毒だ・いやだ' },
  { n:9,  w:'らうたし',     m:'かわいらしい' },
  { n:10, w:'あした',       m:'朝・翌朝' },
  { n:11, w:'をかし',       m:'趣がある・すばらしい・こっけいだ' },
  { n:12, w:'あはれなり',   m:'しみじみと趣深い・心動かされる・悲しい' },
  { n:13, w:'つれづれなり', m:'退屈だ・手持ちぶさただ' },
  { n:14, w:'つとめて',     m:'早朝' },
  { n:15, w:'かなし',       m:'かわいい・いとしい', gEnd:true },

  { n:16, w:'ののしる',     m:'大声で騒ぐ・評判になる' },
  { n:17, w:'あさまし',     m:'驚きあきれる・意外だ' },
  { n:18, w:'ありがたし',   m:'めったにない・すばらしい' },
  { n:19, w:'やがて',       m:'すぐに・そのまま' },
  { n:20, w:'こころにくし', m:'心ひかれる・奥ゆかしい' },
  { n:21, w:'としごろ',     m:'長年・数年来' },
  { n:22, w:'いたづらなり', m:'むだだ・ひまだ（いたづらになる＝死ぬ）' },
  { n:23, w:'やうやう',     m:'だんだん・しだいに' },
  { n:24, w:'はづかし',     m:'こちらが恥ずかしくなるほど立派だ・気詰まりだ' },
  { n:25, w:'うたてし',     m:'いやだ・情けない・嘆かわしい' },
  { n:26, w:'さうざうし',   m:'もの足りない' },
  { n:27, w:'べからず',     m:'〜してはいけない（禁止）' },
  { n:28, w:'ゆかし',       m:'心ひかれる・見たい・知りたい・聞きたい' },
  { n:29, w:'うしろやすし', m:'安心だ' },
  { n:30, w:'さらに（〜打消）', m:'まったく（〜ない）・決して（〜ない）', gEnd:true },

  { n:31, w:'さらなり',     m:'言うまでもない' },
  { n:32, w:'うしろめたし', m:'気がかりだ・不安だ' },
  { n:33, w:'ねんごろなり', m:'心がこもっている・親切だ' },
  { n:34, w:'え〜（打消）', m:'〜できない' },
  { n:35, w:'えもいはず',   m:'何とも言いようがない（すばらしい）' },
  { n:36, w:'なかなか',     m:'かえって・むしろ' },
  { n:37, w:'すさまじ',     m:'興ざめだ' },
  { n:38, w:'さすがに',     m:'そうはいってもやはり' },
  { n:39, w:'わろし',       m:'よくない' },
  { n:40, w:'かしづく',     m:'大切に育てる' },
  { n:41, w:'さはる',       m:'差し支える・じゃまが入る' },
  { n:42, w:'にほふ',       m:'色美しく映える・つやつやと美しい' },
  { n:43, w:'わたる',       m:'一面に〜する・（年月が）過ぎる' },
  { n:44, w:'わぶ',         m:'思い悩む・困る' },
  { n:45, w:'あいなし',     m:'つまらない・気に入らない・理由もない', gEnd:true },

  { n:46, w:'いたし',       m:'程度がはなはだしい' },
  { n:47, w:'いみじ',       m:'はなはだしい（よくも悪くも程度が大きい）' },
  { n:48, w:'いやし',       m:'身分が低い・みすぼらしい' },
  { n:49, w:'おぼつかなし', m:'はっきりしない・気がかりだ' },
  { n:50, w:'かしこし',     m:'恐れ多い・優れている・利口だ' },
  { n:51, w:'なまめかし',   m:'若々しく美しい・上品で優美だ' },
  { n:52, w:'むつかし',     m:'わずらわしい・うっとうしい・不快だ' },
  { n:53, w:'めづらし',     m:'すばらしい・目新しい' },
  { n:54, w:'やむごとなし', m:'高貴だ・格別だ・捨てておけない' },
  { n:55, w:'わりなし',     m:'道理に合わない・どうしようもない・程度がはなはだしい' },
  { n:56, w:'あてなり',     m:'高貴だ・上品だ' },
  { n:57, w:'すずろなり',   m:'なんとなく・むやみに・思いがけず' },
  { n:58, w:'げに',         m:'本当に・なるほど' },
  { n:59, w:'なのめなり',   m:'いいかげんだ・普通だ' },
  { n:60, w:'むげなり',     m:'ひどい・はなはだしい' },
];

// ----- ② 助動詞9個 -----
// dog: 品詞早見表の「あの犬」を使った例文（助動詞の意味ごとの違いを1匹の犬で見比べられるようにする）
var JODOSHI = [
  { w:'き',    m:'過去', ex:[{c:'読まんとしき', j:'読もうとした'}],
    dog:[{c:'犬、歩みき。', j:'犬が歩いた。'}] },
  { w:'けり',  m:'過去（詠嘆）', ex:[{c:'植ゑけり', j:'植えた'},{c:'をかしかりけり', j:'おもしろかった'}],
    dog:[{c:'犬、静かなりけり。', j:'犬は静かだったのだなあ。'}] },
  { w:'つ・ぬ', m:'完了', ex:[{c:'植ゑぬ', j:'植えてしまった'}],
    dog:[{c:'犬、歩みぬ。', j:'犬が歩いてしまった。'}] },
  { w:'る・らる', m:'受身・可能・自発・尊敬の4つ', ex:[
      {c:'人に命令せらる', j:'（受身）人に命令される'},
      {c:'入れられず', j:'（可能）入れることができない'},
      {c:'思ひやらる', j:'（自発）自然と思いやられる'},
      {c:'帰られけり', j:'（尊敬）帰りなさった'}
    ], note:'見分け方：直前の動詞や文脈から判断する。心情を表す動詞（思ふ・偲ぶ等）につくと自発になりやすい。',
    dog:[
      {c:'犬に吠えられる。', j:'（受身）犬に吠えられる。'},
      {c:'犬を止められず。', j:'（可能）犬を止めることができない。'},
      {c:'犬のことが思ひやらる。', j:'（自発）犬のことが自然と思いやられる。'},
      {c:'お犬様、歩まれけり。', j:'（尊敬）お犬様が歩きなさった。'}
    ] },
  { w:'す・さす', m:'使役', ex:[{c:'植ゑさす', j:'植えさせる'}],
    dog:[{c:'犬を歩かす。', j:'犬を歩かせる。'}] },
  { w:'む',    m:'推量・意志', ex:[{c:'植ゑむ', j:'植えるだろう'},{c:'をかしからむ', j:'おもしろいだろう'}],
    dog:[{c:'犬、歩まむ。', j:'犬は歩くだろう。'}] },
  { w:'ず',    m:'打消', ex:[{c:'植ゑず', j:'植えない'},{c:'をかしからず', j:'おもしろくない'}], note:'連体形は「ぬ」になる（例：植ゑぬ人）。「ぬ」＝打消の連体形か、完了の「ぬ」かは文脈で見分ける。',
    dog:[{c:'犬、歩まず。', j:'犬は歩かない。'}] },
  { w:'なり',  m:'断定', ex:[{c:'行くなり', j:'行くのである'},{c:'中納言なり', j:'中納言だ'}],
    dog:[{c:'これぞ、かの犬なり。', j:'これがあの犬だ。'}] },
];

// ----- ③ 助詞6個 -----
var JOSHI = [
  { w:'かな', m:'詠嘆', ex:{c:'雨降るかな', j:'雨が降るなあ'},
    dog:{c:'お犬様、静かなるかな。', j:'お犬様は、静かだなあ。'} },
  { w:'な',   m:'禁止', ex:{c:'行くな', j:'行ってはいけない'},
    dog:{c:'歩くな。', j:'歩いてはいけない。'} },
  { w:'て',   m:'単純接続', ex:{c:'雨降りて', j:'雨が降って'},
    dog:{c:'犬、静かにて、歩まず。', j:'犬は静かで、歩かない。'} },
  { w:'ども', m:'逆接', ex:{c:'雨降れども', j:'雨が降るけれども'},
    dog:{c:'犬、静かなれども、歩まず。', j:'犬は静かだけれど、歩かない。'} },
  { w:'ば',   m:'未然形＋ば＝仮定／已然形＋ば＝確定', ex:{c:'雨降らば（仮定）／雨降れば（確定）', j:'もし雨が降ったら／雨が降るので'},
    dog:{c:'犬歩まば（仮定）／犬静かなれば（確定）', j:'もし犬が歩いたら／犬が静かなので'} },
  { w:'の',   m:'主格「〜が」／連体修飾格「〜の」', ex:{c:'雪の降る山（主格）／高き雪の山（連体修飾格）', j:'雪が降る山／高い雪の山'},
    dog:{c:'犬の歩む道（主格）／かの犬の声（連体修飾格）', j:'犬が歩く道／あの犬の声'} },
];

// ----- ④ 係り結び -----
var KAKARI_SVG = '<svg viewBox="0 0 340 210" style="width:100%;max-width:380px;display:block;margin:0 auto">'
  + '<rect x="10" y="10" width="320" height="52" rx="10" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
  + '<text x="170" y="32" fill="#a371f7" font-size="13" text-anchor="middle" font-weight="bold">ぞ・なむ・や・か</text>'
  + '<text x="170" y="50" fill="#8b949e" font-size="11" text-anchor="middle">文末は「連体形」で結ぶ（強調／疑問・反語）</text>'
  + '<rect x="10" y="76" width="320" height="52" rx="10" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
  + '<text x="170" y="98" fill="#f5c518" font-size="13" text-anchor="middle" font-weight="bold">こそ</text>'
  + '<text x="170" y="116" fill="#8b949e" font-size="11" text-anchor="middle">文末は「已然形」で結ぶ（強調・最強）</text>'
  + '<rect x="10" y="142" width="320" height="60" rx="10" fill="rgba(233,69,96,0.08)" stroke="#e94560" stroke-width="1.5"/>'
  + '<text x="170" y="162" fill="#e94560" font-size="11" text-anchor="middle">強調の強さ：こそ（已然形）＞ぞ・なむ（連体形）</text>'
  + '<text x="170" y="180" fill="#8b949e" font-size="10" text-anchor="middle">や・かは「疑問・反語」→前後の文脈で判断する</text>'
  + '<text x="170" y="196" fill="#8b949e" font-size="10" text-anchor="middle">現代語訳では係り結び自体は訳さないことが多い</text>'
  + '</svg>';

// 品詞早見表の例文「あの大きい犬はとても静かだ。」を古文ふうにして係り結びで変化させる
var KAKARI_EXAMPLES = [
  { p:'（なし）', cls:'かの犬、いと静かなり。', j:'あの犬は、とても静かだ。',       musubi:'終止形「なり」', note:'ふつうの文（強調も疑問もない）' },
  { p:'ぞ',       cls:'かの犬ぞ、いと静かなる。', j:'あの犬が、とても静かなのだ。',   musubi:'連体形「なる」', note:'強調' },
  { p:'なむ',     cls:'かの犬なむ、いと静かなる。', j:'あの犬が、とても静かなのだ。', musubi:'連体形「なる」', note:'強調（ぞよりやや穏やか）' },
  { p:'や',       cls:'かの犬や、いと静かなる。', j:'あの犬は、とても静かなのだろうか。', musubi:'連体形「なる」', note:'疑問' },
  { p:'か',       cls:'かの犬か、いと静かなる。', j:'あの犬は、とても静かなのだろうか。', musubi:'連体形「なる」', note:'疑問' },
  { p:'こそ',     cls:'かの犬こそ、いと静かなれ。', j:'あの犬こそ、とても静かなのだ。', musubi:'已然形「なれ」', note:'強調（いちばん強い）' },
];

function renderKakariExamples() {
  var rows = KAKARI_EXAMPLES.map(function(e) {
    return '<tr>'
      + '<td class="kobu-word">' + e.p + '</td>'
      + '<td>' + e.cls + '</td>'
      + '<td style="color:#8b949e;font-size:13px;">' + e.j + '</td>'
      + '<td style="font-size:13px;">' + e.musubi + '</td>'
      + '<td style="font-size:13px;color:var(--gold);">' + e.note + '</td>'
      + '</tr>';
  }).join('');
  return '<div class="acc-lead">🔖 品詞早見表の例文「あの大きい犬はとても静かだ。」を古文ふうにして、係り結びで文がどう変わるか見比べてみよう。「かの」＝「あの」（指示語のセクション参照）。</div>'
    + '<div class="kobu-table-wrap"><table class="kobu-table">'
    + '<thead><tr><th>係助詞</th><th>文</th><th>現代語訳</th><th>結びの活用形</th><th>ニュアンス</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>'
    + '<div class="acc-lead" style="margin-top:8px;">「静かなり」の活用：終止形＝なり／連体形＝なる／已然形＝なれ。文中に係助詞があると、この活用形が変わるのが係り結び。</div>';
}

// ----- ⑤ 敬語 -----
var KEIGO = {
  sonkei: { title:'尊敬語（相手の動作を敬って表現する）', color:'#f5c518', items:[
    { w:'のたまふ・のたまはす・仰す', m:'言う' },
    { w:'召す・奉る', m:'食べる' },
    { w:'思す・思し召す', m:'思う' },
    { w:'おはす・おはします', m:'いる・行く・来る' },
  ]},
  kenjo: { title:'謙譲語（自分の動作をへりくだって相手を敬う）', color:'#3fb950', items:[
    { w:'申す・聞こゆ', m:'言う' },
    { w:'差し上げる', m:'与える' },
    { w:'参る・奉る', m:'参上する' },
  ]},
  teinei: { title:'丁寧語（話しの聞き手にていねいな表現をする）', color:'#0ea5e9', items:[
    { w:'侍り・候ふ', m:'あります' },
  ]},
};

// ----- ⑥ 主語のとらえ方（4ステップ） -----
var SUBJECT_SVG = '<svg viewBox="0 0 340 260" style="width:100%;max-width:380px;display:block;margin:0 auto">'
  + '<rect x="10" y="10" width="320" height="46" rx="8" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
  + '<text x="170" y="32" fill="#a371f7" font-size="11" text-anchor="middle">① 文章に出てくる登場人物をすべて把握する</text>'
  + '<text x="170" y="46" fill="#8b949e" font-size="9" text-anchor="middle">誰が出てくるかをまず整理する</text>'
  + '<path d="M 170,56 L 170,72" stroke="#8b949e" stroke-width="2" marker-end="url(#sArrow)"/>'
  + '<rect x="10" y="74" width="320" height="46" rx="8" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="170" y="96" fill="#0ea5e9" font-size="11" text-anchor="middle">② 動詞を抜き出し、誰の動作か見当をつける</text>'
  + '<text x="170" y="110" fill="#8b949e" font-size="9" text-anchor="middle">主語は現代文より省略が多いので注意</text>'
  + '<path d="M 170,120 L 170,136" stroke="#8b949e" stroke-width="2" marker-end="url(#sArrow)"/>'
  + '<rect x="10" y="138" width="320" height="46" rx="8" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
  + '<text x="170" y="160" fill="#f5c518" font-size="11" text-anchor="middle">③ 文章の流れから、直前の人物と動作を結びつける</text>'
  + '<text x="170" y="174" fill="#8b949e" font-size="9" text-anchor="middle">主語が省略されている場合は直前に登場した人物</text>'
  + '<path d="M 170,184 L 170,200" stroke="#8b949e" stroke-width="2" marker-end="url(#sArrow)"/>'
  + '<rect x="10" y="202" width="320" height="52" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
  + '<text x="170" y="222" fill="#3fb950" font-size="11" text-anchor="middle">④ 敬語があれば、敬意の対象＝身分の高い人物と特定</text>'
  + '<text x="170" y="238" fill="#8b949e" font-size="9" text-anchor="middle">主な尊敬語：おはす・おほす・召す・給ふ・のたまふ</text>'
  + '<text x="170" y="250" fill="#8b949e" font-size="9" text-anchor="middle">ごらんず</text>'
  + '<defs><marker id="sArrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#8b949e"/></marker></defs>'
  + '</svg>';

// ----- ⑦ 古文の指示語（こそあど） -----
var SHIJIGO = [
  { w:'こ（この・これ）', m:'話し手の側にある事物を指す', dog:'この犬' },
  { w:'そ（その・それ）', m:'話し手からやや離れた事物・場所・人などを指す', dog:'その犬' },
  { w:'あ（あの・あれ）', m:'遠くに離れた事物を指す', dog:'あの犬（品詞早見表の例文そのもの！）' },
  { w:'か（かの・かれ）', m:'話し手から遠く離れた事物を指す（「あ」とほぼ同じ）', dog:'かの犬（この古文まとめの中で使っているのはこれ）' },
  { w:'さ（さように）',   m:'目の前の物事や前に述べた内容を指して「そのように・そう」の意味', dog:'犬、さように鳴けり。→ 犬はそのように鳴いた。' },
  { w:'しか（しかように）', m:'前に述べた内容を指して「そのように・そう・このように」の意味（主に漢文の書き下し文）', dog:'犬、しか鳴けり。→ 犬はそのように鳴いた。' },
];

// ----- ⑧ 解法テクニック -----
var TECH = {
  setsuzoku: [
    { type:'順接', color:'#3fb950', w:'されば', m:'だから・そうだから' },
    { type:'逆接', color:'#e94560', w:'されど', m:'そうであるが・しかし' },
  ],
};

// ----- ⑨ 原文で読む -----
var MAKURA = {
  title:'枕草子（清少納言・随筆・平安時代）',
  paras:[
    { season:'春', cls:'春はあけぼの。やうやう白くなりゆく山ぎは、すこしあかりて、紫だちたる雲のほそくたなびきたる。',
      j:'春は明け方（が良い）。だんだんと白くなっていく山際が、少し明るくなって、紫がかった雲が細くたなびいている（のが良い）。' },
    { season:'夏', cls:'夏は夜。月のころはさらなり、闇もなほ、蛍の多く飛びちがひたる。また、ただ一つ二つなど、ほのかにうち光りて行くもをかし。雨など降るもをかし。',
      j:'夏は夜（が良い）。月の出ているころは言うまでもなく、闇夜であってもやはり、蛍がたくさん飛び交っている（のが良い）。また、ほんの一匹二匹などがほのかに光って飛んでいくのも趣がある。雨などが降るのも趣がある。' },
    { season:'秋', cls:'秋は夕暮れ。夕日のさして山の端いと近うなりたるに、烏の寝どころへ行くとて、三つ四つ、二つ三つなど、飛びいそぐさへあはれなり。まいて雁などのつらねたるが、いと小さく見ゆるは、いとをかし。日入りはてて、風の音、虫の音など、はたいふべきにあらず。',
      j:'秋は夕暮れ（が良い）。夕日が差して山の端にとても近くなっているときに、烏がねぐらへ帰ろうとして三羽四羽、二羽三羽と急いで飛んでいくのさえしみじみとした趣がある。まして雁などが列を作っているのが、とても小さく見えるのは、たいそう趣がある。日がすっかり沈んで、風の音や虫の音などは、言うまでもなくすばらしい。' },
    { season:'冬', cls:'冬はつとめて。雪の降りたるは言ふまでもなく、霜のいと白きも、またさらでもいと寒きに、火など急ぎおこして、炭もて渡るもいとつきづきし。昼になりて、ぬるくゆるびもていけば、火桶の火も白き灰がちになりてわろし。',
      j:'冬は早朝（が良い）。雪が降っているのは言うまでもなく、霜がとても白いのも、またそうでなくてもとても寒いときに、火などを急いでおこして、炭を持って渡っていくのもとても似つかわしい。昼になって、寒さがだんだんゆるんでいけば、火桶の火も白い灰ばかりになってよくない。' },
  ]
};
var TSUREZURE = {
  title:'徒然草 第52段「仁和寺にある法師」（兼好法師・随筆・鎌倉時代）',
  cls:'仁和寺にある法師、年寄るまで石清水を拝まざりければ、心憂く覚えて、あるとき思ひ立ちて、ただ一人、徒歩より詣でけり。極楽寺・高良などを拝みて、かばかりと心得て帰りにけり。'
    + '<br>さて、かたへの人にあひて、「年ごろ思ひつること、果たしはべりぬ。聞きしにも過ぎて、尊くこそおはしけれ。そも、参りたる人ごとに山へ登りしは、何事かありけん、ゆかしかりしかど、神へ参るこそ本意なれと思ひて、山までは見ず」とぞ言ひける。'
    + '<br>少しのことにも、先達はあらまほしきことなり。',
  j:'仁和寺にいたある法師は、年をとるまで石清水八幡宮を参拝したことがなかったので、残念に思って、あるとき思い立って、たった一人で徒歩で参詣した。極楽寺・高良神社などを拝んで、これだけのものと思い込んで帰ってしまった。'
    + '<br>さて、仲間に会って、「長年思っていたことを果たしました。聞いていた以上に、尊くいらっしゃいました。そもそも、参拝に来た人がみな山へ登っていったのは、何事があったのだろうか、知りたかったけれど、神様を参拝することこそが本来の目的だと思って、山までは見ませんでした」と言った。'
    + '<br>少しのことでも、案内人はあってほしいものです。'
};

// ----- ⑩ 各時代の代表作品 -----
var BUNGAKUSHI = [
  { era:'奈良', color:'#f59e0b', works:[
    { title:'古事記', author:'太安万侶' },
    { title:'日本書紀', author:'舎人親王ら' },
    { title:'万葉集', author:'大伴家持ら（日本最古の和歌集）' },
  ]},
  { era:'平安', color:'#8b8b8b', works:[
    { title:'竹取物語', author:'不明（かぐや姫の物語）' },
    { title:'土佐日記', author:'紀貫之' },
    { title:'古今和歌集', author:'紀貫之ら（醍醐天皇の命令で編集）' },
    { title:'源氏物語', author:'紫式部' },
    { title:'枕草子', author:'清少納言' },
  ]},
  { era:'鎌倉', color:'#84cc16', works:[
    { title:'方丈記', author:'鴨長明' },
    { title:'徒然草', author:'兼好法師' },
    { title:'平家物語', author:'不明（琵琶法師の語りで広まった軍記物）' },
    { title:'新古今和歌集', author:'藤原定家ら（後鳥羽上皇の命令で編集）' },
  ]},
  { era:'江戸', color:'#f97316', works:[
    { title:'おくのほそ道', author:'松尾芭蕉' },
    { title:'世間胸算用', author:'井原西鶴' },
    { title:'南総里見八犬伝', author:'滝沢馬琴' },
  ]},
];

// ----- ⑪ 月の異名 -----
var TSUKI = [
  { n:1,  name:'睦月',   kana:'むつき' },
  { n:2,  name:'如月',   kana:'きさらぎ' },
  { n:3,  name:'弥生',   kana:'やよい' },
  { n:4,  name:'卯月',   kana:'うづき' },
  { n:5,  name:'皐月',   kana:'さつき' },
  { n:6,  name:'水無月', kana:'みなづき' },
  { n:7,  name:'文月',   kana:'ふみづき（ふづき）' },
  { n:8,  name:'葉月',   kana:'はづき' },
  { n:9,  name:'長月',   kana:'ながつき' },
  { n:10, name:'神無月', kana:'かんなづき' },
  { n:11, name:'霜月',   kana:'しもつき' },
  { n:12, name:'師走',   kana:'しはす' },
];

// ===================== レンダリング =====================

function renderKogoTable() {
  var rows = '';
  KOGO60.forEach(function(item) {
    rows += '<tr' + (item.gEnd ? ' class="group-divider"' : '') + ' data-word="' + item.w + '" data-mean="' + item.m + '">'
      + '<td style="width:36px;color:#8b949e;font-size:12px;">' + item.n + '</td>'
      + '<td class="kobu-word">' + item.w + '</td>'
      + '<td>' + item.m + '</td>'
      + '</tr>';
  });
  return '<input type="text" class="search-box" id="kogoSearch" placeholder="🔍 古語や意味で検索（例：をかし／かわいい）">'
    + '<div class="kobu-table-wrap"><table class="kobu-table" id="kogoTable">'
    + '<thead><tr><th>No.</th><th>古語</th><th>意味</th></tr></thead>'
    + '<tbody id="kogoTableBody">' + rows + '</tbody>'
    + '</table></div>'
    + '<div class="search-empty" id="kogoEmpty">見つからなかったよ。別のことばで検索してみよう。</div>';
}

function renderJodoshiTable() {
  var rows = '';
  JODOSHI.forEach(function(item) {
    var exHtml = item.ex.map(function(e) { return '<div>' + e.c + ' → ' + e.j + '</div>'; }).join('');
    var dogHtml = item.dog ? '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);">'
      + item.dog.map(function(e) { return '<div>🐕 ' + e.c + ' → ' + e.j + '</div>'; }).join('') + '</div>' : '';
    rows += '<tr>'
      + '<td class="kobu-word">' + item.w + '</td>'
      + '<td>' + item.m + '</td>'
      + '<td style="font-size:13px;color:#8b949e;">' + exHtml + dogHtml + (item.note ? '<div style="margin-top:6px;color:var(--teal);font-size:12px;">💡 ' + item.note + '</div>' : '') + '</td>'
      + '</tr>';
  });
  return '<div class="acc-lead">🐕 印は品詞早見表の「あの犬」を使った例文。同じ犬で助動詞ごとの意味の違いを見比べられる。</div>'
    + '<div class="kobu-table-wrap"><table class="kobu-table">'
    + '<thead><tr><th>助動詞</th><th>意味</th><th>例（古文 → 現代語訳）</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>';
}

function renderJoshiTable() {
  var rows = '';
  JOSHI.forEach(function(item) {
    var dogHtml = item.dog ? '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);">🐕 ' + item.dog.c + ' → ' + item.dog.j + '</div>' : '';
    rows += '<tr>'
      + '<td class="kobu-word">' + item.w + '</td>'
      + '<td>' + item.m + '</td>'
      + '<td style="font-size:13px;color:#8b949e;">' + item.ex.c + ' → ' + item.ex.j + dogHtml + '</td>'
      + '</tr>';
  });
  return '<div class="acc-lead">🐕 印は品詞早見表の「あの犬」を使った例文。</div>'
    + '<div class="kobu-table-wrap"><table class="kobu-table">'
    + '<thead><tr><th>助詞</th><th>意味</th><th>例（古文 → 現代語訳）</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>';
}

// 品詞早見表の例文「あの大きい犬はとても静かだ。しかし全然歩かない。」を、犬が身分の高い「お犬様」だったら…という設定で敬語化
var KEIGO_EXAMPLES = [
  { cat:'尊敬語', color:'#f5c518', w:'おはします（いる）', cls:'お犬様、いと静かにおはします。', j:'あの犬様は、とても静かでいらっしゃる。', note:'「いる」の尊敬語を使うと、犬が身分の高い人であるかのような扱いになる' },
  { cat:'尊敬語', color:'#f5c518', w:'〜たまふ（補助動詞）', cls:'お犬様、つゆ歩みたまはず。', j:'犬様は、まったくお歩きになりません。', note:'動詞「歩み」に「たまふ」をつけて敬意を添える（「つゆ〜打消」＝重要古語34番）' },
  { cat:'謙譲語', color:'#3fb950', w:'差し上げる（与える）', cls:'（飼い主が）お犬様に、水を差し上げる。', j:'（飼い主が）犬様に、水を差し上げる。', note:'自分（飼い主）の動作をへりくだって、お犬様を立てる' },
  { cat:'丁寧語', color:'#0ea5e9', w:'侍り（あります）', cls:'お犬様は、いと静かに侍り。', j:'あの犬様は、とても静かでございます。', note:'聞き手に対してていねいに言う言い方' },
];

function renderKeigoExamples() {
  var rows = KEIGO_EXAMPLES.map(function(e) {
    return '<tr>'
      + '<td><span class="pos-tag" style="background:' + e.color + '">' + e.cat + '</span></td>'
      + '<td class="kobu-word" style="color:' + e.color + '">' + e.w + '</td>'
      + '<td>' + e.cls + '</td>'
      + '<td style="color:#8b949e;font-size:13px;">' + e.j + '</td>'
      + '<td style="font-size:12px;color:#8b949e;">' + e.note + '</td>'
      + '</tr>';
  }).join('');
  return '<div class="acc-lead" style="margin-top:16px;">🐕 品詞早見表の例文「あの大きい犬はとても静かだ。しかし全然歩かない。」の犬が、もし身分の高い「お犬様」だったら…と考えると敬語がつかみやすい。</div>'
    + '<div class="kobu-table-wrap"><table class="kobu-table">'
    + '<thead><tr><th>種類</th><th>使う語</th><th>文</th><th>現代語訳</th><th>メモ</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>';
}

function renderKeigoTable() {
  var html = '';
  ['sonkei','kenjo','teinei'].forEach(function(key) {
    var g = KEIGO[key];
    var rows = g.items.map(function(it) {
      return '<tr><td class="kobu-word" style="color:' + g.color + '">' + it.w + '</td><td>' + it.m + '</td></tr>';
    }).join('');
    html += '<div style="font-size:13px;color:' + g.color + ';font-weight:bold;margin:14px 0 8px;">' + g.title + '</div>'
      + '<div class="kobu-table-wrap"><table class="kobu-table"><tbody>' + rows + '</tbody></table></div>';
  });
  html += '<div class="rule-box" style="margin-top:14px;">'
    + '<div class="rule-title">動詞＋補助動詞「たまふ」</div>'
    + '<div>泣きたまふ → 「お泣きになる・お泣きなさる」と訳す（動詞に「たまふ」がつく敬語表現もある）</div>'
    + '<div class="note">主語が省略されている場合、①ある人の動作＋尊敬語→その人は身分が高い、②話題の人の動作＋敬語（会話文中）→話題の人は身分が高い、③自分の動作＋謙譲語→動作の相手が身分が高い、とわかる。</div>'
    + '</div>';
  html += renderKeigoExamples();
  return html;
}

// 「お犬様、いと静かにおはします」を主語追跡の題材として使う（前セクションの例文の続き）
var SUBJECT_PASSAGE = {
  cls:'お犬様、いと静かにおはします。されど、つゆ歩みたまはず。飼い主、水を差し上げれば、うれしげにて、少し歩みたまへり。',
  j:'お犬様は、とても静かでいらっしゃる。しかし、まったくお歩きになりません。飼い主が水を差し上げると、うれしそうにして、少しお歩きになった。',
  steps:[
    { line:'お犬様、いと静かにおはします。', subject:'お犬様', why:'「おはします」は尊敬語なので、身分の高いお犬様の動作とわかる（④）' },
    { line:'（お犬様、）つゆ歩みたまはず。',   subject:'お犬様（省略）', why:'主語は書かれていないが、直前の話の流れ（③）と「たまふ」の尊敬語（④）から、引き続きお犬様だとわかる' },
    { line:'飼い主、水を差し上げれば、',       subject:'飼い主',       why:'「差し上げる」は謙譲語＝自分の動作をへりくだる言い方。しかも「飼い主」と主語が明示されている（①②）' },
    { line:'（お犬様、）うれしげにて、少し歩みたまへり。', subject:'お犬様（省略）', why:'再び主語が省略されているが、「たまへり」の尊敬語（④）から、うれしがって歩いたのはお犬様だとわかる' },
  ]
};

function renderSubjectSection() {
  var stepsHtml = SUBJECT_PASSAGE.steps.map(function(s, i) {
    return '<div class="rule-box" style="margin-bottom:10px;">'
      + '<div>' + s.line + '</div>'
      + '<div class="note" style="margin-top:8px;">主語＝<strong style="color:var(--gold);">' + s.subject + '</strong>／' + s.why + '</div>'
      + '</div>';
  }).join('');
  return '<div class="flow-recap">' + SUBJECT_SVG + '</div>'
    + '<div class="acc-lead" style="margin-top:16px;">🐕 お犬様の話で、①〜④のステップを実際に使って主語を追いかけてみよう。</div>'
    + '<div class="kobun-text-block">' + SUBJECT_PASSAGE.cls + '</div>'
    + '<button class="modern-toggle-btn" data-target="subject-modern">📖 現代語訳を見る</button>'
    + '<div class="modern-text-block" id="subject-modern">' + SUBJECT_PASSAGE.j + '</div>'
    + stepsHtml;
}

function renderShijigoTable() {
  var rows = SHIJIGO.map(function(item) {
    return '<tr><td class="kobu-word">' + item.w + '</td><td>' + item.m + '</td><td style="font-size:13px;color:var(--gold);">🐕 ' + item.dog + '</td></tr>';
  }).join('');
  return '<div class="kobu-table-wrap"><table class="kobu-table"><tbody>' + rows + '</tbody></table></div>'
    + '<div class="acc-lead" style="margin-top:10px;">現代語の「どれ」にあたるのは古文の「いづれ・いづこ・いづち」など。</div>';
}

function renderTechSection() {
  var rows = TECH.setsuzoku.map(function(item) {
    return '<tr><td><span class="pos-tag" style="background:' + item.color + '">' + item.type + '</span></td><td class="kobu-word">' + item.w + '</td><td>' + item.m + '</td></tr>';
  }).join('');
  return '<div class="rule-box">'
    + '<div class="rule-title">① 接続語の空欄補充</div>'
    + '<div class="kobu-table-wrap" style="margin-top:8px;"><table class="kobu-table"><tbody>' + rows + '</tbody></table></div>'
    + '<div class="note">季節や時間、自然の風物などが話題の中心になっているときは、接続語以外の言葉が入ることも多い。</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">② 理由把握の問題</div>'
    + '<div>ある部分の理由が問われる場合、その部分の直前に「〜ば」（已然形＋ば＝確定）があれば、そこに理由が示されていることが多い。</div>'
    + '<div class="ex">例：（取り上げられていた）斉を返してくれければ、うれしと思ひけりとぞ<br>→「〜ば」の直前（斉を返してくれた）が理由、「〜ば」のあと（うれしと思った）が結果</div>'
    + '</div>';
}

function renderGenbunSection() {
  var makuraHtml = '<div class="kobun-work-title">' + MAKURA.title + '</div>';
  MAKURA.paras.forEach(function(p, i) {
    var id = 'makura-modern-' + i;
    makuraHtml += '<div class="kobun-work-meta">' + p.season + '</div>'
      + '<div class="kobun-text-block">' + p.cls + '</div>'
      + '<button class="modern-toggle-btn" data-target="' + id + '">📖 現代語訳を見る</button>'
      + '<div class="modern-text-block" id="' + id + '">' + p.j + '</div>';
  });

  var tId = 'tsurezure-modern';
  var tsurezureHtml = '<div class="kobun-work-title">' + TSUREZURE.title + '</div>'
    + '<div class="kobun-text-block">' + TSUREZURE.cls + '</div>'
    + '<button class="modern-toggle-btn" data-target="' + tId + '">📖 現代語訳を見る</button>'
    + '<div class="modern-text-block" id="' + tId + '">' + TSUREZURE.j + '</div>';

  return '<div class="acc-lead">中学でよく出る2つの古典作品の冒頭を、実際の古文でそのまま読んでみよう。ボタンで現代語訳と見比べられる。</div>'
    + makuraHtml + tsurezureHtml;
}

function renderBungakushiSection() {
  var cols = BUNGAKUSHI.map(function(e) {
    var works = e.works.map(function(w) {
      return '<div class="era-work"><span class="w-title">' + w.title + '</span><span class="w-author">' + w.author + '</span></div>';
    }).join('');
    return '<div class="era-col"><div class="era-col-title" style="color:' + e.color + '">' + e.era + '</div>' + works + '</div>';
  }).join('');
  return '<div class="era-table-wrap"><div class="era-cols">' + cols + '</div></div>';
}

function renderTsukiSection() {
  var cards = TSUKI.map(function(m) {
    return '<div class="month-card"><div class="month-num">' + m.n + '月</div><div class="month-name">' + m.name + '</div><div class="month-kana">' + m.kana + '</div></div>';
  }).join('');
  return '<div class="month-grid">' + cards + '</div>'
    + '<div class="acc-lead">旧暦の8月15日は「中秋」と呼ばれる（十五夜・中秋の名月）。</div>';
}

// ----- アコーディオン組み立て -----
var SECTIONS = [
  { id:'sec-kogo',   icon:'📖', title:'重要古語60', count:'60語', body: renderKogoTable },
  { id:'sec-jodo',   icon:'🔤', title:'助動詞', count:'9個', body: renderJodoshiTable },
  { id:'sec-joshi',  icon:'🔤', title:'助詞', count:'6個', body: renderJoshiTable },
  { id:'sec-kakari', icon:'🔁', title:'係り結び', count:'', body: function() { return '<div class="flow-recap">' + KAKARI_SVG + '</div>' + renderKakariExamples(); } },
  { id:'sec-keigo',  icon:'🙏', title:'敬語', count:'尊敬・謙譲・丁寧', body: renderKeigoTable },
  { id:'sec-subject',icon:'👤', title:'主語のとらえ方', count:'4ステップ', body: renderSubjectSection },
  { id:'sec-shiji',  icon:'👉', title:'指示語（こそあど）', count:'', body: renderShijigoTable },
  { id:'sec-tech',   icon:'✏️', title:'解法テクニック', count:'空欄補充・理由把握', body: renderTechSection },
  { id:'sec-genbun', icon:'📜', title:'原文で読む', count:'枕草子・徒然草', body: renderGenbunSection },
  { id:'sec-bungaku',icon:'📚', title:'各時代の代表作品', count:'', body: renderBungakushiSection },
  { id:'sec-tsuki',  icon:'🌙', title:'月の異名', count:'', body: renderTsukiSection },
];

function renderTocBar() {
  return '<div class="toc-bar">' + SECTIONS.map(function(s) {
    return '<button class="toc-chip" data-jump="' + s.id + '">' + s.icon + ' ' + s.title + '</button>';
  }).join('') + '</div>';
}

function renderAccordion() {
  return SECTIONS.map(function(s, i) {
    return '<details class="acc-section" id="' + s.id + '"' + (i === 0 ? ' open' : '') + '>'
      + '<summary class="acc-summary">' + s.icon + ' ' + s.title + (s.count ? '<span class="acc-count">' + s.count + '</span>' : '') + '</summary>'
      + '<div class="acc-body">' + s.body() + '</div>'
      + '</details>';
  }).join('');
}

function jumpToSection(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.open = true;
  el.scrollIntoView({ behavior:'smooth', block:'start' });
}

function wireKogoSearch() {
  var input = document.getElementById('kogoSearch');
  if (!input) return;
  input.addEventListener('input', function() {
    var q = input.value.trim();
    var rows = document.querySelectorAll('#kogoTableBody tr');
    var visibleCount = 0;
    rows.forEach(function(row) {
      var hit = !q || row.dataset.word.indexOf(q) !== -1 || row.dataset.mean.indexOf(q) !== -1;
      row.classList.toggle('row-hidden', !hit);
      if (hit) visibleCount++;
    });
    var empty = document.getElementById('kogoEmpty');
    if (empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
  });
}

function wireModernToggles() {
  document.querySelectorAll('.modern-toggle-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = document.getElementById(btn.dataset.target);
      if (!target) return;
      var showing = target.style.display === 'block';
      target.style.display = showing ? 'none' : 'block';
      btn.textContent = showing ? '📖 現代語訳を見る' : '📖 現代語訳をかくす';
    });
  });
}

function render() {
  var html = '<div class="ref-intro">📜 古文で押さえておきたい重要事項を、この1ページにぜんぶまとめてある。カテゴリを開いて確認しよう。スマホでいつでも見返せる暗記用リファレンスなので、クイズはついていない。</div>';
  html += renderTocBar();
  html += renderAccordion();
  html += '<div class="ref-actions">'
    + '<button class="print-btn" id="printBtn">🖨️ 印刷してデスクに貼る</button>'
    + '<a class="back-link" href="jpn_kobun_basics.html">← 古文基礎（クイズ）にもどる</a>'
    + '</div>';

  document.getElementById('refMain').innerHTML = html;

  document.querySelectorAll('.toc-chip[data-jump]').forEach(function(chip) {
    chip.addEventListener('click', function() { jumpToSection(chip.dataset.jump); });
  });
  wireKogoSearch();
  wireModernToggles();

  var pb = document.getElementById('printBtn');
  if (pb) pb.addEventListener('click', function() { window.print(); });
}

render();
