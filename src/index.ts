import { resolveInput } from './inputs/input-resolver';
import { analyzeComponents } from './analysis/component-analyzer';
import { generateTestCases } from './analysis/test-case-generator';
import { writeOutputs } from './output/writer';
import { generateRunId } from './utils/run-id';
import type { AnalysisResult } from './types';

export type { AnalysisResult, ScreenAnalysis, TestSuite, TestCase } from './types';

export async function generateFromImage(
  imagePath: string,
  outDir = 'output',
): Promise<{ result: AnalysisResult; outputDir: string }> {
  const runId = generateRunId();
  const input = await resolveInput(imagePath);
  const screenAnalysis = await analyzeComponents(input);
  const testSuite = await generateTestCases(screenAnalysis);

  const result: AnalysisResult = {
    runId,
    sourceRef: input.sourceRef,
    screenAnalysis,
    testSuite,
    generatedAt: new Date().toISOString(),
  };

  const outputDir = await writeOutputs(result, outDir);
  return { result, outputDir };
}
