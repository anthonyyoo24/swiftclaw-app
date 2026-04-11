import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        projects: [
            {
                extends: true,
                test: {
                    name: 'web',
                    environment: 'jsdom',
                    include: ['src/**/*.test.{ts,tsx}'],
                    setupFiles: ['./src/tests/setup.ts'],
                },
                resolve: {
                    alias: {
                        '@convex': path.resolve(__dirname, './convex'),
                        '@': path.resolve(__dirname, './src'),
                    },
                },
            },
            {
                extends: true,
                test: {
                    name: 'electron',
                    environment: 'node',
                    include: ['electron/**/*.test.ts'],
                },
                resolve: {
                    alias: {
                        '@convex': path.resolve(__dirname, './convex'),
                        '@': path.resolve(__dirname, './src'),
                    },
                },
            },
            {
                extends: true,
                test: {
                    name: 'convex',
                    environment: 'edge-runtime',
                    include: ['convex/**/*.test.ts'],
                },
            },
        ],
    },
});
