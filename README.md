# 数字で見る札幌市 ― 先送りせず解くべき課題と、これからの話（課題地図）

放置すれば市の維持が揺らぐ**構造的な課題**を、個別の事件ではなく都市の仕組みとして整理した、生成AIによるオープンな課題地図です。AIが情報を収集し、現状と進行中の対策・計画をまとめたうえで、AIによる評価と、今後AIができることまで推論しています。

- 🌐 **公開サイト**：https://recolon32.github.io/sapporo-todo/
- 🗺️ **課題マップ**：https://recolon32.github.io/sapporo-todo/map.html
- ℹ️ **このサイトについて**：https://recolon32.github.io/sapporo-todo/about.html
- 𝕏 **問い合わせ・ご指摘**：[@__TAKIBI__](https://x.com/__TAKIBI__)（焚き火会 AIチーム）

fladdict 氏の「[日本が先送りせず解くべき課題](https://fladdict.github.io/japan-todo/)」の仕組みを参考に、その枠組みを札幌市に当てはめています。

---

## このサイトの目的

- 札幌について「短期的な賛否が分かれる個別の政策論」ではなく、**人口・財政・インフラ・安全など、放置するほど対応の選択肢が狭まる構造的課題**を可視化する。
- 課題どうしの関係を地図として俯瞰し、生活者・行政・研究者が議論する共通の土台をつくる。
- 全国共通の課題が、寒冷地・北海道の中枢都市という条件のもとでどう立ち現れるかを示す。

## 編集方針（大切にしていること）

- **生成AIによる評価版**。特定の政党や立場ではなく、AIの平等で優先的な判断軸で整理しています。
- 内容は **事実 / 解釈 / 提案** に分離し、可能な範囲で**一次情報の出典**を添えます。
- 提案には**トレードオフや反対論**も併記するよう努めます。
- 数値・出典は時点で変わる前提（「**ゆらぎ**」がある）。断定しすぎず、確認できないものは控えめに書きます。
- 誤りのご指摘により随時更新します。最終的な判断は、一次情報をご自身で確認のうえで行ってください。

## サイトの特徴

- **トップ**：8カテゴリ・全36課題を、カラーのカテゴリフィルタと4カラムの要約カードで一覧。
- **課題マップ**：力学配置の関係ネットワーク図（色＝分類・大きさ＝緊急度・線＝関連）と、カテゴリ×時間軸マトリクス。
- **課題ごとの詳細ページ**：背景・主要データ・事実・解釈・提案・検討体制・AIノート・関連課題・関連計画・出典。関心の高いテーマには「**深掘り — 市民の声と答え**」（出典付きQ&A）を掲載。
- **計画・施策の区別**：まちづくりビジョン等は「計画・施策」として課題と分けて表示。
- **インフォグラフィック**：課題によって生成AIによる図解を掲載（誤りを含む場合あり）。
- **アクセシビリティ**：右上で文字サイズを調整（あ−／あ／あ＋、設定は保存）。
- **SNS対応**：課題ごとに独立した静的URL（`i/<id>.html`）とOGPを持ち、共有時にプレビューが出ます。
- **静的サイト**：ビルド不要の HTML + CSS + JS + JSON。GitHub Pages で配信。

### カテゴリ

| id | 名称 |
|---|---|
| `snow` | 雪・寒冷地 |
| `pop` | 人口減少・高齢化 |
| `city` | 都心再開発・まちづくり |
| `transit` | 交通・公共交通 |
| `finance` | 財政・行政 |
| `industry` | 産業・観光・MICE |
| `infra` | インフラ老朽化 |
| `energy` | 環境・エネルギー |

---

## ローカルでの動かし方

`fetch` で JSON を読むため、`file://` ではなく**HTTPサーバ**で開いてください。

```bash
git clone https://github.com/recolon32/sapporo-todo.git
cd sapporo-todo
python3 -m http.server      # → http://localhost:8000/
```

課題やデータを変更したら、課題詳細ページを再生成します。

```bash
python3 tools/build_issue_pages.py
```

## ディレクトリ構成

```
index.html      トップ（カテゴリフィルタ＋4カラムカード）
map.html        課題マップ（関係ネットワーク図＋時間軸マトリクス）
about.html      サイト説明・編集方針・更新履歴
updates.html    更新履歴（全件）
issue.html      旧URL(?id=)から i/<id>.html へ転送
i/<id>.html     課題ごとの静的詳細ページ（自動生成・直接編集しない）
css/            theme.css（配色トークン） / base.css（レイアウト）
js/             data.js / app.js / map.js / analytics.js / a11y.js
data/           categories.json / issues.json / updates.json
images/         <id>.png（任意の図解） / ogp.jpg（SNS共有用OGP）
tools/          build_issue_pages.py（詳細ページ生成）
RESEARCH_GUIDE.md  課題の調査・追加手順／別地域版の作り方
```

---

## 課題を1件追加する

1. `data/issues.json` に1件追加（スキーマとテンプレは [RESEARCH_GUIDE.md](RESEARCH_GUIDE.md) 1章・7章）。
2. 必要なら図解を `images/<id>.png` に置く。
3. `data/updates.json` の先頭に更新を1行追加。
4. `python3 tools/build_issue_pages.py` で詳細ページを再生成。
5. ローカルで確認 → コミット＆プッシュ。

調査の進め方（事実／解釈／提案の分け方、出典の優先順位、検討体制やAIノート、**深掘りQ&Aの作り方**）は [RESEARCH_GUIDE.md](RESEARCH_GUIDE.md) を参照してください。

---

## 他の市町村版をつくる（再利用）

このリポジトリは、**別の都市・地域版のテンプレート**として再利用できます。コンテンツ（JSON・文言）を差し替えるだけで、トップ・詳細ページ・課題マップは自動で組み上がります。コードを書く必要はありません。

おおまかな流れ：

1. このリポジトリを複製（フォーク or clone）。
2. `data/categories.json` をその地域のカテゴリに再編成。
3. `data/issues.json` を [RESEARCH_GUIDE.md](RESEARCH_GUIDE.md) の手順で作成（最初は数件でOK）。
4. サイト名・文言・クレジット・公開先URL（`tools/build_issue_pages.py` の `SITE_BASE`）を差し替え。
5. アクセス解析 `js/analytics.js` の `GA_ID` / `ALLOW_HOSTS` を自分のものに（不要なら無効化）。
6. `python3 tools/build_issue_pages.py` で生成 → GitHub Pages 等で公開。

**詳しい差し替えチェックリストと手順は [RESEARCH_GUIDE.md](RESEARCH_GUIDE.md) の「6. 別地域版の作り方（マニュアル）」にまとめています。** まずはそちらをお読みください。

> 再利用のお願い：数値・固有名詞は必ずその地域の一次情報に当て直し、他地域版の文章をそのまま流用しないでください（編集方針の「ゆらぎ」の考え方に沿うためです）。

---

## アクセス解析とプライバシー

公開サイトでは Google アナリティクス（GA4）で利用状況を測定しています（個人を特定しません）。目的・オプトアウト方法は[このサイトについて](https://recolon32.github.io/sapporo-todo/about.html)に記載しています。

アクセス解析は**公開元ドメインでのみ作動**します（`js/analytics.js` のホスト判定）。フォークや別ドメイン、localhost では計測が動かないため、複製しても元サイトにデータが送られることはありません。

## クレジット

- 参考サイト：[日本が先送りせず解くべき課題](https://fladdict.github.io/japan-todo/)（fladdict 氏）
- 協力・サイト作成：焚き火会 AIチーム（[@__TAKIBI__](https://x.com/__TAKIBI__)）

ご指摘・お問い合わせは 𝕏 [@__TAKIBI__](https://x.com/__TAKIBI__) までお願いします。
