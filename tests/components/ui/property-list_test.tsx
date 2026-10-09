import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Metric, MetricGrid } from '../../../src/components/ui/metric';
import { PropertyList } from '../../../src/components/ui/property-list';
import { renderInApp } from '../../render';

const columnsOf = (container: HTMLElement) =>
  (container.querySelector('dl')?.parentElement as HTMLElement).style.getPropertyValue('--fwt-property-columns');

describe('property list', () => {
  it('renders each pair as a term and its description', () => {
    const { container } = renderInApp(<PropertyList items={[
      { label: 'Name', value: 'Aiko' },
      { label: 'Owner', value: <b>Ben</b> },
    ]} />);

    const terms = [...container.querySelectorAll('dt')].map(node => node.textContent);
    const descriptions = [...container.querySelectorAll('dd')].map(node => node.textContent);

    expect(container.querySelector('dl')).toBeTruthy();
    expect(terms).toEqual(['Name', 'Owner']);
    expect(descriptions).toEqual(['Aiko', 'Ben']);
  });

  it('takes its column count and clamps spans to it', () => {
    const { container } = renderInApp(<PropertyList columns={3} items={[
      { label: 'A', value: '1', span: 9 },
      { label: 'B', value: '2' },
    ]} />);
    const [wide, narrow] = [...container.querySelectorAll('dl > div')] as HTMLElement[];

    expect(columnsOf(container)).toBe('3');
    expect(wide.style.getPropertyValue('--fwt-span')).toBe('3');
    expect(wide.hasAttribute('data-wide')).toBe(true);
    expect(narrow.hasAttribute('data-wide')).toBe(false);
  });

  it('defaults to two columns and survives an empty list', () => {
    const { container } = renderInApp(<PropertyList items={[]} />);

    expect(columnsOf(container)).toBe('2');
    expect(container.querySelectorAll('dt')).toHaveLength(0);
  });

  it('draws the bordered variant with a different frame', () => {
    const frame = (node: HTMLElement) => node.querySelector('dl')?.parentElement?.className;
    const plain = frame(renderInApp(<PropertyList items={[{ label: 'A', value: '1' }]} />).container);
    const bordered = frame(renderInApp(<PropertyList bordered items={[{ label: 'A', value: '1' }]} />).container);

    expect(bordered).not.toBe(plain);
  });
});

describe('metric', () => {
  it('formats numbers for the locale and shows affixes', () => {
    renderInApp(<Metric label="Requests" prefix="~" suffix="ms" value={1234.5} />);

    expect(screen.getByText('Requests')).toBeTruthy();
    expect(screen.getByText(new Intl.NumberFormat().format(1234.5))).toBeTruthy();
    expect(screen.getByText('ms')).toBeTruthy();
    expect(screen.getByText('~')).toBeTruthy();
  });

  it('uses a custom formatter and draws a dash for no value', () => {
    renderInApp(<>
      <Metric formatter={value => `#${value}`} label="Rank" value={3} />
      <Metric label="Empty" value={null} />
    </>);

    expect(screen.getByText('#3')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('pins fraction digits with precision', () => {
    renderInApp(<Metric label="Rate" precision={2} value={5} />);

    expect(screen.getByText(new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(5))).toBeTruthy();
  });

  it('lays metrics out in a grid with its own minimum width', () => {
    const { container } = renderInApp(<MetricGrid minItemWidth={200}><Metric label="A" value={1} /><Metric label="B" value={2} /></MetricGrid>);
    const grid = container.querySelector('[style*="--fwt-metric-min-width"]') as HTMLElement;

    expect(grid.style.getPropertyValue('--fwt-metric-min-width')).toBe('200px');
    expect(within(grid).getByText('B')).toBeTruthy();
  });
});
