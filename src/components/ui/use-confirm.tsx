import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { ConfirmDialog } from './confirm-dialog';

export interface ConfirmOptions {
  actionLabel: string;
  cancelLabel?: string;
  intent?: 'danger' | 'primary';
  message: string;
  /**
   * Work the confirm button starts. The dialog stays open with its buttons held
   * until it settles: a resolve closes it and `confirm()` yields true, a
   * rejection leaves it open with the reason inside, for a retry or a cancel.
   */
  onConfirm?: () => void | Promise<void>;
  title: string;
}

export type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

interface Request {
  id: number;
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

const ConfirmContext = createContext<ConfirmFunction | null>(null);

const errorText = (error: unknown): string => error instanceof Error ? error.message : String(error);

// One ConfirmDialog serves every call, so each looks like the declarative one.
// Calls queue: the head is shown, and the next takes the surface only once the
// head has finished animating out (DialogShell's `onExited`), since a dialog
// cannot play an exit on a request that has already been replaced.
export function ConfirmDialogProvider({ children }: PropsWithChildren) {
  const nextId = useRef(0);
  const [queue, setQueue] = useState<Request[]>([]);
  // False only while the head is leaving.
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const head = queue[0];

  const confirm = useCallback<ConfirmFunction>(options => new Promise<boolean>(resolve => {
    setQueue(current => [...current, { id: nextId.current++, options, resolve }]);
  }), []);

  const finish = (confirmed: boolean) => {
    if (!open) return;
    head?.resolve(confirmed);
    setOpen(false);
  };

  const accept = async () => {
    if (!head) return;
    const { onConfirm } = head.options;
    if (!onConfirm) {
      finish(true);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onConfirm();
      setBusy(false);
      finish(true);
    } catch (caught) {
      setBusy(false);
      setError(errorText(caught));
    }
  };

  const advance = () => {
    setQueue(current => current.slice(1));
    setError(null);
    setOpen(true);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {head && (
        <ConfirmDialog
          actionIntent={head.options.intent}
          actionLabel={head.options.actionLabel}
          busy={busy}
          cancelLabel={head.options.cancelLabel}
          error={error}
          key={head.id}
          message={head.options.message}
          onConfirm={() => { void accept(); }}
          onDismissError={() => setError(null)}
          onExited={advance}
          onOpenChange={next => { if (!next) finish(false); }}
          open={open}
          title={head.options.title}
        />
      )}
    </ConfirmContext.Provider>
  );
}

/** `const ok = await confirm({ title, message, actionLabel })`; resolves false on cancel or dismiss. */
export const useConfirm = (): ConfirmFunction => {
  const value = useContext(ConfirmContext);
  if (!value) throw new Error('useConfirm requires a ConfirmDialogProvider above it');
  return value;
};
