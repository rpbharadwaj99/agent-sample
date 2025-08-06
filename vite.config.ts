import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*']
    })
  ],
  build: {
    lib: {
      entry: 'src/copilot-chat.ts',
      name: 'CopilotChat',
      fileName: 'copilot-chat'
    },
    rollupOptions: {
      external: ['lit', '@ag-ui/client'],
      output: {
        globals: {
          lit: 'Lit',
          '@ag-ui/client': 'AgUiClient'
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});