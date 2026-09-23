// ===== 表現技法まとめ（jpn_hyogen_gihou.html）=====
// リファレンス＋軽いかんたん問題。XP/弱点DBとは非連携。
// 品詞早見表・古文まとめと同じ「あの犬」の例文で、8つの表現技法をぜんぶ見比べる。

var GIHOU_LIST = [
  { name:'直喩（明喩）', color:'#f5c518',
    desc:'「ようだ・みたいだ・ごとし」などの言葉を使って、はっきりとたとえる。',
    ex:'あの犬は、まるで小さな熊のようだ。',
    tip:'「ようだ」「みたいだ」「ごとし」などの言葉が目印。' },
  { name:'隠喩（暗喩）', color:'#a371f7',
    desc:'「ようだ」などを使わず、直接たとえる。',
    ex:'あの犬は、我が家の小さな王様だ。',
    tip:'たとえの言葉がないぶん、直喩より気づきにくい。「AはBだ」の形になっていないか確認しよう。' },
  { name:'擬人法', color:'#3fb950',
    desc:'人でないもの（動物・物・自然など）を、人であるかのように表現する。',
    ex:'あの犬が「待って」と言うように、こちらを見つめた。',
    tip:'動物や物が、人間だけができる動作・感情を持つように描かれていたら擬人法。' },
  { name:'体言止め', color:'#0ea5e9',
    desc:'文の終わりを名詞（体言）で止めて、余韻を残す。',
    ex:'静かにそこにいる、あの犬。',
    tip:'文末が「〜だ」「〜する」ではなく、名詞でぷつっと終わっている。' },
  { name:'倒置法', color:'#e94560',
    desc:'ふつうの語順をわざと入れ替えて、意味を強調する。',
    ex:'とても静かだ、あの犬は。',
    tip:'本来の語順は「あの犬はとても静かだ」。入れ替えることで強調したい部分が前に来る。' },
  { name:'反復法', color:'#f97316',
    desc:'同じ言葉や似た言葉を繰り返して、強調する。',
    ex:'歩かない、歩かない、あの犬は。',
    tip:'同じ言葉が2回以上繰り返されていたら反復法。リズムと強さが生まれる。' },
  { name:'対句', color:'#84cc16',
    desc:'形や意味が対になる言葉を並べて表現する。',
    ex:'走る猫、歩かぬ犬。',
    tip:'似た組み立ての言葉が、左右で対応するように並んでいる。' },
  { name:'省略法', color:'#8b8b8b',
    desc:'言葉の一部をあえて省いて、想像の余地を残す。',
    ex:'あの犬、とても……。',
    tip:'文が最後まで言い切られておらず、読み手に続きを想像させる。' },
];

var GIHOU_QUIZ = [
  { s:'静かにそこにいる、あの犬。', answer:'体言止め', exp:'文末が名詞「あの犬」で終わっている。' },
  { s:'あの犬は、まるで小さな熊のようだ。', answer:'直喩（明喩）', exp:'「ようだ」を使ってはっきりたとえている。' },
  { s:'とても静かだ、あの犬は。', answer:'倒置法', exp:'本来の語順「あの犬はとても静かだ」が入れ替わっている。' },
  { s:'あの犬が「待って」と言うように、こちらを見つめた。', answer:'擬人法', exp:'犬が人間のように「言う」動作をするように描かれている。' },
  { s:'歩かない、歩かない、あの犬は。', answer:'反復法', exp:'「歩かない」が繰り返されている。' },
  { s:'走る猫、歩かぬ犬。', answer:'対句', exp:'「走る猫」と「歩かぬ犬」が対になる形で並んでいる。' },
  { s:'あの犬は、我が家の小さな王様だ。', answer:'隠喩（暗喩）', exp:'「ようだ」を使わず、直接「王様だ」とたとえている。' },
];

// ===================== レンダリング =====================

