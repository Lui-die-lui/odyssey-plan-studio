# 전체 기능 맵
- 인증/사용자 관리
- 온보딩/플랜 작성 진입
- 오디세이 플랜 작성(수동)
- 오디세이 플랜 작성(AI 가이드)
- 플랜 조회/요약/내 페이지
- PDF 다운로드/출력
- 관리자(Admin) 운영 기능
- 계정 탈퇴/내부 정리 배치
- 공통 UI/레이아웃/상태 관리
- 운영 기능(배포/환경설정/DB/OAuth)

---

# 기능 상세

## 인증/사용자 관리

### 소셜 로그인 버튼 렌더링 및 로그인 시작
- 설명: 로그인 화면에서 Google/Kakao 로그인 버튼을 렌더링하고 NextAuth `signIn`을 호출한다.
- 사용자 역할: 사용자는 로그인 방법을 선택하고 인증 플로우를 시작한다.
- 관련 파일:
  - `features/auth/components/LoginScreen.tsx`: 콜백 URL 정리, 화면 레이아웃, 버튼 조합.
  - `features/auth/components/SocialLoginButtons.tsx`: provider별 버튼 렌더링/클릭 처리.
  - `features/auth/lib/login-href.ts`: 로그인 진입 URL 생성 유틸.
  - `app/login/page.tsx`: Suspense 래퍼 및 로딩 fallback.
- 데이터 흐름: 사용자 클릭 -> `signIn(provider)` -> NextAuth 엔드포인트.
- 연관 기능: OAuth callback 처리, 세션 주입, 플랜/관리자 접근 가드.
- 구현 상태: 완료
- 비고: Provider env가 없으면 해당 버튼/Provider는 비활성(또는 미노출)된다.

### NextAuth Provider 설정 및 OAuth callback 처리
- 설명: Google/Kakao provider 등록, JWT/세션 콜백, DB 사용자 upsert를 처리한다.
- 사용자 역할: 최초 로그인 시 자동 가입, 재로그인 시 세션 복구.
- 관련 파일:
  - `features/auth/lib/auth.ts`: `authOptions`(providers, callbacks, secret) 핵심.
  - `app/api/auth/[...nextauth]/route.ts`: NextAuth GET/POST 핸들러.
  - `types/next-auth.d.ts`: `session.user.id/role` 타입 확장.
- 데이터 흐름: OAuth provider callback -> `signIn` 검사 -> `jwt`에서 `User` upsert/lastLoginAt 갱신 -> `session`에 user id/role 주입.
- 연관 기능: Admin 권한 검사, 플랜 CRUD API 인증, 탈퇴 상태 차단.
- 구현 상태: 완료
- 비고: `PENDING_DELETION` 사용자는 `signIn` 단계에서 차단된다.

### 로그인 완료 라우트(returnTo 정리) 및 역할별 리다이렉트
- 설명: 인증 완료 후 안전한 경로로 이동시키고, ADMIN은 대시보드로 우선 라우팅한다.
- 사용자 역할: 로그인 직후 올바른 화면으로 자동 이동.
- 관련 파일:
  - `app/auth/complete/page.tsx`: `returnTo` sanitize + role 기반 `router.replace`.
- 데이터 흐름: 세션 authenticated 감지 -> role 확인 -> `/admin/dashboard` 또는 `returnTo`.
- 연관 기능: 로그인 시작, 관리자 기능.
- 구현 상태: 완료
- 비고: `returnTo`는 상대경로/길이 제한으로 안전하게 정제된다.

### 클라이언트/서버 접근 제어(Plan/Admin)
- 설명: 플랜 작성 화면은 로그인 필수, admin 영역은 ADMIN 역할 필수로 제어한다.
- 사용자 역할: 권한 없는 화면 접근 시 로그인 또는 홈으로 리다이렉트.
- 관련 파일:
  - `features/auth/components/RequireAuthForPlan.tsx`: plan 계열 클라이언트 가드.
  - `proxy.ts`: `/admin/*` 미들웨어 수준 토큰 role 검사.
  - `app/admin/layout.tsx`: 서버 세션 기반 admin 렌더 가드.
  - `features/admin/lib/admin-guard.ts`: admin API 공통 가드.
