// Floway drives this from react-router's `useNavigation()`; here the host says
// when a navigation is in flight.
// https://github.com/Menci/Floway/blob/fee9533cc3ed5cba8028e53e53ca13d2e64d91af/apps/web/src/components/navigation-progress.tsx
export function NavigationProgress({ active }: { active: boolean }) {
  return <div aria-hidden="true" className="fwt-navigation-progress" data-active={active} />;
}
