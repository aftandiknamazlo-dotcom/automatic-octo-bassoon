import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/Toast'
import { usePWA } from './hooks/usePWA'

// CRITICAL: Unregister all Service Workers in dev mode before app starts
// This fixes Vite HMR issues with sw.js caching
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (isDev && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      reg.unregister();
      console.log('[Dev] Service Worker unregistered:', reg.scope);
    });
  });
  // Also clear all caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}

// Initialize PWA (only works in production now)
const PWAInitializer = () => {
  usePWA();
  return null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <PWAInitializer />
      <App />
    </ToastProvider>
  </StrictMode>,
)
