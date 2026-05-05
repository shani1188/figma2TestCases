# Figma to Test Cases - Repository Guide

## Overview

**figma-to-test-cases** is a TypeScript-based tool that automatically generates comprehensive test cases from UI screenshots using AI-powered component analysis. It's designed to accelerate test case creation by analyzing visual designs and generating test suites in multiple formats.

### Core Purpose
- Convert UI screenshots (PNG, JPG, WebP) into structured test cases
- Automatically detect UI components and their interactions
- Generate test cases in multiple formats: Markdown, Excel, TypeScript Playwright specs, and JSON
- Powered by Anthropic's AI for intelligent component and user flow detection

---

## Project Structure

```
figma to test cases/
├── src/                          # Main source code
│   ├── cli.ts                   # CLI entry point (figma2tests command)
│   ├── index.ts                 # Main API export
│   ├── config.ts                # Environment configuration & validation
│   ├── types.ts                 # TypeScript type definitions & Zod schemas
│   ├── server.ts                # Express server for web UI
│   │
│   ├── analysis/                # AI analysis & test generation
│   │   ├── anthropic-client.ts  # Anthropic API integration
│   │   ├── component-analyzer.ts # Detects components from screenshots
│   │   ├── test-case-generator.ts # Generates test cases from analysis
│   │   └── prompts/
│   │       ├── component-detection.ts # Prompts for component analysis
│   │       └── test-generation.ts    # Prompts for test generation
│   │
│   ├── inputs/                  # Input handling
│   │   ├── input-resolver.ts    # Resolves and validates image inputs
│   │   └── image-loader.ts      # Loads and processes images
│   │
│   ├── output/                  # Output generation
│   │   ├── writer.ts            # Coordinates output file writing
│   │   └── formatters/
│   │       ├── markdown.ts      # Markdown test case output
│   │       ├── playwright.ts    # TypeScript Playwright test specs
│   │       └── spreadsheet.ts   # Excel spreadsheet output
│   │
│   └── utils/
│       ├── extract-json.ts      # Parses JSON from AI responses
│       ├── logger.ts            # Logging utilities
│       ├── retry.ts             # Retry logic for API calls
│       └── run-id.ts            # Unique run identifier generation
│
├── tests/                        # Test suite
│   ├── formatters.test.ts       # Tests for output formatters
│   └── fixtures/                # Test fixtures & sample data
│
├── output/                       # Generated outputs (timestamped directories)
│   ├── 2026-04-27T12-55-54.../  # Sample run output
│   ├── 2026-04-27T13-03-06.../  # Contains:
│   └── 2026-04-28T15-01-46.../  # - analysis.json
│                                # - test-cases.md
│                                # - tests.spec.ts
│
├── public/                       # Static assets for web UI
│   └── index.html
│
├── package.json                  # Project dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts             # Vitest testing configuration
└── .env                         # Environment variables (API keys, model config)
```

---

## How It Works

### Data Flow
```
UI Screenshot (PNG/JPG/WebP)
            ↓
    [Input Resolver]
            ↓
    Image → Base64 + MIME type
            ↓
    [Component Analyzer]
    (Anthropic API call)
            ↓
    Screen Analysis
    (components, flows, accessibility)
            ↓
    [Test Case Generator]
    (Anthropic API call)
            ↓
    Test Suite
    (test cases with steps, data, priority)
            ↓
    [Output Writer]
            ↓
    ┌─────────┬──────────┬────────────┬──────────┐
    ↓         ↓          ↓            ↓          ↓
  JSON     Markdown    Excel    Playwright  Run ID
```

---

## Key Types & Data Structures

### Component
```typescript
{
  id: string,
  type: 'button' | 'input' | 'dropdown' | ... (14 types),
  label: string,
  states?: ['default', 'hover', 'disabled', 'error', 'loading'],
  validationHints?: string[],
  interactions?: string[]
}
```

### Screen Analysis
```typescript
{
  screenName: string,
  screenPurpose: string,
  components: Component[],
  userFlows: {
    name: string,
    steps: string[]
  }[],
  accessibilityConcerns: string[]
}
```

### Test Case
```typescript
{
  id: string,
  title: string,
  category: 'functional' | 'validation' | 'negative' | 'edge' | 'a11y' | 'responsive' | 'usability',
  priority: 'P0' | 'P1' | 'P2',
  relatedComponentIds: string[],
  preconditions: string[],
  steps: {
    action: string,
    expected: string
  }[],
  testData?: Record<string, string>,
  tags: string[]
}
```

---

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- Anthropic API key (via `ANTHROPIC_API_KEY` environment variable)
- Image file (PNG, JPG, or WebP)

### Installation
```bash
npm install
npm run build
```

### Usage

#### CLI Mode
```bash
# Basic usage
npm run dev -- --image ./path/to/screenshot.png

# With output directory
npm run dev -- --image ./screenshot.png --out ./my-tests

# After building
figma2tests --image ./screenshot.png --out ./results
```

#### Programmatic API
```typescript
import { generateFromImage } from './src/index';

const { result, outputDir } = await generateFromImage('./screenshot.png', 'output');

console.log(result.screenAnalysis.components);
console.log(result.testSuite.testCases);
```

