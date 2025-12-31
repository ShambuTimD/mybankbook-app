import '../css/app.css';
import 'datatables.net-responsive-dt';
import 'datatables.net-select-dt';
import './bootstrap';

import { StrictMode } from "react";
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { AppWrapper } from "./Components/common/PageMeta.jsx";
import { ThemeProvider } from "./Context/ThemeContext.jsx";
import AppLayout from "./Layout/AppLayout";
import { Toaster } from 'react-hot-toast';


const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,

  resolve: async (name) => {
    const pages = import.meta.glob('./Pages/**/*.{js,jsx}');
    const page = pages[`./Pages/${name}.jsx`] || pages[`./Pages/${name}.js`];

    if (!page) {
      throw new Error(`Page not found: ${name}`);
    }

    const module = await page();
    const Component = module.default;

    // ✅ Respect per-page layout overrides
    if (typeof Component.layout === 'undefined') {
      // Default to AppLayout if layout not defined
      Component.layout = (page) => {
        const user = page?.props?.auth?.user;
        return user ? <AppLayout>{page}</AppLayout> : page;
      };
    } else if (Component.layout === null) {
      // If explicitly set to null, use no layout
      Component.layout = (page) => page;
    }

    return Component;
  },

  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <StrictMode>
        <ThemeProvider>
          <AppWrapper>
            <Toaster position="top-center" toastOptions={{ className: 'mt-3' }} />
            <App {...props} />
          </AppWrapper>
        </ThemeProvider>
      </StrictMode>
    );
  },

  progress: {
    color: '#4B5563',
  },
});
