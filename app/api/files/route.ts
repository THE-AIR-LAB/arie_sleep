import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../lib/supabase-admin";
import { getRequestUserUUID } from "../../lib/admin-auth";

/**
 * The signed-in user's document library.
 *
 * Files uploaded anywhere in the app land here: the bytes go to the private
 * `sleep-input-files` Storage bucket under `${userUUID}/library/...`, and one
 * manifest row per file is recorded in `public.user_files`. The library is
 * per-user (not per-conversation) — `conversation_id` is optional provenance for
 * where a file was uploaded from.
 *
 * Ownership is enforced in code by scoping every query to the caller's user_id
 * (service-role client, RLS disabled — matching the rest of the app).
 */

const BUCKET = "sleep-input-files";
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file
const SIGNED_URL_TTL = 60 * 60; // 1 hour

interface FileRow {
  id: string;
  user_id: string;
  conversation_id: string | null;
  name: string;
  size: number;
  type: string;
  bucket: string;
  path: string;
  created_at: string;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

type Supa = ReturnType<typeof createSupabaseAdminClient>;

/** Attach a short-lived signed download URL to each library row. */
async function withUrls(supabase: Supa, rows: FileRow[]) {
  return Promise.all(
    rows.map(async (r) => {
      const { data } = await supabase.storage
        .from(r.bucket || BUCKET)
        .createSignedUrl(r.path, SIGNED_URL_TTL);
      return {
        id: r.id,
        conversationId: r.conversation_id,
        name: r.name,
        size: r.size,
        type: r.type,
        path: r.path,
        createdAt: r.created_at,
        url: data?.signedUrl ?? null,
      };
    })
  );
}

// GET — list the caller's library (newest first) with signed download URLs.
// Optional ?conversationId=<id> filters to files uploaded from that conversation.
export async function GET(request: NextRequest) {
  const userUUID = await getRequestUserUUID();
  if (!userUUID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = request.nextUrl.searchParams.get("conversationId");
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("user_files")
    .select("id, user_id, conversation_id, name, size, type, bucket, path, created_at")
    .eq("user_id", userUUID)
    .order("created_at", { ascending: false });
  if (conversationId) query = query.eq("conversation_id", conversationId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const files = await withUrls(supabase, (data ?? []) as FileRow[]);
  return NextResponse.json({ files });
}

// POST — upload a file to the library (multipart form, field "file"). An optional
// "conversationId" field records where it was uploaded from.
export async function POST(request: NextRequest) {
  const userUUID = await getRequestUserUUID();
  if (!userUUID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds the 25 MB limit" }, { status: 413 });
  }
  const rawConvo = form?.get("conversationId");
  const conversationId = typeof rawConvo === "string" && rawConvo ? rawConvo : null;

  const supabase = createSupabaseAdminClient();
  const path = `${userUUID}/library/${Date.now()}-${sanitize(file.name)}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data, error: insErr } = await supabase
    .from("user_files")
    .insert({
      user_id: userUUID,
      conversation_id: conversationId,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      bucket: BUCKET,
      path,
    })
    .select("id, user_id, conversation_id, name, size, type, bucket, path, created_at")
    .single();
  if (insErr || !data) {
    // Roll back the orphaned object so storage and the library stay in sync.
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    return NextResponse.json(
      { error: insErr?.message ?? "Failed to record file" },
      { status: 500 }
    );
  }

  const [saved] = await withUrls(supabase, [data as FileRow]);
  return NextResponse.json({ file: saved });
}

// PATCH — attach/detach a library file to a conversation by setting its
// conversation_id. Body: { id, conversationId }. A null conversationId detaches.
export async function PATCH(request: NextRequest) {
  const userUUID = await getRequestUserUUID();
  if (!userUUID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    conversationId?: string | null;
  };
  const id = body.id;
  const conversationId = body.conversationId ?? null;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // If attaching, verify the target conversation belongs to the caller.
  if (conversationId) {
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userUUID)
      .single();
    if (!convo) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("user_files")
    .update({ conversation_id: conversationId })
    .eq("id", id)
    .eq("user_id", userUUID)
    .select("id, conversation_id")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Not found" },
      { status: error ? 500 : 404 }
    );
  }

  return NextResponse.json({
    id: data.id,
    conversationId: data.conversation_id,
  });
}

// DELETE — remove one library file (?id=<uuid>) from storage and the table.
export async function DELETE(request: NextRequest) {
  const userUUID = await getRequestUserUUID();
  if (!userUUID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: row } = await supabase
    .from("user_files")
    .select("id, bucket, path")
    .eq("id", id)
    .eq("user_id", userUUID)
    .single();
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase.storage.from(row.bucket || BUCKET).remove([row.path]);

  const { error: delErr } = await supabase
    .from("user_files")
    .delete()
    .eq("id", id)
    .eq("user_id", userUUID);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
