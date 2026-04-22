const UPSTREAM_API_BASE_URL = (
  process.env.GOLFDAY_API_BASE_URL || "http://forekonline-001-site6.rtempurl.com"
).replace(/\/$/, "");

async function proxyRequest(request, { params }) {
  const { path = [] } = await params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`/api/v1/${path.join("/")}`, UPSTREAM_API_BASE_URL);

  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const requestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    const body = await request.arrayBuffer();

    if (body.byteLength > 0) {
      requestInit.body = body;
    }
  }

  try {
    const response = await fetch(upstreamUrl, requestInit);
    const responseHeaders = new Headers(response.headers);

    responseHeaders.delete("content-length");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Failed to proxy Golf Day API request:", upstreamUrl.toString(), error);

    return Response.json(
      {
        message: "Failed to reach the Golf Day API.",
      },
      { status: 502 }
    );
  }
}

export const dynamic = "force-dynamic";

export async function GET(request, context) {
  return proxyRequest(request, context);
}

export async function POST(request, context) {
  return proxyRequest(request, context);
}
