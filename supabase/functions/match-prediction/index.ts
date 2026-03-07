import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for pre-match
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for live matches

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getCachedPrediction(cacheKey: string): Promise<unknown | null> {
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("prediction_cache")
      .select("prediction")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    return data?.prediction ?? null;
  } catch (e) {
    console.warn("Cache read error:", e.message);
    return null;
  }
}

async function setCachedPrediction(cacheKey: string, prediction: unknown, isLive: boolean): Promise<void> {
  try {
    const sb = getSupabase();
    const ttl = isLive ? LIVE_CACHE_TTL_MS : CACHE_TTL_MS;
    const expiresAt = new Date(Date.now() + ttl).toISOString();
    await sb.from("prediction_cache").upsert(
      { cache_key: cacheKey, prediction, expires_at: expiresAt },
      { onConflict: "cache_key" }
    );
  } catch (e) {
    console.warn("Cache write error:", e.message);
  }
}

function isLiveMatch(matchScore: string, matchTime: string): boolean {
  const timeLower = matchTime.toLowerCase();
  const hasScore = /\d+\s*-\s*\d+/.test(matchScore) && matchScore.trim() !== 'vs';
  return timeLower.includes('live') || timeLower.includes("'") || timeLower.includes('ht') || hasScore;
}

function buildPrompt(homeName: string, awayName: string, comp: string, matchScore: string, matchTime: string): string {
  const live = isLiveMatch(matchScore, matchTime);
  const scoreParts = matchScore.match(/(\d+)\s*-\s*(\d+)/);
  
  let liveContext = '';
  if (live && scoreParts) {
    const [, homeGoals, awayGoals] = scoreParts;
    const hg = parseInt(homeGoals), ag = parseInt(awayGoals);
    const totalGoals = hg + ag;
    const timeMatch = matchTime.match(/(\d+)/);
    const minute = timeMatch ? parseInt(timeMatch[0]) : 45;
    
    liveContext = `
LIVE MATCH CONTEXT:
- Current score: ${homeName} ${homeGoals} - ${awayGoals} ${awayName}
- Approximate minute: ${minute}'
- Total goals so far: ${totalGoals}
- ${hg > ag ? homeName + ' is WINNING' : ag > hg ? awayName + ' is WINNING' : 'Match is DRAWN'}
- Consider: remaining time, current momentum, goal rate (${(totalGoals / Math.max(minute, 1) * 90).toFixed(1)} projected goals/90min)
- For live predictions: adjust Over/Under lines based on current score
- If score is 0-0 late in game, Under tips become stronger
- If score is high early, Over tips become stronger`;
  }

  return `You are the world's top football/sports betting analyst with 20+ years of experience. Your predictions are data-driven, realistic, and varied.

Match: ${homeName} vs ${awayName}
Competition: ${comp}
Current Score: ${matchScore}
Match Time: ${matchTime}
${liveContext}

CRITICAL ANALYSIS RULES:
1. DO NOT default to "2-1 home win" — analyze each match individually
2. predicted_score format: "HomeGoals-AwayGoals" (home team's goals first)
3. winner MUST logically match predicted_score (more home goals = "home", more away goals = "away", equal = "draw")
4. Confidence should REALISTICALLY vary: 35-55 for uncertain, 55-70 for moderate, 70-85 for strong, 85+ only for extreme favorites
5. Consider: league quality, home/away form, competition context, historical patterns
6. Draws are common in football (~25% of matches) — don't always pick a winner
7. Low-scoring results (0-0, 1-0, 0-1) are very common — don't always predict high-scoring games
${live ? '8. This is a LIVE match — factor in current score, remaining time, and match flow' : '8. This is a PRE-MATCH prediction — base on team strength and form'}

BETTING TIPS RULES:
- Provide EXACTLY 5 tips using DIFFERENT bet types
- Use realistic betting markets: Over/Under (0.5, 1.5, 2.5, 3.5), Asian Handicap (-0.5, -1, -1.5), BTTS Yes/No, 1X2, Correct Score, Double Chance, Draw No Bet, HT/FT, First/Last Goal
- Each tip's confidence must be independently assessed (high/medium/low)
- Include at least one Correct Score tip
- Descriptions must explain WHY with specific reasoning (not generic)

Respond with ONLY valid JSON, no markdown:
{"winner":"home","confidence":62,"predicted_score":"1-0","tips":[{"tip":"Under 2.5 Goals","confidence":"high","description":"Both teams average under 1.2 goals per game this season"},{"tip":"1X2: Home Win","confidence":"medium","description":"Home side unbeaten in last 8 home games"},{"tip":"BTTS: No","confidence":"high","description":"Away team failed to score in 4 of last 6 away matches"},{"tip":"Correct Score 1-0","confidence":"low","description":"Tight defensive battle expected based on recent form"},{"tip":"Draw No Bet: Home","confidence":"high","description":"Insurance pick given home dominance in this fixture"}],"analysis":"${homeName} should control possession at home but ${awayName}'s defensive resilience makes this a low-scoring affair. Home advantage tips the balance slightly."}

IMPORTANT: Make the analysis specific to these teams and competition. Avoid generic phrases like "strong offense" or "home advantage". Be specific and insightful.`;
}


