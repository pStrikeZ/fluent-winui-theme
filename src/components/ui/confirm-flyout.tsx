import type { PopoverProps } from '@fluentui/react-components';
import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';

import { useDangerFillClass } from './confirm-dialog';
import { OutcomeMessageBar } from './outcome-message-bar';
import { fluentComponents } from '../../fluent';
import { useTranslation } from '../../i18n/translation';

const { Button, Popover, PopoverSurface, PopoverTrigger, Spinner, Text, mergeClasses } = fluentComponents;

const errorText = (error: unknown): string => error instanceof Error ? error.message : String(error);

// The "Button with Flyout" confirmation of the WinUI Gallery: a message and one
// button in a FlyoutPresenter hung off the button that asked, with no title bar,
// no scrim and no Cancel. Light dismiss (a click outside, Escape) is the way to
// decline, so `cancelLabel` is opt-in. The surface itself is restyled toward
// FlyoutPresenter by ../../winui/controls/popover.css.ts.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/FlyoutPresenter_themeresources.xaml#L20
//
// While `onConfirm` is pending the flyout cannot be light-dismissed, as a
// ContentDialog's buttons are held: the work it names is already under way. A
// rejection leaves it open with the reason in place of closing over it.
export function ConfirmFlyout({
  cancelLabel,
  children,
  confirmLabel,
  disabled = false,
  intent = 'danger',
  message,
  onConfirm,
  positioning,
  title,
}: {
  cancelLabel?: string;
  /** The element that opens the flyout; it receives the press handler. */
  children: ReactElement;
  confirmLabel: string;
  disabled?: boolean;
  intent?: 'danger' | 'primary';
  message: string;
  onConfirm: () => void | Promise<void>;
  positioning?: PopoverProps['positioning'];
  title?: string;
}) {
  const { t } = useTranslation();
  const dangerFill = useDangerFillClass();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeOpen = useCallback((next: boolean) => {
    if (busy || (next && disabled)) return;
    setError(null);
    setOpen(next);
  }, [busy, disabled]);

  const confirm = async () => {
    setError(null);
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover
      onOpenChange={(_, data) => changeOpen(data.open)}
      open={open && !disabled}
      positioning={positioning}
      trapFocus
    >
      <PopoverTrigger disableButtonEnhancement>{children}</PopoverTrigger>
      <PopoverSurface aria-label={title}>
        <div className="grid gap-3 min-w-0 max-w-[min(320px,calc(100vw-48px))]">
          {title && <Text weight="semibold">{title}</Text>}
          <Text>{message}</Text>
          {error && <OutcomeMessageBar onDismiss={() => setError(null)}>{error}</OutcomeMessageBar>}
          <div className="flex flex-wrap gap-2">
            <Button
              appearance="primary"
              className={mergeClasses('!whitespace-nowrap', intent === 'danger' && dangerFill)}
              disabledFocusable={busy}
              icon={busy ? <Spinner size="tiny" /> : undefined}
              onClick={() => { void confirm(); }}
            >
              {confirmLabel}
            </Button>
            {cancelLabel !== undefined && (
              <Button className="!whitespace-nowrap" disabled={busy} onClick={() => changeOpen(false)}>
                {cancelLabel || t('common.cancel')}
              </Button>
            )}
          </div>
        </div>
      </PopoverSurface>
    </Popover>
  );
}
