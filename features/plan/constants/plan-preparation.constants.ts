export const PLAN_PREPARATION_KINDS = ["study", "practice", "credential"] as const;
export type PlanPreparationKind = (typeof PLAN_PREPARATION_KINDS)[number];

export const PLAN_PREPARATION_PRIORITIES = ["start_first", "after_basics", "if_needed"] as const;
export type PlanPreparationPriority = (typeof PLAN_PREPARATION_PRIORITIES)[number];

export const PLAN_PREPARATION_KIND_LABELS: Record<PlanPreparationKind, string> = {
  study: "공부",
  practice: "실습·경험",
  credential: "자격증·교육",
};

export const PLAN_PREPARATION_PRIORITY_LABELS: Record<PlanPreparationPriority, string> = {
  start_first: "먼저 시작",
  after_basics: "기초 경험 후 결정",
  if_needed: "필요할 때 검토",
};

export const PLAN_PREPARATION_UNVERIFIED_LABEL = "최신 확인 전 참고 제안";
export const PLAN_PREPARATION_TITLE = "이 방향을 준비하려면";
export const PLAN_PREPARATION_STUDY_TITLE = "추천 공부";
export const PLAN_PREPARATION_CREDENTIAL_TITLE = "추천 자격증·교육";
export const PLAN_PREPARATION_SHARED_TITLE = "공통으로 도움이 되는 준비";
export const PLAN_PREPARATION_NOTE =
  "전부 해야 하는 목록이 아니에요. 시험 일정, 비용, 응시 조건은 공식 안내에서 직접 확인해 주세요.";

/** A path shows at most this many items, counting the shared ones. */
export const PLAN_PREPARATION_MAX_PER_PATH = 3;
export const PLAN_PREPARATION_MAX_SHARED = 2;

/**
 * Credentials the app can vouch for. Every entry was checked by a person against
 * the listed source on `checkedAt`; only code may add entries. The model picks an
 * `id`, so it can never supply a URL or a "required" claim of its own.
 */
export type PlanPreparationCatalogEntry = {
  id: string;
  name: string;
  /** "required": a law ties the work to this credential. "check": depends on role. */
  requirement: "required" | "check" | "optional";
  requirementLabel: string;
  /** Legal or institutional basis, when one was confirmed. */
  basis: string;
  sourceName: string;
  sourceUrl: string;
  checkedAt: string;
  /** A credential is only relevant if one of these appears in the path or answers. */
  keywords: string[];
};

export const PLAN_PREPARATION_CATALOG: readonly PlanPreparationCatalogEntry[] = [
  {
    id: "kr-care-worker",
    name: "요양보호사",
    requirement: "required",
    requirementLabel: "법령상 자격 필요 (대한민국)",
    basis: "노인복지법 제39조의2",
    sourceName: "국가법령정보센터 노인복지법",
    sourceUrl: "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EB%85%B8%EC%9D%B8%EB%B3%B5%EC%A7%80%EB%B2%95",
    checkedAt: "2026-11-01",
    keywords: ["요양", "돌봄", "노인"],
  },
  {
    id: "kr-social-worker",
    name: "사회복지사",
    requirement: "check",
    requirementLabel: "직무별 필요 여부 확인 (대한민국)",
    basis: "사회복지사업법 제11조",
    sourceName: "국가법령정보센터 사회복지사업법",
    sourceUrl:
      "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%82%AC%ED%9A%8C%EB%B3%B5%EC%A7%80%EC%82%AC%EC%97%85%EB%B2%95",
    checkedAt: "2026-11-01",
    keywords: ["사회복지", "복지"],
  },
  {
    id: "kr-childcare-teacher",
    name: "보육교사",
    requirement: "required",
    requirementLabel: "법령상 자격 필요 (대한민국)",
    basis: "영유아보육법 제21조",
    sourceName: "국가법령정보센터 영유아보육법",
    sourceUrl:
      "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%98%81%EC%9C%A0%EC%95%84%EB%B3%B4%EC%9C%A1%EB%B2%95",
    checkedAt: "2026-11-01",
    keywords: ["보육", "어린이집", "영유아"],
  },
  {
    id: "kr-info-processing-engineer",
    name: "정보처리기사",
    requirement: "optional",
    requirementLabel: "선택, 직무별 확인",
    basis: "",
    sourceName: "Q-Net",
    sourceUrl: "https://www.q-net.or.kr/",
    checkedAt: "2026-11-01",
    keywords: ["개발", "소프트웨어", "프로그래밍", "백엔드", "서버", "IT"],
  },
  {
    id: "kr-korean-cook",
    name: "한식조리기능사",
    requirement: "optional",
    requirementLabel: "선택, 직무별 확인",
    basis: "",
    sourceName: "Q-Net",
    sourceUrl: "https://www.q-net.or.kr/",
    checkedAt: "2026-11-01",
    keywords: ["요리", "조리", "한식", "식당"],
  },
  {
    id: "kr-computer-literacy",
    name: "컴퓨터활용능력",
    requirement: "optional",
    requirementLabel: "선택, 직무별 확인",
    basis: "",
    sourceName: "대한상공회의소 자격평가사업단",
    sourceUrl: "https://license.korcham.net/",
    checkedAt: "2026-11-01",
    keywords: ["사무", "엑셀", "스프레드시트", "회계", "행정"],
  },
  {
    id: "kr-sqld",
    name: "SQL 개발자(SQLD)",
    requirement: "optional",
    requirementLabel: "선택, 직무별 확인",
    basis: "",
    sourceName: "데이터자격검정",
    sourceUrl: "https://www.dataq.or.kr/",
    checkedAt: "2026-11-01",
    keywords: ["SQL", "데이터베이스", "데이터", "백엔드"],
  },
  {
    id: "kr-big-data-analyst",
    name: "빅데이터분석기사",
    requirement: "optional",
    requirementLabel: "선택, 직무별 확인",
    basis: "",
    sourceName: "데이터자격검정",
    sourceUrl: "https://www.dataq.or.kr/www/sub/a_07.do",
    checkedAt: "2026-11-01",
    keywords: ["데이터 분석", "빅데이터", "통계"],
  },
];

/** Where people can look up anything the catalog does not cover. */
export const PLAN_PREPARATION_LOOKUPS = [
  { name: "민간자격정보서비스", url: "https://www.pqi.or.kr/indexMain.do", checkedAt: "2026-11-01" },
  { name: "고용24 직업훈련", url: "https://www.work24.go.kr/cm/main.do", checkedAt: "2026-11-01" },
] as const;

export function findPreparationCatalogEntry(
  id: string | null | undefined,
): PlanPreparationCatalogEntry | undefined {
  return PLAN_PREPARATION_CATALOG.find((entry) => entry.id === id);
}
