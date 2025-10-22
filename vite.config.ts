import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		proxy: {
			'/api': {
				target: process.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/api/, ''),
				configure: (proxy, _options) => {
					proxy.on('error', (err, _req, _res) => {
						console.log('proxy error', err);
					});
					proxy.on('proxyReq', (_proxyReq, req, _res) => {
						console.log('Sending Request to the Target:', req.method, req.url);
					});
					proxy.on('proxyRes', (proxyRes, req, _res) => {
						console.log(
							'Received Response from the Target:',
							proxyRes.statusCode,
							req.url,
						);
					});
				},
			},
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// Core React libraries
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					// UI libraries
					'ui-vendor': ['lucide-react', 'react-toastify'],
					// Other vendor libraries
					vendor: [
						'axios',
						'@tanstack/react-query',
						'js-cookie',
						'jspdf',
						'jspdf-autotable',
					],
				},
			},
		},
		chunkSizeWarningLimit: 500,
		target: 'es2020',
		minify: 'esbuild',
		sourcemap: false,
	},
});
