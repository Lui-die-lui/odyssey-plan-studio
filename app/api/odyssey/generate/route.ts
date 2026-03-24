import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";

import { authOptions } from "@/features/auth/lib/auth";
import { formatOdysseyAnswersForModel } from "@/features/plan/interview/odyssey-interview.prompt-format";
import type { OdysseyInterviewAnswers } from "@/features/plan/interview/odyssey-interview.types";
import { coerceOdysseyGenerateResponse } from "@/features/plan/lib/odyssey-generate-response.coerce";
import { ODYSSEY_GENERATE_RESPONSE_SCHEMA } from "@/features/plan/lib/odyssey-generate.schema";
import { prisma } from "@/lib/prisma";

type PrismaTransactionCallback = Extract<
  Parameters<typeof prisma.$transaction>[0],
  (...args: never[]) => unknown
>;
type PrismaTransactionClient = PrismaTransactionCallback extends (
  tx: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_INSTRUCTIONS = `당신은 오디세이 플랜 앱의 정리 도우미입니다.
사용자가 인터뷰에서 선택·입력한 내용만 근거로, 한국어로 JSON 스키마에 맞는 결과를 작성합니다.

[summary]
- 제공된 질문/답변에 없는 사실·경험·동기는 만들지 마세요.
- 문단의 호흡이 너무 길지 않도록 조절해주세요.
- 심리 진단, 과장된 확신, "당신은 ~한 사람" 식의 단정은 피하고, 관찰 가능한 경향 수준으로만 씁니다.
- sections는 정확히 3개, 각 title 맨 앞에 주제에 어울리는 이모지 1개.
- avoidNotes·keywords는 답변에 기반해 3~5개.

[planForm]
- title: 인터뷰 답변을 한 줄로 요약한 플랜 제목.
- years: yearIndex 1~5가 각각 정확히 한 번씩 포함되어야 합니다.
- plans: 연도별 목표 문장 배열. 밀도 가이드:
  - 1년차: 비교적 구체적인 행동·목표 중심 (2~5문장 권장).
  - 2~3년차: 1년차와 연결되는 확장·심화 방향.
  - 4~5년차: 달성 상태·방향·균형 등 고수준 표현 위주, 문장 수는 적어도 됨(1~3개).
- categoryScores: resources, interest, confidence, coherence 각각 1~5 정수. 답변 톤과 모순 없게.
- keywords: 연도별 최대 5개, 짧은 한국어.
- note: 해당 연도 메모(짧게). 불필요하면 빈 문자열.

문체는 차분한 인터뷰 후 정리 노트에 가깝게 유지합니다.`;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;
  if (typeof userId !== "string" || !userId.length) {
    return NextResponse.json({ error: "로그인 정보를 확인할 수 없습니다." }, { status: 401 });
  }
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const requestType = "ODYSSEY_DRAFT_GENERATE";
  const prismaDelegate = prisma as unknown as {
    aiRequestLog: {
      create: (args: unknown) => Promise<unknown>;
    };
    systemConfig: {
      findUnique: (args: unknown) => Promise<{ value: string } | null>;
    };
    user: {
      findUnique: (args: unknown) => Promise<{ aiBlocked: boolean } | null>;
    };
  };
  const writeAiRequestLog = async (success: boolean, blockedReason?: string) => {
    try {
      await prismaDelegate.aiRequestLog.create({
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
    prismaDelegate.systemConfig.findUnique({
      where: { key: "AI_DRAFT_ENABLED" },
      select: { value: true },
    }),
    prismaDelegate.user.findUnique({
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
    return NextResponse.json({ error: "AI 초안 생성이 제한된 계정입니다." }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
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

  if (!isRecord(body) || !isRecord(body.answers)) {
    return NextResponse.json({ error: "answers 객체가 필요합니다." }, { status: 400 });
  }

  const answers = body.answers as OdysseyInterviewAnswers;
  const userBlock = formatOdysseyAnswersForModel(answers);
  if (!userBlock.trim()) {
    return NextResponse.json({ error: "전송된 답변이 비어 있습니다." }, { status: 400 });
  }

  // Monthly quota: user can generate AI draft (OpenAI call) up to N times.
  // Charge happens right before we actually call OpenAI.
  const MONTHLY_AI_DRAFT_LIMIT = 2;
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  try {
    const quotaResult = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      // Prisma Client 타입/증분생성 캐시 때문에 `tx.aiDraftUsage`가 IDE에서 누락처럼 보일 수 있어,
      // 필요한 메서드만 시그니처로 좁혀 캐스팅합니다. (런타임 로직은 동일)
      const aiDraftUsage = (tx as unknown as {
        aiDraftUsage: {
          upsert: (args: unknown) => Promise<unknown>;
          updateMany: (args: unknown) => Promise<{ count: number }>;
          findUnique: (args: unknown) => Promise<{ usedCount: number } | null>;
        };
      }).aiDraftUsage;

      await aiDraftUsage.upsert({
        where: { userId_monthKey: { userId, monthKey } },
        create: { userId, monthKey, usedCount: 0 },
        update: {},
      });

      const updated = await aiDraftUsage.updateMany({
        where: {
          userId,
          monthKey,
          usedCount: { lt: MONTHLY_AI_DRAFT_LIMIT },
        },
        data: { usedCount: { increment: 1 } },
      });

      if (updated.count !== 1) {
        const usage = await aiDraftUsage.findUnique({
          where: { userId_monthKey: { userId, monthKey } },
          select: { usedCount: true },
        });
        return {
          allowed: false as const,
          usedCount: usage?.usedCount ?? MONTHLY_AI_DRAFT_LIMIT,
        };
      }

      const usageAfter = await aiDraftUsage.findUnique({
        where: { userId_monthKey: { userId, monthKey } },
        select: { usedCount: true },
      });

      return {
        allowed: true as const,
        usedCountAfter: usageAfter?.usedCount ?? MONTHLY_AI_DRAFT_LIMIT,
        remaining: Math.max(
          0,
          MONTHLY_AI_DRAFT_LIMIT - (usageAfter?.usedCount ?? MONTHLY_AI_DRAFT_LIMIT),
        ),
      };
    });

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

    const remaining = quotaResult.remaining;

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      store: false,
      instructions: SYSTEM_INSTRUCTIONS,
      input: `아래는 사용자의 인터뷰 답변입니다. summary와 planForm을 모두 생성하세요.\n\n${userBlock}`,
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

    const raw = response.output_text?.trim();
    if (!raw) {
      return NextResponse.json({ error: "모델 응답이 비어 있습니다." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "모델 JSON 파싱에 실패했습니다." }, { status: 502 });
    }

    const coerced = coerceOdysseyGenerateResponse(parsed);
    if (!coerced) {
      return NextResponse.json({ error: "모델 응답 형식이 올바르지 않습니다." }, { status: 502 });
    }

    await writeAiRequestLog(true);

    return NextResponse.json({
      summary: coerced.summary,
      planForm: coerced.planForm,
      remaining,
    });
  } catch (e) {
    await writeAiRequestLog(false, "OPENAI_ERROR");
    console.error("[odyssey/generate]", e);
    const message = e instanceof Error ? e.message : "OpenAI 호출에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
