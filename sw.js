self.addEventListener("install", () => {
  console.log("Service Worker installato ✅");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
