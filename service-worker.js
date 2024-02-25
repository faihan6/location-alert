self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('location-monitoring-pwa').then(cache => {
            return cache.addAll([
                'index.html',
                'app.js',
                'manifest.json'
                // Add other dependencies here
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
