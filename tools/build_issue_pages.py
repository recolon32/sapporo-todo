#!/usr/bin/env python3
"""課題ごとの静的ページ（i/<id>.html）を生成する。

- data/issues.json と data/categories.json を読み、各課題を静的HTMLに焼き込む。
- ?id= のクエリに依存しない普通のURLになり、課題ごとのOGP（プレビュー）も埋め込む。
- 課題やデータを更新したら、このスクリプトを再実行してから push すること。

  実行: python3 tools/build_issue_pages.py
"""
import json
import os
import html

# ===== 設定（公開先が変わったら SITE_BASE を変更）=====
SITE_BASE = "https://recolon32.github.io/sapporo-todo"
VERSION = "20260721b"  # CSS/JS のキャッシュ用バージョン

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TF_CLASS = {"今すぐ": "tf-now", "5年以内": "tf-5y", "10年以内": "tf-10y", "世代単位": "tf-gen"}


def img_file(iid):
    """課題のインフォグラフィック画像名を返す（png優先、なければjpg。無ければ空文字）。"""
    for ext in ("png", "jpg"):
        if os.path.exists(os.path.join(ROOT, "images", f"{iid}.{ext}")):
            return f"{iid}.{ext}"
    return ""


def esc(s):
    return html.escape(str(s if s is not None else ""), quote=True)


def dots(n):
    n = n or 0
    out = '<span class="scale">'
    for i in range(1, 6):
        out += f'<span class="dot{" on" if i <= n else ""}"></span>'
    return out + "</span>"


def list_section(title, items):
    if not items:
        return ""
    lis = "".join(f"<li>{esc(x)}</li>" for x in items)
    return f'<section class="detail-section"><h2>{esc(title)}</h2><ul>{lis}</ul></section>'


def deepdive_section(it):
    dd = it.get("deepDive")
    if not dd:
        return ""
    items = ""
    for d in dd:
        srcs = "".join(
            f'<li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["title"])}</a></li>'
            for s in d.get("sources", []))
        src_html = f'<div class="dd-src"><span class="dd-src-label">出典</span><ul>{srcs}</ul></div>' if srcs else ""
        items += (f'<div class="dd-item">'
                  f'<p class="dd-q">{esc(d.get("q"))}</p>'
                  f'<p class="dd-a">{esc(d.get("a"))}</p>'
                  f'{src_html}</div>')
    return f'<section class="detail-section deep-dive"><h2>深掘り — 市民の声と答え</h2>{items}</section>'


