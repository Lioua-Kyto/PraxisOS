# Landing page — task log

Change log for the PraxisOS landing page (`landing/`). Newest round on top.

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
