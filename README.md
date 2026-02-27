# AI Chat TOC

[中文](./README_zh.md) | English

![AI Chat TOC Icon](./assets/icons/icon-128.png)

A Chrome extension that adds a clean, navigable table of contents for AI chat conversations.

## Version

- `v0.1.0`

## Supported Sites

- ChatGPT
- Claude
- Gemini

## Highlights

- Build a TOC from user prompts automatically
- Smooth scroll to a selected prompt with target highlight
- Star important prompts and persist bookmarks per conversation URL
- Keep current prompt in sync with viewport while scrolling
- Compact collapsible sidebar with minimal visual noise

## Install (Developer Mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `/Users/sun/Code/ai-chat-toc-extension`

## Project Structure

- `manifest.json`: extension manifest (MV3)
- `src/content/`: parser, panel UI, style, storage, site adapters
- `src/background/`: service worker
- `assets/icons/`: extension icons
- `test/manual-checklist.md`: manual verification checklist

## Release Notes

`v0.1.0` is the first public release with core TOC navigation and bookmark support.
