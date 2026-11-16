/* fibersprung.com: small shared behavior. Menu toggle and the live chat loader. */
(function () {
  "use strict";

  /* Mobile menu: a plain disclosure. Escape closes it and returns focus. */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Menu");
    };
    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        btn.focus();
      }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function () { setOpen(false); });
  }

  /* Live chat (tawk.to). Set the two IDs below once the account exists.
     The widget loads on the first scroll, tap or key press, never during page load. */
  var TAWK_PROPERTY = "";
  var TAWK_WIDGET = "";
  if (TAWK_PROPERTY && TAWK_WIDGET) {
    /* The chat button on the Contact page stays hidden until chat is connected. */
    document.querySelectorAll("[data-chat-row]").forEach(function (el) { el.hidden = false; });
    var loaded = false;
    var load = function () {
      if (loaded) { return; }
      loaded = true;
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://embed.tawk.to/" + TAWK_PROPERTY + "/" + TAWK_WIDGET;
      s.charset = "UTF-8";
      s.setAttribute("crossorigin", "*");
      document.head.appendChild(s);
    };
    ["scroll", "pointerdown", "keydown"].forEach(function (type) {
      window.addEventListener(type, load, { once: true, passive: true });
    });
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
