import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';

function resourcePagePlugin() {
    return {
        name: 'resource-page',
        configureServer(server) {
            server.middlewares.use('/resourcePage', (req, res) => {
                const url = decodeURIComponent(req.url.replace(/^\/resourcePage/, '') || '/index.html');
                const roots = [path.resolve(__dirname, 'resourcePage'), path.resolve(__dirname, 'public', 'resourcePage')];
                const filePath = roots.map(root => path.resolve(root, '.' + url)).find(candidate => fs.existsSync(candidate));
                if (!filePath || !fs.existsSync(filePath)) { res.statusCode = 404; res.end('Resource not found'); return; }
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    const indexPath = path.join(filePath, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        res.setHeader('Content-Type', 'text/html');
                        res.setHeader('Cache-Control', 'no-cache');
                        res.end(fs.readFileSync(indexPath));
                        return;
                    }
                }
                if (fs.existsSync(filePath)) {
                    const ext = path.extname(filePath);
                    const mimeTypes = {
                        '.html': 'text/html',
                        '.css': 'text/css',
                        '.js': 'application/javascript',
                        '.json': 'application/json',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.svg': 'image/svg+xml',
                        '.md': 'text/markdown',
                    };
                    res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.end(fs.readFileSync(filePath));
                } else {
                    res.statusCode = 404;
                    res.end('Not Found');
                }
            });
        },
    };
}

export default defineConfig({
    plugins: [vue(), tailwindcss(), resourcePagePlugin()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
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
