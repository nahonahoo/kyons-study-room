// ====== 吉本レベル定義 ======
const LEVELS = [
  { lv:1, emoji:'🥚', title:'NSC入学',         role:'見習い研修生', quote:'「勉強？なにそれ食えるの？」',          minXp:0   },
  { lv:2, emoji:'🎤', title:'NSC卒業',         role:'一般社員',     quote:'「なんとなくわかってきた気がする」',     minXp:100 },
  { lv:3, emoji:'🎭', title:'劇場デビュー',    role:'主任',         quote:'「にっくん、俺英語できるかも」',         minXp:250 },
  { lv:4, emoji:'⭐', title:'準レギュラー獲得',role:'係長',         quote:'「もしかして俺天才？」',                 minXp:450 },
  { lv:5, emoji:'📺', title:'全国ネット',      role:'課長',         quote:'「にっくんより賢くなってきた」',         minXp:700 },
  { lv:6, emoji:'🌟', title:'冠番組獲得',      role:'部長',         quote:'「英語で漫才できるかもしれない」',       minXp:1000},
  { lv:7, emoji:'🏆', title:'M-1決勝進出',     role:'取締役',       quote:'「もうにっくんいらないかも」',           minXp:1400},
  { lv:8, emoji:'👑', title:'M-1グランプリ優勝',role:'社長',        quote:'「俺、令和ロマンに勝ったわ」',           minXp:2000},
];

