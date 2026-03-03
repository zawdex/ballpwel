import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const homeName = home_name.trim();
    const awayName = away_name.trim();
    const comp = (competition || "Unknown").trim();
    const matchScore = (score || "Not started").trim();
    const matchTime = (time || "Unknown").trim();

    const prompt = `You are an elite professional football betting analyst with deep knowledge of team form, head-to-head records, league trends, and tactical analysis.

Analyze this football match and provide 5 high-quality betting tips:

Match: ${homeName} vs ${awayName}
Competition: ${comp}
Current Score: ${matchScore}
Time: ${matchTime}

CRITICAL CONSISTENCY RULES:
1. predicted_score format: "HomeGoals-AwayGoals" (home team score FIRST)
2. If home goals > away goals → winner MUST be "home"
3. If home goals < away goals → winner MUST be "away"
4. If home goals = away goals → winner MUST be "draw"
5. Tips must logically align with your predicted winner and score
6. If match is live and score is given, factor in current momentum

Required betting market formats for tips (use these exact formats):
- "Handicap ${homeName} -1.5" or "Handicap ${awayName} +0.5"
- "Over 2.5 Goals" or "Under 1.5 Goals"
- "Both Teams To Score - Yes" or "Both Teams To Score - No"
- "1X2: ${homeName} Win" or "1X2: Draw" or "1X2: ${awayName} Win"
- "Correct Score ${homeName} 2-1 ${awayName}"
- "First Half Over 0.5" or "First Half Under 0.5"
- "Double Chance: ${homeName} or Draw"
- "HT/FT: Draw/${awayName}"

Respond with ONLY this JSON (no markdown, no code blocks):
{"winner":"home or away or draw","confidence":number 0-100,"predicted_score":"X-Y","tips":[{"tip":"exact betting market name","confidence":"high or medium or low","description":"clear reasoning in under 25 words"}],"analysis":"detailed match analysis under 60 words"}

Provide exactly 5 tips using different bet types. Make each tip specific and actionable with clear reasoning.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("No content in Gemini response:", JSON.stringify(data));
      throw new Error("No content in Gemini response");
    }

    const prediction = JSON.parse(content);

    // Server-side consistency fix: ensure winner matches predicted_score
    if (prediction.predicted_score) {
      const parts = prediction.predicted_score.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const [homeGoals, awayGoals] = parts;
        if (homeGoals > awayGoals) prediction.winner = "home";
        else if (homeGoals < awayGoals) prediction.winner = "away";
        else prediction.winner = "draw";
      }
    }

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(
      JSON.stringify({ error: "Unable to generate prediction. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
