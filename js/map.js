// 課題マップ：関係ネットワーク図 ＋ カテゴリ×時間軸マトリクス
let MAP_CAT = "";   // 選択中のカテゴリフィルタ
let NET = null;     // ネットワークの参照（フィルタ・ラベル用）

async function init() {
  await loadData();
  renderFilterButtons();
  renderLegend(CAT_COLOR);
  renderNetwork(CAT_COLOR);
  renderMatrix();
  applyFilter();
}

function renderFilterButtons() {
  const wrap = document.getElementById("map-filter");
  if (!wrap) return;
  const all = `<button class="filter-btn all" data-id="">すべて</button>`;
  const cats = CATS.map(c =>
    `<button class="filter-btn" data-id="${c.id}" style="--cat:${CAT_COLOR[c.id]}">
      <span class="fdot"></span>${esc(c.name)}</button>`).join("");
  wrap.innerHTML = all + cats;
  wrap.querySelectorAll(".filter-btn").forEach(btn =>
    btn.addEventListener("click", () => { MAP_CAT = btn.dataset.id; applyFilter(); }));
}

function syncFilterButtons() {
  document.querySelectorAll("#map-filter .filter-btn").forEach(btn => {
    const active = btn.dataset.id === MAP_CAT;
    btn.classList.toggle("active", active);
    btn.style.background = active && btn.dataset.id ? CAT_COLOR[btn.dataset.id] : "";
  });
}

function applyFilter() {
  syncFilterButtons();
  if (NET) {
    NET.nodeEls.forEach(e => {
      const cat = NET.nodes[+e.dataset.i].cat;
      e.classList.toggle("muted", MAP_CAT && cat !== MAP_CAT);
    });
    NET.edgeEls.forEach(e => {
      const a = NET.nodes[+e.dataset.a].cat, b = NET.nodes[+e.dataset.b].cat;
      e.classList.toggle("muted", MAP_CAT && !(a === MAP_CAT && b === MAP_CAT));
    });
  }
  document.querySelectorAll(".matrix-table tr[data-cat]").forEach(tr => {
    tr.style.display = (MAP_CAT && tr.dataset.cat !== MAP_CAT) ? "none" : "";
  });
}

function renderLegend(catColor) {
  document.getElementById("legend").innerHTML = CATS.map(c =>
    `<span class="legend-item"><span class="legend-dot" style="background:${catColor[c.id]}"></span>${esc(c.name)}</span>`
  ).join("");
}

