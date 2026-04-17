export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : null),
      ...(init.headers || {}),
    },
  });

  const data = await safeJson(res);

  if (res.status === 401) {
    // Session expired or not logged in.
    // Keep behavior consistent across the app.
    window.location.href = "/";
    throw new ApiError("Unauthorized", 401, data);
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in (data as any) && (data as any).error) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(String(msg), res.status, data);
  }

  return data as T;
}

