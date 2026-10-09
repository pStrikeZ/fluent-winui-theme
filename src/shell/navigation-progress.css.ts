// The router's in-flight indicator, drawn as WinUI 3's ProgressBar held in its
// Indeterminate state.
//
// This module is part of the inlined critical block, whose other members spell
// their literals out because ../winui/tokens.ts only arrives with the linked
// stylesheet. The strip may name --winui-* anyway: a router navigation is the
// only thing that shows it, so it cannot paint before hydration.
import { progressIndeterminateCss } from '../winui/progress-indeterminate.css';

export const navigationProgressCss = `
  /* Only the thickness is WinUI's: ProgressBarMinHeight. No rail is painted
     under the indicators, because entering Indeterminate takes the track's
     opacity to 0. Clipping stands in for the ClipRect on the inner Border,
     which holds an indicator inside the control as it crosses.
     https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/ProgressBar/ProgressBar_themeresources.xaml#L29
     https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/ProgressBar/ProgressBar.xaml#L94-L99
     https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/ProgressBar/ProgressBar.xaml#L156

     The template states no fade between showing a ProgressBar and hiding one,
     so rather than invent a number the strip takes the duration and easing
     every WinUI control shares for a fast change.
     https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/CommonStyles/Common_themeresources_any.xaml#L602-L606 */
  .fwt-navigation-progress {
    height: 3px;
    inset: 0 0 auto;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    position: fixed;
    transition: opacity var(--winui-control-fast-animation-duration)
      var(--winui-control-fast-out-slow-in-easing);
    /* Above Fluent's portal mount at 1000000, which carries every dialog,
       drawer, popover and their scrims: a dialog's own action can navigate,
       and the strip is the only report that it is loading. */
    z-index: 1000001;
  }

  .fwt-navigation-progress[data-active='true'] { opacity: 1; }

  /* Both indicators are ProgressBarForeground, which is
     AccentFillColorDefaultBrush in either theme dictionary, and
     ProgressBarCornerRadius is 1.5.
     https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/ProgressBar/ProgressBar_themeresources.xaml#L6
     https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/ProgressBar/ProgressBar_themeresources.xaml#L31 */
  .fwt-navigation-progress::before,
  .fwt-navigation-progress::after {
    animation-play-state: paused;
    background-color: var(--winui-accent-fill-default);
    border-radius: 1.5px;
    content: '';
    inset: 0 auto 0 0;
    position: absolute;
  }
${progressIndeterminateCss('.fwt-navigation-progress::before', '.fwt-navigation-progress::after')}
  /* Paused rather than unanimated while idle, which is what makes the fade out
     a fade: an animation hung on the active state is removed when that state
     goes, snapping each indicator back off the left edge in one frame with
     nothing left for the opacity underneath to ease. */
  .fwt-navigation-progress[data-active='true']::before,
  .fwt-navigation-progress[data-active='true']::after {
    animation-play-state: running;
  }

  /* No reduced-motion variant, deliberately: the sweep indicates a state rather
     than carrying a transition, and the strip has nothing else to state it with
     -- a route load reports no progress, so there is no determinate width to
     fall back on. WinUI lands in the same place, stating one storyboard and no
     quieter variant. */

  /* WinUI's HighContrast dictionary answers the bar with a 1px WindowTextColor
     border and a HighlightColor foreground. The border is ProgressBarBorderBrush
     on ProgressBarRoot, the outermost Border, so content-box holds the 3px
     against the app's global border-box and the border is added around the
     strip rather than taken out of it. A forced palette repaints a colour it
     can reach, so the accent has to be handed over as the system keyword WinUI
     itself names -- left as a token it would be forced to the page background
     and the strip would vanish.
     https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/ProgressBar/ProgressBar_themeresources.xaml#L12-L18
     https://github.com/microsoft/microsoft-ui-xaml/blob/188f602b27cdb47572b28c380e9c087b02e1ccee/controls/dev/ProgressBar/ProgressBar.xaml#L155-L157 */
  @media (forced-colors: active) {
    .fwt-navigation-progress {
      border: 1px solid CanvasText;
      box-sizing: content-box;
    }
    .fwt-navigation-progress::before,
    .fwt-navigation-progress::after {
      background-color: Highlight;
    }
  }
`;