- 데이터 흐름: 경로 진입 -> 토큰/세션/role 검증 -> 허용 또는 redirect/401/403.
- 연관 기능: 모든 plan/admin 페이지 및 admin API.
- 구현 상태: 완료
- 비고: 클라이언트/미들웨어/서버/API 4단계로 중복 방어를 구성했다.

---

## 온보딩/플랜 작성 진입

### 랜딩 CTA 및 기존 플랜 덮어쓰기 방지
- 설명: 메인 `/`에서 CREATE CTA를 제공하고, 기존 플랜이 있으면 확인 모달을 띄운다.
- 사용자 역할: 새 플랜 시작 전 기존 데이터 덮어쓰기 여부를 명확히 선택.
- 관련 파일:
  - `app/page.tsx`: CTA 분기/관리자 리다이렉트/모달 트리거.
  - `features/plan/components/ExistingPlanConfirmModal.tsx`: 덮어쓰기 확인 모달.
  - `features/plan/constants/plan.constants.ts`: replace query 상수.
  - `features/plan/hooks/useMyPlan.ts`: 기존 플랜 존재 여부 조회.
- 데이터 흐름: session/plan 로드 -> CTA 분기 -> 필요 시 replace 확인 -> `/plan/new?replace=1`.
- 연관 기능: `/plan/new`, `NewPlanReplaceGate`.
- 구현 상태: 완료
- 비고: CTA 로딩 상태는 disabled 버튼으로 처리됨.

### 시작 방식 선택(수동/AI) + AI 사용 가능 상태 사전 확인
- 설명: `/plan/new`에서 수동/AI 시작 카드를 보여주고 AI 사용 가능 여부를 사전 판별한다.
- 사용자 역할: 시작 단계에서 가능한 선택지만 클릭 가능.
- 관련 파일:
  - `app/plan/new/page.tsx`: 화면 셸/헤더/게이트 결합.
  - `features/plan/components/PlanCreateStartScreen.tsx`: 옵션 카드 + quota 상태 표시/차단.
  - `app/api/odyssey/quota/route.ts`: 월간 잔여/차단 사유 반환.
- 데이터 흐름: 페이지 진입 -> `/api/odyssey/quota` -> `GLOBAL_AI_OFF | USER_AI_BLOCKED | QUOTA_EXHAUSTED` 판정 -> 카드 비활성.
- 연관 기능: AI 인터뷰, admin AI 제어.
- 구현 상태: 완료
- 비고: 로딩 중 잠깐 활성화되던 UX를 막기 위해 quota 확인 전에는 guided를 잠금 처리.

### 새 플랜 진입 시 기존 플랜 replacement 가드
- 설명: `/plan/new*` 진입 시 기존 플랜이 있으면 사용자 확인 전 편집 UI를 숨긴다.
- 사용자 역할: 실수로 기존 플랜을 덮어쓰지 않게 보호.
- 관련 파일:
  - `features/plan/components/NewPlanReplaceGate.tsx`: replace 쿼리 확인 + 모달 호출 + 로딩 스켈레톤.
- 데이터 흐름: `useMyPlan` 조회 -> existing plan + 미확인 상태면 모달 -> 확인 후 쿼리 부여.
- 연관 기능: 랜딩 CTA, 수동/AI 시작 페이지.
- 구현 상태: 완료
- 비고: 게이트 로딩도 스켈레톤 UI로 통일됨.

---

## 오디세이 플랜 작성(수동)

### 플랜 폼 렌더링(타이틀/연차/목표/키워드/거리 점수)
- 설명: 5개 연차(yearIndex 1~5) 기준 폼을 제공하고 입력/정렬/검증 가능한 UI를 제공한다.
- 사용자 역할: 구조화된 형태로 계획을 입력/수정.
- 관련 파일:
  - `features/plan/components/PlanForm.tsx`: 폼 조합 엔트리.
  - `features/plan/components/PlanYearGoalsField.tsx`: 목표 리스트 편집 + DnD 재정렬.
  - `features/plan/components/PlanDistanceScale.tsx`: 1~5 점수 UI.
  - `features/plan/components/editor/PlanEditorYearTabs.tsx`: 연차 탭.
  - `features/plan/components/editor/PlanEditorActions.tsx`: 저장/초기화 액션.
  - `features/plan/components/editor/PlanEditorPageHeader.tsx`: 헤더/설명.
  - `features/plan/components/editor/PlanEditorLayout.tsx`: 레이아웃 셸.
