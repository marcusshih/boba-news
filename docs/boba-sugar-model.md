# Sugar model and physics-preserving customizer update

## Scope and files

The original newspaper colors, typography, asset paths, drink illustrations, selection choices, p5 WebGL cube rendering, and Matter collision behavior remain. Existing scenes, pages, global styles, and story content were not edited. The original desktop arrangement remains controls / illustrated drink / falling cubes. Local containment, natural section height, and a small-screen layout prevent the expanded results from clipping or overlapping the following section.

- `src/components/Game.astro`: existing controls and artwork, associated labels, grouped choices, textual results, comparison markup, and client initialization. The heading retains the original size and font with a semantic h2. Original IDs and image URLs are preserved.
- `src/components/BobaSugarNotes.astro`: integrated “How We Estimate Sugar” disclosure, ingredient table, source links, and limitations.
- `src/css/game.css`: customizer-only styling, original supported select appearance, visible focus, darker neutral control boundaries and warning text, reduced-motion image transitions, mobile containment, and frozen-reference layout.
- `src/scripts/boba/nutrition-data.js`: reference grams, portions, syrup schedule, constants, and source metadata.
- `src/scripts/boba/nutrition.js`: pure normalization, calculations, warning classification, and recipe descriptions.
- `src/scripts/boba/comparison.js`: immutable active/reference recipes and results, plus gram-based differences.
- `src/scripts/boba/cube-physics.js`: delta-only body reconciliation, boundaries, reduced-motion arrangement, physics stepping, and disposal.
- `src/scripts/boba/cube-renderer.js`: instance-mode p5 rendering, visibility/sleep optimizations, reduced-motion preference changes, and frozen image capture using the existing WebGL context.
- `src/scripts/boba/ui.js` and `customizer.js`: DOM rendering, input handling, announcements, comparison focus, library loading, and lifecycle cleanup.
- `package.json` and lockfile: the same existing p5 1.11.10 and Matter 0.14.2 libraries are now exact-version npm dependencies instead of CDN globals. Unused p5.sound was removed. Playwright is development-only. Test scripts were added.
- `tests/`, `playwright.config.js`, and `.gitignore`: focused Node and production-browser checks, with generated reports ignored.

## Calculations

The model is a standardized 500 mL reference drink, including 100 mL plain milk when selected. Toppings use the specified reference servings. It does not model the exact volume displacement or recipe of a commercial drink.

`totalSugarG` includes all selected ingredient sugar plus syrup. Free sugar has a lower and upper bound. Natural lactose in plain milk contributes 4.8 g total sugar and zero free sugar. Boba, pudding, and grass jelly contribute the supplied total values with free sugar ranges from zero to that value. Sweetened Konjac contributes 13 g total and free sugar per 50 g reference serving.

The illustrative syrup schedule is 0, 9.6, 16, 22.4, and 32 g for 0%, 30%, 50%, 70%, and 100%. This explicitly supplied linear recipe is an assumption, not a universal industry standard.

All calculations retain JavaScript numeric precision. Display formatting uses up to two decimal places. Whole cubes use `Math.max(0, Math.round(totalSugarG / 4))`; warnings and differences never use rounded cube counts. The maximum recipe is 68.1 g total sugar, 45–63.3 g free sugar, and 17 cubes.

The 25 g free sugar reference represents 5% of a 2,000 kcal daily diet. If the lower bound exceeds it, the UI says the estimate exceeds the reference. If only the upper bound exceeds it, the UI gives a neutral uncertainty notice. An upper bound of exactly 25 g remains within the reference. The UI does not label any drink healthy or safe, or treat 25 g as a per-drink or personal limit.

## Interaction and performance

Only one Matter engine and one persistent p5 canvas run. Increasing the count adds just the new bodies above the scene; decreasing it removes the excess bodies from the world and tracked array. Existing body identities, positions, and velocities survive recipe changes. Remaining bodies wake on quantity changes so a removed support cannot leave a sleeping cube suspended. Body reconciliation is synchronous and input is never blocked while cubes fall.

Comparison saves separate, deeply frozen recipe/result values, then starts Drink 2 with equal values. The main scene remains the editable Drink 2. Drink 1 uses a frozen clone of the illustrated cup and a static settled cube image. Snapshot capture draws to the existing context and restores the active scene synchronously before browser paint; no second canvas, engine, or WebGL context is allocated. A settled snapshot includes every cube even if comparison starts before the active cubes have fallen into view. Finishing comparison keeps the latest drink and its bodies.

