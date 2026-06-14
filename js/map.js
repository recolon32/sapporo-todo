// 課題マップ：関係ネットワーク図 ＋ カテゴリ×時間軸マトリクス
async function init() {
  await loadData();
  renderLegend(CAT_COLOR);
  renderNetwork(CAT_COLOR);
  renderMatrix();
}

function renderLegend(catColor) {
  document.getElementById("legend").innerHTML = CATS.map(c =>
    `<span class="legend-item"><span class="legend-dot" style="background:${catColor[c.id]}"></span>${esc(c.name)}</span>`
  ).join("");
}

function renderNetwork(catColor) {
  const W = 720, H = 720, cx = W / 2, cy = H / 2, R = 300;
  // カテゴリ順に並べて円周上へ配置（同カテゴリが隣り合う）
  const ordered = [];
  for (const c of CATS) for (const it of ISSUES.filter(x => x.id && x.category === c.id)) ordered.push(it);
  const n = ordered.length;
  const pos = {};
  ordered.forEach((it, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    pos[it.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  // 関連の線（重複を防ぐためペアを正規化）
  const seen = new Set();
  let lines = "";
  for (const it of ordered) {
    for (const rid of (it.related || [])) {
      if (!pos[rid]) continue;
      const key = [it.id, rid].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const a = pos[it.id], b = pos[rid];
      lines += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" class="net-edge" />`;
    }
  }

  let nodes = "";
  ordered.forEach(it => {
    const p = pos[it.id];
    const r = 6 + importance(it); // 重要度で大きさを変える
    nodes += `<a href="issue.html?id=${encodeURIComponent(it.id)}" class="net-node">
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="${catColor[it.category]}">
        <title>${esc(it.title)}（${esc(CAT_NAME[it.category])} / ${esc(it.timeframe)}）</title>
      </circle></a>`;
  });

  document.getElementById("network").innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" class="network-svg" role="img" aria-label="課題の関係ネットワーク図">
      <g class="net-edges">${lines}</g>
      <g class="net-nodes">${nodes}</g>
    </svg>`;
}

function renderMatrix() {
  const head = `<tr><th>カテゴリ＼時間軸</th>${TF_ORDER.map(tf =>
    `<th>${esc(tf)}</th>`).join("")}</tr>`;
  const rows = CATS.map(c => {
    const cells = TF_ORDER.map(tf => {
      const items = ISSUES.filter(it => it.category === c.id && it.timeframe === tf);
      const inner = items.map(it =>
        `<a href="issue.html?id=${encodeURIComponent(it.id)}">${esc(it.title)}</a>`).join("");
      return `<td>${inner || '<span class="cell-empty">—</span>'}</td>`;
    }).join("");
    return `<tr><th class="row-head">${esc(c.name)}</th>${cells}</tr>`;
  }).join("");
  document.getElementById("matrix").innerHTML =
    `<table class="matrix-table">${head}${rows}</table>`;
}

init();
