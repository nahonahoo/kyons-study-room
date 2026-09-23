// ===== 活用形まとめ・現代文（jpn_gendai_henkaku.html）=====
// リファレンス＋実践問題。XP/弱点DBとは非連携。印刷ボタンなし。
// 古文（文語）版は jpn_henkaku_katsuyo.html を参照。

// ----- ① 活用形とは（6つの定義） -----
var GENDAI_FORMS = [
  { name:'未然形', desc:'まだそうなっていない状態を表す形。あとに「ない」「う・よう」などが続く。', ex:'歩か（ない）・歩こ（う）' },
  { name:'連用形', desc:'用言（動詞など）や「た」「ます」に連なる形。', ex:'歩き（ます）・歩い（た）' },
  { name:'終止形', desc:'文をそのまま言い切る形。', ex:'犬が歩く。' },
  { name:'連体形', desc:'体言（名詞）に連なる形。あとに名詞が続く。', ex:'歩く（時）' },
  { name:'仮定形', desc:'「もし〜なら」の仮定を表す形。あとに「ば」が続く。', ex:'歩け（ば）' },
  { name:'命令形', desc:'そのまま言い切って命令の意味になる形。', ex:'歩け。' },
];

// ----- ② 活用の種類ひとめ表 -----
var GENDAI_TABLE = [
  { type:'五段活用', word:'歩く', mizen:'歩か', renyou:'歩き', shushi:'歩く', rentai:'歩く', katei:'歩け', meirei:'歩け' },
  { type:'上一段活用', word:'起きる', mizen:'起き', renyou:'起き', shushi:'起きる', rentai:'起きる', katei:'起きれ', meirei:'起きろ（起きよ）' },
  { type:'下一段活用', word:'食べる', mizen:'食べ', renyou:'食べ', shushi:'食べる', rentai:'食べる', katei:'食べれ', meirei:'食べろ（食べよ）' },
  { type:'カ変', word:'来る', mizen:'こ', renyou:'き', shushi:'くる', rentai:'くる', katei:'くれ', meirei:'こい' },
  { type:'サ変', word:'する（〜する も含む）', mizen:'し・せ・さ', renyou:'し', shushi:'する', rentai:'する', katei:'すれ', meirei:'しろ・せよ' },
];

// ----- ③ 見分け方のコツ -----
var GENDAI_MIWAKE_SVG = '<svg viewBox="0 0 340 260" style="width:100%;max-width:380px;display:block;margin:0 auto">'
  + '<rect x="10" y="10" width="320" height="46" rx="8" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
  + '<text x="170" y="32" fill="#a371f7" font-size="12" text-anchor="middle">① 動詞に「ない」をつける</text>'
  + '<text x="170" y="46" fill="#8b949e" font-size="9" text-anchor="middle">直前の音（段）を見る</text>'
  + '<path d="M 170,56 L 170,72" stroke="#8b949e" stroke-width="2" marker-end="url(#gArrow)"/>'
  + '<rect x="10" y="74" width="320" height="46" rx="8" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="170" y="96" fill="#0ea5e9" font-size="12" text-anchor="middle">② ア段なら五段活用</text>'
  + '<text x="170" y="110" fill="#8b949e" font-size="9" text-anchor="middle">例：歩か（ない）→ ア段</text>'
  + '<path d="M 170,120 L 170,136" stroke="#8b949e" stroke-width="2" marker-end="url(#gArrow)"/>'
  + '<rect x="10" y="138" width="320" height="46" rx="8" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
  + '<text x="170" y="160" fill="#f5c518" font-size="12" text-anchor="middle">③ イ段なら上一段／エ段なら下一段</text>'
  + '<text x="170" y="174" fill="#8b949e" font-size="9" text-anchor="middle">例：起き（ない）→ イ段／食べ（ない）→ エ段</text>'
  + '<path d="M 170,184 L 170,200" stroke="#8b949e" stroke-width="2" marker-end="url(#gArrow)"/>'
  + '<rect x="10" y="202" width="320" height="46" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
  + '<text x="170" y="222" fill="#3fb950" font-size="12" text-anchor="middle">④ 「来る」「する」だけは例外</text>'
  + '<text x="170" y="238" fill="#8b949e" font-size="9" text-anchor="middle">この2語はカ変・サ変と丸暗記する</text>'
  + '<defs><marker id="gArrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#8b949e"/></marker></defs>'
  + '</svg>';

