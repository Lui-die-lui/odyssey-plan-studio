import type { SavedPlanResponse, SavePlanRequestPayload } from "../types/plan.types";

const API_PATH = "/api/my-plan";

const safeReadJson = async (res: Response): Promise<unknown> => {
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) return undefined;
  return res.json();
};

const extractResponseData = (json: unknown): unknown => {
  if (json && typeof json === "object") {
    const maybeObj = json as Record<string, unknown>;
    if (maybeObj.data !== undefined) return maybeObj.data;
    if (maybeObj.result !== undefined) return maybeObj.result;
  }
  return json;
};

const requestJson = async <T>(
  path: string,
  init: RequestInit,
): Promise<T> => {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await safeReadJson(res);
    const message =
      typeof json === "object" &&
      json !== null &&
      "message" in json &&
      typeof (json as Record<string, unknown>).message === "string"
        ? ((json as Record<string, unknown>).message as string)
        : undefined;

    throw new Error(
      `Request failed (${res.status} ${res.statusText})${
        message ? `: ${message}` : ""
      }`,
    );
  }

  const json = await safeReadJson(res);
  return extractResponseData(json) as T;
};

export const getMyPlan = async (): Promise<SavedPlanResponse | null> => {
  try {
    return await requestJson<SavedPlanResponse | null>(API_PATH, {
      method: "GET",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("(401")) return null;
    if (message.includes("(404")) return null;
    throw err;
  }
};

/**
 * Upserts the current user's plan on the server. Do not mirror the full plan in
 * localStorage or other global browser keys — rely on GET /api/my-plan after auth.
 */
export const saveMyPlan = async (
  payload: SavePlanRequestPayload,
): Promise<SavedPlanResponse> => {
  return await requestJson<SavedPlanResponse>(API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};
