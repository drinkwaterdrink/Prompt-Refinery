/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromptBlueprint } from './types';
import { BLUEPRINT_OUTPUT_CONTRACT } from './lib/prompt/enhancerSystemPrompt';

export const MOCK_BLUEPRINT_WORKOUTS: PromptBlueprint = {
  schema_version: BLUEPRINT_OUTPUT_CONTRACT.schema_version,
  title: "FitQuest: Gamified Workout Tracker & Achievement System",
  summary: "A mobile-first progressive web application combining structured exercise logging with gamified progression, streaks, and local performance analysis to maximize user retention and workout efficacy.",
  intent_classification: {
    request_type: "new_build",
    confidence: "high",
    detected_domain: "Health, Fitness & Gamification"
  },
  problem_clarification: {
    expanded_description: "The user needs an intuitive workout tracker that makes workout logging low-friction while motivating them over time via streak metrics and performance feedback. Key challenges are manual data entry overhead and maintaining daily motivation.",
    core_objectives: [
      "Minimize resistance to logging active exercises in mid-workout conditions",
      "Model workout templates (e.g. Push, Pull, Legs) to allow fast-tap creation",
      "Implement persistent local indicators for active streaks, personal records, and level progression"
    ],
    primary_users: [
      "Casual fitness enthusiasts wanting simple progress visualization",
      "Gamers who respond well to streaks, xp, levels, and badge achievements",
      "Strength trainers looking to track progressive overload metrics"
    ],
    assumptions: [
      {
        "id": "A1",
        "text": "The app is strictly running in client-side / offline-first mode using local storage to preserve sessions.",
        "confidence": "high",
        "source": "industry_default"
      },
      {
        "id": "A2",
        "text": "High responsive feedback is required during mid-set states to avoid locking UI if sweat or accidental touches occur.",
        "confidence": "medium",
        "source": "inferred_from_context"
      },
      {
        "id": "A3",
        "text": "The user will supply their own workout library or configure standard pre-populated routines.",
        "confidence": "high",
        "source": "explicit"
      }
    ],
    constraints: [
      "Must remain fully interactive on low-end cellular connections (offline-capable)",
      "Target tap-targets must have at least 48px padding for sweaty hands in motion",
      "Avoid complex heavy-dependency visualization packages to prevent bloated load times"
    ]
  },
  functional_requirements: {
    must_have: [
      "Active workout session page with multi-set timers and rapid checkmarks",
      "Routine template builder to store custom sequence patterns",
      "Calculated metrics dashboard tracking progressive overload and lifting volume",
      "XP leveling system linked to finished exercises"
    ],
    should_have: [
      "Rest timer overlays with sensory vibration signaling and subtle countdown progress rings",
      "Personal records highlighted in golden ribbons next to list entries",
      "History logs showing aggregated workout duration calendar over months"
    ],
    could_have: [
      "Audio coaching voice synthesizers announcing matching set sets and rest intervals",
      "CSV exporter for raw workout database structure"
    ],
    wont_have: [
      "Real-time synchronized multiplayer session feeds with active lobbies",
      "Integration with smart gym hardware machines via Bluetooth low energy"
    ]
  },
  architecture: {
    paradigm: "Client-Side Single Page Application (PWA) with component modularity",
    frontend: "React 19, TypeScript, Tailwind CSS v4, Lucide React Icons",
    backend: "None (Fully client-administered layer)",
    database: "Browser IndexedDB managed via LocalForage / localStorage key-value hydration",
    apis: "Browser Web Share API, Web Vibration API for timers",
    services: [],
    integrations: [],
    infra: "Static storage hosting (Cloud Run static files or CDN edge routers)",
    devops: "Vite production compilation pipelines with bundle size controls"
  },
  data_models: {
    entities: [
      "Exercise: { id, name, category (Strength/Cardio/Bodyweight), base_xp }",
      "Routine: { id, title, description, exercises: Array<{ exercise_id, default_sets, default_reps, default_weight }> }",
      "WorkoutSession: { id, routine_id, start_time, end_time, completed_sets: Array<{ exercise_id, set_index, weight, reps, completed }> }",
      "UserProfile: { xp, level, streak_count, last_completed_date }"
    ],
    schemas: [
      "interface ExerciseRecord { id: string; name: string; sets: { reps: number; weight: number; isCompleted: boolean }[]; }"
    ]
  },
  user_experience: {
    design_style: "Contemporary minimalist dark mode (deep charcoal base #121212 with warm yellow & orange energetic accents)",
    layout_system: "Mobile-first full height app frame with structural bottom navigation",
    navigation_structure: "Persistent Bottom Action Rail (Dashboard, Active Session, Templates, Stats)",
    component_list: [
      "TimerCountdownCircle",
      "ExerciseCardGrid",
      "StreakSparklesHeader",
      "XPProgressBarIndicator",
      "PersonalRecordBadge"
    ],
    interaction_states: [
      "Loading overlay with pulsing workout bench SVG skeleton state",
      "Active set row tapping transitions to golden success status",
      "Empty state with illustrated running shoes and action button to 'Start Fresh Session'"
    ],
    user_flows: [
      "Open App -> Tap 'Templates' -> Choose 'Push A Routine' -> Tap 'Start' -> Tick off sets with rest timers triggering -> Tap 'Finish' -> XP Level Card animation overlays -> Returns Home with streak updated."
    ],
    animations: "Smooth spring-driven entrance fades (motion/react), scale bump feedback triggers for checkmarks, and height transitions in accordion exercises",
    accessibility: "High-contrast text compliant with WCAG AAA recommendations, responsive scale adaptation, and full screen reader helper states"
  },
  security_reliability: {
    authentication: "None (Client-side guest tier with persistence cached in device isolation)",
    authorization: "Fully client-authorized local sandbox permissions",
    data_validation: "JSON schema verification bounds for loaded template objects",
    rate_limiting: "None applicable for offline database execution",
    logging_monitoring: "Basic local console trace logging for active component render sequences",
    error_handling: "Safe recovery routines for corrupted localStorage objects using generic layout restore triggers",
    privacy: "Maximum compliance; no exercise logs or user details are dispatched to external infrastructure or trackers."
  },
  performance_constraints: {
    scalability: "Virtually infinite as no server-side scaling bottlenecks exist.",
    latency: "Immediate (sub-5ms) response on click interaction due to fully local execution pipeline.",
    load_expectations: "App bundle keeps size under 150KB gzip to ensure load under 1.2s on standard 3G devices.",
    resource_constraints: "Low RAM footprint targets, optimization for low battery consumption with capped visual effects"
  },
  edge_cases: [
    "User leaves active session in background for 6+ hours (auto-save and mark as incomplete check)",
    "Battery Saver mode blocks vibration API or dampens ticking speed timers",
    "Local Storage quota exceeded - requires active warning card prompt to purge old routines"
  ],
  developer_notes: [
    "Verify timer loop performance using requestAnimationFrame to prevent lagging count metrics.",
    "Utilize SVGs for charts dynamically to bypass full visual plotting dependencies.",
    "Place state actions behind custom hooks (e.g. useWorkoutSession) to isolate rendering cycles."
  ],
  final_prompt: "Write a React single-page workout tracker and achievement PWA. The layout should be mobile-first with a Bottom Navigation containing Dashboard, Active Session, and Templates. The design must use deep charcoal background with electric amber #F59E0B accents. Include an active session page where users tick off sets, a resting countdown timer utilizing window.navigator.vibrate, and an XP progression system where completing workouts boosts Level and XP. Everything must persist in localStorage cleanly."
};