// ----- ④ 犬の例文で見る活用の変化 -----
var GENDAI_DOG = [
  { type:'五段活用（歩く）', color:'#3fb950', rows:[
    { form:'未然形＋ない', cls:'犬、歩かない。', j:'犬が歩かない。' },
    { form:'連用形＋ます', cls:'犬、歩きます。', j:'犬が歩きます。' },
    { form:'終止形（言い切り）', cls:'犬、歩く。', j:'犬が歩く。' },
    { form:'連体形＋時', cls:'犬、歩く時。', j:'犬が歩く時。' },
    { form:'仮定形＋ば', cls:'犬、歩けば。', j:'犬が歩くと。' },
    { form:'命令形', cls:'犬、歩け。', j:'犬、歩け。' },
  ]},
  { type:'上一段活用（起きる）', color:'#0ea5e9', rows:[
    { form:'未然形＋ない', cls:'犬、起きない。', j:'犬が起きない。' },
    { form:'連用形＋ます', cls:'犬、起きます。', j:'犬が起きます。' },
    { form:'終止形（言い切り）', cls:'犬、起きる。', j:'犬が起きる。' },
    { form:'連体形＋時', cls:'犬、起きる時。', j:'犬が起きる時。' },
    { form:'仮定形＋ば', cls:'犬、起きれば。', j:'犬が起きると。' },
    { form:'命令形', cls:'犬、起きろ。', j:'犬、起きろ。' },
  ]},
  { type:'下一段活用（食べる）', color:'#e94560', rows:[
    { form:'未然形＋ない', cls:'犬、食べない。', j:'犬が食べない。' },
    { form:'連用形＋ます', cls:'犬、食べます。', j:'犬が食べます。' },
    { form:'終止形（言い切り）', cls:'犬、食べる。', j:'犬が食べる。' },
    { form:'連体形＋時', cls:'犬、食べる時。', j:'犬が食べる時。' },
    { form:'仮定形＋ば', cls:'犬、食べれば。', j:'犬が食べると。' },
    { form:'命令形', cls:'犬、食べろ。', j:'犬、食べろ。' },
  ]},
  { type:'カ変（来る）', color:'#a371f7', rows:[
    { form:'未然形＋ない', cls:'犬、来ない。', j:'犬が来ない。' },
    { form:'連用形＋ます', cls:'犬、来ます。', j:'犬が来ます。' },
    { form:'終止形（言い切り）', cls:'犬、来る。', j:'犬が来る。' },
    { form:'連体形＋時', cls:'犬、来る時。', j:'犬が来る時。' },
    { form:'仮定形＋ば', cls:'犬、来れば。', j:'犬が来ると。' },
    { form:'命令形', cls:'犬、来い。', j:'犬、来い。' },
  ]},
  { type:'サ変（する）', color:'#f5c518', rows:[
    { form:'未然形＋ない', cls:'犬、鳴くまねをしない。', j:'犬が鳴くまねをしない。' },
    { form:'連用形＋ます', cls:'犬、鳴くまねをします。', j:'犬が鳴くまねをします。' },
    { form:'終止形（言い切り）', cls:'犬、鳴くまねをする。', j:'犬が鳴くまねをする。' },
    { form:'連体形＋時', cls:'犬、鳴くまねをする時。', j:'犬が鳴くまねをする時。' },
    { form:'仮定形＋ば', cls:'犬、鳴くまねをすれば。', j:'犬が鳴くまねをすると。' },
    { form:'命令形', cls:'犬、鳴くまねをしろ。', j:'犬、鳴くまねをしろ。' },
  ]},
];