- 데이터 흐름: 폼 입력 -> hook 상태 업데이트 -> submit 시 payload mapper로 전송.
- 연관 기능: `usePlanEditor`, `/api/my-plan`.
- 구현 상태: 완료
- 비고: 목표/키워드 개수/길이 제한은 서버 검증과 함께 적용된다.

### 폼 상태 관리/검증 로직
- 설명: 수동 편집의 모든 입력 이벤트, validation, 정렬/삭제/초기화 상태를 관리한다.
- 사용자 역할: 안정적인 편집 경험(입력 즉시 반영, 에러 최소화).
- 관련 파일:
  - `features/plan/hooks/usePlanEditor.ts`: 폼 상태 중심 훅.
  - `features/plan/lib/plan.validation.ts`: validation 규칙.
  - `features/plan/lib/plan.mapper.ts`: form <-> API payload 매핑.
  - `features/plan/lib/plan-goal-id.ts`: goal line id 생성 보조.
- 데이터 흐름: UI 이벤트 -> hook reducer/update -> validation -> submit payload.
- 연관 기능: `/plan/new/manual`, `/plan/edit`, `/api/my-plan`.
- 구현 상태: 완료
- 비고: 임시저장(localStorage 기반)은 구현되지 않았고 서버 저장 중심이다.

### 수동 작성 화면(신규/수정) 및 저장 처리
- 설명: 신규(`/plan/new/manual`)와 수정(`/plan/edit`)에서 같은 폼 계열을 사용해 저장한다.
- 사용자 역할: 새 플랜 생성 또는 기존 플랜 업데이트.
- 관련 파일:
  - `app/plan/new/manual/page.tsx`: 신규 작성 + AI draft 세션 bootstrap.
  - `app/plan/edit/page.tsx`: 기존 플랜 로드 후 수정.
  - `features/plan/lib/plan.service.ts`: `/api/my-plan` 호출 래퍼.
  - `features/plan/hooks/useMyPlan.ts`: 현재 사용자 플랜 조회.
- 데이터 흐름: 화면 진입 -> `useMyPlan` 로드 -> 폼 편집 -> `saveMyPlan` POST -> `/my-plan` 이동.
- 연관 기능: AI draft handoff, PlanSummary.
- 구현 상태: 완료
- 비고: AI에서 넘어온 draft는 DB 임시저장이 아니라 sessionStorage handoff 방식.

---

## 오디세이 플랜 작성(AI 가이드)

### 인터뷰 질문/답변 흐름 관리
- 설명: 질문 분기, 답변 검증, AI 후속 질문 연출, 완료 단계 전환을 관리한다.
- 사용자 역할: 대화형 입력으로 계획 초안 재료를 빠르게 작성.
- 관련 파일:
  - `features/plan/interview/useOdysseyInterview.ts`: 인터뷰 상태 훅(메시지/질문/답변/락 포함).
  - `features/plan/interview/odyssey-interview.flow.ts`: 질문 플로우 정의.
  - `features/plan/interview/odyssey-interview.logic.ts`: 다음 질문/답변 파싱/검증.
  - `features/plan/interview/odyssey-interview.types.ts`: 타입 계약.
  - `features/plan/interview/odyssey-interview.timing.ts`: 타이밍 상수.
- 데이터 흐름: 답변 제출 -> 로직에서 next question 계산 -> 메시지 큐 업데이트.
- 연관 기능: 인터뷰 채팅 UI, AI 초안 생성 API.
- 구현 상태: 부분 구현
- 비고: `odyssey-interview.flow.ts`에 더미 플로우 코멘트가 있어 고도화 여지가 있다.

### 인터뷰 채팅 UI 및 생성/요약 전환
- 설명: 채팅 화면, 생성중 상태, 생성 완료 요약 뷰를 단일 컴포넌트에서 phase로 제어한다.
- 사용자 역할: 입력 -> 초안 생성 -> 요약 확인 -> 수동편집 이동을 한 흐름으로 경험.
- 관련 파일:
  - `features/plan/components/odyssey-interview/OdysseyInterviewChat.tsx`: phase 전환/생성 호출/뒤로가기 가드.
  - `features/plan/components/odyssey-interview/InterviewChatThread.tsx`: 메시지 스레드 표시.
  - `features/plan/components/odyssey-interview/InterviewComposer.tsx`: 답변 선택/제출/생성 버튼.
  - `features/plan/components/odyssey-interview/OdysseyDraftSummaryView.tsx`: 초안 요약 표시.
  - `app/plan/new/ai/page.tsx`: 페이지 진입점.
