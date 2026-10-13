import React, { useEffect, useState } from 'react';
import { OrbPet } from './components/OrbPet';
import { AssistantPanel } from './components/AssistantPanel';
import { FullScreenAlertOverlay } from './components/FullScreenAlertOverlay';

export const App: React.FC = () => {
  const [route, setRoute] = useState<'pet' | 'assistant' | 'fullscreen-alert' | 'dev-preview'>('pet');

  useEffect(() => {
    const updateRoute = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'fullscreen-alert' || hash === 'alert') {
        setRoute('fullscreen-alert');
      } else if (hash === 'assistant') {
        setRoute('assistant');
      } else if (hash === 'pet') {
        setRoute('pet');
      } else {
        // If loaded in a normal web browser directly during dev
        setRoute(window.mochiApi ? 'pet' : 'dev-preview');
      }
    };

    updateRoute();
    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);

  if (route === 'fullscreen-alert') {
    return <FullScreenAlertOverlay />;
  }

  if (route === 'pet') {
    return <OrbPet />;
  }

  if (route === 'assistant') {
    return <AssistantPanel />;
  }

  // Dual dev preview mode when opened in browser outside electron
  return (
    <div className="dev-preview-wrapper">
      <div className="dev-header">
        <span>Mochi Companion (Browser Dev Preview)</span>
        <div className="dev-actions">
          <a href="#pet" className="btn btn-sm btn-outline">Pet Mode</a>
          <a href="#assistant" className="btn btn-sm btn-primary">Assistant Mode</a>
        </div>
      </div>
      <div className="dev-content-split">
        <div className="dev-pet-box">
          <OrbPet />
        </div>
        <div className="dev-assistant-box">
          <AssistantPanel />
        </div>
      </div>
    </div>
  );
};
