import { NextRequest, NextResponse } from "next/server";
import { POST as handleBaseChatRequest } from "../../route";

// The research demo runs entirely on the base stateful pipeline (no fine-tuned
// stage). The base handler resolves the research setup from the request referer
// (/demo/research/...), so this route just forwards the "base" training stage.
const RESEARCH_CHAT_ROUTE_REGISTRY = {
  base: { kind: "base" },
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trainingStage: string }> }
) {
  const { trainingStage } = await params;
  const routeConfig =
    RESEARCH_CHAT_ROUTE_REGISTRY[trainingStage as keyof typeof RESEARCH_CHAT_ROUTE_REGISTRY] ?? null;

  console.log("[api/chat/research] incoming", {
    trainingStage,
    resolved: routeConfig?.kind ?? "none",
    referer: request.headers.get("referer") ?? "(none)",
  });

  if (!routeConfig) {
    return NextResponse.json(
      { error: `Unknown research chat training stage: ${trainingStage}` },
      { status: 404 }
    );
  }

  return handleBaseChatRequest(request);
}
