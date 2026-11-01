import {
  PLAN_PREPARATION_CATALOG,
  PLAN_PREPARATION_KINDS,
  PLAN_PREPARATION_PRIORITIES,
} from "../constants/plan-preparation.constants";

const evidencedTextSchema = (description: string, questionIdsMinItems: number) => ({
  type: "object",
  additionalProperties: false,
  required: ["text", "questionIds"],
  description,
  properties: {
    text: { type: "string" },
    questionIds: {
      type: "array",
      minItems: questionIdsMinItems,
      maxItems: 6,
      items: { type: "string" },
      description: "입력 JSON에 있는 questionId만 사용.",
    },
  },
});

const yearSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "yearIndex",
    "goal",
    "briefGoal",
    "actions",
    "briefAction",
    "checkpoint",
    "evidence",
    "pivotCondition",
    "keywords",
  ],
  properties: {
    yearIndex: {
      type: "integer",
      minimum: 1,
      maximum: 5,
      description: "오디세이 연차 1~5 (정수).",
    },
    goal: {
      type: "string",
      description: "그 시점에 달라져 있을 상태. 120자 이내.",
    },
    briefGoal: { type: "string", description: "한 장 요약용 목표. 30자 이내의 온전한 구." },
    briefAction: { type: "string", description: "한 장 요약용 대표 행동. 30자 이내의 온전한 구." },
    actions: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: { type: "string" },
      description: "실행 가능한 핵심 행동 1~2개. 각 120자 이내.",
    },
    checkpoint: {
      type: "string",
      description: "진행 여부를 확인할 산출물·경험·피드백. 120자 이내.",
    },
    evidence: {
      type: "object",
      additionalProperties: false,
      required: ["questionIds", "explanation"],
      properties: {
        questionIds: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: { type: "string" },
          description: "입력 JSON에 있는 questionId만 사용.",
        },
        explanation: {
          type: "string",
          description: "답변과 이 계획이 연결되는 이유. 120자 이내.",
        },
      },
    },
    pivotCondition: {
      type: "string",
      description: "어떤 결과면 이후 계획을 어떻게 바꿀지. 120자 이내.",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      maxItems: 2,
      description: "해당 연도 키워드. 띄어쓰기 없는 7자 이내.",
    },
  },
};

const preparationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "catalogId",
    "title",
    "kind",
    "priority",
    "reason",
    "brief",
    "evidence",
    "checkpoint",
    "conditions",
    "alternative",
  ],
  properties: {
    catalogId: {
      type: "string",
      enum: ["", ...PLAN_PREPARATION_CATALOG.map((entry) => entry.id)],
      description: "카탈로그의 자격일 때만 id. 그 외에는 빈 문자열.",
    },
    title: { type: "string", description: "구체적으로 배울 주제, 실습 또는 자격 이름." },
    brief: { type: "string", description: "활용 목적 한 줄. 30자 이내. 예: 작은 챗봇 만들기" },
    kind: { type: "string", enum: [...PLAN_PREPARATION_KINDS] },
    priority: { type: "string", enum: [...PLAN_PREPARATION_PRIORITIES] },
    reason: { type: "string", description: "경로의 어떤 행동이나 목표에 필요한지." },
    evidence: {
      type: "object",
      additionalProperties: false,
      required: ["questionIds", "explanation"],
      properties: {
        questionIds: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: { type: "string" },
        },
        explanation: { type: "string", description: "반영한 답변과 현재 경험." },
      },
    },
    checkpoint: { type: "string", description: "마치면 무엇을 할 수 있어야 하는지." },
    conditions: { type: "string", description: "확인할 사항. 없으면 빈 문자열." },
    alternative: { type: "string", description: "자격 없이 확인하는 방법. 없으면 빈 문자열." },
  },
};

const pathSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "kind",
    "title",
    "overview",
    "tagline",
    "credentialNote",
    "appeal",
    "requirements",
    "openQuestions",
    "experiments",
    "preparations",
    "years",
  ],
  properties: {
    kind: {
      type: "string",
      enum: ["continue", "alternative", "unbound"],
      description: "세 경로 중 하나. 각각 정확히 한 번씩.",
    },
    title: { type: "string", description: "수정 가능한 짧은 경로 제목. 40자 이내." },
    overview: { type: "string", description: "어떤 삶인지 2문장 이내 개요." },
    tagline: { type: "string", description: "경로를 설명하는 한 줄. 40자 이내." },
    credentialNote: {
      type: "string",
      description: "자격을 추천하지 않을 때 이유 또는 필요한 정보. 추천했다면 빈 문자열. 40자 이내.",
    },
    appeal: evidencedTextSchema("이 경로가 끌릴 수 있는 이유와 입력 근거.", 1),
    requirements: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: { type: "string" },
      description: "필요한 주요 자원과 조건.",
    },
    openQuestions: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" },
      description: "아직 확인하지 못한 핵심 질문.",
    },
    experiments: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      description: "큰 결정 전에 이 삶의 일부를 경험해 보는 작은 행동.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action", "learning"],
        properties: {
          action: { type: "string", description: "할 일." },
          learning: { type: "string", description: "무엇을 확인할지." },
        },
      },
    },
    preparations: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      description: "이 경로의 준비 항목. 공통 항목과 합쳐 최대 3개. 없으면 빈 배열.",
      items: preparationSchema,
    },
    years: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      description: "yearIndex 1~5가 각각 정확히 한 번씩.",
      items: yearSchema,
    },
  },
};

/**
 * POST /api/odyssey/generate — Responses API `json_schema.strict` 용 루트 스키마
 */
export const ODYSSEY_GENERATE_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "planForm"],
  properties: {
    summary: {
      type: "object",
      additionalProperties: false,
      required: [
        "headline",
        "summary",
        "facts",
        "interpretations",
        "missingInfo",
        "avoidNotes",
        "keywords",
        "differenceNote",
      ],
      properties: {
        headline: {
          type: "string",
          description: "세 경로를 함께 보여주는 차분한 한 줄.",
        },
        summary: {
          type: "string",
          description: "짧은 안내 문단(2~3문장 이내). 답변에 근거한 내용만.",
        },
        facts: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          description: "사용자가 실제로 선택하거나 입력한 내용.",
          items: evidencedTextSchema("사용자가 말한 사실 한 문장.", 1),
        },
        interpretations: {
          type: "array",
          minItems: 0,
          maxItems: 3,
          description: "여러 답변을 연결한 제한적 판단. 근거가 부족하면 빈 배열.",
          items: evidencedTextSchema("단정하지 않는 해석 한 문장.", 2),
        },
        missingInfo: {
          type: "array",
          minItems: 0,
          maxItems: 4,
          items: { type: "string" },
          description: "계획을 구체화하려면 먼저 확인할 정보. 없으면 빈 배열.",
        },
        avoidNotes: {
          type: "array",
          minItems: 0,
          maxItems: 5,
          description: "답변에서 실제로 확인한 피하고 싶은 방향만. 없으면 빈 배열.",
          items: evidencedTextSchema("피하고 싶은 방향 한 문장.", 1),
        },
        keywords: {
          type: "array",
          minItems: 0,
          maxItems: 5,
          items: { type: "string" },
          description: "답변에서 확인한 짧은 한국어 키워드. 없으면 빈 배열.",
        },
        differenceNote: {
          type: "string",
          description: "세 경로의 차이를 충분히 만들 정보가 없을 때 그 한계. 없으면 빈 문자열.",
        },
      },
    },
    planForm: {
      type: "object",
      additionalProperties: false,
      required: ["title", "paths", "sharedPreparations"],
      properties: {
        title: {
          type: "string",
          description: "세 경로 전체를 대표하는 80자 이내의 짧은 제목.",
        },
        sharedPreparations: {
          type: "array",
          minItems: 0,
          maxItems: 2,
          description: "여러 경로에 도움이 되는 준비. 없으면 빈 배열.",
          items: preparationSchema,
        },
        paths: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          description: "continue, alternative, unbound 경로를 각각 정확히 한 번씩.",
          items: pathSchema,
        },
      },
    },
  },
};
