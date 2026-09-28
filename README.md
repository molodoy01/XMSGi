# XMSGi
**Telegram message scheduler for Windows, Linux, and macOS.**

XMSGi is a lightweight desktop application for sending and scheduling Telegram messages using your personal Telegram account.

## Features

- Telegram chat selection
- Instant message sending
- Scheduled message sending
- Session saving
- Session deletion
- Portable Windows application

## Download
**XMSGi 2.2.3 — Windows Portable**

Download the latest Windows `.exe` from [GitHub Releases](https://github.com/molodoy01/XMSGi/releases/tag/v2.2.3).

## Linux
Linux packages can be built on a Linux host (or Linux CI runner) with:

```bash
npm ci
npm run dist:linux
```

The build creates AppImage and Debian packages in `release/`. The `.deb` declares `libsecret-1-0`; an active Secret Service/keyring such as GNOME Keyring or KWallet is needed to save encrypted Telegram sessions and Gemini keys. Without one, XMSGi still starts but reports that credentials cannot be saved securely; it will not fall back to Electron's weak `basic_text` backend or write secrets in plaintext. Closing the Linux window exits the app so it cannot become hidden when a desktop does not show tray icons. The tray remains best-effort.

## macOS
macOS packaging is prepared for a macOS runner with the existing Electron Builder setup. No Apple Developer signing or notarization is configured.

```bash
npm ci
npm run dist:mac
```

This creates a DMG in `release/` using the existing Electron Builder `dmg` target without changing the Windows Portable or Linux packaging configuration.

## How it works
XMSGi connects directly to Telegram using the MTProto protocol and your personal Telegram account.

Once a message is scheduled, your PC does not need to remain open.

## Privacy & Security
Telegram session data is stored locally and protected using Electron's secure storage where supported.

XMSGi does not require a Telegram bot for its core scheduling flow.

## Open Source
XMSGi is open source and available on GitHub.

---
**XMSGi · Telegram scheduling, kept simple.**
