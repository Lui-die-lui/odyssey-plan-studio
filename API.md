# Odyssey Plan Studio API

Last updated: 2026-03-23

이 문서는 현재 `app/api/**/route.ts` 구현을 기준으로 정리한 API 명세입니다.

## 1) 인증 방식

- 인증 시스템: `next-auth` (세션 기반)
- 클라이언트는 로그인 후 브라우저 쿠키를 통해 인증됩니다.
- 서버 API는 `getServerSession(authOptions)`로 인증/권한을 검사합니다.
- 관리자 보호:
  - 페이지: `proxy.ts`에서 `/admin/**` 접근 차단
  - API: `requireAdminRequest()`로 `ADMIN` role 확인

권한 요약:

- `USER API`: 로그인한 사용자면 호출 가능
- `ADMIN API`: 로그인 + `role === "ADMIN"` 필요
- `INTERNAL API`: 내부 토큰(`WITHDRAWAL_CLEANUP_SECRET`) 필요

---

## 2) 공통 응답 형식

현재 프로젝트는 엔드포인트별 응답 형태가 일부 다릅니다. 운영 중인 실제 패턴은 아래 3가지입니다.

### A. 일반 성공 데이터

```json
{
  "data": { "...": "..." }
}
```

또는

```json
{
  "summary": { "...": "..." },
  "planForm": { "...": "..." },
  "remaining": 1
}
```

### B. 성공/실패 플래그형

```json
{
  "success": true,
  "data": { "...": "..." }
}
```

또는

```json
{
  "success": false,
  "message": "..."
}
```

### C. 에러형

```json
{
  "error": "..."
}
```

권장(향후 통일안):

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "..."
  }
}
```

---

## 3) 엔드포인트 목록

## User API

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | Public | NextAuth 엔드포인트 |

### Plan / Interview / Account

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/my-plan` | USER | 내 플랜 조회 |
| POST | `/api/my-plan` | USER | 내 플랜 저장(업서트) |
| POST | `/api/odyssey/generate` | USER | AI 초안 생성 (쿼터/차단/로그 반영) |
| GET | `/api/odyssey/quota` | USER | AI 사용 가능 여부/잔여 횟수 조회 |
| POST | `/api/account/withdraw` | USER | 회원 탈퇴 요청(유예 상태 전환) |
| GET | `/api/plans/[planId]/summary-pdf` | USER | PDF 파일 생성/다운로드 |
| GET | `/api/test-openai` | Public* | OpenAI 호출 테스트용 (*운영 비권장) |

## Admin API

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | ADMIN | KPI(오늘/주/월 가입자, AI 요청 수) |
| GET | `/api/admin/trends?granularity=day\|week\|month` | ADMIN | 추이 데이터 |
| GET | `/api/admin/ai-control` | ADMIN | 전역 AI ON/OFF 상태 조회 |
| PATCH | `/api/admin/ai-control` | ADMIN | 전역 AI ON/OFF 변경 |
| GET | `/api/admin/users?limit=50` | ADMIN | 사용자 목록/차단상태 조회 |
| PATCH | `/api/admin/users/[userId]/ai-block` | ADMIN | 사용자 AI 차단 토글 |

## Internal API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/internal/users/withdrawal-cleanup` | Internal token | 유예 만료 계정 하드 삭제 |

---

## 4) 주요 Request / Response 예시

### 4.1 `POST /api/odyssey/generate` (USER)

Request:

```json
{
  "answers": {
    "q1": { "choiceIds": ["..."], "text": "..." }
  }
}
```

Success `200`:

```json
{
  "summary": {
    "headline": "string",
    "sections": [{ "title": "string", "description": "string" }],
    "avoidNotes": ["string"],
    "keywords": ["string"]
  },
  "planForm": {
    "title": "string",
    "years": []
  },
  "remaining": 1
}
```

Failure examples:

- `401` `{ "error": "로그인이 필요합니다." }`
- `403` `{ "error": "AI 초안 생성이 제한된 계정입니다." }`
- `429` `{ "error": "이번 달 AI 초안 생성 횟수가 모두 소진되었습니다.", "limit": 2, "used": 2 }`
- `503` `{ "error": "관리자 설정으로 현재 AI 초안 생성이 일시 중지되었습니다." }`

