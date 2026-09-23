// ===== 品詞カラー定義 =====
var POS_COLORS = {
  '動詞':'#3fb950', '形容詞':'#f5c518', '形容動詞':'#f97316', '名詞':'#0ea5e9',
  '副詞':'#a78bfa', '連体詞':'#ec4899', '接続詞':'#2dd4bf', '感動詞':'#f43f5e',
  '助動詞':'#a371f7', '助詞':'#64748b'
};

// ===== 例文（この1文だけで10品詞すべてが登場する） =====
var SENTENCE = [
  { text:'ああ、',   pos:'感動詞' },
  { text:'あの',     pos:'連体詞' },
  { text:'大きい',   pos:'形容詞' },
  { text:'犬',       pos:'名詞' },
  { text:'は',       pos:'助詞' },
  { text:'とても',   pos:'副詞' },
  { text:'静かだ。', pos:'形容動詞' },
  { text:'しかし',   pos:'接続詞' },
  { text:'全然',     pos:'副詞' },
  { text:'歩か',     pos:'動詞' },
  { text:'ない。',   pos:'助動詞' },
];

// ===== 対照表データ（自立語8種 → 付属語2種の順。groupEnd で仕切り線を入れる） =====
// more: 同じ品詞の仲間の言葉（見分けが混同しやすい品詞ほど多めに用意）
var POS_ROWS = [
  { pos:'動詞',   word:'歩か（歩く）', kind:'自立語', katsuyo:'する',   tip:'言い切りがウ段（歩く）。単独で述語になれる',
    more:['読む','書く','見る','食べる','走る','来る','する'] },
  { pos:'形容詞', word:'大きい',       kind:'自立語', katsuyo:'する',   tip:'言い切りが「い」',
    more:['高い','美しい','楽しい','寒い','優しい','小さい'] },
  { pos:'形容動詞', word:'静かだ',     kind:'自立語', katsuyo:'する',   tip:'言い切りが「だ」。「〜な」の形で体言を修飾できる', groupEnd:true,
    more:['きれいだ','元気だ','立派だ','簡単だ','便利だ','好きだ'] },
  { pos:'名詞',   word:'犬',           kind:'自立語', katsuyo:'しない', tip:'主語になれる（「犬が」の形にできる）', groupEnd:true,
    more:['学校','本','水','友達','時間','山田さん'] },
  { pos:'副詞',   word:'とても・全然', kind:'自立語', katsuyo:'しない', tip:'主に用言（動詞・形容詞・形容動詞）を修飾する',
    more:['すぐに','かなり','ゆっくり','きっと','たぶん','もっと','ちょっと'] },
  { pos:'連体詞', word:'あの',         kind:'自立語', katsuyo:'しない', tip:'体言だけを修飾する',
    more:['この','その','どの','あらゆる','いわゆる','大きな','小さな','とんだ'] },
  { pos:'接続詞', word:'しかし',       kind:'自立語', katsuyo:'しない', tip:'文と文、語と語をつなぐ',
    more:['そして','だから','けれども','つまり','また','または','なぜなら'] },
  { pos:'感動詞', word:'ああ',         kind:'自立語', katsuyo:'しない', tip:'それだけで独立語になる（感動・呼びかけ・応答）', groupEnd:true,
    more:['あっ','まあ','やれやれ','おい','こら','もしもし','ねえ','はい'] },
  { pos:'助動詞', word:'ない',         kind:'付属語', katsuyo:'する',   tip:'動詞「歩か」にくっついて意味を添える',
    more:['れる・られる','せる・させる','た','そうだ','らしい','ようだ','ます'] },
  { pos:'助詞',   word:'は',           kind:'付属語', katsuyo:'しない', tip:'体言「犬」にくっついて関係を示す',
    more:['が','を','に','と','から','ので','か','ね','よ'] },
];

function posId(pos) { return 'posrow-' + pos; }

