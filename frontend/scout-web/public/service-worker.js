const CACHE_VERSION = "v1";
const APP_SHELL_CACHE = `scout-app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `scout-runtime-${CACHE_VERSION}`;
const APP_SHELL_ASSETS = ["/", "/index.html", "/favicon.svg", "/icons.svg"];
const OFFLINE_DB = "scout-sw-offline-db";
const OFFLINE_DB_VERSION = 1;
const OFFLINE_STORE = "failedCheckins";
const SYNC_TAG = "sync-offline-checkins";

function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB, OFFLINE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        db.createObjectStore(OFFLINE_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withOfflineStore(mode, operation) {
  const db = await openOfflineDb();

  try {
    const tx = db.transaction(OFFLINE_STORE, mode);
    const store = tx.objectStore(OFFLINE_STORE);
    const result = await operation(store);

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    return result;
  } finally {
    db.close();
  }
}

function isCheckinValidationRequest(request, url) {
  return (
    request.method === "POST" &&
    /\/api\/challenges\/[^/]+\/validate$/i.test(url.pathname)
  );
}

function parseChallengeId(pathname) {
  const match = pathname.match(/\/api\/challenges\/([^/]+)\/validate$/i);
  return match ? match[1] : "offline-checkin";
}

async function enqueueFailedCheckin(request) {
  const url = new URL(request.url);
  const headers = {
    "content-type": request.headers.get("content-type") || "application/json",
  };

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.authorization = authorization;
  }

  const bodyText = await request.clone().text();
  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    url: request.url,
    method: request.method,
    headers,
    bodyText,
    challengeId: parseChallengeId(url.pathname),
    queuedAt: new Date().toISOString(),
    retries: 0,
  };

  await withOfflineStore("readwrite", async (store) => {
    await requestToPromise(store.put(item));
    return undefined;
  });

  return item;
}

async function drainOfflineCheckins() {
  const queued = await withOfflineStore("readonly", async (store) => {
    const items = await requestToPromise(store.getAll());
    return items.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
  });

  for (const item of queued) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.bodyText,
      });

      if (!response.ok && response.status !== 409) {
        throw new Error(`status_${response.status}`);
      }

      await withOfflineStore("readwrite", async (store) => {
        await requestToPromise(store.delete(item.id));
        return undefined;
      });
    } catch {
      await withOfflineStore("readwrite", async (store) => {
        await requestToPromise(
          store.put({
            ...item,
            retries: Number(item.retries || 0) + 1,
          }),
        );
        return undefined;
      });
    }
  }
}

async function handleOfflineCheckinFallback(request) {
  const url = new URL(request.url);
  const challengeId = parseChallengeId(url.pathname);
  const bodyText = await request.clone().text();

  let payload = {};
  try {
    payload = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    payload = {};
  }

  const queued = await enqueueFailedCheckin(request);

  if (self.registration && self.registration.sync) {
    try {
      await self.registration.sync.register(SYNC_TAG);
    } catch {
      // Some browsers block Background Sync; manual trigger will still work.
    }
  }

  return new Response(
    JSON.stringify({
      id: `offline-${queued.id}`,
      challengeId,
      patrulhaId: payload.PatrulhaId || payload.patrulhaId || "offline-patrol",
      userId: payload.UserId || payload.userId || "offline-user",
      status: 0,
      pointsAwarded: 0,
      failReason:
        "Sem conexão. Submissão capturada pelo Service Worker para sincronização.",
      attemptedAt: new Date().toISOString(),
      validatedAt: null,
    }),
    {
      status: 202,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

async function submitWithOfflineFallback(request) {
  try {
    return await fetch(request.clone());
  } catch {
    return handleOfflineCheckinFallback(request);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(drainOfflineCheckins());
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SYNC_OFFLINE_CHECKINS") {
    if (event.waitUntil) {
      event.waitUntil(drainOfflineCheckins());
    } else {
      void drainOfflineCheckins();
    }
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (isCheckinValidationRequest(request, url)) {
    event.respondWith(submitWithOfflineFallback(request));
    return;
  }

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    if (request.mode === "navigate") {
      const fallback = await caches.match("/index.html");
      if (fallback) {
        return fallback;
      }
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable",
  });
}
