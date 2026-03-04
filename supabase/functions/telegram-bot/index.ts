import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_TOKEN = () => Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = () => Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = () => Deno.env.get("SUPABASE_ANON_KEY")!;
const GROQ_API_KEY = () => Deno.env.get("GROQ_API_KEY")!;

const tg = async (method: string, body: Record<string, unknown>) => {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
};

const sendMessage = (chatId: number, text: string, extra?: Record<string, unknown>) =>
  tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });

const editMessage = (chatId: number, msgId: number, text: string, extra?: Record<string, unknown>) =>
  tg("editMessageText", { chat_id: chatId, message_id: msgId, text, parse_mode: "HTML", ...extra });

const answerCallback = (id: string, text?: string) =>
  tg("answerCallbackQuery", { callback_query_id: id, text });

// Fetch matches from our proxy
async function fetchMatches() {
  const res = await fetch(`${SUPABASE_URL()}/functions/v1/matches-proxy`, {
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY()}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

// Get match status
function getMatchStatus(score: string, time: string): "live" | "upcoming" | "finished" {
  const t = time.toLowerCase().trim();
  if (t.includes("live") || t.includes("'") || t.includes("ht") || t.includes("half")) return "live";
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
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return `m${Math.abs(hash).toString(36)}`;
}

// AI Prediction
async function getPrediction(home: string, away: string, comp: string, score: string, time: string) {
  const prompt = `You are an elite professional football betting analyst.

Analyze this football match and provide 5 high-quality betting tips:

Match: ${home} vs ${away}
Competition: ${comp}
Current Score: ${score}
Time: ${time}

CRITICAL CONSISTENCY RULES:
1. predicted_score format: "HomeGoals-AwayGoals" (home team score FIRST)
2. If home goals > away goals → winner MUST be "home"
3. If home goals < away goals → winner MUST be "away"
4. If home goals = away goals → winner MUST be "draw"
5. Tips must logically align with your predicted winner and score

Required betting market formats for tips:
- "Handicap ${home} -1.5" or "Handicap ${away} +0.5"
- "Over 2.5 Goals" or "Under 1.5 Goals"
- "Both Teams To Score - Yes" or "Both Teams To Score - No"
- "1X2: ${home} Win" or "1X2: Draw" or "1X2: ${away} Win"
- "Correct Score ${home} 2-1 ${away}"

Respond with ONLY this JSON:
{"winner":"home or away or draw","confidence":number 0-100,"predicted_score":"X-Y","tips":[{"tip":"exact betting market name","confidence":"high or medium or low","description":"clear reasoning in under 25 words"}],"analysis":"detailed match analysis under 60 words"}

Provide exactly 5 tips.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an elite football betting analyst. Respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No prediction content");
  const pred = JSON.parse(content);

  // Server-side consistency fix
  if (pred.predicted_score) {
    const parts = pred.predicted_score.split("-").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [h, a] = parts;
      pred.winner = h > a ? "home" : h < a ? "away" : "draw";
    }
  }
  return pred;
}

// Status emoji
const statusEmoji = (s: string) => s === "live" ? "🔴" : s === "upcoming" ? "🕐" : "✅";
const confEmoji = (c: string) => c === "high" ? "🟢" : c === "medium" ? "🟡" : "🔴";

// Build main menu
function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🔴 Live Matches", callback_data: "menu_live" }, { text: "🕐 Upcoming", callback_data: "menu_upcoming" }],
      [{ text: "⚽ All Matches", callback_data: "menu_all" }],
      [{ text: "📊 Quick Predictions", callback_data: "menu_predictions" }],
      [{ text: "🔄 Refresh", callback_data: "menu_refresh" }],
    ],
  };
}

// Format matches list
function formatMatchList(matches: any[], status: string | null, page = 0) {
  const PAGE_SIZE = 8;
  let filtered = matches;
  if (status) {
    filtered = matches.filter((m: any) => getMatchStatus(m.score, m.time) === status);
  }

  if (filtered.length === 0) {
    return {
      text: status ? `No ${status} matches right now.` : "No matches available.",
      keyboard: { inline_keyboard: [[{ text: "🔙 Back to Menu", callback_data: "menu_main" }]] },
    };
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageMatches = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const title = status === "live" ? "🔴 <b>LIVE MATCHES</b>" : status === "upcoming" ? "🕐 <b>UPCOMING MATCHES</b>" : "⚽ <b>ALL MATCHES</b>";

  let text = `${title}\n${"─".repeat(20)}\n\n`;
  pageMatches.forEach((m: any, i: number) => {
    const s = getMatchStatus(m.score, m.time);
    const scoreDisplay = m.score === "vs" ? "VS" : m.score;
    text += `${statusEmoji(s)} <b>${m.home_name}</b> ${scoreDisplay} <b>${m.away_name}</b>\n`;
    text += `   📺 ${m.label} | ⏱ ${m.time}\n\n`;
  });

  text += `📄 Page ${page + 1}/${totalPages} | Total: ${filtered.length}`;

  const buttons: any[][] = [];
  // Match detail buttons (2 per row)
  const row: any[] = [];
  pageMatches.forEach((m: any, i: number) => {
    const id = generateId(m);
    const shortName = `${m.home_name.slice(0, 8)} v ${m.away_name.slice(0, 8)}`;
    row.push({ text: `📋 ${shortName}`, callback_data: `match_${id}` });
    if (row.length === 2) {
      buttons.push([...row]);
      row.length = 0;
    }
  });
  if (row.length) buttons.push([...row]);

  // Pagination
  const navRow: any[] = [];
  if (page > 0) navRow.push({ text: "⬅️ Prev", callback_data: `page_${status || "all"}_${page - 1}` });
  if (page < totalPages - 1) navRow.push({ text: "➡️ Next", callback_data: `page_${status || "all"}_${page + 1}` });
  if (navRow.length) buttons.push(navRow);

  buttons.push([{ text: "🔙 Back to Menu", callback_data: "menu_main" }]);

  return { text, keyboard: { inline_keyboard: buttons } };
}

// Format match detail
function formatMatchDetail(match: any) {
  const status = getMatchStatus(match.score, match.time);
  const scoreDisplay = match.score === "vs" ? "VS" : match.score;

  let text = `${statusEmoji(status)} <b>MATCH DETAILS</b>\n${"─".repeat(24)}\n\n`;
  text += `🏟 <b>${match.label}</b>\n\n`;
  text += `🏠 <b>${match.home_name}</b>\n`;
  text += `      ⚽ ${scoreDisplay}\n`;
  text += `✈️ <b>${match.away_name}</b>\n\n`;
  text += `⏱ Time: ${match.time}\n`;
  text += `📊 Status: ${status.toUpperCase()}\n`;

  const hasStreams = match.authors && match.authors.length > 0;
  if (hasStreams) {
    text += `\n📺 <b>Streams Available: ${match.authors.length}</b>\n`;
  }

  const id = generateId(match);
  const buttons: any[][] = [];

  // Prediction button
  buttons.push([{ text: "🔮 Get AI Prediction & Tips", callback_data: `pred_${id}` }]);

  // Stream buttons
  if (hasStreams) {
    match.authors.slice(0, 6).forEach((a: any, i: number) => {
      buttons.push([{ text: `📺 ${a.name || `Stream ${i + 1}`}`, url: a.url }]);
    });
  }

  // View on website
  if (match.view_url) {
    buttons.push([{ text: "🌐 View on Website", url: match.view_url }]);
  }

  buttons.push([{ text: "🔙 Back to Matches", callback_data: "menu_all" }]);

  return { text, keyboard: { inline_keyboard: buttons } };
}

// Format prediction
function formatPrediction(pred: any, home: string, away: string) {
  const winnerLabel = pred.winner === "home" ? home : pred.winner === "away" ? away : "Draw";
  const winnerEmoji = pred.winner === "home" ? "🏠" : pred.winner === "away" ? "✈️" : "🤝";

  let text = `🔮 <b>AI PREDICTION</b>\n${"─".repeat(24)}\n\n`;
  text += `${winnerEmoji} <b>Winner: ${winnerLabel}</b>\n`;
  text += `⚽ Predicted Score: <b>${pred.predicted_score}</b>\n`;
  text += `📊 Confidence: <b>${pred.confidence}%</b>\n\n`;

  text += `📝 <b>Analysis:</b>\n${pred.analysis}\n\n`;

  text += `🎯 <b>BETTING TIPS</b>\n${"─".repeat(20)}\n\n`;

  if (pred.tips && Array.isArray(pred.tips)) {
    pred.tips.forEach((tip: any, i: number) => {
      text += `${confEmoji(tip.confidence)} <b>Tip ${i + 1}:</b> ${tip.tip}\n`;
      text += `   📌 ${tip.description}\n`;
      text += `   🎯 Confidence: ${tip.confidence.toUpperCase()}\n\n`;
    });
  }

  text += `\n⚠️ <i>Tips are AI-generated for informational purposes only. Bet responsibly.</i>`;

  return text;
}

// Handle updates
async function handleUpdate(update: any) {
  try {
    // Handle /start and text commands
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      if (text === "/start") {
        const welcome = `⚽ <b>Football Live Streaming Bot</b>\n${"─".repeat(28)}\n\n`
          + `Welcome! I'm your football companion:\n\n`
          + `🔴 Watch <b>Live Matches</b>\n`
          + `🕐 Check <b>Upcoming Games</b>\n`
          + `🔮 Get <b>AI Predictions & Tips</b>\n`
          + `📺 Access <b>Live Streams</b>\n\n`
          + `Use the buttons below to get started! 👇`;
        return sendMessage(chatId, welcome, { reply_markup: mainMenuKeyboard() });
      }

      if (text === "/live") {
        const matches = await fetchMatches();
        const { text: msg, keyboard } = formatMatchList(matches, "live");
        return sendMessage(chatId, msg, { reply_markup: keyboard });
      }

      if (text === "/upcoming") {
        const matches = await fetchMatches();
        const { text: msg, keyboard } = formatMatchList(matches, "upcoming");
        return sendMessage(chatId, msg, { reply_markup: keyboard });
      }

      if (text === "/matches") {
        const matches = await fetchMatches();
        const { text: msg, keyboard } = formatMatchList(matches, null);
        return sendMessage(chatId, msg, { reply_markup: keyboard });
      }

      if (text === "/help") {
        const help = `📖 <b>Commands</b>\n\n`
          + `/start - Main menu\n`
          + `/live - Live matches\n`
          + `/upcoming - Upcoming matches\n`
          + `/matches - All matches\n`
          + `/help - This help message\n\n`
          + `💡 <b>Tip:</b> Use inline buttons for the best experience!`;
        return sendMessage(chatId, help, { reply_markup: mainMenuKeyboard() });
      }

      // Search by team name
      const matches = await fetchMatches();
      const query = text.toLowerCase();
      const found = matches.filter((m: any) =>
        m.home_name.toLowerCase().includes(query) || m.away_name.toLowerCase().includes(query)
      );
      if (found.length > 0) {
        const { text: msg, keyboard } = formatMatchList(found, null);
        return sendMessage(chatId, `🔍 <b>Search results for "${text}":</b>\n\n` + msg, { reply_markup: keyboard });
      } else {
        return sendMessage(chatId, `🔍 No matches found for "${text}". Try a team name!`, { reply_markup: mainMenuKeyboard() });
      }
    }

    // Handle callback queries (inline buttons)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const msgId = cb.message.message_id;
      const data = cb.data;

      await answerCallback(cb.id);

      if (data === "menu_main" || data === "menu_refresh") {
        const welcome = `⚽ <b>Football Live Streaming</b>\n${"─".repeat(28)}\n\nChoose an option below 👇`;
        return editMessage(chatId, msgId, welcome, { reply_markup: mainMenuKeyboard() });
      }

      if (data === "menu_live") {
        const matches = await fetchMatches();
        const { text, keyboard } = formatMatchList(matches, "live");
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }

      if (data === "menu_upcoming") {
        const matches = await fetchMatches();
        const { text, keyboard } = formatMatchList(matches, "upcoming");
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }

      if (data === "menu_all") {
        const matches = await fetchMatches();
        const { text, keyboard } = formatMatchList(matches, null);
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }

      if (data === "menu_predictions") {
        const matches = await fetchMatches();
        const live = matches.filter((m: any) => getMatchStatus(m.score, m.time) === "live");
        const target = live.length > 0 ? live : matches.slice(0, 10);

        if (target.length === 0) {
          return editMessage(chatId, msgId, "No matches available for predictions.", {
            reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "menu_main" }]] },
          });
        }

        let text = `🔮 <b>QUICK PREDICTIONS</b>\n${"─".repeat(24)}\n\nSelect a match to get AI prediction:\n\n`;
        const buttons: any[][] = [];
        target.slice(0, 10).forEach((m: any) => {
          const s = getMatchStatus(m.score, m.time);
          const id = generateId(m);
          text += `${statusEmoji(s)} ${m.home_name} vs ${m.away_name}\n`;
          buttons.push([{ text: `🔮 ${m.home_name} v ${m.away_name}`, callback_data: `pred_${id}` }]);
        });

        buttons.push([{ text: "🔙 Back to Menu", callback_data: "menu_main" }]);
        return editMessage(chatId, msgId, text, { reply_markup: { inline_keyboard: buttons } });
      }

      // Pagination
      if (data.startsWith("page_")) {
        const parts = data.split("_");
        const status = parts[1] === "all" ? null : parts[1];
        const page = parseInt(parts[2]);
        const matches = await fetchMatches();
        const { text, keyboard } = formatMatchList(matches, status, page);
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }

      // Match detail
      if (data.startsWith("match_")) {
        const matchId = data.replace("match_", "");
        const matches = await fetchMatches();
        const match = matches.find((m: any) => generateId(m) === matchId);
        if (!match) {
          return editMessage(chatId, msgId, "❌ Match not found.", {
            reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "menu_all" }]] },
          });
        }
        const { text, keyboard } = formatMatchDetail(match);
        return editMessage(chatId, msgId, text, { reply_markup: keyboard });
      }

      // Prediction
      if (data.startsWith("pred_")) {
        const matchId = data.replace("pred_", "");
        const matches = await fetchMatches();
        const match = matches.find((m: any) => generateId(m) === matchId);
        if (!match) {
          return editMessage(chatId, msgId, "❌ Match not found.", {
            reply_markup: { inline_keyboard: [[{ text: "🔙 Back", callback_data: "menu_all" }]] },
          });
        }

        // Send loading message
        await editMessage(chatId, msgId, `🔮 <b>Analyzing...</b>\n\n${match.home_name} vs ${match.away_name}\n\n⏳ Getting AI prediction, please wait...`, {
          reply_markup: { inline_keyboard: [] },
        });

        try {
          const pred = await getPrediction(
            match.home_name, match.away_name,
            match.label, match.score, match.time
          );
          const predText = formatPrediction(pred, match.home_name, match.away_name);
          const id = generateId(match);
          return editMessage(chatId, msgId, predText, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔄 Refresh Prediction", callback_data: `pred_${id}` }],
                [{ text: "📋 Match Details", callback_data: `match_${id}` }],
                [{ text: "🔙 Back to Menu", callback_data: "menu_main" }],
              ],
            },
          });
        } catch (e) {
          console.error("Prediction error:", e);
          const id = generateId(match);
          return editMessage(chatId, msgId, "❌ Failed to generate prediction. Please try again.", {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔄 Try Again", callback_data: `pred_${id}` }],
                [{ text: "🔙 Back to Menu", callback_data: "menu_main" }],
              ],
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Handle update error:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Webhook setup endpoint
  if (url.searchParams.get("setup") === "true") {
    const webhookUrl = url.searchParams.get("webhook_url");
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "webhook_url param required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await tg("setWebhook", { url: webhookUrl });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Handle Telegram webhook
  try {
    const update = await req.json();
    await handleUpdate(update);
    return new Response("ok", { headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("ok", { headers: corsHeaders });
  }
});
