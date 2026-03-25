# 배포/인프라 작업 기록 (2026-03-24)

## 1. 오늘 작업 개요
- **배포 목표**: Next.js 기반 서비스의 로그인(NextAuth), DB(Prisma+Supabase), 플랜 저장 API를 Vercel 환경에서 안정적으로 동작시키는 것.
- **연동 스택/외부 서비스**: `Next.js(App Router)`, `NextAuth`, `Prisma 7.x`, `Supabase Postgres`, `Vercel`, `Google/Kakao OAuth`.
- **복잡해진 이유**:
  - 인증(OAuth) 문제와 DB 연결 문제가 동시에 발생해 증상이 겹쳤다.
  - Vercel 프로젝트/도메인이 중복되어 “수정한 env”와 “실제 접속한 배포본”이 달랐다.
  - Prisma 7.x의 설정 방식(`prisma.config.ts` 중심)과 과거 습관(schema의 url 설정)이 섞여 판단이 느려졌다.

---

## 2. 문제 발생 흐름 (시간순)
- **초기 증상**: 배포 후 로그인/관리자 페이지 접근 시 DB 관련 오류 발생.
  - 에러: `Can't reach database server ...`
  - 이후: `Error opening a TLS connection: self-signed certificate in certificate chain`
- **1차 의심/수정**: DB URL 자체 오타/접속 불가 의심
  - `DATABASE_URL` 포맷 점검, 로컬/배포 env 분리 진행.
  - 이 단계에서 로컬 동작과 배포 동작이 달라 혼선 발생.
- **2차 의심/수정**: SSL/TLS 옵션 및 Supabase endpoint 의심
  - direct 연결(`:5432`)과 transaction pooler(`:6543`) 차이 점검.
  - pooler URL 기준으로 재정리하고 쿼리 파라미터(`pgbouncer`, `connection_limit`, `sslmode`) 확인.
- **3차 의심/수정**: Prisma 설정 구조 혼동 정리
  - Prisma 7.x 기준으로 datasource URL을 `prisma.config.ts`에서 읽는 구조 유지.
  - runtime에서 별도 ssl override/rejectUnauthorized 우회 설정 제거.
- **4차 의심/수정**: OAuth 도메인/Redirect 점검
  - Kakao/Google의 callback URI와 실제 서비스 도메인 정합성 확인.
  - `NEXTAUTH_URL`과 OAuth console 설정의 도메인 불일치 가능성 해소.
- **5차 전환점**: Vercel 중복 프로젝트/도메인 섞임 인지
  - env를 수정한 프로젝트와 실제 트래픽이 가는 프로젝트가 달랐던 상태 확인.
  - 기준 프로젝트/도메인으로 통일 후 재설정.
- **최종 상태**:
  - 로그인 성공 경로 회복.
  - 이후 저장 시 `P2021 (PlanYear table missing)` 발생 → migration 배포로 해결.

---

## 3. 핵심 원인 정리

### 3-1) Vercel 프로젝트 중복 생성으로 도메인/설정 혼선
- 비슷한 이름의 프로젝트가 여러 개 존재하면서 env 수정 대상이 분산됨.
- 결과적으로 “설정은 바꿨는데 증상은 그대로” 상황이 반복됨.

### 3-2) Prisma 7.x DB URL 관리 방식 혼동
- 과거 방식(schema에 `url = env(...)`)과 Prisma 7.x 권장 방식(`prisma.config.ts`)이 섞임.
- 설정 소스가 여러 군데처럼 보이면서 원인 추적 시간이 늘어남.

### 3-3) Supabase direct vs transaction pooler 차이
- direct(`:5432`)는 연결 정책/환경에 따라 불안정할 수 있고, 서버리스 환경에서는 pooler(`:6543`)가 더 적합.
- 런타임/마이그레이션 용도를 분리하지 않으면 장애 재현이 불규칙해짐.

### 3-4) TLS/SSL self-signed certificate 에러
- URL/프로젝트/도메인 불일치 상태에서 잘못된 연결 설정이 겹쳐 TLS 에러가 지속됨.
- 본질은 “코드 해킹”보다 “올바른 endpoint + 올바른 env 적용 대상” 정합성이 중요했다.

### 3-5) Kakao Redirect URI와 실제 도메인 불일치 가능성
- OAuth provider 설정값과 실제 접근 도메인이 조금이라도 다르면 로그인 단계에서 실패.
- callback URI와 루트 도메인 허용 목록을 함께 맞춰야 한다.

### 3-6) env 수정 대상과 실제 접속 프로젝트 불일치
- 가장 큰 운영 실수 포인트.
- 결국 기준 프로젝트 하나로 통일하고 그 프로젝트에만 env를 정리하면서 해결됨.

