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
      ],
      properties: {
        headline: {
          type: "string",
          description: "초안의 방향을 나타내는 차분한 한 줄.",
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
      },
    },
    planForm: {
      type: "object",
      additionalProperties: false,
      required: ["title", "years"],
      properties: {
        title: {
          type: "string",
          description: "5년 플랜 전체를 대표하는 80자 이내의 짧은 제목.",
        },
        years: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          description: "yearIndex 1~5가 각각 정확히 한 번씩.",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "yearIndex",
              "goal",
              "actions",
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
                description: "그 시점에 달라져 있을 상태. 200자 이내.",
              },
              actions: {
                type: "array",
                minItems: 1,
                maxItems: 2,
                items: { type: "string" },
                description: "실행 가능한 핵심 행동 1~2개. 각 200자 이내.",
              },
              checkpoint: {
                type: "string",
                description: "진행 여부를 확인할 산출물·경험·피드백. 300자 이내.",
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
                    description: "답변과 이 계획이 연결되는 이유. 300자 이내.",
                  },
                },
              },
              pivotCondition: {
                type: "string",
                description: "어떤 결과면 이후 계획을 어떻게 바꿀지. 300자 이내.",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                maxItems: 5,
                description: "해당 연도 키워드. 띄어쓰기 없는 7자 이내, 최대 5개.",
              },
            },
          },
        },
      },
    },
  },
};
