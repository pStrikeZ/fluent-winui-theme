import { createContext, useCallback, useContext, useId, useMemo, useRef } from 'react';
import type { PropsWithChildren } from 'react';

import { fluentComponents } from '../../fluent';

const { Spinner, Toast, Toaster, ToastTitle, useToastController } = fluentComponents;

// `OutcomeToasts` announces the outcome of work the app itself started, and is success only: a failure
// carries the server's own words and belongs in a hand-dismissed surface next to what failed.
// `useToast` is the plain notify-with-a-string counterpart for hosts that need every severity (the role
// antd's `message.success/error/...` plays), drawn by the same toaster, so a toast looks the same either way.

const TOAST_DISMISS_MS = 3000;

interface OutcomeHandle {
  succeed: (message: string) => void;
  /** Drops the pending toast. For a failure, which is reported in place. */
  settle: () => void;
}

export interface OutcomeToasts {
  /** Announces work in flight; the toast stays until the handle settles it. */
  start: (pending: string) => OutcomeHandle;
  succeed: (message: string) => void;
}

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  /** Milliseconds before it dismisses itself; -1 keeps it until clicked. */
  timeout?: number;
}

/** Each severity posts a toast and returns a function that dismisses it early. */
export type ToastApi = Record<ToastSeverity, (text: string, options?: ToastOptions) => () => void>;

const OutcomeToastContext = createContext<OutcomeToasts | null>(null);
const ToastApiContext = createContext<ToastApi | null>(null);

// AppShell mounts a provider of its own, so a host that also needs toasts above the shell (in the component that
// renders AppShell) mounts one there as well. The inner one then defers to it: two toasters would stack two
// columns of toasts in the same corner, and a toast raised outside the shell would never meet one raised inside.
export function OutcomeToastProvider({ children }: PropsWithChildren) {
  return useContext(OutcomeToastContext) ? children : <ToasterHost>{children}</ToasterHost>;
}

function ToasterHost({ children }: PropsWithChildren) {
  const toasterId = useId();
  const sequence = useRef(0);
  const { dispatchToast, dismissToast, updateToast } = useToastController(toasterId);

  // Clicking dismisses: Fluent's Toast ships no close button, and waiting out the timeout is the only other exit.
  //
  // A settled toast leaves the media slot unset and carries an intent, which is what makes the appearance layer
  // fill the slot with the InfoBar severity mark. We keep that mark: a surface that dismisses itself in seconds
  // should carry its state without being read.
  const toastFor = useCallback((toastId: string, message: string, pending: boolean) => (
    <Toast className="cursor-pointer" onClick={() => dismissToast(toastId)}>
      <ToastTitle media={pending ? <Spinner size="tiny" /> : undefined}>{message}</ToastTitle>
    </Toast>
  ), [dismissToast]);

  const nextToastId = useCallback(() => `${toasterId}-${sequence.current++}`, [toasterId]);

  const succeed = useCallback((message: string) => {
    const toastId = nextToastId();
    dispatchToast(toastFor(toastId, message, false), { intent: 'success', toastId, timeout: TOAST_DISMISS_MS });
  }, [dispatchToast, nextToastId, toastFor]);

  const start = useCallback((pending: string): OutcomeHandle => {
    const toastId = nextToastId();
    dispatchToast(toastFor(toastId, pending, true), { toastId, timeout: -1 });
    return {
      succeed: message => updateToast({
        content: toastFor(toastId, message, false),
        intent: 'success',
        toastId,
        timeout: TOAST_DISMISS_MS,
      }),
      settle: () => dismissToast(toastId),
    };
  }, [dismissToast, dispatchToast, nextToastId, toastFor, updateToast]);

  const value = useMemo<OutcomeToasts>(() => ({ start, succeed }), [start, succeed]);

  const notify = useCallback((intent: ToastSeverity, text: string, options?: ToastOptions) => {
    const toastId = nextToastId();
    dispatchToast(toastFor(toastId, text, false), { intent, toastId, timeout: options?.timeout ?? TOAST_DISMISS_MS });
    return () => dismissToast(toastId);
  }, [dismissToast, dispatchToast, nextToastId, toastFor]);

  const api = useMemo<ToastApi>(() => ({
    success: (text, options) => notify('success', text, options),
    error: (text, options) => notify('error', text, options),
    warning: (text, options) => notify('warning', text, options),
    info: (text, options) => notify('info', text, options),
  }), [notify]);

  return (
    <OutcomeToastContext.Provider value={value}>
      <ToastApiContext.Provider value={api}>
        <Toaster toasterId={toasterId} position="top-end" />
        {children}
      </ToastApiContext.Provider>
    </OutcomeToastContext.Provider>
  );
}

export const useOutcomeToasts = (): OutcomeToasts => {
  const value = useContext(OutcomeToastContext);
  if (!value) throw new Error('useOutcomeToasts requires an OutcomeToastProvider above it');
  return value;
};

export const useToast = (): ToastApi => {
  const value = useContext(ToastApiContext);
  if (!value) throw new Error('useToast requires an OutcomeToastProvider above it');
  return value;
};