---

### 4.2 `GET /api/odyssey/quota` (USER)

Success `200`:

```json
{
  "limit": 2,
  "used": 1,
  "remaining": 1,
  "monthKey": "2026-03",
  "canUseGuided": true,
  "blockedReason": null
}
```

`blockedReason` values:

- `GLOBAL_AI_OFF`
- `USER_AI_BLOCKED`
- `QUOTA_EXHAUSTED`
- `null`

---

### 4.3 `GET /api/my-plan` (USER)

Success with data:

```json
{
  "data": {
    "id": "plan_id",
    "title": "My Plan",
    "years": []
  }
}
```

No plan yet:

```json
{
  "data": null
}
```

---

### 4.4 `POST /api/my-plan` (USER)

Request:

```json
{
  "title": "5년 계획",
  "years": [
    {
      "yearIndex": 1,
      "note": "메모",
      "scores": { "resources": 3, "interest": 4, "confidence": 3, "coherence": 4 },
      "goals": ["목표1", "목표2"],
      "keywords": ["키워드1", "키워드2"]
    }
  ]
}
```

Success:

- `201` (최초 생성) 또는 `200` (수정)

```json
{
  "success": true,
  "data": { "...plan..." }
}
```

Validation fail:

```json
{
  "success": false,
  "message": "yearIndex must be 1–5."
}
```

---

### 4.5 `PATCH /api/admin/ai-control` (ADMIN)

Request:

```json
{
  "enabled": false
}
```

Response:

```json
{
  "enabled": false
}
```

---

### 4.6 `PATCH /api/admin/users/[userId]/ai-block` (ADMIN)

Request:

```json
{
  "aiBlocked": true
}
```

Response:

```json
{
  "id": "user_id",
  "aiBlocked": true
}
```

---

### 4.7 `POST /api/internal/users/withdrawal-cleanup` (INTERNAL)

인증:

- 헤더: `x-internal-token: <WITHDRAWAL_CLEANUP_SECRET>`
- 또는 쿼리: `?token=<WITHDRAWAL_CLEANUP_SECRET>`

Response:

```json
{
  "success": true,
  "deletedCount": 3,
  "hardDeleteAtCutoff": "2026-03-23T12:00:00.000Z",
  "msIn7Days": 604800000
}
```

---

## 5) 에러 코드/상태 코드

| HTTP | 대표 원인 | 예시 |
|---|---|---|
| 400 | 요청 형식/JSON/필드 검증 실패 | `Invalid JSON`, `enabled(boolean) is required` |
| 401 | 인증 없음/세션 없음 | `Unauthorized`, `로그인이 필요합니다.` |
| 403 | 권한 부족 또는 사용자 차단 | `Forbidden`, `AI 초안 생성이 제한된 계정입니다.` |
| 404 | 대상 리소스 없음 | `User not found`, `Not found.` |
| 409 | 충돌 상태 | 탈퇴 요청 중복 |
| 429 | 월간 AI 쿼터 소진 | `이번 달 AI 초안 생성 횟수가 모두 소진되었습니다.` |
| 500 | 서버 내부 오류 | 저장/조회/모델 호출 실패 |
| 502 | 모델 응답 파싱/형식 오류 | JSON parse 실패 |
| 503 | 서비스 일시 중지/설정 미비 | OpenAI 키 없음, 전역 AI OFF |

### Admin/권한 관련 메시지

- `Unauthorized` (401)
- `Forbidden` (403)

---

## 6) Admin API / User API 구분 요약

- User API: 사용자 서비스 흐름(플랜 조회/저장, AI 초안, 탈퇴)
- Admin API: 운영 지표/추이/AI 제어/사용자 차단 관리
- Internal API: 배치성 내부 작업(유예 탈퇴 하드 삭제)

권장 운영 정책:

1. `test-openai`는 운영 환경에서 비활성화 또는 관리자 내부망으로 제한
2. 에러 응답 구조 통일(`error.code`, `error.message`)
3. Admin API에 요청 ID/감사로그(actor, target, before/after) 추가