export const MOCK_BLUEPRINT_DASHBOARD: PromptBlueprint = {
  schema_version: BLUEPRINT_OUTPUT_CONTRACT.schema_version,
  title: "AeroBoard: Fleet Operations Management & Telemetry Dashboard",
  summary: "A dense, high-performance tracking console for municipal drone delivery fleets. Synthesizes nested spatial data, active battery levels, and telemetry events into actionable grid alerts.",
  intent_classification: {
    request_type: "feature_addition",
    confidence: "high",
    detected_domain: "Transportation, Logistics & Telemetry Systems"
  },
  problem_clarification: {
    expanded_description: "The request specifies adding a rich telemetry dashboard to monitor operations. The core issue of target operators is high cognitive load, demanding simple grids, color-coded criticality levels, and clear actions for alerts.",
    core_objectives: [
      "Surface system alerts requiring pilot/operator override immediately without scrolling",
      "Display real-time sparklines of key drone diagnostics (Battery%, Speed, Distance to Base)",
      "Provide custom filter options by geographic sector and battery status"
    ],
    primary_users: [
      "Fleet Coordinator who needs high-frequency updates on status",
      "On-duty Maintenance Tech checking batteries before automated departure"
    ],
    assumptions: [
      {
        "id": "A1",
        "text": "The client consumes a real-time WebSocket protocol supplying standard telemetry payloads.",
        "confidence": "high",
        "source": "inferred_from_context"
      }
    ],
    constraints: [
      "Dashboard must accommodate dense tabular layouts without squishing columns on medium screens",
      "Colors matching status must maintain safe visibility for red/green color-blind users"
    ]
  },
  functional_requirements: {
    must_have: [
      "High-density stats panels with diagnostic trends for fleet status",
      "Interactive fleet alerts grid categorized by Alert Severity (Critical, Warning, Info)",
      "Single-click 'Recall' and 'Reroute' action buttons on active indicators",
      "Text filters and status quick-pills (All, Charging, En-Route, Interrupted, Idle)"
    ],
    should_have: [
      "Dynamic search input with autocompletion and instantaneous results updating the rows",
      "Status telemetry counters depicting active uptime counts"
    ],
    could_have: [
      "Animated canvas route visualization simulating flight movements or geographic coordinates",
      "Daily flight reports exports in JSON format"
    ],
    wont_have: [
      "Live remote control feeds of drone camera streams",
      "Complex weather mapping radars layered directly inside the grid"
    ]
  },
  architecture: {
    paradigm: "Modern full-screen administrative dashboard system",
    frontend: "React, Vite, Tailwind CSS, Recharts for metric graphs, Lucide Icons",
    backend: "None requested in this phase (Client telemetry simulation layer)",
    database: "React Context for in-memory temporary cache structures",
    apis: "Mock event generator publishing telemetry payloads every 2 seconds",
    services: [],
    integrations: [],
    infra: "Responsive administrative panel",
    devops: "Vite dev compilation pipeline"
  },
  data_models: {
    entities: [
      "DroneStatus: { drone_id, name, status_type, battery_percentage, lat, lng, alert_count }",
      "OperationalAlert: { alert_id, drone_id, description, severity, timestamp }"
    ],
    schemas: [
      "type AlertSeverity = 'critical' | 'warning' | 'info';"
    ]
  },
  user_experience: {
    design_style: "Tech-oriented high-density UI. Dark cyber-blue background with hyper-saturated status indicators (cyan for safe, emerald for active, lemon-orange for warnings, magenta-crimson for critical alerts)",
    layout_system: "Three-column grid dashboard with sticky diagnostic header metrics",
    navigation_structure: "Horizontal header action bars and collateral filter toggle panels",
    component_list: [
      "MetricsPillCluster",
      "DronesTelemetryTable",
      "CommandOverrideModal",
      "BatteryCriticalityGauge"
    ],
    interaction_states: [
      "Critical row selection has a solid alert glow with high visibility",
      "Action triggers blink momentarily to confirm dispatch command before reverting"
    ],
    user_flows: [
      "Alert flashes -> Operator clicks alert line -> Interactive actions panel appears on side -> Commands 'Recall to Base' -> Telemetry line status updates."
    ],
    animations: "Compact slide-downs for active alerts, flashing ring animations on critical issues",
    accessibility: "High-contrast visual accessibility configurations, keyboard grid navigational shortcuts"
  },
  security_reliability: {
    authentication: "Unsecured dashboard viewport (relies on container access logic)",
    authorization: "Operator or Supervisor role mapping (mocked)",
    data_validation: "Strict checking of alert schemas to prevent syntax errors from breaking dashboard panels",
    rate_limiting: "Payload throttling to maximum 10 active telemetry frames/sec",
    logging_monitoring: "Local operational metrics tracing",
    error_handling: "Connection loss placeholder alerts prompting 'Reconnecting' within 10 seconds",
    privacy: "No personal operator identifiers are shared with clients."
  },
  performance_constraints: {
    scalability: "Responsive for up to 100 concurrent mock drones rendered on UI grids",
    latency: "Under 16ms render refresh target to avoid frame drops",
    load_expectations: "Instant hydration and viewability",
    resource_constraints: "Optimized component re-rendering using React.memo to ensure buttery grid execution"
  },
  edge_cases: [
    "Simultaneous critical alerts from multiple assets",
    "Stale telemetry frames occurring due to simulated network latency jitter"
  ],
  developer_notes: [
    "Wrap row elements to prevent horizontal overflow on smaller screens.",
    "Utilize CSS grid layouts for modularity of panels.",
    "Implement mock drone data generation via a hook with custom setInterval loops."
  ],
  final_prompt: "Build an asset operational telemetry dashboard using React and Tailwind. The header of the dashboard should feature key metric aggregates (Total Assets, Operational, Alerts, Charging). Create a high-density table displaying critical delivery assets including battery status sparklines and status badges (Charging, Idle, Flying, Critical). Provide rapid action triggers such as 'Recall' which visualizes state upgrades directly. Maintain high density, tech-forward style."
};


