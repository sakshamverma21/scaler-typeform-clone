import { apiRequest } from "./client";
import type { components } from "./schema";

type Schemas = components["schemas"];
export type FormDetail = Schemas["FormDetail"];
export type FormMetadata = Schemas["FormMetadata"];
export type DraftDefinition = Schemas["DraftDefinition"];
export type SubmitResponse = Schemas["SubmitResponse"];

type PageOptions = { limit?: number; cursor?: string; version_id?: string };
const formPath = (id: string): `/api/v1/${string}` =>
  `/api/v1/creator/forms/${encodeURIComponent(id)}`;

function query(options: PageOptions = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

function mutation(
  method: string,
  body?: unknown,
  revision?: number,
): RequestInit {
  const headers: Record<string, string> = {};
  if (revision !== undefined) headers["If-Match"] = `"${revision}"`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

// Framework-independent contracts for the next UI phases. No automatic write retries:
// draft/submission callers retain and reuse their own mutation/submission identifiers.
export const creatorApi = {
  session: () =>
    apiRequest<Schemas["SessionInfo"]>("/api/v1/creator/session", {
      ...mutation("POST"),
      signal: AbortSignal.timeout(90_000),
    }),
  forms: (options?: PageOptions) =>
    apiRequest<Schemas["FormList"]>(`/api/v1/creator/forms${query(options)}`),
  form: (id: string) => apiRequest<FormDetail>(formPath(id)),
  create: (body: Schemas["CreateForm"]) =>
    apiRequest<FormDetail>("/api/v1/creator/forms", mutation("POST", body)),
  rename: (id: string, title: string, revision: number) =>
    apiRequest<FormDetail>(
      formPath(id),
      mutation("PATCH", { title }, revision),
    ),
  save: (id: string, body: Schemas["SaveDraft"], revision: number) =>
    apiRequest<FormDetail>(
      `${formPath(id)}/draft`,
      mutation("PUT", body, revision),
    ),
  duplicate: (id: string, revision: number) =>
    apiRequest<FormDetail>(
      `${formPath(id)}/duplicate`,
      mutation("POST", undefined, revision),
    ),
  delete: (id: string) =>
    apiRequest<Schemas["OperationResult"]>(formPath(id), mutation("DELETE")),
  publish: (id: string, revision: number) =>
    apiRequest<FormMetadata>(
      `${formPath(id)}/publish`,
      mutation("POST", undefined, revision),
    ),
  unpublish: (id: string) =>
    apiRequest<FormMetadata>(`${formPath(id)}/unpublish`, mutation("POST")),
  versions: (id: string, options?: PageOptions) =>
    apiRequest<Schemas["VersionList"]>(
      `${formPath(id)}/versions${query(options)}`,
    ),
  responses: (id: string, options?: PageOptions) =>
    apiRequest<Schemas["ResponseList"]>(
      `${formPath(id)}/responses${query(options)}`,
    ),
  response: (id: string, responseId: string) =>
    apiRequest<Schemas["ResponseDetail"]>(
      `${formPath(id)}/responses/${encodeURIComponent(responseId)}`,
    ),
  summary: (id: string, versionId?: string) =>
    apiRequest<Schemas["FormSummary"]>(
      `${formPath(id)}/summary${query({ version_id: versionId })}`,
    ),
};

export const publicApi = {
  form: (slug: string) =>
    apiRequest<Schemas["PublicForm"]>(
      `/api/v1/public/forms/${encodeURIComponent(slug)}`,
      { signal: AbortSignal.timeout(90_000) },
    ),
  submit: (slug: string, body: SubmitResponse) =>
    apiRequest<Schemas["SubmissionReceipt"]>(
      `/api/v1/public/forms/${encodeURIComponent(slug)}/responses`,
      mutation("POST", body),
    ),
};