def entities_section(it):
    ents = it.get("entities")
    if not ents:
        return ""
    rows = sorted(ents, key=lambda e: (e.get("funding") or 0), reverse=True)

    def yen(n):
        return "－" if n is None else f"{n:,}"

    def son(n):
        if n is None:
            return "－"
        if n < 0:
            return f"▲{abs(n):,}"
        return f"{n:,}"

    # 比較表
    trs = ""
    for e in rows:
        neg = (e.get("profit") is not None and e["profit"] < 0)
        cls = ' class="ent-neg"' if neg else ""
        trs += (f'<tr{cls}><td>{esc(e["name"])}</td><td class="ent-type">{esc(e.get("type",""))}</td>'
                f'<td class="ent-num">{son(e.get("profit"))}</td>'
                f'<td class="ent-num">{yen(e.get("funding"))}</td></tr>')
    table = (
        '<table class="data-table entity-table">'
        '<thead><tr><th>団体名</th><th>形態</th><th>損益</th><th>市の財政的関与</th></tr></thead>'
        f'<tbody>{trs}</tbody></table>'
        '<p class="chart-src">単位：百万円（令和6年度決算）。損益は、株式会社は当期純利益、公益・一般法人は当期経常増減額。'
        '「市の財政的関与」は補助金・交付金・委託料などの合計（多くは指定管理の委託料）。▲は赤字。</p>'
    )

    # インフォグラフィック（市の財政的関与 上位12団体の横棒）
    top = [e for e in rows if (e.get("funding") or 0) > 0][:12]
    maxf = max((e["funding"] for e in top), default=1)
    rowh, padt, padl, barw = 26, 30, 232, 300
    H = padt + rowh * len(top) + 14
    svg = [f'<svg viewBox="0 0 600 {H}" role="img" aria-label="出資団体への市の財政的関与（上位12団体・百万円）" preserveAspectRatio="xMidYMid meet">']
    svg.append(f'<text x="0" y="16" font-size="12" font-weight="600" fill="var(--color-text)">市がお金を出している団体（上位12・百万円）</text>')
    for i, e in enumerate(top):
        y = padt + rowh * i
        w = max(2, e["funding"] / maxf * barw)
        neg = (e.get("profit") is not None and e["profit"] < 0)
        color = "#c0392b" if neg else "var(--color-accent)"
        nm = e["name"]
        if len(nm) > 13:
            nm = nm[:12] + "…"
        svg.append(f'<text x="{padl-6}" y="{y+13}" text-anchor="end" font-size="10.5" fill="var(--color-text)">{esc(nm)}</text>')
        svg.append(f'<rect x="{padl}" y="{y+3}" width="{w:.1f}" height="16" rx="2" fill="{color}"/>')
        svg.append(f'<text x="{padl+w+5:.1f}" y="{y+15}" font-size="10" fill="var(--color-text-muted)">{e["funding"]:,}</text>')
    svg.append('</svg>')
    graphic = (f'<figure class="chart-card ent-graphic">{"".join(svg)}'
               '<p class="chart-src">赤いバーは損益がマイナスの団体。金額の多くは公共施設を運営させるための委託料（指定管理料）です。</p></figure>')

    lead = ('<p>市が出資する団体を、同じ物差しで並べました。大切なのは「赤字＝悪」ではなく、'
            '<strong>公共目的でやっている団体（住宅・下水道・防災など）</strong>と、'
            '<strong>収益をねらえる団体</strong>を分けて見ることです。'
            'そして市にとっての「効果」は団体の黒字ではなく、<strong>市の持ち出し（補助・委託・補填）がどれだけ減らせるか</strong>で測ります。</p>')
    return (f'<section class="detail-section"><h2>団体別の比較（令和6年度決算）</h2>'
            f'{lead}{graphic}{table}</section>')


def build_detail(it, cat_name, by_id, has_image):
    is_plan = it.get("kind") == "plan"
    tf = TF_CLASS.get(it.get("timeframe"), "tf-gen")
    plan_badge = '<span class="badge plan">計画・施策</span>' if is_plan else ""
    meta = ('<span class="plan-tag">進行中の計画・施策</span>' if is_plan
            else f'<span>緊急度 {dots(it.get("urgency"))}</span><span>深刻度 {dots(it.get("severity"))}</span>')

    fig = ""
    if has_image:
        fig = (f'<figure class="infographic">'
               f'<img src="../images/{esc(img_file(it["id"]))}" loading="lazy" '
               f'alt="{esc(it["title"])}の要約インフォグラフィック">'
               f'<figcaption>Geminiによる自動生成です。AIによる推論でAI独自の課題解決案が付与されている場合があります。</figcaption></figure>')

    data = "".join(f'<tr><th>{esc(d.get("label"))}</th><td>{esc(d.get("value"))}</td></tr>'
                   for d in it.get("data", []))
    data_sec = f'<section class="detail-section"><h2>主要データ</h2><table class="data-table">{data}</table></section>' if data else ""
    ent_sec = entities_section(it)

    related = "".join(
        f'<li><a href="{esc(r["id"])}.html">{esc(r["title"])}</a>'
        f'<span class="rel-cat">（{esc(cat_name.get(r["category"], r["category"]))}）</span></li>'
        for r in (by_id.get(rid) for rid in it.get("related", [])) if r)
    related_sec = f'<section class="detail-section"><h2>関連課題</h2><ul class="related-list">{related}</ul></section>' if related else ""

    plans = "".join(f'<li><a href="{esc(p["url"])}" target="_blank" rel="noopener">{esc(p["title"])}</a></li>'
                    for p in it.get("plans", []))
    plans_sec = f'<section class="detail-section"><h2>関連する市の計画・制度</h2><ul>{plans}</ul></section>' if plans else ""

    sources = "".join(f'<li><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["title"])}</a></li>'
                      for s in it.get("sources", []))
    sources_sec = f'<section class="detail-section"><h2>出典</h2><ul>{sources}</ul></section>' if sources else ""

    bg = f'<section class="detail-section"><h2>背景</h2><p>{esc(it["background"])}</p></section>' if it.get("background") else ""
    interp = f'<section class="detail-section"><h2>解釈</h2><p>{esc(it["interpretation"])}</p></section>' if it.get("interpretation") else ""
    team = f'<section class="detail-section"><h2>検討体制・メンバー</h2><p>{esc(it["team"])}</p></section>' if it.get("team") else ""
    ainote = f'<section class="detail-section ai-note"><h2>AIノート</h2><p>{esc(it["aiNote"])}</p></section>' if it.get("aiNote") else ""

    return f"""
  <p class="breadcrumb"><a href="../index.html">← 課題一覧</a></p>
  <div class="detail-head">
    <span class="card-cat">{esc(cat_name.get(it["category"], it["category"]))}</span>
    {plan_badge}<span class="badge {tf}">{esc(it.get("timeframe"))}</span>
  </div>
  <h1 class="detail-title">{esc(it["title"])}</h1>
  <p class="detail-summary">{esc(it.get("summary"))}</p>
  <div class="detail-meta">{meta}</div>
  {fig}
  {bg}
  {data_sec}
  {ent_sec}
  {list_section("事実", it.get("facts"))}
  {interp}
  {list_section("提案", it.get("proposals"))}
  {deepdive_section(it)}
  {team}
  {ainote}
  {related_sec}
  {plans_sec}
  {sources_sec}
"""


