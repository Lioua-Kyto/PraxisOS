/* =========================================================================
   PraxisOS landing — motion + dynamic download wiring.
   ========================================================================= */
(function () {
  "use strict";

  const REPO = "Lioua-Kyto/PraxisOS";
  const RELEASES_LATEST = `https://github.com/${REPO}/releases/latest`;
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------- motion -------------------------------- */
  function revealAll() {
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  function initMotion() {
    const gsap = window.gsap;
    // No GSAP (blocked CDN) or reduced motion: skip animation, show content.
    if (!gsap || prefersReduced) {
      revealAll();
      return;
    }

    gsap.registerPlugin(window.ScrollTrigger);

    // Hero: intro stagger on load. Everything else reveals on scroll.
    const hero = gsap.utils.toArray(".hero .reveal");
    gsap.to(hero, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.09,
      delay: 0.1,
    });

    gsap.utils.toArray(".reveal").forEach((el) => {
      if (hero.indexOf(el) !== -1) return; // hero handled above
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    });

    // Gentle continuous float on the brand mark. Motivated: signals the
    // hero visual is alive without pulling focus from the headline.
    const mark = document.querySelector(".mark-plate__logo");
    if (mark) {
      gsap.to(mark, {
        y: -12,
        duration: 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    // Nav gets a background + hairline once the hero starts leaving.
    const nav = document.getElementById("nav");
    window.ScrollTrigger.create({
      start: "top -40",
      onUpdate: (self) => {
        nav.classList.toggle("is-scrolled", self.scroll() > 40);
      },
    });
    if (window.scrollY > 40) nav.classList.add("is-scrolled");

    // Safety net: if the rAF loop never advances (backgrounded tab restore,
    // GSAP stall), don't leave visible content stuck at opacity 0. Only touch
    // elements currently in the viewport so below-fold scroll reveals survive.
    setTimeout(() => {
      document.querySelectorAll(".reveal").forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) > 0) return;
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
    }, 2500);
  }

  /* --------------------------- download wiring ------------------------- */
  const fmtSize = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
  };

  function applyRelease(data) {
    const asset = (data.assets || []).find((a) =>
      /\.exe$/i.test(a.name || "")
    );
    const url = asset ? asset.browser_download_url : RELEASES_LATEST;
    const tag = data.tag_name || "";

    document.querySelectorAll(".js-download").forEach((el) => {
      el.setAttribute("href", url);
    });

    // Hero helper line: functional download context, one line.
    const meta = document.querySelector(".js-meta");
    if (meta && tag) {
      const size = asset ? fmtSize(asset.size) : "";
      meta.textContent = size
        ? `${tag} for Windows · ${size}`
        : `${tag} for Windows`;
    }

    const ver = document.querySelector(".js-footer-ver");
    if (ver && tag) ver.textContent = tag;
  }

  function initDownload() {
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`);
        return r.json();
      })
      .then(applyRelease)
      // On rate-limit / offline / no-release, the buttons keep their static
      // href to the releases page, so download always works.
      .catch(() => {});
  }

  /* ------------------------------ boot --------------------------------- */
  const yearEl = document.querySelector(".js-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  initMotion();
  initDownload();
})();
