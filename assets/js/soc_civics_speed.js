// ===== 公民 1問1答タイムアタック =====
// 範囲：東京書籍「新編 新しい社会 公民」（令和7年度版）2章 個人の尊重と日本国憲法（全3節）〜3章 現代の民主政治と社会（全3節）〜4章 私たちの暮らしと経済 1節 消費生活と経済（1 私たちの消費生活〜4 消費生活を支える流通）。項目は東京書籍の年間指導計画作成資料（2025年1月29日版）で照合済み
// qid は 'soc_civs_' + id。id は並べかえ・使い回し禁止（解いた記録がずれるため）。問題を足すときは新しい id で末尾に。
// XP・弱点DB は社会共通（soc_xp / soc_weakdb）。このページ専用のキーは soc_civs_ で始める。

var QID_PREFIX = 'soc_civs_';
var CH_NAME = { 2:'2章 個人の尊重と日本国憲法', 3:'3章 現代の民主政治と社会', 4:'4章 私たちの暮らしと経済' };

var QUESTIONS = [
  // ---------- 2章 個人の尊重と日本国憲法 ----------
  { id:'c2_01', ch:2, q:'1776年、「すべての人は平等につくられ、生命・自由・幸福の追求の権利をあたえられている」とうたって、イギリスから独立したときに出された宣言は？',
    a:'アメリカ独立宣言', w:['フランス人権宣言','権利章典','ワイマール憲法'],
    rule:'人権の歴史は「イギリス→アメリカ→フランス→ドイツ」の順。1689年 権利章典（英）→ 1776年 独立宣言（米）→ 1789年 人権宣言（仏）→ 1919年 ワイマール憲法（独）。',
    ok:'1776年・「幸福の追求」＝アメリカ独立宣言', ng:'「人は生まれながらに自由で平等な権利をもつ」はフランス人権宣言（1789年・フランス革命のとき）', tip:'イ・ナ・ナ・ロー（1776）でアメリカ独立' },
  { id:'c2_02', ch:2, q:'1919年、世界で初めて「社会権（人間らしい生活を送る権利）」を定めた憲法は？',
    a:'ワイマール憲法', w:['大日本帝国憲法','アメリカ合衆国憲法','権利章典'],
    rule:'18世紀に生まれたのは「自由権」（国から自由にしてもらう権利）。20世紀に生まれたのが「社会権」（国に生活を保障してもらう権利）。社会権の第1号がドイツのワイマール憲法。',
    ok:'社会権の始まり＝ワイマール憲法（1919年・ドイツ）', ng:'権利章典（1689年・イギリス）は国王の力をおさえたもので、社会権ではない', tip:'「ワイワイ（ワイマール）みんなで人間らしく」＝社会権' },
  { id:'c2_03', ch:2, q:'『法の精神』を書き、権力を立法・行政・司法の3つに分ける「三権分立」を説いたフランスの思想家は？',
    a:'モンテスキュー', w:['ロック','ルソー','リンカン'],
    rule:'思想家3人はセットで出る。ロック＝抵抗権（イギリス）、モンテスキュー＝三権分立（フランス）、ルソー＝人民主権『社会契約論』（フランス）。',
    ok:'三権分立＝モンテスキュー『法の精神』', ng:'ルソーは『社会契約論』で人民主権。三権分立ではない', tip:'モンテ（山）が3つ → 三権' },
  { id:'c2_04', ch:2, q:'国王や政府であっても、法に従わなければならないという考え方は？',
    a:'法の支配', w:['人の支配','国民主権','公共の福祉'],
    rule:'「人の支配」＝権力者が思いのままに決める。「法の支配」＝権力者も法の下にいる。人権を守るための大事な考え方。',
    ok:'政府も法にしばられる＝法の支配', ng:'「人の支配」は逆（権力者が好きに決める）', tip:'法 ＞ 権力者。法がいちばん上' },
  { id:'c2_05', ch:2, q:'日本国憲法が「公布」された日は？',
    a:'1946年11月3日', w:['1947年5月3日','1946年5月3日','1947年11月3日'],
    rule:'公布＝国民に知らせた日（1946年11月3日・今の文化の日）。施行＝効力が始まった日（1947年5月3日・今の憲法記念日）。',
    ok:'公布 1946年11月3日 → 半年後に施行 1947年5月3日', ng:'1947年5月3日は「施行」の日', tip:'祝日で覚える：文化の日（公布）→ 憲法記念日（施行）' },
  { id:'c2_06', ch:2, q:'日本国憲法の三つの基本原理は「国民主権」「平和主義」と、もう１つは？',
    a:'基本的人権の尊重', w:['三権分立','法の下の平等','議院内閣制'],
    rule:'三大原理＝国民主権・基本的人権の尊重・平和主義。',
    ok:'国民主権＋基本的人権の尊重＋平和主義', ng:'三権分立は国の「しくみ」で、三大原理ではない', tip:'頭文字「こ・き・へ」（国民・基本的人権・平和）' },
  { id:'c2_07', ch:2, q:'天皇が内閣の助言と承認によって行う、形式的・儀礼的な仕事を何という？',
    a:'国事行為', w:['行政権','国政調査権','違憲審査権'],
    rule:'天皇は日本国と日本国民統合の「象徴」で、政治の権限はもたない。内閣の助言と承認で国事行為（法律の公布、国会の召集、衆議院の解散、内閣総理大臣の任命など）だけを行う。',
    ok:'天皇＝国事行為（責任は内閣がもつ）', ng:'国政調査権は国会の権限', tip:'天皇は「ハンコを押す役」。決めるのは内閣' },
  { id:'c2_08', ch:2, q:'戦争の放棄・戦力をもたないこと・交戦権を認めないことを定めた、憲法の条文は？',
    a:'第9条', w:['第1条','第25条','第96条'],
    rule:'第9条＝平和主義。第1条＝天皇は象徴、第25条＝生存権、第96条＝憲法改正の手続き。',
    ok:'平和主義＝第9条', ng:'第25条は生存権（健康で文化的な最低限度の生活）', tip:'「キュー（9）っと戦争をやめる」' },
  { id:'c2_09', ch:2, q:'アメリカ軍が日本国内に基地を置くことを認めている条約は？',
    a:'日米安全保障条約', w:['サンフランシスコ平和条約','日米修好通商条約','核拡散防止条約'],
    rule:'日米安全保障条約で、日本が攻撃されたときは日米が共同で対応する。日本国内のアメリカ軍専用の施設の約7割が沖縄県に集中している。',
    ok:'米軍基地＝日米安全保障条約', ng:'サンフランシスコ平和条約は1951年に結ばれ、翌年日本が独立を回復した条約', tip:'「安全を保障」してもらうかわりに基地を置く' },
  { id:'c2_10', ch:2, q:'憲法改正の発議には、衆議院・参議院それぞれの総議員の「何以上」の賛成が必要？',
    a:'3分の2以上', w:['過半数','3分の1以上','4分の3以上'],
    rule:'憲法改正：各議院の総議員の3分の2以上の賛成で国会が発議 → 国民投票で過半数の賛成 → 天皇が国民の名で公布。',
    ok:'国会で3分の2以上 → 国民投票で過半数', ng:'「過半数」は国民投票のほう', tip:'国会はきびしく（3分の2）、国民はふつう（過半数）' },
  { id:'c2_11', ch:2, q:'国民の三大義務は「子どもに普通教育を受けさせる義務」「勤労の義務」と、もう１つは？',
    a:'納税の義務', w:['兵役の義務','選挙に行く義務','憲法を守る義務'],
    rule:'三大義務＝普通教育を受けさせる義務・勤労の義務・納税の義務。「憲法を尊重し守る義務」は、天皇・国務大臣・国会議員・公務員などに課されている。',
    ok:'教育・勤労・納税', ng:'選挙は「権利」（参政権）で、義務ではない', tip:'働いて（勤労）、税をおさめて（納税）、子どもを学校へ（教育）' },
  { id:'c2_12', ch:2, q:'職業を自由に選べる「職業選択の自由」は、自由権のうちどれ？',
    a:'経済活動の自由', w:['精神の自由','身体の自由','社会権'],
    rule:'自由権は3つ。精神の自由（思想・良心、信教、表現、学問）／身体の自由（不当にとらえられない、拷問の禁止）／経済活動の自由（住む場所・職業を選ぶ、財産権）。',
    ok:'仕事・住む場所・財産＝経済活動の自由', ng:'表現の自由・信教の自由は「精神の自由」', tip:'お金や仕事に関係する → 経済' },
  { id:'c2_13', ch:2, q:'憲法第25条の「健康で文化的な最低限度の生活を営む権利」を何という？',
    a:'生存権', w:['環境権','勤労の権利','幸福追求権'],
    rule:'社会権＝生存権・教育を受ける権利・勤労の権利・労働基本権。生存権をもとに、生活保護などの社会保障のしくみがある。',
    ok:'健康で文化的な最低限度の生活＝生存権（第25条）', ng:'環境権は「新しい人権」', tip:'ニコ（2）ニコ（5）生きる＝生存権' },
  { id:'c2_14', ch:2, q:'労働者が労働組合をつくる権利は？',
    a:'団結権', w:['団体交渉権','団体行動権','請求権'],
    rule:'労働基本権（労働三権）：団結権＝組合をつくる／団体交渉権＝会社と話し合う／団体行動権＝ストライキなど。',
    ok:'組合をつくる＝団結権', ng:'会社と話し合う＝団体交渉権', tip:'つくる → 話す → 行動する、の順' },
  { id:'c2_15', ch:2, q:'「すべて国民は法の下に平等」。性別や人種などで差別されない権利は？',
    a:'平等権', w:['自由権','社会権','参政権'],
    rule:'基本的人権は5つに分けられる：平等権・自由権・社会権・参政権・請求権。平等権は第14条。',
    ok:'差別されない＝平等権（第14条）', ng:'自由権は「国から不当に干渉されない」権利', tip:'「法の下に平等」→ そのまま平等権' },
  { id:'c2_16', ch:2, q:'1999年、男女が対等な立場で社会のあらゆる活動に参加することをめざして制定された法律は？',
    a:'男女共同参画社会基本法', w:['男女雇用機会均等法','育児・介護休業法','労働基準法'],
    rule:'男女雇用機会均等法（1985年）＝職場での男女差別を禁止。男女共同参画社会基本法（1999年）＝社会全体で男女がともに参画する。',
    ok:'社会全体で＝男女共同参画社会基本法（1999年）', ng:'職場の採用・昇進＝男女雇用機会均等法（1985年）', tip:'「参画」＝社会に参加。「雇用」＝仕事' },
  { id:'c2_17', ch:2, q:'日当たりなど、住みやすい環境を求める権利（新しい人権）は？',
    a:'環境権', w:['プライバシーの権利','知る権利','自己決定権'],
    rule:'新しい人権＝環境権（日照権など）・知る権利（情報公開制度）・プライバシーの権利（個人情報保護制度）・自己決定権（インフォームド・コンセント）。',
    ok:'日照権・環境アセスメント＝環境権', ng:'プライバシーの権利は「私生活を勝手に公開されない権利」', tip:'日当たり＝自然＝環境' },
  { id:'c2_18', ch:2, q:'「知る権利」を守るため、国や地方公共団体がもつ情報を公開させるしくみは？',
    a:'情報公開制度', w:['個人情報保護制度','環境アセスメント','裁判員制度'],
    rule:'知る権利 → 情報公開制度。プライバシーの権利 → 個人情報保護制度。この2つを逆にしないこと。',
    ok:'知る権利＝情報公開制度', ng:'個人情報保護制度は「プライバシーの権利」を守るため', tip:'知りたい → 公開してもらう' },
  { id:'c2_19', ch:2, q:'医師から十分な説明を受けたうえで、患者が治療方法を自分で選んで同意することは？',
    a:'インフォームド・コンセント', w:['バリアフリー','ユニバーサルデザイン','ノーマライゼーション'],
    rule:'自己決定権＝自分の生き方を自分で決める権利。医療でのインフォームド・コンセントや、臓器提供の意思表示カードなど。',
    ok:'説明＋同意＝インフォームド・コンセント（自己決定権）', ng:'バリアフリーは、障がいのある人などにとっての障壁をなくすこと', tip:'インフォーム＝知らせる、コンセント＝同意' },
  { id:'c2_20', ch:2, q:'他人の人権を守るためなどに、人権が制限されることがある。その考え方を何という？',
    a:'公共の福祉', w:['法の支配','国民主権','立憲主義'],
    rule:'人権どうしがぶつかったときに調整する考え方＝公共の福祉。例：表現の自由があっても、他人の名誉を傷つけてはいけない。',
    ok:'社会全体の利益のための制限＝公共の福祉', ng:'立憲主義は「憲法で権力をしばる」考え方', tip:'みんな（公共）の幸せ（福祉）のためのブレーキ' },
  // 2章 追加（2026-11-14：令和7年度版の年間指導計画の項目と照合して、問題がなかった項目を補充）
  { id:'c2_21', ch:2, q:'大日本帝国憲法で、主権をもっていたのは？',
    a:'天皇', w:['国民','内閣','帝国議会'],
    rule:'大日本帝国憲法（1889年）＝天皇が主権者。人権は「法律の範囲内」で認められた。日本国憲法＝国民が主権者で、人権は「侵すことのできない永久の権利」。',
    ok:'大日本帝国憲法＝天皇主権／日本国憲法＝国民主権', ng:'国民が主権をもつのは日本国憲法', tip:'帝国の「帝」＝天皇（みかど）' },
  { id:'c2_22', ch:2, q:'障がいのある人もない人も、だれもが社会の一員として受け入れられ、共に参加できるようにする考え方は？',
    a:'インクルージョン', w:['バリアフリー','ユニバーサルデザイン','ワーク・ライフ・バランス'],
    rule:'インクルージョン＝「包みこむ」こと。共生社会に向けた考え方。バリアフリー＝段差などの障壁をなくす。ユニバーサルデザイン＝はじめから、だれもが使いやすい形にする。',
    ok:'だれも取り残さず社会に包みこむ＝インクルージョン', ng:'バリアフリーは「障壁（バリア）をなくす」こと', tip:'インクルード＝含める・仲間に入れる' },
  { id:'c2_23', ch:2, q:'2019年、アイヌの人々を法律で初めて「先住民族」と明記した法律は？',
    a:'アイヌ民族支援法', w:['アイヌ文化振興法','部落差別解消推進法','障害者差別解消法'],
    rule:'アイヌ文化振興法（1997年）＝アイヌ文化を守る法律。アイヌ民族支援法（2019年）＝アイヌの人々を「先住民族」と初めて明記し、アイヌ文化振興法に代わった。教科書（東京書籍）の呼び方は「アイヌ民族支援法」。ニュースなどでは「アイヌ施策推進法」とも呼ばれる。',
    ok:'先住民族と明記＝アイヌ民族支援法（2019年）', ng:'アイヌ文化振興法（1997年）には「先住民族」の明記はない', tip:'新しいほう（2019年）が「先住民族」' },
  { id:'c2_24', ch:2, q:'2022年4月から、成年（成人）になる年齢は何歳になった？',
    a:'18歳', w:['20歳','16歳','19歳'],
    rule:'2022年4月から成年年齢は18歳。親の同意なしに契約（スマホ・クレジットカードなど）ができる。一方、お酒やたばこは今も20歳から。',
    ok:'成年年齢＝18歳（選挙権も18歳）', ng:'お酒・たばこは20歳のまま', tip:'18歳で「ひとりで契約できる大人」' },
  { id:'c2_25', ch:2, q:'1948年、国際連合で採択された、各国が守るべき人権の共通の基準は？',
    a:'世界人権宣言', w:['国際人権規約','子どもの権利条約','女子差別撤廃条約'],
    rule:'1948年 世界人権宣言 → 1966年 国際人権規約（守る義務がある条約）→ 1979年 女子差別撤廃条約 → 1989年 子どもの権利条約。',
    ok:'1948年・国連・人権の基準＝世界人権宣言', ng:'国際人権規約は1966年。宣言を条約にして守る義務を持たせた', tip:'いちばん最初は「宣言」、あとから「規約・条約」' },
  { id:'c2_26', ch:2, q:'私生活や個人の情報を、勝手に公開されない権利（新しい人権）は？',
    a:'プライバシーの権利', w:['知る権利','環境権','自己決定権'],
    rule:'情報化が進んで生まれた人権。プライバシーの権利を守るために個人情報保護制度がある。逆に、国の情報を知るのは「知る権利」（情報公開制度）。',
    ok:'私生活を公開されない＝プライバシーの権利', ng:'知る権利は「国などの情報を知る」権利', tip:'プライベート（私生活）を守る＝プライバシー' },

  // ---------- 3章 現代の民主政治と社会 ----------
  { id:'c3_01', ch:3, q:'一定の年齢以上のすべての国民が選挙権をもつ、という選挙の原則は？',
    a:'普通選挙', w:['平等選挙','直接選挙','秘密選挙'],
    rule:'選挙の4原則：普通選挙（財産や性別で制限しない）／平等選挙（1人1票）／直接選挙（候補者を直接選ぶ）／秘密選挙（だれに投票したか秘密）。',
    ok:'年齢以外で制限しない＝普通選挙', ng:'1人1票＝平等選挙', tip:'だれでも「普通」に投票できる' },
  { id:'c3_02', ch:3, q:'現在の日本で、選挙権が認められるのは何歳以上？',
    a:'満18歳以上', w:['満20歳以上','満25歳以上','満16歳以上'],
    rule:'2016年から選挙権は満18歳以上。被選挙権は、衆議院議員・市町村長・地方議会議員が満25歳以上、参議院議員・都道府県知事が満30歳以上。',
    ok:'選挙権＝満18歳以上', ng:'25歳は衆議院議員などの「被選挙権」（立候補できる年齢）', tip:'高校3年生の誕生日から投票できる' },
  { id:'c3_03', ch:3, q:'1つの選挙区から1人だけが当選する選挙制度は？',
    a:'小選挙区制', w:['大選挙区制','比例代表制','二院制'],
    rule:'小選挙区制＝1区1人。大きな政党に有利で、死票（落選した人への票）が多い。比例代表制＝政党の得票数に応じて議席を配分。小さな政党も議席をとりやすい。',
    ok:'1区から1人＝小選挙区制', ng:'大選挙区制は1区から2人以上が当選', tip:'当選者が「小」人数（1人）' },
  { id:'c3_04', ch:3, q:'衆議院議員の選挙で使われている選挙制度は？',
    a:'小選挙区比例代表並立制', w:['小選挙区制だけ','比例代表制だけ','大選挙区制だけ'],
    rule:'衆議院＝小選挙区制と比例代表制を組み合わせた「小選挙区比例代表並立制」。参議院＝選挙区制と比例代表制。',
    ok:'衆議院＝小選挙区比例代表並立制', ng:'どちらか1つだけではない', tip:'並立＝2つを並べて使う' },
  { id:'c3_05', ch:3, q:'選挙区によって議員1人あたりの有権者数がちがい、1票の重みに差が出る問題は？',
    a:'一票の格差', w:['死票','棄権','期日前投票'],
    rule:'議員1人あたりの有権者が多い選挙区ほど、1票の価値が軽くなる。最高裁判所が「違憲状態」と判断したこともある。',
    ok:'1票の重さがちがう＝一票の格差', ng:'死票は「落選した人に入れられ、結果に生かされない票」', tip:'格差＝差がある' },
  { id:'c3_06', ch:3, q:'内閣をつくり、政権を担当している政党を何という？',
    a:'与党', w:['野党','無党派層','圧力団体'],
    rule:'与党＝政権を担当する政党。野党＝それ以外の政党で、政府を批判・監視する。複数の政党で内閣をつくることを連立政権という。',
    ok:'政権を担当＝与党', ng:'野党は政権を担当していない政党', tip:'「与」は「くみする（味方する）」＝政府の側の党。「野」は政府の外（野）にいる党' },
  { id:'c3_07', ch:3, q:'「国権の最高機関」であり、「国の唯一の立法機関」とされているのは？',
    a:'国会', w:['内閣','最高裁判所','天皇'],
    rule:'国会は国民が選挙で選んだ議員でつくられる。法律をつくれるのは国会だけ。',
    ok:'唯一の立法機関＝国会', ng:'内閣は「行政」、裁判所は「司法」', tip:'法律づくり＝国会だけの仕事' },
  { id:'c3_08', ch:3, q:'衆議院議員の任期は？',
    a:'4年（解散あり）', w:['6年（解散なし）','4年（解散なし）','6年（解散あり）'],
    rule:'衆議院＝任期4年・解散あり・465人。参議院＝任期6年・解散なし・3年ごとに半数を改選・248人。（人数は2026年11月時点。衆議院の比例代表を減らす法案が国会に出ている）',
    ok:'衆議院は4年＋解散あり／参議院は6年＋解散なし', ng:'6年・解散なしは参議院', tip:'任期が短く解散もある → 国民の意見を反映しやすい → だから「衆議院の優越」' },
  { id:'c3_09', ch:3, q:'毎年1回、1月に召集され、おもに次の年度の予算を審議する国会は？',
    a:'常会（通常国会）', w:['臨時会（臨時国会）','特別会（特別国会）','参議院の緊急集会'],
    rule:'常会＝毎年1月・150日間・予算の審議。臨時会＝内閣が必要と認めたときなど。特別会＝衆議院の解散による総選挙の日から30日以内・内閣総理大臣の指名。',
    ok:'1月・予算＝常会', ng:'内閣総理大臣の指名をするのは特別会', tip:'「常」に毎年ある＝常会' },
  { id:'c3_10', ch:3, q:'衆議院の解散による総選挙の日から30日以内に召集され、内閣総理大臣を指名する国会は？',
    a:'特別会（特別国会）', w:['常会（通常国会）','臨時会（臨時国会）','参議院の緊急集会'],
    rule:'解散 → 40日以内に総選挙 → 30日以内に特別会 → 内閣総理大臣の指名。参議院の緊急集会は、衆議院の解散中に緊急の必要があるとき。',
    ok:'総選挙のあと＝特別会', ng:'常会は毎年1月の予算の国会', tip:'選挙のあとの「特別」な国会' },
  { id:'c3_11', ch:3, q:'次のうち、衆議院だけに認められているものは？',
    a:'内閣不信任の決議', w:['国政調査権','弾劾裁判所の設置','憲法改正の発議'],
    rule:'衆議院だけ＝内閣不信任の決議・予算を先に審議する。国政調査権・弾劾裁判所の設置・憲法改正の発議は、衆議院と参議院の両方がもつ。',
    ok:'内閣不信任の決議＝衆議院だけ', ng:'国政調査権は衆議院・参議院の両方がもつ', tip:'解散がある衆議院だけが、内閣に「やめろ」と言える' },
  { id:'c3_12', ch:3, q:'内閣総理大臣を「指名」するのは？',
    a:'国会', w:['天皇','内閣','国民'],
    rule:'内閣総理大臣は、国会が国会議員の中から指名し、天皇が任命する。国務大臣は内閣総理大臣が任命し、その過半数は国会議員。',
    ok:'指名＝国会、任命＝天皇', ng:'天皇がするのは「任命」（国事行為）', tip:'選ぶのは国会、ハンコは天皇' },
  { id:'c3_13', ch:3, q:'内閣が国会の信任にもとづいてつくられ、国会に対して連帯して責任を負うしくみは？',
    a:'議院内閣制', w:['大統領制','三権分立','二院制'],
    rule:'日本やイギリス＝議院内閣制（内閣は国会に責任を負う）。アメリカ＝大統領制（大統領は国民が選び、議会から独立している）。',
    ok:'内閣が国会に責任を負う＝議院内閣制', ng:'大統領制はアメリカなど', tip:'議院（国会）と内閣がつながっている' },
  { id:'c3_14', ch:3, q:'衆議院で内閣不信任の決議が可決されたら、内閣は10日以内に衆議院を解散するか、それとも？',
    a:'総辞職する', w:['国民投票を行う','参議院にやり直しを求める','弾劾裁判を受ける'],
    rule:'内閣不信任の決議が可決 → 10日以内に「衆議院を解散」するか「総辞職」する。',
    ok:'解散 か 総辞職 の2択', ng:'国民投票は憲法改正のときのしくみ', tip:'「解散してやり返す」か「全員でやめる」か' },
  { id:'c3_15', ch:3, q:'法律や命令などが憲法に違反していないかを判断する、裁判所の権限は？',
    a:'違憲審査権', w:['国政調査権','弾劾裁判権','国民審査'],
    rule:'違憲審査権（違憲立法審査権）はすべての裁判所がもつ。最終的に決めるのは最高裁判所なので「憲法の番人」とよばれる。',
    ok:'憲法違反かを判断＝違憲審査権／最高裁判所＝憲法の番人', ng:'国民審査は、最高裁判所の裁判官を国民がチェックするしくみ', tip:'「違憲」かどうか「審査」する → そのまま' },
  { id:'c3_16', ch:3, q:'第一審の判決に不服なとき、第二審の裁判所に訴えることを何という？',
    a:'控訴', w:['上告','起訴','再審'],
    rule:'三審制：第一審 →（控訴）→ 第二審 →（上告）→ 第三審。慎重に裁判をして人権を守るためのしくみ。',
    ok:'第一審→第二審＝控訴、第二審→第三審＝上告', ng:'上告は第二審から第三審へ', tip:'「こう（控）して、じょう（上）へ」＝控訴が先、上告があと' },
  { id:'c3_17', ch:3, q:'刑事裁判で、罪を犯した疑いのある人を裁判所に訴える（起訴する）のは？',
    a:'検察官', w:['弁護人','裁判官','原告'],
    rule:'刑事裁判＝検察官が被疑者を起訴 → 起訴された人は「被告人」。民事裁判＝お金などの争いで、訴えた人が「原告」、訴えられた人が「被告」。',
    ok:'刑事裁判で訴える＝検察官', ng:'原告は民事裁判で訴えた人', tip:'刑事ドラマの「検事」＝検察官' },
  { id:'c3_18', ch:3, q:'国民から選ばれた裁判員が参加するのは、どの裁判？',
    a:'重大な刑事裁判の第一審', w:['民事裁判の第一審','刑事裁判の第二審','最高裁判所の裁判'],
    rule:'裁判員制度（2009年〜）：くじで選ばれた国民6人が裁判官3人と一緒に、殺人などの重大な刑事裁判の第一審（地方裁判所）で、有罪・無罪と刑の重さを決める。',
    ok:'裁判員＝重大な刑事裁判の第一審（地方裁判所）', ng:'民事裁判には裁判員は参加しない', tip:'刑事・第一審・地方裁判所' },
  { id:'c3_19', ch:3, q:'住民が条例の制定や改廃を請求するとき、必要な署名の数は？',
    a:'有権者の50分の1以上', w:['有権者の3分の1以上','有権者の過半数','有権者の10分の1以上'],
    rule:'直接請求権：条例の制定・改廃＝50分の1以上→首長へ／監査請求＝50分の1以上→監査委員へ／議会の解散・首長や議員の解職＝原則3分の1以上→選挙管理委員会へ。',
    ok:'条例・監査＝50分の1以上', ng:'3分の1以上は「人をやめさせる」（解職・解散）とき', tip:'ルール（条例）は軽く1/50、人をやめさせるのは重く1/3' },
  { id:'c3_20', ch:3, q:'地方公共団体の間の財政の格差をおさえるために国から配られ、使い道が自由なお金は？',
    a:'地方交付税交付金', w:['国庫支出金','地方税','地方債'],
    rule:'地方交付税交付金＝格差をおさえるため・使い道は自由。国庫支出金＝義務教育や道路など特定の仕事のため・使い道が決まっている。地方債＝地方公共団体の借金。',
    ok:'使い道が自由＝地方交付税交付金', ng:'国庫支出金は使い道が決まっている', tip:'「交付税」は自由、「支出金」は指定つき' },
  // 3章 追加（2026-11-14：令和7年度版の年間指導計画の項目と照合して補充）
  { id:'c3_21', ch:3, q:'多数決で物事を決めるときに、大切にしなければならないことは？',
    a:'少数意見の尊重', w:['全会一致','多数派だけで決めること','先着順'],
    rule:'民主主義では、話し合ったうえで多数決で決めることが多い。そのとき、少ない意見もよく聞いて、できるだけ取り入れることが大切。',
    ok:'多数決＋少数意見の尊重', ng:'全会一致（全員が賛成）は時間がかかり、決まらないこともある', tip:'多い方が勝ち、でも少ない方の声も聞く' },
  { id:'c3_22', ch:3, q:'選挙のとき、政党が「政権をとったら実行する政策」を、目標や期限をつけて示したものは？',
    a:'政権公約（マニフェスト）', w:['世論調査','政党交付金','選挙公報'],
    rule:'政党＝政治の考えが同じ人の集まり。選挙では政権公約（マニフェスト）を示して支持を集める。',
    ok:'政党の約束＝政権公約（マニフェスト）', ng:'世論調査は、国民の意見を調べること', tip:'マニフェスト＝「宣言書」' },
  { id:'c3_23', ch:3, q:'政治や社会の問題について、多くの人々が共有している意見を何という？',
    a:'世論', w:['公約','綱領','選挙公報'],
    rule:'世論（よろん・せろん）はテレビ・新聞・インターネットなどのマスメディアの影響を受けやすい。政治は世論を意識して行われる。',
    ok:'多くの人の意見＝世論（よろん）', ng:'公約は、政党や候補者が有権者にする約束', tip:'世の中の論＝世論' },
  { id:'c3_24', ch:3, q:'マスメディアやインターネットの情報をそのまま信じず、いろいろな角度から読み取って判断する力は？',
    a:'メディアリテラシー', w:['プライバシー','インフォームド・コンセント','マニフェスト'],
    rule:'マスメディアの情報には、まちがいや、かたよりがあることもある。複数の情報を比べて自分で判断する力＝メディアリテラシー。',
    ok:'情報を見きわめる力＝メディアリテラシー', ng:'プライバシーは私生活のこと', tip:'リテラシー＝読み書きの力' },
  { id:'c3_25', ch:3, q:'投票日に用事がある人などが、投票日より前に投票できる制度は？',
    a:'期日前投票', w:['国民投票','住民投票','秘密投票'],
    rule:'選挙の課題＝投票率の低さ（とくに若い世代）。投票しやすくするため、期日前投票などの制度がある。',
    ok:'前もって投票＝期日前投票', ng:'国民投票は憲法改正のときの投票', tip:'期日（投票日）の前に投票' },
  { id:'c3_26', ch:3, q:'憲法では、公務員は「一部の奉仕者ではなく」何であるとされている？',
    a:'全体の奉仕者', w:['国民の代表者','内閣の部下','地域の代表者'],
    rule:'公務員は国民全体のために働く「全体の奉仕者」（憲法第15条）。行政改革では、ムダをはぶいたり、規制緩和をしたりして、効率のよい行政をめざす。',
    ok:'公務員＝全体の奉仕者', ng:'「国民の代表」は選挙で選ばれた国会議員', tip:'一部じゃなく「全体」のため' },
  { id:'c3_27', ch:3, q:'裁判所や裁判官が、国会や内閣などから圧力や干渉を受けずに裁判を行う原則は？',
    a:'司法権の独立', w:['三審制','違憲審査権','罪刑法定主義'],
    rule:'裁判官は、自分の良心に従い、憲法と法律だけにしばられて裁判を行う。公正な裁判で人権を守るための原則。',
    ok:'外からの圧力を受けない＝司法権の独立', ng:'三審制は「3回まで裁判を受けられる」しくみ', tip:'司法（裁判所）がひとり立ち＝独立' },
  { id:'c3_28', ch:3, q:'えん罪を防ぐために、警察や検察の取り調べを録音・録画することを何という？',
    a:'取り調べの可視化', w:['裁判員制度','三審制','再審'],
    rule:'えん罪＝罪のない人が有罪にされること。無理な取り調べを防ぐため、取り調べの可視化（録音・録画）が導入された。',
    ok:'取り調べを録音・録画＝取り調べの可視化', ng:'裁判員制度は国民が裁判に参加するしくみ', tip:'可視化＝見えるようにする' },
  { id:'c3_29', ch:3, q:'ふさわしくない裁判官をやめさせるかどうかを判断するために、国会に設けられる裁判所は？',
    a:'弾劾裁判所', w:['最高裁判所','家庭裁判所','簡易裁判所'],
    rule:'三権の抑制と均衡：国会→裁判所＝弾劾裁判所／裁判所→国会・内閣＝違憲審査／国民→最高裁判所＝国民審査／内閣→裁判所＝最高裁判所長官の指名・裁判官の任命。',
    ok:'国会が裁判官を裁く＝弾劾裁判所', ng:'国民が最高裁判所の裁判官をチェックするのは国民審査', tip:'国会議員が裁判官になる特別な裁判所' },
  { id:'c3_30', ch:3, q:'最高裁判所の裁判官がふさわしいかどうかを、国民が投票で判断するしくみは？',
    a:'国民審査', w:['国民投票','弾劾裁判','住民投票'],
    rule:'国民審査は衆議院議員の総選挙のときに行う。やめさせた方がよいという票が多数になると、その裁判官はやめさせられる。',
    ok:'最高裁判所の裁判官を国民がチェック＝国民審査', ng:'国民投票は憲法改正のとき', tip:'「審査」＝人をチェック、「投票」＝憲法を決める' },
  { id:'c3_31', ch:3, q:'住民が、首長（知事・市町村長）と地方議会の議員を、それぞれ直接選挙で選ぶしくみは？',
    a:'二元代表制', w:['議院内閣制','大統領制','二院制'],
    rule:'国の政治＝国民は国会議員だけを選び、国会が首相を指名する（議院内閣制）。地方の政治＝住民が首長と議員の両方を直接選ぶ（二元代表制）。',
    ok:'首長も議員も住民が選ぶ＝二元代表制', ng:'議院内閣制は国の政治のしくみ', tip:'代表が2つ（二元）＝首長と議会' },

  // ---------- 4章 私たちの暮らしと経済（〜消費生活を支える流通） ----------
  { id:'c4_01', ch:4, q:'家族や個人など、消費を中心とした経済活動を行う単位は？',
    a:'家計', w:['企業','政府','財政'],
    rule:'経済の3つの主体＝家計（消費）・企業（生産）・政府（財政）。',
    ok:'家族・個人の経済＝家計', ng:'政府の経済活動は「財政」', tip:'家の計算＝家計' },
  { id:'c4_02', ch:4, q:'散髪や電車に乗ることなど、形のない商品を何という？',
    a:'サービス', w:['財','資本','貯蓄'],
    rule:'商品＝財（形のあるもの：食べ物・服など）＋サービス（形のないもの：散髪・医療・交通・授業など）。',
    ok:'形がない＝サービス', ng:'形があるのは「財」', tip:'さわれる＝財、さわれない＝サービス' },
  { id:'c4_03', ch:4, q:'家計の収入から、消費支出と税金・社会保険料（非消費支出）を引いた残りは？',
    a:'貯蓄', w:['消費支出','非消費支出','公共料金'],
    rule:'収入 ＝ 消費支出（食料費・住居費など）＋ 非消費支出（税金・社会保険料）＋ 貯蓄（預金・保険・株式など）。',
    ok:'使った・おさめた残り＝貯蓄', ng:'食料費や光熱費は「消費支出」', tip:'使った／おさめた／のこした の3つに分ける' },
  { id:'c4_04', ch:4, q:'「これを売ります」「これを買います」という、売り手と買い手の合意で成り立つ約束を何という？',
    a:'契約', w:['条約','条例','保証'],
    rule:'契約は口約束でも成り立ち、成り立ったら一方的にやめることはできない（例外がクーリング・オフ）。コンビニでジュースを買うのも契約。',
    ok:'合意で成り立つ約束＝契約', ng:'条例は地方公共団体のきまり', tip:'買い物＝毎回「契約」している' },
  { id:'c4_05', ch:4, q:'訪問販売などで商品を買ったとき、一定の期間内なら無条件で契約を解除できる制度は？',
    a:'クーリング・オフ', w:['リコール','リサイクル','インフォームド・コンセント'],
    rule:'訪問販売や電話勧誘販売は、8日以内なら書面などで解除できる。自分から店に行って買ったものや、通信販売（ネット通販）は対象外。',
    ok:'訪問販売 → 8日以内 → クーリング・オフ', ng:'店で買ったものやネット通販には使えない', tip:'クーリング＝頭を冷やす。冷静に考え直す期間' },
  { id:'c4_06', ch:4, q:'欠陥のある商品で消費者が被害を受けたとき、企業に過失がなくても賠償の責任を負わせる法律は？',
    a:'製造物責任法（PL法）', w:['消費者契約法','消費者基本法','独占禁止法'],
    rule:'製造物責任法（PL法）＝欠陥商品の被害 → 企業に責任（消費者は企業の過失を証明しなくてよい）。消費者契約法＝不当な契約を取り消せる。',
    ok:'欠陥商品＝製造物責任法（PL法）', ng:'消費者契約法は、うその説明などで結んだ契約を取り消す法律', tip:'P＝プロダクト（製品）、L＝ライアビリティ（責任）' },
  { id:'c4_07', ch:4, q:'事実とちがう説明や強引な勧誘で結ばされた契約を、取り消すことができる法律は？',
    a:'消費者契約法', w:['製造物責任法（PL法）','消費者基本法','独占禁止法'],
    rule:'消費者契約法（2001年施行）＝うその説明・強引な勧誘による契約を取り消せる。製造物責任法＝欠陥商品。消費者基本法＝消費者の権利と自立の支援。',
    ok:'うそ・強引な勧誘の契約 → 取り消し＝消費者契約法', ng:'PL法は欠陥商品の被害のための法律', tip:'「契約」のトラブル → 消費者「契約」法' },
  { id:'c4_08', ch:4, q:'2009年に設置された、消費者のための行政をまとめて行う国の機関は？',
    a:'消費者庁', w:['金融庁','公正取引委員会','国民生活センター'],
    rule:'消費者庁（2009年）＝いろいろな省庁に分かれていた消費者行政をまとめた。各地の消費生活センターは相談の窓口。',
    ok:'2009年・消費者庁', ng:'公正取引委員会は独占禁止法を運用する機関', tip:'消費者のための「庁」' },
  { id:'c4_09', ch:4, q:'1962年、「安全を求める権利」など「消費者の四つの権利」を示したアメリカの大統領は？',
    a:'ケネディ', w:['リンカン','ローズベルト','ワシントン'],
    rule:'消費者の四つの権利＝安全を求める権利・知らされる権利・選択する権利・意見を反映させる権利。',
    ok:'消費者の四つの権利＝ケネディ', ng:'リンカンは「人民の、人民による、人民のための政治」', tip:'ケネディ＝消費者のヒーロー' },
  { id:'c4_10', ch:4, q:'商品が生産者から消費者に届くまでの流れを何という？',
    a:'流通', w:['分業','貿易','金融'],
    rule:'生産者 → 卸売業者 → 小売業者 → 消費者 という流れ。流通の中心は商業（卸売業・小売業）で、運送業・倉庫業なども流通を支える。',
    ok:'生産者から消費者へ届く流れ＝流通', ng:'分業は、仕事を分けて受け持つこと', tip:'モノが「流」れて「通」っていく' },
  { id:'c4_11', ch:4, q:'生産者から商品を大量に仕入れて、小売業者に売る仕事は？',
    a:'卸売業', w:['小売業','製造業','運送業'],
    rule:'卸売業＝生産者と小売業者の間に入る（問屋）。小売業＝消費者に直接売る（スーパー・コンビニ・商店など）。',
    ok:'小売業者に売る＝卸売業', ng:'消費者に直接売るのは小売業', tip:'「おろし」＝問屋さん。レジの店員さんは「小売」' },
  { id:'c4_12', ch:4, q:'大きな小売業者が生産者から直接仕入れるなどして、流通にかかる費用や手間をへらすことを何という？',
    a:'流通の合理化', w:['規制緩和','分業','技術革新'],
    rule:'流通の合理化＝流通のムダをへらすこと。例：卸売業者を通さず生産者から直接仕入れる、インターネット販売、POSシステムで在庫を管理する。',
    ok:'中間をはぶいて費用をへらす＝流通の合理化', ng:'規制緩和は、国の規制をゆるめること', tip:'合理化＝ムダをへらす' },
  { id:'c4_13', ch:4, q:'レジで「何が・いつ・いくつ売れたか」を記録して、仕入れや在庫の管理に役立てるしくみは？',
    a:'POSシステム', w:['キャッシュレス決済','プライベートブランド','クーリング・オフ'],
    rule:'POS（販売時点情報管理）システム＝バーコードを読み取った情報を集めて分析する。売れる商品を、売れる数だけ仕入れられる。',
    ok:'売れたデータを管理＝POSシステム', ng:'キャッシュレス決済は、現金を使わない支払い方法', tip:'レジで「ピッ」→ データが本部へ' },
  { id:'c4_14', ch:4, q:'スーパーやコンビニなどの小売業者が、独自に企画して販売する商品は？',
    a:'プライベートブランド', w:['ナショナルブランド','フランチャイズ','POSシステム'],
    rule:'プライベートブランド（PB）＝小売業者が企画してメーカーに作ってもらう商品。広告や流通の費用をおさえて安く売れる。',
    ok:'お店オリジナルの商品＝プライベートブランド', ng:'ナショナルブランドは、メーカーが自分のブランドで全国に売る商品', tip:'プライベート＝そのお店だけの' },
  // 4章 追加（2026-11-14：令和7年度版の年間指導計画の項目と照合して補充）
  { id:'c4_15', ch:4, q:'商品を先に受け取り、代金はあとで銀行口座から支払う方法は？',
    a:'クレジットカード', w:['プリペイドカード','デビットカード','現金'],
    rule:'支払い方法：前払い＝プリペイドカード・チャージ式の電子マネー／即時払い＝現金・デビットカード／後払い＝クレジットカード。後払いは使いすぎに注意。',
    ok:'後払い＝クレジットカード', ng:'デビットカードは、使ったその場で口座から引き落とされる', tip:'クレジット＝信用。信用して「あとで払ってね」' },
  { id:'c4_16', ch:4, q:'2004年、消費者保護基本法を改正して、消費者の権利と自立の支援を定めた法律は？',
    a:'消費者基本法', w:['消費者契約法','製造物責任法（PL法）','独占禁止法'],
    rule:'消費者基本法（2004年）＝消費者を「守られる人」から「自立した消費者」へ。消費者の権利を明記し、自立を支援する。',
    ok:'消費者の権利と自立＝消費者基本法', ng:'消費者契約法は、不当な契約を取り消す法律', tip:'いちばん「基本」になる法律' }
];

