import chalk from 'chalk';

export const logger = {
  info: (msg: string) => console.log(chalk.blue('i'), msg),
  success: (msg: string) => console.log(chalk.green('v'), msg),
  warn: (msg: string) => console.log(chalk.yellow('!'), msg),
  error: (msg: string) => console.error(chalk.red('x'), msg),
  step: (msg: string) => console.log(chalk.cyan('>'), msg),
};
