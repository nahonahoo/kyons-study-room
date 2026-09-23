// ===== 活用形まとめ・古文（jpn_henkaku_katsuyo.html）=====
// リファレンス＋実践問題。XP/弱点DBとは非連携。
// 現代文（口語）版は jpn_gendai_henkaku.html を参照。

// ----- ① 活用形とは（6つの定義） -----
var KOBUN_FORMS = [
  { name:'未然形', desc:'まだそうなっていない状態を表す形。あとに「ず」「む」などが続く。', ex:'歩か（ず）・歩か（む）' },
  { name:'連用形', desc:'用言や「けり」「たり」に連なる形。', ex:'歩き（けり）' },
  { name:'終止形', desc:'文をそのまま言い切る形。', ex:'犬、歩く。' },
  { name:'連体形', desc:'体言（名詞）に連なる形。あとに名詞が続く。', ex:'歩く（時）' },
  { name:'已然形', desc:'すでにそうなっている状態を表す形。あとに「ば」が続くと「〜ので」の確定条件になる。', ex:'歩け（ば）＝歩くので' },
  { name:'命令形', desc:'そのまま言い切って命令の意味になる形。', ex:'歩け。' },
];

// ----- ② 活用の種類ひとめ表（9種類） -----
var KOBUN_TABLE = [
  { type:'四段活用', word:'歩く', mizen:'歩か', renyou:'歩き', shushi:'歩く', rentai:'歩く', izen:'歩け', meirei:'歩け' },
  { type:'上一段活用', word:'見る', mizen:'み', renyou:'み', shushi:'みる', rentai:'みる', izen:'みれ', meirei:'みよ' },
  { type:'下一段活用', word:'蹴る（この1語だけ）', mizen:'け', renyou:'け', shushi:'ける', rentai:'ける', izen:'けれ', meirei:'けよ' },
  { type:'上二段活用', word:'起く', mizen:'起き', renyou:'起き', shushi:'起く', rentai:'起くる', izen:'起くれ', meirei:'起きよ' },
  { type:'下二段活用', word:'食ぶ', mizen:'食べ', renyou:'食べ', shushi:'食ぶ', rentai:'食ぶる', izen:'食ぶれ', meirei:'食べよ' },
  { type:'カ変', word:'来（く）', mizen:'こ', renyou:'き', shushi:'く', rentai:'くる', izen:'くれ', meirei:'こ（よ）' },
  { type:'サ変', word:'す・おはす など', mizen:'せ', renyou:'し', shushi:'す', rentai:'する', izen:'すれ', meirei:'せよ' },
  { type:'ナ変', word:'死ぬ・往ぬ（去ぬ）', mizen:'な', renyou:'に', shushi:'ぬ', rentai:'ぬる', izen:'ぬれ', meirei:'ね' },
  { type:'ラ変', word:'あり・をり・はべり・いまそかり', mizen:'ら', renyou:'り', shushi:'り', rentai:'る', izen:'れ', meirei:'れ' },
];