- 데이터 흐름: 인터뷰 답변 -> `/api/odyssey/generate` -> summary/planForm 수신 -> summary phase.
- 연관 기능: quota API, AI draft 세션 저장, manual page bootstrap.
- 구현 상태: 완료
- 비고: summary 단계에서 브라우저 뒤로가기는 `/plan/new`로 강제 라우팅한다.

### AI 초안 생성 API(OpenAI + 스키마 강제 + 사용량 차감)
- 설명: 인터뷰 답변을 OpenAI에 보내고 강한 JSON schema로 결과를 받아 planForm/summary를 생성한다.
- 사용자 역할: 클릭 1회로 수동 편집 가능한 초안 획득.
- 관련 파일:
  - `app/api/odyssey/generate/route.ts`: 생성 API 본체(인증/차단/quota/로깅/OpenAI).
  - `features/plan/interview/odyssey-interview.prompt-format.ts`: 모델 입력 텍스트 구성.
  - `features/plan/lib/odyssey-generate.schema.ts`: 응답 스키마.
  - `features/plan/lib/odyssey-generate-response.coerce.ts`: 응답 강제 파싱.
- 데이터 흐름: 요청 -> auth/user/block/quota 검사 -> OpenAI call -> 응답 파싱 -> 성공/실패 로깅.
- 연관 기능: quota 조회, admin AI 제어, AI 요청 통계.
- 구현 상태: 완료
- 비고: 모델은 `gpt-5.4-mini` 사용, 월간 quota는 서버 트랜잭션에서 차감.

### AI 초안 임시 저장(브리지) 및 수동편집 전환
- 설명: 생성된 planForm을 sessionStorage에 저장한 뒤 수동 작성 화면에서 초기값으로 불러온다.
- 사용자 역할: AI 결과를 잃지 않고 수동 편집으로 자연스럽게 전환.
- 관련 파일:
  - `features/plan/lib/odyssey-ai-draft-session.ts`: sessionStorage read/write/clear.
  - `features/plan/lib/odyssey-ai-plan-draft.mapper.ts`: AI draft -> manual form 매핑.
  - `app/plan/new/manual/page.tsx`: bootstrap 후 즉시 clear 처리.
- 데이터 흐름: summary에서 저장 -> manual 진입 시 읽기 -> form seed -> 세션값 제거.
- 연관 기능: AI 인터뷰, manual form.
- 구현 상태: 완료
- 비고: DB 임시저장은 없음(브라우저 세션 기반 임시 저장).

---

## 플랜 조회/요약/내 페이지

### 내 플랜 조회 및 요약 렌더
- 설명: `/my-plan`에서 저장된 플랜과 연차별 요약, 점수 요약 정보를 보여준다.
- 사용자 역할: 현재 플랜 상태 확인, 수정/다운로드/탈퇴 액션 진입.
- 관련 파일:
  - `app/my-plan/page.tsx`: 조회 화면 + 액션 버튼들.
  - `features/plan/components/PlanSummary.tsx`: 요약 카드/모바일 캐러셀 렌더.
  - `features/plan/lib/plan-summary-stats.ts`: 통계 계산.
  - `features/plan/hooks/useMyPlan.ts`: 데이터 로딩.
- 데이터 흐름: `/api/my-plan GET` -> 응답 데이터를 Summary 컴포넌트로 전달.
- 연관 기능: 수정 페이지, PDF 다운로드, 계정 탈퇴.
- 구현 상태: 완료
- 비고: 조회 실패 시 retry 버튼 제공.

### 플랜 데이터 조회/저장 API(서버)
- 설명: 현재 사용자 기준으로 플랜을 조회하고, 저장 시 5개 연차 전체를 검증/업데이트한다.
- 사용자 역할: 저장/조회의 일관성 보장(필수 연차 누락, 길이/개수 제한 방지).
- 관련 파일:
  - `app/api/my-plan/route.ts`: GET/POST + 서버 검증 + transaction.
  - `features/plan/lib/plan-db.server.ts`: DB include/query + response mapping.
  - `features/plan/types/plan.types.ts`: API 요청/응답 타입.
  - `features/plan/constants/plan.constants.ts`: 점수/텍스트/개수 제한 상수.
