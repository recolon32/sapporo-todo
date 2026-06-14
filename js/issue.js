// 課題詳細ページ：?id=... を読み、深い情報を表示
async function init() {
  await loadData();
  const id = new URLSearchParams(location.search).get("id");
  const it = id && issueById(id);
  const root = document.getElementById("detail");

  if (!it) {
    root.innerHTML = `<p>課題が見つかりませんでした。<a href="index.html">課題一覧へ戻る</a></p>`;
    document.title = "課題が見つかりません | 札幌市の課題";
    return;
  }
  document.title = `${it.title} | 札幌市が先送りせず解くべき課題`;
  root.innerHTML = detailHTML(it);
}

function listSection(title, items) {
  if (!items || !items.length) return "";
  return `<section class="detail-section"><h2>${esc(title)}</h2>
    <ul>${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>`;
}

function detailHTML(it) {
  const data = (it.data || [])
    .map(d => `<tr><th>${esc(d.label)}</th><td>${esc(d.value)}</td></tr>`).join("");
  const related = (it.related || [])
    .map(rid => issueById(rid))
    .filter(Boolean)
    .map(r => `<li><a href="issue.html?id=${encodeURIComponent(r.id)}">${esc(r.title)}</a>
      <span class="rel-cat">（${esc(CAT_NAME[r.category] || r.category)}）</span></li>`).join("");
  const plans = (it.plans || [])
    .map(p => `<li><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a></li>`).join("");
  const sources = (it.sources || [])
    .map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join("");

  return `
  <p class="breadcrumb"><a href="index.html">← 課題一覧</a></p>
  <div class="detail-head">
    <span class="card-cat">${esc(CAT_NAME[it.category] || it.category)}</span>
    ${it.kind === "plan" ? `<span class="badge plan">計画・施策</span>` : ""}
    <span class="badge ${tfClass(it.timeframe)}">${esc(it.timeframe)}</span>
  </div>
  <h1 class="detail-title">${esc(it.title)}</h1>
  <p class="detail-summary">${esc(it.summary)}</p>
  <div class="detail-meta">
    ${it.kind === "plan"
      ? `<span class="plan-tag">進行中の計画・施策</span>`
      : `<span>緊急度 ${dots(it.urgency)}</span><span>深刻度 ${dots(it.severity)}</span>`}
  </div>
  <figure class="infographic">
    <img src="images/${encodeURIComponent(it.id)}.png" loading="lazy"
         alt="${esc(it.title)}の要約インフォグラフィック"
         onerror="this.closest('.infographic').remove()">
    <figcaption>Geminiによる自動生成のため、誤字や誤りが含まれる場合があります。</figcaption>
  </figure>

  ${it.background ? `<section class="detail-section"><h2>背景</h2><p>${esc(it.background)}</p></section>` : ""}
  ${data ? `<section class="detail-section"><h2>主要データ</h2><table class="data-table">${data}</table></section>` : ""}
  ${listSection("事実", it.facts)}
  ${it.interpretation ? `<section class="detail-section"><h2>解釈</h2><p>${esc(it.interpretation)}</p></section>` : ""}
  ${listSection("提案", it.proposals)}
  ${it.team ? `<section class="detail-section"><h2>検討体制・メンバー</h2><p>${esc(it.team)}</p></section>` : ""}
  ${it.aiNote ? `<section class="detail-section ai-note"><h2>AIノート</h2><p>${esc(it.aiNote)}</p></section>` : ""}
  ${related ? `<section class="detail-section"><h2>関連課題</h2><ul class="related-list">${related}</ul></section>` : ""}
  ${plans ? `<section class="detail-section"><h2>関連する市の計画・制度</h2><ul>${plans}</ul></section>` : ""}
  ${sources ? `<section class="detail-section"><h2>出典</h2><ul>${sources}</ul></section>` : ""}
  `;
}

init();
