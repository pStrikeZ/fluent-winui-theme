import '@pstrikez/fluent-winui-theme/base.css';
import '@pstrikez/fluent-winui-theme/winui.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
