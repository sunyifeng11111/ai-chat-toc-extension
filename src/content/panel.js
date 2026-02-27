(() => {
  function createPanel() {
    const container = document.createElement("aside");
    container.className = "ai-toc-panel";
    container.innerHTML = `
      <div class="ai-toc-header">
        <span class="ai-toc-title">对话目录</span>
        <button class="ai-toc-toggle" type="button" title="折叠/展开">❮</button>
      </div>
      <div class="ai-toc-body">
        <ul class="ai-toc-list"></ul>
        <div class="ai-toc-empty">暂无可导航的用户提问</div>
      </div>
    `;

    document.body.appendChild(container);
    return container;
  }

  function highlightTarget(target) {
    target.classList.remove("ai-toc-target-highlight");
    target.classList.add("ai-toc-target-pulse");
    window.setTimeout(() => {
      target.classList.remove("ai-toc-target-pulse");
    }, 900);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  class TocPanel {
    constructor(onNavigate, onToggleStar) {
      this.onNavigate = onNavigate;
      this.onToggleStar = onToggleStar;
      this.root = createPanel();
      this.body = this.root.querySelector(".ai-toc-body");
      this.list = this.root.querySelector(".ai-toc-list");
      this.empty = this.root.querySelector(".ai-toc-empty");
      this.toggleBtn = this.root.querySelector(".ai-toc-toggle");
      this.items = [];
      this.activeId = null;
      this.themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      this.themeMutationObserver = null;
      this.themeTimer = null;
      this.layoutTimer = null;
      this.bindEvents();
    }

    bindEvents() {
      this.toggleBtn.addEventListener("click", () => {
        const collapsed = this.root.classList.toggle("ai-toc-collapsed");
        this.toggleBtn.textContent = collapsed ? "❯" : "❮";
      });

      this.list.addEventListener("click", (event) => {
        const starBtn = event.target.closest(".ai-toc-star");
        if (starBtn) {
          event.preventDefault();
          event.stopPropagation();
          const { id } = starBtn.dataset;
          if (id) {
            Promise.resolve(this.onToggleStar(id)).catch((error) => {
              console.debug("[AI TOC] toggle star skipped", error);
            });
          }
          return;
        }

        const itemBtn = event.target.closest(".ai-toc-item-main");
        if (!itemBtn) {
          return;
        }
        event.preventDefault();
        const { id } = itemBtn.dataset;
        if (id) {
          this.setActiveItem(id);
          Promise.resolve(this.onNavigate(id)).catch((error) => {
            console.debug("[AI TOC] navigate skipped", error);
          });
        }
      });
    }

    ensureRowVisible(row) {
      if (!this.body || !row || this.root.classList.contains("ai-toc-collapsed")) {
        return;
      }

      const bodyRect = this.body.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const padding = 8;
      const isAbove = rowRect.top < bodyRect.top + padding;
      const isBelow = rowRect.bottom > bodyRect.bottom - padding;

      if (!isAbove && !isBelow) {
        return;
      }

      const targetTop = row.offsetTop - this.body.clientHeight / 2 + row.offsetHeight / 2;
      this.body.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "auto"
      });
    }

    setActiveItem(itemId, options = {}) {
      const { ensureVisible = false } = options;
      const nextId = itemId || null;
      if (this.activeId === nextId) {
        return;
      }
      this.activeId = nextId;
      const rows = this.list.querySelectorAll(".ai-toc-item");
      let activeRow = null;
      rows.forEach((row) => {
        const isActive = nextId !== null && row.dataset.id === nextId;
        row.classList.toggle("is-active", isActive);
        if (isActive) {
          activeRow = row;
        }
      });

      if (ensureVisible && activeRow) {
        this.ensureRowVisible(activeRow);
      }
    }

    setTheme(mode) {
      this.root.setAttribute("data-theme", mode === "dark" ? "dark" : "light");
    }

    detectPageDarkMode() {
      const html = document.documentElement;
      const body = document.body;

      const classSignals = [
        html.className,
        body ? body.className : "",
        html.getAttribute("data-theme") || "",
        body ? body.getAttribute("data-theme") || "" : ""
      ]
        .join(" ")
        .toLowerCase();

      if (/(^|\s)(dark|night|theme-dark)(\s|$)/.test(classSignals)) {
        return true;
      }

      const htmlStyle = window.getComputedStyle(html);
      const bodyStyle = body ? window.getComputedStyle(body) : null;
      const colorSchemeSignals = [
        htmlStyle.colorScheme || "",
        bodyStyle ? bodyStyle.colorScheme || "" : ""
      ]
        .join(" ")
        .toLowerCase();

      if (colorSchemeSignals.includes("dark")) {
        return true;
      }

      return this.themeMediaQuery.matches;
    }

    syncTheme() {
      const nextMode = this.detectPageDarkMode() ? "dark" : "light";
      this.setTheme(nextMode);
    }

    startThemeSync() {
      try {
        this.syncTheme();
      } catch (error) {
        console.warn("[AI TOC] theme sync init failed", error);
      }

      const safeSyncTheme = () => {
        try {
          this.syncTheme();
        } catch (error) {
          console.warn("[AI TOC] theme sync failed", error);
        }
      };

      if (this.themeMediaQuery.addEventListener) {
        this.themeMediaQuery.addEventListener("change", safeSyncTheme);
      } else if (this.themeMediaQuery.addListener) {
        this.themeMediaQuery.addListener(safeSyncTheme);
      }

      const triggerSync = () => {
        if (this.themeTimer) {
          clearTimeout(this.themeTimer);
        }
        this.themeTimer = window.setTimeout(() => {
          safeSyncTheme();
        }, 120);
      };

      this.themeMutationObserver = new MutationObserver(triggerSync);
      const html = document.documentElement;
      const body = document.body;

      this.themeMutationObserver.observe(html, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"]
      });

      if (body) {
        this.themeMutationObserver.observe(body, {
          attributes: true,
          attributeFilter: ["class", "style", "data-theme"]
        });
      }
    }

    updatePosition(getAnchorElement) {
      const anchor = typeof getAnchorElement === "function" ? getAnchorElement() : null;
      let target = anchor || document.querySelector("main");

      if (!target || typeof target.getBoundingClientRect !== "function") {
        this.root.style.right = "16px";
        return;
      }

      let rect = target.getBoundingClientRect();
      if (rect.width > window.innerWidth * 0.9) {
        const candidates = target.querySelectorAll("article, section, li, [data-message-id], [data-testid*='conversation-turn']");
        for (const node of candidates) {
          const nodeRect = node.getBoundingClientRect();
          if (nodeRect.width > 260 && nodeRect.width < window.innerWidth * 0.9) {
            target = node;
            rect = nodeRect;
            break;
          }
        }
      }
      const viewportRightGap = Math.max(8, Math.round(window.innerWidth - rect.right + 12));
      this.root.style.right = `${viewportRightGap}px`;
    }

    startLayoutSync(getAnchorElement) {
      const schedule = () => {
        if (this.layoutTimer) {
          clearTimeout(this.layoutTimer);
        }
        this.layoutTimer = window.setTimeout(() => {
          this.updatePosition(getAnchorElement);
        }, 60);
      };

      schedule();
      window.addEventListener("resize", schedule);
      window.addEventListener("orientationchange", schedule);

      const bodyObserver = new MutationObserver(schedule);
      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    render(items) {
      this.items = items;
      this.list.innerHTML = "";
      if (!items.some((item) => item.id === this.activeId)) {
        this.activeId = null;
      }

      if (!items.length) {
        this.empty.style.display = "block";
        return;
      }

      this.empty.style.display = "none";

      items.forEach((item, idx) => {
        const li = document.createElement("li");
        const classes = ["ai-toc-item"];
        if (item.starred) {
          classes.push("is-starred");
        }
        if (item.id === this.activeId) {
          classes.push("is-active");
        }
        if (idx === 0) {
          classes.push("is-first");
        }
        if (idx === items.length - 1) {
          classes.push("is-last");
        }
        li.className = classes.join(" ");
        li.dataset.id = item.id;
        li.innerHTML = `
          <div class="ai-toc-item-inner">
            <button class="ai-toc-star ${item.starred ? "is-starred" : ""}" type="button" data-id="${escapeHtml(item.id)}" title="标记">
              ★
            </button>
            <button class="ai-toc-item-main" type="button" data-id="${escapeHtml(item.id)}" title="${escapeHtml(item.fullText)}">
              <span class="ai-toc-index">${idx + 1}.</span>
              <span class="ai-toc-text">${escapeHtml(item.text)}</span>
            </button>
          </div>
        `;
        this.list.appendChild(li);
      });
    }

    scrollTo(item) {
      const target = document.querySelector(item.anchorSelector);
      if (!target) {
        return false;
      }

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      highlightTarget(target);
      return true;
    }
  }

  window.__AI_TOC_PANEL__ = {
    TocPanel
  };
})();
