// ===== FIREBASE CLOUD MESSAGING (background push) =====
// Must be loaded via importScripts (compat build) — Service Workers can't
// use the modular SDK the way index.html does. This runs alongside the
// existing cache/fetch logic below without touching it.
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBUGF8SWdjPg0NSwOlapu_vYnx740fQy9s",
  authDomain: "vaadplus-c0cc1.firebaseapp.com",
  projectId: "vaadplus-c0cc1",
  storageBucket: "vaadplus-c0cc1.firebasestorage.app",
  messagingSenderId: "369349440346",
  appId: "1:369349440346:web:4aa1d03e44f9ffa46b7963"
});

const fcmMessaging = firebase.messaging();
// Handles messages while the app is closed/in background. Reuses the same
// showNotification() shape as the existing generic 'push' handler below,
// so notification styling stays consistent regardless of source.
fcmMessaging.onBackgroundMessage((payload) => {
  const data = payload.notification || {};
  self.registration.showNotification(data.title || 'ועד בית פלוס', {
    body: data.body || '',
    icon: '/vaadplus/icon-192.png',
    badge: '/vaadplus/icon-192.png'
  });
});

const CACHE_NAME = 'vaad-bait-plus-v2';
const ASSETS = [
  '/vaadplus/',
  '/vaadplus/index.html',
  '/vaadplus/manifest.json',
  '/vaadplus/icon-192.png',
  '/vaadplus/icon-512.png'
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for Firebase, cache first for assets
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase / Google APIs — always network, no cache
  if (
    url.includes('firestore') ||
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('nominatim') ||
    url.includes('cdnjs')
  ) {
    return;
  }

  // App assets — cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache valid responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return main page
        if (e.request.mode === 'navigate') {
          return caches.match('/vaadplus/index.html');
        }
      });
    })
  );
});

// Background sync placeholder (improves PWABuilder score)
self.addEventListener('sync', e => {
  console.log('Background sync:', e.tag);
});

// Push notifications placeholder (improves PWABuilder score)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  self.registration.showNotification(data.title || 'ועד בית פלוס', {
    body: data.body || '',
    icon: '/vaadplus/icon-192.png',
    badge: '/vaadplus/icon-192.png'
  });
});
