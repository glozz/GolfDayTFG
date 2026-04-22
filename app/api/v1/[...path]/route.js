const UPSTREAM_API_BASE_URL = process.env.GOLFDAY_API_BASE_URL?.replace(/\/$/, "");

async function proxyRequest(request, { params }) {
  const { path = [] } = await params;

  if (!UPSTREAM_API_BASE_URL) {
    return Response.json(
      {
        message: "GOLFDAY_API_BASE_URL environment variable is not configured. Please set it to your Golf Day API backend URL.",
      },
      { status: 500 }
    );
  }

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

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
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
    const requestId = crypto.randomUUID();

    console.error("Failed to proxy Golf Day API request:", {
      requestId,
      method: request.method,
      path,
      error,
    });

    return Response.json(
      {
        message: `Failed to reach the Golf Day API. Request ID: ${requestId}`,
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

export async function PUT(request, context) {
  return proxyRequest(request, context);
}

export async function PATCH(request, context) {
  return proxyRequest(request, context);
}

export async function DELETE(request, context) {
  return proxyRequest(request, context);
}
