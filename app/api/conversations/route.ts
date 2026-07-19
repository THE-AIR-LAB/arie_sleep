import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../lib/supabase-admin";
import { getRequestUserUUID } from "../../lib/admin-auth";

export async function GET(request: NextRequest) {
  const userUUID = await getRequestUserUUID();
  if (!userUUID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const topic = request.nextUrl.searchParams.get("topic");

  let query = supabase
    .from("conversations")
    .select("id, title, updated_at, scenario")
    .eq("user_id", userUUID)
    .order("updated_at", { ascending: false });

  if (topic) {
    query = query.eq("topic", topic);
  } else {
    query = query.is("topic", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[api/conversations] list error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach a real turn count (assistant replies) per conversation so the
  // Simulation panel can show the actual number of turns a run produced — more
  // truthful than the requested count, and works for runs created before the
  // turn count was encoded in the title. One light query (id column only).
  const rows = (data ?? []) as Array<{ id: string }>;
  const ids = rows.map((c) => c.id);
  const turnCount = new Map<string, number>();
  if (ids.length > 0) {
    const { data: msgRows, error: msgError } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", ids)
      .in("role", ["assistant", "ai"]);
    if (msgError) {
      console.error("[api/conversations] turn count error:", JSON.stringify(msgError));
    } else {
      for (const m of (msgRows ?? []) as Array<{ conversation_id: string }>) {
        turnCount.set(m.conversation_id, (turnCount.get(m.conversation_id) ?? 0) + 1);
      }
    }
  }

  const conversations = rows.map((c) => ({
    ...c,
    turn_count: turnCount.get(c.id) ?? 0,
  }));

  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  const userUUID = await getRequestUserUUID();
  if (!userUUID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  const { error: profileError } = await supabase.from("profiles").upsert({ id: userUUID }, { onConflict: "id" });
  if (profileError) console.error("[api/conversations] profiles upsert error:", JSON.stringify(profileError));

  const body = await request.json().catch(() => ({}));
  const title = body.title ?? "New conversation";
  const topic = body.topic ?? null;
  // Simulation runs pass the patient scenario that drove them so it can be
  // repopulated when the run is later selected.
  const scenario = typeof body.scenario === "string" ? body.scenario : null;

  const insertPayload: Record<string, unknown> = { user_id: userUUID, title };
  if (topic) insertPayload.topic = topic;
  if (scenario !== null) insertPayload.scenario = scenario;

  let { data, error } = await supabase
    .from("conversations")
    .insert(insertPayload)
    .select("id")
    .single();

  // If insert failed (e.g. topic/scenario column not yet in DB), retry with just
  // the essentials so a schema lag never blocks creating a conversation.
  if (error && (topic || scenario !== null)) {
    const fallback = await supabase
      .from("conversations")
      .insert({ user_id: userUUID, title })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("[api/conversations] insert error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  return NextResponse.json({ id: data!.id });
}
