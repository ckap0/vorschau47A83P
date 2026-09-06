/* Villa Solitude – Sprachumschaltung, Menü, Anfrageformular */
document.documentElement.classList.add("js");
// Sicherheitsnetz: nur falls das Einblenden weiter unten gar nicht erst anläuft
// (alter Browser, Skriptfehler) – sonst würde es die Scroll-Animation aushebeln.
var revealLaeuft = false;
setTimeout(function () {
  if (revealLaeuft) return;
  document.querySelectorAll(".reveal, .timeline, .fall").forEach(function (t) { t.classList.add("in"); });
}, 2000);
// Bilder, die nicht laden (z. B. in einer Vorschau ohne Internet), ausblenden – der grüne Rahmen bleibt
document.addEventListener("error", function (e) {
  if (e.target && e.target.tagName === "IMG") e.target.classList.add("broken");
}, true);

(function () { try {
  var html = document.documentElement;

  function getLang() {
    var q = null;
    try { q = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    if (q === "en" || q === "de") return q;
    try { var s = localStorage.getItem("vs-lang"); if (s === "en" || s === "de") return s; } catch (e) {}
    return (navigator.language || "de").toLowerCase().indexOf("de") === 0 ? "de" : "en";
  }

  // merken: nur wenn die Besucherin die Sprache selbst umschaltet. Beim bloßen
  // Aufrufen der Seite wird nichts auf dem Gerät abgelegt – das erspart eine
  // Einwilligung nach § 165 TKG, weil kein Speicherzugriff ohne Anlass erfolgt.
  function setLang(lang, merken) {
    html.setAttribute("data-lang", lang);
    html.setAttribute("lang", lang);
    if (merken) { try { localStorage.setItem("vs-lang", lang); } catch (e) {} }
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false");
    });
    // Sprache in interne Links mitnehmen
    document.querySelectorAll('a[href$=".html"], a[href*=".html#"], a[href*=".html?"]').forEach(function (a) {
      try {
        var href = a.getAttribute("href");
        var m = href.match(/^([^?#]+)(\?[^#]*)?(#.*)?$/);
        if (!m) return;
        a.setAttribute("href", m[1] + "?lang=" + lang + (m[3] || ""));
      } catch (e) {}
    });
    // <title> umschalten
    var t = document.querySelector("title");
    if (t && t.dataset[lang]) t.textContent = t.dataset[lang];
    // Auswahllisten umschalten – in <option> kann kein <span> stehen, also über data-Attribute
    document.querySelectorAll("option[data-de]").forEach(function (o) {
      var neu = o.dataset[lang];
      if (!neu) return;
      var warGewaehlt = o.selected;
      o.textContent = neu;
      o.value = neu;
      o.selected = warGewaehlt;
    });
  }

  setLang(getLang(), false);

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang, true); });
  });

  // Mobiles Menü
  var burger = document.querySelector(".burger");
  var menu = document.querySelector(".menu");

  function menuZu() {
    if (!menu) return;
    menu.classList.remove("open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    setzeInert();
  }

  // Geschlossen ist das Menü unsichtbar, blieb aber für Tastatur und Screenreader
  // erreichbar. inert nimmt es vollständig heraus.
  function setzeInert() {
    if (!menu) return;
    var mobil = window.matchMedia("(max-width:900px)").matches;
    var zu = mobil && !menu.classList.contains("open");
    if ("inert" in menu) menu.inert = zu;
    else menu.setAttribute("aria-hidden", zu ? "true" : "false");
  }

  if (burger && menu) {
    burger.addEventListener("click", function () {
      var offen = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", offen ? "true" : "false");
      if (!offen) untermenuesZu();
      setzeInert();
    });
  }
  setzeInert();
  window.addEventListener("resize", setzeInert);

  // ---- Untermenüs mit Bildkacheln ----
  var aufKnoepfe = document.querySelectorAll(".menu .auf");

  function untermenuesZu(ausser) {
    aufKnoepfe.forEach(function (b) {
      if (b !== ausser) b.setAttribute("aria-expanded", "false");
    });
  }

  aufKnoepfe.forEach(function (knopf) {
    knopf.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var offen = knopf.getAttribute("aria-expanded") === "true";
      untermenuesZu(knopf);
      knopf.setAttribute("aria-expanded", offen ? "false" : "true");
      // Fotos erst jetzt holen – vorher steht die Adresse nur in data-src
      if (!offen) {
        var feld = knopf.nextElementSibling;
        if (feld) feld.querySelectorAll("img[data-src]").forEach(function (bild) {
          bild.src = bild.getAttribute("data-src");
          bild.removeAttribute("data-src");
        });
      }
    });
  });

  // Klick daneben und Escape schließen alles
  document.addEventListener("click", function (ev) {
    if (ev.target.closest(".nav")) return;
    untermenuesZu();
    menuZu();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    untermenuesZu();
    menuZu();
    if (burger && window.matchMedia("(max-width:900px)").matches) burger.focus();
  });

  // Anfrageformular → öffnet eine vorbereitete E-Mail (kein Server nötig)
  var form = document.getElementById("inquiry");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var d = new FormData(form);
      var lang = html.getAttribute("data-lang");
      var subject = (lang === "en" ? "Inquiry: " : "Anfrage: ") + d.get("room") + " " + d.get("arrival") + " – " + d.get("departure");
      var body = [
        (lang === "en" ? "Name: " : "Name: ") + d.get("name"),
        (lang === "en" ? "E-mail: " : "E-Mail: ") + d.get("email"),
        (lang === "en" ? "Arrival: " : "Anreise: ") + d.get("arrival"),
        (lang === "en" ? "Departure: " : "Abreise: ") + d.get("departure"),
        (lang === "en" ? "Guests: " : "Personen: ") + d.get("guests"),
        (lang === "en" ? "Room: " : "Zimmer: ") + d.get("room"),
        "",
        d.get("message") || ""
      ].join("\n");
      location.href = "mailto:info@villasolitude.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }
} catch (err) { console.warn(err); } })();

