import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LIVE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min for live (more real-time)

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
═══ LIVE MATCH REAL-TIME DATA ═══
Current Score: ${homeName} ${homeGoals} - ${awayGoals} ${awayName}
Match Minute: ${minute}'
Remaining Minutes: ~${remainingMin}
Total Goals So Far: ${totalGoals}
Goal Rate: ${goalRate.toFixed(3)} goals/min (projected ${projectedTotal} goals/90min)
Match State: ${hg > ag ? homeName + ' LEADING' : ag > hg ? awayName + ' LEADING' : 'LEVEL'}
${minute > 75 ? '⚠️ LATE GAME: Results tend to hold, goals become less likely' : ''}
${minute < 30 && totalGoals >= 2 ? '⚠️ EARLY HIGH-SCORING: Pace may slow as teams adjust tactics' : ''}
${minute > 60 && totalGoals === 0 ? '⚠️ LATE 0-0: Strong Under trend, possible late winner or 0-0 draw' : ''}
${hg >= 3 || ag >= 3 ? '⚠️ ONE-SIDED: Leading team may ease off, trailing team may open up' : ''}

LIVE ANALYSIS REQUIREMENTS:
- Factor in remaining time heavily for Over/Under calculations
- Current score momentum matters more than pre-match form
- Late equalizers happen in ~12% of trailing situations after 75'
- Teams losing by 2+ goals after 70' rarely come back (<5%)
- Consider tactical changes (substitutions, formation shifts typical at 60-70')`;
  }

  const langInstruction = language === 'my' 
    ? `

═══ BURMESE LANGUAGE REQUIREMENT ═══
You MUST write "analysis" and all tip "description" fields in Burmese (Myanmar) language.
Keep "tip" names in English (e.g., "Over 2.5 Goals", "BTTS: Yes").
Keep "winner" as "home"/"away"/"draw" in English.
The Burmese text must be natural, detailed, and use football terminology correctly.
DO NOT use Google Translate-style robotic Burmese. Write like a native Myanmar football analyst.`
    : '';

  return `You are an elite professional football analyst and betting strategist. You combine deep tactical knowledge, statistical analysis, historical data, and situational awareness to produce world-class match predictions.

═══ MATCH INFORMATION ═══
Home Team: ${homeName}
Away Team: ${awayName}  
Competition: ${comp}
Score: ${matchScore}
Time: ${matchTime}
${liveContext}

═══ MANDATORY ANALYSIS FRAMEWORK ═══

You MUST analyze ALL of the following factors before making your prediction:

1. TEAM STRENGTH & FORM ANALYSIS
   - Overall squad quality and depth comparison
   - Recent form (last 5-10 matches pattern)
   - Home/Away specific performance records
   - Key player availability and impact
   - Goal-scoring and defensive records

2. TACTICAL & STRATEGIC ANALYSIS  
   - Playing style matchup (possession vs counter-attack, high press vs low block)
   - Formation compatibility and tactical mismatches
   - Set-piece threat assessment
   - Manager tactical tendencies in big/small matches

3. COMPETITION & CONTEXT FACTORS
   - League/tournament stage importance
   - Rivalry and derby match intensity
   - Fixture congestion and rotation likelihood
   - Motivation levels (title race, relegation battle, dead rubber)
   - European/international duty fatigue

4. HISTORICAL & STATISTICAL PATTERNS
   - Head-to-head record in recent seasons
   - Scoring patterns (first half vs second half goals)
   - Clean sheet percentages
   - Average goals per game in this competition
   - Referee tendencies (if relevant)

5. ENVIRONMENTAL & SITUATIONAL FACTORS
   - Home advantage strength in this venue
   - Weather and pitch conditions impact
   - Travel distance for away team
   - Fan atmosphere and pressure

═══ PREDICTION QUALITY RULES ═══

CRITICAL - HIGH CONFIDENCE ONLY:
1. predicted_score MUST be in "X-Y" format (home goals first)
2. winner MUST match predicted_score logically
3. Overall confidence MUST be 60 or higher — only predict when you are genuinely confident
4. If you cannot confidently predict the match, set confidence to 60 and pick the most likely outcome
5. NEVER default to 2-1 or always pick home team
6. Draws happen in ~26% of matches - predict them when appropriate
7. 0-0 and 1-0 are among the most common scores - don't always predict high-scoring
8. Consider league-specific patterns:
   - Premier League: Higher scoring, end-to-end
   - Serie A/La Liga: More tactical, lower scoring
   - Bundesliga: High scoring, home advantage strong
   - Lower leagues: More unpredictable, draws common
9. Asian leagues, smaller competitions: research quality gap carefully

═══ BETTING TIPS REQUIREMENTS ═══

CRITICAL RULE: Only provide tips you are GENUINELY CONFIDENT about.
- Provide 3 to 5 tips MAXIMUM
- ONLY include tips with "high" or "medium" confidence
- DO NOT include any tip with "low" confidence — if you're not confident, don't include it
- Every tip must have strong reasoning backed by data/logic
- Each tip must be from a DIFFERENT market category

Available markets (pick from these):
- Goals Market: Over/Under 0.5, 1.5, 2.5, 3.5 (match or team-specific)
- Result Market: 1X2, Double Chance, Draw No Bet
- Both Teams to Score: BTTS Yes/No
- Handicap: Asian Handicap -0.5, -1, -1.5, +0.5, +1
- Correct Score: Exact scoreline prediction (only if very confident)
- Half Markets: HT/FT, First Half Over/Under
- Specials: Clean Sheet Yes/No, Win to Nil

EACH TIP MUST INCLUDE:
- Specific reasoning with concrete evidence (not generic)
- Why THIS specific market and line
- Only "high" or "medium" confidence — never "low"

═══ ANALYSIS WRITING RULES ═══

The analysis field must be:
- 3-5 sentences of specific, insightful analysis
- Reference concrete factors (form, tactics, head-to-head, conditions)
- Mention specific strengths/weaknesses of each team
- Explain WHY you predict this specific result with conviction
- NO generic phrases — be specific and authoritative
- Sound like a confident expert who has done thorough research
${langInstruction}

═══ OUTPUT FORMAT ═══

Respond with ONLY valid JSON, absolutely no markdown or extra text:
{
  "winner": "home|away|draw",
  "confidence": 72,
  "predicted_score": "2-0",
  "tips": [
    {"tip": "Under 2.5 Goals", "confidence": "high", "description": "Both teams average under 1.1 goals conceded per game this season with 60%+ clean sheet rate at home"},
    {"tip": "Double Chance: 1X", "confidence": "high", "description": "Home team unbeaten in 12 home matches, away side won only 2 of last 10 away games"},
    {"tip": "BTTS: No", "confidence": "medium", "description": "Away team failed to score in 5 of last 8 away fixtures against top-half sides"},
    {"tip": "Draw No Bet: Home", "confidence": "high", "description": "Home team's xG at home is 1.8 vs opponent's away xG of 0.7 — significant quality gap"}
  ],
  "analysis": "Detailed 3-5 sentence expert analysis with conviction..."
}`;
}

