import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3003,
        strictPort: true,
        cors: true,
        allowedHosts: true,
        proxy: {
            '/api': {
                target: 'http://192.168.29.108:5050',
                changeOrigin: true,
                secure: false,
                ws: true,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('Sending Request to the Target:', req.method, req.url);
                    });
                    proxy.on('proxyRes', (proxyRes, req, res) => {
                        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
                    });
                },
            },
        },
    },
    preview: {
        host: '0.0.0.0',
        port: 3003,
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/tests/setupTests.js'],
        globals: true,
        css: true,
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/tests/',
                'src/main.jsx'
            ]
        }
    }
})