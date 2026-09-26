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
      { label:'Unit0 基礎復習',              href:'english_reading/nh3_unit0.html',             weakDb:'nh3',  qidPrefix:'s' },
      { label:'Unit1（受け身）',             href:'english_reading/nh3_units123.html?unit=1',    weakDb:'nh3', qidPrefix:'1_' },
      { label:'Unit2（現在完了①）',         href:'english_reading/nh3_units123.html?unit=2',    weakDb:'nh3', qidPrefix:'2_' },
      { label:'Unit2（現在完了②）',         href:'english_reading/nh3_units123.html?unit=3',    weakDb:'nh3', qidPrefix:'3_' },
      { label:'Unit3（不定詞）',             href:'english_reading/nh3_units123.html?unit=4',    weakDb:'nh3', qidPrefix:'4_' },
      { label:'📘 中2英語復習（Unit1〜7）',  href:'english_reading/english_review_unit1-7.html', weakDb:'nh3',  qidPrefix:'nh3_rev_' },
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
      { label:'中3 生物の成長と生殖・遺伝', href:'science/sci_c4_life.html', weakDb:'sci', qidPrefix:'sci_life_' },
    ]
  },
  {
    key:'math', name:'数学', icon:'📐', color:'#a371f7',
    links:[
      { label:'中1 正の数・負の数', href:'math/math_c1_numbers.html',     weakDb:'math', qidPrefix:'math_nums_' },
      { label:'中1 図形',           href:'math/math_c1_geometry.html',    weakDb:'math', qidPrefix:'math_geo_' },
      { label:'中1 扇形・柱体・錐体（強化）', href:'math/math_c1_solids.html', weakDb:'math', qidPrefix:'math_solid_' },
      { label:'中1 文字式',         href:'math/math_c1_chars.html',       weakDb:'math', qidPrefix:'math_chars_' },
      { label:'中1 一次方程式',     href:'math/math_c1_equation.html',    weakDb:'math', qidPrefix:'math_eq_' },
      { label:'中1 比例・反比例',   href:'math/math_c1_proportion.html',  weakDb:'math', qidPrefix:'math_prop_' },
      { label:'中2 連立方程式',     href:'math/math_c2_simultaneous.html',weakDb:'math', qidPrefix:'math_sim_' },
      { label:'中3 平方根',         href:'math/math_c3_sqrt.html',        weakDb:'math', qidPrefix:'math_sqrt_' },
      { label:'中3 多項式・乗法公式・因数分解', href:'math/math_c3_polynomial.html', weakDb:'math', qidPrefix:'math_poly_' },
      { label:'中3 二次方程式（解の公式）', href:'math/math_c3_quadratic.html', weakDb:'math', qidPrefix:'math_quad_' },
      { label:'中2〜3 関数（一次関数・y=ax²）', href:'math/math_c3_function.html', weakDb:'math', qidPrefix:'math_func_' },
      { label:'🏆 入試 大問1 完全攻略（10問セット）', href:'math/math_exam_q1.html', weakDb:'math', qidPrefix:'math_q1_' },
    ]
  },
  {
    key:'soc', name:'社会', icon:'🌏', color:'#f59e0b',
    links:[
      { label:'歴史',               href:'social/soc_history.html',   weakDb:'soc', qidPrefix:'soc_hist_' },
      { label:'🗞️ 歴史ストーリーを読む', href:'social/soc_history_story.html' },
      { label:'地理（世界・日本）', href:'social/soc_geography.html', weakDb:'soc', qidPrefix:'soc_geo_' },
      { label:'⚖️ 公民（人権・政治・経済）入試頻出', href:'social/soc_civics.html', weakDb:'soc', qidPrefix:'soc_civ_' },
    ]
  },
  {
    key:'jpn', name:'国語', icon:'📖', color:'#a371f7',
    links:[
      { label:'🈂️ 漢字・語句（入試最重要）', href:'japanese/jpn_kanji_goi.html', weakDb:'jpn', qidPrefix:'jpn_kanji_' },
      { label:'🈶 紛らわしい漢字（定期テスト対策）', href:'japanese/jpn_kanji_magirawashii.html', weakDb:'jpn', qidPrefix:'jpn_magi_' },
      { label:'文法総復習（中1〜中3）', href:'japanese/jpn_grammar_review.html', weakDb:'jpn', qidPrefix:'jpn_gram_' },
      { label:'🔖 品詞早見表', href:'japanese/jpn_pos_reference.html' },
      { label:'🐾 活用形まとめ（現代文）', href:'japanese/jpn_gendai_henkaku.html' },
      { label:'🐾 活用形まとめ（古文）', href:'japanese/jpn_henkaku_katsuyo.html' },
      { label:'🐕 表現技法まとめ', href:'japanese/jpn_hyogen_gihou.html' },
      { label:'🏯 古文基礎', href:'japanese/jpn_kobun_basics.html', weakDb:'jpn', qidPrefix:'jpn_kobun_' },
      { label:'📜 古文まとめ（重要事項オール1）', href:'japanese/jpn_kobun_reference.html' },
      { label:'🎭 古文コント台本（印刷用）', href:'japanese/jpn_kobun_konto.html' },
    ]
  },
];

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
function getLevel(xp) {
  let lv = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.minXp) lv = l; }
  return lv;
}

function getLevelProgress(xp) {
  const cur = getLevel(xp);
  const idx = LEVELS.indexOf(cur);
  if (idx === LEVELS.length - 1) return { pct: 100, from: xp, to: '最高ランク到達！' };
  const next = LEVELS[idx + 1];
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
function renderSubjects() {
  const grid = document.getElementById('subjectGrid');
  grid.innerHTML = '';

  SUBJECTS.forEach(s => {
    const xp = getXp(s.key);
    const weak = getWeakCount(s.key);
    const lv = getLevel(xp);
    const prog = getLevelProgress(xp);
    const hasLinks = s.links.length > 0;

    const div = document.createElement('div');
    div.className = 'subject-card' + (hasLinks ? '' : ' locked-subject');

    let linksHtml = '';
    if (hasLinks) {
      linksHtml = '<div class="subject-links">' +
        s.links.map(l => {
          const weak = l.weakDb ? isUnitWeak(l.weakDb, l.qidPrefix) : false;
          const tag = weak ? ' <span class="unit-weak-tag">苦手</span>' : '';
          return `<a class="subject-link${weak ? ' is-weak' : ''}" href="${l.href}">▶ ${l.label}${tag}</a>`;
        }).join('') +
        '</div>';
    } else {
      linksHtml = '<div style="font-size:0.78rem;color:var(--muted);margin-top:8px;">🔒 準備中</div>';
    }

    div.innerHTML = `
      <div class="subject-header">
        <div class="subject-name" style="color:${s.color}">${s.icon} ${s.name}</div>
        ${weak > 0 ? `<span class="weak-badge">弱点 ${weak}問</span>` : ''}
      </div>
      <div style="font-size:0.82rem;color:var(--muted);">${lv.emoji} Lv.${lv.lv} ${lv.title} — ${xp} XP</div>
      <div class="subject-xp-bar">
        <div class="subject-xp-fill" style="width:${Math.min(prog.pct,100)}%;background:${s.color};"></div>
      </div>
      ${linksHtml}
    `;
    grid.appendChild(div);
  });
}

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
    const dateStr = d.toISOString().slice(0, 10);
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

  const todayTotal = data[today.toISOString().slice(0,10)] || 0;
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

// ====== 初期化 ======
function init() {
  renderKyon();
  renderSubjects();
  renderChars();
  renderCalendar();
}

init();
