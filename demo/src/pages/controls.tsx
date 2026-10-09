import {
  AddRegular,
  CopyRegular,
  DeleteRegular,
  EditRegular,
  TextBoldRegular,
  TextItalicRegular,
  TextUnderlineRegular,
} from '@fluentui/react-icons';
import { DashboardPageHeader, fluentComponents, Panel, SectionHeader } from '@pstrikez/fluent-winui-theme';
import { useState } from 'react';

import { TabViewDemo } from './tab-view-demo';

import { DataTableDemo } from './data-table-demo';
import { NumberFileDemo } from './number-file-demo';

const {
  Accordion, AccordionHeader, AccordionItem, AccordionPanel, Button, CompoundButton, Divider, DataGrid, DataGridBody, DataGridCell,
  DataGridHeader, DataGridHeaderCell, DataGridRow, Field, Input, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, MessageBar,
  MessageBarBody, MessageBarTitle, ProgressBar, Radio, RadioGroup, Slider, SplitButton, Spinner, Tab, TabList, Text, Toolbar,
  ToolbarButton, ToolbarDivider, ToolbarToggleButton, Tooltip, ToggleButton, createTableColumn, TableCellLayout, Link, Badge, Avatar,
} = fluentComponents;

interface Row { name: string; owner: string; state: string }
const rows: Row[] = [
  { name: 'Alpha', owner: 'Aiko', state: 'Active' },
  { name: 'Beta', owner: 'Ben', state: 'Paused' },
  { name: 'Gamma', owner: 'Chen', state: 'Active' },
];
const columns = [
  createTableColumn<Row>({ columnId: 'name', compare: (a, b) => a.name.localeCompare(b.name), renderHeaderCell: () => 'Name', renderCell: item => <TableCellLayout>{item.name}</TableCellLayout> }),
  createTableColumn<Row>({ columnId: 'owner', compare: (a, b) => a.owner.localeCompare(b.owner), renderHeaderCell: () => 'Owner', renderCell: item => item.owner }),
  createTableColumn<Row>({ columnId: 'state', renderHeaderCell: () => 'State', renderCell: item => item.state }),
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <SectionHeader level={3} title={title} />
      <Panel>{children}</Panel>
    </section>
  );
}

const rowStyle = { alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 } as const;