// Provider 1: Groq (free, generous limits)
async function tryGroq(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a football betting analyst. You MUST respond with ONLY a single valid JSON object. No text before or after. No markdown code blocks." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq error:", res.status, err);
    throw new Error(`Groq error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Provider 2: Lovable AI Gateway
async function tryLovableAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "You are a football betting analyst. Always respond with valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Lovable AI error:", res.status, err);
    throw new Error(`Lovable AI error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Provider 3: Gemini direct
async function tryGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini error:", res.status, err);
    throw new Error(`Gemini error: ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Try providers in order, return first success
async function getAIResponse(prompt: string): Promise<string> {
  const providers = [
    { name: "Groq", fn: () => tryGroq(prompt) },
    { name: "Lovable AI", fn: () => tryLovableAI(prompt) },
    { name: "Gemini", fn: () => tryGemini(prompt) },
  ];

  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name}...`);
      const result = await provider.fn();
      if (result) {
        console.log(`${provider.name} succeeded`);
        return result;
      }
    } catch (e) {
      console.warn(`${provider.name} failed:`, e.message);
    }
  }

  throw new Error("All AI providers failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { home_name, away_name, competition, score, time } = await req.json();

    if (!home_name || !away_name) {
      return new Response(JSON.stringify({ error: "Missing team names" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const homeName = home_name.trim();
    const awayName = away_name.trim();
    const comp = (competition || "Unknown").trim();
    const matchScore = (score || "Not started").trim();
    const matchTime = (time || "Unknown").trim();

    // Determine if live for cache strategy
    const live = isLiveMatch(matchScore, matchTime);
    
    // Cache key includes score for live matches (so new score = new prediction)
    const cacheKey = live 
      ? `live-${homeName}-${awayName}-${matchScore}` 
      : `pre-${homeName}-${awayName}`;
    
    const cached = await getCachedPrediction(cacheKey);
    if (cached) {
      console.log("Cache hit:", cacheKey);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Cache miss:", cacheKey, live ? "(LIVE)" : "(PRE-MATCH)");
    const prompt = buildPrompt(homeName, awayName, comp, matchScore, matchTime);
    const content = await getAIResponse(prompt);

    // Robust JSON extraction
    let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in response");
    cleaned = jsonMatch[0];
    
    const prediction = JSON.parse(cleaned);

    // Consistency fix: winner must match predicted_score
    if (prediction.predicted_score) {
      const parts = prediction.predicted_score.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const [h, a] = parts;
        if (h > a) prediction.winner = "home";
        else if (h < a) prediction.winner = "away";
        else prediction.winner = "draw";
      }
    }

    // Clamp confidence to realistic range
    if (prediction.confidence) {
      prediction.confidence = Math.max(30, Math.min(95, prediction.confidence));
    }

    // Ensure exactly 5 tips
    if (prediction.tips && prediction.tips.length > 5) {
      prediction.tips = prediction.tips.slice(0, 5);
    }

    // Save to DB cache with appropriate TTL
    setCachedPrediction(cacheKey, prediction, live);

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(
      JSON.stringify({ error: "Unable to generate prediction. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