#### Server Mode
```bash
npm run server
# Starts Express server with file upload UI
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run CLI with tsx (no build required) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run server` | Start Express web server |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once |
| `npm run lint` | Type-check with TypeScript |

---

## Configuration

### Environment Variables (.env)
```env
ANTHROPIC_API_KEY=sk-ant-...    # Required: Anthropic API key
```

### Configuration Validation (src/config.ts)
- Uses Zod for schema validation
- Environment variables are validated on startup
- Provides helpful error messages for missing or invalid config

---

## Output Formats

### 1. **analysis.json**
Raw analysis output with detected components, user flows, and accessibility concerns.

### 2. **test-cases.md**
Human-readable markdown format listing all test cases with descriptions, steps, and expected results.

### 3. **tests.spec.ts**
Playwright test skeleton - TypeScript file with test structure ready for implementation.

### 4. **tests.xlsx** (Optional)
Excel spreadsheet with test cases organized in tabular format for stakeholder review.

---

## Key Modules

### 1. **Analysis Module** (`src/analysis/`)
**Responsibility**: AI-powered UI analysis

- **anthropic-client.ts**: Wrapper around Anthropic API
- **component-analyzer.ts**: 
  - Sends screenshot to Claude for component detection
  - Returns structured `ScreenAnalysis`
  - Normalizes and validates component data
  
- **test-case-generator.ts**:
  - Takes `ScreenAnalysis` and generates test cases
  - Creates categorized, prioritized test cases
  - Handles edge cases and accessibility testing

- **prompts/**: Contains system prompts and prompt builders
  - `component-detection.ts`: Prompt for component analysis
  - `test-generation.ts`: Prompt for test generation

### 2. **Input Module** (`src/inputs/`)
**Responsibility**: Image handling and resolution

- **input-resolver.ts**: 
  - Resolves file paths or URLs
  - Converts image to Base64
  - Validates image format (PNG, JPG, WebP)
  - Returns `ResolvedInput` object

- **image-loader.ts**: Low-level image loading utilities

### 3. **Output Module** (`src/output/`)
**Responsibility**: Multi-format output generation

- **writer.ts**: Orchestrates output file writing
  - Creates timestamped output directory
  - Coordinates all formatters
  - Saves analysis.json

- **formatters/**:
  - **markdown.ts**: Converts test suite to readable markdown
  - **playwright.ts**: Generates TypeScript Playwright test file
  - **spreadsheet.ts**: Generates Excel file using ExcelJS

### 4. **Utils** (`src/utils/`)
- **extract-json.ts**: Extracts valid JSON from AI responses (handles markdown wrappers)
- **logger.ts**: Unified logging interface
- **retry.ts**: Retry logic with exponential backoff for API calls
- **run-id.ts**: Generates unique run identifiers (ISO timestamp + random hash)

---

## Dependencies

### Core
- **commander**: CLI argument parsing
- **express**: Web server framework
- **multer**: File upload handling

### AI & APIs
- **anthropic**: Anthropic Claude API client

### Data & Validation
- **zod**: Schema validation and type inference
- **exceljs**: Excel file generation

### Utilities
- **sharp**: Image processing
- **chalk**: Terminal colors
- **ora**: Terminal spinners/progress
- **dotenv**: Environment variable loading

---

## Development Workflow

### Adding a New Output Format
1. Create `src/output/formatters/new-format.ts`
2. Export a function: `export function formatAsNewFormat(testSuite: TestSuite): string`
3. Update `src/output/writer.ts` to call your formatter
4. Add test in `tests/formatters.test.ts`

### Adding a New Component Type
1. Update `ComponentSchema` in `src/types.ts`
2. Update `VALID_TYPES` in `src/analysis/component-analyzer.ts`
3. Update component detection prompt in `src/analysis/prompts/component-detection.ts`

### Modifying AI Behavior
1. Edit prompt in `src/analysis/prompts/component-detection.ts` or `test-generation.ts`
2. Adjust normalization logic in `component-analyzer.ts` if needed
3. Test with `npm run test:run`

---

## Testing

- **Framework**: Vitest
- **Location**: `tests/` directory
- **Test Fixtures**: `tests/fixtures/`

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run specific test file
npm test -- formatters.test.ts
```

---

## Common Issues & Troubleshooting

### "ANTHROPIC_API_KEY not set"
**Solution**: Add `ANTHROPIC_API_KEY=your-key` to `.env` file

### "Invalid image format"
**Solution**: Ensure image is PNG, JPG, or WebP format

### "JSON parse error"
**Solution**: Check `src/utils/extract-json.ts` - may need to adjust JSON extraction regex

### AI generating incomplete test cases
**Solution**: Review and adjust prompts in `src/analysis/prompts/`

---

## Future Enhancements

- [ ] Support for Figma API direct integration (skip screenshot step)
- [ ] Batch processing multiple screenshots
- [ ] Custom test case templates
- [ ] Integration with test management platforms (TestRail, Zephyr)
- [ ] Machine learning model for component type detection
- [ ] Web UI improvements for file upload and results preview

---

## Project Status

**Version**: 0.1.0  
**Status**: Active Development  
**Last Updated**: May 2026

> ⚠️ **Note**: AI-generated test cases are stubs and require human review before production use. Use as a starting point to accelerate test creation, not as final deliverables.

