import { sendMessage } from './anthropic-client';
import { buildComponentDetectionPrompt } from './prompts/component-detection';
import { ScreenAnalysisSchema, type ScreenAnalysis, type ResolvedInput } from '../types';
import { extractJson } from '../utils/extract-json';
import { config } from '../config';

const VALID_TYPES  = ['button','input','dropdown','checkbox','radio','link','image','text','nav','modal','form','table','card','other'] as const;
const VALID_STATES = ['default','hover','disabled','error','loading'] as const;

function normalizeAnalysis(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const o = raw as Record<string, unknown>;
  return {
    screenName:             String(o.screenName ?? 'Unknown Screen'),
    screenPurpose:          String(o.screenPurpose ?? ''),
    components:             Array.isArray(o.components) ? o.components.map(normalizeComponent) : [],
    userFlows:              Array.isArray(o.userFlows)  ? o.userFlows.map(normalizeFlow)       : [],
    accessibilityConcerns:  Array.isArray(o.accessibilityConcerns) ? o.accessibilityConcerns.map(String) : [],
  };
}

function normalizeComponent(c: unknown): unknown {
  if (typeof c !== 'object' || c === null) return {};
  const o = c as Record<string, unknown>;
  const rawType = String(o.type ?? 'other').toLowerCase().trim();
  const type = (VALID_TYPES as readonly string[]).includes(rawType) ? rawType : 'other';
  const states = Array.isArray(o.states)
    ? o.states.map((s: unknown) => String(s).toLowerCase().trim()).filter(s => (VALID_STATES as readonly string[]).includes(s))
    : ['default'];
  return {
    id:               String(o.id ?? `comp_${Math.random().toString(36).slice(2, 7)}`),
    type,
    label:            String(o.label ?? ''),
    states:           states.length ? states : ['default'],
    validationHints:  Array.isArray(o.validationHints) ? o.validationHints.map(String) : [],
    interactions:     Array.isArray(o.interactions)    ? o.interactions.map(String)    : [],
  };
}

function normalizeFlow(f: unknown): unknown {
  if (typeof f !== 'object' || f === null) return {};
  const o = f as Record<string, unknown>;
  return {
    name:  String(o.name ?? ''),
    steps: Array.isArray(o.steps) ? o.steps.map(String) : [],
  };
}

const JSON_SYSTEM = `You are a JSON formatter. Convert the UI description into the exact JSON schema requested. Output raw JSON only — no markdown, no explanation.`;

export async function analyzeComponents(input: ResolvedInput): Promise<ScreenAnalysis> {
  // Phase 1: vision model describes the UI in plain text.
  // System prompt is embedded in user message because small vision models (moondream)
  // often ignore a separate system role message.
  const description = await sendMessage({
    system: '',
    userText: 'You are a UI analyst. Look carefully at this screenshot and describe ONLY what you actually see. List every visible UI element: buttons, inputs, text labels, navigation items, forms, images, icons, and layout. Be specific about the actual content — do NOT assume or invent elements that are not visible.',
    imageBase64: input.imageBase64,
    imageMimeType: input.imageMimeType,
    model: config.OLLAMA_MODEL,
    maxTokens: 1024,
  });

  console.log('\n--- Moondream description ---\n', description, '\n----------------------------\n');

  // Phase 2: text model converts description to structured JSON
  let lastRaw = '';
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const basePrompt = `UI Description:\n${description}\n\n${buildComponentDetectionPrompt()}`;
    const userText = lastRaw
      ? `Your previous response could not be parsed as valid JSON. Fix it — raw JSON only, no markdown.\n\nPrevious response:\n${lastRaw}\n\n${basePrompt}`
      : basePrompt;

    const raw = await sendMessage({
      system: JSON_SYSTEM,
      userText,
      model: config.OLLAMA_TEXT_MODEL,
      maxTokens: 4096,
    });

    lastRaw = raw;

    try {
      const parsed = JSON.parse(extractJson(raw));
      return ScreenAnalysisSchema.parse(normalizeAnalysis(parsed));
    } catch {
      if (attempt >= maxAttempts) {
        throw new Error(`Component analysis failed after ${maxAttempts} attempts — ${config.OLLAMA_TEXT_MODEL} returned invalid JSON`);
      }
    }
  }

  throw new Error('Component analysis failed');
}
