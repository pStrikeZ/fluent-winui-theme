import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { NumberBox, clampNumber, parseNumberText, resolveNumberChange, stepPrecision } from '../../../src/components/ui/number-box';
import { renderInApp } from '../../render';

describe('number box parsing', () => {
  it('reads plain, grouped, comma-decimal and negative numbers', () => {
    expect(parseNumberText('42')).toBe(42);
    expect(parseNumberText(' -3.5 ')).toBe(-3.5);
    expect(parseNumberText('−2')).toBe(-2);
    expect(parseNumberText('1,234.5')).toBe(1234.5);
    expect(parseNumberText('1,5')).toBe(1.5);
  });

  it('tells an empty field from text that is not a number', () => {
    expect(parseNumberText('')).toBeNull();
    expect(parseNumberText('   ')).toBeNull();
    expect(parseNumberText('abc')).toBeUndefined();
    expect(parseNumberText('Infinity')).toBeUndefined();
  });

  it('clamps and rounds', () => {
    expect(clampNumber(150, { min: 0, max: 100 })).toBe(100);
    expect(clampNumber(-5, { min: 0, max: 100 })).toBe(0);
    expect(clampNumber(1.23456, { precision: 2 })).toBe(1.23);
  });

  it('derives precision from the step', () => {
    expect(stepPrecision(1)).toBe(0);
    expect(stepPrecision(0.25)).toBe(2);
    expect(stepPrecision(1e-7)).toBe(7);
  });

  it('resolves a step from value and typed text from displayValue', () => {
    expect(resolveNumberChange({ value: 7 }, { max: 5 })).toBe(5);
    expect(resolveNumberChange({ value: undefined, displayValue: '12.34' }, { precision: 1 })).toBe(12.3);
    expect(resolveNumberChange({ value: undefined, displayValue: '' }, {})).toBeNull();
    expect(resolveNumberChange({ value: undefined, displayValue: 'x' }, {})).toBeUndefined();
  });
});

function Harness({ onChange, initial = 5 }: { onChange: (value: number | null) => void; initial?: number | null }) {
  const [value, setValue] = useState<number | null>(initial);
  return <NumberBox
    max={10}
    min={0}
    onChange={next => { setValue(next); onChange(next); }}
    placeholder="Count"
    value={value}
  />;
}

const type = (text: string) => {
  const input = screen.getByRole('spinbutton') as HTMLInputElement;
  fireEvent.change(input, { target: { value: text } });
  fireEvent.blur(input);
  return input;
};

describe('number box', () => {
  it('commits typed text clamped to the range', () => {
    const onChange = vi.fn();
    renderInApp(<Harness onChange={onChange} />);

    const input = type('99');

    expect(onChange).toHaveBeenLastCalledWith(10);
    expect(input.value).toBe('10');
  });

  it('reports an emptied field as null', () => {
    const onChange = vi.fn();
    renderInApp(<Harness onChange={onChange} />);

    const input = type('');

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input.value).toBe('');
  });

  it('leaves the value alone for text that is not a number', () => {
    const onChange = vi.fn();
    renderInApp(<Harness onChange={onChange} />);

    const input = type('abc');

    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('5');
  });

  it('steps with the arrow keys and stops at the bound', () => {
    const onChange = vi.fn();
    renderInApp(<Harness initial={9} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(10);
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('names its spin buttons from the string table', () => {
    renderInApp(<Harness onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Increase value' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Decrease value' })).toBeTruthy();
  });
});
