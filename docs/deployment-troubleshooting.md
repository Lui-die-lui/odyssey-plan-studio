# Deployment Troubleshooting (Vercel + NextAuth + Prisma + Supabase)

이 문서는 본 프로젝트에서 실제로 발생한 배포 이슈를 기준으로 빠르게 원인을 분류하고 해결하기 위한 체크리스트입니다.

## 1) 증상별 빠른 분류

### A. 로그인 직후 `/api/auth/error`로 이동

대표 URL 예시:

- `/api/auth/error?error=...Invalid prisma.user.findUnique() invocation...`

의미:

- OAuth 시작은 정상
- NextAuth callback 단계에서 DB 접근 실패

확인 로그 순서:

1. `POST /api/auth/signin/google` (보통 200/302)
2. `GET /api/auth/callback/google` (실패 시 302)
3. `GET /api/auth/error` (200)

### B. 에러 메시지에 `self-signed certificate in certificate chain`

의미:

- DB 서버까지는 도달
- TLS 인증서 체인 검증에서 실패

주요 원인:

- 잘못된 `DATABASE_URL` (host/user/query 파라미터)
- 환경 scope 불일치(Preview/Production)
- 배포 반영 누락(환경변수 수정 후 미배포)

### C. `Can't reach database server ...`

의미:

- 네트워크/주소/포트/접근 경로 수준에서 DB 연결 실패

주요 원인:

- host 또는 포트 오타
- pooler/direct URL 혼용
- Supabase 측 접속 경로/상태 이슈

---

## 2) 현재 프로젝트의 DB 연결 구조

### Prisma 7 구성 원칙

- `prisma/schema.prisma`
  - `generator client { provider = "prisma-client-js" }`
  - `datasource db { provider = "postgresql" }` (url 없음)
- `prisma.config.ts`
  - `datasource.url = process.env["DATABASE_URL"]`
- 런타임 클라이언트
  - `lib/prisma.ts`에서 `@prisma/adapter-pg` + `PrismaClient`
  - 연결 문자열은 `process.env.DATABASE_URL`만 사용

### 주의

- Prisma 7에서는 schema 파일의 `datasource.url`을 사용하지 않음
- runtime에서 SSL override (`rejectUnauthorized: false`) 같은 우회 설정 금지

---

## 3) Vercel Environment 체크리스트

1. `Settings -> Environment Variables`에서 `DATABASE_URL` 확인
2. Environment scope에 `Preview` 포함 여부 확인
3. 값 저장 후 반드시 **Redeploy**
4. 최신 배포 커밋/배포로 테스트

권장:

- scope 불확실하면 `Production + Preview + Development` 모두 설정
- 잘못된 값 의심 시 `DATABASE_URL` 삭제 후 재등록

---

## 4) Supabase URL 권장 형식 (pooler)

서버리스(Vercel) 기준 권장:

```env
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<ENCODED_PASSWORD>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&uselibpqcompat=true&sslmode=require"
```

설명:

- user: `postgres.<PROJECT_REF>`
- host: `*.pooler.supabase.com`
- port: `6543`
- query: `pgbouncer=true`, `connection_limit=1`, `sslmode=require`
- 필요 시 `uselibpqcompat=true` 추가(sslmode 해석 차이 대응)

비밀번호 주의:

- 특수문자(`@`, `:`, `/`, `?`, `#`, `%`, `&`, `+`, `!` 등) 포함 시 URL 인코딩 필수

---

## 5) 운영/로컬 환경 변수 전략

- 로컬: `.env.local` (로컬 DB 또는 개발용 URL)
- 배포: Vercel Environment Variables
- 코드: 항상 `process.env.DATABASE_URL` 사용

원칙:

- 로컬 우회값(예: TLS 검증 완화)은 배포 환경에 넣지 않기
- 배포 실패 분석 시 먼저 실제 적용 scope + 재배포 여부 확인

---

## 6) Prisma 빌드/생성 단계

필수:

- `package.json`에 `postinstall: prisma generate`

의미:

- Vercel 의존성 설치 직후 Prisma Client 생성
- build 단계 타입/런타임 불일치 방지

---

## 7) 타입 에러 연쇄 대응 (배포 빌드)

실제로 발생했던 패턴:

- `Type error: Parameter 'u' implicitly has an 'any' type`

대응 원칙:

- `map` 콜백/state updater/transaction callback에 타입 명시
- `any`, `@ts-ignore`로 우회하지 않기
- 가능하면 반환 타입을 생산 함수에서 먼저 고정

---

## 8) 디버깅 로그 확인 포인트

서버 로그에서 다음 정보를 확인:

- datasource family (pooler/direct)
- host 마스킹 값
- port
- `pgbouncer`, `sslmode`, `connection_limit` 존재 여부
- NextAuth context(`nextauth.signIn`, `nextauth.jwt`)에서 datasource usage 로그

주의:

- 비밀번호/전체 URL은 로그에 출력하지 않음

---

## 9) 최종 점검 순서

1. `DATABASE_URL` 형식 검증 (user/host/query/인코딩)
2. Vercel scope(`Preview`) 확인
3. Redeploy
4. 로그인 시도
5. `/api/auth/callback/google` + `/api/auth/error` 함수 로그 확인
6. 여전히 실패 시 에러 URL의 `error` 문자열 전체 확인

