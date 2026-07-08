import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";

const DOMAIN = "ddmpzt.slsblx.com";
const PORT = 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    host: DOMAIN,
    port: PORT,
    strictPort: true,
    https: {
      key: fs.readFileSync(".cert/dev-key.pem"),
      cert: fs.readFileSync(".cert/dev-cert.pem"),
    },
    allowedHosts: [DOMAIN],
  },
});