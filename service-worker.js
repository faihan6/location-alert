const cacheName = 'location-monitoring-pwa'

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                // 'index.html',
                // 'app.js',
                // 'manifest.json'
                // Add other dependencies here
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
        .then(async response => {
            if (response && response.status === 200) {
                const cache = await caches.open(cacheName)
                cache.put(event.request, response.clone());
            }
          return response;
        })
        .catch(async () => {
            // If the network request fails, try to get the response from the cache
            const cacheResponse = await caches.match(event.request);
            return cacheResponse || new Response('Offline Content Here', { status: 500 });
        })
      );
});
