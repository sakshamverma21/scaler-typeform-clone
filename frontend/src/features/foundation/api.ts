import { apiRequest } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Probe = components["schemas"]["ProbeResponse"];
type Health = components["schemas"]["HealthResponse"];

export function checkReadiness(signal?: AbortSignal) {
  return apiRequest<Health>("/api/v1/health/ready", { signal });
}
export async function runConnectionCheck() {
  const created = await apiRequest<Probe>("/api/v1/foundation/probe", {
    method: "POST",
  });
  const read = await apiRequest<Probe>("/api/v1/foundation/probe");
  if (created.id !== read.id)
    throw new Error("The browser session could not be verified. Please retry.");
  return read;
}