// ====== 教科定義 ======
// weakDb: localStorage キー（{weakDb}_weakdb）, qidPrefix: 問題IDの先頭文字列
// label はスマホで1行に収まる長さ（20文字まで）にする。group は1本にまとめた番号チップ（歴史ストーリー新聞）
const SUBJECTS = [
  {
    key:'exam', name:'入試対策（全教科共通）', icon:'🔍', color:'#f5c518',
    links:[
      { label:'🔍 設問の読み方トレーニング', href:'setsumon_training.html', weakDb:'exam', qidPrefix:'exam_setsu_' },
    ]
  },
  {
    key:'nh3', name:'英語', icon:'🇬🇧', color:'#3b82f6',
    links:[
      { label:'📖 英単語ネタ帳（呪文で覚える）', href:'english_reading/eng_vocab.html' },
      { label:'📖 時制表',                 href:'english_reading/eng_tense_chart.html' },
      { label:'Unit0 基礎復習',            href:'english_reading/nh3_unit0.html',             weakDb:'nh3',  qidPrefix:'s' },
      { label:'受け身（中2の復習）',        href:'english_reading/nh3_units123.html?unit=1',    weakDb:'nh3', qidPrefix:'1_' },
      { label:'🔁 受け身 総復習',           href:'english_reading/eng_passive_review.html', weakDb:'nh3', qidPrefix:'pv_' },
      { label:'⏳ 時制と受け身 まとめ',      href:'english_reading/eng_tense_passive.html', weakDb:'nh3', qidPrefix:'tn_' },
      { label:'Unit1 現在完了（経験）・make/tell', href:'english_reading/nh3_units123.html?unit=2', weakDb:'nh3', qidPrefix:'2_' },
      { label:'Unit2 現在完了（完了・継続）',  href:'english_reading/nh3_units123.html?unit=3',    weakDb:'nh3', qidPrefix:'3_' },
      { label:'Unit3 不定詞',              href:'english_reading/nh3_units123.html?unit=4',    weakDb:'nh3', qidPrefix:'4_' },
      { label:'Unit4 間接疑問文・分詞',     href:'english_reading/nh3_units456.html?unit=4',    weakDb:'nh3', qidPrefix:'u4_' },
      { label:'Unit5 関係代名詞',          href:'english_reading/nh3_units456.html?unit=5',    weakDb:'nh3', qidPrefix:'u5_' },
      { label:'Unit6 仮定法',              href:'english_reading/nh3_units456.html?unit=6',    weakDb:'nh3', qidPrefix:'u6_' },
      { label:'📗 Unit4〜 単語練習',         href:'english_reading/nh3_words_u4.html' },
      { label:'📘 中2英語復習（Unit1〜7）', href:'english_reading/english_review_unit1-7.html', weakDb:'nh3',  qidPrefix:'nh3_rev_' },
      { label:'🎧 リスニング（入試対策）',    href:'english_reading/eng_exam_listening.html', weakDb:'nh3', qidPrefix:'eng_ex_' },
    ]
  },
  {
    key:'sci', name:'理科', icon:'🧪', color:'#0ea5e9',
    links:[
      { label:'中1 物質・気体・水溶液', href:'science/sci_c1_matter.html',   weakDb:'sci', qidPrefix:'sci_s' },
      { label:'中1 力・光・音',         href:'science/sci_c1_force.html',    weakDb:'sci', qidPrefix:'sci_force_' },
      { label:'中2 化学変化・原子分子', href:'science/sci_c2_chem.html',     weakDb:'sci', qidPrefix:'sci_chem_' },
      { label:'中2 電流・磁界',         href:'science/sci_c2_electric.html', weakDb:'sci', qidPrefix:'sci_elec_' },
      { label:'中3 化学変化とイオン',   href:'science/sci_c3_ion.html',      weakDb:'sci', qidPrefix:'sci_ion_' },
      { label:'中3 生殖・遺伝・進化',   href:'science/sci_c4_life.html',     weakDb:'sci', qidPrefix:'sci_life_' },
      { label:'🔬 実験文の読み方（入試）', href:'science/sci_exam_lab.html',   weakDb:'sci', qidPrefix:'sci_lab_' },
      { label:'🌏 大地・地球と宇宙（入試）', href:'science/sci_earth.html',    weakDb:'sci', qidPrefix:'sci_earth_' },
    ]
  },
  {
    key:'math', name:'数学', icon:'📐', color:'#a371f7',
    links:[
      { label:'中1 正の数・負の数',   href:'math/math_c1_numbers.html',     weakDb:'math', qidPrefix:'math_nums_' },
      { label:'中1 図形',             href:'math/math_c1_geometry.html',    weakDb:'math', qidPrefix:'math_geo_' },
      { label:'中1 扇形・柱体・錐体', href:'math/math_c1_solids.html',      weakDb:'math', qidPrefix:'math_solid_' },
      { label:'中1 文字式',           href:'math/math_c1_chars.html',       weakDb:'math', qidPrefix:'math_chars_' },
      { label:'中1 一次方程式',       href:'math/math_c1_equation.html',    weakDb:'math', qidPrefix:'math_eq_' },
      { label:'中1 比例・反比例',     href:'math/math_c1_proportion.html',  weakDb:'math', qidPrefix:'math_prop_' },
      { label:'🧮 中2 式の計算',       href:'math/math_c2_expr.html',        weakDb:'math', qidPrefix:'math_expr_' },
      { label:'中2 連立方程式',       href:'math/math_c2_simultaneous.html',weakDb:'math', qidPrefix:'math_sim_' },
      { label:'📈 中2 一次関数',       href:'math/math_c2_linear.html',      weakDb:'math', qidPrefix:'math_lin_' },
      { label:'中3 平方根',           href:'math/math_c3_sqrt.html',        weakDb:'math', qidPrefix:'math_sqrt_' },
      { label:'中3 乗法公式・因数分解', href:'math/math_c3_polynomial.html', weakDb:'math', qidPrefix:'math_poly_' },
      { label:'中3 二次方程式',       href:'math/math_c3_quadratic.html',   weakDb:'math', qidPrefix:'math_quad_' },
      { label:'中2〜3 関数（y=ax²）',  href:'math/math_c3_function.html',    weakDb:'math', qidPrefix:'math_func_' },
      { label:'🎲 確率・データ・標本調査', href:'math/math_c2_prob_data.html', weakDb:'math', qidPrefix:'math_pd_' },
      { label:'🗞️ 新聞 図形と相似（まず読む）', href:'math/math_story_similar.html' },
      { label:'🔍 中3 図形と相似',     href:'math/math_c3_similar.html',     weakDb:'math', qidPrefix:'math_soji_' },
      { label:'⭕ 中3 円の性質',       href:'math/math_c3_circle.html',      weakDb:'math', qidPrefix:'math_circle_' },
      { label:'📏 中3 三平方の定理',   href:'math/math_c3_pythagoras.html',  weakDb:'math', qidPrefix:'math_sanp_' },
      { label:'中3 図形 大問3対策',    href:'math/math_c3_geometry.html',    weakDb:'math', qidPrefix:'math_geo3_' },
      { label:'🏆 入試 大問1 攻略',    href:'math/math_exam_q1.html',        weakDb:'math', qidPrefix:'math_q1_' },
    ]
  },
  {
    key:'soc', name:'社会', icon:'🌏', color:'#f59e0b',
    links:[
      { label:'歴史（問題）',         href:'social/soc_history.html',   weakDb:'soc', qidPrefix:'soc_hist_' },
      { label:'🗞️ 歴史ストーリー新聞 ①〜㉑', group:[
        { n:'①', t:'飛鳥',       href:'social/soc_story_asuka.html' },
        { n:'②', t:'奈良',       href:'social/soc_story_nara.html' },
        { n:'③', t:'平安',       href:'social/soc_story_heian.html' },
        { n:'④', t:'鎌倉',       href:'social/soc_story_kamakura.html' },
        { n:'⑤', t:'室町',       href:'social/soc_story_muromachi.html' },
        { n:'⑥', t:'安土桃山',   href:'social/soc_story_azuchi.html' },
        { n:'⑦', t:'江戸前半',   href:'social/soc_story_edo1.html' },
        { n:'⑧', t:'江戸中期',   href:'social/soc_story_edo2.html' },
        { n:'⑨', t:'江戸後半',   href:'social/soc_story_edo3.html' },
        { n:'⑩', t:'開国',       href:'social/soc_story_bakumatsu.html' },
        { n:'⑪', t:'明治維新',   href:'social/soc_story_meiji.html' },
        { n:'⑫', t:'憲法',       href:'social/soc_story_kenpo.html' },
        { n:'⑬', t:'日清・日露', href:'social/soc_story_nichiro.html' },
        { n:'⑭', t:'明治の文化', href:'social/soc_story_meijibunka.html' },
        { n:'⑮', t:'第一次大戦', href:'social/soc_story_taisen1.html' },
        { n:'⑯', t:'大正',       href:'social/soc_story_taisho.html' },
        { n:'⑰', t:'戦争への道', href:'social/soc_story_showa1.html' },
        { n:'⑱', t:'第二次大戦', href:'social/soc_story_taisen2.html' },
        { n:'⑲', t:'暮らしと終戦', href:'social/soc_story_shusen.html' },
        { n:'⑳', t:'戦後の改革', href:'social/soc_story_sengo1.html' },
        { n:'㉑', t:'高度成長と今', href:'social/soc_story_sengo2.html' },
      ] },
      { label:'地理（世界・日本）',   href:'social/soc_geography.html', weakDb:'soc', qidPrefix:'soc_geo_' },
      { label:'⚖️ 公民（入試頻出）',   href:'social/soc_civics.html',    weakDb:'soc', qidPrefix:'soc_civ_' },
      { label:'⚡ 公民 1問1答タイムアタック', href:'social/soc_civics_speed.html', weakDb:'soc', qidPrefix:'soc_civs_' },
    ]
  },
  {
    key:'jpn', name:'国語', icon:'📖', color:'#a371f7',
    links:[
      { label:'🈂️ 漢字・語句（入試最重要）', href:'japanese/jpn_kanji_goi.html', weakDb:'jpn', qidPrefix:'jpn_kanji_' },
      { label:'🈶 紛らわしい漢字',         href:'japanese/jpn_kanji_magirawashii.html', weakDb:'jpn', qidPrefix:'jpn_magi_' },
      { label:'文法総復習（中1〜3）',       href:'japanese/jpn_grammar_review.html', weakDb:'jpn', qidPrefix:'jpn_gram_' },
      { label:'🔖 品詞早見表',             href:'japanese/jpn_pos_reference.html' },
      { label:'🐾 活用形まとめ（現代文）',   href:'japanese/jpn_gendai_henkaku.html' },
      { label:'🐾 活用形まとめ（古文）',     href:'japanese/jpn_henkaku_katsuyo.html' },
      { label:'🐕 表現技法まとめ',          href:'japanese/jpn_hyogen_gihou.html' },
      { label:'🏯 古文基礎',               href:'japanese/jpn_kobun_basics.html', weakDb:'jpn', qidPrefix:'jpn_kobun_' },
      { label:'📜 古文まとめ',             href:'japanese/jpn_kobun_reference.html' },
      { label:'🎭 古文コント台本',          href:'japanese/jpn_kobun_konto.html' },
    ]
  },
];

