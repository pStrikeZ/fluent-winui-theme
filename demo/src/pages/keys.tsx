import {
  ArrowClockwiseRegular,
  DeleteRegular,
  EditRegular,
  KeyMultipleRegular,
} from '@fluentui/react-icons';
import {
  BackNavigationButton,
  ConfirmDialog,
  copyOutcomeIcon,
  DashboardPageHeader,
  DialogShell,
  fluentComponents,
  OutcomeMessageBar,
  ResourceListActions,
  ResourceListEmptyState,
  ResourceListPanel,
  RowTitleButton,
  ScrollArea,
  SecretInput,
  StatusBadge,
  TABLE_ACTIONS_WIDTH,
  TableActions,
  TableColumns,
  TableTrailingCell,
  TableTrailingHeader,
  TooltipIconButton,
  TruncationTooltip,
  useCopyLabel,
  useCopyToClipboard,
  useDialogInvocation,
  useDiscardGuard,
  useOutcomeToasts,
} from '@pstrikez/fluent-winui-theme';
import { useCallback, useState } from 'react';

import { DEMO_KEYS } from '../data';
import type { DemoKey } from '../data';
import { useDemoRouter } from '../router';

const {
  Button, DialogActions, DialogTitle, Field, Input, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Table, TableBody, TableCell,
  TableCellLayout, TableHeader, TableHeaderCell, TableRow, Text,
} = fluentComponents;

function KeyEditor({ draft, onClose, open }: { draft: DemoKey | null; onClose: () => void; open: boolean }) {
  const toasts = useOutcomeToasts();
  const [name, setName] = useState(draft?.name ?? '');
  const [secret, setSecret] = useState('sk-flw-••••••••••••••••');
  const { discardConfirmation, requestClose } = useDiscardGuard({ onClose, values: { name, secret } });
  return (
    <>
      {discardConfirmation}
      <DialogShell
        actions={<DialogActions>
          <Button onClick={requestClose}>Cancel</Button>
          <Button appearance="primary" disabled={name.trim() === ''} type="submit">Save</Button>
        </DialogActions>}
        onOpenChange={(_, data) => { if (!data.open) requestClose(); }}
        onSubmit={() => { toasts.succeed(`Saved ${name}`); onClose(); }}
        open={open}
        title={<DialogTitle>{draft ? 'Edit API key' : 'Create API key'}</DialogTitle>}
      >
        <Field label="Name" required>
          <Input autoFocus onChange={(_, data) => setName(data.value)} value={name} />
        </Field>
        <Field hint="Shown once. SecretInput masks the value until revealed." label="Secret">
          <SecretInput onChange={(_, data) => setSecret(data.value)} value={secret} />
        </Field>
        <OutcomeMessageBar intent="info">Edit a field, then press Cancel to see the discard guard.</OutcomeMessageBar>
      </DialogShell>
    </>
  );
}

