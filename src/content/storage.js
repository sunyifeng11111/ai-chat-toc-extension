(() => {
  const ROOT_KEY = "bookmarks";

  function getStorageArea() {
    if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
      return null;
    }
    return chrome.storage.local;
  }

  function getRoot() {
    return new Promise((resolve) => {
      const storageArea = getStorageArea();
      if (!storageArea) {
        resolve({});
        return;
      }

      storageArea.get([ROOT_KEY], (res) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve({});
          return;
        }
        if (!res || typeof res !== "object") {
          resolve({});
          return;
        }
        resolve(res[ROOT_KEY] || {});
      });
    });
  }

  function setRoot(bookmarks) {
    return new Promise((resolve) => {
      const storageArea = getStorageArea();
      if (!storageArea) {
        resolve();
        return;
      }

      storageArea.set({ [ROOT_KEY]: bookmarks }, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          resolve();
          return;
        }
        resolve();
      });
    });
  }

  async function getConversationBookmarks(conversationKey) {
    const root = await getRoot();
    return root[conversationKey] || {};
  }

  async function setConversationBookmark(conversationKey, itemId, starred) {
    const root = await getRoot();
    const current = root[conversationKey] || {};
    current[itemId] = !!starred;
    root[conversationKey] = current;
    await setRoot(root);
  }

  window.__AI_TOC_STORAGE__ = {
    getConversationBookmarks,
    setConversationBookmark
  };
})();
