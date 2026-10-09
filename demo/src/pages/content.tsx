import { DeleteRegular, DocumentRegular, EditRegular, StarRegular } from '@fluentui/react-icons';
import {
  BackNavigationButton,
  Chip,
  CodeBlock,
  DashboardPageHeader,
  EmptyState,
  EmptyStateLine,
  fluentComponents,
  HttpMethodBadge,
  HttpStatusBadge,
  MaskedIcon,
  OpenLinkLabel,
  OutcomeMessageBar,
  Panel,
  ProgressRing,
  RouteLink,
  SectionHeader,
  StatusBadge,
  TooltipIconButton,
  TruncationTooltip,
  useBadgeHue,
  useCopyToClipboard,
  useDangerActionClasses,
  useDangerTextClass,
  useOutcomeToasts,
} from '@pstrikez/fluent-winui-theme';
import type { BadgeHue, BadgeTone } from '@pstrikez/fluent-winui-theme';
import { useState } from 'react';

import { SAMPLE_JSON } from '../data';
import { ConfirmationsDemo } from './confirmations';
import { MetricPropertyDemo } from './number-file-demo';
import { pathOf } from '../router';

const { Button, InfoLabel, Link, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Text } = fluentComponents;

const SPARKLE_ICON = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>')}`;

const HUES: { label: string; hue: BadgeHue }[] = [
  { label: 'Teal', hue: '#10a37f' },
  { label: 'Orange', hue: '#d97757' },
  { label: 'Blue', hue: '#4285f4' },
  { label: 'Purple', hue: '#8764b8' },
  { label: 'Per-scheme', hue: { light: '#0f7b0f', dark: '#6ccb5f' } },
  { label: 'Yellow', hue: '#ffd700' },
  { label: 'Near-white', hue: '#f0f0f0' },
  { label: 'Near-black', hue: '#101010' },
];

function HueChip({ hue, label }: { hue: BadgeHue; label: string }) {
  const badge = useBadgeHue(hue);
  return <Chip className={badge.className} icon={<StarRegular />} style={badge.style}>{label}</Chip>;
}

const TONES: BadgeTone[] = ['accent', 'success', 'warning', 'danger', 'neutral'];

