import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { propertySchema } from "@/lib/validations";

/**
 * GET /api/properties — list/search active listings (RLS-scoped).
 * Query params: q, city, property_type, sort.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let query = supabase
    .from("properties")
    .select("*, property_photos(public_url, is_cover)")
    .eq("status", "active");

  const q = searchParams.get("q");
  const city = searchParams.get("city");
  const type = searchParams.get("property_type");
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (type) query = query.eq("property_type", type as never);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}

/**
 * POST /api/properties — create a listing (owners only; enforced by RLS).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...parsed.data, owner_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