- 데이터 흐름: 인증 세션 -> body 검증 -> create 또는 replace update -> normalized response 반환.
- 연관 기능: manual/edit page, summary page.
- 구현 상태: 완료
- 비고: POST는 기존 연차 데이터를 삭제 후 재생성하는 replace 전략이다.

---

## PDF 다운로드/출력

### PDF 다운로드 API
- 설명: 사용자가 자신의 플랜 PDF를 다운로드할 수 있도록 서버에서 PDF 바이너리를 생성해 반환한다.
- 사용자 역할: 플랜 결과물 공유/보관.
- 관련 파일:
  - `app/api/plans/[planId]/summary-pdf/route.ts`: 소유권 검증 + PDF 응답.
  - `features/plan/lib/request-origin.server.ts`: 절대 URL 계산.
  - `features/plan/lib/plan-db.server.ts`: plan ownership 확인.
- 데이터 흐름: `/my-plan` 버튼 클릭 -> API -> print URL 기반 렌더 -> PDF stream 다운로드.
- 연관 기능: Printable PDF page, Puppeteer 렌더러.
- 구현 상태: 완료
- 비고: Node runtime 고정, maxDuration 60초 설정.

### Printable 문서 렌더 및 Puppeteer 캡처
- 설명: 인쇄 전용 페이지를 렌더하고 Puppeteer로 A4 landscape 한 장에 맞춰 캡처한다.
- 사용자 역할: 화면과 유사한 형태의 정돈된 PDF 획득.
- 관련 파일:
  - `app/plans/[planId]/summary/pdf/page.tsx`: 출력 전용 문서 페이지.
  - `features/plan/components/PlanSummaryPdfDocument.tsx`: PDF 레이아웃.
  - `features/plan/lib/render-plan-summary-pdf.server.ts`: scale 계산/페이지 캡처.
  - `features/plan/lib/puppeteer-browser.ts`: 실행환경별 브라우저 런처.
  - `components/layout/ConditionalAppShell.tsx`: PDF 경로에서 navbar 제거.
- 데이터 흐름: print route SSR -> `data-pdf-ready` 표시 -> Puppeteer `page.pdf`.
- 연관 기능: PDF 다운로드 API.
- 구현 상태: 완료
- 비고: 한 페이지 맞춤 스케일 계산 로직이 들어가 있음.

---

## 관리자(Admin) 운영 기능

### 관리자 KPI 대시보드
- 설명: 가입자/AI요청 수치를 day/week/month 기준으로 집계해 보여준다.
- 사용자 역할: 서비스 운영 지표를 빠르게 파악.
- 관련 파일:
  - `app/admin/dashboard/page.tsx`: 대시보드 페이지.
  - `features/admin/lib/stats.ts`: KPI 집계 쿼리.
  - `features/admin/components/kpi-cards.tsx`: KPI 카드 UI.
- 데이터 흐름: 서버 쿼리(`prisma.user`, `prisma.aiRequestLog`) -> 카드 렌더.
- 연관 기능: admin guard, trend 기능.
- 구현 상태: 완료
- 비고: UTC 기준 집계 로직 사용.

### 추이(Trend) 차트
- 설명: 일/주/월 granularity로 가입자와 AI 요청 추이를 라인 차트로 보여준다.
- 사용자 역할: 지표 변화 추세 확인.
- 관련 파일:
  - `features/admin/lib/trends.ts`: bucket 생성 + series 계산.
  - `features/admin/components/trend-section.tsx`: granularity 제어.
  - `features/admin/components/trend-chart.tsx`: Recharts 렌더.
  - `app/api/admin/trends/route.ts`: API 제공.
- 데이터 흐름: 프론트에서 granularity 선택 -> API -> series 렌더.
- 연관 기능: dashboard KPI.
- 구현 상태: 완료
- 비고: 주 단위 라벨 계산은 월/주차 표현을 커스텀 구현.

### AI 전역 ON/OFF + 사용자별 AI 차단
- 설명: 운영자가 AI 기능 전체를 중단하거나 특정 사용자 AI 사용을 차단한다.
- 사용자 역할: 이상 사용 제어 및 운영 정책 반영.
- 관련 파일:
  - `app/admin/ai-control/page.tsx`: 화면 진입점.
  - `features/admin/components/ai-control-panel.tsx`: 토글/리스트 UI.
  - `features/admin/lib/ai-control.ts`: systemConfig + user.aiBlocked 제어.
  - `app/api/admin/ai-control/route.ts`: 전역 설정 GET/PATCH.
  - `app/api/admin/users/[userId]/ai-block/route.ts`: 사용자별 PATCH.
