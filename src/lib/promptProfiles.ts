/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RefinementProfile {
  id: string;
  label: string;
  description: string;
  instructionBlock: string;
}

export const REFINEMENT_PROFILES: RefinementProfile[] = [
  {
    id: "balanced",
    label: "Balanced",
    description: "General high-quality prompt refinement.",
    instructionBlock: "Provide a balanced, high-quality, comprehensive pre-compilation review. Ensure a solid mix of functional requirements, clear system architecture, clean layout standards, and solid security paradigms."
  },
  {
    id: "senior_engineer",
    label: "Senior Engineer",
    description: "Optimized for coding agents (minimal safe changes, risks, acceptance criteria).",
    instructionBlock: "Adopt the mindset of a highly pragmatic Senior Software Engineer. Emphasize small, safe, incremental changes over massive rewrites. Explicitly list files to inspect/modify, note technical bug risks or legacy code impacts, outline clear and testable acceptance criteria, and warn against unnecessary refactoring."
  },
  {
    id: "ui_ux",
    label: "UI/UX Designer",
    description: "Emphasizes layout, interactions, accessibility, hierarchy, and design polish.",
    instructionBlock: "Adopt the mindset of an expert UI/UX Designer and Frontend Architect. Focus heavily on modern screen layout configurations, transitions, micro-interactions, stateful component behavior, WCAG accessibility compliance (e.g. outline focus rings, keyboard navigations), mobile-first responsiveness, and clear visual hierarchy."
  },
  {
    id: "product_strategy",
    label: "Product Strategist",
    description: "Emphasizes user flows, product value, MVP scope, and feature priorities.",
    instructionBlock: "Adopt the mindset of a Product Manager and Product Strategist. Focus on clarifying target audiences, defining atomic MVP scopes, ordering feature backlogs, planning user onboarding flows, and listing business values or engagement drivers."
  },
  {
    id: "bugfix_debug",
    label: "Bugfix / Debug",
    description: "Emphasizes reproduction steps, suspected causes, minimal patches, and tests.",
    instructionBlock: "Adopt the mindset of a debugging specialist. Focus strictly on reproduction steps, identifying suspected root causes, outlining minimal surgical bug fixes rather than broad rewrites, planning diagnostics logs/telemetry, outlining regression unit tests, and establishing long-term regression prevention measures."
  },
  {
    id: "refactor_optimization",
    label: "Refactor / Optimization",
    description: "Emphasizes performance, incremental steps, and risk containment.",
    instructionBlock: "Adopt the mindset of a performance engineer and refactoring specialist. Focus on code readability, performance benchmarks, render counts, database query speed, atomic step-by-step refactoring stages, risk containment matrices, and code maintainability indexes."
  },
  {
    id: "pwa_mobile",
    label: "PWA / Mobile",
    description: "Emphasizes offline, installability, touch controls, and local storage.",
    instructionBlock: "Adopt the mindset of a Mobile First and Progressive Web App specialist. Emphasize offline resilience (Service Workers, network fallbacks), LocalStorage/IndexedDB offline data models, standalone installability metrics, mobile viewport scaling, touch-friendly hoverless click targets (>44px), and performance benchmarks under slow networks."
  },
  {
    id: "black_swan_creative",
    label: "Black-Swan Creative",
    description: "Emphasizes novelty, unusual constraints, and first-principles product thinking.",
    instructionBlock: "Adopt the mindset of a visionary Black-Swan product incubator. Push for maximum novelty, unusual technical constraints, gamification, and first-principles creative product design. Reject obvious solutions; propose defensible startup pivots, non-obvious features, ephemeral interactions, and high-engagement core loops."
  }
];

export function getProfileById(id: string): RefinementProfile {
  return REFINEMENT_PROFILES.find(p => p.id === id) || REFINEMENT_PROFILES[0];
}