---

## 4. 실제로 해결된 내용
- **기준 프로젝트 확정**: 실제 사용자 트래픽이 들어오는 Vercel 프로젝트를 단일 기준으로 고정.
- **도메인 통일**: `NEXTAUTH_URL`, Kakao/Google Redirect URI를 동일 서비스 도메인 기준으로 재정렬.
- **DB 연결 전략 정리**:
  - 런타임은 `DATABASE_URL`(Supabase pooler) 사용.
  - 관리/마이그레이션은 `DIRECT_URL` 분리.
- **Prisma 7.x 구조 정렬**:
  - `prisma.config.ts`에서 datasource URL 관리.
  - schema는 provider 중심 구조 유지.
- **로그인 성공까지의 핵심 포인트**:
  - “올바른 Vercel 프로젝트에 env 적용” + “OAuth redirect 정합성” + “pooler 기반 DB 연결”의 3축을 맞춘 것.

---

## 5. 최종 설정 체크리스트
- **Vercel 기준 프로젝트**
  - 실제 서비스 도메인이 연결된 프로젝트 1개만 기준으로 사용.
  - 동일 코드의 중복 프로젝트는 운영 대상에서 제외/정리.
- **`NEXTAUTH_URL`**
  - 기준 서비스 도메인과 정확히 일치 (프로토콜/호스트 통일).
- **Kakao JavaScript SDK 도메인**
  - 기준 서비스 도메인 등록.
- **Kakao Redirect URI**
  - `https://<기준도메인>/api/auth/callback/kakao` 등록.
- **Google Redirect URI**
  - `https://<기준도메인>/api/auth/callback/google` 등록.
- **`DATABASE_URL`**
  - Supabase transaction pooler(`:6543`) 형식 사용.
  - 예: `postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true&connection_limit=1`
- **`DIRECT_URL`**
  - direct connection(`:5432`) 형식, migration/관리 작업 전용.
- **Prisma 파일 구조**
  - `prisma.config.ts`: datasource URL 참조의 단일 소스.
  - `schema.prisma`: datasource provider 중심 유지(버전 정책 준수).
  - runtime 코드: ssl/rejectUnauthorized 우회 주입 금지.
- **재배포 시 주의**
  - env 변경 후 반드시 해당 프로젝트/환경(Production/Preview) 재배포.
  - “현재 열어본 도메인”이 어떤 배포본인지 먼저 확인.

---

## 6. 내가 헷갈렸던 포인트 / 실수 포인트
- 유사 Vercel 프로젝트가 여러 개일 때 env를 잘못된 프로젝트에 수정함.
- callback URI와 루트 도메인 설정을 분리해서 봐야 하는데 한 번에 혼동함.
- DB 연결 이슈와 OAuth 이슈를 한 덩어리로 처리해 원인 분리가 늦어짐.
- Prisma 구버전 습관과 7.x 방식을 혼용해 설정 판단이 흔들림.
- Supabase의 일반 경고(RLS disabled 등)를 실제 장애 원인으로 과대해석할 여지가 있었음.

---

## 7. 회고
- **배운 점**
  - 배포 장애는 코드보다 “환경 대상의 정합성(프로젝트/도메인/env)”이 원인인 경우가 많다.
  - OAuth와 DB를 분리해서 진단하면 해결 속도가 훨씬 빨라진다.
  - Prisma 버전별 설정 규칙을 먼저 고정해야 디버깅이 일관된다.
- **다음 배포에서의 원칙**
  - 기준 Vercel 프로젝트/도메인을 먼저 확정하고, env 수정 대상을 단일화한다.
  - 인증 경로(redirect URI)와 DB 경로(DATABASE_URL/DIRECT_URL)를 독립적으로 점검한다.
  - 재배포 전후 체크리스트를 문서 기준으로 기계적으로 확인한다.

---

## 다음부터의 배포 점검 순서
1. 기준 Vercel 프로젝트와 실제 서비스 도메인이 일치하는지 먼저 확인한다.
2. `NEXTAUTH_URL`과 OAuth Redirect URI(구글/카카오)가 기준 도메인으로 맞는지 확인한다.
3. `DATABASE_URL`(pooler) / `DIRECT_URL`(direct) 역할 분리를 확인한다.
4. Prisma 7.x 설정 구조(`prisma.config.ts` 중심)가 유지되는지 확인한다.
5. Production/Preview 환경별 env 적용 여부를 확인하고 대상 환경을 재배포한다.
6. 로그인 테스트(구글/카카오) 후 DB read/write(플랜 저장)까지 E2E로 검증한다.
7. 에러 발생 시 OAuth/DB를 분리해 로그를 확인하고, 원인 축을 하나씩 닫아간다.
