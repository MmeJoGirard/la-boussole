import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5321 },
  // Chemins relatifs : le site fonctionne aussi bien en local que sous
  // https://mmejogirard.github.io/la-boussole/
  base: "./",
});
