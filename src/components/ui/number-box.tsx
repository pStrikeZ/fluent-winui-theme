import type { SpinButtonOnChangeData, SpinButtonProps } from '@fluentui/react-components';
import { forwardRef, isValidElement } from 'react';

import { fluentComponents } from '../../fluent';
import { useTranslation } from '../../i18n/translation';

const { SpinButton } = fluentComponents;

export interface NumberBoxProps extends Omit<SpinButtonProps, 'value' | 'defaultValue' | 'displayValue' | 'onChange'> {
  /** The committed number, or `null` while the box is empty. */
  value: number | null;
  /** Called with the committed number, or `null` when the box is cleared. Never called for text that is not a number. */
  onChange: (value: number | null) => void;
}

interface NumberBounds {
  min?: number;
  max?: number;
  precision?: number;
}

// The count of decimals `step` writes, which is Fluent's own default for the
// precision of a SpinButton: a step of 0.25 keeps two decimals, a step of 1 none.
export const stepPrecision = (step: number) => {
  const text = String(step);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) return Number(exponent[1]);
  return text.split('.')[1]?.length ?? 0;
};

const THOUSANDS_GROUPED = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;

/**
 * Reads what a person typed into a number box. `null` is an empty field and
 * `undefined` is text that is not a number, which a caller leaves alone so the
 * field falls back to the last good value. Grouped thousands ("1,234.5") and a
 * lone decimal comma ("1,5") are both understood.
 */
export const parseNumberText = (text: string): number | null | undefined => {
  const trimmed = text.trim().replace(/−/g, '-').replace(/\s/g, '');
  if (trimmed === '') return null;
  const normalized = THOUSANDS_GROUPED.test(trimmed)
    ? trimmed.replace(/,/g, '')
    : /^-?\d*,\d+$/.test(trimmed) ? trimmed.replace(',', '.') : trimmed;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Pulls a number into `[min, max]` and rounds it to `precision` decimals. */
export const clampNumber = (value: number, { min, max, precision }: NumberBounds) => {
  let next = value;
  if (max !== undefined && next > max) next = max;
  if (min !== undefined && next < min) next = min;
  return precision === undefined ? next : Number(next.toFixed(Math.min(Math.max(precision, 0), 100)));
};

/**
 * SpinButton reports a step or a Home/End key as `value`, and typed text as
 * `displayValue` alone. This turns either into the box's value: `number`,
 * `null` for an emptied field, or `undefined` for text to be ignored.
 */
export const resolveNumberChange = (data: SpinButtonOnChangeData, bounds: NumberBounds): number | null | undefined => {
  const raw = data.value !== undefined ? data.value : data.displayValue !== undefined ? parseNumberText(data.displayValue) : undefined;
  return typeof raw === 'number' ? clampNumber(raw, bounds) : raw;
};

// Fluent names the spin buttons in English whatever the app's language, so the
// label is supplied from the string table; a slot of the caller's own, in any of
// Fluent's shorthand forms, keeps its own say.
const labelSlot = (slot: SpinButtonProps['incrementButton'], label: string): SpinButtonProps['incrementButton'] => {
  if (slot === undefined) return { 'aria-label': label };
  if (slot === null || typeof slot !== 'object' || isValidElement(slot) || Symbol.iterator in slot) return slot;
  return { 'aria-label': label, ...slot };
};

/**
 * A numeric field drawn as the WinUI NumberBox with inline spin buttons. A
 * controlled wrapper over Fluent's SpinButton: typed text is parsed, clamped to
 * `min`/`max` and rounded to `precision` (by default the decimals of `step`)
 * before `onChange` sees it.
 */
export const NumberBox = forwardRef<HTMLInputElement, NumberBoxProps>(function NumberBox(
  { value, onChange, min, max, step, precision, decrementButton, incrementButton, ...rest },
  ref,
) {
  const { t } = useTranslation();
  const bounds: NumberBounds = { min, max, precision: precision ?? stepPrecision(step ?? 1) };

  const handleChange = (_event: unknown, data: SpinButtonOnChangeData) => {
    const next = resolveNumberChange(data, bounds);
    if (next !== undefined) onChange(next);
  };

  return <SpinButton
    {...rest}
    decrementButton={labelSlot(decrementButton, t('numberBox.decrement'))}
    incrementButton={labelSlot(incrementButton, t('numberBox.increment'))}
    max={max}
    min={min}
    onChange={handleChange}
    precision={precision}
    ref={ref}
    step={step}
    value={value}
  />;
});