// ====== ホーム画面の表示状態（この端末だけ。XP などの学習記録とは別） ======
// home_ui：{ open:{教科key:true/false}, grp:{グループid:true}, badges:true/false }
// home_recent：[{href,label,subject,t}]（ホームから開いたページ。新しい順・5件まで）
const UI_KEY = 'home_ui', RECENT_KEY = 'home_recent';
function loadJson(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch(e) { return d; } }
function saveJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }
function isNarrow() { return window.matchMedia('(max-width: 600px)').matches; }
function getRecent() { return loadJson(RECENT_KEY, []).filter(r => r && r.href); }
// 教科カードを開いておくか。手で開閉した記録があればそれ、無ければ PC は全部、スマホは最後に使った教科だけ
function isSubjectOpen(key) {
  const ui = loadJson(UI_KEY, {});
  if (ui.open && typeof ui.open[key] === 'boolean') return ui.open[key];
  if (!isNarrow()) return true;
  const rec = getRecent();
  return rec.length > 0 && rec[0].subject === key;
}
function setUi(fn) { const ui = loadJson(UI_KEY, {}); fn(ui); saveJson(UI_KEY, ui); }

// ====== 仲間キャラ定義 ======
const CHARS = [
  { name:'きょん',       emoji:'🎤', unlockXp:0,    note:'最初から仲間' },
  { name:'なかむらしゅん', emoji:'🎭', unlockXp:100,  note:'XP100で解放' },
  { name:'くるま',       emoji:'🚗', unlockXp:300,  note:'XP300で解放' },
  { name:'京極風斗',     emoji:'🎩', unlockXp:600,  note:'XP600で解放' },
  { name:'イワクラ',     emoji:'🎸', unlockXp:1000, note:'XP1000で解放' },
  { name:'ケムリ',       emoji:'💨', unlockXp:1500, note:'XP1500で解放' },
];

