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

/** Carries the status so callers can word the message for people. */
class PlanRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

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
    throw new PlanRequestError(res.status, `Request failed (${res.status})`);
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
    if (err instanceof PlanRequestError) {
      if (err.status === 401 || err.status === 404) return null;
      throw new Error("플랜을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    throw new Error("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
  }
};

const describeSaveFailure = (err: unknown): string => {
  if (!(err instanceof PlanRequestError)) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }
  if (err.status === 401) return "로그인이 만료됐어요. 다시 로그인한 뒤 저장해 주세요.";
  if (err.status === 400) return "입력 내용을 저장할 수 없어요. 표시된 항목을 확인해 주세요.";
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
};

/**
 * Upserts the current user's plan on the server. Do not mirror the full plan in
 * localStorage or other global browser keys — rely on GET /api/my-plan after auth.
 */
export const saveMyPlan = async (
  payload: SavePlanRequestPayload,
): Promise<SavedPlanResponse> => {
  try {
    return await requestJson<SavedPlanResponse>(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new Error(describeSaveFailure(err));
  }
};
