import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { createReadableStreamFromReadable } from "@remix-run/node";
import type { EntryContext } from "@remix-run/node";
import { addDocumentResponseHeaders } from "./shopify.server";

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  addDocumentResponseHeaders(request, responseHeaders);

  const { pipe, abort } = renderToPipeableStream(
    <RemixServer
      context={remixContext}
      url={request.url}
      abortDelay={ABORT_DELAY}
    />,
    {
      onShellReady() {
        responseHeaders.set("Content-Type", "text/html");
        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);
        pipe(body);
        return new Response(stream, {
          headers: responseHeaders,
          status: responseStatusCode,
        });
      },
      onShellError(error: unknown) {
        throw error;
      },
    }
  );

  setTimeout(abort, ABORT_DELAY);
}