def jsonld(it, cat_name, has_image, url):
    graph = [{
        "@type": "Article",
        "headline": it["title"],
        "description": it.get("summary", ""),
        "inLanguage": "ja",
        "isAccessibleForFree": True,
        "url": url,
        "mainEntityOfPage": url,
        "articleSection": cat_name.get(it["category"], it["category"]),
        "author": {"@type": "Organization", "name": "焚き火会 AIチーム", "url": SITE_BASE},
        "publisher": {"@type": "Organization", "name": "焚き火会 AIチーム", "url": SITE_BASE},
    }]
    if has_image:
        graph[0]["image"] = f"{SITE_BASE}/images/{img_file(it['id'])}"
    graph.append({
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "課題一覧", "item": f"{SITE_BASE}/"},
            {"@type": "ListItem", "position": 2, "name": it["title"], "item": url},
        ],
    })
    dd = it.get("deepDive")
    if dd:
        graph.append({
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": d.get("q", ""),
                 "acceptedAnswer": {"@type": "Answer", "text": d.get("a", "")}}
                for d in dd
            ],
        })
    data = {"@context": "https://schema.org", "@graph": graph}
    return ('<script type="application/ld+json">\n'
            + json.dumps(data, ensure_ascii=False, indent=2)
            + '\n  </script>')


