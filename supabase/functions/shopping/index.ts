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

    // Fetch all items (optionally sorted by place)
    if (method === "GET") {
      const sortBy = url.searchParams.get("sort");
      let query = supabase.from("shopping").select("*");

      if (sortBy === "place") {
        query = query.order("place", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), { headers });
    }

    // Search for items by name
    if (method === "GET" && url.searchParams.get("search")) {
      const searchQuery = url.searchParams.get("search") || "";
      const { data, error } = await supabase
        .from("shopping")
        .select("*")
        .ilike("name", `%${searchQuery}%`);

      if (error) throw error;
      return new Response(JSON.stringify(data), { headers });
    }

    // Add a new item
    if (method === "POST") {
      const { name, quantity, place } = await req.json();
      const { error } = await supabase.from("shopping").insert([{ name, quantity, place }]);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: "Item added!" }), { headers });
    }

    // Update an item (name, quantity, place)
    if (method === "PUT") {
      const { id, name, quantity, place } = await req.json();
      const { error } = await supabase
        .from("shopping")
        .update({ name, quantity, place })
        .eq("id", id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: "Item updated!" }), { headers });
    }

    // Delete an item by ID
    if (method === "DELETE") {
      const { id } = await req.json();
      const { error } = await supabase.from("shopping").delete().eq("id", id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: "Item deleted!" }), { headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});
