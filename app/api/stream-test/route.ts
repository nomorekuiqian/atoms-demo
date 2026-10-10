// M0 infrastructure check: can a Route Handler on InsForge Sites stream for
// longer than a full generation (~120s)? Removed in M4.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_SECONDS = 150;
const MAX_SECONDS = 290;

export async function GET(request: Request) {
  const requested = Number(new URL(request.url).searchParams.get("seconds"));
  const seconds = Number.isFinite(requested) && requested > 0
    ? Math.min(Math.floor(requested), MAX_SECONDS)
    : DEFAULT_SECONDS;
  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 1; i <= seconds; i++) {
        if (request.signal.aborted) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ i, elapsed })}\n\n`));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
