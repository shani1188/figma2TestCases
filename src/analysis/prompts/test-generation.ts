import type { ScreenAnalysis } from '../../types';

export const TEST_GENERATION_SYSTEM = `You are a senior QA engineer. Generate comprehensive, actionable test cases from UI component analysis.

Respond with valid JSON ONLY — no markdown, no explanation, just the raw JSON object.`;

export function buildTestGenerationPrompt(analysis: ScreenAnalysis): string {
  return `Based on the following UI analysis, generate comprehensive test cases.

UI ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Generate test cases covering ALL of the following categories:
1. functional — happy path flows (P0)
2. validation — form field rules and constraints (P1)
3. negative — error states and invalid inputs (P1)
4. edge — boundary values and unusual inputs (P2)
5. a11y — accessibility requirements (P2)
6. usability — UX and user experience (P2)

Respond with a JSON object matching this EXACT schema:

{
  "testCases": [
    {
      "id": "TC-001",
      "title": "clear concise test title",
      "category": "one of: functional|validation|negative|edge|a11y|responsive|usability",
      "priority": "one of: P0|P1|P2",
      "relatedComponentIds": ["component ids from the analysis above"],
      "preconditions": ["list of preconditions"],
      "steps": [
        {
          "action": "what the user does",
          "expected": "what should happen"
        }
      ],
      "testData": { "fieldName": "realistic test value" },
      "tags": ["smoke", "regression", "accessibility"]
    }
  ]
}

Requirements:
- Generate at least 12 test cases
- Use realistic test data (real-looking emails, passwords, names)
- P0 tests must cover the primary happy path completely
- Include at least 2 a11y test cases
- Be specific in actions and expected results`;
}
