import { LocaleStrings } from '../types';

const en: LocaleStrings = {
  popup: {
    title: 'Limitra',
    maxVideos: 'Max videos:',
    timeLimit: 'Time limit (minutes):',
    saveBtn: 'Save',
    savedMsg: 'Saved!',
    stopSpamming: 'Stop spamming! Go to work.',
    usageToday: 'Usage Today',
    videosUnit: 'Videos',
    timeTitle: 'Time',
    minsUnit: 'Mins',
    reason_count: 'Triggered by: Video Counter',
    reason_time: 'Triggered by: Time Limit',
    reason_bypass: 'Triggered by: Anti-Bypass System',
  },
  dashboard: {
    title: 'Limitra Command Center',
    sidebarGeneral: 'General Settings',
    sidebarAI: 'AI Assistant',
    sidebarAnalytics: 'Analytics',
    comingSoon: 'Coming Soon...',
    languageLabel: 'Language:',
    trackingMode: 'Tracking Mode (Anti-Bypass):',
    modeStrict: 'Strict (Always track if tab is open)',
    modePlaying: 'Playing Only (Track only if video plays)',
    modeSmart: 'Smart (Track if playing OR scrolling comments)',
    groupCustomization: 'App Customization',
    descLanguage: 'Choose your preferred interface language. Changes apply immediately.',
    groupSecurity: 'Security & Tracking',
    descTracking:
      'Determine how strictly Limitra monitors your activity and calculates time spent.',
    themeLabel: 'Theme',
    descTheme: 'Choose your preferred color scheme.',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeAuto: 'System Auto',
    toneLabel: 'Quote Tone',
    descTone: 'Select the tone of the quotes shown on the block screen.',
    sidebarAbout: 'About',
    aboutTitle: 'About Limitra',
    aboutDesc: 'Built to protect your attention.',
  },
  tones: {
    random: 'Random (Mixed)',
    gentle: 'Gentle',
    harsh: 'Harsh',
    philosophical: 'Philosophical',
  },
  quotes: {
    gentle: [
      'Take a break. You earned it.',
      "It's okay to rest now.",
      'Your eyes need some time off the screen.',
    ],
    harsh: [
      'Stop wasting your life scrolling.',
      'You are letting the algorithm control you. Pathetic.',
      'Go do something useful.',
    ],
    philosophical: [
      'Time you enjoy wasting is not wasted time, but is this enjoyment?',
      'The mind is everything. What you consume, you become.',
      'Control > impulse.',
    ],
  },
  overlay: {
    badgeBlocked: 'BLOCKED',
    unlocksIn: 'Unlocks in:',
    unlocking: 'Unlocking...',
    clickToCopy: 'Click to copy',
    copiedText: 'Copied!',
  },
};

export default en;