export function KeysPage() {
  const toasts = useOutcomeToasts();
  const router = useDemoRouter();
  const clipboard = useCopyToClipboard();
  const copyLabel = useCopyLabel();
  const [keys, setKeys] = useState<DemoKey[]>(DEMO_KEYS);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const editor = useDialogInvocation<DemoKey | null>();
  const remove = useDialogInvocation<DemoKey>();

  const refresh = useCallback(() => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 900);
  }, []);

  const confirmDelete = (key: DemoKey) => {
    setBusy(true);
    const handle = toasts.start(`Deleting ${key.name}...`);
    window.setTimeout(() => {
      setBusy(false);
      if (key.id === 'k4') {
        handle.settle();
        setDeleteError('The upstream rejected the request: key is pinned by an active session.');
        return;
      }
      setKeys(current => current.filter(candidate => candidate.id !== key.id));
      handle.succeed(`Deleted ${key.name}`);
      remove.close();
    }, 900);
  };

  return (
    <div className="grid gap-[var(--fwt-page-inset)]">
      <div><BackNavigationButton onClick={() => router.go('overview')}>Overview</BackNavigationButton></div>
      <DashboardPageHeader
        actions={<ResourceListActions
          createLabel="Create key"
          onCreate={() => editor.open(null)}
          onRefresh={refresh}
          refreshLabel="Refresh"
          refreshing={refreshing}
        />}
        description="Keys authenticate clients against the gateway. Select Retired key and delete it to see a failed confirmation."
        title="API keys"
      />
      <ResourceListPanel>
        {keys.length === 0
          ? <ResourceListEmptyState>No API keys yet. Create one to get started.</ResourceListEmptyState>
          : <ScrollArea axes="horizontal" className="min-w-0">
            <Table aria-label="API keys" style={{ minWidth: 860 }}>
              <TableColumns widths={[null, '260px', '150px', '140px', '120px', TABLE_ACTIONS_WIDTH]} />
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Key</TableHeaderCell>
                  <TableHeaderCell>Upstreams</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell>Last used</TableHeaderCell>
                  <TableTrailingHeader>Actions</TableTrailingHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map(key => {
                  const tag = `key-${key.id}`;
                  return (
                    <TableRow key={key.id}>
                      <TableCell className="overflow-hidden">
                        <TruncationTooltip content={key.name} relationship="label">
                          {measureRef => <RowTitleButton onClick={() => editor.open(key)} ref={measureRef}>{key.name}</RowTitleButton>}
                        </TruncationTooltip>
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        <span className="flex items-center gap-1 min-w-0">
                          <TruncationTooltip content={key.key} relationship="label">
                            {measureRef => <code className="winui-focus-rect flex-none truncate" ref={measureRef} style={{ width: 144 }} tabIndex={0}>{key.key}</code>}
                          </TruncationTooltip>
                          <TooltipIconButton
                            icon={copyOutcomeIcon(clipboard.outcomeFor(tag))}
                            label={copyLabel(clipboard.outcomeFor(tag), 'Copy key')}
                            onClick={() => clipboard.copy(key.key, tag)}
                          />
                        </span>
                      </TableCell>
                      <TableCell className="overflow-hidden"><TableCellLayout truncate>{key.upstreams}</TableCellLayout></TableCell>
                      <TableCell>{key.created}</TableCell>
                      <TableCell>{key.lastUsed ?? <StatusBadge tone="neutral">Never</StatusBadge>}</TableCell>
                      <TableTrailingCell>
                        <TableActions>
                          <TooltipIconButton icon={<EditRegular />} label={`Edit ${key.name}`} onClick={() => editor.open(key)} />
                          <TooltipIconButton icon={<ArrowClockwiseRegular />} label={`Rotate ${key.name}`} onClick={() => toasts.succeed(`Rotated ${key.name}`)} />
                          <TooltipIconButton danger icon={<DeleteRegular />} label={`Delete ${key.name}`} onClick={() => remove.open(key)} />
                        </TableActions>
                      </TableTrailingCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>}
      </ResourceListPanel>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
        <KeyMultipleRegular />
        <Text size={200}>{keys.length} keys</Text>
        <Button appearance="subtle" onClick={() => setKeys(keys.length === 0 ? DEMO_KEYS : [])} size="small">
          {keys.length === 0 ? 'Restore keys' : 'Show empty state'}
        </Button>
        <Menu>
          <MenuTrigger disableButtonEnhancement><Button appearance="subtle" size="small">More</Button></MenuTrigger>
          <MenuPopover><MenuList>
            <MenuItem onClick={() => toasts.succeed('Exported')}>Export</MenuItem>
            <MenuItem onClick={() => setKeys(DEMO_KEYS)}>Reset</MenuItem>
          </MenuList></MenuPopover>
        </Menu>
      </div>
      {editor.invocation && (
        <KeyEditor draft={editor.invocation.value} key={editor.invocation.key} onClose={editor.close} open={editor.isOpen} />
      )}
      {remove.invocation && (
        <ConfirmDialog
          actionLabel="Delete"
          busy={busy}
          error={deleteError}
          key={remove.invocation.key}
          message={`Delete ${remove.invocation.value.name}? Clients using it stop working immediately.`}
          onConfirm={() => confirmDelete(remove.invocation!.value)}
          onDismissError={() => setDeleteError(null)}
          onOpenChange={open => { if (!open) { remove.close(); setDeleteError(null); } }}
          open={remove.isOpen}
          title="Delete API key"
        />
      )}
    </div>
  );
}
