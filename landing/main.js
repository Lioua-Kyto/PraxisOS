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
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 40); };
    if (ScrollTrigger) ScrollTrigger.create({ start: 40, end: 1e9, onUpdate: onScroll, onToggle: onScroll });
    else document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var animReady = root.classList.contains("anim") && gsap && ScrollTrigger && THREE;
  if (root.classList.contains("anim") && !animReady) root.classList.remove("anim");
  if (!animReady) { initNav(); return; }

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
    u_colorA: { value: new THREE.Color(0.69, 0.49, 0.18) },
    u_colorB: { value: new THREE.Color(0.925, 0.769, 0.478) }
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

  var OFF_L = -3.4, OFF_R = 3.4;

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

  /* =======================================================================
     REVEALS (heads + feature cards, independent of the fluid phases)
     ===================================================================== */
  gsap.to(".hero .reveal", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.15 });
  setTimeout(function () {
    document.querySelectorAll(".hero .reveal").forEach(function (el) {
      if (parseFloat(getComputedStyle(el).opacity) === 0) { el.style.opacity = "1"; el.style.transform = "none"; }
    });
  }, 2600);
  gsap.utils.toArray(".anim-head, .anim-card").forEach(function (el) {
    gsap.fromTo(el, { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true } });
  });

  /* =======================================================================
     PHASE 1 — HERO -> MODULES (logo breakout + card delivery)
     ===================================================================== */
  ScrollTrigger.create({
    trigger: "#top", start: "top top", end: "bottom top",
    onUpdate: function (self) {
      var p = self.progress;
      var xMid = 1.4;
      target.cx = p < 0.55 ? lerp(heroRest[0], xMid, p / 0.55) : lerp(xMid, OFF_R, (p - 0.55) / 0.45);
      target.cy = lerp(heroRest[1], -1.25, smoothstep(0, 0.8, p));
      target.radius = lerp(0.42, 0.5, p);
      target.sx = lerp(1, 2.2, smoothstep(0.1, 0.7, p));
      target.sy = lerp(1, 0.72, smoothstep(0.1, 0.7, p));
      target.edge = 0.03; target.rot = 0; target.flood = 0; target.opacity = 1;
    }
  });

  var moduleCards = document.querySelectorAll(".module-card");
  var colFx = [0.2, 0.5, 0.8];
  function measureModules() {
    var vw = window.innerWidth;
    var gridW = Math.min(1100, vw - 48);
    var gridLeft = (vw - gridW) / 2;
    colFx = [0, 1, 2].map(function (c) { return (gridLeft + (c + 0.5) * gridW / 3) / vw; });
  }
  function moduleReact(p) {
    var waveFx = lerp(-0.35, 1.35, p);
    for (var i = 0; i < moduleCards.length; i++) {
      var cf = colFx[i % 3];
      var passed = smoothstep(cf - 0.05, cf + 0.05, waveFx);
      var bell = 1 - smoothstep(0, 0.16, Math.abs(waveFx - cf));
      var card = moduleCards[i];
      card.style.opacity = passed.toFixed(3);
      card.style.transform = "translateY(" + ((1 - passed) * 22 - bell * 15).toFixed(1) + "px) scale(" + (1 + bell * 0.02).toFixed(3) + ")";
      card.style.boxShadow = "inset 0 0 0 1px rgba(216,167,91," + bell.toFixed(3) + ")";
      card.style.zIndex = bell > 0.15 ? 2 : 1;
    }
  }
  gsap.timeline({
    scrollTrigger: {
      trigger: "#modules", start: "top top", end: "+=150%", pin: true, anticipatePin: 1,
      onRefresh: measureModules,
      onUpdate: function (self) {
        var p = self.progress;
        target.cx = lerp(OFF_L, OFF_R, p); target.cy = 0;
        target.sx = 2.6; target.sy = 0.72; target.radius = 0.5; target.edge = 0.03;
        target.rot = 0; target.flood = 0; target.opacity = 1;
        moduleReact(p);
      }
    }
  });

  /* =======================================================================
     PHASE 2 — THE TIDE (thick surge right -> left, sweeps the train)
     ===================================================================== */
  var tideTrack = document.getElementById("tide-track");
  gsap.timeline({
    scrollTrigger: {
      trigger: "#tide", start: "top top", end: "+=200%", pin: ".tide__pin", scrub: 1, anticipatePin: 1,
      onUpdate: function (self) {
        var p = self.progress;
        target.cx = lerp(OFF_R, OFF_L, p); target.cy = 0;
        target.sx = 3.2; target.sy = 1.3; target.radius = 0.72; target.edge = 0.04;
        target.rot = 0; target.flood = 0; target.opacity = 1;
      }
    }
  })
    .fromTo(tideTrack,
      { x: function () { return window.innerWidth; } },
      { x: function () { return -tideTrack.scrollWidth; }, ease: "none", duration: 1 }, 0);

  /* =======================================================================
     PHASE 3 — THE GALLERY (no shader; carousel, centre scales up)
     ===================================================================== */
  var galleryTrack = document.getElementById("gallery-track");
  var galleryCards = galleryTrack.children;
  var gStride = 0, gCardW = 0, gPadL = 0;
  function measureGallery() {
    if (!galleryCards.length) return;
    gCardW = galleryCards[0].offsetWidth;
    var cs = getComputedStyle(galleryTrack);
    gPadL = parseFloat(cs.paddingLeft) || 42;
    gStride = gCardW + (parseFloat(cs.columnGap || cs.gap) || 34);
  }
  function galleryLayout(p) {
    if (!gStride) measureGallery();
    var vw = window.innerWidth, n = galleryCards.length;
    var startTx = -(n * gStride), endTx = vw + gStride;
    var tx = startTx + (endTx - startTx) * p;
    galleryTrack.style.transform = "translate3d(" + tx + "px,0,0)";
    for (var i = 0; i < n; i++) {
      var cx = tx + gPadL + i * gStride + gCardW / 2;
      var bell = 1 - smoothstep(0, vw * 0.42, Math.abs(cx - vw / 2));
      var card = galleryCards[i];
      card.style.transform = "scale(" + (0.7 + 0.5 * bell).toFixed(4) + ")";
      card.style.opacity = (0.4 + 0.6 * bell).toFixed(3);
      card.style.zIndex = Math.round(bell * 100);
      card.style.boxShadow = "0 " + (20 * bell).toFixed(0) + "px " + (50 * bell).toFixed(0) +
        "px rgba(0,0,0," + (0.8 * bell).toFixed(2) + ")";
    }
  }
  ScrollTrigger.create({
    trigger: "#gallery", start: "top top", end: "+=260%", pin: ".gallery__pin", scrub: 1, anticipatePin: 1,
    onRefresh: measureGallery,
    onUpdate: function (self) {
      galleryLayout(self.progress);
      target.opacity = 1 - smoothstep(0, 0.1, self.progress);
    }
  });
  galleryLayout(0);

  /* =======================================================================
     PHASE 4 — CTA (the flood): stream enters from the left and expands its
     radius until it floods the section background gold.
     ===================================================================== */
  gsap.timeline({
    scrollTrigger: {
      trigger: "#download", start: "top top", end: "+=150%", pin: ".cta__pin", scrub: 1, anticipatePin: 1,
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
    .fromTo(".cta__inner", { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, 0.58);

  /* ---- resize + refresh ----------------------------------------------- */
  var resizeTO;
  window.addEventListener("resize", function () {
    resize(); measureLogo();
    clearTimeout(resizeTO);
    resizeTO = setTimeout(function () { measureModules(); measureGallery(); ScrollTrigger.refresh(); }, 150);
  });
  measureModules(); measureGallery();
  window.addEventListener("load", function () {
    measureLogo(); measureModules(); measureGallery(); ScrollTrigger.refresh();
  });
})();