export function ControlsPage() {
  const [tab, setTab] = useState('one');
  const [slider, setSlider] = useState(40);
  const [radio, setRadio] = useState('b');
  return (
    <div className="grid gap-[var(--fwt-page-inset)]">
      <DashboardPageHeader description="Plain Fluent controls restyled by the WinUI layer." title="Controls" />

      <Group title="Buttons">
        <div style={rowStyle}>
          <Button>Standard</Button>
          <Button appearance="primary">Primary</Button>
          <Button appearance="outline">Outline</Button>
          <Button appearance="subtle">Subtle</Button>
          <Button appearance="transparent">Transparent</Button>
          <Button disabled>Disabled</Button>
          <Button appearance="primary" disabled>Disabled primary</Button>
          <Button icon={<AddRegular />}>With icon</Button>
          <Button icon={<EditRegular />} aria-label="Icon only" />
          <Button size="small">Small</Button>
          <Button size="large">Large</Button>
          <Button shape="circular">Circular</Button>
        </div>
        <div style={rowStyle}>
          <ToggleButton>Toggle</ToggleButton>
          <ToggleButton checked>Toggled</ToggleButton>
          <CompoundButton secondaryContent="Secondary text">Compound</CompoundButton>
          <Menu positioning="below-end">
            <MenuTrigger disableButtonEnhancement>
              {triggerProps => <SplitButton menuButton={triggerProps} primaryActionButton={{}}>Split</SplitButton>}
            </MenuTrigger>
            <MenuPopover><MenuList><MenuItem>Option 1</MenuItem><MenuItem>Option 2</MenuItem></MenuList></MenuPopover>
          </Menu>
          <Link href="#/controls">A link</Link>
        </div>
      </Group>

      <Group title="Inputs">
        <div className="grid grid-cols-2 max-[680px]:grid-cols-1 gap-4">
          <Field label="Input"><Input placeholder="Placeholder" /></Field>
          <Field label="Filled input"><Input appearance="filled-lighter" defaultValue="Filled" /></Field>
          <Field label="Slider"><Slider max={100} min={0} onChange={(_, data) => setSlider(data.value)} value={slider} /></Field>
          <Field label="Radio group">
            <RadioGroup onChange={(_, data) => setRadio(data.value)} value={radio}>
              <Radio label="Option A" value="a" />
              <Radio label="Option B" value="b" />
              <Radio disabled label="Disabled" value="c" />
            </RadioGroup>
          </Field>
        </div>
      </Group>

      <Group title="Message bars">
        {(['info', 'success', 'warning', 'error'] as const).map(intent => (
          <MessageBar intent={intent} key={intent}>
            <MessageBarBody><MessageBarTitle>{intent}</MessageBarTitle>This is a {intent} message bar.</MessageBarBody>
          </MessageBar>
        ))}
      </Group>

      <Group title="Tabs, toolbar and tooltip">
        <TabList onTabSelect={(_, data) => setTab(String(data.value))} selectedValue={tab}>
          <Tab value="one">First</Tab>
          <Tab value="two">Second</Tab>
          <Tab value="three">Third</Tab>
          <Tab disabled value="four">Disabled</Tab>
        </TabList>
        <Text>Selected tab: {tab}</Text>
        <Toolbar aria-label="Formatting">
          <ToolbarToggleButton aria-label="Bold" icon={<TextBoldRegular />} name="format" value="bold" />
          <ToolbarToggleButton aria-label="Italic" icon={<TextItalicRegular />} name="format" value="italic" />
          <ToolbarToggleButton aria-label="Underline" icon={<TextUnderlineRegular />} name="format" value="underline" />
          <ToolbarDivider />
          <ToolbarButton aria-label="Copy" icon={<CopyRegular />} />
          <ToolbarButton aria-label="Delete" icon={<DeleteRegular />} />
        </Toolbar>
        <div style={rowStyle}>
          <Tooltip content="A tooltip" relationship="label"><Button>Hover me</Button></Tooltip>
          <Menu>
            <MenuTrigger disableButtonEnhancement><Button>Menu</Button></MenuTrigger>
            <MenuPopover><MenuList>
              <MenuItem icon={<EditRegular />}>Edit</MenuItem>
              <MenuItem icon={<CopyRegular />}>Copy</MenuItem>
              <Divider />
              <MenuItem disabled>Disabled</MenuItem>
            </MenuList></MenuPopover>
          </Menu>
          <Badge appearance="filled">Badge</Badge>
          <Badge appearance="outline" color="success">Outline</Badge>
          <Avatar name="Aiko Tanaka" />
        </div>
      </Group>

      <Group title="Tab view">
        <TabViewDemo />
      </Group>

      <Group title="Progress">
        <div style={rowStyle}>
          <Spinner size="tiny" /><Spinner size="small" label="Loading" /><Spinner size="large" />
        </div>
        <ProgressBar value={0.4} />
        <ProgressBar />
        <ProgressBar color="error" value={0.8} />
      </Group>

      <Group title="Accordion and data grid">
        <Accordion collapsible defaultOpenItems="1">
          <AccordionItem value="1"><AccordionHeader>First section</AccordionHeader><AccordionPanel>Panel content for the first section.</AccordionPanel></AccordionItem>
          <AccordionItem value="2"><AccordionHeader>Second section</AccordionHeader><AccordionPanel>Panel content for the second section.</AccordionPanel></AccordionItem>
        </Accordion>
        <DataGrid columns={columns} getRowId={(item: Row) => item.name} items={rows} selectionMode="multiselect" sortable>
          <DataGridHeader>
            <DataGridRow>{({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow>
          </DataGridHeader>
          <DataGridBody<Row>>
            {({ item, rowId }) => <DataGridRow<Row> key={rowId}>{({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}</DataGridRow>}
          </DataGridBody>
        </DataGrid>
      </Group>

      <NumberFileDemo />

      <DataTableDemo />
    </div>
  );
}
