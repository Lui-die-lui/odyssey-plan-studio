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
      required: ["headline", "summary", "sections", "avoidNotes", "keywords"],
      properties: {
        headline: {
          type: "string",
          description:
            "카드 상단에 들어갈 한 줄 요약. 차분하고 구체적으로. (예: 방향을 제시하는 문장)",
        },
        summary: {
          type: "string",
          description:
            "페이지 부제 수준의 짧은 안내 문단(2~3문장 이내). 답변에 근거한 사실 위주.",
        },
        sections: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          description:
            "정확히 3개. 각 title 앞에 주제에 맞는 단일 이모지 하나를 붙일 것 (예: '🤝 …').",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["title", "description"],
          },
        },
        avoidNotes: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: { type: "string" },
          description: "피하고 싶은 방향 bullet. 답변에 나온 내용만 바탕으로 3~5개.",
        },
        keywords: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: { type: "string" },
          description: "짧은 한국어 키워드 3~5개.",
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
          description: "5년 플랜 전체를 대표하는 짧은 제목(한 줄).",
        },
        years: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          description:
            "yearIndex 1~5가 각각 정확히 한 번씩. 1년차는 구체적 실행 목표 위주, 2~3년차는 확장·연결, 4~5년차는 상태·방향 중심으로 plans 밀도를 달리 할 것.",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "yearIndex",
              "plans",
              "categoryScores",
              "keywords",
              "note",
            ],
            properties: {
              yearIndex: {
                type: "integer",
                minimum: 1,
                maximum: 5,
                description: "오디세이 연차 1~5 (정수).",
              },
              plans: {
                type: "array",
                items: { type: "string" },
                maxItems: 5,
                description:
                  "해당 연도 목표 문장. 1년차는 2~5개 권장, 후반부는 1~3개 짧게도 가능.",
              },
              categoryScores: {
                type: "object",
                additionalProperties: false,
                required: ["resources", "interest", "confidence", "coherence"],
                properties: {
                  resources: { type: "integer", minimum: 1, maximum: 5 },
                  interest: { type: "integer", minimum: 1, maximum: 5 },
                  confidence: { type: "integer", minimum: 1, maximum: 5 },
                  coherence: { type: "integer", minimum: 1, maximum: 5 },
                },
                description:
                  "자원·흥미·자신감·일관성 거리감 1~5. 답변과 논리적으로 맞출 것.",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                maxItems: 5,
                description: "해당 연도 키워드 최대 5개.",
              },
              note: {
                type: "string",
                description:
                  "그 해 메모(짧게). 거리 점수에 대한 한 줄 맥락 등. 없으면 빈 문자열.",
              },
            },
          },
        },
      },
    },
  },
};
