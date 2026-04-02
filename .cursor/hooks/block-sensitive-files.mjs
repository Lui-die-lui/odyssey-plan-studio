#!/usr/bin/env node

import fs from "node:fs";

const input = fs.readFileSync(0, "utf8");
let payload = {};

try {
  payload = JSON.parse(input);
} catch {
  console.error(
    JSON.stringify({
      permission: "deny",
      message: "Hook input parse failed. Blocking for safety.",
    }),
  );
  process.exit(2);
}

function collectStrings(obj, acc = []) {
  if (typeof obj === "string") {
    acc.push(obj);
    return acc;
  }
  if (Array.isArray(obj)) {
    for (const v of obj) collectStrings(v, acc);
    return acc;
  }
  if (obj && typeof obj === "object") {
    for (const v of Object.values(obj)) collectStrings(v, acc);
  }
  return acc;
}

function normalize(value) {
  return String(value).replaceAll("\\", "/");
}

const allStrings = collectStrings(payload);
const normalizedStrings = allStrings.map(normalize);

const toolName =
  payload.toolName ||
  payload.tool_name ||
  payload.event?.toolName ||
  payload.tool?.name ||
  "";

// ===== 1) 민감 파일/경로 직접 접근 차단 =====
const SENSITIVE_FILE_PATTERNS = [
  /^\.env(?:\..*)?$/i,
  /(^|\/)\.env(?:\.[A-Za-z0-9_-]+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.crt$/i,
  /(^|\/)secrets(\/|$)/i,
  /(^|\/)credentials(\/|$)/i,
  /service-account.*\.json$/i,
  /firebase-adminsdk.*\.json$/i,
];

// 코드 파일은 예외 처리
const CODE_FILE_PATTERNS = [
  /\.(js|cjs|mjs|ts|cts|mts|jsx|tsx)$/i,
  /prisma\.config\.ts$/i,
];

function isCodeFile(value) {
  return CODE_FILE_PATTERNS.some((re) => re.test(value));
}

function isSensitivePath(value) {
  if (typeof value !== "string") return false;
  const normalized = normalize(value);

  if (isCodeFile(normalized)) return false;

  return SENSITIVE_FILE_PATTERNS.some((re) => re.test(normalized));
}

const matchedSensitivePath = normalizedStrings.find(isSensitivePath);

if (matchedSensitivePath) {
  console.error(
    JSON.stringify({
      permission: "deny",
      message: `Sensitive file access blocked: ${matchedSensitivePath}`,
    }),
  );
  process.exit(2);
}

// ===== 2) 터미널/쉘에서 비밀값 추출/출력 차단 =====
const SECRET_ENV_NAMES = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_SECRET",
    "KAKAO_CLIENT_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
  ];
  
const SUSPICIOUS_TERMINAL_PATTERNS = [
  // 직접 파일 읽기
  /\bcat\s+.+\.env(?:\.[A-Za-z0-9_-]+)?\b/i,
  /\bless\s+.+\.env(?:\.[A-Za-z0-9_-]+)?\b/i,
  /\bmore\s+.+\.env(?:\.[A-Za-z0-9_-]+)?\b/i,
  /\btail\s+.+\.env(?:\.[A-Za-z0-9_-]+)?\b/i,
  /\bhead\s+.+\.env(?:\.[A-Za-z0-9_-]+)?\b/i,

  // env 출력 계열
  /\bprintenv\b/i,
  /\benv\b\s*(\||$)/i,
  /\bset\b\s*(\||$)/i,

  // shell 변수 직접 출력
  new RegExp(`\\becho\\s+\\$${SECRET_ENV_NAMES}\\b`, "i"),
  new RegExp(`\\bprintf\\b.*\\$${SECRET_ENV_NAMES}\\b`, "i"),

  // node / js
  /\bnode\b[\s\S]*process\.env\b/i,
  /\bconsole\.log\s*\(\s*process\.env\b/i,
  new RegExp(`process\\.env\\.${SECRET_ENV_NAMES}`, "i"),
  new RegExp(`process\\.env\\[['"]${SECRET_ENV_NAMES}['"]\\]`, "i"),

  // python
  /\bpython(?:3)?\b[\s\S]*os\.getenv\s*\(/i,
  /\bpython(?:3)?\b[\s\S]*os\.environ\b/i,

  // 검색으로 secret 찾기
  /\bgrep\b.*\b(secret|token|api[_-]?key|password|database_url)\b/i,
  /\brg\b.*\b(secret|token|api[_-]?key|password|database_url)\b/i,
];

// 터미널 명령 후보를 더 넓게 잡음
const joined = normalizedStrings.join("\n");
const looksLikeShellTool =
  /terminal|bash|shell|command|exec|run/i.test(String(toolName)) ||
  /\b(node|npm|pnpm|yarn|bash|sh|zsh|cmd|powershell|python|python3|printenv|env)\b/i.test(joined);

if (looksLikeShellTool) {
  const suspicious = SUSPICIOUS_TERMINAL_PATTERNS.find((re) =>
    re.test(joined),
  );

  if (suspicious) {
    console.error(
      JSON.stringify({
        permission: "deny",
        message: "Sensitive env extraction/output command blocked.",
      }),
    );
    process.exit(2);
  }
}

// allow
console.log(
  JSON.stringify({
    continue: true,
  }),
);
process.exit(0);