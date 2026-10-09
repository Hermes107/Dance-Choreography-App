const DATABASE_NAME = "stagecraft-local-media";
const STORE_NAME = "audio-files";
const DATABASE_VERSION = 1;

let databasePromise: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support local audio storage."));
      return;
    }
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local audio storage."));
    request.onblocked = () => reject(new Error("Local audio storage is blocked by another browser tab."));
  });
  return databasePromise;
}

function runRequest<T>(
  mode: IDBTransactionMode,
  requestForStore: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        let result: T;
        const transaction = database.transaction(STORE_NAME, mode);
        const request = requestForStore(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(request.error ?? new Error("Local audio storage failed."));
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error ?? new Error("Local audio storage failed."));
        transaction.onabort = () => reject(transaction.error ?? new Error("Local audio storage was interrupted."));
      }),
  );
}

export function saveLocalAudio(projectId: string, file: Blob): Promise<void> {
  return runRequest("readwrite", (store) => store.put(file, projectId)).then(() => undefined);
}

export function loadLocalAudio(projectId: string): Promise<Blob | undefined> {
  return runRequest<Blob | undefined>("readonly", (store) => store.get(projectId));
}

export function deleteLocalAudio(projectId: string): Promise<void> {
  return runRequest("readwrite", (store) => store.delete(projectId)).then(() => undefined);
}
