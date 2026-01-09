export type Language = 'en' | 'my';

export const translations = {
  en: {
    // Header
    appName: 'FOOTSTREAM',
    allMatches: 'All Matches',
    live: 'Live',
    upcoming: 'Upcoming',
    searchTeams: 'Search teams...',
    
    // Match Status
    statusLive: 'LIVE',
    statusUpcoming: 'UPCOMING',
    statusFinished: 'FINISHED',
    
    // Match Detail
    backToMatches: 'Back to matches',
    home: 'Home',
    away: 'Away',
    matchNotFound: 'Match not found',
    matchNotFoundDesc: "The match you're looking for doesn't exist",
    
    // Streaming
    selectStream: 'Select a Stream',
    selectStreamDesc: 'Choose a stream from the list below to start watching',
    availableStreams: 'Available Streams',
    noStreams: 'No streams available',
    noStreamsDesc: 'Check back later for live streams',
    source: 'source',
    sources: 'sources',
    openInNewTab: 'Open in New Tab',
    playEmbedded: 'Play in Embedded Player',
    openExternal: 'Open External',
    currentlyStreaming: 'Currently streaming',
    active: 'Active',
    externalLink: 'External link',
    tryEmbeddedAgain: 'Try Embedded Player Again',
    embeddedUnavailable: 'Embedded player unavailable',
    watchOn: 'Watch on',
    clickToOpen: 'Click to open stream in new tab',
    
    // HLS Player
    loading: 'Loading...',
    retry: 'Retry',
    networkError: 'Network error. Trying to recover...',
    mediaError: 'Media error. Trying to recover...',
    streamUnavailable: 'Stream unavailable',
    failedToLoad: 'Failed to load video',
    hlsNotSupported: 'HLS is not supported in this browser',
    auto: 'Auto',
    quality: 'Quality',
    
    // Quality badges
    qualityHD: 'HD',
    qualitySD: 'SD',
    qualityLOW: 'LOW',
    
    // Stream types
    streamTypeHLS: 'HLS',
    streamTypeEmbed: 'Embed',
    streamTypeExternal: 'External',
    
    // Footer
    footerRights: '© 2024 FootStream. All rights reserved.',
    footerDesc: 'Live football streaming platform',
    developer: 'Developer',
    
    // Errors
    failedToLoadMatches: 'Failed to load matches',
    tryAgainLater: 'Please try again later',
    noMatchesFound: 'No matches found',
    adjustFilters: 'Try adjusting your filters',
    
    // Common
    watchNow: 'Watch Now',
    streams: 'streams',
    stream: 'stream',
  },
  my: {
    // Header
    appName: 'FOOTSTREAM',
    allMatches: 'ပွဲစဉ်များ',
    live: 'တိုက်ရိုက်',
    upcoming: 'လာမည့်ပွဲ',
    searchTeams: 'အသင်းများရှာရန်...',
    
    // Match Status
    statusLive: 'တိုက်ရိုက်',
    statusUpcoming: 'လာမည့်ပွဲ',
    statusFinished: 'ပြီးဆုံး',
    
    // Match Detail
    backToMatches: 'ပွဲစဉ်များသို့',
    home: 'အိမ်ကွင်း',
    away: 'အဝေး',
    matchNotFound: 'ပွဲစဉ်မတွေ့ပါ',
    matchNotFoundDesc: 'သင်ရှာနေသောပွဲစဉ်မရှိပါ',
    
    // Streaming
    selectStream: 'လိုင်းရွေးချယ်ပါ',
    selectStreamDesc: 'ကြည့်ရှုရန် အောက်ပါလိုင်းတစ်ခုကို ရွေးချယ်ပါ',
    availableStreams: 'ရရှိနိုင်သောလိုင်းများ',
    noStreams: 'လိုင်းမရှိသေးပါ',
    noStreamsDesc: 'တိုက်ရိုက်လိုင်းများအတွက် နောက်မှပြန်စစ်ဆေးပါ',
    source: 'လိုင်း',
    sources: 'လိုင်းများ',
    openInNewTab: 'Tab အသစ်တွင်ဖွင့်ရန်',
    playEmbedded: 'ထည့်သွင်းထားသော Player ဖြင့်ဖွင့်ရန်',
    openExternal: 'ပြင်ပတွင်ဖွင့်ရန်',
    currentlyStreaming: 'လက်ရှိထုတ်လွှင့်နေသည်',
    active: 'လှုပ်ရှားနေသည်',
    externalLink: 'ပြင်ပလင့်',
    tryEmbeddedAgain: 'ထည့်သွင်းထားသော Player ကိုထပ်စမ်းပါ',
    embeddedUnavailable: 'ထည့်သွင်းထားသော player မရရှိနိုင်ပါ',
    watchOn: 'ကြည့်ရှုရန်',
    clickToOpen: 'Tab အသစ်တွင်ဖွင့်ရန် နှိပ်ပါ',
    
    // HLS Player
    loading: 'ဖွင့်နေသည်...',
    retry: 'ထပ်စမ်းပါ',
    networkError: 'ကွန်ရက်အမှား။ ပြန်လည်ရယူနေသည်...',
    mediaError: 'မီဒီယာအမှား။ ပြန်လည်ရယူနေသည်...',
    streamUnavailable: 'လိုင်းမရရှိနိုင်ပါ',
    failedToLoad: 'ဗီဒီယိုဖွင့်ရန်မအောင်မြင်ပါ',
    hlsNotSupported: 'ဤ browser တွင် HLS ကိုမပံ့ပိုးပါ',
    auto: 'အော်တို',
    quality: 'အရည်အသွေး',
    
    // Quality badges
    qualityHD: 'HD',
    qualitySD: 'SD',
    qualityLOW: 'နိမ့်',
    
    // Stream types
    streamTypeHLS: 'HLS',
    streamTypeEmbed: 'ထည့်သွင်း',
    streamTypeExternal: 'ပြင်ပ',
    
    // Footer
    footerRights: '© ၂၀၂၄ FootStream။ မူပိုင်ခွင့်များ ထိန်းသိမ်းထားသည်။',
    footerDesc: 'တိုက်ရိုက်ဘောလုံးကြည့်ရှုရေး',
    developer: 'Developer',
    
    // Errors
    failedToLoadMatches: 'ပွဲစဉ်များဖွင့်ရန်မအောင်မြင်ပါ',
    tryAgainLater: 'နောက်မှထပ်စမ်းပါ',
    noMatchesFound: 'ပွဲစဉ်မတွေ့ပါ',
    adjustFilters: 'စစ်ထုတ်မှုများကိုချိန်ညှိပါ',
    
    // Common
    watchNow: 'ယခုကြည့်ရန်',
    streams: 'လိုင်းများ',
    stream: 'လိုင်း',
  },
};

export type TranslationKey = keyof typeof translations.en;
