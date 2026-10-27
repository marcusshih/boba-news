// @ts-check
import { defineConfig } from 'astro/config';

const isDevTest = process.env.BOBA_TEST_SERVER === 'dev';

// https://astro.build/config
export default defineConfig({
  vite: {
    // A concurrent browser test must not invalidate an open dev server's cache.
    ...(isDevTest ? { cacheDir: 'node_modules/.vite-boba-test' } : {}),
    // Discover these CommonJS libraries before the customizer's lazy imports.
    // This avoids re-optimizing their module URLs during the first page load.
    optimizeDeps: { include: ['p5', 'matter-js'], force: isDevTest },
  },
});
