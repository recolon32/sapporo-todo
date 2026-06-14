# 課題調査・サイト構築ガイド

このサイト（札幌市の課題地図）に**課題を追加するときの調査手順**と、
**他都市版を作るときのベース**をまとめたものです。
このファイルごと複製すれば、別の都市でも同じ枠組みで組めます。

---

## 0. サイトの考え方（前提）

- 個別の事件ではなく「放置すると都市の維持が揺らぐ**構造的課題**」を扱う。
- **生成AIによる評価版**。特定の政党・立場ではなく、平等で優先的な判断軸で整理する。
- 内容は**事実 / 解釈 / 提案**に分離する。出典（できれば一次情報）を必ず添える。
- 提案には**トレードオフ・反対論も併記**する。
- 数値・出典は時点で変わる前提（「ゆらぎ」がある）。断定しすぎない。

---

## 1. データモデル（`data/issues.json` の1課題）

| フィールド | 必須 | 内容 |
|---|---|---|
| `id` | ◯ | 一意のID。`<カテゴリ接頭辞>-<連番2桁>`（例 `snow-01`）。画像ファイル名にも使う |
| `category` | ◯ | `categories.json` の `id` と一致させる |
| `title` | ◯ | 課題の見出し |
| `urgency` | ◯ | 緊急度 1–5（整数） |
| `severity` | ◯ | 深刻度 1–5（整数） |
| `timeframe` | ◯ | `今すぐ` / `5年以内` / `10年以内` / `世代単位` のいずれか |
| `summary` | ◯ | 一行要約（カードに表示） |
| `background` | 任意 | 構造的な背景の深掘り（詳細ページ用） |
| `data` | 任意 | 主要数値の配列 `[{ "label": "", "value": "" }]` |
| `facts` | ◯ | 事実（裏付けのある記述）の配列 |
| `interpretation` | ◯ | 解釈（なぜ構造問題か） |
| `proposals` | ◯ | 提案の配列（トレードオフも書く） |
| `team` | 任意 | 検討体制・メンバー。**実在の体制（出典付き）＋AI想定の追加メンバー**を併記 |
| `aiNote` | 任意 | AI・技術がどれだけ役立つか。**貢献度（小/中/大）＋具体**を書く |
| `related` | 任意 | 関連課題の `id` の配列（双方向に張ると図がきれいになる） |
| `plans` | 任意 | 関連する市の計画・制度 `[{ "title": "", "url": "" }]` |
| `sources` | ◯ | 出典 `[{ "title": "", "url": "" }]` |

**インフォグラフィック画像**：`images/<id>.png`（任意）。置けば詳細ページに自動表示、無ければ自動非表示。

---

## 2. 採点・分類の基準

### 緊急度 urgency（いつ手を打つべきか）
- 5：すでに被害・支障が出ており、今すぐ対応が必要
- 3：数年内に対応しないと選択肢が狭まる
- 1：長期的に備えればよい

### 深刻度 severity（放置した時の打撃の大きさ）
- 5：都市の維持・市民の生命に関わる
- 3：生活・財政に無視できない影響
- 1：影響は限定的

### timeframe（顕在化の時間軸）
`今すぐ` / `5年以内` / `10年以内` / `世代単位`

> 進行中の前向きな取り組み（軽度）は、urgency・severity を低め（例 1〜2）にして整理する。

---

## 3. 課題1件の調査手順

1. **テーマ設定**：構造的課題か確認（個別事件・短期の政争は除外）。
2. **一次情報を探す**。出典の優先順位：
   1. 市の公式（計画書・統計・公式サイト）
   2. 都道府県・国の資料
   3. 報道（事実確認のため複数ソース）
   4. その他（研究・専門メディア）
3. **事実 / 解釈 / 提案に分離**して書く。数値は「時点」を明記。確認できないものは断定を避ける。
4. **検討体制 `team`**：実在の委員会・所管部局（出典付き）を先に書き、AIが想定する「加えるべきメンバー像」を続ける。
5. **AIノート `aiNote`**：AI・技術の貢献度（小/中/大）と、何にどう効くかを具体的に。効かない場合は正直に「小」と書く。
6. **関連課題 `related`** を結ぶ。
7. **インフォグラフィック**（任意）：Gemini等で生成し `images/<id>.png` で保存。
8. **検証**（→ 5章）→ `updates.json` に1行 → 公開。

### 検索クエリのコツ
- 「<都市名> <テーマ> 課題 計画」「<都市名> <テーマ> 統計 推移」「<都市名> <テーマ> 値上げ／延伸／不足」など、行政の計画名・数値が出る語を足す。
- 公式PDF（`計画`『概要版』など）と報道をセットで当たると、事実と背景が揃う。

---

## 4. 課題を追加する実務手順

