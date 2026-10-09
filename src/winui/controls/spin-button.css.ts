// Fluent's SpinButton repainted as a WinUI 3 NumberBox with
// SpinButtonPlacementMode="Inline".
//
// The field itself is a text control, so its fill, stroke and focus strip take
// the TextControl* brush set ./text-input.css.ts applies to Input; those rules
// are restated for the SpinButton root rather than shared because the root
// carries a different class and draws its border on ::before. What differs from
// a text control is the geometry: Fluent stacks a 24px column of two 16px
// halves at the end of the field, while the NumberBox puts two 32px buttons side
// by side, up before down, inside the field's border. The 12px chevrons they
// carry are swapped in by ../appearance.ts.
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox.xaml#L174-L175
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox.xaml#L182-L192
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox.xaml#L344
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox_themeresources.xaml#L34
// https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBox_themeresources.xaml#L40-L47
//
// The popup placement mode (a flyout holding the two buttons stacked) is not
// reproduced: a browser has no counterpart to a popup that opens under the
// focused field without taking focus from it.

const controlFillAppearances = `:is(\
[data-winui-appearance='outline'],\
[data-winui-appearance='filled-lighter'])`;

export const spinButtonCss = `
/* Grid: field, up, down. The field column is minmax(0, 1fr) so a long value
   cannot push the buttons out of the border. The root takes the field's 34px
   row (see ./text-input.css.ts) and NumberBoxMinWidth 120 for the whole box.
   Fluent's 24px end column, its column gap and its half-height rows give way;
   the buttons bring their own 4px margins.
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox_themeresources.xaml#L34
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox.xaml#L33
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox.xaml#L109-L111 */
.fui-SpinButton.fui-SpinButton {
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-rows: minmax(0, 1fr);
  column-gap: 0;
  min-height: 34px;
  min-width: 120px;
}

.fui-SpinButton__input.fui-SpinButton__input {
  grid-area: 1 / 1 / 2 / 2;
  min-width: 0;
}

/* Up is Margin 4 and down is 0,4,4,4, so the pair sits 4px from the edge and
   from each other, each at least 32 wide and as tall as the field less the
   margins. Fluent's buttons are absolutely positioned 16px halves with their
   own padding and a corner on one side only; all of that is replaced. The
   corner radius is the control's.
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox.xaml#L174-L175
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/NumberBox/NumberBox.xaml#L185-L189 */
.fui-SpinButton__incrementButton.fui-SpinButton__incrementButton,
.fui-SpinButton__decrementButton.fui-SpinButton__decrementButton {
  position: static;
  grid-row: 1;
  align-self: stretch;
  box-sizing: border-box;
  width: auto;
  min-width: 32px;
  height: auto;
  padding: 0;
  font-size: 12px;
  border-radius: var(--winui-control-corner-radius);
}

.fui-SpinButton__incrementButton.fui-SpinButton__incrementButton {
  grid-column: 2;
  margin: 4px;
}

.fui-SpinButton__decrementButton.fui-SpinButton__decrementButton {
  grid-column: 3;
  margin: 4px 4px 4px 0;
}

/* Redefining Background1 reaches the appearances the state rules below name.
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBox_themeresources.xaml#L23 */
.fui-SpinButton.fui-SpinButton {
  --colorNeutralBackground1: var(--winui-control-fill-default);
}

/* Hover, focus and disabled fills, with a text control's precedence: disabled
   over focused over pointer-over.
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBox_themeresources.xaml#L24-L26 */
.fui-SpinButton.fui-SpinButton${controlFillAppearances}:hover:not(:focus-within):not(:has(> .fui-SpinButton__input:disabled)) {
  background-color: var(--winui-control-fill-secondary);
}

.fui-SpinButton.fui-SpinButton${controlFillAppearances}:focus-within {
  background-color: var(--winui-control-fill-input-active);
}

.fui-SpinButton.fui-SpinButton${controlFillAppearances}:has(> .fui-SpinButton__input:disabled) {
  background-color: var(--winui-control-fill-disabled);
}

/* The strip is the accent while focused, including while pressed. Strokes:
   hover keeps the rest pair, focus flattens it, disabled sits one step lighter
   than the foundation's disabled stroke, and a rejected value does not recolour
   the field (see ./text-input.css.ts for why).
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBox_themeresources.xaml#L28-L30
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBox_themeresources.xaml#L57-L65 */
.fui-SpinButton.fui-SpinButton::after,
.fui-SpinButton.fui-SpinButton:focus-within:active::after {
  border-bottom-color: var(--winui-accent-base);
}

.fui-SpinButton.fui-SpinButton {
  --colorNeutralStroke1Hover: var(--winui-control-stroke-default);
  --colorNeutralStrokeAccessibleHover: var(--winui-control-strong-stroke-default);
  --colorNeutralStrokeAccessiblePressed: var(--winui-control-stroke-default);
  --colorNeutralStrokeDisabled: var(--winui-control-stroke-default);
  --colorPaletteRedBorder2: var(--colorNeutralStroke1);
}

.fui-SpinButton.fui-SpinButton:has(> .fui-SpinButton__input[aria-invalid='true']):not(:focus-within):not(:has(> .fui-SpinButton__input:disabled))::before {
  border-bottom-color: var(--colorNeutralStrokeAccessible);
}

/* Placeholder, text and button glyph colours. The inner buttons take
   TextControlButtonForeground: secondary at rest and hovered, tertiary pressed,
   where Fluent's ramp has them one step lighter. Their backgrounds
   (transparent, SubtleFill secondary, tertiary) are already what the foundation
   maps Fluent's subtle backgrounds to.
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBox_themeresources.xaml#L35-L38
   https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/TextBox_themeresources.xaml#L40-L47 */
.fui-SpinButton.fui-SpinButton {
  --colorNeutralForeground4: var(--winui-text-fill-secondary);
  --colorNeutralForeground3: var(--winui-text-fill-secondary);
  --colorNeutralForeground3Hover: var(--winui-text-fill-secondary);
  --colorNeutralForeground3Pressed: var(--winui-text-fill-tertiary);
}

.fui-SpinButton__input.fui-SpinButton__input:disabled {
  color: var(--winui-temporary-text-fill-disabled);
}
`;
