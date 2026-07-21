import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Generates the next message from a SIMULATED PATIENT for the Simulation tab.
 * Given the scenario (the persona/situation the patient is playing) and the
 * conversation so far (therapist ↔ patient), it returns one short, in-character
 * patient utterance. The real sleep-therapist reply is produced separately by
 * the normal /api/chat/sleep/base pipeline, so a full simulated turn is:
 *   simulate-user → therapist(base) → simulate-user → …
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    scenario?: string;
    history?: Array<{ role: "user" | "ai"; text: string }>;
  };

  const scenario = (body.scenario ?? "").trim();
  const history = Array.isArray(body.history) ? body.history : [];

  const transcript = history
    .map((m) => `${m.role === "ai" ? "Therapist" : "Patient"}: ${m.text}`)
    .join("\n");

  const system =
    "You are role-playing a PATIENT talking to a sleep-therapist assistant. Stay fully in character. " +
    (scenario
      ? `Your situation: ${scenario}`
      : "Invent a realistic, specific sleep problem and consistent personal details, and keep them consistent across turns.") +
    " Respond with ONE short, natural patient message (1–3 sentences). If the therapist just asked a question, answer it plausibly given your situation; volunteer a little detail but don't dump everything at once. Never break character, never mention you are an AI, and reply with ONLY the patient's message text (no name prefix, no quotes).";

  const user = transcript
    ? `Conversation so far:\n${transcript}\n\nWrite the patient's next message.`
    : "Start the conversation: write the patient's opening message describing why they're here.";

  try {
    const openai = new OpenAI({ apiKey: process.env.AIRIE_OPENAI_API_KEY });
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
      return NextResponse.json({ error: "The simulated user produced no message." }, { status: 502 });
    }
    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate the simulated user message." },
      { status: 500 }
    );
  }
}
