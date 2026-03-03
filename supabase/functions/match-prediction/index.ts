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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional football/soccer match analyst and betting tips expert. You provide predictions and betting tips based on team names and competition context. Your analysis should feel authentic and knowledgeable.

IMPORTANT: You MUST respond with a valid JSON object using the tool call. Do not include any other text.`;

    const userPrompt = `Analyze this football match and provide betting tips:
- Home: ${home_name}
- Away: ${away_name}
- Competition: ${competition || "Unknown"}
- Current Score: ${score || "Not started"}
- Time: ${time || "Unknown"}

Provide your prediction with confidence percentage, predicted score, and 3 betting tips.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "match_prediction",
              description: "Return match prediction and betting tips",
              parameters: {
                type: "object",
                properties: {
                  winner: {
                    type: "string",
                    enum: ["home", "away", "draw"],
                    description: "Predicted outcome",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence percentage 0-100",
                  },
                  predicted_score: {
                    type: "string",
                    description: "Predicted final score e.g. 2-1",
                  },
                  tips: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tip: { type: "string", description: "Short betting tip label e.g. Over 2.5 Goals" },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                        description: { type: "string", description: "Brief explanation under 20 words" },
                      },
                      required: ["tip", "confidence", "description"],
                      additionalProperties: false,
                    },
                  },
                  analysis: {
                    type: "string",
                    description: "Brief match analysis under 40 words",
                  },
                },
                required: ["winner", "confidence", "predicted_score", "tips", "analysis"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "match_prediction" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const prediction = JSON.parse(toolCall.function.arguments);

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
