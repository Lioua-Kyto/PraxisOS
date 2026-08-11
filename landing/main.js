/* =========================================================================
   PraxisOS landing — liquid-SDF WebGL fluid + GSAP ScrollTrigger.

   The fluid is one full-screen fragment-shader quad. Its shape is a signed
   distance field with an organic, wobbling boundary (a cohesive liquid body,
   not layered noise fog). Each narrative beat writes a TARGET blob state from
   its own scroll progress; the render loop eases the live uniforms toward it
   every frame, so only the active section drives the fluid and the "scrub"
   smoothing is decoupled from scroll cadence. Sweeps run fully off-screen and
   the off-screen wrap is a hard snap (never dragged across the viewport).

   Capability gate (html.anim, set pre-paint): reduced-motion, <=900px, or
   no-WebGL fall back to the static layout with scroll-snap carousels.
   ========================================================================= */
(function () {
  "use strict";

  var REPO = "Lioua-Kyto/PraxisOS";
  var RELEASES_LATEST = "https://github.com/" + REPO + "/releases/latest";
  var root = document.documentElement;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var THREE = window.THREE;

  /* ---- card content --------------------------------------------------- */
  var TIDE = ["Nexus", "Tasks", "Discipline", "Mastery", "Workout", "Nutrition",
    "Flow", "Ledger", "Journal", "Codex", "Food", "Settings"];
  var GALLERY = [
    ["Nexus", "Nexus.png"], ["Tasks", "Tasks.png"], ["Discipline", "Discipline.png"],
    ["Flow", "Flow.png"], ["Ledger", "Ledger.png"], ["Nutrition", "Nutrition.png"],
    ["Workout", "Workout.png"], ["Mastery", "Mastery.png"], ["Codex", "Codex.png"],
    ["Journal", "Journal.png"], ["Food Library", "Food Library.png"], ["Settings", "Settings.png"]
  ];
  (function buildCards() {
    var tt = document.getElementById("tide-track");
    if (tt) {
      tt.innerHTML = TIDE.map(function (name, i) {
        var n = ("0" + (i + 1)).slice(-2);
        return '<div class="tide__card"><span class="i">' + n + '</span><b>' + name + "</b></div>";
      }).join("");
    }
    var gt = document.getElementById("gallery-track");
    if (gt) {
      gt.innerHTML = GALLERY.map(function (c) {
        var src = "assets/images/" + encodeURIComponent(c[1]);
        return '<figure class="gallery__card"><img loading="lazy" decoding="async" src="' +
          src + '" alt="PraxisOS ' + c[0] + ' screen" /><figcaption>' + c[0] + "</figcaption></figure>";
      }).join("");
    }
  })();

  /* ---- download wiring (always) --------------------------------------- */
  function fmtSize(bytes) {
    if (!bytes) return "";
    var mb = bytes / (1024 * 1024);
    return mb.toFixed(mb >= 100 ? 0 : 1) + " MB";
  }
  (function initDownload() {
    var y = document.querySelector(".js-year");
    if (y) y.textContent = String(new Date().getFullYear());
    fetch("https://api.github.com/repos/" + REPO + "/releases/latest", {
      headers: { Accept: "application/vnd.github+json" }
    })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (data) {
        var asset = (data.assets || []).find(function (a) { return /\.exe$/i.test(a.name || ""); });
        var url = asset ? asset.browser_download_url : RELEASES_LATEST;
        var tag = data.tag_name || "";
        document.querySelectorAll(".js-download").forEach(function (el) { el.setAttribute("href", url); });
        if (tag) {
          var size = asset ? " · " + fmtSize(asset.size) : "";
          document.querySelectorAll(".js-meta").forEach(function (el) {
            el.textContent = tag + " for Windows" + size;
          });
        }
      })
      .catch(function () {});
  })();

  /* ---- nav scrolled state --------------------------------------------- */
  function initNav() {
    var nav = document.getElementById("nav");
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 50); };
    if (ScrollTrigger) ScrollTrigger.create({ start: 50, end: 1e9, onUpdate: onScroll, onToggle: onScroll });
    else document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Fallback (phone/tablet/no-WebGL/reduced-motion): plain layout with light
  // scroll-reveal transitions, no shader, no section pins.
  function initFallbackReveals() {
    if (!("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll(
      ".hero .reveal, .anim-head, .anim-card, .module-card, .tide__card, .gallery__card, .cta__inner, footer"
    );
    els.forEach(function (el) { el.classList.add("reveal-fb"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  var animReady = root.classList.contains("anim") && gsap && ScrollTrigger && THREE;
  if (root.classList.contains("anim") && !animReady) root.classList.remove("anim");
  if (!animReady) { initNav(); initFallbackReveals(); return; }

  gsap.registerPlugin(ScrollTrigger);
  initNav();

  /* =======================================================================
     THREE.JS FLUID  (defined liquid body via SDF, not noise fog)
     ===================================================================== */
  var VERT = [
    "varying vec2 vUv;",
    "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform float u_time,u_aspect,u_blob_radius,u_blob_edge,u_blob_rot,u_opacity,u_flood;",
    "uniform vec2 u_blob_center,u_blob_stretch;",
    "uniform vec3 u_colorA,u_colorB;",
    "vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}",
    "float snoise(vec2 v){",
    "  const vec4 C=vec4(0.211324865,0.366025403,-0.577350269,0.024390243);",
    "  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);",
    "  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);",
    "  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);",
    "  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));",
    "  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);",
    "  m=m*m;m=m*m;",
    "  vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;",
    "  m*=1.79284291-0.85373472*(a0*a0+h*h);",
    "  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;",
    "  return 130.0*dot(m,g);",
    "}",
    "float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<3;i++){v+=a*snoise(p);p*=2.02;a*=0.5;}return v;}",
    "void main(){",
    "  vec2 p = vUv*2.0-1.0; p.x *= u_aspect;",
    "  vec2 q = p - u_blob_center;",
    "  float c=cos(u_blob_rot), s=sin(u_blob_rot); q = mat2(c,-s,s,c)*q;",
    "  q /= max(u_blob_stretch, vec2(0.001));",
    "  float t = u_time*0.34;",
    "  float len = length(q);",
    "  float ang = atan(q.y, q.x);",
    // organic wobble of the boundary radius -> a cohesive, moving liquid body
    "  float wob = 0.16*sin(ang*3.0 + t*1.3) + 0.10*sin(ang*5.0 - t*0.9) + 0.08*sin(ang*2.0 + t*0.5);",
    "  float nr = fbm(q*1.3 + t*0.6)*0.24;",
    "  float rr = u_blob_radius*(1.0 + wob) + nr;",
    "  float sdf = len - rr;",
    // crisp SDF boundary (liquid edge), not a soft haze
    "  float aa = 0.006 + u_blob_edge;",
    "  float body = smoothstep(aa, -aa, sdf);",
    "  body = mix(body, 1.0, u_flood);",
    // volume: brighter core, bright rim near the surface, faint internal drift
    "  float core = smoothstep(rr, 0.0, len);",
    "  float rim = 1.0 - smoothstep(0.0, aa*7.0, abs(sdf));",
    "  float drift = fbm(q*2.1 + vec2(t, -t*0.7))*0.12;",
    "  vec3 col = mix(u_colorA, u_colorB, clamp(0.32 + core*0.42 + drift, 0.0, 1.0));",
    "  col += u_colorB * rim * 0.25;",
    "  float alpha = clamp(body, 0.0, 1.0) * u_opacity;",
    "  gl_FragColor = vec4(col, alpha);",
    "}"
  ].join("\n");

  var canvas = document.getElementById("bg");
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas, alpha: true, antialias: false, powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var uniforms = {
    u_time: { value: 0 },
    u_aspect: { value: 1 },
    u_blob_center: { value: new THREE.Vector2(0, 0.1) },
    u_blob_stretch: { value: new THREE.Vector2(1, 1) },
    u_blob_radius: { value: 0.42 },
    u_blob_edge: { value: 0.03 },
    u_blob_rot: { value: 0 },
    u_opacity: { value: 1 },
    u_flood: { value: 0 },
    u_colorA: { value: new THREE.Color(0.2, 0.34, 0.6) },
    u_colorB: { value: new THREE.Color(0.357, 0.549, 0.847) }
  };
  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: uniforms,
      transparent: true, depthTest: false, depthWrite: false
    })
  ));

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    uniforms.u_aspect.value = w / h;
  }
  resize();

  /* ---- target + eased render loop (with off-screen teleport snap) ------ */
  var target = { cx: 0, cy: 0.1, sx: 1, sy: 1, radius: 0.42, edge: 0.03, rot: 0, opacity: 1, flood: 0 };
  var SMOOTH = 7;
  gsap.ticker.add(function (time, deltaMS) {
    if (document.hidden) return;
    var u = uniforms;
    u.u_time.value += deltaMS * 0.001;
    var k = Math.min(1, deltaMS * 0.001 * SMOOTH);
    var cen = u.u_blob_center.value;
    // Ease normally, but snap the center across huge jumps: that only happens
    // at an off-screen wrap, so it must not be dragged across the viewport.
    var dx = target.cx - cen.x, dy = target.cy - cen.y;
    cen.x += Math.abs(dx) > 3.5 ? dx : dx * k;
    cen.y += Math.abs(dy) > 3.5 ? dy : dy * k;
    var st = u.u_blob_stretch.value;
    st.x += (target.sx - st.x) * k;
    st.y += (target.sy - st.y) * k;
    u.u_blob_radius.value += (target.radius - u.u_blob_radius.value) * k;
    u.u_blob_edge.value += (target.edge - u.u_blob_edge.value) * k;
    u.u_blob_rot.value += (target.rot - u.u_blob_rot.value) * k;
    u.u_opacity.value += (target.opacity - u.u_opacity.value) * k;
    u.u_flood.value += (target.flood - u.u_flood.value) * k;
    renderer.render(scene, camera);
  });
  gsap.ticker.lagSmoothing(1000, 16);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  // Sweep centres go past the viewport edges (~ -0.5 / 1.5 in screen fraction)
  // with margin for the blob radius+stretch, so no fluid edge clips on screen.
  var OFF_L = -4.0, OFF_R = 4.0;

  /* ---- logo rest position (fluid rests behind the right-column logo) --- */
  var heroRest = [0.6, 0.05];
  function measureLogo() {
    var el = document.getElementById("logo-frame");
    if (!el) return;
    var r = el.getBoundingClientRect();
    var w = window.innerWidth, h = window.innerHeight;
    var px = r.left + r.width / 2, py = r.top + r.height / 2;
    heroRest = [((px / w) * 2 - 1) * (w / h), 1 - (py / h) * 2];
  }
  measureLogo();
  // Start the blob behind the logo on first paint (before any scroll update).
  target.cx = heroRest[0];
  target.cy = heroRest[1];

  /* ---- hero intro reveal ---------------------------------------------- */
  gsap.to(".hero .reveal", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.15 });
  setTimeout(function () {
    document.querySelectorAll(".hero .reveal").forEach(function (el) {
      if (parseFloat(getComputedStyle(el).opacity) === 0) { el.style.opacity = "1"; el.style.transform = "none"; }
    });
  }, 2600);
  // Feature section (not pinned) keeps simple scroll reveals.
  gsap.utils.toArray("#features .anim-head, .anim-card").forEach(function (el) {
    gsap.fromTo(el, { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true } });
  });

  /* ---- header choreography: centred + large before the pin, shrinks into
         the top-right corner while pinned so content owns the middle. ------ */
  function measureHead(el) { return { w: el.offsetWidth, h: el.offsetHeight }; }
  function placeHead(el, dims, p) {
    var hk = smoothstep(0.0, 0.16, p);
    var vw = window.innerWidth, vh = window.innerHeight, M = 44, s = 0.48;
    var tcx = vw - M - dims.w * s / 2;
    var tcy = Math.max(58, vh * 0.11) + dims.h * s / 2;
    var dx = (tcx - vw / 2) * hk, dy = (tcy - vh / 2) * hk;
    el.style.transform = "translate(-50%,-50%) translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) +
      "px) scale(" + (1 - (1 - s) * hk).toFixed(3) + ")";
  }

  /* =======================================================================
     PHASE 1 — HERO: the aura dissolves in place (no travel down), fully gone
     before the modules section pins.
     ===================================================================== */
  ScrollTrigger.create({
    trigger: "#top", start: "top top", end: "bottom top",
    onUpdate: function (self) {
      var p = self.progress;
      target.cx = heroRest[0]; target.cy = heroRest[1];
      target.sx = 1; target.sy = 1; target.rot = 0; target.flood = 0;
      target.radius = lerp(0.42, 0.34, p);
      target.edge = lerp(0.03, 0.16, p);              // soften as it dissolves
      target.opacity = 1 - smoothstep(0.12, 0.7, p);  // dissolve into nothing
    }
  });

  /* =======================================================================
     PHASE 2 — MODULES: wave delivers the orange cards through the centred
     grid; header slides to the corner.
     ===================================================================== */
  var moduleCards = document.querySelectorAll(".module-card");
  var modHead = document.querySelector("#modules .section-head");
  var modDims = { w: 620, h: 200 };
  var colFx = [0.2, 0.5, 0.8];
  function measureModules() {
    var vw = window.innerWidth;
    var gridW = Math.min(1100, vw - 48);
    var gridLeft = (vw - gridW) / 2;
    colFx = [0, 1, 2].map(function (c) { return (gridLeft + (c + 0.5) * gridW / 3) / vw; });
    modDims = measureHead(modHead);
  }
  function moduleReact(p) {
    var waveFx = lerp(-0.4, 1.4, p);
    for (var i = 0; i < moduleCards.length; i++) {
      var cf = colFx[i % 3];
      var passed = smoothstep(cf - 0.05, cf + 0.05, waveFx);
      var bell = 1 - smoothstep(0, 0.18, Math.abs(waveFx - cf));
      var card = moduleCards[i];
      if (passed > 0.999 && bell < 0.02) {
        card.style.opacity = "1"; card.style.transform = ""; card.style.boxShadow = "";
        card.style.borderColor = ""; card.style.zIndex = "";
      } else {
        card.style.opacity = passed.toFixed(3);
        card.style.transform = "translateY(" + ((1 - passed) * 20 - bell * 6).toFixed(1) + "px)";
        card.style.borderColor = bell > 0.05 ? "#e8843a" : "";
        card.style.boxShadow = bell > 0.05 ? "0 10px 30px -10px rgba(232,132,58," + (0.35 * bell).toFixed(2) + ")" : "";
        card.style.zIndex = bell > 0.15 ? 2 : 1;
      }
    }
  }
  ScrollTrigger.create({
    trigger: "#modules", start: "top top", end: "+=150%", pin: ".modules__pin", scrub: 1, anticipatePin: 1,
    onRefresh: measureModules,
    onUpdate: function (self) {
      var p = self.progress;
      target.cx = lerp(OFF_L, OFF_R, p); target.cy = 0; // through the centred grid
      target.sx = 2.6; target.sy = 0.78; target.radius = 0.5; target.edge = 0.03; target.rot = 0; target.flood = 0;
      target.opacity = smoothstep(0, 0.1, p) * (1 - smoothstep(0.94, 1, p)); // gone at both edges
      moduleReact(p);
      placeHead(modHead, modDims, p);
    }
  });

  /* =======================================================================
     PHASE 3 — THE TIDE: cards ride the fluid across the centre of the screen;
     the fluid fades at both edges so no wave lingers at the boundaries.
     ===================================================================== */
  var tideTrack = document.getElementById("tide-track");
  var tideCards = tideTrack.children;
  var tideHead = document.querySelector("#tide .section-head");
  var tideDims = { w: 620, h: 200 };
  function measureTide() { tideDims = measureHead(tideHead); }
  var tideScatter = [].map.call(tideCards, function () {
    return { y: (Math.random() * 2 - 1) * 30, r: (Math.random() * 2 - 1) * 5 };
  });
  ScrollTrigger.create({
    trigger: "#tide", start: "top top", end: "+=200%", pin: ".tide__pin", scrub: 1, anticipatePin: 1,
    onRefresh: measureTide,
    onUpdate: function (self) {
      var p = self.progress;
      target.cx = lerp(OFF_R, OFF_L, p); target.cy = 0;
      target.sx = 3.0; target.sy = 1.25; target.radius = 0.7; target.edge = 0.04; target.rot = 0; target.flood = 0;
      target.opacity = smoothstep(0, 0.08, p) * (1 - smoothstep(0.9, 1, p)); // no lingering edge at boundaries
      var vw = window.innerWidth, vh = window.innerHeight;
      var cx = ((target.cx / uniforms.u_aspect.value) + 1) / 2 * vw;
      var n = tideCards.length;
      for (var i = 0; i < n; i++) {
        var x = cx + (i - (n - 1) / 2) * 150 - 90;
        var y = vh * 0.5 - 68 + tideScatter[i].y; // vertically centred
        tideCards[i].style.transform =
          "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + tideScatter[i].r.toFixed(2) + "deg)";
      }
      placeHead(tideHead, tideDims, p);
    }
  });

  /* =======================================================================
     PHASE 4 — THE GALLERY: no shader; centred carousel with a strong spotlight
     (the middle card is much larger than the sides).
     ===================================================================== */
  var galleryTrack = document.getElementById("gallery-track");
  var galleryCards = galleryTrack.children;
  var galHead = document.querySelector("#gallery .section-head");
  var galDims = { w: 620, h: 200 };
  var gOff = [], gCardW = 0, gStride = 0, gTrackLeft0 = 0;
  function measureGallery() {
    if (!galleryCards.length) return;
    gCardW = galleryCards[0].offsetWidth;
    // Read the real laid-out centres. Modelling them as width+gap is wrong the
    // moment a card carries a margin, and the error compounds down the row
    // until "centre" lands off-screen.
    var prev = galleryTrack.style.transform;
    galleryTrack.style.transform = "none";
    gTrackLeft0 = galleryTrack.getBoundingClientRect().left;
    galleryTrack.style.transform = prev;
    gOff = [];
    for (var i = 0; i < galleryCards.length; i++) {
      gOff.push(galleryCards[i].offsetLeft + galleryCards[i].offsetWidth / 2);
    }
    gStride = gOff.length > 1 ? (gOff[gOff.length - 1] - gOff[0]) / (gOff.length - 1) : gCardW;
    galDims = measureHead(galHead);
  }
  function galleryLayout(p) {
    if (!gOff.length) measureGallery();
    var vw = window.innerWidth, n = galleryCards.length;
    var margin = gCardW / 2 + 80;
    // p=0: last card just past the left edge. p=1: first card just past the right.
    var txStart = -margin - gTrackLeft0 - gOff[n - 1];
    var txEnd = vw + margin - gTrackLeft0 - gOff[0];
    var tx = txStart + (txEnd - txStart) * p;
    galleryTrack.style.transform = "translate3d(" + tx.toFixed(1) + "px,0,0)";
    for (var i = 0; i < n; i++) {
      var cx = gTrackLeft0 + tx + gOff[i];
      var bell = 1 - smoothstep(0, gStride * 0.92, Math.abs(cx - vw / 2));
      var focused = bell > 0.55;
      var card = galleryCards[i];
      card.style.transform = "scale(" + (0.6 + 0.7 * bell).toFixed(4) + ")"; // 0.6 .. 1.3, big contrast
      card.style.opacity = (0.2 + 0.8 * bell).toFixed(3);
      card.style.zIndex = Math.round(bell * 100);
      card.style.filter = focused ? "none" : "blur(2px)";
      card.style.boxShadow = focused ? "0 24px 60px rgba(0,0,0,0.85)" : "none";
      card.style.borderColor = focused ? "#5B8CD8" : "";
    }
  }
  ScrollTrigger.create({
    trigger: "#gallery", start: "top top", end: "+=280%", pin: ".gallery__pin", scrub: 1, anticipatePin: 1,
    onRefresh: measureGallery,
    onUpdate: function (self) {
      var p = self.progress;
      galleryLayout(p);
      target.opacity = 0; // shader hidden through the gallery
      placeHead(galHead, galDims, p);
    }
  });
  galleryLayout(0);

  /* =======================================================================
     PHASE 5 — CTA (the flood): stream enters from the left and expands until
     it floods the section; copy and footer reveal together.
     ===================================================================== */
  gsap.timeline({
    scrollTrigger: {
      trigger: "#download", start: "top top", end: "+=130%", pin: ".cta__pin", scrub: 1, anticipatePin: 1,
      onUpdate: function (self) {
        var p = self.progress;
        target.rot = 0; target.cx = lerp(OFF_L, 0, smoothstep(0, 0.6, p)); target.cy = 0;
        target.sx = 1.8; target.sy = 1.6;
        target.radius = lerp(0.4, 2.6, p);
        target.edge = 0.05; target.flood = smoothstep(0.25, 1, p);
        target.opacity = smoothstep(0, 0.15, p);
      }
    }
  })
    .fromTo(".cta__inner, .cta footer", { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, 0.55);

  /* ---- resize + refresh ----------------------------------------------- */
  var resizeTO;
  window.addEventListener("resize", function () {
    resize(); measureLogo();
    clearTimeout(resizeTO);
    resizeTO = setTimeout(function () {
      measureModules(); measureTide(); measureGallery(); ScrollTrigger.refresh();
    }, 150);
  });
  measureModules(); measureTide(); measureGallery();
  window.addEventListener("load", function () {
    measureLogo(); measureModules(); measureTide(); measureGallery(); ScrollTrigger.refresh();
  });
})();
