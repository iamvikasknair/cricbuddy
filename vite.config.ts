import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      external: [
        '@tensorflow/tfjs-core',
        '@tensorflow/tfjs-backend-webgl',
        '@tensorflow-models/pose-detection',
        '@mediapipe/pose',
      ],
      output: {
        globals: {
          '@tensorflow/tfjs-core': 'tf',
          '@tensorflow/tfjs-backend-webgl': 'tf',
          '@tensorflow-models/pose-detection': 'poseDetection',
          '@mediapipe/pose': 'Pose',
        },
      },
    },
  },
})
