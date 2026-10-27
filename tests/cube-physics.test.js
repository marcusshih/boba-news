import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { createCubePhysics, settledCubes } from '../src/scripts/boba/cube-physics.js';

const allBodies = simulation => Matter.Composite.allBodies(simulation.engine.world);

test('increases add only the delta and decreases remove excess bodies', () => {
  const simulation = createCubePhysics(Matter, { random: () => 0.5 });
  simulation.setCount(5);
  simulation.step();
  const original = simulation.cubes.slice();
  const positions = original.map(cube => ({ ...cube.position }));
  simulation.setCount(8);
  assert.deepEqual(simulation.cubes.slice(0, 5), original);
  assert.deepEqual(simulation.cubes.slice(0, 5).map(cube => cube.position), positions);
  assert.ok(simulation.cubes.slice(5).every(cube => cube.position.y < 0));
  assert.equal(allBodies(simulation).length, 11);
  const removed = simulation.cubes.slice(3);
  simulation.setCount(3);
  assert.deepEqual(simulation.cubes, original.slice(0, 3));
  assert.equal(allBodies(simulation).length, 6);
  assert.ok(removed.every(cube => !allBodies(simulation).includes(cube)));
  simulation.dispose();
  assert.equal(allBodies(simulation).length, 0);
});
test('same count retains bodies and positions, including during rapid input changes', () => {
  const simulation = createCubePhysics(Matter);
  for (let i = 0; i < 300; i++) {
    const count = (i * 7) % 18;
    simulation.setCount(count);
    assert.equal(simulation.cubes.length, count);
    assert.equal(allBodies(simulation).length, count + 3);
    assert.equal(new Set(allBodies(simulation).map(cube => cube.id)).size, count + 3);
    simulation.step();
  }
  const before = simulation.cubes.slice();
  const positions = before.map(cube => ({ ...cube.position }));
  simulation.setCount(before.length);
  assert.deepEqual(simulation.cubes, before);
  assert.deepEqual(simulation.cubes.map(cube => cube.position), positions);
  simulation.setCount(-2);
  assert.equal(simulation.cubes.length, 0);
  simulation.dispose();
});
test('maximum 17-cube stack remains finite and inside the world after settling', () => {
  // Repeatable pseudo-random spawn positions; actual Matter collisions and steps.
  let seed = 42;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const simulation = createCubePhysics(Matter, { random });
  simulation.setCount(17);
  for (let frame = 0; frame < 3600; frame++) simulation.step();
  assert.equal(simulation.cubes.length, 17);
  assert.equal(allBodies(simulation).length, 20);
  for (const cube of simulation.cubes) {
    assert.ok(Number.isFinite(cube.position.x) && Number.isFinite(cube.position.y));
    assert.ok(cube.position.x >= 20 && cube.position.x <= 280);
    assert.ok(cube.position.y > 0 && cube.position.y < 490);
  }
  simulation.dispose();
});
test('reduced motion presents every cube without animation and can switch live', () => {
  const simulation = createCubePhysics(Matter, { reducedMotion: true });
  simulation.setCount(17);
  assert.deepEqual(simulation.cubes.map(cube => ({ position: cube.position, angle: cube.angle })), settledCubes(17));
  const positions = simulation.cubes.map(cube => ({ ...cube.position }));
  for (let frame = 0; frame < 120; frame++) simulation.step();
  assert.deepEqual(simulation.cubes.map(cube => cube.position), positions);
  assert.ok(simulation.cubes.every(cube => cube.isStatic));
  simulation.setReducedMotion(true);
  simulation.setReducedMotion(false);
  assert.ok(simulation.cubes.every(cube => !cube.isStatic && Number.isFinite(cube.mass)));
  simulation.setCount(10);
  simulation.setReducedMotion(true);
  simulation.setCount(2);
  assert.deepEqual(simulation.cubes.map(cube => ({ position: cube.position, angle: cube.angle })), settledCubes(2));
  assert.equal(allBodies(simulation).length, 5);
  simulation.dispose();
});