// ====== XP 読み込み ======
function getXp(key) {
  return parseInt(localStorage.getItem(key + '_xp') || '0', 10);
}

// ====== WeakDB 弱点数（教科全体） ======
function getWeakCount(key) {
  try {
    const db = JSON.parse(localStorage.getItem(key + '_weakdb') || '{}');
    return Object.values(db).filter(v => v.total > 0 && (v.correct / v.total) < 0.8).length;
  } catch(e) { return 0; }
}

// ====== 単元苦手判定（苦手な問題が4割以上あるか） ======
// 3回以上答えた問題だけを判定対象にし、正答率60%未満を「苦手な問題」とカウント。
// 取り組んだ問題が5問未満の単元（習い始め）はまだ判定しない。
// これにより「一巡目に間違えた問題」が特訓で正答率を取り戻せばすぐタグが消えるようになる
// （旧ロジックは全問題の累計不正解率だったため、最初の間違いが長く尾を引いていた）
function isUnitWeak(dbKey, qidPrefix) {
  try {
    const db = JSON.parse(localStorage.getItem(dbKey + '_weakdb') || '{}');
    let seenQ = 0, weakQ = 0;
    Object.entries(db).forEach(([qid, v]) => {
      if (qidPrefix && !qid.startsWith(qidPrefix)) return;
      if (!v.total || v.total < 3) return;
      seenQ++;
      if (v.correct / v.total < 0.6) weakQ++;
    });
    if (seenQ < 5) return false;
    return (weakQ / seenQ) >= 0.4;
  } catch(e) { return false; }
}

// ====== レベル計算 ======
// 教科ごとのレベルは、各教科ページと同じ表（0/15/40/80/140/220/320/440）で計算する。
// きょんの総合レベルは全教科の合計XPなので、上の LEVELS（100〜2000）を使う。
const SUBJECT_MINS = [0, 15, 40, 80, 140, 220, 320, 440];
const SUBJECT_LEVELS = LEVELS.map((l, i) => Object.assign({}, l, { minXp: SUBJECT_MINS[i] }));

function getLevel(xp, table) {
  const T = table || LEVELS;
  let lv = T[0];
  for (const l of T) { if (xp >= l.minXp) lv = l; }
  return lv;
}

function getLevelProgress(xp, table) {
  const T = table || LEVELS;
  const cur = getLevel(xp, T);
  const idx = T.indexOf(cur);
  if (idx === T.length - 1) return { pct: 100, from: xp, to: '最高ランク到達！' };
  const next = T[idx + 1];
  const pct = Math.round(((xp - cur.minXp) / (next.minXp - cur.minXp)) * 100);
  return { pct, from: xp - cur.minXp, to: next.minXp - cur.minXp };
}

