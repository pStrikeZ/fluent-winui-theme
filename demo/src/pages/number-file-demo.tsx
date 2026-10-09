import {
  fluentComponents,
  FileDropZone,
  FilePickerButton,
  Metric,
  MetricGrid,
  NumberBox,
  Panel,
  PropertyList,
  SectionHeader,
} from '@pstrikez/fluent-winui-theme';
import { useState } from 'react';

const { Field, Text } = fluentComponents;

/** NumberBox and the file pickers, shown on the Controls page. */
export function NumberFileDemo() {
  const [count, setCount] = useState<number | null>(5);
  const [price, setPrice] = useState<number | null>(19.99);
  const [files, setFiles] = useState<File[]>([]);

  return (
    <>
      <section className="grid gap-2">
        <SectionHeader level={3} title="NumberBox" description="Fluent SpinButton drawn as a WinUI NumberBox with inline spin buttons." />
        <Panel>
          <div className="grid grid-cols-2 max-[680px]:grid-cols-1 gap-4">
            <Field label="Count (0 to 10, clamped)"><NumberBox max={10} min={0} onChange={setCount} placeholder="Count" value={count} /></Field>
            <Field label="Price (step 0.01)"><NumberBox min={0} onChange={setPrice} step={0.01} value={price} /></Field>
            <Field label="Filled"><NumberBox appearance="filled-lighter" onChange={setCount} value={count} /></Field>
            <Field label="Disabled"><NumberBox disabled onChange={setCount} value={count} /></Field>
            <Field label="Read only"><NumberBox onChange={setCount} readOnly value={count} /></Field>
            <Text>Value: {count === null ? 'empty' : count}, price: {price === null ? 'empty' : price}</Text>
          </div>
        </Panel>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={3} title="FileDropZone" description="Drop files or activate to browse; FilePickerButton opens the same dialog." />
        <Panel>
          <FileDropZone
            accept="image/*,.pdf"
            description="Images and PDFs"
            multiple
            onFiles={picked => setFiles(current => [...current, ...picked])}
            onRemove={(_, index) => setFiles(current => current.filter((__, at) => at !== index))}
            selectedFiles={files}
            title="Drag files here or click to browse"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilePickerButton accept=".json" onFiles={picked => setFiles(current => [...current, ...picked])}>Pick a JSON file</FilePickerButton>
            <FilePickerButton appearance="primary" multiple onFiles={picked => setFiles(current => [...current, ...picked])}>Pick files</FilePickerButton>
          </div>
          <FileDropZone disabled description="Not available right now" onFiles={() => undefined} title="Disabled drop zone" />
        </Panel>
      </section>
    </>
  );
}

/** Metric and PropertyList, shown on the Content page. */
export function MetricPropertyDemo() {
  return (
    <>
      <section className="grid gap-2">
        <SectionHeader level={2} title="Metric" description="Label over a large figure, in a responsive grid." />
        <Panel>
          <MetricGrid>
            <Metric label="Requests" value={1284903} />
            <Metric label="Latency" suffix="ms" tone="accent" value={182.4} precision={1} />
            <Metric label="Success rate" suffix="%" tone="success" value={99.2} />
            <Metric label="Errors" tone="danger" value={37} />
            <Metric label="Budget used" prefix="$" size="subtitle" tone="warning" value={412.5} />
            <Metric label="Pending" value={null} />
          </MetricGrid>
        </Panel>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="PropertyList" description="Label and value pairs; narrows to one column with its container." />
        <Panel>
          <PropertyList items={[
            { label: 'Name', value: 'Floway gateway' },
            { label: 'Region', value: 'West Europe' },
            { label: 'Created', value: '2026-03-14 09:30' },
            { label: 'Owner', value: 'Aiko Tanaka' },
            { label: 'Endpoint', value: 'https://gateway.example.com/v1/chat/completions?stream=true', span: 2 },
          ]} />
          <PropertyList bordered columns={3} items={[
            { label: 'Name', value: 'Floway gateway' },
            { label: 'Region', value: 'West Europe' },
            { label: 'State', value: 'Active' },
            { label: 'Owner', value: 'Aiko Tanaka' },
            { label: 'Plan', value: 'Team' },
            { label: 'Seats', value: '12' },
            { label: 'Description', value: 'Routes requests to the cheapest healthy upstream and retries on failure.', span: 3 },
          ]} />
        </Panel>
      </section>
    </>
  );
}