// ----- ③ 見分け方のコツ -----
var KOBUN_MIWAKE_SVG = '<svg viewBox="0 0 340 300" style="width:100%;max-width:380px;display:block;margin:0 auto">'
  + '<rect x="10" y="10" width="320" height="42" rx="8" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
  + '<text x="170" y="30" fill="#a371f7" font-size="12" text-anchor="middle">① 動詞に「ず」をつける</text>'
  + '<text x="170" y="44" fill="#8b949e" font-size="9" text-anchor="middle">直前の音（段）を見る</text>'
  + '<path d="M 170,52 L 170,68" stroke="#8b949e" stroke-width="2" marker-end="url(#kzArrow)"/>'
  + '<rect x="10" y="70" width="320" height="36" rx="8" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="170" y="92" fill="#0ea5e9" font-size="12" text-anchor="middle">② ア段なら四段活用（例：歩か-ず）</text>'
  + '<path d="M 170,106 L 170,122" stroke="#8b949e" stroke-width="2" marker-end="url(#kzArrow)"/>'
  + '<rect x="10" y="124" width="320" height="50" rx="8" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
  + '<text x="170" y="144" fill="#f5c518" font-size="12" text-anchor="middle">③ イ段なら上一段 or 上二段</text>'
  + '<text x="170" y="160" fill="#8b949e" font-size="9" text-anchor="middle">上一段は「ひいきにみいる」の8語だけ</text>'
  + '<text x="170" y="172" fill="#8b949e" font-size="9" text-anchor="middle">（干る･射る･着る･似る･見る･煮る･居る･率る）。他は上二段</text>'
  + '<path d="M 170,176 L 170,192" stroke="#8b949e" stroke-width="2" marker-end="url(#kzArrow)"/>'
  + '<rect x="10" y="194" width="320" height="50" rx="8" fill="rgba(233,69,96,0.10)" stroke="#e94560" stroke-width="1.5"/>'
  + '<text x="170" y="214" fill="#e94560" font-size="12" text-anchor="middle">④ エ段なら下一段 or 下二段</text>'
  + '<text x="170" y="230" fill="#8b949e" font-size="9" text-anchor="middle">下一段は「蹴る」の1語だけ。他は下二段</text>'
  + '<path d="M 170,246 L 170,262" stroke="#8b949e" stroke-width="2" marker-end="url(#kzArrow)"/>'
  + '<rect x="10" y="264" width="320" height="32" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="1.5"/>'
  + '<text x="170" y="284" fill="#3fb950" font-size="11" text-anchor="middle">⑤ 上記に当てはまらない9語は変格活用（丸暗記）</text>'
  + '<defs><marker id="kzArrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#8b949e"/></marker></defs>'
  + '</svg>';

