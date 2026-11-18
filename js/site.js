/* fibersprung.com: small shared behavior.
   The menu, the header that hides on phones, the Talk to us button, and the live chat loader. */
(function () {
  "use strict";

  /* Live chat (tawk.to). The ID from the tawk.to widget code, as "property/widget"
     (the two parts of the embed address after embed.tawk.to/).
     Set: the Talk to us button goes and the widget loads. Empty: the button stands in for chat.
     The widget's color is not set here. tawk.to takes it from its dashboard
     (Chat Widget, Widget Appearance): set it to black, #000000. */
  var TAWK_ID = "6afe0c39ca4ab43cc757a9bd/1k7o5vg9c";

  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  var talk = document.querySelector("[data-talk]");
  var narrow = window.matchMedia("(max-width: 1023px)");

  /* Mobile menu: a plain disclosure. Escape closes it and returns focus. */
  var menuIsOpen = function () { return !!btn && btn.getAttribute("aria-expanded") === "true"; };
  var setMenu = function (open) {
    nav.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Menu");
  };
  if (btn && nav) {
    btn.addEventListener("click", function () { setMenu(!menuIsOpen()); });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function () { setMenu(false); });
  }

  /* Talk to us: a button that opens the phones and the email in a small panel.
     Escape or Close shuts it and returns focus to the button. A press outside shuts it. */
  var talkBtn = null;
  var talkPanel = null;
  var talkIsOpen = function () { return !!talkPanel && !talkPanel.hidden; };
  var setTalk = function (open, refocus) {
    talkPanel.hidden = !open;
    talkBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) { talk.classList.remove("is-away"); talkPanel.focus(); }
    else if (refocus) { talkBtn.focus(); }
  };
  if (talk && TAWK_ID) {
    talk.remove();
    talk = null;
  } else if (talk) {
    talkBtn = talk.querySelector(".talk__btn");
    talkPanel = talk.querySelector(".talk__panel");
    talkBtn.addEventListener("click", function () { setTalk(!talkIsOpen(), false); });
    talk.querySelector(".talk__close").addEventListener("click", function () { setTalk(false, true); });
    document.addEventListener("pointerdown", function (e) {
      if (talkIsOpen() && !talk.contains(e.target)) { setTalk(false, false); }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") { return; }
    if (talkIsOpen()) { setTalk(false, true); }
    else if (menuIsOpen()) { setMenu(false); btn.focus(); }
  });

  /* On scroll, once per frame:
     1. Under 1024 px the header slides away on the way down and returns on the way up.
        It stays while the menu is open, and until its own height has scrolled off.
     2. The Talk to us button steps aside while it would sit on a form's send button. */
  var sends = document.querySelectorAll('form button[type="submit"]');
  var lastY = Math.max(0, window.scrollY);
  var queued = false;
  var showHeader = function (show) { root.classList.toggle("header-hidden", !show); };
  var meets = function (a, b) {
    var gap = 12;
    return b.width > 0 && a.left - gap < b.right && a.right + gap > b.left && a.top - gap < b.bottom && a.bottom + gap > b.top;
  };
  var onFrame = function () {
    queued = false;
    var y = Math.max(0, window.scrollY);
    if (header) {
      if (!narrow.matches || menuIsOpen() || y < header.offsetHeight) { showHeader(true); }
      else if (y > lastY + 4) { showHeader(false); }
      else if (y < lastY - 4) { showHeader(true); }
    }
    if (Math.abs(y - lastY) > 4) { lastY = y; }
    if (talkBtn && sends.length && !talkIsOpen()) {
      var box = talkBtn.getBoundingClientRect();
      var away = false;
      sends.forEach(function (send) { if (meets(box, send.getBoundingClientRect())) { away = true; } });
      talk.classList.toggle("is-away", away);
    }
  };
  var queue = function () {
    if (!queued) { queued = true; window.requestAnimationFrame(onFrame); }
  };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });
  if (header) { header.addEventListener("focusin", function () { showHeader(true); }); }
  queue();

  /* Live chat. The widget loads once the page has finished loading and the browser is idle,
     or on the first scroll, tap or key press if that comes first. Never during page load. */
  if (TAWK_ID) {
    /* The "Start a live chat" rows stay hidden until chat is connected. */
    document.querySelectorAll("[data-chat-row]").forEach(function (el) { el.hidden = false; });
    var loaded = false;
    var load = function () {
      if (loaded) { return; }
      loaded = true;
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://embed.tawk.to/" + TAWK_ID;
      s.charset = "UTF-8";
      s.setAttribute("crossorigin", "*");
      document.head.appendChild(s);
    };
    ["scroll", "pointerdown", "keydown"].forEach(function (type) {
      window.addEventListener(type, load, { once: true, passive: true });
    });
    var whenIdle = function () {
      if (window.requestIdleCallback) { window.requestIdleCallback(load, { timeout: 3000 }); }
      else { window.setTimeout(load, 1); }
    };
    if (document.readyState === "complete") { whenIdle(); }
    else { window.addEventListener("load", whenIdle, { once: true }); }
    document.querySelectorAll("[data-chat]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        load();
        var tries = 0;
        var open = function () {
          if (window.Tawk_API && typeof window.Tawk_API.maximize === "function") { window.Tawk_API.maximize(); }
          else if (tries++ < 40) { window.setTimeout(open, 150); }
        };
        open();
      });
    });
  }
})();
