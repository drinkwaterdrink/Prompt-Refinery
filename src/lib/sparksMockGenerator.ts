/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SparkIdea } from '../types';

// Curated pool of high-quality preset ideas
const PRESET_IDEAS: SparkIdea[] = [
  {
    id: "preset_lorekeeper",
    title: "Pocket Lorekeeper",
    concept: "A mobile-first worldbuilding notebook that turns rough notes into structured lore entries and continuity prompts.",
    rawPrompt: "Build a mobile-first lore keeper sandbox that tracks worldbuilding projects, structures raw thoughts into markdown files, and warns about timeline continuity conflicts.",
    projectContext: "Must run entirely client-side using LocalStorage, render with Outfit typography, and support high-contrast responsive outline themes.",
    conversationHistory: [
      { id: "h1", role: "user", content: "I want to drag and drop character relationship nodes." },
      { id: "h2", role: "assistant", content: "I can map out a client-side SVG node connector system that saves positions in a local registry." }
    ],
    tags: ["creative", "writing", "PWA", "local-first"],
    difficulty: "medium",
    novelty: "unusual"
  },
  {
    id: "preset_growroom",
    title: "Grow Room Sentinel",
    concept: "A local-first dashboard for tracking plant zones, watering cycles, room notes, and issue alerts.",
    rawPrompt: "Create a Grow Room dashboard to track indoor plant environments, schedule nutrient watering routines, log daily notes, and trigger high-visibility alerts for sensor anomalies.",
    projectContext: "Build with a highly dense modern dark grid, utilizing gold/amber status signals, local-first state, and responsive card lists.",
    conversationHistory: [],
    tags: ["agriculture", "IoT-Simulator", "personal-tracking", "grow-ops"],
    difficulty: "quick",
    novelty: "practical"
  },
  {
    id: "preset_npcforge",
    title: "NPC Conflict Forge",
    concept: "A writing tool that generates relationship tension maps, scene catalysts, and character-specific conflict prompts.",
    rawPrompt: "Build a story writing toolkit that generates tension vectors between two NPCs, generates catalyst prompt overlays, and exports scene setup cards.",
    projectContext: "Responsive split panel design. Elegant warm HSL dark palette, smooth micro-interactions, and instant markdown text copying.",
    conversationHistory: [
      { id: "h3", role: "user", content: "Can it generate dialogue starters?" },
      { id: "h4", role: "assistant", content: "Yes, I will add a dynamic dialogue generator module pre-seeded with emotional cues." }
    ],
    tags: ["writing", "roleplay", "creativity", "storytelling"],
    difficulty: "medium",
    novelty: "unusual"
  },
  {
    id: "preset_habitrpg",
    title: "Offline Habit RPG",
    concept: "A PWA that turns daily habits into XP, streaks, character upgrades, and local-only progress tracking.",
    rawPrompt: "Design an offline-first habit builder structured as a retro RPG. Completing items grants XP, gold, and character avatar accessories, while failing deducts HP.",
    projectContext: "Retro pixel aesthetic or sleek glassmorphism. Must work entirely offline with service worker caching, and store user stats in LocalStorage.",
    conversationHistory: [],
    tags: ["PWA", "gamification", "personal-tracking", "local-first"],
    difficulty: "quick",
    novelty: "practical"
  },
  {
    id: "preset_promptdiff",
    title: "Prompt Diff Inspector",
    concept: "A developer utility that compares two prompts and explains changes in behavior, risk, structure, and expected output.",
    rawPrompt: "Build a visual prompt comparator that performs a line-by-line diff, highlights structural deletions or additions, and audits safety risk levels.",
    projectContext: "Sleek split screen view, custom diff highlighter, Outfit font, and local-first memory logs.",
    conversationHistory: [
      { id: "h5", role: "user", content: "Make sure it highlights API key leakage risk." },
      { id: "h6", role: "assistant", content: "I will add a regex scanner that flags common key headers as high risk." }
    ],
    tags: ["developer-tools", "prompts", "utility"],
    difficulty: "ambitious",
    novelty: "practical"
  },
  {
    id: "preset_audionest",
    title: "Decentralized Audio Nest",
    concept: "A peer-to-peer browser tool that allows multiple local users to generate synchronous, collaborative ambient soundscapes.",
    rawPrompt: "Build an audio sandbox using Web Audio API that renders interactive frequency nodes. Moving nodes modifies tone and coordinates ambient visualizer waves.",
    projectContext: "Zero server connection. Spatial component layouts, smooth motion loops, and prefers-reduced-motion compatibility.",
    conversationHistory: [],
    tags: ["weird-experimental", "audio", "creative"],
    difficulty: "ambitious",
    novelty: "unusual"
  },
  {
    id: "preset_plantsinger",
    title: "Zero-UI Plant Singer",
    concept: "A screenless ambient sound generator that translates grow room humidity and watering logs into voice/audio waves.",
    rawPrompt: "Build an offline grow dashboard that maps soil metrics to ambient synth oscillators, reading data purely through browser audio streams and spatial voice readouts.",
    projectContext: "Zero-UI/screenless focus. Restrained micro-animations, optimized local synthesis, and mobile-first responsive layout.",
    conversationHistory: [
      { id: "h7", role: "user", content: "Can it speak the alerts aloud?" },
      { id: "h8", role: "assistant", content: "Yes, I will integrate the SpeechSynthesis API to speak telemetry anomalies aloud." }
    ],
    tags: ["ambient", "weird", "black-swan", "audio"],
    difficulty: "ambitious",
    novelty: "black-swan",
    catalystProblem: "Visual dashboard fatigue in active grow rooms where hands-free physical audio checks are preferred.",
    corePillars: ["Audio synthesis", "Local telemetry mapping", "Voice Synthesis API"],
    whyNow: "Growing developer focus on hands-free workspace automation and accessible ambient feedback."
  }
];

