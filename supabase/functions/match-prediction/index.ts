import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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

async function setCachedPrediction(cacheKey: string, prediction: unknown): Promise<void> {
  try {
    const sb = getSupabase();
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
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

function buildPrompt(homeName: string, awayName: string, comp: string, matchScore: string, matchTime: string, language: string = 'en'): string {
  const live = isLiveMatch(matchScore, matchTime);
  const scoreParts = matchScore.match(/(\d+)\s*-\s*(\d+)/);
  
  let liveContext = '';
  if (live && scoreParts) {
    const [, homeGoals, awayGoals] = scoreParts;
    const hg = parseInt(homeGoals), ag = parseInt(awayGoals);
    const totalGoals = hg + ag;
    const timeMatch = matchTime.match(/(\d+)/);
    const minute = timeMatch ? parseInt(timeMatch[0]) : 45;
    const remainingMin = Math.max(90 - minute, 0);
    const goalRate = totalGoals / Math.max(minute, 1);
    const projectedTotal = (goalRate * 90).toFixed(1);
    
    liveContext = `
═══ LIVE MATCH DATA ═══
Current Score: ${homeName} ${homeGoals} - ${awayGoals} ${awayName}
Minute: ${minute}' | Remaining: ~${remainingMin} min
Goals So Far: ${totalGoals} | Rate: ${goalRate.toFixed(3)}/min → projected ${projectedTotal}/90min
State: ${hg > ag ? homeName + ' LEADING' : ag > hg ? awayName + ' LEADING' : 'LEVEL'}
${minute > 75 ? '⚠️ LATE GAME: Results tend to hold' : ''}
${minute < 30 && totalGoals >= 2 ? '⚠️ EARLY HIGH-SCORING: Pace may slow' : ''}
${minute > 60 && totalGoals === 0 ? '⚠️ LATE 0-0: Under trend strong' : ''}

CRITICAL LIVE RULES:
- The score is REAL and HAPPENING NOW. Predict the FINAL result from here.
- A team leading 2-0 after 70' wins ~95% of the time. Don't predict comebacks unless there's extreme evidence.
- Adjust Over/Under based on CURRENT goals + remaining time, not just general team stats.`;
  }

  const langInstruction = language === 'my' 
    ? `\n═══ BURMESE LANGUAGE ═══\nWrite "analysis" and tip "description" fields in Burmese. Keep "tip" names and "winner" in English.`
    : '';

  return `You are an elite football analyst AI with access to current 2024-2025 season data. Your job is to provide ACCURATE, DATA-DRIVEN predictions.

═══ MATCH INFO ═══
Home: ${homeName}
Away: ${awayName}
Competition: ${comp}
Score: ${matchScore}
Time: ${matchTime}
${liveContext}

═══ MANDATORY ANALYSIS STEPS ═══

You MUST think through each step BEFORE giving your prediction:

STEP 1 — IDENTIFY THE TEAMS CORRECTLY
- Make sure you know EXACTLY which teams these are. Do not confuse similarly named clubs.
- ${homeName} plays at HOME. ${awayName} plays AWAY. This matters for prediction.

STEP 2 — CURRENT FORM (2024-2025 season)
- What is each team's recent form? (Last 5-10 matches)
- Home record of ${homeName} vs Away record of ${awayName}
- Goals scored and conceded patterns
- Are they on a winning/losing streak?

STEP 3 — SQUAD STRENGTH & INJURIES
- Key players missing? Star striker injured? New signings performing?
- Manager changes or tactical shifts recently?

STEP 4 — HEAD-TO-HEAD
- Historical record between these specific teams
- Do NOT invent H2H data. If unsure, say "limited H2H data" and rely on form.

STEP 5 — COMPETITION CONTEXT
- League position, motivation (title race? relegation? cup final?)
- Is this a dead rubber or a must-win?

STEP 6 — REALISTIC SCORELINE
Common scorelines in football (use these as baseline):
- 1-0 occurs ~17% | 0-0 ~8% | 2-1 ~12% | 1-1 ~12% | 2-0 ~10%
- 3-0 ~5% | 3-1 ~5% | 0-1 ~10% | 0-2 ~5%
- Scores like 4-3, 5-2 are VERY RARE (<1%). Only predict these with extreme evidence.
- Average goals per match in top leagues: ~2.5-2.8

═══ ACCURACY RULES ═══

🔴 CRITICAL — DO NOT:
- Default to 2-1 for every match
- Give every match the same analysis template
- Predict high-scoring games (3+ goals) without strong evidence
- Ignore home advantage (home teams win ~46% in top leagues)
- Predict draws too rarely (draws happen ~26% of matches)
- Make up statistics or injury reports you're not sure about
- Give generic analysis that could apply to any match

🟢 YOU MUST:
- Make each prediction UNIQUE to this specific match
- Consider 0-0 and 1-0 as very real possibilities
- Factor in defensive teams, low-scoring leagues, tactical setups
- If teams are evenly matched, seriously consider a draw
- If you're not confident about a specific scoreline, pick the most statistically likely one
- Differentiate between top leagues (EPL, La Liga) and lower leagues

═══ CONFIDENCE CALIBRATION ═══
- 80-84: Slight edge detected, could go either way
- 85-89: Clear form/quality advantage for one side
- 90-94: Dominant team vs weak opponent with strong evidence
- 95-100: ONLY for extreme mismatches (e.g., top team vs amateur)
- Most predictions should be 80-88. Only give 90+ when truly justified.

═══ BETTING TIPS (3-5 tips, all HIGH confidence) ═══
Each tip must be from a DIFFERENT market:
- Match Result (1X2) / Double Chance / Draw No Bet
- Over/Under 0.5/1.5/2.5/3.5 Goals
- BTTS Yes/No
- Asian Handicap
- Correct Score (only if very confident)
- First Half Result/Goals
- Clean Sheet / Win to Nil

For each tip: explain WHY with specific reasoning, not generic statements.
BAD: "Based on current form, this is likely" 
GOOD: "${homeName} scored in 9 of last 10 home games, averaging 2.1 goals/game at home"

═══ ANALYSIS ═══
Write 4-6 detailed sentences covering: team form comparison, key absences, tactical matchup, and the decisive factor. Be SPECIFIC — mention actual trends, not vague generalizations.
${langInstruction}

═══ RESPOND WITH ONLY THIS JSON ═══
{
  "winner": "home|away|draw",
  "confidence": 83,
  "predicted_score": "1-0",
  "tips": [
    {"tip": "Market Name", "confidence": "high", "description": "Specific reasoning with data..."}
  ],
  "analysis": "Detailed match-specific analysis..."
}`;
}

// Provider 1: Lovable AI Gateway — use gemini-2.5-pro for best accuracy
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
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: "You are an elite football prediction analyst. You use REAL current season data, actual team form, real injury reports, and historical stats. You never fabricate data. If unsure about specific facts, you base predictions on general football knowledge and probability. You respond with ONLY valid JSON, no markdown, no explanation outside JSON." },
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

// Provider 2: Groq (fallback)
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
        { role: "system", content: "You are an elite football prediction analyst. Respond with ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 4000,
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

// Provider 3: Gemini direct (last resort)
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
          maxOutputTokens: 4000,
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

async function getAIResponse(prompt: string): Promise<string> {
  const providers = [
    { name: "Lovable AI (Pro)", fn: () => tryLovableAI(prompt) },
    { name: "Groq", fn: () => tryGroq(prompt) },
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

function validateAndFixPrediction(prediction: any): any {
  // Fix winner-score consistency
  if (prediction.predicted_score) {
    const scoreStr = String(prediction.predicted_score).trim();
    const parts = scoreStr.split("-").map((s: string) => parseInt(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [h, a] = parts;
      if (h > a) prediction.winner = "home";
      else if (h < a) prediction.winner = "away";
      else prediction.winner = "draw";
      prediction.predicted_score = `${h}-${a}`;
    }
  }

  // Confidence: allow realistic range 80-100, don't inflate
  if (prediction.confidence) {
    prediction.confidence = Math.max(80, Math.min(100, Math.round(prediction.confidence)));
  } else {
    prediction.confidence = 82;
  }

  if (!["home", "away", "draw"].includes(prediction.winner)) {
    prediction.winner = "home";
  }

  if (!Array.isArray(prediction.tips)) {
    prediction.tips = [];
  }

  prediction.tips = prediction.tips
    .filter((tip: any) => tip.tip && tip.description)
    .slice(0, 5)
    .map((tip: any) => ({
      tip: tip.tip,
      confidence: "high" as const,
      description: tip.description,
    }));

  if (!prediction.analysis || typeof prediction.analysis !== 'string' || prediction.analysis.length < 30) {
    prediction.analysis = "Detailed analysis could not be generated. Prediction is based on available statistical data and team form.";
  }

  return prediction;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { home_name, away_name, competition, score, time, language } = await req.json();

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
    const lang = (language || "en").trim();

    const live = isLiveMatch(matchScore, matchTime);
    
    // v4 cache key to invalidate old bad predictions
    const cacheKey = live 
      ? `v4-live-${lang}-${homeName}-${awayName}-${matchScore}` 
      : `v4-pre-${lang}-${homeName}-${awayName}`;
    
    const cached = await getCachedPrediction(cacheKey);
    if (cached) {
      console.log("Cache hit:", cacheKey);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Cache miss:", cacheKey, live ? "(LIVE)" : "(PRE-MATCH)", `lang=${lang}`);
    const prompt = buildPrompt(homeName, awayName, comp, matchScore, matchTime, lang);
    const content = await getAIResponse(prompt);

    // Robust JSON extraction
    let prediction: any = null;
    const rawContent = content.trim();
    
    try {
      prediction = JSON.parse(rawContent);
    } catch {
      let cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          prediction = JSON.parse(jsonMatch[0]);
        } catch {
          let fixed = jsonMatch[0]
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]")
            .replace(/[\x00-\x1F\x7F]/g, " ");
          try {
            prediction = JSON.parse(fixed);
          } catch (e) {
            console.error("JSON parse failed. Raw:", rawContent.substring(0, 500));
            throw new Error("Failed to parse AI response");
          }
        }
      } else {
        console.error("No JSON found. Raw:", rawContent.substring(0, 500));
        throw new Error("No JSON in response");
      }
    }

    prediction = validateAndFixPrediction(prediction);
    setCachedPrediction(cacheKey, prediction);

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