// ===== 絶対にありえない品詞の組み合わせ（品詞の定義そのものから導ける鉄則） =====
// left/right: {label, pos}（posがあれば品詞カラーのチップ、なければグレーの通常チップ）
var IMPOSSIBLE_RULES = [
  { head:'付属語は文の先頭に来ない', left:{label:'助詞・助動詞', pos:'助詞'}, right:{label:'文の先頭'}, note:'くっつく相手が必ず前にいる言葉だから' },
  { head:'連体詞のあとは名詞だけ', left:{label:'連体詞', pos:'連体詞'}, right:{label:'動詞・形容詞・形容動詞'}, note:'名詞（体言）以外は修飾できない' },
  { head:'副詞のあとは用言だけ', left:{label:'副詞', pos:'副詞'}, right:{label:'名詞', pos:'名詞'}, note:'名詞は直接修飾できない' },
  { head:'感動詞・接続詞はひとりぼっち', left:{label:'感動詞・接続詞', pos:'感動詞'}, right:{label:'修飾する／される'}, note:'前後の語とくっつく関係を持たない' },
  { head:'助動詞のまえは用言が基本', left:{label:'名詞', pos:'名詞'}, right:{label:'助動詞', pos:'助動詞'}, note:'例外は「だ・です」だけ（例：学生だ）', exception:true },
];

// ===== 品詞パズル（タップして順番にはめ込む） =====
// セットになりやすい品詞の組み合わせを、簡単な2つ組み合わせから応用の長い文まで並べてある
var PUZZLES = [
  { chunks:[{text:'あの',pos:'連体詞'},{text:'犬',pos:'名詞'}],
    hint:'連体詞は名詞だけを修飾する。「あの」の後には必ず名詞が来るよ！' },
  { chunks:[{text:'とても',pos:'副詞'},{text:'大きい',pos:'形容詞'}],
    hint:'副詞は用言（動詞・形容詞・形容動詞）を修飾する。ここでは形容詞「大きい」を修飾しているよ！' },
  { chunks:[{text:'しかし',pos:'接続詞'},{text:'静かだ',pos:'形容動詞'}],
    hint:'接続詞は前の文とあとの文をつなぐだけ。修飾関係はなく、独立して使われるよ！' },
  { chunks:[{text:'犬',pos:'名詞'},{text:'は',pos:'助詞'}],
    hint:'助詞は付属語だから単独では使えない。名詞「犬」にくっついて主語だと示しているよ！' },
  { chunks:[{text:'歩か',pos:'動詞'},{text:'ない',pos:'助動詞'}],
    hint:'助動詞は用言（ここでは動詞）の後ろにくっついて意味を添えるよ！' },
  { chunks:[{text:'あの',pos:'連体詞'},{text:'犬',pos:'名詞'},{text:'は',pos:'助詞'},{text:'歩か',pos:'動詞'},{text:'ない',pos:'助動詞'}],
    hint:'連体詞は名詞を修飾し、助詞は名詞にくっつき、助動詞は動詞にくっつく。ペアの法則が全部つながっているよ！' },
  { chunks:[{text:'とても',pos:'副詞'},{text:'大きい',pos:'形容詞'},{text:'犬',pos:'名詞'}],
    hint:'副詞は形容詞を修飾し、その形容詞が名詞を修飾する。副詞が名詞を直接修飾することはないよ！' },
  { chunks:[{text:'しかし',pos:'接続詞'},{text:'全然',pos:'副詞'},{text:'歩か',pos:'動詞'},{text:'ない',pos:'助動詞'}],
    hint:'接続詞は独立、副詞は動詞を修飾、助動詞は動詞にくっつく。それぞれ役割が違うよ！' },
];

var puzzleState = [];

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function initPuzzleState() {
  puzzleState = PUZZLES.map(function(p) {
    var poolOrder = shuffle(p.chunks.map(function(c, i) { return i; }));
    return { filled: [], pool: poolOrder, solved: false };
  });
}

