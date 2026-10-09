export interface ApiFieldError {
  message: string;
  question_key?: string;
  field?: string | (string | number)[];
}

function fieldErrors(value: unknown): ApiFieldError[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ApiFieldError => {
    if (!item || typeof item !== "object" || typeof item.message !== "string")
      return false;
    return (
      (item.question_key === undefined ||
        typeof item.question_key === "string") &&
      (item.field === undefined ||
        typeof item.field === "string" ||
        (Array.isArray(item.field) &&
          item.field.every(
            (part: unknown) =>
              typeof part === "string" || typeof part === "number",
          )))
    );
  });
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: `/api/v1/${string}`,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(15_000),
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      "connection_failed",
      "We couldn’t connect. Please try again.",
    );
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    throw new ApiError(
      response.status,
      typeof error.code === "string" ? error.code : "request_failed",
      typeof error.message === "string"
        ? error.message
        : "Something went wrong. Please try again.",
      fieldErrors(error.errors),
    );
  }
  if (body === null)
    throw new ApiError(
      502,
      "invalid_response",
      "The service returned an unexpected response.",
    );
  return body as T;
}