- 데이터 흐름: admin 조작 -> API -> `SystemConfig("AI_DRAFT_ENABLED")` 또는 `User.aiBlocked` 반영.
- 연관 기능: `/api/odyssey/generate`, `/api/odyssey/quota`.
- 구현 상태: 완료
- 비고: AI 제어는 생성 API/쿼터 API 둘 다에서 검사한다.

### 관리자 사용자 목록 조회
- 설명: 사용자 목록(이메일/권한/차단/가입일/최근로그인)을 조회한다.
- 사용자 역할: 운영자가 계정 상태를 모니터링.
- 관련 파일:
  - `app/admin/users/page.tsx`: 사용자 테이블 페이지.
  - `app/api/admin/users/route.ts`: 목록 API.
  - `features/admin/lib/ai-control.ts`: 사용자 상태 조회 쿼리.
- 데이터 흐름: 서버/혹은 API로 사용자 목록 -> 표 렌더.
- 연관 기능: 사용자 AI 차단 토글.
- 구현 상태: 완료
- 비고: timestamp는 ISO string 변환 후 전달된다.

---

## 계정 탈퇴/내부 정리 배치

### 사용자 탈퇴 요청(소프트 삭제 예약)
- 설명: 사용자가 탈퇴를 요청하면 즉시 삭제하지 않고 7일 유예 상태로 전환한다.
- 사용자 역할: 탈퇴 요청/취소 기간을 갖는 안전한 계정 종료.
- 관련 파일:
  - `app/my-plan/page.tsx`: 탈퇴 모달/요청 버튼.
  - `app/api/account/withdraw/route.ts`: `PENDING_DELETION`, `hardDeleteAt` 업데이트.
  - `prisma/schema.prisma`: `User.status`, `withdrawRequestedAt`, `hardDeleteAt`.
- 데이터 흐름: 버튼 클릭 -> POST -> 상태 업데이트 -> signOut.
- 연관 기능: NextAuth 로그인 차단(`PENDING_DELETION`), 내부 cleanup.
- 구현 상태: 완료
- 비고: 같은 상태 재요청 시 409를 반환한다.

### 내부 cleanup API(하드 삭제)
- 설명: 내부 토큰 인증으로 유예 만료 사용자들을 영구 삭제한다.
- 사용자 역할: 사용자 직접 사용 기능은 아니고 운영 배치성 기능.
- 관련 파일:
  - `app/api/internal/users/withdrawal-cleanup/route.ts`: 토큰 검증 + `deleteMany`.
  - `prisma/schema.prisma`: Cascade로 연관 plan 데이터 함께 삭제.
- 데이터 흐름: 내부 요청(header/query token) -> 조건 삭제(`hardDeleteAt <= now`) -> 삭제 건수 응답.
- 연관 기능: 탈퇴 요청 API.
- 구현 상태: 완료
- 비고: `WITHDRAWAL_CLEANUP_SECRET` 누락 시 인증 실패.

### 계정 탈퇴 안내 페이지(축소 placeholder)
- 설명: `/account/withdraw`는 실제 처리 화면이 아니라 안내/리다이렉트 역할로 축소되어 있다.
- 사용자 역할: 탈퇴 동선은 `/my-plan`로 안내받음.
- 관련 파일:
  - `app/account/withdraw/page.tsx`: 안내 텍스트 + `/my-plan` 링크.
- 데이터 흐름: 페이지 접근 -> 안내 -> 내 플랜 이동.
- 연관 기능: `/my-plan` 탈퇴 모달.
- 구현 상태: 부분 구현(의도적 placeholder)
- 비고: 배포 안정화 목적으로 단순화된 상태.

---

## 공통 UI/레이아웃/상태 관리

### 앱 셸/네비게이션/페이지 배경 레이어
- 설명: 공통 navbar와 서브페이지 배경 레이어를 제공하고 경로별 셸 적용을 분기한다.
- 사용자 역할: 일관된 네비게이션과 화면 톤 유지.
- 관련 파일:
  - `components/layout/AppShell.tsx`: navbar 포함 공통 셸.
  - `components/layout/AppNavbar.tsx`: 로그인 상태별 메뉴/로그아웃.
  - `components/layout/ConditionalAppShell.tsx`: PDF 경로 예외 처리.
  - `components/layout/SubpageGlassVeil.tsx`: 서브페이지 비주얼 레이어.
  - `features/landing/components/LandingConfetti.tsx`: 배경 confetti.
