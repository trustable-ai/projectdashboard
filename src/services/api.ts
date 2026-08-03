// Base HTTP helper for calling public OpenServerless actions.
//
// Frontend code always uses relative "/api/my/<package>/<action>" URLs so the
// browser keeps its current origin and the managed Vite proxy forwards the
// request to the right OpenServerless host.
//
// This helper is intentionally minimal today. It normalizes the response shape
// returned by Trustable-generated Python wrappers, which may nest the module
// payload inside a top-level "body" field.

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    const raw = await response.json().catch(() => undefined);
    const payload =
      raw && typeof raw === "object" && "body" in raw ? raw.body : raw;

    if (!response.ok || payload?.ok === false || payload?.error) {
      return {
        ok: false,
        error: payload?.error || `Request failed: ${response.status}`,
      };
    }

    return { ok: true, data: payload as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}