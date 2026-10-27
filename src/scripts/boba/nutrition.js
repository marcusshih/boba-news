import { ingredients, TOPPING_KEYS, syrupSugarG, GRAMS_PER_CUBE, FREE_SUGAR_REFERENCE_G } from './nutrition-data.js';

export function normalizeRecipe(recipe = {}) {
  return {
    base: ['Green Tea', 'Black Tea'].includes(recipe.base) ? recipe.base : '',
    milk: Boolean(recipe.milk),
    toppings: TOPPING_KEYS.filter(key => recipe.toppings?.includes(key)),
    sugarLevel: Object.hasOwn(syrupSugarG, recipe.sugarLevel) ? recipe.sugarLevel : '0%',
  };
}

export function referenceState(freeSugarMinG, freeSugarMaxG) {
  if (freeSugarMinG > FREE_SUGAR_REFERENCE_G) return 'exceeds';
  if (freeSugarMaxG > FREE_SUGAR_REFERENCE_G) return 'uncertain';
  return 'within';
}

export function calculateSugar(input) {
  const recipe = normalizeRecipe(input);
  const tea = recipe.base === 'Green Tea' ? ingredients.greenTea : ingredients.blackTea;
  const selected = [tea, ...(recipe.milk ? [ingredients.milk] : []), ...recipe.toppings.map(key => ingredients[key])];
  const syrup = syrupSugarG[recipe.sugarLevel];
  // Keep gram values unrounded; only the visual cube conversion is rounded.
  const totalSugarG = selected.reduce((sum, item) => sum + item.totalSugarG, syrup);
  const freeSugarMinG = selected.reduce((sum, item) => sum + item.freeSugarMinG, syrup);
  const freeSugarMaxG = selected.reduce((sum, item) => sum + item.freeSugarMaxG, syrup);
  return {
    totalSugarG,
    freeSugarMinG,
    freeSugarMaxG,
    cubeCount: Math.max(0, Math.round(totalSugarG / GRAMS_PER_CUBE)),
    referenceState: referenceState(freeSugarMinG, freeSugarMaxG),
  };
}

export function describeRecipe(input) {
  const recipe = normalizeRecipe(input);
  const toppings = recipe.toppings.map(key => ingredients[key].label).join(', ');
  return `${recipe.base || 'Tea base not selected'} · ${recipe.milk ? 'with plain milk' : 'no milk'} · ${toppings || 'no toppings'} · ${recipe.sugarLevel} sweetness`;
}
