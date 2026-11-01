import { NextResponse } from "next/server";
import OpenAI from "openai";

import { getActiveSessionUser } from "@/features/auth/lib/session-user";
import { buildOdysseyModelAnswers } from "@/features/plan/interview/odyssey-interview.prompt-format";
import type { OdysseyInterviewAnswers } from "@/features/plan/interview/odyssey-interview.types";
import {
  MONTHLY_AI_DRAFT_LIMIT,
  consumeAiDraftQuota,
  getAiDraftMonthKey,
  refundAiDraftQuota,
} from "@/features/plan/lib/ai-draft-quota";
import {
  ODYSSEY_SYSTEM_INSTRUCTIONS,
  buildOdysseyGenerateInput,
} from "@/features/plan/lib/odyssey-generate.prompt";
import { validateOdysseyGenerateResponse } from "@/features/plan/lib/odyssey-generate-response.validation";
import { ODYSSEY_GENERATE_RESPONSE_SCHEMA } from "@/features/plan/lib/odyssey-generate.schema";
import { buildPreparationContext } from "@/features/plan/lib/odyssey-preparation.validation";
import { prisma } from "@/lib/prisma";

/** Three paths take longer to generate than the old single plan. */
export const maxDuration = 120;

/** Upper bound on the formatted answers sent to the model. */
const MAX_MODEL_INPUT_CHARS = 12_000;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isInterviewAnswers(v: unknown): v is OdysseyInterviewAnswers {
  return (
    isRecord(v) &&
    Object.values(v).every(
      (answer) =>
        isRecord(answer) &&
        Array.isArray(answer.choiceIds) &&
        answer.choiceIds.every((id) => typeof id === "string") &&
        (answer.text === undefined || typeof answer.text === "string"),
    )
  );
}

export async function POST(req: Request) {
  const user = await getActiveSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }
  const userId = user.id;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const requestType = "ODYSSEY_DRAFT_GENERATE";
  const writeAiRequestLog = async (
    success: boolean,
    blockedReason?: string,
  ) => {
    try {
      await prisma.aiRequestLog.create({
        data: {
          userId,
          ipAddress,
          requestType,
          success,
          blockedReason: blockedReason ?? null,
        },
      });
    } catch {
      // Logging failure must not break user flow.
    }
  };

  const [aiConfig, userState] = await Promise.all([
    prisma.systemConfig.findUnique({
      where: { key: "AI_DRAFT_ENABLED" },
      select: { value: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { aiBlocked: true },
    }),
  ]);

  if (aiConfig?.value === "false") {
    await writeAiRequestLog(false, "GLOBAL_AI_OFF");
    return NextResponse.json(
      { error: "관리자 설정으로 현재 AI 초안 생성이 일시 중지되었습니다." },
      { status: 503 },
    );
  }
  if (userState?.aiBlocked) {
    await writeAiRequestLog(false, "USER_AI_BLOCKED");
    return NextResponse.json(
      { error: "AI 초안 생성이 제한된 계정입니다." },
      { status: 403 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 OpenAI API 키가 설정되어 있지 않습니다." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 JSON입니다." }, { status: 400 });
  }

  if (!isRecord(body) || !isInterviewAnswers(body.answers)) {
    return NextResponse.json(
      { error: "answers 객체가 필요합니다." },
      { status: 400 },
    );
  }

  const modelAnswers = buildOdysseyModelAnswers(body.answers);
  if (!modelAnswers.length) {
    return NextResponse.json(
      { error: "전송된 답변이 비어 있습니다." },
      { status: 400 },
    );
  }
  const userBlock = JSON.stringify(modelAnswers, null, 2);
  if (userBlock.length > MAX_MODEL_INPUT_CHARS) {
    return NextResponse.json(
      { error: "답변이 너무 깁니다. 내용을 줄여 다시 시도해 주세요." },
      { status: 413 },
    );
  }

  // Monthly quota: user can generate AI draft (OpenAI call) up to N times.
  // Charge happens right before we actually call OpenAI; any failure after that refunds it.
  const monthKey = getAiDraftMonthKey();
  let charged = false;

  const failGeneration = async (reason: string, message: string) => {
    await refundAiDraftQuota(userId, monthKey);
    await writeAiRequestLog(false, reason);
    return NextResponse.json({ error: message }, { status: 502 });
  };

  try {
    const quotaResult = await consumeAiDraftQuota(userId, monthKey);

    if (!quotaResult.allowed) {
      await writeAiRequestLog(false, "QUOTA_EXCEEDED");
      return NextResponse.json(
        {
          error: "이번 달 AI 초안 생성 횟수가 모두 소진되었습니다.",
          limit: MONTHLY_AI_DRAFT_LIMIT,
          used: quotaResult.usedCount,
        },
        { status: 429 },
      );
    }

    charged = true;
    const remaining = quotaResult.remaining;

    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: "gpt-6-luna",
      store: false,
      instructions: ODYSSEY_SYSTEM_INSTRUCTIONS,
      input: buildOdysseyGenerateInput(userBlock),
      text: {
        format: {
          type: "json_schema",
          name: "odyssey_generate_bundle",
          strict: true,
          schema: ODYSSEY_GENERATE_RESPONSE_SCHEMA,
        },
        verbosity: "medium",
      },
    });

    if (response.status === "incomplete") {
      return await failGeneration("MODEL_INCOMPLETE", "응답이 너무 길어 초안을 완성하지 못했습니다.");
    }

    const raw = response.output_text?.trim();
    if (!raw) {
      return await failGeneration("MODEL_EMPTY_RESPONSE", "모델 응답이 비어 있습니다.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return await failGeneration("MODEL_INVALID_JSON", "모델 JSON 파싱에 실패했습니다.");
    }

    const validated = validateOdysseyGenerateResponse(
      parsed,
      new Set(modelAnswers.map((answer) => answer.questionId)),
      buildPreparationContext(body.answers),
    );
    if (!validated.ok) {
      console.error("[odyssey/generate] invalid model response:", validated.reason);
      return await failGeneration("MODEL_INVALID_SCHEMA", "모델 응답 형식이 올바르지 않습니다.");
    }

    await writeAiRequestLog(true);

    return NextResponse.json({
      summary: validated.value.summary,
      planForm: validated.value.planForm,
      remaining,
    });
  } catch (e) {
    if (charged) await refundAiDraftQuota(userId, monthKey);
    await writeAiRequestLog(false, "OPENAI_ERROR");
    console.error("[odyssey/generate]", e);
    return NextResponse.json(
      { error: "AI 초안 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
