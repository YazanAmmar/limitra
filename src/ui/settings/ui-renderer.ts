import { i18n } from '../../i18n/index';

export class UIRenderer {
  public applyTheme(theme: string) {
    const isPageDark =
      theme === 'dark' ||
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isPageDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }

  public updateUITexts() {
    const t = i18n.t;

    const map: Record<string, string> = {
      // Navigation
      'dash-title': t.dashboard.title,
      'nav-general': t.dashboard.sidebarGeneral,
      'nav-analytics': t.dashboard.sidebarAnalytics,
      'nav-ai': t.dashboard.sidebarAI,
      'nav-about': t.dashboard.sidebarAbout,
      'badge-analytics-soon': t.dashboard.comingSoon,
      'badge-ai-soon': t.dashboard.comingSoon,

      // About
      'title-about': t.dashboard.aboutTitle,
      'desc-about': t.dashboard.aboutDesc,

      // Language
      'lbl-dash-language': t.dashboard.languageLabel,
      'desc-dash-language': t.dashboard.descLanguage,

      // Theme
      'lbl-dash-theme': t.dashboard.themeLabel,
      'desc-dash-theme': t.dashboard.descTheme,
      'opt-theme-auto': t.dashboard.themeAuto,
      'opt-theme-light': t.dashboard.themeLight,
      'opt-theme-dark': t.dashboard.themeDark,

      // Tone
      'lbl-dash-tone': t.dashboard.toneLabel,
      'desc-dash-tone': t.dashboard.descTone,
      'opt-dash-random': t.tones.random,
      'opt-dash-gentle': t.tones.gentle,
      'opt-dash-harsh': t.tones.harsh,
      'opt-dash-phil': t.tones.philosophical,
      'opt-dash-sarcastic': t.tones.sarcastic,
      'opt-dash-stoic': t.tones.stoic,

      // Tracking
      'lbl-dash-tracking': t.dashboard.trackingMode,
      'desc-dash-tracking': t.dashboard.descTracking,
      'opt-strict': t.dashboard.modeStrictLabel,
      'opt-playing': t.dashboard.modePlayingLabel,
      'opt-smart': t.dashboard.modeSmartLabel,

      // Block Condition
      'lbl-dash-condition': t.dashboard.blockConditionLabel,
      'desc-dash-condition': t.dashboard.descBlockCondition,
      'opt-cond-or': t.dashboard.condOr,
      'opt-cond-and': t.dashboard.condAnd,

      // Groups
      'group-customization': t.dashboard.groupCustomization,
      'group-security': t.dashboard.groupSecurity,

      // Block Duration
      'lbl-dash-duration': t.dashboard.blockDurationLabel,
      'desc-dash-duration': t.dashboard.descBlockDuration,
      'opt-dur-15m': t.dashboard.duration15m,
      'opt-dur-1h': t.dashboard.duration1h,
      'opt-dur-3h': t.dashboard.duration3h,
      'opt-dur-6h': t.dashboard.duration6h,
      'opt-dur-12h': t.dashboard.duration12h,
      'opt-dur-24h': t.dashboard.duration24h,

      // Data
      'group-data': t.dashboard.groupData,
      'lbl-dash-reset': t.dashboard.resetTitle,
      'desc-dash-reset': t.dashboard.resetDesc,
      'btn-reset-settings': t.dashboard.resetBtn,

      // Analytics
      'group-analytics-title': t.dashboard.analyticsTitle,
      'lbl-stat-today': t.dashboard.statToday,
      'lbl-stat-sessions': t.dashboard.statSessions,
      'lbl-stat-trend': t.dashboard.statTrend,

      'opt-all-platforms': t.dashboard.optAllPlatforms,
      'lbl-usage-trends': t.dashboard.usageTrends,
      'opt-last-7-days': t.dashboard.last7Days,
      'opt-last-30-days': t.dashboard.last30Days,
      'opt-last-1-year': t.dashboard.last1Year,

      // CTA
      'btn-sponsor-text': t.dashboard.btnSponsor,

      // Footer
      'footer-copyright': t.dashboard.footerCopyright,
      'footer-privacy': t.dashboard.footerPrivacy,
      'lbl-platform-breakdown': t.dashboard.platformsBreakdown,
    };

    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    const platformMap: Record<string, string> = {
      youtube_shorts: t.popup.youtubeShorts,
      youtube_watch: t.popup.youtubeWatch,
      instagram_reels: t.popup.instagramReels,
      instagram_feed: t.popup.instagramFeed,
    };

    const platformSelect = document.getElementById(
      'analytics-platform-selector',
    ) as HTMLSelectElement;
    if (platformSelect) {
      Array.from(platformSelect.options).forEach((option) => {
        if (platformMap[option.value]) {
          option.textContent = platformMap[option.value];
        }
      });
    }

    document.body.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }

  public setupNavigation() {
    const tabs = ['general', 'analytics', 'ai', 'about'];

    tabs.forEach((tab) => {
      const btn = document.getElementById(`nav-${tab}`);
      if (btn) {
        btn.onclick = () => {
          tabs.forEach((t) => {
            document.getElementById(`nav-${t}`)?.classList.remove('active');
            document.getElementById(`content-${t}`)?.classList.remove('active');
          });

          btn.classList.add('active');
          document.getElementById(`content-${tab}`)?.classList.add('active');
        };
      }
    });

    document.getElementById('nav-general')?.click();
  }

  public updateTrackingDescription(mode: string) {
    const t = i18n.t;
    const el = document.getElementById('desc-dash-tracking');
    if (!el) return;

    const map: Record<string, string> = {
      strict: t.dashboard.modeStrict,
      playing_only: t.dashboard.modePlaying,
      smart: t.dashboard.modeSmart,
    };

    el.textContent = map[mode] || '';
  }

  public updateConditionDescription(mode: string) {
    const t = i18n.t;
    const el = document.getElementById('desc-dash-condition');
    if (!el) return;

    const map: Record<string, string> = {
      or: t.dashboard.descCondOr,
      and: t.dashboard.descCondAnd,
    };
    el.textContent = map[mode] || '';
  }
}
