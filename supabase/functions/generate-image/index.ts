import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetImageBase64, modelImageBase64, prompt, mode } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gemini 2.5 Flash Image (Nano Banana) - supports multi-image composition
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GOOGLE_API_KEY}`;

    let parts: any[];

    if (mode === "refine") {
      // Refinement mode: single image + text prompt
      parts = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: modelImageBase64,
          },
        },
        { text: prompt || "Refine this image, improve quality and details." },
      ];
    } else {
      // Composition mode: combine identity from target with pose/clothes from model
      parts = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: modelImageBase64,
          },
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: targetImageBase64,
          },
        },
        {
          text:
            prompt ||
            "Generate a new photo that combines the identity (face, skin tone, hair) of the person in the second image with the exact pose, clothing, environment, and lighting of the person in the first image. The result should look like a real professional photograph of the second person in the first person's scenario. Keep the composition, background, and outfit from the first image intact. Make it photorealistic.",
        },
      ];
    }

    const payload = {
      contents: [{ parts }],
    };

    console.log("Calling Gemini API for", mode === "refine" ? "refinement" : "composition");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Extract image from response
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      const cParts = candidate.content?.parts || [];
      for (const part of cParts) {
        if (part.inlineData) {
          return new Response(
            JSON.stringify({
              imageBase64: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "image/png",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // No image in response
    return new Response(
      JSON.stringify({ error: "No image generated", response: data }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});