export const MOCK_MALFORMED_BLUEPRINT: any = {
  schema_version: "0.9", // Error: must be '1.0'
  title: "", // Error: must not be empty
  summary: "A malformed blueprint example that will trigger multiple schema validation errors.",
  intent_classification: {
    request_type: "invalid_type", // Error: invalid value
    confidence: "none", // Error: invalid value
    detected_domain: null // Error: must be string
  },
  problem_clarification: {
    expanded_description: "Missing properties below on purpose.",
    // core_objectives, primary_users, constraints, assumptions missing - will trigger errors
  },
  functional_requirements: {
    must_have: "Not an array", // Error: must be array
    should_have: [],
    could_have: [],
    wont_have: []
  },
  architecture: {
    // Missing paradigm, frontend, backend etc.
  },
  data_models: {
    entities: [],
    schemas: []
  },
  user_experience: {
    design_style: 123, // Error: must be string
    layout_system: "Grid",
    navigation_structure: "Sidebar",
    component_list: [],
    interaction_states: [],
    user_flows: [],
    animations: "Smooth",
    accessibility: "High"
  },
  security_reliability: {
    authentication: "",
  },
  performance_constraints: {
    scalability: ""
  },
  edge_cases: "Not an array", // Error: must be array
  developer_notes: [],
  final_prompt: "" // Error: must not be empty
};

