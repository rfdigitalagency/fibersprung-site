/* fibersprung.com: the quote form on the Contact page.
   Checks the answers, shows each problem under its field, then sends.
   Where the form goes is set in one place, on the form tag in contact.html:
   data-mailto while there is no form service, the action attribute once there is. */
(function () {
  "use strict";
  var form = document.getElementById("quote");
  if (!form) { return; }
  form.setAttribute("novalidate", "");
  var status = document.getElementById("quote-status");

  /* A link such as contact.html?floor=pro picks that floor in the list. */
  var floor = new URLSearchParams(window.location.search).get("floor");
  var floorField = form.elements.floor;
  if (floor && floorField) {
    Array.prototype.forEach.call(floorField.options, function (o) {
      if (o.getAttribute("data-key") === floor) { floorField.value = o.value; }
    });
  }

  var rules = {
    name: function (v) { return v ? "" : "Enter your name."; },
    email: function (v) {
      if (!v) { return "Enter an email address we can reply to."; }
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "That email address does not look right. Check it and try again.";
    },
    space_type: function (v) { return v ? "" : "Choose the kind of space."; },
    timeline: function (v) { return v ? "" : "Choose when you need it."; },
    size_sq_ft: function (v) { return !v || /^[\d,.\s]+$/.test(v) ? "" : "Enter a number, like 1200."; }
  };

  function setError(field, message) {
    var box = document.getElementById(field.id + "-error");
    var hint = document.getElementById(field.id + "-hint");
    if (message) {
      box.textContent = message;
      box.hidden = false;
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", box.id + (hint ? " " + hint.id : ""));
    } else {
      box.textContent = "";
      box.hidden = true;
      field.removeAttribute("aria-invalid");
      if (hint) { field.setAttribute("aria-describedby", hint.id); } else { field.removeAttribute("aria-describedby"); }
    }
  }

  function check(name) {
    var field = form.elements[name];
    var message = rules[name](field.value.trim());
    setError(field, message);
    return !message;
  }

  Object.keys(rules).forEach(function (name) {
    var field = form.elements[name];
    /* Once a field has shown an error, clear it as soon as the answer is fixed. */
    field.addEventListener("input", function () { if (field.getAttribute("aria-invalid")) { check(name); } });
    field.addEventListener("change", function () { if (field.getAttribute("aria-invalid")) { check(name); } });
  });

  function answers() {
    var lines = [];
    Array.prototype.forEach.call(form.querySelectorAll("[data-label]"), function (field) {
      /* Mail apps expect every line of a mailto body to end with a return and a line feed,
         including the breaks inside a message typed on several lines. */
      var value = field.value.trim().replace(/\r?\n/g, "\r\n");
      if (value) { lines.push(field.getAttribute("data-label").replace(/\?$/, "") + ": " + value); }
    });
    return lines.join("\r\n");
  }

  function done(title, text) {
    var box = document.createElement("div");
    box.className = "quote__done";
    box.setAttribute("tabindex", "-1");
    var h = document.createElement("h3");
    h.textContent = title;
    var p = document.createElement("p");
    p.textContent = text;
    var p2 = document.createElement("p");
    p2.textContent = "Spencer 909-553-0729. Micah 401-855-5520.";
    box.appendChild(h); box.appendChild(p); box.appendChild(p2);
    form.replaceWith(box);
    box.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = Object.keys(rules).filter(function (name) { return !check(name); });
    if (bad.length) {
      status.textContent = bad.length === 1 ? "1 answer needs a look." : bad.length + " answers need a look.";
      form.elements[bad[0]].focus();
      return;
    }
    status.textContent = "";
    /* The hidden box is only ever ticked by a bot. Say thanks and send nothing. */
    if (form.elements.botcheck && form.elements.botcheck.checked) {
      done("Thanks. We have your request.", "We will be in touch.");
      return;
    }
    var action = form.getAttribute("action");
    var mailto = form.getAttribute("data-mailto");
    if (mailto) {
      window.location.href = "mailto:" + mailto + "?subject=" + encodeURIComponent("Quote request from fibersprung.com") + "&body=" + encodeURIComponent(answers());
      status.textContent = "Your mail app should open with your answers filled in. Send that email to finish. If nothing opened, call or email us.";
      return;
    }
    var button = form.querySelector("button[type=submit]");
    button.disabled = true;
    status.textContent = "Sending.";
    fetch(action, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
      .then(function (res) {
        if (!res.ok) { throw new Error("send failed"); }
        done("Thanks. We have your request.", "We will be in touch. If it is urgent, call us.");
      })
      .catch(function () {
        button.disabled = false;
        status.textContent = "That did not send. Call us or email info@fibersprung.com instead.";
      });
  });
})();
