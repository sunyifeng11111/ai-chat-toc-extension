(() => {
  const site = "claude";

  function detect() {
    return /claude\.ai$/.test(location.hostname);
  }

  function getConversationRoot() {
    return (
      document.querySelector("main") ||
      document.querySelector("[data-testid='conversation']") ||
      document.body
    );
  }

  function toMessageNode(node) {
    return node.closest("article, section, li, [data-testid*='message']") || node;
  }

  function textFrom(node) {
    const text = (node.innerText || node.textContent || "").trim();
    return text.replace(/\s+/g, " ");
  }

  function extractPrimary(root) {
    const selectors = [
      "[data-testid='user-message']",
      "[data-testid*='human-message']",
      "[data-message-author='human']"
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
    const items = root.querySelectorAll("article, section");
    const result = [];

    items.forEach((item) => {
      const label = item.querySelector("[aria-label='Human'], [aria-label='You']");
      if (!label) {
        return;
      }
      const text = textFrom(item);
      if (text) {
        result.push({ element: toMessageNode(item), text });
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
      message.element.getAttribute("data-testid") ||
      message.element.getAttribute("data-message-id");

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