// ====== 総合XP ======
function getTotalXp() {
  return SUBJECTS.reduce((sum, s) => sum + getXp(s.key), 0);
}

// ====== きょんブロック描画 ======
function renderKyon() {
  const total = getTotalXp();
  const lv = getLevel(total);
  const prog = getLevelProgress(total);

  document.getElementById('kyonAvatar').textContent = lv.emoji;
  document.getElementById('kyonStatus').textContent = lv.title + '（' + lv.role + '）';
  document.getElementById('kyonStatusLine').textContent = 'Lv.' + lv.lv + ' — 全教科合計XP';
  document.getElementById('kyonQuote').textContent = lv.quote;
  document.getElementById('totalXpVal').textContent = total;
  // 教科ページの右上「🪙」と同じ、使えるXP（ショップで使った分を引いた数）
  const spent = parseInt(localStorage.getItem('shop_spent') || '0', 10) || 0;
  const coinEl = document.getElementById('coinXpLine');
  if (coinEl) coinEl.textContent = spent > 0 ? '🪙 使えるXP: ' + Math.max(0, total - spent) + '（ショップで ' + spent + ' 使用）' : '🪙 使えるXP: ' + total;

  const bar = document.getElementById('totalXpBar');
  bar.style.width = Math.min(prog.pct, 100) + '%';

  if (typeof prog.to === 'string') {
    document.getElementById('xpBarFrom').textContent = '★ ' + prog.to;
    document.getElementById('xpBarTo').textContent = '';
  } else {
    document.getElementById('xpBarFrom').textContent = prog.from + ' / ' + prog.to + ' XP';
    document.getElementById('xpBarTo').textContent = 'Lv.' + (lv.lv + 1) + 'まで';
  }

  // バッジグリッド
  const grid = document.getElementById('badgeGrid');
  grid.innerHTML = '';
  LEVELS.forEach(l => {
    const earned = total >= l.minXp;
    const div = document.createElement('div');
    div.className = 'badge ' + (earned ? 'earned' : 'locked');
    div.innerHTML = l.emoji + ' Lv.' + l.lv + ' ' + l.title;
    grid.appendChild(div);
  });
}

// ====== 教科グリッド描画 ======
// 1本のリンク。data-track があると、タップしたときに「つづきから」に記録される
function linkHtml(l, s) {
  const weak = l.weakDb ? isUnitWeak(l.weakDb, l.qidPrefix) : false;
  const tag = weak ? ' <span class="unit-weak-tag">苦手</span>' : '';
  return `<a class="subject-link${weak ? ' is-weak' : ''}" href="${l.href}" data-track="${l.label}" data-subject="${s.key}">▶ ${l.label}${tag}</a>`;
}
// 番号チップにまとめたグループ（歴史ストーリー新聞）。タップで開閉
function groupHtml(l, s, i) {
  const id = s.key + '_' + i;
  const open = !!(loadJson(UI_KEY, {}).grp || {})[id];
  return `<div class="link-group">
    <button type="button" class="subject-link group-btn" data-grp="${id}">${l.label}<span class="grp-count">${l.group.length}本 ${open ? '▲' : '▼'}</span></button>
    <div class="story-chips"${open ? '' : ' style="display:none"'}>` +
    l.group.map(g => `<a class="story-chip" href="${g.href}" data-track="🗞️ 歴史 ${g.n}${g.t}" data-subject="${s.key}">${g.n}${g.t}</a>`).join('') +
    `</div></div>`;
}
function renderSubjects() {
  const grid = document.getElementById('subjectGrid');
  grid.innerHTML = '';

  SUBJECTS.forEach(s => {
    const xp = getXp(s.key);
    const weak = getWeakCount(s.key);
    const lv = getLevel(xp, SUBJECT_LEVELS);
    const prog = getLevelProgress(xp, SUBJECT_LEVELS);
    const hasLinks = s.links.length > 0;
    const open = isSubjectOpen(s.key);
    const pageCount = s.links.reduce((n, l) => n + (l.group ? l.group.length : 1), 0);

    const div = document.createElement('div');
    div.className = 'subject-card' + (hasLinks ? '' : ' locked-subject') + (open ? '' : ' is-closed');

    let linksHtml = '';
    if (hasLinks && open) {
      linksHtml = '<div class="subject-links">' +
        s.links.map((l, i) => l.group ? groupHtml(l, s, i) : linkHtml(l, s)).join('') +
        '</div>' +
        `<button type="button" class="fold-btn" data-toggle="${s.key}" data-open="0">▲ とじる</button>`;
    } else if (hasLinks) {
      // 畳んでいるときも、苦手タグのついたページだけは見せる
      const weakLinks = s.links.filter(l => l.weakDb && isUnitWeak(l.weakDb, l.qidPrefix));
      linksHtml = (weakLinks.length ? '<div class="subject-links">' + weakLinks.map(l => linkHtml(l, s)).join('') + '</div>' : '') +
        `<button type="button" class="fold-btn" data-toggle="${s.key}" data-open="1">▼ ひらく（${pageCount}ページ）</button>`;
    } else {
      linksHtml = '<div style="font-size:0.78rem;color:var(--muted);margin-top:8px;">🔒 準備中</div>';
    }

    div.innerHTML = `
      <div class="subject-header">
        <div class="subject-name" style="color:${s.color}">${s.icon} ${s.name}</div>
        ${weak > 0 ? `<span class="weak-badge">弱点 ${weak}問</span>` : ''}
      </div>
      <div style="font-size:0.82rem;color:var(--muted);">${lv.emoji} Lv.${lv.lv} ${lv.title} — ${xp} XP</div>
      ${s.key === 'nh3' && vocabSummary() ? `<div style="font-size:0.8rem;color:var(--green);margin-top:4px;">${vocabSummary()}</div>` : ''}
      <div class="subject-xp-bar">
        <div class="subject-xp-fill" style="width:${Math.min(prog.pct,100)}%;background:${s.color};"></div>
      </div>
      ${linksHtml}
    `;
    grid.appendChild(div);
  });
}