// Curated mix-and-match generation arrays
const DOMAINS = ["Cannabis Grow", "Roleplay Writing", "Smart Home IoT", "Personal Health", "Financial Safety", "Developer Sandbox", "Audio Soundscapes", "Creative Sketching", "Decentralized Chat"];
const AUDIENCES = ["vibe coders", "grow room operators", "solo writers", "privacy advocates", "indie hackers", "retro gamers", "screen-free users"];
const CONSTRAINTS = ["deliberate friction", "zero-UI/screenless", "hyper-local/analog", "local-first/private", "ambient feedback", "ephemeral/asynchronous", "offline-first"];
const STYLES = ["sleek gold glassmorphism", "warm charcoal outline aesthetic", "high-density neon grids", "minimalist monospaced console", "retro warm ambient gradients"];
const MECHANISMS = ["XP reward multipliers", "spatial vector mapping", "local-first SQLite sync", "peer-to-peer node connections", "Web Audio API ambient synths", "interactive SVG tension nets"];
const TWISTS = ["warning alerts based on plant anomalies", "timeline continuity conflict warnings", "regex scanning for credential leaks", "automatic speech synthesis readout alerts"];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateLocalSparks(count: number = 3, novelty: 'practical' | 'unusual' | 'black-swan' = 'practical'): SparkIdea[] {
  // Filter presets matching requested novelty level
  const matchingPresets = PRESET_IDEAS.filter(x => x.novelty === novelty);
  
  // Assemble the output pool. We prioritize our high-quality presets
  const results: SparkIdea[] = [...matchingPresets];

  // If we need more, we dynamically generate unique mix-and-match ideas on the fly!
  while (results.length < count) {
    const domain = getRandomElement(DOMAINS);
    const audience = getRandomElement(AUDIENCES);
    const constraint = getRandomElement(CONSTRAINTS);
    const style = getRandomElement(STYLES);
    const mechanism = getRandomElement(MECHANISMS);
    const twist = getRandomElement(TWISTS);

    const titleId = Math.random().toString(36).substring(2, 6);
    const title = `${domain} Catalyst`;
    const concept = `A ${constraint} tool optimized for ${audience}, combining ${mechanism} with a ${style} layout.`;
    
    const rawPrompt = `Build a ${domain.toLowerCase()} sandbox supporting ${mechanism.toLowerCase()} and integrating ${twist.toLowerCase()}.`;
    const projectContext = `Must respect a ${constraint} design approach, rendering on a ${style} style sheet with strict client-only storage bounds.`;

    const dynamicIdea: SparkIdea = {
      id: `dynamic_${novelty}_${titleId}`,
      title,
      concept,
      rawPrompt,
      projectContext,
      conversationHistory: [
        { id: `dyn_h_${titleId}_1`, role: "user", content: `Can we support hotkeys for quick inputs?` },
        { id: `dyn_h_${titleId}_2`, role: "assistant", content: `Yes! I will configure custom local hotkey listeners that map inputs directly to state parameters.` }
      ],
      tags: [domain.split(' ')[0].toLowerCase(), constraint.split('/')[0].split('-')[0], "local-first"],
      difficulty: getRandomElement(["quick", "medium", "ambitious"]),
      novelty: novelty
    };

    if (novelty === 'black-swan') {
      dynamicIdea.catalystProblem = `User experience overload and dependency lock-in during critical ${domain.toLowerCase()} task executions.`;
      dynamicIdea.corePillars = [domain.split(' ')[0], mechanism.split(' ')[0], constraint.split('-')[0]];
      dynamicIdea.whyNow = `The shift toward localized client models allows high-security deep analysis without third-party network roundtrips.`;
    }

    results.push(dynamicIdea);
  }

  // Shuffle and return the requested count
  return results.sort(() => 0.5 - Math.random()).slice(0, count);
}