export function ContentPage() {
  const toasts = useOutcomeToasts();
  const clipboard = useCopyToClipboard();
  const danger = useDangerActionClasses();
  const dangerText = useDangerTextClass();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="grid gap-[var(--fwt-page-inset)]">
      <div><BackNavigationButton to={pathOf('overview')}>Back to overview (addressed)</BackNavigationButton></div>
      <DashboardPageHeader
        actions={<Button appearance="primary" onClick={() => toasts.succeed('Action completed')}>Primary action</Button>}
        description="Badges, chips, code, empty states, message bars and the small helpers around them."
        title="Content"
      />

      <section className="grid gap-2">
        <SectionHeader level={2} title="Badges" description="StatusBadge tones, HTTP method and status badges." />
        <Panel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TONES.map(tone => <StatusBadge key={tone} tone={tone}>{tone}</StatusBadge>)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].map(method => <HttpMethodBadge key={method} method={method} />)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <HttpStatusBadge severity="success">200 OK</HttpStatusBadge>
            <HttpStatusBadge severity="warning">429 Too Many Requests</HttpStatusBadge>
            <HttpStatusBadge severity="error">500 Internal Server Error</HttpStatusBadge>
          </div>
        </Panel>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Chips and badge hues" />
        <Panel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip>Plain chip</Chip>
            <Chip icon={<DocumentRegular />}>With icon</Chip>
            <Chip onClick={() => toasts.succeed('Chip clicked')}>Clickable chip</Chip>
            <div style={{ width: 120 }}>
              <TruncationTooltip content="A chip with a label far too long to fit" relationship="label">
                {measureRef => <Chip textRef={measureRef}>A chip with a label far too long to fit</Chip>}
              </TruncationTooltip>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {HUES.map(item => <HueChip hue={item.hue} key={item.label} label={item.label} />)}
          </div>
        </Panel>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Code" description="CodeBlock highlights JSON, copies through the clipboard hook and can collapse." actions={<Button appearance="subtle" onClick={() => setCollapsed(value => !value)} size="small">{collapsed ? 'Expand' : 'Collapse'}</Button>} />
        <CodeBlock
          code={SAMPLE_JSON}
          collapsed={collapsed}
          copyOutcome={clipboard.outcomeFor('json')}
          language="json"
          onCopy={() => clipboard.copy(SAMPLE_JSON, 'json')}
        />
        <CodeBlock
          code={'curl https://gateway.example.com/v1/chat/completions -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d @request.json'}
          copyOutcome={clipboard.outcomeFor('bash')}
          language="bash"
          onCopy={() => clipboard.copy('curl ...', 'bash')}
          wrap
        />
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Empty states" />
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <Panel>
            <EmptyState action={<Button appearance="primary">Create one</Button>} description="Centered, the default alignment." title="Nothing here yet" />
          </Panel>
          <Panel>
            <EmptyState align="start" description="Start-aligned, for panels that read left to right." title="No results" />
            <EmptyStateLine>EmptyStateLine is the one-line variant.</EmptyStateLine>
          </Panel>
        </div>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Message bars" />
        <OutcomeMessageBar intent="error" onDismiss={() => undefined} title="Request failed">The upstream returned 502. Try again in a moment.</OutcomeMessageBar>
        <OutcomeMessageBar intent="warning" action={<Button size="small">Review</Button>}>Quota is at 90%.</OutcomeMessageBar>
        <OutcomeMessageBar intent="success">Key rotated.</OutcomeMessageBar>
        <OutcomeMessageBar intent="info">New models were discovered.</OutcomeMessageBar>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => toasts.succeed('Saved successfully')}>Succeed toast</Button>
          <Button onClick={() => {
            const handle = toasts.start('Working...');
            window.setTimeout(() => handle.succeed('Finished'), 1500);
          }}>Pending toast</Button>
        </div>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Small parts" />
        <Panel>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            <span style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
              <span style={{ display: 'inline-block', height: 20, position: 'relative', width: 20 }}><MaskedIcon className="absolute h-full w-full" url={SPARKLE_ICON} /></span>
              MaskedIcon
            </span>
            <InfoLabel info="InfoLabel shows a help popover.">Info label</InfoLabel>
            <span style={{ alignItems: 'baseline', display: 'inline-flex', gap: 12 }}>
              <ProgressRing percent={25} tone="accent" /><ProgressRing percent={75} tone="caution" /><ProgressRing percent={100} size={24} tone="critical" /><ProgressRing percent={140} size={32} tone="critical" />
              <span>ProgressRing</span>
            </span>
            <RouteLink to={pathOf('controls')}>RouteLink to Controls</RouteLink>
            <Link href="https://example.com"><OpenLinkLabel>OpenLinkLabel</OpenLinkLabel></Link>
            <Text className={dangerText}>Danger text</Text>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <TooltipIconButton icon={<EditRegular />} label="Edit" onClick={() => undefined} />
            <TooltipIconButton danger icon={<DeleteRegular />} label="Delete (danger)" onClick={() => undefined} />
            <TooltipIconButton disabled icon={<EditRegular />} label="Disabled" onClick={() => undefined} />
            <TooltipIconButton disabledFocusable icon={<EditRegular />} label="Disabled but focusable" onClick={() => undefined} />
            <Button className={danger.button}>Danger button</Button>
            <Menu>
              <MenuTrigger disableButtonEnhancement><Button>Danger menu item</Button></MenuTrigger>
              <MenuPopover><MenuList>
                <MenuItem>Rename</MenuItem>
                <MenuItem className={danger.menuItem} icon={<DeleteRegular />}>Delete</MenuItem>
              </MenuList></MenuPopover>
            </Menu>
          </div>
        </Panel>
      </section>

      <MetricPropertyDemo />

      <ConfirmationsDemo />
    </div>
  );
}
