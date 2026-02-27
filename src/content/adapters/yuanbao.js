(() => {
  const site = "yuanbao";

  function detect() {
    return /(^|\.)yuanbao\.tencent\.com$/.test(location.hostname);
  }

  function getConversationRoot() {
    return (
      document.querySelector("main") ||
      document.querySelector("[data-testid='chat-content']") ||
      document.querySelector("[data-testid='conversation']") ||
      document.querySelector("[class*='chat-content']") ||
      document.querySelector("[class*='conversation']") ||
      document.querySelector("[class*='message-list']") ||
      document.body
    );
  }

  function toMessageNode(node) {
    return (
      node.closest("article, section, li, [data-message-id], [data-testid*='message'], [class*='message-item'], [class*='message']") ||
      node
    );
  }

  function textFrom(node) {
    const text = (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
    return text.replace(/^(你说|我说|You said|You)\s*[：:，,\-]?\s*/i, "").trim();
  }

  function extractBySelectors(root, selectors) {
    for (const selector of selectors) {
      const nodes = root.querySelectorAll(selector);
      if (!nodes.length) {
        continue;
      }

      const result = [];
      const seen = new Set();
      nodes.forEach((node) => {
        const element = toMessageNode(node);
        if (!element || seen.has(element)) {
          return;
        }
        const text = textFrom(node);
        if (!text) {
          return;
        }
        seen.add(element);
        result.push({ element, text });
      });

      if (result.length > 0) {
        return result;
      }
    }

    return [];
  }

  function extractFallback(root) {
    const turns = root.querySelectorAll("article, section, li, [data-message-id], [data-testid*='message'], [class*='message-item']");
    const result = [];
    const seen = new Set();

    turns.forEach((turn) => {
      const label = turn.querySelector(
        "[aria-label='你'], [aria-label='用户'], [aria-label='You'], [aria-label='User'], [data-role='user'], [class*='user-avatar']"
      );
      const text = textFrom(turn);
      if (!text) {
        return;
      }
      if (!label && !/^(你说|我说|You said|You)/i.test(text)) {
        return;
      }

      const element = toMessageNode(turn);
      if (!element || seen.has(element)) {
        return;
      }
      seen.add(element);
      result.push({ element, text });
    });

    return result;
  }

  function extractUserMessages(root) {
    const primary = extractBySelectors(root, [
      "[data-role='user']",
      "[data-author='user']",
      "[data-message-author='user']",
      "[data-testid*='user-message']",
      "[class*='user-message']",
      "[class*='question']",
      "[class*='from-user']"
    ]);

    if (primary.length > 0) {
      return primary;
    }

    return extractFallback(root);
  }

  function getMessageId(message, index) {
    const existing =
      message.element.id ||
      message.element.getAttribute("data-message-id") ||
      message.element.getAttribute("data-testid") ||
      message.element.getAttribute("data-id");

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
