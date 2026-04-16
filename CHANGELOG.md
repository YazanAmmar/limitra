# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0](https://github.com/YazanAmmar/limitra/releases/tag/v1.0.0) - 2026-04-16

### Added

- Dual-constraint limiting system supporting both video count and active session time thresholds.
- Video enforcement mechanism that automatically pauses and mutes active videos, and blocks playback-related keyboard shortcuts (Space, K, Arrows).
- Fullscreen blocking overlay triggered on limit breach, featuring:
  - Live countdown until the next session reset (6-hour intervals).
  - Display of the exact enforcement reason (Time, Count, or Bypass).
  - Interactive, click-to-copy motivational quotes with toast notifications.
- Quote system with dynamic tones (Random, Gentle, Harsh, Philosophical).
- Background session heartbeat (2-second interval) to track activity and prevent time-skipping exploits.
- Introduced multiple tracking modes (Strict, Playing Only, Smart) for flexible time calculation.
- Platform adapter architecture with full support and integration for YouTube Shorts.
- Interactive popup UI displaying real-time usage statistics and dynamic progress bars.
- Command Center dashboard for managing tracking modes, themes, language, and security behavior.
- Theming engine supporting Light, Dark, and System Auto modes across all UI views.
- Full internationalization (i18n) support with English and Arabic, including dynamic RTL/LTR layout switching.

### Security

- Anti-bypass and tampering protection system that detects and blocks:
  - Manual counter resets and storage manipulation.
  - Overlay removal or CSS hiding attempts via browser DevTools.
  - Rapid storage wipe attempts.

### Maintenance

- Core extension architecture built strictly on Chrome Manifest V3.
- Codebase written entirely in TypeScript with strict type-checking enabled.
- Modular storage system isolating settings, statistics, sessions, and security logic.
- Integration of ESLint and Prettier to enforce consistent code quality.
- Implementation of Vitest test suite covering core limiter logic and storage behavior.
- Optimized production build pipeline utilizing esbuild.
