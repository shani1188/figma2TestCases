import { z } from 'zod';

export const ComponentSchema = z.object({
  id: z.string(),
  type: z.enum(['button', 'input', 'dropdown', 'checkbox', 'radio', 'link', 'image', 'text', 'nav', 'modal', 'form', 'table', 'card', 'other']),
  label: z.string(),
  states: z.array(z.enum(['default', 'hover', 'disabled', 'error', 'loading'])).optional(),
  validationHints: z.array(z.string()).optional(),
  interactions: z.array(z.string()).optional(),
});

export const ScreenAnalysisSchema = z.object({
  screenName: z.string(),
  screenPurpose: z.string(),
  components: z.array(ComponentSchema),
  userFlows: z.array(z.object({
    name: z.string(),
    steps: z.array(z.string()),
  })),
  accessibilityConcerns: z.array(z.string()),
});

export const TestStepSchema = z.object({
  action: z.string(),
  expected: z.string(),
});

export const TestCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['functional', 'validation', 'negative', 'edge', 'a11y', 'responsive', 'usability']),
  priority: z.enum(['P0', 'P1', 'P2']),
  relatedComponentIds: z.array(z.string()),
  preconditions: z.array(z.string()),
  steps: z.array(TestStepSchema),
  testData: z.record(z.string()).optional(),
  tags: z.array(z.string()),
});

export const TestSuiteSchema = z.object({
  testCases: z.array(TestCaseSchema),
});

export type Component = z.infer<typeof ComponentSchema>;
export type ScreenAnalysis = z.infer<typeof ScreenAnalysisSchema>;
export type TestStep = z.infer<typeof TestStepSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type TestSuite = z.infer<typeof TestSuiteSchema>;

export type ResolvedInput = {
  source: 'image';
  imageBase64: string;
  imageMimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  sourceRef: string;
};

export type AnalysisResult = {
  runId: string;
  sourceRef: string;
  screenAnalysis: ScreenAnalysis;
  testSuite: TestSuite;
  generatedAt: string; // ISO 8601
};
