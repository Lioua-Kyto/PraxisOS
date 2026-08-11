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
  // Lucide glyphs, matching the icons the desktop app uses in its sidebar.
  var ICONS = {
    nexus: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    tasks: '<rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    dumbbell: '<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>',
    apple: '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z"/><path d="M10 2c1 .5 2 2 2 5"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><path d="M12 14v-4"/><circle cx="12" cy="14" r="8"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
  };
  function svg(key) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[key] || "") + "</svg>";
  }

  var TIDE = [
    ["Nexus", "nexus"], ["Tasks", "tasks"], ["Discipline", "flame"], ["Mastery", "cap"],
    ["Workout", "dumbbell"], ["Nutrition", "apple"], ["Flow", "timer"], ["Ledger", "wallet"],
    ["Journal", "book"], ["Codex", "library"], ["Settings", "gear"]
  ];
  var VIEW_BLURBS = {
    Nexus: "Your day at a glance",
    Tasks: "Work worth finishing",
    Discipline: "Promises you keep",
    Flow: "Undivided attention",
    Ledger: "Where money goes",
    Nutrition: "What you ate today",
    Workout: "Training, logged",
    Mastery: "What you are learning",
    Codex: "Notes worth returning to",
    Journal: "The day in your words",
    Settings: "Yours to shape",
    "Food Library": "Your foods, ready to log",
    Exercise: "Start a session",
    Theme: "Make it look like yours"
  };
  var GALLERY = [
    ["Nexus", "Nexus.png"], ["Tasks", "Tasks.png"], ["Discipline", "Discipline.png"],
    ["Flow", "Flow.png"], ["Ledger", "Ledger.png"], ["Nutrition", "Nutrition.png"],
    ["Workout", "Workout.png"], ["Mastery", "Mastery.png"], ["Codex", "Codex.png"],
    ["Journal", "Journal.png"], ["Settings", "Settings.png"],
    ["Food Library", "Food Library.png"], ["Exercise", "Exercise.png"],
    ["Theme", "Theme.png"]
  ];
  (function buildCards() {
    var tt = document.getElementById("tide-track");
    if (tt) {
      tt.innerHTML = TIDE.map(function (c) {
        return '<div class="tide__card">' + svg(c[1]) + "<b>" + c[0] + "</b></div>";
      }).join("");
    }
    var gt = document.getElementById("shot-grid");
    if (gt) {
      gt.innerHTML = GALLERY.map(function (c) {
        var src = "assets/images/" + encodeURIComponent(c[1]);
        return '<figure class="gallery__card"><img loading="lazy" decoding="async" src="' +
          src + '" alt="PraxisOS ' + c[0] + ' screen" /><figcaption>' + c[0] + "</figcaption></figure>";
      }).join("");
    }
  })();

  /* ---- the views: draggable sphere, static grid if WebGL2 is missing --- */
  (function initViews() {
    var stage = document.getElementById("menu-stage");
    if (!stage || !window.mountInfiniteMenu) return;
    // The sphere's canvas sets touch-action: none, so on a phone a vertical
    // swipe over it would trap the page scroll. Narrow screens get the grid.
    if (window.innerWidth < 900) return;
    var items = GALLERY.map(function (c) {
      return {
        image: "assets/images/" + encodeURIComponent(c[1]),
        title: c[0],
        description: VIEW_BLURBS[c[0]] || ""
      };
    });
    if (window.mountInfiniteMenu(stage, items, 1.35)) {
      document.documentElement.classList.add("has-sphere");
      stage.removeAttribute("aria-hidden");
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

  // Small screens skip the pins and sweeps, but can still carry the fluid in
  // the two places it is purely decorative: behind the hero mark, and as the
  // closing section's background.
  var liteFluid = false;
  if (!animReady && gsap && ScrollTrigger && THREE) {
    try {
      var probe = document.createElement("canvas");
      liteFluid =
        !matchMedia("(prefers-reduced-motion: reduce)").matches &&
        !!(window.WebGLRenderingContext &&
          (probe.getContext("webgl") || probe.getContext("experimental-webgl")));
    } catch (e) { liteFluid = false; }
  }
  if (!animReady && !liteFluid) { initNav(); initFallbackReveals(); return; }
  if (liteFluid) { initFallbackReveals(); root.classList.add("has-fluid"); }

  gsap.registerPlugin(ScrollTrigger);
  initNav();

  // Inline styles cannot rely on var() surviving every engine's CSSOM, so read
  // the palette out of :root once and reuse the resolved values.
  var CSSVAR = (function () {
    var cs = getComputedStyle(document.documentElement);
    var get = function (n, fallback) { return (cs.getPropertyValue(n) || "").trim() || fallback; };
    return { gold: get("--gold", "#d8a75b"), goldRgb: get("--gold-rgb", "216, 167, 91"),
             blue: get("--blue", "#5b8cd8") };
  })();

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
    "uniform float u_time,u_aspect,u_blob_radius,u_blob_edge,u_blob_rot,u_opacity,u_flood,u_calm,u_clipTop;",
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
    "  float wob = (0.16*sin(ang*3.0 + t*1.3) + 0.10*sin(ang*5.0 - t*0.9) + 0.08*sin(ang*2.0 + t*0.5)) * u_calm;",
    "  float nr = fbm(q*1.3 + t*0.6)*0.24*u_calm;",
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
    // Nothing paints above u_clipTop, so the flood can be held inside its section.
    "  alpha *= 1.0 - smoothstep(u_clipTop - 0.015, u_clipTop + 0.015, p.y);",
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
    u_calm: { value: 1 },
    u_clipTop: { value: 2 },
    u_colorA: { value: new THREE.Color(0.141, 0.251, 0.435) },
    u_colorB: { value: new THREE.Color(0.247, 0.427, 0.71) }
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
  // `lock` pins the centre to the target with no easing. The smoothing that
// gives the sweeps their liquid drag is exactly what made the body trail the
// logo and then catch up, so the hero turns it off.
var target = { cx: 0, cy: 0.1, sx: 1, sy: 1, radius: 0.42, edge: 0.03, rot: 0, opacity: 1, flood: 0, calm: 1, clip: 2, lock: false };
  var SMOOTH = 7;
  gsap.ticker.add(function (time, deltaMS) {
    if (document.hidden) return;
    var u = uniforms;
    u.u_time.value += deltaMS * 0.001;
    var k = Math.min(1, deltaMS * 0.001 * SMOOTH);
    var cen = u.u_blob_center.value;
    // Ease normally, but snap the center across huge jumps: that only happens
    // at an off-screen wrap, so it must not be dragged across the viewport.
    if (target.lock) {
      measureLogo();
      target.cx = heroRest[0]; target.cy = heroRest[1];
    }
    var dx = target.cx - cen.x, dy = target.cy - cen.y;
    if (target.lock) { cen.x = target.cx; cen.y = target.cy; }
    else {
      cen.x += Math.abs(dx) > 3.5 ? dx : dx * k;
      cen.y += Math.abs(dy) > 3.5 ? dy : dy * k;
    }
    var st = u.u_blob_stretch.value;
    st.x += (target.sx - st.x) * k;
    st.y += (target.sy - st.y) * k;
    u.u_blob_radius.value += (target.radius - u.u_blob_radius.value) * k;
    u.u_blob_edge.value += (target.edge - u.u_blob_edge.value) * k;
    u.u_blob_rot.value += (target.rot - u.u_blob_rot.value) * k;
    u.u_opacity.value += (target.opacity - u.u_opacity.value) * k;
    u.u_flood.value += (target.flood - u.u_flood.value) * k;
    u.u_calm.value += (target.calm - u.u_calm.value) * k;
    u.u_clipTop.value = target.clip;   // a layout edge, so no easing
    renderer.render(scene, camera);
  });
  gsap.ticker.lagSmoothing(1000, 16);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  // Sweep centres go past the viewport edges (~ -0.5 / 1.5 in screen fraction)
  // with margin for the blob radius+stretch, so no fluid edge clips on screen.
  var OFF_L = -4.0, OFF_R = 4.0;

  // Top edge of an element in shader Y (+1 top, -1 bottom), used to hold the
  // flood inside its own section instead of letting it wash over the one above.
  function topEdgeY(sel) {
    var el = document.querySelector(sel);
    if (!el) return 2;
    return 1 - 2 * (el.getBoundingClientRect().top / window.innerHeight);
  }

  /* ---- logo rest position (fluid rests behind the right-column logo) --- */
  var heroRest = [0.6, 0.05];
  function measureLogo() {
    var el = document.getElementById("logo-frame");
    if (!el) return;
    var r = el.getBoundingClientRect();
    var w = window.innerWidth, h = window.innerHeight;
    var px = r.left + r.width / 2, py = r.top + r.height / 2;
    // Round to whole pixels first: a fractional rect (fonts settling, sub-pixel
    // layout) is what left the body a few pixels off its resting spot.
    px = Math.round(px); py = Math.round(py);
    heroRest = [((px / w) * 2 - 1) * (w / h), 1 - (py / h) * 2];
  }
  measureLogo();
  // Start the blob behind the logo on first paint (before any scroll update),
  // live value included, so there is no opening catch-up drift.
  target.cx = heroRest[0];
  target.cy = heroRest[1];
  target.lock = true;
  uniforms.u_blob_center.value.set(heroRest[0], heroRest[1]);

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
  // Only the overline travels, and it goes to the TOP-LEFT corner. The heading
  // and its sub-line stay put and fade out, so nothing slides across the middle
  // while the section content is moving through it.
  function placeHead(head, p) {
    var over = head.querySelector(".overline");
    if (!over) return;
    var hk = smoothstep(0.0, 0.18, p);
    var vw = window.innerWidth, vh = window.innerHeight;
    var padX = Math.max(24, Math.min(72, vw * 0.035));
    var padY = 108; // clears the 76px nav
    // offsetTop/offsetHeight are layout values, so they stay valid under transforms.
    var dyOff = over.offsetTop + over.offsetHeight / 2 - head.offsetHeight / 2;
    var tx = (padX + over.offsetWidth / 2) - vw / 2;
    var ty = (padY + over.offsetHeight / 2) - (vh / 2 + dyOff);
    over.style.transform =
      "translate(" + Math.round(tx * hk) + "px," + Math.round(ty * hk) + "px)";
    var fade = (1 - smoothstep(0.0, 0.12, p)).toFixed(3);
    var rest = head.querySelectorAll("h2, .pin-head__sub");
    for (var i = 0; i < rest.length; i++) rest[i].style.opacity = fade;
  }

  if (liteFluid) {
    // A full-screen noise shader is expensive on a phone; cap the pixel count.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    resize();                                   // re-size the buffer to the new ratio
    ScrollTrigger.create({
      trigger: "#top", start: "top top", end: "bottom top",
      onToggle: function (self) { target.lock = self.isActive; },
      onUpdate: function (self) {
        var p = self.progress;
        target.lock = true;                       // stays glued to the mark
        measureLogo();
        target.cx = heroRest[0]; target.cy = heroRest[1];
        target.sx = 1; target.sy = 1; target.rot = 0; target.flood = 0;
        target.calm = 0.2; target.clip = 2;
        target.radius = 0.42; target.edge = 0.03;
        target.opacity = 1 - smoothstep(0.4, 0.95, p);
      }
    });
    ScrollTrigger.create({
      trigger: "#download", start: "top 85%", end: "bottom top",
      onUpdate: function (self) {
        var p = self.progress;
        target.lock = false;
        target.cx = 0; target.cy = 0; target.rot = 0;
        target.sx = 1.8; target.sy = 1.6; target.radius = 2.6; target.edge = 0.05;
        target.calm = 1; target.clip = topEdgeY("#download");
        target.flood = 1;
        target.opacity = smoothstep(0, 0.25, p);
      }
    });
    window.addEventListener("resize", function () { resize(); measureLogo(); });
    return;
  }

  /* =======================================================================
     PHASE 1 — HERO: the aura dissolves in place (no travel down), fully gone
     before the modules section pins.
     ===================================================================== */
  ScrollTrigger.create({
    trigger: "#top", start: "top top", end: "bottom top",
    onRefresh: function () { measureLogo(); target.lock = true; target.cx = heroRest[0]; target.cy = heroRest[1]; },
    onToggle: function (self) { target.lock = self.isActive; },
    onUpdate: function (self) {
      var p = self.progress;
      // Track the logo's live position so the body stays pinned behind it as
      // the hero scrolls, instead of being left behind at its load position.
      target.lock = true;                        // the ticker keeps it on the logo
      measureLogo();                             // and re-anchor on every update
      target.cx = heroRest[0]; target.cy = heroRest[1];
      target.sx = 1; target.sy = 1; target.rot = 0; target.flood = 0;
      target.calm = 0.2;   // the positional noise is what made it drift off-centre
      target.clip = 2;
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
  var colFx = [0.2, 0.5, 0.8];
  function measureModules() {
    var vw = window.innerWidth;
    var gridW = Math.min(1100, vw - 48);
    var gridLeft = (vw - gridW) / 2;
    colFx = [0, 1, 2].map(function (c) { return (gridLeft + (c + 0.5) * gridW / 3) / vw; });
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
        card.style.borderColor = bell > 0.05 ? CSSVAR.gold : "";
        card.style.boxShadow = bell > 0.05
          ? "0 10px 30px -10px rgba(" + CSSVAR.goldRgb + "," + (0.35 * bell).toFixed(2) + ")"
          : "";
        card.style.zIndex = bell > 0.15 ? 2 : 1;
      }
    }
  }
  ScrollTrigger.create({
    trigger: "#modules", start: "top top", end: "+=150%", pin: ".modules__pin", scrub: 1, anticipatePin: 1,
    onRefresh: measureModules,
    onUpdate: function (self) {
      var p = self.progress;
      target.lock = false;                              // release the hero pin
      target.cx = lerp(OFF_L, OFF_R, p); target.cy = 0; // through the centred grid
      target.sx = 2.6; target.sy = 0.78; target.radius = 0.5; target.edge = 0.03; target.rot = 0; target.flood = 0;
        target.calm = 1; target.clip = 2;
      target.opacity = smoothstep(0, 0.1, p) * (1 - smoothstep(0.94, 1, p)); // gone at both edges
      moduleReact(p);
      placeHead(modHead, p);
    }
  });

  /* =======================================================================
     PHASE 3 — THE TIDE: cards ride the fluid across the centre of the screen;
     the fluid fades at both edges so no wave lingers at the boundaries.
     ===================================================================== */
  var tideTrack = document.getElementById("tide-track");
  var tideCards = tideTrack.children;
  var tideHead = document.querySelector("#tide .section-head");
  function measureTide() {}
  // Scatter inside the liquid body. Y is the dominant axis so neighbours sit
  // clearly above/below one another rather than sliding along one line; the
  // lane shuffle stops any two adjacent cards sharing a height, and X jitter
  // breaks the even spacing. Normalised here, scaled to the viewport at draw.
  var tideScatter = (function () {
    var n = tideCards.length, lanes = [], out = [];
    for (var i = 0; i < n; i++) lanes.push(-1 + 2 * (i / (n - 1)));   // -1 .. 1
    for (var j = lanes.length - 1; j > 0; j--) {                      // shuffle
      var k = Math.floor(Math.random() * (j + 1)), t = lanes[j]; lanes[j] = lanes[k]; lanes[k] = t;
    }
    for (var m = 0; m < n; m++) {
      // Nudge a lane if it landed too close to its neighbour's height.
      if (m && Math.abs(lanes[m] - lanes[m - 1]) < 0.45) lanes[m] += lanes[m] > lanes[m - 1] ? 0.45 : -0.45;
      out.push({
        y: Math.max(-1, Math.min(1, lanes[m] + (Math.random() * 2 - 1) * 0.12)),
        x: (Math.random() * 2 - 1) * 42,
        r: (Math.random() * 2 - 1) * 6,
        spd: 0.82 + Math.random() * 0.36        // some cards lag the wave, some lead
      });
    }
    return out;
  })();
  ScrollTrigger.create({
    trigger: "#tide", start: "top top", end: "+=200%", pin: ".tide__pin", scrub: 1, anticipatePin: 1,
    onRefresh: measureTide,
    // The cards are absolutely placed by this handler, so if the section ever
    // stops updating while pinned one can linger on screen. Tie their
    // visibility to the trigger being active.
    onToggle: function (self) { tideTrack.style.visibility = self.isActive ? "visible" : "hidden"; },
    onUpdate: function (self) {
      var p = self.progress;
      target.lock = false;
        target.cx = lerp(OFF_R, OFF_L, p); target.cy = 0;
      target.sx = 3.0; target.sy = 1.25; target.radius = 0.7; target.edge = 0.04; target.rot = 0; target.flood = 0;
        target.calm = 1; target.clip = 2;
      target.opacity = smoothstep(0, 0.08, p) * (1 - smoothstep(0.9, 1, p)); // no lingering edge at boundaries
      var vw = window.innerWidth, vh = window.innerHeight;
      var cx = ((target.cx / uniforms.u_aspect.value) + 1) / 2 * vw;
      var n = tideCards.length;
      var spreadY = Math.min(230, vh * 0.30);
      for (var i = 0; i < n; i++) {
        var s = tideScatter[i];
        var x = cx * s.spd + (i - (n - 1) / 2) * 108 - 60 + s.x;
        var y = vh * 0.5 - 68 + s.y * spreadY;
        tideCards[i].style.transform =
          "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + s.r.toFixed(2) + "deg)";
      }
      placeHead(tideHead, p);
    }
  });

  /* =======================================================================
     PHASE 4 — THE VIEWS: the sphere owns this section and is driven by drag,
     not scroll, so the only job here is to keep the fluid out of its way.
     ===================================================================== */
  var galHead = document.querySelector("#gallery .section-head");
  var menuStage = document.getElementById("menu-stage");
  var dragHint = document.getElementById("drag-hint");
  ScrollTrigger.create({
    trigger: "#gallery", start: "top top", end: "+=140%",
    pin: ".gallery__pin", scrub: 1, anticipatePin: 1,
    onUpdate: function (self) {
      var p = self.progress;
      target.lock = false;
      target.calm = 1; target.clip = 2;
      target.opacity = 0;                       // the sphere owns this section
      placeHead(galHead, p);                    // title fades, overline docks
      // Sphere fades up once the heading has cleared the middle; the hint
      // follows it so the reader knows it can be dragged.
      if (menuStage) menuStage.style.opacity = smoothstep(0.16, 0.42, p).toFixed(3);
      if (dragHint) dragHint.style.opacity = smoothstep(0.44, 0.62, p).toFixed(3);
    }
  });

  /* =======================================================================
     PHASE 5 — CTA (the flood): stream enters from the left and expands until
     it floods the section; copy and footer reveal together.
     ===================================================================== */
  gsap.timeline({
    scrollTrigger: {
      trigger: "#download", start: "top top", end: "+=130%", pin: ".cta__pin", scrub: 1, anticipatePin: 1,
      onUpdate: function (self) {
        var p = self.progress;
        target.lock = false;
        target.rot = 0; target.cx = lerp(OFF_L, 0, smoothstep(0, 0.6, p)); target.cy = 0;
        target.sx = 1.8; target.sy = 1.6;
        target.calm = 1; target.clip = topEdgeY("#download");
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
      measureModules(); measureTide(); ScrollTrigger.refresh();
    }, 150);
  });
  measureModules(); measureTide();
  window.addEventListener("load", function () {
    measureLogo(); measureModules(); measureTide(); ScrollTrigger.refresh();
  });
})();
