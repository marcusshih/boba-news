import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrinkState, updateDrink, beginComparison, endComparison, compareDrinks } from '../src/scripts/boba/comparison.js';

test('comparison starts with equal recipes and results in independent frozen values', () => {
  const state = beginComparison(createDrinkState({ base: 'Green Tea', milk: true, toppings: ['boba'], sugarLevel: '50%' }));
  assert.deepEqual(state.current, state.reference);
  assert.notEqual(state.current, state.reference);
  assert.notEqual(state.current.recipe.toppings, state.reference.recipe.toppings);
  assert.throws(() => state.reference.recipe.toppings.push('pudding'), TypeError);
  assert.throws(() => { state.reference.result.totalSugarG = 0; }, TypeError);
  assert.equal(compareDrinks(state).totalSugarDifferenceG, 0);
  assert.equal(beginComparison(state), state);
});
test('changing second recipe and mutating caller input never changes the first', () => {
  const recipe = { base: 'Black Tea', toppings: ['pudding'], sugarLevel: '70%' };
  const state = beginComparison(createDrinkState(recipe));
  const saved = JSON.stringify(state.reference);
  recipe.toppings.push('konjac');
  const changed = updateDrink(state, { milk: true });
  assert.equal(JSON.stringify(changed.reference), saved);
  assert.equal(changed.reference, state.reference);
  assert.equal(changed.current.result.totalSugarG, 4.8);
});
test('comparison uses gram difference even when rounded cube counts are identical', () => {
  const state = updateDrink(beginComparison(createDrinkState({ milk: true })), { toppings: ['boba'] });
  assert.equal(state.current.result.cubeCount, state.reference.result.cubeCount);
  assert.ok(Math.abs(compareDrinks(state).totalSugarDifferenceG - 0.58) < 1e-10);
  assert.ok(Math.abs(compareDrinks(state).cubeEquivalentDifference - 0.145) < 1e-10);
});
test('finishing keeps current recipe; the next comparison freezes the latest drink', () => {
  const active = updateDrink(beginComparison(createDrinkState({ milk: true })), { sugarLevel: '100%' });
  const ended = endComparison(active);
  assert.equal(ended.reference, null);
  assert.equal(ended.current, active.current);
  assert.equal(compareDrinks(ended), null);
  assert.equal(beginComparison(ended).reference.result.totalSugarG, 32);
});
