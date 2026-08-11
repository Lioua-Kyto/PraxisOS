# Landing page — task log

Change log for the PraxisOS landing page (`landing/`). Newest round on top.

---

## Round: InfiniteMenu sphere, hero drift, stranded card, scroll restore

### Section 4 — The Views is now an InfiniteMenu sphere
Replaced the scroll carousel with the React Bits **InfiniteMenu** component
(JavaScript + CSS variant). The page has no bundler, so the component was
ported rather than installed: its rendering core (`Geometry`, `ArcballControl`,
`InfiniteGridMenu`) is framework-agnostic and is kept faithful in
`infinite-menu.js`; only the React wrapper is replaced by a vanilla
`mountInfiniteMenu(container, items, scale)`. `gl-matrix` loads from jsDelivr as
a UMD global.

Three deliberate deviations, all noted in the file header:
- the context is created with `alpha: true` and cleared transparent, so the
  sphere sits over the page instead of on an opaque black box;
- atlas cells are filled with a centre-crop of each screenshot, since the
  sources are 16:9 and the cells are square;
- the title and description sit under the sphere, and the reference CSS's
  `max-width: 1500px` rule that hid them is dropped, so they read on laptops.

The sphere needs WebGL2 and is only mounted above 900px: its canvas sets
`touch-action: none`, which would trap a vertical swipe on a phone. Anything
narrower, or without WebGL2, gets a static grid of the same eleven screens.

### Hero fluid drift
The body dipped for a moment on the first scroll and came to rest about 10px
high. Both came from the same place: the position was only refreshed when
ScrollTrigger reported progress, and the live uniform still eased toward it.
While locked, the ticker now measures the logo and assigns the centre each
frame, and the live uniform is seeded on the logo at startup, so there is no
opening catch-up and no offset at rest.

### A card stranded in the corner
Before the tide section's first update its cards have no transform yet, so all
eleven stacked at the container origin and the last one (Settings) showed in
the corner until the section pinned. The track now starts hidden and is
revealed by the trigger.

### Reload position
`history.scrollRestoration` is `manual`, so a reload lands at the top of the
hero rather than part-way into a pinned section.

---

## Round: hero lag, stranded tide card, black icons

### Hero fluid trailed the logo
Tracking the logo's live position was only half the fix. The render loop eases
every uniform toward its target (`k = dt * 7`), which is what gives the sweeps
their liquid drag, and that same easing left the body behind the logo and then
dragged it back, about 45px of trail at a steady scroll. The target now carries
a `lock` flag: while the hero owns the fluid the centre is assigned directly
with no easing, and every other phase releases it.

Putting the canvas inside the logo container would not have fixed this. It is
one fixed full-screen WebGL surface and the same body has to sweep the whole
viewport later; the lag was in the interpolation, not the element tree.

### A tide card could strand on screen
The tide cards are placed by the scroll handler, so if the section stopped
updating while pinned the last painted card kept its transform and sat there
until a reload. Their visibility is now tied to the trigger being active, for
both the tide and the gallery, so nothing can be left behind.

### Icons rendered black
The base `.ico` rule was lost in the layout rewrite. Nothing set
`fill: none; stroke: currentColor`, so the Lucide paths took the default black
fill and `color: var(--gold)` had nothing to act on. Rule restored.

---

## Round: colour tokens, hero pinning, gallery entry and step feel

### Colour
- Every colour on the page now comes from a `:root` variable. Added the ones
  that were being written inline: `--blue`, `--blue-deep`, `--blue-ink`,
  `--blue-ink-soft`, `--blue-ink-dim`, `--blue-overline`, `--gold-soft`,
  `--gold-rgb`, plus surface and button tokens. No raw hex remains outside the
  `:root` block.
- The wave accent on the module cards is `--gold`; it had been a one-off orange.
- JS reads the palette out of `:root` once and reuses the resolved values,
  rather than writing `var(...)` into inline styles.

### Section 1 — Hero
- The liquid body now follows the logo's live position as the hero scrolls, so
  it stays behind the mark while it dissolves instead of being left at the
  spot it occupied on load.

### Section 3 — In Motion
- Card spacing tightened (108px step, smaller jitter) so the train stays inside
  the liquid body and reads as being carried by it.
- Card icons are `--gold`.

### Section 4 — The Views
- The first screen now starts one slot off to the side and slides in, so it no
  longer sits on top of the section title while the title is still fading.
  The last one slides out rather than parking in the middle.
- The step is much crisper: scrub cut from 1 to 0.25 and the snap shortened
  with no delay. The long scrub was what made one wheel tick nudge the row,
  pause, then drift to the next slot.
- Cards more than ~2.5 slots from centre are `visibility: hidden`, which keeps
  the composited layer count low and the step feeling instant.
- Food Library dropped: it is a Nutrition screen, not a separate view. Eleven
  views now, in the gallery, the tide, and the headline.

---

## Round: headers, gallery spotlight, tide scatter, CTA contrast

### Pinned section headers
- The overline is the only part that travels, and it now docks to the **top
  left** rather than the right. The heading and its sub-line stay exactly where
  they are and fade out, so nothing slides across the middle while the section
  content is moving through it.
- The overline box is `width: max-content`. As a full-width block its text
  stayed optically centred no matter where the box was moved.

### Section 4 — The Views
- Screenshots were blurry because the card was `16/10` against a `16/9` source
  (so it cropped) and, worse, the focused card was scaled **up** to 1.3 from a
  563px box. The card is now `16/9` at 819px and the focused state renders at
  scale 1.0, i.e. a straight downscale from the 1920x1080 original. Sharp at 2x
  DPR too.
- The label moved out of the image. One shared caption sits under the carousel
  and cross-fades to whichever screen holds the spotlight, fading out once the
  last one passes.