function renderPuzzleCard(puzzle, idx) {
  var st = puzzleState[idx];
  var html = '<div class="puzzle-card' + (st.solved ? ' puzzle-solved' : '') + '" id="puzzle-' + idx + '">'
    + '<div class="puzzle-num">パズル ' + (idx+1) + ' ／ ' + puzzle.chunks.length + 'ピース</div>'
    + '<div class="puzzle-slots" id="puzzle-slots-' + idx + '">';
  for (var i = 0; i < puzzle.chunks.length; i++) {
    if (i < st.filled.length) {
      var c = puzzle.chunks[st.filled[i]];
      html += '<div class="puzzle-slot filled" style="background:' + POS_COLORS[c.pos] + '">' + c.text + '</div>';
    } else {
      html += '<div class="puzzle-slot"></div>';
    }
  }
  html += '</div>';
  html += '<div class="puzzle-pool" id="puzzle-pool-' + idx + '">';
  st.pool.forEach(function(chunkIdx) {
    var c = puzzle.chunks[chunkIdx];
    html += '<button class="puzzle-chunk-btn" style="background:' + POS_COLORS[c.pos] + '" data-puzzle="' + idx + '" data-chunk="' + chunkIdx + '">' + c.text + '</button>';
  });
  html += '</div>';
  html += '<div class="puzzle-result" id="puzzle-result-' + idx + '"></div>';
  if (puzzle.hint) {
    html += '<button class="hint-btn" id="hint-btn-' + idx + '" data-puzzle="' + idx + '">💡 コツを見る</button>'
      + '<div class="hint-box" id="hint-box-' + idx + '">' + puzzle.hint + '</div>';
  }
  html += '</div>';
  return html;
}

function impChip(item) {
  if (item.pos) return '<span class="imp-chip" style="background:' + POS_COLORS[item.pos] + '">' + item.label + '</span>';
  return '<span class="imp-chip imp-chip-plain">' + item.label + '</span>';
}

function renderImpossibleRules() {
  var html = '<div class="imp-wrap">'
    + '<div class="imp-wrap-title">⚠️ 絶対にありえない組み合わせ</div>';
  IMPOSSIBLE_RULES.forEach(function(r, i) {
    html += '<div class="imp-card">'
      + '<div class="imp-head">' + (i+1) + '. ' + r.head + '</div>'
      + '<div class="imp-visual">'
      + impChip(r.left)
      + '<span class="imp-x">✕</span>'
      + impChip(r.right)
      + '</div>'
      + '<div class="imp-note">' + r.note + '</div>'
      + (r.exception ? '<div class="imp-exception">◯ 例外あり</div>' : '')
      + '</div>';
  });
  html += '</div>';
  return html;
}

function renderPuzzleSection() {
  var html = '<div class="puzzle-intro">🧩 タップした順番で下の四角にはめ込んで、文を組み立てよう。セットになりやすい品詞の組み合わせを体で覚えるパズルだよ。わからないときは各パズルの「💡 コツを見る」を押そう。</div>';
  html += renderImpossibleRules();
  PUZZLES.forEach(function(p, i) {
    html += renderPuzzleCard(p, i);
  });
  return html;
}

function refreshPuzzle(idx) {
  var puzzle = PUZZLES[idx];
  var card = document.getElementById('puzzle-' + idx);
  if (!card) return;
  var tmp = document.createElement('div');
  tmp.innerHTML = renderPuzzleCard(puzzle, idx);
  card.replaceWith(tmp.firstChild);
  wirePuzzle(idx);
}

function wirePuzzle(idx) {
  document.querySelectorAll('.puzzle-chunk-btn[data-puzzle="' + idx + '"]').forEach(function(btn) {
    btn.addEventListener('click', function() { handlePuzzleTap(idx, parseInt(btn.dataset.chunk)); });
  });
  var hintBtn = document.getElementById('hint-btn-' + idx);
  var hintBox = document.getElementById('hint-box-' + idx);
  if (hintBtn && hintBox) {
    hintBtn.addEventListener('click', function() {
      var showing = hintBox.style.display === 'block';
      hintBox.style.display = showing ? 'none' : 'block';
    });
  }
}