// ----- ④ 犬の例文で見る活用の変化 -----
var KOBUN_DOG = [
  { type:'四段活用（歩く）', color:'#3fb950', rows:[
    { form:'未然形＋ず', cls:'犬、歩かず。', j:'犬が歩かない。' },
    { form:'連用形＋けり', cls:'犬、歩きけり。', j:'犬が歩いた。' },
    { form:'終止形（言い切り）', cls:'犬、歩く。', j:'犬が歩く。' },
    { form:'連体形＋時', cls:'犬、歩く時。', j:'犬が歩く時。' },
    { form:'已然形＋ば', cls:'犬、歩けば。', j:'犬が歩くので。' },
    { form:'命令形', cls:'犬、歩け。', j:'犬、歩け。' },
  ]},
  { type:'上一段活用（見る）', color:'#0ea5e9', rows:[
    { form:'未然形＋ず', cls:'犬を見ず。', j:'犬を見ない。' },
    { form:'連用形＋けり', cls:'犬を見けり。', j:'犬を見た。' },
    { form:'終止形（言い切り）', cls:'犬を見る。', j:'犬を見る。' },
    { form:'連体形＋時', cls:'犬を見る時。', j:'犬を見る時。' },
    { form:'已然形＋ば', cls:'犬を見れば。', j:'犬を見ると。' },
    { form:'命令形', cls:'犬を見よ。', j:'犬を見ろ。' },
  ]},
  { type:'下一段活用（蹴る）', color:'#e94560', note:'※この1語だけの特別な活用。犬に蹴る動作を向けないよう、鞠（まり）を主役にした例文にしている。', rows:[
    { form:'未然形＋ず', cls:'鞠を蹴ず。', j:'鞠を蹴らない。' },
    { form:'連用形＋けり', cls:'鞠を蹴けり。', j:'鞠を蹴った。' },
    { form:'終止形（言い切り）', cls:'鞠を蹴る。', j:'鞠を蹴る。' },
    { form:'連体形＋時', cls:'鞠を蹴る時。', j:'鞠を蹴る時。' },
    { form:'已然形＋ば', cls:'鞠を蹴れば。', j:'鞠を蹴ると。' },
    { form:'命令形', cls:'鞠を蹴よ。', j:'鞠を蹴れ。' },
  ]},
  { type:'上二段活用（起く）', color:'#84cc16', note:'現代語の「起きる」（上一段）の元になった語。', rows:[
    { form:'未然形＋ず', cls:'犬、起きず。', j:'犬が起きない。' },
    { form:'連用形＋けり', cls:'犬、起きけり。', j:'犬が起きた。' },
    { form:'終止形（言い切り）', cls:'犬、起く。', j:'犬が起きる。' },
    { form:'連体形＋時', cls:'犬、起くる時。', j:'犬が起きる時。' },
    { form:'已然形＋ば', cls:'犬、起くれば。', j:'犬が起きるので。' },
    { form:'命令形', cls:'犬、起きよ。', j:'犬、起きろ。' },
  ]},
  { type:'下二段活用（食ぶ）', color:'#f97316', note:'現代語の「食べる」（下一段）の元になった語。', rows:[
    { form:'未然形＋ず', cls:'犬、食べず。', j:'犬が食べない。' },
    { form:'連用形＋けり', cls:'犬、食べけり。', j:'犬が食べた。' },
    { form:'終止形（言い切り）', cls:'犬、食ぶ。', j:'犬が食べる。' },
    { form:'連体形＋時', cls:'犬、食ぶる時。', j:'犬が食べる時。' },
    { form:'已然形＋ば', cls:'犬、食ぶれば。', j:'犬が食べるので。' },
    { form:'命令形', cls:'犬、食べよ。', j:'犬、食べろ。' },
  ]},
  { type:'カ変（来）', color:'#a371f7', rows:[
    { form:'未然形＋ず', cls:'犬、来ず。', j:'犬が来ない。' },
    { form:'連用形＋たり', cls:'犬、来たり。', j:'犬が来た。' },
    { form:'終止形（言い切り）', cls:'犬、来。', j:'犬が来る。' },
    { form:'連体形＋時', cls:'犬、来る時。', j:'犬が来る時。' },
    { form:'已然形＋ば', cls:'犬、来れば。', j:'犬が来ると。' },
    { form:'命令形', cls:'疾く来。', j:'早く来い。' },
  ]},
  { type:'サ変（す）', color:'#f5c518', rows:[
    { form:'未然形＋ず', cls:'犬、鳴くまねせず。', j:'犬が鳴くまねをしない。' },
    { form:'連用形＋たり', cls:'犬、鳴くまねしたり。', j:'犬が鳴くまねをした。' },
    { form:'終止形（言い切り）', cls:'犬、鳴くまねす。', j:'犬が鳴くまねをする。' },
    { form:'連体形＋時', cls:'犬、鳴くまねする時。', j:'犬が鳴くまねをする時。' },
    { form:'已然形＋ば', cls:'犬、鳴くまねすれば。', j:'犬が鳴くまねをすると。' },
    { form:'命令形', cls:'疾く鳴くまねせよ。', j:'早く鳴くまねをしろ。' },
  ]},
  { type:'ナ変（往ぬ）', color:'#3fb950', rows:[
    { form:'未然形＋ず', cls:'犬、往なず。', j:'犬が行ってしまわない。' },
    { form:'連用形＋たり', cls:'犬、往にたり。', j:'犬は行ってしまった。' },
    { form:'終止形（言い切り）', cls:'犬、往ぬ。', j:'犬は行ってしまう。' },
    { form:'連体形＋時', cls:'犬、往ぬる時。', j:'犬が行ってしまう時。' },
    { form:'已然形＋ば', cls:'犬、往ぬれば。', j:'犬が行ってしまうと。' },
    { form:'命令形', cls:'疾く往ね。', j:'早く行ってしまえ。' },
  ]},
  { type:'ラ変（あり）', color:'#0ea5e9', rows:[
    { form:'未然形＋ば（仮定）', cls:'犬あらば。', j:'もし犬がいたら。' },
    { form:'連用形＋けり', cls:'犬ありけり。', j:'犬がいたのだった。' },
    { form:'終止形（言い切り）', cls:'犬、あり。', j:'犬がいる。' },
    { form:'連体形＋時', cls:'犬ある時。', j:'犬がいる時。' },
    { form:'已然形＋ば', cls:'犬あれば。', j:'犬がいるので。' },
    { form:'命令形', cls:'ここにあれ。', j:'ここにいろ。' },
  ]},
];

