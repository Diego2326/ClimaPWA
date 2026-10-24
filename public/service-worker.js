const CACHE = 'clima-v1'
const SHELL = ['/', '/manifest.webmanifest', '/clima-icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  const isWeatherApi = url.hostname.endsWith('open-meteo.com')
  if (request.method !== 'GET' || (url.origin !== self.location.origin && !isWeatherApi)) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()))
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        if (request.mode === 'navigate') return (await caches.match('/')) || Response.error()
        return Response.error()
      }),
  )
})
