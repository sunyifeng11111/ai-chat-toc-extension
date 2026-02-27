# Selector Strategy (v0.2)

This document records the first-version selector strategy for user-message extraction.

## Shared adapter contract

Each site adapter provides:

- `detect()`
- `getConversationRoot()`
- `extractUserMessages(root)`
- `getMessageId(message, index)`

A message object is:

- `element`: DOM node used for scroll anchor.
- `text`: extracted user message text.

## ChatGPT

- Primary root: `main`
- Fallback root: `[data-testid='conversation-turns']`, `document.body`
- Primary user selector: `div[data-message-author-role='user']`
- Fallback selector: `[data-testid^='conversation-turn-']` + nested user-role selector

## Claude

- Primary root: `main`
- Fallback root: `[data-testid='conversation']`, `document.body`
- Primary selectors:
  - `[data-testid='user-message']`
  - `[data-testid*='human-message']`
  - `[data-message-author='human']`
- Fallback selector: `article, section` with `aria-label='Human'` or `aria-label='You'`

## Gemini

- Primary root: `main`
- Fallback root: `chat-app`, `document.body`
- Primary selectors:
  - `[data-author='user']`
  - `[data-message-author='user']`
  - `user-query, .user-query`
- Fallback selector: `article, section, .conversation-turn` with `aria-label='You'` or `aria-label='User'`

## Doubao

- Primary root: `main`
- Fallback root: testid/chat-content/conversation class roots, `document.body`
- Primary selectors:
  - `[data-role='user']`
  - `[data-author='user']`
  - `[data-message-author='user']`
  - `[data-testid*='user-message']`
  - `[class*='user-message']`
- Fallback selector: message-like containers with user labels (`你/用户/You/User`)

## Qwen (Tongyi)

- Primary root: `main`
- Fallback root: testid/chat-content/conversation class roots, `document.body`
- Primary selectors:
  - `[data-role='user']`
  - `[data-author='user']`
  - `[data-message-author='user']`
  - `[data-testid*='user-message']`
  - `[class*='question']`
- Fallback selector: message-like containers with user labels (`你/用户/You/User`)

## Kimi

- Primary root: `main`
- Fallback root: testid/chat-content/conversation class roots, `document.body`
- Primary selectors:
  - `[data-role='user']`
  - `[data-author='user']`
  - `[data-message-author='user']`
  - `[data-testid*='user-message']`
  - `[class*='kimi-user']`
- Fallback selector: message-like containers with user labels (`你/用户/You/User`)

## Yuanbao

- Primary root: `main`
- Fallback root: testid/chat-content/conversation class roots, `document.body`
- Primary selectors:
  - `[data-role='user']`
  - `[data-author='user']`
  - `[data-message-author='user']`
  - `[data-testid*='user-message']`
  - `[class*='question']`, `[class*='from-user']`
- Fallback selector: message-like containers with user labels (`你/用户/You/User`)

## Notes

- All selectors are best-effort and can break if site DOM changes.
- Keep fallback logic in each adapter instead of one generic parser to reduce cross-site regressions.
