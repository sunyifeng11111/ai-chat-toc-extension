(() => {
  const site = "doubao";

  const UTILITY_TEXT_RE = /^(分享|复制|重试|重新生成|重新回答|继续|赞|踩|更多|收起|展开|编辑|删除|朗读|停止朗读|语音播放|转发|举报|收藏|下载|发送|停止|清空|分享给|Share|Copy)$/i;
  const PRIMARY_CONTAINER_SELECTOR =
    "[data-message-id], [data-id], [data-role], [data-author], [data-message-author], [data-message-author-role], [data-testid*='message'], [data-testid*='chat'], [data-testid*='bubble'], [class*='message-item'], [class*='chat-item'], [class*='bubble-item'], [class*='bubble'], [class*='message'], article, section, li, [role='listitem'], [role='article']";
  const FALLBACK_CONTAINER_SELECTOR =
    "[role='listitem'], [role='article'], article, section, li, [data-testid], [data-role], [data-author], [aria-label]";

  function detect() {
    return /(^|\.)doubao\.com$|(^|\.)doubao\.cn$/.test(location.hostname);
  }

  function getConversationRoot() {
    return (
      document.querySelector("main") ||
      document.querySelector("[data-testid='chat-content']") ||
      document.querySelector("[data-testid='conversation']") ||
      document.querySelector("[role='main']") ||
      document.querySelector("[class*='chat-main']") ||
      document.querySelector("[class*='chat-content']") ||
      document.querySelector("[class*='conversation']") ||
      document.querySelector("[class*='message-list']") ||
      document.querySelector("[class*='chat-list']") ||
      document.querySelector("[class*='messages']") ||
      document.body
    );
  }

  function normalizeSpace(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function cleanText(text) {
    return normalizeSpace(text).replace(/^(你说|我说|You said|You|Me)\s*[：:，,\-]?\s*/i, "").trim();
  }

  function isUtilityText(text) {
    if (!text) {
      return true;
    }
    return UTILITY_TEXT_RE.test(text.trim());
  }

  function getAttrHint(node) {
    if (!node) {
      return "";
    }
    return normalizeSpace([
      node.getAttribute("data-role") || "",
      node.getAttribute("data-author") || "",
      node.getAttribute("data-message-author") || "",
      node.getAttribute("data-message-author-role") || "",
      node.getAttribute("data-testid") || "",
      node.getAttribute("aria-label") || ""
    ].join(" ")).toLowerCase();
  }

  function getClassHint(node) {
    if (!node) {
      return "";
    }
    return String(node.className || "").toLowerCase();
  }

  function getHint(node) {
    return `${getAttrHint(node)} ${getClassHint(node)}`.trim();
  }

  function hasUserHint(node) {
    const hint = `${getHint(node)} ${getHint(node && node.parentElement)}`;
    if (!hint) {
      return false;
    }
    return (
      hint.includes("你") ||
      hint.includes("我") ||
      hint.includes("用户") ||
      /(^|[\s:_-])(user|human|from-user|is-user|sender-user)([\s:_-]|$)/.test(hint)
    );
  }

  function hasAssistantHint(node) {
    const hint = `${getHint(node)} ${getHint(node && node.parentElement)}`;
    if (!hint) {
      return false;
    }
    return /(assistant|bot|ai-|model|answer|reply|from-ai|copilot)/.test(hint);
  }

  function isSuggestionNode(node) {
    if (!node) {
      return false;
    }
    const holder = node.closest(
      "[data-testid*='suggest'], [data-testid*='recommend'], [data-testid*='quick'], [data-testid*='starter'], [data-testid*='hot'], [data-testid*='tips'], [class*='suggest'], [class*='recommend'], [class*='quick-question'], [class*='starter'], [class*='hot-question'], [class*='tips'], [class*='guide'], [class*='猜你']"
    );
    if (!holder) {
      return false;
    }
    const hint = `${getHint(holder)} ${normalizeSpace(holder.innerText || holder.textContent || "").slice(0, 300).toLowerCase()}`;
    return /(suggest|recommend|quick|starter|hot|tips|guide|guess|猜你|你可能想问)/.test(hint);
  }

  function isVisibleElement(element) {
    if (!element || !element.getBoundingClientRect) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (!style) {
      return true;
    }
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    if (element.getAttribute("aria-hidden") === "true") {
      return false;
    }
    return true;
  }

  function isLikelyRightSideBubble(element) {
    if (!element || !element.getBoundingClientRect) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    if (rect.width > window.innerWidth * 0.92) {
      return false;
    }
    const centerX = rect.left + rect.width / 2;
    return centerX > window.innerWidth * 0.56;
  }

  function hasUserLayoutHint(element) {
    if (!element) {
      return false;
    }

    let current = element;
    let depth = 0;
    while (current && depth < 6) {
      const style = window.getComputedStyle(current);
      if (style) {
        const justify = (style.justifyContent || "").toLowerCase();
        const alignItems = (style.alignItems || "").toLowerCase();
        const textAlign = (style.textAlign || "").toLowerCase();
        if (justify.includes("flex-end") || justify.includes(" end")) {
          return true;
        }
        if (alignItems.includes("flex-end") || alignItems.includes(" end")) {
          return true;
        }
        if (textAlign === "right" || textAlign === "end") {
          return true;
        }
      }
      current = current.parentElement;
      depth += 1;
    }

    return false;
  }

  function hasAssistantActions(node) {
    if (!node) {
      return false;
    }
    const actionNodes = node.querySelectorAll("button, [role='button'], a");
    for (const action of actionNodes) {
      const label = normalizeSpace(action.innerText || action.textContent || "");
      if (!label) {
        continue;
      }
      if (UTILITY_TEXT_RE.test(label) || /(分享|复制|重试|转发|收藏|下载|Share|Copy)/i.test(label)) {
        return true;
      }
    }
    return false;
  }

  function countPunctuation(text) {
    if (!text) {
      return 0;
    }
    const matches = text.match(/[。！？!?；;，,]/g);
    return matches ? matches.length : 0;
  }

  function looksLikePromptText(text) {
    if (!text) {
      return false;
    }
    if (text.length <= 90) {
      return true;
    }
    if (/[?？]$/.test(text)) {
      return true;
    }
    if (/^(请|帮|如何|怎么|为什么|能否|是否|告诉我|what|how|why|can|could|please)\b/i.test(text)) {
      return true;
    }
    return text.length <= 170 && countPunctuation(text) <= 2;
  }

  function looksLikeAssistantParagraph(text) {
    if (!text) {
      return false;
    }
    const punctCount = countPunctuation(text);
    if (text.length >= 180 && punctCount >= 3) {
      return true;
    }
    if (text.length >= 260) {
      return true;
    }
    if (text.length >= 120 && punctCount >= 5 && !/[?？]$/.test(text)) {
      return true;
    }
    return false;
  }

  function computePromptScore(candidate) {
    let score = 0;
    if (candidate.userHint) {
      score += 6;
    }
    if (candidate.rightSide) {
      score += 2;
    }
    if (candidate.userLayout) {
      score += 2;
    }
    if (candidate.promptLike) {
      score += 2;
    }
    if (candidate.text.length <= 140) {
      score += 1;
    }
    if (candidate.assistantLike) {
      score -= 4;
    }
    return score;
  }

  function isLikelyAnswerListItem(element, text) {
    if (!element) {
      return false;
    }
    const tag = (element.tagName || "").toUpperCase();
    const inList = !!element.closest("ol, ul");
    if (!(tag === "LI" || inList)) {
      return false;
    }
    const shortText = (text || "").trim();
    return shortText.length > 0 && shortText.length <= 120;
  }

  function toMessageNode(node) {
    return (
      node.closest(
        "[data-message-id], [data-id], [data-testid*='message'], [data-testid*='chat'], [data-testid*='bubble'], [class*='message-item'], [class*='chat-item'], [class*='bubble-item'], [class*='bubble'], [class*='message'], [role='listitem'], [role='article'], article, li, section"
      ) || node
    );
  }

  function extractPureText(node) {
    if (!node) {
      return "";
    }

    const clone = node.cloneNode(true);
    clone
      .querySelectorAll(
        "button, a, svg, input, textarea, select, [role='button'], [data-testid*='action'], [data-testid*='toolbar'], [data-testid*='footer'], [class*='action'], [class*='toolbar'], [class*='footer'], [class*='menu'], [class*='ops']"
      )
      .forEach((el) => el.remove());

    const lines = (clone.innerText || clone.textContent || "")
      .split(/\n+/)
      .map((line) => cleanText(line))
      .filter((line) => line && !isUtilityText(line));

    return normalizeSpace(lines.join(" "));
  }

  function getDedupeKey(element, text) {
    const stableId =
      element.getAttribute("data-message-id") ||
      element.getAttribute("data-id") ||
      element.getAttribute("data-testid") ||
      element.id;

    if (stableId) {
      return stableId;
    }

    const rect = element.getBoundingClientRect();
    const yBucket = Math.round((rect.top + window.scrollY) / 24);
    return `${text.slice(0, 120)}#${yBucket}`;
  }

  function getStableCandidateSignature(element, text) {
    const stableId =
      element.getAttribute("data-message-id") ||
      element.getAttribute("data-id") ||
      element.getAttribute("data-testid") ||
      element.id;
    if (stableId) {
      return `id:${stableId}`;
    }

    const rect = element.getBoundingClientRect();
    const topBucket = Math.round((rect.top + window.scrollY) / 18);
    const centerX = rect.left + rect.width / 2;
    const xBucket = Math.round(centerX / 24);
    const textHead = normalizeSpace(text).toLowerCase().slice(0, 140);
    return `t:${textHead}|x:${xBucket}|y:${topBucket}`;
  }

  function appendCandidate(result, seenElements, seenSignatures, candidate) {
    if (!candidate || !candidate.element || !candidate.text) {
      return;
    }
    const { element, text } = candidate;
    if (!isVisibleElement(element)) {
      return;
    }
    if (text.length <= 1 || text.length > 4500) {
      return;
    }
    if (isUtilityText(text)) {
      return;
    }
    if (seenElements.has(element)) {
      return;
    }
    const signature = getStableCandidateSignature(element, text);
    if (seenSignatures.has(signature)) {
      return;
    }
    seenElements.add(element);
    seenSignatures.add(signature);
    const rect = element.getBoundingClientRect();
    result.push({
      element,
      text,
      _order: typeof candidate.domIndex === "number" ? candidate.domIndex : result.length,
      _top: typeof candidate.top === "number" ? candidate.top : rect.top + window.scrollY
    });
  }

  function collectCandidates(root) {
    const primaryContainers = Array.from(root.querySelectorAll(PRIMARY_CONTAINER_SELECTOR));
    const containers =
      primaryContainers.length >= 2
        ? primaryContainers
        : Array.from(root.querySelectorAll(FALLBACK_CONTAINER_SELECTOR));

    const elementSeen = new Set();
    const candidates = [];

    containers.forEach((container) => {
      if (!isVisibleElement(container) || isSuggestionNode(container)) {
        return;
      }

      const element = toMessageNode(container);
      if (!element || !isVisibleElement(element) || isSuggestionNode(element) || elementSeen.has(element)) {
        return;
      }
      elementSeen.add(element);

      const text = extractPureText(element);
      if (!text) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const promptLike = looksLikePromptText(text);
      const assistantLike = looksLikeAssistantParagraph(text);
      const answerListItemLike = isLikelyAnswerListItem(element, text);
      const tooWide = rect.width >= window.innerWidth * 0.9;
      candidates.push({
        element,
        text,
        domIndex: candidates.length,
        top: rect.top + window.scrollY,
        centerX: rect.left + rect.width / 2,
        userHint: hasUserHint(element) || hasUserHint(container),
        assistantHint: hasAssistantHint(element) || hasAssistantHint(container),
        assistantActions: hasAssistantActions(element),
        rightSide: isLikelyRightSideBubble(element),
        userLayout: hasUserLayoutHint(element),
        promptLike,
        assistantLike,
        answerListItemLike,
        tooWide
      });
    });

    return candidates;
  }

  function sortByOrder(messages) {
    const ordered = messages.sort((a, b) => {
      const ao = typeof a._order === "number" ? a._order : Number.MAX_SAFE_INTEGER;
      const bo = typeof b._order === "number" ? b._order : Number.MAX_SAFE_INTEGER;
      return ao - bo;
    });

    const deduped = [];
    const recentByText = new Map();
    ordered.forEach((message) => {
      const textKey = normalizeSpace(message.text).toLowerCase();
      const prev = recentByText.get(textKey);
      if (prev && Math.abs((message._top || 0) - (prev._top || 0)) <= 96) {
        return;
      }
      recentByText.set(textKey, message);
      deduped.push(message);
    });

    return deduped.map((message) => ({
      element: message.element,
      text: message.text
    }));
  }

  function extractBySelectors(root, selectors) {
    for (const selector of selectors) {
      const nodes = root.querySelectorAll(selector);
      if (!nodes.length) {
        continue;
      }

      const result = [];
      const seenElements = new Set();
      const seenSignatures = new Set();
      nodes.forEach((node, index) => {
        const element = toMessageNode(node);
        if (!element || isSuggestionNode(element)) {
          return;
        }
        const text = extractPureText(element);
        if (!text) {
          return;
        }
        appendCandidate(result, seenElements, seenSignatures, { element, text, domIndex: index });
      });

      if (result.length > 0) {
        return sortByOrder(result);
      }
    }

    return [];
  }

  function computeUserSideModel(candidates) {
    if (!candidates.length) {
      return null;
    }

    const sideCandidates = candidates.filter((candidate) => !candidate.tooWide || candidate.userHint);
    if (!sideCandidates.length) {
      return null;
    }

    const userHinted = sideCandidates.filter((candidate) => candidate.userHint);
    const assistantHinted = sideCandidates.filter((candidate) => candidate.assistantHint);

    if (userHinted.length > 0 && assistantHinted.length > 0) {
      const userAvg = userHinted.reduce((sum, candidate) => sum + candidate.centerX, 0) / userHinted.length;
      const assistantAvg =
        assistantHinted.reduce((sum, candidate) => sum + candidate.centerX, 0) / assistantHinted.length;
      if (Math.abs(userAvg - assistantAvg) >= 36) {
        return {
          threshold: (userAvg + assistantAvg) / 2,
          userRight: userAvg > assistantAvg
        };
      }
    }

    const xs = sideCandidates.map((candidate) => candidate.centerX);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const spread = maxX - minX;
    if (spread < Math.max(120, window.innerWidth * 0.12)) {
      return null;
    }

    return {
      threshold: (minX + maxX) / 2,
      userRight: true
    };
  }

  function isOnUserSide(candidate, sideModel) {
    if (!sideModel) {
      return false;
    }
    return sideModel.userRight
      ? candidate.centerX >= sideModel.threshold
      : candidate.centerX <= sideModel.threshold;
  }

  function extractUserMessages(root) {
    const primary = extractBySelectors(root, [
      "[data-role='user']",
      "[data-author='user']",
      "[data-message-author='user']",
      "[data-message-author-role='user']",
      "[data-testid*='user-message']",
      "[data-testid*='from-user']",
      "[class*='from-user']",
      "[class*='is-user']",
      "[class*='sender-user']",
      "[class*='user-message']"
    ]);
    if (primary.length > 0) {
      return primary;
    }

    const candidates = collectCandidates(root);
    if (!candidates.length) {
      return [];
    }

    const seenElements = new Set();
    const seenSignatures = new Set();
    const result = [];

    // Stage 1: strong user hints only.
    candidates.forEach((candidate) => {
      if (!candidate.userHint) {
        return;
      }
      if (candidate.assistantHint && !candidate.userHint) {
        return;
      }
      if (candidate.answerListItemLike && !candidate.userHint) {
        return;
      }
      appendCandidate(result, seenElements, seenSignatures, candidate);
    });

    if (result.length > 0) {
      return sortByOrder(result);
    }

    // Stage 2: side-based fallback; user messages are usually aligned on one side.
    const sideModel = computeUserSideModel(candidates);
    candidates.forEach((candidate) => {
      if (candidate.assistantHint) {
        return;
      }
      if (candidate.answerListItemLike && !candidate.userHint) {
        return;
      }
      if (candidate.tooWide && !candidate.userHint) {
        return;
      }
      if (sideModel) {
        if (!(isOnUserSide(candidate, sideModel) || candidate.userLayout || candidate.userHint)) {
          return;
        }
      } else if (!(candidate.userLayout || candidate.userHint || candidate.promptLike)) {
        return;
      }
      if (candidate.text.length > 400) {
        return;
      }
      appendCandidate(result, seenElements, seenSignatures, candidate);
    });

    if (result.length > 0) {
      return sortByOrder(result);
    }

    // Stage 3: conservative prompt-text fallback.
    candidates
      .filter((candidate) => !candidate.assistantHint)
      .filter((candidate) => !candidate.assistantLike)
      .filter((candidate) => candidate.promptLike)
      .filter((candidate) => !candidate.tooWide || candidate.userHint)
      .filter((candidate) => !(candidate.answerListItemLike && !candidate.userHint))
      .forEach((candidate) => {
        appendCandidate(result, seenElements, seenSignatures, candidate);
      });

    return sortByOrder(result);
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
