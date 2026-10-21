import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';

// Safeguard against third-party extensions, translation tools, or Google Translate
// mutating DOM nodes outside of React's reconciliation cycle.
if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (console) {
        console.warn('[DOM Safeguard] Cannot remove a child from a different parent:', this, child);
      }
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.warn('[DOM Safeguard] Cannot insert before a reference node from a different parent:', this, referenceNode, newNode);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}

// Registro do Service Worker para suporte PWA e notificações nativas
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
    }).catch((err) => {
      console.warn('[PWA] Falha ao registrar Service Worker:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
