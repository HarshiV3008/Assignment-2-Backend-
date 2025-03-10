import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json" };

  try {
    const url = new URL(req.url);
    const method = req.method;
    const searchQuery = url.searchParams.get("search");
    const sortQuery = url.searchParams.get("sort");

    // 🔹 Handle GET requests (Fetch & Sort Items)
    if (method === "GET") {
      let query = supabase.from("shopping").select("*");

      // Apply search filter if provided
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const placeFilter = url.searchParams.get("place");
      if (placeFilter) {
        query = query.eq("place", placeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), { headers });
    }

    // 🔹 Add a new item
    if (method === "POST") {
      const { name, quantity, place } = await req.json();
      const { error } = await supabase.from("shopping").insert([
        { name, quantity, place, purchased: false }, // Default purchased status is false
      ]);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Item added!" }),
        { headers }
      );
    }

    // 🔹 Update an item 
    if (method === "PUT") {
      const { id, name, quantity, place} = await req.json();
      const { error } = await supabase
        .from("shopping")
        .update({ name, quantity, place})
        .eq("id", id);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Item updated!" }),
        { headers }
      );
    }

    // 🔹 Delete an item by ID
    if (method === "DELETE") {
      const { id } = await req.json();
      const { error } = await supabase.from("shopping").delete().eq("id", id);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Item deleted!" }),
        { headers }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    );
  }
});
