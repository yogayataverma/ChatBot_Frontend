// public/sw.js
const CACHE_NAME = 'chat-app-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/js/bundle.js',
        '/static/css/main.css',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Take control of all clients
      clients.claim()
    ])
  );
});

self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200],
      tag: 'chat-notification',
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
      ],
      data: {
        url: self.registration.scope
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'open') {
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Find existing chat window
          const chatClient = windowClients.find((client) => 
            client.url === urlToOpen
          );

          if (chatClient) {
            return chatClient.focus();
          }
          
          // Open new window if none exists
          return clients.openWindow(urlToOpen);
        })
    );
  }
});

// Handle fetch events for offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});