function handlePuzzleTap(idx, chunkIdx) {
  var st = puzzleState[idx];
  if (st.solved) return;
  st.pool = st.pool.filter(function(c) { return c !== chunkIdx; });
  st.filled.push(chunkIdx);
  var puzzle = PUZZLES[idx];

  if (st.filled.length === puzzle.chunks.length) {
    var correct = st.filled.every(function(c, i) { return c === i; });
    if (correct) {
      st.solved = true;
      refreshPuzzle(idx);
      var formula = puzzle.chunks.map(function(c) { return c.pos; }).join(' ＋ ');
      var res = document.getElementById('puzzle-result-' + idx);
      if (res) { res.className = 'puzzle-result puzzle-correct'; res.textContent = '🎉 正解！ ' + formula + ' の組み合わせ！'; }
    } else {
      refreshPuzzle(idx);
      var card = document.getElementById('puzzle-' + idx);
      if (card) { card.classList.add('puzzle-shake'); setTimeout(function(){ card.classList.remove('puzzle-shake'); }, 400); }
      var res2 = document.getElementById('puzzle-result-' + idx);
      if (res2) { res2.className = 'puzzle-result puzzle-wrong'; res2.textContent = '✗ 順番が違うかも。もう一度！'; }
      setTimeout(function() {
        st.pool = shuffle(puzzle.chunks.map(function(c, i) { return i; }));
        st.filled = [];
        refreshPuzzle(idx);
      }, 1200);
    }
  } else {
    refreshPuzzle(idx);
  }
}

var POS_FLOW_SVG = '<svg viewBox="0 0 340 300" style="width:100%;max-width:380px;display:block;margin:0 auto">'
  + '<rect x="10" y="10" width="320" height="46" rx="8" fill="rgba(163,113,247,0.12)" stroke="#a371f7" stroke-width="2"/>'
  + '<text x="170" y="30" fill="#a371f7" font-size="12" text-anchor="middle">① それだけで文節を作れる？</text>'
  + '<text x="170" y="46" fill="#8b949e" font-size="10" text-anchor="middle">YES→自立語　NO→付属語</text>'
  + '<path d="M 170,56 L 170,72" stroke="#8b949e" stroke-width="2" marker-end="url(#rArrow)"/>'
  + '<rect x="10" y="74" width="320" height="46" rx="8" fill="rgba(14,165,233,0.12)" stroke="#0ea5e9" stroke-width="2"/>'
  + '<text x="170" y="94" fill="#0ea5e9" font-size="12" text-anchor="middle">② （自立語なら）活用する？</text>'
  + '<text x="170" y="110" fill="#8b949e" font-size="10" text-anchor="middle">YES→用言（動詞･形容詞･形容動詞）</text>'
  + '<path d="M 170,120 L 170,136" stroke="#8b949e" stroke-width="2" marker-end="url(#rArrow)"/>'
  + '<rect x="10" y="138" width="320" height="46" rx="8" fill="rgba(245,197,24,0.12)" stroke="#f5c518" stroke-width="2"/>'
  + '<text x="170" y="158" fill="#f5c518" font-size="12" text-anchor="middle">③ （活用しないなら）主語になる？</text>'
  + '<text x="170" y="174" fill="#8b949e" font-size="10" text-anchor="middle">YES→名詞　NO→副詞･連体詞･接続詞･感動詞</text>'
  + '<path d="M 170,184 L 170,200" stroke="#8b949e" stroke-width="2" marker-end="url(#rArrow)"/>'
  + '<rect x="10" y="202" width="320" height="46" rx="8" fill="rgba(63,185,80,0.12)" stroke="#3fb950" stroke-width="2"/>'
  + '<text x="170" y="222" fill="#3fb950" font-size="12" text-anchor="middle">④ （付属語なら）活用する？</text>'
  + '<text x="170" y="238" fill="#8b949e" font-size="10" text-anchor="middle">YES→助動詞　NO→助詞</text>'
  + '<path d="M 170,248 L 170,264" stroke="#8b949e" stroke-width="2" marker-end="url(#rArrow)"/>'
  + '<rect x="10" y="266" width="320" height="30" rx="8" fill="rgba(233,69,96,0.10)" stroke="#e94560" stroke-width="1.5"/>'
  + '<text x="170" y="286" fill="#e94560" font-size="11" text-anchor="middle">用言の言い切り：動詞=ウ段／形容詞=い／形容動詞=だ</text>'
  + '<defs><marker id="rArrow" markerWidth="8" markerHeight="8" refX="4" refY="6" orient="auto"><path d="M0,0 L8,0 L4,7 Z" fill="#8b949e"/></marker></defs>'
  + '</svg>';

