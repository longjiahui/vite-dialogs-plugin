import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["dialogs-plugin.ts", "runtime.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["vue", "vite"],
  //   shims: true,
});