def page_html(it, cat_name, by_id, has_image):
    title = esc(it["title"])
    summary = esc(it.get("summary"))
    url = f"{SITE_BASE}/i/{it['id']}.html"
    og_image = ""
    twitter_card = "summary"
    if has_image:
        thumb = f"{it['id']}-thumb.jpg"
        og_name = thumb if os.path.exists(os.path.join(ROOT, "images", thumb)) else img_file(it['id'])
        og_image = f'\n  <meta property="og:image" content="{SITE_BASE}/images/{og_name}">'
        twitter_card = "summary_large_image"
    detail = build_detail(it, cat_name, by_id, has_image)
    ld = jsonld(it, cat_name, has_image, url)
    return f"""<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}｜数字で見る札幌市・課題地図（事実・解釈・提案）</title>
  <meta name="description" content="{summary}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="数字で見る札幌市">
  <meta property="og:title" content="{title}｜数字で見る札幌市">
  <meta property="og:description" content="{summary}">
  <meta property="og:url" content="{url}">{og_image}
  <meta name="twitter:card" content="{twitter_card}">
  <link rel="stylesheet" href="../css/theme.css?v={VERSION}">
  <link rel="stylesheet" href="../css/base.css?v={VERSION}">
  <script src="../js/analytics.js?v={VERSION}"></script>
  <script src="../js/a11y.js?v={VERSION}"></script>
  {ld}
</head>
<body>
  <header class="site-header">
    <div class="container">
      <div class="a11y-fontsize" role="group" aria-label="文字サイズの調整">
        <button type="button" class="fs-btn" data-fs="dec" aria-label="文字を小さく"><span class="a">あ</span><span class="sign">−</span></button>
        <button type="button" class="fs-btn" data-fs="reset" aria-label="標準の文字サイズに戻す"><span class="a">あ</span></button>
        <button type="button" class="fs-btn" data-fs="inc" aria-label="文字を大きく"><span class="a">あ</span><span class="sign">＋</span></button>
      </div>
      <h1 class="site-title">数字で見る札幌市</h1>
      <nav class="site-nav">
        <a href="../index.html">課題一覧</a>
        <span class="nav-drop">
          <a href="../map.html">課題マップ ▾</a>
          <span class="nav-sub">
            <a href="../map.html#h-network">関係ネットワーク図</a>
            <a href="../map.html#h-matrix">時間軸マトリクス</a>
            <a href="../map.html#h-population">札幌市の人口</a>
          </span>
        </span>
        <a href="../about.html">このサイトについて</a>
      </nav>
    </div>
  </header>

  <main class="container" id="detail">{detail}</main>

  <footer class="site-footer">
    <div class="container">
      <p>本サイトは<strong>生成AIによる評価版</strong>です。特定の政党や立場による評価ではなく、AIの平等で優先的な判断軸に基づいています。SNSや出典情報による「ゆらぎ」が存在するものとします。</p>
      <p>参考：<a href="https://fladdict.github.io/japan-todo/" target="_blank" rel="noopener">日本が先送りせず解くべき課題</a>（fladdict 氏）／協力・サイト作成：<a href="https://x.com/__TAKIBI__" target="_blank" rel="noopener">焚き火会 AIチーム</a></p>
    </div>
  </footer>
</body>
</html>
"""


def main():
    cats = json.load(open(os.path.join(ROOT, "data/categories.json"), encoding="utf-8"))
    issues = json.load(open(os.path.join(ROOT, "data/issues.json"), encoding="utf-8"))
    cat_name = {c["id"]: c["name"] for c in cats}
    by_id = {it["id"]: it for it in issues}
    out_dir = os.path.join(ROOT, "i")
    os.makedirs(out_dir, exist_ok=True)

    # 既存の生成ページを掃除（孤児を残さない）
    valid = {f"{it['id']}.html" for it in issues}
    for fn in os.listdir(out_dir):
        if fn.endswith(".html") and fn not in valid:
            os.remove(os.path.join(out_dir, fn))

    n = 0
    for it in issues:
        has_image = bool(img_file(it['id']))
        with open(os.path.join(out_dir, f"{it['id']}.html"), "w", encoding="utf-8") as f:
            f.write(page_html(it, cat_name, by_id, has_image))
        n += 1
    print(f"generated {n} pages in i/")

    write_sitemap(issues)


def write_sitemap(issues):
    # 静的ページ（優先度高め）＋各課題ページ
    static_pages = [
        ("/", "1.0"),
        ("/map.html", "0.8"),
        ("/money.html", "0.7"),
        ("/about.html", "0.5"),
        ("/updates.html", "0.4"),
    ]
    urls = [(f"{SITE_BASE}{path}", pri) for path, pri in static_pages]
    urls += [(f"{SITE_BASE}/i/{it['id']}.html", "0.7") for it in issues]

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, pri in urls:
        lines.append(f"  <url><loc>{loc}</loc><priority>{pri}</priority></url>")
    lines.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8") as f:
        f.write("User-agent: *\nAllow: /\n\nSitemap: " + SITE_BASE + "/sitemap.xml\n")
    print(f"generated sitemap.xml ({len(urls)} urls) and robots.txt")


if __name__ == "__main__":
    main()