- 데이터 흐름: route -> shell 분기 -> navbar session 상태 분기.
- 연관 기능: 전체 페이지, PDF 출력.
- 구현 상태: 완료
- 비고: navbar 로딩 상태는 스켈레톤 UI로 적용됨.

### 공통 세션/클라이언트 상태 정리
- 설명: 전역 SessionProvider를 주입하고 로그아웃 시 플랜 관련 브라우저 상태를 정리한다.
- 사용자 역할: 새 세션에서 이전 사용자의 클라이언트 잔존 상태 방지.
- 관련 파일:
  - `app/layout.tsx`: 루트에서 SessionProvider 주입.
  - `providers/SessionProvider.tsx`: next-auth provider 래퍼.
  - `lib/plan-client-state.ts`: session/local storage 정리 유틸.
  - `components/layout/AppNavbar.tsx`: logout 시 clear 호출.
- 데이터 흐름: app bootstrap -> session context -> logout 시 client state clear + signOut.
- 연관 기능: 인증/플랜 생성 흐름.
- 구현 상태: 완료
- 비고: 플랜 임시값은 서버 source-of-truth로 관리하도록 유도한다.

### 공통 모달 UI
- 설명: 탈퇴 확인 등 여러 화면에서 재사용 가능한 모달 셸 제공.
- 사용자 역할: 일관된 확인/취소 인터랙션.
- 관련 파일:
  - `components/common/ModalShell.tsx`: 모달 공통 구조.
  - `app/my-plan/page.tsx`: 탈퇴 확인 모달 실제 사용.
  - `features/plan/components/ExistingPlanConfirmModal.tsx`: 새 플랜 확인 모달.
- 데이터 흐름: open state 제어 -> 확인/취소 callback.
- 연관 기능: 탈퇴, 새 플랜 교체.
- 구현 상태: 완료
- 비고: 접근성 속성(titleId, close button) 지원.

---

## 운영 기능(배포/환경설정/DB/OAuth)

### Prisma 런타임 연결 및 진단 로그
- 설명: PrismaClient를 singleton으로 생성하고 DB URL 계열/옵션을 마스킹 로그로 진단한다.
- 사용자 역할: 직접 사용자 기능은 아니지만 장애 분석 시간을 줄임.
- 관련 파일:
  - `lib/prisma.ts`: adapter-pg 연결, 진단 로그, singleton 관리.
  - `prisma.config.ts`: datasource URL 주입.
  - `prisma/schema.prisma`: provider 및 모델 정의.
- 데이터 흐름: `DATABASE_URL` -> Prisma adapter -> API/서버 로직 전반에서 공통 사용.
- 연관 기능: 모든 DB 연동 기능.
- 구현 상태: 완료
- 비고: 런타임에서 별도 SSL 우회 옵션 주입은 현재 제거된 상태.

### 마이그레이션/클라이언트 생성 운영 플로우
- 설명: Prisma migration SQL 이력 기반으로 스키마를 유지하고, 배포 시 client generate를 보장한다.
- 사용자 역할: 직접 사용자 기능은 아니나 저장/조회 안정성에 직결.
- 관련 파일:
  - `prisma/migrations/*`: 스키마 변경 이력.
  - `package.json`: `postinstall: prisma generate`.
  - `README.md`, `docs/deployment-troubleshooting.md`: 배포 운영 가이드.
- 데이터 흐름: schema/migration 반영 -> deploy 환경 DB 동기화 -> 앱 런타임 사용.
- 연관 기능: `/api/my-plan`, admin 통계 등 전 DB 기능.
- 구현 상태: 완료
- 비고: `PlanYear` 계열 테이블은 migration 적용 여부가 저장 API 정상동작의 전제.

### OAuth/도메인/환경변수 운영 설정
- 설명: 배포 환경별 env, OAuth redirect URI, 서비스 도메인 정합성을 관리한다.
- 사용자 역할: 로그인/세션 안정성 보장.
- 관련 파일:
  - `README.md`: 배포 스택/필수 env.
  - `docs/deployment-log-2026-03-24.md`: 실제 장애/해결 기록.
  - `.env`, `.env.local`, `.vercel/.env.preview.local`: 환경별 변수 소스.
  - `features/auth/lib/auth.ts`: provider env 소비 지점.
