import { describeRecipe } from './nutrition.js';
import { compareDrinks } from './comparison.js';

const number = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
export const formatGrams = value => number.format(value);
export const formatFreeSugar = result => result.freeSugarMinG === result.freeSugarMaxG
  ? `${formatGrams(result.freeSugarMinG)} g`
  : `${formatGrams(result.freeSugarMinG)}–${formatGrams(result.freeSugarMaxG)} g`;

export const referenceMessages = Object.freeze({
  exceeds: 'Estimated free sugar exceeds the 25 g daily reference.',
  uncertain: 'Estimated free sugar may exceed the 25 g daily reference; recipes vary.',
  within: 'Estimated free sugar is within the 25 g daily reference.',
});

export function readRecipe(root) {
  return {
    base: root.querySelector('#baseSelect').value,
    milk: root.querySelector('#milkCheckbox').checked,
    toppings: ['boba', 'pudding', 'grass', 'konjac'].filter(key => root.querySelector(`#${key}Checkbox`).checked),
    sugarLevel: root.querySelector('#sugarSelect').value,
  };
}

export function renderDrinkPreview(root, recipe) {
  const layers = {
    greentea: recipe.base === 'Green Tea',
    blacktea: recipe.base === 'Black Tea',
    milk: recipe.milk,
    milktea: recipe.milk && recipe.base === 'Black Tea',
    matchalatte: recipe.milk && recipe.base === 'Green Tea',
    bobo: recipe.toppings.includes('boba'),
    pudding: recipe.toppings.includes('pudding'),
    'grass-jelly': recipe.toppings.includes('grass'),
    konjac: recipe.toppings.includes('konjac'),
  };
  for (const [id, selected] of Object.entries(layers)) root.querySelector(`#${id}`).style.opacity = selected ? '1' : '0';
}

export function renderResult(root, state) {
  const { result, recipe } = state.current;
  root.querySelector('[data-cube-count]').textContent = `${result.cubeCount} sugar ${result.cubeCount === 1 ? 'cube' : 'cubes'}`;
  root.querySelector('[data-total-sugar]').textContent = `${formatGrams(result.totalSugarG)} g estimated total sugar`;
  root.querySelector('[data-free-sugar]').textContent = `Estimated free sugar: ${formatFreeSugar(result)}.`;
  const notice = root.querySelector('[data-reference-notice]');
  notice.textContent = referenceMessages[result.referenceState];
  notice.dataset.state = result.referenceState;
  root.querySelector('[data-current-recipe]').textContent = describeRecipe(recipe);
  root.querySelector('[data-drink-label]').textContent = state.reference ? 'Drink 2 · Editing' : 'Your drink';
  root.querySelector('[data-editing-note]').textContent = state.reference ? 'Editing Drink 2. Drink 1 is fixed below.' : '';
  root.querySelector('[data-compare-button]').textContent = state.reference ? 'Finish Comparison' : 'Compare Another Drink';
  root.querySelector('[data-compare-button]').setAttribute('aria-expanded', String(Boolean(state.reference)));
  root.querySelector('[data-comparison]').hidden = !state.reference;
  renderDrinkPreview(root, recipe);
  const difference = compareDrinks(state);
  if (difference) {
    const grams = difference.totalSugarDifferenceG;
    root.querySelector('[data-comparison-difference]').textContent = grams === 0
      ? 'Both drinks have the same estimated total sugar.'
      : `Drink 2 has ${formatGrams(Math.abs(grams))} g ${grams < 0 ? 'less' : 'more'} estimated total sugar than Drink 1 (about ${formatGrams(Math.abs(difference.cubeEquivalentDifference))} cube equivalents).`;
  }
}

export function renderReference(root, reference) {
  const clone = root.querySelector('[data-current-illustration]').cloneNode(true);
  clone.removeAttribute('data-current-illustration');
  clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  root.querySelector('[data-reference-illustration]').replaceChildren(clone);
  root.querySelector('[data-reference-recipe]').textContent = describeRecipe(reference.recipe);
  root.querySelector('[data-reference-total]').textContent = `${reference.result.cubeCount} sugar ${reference.result.cubeCount === 1 ? 'cube' : 'cubes'} · ${formatGrams(reference.result.totalSugarG)} g estimated total sugar`;
  root.querySelector('[data-reference-free]').textContent = `Estimated free sugar: ${formatFreeSugar(reference.result)}. ${referenceMessages[reference.result.referenceState]}`;
}
