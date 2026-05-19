import {
  queuedCheckinSubmissionSchema,
  type QueuedCheckinSubmission,
} from "@/lib/schemas/queuedCheckinSchema";
import type { ValidateChallengeRequest } from "@/services/challengeApi";

const DB_NAME = "scout-offline-db";
const DB_VERSION = 1;
const STORE_NAME = "checkinQueue";

function generateQueueId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  const db = await openDb();

  try {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = await operation(store);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    return result;
  } finally {
    db.close();
  }
}

function requestToPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueCheckinSubmission(
  challengeId: string,
  payload: ValidateChallengeRequest,
): Promise<QueuedCheckinSubmission> {
  const candidate: QueuedCheckinSubmission = {
    id: generateQueueId(),
    challengeId,
    payload,
    queuedAt: new Date().toISOString(),
    retries: 0,
  };

  const parsed = queuedCheckinSubmissionSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error("Payload inválido para fila offline de check-in.");
  }

  const item = parsed.data;

  await withStore("readwrite", async (store) => {
    await requestToPromise(store.put(item));
    return undefined;
  });

  return item;
}

export async function getQueuedCheckinsCount(): Promise<number> {
  return withStore("readonly", async (store) => {
    const count = await requestToPromise(store.count());
    return Number(count);
  });
}

export async function flushCheckinQueue(
  submit: (
    challengeId: string,
    payload: ValidateChallengeRequest,
  ) => Promise<unknown>,
): Promise<{ synced: number; remaining: number }> {
  const all = await withStore("readonly", async (store) => {
    const items = await requestToPromise<unknown[]>(store.getAll());
    return items;
  });

  const validItems: QueuedCheckinSubmission[] = [];
  const invalidIds: string[] = [];

  for (const item of all) {
    const parsed = queuedCheckinSubmissionSchema.safeParse(item);
    if (parsed.success) {
      validItems.push(parsed.data);
      continue;
    }

    const maybeId =
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      typeof (item as { id?: unknown }).id === "string"
        ? (item as { id: string }).id
        : null;

    if (maybeId) {
      invalidIds.push(maybeId);
    }
  }

  if (invalidIds.length > 0) {
    await withStore("readwrite", async (store) => {
      for (const id of invalidIds) {
        await requestToPromise(store.delete(id));
      }

      return undefined;
    });
  }

  const sorted = validItems.sort((a, b) =>
    a.queuedAt.localeCompare(b.queuedAt),
  );

  let synced = 0;

  for (const item of sorted) {
    try {
      await submit(item.challengeId, item.payload);

      await withStore("readwrite", async (store) => {
        await requestToPromise(store.delete(item.id));
        return undefined;
      });

      synced++;
    } catch (error) {
      await withStore("readwrite", async (store) => {
        const updated: QueuedCheckinSubmission = {
          ...item,
          retries: item.retries + 1,
          lastError:
            error instanceof Error ? error.message : "erro desconhecido",
        };

        await requestToPromise(store.put(updated));
        return undefined;
      });
    }
  }

  const remaining = await getQueuedCheckinsCount();
  return { synced, remaining };
}
