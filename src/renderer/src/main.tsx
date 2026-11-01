import { createRoot } from 'react-dom/client';
import { AppRoutes } from './routes/app.routes';
import { WithProviders } from './providers';
import { TitleBar } from './components/TitleBar';
import { StartupReveal } from './components/StartupReveal';

createRoot(document.getElementById('root')!).render(
  <WithProviders>
    <TitleBar />
    <div style={{ height: 'var(--app-height)', overflow: 'auto' }}>
      <StartupReveal>
        <AppRoutes />
      </StartupReveal>
    </div>
  </WithProviders>,
);
