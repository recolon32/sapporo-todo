// 文字サイズ調整（アクセシビリティ）。ルートの font-size を切り替え、localStorage に保存する。
(function () {
  var KEY = "fontScale";
  var STEPS = [90, 100, 110, 125, 140]; // %
  var DEFAULT_INDEX = 1; // 100%

  function currentIndex() {
    var i = STEPS.indexOf(parseInt(localStorage.getItem(KEY), 10));
    return i === -1 ? DEFAULT_INDEX : i;
  }
  function clamp(i) {
    return Math.max(0, Math.min(STEPS.length - 1, i));
  }
  function apply(i) {
    var pct = STEPS[i];
    document.documentElement.style.fontSize = (16 * pct / 100) + "px";
    try { localStorage.setItem(KEY, pct); } catch (e) {}
    var grp = document.querySelector(".a11y-fontsize");
    if (grp) grp.setAttribute("data-pct", pct);
  }

  // ちらつきを抑えるため読み込み時にすぐ適用（head で読み込む）。
  apply(currentIndex());

  document.addEventListener("DOMContentLoaded", function () {
    var grp = document.querySelector(".a11y-fontsize");
    if (!grp) return;
    apply(currentIndex());
    grp.addEventListener("click", function (e) {
      var b = e.target.closest("[data-fs]");
      if (!b) return;
      var i = currentIndex();
      if (b.dataset.fs === "inc") i = clamp(i + 1);
      else if (b.dataset.fs === "dec") i = clamp(i - 1);
      else i = DEFAULT_INDEX;
      apply(i);
    });
  });
})();
