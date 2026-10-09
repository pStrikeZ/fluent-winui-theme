import { AddRegular, DocumentRegular } from '@fluentui/react-icons';
import { fluentComponents, TabView, type TabViewItem } from '@pstrikez/fluent-winui-theme';
import { useState } from 'react';

const { Button, Text } = fluentComponents;

const initial: TabViewItem[] = [
  { value: 'ws-1', header: 'Mobile suit manuals', closable: true, icon: <DocumentRegular /> },
  { value: 'ws-2', header: 'A workspace with a deliberately very long name that must truncate', closable: true, icon: <DocumentRegular /> },
  { value: 'ws-3', header: 'Pinned', icon: <DocumentRegular /> },
  { value: 'ws-4', header: 'Archive', closable: true, disabled: true },
  ...Array.from({ length: 6 }, (_, index) => ({ value: `ws-x${index}`, header: `Workspace ${index + 5}`, closable: true })),
];

/** A TabView with the selected document rendered beneath it, on the surface the selected tab is painted with. */
export function TabViewDemo() {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<string | null>('ws-1');
  const [counter, setCounter] = useState(1);
  const close = (value: string) => {
    const index = items.findIndex(item => item.value === value);
    const rest = items.filter(item => item.value !== value);
    setItems(rest);
    if (selected === value) setSelected((rest[index] ?? rest[index - 1])?.value ?? null);
  };
  const add = () => {
    const value = `new-${counter}`;
    setCounter(counter + 1);
    setItems([...items, { value, header: `New workspace ${counter}`, closable: true }]);
    setSelected(value);
  };
  return (
    <div style={{ maxWidth: 640 }}>
      <TabView
        ariaLabel="Open workspaces"
        footer={<Button appearance="subtle" aria-label="Add workspace" icon={<AddRegular />} onClick={add} size="small" />}
        items={items}
        onClose={close}
        onSelect={setSelected}
        selectedValue={selected}
      />
      <div style={{ background: 'var(--winui-solid-background-fill-tertiary)', border: '1px solid var(--winui-card-stroke-default)', borderTop: 0, padding: 16 }}>
        <Text>{selected === null ? 'No workspace open.' : `Content of ${items.find(item => item.value === selected)?.header as string}`}</Text>
      </div>
    </div>
  );
}