// Provider 1: Lovable AI Gateway (primary - best quality)
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
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are an elite football analyst and betting expert with decades of experience. You analyze matches using deep tactical knowledge, statistical models, historical data, weather conditions, and team dynamics. Your predictions are data-driven, varied, realistic, and NEVER generic. You always respond with valid JSON only." },
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
        { role: "system", content: "You are an elite football analyst. Respond with ONLY valid JSON. Be specific, realistic, and data-driven." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
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
          temperature: 0.5,
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

// Try providers: Lovable AI first (best quality), then fallbacks
async function getAIResponse(prompt: string): Promise<string> {
  const providers = [
    { name: "Lovable AI", fn: () => tryLovableAI(prompt) },
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
    const parts = prediction.predicted_score.split("-").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [h, a] = parts;
      if (h > a) prediction.winner = "home";
      else if (h < a) prediction.winner = "away";
      else prediction.winner = "draw";
    }
  }

  // Clamp confidence
  if (prediction.confidence) {
    prediction.confidence = Math.max(30, Math.min(95, Math.round(prediction.confidence)));
  }

  // Ensure valid winner
  if (!["home", "away", "draw"].includes(prediction.winner)) {
    prediction.winner = "home";
  }

  // Ensure tips array
  if (!Array.isArray(prediction.tips)) {
    prediction.tips = [];
  }

  // Limit to 5 tips and validate each
  prediction.tips = prediction.tips.slice(0, 5).map((tip: any) => ({
    tip: tip.tip || "Match Result",
    confidence: ["high", "medium", "low"].includes(tip.confidence) ? tip.confidence : "medium",
    description: tip.description || "Analysis based on current form and statistics.",
  }));

  // Ensure analysis exists
  if (!prediction.analysis || typeof prediction.analysis !== 'string' || prediction.analysis.length < 20) {
    prediction.analysis = "Match analysis is being generated based on available data.";
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
    
    const cacheKey = live 
      ? `v2-live-${lang}-${homeName}-${awayName}-${matchScore}` 
      : `v2-pre-${lang}-${homeName}-${awayName}`;
    
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
    let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in response");
    cleaned = jsonMatch[0];
    
    let prediction = JSON.parse(cleaned);
    prediction = validateAndFixPrediction(prediction);

    // Save to cache
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
