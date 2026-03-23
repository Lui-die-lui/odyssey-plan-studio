# Odyssey Plan Studio

5년 플랜(Year 1~5)을 “인터뷰 기반 초안 생성”으로 만들고, 사용자가 이후 직접 다듬고 편집할 수 있는 서비스입니다.

이 프로젝트는 Next.js(App Router) + NextAuth + Prisma(PostgreSQL) 기반이며, AI 초안 생성에는 월간 쿼터/차단 정책과 운영용 어드민 대시보드가 포함됩니다.

---

## 주요 기능

- 인증/세션: NextAuth (Google, Kakao)
- 플랜 생성 흐름
  - `/plan/new`: 시작 방식 선택(가이드 AI vs 수동)
  - `/plan/new/ai`: “AI와 함께 방향 찾기” 인터뷰 UI
  - `/plan/new/manual`: 수동 입력/작성 UI
  - `/plan/edit`: 편집 UI
  - `/my-plan`: 내 플랜 보기
- AI 초안 생성
  - `POST /api/odyssey/generate`: OpenAI 호출 전 월간 쿼터/차단/전역 OFF 검증
  - `GET /api/odyssey/quota`: “이번 달 남은 횟수 + 차단 상태”를 프론트에 제공
- 운영/어드민
  - `/admin/dashboard`: 가입자/AI 요청 KPI + 일/주/월 추이(Recharts)
  - `/admin/ai-control`: 전역 AI ON/OFF + 사용자별 `aiBlocked` 제어
  - `/admin/users`: 사용자 목록과 AI 차단 상태
- 탈퇴/데이터 정리
  - `POST /api/account/withdraw`: 사용자 상태를 `PENDING_DELETION`으로 전환
  - `POST /api/internal/users/withdrawal-cleanup`: 내부 토큰 기반으로 유예 만료 사용자 하드 삭제

---

## 기술 스택

- Next.js 16.2.0 (App Router)
- React 19
- NextAuth 4
- Prisma 7 + PostgreSQL
- Tailwind CSS
- Framer Motion (인터뷰/패널 애니메이션)
- Recharts (어드민 차트)
- OpenAI (초안 생성)
- Puppeteer (PDF 렌더링)

---

## 환경 변수(필수/권장)

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `NEXTAUTH_SECRET`: NextAuth 세션 서명/토큰 검증용 비밀
- `OPENAI_API_KEY`: OpenAI 호출용 API 키
- `WITHDRAWAL_CLEANUP_SECRET`: 내부 cleanup API 인증용 토큰
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 또는 `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`, `VERCEL_URL`, `VERCEL` (선택)

---

## 문서

- 전체 API: [`API.md`](./API.md)
- 데이터 모델 ERD: [`ERD.md`](./ERD.md)

---

## 로컬 개발

```bash
npm run dev
```

기본 접속: `http://localhost:3000`

---
