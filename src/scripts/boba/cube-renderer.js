import { createCubePhysics, settledCubes, CUBE_SIZE, SCENE_WIDTH, SCENE_HEIGHT } from './cube-physics.js';

function drawScene(p, cubes) {
  p.clear();
  p.noLights();
  p.ambientLight(300);
  p.directionalLight(255, 255, 255, -1, -1, -1);
  p.push();
  p.translate(0, SCENE_HEIGHT / 2 - 10, 0);
  p.rotateX(p.HALF_PI);
  p.fill(150);
  p.noStroke();
  p.rectMode(p.CENTER);
  p.rect(0, 0, SCENE_WIDTH, 10);
  p.pop();
  for (const cube of cubes) {
    p.push();
    p.translate(cube.position.x - SCENE_WIDTH / 2, cube.position.y - SCENE_HEIGHT / 2, 0);
    p.rotateX(cube.angle);
    p.rotateZ(cube.angle);
    p.fill(255);
    p.box(CUBE_SIZE);
    p.pop();
  }
}

// p5 instance mode keeps setup/draw and physics state out of the global scope.
export function createCubeRenderer(P5, Matter, container) {
  return new Promise((resolve, reject) => {
    let instance;
    try {
      instance = new P5(p => {
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const physics = createCubePhysics(Matter, { reducedMotion: motion.matches });
        let observer;
        let visible = false;
        let disposed = false;
        let accumulator = 0;

        const wake = () => {
          if (disposed) return;
          accumulator = 0;
          p.noLoop();
          p.redraw();
          if (visible && !document.hidden && !motion.matches && physics.cubes.length) p.loop();
        };
        const motionChanged = () => { physics.setReducedMotion(motion.matches); wake(); };
        const visibilityChanged = () => wake();

        p.setup = () => {
          try {
            p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
            p.createCanvas(SCENE_WIDTH, SCENE_HEIGHT, p.WEBGL);
            p.noLoop();
            p.canvas.setAttribute('aria-hidden', 'true');
            // Keep a stable physics coordinate system. CSS scales the canvas with
            // its container, so resizing never recreates bodies or their world.
            observer = new IntersectionObserver(entries => {
              visible = entries[0].isIntersecting;
              wake();
            });
            observer.observe(container);
            motion.addEventListener('change', motionChanged);
            document.addEventListener('visibilitychange', visibilityChanged);
            resolve({
              setCount(count) { physics.setCount(count); wake(); },
              snapshot(count) {
                // Reuse the active WebGL context synchronously and restore it
                // before the next browser paint. No second canvas or engine.
                // A settled arrangement includes all cubes even if the active
                // drink is still falling when comparison is started.
                try {
                  drawScene(p, settledCubes(count));
                  return p.canvas.toDataURL('image/png');
                } finally {
                  drawScene(p, physics.cubes);
                }
              },
              dispose() {
                disposed = true;
                observer.disconnect();
                motion.removeEventListener('change', motionChanged);
                document.removeEventListener('visibilitychange', visibilityChanged);
                physics.dispose();
                p.remove();
              },
            });
          } catch (error) {
            observer?.disconnect();
            physics.dispose();
            p.remove();
            reject(error);
          }
        };
        p.draw = () => {
          if (!motion.matches && visible && !document.hidden) {
            accumulator += Math.min(p.deltaTime || 1000 / 60, 50);
            while (accumulator >= 1000 / 60) {
              physics.step();
              accumulator -= 1000 / 60;
            }
          }
          drawScene(p, physics.cubes);
          if (physics.cubes.length && physics.cubes.every(cube => cube.isSleeping)) p.noLoop();
        };
      }, container);
    } catch (error) {
      instance?.remove();
      reject(error);
    }
  });
}
