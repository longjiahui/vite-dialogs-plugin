# Skill Guide — Creating Dialog Components

This guide shows every pattern for building dialog and drawer components that work with `@anfo/vite-dialogs-plugin`. All types and composables are imported directly from the package — no manual `Dialog.vue` setup needed.

---

## Runtime API Reference

Import from `@anfo/vite-dialogs-plugin/runtime`:

| Export                    | Description                                                                       |
| ------------------------- | --------------------------------------------------------------------------------- |
| `useDialogContext<T>()`   | Composable — returns `{ resolve, reject }` inside a dialog component              |
| `createDialogExpose<T>()` | Helper — creates the typed expose object (shorthand for `{} as DialogExposed<T>`) |
| `DialogExposed<T>`        | Marker type — put in `defineExpose<>` to declare the resolve value type           |
| `DialogController<T>`     | `{ resolve: DialogResolve<T>, reject: DialogReject }`                             |
| `DialogSettledResult<T>`  | Union of `DialogResolvedResult<T>` and `DialogRejectedResult`                     |
| `DialogResolvedResult<T>` | `{ type: "resolve" }` or `{ type: "resolve"; value: T }`                          |
| `DialogRejectedResult`    | `{ type: "reject"; reason?: unknown }`                                            |

---

## Pattern 1 — Simple dialog, no return value

The simplest case: open, the user clicks a button, dialog closes.

```vue
<!-- src/dialogs/AlertDialog.vue -->
<script setup lang="ts">
import { useDialogContext } from "@anfo/vite-dialogs-plugin/runtime";

defineProps<{ message: string }>();

const { resolve } = useDialogContext();
</script>

<template>
  <div class="overlay">
    <div class="box">
      <p>{{ message }}</p>
      <button @click="resolve()">OK</button>
    </div>
  </div>
</template>
```

```ts
// Caller
import { dialogs } from "virtual:dialogs";

await dialogs.AlertDialog({ message: "File saved." });
// resolves with { type: "resolve" } — no value
```

---

## Pattern 2 — Dialog that returns a typed value

Use `defineExpose<DialogExposed<T>>` to declare what `resolve()` carries. The generic `T` flows all the way to the caller's return type.

```vue
<!-- src/dialogs/ConfirmDialog.vue -->
<script setup lang="ts">
import {
  useDialogContext,
  createDialogExpose,
  type DialogExposed,
} from "@anfo/vite-dialogs-plugin/runtime";

defineProps<{
  message: string;
  confirmLabel?: string;
}>();

const { resolve } = useDialogContext<boolean>();

// Declare the resolve type — T = boolean
defineExpose<DialogExposed<boolean>>(createDialogExpose<boolean>());
</script>

<template>
  <div class="overlay">
    <div class="box">
      <p>{{ message }}</p>
      <button @click="resolve(true)">{{ confirmLabel ?? "Confirm" }}</button>
      <button @click="resolve(false)">Cancel</button>
    </div>
  </div>
</template>
```

```ts
// Caller — result.value is typed as boolean | undefined
const result = await dialogs.ConfirmDialog({ message: "Delete item?" });
if (result.type === "resolve" && result.value) {
  await deleteItem();
}
```

---

## Pattern 3 — Dialog with reject

Call `reject(reason)` for explicit cancellation that the caller can distinguish from a normal close.

```vue
<!-- src/dialogs/PromptDialog.vue -->
<script setup lang="ts">
import { ref } from "vue";
import {
  useDialogContext,
  createDialogExpose,
  type DialogExposed,
} from "@anfo/vite-dialogs-plugin/runtime";

defineProps<{ label: string }>();

const { resolve, reject } = useDialogContext<string>();
const input = ref("");

defineExpose<DialogExposed<string>>(createDialogExpose<string>());
</script>

<template>
  <div class="overlay">
    <div class="box">
      <label>{{ label }}</label>
      <input v-model="input" @keydown.enter="resolve(input)" />
      <button @click="resolve(input)">OK</button>
      <button @click="reject('cancelled')">Cancel</button>
    </div>
  </div>
</template>
```

```ts
// Caller — chain style
dialogs
  .PromptDialog({ label: "Enter a name" })
  .resolve((name) => console.log("Got:", name))
  .reject((reason) => console.log("Cancelled:", reason));

// Caller — await style
const result = await dialogs.PromptDialog({ label: "Enter a name" });
if (result.type === "resolve") {
  console.log(result.value); // string | undefined
} else {
  console.log(result.reason); // "cancelled"
}
```

---

## Pattern 4 — Drawer

Files ending in `Drawer.vue` are matched by the default pattern and work identically to dialogs.

```vue
<!-- src/dialogs/UserDrawer.vue -->
<script setup lang="ts">
import { useDialogContext } from "@anfo/vite-dialogs-plugin/runtime";

defineProps<{ userId: string }>();
const { resolve } = useDialogContext();
</script>

<template>
  <aside class="drawer">
    <p>User: {{ userId }}</p>
    <button @click="resolve()">Close</button>
  </aside>
</template>
```

```ts
await dialogs.UserDrawer({ userId: "abc123" });
```

---

## Pattern 5 — Complex return object

`T` can be any type — object, union, etc.

```vue
<!-- src/dialogs/DateRangeDialog.vue -->
<script setup lang="ts">
import { ref } from "vue";
import {
  useDialogContext,
  createDialogExpose,
  type DialogExposed,
} from "@anfo/vite-dialogs-plugin/runtime";

type Range = { from: string; to: string };

const { resolve, reject } = useDialogContext<Range>();
const from = ref("");
const to = ref("");

defineExpose<DialogExposed<Range>>(createDialogExpose<Range>());
</script>

<template>
  <div class="overlay">
    <div class="box">
      <input v-model="from" type="date" />
      <input v-model="to" type="date" />
      <button @click="resolve({ from, to })">Apply</button>
      <button @click="reject('cancelled')">Cancel</button>
    </div>
  </div>
</template>
```

```ts
const result = await dialogs.DateRangeDialog({});
if (result.type === "resolve" && result.value) {
  const { from, to } = result.value; // typed as { from: string; to: string }
}
```

---

## Summary

| Task                | How                                                       |
| ------------------- | --------------------------------------------------------- |
| Get resolve/reject  | `const { resolve, reject } = useDialogContext<T>()`       |
| Declare return type | `defineExpose<DialogExposed<T>>(createDialogExpose<T>())` |
| Open from app code  | `import { dialogs } from "virtual:dialogs"`               |
| Await result        | `const result = await dialogs.MyDialog(props)`            |
| Chain callbacks     | `.resolve(cb).reject(cb)`                                 |

The plugin auto-reloads the virtual module and regenerates types whenever you add or remove dialog files — no manual registration needed.