// ----- ⑤ 実践問題（軽いチェック用・スコアなし） -----
var KOBUN_QUIZ = [
  { q:'「歩く」に「ず」をつけると直前の音は何段？', choices:['ア段', 'イ段', 'エ段'], answer:0, exp:'歩か「ず」→ア段→四段活用。' },
  { q:'「見る」は何活用？', choices:['上二段活用','上一段活用','下二段活用'], answer:1, exp:'「見る」は上一段活用の代表語（覚え方「ひいきにみいる」の1語）。' },
  { q:'「蹴る」は何活用？', choices:['下二段活用','四段活用','下一段活用'], answer:2, exp:'古文で下一段活用になるのは「蹴る」ただ1語だけ。' },
  { q:'「起く」は何活用？', choices:['上二段活用','上一段活用','四段活用'], answer:0, exp:'「起く」は上一段の8語に含まれないので上二段活用。現代語の「起きる」（上一段）の元になった。' },
  { q:'「食ぶ」は何活用？', choices:['下一段活用','下二段活用','四段活用'], answer:1, exp:'「食ぶ」は下二段活用。現代語の「食べる」（下一段）の元になった。' },
  { q:'変格活用は全部で何語（複合語をのぞく）？', choices:['6語','9語','12語'], answer:1, exp:'来（1）／す・おはす（2）／死ぬ・往ぬ（2）／あり・をり・はべり・いまそかり（4）＝9語。' },
  { q:'「（かの犬）起くる時、いとうつくし。」の「起くる」の活用形は？', choices:['終止形','連体形','已然形'], answer:1, exp:'あとに体言「時」が続く→連体形。' },
  { q:'「犬、食ぶれば、うれし。」の「食ぶれ」の活用形は？', choices:['未然形','命令形','已然形'], answer:2, exp:'已然形＋「ば」で「〜ので」の確定条件を表す。' },
];

// ===================== レンダリング =====================

function renderKobunForms() {
  var rows = KOBUN_FORMS.map(function(f) {
    return '<tr><td class="kobu-word">' + f.name + '</td><td>' + f.desc + '</td><td style="color:#8b949e;font-size:13px;">' + f.ex + '</td></tr>';
  }).join('');
  return '<div class="kobu-table-wrap"><table class="kobu-table">'
    + '<thead><tr><th>活用形</th><th>定義</th><th>例</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>';
}

function renderKobunTable() {
  var rows = KOBUN_TABLE.map(function(r) {
    return '<tr>'
      + '<td class="kobu-word">' + r.type + '</td>'
      + '<td>' + r.word + '</td>'
      + '<td>' + r.mizen + '</td><td>' + r.renyou + '</td><td>' + r.shushi + '</td>'
      + '<td>' + r.rentai + '</td><td>' + r.izen + '</td><td>' + r.meirei + '</td>'
      + '</tr>';
  }).join('');
  return '<div class="kobu-table-wrap"><table class="kobu-table">'
    + '<thead><tr><th>種類</th><th>例の語</th><th>未然</th><th>連用</th><th>終止</th><th>連体</th><th>已然</th><th>命令</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table></div>';
}

function renderKobunMnemonic() {
  return '<div class="rule-box">'
    + '<div class="rule-title">変格活用は、全部で9語（＋複合語）しかない</div>'
    + '<div>来（カ変・1語）／す・おはす（サ変）／死ぬ・往ぬ（ナ変・2語）／あり・をり・はべり・いまそかり（ラ変・4語）</div>'
    + '<div class="note">この9語だけを丸ごと覚えてしまえば、あとの動詞はすべて四段・上一段・下一段・上二段・下二段のどれかに必ず当てはまる。</div>'
    + '</div>'
    + '<div class="rule-box">'
    + '<div class="rule-title">古文の活用は、現代文につながっている</div>'
    + '<div>上二段活用（起く）→現代文の上一段活用（起きる）</div>'
    + '<div>下二段活用（食ぶ）→現代文の下一段活用（食べる）</div>'
    + '<div>四段活用（歩く）→現代文の五段活用（歩く）</div>'
    + '<div class="note">時代とともに活用の種類が整理されて、今の形になった。古文と現代文を見比べると覚えやすい。</div>'
    + '</div>';
}

