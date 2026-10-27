import { calculateSugar, normalizeRecipe } from './nutrition.js';
import { GRAMS_PER_CUBE } from './nutrition-data.js';

function drink(input) {
  const recipe = normalizeRecipe(input);
  Object.freeze(recipe.toppings);
  return Object.freeze({ recipe: Object.freeze(recipe), result: Object.freeze(calculateSugar(recipe)) });
}

export function createDrinkState(recipe) {
  return Object.freeze({ current: drink(recipe), reference: null });
}

export function updateDrink(state, recipe) {
  return Object.freeze({ current: drink(recipe), reference: state.reference });
}

export function beginComparison(state) {
  if (state.reference) return state;
  return Object.freeze({ reference: drink(state.current.recipe), current: drink(state.current.recipe) });
}

export function endComparison(state) {
  // Keep the user's latest drink and its existing physics bodies.
  return Object.freeze({ current: state.current, reference: null });
}

export function compareDrinks(state) {
  if (!state.reference) return null;
  const totalSugarDifferenceG = state.current.result.totalSugarG - state.reference.result.totalSugarG;
  return { totalSugarDifferenceG, cubeEquivalentDifference: totalSugarDifferenceG / GRAMS_PER_CUBE };
}
