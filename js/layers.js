/* fibersprung.com: the layer story on the homepage.
   The page works without this file: every step shows its own figure.
   When motion is allowed, this pins the figures in one place and swaps them
   as each step reaches the reader. No scroll listener; an IntersectionObserver
   watches the steps. */
(function () {
  "use strict";
  var root = document.documentElement;
  var section = document.getElementById("layers");
  if (!section || !("IntersectionObserver" in window)) { return; }

  var beats = Array.prototype.slice.call(section.querySelectorAll("[data-plates]"));
  var plates = Array.prototype.slice.call(section.querySelectorAll(".plate"));
  var steps = Array.prototype.slice.call(section.querySelectorAll(".step"));
  var links = Array.prototype.slice.call(section.querySelectorAll(".surface-switch a"));
  var motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
  var tallEnough = window.matchMedia("(min-height: 520px)");
  var wide = window.matchMedia("(min-width: 900px)");
  var watcher = null;
  var starter = null;
  var current = null;

  function show(beat) {
    if (beat === current) { return; }
    current = beat;
    var count = parseInt(beat.getAttribute("data-plates"), 10);
    plates.forEach(function (plate, i) {
      plate.classList.toggle("is-on", i < count);
      plate.classList.toggle("is-current", i === count - 1);
    });
    steps.forEach(function (step) { step.classList.toggle("is-current", step.contains(beat)); });
    links.forEach(function (link) {
      if (link.getAttribute("href") === "#" + beat.id) { link.setAttribute("aria-current", "true"); }
      else { link.removeAttribute("aria-current"); }
    });
  }

  function watch() {
    if (watcher) { watcher.disconnect(); }
    /* A thin line across the viewport: the middle on wide screens, lower on phones
       where the pinned figure owns the top. The step crossing the line is showing. */
    var margin = wide.matches ? "-50% 0px -50% 0px" : "-72% 0px -28% 0px";
    watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { show(entry.target); } });
    }, { rootMargin: margin, threshold: 0 });
    beats.forEach(function (beat) { watcher.observe(beat); });
  }

  function start() {
    root.classList.add("layers-pin");
    current = null;
    show(beats[0]);
    watch();
    if (!starter) {
      starter = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { section.classList.add("is-started"); starter.disconnect(); }
        });
      }, { threshold: 0.35 });
      starter.observe(plates[0]);
    }
  }

  function stop() {
    root.classList.remove("layers-pin");
    if (watcher) { watcher.disconnect(); watcher = null; }
    current = null;
    plates.forEach(function (plate) { plate.classList.remove("is-on", "is-current"); });
    steps.forEach(function (step) { step.classList.remove("is-current"); });
    links.forEach(function (link) { link.removeAttribute("aria-current"); });
  }

  function sync() {
    if (motionOk.matches && tallEnough.matches) { start(); } else { stop(); }
  }

  motionOk.addEventListener("change", sync);
  tallEnough.addEventListener("change", sync);
  wide.addEventListener("change", function () { if (root.classList.contains("layers-pin")) { watch(); } });
  sync();
})();
