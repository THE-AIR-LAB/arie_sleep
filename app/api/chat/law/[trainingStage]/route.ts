import { NextRequest, NextResponse } from "next/server";
import { POST as handleBaseChatRequest } from "../../route";

// The law demo runs entirely on the base stateful pipeline (no fine-tuned stage).
// The base handler resolves the law_inputs setup from the request referer
// (/demo/law/...), so this route just forwards the "base" training stage.
const LAW_CHAT_ROUTE_REGISTRY = {
  base: { kind: "base" },
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trainingStage: string }> }
) {
  const { trainingStage } = await params;
  const routeConfig =
    LAW_CHAT_ROUTE_REGISTRY[trainingStage as keyof typeof LAW_CHAT_ROUTE_REGISTRY] ?? null;

  console.log("[api/chat/law] incoming", {
    trainingStage,
    resolved: routeConfig?.kind ?? "none",
    referer: request.headers.get("referer") ?? "(none)",
  });

  if (!routeConfig) {
    return NextResponse.json(
      { error: `Unknown law chat training stage: ${trainingStage}` },
      { status: 404 }
    );
  }

  return handleBaseChatRequest(request);
}
