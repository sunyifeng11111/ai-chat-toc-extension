# Manual Test Checklist

## Setup

1. Open `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select `/Users/sun/Code/ai-chat-toc-extension`.

## Core scenarios

### ChatGPT

1. Open a conversation with at least 5 user prompts.
2. Verify right-side TOC panel appears.
3. Verify each TOC item maps to a user prompt.
4. Click item #3 and confirm smooth scroll + temporary highlight.
5. Toggle star on two items, refresh page, confirm stars persist.

### Claude

1. Repeat the same checks as ChatGPT.
2. Add new prompt after panel is visible.
3. Verify TOC updates automatically within ~1 second.

### Gemini

1. Repeat the same checks as ChatGPT.
2. Collapse and expand panel.
3. Verify panel does not block core input box in normal viewport.

## Regression checks

1. Open a second conversation in same site.
2. Confirm stars are isolated by conversation URL.
3. Open browser console and verify no continuous error logs.

## Performance checks

1. Test with a long thread (50+ turns).
2. Verify scrolling and click response remain acceptable.
