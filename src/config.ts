import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  OLLAMA_HOST: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('moondream'),
  OLLAMA_TEXT_MODEL: z.string().default('llama3.2:1b'),
});

const result = ConfigSchema.safeParse(process.env);

if (!result.success) {
  console.error('Configuration error:');
  result.error.issues.forEach(issue => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const config = result.data;
