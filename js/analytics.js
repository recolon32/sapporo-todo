// Google Analytics 4（公開元ドメインでのみ計測）
//
// フォークや他都市版、localでは送信しないよう、許可ホストでだけ動作させる。
// → 共有時にこのコードを消す必要はありません（別ドメインでは自動的に無効）。
// 他都市版で使うときは GA_ID を自分の測定IDに変え、ALLOW_HOSTS を自分の公開先に変える
// （計測したくなければ ALLOW_HOSTS を空配列 [] にするか、このファイルの読み込みを外す）。
(function () {
  var GA_ID = "G-WX2TZPD9V0";
  var ALLOW_HOSTS = ["recolon32.github.io"];

  if (ALLOW_HOSTS.indexOf(location.hostname) === -1) return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);
})();