// ----- ⑤ 実践問題（軽いチェック用・スコアなし） -----
var GENDAI_QUIZ = [
  { q:'「歩く」に「ない」をつけると？', choices:['歩かない','歩きない','歩けない'], answer:0, exp:'「ない」をつけて直前の音を見る。「歩か」はア段なので五段活用。' },
  { q:'「歩く」は何活用？', choices:['上一段活用','五段活用','下一段活用'], answer:1, exp:'未然形がア段（歩か-ない）＝五段活用。' },
  { q:'「起きる」に「ない」をつけると？', choices:['起きない','起きるない','起こない'], answer:0, exp:'「起き」はイ段なので上一段活用。' },
  { q:'「食べる」は何活用？', choices:['五段活用','上一段活用','下一段活用'], answer:2, exp:'食べ「ない」→エ段（べ）→下一段活用。' },
  { q:'「来る」「する」の活用の種類は？', choices:['カ変とサ変','サ変とカ変（同じ）','五段と五段'], answer:0, exp:'この2語だけの特別な活用。丸暗記するしかない。' },
  { q:'サ変の未然形「させる」に使われている形はどれ？', choices:['し','せ','さ'], answer:2, exp:'サ変の未然形は「し（＋ない）」「せ（＋ぬ）」「さ（＋せる）」の3つがある。' },
  { q:'「犬が公園で走るとき、とても楽しそうだ。」の「走る」の活用形は？', choices:['終止形','連体形','連用形'], answer:1, exp:'あとに体言「とき」が続く→連体形。終止形と形が同じなので、あとに続く言葉で判断する。' },
  { q:'「もし犬が走れば、すぐに疲れるだろう。」の「走れ」の活用形は？', choices:['已然形','仮定形','命令形'], answer:1, exp:'あとに「ば」が続き、「もし〜なら」の仮定を表す→仮定形。「已然形」は古文だけで使う言葉。' },
];

// ===================== レンダリング =====================

function renderGendaiForms() {
  var rows = GENDAI_FORMS.map(function(f) {
    return '<tr><td class="kobu-word">' + f.name + '</td><td>' + f.desc + '</td><td style="color:#8b949e;font-size:13px;">' + f.ex + '</td></tr>';
  }).join('');
  return '<div class="kobu-table-wrap"><table class="kobu-table">'
    + '<thead><tr><th>活用形</th><th>定義</th><th>例</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>';
}

function renderGendaiTable() {
  var rows = GENDAI_TABLE.map(function(r) {
    return '<tr>'
      + '<td class="kobu-word">' + r.type + '</td>'
      + '<td>' + r.word + '</td>'
      + '<td>' + r.mizen + '</td><td>' + r.renyou + '</td><td>' + r.shushi + '</td>'
      + '<td>' + r.rentai + '</td><td>' + r.katei + '</td><td>' + r.meirei + '</td>'
      + '</tr>';
  }).join('');
  return '<div class="kobu-table-wrap"><table class="kobu-table">'
    + '<thead><tr><th>種類</th><th>例の語</th><th>未然</th><th>連用</th><th>終止</th><th>連体</th><th>仮定</th><th>命令</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>';
}

function renderGendaiMnemonic() {
  return '<div class="rule-box">'
    + '<div class="rule-title">サ変の未然形だけ、3つの形がある</div>'
    + '<div>し（＋ない）：しない　／　せ（＋ぬ）：せぬ　／　さ（＋せる）：させる</div>'
    + '<div class="ex">🐕 犬に鳴くまねをさせる。（「さ」＋「せる」の形）</div>'
    + '<div class="note">あとに続く言葉によって「し・せ・さ」を使い分ける。これはサ変だけの特別なルール。</div>'
    + '</div>';
}

