export const COMPONENT_DETECTION_SYSTEM = `You are a senior QA engineer and UX analyst. Analyze UI screenshots and identify all interactive components, states, and user flows.

Respond with valid JSON ONLY — no markdown, no explanation, just the raw JSON object.`;

export function buildComponentDetectionPrompt(): string {
  return `Analyze this UI screenshot and identify all components, states, and user flows.

Respond with a JSON object matching this EXACT schema (no extra keys):

{
  "screenName": "short name, e.g. 'Login Page'",
  "screenPurpose": "1-2 sentence description of what this screen does",
  "components": [
    {
      "id": "snake_case_slug",
      "type": "one of: button|input|dropdown|checkbox|radio|link|image|text|nav|modal|form|table|card|other",
      "label": "visible text or aria-label",
      "states": ["array of: default|hover|disabled|error|loading"],
      "validationHints": ["e.g. 'required', 'email format', 'min 8 chars'"],
      "interactions": ["e.g. 'submits form', 'opens modal', 'navigates to dashboard'"]
    }
  ],
  "userFlows": [
    {
      "name": "e.g. 'Successful Login'",
      "steps": ["ordered step descriptions"]
    }
  ],
  "accessibilityConcerns": ["potential a11y issues visible in the design"]
}

Be thorough — include ALL visible interactive elements, inputs, buttons, and navigation items.`;
}
