import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environmentMatchGlobs: [
            ['src/**/*.test.tsx', 'jsdom'],
            ['src/**/*.test.ts', 'jsdom'],
            ['electron/**/*.test.ts', 'node'],
        ],
        setupFiles: ['./src/tests/setup.ts'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