function renderGihouCards() {
  return GIHOU_LIST.map(function(g) {
    return '<div class="rule-box" style="border-left-color:' + g.color + ';">'
      + '<div class="rule-title" style="color:' + g.color + ';">' + g.name + '</div>'
      + '<div>' + g.desc + '</div>'
      + '<div class="ex">🐕 ' + g.ex + '</div>'
      + '<div class="note">' + g.tip + '</div>'
      + '</div>';
  }).join('');
}

function shuffleChoices(list, correct) {
  var wrong = list.filter(function(n) { return n !== correct; });
  var picks = [];
  while (picks.length < 2 && wrong.length) {
    var idx = Math.floor(Math.random() * wrong.length);
    picks.push(wrong.splice(idx, 1)[0]);
  }
  var choices = picks.concat([correct]);
  for (var i = choices.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = choices[i]; choices[i] = choices[j]; choices[j] = tmp;
  }
  return choices;
}

var GIHOU_QUIZ_CHOICES = [];

function renderGihouQuiz() {
  var names = GIHOU_LIST.map(function(g) { return g.name; });
  var cards = GIHOU_QUIZ.map(function(item, i) {
    var choices = shuffleChoices(names, item.answer);
    GIHOU_QUIZ_CHOICES[i] = choices;
    var choiceHtml = choices.map(function(c, ci) {
      return '<button class="choice-btn" data-qi="' + i + '" data-ci="' + ci + '">' + c + '</button>';
    }).join('');
    return '<div class="q-card" id="gq-card-' + i + '">'
      + '<div class="q-number">Q' + (i + 1) + '</div>'
      + '<div class="q-text">「' + item.s + '」</div>'
      + '<div class="q-sub">この文で使われている表現技法はどれ？</div>'
      + '<div class="choices" id="gq-choices-' + i + '">' + choiceHtml + '</div>'
      + '<div class="q-feedback" id="gq-fb-' + i + '"></div>'
      + '</div>';
  }).join('');
  return '<div class="acc-lead">🎯 答えを選ぶとすぐに正解と解説が出るよ。点数はつかないので、気軽に確認しよう。</div>' + cards;
}

function wireGihouQuiz() {
  document.querySelectorAll('.choice-btn[data-qi]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var qi = parseInt(btn.dataset.qi);
      var ci = parseInt(btn.dataset.ci);
      var item = GIHOU_QUIZ[qi];
      var choices = GIHOU_QUIZ_CHOICES[qi];
      var choicesWrap = document.getElementById('gq-choices-' + qi);
      var fb = document.getElementById('gq-fb-' + qi);
      var card = document.getElementById('gq-card-' + qi);
      if (choicesWrap.dataset.answered) return;
      choicesWrap.dataset.answered = '1';
      var answerIdx = choices.indexOf(item.answer);
      choicesWrap.querySelectorAll('.choice-btn').forEach(function(b, i) {
        b.disabled = true;
        if (i === answerIdx) b.classList.add('show-correct');
      });
      var correct = ci === answerIdx;
      if (correct) { btn.classList.add('selected-correct'); card.classList.add('correct-card'); }
      else { btn.classList.add('selected-wrong'); card.classList.add('wrong-card'); }
      fb.className = 'q-feedback ' + (correct ? 'correct-fb' : 'wrong-fb');
      fb.style.display = 'block';
      fb.textContent = (correct ? '◎ 正解！ ' : '✗ 惜しい。正解は「' + item.answer + '」。') + item.exp;
    });
  });
}

function render() {
  var html = '<div class="ref-intro">🐕 詩や小説、随筆でよく使われる「表現技法」を、品詞早見表・古文まとめと同じ「あの犬」の例文で1つずつ見比べられるようにした。</div>';

  html += '<div class="ref-section-title">① 表現技法ひとめカード</div>';
  html += renderGihouCards();

  html += '<div class="ref-section-title">② かんたん問題</div>';
  html += renderGihouQuiz();

  html += '<div class="ref-actions">'
    + '<button class="print-btn" id="printBtn">🖨️ 印刷してデスクに貼る</button>'
    + '</div>';

  document.getElementById('refMain').innerHTML = html;

  wireGihouQuiz();

  var pb = document.getElementById('printBtn');
  if (pb) pb.addEventListener('click', function() { window.print(); });
}

render();
