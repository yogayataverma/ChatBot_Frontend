// sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
  });
  
  self.addEventListener('push', (event) => {
    const options = {
      body: event.data.text(),
      icon: '/chat-icon.png',
      badge: '/chat-badge.png',
      vibrate: [200, 100, 200],
      tag: 'chat-message',
      renotify: true,
      actions: [
        {
          action: 'open',
          title: 'Open Chat'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ]
    };
  
    event.waitUntil(
      self.registration.showNotification('New Message in Connectify', options)
    );
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
  
    if (event.action === 'open') {
      const urlToOpen = new URL('/', self.location.origin).href;
  
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
          // Check if there is already a window/tab open with the target URL
          for (const client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window/tab is open, open one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
      );
    }
  });