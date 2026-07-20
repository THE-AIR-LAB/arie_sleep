import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Generates the next message from a SIMULATED CLIENT for the law demo's
 * Simulation tab. Given the scenario (the client's persona/situation) and the
 * conversation so far (legal-intake assistant ↔ client), it returns one short,
 * in-character client message. The real assistant reply is produced separately by
 * the normal /api/chat/law/base pipeline, so a full simulated turn is:
 *   simulate-user → assistant(base) → simulate-user → …
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    scenario?: string;
    history?: Array<{ role: "user" | "ai"; text: string }>;
  };

  const scenario = (body.scenario ?? "").trim();
  const history = Array.isArray(body.history) ? body.history : [];

  const transcript = history
    .map((m) => `${m.role === "ai" ? "Assistant" : "Client"}: ${m.text}`)
    .join("\n");

  const system =
    "You are role-playing a PROSPECTIVE CLIENT talking to a law firm's intake assistant. Stay fully in character. " +
    (scenario
      ? `Your situation: ${scenario}`
      : "Invent a realistic, specific legal matter (e.g. an employment dispute, a landlord problem, a contract issue, a family matter) with consistent personal details, parties, and timeline, and keep them consistent across turns.") +
    " Respond with ONE short, natural client message (1–3 sentences). If the assistant just asked a question, answer it plausibly given your situation; volunteer a little detail but don't dump everything at once. You are a layperson, not a lawyer. Never break character, never mention you are an AI, and reply with ONLY the client's message text (no name prefix, no quotes).";

  const user = transcript
    ? `Conversation so far:\n${transcript}\n\nWrite the client's next message.`
    : "Start the conversation: write the client's opening message describing why they're reaching out.";

  try {
    const openai = new OpenAI({ apiKey: process.env.AIRLAB_OPENAI_API_KEY });
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const message = res.choices?.[0]?.message?.content?.trim() ?? "";
    if (!message) {
      return NextResponse.json({ error: "The simulated client produced no message." }, { status: 502 });
    }
    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate the simulated client message." },
      { status: 500 }
    );
  }
}
