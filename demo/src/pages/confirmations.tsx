import { DeleteRegular } from '@fluentui/react-icons';
import {
  ConfirmFlyout,
  fluentComponents,
  Panel,
  SectionHeader,
  useConfirm,
  useToast,
} from '@pstrikez/fluent-winui-theme';

const { Button, Text } = fluentComponents;

const wait = (ms: number) => new Promise<void>(resolve => { setTimeout(resolve, ms); });

// ConfirmFlyout, useConfirm() and useToast(): the antd Popconfirm, Modal.confirm and message.* replacements.
export function ConfirmationsDemo() {
  const confirm = useConfirm();
  const toast = useToast();
  return (
    <section className="grid gap-2">
      <SectionHeader level={2} title="Confirmations and toasts" description="ConfirmFlyout, useConfirm() and useToast()." />
      <Panel>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ConfirmFlyout
            confirmLabel="Yes, empty my cart"
            message="All items will be removed from your cart."
            onConfirm={() => { toast.success('Cart emptied'); }}
          >
            <Button>Flyout, confirm only</Button>
          </ConfirmFlyout>
          <ConfirmFlyout
            cancelLabel="Cancel"
            confirmLabel="Delete"
            message="This cannot be undone."
            onConfirm={async () => { await wait(1200); toast.success('Deleted'); }}
            title="Delete this key?"
          >
            <Button icon={<DeleteRegular />}>Async, danger</Button>
          </ConfirmFlyout>
          <ConfirmFlyout
            confirmLabel="Retry"
            intent="primary"
            message="The request fails, so the flyout stays open with the reason."
            onConfirm={async () => { await wait(600); throw new Error('Server refused the request.'); }}
          >
            <Button>Async, rejects</Button>
          </ConfirmFlyout>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button onClick={async () => {
            const ok = await confirm({ actionLabel: 'Delete', message: 'Clients using it stop working immediately.', title: 'Delete API key' });
            toast.info(ok ? 'Confirmed' : 'Cancelled');
          }}>confirm()</Button>
          <Button onClick={() => {
            void confirm({
              actionLabel: 'Save',
              intent: 'primary',
              message: 'Saving takes a moment; the dialog stays busy meanwhile.',
              onConfirm: async () => { await wait(1200); toast.success('Saved'); },
              title: 'Save changes',
            });
          }}>confirm() with onConfirm</Button>
          <Button onClick={() => {
            void confirm({
              actionLabel: 'Try again',
              message: 'The work rejects, so the error shows inside the dialog.',
              onConfirm: async () => { await wait(600); throw new Error('Upstream returned 502.'); },
              title: 'Rejecting action',
            });
          }}>confirm() that rejects</Button>
          <Button onClick={() => {
            void confirm({ actionLabel: 'OK', message: 'First of two queued dialogs.', title: 'One' });
            void confirm({ actionLabel: 'OK', message: 'Second, shown after the first closes.', title: 'Two' });
          }}>Queue two</Button>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Text>useToast():</Text>
          <Button onClick={() => toast.success('Saved')}>success</Button>
          <Button onClick={() => toast.error('Could not reach the server')}>error</Button>
          <Button onClick={() => toast.warning('Quota almost used up')}>warning</Button>
          <Button onClick={() => toast.info('A new version is available')}>info</Button>
        </div>
      </Panel>
    </section>
  );
}