function renderGendaiDog() {
  return GENDAI_DOG.map(function(g) {
    var rows = g.rows.map(function(r) {
      return '<tr><td style="font-size:12px;color:#8b949e;white-space:nowrap;">' + r.form + '</td><td class="kobu-word">' + r.cls + '</td></tr>';
    }).join('');
    return '<div style="font-size:14px;color:' + g.color + ';font-weight:bold;margin:18px 0 8px;">🐕 ' + g.type + '</div>'
      + '<div class="kobu-table-wrap"><table class="kobu-table"><tbody>' + rows + '</tbody></table></div>';
  }).join('');
}

function renderGendaiQuiz() {
  var cards = GENDAI_QUIZ.map(function(item, i) {
    var choices = item.choices.map(function(c, ci) {
      return '<button class="choice-btn" data-qi="' + i + '" data-ci="' + ci + '">' + c + '</button>';
    }).join('');
    return '<div class="q-card" id="gk-card-' + i + '">'
      + '<div class="q-number">Q' + (i + 1) + '</div>'
      + '<div class="q-text">' + item.q + '</div>'
      + '<div class="choices" id="gk-choices-' + i + '">' + choices + '</div>'
      + '<div class="q-feedback" id="gk-fb-' + i + '"></div>'
      + '</div>';
  }).join('');
  return '<div class="acc-lead">🎯 答えを選ぶとすぐに正解と解説が出るよ。点数はつかないので、気軽に確認しよう。</div>' + cards;
}

function wireGendaiQuiz() {
  document.querySelectorAll('.choice-btn[data-qi]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var qi = parseInt(btn.dataset.qi);
      var ci = parseInt(btn.dataset.ci);
      var item = GENDAI_QUIZ[qi];
      var choicesWrap = document.getElementById('gk-choices-' + qi);
      var fb = document.getElementById('gk-fb-' + qi);
      var card = document.getElementById('gk-card-' + qi);
      if (choicesWrap.dataset.answered) return;
      choicesWrap.dataset.answered = '1';
      choicesWrap.querySelectorAll('.choice-btn').forEach(function(b, i) {
        b.disabled = true;
        if (i === item.answer) b.classList.add('show-correct');
      });
      var correct = ci === item.answer;
      if (correct) { btn.classList.add('selected-correct'); card.classList.add('correct-card'); }
      else { btn.classList.add('selected-wrong'); card.classList.add('wrong-card'); }
      fb.className = 'q-feedback ' + (correct ? 'correct-fb' : 'wrong-fb');
      fb.style.display = 'block';
      fb.textContent = (correct ? '◎ 正解！ ' : '✗ 惜しい。正解は「' + item.choices[item.answer] + '」。') + item.exp;
    });
  });
}

function render() {
  var html = '<div class="ref-intro">🐾 これは<strong style="color:var(--gold)">現代文（口語）</strong>の活用形まとめ。動詞の活用の種類は「五段・上一段・下一段・カ変・サ変」の5つ。古文（文語）の活用形は<a href="jpn_henkaku_katsuyo.html" style="color:var(--teal)">こちら</a>。</div>';

  html += '<div class="ref-section-title">① 活用形とは（6つの形）</div>';
  html += renderGendaiForms();

  html += '<div class="ref-section-title">② 活用の種類ひとめ表</div>';
  html += renderGendaiTable();
  html += renderGendaiMnemonic();

  html += '<div class="ref-section-title">③ 見分け方のコツ</div>';
  html += '<div class="flow-recap">' + GENDAI_MIWAKE_SVG + '</div>';

  html += '<div class="ref-section-title">④ 犬の例文で見比べる</div>';
  html += renderGendaiDog();

  html += '<div class="ref-section-title">⑤ 実践問題</div>';
  html += renderGendaiQuiz();

  html += '<div class="ref-actions">'
    + '<a class="back-link" href="jpn_grammar_review.html">← 文法総復習にもどる</a>'
    + '</div>';

  document.getElementById('refMain').innerHTML = html;

  wireGendaiQuiz();
}

render();
