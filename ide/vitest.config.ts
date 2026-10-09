import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'], environment: 'jsdom', pool: 'threads', maxWorkers: 1, fileParallelism: false } });
