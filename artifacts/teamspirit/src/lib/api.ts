export const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message?: string) {
    super(message ?? `API ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function api<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });
  let body: any = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!res.ok) {
    // Instead of throwing immediately for 400s with an expected error message, 
    // we can return the error object so the UI can handle it gracefully.
    if (res.status === 400 && body?.error) {
      throw new ApiError(res.status, body, body.error);
    }
    if (res.status === 403 && body?.error) {
      throw new ApiError(res.status, body, body.error);
    }
    throw new ApiError(res.status, body, body?.error ?? `API ${res.status}`);
  }
  return body as T;
}