The simulation steps at fixed 60 Hz intervals, caps time catch-up, pauses drawing offscreen or in a hidden document, and stops when all bodies sleep. Its 300 × 500 coordinates remain stable while CSS scales the canvas. Resizing never rebuilds the world. Pixel density is capped at two. Cleanup removes bodies, observers, listeners, and the p5 instance.

Reduced motion arranges the same quantity as static cubes without falling or rotation. Preference changes apply live, including when returning to normal motion. Drink opacity transitions are also disabled under reduced motion. No global motion control was added.

## Accessibility

The existing selects and checkboxes keep native keyboard behavior. Labels are associated by ID; fieldsets identify milk and toppings. The clickable checkbox labels and buttons have 44px minimum height. Inputs, buttons, links, disclosure, and the scrollable ingredient table have visible focus indicators. Selection remains identifiable through native checked states, not just color.

Results and warnings are readable text outside the decorative canvas. A single polite atomic status announces the settled estimate after 400 ms without changes. Initial rendering is silent and animation frames never update the status. Comparison start announces the mode and focuses the base select; finish retains Drink 2 and returns focus to the comparison button. The English customizer has its own language attribute. The ingredients and static image clones have no duplicate IDs or redundant image announcements.

The accessibility target is WCAG 2.2 AA. Automated checks and an accessibility-tree snapshot do not establish conformance or verify real screen reader speech.

## Data provenance and limitations

Checked 27 October 2026:

- [TP TEA Las Vegas](https://tptealasvegas.snk.site/nutrition-facts): verified pearl 5.38 g, pudding 9.13 g, and grass jelly 3.79 g total sugar. The table does not specify serving weights or identify free sugars. No serving weight was invented.
- [Bossen Rainbow Jelly product label](https://www.webstaurantstore.com/documents/nutrition/bossen_rainbow_jelly.pdf): verified 13 g total and added sugars per 50 g. This sweetened konjac-containing product is a proxy, not a claim about all konjac jelly.
- [WHO Healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet): verified daily free sugar energy guidance and the distinction between free sugar and total sugar. The 25 g value is the project's 5%-of-2,000-kcal context.
- [Min et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC5217910/): automated article access was blocked. The link is included as supplied research context; no ingredient number is represented as verified from this paper.
- [Supplied Gong cha PDF link](https://gongchausofficial.com/wp-content/uploads/2024/02/Gong-cha-nutritional-info-Jan-2024.pdf): redirects to the brand homepage. Its unavailable nutrition data is not used.

The 4.8 g per 100 mL plain-milk value remains a supplied project reference; it was not independently verified against these links. Unsweetened tea at zero, the reference recipe, and syrup schedule are also disclosed project values. Free sugar ranges for the three uncertain toppings are modeling bounds, not confidence intervals. Values vary by formulation, brand, portion, and preparation. The UI explains these limits rather than claiming exact commercial nutrition facts.

## Validation

Run from the repository root:

```sh
npm ci
npm test
npm run build
npm run test:browser
npm run test:browser:dev
```

The browser suite requires installed Google Chrome and a free port 4321. It builds the app and starts production preview automatically. Screenshots are saved under ignored `test-results/`.

The development command runs the same checks against Astro dev, with a separate dependency cache and forced prebundling so it checks a fresh startup without invalidating another open development session. Vite explicitly prebundles p5 and Matter before their lazy imports. Renderer initialization errors are logged only in development.

- 15 Node tests cover plain tea, milk, toppings at 0%, each syrup level, Konjac, warning boundaries, all 480 supported recipe combinations, precision and invariants, immutable comparison, gram-based differences, body deltas, cleanup, 300 rapid count changes, maximum stack stability over 3,600 Matter steps, and live reduced-motion switching.
- 14 Chrome browser tests cover immediate estimates and notices, actual WebGL animation, frozen comparison and same-count gram differences, keyboard-only interaction, focus, accessible result text, disclosure access, one debounced announcement for 50 changes, reduced motion, 320/390/768/1024/1440px layouts and resizing, rendering-library failure, repeated comparisons retaining one canvas and visible frozen quantities, and renderer initialization/animation on first load and reload. These run in both production and development modes.
- Production builds pass. Vite reports a large-chunk warning for the retained full p5 library, which is already in its own dynamically imported chunk. No lint or separate type-check script existed in the repository.
- Desktop and mobile production screenshots were inspected against an original desktop capture. No user research or accessibility-compliance outcome is claimed.

Still test manually: VoiceOver/Safari and NVDA/Firefox or Chrome announcements and reading order; Safari/Firefox keyboard behavior; actual iOS/Android portrait and landscape use; 200–400% zoom, enlarged text and forced-colors mode; and hardware-specific WebGL behavior. The overall site's unrelated accessibility and scrollytelling behavior were outside this change.
