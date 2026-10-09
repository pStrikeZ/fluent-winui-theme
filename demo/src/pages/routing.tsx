import { ShieldKeyholeRegular, ProhibitedRegular } from '@fluentui/react-icons';
import {
  ChoiceGroup,
  Chip,
  DashboardPageHeader,
  EmptyState,
  fluentComponents,
  moveItem,
  MultiselectCombobox,
  OutcomeMessageBar,
  ReorderHandle,
  ScrollArea,
  SectionHeader,
  SettingsExpander,
  SettingsSwitch,
  TableColumns,
  useBadgeHue,
  useReorderList,
  valuesAsOptions,
} from '@pstrikez/fluent-winui-theme';
import type { ReorderList } from '@pstrikez/fluent-winui-theme';
import { useId, useState } from 'react';

import { DEMO_UPSTREAMS, MODEL_OPTIONS } from '../data';
import type { DemoUpstream } from '../data';

const { Button, Checkbox, MessageBar, MessageBarBody, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } = fluentComponents;

function ProviderChip({ upstream }: { upstream: DemoUpstream }) {
  const hue = useBadgeHue(upstream.hue);
  return <Chip className={hue.className} style={hue.style}>{upstream.name}</Chip>;
}

function AccessRow({ disabled, index, onToggle, reorder, row, selected }: {
  disabled: boolean;
  index: number;
  onToggle: (id: string, enabled: boolean) => void;
  reorder: ReorderList;
  row: DemoUpstream;
  selected: boolean;
}) {
  return (
    <TableRow {...(index < 0 ? {} : reorder.itemProps(index))}>
      <TableCell>
        <div className="inline-flex items-center gap-1">
          <Checkbox
            aria-label={`Enabled: ${row.name}`}
            checked={selected}
            disabled={disabled}
            onChange={(_, data) => onToggle(row.id, !!data.checked)}
          />
          <ReorderHandle {...reorder.handleProps(index)} label={`Reorder ${row.name}`} />
        </div>
      </TableCell>
      <TableCell><ProviderChip upstream={row} /></TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1.5 min-w-0">
          {!row.enabled && <ProhibitedRegular aria-label="Upstream disabled" className="block flex-none text-fui-fg2" />}
          {row.models} models
        </span>
      </TableCell>
    </TableRow>
  );
}

function UpstreamAccess() {
  const warningId = useId();
  const [override, setOverride] = useState(true);
  const [ids, setIds] = useState<string[]>(['u2', 'u1', 'u3']);
  const reorder = useReorderList({
    disabled: !override,
    length: ids.length,
    onReorder: (from, to) => setIds(current => moveItem(current, from, to)),
  });
  const rows = [
    ...ids.flatMap(id => DEMO_UPSTREAMS.filter(upstream => upstream.id === id)),
    ...DEMO_UPSTREAMS.filter(upstream => !ids.includes(upstream.id)),
  ];
  const toggle = (id: string, enabled: boolean) => setIds(current => enabled ? [...current, id] : current.filter(candidate => candidate !== id));
  return (
    <section aria-describedby={ids.length === 0 ? warningId : undefined} className="grid gap-3 min-w-0">
      <SettingsExpander
        action={<SettingsSwitch checked={override} label="Restrict upstreams" onChange={setOverride} />}
        description="Only the checked upstreams are tried, in the order shown. Drag the grip or use the keyboard to reorder."
        defaultOpen
        disclosureDisabled={!override}
        header="Upstream access"
        icon={<ShieldKeyholeRegular />}
        toggledOn={override}
      >
        <ScrollArea axes="horizontal" className="min-w-0">
          <Table aria-label="Upstream access" style={{ minWidth: 344 }}>
            <TableColumns widths={['80px', null, '120px']} />
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Enabled</TableHeaderCell>
                <TableHeaderCell>Upstream</TableHeaderCell>
                <TableHeaderCell>Models</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody {...reorder.listProps()}>
              {rows.map(row => (
                <AccessRow
                  disabled={!override}
                  index={ids.indexOf(row.id)}
                  key={row.id}
                  onToggle={toggle}
                  reorder={reorder}
                  row={row}
                  selected={ids.includes(row.id)}
                />
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </SettingsExpander>
      {ids.length === 0 && (
        <MessageBar id={warningId} intent="warning"><MessageBarBody>No upstream is selected, so no request can be routed.</MessageBarBody></MessageBar>
      )}
    </section>
  );
}

export function RoutingPage() {
  const [range, setRange] = useState('24h');
  const [allowed, setAllowed] = useState<string[]>(['gpt-5', 'claude-sonnet']);
  const [freeform, setFreeform] = useState<string[]>(['internal-model-1', 'internal-model-2']);
  const [showEmpty, setShowEmpty] = useState(false);
  return (
    <div className="grid gap-[var(--fwt-page-inset)]">
      <DashboardPageHeader
        description="Choose which upstreams serve requests, and in which order."
        title="Routing"
        actions={<ChoiceGroup
          ariaLabel="Time range"
          items={[{ value: '1h', label: '1 hour' }, { value: '24h', label: '24 hours' }, { value: '7d', label: '7 days' }, { value: '30d', label: '30 days', disabled: true }]}
          onChange={setRange}
          value={range}
        />}
      />
      <UpstreamAccess />
      <section className="grid gap-2">
        <SectionHeader level={3} title="Allowed models" description="MultiselectCombobox with a fixed catalogue and with free-form entries." />
        <div className="grid gap-3" style={{ maxWidth: 520 }}>
          <MultiselectCombobox
            ariaLabel="Allowed models"
            clearLabel="All models"
            closedLabel={allowed.length === 0 ? '' : `${allowed.length} selected`}
            onChange={setAllowed}
            options={MODEL_OPTIONS}
            placeholder="Select models"
            value={allowed}
          />
          <MultiselectCombobox
            ariaLabel="Free-form aliases"
            closedLabel={`${freeform.length} aliases`}
            freeform
            normalizeValue={entry => entry.trim().toLowerCase()}
            onChange={setFreeform}
            options={valuesAsOptions(freeform)}
            placeholder="Type an alias and press Enter"
            value={freeform}
          />
          <MultiselectCombobox ariaLabel="Read-only models" closedLabel="1 selected" onChange={() => undefined} options={MODEL_OPTIONS} placeholder="Read only" readOnly value={['gpt-5']} />
        </div>
      </section>
      <section className="grid gap-2">
        <SectionHeader level={3} title="Fallbacks" actions={<Button appearance="subtle" onClick={() => setShowEmpty(value => !value)} size="small">{showEmpty ? 'Hide' : 'Show'} empty state</Button>} />
        {showEmpty
          ? <EmptyState
            action={<Button appearance="primary">Add fallback</Button>}
            description="Requests that fail on every selected upstream return an error to the client."
            title="No fallback routes"
          />
          : <OutcomeMessageBar intent="success">Fallbacks are healthy.</OutcomeMessageBar>}
      </section>
    </div>
  );
}
