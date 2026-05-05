#!/usr/bin/env node
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import { generateFromImage } from './index';

const program = new Command();

program
  .name('figma2tests')
  .description('Generate test cases from UI screenshots using Gemini AI')
  .version('0.1.0')
  .option('-i, --image <path>', 'Path to the UI screenshot (PNG, JPG, or WebP)')
  .option('-o, --out <dir>', 'Output directory', 'output')
  .action(async (options: { image?: string; out: string }) => {
    if (!options.image) {
      program.help();
      return;
    }

    const spinner = ora('Analyzing UI with Gemini...').start();

    try {
      const { result, outputDir } = await generateFromImage(options.image, options.out);

      spinner.succeed('Done!');

      console.log();
      console.log(chalk.bold('Results:'));
      console.log(`  Screen:              ${chalk.cyan(result.screenAnalysis.screenName)}`);
      console.log(`  Components detected: ${chalk.cyan(result.screenAnalysis.components.length)}`);
      console.log(`  Test cases:          ${chalk.cyan(result.testSuite.testCases.length)}`);
      console.log();
      console.log(chalk.bold('Output files:'));
      console.log(`  ${chalk.green('v')} ${path.join(outputDir, 'analysis.json')}`);
      console.log(`  ${chalk.green('v')} ${path.join(outputDir, 'test-cases.md')}`);
      console.log(`  ${chalk.green('v')} ${path.join(outputDir, 'test-cases.xlsx')}`);
      console.log(`  ${chalk.green('v')} ${path.join(outputDir, 'tests.spec.ts')}`);
      console.log();
      console.log(chalk.yellow('Note: AI-generated stubs — review before production use'));
    } catch (err) {
      spinner.fail('Generation failed');
      console.error(chalk.red((err as Error).message));
      process.exit(1);
    }
  });

program.parse();
