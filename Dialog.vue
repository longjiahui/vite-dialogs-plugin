<script lang="ts">
export {
  type DialogResolve,
  type DialogReject,
  type DialogResolvedResult,
  type DialogRejectedResult,
  type DialogSettledResult,
  type DialogController,
  type DialogExposed,
  dialogControllerKey,
  useDialogContext,
  createDialogExpose,
} from "@anfo/vite-dialogs-plugin/runtime";
</script>

<script setup lang="ts" generic="TResolve = void">
import { inject, provide, watch, onUnmounted, type InjectionKey } from "vue";
import {
  dialogControllerKey,
  dialogResolveKey,
  dialogRejectKey,
  _pushEscHandler,
  _removeEscHandler,
  type DialogController,
  type DialogResolve,
} from "@anfo/vite-dialogs-plugin/runtime";

const dialogController = inject(dialogControllerKey, undefined) as
  | DialogController<TResolve>
  | undefined;

if (dialogController) {
  provide(
    dialogResolveKey as InjectionKey<DialogResolve<TResolve>>,
    dialogController.resolve,
  );
  provide(dialogRejectKey, dialogController.reject);
}

const props = defineProps<{
  modelValue?: boolean;
  width?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

function closeThis() {
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      _pushEscHandler(closeThis);
    } else {
      _removeEscHandler(closeThis);
    }
  },
  { immediate: true },
);

onUnmounted(() => _removeEscHandler(closeThis));

const slots = defineSlots<{
  header?(): unknown;
  default?(): unknown;
  footer?(): unknown;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog" appear>
      <div
        v-if="modelValue"
        class="dialog-overlay"
        @click.self="$emit('update:modelValue', false)"
      >
        <div
          class="dialog-shell"
          role="dialog"
          aria-modal="true"
          :style="width ? { width } : undefined"
        >
          <!-- header slot -->
          <div v-if="slots.header" class="dialog-header">
            <slot name="header" />
          </div>

          <!-- default slot -->
          <div v-if="slots.default" class="dialog-body">
            <slot />
          </div>

          <!-- footer slot -->
          <div v-if="slots.footer" class="dialog-footer">
            <slot name="footer" />
          </div>

          <!-- bottom gradient strip -->
          <div class="dialog-gradient-strip" aria-hidden="true" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ── */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: rgb(15 20 30 / 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* ── Shell ── */
.dialog-shell {
  position: relative;
  width: min(92vw, 28rem);
  overflow: hidden;
  border-radius: var(--radius-lg);

  /* frosted glass card */
  background: rgb(255 255 255 / 0.78);
  backdrop-filter: blur(var(--blur-glass, 20px));
  -webkit-backdrop-filter: blur(var(--blur-glass, 20px));

  /* subtle rainbow edge, matching design system */
  border: 1px solid rgb(255 255 255 / 0.65);
  box-shadow:
    0 0 0 1px rgb(0 104 119 / 0.08),
    var(--shadow-float, 0 30px 80px rgb(0 104 119 / 0.12));
}

/* ── Header ── */
.dialog-header {
  padding: 1.5rem 1.75rem 0;
}

/* ── Body ── */
.dialog-body {
  padding: 1.25rem 1.75rem;
}

/* ── Footer ── */
.dialog-footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.75rem 1.75rem;
}

.dialog-gradient-strip {
  position: absolute;
  z-index: 0;
  left: -0.85rem;
  right: -0.85rem;
  bottom: 0;
  transform: translateY(45%);
  height: 12px;
  pointer-events: none;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgb(34 211 238 / 0) 0%,
    rgb(34 211 238 / 0.22) 18%,
    rgb(138 63 252 / 0.28) 50%,
    rgb(164 48 115 / 0.2) 82%,
    rgb(164 48 115 / 0) 100%
  );
  box-shadow:
    0 -1px 0 rgb(255 255 255 / 0.25) inset,
    0 7px 16px rgb(25 28 30 / 0.14);
  filter: blur(1.2px);
  opacity: 0.9;
  background-size: 220% 100%;
  animation:
    dialog-strip-flow 7.2s linear infinite,
    dialog-strip-pulse 2.8s ease-in-out infinite;
}

.dialog-gradient-strip::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    115deg,
    rgb(255 255 255 / 0) 0%,
    rgb(255 255 255 / 0.3) 45%,
    rgb(255 255 255 / 0) 100%
  );
  transform: translateX(-115%);
  animation: dialog-strip-sheen 4.8s ease-in-out infinite;
}

@keyframes dialog-strip-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 220% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes dialog-strip-pulse {
  0%,
  100% {
    opacity: 0.76;
  }
  50% {
    opacity: 0.98;
  }
}

@keyframes dialog-strip-sheen {
  0% {
    transform: translateX(-115%);
  }
  60%,
  100% {
    transform: translateX(115%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog-gradient-strip,
  .dialog-gradient-strip::after {
    animation: none;
  }
}

/* ── Transition ── */
.dialog-enter-active {
  transition:
    opacity var(--duration-gentle, 240ms)
      var(--ease-crystal, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-gentle, 240ms)
      var(--ease-crystal, cubic-bezier(0.22, 1, 0.36, 1));
}
.dialog-leave-active {
  transition:
    opacity 180ms ease-in,
    transform 180ms ease-in;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
.dialog-enter-from .dialog-shell,
.dialog-leave-to .dialog-shell {
  transform: scale(0.94) translateY(8px);
}
.dialog-enter-to .dialog-shell,
.dialog-leave-from .dialog-shell {
  transform: scale(1) translateY(0);
}
.dialog-shell {
  transition: transform var(--duration-gentle, 240ms)
    var(--ease-crystal, cubic-bezier(0.22, 1, 0.36, 1));
}
.dialog-leave-active .dialog-shell {
  transition: transform 180ms ease-in;
}
</style>
