import type { PageBoxStore } from "@pagebox/types";

const STORAGE_KEY = "pagebox_store";

const EMPTY_STORE: PageBoxStore = {
  version: 1,
  folders: [],
  tabs: [],
  windows: [],
};

export class LocalStorageRepository {
  async getStore(): Promise<PageBoxStore> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const store = result[STORAGE_KEY] as PageBoxStore | undefined;
    return store ?? { ...EMPTY_STORE };
  }

  async saveStore(store: PageBoxStore): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEY]: store });
  }

  async clear(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY);
  }
}

export const storageRepository = new LocalStorageRepository();
