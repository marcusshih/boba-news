import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSugar, referenceState } from '../src/scripts/boba/nutrition.js';
import { syrupSugarG, TOPPING_KEYS } from '../src/scripts/boba/nutrition-data.js';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} should equal ${b}`);

test('unsweetened plain tea has zero grams and cubes for both bases', () => {
  for (const base of ['Green Tea', 'Black Tea']) {
    assert.deepEqual(calculateSugar({ base }), {
      totalSugarG: 0, freeSugarMinG: 0, freeSugarMaxG: 0, cubeCount: 0, referenceState: 'within',
    });
  }
});
test('milk contributes total sugar but no free sugar', () => {
  const result = calculateSugar({ milk: true });
  assert.equal(result.totalSugarG, 4.8);
  assert.equal(result.freeSugarMinG, 0);
  assert.equal(result.freeSugarMaxG, 0);
  assert.equal(result.cubeCount, 1);
});
test('0% does not remove toppings, and konjac contributes 13 g total and free', () => {
  for (const [topping, grams] of [['boba', 5.38], ['pudding', 9.13], ['grass', 3.79], ['konjac', 13]]) {
    const result = calculateSugar({ toppings: [topping], sugarLevel: '0%' });
    assert.equal(result.totalSugarG, grams);
    assert.equal(result.freeSugarMinG, topping === 'konjac' ? 13 : 0);
    assert.equal(result.freeSugarMaxG, grams);
  }
});
test('all syrup settings contribute specified grams equally to total and free sugar', () => {
  for (const [sugarLevel, grams] of Object.entries(syrupSugarG)) {
    const result = calculateSugar({ sugarLevel });
    assert.equal(result.totalSugarG, grams);
    assert.equal(result.freeSugarMinG, grams);
    assert.equal(result.freeSugarMaxG, grams);
  }
  assert.equal(calculateSugar({ sugarLevel: '100%' }).totalSugarG, 32);
});
test('warning comparisons use unrounded free sugar and treat 25 g as within', () => {
  assert.equal(referenceState(24.999, 25), 'within');
  assert.equal(referenceState(25, 25), 'within');
  assert.equal(referenceState(25, 25.001), 'uncertain');
  assert.equal(referenceState(25.001, 25.001), 'exceeds');
  assert.equal(referenceState(0, 25.001), 'uncertain');
  // Both drinks have 7 cubes; only one exceeds the free-sugar reference.
  const milk = calculateSugar({ milk: true, sugarLevel: '70%' });
  const jelly = calculateSugar({ toppings: ['konjac'], sugarLevel: '50%' });
  assert.equal(milk.cubeCount, jelly.cubeCount);
  assert.equal(milk.referenceState, 'within');
  assert.equal(jelly.referenceState, 'exceeds');
  assert.equal(calculateSugar({ toppings: ['pudding'], sugarLevel: '70%' }).referenceState, 'uncertain');
});
test('every supported combination satisfies sugar invariants and cube rounding', () => {
  for (const base of ['', 'Green Tea', 'Black Tea']) for (const milk of [false, true]) {
    for (let mask = 0; mask < 16; mask++) for (const sugarLevel of Object.keys(syrupSugarG)) {
      const toppings = TOPPING_KEYS.filter((_, i) => mask & (1 << i));
      const result = calculateSugar({ base, milk, toppings, sugarLevel });
      assert.ok(result.totalSugarG >= 0);
      assert.ok(result.freeSugarMinG >= 0);
      assert.ok(result.freeSugarMinG <= result.freeSugarMaxG);
      assert.ok(result.freeSugarMaxG <= result.totalSugarG);
      assert.equal(result.cubeCount, Math.max(0, Math.round(result.totalSugarG / 4)));
      assert.ok(result.cubeCount <= 17);
    }
  }
  const maximum = calculateSugar({ milk: true, toppings: TOPPING_KEYS, sugarLevel: '100%' });
  close(maximum.totalSugarG, 68.1);
  close(maximum.freeSugarMinG, 45);
  close(maximum.freeSugarMaxG, 63.3);
  assert.equal(maximum.cubeCount, 17);
});
test('unknown or duplicated inputs cannot introduce negative sugar or double servings', () => {
  const result = calculateSugar({ base: 'invalid', toppings: ['boba', 'boba', 'invalid'], sugarLevel: '-100%' });
  assert.equal(result.totalSugarG, 5.38);
});
