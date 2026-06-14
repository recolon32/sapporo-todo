// 全ページ共通：データ読込とヘルパー
const TF_CLASS = { "今すぐ": "tf-now", "5年以内": "tf-5y", "10年以内": "tf-10y", "世代単位": "tf-gen" };
const TF_ORDER = ["今すぐ", "5年以内", "10年以内", "世代単位"];

// カテゴリ配色（マップ・フィルタ共通）
const PALETTE = ["#1a5fb4", "#c0392b", "#2e8b57", "#d68910", "#7d3c98",
                 "#16a085", "#b9770e", "#5d6d7e"];

let CATS = [];
let ISSUES = [];
let CAT_NAME = {};
let CAT_COLOR = {};

async function loadData() {
  [CATS, ISSUES] = await Promise.all([
    fetch("data/categories.json").then(r => r.json()),
    fetch("data/issues.json").then(r => r.json()),
  ]);
  CAT_NAME = Object.fromEntries(CATS.map(c => [c.id, c.name]));
  CAT_COLOR = Object.fromEntries(CATS.map((c, i) => [c.id, PALETTE[i % PALETTE.length]]));
  return { CATS, ISSUES, CAT_NAME, CAT_COLOR };
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function importance(it) { return (it.urgency || 0) + (it.severity || 0); }

function tfClass(tf) { return TF_CLASS[tf] || "tf-gen"; }

// 緊急度・深刻度の●スケール
function dots(n) {
  let s = '<span class="scale">';
  for (let i = 1; i <= 5; i++) s += `<span class="dot${i <= n ? " on" : ""}"></span>`;
  return s + "</span>";
}

function issueById(id) { return ISSUES.find(x => x.id === id); }
