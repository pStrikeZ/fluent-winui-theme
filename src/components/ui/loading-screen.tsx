import { fluentComponents } from '../../fluent';

const { Spinner } = fluentComponents;

export function AppLoadingScreen({ label }: { label: string }) {
  return <main className="fwt-loading fwt-loading-app"><Spinner label={label} /></main>;
}

export function ContentLoadingScreen({ label }: { label: string }) {
  return <div className="fwt-loading"><Spinner label={label} /></div>;
}
