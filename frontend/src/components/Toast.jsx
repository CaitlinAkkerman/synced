import React, { useState, useEffect } from 'react';
import '../styles/Toast.css';

const MESSAGES = {
  'log-created':    ["Logged. The calendar has been warned.", "Duly noted by the cycle gods.", "Recorded. May it bring you peace.", "Logged. Your uterus thanks you.", "Done. Science has been served."],
  'log-updated':    ["Updated. History rewritten.", "Fixed. The calendar forgives you.", "Saved. A minor correction to the record.", "Edited. We won't ask why."],
  'log-deleted':    ["Gone. It never happened.", "Deleted. The calendar has been revised.", "Erased. Moving on.", "Poof. History edited."],
  'profile-added':  ["New profile created. Welcome to the chaos.", "Another one joins the cycle.", "Profile added. They're one of us now.", "Added. The more the merrier. Sort of."],
  'profile-updated':["Saved. Glow up complete.", "Updated. New stats, same chaos.", "Profile refreshed. Looking good."],
  'profile-deleted':["Gone. As if they never cycled.", "Deleted. Fare well.", "Profile removed. The data has been set free."],
  'default':        ["Done.", "Saved.", "Got it.", "Consider it handled.", "✓"],
};

function getToastMessage(type) {
  const pool = MESSAGES[type] || MESSAGES['default'];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function showToast(type = 'default') {
  window.dispatchEvent(new CustomEvent('synced-toast', { detail: { type } }));
}

function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = Date.now();
      const message = getToastMessage(e.detail?.type);
      setToasts(prev => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    window.addEventListener('synced-toast', handler);
    return () => window.removeEventListener('synced-toast', handler);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default Toast;
