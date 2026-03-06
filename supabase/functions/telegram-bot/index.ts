import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_TOKEN = () => Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = () => Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = () => Deno.env.get("SUPABASE_ANON_KEY")!;
const GROQ_API_KEY = () => Deno.env.get("GROQ_API_KEY")!;

const getSupabase = () => createClient(SUPABASE_URL(), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// ─── i18n ───
type Lang = "en" | "my";
const langCache = new Map<number, Lang>();

async function getSavedLang(chatId: number): Promise<Lang | null> {
  if (langCache.has(chatId)) return langCache.get(chatId)!;
  const sb = getSupabase();
  const { data } = await sb.from("telegram_user_settings").select("language").eq("chat_id", chatId).maybeSingle();
  if (data?.language) {
    const lang = data.language as Lang;
    langCache.set(chatId, lang);
    return lang;
  }
  return null;
}

async function saveLang(chatId: number, lang: Lang) {
  langCache.set(chatId, lang);
  const sb = getSupabase();
  await sb.from("telegram_user_settings").upsert({ chat_id: chatId, language: lang, updated_at: new Date().toISOString() }, { onConflict: "chat_id" });
}

const t = (lang: Lang) => ({
  en: {
    botTitle: "⚽ Football Live Streaming Bot",
    welcome: "Welcome! I'm your football companion:",
    watchLive: "Watch <b>Live Matches</b>",
    checkUpcoming: "Check <b>Upcoming Games</b>",
    getPredictions: "Get <b>AI Predictions & Tips</b>",
    accessStreams: "Access <b>Live Streams</b>",
    getStarted: "Use the buttons below to get started! 👇",
    liveMatches: "🔴 Live Matches",
    upcoming: "🕐 Upcoming",
    allMatches: "⚽ All Matches",
    quickPredictions: "📊 Quick Predictions",
    refresh: "🔄 Refresh",
    backToMenu: "🔙 Back to Menu",
    backToMatches: "🔙 Back to Matches",
    liveTitle: "🔴 <b>LIVE MATCHES</b>",
    upcomingTitle: "🕐 <b>UPCOMING MATCHES</b>",
    allTitle: "⚽ <b>ALL MATCHES</b>",
    noMatches: (s: string | null) => s ? `No ${s} matches right now.` : "No matches available.",
    page: (c: number, t: number, total: number) => `📄 Page ${c}/${t} | Total: ${total}`,
    prev: "⬅️ Prev",
    next: "➡️ Next",
    matchDetails: "📋 Match Details",
    matchDetailsTitle: "MATCH DETAILS",
    time: "Time",
    status: "Status",
    streamsAvailable: (n: number) => `Streams Available: ${n}`,
    getAiPrediction: "🔮 Get AI Prediction & Tips",
    viewOnWebsite: "🌐 View on Website",
    predictionTitle: "🔮 <b>AI PREDICTION</b>",
    winner: "Winner",
    predictedScore: "Predicted Score",
    confidence: "Confidence",
    analysis: "Analysis",
    bettingTips: "🎯 <b>BETTING TIPS</b>",
    tip: "Tip",
    disclaimer: "⚠️ <i>Tips are AI-generated for informational purposes only. Bet responsibly.</i>",
    refreshPrediction: "🔄 Refresh Prediction",
    analyzing: "Analyzing...",
    pleaseWait: "Getting AI prediction, please wait...",
    matchNotFound: "❌ Match not found.",
    predictionFailed: "❌ Failed to generate prediction. Please try again.",
    tryAgain: "🔄 Try Again",
    back: "🔙 Back",
    chooseOption: "Choose an option below 👇",
    selectMatch: "Select a match to get AI prediction:",
    searchResults: (q: string) => `🔍 <b>Search results for "${q}":</b>`,
    noSearchResults: (q: string) => `🔍 No matches found for "${q}". Try a team name!`,
    commands: "📖 <b>Commands</b>",
    helpTip: "💡 <b>Tip:</b> Use inline buttons for the best experience!",
    chooseLang: "🌐 <b>Choose Language / ဘာသာစကားရွေးပါ</b>",
    langBtn: "🇬🇧 English",
    langSet: "Language set to English ✅",
    changeLang: "🌐 Language",
    noPredMatches: "No matches available for predictions.",
    stream: (i: number) => `Stream ${i}`,
  },
  my: {
    botTitle: "⚽ ဘောလုံး တိုက်ရိုက် ကြည့်ရှုရေး Bot",
    welcome: "ကြိုဆိုပါတယ်! သင့်ဘောလုံးလမ်းညွှန်ပါ:",
    watchLive: "<b>တိုက်ရိုက်ပွဲများ</b> ကြည့်ရှုရန်",
    checkUpcoming: "<b>လာမည့်ပွဲများ</b> စစ်ဆေးရန်",
    getPredictions: "<b>AI ခန့်မှန်းချက်နှင့် Tips</b> ရယူရန်",
    accessStreams: "<b>တိုက်ရိုက် Streams</b> ကြည့်ရှုရန်",
    getStarted: "အောက်က ခလုတ်များကို နှိပ်ပါ! 👇",
    liveMatches: "🔴 တိုက်ရိုက်ပွဲများ",
    upcoming: "🕐 လာမည့်ပွဲများ",
    allMatches: "⚽ ပွဲအားလုံး",
    quickPredictions: "📊 ခန့်မှန်းချက်များ",
    refresh: "🔄 ပြန်လည်ရယူ",
    backToMenu: "🔙 မီနူးသို့",
    backToMatches: "🔙 ပွဲများသို့",
    liveTitle: "🔴 <b>တိုက်ရိုက်ပွဲများ</b>",
    upcomingTitle: "🕐 <b>လာမည့်ပွဲများ</b>",
    allTitle: "⚽ <b>ပွဲအားလုံး</b>",
    noMatches: (s: string | null) => s ? `${s === "live" ? "တိုက်ရိုက်" : s === "upcoming" ? "လာမည့်" : ""} ပွဲများ မရှိပါ။` : "ပွဲများ မရှိပါ။",
    page: (c: number, t: number, total: number) => `📄 စာမျက်နှာ ${c}/${t} | စုစုပေါင်း: ${total}`,
    prev: "⬅️ ရှေ့",
    next: "➡️ နောက်",
    matchDetails: "📋 ပွဲအသေးစိတ်",
    matchDetailsTitle: "ပွဲအသေးစိတ်",
    time: "အချိန်",
    status: "အခြေအနေ",
    streamsAvailable: (n: number) => `ရနိုင်သော Streams: ${n}`,
    getAiPrediction: "🔮 AI ခန့်မှန်းချက် ရယူရန်",
    viewOnWebsite: "🌐 Website တွင်ကြည့်ရန်",
    predictionTitle: "🔮 <b>AI ခန့်မှန်းချက်</b>",
    winner: "အနိုင်ရသူ",
    predictedScore: "ခန့်မှန်းရမှတ်",
    confidence: "ယုံကြည်မှု",
    analysis: "သုံးသပ်ချက်",
    bettingTips: "🎯 <b>လောင်းကြေး TIPS</b>",
    tip: "Tip",
    disclaimer: "⚠️ <i>Tips များသည် AI မှ ထုတ်ပေးထားပြီး အချက်အလက်အတွက်သာ ဖြစ်ပါသည်။ တာဝန်သိစွာ လောင်းပါ။</i>",
    refreshPrediction: "🔄 ခန့်မှန်းချက် ပြန်ယူ",
    analyzing: "သုံးသပ်နေသည်...",
    pleaseWait: "AI ခန့်မှန်းချက် ရယူနေပါသည်၊ ခဏစောင့်ပါ...",
    matchNotFound: "❌ ပွဲ ရှာမတွေ့ပါ။",
    predictionFailed: "❌ ခန့်မှန်းချက် ထုတ်ပေးနိုင်ခြင်း မရှိပါ။ ထပ်ကြိုးစားပါ။",
    tryAgain: "🔄 ထပ်ကြိုးစား",
    back: "🔙 နောက်သို့",
    chooseOption: "အောက်မှ ရွေးချယ်ပါ 👇",
    selectMatch: "AI ခန့်မှန်းချက်အတွက် ပွဲတစ်ခု ရွေးပါ:",
    searchResults: (q: string) => `🔍 <b>"${q}" ရှာဖွေမှုရလဒ်:</b>`,
    noSearchResults: (q: string) => `🔍 "${q}" အတွက် ပွဲများ မတွေ့ပါ။ အသင်းနာမည် ရိုက်ကြည့်ပါ!`,
    commands: "📖 <b>ညွှန်ကြားချက်များ</b>",
    helpTip: "💡 <b>အကြံ:</b> Inline ခလုတ်များ သုံးပါ!",
    chooseLang: "🌐 <b>Choose Language / ဘာသာစကားရွေးပါ</b>",
    langBtn: "🇲🇲 မြန်မာ",
    langSet: "ဘာသာစကား မြန်မာ သို့ပြောင်းပြီးပါပြီ ✅",
    changeLang: "🌐 ဘာသာစကား",
    noPredMatches: "ခန့်မှန်းရန် ပွဲများ မရှိပါ။",
    stream: (i: number) => `Stream ${i}`,
  },
})[lang];

const getLang = async (chatId: number): Promise<Lang> => (await getSavedLang(chatId)) || "my";

// ─── Telegram helpers ───
const tgApi = async (method: string, body: Record<string, unknown>) => {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
};

const sendMessage = (chatId: number, text: string, extra?: Record<string, unknown>) =>
  tgApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });

const editMessage = (chatId: number, msgId: number, text: string, extra?: Record<string, unknown>) =>
  tgApi("editMessageText", { chat_id: chatId, message_id: msgId, text, parse_mode: "HTML", ...extra });

const answerCallback = (id: string, text?: string) =>
  tgApi("answerCallbackQuery", { callback_query_id: id, text });

async function fetchMatches() {
  const res = await fetch(`${SUPABASE_URL()}/functions/v1/matches-proxy`, {
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY()}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

function getMatchStatus(score: string, time: string): "live" | "upcoming" | "finished" {
  const tl = time.toLowerCase().trim();
  if (tl.includes("live") || tl.includes("'") || tl.includes("ht") || tl.includes("half")) return "live";
  const hasScore = score && score !== "vs" && score !== "-" && /\d+\s*-\s*\d+/.test(score);
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = new Date(+m[5], +m[4] - 1, +m[3], +m[1], +m[2]);
    const diff = (Date.now() - d.getTime()) / 60000;
    if (hasScore) return diff > 150 ? "finished" : "live";
    if (diff < 0) return "upcoming";
    if (diff <= 120) return "live";
    return "finished";
  }
  return hasScore ? "live" : "upcoming";
}

function generateId(match: { home_name: string; away_name: string; time: string }) {
  const raw = `${match.home_name.trim()}-${match.away_name.trim()}-${match.time.trim()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) { hash = ((hash << 5) - hash) + raw.charCodeAt(i); hash |= 0; }
  return `m${Math.abs(hash).toString(36)}`;
}

async function getPrediction(home: string, away: string, comp: string, score: string, time: string) {
  const prompt = `You are an elite professional football betting analyst.
Analyze this match and provide 5 high-quality betting tips:
Match: ${home} vs ${away} | Competition: ${comp} | Score: ${score} | Time: ${time}

RULES: predicted_score "HomeGoals-AwayGoals". winner must match score. 5 tips with different bet types.
Respond ONLY JSON: {"winner":"home/away/draw","confidence":0-100,"predicted_score":"X-Y","tips":[{"tip":"market name","confidence":"high/medium/low","description":"under 25 words"}],"analysis":"under 60 words"}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Elite football betting analyst. Valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4, max_tokens: 2048, response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content");
  const pred = JSON.parse(content);
  if (pred.predicted_score) {
    const p = pred.predicted_score.split("-").map(Number);
    if (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) {
      pred.winner = p[0] > p[1] ? "home" : p[0] < p[1] ? "away" : "draw";
    }
  }
  return pred;
}

const statusEmoji = (s: string) => s === "live" ? "🔴" : s === "upcoming" ? "🕐" : "✅";
const confEmoji = (c: string) => c === "high" ? "🟢" : c === "medium" ? "🟡" : "🔴";

function mainMenuKeyboard(lang: Lang) {
  const s = t(lang);
  return {
    inline_keyboard: [
      [{ text: s.liveMatches, callback_data: "menu_live" }, { text: s.upcoming, callback_data: "menu_upcoming" }],
      [{ text: s.allMatches, callback_data: "menu_all" }],
      [{ text: s.quickPredictions, callback_data: "menu_predictions" }],
      [{ text: s.changeLang, callback_data: "menu_lang" }, { text: s.refresh, callback_data: "menu_refresh" }],
    ],
  };
}

const line = "━━━━━━━━━━━━━━━━━━━━━━━━";
const thinLine = "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄";

function formatMatchList(matches: any[], status: string | null, lang: Lang, page = 0) {
  const s = t(lang);
  const PAGE_SIZE = 8;
  let filtered = matches;
  if (status) filtered = matches.filter((m: any) => getMatchStatus(m.score, m.time) === status);

  if (filtered.length === 0) {
    return {
      text: `${line}\n${s.noMatches(status)}\n${line}`,
      keyboard: { inline_keyboard: [[{ text: s.backToMenu, callback_data: "menu_main" }]] },
    };
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageMatches = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const title = status === "live" ? s.liveTitle : status === "upcoming" ? s.upcomingTitle : s.allTitle;

  let text = `${line}\n${title}\n${line}\n\n`;
  pageMatches.forEach((m: any, i: number) => {
    const st = getMatchStatus(m.score, m.time);
    const scoreDisplay = m.score === "vs" ? "  🆚  " : ` ${m.score} `;
    text += `${statusEmoji(st)} │ <b>${m.home_name}</b>${scoreDisplay}<b>${m.away_name}</b>\n`;
    text += `    │ 📺 ${m.label}\n`;
    text += `    │ ⏱ ${m.time}\n`;
    if (i < pageMatches.length - 1) text += `${thinLine}\n`;
  });
  text += `\n${line}\n${s.page(page + 1, totalPages, filtered.length)}\n${line}`;

  const buttons: any[][] = [];
  const row: any[] = [];
  pageMatches.forEach((m: any) => {
    const id = generateId(m);
    row.push({ text: `📋 ${m.home_name.slice(0, 8)} v ${m.away_name.slice(0, 8)}`, callback_data: `match_${id}` });
    if (row.length === 2) { buttons.push([...row]); row.length = 0; }
  });
  if (row.length) buttons.push([...row]);

  const navRow: any[] = [];
  if (page > 0) navRow.push({ text: s.prev, callback_data: `page_${status || "all"}_${page - 1}` });
  if (page < totalPages - 1) navRow.push({ text: s.next, callback_data: `page_${status || "all"}_${page + 1}` });
  if (navRow.length) buttons.push(navRow);
  buttons.push([{ text: s.backToMenu, callback_data: "menu_main" }]);

  return { text, keyboard: { inline_keyboard: buttons } };
}

function formatMatchDetail(match: any, lang: Lang) {
  const s = t(lang);
  const status = getMatchStatus(match.score, match.time);
  const scoreDisplay = match.score === "vs" ? "🆚" : match.score;

  let text = `${line}\n${statusEmoji(status)} <b>${s.matchDetailsTitle}</b>\n${line}\n\n`;
  text += `🏟 <b>${match.label}</b>\n\n`;
  text += `${thinLine}\n`;
  text += `🏠 <b>${match.home_name}</b>\n`;
  text += `         ⚽ <b>${scoreDisplay}</b>\n`;
  text += `✈️ <b>${match.away_name}</b>\n`;
  text += `${thinLine}\n\n`;
  text += `⏱ ${s.time}:  <code>${match.time}</code>\n`;
  text += `📊 ${s.status}:  <b>${status.toUpperCase()}</b>\n`;

  const hasStreams = match.authors?.length > 0;
  if (hasStreams) {
    text += `\n${thinLine}\n`;
    text += `📺 <b>${s.streamsAvailable(match.authors.length)}</b>\n`;
    text += `${thinLine}\n`;
  }

  const id = generateId(match);
  const appUrl = `https://ballpwel.lovable.app/matches/${encodeURIComponent(id)}`;
  const buttons: any[][] = [[{ text: s.getAiPrediction, callback_data: `pred_${id}` }]];
  if (hasStreams) {
    buttons.push([{ text: `📺 ${s.viewOnWebsite}`, web_app: { url: appUrl } }]);
  }
  buttons.push([{ text: s.backToMatches, callback_data: "menu_all" }]);

  return { text, keyboard: { inline_keyboard: buttons } };
}

function formatPrediction(pred: any, home: string, away: string, lang: Lang) {
  const s = t(lang);
  const winnerLabel = pred.winner === "home" ? home : pred.winner === "away" ? away : "Draw";
  const winnerEmoji = pred.winner === "home" ? "🏠" : pred.winner === "away" ? "✈️" : "🤝";

  let text = `${line}\n${s.predictionTitle}\n${line}\n\n`;

  text += `${winnerEmoji} <b>${s.winner}:</b>  ${winnerLabel}\n`;
  text += `⚽ <b>${s.predictedScore}:</b>  ${pred.predicted_score}\n`;

  // Confidence bar
  const conf = pred.confidence || 0;
  const filled = Math.round(conf / 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  text += `📊 <b>${s.confidence}:</b>  [${bar}] ${conf}%\n`;

  text += `\n${thinLine}\n`;
  text += `📝 <b>${s.analysis}:</b>\n${pred.analysis}\n`;
  text += `${thinLine}\n\n`;

  text += `${s.bettingTips}\n${line}\n\n`;

  if (pred.tips?.length) {
    pred.tips.forEach((tip: any, i: number) => {
      text += `${confEmoji(tip.confidence)} <b>${s.tip} ${i + 1}</b>\n`;
      text += `    ├ 🎰 ${tip.tip}\n`;
      text += `    ├ 📌 ${tip.description}\n`;
      text += `    └ 🎯 ${s.confidence}: <b>${tip.confidence.toUpperCase()}</b>\n`;
      if (i < pred.tips.length - 1) text += `\n`;
    });
  }
  text += `\n${line}\n${s.disclaimer}\n${line}`;
  return text;
}

async function handleUpdate(update: any) {
  try {
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      const lang = await getLang(chatId);
      const s = t(lang);

      if (text === "/start") {
        // If user already has a saved language, skip language selection
        const savedLang = await getSavedLang(chatId);
        if (savedLang) {
          const s2 = t(savedLang);
          const welcome = `${line}\n${s2.botTitle}\n${line}\n\n${s2.welcome}\n\n🔴 ${s2.watchLive}\n🕐 ${s2.checkUpcoming}\n🔮 ${s2.getPredictions}\n📺 ${s2.accessStreams}\n\n${thinLine}\n\n${s2.getStarted}`;
          return sendMessage(chatId, welcome, { reply_markup: mainMenuKeyboard(savedLang) });
        }
        return sendMessage(chatId,
          `${line}\n🌐 <b>Choose Language / ဘာသာစကားရွေးပါ</b>\n${line}`,
          { reply_markup: { inline_keyboard: [
            [{ text: "🇬🇧 English", callback_data: "lang_en" }, { text: "🇲🇲 မြန်မာ", callback_data: "lang_my" }],
          ]}}
        );
      }

      if (text === "/lang") {
        return sendMessage(chatId, s.chooseLang, {
          reply_markup: { inline_keyboard: [
            [{ text: "🇬🇧 English", callback_data: "lang_en" }, { text: "🇲🇲 မြန်မာ", callback_data: "lang_my" }],
          ]},
        });
      }

      if (text === "/live") {
        const matches = await fetchMatches();
        const { text: msg, keyboard } = formatMatchList(matches, "live", lang);
        return sendMessage(chatId, msg, { reply_markup: keyboard });
      }
      if (text === "/upcoming") {
        const matches = await fetchMatches();
        const { text: msg, keyboard } = formatMatchList(matches, "upcoming", lang);
        return sendMessage(chatId, msg, { reply_markup: keyboard });
      }
      if (text === "/matches") {
        const matches = await fetchMatches();
        const { text: msg, keyboard } = formatMatchList(matches, null, lang);
        return sendMessage(chatId, msg, { reply_markup: keyboard });
      }
      if (text === "/help") {
        const help = `${line}\n${s.commands}\n${line}\n\n/start  ─  Menu\n/live    ─  ${s.liveMatches}\n/upcoming ─ ${s.upcoming}\n/matches ─ ${s.allMatches}\n/lang   ─  ${s.changeLang}\n/help   ─  Help\n\n${thinLine}\n${s.helpTip}`;
        return sendMessage(chatId, help, { reply_markup: mainMenuKeyboard(lang) });
      }

      // Search
      const matches = await fetchMatches();
      const q = text.toLowerCase();
      const found = matches.filter((m: any) => m.home_name.toLowerCase().includes(q) || m.away_name.toLowerCase().includes(q));
      if (found.length > 0) {
        const { text: msg, keyboard } = formatMatchList(found, null, lang);
        return sendMessage(chatId, s.searchResults(text) + "\n\n" + msg, { reply_markup: keyboard });
      }
      return sendMessage(chatId, s.noSearchResults(text), { reply_markup: mainMenuKeyboard(lang) });
    }

    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const msgId = cb.message.message_id;
      const data = cb.data;

      await answerCallback(cb.id);

      // Language selection
      if (data === "lang_en" || data === "lang_my") {
        const newLang: Lang = data === "lang_en" ? "en" : "my";
        await saveLang(chatId, newLang);
        const s = t(newLang);
        const welcome = `${line}\n${s.botTitle}\n${line}\n\n✅ ${s.langSet}\n\n${thinLine}\n\n${s.welcome}\n\n🔴 ${s.watchLive}\n🕐 ${s.checkUpcoming}\n🔮 ${s.getPredictions}\n📺 ${s.accessStreams}\n\n${thinLine}\n\n${s.getStarted}`;
        return editMessage(chatId, msgId, welcome, { reply_markup: mainMenuKeyboard(newLang) });
      }

      const lang = await getLang(chatId);
      const s = t(lang);

      if (data === "menu_lang") {
        return editMessage(chatId, msgId, `${line}\n${s.chooseLang}\n${line}`, {
          reply_markup: { inline_keyboard: [
            [{ text: "🇬🇧 English", callback_data: "lang_en" }, { text: "🇲🇲 မြန်မာ", callback_data: "lang_my" }],
            [{ text: s.backToMenu, callback_data: "menu_main" }],
          ]},
        });
      }

      if (data === "menu_main" || data === "menu_refresh") {
        return editMessage(chatId, msgId, `${line}\n${s.botTitle}\n${line}\n\n${s.chooseOption}`, { reply_markup: mainMenuKeyboard(lang) });
      }
      if (data === "menu_live") {
        const matches = await fetchMatches();
        const { text, keyboard } = formatMatchList(matches, "live", lang);
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }
      if (data === "menu_upcoming") {
        const matches = await fetchMatches();
        const { text, keyboard } = formatMatchList(matches, "upcoming", lang);
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }
      if (data === "menu_all") {
        const matches = await fetchMatches();
        const { text, keyboard } = formatMatchList(matches, null, lang);
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }
      if (data === "menu_predictions") {
        const matches = await fetchMatches();
        const live = matches.filter((m: any) => getMatchStatus(m.score, m.time) === "live");
        const target = live.length > 0 ? live : matches.slice(0, 10);
        if (target.length === 0) {
          return editMessage(chatId, msgId, s.noPredMatches, {
            reply_markup: { inline_keyboard: [[{ text: s.back, callback_data: "menu_main" }]] },
          });
        }
        let text = `🔮 <b>${lang === "my" ? "ခန့်မှန်းချက်များ" : "QUICK PREDICTIONS"}</b>\n${"─".repeat(24)}\n\n${s.selectMatch}\n\n`;
        const buttons: any[][] = [];
        target.slice(0, 10).forEach((m: any) => {
          text += `${statusEmoji(getMatchStatus(m.score, m.time))} ${m.home_name} vs ${m.away_name}\n`;
          buttons.push([{ text: `🔮 ${m.home_name} v ${m.away_name}`, callback_data: `pred_${generateId(m)}` }]);
        });
        buttons.push([{ text: s.backToMenu, callback_data: "menu_main" }]);
        return editMessage(chatId, msgId, text, { reply_markup: { inline_keyboard: buttons } });
      }

      if (data.startsWith("page_")) {
        const parts = data.split("_");
        const status = parts[1] === "all" ? null : parts[1];
        const page = parseInt(parts[2]);
        const matches = await fetchMatches();
        const { text, keyboard } = formatMatchList(matches, status, lang, page);
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }

      if (data.startsWith("match_")) {
        const matches = await fetchMatches();
        const match = matches.find((m: any) => generateId(m) === data.replace("match_", ""));
        if (!match) return editMessage(chatId, msgId, s.matchNotFound, { reply_markup: { inline_keyboard: [[{ text: s.back, callback_data: "menu_all" }]] } });
        const { text, keyboard } = formatMatchDetail(match, lang);
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }

      if (data.startsWith("pred_")) {
        const matchId = data.replace("pred_", "");
        const matches = await fetchMatches();
        const match = matches.find((m: any) => generateId(m) === matchId);
        if (!match) return editMessage(chatId, msgId, s.matchNotFound, { reply_markup: { inline_keyboard: [[{ text: s.back, callback_data: "menu_all" }]] } });

        await editMessage(chatId, msgId, `🔮 <b>${s.analyzing}</b>\n\n${match.home_name} vs ${match.away_name}\n\n⏳ ${s.pleaseWait}`, { reply_markup: { inline_keyboard: [] } });

        try {
          const pred = await getPrediction(match.home_name, match.away_name, match.label, match.score, match.time);
          const predText = formatPrediction(pred, match.home_name, match.away_name, lang);
          const id = generateId(match);
          return editMessage(chatId, msgId, predText, {
            reply_markup: { inline_keyboard: [
              [{ text: s.refreshPrediction, callback_data: `pred_${id}` }],
              [{ text: s.matchDetails, callback_data: `match_${id}` }],
              [{ text: s.backToMenu, callback_data: "menu_main" }],
            ]},
          });
        } catch (e) {
          console.error("Prediction error:", e);
          return editMessage(chatId, msgId, s.predictionFailed, {
            reply_markup: { inline_keyboard: [
              [{ text: s.tryAgain, callback_data: `pred_${matchId}` }],
              [{ text: s.backToMenu, callback_data: "menu_main" }],
            ]},
          });
        }
      }
    }
  } catch (error) {
    console.error("Handle update error:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get("setup") === "true") {
    const webhookUrl = url.searchParams.get("webhook_url");
    if (!webhookUrl) return new Response(JSON.stringify({ error: "webhook_url required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const result = await tgApi("setWebhook", { url: webhookUrl });
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const update = await req.json();
    await handleUpdate(update);
    return new Response("ok", { headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("ok", { headers: corsHeaders });
  }
});
