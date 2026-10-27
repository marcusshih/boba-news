import { createDrinkState, updateDrink, beginComparison, endComparison } from './comparison.js';
import { createCubeRenderer } from './cube-renderer.js';
import { readRecipe, renderResult, renderReference, referenceMessages, formatGrams, formatFreeSugar } from './ui.js';

export function initCustomizer(root) {
  let state = createDrinkState(readRecipe(root));
  let renderer;
  let announcementTimer;
  let disposed = false;
  const button = root.querySelector('[data-compare-button]');
  const snapshot = root.querySelector('[data-reference-cubes]');
  const announce = message => {
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => {
      root.querySelector('[data-status]').textContent = message;
    }, 400);
  };
  const update = () => {
    state = updateDrink(state, readRecipe(root));
    renderResult(root, state);
    renderer?.setCount(state.current.result.cubeCount);
    const result = state.current.result;
    const comparison = state.reference ? ` ${root.querySelector('[data-comparison-difference]').textContent}` : '';
    announce(`${state.reference ? 'Drink 2' : 'Drink'}: ${formatGrams(result.totalSugarG)} g total sugar; free sugar ${formatFreeSugar(result)}. ${referenceMessages[result.referenceState]}${comparison}`);
  };
  const takeSnapshot = () => {
    if (!renderer || !state.reference) return;
    try {
      snapshot.src = renderer.snapshot(state.reference.result.cubeCount);
      snapshot.hidden = false;
    } catch {
      // The frozen recipe and textual quantities remain available if WebGL
      // cannot provide the optional static image.
      snapshot.hidden = true;
    }
  };
  const compare = () => {
    if (state.reference) {
      state = endComparison(state);
      snapshot.hidden = true;
      snapshot.removeAttribute('src');
      root.querySelector('[data-reference-illustration]').replaceChildren();
      renderResult(root, state);
      announce('Comparison finished. Your latest drink is kept.');
      button.focus();
    } else {
      state = beginComparison(state);
      renderReference(root, state.reference);
      renderResult(root, state);
      takeSnapshot();
      announce('Drink 1 saved. Now editing Drink 2 with the same recipe.');
      root.querySelector('#baseSelect').focus();
    }
  };
  root.querySelector('#menu-container').addEventListener('change', update);
  button.addEventListener('click', compare);
  renderResult(root, state);
  root.dataset.ready = 'true';

  // Pin and bundle the same p5/Matter versions previously loaded from CDNs.
  // Text and controls work while the rendering libraries load, or if WebGL fails.
  Promise.all([import('p5'), import('matter-js')])
    .then(async ([p5, matter]) => {
      if (disposed) return;
      renderer = await createCubeRenderer(p5.default, matter.default, root.querySelector('#sketch-container'));
      if (disposed) { renderer.dispose(); return; }
      renderer.setCount(state.current.result.cubeCount);
      root.dataset.renderer = 'ready';
      takeSnapshot();
    })
    .catch(error => {
      if (disposed) return;
      if (import.meta.env.DEV) console.error('Sugar cube renderer initialization failed:', error);
      root.querySelector('[data-renderer-note]').hidden = false;
      root.dataset.renderer = 'unavailable';
    });

  const cleanup = event => {
    if (event.persisted) return;
    disposed = true;
    clearTimeout(announcementTimer);
    root.querySelector('#menu-container').removeEventListener('change', update);
    button.removeEventListener('click', compare);
    renderer?.dispose();
    window.removeEventListener('pagehide', cleanup);
  };
  window.addEventListener('pagehide', cleanup);
}
