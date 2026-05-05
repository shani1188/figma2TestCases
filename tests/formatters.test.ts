import { describe, it, expect } from 'vitest';
import { formatMarkdown } from '../src/output/formatters/markdown';
import { formatPlaywright } from '../src/output/formatters/playwright';
import type { AnalysisResult } from '../src/types';

const mockResult: AnalysisResult = {
  runId: 'test-run-001',
  sourceRef: 'tests/fixtures/sample.png',
  generatedAt: '2026-04-25T00:00:00.000Z',
  screenAnalysis: {
    screenName: 'Login Page',
    screenPurpose: 'Allows users to sign in to their account with email and password.',
    components: [
      {
        id: 'email_input',
        type: 'input',
        label: 'Email',
        states: ['default', 'error'],
        validationHints: ['required', 'email format'],
        interactions: ['validates on blur'],
      },
      {
        id: 'sign_in_button',
        type: 'button',
        label: 'Sign In',
        states: ['default', 'loading', 'disabled'],
        interactions: ['submits form'],
      },
    ],
    userFlows: [
      {
        name: 'Successful Login',
        steps: ['Enter valid email', 'Enter valid password', 'Click Sign In', 'Redirected to dashboard'],
      },
    ],
    accessibilityConcerns: ['Error messages should be announced by screen readers'],
  },
  testSuite: {
    testCases: [
      {
        id: 'TC-001',
        title: 'Successful login with valid credentials',
        category: 'functional',
        priority: 'P0',
        relatedComponentIds: ['email_input', 'sign_in_button'],
        preconditions: ['User is registered', 'User is on the login page'],
        steps: [
          { action: 'Enter a valid email address', expected: 'Email field shows the entered text' },
          { action: 'Enter a valid password', expected: 'Password is masked with dots' },
          { action: 'Click the Sign In button', expected: 'User is redirected to the dashboard' },
        ],
        testData: { email: 'jane.doe@example.com', password: 'SecurePass123!' },
        tags: ['smoke', 'regression'],
      },
      {
        id: 'TC-002',
        title: 'Login fails with invalid email format',
        category: 'validation',
        priority: 'P1',
        relatedComponentIds: ['email_input'],
        preconditions: ['User is on the login page'],
        steps: [
          { action: 'Enter an invalid email (e.g. "notanemail")', expected: 'Email field shows an error state' },
          { action: 'Click the Sign In button', expected: 'Inline error "Enter a valid email address" appears' },
        ],
        testData: { email: 'notanemail' },
        tags: ['validation', 'regression'],
      },
    ],
  },
};

describe('Markdown formatter', () => {
  it('includes the screen name in the heading', () => {
    expect(formatMarkdown(mockResult)).toContain('# Test Cases: Login Page');
  });

  it('includes all test case IDs and titles', () => {
    const md = formatMarkdown(mockResult);
    expect(md).toContain('TC-001');
    expect(md).toContain('Successful login with valid credentials');
    expect(md).toContain('TC-002');
  });

  it('includes priority and tags', () => {
    const md = formatMarkdown(mockResult);
    expect(md).toContain('P0');
    expect(md).toContain('smoke');
    expect(md).toContain('P1');
  });

  it('includes the component table', () => {
    const md = formatMarkdown(mockResult);
    expect(md).toContain('email_input');
    expect(md).toContain('sign_in_button');
  });

  it('includes test data', () => {
    expect(formatMarkdown(mockResult)).toContain('jane.doe@example.com');
  });
});

describe('Playwright formatter', () => {
  it('generates a valid TypeScript import', () => {
    expect(formatPlaywright(mockResult)).toContain("import { test, expect } from '@playwright/test'");
  });

  it('wraps everything in test.describe with the screen name', () => {
    expect(formatPlaywright(mockResult)).toContain("test.describe('Login Page'");
  });

  it('uses test.skip for all stubs', () => {
    const spec = formatPlaywright(mockResult);
    expect(spec).toContain('test.skip');
    expect(spec).not.toContain("\n  test('");
  });

  it('includes all test case IDs', () => {
    const spec = formatPlaywright(mockResult);
    expect(spec).toContain('TC-001');
    expect(spec).toContain('TC-002');
  });

  it('groups tests by category', () => {
    const spec = formatPlaywright(mockResult);
    expect(spec).toContain("test.describe('functional'");
    expect(spec).toContain("test.describe('validation'");
  });
});
