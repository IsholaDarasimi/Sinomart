// supabase/functions/search-autocomplete/index.ts

import { handleCorsPreflight, corsHeaders } from "../_shared/cors.ts";
import { createUserClient } from "../_shared/supabase-clients.ts";
import { errorResponse } from "../_shared/errors.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);

  if (preflight) {
    return preflight;
  }

  try {
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({
          suggestions: [],
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const url = new URL(req.url);

    const q = url.searchParams.get("q")?.trim() ?? "";
    const sessionId =
      url.searchParams.get("session_id")?.trim() || null;

    // Start autocomplete from the first character.
    if (q.length < 1) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const supabase = createUserClient(req);

    const {
      data,
      error,
    } = await supabase.rpc("search_suggestions", {
      p_query: q,
      p_limit: 8,
    });

    if (error) {
      console.error("SEARCH_SUGGESTIONS_FAILED", error);
      throw error;
    }

    const suggestions = Array.isArray(data)
      ? data
      : [];

    // Log the search without delaying autocomplete.
    supabase
      .from("search_logs")
      .insert({
        session_id: sessionId,
        query: q,
        result_count: suggestions.length,
      })
      .then(({ error: logErr }) => {
        if (logErr) {
          console.error(
            "SEARCH_LOG_FAILED",
            logErr,
          );
        }
      });

    return new Response(
      JSON.stringify({
        suggestions,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    return errorResponse(err, corsHeaders);
  }
});