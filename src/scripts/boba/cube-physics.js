export const CUBE_SIZE = 40;
export const SCENE_WIDTH = 300;
export const SCENE_HEIGHT = 500;

// A deterministic settled arrangement for reduced motion and frozen references.
export function settledCubes(count) {
  const columns = 5;
  return Array.from({ length: count }, (_, index) => ({
    position: { x: 50 + (index % columns) * CUBE_SIZE, y: 460 - Math.floor(index / columns) * CUBE_SIZE },
    angle: 0,
  }));
}

export function createCubePhysics(Matter, { reducedMotion = false, random = Math.random } = {}) {
  const { Engine, World, Bodies, Body } = Matter;
  const engine = Engine.create({ enableSleeping: true });
  const cubes = [];
  const boundaries = [
    Bodies.rectangle(SCENE_WIDTH / 2, 490, 600, 20, { isStatic: true }),
    Bodies.rectangle(0, -500, 20, 3000, { isStatic: true }),
    Bodies.rectangle(SCENE_WIDTH, -500, 20, 3000, { isStatic: true }),
  ];
  World.add(engine.world, boundaries);

  function arrange() {
    settledCubes(cubes.length).forEach((pose, index) => {
      const cube = cubes[index];
      Body.setPosition(cube, pose.position);
      Body.setAngle(cube, 0);
      Body.setVelocity(cube, { x: 0, y: 0 });
      Body.setAngularVelocity(cube, 0);
    });
  }

  function setCount(count) {
    const target = Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
    const changed = target !== cubes.length;
    // Only the delta changes. Existing cube objects, positions and velocities survive.
    while (cubes.length > target) World.remove(engine.world, cubes.pop());
    const additional = target - cubes.length;
    for (let index = 0; index < additional; index++) {
      const cube = Bodies.rectangle(40 + random() * 220, -50 - index * 50, CUBE_SIZE, CUBE_SIZE, {
        restitution: 0.9,
        isStatic: reducedMotion,
      });
      World.add(engine.world, cube);
      cubes.push(cube);
    }
    if (reducedMotion) arrange();
    else if (changed) cubes.forEach(cube => Matter.Sleeping.set(cube, false));
  }

  return {
    engine,
    cubes,
    setCount,
    setReducedMotion(value) {
      if (reducedMotion === value) return;
      reducedMotion = value;
      cubes.forEach(cube => Body.setStatic(cube, value));
      if (value) arrange();
    },
    step(delta = 1000 / 60) { if (!reducedMotion) Engine.update(engine, delta); },
    dispose() {
      World.clear(engine.world, false);
      Engine.clear(engine);
      cubes.length = 0;
    },
  };
}