function renderKobunDog() {
  return KOBUN_DOG.map(function(g) {
    var rows = g.rows.map(function(r) {
      return '<tr><td style="font-size:12px;color:#8b949e;white-space:nowrap;">' + r.form + '</td><td class="kobu-word">' + r.cls + '</td><td style="color:#8b949e;font-size:13px;">' + r.j + '</td></tr>';
    }).join('');
    var note = g.note ? '<div class="acc-lead" style="margin:4px 0 6px;">' + g.note + '</div>' : '';
    return '<div style="font-size:14px;color:' + g.color + ';font-weight:bold;margin:18px 0 8px;">🐕 ' + g.type + '</div>'
      + note
      + '<div class="kobu-table-wrap"><table class="kobu-table"><tbody>' + rows + '</tbody></table></div>';
  }).join('');
}

function renderKobunQuiz() {
  var cards = KOBUN_QUIZ.map(function(item, i) {
    var choices = item.choices.map(function(c, ci) {
      return '<button class="choice-btn" data-qi="' + i + '" data-ci="' + ci + '">' + c + '</button>';
    }).join('');
    return '<div class="q-card" id="hq-card-' + i + '">'
      + '<div class="q-number">Q' + (i + 1) + '</div>'
      + '<div class="q-text">' + item.q + '</div>'
      + '<div class="choices" id="hq-choices-' + i + '">' + choices + '</div>'
      + '<div class="q-feedback" id="hq-fb-' + i + '"></div>'
      + '</div>';
  }).join('');
  return '<div class="acc-lead">🎯 答えを選ぶとすぐに正解と解説が出るよ。点数はつかないので、気軽に確認しよう。</div>' + cards;
}

function wireKobunQuiz() {
  document.querySelectorAll('.choice-btn[data-qi]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var qi = parseInt(btn.dataset.qi);
      var ci = parseInt(btn.dataset.ci);
      var item = KOBUN_QUIZ[qi];
      var choicesWrap = document.getElementById('hq-choices-' + qi);
      var fb = document.getElementById('hq-fb-' + qi);
      var card = document.getElementById('hq-card-' + qi);
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
  var html = '<div class="ref-intro">🐾 これは<strong style="color:var(--gold)">古文（文語）</strong>の活用形まとめ。動詞の活用の種類は「四段・上一段・下一段・上二段・下二段・変格（カ変/サ変/ナ変/ラ変）」の9つ。数は多く見えるが、規則を知れば整理できる。現代文（口語）の活用形は<a href="jpn_gendai_henkaku.html" style="color:var(--teal)">こちら</a>。</div>';

  html += '<div class="ref-section-title">① 活用形とは（6つの形）</div>';
  html += renderKobunForms();

  html += '<div class="ref-section-title">② 活用の種類ひとめ表</div>';
  html += renderKobunTable();
  html += renderKobunMnemonic();

  html += '<div class="ref-section-title">③ 見分け方のコツ</div>';
  html += '<div class="flow-recap">' + KOBUN_MIWAKE_SVG + '</div>';

  html += '<div class="ref-section-title">④ 犬の例文で見比べる</div>';
  html += '<div class="acc-lead">品詞早見表・古文まとめで使っている「あの犬」を使って、それぞれの活用形がどう変わるか見比べてみよう。</div>';
  html += renderKobunDog();

  html += '<div class="ref-section-title">⑤ 実践問題</div>';
  html += renderKobunQuiz();

  html += '<div class="ref-actions">'
    + '<a class="back-link" href="jpn_kobun_reference.html">← 古文まとめにもどる</a>'
    + '</div>';

  document.getElementById('refMain').innerHTML = html;

  wireKobunQuiz();
}

render();
