(() => {
  const site = "chatgpt";

  function detect() {
    return /chatgpt\.com$|chat\.openai\.com$/.test(location.hostname);
  }

  function getConversationRoot() {
    return (
      document.querySelector("main") ||
      document.querySelector("[data-testid='conversation-turns']") ||
      document.body
    );
  }

  function toMessageNode(node) {
    return node.closest("article, [data-testid^='conversation-turn-'], li, section") || node;
  }

  function textFrom(node) {
    const text = (node.innerText || node.textContent || "").trim();
    return text.replace(/\s+/g, " ");
  }

  function extractByAuthorRole(root) {
    const nodes = root.querySelectorAll("div[data-message-author-role='user']");
    const result = [];
    nodes.forEach((node) => {
      const messageNode = toMessageNode(node);
      const text = textFrom(node);
      if (text) {
        result.push({ element: messageNode, text });
      }
    });
    return result;
  }

  function extractByTurnFallback(root) {
    const turns = root.querySelectorAll("[data-testid^='conversation-turn-']");
    const result = [];
    turns.forEach((turn) => {
      const userPart = turn.querySelector("div[data-message-author-role='user']");
      if (!userPart) {
        return;
      }
      const text = textFrom(userPart);
      if (text) {
        result.push({ element: toMessageNode(turn), text });
      }
    });
    return result;
  }

  function extractUserMessages(root) {
    const firstPass = extractByAuthorRole(root);
    if (firstPass.length > 0) {
      return firstPass;
    }
    return extractByTurnFallback(root);
  }

  function getMessageId(message, index) {
    const existing =
      message.element.getAttribute("data-testid") ||
      message.element.id ||
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
