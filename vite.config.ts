
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Helper to get __dirname in ES module, making paths more reliable for build servers.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // FIX: Replaced process.cwd() with __dirname to avoid a TypeScript type error with the 'process' global in some environments.
    const env = loadEnv(mode, __dirname, '');
    return {
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          // Define the manifest here to let the plugin generate and manage it
          manifest: {
            name: "SakoonApp",
            short_name: "SakoonApp",
            description: "SakoonApp - मन हल्का करने के लिए आपका अपना साथी। दिल खोलकर अपनी बातें साझा करें और पाएं एक ऐसा दोस्त जो आपको समझे और सुने।",
            start_url: "/",
            scope: "/",
            display: "standalone",
            background_color: "#f1f5f9",
            theme_color: "#0891B2",
            icons: [
              {
                src: 'https://listenerimages.netlify.app/images/listener8.webp',
                sizes: '192x192',
                type: 'image/webp',
                purpose: 'any',
              },
              {
                src: 'https://listenerimages.netlify.app/images/listener8.webp',
                sizes: '512x512',
                type: 'image/webp',
                purpose: 'any',
              },
              {
                src: 'https://listenerimages.netlify.app/images/listener8.webp',
                sizes: '512x512',
                type: 'image/webp',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            importScripts: ['firebase-messaging-sw.js'],
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // FIX: Switched from '.' to a reliable __dirname to resolve paths correctly in different build environments.
          '@': path.resolve(__dirname),
        }
      },
    };
});