# AI Chat TOC

[中文](./README.md) | English

![AI Chat TOC Icon](./assets/icons/icon-128.png)
![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest](https://img.shields.io/badge/Manifest-V3-34A853)
![Version](https://img.shields.io/badge/Version-v0.1.1-2563eb)

A Chrome extension that adds a clean, navigable table of contents for AI chat conversations.

## Version

- `v0.1.1`

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

## Demo

![AI Chat TOC Demo](./demo.png)

## Install (Developer Mode)

1. Download the latest package from [Releases](https://github.com/sunyifeng11111/ai-chat-toc-extension/releases)
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and choose the extracted folder

## Project Structure

- `manifest.json`: extension manifest (MV3)
- `src/content/`: parser, panel UI, style, storage, site adapters
- `src/background/`: service worker
- `assets/icons/`: extension icons
- `test/manual-checklist.md`: manual verification checklist

## Release Notes

`v0.1.1` fixes ChatGPT star-click responsiveness and improves README presentation.
