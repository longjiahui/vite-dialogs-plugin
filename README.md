# @anfo/vite-dialogs-plugin

A Vite plugin that auto-scans a directory for Vue dialog/drawer components and exposes them through a fully type-safe virtual module (`virtual:dialogs`). Dialogs are mounted programmatically into isolated Vue app instances — no `<Teleport>` boilerplate, no global store, automatic cleanup on close.

## Installation

```bash
npm install -D @anfo/vite-dialogs-plugin
```

> `vite` is a peer dependency and must already be present in your project.

## Quick Start

### 1. Register the plugin — `vite.config.ts`

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { dialogsPlugin } from "@anfo/vite-dialogs-plugin";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    vue(),
    dialogsPlugin({
      dir: resolve(__dirname, "src/dialogs"), // folder that contains your dialog components
    }),
  ],
});
```

### 2. Include the generated declaration — `tsconfig.json`

The plugin writes `src/dialogs.d.ts` automatically on every build/dev-server start.

```json
{
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"]
}
```

### 3. Create a dialog component

Every `.vue` file whose name ends with `Dialog.vue` or `Drawer.vue` inside your `dir` becomes a key on the `dialogs` object. Import your runtime helpers directly from the package — no manual `Dialog.vue` setup required.

```vue
<!-- src/dialogs/ConfirmDialog.vue -->
<script setup lang="ts">
import {
  useDialogContext,
  createDialogExpose,
  type DialogExposed,
} from "@anfo/vite-dialogs-plugin/runtime";

defineProps<{ message: string }>();

const { resolve, reject } = useDialogContext<boolean>();

defineExpose<DialogExposed<boolean>>(createDialogExpose<boolean>());
</script>

<template>
  <div class="overlay">
    <div class="box">
      <p>{{ message }}</p>
      <button @click="resolve(true)">Confirm</button>
      <button @click="resolve(false)">Cancel</button>
    </div>
  </div>
</template>
```

### 4. Open dialogs from anywhere

```ts
import { dialogs } from "virtual:dialogs";

// Await the result
const result = await dialogs.ConfirmDialog({ message: "Delete this item?" });
if (result.type === "resolve" && result.value) {
  // confirmed
}

// Or chain callbacks
dialogs
  .ConfirmDialog({ message: "Are you sure?" })
  .resolve((value) => console.log("resolved:", value))
  .reject((reason) => console.log("rejected:", reason));
```

## Plugin Options

| Option | Type | Default | Description |
|---|---|---|---|
| `dir` | `string` | — | **Required.** Absolute path to the dialogs directory. |
| `pattern` | `RegExp` | `/(Dialog\|Drawer)\.vue$/` | RegExp to identify which files are dialogs. |
| `dts` | `string` | `"src/dialogs.d.ts"` | Root-relative path for the generated declaration file. |

## Package Exports

| Specifier | Contents |
|---|---|
| `@anfo/vite-dialogs-plugin` | Vite plugin factory — `dialogsPlugin(options)` |
| `@anfo/vite-dialogs-plugin/runtime` | Types, `useDialogContext`, `createDialogExpose`, `DialogExposed` |

## Project Structure

```
src/
├── dialogs.d.ts          ← Auto-generated — do not edit
└── dialogs/
    ├── ConfirmDialog.vue
    ├── AlertDialog.vue
    └── UserDrawer.vue
```

## How It Works

1. On build start (and on file add/remove in dev), the plugin scans `dir` for matching `.vue` files.
2. It generates a virtual module (`virtual:dialogs`) that imports each component and wraps it in `mountDialog()`.
3. `mountDialog()` creates an isolated `createApp()` instance per call, provides a `DialogController` via injection, mounts it into a temporary `<div>`, and returns a Promise-based handle.
4. When the component calls `resolve(value)` or `reject(reason)`, the app is unmounted and the host element removed automatically.
5. A `.d.ts` file is written so every `dialogs.*` entry is typed end-to-end — props, return value, and callbacks.

> See [SKILL.md](SKILL.md) for step-by-step examples covering all dialog patterns.

## License

MIT
