# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0](https://github.com/YazanAmmar/limitra/releases/tag/v1.1.0) - 2026-04-29

### Added

- **YouTube Watch support**: Limitra now tracks and enforces limits on regular YouTube Watch pages (`/watch`) in addition to Shorts, with a 10-second watch threshold before a video counts.
- **Block Condition setting** (`Strict` / `Flexible`): Choose whether enforcement triggers when **either** limit is reached (OR) or only when **both** limits are exceeded simultaneously (AND). Configurable from the Command Center with dynamic descriptions and full i18n support.
- **Customizable Block Duration**: Users can now set how long a block lasts (15 minutes to 24 hours) instead of a fixed 6-hour interval.
- **Smart Session Lock**: An immutable `NEXT_RESET_KEY` prevents time-travel bypass during active blocks - the reset time is locked in as soon as a block begins.
- **Settings Lock During Active Block**: Settings modifications (limits, time limits, tracking mode) are rejected while a block is active, preventing last-second workarounds.
- **Sarcastic and Stoic quote tones**: Two new motivational tone modes added alongside the existing Gentle, Harsh, and Philosophical options, with expanded quote sets across all tones.
- **Global Settings Reset**: A dedicated reset action in the Command Center restores all global preferences to defaults.
- **Brutalist Modal Component**: A reusable confirmation modal used for the reset action and future destructive operations.
- **Brutal Tooltip Component**: Contextual tooltips integrated across the settings dashboard to explain options inline.
- **Hot-Swap Platform Detection**: The content engine now detects platform boundary crossings (e.g., Shorts → Watch) and re-bootstraps automatically without page reload, with full lifecycle cleanup to prevent memory leaks.
- **Dynamic Overlay Enforcement Reason**: The blocking overlay now displays the precise trigger - `Time`, `Count`, `Time & Video Limits` (both), or `Bypass` - resolved at enforcement time.
- **Ports & Adapters (Hexagonal) Architecture**: Core logic is now fully decoupled from Chrome APIs via abstract interfaces (`core/interfaces/`) and concrete adapters (`adapters/chrome/`). `BackgroundOrchestrator` is now environment-agnostic. Dependencies are injected exclusively at the composition roots (`background.ts`, `content.ts`).
- **Multi-Platform Scoped Storage**: All storage keys are dynamically prefixed per platform (`limitra_${platform}_key`), eliminating cross-platform data collisions and laying the foundation for future platform expansion.
- **Context-Aware Popup UI**: The popup now auto-detects the active platform or presents a platform selector dropdown on unsupported pages.
- Twitter/X social links added across the website and extension.
- `background-orchestrator.test.ts` added; `storage.test.ts` updated to use injected `StorageFacade`.

### Changed

- `StorageFacade` converted from a singleton to an injectable class.
- `SessionManager` now receives injected `StorageFacade` and `ConnectionManager`.
- `Messenger` now receives an injected `MessageBus`, removing direct `chrome.runtime` calls.
- `BLOCK_NOW` messages are now filtered by `PlatformId` to prevent cross-platform message crosstalk.
- `PlatformAdapter` interface migrated to `src/core/interfaces/` and its `id` property is now `readonly`.
- Background service worker replaces `window.matchMedia` (invalid in Service Workers) with `storage.getTheme()`.
- Overlay persistence watcher and controller split into separate modules (`overlay/persistence.ts`, `overlay/controller.ts`, `overlay/renderer.ts`).

### Fixed

- **Ghost overlay bug**: A stale blocking overlay left over from a previous installation or extension reload is now detected and removed on bootstrap.
- Custom select initialization timing in the popup - `chrome.tabs.query` is now properly awaited before the platform select is initialized.
- Time tracking no longer runs when a limit is set to zero.
- Live time limit changes are now applied immediately without requiring a page reload.
- `e.isTrusted` check removed from `custom-select.ts` to allow programmatic change events.

### Security

- `isCurrentlyBlocked()` is now the central gatekeeper: enforcement and punishment logic only executes after this check passes, ensuring AND/OR conditions are always respected.
- Smart session lock (`NEXT_RESET_KEY`) prevents time-travel bypass: the reset timestamp is frozen once a block is active, blocking attempts to shorten the penalty by manipulating the clock.

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