// ===== レベル（社会共通の soc_xp） =====
var LEVELS = [
  { lv:1, min:0,   max:15,  badge:'🥚 NSC入学',     title:'見習い研修生' },
  { lv:2, min:15,  max:40,  badge:'🎤 NSC卒業',     title:'一般社員' },
  { lv:3, min:40,  max:80,  badge:'🎭 劇場デビュー', title:'主任' },
  { lv:4, min:80,  max:140, badge:'⭐ 準レギュラー', title:'係長' },
  { lv:5, min:140, max:220, badge:'📺 全国ネット',   title:'課長' },
  { lv:6, min:220, max:320, badge:'🌟 冠番組',       title:'部長' },
  { lv:7, min:320, max:440, badge:'🏆 M-1決勝',     title:'取締役' },
  { lv:8, min:440, max:9999,badge:'👑 M-1優勝',     title:'社長' }
];
function getLevel(v){ for(var i=LEVELS.length-1;i>=0;i--){ if(v>=LEVELS[i].min) return LEVELS[i]; } return LEVELS[0]; }

// ===== 保存（読み書きは失敗しても動くように） =====
function lsGet(k, def){ try{ var v = localStorage.getItem(k); return v === null ? def : v; }catch(e){ return def; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function lsJSON(k){ try{ return JSON.parse(lsGet(k, '{}')) || {}; }catch(e){ return {}; } }

var xp = parseInt(lsGet('soc_xp', '0'), 10) || 0;
var answeredSet = lsJSON('soc_civs_answered');
var weakDB = lsJSON('soc_weakdb');
var best = lsJSON('soc_civs_best');          // { 'all_20_20': 1234 } のように 範囲_問題数_秒 ごと
var settings = lsJSON('soc_civs_settings');
if(!settings.range) settings.range = 'all';
if(!settings.count) settings.count = 20;
if(!settings.time)  settings.time  = 20;

// ===== 小道具 =====
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function shuffle(arr){ var a = arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function qidOf(q){ return QID_PREFIX + q.id; }
function pctOf(qid){ var d = weakDB[qid]; if(!d || !d.total) return 100; return Math.round(d.correct / d.total * 100); }
function weakIds(){
  return Object.keys(weakDB).filter(function(id){ return id.indexOf(QID_PREFIX) === 0 && weakDB[id].total > 0 && pctOf(id) < 80 && byQid[id]; });
}
var byQid = {};
for(var _i=0;_i<QUESTIONS.length;_i++){ byQid[qidOf(QUESTIONS[_i])] = QUESTIONS[_i]; }

var toastTimer = null;
function showToast(msg, type){
  var t = $('toast'); t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  setTimeout(function(){ t.classList.add('show'); }, 10);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove('show'); }, type ? 3500 : 2200);
}

// ===== XP =====
function totalXP(){
  var keys = ['nh3_xp','sci_xp','math_xp','soc_xp','jpn_xp','exam_xp'], s = 0;
  for(var i=0;i<keys.length;i++){ s += parseInt(lsGet(keys[i], '0'), 10) || 0; }
  return Math.max(0, s - (parseInt(lsGet('shop_spent', '0'), 10) || 0));
}
function renderXP(){
  var lv = getLevel(xp);
  var pct = lv.lv < LEVELS.length ? Math.round((xp - lv.min) / (lv.max - lv.min) * 100) : 100;
  $('navXp').textContent = '🪙 ' + totalXP().toLocaleString() + ' XP';
  $('lvBadge').textContent = 'Lv.' + lv.lv + ' ' + lv.badge;
  $('lvTitle').textContent = lv.title;
  $('lvNext').textContent = '社会 ' + xp + ' XP' + (lv.lv < LEVELS.length ? '／次の昇格まで ' + (lv.max - xp) + ' XP' : '（最高ランク）');
  $('lvFill').style.width = Math.min(100, pct) + '%';
}
function changeXP(delta){
  var old = getLevel(xp).lv;
  xp = Math.max(0, xp + delta);
  lsSet('soc_xp', String(xp));
  renderXP();
  var now = getLevel(xp).lv;
  if(now > old) showToast('🎉 昇格！ ' + getLevel(xp).badge + '　きょん「昇格したわ！！」', 'levelup');
  else if(now < old) showToast('💦 降格…！　きょん「降格した…！！でも取り返す！！」', 'demote');
}

// ===== 弱点DB =====
function recordResult(q, isCorrect){
  var qid = qidOf(q);
  if(!weakDB[qid]) weakDB[qid] = { correct:0, total:0 };
  // 問題文・答えは毎回いまの内容で上書き（問題を直したときに古い答えが残らないように）
  weakDB[qid].jp = q.q; weakDB[qid].answer = q.a; weakDB[qid].choices = [q.a].concat(q.w); weakDB[qid].exp = q.rule;
  weakDB[qid].total++; if(isCorrect) weakDB[qid].correct++;
  lsSet('soc_weakdb', JSON.stringify(weakDB));
  var today = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  var daily = lsJSON('soc_daily'); daily[today] = (daily[today] || 0) + 1;
  lsSet('soc_daily', JSON.stringify(daily));
  lsSet('soc_civs_lastStudy', today);
}

// ===== スタート画面 =====
var RANGE_OPTS = [
  { key:'all', label:'ぜんぶ' },
  { key:'2',   label:'2章 憲法・人権' },
  { key:'3',   label:'3章 政治' },
  { key:'4',   label:'4章 消費・流通' },
  { key:'weak',label:'🔥 弱点だけ' }
];
var COUNT_OPTS = [10, 20, 0]; // 0 = 全部
var TIME_OPTS = [10, 15, 20, 30];

function poolFor(range){
  if(range === 'weak'){ return weakIds().map(function(id){ return byQid[id]; }); }
  if(range === 'all') return QUESTIONS.slice();
  var ch = parseInt(range, 10);
  return QUESTIONS.filter(function(q){ return q.ch === ch; });
}
function bestKey(){ return settings.range + '_' + settings.count + '_' + settings.time; }

function renderChips(){
  var weakN = weakIds().length;
  if(settings.range === 'weak' && weakN === 0) settings.range = 'all';
  $('chipRange').innerHTML = RANGE_OPTS.map(function(o){
    var n = poolFor(o.key).length;
    var dis = (o.key === 'weak' && n === 0) ? ' disabled' : '';
    return '<button class="chip' + (settings.range === o.key ? ' on' : '') + '" data-range="' + o.key + '"' + dis + '>' + esc(o.label) + '（' + n + '）</button>';
  }).join('');
  $('rangeNote').textContent = weakN === 0 ? '「弱点だけ」は、まちがえた問題がたまると選べるようになるよ。' : '弱点（正答率80%未満）が ' + weakN + ' 問あるよ。';
  $('chipCount').innerHTML = COUNT_OPTS.map(function(c){
    return '<button class="chip' + (settings.count === c ? ' on' : '') + '" data-count="' + c + '">' + (c === 0 ? 'ぜんぶ' : c + '問') + '</button>';
  }).join('');
  $('chipTime').innerHTML = TIME_OPTS.map(function(t){
    return '<button class="chip' + (settings.time === t ? ' on' : '') + '" data-time="' + t + '">' + t + '秒</button>';
  }).join('');
  var b = best[bestKey()];
  $('bestLine').textContent = b ? '🏆 この設定のベスト：' + b + ' PT' : 'この設定ではまだ記録なし';
}
function renderWeak(){
  var ids = weakIds().sort(function(a,b){ return pctOf(a) - pctOf(b); }).slice(0, 8);
  if(ids.length === 0){ $('weakList').innerHTML = '<div class="note" style="margin:0">弱点なし！（まちがえた問題がここに出るよ）</div>'; return; }
  $('weakList').innerHTML = ids.map(function(id){
    var q = byQid[id];
    return '<div class="weak-item"><span>' + esc(q.a) + '<span style="color:var(--sub);font-size:13px">（' + esc(CH_NAME[q.ch].slice(0,2)) + '）</span></span><span class="pct">' + pctOf(id) + '%</span></div>';
  }).join('');
}
function showStart(){
  stopTimer();
  $('scrStart').classList.remove('hide'); $('scrGame').classList.add('hide'); $('scrResult').classList.add('hide');
  renderXP(); renderChips(); renderWeak();
  window.scrollTo(0, 0);
}
function saveSettings(){ lsSet('soc_civs_settings', JSON.stringify(settings)); }

// ===== ゲーム =====
var G = null;          // 1回分の状態
var timerId = null;

function startGame(list){
  var qs = list ? list.slice() : shuffle(poolFor(settings.range));
  if(!list && settings.count > 0) qs = qs.slice(0, settings.count);
  if(qs.length === 0) return;
  G = { qs:shuffle(qs), i:0, score:0, combo:0, maxCombo:0, right:0, xpGain:0, miss:[], answered:false,
        timeLimit:settings.time, left:settings.time, paused:false, retry:!!list, key:bestKey() };
  $('scrStart').classList.add('hide'); $('scrResult').classList.add('hide'); $('scrGame').classList.remove('hide');
  showQuestion();
}
function showQuestion(){
  var q = G.qs[G.i];
  G.answered = false; G.paused = false; G.left = G.timeLimit;
  G.order = shuffle([q.a].concat(q.w));
  $('hudNo').textContent = 'Q ' + (G.i + 1) + ' / ' + G.qs.length;
  $('hudScore').textContent = G.score + ' PT';
  $('hudCombo').textContent = G.combo >= 2 ? '🔥 ' + G.combo + ' COMBO' : '';
  $('qTag').textContent = CH_NAME[q.ch];
  $('qText').textContent = q.q;
  $('pausedCover').classList.add('hide');
  $('btnPause').textContent = '⏸ 一時停止'; $('btnPause').disabled = false;
  $('choices').innerHTML = G.order.map(function(c, k){
    return '<button class="ch" data-k="' + k + '"><span class="k">' + (k + 1) + '</span><span>' + esc(c) + '</span></button>';
  }).join('');
  $('fbArea').innerHTML = '';
  renderTimer();
  startTimer();
  window.scrollTo(0, 0);
}

function startTimer(){
  stopTimer();
  var last = Date.now();
  timerId = setInterval(function(){
    var now = Date.now();
    if(!G || G.answered || G.paused){ last = now; return; }
    G.left -= (now - last) / 1000; last = now;
    if(G.left <= 0){ G.left = 0; renderTimer(); answer(-1); return; }
    renderTimer();
  }, 100);
}
function stopTimer(){ if(timerId){ clearInterval(timerId); timerId = null; } }
function renderTimer(){
  var r = G.left / G.timeLimit;
  var f = $('tFill'), n = $('tNum');
  f.style.width = (r * 100) + '%';
  f.className = 'tfill' + (r <= 0.25 ? ' low' : r <= 0.5 ? ' mid' : '');
  n.textContent = Math.ceil(G.left);
  n.className = 'tnum' + (r <= 0.25 ? ' low' : '');
}
function togglePause(){
  if(!G || G.answered) return;
  G.paused = !G.paused;
  $('pausedCover').classList.toggle('hide', !G.paused);
  $('choices').style.visibility = G.paused ? 'hidden' : 'visible';
  $('btnPause').textContent = G.paused ? '▶ 再開' : '⏸ 一時停止';
}

var LINES = {
  ok:      ['きょん「やった！天才かも！」','きょん「にっくんより賢くなったかも！」','きょん「公民、いけるじゃん俺！」','西村「正解。よく覚えてたね」','西村「できてる。その調子」','西村「速いし正確。いいね」'],
  ng:      ['きょん「あれ！？また間違えた！降格したくない！！」','西村「惜しい。「まちがえやすい」の行を1回読んでおこう」','西村「ここは迷いやすいところ。ルールを読めば次は取れる」','きょん「ここ、俺もひっかかるやつだ…！」'],
  timeout: ['きょん「時間切れ…！でも考えてたのは見てたよ！」','西村「時間切れは気にしなくていい。答えを1回見ておこう」']
};
var COMBO_LINES = {
  3:  'くるま「3連続っす！きょんさん、これもう公民の人っすよ！」',
  5:  'くるま「5連続！僕、拍手しすぎて手が痛いっす！」',
  10: 'くるま「10連続っす！！国会で答弁できるレベルっす！！」',
  15: 'くるま「15連続！？僕もう、きょんさんに一票入れるっす！！」',
  20: 'くるま「20連続っす！！これは内閣総理大臣に指名されるやつっす！！」'
};

function answer(k){
  if(!G || G.answered || G.paused) return;
  G.answered = true;
  var q = G.qs[G.i];
  var chosen = k >= 0 ? G.order[k] : null;
  var correct = chosen === q.a;
  var timeout = k < 0;
  var qid = qidOf(q);
  recordResult(q, correct);

  // ボタンの色
  var btns = $('choices').querySelectorAll('.ch');
  for(var b=0;b<btns.length;b++){
    var txt = G.order[b];
    btns[b].disabled = true;
    if(txt === q.a) btns[b].classList.add('right');
    else if(b === k) btns[b].classList.add('wrong');
    else btns[b].classList.add('dim');
  }
  $('btnPause').disabled = true;

  var pts = 0, xpd = 0, bannerCls, bannerTxt, line, comboLine = '';
  if(correct){
    G.combo++; G.right++;
    if(G.combo > G.maxCombo) G.maxCombo = G.combo;
    var speed = Math.round(G.left / G.timeLimit * 100);  // 残り時間の割合 0〜100
    pts = 100 + speed + Math.min(G.combo - 1, 10) * 10;
    G.score += pts;
    xpd = answeredSet[qid] ? 1 : 5;
    if(!answeredSet[qid]){ answeredSet[qid] = true; lsSet('soc_civs_answered', JSON.stringify(answeredSet)); }
    bannerCls = 'ok'; bannerTxt = '⭕ 正解！';
    line = pick(LINES.ok);
    if(COMBO_LINES[G.combo]) comboLine = COMBO_LINES[G.combo];
  } else {
    G.combo = 0;
    G.miss.push({ q:q, chosen:chosen });
    xpd = timeout ? -3 : -5;
    bannerCls = timeout ? 'to' : 'ng';
    bannerTxt = timeout ? '⏰ 時間切れ' : '❌ ざんねん';
    line = pick(timeout ? LINES.timeout : LINES.ng);
  }
  G.xpGain += xpd;
  changeXP(xpd);
  $('hudScore').textContent = G.score + ' PT';
  $('hudCombo').textContent = G.combo >= 2 ? '🔥 ' + G.combo + ' COMBO' : '';

  var html = '<div class="fb">';
  html += '<div class="banner ' + bannerCls + '">' + bannerTxt +
          '<span class="pts">' + (correct ? '+' + pts + ' PT（はやさボーナス込み）／ ' : '') + 'XP ' + (xpd > 0 ? '+' : '') + xpd + '</span></div>';
  if(!correct){
    html += '<div class="cmp"><div class="yours"><small>あなたの回答</small>' + (timeout ? '（時間切れ）' : esc(chosen)) + '</div>' +
            '<div class="ans"><small>正しい答え</small>' + esc(q.a) + '</div></div>';
  }
  html += '<div class="exp"><div class="h">📌 解説</div>' +
          '<p><span class="lbl">📐 ルール：</span>' + esc(q.rule) + '</p>' +
          '<p><span class="lbl">✅ 正しく：</span>' + esc(q.ok) + '</p>' +
          '<p><span class="lbl">❌ まちがえやすい：</span>' + esc(q.ng) + '</p>' +
          '<p><span class="lbl">💡 覚え方：</span>' + esc(q.tip) + '</p></div>';
  html += chatHTML(line);
  if(comboLine) html += chatHTML(comboLine);
  var last = G.i >= G.qs.length - 1;
  html += '<button class="next-btn" id="btnNext">' + (last ? '🏁 結果を見る' : '次へ ▶') + '<small>Enter</small></button>';
  html += '</div>';
  $('fbArea').innerHTML = html;
  $('btnNext').addEventListener('click', nextQuestion);
  // 結果の帯が画面外のときだけ、見えるところまで少しスクロール（問題文はなるべく残す）
  setTimeout(function(){ var el = document.querySelector('#fbArea .banner'); if(el && el.scrollIntoView) el.scrollIntoView({ behavior:'smooth', block:'nearest' }); }, 50);
}
function chatHTML(line){
  var m = line.match(/^(.+?)「([\s\S]*)」$/);
  var name = m ? m[1] : '', body = m ? m[2] : line;
  var cls = name === 'きょん' ? ' kyon' : name === 'くるま' ? ' kuruma' : '';
  var icon = name === 'きょん' ? '🙋‍♂️' : name === 'くるま' ? '📣' : '🎙️';
  return '<div class="chat' + cls + '"><div class="ic">' + icon + '</div><div class="bub"><span class="nm">' + esc(name) + '</span>' + esc(body) + '</div></div>';
}
function nextQuestion(){
  if(!G || !G.answered) return;
  G.i++;
  if(G.i >= G.qs.length) showResult(); else showQuestion();
}

// ===== 結果 =====
function rankFor(rate){
  if(rate >= 100) return '👑 M-1グランプリ優勝';
  if(rate >= 90)  return '🏆 M-1決勝進出';
  if(rate >= 80)  return '🌟 冠番組獲得';
  if(rate >= 70)  return '📺 全国ネット';
  if(rate >= 60)  return '⭐ 準レギュラー獲得';
  if(rate >= 40)  return '🎭 劇場デビュー';
  if(rate >= 20)  return '🎤 NSC卒業';
  return '🥚 NSC入学';
}
function resultLine(rate){
  if(rate >= 100) return 'きょん「全問正解！？俺、令和ロマンに勝ったわ！！」';
  if(rate >= 80)  return '西村「すごいね。テスト本番もこの調子でいける」';
  if(rate >= 60)  return 'きょん「半分以上取れてる！にっくん、俺、公民できるかも！」';
  if(rate >= 40)  return '西村「まちがえた問題が見えたのが大事。下の一覧からもう一回やろう」';
  return 'きょん「最初はみんなこんなもん！まちがえた問題だけ、もう一回いこう！」';
}
function showResult(){
  stopTimer();
  var n = G.qs.length, rate = Math.round(G.right / n * 100);
  var isNew = false;
  if(!G.retry){
    if(!best[G.key] || G.score > best[G.key]){ isNew = true; best[G.key] = G.score; lsSet('soc_civs_best', JSON.stringify(best)); }
  }
  var h = '<div class="res-hero"><div style="color:var(--sub);font-size:14px">' + (G.retry ? 'まちがえた問題のやり直し' : 'SCORE') + '</div>' +
          '<div class="res-score">' + G.score + ' PT</div>' +
          '<div class="res-rank">' + rankFor(rate) + '</div>' +
          (isNew ? '<div class="res-new">🏆 ベスト更新！</div>' : '') + '</div>';
  h += '<div class="stats"><div class="stat"><b>' + G.right + '/' + n + '</b>正解</div>' +
       '<div class="stat"><b>' + rate + '%</b>正答率</div>' +
       '<div class="stat"><b>' + G.maxCombo + '</b>最大コンボ</div></div>';
  h += '<div style="text-align:center;font-size:15px;color:var(--gold)">社会XP ' + (G.xpGain >= 0 ? '+' : '') + G.xpGain + '</div>';
  h += chatHTML(resultLine(rate));
  h += '<button class="big-btn" id="btnAgain">▶ もう一回（同じ設定）</button>';
  if(G.miss.length) h += '<button class="sub-btn" id="btnRetryMiss">🔁 まちがえた ' + G.miss.length + ' 問だけもう一回</button>';
  h += '<button class="sub-btn" id="btnBack">⚙️ 設定にもどる</button>';
  if(G.miss.length){
    h += '<div class="miss"><h3>📝 まちがえた問題</h3>' + G.miss.map(function(m){
      return '<div class="miss-item">' + esc(m.q.q) + '<br><span class="a">→ ' + esc(m.q.a) + '</span>' +
             '<br><span class="y">あなた：' + (m.chosen === null ? '時間切れ' : esc(m.chosen)) + '　💡 ' + esc(m.q.tip) + '</span></div>';
    }).join('') + '</div>';
  }
  $('scrResult').innerHTML = h;
  $('scrGame').classList.add('hide'); $('scrResult').classList.remove('hide');
  var missList = G.miss.map(function(m){ return m.q; });
  $('btnAgain').addEventListener('click', function(){ startGame(); });
  $('btnBack').addEventListener('click', showStart);
  if($('btnRetryMiss')) $('btnRetryMiss').addEventListener('click', function(){ startGame(missList); });
  window.scrollTo(0, 0);
}

// ===== 操作 =====
document.addEventListener('click', function(e){
  var t = e.target.closest ? e.target.closest('button') : null;
  if(!t) return;
  if(t.getAttribute('data-range')){ settings.range = t.getAttribute('data-range'); saveSettings(); renderChips(); return; }
  if(t.getAttribute('data-count') !== null){ settings.count = parseInt(t.getAttribute('data-count'), 10); saveSettings(); renderChips(); return; }
  if(t.getAttribute('data-time')){ settings.time = parseInt(t.getAttribute('data-time'), 10); saveSettings(); renderChips(); return; }
  if(t.classList.contains('ch') && t.getAttribute('data-k') !== null){ answer(parseInt(t.getAttribute('data-k'), 10)); return; }
});
document.addEventListener('keydown', function(e){
  if(!G || $('scrGame').classList.contains('hide')) return;
  if(!G.answered && e.key >= '1' && e.key <= '4'){ answer(parseInt(e.key, 10) - 1); e.preventDefault(); return; }
  if(G.answered && (e.key === 'Enter' || e.key === ' ')){ nextQuestion(); e.preventDefault(); }
});
$('btnStart').addEventListener('click', function(){ startGame(); });
$('btnPause').addEventListener('click', togglePause);
// 別のタブ・アプリに移ったら自動で一時停止（戻ったときに時間切れになっていないように）
document.addEventListener('visibilitychange', function(){
  if(document.hidden && G && !G.answered && !G.paused && !$('scrGame').classList.contains('hide')) togglePause();
});
$('btnQuit').addEventListener('click', function(){
  if(!G) return;
  var wasPaused = G.paused; G.paused = true;
  if(window.confirm('ここでやめる？（ここまでの記録は弱点DBに残るよ）')){ G = null; showStart(); }
  else if(G){ G.paused = wasPaused; }
});

showStart();
