import { Eye24Regular, Globe24Regular, LockClosed24Regular, Settings24Regular } from '@fluentui/react-icons';
import {
  Checkbox,
  ChoiceGroup,
  Combobox,
  DashboardPageHeader,
  Dropdown,
  fluentComponents,
  infoLabelSlot,
  Input,
  OutcomeMessageBar,
  Panel,
  SectionHeader,
  SettingsCard,
  SettingsExpander,
  SettingsSwitch,
  Switch,
  SwitchSetting,
  Textarea,
  useOutcomeToasts,
} from '@pstrikez/fluent-winui-theme';
import { useState } from 'react';

import { MODEL_OPTIONS } from '../data';

const { Button, Field, Option, Text } = fluentComponents;

export function SettingsPage() {
  const toasts = useOutcomeToasts();
  const [visible, setVisible] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [retention, setRetention] = useState(true);
  const [logging, setLogging] = useState(true);
  const [stream, setStream] = useState(false);
  const [exposure, setExposure] = useState('private');
  const [model, setModel] = useState('gpt-5');
  const [region, setRegion] = useState('Tokyo');
  const [terms, setTerms] = useState(true);
  const [dirty, setDirty] = useState(false);
  const markDirty = () => setDirty(true);
  return (
    <div className="grid gap-[var(--fwt-page-inset)]" style={{ maxWidth: 960 }}>
      <DashboardPageHeader
        actions={<>
          <Button disabled={!dirty} onClick={() => setDirty(false)}>Reset</Button>
          <Button appearance="primary" disabled={!dirty} onClick={() => { setDirty(false); toasts.succeed('Settings saved'); }}>Save changes</Button>
        </>}
        description="The settings-card family: single rows, expanders and the switch controls they host."
        title="Settings"
      />

      <section className="grid gap-2">
        <SectionHeader level={2} title="Settings cards" />
        <SettingsCard
          action={<SettingsSwitch checked={visible} label="Visible" onChange={value => { setVisible(value); markDirty(); }} />}
          description="Visible aliases are listed in the public model catalogue."
          header="Visible"
          icon={<Eye24Regular />}
        />
        <SettingsCard
          action={<SettingsSwitch checked={admin} label="Administrator" onChange={value => { setAdmin(value); markDirty(); }} />}
          description="Administrators can manage users and upstreams."
          header="Administrator"
          icon={<LockClosed24Regular />}
        />
        <SettingsCard
          action={<Button size="small">Configure</Button>}
          description="A plain button as the trailing action."
          header="Custom domain"
          icon={<Globe24Regular />}
        />
        <SettingsExpander
          action={<SettingsSwitch checked={retention} label="Retention" onChange={value => { setRetention(value); markDirty(); }} />}
          description="Captured requests are deleted after the retention period."
          header="Request retention"
          icon={<Settings24Regular />}
          toggledOn={retention}
        >
          <div className="grid gap-3">
            <Field label={{ children: infoLabelSlot('Retention in days', 'Between 1 and 365 days.') }}>
              <Input defaultValue="30" disabled={!retention} onChange={markDirty} type="number" />
            </Field>
            <Checkbox defaultChecked label="Also delete response bodies" />
          </div>
        </SettingsExpander>
        <SettingsExpander
          description="An expander with the disclosure disabled keeps its trailing action usable."
          disclosureDisabled
          header="Locked section"
          action={<Button size="small">Unlock</Button>}
        >
          <Text>Never visible.</Text>
        </SettingsExpander>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Switch settings" />
        <Panel>
          <SwitchSetting checked={logging} description="Write each request to the audit log." label="Audit logging" onChange={setLogging} />
          <SwitchSetting checked={stream} description="Return server-sent events by default." label="Streaming by default" onChange={setStream} />
        </Panel>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Form controls" description="The library's Input, Combobox, Dropdown, Checkbox, Switch and Textarea, in normal, disabled, read-only and invalid states." />
        <Panel>
          <div className="grid grid-cols-2 max-[680px]:grid-cols-1 gap-4">
            <Field label="Display name"><Input defaultValue="Production gateway" onChange={markDirty} /></Field>
            <Field label="Read-only name"><Input readOnly value="locked-value" /></Field>
            <Field label="Disabled"><Input disabled value="disabled" /></Field>
            <Field label="Invalid" validationMessage="This value is not allowed." validationState="error"><Input defaultValue="bad value" /></Field>
            <Field label="Default model">
              <Combobox
                onOptionSelect={(_, data) => { setModel(data.optionValue ?? model); markDirty(); }}
                selectedOptions={[model]}
                value={model}
              >
                {MODEL_OPTIONS.map(option => <Option key={option.value} value={option.value}>{option.label}</Option>)}
              </Combobox>
            </Field>
            <Field label="Region">
              <Dropdown
                onOptionSelect={(_, data) => { setRegion(data.optionValue ?? region); markDirty(); }}
                selectedOptions={[region]}
                value={region}
              >
                {['Tokyo', 'Singapore', 'Frankfurt', 'Virginia'].map(name => <Option key={name} value={name}>{name}</Option>)}
              </Dropdown>
            </Field>
            <Field label="Read-only dropdown">
              <Dropdown readOnly selectedOptions={['Tokyo']} value="Tokyo"><Option value="Tokyo">Tokyo</Option></Dropdown>
            </Field>
            <Field label="Combobox with no options">
              <Combobox placeholder="Type to search" />
            </Field>
          </div>
          <Field label="Notes"><Textarea defaultValue="A multi-line note about this gateway." onChange={markDirty} rows={3} /></Field>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            <Checkbox checked={terms} label="Accept terms" onChange={(_, data) => setTerms(!!data.checked)} />
            <Checkbox checked label="Read-only checked" readOnly />
            <Checkbox disabled label="Disabled" />
            <Switch label="Switch (drag me)" />
            <Switch checked label="Read-only switch" readOnly />
            <Switch disabled label="Disabled switch" />
          </div>
        </Panel>
      </section>

      <section className="grid gap-2">
        <SectionHeader level={2} title="Choice group" />
        <ChoiceGroup
          ariaLabel="Exposure"
          items={[{ value: 'private', label: 'Private' }, { value: 'team', label: 'Team' }, { value: 'public', label: 'Public' }]}
          onChange={value => { setExposure(value); markDirty(); }}
          value={exposure}
        />
        <ChoiceGroup ariaLabel="Read-only exposure" items={[{ value: 'private', label: 'Private' }, { value: 'team', label: 'Team' }]} onChange={() => undefined} readOnly value="team" />
        <OutcomeMessageBar intent="warning">Public exposure lets anyone read the catalogue.</OutcomeMessageBar>
      </section>
    </div>
  );
}
