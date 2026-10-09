import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileDropZone, FilePickerButton, formatFileSize, matchesAccept } from '../../../src/components/ui/file-drop-zone';
import { renderInApp } from '../../render';

const file = (name: string, type: string, size = 3) => new File([new Uint8Array(size)], name, { type });
const fileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;

const drop = (target: Element, files: File[]) => fireEvent.drop(target, { dataTransfer: { files } });

describe('file drop zone', () => {
  it('hands dropped files to onFiles', () => {
    const onFiles = vi.fn();
    renderInApp(<FileDropZone multiple onFiles={onFiles} title="Drop here" />);
    const files = [file('a.txt', 'text/plain'), file('b.png', 'image/png')];

    drop(screen.getByRole('button', { name: 'Drop here' }), files);

    expect(onFiles).toHaveBeenCalledWith(files);
  });

  it('takes only the first file unless multiple', () => {
    const onFiles = vi.fn();
    renderInApp(<FileDropZone onFiles={onFiles} title="Drop here" />);
    const [first, second] = [file('a.txt', 'text/plain'), file('b.txt', 'text/plain')];

    drop(screen.getByRole('button'), [first, second]);

    expect(onFiles).toHaveBeenCalledWith([first]);
  });

  it('filters dropped files by accept', () => {
    const onFiles = vi.fn();
    renderInApp(<FileDropZone accept="image/*,.pdf" multiple onFiles={onFiles} title="Drop here" />);
    const keep = [file('a.png', 'image/png'), file('b.PDF', 'application/pdf')];

    drop(screen.getByRole('button'), [...keep, file('c.txt', 'text/plain')]);
    expect(onFiles).toHaveBeenLastCalledWith(keep);

    onFiles.mockClear();
    drop(screen.getByRole('button'), [file('c.txt', 'text/plain')]);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('reports files chosen through the hidden input', () => {
    const onFiles = vi.fn();
    const { container } = renderInApp(<FileDropZone onFiles={onFiles} title="Drop here" />);
    const chosen = file('a.txt', 'text/plain');

    fireEvent.change(fileInput(container), { target: { files: [chosen] } });

    expect(onFiles).toHaveBeenCalledWith([chosen]);
  });

  it('opens the dialog from the keyboard', () => {
    const { container } = renderInApp(<FileDropZone onFiles={() => {}} title="Drop here" />);
    const click = vi.spyOn(fileInput(container), 'click');

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('marks a drag in progress and clears it on leave', () => {
    renderInApp(<FileDropZone onFiles={() => {}} title="Drop here" />);
    const zone = screen.getByRole('button');

    fireEvent.dragEnter(zone);
    expect(zone.hasAttribute('data-drag-over')).toBe(true);

    fireEvent.dragLeave(zone);
    expect(zone.hasAttribute('data-drag-over')).toBe(false);
  });

  it('ignores drops and keys while disabled', () => {
    const onFiles = vi.fn();
    const { container } = renderInApp(<FileDropZone disabled onFiles={onFiles} title="Drop here" />);
    const zone = screen.getByRole('button');
    const click = vi.spyOn(fileInput(container), 'click');

    drop(zone, [file('a.txt', 'text/plain')]);
    fireEvent.keyDown(zone, { key: 'Enter' });
    fireEvent.click(zone);

    expect(onFiles).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });

  it('lists selected files and removes one by name', () => {
    const onRemove = vi.fn();
    const files = [file('a.txt', 'text/plain', 2048), file('b.txt', 'text/plain')];
    renderInApp(<FileDropZone onFiles={() => {}} onRemove={onRemove} selectedFiles={files} title="Drop here" />);

    expect(screen.getByText('2 KB')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove file: b.txt' }));

    expect(onRemove).toHaveBeenCalledWith(files[1], 1);
  });
});

describe('file picker button', () => {
  it('opens the dialog and reports the choice', () => {
    const onFiles = vi.fn();
    const { container } = renderInApp(<FilePickerButton accept=".txt" onFiles={onFiles}>Choose</FilePickerButton>);
    const input = fileInput(container);
    const click = vi.spyOn(input, 'click');
    const chosen = file('a.txt', 'text/plain');

    fireEvent.click(screen.getByRole('button', { name: 'Choose' }));
    fireEvent.change(input, { target: { files: [chosen] } });

    expect(click).toHaveBeenCalledTimes(1);
    expect(input.accept).toBe('.txt');
    expect(onFiles).toHaveBeenCalledWith([chosen]);
  });
});

describe('file helpers', () => {
  it('matches accept tokens', () => {
    expect(matchesAccept({ name: 'a.txt', type: '' })).toBe(true);
    expect(matchesAccept({ name: 'a.txt', type: 'text/plain' }, 'text/plain')).toBe(true);
    expect(matchesAccept({ name: 'a.txt', type: 'text/plain' }, 'image/*')).toBe(false);
    expect(matchesAccept({ name: 'A.JSON', type: '' }, '.json')).toBe(true);
  });

  it('formats sizes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });
});
