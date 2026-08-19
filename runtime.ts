import { inject, type App, type InjectionKey, type Plugin } from "vue";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DialogResolve<T = void> = [T] extends [void] ? () => void
    : (value: T) => void;

export type DialogReject = (reason?: unknown) => void;

export type DialogResolvedResult<T = void> = [T] extends [void]
    ? { type: "resolve" }
    : { type: "resolve"; value: T };

export type DialogRejectedResult = {
    type: "reject";
    reason?: unknown;
};

export type DialogSettledResult<T = void> =
    | DialogResolvedResult<T>
    | DialogRejectedResult;

export type DialogController<T = void> = {
    resolve: DialogResolve<T>;
    reject: DialogReject;
};

export type DialogExposed<T = void> = {
    __dialogResult?: T;
};

// ── Injection keys ────────────────────────────────────────────────────────────

export const dialogControllerKey = Symbol("dialogController") as InjectionKey<
    DialogController<unknown>
>;

export type DialogAppPlugin = Plugin;

let dialogAppPlugins: DialogAppPlugin[] = [];

export function configureDialogs(options: {
    use?: DialogAppPlugin | DialogAppPlugin[];
} = {}): void {
    const use = options.use;
    dialogAppPlugins = use
        ? (Array.isArray(use) ? use.flat() : [use]).filter(
              Boolean,
          ) as DialogAppPlugin[]
        : [];
}

export function applyDialogAppPlugins(app: App<Element>): void {
    for (const plugin of dialogAppPlugins) app.use(plugin);
}

// ── Composables ───────────────────────────────────────────────────────────────

export function useDialogContext<T = void>(): {
    resolve: DialogResolve<T>;
    reject: DialogReject;
} {
    const controller = inject(dialogControllerKey, undefined) as
        | DialogController<T>
        | undefined;

    if (!controller) {
        throw new Error("useDialogContext must be used inside mountDialog().");
    }

    return {
        resolve: controller.resolve,
        reject: controller.reject,
    };
}

export function createDialogExpose<T = void>(): DialogExposed<T> {
    return {} as DialogExposed<T>;
}
