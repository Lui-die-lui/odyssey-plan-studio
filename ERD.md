# ERD (Prisma 기준)

아래 ERD는 현재 `prisma/schema.prisma` 기준입니다.

```mermaid
erDiagram
    USER {
        string id PK
        string provider
        string providerUserId
        string email
        string name
        string image
        string role "USER|ADMIN"
        boolean aiBlocked
        string status "ACTIVE|PENDING_DELETION"
        datetime lastLoginAt
        datetime withdrawRequestedAt
        datetime hardDeleteAt
        datetime createdAt
        datetime updatedAt
    }

    PLAN {
        string id PK
        string userId UK, FK
        string title
        datetime createdAt
        datetime updatedAt
    }

    PLAN_YEAR {
        string id PK
        string planId FK
        int yearIndex
        string note
        int resourcesScore "nullable, null=미평가"
        int interestScore "nullable, null=미평가"
        int confidenceScore "nullable, null=미평가"
        int coherenceScore "nullable, null=미평가"
        string[] unverifiedScoreKeys "출처 미확인 점수"
        datetime createdAt
        datetime updatedAt
    }

    PLAN_YEAR_AI_GUIDANCE {
        string id PK
        string planYearId UK, FK
        string[] sourceGoalTexts
        string checkpoint
        string rationale
        string[] evidenceQuestionIds
        string pivotCondition
        datetime createdAt
        datetime updatedAt
    }

    PLAN_YEAR_GOAL {
        string id PK
        string planYearId FK
        int position
        string text
        datetime createdAt
        datetime updatedAt
    }

    PLAN_YEAR_KEYWORD {
        string id PK
        string planYearId FK
        int position
        string text
        datetime createdAt
        datetime updatedAt
    }

    AI_DRAFT_USAGE {
        string id PK
        string userId FK
        string monthKey
        int usedCount
        datetime createdAt
        datetime updatedAt
    }

    AI_REQUEST_LOG {
        string id PK
        string userId FK "nullable"
        string ipAddress
        string requestType
        boolean success
        string blockedReason
        datetime createdAt
    }

    SYSTEM_CONFIG {
        string key PK
        string value
        datetime updatedAt
    }

    USER ||--o| PLAN : owns
    PLAN ||--o{ PLAN_YEAR : has
    PLAN_YEAR ||--o{ PLAN_YEAR_GOAL : has
    PLAN_YEAR ||--o{ PLAN_YEAR_KEYWORD : has
    USER ||--o{ AI_DRAFT_USAGE : tracks
    USER o|--o{ AI_REQUEST_LOG : logs
```

## 참고 제약조건

- `User`: `@@unique([provider, providerUserId])`
- `Plan`: `userId @unique` (사용자당 플랜 1개)
- `PlanYear`: `@@unique([planId, yearIndex])`
- `PlanYearGoal`: `@@unique([planYearId, position])`
- `PlanYearKeyword`: `@@unique([planYearId, position])`
- `AiDraftUsage`: `@@unique([userId, monthKey])`

