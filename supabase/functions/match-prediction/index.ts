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

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional football betting analyst. You provide specific actionable betting tips with exact market selections. Respond with ONLY valid JSON, no markdown.`;

    const userPrompt = `Analyze this football match and provide 5 specific betting tips:
- Home: ${home_name}
- Away: ${away_name}
- Competition: ${competition || "Unknown"}
- Current Score: ${score || "Not started"}
- Time: ${time || "Unknown"}

Each tip MUST use real betting market formats like these examples:
- "Handicap ${home_name} -1.5" or "Handicap ${away_name} +0.5"
- "Over 2.5 Goals" or "Under 1.5 Goals"
- "Both Teams To Score - Yes"
- "1X2: ${home_name} Win" or "1X2: Draw"
- "Correct Score 2-1"
- "First Half Over 0.5"
- "Double Chance: ${home_name} or Draw"
- "HT/FT: Draw/${away_name}"

Respond with ONLY this JSON:
{"winner":"home or away or draw","confidence":number 0-100,"predicted_score":"X-Y","tips":[{"tip":"exact betting market name","confidence":"high or medium or low","description":"why this bet is good, under 25 words"}],"analysis":"match analysis under 50 words"}
Provide exactly 5 tips with different bet types.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Groq API error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in Groq response");
    }

    const prediction = JSON.parse(content);

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
