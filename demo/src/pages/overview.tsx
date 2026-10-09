import {
  Chip,
  DashboardPageHeader,
  fluentComponents,
  HttpMethodBadge,
  HttpStatusBadge,
  Panel,
  ProgressRing,
  ResourceListActions,
  ResourceListPanel,
  ScrollArea,
  SectionHeader,
  StatusBadge,
  TableColumns,
  TruncationTooltip,
  useBadgeHue,
  useOutcomeToasts,
} from '@pstrikez/fluent-winui-theme';
import type { BadgeHue } from '@pstrikez/fluent-winui-theme';
import { useState } from 'react';

import { DEMO_REQUESTS, DEMO_UPSTREAMS } from '../data';

const { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text, Button, ProgressBar } = fluentComponents;

const statusSeverity = (status: number) => (status >= 500 ? 'error' : status >= 400 ? 'warning' : 'success');

function Stat({ label, value, percent, tone }: { label: string; value: string; percent: number; tone: 'accent' | 'caution' | 'critical' }) {
  return (
    <Panel>
      <div style={{ display: 'grid', gap: 4 }}>
        <Text size={200} className="text-fui-fg2">{label}</Text>
        <span style={{ alignItems: 'baseline', display: 'inline-flex', gap: 10 }}>
          <ProgressRing percent={percent} size={20} tone={tone} />
          <Text size={600} weight="semibold">{value}</Text>
          <Text size={200} className="text-fui-fg2">{percent}%</Text>
        </span>
      </div>
    </Panel>
  );
}

function HueChip({ hue, children }: { hue: BadgeHue; children: string }) {
  const badge = useBadgeHue(hue);
  return <Chip className={`flex-none ${badge.className}`} style={badge.style}>{children}</Chip>;
}

export function OverviewPage() {
  const toasts = useOutcomeToasts();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => {
    setRefreshing(true);
    const handle = toasts.start('Refreshing metrics...');
    window.setTimeout(() => {
      setRefreshing(false);
      handle.succeed('Metrics are up to date');
    }, 1200);
  };
  return (
    <div className="grid gap-[var(--fwt-page-inset)]">
      <DashboardPageHeader
        actions={<ResourceListActions onRefresh={refresh} refreshLabel="Refresh" refreshing={refreshing} />}
        description="Traffic, quotas and upstream health at a glance. This page lays out the library's dashboard primitives the way Floway does."
        title="Overview"
      />
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Stat label="Requests today" value="12,480" percent={42} tone="accent" />
        <Stat label="Monthly budget" value="$318 / $400" percent={79} tone="caution" />
        <Stat label="Error rate" value="6.4%" percent={96} tone="critical" />
      </div>

      <section className="grid gap-2">
        <SectionHeader
          actions={<Button appearance="subtle" size="small">View all</Button>}
          description="Upstream providers and their current state."
          info="Health is probed every minute."
          level={2}
          title="Upstreams"
        />
        <Panel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DEMO_UPSTREAMS.map(upstream => <HueChip hue={upstream.hue} key={upstream.id}>{upstream.name}</HueChip>)}
            <StatusBadge tone="success">Healthy</StatusBadge>
            <StatusBadge tone="warning">Degraded</StatusBadge>
            <StatusBadge tone="danger">Down</StatusBadge>
            <StatusBadge tone="accent">Syncing</StatusBadge>
            <StatusBadge tone="neutral">Disabled</StatusBadge>
          </div>
          <ProgressBar thickness="large" value={0.62} />
        </Panel>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Recent requests" description="The latest traffic through the gateway." />
        <ResourceListPanel>
          <ScrollArea axes="horizontal" className="min-w-0">
          <Table aria-label="Recent requests" style={{ minWidth: 640 }}>
            <TableColumns widths={['92px', null, '140px', '100px', '110px']} />
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Method</TableHeaderCell>
                <TableHeaderCell>Path</TableHeaderCell>
                <TableHeaderCell>Model</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Latency</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_REQUESTS.map(request => (
                <TableRow key={request.id}>
                  <TableCell><HttpMethodBadge method={request.method} /></TableCell>
                  <TableCell className="overflow-hidden">
                    <TruncationTooltip content={request.path} relationship="label">
                      {measureRef => <code className="truncate block" ref={measureRef}>{request.path}</code>}
                    </TruncationTooltip>
                  </TableCell>
                  <TableCell>{request.model}</TableCell>
                  <TableCell><HttpStatusBadge severity={statusSeverity(request.status)}>{request.status}</HttpStatusBadge></TableCell>
                  <TableCell>{request.latency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </ScrollArea>
        </ResourceListPanel>
      </section>
    </div>
  );
}
