(() => {
  function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function truncate(text, maxLen = 80) {
    if (text.length <= maxLen) {
      return text;
    }
    return `${text.slice(0, maxLen - 1)}…`;
  }

  function isTocInternalElement(element) {
    if (!element || typeof element.closest !== "function") {
      return false;
    }
    return !!element.closest(".ai-toc-panel");
  }

  function getConversationKey(site) {
    const path = location.pathname || "/";
    const query = location.search || "";
    return `${site}:${path}${query}`;
  }

  function getAdapter() {
    const adapters = window.__AI_TOC_ADAPTERS__ || {};
    const values = Object.values(adapters);

    for (const adapter of values) {
      if (adapter.detect()) {
        return adapter;
      }
    }

    return null;
  }

  function ensureAnchor(element, itemId) {
    const anchorId = `ai-toc-anchor-${itemId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    element.setAttribute("data-ai-toc-anchor", anchorId);
    return `[data-ai-toc-anchor='${anchorId}']`;
  }

  function buildItems(adapter, bookmarks) {
    const root = adapter.getConversationRoot();
    if (!root) {
      return [];
    }
    const messages = (adapter.extractUserMessages(root) || []).filter((message) => {
      if (!message || !message.element) {
        return false;
      }
      return !isTocInternalElement(message.element);
    });
    const conversationKey = getConversationKey(adapter.site);

    return messages.map((message, index) => {
      if (!message || !message.element) {
        return null;
      }
      const baseId = adapter.getMessageId(message, index);
      const suffix = hashText(`${message.text}:${index}`);
      const itemId = `${baseId}:${suffix}`;
      const anchorSelector = ensureAnchor(message.element, itemId);

      return {
        id: itemId,
        text: truncate(normalizeText(message.text), 80),
        fullText: normalizeText(message.text),
        anchorSelector,
        createdAt: Date.now(),
        starred: !!bookmarks[itemId],
        site: adapter.site,
        conversationKey
      };
    }).filter(Boolean);
  }

  window.__AI_TOC_PARSER__ = {
    getAdapter,
    getConversationKey,
    buildItems
  };
})();
