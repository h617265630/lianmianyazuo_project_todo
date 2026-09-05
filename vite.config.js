import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            // pragmatic-drag-and-drop ships ESM root as empty stub;
            // point to the CJS bundle that actually exports the API
            '@atlaskit/pragmatic-drag-and-drop': path.resolve(
                __dirname,
                './node_modules/@atlaskit/pragmatic-drag-and-drop/dist/cjs/adapter/element-adapter.js',
            ),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});
