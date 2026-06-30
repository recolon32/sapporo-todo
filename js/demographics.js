// 札幌市の人口の見通し（課題マップ下部）。データは公開資料の調査値をハードコード。
// 数値は時点で変わる前提（サイトの「ゆらぎ」方針）。出典は各カード下に明記。
(function () {
  const W = 360, H = 230;
  const X0 = 46, X1 = 340, Y0 = 24, Y1 = 175; // プロット領域

  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  function svgOpen() {
    return `<svg viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid meet">`;
  }
  function gridY(vals, ymin, ymax, fmt) {
    let s = "";
    vals.forEach(v => {
      const y = Y1 - (v - ymin) / (ymax - ymin) * (Y1 - Y0);
      s += `<line x1="${X0}" y1="${y.toFixed(1)}" x2="${X1}" y2="${y.toFixed(1)}" stroke="var(--color-border)" stroke-width="0.5"/>`;
      s += `<text x="${X0 - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--color-text-muted)">${fmt(v)}</text>`;
    });
    return s;
  }

  // 折れ線グラフ
  function lineChart(points, opts) {
    const { ymin, ymax, ticks, fmt, valFmt, color, dashed } = opts;
    const n = points.length;
    const step = (X1 - X0) / (n - 1);
    const px = i => X0 + step * i;
    const py = v => Y1 - (v - ymin) / (ymax - ymin) * (Y1 - Y0);
    let s = svgOpen() + gridY(ticks, ymin, ymax, fmt);
    const poly = points.map((p, i) => `${px(i).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ");
    s += `<polyline points="${poly}" fill="none" stroke="${color}" stroke-width="2"${dashed ? ' stroke-dasharray="5 4"' : ""}/>`;
    points.forEach((p, i) => {
      s += `<circle cx="${px(i).toFixed(1)}" cy="${py(p.y).toFixed(1)}" r="3.2" fill="${color}"/>`;
      s += `<text x="${px(i).toFixed(1)}" y="${(py(p.y) - 8).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--color-text)">${valFmt(p.y)}</text>`;
      s += `<text x="${px(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="9" fill="var(--color-text-muted)">${esc(p.x)}</text>`;
    });
    return s + "</svg>";
  }

  // 積み上げ棒グラフ
  function stackedBar(cols, parts, opts) {
    const { max, ticks, fmt } = opts;
    let s = svgOpen() + gridY(ticks, 0, max, fmt);
    const bw = 54;
    const slot = (X1 - X0) / cols.length;
    cols.forEach((col, ci) => {
      const cx = X0 + slot * (ci + 0.5);
      let acc = 0;
      parts.forEach(pt => {
        const v = col.vals[pt.key];
        const h = v / max * (Y1 - Y0);
        const yTop = Y1 - (acc + v) / max * (Y1 - Y0);
        s += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" fill="${pt.color}"/>`;
        if (h > 16) s += `<text x="${cx.toFixed(1)}" y="${(yTop + h / 2 + 3).toFixed(1)}" text-anchor="middle" font-size="9" fill="#fff">${v}</text>`;
        acc += v;
      });
      s += `<text x="${cx.toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--color-text)">${esc(col.label)}</text>`;
    });
    return s + "</svg>";
  }

  // 単純な縦棒グラフ（カテゴリ比較）
  function simpleBar(cols, opts) {
    const { max, ticks, fmt, valFmt, bw = 46, valSize = 9.5, labSize = 9.5, refLine } = opts;
    let s = svgOpen() + gridY(ticks, 0, max, fmt);
    const slot = (X1 - X0) / cols.length;
    cols.forEach((col, ci) => {
      const cx = X0 + slot * (ci + 0.5);
      const h = col.val / max * (Y1 - Y0);
      const yTop = Y1 - h;
      s += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" fill="${col.color}"/>`;
      s += `<text x="${cx.toFixed(1)}" y="${(yTop - 5).toFixed(1)}" text-anchor="middle" font-size="${valSize}" font-weight="600" fill="var(--color-text)">${valFmt(col.val)}</text>`;
      s += `<text x="${cx.toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="${labSize}" font-weight="600" fill="var(--color-text)">${esc(col.label)}</text>`;
    });
    if (refLine) {
      const y = Y1 - refLine.val / max * (Y1 - Y0);
      s += `<line x1="${X0}" y1="${y.toFixed(1)}" x2="${X1}" y2="${y.toFixed(1)}" stroke="var(--color-text)" stroke-width="1" stroke-dasharray="4 3"/>`;
      s += `<text x="${X1}" y="${(y - 4).toFixed(1)}" text-anchor="end" font-size="8.5" fill="var(--color-text)">${esc(refLine.label)}</text>`;
    }
    return s + "</svg>";
  }

  function legend(items) {
    return '<div class="chart-legend">' + items.map(i =>
      `<span class="lg"><span class="sw" style="background:${i.color}"></span>${esc(i.name)}</span>`).join("") + "</div>";
  }

  function card(title, sub, body, source) {
    return `<figure class="chart-card">
      <figcaption class="chart-title">${esc(title)}<span class="chart-sub">${esc(sub)}</span></figcaption>
      ${body}
      <p class="chart-src">出典：${source}</p>
    </figure>`;
  }

  function render() {
    const wrap = document.getElementById("demographics");
    if (!wrap) return;

    // 1. 高齢化率の推移
    const aging = lineChart(
      [{ x: "2020", y: 27.9 }, { x: "2030", y: 31.3 }, { x: "2040", y: 36.2 }, { x: "2050", y: 39.4 }],
      { ymin: 20, ymax: 45, ticks: [20, 30, 40], fmt: v => v + "%", valFmt: v => v + "%", color: "var(--color-accent)" }
    );

    // 2. 年齢3区分（万人）2015 → 2060
    const ageParts = [
      { key: "young", name: "年少（0–14）", color: "#2e8b57" },
      { key: "work", name: "生産年齢（15–64）", color: "#1a5fb4" },
      { key: "old", name: "老年（65–）", color: "#c0392b" },
    ];
    const ageBar = stackedBar(
      [{ label: "2015", vals: { young: 22, work: 124, old: 49 } },
       { label: "2060", vals: { young: 13, work: 76, old: 66 } }],
      ageParts, { max: 200, ticks: [0, 100, 200], fmt: v => v + "万" }
    ) + legend(ageParts);

    // 3. 合計特殊出生率（実績＋希望出生率の想定）
    const birth = lineChart(
      [{ x: "2018", y: 1.14 }, { x: "2023", y: 0.96 }, { x: "想定30", y: 1.65 }, { x: "想定40", y: 1.8 }],
      { ymin: 0.8, ymax: 2.0, ticks: [1.0, 1.5, 2.0], fmt: v => v.toFixed(1), valFmt: v => v.toFixed(2), color: "#c0392b" }
    ) + '<p class="chart-note">右2点は市・国の「希望出生率」を満たした場合の想定値（目標）。</p>';

    // 4. 高齢単身世帯（ひとり暮らし高齢者）
    const solo = `<div class="stat-card">
        <div class="stat-big">18.7<span class="stat-unit">%</span></div>
        <div class="stat-cap">2040年に一般世帯の約<strong>5世帯に1世帯</strong>が高齢単身世帯になる見込み</div>
        <div class="stat-sub">高齢夫婦のみ世帯も2020年で11.4%（約11.1万世帯）</div>
      </div>`;

    // 5. 高齢者1人を支える現役世代（胴上げ→騎馬戦→肩車）
    const support = lineChart(
      [{ x: "2010", y: 3.1 }, { x: "2020", y: 2.2 }, { x: "2040", y: 1.3 }],
      { ymin: 0, ymax: 3.5, ticks: [1, 2, 3], fmt: v => v + "人", valFmt: v => v.toFixed(1) + "人", color: "#8e44ad" }
    ) + '<p class="chart-note">65歳以上1人を支える20〜64歳の人数。2040年はほぼ「1人が1人を支える」肩車型へ。</p>';

    // 6. 区別の高齢化率の格差（10区・令和2年国勢調査）
    const wardColor = v => v >= 30 ? "#c0392b" : (v < 26 ? "#1a5fb4" : "var(--color-accent)");
    const wardData = [
      { label: "南", val: 35.9 }, { label: "厚別", val: 32.7 }, { label: "手稲", val: 31.8 },
      { label: "清田", val: 30.6 }, { label: "西", val: 28.2 }, { label: "北", val: 27.1 },
      { label: "東", val: 26.3 }, { label: "豊平", val: 25.6 }, { label: "白石", val: 25.2 },
      { label: "中央", val: 23.8 },
    ].map(w => ({ ...w, color: wardColor(w.val) }));
    const wardGap = simpleBar(wardData,
      { max: 40, ticks: [0, 20, 40], fmt: v => v + "%", valFmt: v => v.toFixed(1),
        bw: 20, valSize: 7.5, labSize: 8, refLine: { val: 27.8, label: "全市 27.8%" } }
    ) + '<p class="chart-note">最も高い南区（35.9%）と最も低い中央区（23.8%）で12.1ポイント差。区名は「区」を省略（数値は%）。さらにまちづくりセンター区域単位では最大42.5ポイントの差がある。</p>';

    wrap.innerHTML =
      card("高齢化率の見通し", "65歳以上人口の割合", aging,
        '<a href="https://www.city.sapporo.jp/kaigo/k500plan/documents/2024honsho_chapter3.pdf" target="_blank" rel="noopener">札幌市高齢者支援計画2024</a>') +
      card("人口の年齢構成の変化", "総人口は195万→155万（2015→2060）", ageBar,
        '<a href="https://www.city.sapporo.jp/kikaku/miraisousei/2nd/documents/miraisousei2nd_04.pdf" target="_blank" rel="noopener">札幌市人口ビジョン（2015国勢調査ベース推計）</a>') +
      card("合計特殊出生率", "2023年は0.96で過去最低", birth,
        '<a href="https://www.city.sapporo.jp/kikaku/miraisousei/2nd/documents/miraisousei2nd_04.pdf" target="_blank" rel="noopener">札幌市人口ビジョン</a>／市公表値') +
      card("ひとり暮らし高齢者の増加", "高齢単身世帯の割合", solo,
        '<a href="https://www.city.sapporo.jp/kaigo/k500plan/documents/2024honsho_chapter3.pdf" target="_blank" rel="noopener">札幌市高齢者支援計画2024</a>') +
      card("高齢者1人を支える現役世代", "胴上げ型 → 騎馬戦型 → 肩車型", support,
        '<a href="https://www.city.sapporo.jp/kikaku/miraisousei/1st/documents/plan-3.pdf" target="_blank" rel="noopener">札幌市人口ビジョン</a>／<a href="https://www.city.sapporo.jp/kaigo/k500plan/documents/2024honsho_chapter3.pdf" target="_blank" rel="noopener">高齢者支援計画2024</a>') +
      card("同じ札幌でも違う高齢化", "10区別の高齢化率（令和2年国勢調査）", wardGap,
        '<a href="https://www.city.sapporo.jp/toukei/tokusyu/documents/koureisyar5.pdf" target="_blank" rel="noopener">統計からみた札幌市の高齢者（令和5年9月）</a>');
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
