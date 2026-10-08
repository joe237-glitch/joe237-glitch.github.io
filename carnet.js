/* Carnet de livraisons — seul script de la page : tampons, captures manquantes, copie, bon de commande. */
(function () {
  var WA = "https://wa.me/237655521445";
  var TEL = "+237 6 55 52 14 45";
  var reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Le tampon s'abat quand le bon arrive à l'écran. Déjà posé si l'animation est réduite ou déjà visible.
  // On surveille la zone de signature (immobile), pas le tampon lui-même : agrandi et rogné
  // pendant l'attente, le tampon n'atteindrait jamais le seuil de visibilité.
  var tampons = document.querySelectorAll("[data-tampon]");
  if (!reduit && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entrees) {
        entrees.forEach(function (e) {
          if (!e.isIntersecting) return;
          var t = e.target.querySelector("[data-tampon]");
          if (!t) return;
          t.setAttribute("data-etat", "pose");
          var bon = t.closest("[data-bon]");
          if (bon) {
            setTimeout(function () { bon.classList.add("choc"); }, 190);
          }
          io.unobserve(e.target);
        });
      },
      { threshold: 0.75 }
    );
    var basEcran = window.innerHeight * 0.92;
    tampons.forEach(function (t) {
      if (t.getBoundingClientRect().top > basEcran && t.parentElement) {
        t.setAttribute("data-etat", "attente");
        io.observe(t.parentElement);
      }
    });
  }

  // 2. Capture qui ne charge pas : cadre papier avec le nom du projet.
  function cadreVide(img) {
    var f = img.closest("figure");
    if (!f || f.getAttribute("data-vide")) return;
    f.setAttribute("data-vide", "1");
    var d = document.createElement("div");
    d.className = "cadre-vide";
    d.textContent = (f.getAttribute("data-nom") || "Capture") + " — capture indisponible";
    img.replaceWith(d);
  }
  document.querySelectorAll("figure.agrafe img").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) cadreVide(img);
    else img.addEventListener("error", function () { cadreVide(img); }, { once: true });
  });

  // 3. Copier l'adresse e-mail (repli : sélection du texte).
  document.querySelectorAll("[data-copier]").forEach(function (b) {
    b.addEventListener("click", function () {
      var texte = b.getAttribute("data-copier");
      var libelle = b.textContent;
      function fini(msg) {
        b.textContent = msg;
        setTimeout(function () { b.textContent = libelle; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texte).then(function () { fini("Copié"); }, function () { fini("Copiez à la main"); });
      } else {
        fini("Copiez à la main");
      }
    });
  });

  // 4. Bon de commande : message prérempli, ouvert dans WhatsApp.
  var form = document.getElementById("bon-commande");
  if (!form) return;
  var erreur = document.getElementById("erreur-commande");
  var etat = document.getElementById("etat-commande");
  var bouton = form.querySelector("button[type=submit]");

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var projet = form.elements.projet.value.trim();
    var quand = form.elements.quand.value;
    var budget = form.elements.budget.value.trim();

    if (projet.length < 3) {
      erreur.hidden = false;
      erreur.textContent = "Écrivez en quelques mots ce que vous voulez construire : c'est la seule ligne obligatoire.";
      form.elements.projet.setAttribute("aria-invalid", "true");
      form.elements.projet.focus();
      return;
    }
    erreur.hidden = true;
    erreur.textContent = "";
    form.elements.projet.removeAttribute("aria-invalid");

    var message =
      "Bonjour Stream-It Dev, voici mon bon de commande (n° 013).\n\n" +
      "Projet : " + projet + "\n" +
      "Pour quand : " + quand +
      (budget ? "\nBudget approximatif : " + budget : "") +
      "\n\nPouvez-vous m'envoyer un devis ?";
    var url = WA + "?text=" + encodeURIComponent(message);

    // Le bouton est un ticket : on change seulement son titre, pas son dessin.
    var cible = bouton.querySelector(".ticket-titre") || bouton;
    var libelle = cible.textContent;
    bouton.disabled = true;
    cible.textContent = "Ouverture de WhatsApp…";

    var lien = document.createElement("a");
    lien.href = url;
    lien.target = "_blank";
    lien.rel = "noopener";
    document.body.appendChild(lien);
    lien.click();
    lien.remove();

    setTimeout(function () {
      bouton.disabled = false;
      cible.textContent = libelle;
      etat.textContent = "";
      var p1 = document.createTextNode("Votre bon est prêt dans WhatsApp. Rien ne s'est ouvert ? ");
      var a = document.createElement("a");
      a.href = url;
      a.rel = "noopener";
      a.textContent = "Rouvrir WhatsApp";
      var p2 = document.createTextNode(" ou écrivez au " + TEL + ".");
      etat.appendChild(p1);
      etat.appendChild(a);
      etat.appendChild(p2);
    }, 900);
  });
})();
