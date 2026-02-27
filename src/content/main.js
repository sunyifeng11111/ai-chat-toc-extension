(() => {
  if (window.__AI_TOC_BOOTSTRAPPED__) {
    return;
  }
  window.__AI_TOC_BOOTSTRAPPED__ = true;

  const parser = window.__AI_TOC_PARSER__;
  const storage = window.__AI_TOC_STORAGE__;
  const { TocPanel } = window.__AI_TOC_PANEL__;

  const adapter = parser.getAdapter();
  if (!adapter) {
    return;
  }

  let items = [];
  let bookmarks = {};
  let conversationKey = parser.getConversationKey(adapter.site);
  let observer = null;
  let refreshTimer = null;
  let activeSyncTimer = null;
  let activeSyncResumeTimer = null;
  let activeSyncLockedUntil = 0;
  let lastRenderSignature = "";

  function findItem(itemId) {
    return items.find((item) => item.id === itemId) || null;
  }

  function buildRenderSignature(list) {
    return list.map((item) => `${item.id}:${item.starred ? 1 : 0}:${item.text}`).join("|");
  }

  function pickActiveItemIdByViewport() {
    if (!items.length) {
      return null;
    }

    const targetY = window.innerHeight * 0.35;
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    items.forEach((item) => {
      const target = document.querySelector(item.anchorSelector);
      if (!target) {
        return;
      }

      const rect = target.getBoundingClientRect();
      const clampedY = Math.min(Math.max(targetY, rect.top), rect.bottom);
      const distance = Math.abs(clampedY - targetY);

      if (distance < bestDistance) {
        bestDistance = distance;
        best = item;
      }
    });

    return best ? best.id : null;
  }

  function syncActiveFromViewport() {
    if (Date.now() < activeSyncLockedUntil) {
      return;
    }
    const activeId = pickActiveItemIdByViewport();
    panel.setActiveItem(activeId, { ensureVisible: true });
  }

  function scheduleActiveSync() {
    if (Date.now() < activeSyncLockedUntil) {
      return;
    }
    if (activeSyncTimer) {
      return;
    }
    activeSyncTimer = window.setTimeout(() => {
      activeSyncTimer = null;
      syncActiveFromViewport();
    }, 80);
  }

  function lockActiveSync(durationMs = 1100) {
    activeSyncLockedUntil = Date.now() + durationMs;
    if (activeSyncResumeTimer) {
      clearTimeout(activeSyncResumeTimer);
    }
    activeSyncResumeTimer = window.setTimeout(() => {
      activeSyncResumeTimer = null;
      scheduleActiveSync();
    }, durationMs + 40);
  }

  async function refreshItems() {
    conversationKey = parser.getConversationKey(adapter.site);

    try {
      bookmarks = await storage.getConversationBookmarks(conversationKey);
    } catch (err) {
      bookmarks = {};
      console.debug("[AI TOC] bookmarks load skipped", err);
    }

    try {
      const nextItems = parser.buildItems(adapter, bookmarks);
      items = Array.isArray(nextItems) ? nextItems : [];
    } catch (err) {
      items = [];
      console.debug("[AI TOC] build items skipped", err);
    }

    const nextSignature = buildRenderSignature(items);
    if (nextSignature !== lastRenderSignature) {
      panel.render(items);
      lastRenderSignature = nextSignature;
    }
    scheduleActiveSync();
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshItems();
    }, 200);
  }

  async function onNavigate(itemId) {
    const item = findItem(itemId);
    if (!item) {
      return;
    }
    lockActiveSync();
    panel.scrollTo(item);
  }

  async function onToggleStar(itemId) {
    const item = findItem(itemId);
    if (!item) {
      return;
    }

    const next = !item.starred;
    item.starred = next;
    bookmarks[itemId] = next;
    panel.render(items);
    lastRenderSignature = buildRenderSignature(items);
    scheduleActiveSync();

    try {
      await storage.setConversationBookmark(conversationKey, itemId, next);
    } catch (err) {
      item.starred = !next;
      bookmarks[itemId] = !next;
      panel.render(items);
      lastRenderSignature = buildRenderSignature(items);
      scheduleActiveSync();
      console.debug("[AI TOC] bookmark persist skipped", err);
    }
  }

  function setupObserver() {
    const root = adapter.getConversationRoot();
    if (!root) {
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(() => {
      scheduleRefresh();
    });

    observer.observe(root, {
      childList: true,
      subtree: true
    });
  }

  const panel = new TocPanel(onNavigate, onToggleStar);
  panel.startThemeSync();

  refreshItems().catch((err) => {
    console.debug("[AI TOC] initial refresh skipped", err);
  });

  setupObserver();

  window.addEventListener("popstate", scheduleRefresh);
  window.addEventListener("hashchange", scheduleRefresh);
  window.addEventListener("resize", scheduleActiveSync);
  document.addEventListener("scroll", scheduleActiveSync, true);
})();