- The spotlight card is much larger: 1.0 against 0.62 for its neighbours,
  falling away to 0.42 further out.
- Scrolling now advances the carousel one screen per tick (ScrollTrigger
  `snap`), swapping the centred image with its neighbour, instead of drifting
  the whole row by a few pixels.
- Cards are centred on the viewport. The track carries `will-change: transform`,
  which makes it a containing block; collapsed to height 0 that silently turned
  the cards' `top: 50%` into `0px` and pinned them to the top of the screen.

### Section 3 — In Motion
- Cards no longer travel along one line. Each is assigned a shuffled vertical
  lane over a ~430px spread, with neighbouring lanes forced apart, plus X jitter
  and tilt, so cards genuinely sit above and below one another.
- Card redesigned: the index number is gone, leaving the module icon and its
  label. Icons are the Lucide set the desktop app uses in its own sidebar.

### Section 5 — CTA
- The copy was dark gold on a light blue flood and close to unreadable. The
  flood is deeper now (`#35619f` in CSS, matched by the shader's colours) and
  the copy is light. Every string was measured against the real flooded colour
  and clears WCAG AA: heading 5.9, overline 4.9, body 5.6, footer 5.4.

---

## Round: verification pass — two defects found and fixed

The previous round's changes were verified one by one against the running page.
Most held; two did not, and both were silent (no console error, correct-looking
source).

### Fixed: pinned headers were positioned off-screen

`:not(.anim) .pin-head { position: static }` was intended to mean "when the root
element lacks `.anim`". It does not. `:not(.anim)` matches any ancestor without
that class — `body`, `main`, `section` all qualify — so the rule matched on
desktop too, and beat `.pin-head` on specificity. The header therefore stayed
`position: static`, and its `translate(-50%, -50%)` pushed it up and left, out
of the viewport, in both the large and docked states.

Every `:not(.anim)` selector is now `html:not(.anim)`, which is what was meant.
Verified in both directions: the header is `absolute` on desktop and `static` in
the fallback.

Knock-on fix: with the header back out of flow, the module grid now centres at
y=361 in a 720 viewport (it sat at 464, pushed down by the in-flow header).

### Fixed: gallery spotlight peaked off-centre

Card centres were modelled as `padding + i * (width + gap)`. The cards carry a
side margin, so the real stride is 677px against a modelled 597px. The 80px
error compounds across twelve cards, which is why the largest card sat 400-700px
right of centre instead of at it.

The layout now reads each card's real `offsetLeft` once per refresh and uses
that. `offsetLeft` is unaffected by transforms, so it stays valid while the
cards scale. The focused card now peaks within ~70px of the viewport centre.

### Verified as already correct

- Hero fluid dissolves in place (centre stays on the logo, opacity to 0), no
  travel to the corner.
- Shader opacity is 0 at every section boundary, scrolling both up and down.
- Tide cards ride the fluid (10 of 12 on screen mid-sweep, scattered).
- Reverse scrubbing produces byte-identical state to the forward pass.
- No gap beneath the footer (0px at the bottom of the page).
- Fallback on tablet and phone: no WebGL, no pins, all content visible,
  carousels scroll, no horizontal page overflow.

---

## Round: shader positioning, section choreography, footer

### Shader
- Fluid colour is blue `#5B8CD8` (`vec3(0.357, 0.549, 0.847)`); deeper blue for
  the body gradient.
- On load the blob is anchored behind `#logo-frame` (computed from its viewport
  rect), not a fixed default.
- Sweep centres run to `±4.0` (past `-0.5` / `1.5` screen fraction) so no fluid
  edge clips at the viewport borders.
- Hero: the aura no longer travels to the bottom corner. It dissolves in place
  (opacity to zero, edge softening) and is gone before the modules section pins.
- Every moving phase fades the fluid in at its start and out at its end, so no
  wave lingers at a section boundary when scrolling either direction.
- Reverse scrubbing is exact: forward and backward produce identical blob state
  at the same scroll position.

### Section headers (pinned sections)
- Before a section pins, its title + text sit large and centred.
- Once pinned, the header shrinks and slides to the top-right corner so the
  content moves through the middle of the screen unobstructed.

### Section 2 — The System (modules)
- Cards restyled: dark `#111212` surface, `1px` hairline border, `8px` radius,
  glowing orange step index (`01`, `02`, …).
- Hover and the passing-wave trigger both lift the card (`-6px`), turn the
  border orange, and add an orange glow.
- The grid is centred vertically; the fluid wave passes through its centre and
  delivers the cards.

### Section 3 — In Motion (tide)
- The tide cards ride the fluid: each is attached to the blob's X, with a
  randomised Y offset (`±30px`) and tilt (`±5°`) so they look scattered inside
  the moving liquid.
- Cards are vertically centred (previously they sat low, hidden behind the
  large title).
- Card size `180px`, `4:3`.

### Section 4 — The Views (gallery)
- No shader in this section.
- Strong spotlight: the centred screenshot scales to `1.3` (blue border,
  drop shadow); side cards fall to `0.6`, `0.2` opacity, `blur(2px)`.
- Cards are vertically centred and the focus peaks at the exact screen centre.

### Section 5 — CTA + footer
- The footer lives inside the CTA section.
- `.cta__pin` is a CSS grid (`1fr auto`): copy centred, footer flush to the
  bottom — no empty gap beneath it.
- The flood reveals the copy and the footer together.

### Responsiveness
- Full experience (shader + pins) runs on desktop only (`> 1024px`).
- Phones and tablets get the plain layout with light scroll-reveal transitions,
  no WebGL and no pins; tide/gallery become touch scroll-snap carousels.
