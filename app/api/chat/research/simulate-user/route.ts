import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * Generates the next message from the SIMULATED TASK ENVIRONMENT for the
 * Research demo's Simulation tab. The task environment delivers a company to
 * screen and then plays the role of the requester answering the analyst's
 * clarifying questions. The real analyst reply is produced separately by the
 * /api/chat/research/base pipeline, so a full simulated turn is:
 *   simulate-user (deliver/answer) → analyst(base) → simulate-user → …
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    scenario?: string;
    history?: Array<{ role: "user" | "ai"; text: string }>;
  };

  const scenario = (body.scenario ?? "").trim();
  const history = Array.isArray(body.history) ? body.history : [];

  const transcript = history
    .map((m) => `${m.role === "ai" ? "Analyst" : "Task"}: ${m.text}`)
    .join("\n");

  const system =
    "You are role-playing the TASK ENVIRONMENT for an equity research idea-generation screening. Stay fully in character. " +
    (scenario
      ? `The company/task to screen: ${scenario}`
      : "Invent one realistic, specific company to screen (name or ticker, sector, rough size, and a recent development or setup — e.g. a cheap cyclical after a demand air-pocket, a high-growth SaaS at a premium multiple, or a leveraged turnaround), and keep it consistent across turns.") +
    " On the FIRST message, deliver the company profile and any available context (recent disclosures, peers, consensus) and ask the analyst to screen it for idea generation. On later messages, answer the analyst's clarifying questions plausibly and consistently with the profile you established; invent reasonable specifics rather than stalling. Respond with ONE short, natural message (1–4 sentences). Never break character, never mention you are an AI, and reply with ONLY the message text (no name prefix, no quotes).";

  const user = transcript
    ? `Conversation so far:\n${transcript}\n\nWrite the task environment's next message.`
    : "Start: deliver the company profile and ask the analyst to screen it.";

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
      return NextResponse.json({ error: "The task environment produced no message." }, { status: 502 });
    }
    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate the task-environment message." },
      { status: 500 }
    );
  }
}
