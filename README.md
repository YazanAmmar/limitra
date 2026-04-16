# Limitra™

[![GitHub all releases](https://img.shields.io/github/downloads/YazanAmmar/limitra/total?style=flat&color=brightgreen)](https://github.com/YazanAmmar/limitra/releases)
[![Platform](https://img.shields.io/badge/platform-Chrome%20Extension-4285F4?style=flat-square)](https://chrome.google.com/webstore)
[![Release](https://img.shields.io/github/v/release/YazanAmmar/limitra?label=version)](https://github.com/YazanAmmar/limitra/releases)
[![Supported Languages: 2 Built-in](https://img.shields.io/badge/languages-2%20built--in-blue.svg)](https://github.com/YazanAmmar/limitra/tree/main/src/i18n/locales)
[![GitHub Stars](https://img.shields.io/github/stars/YazanAmmar/limitra.svg?style=flat&color=yellow)](https://github.com/YazanAmmar/limitra/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/YazanAmmar/limitra.svg?style=flat&color=red)](https://github.com/YazanAmmar/limitra/issues)

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-light.svg">
    <img alt="Limitra Logo" src="assets/logo-light.svg" width="420">
  </picture>
</p>

<div align="center">

[limitra.xyz](https://limitra.xyz) · [Report a Bug](https://github.com/YazanAmmar/limitra/issues) · [Support the Project](https://limitra.xyz/#support)

</div>

> **Hard limits for your social media time (not reminders).**

Limitra is a Chromium extension designed to **enforce hard limits on how you spend your time online** — not with reminders or nudges, but with strict blocking once your limits are reached, helping you break out of endless scrolling loops.

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Why Limitra?](#why-limitra)
- [Features](#features)
- [Supported Languages](#supported-languages)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Changelog (Summary)](#changelog-summary)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Trademark](#trademark)
- [Contact / Links](#contact--links)

## Overview

Limitra is a Chromium extension designed to **enforce hard limits on YouTube Shorts**.

Instead of reminders or nudges, it applies strict blocking once your limits are reached — helping you break out of endless scrolling loops.

You can define limits based on:

- Number of Shorts watched
- Active session time
- Or both combined

When a limit is exceeded, Limitra immediately blocks playback using a fullscreen overlay that cannot be easily bypassed.

Built on Chrome Manifest V3, Limitra focuses on reliability, resistance to tampering, and a fast, distraction-free experience.

## Screenshots

> See Limitra in action:

### Popup Dashboard

Quick access to your limits, real-time stats, and progress tracking.

<p align="center">
<img alt="Popup" src="assets/screenshots/popup.png" />
</p>

### Blocking Overlay

Limitra immediately blocks access when limits are reached — no reminders, no bypass.

<p align="center">
<img width="720" alt="Blocking Overlay" src="assets/screenshots/overlay.png" />
</p>

## Why Limitra?

- **Hard limits that actually stop you**: playback is paused, muted, and blocked the moment you hit your limit.
- **Two dimensions of control**: track by watched Shorts count, session time, or both together.
- **Designed against easy workarounds**: Limitra watches for counter resets, suspicious wipes, and hidden overlays.
- **Built for practical daily use**: quick popup stats, clear settings, theme support, and multilingual UI.

## Features

### Enforcement Core

- Dual-limit system based on **video count** and **active session time**
- Fullscreen enforcement overlay triggered instantly on limit breach
- Clear enforcement reasons: count, time, or anti-bypass
- Automatic pause and mute of active videos
- Disables playback-related keyboard shortcuts

### Tracking & Intelligence

- `Strict`: tracks total time while the tab is open
- `Playing Only`: counts only active playback time
- `Smart`: tracks playback and meaningful interaction
- Background heartbeat to prevent time-skipping and detect idle gaps

### Anti-Bypass Protection

- Detects manual counter resets and storage manipulation
- Prevents overlay removal via DevTools or CSS tampering
- Identifies rapid storage wipe attempts
- Enforces immediate blocking when suspicious behavior is detected

### User Interface

- Live usage stats and progress bars in the popup
- Dedicated **Command Center** dashboard for managing limits, modes, themes, and behavior
- Motivational quote system with multiple tone styles
- Light, Dark, and System themes
- Clean and responsive UI across all views

## Supported Languages

- English
- Arabic

> Automatic RTL/LTR layout switching

## Project Structure

```text
src/
├── app/
│   └── orchestrator.ts       # Wires everything together, owns the block flow
├── core/
│   ├── limiter.ts            # Pure counter logic (no Chrome APIs)
│   ├── session.ts            # Heartbeat, idle detection, activity tracking
│   ├── tracker.ts            # Delegates URL observation to the active adapter
│   ├── messenger.ts          # content - background message bus
│   └── storage/              # Settings, stats, sessions, and security storage
├── platforms/
│   ├── youtube/index.ts      # MutationObserver on URL, 1.5s watch threshold
├── ui/
│   └── overlay/
│       ├── index.ts          # Reads storage + i18n, builds overlay data
│       └── renderer.ts       # Pure DOM builder, countdown timer
├── i18n/
│   ├── types.ts              # LocaleStrings interface (type-safe translations)
│   ├── index.ts              # i18n singleton with locale switching
│   └── locales/
│       ├── en.ts
│       └── ar.ts
├── settings/
│   ├── dashboard.html        # Options page
│   └── dashboard.ts          # Dashboard logic
├── background.ts             # Alarm-based time limit checker (read-only for time)
├── content.ts                # Entry point, adapter selection
├── popup.ts                  # Popup UI logic
└── types.ts                  # PlatformAdapter, AppAction, ExtensionMessage
```

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome / Chromium

### Install & Build

```bash
git clone https://github.com/YazanAmmar/limitra.git
cd limitra
npm install

# Run code formatting, linting, and type checking
npm run check

# Development build (with sourcemaps for debugging)
npm run dev

# Production build (minified, ready for publishing)
npm run build
```

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Run Tests

```bash
npm test
```

## Changelog (Summary)

For full release notes, see [CHANGELOG.md](./CHANGELOG.md).

- **1.0.0**: First stable release with dual-limit enforcement, blocking overlay, anti-bypass protection, popup stats, settings dashboard, theme support, and English/Arabic localization.

## Roadmap

- Expand beyond YouTube Shorts into other high-distraction platforms (TikTok, Reels, etc.)
- Add richer analytics and historical usage views.
- Improve anti-bypass hardening for more edge cases.
- Introduce smarter recovery, reset, and scheduling options.
- Refine the public website, docs, and release assets around the extension.

## Contributing

If you want to support Limitra, follow updates, or help shape the project direction, start here:

- <https://limitra.xyz/#support>

## License

Limitra is licensed under the Business Source License 1.1 (BSL).

- Production Use: Allowed, provided you do not offer Limitra to third parties as a commercial service, SaaS, or monetized product.
- Commercial Use: Offering Limitra as a hosted service, SaaS, or monetized product requires explicit permission.
- Open Source Conversion: This version automatically converts to the Apache License 2.0 on January 1, 2030.

> This license allows production use, but restricts offering Limitra as a commercial hosted service or SaaS.

For full details, please see the [LICENSE](./LICENSE) file.

## Trademark

"Limitra" is a trademark of Yazan Ammar.

You are welcome to fork, modify, and contribute to this project.

> To avoid confusion, please do not use the name "Limitra", logo, or branding in derivative works without permission.

For collaborations or commercial inquiries, feel free to [reach out](mailto:support@limitra.xyz).

## Contact / Links

- **Website**: <https://limitra.xyz>
- **Support**: <https://limitra.xyz/#support>
- **GitHub Repo**: <https://github.com/YazanAmmar/limitra>
- **Releases**: <https://github.com/YazanAmmar/limitra/releases>
- **Issues**: <https://github.com/YazanAmmar/limitra/issues>
- **Email**: [support@limitra.xyz](mailto:support@limitra.xyz)