// ====== つづきから（ホームから最後に開いた3ページ） ======
function renderRecent() {
  const card = document.getElementById('recentCard'), box = document.getElementById('recentLinks');
  if (!card || !box) return;
  const rec = getRecent().slice(0, 3);
  card.style.display = rec.length ? '' : 'none';
  box.innerHTML = rec.map(r => {
    const s = SUBJECTS.find(x => x.key === r.subject) || { icon:'', name:'', color:'var(--gold)' };
    return `<a class="recent-link" href="${r.href}" data-track="${r.label}" data-subject="${r.subject}" style="border-left-color:${s.color}">${r.label}<small>${s.icon} ${s.name}</small></a>`;
  }).join('');
}

// ====== 称号バッジの開閉 ======
function renderBadgeToggle() {
  const btn = document.getElementById('badgeToggle'), grid = document.getElementById('badgeGrid');
  if (!btn || !grid) return;
  const ui = loadJson(UI_KEY, {});
  const open = typeof ui.badges === 'boolean' ? ui.badges : !isNarrow();
  grid.style.display = open ? '' : 'none';
  btn.textContent = open ? '🏅 称号をとじる ▲' : '🏅 称号を見る ▼';
}

// ホームのタップ：ページへ行くときは「つづきから」に記録、開閉ボタンは状態を保存して描き直す
document.addEventListener('click', function(e) {
  const a = e.target.closest('a[data-track]');
  if (a) {
    const href = a.getAttribute('href');
    const rec = getRecent().filter(r => r.href !== href);
    rec.unshift({ href, label: a.getAttribute('data-track'), subject: a.getAttribute('data-subject'), t: Date.now() });
    saveJson(RECENT_KEY, rec.slice(0, 5));
    setUi(ui => { ui.open = {}; });   // 次にホームへ戻ったとき、いま使っている教科だけが開く
    return;
  }
  const t = e.target.closest('[data-toggle]');
  if (t) { setUi(ui => { ui.open = ui.open || {}; ui.open[t.getAttribute('data-toggle')] = t.getAttribute('data-open') === '1'; }); renderSubjects(); return; }
  const g = e.target.closest('[data-grp]');
  if (g) { setUi(ui => { ui.grp = ui.grp || {}; ui.grp[g.getAttribute('data-grp')] = !ui.grp[g.getAttribute('data-grp')]; }); renderSubjects(); return; }
  if (e.target.closest('#badgeToggle')) {
    setUi(ui => { ui.badges = document.getElementById('badgeGrid').style.display === 'none'; });
    renderBadgeToggle();
  }
});

