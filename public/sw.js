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
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      clients.claim()
    ])
  );
});

self.addEventListener('push', async (event) => {
  try {
    console.log('Push event received:', event);
    
    if (!event.data) {
      console.warn('Push event has no data');
      return;
    }

    let data;
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Failed to parse push event data:', error);
      return;
    }

    if (!data.title || !data.body) {
      console.error('Missing required notification data');
      return;
    }

    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200],
      tag: `chat-notification-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
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
        url: self.registration.scope,
        timestamp: Date.now()
      }
    };

    event.waitUntil(
      (async () => {
        try {
          await self.registration.showNotification(data.title, options);
          console.log('Notification displayed successfully');
        } catch (error) {
          console.error('Failed to show notification:', error);
        }
      })()
    );
  } catch (error) {
    console.error('Error handling push event:', error);
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
          const chatClient = windowClients.find((client) => 
            client.url === urlToOpen
          );

          if (chatClient) {
            return chatClient.focus();
          }
          
          return clients.openWindow(urlToOpen);
        })
    );
  }
});

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
