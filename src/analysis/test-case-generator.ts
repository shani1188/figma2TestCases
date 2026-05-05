import { sendMessage } from './anthropic-client';
import { TEST_GENERATION_SYSTEM, buildTestGenerationPrompt } from './prompts/test-generation';
import { TestSuiteSchema, type ScreenAnalysis, type TestSuite } from '../types';
import { extractJson } from '../utils/extract-json';
import { config } from '../config';

const VALID_CATEGORIES = ['functional','validation','negative','edge','a11y','responsive','usability'] as const;
const VALID_PRIORITIES  = ['P0','P1','P2'] as const;

function normalizeTestSuite(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const o = raw as Record<string, unknown>;
  return { testCases: Array.isArray(o.testCases) ? o.testCases.map(normalizeTestCase) : [] };
}

function normalizeTestCase(tc: unknown): unknown {
  if (typeof tc !== 'object' || tc === null) return {};
  const o = tc as Record<string, unknown>;
  const cat = String(o.category ?? 'functional').toLowerCase().trim();
  const pri = String(o.priority  ?? 'P2').toUpperCase().trim();
  return {
    id:                  String(o.id ?? `tc_${Math.random().toString(36).slice(2, 7)}`),
    title:               String(o.title ?? ''),
    category:            (VALID_CATEGORIES as readonly string[]).includes(cat) ? cat : 'functional',
    priority:            (VALID_PRIORITIES  as readonly string[]).includes(pri) ? pri : 'P2',
    relatedComponentIds: Array.isArray(o.relatedComponentIds) ? o.relatedComponentIds.map(String) : [],
    preconditions:       Array.isArray(o.preconditions) ? o.preconditions.map(String) : [],
    steps:               Array.isArray(o.steps) ? o.steps.map(normalizeStep) : [],
    testData:            typeof o.testData === 'object' && o.testData !== null ? o.testData as Record<string,string> : undefined,
    tags:                Array.isArray(o.tags) ? o.tags.map(String) : [],
  };
}

function normalizeStep(s: unknown): unknown {
  if (typeof s !== 'object' || s === null) return { action: String(s), expected: '' };
  const o = s as Record<string, unknown>;
  return { action: String(o.action ?? ''), expected: String(o.expected ?? '') };
}

export async function generateTestCases(analysis: ScreenAnalysis): Promise<TestSuite> {
  let lastRaw = '';
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const basePrompt = buildTestGenerationPrompt(analysis);
    const userText = lastRaw
      ? `Your previous response could not be parsed. Fix it to match the schema exactly.\n\nPrevious response:\n${lastRaw}\n\n${basePrompt}`
      : basePrompt;

    const raw = await sendMessage({
      system: TEST_GENERATION_SYSTEM,
      userText,
      model: config.OLLAMA_TEXT_MODEL,
      maxTokens: 8192,
    });

    lastRaw = raw;

    try {
      const parsed = JSON.parse(extractJson(raw));
      return TestSuiteSchema.parse(normalizeTestSuite(parsed));
    } catch {
      if (attempt >= maxAttempts) {
        throw new Error(`Test case generation failed after ${maxAttempts} attempts — ${config.OLLAMA_TEXT_MODEL} returned invalid JSON`);
      }
    }
  }

  throw new Error('Test case generation failed');
}
