import type { ButtonProps } from '@fluentui/react-components';
import { ArrowUploadRegular, DismissRegular, DocumentRegular } from '@fluentui/react-icons';
import { useId, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent, MouseEventHandler, ReactNode } from 'react';

import { fluentComponents } from '../../fluent';
import { useTranslation } from '../../i18n/translation';

const { Button, Text, makeStyles, mergeClasses, shorthands } = fluentComponents;

// WinUI ships no drop zone, so this is composed from the resources a card and a
// clickable card take: the card fill and its pointer ramp, the control corner
// radius, and the focus visual. The dashed stroke is ours -- no WinUI border is
// dashed -- and uses the surface stroke, the one neutral stroke visible against
// both fills. While a drag is over, the stroke and the wash take the accent the
// way a selected item does.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/Common_themeresources_any.xaml#L250-L265
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/Common_themeresources_any.xaml#L254-L257
const useStyles = makeStyles({
  root: {
    display: 'grid',
    rowGap: '8px',
    minWidth: 0,
  },
  zone: {
    alignItems: 'center',
    backgroundColor: 'var(--winui-card-background-fill-default)',
    ...shorthands.border('1px', 'dashed', 'var(--winui-surface-stroke-default)'),
    borderRadius: 'var(--winui-control-corner-radius)',
    boxSizing: 'border-box',
    color: 'var(--winui-text-fill-primary)',
    cursor: 'pointer',
    display: 'grid',
    justifyItems: 'center',
    minHeight: '120px',
    padding: '24px 16px',
    rowGap: '4px',
    textAlign: 'center',
    transitionDuration: 'var(--winui-control-faster-animation-duration)',
    transitionProperty: 'background-color, border-color',
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms' },
    '&:hover': { backgroundColor: 'var(--winui-control-fill-secondary)' },
    '&:active': { backgroundColor: 'var(--winui-control-fill-tertiary)' },
    // The system focus visual, as ./settings-card draws it.
    '&:focus-visible': {
      boxShadow: '0 0 0 1px var(--winui-focus-stroke-inner)',
      outlineColor: 'var(--winui-focus-stroke-outer)',
      outlineOffset: '1px',
      outlineStyle: 'solid',
      outlineWidth: '2px',
    },
  },
  dragOver: {
    backgroundColor: 'var(--winui-accent-tint-fill-default)',
    ...shorthands.borderColor('var(--winui-accent-base)'),
    '&:hover': { backgroundColor: 'var(--winui-accent-tint-fill-default)' },
    '&:active': { backgroundColor: 'var(--winui-accent-tint-fill-secondary)' },
  },
  disabled: {
    backgroundColor: 'var(--winui-control-fill-disabled)',
    color: 'var(--winui-text-fill-disabled)',
    cursor: 'not-allowed',
    '&:hover': { backgroundColor: 'var(--winui-control-fill-disabled)' },
    '&:active': { backgroundColor: 'var(--winui-control-fill-disabled)' },
  },
  icon: {
    color: 'var(--winui-text-fill-secondary)',
    display: 'inline-flex',
    fontSize: '24px',
    lineHeight: 0,
    pointerEvents: 'none',
  },
  iconDragOver: { color: 'var(--winui-accent-base)' },
  list: {
    display: 'grid',
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    rowGap: '4px',
  },
  file: {
    alignItems: 'center',
    backgroundColor: 'var(--winui-card-background-fill-default)',
    ...shorthands.border('1px', 'solid', 'var(--winui-card-stroke-default)'),
    borderRadius: 'var(--winui-control-corner-radius)',
    columnGap: '8px',
    display: 'flex',
    minHeight: '40px',
    paddingBlock: '4px',
    paddingInlineStart: '12px',
    paddingInlineEnd: '4px',
  },
  fileName: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** `1536` as "1.5 KB": binary steps, one decimal where it is not a whole number. */
export const formatFileSize = (bytes: number) => {
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < BYTE_UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const text = new Intl.NumberFormat(undefined, { maximumFractionDigits: unit === 0 ? 0 : 1 }).format(size);
  return `${text} ${BYTE_UNITS[unit]}`;
};

/**
 * Whether a file satisfies an `accept` string -- the `.ext`, `type/*` and
 * `type/subtype` tokens of an `<input type="file">`. The browser's own dialog
 * enforces this for browsing; a drop carries no such filter, so it is applied
 * here. No `accept` takes every file.
 * https://html.spec.whatwg.org/multipage/input.html#attr-input-accept
 */
export const matchesAccept = (file: Pick<File, 'name' | 'type'>, accept?: string) => {
  const tokens = accept?.split(',').map(token => token.trim().toLowerCase()).filter(Boolean) ?? [];
  if (tokens.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some(token => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
};

const pickFiles = (files: Iterable<File>, accept: string | undefined, multiple: boolean | undefined) => {
  const accepted = [...files].filter(file => matchesAccept(file, accept));
  return multiple ? accepted : accepted.slice(0, 1);
};

export interface FileDropZoneProps {
  /** An `<input type="file">` accept string, applied to the dialog and to dropped files alike. */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Called with the chosen or dropped files; files `accept` rules out never reach it. */
  onFiles: (files: File[]) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Shown above the title. Defaults to an upload arrow. */
  icon?: ReactNode;
  /** Files already chosen, listed under the zone. */
  selectedFiles?: readonly File[];
  /** Called when a listed file's remove button is pressed. Without it the list has no remove buttons. */
  onRemove?: (file: File, index: number) => void;
  className?: string;
}

/**
 * A drop target that is also a button: dropping files on it, or activating it
 * and choosing from the system dialog, both end in `onFiles`.
 */
export function FileDropZone({
  accept, className, description, disabled, icon, multiple, onFiles, onRemove, selectedFiles, title,
}: FileDropZoneProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  // dragenter and dragleave fire for every child the pointer crosses, so a
  // boolean flickers; a depth count is zero only when the drag has really left.
  const depth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const titleId = useId();

  const reset = () => {
    depth.current = 0;
    setDragOver(false);
  };

  const emit = (files: Iterable<File>) => {
    const picked = pickFiles(files, accept, multiple);
    if (picked.length > 0) onFiles(picked);
  };

  const open = () => { if (!disabled) inputRef.current?.click(); };

  const handleDragEnter = (event: DragEvent) => {
    if (disabled) return;
    event.preventDefault();
    depth.current += 1;
    setDragOver(true);
  };
  const handleDragOver = (event: DragEvent) => {
    if (disabled) return;
    // Without this the browser refuses the drop.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };
  const handleDragLeave = () => {
    if (disabled) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragOver(false);
  };
  const handleDrop = (event: DragEvent) => {
    if (disabled) return;
    event.preventDefault();
    reset();
    emit(Array.from(event.dataTransfer.files));
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Cleared so choosing the same file again still raises a change.
    event.target.value = '';
    emit(files);
  };

  return <div className={mergeClasses(styles.root, className)}>
    <div
      aria-disabled={disabled || undefined}
      aria-labelledby={titleId}
      className={mergeClasses(styles.zone, dragOver && styles.dragOver, disabled && styles.disabled)}
      data-drag-over={dragOver || undefined}
      onClick={open}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <span aria-hidden className={mergeClasses(styles.icon, dragOver && styles.iconDragOver)}>{icon ?? <ArrowUploadRegular />}</span>
      <Text id={titleId} size={300} weight="semibold">{dragOver ? t('fileDropZone.dropHint') : title}</Text>
      {description !== undefined && <Text size={200} className="text-fui-fg2">{description}</Text>}
    </div>
    <input
      accept={accept}
      disabled={disabled}
      hidden
      multiple={multiple}
      onChange={handleInputChange}
      ref={inputRef}
      tabIndex={-1}
      type="file"
    />
    {selectedFiles !== undefined && selectedFiles.length > 0 && <ul className={styles.list}>
      {selectedFiles.map((file, index) => <li className={styles.file} key={`${file.name}:${file.size}:${file.lastModified}:${index}`}>
        <DocumentRegular aria-hidden className="text-fui-fg2 shrink-0" />
        <Text className={styles.fileName} size={300} title={file.name}>{file.name}</Text>
        <Text className="text-fui-fg2 shrink-0" size={200}>{formatFileSize(file.size)}</Text>
        {onRemove && <Button
          appearance="subtle"
          aria-label={`${t('fileDropZone.remove')}: ${file.name}`}
          icon={<DismissRegular />}
          onClick={() => onRemove(file, index)}
          size="small"
        />}
      </li>)}
    </ul>}
  </div>;
}

export type FilePickerButtonProps = Omit<ButtonProps, 'as' | 'onClick'> & {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

/** A Button that opens the system file dialog and hands what was chosen to `onFiles`. */
export function FilePickerButton({ accept, children, disabled, multiple, onClick, onFiles, ...rest }: FilePickerButtonProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  // `ButtonProps` is a union over the element Button renders as, and a prop
  // object spread from the narrowed `Omit` above matches none of its members.
  const buttonProps = {
    ...rest,
    disabled,
    onClick: (event: Parameters<MouseEventHandler<HTMLButtonElement>>[0]) => {
      onClick?.(event);
      if (!event.defaultPrevented) inputRef.current?.click();
    },
  } as ButtonProps;

  return <>
    <Button {...buttonProps}>{children ?? t('fileDropZone.browse')}</Button>
    <input
      accept={accept}
      disabled={disabled}
      hidden
      multiple={multiple}
      onChange={event => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        if (files.length > 0) onFiles(files);
      }}
      ref={inputRef}
      tabIndex={-1}
      type="file"
    />
  </>;
}