export const generateBlueprintForPrompt = (prompt: string, context?: string): PromptBlueprint => {
  const normalized = prompt.toLowerCase();
  
  if (normalized.includes('workout') || normalized.includes('exercise') || normalized.includes('track')) {
    return {
      ...MOCK_BLUEPRINT_WORKOUTS,
      title: context ? `FitQuest Custom: ${MOCK_BLUEPRINT_WORKOUTS.title}` : MOCK_BLUEPRINT_WORKOUTS.title
    };
  }

  if (normalized.includes('dash') || normalized.includes('board') || normalized.includes('chart') || normalized.includes('stats')) {
    return {
      ...MOCK_BLUEPRINT_DASHBOARD,
      title: context ? `AeroBoard Custom: ${MOCK_BLUEPRINT_DASHBOARD.title}` : MOCK_BLUEPRINT_DASHBOARD.title
    };
  }

  // Fallback beautiful template customized based on their prompt
  const fallbackTitle = `Custom Refinery Draft: ${prompt.slice(0, 35)}${prompt.length > 35 ? '...' : ''}`;
  
  return {
    schema_version: BLUEPRINT_OUTPUT_CONTRACT.schema_version,
    title: fallbackTitle,
    summary: `A customized solution tailored to refine the request: "${prompt}". Synthesizes layout boundaries, structural paradigms, and user expectations into high-value engineering prompts.`,
    intent_classification: {
      request_type: "new_build",
      confidence: "medium",
      detected_domain: "General Application Engineering"
    },
    problem_clarification: {
      expanded_description: `Evaluating the initial requirements for: "${prompt}". Core goals include organizing structural components into a balanced architecture.`,
      core_objectives: [
        `Deliver on the primary request: "${prompt}"`,
        "Provide a polished, responsive component system with zero initial bloat",
        "Introduce clean custom visual layouts aligning with user expectations"
      ],
      primary_users: [
        "End-users of custom modern web utilities",
        "Full-stack developers implementing clean boilerplate starts"
      ],
      assumptions: [
        {
          "id": "A1",
          "text": "The implementation prefers a fully modern browser workflow with modular component dependencies.",
          "confidence": "high",
          "source": "industry_default"
        },
        {
          "id": "A2",
          "text": context ? `Custom design relies on specified context: "${context}"` : "The applet operates as a responsive web-app without external legacy databases.",
          "confidence": "high",
          "source": context ? "explicit" : "inferred_from_context"
        }
      ],
      constraints: [
        "Render optimally on mobile-first and desktop-proportional dimensions",
        "Use clean design pairings with Inter display structures"
      ]
    },
    functional_requirements: {
      must_have: [
        "Interactive dashboard interface featuring user controls",
        "Robust state managers supporting modern React hook patterns",
        "Complete accessibility labels and friendly empty state placeholders"
      ],
      should_have: [
        "Smooth page transition fades and button triggers",
        "Data persistence for active configurations"
      ],
      could_have: [
        "Analytical overview statistics or exportable layouts",
        "Dark mode adaptation with tailored theme variables"
      ],
      wont_have: [
        "Custom desktop native launchers or standalone apps",
        "Automatic background cloud syncing without prior consent"
      ]
    },
    architecture: {
      paradigm: "Single Page Application (SPA)",
      frontend: "React 19, TypeScript, Tailwind CSS v4, Lucide Icons",
      backend: "None (Client-side execution template)",
      database: "Browser localStorage with automatic serialization",
      apis: "JSON/REST placeholder structures",
      services: [],
      integrations: [],
      infra: "Vite deployment configurations",
      devops: "Standard continuous linting and verification tasks"
    },
    data_models: {
      entities: [
        "DataRecord: { id, createdAt, title, dataPayload }",
        "AppSettings: { theme, isPersistent, version }"
      ],
      schemas: [
        "interface AppState { records: DataRecord[]; settings: AppSettings; }"
      ]
    },
    user_experience: {
      design_style: "Modern minimalist slate theme, high physical contrast spacing, sleek cards",
      layout_system: "Responsive flex and grid sections adapting cleanly across breakpoints",
      navigation_structure: "Header navigation with dynamic status modules",
      component_list: [
        "AppShell",
        "InteractiveInputForm",
        "InformationTabsContainer",
        "DetailsAccordion",
        "FeedbackBannerToast"
      ],
      interaction_states: [
        "Button hovering displays responsive transitions",
        "State inputs show bright outline focus rings"
      ],
      user_flows: [
        "Open applet view -> Input initial dataset -> Press process CTA -> Output renders with instant success alerts."
      ],
      animations: "Subtle spring entries (motion/react) and interactive state transitions",
      accessibility: "Fully compliant AAA contrast ratings, custom focus-rings, scale adaptability"
    },
    security_reliability: {
      authentication: "None (Fully client-administered layout)",
      authorization: "None requested",
      data_validation: "Strict checking of user variables prior to parsing operations",
      rate_limiting: "None required in browser-only scopes",
      logging_monitoring: "Standard web console logs tracing states",
      error_handling: "Beautiful visual fallback page with clear descriptive errors",
      privacy: "Local sandboxing protects operator privacy fully."
    },
    performance_constraints: {
      scalability: "Infinite scalability due to serverless structure",
      latency: "Local response under 10ms",
      load_expectations: "Lightweight script bundles load within 1s",
      resource_constraints: "Optimized for minimal CPU and battery impact"
    },
    edge_cases: [
      "User supplies complex unicode characters in text areas",
      "Empty prompt input submission gets caught with responsive validation prompts"
    ],
    developer_notes: [
      "Verify components are kept modular to prevent bundle bloating.",
      "Utilize native React state selectors for speed."
    ],
    final_prompt: `Create a clean React + Tailwind SPA based on: "${prompt}". Implement a sleek design using a slate grey theme with indigo highlights. Organize features inside a responsive single-page container. Ensure state hooks handle user inputs beautifully and data is rendered on structured, readable cards with polished spacing.`
  };
};