/* ---------- Bewegung: Nav, Reveal, Zähler, Thumbnails ---------- */
(function () { try {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.querySelector(".nav");
  var fab = document.querySelector(".fab");
  var hasHero = !!document.querySelector(".hero");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("solid", !hasHero || y > 40);
    if (fab) fab.classList.toggle("show", y > 500);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Elemente einblenden, sobald sie ins Bild kommen
  var targets = document.querySelectorAll(".reveal, .timeline, .fall");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    targets.forEach(function (t) { io.observe(t); });
    revealLaeuft = true; // Sicherheitsnetz oben wird nicht mehr gebraucht
  } else {
    targets.forEach(function (t) { t.classList.add("in"); });
  }

  // Zahlen hochzählen
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "";
    if (reduce || isNaN(end)) { el.textContent = end + suffix; return; }
    var started = false;
    var obs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    obs.observe(el);
  });

  // Zimmer: Thumbnail wechselt das große Bild
  document.querySelectorAll(".room").forEach(function (room) {
    var main = room.querySelector(".main");
    var buttons = room.querySelectorAll(".thumbs button");
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var thumbImg = b.querySelector("img");
        var current = room.querySelector(".main");
        if (!thumbImg || !current || current.tagName !== "IMG") {
          // Foto konnte nicht laden → gezeichnetes Motiv des Thumbnails übernehmen
          var art = b.querySelector(".art");
          if (art && current) { var c = art.cloneNode(true); c.className = "art main"; current.parentNode.replaceChild(c, current); }
          return;
        }
        main = current;
        // Die Thumbnails zeigen bereits auf die 1024er-Fassung. Früher wurde die Größe
        // im Dateinamen auf 1024x683 umgeschrieben – bei Bildern mit 1024x682 ergab das
        // eine URL, die es nicht gibt (404), und das Zimmerbild blieb leer.
        var src = thumbImg.getAttribute("src");
        main.classList.remove("broken"); // ein vorher gescheitertes Bild darf sich erholen
        if (reduce) { main.src = src; return; }
        main.classList.add("fade");
        setTimeout(function () { main.src = src; main.onload = function () { main.classList.remove("fade"); }; }, 250);
      });
    });
  });

  // Karte erst auf Klick laden – vorher geht keine Anfrage an OpenStreetMap
  document.querySelectorAll(".map--aus").forEach(function (kasten) {
    var knopf = kasten.querySelector("button");
    if (!knopf) return;
    knopf.addEventListener("click", function () {
      var rahmen = document.createElement("iframe");
      rahmen.className = "map";
      var sprache = document.documentElement.getAttribute("data-lang") === "en" ? "titelEn" : "titelDe";
      rahmen.title = kasten.dataset[sprache] || "Karte";
      rahmen.loading = "lazy";
      rahmen.src = kasten.dataset.src;
      kasten.parentNode.replaceChild(rahmen, kasten);
    });
  });

  // Bilderleisten: auf dem Handy wischt man, am Rechner zieht man sie jetzt mit der Maus
  document.querySelectorAll(".strip").forEach(function (strip) {
    var zieht = false, startX = 0, startLinks = 0, weg = 0;

    strip.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.pointerType === "touch") return; // Touch macht der Browser selbst
      zieht = true; weg = 0;
      startX = e.clientX;
      startLinks = strip.scrollLeft;
    });

    strip.addEventListener("pointermove", function (e) {
      if (!zieht) return;
      var d = e.clientX - startX;
      if (weg === 0 && Math.abs(d) < 4) return; // kleine Wackler sind noch kein Ziehen
      if (weg === 0) {
        strip.classList.add("zieht");
        try { strip.setPointerCapture(e.pointerId); } catch (x) {}
      }
      weg = Math.max(weg, Math.abs(d));
      strip.scrollLeft = startLinks - d;
      e.preventDefault();
    });

    function beenden(e) {
      if (!zieht) return;
      zieht = false;
      strip.classList.remove("zieht");
      try { strip.releasePointerCapture(e.pointerId); } catch (x) {}
    }
    strip.addEventListener("pointerup", beenden);
    strip.addEventListener("pointercancel", beenden);

    // Nach dem Ziehen darf der Loslass-Klick keinen Link öffnen
    strip.addEventListener("click", function (e) {
      if (weg > 5) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    strip.addEventListener("dragstart", function (e) { e.preventDefault(); });
  });
} catch (err) { console.warn(err); } })();
