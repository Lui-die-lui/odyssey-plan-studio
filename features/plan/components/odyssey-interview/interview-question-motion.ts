import type { Transition } from "framer-motion";

/** 질문 말풍선 · 하단 질문 패널 공통 — 방향·속도감 통일 */
export const INTERVIEW_QUESTION_MOTION_Y = 20;

/** globals.css `interview-ai-bubble-enter` 와 동일 계열 ease */
export const INTERVIEW_QUESTION_EASE: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
];

export const interviewQuestionTransition: Transition = {
  duration: 0.45,
  ease: INTERVIEW_QUESTION_EASE,
};

/** 패널 교체 시 짧은 정리 — 위로 튀지 않게 페이드 위주 */
export const interviewQuestionPanelExitTransition: Transition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
};

export const interviewQuestionEnterInitial = {
  opacity: 0,
  y: INTERVIEW_QUESTION_MOTION_Y,
};

export const interviewQuestionEnterAnimate = {
  opacity: 1,
  y: 0,
};

export const interviewQuestionPanelExit = {
  opacity: 0,
  y: 6,
};

/** 하단 질문 패널은 "아래에서 떠오름" 대신 바닥 기준으로 펼쳐짐 */
export const interviewQuestionPanelExpandInitial = {
  opacity: 0,
  scaleY: 0.94,
  transformOrigin: "50% 100%",
};

export const interviewQuestionPanelExpandAnimate = {
  opacity: 1,
  scaleY: 1,
  transformOrigin: "50% 100%",
};
