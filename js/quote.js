/* fibersprung.com: the quote form on the Contact page.
   Checks the answers, shows each problem under its field, then sends by fetch and answers on the page.
   Where the form goes is set in one place, the form tag in contact.html (action and access_key).
   Without script the same form posts on its own. */
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

  /* The email subject names the floor chosen, for example "Quote request: Pro". */
  function subject() {
    var chosen = floorField ? floorField.value.trim() : "";
    return chosen ? "Quote request: " + chosen : "Quote request";
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
    /* Tappable on phones. */
    [["Spencer", "909-553-0729"], ["Micah", "401-855-5520"]].forEach(function (person, i) {
      var a = document.createElement("a");
      a.href = "tel:+1" + person[1].replace(/-/g, "");
      a.textContent = person[1];
      p2.appendChild(document.createTextNode((i ? " " : "") + person[0] + " "));
      p2.appendChild(a);
      p2.appendChild(document.createTextNode("."));
    });
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
    form.elements.subject.value = subject();
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    var button = form.querySelector("button[type=submit]");
    button.disabled = true;
    status.textContent = "Sending.";
    fetch(form.getAttribute("action"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (!res.ok || !json.success) { throw new Error("send failed"); }
          done("Thanks. We have your request.", "We will be in touch. If it is urgent, call us.");
        });
      })
      .catch(function () {
        button.disabled = false;
        status.textContent = "Your request did not send. Your answers are still here, so you can try again, or call Spencer at 909-553-0729 or Micah at 401-855-5520.";
      });
  });
})();
