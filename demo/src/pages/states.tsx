import { ArrowClockwiseRegular } from '@fluentui/react-icons';
import {
  AppLoadingScreen,
  BackNavigationButton,
  ContentLoadingScreen,
  DashboardPageHeader,
  ErrorShell,
  ErrorStack,
  fluentComponents,
  NavigationProgress,
  Panel,
  ScrollArea,
  SectionHeader,
} from '@pstrikez/fluent-winui-theme';
import { useState } from 'react';

import { useDemoRouter } from '../router';

const { Button, Switch, Text } = fluentComponents;

const STACK = `TypeError: Cannot read properties of undefined (reading 'id')
    at KeysTable (keys.tsx:42:18)
    at renderWithHooks (react-dom.development.js:15486:18)
    at updateFunctionComponent (react-dom.development.js:19617:20)`;

export function StatesPage() {
  const router = useDemoRouter();
  const [progress, setProgress] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [errorShown, setErrorShown] = useState(false);
  return (
    <div className="grid gap-[var(--fwt-page-inset)]">
      <div><BackNavigationButton onClick={() => router.go('overview')}>Overview</BackNavigationButton></div>
      <DashboardPageHeader
        actions={<Switch checked={progress} label="Navigation progress" onChange={(_, data) => setProgress(data.checked)} />}
        description="Loading screens, error shells, scroll areas and the navigation progress bar."
        title="States"
      />
      <NavigationProgress active={progress} />
      {errorShown && (
        <div style={{ background: 'var(--colorNeutralBackground1)', inset: 0, position: 'fixed', zIndex: 2000 }}>
          <ErrorShell
            action={<>
              <Button appearance="primary" icon={<ArrowClockwiseRegular />} onClick={() => setErrorShown(false)}>Close (demo)</Button>
            </>}
            message="Something went wrong while rendering this page."
            title="Unexpected error"
          >
            <ErrorStack>{STACK}</ErrorStack>
          </ErrorShell>
        </div>
      )}
      {appLoading && (
        <div style={{ background: 'var(--colorNeutralBackground1)', inset: 0, position: 'fixed', zIndex: 2000 }} onClick={() => setAppLoading(false)}>
          <AppLoadingScreen label="Loading the app... (click to dismiss)" />
        </div>
      )}

      <section className="grid gap-2">
        <SectionHeader level={2} title="Loading" actions={<Button onClick={() => setAppLoading(true)} size="small">Show AppLoadingScreen</Button>} />
        <Panel><div style={{ height: 160 }}><ContentLoadingScreen label="Loading content" /></div></Panel>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Error shell" description="ErrorShell fills the viewport, as the root error boundary does, so it opens full screen." actions={<Button onClick={() => setErrorShown(true)} size="small">Show ErrorShell</Button>} />
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Scroll area" description="OverlayScrollbars-backed region with WinUI scroll bars." />
        <Panel padding="flush">
          <div style={{ height: 200 }}><ScrollArea axes="both" className="h-full min-h-0" contentClassName="p-4">
            <div style={{ display: 'grid', gap: 8, width: 1200 }}>
              {Array.from({ length: 24 }, (_, index) => <Text key={index}>Row {index + 1}: scrollable content that is wide enough to scroll sideways as well.</Text>)}
            </div>
          </ScrollArea></div>
        </Panel>
      </section>
    </div>
  );
}
