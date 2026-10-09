import type { PropsWithChildren } from 'react';

export function GradientBackground({ children }: PropsWithChildren) {
  return <div className="fwt-gradient-background">{children}</div>;
}