1. `data/issues.json` に1件追加（テンプレは7章）。`category` は `categories.json` の `id`。
2. `related` は既存の `id` を参照。双方向に張ると関係図が見やすい。
3. **整合チェック**（5章のコマンド）を実行。
4. `data/updates.json` の先頭に更新を1行追加：
   ```json
   { "date": "YYYY-MM-DD", "text": "○○の課題を追加。" }
   ```
5. 画像があれば `images/<id>.png` を置く。
6. ローカルで表示確認 → `git add -A && git commit -m "課題追加" && git push`。

---

## 5. 検証コマンド

ローカルサーバ（`file://` だと `fetch` がCORSで失敗するため必須）：
```bash
cd <このフォルダ>
python3 -m http.server   # → http://localhost:8000/
```

JSONと参照の整合チェック（カテゴリ・関連ID・重複・必須欄）：
```bash
python3 - <<'EOF'
import json
from collections import Counter
cats={c["id"] for c in json.load(open("data/categories.json"))}
issues=json.load(open("data/issues.json"))
ids=[it["id"] for it in issues]; idset=set(ids)
print("issues:",len(issues),"unique:",len(idset))
print("dups:",[k for k,v in Counter(ids).items() if v>1] or "none")
print("bad category:",[it["id"] for it in issues if it["category"] not in cats] or "none")
print("bad related:",[(it["id"],r) for it in issues for r in it.get("related",[]) if r not in idset] or "none")
required=["id","category","title","urgency","severity","timeframe","summary","facts","interpretation","proposals","sources"]
print("missing required:",[(it.get("id"),k) for it in issues for k in required if not it.get(k)] or "none")
print("per category:",dict(Counter(it["category"] for it in issues)))
EOF
```

---

## 6. 他都市版の作り方（テンプレートとして使う）

このリポジトリを複製し、以下を差し替えれば別都市版になります。

### 差し替えるもの
- **`data/categories.json`**：その都市の実情に合わせてカテゴリを再編成（接頭辞=`id`は英字短縮）。
- **`data/issues.json`**：3章の手順で作り直し。出典はその都市・県・国の公式へ。
- **サイト名・文言**：各HTMLの `<title>` と `.site-title`、フッター、`about.html` の本文。
- **`data/updates.json`**：初版エントリにリセット。
- **クレジット・参考サイト**：フッターと `about.html`。
- **`images/`**：中身を空にして README だけ残す（`images/<id>.png` 運用は同じ）。

### そのまま使えるもの（変更不要）
- `css/`（`theme.css` の変数を変えれば配色テーマだけ変更可）
- `js/`（`data.js` / `app.js` / `issue.js` / `map.js`）
- ページ構造（`index.html` / `issue.html` / `map.html` / `about.html`）
- 課題マップ（関係ネットワーク図＋時間軸マトリクス）は `categories.json`/`issues.json` から自動生成

### ファイル構成
```
index.html   … トップ（カテゴリ別カラーフィルタ＋4カラムカード）
issue.html   … 課題の詳細（?id=... で表示）
map.html     … 課題マップ（関係図＋マトリクス）
about.html   … サイト説明・編集方針・更新履歴
css/  theme.css(配色トークン) / base.css(レイアウト)
js/   data.js(共通) / app.js(トップ) / issue.js(詳細) / map.js(マップ)
data/ categories.json / issues.json / updates.json
images/ <id>.png（任意のインフォグラフィック）
```

---

## 7. コピペ用：課題テンプレJSON

```json
{
  "id": "xxx-01",
  "category": "xxx",
  "title": "",
  "urgency": 3,
  "severity": 3,
  "timeframe": "5年以内",
  "summary": "",
  "background": "",
  "data": [
    { "label": "", "value": "" }
  ],
  "facts": [
    ""
  ],
  "interpretation": "",
  "proposals": [
    ""
  ],
  "team": "実在の体制（出典付き）＋AIが想定する追加メンバー像。",
  "aiNote": "AIの貢献度は小/中/大。何にどう役立つかを具体的に。",
  "related": [],
  "plans": [
    { "title": "", "url": "" }
  ],
  "sources": [
    { "title": "", "url": "" }
  ]
}
```

---

## 8. AIに調査を頼むときのプロンプト雛形

> 「【都市名】の構造的課題のうち〈テーマ〉について、公開情報（市・県・国の公式資料と報道）を調べ、
> 次のJSON1件にまとめてください。事実・解釈・提案を分け、数値には時点を、各記述に出典URLを付け、
> 確認できないものは断定を避けてください。`team` は実在の検討体制（出典付き）＋AI想定メンバー、
> `aiNote` はAIの貢献度（小/中/大）と具体策を書いてください。スキーマは RESEARCH_GUIDE.md の7章に従います。」
