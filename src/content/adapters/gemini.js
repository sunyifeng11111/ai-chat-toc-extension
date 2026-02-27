(() => {
  const site = "gemini";

  function detect() {
    return /gemini\.google\.com$/.test(location.hostname);
  }

  function getConversationRoot() {
    return (
      document.querySelector("main") ||
      document.querySelector("chat-app") ||
      document.body
    );
  }

  function toMessageNode(node) {
    return node.closest("article, section, li, [data-message-id], .conversation-turn") || node;
  }

  function textFrom(node) {
    const text = (node.innerText || node.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    return text.replace(/^(你说|You said)\s*[：:，,\-]?\s*/i, "").trim();
  }

  function extractPrimary(root) {
    const selectors = [
      "[data-author='user']",
      "[data-message-author='user']",
      "user-query, .user-query"
    ];

    for (const selector of selectors) {
      const nodes = root.querySelectorAll(selector);
      if (nodes.length === 0) {
        continue;
      }

      const result = [];
      nodes.forEach((node) => {
        const text = textFrom(node);
        if (text) {
          result.push({ element: toMessageNode(node), text });
        }
      });

      if (result.length > 0) {
        return result;
      }
    }

    return [];
  }

  function extractFallback(root) {
    const turns = root.querySelectorAll("article, section, .conversation-turn");
    const result = [];

    turns.forEach((turn) => {
      const youLabel = turn.querySelector("[aria-label='You'], [aria-label='User']");
      if (!youLabel) {
        return;
      }
      const text = textFrom(turn);
      if (text) {
        result.push({ element: toMessageNode(turn), text });
      }
    });

    return result;
  }

  function extractUserMessages(root) {
    const primary = extractPrimary(root);
    if (primary.length > 0) {
      return primary;
    }
    return extractFallback(root);
  }

  function getMessageId(message, index) {
    const existing =
      message.element.id ||
      message.element.getAttribute("data-message-id") ||
      message.element.getAttribute("data-testid");

    if (existing) {
      return `${site}:${existing}`;
    }

    return `${site}:idx:${index}`;
  }

  window.__AI_TOC_ADAPTERS__ = window.__AI_TOC_ADAPTERS__ || {};
  window.__AI_TOC_ADAPTERS__[site] = {
    site,
    detect,
    getConversationRoot,
    extractUserMessages,
    getMessageId
  };
})();
