export type SendFunctionOptions = {
  channel: string;
};
export type SendFunction = (
  data: string,
  options?: SendFunctionOptions
) => void;
export type CleanupFunction = () => void;
export type InitFunction = (
  send: SendFunction
) => Promise<CleanupFunction> | CleanupFunction;

export function eventStream(
  request: Request,
  initFn: InitFunction,
  options: ResponseInit = {}
) {
  let headers = new Headers(options.headers);

  if (headers.has("Content-Type")) {
    console.warn("Overriding Content-Type header to `text/event-stream`");
  }

  if (headers.has("Cache-Control")) {
    console.warn("Overriding Cache-Control header to `no-cache`");
  }

  if (headers.has("Connection")) {
    console.warn("Overriding Connection header to `keep-alive`");
  }

  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control", "no-cache");
  headers.set("Connection", "keep-alive");

  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send: SendFunction = (data, options) => {
          controller.enqueue(
            encoder.encode(`event: ${options?.channel ?? "message"}\n`)
          );
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };
        const cleanupFn = await initFn(send);

        let closed = false;
        const close = () => {
          if (closed) return;
          cleanupFn();
          closed = true;
          request.signal.removeEventListener("abort", close);
          controller.close();
        };

        request.signal.addEventListener("abort", close);
        if (request.signal.aborted) {
          close();
        }
      },
    }),
    { headers }
  );
}