- 데이터 흐름: env 설정 -> Vercel build/runtime -> NextAuth/Prisma 동작.
- 연관 기능: 인증, DB 연결, 내부 cleanup 인증.
- 구현 상태: 완료
- 비고: 운영상 핵심은 "기준 Vercel 프로젝트 단일화 + 도메인/OAuth URI 일치".

### 운영용 수동 스크립트(관리자 승격)
- 설명: 특정 이메일 사용자의 role을 ADMIN으로 업데이트하는 운영 스크립트.
- 사용자 역할: 일반 사용자는 직접 사용하지 않음(운영자 전용).
- 관련 파일:
  - `set-admin-role.js`: pg direct query 기반 role 업데이트.
- 데이터 흐름: 실행 -> DB 접속 -> 컬럼 보정/role 업데이트.
- 연관 기능: admin 접근 권한.
- 구현 상태: 완료(수동 운영 도구)
- 비고: 앱 런타임 코드와 별개 경로라 실행 환경/권한 관리 필요.

---

## 현재 프로젝트의 핵심 기능 TOP 10
- 1) Google/Kakao OAuth 로그인 + NextAuth 세션 주입
- 2) 사용자 최초 로그인 자동 upsert 및 역할(role) 유지
- 3) 플랜 작성 시작 분기(수동/AI) + 기존 플랜 교체 확인
- 4) 5개 연차 기반 수동 플랜 편집(목표 DnD, 점수, 키워드, 메모)
- 5) `/api/my-plan` 서버 검증 + 트랜잭션 저장
- 6) AI 인터뷰 기반 초안 생성(OpenAI + JSON schema coercion)
- 7) 월간 AI 사용 제한(quota) + 전역/사용자 차단 정책
- 8) 플랜 요약 화면 및 PDF 다운로드(서버 렌더 + Puppeteer)
- 9) 관리자 대시보드(KPI/추이/AI 제어/사용자 관리)
- 10) 탈퇴 예약(PENDING_DELETION) + 내부 cleanup 하드삭제 API

## 아직 비어 있거나 덜 구현된 기능 추정
- `features/plan/components/EmptyPlanToastHandler.tsx`: 미구현 추정(파일 비어 있음)
- `features/plan/components/PlanIntroSection.tsx`: 미구현 추정
- `features/plan/components/PlanQuestionStep.tsx`: 미구현 추정
- `features/plan/components/PlanActionButtons.tsx`: 미구현 추정
- `features/plan/components/StrengthWeaknessCard.tsx`: 미구현 추정
- `features/plan/components/YearSummaryCard.tsx`: 미구현 추정
- `features/plan/hooks/useSavePlan.ts`: 미구현 추정
- `features/plan/interview/odyssey-interview.flow.ts`: 더미 플로우 주석으로 보아 질문 설계 고도화 여지 존재(부분 구현 추정)

## 구조상 결합도가 높은 기능들
- 인증/세션 + 라우팅 가드 + admin 권한 제어(`auth.ts`, `proxy.ts`, `admin-guard.ts`, `admin/layout.tsx`)
- 플랜 편집 UI + 매퍼 + 서버 검증(`/plan/*`, `usePlanEditor`, `plan.mapper`, `/api/my-plan`)
- AI 생성 + quota + admin AI 제어(`/api/odyssey/generate`, `/api/odyssey/quota`, `admin/ai-control`, `SystemConfig`, `User.aiBlocked`)
- PDF 출력(`my-plan` 버튼, summary-pdf API, printable page, puppeteer 렌더)

## 리팩토링 우선순위 후보
- 1) 빈 파일/미사용 컴포넌트 정리(혼란도 감소, 탐색 비용 절감)
- 2) AI 인터뷰 플로우 더미 정의를 실제 시나리오로 교체(도메인 품질 향상)
- 3) auth/admin 가드 중복 책임 명확화(미들웨어 vs 레이아웃 vs API guard 역할 문서화)
- 4) `/api/my-plan`의 대형 검증 로직 분리(validator 모듈화로 테스트 용이성 증가)
- 5) 운영 스크립트(`set-admin-role.js`)를 공식 scripts 체계로 편입 및 안전장치 추가

