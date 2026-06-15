// トップページ：4カラムの要約カードグリッド
let currentCat = "";
let currentSort = "category";   // 既定はカテゴリ順

async function init() {
  await loadData();
  renderFilterButtons();
  renderSortButtons();
  render();
}

function renderSortButtons() {
  const wrap = document.getElementById("sort-buttons");
  const opts = [["category", "カテゴリ順"], ["importance", "重要度順"]];
  wrap.innerHTML = opts.map(([v, l]) =>
    `<button class="filter-btn" data-sort="${v}">${l}</button>`).join("");
  wrap.querySelectorAll(".filter-btn").forEach(btn =>
    btn.addEventListener("click", () => { currentSort = btn.dataset.sort; render(); }));
}

function syncSortButtons() {
  document.querySelectorAll("#sort-buttons .filter-btn").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.sort === currentSort));
}

function renderFilterButtons() {
  const wrap = document.getElementById("filter-buttons");
  const all = `<button class="filter-btn all" data-id="">すべて</button>`;
  const cats = CATS.map(c =>
    `<button class="filter-btn" data-id="${c.id}" style="--cat:${CAT_COLOR[c.id]}">
      <span class="fdot"></span>${esc(c.name)}</button>`).join("");
  wrap.innerHTML = all + cats;
  wrap.querySelectorAll(".filter-btn").forEach(btn =>
    btn.addEventListener("click", () => { currentCat = btn.dataset.id; render(); }));
}

function syncActiveButton() {
  document.querySelectorAll("#filter-buttons .filter-btn").forEach(btn => {
    const active = btn.dataset.id === currentCat;
    btn.classList.toggle("active", active);
    btn.style.background = active && btn.dataset.id ? CAT_COLOR[btn.dataset.id] : "";
  });
}

function cardHTML(it) {
  const isPlan = it.kind === "plan";
  const planBadge = isPlan ? `<span class="badge plan">計画・施策</span>` : "";
  const meta = isPlan
    ? `<span class="plan-tag">進行中の計画・施策</span>`
    : `<span>緊急 ${dots(it.urgency)}</span><span>深刻 ${dots(it.severity)}</span>`;
  return `<a class="card${isPlan ? " card-plan" : ""}" href="i/${encodeURIComponent(it.id)}.html">
    <div class="card-top">
      <span class="card-cat">${esc(CAT_NAME[it.category] || it.category)}</span>
      ${planBadge}<span class="badge ${tfClass(it.timeframe)}">${esc(it.timeframe)}</span>
    </div>
    <h3 class="card-title">${esc(it.title)}</h3>
    <p class="card-summary">${esc(it.summary)}</p>
    <div class="card-meta">${meta}</div>
  </a>`;
}

function render() {
  syncActiveButton();
  syncSortButtons();
  const cat = currentCat;
  const order = currentSort;
  let list = ISSUES.filter(it => !cat || it.category === cat);
  const root = document.getElementById("issues");

  if (order === "importance") {
    list = [...list].sort((a, b) => importance(b) - importance(a));
    root.innerHTML = `<div class="card-grid">${list.map(cardHTML).join("")}</div>`;
  } else {
    // カテゴリ順：カテゴリ見出し＋カードグリッド
    root.innerHTML = CATS
      .filter(c => !cat || c.id === cat)
      .map(c => {
        const inCat = list.filter(it => it.category === c.id);
        if (!inCat.length) return "";
        return `<section class="category-block">
          <h2 class="category-name">${esc(c.name)}</h2>
          <p class="category-desc">${esc(c.description)}</p>
          <div class="card-grid">${inCat.map(cardHTML).join("")}</div>
        </section>`;
      }).join("");
  }
}

init();
