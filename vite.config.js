
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/whack-a-molee/", // <-- REPLACE with your GitHub repo name
});
