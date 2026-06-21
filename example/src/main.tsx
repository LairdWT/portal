import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@laird-wt/portal/styles.css';

import { App } from './App';

const rootElement: HTMLElement | null = document.getElementById('root');

if (rootElement === null) {
    throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