function renderSentenceBoard() {
  var html = '<div class="sentence-flow">';
  SENTENCE.forEach(function(w, i) {
    var color = POS_COLORS[w.pos];
    html += '<div class="word-chip word-chip-clickable" data-jump="' + posId(w.pos) + '" title="「' + w.pos + '」の行にジャンプ">'
      + '<div class="w-text" style="background:' + color + '">' + w.text + '</div>'
      + '<div class="w-pos" style="background:' + color + '">' + w.pos + '</div>'
      + '</div>';
  });
  html += '</div>'
    + '<div class="sentence-note">この1つの文の中に、10品詞ぜんぶが登場している。色つきの単語をタップすると②の表にジャンプするよ！</div>';
  return html;
}

function renderPosTable() {
  var rows = '';
  POS_ROWS.forEach(function(r) {
    var color = POS_COLORS[r.pos];
    var moreHtml = (r.more && r.more.length) ? '<div class="pos-more">ほかに：' + r.more.join('・') + '</div>' : '';
    rows += '<tr id="' + posId(r.pos) + '"' + (r.groupEnd ? ' class="group-divider"' : '') + '>'
      + '<td><div class="pos-name-cell"><span class="pos-dot" style="background:' + color + '"></span>' + r.pos + '</div></td>'
      + '<td class="pos-word-highlight">' + r.word + moreHtml + '</td>'
      + '<td><span class="pos-tag" style="background:' + (r.kind === '自立語' ? '#3fb950' : '#e94560') + '">' + r.kind + '</span></td>'
      + '<td>' + r.katsuyo + '</td>'
      + '<td>' + r.tip + '</td>'
      + '</tr>';
  });
  return '<div class="pos-table-wrap"><table class="pos-table">'
    + '<thead><tr><th>品詞</th><th>例文中の単語</th><th>自立語/付属語</th><th>活用</th><th>見分け方のポイント</th></tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table></div>';
}

function jumpToPosRow(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior:'smooth', block:'center' });
  el.classList.add('row-flash');
  setTimeout(function() { el.classList.remove('row-flash'); }, 1600);
}

function render() {
  initPuzzleState();

  var html = '';
  html += '<div class="ref-intro">📖 品詞は毎回バラバラの例文で覚えると混乱しやすい。ここでは<strong style="color:var(--gold)">たった1つの例文</strong>を使い回して、10品詞の違いを一度に見比べられるようにしてある。迷ったらこのページに戻ってきて確認しよう。</div>';

  html += '<div class="ref-section-title">① 例文でぜんぶ見る</div>';
  html += '<div class="sentence-board">' + renderSentenceBoard() + '</div>';

  html += '<div class="ref-section-title">② 品詞対照表（同じ例文の単語で比較）</div>';
  html += renderPosTable();

  html += '<div class="ref-section-title">③ 見分け方フローチャート（おさらい）</div>';
  html += '<div class="flow-recap">' + POS_FLOW_SVG + '</div>';

  html += '<div class="ref-section-title">④ 品詞パズル（タップして組み立てよう）</div>';
  html += renderPuzzleSection();

  html += '<div class="ref-actions">'
    + '<button class="print-btn" id="printBtn">🖨️ 印刷してデスクに貼る</button>'
    + '<a class="back-link" href="jpn_grammar_review.html">← 文法総復習（品詞の分類セクション）にもどる</a>'
    + '</div>';

  document.getElementById('refMain').innerHTML = html;

  document.querySelectorAll('.word-chip-clickable[data-jump]').forEach(function(chip) {
    chip.addEventListener('click', function() { jumpToPosRow(chip.dataset.jump); });
  });

  PUZZLES.forEach(function(p, i) { wirePuzzle(i); });

  var pb = document.getElementById('printBtn');
  if (pb) pb.addEventListener('click', function() { window.print(); });
}

render();
