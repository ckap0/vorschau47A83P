/* Villa Solitude – Menü, Anfrageformular, Bewegung */
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

  // Sprache: Deutsch liegt im Wurzelordner, Englisch unter en/ – der Schalter oben
  // rechts ist ein Link. data-lang steht fest im HTML und wird unten nur gelesen.

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
    var an = form.querySelector("[name=arrival]"), ab = form.querySelector("[name=departure]");
    var fehler = form.querySelector(".form-fehler");
    function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
    if (an) an.min = iso(new Date());
    function abMin() {
      if (!an || !ab || !an.value) return;
      var d = new Date(an.value); d.setDate(d.getDate() + 1); ab.min = iso(d);
      if (ab.value && ab.value <= an.value) ab.value = ab.min;
    }
    // Hinweis sofort zeigen, wenn die Abreise nicht nach der Anreise liegt – die
    // Browser-Prüfung (min) würde sonst nur ein knappes Tooltip anzeigen.
    function pruefeDaten() {
      if (!an || !ab || !fehler) return;
      var falsch = an.value && ab.value && ab.value <= an.value;
      fehler.hidden = !falsch;
      if (falsch) fehler.textContent = html.getAttribute("data-lang") === "en" ? "The departure date must be after the arrival date." : "Die Abreise muss nach der Anreise liegen.";
    }
    if (an) { an.addEventListener("change", function () { abMin(); pruefeDaten(); }); abMin(); }
    if (ab) ab.addEventListener("change", pruefeDaten);
    // „Dieses Zimmer anfragen“ auf der Zimmerseite wählt das Zimmer vor
    try {
      var z = new URLSearchParams(location.search).get("zimmer");
      var sel = form.querySelector("[name=room]");
      var idx = { kaiserzeit: 0, sissy: 1, junior: 2 }[z];
      if (sel && idx !== undefined) sel.selectedIndex = idx;
    } catch (e) {}
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var d = new FormData(form);
      var en = html.getAttribute("data-lang") === "en";
      pruefeDaten();
      if (fehler && !fehler.hidden) { if (ab) ab.focus(); return; }
      var t = function (de, e) { return en ? e : de; };
      var subject = t("Anfrage: ", "Inquiry: ") + d.get("room") + " " + d.get("arrival") + " – " + d.get("departure");
      var body = [
        "Name: " + d.get("name"),
        t("E-Mail: ", "E-mail: ") + d.get("email"),
        t("Telefon: ", "Phone: ") + (d.get("phone") || "–"),
        t("Anreise: ", "Arrival: ") + d.get("arrival"),
        t("Abreise: ", "Departure: ") + d.get("departure"),
        t("Personen: ", "Guests: ") + d.get("guests"),
        t("Zimmer: ", "Room: ") + d.get("room"),
        t("Verpflegung: ", "Board: ") + d.get("board"),
        t("Hund: ", "Dog: ") + (d.get("dog") ? t("ja", "yes") : t("nein", "no")),
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

  var logo = document.querySelector(".brand--bild img");

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("solid", !hasHero || y > 40);
    if (fab) fab.classList.toggle("show", y > 500);
    // Logo: über dem Titelbild fast doppelt so groß, schrumpft in den ersten 150 Pixeln
    // Scrollweg stufenlos auf Leistenhöhe. Ohne Titelbild bleibt es klein.
    if (logo) {
      var gross = window.matchMedia("(max-width:900px)").matches ? 1.6 : 1.9;
      var s = hasHero ? gross - (gross - 1) * Math.min(y / 150, 1) : 1;
      logo.style.setProperty("--logo-s", s.toFixed(3));
    }
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