// ====== キャラグリッド描画 ======
function renderChars() {
  const total = getTotalXp();
  const grid = document.getElementById('charGrid');
  grid.innerHTML = '';

  CHARS.forEach(c => {
    const unlocked = total >= c.unlockXp;
    const div = document.createElement('div');
    div.className = 'char-card ' + (unlocked ? 'unlocked' : 'locked-char');
    div.innerHTML = `
      <div class="char-avatar">${c.emoji}</div>
      <div class="char-name">${c.name}</div>
      <div class="char-unlock">${unlocked ? '✅ 解放済み' : c.note}</div>
    `;
    grid.appendChild(div);
  });
}

// ====== 学習カレンダー ======
// 日付は端末の時刻で数える（toISOString のままだと世界標準時になり、日本の朝9時まで「昨日」になる）
function localDateStr(d) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function getDailyData() {
  const data = {};
  ['nh3', 'sci', 'math', 'soc', 'jpn', 'exam'].forEach(key => {
    try {
      const d = JSON.parse(localStorage.getItem(key + '_daily') || '{}');
      Object.entries(d).forEach(([date, count]) => {
        data[date] = (data[date] || 0) + count;
      });
    } catch(e) {}
  });
  return data;
}

function renderCalendar() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;
  const data = getDailyData();
  const today = new Date();
  const days = 28;
  const cells = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = localDateStr(d);
    const count = data[dateStr] || 0;
    let color = '#21262d';
    if (count >= 20) color = '#39d353';
    else if (count >= 10) color = '#26a641';
    else if (count >= 5) color = '#006d32';
    else if (count >= 1) color = '#0e4429';
    const isToday = i === 0;
    cells.push({ dateStr, count, color, isToday });
  }

  grid.innerHTML = cells.map(c =>
    `<div class="cal-cell" style="background:${c.color};${c.isToday ? 'outline:2px solid var(--gold);outline-offset:1px;' : ''}" data-tip="${c.dateStr}: ${c.count}問" title="${c.dateStr}: ${c.count}問"></div>`
  ).join('');

  const oldEl = document.getElementById('calOldDate');
  if (oldEl && cells.length > 0) oldEl.textContent = cells[0].dateStr;

  const todayTotal = data[localDateStr(today)] || 0;
  const todayEl = document.getElementById('calTodayLabel');
  if (todayEl) {
    if (todayTotal > 0) {
      todayEl.textContent = '今日の学習: ' + todayTotal + '問 ✅ きょん「今日もやった！！」';
      todayEl.style.color = 'var(--green)';
    } else {
      todayEl.textContent = '今日はまだ学習していません。教科ページへ行こう！';
    }
  }
}

// ====== 英単語ネタ帳のようす（英語カードの下に出す） ======
// nh3_vocab_srs：{単語:{b:箱,...}}（箱3以上＝覚えた）、nh3_vocab_meta：{streak, last（日番号）, days:{日番号:回数}}
function vocabSummary() {
  try {
    const srs = JSON.parse(localStorage.getItem('nh3_vocab_srs') || '{}');
    const meta = JSON.parse(localStorage.getItem('nh3_vocab_meta') || '{}');
    const d = new Date();
    const t = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
    let learned = 0; for (const k in srs) if (srs[k] && srs[k].b >= 3) learned++;
    const streak = (meta.last === t || meta.last === t - 1) ? (meta.streak || 0) : 0;
    const todayN = (meta.days && meta.days[t]) || 0;
    if (!learned && !streak && !todayN && !Object.keys(srs).length) return '';
    return '📖 ネタ帳：覚えた単語 ' + learned + ' 語' + (streak ? '・🔥' + streak + '日連続' : '') + (todayN ? '・今日 ' + todayN + ' 問' : '');
  } catch(e) { return ''; }
}

// ====== 初期化 ======
function init() {
  renderKyon();
  renderBadgeToggle();
  renderRecent();
  renderSubjects();
  renderChars();
  renderCalendar();
}

init();

// スマホで「戻る」や別タブからホームへ帰ってきたとき、画面が古いまま（bfcache・タブ復帰）だと
// 教科ページで増えたXPがホームに出ない。表示し直すたびに読み直す。
window.addEventListener('pageshow', function(e) { if (e.persisted) init(); });
document.addEventListener('visibilitychange', function() { if (document.visibilityState === 'visible') init(); });
window.addEventListener('focus', init);
window.addEventListener('storage', init);
