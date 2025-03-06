import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json" };

  try {
    // Handle GET request - fetch messages with optional search and filter
    if (req.method === "GET") {
      const url = new URL(req.url);
      const search = url.searchParams.get("search");
      const filter = url.searchParams.get("filter");
      const query = supabase.from("messages").select("*").order("created_at", { ascending: false });

      // Apply search filter if exists
      if (search) {
        query.ilike("message", `%${search}%`);
      }

      // Apply additional filtering (example: filter by date)
      if (filter) {
        query.gte("created_at", filter); // filter by date (e.g., created_at >= some_date)
      }

      const { data, error } = await query;

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers });
    }

    // Handle POST request - add message
    if (req.method === "POST") {
      const { message } = await req.json();
      const { error } = await supabase.from("messages").insert([{ message }]);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Message sent!" }),
        { headers }
      );
    }

    // Handle PUT request - edit message
    if (req.method === "PUT") {
      const { id, message } = await req.json();
      const { data, error } = await supabase
        .from("messages")
        .update({ message })
        .eq("id", id)
        .select();

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: `Message updated! ${data}` }),
        { headers }
      );
    }

    // Handle DELETE request - delete message
    if (req.method === "DELETE") {
      const { id } = await req.json();
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Message deleted!" }),
        { headers }
      );
    }

    // Handle unsupported methods
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers,
    });
  }
});
