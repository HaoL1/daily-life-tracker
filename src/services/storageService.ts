export interface StorageStatus {
  supported: boolean
  persistent: boolean
}

export async function requestPersistentStorage(): Promise<StorageStatus> {
  if (!navigator.storage?.persist) {
    return { supported: false, persistent: false }
  }

  const alreadyPersistent = await navigator.storage.persisted()
  if (alreadyPersistent) return { supported: true, persistent: true }

  return {
    supported: true,
    persistent: await navigator.storage.persist(),
  }
}