function renderNetwork(catColor) {
  const W = 800, H = 800, cx = W / 2, cy = H / 2, Rc = 250;

  // 再現性のための簡易乱数（毎回同じ配置になるように固定シード）
  let seed = 42;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // ノード（大きさ＝緊急度、色＝分類）
  const nodes = ISSUES.filter(it => it.id).map(it => ({
    id: it.id, cat: it.category, u: it.urgency || 1, title: it.title,
    r: 6 + (it.urgency || 1) * 3, x: 0, y: 0
  }));
  const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));

  // 分類ごとの中心を円周上に配置し、その近傍にノードを集める
  const catAngle = {};
  CATS.forEach((c, i) => { catAngle[c.id] = (i / CATS.length) * 2 * Math.PI - Math.PI / 2; });
  const center = cat => (catAngle[cat] != null)
    ? { x: cx + Rc * Math.cos(catAngle[cat]), y: cy + Rc * Math.sin(catAngle[cat]) }
    : { x: cx, y: cy };
  nodes.forEach(n => { const c = center(n.cat); n.x = c.x + (rnd() - 0.5) * 60; n.y = c.y + (rnd() - 0.5) * 60; });

  // 関連エッジ（重複ペアを除去）
  const seen = new Set(); const links = [];
  ISSUES.forEach(it => (it.related || []).forEach(rid => {
    if (idx[rid] == null || idx[it.id] == null) return;
    const k = [it.id, rid].sort().join("|");
    if (seen.has(k)) return; seen.add(k);
    links.push([idx[it.id], idx[rid]]);
  }));
  const adj = nodes.map(() => new Set());
  links.forEach(([a, b]) => { adj[a].add(b); adj[b].add(a); });

  // 力学シミュレーション（読み込み時に一度だけ実行して配置を確定）
  const N = nodes.length, L = 72;
  let alpha = 1;
  for (let step = 0; step < 420; step++) {
    const fx = new Array(N).fill(0), fy = new Array(N).fill(0);
    // 斥力（charge）
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      let dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
      let d2 = dx * dx + dy * dy || 0.01, d = Math.sqrt(d2);
      let f = 2400 / d2, ux = dx / d, uy = dy / d;
      fx[i] += ux * f; fy[i] += uy * f; fx[j] -= ux * f; fy[j] -= uy * f;
    }
    // 関連の引力（spring）
    for (const [a, b] of links) {
      let dx = nodes[b].x - nodes[a].x, dy = nodes[b].y - nodes[a].y, d = Math.hypot(dx, dy) || 0.01;
      let f = (d - L) * 0.06, ux = dx / d, uy = dy / d;
      fx[a] += ux * f; fy[a] += uy * f; fx[b] -= ux * f; fy[b] -= uy * f;
    }
    // 分類中心への求心力
    for (let i = 0; i < N; i++) { const c = center(nodes[i].cat); fx[i] += (c.x - nodes[i].x) * 0.035; fy[i] += (c.y - nodes[i].y) * 0.035; }
    // 位置更新
    for (let i = 0; i < N; i++) {
      nodes[i].x += Math.max(-22, Math.min(22, fx[i] * alpha));
      nodes[i].y += Math.max(-22, Math.min(22, fy[i] * alpha));
    }
    // 衝突（重なり回避）
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      let dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y, d = Math.hypot(dx, dy) || 0.01;
      let min = nodes[i].r + nodes[j].r + 6;
      if (d < min) { let p = (min - d) / 2, ux = dx / d, uy = dy / d; nodes[i].x -= ux * p; nodes[i].y -= uy * p; nodes[j].x += ux * p; nodes[j].y += uy * p; }
    }
    alpha *= 0.985;
  }

  // viewBox をノード範囲にフィット
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => { minX = Math.min(minX, n.x - n.r); minY = Math.min(minY, n.y - n.r); maxX = Math.max(maxX, n.x + n.r); maxY = Math.max(maxY, n.y + n.r); });
  const pad = 32, vb = `${(minX - pad).toFixed(1)} ${(minY - pad).toFixed(1)} ${(maxX - minX + pad * 2).toFixed(1)} ${(maxY - minY + pad * 2).toFixed(1)}`;

  const edgesSvg = links.map(([a, b]) =>
    `<line class="net-edge" data-a="${a}" data-b="${b}" x1="${nodes[a].x.toFixed(1)}" y1="${nodes[a].y.toFixed(1)}" x2="${nodes[b].x.toFixed(1)}" y2="${nodes[b].y.toFixed(1)}"/>`).join("");
  const nodesSvg = nodes.map((n, i) =>
    `<a class="net-node" data-i="${i}" href="i/${encodeURIComponent(n.id)}.html">
      <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r}" fill="${catColor[n.cat]}">
        <title>${esc(n.title)}（${esc(CAT_NAME[n.cat])} / 緊急度${n.u}）</title>
      </circle></a>`).join("");

  const el = document.getElementById("network");
  el.innerHTML =
    `<svg viewBox="${vb}" class="network-svg" role="img" aria-label="課題の関係ネットワーク図">
      <g class="net-edges">${edgesSvg}</g>
      <g class="net-nodes">${nodesSvg}</g>
      <g class="net-labels"></g>
    </svg>`;

  const svg = el.querySelector("svg");
  const nodeEls = [...svg.querySelectorAll(".net-node")];
  const edgeEls = [...svg.querySelectorAll(".net-edge")];
  const labelG = svg.querySelector(".net-labels");
  NET = { svg, nodeEls, edgeEls, nodes, adj };

  // ホバーで隣接ノード・エッジを強調し、名前ラベルを表示
  const highlight = i => {
    svg.classList.add("hovering");
    const keep = new Set([i, ...adj[i]]);
    nodeEls.forEach(e => e.classList.toggle("hi", keep.has(+e.dataset.i)));
    edgeEls.forEach(e => e.classList.toggle("hi", +e.dataset.a === i || +e.dataset.b === i));
    labelG.innerHTML = [...keep]
      .filter(k => !(MAP_CAT && nodes[k].cat !== MAP_CAT))
      .map(k => {
        const n = nodes[k];
        return `<text class="net-label${k === i ? " is-center" : ""}" x="${n.x.toFixed(1)}" y="${(n.y - n.r - 6).toFixed(1)}" text-anchor="middle">${esc(n.title)}</text>`;
      }).join("");
  };
  const clear = () => {
    svg.classList.remove("hovering");
    nodeEls.forEach(e => e.classList.remove("hi"));
    edgeEls.forEach(e => e.classList.remove("hi"));
    labelG.innerHTML = "";
  };
  nodeEls.forEach(e => {
    const i = +e.dataset.i;
    e.addEventListener("mouseenter", () => highlight(i));
    e.addEventListener("mouseleave", clear);
  });
}

function renderMatrix() {
  const head = `<tr><th>カテゴリ＼時間軸</th>${TF_ORDER.map(tf =>
    `<th>${esc(tf)}</th>`).join("")}</tr>`;
  const rows = CATS.map(c => {
    const cells = TF_ORDER.map(tf => {
      const items = ISSUES.filter(it => it.category === c.id && it.timeframe === tf);
      const inner = items.map(it =>
        `<a href="i/${encodeURIComponent(it.id)}.html">${esc(it.title)}</a>`).join("");
      return `<td>${inner || '<span class="cell-empty">—</span>'}</td>`;
    }).join("");
    return `<tr data-cat="${c.id}"><th class="row-head">${esc(c.name)}</th>${cells}</tr>`;
  }).join("");
  document.getElementById("matrix").innerHTML =
    `<table class="matrix-table">${head}${rows}</table>`;
}

init();
