import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*_test.{ts,tsx}'],
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
  },
});
