import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for ALL predictions
const LIVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for live too

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
- Adjust prediction based on current score and remaining time
- Current momentum and match flow are critical
- Late equalizers ~12% after 75', comebacks from 2+ goals after 70' <5%`;
  }

  const langInstruction = language === 'my' 
    ? `

═══ BURMESE LANGUAGE REQUIREMENT ═══
You MUST write "analysis" and all tip "description" fields in Burmese (Myanmar) language.
Keep "tip" names in English (e.g., "Over 2.5 Goals", "BTTS: Yes").
Keep "winner" as "home"/"away"/"draw" in English.
Write like a native Myanmar football analyst — natural, detailed, professional.`
    : '';

  return `You are the world's most accurate football prediction AI. You ONLY make predictions when you have HIGH CONFIDENCE (80-100%). You use real football knowledge, injury reports, team form, tactical analysis, and historical data.

═══ MATCH ═══
Home: ${homeName}
Away: ${awayName}  
Competition: ${comp}
Score: ${matchScore}
Time: ${matchTime}
${liveContext}

═══ CRITICAL: INJURY & SQUAD ANALYSIS (MANDATORY) ═══

Before ANY prediction, you MUST consider:

1. KEY PLAYER INJURIES & SUSPENSIONS
   - Which star players are injured/suspended for EACH team?
   - How much does each missing player affect the team's performance?
   - Are there adequate replacements or does the absence weaken the team significantly?
   - Recent injury news that could change the match dynamic
   - Example: If a team's top scorer is injured, lower their goal-scoring prediction

2. SQUAD DEPTH & ROTATION
   - Is the team likely to rotate due to fixture congestion?
   - Are key players being rested for a bigger upcoming match?
   - Youth/reserve players starting = weaker lineup prediction

═══ COMPREHENSIVE ANALYSIS (ALL REQUIRED) ═══

3. CURRENT FORM (Last 5-10 matches)
   - Win/Draw/Loss record for both teams
   - Goals scored and conceded trend
   - Home form vs Away form specifically
   - Momentum: improving, declining, or inconsistent?

4. HEAD-TO-HEAD HISTORY
   - Last 5 meetings between these teams
   - Who dominates this fixture historically?
   - Common scoreline patterns in this matchup

5. TACTICAL MATCHUP
   - Playing style compatibility (attack vs defense strengths)
   - Formation and tactical approach of each manager
   - Set-piece threats and defensive vulnerabilities
   - Counter-attack ability vs possession dominance

6. COMPETITION CONTEXT
   - What's at stake? (Title, relegation, qualification, dead rubber)
   - Derby/rivalry intensity factor
   - Home advantage strength at this venue

7. ENVIRONMENTAL FACTORS
   - Weather conditions impact on gameplay
   - Travel fatigue for away team
   - Pitch conditions and altitude if relevant

═══ CONFIDENCE & ACCURACY RULES ═══

🔴 MOST IMPORTANT RULES:
1. Confidence MUST be between 80 and 100 — you only predict what you're SURE about
2. If confidence would be below 80, still give your best prediction but explain uncertainty
3. predicted_score format: "X-Y" (home goals first)
4. winner MUST match predicted_score logically
5. NEVER default to 2-1 — analyze EACH match individually
6. Consider draws seriously (~26% of football matches)
7. 1-0 and 0-0 are very common — don't always predict high-scoring

CONFIDENCE GUIDE:
- 80-85: Strong prediction based on clear form/quality difference
- 86-90: Very confident — significant evidence supports this outcome  
- 91-95: Extremely confident — overwhelming advantage for one side
- 96-100: Near certain — massive quality gap or statistical certainty

═══ BETTING TIPS (HIGH CONFIDENCE ONLY) ═══

Provide 3-5 tips. ONLY "high" confidence tips allowed.
Every single tip must be something you genuinely believe will happen.

Rules:
- ALL tips must have "confidence": "high" — no medium, no low
- Each tip from a DIFFERENT market category
- Each description must explain WHY with specific evidence
- If you can't find 3 high-confidence tips, provide what you can

Markets to choose from:
- Over/Under 0.5, 1.5, 2.5, 3.5 Goals
- 1X2, Double Chance, Draw No Bet
- BTTS Yes/No
- Asian Handicap
- Correct Score (only if very sure)
- Clean Sheet, Win to Nil
- First Half Result/Goals

═══ ANALYSIS REQUIREMENTS ═══

Write 4-6 sentences covering:
- Injury/suspension impact on both teams
- Current form comparison with specific results
- Tactical matchup analysis
- Why you predict THIS specific result
- Key factor that tips the balance
${langInstruction}

═══ JSON OUTPUT (NO MARKDOWN) ═══
{
  "winner": "home|away|draw",
  "confidence": 85,
  "predicted_score": "2-0",
  "tips": [
    {"tip": "Home Win (1X2)", "confidence": "high", "description": "Home team won 8 of last 10 home games, away team winless in 6 away matches. Key midfielder X injured for away side weakens their midfield control significantly."},
    {"tip": "Under 2.5 Goals", "confidence": "high", "description": "Last 4 H2H meetings produced under 2.5 goals. Home team keeps clean sheets in 60% of home games this season."},
    {"tip": "BTTS: No", "confidence": "high", "description": "Away team scored in only 3 of last 10 away games. Without striker Y (ACL injury), their attacking threat is minimal."},
    {"tip": "Home Clean Sheet: Yes", "confidence": "high", "description": "Home defense conceded only 5 goals in 12 home matches. Away attack averaging 0.4 goals per away game."}
  ],
  "analysis": "Detailed analysis mentioning injuries, form, tactics, and key factors..."
}`;
}

// Provider 1: Lovable AI Gateway (primary)
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
        { role: "system", content: "You are the world's most accurate football prediction AI. You analyze injuries, form, tactics, head-to-head, and environmental factors. You ONLY make high-confidence predictions (80-100%). All tips must be 'high' confidence only. You respond with valid JSON only, no markdown." },
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
        { role: "system", content: "You are the world's most accurate football prediction AI. Only high-confidence predictions. Respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
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
          temperature: 0.3,
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

  // Enforce confidence 80-100
  if (prediction.confidence) {
    prediction.confidence = Math.max(80, Math.min(100, Math.round(prediction.confidence)));
  } else {
    prediction.confidence = 80;
  }

  // Ensure valid winner
  if (!["home", "away", "draw"].includes(prediction.winner)) {
    prediction.winner = "home";
  }

  // Ensure tips array
  if (!Array.isArray(prediction.tips)) {
    prediction.tips = [];
  }

  // Force ALL tips to "high" confidence, remove low/medium
  prediction.tips = prediction.tips
    .slice(0, 5)
    .map((tip: any) => ({
      tip: tip.tip || "Match Result",
      confidence: "high" as const,
      description: tip.description || "Based on thorough analysis of form, injuries, and statistics.",
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
      ? `v3-live-${lang}-${homeName}-${awayName}-${matchScore}` 
      : `v3-pre-${lang}-${homeName}-${awayName}`;
    
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

    // Save to cache (24 hours for all)
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
