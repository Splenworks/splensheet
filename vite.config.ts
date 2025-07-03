import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { CommitHashPlugin } from "vite-plugin-commit-hash"
import { VitePWA } from "vite-plugin-pwa"
import svgr from "vite-plugin-svgr"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    CommitHashPlugin({ noPrefix: false, noVirtual: false }),
    VitePWA({ registerType: "autoUpdate" }),
  ],
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
})
