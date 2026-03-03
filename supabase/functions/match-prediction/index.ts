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

    const prompt = `You are a professional football/soccer match analyst and betting tips expert. Analyze this match and respond ONLY with a valid JSON object (no markdown, no code blocks):

Match:
- Home: ${home_name}
- Away: ${away_name}
- Competition: ${competition || "Unknown"}
- Current Score: ${score || "Not started"}
- Time: ${time || "Unknown"}

Respond with this exact JSON structure:
{
  "winner": "home" or "away" or "draw",
  "confidence": number between 0-100,
  "predicted_score": "X-Y",
  "tips": [
    {"tip": "short tip label", "confidence": "high" or "medium" or "low", "description": "brief explanation under 20 words"}
  ],
  "analysis": "brief match analysis under 40 words"
}

Provide exactly 3 tips. Respond with ONLY the JSON, nothing else.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
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
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No content in Gemini response");
    }

    // Clean up the response - remove markdown code blocks if present
    const cleanJson = textContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const prediction = JSON.parse(cleanJson);

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
