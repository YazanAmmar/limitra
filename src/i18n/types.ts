export type LocaleCode = 'en' | 'ar';

export interface LocaleStrings {
  popup: {
    title: string;
    maxVideos: string;
    timeLimit: string;
    saveBtn: string;
    savedMsg: string;
    stopSpamming: string;
    usageToday: string;
    videosUnit: string;
    timeTitle: string;
    minsUnit: string;
    reason_count: string;
    reason_time: string;
    reason_bypass: string;
    checking: string;
    refreshPage: string;
    youtubeShorts: string;
    unsupportedSite: string;
  };
  dashboard: {
    title: string;
    sidebarGeneral: string;
    sidebarAI: string;
    sidebarAnalytics: string;
    comingSoon: string;
    languageLabel: string;
    trackingMode: string;
    modeStrictLabel: string;
    modePlayingLabel: string;
    modeSmartLabel: string;
    modeStrict: string;
    modePlaying: string;
    modeSmart: string;
    groupCustomization: string;
    descLanguage: string;
    groupSecurity: string;
    themeLabel: string;
    descTheme: string;
    themeLight: string;
    themeDark: string;
    themeAuto: string;
    toneLabel: string;
    descTone: string;
    sidebarAbout: string;
    aboutTitle: string;
    aboutDesc: string;
    btnSponsor: string;
    descTracking: string;
    footerCopyright: string;
    footerPrivacy: string;
  };
  tones: {
    random: string;
    gentle: string;
    harsh: string;
    philosophical: string;
  };
  quotes: {
    gentle: string[];
    harsh: string[];
    philosophical: string[];
  };
  overlay: {
    badgeBlocked: string;
    unlocksIn: string;
    unlocking: string;
    clickToCopy: string;
    copiedText: string;
  };
}
